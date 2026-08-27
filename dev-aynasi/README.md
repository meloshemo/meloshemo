# 🪞 Dev Aynası

Türkçedeki **"kendini dev aynasında görmek"** deyiminin oyunlaştırılmış hali.

Karanlık bir panayır aynalı salonundasın. Duvarların tamamı aynadır — bir salonda
2.300'den fazla ayna paneli var ve hepsi birbirinin aynı. Her aynada kendi
yansımanı olduğun boyda görürsün. İçlerinden **yalnızca bir tanesi** seni devasa
gösterir. Oyun, o tek aynayı bulmaktır.

Bağımlılık yok; `index.html` dosyasını tarayıcıda aç.

## Bölümler

Dev aynayı bulduğunda **aynanın içinden geçip** bir sonraki odaya girersin;
her odanın ışığı ve rengi farklıdır. Süre kaldığı yerden işler.

| Bölüm | Salon | Işık ve renk | Hedef |
| --- | --- | --- | --- |
| I · Aynalı Salon | 40×40 | kadife mor karanlık | Dev aynayı bul |
| II · Aynanın İçinde | 46×46 | soğuk mavi, cılız ışık, 14 çarpık ayna | Gerçek dev aynayı ayırt et |
| III · Kibir Odası | 52×52 | altın-kızıl, en dar ışık, 22 çarpık ayna | Aynayı bul, sonra pirinç kapıya dön |

**Çarpık aynalar** seni bir tık büyük, yayvan, uzun ya da küçük gösterir; gerçek dev
ayna altın rengiyle parlar. **Sıcak iz:** dev aynanın beş kare çevresindeki camların
çerçevesi altın vurur.

## Nasıl oynanır

- **Tek kişi:** `W A S D` veya yön tuşları, `H` sezgi. Dokunmatikte parmağını sürükle.
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
