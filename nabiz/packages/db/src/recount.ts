import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const { votes, voteAggregates, abuseEvents } = schema;

export interface RecountResult {
  scanned: number;
  quarantined: number;
  quarantineHealth: 'ok' | 'low' | 'high' | 'unknown';
  rebuiltRows: number;
  burstFindings: number;
}

export interface RecountDeps {
  /** Küme analizi — saf fonksiyon olarak dışarıdan verilir (@nabiz/core). */
  detectBursts: (samples: Array<{ optionId: string; asn: number | null; minute: number; countedTrust: number }>) =>
    Array<{ asn: number; optionId: string; votes: number; share: number; minutesSpanned: number }>;
  quarantineHealth: (total: number, quarantined: number) => 'ok' | 'low' | 'high' | 'unknown';
  log?: (message: string) => void;
}

/**
 * Gece temizliği (docs/11 Katman 4).
 *
 * Tek bir yerde durur: hem komut satırından (`npm run recount`) hem zamanlanmış HTTP
 * uç noktasından aynı kod çalışır. İki kopya olsaydı biri düzeltilip diğeri unutulurdu
 * ve hangisinin çalıştığı ancak sonuçlar tutmadığında fark edilirdi.
 *
 * Oy SİLMEZ: işaretler ve agregaları ham oyların doğrusuna göre yeniden kurar.
 */
export async function runRecount(databaseUrl: string, deps: RecountDeps): Promise<RecountResult> {
  const client = postgres(databaseUrl, { max: 2, prepare: false });
  const db = drizzle(client);
  const log = deps.log ?? (() => {});

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db
      .select({
        pollId: votes.pollId, optionId: votes.optionId, asn: votes.asn,
        trustScore: votes.trustScore, isCounted: votes.isCounted, createdAt: votes.createdAt,
      })
      .from(votes)
      .where(sql`${votes.createdAt} >= ${since.toISOString()}::timestamptz`);

    const quarantined = recent.filter((v) => !v.isCounted).length;
    const health = deps.quarantineHealth(recent.length, quarantined);
    log(`Son 24 saat: ${recent.length} oy · karantina: ${quarantined} (${health})`);

    if (health === 'high' || health === 'low') {
      await db.insert(abuseEvents).values({
        kind: 'quarantine_rate_anomaly',
        detail: { total: recent.length, quarantined, health },
      });
    }

    // Küme analizi soru bazında yapılır: farklı sorulardaki oyları aynı havuzda
    // değerlendirmek payları anlamsızlaştırır.
    const byPoll = new Map<string, Array<{ optionId: string; asn: number | null; minute: number; countedTrust: number }>>();
    for (const vote of recent) {
      const bucket = byPoll.get(vote.pollId) ?? [];
      bucket.push({
        optionId: vote.optionId,
        asn: vote.asn,
        minute: Math.floor(vote.createdAt.getTime() / 60_000),
        countedTrust: vote.trustScore,
      });
      byPoll.set(vote.pollId, bucket);
    }

    let burstFindings = 0;
    for (const [pollId, samples] of byPoll) {
      for (const finding of deps.detectBursts(samples)) {
        burstFindings += 1;
        log(`⚠ Yığılma: poll=${pollId} asn=${finding.asn} oy=${finding.votes} pay=${finding.share}`);
        await db.insert(abuseEvents).values({
          kind: 'asn_burst', asn: finding.asn, pollId, detail: { ...finding },
        });
      }
    }

    // Agregaları ham oylardan yeniden kur: gün içinde artımlı güncellenen sayılar
    // burada otoriteye (votes tablosuna) göre düzeltilir.
    const rebuilt = await db.execute(sql`
      with truth as (
        select poll_id, option_id, 0::smallint as city_id, count(*)::bigint as n
          from ${votes} where is_counted group by poll_id, option_id
        union all
        select poll_id, option_id, city_id, count(*)::bigint as n
          from ${votes} where is_counted and city_id is not null group by poll_id, option_id, city_id
      )
      insert into ${voteAggregates} (poll_id, option_id, city_id, vote_count, updated_at)
      select poll_id, option_id, city_id, n, now() from truth
      on conflict (poll_id, option_id, city_id)
        do update set vote_count = excluded.vote_count, updated_at = now()
      returning poll_id
    `);

    log(`Agregalar yeniden kuruldu: ${rebuilt.length} satır`);

    return {
      scanned: recent.length,
      quarantined,
      quarantineHealth: health,
      rebuiltRows: rebuilt.length,
      burstFindings,
    };
  } finally {
    await client.end();
  }
}
