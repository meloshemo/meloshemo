import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { computeResults, leaderOf } from '@nabiz/core';
import { CATEGORIES } from '@nabiz/db';
import { getRepository } from '@/server/context';

interface Params { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: 'Bulunamadı' };

  return {
    title: `Türkiye'nin en sevilen ${category.nameTr.toLocaleLowerCase('tr-TR')}i`,
    description: `${category.nameTr} kategorisinde Türkiye şu anda neyi seçiyor? Canlı sonuçlar.`,
    alternates: { canonical: `/kategori/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) notFound();

  const repo = getRepository();
  const polls = await repo.listPollsByCategory(category.slug);

  const rows = await Promise.all(polls.map(async (poll) => {
    const results = computeResults(await repo.getAggregates(poll.id, 0));
    const leader = leaderOf(results);
    return {
      poll,
      total: results.reduce((sum, r) => sum + r.count, 0),
      leaderLabel: leader ? poll.options.find((o) => o.id === leader.optionId)?.label ?? '' : null,
      leaderPct: leader?.pct ?? 0,
    };
  }));

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="/">NAB<span>I</span>Z</a>
        <div className="live">{category.emoji} {category.nameTr}</div>
      </header>

      <h1 className="question">{category.nameTr} kategorisinde Türkiye ne diyor?</h1>

      <section className="card">
        <ul className="meta" style={{ paddingLeft: 18 }}>
          {rows.map((row) => (
            <li key={row.poll.slug}>
              <a href={`/${row.poll.slug}`}>{row.poll.question}</a>
              {row.total > 0
                ? ` → ${row.leaderLabel} %${row.leaderPct.toFixed(1)} (${row.total.toLocaleString('tr-TR')} oy)`
                : ' → henüz oy yok'}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
