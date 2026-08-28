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

// Dev ayna, bütün başlangıçlara yaklaşık eşit uzaklıkta olmalı: yarış adil
// olsun diye kimsenin kapısının önüne düşmez.
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
  const giant = playerCount > 1
    ? fairGiant(maze, spawns, seed)
    : Maze.pickGiant(maze, spawns[0], seed);
  const mirrors = Maze.mirrors(maze);
  return {
    chapter, seed, size, maze, giant, spawns,
    mirrorCount: mirrors.length,
    decoys: pickDecoys(mirrors, giant, seed, decoyCount(playerCount, chapter)),
  };
}

function createRoom(code, playerCount) {
  return {
    code,
    halls: [createHall(playerCount, 0)],  // bölüm başına bir salon
    players: new Map(),                   // socket -> oyuncu
    state: "lobi",                        // lobi | yaris | bitti
    startAt: 0,
    finishers: [],
  };
}

// Bir bölümün salonunu getirir, yoksa üretir.
function hallFor(room, chapter) {
  while (room.halls.length <= chapter) {
    room.halls.push(createHall(room.players.size, room.halls.length));
  }
  return room.halls[chapter];
}

function hallInfo(room, chapter, oyuncu) {
  const h = hallFor(room, chapter);
  const sira = oyuncu ? oyuncu.spawnIndex % h.spawns.length : 0;
  const s = h.spawns[sira];
  return {
    bolum: chapter, bolumAdi: CHAPTERS[chapter].ad,
    tohum: h.seed, boyut: h.size, aynaSayisi: h.mirrorCount, decoys: h.decoys,
    baslangic: { x: (s.x + 0.5) * CELL, y: (s.y + 0.5) * CELL },
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

function roster(room) {
  return [...room.players.values()].map((p) => ({
    id: p.id, ad: p.ad, renk: p.renk, hazir: p.hazir, bolum: p.bolum, sure: p.sure,
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
    if (msg.type === "konum" && room.state === "yaris") {
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

          if (me.bolum < CHAPTERS.length - 1) {
            // Aynadan geçer: kendi bir sonraki salonuna girer, diğerleri
            // kendi salonlarında aramaya devam eder.
            me.bolum++;
            const bilgi = hallInfo(room, me.bolum, me);
            me.x = bilgi.baslangic.x;
            me.y = bilgi.baslangic.y;
            send(ws, "bolum", { ...bilgi, sure: gecen });
            broadcast(room, "oyuncular", { oyuncular: roster(room) });
          } else {
            me.sure = gecen;
            room.finishers.push({ id: me.id, ad: me.ad, renk: me.renk, sure: me.sure });
            broadcast(room, "tamamladi", {
              id: me.id, ad: me.ad, renk: me.renk, sure: me.sure,
              sira: room.finishers.length,
            });
            if (room.finishers.length === room.players.size) {
              room.state = "bitti";
              broadcast(room, "bitti", { siralama: room.finishers });
            }
          }
        }
      }
      return;
    }
  });

  ws.on("close", () => {
    if (!room) return;
    room.players.delete(ws);
    if (room.players.size === 0) rooms.delete(room.code);
    else broadcast(room, "oyuncular", { oyuncular: roster(room) });
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
