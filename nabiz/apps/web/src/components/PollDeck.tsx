'use client';

import { useCallback, useState } from 'react';
import type { Poll } from '@nabiz/core';
import { CityPicker } from './CityPicker';
import { DeckCard, type DeckResult } from './DeckCard';

const ASK_CITY_AFTER_VOTES = 3;

/**
 * Soru destesi.
 *
 * Aynı anda tek soru görünür; oy verilen kart kayarak çıkar, arkasındaki öne gelir.
 * Kartların alt alta birikmesi ekranı bir listeye çeviriyor, "sıradaki soru" hissini
 * öldürüyordu — oysa ürünün tek işi kullanıcıyı bir sonraki karara taşımak.
 */
export function PollDeck({ polls, cityId }: { polls: Poll[]; cityId: number | null }) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<DeckResult[]>([]);
  const [knownCity, setKnownCity] = useState<number | null>(cityId);
  const [citySkipped, setCitySkipped] = useState(false);

  const advance = useCallback((result: DeckResult) => {
    setPicks((current) => (current.some((p) => p.pollSlug === result.pollSlug)
      ? current
      : [...current, result]));
    setIndex((current) => current + 1);
  }, []);

  const askCity = knownCity === null && !citySkipped && picks.length >= ASK_CITY_AFTER_VOTES;
  const current = polls[index];
  const upcoming = polls.slice(index + 1, index + 3);

  return (
    <>
      {askCity ? (
        <CityPicker
          onDone={(chosen) => {
            if (chosen === null) setCitySkipped(true);
            else setKnownCity(chosen);
          }}
        />
      ) : current ? (
        <div className="deck">
          {/* Arkadaki kartlar yalnızca derinlik hissi için; içerikleri okunmaz. */}
          {upcoming.map((poll, depth) => (
            <div key={poll.id} className="deck-ghost" style={{ '--depth': depth + 1 } as React.CSSProperties} aria-hidden="true" />
          ))}
          <DeckCard key={current.id} poll={current} cityId={knownCity} onDone={advance} />
        </div>
      ) : (
        <section className="card">
          <h2 className="question">Bugünlük bu kadar.</h2>
          <p className="meta">Yarın yeni sorular geliyor. Sonuçlar gece boyunca değişmeye devam eder.</p>
        </section>
      )}

      {picks.length > 0 && <PulseSummary picks={picks} />}
    </>
  );
}

/**
 * Kullanıcının kendi özeti.
 *
 * "Türkiye ile ne kadar uyumlusun" sorusu, verilen oyları kişisel bir sonuca çevirir:
 * ekranda biriken şey bir oy listesi değil, kişinin kendi hakkında öğrendiği bir şey olur.
 * Paylaşımı tetikleyen de budur — insan sonucu değil, kendi konumunu paylaşır.
 */
function PulseSummary({ picks }: { picks: DeckResult[] }) {
  const agreed = picks.filter((p) => p.agreed).length;
  const score = Math.round((agreed / picks.length) * 100);

  const verdict = score >= 80 ? 'Türkiye’nin tam ortasındasın.'
    : score >= 55 ? 'Çoğunlukla çoğunluktasın.'
    : score >= 30 ? 'Yarı yarıya ayrışıyorsun.'
    : 'Sen kendi yolunu çiziyorsun.';

  return (
    <section className="summary" aria-labelledby="summary-title">
      <h2 className="section-title" id="summary-title">Senin nabzın</h2>
      <p className="summary-score">
        <b>%{score}</b> <span>uyum</span>
      </p>
      <p className="meta">{verdict} {picks.length} soruda {agreed} kez çoğunlukla aynı taraftaydın.</p>
      <ul className="chips">
        {picks.map((pick) => (
          <li key={pick.pollSlug} className={pick.agreed ? 'chip agreed' : 'chip'}>
            {pick.emoji && <span aria-hidden="true">{pick.emoji} </span>}
            {pick.label}
            <span className="chip-pct">%{pick.yourPct.toFixed(0)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
