// Dev Aynası — mobil denetimi.
//
// Oyunu gerçek telefon ve tablet ölçülerinde, yatay yönde ve dokunmatik
// girdiyle açar. Android paketinde önemli olan her şeyi ölçer:
//
//   - dil: Türkçe olmayan telefonda her şey İngilizce, Türkçede Türkçe
//   - menü: oyunun adı ve "Tek başına gir" ekranda, gösterge çubuğunun
//     arkasında kalmıyor
//   - gösterge çubuğu: tek satır, ekrandan taşmıyor
//   - ayarlar: açılınca ekranın tamamını kaplıyor, kapat düğmesi görünür,
//     geri tuşu kapatıyor
//   - rehber: ilk girişte açılıyor, "başla" düğmesine ulaşılıyor
//   - ilk oda ipuçları: yürü → aynalara bak → dev aynayı görünce içine yürü
//   - dokunarak yürüme, kare süresi, sayfa taşması, konsol hatası
//
// Ekran görüntüleri basin/android/mobil/ altına yazılır.
//
// Çalıştırma:  node arac/mobil-denetim.js   (npm run denetim:mobil)

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { spawn } = require("child_process");

const KOK = path.join(__dirname, "..");
const PORT = 8123;
const GOLGE = path.join(KOK, "basin", "android", "mobil");

let gecen = 0, kalan = 0;
function yaz(ad, ok, not = "") {
  console.log(`${ok ? "✅" : "❌"} ${ad}${not ? " — " + not : ""}`);
  ok ? gecen++ : kalan++;
}

// Yatay yönde CSS pikseli. Android telefonların büyük çoğunluğu 360–430
// yüksekliğinde; en dar yaygın ekran 640×360. Tabletler de denenir.
const EKRANLAR = [
  { ad: "640x360", width: 640, height: 360, dpr: 2 },
  { ad: "667x375", width: 667, height: 375, dpr: 2 },
  { ad: "732x412", width: 732, height: 412, dpr: 2.6 },
  { ad: "740x360", width: 740, height: 360, dpr: 4 },
  { ad: "780x360", width: 780, height: 360, dpr: 3 },
  { ad: "800x360", width: 800, height: 360, dpr: 3 },
  { ad: "851x393", width: 851, height: 393, dpr: 2.75 },
  { ad: "869x412", width: 869, height: 412, dpr: 2.6 },
  { ad: "915x412", width: 915, height: 412, dpr: 3.5 },
  { ad: "932x430", width: 932, height: 430, dpr: 3 },
  { ad: "1024x768-tablet", width: 1024, height: 768, dpr: 2 },
  { ad: "1280x800-tablet", width: 1280, height: 800, dpr: 2 },
];

// Kutunun tamamı görünür alanda mı ve ortasına dokununca o öğe mi
// karşılıyor (başka bir şeyin arkasında kalmamış)?
async function dokunulabilir(sayfa, secici) {
  return sayfa.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { ok: false, neden: "yok" };
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return { ok: false, neden: "görünmüyor" };
    const icinde = r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
    const ust = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const ustte = !!ust && (ust === el || el.contains(ust));
    return { ok: icinde && ustte, neden: !icinde ? `ekran dışında (${Math.round(r.top)},${Math.round(r.bottom)})` : !ustte ? "başka öğenin arkasında" : "" };
  }, secici);
}

async function sayfaAc(tarayici, ekran, dil, uygulama = false) {
  const baglam = await tarayici.newContext({
    viewport: { width: ekran.width, height: ekran.height },
    screen: { width: ekran.width, height: ekran.height },
    deviceScaleFactor: ekran.dpr,
    isMobile: true,
    hasTouch: true,
    locale: dil,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
  });
  const sayfa = await baglam.newPage();
  // Android paketini taklit eder: Capacitor köprüsü sayfaya önceden konur.
  if (uygulama) await sayfa.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true }; });
  const hatalar = [];
  sayfa.on("pageerror", (e) => hatalar.push(String(e)));
  await sayfa.goto(`http://localhost:${PORT}/index.html`, { waitUntil: "load" });
  await sayfa.waitForFunction(() => !!window.__devAynasi, null, { timeout: 20000 });
  await sayfa.waitForTimeout(700);
  return { baglam, sayfa, hatalar };
}

async function ekranDenetle(tarayici, ekran) {
  const sonuc = {};
  const { baglam, sayfa, hatalar } = await sayfaAc(tarayici, ekran, "de-DE");
  const D = (fn, a) => sayfa.evaluate(fn, a);

  // Dil: Almanca telefonda oyun İngilizce açılmalı.
  sonuc.dil = await D(() => ({
    lang: document.documentElement.lang,
    baslik: document.title,
    ad: document.querySelector(".intro-baslik").textContent,
    dugme: document.getElementById("enterSolo").textContent,
  }));

  // Menü: oyunun adı ve ana düğmeler ekranda, çubuğun arkasında değil.
  sonuc.menuAd = await dokunulabilir(sayfa, ".intro-baslik");
  sonuc.menuSolo = await dokunulabilir(sayfa, "#enterSolo");
  sonuc.menuRehber = await dokunulabilir(sayfa, "#howToBtn");

  // Gösterge çubuğu: tek satır ve yatay taşma yok.
  sonuc.hud = await D(() => {
    const h = document.querySelector(".hud");
    const r = h.getBoundingClientRect();
    const dugmeler = [...h.querySelectorAll(".btn")].filter((b) => b.offsetParent);
    const tasan = dugmeler.filter((b) => b.getBoundingClientRect().right > innerWidth + 0.5).map((b) => b.id);
    return { yukseklik: Math.round(r.height), tasan };
  });

  sonuc.tasmaMenu = await D(() => ({
    yatay: document.documentElement.scrollWidth - innerWidth,
    dikey: document.documentElement.scrollHeight - innerHeight,
  }));
  await sayfa.screenshot({ path: path.join(GOLGE, `${ekran.ad}-1-menu.png`) });

  // Ayarlar: tam ekran, kapat düğmesi görünür, geri tuşu kapatır.
  await sayfa.tap("#settingsBtn");
  await sayfa.waitForTimeout(700);
  sonuc.ayar = await D(() => {
    const r = document.getElementById("settings").getBoundingClientRect();
    return { tam: r.left <= 0 && r.top <= 0 && r.right >= innerWidth - 0.5 && r.bottom >= innerHeight - 0.5 };
  });
  sonuc.ayarKapat = await dokunulabilir(sayfa, '[data-kapat="settings"]');
  await sayfa.screenshot({ path: path.join(GOLGE, `${ekran.ad}-2-ayarlar.png`) });
  sonuc.ayarGeri = await D(() => window.__geriTusu() && document.getElementById("settings").hidden);
  sonuc.geriBos = await D(() => window.__geriTusu() === false);

  // Rehber: ilk "Tek başına gir"de açılır, başla düğmesine ulaşılır.
  await sayfa.tap("#enterSolo");
  await sayfa.waitForTimeout(700);
  sonuc.rehberAcildi = await D(() => !document.getElementById("guide").hidden);
  sonuc.rehberKapat = await dokunulabilir(sayfa, '[data-kapat="guide"]');
  await sayfa.screenshot({ path: path.join(GOLGE, `${ekran.ad}-3-rehber.png`) });
  await sayfa.evaluate(() => document.getElementById("guideStart").scrollIntoView({ block: "center" }));
  await sayfa.waitForTimeout(200);
  sonuc.rehberBasla = await dokunulabilir(sayfa, "#guideStart");
  await sayfa.tap("#guideStart");
  await sayfa.waitForTimeout(900);
  sonuc.oyunBasladi = await D(() => window.__devAynasi.state().running !== false && document.getElementById("intro").hidden);

  // İlk oda ipuçları: önce "yürü".
  const ipucu = () => D(() => (document.getElementById("ipucu").hidden ? "" : document.getElementById("ipucu").textContent));
  sonuc.ipucuYuru = await ipucu();
  await sayfa.screenshot({ path: path.join(GOLGE, `${ekran.ad}-4-ipucu.png`) });

  // Dokunarak yürüme (CDP: gerçek parmak gibi). Dört yön denenir; tek yön
  // duvara dayanabilir, bu oyunun hatası değil.
  const merkez = { x: ekran.width / 2, y: ekran.height / 2 };
  const cdp = await baglam.newCDPSession(sayfa);
  const dokun = (tip, x, y) => cdp.send("Input.dispatchTouchEvent", {
    type: tip,
    touchPoints: tip === "touchEnd" ? [] : [{ x, y, id: 1 }],
  });
  let enIyiYurume = 0;
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const once = await D(() => window.__devAynasi.oyuncuKonum());
    await dokun("touchStart", merkez.x, merkez.y);
    for (let k = 1; k <= 8; k++) {
      await dokun("touchMove", merkez.x + dx * 15 * k, merkez.y + dy * 15 * k);
      await sayfa.waitForTimeout(25);
    }
    await sayfa.waitForTimeout(900);
    const sonra = await D(() => window.__devAynasi.oyuncuKonum());
    await dokun("touchEnd", 0, 0);
    await sayfa.waitForTimeout(120);
    enIyiYurume = Math.max(enIyiYurume, Math.hypot(sonra.x - once.x, sonra.y - once.y));
  }
  sonuc.yurudu = enIyiYurume;
  sonuc.ipucuBak = await ipucu();

  // Dev ayna görününce "içine yürü".
  await D(() => window.__devAynasi.teleportToGiant());
  await sayfa.waitForTimeout(500);
  sonuc.ipucuBuldu = await ipucu();

  // Kare süresi.
  sonuc.kare = await D(() => new Promise((coz) => {
    const ornek = [];
    let n = 0;
    const adim = () => {
      const s = window.__devAynasi.isSuresi();
      if (s >= 0) ornek.push(s);
      if (++n < 120) requestAnimationFrame(adim);
      else {
        ornek.sort((a, b) => a - b);
        coz({ ortanca: ornek.length ? ornek[Math.floor(ornek.length / 2)] : -1 });
      }
    };
    requestAnimationFrame(adim);
  }));
  sonuc.tasmaOyun = await D(() => ({
    yatay: document.documentElement.scrollWidth - innerWidth,
    dikey: document.documentElement.scrollHeight - innerHeight,
  }));
  sonuc.hatalar = hatalar;
  await baglam.close();
  return sonuc;
}

async function main() {
  fs.mkdirSync(GOLGE, { recursive: true });
  const sunucu = spawn(process.execPath, [path.join(KOK, "arac", "sun.js")], {
    cwd: KOK,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const bitir = (k) => { sunucu.kill(); process.exit(k); };
  await new Promise((r) => setTimeout(r, 1200));
  // CHROME ortam değişkeni verilirse Playwright'ın kendi Chromium'u yerine
  // makinedeki tarayıcı kullanılır.
  const tarayici = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});

  // Dil kuralı: yalnızca Türkçe cihaz Türkçe görür.
  for (const [dil, beklenen] of [["tr-TR", "tr"], ["en-US", "en"], ["de-DE", "en"], ["ar-SA", "en"], ["pt-BR", "en"]]) {
    const { baglam, sayfa, hatalar } = await sayfaAc(tarayici, EKRANLAR[6], dil);
    const l = await sayfa.evaluate(() => ({ lang: document.documentElement.lang, ad: document.title }));
    yaz(`dil ${dil} → ${beklenen}`, l.lang === beklenen && hatalar.length === 0, `${l.lang}, "${l.ad}"`);
    // Türkçe sonsuz salon: kural adları sözlükte eksikti, odayı açarken
    // hata atıyordu.
    if (beklenen === "tr") {
      await sayfa.evaluate(() => document.getElementById("enterEndless").click());
      await sayfa.waitForTimeout(800);
      const kart = await sayfa.evaluate(() => document.getElementById("cardText").textContent);
      yaz("Türkçe sonsuz salon açılıyor", hatalar.length === 0, hatalar.join(" | ") || kart);
    }
    await baglam.close();
  }

  // Türkçe yazılar daha uzun: gösterge çubuğu ve menü Türkçede de sığmalı.
  console.log("");
  for (const ekran of EKRANLAR) {
    for (const uyg of [false, true]) {
    const { baglam, sayfa } = await sayfaAc(tarayici, ekran, "tr-TR", uyg);
    const h = await sayfa.evaluate(() => {
      const hud = document.querySelector(".hud");
      const tasan = [...hud.querySelectorAll(".btn")].filter((b) => b.offsetParent && b.getBoundingClientRect().right > innerWidth + 0.5).map((b) => b.id);
      return { tasan, yukseklik: Math.round(hud.getBoundingClientRect().height) };
    });
    const solo = await dokunulabilir(sayfa, "#enterSolo");
    yaz(`${ekran.ad} TR ${uyg ? "uygulama" : "tarayıcı"}: çubuk taşmıyor, "Tek başına gir" dokunulabilir`, h.tasan.length === 0 && solo.ok,
      `çubuk ${h.yukseklik}px${h.tasan.length ? ", taşan: " + h.tasan.join(",") : ""}${solo.neden ? ", " + solo.neden : ""}`);
    await sayfa.screenshot({ path: path.join(GOLGE, `${ekran.ad}-0-menu-tr${uyg ? "-uygulama" : ""}.png`) });
    await baglam.close();
    }
  }

  for (const ekran of EKRANLAR) {
    const s = await ekranDenetle(tarayici, ekran);
    const e = ekran.ad;
    console.log(`\n— ${e}`);
    yaz(`${e}: Almanca cihazda İngilizce`, s.dil.lang === "en" && s.dil.ad === "Hall of Giants", `${s.dil.lang} · ${s.dil.ad} · ${s.dil.dugme}`);
    yaz(`${e}: menüde oyunun adı görünüyor`, s.menuAd.ok, s.menuAd.neden);
    yaz(`${e}: "Enter alone" dokunulabilir`, s.menuSolo.ok, s.menuSolo.neden);
    yaz(`${e}: "How to play" dokunulabilir`, s.menuRehber.ok, s.menuRehber.neden);
    yaz(`${e}: gösterge çubuğu taşmıyor`, s.hud.tasan.length === 0, `yükseklik ${s.hud.yukseklik}px${s.hud.tasan.length ? ", taşan: " + s.hud.tasan.join(",") : ""}`);
    yaz(`${e}: sayfa taşmıyor`, s.tasmaMenu.yatay <= 0 && s.tasmaMenu.dikey <= 0 && s.tasmaOyun.yatay <= 0 && s.tasmaOyun.dikey <= 0,
      `menü ${s.tasmaMenu.yatay}/${s.tasmaMenu.dikey}px, oyun ${s.tasmaOyun.yatay}/${s.tasmaOyun.dikey}px`);
    yaz(`${e}: ayarlar tam ekran açılıyor`, s.ayar.tam);
    yaz(`${e}: ayarların kapat düğmesi görünür`, s.ayarKapat.ok, s.ayarKapat.neden);
    yaz(`${e}: geri tuşu ayarları kapatıyor`, s.ayarGeri && s.geriBos);
    yaz(`${e}: ilk girişte rehber açılıyor`, s.rehberAcildi && s.rehberKapat.ok, s.rehberKapat.neden);
    yaz(`${e}: rehberden oyuna geçiliyor`, s.rehberBasla.ok && s.oyunBasladi, s.rehberBasla.neden);
    yaz(`${e}: ipucu 1 "yürü"`, /drag/i.test(s.ipucuYuru), s.ipucuYuru);
    yaz(`${e}: dokunarak yürüyor`, s.yurudu > 60, `${s.yurudu.toFixed(0)} birim`);
    yaz(`${e}: ipucu 2 "aynalara bak"`, /real size/i.test(s.ipucuBak), s.ipucuBak);
    yaz(`${e}: ipucu 3 "içine yürü"`, /walk into/i.test(s.ipucuBuldu), s.ipucuBuldu);
    yaz(`${e}: kare iş süresi`, s.kare.ortanca >= 0 && s.kare.ortanca < 16.7, `ortanca ${s.kare.ortanca.toFixed(1)} ms`);
    yaz(`${e}: konsol hatası yok`, s.hatalar.length === 0, s.hatalar.join(" | ") || "temiz");
  }

  await tarayici.close();
  console.log(`\n${gecen}/${gecen + kalan} denetim geçti. Görüntüler: basin/android/mobil/`);
  bitir(kalan ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
