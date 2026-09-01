// Tek dosyalık sürümü üretir: index.html + style.css + i18n/maze/game tek HTML.
const fs = require("fs");
const oku = (f) => fs.readFileSync(f, "utf8");

let html = oku("index.html");
html = html.replace(
  '    <link rel="stylesheet" href="style.css" />',
  "    <style>\n" + oku("style.css") + "\n    </style>"
);
html = html.replace(
  '    <script src="i18n.js"></script>\n    <script src="maze.js"></script>\n    <script src="game.js"></script>',
  ["i18n.js", "maze.js", "game.js"].map((f) => "<script>\n" + oku(f) + "\n</script>").join("\n")
);
fs.writeFileSync("dev-aynasi-tek-dosya.html", html);
console.log("dev-aynasi-tek-dosya.html yazıldı:", (html.length / 1024).toFixed(0), "KB");
