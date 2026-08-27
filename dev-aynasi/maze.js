// Dev Aynası - labirent üretimi (tarayıcı ve Node için ortak)
// Duvarların tamamı aynadır; oyun bu duvar parçalarını "ayna" olarak sayar.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Maze = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Aynı tohum aynı odayı üretsin diye küçük bir sözde rastgele üreteç.
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function next() {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  // hWalls[y][x]: (x, y-1) ile (x, y) arasındaki yatay duvar  (y: 0..h)
  // vWalls[y][x]: (x-1, y) ile (x, y) arasındaki dikey duvar   (x: 0..w)
  function generate(width, height, seed) {
    const rand = rng(seed);
    const hWalls = [];
    for (let y = 0; y <= height; y++) hWalls.push(new Array(width).fill(true));
    const vWalls = [];
    for (let y = 0; y < height; y++) vWalls.push(new Array(width + 1).fill(true));

    const visited = new Array(width * height).fill(false);
    const stack = [{ x: 0, y: 0 }];
    visited[0] = true;

    while (stack.length) {
      const cur = stack[stack.length - 1];
      const options = [];
      if (cur.y > 0 && !visited[(cur.y - 1) * width + cur.x]) options.push("N");
      if (cur.y < height - 1 && !visited[(cur.y + 1) * width + cur.x]) options.push("S");
      if (cur.x > 0 && !visited[cur.y * width + cur.x - 1]) options.push("W");
      if (cur.x < width - 1 && !visited[cur.y * width + cur.x + 1]) options.push("E");
      if (!options.length) {
        stack.pop();
        continue;
      }
      const dir = options[Math.floor(rand() * options.length)];
      let nx = cur.x;
      let ny = cur.y;
      if (dir === "N") { hWalls[cur.y][cur.x] = false; ny--; }
      if (dir === "S") { hWalls[cur.y + 1][cur.x] = false; ny++; }
      if (dir === "W") { vWalls[cur.y][cur.x] = false; nx--; }
      if (dir === "E") { vWalls[cur.y][cur.x + 1] = false; nx++; }
      visited[ny * width + nx] = true;
      stack.push({ x: nx, y: ny });
    }

    // Birkaç duvarı fazladan kaldırıp çıkmaz sokakları azalt: oda daha çok
    // "salon" gibi dolaşılır, tek çözümlü labirent gibi değil.
    const extra = Math.floor(width * height * 0.06);
    for (let i = 0; i < extra; i++) {
      const x = 1 + Math.floor(rand() * (width - 2));
      const y = 1 + Math.floor(rand() * (height - 2));
      if (rand() < 0.5) hWalls[y][x] = false;
      else vWalls[y][x] = false;
    }

    return { width, height, hWalls, vWalls };
  }

  // Tüm ayna parçalarını (birim duvar kenarları) listeler.
  function mirrors(maze) {
    const list = [];
    for (let y = 0; y <= maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (maze.hWalls[y][x]) list.push({ id: `h${x},${y}`, x, y, horizontal: true });
      }
    }
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x <= maze.width; x++) {
        if (maze.vWalls[y][x]) list.push({ id: `v${x},${y}`, x, y, horizontal: false });
      }
    }
    return list;
  }

  function hasWall(maze, cx, cy, side) {
    if (side === "N") return maze.hWalls[cy][cx];
    if (side === "S") return maze.hWalls[cy + 1][cx];
    if (side === "W") return maze.vWalls[cy][cx];
    return maze.vWalls[cy][cx + 1];
  }

  // Başlangıçtan itibaren adım mesafeleri (duvarlardan geçmeden).
  function distances(maze, start) {
    const dist = new Array(maze.width * maze.height).fill(-1);
    const queue = [start];
    dist[start.y * maze.width + start.x] = 0;
    for (let head = 0; head < queue.length; head++) {
      const { x, y } = queue[head];
      const d = dist[y * maze.width + x];
      const steps = [
        { nx: x, ny: y - 1, side: "N" },
        { nx: x, ny: y + 1, side: "S" },
        { nx: x - 1, ny: y, side: "W" },
        { nx: x + 1, ny: y, side: "E" },
      ];
      for (const s of steps) {
        if (s.nx < 0 || s.ny < 0 || s.nx >= maze.width || s.ny >= maze.height) continue;
        if (hasWall(maze, x, y, s.side)) continue;
        const idx = s.ny * maze.width + s.nx;
        if (dist[idx] !== -1) continue;
        dist[idx] = d + 1;
        queue.push({ x: s.nx, y: s.ny });
      }
    }
    return dist;
  }

  // Dev aynası: başlangıçtan yeterince uzak bir karenin duvarlarından biri.
  function pickGiant(maze, start, seed) {
    const rand = rng(seed + 7919);
    const dist = distances(maze, start);
    const far = [];
    let max = 0;
    for (const d of dist) if (d > max) max = d;
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (dist[y * maze.width + x] >= max * 0.55) far.push({ x, y });
      }
    }
    for (let tries = 0; tries < 500; tries++) {
      const cell = far[Math.floor(rand() * far.length)];
      const sides = ["N", "S", "W", "E"].filter((s) => hasWall(maze, cell.x, cell.y, s));
      if (!sides.length) continue;
      const side = sides[Math.floor(rand() * sides.length)];
      if (side === "N") return { id: `h${cell.x},${cell.y}`, x: cell.x, y: cell.y, horizontal: true };
      if (side === "S") return { id: `h${cell.x},${cell.y + 1}`, x: cell.x, y: cell.y + 1, horizontal: true };
      if (side === "W") return { id: `v${cell.x},${cell.y}`, x: cell.x, y: cell.y, horizontal: false };
      return { id: `v${cell.x + 1},${cell.y}`, x: cell.x + 1, y: cell.y, horizontal: false };
    }
    return mirrors(maze)[0];
  }

  return { generate, mirrors, hasWall, distances, pickGiant };
});
