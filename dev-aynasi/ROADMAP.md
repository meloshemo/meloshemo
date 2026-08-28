# Yapılacaklar

## 1. Çevrimiçi yarış (multiplayer) — kod hazır, bağlanacak
Kod `multiplayer/` klasöründe duruyor; oyuna henüz bağlı değil.
Bilgisayara geçilince `multiplayer/README.md` içindeki 5 adım uygulanacak.

- [x] Sunucu (`multiplayer/server.js`) — salon üretimi, oda kodu, sıralama
- [x] İstemci (`multiplayer/net.js`) — bağlantı, konum gönderimi, yumuşatma
- [x] **Oyuncu renkleri**: 1. oyuncu beyaz, sonra kırmızı, mavi, yeşil, mor,
      turuncu, turkuaz, pembe — renk sunucudan gelir, herkes diğerini kendi
      renginde görür
- [x] **Kalabalık salonu büyütür**: her yeni oyuncu +3.400 ayna.
      1 kişi ~1.700 · 2 kişi ~5.300 · 3 kişi ~8.900 · 4 kişi ~12.400 ·
      6 kişi ~19.600 · 8 kişi ~26.400. Bölüm ilerledikçe oda ayrıca %15 büyür
      (6 kişilik III. bölüm ~33.000 ayna)
- [x] **Bulan ilerler, diğerleri arar**: dev aynayı bulan aynadan geçip bir
      sonraki bölüme girer; geride kalanlar kendi salonlarında aramaya devam
      eder, herkes yalnızca kendi bölümündeki oyuncuları görür
- [x] Hile koruması: "buldum" kararını sunucu verir, ışınlanma hız sınırıyla
      engellenir
- [ ] `game.js`'e bağlama (5 adım, README'de)
- [ ] Lobi ekranı: oda kodu, katılanların renkleri, "hazırım" düğmesi
- [ ] Yarış içi bildirim: "Kırmızı dev aynayı buldu — 1. sıra"
- [ ] Bitiş tablosu: renk + ad + süre sıralaması
- [ ] Yayına alma: `wss://` sertifika, sunucuyu bir VPS'e koyma, `?kod=1234`
      ile tek linkle davet

## 2. Tamamlananlar (bu sürüm)
- [x] Üç yeni bölüm: Ters Salon, Kayan Aynalar, Yankı
- [x] Kibir Odası finale taşındı, dönüşte fener sönüyor
- [x] Gizlilik politikası, kullanım koşulları, lisans bildirimleri
- [x] Basın kiti, Steam mağaza metni, sistem gereksinimleri
- [x] Steam kapsül görselleri ve 1920×1080 ekran görüntüleri
- [x] Değişiklik günlüğü

## 3. Oyun mekaniği
- [x] Ses tamamen kaldırıldı (oyun sessiz)
- [ ] Müzik: telifsiz ya da sipariş edilmiş bir parça bulunduğunda eklenecek
- [ ] Sahte aynada kısa süre cezası
- [ ] Günlük salon: herkesin aynı salonu oynadığı günlük kod ve sıralama
- [x] Fragman videosu (TR + EN, WebM) — Steam için MP4'e çevrilecek
- [x] Tam İngilizce sürüm (arayüz, bölüm adları, belgeler)
- [x] Yeni uygulama ikonu (ayna çerçevesi kompozisyonu)
- [ ] Masaüstü paketi (Electron/Tauri) — Steam için gerekli

## 4. Kapsam kararı
Oyun tek bir deyimin oyunu olarak kalacak: **kendini dev aynasında görmek**.
Başka deyimler için ayrı oyun yapılmayacak.
