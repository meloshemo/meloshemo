import { computeResults } from './results';

/**
 * Trend hesabı.
 *
 * "Yükselen" mutlak oy sayısı değil, PAYIN değişimidir: bir seçenek son 24 saatte
 * önceki 24 saate göre kaç puan daha fazla tercih ediliyor. Mutlak sayıya bakmak, sadece
 * trafiği yüksek olan soruyu her gün başa koyar ve trend listesi ölü bir sıralamaya döner.
 */

export interface TrendWindow {
  optionId: string;
  recentCount: number;
  priorCount: number;
}

export interface TrendResult {
  optionId: string;
  currentPct: number;
  deltaPoints: number;
  recentVotes: number;
}

/** Trend listesine girmek için gereken minimum oy — az veriyle "yükseliş" gürültüdür. */
export const TREND_MIN_RECENT_VOTES = 30;

export function computeTrend(
  windows: readonly TrendWindow[],
  minRecentVotes = TREND_MIN_RECENT_VOTES,
): TrendResult[] {
  const recentTotal = windows.reduce((sum, w) => sum + w.recentCount, 0);
  const priorTotal = windows.reduce((sum, w) => sum + w.priorCount, 0);
  if (recentTotal < minRecentVotes) return [];

  const recent = computeResults(windows.map((w) => ({ optionId: w.optionId, count: w.recentCount })));
  // Önceki pencerede hiç oy yoksa karşılaştırma yapılamaz: bu bir yükseliş değil,
  // sorunun yeni olmasıdır. Taban olarak mevcut yüzde alınır → delta sıfır.
  const prior = priorTotal === 0
    ? recent
    : computeResults(windows.map((w) => ({ optionId: w.optionId, count: w.priorCount })));

  return windows
    .map((window) => {
      const current = recent.find((r) => r.optionId === window.optionId)?.pct ?? 0;
      const before = prior.find((p) => p.optionId === window.optionId)?.pct ?? 0;
      return {
        optionId: window.optionId,
        currentPct: current,
        deltaPoints: Number((current - before).toFixed(1)),
        recentVotes: window.recentCount,
      };
    })
    .filter((entry) => entry.deltaPoints > 0)
    .sort((a, b) => b.deltaPoints - a.deltaPoints);
}

/** Kaç saatlik pencere nabız çizgisinde gösterilir. */
export const PULSE_HOURS = 12;

export interface BucketCounts {
  /** Kovanın başlangıç saati (epoch ms, saate yuvarlanmış). */
  bucket: number;
  /** Seçenek kimliği → o saatteki oy sayısı. */
  counts: Readonly<Record<string, number>>;
}

/**
 * Bir seçeneğin saatlik PAY serisi (0–100).
 *
 * Ham oy sayısı değil pay çizilir: gece 3'te 4 oy, akşam 8'de 400 oy gelir; ham sayı
 * çizmek her seçenek için aynı günlük trafik eğrisini gösterir ve hiçbir şey anlatmaz.
 * Pay serisi ise "bu seçenek güçleniyor mu" sorusunu cevaplar.
 *
 * Oy gelmemiş saatler bir önceki bilinen payı korur — sıfıra düşürmek, o saatte seçeneğin
 * çöktüğü yanılsaması yaratır.
 */
export function pulseSeries(
  buckets: readonly BucketCounts[],
  optionId: string,
  hours = PULSE_HOURS,
): number[] {
  if (buckets.length === 0) return [];

  const ordered = [...buckets].sort((a, b) => a.bucket - b.bucket).slice(-hours);
  const series: number[] = [];
  let last = 50;

  for (const entry of ordered) {
    const total = Object.values(entry.counts).reduce((sum, n) => sum + n, 0);
    if (total > 0) last = ((entry.counts[optionId] ?? 0) / total) * 100;
    series.push(Number(last.toFixed(1)));
  }

  return series;
}
