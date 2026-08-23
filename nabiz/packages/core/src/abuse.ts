import type { VoteAttempt } from './types';

/**
 * Güven puanlaması (0–100). Çıktı, oyun SAYILIP sayılmayacağını belirler;
 * gösterilip gösterilmeyeceğini belirlemez — kullanıcı her hâlükârda sonucu görür.
 *
 * Burada kalıcı cihaz parmak izi ÜRETİLMEZ. Değerlendirilen her sinyal tek bir isteğe
 * veya kısa süreli orana aittir; hiçbiri ziyaretler arası kalıcı bir tanımlayıcı oluşturmaz.
 */

export const TRUST_COUNT_THRESHOLD = 50;   // altındaysa oy karantinaya alınır
export const TRUST_CHALLENGE_THRESHOLD = 70; // altındaysa görünmez doğrulama istenir

/** İnsanın soruyu okuyup karar veremeyeceği kabul edilen alt sınır. */
export const MIN_HUMAN_DECISION_MS = 400;

/** Bilinen veri merkezi ASN'leri — engellenmez, yalnızca daha az güvenilir sayılır. */
const DATACENTER_ASNS = new Set([16509, 14618, 15169, 16276, 24940, 14061, 20473, 13335, 8075]);

export interface AbuseSignals {
  /** Bu oturumun son 60 saniyedeki oy sayısı. */
  sessionVotesLastMinute: number;
  /** Bu IP hash'inin son 60 saniyedeki oy sayısı. */
  ipVotesLastMinute: number;
  /** Bu IP hash'inin son 60 dakikadaki oy sayısı. */
  ipVotesLastHour: number;
}

export interface TrustAssessment {
  score: number;
  reasons: string[];
  /** false ise oy `is_counted=false` olarak yazılır (karantina). */
  counted: boolean;
  /** true ise istemciden görünmez doğrulama (Turnstile) istenir. */
  challenge: boolean;
}

export const RATE_LIMITS = {
  sessionPerMinute: 12,
  ipPerMinute: 30,
  ipPerHour: 300,
} as const;

export function assessTrust(attempt: VoteAttempt, signals: AbuseSignals): TrustAssessment {
  let score = 100;
  const reasons: string[] = [];

  const penalise = (points: number, reason: string) => {
    score -= points;
    reasons.push(reason);
  };

  if (attempt.decisionMs !== null && attempt.decisionMs < MIN_HUMAN_DECISION_MS) {
    penalise(40, 'decision_too_fast');
  }
  if (!attempt.hadInteraction) {
    penalise(25, 'no_interaction');
  }
  if (!attempt.userAgent) {
    penalise(20, 'missing_ua');
  }
  if (attempt.asn !== null && DATACENTER_ASNS.has(attempt.asn)) {
    penalise(30, 'datacenter_asn');
  }
  if (signals.sessionVotesLastMinute > RATE_LIMITS.sessionPerMinute) {
    penalise(45, 'session_velocity');
  }
  if (signals.ipVotesLastMinute > RATE_LIMITS.ipPerMinute) {
    penalise(35, 'ip_velocity_minute');
  }
  if (signals.ipVotesLastHour > RATE_LIMITS.ipPerHour) {
    penalise(35, 'ip_velocity_hour');
  }
  if (attempt.country !== null && attempt.country !== 'TR') {
    // Yurt dışından oy meşrudur (gurbetçi kitle gerçek). Ceza küçük ve tek başına
    // asla karantinaya yetmez — yalnızca başka sinyallerle birleşince ağırlık kazanır.
    penalise(10, 'non_tr_country');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    reasons,
    counted: score >= TRUST_COUNT_THRESHOLD,
    challenge: score < TRUST_CHALLENGE_THRESHOLD,
  };
}

/** Kesin engelleme yalnızca aşırı hız durumunda; 429 döner. */
export function isHardRateLimited(signals: AbuseSignals): boolean {
  return (
    signals.ipVotesLastMinute > RATE_LIMITS.ipPerMinute * 3 ||
    signals.ipVotesLastHour > RATE_LIMITS.ipPerHour * 3
  );
}
