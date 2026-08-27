#!/usr/bin/env node
// Her bölümün ayna limiti içinde çözülebildiğini doğrular.
const Engine = require("./engine.js");
const Solver = require("./solver.js");
const LEVELS = require("./levels.js");

let ok = true;
for (const level of LEVELS) {
  const board = Engine.parseLevel(level);
  const solution = Solver.solve(board);
  const used = solution ? Object.keys(solution).length : "-";
  console.log(
    `${solution ? "✅" : "❌"} ${level.name} (limit ${level.mirrors}, en az ${used})` +
      (solution ? ` -> ${JSON.stringify(solution)}` : "")
  );
  if (!solution) ok = false;
}
console.log(ok ? "\nTüm bölümler çözülebilir." : "\nÇözülemeyen bölüm var!");
process.exit(ok ? 0 : 1);
