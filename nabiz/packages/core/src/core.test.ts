import { describe, expect, it } from 'vitest';
import { computeResults, isCityBreakdownPublishable } from './results';
import { slugify, versusSlug } from './slug';
import { assessTrust, isHardRateLimited, MIN_HUMAN_DECISION_MS } from './abuse';
import { dailySalt, hashIdentifier } from './hash';
import { scanEditorial } from './editorial';
import type { VoteAttempt } from './types';

const noSignals = { sessionVotesLastMinute: 1, ipVotesLastMinute: 1, ipVotesLastHour: 1 };

function attempt(overrides: Partial<VoteAttempt> = {}): VoteAttempt {
  return {
    pollId: 'p1', optionId: 'o1', cityId: 35,
    sessionId: 's1', clientToken: 't1',
    ip: '1.2.3.4', asn: 9121, country: 'TR',
    userAgent: 'Mozilla/5.0 (iPhone)',
    decisionMs: 2500, hadInteraction: true,
    receivedAt: new Date('2026-08-22T20:00:00Z'),
    ...overrides,
  };
}

describe('computeResults', () => {
  it('yüzdeleri tam 100.0 olacak şekilde dağıtır', () => {
    const r = computeResults([
      { optionId: 'a', count: 1 },
      { optionId: 'b', count: 1 },
      { optionId: 'c', count: 1 },
    ]);
    expect(r.reduce((s, o) => s + o.pct, 0)).toBeCloseTo(100, 10);
  });

  it('klasik ikili sonucu doğru hesaplar', () => {
    const r = computeResults([
      { optionId: 'lahmacun', count: 542 },
      { optionId: 'doner', count: 458 },
    ]);
    expect(r.find((o) => o.optionId === 'lahmacun')?.pct).toBe(54.2);
    expect(r.find((o) => o.optionId === 'doner')?.pct).toBe(45.8);
  });

  it('sıfır oyda çökmez ve sıfır döndürür', () => {
    const r = computeResults([{ optionId: 'a', count: 0 }, { optionId: 'b', count: 0 }]);
    expect(r.every((o) => o.pct === 0)).toBe(true);
  });

  it('zor yuvarlama durumlarında da toplam 100.0 kalır', () => {
    for (const counts of [[1, 1, 1, 1, 1, 1, 1], [3, 3, 3], [7, 11, 13, 17], [1, 2, 999997]]) {
      const r = computeResults(counts.map((c, i) => ({ optionId: `o${i}`, count: c })));
      const sum = r.reduce((s, o) => s + Math.round(o.pct * 10), 0);
      expect(sum).toBe(1000);
    }
  });

  it('deterministiktir — aynı girdi aynı çıktıyı verir', () => {
    const input = [{ optionId: 'a', count: 1 }, { optionId: 'b', count: 1 }, { optionId: 'c', count: 1 }];
    expect(computeResults(input)).toEqual(computeResults(input));
  });
});

describe('şehir kırılımı eşiği', () => {
  it('eşik altındaki kırılımı yayınlamaz', () => {
    expect(isCityBreakdownPublishable(7)).toBe(false);
    expect(isCityBreakdownPublishable(100)).toBe(true);
  });
});

describe('slugify', () => {
  it('Türkçe karakterleri doğru çevirir', () => {
    expect(slugify('Künefe')).toBe('kunefe');
    expect(slugify('Çiğ Köfte')).toBe('cig-kofte');
    expect(slugify('İzmir')).toBe('izmir');
    expect(slugify('Isparta')).toBe('isparta');
    expect(slugify('Şalgam  Suyu!')).toBe('salgam-suyu');
  });

  it('versus slug üretir', () => {
    expect(versusSlug('Lahmacun', 'Döner')).toBe('lahmacun-vs-doner');
  });
});

describe('assessTrust', () => {
  it('normal kullanıcıyı tam puanla geçirir', () => {
    const t = assessTrust(attempt(), noSignals);
    expect(t.score).toBe(100);
    expect(t.counted).toBe(true);
    expect(t.challenge).toBe(false);
  });

  it('insanüstü hızlı kararı ve etkileşimsizliği karantinaya alır', () => {
    const t = assessTrust(
      attempt({ decisionMs: MIN_HUMAN_DECISION_MS - 1, hadInteraction: false }),
      noSignals,
    );
    expect(t.reasons).toContain('decision_too_fast');
    expect(t.counted).toBe(false);
  });

  it('yurt dışı oyu tek başına karantinaya almaz', () => {
    const t = assessTrust(attempt({ country: 'DE' }), noSignals);
    expect(t.counted).toBe(true);
  });

  it('veri merkezi ASN + etkileşimsizlik birleşince doğrulama ister', () => {
    const t = assessTrust(attempt({ asn: 16509, hadInteraction: false }), noSignals);
    expect(t.challenge).toBe(true);
  });

  it('oturum hız limitini aşan oyu saymaz', () => {
    const t = assessTrust(attempt(), { ...noSignals, sessionVotesLastMinute: 40 });
    expect(t.reasons).toContain('session_velocity');
  });

  it('puan 0–100 aralığında kalır', () => {
    const t = assessTrust(
      attempt({ decisionMs: 1, hadInteraction: false, userAgent: null, asn: 16509, country: 'US' }),
      { sessionVotesLastMinute: 99, ipVotesLastMinute: 999, ipVotesLastHour: 9999 },
    );
    expect(t.score).toBeGreaterThanOrEqual(0);
    expect(t.score).toBeLessThanOrEqual(100);
  });
});

describe('isHardRateLimited', () => {
  it('sadece aşırı hızda devreye girer', () => {
    expect(isHardRateLimited({ ...noSignals, ipVotesLastMinute: 31 })).toBe(false);
    expect(isHardRateLimited({ ...noSignals, ipVotesLastMinute: 200 })).toBe(true);
  });
});

describe('hashIdentifier', () => {
  it('aynı gün aynı, ertesi gün farklı hash üretir', () => {
    const day1 = new Date('2026-08-22T10:00:00Z');
    const day1b = new Date('2026-08-22T23:59:00Z');
    const day2 = new Date('2026-08-23T00:01:00Z');
    const a = hashIdentifier('1.2.3.4', 'salt', day1);
    const b = hashIdentifier('1.2.3.4', 'salt', day1b);
    const c = hashIdentifier('1.2.3.4', 'salt', day2);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('ham değeri sızdırmaz', () => {
    expect(hashIdentifier('1.2.3.4', 'salt', new Date()).toString('hex')).not.toContain('1.2.3.4');
  });

  it('tuz yoksa hata verir', () => {
    expect(() => hashIdentifier('x', '', new Date())).toThrow();
  });

  it('günlük tuz UTC gününe göre döner', () => {
    expect(dailySalt('s', new Date('2026-08-22T00:00:00Z'))).toBe('s:2026-08-22');
  });
});

describe('scanEditorial', () => {
  it('güvenli soruyu işaretlemez', () => {
    expect(scanEditorial('Lahmacun mu döner mi?')).toHaveLength(0);
  });

  it('siyasi içeriği işaretler', () => {
    expect(scanEditorial('Hangi parti daha iyi?').some((f) => f.kind === 'siyaset')).toBe(true);
  });

  it('hassas kişisel veri talebini işaretler', () => {
    expect(scanEditorial('Maaşın ne kadar?').some((f) => f.kind === 'kisisel-veri')).toBe(true);
  });
});
