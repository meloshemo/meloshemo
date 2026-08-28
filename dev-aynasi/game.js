// Dev Aynası - bölümler, düello, sahne çizimi ve girdi
(function () {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const els = {
    time: $("time"), seen: $("seen"), total: $("total"), hints: $("hints"),
    chapter: $("chapter"), objective: $("objective"),
    hintBtn: $("hintBtn"), restart: $("restart"), langBtn: $("langBtn"),
    intro: $("intro"), enterSolo: $("enterSolo"), enterDuel: $("enterDuel"), enterEndless: $("enterEndless"),
    codeInput: $("codeInput"), codeApply: $("codeApply"), codeLabel: $("codeLabel"),
    overlay: $("overlay"), overlayTitle: $("overlayTitle"), overlayText: $("overlayText"),
    ledger: $("ledger"), overlayTime: $("overlayTime"), overlaySeen: $("overlaySeen"),
    best: $("best"), ledgerBest: $("ledgerBest"), next: $("next"), againBtn: $("againBtn"),
    duelBadge: $("duelBadge"), p1Time: $("p1Time"), p2Time: $("p2Time"),
    chapterCard: $("chapterCard"), cardTitle: $("cardTitle"), cardText: $("cardText"),
    fsBtn: $("fsBtn"), settingsBtn: $("settingsBtn"), settings: $("settings"), settingsClose: $("settingsClose"),
    brightness: $("brightness"), reduceMotion: $("reduceMotion"), roomPicker: $("roomPicker"),
    privacyBtn: $("privacyBtn"), privacy: $("privacy"), privacyClose: $("privacyClose"),
    privacyText: $("privacyText"), version: $("version"),
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
  const AYAR_KEY = "dev-aynasi:ayarlar";
  const ACIK_KEY = "dev-aynasi:acilan";
  const SURUM = "1.1.1";

  // Ayarlar ve açılan bölümler tarayıcıda saklanır.
  const ayarlar = Object.assign(
    { parlaklik: 1, azHareket: false },
    (() => {
      try {
        return JSON.parse(localStorage.getItem(AYAR_KEY) || "{}");
      } catch (err) {
        return {};
      }
    })()
  );
  function ayarlariKaydet() {
    try {
      localStorage.setItem(AYAR_KEY, JSON.stringify(ayarlar));
    } catch (err) {
      /* depolama kapalıysa sessizce geç */
    }
  }
  let acilan = 0;
  try {
    acilan = Math.max(0, Number(localStorage.getItem(ACIK_KEY) || 0));
  } catch (err) {
    acilan = 0;
  }
  function acilaniKaydet(i) {
    acilan = Math.max(acilan, i);
    try {
      localStorage.setItem(ACIK_KEY, String(acilan));
    } catch (err) {
      /* depolama kapalıysa sessizce geç */
    }
  }

  // Her bölüm salonu biraz daha zorlaştırır: ışık daralır, sahte devler artar.
  // Her bölüm dev aynanın içinden geçilerek girilen ayrı bir dünyadır;
  // ışığı da rengi de değişir.
  const CHAPTERS = [
    {
      size: 40, light: 235, hints: 3, decoys: 0,
      palette: { ground: "#0a0710", floorA: "#120c1a", floorB: "#0e0916", glass: "168, 203, 216", lamp: "255, 231, 194" },
    },
    {
      size: 46, light: 205, hints: 2, decoys: 14,
      palette: { ground: "#05090f", floorA: "#0b141d", floorB: "#081018", glass: "150, 214, 232", lamp: "196, 232, 255" },
    },
    {
      size: 48, light: 195, hints: 2, decoys: 16,
      mirrorControls: true,
      palette: { ground: "#0d0612", floorA: "#180d22", floorB: "#12091a", glass: "206, 178, 232", lamp: "226, 200, 255" },
    },
    {
      size: 50, light: 190, hints: 2, decoys: 18,
      shiftEvery: 11000,
      palette: { ground: "#050d0c", floorA: "#0a1a18", floorB: "#071312", glass: "150, 232, 210", lamp: "190, 255, 236" },
    },
    {
      size: 52, light: 185, hints: 2, decoys: 20,
      echo: true,
      palette: { ground: "#0b0710", floorA: "#161020", floorB: "#100b18", glass: "196, 200, 224", lamp: "222, 226, 255" },
    },
    {
      size: 54, light: 180, hints: 2, decoys: 24,
      palette: { ground: "#100608", floorA: "#1b0e10", floorB: "#150a0c", glass: "236, 186, 150", lamp: "255, 208, 150" },
    },

    // --- İkinci perde: dünya turu ---
    {
      // VII · Paris — Aynalar Galerisi: duvarların yarısı yok, salon açık ve
      // ışık geniş. Saklanacak yer yok ama mesafeler uzun.
      size: 56, light: 320, hints: 2, decoys: 26, openHall: 0.55,
      palette: { ground: "#0b0910", floorA: "#191524", floorB: "#13101c", glass: "228, 214, 236", lamp: "255, 236, 214" },
    },
    {
      // VIII · Venedik — Su Basmış Salon: su yürümeyi ağırlaştırır, beş
      // saniyede bir yayılan dalga uzaktaki camları bir an aydınlatır.
      size: 54, light: 190, hints: 2, decoys: 24, water: true,
      palette: { ground: "#040d12", floorA: "#0a1a24", floorB: "#07141c", glass: "158, 222, 232", lamp: "186, 240, 255" },
    },
    {
      // IX · Tokyo — Neon: bütün camlar renk değiştirir. Dev ayna
      // yanıp sönmez; kalabalıkta kıpırdamayan tek şey odur.
      size: 58, light: 210, hints: 2, decoys: 30, neon: true,
      palette: { ground: "#0a0413", floorA: "#170a26", floorB: "#11071c", glass: "255, 120, 220", lamp: "180, 220, 255" },
    },
    {
      // X · New York — Izgara: cadde ve sokaklar düz; koşmak serbest ama
      // her köşe birbirinin aynı.
      size: 60, light: 200, hints: 2, decoys: 28, grid: true,
      palette: { ground: "#080a0f", floorA: "#12171f", floorB: "#0d1219", glass: "196, 214, 232", lamp: "255, 244, 214" },
    },
    {
      // XI · Kahire — Kum Fırtınası: görüş sürekli daralıp açılır, kum
      // taneleri havada süzülür.
      size: 58, light: 215, hints: 2, decoys: 26, storm: true,
      palette: { ground: "#100c05", floorA: "#1e1810", floorB: "#17120b", glass: "236, 208, 150", lamp: "255, 226, 168" },
    },
    {
      // XII · İstanbul — Kapalıçarşı: uzun çarşı sokakları, en kalabalık
      // ayna yığını ve dönüş. Dünyayı gezdin, şimdi kendine dön.
      size: 62, light: 195, hints: 3, decoys: 34, bazaar: true,
      returnTrip: true, fading: true,
      palette: { ground: "#0f0906", floorA: "#1d1410", floorB: "#160f0b", glass: "240, 200, 140", lamp: "255, 214, 150" },
    },

    // --- Üçüncü perde: son üç metropol ve kaçan ayna ---
    {
      // XIII · Londra — Sis: görüş sık sık kapanır, camlar griye çalar.
      size: 60, light: 205, hints: 2, decoys: 28, fog: true,
      palette: { ground: "#0a0c0e", floorA: "#161b1f", floorB: "#111518", glass: "206, 216, 222", lamp: "226, 236, 244" },
    },
    {
      // XIV · Dubai — Cam Kule: dev bir açık kat, uzak mesafeler, geniş ışık.
      size: 66, light: 300, hints: 2, decoys: 32, openHall: 0.45, grid: true,
      palette: { ground: "#080a12", floorA: "#141a28", floorB: "#0f1420", glass: "186, 220, 255", lamp: "224, 240, 255" },
    },
    {
      // XV · Rio — Karnaval: renkler döner, duvarlar da geçit gibi kayar.
      size: 64, light: 215, hints: 2, decoys: 30, neon: true, shiftEvery: 13000,
      palette: { ground: "#0d0510", floorA: "#1c0d20", floorB: "#150818", glass: "255, 170, 90", lamp: "255, 214, 170" },
    },
    {
      // XVI · Kaçan Ayna: dev ayna yerinde durmaz. Her 20 saniyede bir
      // başka bir duvara geçer, yaklaşınca kaçar. Yakalarsan kapıya dön.
      size: 70, light: 185, hints: 3, decoys: 36,
      fleeing: { every: 20000, range: CELL * 3.2, grace: 1200 },
      returnTrip: true, fading: true,
      palette: { ground: "#050308", floorA: "#0f0a16", floorB: "#0a0710", glass: "214, 196, 255", lamp: "236, 224, 255" },
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
  let echo = null;          // V. bölümdeki yankı
  let endless = false;      // sonsuz mod
  let endlessCount = 0;     // sonsuz modda geçilen oda sayısı
  let bandOfRoom = "orta";  // dev aynanın bu salondaki mesafe kuşağı
  let nextFlee = 0;         // aynanın kaçacağı an
  let fleeTrail = null;     // kaçtıktan sonra eski yerde kalan iz
  let nearSince = 0;        // oyuncunun aynaya yaklaştığı an (kaçış gecikmesi)
  let nextShift = 0;        // IV. bölümde aynaların kayacağı an
  let shiftFlash = 0;       // kayma anındaki parlama
  let fade = 1;             // sönen fener (final)
  let ripple = 0;           // Venedik dalgası: 0..1
  let nextRipple = 0;
  let sand = [];            // Kahire kum taneleri
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

  // Sıcak iz: dev aynanın çevresindeki camların çerçevesi hafif altın vurur.
  function hesaplaSicakIz() {
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
  }

  // XVI · Kaçan Ayna: dev ayna yer değiştirir. Yaklaşınca da kaçar ama
  // "grace" kadar bir soluk payı bırakır; o an içinde içine yürüyebilirsen
  // yakalarsın. Eski yerinde birkaç saniye altın bir iz kalır.
  function fleeGiant(now) {
    const eski = segCenter(giant);
    let yeni = giant;
    for (let deneme = 0; deneme < 30; deneme++) {
      const aday = Maze.pickGiant(maze, { x: 0, y: 0 }, (seed + now + deneme * 7919) | 0, "uzak");
      const m = segCenter(aday);
      if (Math.hypot(m.x - players[0].x, m.y - players[0].y) > CELL * 8) {
        yeni = aday;
        break;
      }
    }
    giant = yeni;
    giantSeg = segCenter(giant);
    hesaplaSicakIz();
    fleeTrail = { x: eski.x, y: eski.y, at: now };
    nextFlee = now + chapter.fleeing.every;
    nearSince = 0;
    players.forEach((p) => { p.foundAt = 0; p.bloom = 0; });
  }

  function maybeFlee(now) {
    if (!chapter.fleeing || phase !== "arayis") return;
    const p = players[0];
    const d = Math.hypot(p.x - giantSeg.x, p.y - giantSeg.y);
    if (d < chapter.fleeing.range) {
      if (!nearSince) nearSince = now;
      if (now - nearSince > chapter.fleeing.grace) fleeGiant(now);
      return;
    }
    nearSince = 0;
    if (now > nextFlee) fleeGiant(now);
  }

  // Şehirlere özgü salon düzenleri: Paris'in açık galerisi, New York'un
  // ızgarası, İstanbul'un uzun çarşı sokakları.
  function applyCityLayout() {
    let s = (seed * 22695477 + 1) >>> 0;
    const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

    if (chapter.openHall) {
      for (let y = 1; y < size; y++) {
        for (let x = 1; x < size; x++) {
          if (rand() < chapter.openHall) maze.hWalls[y][x] = false;
          if (rand() < chapter.openHall) maze.vWalls[y][x] = false;
        }
      }
    }

    if (chapter.grid) {
      // Cadde ve sokaklar: her üç karede bir tam koridor açılır.
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (y % 3 === 1) maze.vWalls[y][x] = x === 0;
          if (x % 3 === 1) maze.hWalls[y][x] = y === 0;
        }
      }
    }

    if (chapter.bazaar) {
      // Çarşı sokakları: rastgele satır ve sütunlar boydan boya açılır.
      for (let i = 0; i < Math.floor(size / 4); i++) {
        const y = 1 + Math.floor(rand() * (size - 2));
        const x = 1 + Math.floor(rand() * (size - 2));
        for (let k = 1; k < size; k++) {
          maze.vWalls[y][k] = false;
          maze.hWalls[k][x] = false;
        }
      }
    }
  }

  // Bölümün metinleri seçili dilden okunur.
  function chapterText() {
    return I18n.chapters()[Math.min(chapterIndex, I18n.chapters().length - 1)];
  }

  // Sonsuz mod: her oda rastgele kurallarla ve biraz daha büyük kurulur.
  // Aynı kural iki kez üst üste gelmesin diye seçim tohumdan türetilir.
  function endlessChapter(n, tohum) {
    let s = (tohum * 2654435761 + n * 40503) >>> 0;
    const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const kurallar = [
      { mirrorControls: true }, { shiftEvery: 9000 }, { echo: true },
      { neon: true }, { water: true }, { storm: true },
      { grid: true }, { openHall: 0.5 }, { bazaar: true }, {},
    ];
    const secim = Object.assign({}, kurallar[Math.floor(rand() * kurallar.length)]);
    if (rand() < 0.35) Object.assign(secim, kurallar[Math.floor(rand() * kurallar.length)]);
    const paletler = CHAPTERS.map((c) => c.palette);
    return Object.assign(
      {
        size: Math.min(90, 42 + n * 3),
        light: Math.max(150, 230 - n * 6),
        hints: n < 3 ? 2 : 1,
        decoys: Math.min(60, 10 + n * 4),
        palette: paletler[Math.floor(rand() * paletler.length)],
      },
      secim
    );
  }

  function newRoom(nextSeed) {
    chapter = endless ? endlessChapter(endlessCount, nextSeed) : CHAPTERS[chapterIndex];
    C = { ...chapter.palette };
    size = chapter.size;
    seed = nextSeed;
    maze = Maze.generate(size, size, seed);
    applyCityLayout();
    mirrorCount = Maze.mirrors(maze).length;
    bandOfRoom = Maze.pickBand(seed + chapterIndex * 31);
    giant = Maze.pickGiant(maze, { x: 0, y: 0 }, seed, bandOfRoom);
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

    hesaplaSicakIz();

    players = duel
      ? [
          makePlayer("1", { up: "w", down: "s", left: "a", right: "d", hint: "q" }, "#f2eae0"),
          makePlayer("2", { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", hint: "m" }, "#a8cbd8"),
        ]
      : [makePlayer("1", { up: "w", down: "s", left: "a", right: "d", hint: "h" }, "#f2eae0")];
    players[0].y = duel ? CELL * 0.34 : CELL * 0.5;
    if (duel) players[1].y = CELL * 0.68;

    // Yankı: oyuncunun odanın merkezine göre simetriği, hareketi tersten tekrar eder.
    echo = chapter.echo
      ? { x: (size - 0.5) * CELL, y: (size - 0.5) * CELL, vurus: 0 }
      : null;
    nextShift = chapter.shiftEvery ? performance.now() + chapter.shiftEvery : 0;
    nextRipple = chapter.water ? performance.now() + 2500 : 0;
    nextFlee = chapter.fleeing ? performance.now() + chapter.fleeing.every : 0;
    fleeTrail = null;
    nearSince = 0;
    ripple = 0;
    sand = chapter.storm
      ? Array.from({ length: 90 }, () => ({
          x: Math.random() * 1400 - 700, y: Math.random() * 900 - 450,
          r: 0.8 + Math.random() * 1.8, a: 0.05 + Math.random() * 0.2,
          vx: 90 + Math.random() * 120, vy: -20 + Math.random() * 40,
        }))
      : [];
    shiftFlash = 0;
    fade = 1;

    phase = "arayis";
    finished = null;
    startedAt = performance.now();
    keys.clear();
    els.total.textContent = mirrorCount.toLocaleString("tr-TR");
    els.chapter.textContent = endless
      ? `${I18n.t("endless")} · ${endlessCount + 1}`
      : chapterText().name;
    els.objective.textContent = endless ? I18n.t("endlessGoal") : chapterText().objective;
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
      // Ters Salon: aynadaki gibi, sağ-sol yer değişir.
      if (chapter.mirrorControls) ix = -ix;

      const len = Math.hypot(ix, iy);
      const suKatsayi = chapter.water ? 0.72 : 1;
      const hedefHiz = (kosu ? SPRINT : SPEED) * suKatsayi;
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

  function drawPanel(seg, dist, light, isWarm, now) {
    const g = segGeometry(seg);
    let glow = Math.max(0, 1 - dist / (light * 1.15));
    // Venedik dalgası geçerken uzaktaki camlar bir an parlar.
    if (ripple > 0) {
      const halka = ripple * light * 3.2;
      if (Math.abs(dist - halka) < 46) glow = Math.max(glow, 0.55 * (1 - ripple));
    }
    if (chapter.neon) {
      // Tokyo: her cam kendi ritminde renk değiştirir; dev ayna kıpırdamaz.
      const faz = (seg.x * 37 + seg.y * 61) % 360;
      const t = now / 520 + faz;
      const r = 150 + 105 * Math.sin(t);
      const yesil = 120 + 90 * Math.sin(t + 2.1);
      const m = 190 + 65 * Math.sin(t + 4.2);
      ctx.strokeStyle = `rgba(${r | 0}, ${yesil | 0}, ${m | 0}, ${(0.12 + glow * 0.7).toFixed(3)})`;
    } else {
      ctx.strokeStyle = `rgba(${C.glass}, ${(0.1 + glow * 0.6).toFixed(3)})`;
    }
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
  function drawView(p, rect, now, dt = 0.016) {
    const firtina = chapter.storm ? 0.72 + 0.4 * (0.5 + 0.5 * Math.sin(now / 2600)) : 1;
    const sis = chapter.fog
      ? 0.6 + 0.5 * (0.5 + 0.5 * Math.sin(now / 4100) * Math.sin(now / 1700))
      : 1;
    const light = chapter.light * (phase === "donus" ? 0.78 : 1) * fade * firtina * sis * ayarlar.parlaklik;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.fillStyle = C.ground;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const zoom = 1 + p.bloom * (ayarlar.azHareket ? 0 : 0.14);
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
    const panelMenzil = ripple > 0 ? light * 3.4 : light * 1.25;
    forEachNearSegment(p, panelMenzil, (horizontal, x, y, d) => {
      drawPanel({ horizontal, x, y }, d, light, warm.has(idOf(horizontal, x, y)), now);
    });

    if (sand.length && !ayarlar.azHareket) {
      for (const k of sand) {
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        if (k.x > halfW) { k.x = -halfW; k.y = (Math.random() - 0.5) * halfH * 2; }
        ctx.fillStyle = `rgba(255, 226, 168, ${k.a})`;
        ctx.beginPath();
        ctx.arc(camX + halfW + k.x, camY + halfH + k.y, k.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Kaçan aynanın bıraktığı iz: nereden kaçtığını üç saniye gösterir.
    if (fleeTrail && now - fleeTrail.at < 3000) {
      const omur = 1 - (now - fleeTrail.at) / 3000;
      ctx.strokeStyle = `rgba(${BRASS}, ${0.5 * omur})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fleeTrail.x, fleeTrail.y, CELL * (0.4 + (1 - omur) * 1.6), 0, Math.PI * 2);
      ctx.stroke();
    }

    if (echo) {
      const d = Math.hypot(echo.x - p.x, echo.y - p.y);
      if (d < light * 1.1) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        drawFigure(echo.x, echo.y, 1.05, 1.05, 0.85, "rgba(214, 226, 255, 0.92)", "rgba(150, 190, 255, 0.5)");
        ctx.restore();
      }
    }

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

    if (shiftFlash > 0) {
      ctx.fillStyle = `rgba(190, 255, 236, ${0.16 * shiftFlash})`;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }

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
      ctx.fillText(`${I18n.t("player")} ${p.label}`, rect.x + 14, rect.y + 24);
    }
    ctx.restore();
    return giantVisible;
  }

  function draw(now, dt) {
    const ratio = scale();
    const view = viewSize();
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = C.ground;
    ctx.fillRect(0, 0, view.w, view.h);

    const visible = [];
    if (duel) {
      const halfW = (view.w - 2) / 2;
      visible.push(drawView(players[0], { x: 0, y: 0, w: halfW, h: view.h }, now, dt));
      visible.push(drawView(players[1], { x: halfW + 2, y: 0, w: halfW, h: view.h }, now, dt));
      ctx.fillStyle = `rgba(${BRASS}, 0.35)`;
      ctx.fillRect(halfW, 0, 2, view.h);
    } else {
      visible.push(drawView(players[0], { x: 0, y: 0, w: view.w, h: view.h }, now, dt));
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
      els.overlayTitle.textContent = I18n.t("duelWin")(winner.label);
      els.overlayText.textContent = I18n.t("duelText");
      els.best.parentElement.hidden = true;
    } else {
      const last = chapterIndex === CHAPTERS.length - 1;
      els.overlayTitle.textContent = I18n.t("endTitle");
      els.overlayText.textContent = I18n.t("endText");
      els.best.parentElement.hidden = false;
      els.ledgerBest.textContent = I18n.t("ledgerBest");
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

    if (endless) {
      kaydetSonsuzRekor();
      els.overlayTitle.textContent = I18n.t("endlessOver");
      els.overlayText.textContent = I18n.t("endlessOverText")(endlessCount, sonsuzRekor());
      els.best.parentElement.hidden = false;
      els.best.textContent = String(sonsuzRekor());
      els.ledgerBest.textContent = I18n.t("bestRun");
    }
    els.overlayTime.textContent = formatTime(elapsed);
    els.overlaySeen.textContent = `${seenTotal.toLocaleString("tr-TR")} / ${mirrorCount.toLocaleString("tr-TR")}`;
    els.next.hidden = true;
    els.overlay.hidden = false;
    updateHud();
  }

  // V · Yankı: oyuncunun hareketini ters yönde tekrarlar, duvarlara takılır.
  // Değerse oyuncuyu başlangıca gönderir ve bir sezgi hakkı yakar.
  function updateEcho(dt) {
    if (!echo) return;
    const p = players[0];
    echo.x = slide(echo, echo.x - p.vx * dt, echo.y, "x");
    echo.y = slide(echo, echo.x, echo.y - p.vy * dt, "y");
    if (Math.hypot(echo.x - p.x, echo.y - p.y) < RADIUS * 2.1) {
      echo.vurus++;
      p.x = CELL * 0.5;
      p.y = CELL * 0.5;
      p.vx = 0;
      p.vy = 0;
      echo.x = (size - 0.5) * CELL;
      echo.y = (size - 0.5) * CELL;
      p.hints = Math.max(0, p.hints - 1);
        els.objective.textContent = I18n.t("echoHit");
      updateHud();
    }
  }

  // IV · Kayan Aynalar: belirli aralıklarla aynalar yer değiştirir.
  // Önce birkaç duvar kaldırılır (bu bağlantıyı asla bozmaz), sonra aynı
  // sayıda duvar başka yerlere konur; her ekleme salonun her yerinin
  // yürüyerek ulaşılabilir kaldığı doğrulanarak yapılır.
  function maybeShift(now) {
    if (!nextShift || now < nextShift) return;
    nextShift = now + chapter.shiftEvery;
    const pcx = Math.floor(players[0].x / CELL);
    const pcy = Math.floor(players[0].y / CELL);
    const uzakOyuncudan = (x, y) => Math.abs(x - pcx) > 1 || Math.abs(y - pcy) > 1;
    const rastgeleKenar = () => {
      const x = 1 + Math.floor(Math.random() * (size - 2));
      const y = 1 + Math.floor(Math.random() * (size - 2));
      return { x, y, yatay: Math.random() < 0.5 };
    };

    let kaldirilan = 0;
    for (let deneme = 0; deneme < 120 && kaldirilan < 10; deneme++) {
      const k = rastgeleKenar();
      if (!uzakOyuncudan(k.x, k.y)) continue;
      const id = idOf(k.yatay, k.x, k.y);
      if (id === giant.id) continue;
      const dizi = k.yatay ? maze.hWalls : maze.vWalls;
      if (!dizi[k.y][k.x]) continue;
      dizi[k.y][k.x] = false;
      kaldirilan++;
    }

    let eklenen = 0;
    for (let deneme = 0; deneme < 300 && eklenen < kaldirilan; deneme++) {
      const k = rastgeleKenar();
      if (!uzakOyuncudan(k.x, k.y)) continue;
      const dizi = k.yatay ? maze.hWalls : maze.vWalls;
      if (dizi[k.y][k.x]) continue;
      dizi[k.y][k.x] = true;
      if (Maze.distances(maze, { x: 0, y: 0 }).some((d) => d < 0)) {
        dizi[k.y][k.x] = false;   // bir köşeyi koparıyor, vazgeç
        continue;
      }
      eklenen++;
    }

    if (!kaldirilan && !eklenen) return;
    mirrorCount = Maze.mirrors(maze).length;
    els.total.textContent = mirrorCount.toLocaleString("tr-TR");
    shiftFlash = 1;
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
    if (endless) {
      endlessCount++;
      const gecenSure = startedAt;
      newRoom(randomSeed());
      startedAt = gecenSure;
      carding = now + 2000;
      els.cardTitle.textContent = `${I18n.t("endless")} · ${endlessCount + 1}`;
      els.cardText.textContent = I18n.t("endlessCard");
      els.chapterCard.hidden = false;
      kaydetSonsuzRekor();
      updateHud();
      return;
    }
    chapterIndex = Math.min(chapterIndex + 1, CHAPTERS.length - 1);
    acilaniKaydet(chapterIndex);
    const gecenSure = startedAt;
    newRoom(randomSeed());
    startedAt = gecenSure;
    carding = now + 2600;
    els.cardTitle.textContent = chapterText().name;
    els.cardText.textContent = chapterText().card;
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
    if (running && !finished && !carding) {
      moveAll(dt);
      updateEcho(dt);
      maybeShift(now);
      maybeFlee(now);
      if (chapter.fading && phase === "donus") fade = Math.max(0.42, fade - dt * 0.012);
      if (chapter.water) {
        if (now > nextRipple) { nextRipple = now + 5000; ripple = 0.001; }
        if (ripple > 0) ripple = ripple > 1 ? 0 : ripple + dt * 0.55;
      }
    }
    if (shiftFlash > 0) shiftFlash = Math.max(0, shiftFlash - dt * 1.6);
    const visible = finished ? [] : draw(now, dt);

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
          if (!p.foundAt) p.foundAt = now;
          // Işık, aynaya yaklaştıkça güçlenir; asıl geçiş içine yürüyünce olur.
          p.bloom = Math.min(1, p.bloom + dt * 2.2);
          if (!holdAtMirror && pushingIntoGiant(p)) {
            if (chapter.returnTrip) {
              phase = "donus";
              els.objective.textContent = I18n.t("doorObjective");
              p.foundAt = 0;
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
    if (k === "f") tamEkranDegistir();
    if (k === "Escape" && document.body.classList.contains("sinema")) tamEkranKapat();
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

  const SONSUZ_KEY = "dev-aynasi:sonsuz-rekor";
  function kaydetSonsuzRekor() {
    try {
      const eski = Number(localStorage.getItem(SONSUZ_KEY) || 0);
      if (endlessCount > eski) localStorage.setItem(SONSUZ_KEY, String(endlessCount));
    } catch (err) {
      /* depolama kapalıysa sessizce geç */
    }
  }
  function sonsuzRekor() {
    try {
      return Number(localStorage.getItem(SONSUZ_KEY) || 0);
    } catch (err) {
      return 0;
    }
  }

  function begin(isDuel, nextSeed, bolum = 0, sonsuz = false) {
    tamEkranAc();
    endless = sonsuz;
    endlessCount = 0;
    duel = isDuel;
    chapterIndex = Math.min(bolum, CHAPTERS.length - 1);
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
  const startEndless = () => begin(false, randomSeed(), 0, true);
  function restart() {
    if (!running && els.intro.hidden === false) return;
    // Sonsuz modda "yeni salon" seriyi bitirir: skor ekranı çıkar, oyuncu
    // oradan yeni seriye başlar. Seri sessizce kaybolmaz.
    if (endless && !finished) {
      finish(players[0], performance.now());
      return;
    }
    begin(duel, randomSeed(), 0, endless);
  }

  els.enterSolo.addEventListener("click", startSolo);
  els.enterDuel.addEventListener("click", startDuel);
  els.enterEndless.addEventListener("click", startEndless);
  // --- ayarlar penceresi ---
  function bolumListesiKur() {
    els.roomPicker.textContent = "";
    I18n.chapters().forEach((b, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "room";
      btn.textContent = b.name;
      btn.disabled = i > acilan;
      btn.classList.toggle("active", i === chapterIndex);
      btn.addEventListener("click", () => {
        if (i > acilan) return;
        chapterIndex = i;
        begin(duel, randomSeed(), i);
        ayarlariKapat();
      });
      els.roomPicker.appendChild(btn);
    });
  }
  function ayarlariAc() {
    els.brightness.value = String(ayarlar.parlaklik);
    els.reduceMotion.checked = !!ayarlar.azHareket;
    els.version.textContent = SURUM;
    bolumListesiKur();
    els.settings.hidden = false;
  }
  const ayarlariKapat = () => { els.settings.hidden = true; };
  // Oyun alanına tamamen girme: sayfa arayüzü küçülür, tuval ekranı kaplar
  // ve tarayıcı tam ekrana geçer (tam ekran isteği reddedilirse sinematik
  // yerleşim yine de uygulanır).
  function tamEkranAc() {
    document.body.classList.add("sinema");
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
    resize();
  }
  function tamEkranKapat() {
    document.body.classList.remove("sinema");
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    resize();
  }
  function tamEkranDegistir() {
    if (document.body.classList.contains("sinema")) tamEkranKapat();
    else tamEkranAc();
  }
  els.fsBtn.addEventListener("click", tamEkranDegistir);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) document.body.classList.remove("sinema");
    resize();
  });

  els.settingsBtn.addEventListener("click", ayarlariAc);
  els.settingsClose.addEventListener("click", ayarlariKapat);
  els.brightness.addEventListener("input", () => {
    ayarlar.parlaklik = Number(els.brightness.value);
    ayarlariKaydet();
  });
  els.reduceMotion.addEventListener("change", () => {
    ayarlar.azHareket = els.reduceMotion.checked;
    ayarlariKaydet();
  });
  els.privacyBtn.addEventListener("click", () => {
    els.privacyText.innerHTML = I18n.t("privacyBody");
    els.privacy.hidden = false;
  });
  els.privacyClose.addEventListener("click", () => { els.privacy.hidden = true; });

  function refreshLanguage() {
    I18n.apply();
    els.langBtn.textContent = I18n.lang === "tr" ? "EN" : "TR";
    els.chapter.textContent = chapterText().name;
    els.objective.textContent = phase === "donus" ? I18n.t("doorObjective") : chapterText().objective;
    els.cardTitle.textContent = chapterText().name;
    els.cardText.textContent = chapterText().card;
    document.title = I18n.t("title");
  }
  els.langBtn.addEventListener("click", () => {
    I18n.toggle();
    refreshLanguage();
    if (!els.settings.hidden) bolumListesiKur();
  });
  els.hintBtn.addEventListener("click", () => useHint(players[0]));
  els.restart.addEventListener("click", restart);
  els.againBtn.addEventListener("click", () => begin(duel, randomSeed(), 0, endless));
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
  refreshLanguage();
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
      // Ters Salon'da yatay tuşlar aynalanır; testin doğru tuşu basması için
      // burada da çevrilir.
      const yatayTus = (t) => (chapter.mirrorControls ? (t === "a" ? "d" : "a") : t);
      if (giant.horizontal) {
        p.x = g.ax + CELL / 2;
        const disarida = giant.y >= size;
        p.y = g.ay + (disarida ? -CELL * 0.45 : CELL * 0.45);
        return disarida ? "s" : "w";
      }
      p.y = g.ay + CELL / 2;
      const disarida = giant.x >= size;
      p.x = g.ax + (disarida ? -CELL * 0.45 : CELL * 0.45);
      return yatayTus(disarida ? "d" : "a");
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
    setLang(l) { I18n.set(l); refreshLanguage(); },
    lang: () => I18n.lang,
    giantPos: () => ({ ...giantSeg }),
    band: () => bandOfRoom,
    endlessInfo: () => ({ endless, count: endlessCount }),
    echoPos: () => (echo ? { x: echo.x, y: echo.y } : null),
    placeEchoNear(dx = 90, dy = -30) {
      if (!echo) return false;
      echo.x = players[0].x + dx;
      echo.y = players[0].y + dy;
      return true;
    },
    mirrorCount: () => mirrorCount,
    wallsHash: () => maze.hWalls.flat().concat(maze.vWalls.flat()).reduce((a, v, i) => a + (v ? i % 97 : 0), 0),
    forceShift() { nextShift = performance.now() - 1; },
    state: () => ({
      chapter: endless ? `${I18n.t("endless")} · ${endlessCount + 1}` : chapterText().name, seed, duel, phase, mirrors: mirrorCount,
      decoys: decoys.size, seen: players.reduce((n, p) => n + p.seen.size, 0),
      finished: !!finished, winner: finished ? finished.winner.label : null,
    }),
  };
})();
