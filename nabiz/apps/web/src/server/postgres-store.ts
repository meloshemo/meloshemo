import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Poll } from '@nabiz/core';
import { schema } from '@nabiz/db';
import type { AdminMetrics, CreatePollInput, RecordVoteInput, Repository } from './repository';

const { polls, options, votes, voteAggregates, voteTimeseries, abuseEvents, shares, categories } = schema;

/**
 * Üretim deposu.
 *
 * İki değişmez kural burada uygulanır:
 *  1. Sonuçlar `vote_aggregates`'ten okunur; `votes` tablosu ASLA sayılmaz (hot path).
 *  2. Oy yazma ile agregasyon güncellemesi tek transaction'da olur — yarım kalmış bir yazma
 *     sonucu bozar ve sonradan düzeltmek, canlı gösterilen sayının yanlış olması demektir.
 */
export class PostgresStore implements Repository {
  private readonly db: PostgresJsDatabase;

  constructor(connectionString: string) {
    // max: 5 — serverless ortamda bağlantı havuzunu küçük tutmak zorunludur, yoksa
    // eşzamanlı fonksiyon örnekleri Postgres bağlantı limitini tüketir.
    this.db = drizzle(postgres(connectionString, { max: 5, prepare: false }));
  }

  private async hydrate(rows: Array<typeof polls.$inferSelect>): Promise<Poll[]> {
    if (rows.length === 0) return [];

    const pollIds = rows.map((r) => r.id);
    const optionRows = await this.db
      .select()
      .from(options)
      .where(sql`${options.pollId} in ${sql`(${sql.join(pollIds.map((id) => sql`${id}`), sql`, `)})`}`)
      .orderBy(options.position);

    const categoryRows = await this.db.select().from(categories);

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
    const rows = await this.db.select().from(polls).where(eq(polls.slug, slug)).limit(1);
    return (await this.hydrate(rows))[0] ?? null;
  }

  async getPollById(id: string): Promise<Poll | null> {
    const rows = await this.db.select().from(polls).where(eq(polls.id, id)).limit(1);
    return (await this.hydrate(rows))[0] ?? null;
  }

  async getAggregates(pollId: string, cityId: number) {
    const rows = await this.db
      .select({ optionId: voteAggregates.optionId, count: voteAggregates.voteCount })
      .from(voteAggregates)
      .where(and(eq(voteAggregates.pollId, pollId), eq(voteAggregates.cityId, cityId)));
    return rows.map((r) => ({ optionId: r.optionId, count: Number(r.count) }));
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

  async countRecentVotesBySession(sessionHash: string, sinceMs: number): Promise<number> {
    const rows = await this.db.select({ n: count() }).from(votes).where(and(
      eq(votes.sessionHash, Buffer.from(sessionHash, 'hex')),
      gte(votes.createdAt, new Date(Date.now() - sinceMs)),
    ));
    return Number(rows[0]?.n ?? 0);
  }

  async countRecentVotesByIp(ipHash: string, sinceMs: number): Promise<number> {
    const rows = await this.db.select({ n: count() }).from(votes).where(and(
      eq(votes.ipHash, Buffer.from(ipHash, 'hex')),
      gte(votes.createdAt, new Date(Date.now() - sinceMs)),
    ));
    return Number(rows[0]?.n ?? 0);
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
