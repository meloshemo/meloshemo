// Dev Aynası — ikon ve mağaza görselleri üreteci.
//
// Tek kaynak `ikon/dev-aynasi-ikon.svg`. Buradan hem Android'in istediği
// bütün yoğunluklar hem de Google Play'in istediği boyutlar çıkar. Elle
// kırpılmış PNG tutmak yerine üretmenin nedeni: ikon değişince hepsi tek
// komutla tazeleniyor ve aralarında fark kalmıyor.
//
// Render için Chromium kullanılıyor (Playwright). ImageMagick'in SVG
// motoru gradyanları doğru çizmiyor, rsvg-convert de bu makinede yok.
//
// Çalıştırma:  node arac/ikon.js   (npm run ikon)

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const KOK = path.join(__dirname, "..");
const SVG = fs.readFileSync(path.join(KOK, "ikon", "dev-aynasi-ikon.svg"), "utf8");
const ANDROID = path.join(KOK, "mobil", "android", "app", "src", "main", "res");
const MAGAZA = path.join(KOK, "basin", "android");

// Uyarlanabilir ikonun güvenli alanı: 108 birimlik tuvalin ortadaki 72
// birimi. Köşelerdeki her şey cihazın maskesiyle kesilebilir, bu yüzden
// çizim bu orana sığdırılır.
const GUVENLI_ORAN = 72 / 108;

// --- SVG çeşitleri ---------------------------------------------------------

/** Tam ikon: kendi yuvarlak köşeleriyle. Eski (legacy) launcher ikonu ve
 *  Play Store'un 512'lik ikonu bunu kullanır. */
const tamSvg = () => SVG;

/** Yalnızca zemin gradyanı, köşe yuvarlaması olmadan: uyarlanabilir ikonun
 *  arka katmanı. Maske ne şekil keserse kessin altında renk kalsın diye
 *  kare ve taşmalı. */
function zeminSvg() {
  return SVG
    .replace('<g clip-path="url(#kutu)">', "<g>")
    // zemin dışındaki her şeyi at: ilk rect'ten sonrasını kes.
    .replace(/(<rect width="1024" height="1024" fill="url\(#zemin\)"\/>)[\s\S]*?(<\/g>\s*<\/svg>)/, "$1$2");
}

/** Zemin olmadan yalnızca çizim: uyarlanabilir ikonun ön katmanı.
 *  Güvenli alana sığsın diye küçültülüp ortalanır. */
function onSvg() {
  const olcek = GUVENLI_ORAN;
  const kaydir = (1024 - 1024 * olcek) / 2;
  return SVG
    .replace('<g clip-path="url(#kutu)">',
      `<g transform="translate(${kaydir} ${kaydir}) scale(${olcek})">`)
    .replace('<rect width="1024" height="1024" fill="url(#zemin)"/>', "");
}

// --- render ----------------------------------------------------------------

async function render(sayfa, svg, boyut, hedef, zeminRengi = null) {
  await sayfa.setViewportSize({ width: boyut, height: boyut });
  await sayfa.setContent(
    `<!doctype html><html><body style="margin:0;background:${zeminRengi || "transparent"}">` +
    `<div style="width:${boyut}px;height:${boyut}px">` +
    svg.replace(/width="1024" height="1024"/, `width="${boyut}" height="${boyut}"`) +
    `</div></body></html>`
  );
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  await sayfa.screenshot({ path: hedef, omitBackground: !zeminRengi });
}

// Android yoğunlukları. Eski ikon 48dp, uyarlanabilir katmanlar 108dp.
const YOGUNLUK = [
  { ad: "mdpi", kat: 1 },
  { ad: "hdpi", kat: 1.5 },
  { ad: "xhdpi", kat: 2 },
  { ad: "xxhdpi", kat: 3 },
  { ad: "xxxhdpi", kat: 4 },
];

async function main() {
  const tarayici = await chromium.launch();
  const sayfa = await tarayici.newPage({ deviceScaleFactor: 1 });
  const uretilen = [];

  for (const y of YOGUNLUK) {
    const eski = Math.round(48 * y.kat);
    const katman = Math.round(108 * y.kat);
    const dizin = path.join(ANDROID, `mipmap-${y.ad}`);

    await render(sayfa, tamSvg(), eski, path.join(dizin, "ic_launcher.png"));
    await render(sayfa, tamSvg(), eski, path.join(dizin, "ic_launcher_round.png"));
    await render(sayfa, onSvg(), katman, path.join(dizin, "ic_launcher_foreground.png"));
    await render(sayfa, zeminSvg(), katman, path.join(dizin, "ic_launcher_background.png"));
    uretilen.push(`mipmap-${y.ad}: ${eski}px ikon, ${katman}px katmanlar`);
  }

  // Google Play mağaza ikonu: 512×512, saydamlık YOK (Play saydam ikonu
  // reddediyor), bu yüzden koyu zemine düzleştiriliyor.
  await render(sayfa, tamSvg(), 512, path.join(MAGAZA, "play-ikon-512.png"), "#07050c");
  uretilen.push("basin/android/play-ikon-512.png: 512×512 (saydamsız)");

  await tarayici.close();
  console.log(uretilen.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
