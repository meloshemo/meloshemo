// Dev Aynası — Android paketinin web içeriğini hazırlar.
//
// Oyunun tek dosyalık sürümünü üretip `www/index.html` olarak koyar. Tek
// dosya seçildi çünkü WebView'de dosya yolu, önbellek ve kodlama sorunları
// çıkmıyor: yazı tipleri de içine gömülü, hiçbir dış istek yok.
//
// Çalıştırma: node hazirla.js   (npm run hazirla)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MOBIL = __dirname;
const OYUN = path.join(MOBIL, "..");
const WWW = path.join(MOBIL, "www");

// 1. Tek dosyalık sürümü tazele — oyunda yapılan son değişiklik de girsin.
execFileSync(process.execPath, [path.join(OYUN, "arac", "paketle.js")], {
  cwd: OYUN,
  stdio: "inherit",
});

// 2. www/ klasörünü sıfırdan kur.
fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW, { recursive: true });

const kaynak = path.join(OYUN, "dev-aynasi-tek-dosya.html");
let html = fs.readFileSync(kaynak, "utf8");

// 3. WebView'e özgü düzeltmeler.
//    - Çimdikleyerek yakınlaştırma oyunu bozuyor: kapatılır.
//    - `viewport-fit=cover` çentikli ekranlarda tüm alanı kullanmak için;
//      güvenli alan boşlukları style.css içinde zaten hesaplı.
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
);

// Not: Android'de sayfa `https://localhost` üzerinden sunulduğu için
// `ws://` bağlantısı karışık içerik kuralıyla engellenir. Oyun bunu
// `location.protocol`'e bakarak kendisi anlıyor (game.js içinde
// `guvenliGerekiyor`), burada ayrıca bir işaret bırakmaya gerek yok.

fs.writeFileSync(path.join(WWW, "index.html"), html);

const kb = Math.round(fs.statSync(path.join(WWW, "index.html")).size / 1024);
console.log(`mobil/www/index.html hazır: ${kb} KB`);
