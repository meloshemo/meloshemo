import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { computeResults, isCityBreakdownPublishable } from '@nabiz/core';
import { CITIES } from '@nabiz/db';
import { PollCard } from '@/components/PollCard';
import { getRepository } from '@/server/context';
import { readCityId } from '@/server/session';

interface Params { params: Promise<{ slug: string }> }

/** SEO: her sorunun kendi indexlenebilir sayfası vardır (docs/12). */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const poll = await getRepository().getPollBySlug(slug);
  if (!poll) return { title: 'Bulunamadı' };

  const labels = poll.options.map((o) => o.label).join(' vs ');
  return {
    title: poll.question,
    description: `${labels} — Türkiye şu anda hangisini seçiyor? Canlı sonuçlar ve şehir kırılımı.`,
    alternates: { canonical: `/${poll.slug}` },
    openGraph: { title: poll.question, description: labels, url: `/${poll.slug}` },
  };
}

export default async function PollPage({ params }: Params) {
  const { slug } = await params;
  const repo = getRepository();
  const poll = await repo.getPollBySlug(slug);
  if (!poll) notFound();

  const cityId = await readCityId();
  const national = computeResults(await repo.getAggregates(poll.id, 0));
  const total = national.reduce((sum, o) => sum + o.count, 0);

  const cityMeta = cityId ? CITIES.find((c) => c.id === cityId) : undefined;
  const cityRows = cityMeta ? await repo.getAggregates(poll.id, cityMeta.id) : [];
  const cityTotal = cityRows.reduce((sum, r) => sum + r.count, 0);

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
        <div className="live"><span className="dot" aria-hidden="true" /> CANLI</div>
      </header>

      <PollCard poll={poll} cityId={cityId} />

      {/* Sunucuda render edilen sonuç metni: arama motorları JS çalıştırmadan da okur. */}
      <section>
        <h2 className="section-title">Şu anki durum</h2>
        <p className="meta">
          {total === 0
            ? 'Bu soruda henüz oy yok. İlk oyu sen ver.'
            : national
                .map((o) => `${poll.options.find((p) => p.id === o.optionId)?.label} %${o.pct.toFixed(1)}`)
                .join(' · ')}
          {total > 0 && ` — toplam ${total.toLocaleString('tr-TR')} oy.`}
        </p>
        {cityMeta && isCityBreakdownPublishable(cityTotal) && (
          <p className="meta">
            {cityMeta.name} kırılımı: {computeResults(cityRows)
              .map((o) => `${poll.options.find((p) => p.id === o.optionId)?.label} %${o.pct.toFixed(1)}`)
              .join(' · ')}
          </p>
        )}
      </section>

      <p className="disclaimer">
        Bilimsel kamuoyu araştırması değildir; sonuçlar platform kullanıcılarının oylarına dayanır.
        Şüpheli oylar filtrelenir ve nihai sayım 24 saat içinde kesinleşir.
      </p>
    </main>
  );
}
