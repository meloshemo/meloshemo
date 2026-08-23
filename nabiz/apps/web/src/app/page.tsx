import { CITIES } from '@nabiz/db';
import { PollFeed } from '@/components/PollFeed';
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

      <PollFeed polls={polls} cityId={cityId} />

      {cityId !== null && (
        <p className="meta">
          📍 Şehrin: <a href={`/sehir/${CITIES.find((c) => c.id === cityId)?.slug}`}>
            {CITIES.find((c) => c.id === cityId)?.name}
          </a>
        </p>
      )}

      {trending.length > 0 && (
        <section>
          <h2 className="section-title">🔥 Şu anda yükselenler</h2>
          <ul className="meta" style={{ paddingLeft: 18 }}>
            {trending.map((item) => (
              <li key={`${item.pollSlug}-${item.optionLabel}`}>
                <a href={`/${item.pollSlug}`}>{item.optionLabel}</a>{' '}
                <span style={{ color: '#12b76a' }}>+{item.deltaPoints.toFixed(1)} puan</span>{' '}
                <span>· şu an %{item.currentPct.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {champion && (
        <section>
          <h2 className="section-title">🏆 Günün şampiyonu</h2>
          <p className="meta">
            <a href={`/${champion.pollSlug}`}>{champion.question}</a> →{' '}
            <b>{champion.optionLabel}</b> %{champion.pct.toFixed(1)}{' '}
            ({champion.votes.toLocaleString('tr-TR')} oy)
          </p>
        </section>
      )}

      <p className="disclaimer">
        Nabız bilimsel bir kamuoyu araştırması değildir. Tüm sonuçlar platform kullanıcılarının
        oylarına dayanır. Yöntem için <a href="/nasil-sayiyoruz">nasıl sayıyoruz</a> sayfasına bakabilirsin.
      </p>
    </main>
  );
}
