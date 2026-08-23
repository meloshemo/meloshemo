import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CITIES } from '@nabiz/db';
import { CITY_COOKIE, cityCookieOptions } from '@/server/session';

export const runtime = 'nodejs';

const bodySchema = z.object({ cityId: z.number().int().min(1).max(81).nullable() });

/**
 * Kullanıcının beyan ettiği şehir. Konum verisi DEĞİLDİR: kullanıcı seçer, atlayabilir,
 * her zaman değiştirebilir ve `cityId: null` göndererek tamamen silebilir.
 */
export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 422 });
  }

  const city = parsed.cityId === null ? null : CITIES.find((c) => c.id === parsed.cityId);
  if (parsed.cityId !== null && !city) {
    return NextResponse.json({ error: 'unknown_city' }, { status: 422 });
  }

  const response = NextResponse.json({ city: city ? { id: city.id, name: city.name } : null });
  if (city) {
    response.cookies.set(CITY_COOKIE, String(city.id), cityCookieOptions);
  } else {
    response.cookies.delete(CITY_COOKIE);
  }
  return response;
}
