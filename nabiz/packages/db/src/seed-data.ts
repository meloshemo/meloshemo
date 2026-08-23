/**
 * Sabit başlangıç verisi: 81 il, kategoriler ve açılış soruları.
 *
 * Nüfus değerleri YAKLAŞIKTIR ve yalnızca şehir katılımını normalize etmek için kullanılır
 * ("İzmir 3. sırada" gibi sıralamalarda mutlak oy sayısı hep İstanbul'u kazandırırdı).
 * Resmî istatistik olarak kullanılmamalıdır.
 */

export interface SeedCity { id: number; slug: string; name: string; region: string; population: number }

export const CITIES: readonly SeedCity[] = [
  { id: 1, slug: "adana", name: "Adana", region: "Akdeniz", population: 2270000 },
  { id: 2, slug: "adiyaman", name: "Adıyaman", region: "Güneydoğu Anadolu", population: 635000 },
  { id: 3, slug: "afyonkarahisar", name: "Afyonkarahisar", region: "Ege", population: 747000 },
  { id: 4, slug: "agri", name: "Ağrı", region: "Doğu Anadolu", population: 511000 },
  { id: 5, slug: "amasya", name: "Amasya", region: "Karadeniz", population: 338000 },
  { id: 6, slug: "ankara", name: "Ankara", region: "İç Anadolu", population: 5800000 },
  { id: 7, slug: "antalya", name: "Antalya", region: "Akdeniz", population: 2688000 },
  { id: 8, slug: "artvin", name: "Artvin", region: "Karadeniz", population: 169000 },
  { id: 9, slug: "aydin", name: "Aydın", region: "Ege", population: 1148000 },
  { id: 10, slug: "balikesir", name: "Balıkesir", region: "Marmara", population: 1257000 },
  { id: 11, slug: "bilecik", name: "Bilecik", region: "Marmara", population: 228000 },
  { id: 12, slug: "bingol", name: "Bingöl", region: "Doğu Anadolu", population: 282000 },
  { id: 13, slug: "bitlis", name: "Bitlis", region: "Doğu Anadolu", population: 353000 },
  { id: 14, slug: "bolu", name: "Bolu", region: "Karadeniz", population: 320000 },
  { id: 15, slug: "burdur", name: "Burdur", region: "Akdeniz", population: 273000 },
  { id: 16, slug: "bursa", name: "Bursa", region: "Marmara", population: 3214000 },
  { id: 17, slug: "canakkale", name: "Çanakkale", region: "Marmara", population: 559000 },
  { id: 18, slug: "cankiri", name: "Çankırı", region: "İç Anadolu", population: 194000 },
  { id: 19, slug: "corum", name: "Çorum", region: "Karadeniz", population: 524000 },
  { id: 20, slug: "denizli", name: "Denizli", region: "Ege", population: 1056000 },
  { id: 21, slug: "diyarbakir", name: "Diyarbakır", region: "Güneydoğu Anadolu", population: 1804000 },
  { id: 22, slug: "edirne", name: "Edirne", region: "Marmara", population: 414000 },
  { id: 23, slug: "elazig", name: "Elazığ", region: "Doğu Anadolu", population: 596000 },
  { id: 24, slug: "erzincan", name: "Erzincan", region: "Doğu Anadolu", population: 239000 },
  { id: 25, slug: "erzurum", name: "Erzurum", region: "Doğu Anadolu", population: 749000 },
  { id: 26, slug: "eskisehir", name: "Eskişehir", region: "İç Anadolu", population: 915000 },
  { id: 27, slug: "gaziantep", name: "Gaziantep", region: "Güneydoğu Anadolu", population: 2164000 },
  { id: 28, slug: "giresun", name: "Giresun", region: "Karadeniz", population: 447000 },
  { id: 29, slug: "gumushane", name: "Gümüşhane", region: "Karadeniz", population: 144000 },
  { id: 30, slug: "hakkari", name: "Hakkari", region: "Doğu Anadolu", population: 287000 },
  { id: 31, slug: "hatay", name: "Hatay", region: "Akdeniz", population: 1544000 },
  { id: 32, slug: "isparta", name: "Isparta", region: "Akdeniz", population: 449000 },
  { id: 33, slug: "mersin", name: "Mersin", region: "Akdeniz", population: 1938000 },
  { id: 34, slug: "istanbul", name: "İstanbul", region: "Marmara", population: 15655000 },
  { id: 35, slug: "izmir", name: "İzmir", region: "Ege", population: 4462000 },
  { id: 36, slug: "kars", name: "Kars", region: "Doğu Anadolu", population: 274000 },
  { id: 37, slug: "kastamonu", name: "Kastamonu", region: "Karadeniz", population: 390000 },
  { id: 38, slug: "kayseri", name: "Kayseri", region: "İç Anadolu", population: 1445000 },
  { id: 39, slug: "kirklareli", name: "Kırklareli", region: "Marmara", population: 377000 },
  { id: 40, slug: "kirsehir", name: "Kırşehir", region: "İç Anadolu", population: 244000 },
  { id: 41, slug: "kocaeli", name: "Kocaeli", region: "Marmara", population: 2079000 },
  { id: 42, slug: "konya", name: "Konya", region: "İç Anadolu", population: 2320000 },
  { id: 43, slug: "kutahya", name: "Kütahya", region: "Ege", population: 572000 },
  { id: 44, slug: "malatya", name: "Malatya", region: "Doğu Anadolu", population: 742000 },
  { id: 45, slug: "manisa", name: "Manisa", region: "Ege", population: 1475000 },
  { id: 46, slug: "kahramanmaras", name: "Kahramanmaraş", region: "Akdeniz", population: 1177000 },
  { id: 47, slug: "mardin", name: "Mardin", region: "Güneydoğu Anadolu", population: 888000 },
  { id: 48, slug: "mugla", name: "Muğla", region: "Ege", population: 1066000 },
  { id: 49, slug: "mus", name: "Muş", region: "Doğu Anadolu", population: 408000 },
  { id: 50, slug: "nevsehir", name: "Nevşehir", region: "İç Anadolu", population: 310000 },
  { id: 51, slug: "nigde", name: "Niğde", region: "İç Anadolu", population: 377000 },
  { id: 52, slug: "ordu", name: "Ordu", region: "Karadeniz", population: 763000 },
  { id: 53, slug: "rize", name: "Rize", region: "Karadeniz", population: 343000 },
  { id: 54, slug: "sakarya", name: "Sakarya", region: "Marmara", population: 1097000 },
  { id: 55, slug: "samsun", name: "Samsun", region: "Karadeniz", population: 1368000 },
  { id: 56, slug: "siirt", name: "Siirt", region: "Güneydoğu Anadolu", population: 331000 },
  { id: 57, slug: "sinop", name: "Sinop", region: "Karadeniz", population: 218000 },
  { id: 58, slug: "sivas", name: "Sivas", region: "İç Anadolu", population: 634000 },
  { id: 59, slug: "tekirdag", name: "Tekirdağ", region: "Marmara", population: 1167000 },
  { id: 60, slug: "tokat", name: "Tokat", region: "Karadeniz", population: 596000 },
  { id: 61, slug: "trabzon", name: "Trabzon", region: "Karadeniz", population: 818000 },
  { id: 62, slug: "tunceli", name: "Tunceli", region: "Doğu Anadolu", population: 84000 },
  { id: 63, slug: "sanliurfa", name: "Şanlıurfa", region: "Güneydoğu Anadolu", population: 2170000 },
  { id: 64, slug: "usak", name: "Uşak", region: "Ege", population: 375000 },
  { id: 65, slug: "van", name: "Van", region: "Doğu Anadolu", population: 1128000 },
  { id: 66, slug: "yozgat", name: "Yozgat", region: "İç Anadolu", population: 422000 },
  { id: 67, slug: "zonguldak", name: "Zonguldak", region: "Karadeniz", population: 583000 },
  { id: 68, slug: "aksaray", name: "Aksaray", region: "İç Anadolu", population: 438000 },
  { id: 69, slug: "bayburt", name: "Bayburt", region: "Karadeniz", population: 85000 },
  { id: 70, slug: "karaman", name: "Karaman", region: "İç Anadolu", population: 260000 },
  { id: 71, slug: "kirikkale", name: "Kırıkkale", region: "İç Anadolu", population: 280000 },
  { id: 72, slug: "batman", name: "Batman", region: "Güneydoğu Anadolu", population: 634000 },
  { id: 73, slug: "sirnak", name: "Şırnak", region: "Güneydoğu Anadolu", population: 570000 },
  { id: 74, slug: "bartin", name: "Bartın", region: "Karadeniz", population: 203000 },
  { id: 75, slug: "ardahan", name: "Ardahan", region: "Doğu Anadolu", population: 92000 },
  { id: 76, slug: "igdir", name: "Iğdır", region: "Doğu Anadolu", population: 210000 },
  { id: 77, slug: "yalova", name: "Yalova", region: "Marmara", population: 298000 },
  { id: 78, slug: "karabuk", name: "Karabük", region: "Karadeniz", population: 254000 },
  { id: 79, slug: "kilis", name: "Kilis", region: "Güneydoğu Anadolu", population: 148000 },
  { id: 80, slug: "osmaniye", name: "Osmaniye", region: "Akdeniz", population: 559000 },
  { id: 81, slug: "duzce", name: "Düzce", region: "Karadeniz", population: 409000 },
] as const;

export interface SeedCategory { slug: string; nameTr: string; emoji: string; sortOrder: number }

export const CATEGORIES: readonly SeedCategory[] = [
  { slug: "yemek", nameTr: "Yemek", emoji: "🍽️", sortOrder: 1 },
  { slug: "tatli", nameTr: "Tatlı", emoji: "🍯", sortOrder: 2 },
  { slug: "icecek", nameTr: "İçecek", emoji: "☕", sortOrder: 3 },
  { slug: "sehir", nameTr: "Şehir", emoji: "🏙️", sortOrder: 4 },
  { slug: "tatil", nameTr: "Tatil", emoji: "🏖️", sortOrder: 5 },
  { slug: "tarihi-yer", nameTr: "Tarihi Yer", emoji: "🏛️", sortOrder: 6 },
  { slug: "gunluk-hayat", nameTr: "Günlük Hayat", emoji: "🌤️", sortOrder: 7 },
  { slug: "ulasim", nameTr: "Ulaşım", emoji: "🚗", sortOrder: 8 },
] as const;

export interface SeedPoll {
  slug: string;
  question: string;
  category: string;
  options: [{ label: string; emoji: string }, { label: string; emoji: string }];
}

/**
 * Açılış seti. Seçim kriteri docs/19: hedef sonuç aralığı %45–55, herkesin fikri var,
 * kimse incinmiyor. %80/%20 çıkan soru içerik değildir ve arşive alınır.
 */
export const SEED_POLLS: readonly SeedPoll[] = [
  { slug: "lahmacun-vs-doner", question: "Türkiye'nin en sevdiği yemek hangisi?", category: "yemek",
    options: [{ label: "Lahmacun", emoji: "🥙" }, { label: "Döner", emoji: "🥩" }] },
  { slug: "baklava-vs-kunefe", question: "Türkiye'nin en sevilen tatlısı hangisi?", category: "tatli",
    options: [{ label: "Baklava", emoji: "🍯" }, { label: "Künefe", emoji: "🧀" }] },
  { slug: "cay-vs-turk-kahvesi", question: "Çay mı, Türk kahvesi mi?", category: "icecek",
    options: [{ label: "Çay", emoji: "🍵" }, { label: "Türk Kahvesi", emoji: "☕" }] },
  { slug: "izmir-vs-istanbul", question: "Yaşamak için hangisi?", category: "sehir",
    options: [{ label: "İzmir", emoji: "⛵" }, { label: "İstanbul", emoji: "🌉" }] },
  { slug: "cesme-vs-bodrum", question: "Tatil için hangisi?", category: "tatil",
    options: [{ label: "Çeşme", emoji: "🏖️" }, { label: "Bodrum", emoji: "🛥️" }] },
  { slug: "menemen-soganli-vs-sogansiz", question: "Menemen soğanlı mı olur, soğansız mı?", category: "yemek",
    options: [{ label: "Soğanlı", emoji: "🧅" }, { label: "Soğansız", emoji: "🍳" }] },
  { slug: "adana-vs-urfa-kebap", question: "Adana mı, Urfa mı?", category: "yemek",
    options: [{ label: "Adana Kebap", emoji: "🌶️" }, { label: "Urfa Kebap", emoji: "🍢" }] },
  { slug: "ayran-vs-salgam", question: "Kebabın yanına ne gider?", category: "icecek",
    options: [{ label: "Ayran", emoji: "🥛" }, { label: "Şalgam", emoji: "🥤" }] },
  { slug: "simit-cayli-vs-caysiz", question: "Simit çayla mı yenir, çaysız mı?", category: "gunluk-hayat",
    options: [{ label: "Çayla", emoji: "🍵" }, { label: "Çaysız", emoji: "🥯" }] },
  { slug: "efes-vs-kapadokya", question: "Türkiye'nin en etkileyici tarihi yeri?", category: "tarihi-yer",
    options: [{ label: "Efes", emoji: "🏛️" }, { label: "Kapadokya", emoji: "🎈" }] },
  { slug: "mercimek-vs-ezogelin", question: "Çorba deyince hangisi?", category: "yemek",
    options: [{ label: "Mercimek", emoji: "🍲" }, { label: "Ezogelin", emoji: "🥣" }] },
  { slug: "metro-vs-vapur", question: "İstanbul'da yolculuk: hangisi?", category: "ulasim",
    options: [{ label: "Metro", emoji: "🚇" }, { label: "Vapur", emoji: "⛴️" }] },
] as const;
