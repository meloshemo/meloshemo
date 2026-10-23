// Dev Aynası — mobil denetimi.
//
// Oyunu gerçek telefon ölçülerinde, dokunmatik girdiyle açar ve Android
// paketinde önemli olan şeyleri ölçer: yatay/dikey yerleşim, dokunarak
// yürüme, kare süresi, güvenli alan taşması, çevrimiçi adres denetimi.
//
// Çalıştırma:  node arac/mobil-denetim.js   (npm run denetim:mobil)

const path = require("path");
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");

const KOK = path.join(__dirname, "..");
const PORT = 8123;
const GOLGE = path.join(KOK, "basin", "android");

let gecen = 0, kalan = 0;
function yaz(ad, ok, not = "") {
  console.log(`${ok ? "✅" : "❌"} ${ad}${not ? " — " + not : ""}`);
  ok ? gecen++ : kalan++;
}

// Google Play'in telefon ekran görüntüsü istediği en yaygın oran: 16:9.
const EKRANLAR = {
  yatay: { width: 1920, height: 1080 },
  dikey: { width: 1080, height: 1920 },
};

async function main() {
  const sunucu = spawn(process.execPath, [path.join(KOK, "arac", "sun.js")], {
    cwd: KOK,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const bitir = (k) => { sunucu.kill(); process.exit(k); };
  await new Promise((r) => setTimeout(r, 1200));

  const tarayici = await chromium.launch();
  const sonuc = {};

  for (const [ad, boyut] of Object.entries(EKRANLAR)) {
    const baglam = await tarayici.newContext({
      ...devices["Pixel 7"],
      viewport: boyut,
      screen: boyut,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    const sayfa = await baglam.newPage();
    const hatalar = [];
    sayfa.on("pageerror", (e) => hatalar.push(String(e)));
    await sayfa.goto(`http://localhost:${PORT}/index.html`, { waitUntil: "load" });
    await sayfa.waitForFunction(() => !!window.__devAynasi, null, { timeout: 20000 });

    // Oyunu oyuncunun yolundan başlat: düğmeye dokun.
    await sayfa.tap("#enterSolo");
    await sayfa.waitForTimeout(800);
    await sayfa.evaluate(() => window.__devAynasi.jumpToChapter(0));
    await sayfa.waitForTimeout(600);

    const merkez = { x: boyut.width / 2, y: boyut.height / 2 };

    // Dokunuşu tarayıcı düzeyinde gönderiyoruz (CDP): sayfanın içinde elle
    // kurulan TouchEvent'ler gerçek parmakla birebir aynı davranmıyor.
    const cdp = await baglam.newCDPSession(sayfa);
    const dokun = (tip, x, y) => cdp.send("Input.dispatchTouchEvent", {
      type: tip,
      touchPoints: tip === "touchEnd" ? [] : [{ x, y, id: 1 }],
    });

    // Dört yönü de deniyoruz: labirentin içinde tek bir yön hemen duvara
    // dayanabilir, bu oyunun hatası değil. Aranan şey, parmağın yönünün
    // oyuncuya geçmesi — yani en az bir yönde serbestçe yürüyebilmesi.
    let enIyiYurume = 0;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const once = await sayfa.evaluate(() => window.__devAynasi.oyuncuKonum());
      await dokun("touchStart", merkez.x, merkez.y);
      for (let k = 1; k <= 8; k++) {
        await dokun("touchMove", merkez.x + dx * 20 * k, merkez.y + dy * 20 * k);
        await sayfa.waitForTimeout(25);
      }
      await sayfa.waitForTimeout(900);
      const sonra = await sayfa.evaluate(() => window.__devAynasi.oyuncuKonum());
      await dokun("touchEnd", merkez.x + dx * 160, merkez.y + dy * 160);
      await sayfa.waitForTimeout(120);
      enIyiYurume = Math.max(enIyiYurume, Math.hypot(sonra.x - once.x, sonra.y - once.y));
    }

    // Kare süresi ölçümü.
    const kare = await sayfa.evaluate(() => new Promise((coz) => {
      const ornek = [];
      let n = 0;
      const adim = () => {
        const s = window.__devAynasi.isSuresi();
        if (s >= 0) ornek.push(s);
        if (++n < 150) requestAnimationFrame(adim);
        else {
          ornek.sort((a, b) => a - b);
          coz({
            ortanca: ornek.length ? ornek[Math.floor(ornek.length / 2)] : -1,
            tepe: ornek.length ? ornek[Math.floor(ornek.length * 0.95)] : -1,
            olcek: window.__devAynasi.olcek(),
          });
        }
      };
      requestAnimationFrame(adim);
    }));

    // Yatay taşma: oyun ekranı aşmamalı, yoksa kaydırma çubuğu çıkar ve
    // parmak hareketi sayfayı kaydırır.
    const tasma = await sayfa.evaluate(() => ({
      yatay: document.documentElement.scrollWidth - window.innerWidth,
      dikey: document.documentElement.scrollHeight - window.innerHeight,
    }));

    sonuc[ad] = { yurudu: enIyiYurume, kare, tasma, hatalar };

    await sayfa.screenshot({ path: path.join(GOLGE, `mobil-${ad}.png`) });
    await baglam.close();
  }

  await tarayici.close();

  console.log("");
  for (const [ad, s] of Object.entries(sonuc)) {
    yaz(`${ad}: dokunarak yürüyor`, s.yurudu > 60,
      `en açık yönde ${s.yurudu.toFixed(0)} birim ilerledi`);
    // Ölçülen, karenin kendi iş süresi. 16,7 ms'lik bütçenin altında
    // kalması 60 fps'in koşulu.
    yaz(`${ad}: kare iş süresi`, s.kare.ortanca >= 0 && s.kare.ortanca < 16.7,
      `ortanca ${s.kare.ortanca.toFixed(1)} ms, tepe ${s.kare.tepe.toFixed(1)} ms, ölçek ${s.kare.olcek}`);
    yaz(`${ad}: ekran taşmıyor`, s.tasma.yatay <= 0 && s.tasma.dikey <= 0,
      `yatay ${s.tasma.yatay}px, dikey ${s.tasma.dikey}px`);
    yaz(`${ad}: konsol hatası yok`, s.hatalar.length === 0, s.hatalar.join(" | ") || "temiz");
  }

  console.log(`\n${gecen}/${gecen + kalan} denetim geçti.`);
  bitir(kalan ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
