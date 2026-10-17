// Tek dosyalık sürümü üretir: index.html + style.css + i18n/maze/game tek HTML.
const fs = require("fs");
const path = require("path");
// Araç nerede çalıştırılırsa çalıştırılsın proje kökünü bulur.
const kok = path.resolve(__dirname, "..");
const yol = (f) => path.join(kok, f);
const oku = (f) => fs.readFileSync(yol(f), "utf8");

// Yazı tiplerini CSS'in içine gömer: tek dosyalık sürüm tek başına, hiçbir
// dosyaya ve hiçbir siteye bağlı olmadan açılabilsin.
function yaziTipleriniGom() {
  let css = oku("yazitipi/yazitipi.css");
  return css.replace(/url\("([^"]+\.woff2)"\)/g, (_, dosya) => {
    const veri = fs.readFileSync(yol(path.join("yazitipi", dosya)));
    return `url("data:font/woff2;base64,${veri.toString("base64")}")`;
  });
}

let html = oku("index.html");
html = html.replace(
  '    <link rel="stylesheet" href="yazitipi/yazitipi.css" />',
  "    <style>\n" + yaziTipleriniGom() + "\n    </style>"
);
html = html.replace(
  '    <link rel="stylesheet" href="style.css" />',
  "    <style>\n" + oku("style.css") + "\n    </style>"
);
html = html.replace(
  '    <script src="multiplayer/net.js"></script>\n    <script src="i18n.js"></script>\n    <script src="maze.js"></script>\n    <script src="game.js"></script>',
  ["multiplayer/net.js", "i18n.js", "maze.js", "game.js"]
    .map((f) => "<script>\n" + oku(f) + "\n</script>").join("\n")
);
fs.writeFileSync(yol("dev-aynasi-tek-dosya.html"), html);
console.log("dev-aynasi-tek-dosya.html yazıldı:", (html.length / 1024).toFixed(0), "KB");
