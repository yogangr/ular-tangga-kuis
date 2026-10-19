// Mengisi database Neon: membuat tabel, lalu memasukkan ratusan soal umum.
// Jalankan: npm run seed  (aman dijalankan berulang; soal yang sama dilewati,
// soal hitungan acak akan menambah isi bank soal setiap kali dijalankan).
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const sh = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = r(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const CAT = { g: 'Geografi', s: 'Sains', h: 'Sejarah', b: 'Budaya', t: 'Teknologi', e: 'Bahasa Inggris' };
const rows = [];
const add = (c, q, a, w) => rows.push({ c, q, a: String(a), w: w.map(String) });
const wn = (a) => { const s = new Set(); while (s.size < 3) { const d = r(-9, 9); if (d && a + d >= 0) s.add(a + d); } return [...s]; };

// ---- Soal tulisan tangan. Format: kategori|soal|jawaban benar|salah 1|salah 2|salah 3
// Tambahkan soal sendiri di sini, lalu jalankan npm run seed lagi.
`g|Benua terkecil di dunia adalah|Australia|Eropa|Antartika|Amerika Selatan
g|Samudra terluas di dunia adalah|Pasifik|Atlantik|Hindia|Arktik
g|Gunung tertinggi di dunia adalah|Everest|K2|Kilimanjaro|Fuji
g|Negara terluas di dunia adalah|Rusia|Kanada|Tiongkok|Amerika Serikat
g|Danau terbesar di Indonesia adalah|Danau Toba|Danau Singkarak|Danau Poso|Danau Sentani
g|Pulau di Indonesia dengan penduduk terbanyak adalah|Jawa|Sumatra|Kalimantan|Sulawesi
g|Garis khayal yang membagi bumi menjadi belahan utara dan selatan adalah|Khatulistiwa|Meridian utama|Garis tanggal|Kutub
g|Menara Eiffel terdapat di negara|Prancis|Italia|Spanyol|Jerman
g|Piramida Giza terdapat di negara|Mesir|Meksiko|Sudan|Irak
g|Taj Mahal terdapat di negara|India|Pakistan|Bangladesh|Nepal
g|Candi Borobudur terdapat di kabupaten|Magelang|Sleman|Klaten|Semarang
s|Planet terbesar di tata surya adalah|Jupiter|Saturnus|Neptunus|Bumi
s|Satelit alami bumi adalah|Bulan|Mars|Titan|Phobos
s|Jumlah kaki laba-laba adalah|8|6|10|4
s|Hewan darat tercepat di dunia adalah|Cheetah|Singa|Kuda|Macan tutul
s|Mamalia terbesar di dunia adalah|Paus biru|Gajah afrika|Hiu paus|Jerapah
s|Gas paling banyak di atmosfer bumi adalah|Nitrogen|Oksigen|Karbon dioksida|Argon
s|Jumlah tulang manusia dewasa adalah|206|180|250|300
s|Organ terbesar tubuh manusia adalah|Kulit|Hati|Paru-paru|Usus
s|Alat untuk mengukur suhu adalah|Termometer|Barometer|Higrometer|Speedometer
s|Jumlah warna utama pada pelangi adalah|7|5|6|8
s|Logam yang berwujud cair pada suhu ruang adalah|Raksa|Besi|Tembaga|Aluminium
s|Sel darah yang mengangkut oksigen adalah|Sel darah merah|Sel darah putih|Trombosit|Plasma
s|Bunyi tidak dapat merambat melalui|Ruang hampa|Air|Udara|Besi
s|Vitamin yang dibentuk tubuh dengan bantuan sinar matahari adalah|Vitamin D|Vitamin C|Vitamin A|Vitamin B12
s|Perubahan ulat menjadi kupu-kupu disebut|Metamorfosis|Fotosintesis|Evaporasi|Adaptasi
s|Ilmu yang mempelajari bintang dan planet adalah|Astronomi|Geologi|Biologi|Meteorologi
s|Kecepatan cahaya sekitar|300.000 km/detik|30.000 km/detik|3.000 km/detik|3 juta km/detik
h|Candi Prambanan merupakan candi bercorak|Hindu|Buddha|Islam|Kristen
h|Kerajaan Hindu tertua di Indonesia adalah|Kutai|Majapahit|Sriwijaya|Mataram
h|Patih Majapahit yang mengucapkan Sumpah Palapa adalah|Gajah Mada|Hayam Wuruk|Raden Wijaya|Airlangga
h|Pahlawan perempuan dari Aceh yang gigih melawan Belanda adalah|Cut Nyak Dien|R.A. Kartini|Dewi Sartika|Rohana Kudus
h|Hari Kartini diperingati setiap tanggal|21 April|2 Mei|20 Mei|28 Oktober
h|Hari Pendidikan Nasional diperingati setiap tanggal|2 Mei|20 Mei|21 April|17 Agustus
h|Hari Kebangkitan Nasional diperingati setiap tanggal|20 Mei|2 Mei|1 Juni|28 Oktober
h|Hari Pahlawan diperingati setiap tanggal|10 November|17 Agustus|28 Oktober|1 Juni
h|Perang Dunia II berakhir pada tahun|1945|1939|1918|1950
h|Penemu bola lampu pijar yang dikenal luas adalah|Thomas Edison|Nikola Tesla|Alexander Graham Bell|Isaac Newton
h|Penemu teori gravitasi adalah|Isaac Newton|Albert Einstein|Galileo Galilei|Aristoteles
h|Pelukis lukisan Mona Lisa adalah|Leonardo da Vinci|Michelangelo|Pablo Picasso|Vincent van Gogh
h|Pesawat terbang bermotor pertama diterbangkan oleh|Wright bersaudara|B.J. Habibie|Thomas Edison|Graham Bell
h|Semboyan Bhinneka Tunggal Ika berarti|Berbeda-beda tetapi tetap satu|Bersatu kita teguh|Maju tak gentar|Satu nusa satu bangsa
h|Lambang negara Indonesia adalah|Garuda Pancasila|Elang Jawa|Harimau|Banteng
b|Alat musik tradisional Jawa Barat yang terbuat dari bambu adalah|Angklung|Sasando|Tifa|Sampek
b|Tari Kecak berasal dari daerah|Bali|Jawa|Sumatra|Papua
b|Rumah adat Minangkabau adalah|Rumah Gadang|Joglo|Honai|Tongkonan
b|Rumah adat Toraja adalah|Tongkonan|Rumah Gadang|Honai|Joglo
b|Alat musik dari daun lontar khas Nusa Tenggara Timur adalah|Sasando|Angklung|Kolintang|Gamelan
b|Senjata tradisional khas Jawa adalah|Keris|Rencong|Mandau|Badik
b|Rencong adalah senjata tradisional dari|Aceh|Kalimantan|Bali|Sulawesi
b|Rendang berasal dari daerah|Sumatra Barat|Jawa Tengah|Bali|Sulawesi Selatan
b|Gudeg adalah makanan khas kota|Yogyakarta|Medan|Manado|Makassar
b|Pempek adalah makanan khas kota|Palembang|Padang|Bandung|Pontianak
b|Jumlah pemain inti sepak bola dalam satu tim adalah|11|9|10|12
b|Jumlah cincin pada lambang Olimpiade adalah|5|4|6|7
b|Bela diri yang berasal dari Korea adalah|Taekwondo|Judo|Karate|Kendo
t|Kepanjangan dari CPU adalah|Central Processing Unit|Central Program Unit|Computer Power Unit|Core Processing Utility
t|Pendiri perusahaan Microsoft adalah|Bill Gates|Steve Jobs|Mark Zuckerberg|Elon Musk
t|Perangkat yang menampilkan hasil kerja komputer adalah|Monitor|Keyboard|Mouse|Scanner
t|Kepanjangan dari WWW adalah|World Wide Web|World Web Wire|Wide World Web|Web World Wide
t|Satu byte sama dengan|8 bit|4 bit|16 bit|2 bit
e|Arti kata "water" adalah|Air|Api|Angin|Tanah
e|Arti ungkapan "Thank you" adalah|Terima kasih|Maaf|Tolong|Permisi
e|Bahasa Inggris dari "kucing" adalah|Cat|Dog|Rat|Bird
e|Bahasa Inggris dari angka tujuh adalah|Seven|Six|Eleven|Seventeen`
  .split('\n').forEach((l) => { const [c, q, a, ...w] = l.split('|'); add(CAT[c], q, a, w); });

// ---- Soal berpasangan: dibuat otomatis dengan pengecoh dari pasangan lain
const pairs = (list, cat, f1, f2) => {
  list = list.split(',').map((x) => x.split(':'));
  list.forEach(([a, b], i) => {
    const o = list.filter((_, j) => j !== i);
    add(cat, f1(a), b, sh(o).slice(0, 3).map((x) => x[1]));
    if (f2) add(cat, f2(b), a, sh(o).slice(0, 3).map((x) => x[0]));
  });
};
pairs('Jepang:Tokyo,Korea Selatan:Seoul,Tiongkok:Beijing,India:New Delhi,Thailand:Bangkok,Vietnam:Hanoi,Malaysia:Kuala Lumpur,Filipina:Manila,Australia:Canberra,Selandia Baru:Wellington,Prancis:Paris,Jerman:Berlin,Italia:Roma,Spanyol:Madrid,Portugal:Lisboa,Inggris:London,Belanda:Amsterdam,Belgia:Brussel,Swiss:Bern,Austria:Wina,Yunani:Athena,Turki:Ankara,Rusia:Moskow,Ukraina:Kyiv,Polandia:Warsawa,Swedia:Stockholm,Norwegia:Oslo,Finlandia:Helsinki,Denmark:Kopenhagen,Mesir:Kairo,Afrika Selatan:Pretoria,Kenya:Nairobi,Nigeria:Abuja,Maroko:Rabat,Arab Saudi:Riyadh,Iran:Teheran,Irak:Baghdad,Pakistan:Islamabad,Bangladesh:Dhaka,Kanada:Ottawa,Amerika Serikat:Washington D.C.,Meksiko:Meksiko City,Kuba:Havana,Brasil:Brasilia,Argentina:Buenos Aires,Cile:Santiago,Peru:Lima,Kolombia:Bogota,Myanmar:Naypyidaw,Kamboja:Phnom Penh,Laos:Vientiane,Brunei:Bandar Seri Begawan,Timor Leste:Dili,Nepal:Kathmandu',
  'Geografi', (a) => `Ibu kota negara ${a} adalah`, (b) => `${b} adalah ibu kota negara`);
pairs('Aceh:Banda Aceh,Sumatra Utara:Medan,Sumatra Barat:Padang,Riau:Pekanbaru,Jambi:Jambi,Sumatra Selatan:Palembang,Lampung:Bandar Lampung,Banten:Serang,Jawa Barat:Bandung,Jawa Tengah:Semarang,DI Yogyakarta:Yogyakarta,Jawa Timur:Surabaya,Bali:Denpasar,Nusa Tenggara Barat:Mataram,Nusa Tenggara Timur:Kupang,Kalimantan Barat:Pontianak,Kalimantan Timur:Samarinda,Sulawesi Selatan:Makassar,Sulawesi Utara:Manado,Maluku:Ambon',
  'Geografi', (a) => `Ibu kota Provinsi ${a} adalah`, (b) => `${b} adalah ibu kota provinsi`);
pairs('Jepang:Yen,Korea Selatan:Won,Tiongkok:Yuan,India:Rupee,Thailand:Baht,Malaysia:Ringgit,Filipina:Peso,Inggris:Poundsterling,Rusia:Rubel,Amerika Serikat:Dolar,Swiss:Franc,Arab Saudi:Riyal,Vietnam:Dong,Turki:Lira,Brasil:Real,Afrika Selatan:Rand',
  'Geografi', (a) => `Mata uang negara ${a} adalah`);
pairs('Hidrogen:H,Helium:He,Oksigen:O,Karbon:C,Nitrogen:N,Natrium:Na,Kalium:K,Besi:Fe,Emas:Au,Perak:Ag,Tembaga:Cu,Kalsium:Ca,Timbal:Pb,Raksa:Hg,Klorin:Cl,Seng:Zn,Timah:Sn,Aluminium:Al',
  'Sains', (a) => `Lambang unsur kimia ${a} adalah`);

// ---- Soal hitungan: dibuat acak setiap seed
const rom = (n) => [[90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  .reduce((s, [v, c]) => { while (n >= v) { s += c; n -= v; } return s; }, '');
for (const n of sh([...Array(99)].map((_, i) => i + 1)).slice(0, 40)) add('Matematika', `Angka Romawi ${rom(n)} sama dengan`, n, wn(n));

const U = [['km', 'm', 1000], ['kg', 'gram', 1000], ['jam', 'menit', 60], ['m', 'cm', 100], ['menit', 'detik', 60], ['hari', 'jam', 24]];
for (let k = 0; k < 40; k++) { const [a, b, f] = U[r(0, 5)], x = r(2, 20), v = x * f; add('Matematika', `${x} ${a} sama dengan ... ${b}`, v, [v * 10, v + f, v - f]); }

for (let k = 0; k < 60; k++) {
  const a = r(1, 30), d = r(2, 9), n = a + d * 4;
  add('Matematika', `Lanjutan deret ${[0, 1, 2, 3].map((i) => a + d * i).join(', ')}, ... adalah`, n, wn(n));
}

for (let k = 0; k < 200; k++) {
  const t = r(0, 5); let q, a;
  if (t === 0) { const x = r(12, 99), y = r(12, 99); q = `${x} + ${y} = ...`; a = x + y; }
  else if (t === 1) { const x = r(50, 200), y = r(11, 49); q = `${x} − ${y} = ...`; a = x - y; }
  else if (t === 2) { const x = r(6, 19), y = r(6, 19); q = `${x} × ${y} = ...`; a = x * y; }
  else if (t === 3) { const y = r(3, 12), z = r(4, 15); q = `${y * z} ÷ ${y} = ...`; a = z; }
  else if (t === 4) { const p = [10, 20, 25, 50][r(0, 3)], n = r(1, 10) * 20; q = `${p}% dari ${n} adalah ...`; a = (p * n) / 100; }
  else { const x = r(2, 9), y = r(5, 40); q = `Jika ${x}n = ${x * y}, maka n = ...`; a = y; }
  add('Matematika', q, a, wn(a));
}

// ---- Simpan ke Neon
const uniq = [...new Map(rows.map((x) => [x.q, x])).values()];
await sql`create table if not exists questions(id serial primary key, cat text not null, q text not null unique, answer text not null, wrong text[] not null)`;
await sql`create table if not exists scores(id serial primary key, name text not null, score int not null, correct int not null, total int not null, seconds int not null, created_at timestamptz default now())`;
await sql`create index if not exists scores_rank on scores(score desc, seconds asc)`;
await sql`insert into questions(cat, q, answer, wrong)
  select x->>'c', x->>'q', x->>'a', array(select jsonb_array_elements_text(x->'w'))
  from jsonb_array_elements(${JSON.stringify(uniq)}::jsonb) x
  on conflict (q) do nothing`;
const [{ n }] = await sql`select count(*)::int as n from questions`;
console.log(`Selesai. Bank soal sekarang berisi ${n} soal.`);
