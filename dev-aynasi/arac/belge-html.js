// Dev Aynası — hukuki belgeleri yayımlanabilir HTML'e çevirir.
//
// Google Play ve diğer mağazalar gizlilik politikası için **çalışan bir
// bağlantı** ister; markdown dosyası kabul etmezler. Bu araç
// `belgeler/` altındaki markdown'ları tek başına duran, bağımlılıksız
// HTML sayfalarına çevirir. Çıktı bir web sunucusuna ya da GitHub
// Pages'e olduğu gibi kopyalanır.
//
// Sayfalar oyunun paletini kullanır ama yazı tipi gömmez: hukuki metnin
// her yerde, her koşulda açılması gerekiyor.
//
// Çalıştırma:  node arac/belge-html.js   (npm run belge:html)

const fs = require("fs");
const path = require("path");

const KOK = path.join(__dirname, "..");
const CIKTI = path.join(KOK, "belgeler", "web");

const SAYFALAR = [
  { kaynak: "belgeler/GIZLILIK-POLITIKASI.md", hedef: "gizlilik.html", dil: "tr",
    baslik: "Gizlilik Politikası — Dev Aynası", esi: "privacy.html", esiAd: "English" },
  { kaynak: "belgeler/KULLANIM-KOSULLARI.md", hedef: "kullanim.html", dil: "tr",
    baslik: "Kullanım Koşulları — Dev Aynası", esi: "terms.html", esiAd: "English" },
  { kaynak: "belgeler/en/PRIVACY-POLICY.md", hedef: "privacy.html", dil: "en",
    baslik: "Privacy Policy — Hall of Giants", esi: "gizlilik.html", esiAd: "Türkçe" },
  { kaynak: "belgeler/en/TERMS-OF-USE.md", hedef: "terms.html", dil: "en",
    baslik: "Terms of Use — Hall of Giants", esi: "kullanim.html", esiAd: "Türkçe" },
];

const kacis = (s) => s
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Küçük bir markdown çevirici. Dışarıdan paket çekmemek için elle yazıldı:
// bu belgelerde yalnızca başlık, paragraf, liste, tablo, kalın, italik,
// kod ve bağlantı var.
function satirIci(s) {
  return kacis(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

function cevir(md) {
  const satirlar = md.split("\n");
  const out = [];
  let liste = false, tablo = false, tabloBasligi = false;

  const listeKapat = () => { if (liste) { out.push("</ul>"); liste = false; } };
  const tabloKapat = () => { if (tablo) { out.push("</tbody></table>"); tablo = false; tabloBasligi = false; } };

  for (const ham of satirlar) {
    const s = ham.trimEnd();

    if (!s.trim()) { listeKapat(); tabloKapat(); continue; }

    const basl = s.match(/^(#{1,6})\s+(.*)$/);
    if (basl) {
      listeKapat(); tabloKapat();
      const n = basl[1].length;
      out.push(`<h${n}>${satirIci(basl[2])}</h${n}>`);
      continue;
    }

    // Tablo
    if (/^\|/.test(s)) {
      const hucreler = s.split("|").slice(1, -1).map((h) => h.trim());
      if (/^[\s|:-]+$/.test(s)) { continue; }          // ayraç satırı
      if (!tablo) {
        listeKapat();
        out.push("<table><thead><tr>" +
          hucreler.map((h) => `<th>${satirIci(h)}</th>`).join("") +
          "</tr></thead><tbody>");
        tablo = true; tabloBasligi = true;
        continue;
      }
      out.push("<tr>" + hucreler.map((h) => `<td>${satirIci(h)}</td>`).join("") + "</tr>");
      continue;
    }
    tabloKapat();

    const mad = s.match(/^[-*]\s+(.*)$/);
    if (mad) {
      if (!liste) { out.push("<ul>"); liste = true; }
      out.push(`<li>${satirIci(mad[1])}</li>`);
      continue;
    }
    listeKapat();

    if (/^>\s?/.test(s)) { out.push(`<blockquote>${satirIci(s.replace(/^>\s?/, ""))}</blockquote>`); continue; }

    out.push(`<p>${satirIci(s)}</p>`);
  }
  listeKapat(); tabloKapat();
  return out.join("\n");
}

const KABUK = (sayfa, govde) => `<!doctype html>
<html lang="${sayfa.dil}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${kacis(sayfa.baslik)}</title>
<meta name="robots" content="index, follow">
<style>
  :root { color-scheme: dark light; }
  body {
    margin: 0; padding: 2.5rem 1.25rem 5rem;
    background: #0a0710; color: #e8e1ee;
    font: 16px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  main { max-width: 46rem; margin: 0 auto; }
  a { color: #d8b26a; }
  h1, h2, h3, h4 { line-height: 1.25; color: #f4ecdf; }
  h1 { font-size: 1.9rem; margin: 0 0 .4rem; }
  h2 { font-size: 1.3rem; margin: 2.2rem 0 .6rem;
       border-top: 1px solid rgba(216,178,106,.22); padding-top: 1.1rem; }
  h3 { font-size: 1.05rem; margin: 1.5rem 0 .4rem; color: #d8b26a; }
  code { background: rgba(216,178,106,.12); padding: .12em .4em;
         border-radius: .25em; font-size: .92em; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: .95rem; }
  th, td { border: 1px solid rgba(216,178,106,.22); padding: .5rem .65rem;
           text-align: left; vertical-align: top; }
  th { background: rgba(216,178,106,.08); }
  blockquote { margin: 1rem 0; padding: .6rem 1rem;
               border-left: 3px solid #d8b26a; background: rgba(216,178,106,.06); }
  .ust { display: flex; justify-content: space-between; align-items: baseline;
         gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
         font-size: .9rem; color: #9a8fa8; }
  .alt { margin-top: 3rem; padding-top: 1rem; font-size: .85rem; color: #9a8fa8;
         border-top: 1px solid rgba(216,178,106,.22); }
  @media (prefers-color-scheme: light) {
    body { background: #fbf8f4; color: #241c2e; }
    h1, h2, h3, h4 { color: #1a1222; }
    h3 { color: #8d6f3f; }
    a { color: #8d6f3f; }
    th { background: rgba(141,111,63,.08); }
    th, td, h2, .alt { border-color: rgba(141,111,63,.25); }
    .ust, .alt { color: #6b6076; }
    blockquote { border-left-color: #8d6f3f; background: rgba(141,111,63,.06); }
    code { background: rgba(141,111,63,.12); }
  }
</style>
</head>
<body>
<main>
  <div class="ust">
    <span>Dev Aynası</span>
    <a href="${sayfa.esi}">${sayfa.esiAd}</a>
  </div>
${govde}
  <div class="alt">
    ${sayfa.dil === "tr"
      ? 'Dev Aynası · <a href="mailto:y.osmanmelih@gmail.com">y.osmanmelih@gmail.com</a>'
      : 'Hall of Giants · <a href="mailto:y.osmanmelih@gmail.com">y.osmanmelih@gmail.com</a>'}
  </div>
</main>
</body>
</html>
`;

fs.rmSync(CIKTI, { recursive: true, force: true });
fs.mkdirSync(CIKTI, { recursive: true });

const uretilen = [];
for (const sayfa of SAYFALAR) {
  const md = fs.readFileSync(path.join(KOK, sayfa.kaynak), "utf8");
  const html = KABUK(sayfa, cevir(md));
  const hedef = path.join(CIKTI, sayfa.hedef);
  fs.writeFileSync(hedef, html);
  uretilen.push(`${path.relative(KOK, hedef)} (${Math.round(html.length / 1024)} KB)`);
}

// Dizin sayfası: tek bağlantı verip ikisine birden ulaşmak için.
fs.writeFileSync(path.join(CIKTI, "index.html"), KABUK(
  { dil: "tr", baslik: "Dev Aynası — Belgeler", esi: "privacy.html", esiAd: "English" },
  `<h1>Dev Aynası</h1>
<p>Oyunun hukuki belgeleri.</p>
<ul>
  <li><a href="gizlilik.html">Gizlilik Politikası</a> · <a href="privacy.html">Privacy Policy</a></li>
  <li><a href="kullanim.html">Kullanım Koşulları</a> · <a href="terms.html">Terms of Use</a></li>
</ul>`
));
uretilen.push("belgeler/web/index.html");

console.log(uretilen.join("\n"));
