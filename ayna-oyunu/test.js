#!/usr/bin/env node
// Motor ve çözücü için küçük regresyon testleri.
const assert = require("assert");
const Engine = require("./engine.js");
const Solver = require("./solver.js");
const LEVELS = require("./levels.js");

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("ışın düz gider ve hedefi vurur", () => {
  const board = Engine.parseLevel({ name: "t", mirrors: 0, grid: [">..T"] });
  assert.strictEqual(Engine.trace(board, {}).solved, true);
});

test("duvar ışını durdurur", () => {
  const board = Engine.parseLevel({ name: "t", mirrors: 0, grid: [">.#T"] });
  assert.strictEqual(Engine.trace(board, {}).solved, false);
});

test("ayna ışını 90 derece çevirir", () => {
  const board = Engine.parseLevel({ name: "t", mirrors: 1, grid: [">..", "..T"] });
  assert.strictEqual(Engine.trace(board, { "2,0": "\\" }).solved, true);
  assert.strictEqual(Engine.trace(board, { "2,0": "/" }).solved, false);
});

test("prizma ışını üç yöne böler", () => {
  const board = Engine.parseLevel({ name: "t", mirrors: 0, grid: [",T,", ">X.", ",T,"] });
  const result = Engine.trace(board, {});
  assert.strictEqual(result.solved, true, "iki dik kol da hedefi vurmalı");
});

test("aynalar arasındaki döngü sonsuza gitmez", () => {
  const board = Engine.parseLevel({ name: "t", mirrors: 4, grid: [">..", "...", "..T"] });
  const placed = { "1,0": "\\", "1,1": "/", "2,1": "\\", "2,0": "/" };
  const result = Engine.trace(board, placed);
  assert.ok(result.segments.length < 200, "parça sayısı sınırlı kalmalı");
});

test("tahtayı terk eden ışın kayıt altına alınır", () => {
  const board = Engine.parseLevel({ name: "t", mirrors: 0, grid: [">.,", ",T,"] });
  assert.ok(Engine.trace(board, {}).segments.some((s) => s.outside));
});

test("çözücü limitin üstünde çözüm uydurmaz", () => {
  const board = Engine.parseLevel({ name: "t", mirrors: 0, grid: [">..", "..T"] });
  assert.strictEqual(Solver.solve(board, 0), null);
  assert.ok(Solver.solve(board, 1));
});

test("her bölüm kendi ayna limiti içinde çözülebilir", () => {
  for (const level of LEVELS) {
    const board = Engine.parseLevel(level);
    const solution = Solver.solve(board);
    assert.ok(solution, `${level.name} çözülemedi`);
    assert.ok(Engine.trace(board, solution).solved, `${level.name} çözümü hedefleri vurmuyor`);
  }
});

test("bölüm ızgaraları geçerli", () => {
  for (const level of LEVELS) {
    const board = Engine.parseLevel(level);
    assert.ok(board.sources.length > 0 && board.targets.length > 0, level.name);
    assert.ok(board.mirrors > 0, `${level.name} ayna limiti tanımsız`);
  }
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    failed++;
    console.log(`❌ ${name}\n   ${err.message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} test geçti.`);
process.exit(failed ? 1 : 0);
