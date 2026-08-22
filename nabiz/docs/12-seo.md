# PHASE 12 — SEO & Programmatic SEO

## 12.1 Neden SEO bu üründe kritik
Sosyal medya trafiği tepe yapar ve söner. **Arama trafiği bileşik büyür ve kopyalanamaz.**
Rakiplerin bizi kopyalayamayacağı iki şeyden biri budur (diğeri tarihsel veri).
YouGov Ratings'in ücretsiz sayfaları bu stratejinin kanıtıdır.

## 12.2 URL mimarisi
```
/                                   ana akış
/lahmacun-vs-doner                  ikili karşılaştırma (en yüksek hacim)
/turkiye-en-sevilen-yemek           "en" sorgusu (kategori şampiyonu)
/sehir/izmir                        şehir profili
/sehir/izmir/en-sevilen-yemek       şehir × kategori  ← programmatic omurga
/kategori/tatli
/sezon/yemek-sampiyonasi-2026
/odul/turkiyenin-secimi-2026
/nasil-sayiyoruz                    metodoloji (E-E-A-T sinyali)
```

## 12.3 Programmatic SEO — mantıklı mı? Evet, ama koşullu
Teorik kombinasyon: 81 şehir × 12 kategori = 972 sayfa; buna 500+ ikili karşılaştırma eklenir.
**Ama boş sayfa üretmek doğrudan cezadır (thin content).** Bu yüzden yayın kuralları:

> **Bir sayfa ancak şu eşikleri geçerse `index` edilir:**
> - En az **300 anlamlı oy** (şehir sayfaları için o şehirden en az 100)
> - En az **3 farklı soruda** veri
> - Otomatik üretilmiş en az bir **gerçek içgörü cümlesi**
>   ("İzmir'de Kumru, Türkiye ortalamasının 23 puan üstünde.")
>
> Eşiği geçmeyen sayfa yayında kalır ama `noindex` taşır ve sitemap'e girmez.
> Eşik geçilince otomatik olarak `index`'e döner.

Bu tek kural, programmatic SEO ile spam arasındaki farkın tamamıdır.

## 12.4 Her sayfada bulunması gerekenler
- Tek `<h1>`, gerçek soru cümlesi
- Sonuç tablosu **HTML olarak** (JS ile değil — SSR/ISR zorunlu)
- Toplam oy + son güncelleme tarihi (tazelik sinyali)
- 3–5 satırlık otomatik içgörü metni (şablon değil, veriden türetilmiş)
- İç bağlantılar: aynı kategori, aynı şehir, karşı şehir
- Schema.org: `Question`/`Answer` + `Dataset` + `BreadcrumbList`
- OG/Twitter kartı (dinamik görsel — tıklama oranını iki katına çıkarır)

## 12.5 Hedef sorgular (TR)
"türkiye'nin en sevilen yemeği" · "lahmacun mu döner mi" · "baklava mı künefe mi" ·
"izmir'in en sevilen yemeği" · "türkiye'nin en güzel şehri" · "en sevilen tatlı" …
Bu sorgular düşük rekabetli ve yüksek niyetli; cevabı **canlı sayı** ile veren tek site biz olacağız.

## 12.6 Teknik
Core Web Vitals: LCP < 1.5 sn (kritik CSS inline, font `swap`, resim yok — emoji),
CLS ≈ 0 (sonuç barları için yer önceden ayrılır), INP < 200 ms.
Sitemap günlük otomatik üretilir (yalnız index edilebilir sayfalar), `hreflang` tr/en hazır.
