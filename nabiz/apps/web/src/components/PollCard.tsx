'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Poll, PollResults } from '@nabiz/core';
import { buildShareText } from '@nabiz/share';
import { useLiveSnapshot } from './useLiveSnapshot';

interface Props {
  poll: Poll;
  /** Sayfa açılışında zaten bilinen sonuç (oy verilmişse). */
  initialResults?: PollResults | null;
  cityId?: number | null;
  onVoted?: () => void;
}

type Phase = 'asking' | 'sending' | 'result';

export function PollCard({ poll, initialResults = null, cityId = null, onVoted }: Props) {
  const [phase, setPhase] = useState<Phase>(initialResults ? 'result' : 'asking');
  const [results, setResults] = useState<PollResults | null>(initialResults);
  const [error, setError] = useState<string | null>(null);

  const shownAt = useRef<number>(Date.now());
  const interacted = useRef(false);
  const clientToken = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    // Gerçek etkileşim sinyali: bot tespitinin en ucuz ve en az müdahaleci girdisi.
    const mark = () => { interacted.current = true; };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, mark, { once: true, passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, mark));
  }, []);

  const vote = useCallback(async (optionId: string) => {
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

      // 409 = bu oturum zaten oy vermiş; sunucu yine de sonucu döner, kullanıcı sonucu görür.
      if (response.ok || response.status === 409) {
        const data = (await response.json()) as { results: PollResults };
        setResults(data.results);
        setPhase('result');
        onVoted?.();
        return;
      }

      if (response.status === 429) {
        setError('Çok hızlı gidiyorsun. Bir dakika sonra tekrar dene.');
      } else if (response.status === 410) {
        setError('Bu oylama kapandı.');
      } else {
        setError('Oy kaydedilemedi. Tekrar dener misin?');
      }
      setPhase('asking');
    } catch {
      setError('Bağlantı kurulamadı. Tekrar dener misin?');
      setPhase('asking');
    }
  }, [cityId, onVoted, phase, poll.id]);

  return (
    <section className="card" aria-labelledby={`q-${poll.id}`}>
      <h2 className="question" id={`q-${poll.id}`}>{poll.question}</h2>
      {poll.sponsorName && <p className="kicker">Sponsorlu içerik · {poll.sponsorName}</p>}

      {phase === 'result' && results ? (
        <Results poll={poll} results={results} />
      ) : (
        <>
          <div className="choices">
            {poll.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="choice"
                disabled={phase === 'sending'}
                onClick={() => void vote(option.id)}
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
    </section>
  );
}

function Results({ poll, results: initial }: { poll: Poll; results: PollResults }) {
  const results = useLiveResults(poll.id, initial);
  const label = (optionId: string) =>
    poll.options.find((o) => o.id === optionId)?.label ?? '—';

  return (
    <div>
      <div className="results" aria-live="polite">
        {results.options.map((option, index) => (
          <div className="row" key={option.optionId}>
            <div className="row-head">
              <span>
                {poll.options.find((o) => o.id === option.optionId)?.emoji}{' '}
                {label(option.optionId)}
                {results.yourOptionId === option.optionId && <span className="you"> · senin oyun</span>}
              </span>
              <span className="pct">%{option.pct.toFixed(1)}</span>
            </div>
            <div className={index === 0 ? 'bar' : 'bar alt'}>
              <i style={{ width: `${option.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {results.city && (
        <p className="meta">
          📍 Senin şehrin: {results.city.options
            .map((o) => `${label(o.optionId)} %${o.pct.toFixed(1)}`)
            .join(' · ')} ({results.city.total.toLocaleString('tr-TR')} oy)
        </p>
      )}

      <p className="meta">
        {results.total.toLocaleString('tr-TR')} oy ·{' '}
        {new Date(results.asOf).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })} ·{' '}
        <a href="/nasil-sayiyoruz">nasıl sayıyoruz?</a>
      </p>

      <div className="actions">
        <ShareButton poll={poll} results={results} />
        <a className="btn" href={`/${poll.slug}`}>Detay →</a>
      </div>
    </div>
  );
}

/**
 * Sonuç ekranı açıkken canlı güncelleme.
 *
 * Kalıcı bağlantı (SSE) yerine CDN önbellekli anlık görüntü yoklanır. Sebep ölçek:
 * 50.000 eşzamanlı kullanıcıda SSE, sunucuda 50.000 açık soket demektir; yoklama ise
 * kenar önbelleğinden karşılanır ve kaynağa binen yük kullanıcı sayısından bağımsızdır.
 *
 * Akış kurulamazsa arayüz son bilinen sonucu göstermeye devam eder: canlılık bir
 * iyileştirmedir, çalışma şartı değil. Kullanıcının kendi oyu ve şehir kırılımı korunur.
 */
function useLiveResults(pollId: string, initial: PollResults): PollResults {
  const [live, setLive] = useState(initial);
  const snapshot = useLiveSnapshot();

  useEffect(() => {
    setLive(initial);
  }, [initial]);

  useEffect(() => {
    const fresh = snapshot?.polls.find((poll) => poll.id === pollId);
    if (!fresh) return;

    setLive((current) => {
      // Geriye giden bir sayı gösterme: kendi oyumuz anlık görüntüye henüz
      // yansımamış olabilir.
      if (fresh.total < current.total) return current;
      return {
        ...current,
        total: fresh.total,
        options: fresh.options.map((option) => ({
          optionId: option.id, count: option.count, pct: option.pct,
        })),
        asOf: new Date(snapshot!.asOf),
      };
    });
  }, [pollId, snapshot]);

  return live;
}

function ShareButton({ poll, results }: { poll: Poll; results: PollResults }) {
  const share = async () => {
    const url = `${window.location.origin}/${poll.slug}`;
    const text = buildShareText({
      question: poll.question,
      options: results.options.map((o) => ({
        label: poll.options.find((p) => p.id === o.optionId)?.label ?? '',
        pct: o.pct,
      })),
      yourLabel: poll.options.find((p) => p.id === results.yourOptionId)?.label ?? null,
      total: results.total,
      url,
    });

    // Safari/Chrome mobilde native paylaşım sayfası; masaüstünde panoya kopyalama.
    const canNativeShare = typeof navigator.share === 'function';

    try {
      if (canNativeShare) {
        await navigator.share({ title: 'Nabız', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      }
      void fetch('/api/v1/shares', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pollId: poll.id, channel: canNativeShare ? 'native' : 'copy' }),
        keepalive: true,
      });
    } catch {
      /* kullanıcı paylaşımı iptal etti — sessizce geç */
    }
  };

  return <button type="button" className="btn primary" onClick={() => void share()}>Paylaş</button>;
}
