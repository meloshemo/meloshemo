# Değişiklik Günlüğü — Dev Aynası

## 1.9.3 — Çevrimiçi turnuva gerçekten bitiyor
Yayın kontrolü için çevrimiçi akışı ilk kez uçtan uca, gerçek sunucuyla ve
gerçek istemcilerle koşturdum. Birim testleri (18/18) sıralama matematiğini
doğru ölçüyordu ama canlı akışta tur hiç kapanmıyordu.

**Hata:** tur kadrosu (`katilanlar`) ilk oyuncu "hazırım" dediği anda
kapanıyordu. Geri sayım sırasında katılmaya izin vermek 1.7.0'da bilerek
eklenmişti — yoksa iki kişilik yarış kurulamıyordu — ama sonradan katılan
oyuncu kadroya yazılmıyordu. `turOyunculari()` onu saymadığı için "herkes
bitirdi" koşulu hiç gerçekleşmiyor, tur yalnızca **süre dolunca**
kapanıyordu. Dev aynayı bulmak turu bitirmiyordu.

Üç kişilik ölçüm: herkes aynayı buldu (19, 43, 77. saniye), sonra 70 saniye
boyunca hiçbir eleme olmadı, yalnızca süre sayacı uyarıları geldi.

**Düzeltme:** geri sayım sırasında katılan oyuncu tur kadrosuna yazılıyor ve
sezgi hakkını alıyor. Aynı yerde ikinci bir adaletsizlik vardı: salon yeni
oyuncuyla büyüyor (her oyuncu +5.000 ayna) ama **tur süresi büyümüyordu** —
altı kişilik 30.000 aynalık salon, tek kişilik salonun süresiyle oynanıyordu.
Süre artık salonla birlikte yeniden hesaplanıyor.

Düzeltme sonrası aynı ölçüm: 4 kişi → 20.133 ayna, turnuva 4→3→2→1 inip
kazananı belirledi, 3 eleme, tam sıralama.

**Yeni denetim aracı:** `npm run denetim:cevrimici`. Sunucuyu başlatır,
botları bağlar ve beş şeyi doğrular: turnuva tek kazanana iniyor mu, dev
aynayı bulmak turu bitiriyor mu, herkes sıralamaya giriyor mu, salon oyuncu
başına büyüyor mu, eleme sayısı tutarlı mı. Bu hata tam da birim testlerinin
göremediği yerdeydi: kural dosyası doğru, onu uygulayan sunucu yanlıştı.

**Belgeler:** `ROADMAP.md` ve `multiplayer/README.md` hâlâ "multiplayer oyuna
bağlı değil" diyordu (1.1.1'den kalma). İkisi de gerçek duruma çekildi;
ROADMAP artık yayına kalan işleri (sunucu barındırma, imzalama, mağaza)
listeliyor.

## 1.9.2 — Oyun artık gerçekten 60 fps
1.9.1'de kapı ağzı sıçramasını düzelttim ama akışkanlığın peşini bırakmadım.
İkinci ve daha büyük hata ortaya çıktı: **uyarlanabilir çözünürlük
denetleyicisi yanlış sayıya bakıyordu ve görüntüyü boşuna düşürüyordu.**

**Hata:** denetleyiciye *kareler arası süre* veriliyordu. Dikey senkron
(vsync) açıkken bu her zaman 16,7 ms'dir — oyun 4 ms'de çizse bile.
Denetleyici bunu "yetişemiyorum" diye okuyup ölçeği adım adım tabana
indiriyordu. 1.6.0–1.9.1 arasındaki her sürümde, her oyuncuda, oyun
gereksiz yere bulanıklaşıyordu.

Düzeltirken ikinci tuzağa düştüm: yalnızca *karenin kendi iş süresine*
bakmak da yanlış. O yalnızca CPU'yu ölçer; tarayıcının görüntüyü ekrana
basması dışarıda kalır. İş 4 ms görünürken kareler yine düşebiliyordu.

**Doğrusu iki ölçüye birden bakmak:**

- İş süresi bütçeyi (10 ms) aşıyorsa **ya da** kareler ekranın tazeleme
  hızında teslim edilmiyorsa → düş
- Yükselmek için ikisi de rahat olmalı

Ekranın tazeleme aralığı dışarıdan bilinmez; gözlenen en kısa kare aralığı
(alt %10) onu verir — bir kare en hızlı ancak bir tazelemede gelebilir.

**Üçüncü sorun: salınım.** İlk düzeltmeden sonra denetleyici 12 saniyede
8 kez ölçek değiştirdi ("rahatım → yüksel → düştüm → alçal"). Her değişim
görüntüde bir keskinlik oynaması demek — sabit yanlış değerden beterdir.
Çözüm: tutmayan seviye 30 saniye yeniden denenmez, ve yükselmek için üst
üste üç rahat pencere gerekir. Düşmek ise anında olur.

**Ölçülen sonuç** (XX. oda, 20.000 ayna, koşarken, vsync açık):

| Ekran | önce | sonra |
| --- | --- | --- |
| DPR 1 | 60 fps | 60 fps · ölçek 1,0 · 0 değişim |
| DPR 2 | **30 fps** | **60 fps** · ölçek 1,25 · 1 değişim |
| DPR 3 | **30 fps** | **60 fps** · ölçek 1,25 · 3 değişim |

Salınım 12 saniyede 8 değişimden 25 saniyede 2 değişime indi.

**Denetim aracındaki ölçüt de düzeltildi.** Köşe yardımı sınavı "yana kayma
3,84 pikseli geçmesin" diyordu; bu sabit, 16,7 ms'lik bir kare varsayıyor.
Kare uzarsa ileri adım da uzar, ölçüt yanıltır. Artık değişmez olan **orana**
bakıyor: yana kayma / ileri adım ≤ %80.

**Ayrıca sınandı ve temiz çıktı:** köşe yardımı oyuncuyu duvarın içine
itmiyor (483 karede 0 kez), çözünürlük değişiminin kendisi takılma yapmıyor
(değişim karesi 16,6 ms).

## 1.9.1 — Kapı ağızlarındaki kasma
Oyuncu "kasma" dedi, ölçümlerim "ortanca 3,1 ms, kaçak %0,1" diyordu. İkisi
de doğruydu: **ölçtüğüm şey yanlıştı.** Kare süresi akışkanlığı ölçmez,
verimi ölçer. Hareketin düzgünlüğünü ölçünce sorun bir karede çıktı.

**Bulunan hata: köşe yardımı tek karede 16 piksel zıplatıyordu.**

Kapı ağzına birkaç piksel kala takılmamak için oyuncu boşluğun ortasına
doğru kaydırılıyor. Bu kaydırma `dt` ile çarpılmıyordu:

- Tam hızda normal adım 3,84 piksel. Köşe yardımı 16 piksele kadar **anında**
  kaydırıyordu — yana doğru dört katı bir sıçrama. Labirentte koridorlar beş
  kare olduğu için bu, sürekli oluyordu
- `dt` ile çarpılmadığı için **kare hızına bağlıydı**: 144 Hz'lik bir ekranda
  oyuncu 60 Hz'dekinin iki buçuk katı hızla yana çekiliyordu
- Oyundaki tek kare-hızına-bağlı hareket buydu

**Düzeltme:** kaydırma artık o karede *ileri gidilen mesafeye* bağlı ve onun
en fazla %80'i kadar. Yani:

1. Yana kayma ileri adımı asla geçmez → savrulma değil, kapıya doğru yumuşak
   bir yay
2. Kare uzasa da kısalsa da yolun **şekli** değişmez → kare hızından bağımsız
3. Takılan bir karede bile sıçrama olmaz

**Ölçüldü:**

| | önce | sonra |
| --- | --- | --- |
| En büyük yana kayma | 16,00 px | 2,37 px |
| İleri adım (tam hız) | 3,84 px | 3,84 px |
| 60 Hz ↔ 103 Hz farkı | kare hızına bağlı | **0,00 px** |

Aynı yol 60 fps'te 443 px, 103 fps'te 447 px yürünüyor ve en büyük yana
kayma ikisinde de birebir aynı.

**Denetim aracına kalıcı sınav eklendi** (artık 6 denetim): "köşe yardımı
sıçratmıyor — yana kayma ileri adımı geçmemeli". Bu hata bir daha geri
gelirse denetim düşer.

## 1.9.0 — Fareyle yürüme
Karar: **tıkla-git yok, bas-sürükle var.**

Tıkla-git (yol bulma) oyunu bitirirdi. Bu oyunun tamamı karanlıkta koridor
koridor yürümek; yürümeyi bilgisayara devretmek ürünün kendisini kaldırmak
olurdu. Bas-sürükle ise WASD'nin birebir karşılığıdır: göremediğin yere yine
gidemezsin, hızın yine aynı.

- Sol tuşu basılı tut, imlecin yönüne yürürsün. Oyuncu hep ekranın ortasında
  olduğu için "ortadan imlece" yönü doğrudan gitmek istediğin yöndür
- 26 piksellik ölü bölge: imleci oyuncunun üstüne getirince durursun
- Klavyeyle birlikte çalışır, birbirini iptal etmez
- Düelloda kapalı: ekran ikiye bölününce tek imleç iki oyuncuya hizmet edemez
  (dokunmatik denetim de aynı nedenle tek kişilik)
- Oyun sürerken imleç nişangâha dönüşür

**Ölçüldü — fare avantaj vermiyor:**

| | klavye | fare |
| --- | --- | --- |
| Çapraz en yüksek hız | 230 br/sn | 230 br/sn |
| 22,5° en yüksek hız | 230 br/sn | 230 br/sn |

Hız tavanı ikisinde de tam olarak aynı (`SPEED = 230`). Fare 360° yön verir
ama bu hız kazandırmaz: çapraz hareket zaten normalize ediliyor ve koridorlar
bir kare genişliğinde. Yani çevrimiçi turnuvada adaleti bozmuyor.

Sekiz yönde de doğru çalıştığı, ölü bölgenin durdurduğu, giriş perdesi
açıkken oynatmadığı, düğme tıklamalarını yürümeye çevirmediği ve düelloda
kapalı olduğu ayrı ayrı sınandı.

## 1.8.0 — Kendi ayakları üstünde
Proje artık bağımsız: kendi manifesti, kendi araçları, kendi kuralları var ve
deponun geri kalanıyla hiçbir dosyayı paylaşmıyor.

**Temiz proje**

- `package.json`, `.gitignore`, `.editorconfig` eklendi — Dev Aynası'na özgü
- `CLAUDE.md`: kapsam ("`dev-aynasi/` dışına yazma"), çalıştırma komutları,
  değişmez kurallar (ses yok, gerçek ayna simetrisi, ayna sayısına göre salon,
  koridor tavanı, kare düşmemesi) ve "ölçmeden iddia etme"
- Araçlar `arac/` altında toplandı: `sun.js` (yerel sunucu), `paketle.js`,
  `denetim.js` (tek komutla tam otomatik denetim)
- Komutlar: `npm run baslat`, `npm test`, `npm run paketle`,
  `npm run denetim`, `npm run sunucu`, `npm run masaustu`

**Yazı tipleri oyunun içinde**

- Cormorant Garamond, Jost ve IBM Plex Mono artık `yazitipi/` klasöründe
  (latin + latin-ext, 252 KB). Google Fonts'a bağlanılmıyor
- Üç kazanç: çevrimdışı açıldığında da doğru görünüyor, oyuncunun IP adresi
  kimseye gitmiyor, ilk kare yazısız gelmiyor
- Gizlilik politikası güncellendi: "üçüncü taraf **yoktur**" (TR + EN,
  oyun içi metin dahil). Lisans bildirimi SIL OFL dosyalarını adıyla listeliyor
- Tek dosyalık sürüm yazı tiplerini base64 olarak içine gömüyor: tek başına,
  internetsiz, 463 KB

**Çevrimiçi yarış bağlandı**

Sunucu hazırdı ama oyuna bağlı değildi; artık bağlı ve uçtan uca sınandı.

- Giriş perdesinde **Çevrimiçi yarış**: takma ad, oda ve sunucu adresi
  (localStorage'da saklanır)
- Salonu sunucu üretir; istemci aynı tohum **ve aynı dokuyla** birebir aynısını
  kurar. Doku protokole eklendi — onsuz istemci farklı bir labirent üretiyordu
- **Dev aynanın yeri istemciye peşinen gönderilmez**: tarayıcıdan okunup hile
  yapılabilirdi. Oyuncu dört kare yaklaşınca sunucu açıklar; o mesafede bilgi
  zaten işe yaramaz çünkü oyuncu aynayı görüyordur
- **Sezgi oku da sunucudan gelir** (aynı nedenle): hakkı sunucu sayar, yönü
  sunucu söyler
- Rakipler kendi renkleriyle, fenerin yettiği yere kadar görünür; konum
  saniyede 20 kez gidip aradaki kareler yumuşatılır
- Tur, geçiş, eleme, beraberlik, geri sayım ve işaret olayları hedef satırında
  yazılır (TR + EN)

**Çevrimiçi tarafta bulunan iki hata**

- `sezgiYon` ve `yakin` mesajları yanlış değişken adıyla gönderiliyordu
  (`sock` yerine `ws` olmalıydı): sunucu ilk sezgi isteğinde çöküyordu
- **İlk oyuncu "hazırım" der demez oda kapanıyordu**; ikinci oyuncu
  `yaris_basladi` hatası alıp hiç giremiyordu, yani iki kişilik bir yarış
  pratikte kurulamıyordu. Artık geri sayım sürerken katılım açık ve yeni
  gelen biri olursa sayaç uzuyor

**Masaüstü sürümü**

- `masaustu/`: Electron kabuğu + electron-builder yapılandırması
  (Windows .exe/portable, macOS .dmg, Linux .AppImage)
- Oyunun kopyasını tutmaz, projeyi doğrudan açar; paketlendiğinde
  `resources/oyun` yolunu kullanır
- Açılışta beyaz çakma yok, menü çubuğu yok, arka plandayken kare düşmesin
  diye `backgroundThrottling` kapalı, `nodeIntegration` kapalı + sandbox açık

## 1.7.0 — Koridorlar kısaldı, salonlara odacık girdi
Şikâyet yerindeydi ve suçlusu 1.5.1'de eklediğim "düzlük" ayarıydı: salonu
okunaklı yapayım derken **otuz bir kareye kadar dümdüz koridorlar** ürettim.
230 birim/saniye hızla bu, hiçbir şeyin olmadığı on saniyelik bir yürüyüş
demek. I. odada 10 kareden uzun 133 koridor vardı.

- **Koridora tavan kondu:** kazıcı aynı yönde en fazla dört-altı kare
  gidebiliyor (bölüm ilerledikçe azalıyor). Fazladan duvar sökümü de artık
  iki kısa koridoru birleştirip uzun bir yol doğurmuyor — sökmeden önce
  oluşacak koşunun uzunluğuna bakılıyor.
  Sonuç: en uzun koridor **31 → 13-16 kare**, 10+ karelik koridor sayısı
  **133 → 16**
- **Odacıklar:** her salonun içine üç ile beş kare boyunda küçük aynalı
  odalar açılıyor (I. odada 35, XX. odada 101 tane; zeminin ~%5-7'si). Dar
  bir koridordan çıkıp etrafı camla çevrili bir boşluğa giriyorsun
- **Odacığın ortasında ayna sütunu:** dört yüzü de cam olan tek bir kare.
  Boş bir açıklık yalnızca "daha az duvar" olurdu; sütun hem bakacak bir şey
  veriyor hem de etrafından sıkışarak dolaşılıyor — asıl kıskaç bu
- **Odacığın ağzı sayılı:** ilk odalarda üç-dört kapı, son odalarda iki.
  Kapılar tek tek kısılıyor ve her kısmadan sonra o geçidin iki yanının hâlâ
  birbirine ulaştığı doğrulanıyor
- Doku merdiveni yeniden yazıldı: artık "düz mü kıvrımlı mı" değil,
  "ne kadar nefes alıyor" — ilk odalar sık ve geniş ağızlı odacıklarla ferah,
  son odalar seyrek ve iki kapılı odacıklarla sıkışık

**Düzeltmeler bu iş sırasında çıktı:**

- Kapı kısma işlemi ilk hâliyle son odalarda salonun yarısını koparıyordu
  (XV. odada 5.622, XX. odada 7.220 ulaşılamaz kare). Tek bir geçidi kapatmak
  bağlı bir salonu ya bölmez ya da tam ikiye böler; bu yüzden bütün salonu
  taramak yerine yalnızca geçidin iki yanının hâlâ birbirine ulaşıp
  ulaşmadığına bakılıyor. Hem doğru hem çok daha ucuz: oda kurulumu
  **520 ms → 55-87 ms**
- `Maze.baglantiliMi()` eklendi: ayna sütunları dört yanı kapalı kareler
  olduğu için `distances()` onları hep "ulaşılamaz" gösteriyordu ve bu,
  Kayan Aynalar odasının bağlantı kontrolünü bozacaktı
- Testlere dört yeni sınav: sütunlar salonun kenarında olamaz, koridor yirmi
  kareyi geçemez, her salonda odacık açılır, yürünebilir her kareye ulaşılır
  (18 test)

Arama süresi neredeyse aynı kaldı (sezgisiz 8-33 dakika): bu değişiklik
zorluğu değil **ritmi** değiştiriyor.

## 1.6.0 — Kare hiç düşmesin
Ölçümle başladı: tarayıcının kare sürelerini yüzdelik dilimleriyle çıkarınca
görüldü ki yüksek piksel yoğunluğunda (retina ekran) **karelerin %100'ü**
16,7 ms bütçesini aşıyordu — yani hiçbir zaman gerçek 60 fps değildi. Suçlu
ayna sayısı değildi: ekranı baştan sona kaplayan boyamalardı.

- **Fener halesi ve vinyet önbellekten basılıyor.** İkisi de her karede
  ekranın tamamını (1,5× ölçekte 2,3 milyon piksel) radial gradient ile
  gölgelendiriyordu. Artık 320 pikselik bir tuvale bir kez çizilip
  büyütülerek basılıyorlar; ikisi de yumuşak hale olduğu için görüntü aynı
- **Zemin daması tek dolguya indi:** her kareyi ayrı `fillRect` ile boyamak
  yerine iki kare boyunda hazır bir desen kullanılıyor (≈216 çizim → 1)
- **Cam panelleri saydamlığa göre kovalanıp toplu çiziliyor:** geniş ışıklı
  salonlarda (Paris, Dubai) karede iki yüze yakın ayrı çizim çağrısı vardı,
  şimdi onlarca
- **Çizim döngüsünde artık nesne üretilmiyor:** her cam için üretilen ara
  nesneler ve metin anahtarları çöp toplayıcıyı tetikleyip ara sıra 40 ms'lik
  tepeler yapıyordu. Sayısal anahtar ve yeniden kullanılan tek nesne
- **Kayan Aynalar odasındaki takılma giderildi:** her duvar eklemesi için ayrı
  bağlantı taraması yapılıyordu (12.000 hücrelik salonda 300 denemeye kadar).
  Artık duvarlar birlikte konup tek tarama yapılıyor. Ayna sayısı da on binlerce
  nesne üretilerek yeniden sayılmıyor, artımlı tutuluyor — 12 kaymanın
  hepsinde sayaç gerçek sayıyla birebir doğrulandı
- **Kaçan ayna** yeni yerini ararken mesafe haritasını aday başına yeniden
  çıkarıyordu (20.000 hücre × 30 aday); bir kez çıkarılıp hepsinde kullanılıyor
- **Uyarlanabilir çözünürlük.** Oyun kendi kare süresini ölçüyor (60 karede bir
  ortanca ve %85'lik dilim) ve görüntüyü ekranın sürdürebileceği en yüksek
  keskinlikte tutuyor: rahatsa yükseltiyor, bütçeyi zorlarsa düşürüyor.
  Üst sınır ekranın kendi piksel yoğunluğu — güçlü bir ekranda eskisinden
  **daha keskin**. Ayarlar'dan kapatılabilir ("Akıcılık önceliği")

**Ölçülen sonuç** (1280×800, en ağır beş oda):

| | önce | sonra |
| --- | --- | --- |
| Ortanca kare (yoğunluk 1×) | 9,0 ms | 3–5 ms |
| Ortanca kare (yoğunluk 2×) | 19,1 ms | 9–12 ms |
| Bütçeyi aşan kare (2×) | %99–100 | %0–1 |

Görüntü değişmedi: aynı salon kodu ve aynı konumla alınan kareler
piksel piksel karşılaştırıldı — piksellerin **%0,015'i** 8/255'ten fazla
sapıyor (cam çerçevelerinin saydamlık basamağı ve köşe noktalarının tek
yolda birleşmesi).

## 1.5.1 — Labirentin dokusu da sertleşiyor
- **Labirent üreticisine iki ayar eklendi:** *düzlük* (kazıcının aynı yönde
  devam etme eğilimi) ve *ekstra* (fazladan sökülen duvar oranı, yani halka
  yoğunluğu). Bölüm ilerledikçe I. odanın düz ve halkalı salonundan XX. odanın
  kıvrımlı, çıkmaz dolu warren'ına geçiliyor: çıkmaz sokaklar %4,7'den %9,4'e
  çıkıyor, kavşaklar azalıyor. Her odada bütün hücreler hâlâ ulaşılabilir
- Doku çok oyunculu sunucuda da aynı merdivenle uygulanıyor
- Sonsuz modun **ilk odası** da artık kuralını kartta yazıyor; önceki sürümde
  yalnızca sonraki odalar yazıyordu ve oyuncu ilk odaya kör giriyordu
- Sonsuz modda sahte dev yoğunluğu doğrudan ayna sayısından hesaplanıyor:
  eskiden bir referans boyuta bağlıydı ve odadan odaya zıplıyordu
  (%0,7 → %1,6 → %0,7); artık her 1.000 aynada 5'ten 14'e düzgün çıkıyor
- **Düzeltme (belge):** README'de sezgisiz tarama süresi "6–20 dakika"
  yazıyordu; bu 3 tohumluk bir örnekten geliyordu. 40 tohumla ölçülen gerçek
  değerler 7,5 – 31 dakika. Tablo düzeltildi

## 1.5.0 — Beş binden yirmi bine
- **Salonlar ayna sayısına göre kuruluyor:** I. oda 5.000, XX. oda 20.000 ayna.
  Elle yazılmış kenar uzunlukları kalktı; salon kurulup ölçülüyor ve hedeften
  %6'dan fazla saparsa (duvar sökücü düzenlerde) kenar düzeltilip yeniden
  kuruluyor
- **Çok oyunculuda her ek oyuncu +5.000 ayna:** iki kişi birinci tura girerse
  salon 5.000 değil 10.000 ayna; sekiz kişi 40.000, XX. turda 55.000. Oyuncu
  elendikçe salon aynı kuralla küçülüyor
- Oda büyüdükçe **sahte devler, yalancı aynalar ve sezgi hakkı** orantılı
  artıyor; **sıcak iz** kuşağı salonla genişliyor ve artık dereceli: kenarda
  belli belirsiz, merkeze doğru açık altın
- **Beraberlik hesabı:** 0,3 saniyeden yakın bitirişler "aynı anda" sayılıyor,
  aynı sırayı paylaşıyor (1, 1, 3). Son sırayı paylaşanlar kurayla elenmiyor;
  aralarında bir **beraberlik turu** oynanıyor, ötekiler bir üst tura geçiyor.
  Beraberlik turu turnuvada basamak saymıyor
- Tur süresi büyüyen salonlara göre yeniden ölçüldü: taban 90 sn + her 90 ayna
  için 1 sn, en az 2,5 en çok 15 dakika
- Turnuva kuralları `multiplayer/kural.js` dosyasına ayrıldı: testler artık
  formülü kopyalamıyor, sunucunun kullandığı kodun aynısını sınıyor (15 test)
- **Düzeltme:** sıralama toleransı milisaniye sanılıyordu ama süreler saniye
  cinsinden tutuluyor; bu yüzden 7 sn ile 14 sn arasındaki fark bile
  "beraberlik" sayılıyor ve herkes 1. oluyordu

## 1.4.1 — Baştan sona denetim
- **Kritik:** dönüşlü odalar (XII, XVI, XX) kapıya varınca oyunu bitiriyordu;
  bu yüzden **XIII–XX odalarına normal oyunla hiç ulaşılamıyordu**. Artık son
  oda değilse süre yazılır, sıradaki oda açılır ve perdede "Sıradaki oda"
  düğmesi çıkar. Final metni yalnızca XX'te görünür
- **Kritik:** `R` (yeni salon) oyuncuyu I. bölüme atıyordu; artık bulunduğun
  odayı yeni bir tohumla açar
- XVII · Durgun Su geçilemez durumdaydı: yansımanın belirmesi için gereken
  durgunluk, aynaya yürümeyi de engelliyordu. Artık görüntü toplandıktan
  sonra 2,2 saniye açık kalıyor — durup sonra içine yürüyebiliyorsun
- Düelloda kaçan ayna yalnızca 1. oyuncudan kaçıyordu; ikinci oyuncu aynanın
  dibinde bekleyip bedava kazanabiliyordu. Artık iki oyuncuyu da sayıyor
- Sönen fener düelloda yalnızca 1. oyuncunun keşfiyle besleniyordu
- Sonsuz modda etkiler çarpılınca (fener + sis + fırtına) salon
  oynanamayacak kadar kararabiliyordu: ışığa taban kondu
- Sonsuz mod bölüm kartı artık o odada yürürlükte olan kuralların adını yazıyor
- Dokunmatik cihazda "bas ve sürükle" yönergesi görünüyor, klavye kısayol
  şeridi gizleniyor — telefonda oyuncu nasıl yürüyeceğini görüyor
- Salon kodu uyarısı ("1–99999 arası") İngilizceye çevrildi

## 1.4.0 — İmkansıza yakın dört salon
- **XVII · Kyoto — Durgun Su:** cam su gibi davranıyor. Yürürken dev yansıma
  dağılıyor; hız 46'nın altına inip yarım saniye beklersen toplanıyor
- **XVIII · Reykjavík — Buz Salonu:** sürtünme onda bire, ivme %42'ye düştü.
  Aynanın önünde durabilmek başlı başına bir iş
- **XIX · Marrakeş — Sönen Fener:** fener saniyede %5 sönüyor, yalnızca ilk kez
  görülen camlar besliyor. Aynı koridorda dönersen karanlıkta kalıyorsun
- **XX · Sonsuzluk — Yalancı Aynalar:** beş cam dev görüntü verip yalan
  söylüyor. Gerçek yansıma simetriktir ve seninle kayar; yalancınınki panelin
  ortasında çakılı durur. Üstelik gerçek ayna hâlâ kaçıyor, dönüşte fener sönüyor
- Yansıma geometrisi tek bir saf fonksiyona (`yansimaGeometrisi`) çıkarıldı;
  `reflectionCheck` artık gerçekten çizilen sayıları denetliyor
- **Fizik denetimi:** 20 odanın her birinde 99 nokta taranıyor — simetri,
  taşmama, yarım figür olmaması, derinlikte kesilmeme, oyuncuyla çakışmama
  ve yansımanın camın arkasında kalması. 20/20 temiz
- Sonsuz salon dört yeni kuralı da havuzuna aldı; çevrimiçi sunucu 20 odaya
  göre büyüdü (XX: 74×74 taban)
- Tek dosyalık sürüm artık `paketle.js` ile üretiliyor

## 1.3.0 — Kaldığın yerden devam
- **Devam et:** oyun kapatılsa da bölüm, salon tohumu ve süre saklanıyor;
  giriş perdesinde "Devam et" düğmesi nerede kalındığını yazıyor
- Kayıt beş saniyede bir ve sekme kapanırken yazılıyor
- **İlerleme kodu:** açılan odalar, en iyi süreler ve sonsuz rekoru tek bir
  metne çevrilip başka cihaza taşınabiliyor (Ayarlar → İlerlemeyi taşı)
- Mağaza görselleri yeni yansıma görünümüyle ve 16 odaya göre yenilendi
  (Tokyo, İstanbul, Kaçan Ayna dahil; Türkçe ve İngilizce)

## 1.2.2 — Gerçek ayna simetrisi geri geldi
Ekran kaydında yansımalar "eşit değil" ve hareket "takılıyormuş gibi"
görünüyordu. Sebebi 1.2.x'te getirilen iki kısıtlamaydı: yansıma panel içine
sıkıştırılıyor (oyuncuyla hizası kayıyor) ve uzaklığa göre ölçekleniyordu
(boy sürekli değişiyordu). Ayrıca "en yakın aynayı seç" kuralı yürürken
yansımanın bir panelden ötekine atlamasına yol açıyordu.
- **Tam simetri geri geldi:** yansıma oyuncuyla birebir aynı hizada ve aynı
  uzaklıkta; yürürken aynı hızda kayıyor
- **Boy sabit:** yansıma artık büyüyüp küçülmüyor, yalnızca soluklaşıyor
- **Seçim kalktı:** önünde olduğun bütün yakın aynalar görüntü veriyor,
  atlama yok. Yarım figür çıkmaması panel taşma kuralıyla sağlanıyor
- Menzil 1,3 kareye (96 birim) ayarlandı: sade ama boş değil

## 1.2.1 — Sade yansımalar
Ekran kaydında aynı anda çizilen çok sayıda yansıma sahneyi kalabalık ve
karmaşık gösteriyordu, aynadan aynaya geçerken görüntüler üst üste biniyordu:
- **Yalnızca yaklaşılan aynalar görüntü verir.** Her karede en fazla üç
  yansıma: en yakın yatay ayna, en yakın dikey ayna ve menzildeyse dev ayna
- Yansıma menzili bir kareye indi (74 birim); dev ayna 0,8 kare
- Menzil kenarında yansıma **yumuşakça söner**, aniden yanıp sönmez
- Sahne eski zarifliğine döndü; kare hızı 61

## 1.2.0 — Yansıma kuralları yeniden yazıldı
Telefonda çekilen bir kare, yansımaların panel bandından taşıp yarım
kaldığını ve oyuncunun üstüne bindiğini gösterdi. Kurallar baştan yazıldı:
- Aynanın **önünde değilsen** o ayna artık yansıma göstermiyor
- Yansıma panel boyunca oyuncunun hizasında durur ama **kenardan taşmaz**
- Derinlik en az figür boyu + oyuncu yarıçapı: yansıma **oyuncuya binmez**
- Kırpma bandı figürün tamamını içine alacak kadar büyük: **kesilme yok**
- Cam koyuluğu panelden içeri doğru solar; bant artık kutu gibi görünmüyor
- Dev ayna ancak gerçekten karşısındayken "görüldü" sayılıyor
- Yansıma kurallarını sayısal ölçen `reflectionCheck` denetim kancası

## 1.1.1 — Yayın öncesi denetim
Baştan sona denetim yapıldı; bulunan açıklar kapatıldı:
- **Sonsuz modda seri sessizce kayboluyordu:** `R` artık seriyi bitirip skor
  ekranını açıyor, "Baştan oyna" aynı modu sürdürüyor, en iyi seri defterde
  görünüyor
- **Sürüm numarası** oyun içinde 0.8.0 görünüyordu, 1.1.0 oldu
- **Ayrılan oyuncu** çok oyuncuda sıralamada kayboluyordu; artık "ayrıldı"
  olarak sıraya yazılıyor
- Basın kiti ve Steam metinleri 16 odaya göre güncellendi
- `LICENSE` dosyası eklendi (telif + yayıncı izni)

Denetimde doğrulananlar: 16 odanın hepsi 63 fps ile açılıyor ve aynaya
yürüyerek geçiş her odada çalışıyor; iki dilde de boş metin yok; ayarlar,
oda kilidi, salon kodu, sezgi hakkı, mobil yerleşim, odak kaybında tuş
takılması, sekiz oyunculu turnuva, süre dolması ve bağlantı kopması sorunsuz.

## 1.1.0 — Tur süresi ve son düdük
- **Tur süresi:** salon büyüklüğüne göre 1,5–5 dakika (2 kişi 2,1 dk,
  8 kişi 5 dk). Hiçbir tur sürüncemede kalmaz
- **Sayaç uyarıları:** 60, 30 ve 10 saniye kala herkese bildirim
- **Son düdük:** son 45 saniyede aynayı bulamayanlara aynanın bulunduğu
  5 karelik kaba bölge bildirilir — tur kilitlenmez, ayna da verilmez
- **Adil zaman aşımı elemesi:** süre dolunca aynaya adım olarak en uzak olan
  elenir (kuş uçuşu değil, labirentte gerçekten en geride kalan)

## 1.0.1 — Ölçek düzeltmesi
- Çevrimiçi salon boyutu artık her bölümün tek kişilik boyutunu taban alıyor:
  çevrimiçi tek kişi oyunun kendi odasıyla birebir aynı salonu görüyor
- Bölüm çarpanı kaldırıldı; üst sınıra dayanıp 8 ve 10 kişide aynı boyutu
  üretiyordu. Artık her ek oyuncu +3.400 ayna ekliyor (1 → 1.630,
  8 → 26.755) ve eleme sırasında aynı oranda küçülüyor

## 1.0.0 — Eleme turnuvası ve kaçan ayna
- **Dört yeni oda:** XIII Londra (sis), XIV Dubai (cam kule), XV Rio (karnaval)
  ve final **XVI · Kaçan Ayna** — dev ayna 20 saniyede bir yer değiştirir,
  yaklaşınca kaçar, kaçtığı yerde altın bir iz bırakır
- **Çok oyunculu eleme:** her turda dev aynayı son bulan elenir.
  10 → 9 → 8 → ... → 1 kazanan. Her tur yeni salon, yeni köşeler
- **Zalim yerleşim:** turların %30'unda dev ayna adil değil, birine yakın
  ötekine salonun ta öbür ucunda konur

## 0.9.0 — Sonsuz salon, tam ekran, adil yarış
- **Sonsuz salon modu:** her salon rastgele kural karışımıyla kurulur, büyür
  ve kararır; geçilen salon sayısı ve en iyi seri saklanır
- **Dev aynanın yeri çeşitlendi:** yakın / orta / uzak kuşaklar (%25 / %45 / %30)
- **Tam ekran (sinematik) mod:** oyuna girince tuval ekranı kaplar, `F` ile
  açılıp kapanır, `Esc` çıkar
- **Multiplayer:** oyuncular salonun farklı köşelerinden başlar; dev ayna
  bütün başlangıçlara yaklaşık eşit uzaklıkta seçilir (test edilen salonda
  mesafe farkı 160'tan 92 adıma indi)

## 0.8.1 — Sessiz sürüm
- **Ses tamamen kaldırıldı.** Uğultu, çınlama ve geçiş sesleri; ses düğmesi,
  `M` kısayolu ve `audio.js` dosyası kaldırıldı. Oyun artık AudioContext bile
  açmıyor. Müzik ileride telifsiz bir parça bulununca eklenecek.

## 0.8.0 — Dünya turu ve ayarlar
- **Altı yeni oda, altı şehir:** Paris (açık galeri), Venedik (su ve dalga),
  Tokyo (neon; dev ayna yanıp sönmeyen tek cam), New York (ızgara caddeler),
  Kahire (kum fırtınası), İstanbul (Kapalıçarşı, finale taşındı)
- **Ayarlar penceresi:** parlaklık, hareketi azaltma, oda seçimi, sürüm
- **Oyun içi gizlilik politikası** — iki dilde, ayarlardan açılır
- Açılan odalar tarayıcıda saklanır; bitirdiğin odalara geri dönebilirsin

## 0.7.0 — İngilizce ve tanıtım paketi
- Tam **İngilizce sürüm**: arayüz, bölüm adları, hedefler, kartlar, bitiş
  metinleri; tarayıcı diline göre otomatik seçim, tek düğmeyle değiştirme
- Yeni **uygulama ikonu**: ayna çerçevesi içinde dev yansıma, önünde küçük oyuncu
- **Fragman** (TR + EN, 1280×720 WebM) — oyunun kendisinden kaydedildi
- Steam görselleri Türkçe ve İngilizce olarak yenilendi, 231×87 küçük kapsül ve
  1200×630 sosyal kart eklendi
- Ekran görüntülerinin İngilizce sürümleri
- İngilizce gizlilik politikası, kullanım koşulları, basın kiti, mağaza metni

## 0.6.0 — Altı oda
- Üç yeni bölüm: **III · Ters Salon** (kontroller aynalandı), **IV · Kayan
  Aynalar** (duvarlar 11 saniyede bir yer değiştirir), **V · Yankı** (her
  adımını tersten tekrar eden ikiz)
- **VI · Kibir Odası** finale taşındı; dönüş ayağında fener yavaşça sönüyor
- Basın kiti, gizlilik politikası, kullanım koşulları, Steam mağaza metni,
  lisans bildirimleri
- Steam kapsül görselleri ve 1920×1080 ekran görüntüleri

## 0.5.0 — Ses ve PC kontrolleri
- Prosedürel ses (dosyasız): salon uğultusu, buluş çınlaması, geçiş, oyun sonu
- Yaklaşma kalp atışı ve cam çatlaması kaldırıldı (ipucu veriyorlardı)
- Dev ayna yalnızca 0,8 kare mesafede parlıyor; geçiş için aynanın **içine
  yürümek** gerekiyor
- İvmeli klavye hareketi, `Shift` ile koşu, köşe yardımı
- Uygulama ikonu (SVG + 5 boyut PNG)

## 0.4.0 — Bölümler ve düello
- Dev aynadan geçerek bölüm ilerlemesi; her odanın kendi ışığı ve rengi
- Çarpık sahte dev aynalar, sıcak iz ipucu
- Bölünmüş ekran düello, salon kodu
- Multiplayer sunucusu ve istemcisi (oyuna bağlanmayı bekliyor)

## 0.3.0 — Premium sunum
- Kadife/pirinç görsel kimlik, giriş perdesi, bitiş defteri
- Buluş anı: altın ışık ve kamera yaklaşması
- Performans: yalnızca çevredeki aynalar taranıyor

## 0.2.0 — Dev Aynası
- Aynalı salon, gerçek yansımalar, karanlık, sezgi
- Tohumlu labirent üretimi ve testler

## 0.1.0 — Ayna Oyunu
- Lazer/ayna bulmacası (ayrı proje, `ayna-oyunu/`)
