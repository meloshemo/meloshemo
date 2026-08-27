# 🪞 Dev Aynası

Türkçedeki **"kendini dev aynasında görmek"** deyiminin oyunlaştırılmış hali.

Karanlık bir panayır aynalı salonundasın. Duvarların tamamı aynadır — bir salonda
2.300'den fazla ayna paneli var ve hepsi birbirinin aynı. Her aynada kendi
yansımanı olduğun boyda görürsün. İçlerinden **yalnızca bir tanesi** seni devasa
gösterir. Oyun, o tek aynayı bulmaktır.

Bağımlılık yok; `index.html` dosyasını tarayıcıda aç.

## Nasıl oynanır

- **Yürü:** `W A S D` veya yön tuşları. Dokunmatikte ekrana basıp parmağını sürükle.
- Yalnızca çevreni görürsün; salonun geri kalanı karanlıktır.
- Bir aynaya yaklaştığında yansıman panelin arkasında belirir. Yansıma
  gerçek bir yansımadır: ayna düzlemine göre simetriğin alınarak çizilir.
- Altın renkli, devasa yansımayı gördüğün an oyun biter.
- **Sezgi (`H`, 3 hak):** bir anlığına dev aynasının yönünü gösterir.
- **Yeni salon (`R`):** yeni tohumla yeni bir labirent.
- Süren tarayıcıda saklanır; en iyi zamanını geçmeye çalış.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Sayfa iskeleti |
| `style.css` | Tema ve yerleşim |
| `maze.js` | Tohumlu labirent üretimi, ayna listesi, dev aynasının seçimi |
| `game.js` | Oyun döngüsü, çarpışma, yansıma çizimi, karanlık, HUD |
| `test.js` | Labirent üretimi regresyon testleri |
| `dev-aynasi-tek-dosya.html` | Her şeyin tek dosyada toplandığı paylaşılabilir sürüm |

## Sunum

- Kadife karanlık zemin, pirinç (altın) detaylar; başlık **Cormorant Garamond**,
  gövde **Jost**, sayaçlar **IBM Plex Mono** ile dizilir.
- Salona "Salona gir" perdesiyle girilir; süre o an başlar.
- Sahnede fenerin sıcak halkası, cam panellerde parlama ve pirinç çerçeve uçları,
  havada toz zerreleri ve ince film greni var.
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
