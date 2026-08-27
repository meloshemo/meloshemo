// Dev Aynası - bölümler, düello, sahne çizimi ve girdi
(function () {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const els = {
    time: $("time"), seen: $("seen"), total: $("total"), hints: $("hints"),
    chapter: $("chapter"), objective: $("objective"),
    hintBtn: $("hintBtn"), restart: $("restart"), soundBtn: $("soundBtn"),
    intro: $("intro"), enterSolo: $("enterSolo"), enterDuel: $("enterDuel"),
    codeInput: $("codeInput"), codeApply: $("codeApply"), codeLabel: $("codeLabel"),
    overlay: $("overlay"), overlayTitle: $("overlayTitle"), overlayText: $("overlayText"),
    ledger: $("ledger"), overlayTime: $("overlayTime"), overlaySeen: $("overlaySeen"),
    best: $("best"), next: $("next"), againBtn: $("againBtn"),
    duelBadge: $("duelBadge"), p1Time: $("p1Time"), p2Time: $("p2Time"),
    chapterCard: $("chapterCard"), cardTitle: $("cardTitle"), cardText: $("cardText"),
  };

  const CELL = 72;
  const RADIUS = 11;
  const SPEED = 230;        // yürüme hızı (birim/saniye) ~3.2 kare/sn
  const SPRINT = 330;       // Shift ile koşu ~4.6 kare/sn
  const ACCEL = 2400;       // hızlanma - tuşa basınca 0.1 sn'de tam hıza
  const FRICTION = 3200;    // tuşu bırakınca duruş
  const CORNER_ASSIST = 16; // köşeye takılmayı önleyen kayma payı
  const LOOK = 132;
  const SEEN_RANGE = 118;
  const GIANT_SCALE = 3.6;
  const GIANT_REVEAL = 58;   // dev yansıma ancak bu kadar yakında belirir (~0,8 kare)
  const ENTER_REACH = RADIUS + 12;  // aynaya değip içine girme mesafesi
  const WARM_CELLS = 5;      // dev aynasının çevresindeki "sıcak" camlar
  const BEST_KEY = "dev-aynasi:en-iyi";

  // Her bölüm salonu biraz daha zorlaştırır: ışık daralır, sahte devler artar.
  // Her bölüm dev aynanın içinden geçilerek girilen ayrı bir dünyadır;
  // ışığı da rengi de değişir.
  const CHAPTERS = [
    {
      name: "I · Aynalı Salon", size: 40, light: 235, hints: 3, decoys: 0, returnTrip: false,
      objective: "Dev aynayı bul ve içine yürü",
      card: "Binlerce cam, hepsi birbirinin aynı.",
      palette: { ground: "#0a0710", floorA: "#120c1a", floorB: "#0e0916", glass: "168, 203, 216", lamp: "255, 231, 194" },
    },
    {
      name: "II · Aynanın İçinde", size: 46, light: 200, hints: 2, decoys: 14, returnTrip: false,
      objective: "Çarpık aynalar arasından gerçeğini bul ve içine yürü",
      card: "Camlar soğuk, ışık cılız. Bazıları seni çarpıtıyor.",
      palette: { ground: "#05090f", floorA: "#0b141d", floorB: "#081018", glass: "150, 214, 232", lamp: "196, 232, 255" },
    },
    {
      name: "III · Kibir Odası", size: 52, light: 175, hints: 2, decoys: 22, returnTrip: true,
      objective: "Dev aynayı bul, sonra pirinç kapıya dön",
      card: "Her cam seni büyütmeye hazır. Aynayı bul, sonra kapıya dön.",
      palette: { ground: "#100608", floorA: "#1b0e10", floorB: "#150a0c", glass: "236, 186, 150", lamp: "255, 208, 150" },
    },
  ];

  const BRASS = "216, 178, 106";
  const IVORY = "#f2eae0";
  let C = { ...CHAPTERS[0].palette, brass: BRASS, ivory: IVORY };
  const DISTORTIONS = [
    { sx: 1.45, sy: 1.45 },   // biraz büyük
    { sx: 1.9, sy: 0.85 },    // yayvan
    { sx: 0.72, sy: 1.5 },    // uzun ve ince
    { sx: 0.6, sy: 0.6 },     // küçük
    { sx: 2.2, sy: 1.1 },     // geniş
  ];

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scale = () => Math.min(window.devicePixelRatio || 1, 1.5);

  let chapterIndex = 0;
  let carding = 0;          // bölüm kartının ekranda kalacağı ana kadar
  let holdAtMirror = false; // yalnızca ekran görüntüsü almak için: geçişi bekletir
  let chapter, size, maze, mirrorCount, giant, giantSeg, decoys, warm;
  let players = [];
  let duel = false;
  let seed = 0;
  let running = false;
  let finished = null;      // { winner, elapsed }
  let phase = "arayis";     // arayis | donus
  let startedAt = 0;
  let lastFrame = 0;
  let joystick = null;

  const keys = new Set();
  const idOf = (horizontal, x, y) => `${horizontal ? "h" : "v"}${x},${y}`;

  function segGeometry(seg) {
    if (seg.horizontal) return { ax: seg.x * CELL, ay: seg.y * CELL, bx: (seg.x + 1) * CELL, by: seg.y * CELL };
    return { ax: seg.x * CELL, ay: seg.y * CELL, bx: seg.x * CELL, by: (seg.y + 1) * CELL };
  }
  function segCenter(seg) {
    const g = segGeometry(seg);
    return { x: (g.ax + g.bx) / 2, y: (g.ay + g.by) / 2 };
  }

  function makePlayer(label, keymap, tint) {
    return {
      label, keymap, tint,
      x: CELL * 0.5, y: CELL * 0.5,
      vx: 0, vy: 0,
      hints: chapter.hints, hintUntil: 0,
      seen: new Set(), foundAt: 0, bloom: 0, done: 0, reachedDoor: false,
    };
  }

  function newRoom(nextSeed) {
    chapter = CHAPTERS[chapterIndex];
    C = { ...chapter.palette };
    size = chapter.size;
    seed = nextSeed;
    maze = Maze.generate(size, size, seed);
    mirrorCount = Maze.mirrors(maze).length;
    giant = Maze.pickGiant(maze, { x: 0, y: 0 }, seed);
    giantSeg = segCenter(giant);

    // Sahte devler: gerçek dev aynadan uzakta, çarpık yansıma gösteren camlar.
    decoys = new Map();
    if (chapter.decoys) {
      const all = Maze.mirrors(maze);
      let s = (seed * 2654435761) >>> 0;
      const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      let guard = 0;
      while (decoys.size < chapter.decoys && guard++ < 4000) {
        const seg = all[Math.floor(rand() * all.length)];
        if (seg.id === giant.id) continue;
        const c = segCenter(seg);
        if (Math.hypot(c.x - giantSeg.x, c.y - giantSeg.y) < CELL * 4) continue;
        decoys.set(seg.id, DISTORTIONS[Math.floor(rand() * DISTORTIONS.length)]);
      }
    }

    // Sıcak iz: dev aynanın çevresindeki camların çerçevesi hafif altın vurur.
    warm = new Set();
    const gx = giant.x;
    const gy = giant.y;
    for (let y = gy - WARM_CELLS; y <= gy + WARM_CELLS; y++) {
      for (let x = gx - WARM_CELLS; x <= gx + WARM_CELLS; x++) {
        if (x < 0 || y < 0 || x > size || y > size) continue;
        if (Math.hypot(x - gx, y - gy) > WARM_CELLS) continue;
        if (x < size && maze.hWalls[y][x]) warm.add(idOf(true, x, y));
        if (y < size && maze.vWalls[y][x]) warm.add(idOf(false, x, y));
      }
    }

    players = duel
      ? [
          makePlayer("1", { up: "w", down: "s", left: "a", right: "d", hint: "q" }, "#f2eae0"),
          makePlayer("2", { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", hint: "m" }, "#a8cbd8"),
        ]
      : [makePlayer("1", { up: "w", down: "s", left: "a", right: "d", hint: "h" }, "#f2eae0")];
    players[0].y = duel ? CELL * 0.34 : CELL * 0.5;
    if (duel) players[1].y = CELL * 0.68;

    phase = "arayis";
    finished = null;
    startedAt = performance.now();
    keys.clear();
    els.total.textContent = mirrorCount.toLocaleString("tr-TR");
    els.chapter.textContent = chapter.name;
    els.objective.textContent = chapter.objective;
    els.codeLabel.textContent = String(seed).padStart(5, "0");
    els.duelBadge.hidden = !duel;
    els.overlay.hidden = true;
    updateHud();
  }

  // --- hareket ---
  // Klavyede tuşa basınca aniden tam hıza fırlamak yerine kısa bir ivmelenme
  // var; bırakınca da hemen durmuyor. Çapraz yön normalize edilir, yani
  // çapraz gitmek daha hızlı değildir.
  function moveAll(dt) {
    const kosu = keys.has("Shift");
    for (const p of players) {
      if (p.done) continue;
      const k = p.keymap;
      let ix = 0;
      let iy = 0;
      if (keys.has(k.left) || (!duel && keys.has("ArrowLeft"))) ix -= 1;
      if (keys.has(k.right) || (!duel && keys.has("ArrowRight"))) ix += 1;
      if (keys.has(k.up) || (!duel && keys.has("ArrowUp"))) iy -= 1;
      if (keys.has(k.down) || (!duel && keys.has("ArrowDown"))) iy += 1;
      if (!duel && joystick) { ix += joystick.x; iy += joystick.y; }

      const len = Math.hypot(ix, iy);
      const hedefHiz = kosu ? SPRINT : SPEED;
      if (len) {
        p.vx += (ix / len) * ACCEL * dt;
        p.vy += (iy / len) * ACCEL * dt;
        const hiz = Math.hypot(p.vx, p.vy);
        if (hiz > hedefHiz) {
          p.vx = (p.vx / hiz) * hedefHiz;
          p.vy = (p.vy / hiz) * hedefHiz;
        }
      } else {
        const hiz = Math.hypot(p.vx, p.vy);
        const yeni = Math.max(0, hiz - FRICTION * dt);
        if (hiz > 0) {
          p.vx = (p.vx / hiz) * yeni;
          p.vy = (p.vy / hiz) * yeni;
        }
      }
      if (!p.vx && !p.vy) continue;

      const oncekiX = p.x;
      const oncekiY = p.y;
      p.x = slide(p, p.x + p.vx * dt, p.y, "x");
      p.y = slide(p, p.x, p.y + p.vy * dt, "y");
      // Duvara sürtününce o eksendeki hızı sıfırla, yoksa kenarda birikir.
      if (Math.abs(p.x - oncekiX) < 0.01 && Math.abs(p.vx) > 1) p.vx = 0;
      if (Math.abs(p.y - oncekiY) < 0.01 && Math.abs(p.vy) > 1) p.vy = 0;
      cornerAssist(p, ix, iy);
    }
  }

  // Kapı ağzına birkaç piksel kala takılmak sinir bozucu: yönün önü açıksa
  // oyuncuyu boşluğun ortasına doğru hafifçe kaydır.
  function cornerAssist(p, ix, iy) {
    if (ix && !iy) {
      const merkez = (Math.floor(p.y / CELL) + 0.5) * CELL;
      const fark = merkez - p.y;
      if (Math.abs(fark) > 2 && Math.abs(fark) < CELL / 2) {
        const yon = Math.sign(fark);
        const hedefCx = Math.floor((p.x + Math.sign(ix) * (RADIUS + 2)) / CELL);
        const cy = Math.floor(p.y / CELL);
        if (hedefCx !== Math.floor(p.x / CELL) &&
            Maze.hasWall(maze, Math.max(0, Math.min(size - 1, hedefCx)), cy, ix > 0 ? "W" : "E")) {
          p.y += yon * Math.min(CORNER_ASSIST, Math.abs(fark));
        }
      }
    } else if (iy && !ix) {
      const merkez = (Math.floor(p.x / CELL) + 0.5) * CELL;
      const fark = merkez - p.x;
      if (Math.abs(fark) > 2 && Math.abs(fark) < CELL / 2) {
        const yon = Math.sign(fark);
        const cx = Math.floor(p.x / CELL);
        const hedefCy = Math.floor((p.y + Math.sign(iy) * (RADIUS + 2)) / CELL);
        if (hedefCy !== Math.floor(p.y / CELL) &&
            Maze.hasWall(maze, cx, Math.max(0, Math.min(size - 1, hedefCy)), iy > 0 ? "N" : "S")) {
          p.x += yon * Math.min(CORNER_ASSIST, Math.abs(fark));
        }
      }
    }
  }

  function slide(p, nx, ny, axis) {
    const cx = Math.max(0, Math.min(size - 1, Math.floor(nx / CELL)));
    const cy = Math.max(0, Math.min(size - 1, Math.floor(ny / CELL)));
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

  // Oyuncunun çevresindeki aynaları ara nesne üretmeden gezer.
  function forEachNearSegment(p, range, cb) {
    const span = Math.ceil(range / CELL) + 1;
    const pcx = Math.floor(p.x / CELL);
    const pcy = Math.floor(p.y / CELL);
    for (let y = Math.max(0, pcy - span); y <= Math.min(size, pcy + span); y++) {
      for (let x = Math.max(0, pcx - span); x <= Math.min(size, pcx + span); x++) {
        if (x < size && maze.hWalls[y][x]) {
          const d = Math.hypot(x * CELL + CELL / 2 - p.x, y * CELL - p.y);
          if (d <= range) cb(true, x, y, d);
        }
        if (y < size && maze.vWalls[y][x]) {
          const d = Math.hypot(x * CELL - p.x, y * CELL + CELL / 2 - p.y);
          if (d <= range) cb(false, x, y, d);
        }
      }
    }
  }

  function drawFigure(x, y, sx, sy, alpha, color, glow) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 22 * Math.max(sx, sy);
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y + RADIUS * sy * 0.4, RADIUS * sx * 0.66, RADIUS * sy * 1.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y - RADIUS * sy * 0.95, RADIUS * sx * 0.58, RADIUS * sy * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Aynadaki görüntü: oyuncunun ayna düzlemine göre simetriği, panelin
  // arkasındaki dar banda kırpılarak çizilir.
  function drawReflection(p, seg, kind, distortion) {
    const g = segGeometry(seg);
    const isGiant = kind === "giant";
    const depth = CELL * (isGiant ? 1.7 : 1.0);
    let rx;
    let ry;
    let band;
    if (seg.horizontal) {
      const side = p.y < g.ay ? 1 : -1;
      rx = p.x;
      ry = 2 * g.ay - p.y;
      band = { x: g.ax, y: side > 0 ? g.ay : g.ay - depth, w: CELL, h: depth };
    } else {
      const side = p.x < g.ax ? 1 : -1;
      rx = 2 * g.ax - p.x;
      ry = p.y;
      band = { x: side > 0 ? g.ax : g.ax - depth, y: g.ay, w: depth, h: CELL };
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(band.x, band.y, band.w, band.h);
    ctx.clip();
    ctx.fillStyle = "rgba(9, 12, 18, 0.82)";
    ctx.fillRect(band.x, band.y, band.w, band.h);

    const dist = Math.hypot(rx - p.x, ry - p.y) / 2;
    const alpha = Math.max(0, 0.85 - (dist / LOOK) * 0.4);
    if (isGiant) {
      drawFigure(rx, ry, GIANT_SCALE, GIANT_SCALE, 1, "#ffd98a", "rgba(216, 178, 106, 0.9)");
    } else if (distortion) {
      drawFigure(rx, ry, distortion.sx, distortion.sy, alpha, `rgba(${C.glass}, 0.92)`, null);
    } else {
      drawFigure(rx, ry, 1, 1, alpha, `rgba(${C.glass}, 0.92)`, null);
    }
    ctx.restore();
  }

  function drawPanel(seg, dist, light, isWarm) {
    const g = segGeometry(seg);
    const glow = Math.max(0, 1 - dist / (light * 1.15));
    ctx.strokeStyle = `rgba(${C.glass}, ${(0.1 + glow * 0.6).toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(g.ax, g.ay);
    ctx.lineTo(g.bx, g.by);
    ctx.stroke();
    if (glow > 0.2) {
      ctx.strokeStyle = isWarm
        ? `rgba(${BRASS}, ${(glow - 0.2) * 0.85})`
        : `rgba(255, 255, 255, ${(glow - 0.2) * 0.55})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(g.ax, g.ay);
      ctx.lineTo(g.bx, g.by);
      ctx.stroke();
      ctx.fillStyle = `rgba(${BRASS}, ${(glow - 0.2) * 0.8})`;
      for (const [px, py] of [[g.ax, g.ay], [g.bx, g.by]]) {
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawDoor() {
    const cx = CELL * 0.5;
    const cy = CELL * 0.5;
    ctx.save();
    ctx.strokeStyle = `rgba(${BRASS}, 0.9)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL * 0.3, Math.PI, 0);
    ctx.lineTo(cx + CELL * 0.3, cy + CELL * 0.3);
    ctx.lineTo(cx - CELL * 0.3, cy + CELL * 0.3);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = `rgba(${BRASS}, 0.14)`;
    ctx.fill();
    ctx.restore();
  }

  // Tek bir oyuncunun bakış açısını verilen dikdörtgene çizer.
  function drawView(p, rect, now) {
    const light = chapter.light * (phase === "donus" ? 0.78 : 1);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.fillStyle = C.ground;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const zoom = 1 + p.bloom * 0.14;
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-p.x, -p.y);

    const halfW = rect.w / (2 * zoom);
    const halfH = rect.h / (2 * zoom);
    const camX = p.x - halfW;
    const camY = p.y - halfH;

    const x0 = Math.max(0, Math.floor(camX / CELL));
    const y0 = Math.max(0, Math.floor(camY / CELL));
    const x1 = Math.min(size - 1, Math.ceil((camX + halfW * 2) / CELL));
    const y1 = Math.min(size - 1, Math.ceil((camY + halfH * 2) / CELL));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        ctx.fillStyle = (x + y) % 2 ? C.floorA : C.floorB;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }

    const lamp = ctx.createRadialGradient(p.x, p.y, 6, p.x, p.y, light * 0.9);
    lamp.addColorStop(0, `rgba(${C.lamp}, 0.15)`);
    lamp.addColorStop(0.55, "rgba(216, 178, 106, 0.05)");
    lamp.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lamp;
    ctx.fillRect(camX, camY, halfW * 2, halfH * 2);

    if (chapter.returnTrip) drawDoor();

    let giantVisible = false;
    forEachNearSegment(p, LOOK, (horizontal, x, y, d) => {
      const id = idOf(horizontal, x, y);
      const seg = { horizontal, x, y };
      // Dev ayna yalnızca dibinden geçerken parlar; uzaktan ışığı görünmez.
      const isGiant = id === giant.id && phase === "arayis" && d < GIANT_REVEAL;
      drawReflection(p, seg, isGiant ? "giant" : "normal", decoys.get(id));
      if (d < SEEN_RANGE) p.seen.add(id);
      if (isGiant) giantVisible = true;
    });

    ctx.lineCap = "round";
    forEachNearSegment(p, light * 1.25, (horizontal, x, y, d) => {
      drawPanel({ horizontal, x, y }, d, light, warm.has(idOf(horizontal, x, y)));
    });

    for (const other of players) {
      if (other === p) continue;
      const d = Math.hypot(other.x - p.x, other.y - p.y);
      if (d < light) drawFigure(other.x, other.y, 1, 1, 0.75, other.tint, null);
    }
    drawFigure(p.x, p.y, 1, 1, 1, p.tint, "rgba(255, 236, 205, 0.5)");

    if (now < p.hintUntil) {
      const target = phase === "donus" ? { x: CELL * 0.5, y: CELL * 0.5 } : giantSeg;
      const ang = Math.atan2(target.y - p.y, target.x - p.x);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = `rgba(${BRASS}, 0.9)`;
      ctx.beginPath();
      ctx.moveTo(50, 0);
      ctx.lineTo(32, -9);
      ctx.lineTo(32, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const dark = ctx.createRadialGradient(cx, cy, light * 0.24 * zoom, cx, cy, light * zoom);
    dark.addColorStop(0, "rgba(0, 0, 0, 0)");
    dark.addColorStop(0.7, "rgba(0, 0, 0, 0.62)");
    dark.addColorStop(1, C.ground);
    ctx.fillStyle = dark;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    if (p.bloom > 0) {
      const gold = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rect.w, rect.h) * 0.75);
      gold.addColorStop(0, `rgba(255, 222, 160, ${0.1 * p.bloom})`);
      gold.addColorStop(0.35, `rgba(255, 214, 140, ${0.22 * p.bloom})`);
      gold.addColorStop(0.7, `rgba(216, 178, 106, ${0.16 * p.bloom})`);
      gold.addColorStop(1, "rgba(216, 178, 106, 0)");
      ctx.fillStyle = gold;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

    if (duel) {
      ctx.fillStyle = `rgba(${BRASS}, 0.75)`;
      ctx.font = "500 13px 'IBM Plex Mono', monospace";
      ctx.fillText(`OYUNCU ${p.label}`, rect.x + 14, rect.y + 24);
    }
    ctx.restore();
    return giantVisible;
  }

  function draw(now) {
    const ratio = scale();
    const view = viewSize();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = C.ground;
    ctx.fillRect(0, 0, view.w, view.h);

    const visible = [];
    if (duel) {
      const halfW = (view.w - 2) / 2;
      visible.push(drawView(players[0], { x: 0, y: 0, w: halfW, h: view.h }, now));
      visible.push(drawView(players[1], { x: halfW + 2, y: 0, w: halfW, h: view.h }, now));
      ctx.fillStyle = `rgba(${BRASS}, 0.35)`;
      ctx.fillRect(halfW, 0, 2, view.h);
    } else {
      visible.push(drawView(players[0], { x: 0, y: 0, w: view.w, h: view.h }, now));
    }
    return visible;
  }

  // --- durum ---
  function elapsedNow() {
    return ((finished ? finished.at : performance.now()) - startedAt) / 1000;
  }

  function updateHud() {
    els.time.textContent = formatTime(running || finished ? elapsedNow() : 0);
    els.seen.textContent = players.reduce((n, p) => n + p.seen.size, 0).toLocaleString("tr-TR");
    els.hints.textContent = players.map((p) => p.hints).join(" · ");
    els.hintBtn.disabled = !running || !!finished || players[0].hints === 0;
    if (duel) {
      els.p1Time.textContent = players[0].done ? formatTime(players[0].done) : "—";
      els.p2Time.textContent = players[1].done ? formatTime(players[1].done) : "—";
    }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function finish(winner, now) {
    finished = { winner, at: now };
    const elapsed = elapsedNow();
    const seenTotal = players.reduce((n, p) => n + p.seen.size, 0);

    if (duel) {
      els.overlayTitle.textContent = `Oyuncu ${winner.label} kazandı`;
      els.overlayText.textContent = "Dev aynayı önce o buldu.";
      els.best.parentElement.hidden = true;
    } else {
      const last = chapterIndex === CHAPTERS.length - 1;
      els.overlayTitle.textContent = chapter.returnTrip
        ? "Kendine geldin"
        : "Kendini dev aynasında gördün";
      els.overlayText.textContent = chapter.returnTrip
        ? "Kendini dev aynasında gördün — ve oradan kendine döndün."
        : "Binlerce ayna arasından doğru olanı buldun.";
      els.best.parentElement.hidden = false;
      let best = Number(localStorage.getItem(`${BEST_KEY}:${chapterIndex}`) || 0);
      if (!best || elapsed < best) {
        best = elapsed;
        try {
          localStorage.setItem(`${BEST_KEY}:${chapterIndex}`, String(elapsed));
        } catch (err) {
          /* depolama kapalıysa sessizce geç */
        }
      }
      els.best.textContent = formatTime(best);
    }

    els.overlayTime.textContent = formatTime(elapsed);
    els.overlaySeen.textContent = `${seenTotal.toLocaleString("tr-TR")} / ${mirrorCount.toLocaleString("tr-TR")}`;
    els.next.hidden = true;
    els.overlay.hidden = false;
    updateHud();
  }

  // Oyuncu dev aynaya değip üstüne yürüyor mu? Geçiş bununla olur.
  function pushingIntoGiant(p) {
    const g = segGeometry(giant);
    if (giant.horizontal) {
      if (p.x < g.ax - 6 || p.x > g.bx + 6) return false;
      const mesafe = Math.abs(p.y - g.ay);
      const yon = g.ay - p.y;                  // aynaya doğru olan yön
      return mesafe <= ENTER_REACH && p.vy * yon > 15;
    }
    if (p.y < g.ay - 6 || p.y > g.by + 6) return false;
    const mesafe = Math.abs(p.x - g.ax);
    const yon = g.ax - p.x;
    return mesafe <= ENTER_REACH && p.vx * yon > 15;
  }

  // Dev aynayı bulan oyuncu aynanın içinden geçer: bir sonraki bölüm,
  // kendi ışığı ve rengiyle açılır. Süre kaldığı yerden devam eder.
  function enterMirror(now) {
    Sound.through();
    chapterIndex = Math.min(chapterIndex + 1, CHAPTERS.length - 1);
    const gecenSure = startedAt;
    newRoom(randomSeed());
    startedAt = gecenSure;
    carding = now + 2600;
    els.cardTitle.textContent = chapter.name;
    els.cardText.textContent = chapter.card;
    els.chapterCard.hidden = false;
    updateHud();
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0);
    lastFrame = now;
    if (carding && now > carding) {
      carding = 0;
      els.chapterCard.hidden = true;
    }
    if (running && !finished && !carding) moveAll(dt);
    const visible = finished ? [] : draw(now);

    if (running && !finished) {
      players.forEach((p, i) => {
        if (p.done) return;
        if (phase === "donus") {
          // III. bölüm: dev aynadan sonra kapıya dönüş.
          if (Math.hypot(p.x - CELL * 0.5, p.y - CELL * 0.5) < CELL * 0.45) {
            p.done = elapsedNow();
            finish(p, now);
          }
          return;
        }
        if (visible[i]) {
          if (!p.foundAt) {
            p.foundAt = now;
            Sound.discovery();
          }
          // Işık, aynaya yaklaştıkça güçlenir; asıl geçiş içine yürüyünce olur.
          p.bloom = Math.min(1, p.bloom + dt * 2.2);
          if (!holdAtMirror && pushingIntoGiant(p)) {
            if (chapter.returnTrip) {
              phase = "donus";
              els.objective.textContent = "Pirinç kapıya dön";
              p.foundAt = 0;
              Sound.through();
            } else if (duel) {
              p.done = elapsedNow();
              finish(p, now);
            } else {
              enterMirror(now);
            }
          }
        } else {
          p.foundAt = 0;
          p.bloom = Math.max(0, p.bloom - dt * 2.4);
        }
      });
      updateHud();
    }
    requestAnimationFrame(loop);
  }

  // --- girdi ---
  const KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d"];
  window.addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (KEYS.includes(k) || k === "Shift") {
      e.preventDefault();
      keys.add(k);
    }
    if (k === "h" || k === "q") useHint(players[0]);
    if (k === "m" && duel) useHint(players[1]);
    if (k === "r") restart();
    if (k === "m" && !duel) toggleSound();   // "s" yürüme tuşu, sessize alma M
    if (!running && (k === "Enter" || k === " ")) startSolo();
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys.delete(k);
  });
  window.addEventListener("blur", () => keys.clear());

  function useHint(p) {
    if (!p || !running || finished || p.hints === 0) return;
    p.hints--;
    p.hintUntil = performance.now() + 2500;
    updateHud();
  }

  function randomSeed() {
    return 1 + Math.floor(Math.random() * 99998);
  }

  function begin(isDuel, nextSeed) {
    Sound.start();
    duel = isDuel;
    chapterIndex = 0;
    carding = 0;
    els.chapterCard.hidden = true;
    els.intro.hidden = true;
    newRoom(nextSeed);
    running = true;
    startedAt = performance.now();
    updateHud();
  }
  const startSolo = () => begin(false, randomSeed());
  const startDuel = () => begin(true, randomSeed());
  function restart() {
    if (!running && els.intro.hidden === false) return;
    begin(duel, randomSeed());
  }

  els.enterSolo.addEventListener("click", startSolo);
  els.enterDuel.addEventListener("click", startDuel);
  function toggleSound() {
    Sound.start();
    const acik = Sound.toggle();
    els.soundBtn.textContent = acik ? "Ses açık" : "Ses kapalı";
    els.soundBtn.setAttribute("aria-pressed", String(acik));
  }
  els.soundBtn.addEventListener("click", toggleSound);
  els.hintBtn.addEventListener("click", () => useHint(players[0]));
  els.restart.addEventListener("click", restart);
  els.againBtn.addEventListener("click", () => begin(duel, randomSeed()));
  els.codeApply.addEventListener("click", () => {
    const code = parseInt(els.codeInput.value.trim(), 10);
    if (!code || code < 1 || code > 99999) {
      els.codeInput.value = "";
      els.codeInput.placeholder = "1–99999 arası";
      return;
    }
    begin(duel, code);
  });

  // dokunmatik (tek kişilik)
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
  chapter = CHAPTERS[0];
  newRoom(randomSeed());
  requestAnimationFrame((t) => {
    lastFrame = t;
    loop(t);
  });

  // testler için
  window.__devAynasi = {
    startSolo, startDuel,
    setChapter(i) { chapterIndex = i; chapter = CHAPTERS[i]; },
    jumpToChapter(i) {
      const t = startedAt;
      chapterIndex = i;
      newRoom(randomSeed());
      startedAt = t;
      carding = 0;
      els.chapterCard.hidden = true;
    },
    skipCard() { carding = 0; els.chapterCard.hidden = true; },
    holdAtMirror(v) { holdAtMirror = !!v; },
    teleportToGiant(index = 0) {
      const g = segGeometry(giant);
      const inside = (v, max) => (v >= max ? -CELL * 0.4 : CELL * 0.4);
      const p = players[index];
      p.x = giant.horizontal ? g.ax + CELL / 2 : g.ax + inside(giant.x, size);
      p.y = giant.horizontal ? g.ay + inside(giant.y, size) : g.ay + CELL / 2;
      p.vx = 0;
      p.vy = 0;
    },
    // Oyuncuyu dev aynanın önüne koyar ve aynaya doğru yürümek için
    // basılması gereken tuşu söyler (testler klavyeyi gerçekten kullanır).
    faceGiant(index = 0) {
      const g = segGeometry(giant);
      const p = players[index];
      p.vx = 0;
      p.vy = 0;
      if (giant.horizontal) {
        p.x = g.ax + CELL / 2;
        const disarida = giant.y >= size;
        p.y = g.ay + (disarida ? -CELL * 0.45 : CELL * 0.45);
        return disarida ? "s" : "w";
      }
      p.y = g.ay + CELL / 2;
      const disarida = giant.x >= size;
      p.x = g.ax + (disarida ? -CELL * 0.45 : CELL * 0.45);
      return disarida ? "d" : "a";
    },
    teleportToDecoy(index = 0) {
      const id = [...decoys.keys()][0];
      if (!id) return false;
      const horizontal = id[0] === "h";
      const [x, y] = id.slice(1).split(",").map(Number);
      const g = segGeometry({ horizontal, x, y });
      const inside = (v, max) => (v >= max ? -CELL * 0.4 : CELL * 0.4);
      const p = players[index];
      p.x = horizontal ? g.ax + CELL / 2 : g.ax + inside(x, size);
      p.y = horizontal ? g.ay + inside(y, size) : g.ay + CELL / 2;
      return true;
    },
    teleportToDoor(index = 0) {
      players[index].x = CELL * 0.5;
      players[index].y = CELL * 0.5;
    },
    pos: (i = 0) => ({ x: players[i].x, y: players[i].y }),
    nudge(dx, dy, i = 0) { players[i].x += dx; players[i].y += dy; },
    bloom: (i = 0) => players[i].bloom,
    speed: (i = 0) => Math.hypot(players[i].vx, players[i].vy),
    state: () => ({
      chapter: chapter.name, seed, duel, phase, mirrors: mirrorCount,
      decoys: decoys.size, seen: players.reduce((n, p) => n + p.seen.size, 0),
      finished: !!finished, winner: finished ? finished.winner.label : null,
    }),
  };
})();
