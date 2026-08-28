# Değişiklik Günlüğü — Dev Aynası

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
