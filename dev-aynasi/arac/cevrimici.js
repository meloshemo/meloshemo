// Dev Aynası — çevrimiçi turnuva denetimi.
//
// Sunucuyu gerçekten başlatır, botları gerçekten bağlar ve turnuvanın tek
// kazanana indiğini doğrular. Kural dosyasının birim testleri (test.js)
// sıralamanın matematiğini ölçer; buradaki denetim sunucunun o kuralları
// canlı bir oyunda uygulayıp uygulamadığını ölçer. İkisi ayrı şeydir:
// 1.9.3'te yakalanan hata tam buradaydı — sıralama matematiği doğruydu ama
// geri sayım sırasında katılan oyuncu turun kadrosuna yazılmıyor, tur dev
// ayna bulununca kapanmıyordu.
//
// Çalıştırma:  node arac/cevrimici.js [bot sayısı]
// Gereksinim:  npm install ws

const { spawn } = require("child_process");
const path = require("path");

const KOK = path.join(__dirname, "..");
const PORT = 8799;                 // denetim kendi portunda koşar
const CELL = 72;                   // sunucudaki kare boyu
const BOT = Number(process.argv[2] || 3);
const SURE = 420000;               // denetimin tamamı için üst sınır

let WebSocket;
try {
  WebSocket = require(path.join(KOK, "node_modules", "ws"));
} catch (err) {
  console.error("ws bulunamadı. Önce: npm install ws");
  process.exit(1);
}

const bulgular = [];
let gecenler = 0, basarisiz = 0;
function yaz(ad, gecti, not = "") {
  console.log(`${gecti ? "✅" : "❌"} ${ad}${not ? " — " + not : ""}`);
  gecti ? gecenler++ : basarisiz++;
}

// --- sunucu ---
const sunucu = spawn("node", ["multiplayer/server.js"], {
  cwd: KOK,
  env: { ...process.env, DEV_AYNASI_TEST: "1", PORT: String(PORT) },
  stdio: ["ignore", "ignore", "inherit"],
});
function bitir(kod) {
  sunucu.kill();
  process.exit(kod);
}

// --- botlar ---
// Her bot dev aynaya doğru düz yürür; hızları farklı olsun ki eleme ve
// sıralama gerçekten çalışsın. Duvarları yok sayar: sunucu duvar denetimi
// yapmaz, yalnızca hız sınırı uygular ve denetlenen şey turnuva akışıdır.
const olaylar = [];
const gorulen = new Set();
function olay(s) { if (!gorulen.has(s)) { gorulen.add(s); olaylar.push(s); } }

let sonuc = null;
let aynaSayisi = 0;
const esitlikler = [];

function bot(i) {
  const hiz = 250 * (0.55 + 0.45 * ((i * 7) % BOT) / BOT);
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
  let hedef = null, p = null, son = Date.now(), timer = null;

  ws.on("open", () => ws.send(JSON.stringify({ type: "katil", ad: "B" + i, kod: "denetim" })));
  ws.on("error", (e) => { console.error("bağlantı hatası:", e.message); bitir(1); });
  ws.on("message", (raw) => {
    const m = JSON.parse(raw);

    if (m.type === "salon" || m.type === "tur") {
      if (!m.devAyna) { console.error("devAyna gelmedi — sunucu DEV_AYNASI_TEST=1 ile mi koşuyor?"); bitir(1); }
      aynaSayisi = Math.max(aynaSayisi, m.aynaSayisi || 0);
      const g = m.devAyna;
      hedef = g.horizontal
        ? { x: g.x * CELL + CELL / 2, y: g.y * CELL }
        : { x: g.x * CELL, y: g.y * CELL + CELL / 2 };
      p = { x: m.baslangic.x, y: m.baslangic.y };
      son = Date.now();
      ws.send(JSON.stringify({ type: "hazir" }));
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!p || !hedef || ws.readyState !== 1) return;
        const now = Date.now(), dt = (now - son) / 1000; son = now;
        const dx = hedef.x - p.x, dy = hedef.y - p.y, d = Math.hypot(dx, dy);
        if (d > 0.5) {
          const adim = Math.min(d, hiz * dt);
          p.x += (dx / d) * adim;
          p.y += (dy / d) * adim;
        }
        ws.send(JSON.stringify({ type: "konum", x: p.x, y: p.y }));
      }, 50);
    }

    if (m.type === "gecti") {
      olay(`geçti  ${m.ad} · sıra ${m.sira} · ${m.sure.toFixed(1)} sn` + (m.esitler > 1 ? ` · ${m.esitler} kişi eşit` : ""));
      if (m.esitler > 1) esitlikler.push(m.sira);
    }
    if (m.type === "elendi") olay(`elendi ${m.ad}`);
    if (m.type === "beraberlik") olay(`beraberlik turu: ${(m.oyuncular || []).map((o) => o.ad).join(" = ")}`);
    if (m.type === "bitti" && !sonuc) {
      sonuc = m;
      setTimeout(degerlendir, 200);
    }
  });
}

function degerlendir() {
  console.log("\n--- turnuva akışı ---");
  console.log(olaylar.join("\n"));
  console.log("\n--- denetim ---");

  const siralama = sonuc.siralama || [];
  const adlar = siralama.map((x) => x.ad);

  yaz("turnuva tek kazanana indi",
    !!sonuc.kazanan,
    sonuc.kazanan ? `kazanan ${sonuc.kazanan.ad}` : "kazanan yok");

  yaz("dev ayna bulmak turu bitiriyor",
    olaylar.some((s) => s.startsWith("elendi")),
    "eleme yalnızca süre dolunca değil, bulunca da oluyor");

  yaz("herkes sıralamada yer aldı",
    new Set(adlar).size === BOT,
    `${new Set(adlar).size}/${BOT} oyuncu listede: ${adlar.join(" · ")}`);

  yaz("salon oyuncu başına büyüdü",
    aynaSayisi >= BOT * 4500,
    `${BOT} kişi → ${aynaSayisi.toLocaleString("tr-TR")} ayna (beklenen ≥ ${(BOT * 4500).toLocaleString("tr-TR")})`);

  yaz("eleme sayısı oyuncu sayısıyla tutarlı",
    olaylar.filter((s) => s.startsWith("elendi")).length === BOT - 1,
    `${olaylar.filter((s) => s.startsWith("elendi")).length} eleme, beklenen ${BOT - 1}`);

  console.log(`\n${gecenler}/${gecenler + basarisiz} denetim geçti.`);
  if (esitlikler.length) console.log(`(bu koşuda ${esitlikler.length} eşit bitiş görüldü — paylaşılan sıra kuralı iş başındaydı)`);
  bitir(basarisiz ? 1 : 0);
}

setTimeout(() => {
  console.log(olaylar.join("\n"));
  console.error(`\n❌ ZAMAN AŞIMI: turnuva ${SURE / 1000} sn'de bitmedi.`);
  bitir(1);
}, SURE);

setTimeout(() => {
  for (let i = 0; i < BOT; i++) setTimeout(() => bot(i), i * 120);
}, 1500);
