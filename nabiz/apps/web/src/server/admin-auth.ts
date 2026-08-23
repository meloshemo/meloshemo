export const ADMIN_COOKIE = 'nb_admin';

/**
 * Admin erişimi.
 *
 * MVP kararı (docs/10'dan bilinçli sapma): admin ayrı bir uygulama değil, aynı Next
 * uygulaması içinde /admin altında ve arama motorlarına kapalı. Gerekçe: tek deploy,
 * sıfır ek altyapı maliyeti. 2FA'lı ayrı admin uygulaması, birden fazla editör olduğu
 * anda gelmeli — tek kişilik ekipte gereksiz karmaşıklık.
 *
 * Kriptografi Web Crypto ile yapılır (node:crypto değil): aynı kod hem Node hem edge
 * runtime'da çalışmalı, çünkü middleware edge'de koşar.
 *
 * Token yalnızca ortam değişkeninden gelir; repoda varsayılan YOKTUR ve tanımlı değilse
 * admin tamamen kapalıdır (fail-closed).
 */
function adminToken(): string | null {
  const token = process.env['ADMIN_TOKEN'];
  return token && token.length >= 24 ? token : null;
}

export function isAdminEnabled(): boolean {
  return adminToken() !== null;
}

async function stamp(token: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(token),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('nabiz-admin-v1'));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Çereze ham token yazılmaz; yalnızca ondan türetilen doğrulanabilir bir damga. */
export async function adminCookieValue(): Promise<string | null> {
  const token = adminToken();
  return token ? stamp(token) : null;
}

/** Sabit süreli karşılaştırma — zamanlama sızıntısı vermemeli. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyAdminCookie(value: string | undefined): Promise<boolean> {
  const expected = await adminCookieValue();
  if (!expected || !value) return false;
  return constantTimeEquals(value, expected);
}

export function verifyAdminToken(candidate: string): boolean {
  const token = adminToken();
  return token !== null && constantTimeEquals(candidate, token);
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 12 * 60 * 60,
} as const;
