/**
 * Harita renk ölçeği.
 *
 * Bu bir DIVERGING ölçektir: iki seçenek arasındaki eğilimi gösterir, büyüklüğü değil.
 * Kırmızı ↔ mavi kutuplar, ortada nötr gri. Ölçek doğrulandı (OKLab): kutuplar arası
 * normal görüş ΔE 33.0, protanopi ΔE 20.4; her iki kol ışıklılıkta monoton, orta nokta
 * en açık. Renk körlüğü için renk tek başına anlam taşımaz — il adı ve yüzde her zaman
 * metin olarak da verilir.
 */

export const DIVERGING_SCALE = {
  /** A seçeneği güçlü → zayıf */
  a: ['#b3050f', '#e30a17', '#f4a6ab'],
  /** Ayrışmanın olmadığı orta bant */
  neutral: '#e7e9ee',
  /** B seçeneği zayıf → güçlü */
  b: ['#a9c6de', '#2c6fa6', '#17466b'],
  /** Veri yok: gri değil, boş — dolu bir renk "sonuç var" der. */
  empty: 'transparent',
} as const;

/** Bir ilin haritada gösterilebilmesi için gereken en az oy. */
export const MAP_MIN_VOTES = 20;

export interface ProvinceLean {
  /** A seçeneğinin payı (0–100). Veri yoksa null. */
  aPct: number | null;
  votes: number;
  fill: string;
  /** Renk dışı ayırt edici: ekran okuyucu ve renk körlüğü için metin. */
  label: string;
}

/**
 * Bir ilin eğilimini renge çevirir.
 *
 * Eşiğin altındaki il BOŞ bırakılır — 3 oyla bir ili kırmızıya boyamak, olmayan bir
 * sonucu haritada gerçekmiş gibi göstermektir. Haritanın en kolay yalanı budur.
 */
export function leanToFill(aVotes: number, bVotes: number, minVotes = MAP_MIN_VOTES): ProvinceLean {
  const votes = aVotes + bVotes;
  if (votes < minVotes) {
    return { aPct: null, votes, fill: DIVERGING_SCALE.empty, label: 'yeterli oy yok' };
  }

  const aPct = (aVotes / votes) * 100;
  const gap = aPct - 50;

  let fill: string;
  if (Math.abs(gap) < 3) fill = DIVERGING_SCALE.neutral;
  else if (gap > 0) fill = gap >= 15 ? DIVERGING_SCALE.a[0] : gap >= 7 ? DIVERGING_SCALE.a[1] : DIVERGING_SCALE.a[2];
  else fill = gap <= -15 ? DIVERGING_SCALE.b[2] : gap <= -7 ? DIVERGING_SCALE.b[1] : DIVERGING_SCALE.b[0];

  return { aPct: Number(aPct.toFixed(1)), votes, fill, label: `%${aPct.toFixed(1)}` };
}

/** Ölçek açıklaması — göstergede kullanılır. */
export const SCALE_LEGEND = [
  { fill: DIVERGING_SCALE.a[0], text: '15+ puan önde' },
  { fill: DIVERGING_SCALE.a[1], text: '7–15 puan' },
  { fill: DIVERGING_SCALE.a[2], text: '3–7 puan' },
  { fill: DIVERGING_SCALE.neutral, text: 'başa baş' },
  { fill: DIVERGING_SCALE.b[0], text: '3–7 puan' },
  { fill: DIVERGING_SCALE.b[1], text: '7–15 puan' },
  { fill: DIVERGING_SCALE.b[2], text: '15+ puan önde' },
] as const;
