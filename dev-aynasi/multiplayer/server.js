#!/usr/bin/env node
// Dev Aynası - çevrimiçi yarış sunucusu
//
// Çalıştırmak için:
//   npm install ws
//   node multiplayer/server.js            (varsayılan port 8787)
//
// Tasarım kararı: salonu sunucu üretir, oyuncu konumlarını istemciler yollar.
// Aynayı "buldum" kararı da sunucuda verilir; istemci sadece konum bildirir.
// Böylece kimse kendi tarayıcısından sahte zafer gönderemez.

const http = require("http");
const { WebSocketServer } = require("ws");
const Maze = require("../maze.js");

const PORT = process.env.PORT || 8787;
const CELL = 72;
const TICK = 1000 / 20;          // sunucu saniyede 20 kez durum yayınlar
const LOOK = 132;                // aynada yansımanın belirdiği mesafe
const FOUND_MS = 1600;           // dev aynanın önünde durulması gereken süre
const LOBBY_WAIT = 5000;         // ilk oyuncudan sonra başlama sayacı
const MAX_SPEED = 260;           // birim/saniye - hız hilesi eşiği

// Oyuncu renkleri: 1. giren beyaz (sen), sonrakiler sırayla.
const COLORS = [
  { id: "beyaz", hex: "#f2eae0" },
  { id: "kirmizi", hex: "#ff5d6c" },
  { id: "mavi", hex: "#5db6ff" },
  { id: "yesil", hex: "#5ddba0" },
  { id: "mor", hex: "#b98cff" },
  { id: "turuncu", hex: "#ff9a4d" },
  { id: "turkuaz", hex: "#4fd8d0" },
  { id: "pembe", hex: "#ff7ec4" },
];

// Kaç kişi varsa salon o kadar büyür: bulma olasılığı düşer, yarış uzar.
// 1 kişi 40x40 (~1.6 bin ayna) ... 8 kişi 138x138 (~18 bin ayna).
// Bölüm ilerledikçe oda ayrıca %15 büyür.
const CHAPTERS = [
  { ad: "I · Aynalı Salon", decoyPay: 0 },
  { ad: "II · Aynanın İçinde", decoyPay: 14 },
  { ad: "III · Ters Salon", decoyPay: 16 },
  { ad: "IV · Kayan Aynalar", decoyPay: 18 },
  { ad: "V · Yankı", decoyPay: 20 },
  { ad: "VI · Kibir Odası", decoyPay: 24 },
  { ad: "VII · Paris", decoyPay: 26 },
  { ad: "VIII · Venedik", decoyPay: 24 },
  { ad: "IX · Tokyo", decoyPay: 30 },
  { ad: "X · New York", decoyPay: 28 },
  { ad: "XI · Kahire", decoyPay: 26 },
  { ad: "XII · İstanbul", decoyPay: 34 },
  { ad: "XIII · Londra", decoyPay: 28 },
  { ad: "XIV · Dubai", decoyPay: 32 },
  { ad: "XV · Rio", decoyPay: 30 },
  { ad: "XVI · Kaçan Ayna", decoyPay: 36 },
];

// Hedeflenen ayna sayısı: tek kişi ~1.600; her yeni oyuncu +3.400 ayna.
// Ayna sayısı ≈ 0.94 × kare sayısı olduğundan boyut buradan geri hesaplanır.
//   1 kişi  40×40   ~1.600      5 kişi 122×122 ~14.000
//   2 kişi  73×73   ~5.000      6 kişi 138×138 ~18.000
//   3 kişi  92×92   ~8.000      7 kişi 153×153 ~22.000
//   4 kişi 108×108 ~11.000      8 kişi 166×166 ~26.000
function roomSize(playerCount, chapter = 0) {
  const hedefAyna = 1600 + (playerCount - 1) * 3400;
  const taban = Math.round(Math.sqrt(hedefAyna / 0.94));
  return Math.min(190, Math.round(taban * (1 + chapter * 0.08)));
}
function decoyCount(playerCount, chapter = 0) {
  return CHAPTERS[chapter].decoyPay + playerCount * 6;
}

const rooms = new Map(); // kod -> oda

// Bir bölümün salonunu üretir. Her oyuncu kendi bölümünü ayrı bir salonda
// oynar: dev aynayı bulan oyuncu aynadan geçip bir sonraki salona girer,
// geride kalanlar kendi salonlarında aramaya devam eder.
// Oyuncular salonun farklı köşelerinden başlar; yolları kesişsin diye
// başlangıçlar çevreye dağıtılır.
function spawnPoints(size, count) {
  const k = size - 1;
  const havuz = [
    { x: 0, y: 0 }, { x: k, y: k }, { x: k, y: 0 }, { x: 0, y: k },
    { x: k >> 1, y: 0 }, { x: k >> 1, y: k }, { x: 0, y: k >> 1 }, { x: k, y: k >> 1 },
  ];
  return havuz.slice(0, Math.max(1, count));
}

// Dev ayna yerleşimi iki tarzda olur:
//   adil  : bütün başlangıçlara yaklaşık eşit uzaklıkta (turların %70'i)
//   zalim : birine yakın, ötekine salonun ta öbür ucunda (%30) — bazı turlar
//           haksız olsun, kimse rahat etmesin
function cruelGiant(maze, spawns, seed) {
  const mesafeler = spawns.map((s) => Maze.distances(maze, s));
  let en = null;
  for (let deneme = 0; deneme < 40; deneme++) {
    const g = Maze.pickGiant(maze, spawns[deneme % spawns.length], seed + deneme * 23, "uzak");
    const cx = g.horizontal ? g.x : Math.min(g.x, maze.width - 1);
    const cy = g.horizontal ? Math.min(g.y, maze.height - 1) : g.y;
    const d = mesafeler.map((m) => m[cy * maze.width + cx]);
    if (d.some((v) => v < 0)) continue;
    const fark = Math.max(...d) - Math.min(...d);
    if (!en || fark > en.fark) en = { g, fark };
  }
  return en ? en.g : Maze.pickGiant(maze, spawns[0], seed, "uzak");
}

function fairGiant(maze, spawns, seed) {
  const mesafeler = spawns.map((s) => Maze.distances(maze, s));
  const adaylar = [];
  for (let deneme = 0; deneme < 40; deneme++) {
    const g = Maze.pickGiant(maze, spawns[deneme % spawns.length], seed + deneme * 17);
    const cx = g.horizontal ? g.x : Math.min(g.x, maze.width - 1);
    const cy = g.horizontal ? Math.min(g.y, maze.height - 1) : g.y;
    const d = mesafeler.map((m) => m[cy * maze.width + cx]).filter((v) => v >= 0);
    if (d.length !== spawns.length) continue;
    const ort = d.reduce((a, b) => a + b, 0) / d.length;
    const fark = Math.max(...d) - Math.min(...d);
    adaylar.push({ g, puan: fark - ort * 0.25 });   // fark küçük, mesafe büyük olsun
  }
  if (!adaylar.length) return Maze.pickGiant(maze, spawns[0], seed);
  adaylar.sort((a, b) => a.puan - b.puan);
  return adaylar[0].g;
}

function createHall(playerCount, chapter) {
  const seed = (Math.random() * 99999) | 0 || 1;
  const size = roomSize(playerCount, chapter);
  const maze = Maze.generate(size, size, seed);
  const spawns = spawnPoints(size, playerCount);
  const tarz = playerCount > 1 && Math.random() < 0.3 ? "zalim" : "adil";
  const giant = playerCount > 1
    ? (tarz === "zalim" ? cruelGiant(maze, spawns, seed) : fairGiant(maze, spawns, seed))
    : Maze.pickGiant(maze, spawns[0], seed);
  const mirrors = Maze.mirrors(maze);
  return {
    chapter, seed, size, maze, giant, spawns, tarz,
    mirrorCount: mirrors.length,
    decoys: pickDecoys(mirrors, giant, seed, decoyCount(playerCount, chapter)),
  };
}

function createRoom(code, playerCount) {
  return {
    code,
    halls: [createHall(playerCount, 0)],  // tur başına bir salon
    players: new Map(),                   // socket -> oyuncu
    state: "lobi",                        // lobi | yaris | bitti
    startAt: 0,
    tur: 0,                               // kaçıncı tur
    finishers: [],                        // bu turda dev aynayı bulanlar
    elenenler: [],                        // eleme sırası (ilk elenen başta)
  };
}

// Bir bölümün salonunu getirir, yoksa üretir.
function hallFor(room, chapter) {
  while (room.halls.length <= chapter) {
    room.halls.push(createHall(hayattakiler(room).length || room.players.size, room.halls.length));
  }
  return room.halls[chapter];
}

// DEV_AYNASI_TEST=1 ile çalıştırıldığında salon bilgisine dev aynanın yeri de
// eklenir. Yalnızca otomatik testler içindir; üretimde bu alan gönderilmez,
// aksi halde istemci aynayı doğrudan öğrenirdi.
const TEST_MODU = process.env.DEV_AYNASI_TEST === "1";

function hallInfo(room, chapter, oyuncu) {
  const h = hallFor(room, chapter);
  const sira = oyuncu ? oyuncu.spawnIndex % h.spawns.length : 0;
  const s = h.spawns[sira];
  return {
    bolum: chapter, bolumAdi: CHAPTERS[chapter].ad,
    tohum: h.seed, boyut: h.size, aynaSayisi: h.mirrorCount, decoys: h.decoys, tarz: h.tarz,
    baslangic: { x: (s.x + 0.5) * CELL, y: (s.y + 0.5) * CELL },
    ...(TEST_MODU ? { devAyna: h.giant } : {}),
  };
}

function pickDecoys(mirrors, giant, seed, count) {
  let s = (seed * 2654435761) >>> 0;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out = {};
  const shapes = [[1.45, 1.45], [1.9, 0.85], [0.72, 1.5], [0.6, 0.6], [2.2, 1.1]];
  let guard = 0;
  while (Object.keys(out).length < count && guard++ < 8000) {
    const seg = mirrors[Math.floor(rand() * mirrors.length)];
    if (seg.id === giant.id) continue;
    const sh = shapes[Math.floor(rand() * shapes.length)];
    out[seg.id] = { sx: sh[0], sy: sh[1] };
  }
  return out;
}

function giantCenter(room, chapter) {
  const g = hallFor(room, chapter).giant;
  return g.horizontal
    ? { x: g.x * CELL + CELL / 2, y: g.y * CELL }
    : { x: g.x * CELL, y: g.y * CELL + CELL / 2 };
}

function send(ws, type, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ type, ...data }));
}
function broadcast(room, type, data) {
  for (const ws of room.players.keys()) send(ws, type, data);
}

// Elenmemiş oyuncular
function hayattakiler(room) {
  return [...room.players.values()].filter((p) => !p.elendi);
}

// Bir turda son kalan elenir; kalanlarla yeni tur kurulur.
// 10 kişi girer, her turda biri elenir: 10 → 9 → 8 → ... → 1 kazanan.
function turKontrol(room) {
  const canli = hayattakiler(room);
  if (room.finishers.length < canli.length - (canli.length > 1 ? 1 : 0)) return;

  if (canli.length <= 1) return;

  const bulanIdler = new Set(room.finishers.map((f) => f.id));
  const gecKalan = canli.find((p) => !bulanIdler.has(p.id));
  if (gecKalan) {
    gecKalan.elendi = true;
    room.elenenler.push({ id: gecKalan.id, ad: gecKalan.ad, renk: gecKalan.renk, tur: room.tur + 1 });
    broadcast(room, "elendi", {
      id: gecKalan.id, ad: gecKalan.ad, renk: gecKalan.renk,
      tur: room.tur + 1, kalan: hayattakiler(room).length,
    });
  }

  const kalanlar = hayattakiler(room);
  if (kalanlar.length <= 1) {
    room.state = "bitti";
    const kazanan = kalanlar[0];
    broadcast(room, "bitti", {
      kazanan: kazanan ? { id: kazanan.id, ad: kazanan.ad, renk: kazanan.renk } : null,
      siralama: [
        ...(kazanan ? [{ id: kazanan.id, ad: kazanan.ad, renk: kazanan.renk, tur: room.tur + 1 }] : []),
        ...room.elenenler.slice().reverse(),
      ],
    });
    return;
  }

  // Yeni tur: kalan oyuncu sayısına göre yeni salon, herkes yeni köşesinde.
  room.tur++;
  room.finishers = [];
  room.halls[room.tur] = createHall(kalanlar.length, Math.min(room.tur, CHAPTERS.length - 1));
  const salon = room.halls[room.tur];
  kalanlar.forEach((p, i) => {
    p.spawnIndex = i;
    p.bolum = room.tur;
    p.sure = null;
    p.yakinlik = 0;
    const s = salon.spawns[i % salon.spawns.length];
    p.x = (s.x + 0.5) * CELL;
    p.y = (s.y + 0.5) * CELL;
  });
  room.startAt = Date.now() + 3000;
  for (const [sock, p] of room.players) {
    if (p.elendi) continue;
    send(sock, "tur", {
      tur: room.tur + 1, kalan: kalanlar.length, baslarAt: room.startAt,
      ...hallInfo(room, room.tur, p),
    });
  }
  broadcast(room, "oyuncular", { oyuncular: roster(room) });
}

function roster(room) {
  return [...room.players.values()].map((p) => ({
    id: p.id, ad: p.ad, renk: p.renk, hazir: p.hazir, bolum: p.bolum, sure: p.sure,
    elendi: !!p.elendi,
  }));
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end(`Dev Aynası sunucusu · ${rooms.size} oda açık\n`);
});
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  let room = null;
  let me = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      return;
    }

    // --- odaya katılma ---
    if (msg.type === "katil") {
      const code = String(msg.kod || "genel").slice(0, 12);
      room = rooms.get(code);
      if (!room) {
        room = createRoom(code, 1);
        rooms.set(code, room);
      }
      if (room.state !== "lobi") return send(ws, "hata", { sebep: "yaris_basladi" });
      if (room.players.size >= COLORS.length) return send(ws, "hata", { sebep: "oda_dolu" });

      const used = new Set([...room.players.values()].map((p) => p.renk.id));
      const renk = COLORS.find((c) => !used.has(c.id));
      me = {
        id: Math.random().toString(36).slice(2, 8),
        spawnIndex: room.players.size,
        ad: String(msg.ad || "Oyuncu").slice(0, 16),
        renk,
        x: CELL * 0.5, y: CELL * 0.5,
        hazir: false, sure: null,
        bolum: 0,             // oyuncunun bulunduğu bölüm
        yakinlik: 0,          // dev aynanın önünde geçirilen süre
        sonPaket: Date.now(),
      };
      room.players.set(ws, me);

      // Kişi sayısı değiştikçe ilk salon yeniden üretilir (lobi aşamasında).
      room.halls = [createHall(room.players.size, 0)];

      send(ws, "hosgeldin", { benim: me.id, renk: me.renk });
      // Her oyuncuya kendi başlangıç noktasıyla salon bilgisi gider.
      for (const [sock, kisi] of room.players) {
        send(sock, "salon", {
          kod: room.code, ...hallInfo(room, 0, kisi), oyuncular: roster(room),
        });
        const s = hallFor(room, 0).spawns[kisi.spawnIndex % hallFor(room, 0).spawns.length];
        kisi.x = (s.x + 0.5) * CELL;
        kisi.y = (s.y + 0.5) * CELL;
      }
      return;
    }

    if (!room || !me) return;

    // --- hazırım ---
    if (msg.type === "hazir") {
      me.hazir = true;
      broadcast(room, "oyuncular", { oyuncular: roster(room) });
      const hepsiHazir = [...room.players.values()].every((p) => p.hazir);
      if (hepsiHazir && room.state === "lobi") {
        room.state = "yaris";
        room.startAt = Date.now() + LOBBY_WAIT;
        broadcast(room, "baslangic", { baslarAt: room.startAt });
      }
      return;
    }

    // --- konum bildirimi ---
    if (msg.type === "konum" && room.state === "yaris" && !me.elendi) {
      const now = Date.now();
      const dt = Math.max(0.001, (now - me.sonPaket) / 1000);
      me.sonPaket = now;
      const nx = Number(msg.x);
      const ny = Number(msg.y);
      if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;
      // Hız hilesine karşı: bir pakette gidilebilecek mesafeyle sınırla.
      const limit = MAX_SPEED * dt + 8;
      const d = Math.hypot(nx - me.x, ny - me.y);
      if (d > limit) {
        const k = limit / d;
        me.x += (nx - me.x) * k;
        me.y += (ny - me.y) * k;
      } else {
        me.x = nx;
        me.y = ny;
      }

      // Dev aynanın önünde yeterince durduysa bulmuş sayılır - kararı sunucu verir.
      if (me.sure === null && now >= room.startAt) {
        const c = giantCenter(room, me.bolum);
        const yakin = Math.hypot(me.x - c.x, me.y - c.y) < LOOK * 0.8;
        me.yakinlik = yakin ? me.yakinlik + dt * 1000 : 0;
        if (me.yakinlik >= FOUND_MS) {
          me.yakinlik = 0;
          const gecen = (now - room.startAt) / 1000;
          broadcast(room, "buldu", {
            id: me.id, ad: me.ad, renk: me.renk, bolum: me.bolum,
            bolumAdi: CHAPTERS[me.bolum].ad, sure: gecen,
          });

          me.sure = gecen;
          room.finishers.push({ id: me.id, ad: me.ad, renk: me.renk, sure: gecen });
          broadcast(room, "gecti", {
            id: me.id, ad: me.ad, renk: me.renk, sure: gecen,
            sira: room.finishers.length, kalan: hayattakiler(room).length,
          });
          turKontrol(room);
        }
      }
      return;
    }
  });

  ws.on("close", () => {
    if (!room) return;
    room.players.delete(ws);
    if (room.players.size === 0) {
      rooms.delete(room.code);
      return;
    }
    broadcast(room, "oyuncular", { oyuncular: roster(room) });
    // Biri ayrılınca tur kilitlenmesin: kalanlarla kontrol et.
    if (room.state === "yaris") turKontrol(room);
  });
});

// Durum yayını: herkesin konumu, saniyede 20 kez.
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.state !== "yaris") continue;
    // Herkes yalnızca kendi bölümündeki oyuncuları görür.
    for (const [ws, me] of room.players) {
      const kisiler = [...room.players.values()]
        .filter((p) => p.bolum === me.bolum)
        .map((p) => ({ id: p.id, x: Math.round(p.x), y: Math.round(p.y), renk: p.renk.hex, bolum: p.bolum }));
      send(ws, "durum", { t: Date.now(), kisiler });
    }
  }
}, TICK);

server.listen(PORT, () => {
  console.log(`Dev Aynası sunucusu hazır: ws://localhost:${PORT}`);
});
