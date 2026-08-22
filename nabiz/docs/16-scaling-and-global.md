# PHASE 16 — Scaling & Global

## 16.1 Ölçek eşikleri ve ne kırılır
| Eşik | Kırılan yer | Çözüm (önceden planlı) |
|---|---|---|
| 500 oy/sn | Postgres yazma | DO tamponu zaten devrede — sorun yok |
| 5K oy/sn | DO tek nesne sıcaklığı | Soru başına DO shard (16 shard, periyodik birleştirme) |
| 100M ham oy | `votes` tablo boyutu | Aylık partition + 180 gün sonra düşürme (planlı) |
| 1M eşzamanlı okuyucu | SSE bağlantı sayısı | Edge cache'li 5 sn snapshot'a otomatik düşüş |
| 1000 sayfa/sn tarama | ISR | Tam statik arşiv + CDN |

## 16.2 Internationalization
Mimari gün 0'dan çok dilli: tüm metinler `*_tr` / `*_en` alanlarında, arayüzde `next-intl`,
URL'de dil segmenti (`/en/...`), `hreflang` etiketleri hazır. **Ama İngilizce içerik MVP'de
yayınlanmaz** — yarım çevrilmiş site markayı ucuzlatır.

## 16.3 Global sürüm (Pulse)
Aynı kod tabanı, ülke başına ayrı içerik ve ayrı marka yüzü:
`pulse.xx/us` "What does America choose?" · Almanya, İngiltere, Japonya, Kore.
Kritik ders: **kültürel içerik lokalize edilmeden kopyalanamaz.** Türkiye'de "lahmacun vs döner"
neyse, Japonya'da "kitsune vs tanuki udon" odur; bunu bilen yerel bir editör gerekir.
Bu yüzden global genişleme **ülke başına yerel içerik ortağı** modeliyle yapılır, tek merkezden değil.

## 16.4 Data moat — gerçekten moat mı?
Dürüst cevap: **ilk 12 ay hayır.** Anonim, self-selected oy verisi ticari olarak
"araştırma verisi" değildir. Moat şu üç şey birleşince oluşur:
1. **Zaman** — 3 yıllık zaman serisi kopyalanamaz (rakip bugün başlasa 3 yıl geride)
2. **Kırılım** — 81 il × 12 kategori × zaman
3. **Temizlik** — anti-abuse geçmişi ve şeffaf metodoloji
Bu yüzden `vote_timeseries` ve `entities` tabloları ilk günden doğru tasarlandı: **moat'ı
sonradan inşa edemezsin, ilk gün toplamaya başlaman gerekir.**

Diğer moat'lar (önem sırasıyla): SEO otoritesi > marka > ödül programı ilişkileri >
medya dağıtım ağı > veri. Kod moat değildir; 2 haftada kopyalanır.
