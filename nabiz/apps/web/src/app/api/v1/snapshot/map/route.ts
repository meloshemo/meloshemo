import { NextResponse } from 'next/server';
import { leanToFill } from '@nabiz/core';
import { getRepository } from '@/server/context';
import { cached } from '@/server/snapshot-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_SECONDS = 3;

/**
 * Bir sorunun il kırılımı — haritanın canlı beslemesi.
 *
 * Harita ilk çizimde sunucuda render edilir; bu uç yalnızca renkleri tazeler.
 * Aynı önbellek mantığı: kullanıcı sayısı arttıkça kaynağa binen yük artmaz.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('soru');
  if (!slug) return NextResponse.json({ error: 'soru_required' }, { status: 422 });

  // Soru başına ayrı önbellek anahtarı: aynı haritaya bakan herkes tek hesabı paylaşır.
  const payload = await cached(`snapshot:map:${slug}`, CACHE_SECONDS * 1000, async () => {
    const repo = getRepository();
    const poll = await repo.getPollBySlug(slug);
    if (!poll || poll.status !== 'live') return null;

    const [optionA, optionB] = poll.options;
    if (!optionA || !optionB) return null;

    const breakdown = await repo.getCityBreakdown(poll.id);
    const byCity = new Map<number, { a: number; b: number }>();
    for (const row of breakdown) {
      const bucket = byCity.get(row.cityId) ?? { a: 0, b: 0 };
      if (row.optionId === optionA.id) bucket.a += row.count;
      else if (row.optionId === optionB.id) bucket.b += row.count;
      byCity.set(row.cityId, bucket);
    }

    return {
      slug: poll.slug,
      cities: [...byCity].map(([cityId, bucket]) => {
        const lean = leanToFill(bucket.a, bucket.b);
        return { cityId, fill: lean.fill, aPct: lean.aPct, votes: lean.votes };
      }),
      asOf: new Date().toISOString(),
    };
  });

  if (!payload) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  return NextResponse.json(
    payload,
    {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`,
        'CDN-Cache-Control': `max-age=${CACHE_SECONDS}`,
      },
    },
  );
}
