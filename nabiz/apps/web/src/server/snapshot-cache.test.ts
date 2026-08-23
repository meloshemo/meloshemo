import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cached, clearSnapshotCache } from './snapshot-cache';

beforeEach(() => clearSnapshotCache());

describe('snapshot cache', () => {
  it('aynı anda gelen istekler tek hesap paylaşır (stampede olmaz)', async () => {
    const compute = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return 42;
    });

    const results = await Promise.all(
      Array.from({ length: 500 }, () => cached('k', 1_000, compute)),
    );

    expect(compute).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r === 42)).toBe(true);
  });

  it('TTL boyunca hesap tekrarlanmaz', async () => {
    const compute = vi.fn(async () => 1);
    await cached('k', 1_000, compute);
    await cached('k', 1_000, compute);
    await cached('k', 1_000, compute);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('TTL dolunca tazelenir', async () => {
    let value = 1;
    const compute = vi.fn(async () => value);
    expect(await cached('k', 5, compute)).toBe(1);

    await new Promise((r) => setTimeout(r, 15));
    value = 2;
    await cached('k', 5, compute);           // bayatı döndürür, tazeyi arkada hesaplar
    await new Promise((r) => setTimeout(r, 5));
    expect(await cached('k', 5, compute)).toBe(2);
  });

  it('tazelenirken bayat görüntü servis edilir — kullanıcı bekletilmez', async () => {
    let resolveSecond: (v: number) => void = () => {};
    const compute = vi.fn()
      .mockResolvedValueOnce(1)
      .mockImplementationOnce(() => new Promise<number>((resolve) => { resolveSecond = resolve; }));

    expect(await cached('k', 5, compute)).toBe(1);
    await new Promise((r) => setTimeout(r, 15));

    const during = await cached('k', 5, compute); // ikinci hesap sürüyor
    expect(during).toBe(1);

    resolveSecond(2);
  });

  it('farklı anahtarlar birbirini etkilemez', async () => {
    expect(await cached('a', 1_000, async () => 'A')).toBe('A');
    expect(await cached('b', 1_000, async () => 'B')).toBe('B');
  });
});
