'use client';

import { useState } from 'react';
import type { Poll } from '@nabiz/core';
import { PollCard } from './PollCard';

/**
 * Akış: kullanıcı oy verdikçe sıradaki soru açılır.
 *
 * Tüm sorular tek seferde gösterilmez — hedef, kullanıcının bir sonraki soruyu görmek için
 * sayfa değiştirmemesi ama aynı anda 10 soruyla da boğulmaması (docs/06 §3.4).
 */
export function PollFeed({ polls, cityId }: { polls: Poll[]; cityId: number | null }) {
  const [visible, setVisible] = useState(1);

  return (
    <>
      {polls.slice(0, visible).map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          cityId={cityId}
          onVoted={() => setVisible((v) => Math.min(v + 1, polls.length))}
        />
      ))}
      {visible >= polls.length && polls.length > 0 && (
        <p className="cta">Bugünlük sorular bitti. Yarın yenileri geliyor.</p>
      )}
    </>
  );
}
