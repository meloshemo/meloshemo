// Ayna Oyunu - ışın motoru (tarayıcı ve Node için ortak)
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const DIRS = {
    right: { dx: 1, dy: 0 },
    left: { dx: -1, dy: 0 },
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
  };
  const SOURCE_CHARS = { ">": "right", "<": "left", "^": "up", v: "down" };

  // Aynadan yansıma: "/" ve "\" için yön dönüşümü
  const REFLECT = {
    "/": { right: "up", left: "down", up: "right", down: "left" },
    "\\": { right: "down", left: "up", up: "left", down: "right" },
  };

  function parseLevel(level) {
    const grid = level.grid;
    const height = grid.length;
    const width = grid[0].length;
    const cells = [];
    const sources = [];
    const targets = [];
    for (let y = 0; y < height; y++) {
      if (grid[y].length !== width) {
        throw new Error(`"${level.name}" bölümünde ${y}. satırın uzunluğu farklı`);
      }
      const row = [];
      for (let x = 0; x < width; x++) {
        const ch = grid[y][x];
        let cell;
        if (ch === "#") cell = { type: "wall" };
        else if (ch === "X") cell = { type: "splitter" };
        else if (ch === "T") cell = { type: "target" };
        else if (ch === "/" || ch === "\\") cell = { type: "mirror", mirror: ch, fixed: true };
        else if (SOURCE_CHARS[ch]) cell = { type: "source", dir: SOURCE_CHARS[ch] };
        else if (ch === ".") cell = { type: "empty", placeable: true };
        else if (ch === ",") cell = { type: "empty", placeable: false };
        else throw new Error(`Bilinmeyen karakter: "${ch}"`);
        if (cell.type === "source") sources.push({ x, y, dir: cell.dir });
        if (cell.type === "target") targets.push({ x, y });
        row.push(cell);
      }
      cells.push(row);
    }
    if (!sources.length) throw new Error(`"${level.name}" bölümünde lazer kaynağı yok`);
    if (!targets.length) throw new Error(`"${level.name}" bölümünde hedef yok`);
    return { width, height, cells, sources, targets, mirrors: level.mirrors, name: level.name, hint: level.hint };
  }

  const PERPENDICULAR = {
    right: ["up", "down"],
    left: ["up", "down"],
    up: ["left", "right"],
    down: ["left", "right"],
  };

  // board: parseLevel çıktısı, placed: "x,y" -> "/" | "\\"
  // Dönen değer: ışın parçaları, vurulan hedefler.
  // Prizma ışını böldüğü için ışınlar bir kuyrukta işlenir; her (kare, yön)
  // durumu bir kez ele alınır, böylece hem döngüler hem de tekrar eden
  // parçalar engellenir.
  function trace(board, placed) {
    const segments = [];
    const hits = new Set();
    const seen = new Set();
    const queue = board.sources.map((s) => ({ x: s.x, y: s.y, dir: s.dir }));

    while (queue.length) {
      const beam = queue.shift();
      const key = `${beam.x},${beam.y},${beam.dir}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const d = DIRS[beam.dir];
      const nx = beam.x + d.dx;
      const ny = beam.y + d.dy;
      if (nx < 0 || ny < 0 || nx >= board.width || ny >= board.height) {
        segments.push({ x1: beam.x, y1: beam.y, x2: nx, y2: ny, outside: true });
        continue;
      }
      const cell = board.cells[ny][nx];
      if (cell.type === "wall") {
        segments.push({ x1: beam.x, y1: beam.y, x2: nx, y2: ny, blocked: true });
        continue;
      }
      segments.push({ x1: beam.x, y1: beam.y, x2: nx, y2: ny });

      if (cell.type === "target") {
        hits.add(`${nx},${ny}`);
        continue;
      }
      if (cell.type === "source") continue;

      if (cell.type === "splitter") {
        for (const dir of [beam.dir, ...PERPENDICULAR[beam.dir]]) {
          queue.push({ x: nx, y: ny, dir });
        }
        continue;
      }

      const mirror = cell.type === "mirror" ? cell.mirror : placed[`${nx},${ny}`];
      queue.push({ x: nx, y: ny, dir: mirror ? REFLECT[mirror][beam.dir] : beam.dir });
    }

    const solved = board.targets.every((t) => hits.has(`${t.x},${t.y}`));
    return { segments, hits, solved };
  }

  function placeableCells(board) {
    const list = [];
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        if (board.cells[y][x].type === "empty" && board.cells[y][x].placeable) list.push({ x, y });
      }
    }
    return list;
  }

  return { DIRS, REFLECT, parseLevel, trace, placeableCells };
});
