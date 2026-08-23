/** Paylaşım metni üretimi — kartın altında ve native share sheet'te aynı metin kullanılır. */

export interface SharePayload {
  question: string;
  options: Array<{ label: string; pct: number }>;
  yourLabel: string | null;
  total: number;
  url: string;
}

/**
 * Her paylaşım metninde ZORUNLU olarak bulunanlar: yüzdeler, toplam oy ve kaynak adres.
 * Rakamsız kart paylaşılmaz — paylaşımı tetikleyen şey merak değil, sonuca itirazdır (docs/13).
 */
export function buildShareText({ question, options, yourLabel, total, url }: SharePayload): string {
  const lines = options.map((o) => `${o.label}: %${o.pct.toFixed(1)}`).join('\n');
  const mine = yourLabel ? `\nBen: ${yourLabel}` : '';
  return `${question}\n\n${lines}${mine}\n\n${total.toLocaleString('tr-TR')} oy · Türkiye seçti. Sen seç.\n${url}`;
}
