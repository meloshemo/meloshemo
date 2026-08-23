import { randomUUID } from 'node:crypto';
import type { Poll } from '@nabiz/core';
import { CATEGORIES, SEED_POLLS } from '@nabiz/db';
import { computeResults, computeTrend, leaderOf, pulseSeries, slugify, type BucketCounts } from '@nabiz/core';
import type {
  AdminMetrics, ChampionEntry, CreatePollInput, Repository, RecordVoteInput,
  TrendingEntry, VelocitySignals,
} from './repository';

/**
 * Bellek içi depo — geliştirme ve test içindir.
 *
 * DATABASE_URL tanımlı değilse uygulama buna düşer, böylece proje `npm run dev` ile
 * hiçbir altyapı kurulmadan çalışır. Üretimde ASLA kullanılmaz (process yeniden başlarsa
 * veri kaybolur ve birden fazla sunucu örneği arasında paylaşılmaz).
 */
interface StoredVote extends RecordVoteInput { }

export class MemoryStore implements Repository {
  private readonly polls: Poll[] = [];
  private readonly votes: StoredVote[] = [];
  /** `${pollId}|${cityId}|${optionId}` → sayım */
  private readonly aggregates = new Map<string, number>();
  private readonly editorialOk = new Map<string, boolean>();
  private shareCount = 0;

  constructor() {
    for (const seed of SEED_POLLS) {
      const category = CATEGORIES.find((c) => c.slug === seed.category);
      this.polls.push({
        id: randomUUID(),
        slug: seed.slug,
        question: seed.question,
        categorySlug: category?.slug ?? 'genel',
        status: 'live',
        sponsorName: null,
        endsAt: null,
        options: seed.options.map((o) => ({
          id: randomUUID(),
          label: o.label,
          emoji: o.emoji,
          entitySlug: null,
        })),
      });
    }
  }

  async listLivePolls(limit: number): Promise<Poll[]> {
    return this.polls.filter((p) => p.status === 'live').slice(0, limit);
  }

  async listPollsByCategory(categorySlug: string): Promise<Poll[]> {
    return this.polls.filter((p) => p.categorySlug === categorySlug && p.status === 'live');
  }

  async listPublishedPolls(): Promise<Poll[]> {
    return this.polls.filter((p) => p.status === 'live' || p.status === 'closed' || p.status === 'archived');
  }

  async getPollBySlug(slug: string): Promise<Poll | null> {
    return this.polls.find((p) => p.slug === slug) ?? null;
  }

  async getPollById(id: string): Promise<Poll | null> {
    return this.polls.find((p) => p.id === id) ?? null;
  }

  async getAggregates(pollId: string, cityId: number) {
    const poll = await this.getPollById(pollId);
    if (!poll) return [];
    return poll.options.map((o) => ({
      optionId: o.id,
      count: this.aggregates.get(`${pollId}|${cityId}|${o.id}`) ?? 0,
    }));
  }

  async findVote(pollId: string, sessionHash: string) {
    const found = this.votes.find((v) => v.pollId === pollId && v.sessionHash === sessionHash);
    return found ? { optionId: found.optionId } : null;
  }

  async findVoteByClientToken(pollId: string, clientToken: string) {
    const found = this.votes.find((v) => v.pollId === pollId && v.clientToken === clientToken);
    return found ? { optionId: found.optionId } : null;
  }

  async recordVote(input: RecordVoteInput): Promise<boolean> {
    // Postgres'teki UNIQUE (poll_id, session_hash) kısıtının bellek içi karşılığı.
    if (await this.findVote(input.pollId, input.sessionHash)) return false;

    this.votes.push({ ...input });
    if (input.counted) {
      this.bump(input.pollId, 0, input.optionId);
      if (input.cityId !== null) this.bump(input.pollId, input.cityId, input.optionId);
    }
    return true;
  }

  private bump(pollId: string, cityId: number, optionId: string): void {
    const key = `${pollId}|${cityId}|${optionId}`;
    this.aggregates.set(key, (this.aggregates.get(key) ?? 0) + 1);
  }

  async countVelocity(sessionHash: string, ipHash: string): Promise<VelocitySignals> {
    const minuteAgo = Date.now() - 60_000;
    const hourAgo = Date.now() - 3_600_000;
    let sessionMinute = 0;
    let ipMinute = 0;
    let ipHour = 0;

    for (const vote of this.votes) {
      const at = vote.at.getTime();
      if (vote.sessionHash === sessionHash && at >= minuteAgo) sessionMinute += 1;
      if (vote.ipHash === ipHash) {
        if (at >= minuteAgo) ipMinute += 1;
        if (at >= hourAgo) ipHour += 1;
      }
    }

    return {
      sessionVotesLastMinute: sessionMinute,
      ipVotesLastMinute: ipMinute,
      ipVotesLastHour: ipHour,
    };
  }

  async getTrending(limit: number): Promise<TrendingEntry[]> {
    const now = Date.now();
    const dayAgo = now - 24 * 3_600_000;
    const twoDaysAgo = now - 48 * 3_600_000;
    const entries: TrendingEntry[] = [];

    for (const poll of this.polls) {
      if (poll.status !== 'live') continue;

      const windows = poll.options.map((option) => ({
        optionId: option.id,
        recentCount: this.votes.filter((v) => v.counted && v.optionId === option.id
          && v.at.getTime() >= dayAgo).length,
        priorCount: this.votes.filter((v) => v.counted && v.optionId === option.id
          && v.at.getTime() >= twoDaysAgo && v.at.getTime() < dayAgo).length,
      }));

      const trends = computeTrend(windows);
      const buckets = trends.length > 0 ? this.hourlyBuckets(poll.id) : [];

      for (const trend of trends) {
        const option = poll.options.find((o) => o.id === trend.optionId);
        if (!option) continue;
        const rival = poll.options.find((o) => o.id !== option.id);
        entries.push({
          pollSlug: poll.slug,
          question: poll.question,
          optionLabel: option.label,
          rivalLabel: rival?.label ?? '',
          emoji: option.emoji,
          deltaPoints: trend.deltaPoints,
          currentPct: trend.currentPct,
          series: pulseSeries(buckets, option.id),
        });
      }
    }

    return entries.sort((a, b) => b.deltaPoints - a.deltaPoints).slice(0, limit);
  }

  /** Saatlik kovalar — nabız çizgisinin kaynağı. */
  private hourlyBuckets(pollId: string): BucketCounts[] {
    const byHour = new Map<number, Record<string, number>>();
    const cutoff = Date.now() - 24 * 3_600_000;

    for (const vote of this.votes) {
      if (!vote.counted || vote.pollId !== pollId) continue;
      const at = vote.at.getTime();
      if (at < cutoff) continue;

      const hour = Math.floor(at / 3_600_000) * 3_600_000;
      const bucket = byHour.get(hour) ?? {};
      bucket[vote.optionId] = (bucket[vote.optionId] ?? 0) + 1;
      byHour.set(hour, bucket);
    }

    return [...byHour].map(([bucket, counts]) => ({ bucket, counts }));
  }

  async getChampionOfTheDay(): Promise<ChampionEntry | null> {
    let best: ChampionEntry | null = null;

    for (const poll of this.polls) {
      if (poll.status !== 'live') continue;
      const results = computeResults(await this.getAggregates(poll.id, 0));
      const total = results.reduce((sum, r) => sum + r.count, 0);
      if (total === 0 || (best && total <= best.votes)) continue;

      const leader = leaderOf(results);
      const option = poll.options.find((o) => o.id === leader?.optionId);
      if (!leader || !option) continue;

      best = {
        pollSlug: poll.slug,
        question: poll.question,
        optionLabel: option.label,
        emoji: option.emoji,
        pct: leader.pct,
        votes: total,
      };
    }

    return best;
  }

  async createPoll(input: CreatePollInput): Promise<Poll> {
    const poll: Poll = {
      id: randomUUID(),
      slug: input.slug || slugify(input.question),
      question: input.question,
      categorySlug: input.categorySlug,
      status: 'draft',
      sponsorName: null,
      endsAt: null,
      options: input.options.map((o) => ({
        id: randomUUID(), label: o.label, emoji: o.emoji, entitySlug: null,
      })),
    };
    this.editorialOk.set(poll.id, input.editorialOk);
    this.polls.push(poll);
    return poll;
  }

  async publishPoll(pollId: string): Promise<'published' | 'not_found' | 'editorial_blocked'> {
    const poll = this.polls.find((p) => p.id === pollId);
    if (!poll) return 'not_found';
    // Sunucu tarafı kapı: kontrol listesi işaretlenmemişse yayın mümkün değil (docs/10).
    if (!this.editorialOk.get(poll.id)) return 'editorial_blocked';
    poll.status = 'live';
    return 'published';
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    const counted = this.votes.filter((v) => v.counted).length;
    const perPoll = await Promise.all(this.polls.map(async (poll) => {
      const results = computeResults(await this.getAggregates(poll.id, 0));
      return {
        slug: poll.slug,
        question: poll.question,
        votes: results.reduce((sum, r) => sum + r.count, 0),
        leaderPct: leaderOf(results)?.pct ?? 0,
        status: poll.status,
      };
    }));

    return {
      totalVotes: this.votes.length,
      countedVotes: counted,
      quarantinedVotes: this.votes.length - counted,
      livePolls: this.polls.filter((p) => p.status === 'live').length,
      draftPolls: this.polls.filter((p) => p.status === 'draft').length,
      shares: this.shareCount,
      perPoll: perPoll.sort((a, b) => b.votes - a.votes),
    };
  }

  async logAbuseEvent(): Promise<void> { /* geliştirme ortamında yok sayılır */ }

  async recordShare(): Promise<void> { this.shareCount += 1; }
}
