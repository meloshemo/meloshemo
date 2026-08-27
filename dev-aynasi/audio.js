// Dev Aynası - prosedürel ses (telifsiz, dosyasız: her şey Web Audio ile üretilir)
//
// Sadece iki katman kaldı:
//   1) Salonun uğultusu - alçak, sabit, ipucu vermez
//   2) Olaylar - aynadan geçiş ve oyun sonu
// Yaklaştıkça yükselen kalp atışı kaldırıldı: oyuncuya ipucu veriyordu.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Sound = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "dev-aynasi:ses";
  let ctx = null;
  let master = null;
  let drone = null;
  let enabled = true;

  try {
    enabled = localStorage.getItem(KEY) !== "kapali";
  } catch (err) {
    enabled = true;
  }

  function noiseBuffer(sec) {
    const n = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Tarayıcılar sesi ancak kullanıcı bir şeye bastıktan sonra başlatır.
  function start() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    master.connect(ctx.destination);

    // Salonun uğultusu: iki hafif kaydırılmış alçak dalga + karanlık filtre
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    const g = ctx.createGain();
    g.gain.value = 0.035;
    filter.connect(g).connect(master);
    for (const [freq, detune] of [[55, -6], [82.5, 8], [110, 3]]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const og = ctx.createGain();
      og.gain.value = freq > 100 ? 0.25 : 0.6;
      osc.connect(og).connect(filter);
      osc.start();
    }
    // Camların uzaktan fısıltısı: çok kısık, süzülmüş gürültü
    const hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuffer(4);
    hiss.loop = true;
    const hf = ctx.createBiquadFilter();
    hf.type = "bandpass";
    hf.frequency.value = 1800;
    hf.Q.value = 0.7;
    const hg = ctx.createGain();
    hg.gain.value = 0.008;
    hiss.connect(hf).connect(hg).connect(master);
    hiss.start();
    drone = { g, hg };

  }

  // Dev aynayı bulma: uzun, altın bir çınlama
  function discovery() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 784, 1046.5, 1568].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i > 1 ? "sine" : "triangle";
      osc.frequency.value = f;
      const at = t + i * 0.06;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.17 / (i + 1), at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + 2.8);
    });
  }

  // Aynadan geçiş: aşağı doğru süzülen bir uğultu
  function through() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 1.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.14, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 1.4);
  }

  // Kapıdan çıkış / oyun sonu
  function resolve() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [392, 523.25, 659.25].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const at = t + i * 0.18;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.12, at + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 1.8);
      osc.connect(g).connect(master);
      osc.start(at);
      osc.stop(at + 2);
    });
  }

  return {
    start,
    discovery, through, resolve,
    toggle() {
      enabled = !enabled;
      if (master) master.gain.value = enabled ? 0.9 : 0;
      try {
        localStorage.setItem(KEY, enabled ? "acik" : "kapali");
      } catch (err) {
        /* depolama kapalıysa sessizce geç */
      }
      return enabled;
    },
    isOn: () => enabled,
  };
});
