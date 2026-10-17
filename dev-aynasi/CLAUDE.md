# Dev Aynası — proje kuralları

Bu dosya yalnızca `dev-aynasi/` klasörü için geçerlidir.

## Kapsam: burası ayrı bir projedir

Bu klasör `meloshemo/meloshemo` deposunun içinde duruyor ama **bağımsız bir
oyundur**. Depoda başka işler de var:

| Yol | Nedir | Bu projeyle ilişkisi |
| --- | --- | --- |
| `dev-aynasi/` | **Bu oyun.** Tüm çalışma burada olur. | — |
| `ayna-oyunu/` | Ayrı bir lazer/ayna bulmacası. Tamamlandı, dondurulmuş. | **Yok. Dokunma.** |
| Depo kökündeki `README.md` | Sahibin GitHub profil sayfası. | **Yok. Dokunma.** |

Dev Aynası üzerinde çalışırken `dev-aynasi/` dışına **hiçbir dosya yazma**.
İki oyunun kodu, testleri ve belgeleri birbirinden tamamen ayrıdır; ortak
dosya, ortak bağımlılık, ortak yapılandırma yoktur.

## Çalıştırma

```bash
npm run baslat      # yerel sunucu + tarayıcıda aç
npm test            # 18 regresyon testi (bağımlılık gerektirmez)
npm run paketle     # tek dosyalık sürümü üret
npm run denetim     # tam otomatik denetim (Playwright gerekir)
npm run sunucu      # çevrimiçi turnuva sunucusu (ws gerekir)
```

Oyunun kendisi **hiçbir bağımlılık kullanmaz**: `index.html` dosyasını
doğrudan tarayıcıda açmak yeter. `ws` yalnızca çevrimiçi sunucu için,
Playwright yalnızca otomatik denetim için gerekir.

## Dosya düzeni

```
index.html   style.css          arayüz ve perdeler
game.js                         oyunun tamamı (çizim, fizik, bölümler)
maze.js                         labirent üretimi (tarayıcı + Node ortak)
i18n.js                         TR/EN sözlükler
test.js                         regresyon testleri
arac/                           yapı ve denetim araçları
multiplayer/kural.js            turnuva kuralları (sunucu + testler ortak)
multiplayer/server.js           WebSocket sunucusu
multiplayer/net.js              tarayıcı istemcisi
belgeler/                       gizlilik, kullanım, basın, mağaza metinleri
basin/ ikon/ fragman/           mağaza görselleri, ikon, fragman
```

## Değişmez kurallar

Bunlar oyuncu geri bildirimiyle oturmuş kararlardır; değiştirmeden önce sor.

1. **Ses yoktur.** `AudioContext` hiçbir yerde kurulmaz. Oyuncu açıkça
   istemedi: "şarkı yapamadın, o zaman hiç ses olmayacak."
2. **Yansıma gerçek ayna simetrisidir.** Yansıma, oyuncunun ayna düzlemine
   göre tam simetriğidir; boyu değişmez, panelden taşarsa hiç çizilmez,
   oyuncunun üstüne binmez. Tek istisna XX. bölümün yalancı aynasıdır ve
   kuralı bilerek çiğner. Kuralların sayısal denetimi:
   `window.__devAynasi.reflectionCheck()`.
3. **Salonlar ayna sayısına göre kurulur**, elle yazılmış kenar uzunluğuna
   göre değil: I. oda 5.000, XX. oda 20.000 ayna. Çok oyunculuda her ek
   oyuncu +5.000.
4. **Koridor altı kareden uzun olmaz** ve her salonda odacık açılır.
   Upuzun düz koridorlar oyuncunun açık şikâyetiydi.
5. **Kare düşmez.** Çizim döngüsünde nesne üretilmez, ekranı kaplayan
   boyamalar önbellekten basılır, çözünürlük kare süresine göre kendini
   ayarlar.

## Ölçmeden iddia etme

Bu projede "daha hızlı oldu", "daha zor oldu", "aynı görünüyor" gibi her
cümlenin arkasında bir ölçüm vardır. `arac/` altındaki denetim araçları
bunun içindir. Bir değişikliğin etkisini ölçmeden rapor etme.

## Test kancaları

`window.__devAynasi` üzerinde oyunu dışarıdan sürmeye yarayan kancalar var
(`jumpToChapter`, `faceGiant`, `reflectionCheck`, `olcek`, `teleportToOdacik`
ve benzerleri). Yalnızca otomatik denetim içindir; oyuncu arayüzünde yeri
yoktur.

## Sürüm

Sürüm numarası üç yerde birden durur ve birlikte güncellenir:
`package.json`, `game.js` içindeki `SURUM`, `index.html` içindeki
`#version`. Her sürümün `CHANGELOG.md` içinde bir girdisi olur.
