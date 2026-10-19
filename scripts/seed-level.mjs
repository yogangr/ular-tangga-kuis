// Menambah tingkat kesulitan (mudah, sedang, sulit, olimpiade) + soal baru tiap tingkat.
// Jalankan SETELAH npm run seed dan npm run seed:umum:   npm run seed:level
// Aman dijalankan berulang. Soal hitungan dibuat acak, dan jawabannya dihitung oleh program.
import { neon } from '@neondatabase/serverless';

const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const sh = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = r(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fact = (n) => { let x = 1n; for (let i = 2n; i <= BigInt(n); i++) x *= i; return x; };
const C = (n, k) => { let x = 1n; for (let i = 1n; i <= BigInt(k); i++) x = (x * (BigInt(n) - i + 1n)) / i; return x; };
const mp = (b, e, m) => { let x = 1n; b = BigInt(b) % BigInt(m); e = BigInt(e); m = BigInt(m); while (e > 0n) { if (e & 1n) x = (x * b) % m; b = (b * b) % m; e >>= 1n; } return x; };
const isP = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
// tiga pengecoh dekat dengan jawaban (max: batas atas opsional, mis. untuk sisa pembagian)
const w3 = (a, max = null) => {
  a = BigInt(a); const big = a > 100n; const s = big ? 10n ** BigInt(String(a).length - 2) : 1n;
  const o = new Set(); let g = 0;
  while (o.size < 3 && g++ < 800) {
    const d = BigInt(r(-4, 4)) * s + (big ? BigInt(r(-2, 2)) : 0n); const v = a + d;
    if (d !== 0n && v >= 0n && (max == null || v < BigInt(max))) o.add(v);
  }
  return [...o];
};

const rows = [];
const add = (l, c, q, a, w) => rows.push({ l, c, q, a: String(a), w: w.map(String) });
const lines = (l, txt) => txt.trim().split('\n').forEach((x) => { const [c, q, a, ...w] = x.split('|'); add(l, c, q, a, w); });

// ============ SEDANG (cat|soal|benar|salah1|salah2|salah3) ============
lines('sedang', `Sains|Satuan tekanan dalam SI adalah|Pascal|Newton|Joule|Watt
Sains|Bilangan Avogadro bernilai sekitar|6,02 × 10²³|3,00 × 10⁸|9,8|1,6 × 10⁻¹⁹
Sains|Organel penghasil energi (ATP) pada sel adalah|Mitokondria|Ribosom|Lisosom|Badan Golgi
Sains|Hormon yang menurunkan kadar gula darah adalah|Insulin|Adrenalin|Tiroksin|Glukagon
Sains|Unsur dengan lambang Au adalah|Emas|Perak|Aluminium|Argon
Sains|Ikatan kimia pada senyawa NaCl adalah ikatan|Ion|Kovalen|Logam|Hidrogen
Sains|Pembelahan sel yang menghasilkan sel kelamin disebut|Meiosis|Mitosis|Amitosis|Fragmentasi
Sains|Kecepatan 72 km/jam sama dengan|20 m/s|72 m/s|10 m/s|36 m/s
Sains|Rumus kimia asam sulfat adalah|H₂SO₄|HCl|HNO₃|H₃PO₄
Sains|Hukum Newton III menyatakan bahwa|Setiap aksi menimbulkan reaksi yang sama besar dan berlawanan arah|Benda diam tetap diam|Gaya sama dengan massa dikali percepatan|Energi tidak dapat diciptakan
Matematika|Hasil dari 2⁵ − 3² adalah|23|7|1|13
Matematika|Nilai x dari persamaan 3x − 7 = 2x + 5 adalah|12|2|-2|-12
Matematika|Gradien garis y = 3x + 5 adalah|3|5|-3|1/3
Matematika|Jumlah besar sudut dalam segi lima adalah|540°|360°|720°|450°
Matematika|Luas permukaan kubus dengan rusuk 4 cm adalah|96 cm²|64 cm²|48 cm²|16 cm²
Matematika|Nilai sin 30° adalah|1/2|√3/2|√2/2|1
Matematika|Hasil dari (−3)³ adalah|−27|27|−9|9
Matematika|Sisi miring segitiga siku-siku dengan sisi tegak 6 dan 8 adalah|10|12|14|9
Sejarah|Perang Diponegoro berlangsung pada tahun|1825–1830|1811–1816|1873–1904|1945–1949
Sejarah|Pemberontakan PKI di Madiun terjadi pada tahun|1948|1926|1965|1950
Sejarah|Pasukan Sekutu yang mendarat di Indonesia setelah Proklamasi disebut|AFNEI|PETA|KNIL|APRIS
Sejarah|Candi Borobudur dibangun pada masa dinasti|Syailendra|Sanjaya|Isyana|Warmadewa
Geografi|Negara ASEAN yang tidak memiliki garis pantai adalah|Laos|Kamboja|Myanmar|Vietnam
Geografi|Palung laut terdalam di dunia adalah Palung|Mariana|Jawa|Puerto Riko|Tonga
Geografi|Sungai terpanjang di Indonesia adalah Sungai|Kapuas|Mahakam|Musi|Barito
Ekonomi|Menurut hukum permintaan, jika harga naik maka jumlah barang yang diminta cenderung|Turun|Naik|Tetap|Tak terhingga
Teknologi|Kepanjangan HTTP adalah|HyperText Transfer Protocol|High Transfer Text Program|HyperText Transmission Process|Host Text Transfer Protocol
Bahasa|Kata baku dari "ijin" adalah|Izin|Ijin|Idzin|Isin
Bahasa|Kata "namun" tergolong jenis kata|Konjungsi|Preposisi|Adverbia|Interjeksi`);

// ============ SULIT: soal tulisan tangan ============
lines('sulit', `Sejarah|Perjanjian Giyanti 1755 membagi Kerajaan Mataram menjadi|Surakarta dan Yogyakarta|Banten dan Cirebon|Demak dan Pajang|Gowa dan Tallo
Sejarah|Perjanjian Salatiga 1757 melahirkan wilayah|Mangkunegaran|Pakualaman|Kasepuhan|Kanoman
Sejarah|Perjanjian Renville ditandatangani di atas kapal milik|Amerika Serikat|Belanda|Inggris|Australia
Sejarah|Pemberontakan DI/TII di Jawa Barat dipimpin oleh|S.M. Kartosuwiryo|Kahar Muzakar|Daud Beureueh|Ibnu Hajar
Sejarah|Dekret Presiden 5 Juli 1959 menyatakan kembali berlakunya|UUD 1945|UUDS 1950|Konstitusi RIS|Piagam Jakarta
Sejarah|Konstantinopel jatuh ke tangan Kesultanan Utsmaniyah pada tahun|1453|1492|1204|1517
Sejarah|Perjanjian Westphalia 1648 mengakhiri|Perang Tiga Puluh Tahun|Perang Seratus Tahun|Perang Salib Pertama|Perang Napoleon
Sejarah|Magna Carta ditandatangani di Inggris pada tahun|1215|1066|1415|1688
Sejarah|Hukum tertulis terkenal Hammurabi berasal dari peradaban|Babilonia|Mesir Kuno|Romawi|Persia
Sejarah|Tokoh pemimpin kaum Padri yang terkenal adalah|Tuanku Imam Bonjol|Pangeran Antasari|Sisingamangaraja XII|Teuku Umar
Geografi|Garis Wallace memisahkan persebaran fauna antara Pulau Bali dan|Lombok|Jawa|Sumbawa|Flores
Geografi|Selat yang memisahkan Asia dan Amerika Utara adalah Selat|Bering|Gibraltar|Hormuz|Magellan
Geografi|Danau terdalam di dunia adalah Danau|Baikal|Victoria|Toba|Superior
Geografi|Sungai terpanjang di Eropa adalah Sungai|Volga|Danube|Rhine|Seine
Geografi|Negara yang tidak memiliki garis pantai adalah|Paraguay|Chili|Peru|Ekuador
Sastra|Novel Salah Asuhan ditulis oleh|Abdoel Moeis|Marah Rusli|Armijn Pane|Hamka
Sastra|Novel Layar Terkembang ditulis oleh|Sutan Takdir Alisjahbana|Armijn Pane|Hamka|Sanusi Pane
Sastra|Novel Belenggu ditulis oleh|Armijn Pane|Abdoel Moeis|Hamka|Marah Rusli
Sastra|Ungkapan "Cogito, ergo sum" diucapkan oleh filsuf|René Descartes|Plato|Immanuel Kant|Aristoteles
Ekonomi|Kurva yang menggambarkan hubungan inflasi dan pengangguran adalah kurva|Phillips|Lorenz|Laffer|Engel
Ekonomi|Ukuran ketimpangan pendapatan dengan nilai 0 sampai 1 adalah koefisien|Gini|Pearson|Lorenz|Engel
Ekonomi|Penulis buku The Wealth of Nations adalah|Adam Smith|Karl Marx|John Maynard Keynes|David Ricardo
Sains|Prinsip bahwa posisi dan momentum partikel tak dapat diketahui pasti bersamaan adalah prinsip ketidakpastian|Heisenberg|Pauli|Schrödinger|Bohr
Sains|Partikel pembawa gaya elektromagnetik adalah|Foton|Gluon|Boson W|Graviton
Sains|Hukum Boyle menyatakan hubungan tekanan dan volume gas pada|Suhu tetap|Tekanan tetap|Volume tetap|Massa berubah
Sains|Bintang tampak berkelap-kelip karena gejala yang disebut|Skintilasi|Difraksi|Polarisasi|Dispersi
Teknologi|Protokol enkripsi yang mengamankan koneksi HTTPS adalah|TLS|FTP|SMTP|DHCP
Teknologi|Struktur data yang bekerja dengan prinsip LIFO adalah|Stack|Queue|Array|Graph`);

// ============ OLIMPIADE: soal tulisan tangan ============
lines('olimpiade', `Fisika|Bola dijatuhkan dari ketinggian h dan memantul dengan koefisien restitusi e = 1/2 pada tiap tumbukan. Total jarak yang ditempuh bola sampai berhenti adalah|5h/3|3h/2|2h|5h/4
Fisika|Periode ayunan bandul sederhana di Bumi adalah T. Di planet dengan percepatan gravitasi 1/4 kali Bumi, periodenya menjadi|2T|T/2|4T|T/4
Fisika|Pegas berkonstanta k dipotong menjadi dua bagian sama panjang. Konstanta tiap potongan adalah|2k|k/2|k|4k
Fisika|Dua kapasitor identik C disusun seri, lalu diparalelkan dengan kapasitor ketiga C. Kapasitansi totalnya adalah|3C/2|2C/3|2C|C/2
Fisika|Energi kinetik satelit bermassa m yang mengorbit Bumi (massa M) pada lintasan lingkaran berjari-jari r adalah|GMm/(2r)|GMm/r|GMm/(4r)|2GMm/r
Fisika|Kecepatan lepas dari Bumi 11,2 km/s. Planet bermassa sama dengan Bumi tetapi berjari-jari 4 kali Bumi memiliki kecepatan lepas|5,6 km/s|2,8 km/s|22,4 km/s|11,2 km/s
Fisika|Planet mengitari Matahari pada jarak 4 kali jarak Bumi–Matahari. Periode revolusinya adalah|8 tahun|4 tahun|16 tahun|64 tahun
Fisika|Suhu mutlak gas ideal dijadikan 4 kali semula. Kecepatan rms molekulnya menjadi|2 kali|4 kali|16 kali|√2 kali
Fisika|Silinder pejal, bola pejal, dan cincin tipis bermassa dan berjari-jari sama menggelinding tanpa selip dari bidang miring yang sama. Yang tiba paling dahulu adalah|Bola pejal|Silinder pejal|Cincin tipis|Ketiganya bersamaan
Fisika|Gelombang berdiri pada tali dengan kedua ujung terikat memiliki 3 perut. Panjang tali sama dengan ... panjang gelombang|3/2|3|1/2|2
Fisika|Kawat ditarik hingga panjangnya 3 kali semula dengan volume tetap. Hambatannya menjadi|9 kali|3 kali|6 kali|1/9 kali
Kimia|Jumlah mol atom oksigen dalam 4,4 gram CO₂ (Ar C = 12, O = 16) adalah|0,2 mol|0,1 mol|0,4 mol|0,44 mol
Kimia|pH larutan Ba(OH)₂ 0,01 M (log 2 = 0,3) adalah|12,3|12|13|11,7
Kimia|Jumlah elektron valensi atom dengan nomor atom 33 adalah|5|3|4|7
Kimia|Bentuk molekul XeF₄ menurut teori VSEPR adalah|Segi empat planar|Tetrahedral|Oktahedral|Piramida segi empat
Kimia|Bilangan oksidasi Mn dalam KMnO₄ adalah|+7|+4|+6|+2
Kimia|Konfigurasi elektron ion Fe³⁺ (nomor atom 26) adalah|[Ar] 3d⁵|[Ar] 3d⁶|[Ar] 4s² 3d³|[Ar] 3d³
Kimia|Unsur dengan energi ionisasi pertama tertinggi adalah|Helium|Neon|Fluorin|Hidrogen
Kimia|Reaksi orde pertama memiliki waktu paruh 10 menit. Bagian zat yang tersisa setelah 40 menit adalah|1/16|1/8|1/4|1/2
Kimia|Hibridisasi atom pusat pada molekul BF₃ adalah|sp²|sp³|sp|sp³d
Biologi|Enzim yang mengikat CO₂ pada tahap awal siklus Calvin adalah|RuBisCO|Katalase|Amilase|ATP sintase
Biologi|Hasil bersih ATP langsung dari glikolisis satu molekul glukosa adalah|2|4|36|38
Biologi|Persilangan dihibrid AaBb × AaBb (dominan penuh) menghasilkan perbandingan fenotipe|9 : 3 : 3 : 1|1 : 2 : 1|3 : 1|1 : 1 : 1 : 1
Biologi|Pada populasi seimbang Hardy-Weinberg, frekuensi alel resesif q = 0,2. Frekuensi genotipe heterozigot adalah|0,32|0,16|0,04|0,64
Biologi|Pindah silang (crossing over) terjadi pada tahap|Profase I meiosis|Profase mitosis|Anafase II meiosis|Metafase I meiosis
Biologi|Hormon yang memicu ovulasi pada siklus menstruasi adalah|LH|FSH|Progesteron|Estrogen
Biologi|Jika basa DNA cetakan 3'-TAC-5', kodon mRNA yang terbentuk adalah|5'-AUG-3'|5'-UAC-3'|5'-ATG-3'|5'-AUC-3'
Biologi|Sel anak hasil meiosis II dari sel tubuh manusia memiliki jumlah kromosom|23|46|92|44
Biologi|Rantai transpor elektron respirasi aerob pada eukariota berada di|Membran dalam mitokondria|Matriks mitokondria|Sitosol|Membran luar mitokondria
Astronomi|Magnitudo semu sama dengan magnitudo mutlak jika bintang berjarak|10 parsek|1 parsek|100 parsek|1 tahun cahaya
Astronomi|Satu parsek setara dengan sekitar|3,26 tahun cahaya|1 tahun cahaya|9,46 tahun cahaya|206 tahun cahaya
Astronomi|Tipe spektrum bintang dengan suhu permukaan tertinggi adalah|O|M|G|A
Astronomi|Jika sebuah bintang dua kali lebih jauh, fluks cahaya yang diterima Bumi menjadi|1/4 kali|1/2 kali|1/8 kali|2 kali
Informatika|Hasil penjumlahan biner 1011 + 0110 adalah|10001|10011|10101|1111
Informatika|Bilangan desimal 45 dalam biner adalah|101101|101011|110101|100111
Informatika|Kompleksitas waktu pencarian biner pada larik terurut berisi n elemen adalah|O(log n)|O(n)|O(n log n)|O(1)
Informatika|Bilangan heksadesimal 2F bernilai desimal|47|37|45|63
Logika|Di sebuah pulau, ksatria selalu jujur dan penipu selalu berbohong. A berkata "Kami berdua penipu." Maka|A penipu dan B ksatria|A ksatria dan B penipu|Keduanya ksatria|Keduanya penipu
Logika|A, B, C: tepat satu yang jujur. A: "B pembohong." B: "C pembohong." C: "A dan B pembohong." Yang jujur adalah|B|A|C|Tidak dapat ditentukan`);

// ============ SULIT: soal hitungan (jawaban dihitung program) ============
for (let k = 0; k < 40; k++) { const a = r(1, 5), b = r(1, 4), c = r(1, 3), N = 2 ** a * 3 ** b * 5 ** c, v = (a + 1) * (b + 1) * (c + 1); add('sulit', 'Teori Bilangan', `Banyak faktor positif dari ${N} adalah`, v, w3(v)); }
for (let k = 0; k < 40; k++) { const a = [2, 3, 4, 6, 7, 8, 9][r(0, 6)], b = r(20, 300), v = mp(a, b, 10); const o = sh([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => BigInt(x) !== v)).slice(0, 3); add('sulit', 'Teori Bilangan', `Angka satuan dari ${a}^${b} adalah`, v, o); }
for (let k = 0; k < 40; k++) { const n = r(25, 250); let z = 0; for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p); add('sulit', 'Teori Bilangan', `Bilangan ${n}! diakhiri oleh berapa angka nol berurutan?`, z, w3(z)); }
for (let k = 0; k < 30; k++) { const n = r(9, 30); add('sulit', 'Kombinatorika', `Banyak diagonal pada segi-${n} beraturan adalah`, (n * (n - 3)) / 2, w3((n * (n - 3)) / 2)); }
for (let k = 0; k < 30; k++) { const n = r(8, 16), m = r(2, 5), v = C(n, m); add('sulit', 'Kombinatorika', `Dari ${n} orang akan dipilih ${m} orang untuk menjadi panitia. Banyak cara memilih adalah`, v, w3(v)); }
for (const w of ['MATEMATIKA', 'MISSISSIPPI', 'BANANA', 'KALKULUS', 'INDONESIA', 'ALJABAR', 'STATISTIKA', 'PROGRAMMER']) {
  const cnt = {}; for (const ch of w) cnt[ch] = (cnt[ch] || 0) + 1;
  let v = fact(w.length); for (const c of Object.values(cnt)) v /= fact(c);
  add('sulit', 'Kombinatorika', `Banyak susunan berbeda dari huruf-huruf pada kata ${w} adalah`, v, w3(v));
}
for (let k = 0; k < 30; k++) { const a = r(2, 9), d = r(2, 7), n = r(15, 40), v = (n * (2 * a + (n - 1) * d)) / 2; add('sulit', 'Aljabar', `Jumlah ${n} suku pertama deret aritmetika ${a}, ${a + d}, ${a + 2 * d}, ... adalah`, v, w3(v)); }
for (let k = 0; k < 30; k++) { const S = r(5, 15), P = r(1, 20), v = S * S - 2 * P; add('sulit', 'Aljabar', `Jika a + b = ${S} dan ab = ${P}, maka a² + b² =`, v, w3(v)); }
for (let k = 0; k < 20; k++) {
  const p = r(10, 60), q = p + r(14, 30); let v = 0; for (let i = p + 1; i < q; i++) if (isP(i)) v += i;
  add('sulit', 'Teori Bilangan', `Jumlah semua bilangan prima di antara ${p} dan ${q} adalah`, v, w3(v));
}
for (let k = 0; k < 30; k++) { const g = r(6, 36), m = r(5, 40), n = r(5, 40), x = g * m, y = g * n, d = gcd(x, y); add('sulit', 'Teori Bilangan', `KPK dari ${x} dan ${y} adalah`, (x * y) / d, w3((x * y) / d)); }
for (let k = 0; k < 25; k++) { const n = r(10, 40); add('sulit', 'Teori Bilangan', `Jumlah semua angka penyusun bilangan 2^${n} adalah`, [...(2n ** BigInt(n)).toString()].reduce((s, c) => s + +c, 0), []); }
// perbaiki pengecoh untuk soal jumlah digit
for (const x of rows) if (x.l === 'sulit' && x.q.startsWith('Jumlah semua angka penyusun') && x.w.length === 0) x.w = w3(+x.a).map(String);
{
  const f = (c) => { const g = gcd(c, 36); return `${c / g}/${36 / g}`; };
  for (let s = 3; s <= 11; s++) {
    if (s === 7) continue;
    const c = 6 - Math.abs(s - 7), a = f(c);
    const o = sh([...new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((t) => f(6 - Math.abs(t - 7))))].filter((x) => x !== a)).slice(0, 3);
    add('sulit', 'Kombinatorika', `Dua dadu dilempar bersamaan. Peluang jumlah mata dadu sama dengan ${s} adalah`, a, o);
  }
}

// ============ OLIMPIADE: soal hitungan ============
for (let k = 0; k < 70; k++) {
  const a = [2, 3, 7, 11, 13][r(0, 4)], b = r(200, 4999), m = [7, 9, 11, 13, 17, 19, 23, 25, 100, 1000][r(0, 9)], v = mp(a, b, m);
  add('olimpiade', 'Teori Bilangan', `Sisa pembagian ${a}^${b} oleh ${m} adalah`, v, w3(v, m));
}
for (let k = 0; k < 30; k++) {
  const a = [3, 7, 9, 11, 13, 17, 19, 21, 23][r(0, 8)], b = r(100, 2026), v = mp(a, b, 100).toString().padStart(2, '0');
  const o = new Set(); while (o.size < 3) { const x = String(r(0, 99)).padStart(2, '0'); if (x !== v) o.add(x); }
  add('olimpiade', 'Teori Bilangan', `Dua angka terakhir dari ${a}^${b} adalah`, v, [...o]);
}
for (let k = 0; k < 30; k++) {
  const kk = r(3, 5), n = r(8, 20), xs = Array.from({ length: kk }, (_, i) => 'x' + (i + 1)).join(' + ');
  if (k % 2) { const v = C(n + kk - 1, kk - 1); add('olimpiade', 'Kombinatorika', `Banyak penyelesaian bilangan bulat tak negatif dari ${xs} = ${n} adalah`, v, w3(v)); }
  else { const v = C(n - 1, kk - 1); add('olimpiade', 'Kombinatorika', `Banyak penyelesaian bilangan bulat positif dari ${xs} = ${n} adalah`, v, w3(v)); }
}
for (let k = 0; k < 25; k++) { // jumlah semua faktor positif
  const a = r(1, 4), b = r(1, 3), c = r(0, 2), N = 2 ** a * 3 ** b * 5 ** c; let s = 0; for (let i = 1; i <= N; i++) if (N % i === 0) s += i;
  add('olimpiade', 'Teori Bilangan', `Jumlah semua faktor positif dari ${N} adalah`, s, w3(s));
}
for (let k = 0; k < 30; k++) {
  const [p, q] = [[2, 3], [3, 4], [3, 5], [4, 5], [5, 7], [2, 7], [3, 7], [4, 7]][r(0, 7)], N = r(100, 1000); let v = 0;
  for (let i = 1; i <= N; i++) if ((i % p === 0) !== (i % q === 0)) v++;
  add('olimpiade', 'Kombinatorika', `Banyak bilangan bulat dari 1 sampai ${N} yang habis dibagi tepat salah satu dari ${p} dan ${q} adalah`, v, w3(v));
}
for (const M of [36, 45, 60, 72, 84, 90, 100, 120, 126, 150, 180, 210, 240, 360, 420, 504, 630]) {
  let v = 0; for (let i = 1; i <= M; i++) if (gcd(i, M) === 1) v++;
  add('olimpiade', 'Teori Bilangan', `Banyak bilangan bulat positif yang tidak melebihi ${M} dan relatif prima dengan ${M} adalah`, v, w3(v));
}
{ let d = [1n, 0n]; for (let n = 2; n <= 9; n++) { d[n] = BigInt(n - 1) * (d[n - 1] + d[n - 2]); if (n >= 4) add('olimpiade', 'Kombinatorika', `Banyak cara memasukkan ${n} surat ke ${n} amplop sehingga tidak ada satu pun surat yang masuk ke amplop yang benar adalah`, d[n], w3(d[n])); } }
for (let k = 0; k < 25; k++) {
  if (k % 2) { const n = r(12, 28); let a = 1n, b = 1n, s = 1n + 1n; for (let i = 3; i <= n; i++) { [a, b] = [b, a + b]; s += b; } add('olimpiade', 'Teori Bilangan', `Barisan Fibonacci: F₁ = 1, F₂ = 1, Fₙ = Fₙ₋₁ + Fₙ₋₂. Nilai F₁ + F₂ + ... + F${n} adalah`, s, w3(s)); }
  else { const n = r(60, 300), m = r(3, 11); let a = 0n, b = 1n; for (let i = 0; i < n; i++) [a, b] = [b % BigInt(m), (a + b) % BigInt(m)]; const o = sh([...Array(m).keys()].filter((x) => BigInt(x) !== a)).slice(0, 3); add('olimpiade', 'Teori Bilangan', `Barisan Fibonacci: F₁ = 1, F₂ = 1, Fₙ = Fₙ₋₁ + Fₙ₋₂. Sisa pembagian F${n} oleh ${m} adalah`, a, o); }
}
for (let k = 3; k <= 9; k++) {
  add('olimpiade', 'Kombinatorika', `Minimal berapa orang agar pasti ada ${k} orang yang lahir pada bulan yang sama?`, 12 * (k - 1) + 1, w3(12 * (k - 1) + 1));
  add('olimpiade', 'Kombinatorika', `Minimal berapa orang agar pasti ada ${k} orang yang lahir pada hari yang sama dalam seminggu?`, 7 * (k - 1) + 1, w3(7 * (k - 1) + 1));
}
for (let k = 0; k < 25; k++) { const [a, b, c] = sh([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), v = 222 * (a + b + c); add('olimpiade', 'Aljabar', `Semua bilangan tiga angka berbeda yang dapat disusun dari angka ${a}, ${b}, dan ${c} dijumlahkan. Hasilnya adalah`, v, w3(v)); }
for (let k = 0; k < 25; k++) { const n = r(8, 14), m = r(4, 6), v = C(n, 3) - C(m, 3); add('olimpiade', 'Kombinatorika', `Dari ${n} titik pada bidang, ${m} titik di antaranya segaris dan tidak ada tiga titik lain yang segaris. Banyak segitiga yang dapat dibentuk adalah`, v, w3(v)); }
for (let k = 0; k < 30; k++) { const S = r(3, 9), P = r(1, 15), q = S * S - 2 * P, v = q * q - 2 * P * P; add('olimpiade', 'Aljabar', `Jika a + b = ${S} dan ab = ${P}, maka a⁴ + b⁴ =`, v, w3(v)); }
for (let k = 0; k < 35; k++) {
  const a = r(1, 6), b = r(1, 6), c = r(0, 3); const v = (2 * a + 1) * (2 * b + 1) * (2 * c + 1), N = `2^${a} · 3^${b}` + (c ? ` · 5^${c}` : '');
  add('olimpiade', 'Teori Bilangan', `Banyak pasangan terurut bilangan bulat positif (x, y) yang memenuhi KPK(x, y) = ${N} adalah`, v, w3(v));
}

// ---------- Rapikan & periksa ----------
const uniq = [...new Map(rows.map((x) => [x.q, x])).values()]
  .filter((x) => x.w.length === 3 && !x.w.includes(x.a) && new Set([x.a, ...x.w]).size === 4);
const stat = {};
for (const x of uniq) stat[x.l] = (stat[x.l] || 0) + 1;
console.log('Soal baru per tingkat:', stat);
if (process.env.DRY) { console.log(JSON.stringify(uniq.filter((x) => x.l === 'olimpiade').slice(0, 3))); process.exit(0); }

const sql = neon(process.env.DATABASE_URL);
await sql`alter table questions add column if not exists level text not null default 'mudah'`;
await sql`alter table scores add column if not exists level text not null default 'mudah'`;
await sql`create index if not exists questions_level on questions(level)`;
await sql`create index if not exists scores_level_mode_day on scores(level, mode, day)`;
// Tentukan tingkat soal lama sekali saja (hanya jika belum ada soal bertingkat lain)
await sql`update questions set level = 'sedang'
  where level = 'mudah'
    and cat = any(${['Sejarah Dunia', 'Sejarah Indonesia', 'Fisika & Kimia', 'Seni & Sastra', 'Tokoh & Penemuan', 'Ekonomi', 'Lingkungan', 'Alam Semesta']})
    and not exists (select 1 from questions q2 where q2.level <> 'mudah')`;
await sql`insert into questions(cat, q, answer, wrong, level)
  select x->>'c', x->>'q', x->>'a', array(select jsonb_array_elements_text(x->'w')), x->>'l'
  from jsonb_array_elements(${JSON.stringify(uniq)}::jsonb) x
  on conflict (q) do nothing`;
const per = await sql`select level, count(*)::int as n from questions group by level order by n desc`;
console.log('Isi bank soal sekarang:', per);
