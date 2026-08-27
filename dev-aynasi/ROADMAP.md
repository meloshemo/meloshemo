# Yapılacaklar

## 1. Çevrimiçi yarış (multiplayer) — kod hazır, bağlanacak
Kod `multiplayer/` klasöründe duruyor; oyuna henüz bağlı değil.
Bilgisayara geçilince `multiplayer/README.md` içindeki 5 adım uygulanacak.

- [x] Sunucu (`multiplayer/server.js`) — salon üretimi, oda kodu, sıralama
- [x] İstemci (`multiplayer/net.js`) — bağlantı, konum gönderimi, yumuşatma
- [x] **Oyuncu renkleri**: 1. oyuncu beyaz, sonra kırmızı, mavi, yeşil, mor,
      turuncu, turkuaz, pembe — renk sunucudan gelir, herkes diğerini kendi
      renginde görür
- [x] **Kalabalık salonu büyütür**: 1 kişi 40×40 (~1.600 ayna) → 8 kişi 72×72
      (~5.300 ayna); sahte dev ayna sayısı da oyuncu başına artar. Bulma
      olasılığı düşer, yarış uzar
- [x] Hile koruması: "buldum" kararını sunucu verir, ışınlanma hız sınırıyla
      engellenir
- [ ] `game.js`'e bağlama (5 adım, README'de)
- [ ] Lobi ekranı: oda kodu, katılanların renkleri, "hazırım" düğmesi
- [ ] Yarış içi bildirim: "Kırmızı dev aynayı buldu — 1. sıra"
- [ ] Bitiş tablosu: renk + ad + süre sıralaması
- [ ] Yayına alma: `wss://` sertifika, sunucuyu bir VPS'e koyma, `?kod=1234`
      ile tek linkle davet

## 2. Oyun mekaniği
- [ ] Ses: dev aynaya yaklaştıkça yükselen uğultu / kalp atışı
- [ ] Yankı: sahte dev aynaya baktığında cam çatlama sesi ve kısa süre cezası
- [ ] Günlük salon: herkesin aynı salonu oynadığı günlük kod ve sıralama
- [ ] Bölüm IV fikri: aynaların yer değiştirdiği "dönen salon"

## 3. Seri fikri — başka deyimler, aynı iskelet
- [ ] "Samanlıkta iğne aramak"
- [ ] "Pireyi deve yapmak" (küçük bir şeyi büyüten ayna)
- [ ] "Bir taşla iki kuş vurmak"
