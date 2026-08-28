# Lisanslar ve Üçüncü Taraf Bildirimleri — Dev Aynası

## Oyunun kendisi

Kod, görseller ve sesler © 2026 Osman Melih Yılmaz. Tüm hakları saklıdır.

## Kullanılan yazı tipleri

| Yazı tipi | Lisans | Kaynak |
| --- | --- | --- |
| Cormorant Garamond | SIL Open Font License 1.1 | Google Fonts |
| Jost | SIL Open Font License 1.1 | Google Fonts |
| IBM Plex Mono / Sans | SIL Open Font License 1.1 | Google Fonts |

SIL OFL, yazı tiplerinin ticari projelerde ücretsiz kullanılmasına izin verir.
Masaüstü sürümde yazı tipleri oyunun içine gömülecektir; bu da OFL kapsamında
serbesttir (yazı tiplerinin kendisi ayrıca satılamaz).

## Ses

Oyundaki tüm sesler çalışma anında Web Audio API ile üretilir. Hiçbir ses
dosyası, örnekleme (sample) veya telifli müzik kullanılmamıştır.

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
