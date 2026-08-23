import { describe, expect, it } from 'vitest';
import { computeTrend } from './trending';

describe('computeTrend', () => {
  it('payı artan seçeneği yükselen sayar', () => {
    const trend = computeTrend([
      { optionId: 'baklava', recentCount: 60, priorCount: 40 },
      { optionId: 'kunefe', recentCount: 40, priorCount: 60 },
    ]);
    expect(trend).toHaveLength(1);
    expect(trend[0]?.optionId).toBe('baklava');
    expect(trend[0]?.deltaPoints).toBe(20);
  });

  it('az oylu pencereyi hiç değerlendirmez — gürültüyü trend diye göstermez', () => {
    expect(computeTrend([
      { optionId: 'a', recentCount: 8, priorCount: 1 },
      { optionId: 'b', recentCount: 1, priorCount: 8 },
    ])).toEqual([]);
  });

  it('mutlak oy sayısı değil pay değişimi belirleyicidir', () => {
    // 'populer' 400 oy daha fazla aldı ama payı %75'ten %70'e düştü.
    // 'yukselen' daha az oy aldığı hâlde payı %25'ten %30'a çıktı — yükselen odur.
    const trend = computeTrend([
      { optionId: 'populer', recentCount: 700, priorCount: 300 },
      { optionId: 'yukselen', recentCount: 300, priorCount: 100 },
    ], 10);
    expect(trend[0]?.optionId).toBe('yukselen');
    expect(trend[0]?.deltaPoints).toBe(5);
    expect(trend.find((t) => t.optionId === 'populer')).toBeUndefined();
  });

  it('önceki pencere boşsa yükseliş uydurmaz', () => {
    const trend = computeTrend([
      { optionId: 'a', recentCount: 50, priorCount: 0 },
      { optionId: 'b', recentCount: 50, priorCount: 0 },
    ]);
    expect(trend).toEqual([]);
  });

  it('düşenler listeye girmez', () => {
    const trend = computeTrend([
      { optionId: 'a', recentCount: 30, priorCount: 70 },
      { optionId: 'b', recentCount: 70, priorCount: 30 },
    ]);
    expect(trend.every((t) => t.deltaPoints > 0)).toBe(true);
  });
});
