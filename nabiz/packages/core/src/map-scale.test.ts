import { describe, expect, it } from 'vitest';
import { DIVERGING_SCALE, leanToFill, MAP_MIN_VOTES } from './map-scale';

describe('leanToFill', () => {
  it('eşiğin altındaki ili boyamaz — olmayan sonucu haritada göstermez', () => {
    const lean = leanToFill(2, 1);
    expect(lean.fill).toBe(DIVERGING_SCALE.empty);
    expect(lean.aPct).toBeNull();
    expect(lean.label).toBe('yeterli oy yok');
  });

  it('eşik tam karşılandığında boyar', () => {
    expect(leanToFill(MAP_MIN_VOTES, 0).fill).toBe(DIVERGING_SCALE.a[0]);
  });

  it('başa baş sonucu nötr bırakır', () => {
    expect(leanToFill(51, 49).fill).toBe(DIVERGING_SCALE.neutral);
  });

  it('eğilim güçlendikçe koyulaşır', () => {
    expect(leanToFill(56, 44).fill).toBe(DIVERGING_SCALE.a[2]);
    expect(leanToFill(60, 40).fill).toBe(DIVERGING_SCALE.a[1]);
    expect(leanToFill(80, 20).fill).toBe(DIVERGING_SCALE.a[0]);
  });

  it('diğer yön için ayna değerler üretir', () => {
    expect(leanToFill(44, 56).fill).toBe(DIVERGING_SCALE.b[0]);
    expect(leanToFill(40, 60).fill).toBe(DIVERGING_SCALE.b[1]);
    expect(leanToFill(20, 80).fill).toBe(DIVERGING_SCALE.b[2]);
  });

  it('renk dışında metin etiketi de üretir (renk tek başına anlam taşımaz)', () => {
    expect(leanToFill(60, 40).label).toBe('%60.0');
  });

  it('sıfır oyda çökmez', () => {
    expect(leanToFill(0, 0).aPct).toBeNull();
  });
});
