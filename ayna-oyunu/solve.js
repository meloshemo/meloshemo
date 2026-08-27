// Bölümlerin ayna limiti içinde çözülebildiğini doğrulayan yardımcı betik.
const Engine = require("./engine.js");
const fs = require("fs");
const LEVELS = eval(fs.readFileSync("./levels.js", "utf8") + ";LEVELS");

function solve(board) {
  const cells = Engine.placeableCells(board);
  const placed = {};
  const best = { found: null };
  function rec(index, left) {
    if (best.found) return;
    if (Engine.trace(board, placed).solved) {
      best.found = { ...placed };
      return;
    }
    if (left === 0 || index >= cells.length) return;
    for (let i = index; i < cells.length; i++) {
      const key = `${cells[i].x},${cells[i].y}`;
      for (const m of ["/", "\\"]) {
        placed[key] = m;
        rec(i + 1, left - 1);
        delete placed[key];
        if (best.found) return;
      }
    }
  }
  rec(0, board.mirrors);
  return best.found;
}

let ok = true;
for (const level of LEVELS) {
  const board = Engine.parseLevel(level);
  const solution = solve(board);
  const used = solution ? Object.keys(solution).length : "-";
  console.log(
    `${solution ? "✅" : "❌"} ${level.name} (limit ${level.mirrors}, kullanılan ${used})` +
      (solution ? ` -> ${JSON.stringify(solution)}` : "")
  );
  if (!solution) ok = false;
}
process.exit(ok ? 0 : 1);
