// Data papan Ular Tangga (dipakai server dan browser)
// Kunci = kotak awal, nilai = kotak tujuan.
export const LADDERS = { 2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94 };
export const SNAKES = { 16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80 };
export const COLORS = ['#2F6BFF', '#FF6B9A', '#3DD68C', '#FFB020', '#7C3AED', '#22C1E8'];
export const LEVELS = [
  ['mudah', 'Mudah', 'Pengetahuan dasar'],
  ['sedang', 'Sedang', 'Setara SMP–SMA'],
  ['sulit', 'Sulit', 'Menuntut penalaran'],
  ['olimpiade', 'WNI', 'Soal seleksi olimpiade'],
];

// Pusat kotak n dalam koordinat papan 0..100 (kotak 1 di kiri bawah, jalur zig-zag).
// n = 0 berarti belum mulai (di luar papan, sebelah kiri kotak 1).
export const cx = (n) => {
  if (n <= 0) return [-5, 95];
  const r = Math.floor((n - 1) / 10), k = (n - 1) % 10, c = r % 2 ? 9 - k : k;
  return [c * 10 + 5, (9 - r) * 10 + 5];
};

// Titik-titik tubuh ular dari kepala (kotak a) ke ekor (kotak b).
// Dipakai untuk menggambar ular DAN untuk jalur bidak yang meluncur turun.
export function snakePts(a, b, N = 40) {
  const [x1, y1] = cx(a), [x2, y2] = cx(b);
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  return Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N, o = Math.sin(t * Math.PI * 4) * 2.2 * (0.35 + 0.65 * (1 - t));
    return [x1 + dx * t + nx * o, y1 + dy * t + ny * o];
  });
}

// Kotak-kotak yang dilewati satu per satu untuk dadu d dari kotak `from`.
// Kalau melewati 100, bidak memantul balik (sama dengan aturan server).
export function hopSquares(from, d) {
  const out = [];
  let p = from, dir = 1;
  for (let i = 0; i < d; i++) {
    if (p + dir > 100) dir = -1;
    p += dir;
    out.push(p);
  }
  return out;
}
