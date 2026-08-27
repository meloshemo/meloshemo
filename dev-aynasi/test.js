#!/usr/bin/env node
// Dev Aynası - labirent üretimi için regresyon testleri.
const assert = require("assert");
const Maze = require("./maze.js");

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("aynı tohum aynı salonu üretir", () => {
  const a = Maze.generate(20, 20, 42);
  const b = Maze.generate(20, 20, 42);
  assert.deepStrictEqual(a.hWalls, b.hWalls);
  assert.deepStrictEqual(a.vWalls, b.vWalls);
});

test("farklı tohum farklı salon üretir", () => {
  const a = Maze.generate(20, 20, 1);
  const b = Maze.generate(20, 20, 2);
  assert.notDeepStrictEqual(a.hWalls, b.hWalls);
});

test("salonun her karesi yürüyerek ulaşılabilir", () => {
  for (const seed of [1, 99, 12345, 65535]) {
    const maze = Maze.generate(30, 30, seed);
    const dist = Maze.distances(maze, { x: 0, y: 0 });
    assert.strictEqual(dist.filter((d) => d < 0).length, 0, `tohum ${seed}`);
  }
});

test("dış duvarlar kapalı, oyuncu odadan çıkamaz", () => {
  const maze = Maze.generate(16, 16, 7);
  for (let x = 0; x < 16; x++) {
    assert.ok(maze.hWalls[0][x], "kuzey duvarı açık");
    assert.ok(maze.hWalls[16][x], "güney duvarı açık");
  }
  for (let y = 0; y < 16; y++) {
    assert.ok(maze.vWalls[y][0], "batı duvarı açık");
    assert.ok(maze.vWalls[y][16], "doğu duvarı açık");
  }
});

test("binlerce ayna var", () => {
  const maze = Maze.generate(48, 48, 2024);
  const list = Maze.mirrors(maze);
  assert.ok(list.length > 2000, `ayna sayısı ${list.length}`);
  assert.strictEqual(new Set(list.map((m) => m.id)).size, list.length, "ayna kimlikleri benzersiz");
});

test("dev aynası gerçek bir duvar parçası ve başlangıçtan uzak", () => {
  for (const seed of [3, 77, 4096]) {
    const maze = Maze.generate(40, 40, seed);
    const giant = Maze.pickGiant(maze, { x: 0, y: 0 }, seed);
    const all = Maze.mirrors(maze);
    assert.ok(all.some((m) => m.id === giant.id), `tohum ${seed}: dev aynası duvar değil`);
    const cx = giant.horizontal ? giant.x : Math.min(giant.x, maze.width - 1);
    const cy = giant.horizontal ? Math.min(giant.y, maze.height - 1) : giant.y;
    const dist = Maze.distances(maze, { x: 0, y: 0 });
    assert.ok(dist[cy * maze.width + cx] > 10, `tohum ${seed}: dev aynası başlangıca çok yakın`);
  }
});

test("dev aynası tek: kimliği listede bir kez geçer", () => {
  const maze = Maze.generate(40, 40, 555);
  const giant = Maze.pickGiant(maze, { x: 0, y: 0 }, 555);
  const matches = Maze.mirrors(maze).filter((m) => m.id === giant.id);
  assert.strictEqual(matches.length, 1);
});

test("aynı salon kodu aynı salonu ve aynı dev aynayı verir", () => {
  // Salon kodu paylaşımı buna dayanır: iki oyuncu aynı kodu girince
  // birebir aynı labirenti ve aynı dev aynayı oynamalı.
  for (const code of [4821, 1, 99999]) {
    const a = Maze.generate(44, 44, code);
    const b = Maze.generate(44, 44, code);
    assert.deepStrictEqual(a.vWalls, b.vWalls);
    assert.deepStrictEqual(
      Maze.pickGiant(a, { x: 0, y: 0 }, code),
      Maze.pickGiant(b, { x: 0, y: 0 }, code)
    );
  }
});

test("bölüm boyutları büyüdükçe ayna sayısı artar", () => {
  const counts = [40, 44, 48].map((n) => Maze.mirrors(Maze.generate(n, n, 31)).length);
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2], counts.join(" < "));
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
