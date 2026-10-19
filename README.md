# Ular Tangga Kuis

Game ular tangga multiplayer berbasis soal kuis. Pemain harus menjawab soal dengan benar sebelum boleh mengocok dadu. Jawaban salah membuat giliran dilewati. Bisa dimainkan online lewat ID room, atau gantian di satu perangkat.

**Teknologi:** Next.js 15 (App Router), React 19, Neon Postgres.

## Cara kerja singkat
- Soal diambil dari tabel `questions` di database Neon (tingkat: mudah, sedang, sulit, WNI).
- Status room disimpan di tabel `ut_rooms` (dibuat otomatis).
- Pemain online saling terhubung dengan polling tiap 1,5 detik.

## Persiapan sekali saja
1. **Node.js LTS** (versi 20 atau lebih baru): https://nodejs.org . Cek di terminal: `node -v`
2. **Visual Studio Code**: https://code.visualstudio.com
3. **Database Neon**: buat proyek di neon.tech (gratis). Database boleh kosong, tabel dan soal dibuat dari terminal (lihat langkah 5). Kalau sudah punya database proyek kuis yang berisi soal, pakai saja yang itu dan lewati langkah 5.

## Menjalankan di VS Code
1. Ekstrak zip, lalu di VS Code pilih **File > Open Folder** dan buka folder `ular-tangga-kuis`.
2. Buka terminal: menu **Terminal > New Terminal** (atau tekan Ctrl+`).
3. Pasang dependensi:
   ```
   npm install
   ```
4. Buat file `.env.local`:
   - Salin `.env.example` lalu ganti namanya menjadi `.env.local`
     (Windows PowerShell: `Copy-Item .env.example .env.local`, Mac/Linux: `cp .env.example .env.local`).
   - Buka `.env.local`, isi `DATABASE_URL` dengan connection string dari dashboard Neon
     (Dashboard > proyekmu > **Connect**, salin yang berawalan `postgresql://`).
5. **Buat tabel dan isi bank soal** (cukup sekali, sekitar 1.700 soal bertingkat):
   ```
   npm run setup-db
   ```
   Perintah ini menjalankan `seed`, `seed:umum`, dan `seed:level` berurutan. Aman diulang.
6. Cek koneksi database dan jumlah soal:
   ```
   npm run cek-db
   ```
   Harus muncul jumlah soal untuk mudah, sedang, sulit, dan olimpiade.
7. Jalankan:
   ```
   npm run dev
   ```
   Buka http://localhost:3000 di browser.

## Mencoba multiplayer di komputer sendiri
Buka dua jendela browser (satu biasa, satu *incognito*) ke http://localhost:3000. Buat room di jendela pertama, lalu gabung dengan ID itu di jendela kedua.
Untuk mencoba dari HP di Wi-Fi yang sama, jalankan `npm run dev -- -H 0.0.0.0` lalu buka `http://IP-KOMPUTER:3000`.

## Deploy ke Vercel
1. Upload proyek ke GitHub (`git init`, `git add .`, `git commit -m "awal"`, lalu push), atau pakai panel **Source Control** di VS Code.
2. Di vercel.com pilih **Add New > Project**, impor repository ini.
3. Pada **Environment Variables**, tambahkan `DATABASE_URL` (nilai sama dengan `.env.local`).
4. Klik **Deploy**. Bagikan domain produksi (bukan link deployment yang berkode acak) ke teman.

## Masalah umum
| Gejala | Penyebab / solusi |
|---|---|
| `npm` atau `node` tidak dikenali | Node.js belum terpasang, atau terminal belum dibuka ulang setelah instalasi |
| `npm run cek-db` bilang DATABASE_URL belum diisi | File `.env.local` belum dibuat, salah nama, atau tidak di folder utama proyek |
| `relation "questions" does not exist` atau "Belum ada soal untuk tingkat ini" | Database masih kosong. Jalankan `npm run setup-db` |
| Room tidak ditemukan | ID salah ketik, atau room sudah dihapus karena tidak aktif lebih dari 1 hari |
| Port 3000 terpakai | Next.js otomatis memakai port berikutnya (3001). Lihat alamatnya di terminal |
| Di Vercel muncul halaman login Vercel | Buka domain produksi, atau matikan Deployment Protection di Settings |
