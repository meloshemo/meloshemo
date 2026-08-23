import { PollFeed } from '@/components/PollFeed';
import { getRepository } from '@/server/context';
import { readCityId } from '@/server/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const repo = getRepository();
  const polls = await repo.listLivePolls(10);
  const cityId = await readCityId();

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

      <p className="disclaimer">
        Nabız bilimsel bir kamuoyu araştırması değildir. Tüm sonuçlar platform kullanıcılarının
        oylarına dayanır. Yöntem için <a href="/nasil-sayiyoruz">nasıl sayıyoruz</a> sayfasına bakabilirsin.
      </p>
    </main>
  );
}
