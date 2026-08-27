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

  // board: parseLevel çıktısı, placed: "x,y" -> "/" | "\\"
  // Dönen değer: ışın parçaları, vurulan hedefler.
  function trace(board, placed) {
    const segments = [];
    const hits = new Set();
    for (const source of board.sources) {
      let { x, y } = source;
      let dir = source.dir;
      const seen = new Set();
      // Sonsuz döngüyü (aynalar arasında hapsolmuş ışın) engelle.
      for (let step = 0; step < board.width * board.height * 4 + 8; step++) {
        const key = `${x},${y},${dir}`;
        if (seen.has(key)) break;
        seen.add(key);
        const d = DIRS[dir];
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (nx < 0 || ny < 0 || nx >= board.width || ny >= board.height) {
          segments.push({ x1: x, y1: y, x2: nx, y2: ny, outside: true });
          break;
        }
        const cell = board.cells[ny][nx];
        if (cell.type === "wall") {
          segments.push({ x1: x, y1: y, x2: nx, y2: ny, blocked: true });
          break;
        }
        segments.push({ x1: x, y1: y, x2: nx, y2: ny });
        x = nx;
        y = ny;
        if (cell.type === "target") {
          hits.add(`${x},${y}`);
          break;
        }
        if (cell.type === "source") break;
        const mirror = cell.type === "mirror" ? cell.mirror : placed[`${x},${y}`];
        if (mirror) dir = REFLECT[mirror][dir];
      }
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
