/**
 * Agregasyon yazma tamponu.
 *
 * Yoğun anda aynı seçeneğe saniyede yüzlerce oy gelir ve her biri `vote_aggregates`
 * üzerinde AYNI satırı günceller. Bu satır kilitlenir ve yazmalar sıraya girer —
 * viral bir dakikada darboğaz burasıdır.
 *
 * Tampon, aynı satıra gelen artışları toplar ve tek `+N` güncellemesi olarak yazar.
 * 300 oy/sn → 300 UPDATE yerine ~4 UPDATE.
 *
 * DAYANIKLILIK: ham oy (`votes` tablosu) ANINDA ve tek tek yazılır — tamponlanan
 * yalnızca türetilmiş sayaçlardır. Süreç çökerse en fazla birkaç yüz milisaniyelik
 * sayaç artışı kaybolur; gece yeniden sayım işi (`runRecount`) agregaları zaten ham
 * oylardan yeniden kurar. Yani kayıp geçicidir, veri kaybı değildir.
 */

export interface AggregateKey {
  pollId: string;
  optionId: string;
  cityId: number;
}

export interface BufferedIncrement extends AggregateKey {
  amount: number;
}

export type FlushFn = (increments: BufferedIncrement[]) => Promise<void>;

export interface BufferOptions {
  /** En geç bu süre sonunda yazılır. */
  intervalMs?: number;
  /** Bu kadar farklı satır birikince beklemeden yazılır. */
  maxKeys?: number;
}

export class AggregateBuffer {
  private pending = new Map<string, BufferedIncrement>();
  /** Yazılmakta olan parti: ne tamponda ne veritabanında olduğu ANI kapatır. */
  private inFlight = new Map<string, BufferedIncrement>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushing: Promise<void> | null = null;

  private readonly intervalMs: number;
  private readonly maxKeys: number;

  constructor(private readonly flushFn: FlushFn, options: BufferOptions = {}) {
    this.intervalMs = options.intervalMs ?? 300;
    this.maxKeys = options.maxKeys ?? 200;
  }

  add(key: AggregateKey, amount = 1): void {
    const id = `${key.pollId}|${key.optionId}|${key.cityId}`;
    const existing = this.pending.get(id);
    if (existing) existing.amount += amount;
    else this.pending.set(id, { ...key, amount });

    if (this.pending.size >= this.maxKeys) {
      void this.flush();
      return;
    }
    if (!this.timer) {
      this.timer = setTimeout(() => void this.flush(), this.intervalMs);
      this.timer.unref?.();
    }
  }

  /** Bekleyen artışları yazar. Eşzamanlı çağrılar aynı yazmayı bekler. */
  async flush(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.flushing) return this.flushing;
    if (this.pending.size === 0) return;

    const batch = [...this.pending.values()];
    for (const item of batch) {
      this.inFlight.set(`${item.pollId}|${item.optionId}|${item.cityId}`, item);
    }
    this.pending = new Map();

    this.flushing = this.flushFn(batch)
      .catch((error) => {
        // Yazma başarısızsa artışlar geri konur: sayaç eksik kalmaktansa
        // bir sonraki turda tekrar denenmelidir.
        for (const item of batch) {
          const id = `${item.pollId}|${item.optionId}|${item.cityId}`;
          const existing = this.pending.get(id);
          if (existing) existing.amount += item.amount;
          else this.pending.set(id, item);
        }
        console.error('agregasyon tamponu yazamadı', error);
      })
      .finally(() => {
        this.inFlight = new Map();
        this.flushing = null;
      });

    return this.flushing;
  }

  /**
   * Bir soru/şehir için henüz veritabanına yazılmamış artışlar.
   *
   * Okuma yolu bunu veritabanı değerine ekler; böylece tamponlama sayıları asla
   * geride göstermez ve kullanıcı kendi oyunu anında görür. "Sonuca +1 ekle" gibi
   * bir telafiden farkı: tampon o an yazmış olsa bile iki kez saymaz.
   */
  pendingFor(pollId: string, cityId: number): Map<string, number> {
    const result = new Map<string, number>();
    for (const source of [this.inFlight, this.pending]) {
      for (const item of source.values()) {
        if (item.pollId !== pollId || item.cityId !== cityId) continue;
        result.set(item.optionId, (result.get(item.optionId) ?? 0) + item.amount);
      }
    }
    return result;
  }

  /** Tüm bekleyen artışlar (yazılmakta olanlar dahil). */
  allPending(): BufferedIncrement[] {
    return [...this.inFlight.values(), ...this.pending.values()];
  }

  get size(): number {
    return this.pending.size;
  }
}
