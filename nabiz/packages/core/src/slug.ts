const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', i: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
};

/**
 * Türkçe karakterleri doğru karşılıklarıyla değiştiren slug üretici.
 * Not: JavaScript'in varsayılan toLowerCase()'i 'I' → 'i' dönüşümünü Türkçe kurallarına
 * göre yapmaz; bu yüzden harf eşlemesi küçültmeden ÖNCE uygulanır.
 */
export function slugify(input: string): string {
  return input
    .split('')
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

/** İki seçenekli sorular için kanonik slug: 'lahmacun-vs-doner'. */
export function versusSlug(a: string, b: string): string {
  return `${slugify(a)}-vs-${slugify(b)}`;
}
