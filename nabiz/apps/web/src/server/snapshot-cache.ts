/**
 * Anlık görüntü önbelleği — tek uçuş (single-flight) ile.
 *
 * `s-maxage` yalnızca ÖNÜNDE bir CDN varsa işe yarar. Kaynağa gelen istekleri de
 * korumak gerekir: aksi hâlde önbellek her tazelendiğinde (veya CDN atlandığında)
 * aynı anda gelen binlerce istek aynı hesabı binlerce kez yapar — "cache stampede".
 *
 * Buradaki kural: aynı anahtar için aynı anda EN FAZLA BİR hesap çalışır. Diğer
 * istekler o hesabın sonucunu bekler. Böylece eşzamanlı kullanıcı sayısı ne olursa
 * olsun veritabanı yükü sabit kalır — 50.000 kullanıcı da 1 kullanıcı da aynı yükü üretir.
 *
 * Süresi dolmuş ama elde olan bir görüntü varsa, yenisi hesaplanırken ESKİSİ servis
 * edilir (stale-while-revalidate): kullanıcı bekletilmez.
 */

interface Entry<T> {
  value: T | null;
  expires: number;
  inFlight: Promise<T> | null;
}

const entries = new Map<string, Entry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = (entries.get(key) as Entry<T> | undefined) ?? { value: null, expires: 0, inFlight: null };
  entries.set(key, entry as Entry<unknown>);

  if (entry.value !== null && entry.expires > now) return entry.value;

  if (!entry.inFlight) {
    entry.inFlight = compute()
      .then((value) => {
        entry.value = value;
        entry.expires = Date.now() + ttlMs;
        return value;
      })
      .finally(() => { entry.inFlight = null; });
  }

  // Elde eski bir görüntü varsa bekletme: bayat veriyi ver, tazesi arkada hesaplansın.
  if (entry.value !== null) return entry.value;
  return entry.inFlight;
}

/** Testler için. */
export function clearSnapshotCache(): void {
  entries.clear();
}
