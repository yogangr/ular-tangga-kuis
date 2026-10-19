import { neon } from '@neondatabase/serverless';

// Koneksi dibuat saat pertama dipakai, jadi proses build tidak gagal
// kalau DATABASE_URL belum diisi.
let client;
export const sql = (...args) => (client ??= neon(process.env.DATABASE_URL))(...args);
