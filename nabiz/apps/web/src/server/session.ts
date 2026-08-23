import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'nb_sid';
export const CITY_COOKIE = 'nb_city';
const MAX_AGE_DAYS = 180;

function secret(): string {
  const value = process.env['SESSION_SECRET'];
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET üretimde zorunludur (en az 32 karakter)');
  }
  return 'gelistirme-ortami-icin-sabit-anahtar-32+';
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

/** Yeni oturum üretir: kullanılacak kimlik ve imzalı çerez değeri (`<uuid>.<hmac>`). */
export function issueSession(): { id: string; cookieValue: string } {
  const id = randomUUID();
  return { id, cookieValue: `${id}.${sign(id)}` };
}

export function readSessionId(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf('.');
  if (dot <= 0) return null;

  const id = cookieValue.slice(0, dot);
  const provided = Buffer.from(cookieValue.slice(dot + 1));
  const expected = Buffer.from(sign(id));

  // Sabit süreli karşılaştırma: imza doğrulaması zamanlama sızıntısı vermemeli.
  if (provided.length !== expected.length) return null;
  return timingSafeEqual(provided, expected) ? id : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
} as const;

/** Kullanıcının beyan ettiği şehir. Konum verisi DEĞİLDİR; kullanıcı seçer, atlayabilir. */
export async function readCityId(): Promise<number | null> {
  const raw = (await cookies()).get(CITY_COOKIE)?.value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 81 ? parsed : null;
}
