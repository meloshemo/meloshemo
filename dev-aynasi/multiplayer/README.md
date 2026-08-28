# Çevrimiçi yarış (multiplayer) — kurulum ve tasarım

Bu klasör hazır ama **oyuna bağlı değil**: bilgisayarına geçtiğinde tek seferde
bağlanacak şekilde yazıldı. `game.js` tek kişilik ve düello modlarıyla olduğu
gibi çalışmaya devam eder.

## Çalıştırma

```bash
npm install ws
node multiplayer/server.js        # ws://localhost:8787
```

Sonra `index.html` içine `multiplayer/net.js` dosyasını ekle ve `game.js`
içinden bağla (aşağıdaki "Bağlama adımları").

## Kararlar ve nedenleri

**Salonu sunucu üretir.** Sunucu bir tohum (seed) seçer, `maze.js` ile labirenti
üretir ve tohumu istemcilere yollar. Herkes aynı salonu görür; kimse farklı bir
labirent oynamaz.

**"Buldum" kararını sunucu verir.** İstemci yalnızca konumunu bildirir. Dev
aynanın önünde 1,6 saniye duran oyuncuyu sunucu bulmuş sayar. Böylece kimse
tarayıcı konsolundan sahte zafer gönderemez. Ayrıca paketler arası mesafe
`MAX_SPEED` ile sınırlıdır — ışınlanarak aynanın önüne gitmek işe yaramaz.

**Oyuncu renkleri.** Sıraya göre dağıtılır: 1. oyuncu beyaz (senin bildiğin
ışık), sonra kırmızı, mavi, yeşil, mor, turuncu, turkuaz, pembe. Renk sunucudan
gelir; herkes diğerlerini kendi renginde görür.

**Kalabalık salonu büyütür.** Oyuncu sayısı arttıkça salon genişler:

| Oyuncu | Salon (I. oda) | Ayna | Fark |
| --- | --- | --- | --- |
| 1 | 40×40 | 1.630 | tek kişilik odayla aynı |
| 2 | 74×74 | 5.451 | +3.821 |
| 3 | 95×95 | 8.954 | +3.503 |
| 4 | 113×113 | 12.629 | +3.675 |
| 5 | 128×128 | 16.161 | +3.532 |
| 6 | 141×141 | 19.601 | +3.440 |
| 7 | 153×153 | 23.044 | +3.443 |
| 8 | 165×165 | 26.755 | +3.711 |

**Kural:** tek kişilik boyut tabandır (çevrimiçi tek kişi, oyunun kendi
odasıyla birebir aynı salonu görür), her ek oyuncu salona **+3.400 ayna**
ekler. Ayna sayısı ≈ 0,94 × kare sayısı olduğundan gereken kenar uzunluğu
buradan geri hesaplanır.

**Eleme sırasında da orantılı:** oyuncu elendikçe yeni tur aynı formülle
kurulur, yani salon küçülür — 8 kişi 26.755 ayna, 4 kişi 12.629, 2 kişi 5.451.
Salon hep kalan kalabalığa göre ölçülür, sabit kalmaz.

Son oda (XVI · Kaçan Ayna) tabanı 70×70 olduğu için tek kişide bile 4.905
ayna vardır; sekiz kişide 26.755'e çıkar ve ayna ayrıca yer değiştirir.

**Herkes farklı köşeden başlar.** Oyuncular salonun köşelerine ve kenar
ortalarına dağıtılır; yollar kesişir, birbirinizi karanlıkta görürsünüz.
Dev ayna, bütün başlangıçlara yaklaşık eşit uzaklıkta olacak şekilde seçilir
(40 aday arasından mesafe farkı en küçük olan) — kimsenin kapısının önüne
düşmez.

**Eleme usulü.** Her turda dev aynayı bulamayan son oyuncu elenir:
10 kişi girer, tur tur 9, 8, 7... diye azalır, son kalan kazanır. Her tur için
yeni salon üretilir (kalan oyuncu sayısına göre boyutlanır), herkes yeni bir
köşeden başlar. Sunucu mesajları: `gecti`, `elendi`, `tur`, `bitti`.

**Tur süresi.** Her turun bir sınırı var; süre salonun büyüklüğüne göre
hesaplanır (`75 sn + her 110 ayna için 1 sn`, en az 1,5 en çok 5 dakika):

| Oyuncu | Ayna | Tur süresi |
| --- | --- | --- |
| 2 | 5.451 | 2,1 dk |
| 4 | 12.629 | 3,2 dk |
| 6 | 19.601 | 4,2 dk |
| 8 | 26.755 | 5,0 dk |

Oyunculara 60, 30 ve 10 saniye kala `sayac` uyarısı gider. **Son 45 saniyede**
aynayı hâlâ bulamayanlara `isaret` mesajıyla aynanın bulunduğu **5 karelik
kaba bölge** bildirilir — tur kilitlenmez ama ayna doğrudan verilmez.

Süre dolduğunda aynayı bulamayanlar arasından **ona en uzak olan** elenir.
"En uzak" kuş uçuşu değil, duvarlardan geçmeden kaç adım kaldığıdır: gerçekten
en geride kalan gider, dar bir köşede şanssız duran değil.

**Zalim yerleşim.** Turların %30'unda dev ayna adil değil: birine yakın,
ötekine salonun ta öbür ucunda. Kimse rahat etmesin.

**Bulan durmaz, ilerler.** Dev aynayı bulan oyuncu aynadan geçip bir sonraki
bölümün salonuna girer ve orada aramaya başlar; geride kalanlar kendi
salonlarında aramaya devam eder. Herkes yalnızca kendi bölümündeki oyuncuları
görür. Yarış, III. bölümü bitirenlerin sırasına göre sonuçlanır.

**Ağ trafiği.** İstemci saniyede 20 konum paketi yollar, sunucu saniyede 20 kez
herkesin konumunu yayınlar. Paket başına oyuncu başına ~30 bayt; 8 kişilik bir
odada saniyede ~5 KB. Aradaki kareler istemcide yumuşatılır (`net.guncelle`).

## Denetim sonuçları

Sunucu üç senaryoda uçtan uca koşuldu:

- **Sekiz oyunculu turnuva:** 8 → 7 → 6 → 5 → 4 → 3 → 2 → 1 kazanan; her tur
  yeni salon (26.755 → 5.454 ayna), sıralama doğru
- **Süre dolması:** sayaç uyarıları, son düdük işareti ve aynaya adım olarak
  en uzak olanın elenmesi doğrulandı
- **Bağlantı kopması:** oyuncu ortada ayrılınca tur kilitlenmiyor, ayrılan
  sıralamaya "ayrıldı" olarak yazılıyor
- **Geç katılım:** yarış başladıktan sonra katılmak reddediliyor
- **Hile:** ışınlanma hız sınırıyla engelleniyor

## Bağlama adımları (bilgisayarında yapılacak)

1. `index.html`'e ekle: `<script src="multiplayer/net.js"></script>`
2. `game.js` içinde bağlantıyı kur:
   ```js
   const net = Net.connect("ws://localhost:8787", { kod: salonKodu, ad: oyuncuAdi });
   net.on("salon", (s) => { /* s.tohum ve s.boyut ile newRoom çağır, s.decoys'u kullan */ });
   net.on("baslangic", (b) => { /* b.baslarAt anında sayacı başlat */ });
   net.on("buldu", (b) => { /* "X, b.bolumAdi bölümünde dev aynayı buldu" bildirimi */ });
   net.on("bolum", (b) => { /* sen aynadan geçtin: b.tohum/b.boyut ile yeni salonu kur */ });
   net.on("tamamladi", (b) => { /* X oyunu bitirdi, b.sira */ });
   net.on("bitti", (b) => { /* b.siralama ile sonuç tablosu */ });
   ```
3. Oyun döngüsünde: `net.konum(p.x, p.y)` ve `net.guncelle(dt)`.
4. Çizimde: `for (const o of net.oyuncular()) drawFigure(o.x, o.y, 1, 1, 0.8, o.renk)`.
5. Kazanan kararını sunucudan gelen `buldu`/`bitti` mesajlarına bırak; yerel
   `finish()` yalnızca tek kişilik ve düello modunda çalışsın.

## Yayına alırken

- `ws://` yerine `wss://` (TLS) kullan; aksi halde tarayıcı https sayfadan
  bağlanmayı reddeder.
- Sunucuyu bir VPS'te ya da Fly.io/Railway gibi bir yerde çalıştır; WebSocket
  destekleyen herhangi bir Node ortamı yeter.
- Oda kodunu URL'ye koy (`?kod=1234`) ki arkadaşına tek link yollayabilesin.
