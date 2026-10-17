#!/usr/bin/env node
// Dev Aynası — tam otomatik denetim.
//
//   npm run denetim
//
// Playwright gerekir (npm i -D playwright). Oyunu gerçek bir tarayıcıda
// baştan sona oynar ve ölçer: her oda geçilebiliyor mu, yansıma kuralları
// tutuyor mu, kare süresi bütçede mi.

const path = require("path");
const KOK = path.resolve(__dirname, "..");
const URL = "file://" + path.join(KOK, "index.html");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (err) {
  console.error("Playwright bulunamadı. Kurmak için:  npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const sonuc = [];
const yaz = (ad, gecti, ayrinti = "") => {
  sonuc.push({ ad, gecti });
  console.log(`${gecti ? "✅" : "❌"} ${ad}${ayrinti ? " — " + ayrinti : ""}`);
};

(async () => {
  // Kare süresi ölçülebilsin diye dikey senkron kapatılır: açıkken bütün
  // kareler tam 16,7 ms'ye yığılır ve ölçüm anlamsızlaşır.
  const tarayici = await chromium.launch({
    args: ["--disable-frame-rate-limit", "--disable-gpu-vsync"],
  });
  const sayfa = await tarayici.newPage({ viewport: { width: 1280, height: 800 } });
  const hatalar = [];
  sayfa.on("pageerror", (e) => hatalar.push(String(e)));
  await sayfa.goto(URL);
  await sayfa.click("#enterSolo");
  await sayfa.waitForTimeout(500);
  const D = (fn, ...a) => sayfa.evaluate(fn, ...a);
  const odaSayisi = await D(() => window.__devAynasi.state && 20);

  // 1) Her oda geçilebiliyor mu
  let gecilemeyen = [];
  for (let i = 0; i < odaSayisi; i++) {
    await D((n) => window.__devAynasi.jumpToChapter(n), i);
    await sayfa.waitForTimeout(150);
    let gecti = false;
    for (let d = 0; d < 10 && !gecti; d++) {
      const tus = await D(() => window.__devAynasi.faceGiant());
      await sayfa.waitForTimeout(700);
      await sayfa.keyboard.down(tus);
      await sayfa.waitForTimeout(500);
      await sayfa.keyboard.up(tus);
      const s = await D(() => window.__devAynasi.state());
      gecti = s.phase === "donus" || s.index !== i;
    }
    if (!gecti) gecilemeyen.push(i + 1);
  }
  yaz(`${odaSayisi} odanın hepsi geçilebiliyor`, gecilemeyen.length === 0,
    gecilemeyen.length ? "geçilemeyen: " + gecilemeyen.join(", ") : "");

  // 2) Yansıma kuralları
  const sorunlar = [];
  for (let i = 0; i < odaSayisi; i++) {
    await D((n) => window.__devAynasi.jumpToChapter(n), i);
    await sayfa.waitForTimeout(120);
    for (const tur of ["giant", "normal", "liar"]) {
      const r = await D((t) => window.__devAynasi.reflectionCheck(t), tur);
      if (r && r.sorunlar.length) sorunlar.push(`oda ${i + 1} (${tur}): ${r.sorunlar.join(", ")}`);
    }
  }
  yaz("yansıma fiziği kuralları", sorunlar.length === 0, sorunlar.slice(0, 3).join(" | "));

  // 3) Kare süresi
  await D(() => window.__devAynasi.jumpToChapter(19));
  await sayfa.keyboard.down("s");
  await sayfa.waitForTimeout(2200);
  const kare = await sayfa.evaluate(() => new Promise((res) => {
    const k = []; let son = performance.now(); const t0 = son;
    const tik = (t) => { k.push(t - son); son = t;
      if (t - t0 < 3000) requestAnimationFrame(tik);
      else { k.shift(); k.sort((a, b) => a - b);
        res({ p50: k[Math.floor(k.length * 0.5)], kacak: k.filter((x) => x > 16.7).length / k.length * 100 }); } };
    requestAnimationFrame(tik);
  }));
  await sayfa.keyboard.up("s");
  yaz("kare bütçesi (en büyük oda)", kare.kacak < 5,
    `ortanca ${kare.p50.toFixed(1)} ms, bütçeyi aşan %${kare.kacak.toFixed(1)}`);

  // 4) Dış istek yok
  const dis = [];
  const s2 = await tarayici.newPage();
  s2.on("request", (r) => { if (!r.url().startsWith("file://") && !r.url().startsWith("data:")) dis.push(r.url()); });
  await s2.goto(URL);
  await s2.waitForTimeout(1200);
  yaz("hiçbir dış siteye istek gitmiyor", dis.length === 0, dis.slice(0, 2).join(", "));

  yaz("konsol hatası yok", hatalar.length === 0, hatalar[0] || "");

  await tarayici.close();
  const kalan = sonuc.filter((s) => !s.gecti).length;
  console.log(`\n${sonuc.length - kalan}/${sonuc.length} denetim geçti.`);
  process.exit(kalan ? 1 : 0);
})();
