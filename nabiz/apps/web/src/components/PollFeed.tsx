'use client';

import { useState } from 'react';
import type { Poll } from '@nabiz/core';
import { CityPicker } from './CityPicker';
import { PollCard } from './PollCard';

/** Kaçıncı oydan sonra şehir sorulur (docs/06 §3.4). */
const ASK_CITY_AFTER_VOTES = 3;

/**
 * Akış: kullanıcı oy verdikçe sıradaki soru açılır.
 *
 * Tüm sorular tek seferde gösterilmez — hedef, kullanıcının bir sonraki soruyu görmek için
 * sayfa değiştirmemesi ama aynı anda 10 soruyla da boğulmaması.
 */
export function PollFeed({ polls, cityId }: { polls: Poll[]; cityId: number | null }) {
  const [visible, setVisible] = useState(1);
  const [votes, setVotes] = useState(0);
  const [knownCity, setKnownCity] = useState<number | null>(cityId);
  const [citySkipped, setCitySkipped] = useState(false);

  const askCity = knownCity === null && !citySkipped && votes >= ASK_CITY_AFTER_VOTES;

  return (
    <>
      {polls.slice(0, visible).map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          cityId={knownCity}
          onVoted={() => {
            setVotes((v) => v + 1);
            setVisible((v) => Math.min(v + 1, polls.length));
          }}
        />
      ))}

      {askCity && (
        <CityPicker
          onDone={(chosen) => {
            if (chosen === null) setCitySkipped(true);
            else setKnownCity(chosen);
          }}
        />
      )}

      {visible >= polls.length && polls.length > 0 && (
        <p className="cta">Bugünlük sorular bitti. Yarın yenileri geliyor.</p>
      )}
    </>
  );
}
