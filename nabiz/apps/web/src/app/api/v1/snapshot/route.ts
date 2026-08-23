import { NextResponse } from 'next/server';
import { computeResults } from '@nabiz/core';
import { getRepository } from '@/server/context';
import { cached } from '@/server/snapshot-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_SECONDS = 2;

/**
 * Tüm canlı soruların anlık görüntüsü — ölçeğin asıl cevabı.
 *
 * İki katman:
 *  1. Kaynakta tek uçuşlu önbellek: aynı anda gelen 50.000 istek TEK hesap paylaşır.
 *     CDN atlansa bile veritabanı yükü sabit kalır.
 *  2. `s-maxage`: CDN varsa istekler kenardan karşılanır, kaynağa 2 saniyede bir uğranır.
 *
 * Sayaçlar tek sorguda okunur; soru başına ayrı sorgu (N+1) yoğun saatte
 * veritabanını tıkayan şeydi.
 */
export async function GET() {
  const payload = await cached('snapshot:national', CACHE_SECONDS * 1000, async () => {
    const repo = getRepository();
    const [polls, aggregates] = await Promise.all([
      repo.listLivePolls(50),
      repo.getAllAggregates(),
    ]);

    const byPoll = new Map<string, Array<{ optionId: string; count: number }>>();
    for (const row of aggregates) {
      const bucket = byPoll.get(row.pollId) ?? [];
      bucket.push({ optionId: row.optionId, count: row.count });
      byPoll.set(row.pollId, bucket);
    }

    const items = polls.map((poll) => {
      // Sayacı olmayan seçenek de sonuçta yer almalı, yoksa yeni soru "seçeneksiz" görünür.
      const counts = poll.options.map((option) => ({
        optionId: option.id,
        count: byPoll.get(poll.id)?.find((row) => row.optionId === option.id)?.count ?? 0,
      }));

      return {
        id: poll.id,
        slug: poll.slug,
        total: counts.reduce((sum, row) => sum + row.count, 0),
        options: computeResults(counts).map((o) => ({ id: o.optionId, count: o.count, pct: o.pct })),
      };
    });

    return {
      totalVotes: items.reduce((sum, item) => sum + item.total, 0),
      polls: items,
      asOf: new Date().toISOString(),
    };
  });

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`,
      'CDN-Cache-Control': `max-age=${CACHE_SECONDS}`,
    },
  });
}
