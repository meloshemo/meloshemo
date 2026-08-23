import { NextResponse } from 'next/server';
import { computeResults, isCityBreakdownPublishable } from '@nabiz/core';
import { CITIES } from '@nabiz/db';
import { getRepository } from '@/server/context';

export const runtime = 'nodejs';

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const repo = getRepository();

  const poll = await repo.getPollById(id);
  if (!poll) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const national = await repo.getAggregates(id, 0);
  const citySlug = new URL(request.url).searchParams.get('city');
  const cityMeta = citySlug ? CITIES.find((c) => c.slug === citySlug) : undefined;

  let city = null;
  if (cityMeta) {
    const rows = await repo.getAggregates(id, cityMeta.id);
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    if (isCityBreakdownPublishable(total)) {
      city = { cityId: cityMeta.id, citySlug: cityMeta.slug, total, options: computeResults(rows) };
    }
  }

  return NextResponse.json(
    {
      pollId: id,
      total: national.reduce((sum, r) => sum + r.count, 0),
      options: computeResults(national),
      city,
      asOf: new Date().toISOString(),
    },
    // Sonuçlar kısa süreli cache'lenir; canlı akış SSE ile gelir (Faz 2).
    { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=25' } },
  );
}
