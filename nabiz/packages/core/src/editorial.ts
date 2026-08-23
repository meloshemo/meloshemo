/**
 * Editoryal güvenlik taraması.
 *
 * Kalıplar bilerek EK ALMAYAN köklerle yazılmıştır: Türkçe sondan eklemeli bir dildir,
 * bu yüzden /\\bmaaş\\b/ kalıbı "maaşın" kelimesini yakalamaz. Kelime sonu sınırı (\\b)
 * yalnızca yanlış eşleşme riski olan kısa köklerde kullanılır.
 *
 * Bu bir moderasyon motoru değil, bir UYARI katmanıdır: yayın kararı her zaman insandadır
 * (polls.editorial_ok). AI ile üretilen taslakların kırmızı bayrakla işaretlenmesi için var.
 */

const BLOCKED_TOPICS: ReadonlyArray<{ kind: string; patterns: RegExp[] }> = [
  {
    kind: 'siyaset',
    patterns: [/\bparti/i, /\bsiyas/i, /\bmilletvekil/i, /\bcumhurbaşkan/i, /\bbelediye başkan/i, /\boy pusulas/i, /\bideoloji/i],
  },
  {
    kind: 'din',
    patterns: [/\bdin(?:i|î|imiz|ler|in)?\b/i, /\bmezhep/i, /\binanç/i, /\bibadet/i, /\bcami/i],
  },
  {
    kind: 'etnik-kimlik',
    patterns: [/\betnik/i, /\bırk(?:ç|s|ı|ta)?/i, /\bmilliyet/i],
  },
  {
    kind: 'kisisel-veri',
    patterns: [/\bmaaş/i, /\bgelirin/i, /\bhastalık/i, /\bcinsel/i, /\btc kimlik/i, /\bkilon/i],
  },
];

export interface EditorialFlag {
  kind: string;
  match: string;
}

export function scanEditorial(...texts: string[]): EditorialFlag[] {
  const haystack = texts.join(' \n ');
  const flags: EditorialFlag[] = [];
  for (const topic of BLOCKED_TOPICS) {
    for (const pattern of topic.patterns) {
      const found = haystack.match(pattern);
      if (found) flags.push({ kind: topic.kind, match: found[0] });
    }
  }
  return flags;
}

/** Editoryal kontrol listesi — admin panelinde hepsi işaretlenmeden yayın yapılamaz. */
export const EDITORIAL_CHECKLIST = [
  'Siyasi parti, lider veya ideoloji içermiyor',
  'Din, etnik köken veya cinsiyet kimliği üzerinden karşılaştırma değil',
  'Kişiye hakaret veya itibar zedeleyici iddia içermiyor',
  'Hassas kişisel veri talep etmiyor',
  'Marka karşılaştırmasında haksız rekabet riski yok',
  'Sponsorluk varsa açıklama etiketi eklendi',
] as const;
