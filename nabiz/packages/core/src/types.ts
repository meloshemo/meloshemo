/** Alan modeli. Depolama katmanından bağımsızdır — bilerek saf tutulmuştur. */

export type PollStatus = 'draft' | 'scheduled' | 'live' | 'closed' | 'archived';

export interface PollOption {
  id: string;
  label: string;
  emoji: string | null;
  entitySlug: string | null;
}

export interface Poll {
  id: string;
  slug: string;
  question: string;
  categorySlug: string;
  status: PollStatus;
  options: PollOption[];
  sponsorName: string | null;
  endsAt: Date | null;
}

/** Tek bir seçeneğin sonucu. `pct` toplamı her zaman 100.0'dır (bkz. computeResults). */
export interface OptionResult {
  optionId: string;
  count: number;
  pct: number;
}

export interface PollResults {
  pollId: string;
  total: number;
  options: OptionResult[];
  /** Kullanıcının beyan ettiği şehir için kırılım. Eşik altındaysa null. */
  city: CityResults | null;
  yourOptionId: string | null;
  asOf: Date;
}

export interface CityResults {
  cityId: number;
  citySlug: string;
  total: number;
  options: OptionResult[];
}

/** Bir oyun ham hâli — anti-abuse değerlendirmesinden önce. */
export interface VoteAttempt {
  pollId: string;
  optionId: string;
  cityId: number | null;
  sessionId: string;
  clientToken: string;
  ip: string;
  asn: number | null;
  country: string | null;
  userAgent: string | null;
  /** Soru gösterildikten sonra oy verilene kadar geçen süre (ms). */
  decisionMs: number | null;
  /** Sayfada gerçek etkileşim (pointer/scroll/klavye) olup olmadığı. */
  hadInteraction: boolean;
  receivedAt: Date;
}
