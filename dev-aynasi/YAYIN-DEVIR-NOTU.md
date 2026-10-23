# Yayın devir notu — Dev Aynası, Google Play

> Bu dosya, **bilgisayarında açacağın yeni Claude oturumuna** vermek için
> yazıldı. Oraya "dev-aynasi/YAYIN-DEVIR-NOTU.md dosyasını oku, kaldığımız
> yerden devam et" demen yeter.

## Durum: oyun bitti, paket hazır, sıra yüklemede

Sürüm **1.9.4**. Dal: `claude/dev-aynasi-game-732nhk` (her şey commit'li ve
push'lanmış).

| Ne | Durum |
| --- | --- |
| Oyun (20 oda, çevrimiçi, sonsuz, düello) | ✅ bitti, denetimli |
| Android paketi | ✅ derlendi ve **imzalandı** |
| İmza anahtarı | ✅ üretildi — oyuncuda (bkz. aşağısı) |
| Mağaza metinleri (TR + EN) | ✅ hazır, karakter sınırları ölçülü |
| Mağaza görselleri | ✅ üretildi |
| Gizlilik politikası (HTML) | ✅ hazır — **bir adrese konması gerekiyor** |
| Play Console'a yükleme | ⬜ **kalan tek iş** |

## Ölçümler (iddia değil, koşulmuş sonuçlar)

```
npm test                    18/18
npm run denetim              6/6    (20 oda, fizik, kare bütçesi, ağ sessizliği)
npm run denetim:cevrimici    5/5    (gerçek sunucu + botlarla turnuva)
npm run denetim:mobil        8/8    (telefon ölçüleri, gerçek dokunmatik girdi)
npm run magaza:denetim      12/12   (metin sınırları, görsel boyut/saydamlık)
```

Android derlemesi de gerçekten koşturuldu: `.aab` 4,4 MB, `.apk` 4,5 MB,
imza `apksigner`/`jarsigner` ile doğrulandı.

## Elindeki dosyalar

Bunlar sohbette oyuncuya gönderildi; kapsayıcı silindiği için **yeniden
üretilmeleri gerekebilir** (nasıl olduğu aşağıda):

| Dosya | Ne |
| --- | --- |
| `dev-aynasi-1.9.4.aab` | **Play'e yüklenecek dosya** |
| `dev-aynasi-1.9.4.apk` | Telefonda denemek için |
| `dev-aynasi-upload.jks` | İmza anahtarı — oyuncuda yedekli olmalı |
| `ANAHTAR-BILGILERI.txt` | Şifreler, parmak izi, GitHub secret'ları |

**Paketi yeniden üretmek için** (Android SDK gerekir):

```bash
cd dev-aynasi/mobil
npm install
node hazirla.js && npx cap sync android
cd android
# keystore.properties dosyasını ANAHTAR-BILGILERI.txt'teki değerlerle yaz
./gradlew bundleRelease     # app/build/outputs/bundle/release/app-release.aab
```

Ayrıntı: `dev-aynasi/mobil/README.md`.

## Mağazaya girilecek her şey hazır

- **`belgeler/PLAY-MAGAZA-METNI.md`** (TR) ve **`belgeler/en/PLAY-STORE-COPY.md`** (EN)
  Uygulama adı, kısa/tam açıklama, sürüm notları, **veri güvenliği formu
  cevapları**, **içerik derecelendirme anketi cevapları**, hedef kitle,
  iletişim, yükleme öncesi kontrol listesi. Kod bloklarının içi doğrudan
  yapıştırılacak şekilde.
- **Görseller:** `basin/android/play-ikon-512.png` (512×512, saydamsız),
  `basin/android/play-ozellik-1024x500-{tr,en}.png`, ekran görüntüleri
  `basin/` altında 11 adet 1920×1080.
- **Gizlilik politikası:** `belgeler/web/` içinde yayımlanmaya hazır HTML
  (gizlilik, privacy, kullanim, terms, index).

## Yükleme sırası

1. **Gizlilik politikasını bir adrese koy.** Play markdown kabul etmiyor,
   çalışan bağlantı istiyor. Oyuncunun GitHub'da `notheon` adlı bir sitesi
   var; `belgeler/web/` içindekileri oraya bir klasöre atmak yeter. Çıkan
   adresi `belgeler/PLAY-MAGAZA-METNI.md` içindeki boş alana yaz.
2. **Play Console → Uygulama oluştur.** Paket adı `com.meloshemo.devaynasi`
   — **bu sonradan değişmez**, önce onayla.
3. **Play App Signing'i açık bırak** (varsayılan açık gelir). Böylece
   elindeki anahtar yalnızca *yükleme* anahtarı olur; kaybolursa Google
   sıfırlatır.
4. **Mağaza kaydını doldur** — metinler ve görseller yukarıdaki dosyalarda.
5. **Veri güvenliği** ve **içerik derecelendirme** formları — cevapları
   hazır, aynı dosyalarda.
6. **`.aab`'yi kapalı teste (closed testing) yükle**, en az bir cihazda
   dene, sonra üretime çıkar.

## Dikkat edilecek iki şey

- **Çevrimiçi yarış için sunucu lazım.** Tek kişilik oyun internetsiz
  çalışır, ama çevrimiçi mod bir sunucu ister ve Android'de **`wss://`
  zorunlu** (paket sayfayı `https://localhost` olarak sunuyor, tarayıcı
  güvenli sayfadan `ws://`'e izin vermiyor). Sunucu bir yere konunca
  `game.js` içindeki `SUNUCU` sabiti doldurulacak. Sunucu olmadan da
  oyun yayımlanabilir — çevrimiçi mod o zaman kendi sunucusunu kuranlar
  için çalışır.
- **Proje kuralları `dev-aynasi/CLAUDE.md` içinde.** Özellikle: `dev-aynasi/`
  dışına dosya yazma, ve **ölçmeden iddia etme** — bu projede her "oldu",
  "hızlandı", "çalışıyor" cümlesinin arkasında koşulmuş bir ölçüm var.

## Yapılmayanlar (bilerek)

- Uygulama **çalışırken** sınanmadı: bu makinede sanallaştırma kapalıydı
  (KVM yok), emülatör anlamlı ölçüm vermezdi. Oyun tarafı gerçek tarayıcıda
  telefon ölçüleriyle ve gerçek dokunmatik girdiyle denetlendi (8/8);
  sınanmayan tek şey WebView'e özgü davranış. Oyuncuya kurulabilir APK
  gönderildi, onunla deneyecek.
- macOS `.dmg`, Steam ve kod imzalama sertifikaları: sonraki aşama,
  `ROADMAP.md` içinde.
