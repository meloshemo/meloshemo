import type { Poll } from '@nabiz/core';

/**
 * Depolama sözleşmesi.
 *
 * Uygulama mantığı yalnızca bu arayüzü bilir; Postgres'e mi yoksa bellek içi depoya mı
 * yazdığını bilmez. Bu, oy mantığının veritabanı olmadan test edilebilmesini sağlar
 * ve ileride sıcak yolu Durable Object'e taşırken uygulama kodunun değişmemesi demektir.
 */
export interface Repository {
  /**
   * Sayaçlar yazma anında mı güncellenir, yoksa tamponlanıp biraz sonra mı?
   *
   * Postgres deposu sayaçları tamponlar (yoğun anda aynı satıra yüzlerce yazma yerine
   * tek toplu yazma). O yüzden kullanıcının KENDİ oyu, sayaçlara henüz işlenmemiş
   * olabilir ve sonuç ekranına ayrıca eklenmelidir — insan kendi oyunu anında görmeli.
   */
  readonly aggregatesEventuallyConsistent?: boolean;

  listLivePolls(limit: number): Promise<Poll[]>;
  listPollsByCategory(categorySlug: string): Promise<Poll[]>;
  /** Sitemap ve arşiv için — taslak sorular dahil edilmez. */
  listPublishedPolls(): Promise<Poll[]>;
  getPollBySlug(slug: string): Promise<Poll | null>;
  getPollById(id: string): Promise<Poll | null>;

  /** cityId = 0 → Türkiye geneli. */
  getAggregates(pollId: string, cityId: number): Promise<Array<{ optionId: string; count: number }>>;

  /**
   * TÜM canlı soruların ülke geneli sayaçları — tek sorguda.
   *
   * Anlık görüntü ucu her istekte soru başına ayrı sorgu atarsa (N+1), 40 soruda
   * istek başına 40 sorgu eder ve yoğun saatte veritabanı bunun altında kalır.
   */
  getAllAggregates(): Promise<Array<{ pollId: string; optionId: string; count: number }>>;

  /** Bu oturumun bu soruya verdiği oy (varsa). */
  findVote(pollId: string, sessionHash: string): Promise<{ optionId: string } | null>;

  /** Idempotency: aynı clientToken ile ikinci kez yazma yapılmaz. */
  findVoteByClientToken(pollId: string, clientToken: string): Promise<{ optionId: string } | null>;

  /**
   * Oyu kaydeder. `counted=false` ise ham oy yazılır ama agregalara işlenmez (karantina).
   * Aynı oturum aynı soruya daha önce oy verdiyse `false` döner ve hiçbir şey yazılmaz.
   */
  recordVote(input: RecordVoteInput): Promise<boolean>;

  /**
   * Hız sinyalleri tek çağrıda alınır: oy yolunda üç ayrı sayım sorgusu, yük testinde
   * gecikmenin en büyük kalemiydi.
   */
  countVelocity(sessionHash: string, ipHash: string): Promise<VelocitySignals>;

  /**
   * Bir sorunun TÜM şehir kırılımları — harita için tek çağrıda.
   * 81 il için ayrı ayrı sormak 81 gidiş-dönüş demek olurdu.
   */
  getCityBreakdown(pollId: string): Promise<CityBreakdownRow[]>;

  /** Son 24 saatte payı artan seçenekler (ana sayfa "yükselenler" bölümü). */
  getTrending(limit: number): Promise<TrendingEntry[]>;
  /** Bugün en çok oy alan sorunun önde gideni. */
  getChampionOfTheDay(): Promise<ChampionEntry | null>;

  createPoll(input: CreatePollInput): Promise<Poll>;
  /** Yalnızca editoryal kontrol listesi işaretlenmiş taslaklar yayınlanabilir. */
  publishPoll(pollId: string): Promise<'published' | 'not_found' | 'editorial_blocked'>;
  getAdminMetrics(): Promise<AdminMetrics>;

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

export interface CreatePollInput {
  slug: string;
  question: string;
  categorySlug: string;
  options: Array<{ label: string; emoji: string }>;
  editorialOk: boolean;
}

export interface AdminMetrics {
  totalVotes: number;
  countedVotes: number;
  quarantinedVotes: number;
  livePolls: number;
  draftPolls: number;
  shares: number;
  /** Soru bazlı döküm — admin panelinde sıkıcı soruları ayıklamak için. */
  perPoll: Array<{ slug: string; question: string; votes: number; leaderPct: number; status: string }>;
}

export interface VelocitySignals {
  sessionVotesLastMinute: number;
  ipVotesLastMinute: number;
  ipVotesLastHour: number;
}

export interface TrendingEntry {
  pollSlug: string;
  question: string;
  optionLabel: string;
  rivalLabel: string;
  emoji: string | null;
  deltaPoints: number;
  currentPct: number;
  /** Son saatlerin pay serisi (0–100) — arayüzdeki nabız çizgisi. */
  series: number[];
}

export interface ChampionEntry {
  pollSlug: string;
  question: string;
  optionLabel: string;
  emoji: string | null;
  pct: number;
  votes: number;
}

export interface CityBreakdownRow {
  cityId: number;
  optionId: string;
  count: number;
}
