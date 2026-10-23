// Dev Aynası — mağaza metni ve görsel denetimi.
//
// Google Play her alanı karakter sınırıyla sınırlıyor ve sınırı aşan metni
// kaydetmiyor. Görsellerde de boyut ve saydamlık şartı var. Bunları elle
// saymak yerine ölçüyoruz: metin dosyasındaki kod bloklarının uzunluğu ve
// üretilen PNG'lerin boyutu burada denetleniyor.
//
// Çalıştırma:  node arac/magaza-denetim.js   (npm run magaza:denetim)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const KOK = path.join(__dirname, "..");
let gecen = 0, kalan = 0;

function yaz(ad, ok, not = "") {
  console.log(`${ok ? "✅" : "❌"} ${ad}${not ? " — " + not : ""}`);
  ok ? gecen++ : kalan++;
}

/** Bir başlığın altındaki ilk ``` bloğunun içeriğini döndürür. */
function blok(metin, baslikParcasi) {
  const i = metin.indexOf(baslikParcasi);
  if (i < 0) return null;
  const bas = metin.indexOf("```", i);
  if (bas < 0) return null;
  const son = metin.indexOf("```", bas + 3);
  if (son < 0) return null;
  return metin.slice(bas + 3, son).replace(/^\n/, "").replace(/\n$/, "");
}

// Play'in alan sınırları.
const ALANLAR = [
  { baslik: "## 2. Uygulama adı", ad: "uygulama adı", sinir: 30 },
  { baslik: "## 3. Kısa açıklama", ad: "kısa açıklama", sinir: 80 },
  { baslik: "## 4. Tam açıklama", ad: "tam açıklama", sinir: 4000 },
  { baslik: "## 5. Sürüm notları", ad: "sürüm notları", sinir: 500 },
];
const ALANLAR_EN = [
  { baslik: "## 2. App name", ad: "app name", sinir: 30 },
  { baslik: "## 3. Short description", ad: "short description", sinir: 80 },
  { baslik: "## 4. Full description", ad: "full description", sinir: 4000 },
  { baslik: "## 5. Release notes", ad: "release notes", sinir: 500 },
];

function metinDenetle(dosya, alanlar, etiket) {
  const tam = path.join(KOK, dosya);
  if (!fs.existsSync(tam)) { yaz(`${etiket}: dosya var`, false, dosya); return; }
  const metin = fs.readFileSync(tam, "utf8");
  for (const a of alanlar) {
    const icerik = blok(metin, a.baslik);
    if (icerik === null) { yaz(`${etiket}: ${a.ad}`, false, "blok bulunamadı"); continue; }
    // Play karakter sayar, bayt değil: emoji ve Türkçe harfler tek karakter.
    const uzunluk = [...icerik].length;
    yaz(`${etiket}: ${a.ad}`, uzunluk > 0 && uzunluk <= a.sinir,
      `${uzunluk}/${a.sinir} karakter`);
  }
}

function gorselBilgi(dosya) {
  const cikti = execFileSync("identify", ["-format", "%w %h %A", dosya], { encoding: "utf8" });
  const [w, h, alfa] = cikti.trim().split(/\s+/);
  return { w: Number(w), h: Number(h), alfa: alfa !== "False" && alfa !== "Undefined" };
}

function gorselDenetle() {
  const ikon = path.join(KOK, "basin", "android", "play-ikon-512.png");
  if (fs.existsSync(ikon)) {
    const g = gorselBilgi(ikon);
    yaz("ikon 512×512 ve saydamsız", g.w === 512 && g.h === 512 && !g.alfa,
      `${g.w}×${g.h}, saydam=${g.alfa ? "evet" : "hayır"}`);
  } else yaz("ikon 512×512 ve saydamsız", false, "dosya yok");

  for (const dil of ["tr", "en"]) {
    const f = path.join(KOK, "basin", "android", `play-ozellik-1024x500-${dil}.png`);
    if (!fs.existsSync(f)) { yaz(`özellik grafiği (${dil})`, false, "dosya yok"); continue; }
    const g = gorselBilgi(f);
    yaz(`özellik grafiği (${dil}) 1024×500 ve saydamsız`,
      g.w === 1024 && g.h === 500 && !g.alfa,
      `${g.w}×${g.h}, saydam=${g.alfa ? "evet" : "hayır"}`);
  }

  // Telefon ekran görüntüsü: en az 2, kenar 320–3840 arası.
  const ekranlar = fs.readdirSync(path.join(KOK, "basin"))
    .filter((f) => /^\d\d-.*\.png$/.test(f));
  const uygun = ekranlar.filter((f) => {
    const g = gorselBilgi(path.join(KOK, "basin", f));
    const kucuk = Math.min(g.w, g.h), buyuk = Math.max(g.w, g.h);
    return kucuk >= 320 && buyuk <= 3840;
  });
  yaz("telefon ekran görüntüsü (en az 2, 320–3840 px)", uygun.length >= 2,
    `${uygun.length} uygun dosya`);
}

metinDenetle("belgeler/PLAY-MAGAZA-METNI.md", ALANLAR, "TR");
metinDenetle("belgeler/en/PLAY-STORE-COPY.md", ALANLAR_EN, "EN");
gorselDenetle();

console.log(`\n${gecen}/${gecen + kalan} denetim geçti.`);
process.exit(kalan ? 1 : 0);
