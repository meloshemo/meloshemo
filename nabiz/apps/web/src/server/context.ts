import type { Repository } from './repository';
import { MemoryStore } from './memory-store';
import { PostgresStore } from './postgres-store';

let cached: Repository | null = null;

/**
 * Aktif depo. DATABASE_URL varsa Postgres, yoksa (yalnızca geliştirmede) bellek içi depo.
 * Çağıran kod hangisi olduğunu bilmez.
 */
export function getRepository(): Repository {
  if (cached) return cached;

  const url = process.env['DATABASE_URL'];
  if (url) {
    cached = new PostgresStore(url);
  } else {
    // Üretimde bellek içi depo veri kaybı demektir; sessizce bu duruma düşmek yasak.
    // Tek istisna, açıkça istenmesi (uçtan uca testlerin üretim derlemesini çalıştırması):
    // varsayılan kapalıdır, yani kazara üretime böyle çıkılamaz.
    if (process.env.NODE_ENV === 'production' && process.env['ALLOW_MEMORY_STORE'] !== '1') {
      throw new Error('DATABASE_URL üretimde zorunludur');
    }
    cached = new MemoryStore();
  }
  return cached;
}

export function hashSalt(): string {
  const value = process.env['VOTE_HASH_SALT'];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('VOTE_HASH_SALT üretimde zorunludur');
  }
  return 'gelistirme-tuzu';
}

/**
 * İstemci IP'si. Ham hâliyle asla saklanmaz; yalnızca günlük dönen tuzla hash'lenir.
 * Vercel/Cloudflare önündeyken proxy başlığından okunur.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  );
}

export function clientAsn(headers: Headers): number | null {
  const raw = headers.get('cf-asn');
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) ? parsed : null;
}
