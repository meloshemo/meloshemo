import type { OptionResult } from './types';

/**
 * Ham sayımları yüzdeye çevirir.
 *
 * En büyük kalan (largest remainder) yöntemi kullanılır: yuvarlamadan sonra yüzdelerin
 * toplamı tam olarak 100.0 eder. Bu kozmetik bir detay değil — "%54.2 + %45.9 = %100.1"
 * gösteren bir sonuç ekranı, sonuçların güvenilirliğine dair tüm iddiayı zayıflatır.
 */
export function computeResults(
  counts: ReadonlyArray<{ optionId: string; count: number }>,
  decimals = 1,
): OptionResult[] {
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  if (total === 0) {
    return counts.map((c) => ({ optionId: c.optionId, count: 0, pct: 0 }));
  }

  const scale = 10 ** decimals;
  const target = 100 * scale;

  const scaled = counts.map((c) => {
    const exact = (c.count / total) * target;
    const floor = Math.floor(exact);
    return { optionId: c.optionId, count: c.count, floor, remainder: exact - floor };
  });

  let leftover = target - scaled.reduce((sum, s) => sum + s.floor, 0);

  // Kalanı, ondalık artığı en büyük olanlardan başlayarak dağıt. Eşitlikte oy sayısı
  // yüksek olan, o da eşitse optionId sırası belirler — sonuç deterministiktir.
  const order = [...scaled].sort(
    (a, b) => b.remainder - a.remainder || b.count - a.count || a.optionId.localeCompare(b.optionId),
  );
  const bonus = new Map<string, number>();
  for (const item of order) {
    if (leftover <= 0) break;
    bonus.set(item.optionId, 1);
    leftover -= 1;
  }

  return scaled.map((s) => ({
    optionId: s.optionId,
    count: s.count,
    pct: (s.floor + (bonus.get(s.optionId) ?? 0)) / scale,
  }));
}

/**
 * Bir şehir kırılımının gösterilip gösterilmeyeceği.
 * Eşik altındaki kırılım gösterilmez: 7 oyla "İzmir'in %71'i" demek yanlış bilgidir.
 */
export const CITY_RESULT_MIN_VOTES = 100;

export function isCityBreakdownPublishable(cityTotal: number): boolean {
  return cityTotal >= CITY_RESULT_MIN_VOTES;
}
