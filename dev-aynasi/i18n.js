// Dev Aynası - dil desteği (Türkçe / English)
// Tarayıcı dili Türkçe ise TR, değilse EN ile açılır; seçim saklanır.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.I18n = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const KEY = "dev-aynasi:dil";

  const S = {
    tr: {
      eyebrow: "Bir deyim oyunu",
      title: "Dev Aynası",
      lede: 'Binlerce ayna, hepsi aynı. <em>Yalnızca biri</em> seni devasa gösteriyor.',
      chapter: "Bölüm", time: "Süre", seen: "Bakılan ayna", hint: "Sezgi", duel: "Düello",
      objective: "Hedef",
      soundOn: "Ses açık", soundOff: "Ses kapalı",
      hintBtn: "Sezgi · H", newRoom: "Yeni salon · R",
      introTitle: "Salona giriyorsun",
      introText: "Fenerin nereye yetiyorsa orayı görürsün. Dev aynayı bul.",
      solo: "Tek başına gir", duelBtn: "Düello · iki kişi",
      keys: "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> yürü · <kbd>Shift</kbd> koş · <kbd>H</kbd> sezgi<br />Düello: 2. oyuncu yön tuşları + <kbd>M</kbd>",
      codeLabel: "Salon kodu", codePlaceholder: "örn. 4821", codeApply: "Aç",
      through: "Aynanın içinden geçtin",
      ledgerTime: "Süre", ledgerSeen: "Baktığın ayna", ledgerBest: "En iyi süren",
      again: "Baştan oyna", roomCode: "Salon kodu:",
      helpWalk: "yürü", helpRun: "koş", helpHint: "sezgi", helpNew: "yeni salon", helpSound: "ses",
      player: "OYUNCU",
      doorObjective: "Pirinç kapıya dön",
      echoHit: "Yankı sana değdi — baştan",
      duelWin: (n) => `Oyuncu ${n} kazandı`,
      duelText: "Dev aynayı önce o buldu.",
      endTitle: "Kendine geldin",
      endText: "Kendini dev aynasında gördün — ve oradan kendine döndün.",
      chapters: [
        { name: "I · Aynalı Salon", objective: "Dev aynayı bul ve içine yürü", card: "Binlerce cam, hepsi birbirinin aynı." },
        { name: "II · Aynanın İçinde", objective: "Çarpık aynalar arasından gerçeğini bul", card: "Camlar soğuk, ışık cılız. Bazıları seni çarpıtıyor." },
        { name: "III · Ters Salon", objective: "Kontroller aynalandı — sola bastığında sağa gidersin", card: "Burada her şey ters. Sola bastığında sağa gidiyorsun." },
        { name: "IV · Kayan Aynalar", objective: "Salon yerinde durmuyor — aynalar yer değiştiriyor", card: "Duvarlar kayıyor. Ezberlediğin yol birazdan başka bir yer olacak." },
        { name: "V · Yankı", objective: "Yankın seni taklit ediyor — sana değerse başa dönersin", card: "Aynadan biri çıktı. Her adımını tersten tekrar ediyor; sana değmesin." },
        { name: "VI · Kibir Odası", objective: "Dev aynayı bul, sonra sönen ışıkla kapıya dön", card: "Her cam seni büyütmeye hazır. Aynayı bul, sonra kapıya dön — fener sönüyor." },
      ],
    },
    en: {
      eyebrow: "Hall of Giants · a game about a proverb",
      title: "Dev Aynası",
      lede: 'A thousand mirrors, all identical. <em>Only one</em> makes you a giant.',
      chapter: "Room", time: "Time", seen: "Mirrors seen", hint: "Hunch", duel: "Duel",
      objective: "Goal",
      soundOn: "Sound on", soundOff: "Sound off",
      hintBtn: "Hunch · H", newRoom: "New hall · R",
      introTitle: "You step into the hall",
      introText: "You see only as far as your lantern reaches. Find the giant mirror.",
      solo: "Enter alone", duelBtn: "Duel · two players",
      keys: "<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk · <kbd>Shift</kbd> run · <kbd>H</kbd> hunch<br />Duel: player 2 uses arrow keys + <kbd>M</kbd>",
      codeLabel: "Hall code", codePlaceholder: "e.g. 4821", codeApply: "Open",
      through: "You stepped through the mirror",
      ledgerTime: "Time", ledgerSeen: "Mirrors seen", ledgerBest: "Your best",
      again: "Play again", roomCode: "Hall code:",
      helpWalk: "walk", helpRun: "run", helpHint: "hunch", helpNew: "new hall", helpSound: "sound",
      player: "PLAYER",
      doorObjective: "Return to the brass door",
      echoHit: "The echo caught you — back to the start",
      duelWin: (n) => `Player ${n} wins`,
      duelText: "They found the giant mirror first.",
      endTitle: "You came back to yourself",
      endText: "You saw yourself as a giant — and found your way back.",
      chapters: [
        { name: "I · Hall of Mirrors", objective: "Find the giant mirror and walk into it", card: "A thousand panes, every one the same." },
        { name: "II · Inside the Mirror", objective: "Tell the real giant from the crooked ones", card: "The glass is cold, the light is thin. Some of it bends you." },
        { name: "III · Inverted Hall", objective: "Controls are mirrored — press left, go right", card: "Everything is reversed here. Press left and you go right." },
        { name: "IV · Shifting Mirrors", objective: "The hall will not hold still — the mirrors move", card: "The walls are sliding. The path you memorised is about to be elsewhere." },
        { name: "V · The Echo", objective: "Your echo mirrors you — if it touches you, you start over", card: "Something stepped out of the glass. It repeats every move of yours, reversed." },
        { name: "VI · Room of Pride", objective: "Find the mirror, then reach the door as the light dies", card: "Every pane is ready to enlarge you. Find the mirror, then find the door — your lantern is fading." },
      ],
    },
  };

  let lang = "tr";
  try {
    const saved = localStorage.getItem(KEY);
    lang = saved === "tr" || saved === "en"
      ? saved
      : (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en";
  } catch (err) {
    lang = "tr";
  }

  const t = (key) => S[lang][key];

  // data-i18n taşıyan her öğeyi günceller. data-i18n-html varsa HTML olarak,
  // data-i18n-attr varsa o özniteliğe yazar.
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const val = S[lang][key];
      if (val === undefined) return;
      if (el.dataset.i18nAttr) el.setAttribute(el.dataset.i18nAttr, val);
      else if (el.dataset.i18nHtml !== undefined) el.innerHTML = val;
      else el.textContent = val;
    });
  }

  return {
    t,
    apply,
    chapters: () => S[lang].chapters,
    get lang() { return lang; },
    toggle() {
      lang = lang === "tr" ? "en" : "tr";
      try {
        localStorage.setItem(KEY, lang);
      } catch (err) {
        /* depolama kapalıysa sessizce geç */
      }
      apply();
      return lang;
    },
    set(l) {
      if (l === "tr" || l === "en") lang = l;
      apply();
      return lang;
    },
  };
});
