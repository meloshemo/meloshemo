// Dev Aynası - prosedürel ses (telifsiz, dosyasız: her şey Web Audio ile üretilir)
//
// Üç katman:
//   1) Salonun uğultusu - alçak, sürekli drone
//   2) Kalp atışı - dev aynaya yaklaştıkça hızlanır ve yükselir (ipucu görevi görür)
//   3) Olaylar - dev aynayı bulma çınlaması, sahte aynada cam çatlaması, aynadan geçiş
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Sound = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "dev-aynasi:ses";
  let ctx = null;
  let master = null;
  let drone = null;
  let enabled = true;
  let proximity = 0;      // 0 uzak, 1 dev aynanın dibinde
  let nextBeat = 0;
  let beatTimer = null;
  let lastCrack = 0;

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
    g.gain.value = 0.05;
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
    hg.gain.value = 0.012;
    hiss.connect(hf).connect(hg).connect(master);
    hiss.start();
    drone = { g, hg };

    beatTimer = setInterval(tickBeat, 40);
  }

  // Kalp atışı: yakınlık arttıkça hem hızlanır hem yükselir.
  function tickBeat() {
    if (!ctx || proximity <= 0.02) return;
    const now = ctx.currentTime;
    if (now < nextBeat) return;
    const bpm = 58 + proximity * 78;              // 58 -> 136 vuruş/dk
    const aralik = 60 / bpm;
    nextBeat = now + aralik;
    thump(now, 0.055 + proximity * 0.16);
    thump(now + aralik * 0.32, 0.03 + proximity * 0.1);
  }

  function thump(at, level) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(78, at);
    osc.frequency.exponentialRampToValueAtTime(38, at + 0.14);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(level, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.26);
    osc.connect(g).connect(master);
    osc.start(at);
    osc.stop(at + 0.3);
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

  // Sahte dev aynaya bakınca: kısa cam çatlaması
  function crack() {
    if (!ctx) return;
    const t = ctx.currentTime;
    if (t - lastCrack < 0.7) return;
    lastCrack = t;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.25);
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.25);
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
    // 0 (uzak) ile 1 (dev aynanın dibinde) arasında
    setProximity(v) {
      proximity = Math.max(0, Math.min(1, v));
      if (drone) drone.hg.gain.value = 0.012 + proximity * 0.03;
    },
    discovery, crack, through, resolve,
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
