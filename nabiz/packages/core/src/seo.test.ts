import { describe, expect, it } from 'vitest';
import {
  describeDivergence, findDivergences, isIndexable, leaderOf, participationScore,
} from './seo';

describe('isIndexable', () => {
  it('yeterli veri yoksa index etmez', () => {
    expect(isIndexable({ totalVotes: 12, distinctPolls: 1, insights: 0 })).toBe(false);
    expect(isIndexable({ totalVotes: 500, distinctPolls: 2, insights: 1 })).toBe(false);
    expect(isIndexable({ totalVotes: 500, distinctPolls: 5, insights: 0 })).toBe(false);
  });

  it('üç eşik birden geçilince index eder', () => {
    expect(isIndexable({ totalVotes: 300, distinctPolls: 3, insights: 1 })).toBe(true);
  });
});

describe('findDivergences', () => {
  const rows = [
    { optionLabel: 'Kumru', cityPct: 63.0, nationalPct: 40.0 },   // +23 → içgörü
    { optionLabel: 'Döner', cityPct: 45.0, nationalPct: 44.0 },   // +1  → gürültü
    { optionLabel: 'Baklava', cityPct: 30.0, nationalPct: 52.0 }, // -22 → içgörü
  ];

  it('yalnızca anlamlı ayrışmaları döndürür', () => {
    const found = findDivergences(rows);
    expect(found.map((f) => f.optionLabel)).toEqual(['Kumru', 'Baklava']);
  });

  it('en büyük ayrışma başa gelir', () => {
    expect(findDivergences(rows)[0]?.deltaPoints).toBe(23);
  });

  it('içgörü cümlesi yönü doğru anlatır', () => {
    const [first] = findDivergences(rows);
    expect(describeDivergence('İzmir', first!)).toBe(
      "İzmir'de Kumru, Türkiye ortalamasının 23.0 puan üstünde.",
    );
    const last = findDivergences(rows)[1]!;
    expect(describeDivergence('İzmir', last)).toContain('altında');
  });
});

describe('participationScore', () => {
  it('nüfusa göre normalize eder — küçük şehir büyük şehri geçebilir', () => {
    const istanbul = participationScore(10_000, 15_655_000);
    const trabzon = participationScore(2_000, 818_000);
    expect(trabzon).toBeGreaterThan(istanbul);
  });

  it('nüfus sıfırsa çökmez', () => {
    expect(participationScore(10, 0)).toBe(0);
  });
});

describe('leaderOf', () => {
  it('önde olan seçeneği verir', () => {
    expect(leaderOf([
      { optionId: 'a', count: 1, pct: 45.8 },
      { optionId: 'b', count: 2, pct: 54.2 },
    ])?.optionId).toBe('b');
  });

  it('boş listede null döner', () => {
    expect(leaderOf([])).toBeNull();
  });
});
