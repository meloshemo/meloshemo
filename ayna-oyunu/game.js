// Ayna Oyunu - arayüz ve çizim
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const els = {
    levelName: document.getElementById("levelName"),
    levelCount: document.getElementById("levelCount"),
    status: document.getElementById("status"),
    mirrorCount: document.getElementById("mirrorCount"),
    hintText: document.getElementById("hintText"),
    prev: document.getElementById("prev"),
    next: document.getElementById("next"),
    reset: document.getElementById("reset"),
    hint: document.getElementById("hint"),
  };

  const STORAGE_KEY = "ayna-oyunu:ilerleme";
  const CELL = 84;
  const PAD = 16;

  let levelIndex = 0;
  let board = null;
  let placed = {};
  let result = null;
  let solvedLevels = loadProgress();

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (err) {
      return new Set();
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...solvedLevels]));
    } catch (err) {
      /* depolama kapalıysa sessizce geç */
    }
  }

  function loadLevel(index) {
    levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    board = Engine.parseLevel(LEVELS[levelIndex]);
    placed = {};
    canvas.width = board.width * CELL + PAD * 2;
    canvas.height = board.height * CELL + PAD * 2;
    els.hintText.hidden = true;
    update();
  }

  function usedMirrors() {
    return Object.keys(placed).length;
  }

  function update() {
    result = Engine.trace(board, placed);
    els.levelName.textContent = `${levelIndex + 1}. ${board.name}`;
    els.levelCount.textContent = `${LEVELS.length} bölümden ${solvedLevels.size} tanesi çözüldü`;
    els.mirrorCount.textContent = `${usedMirrors()}/${board.mirrors}`;
    els.mirrorCount.classList.toggle("full", usedMirrors() >= board.mirrors);
    els.hintText.textContent = board.hint;
    els.prev.disabled = levelIndex === 0;
    els.next.disabled = levelIndex === LEVELS.length - 1;

    if (result.solved) {
      if (!solvedLevels.has(levelIndex)) {
        solvedLevels.add(levelIndex);
        saveProgress();
        els.levelCount.textContent = `${LEVELS.length} bölümden ${solvedLevels.size} tanesi çözüldü`;
      }
      const last = levelIndex === LEVELS.length - 1;
      els.status.textContent = last
        ? "🎉 Tebrikler, tüm bölümleri bitirdin!"
        : "✅ Hedef vuruldu! Sonraki bölüme geçebilirsin.";
      els.status.classList.add("win");
    } else {
      els.status.classList.remove("win");
      els.status.textContent =
        usedMirrors() >= board.mirrors
          ? "Ayna hakkın bitti. Bir aynayı kaldırıp yeniden dene."
          : "Bir kareye tıklayarak ayna yerleştir.";
    }
    draw();
  }

  function cellAt(evt) {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    const x = Math.floor(((evt.clientX - rect.left) * scale - PAD) / CELL);
    const y = Math.floor(((evt.clientY - rect.top) * scale - PAD) / CELL);
    if (x < 0 || y < 0 || x >= board.width || y >= board.height) return null;
    return { x, y };
  }

  canvas.addEventListener("click", (evt) => {
    const pos = cellAt(evt);
    if (!pos) return;
    const cell = board.cells[pos.y][pos.x];
    if (cell.type !== "empty" || !cell.placeable) return;
    const key = `${pos.x},${pos.y}`;
    const current = placed[key];
    if (!current) {
      if (usedMirrors() >= board.mirrors) {
        els.status.textContent = "Ayna hakkın bitti. Bir aynayı kaldırıp yeniden dene.";
        return;
      }
      placed[key] = "/";
    } else if (current === "/") {
      placed[key] = "\\";
    } else {
      delete placed[key];
    }
    update();
  });

  els.prev.addEventListener("click", () => loadLevel(levelIndex - 1));
  els.next.addEventListener("click", () => loadLevel(levelIndex + 1));
  els.reset.addEventListener("click", () => {
    placed = {};
    update();
  });
  els.hint.addEventListener("click", () => {
    els.hintText.hidden = !els.hintText.hidden;
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key === "ArrowLeft") loadLevel(levelIndex - 1);
    if (evt.key === "ArrowRight") loadLevel(levelIndex + 1);
    if (evt.key.toLowerCase() === "r") {
      placed = {};
      update();
    }
  });

  // --- çizim ---
  const center = (v) => PAD + v * CELL + CELL / 2;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) drawCell(x, y);
    }
    drawBeam();
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) drawContents(x, y);
    }
  }

  function drawCell(x, y) {
    const cell = board.cells[y][x];
    const px = PAD + x * CELL;
    const py = PAD + y * CELL;
    ctx.fillStyle = cell.type === "wall" ? "#2b3440" : (x + y) % 2 ? "#131a23" : "#171f2a";
    ctx.fillRect(px, py, CELL, CELL);
    ctx.strokeStyle = "#26303d";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
    if (cell.type === "empty" && cell.placeable) {
      ctx.fillStyle = "#243040";
      ctx.beginPath();
      ctx.arc(center(x), center(y), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBeam() {
    ctx.strokeStyle = result.solved ? "#3fb950" : "#ff4d6d";
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const s of result.segments) {
      const x2 = s.outside ? clampToEdge(s.x2, board.width) : s.x2;
      const y2 = s.outside ? clampToEdge(s.y2, board.height) : s.y2;
      ctx.beginPath();
      ctx.moveTo(center(s.x1), center(s.y1));
      ctx.lineTo(center(x2), center(y2));
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // Tahtanın dışına çıkan ışını kenarda kes.
  function clampToEdge(v, size) {
    if (v < 0) return -0.35;
    if (v >= size) return size - 1 + 0.35;
    return v;
  }

  function drawContents(x, y) {
    const cell = board.cells[y][x];
    const cx = center(x);
    const cy = center(y);
    const mirror = cell.type === "mirror" ? cell.mirror : placed[`${x},${y}`];

    if (mirror) {
      const r = CELL * 0.3;
      ctx.strokeStyle = cell.type === "mirror" ? "#8b949e" : "#58a6ff";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      if (mirror === "/") {
        ctx.moveTo(cx - r, cy + r);
        ctx.lineTo(cx + r, cy - r);
      } else {
        ctx.moveTo(cx - r, cy - r);
        ctx.lineTo(cx + r, cy + r);
      }
      ctx.stroke();
      return;
    }

    if (cell.type === "wall") {
      ctx.strokeStyle = "#3d4a5c";
      ctx.lineWidth = 2;
      for (let i = -CELL; i < CELL; i += 12) {
        ctx.beginPath();
        ctx.moveTo(cx - CELL / 2 + i, cy + CELL / 2);
        ctx.lineTo(cx - CELL / 2 + i + CELL, cy - CELL / 2);
        ctx.stroke();
      }
      return;
    }

    if (cell.type === "target") {
      const hit = result.hits.has(`${x},${y}`);
      ctx.strokeStyle = hit ? "#3fb950" : "#8b949e";
      ctx.fillStyle = hit ? "#3fb950" : "transparent";
      ctx.lineWidth = 3;
      for (const r of [CELL * 0.3, CELL * 0.18]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.08, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (cell.type === "source") {
      ctx.fillStyle = "#ff4d6d";
      ctx.beginPath();
      ctx.arc(cx, cy, CELL * 0.22, 0, Math.PI * 2);
      ctx.fill();
      const d = Engine.DIRS[cell.dir];
      ctx.strokeStyle = "#ffd0d8";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + d.dx * CELL * 0.36, cy + d.dy * CELL * 0.36);
      ctx.stroke();
    }
  }

  loadLevel(0);
})();
