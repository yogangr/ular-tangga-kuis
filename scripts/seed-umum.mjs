// Menambah ratusan soal pengetahuan umum dari banyak topik + migrasi tabel untuk
// Kuis Harian dan peringkat. Jalankan SETELAH npm run seed:  npm run seed:umum
// Aman dijalankan berulang (soal yang sama dilewati).
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const CAT = {
  k: 'Tubuh & Kesehatan', n: 'Hewan & Tumbuhan', a: 'Alam Semesta', f: 'Fisika & Kimia',
  w: 'Sejarah Dunia', i: 'Sejarah Indonesia', r: 'Seni & Sastra', o: 'Olahraga',
  m: 'Makanan & Minuman', t: 'Teknologi', p: 'Bahasa & Peribahasa', e: 'Ekonomi',
  l: 'Lingkungan', z: 'Tokoh & Penemuan', q: 'Logika & Satuan', u: 'Transportasi',
};

// Format: kategori|soal|jawaban benar|salah 1|salah 2|salah 3
const RAW = `k|Organ yang menyaring darah dan membentuk urine adalah|Ginjal|Hati|Lambung|Usus halus
k|Jumlah gigi tetap manusia dewasa yang lengkap adalah|32|28|30|36
k|Tulang terpanjang pada tubuh manusia adalah|Tulang paha|Tulang lengan atas|Tulang kering|Tulang rusuk
k|Kekurangan vitamin C dapat menyebabkan penyakit|Skorbut|Rabun senja|Beri-beri|Rakitis
k|Kekurangan vitamin A dapat menyebabkan|Rabun senja|Skorbut|Beri-beri|Rakitis
k|Bagian mata yang berwarna dan mengatur ukuran pupil adalah|Iris|Retina|Kornea|Lensa
k|Tempat pertukaran oksigen dan karbon dioksida di paru-paru adalah|Alveolus|Bronkus|Trakea|Laring
k|Penyakit yang ditularkan nyamuk Aedes aegypti adalah|Demam berdarah|Tifus|Kolera|Campak
k|Zat gizi utama pembangun otot adalah|Protein|Karbohidrat|Lemak|Serat
n|Hewan endemik Pulau Komodo adalah|Komodo|Orangutan|Badak Jawa|Anoa
n|Primata besar asli Indonesia yang dijuluki manusia hutan adalah|Orangutan|Gorila|Simpanse|Babun
n|Burung yang tidak bisa terbang dan berasal dari Selandia Baru adalah|Kiwi|Elang|Merpati|Kakatua
n|Bunga Rafflesia arnoldii banyak ditemukan di Pulau|Sumatra|Jawa|Sulawesi|Bali
n|Hewan yang berhibernasi saat musim dingin adalah|Beruang|Singa|Zebra|Unta
n|Tumbuhan yang daunnya menjebak serangga adalah|Kantong semar|Mawar|Anggrek|Kaktus
n|Hewan laut dengan delapan lengan adalah|Gurita|Cumi-cumi|Ubur-ubur|Bintang laut
n|Hewan yang menghasilkan madu adalah|Lebah|Semut|Kupu-kupu|Belalang
n|Hewan raja hutan yang hidup di sabana Afrika adalah|Singa|Harimau|Beruang|Gajah
a|Bintang terdekat dari bumi adalah|Matahari|Sirius|Polaris|Proxima Centauri
a|Galaksi tempat tata surya kita berada adalah|Bima Sakti|Andromeda|Triangulum|Sombrero
a|Gerhana matahari terjadi ketika|Bulan berada di antara Matahari dan Bumi|Bumi berada di antara Matahari dan Bulan|Matahari berada di antara Bumi dan Bulan|Mars berada di antara Bumi dan Bulan
a|Satu kali revolusi bumi mengelilingi matahari lamanya sekitar|365 hari|30 hari|7 hari|180 hari
a|Lapisan bumi paling luar adalah|Kerak bumi|Mantel|Inti luar|Inti dalam
a|Alat pengukur getaran gempa bumi adalah|Seismograf|Barometer|Anemometer|Higrometer
a|Planet yang terkenal dengan cincinnya adalah|Saturnus|Mars|Merkurius|Venus
a|Pergantian siang dan malam disebabkan oleh|Rotasi bumi|Revolusi bumi|Rotasi bulan|Gerhana
a|Benda langit yang mengelilingi planet disebut|Satelit|Asteroid|Komet|Meteor
f|Air murni membeku pada suhu|0°C|100°C|-10°C|4°C
f|Satuan hambatan listrik adalah|Ohm|Volt|Ampere|Watt
f|Energi yang dimiliki benda yang bergerak disebut energi|Kinetik|Potensial|Kimia|Nuklir
f|Benda yang dapat ditarik oleh magnet adalah|Besi|Plastik|Kayu|Kaca
f|Cahaya putih yang melewati prisma akan terurai menjadi|Spektrum warna|Bayangan|Gelombang bunyi|Panas
f|Nilai pH netral adalah|7|0|14|1
f|Gas ringan yang dipakai untuk mengisi balon udara hiburan adalah|Helium|Oksigen|Karbon dioksida|Nitrogen
f|Alat untuk mengukur kuat arus listrik adalah|Amperemeter|Voltmeter|Barometer|Termometer
f|Perubahan wujud padat menjadi cair disebut|Melebur|Membeku|Menguap|Mengembun
w|Revolusi Prancis terjadi pada abad ke-|18|16|19|20
w|Pelaut yang tiba di Benua Amerika pada tahun 1492 adalah|Christopher Columbus|Vasco da Gama|Ferdinand Magellan|James Cook
w|Tembok Besar yang terkenal terdapat di negara|Tiongkok|Jepang|India|Mongolia
w|Perang Dunia I dimulai pada tahun|1914|1939|1905|1920
w|Peradaban yang menulis dengan huruf hieroglif adalah|Mesir Kuno|Romawi Kuno|Yunani Kuno|Persia Kuno
w|Kekaisaran Romawi berpusat di kota|Roma|Athena|Konstantinopel|Kartago
w|Manusia pertama yang berjalan di Bulan adalah|Neil Armstrong|Yuri Gagarin|Buzz Aldrin|John Glenn
w|Manusia pertama yang terbang ke luar angkasa adalah|Yuri Gagarin|Neil Armstrong|Alan Shepard|John Glenn
w|Pemimpin kemerdekaan India yang terkenal dengan gerakan tanpa kekerasan adalah|Mahatma Gandhi|Jawaharlal Nehru|Subhas Chandra Bose|Rabindranath Tagore
w|Tembok Berlin runtuh pada tahun|1989|1961|1975|2001
i|Organisasi pergerakan nasional pertama di Indonesia adalah|Budi Utomo|Sarekat Islam|Indische Partij|Muhammadiyah
i|Naskah Proklamasi diketik oleh|Sayuti Melik|Soekarno|Mohammad Hatta|Ahmad Soebardjo
i|Pertempuran 10 November 1945 terjadi di kota|Surabaya|Bandung|Semarang|Medan
i|Peristiwa Bandung Lautan Api terjadi pada tahun|1946|1945|1949|1950
i|Bendera Pusaka dijahit oleh|Fatmawati|R.A. Kartini|Dewi Sartika|Cut Nyak Meutia
i|Kerajaan Islam pertama di Indonesia adalah|Samudera Pasai|Demak|Mataram Islam|Banten
i|VOC adalah perkumpulan dagang milik bangsa|Belanda|Inggris|Portugis|Spanyol
i|Sistem tanam paksa diberlakukan oleh Gubernur Jenderal|Van den Bosch|Daendels|Raffles|J.P. Coen
i|Jalan Raya Pos dari Anyer sampai Panarukan dibangun pada masa|Daendels|Raffles|Van den Bosch|J.P. Coen
r|Penulis novel Bumi Manusia adalah|Pramoedya Ananta Toer|Chairil Anwar|Andrea Hirata|Ayu Utami
r|Penyair yang dijuluki Si Binatang Jalang adalah|Chairil Anwar|W.S. Rendra|Sapardi Djoko Damono|Taufiq Ismail
r|Seni melipat kertas dari Jepang disebut|Origami|Ikebana|Haiku|Kabuki
r|Seperangkat alat musik tradisional Jawa dan Bali disebut|Gamelan|Angklung|Kolintang|Talempong
r|Jumlah tuts pada piano standar adalah|88|66|76|100
r|Lukisan The Starry Night dilukis oleh|Vincent van Gogh|Claude Monet|Pablo Picasso|Salvador Dali
r|Lukisan Penangkapan Pangeran Diponegoro dilukis oleh|Raden Saleh|Affandi|Basuki Abdullah|S. Sudjojono
r|Drama Romeo dan Juliet ditulis oleh|William Shakespeare|Charles Dickens|Mark Twain|Leo Tolstoy
r|Novel Siti Nurbaya ditulis oleh|Marah Rusli|Abdul Muis|Sutan Takdir Alisjahbana|Hamka
o|Olimpiade modern pertama diselenggarakan di kota|Athena|Paris|London|Roma
o|Piala Dunia FIFA diselenggarakan setiap|4 tahun|2 tahun|3 tahun|5 tahun
o|Jumlah pemain bola basket satu tim di lapangan adalah|5|6|7|11
o|Jarak lari maraton adalah|42,195 km|21 km|10 km|50 km
o|Indonesia pertama kali meraih medali emas Olimpiade pada tahun|1992|1988|1996|2000
o|Jumlah pemain bola voli satu tim di lapangan adalah|6|5|7|11
o|Kartu kuning yang diberikan wasit sepak bola berarti|Peringatan|Pemain dikeluarkan|Gol sah|Pergantian pemain
o|Olahraga yang memakai raket dan kok adalah|Bulu tangkis|Tenis|Squash|Tenis meja
m|Bahan utama tempe adalah|Kedelai|Jagung|Kacang tanah|Beras
m|Buah yang dijuluki ratu buah adalah|Manggis|Durian|Salak|Nanas
m|Pizza berasal dari negara|Italia|Prancis|Amerika Serikat|Yunani
m|Sushi berasal dari negara|Jepang|Korea|Tiongkok|Thailand
m|Kimchi adalah makanan fermentasi khas|Korea|Jepang|Tiongkok|Vietnam
m|Rasa pedas pada cabai berasal dari zat|Kapsaisin|Kafein|Glukosa|Tanin
m|Gula pasir umumnya dibuat dari tanaman|Tebu|Kopi|Teh|Kapas
t|Kepanjangan USB adalah|Universal Serial Bus|United Serial Base|Universal System Board|Unique Serial Bus
t|Kepanjangan AI adalah|Artificial Intelligence|Automatic Internet|Advanced Input|Applied Interface
t|Kepanjangan GPS adalah|Global Positioning System|General Position Signal|Global Program Service|Ground Position System
t|Perusahaan pembuat iPhone adalah|Apple|Samsung|Xiaomi|Sony
t|Alamat sebuah halaman web disebut|URL|RAM|CPU|BIOS
t|Memori sementara yang dipakai komputer saat bekerja disebut|RAM|ROM|SSD|CPU
t|Bahasa markup untuk menyusun halaman web adalah|HTML|SQL|Python|COBOL
p|Peribahasa "Berat sama dipikul, ringan sama dijinjing" bermakna|Bekerja sama dalam suka dan duka|Bekerja sendiri-sendiri|Membawa barang berat|Berbagi makanan
p|Peribahasa "Air beriak tanda tak dalam" menggambarkan|Orang yang banyak bicara biasanya kurang berilmu|Air sungai yang tenang|Sungai yang dangkal|Orang yang pendiam
p|Peribahasa "Tak ada gading yang tak retak" artinya|Tidak ada manusia yang sempurna|Gading mudah rusak|Semua orang kaya|Barang mahal cepat rusak
p|Peribahasa "Rajin pangkal pandai" artinya|Rajin belajar membuat seseorang pintar|Orang pandai selalu rajin|Pangkal tangan|Pandai bergaul
p|Peribahasa "Bagai kacang lupa akan kulitnya" menyindir orang yang|Lupa asal-usul setelah sukses|Suka makan kacang|Pelit|Rajin bekerja
p|Antonim kata "luas" adalah|Sempit|Lebar|Besar|Panjang
p|Kata ganti orang pertama jamak yang mencakup lawan bicara adalah|Kita|Kami|Mereka|Anda
e|Lembaga yang menerbitkan uang rupiah adalah|Bank Indonesia|Bank Mandiri|OJK|Kementerian Keuangan
e|Uang tambahan dari tabungan di bank disebut|Bunga|Denda|Pajak|Biaya admin
e|Orang yang membuat atau menghasilkan barang disebut|Produsen|Konsumen|Kurir|Pembeli
e|Kenaikan harga barang secara umum dan terus-menerus disebut|Inflasi|Deflasi|Devaluasi|Resesi
e|Singkatan UMKM adalah|Usaha Mikro, Kecil, dan Menengah|Usaha Menengah Kota Modern|Unit Modal Kecil Masyarakat|Usaha Mandiri Kecil Menengah
e|Mata uang negara Indonesia adalah|Rupiah|Ringgit|Baht|Dolar
l|Gas rumah kaca utama penyebab pemanasan global adalah|Karbon dioksida|Oksigen|Nitrogen|Helium
l|Sampah yang dapat terurai secara alami disebut sampah|Organik|Anorganik|Logam|Plastik
l|Prinsip 3R terdiri dari Reduce, Reuse, dan|Recycle|Repair|Return|Remove
l|Hutan bakau (mangrove) berfungsi mencegah|Abrasi|Gempa bumi|Letusan gunung|Angin topan
l|Hari Bumi diperingati setiap tanggal|22 April|5 Juni|21 Maret|10 Oktober
l|Hari Lingkungan Hidup Sedunia diperingati setiap tanggal|5 Juni|22 April|8 Maret|1 Mei
l|Lapisan ozon melindungi bumi dari sinar|Ultraviolet|Inframerah|Cahaya tampak|Gelombang radio
l|Energi yang bersumber dari panas bumi disebut energi|Geotermal|Surya|Angin|Nuklir
z|Penemu telepon yang terkenal adalah|Alexander Graham Bell|Thomas Edison|Samuel Morse|Guglielmo Marconi
z|Penemu mesin cetak dengan huruf lepas di Eropa adalah|Johannes Gutenberg|Isaac Newton|James Watt|Galileo Galilei
z|Penemu teori relativitas adalah|Albert Einstein|Isaac Newton|Stephen Hawking|Niels Bohr
z|Penemu vaksin cacar pertama adalah|Edward Jenner|Alexander Fleming|Marie Curie|Robert Koch
z|Penemu antibiotik penisilin adalah|Alexander Fleming|Louis Pasteur|Edward Jenner|Joseph Lister
z|Ilmuwan perempuan peraih Nobel di dua bidang berbeda adalah|Marie Curie|Rosalind Franklin|Ada Lovelace|Florence Nightingale
z|B.J. Habibie dikenal sebagai ahli di bidang|Pesawat terbang|Perkapalan|Pertanian|Kedokteran
z|Penyempurna mesin uap yang berperan dalam Revolusi Industri adalah|James Watt|Isaac Newton|Thomas Edison|Alexander Bell
q|Jika hari ini Senin, maka 3 hari lagi adalah hari|Kamis|Rabu|Jumat|Selasa
q|Satu lusin sama dengan|12 buah|10 buah|20 buah|24 buah
q|Satu abad sama dengan|100 tahun|10 tahun|1.000 tahun|50 tahun
q|Satu windu sama dengan|8 tahun|10 tahun|12 tahun|5 tahun
q|Satu dasawarsa sama dengan|10 tahun|100 tahun|5 tahun|20 tahun
q|Satu kodi sama dengan|20 buah|12 buah|10 buah|24 buah
q|Satu gross sama dengan|144 buah|100 buah|120 buah|12 buah
q|Jumlah hari dalam satu tahun kabisat adalah|366|365|364|367
q|Bulan yang berumur 28 atau 29 hari adalah|Februari|April|Juni|September
q|Jumlah sisi pada bangun segi delapan adalah|8|6|10|12
u|Jalur kereta api pertama di Indonesia menghubungkan Semarang dan|Tanggung|Surabaya|Bogor|Bandung
u|Bandar udara internasional utama di Jakarta bernama|Soekarno-Hatta|Juanda|Ngurah Rai|Kualanamu
u|Bandar udara Ngurah Rai terdapat di pulau|Bali|Lombok|Jawa|Sumatra
u|MRT pertama di Indonesia beroperasi di kota|Jakarta|Surabaya|Bandung|Medan
u|Alat transportasi tradisional berkuda khas Yogyakarta adalah|Andong|Becak|Bemo|Ojek
u|Rambu lalu lintas berbentuk segi delapan berwarna merah berarti|Berhenti|Hati-hati|Dilarang parkir|Putar balik`;

const rows = RAW.split('\n').map((l) => {
  const [c, q, a, ...w] = l.split('|');
  return { c: CAT[c], q, a, w };
});

// Migrasi untuk Kuis Harian dan peringkat harian/mingguan
await sql`create table if not exists scores(id serial primary key, name text not null, score int not null, correct int not null, total int not null, seconds int not null, created_at timestamptz default now())`;
await sql`alter table scores add column if not exists mode text not null default 'acak'`;
await sql`alter table scores add column if not exists day date`;
await sql`create index if not exists scores_mode_day on scores(mode, day)`;

await sql`insert into questions(cat, q, answer, wrong)
  select x->>'c', x->>'q', x->>'a', array(select jsonb_array_elements_text(x->'w'))
  from jsonb_array_elements(${JSON.stringify(rows)}::jsonb) x
  on conflict (q) do nothing`;

const [{ n }] = await sql`select count(*)::int as n from questions`;
const cats = await sql`select cat, count(*)::int as n from questions group by cat order by n desc`;
console.log(`Selesai. Bank soal sekarang berisi ${n} soal dalam ${cats.length} kategori.`);
