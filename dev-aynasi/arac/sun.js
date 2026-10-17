#!/usr/bin/env node
// Dev Aynası — yerel geliştirme sunucusu.
//
// Oyun dosya olarak da açılabilir (index.html'e çift tıklamak yeter) ama
// tarayıcılar file:// adresinde bazı şeyleri kısıtlar. Bu küçük sunucu
// hiçbir bağımlılık istemeden http:// üzerinden servis eder.
//
//   npm run baslat            → http://localhost:8080
//   npm run baslat -- 3000    → başka port

const http = require("http");
const fs = require("fs");
const path = require("path");

const KOK = path.resolve(__dirname, "..");
const PORT = Number(process.argv[2] || process.env.PORT || 8080);

const TURLER = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".md": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

const sunucu = http.createServer((istek, cevap) => {
  let istenen = decodeURIComponent(istek.url.split("?")[0]);
  if (istenen === "/") istenen = "/index.html";

  // Klasör dışına çıkmaya çalışan yolları reddet.
  const hedef = path.join(KOK, path.normalize(istenen));
  if (!hedef.startsWith(KOK)) {
    cevap.writeHead(403).end("403");
    return;
  }

  fs.readFile(hedef, (hata, icerik) => {
    if (hata) {
      cevap.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      cevap.end(`Bulunamadı: ${istenen}`);
      return;
    }
    cevap.writeHead(200, {
      "content-type": TURLER[path.extname(hedef).toLowerCase()] || "application/octet-stream",
      // Geliştirirken eski sürüm takılı kalmasın.
      "cache-control": "no-store",
    });
    cevap.end(icerik);
  });
});

sunucu.listen(PORT, () => {
  console.log(`\n  Dev Aynası hazır:  http://localhost:${PORT}\n`);
  console.log("  Durdurmak için Ctrl+C\n");
});
