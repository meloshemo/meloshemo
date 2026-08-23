import type { MetadataRoute } from 'next';
import { CATEGORIES, CITIES } from '@nabiz/db';
import { buildCityPage } from '@/server/city-page';
import { getRepository } from '@/server/context';

const base = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000';

// Eşikler oy geldikçe değişir; sitemap build anında dondurulamaz.
export const dynamic = 'force-dynamic';

/**
 * Sitemap'e YALNIZCA eşiği geçen sayfalar girer (docs/12).
 * 81 şehir sayfasını gerçek veri gelmeden listelemek, arama motoruna binlerce boş sayfa
 * sunmak demektir — programmatic SEO ile spam arasındaki fark tam olarak budur.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = getRepository();
  const polls = await repo.listPublishedPolls();

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/nasil-sayiyoruz`, changeFrequency: 'monthly', priority: 0.3 },
    ...polls.map((poll) => ({
      url: `${base}/${poll.slug}`,
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    })),
    ...CATEGORIES.map((category) => ({
      url: `${base}/kategori/${category.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  ];

  for (const city of CITIES) {
    const data = await buildCityPage(repo, city);
    if (data.indexable) {
      entries.push({ url: `${base}/sehir/${city.slug}`, changeFrequency: 'daily', priority: 0.6 });
    }
  }

  return entries;
}
