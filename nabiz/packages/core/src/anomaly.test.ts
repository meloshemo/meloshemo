import { describe, expect, it } from 'vitest';
import { detectBursts, quarantineHealth, type VoteSample } from './anomaly';

function samples(n: number, over: Partial<VoteSample> = {}, startMinute = 0): VoteSample[] {
  return Array.from({ length: n }, (_, i) => ({
    optionId: 'a', asn: 16509, minute: startMinute + (i % 3), countedTrust: 100, ...over,
  }));
}

describe('detectBursts', () => {
  it('tek ağdan dar zamana yığılan oyları işaretler', () => {
    const found = detectBursts(samples(80));
    expect(found).toHaveLength(1);
    expect(found[0]?.asn).toBe(16509);
    expect(found[0]?.votes).toBe(80);
  });

  it('doğal dağılmış trafiği işaretlemez', () => {
    const organic: VoteSample[] = Array.from({ length: 300 }, (_, i) => ({
      optionId: i % 2 ? 'a' : 'b',
      asn: 9121 + (i % 25),
      minute: i,
      countedTrust: 100,
    }));
    expect(detectBursts(organic)).toHaveLength(0);
  });

  it('aynı ağdan gelse de zamana yayılmışsa işaretlemez', () => {
    const spread = samples(80).map((s, i) => ({ ...s, minute: i * 5 }));
    expect(detectBursts(spread)).toHaveLength(0);
  });

  it('az sayıda oyu işaretlemez', () => {
    expect(detectBursts(samples(20))).toHaveLength(0);
  });

  it('ASN bilinmeyen oyları atlar, çökmez', () => {
    expect(detectBursts(samples(80, { asn: null }))).toHaveLength(0);
  });

  it('boş girdide boş döner', () => {
    expect(detectBursts([])).toEqual([]);
  });
});

describe('quarantineHealth', () => {
  it('az veriyle hüküm vermez', () => {
    expect(quarantineHealth(50, 40)).toBe('unknown');
  });

  it('sağlıklı aralığı tanır', () => {
    expect(quarantineHealth(1000, 50)).toBe('ok');
  });

  it('aralık dışını işaretler', () => {
    expect(quarantineHealth(1000, 5)).toBe('low');
    expect(quarantineHealth(1000, 300)).toBe('high');
  });
});
