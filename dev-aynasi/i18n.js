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
      settings: "Ayarlar", settingsTitle: "Ayarlar",
      brightness: "Parlaklık", reduceMotion: "Hareketi azalt",
      rooms: "Odalar", roomsNote: "Yalnızca açtığın odalara geçebilirsin.",
      privacy: "Gizlilik", privacyTitle: "Gizlilik Politikası",
      close: "Kapat", version: "Sürüm",
      privacyBody: `
        <p><b>Bu oyun hiçbir kişisel veri toplamaz.</b> Hesap açmanız gerekmez,
        e-posta istemez, reklam ve analiz izleyicisi içermez.</p>
        <h3>Cihazınızda saklananlar</h3>
        <p>Yalnızca kendi tarayıcınızda kalır, bize ulaşmaz:</p>
        <ul>
          <li>Her odadaki en iyi süreniz</li>
          <li>Ses açık mı kapalı mı</li>
          <li>Dil, parlaklık ve hareket tercihiniz</li>
          <li>Hangi odaları açtığınız</li>
        </ul>
        <p>Tarayıcınızın site verilerini temizlediğinizde hepsi silinir.</p>
        <h3>Toplamadıklarımız</h3>
        <p>Ad, e-posta, telefon, adres, konum, cihaz kimliği, reklam kimliği,
        kişi listesi, fotoğraf, mikrofon ya da kamera — hiçbiri.</p>
        <h3>Çevrimiçi yarış</h3>
        <p>Çevrimiçi mod açıldığında yalnızca takma adınız, salon içindeki
        konumunuz ve süreniz sunucuya gider; oda boşalınca tamamen silinir.
        Veritabanı yoktur, IP adresi günlüğe yazılmaz.</p>
        <h3>Üçüncü taraflar</h3>
        <p>Yazı tipleri Google Fonts üzerinden yüklenir; bu istek sırasında IP
        adresiniz Google'a ulaşır ve Google'ın kendi politikasına tabidir.</p>
        <h3>İletişim</h3>
        <p>Osman Melih Yılmaz — y.osmanmelih@gmail.com</p>`,
      chapters: [
        { name: "I · Aynalı Salon", objective: "Dev aynayı bul ve içine yürü", card: "Binlerce cam, hepsi birbirinin aynı." },
        { name: "II · Aynanın İçinde", objective: "Çarpık aynalar arasından gerçeğini bul", card: "Camlar soğuk, ışık cılız. Bazıları seni çarpıtıyor." },
        { name: "III · Ters Salon", objective: "Kontroller aynalandı — sola bastığında sağa gidersin", card: "Burada her şey ters. Sola bastığında sağa gidiyorsun." },
        { name: "IV · Kayan Aynalar", objective: "Salon yerinde durmuyor — aynalar yer değiştiriyor", card: "Duvarlar kayıyor. Ezberlediğin yol birazdan başka bir yer olacak." },
        { name: "V · Yankı", objective: "Yankın seni taklit ediyor — sana değerse başa dönersin", card: "Aynadan biri çıktı. Her adımını tersten tekrar ediyor; sana değmesin." },
        { name: "VI · Kibir Odası", objective: "Kibrin en parlak odası — dev aynayı bul", card: "Her cam seni büyütmeye hazır. Aradığın hâlâ tek bir tanesi." },
        { name: "VII · Paris — Aynalar Galerisi", objective: "Açık galeride dev aynayı bul", card: "Versay'ın galerisi gibi: duvar yok, ışık geniş, saklanacak yer de yok." },
        { name: "VIII · Venedik — Su Basmış Salon", objective: "Suda ağır yürü, dalgayı izle", card: "Salonu su bastı. Yürümek ağır; beş saniyede bir yayılan dalga uzaktaki camları bir an aydınlatıyor." },
        { name: "IX · Tokyo — Neon", objective: "Yanıp sönmeyen tek aynayı bul", card: "Bütün camlar renk değiştiriyor. Dev ayna kıpırdamıyor — kalabalıkta duran tek şey o." },
        { name: "X · New York — Izgara", objective: "Caddeleri tara, her köşe birbirinin aynı", card: "Cadde ve sokaklar dümdüz. Koşmak serbest ama her köşe birbirinin aynı." },
        { name: "XI · Kahire — Kum Fırtınası", objective: "Görüş açılıp kapanıyor, sabırlı ol", card: "Kum havada. Görüşün sürekli daralıp açılıyor; fırtına dinince bak." },
        { name: "XII · İstanbul — Kapalıçarşı", objective: "Dev aynayı bul, sonra kapıya dön", card: "Uzun çarşı sokakları, en kalabalık ayna yığını. Dünyayı gezdin — şimdi kendine dön." },
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
      settings: "Settings", settingsTitle: "Settings",
      brightness: "Brightness", reduceMotion: "Reduce motion",
      rooms: "Rooms", roomsNote: "You can only enter rooms you have unlocked.",
      privacy: "Privacy", privacyTitle: "Privacy Policy",
      close: "Close", version: "Version",
      privacyBody: `
        <p><b>This game collects no personal data.</b> No account, no email, no
        advertising or analytics trackers.</p>
        <h3>Stored on your device</h3>
        <p>Kept in your own browser only; it never reaches us:</p>
        <ul>
          <li>Your best time in each room</li>
          <li>Whether sound is on or off</li>
          <li>Your language, brightness and motion preferences</li>
          <li>Which rooms you have unlocked</li>
        </ul>
        <p>Clearing your browser's site data deletes all of it.</p>
        <h3>What we never collect</h3>
        <p>Name, email, phone, address, location, device or advertising IDs,
        contacts, photos, microphone or camera — none of it.</p>
        <h3>Online race</h3>
        <p>In online mode only your nickname, your position in the hall and your
        time reach the server; everything is discarded when the room empties.
        There is no database and IP addresses are not logged.</p>
        <h3>Third parties</h3>
        <p>Fonts load from Google Fonts; that request exposes your IP address to
        Google under Google's own policy.</p>
        <h3>Contact</h3>
        <p>Osman Melih Yılmaz — y.osmanmelih@gmail.com</p>`,
      chapters: [
        { name: "I · Hall of Mirrors", objective: "Find the giant mirror and walk into it", card: "A thousand panes, every one the same." },
        { name: "II · Inside the Mirror", objective: "Tell the real giant from the crooked ones", card: "The glass is cold, the light is thin. Some of it bends you." },
        { name: "III · Inverted Hall", objective: "Controls are mirrored — press left, go right", card: "Everything is reversed here. Press left and you go right." },
        { name: "IV · Shifting Mirrors", objective: "The hall will not hold still — the mirrors move", card: "The walls are sliding. The path you memorised is about to be elsewhere." },
        { name: "V · The Echo", objective: "Your echo mirrors you — if it touches you, you start over", card: "Something stepped out of the glass. It repeats every move of yours, reversed." },
        { name: "VI · Room of Pride", objective: "The brightest room of pride — find the giant mirror", card: "Every pane is ready to enlarge you. Still, only one of them is the one." },
        { name: "VII · Paris — Gallery of Mirrors", objective: "Find the giant mirror in the open gallery", card: "Like the gallery at Versailles: no walls, wide light — and nowhere to hide." },
        { name: "VIII · Venice — The Flooded Hall", objective: "Wade slowly, watch for the wave", card: "The hall has flooded. Walking is heavy; every five seconds a wave spreads out and lights distant glass for a moment." },
        { name: "IX · Tokyo — Neon", objective: "Find the one mirror that does not flicker", card: "Every pane is changing colour. The giant mirror does not — it is the only still thing in the crowd." },
        { name: "X · New York — The Grid", objective: "Sweep the avenues; every corner looks the same", card: "Avenues and streets run dead straight. Run all you like — every corner is identical." },
        { name: "XI · Cairo — Sandstorm", objective: "Your sight narrows and widens; be patient", card: "Sand in the air. Your vision keeps closing and opening; look when the storm eases." },
        { name: "XII · Istanbul — The Grand Bazaar", objective: "Find the giant mirror, then return to the door", card: "Long bazaar lanes and the densest crowd of mirrors yet. You have seen the world — now find your way back." },
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
