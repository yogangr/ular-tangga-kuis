// Mengecek koneksi ke Neon dan jumlah soal per tingkat. Jalankan: npm run cek-db
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
  console.log('DATABASE_URL belum diisi. Buat file .env.local dari .env.example, lalu isi connection string Neon.');
  process.exit(1);
}
try {
  const u = new URL(url);
  console.log(`Tersambung ke host: ${u.hostname} | database: ${u.pathname.slice(1)}`);
} catch {
  console.log('Format DATABASE_URL tidak valid. Pastikan diawali postgresql:// dan tanpa tanda kutip.');
  process.exit(1);
}
const sql = neon(url);
try {
  const tabel = await sql`select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`;
  console.log('Tabel di database ini:', tabel.length ? tabel.map((t) => t.table_name).join(', ') : '(kosong)');
  const rows = await sql`select level, count(*)::int as jumlah from questions group by level order by level`;
  if (!rows.length) { console.log('Tabel questions ada tetapi kosong. Jalankan: npm run setup-db'); process.exit(1); }
  console.log('Jumlah soal per tingkat:');
  for (const r of rows) console.log(`  ${r.level}: ${r.jumlah}`);
} catch (e) {
  console.log('Gagal membaca soal:', e.message);
  console.log('Jika "questions does not exist": database masih kosong. Jalankan: npm run setup-db');
  process.exit(1);
}
