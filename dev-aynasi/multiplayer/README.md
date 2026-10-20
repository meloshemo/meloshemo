# Çevrimiçi yarış (multiplayer) — kurulum ve tasarım

Çevrimiçi yarış **oyuna bağlı ve çalışıyor** (1.6.0'dan beri; ana ekrandaki
"Çevrimiçi yarış" düğmesi). Tek kişilik ve düello modları bundan etkilenmez.

Akışın canlı denetimi: `npm run denetim:cevrimici` — sunucuyu başlatır, botları
bağlar ve turnuvanın tek kazanana indiğini doğrular.

## Çalıştırma

```bash
npm install ws
node multiplayer/server.js        # ws://localhost:8787
```

Oyunu aç, "Çevrimiçi yarış" → sunucu adresi, takma ad ve oda kodu gir.

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

| Oyuncu | Salon (I. tur) | Ayna |
| --- | --- | --- |
| 1 | 71×71 | 5.000 |
| 2 | 101×101 | 10.000 |
| 3 | 123×123 | 15.000 |
| 4 | 142×142 | 20.000 |
| 5 | 159×159 | 25.000 |
| 6 | 175×175 | 30.000 |
| 7 | 189×189 | 35.000 |
| 8 | 202×202 | 40.000 |

**Kural iki basamaklıdır:**

1. **Bölüm merdiveni** — I. tur 5.000 ayna, XX. tur 20.000 ayna; aradaki
   turlar düzgün artar.
2. **Kalabalık payı** — her ek oyuncu salona **+5.000 ayna** ekler. İki kişi
   birinci tura girerse salon 5.000 değil 10.000 aynadır; sekiz kişi girerse
   40.000. XX. turda sekiz kişi 55.000 aynaya kadar çıkar.

Ayna sayısı ≈ hücre sayısı olduğundan kenar uzunluğu kökten bulunur; salon
kurulduktan sonra ölçülür ve hedeften %6'dan fazla saparsa kenar düzeltilip
yeniden kurulur (açık galeri, ızgara ve çarşı düzenleri duvar söktüğü için).

**Eleme sırasında da orantılı:** oyuncu elendikçe yeni tur aynı formülle
kurulur, salon küçülür. Ölçek iki yönde de aynıdır.

**Beraberlik.** Bitiriş süreleri 0,3 saniyeden yakınsa "aynı anda" sayılır:
iki oyuncu aynı sırayı paylaşır ve sonraki sıra atlanır (1, 1, 3). Son sırayı
paylaşan birden fazla oyuncu varsa kimse kurayla elenmez — aralarında bir
**beraberlik turu** oynanır, ötekiler doğrudan bir üst tura geçer ve `bekle`
mesajı alır. Beraberlik turu turnuvada basamak saymaz: aynı bölümün yeni bir
salonu kurulur. Herkes aynı anda bitirirse tur olduğu gibi tekrarlanır.

**Tur süresi** salonun büyüklüğüne göre: taban 90 sn + her 90 ayna için 1 sn,
en az 2,5 dakika, en çok 15 dakika. 10.000 aynalı salon ≈ 3,4 dakika;
40.000 aynalı salon ≈ 8,9 dakika.

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
- **Geç katılım:** geri sayım sürerken katılmaya izin verilir (yoksa iki
  kişilik yarış pratikte kurulamıyordu); katılan turun kadrosuna yazılır ve
  salon büyüdüğü için tur süresi de yeniden hesaplanır. Geri sayım bittikten
  sonra katılmak reddedilir.
- **Hile:** ışınlanma hız sınırıyla engelleniyor

## Oyuna bağlanma (tamamlandı)

`index.html` `multiplayer/net.js` dosyasını yüklüyor; `game.js` içindeki
`cevrimiciBaglan()` bağlantıyı kuruyor ve şu mesajları karşılıyor: `salon`,
`baslangic`, `tur`, `oyuncular`, `yakin`, `sezgiYon`, `gecti`, `elendi`,
`sureBitti`, `beraberlik`, `bekle`, `sayac`, `isaret`, `bitti`. Konum her
karede `net.konum()` ile gidiyor, öbür oyuncular `net.oyuncular()` ile
çiziliyor, kazanan kararı tamamen sunucuda.

## Yayına alırken

- `ws://` yerine `wss://` (TLS) kullan; aksi halde tarayıcı https sayfadan
  bağlanmayı reddeder.
- Sunucuyu bir VPS'te ya da Fly.io/Railway gibi bir yerde çalıştır; WebSocket
  destekleyen herhangi bir Node ortamı yeter.
- Oda kodunu URL'ye koy (`?kod=1234`) ki arkadaşına tek link yollayabilesin.
