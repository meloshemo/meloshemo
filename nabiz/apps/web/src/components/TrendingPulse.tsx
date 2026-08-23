import type { TrendingEntry } from '@/server/repository';
import { PulseLine } from './PulseLine';

/**
 * "Şu anda yükselenler" bölümü.
 *
 * Her satır bir çekişmeyi anlatır: kim, kime karşı, hangi yönde. Sadece yüzde ve yeşil
 * bir rakam göstermek, listeyi bir tabloya çevirir; buradaki amaç merak uyandırmak.
 */
export function TrendingPulse({ items }: { items: TrendingEntry[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="trend-title">
      <h2 className="section-title" id="trend-title">Nabız yükseliyor</h2>
      <ul className="pulse-list">
        {items.map((item) => (
          <li key={`${item.pollSlug}-${item.optionLabel}`}>
            <a className="pulse-row" href={`/${item.pollSlug}`}>
              <span className="pulse-copy">
                <span className="pulse-name">
                  {item.emoji && <span aria-hidden="true">{item.emoji} </span>}
                  {item.optionLabel}
                </span>
                {item.rivalLabel && (
                  <span className="pulse-rival">{item.rivalLabel} karşısında öne geçiyor</span>
                )}
              </span>
              <span className="pulse-graph">
                <PulseLine series={item.series} rising={item.deltaPoints > 0} />
                <span className="pulse-figures">
                  <b>%{item.currentPct.toFixed(1)}</b>
                  <span className="pulse-delta">▲ {item.deltaPoints.toFixed(1)}</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
