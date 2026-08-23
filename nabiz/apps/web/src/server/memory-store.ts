import { randomUUID } from 'node:crypto';
import type { Poll } from '@nabiz/core';
import { CATEGORIES, SEED_POLLS } from '@nabiz/db';
import type { Repository, RecordVoteInput } from './repository';

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

  async countRecentVotesBySession(sessionHash: string, sinceMs: number): Promise<number> {
    const cutoff = Date.now() - sinceMs;
    return this.votes.filter((v) => v.sessionHash === sessionHash && v.at.getTime() >= cutoff).length;
  }

  async countRecentVotesByIp(ipHash: string, sinceMs: number): Promise<number> {
    const cutoff = Date.now() - sinceMs;
    return this.votes.filter((v) => v.ipHash === ipHash && v.at.getTime() >= cutoff).length;
  }

  async logAbuseEvent(): Promise<void> { /* geliştirme ortamında yok sayılır */ }
  async recordShare(): Promise<void> { /* geliştirme ortamında yok sayılır */ }
}
