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
    openGraph: {
      title: poll.question,
      description: labels,
      url: `/${poll.slug}`,
      images: [{ url: `/og/${poll.slug}?variant=x`, width: 1200, height: 675 }],
    },
    twitter: { card: 'summary_large_image', images: [`/og/${poll.slug}?variant=x`] },
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

      {/* Schema.org: sonuç bir soru-cevap olarak işaretlenir; arama sonucunda zengin gösterim sağlar. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildQuestionJsonLd(poll, national, total)) }}
      />

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

/** Sonuçları Schema.org QAPage biçiminde işaretler. */
function buildQuestionJsonLd(
  poll: { question: string; slug: string; options: Array<{ id: string; label: string }> },
  results: Array<{ optionId: string; count: number; pct: number }>,
  total: number,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: poll.question,
      answerCount: results.length,
      upvoteCount: total,
      suggestedAnswer: results.map((option) => ({
        '@type': 'Answer',
        text: `${poll.options.find((o) => o.id === option.optionId)?.label}: %${option.pct.toFixed(1)}`,
        upvoteCount: option.count,
      })),
    },
  };
}
