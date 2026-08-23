'use client';

import { useEffect, useState } from 'react';

export interface SnapshotPoll {
  id: string;
  slug: string;
  total: number;
  options: Array<{ id: string; count: number; pct: number }>;
}

export interface Snapshot {
  totalVotes: number;
  polls: SnapshotPoll[];
  asOf: string;
}

/** Yoklama aralığı. CDN önbelleği 2 sn olduğu için daha sık sormak kaynağa yük bindirmez. */
const BASE_INTERVAL_MS = 4_000;
/** Aynı anda giren herkes aynı saniyede sormasın diye rastgele sapma. */
const JITTER_MS = 1_500;
const MAX_BACKOFF_MS = 60_000;

/**
 * Canlı anlık görüntü.
 *
 * Neden SSE değil de yoklama: 50.000 eşzamanlı kullanıcıda kalıcı bağlantı tutmak
 * sunucu tarafında 50.000 açık soket demektir. Yoklama ise CDN'den karşılanır —
 * kullanıcı sayısı artsa da kaynağa binen yük sabit kalır (2 saniyede bir istek).
 *
 * Üç davranış kuralı:
 *  - Sekme arkadayken yoklama DURUR (pil ve boşuna trafik).
 *  - Her istemci rastgele sapma ile sorar; yoksa herkes aynı anda sorup dalga yaratır.
 *  - Hata hâlinde aralık katlanarak büyür; sunucu zorlanıyorsa istemciler geri çekilir.
 */
export function useLiveSnapshot(): Snapshot | null {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    const delay = () => {
      const base = failures === 0
        ? BASE_INTERVAL_MS
        : Math.min(BASE_INTERVAL_MS * 2 ** failures, MAX_BACKOFF_MS);
      return base + Math.random() * JITTER_MS;
    };

    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(() => void poll(), delay());
    };

    const poll = async () => {
      if (stopped) return;
      if (document.visibilityState === 'hidden') { schedule(); return; }

      try {
        // 'no-store' vermiyoruz: o başlık CDN ve tarayıcı önbelleğini atlar ve
        // her istemciyi kaynağa gönderir — ölçeklenmenin tam tersi.
        const response = await fetch('/api/v1/snapshot');
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as Snapshot;
        failures = 0;
        if (!stopped) setSnapshot(data);
      } catch {
        failures += 1;
      }
      schedule();
    };

    void poll();

    // Sekmeye dönüldüğünde beklemeden tazele: kullanıcı eski sayı görmesin.
    const onVisible = () => { if (document.visibilityState === 'visible') void poll(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return snapshot;
}
