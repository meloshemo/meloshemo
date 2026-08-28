# 🪞 Dev Aynası — Hall of Giants

**Türkçe ve İngilizce.** Tarayıcı dili Türkçe ise oyun Türkçe, değilse İngilizce
açılır; sağ üstteki düğmeyle her an değiştirilebilir. Seçim tarayıcıda saklanır.


Türkçedeki **"kendini dev aynasında görmek"** deyiminin oyunlaştırılmış hali.

Karanlık bir panayır aynalı salonundasın. Duvarların tamamı aynadır — bir salonda
2.300'den fazla ayna paneli var ve hepsi birbirinin aynı. Her aynada kendi
yansımanı olduğun boyda görürsün. İçlerinden **yalnızca bir tanesi** seni devasa
gösterir. Oyun, o tek aynayı bulmaktır.

Bağımlılık yok; `index.html` dosyasını tarayıcıda aç.

## Bölümler

Dev aynayı bulduğunda **içine yürüyerek** bir sonraki odaya girersin; her odanın
ışığı, rengi ve kuralı farklıdır. Süre kaldığı yerden işler.

| Oda | Salon | Kural |
| --- | --- | --- |
| I · Aynalı Salon | 40×40 | Dev aynayı bul ve içine yürü |
| II · Aynanın İçinde | 46×46 | 14 çarpık sahte dev arasından gerçeğini ayır |
| III · Ters Salon | 48×48 | Kontroller aynalandı: sola bastığında sağa gidersin |
| IV · Kayan Aynalar | 50×50 | Duvarlar 11 saniyede bir yer değiştirir |
| V · Yankı | 52×52 | Her adımını tersten tekrar eden ikiz; değerse başa dönersin |
| VI · Kibir Odası | 54×54 | Aynayı bul, sonra sönen fenerle kapıya dön |

**Çarpık aynalar** seni bir tık büyük, yayvan, uzun ya da küçük gösterir; gerçek dev
ayna altın rengiyle parlar. **Sıcak iz:** dev aynanın beş kare çevresindeki camların
çerçevesi altın vurur. **Dev ayna ancak dibinden geçerken parlar** (0,8 kare).

## Ses

Müzik dosyası yok: tüm ses tarayıcıda üretilir (`audio.js`, Web Audio).
Salonun sabit uğultusu, dev aynayı görünce çınlama, aynadan geçiş ve oyun sonu.
`M` ile açılıp kapanır, tercih tarayıcıda saklanır.

Yaklaştıkça hızlanan kalp atışı ve sahte aynadaki cam çatlaması **kaldırıldı**:
ikisi de oyuncuya ipucu veriyordu, oysa sıcak iz zaten bir ipucu.

## Kontroller (bilgisayar)

| | Değer |
| --- | --- |
| Yürüme | 230 birim/sn (3,2 kare/sn) |
| Koşu (`Shift`) | 330 birim/sn (4,6 kare/sn) |
| Tam hıza çıkış | ~95 ms |
| Duruş | ~70 ms (sürtünme 3200) |
| Köşe yardımı | 16 piksel — kapı ağzında takılmayı önler |

Çapraz hareket normalize edilir (çapraz gitmek hızlı değildir), duvara sürtününce
o eksendeki hız sıfırlanır.

## Nasıl oynanır

- **Tek kişi:** `W A S D` veya yön tuşları, `Shift` koş, `H` sezgi. Dokunmatikte parmağını sürükle.
- **Düello (iki kişi, tek klavye):** ekran ikiye bölünür, iki oyuncu **aynı salonda**
  yarışır. 1. oyuncu `W A S D` + `Q` sezgi, 2. oyuncu yön tuşları + `M` sezgi.
  Dev aynayı önce gören kazanır; birbirinizi ışığınız yettiğince görürsünüz.
- **Salon kodu:** her salonun 5 haneli bir kodu var (bitiş ekranında yazar). Aynı kodu
  giren herkes birebir aynı labirenti ve aynı dev aynayı oynar — süreleri
  karşılaştırarak uzaktan da kapışabilirsiniz.
- **Sezgi:** dev aynanın (III. bölümün dönüş ayağında kapının) yönünü bir an gösterir.
- Süren bölüm bazında tarayıcıda saklanır.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Sayfa iskeleti |
| `style.css` | Tema ve yerleşim |
| `maze.js` | Tohumlu labirent üretimi, ayna listesi, dev aynasının seçimi |
| `game.js` | Bölümler, düello, çarpışma, yansıma çizimi, karanlık, HUD |
| `audio.js` | Prosedürel ses: uğultu, kalp atışı, çınlama, cam çatlaması |
| `ikon/` | Uygulama ikonu (SVG + 64/128/256/512/1024 PNG) |
| `i18n.js` | Türkçe/İngilizce metinler ve dil değiştirme |
| `basin/` | Ekran görüntüleri (TR + EN) ve Steam mağaza görselleri |
| `fragman/` | Türkçe ve İngilizce fragman videoları (WebM) |
| `belgeler/` | Gizlilik politikası, kullanım koşulları, basın kiti, Steam metni, lisanslar |
| `belgeler/en/` | Aynı belgelerin İngilizcesi |
| `multiplayer/` | Çevrimiçi yarış sunucusu ve istemcisi (bağlanmayı bekliyor) |
| `test.js` | Labirent üretimi regresyon testleri |
| `dev-aynasi-tek-dosya.html` | Her şeyin tek dosyada toplandığı paylaşılabilir sürüm |

## Sunum

- Kadife karanlık zemin, pirinç (altın) detaylar; başlık **Cormorant Garamond**,
  gövde **Jost**, sayaçlar **IBM Plex Mono** ile dizilir.
- Salona "Salona gir" perdesiyle girilir; süre o an başlar.
- Sahnede fenerin sıcak halkası, cam panellerde parlama ve pirinç çerçeve uçları var.
  Görüntüyü bulandıran toz zerreleri ve film greni kaldırıldı; sahne artık keskin.
- Dev aynasını gördüğün an sahne altın ışıkla dolar, kamera hafifçe yaklaşır ve
  1,6 saniye sonra perde iner.
- Çizim ölçeği en fazla 1.5x tutulur ve yalnızca oyuncunun çevresindeki aynalar
  taranır; bu iki karar kare hızını retina ekranlarda da rahat tutar.
- `prefers-reduced-motion` açık olanlarda toz ve perde animasyonu kapanır.

## Tasarım notları

- Labirent, **recursive backtracker** ile üretilir; sonra karelerin %6'sı kadar
  fazladan duvar kaldırılarak salon çıkmaz sokak yığını olmaktan çıkarılır.
- Dev aynası, başlangıçtan en uzak karelerin (maksimum mesafenin %55'inden
  uzak olanların) duvarlarından biri seçilerek belirlenir — yani ilk on saniyede
  denk gelmez.
- Yansımalar aynanın arkasındaki dar bir banda kırpılır; dev yansıma bandına
  sığmadığı için taşar, "devasa" hissini bu taşma verir.

## Test

```bash
node test.js
```
