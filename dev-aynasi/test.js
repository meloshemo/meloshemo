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
  // Odacıkların ortasındaki ayna sütunları dört yanı kapalı karelerdir;
  // salonun bir parçası değil, içindeki engeldir. baglantiliMi onları hesaba
  // katmadan "yürünebilir her yere ulaşılıyor mu" sorusunu yanıtlar.
  for (const seed of [1, 99, 12345, 65535]) {
    for (const size of [30, 60, 100]) {
      const maze = Maze.generate(size, size, seed);
      assert.ok(Maze.baglantiliMi(maze), `tohum ${seed}, kenar ${size}`);
    }
  }
});

test("ayna sütunları salonun içinde, kenarında değil", () => {
  // Sütun dış duvara yapışırsa oyuncu geçemeyeceği bir kör nokta görür.
  for (const seed of [3, 777, 40404]) {
    const maze = Maze.generate(60, 60, seed);
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 60; x++) {
        if (!Maze.tamKapali(maze, x, y)) continue;
        assert.ok(x > 0 && y > 0 && x < 59 && y < 59, `sütun kenarda: ${x},${y}`);
      }
    }
  }
});

test("koridorlar upuzun uzamaz", () => {
  // Oyuncunun şikâyeti buydu: otuz kare dümdüz yürümek boş geçiyor.
  const Kural = require("./multiplayer/kural.js");
  for (const bolum of [0, 9, 19]) {
    const doku = Kural.dokuIcin(bolum);
    const maze = Maze.generate(90, 90, 4821, doku);
    let enUzun = 0;
    for (const [yon, dx, dy] of [["E", 1, 0], ["S", 0, 1]]) {
      const geri = yon === "E" ? "W" : "N";
      for (let y = 0; y < 90; y++) {
        for (let x = 0; x < 90; x++) {
          if (!Maze.hasWall(maze, x, y, geri)) continue;
          let n = 1;
          let cx = x;
          let cy = y;
          while (!Maze.hasWall(maze, cx, cy, yon) && n <= 90) { cx += dx; cy += dy; n++; }
          if (n > enUzun) enUzun = n;
        }
      }
    }
    assert.ok(enUzun <= 20, `bölüm ${bolum + 1}: en uzun koridor ${enUzun} kare`);
  }
});

test("her salonda odacıklar açılır", () => {
  const Kural = require("./multiplayer/kural.js");
  for (const bolum of [0, 9, 19]) {
    const maze = Maze.generate(80, 80, 7, Kural.dokuIcin(bolum));
    // 3x3'lük hiç iç duvarı olmayan bir alan = odacık
    let odacik = 0;
    for (let y = 0; y + 2 < 80; y++) {
      for (let x = 0; x + 2 < 80; x++) {
        let acik = true;
        for (let dy = 0; dy < 3 && acik; dy++) {
          for (let dx = 0; dx < 3; dx++) {
            if (dx < 2 && Maze.hasWall(maze, x + dx, y + dy, "E")) { acik = false; break; }
            if (dy < 2 && Maze.hasWall(maze, x + dx, y + dy, "S")) { acik = false; break; }
          }
        }
        if (acik) odacik++;
      }
    }
    assert.ok(odacik > 20, `bölüm ${bolum + 1}: yalnızca ${odacik} açık alan`);
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

test("dev aynasının yeri kuşaklara göre değişir", () => {
  // Aynı salonda üç kuşak da farklı mesafelerde ayna vermeli: oyuncu her
  // seferinde salonun aynı ucuna gitmesin.
  const maze = Maze.generate(40, 40, 909);
  const dist = Maze.distances(maze, { x: 0, y: 0 });
  const max = Math.max(...dist);
  const mesafe = (band) => {
    const g = Maze.pickGiant(maze, { x: 0, y: 0 }, 909, band);
    const cx = g.horizontal ? g.x : Math.min(g.x, maze.width - 1);
    const cy = g.horizontal ? Math.min(g.y, maze.height - 1) : g.y;
    return dist[cy * maze.width + cx] / max;
  };
  const yakin = mesafe("yakin");
  const uzak = mesafe("uzak");
  assert.ok(yakin < 0.5, `yakın kuşak çok uzak: ${yakin.toFixed(2)}`);
  assert.ok(uzak > 0.6, `uzak kuşak çok yakın: ${uzak.toFixed(2)}`);
  assert.ok(uzak > yakin, "uzak kuşak yakından uzakta olmalı");
});

test("kuşak dağılımı üç seçeneği de üretir", () => {
  const sayac = { yakin: 0, orta: 0, uzak: 0 };
  for (let seed = 1; seed <= 300; seed++) sayac[Maze.pickBand(seed)]++;
  assert.ok(sayac.yakin > 30 && sayac.orta > 60 && sayac.uzak > 40,
    `dağılım dengesiz: ${JSON.stringify(sayac)}`);
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

test("çok oyunculu salon: her ek oyuncu +5.000 ayna", () => {
  // Sunucunun kendi kural dosyası kullanılıyor; formül testte kopyalanmıyor.
  const K = require("./multiplayer/kural.js");
  assert.equal(K.hedefAyna(1, 0), 5000, "tek kişi birinci tur 5.000 ayna");
  assert.equal(K.hedefAyna(2, 0), 10000, "iki kişi birinci tur 10.000 ayna");
  assert.equal(K.hedefAyna(4, 0), 20000, "dört kişi birinci tur 20.000 ayna");
  assert.equal(K.hedefAyna(8, 0), 40000, "sekiz kişi birinci tur 40.000 ayna");
  // Bölüm merdiveni: I. tur 5.000, son tur 20.000
  assert.equal(K.bolumAynasi(0), 5000);
  assert.equal(K.bolumAynasi(K.CHAPTERS.length - 1), 20000);
  // Eleme sırasında salon aynı kuralla küçülür
  assert.ok(K.hedefAyna(3, 5) < K.hedefAyna(4, 5), "oyuncu elenince salon küçülür");
  assert.ok(K.roomSize(8, 19) <= 260, "kenar üst sınırı aşılmıyor");
});

test("sıralama: aynı anda bitirenler aynı sırayı paylaşır", () => {
  const K = require("./multiplayer/kural.js");
  // A ve B 0,1 sn arayla (aynı anda sayılır), C çok sonra.
  const s1 = K.siralaBitirenler([
    { id: "a", sure: 12.00 }, { id: "b", sure: 12.10 }, { id: "c", sure: 30.0 },
  ]);
  assert.deepEqual(s1.map((f) => f.sira), [1, 1, 3], "1, 1, 3 olmalı");
  // Belirgin farklarla normal sıra
  const s2 = K.siralaBitirenler([
    { id: "a", sure: 10 }, { id: "b", sure: 20 }, { id: "c", sure: 30 },
  ]);
  assert.deepEqual(s2.map((f) => f.sira), [1, 2, 3]);
});

test("eleme: son sırayı paylaşanlar beraberlik turuna kalır", () => {
  const K = require("./multiplayer/kural.js");
  // Sonuncu tek kişi: doğrudan elenir
  const tek = K.sonSirayiPaylasanlar([
    { id: "a", sure: 10 }, { id: "b", sure: 20 }, { id: "c", sure: 40 },
  ]);
  assert.equal(tek.length, 1);
  assert.equal(tek[0].id, "c");
  // Son iki kişi aynı anda bitirdi: ikisi de döner, kimse kurayla elenmez
  const esit = K.sonSirayiPaylasanlar([
    { id: "a", sure: 10 }, { id: "b", sure: 40.0 }, { id: "c", sure: 40.2 },
  ]);
  assert.equal(esit.length, 2, "eşit bitirenlerin ikisi de son sırayı paylaşır");
  assert.deepEqual(esit.map((f) => f.id).sort(), ["b", "c"]);
});

test("tur süresi salonla büyür ama sınırların dışına çıkmaz", () => {
  const K = require("./multiplayer/kural.js");
  assert.ok(K.turSuresi(5000) >= K.TUR_EN_AZ, "en kısa tur sınırı");
  assert.ok(K.turSuresi(10000) > K.turSuresi(5000), "salon büyüdükçe süre uzar");
  assert.ok(K.turSuresi(500000) <= K.TUR_EN_COK, "en uzun tur sınırı");
});

let failed = 0;
for (const [ad, fn] of tests) {
  try {
    fn();
    console.log(`✅ ${ad}`);
  } catch (err) {
    failed++;
    console.error(`❌ ${ad}\n   ${err.message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} test geçti.`);
process.exit(failed ? 1 : 0);
