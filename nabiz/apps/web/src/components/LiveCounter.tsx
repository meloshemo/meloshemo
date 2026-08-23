'use client';

import { useEffect, useRef, useState } from 'react';
import { useLiveSnapshot } from './useLiveSnapshot';

/**
 * Toplam oy sayacı — başkaları oy verdikçe artar.
 *
 * Sayı sıçramaz, sayarak ilerler: 1.284.392'den 1.284.418'e ani atlama bir hata gibi
 * görünür; sayarak artış "şu anda insanlar oy veriyor" hissini verir. Ama hareketten
 * rahatsız olan kullanıcı için animasyon tamamen kapanır.
 */
export function LiveCounter({ initial }: { initial: number }) {
  const snapshot = useLiveSnapshot();
  const target = snapshot?.totalVotes ?? initial;
  const [shown, setShown] = useState(initial);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (target === shown) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || Math.abs(target - shown) > 500) { setShown(target); return; }

    const from = shown;
    const started = performance.now();
    const DURATION = 600;

    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / DURATION);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(from + (target - from) * eased));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current) cancelAnimationFrame(frame.current); };
  }, [target, shown]);

  return <b>{shown.toLocaleString('tr-TR')}</b>;
}
