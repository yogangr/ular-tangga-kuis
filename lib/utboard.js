// Data papan Ular Tangga (dipakai server dan browser)
// Kunci = kotak awal, nilai = kotak tujuan.
export const LADDERS = {
  2: 38,
  7: 14,
  8: 31,
  15: 26,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  78: 98,
  87: 94,
};
export const SNAKES = {
  16: 6,
  46: 25,
  49: 11,
  62: 19,
  64: 60,
  74: 53,
  89: 68,
  92: 88,
  95: 75,
  99: 80,
};

// Susun map portal: pairs = [[a, b], ...]. Portal berlaku dua arah (mendarat di a pindah ke b, dan sebaliknya).
// Hasilnya: portals { kotak: pasangan }, portalLabels { kotak: huruf pasangan }, dan tiles bertanda 'portal'.
const withPortals = (m, pairs) => {
  const portals = {},
    portalLabels = {},
    tiles = { ...m.tiles };
  pairs.forEach(([a, b], i) => {
    portals[a] = b;
    portals[b] = a;
    tiles[a] = tiles[b] = "portal";
    portalLabels[a] = portalLabels[b] = String.fromCharCode(65 + i);
  });
  return { ...m, portals, portalLabels, tiles };
};

// Daftar map. tiles = kotak spesial { nomorKotak: jenis }.
// Aturan membuat map: tidak boleh ada kotak yang dipakai dua fungsi (tangga/ular/lumpur/lava/es/portal/harta),
// kotak spesial tidak boleh menjadi ujung tangga atau ular, tidak ada ular di kotak 100,
// dan tidak ada rantai (ujung tangga jatuh di kepala ular).
// Lava: kotak 3 langkah di belakangnya sebaiknya bukan kotak spesial lain.
// Es: kotak 2 dan 3 langkah di depannya sebaiknya bukan kotak spesial lain (meluncur tidak memicu es/portal lagi).
export const MAPS = {
  klasik: {
    name: "Klasik",
    desc: "Papan standar tanpa kotak spesial.",
    ladders: LADDERS,
    snakes: SNAKES,
    tiles: {},
  },
  rawa: {
    name: "Rawa Lumpur",
    desc: "6 kotak lumpur: mendarat di sana, giliran berikutnya dilewati.",
    ladders: {
      3: 22,
      9: 27,
      20: 41,
      25: 56,
      33: 52,
      47: 68,
      60: 79,
      72: 93,
      81: 97,
    },
    snakes: { 38: 17, 54: 34, 66: 45, 87: 63, 91: 70, 98: 76 },
    tiles: {
      14: "lumpur",
      29: "lumpur",
      44: "lumpur",
      58: "lumpur",
      75: "lumpur",
      88: "lumpur",
    },
  },
  gunung: {
    name: "Gunung Api",
    desc: "6 kotak lava: mendarat di sana, bidak terdorong mundur 3 kotak.",
    ladders: { 4: 25, 11: 30, 22: 41, 31: 52, 40: 59, 56: 77, 68: 88, 76: 94 },
    snakes: { 44: 21, 61: 38, 79: 57, 91: 72, 98: 80 },
    tiles: {
      13: "lava",
      27: "lava",
      35: "lava",
      48: "lava",
      66: "lava",
      84: "lava",
    },
  },
  es: {
    name: "Kutub Es",
    desc: "8 kotak es: bidak meluncur maju 2–3 kotak, bisa ke tangga atau ke ular.",
    ladders: { 5: 27, 15: 37, 36: 55, 42: 63, 60: 82, 68: 89, 77: 96 },
    snakes: { 22: 3, 48: 29, 53: 31, 75: 50, 87: 66, 93: 71, 97: 78, 99: 80 },
    tiles: {
      6: "es",
      19: "es",
      33: "es",
      45: "es",
      58: "es",
      72: "es",
      81: "es",
      90: "es",
    },
  },
  harta: {
    name: "Harta Karun",
    desc: "8 kotak peti: mendarat di sana, dapat 1 skill sekali pakai dari hewan lain.",
    ladders: { 6: 28, 14: 35, 25: 46, 38: 57, 52: 74, 63: 84, 79: 96 },
    snakes: { 32: 11, 49: 27, 56: 33, 71: 50, 88: 67, 94: 75, 99: 78 },
    tiles: {
      9: "harta",
      19: "harta",
      30: "harta",
      42: "harta",
      54: "harta",
      60: "harta",
      68: "harta",
      83: "harta",
    },
  },
  portal: withPortals(
    {
      name: "Portal Ajaib",
      desc: "4 pasang portal: mendarat di satu, muncul di pasangannya (bisa maju atau mundur).",
      ladders: { 3: 24, 18: 41, 27: 52, 55: 76, 66: 88, 80: 97 },
      snakes: { 44: 20, 57: 28, 70: 49, 84: 61, 93: 72, 98: 79 },
      tiles: {},
    },
    [
      [14, 62],
      [31, 9],
      [47, 86],
      [73, 38],
    ],
  ),
};
export const getMap = (id) => MAPS[id] ?? MAPS.klasik;

// Keterangan kotak spesial (untuk legenda di layar)
export const TILE_INFO = {
  lumpur: { name: "Lumpur", desc: "Giliran berikutnya dilewati" },
  lava: { name: "Lava", desc: "Bidak terdorong mundur 3 kotak" },
  es: { name: "Es", desc: "Meluncur maju 2–3 kotak" },
  portal: { name: "Portal", desc: "Pindah ke portal berhuruf sama" },
  harta: { name: "Peti", desc: "Dapat skill sekali pakai dari hewan lain" },
};

export const COLORS = [
  "#2F6BFF",
  "#FF6B9A",
  "#3DD68C",
  "#FFB020",
  "#7C3AED",
  "#22C1E8",
];
// Hewan bermain: [id, emoji, nama]. Dibagikan ACAK ke pemain saat permainan dimulai (tiap pemain hewan berbeda).
export const ANIMALS = [
  ["kucing", "🐱", "Kucing"],
  ["rubah", "🦊", "Rubah"],
  ["monyet", "🐵", "Monyet"],
  ["kelinci", "🐰", "Kelinci"],
  ["katak", "🐸", "Katak"],
  ["penguin", "🐧", "Penguin"],
  ["panda", "🐼", "Panda"],
  ["singa", "🦁", "Singa"],
  ["harimau", "🐯", "Harimau"],
];
// Skill tiap hewan. when: 'passive' = aktif otomatis, 'answer' = dipakai saat menjawab soal,
// 'roll' = dipakai saat giliran mengocok dadu (langsung mengocok), 'target' = memilih lawan.
export const SKILLS = {
  kucing: {
    name: "Sembilan Nyawa",
    when: "passive",
    desc: "Jawaban salah pertama dimaafkan, boleh menjawab ulang.",
  },
  rubah: {
    name: "Akal Bulus",
    when: "answer",
    desc: "Menghapus dua pilihan jawaban yang salah.",
  },
  monyet: {
    name: "Tukar Soal",
    when: "answer",
    desc: "Mengganti soal dengan soal baru.",
  },
  kelinci: {
    name: "Dadu Ganda",
    when: "roll",
    desc: "Kocok dua dadu, otomatis dipakai hasil yang terbaik.",
  },
  katak: {
    name: "Lompat Jauh",
    when: "roll",
    desc: "Kocok dadu dengan bonus +3 langkah.",
  },
  penguin: {
    name: "Seluncur Es",
    when: "roll",
    desc: "Memilih sendiri angka dadu 1 sampai 5.",
  },
  panda: {
    name: "Kulit Tebal",
    when: "passive",
    desc: "Kebal satu gigitan ular.",
  },
  singa: {
    name: "Auman",
    when: "target",
    desc: "Satu lawan melewatkan giliran berikutnya.",
  },
  harimau: {
    name: "Terkam",
    when: "target",
    desc: "Satu lawan mundur 4 kotak.",
  },
};
export const LEVELS = [
  ["mudah", "Mudah", "Pengetahuan dasar"],
  ["sedang", "Sedang", "Setara SMP–SMA"],
  ["sulit", "Sulit", "Menuntut penalaran"],
  ["olimpiade", "WNI", "Soal seleksi olimpiade"],
];

// Pusat kotak n dalam koordinat papan 0..100 (kotak 1 di kiri bawah, jalur zig-zag).
// n = 0 berarti belum mulai (di luar papan, sebelah kiri kotak 1).
export const cx = (n) => {
  if (n <= 0) return [-5, 95];
  const r = Math.floor((n - 1) / 10),
    k = (n - 1) % 10,
    c = r % 2 ? 9 - k : k;
  return [c * 10 + 5, (9 - r) * 10 + 5];
};

// Titik-titik tubuh ular dari kepala (kotak a) ke ekor (kotak b).
// Dipakai untuk menggambar ular DAN untuk jalur bidak yang meluncur turun.
export function snakePts(a, b, N = 40) {
  const [x1, y1] = cx(a),
    [x2, y2] = cx(b);
  const dx = x2 - x1,
    dy = y2 - y1,
    L = Math.hypot(dx, dy),
    nx = -dy / L,
    ny = dx / L;
  return Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N,
      o = Math.sin(t * Math.PI * 4) * 2.2 * (0.35 + 0.65 * (1 - t));
    return [x1 + dx * t + nx * o, y1 + dy * t + ny * o];
  });
}

// Kotak-kotak yang dilewati satu per satu untuk dadu d dari kotak `from`.
// Kalau melewati 100, bidak memantul balik (sama dengan aturan server).
export function hopSquares(from, d) {
  const out = [];
  let p = from,
    dir = 1;
  for (let i = 0; i < d; i++) {
    if (p + dir > 100) dir = -1;
    p += dir;
    out.push(p);
  }
  return out;
}
