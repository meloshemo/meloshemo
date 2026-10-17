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

**Not:** Windows için .exe üretmek Windows'ta (ya da Wine kurulu bir Linux'ta)
yapılır; macOS için .dmg üretmek macOS gerektirir. Her üçünü birden üretmenin
en kolay yolu GitHub Actions'tır.

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

Mağazaya çıkarken Windows'ta kod imzalama sertifikası, macOS'ta Apple
Developer kimliği + notarization gerekir. İkisi de ücretlidir ve
`electron-builder` yapılandırmasına eklenir; imzasız sürüm "bilinmeyen
yayıncı" uyarısı verir.
