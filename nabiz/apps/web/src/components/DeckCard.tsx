'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Poll, PollResults } from '@nabiz/core';
import { ResultBars } from './ResultBars';

export interface DeckResult {
  pollSlug: string;
  question: string;
  label: string;
  emoji: string | null;
  yourPct: number;
  agreed: boolean;
}

/** Sonucun ekranda kaldığı süre: tatmin edici ama akışı kesmeyecek kadar. */
const REVEAL_MS = 1700;

type Phase = 'asking' | 'sending' | 'revealing';

/**
 * Destedeki tek kart.
 *
 * Oy verildiğinde kart yerinde sonuca dönüşür, kısa süre görünür ve seçilen tarafa doğru
 * kayarak çıkar; sıradaki soru öne gelir. Sonuçların alt alta birikmesi listeye dönüşüyordu:
 * kullanıcı aşağı kaydırmak zorunda kalıyor ve "sıradaki soru" hissi kayboluyordu.
 */
export function DeckCard({
  poll,
  cityId,
  onDone,
}: {
  poll: Poll;
  cityId: number | null;
  onDone: (result: DeckResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>('asking');
  const [results, setResults] = useState<PollResults | null>(null);
  const [exitTo, setExitTo] = useState<'left' | 'right' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState(false);

  const shownAt = useRef(Date.now());
  const interacted = useRef(false);
  const clientToken = useRef<string>(crypto.randomUUID());
  const pending = useRef<DeckResult | null>(null);

  useEffect(() => {
    const mark = () => { interacted.current = true; };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, mark, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, mark));
  }, []);

  // Sonuç göründükten sonra kart kendiliğinden çıkar. Kullanıcı "Paylaş"a bastıysa
  // (held) beklemeye alınır: paylaşmak isteyen birinden kartı çekip almak kaba olur.
  useEffect(() => {
    if (phase !== 'revealing' || held) return;
    const timer = setTimeout(() => {
      if (pending.current) onDone(pending.current);
    }, REVEAL_MS);
    return () => clearTimeout(timer);
  }, [phase, held, onDone]);

  const vote = useCallback(async (optionId: string, index: number) => {
    if (phase !== 'asking') return;
    setPhase('sending');
    setError(null);

    try {
      const response = await fetch(`/api/v1/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          optionId,
          clientToken: clientToken.current,
          cityId,
          decisionMs: Date.now() - shownAt.current,
          hadInteraction: interacted.current,
        }),
      });

      if (response.ok || response.status === 409) {
        const data = (await response.json()) as { results: PollResults };
        const mine = data.results.options.find((o) => o.optionId === data.results.yourOptionId);
        const leader = [...data.results.options].sort((a, b) => b.pct - a.pct)[0];
        const meta = poll.options.find((o) => o.id === data.results.yourOptionId);

        pending.current = {
          pollSlug: poll.slug,
          question: poll.question,
          label: meta?.label ?? '',
          emoji: meta?.emoji ?? null,
          yourPct: mine?.pct ?? 0,
          agreed: leader?.optionId === data.results.yourOptionId,
        };

        setResults(data.results);
        setExitTo(index === 0 ? 'left' : 'right');
        setPhase('revealing');
        return;
      }

      setError(
        response.status === 429 ? 'Çok hızlı gidiyorsun. Biraz bekle.'
          : response.status === 410 ? 'Bu oylama kapandı.'
          : 'Oy kaydedilemedi. Tekrar dener misin?',
      );
      setPhase('asking');
    } catch {
      setError('Bağlantı kurulamadı. Tekrar dener misin?');
      setPhase('asking');
    }
  }, [cityId, phase, poll]);

  const cityLine = results?.city
    ? results.city.options
        .map((o) => `${poll.options.find((p) => p.id === o.optionId)?.label} %${o.pct.toFixed(1)}`)
        .join(' · ')
    : null;

  return (
    <article
      className={`deck-card${phase === 'revealing' ? ' revealed' : ''}${exitTo && !held ? ` exit-${exitTo}` : ''}`}
      aria-labelledby={`q-${poll.id}`}
    >
      <h2 className="question" id={`q-${poll.id}`}>{poll.question}</h2>
      {poll.sponsorName && <p className="kicker">Sponsorlu içerik · {poll.sponsorName}</p>}

      {results ? (
        <>
          <ResultBars poll={poll} results={results} />
          {cityLine && <p className="meta">📍 Senin şehrin: {cityLine}</p>}
          <p className="meta">
            {results.total.toLocaleString('tr-TR')} oy ·{' '}
            <a href={`/${poll.slug}`}>detay</a> · <a href="/nasil-sayiyoruz">nasıl sayıyoruz?</a>
          </p>
          <div className="actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => { setHeld(true); void share(poll, results); }}
            >
              Paylaş
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => pending.current && onDone(pending.current)}
            >
              Sıradaki →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="choices">
            {poll.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                className="choice"
                disabled={phase === 'sending'}
                onClick={() => void vote(option.id, index)}
              >
                <span className="emoji" aria-hidden="true">{option.emoji}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
          <p className="cta">Sen seç.</p>
        </>
      )}

      {error && <p className="cta" role="alert">{error}</p>}
    </article>
  );
}

async function share(poll: Poll, results: PollResults): Promise<void> {
  const url = `${window.location.origin}/${poll.slug}`;
  const lines = results.options
    .map((o) => `${poll.options.find((p) => p.id === o.optionId)?.label}: %${o.pct.toFixed(1)}`)
    .join('\n');
  const mine = poll.options.find((p) => p.id === results.yourOptionId)?.label;
  const text = `${poll.question}\n\n${lines}\n\nBen: ${mine}\n${results.total.toLocaleString('tr-TR')} oy · Türkiye seçti. Sen seç.\n${url}`;

  const canNativeShare = typeof navigator.share === 'function';
  try {
    if (canNativeShare) await navigator.share({ title: 'Nabız', text, url });
    else await navigator.clipboard.writeText(text);

    void fetch('/api/v1/shares', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pollId: poll.id, channel: canNativeShare ? 'native' : 'copy' }),
      keepalive: true,
    });
  } catch {
    /* kullanıcı paylaşımı iptal etti */
  }
}
