# Fragmanlar / Trailers

| Dosya | Dil | Süre | Format |
| --- | --- | --- | --- |
| `dev-aynasi-fragman-tr.webm` | Türkçe | ~62 sn | WebM (VP8), 1280×720, 25 fps, sessiz |
| `dev-aynasi-trailer-en.webm` | English | ~62 s | WebM (VP8), 1280×720, 25 fps, silent |

Fragmanlar oyunun kendisinden kaydedildi: senaryo oyunu gerçekten oynatıyor,
hiçbir kare elle çizilmedi.

## Akış
1. Açılış kartı — "Panayırın aynalı salonu"
2. Karanlıkta dolaşma
3. "Hepsi seni olduğun gibi gösteriyor / Yalnızca biri seni devasa gösteriyor"
4. Dev aynayı bulma ve içine yürüme
5. Oda turu: III · Ters Salon, V · Yankı, IX · Tokyo, XII · İstanbul, XVI · Kaçan Ayna
6. Düello — bölünmüş ekran
7. Kapanış kartı

## Steam'e yüklemeden önce

Steam MP4 (H.264) ister; WebM kabul etmez. Bilgisayarında tam sürüm ffmpeg ile
tek komut:

```bash
ffmpeg -i dev-aynasi-fragman-tr.webm -c:v libx264 -preset slow -crf 18 \
  -pix_fmt yuv420p -movflags +faststart dev-aynasi-fragman-tr.mp4
```

Ses eklemek istersen (fragman şu an sessiz):

```bash
ffmpeg -i dev-aynasi-fragman-tr.mp4 -i muzik.mp3 -c:v copy -c:a aac \
  -shortest dev-aynasi-fragman-tr-sesli.mp4
```

Bu ortamdaki ffmpeg yalnızca WebM üretebildiği için MP4 dönüşümü sende
yapılacak; kayıt kalitesi aynıdır, yalnızca kap (container) değişir.
