import type { Poll } from '@nabiz/core';

/**
 * Depolama sözleşmesi.
 *
 * Uygulama mantığı yalnızca bu arayüzü bilir; Postgres'e mi yoksa bellek içi depoya mı
 * yazdığını bilmez. Bu, oy mantığının veritabanı olmadan test edilebilmesini sağlar
 * ve ileride sıcak yolu Durable Object'e taşırken uygulama kodunun değişmemesi demektir.
 */
export interface Repository {
  listLivePolls(limit: number): Promise<Poll[]>;
  getPollBySlug(slug: string): Promise<Poll | null>;
  getPollById(id: string): Promise<Poll | null>;

  /** cityId = 0 → Türkiye geneli. */
  getAggregates(pollId: string, cityId: number): Promise<Array<{ optionId: string; count: number }>>;

  /** Bu oturumun bu soruya verdiği oy (varsa). */
  findVote(pollId: string, sessionHash: string): Promise<{ optionId: string } | null>;

  /** Idempotency: aynı clientToken ile ikinci kez yazma yapılmaz. */
  findVoteByClientToken(pollId: string, clientToken: string): Promise<{ optionId: string } | null>;

  /**
   * Oyu kaydeder. `counted=false` ise ham oy yazılır ama agregalara işlenmez (karantina).
   * Aynı oturum aynı soruya daha önce oy verdiyse `false` döner ve hiçbir şey yazılmaz.
   */
  recordVote(input: RecordVoteInput): Promise<boolean>;

  countRecentVotesBySession(sessionHash: string, sinceMs: number): Promise<number>;
  countRecentVotesByIp(ipHash: string, sinceMs: number): Promise<number>;

  logAbuseEvent(kind: string, detail: Record<string, unknown>): Promise<void>;
  recordShare(pollId: string, channel: string): Promise<void>;
}

export interface RecordVoteInput {
  pollId: string;
  optionId: string;
  cityId: number | null;
  sessionHash: string;
  ipHash: string;
  clientToken: string;
  asn: number | null;
  country: string | null;
  trustScore: number;
  counted: boolean;
  uaClass: string | null;
  at: Date;
}
