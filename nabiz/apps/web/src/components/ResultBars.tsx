'use client';

import type { Poll, PollResults } from '@nabiz/core';

/** Sonuç barları — hem deste kartında hem soru sayfasında aynı görünmeli. */
export function ResultBars({ poll, results }: { poll: Poll; results: PollResults }) {
  const leader = [...results.options].sort((a, b) => b.pct - a.pct)[0];

  return (
    <div className="results" aria-live="polite">
      {results.options.map((option) => {
        const meta = poll.options.find((o) => o.id === option.optionId);
        const isYours = results.yourOptionId === option.optionId;
        const isLeader = leader?.optionId === option.optionId;

        return (
          <div className="row" key={option.optionId}>
            <div className="row-head">
              <span>
                {meta?.emoji && <span aria-hidden="true">{meta.emoji} </span>}
                {meta?.label}
                {isYours && <span className="you"> · senin oyun</span>}
              </span>
              <span className="pct">%{option.pct.toFixed(1)}</span>
            </div>
            <div className={isLeader ? 'bar lead' : 'bar'}>
              <i style={{ width: `${option.pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
