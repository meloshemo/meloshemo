# Değişiklik Günlüğü — Dev Aynası

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
