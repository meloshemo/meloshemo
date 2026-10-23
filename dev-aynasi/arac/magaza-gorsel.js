// Dev Aynası — mağaza görselleri (Google Play).
//
// Google Play'in zorunlu tuttuğu "özellik grafiği" (1024×500) ve telefon
// ekran görüntülerini üretir. Görseller oyunun kendi tipografisi ve
// paletiyle çizilir; render Chromium'da yapılır, yazı tipleri yereldeki
// woff2 dosyalarından gelir.
//
// Çalıştırma:  node arac/magaza-gorsel.js   (npm run magaza)

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const KOK = path.join(__dirname, "..");
const CIKTI = path.join(KOK, "basin", "android");
const PORT = 8124;

const METIN = {
  tr: {
    baslik: "Dev Aynası",
    alt: "Binlerce ayna. Yalnızca biri seni devasa gösteriyor.",
  },
  en: {
    baslik: "Hall of Giants",
    alt: "Thousands of mirrors. Only one shows you as a giant.",
  },
};

// Özellik grafiği: 1024×500, saydamlık yok, kenarlardan 10%'luk pay
// içinde kalan her şey her cihazda görünür.
function ozellikHtml(dil, ikonVeri) {
  const m = METIN[dil];
  return `<!doctype html><html lang="${dil}"><head><meta charset="utf-8">
<link rel="stylesheet" href="http://localhost:${PORT}/yazitipi/yazitipi.css">
<style>
  html,body { margin:0; width:1024px; height:500px; overflow:hidden; }
  body {
    background: radial-gradient(120% 140% at 22% 40%, #2d1a3c 0%, #150d20 52%, #07050c 100%);
    display:flex; align-items:center; gap:52px; padding:0 72px;
    font-family:"Jost", system-ui, sans-serif; color:#f2eae0;
  }
  /* Arkada duran, hepsi birbirinin aynı aynalar: oyunun fikrini tek
     bakışta anlatan şey bu tekrar. */
  .aynalar { position:absolute; inset:0; display:flex; align-items:center;
             justify-content:space-between; padding:0 24px; opacity:.16; }
  .aynalar i { display:block; width:54px; height:188px;
               border:2px solid #5f7488; border-radius:27px 27px 6px 6px;
               background:linear-gradient(180deg,#1b2436,#0a1018); }
  .ikon { width:232px; height:232px; flex:none; position:relative;
          filter: drop-shadow(0 18px 44px rgba(0,0,0,.65)); }
  .yazi { position:relative; }
  h1 { margin:0; font-family:"Cormorant Garamond", Georgia, serif;
       font-style:italic; font-weight:600; font-size:92px; line-height:1;
       background:linear-gradient(180deg,#fbf3e4 0%, #d8b26a 62%, #8d6f3f 100%);
       -webkit-background-clip:text; background-clip:text; color:transparent; }
  p { margin:18px 0 0; font-size:27px; line-height:1.35; color:#cbbfd4;
      max-width:560px; font-weight:300; }
</style></head><body>
  <div class="aynalar">${"<i></i>".repeat(14)}</div>
  <img class="ikon" src="${ikonVeri}" alt="">
  <div class="yazi"><h1>${m.baslik}</h1><p>${m.alt}</p></div>
</body></html>`;
}

async function main() {
  // Yazı tiplerini yerel sunucudan ver: file:// altında woff2 yüklenmiyor.
  const { spawn } = require("child_process");
  const sunucu = spawn(process.execPath, [path.join(KOK, "arac", "sun.js")], {
    cwd: KOK, env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "ignore", "inherit"],
  });
  await new Promise((r) => setTimeout(r, 1200));

  fs.mkdirSync(CIKTI, { recursive: true });
  const ikonVeri = "data:image/png;base64," +
    fs.readFileSync(path.join(KOK, "ikon", "dev-aynasi-1024.png")).toString("base64");

  const tarayici = await chromium.launch();
  const sayfa = await tarayici.newPage({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });

  const uretilen = [];
  for (const dil of ["tr", "en"]) {
    await sayfa.setContent(ozellikHtml(dil, ikonVeri), { waitUntil: "load" });
    await sayfa.evaluate(() => document.fonts.ready);
    await sayfa.waitForTimeout(300);
    const hedef = path.join(CIKTI, `play-ozellik-1024x500-${dil}.png`);
    await sayfa.screenshot({ path: hedef });
    uretilen.push(path.relative(KOK, hedef));
  }

  await tarayici.close();
  sunucu.kill();
  console.log(uretilen.map((u) => `${u}: 1024×500`).join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
