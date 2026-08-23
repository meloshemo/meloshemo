import { NextResponse } from 'next/server';
import { getRepository } from '@/server/context';

export const runtime = 'nodejs';

/**
 * Aktif soru akışı (docs/09 `GET /feed`).
 *
 * Sonuç içermez — bilerek: sonucu oy vermeden servis etmek, ürünün tek değiş tokuşunu
 * ("sonucu görmek için bir seçim yap") ortadan kaldırır.
 */
export async function GET(request: Request) {
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(new URL(request.url).searchParams.get('limit') ?? '10', 10) || 10),
  );

  const polls = await getRepository().listLivePolls(limit);

  return NextResponse.json(
    {
      items: polls.map((poll) => ({
        id: poll.id,
        slug: poll.slug,
        question: poll.question,
        category: poll.categorySlug,
        sponsor: poll.sponsorName,
        endsAt: poll.endsAt,
        options: poll.options.map((o) => ({ id: o.id, label: o.label, emoji: o.emoji })),
      })),
    },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
  );
}
