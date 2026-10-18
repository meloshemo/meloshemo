# Dev Aynası — masaüstü sürümü

Oyunu kendi penceresinde, kendi ikonuyla açan bir Electron kabuğu. Oyunun
kodunun kopyasını tutmaz: bir üst klasördeki `index.html`'i açar, yani oyun
tek bir yerde durur.

## Denemek

```bash
cd masaustu
npm install        # electron'u indirir (~100 MB, bir kez)
npm start
```

## Kurulabilir dosya üretmek

```bash
npm run paketle          # bulunduğun işletim sistemi için
npm run paketle:win      # Windows: kurulum (.exe) + taşınabilir .exe
npm run paketle:mac      # macOS: .dmg
npm run paketle:linux    # Linux: .AppImage
```

Çıktılar `masaustu/cikti/` altına düşer.

## Hangi paket nerede üretilebilir

| Paket | Linux'ta | Windows'ta | macOS'ta |
| --- | --- | --- | --- |
| `.AppImage` (Linux) | ✅ | — | — |
| `.exe` (Windows) | ✅ **Wine ile** | ✅ | ✅ Wine ile |
| `.dmg` (macOS) | ❌ | ❌ | ✅ |

Linux'ta Windows paketi üretmek için Wine gerekir — electron-builder, .exe
dosyasının ikonunu ve sürüm bilgisini yazmak için 32-bit bir Windows aracı
(`rcedit`) çalıştırır:

```bash
sudo dpkg --add-architecture i386 && sudo apt-get update
sudo apt-get install -y wine64 wine32:i386
```

**macOS .dmg yalnızca macOS'ta üretilir.** Apple'ın paketleme ve imzalama
araçları başka işletim sisteminde çalışmaz; bunun teknik bir çaresi yok.

## Üçünü birden: GitHub Actions

Depodaki `.github/workflows/dev-aynasi-masaustu.yml` üç işletim sistemini de
GitHub'ın kendi makinelerinde koşturur; macOS dahil hiçbir şeyi elle yapman
gerekmez.

```bash
git tag dev-aynasi-v1.8.0 && git push --tags
```

Etiket gönderildiğinde üç paket üretilir ve bir sürüm (Release) sayfasına
yüklenir. Etiketsiz denemek için Actions sekmesinden "Run workflow".

## Kabuğun yaptıkları

| Ne | Neden |
| --- | --- |
| Açılış rengi `#0a0710` | Pencere açılırken beyaz çakmasın |
| `ready-to-show` beklenir | Boş kare görünmesin |
| Menü çubuğu yok | Oyun kendi arayüzünü taşıyor |
| `backgroundThrottling: false` | Pencere arkadayken de kare düşmesin |
| `nodeIntegration: false`, `sandbox: true` | Oyunun Node'a ihtiyacı yok; kabuk da açmaz |
| F11 tam ekran, F12 geliştirici araçları | — |
| Dış bağlantılar sistem tarayıcısında | Oyun penceresi oyun penceresi kalsın |

## İmzalama

İmzasız paket **çalışır**, ama işletim sistemi uyarı gösterir:
Windows'ta SmartScreen "bilinmeyen yayıncı", macOS'ta Gatekeeper
"geliştirici doğrulanamadı". Oyuncunun uyarıyı geçmesi gerekir.

Uyarıyı kaldırmak için:

| Platform | Gereken | Yıllık maliyet |
| --- | --- | --- |
| Windows | Kod imzalama sertifikası (OV ya da EV) | ~100–400 $ |
| macOS | Apple Developer Program + notarization | 99 $ |

İkisi de **senin adına verilen özel anahtarlardır**; bende olmamalı ve
olamaz. GitHub Actions akışı anahtarları depo gizli anahtarlarından
(`Settings → Secrets`) okuyacak şekilde hazır: `WINDOWS_CERT_BASE64`,
`WINDOWS_CERT_PASSWORD`, `APPLE_ID`, `APPLE_APP_PASSWORD`, `APPLE_TEAM_ID`.
Bunlar tanımlı değilse paketler imzasız üretilir.

## Denenmiş sürüm

1.8.0 bu depoda gerçekten paketlendi ve çalıştırıldı:

- `Dev Aynasi-1.8.0.AppImage` — 104 MB
- `Dev Aynasi 1.8.0.exe` (taşınabilir) ve `Dev Aynasi Setup 1.8.0.exe` — 72 MB
- Uygulama açıldı, oyun yüklendi, yazı tipleri geldi, X. bölüm 11.996 aynayla
  oynandı
