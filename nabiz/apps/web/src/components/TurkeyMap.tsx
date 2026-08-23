import { MAP_VIEWBOX, PROVINCES } from '@nabiz/db/tr-map';

export interface ProvinceState {
  fill: string;
  /** Ekran okuyucu ve tarayıcı ipucu metni — renk tek başına anlam taşımaz. */
  title: string;
  href: string;
  selected: boolean;
}

/**
 * Türkiye haritası.
 *
 * Sunucuda render edilir ve her il bir bağlantıdır: JavaScript olmadan da çalışır,
 * arama motoru il sayfalarını buradan bulur, klavye ile gezilebilir. Tıklama sonrası
 * gezinmeyi Next kendi tarafında hızlandırır.
 *
 * Sınır çizgisi her zaman çizilir — dolgusuz (veri yok) iller de haritada görünür;
 * eksik iller haritayı delik deşik gösterirdi.
 */
export function TurkeyMap({ states }: { states: Map<number, ProvinceState> }) {
  return (
    <svg
      className="tr-map"
      viewBox={MAP_VIEWBOX}
      role="img"
      aria-label="Türkiye il haritası — her il o ildeki sonuca göre renklendirilmiştir"
    >
      {PROVINCES.map((province) => {
        const state = states.get(province.id);
        return (
          <a
            key={province.id}
            href={state?.href ?? `/sehir/${province.slug}`}
            className={state?.selected ? 'province selected' : 'province'}
            data-city={province.id}
          >
            <title>{state?.title ?? province.name}</title>
            {/* Veri yoksa inline fill verilmez: CSS'teki nötr taban rengi devreye girer.
                Görünmez bir il haritayı delik gösterir; ölçekteki bir renk ise
                "sonuç bu" der. Taban rengi ikisinden de farklı olmalı. */}
            {state && state.fill !== 'transparent'
              ? <path d={province.d} fill={state.fill} />
              : <path d={province.d} className="no-data" />}
          </a>
        );
      })}
    </svg>
  );
}
