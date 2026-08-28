// Dev Aynası - çevrimiçi yarış istemcisi (tarayıcı tarafı)
//
// Kullanımı (game.js içine bağlarken):
//   const net = Net.connect("ws://localhost:8787", { kod: "1234", ad: "Melih" });
//   net.on("salon", (s) => { /* s.tohum, s.boyut, s.decoys ile odayı kur */ });
//   net.on("durum", (d) => { /* d.kisiler: diğer oyuncuların konumu ve rengi */ });
//   net.on("gecti", (b) => { /* b.ad aynayı buldu, b.sira kaçıncı */ });
//   net.on("sayac", (s) => { /* s.kalan saniye: 60 / 30 / 10 uyarıları */ });
//   net.on("isaret", (i) => { /* son 45 sn: i.bolge = aynanın kaba bölgesi */ });
//   net.on("sureBitti", (e) => { /* süre doldu, e.ad elendi */ });
//   net.on("elendi", (e) => { /* e.ad bu turda elendi */ });
//   net.on("tur", (t) => { /* yeni tur: t.tur, t.kalan, t.sure, t.tohum ... */ });
//   oyun döngüsünde: net.konum(player.x, player.y);
//
// Diğer oyuncular ekranda kendi renkleriyle çizilir; sunucudan saniyede 20
// paket geldiği için aradaki kareler yumuşatılarak (lerp) gösterilir.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Net = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const SEND_HZ = 20;

  function connect(url, opts = {}) {
    const listeners = new Map();
    const uzaktakiler = new Map(); // id -> { x, y, hedefX, hedefY, renk }
    let ws = null;
    let benim = null;
    let sonGonderim = 0;
    let kapandi = false;

    const emit = (type, data) => (listeners.get(type) || []).forEach((fn) => fn(data));

    function ac() {
      ws = new WebSocket(url);
      ws.addEventListener("open", () => {
        ws.send(JSON.stringify({ type: "katil", kod: opts.kod || "genel", ad: opts.ad || "Oyuncu" }));
        emit("acildi", {});
      });
      ws.addEventListener("message", (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch (err) {
          return;
        }
        if (msg.type === "hosgeldin") benim = msg.benim;
        if (msg.type === "durum") {
          for (const k of msg.kisiler) {
            if (k.id === benim) continue;
            const mevcut = uzaktakiler.get(k.id);
            if (mevcut) {
              mevcut.hedefX = k.x;
              mevcut.hedefY = k.y;
              mevcut.renk = k.renk;
              mevcut.sure = k.sure;
            } else {
              uzaktakiler.set(k.id, { x: k.x, y: k.y, hedefX: k.x, hedefY: k.y, renk: k.renk, sure: k.sure });
            }
          }
          for (const id of [...uzaktakiler.keys()]) {
            if (!msg.kisiler.some((k) => k.id === id)) uzaktakiler.delete(id);
          }
        }
        emit(msg.type, msg);
      });
      ws.addEventListener("close", () => {
        emit("kapandi", {});
        // Bağlantı koparsa üç saniyede bir yeniden dener.
        if (!kapandi) setTimeout(ac, 3000);
      });
    }
    ac();

    return {
      on(type, fn) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(fn);
      },
      hazir() {
        if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "hazir" }));
      },
      konum(x, y) {
        const now = performance.now();
        if (now - sonGonderim < 1000 / SEND_HZ) return;
        sonGonderim = now;
        if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: "konum", x, y }));
      },
      // Her karede çağır: paketler arası boşluğu yumuşatır.
      guncelle(dt) {
        for (const p of uzaktakiler.values()) {
          p.x += (p.hedefX - p.x) * Math.min(1, dt * 12);
          p.y += (p.hedefY - p.y) * Math.min(1, dt * 12);
        }
      },
      oyuncular: () => [...uzaktakiler.values()],
      benimId: () => benim,
      kapat() {
        kapandi = true;
        if (ws) ws.close();
      },
    };
  }

  return { connect };
});
