/**
 * Gece temizlik işi (docs/11 Katman 4).
 *
 * Yaptığı: son 24 saatin ham oylarını yeniden değerlendirir, küme anormalliklerini işaretler
 * ve `vote_aggregates` tablosunu `votes` tablosundaki `is_counted` durumuna göre yeniden kurar.
 *
 * Yapmadığı: kendi başına oy SİLMEZ. İşaretler, insan karar verir — gerçek bir kampanya da
 * bot desenine benzer ve gerçek oyları silmek, bot bırakmaktan daha ağır bir hatadır.
 *
 * Çalıştırma: `DATABASE_URL=... npx tsx infra/jobs/recount.ts`
 */
import { and, eq, gte, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { detectBursts, quarantineHealth, type VoteSample } from '@nabiz/core';
import { schema } from '@nabiz/db';

const { votes, voteAggregates, abuseEvents } = schema;

async function main(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL zorunlu');

  const db = drizzle(postgres(url, { max: 2, prepare: false }));
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await db
    .select({
      pollId: votes.pollId, optionId: votes.optionId, asn: votes.asn,
      trustScore: votes.trustScore, isCounted: votes.isCounted, createdAt: votes.createdAt,
    })
    .from(votes)
    .where(gte(votes.createdAt, since));

  console.log(`Son 24 saat: ${recent.length} oy`);

  const quarantined = recent.filter((v) => !v.isCounted).length;
  const health = quarantineHealth(recent.length, quarantined);
  console.log(`Karantina: ${quarantined} (${health})`);
  if (health === 'high' || health === 'low') {
    await db.insert(abuseEvents).values({
      kind: 'quarantine_rate_anomaly',
      detail: { total: recent.length, quarantined, health },
    });
  }

  // Küme analizi soru bazında yapılır: farklı sorulardaki oyları aynı havuzda değerlendirmek
  // payları anlamsızlaştırır.
  const byPoll = new Map<string, VoteSample[]>();
  for (const vote of recent) {
    const sample: VoteSample = {
      optionId: vote.optionId,
      asn: vote.asn,
      minute: Math.floor(vote.createdAt.getTime() / 60_000),
      countedTrust: vote.trustScore,
    };
    const bucket = byPoll.get(vote.pollId);
    if (bucket) bucket.push(sample);
    else byPoll.set(vote.pollId, [sample]);
  }

  for (const [pollId, samples] of byPoll) {
    for (const finding of detectBursts(samples)) {
      console.log(`⚠ Yığılma: poll=${pollId} asn=${finding.asn} oy=${finding.votes} pay=${finding.share}`);
      await db.insert(abuseEvents).values({
        kind: 'asn_burst', asn: finding.asn, pollId, detail: { ...finding },
      });
    }
  }

  // Agregaları ham oylardan yeniden kur. Gün içinde artımlı güncellenen sayılar burada
  // otoriteye (votes tablosuna) göre düzeltilir; gösterilen ile arşivlenen sayı böyle yakınsar.
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

  console.log(`Agregalar yeniden kuruldu: ${rebuilt.length} satır`);
  await db.$client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
