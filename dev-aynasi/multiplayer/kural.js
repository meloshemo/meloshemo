// Dev Aynası — çevrimiçi turnuvanın saf kuralları.
//
// Burada ağ yok, oda durumu yok: yalnızca hesap. Sunucu da testler de aynı
// kodu kullansın, kural iki yerde ayrı ayrı yazılmasın diye ayrıldı.

const TUR_TABAN = 90000;          // tur süresi tabanı: 90 sn
const TUR_AYNA_BASI = 1000 / 90;  // her 90 ayna için +1 sn
const TUR_EN_AZ = 150000;         // en kısa tur 2.5 dakika
const TUR_EN_COK = 900000;        // en uzun tur 15 dakika

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
  { ad: "XVII · Kyoto", decoyPay: 30 },
  { ad: "XVIII · Reykjavík", decoyPay: 32 },
  { ad: "XIX · Marrakeş", decoyPay: 34 },
  { ad: "XX · Sonsuzluk", decoyPay: 38 },
];


// Salon boyutu tek bir kurala göre belirlenir: HEDEFLENEN AYNA SAYISI.
//
//  1) Bölüm merdiveni: I. tur 5.000 ayna, XX. tur 20.000 ayna.
//  2) Her ek oyuncu salona +5.000 ayna ekler. İki kişi birinci tura girerse
//     salon 5.000 değil 10.000 aynadır; sekiz kişi girerse 40.000.
//  3) Oyuncu elendikçe salon aynı kuralla küçülür — ölçek iki yönde de
//     orantılıdır.
//
// Ayna sayısı ≈ hücre sayısı olduğundan kenar uzunluğu kökten bulunur; salon
// kurulduktan sonra ölçülüp hedefe göre bir kez düzeltilir (Paris'in açık
// galerisi, ızgara ve çarşı duvar söktüğü için kenar tek başına yetmez).
// Ölçek yalnızca otomatik testlerde küçültülebilir (DEV_AYNASI_TEST ile
// birlikte): turnuva mantığını 40.000 aynalık salonlar kurmadan sınamak için.
const TEST_OLCEK =
  process.env.DEV_AYNASI_TEST && Number(process.env.DEV_AYNASI_AYNA_OLCEK) > 0
    ? Number(process.env.DEV_AYNASI_AYNA_OLCEK)
    : 1;
const AYNA_BAS = Math.round(5000 * TEST_OLCEK);
const AYNA_SON = Math.round(20000 * TEST_OLCEK);
const AYNA_OYUNCU_BASI = Math.round(5000 * TEST_OLCEK);
const EN_BUYUK_KENAR = 260;

function bolumAynasi(chapter) {
  const son = CHAPTERS.length - 1;
  const i = Math.max(0, Math.min(chapter, son));
  return Math.round(AYNA_BAS + ((AYNA_SON - AYNA_BAS) * i) / Math.max(1, son));
}

function hedefAyna(playerCount, chapter = 0) {
  return bolumAynasi(chapter) + Math.max(0, playerCount - 1) * AYNA_OYUNCU_BASI;
}

const kenarIcin = (ayna) =>
  Math.min(EN_BUYUK_KENAR, Math.max(20, Math.round(Math.sqrt(ayna / 0.985))));

function roomSize(playerCount, chapter = 0) {
  return kenarIcin(hedefAyna(playerCount, chapter));
}

// Sahte dev yoğunluğu sabit kalsın: salon büyüdükçe sayı da orantılı artar.
function decoyCount(playerCount, chapter = 0, mirrorCount = 0) {
  const taban = CHAPTERS[Math.min(chapter, CHAPTERS.length - 1)].decoyPay + playerCount * 6;
  const olcek = mirrorCount ? mirrorCount / 2500 : 1;
  return Math.max(taban, Math.round(taban * olcek));
}


// İki bitiriş bu kadar yakınsa "aynı anda" sayılır. Ağ gecikmesi yüzünden
// milisaniyesi milisaniyesine eşitlik beklemek anlamsız olurdu.
// Bitiriş süreleri SANİYE cinsinden tutulur; tolerans da öyle.
const BERABERLIK_SN = 0.3;

// Bitirenlere sıra numarası verir; aynı anda bitenler aynı sırayı paylaşır
// ve sonraki sıra atlanır (1, 1, 3).
function siralaBitirenler(finishers) {
  const sirali = finishers.slice().sort((a, b) => a.sure - b.sure);
  let sira = 0;
  let oncekiSure = null;
  sirali.forEach((f, i) => {
    if (oncekiSure === null || f.sure - oncekiSure > BERABERLIK_SN) {
      sira = i + 1;
      oncekiSure = f.sure;
    }
    f.sira = sira;
  });
  return sirali;
}

// Turun sonuncusu kim? Aynı anda bitiren birden fazla kişi varsa hepsi döner.
function sonSirayiPaylasanlar(finishers) {
  const sirali = siralaBitirenler(finishers);
  if (!sirali.length) return [];
  const sonSira = sirali[sirali.length - 1].sira;
  return sirali.filter((f) => f.sira === sonSira);
}

// Bir turda son kalan elenir; kalanlarla yeni tur kurulur.
// 10 kişi girer, her turda biri elenir: 10 → 9 → 8 → ... → 1 kazanan.

// Tur süresi salonun büyüklüğüne göre belirlenir: küçük salonda kısa,
// 26 bin aynalık salonda beş dakika. Böylece hiçbir tur sürüncemede kalmaz
// ama kalabalık odada da acele ettirmez.
function turSuresi(mirrorCount) {
  const ms = TUR_TABAN + mirrorCount * TUR_AYNA_BASI * 1000 / 1000;
  return Math.round(Math.min(TUR_EN_COK, Math.max(TUR_EN_AZ, ms)));
}


module.exports = {
  CHAPTERS, TUR_TABAN, TUR_AYNA_BASI, TUR_EN_AZ, TUR_EN_COK,
  AYNA_BAS, AYNA_SON, AYNA_OYUNCU_BASI, EN_BUYUK_KENAR, BERABERLIK_SN,
  bolumAynasi, hedefAyna, kenarIcin, roomSize, decoyCount,
  siralaBitirenler, sonSirayiPaylasanlar, turSuresi,
};
