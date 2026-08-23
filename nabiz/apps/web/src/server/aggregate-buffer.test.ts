import { describe, expect, it, vi } from 'vitest';
import { AggregateBuffer, type BufferedIncrement } from './aggregate-buffer';

const key = (optionId: string, cityId = 0) => ({ pollId: 'p1', optionId, cityId });

describe('AggregateBuffer', () => {
  it('aynı satıra gelen artışları tek yazmada toplar', async () => {
    const writes: BufferedIncrement[][] = [];
    const buffer = new AggregateBuffer(async (batch) => { writes.push(batch); }, { intervalMs: 5 });

    for (let i = 0; i < 50; i++) buffer.add(key('a'));
    await buffer.flush();

    expect(writes).toHaveLength(1);
    expect(writes[0]).toHaveLength(1);
    expect(writes[0]![0]!.amount).toBe(50);
  });

  it('farklı satırları ayrı tutar', async () => {
    const writes: BufferedIncrement[][] = [];
    const buffer = new AggregateBuffer(async (batch) => { writes.push(batch); }, { intervalMs: 5 });

    buffer.add(key('a'));
    buffer.add(key('b'));
    buffer.add(key('a', 35));
    await buffer.flush();

    expect(writes[0]).toHaveLength(3);
  });

  it('satır sayısı eşiği aşılınca beklemeden yazar', async () => {
    const flush = vi.fn(async () => {});
    const buffer = new AggregateBuffer(flush, { intervalMs: 10_000, maxKeys: 3 });

    buffer.add(key('a'));
    buffer.add(key('b'));
    expect(flush).not.toHaveBeenCalled();

    buffer.add(key('c'));
    await Promise.resolve();
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('yazma başarısız olursa artışlar kaybolmaz', async () => {
    let attempt = 0;
    const buffer = new AggregateBuffer(async () => {
      attempt += 1;
      if (attempt === 1) throw new Error('geçici hata');
    }, { intervalMs: 5 });

    buffer.add(key('a'), 7);
    await buffer.flush();
    expect(buffer.size).toBe(1); // geri kondu

    await buffer.flush();
    expect(buffer.size).toBe(0); // ikinci denemede yazıldı
  });

  it('bekleyen artışlar okuma yolundan görülebilir', async () => {
    const buffer = new AggregateBuffer(async () => {}, { intervalMs: 10_000 });
    buffer.add(key('a'), 3);
    buffer.add(key('a'), 2);
    buffer.add(key('b'));
    buffer.add(key('a', 35));

    const national = buffer.pendingFor('p1', 0);
    expect(national.get('a')).toBe(5);
    expect(national.get('b')).toBe(1);
    expect(buffer.pendingFor('p1', 35).get('a')).toBe(1);
    expect(buffer.pendingFor('baska', 0).size).toBe(0);
  });

  it('yazma sürerken de artışlar görünür kalır — sayı asla geri gitmez', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const buffer = new AggregateBuffer(async () => { await gate; }, { intervalMs: 10_000 });

    buffer.add(key('a'), 4);
    const flushing = buffer.flush();
    // Yazma sürüyor: artış ne tamponda ne veritabanında; yine de görünmeli.
    expect(buffer.pendingFor('p1', 0).get('a')).toBe(4);

    release();
    await flushing;
    expect(buffer.pendingFor('p1', 0).size).toBe(0);
  });

  it('boşken yazma yapmaz', async () => {
    const flush = vi.fn(async () => {});
    await new AggregateBuffer(flush).flush();
    expect(flush).not.toHaveBeenCalled();
  });
});
