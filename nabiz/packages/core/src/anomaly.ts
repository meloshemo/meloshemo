/**
 * Gece temizliği için küme analizi (docs/11 §11.2 Katman 4).
 *
 * Anlık savunma isteği tek tek değerlendirir; burada ise oyların TOPLU deseni incelenir.
 * Tek başına masum görünen oylar, birlikte bakıldığında kampanya veya bot çiftliği olabilir.
 */

export interface VoteSample {
  optionId: string;
  asn: number | null;
  /** Oyun geldiği dakika (epoch dakika). */
  minute: number;
  countedTrust: number;
}

export interface BurstFinding {
  asn: number;
  optionId: string;
  votes: number;
  /** Bu ASN'in toplam oy içindeki payı (0–1). */
  share: number;
  minutesSpanned: number;
}

export const BURST_MIN_VOTES = 50;
export const BURST_MIN_SHARE = 0.3;
export const BURST_MAX_MINUTES = 10;

/**
 * Tek bir ağdan (ASN), tek bir seçeneğe, dar bir zaman aralığında yığılan oyları bulur.
 *
 * Bulgu otomatik olarak oyları SİLMEZ — yalnızca işaretler. Gerçek bir kampanya da bu deseni
 * üretir ve gerçek insanların oyunu silmek, bot temizlemekten daha büyük bir hatadır.
 * Karar admin panelinde insana bırakılır (docs/11 §11.4: engelleme değil görünürlük).
 */
export function detectBursts(samples: readonly VoteSample[]): BurstFinding[] {
  if (samples.length === 0) return [];

  const groups = new Map<string, VoteSample[]>();
  for (const sample of samples) {
    if (sample.asn === null) continue;
    const key = `${sample.asn}|${sample.optionId}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(sample);
    else groups.set(key, [sample]);
  }

  const findings: BurstFinding[] = [];
  for (const [key, group] of groups) {
    if (group.length < BURST_MIN_VOTES) continue;

    const minutes = group.map((s) => s.minute);
    const span = Math.max(...minutes) - Math.min(...minutes);
    const share = group.length / samples.length;

    if (span <= BURST_MAX_MINUTES && share >= BURST_MIN_SHARE) {
      const [asn, optionId] = key.split('|');
      findings.push({
        asn: Number(asn),
        optionId: optionId!,
        votes: group.length,
        share: Number(share.toFixed(3)),
        minutesSpanned: span,
      });
    }
  }

  return findings.sort((a, b) => b.votes - a.votes);
}

/**
 * Filtrelenen oy oranının sağlıklı aralığı. Dışına çıkması, botların arttığını değil,
 * genellikle eşiklerin yanlış ayarlandığını gösterir (docs/11 §11.5).
 */
export const HEALTHY_QUARANTINE_RANGE = { min: 0.02, max: 0.08 } as const;

export function quarantineHealth(total: number, quarantined: number): 'ok' | 'low' | 'high' | 'unknown' {
  if (total < 100) return 'unknown';
  const rate = quarantined / total;
  if (rate < HEALTHY_QUARANTINE_RANGE.min) return 'low';
  if (rate > HEALTHY_QUARANTINE_RANGE.max) return 'high';
  return 'ok';
}
