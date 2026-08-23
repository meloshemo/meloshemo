import { createHmac } from 'node:crypto';

/**
 * IP ve oturum tanımlayıcılarını geri döndürülemez şekilde hash'ler.
 *
 * Tuz her gün döner (UTC). Bu bilinçli bir uyum kararıdır: aynı IP'nin dünkü ve bugünkü
 * hash'i farklı olduğu için 24 saati aşan takip teknik olarak imkânsızdır. Bedeli,
 * uzun vadeli abuse korelasyonunun kaybıdır — kabul edilmiş bir takas (bkz. docs/11).
 */
export function dailySalt(baseSalt: string, at: Date): string {
  const day = at.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return `${baseSalt}:${day}`;
}

export function hashIdentifier(value: string, baseSalt: string, at: Date): Buffer {
  if (!baseSalt) throw new Error('VOTE_HASH_SALT tanımlı değil');
  return createHmac('sha256', dailySalt(baseSalt, at)).update(value).digest();
}
