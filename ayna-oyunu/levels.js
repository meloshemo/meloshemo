// Ayna Oyunu - bölüm tanımları
// Karakterler:
//   .  boş kare (ayna konabilir)
//   ,  boş kare (ayna konamaz)
//   #  duvar
//   > < ^ v  lazer kaynağı ve yönü
//   T  hedef
//   / \  sabit ayna (oyuncu değiştiremez)
//   X  prizma (ışını düz + iki dik yöne böler)
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
  {
    name: "Prizma",
    hint: "Prizma (◇) ışını üç yöne birden dağıtır.",
    mirrors: 3,
    grid: [
      ">....",
      ".....",
      "..X..",
      "T...T",
    ],
  },
  {
    name: "Dağılan Işık",
    hint: "Önce prizmaya ulaş, sonra kolları hedeflere yönlendir.",
    mirrors: 4,
    grid: [
      "v....",
      "...#.",
      ".X..T",
      "..#..",
      "T....",
    ],
  },
  {
    name: "Son Perde",
    hint: "Üç hedefin üçü de aynı anda vurulmalı.",
    mirrors: 5,
    grid: [
      ">.....",
      "..X..T",
      ".#....",
      "T....T",
      "......",
    ],
  },
];
