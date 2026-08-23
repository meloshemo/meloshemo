import type { OptionResult } from './types';

/**
 * Programmatic SEO yayın eşiği (docs/12).
 *
 * Boş sayfa üretmek doğrudan cezadır. Bir sayfa ancak gerçek veri taşıdığında index'lenir;
 * eşiği geçmeyen sayfa yayında kalır ama noindex taşır ve sitemap'e girmez. Eşik geçilince
 * otomatik olarak index'e döner — manuel işlem yoktur.
 */
export const INDEX_MIN_VOTES = 300;
export const INDEX_MIN_POLLS = 3;

export interface IndexabilityInput {
  totalVotes: number;
  distinctPolls: number;
  insights: number;
}

export function isIndexable({ totalVotes, distinctPolls, insights }: IndexabilityInput): boolean {
  return totalVotes >= INDEX_MIN_VOTES && distinctPolls >= INDEX_MIN_POLLS && insights >= 1;
}

export interface DivergenceInput {
  optionLabel: string;
  cityPct: number;
  nationalPct: number;
}

/** Bir sayfanın "gerçek içgörü" sayılması için gereken minimum ayrışma (yüzde puanı). */
export const MIN_DIVERGENCE_POINTS = 8;

/**
 * Şehrin Türkiye ortalamasından anlamlı biçimde ayrıştığı tercihler.
 * Şehir sayfalarının tek gerçek içerik değeri budur: aynı sonucun 81 kopyası içerik değildir.
 */
export function findDivergences(
  rows: readonly DivergenceInput[],
  minPoints = MIN_DIVERGENCE_POINTS,
): Array<DivergenceInput & { deltaPoints: number }> {
  return rows
    .map((row) => ({ ...row, deltaPoints: Number((row.cityPct - row.nationalPct).toFixed(1)) }))
    .filter((row) => Math.abs(row.deltaPoints) >= minPoints)
    .sort((a, b) => Math.abs(b.deltaPoints) - Math.abs(a.deltaPoints));
}

export function describeDivergence(
  cityName: string,
  row: { optionLabel: string; deltaPoints: number },
): string {
  const direction = row.deltaPoints > 0 ? 'üstünde' : 'altında';
  return `${cityName}'de ${row.optionLabel}, Türkiye ortalamasının ${Math.abs(row.deltaPoints).toFixed(1)} puan ${direction}.`;
}

/** Katılımı nüfusa göre normalize eder — aksi hâlde sıralamayı hep İstanbul kazanır. */
export function participationScore(cityVotes: number, population: number): number {
  if (population <= 0) return 0;
  return (cityVotes / population) * 100_000;
}

export function leaderOf(results: readonly OptionResult[]): OptionResult | null {
  if (results.length === 0) return null;
  return [...results].sort((a, b) => b.pct - a.pct)[0] ?? null;
}
