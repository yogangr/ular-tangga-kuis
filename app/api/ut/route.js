import { sql } from '../../../lib/db';
import { SNAKES, LADDERS } from '../../../lib/utboard';

export const dynamic = 'force-dynamic';

const LEVELS = ['mudah', 'sedang', 'sulit', 'olimpiade'];
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rid = (n) => Array.from({ length: n }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
const newTok = () => crypto.randomUUID().replace(/-/g, '');
const clean = (v) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 16);
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const say = (s, t) => { s.log = [t, ...(s.log || [])].slice(0, 6); };

class E extends Error { constructor(m, status = 400) { super(m); this.status = status; } }

// Tabel dibuat otomatis saat pertama dipakai
let ready;
const ensure = () => (ready ??= sql`create table if not exists ut_rooms(
  id text primary key, level text not null, mode text not null,
  state jsonb not null, version int not null default 0, updated_at timestamptz not null default now())`
  .catch((e) => { ready = undefined; throw e; }));

// Data yang boleh dilihat pemain (tanpa token rahasia dan tanpa kunci jawaban)
const pub = (row, s) => ({
  id: row.id, level: row.level, mode: row.mode, version: row.version,
  status: s.status, host: s.host, turn: s.turn, phase: s.phase, q: s.q, last: s.last,
  dice: s.dice, log: s.log, winner: s.winner,
  players: s.players.map(({ id, name, pos, color }) => ({ id, name, pos, color })),
});

// Ambil satu soal acak dari bank soal sesuai tingkat, hindari soal yang baru dipakai
async function pickQ(level, used) {
  let rows = await sql`select id, q, answer, wrong from questions where level = ${level} and not (id = any(${used})) order by random() limit 1`;
  if (!rows.length) {
    used.length = 0;
    rows = await sql`select id, q, answer, wrong from questions where level = ${level} order by random() limit 1`;
  }
  if (!rows.length) throw new E('Belum ada soal untuk tingkat ini. Jalankan seed soal dulu.', 500);
  const r = rows[0];
  used.push(r.id);
  if (used.length > 300) used.shift();
  return { id: r.id, q: r.q, options: shuffle([r.answer, ...r.wrong]) };
}

async function nextTurn(s, level) {
  s.turn = (s.turn + 1) % s.players.length;
  s.phase = 'answer';
  s.q = await pickQ(level, s.used);
}

// Ubah state dengan aman: kalau ada yang mengubah bersamaan, ulangi
async function mutate(id, fn) {
  for (let t = 0; t < 4; t++) {
    const [row] = await sql`select id, level, mode, state, version from ut_rooms where id = ${id}`;
    if (!row) throw new E('Room tidak ditemukan', 404);
    const s = structuredClone(row.state);
    await fn(s, row);
    const up = await sql`update ut_rooms set state = ${JSON.stringify(s)}::jsonb, version = version + 1, updated_at = now()
      where id = ${id} and version = ${row.version} returning version`;
    if (up.length) return { s, row, version: up[0].version };
  }
  throw new E('Server sibuk, coba lagi.', 409);
}

async function create(b) {
  await ensure();
  const level = LEVELS.includes(b.level) ? b.level : 'mudah';
  const mode = b.mode === 'local' ? 'local' : 'online';
  const names = mode === 'local' ? (b.names || []).map(clean).filter(Boolean).slice(0, 6) : [clean(b.name)].filter(Boolean);
  if (mode === 'online' && !names.length) throw new E('Isi nama dulu.');
  if (mode === 'local' && names.length < 2) throw new E('Minimal 2 pemain.');
  const tok = newTok();
  const s = {
    status: mode === 'local' ? 'playing' : 'lobby', host: 0, turn: 0, phase: 'answer', q: null, last: null, dice: null,
    log: [], winner: null, used: [], n: 0,
    players: names.map((name, i) => ({ id: i, name, pos: 0, color: i, tok: i === 0 ? tok : null })),
  };
  if (mode === 'local') { s.q = await pickQ(level, s.used); say(s, `Permainan dimulai. Giliran ${names[0]}.`); }
  await sql`delete from ut_rooms where updated_at < now() - interval '1 day'`;
  for (let t = 0; t < 6; t++) {
    const id = rid(5);
    const ins = await sql`insert into ut_rooms(id, level, mode, state) values(${id}, ${level}, ${mode}, ${JSON.stringify(s)}::jsonb)
      on conflict do nothing returning id, version`;
    if (ins.length) return { id, tok, pid: 0, room: pub({ id, level, mode, version: ins[0].version }, s) };
  }
  throw new E('Gagal membuat room, coba lagi.', 500);
}

async function join(b) {
  await ensure();
  const id = String(b.id || '').trim().toUpperCase();
  const name = clean(b.name);
  if (!name) throw new E('Isi nama dulu.');
  const tok = newTok();
  let pid;
  const { s, row, version } = await mutate(id, (s, row) => {
    if (row.mode !== 'online') throw new E('Room ini dimainkan di satu perangkat.');
    if (s.status !== 'lobby') throw new E('Permainan di room ini sudah dimulai.');
    if (s.players.length >= 6) throw new E('Room sudah penuh (maksimal 6 pemain).');
    if (s.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new E('Nama itu sudah dipakai di room ini.');
    pid = s.players.length;
    s.players.push({ id: pid, name, pos: 0, color: pid, tok });
    say(s, `${name} bergabung.`);
  });
  return { id, tok, pid, room: pub({ ...row, version }, s) };
}

async function act(b) {
  await ensure();
  const id = String(b.id || '').trim().toUpperCase();
  const tok = b.tok ? String(b.tok) : null;
  const { s, row, version } = await mutate(id, async (s, row) => {
    const host = s.players[s.host];
    if (b.action === 'start') {
      if (row.mode !== 'online' || s.status !== 'lobby') throw new E('Permainan sudah berjalan.');
      if (!tok || host.tok !== tok) throw new E('Hanya host yang bisa memulai.', 403);
      if (s.players.length < 2) throw new E('Minimal 2 pemain untuk mulai.');
      s.status = 'playing'; s.turn = 0; s.phase = 'answer';
      s.q = await pickQ(row.level, s.used);
      s.n++;
      s.last = { n: s.n, type: 'start', text: `Permainan dimulai! Giliran ${s.players[0].name}.` };
      say(s, s.last.text);
      return;
    }
    if (s.status !== 'playing') throw new E('Permainan tidak sedang berjalan.');
    const p = s.players[s.turn];
    const allowed = tok && (row.mode === 'local' ? host.tok === tok : p.tok === tok);
    if (!allowed) throw new E('Sekarang bukan giliranmu.', 403);

    if (b.action === 'answer') {
      if (s.phase !== 'answer') throw new E('Bukan saatnya menjawab.');
      const [r] = await sql`select answer from questions where id = ${s.q.id}`;
      s.n++;
      if (b.pick === r.answer) {
        s.phase = 'roll';
        s.last = { n: s.n, type: 'correct', who: p.id, text: `${p.name} menjawab benar! Kocok dadu sekarang.` };
      } else {
        s.last = { n: s.n, type: 'wrong', who: p.id, text: `${p.name} menjawab salah. Jawaban yang benar: ${r.answer}. Giliran dilewati.` };
        await nextTurn(s, row.level);
      }
      say(s, s.last.text);
      return;
    }

    if (b.action === 'roll') {
      if (s.phase !== 'roll') throw new E('Jawab soal dengan benar dulu sebelum mengocok dadu.');
      const d = 1 + Math.floor(Math.random() * 6);
      let to = p.pos + d;
      if (to > 100) to = 200 - to; // melewati 100: memantul balik
      let end = to, kind = null;
      if (LADDERS[to]) { end = LADDERS[to]; kind = 'ladder'; }
      else if (SNAKES[to]) { end = SNAKES[to]; kind = 'snake'; }
      p.pos = end;
      s.n++;
      s.dice = { n: s.n, who: p.id, v: d };
      let text = `${p.name} mengocok ${d} dan sampai di kotak ${to}`;
      text += kind === 'ladder' ? `, naik tangga ke ${end}!` : kind === 'snake' ? `, dimakan ular dan turun ke ${end}.` : '.';
      if (p.pos === 100) {
        s.status = 'finished'; s.phase = 'done'; s.winner = p.id; s.q = null;
        text += ` ${p.name} menang!`;
      } else {
        await nextTurn(s, row.level);
        text += ` Giliran ${s.players[s.turn].name}.`;
      }
      s.last = { n: s.n, type: 'roll', who: p.id, dice: d, kind, text };
      say(s, text);
      return;
    }
    throw new E('Aksi tidak dikenal.');
  });
  return { room: pub({ ...row, version }, s) };
}

const fail = (e) => {
  if (!(e instanceof E)) console.error(e);
  return Response.json({ error: e instanceof E ? e.message : 'Terjadi kesalahan di server.' }, { status: e.status || 500 });
};

export async function GET(req) {
  try {
    await ensure();
    const p = new URL(req.url).searchParams;
    const id = String(p.get('id') || '').trim().toUpperCase();
    const v = Number(p.get('v') ?? -1);
    const [row] = await sql`select id, level, mode, state, version from ut_rooms where id = ${id}`;
    if (!row) throw new E('Room tidak ditemukan.', 404);
    if (row.version === v) return Response.json({ changed: false });
    return Response.json({ room: pub(row, row.state) });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const b = await req.json();
    if (b.action === 'create') return Response.json(await create(b));
    if (b.action === 'join') return Response.json(await join(b));
    if (['start', 'answer', 'roll'].includes(b.action)) return Response.json(await act(b));
    throw new E('Aksi tidak dikenal.');
  } catch (e) { return fail(e); }
}
