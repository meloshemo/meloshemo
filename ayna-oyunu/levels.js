// Ayna Oyunu - bölüm tanımları
// Karakterler:
//   .  boş kare (ayna konabilir)
//   ,  boş kare (ayna konamaz)
//   #  duvar
//   > < ^ v  lazer kaynağı ve yönü
//   T  hedef
//   / \  sabit ayna (oyuncu değiştiremez)
const LEVELS = [
  {
    name: "İlk Yansıma",
    hint: "Işını hedefe çevirmek için bir ayna yerleştir.",
    mirrors: 1,
    grid: [
      ">...,",
      ",,,.,",
      ",,,.,",
      ",,,T,",
    ],
  },
  {
    name: "Köşeyi Dön",
    hint: "İki ayna ile ışını köşeden dolaştır.",
    mirrors: 2,
    grid: [
      ">....",
      ",,,,.",
      "T....",
      ",,,,,",
    ],
  },
  {
    name: "Duvarın Ardı",
    hint: "Duvarlar ışını durdurur, etrafından dolaş.",
    mirrors: 3,
    grid: [
      ">..#.",
      "...#.",
      "..##.",
      "....T",
    ],
  },
  {
    name: "Çift Hedef",
    hint: "İki kaynak, iki hedef. Her ışını ayrı ayrı düşün.",
    mirrors: 4,
    grid: [
      ">...v",
      ".....",
      "..#.#",
      "T...T",
    ],
  },
  {
    name: "Labirent",
    hint: "Sabit aynaları hesaba kat.",
    mirrors: 4,
    grid: [
      ">...#.",
      ".#....",
      "....#.",
      ".#...T",
      "......",
    ],
  },
  {
    name: "Uzun Yol",
    hint: "Işını odanın çevresinde dolaştır.",
    mirrors: 4,
    grid: [
      "v.....",
      ".####.",
      ".#..#.",
      ".#T.#.",
      "......",
    ],
  },
];
