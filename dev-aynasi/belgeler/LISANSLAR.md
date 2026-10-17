# Lisanslar ve Üçüncü Taraf Bildirimleri — Dev Aynası

## Oyunun kendisi

Kod, görseller ve sesler © 2026 Osman Melih Yılmaz. Tüm hakları saklıdır.

## Kullanılan yazı tipleri

| Yazı tipi | Lisans | Oyundaki dosyalar |
| --- | --- | --- |
| Cormorant Garamond | SIL Open Font License 1.1 | `yazitipi/cormorant-600*.woff2` |
| Jost | SIL Open Font License 1.1 | `yazitipi/jost-300*.woff2`, `jost-400*.woff2` |
| IBM Plex Mono | SIL Open Font License 1.1 | `yazitipi/plexmono-400*.woff2`, `plexmono-500*.woff2` |

Yazı tipleri 1.8.0 ile birlikte **oyunun içine gömüldü** (`yazitipi/`
klasörü, latin ve latin-ext alt kümeleri, toplam 252 KB). Artık Google
Fonts'a bağlanılmıyor. SIL OFL bunu açıkça serbest bırakır: yazı tipleri
ticari projelerde ücretsiz kullanılabilir ve gömülebilir; yalnızca yazı
tiplerinin kendisi ayrı bir ürün olarak satılamaz.

Lisans metni: https://openfontlicense.org

## Ses

Oyunda ses ve müzik yoktur. Hiçbir ses dosyası, örnekleme veya telifli müzik
kullanılmamıştır.

## Kod bağımlılıkları

Oyun istemcisi bağımlılıksızdır — çerçeve, kütüphane veya paket yöneticisi
kullanmaz. Çevrimiçi yarış sunucusu tek bir bağımlılık kullanır:

| Paket | Sürüm | Lisans |
| --- | --- | --- |
| ws | ^8 | MIT |

## Geliştirme araçları (dağıtılan pakete girmez)

| Araç | Lisans | Kullanım |
| --- | --- | --- |
| Node.js | MIT | Testler ve sunucu |
| Playwright | Apache-2.0 | Ekran görüntüsü ve oynanış testleri |
