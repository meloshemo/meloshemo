import { CITIES } from '@nabiz/db';
import { PollDeck } from '@/components/PollDeck';
import { TrendingPulse } from '@/components/TrendingPulse';
import { getRepository } from '@/server/context';
import { readCityId } from '@/server/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const repo = getRepository();
  const polls = await repo.listLivePolls(10);
  const cityId = await readCityId();
  const [trending, champion] = await Promise.all([
    repo.getTrending(5),
    repo.getChampionOfTheDay(),
  ]);

  // Toplam oy sayacı: agregalardan okunur, votes tablosu SAYILMAZ (docs/07 değişmez kuralı).
  let totalVotes = 0;
  for (const poll of polls) {
    const rows = await repo.getAggregates(poll.id, 0);
    totalVotes += rows.reduce((sum, r) => sum + r.count, 0);
  }

  return (
    <main>
      <header className="topbar">
        <div className="wordmark">NAB<span>I</span>Z</div>
        <div className="live"><span className="dot" aria-hidden="true" /> CANLI</div>
      </header>

      <p className="counter">
        Türkiye şu anda neyi seçiyor? · <b>{totalVotes.toLocaleString('tr-TR')}</b> oy
      </p>

      <PollDeck polls={polls} cityId={cityId} />

      <p className="meta">
        🗺️ <a href="/harita">Türkiye tercih haritası</a> — hangi şehir neyi seçiyor?
      </p>

      {cityId !== null && (
        <p className="meta">
          📍 Şehrin: <a href={`/sehir/${CITIES.find((c) => c.id === cityId)?.slug}`}>
            {CITIES.find((c) => c.id === cityId)?.name}
          </a>
        </p>
      )}

      <TrendingPulse items={trending} />

      {champion && (
        <section aria-labelledby="champ-title">
          <h2 className="section-title" id="champ-title">Günün şampiyonu</h2>
          <a className="champion" href={`/${champion.pollSlug}`}>
            <span className="champion-emoji" aria-hidden="true">{champion.emoji ?? '🏆'}</span>
            <span className="champion-body">
              <span className="champion-name">{champion.optionLabel}</span>
              <span className="meta">{champion.question}</span>
            </span>
            <span className="champion-pct">%{champion.pct.toFixed(1)}</span>
          </a>
        </section>
      )}

      <p className="disclaimer">
        Nabız bilimsel bir kamuoyu araştırması değildir. Tüm sonuçlar platform kullanıcılarının
        oylarına dayanır. Yöntem için <a href="/nasil-sayiyoruz">nasıl sayıyoruz</a> sayfasına bakabilirsin.
      </p>
    </main>
  );
}
