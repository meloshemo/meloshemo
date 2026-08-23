# PHASE 16 — Scaling & Global

## 16.0 Canlılık ve eşzamanlılık — ölçülmüş mimari

**Hedef:** yoğun saatte ~50.000 eşzamanlı kullanıcı; herkes güncel sayıyı görsün.

### Değişmez kural
> Okuma yolunda veritabanı yükü, kullanıcı sayısından **bağımsızdır**.

İlk tasarım bu kuralı ihlal ediyordu ve yük testinde yakalandı:

| | Önce | Sonra |
|---|---|---|
| 1200 istekte üretilen hesap | **1200** | **3** |
| p50 gecikme | 9.038 ms | **147 ms** |
| Yük 2× olunca | gecikme 3× arttı (27 sn) | hesap 3→4, gecikme doğrusal |
| Gerçekleşen hız | 56 istek/sn (tıkalı) | 300 istek/sn (tam hız) |

Üç kusur vardı, üçü de düzeltildi:

1. **Bağlantı başına yoklama (SSE).** Her açık akış kendi zamanlayıcısıyla veritabanını
   soruyordu: 50.000 bağlantı × 2 sn = **saniyede 25.000 sorgu**. Artık tek bir yayın
   merkezi (`live-hub.ts`) yokluyor ve sonucu tüm abonelere yayıyor.
2. **N+1 sorgu.** Anlık görüntü ucu soru başına ayrı sorgu atıyordu (40 soru = istek
   başına 40 sorgu). Tek sorguya indirildi (`getAllAggregates`).
3. **Cache stampede.** `s-maxage` yalnızca önünde CDN varsa korur. Kaynağa da koruma
   gerekti: `snapshot-cache.ts` tek uçuşlu önbellek — aynı anda gelen 50.000 istek
   **tek** hesap paylaşır, bayat görüntü varsa hesap sürerken o servis edilir.

### İstemci tarafı kuralları
- **Kalıcı bağlantı yerine yoklama.** Arayüz SSE kullanmaz: 50.000 kalıcı soket, sunucuda
  50.000 açık dosya tanıtıcısı demektir. Yoklama CDN'den karşılanır. (SSE ucu API olarak
  durur; düşük trafikli kullanım için geçerlidir.)
- **Rastgele sapma.** Her istemci 4–5,5 sn arası rastgele bir aralıkla sorar; sabit aralık
  olsaydı aynı anda giren herkes aynı saniyede sorup dalga yaratırdı.
- **Arka sekmede durur.** Görünmeyen sekme yoklamaz (pil + boşuna trafik).
- **Hata hâlinde geri çekilir.** Katlanarak artan aralık: sunucu zorlanıyorsa istemciler
  baskıyı azaltır, artırmaz.
- **`cache: 'no-store'` yasak.** O başlık CDN'i atlar ve her istemciyi kaynağa gönderir.

### Yazma yolu
Ham oy (`votes`) **anında ve tek tek** yazılır — dayanıklılığın ve mükerrer oy korumasının
tek kaynağı orasıdır. Türetilmiş sayaçlar (`vote_aggregates`, `vote_timeseries`)
tamponlanır (`aggregate-buffer.ts`): aynı satıra gelen yüzlerce artış tek `+N` güncellemesi
olur. Yoğun anda aynı satırın kilitlenip yazmaların sıraya girmesi böyle önlenir.

Okuma yolu tampondaki bekleyenleri de ekler; yani tamponlama sayıların geride kalması
anlamına gelmez ve kullanıcı kendi oyunu anında görür. Süreç çökerse en fazla birkaç yüz
milisaniyelik sayaç artışı kaybolur ve gece yeniden sayım işi agregaları ham oylardan
zaten yeniden kurar.

### Dürüst sınırlar
- Tek uçuşlu önbellek **süreç içidir**. Birden fazla sunucu örneği varsa her biri kendi
  hesabını yapar: 10 örnek = 2 saniyede 10 hesap. Hâlâ sabit ve küçük, ama tek örnek kadar
  değil. Tek hesaba inmek için paylaşılan bir katman (Redis/Durable Object) gerekir.
- Yukarıdaki rakamlar **tek makinede** ölçüldü (istemci, sunucu ve Postgres aynı CPU).
  Mutlak kapasite değil, **ölçeklenme davranışı** ölçülmüştür. Gerçek kapasite için ayrı
  makineden k6 gerekir.
- 50.000 eşzamanlıda kritik bileşen CDN'dir. CDN'siz bir kurulum (ör. tek VPS, önünde
  önbellek yok) bu sayıyı kaldırmaz.

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
