// Dev Aynası - labirent üretimi (tarayıcı ve Node için ortak)
// Duvarların tamamı aynadır; oyun bu duvar parçalarını "ayna" olarak sayar.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Maze = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Aynı tohum aynı odayı üretsin diye küçük bir sözde rastgele üreteç.
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function next() {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  // hWalls[y][x]: (x, y-1) ile (x, y) arasındaki yatay duvar  (y: 0..h)
  // vWalls[y][x]: (x-1, y) ile (x, y) arasındaki dikey duvar   (x: 0..w)
  // Doku ayarları — labirentin ne kadar "okunaklı" olduğunu belirler:
  //
  //   duzluk : 0..1. Kazıcı aynı yönde devam etmeyi ne kadar tercih eder.
  //            Yüksekse uzun düz koridorlar çıkar; oyuncu nerede olduğunu
  //            kolayca kestirir. Düşükse koridorlar sürekli kıvrılır ve
  //            zihinsel harita tutmak zorlaşır.
  //   ekstra : fazladan sökülen duvar oranı. Yüksekse salon halka halka
  //            dolaşılır (çıkmaz azdır); düşükse çıkmaz sokaklar artar ve
  //            her yanlış dönüş geri dönüş demektir.
  //   maxDuz : bir koridorun kesintisiz uzayabileceği en fazla kare. Bu
  //            olmadan kazıcı otuz kare dümdüz gidebiliyordu; oyuncu için
  //            bu, hiçbir şeyin olmadığı on saniyelik bir yürüyüş demek.
  //   odacik : bin kare başına açılacak küçük salon sayısı. Koridordan
  //            çıkıp iki üç kare genişliğinde bir aynalı odacığa girmek
  //            ritmi kırar; odacığın ağzı da doğal bir kıskaç olur.
  //   agiz   : bir odacığın kaç kapısı olacağı (en az / en çok).
  const VARSAYILAN_DOKU = { duzluk: 0.5, ekstra: 0.06, maxDuz: 5, odacik: 3, agiz: [2, 3] };

  function generate(width, height, seed, doku) {
    const { duzluk, ekstra, maxDuz, odacik, agiz } = { ...VARSAYILAN_DOKU, ...(doku || {}) };
    const rand = rng(seed);
    const hWalls = [];
    for (let y = 0; y <= height; y++) hWalls.push(new Array(width).fill(true));
    const vWalls = [];
    for (let y = 0; y < height; y++) vWalls.push(new Array(width + 1).fill(true));

    const visited = new Array(width * height).fill(false);
    const stack = [{ x: 0, y: 0 }];
    visited[0] = true;

    while (stack.length) {
      const cur = stack[stack.length - 1];
      const options = [];
      if (cur.y > 0 && !visited[(cur.y - 1) * width + cur.x]) options.push("N");
      if (cur.y < height - 1 && !visited[(cur.y + 1) * width + cur.x]) options.push("S");
      if (cur.x > 0 && !visited[cur.y * width + cur.x - 1]) options.push("W");
      if (cur.x < width - 1 && !visited[cur.y * width + cur.x + 1]) options.push("E");
      if (!options.length) {
        stack.pop();
        continue;
      }
      // Düzlük: mümkünse önceki yönde devam et. Kazıcının yönü labirentin
      // dokusunu belirler; bu yüzden yön seçimi tohuma bağlı kalır.
      let dir;
      // Aynı yönde maxDuz kare gidildiyse artık dönmek zorunlu: başka seçenek
      // varsa düz devam etmek yasak. Böylece upuzun boş koridorlar oluşmuyor.
      const kosu = cur.kosu || 1;
      const duzYasak = cur.dir && kosu >= maxDuz && options.length > 1;
      const duzSecenek = cur.dir && options.includes(cur.dir) && !duzYasak;
      if (duzSecenek && rand() < duzluk) {
        dir = cur.dir;
      } else {
        const kalan = duzYasak ? options.filter((o) => o !== cur.dir) : options;
        dir = kalan[Math.floor(rand() * kalan.length)];
      }
      let nx = cur.x;
      let ny = cur.y;
      if (dir === "N") { hWalls[cur.y][cur.x] = false; ny--; }
      if (dir === "S") { hWalls[cur.y + 1][cur.x] = false; ny++; }
      if (dir === "W") { vWalls[cur.y][cur.x] = false; nx--; }
      if (dir === "E") { vWalls[cur.y][cur.x + 1] = false; nx++; }
      visited[ny * width + nx] = true;
      stack.push({ x: nx, y: ny, dir, kosu: dir === cur.dir ? kosu + 1 : 1 });
    }

    // Birkaç duvarı fazladan kaldırıp çıkmaz sokakları azalt: oda daha çok
    // "salon" gibi dolaşılır, tek çözümlü labirent gibi değil.
    // Fazladan duvar sökümü de uzun düz koridor doğurabilir (iki kısa koridoru
    // birleştirerek). Sökmeden önce oluşacak koşunun uzunluğuna bakılır.
    const kosuUzunlugu = (x, y, yatay) => {
      // Bu duvar kalkarsa oluşacak düz koşu kaç kare olur?
      let n = 1;
      if (yatay) {
        let cy = y - 1;
        while (cy >= 0 && !hWalls[cy][x]) { cy--; n++; }
        cy = y;
        while (cy < height && !hWalls[cy + 1][x]) { cy++; n++; }
      } else {
        let cx = x - 1;
        while (cx >= 0 && !vWalls[y][cx]) { cx--; n++; }
        cx = x;
        while (cx < width && !vWalls[y][cx + 1]) { cx++; n++; }
      }
      return n;
    };
    const extra = Math.floor(width * height * ekstra);
    const enFazlaKosu = maxDuz + 2;
    for (let i = 0; i < extra; i++) {
      const x = 1 + Math.floor(rand() * (width - 2));
      const y = 1 + Math.floor(rand() * (height - 2));
      const yatay = rand() < 0.5;
      if (yatay) {
        if (!hWalls[y][x] || kosuUzunlugu(x, y, true) > enFazlaKosu) continue;
        hWalls[y][x] = false;
      } else {
        if (!vWalls[y][x] || kosuUzunlugu(x, y, false) > enFazlaKosu) continue;
        vWalls[y][x] = false;
      }
    }

    // --- Odacıklar ---------------------------------------------------------
    //
    // Koridor koridor yürümek bir süre sonra tekdüze geliyor. Salonun içine
    // iki üç kare genişliğinde küçük aynalı odacıklar açılıyor: dar bir
    // koridordan çıkıp birden etrafı camla çevrili bir boşluğa giriyorsun,
    // sonra yine daralıp çıkıyorsun. Odacığın kapısı sayılı olduğu için
    // ağzı doğal bir kıskaç oluyor.
    if (odacik > 0 && width > 10 && height > 10) {
      const kullanilan = new Uint8Array(width * height);
      // Bağlantı kontrolü pahalı olduğu için sayısı sınırlı: bütçe bitince
      // odacıklar kapısı kısılmadan, olduğu gibi açık bırakılır.
      // Tek bir geçidi kapatmak bağlı bir salonu ya bölmez ya da tam olarak
      // ikiye böler; bu durumda geçidin iki yanındaki kareler ayrı parçalarda
      // kalır. Bu yüzden bütün salonu taramak gerekmiyor: yalnızca o iki
      // karenin hâlâ birbirine ulaşıp ulaşmadığına bakmak yeterli. Alternatif
      // yol genelde birkaç kare ötede olduğu için arama hemen biter.
      const ziyaret = new Int32Array(width * height);
      let damga = 0;
      const kuyruk = new Int32Array(width * height);
      const hala_ulasiyor = (ax, ay, bx, by) => {
        damga++;
        const hedef = by * width + bx;
        let bas = 0;
        let son = 0;
        const basla = ay * width + ax;
        ziyaret[basla] = damga;
        kuyruk[son++] = basla;
        while (bas < son) {
          const c = kuyruk[bas++];
          if (c === hedef) return true;
          const cx = c % width;
          const cy = (c - cx) / width;
          if (!hWalls[cy][cx] && cy > 0) {
            const k = c - width;
            if (ziyaret[k] !== damga) { ziyaret[k] = damga; kuyruk[son++] = k; }
          }
          if (!hWalls[cy + 1][cx] && cy < height - 1) {
            const k = c + width;
            if (ziyaret[k] !== damga) { ziyaret[k] = damga; kuyruk[son++] = k; }
          }
          if (!vWalls[cy][cx] && cx > 0) {
            const k = c - 1;
            if (ziyaret[k] !== damga) { ziyaret[k] = damga; kuyruk[son++] = k; }
          }
          if (!vWalls[cy][cx + 1] && cx < width - 1) {
            const k = c + 1;
            if (ziyaret[k] !== damga) { ziyaret[k] = damga; kuyruk[son++] = k; }
          }
        }
        return false;
      };
      let butce = 400;
      const hedef = Math.max(1, Math.round((width * height * odacik) / 1000));
      let deneme = 0;
      let acilan = 0;
      while (acilan < hedef && deneme++ < hedef * 40) {
        // Odacık üç ile beş kare arasında: iki karelik bir açıklık koridordan
        // ayırt edilmiyordu, oyuncu "bir odaya girdim" demiyordu.
        const w = 3 + Math.floor(rand() * 3);          // 3..5
        const h = 3 + Math.floor(rand() * 3);
        const x0 = 1 + Math.floor(rand() * (width - w - 2));
        const y0 = 1 + Math.floor(rand() * (height - h - 2));
        // Odacıklar birbirine yapışmasın: bir karelik boşluk bırak.
        let cakisiyor = false;
        for (let y = y0 - 1; y <= y0 + h && !cakisiyor; y++) {
          for (let x = x0 - 1; x <= x0 + w; x++) {
            if (x < 0 || y < 0 || x >= width || y >= height) continue;
            if (kullanilan[y * width + x]) { cakisiyor = true; break; }
          }
        }
        if (cakisiyor) continue;

        // İçini aç: odacığın içindeki bütün duvarlar kalkar.
        for (let y = y0; y < y0 + h; y++) {
          for (let x = x0; x < x0 + w; x++) {
            kullanilan[y * width + x] = 1;
            if (x + 1 < x0 + w) vWalls[y][x + 1] = false;
            if (y + 1 < y0 + h) hWalls[y + 1][x] = false;
          }
        }

        // Odacığın ortasına ayna sütunu: dört yüzü de cam olan tek bir kare.
        // Boş bir açıklık yalnızca "daha az duvar" demek olurdu; sütun hem
        // bakacak bir şey verir hem de etrafından sıkışarak dolaşılır — asıl
        // kıskaç duygusu buradan gelir.
        if (w >= 4 && h >= 4) {
          const sx = x0 + 1 + Math.floor(rand() * (w - 2));
          const sy = y0 + 1 + Math.floor(rand() * (h - 2));
          hWalls[sy][sx] = true;
          hWalls[sy + 1][sx] = true;
          vWalls[sy][sx] = true;
          vWalls[sy][sx + 1] = true;
        }

        // Çevresi: açık olan kapıları topla, birkaçını bırak ötekini kapat.
        const kapilar = [];
        for (let x = x0; x < x0 + w; x++) {
          if (!hWalls[y0][x]) kapilar.push({ dizi: hWalls, y: y0, x });
          if (!hWalls[y0 + h][x]) kapilar.push({ dizi: hWalls, y: y0 + h, x });
        }
        for (let y = y0; y < y0 + h; y++) {
          if (!vWalls[y][x0]) kapilar.push({ dizi: vWalls, y, x: x0 });
          if (!vWalls[y][x0 + w]) kapilar.push({ dizi: vWalls, y, x: x0 + w });
        }
        if (kapilar.length < 2) continue;               // ulaşılamaz olurdu
        const kalsin = agiz[0] + Math.floor(rand() * (agiz[1] - agiz[0] + 1));
        // Karıştır, ilk "kalsin" tanesi kesin açık kalsın.
        for (let i = kapilar.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          const t = kapilar[i]; kapilar[i] = kapilar[j]; kapilar[j] = t;
        }
        // Kalan kapılar TEK TEK kapatılır ve her kapatmadan sonra salonun
        // her yerine hâlâ yürünebildiği doğrulanır. Az halkalı son odalarda
        // bir kapı çoğu zaman koca bir bölgenin tek yoludur; kontrolsüz
        // kapatmak salonun yarısını koparıyordu.
        for (let i = kalsin; i < kapilar.length; i++) {
          if (butce <= 0) break;
          const k = kapilar[i];
          // Kapının iki yanındaki kareler
          const yatay = k.dizi === hWalls;
          const ax = k.x;
          const ay = yatay ? k.y - 1 : k.y;
          const bx = yatay ? k.x : k.x - 1;
          const by = k.y;
          if (ax < 0 || ay < 0 || bx < 0 || by < 0) continue;
          if (ax >= width || ay >= height || bx >= width || by >= height) continue;
          k.dizi[k.y][k.x] = true;
          butce--;
          // Kapatınca iki yan hâlâ birbirine ulaşamıyorsa bir bölge kopmuş
          // demektir; kapı açık bırakılır.
          if (!hala_ulasiyor(ax, ay, bx, by)) k.dizi[k.y][k.x] = false;
        }
        acilan++;
      }
    }

    return { width, height, hWalls, vWalls };
  }

  // Dört yanı da kapalı kare: odacıkların ortasındaki ayna sütunu. Bunlar
  // salonun bir parçası değil, salonun içindeki bir engeldir; bu yüzden
  // "her yere yürünebiliyor mu" sorusunda hesaba katılmazlar.
  function tamKapali(maze, x, y) {
    return maze.hWalls[y][x] && maze.hWalls[y + 1][x] &&
           maze.vWalls[y][x] && maze.vWalls[y][x + 1];
  }

  // Salonun yürünebilir her karesine ulaşılabiliyor mu? Sütunlar dışarıda
  // bırakılır. distances() tek başına bu soruya cevap veremez çünkü bir
  // sütun her zaman "ulaşılamaz" görünür.
  function baglantiliMi(maze) {
    let bx = -1;
    let by = -1;
    for (let y = 0; y < maze.height && bx < 0; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (!tamKapali(maze, x, y)) { bx = x; by = y; break; }
      }
    }
    if (bx < 0) return true;
    const d = distances(maze, { x: bx, y: by });
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (tamKapali(maze, x, y)) continue;
        if (d[y * maze.width + x] < 0) return false;
      }
    }
    return true;
  }

  // Ayna sayısını nesne üretmeden sayar. mirrors() her çağrıda on binlerce
  // nesne ayırıyordu; yalnızca sayı gerektiğinde bu kullanılır.
  function mirrorCount(maze) {
    let n = 0;
    for (let y = 0; y <= maze.height; y++) {
      const satir = maze.hWalls[y];
      for (let x = 0; x < maze.width; x++) if (satir[x]) n++;
    }
    for (let y = 0; y < maze.height; y++) {
      const satir = maze.vWalls[y];
      for (let x = 0; x <= maze.width; x++) if (satir[x]) n++;
    }
    return n;
  }

  // Tüm ayna parçalarını (birim duvar kenarları) listeler.
  function mirrors(maze) {
    const list = [];
    for (let y = 0; y <= maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (maze.hWalls[y][x]) list.push({ id: `h${x},${y}`, x, y, horizontal: true });
      }
    }
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x <= maze.width; x++) {
        if (maze.vWalls[y][x]) list.push({ id: `v${x},${y}`, x, y, horizontal: false });
      }
    }
    return list;
  }

  function hasWall(maze, cx, cy, side) {
    if (side === "N") return maze.hWalls[cy][cx];
    if (side === "S") return maze.hWalls[cy + 1][cx];
    if (side === "W") return maze.vWalls[cy][cx];
    return maze.vWalls[cy][cx + 1];
  }

  // Başlangıçtan itibaren adım mesafeleri (duvarlardan geçmeden).
  function distances(maze, start) {
    const dist = new Array(maze.width * maze.height).fill(-1);
    const queue = [start];
    dist[start.y * maze.width + start.x] = 0;
    for (let head = 0; head < queue.length; head++) {
      const { x, y } = queue[head];
      const d = dist[y * maze.width + x];
      const steps = [
        { nx: x, ny: y - 1, side: "N" },
        { nx: x, ny: y + 1, side: "S" },
        { nx: x - 1, ny: y, side: "W" },
        { nx: x + 1, ny: y, side: "E" },
      ];
      for (const s of steps) {
        if (s.nx < 0 || s.ny < 0 || s.nx >= maze.width || s.ny >= maze.height) continue;
        if (hasWall(maze, x, y, s.side)) continue;
        const idx = s.ny * maze.width + s.nx;
        if (dist[idx] !== -1) continue;
        dist[idx] = d + 1;
        queue.push({ x: s.nx, y: s.ny });
      }
    }
    return dist;
  }

  // Dev aynası. Her salonda hep en uzak köşede olmasın diye mesafe bir
  // "kuşak" ile seçilir: bazen burnunun dibinde, bazen salonun ta öbür ucunda.
  //   yakin  : ilk üçte bir      (şanslıysan bir dakikada bulursun)
  //   orta   : ortadaki üçte bir
  //   uzak   : son üçte bir      (uzun arama)
  // Kuşak verilmezse tohuma göre rastgele seçilir; dağılım %25 yakın,
  // %45 orta, %30 uzak.
  const BANDS = {
    yakin: [0.18, 0.42],
    orta: [0.4, 0.72],
    uzak: [0.7, 1.0],
  };

  function pickBand(seed) {
    const next = rng(seed + 104729);
    next();
    next();                       // xorshift'in ilk çıktıları tohuma fazla bağlı
    const r = next();
    if (r < 0.25) return "yakin";
    if (r < 0.7) return "orta";
    return "uzak";
  }

  // hazirDist: aynı salonda arka arkaya seçim yapılırken (kaçan ayna her
  // 20 saniyede 30 aday deniyor) mesafe haritası bir kez hesaplanıp
  // yeniden kullanılabilsin diye.
  function pickGiant(maze, start, seed, band, hazirDist) {
    const rand = rng(seed + 7919);
    const dist = hazirDist || distances(maze, start);
    const kusak = BANDS[band] || BANDS[pickBand(seed)];
    const far = [];
    let max = 0;
    for (const d of dist) if (d > max) max = d;
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const d = dist[y * maze.width + x];
        if (d >= max * kusak[0] && d <= max * kusak[1]) far.push({ x, y });
      }
    }
    // Kuşakta uygun kare kalmadıysa (küçük ya da tuhaf salonlar) tümünü kullan.
    if (!far.length) {
      for (let y = 0; y < maze.height; y++) {
        for (let x = 0; x < maze.width; x++) if (dist[y * maze.width + x] > 3) far.push({ x, y });
      }
    }
    for (let tries = 0; tries < 500; tries++) {
      const cell = far[Math.floor(rand() * far.length)];
      const sides = ["N", "S", "W", "E"].filter((s) => hasWall(maze, cell.x, cell.y, s));
      if (!sides.length) continue;
      const side = sides[Math.floor(rand() * sides.length)];
      if (side === "N") return { id: `h${cell.x},${cell.y}`, x: cell.x, y: cell.y, horizontal: true };
      if (side === "S") return { id: `h${cell.x},${cell.y + 1}`, x: cell.x, y: cell.y + 1, horizontal: true };
      if (side === "W") return { id: `v${cell.x},${cell.y}`, x: cell.x, y: cell.y, horizontal: false };
      return { id: `v${cell.x + 1},${cell.y}`, x: cell.x + 1, y: cell.y, horizontal: false };
    }
    return mirrors(maze)[0];
  }

  return { generate, mirrors, mirrorCount, tamKapali, baglantiliMi, hasWall, distances, pickGiant, pickBand, BANDS };
});
