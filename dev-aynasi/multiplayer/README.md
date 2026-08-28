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

| Oyuncu | Salon (I. bölüm) | Yaklaşık ayna |
| --- | --- | --- |
| 1 | 40×40 | ~1.600 |
| 2 | 54×54 | ~2.900 |
| 4 | 82×82 | ~6.700 |
| 8 | 138×138 | **~18.800** |

Her bölümde oda ayrıca %15 büyür. Yani kalabalıkta dev aynayı bulma olasılığı
çok düşer, yarış uzar — istediğin "zorlaştırıp oyunda tutma" etkisi buradan gelir.

**Herkes farklı köşeden başlar.** Oyuncular salonun köşelerine ve kenar
ortalarına dağıtılır; yollar kesişir, birbirinizi karanlıkta görürsünüz.
Dev ayna, bütün başlangıçlara yaklaşık eşit uzaklıkta olacak şekilde seçilir
(40 aday arasından mesafe farkı en küçük olan) — kimsenin kapısının önüne
düşmez.

**Bulan durmaz, ilerler.** Dev aynayı bulan oyuncu aynadan geçip bir sonraki
bölümün salonuna girer ve orada aramaya başlar; geride kalanlar kendi
salonlarında aramaya devam eder. Herkes yalnızca kendi bölümündeki oyuncuları
görür. Yarış, III. bölümü bitirenlerin sırasına göre sonuçlanır.

**Ağ trafiği.** İstemci saniyede 20 konum paketi yollar, sunucu saniyede 20 kez
herkesin konumunu yayınlar. Paket başına oyuncu başına ~30 bayt; 8 kişilik bir
odada saniyede ~5 KB. Aradaki kareler istemcide yumuşatılır (`net.guncelle`).

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
