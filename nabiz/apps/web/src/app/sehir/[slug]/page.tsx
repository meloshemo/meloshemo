import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CITIES } from '@nabiz/db';
import { buildCityPage } from '@/server/city-page';
import { getRepository } from '@/server/context';

interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) return { title: 'Bulunamadı' };

  const data = await buildCityPage(getRepository(), city);

  return {
    title: `${city.name} ne diyor?`,
    description: data.insights[0]
      ?? `${city.name}'in tercihleri: canlı sonuçlar ve Türkiye ortalamasından ayrışmalar.`,
    alternates: { canonical: `/sehir/${city.slug}` },
    // Eşiği geçmeyen sayfa yayında kalır ama index'lenmez (docs/12).
    robots: data.indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function CityPage({ params }: Params) {
  const { slug } = await params;
  const city = CITIES.find((c) => c.slug === slug);
  if (!city) notFound();

  const data = await buildCityPage(getRepository(), city);

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
        <div className="live">{city.region}</div>
      </header>

      <h1 className="question">{city.name} ne diyor?</h1>
      <p className="kicker">
        {data.totalVotes.toLocaleString('tr-TR')} oy · {data.distinctPolls} soruda veri
      </p>

      {data.insights.length > 0 && (
        <section className="card">
          <h2 className="section-title">Türkiye’den ayrıştığı yerler</h2>
          <ul className="meta" style={{ paddingLeft: 18 }}>
            {data.insights.map((insight) => <li key={insight}>{insight}</li>)}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="section-title">{city.name} neyi seçti?</h2>
        {data.highlights.length === 0 ? (
          <p className="meta">
            {city.name}’den henüz yeterli oy gelmedi. İlk oyu sen verirsen bu sayfa dolmaya başlar.
          </p>
        ) : (
          <ul className="meta" style={{ paddingLeft: 18 }}>
            {data.highlights.map((h) => (
              <li key={h.slug}>
                <a href={`/${h.slug}`}>{h.question}</a> → {h.cityLeader} %{h.cityPct.toFixed(1)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="disclaimer">
        Şehir sonuçları kullanıcıların kendi beyan ettiği şehre dayanır; konum verisi toplanmaz.
        Bir şehrin kırılımı, o şehirden en az 100 oy gelmeden yayınlanmaz.
      </p>
    </main>
  );
}
