# Dev Aynası — Android paketi

Oyunun Android sürümü. Oyun kodu **birebir aynıdır**: tek dosyalık web
sürümü bir WebView içinde çalışır. Ayrı bir oyun motoru, ayrı bir kod yolu
yoktur; `game.js`'te düzelttiğin şey telefonda da düzelir.

| | |
| --- | --- |
| Paket adı | `com.meloshemo.devaynasi` |
| En düşük Android | 7.0 (API 24) |
| Hedef API | 36 |
| İzinler | yalnızca `INTERNET` (çevrimiçi yarış için) |
| Yön | yatay (`sensorLandscape`) |
| Boyut | ~3 MB (oyun 471 KB, gerisi WebView kabuğu) |

## Nasıl kurulduğu

```
mobil/
  package.json          Capacitor bağımlılıkları
  capacitor.config.json paket adı, uygulama adı, webDir
  hazirla.js            tek dosyalık oyunu üretip www/ içine koyar
  www/                  üretilen web içeriği (depoda durmaz)
  android/              native proje — şablondan üretildi, sonra elle ayarlandı
```

`android/` depoda duruyor çünkü içinde elle yapılmış ayarlar var: yön
kilidi, tam ekran, geri tuşu, ikonlar, imza yapılandırması. `npx cap add
android` yeniden çalıştırılırsa bunların hepsi silinir — çalıştırma.

## Komutlar

```bash
npm install          # bir kez
npm run hazirla      # oyunu tazele, www/ üret
npm run senkron      # hazirla + native projeye kopyala
npm run apk          # imzalı .apk (telefona doğrudan kurmak için)
npm run aab          # imzalı .aab (Google Play'e yüklenecek dosya)
```

Bu komutlar **Android SDK** ister. Yoksa derleme adımı patlar; kurulum:
Android Studio ya da `cmdline-tools` + `sdkmanager`.

**SDK kurmak istemiyorsan gerek yok:** depodaki
`.github/workflows/dev-aynasi-android.yml` iş akışı `.aab` ve `.apk`
dosyalarını GitHub'ın makinesinde üretip indirilebilir hale getiriyor.
Actions sekmesi → "Dev Aynası — Android paketi" → Run workflow.

## İmza anahtarı

Google Play imzasız paket kabul etmez. Anahtar **senin** elinde üretilir ve
depoya asla girmez.

### 1. Anahtarı üret

```bash
keytool -genkeypair -v \
  -keystore dev-aynasi.jks \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -alias dev-aynasi
```

Sorulan şifreleri bir parola yöneticisine yaz.

> **Bu dosyayı kaybetme.** Play App Signing açılmadıysa anahtarı kaybetmek,
> uygulamayı bir daha güncelleyememek demektir — tek çare yeni paket adıyla
> yeni bir uygulama yayımlamak, yani bütün yorumları ve yüklemeleri
> kaybetmek. İlk yüklemede **Play App Signing'i aç**: Google yükleme
> anahtarını kendi saklar, seninki kaybolursa sıfırlatabilirsin.

### 2a. Yerelde derlemek için

`mobil/android/keystore.properties` (bu dosya `.gitignore`'da):

```properties
depoYolu=/tam/yol/dev-aynasi.jks
depoSifresi=…
anahtarAdi=dev-aynasi
anahtarSifresi=…
```

### 2b. GitHub Actions'ta derlemek için

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | İçerik |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 dev-aynasi.jks` çıktısı |
| `ANDROID_KEYSTORE_PASSWORD` | depo şifresi |
| `ANDROID_KEY_ALIAS` | `dev-aynasi` |
| `ANDROID_KEY_PASSWORD` | anahtar şifresi |

Secret'lar yoksa iş akışı yine koşar ama paketi imzasız üretir; Play kabul
etmez, yalnızca derlemenin sağlamlığını görmeye yarar.

## Sürüm numarası

`android/app/build.gradle` içinde iki yerde durur ve oyunun sürümünden
türer:

```
versionName "1.9.4"     oyuncunun gördüğü sürüm
versionCode 10904       1.9.4 → 1*10000 + 9*100 + 4
```

Play her yüklemede `versionCode`'un bir öncekinden **büyük** olmasını ister.
Oyunun sürümü değiştiğinde ikisi birden elle güncellenir.

## Çevrimiçi yarış — dikkat

Android paketi sayfayı `https://localhost` olarak sunar. Tarayıcı güvenli
bir sayfadan `ws://` bağlantısına izin vermez (karışık içerik), üstelik
sessizce engeller: bağlantı ne açılır ne hata verir.

Bu yüzden oyun, güvenli sayfada çalıştığını görünce:

- varsayılan sunucu adresini `wss://` olarak gösterir,
- `ws://` yazılırsa bağlanmadan önce bunu söyler.

Yani **Android'de çevrimiçi yarış için sunucunun TLS sertifikası olması
şart.** Sunucu bir yere konduğunda `game.js` içindeki `SUNUCU` sabiti
doldurulur ve adres alanı oyuncu için varsayılan gelir.

## Neyin denetlendiği

```bash
cd ..                       # dev-aynasi/
npm run denetim:mobil       # telefon ölçülerinde: dokunma, kare süresi, taşma
npm run magaza:denetim      # mağaza metni karakter sınırları ve görseller
```

`denetim:mobil` oyunu 1920×1080 ve 1080×1920'de gerçek dokunmatik girdiyle
açıyor; mağaza ekran görüntüleri de buradan çıkıyor
(`basin/android/mobil-*.png`).
