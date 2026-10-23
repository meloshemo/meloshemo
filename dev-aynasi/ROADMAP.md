# Yayına kalanlar

> **Durum (1.9.4):** oyunun kendisi bitti. **İlk hedef Android.** Paket
> kuruldu, mağaza metinleri ve görselleri hazır. Kalan işlerin tamamı
> hesap, anahtar ve barındırma — hiçbiri oyun kodu değil.

## Ölçülen durum

| Ne | Nasıl ölçüldü | Sonuç |
| --- | --- | --- |
| Kural matematiği | `npm test` | 18/18 |
| Oyun (20 oda, fizik, kare bütçesi, ağ sessizliği) | `npm run denetim` | 6/6 |
| Çevrimiçi turnuva (gerçek sunucu + botlar) | `npm run denetim:cevrimici` | 5/5 |
| Telefon (dokunma, kare süresi, taşma; yatay + dikey) | `npm run denetim:mobil` | 8/8 |
| Mağaza metni ve görselleri | `npm run magaza:denetim` | 12/12 |

---

## 1. Android — yayına kalanlar

Paket hazır: `mobil/` (Capacitor), `com.meloshemo.devaynasi`, API 24–36,
yatay kilit, tam ekran, çift basışla çıkış, tek izin `INTERNET`.

### 1.1 Sende olması gerekenler
- [ ] **Google Play geliştirici hesabı** — bir kerelik 25 $
- [ ] **İmza anahtarı** üret ve yedekle (`mobil/README.md` adım adım anlatıyor)
- [ ] İlk yüklemede **Play App Signing**'i aç — anahtarı kaybetme riskini bitirir
- [ ] Anahtarı GitHub secret'ı olarak gir (dört secret, `mobil/README.md`)
- [ ] **Gizlilik politikasını bir adrese koy** — Play çalışan bir bağlantı
      ister, markdown dosyası kabul etmez. En ucuz yol GitHub Pages.

### 1.2 Bende, sen hazır olunca
- [ ] `.aab` üretimi: Actions → "Dev Aynası — Android paketi" → Run workflow
- [ ] Fragmanı YouTube'a yükleyip bağlantısını mağazaya koymak
- [ ] Sunucu adresi belli olunca `game.js` içindeki `SUNUCU` sabitini doldurmak

### 1.3 Mağazaya yapıştırılacak her şey hazır
`belgeler/PLAY-MAGAZA-METNI.md` (TR) ve `belgeler/en/PLAY-STORE-COPY.md` (EN)
içinde: uygulama adı, kısa ve tam açıklama, sürüm notları, veri güvenliği
formu cevapları, içerik derecelendirme anketi cevapları, hedef kitle,
iletişim ve yükleme öncesi son kontrol listesi. Karakter sınırları ölçüldü.

Görseller `basin/android/`: 512×512 ikon, 1024×500 özellik grafiği (TR+EN).
Ekran görüntüleri `basin/` içinde, 11 adet, 1920×1080.

---

## 2. Çevrimiçi sunucu — Android'de şart

Tek kişilik oyun internetsiz çalışır; **çevrimiçi yarış için sunucunun bir
yerde durması ve TLS sertifikası olması gerekir.**

Android paketi sayfayı `https://localhost` olarak sunar ve tarayıcı güvenli
sayfadan `ws://` bağlantısına izin vermez. Oyun bunu artık kendisi fark
edip söylüyor (1.9.4), ama söylemek bağlamak değil.

- [ ] Sunucuyu bir yere koy (Fly.io, Railway, Hetzner — WebSocket destekleyen
      herhangi bir Node ortamı yeter)
- [ ] `wss://` sertifikası
- [ ] `game.js` içindeki `SUNUCU` sabitini doldur
- [ ] `?kod=1234` ile tek linkle davet

**Neden ben yapamıyorum:** barındırma hesabı, ödeme yöntemi ve alan adı
senin adına açılır; sertifika senin alan adına kesilir.

---

## 3. Sonraki mağazalar (Android'den sonra)

### 3.1 Masaüstü
- [x] Linux `.AppImage` ve Windows `.exe` (1.8.0'da Wine ile üretildi)
- [ ] Paketleri güncel sürümle yeniden üret (`masaustu/cikti` hâlâ 1.8.0)
- [ ] macOS `.dmg` — iş akışı hazır, Actions'tan çalıştırmak yeter
- [ ] Kod imzalama: Windows sertifikası (~100–400 $/yıl), Apple Developer
      kimliği (99 $/yıl). Ayrıntı: `masaustu/README.md`

### 3.2 Steam
- [x] Mağaza metni, basın kiti, kapsül görselleri, ekran görüntüleri
- [ ] Fragmanı MP4'e çevir — Steam WebM kabul etmiyor
- [ ] Steamworks hesabı + 100 $ sayfa ücreti

---

## 4. Bitti

Oyun tarafında açık iş yok.

- [x] 20 oda, hepsi geçilebilir (denetimle doğrulandı)
- [x] Çevrimiçi turnuva: oda kodu, renkler, sunucu kararlı "buldum", sezgi,
      eleme, beraberlik turu, sıralama tablosu, tek kazanana inme
- [x] Oyuncu başına +5.000 ayna (ölçüldü)
- [x] Sonsuz salon modu, rekor
- [x] Düello (tek ekran, iki oyuncu)
- [x] Dokunmatik, fare ve klavye kontrolleri
- [x] Tam İngilizce sürüm
- [x] Tek dosyalık sürüm (yazı tipleri gömülü)
- [x] Hiçbir dış siteye istek gitmiyor (denetimle doğrulandı)
- [x] Android paketi, ikonları ve mağaza metinleri

## 5. Yapılmayacak / beklemede

- [ ] Müzik — telifsiz ya da sipariş edilmiş bir parça bulunursa. Oyun şu an
      bilinçli olarak sessiz (bkz. `CLAUDE.md`, değişmez kural 1).
- [ ] Sahte aynada kısa süre cezası
- [ ] Günlük salon: herkesin aynı salonu oynadığı günlük kod ve sıralama
- Başka deyimler için ayrı oyun yapılmayacak. Oyun tek bir deyimin oyunu
  olarak kalıyor: **kendini dev aynasında görmek**.
