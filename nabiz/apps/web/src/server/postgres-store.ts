import { and, count, desc, eq, sql } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Poll } from '@nabiz/core';
import { schema } from '@nabiz/db';
import type { AdminMetrics, CreatePollInput, RecordVoteInput, Repository, VelocitySignals } from './repository';

const { polls, options, votes, voteAggregates, voteTimeseries, abuseEvents, shares, categories } = schema;

/**
 * Üretim deposu.
 *
 * İki değişmez kural burada uygulanır:
 *  1. Sonuçlar `vote_aggregates`'ten okunur; `votes` tablosu ASLA sayılmaz (hot path).
 *  2. Oy yazma ile agregasyon güncellemesi tek transaction'da olur — yarım kalmış bir yazma
 *     sonucu bozar ve sonradan düzeltmek, canlı gösterilen sayının yanlış olması demektir.
 */
/**
 * Soru ve kategori verisi neredeyse hiç değişmez ama oy yolunda her istekte okunur.
 * Kısa ömürlü süreç içi önbellek, oy başına gidiş-dönüşü düşürür. TTL kısa tutulur:
 * yeni yayınlanan bir soru en geç bu süre sonunda görünür.
 */
const POLL_CACHE_TTL_MS = 30_000;

export class PostgresStore implements Repository {
  private readonly db: PostgresJsDatabase;
  private readonly pollCache = new Map<string, { poll: Poll | null; expires: number }>();
  private categoryCache: { rows: Array<{ id: number; slug: string }>; expires: number } | null = null;

  constructor(connectionString: string) {
    // Havuz boyutu ortamdan ayarlanır: serverless'ta küçük tutmak zorunludur (bağlantı
    // limiti), uzun ömürlü sunucuda daha büyük olmalı.
    const max = Number(process.env['DATABASE_POOL_MAX'] ?? 10);
    this.db = drizzle(postgres(connectionString, { max, prepare: false }));
  }

  private cacheGet(key: string): Poll | null | undefined {
    const hit = this.pollCache.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.pollCache.delete(key);
      return undefined;
    }
    return hit.poll;
  }

  private cacheSet(key: string, poll: Poll | null): void {
    this.pollCache.set(key, { poll, expires: Date.now() + POLL_CACHE_TTL_MS });
  }

  /** Soru oluşturma/yayınlama sonrası önbellek bayatlamasın. */
  private invalidateCache(): void {
    this.pollCache.clear();
  }

  private async getCategories() {
    if (this.categoryCache && this.categoryCache.expires > Date.now()) return this.categoryCache.rows;
    const rows = await this.db.select({ id: categories.id, slug: categories.slug }).from(categories);
    this.categoryCache = { rows, expires: Date.now() + POLL_CACHE_TTL_MS };
    return rows;
  }

  private async hydrate(rows: Array<typeof polls.$inferSelect>): Promise<Poll[]> {
    if (rows.length === 0) return [];

    const pollIds = rows.map((r) => r.id);
    const optionRows = await this.db
      .select()
      .from(options)
      .where(sql`${options.pollId} in ${sql`(${sql.join(pollIds.map((id) => sql`${id}`), sql`, `)})`}`)
      .orderBy(options.position);

    const categoryRows = await this.getCategories();

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      question: row.questionTr,
      categorySlug: categoryRows.find((c) => c.id === row.categoryId)?.slug ?? 'genel',
      status: row.status,
      sponsorName: null,
      endsAt: row.endsAt,
      options: optionRows
        .filter((o) => o.pollId === row.id)
        .map((o) => ({ id: o.id, label: o.labelTr, emoji: o.emoji, entitySlug: null })),
    }));
  }

  async listLivePolls(limit: number): Promise<Poll[]> {
    const rows = await this.db.select().from(polls)
      .where(eq(polls.status, 'live'))
      .orderBy(desc(polls.publishedAt))
      .limit(limit);
    return this.hydrate(rows);
  }

  async listPollsByCategory(categorySlug: string): Promise<Poll[]> {
    const rows = await this.db.select({ poll: polls }).from(polls)
      .innerJoin(categories, eq(categories.id, polls.categoryId))
      .where(and(eq(categories.slug, categorySlug), eq(polls.status, 'live')));
    return this.hydrate(rows.map((r) => r.poll));
  }

  async listPublishedPolls(): Promise<Poll[]> {
    const rows = await this.db.select().from(polls)
      .where(sql`${polls.status} in ('live','closed','archived')`);
    return this.hydrate(rows);
  }

  async getPollBySlug(slug: string): Promise<Poll | null> {
    const cached = this.cacheGet(`slug:${slug}`);
    if (cached !== undefined) return cached;

    const rows = await this.db.select().from(polls).where(eq(polls.slug, slug)).limit(1);
    const poll = (await this.hydrate(rows))[0] ?? null;
    this.cacheSet(`slug:${slug}`, poll);
    if (poll) this.cacheSet(`id:${poll.id}`, poll);
    return poll;
  }

  async getPollById(id: string): Promise<Poll | null> {
    const cached = this.cacheGet(`id:${id}`);
    if (cached !== undefined) return cached;

    const rows = await this.db.select().from(polls).where(eq(polls.id, id)).limit(1);
    const poll = (await this.hydrate(rows))[0] ?? null;
    this.cacheSet(`id:${id}`, poll);
    if (poll) this.cacheSet(`slug:${poll.slug}`, poll);
    return poll;
  }

  async getAggregates(pollId: string, cityId: number) {
    // LEFT JOIN şart: henüz oy almamış bir seçeneğin agrega satırı yoktur ve yalnızca
    // vote_aggregates'ten okumak, yeni bir soruyu "seçeneği olmayan soru" gibi gösterir.
    // Her seçenek, sayısı sıfır olsa da sonuçta yer almalıdır.
    const rows = await this.db
      .select({ optionId: options.id, count: voteAggregates.voteCount })
      .from(options)
      .leftJoin(voteAggregates, and(
        eq(voteAggregates.optionId, options.id),
        eq(voteAggregates.cityId, cityId),
      ))
      .where(eq(options.pollId, pollId))
      .orderBy(options.position);

    return rows.map((r) => ({ optionId: r.optionId, count: Number(r.count ?? 0) }));
  }

  async findVote(pollId: string, sessionHash: string) {
    const rows = await this.db.select({ optionId: votes.optionId }).from(votes)
      .where(and(eq(votes.pollId, pollId), eq(votes.sessionHash, Buffer.from(sessionHash, 'hex'))))
      .limit(1);
    return rows[0] ?? null;
  }

  async findVoteByClientToken(pollId: string, clientToken: string) {
    // clientToken kalıcı olarak saklanmaz; idempotency penceresi UNIQUE(poll, session) ile
    // korunur. Aynı token'ın tekrarı, aynı oturumdan geldiği için orada yakalanır.
    void pollId; void clientToken;
    return null;
  }

  async recordVote(input: RecordVoteInput): Promise<boolean> {
    const sessionHash = Buffer.from(input.sessionHash, 'hex');
    const ipHash = Buffer.from(input.ipHash, 'hex');

    return this.db.transaction(async (tx) => {
      const inserted = await tx.insert(votes).values({
        pollId: input.pollId,
        optionId: input.optionId,
        cityId: input.cityId,
        sessionHash,
        ipHash,
        asn: input.asn,
        country: input.country,
        trustScore: input.trustScore,
        isCounted: input.counted,
        uaClass: input.uaClass,
        createdAt: input.at,
      })
        // Mükerrer oy sessizce yok sayılır: UNIQUE(poll_id, session_hash) ihlali hata değil,
        // beklenen bir durumdur.
        .onConflictDoNothing({ target: [votes.pollId, votes.sessionHash] })
        .returning({ id: votes.id });

      if (inserted.length === 0) return false;
      if (!input.counted) return true; // karantina: ham oy yazıldı, agregaya işlenmedi

      const bucket = new Date(input.at);
      bucket.setMinutes(0, 0, 0);

      for (const cityId of [0, ...(input.cityId !== null ? [input.cityId] : [])]) {
        await tx.insert(voteAggregates)
          .values({ pollId: input.pollId, optionId: input.optionId, cityId, voteCount: 1 })
          .onConflictDoUpdate({
            target: [voteAggregates.pollId, voteAggregates.optionId, voteAggregates.cityId],
            set: { voteCount: sql`${voteAggregates.voteCount} + 1`, updatedAt: new Date() },
          });
      }

      await tx.insert(voteTimeseries)
        .values({ pollId: input.pollId, optionId: input.optionId, bucket, voteCount: 1 })
        .onConflictDoUpdate({
          target: [voteTimeseries.pollId, voteTimeseries.optionId, voteTimeseries.bucket],
          set: { voteCount: sql`${voteTimeseries.voteCount} + 1` },
        });

      return true;
    });
  }

  async countVelocity(sessionHash: string, ipHash: string): Promise<VelocitySignals> {
    // Tarihler ham SQL'e ISO metni + açık cast olarak veriliyor: `sql` şablonuna Date
    // nesnesi geçirmek sürücünün parametreyi yanlış türde kodlamasına yol açıyor.
    const minuteAgo = new Date(Date.now() - 60_000).toISOString();
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const session = Buffer.from(sessionHash, 'hex');
    const ip = Buffer.from(ipHash, 'hex');

    // İki sorgu ama tek gidiş-dönüş süresi (paralel). Tek sorguda `session OR ip` yazmak
    // daha az sorgu gibi görünür ama planlayıcıyı tam taramaya zorlar; EXPLAIN ile
    // doğrulandı. Milyonlarca satırda oy yolunun en pahalı adımı bu olurdu.
    const [sessionRows, ipRows] = await Promise.all([
      this.db.select({
        lastMinute: sql<number>`count(*) filter (where ${votes.createdAt} >= ${minuteAgo}::timestamptz)`,
      }).from(votes).where(sql`${votes.sessionHash} = ${session}::bytea and ${votes.createdAt} >= ${hourAgo}::timestamptz`),
      this.db.select({
        lastMinute: sql<number>`count(*) filter (where ${votes.createdAt} >= ${minuteAgo}::timestamptz)`,
        lastHour: sql<number>`count(*)`,
      }).from(votes).where(sql`${votes.ipHash} = ${ip}::bytea and ${votes.createdAt} >= ${hourAgo}::timestamptz`),
    ]);

    return {
      sessionVotesLastMinute: Number(sessionRows[0]?.lastMinute ?? 0),
      ipVotesLastMinute: Number(ipRows[0]?.lastMinute ?? 0),
      ipVotesLastHour: Number(ipRows[0]?.lastHour ?? 0),
    };
  }

  async createPoll(input: CreatePollInput): Promise<Poll> {
    const category = await this.db.select().from(categories)
      .where(eq(categories.slug, input.categorySlug)).limit(1);
    const categoryId = category[0]?.id;
    if (categoryId === undefined) throw new Error(`Bilinmeyen kategori: ${input.categorySlug}`);

    const [poll] = await this.db.insert(polls).values({
      slug: input.slug,
      questionTr: input.question,
      categoryId,
      status: 'draft',
      editorialOk: input.editorialOk,
    }).returning();
    if (!poll) throw new Error('Soru oluşturulamadı');

    await this.db.insert(options).values(
      input.options.map((option, index) => ({
        pollId: poll.id,
        labelTr: option.label,
        emoji: option.emoji,
        position: index,
      })),
    );

    this.invalidateCache();
    return (await this.getPollById(poll.id))!;
  }

  async publishPoll(pollId: string): Promise<'published' | 'not_found' | 'editorial_blocked'> {
    const rows = await this.db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
    const poll = rows[0];
    if (!poll) return 'not_found';
    if (!poll.editorialOk) return 'editorial_blocked';

    await this.db.update(polls)
      .set({ status: 'live', publishedAt: new Date() })
      .where(eq(polls.id, pollId));
    this.invalidateCache();
    return 'published';
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    const [totals] = await this.db.select({
      total: count(),
      counted: sql<number>`count(*) filter (where ${votes.isCounted})`,
    }).from(votes);

    const pollRows = await this.db.select().from(polls);
    const aggregateRows = await this.db.select().from(voteAggregates)
      .where(eq(voteAggregates.cityId, 0));
    const [shareRow] = await this.db.select({ n: count() }).from(shares);

    const perPoll = pollRows.map((poll) => {
      const rows = aggregateRows.filter((a) => a.pollId === poll.id);
      const votesTotal = rows.reduce((sum, r) => sum + Number(r.voteCount), 0);
      const leader = Math.max(0, ...rows.map((r) => Number(r.voteCount)));
      return {
        slug: poll.slug,
        question: poll.questionTr,
        votes: votesTotal,
        leaderPct: votesTotal === 0 ? 0 : (leader / votesTotal) * 100,
        status: poll.status,
      };
    }).sort((a, b) => b.votes - a.votes);

    const total = Number(totals?.total ?? 0);
    const counted = Number(totals?.counted ?? 0);

    return {
      totalVotes: total,
      countedVotes: counted,
      quarantinedVotes: total - counted,
      livePolls: pollRows.filter((p) => p.status === 'live').length,
      draftPolls: pollRows.filter((p) => p.status === 'draft').length,
      shares: Number(shareRow?.n ?? 0),
      perPoll,
    };
  }

  async logAbuseEvent(kind: string, detail: Record<string, unknown>): Promise<void> {
    await this.db.insert(abuseEvents).values({ kind, detail });
  }

  async recordShare(pollId: string, channel: string): Promise<void> {
    await this.db.insert(shares).values({ pollId, channel });
  }
}
