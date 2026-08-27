// Dev Aynası - oyun döngüsü, çizim ve girdi
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
  const LIGHT = 230;       // görüş yarıçapı
  const LOOK = 132;        // aynada yansımanın belirdiği mesafe
  const SEEN_RANGE = 118;  // "incelendi" sayılan mesafe
  const GIANT_SCALE = 3.6;
  const BEST_KEY = "dev-aynasi:en-iyi";

  let maze, mirrorList, giant, giantSeg;
  let player, keys, seen, hintsLeft, hintUntil, startedAt, finishedAt, foundAt;
  let lastFrame = 0;
  let joystick = null;

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
    startedAt = performance.now();
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
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function viewSize() {
    const ratio = window.devicePixelRatio || 1;
    return { w: canvas.width / ratio, h: canvas.height / ratio };
  }

  function drawFigure(x, y, scale, alpha, color) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - RADIUS * scale * 0.9, RADIUS * scale * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + RADIUS * scale * 0.35, RADIUS * scale * 0.7, RADIUS * scale * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Aynadaki görüntü: oyuncunun ayna düzlemine göre simetriği, panelin
  // arkasına kırpılarak çizilir. Dev aynasında aynı görüntü büyütülür.
  function drawReflection(seg, isGiant) {
    const g = segGeometry(seg);
    const depth = CELL * (isGiant ? 1.6 : 0.92);
    let rx;
    let ry;
    ctx.save();
    ctx.beginPath();
    if (seg.horizontal) {
      const side = player.y < g.ay ? 1 : -1;
      rx = player.x;
      ry = 2 * g.ay - player.y;
      ctx.rect(g.ax, side > 0 ? g.ay : g.ay - depth, CELL, depth);
    } else {
      const side = player.x < g.ax ? 1 : -1;
      rx = 2 * g.ax - player.x;
      ry = player.y;
      ctx.rect(side > 0 ? g.ax : g.ax - depth, g.ay, depth, CELL);
    }
    ctx.clip();
    const dist = Math.hypot(rx - player.x, ry - player.y) / 2;
    const alpha = Math.max(0, 0.75 - dist / LOOK * 0.45);
    drawFigure(rx, ry, isGiant ? GIANT_SCALE : 1, alpha, isGiant ? "#ffd76e" : "#9fd8e8");
    ctx.restore();
  }

  function draw(now) {
    const view = viewSize();
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    ctx.fillStyle = "#07090f";
    ctx.fillRect(0, 0, view.w, view.h);

    const camX = player.x - view.w / 2;
    const camY = player.y - view.h / 2;
    ctx.save();
    ctx.translate(-camX, -camY);

    // zemin
    const x0 = Math.max(0, Math.floor(camX / CELL));
    const y0 = Math.max(0, Math.floor(camY / CELL));
    const x1 = Math.min(SIZE - 1, Math.ceil((camX + view.w) / CELL));
    const y1 = Math.min(SIZE - 1, Math.ceil((camY + view.h) / CELL));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#0c111b" : "#0a0e17";
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    // yansımalar (aynaların arkasında yaşar, bu yüzden duvarlardan önce)
    let giantVisible = false;
    for (const seg of mirrorList) {
      const c = segCenter(seg);
      const d = Math.hypot(c.x - player.x, c.y - player.y);
      if (d > LOOK) continue;
      const isGiant = seg.id === giant.id;
      drawReflection(seg, isGiant);
      if (d < SEEN_RANGE) seen.add(seg.id);
      if (isGiant && d < LOOK * 0.8) giantVisible = true;
    }

    // ayna panelleri
    ctx.lineCap = "round";
    for (const seg of mirrorList) {
      const g = segGeometry(seg);
      if (Math.max(g.ax, g.bx) < camX - CELL || Math.min(g.ax, g.bx) > camX + view.w + CELL) continue;
      if (Math.max(g.ay, g.by) < camY - CELL || Math.min(g.ay, g.by) > camY + view.h + CELL) continue;
      const c = segCenter(seg);
      const d = Math.hypot(c.x - player.x, c.y - player.y);
      const glow = Math.max(0, 1 - d / (LIGHT * 1.1));
      ctx.strokeStyle = `rgba(150, 205, 225, ${0.12 + glow * 0.65})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(g.ax, g.ay);
      ctx.lineTo(g.bx, g.by);
      ctx.stroke();
      if (glow > 0.25) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${(glow - 0.25) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(g.ax, g.ay);
        ctx.lineTo(g.bx, g.by);
        ctx.stroke();
      }
    }

    drawFigure(player.x, player.y, 1, 1, "#f4f1ff");

    // sezgi oku
    if (now < hintUntil) {
      const ang = Math.atan2(giantSeg.y - player.y, giantSeg.x - player.x);
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(ang);
      ctx.fillStyle = "rgba(255, 215, 110, 0.85)";
      ctx.beginPath();
      ctx.moveTo(46, 0);
      ctx.lineTo(30, -9);
      ctx.lineTo(30, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // karanlık: sadece yakını görebilirsin
    const grad = ctx.createRadialGradient(view.w / 2, view.h / 2, LIGHT * 0.25, view.w / 2, view.h / 2, LIGHT);
    grad.addColorStop(0, "rgba(7, 9, 15, 0)");
    grad.addColorStop(0.72, "rgba(7, 9, 15, 0.55)");
    grad.addColorStop(1, "rgba(7, 9, 15, 1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, view.w, view.h);

    return giantVisible;
  }

  function updateHud() {
    const elapsed = ((finishedAt || performance.now()) - startedAt) / 1000;
    els.time.textContent = formatTime(elapsed);
    els.seen.textContent = seen.size.toLocaleString("tr-TR");
    els.hints.textContent = hintsLeft;
    els.hintBtn.disabled = hintsLeft === 0 || !!finishedAt;
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
    if (!finishedAt) move(dt);
    const giantVisible = draw(now);
    if (!finishedAt) {
      // Dev aynasını görünce hemen bitmesin; bir an bakmaya fırsat kalsın.
      if (giantVisible) {
        if (!foundAt) foundAt = now;
        else if (now - foundAt > 1100) win(now);
      } else {
        foundAt = 0;
      }
      updateHud();
    }
    requestAnimationFrame(loop);
  }

  // --- girdi ---
  const track = (e, down) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"].includes(k)) {
      e.preventDefault();
      if (down) keys.add(k);
      else keys.delete(k);
    }
    if (down && k === "h") useHint();
    if (down && k === "r") newRoom(Date.now() & 0xffff);
  };
  window.addEventListener("keydown", (e) => track(e, true));
  window.addEventListener("keyup", (e) => track(e, false));
  window.addEventListener("blur", () => keys.clear());

  function useHint() {
    if (hintsLeft === 0 || finishedAt) return;
    hintsLeft--;
    hintUntil = performance.now() + 2500;
    updateHud();
  }
  els.hintBtn.addEventListener("click", useHint);
  els.restart.addEventListener("click", () => newRoom(Date.now() & 0xffff));
  els.again.addEventListener("click", () => newRoom(Date.now() & 0xffff));

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

  // testler için: oyuncuyu dev aynasının önüne ışınla
  window.__devAynasi = {
    teleportToGiant() {
      const g = segGeometry(giant);
      // Aynanın oda içinde kalan tarafına yerleş.
      const inside = (v, max) => (v >= max ? -CELL * 0.4 : CELL * 0.4);
      player.x = giant.horizontal ? g.ax + CELL / 2 : g.ax + inside(giant.x, SIZE);
      player.y = giant.horizontal ? g.ay + inside(giant.y, SIZE) : g.ay + CELL / 2;
    },
    state: () => ({ mirrors: mirrorList.length, seen: seen.size, finished: !!finishedAt }),
  };
})();
