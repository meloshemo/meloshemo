'use client';

import { useEffect, useState } from 'react';

export interface LiveCity { cityId: number; fill: string; aPct: number | null; votes: number }

const BASE_INTERVAL_MS = 6_000;
const JITTER_MS = 2_500;
const MAX_BACKOFF_MS = 60_000;

/**
 * Haritayı canlı tutar.
 *
 * Harita ilk çizimde SUNUCUDA render edilir (JavaScript olmadan da çalışsın diye);
 * bu bileşen yalnızca renkleri tazeler — DOM'u yeniden kurmaz, `fill` özniteliğini
 * değiştirir. Böylece 81 yol yeniden çizilmez, tarayıcı sadece boyar.
 */
export function LiveMap({ slug, minVotes }: { slug: string; minVotes: number }) {
  const [asOf, setAsOf] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    const schedule = () => {
      if (stopped) return;
      const base = failures === 0
        ? BASE_INTERVAL_MS
        : Math.min(BASE_INTERVAL_MS * 2 ** failures, MAX_BACKOFF_MS);
      timer = setTimeout(() => void poll(), base + Math.random() * JITTER_MS);
    };

    const poll = async () => {
      if (stopped) return;
      if (document.visibilityState === 'hidden') { schedule(); return; }

      try {
        const response = await fetch(`/api/v1/snapshot/map?soru=${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { cities: LiveCity[]; asOf: string };
        failures = 0;
        if (stopped) return;

        for (const city of data.cities) {
          const path = document.querySelector<SVGPathElement>(`[data-city="${city.cityId}"] path`);
          if (!path) continue;

          if (city.votes >= minVotes) {
            path.classList.remove('no-data');
            path.setAttribute('fill', city.fill);
          }

          const title = path.parentElement?.querySelector('title');
          if (title && city.aPct !== null) {
            title.textContent = `${title.textContent?.split(':')[0]}: %${city.aPct.toFixed(1)}`;
          }
        }
        setAsOf(data.asOf);
      } catch {
        failures += 1;
      }
      schedule();
    };

    void poll();
    const onVisible = () => { if (document.visibilityState === 'visible') void poll(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [slug, minVotes]);

  return (
    <p className="meta" aria-live="polite">
      {asOf
        ? `Harita canlı · son güncelleme ${new Date(asOf).toLocaleTimeString('tr-TR')}`
        : 'Harita canlı'}
    </p>
  );
}
