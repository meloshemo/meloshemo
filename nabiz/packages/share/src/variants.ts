/**
 * Paylaşım kartı formatları.
 *
 * Sıralama tesadüfi değil: Türkiye'de yayılım önce WhatsApp'ta olur (docs/13),
 * bu yüzden varsayılan format kare ve rakamlar büyük — küçük önizlemede bile okunur.
 */
export type ShareVariant = 'wa' | 'story' | 'x';

export interface VariantSpec {
  width: number;
  height: number;
  /** Yüzde rakamının punto değeri — okunabilirliğin belirleyicisi. */
  pctSize: number;
  questionSize: number;
  padding: number;
}

export const VARIANTS: Record<ShareVariant, VariantSpec> = {
  wa: { width: 1080, height: 1080, pctSize: 116, questionSize: 56, padding: 72 },
  story: { width: 1080, height: 1920, pctSize: 132, questionSize: 64, padding: 88 },
  x: { width: 1200, height: 675, pctSize: 92, questionSize: 46, padding: 56 },
};

export function isShareVariant(value: string | null): value is ShareVariant {
  return value === 'wa' || value === 'story' || value === 'x';
}

export const DEFAULT_VARIANT: ShareVariant = 'wa';
