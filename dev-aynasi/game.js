// Dev Aynası - oyun döngüsü, sahne çizimi ve girdi
(function () {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const els = {
    time: document.getElementById("time"),
    seen: document.getElementById("seen"),
    total: document.getElementById("total"),
    hints: document.getElementById("hints"),
    hintBtn: document.getElementById("hintBtn"),
    restart: document.getElementById("restart"),
    intro: document.getElementById("intro"),
    enter: document.getElementById("enter"),
    overlay: document.getElementById("overlay"),
    overlayTime: document.getElementById("overlayTime"),
    overlaySeen: document.getElementById("overlaySeen"),
    again: document.getElementById("again"),
    best: document.getElementById("best"),
  };

  const CELL = 72;         // bir karenin dünya birimi
  const SIZE = 48;         // oda 48x48 kare
  const RADIUS = 11;       // oyuncu yarıçapı
  const SPEED = 205;       // birim/saniye
  const LIGHT = 235;       // fenerin görüş yarıçapı
  const LOOK = 132;        // aynada yansımanın belirdiği mesafe
  const SEEN_RANGE = 118;  // "bakıldı" sayılan mesafe
  const GIANT_SCALE = 3.6;
  const BEST_KEY = "dev-aynasi:en-iyi";

  const C = {
    ground: "#0a0710",
    floorA: "#120c1a",
    floorB: "#0e0916",
    glass: "168, 203, 216",
    brass: "216, 178, 106",
    ivory: "#f2eae0",
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Retina ekranlarda tam piksel oranında çizmek dolgu maliyetini dörde
  // katlıyor; 1.5 kat keskinlik gözle aynı, kare hızı rahat.
  const scale = () => Math.min(window.devicePixelRatio || 1, 1.5);

  let maze, mirrorList, giant, giantSeg;
  let player, keys, seen, hintsLeft, hintUntil, startedAt, finishedAt, foundAt;
  let dust = [];
  let running = false;
  let bloom = 0;
  let lastFrame = 0;
  let joystick = null;
  let grain = null;

  function segGeometry(seg) {
    if (seg.horizontal) {
      return { ax: seg.x * CELL, ay: seg.y * CELL, bx: (seg.x + 1) * CELL, by: seg.y * CELL };
    }
    return { ax: seg.x * CELL, ay: seg.y * CELL, bx: seg.x * CELL, by: (seg.y + 1) * CELL };
  }

  function segCenter(seg) {
    const g = segGeometry(seg);
    return { x: (g.ax + g.bx) / 2, y: (g.ay + g.by) / 2 };
  }

  function newRoom(seed) {
    maze = Maze.generate(SIZE, SIZE, seed);
    mirrorList = Maze.mirrors(maze);
    giant = Maze.pickGiant(maze, { x: 0, y: 0 }, seed);
    giantSeg = segCenter(giant);
    player = { x: CELL * 0.5, y: CELL * 0.5, dx: 0, dy: 1 };
    keys = new Set();
    seen = new Set();
    hintsLeft = 3;
    hintUntil = 0;
    foundAt = 0;
    finishedAt = 0;
    bloom = 0;
    startedAt = performance.now();
    dust = Array.from({ length: 70 }, () => ({
      x: Math.random() * CELL * 8 - CELL * 4,
      y: Math.random() * CELL * 8 - CELL * 4,
      r: 0.6 + Math.random() * 1.4,
      a: 0.05 + Math.random() * 0.16,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
    }));
    els.total.textContent = mirrorList.length.toLocaleString("tr-TR");
    els.overlay.hidden = true;
    updateHud();
  }

  // --- hareket ---
  function move(dt) {
    let vx = 0;
    let vy = 0;
    if (keys.has("ArrowLeft") || keys.has("a")) vx -= 1;
    if (keys.has("ArrowRight") || keys.has("d")) vx += 1;
    if (keys.has("ArrowUp") || keys.has("w")) vy -= 1;
    if (keys.has("ArrowDown") || keys.has("s")) vy += 1;
    if (joystick) {
      vx += joystick.x;
      vy += joystick.y;
    }
    const len = Math.hypot(vx, vy);
    if (!len) return;
    vx /= len;
    vy /= len;
    player.dx = vx;
    player.dy = vy;
    player.x = slide(player.x + vx * SPEED * dt, player.y, "x");
    player.y = slide(player.x, player.y + vy * SPEED * dt, "y");
  }

  // Duvarlara çarpınca eksen bazında geri it.
  function slide(nx, ny, axis) {
    const cx = Math.max(0, Math.min(SIZE - 1, Math.floor(nx / CELL)));
    const cy = Math.max(0, Math.min(SIZE - 1, Math.floor(ny / CELL)));
    let x = nx;
    let y = ny;
    if (Maze.hasWall(maze, cx, cy, "W") && x - RADIUS < cx * CELL) x = cx * CELL + RADIUS;
    if (Maze.hasWall(maze, cx, cy, "E") && x + RADIUS > (cx + 1) * CELL) x = (cx + 1) * CELL - RADIUS;
    if (Maze.hasWall(maze, cx, cy, "N") && y - RADIUS < cy * CELL) y = cy * CELL + RADIUS;
    if (Maze.hasWall(maze, cx, cy, "S") && y + RADIUS > (cy + 1) * CELL) y = (cy + 1) * CELL - RADIUS;
    return axis === "x" ? x : y;
  }

  // --- çizim ---
  function resize() {
    const ratio = scale();
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function viewSize() {
    const ratio = scale();
    return { w: canvas.width / ratio, h: canvas.height / ratio };
  }

  // İnce film greni: bir kez üretilip her karede kaydırılarak kullanılır.
  function grainTile() {
    if (grain) return grain;
    const size = 256;
    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const tctx = tile.getContext("2d");
    const img = tctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 150 + Math.random() * 105;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 46;
    }
    tctx.putImageData(img, 0, 0);
    grain = tile;
    return tile;
  }

  // Oyuncunun çevresindeki pencerede kalan ayna parçalarını, ara nesne
  // üretmeden gezer. Salonda binlerce ayna var; her karede hepsini taramak
  // kare hızını düşürüyordu.
  function forEachNearSegment(range, cb) {
    const pcx = Math.floor(player.x / CELL);
    const pcy = Math.floor(player.y / CELL);
    const span = Math.ceil(range / CELL) + 1;
    const x0 = Math.max(0, pcx - span);
    const y0 = Math.max(0, pcy - span);
    const x1 = Math.min(SIZE, pcx + span);
    const y1 = Math.min(SIZE, pcy + span);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (x < SIZE && maze.hWalls[y][x]) {
          const cxw = x * CELL + CELL / 2;
          const cyw = y * CELL;
          const d = Math.hypot(cxw - player.x, cyw - player.y);
          if (d <= range) cb(true, x, y, d);
        }
        if (y < SIZE && maze.vWalls[y][x]) {
          const cxw = x * CELL;
          const cyw = y * CELL + CELL / 2;
          const d = Math.hypot(cxw - player.x, cyw - player.y);
          if (d <= range) cb(false, x, y, d);
        }
      }
    }
  }

  function drawFigure(x, y, scale, alpha, color, glow) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 26 * scale;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + RADIUS * scale * 0.4, RADIUS * scale * 0.66, RADIUS * scale * 1.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - RADIUS * scale * 0.95, RADIUS * scale * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Aynadaki görüntü: oyuncunun ayna düzlemine göre simetriği, panelin
  // arkasındaki dar banda kırpılarak çizilir. Cam, üstüne bir tül gibi
  // koyu bir degrade bırakır; dev yansıma bu banda sığmaz, taşar.
  function drawReflection(seg, isGiant) {
    const g = segGeometry(seg);
    const depth = CELL * (isGiant ? 1.7 : 0.94);
    let rx;
    let ry;
    let band;
    if (seg.horizontal) {
      const side = player.y < g.ay ? 1 : -1;
      rx = player.x;
      ry = 2 * g.ay - player.y;
      band = { x: g.ax, y: side > 0 ? g.ay : g.ay - depth, w: CELL, h: depth, vertical: true, side };
    } else {
      const side = player.x < g.ax ? 1 : -1;
      rx = 2 * g.ax - player.x;
      ry = player.y;
      band = { x: side > 0 ? g.ax : g.ax - depth, y: g.ay, w: depth, h: CELL, vertical: false, side };
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(band.x, band.y, band.w, band.h);
    ctx.clip();

    // cam derinliği: aynanın içi dışarıdan daha karanlıktır
    const back = ctx.createLinearGradient(
      band.vertical ? band.x : band.side > 0 ? band.x : band.x + band.w,
      band.vertical ? (band.side > 0 ? band.y : band.y + band.h) : band.y,
      band.vertical ? band.x : band.side > 0 ? band.x + band.w : band.x,
      band.vertical ? (band.side > 0 ? band.y + band.h : band.y) : band.y
    );
    back.addColorStop(0, "rgba(20, 26, 34, 0.55)");
    back.addColorStop(1, "rgba(6, 8, 12, 0.95)");
    ctx.fillStyle = back;
    ctx.fillRect(band.x, band.y, band.w, band.h);

    const dist = Math.hypot(rx - player.x, ry - player.y) / 2;
    const alpha = Math.max(0, 0.8 - (dist / LOOK) * 0.45);
    if (isGiant) {
      drawFigure(rx, ry, GIANT_SCALE, Math.min(1, alpha + 0.25), "#ffd98a", "rgba(216, 178, 106, 0.9)");
    } else {
      drawFigure(rx, ry, 1, alpha, `rgba(${C.glass}, 0.9)`, null);
    }
    ctx.restore();
  }

  function drawPanel(seg, dist) {
    const g = segGeometry(seg);
    const glow = Math.max(0, 1 - dist / (LIGHT * 1.15));
    ctx.strokeStyle = `rgba(${C.glass}, ${(0.1 + glow * 0.6).toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(g.ax, g.ay);
    ctx.lineTo(g.bx, g.by);
    ctx.stroke();

    if (glow > 0.2) {
      // camın parlaması ve pirinç çerçeve uçları
      ctx.strokeStyle = `rgba(255, 255, 255, ${(glow - 0.2) * 0.55})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(g.ax, g.ay);
      ctx.lineTo(g.bx, g.by);
      ctx.stroke();
      ctx.fillStyle = `rgba(${C.brass}, ${(glow - 0.2) * 0.8})`;
      for (const [px, py] of [[g.ax, g.ay], [g.bx, g.by]]) {
        ctx.beginPath();
        ctx.arc(px, py, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function draw(now, dt) {
    const ratio = scale();
    const view = viewSize();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = C.ground;
    ctx.fillRect(0, 0, view.w, view.h);

    const zoom = 1 + bloom * 0.14;
    ctx.save();
    ctx.translate(view.w / 2, view.h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-player.x, -player.y);

    const half = { w: view.w / (2 * zoom), h: view.h / (2 * zoom) };
    const camX = player.x - half.w;
    const camY = player.y - half.h;

    // zemin
    const x0 = Math.max(0, Math.floor(camX / CELL));
    const y0 = Math.max(0, Math.floor(camY / CELL));
    const x1 = Math.min(SIZE - 1, Math.ceil((camX + half.w * 2) / CELL));
    const y1 = Math.min(SIZE - 1, Math.ceil((camY + half.h * 2) / CELL));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        ctx.fillStyle = (x + y) % 2 ? C.floorA : C.floorB;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    // fenerin zeminde bıraktığı sıcak halka
    const lamp = ctx.createRadialGradient(player.x, player.y, 6, player.x, player.y, LIGHT * 0.9);
    lamp.addColorStop(0, "rgba(255, 231, 194, 0.16)");
    lamp.addColorStop(0.55, "rgba(216, 178, 106, 0.05)");
    lamp.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(camX, camY, half.w * 2, half.h * 2);

    // yansımalar aynaların arkasında yaşar, panellerden önce çizilir
    let giantVisible = false;
    forEachNearSegment(LOOK, (horizontal, x, y, d) => {
      const seg = { horizontal, x, y, id: `${horizontal ? "h" : "v"}${x},${y}` };
      const isGiant = seg.id === giant.id;
      drawReflection(seg, isGiant);
      if (d < SEEN_RANGE) seen.add(seg.id);
      if (isGiant && d < LOOK * 0.8) giantVisible = true;
    });

    // ayna panelleri
    ctx.lineCap = "round";
    forEachNearSegment(LIGHT * 1.25, (horizontal, x, y, d) => {
      drawPanel({ horizontal, x, y }, d);
    });

    // toz zerreleri
    if (!reducedMotion) {
      for (const p of dust) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const dx = p.x - (player.x - camX);
        const dy = p.y - (player.y - camY);
        if (Math.abs(dx) > half.w || Math.abs(dy) > half.h) {
          p.x = player.x - camX + (Math.random() - 0.5) * half.w * 1.6;
          p.y = player.y - camY + (Math.random() - 0.5) * half.h * 1.6;
        }
        ctx.fillStyle = `rgba(255, 240, 214, ${p.a})`;
        ctx.beginPath();
        ctx.arc(camX + p.x, camY + p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawFigure(player.x, player.y, 1, 1, C.ivory, "rgba(255, 236, 205, 0.55)");

    // sezgi oku
    if (now < hintUntil) {
      const ang = Math.atan2(giantSeg.y - player.y, giantSeg.x - player.x);
      const pulse = 0.55 + 0.45 * Math.sin(now / 120);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(ang);
      ctx.fillStyle = `rgba(${C.brass}, ${pulse})`;
      ctx.shadowColor = `rgba(${C.brass}, 0.8)`;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.lineTo(32, -9);
      ctx.lineTo(32, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // karanlık salon: yalnızca fenerin ulaştığı yeri görürsün
    const dark = ctx.createRadialGradient(
      view.w / 2, view.h / 2, LIGHT * 0.24 * zoom,
      view.w / 2, view.h / 2, LIGHT * zoom
    );
    dark.addColorStop(0, "rgba(10, 7, 16, 0)");
    dark.addColorStop(0.7, "rgba(10, 7, 16, 0.6)");
    dark.addColorStop(1, "rgba(10, 7, 16, 1)");
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, view.w, view.h);

    // dev aynasını görünce altın ışık salonu doldurur
    if (bloom > 0) {
      const gold = ctx.createRadialGradient(
        view.w / 2, view.h / 2, 0,
        view.w / 2, view.h / 2, Math.max(view.w, view.h) * 0.75
      );
      gold.addColorStop(0, `rgba(255, 222, 160, ${0.42 * bloom})`);
      gold.addColorStop(0.45, `rgba(216, 178, 106, ${0.22 * bloom})`);
      gold.addColorStop(1, "rgba(216, 178, 106, 0)");
      ctx.fillStyle = gold;
      ctx.fillRect(0, 0, view.w, view.h);
    }

    // gren (iki karede bir; gözle fark edilmez, dolgu maliyetini yarılar)
    ctx.save();
    ctx.globalAlpha = 0.045;
    const tile = grainTile();
    const ox = -Math.floor(Math.random() * 128);
    const oy = -Math.floor(Math.random() * 128);
    for (let gy = oy; gy < view.h; gy += 256) {
      for (let gx = ox; gx < view.w; gx += 256) ctx.drawImage(tile, gx, gy);
    }
    ctx.restore();

    return giantVisible;
  }

  function updateHud() {
    const elapsed = ((finishedAt || (running ? performance.now() : startedAt)) - startedAt) / 1000;
    els.time.textContent = formatTime(elapsed);
    els.seen.textContent = seen.size.toLocaleString("tr-TR");
    els.hints.textContent = hintsLeft;
    els.hintBtn.disabled = hintsLeft === 0 || !!finishedAt || !running;
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function win(now) {
    finishedAt = now;
    const elapsed = (finishedAt - startedAt) / 1000;
    els.overlayTime.textContent = formatTime(elapsed);
    els.overlaySeen.textContent = `${seen.size.toLocaleString("tr-TR")} / ${mirrorList.length.toLocaleString("tr-TR")}`;
    let best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (!best || elapsed < best) {
      best = elapsed;
      try {
        localStorage.setItem(BEST_KEY, String(elapsed));
      } catch (err) {
        /* depolama kapalıysa sessizce geç */
      }
    }
    els.best.textContent = formatTime(best);
    els.overlay.hidden = false;
    updateHud();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    if (running && !finishedAt) move(dt);
    // Perde indikten sonra sahne donar; boşuna kare çizilmez.
    const giantVisible = finishedAt ? false : draw(now, dt);
    if (running && !finishedAt) {
      if (giantVisible) {
        if (!foundAt) foundAt = now;
        // Buluş anı: altın ışık büyür, sahne hafifçe yaklaşır, sonra perde.
        bloom = Math.min(1, (now - foundAt) / 1400);
        if (now - foundAt > 1600) win(now);
      } else {
        foundAt = 0;
        bloom = Math.max(0, bloom - dt * 2);
      }
      updateHud();
    }
    requestAnimationFrame(loop);
  }

  // --- girdi ---
  const MOVE_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"];
  const track = (e, down) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (MOVE_KEYS.includes(k)) {
      e.preventDefault();
      if (down) keys.add(k);
      else keys.delete(k);
    }
    if (down && k === "h") useHint();
    if (down && k === "r") restart();
    if (down && (k === "Enter" || k === " ") && !running) start();
  };
  window.addEventListener("keydown", (e) => track(e, true));
  window.addEventListener("keyup", (e) => track(e, false));
  window.addEventListener("blur", () => keys.clear());

  function start() {
    els.intro.hidden = true;
    running = true;
    startedAt = performance.now();
    updateHud();
  }

  function restart() {
    newRoom(Date.now() & 0xffff);
    running = true;
    els.intro.hidden = true;
    startedAt = performance.now();
    updateHud();
  }

  function useHint() {
    if (hintsLeft === 0 || finishedAt || !running) return;
    hintsLeft--;
    hintUntil = performance.now() + 2500;
    updateHud();
  }
  els.hintBtn.addEventListener("click", useHint);
  els.restart.addEventListener("click", restart);
  els.again.addEventListener("click", restart);
  els.enter.addEventListener("click", start);

  // dokunmatik: parmağı sürükledikçe o yöne yürü
  let touchOrigin = null;
  canvas.addEventListener("touchstart", (e) => {
    touchOrigin = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    if (!touchOrigin) return;
    const dx = e.touches[0].clientX - touchOrigin.x;
    const dy = e.touches[0].clientY - touchOrigin.y;
    const len = Math.hypot(dx, dy);
    joystick = len < 12 ? null : { x: dx / len, y: dy / len };
    e.preventDefault();
  }, { passive: false });
  const endTouch = () => { touchOrigin = null; joystick = null; };
  canvas.addEventListener("touchend", endTouch);
  canvas.addEventListener("touchcancel", endTouch);

  window.addEventListener("resize", resize);
  resize();
  newRoom(Date.now() & 0xffff);
  requestAnimationFrame((t) => {
    lastFrame = t;
    loop(t);
  });

  // testler için
  window.__devAynasi = {
    start,
    teleportToGiant() {
      const g = segGeometry(giant);
      // Aynanın oda içinde kalan tarafına yerleş.
      const inside = (v, max) => (v >= max ? -CELL * 0.4 : CELL * 0.4);
      player.x = giant.horizontal ? g.ax + CELL / 2 : g.ax + inside(giant.x, SIZE);
      player.y = giant.horizontal ? g.ay + inside(giant.y, SIZE) : g.ay + CELL / 2;
    },
    state: () => ({ mirrors: mirrorList.length, seen: seen.size, finished: !!finishedAt, running }),
  };
})();
