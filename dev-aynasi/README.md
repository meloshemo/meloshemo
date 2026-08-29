# 🪞 Dev Aynası — Hall of Giants

**Türkçe ve İngilizce.** Tarayıcı dili Türkçe ise oyun Türkçe, değilse İngilizce
açılır; sağ üstteki düğmeyle her an değiştirilebilir. Seçim tarayıcıda saklanır.


Türkçedeki **"kendini dev aynasında görmek"** deyiminin oyunlaştırılmış hali.

Karanlık bir panayır aynalı salonundasın. Duvarların tamamı aynadır — bir salonda
2.300'den fazla ayna paneli var ve hepsi birbirinin aynı. Her aynada kendi
yansımanı olduğun boyda görürsün. İçlerinden **yalnızca bir tanesi** seni devasa
gösterir. Oyun, o tek aynayı bulmaktır.

Bağımlılık yok; `index.html` dosyasını tarayıcıda aç.

## Odalar

Dev aynayı bulduğunda **içine yürüyerek** bir sonraki odaya girersin. İlk perde
salonun kendi kuralları, ikinci perde dünya turu: her şehir kendi mekaniğini
getirir. Açtığın odalara ayarlardan geri dönebilirsin.

### I. Perde — Salon
| Oda | Kural |
| --- | --- |
| I · Aynalı Salon | Dev aynayı bul ve içine yürü |
| II · Aynanın İçinde | 14 çarpık sahte dev arasından gerçeğini ayır |
| III · Ters Salon | Kontroller aynalandı: sola bastığında sağa gidersin |
| IV · Kayan Aynalar | Duvarlar 11 saniyede bir yer değiştirir |
| V · Yankı | Her adımını tersten tekrar eden ikiz; değerse başa dönersin |
| VI · Kibir Odası | Kibrin en parlak odası, 24 sahte dev |

### II. Perde — Dünya turu
| Oda | Şehir | Kural |
| --- | --- | --- |
| VII | **Paris** — Aynalar Galerisi | Duvarların %55'i yok, ışık iki katı geniş: saklanacak yer yok, mesafeler uzun |
| VIII | **Venedik** — Su Basmış Salon | Suda yürümek %28 daha ağır; beş saniyede bir yayılan dalga uzaktaki camları bir an aydınlatır |
| IX | **Tokyo** — Neon | Bütün camlar renk değiştirir; dev ayna yanıp sönmez — kalabalıkta duran tek şey odur |
| X | **New York** — Izgara | Her üç karede bir cadde: düz, uzun, birbirinin aynı köşeler |
| XI | **Kahire** — Kum Fırtınası | Görüş sürekli daralıp açılır, kum havada süzülür |
| XII | **İstanbul** — Kapalıçarşı | Uzun çarşı sokakları, 34 sahte dev; aynayı bul ve sönen fenerle kapıya dön |

### III. Perde — Son metropoller ve kaçan ayna
| Oda | Şehir | Kural |
| --- | --- | --- |
| XIII | **Londra** — Sis | Görüş dakikada birkaç kez kapanıp açılır |
| XIV | **Dubai** — Cam Kule | Tek dev kat: açık galeri + ızgara, en uzun mesafeler |
| XV | **Rio** — Karnaval | Renkler döner, duvarlar geçit gibi kayar |
| XVI | **Kaçan Ayna** | Dev ayna 20 saniyede bir başka duvara geçer, yaklaşınca kaçar. Kaçtığı yerde üç saniyelik altın bir iz kalır. Yakalarsan kapıya dön |

**Çarpık aynalar** seni bir tık büyük, yayvan, uzun ya da küçük gösterir; gerçek dev
ayna altın rengiyle parlar. **Sıcak iz:** dev aynanın beş kare çevresindeki camların
çerçevesi altın vurur. **Dev ayna ancak dibinden geçerken parlar** (0,8 kare).

## Sonsuz salon

Giriş perdesindeki **Sonsuz salon** modu bitmeyen bir seri açar: her salon
rastgele bir kural (ters kontrol, kayan duvarlar, yankı, neon, su, fırtına,
ızgara, açık galeri, çarşı — bazen ikisi birden), her salonda biraz daha
büyük bir labirent ve biraz daha dar ışık. Kaç salon geçtiğin sayılır, en iyi
serin tarayıcıda saklanır.

## Dev aynanın yeri

Dev ayna artık hep en uzak köşede değil. Her salonda mesafe bir **kuşak** ile
seçilir: `yakın` (%18–42), `orta` (%40–72), `uzak` (%70–100). Dağılım kabaca
%25 yakın, %45 orta, %30 uzak — yani bazen bir dakikada bulursun, bazen
salonu baştan sona tararsın.

## Tam ekran

**Tam ekran** düğmesi (ya da `F`) oyunu sinematik moda alır: sayfa arayüzü
kaybolur, gösterge üstte ince bir şeride iner, tuval bütün ekranı kaplar.
`Esc` çıkar. Oyuna girdiğinde otomatik olarak bu moda geçilir.

## Yansıma kuralları

Her ayna aynı beş kurala uyar; hiçbir yansıma yarım görünmez ya da panelden
taşıp kesilmez:

1. **Ancak aynanın önündeysen görünürsün.** Panelin yanından geçerken o ayna
   yansıma göstermez (eskiden gösterip kırpıyordu, yarım görüntü kalıyordu).
2. **Yansıma panel boyunca senin hizandadır**, ama panelin kenarından
   taşmayacak şekilde sınırlanır.
3. **Camın arkasındadır ve sana binmez:** derinlik en az figür boyu +
   oyuncu yarıçapı kadardır.
4. **Uzaklık ölçeği:** yaklaştıkça büyür, uzaklaştıkça küçülür (0,62–1,00).
5. **Kırpma bandı figürü tamamen içine alır**, yani görüntü asla kesilmez.
   Camın koyuluğu panelden içeri doğru solar, böylece bant kutu gibi görünmez.
   Dev aynanın panelden geniş olması kasıtlıdır; o taşma kesilme değildir.

## Ayarlar

Sağ üstteki **Ayarlar** düğmesi: parlaklık (0,75–1,35), hareketi azaltma,
açtığın odalar arasında geçiş, oyun içi **gizlilik politikası** ve sürüm no.
Dil düğmesi de aynı satırda. Tüm tercihler tarayıcıda saklanır.

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
- Oyun sessizdir: ses ve müzik yoktur.
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
