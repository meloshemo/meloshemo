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

// Oyuncu sayısı arttıkça salon büyür: bulma olasılığı düşer, yarış uzar.
// 1 kişi 40x40 (~1.6 bin ayna), 8 kişi 72x72 (~5 bin ayna).
function roomSize(playerCount) {
  return Math.min(72, 40 + (playerCount - 1) * 5);
}
function decoyCount(playerCount) {
  return 8 + playerCount * 6;
}

const rooms = new Map(); // kod -> oda

function createRoom(code, playerCount) {
  const seed = (Math.random() * 99999) | 0 || 1;
  const size = roomSize(playerCount);
  const maze = Maze.generate(size, size, seed);
  const giant = Maze.pickGiant(maze, { x: 0, y: 0 }, seed);
  const mirrors = Maze.mirrors(maze);
  const decoys = pickDecoys(mirrors, giant, seed, decoyCount(playerCount));
  return {
    code, seed, size, maze, giant,
    mirrorCount: mirrors.length,
    decoys,
    players: new Map(),   // socket -> oyuncu
    state: "lobi",        // lobi | yaris | bitti
    startAt: 0,
    finishers: [],
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

function giantCenter(room) {
  const g = room.giant;
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
    id: p.id, ad: p.ad, renk: p.renk, hazir: p.hazir, sure: p.sure,
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
        ad: String(msg.ad || "Oyuncu").slice(0, 16),
        renk,
        x: CELL * 0.5, y: CELL * 0.5,
        hazir: false, sure: null,
        yakinlik: 0,          // dev aynanın önünde geçirilen süre
        sonPaket: Date.now(),
      };
      room.players.set(ws, me);

      // Oyuncu sayısı değiştikçe salon yeniden üretilir (lobi aşamasında).
      const yeni = createRoom(code, room.players.size);
      Object.assign(room, {
        seed: yeni.seed, size: yeni.size, maze: yeni.maze, giant: yeni.giant,
        mirrorCount: yeni.mirrorCount, decoys: yeni.decoys,
      });

      send(ws, "hosgeldin", { benim: me.id, renk: me.renk });
      broadcast(room, "salon", {
        kod: room.code, tohum: room.seed, boyut: room.size,
        aynaSayisi: room.mirrorCount, decoys: room.decoys,
        oyuncular: roster(room),
      });
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
        const c = giantCenter(room);
        const yakin = Math.hypot(me.x - c.x, me.y - c.y) < LOOK * 0.8;
        me.yakinlik = yakin ? me.yakinlik + dt * 1000 : 0;
        if (me.yakinlik >= FOUND_MS) {
          me.sure = (now - room.startAt) / 1000;
          room.finishers.push({ id: me.id, ad: me.ad, renk: me.renk, sure: me.sure });
          broadcast(room, "buldu", {
            id: me.id, ad: me.ad, renk: me.renk, sure: me.sure,
            sira: room.finishers.length,
          });
          if (room.finishers.length === room.players.size) {
            room.state = "bitti";
            broadcast(room, "bitti", { siralama: room.finishers });
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
    const kisiler = [...room.players.values()].map((p) => ({
      id: p.id, x: Math.round(p.x), y: Math.round(p.y), renk: p.renk.hex, sure: p.sure,
    }));
    broadcast(room, "durum", { t: Date.now(), kisiler });
  }
}, TICK);

server.listen(PORT, () => {
  console.log(`Dev Aynası sunucusu hazır: ws://localhost:${PORT}`);
});
