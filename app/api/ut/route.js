import { sql } from '../../../lib/db';
import { SNAKES, LADDERS, ANIMALS } from '../../../lib/utboard';

export const dynamic = 'force-dynamic';

const LEVELS = ['mudah', 'sedang', 'sulit', 'olimpiade'];
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rid = (n) => Array.from({ length: n }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
const newTok = () => crypto.randomUUID().replace(/-/g, '');
const clean = (v) => String(v || '').trim().replace(/\s+/g, ' ').slice(0, 16);
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const AIDS = ANIMALS.map((a) => a[0]);
// Pilih hewan: pakai pilihan yang diminta kalau valid dan belum dipakai pemain lain, kalau tidak ambil yang masih kosong
const freeAnimal = (s, pref, exceptId = -1) => {
  const used = new Set(s.players.filter((p) => !p.left && p.id !== exceptId).map((p) => p.animal));
  if (AIDS.includes(pref) && !used.has(pref)) return pref;
  return AIDS.find((a) => !used.has(a)) ?? AIDS[0];
};
const say = (s, t) => { s.log = [t, ...(s.log || [])].slice(0, 6); };

class E extends Error { constructor(m, status = 400) { super(m); this.status = status; } }

// Tabel dibuat otomatis saat pertama dipakai
let ready;
const ensure = () => (ready ??= (async () => {
  await sql`create table if not exists ut_rooms(
    id text primary key, level text not null, mode text not null,
    state jsonb not null, version int not null default 0, updated_at timestamptz not null default now(),
    seen jsonb not null default '{}'::jsonb)`;
  await sql`alter table ut_rooms add column if not exists seen jsonb not null default '{}'::jsonb`;
})().catch((e) => { ready = undefined; throw e; }));

const HEARTBEAT_MS = 20000; // seberapa sering "tanda hidup" pemain dicatat
const STALE_MS = 60000;     // pemain tanpa tanda hidup selama ini dikeluarkan otomatis
// Permainan baru berakhir saat pemain yang masih berlomba (belum finis, belum keluar)
// tinggal sebanyak ini. Contoh dengan angka 2: di room 4 pemain, setelah dua orang finis
// permainan selesai dan dua sisanya diurutkan menurut posisi di papan.
// Ubah menjadi 1 kalau ingin sampai tinggal satu pemain.
const STOP_AT = 2;
// Aturan angka 6: dapat 6 = kocok lagi. Dapat 6 sebanyak MAX_SIXES kali berturut-turut = bidak kembali ke kotak RESET_TO.
const MAX_SIXES = 3;
const RESET_TO = 1;
const active = (s) => s.players.filter((p) => !p.left);
const racing = (s) => s.players.filter((p) => !p.left && !p.done);

// Cek apakah permainan harus berakhir. Kalau ya, susun peringkat akhir.
function settle(s) {
  const rest0 = racing(s);
  const finished = s.finishOrder.length;
  const over = rest0.length === 0 || (finished > 0 && rest0.length <= STOP_AT) || (finished === 0 && rest0.length <= 1);
  if (!over) return false;
  const rest = [...rest0].sort((a, b) => b.pos - a.pos || a.id - b.id);
  const order = [...s.finishOrder, ...rest.map((p) => p.id)];
  order.forEach((pid, i) => { s.players[pid].rank = i + 1; });
  s.ranking = order;
  s.winner = order.length ? order[0] : null;
  s.status = 'finished'; s.phase = 'done'; s.q = null;
  return true;
}

// Data yang boleh dilihat pemain (tanpa token rahasia dan tanpa kunci jawaban)
const pub = (row, s) => ({
  id: row.id, level: row.level, mode: row.mode, version: row.version,
  status: s.status, host: s.host, turn: s.turn, phase: s.phase, q: s.q, last: s.last,
  dice: s.dice, move: s.move ?? null, log: s.log, winner: s.winner,
  players: s.players.map(({ id, name, pos, color, animal, left, done, rank }) => ({ id, name, pos, color, animal: animal ?? AIDS[color % AIDS.length], left: !!left, done: !!done, rank: rank ?? null })),
  ranking: s.ranking ?? [],
  round: s.round ?? 0,
  spectators: (s.spectators ?? []).map(({ id, name }) => ({ id, name })),
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
  const n = s.players.length;
  for (let i = 1; i <= n; i++) {
    const t = (s.turn + i) % n;
    if (!s.players[t].left && !s.players[t].done) { s.turn = t; break; }
  }
  s.phase = 'answer';
  s.q = await pickQ(level, s.used);
}

// Ubah state dengan aman: kalau ada yang mengubah bersamaan, ulangi
async function mutate(id, fn) {
  for (let t = 0; t < 4; t++) {
    const [row] = await sql`select id, level, mode, state, version from ut_rooms where id = ${id}`;
    if (!row) throw new E('Room tidak ditemukan', 404);
    const s = structuredClone(row.state);
    s.finishOrder ??= [];
    if ((await fn(s, row)) === 'noop') return { s, row, version: row.version };
    const up = await sql`update ut_rooms set state = ${JSON.stringify(s)}::jsonb, version = version + 1, updated_at = now()
      where id = ${id} and version = ${row.version} returning version`;
    if (up.length) return { s, row, version: up[0].version };
  }
  throw new E('Server sibuk, coba lagi.', 409);
}

// Keluarkan satu pemain (tombol Keluar atau terputus). id pemain tetap dipertahankan
// supaya posisi giliran dan warna pemain lain tidak berubah.
async function dropPlayer(s, row, pid, why) {
  const p = s.players[pid];
  if (!p || p.left) return false;
  p.left = true;
  p.tok = null;
  s.n = (s.n || 0) + 1;
  const act = active(s);
  const text = why === 'idle' ? `${p.name} terputus dan dikeluarkan dari permainan.` : `${p.name} keluar dari permainan.`;
  say(s, text);
  if (!act.length) return true;
  if (s.host === pid) s.host = act[0].id;
  if (s.status === 'playing') {
    if (settle(s)) {
      const tail = s.finishOrder.length ? 'Permainan selesai.' : `${s.players[s.winner].name} menang karena pemain lain sudah keluar.`;
      s.last = { n: s.n, type: 'end', text: `${text} ${tail}` };
    } else if (s.turn === pid) {
      await nextTurn(s, row.level);
      s.last = { n: s.n, type: 'left', text: `${text} Giliran ${s.players[s.turn].name}.` };
    } else {
      s.last = { n: s.n, type: 'left', text };
    }
  } else {
    s.last = { n: s.n, type: 'left', text };
  }
  return true;
}

async function dropAndClean(id, pids, why) {
  const out = await mutate(id, async (s, row) => {
    let changed = false;
    for (const pid of pids) if (await dropPlayer(s, row, pid, why)) changed = true;
    return changed ? undefined : 'noop';
  });
  if (!active(out.s).length) { await sql`delete from ut_rooms where id = ${id}`; return null; }
  return out;
}

const touch = (id, pid) => sql`update ut_rooms set seen = jsonb_set(coalesce(seen, '{}'::jsonb), ${[String(pid)]}::text[], to_jsonb(${Date.now()}::bigint), true) where id = ${id}`;

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
    players: names.map((name, i) => ({ id: i, name, pos: 0, color: i, animal: mode === 'online' && AIDS.includes(b.animal) ? b.animal : AIDS[i], tok: i === 0 ? tok : null })),
  };
  if (mode === 'local') { s.q = await pickQ(level, s.used); say(s, `Permainan dimulai. Giliran ${names[0]}.`); }
  await sql`delete from ut_rooms where updated_at < now() - interval '1 day'`;
  for (let t = 0; t < 6; t++) {
    const id = rid(5);
    const ins = await sql`insert into ut_rooms(id, level, mode, state, seen) values(${id}, ${level}, ${mode}, ${JSON.stringify(s)}::jsonb, ${JSON.stringify({ 0: Date.now() })}::jsonb)
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
  let pid = null, sid = null;
  const { s, row, version } = await mutate(id, (s, row) => {
    pid = null; sid = null;
    if (row.mode !== 'online') throw new E('Room ini dimainkan di satu perangkat.');
    if (s.status === 'lobby' && active(s).length < 6) {
      if (active(s).some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new E('Nama itu sudah dipakai di room ini.');
      pid = s.players.length;
      const used = new Set(active(s).map((p) => p.color));
      let color = 0; while (used.has(color)) color++;
      s.players.push({ id: pid, name, pos: 0, color, animal: freeAnimal(s, b.animal), tok });
      say(s, `${name} bergabung.`);
      return;
    }
    // Permainan sudah dimulai / selesai / room penuh: masuk sebagai penonton
    s.spectators ??= [];
    sid = s.snext = (s.snext || 0) + 1;
    s.spectators.push({ id: sid, name, tok });
    say(s, `${name} menonton.`);
  });
  await touch(id, pid ?? `s${sid}`);
  return { id, tok, pid, sid, room: pub({ ...row, version }, s) };
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
      if (active(s).length < 2) throw new E('Minimal 2 pemain untuk mulai.');
      s.status = 'playing'; s.turn = s.players.findIndex((p) => !p.left); s.phase = 'answer';
      s.q = await pickQ(row.level, s.used);
      s.n++;
      s.last = { n: s.n, type: 'start', text: `Permainan dimulai! Giliran ${s.players[s.turn].name}.` };
      say(s, s.last.text);
      return;
    }
    if (b.action === 'pick') {
      if (row.mode !== 'online' || s.status !== 'lobby') throw new E('Hewan hanya bisa diganti di ruang tunggu.');
      const me = tok ? s.players.find((x) => !x.left && x.tok === tok) : null;
      if (!me) throw new E('Kamu tidak ada di room ini.', 403);
      if (!AIDS.includes(b.animal)) throw new E('Hewan tidak dikenal.');
      if (s.players.some((x) => !x.left && x.id !== me.id && x.animal === b.animal)) throw new E('Hewan itu sudah dipilih pemain lain.');
      if (me.animal === b.animal) return 'noop';
      me.animal = b.animal;
      return;
    }
    if (b.action === 'sit') { // penonton -> pemain (hanya di ruang tunggu)
      if (row.mode !== 'online' || s.status !== 'lobby') throw new E('Bergabung sebagai pemain hanya bisa di ruang tunggu.');
      const sp = tok ? (s.spectators || []).find((x) => x.tok === tok) : null;
      if (!sp) throw new E('Kamu bukan penonton di room ini.', 403);
      if (active(s).length >= 6) throw new E('Room sudah penuh (maksimal 6 pemain).');
      if (active(s).some((x) => x.name.toLowerCase() === sp.name.toLowerCase())) throw new E('Nama itu sudah dipakai pemain lain di room ini.');
      const pid = s.players.length;
      const used = new Set(active(s).map((x) => x.color));
      let color = 0; while (used.has(color)) color++;
      s.spectators = s.spectators.filter((x) => x.id !== sp.id);
      s.players.push({ id: pid, name: sp.name, pos: 0, color, animal: freeAnimal(s, b.animal), tok });
      say(s, `${sp.name} bergabung.`);
      return;
    }
    if (b.action === 'again') { // main lagi di room yang sama
      if (s.status !== 'finished') throw new E('Permainan belum selesai.');
      if (!tok || host.tok !== tok) throw new E('Hanya host yang bisa mengajak main lagi.', 403);
      for (const x of s.players) if (!x.left) { x.pos = 0; x.done = false; x.rank = null; x.sixes = 0; }
      s.finishOrder = []; s.ranking = []; s.winner = null; s.dice = null; s.move = null; s.q = null;
      s.round = (s.round || 0) + 1;
      s.n++;
      if (row.mode === 'local') {
        s.status = 'playing'; s.turn = 0; s.phase = 'answer';
        s.q = await pickQ(row.level, s.used);
        s.last = { n: s.n, type: 'again', text: `Ronde baru dimulai! Giliran ${s.players[0].name}.` };
      } else {
        s.status = 'lobby'; s.phase = 'answer';
        s.last = { n: s.n, type: 'again', text: 'Kembali ke ruang tunggu. Siap main lagi?' };
      }
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
      const from = p.pos;
      p.sixes = d === 6 ? (p.sixes || 0) + 1 : 0;
      s.n++;
      s.dice = { n: s.n, who: p.id, v: d };
      // Tiga kali 6 berturut-turut: bidak tidak berjalan, kembali ke kotak RESET_TO, giliran pindah
      if (p.sixes >= MAX_SIXES) {
        p.sixes = 0;
        p.pos = RESET_TO;
        s.move = { n: s.n, who: p.id, dice: d, from, to: from, end: RESET_TO, kind: 'reset' };
        await nextTurn(s, row.level);
        const text = `${p.name} mendapat angka 6 sebanyak ${MAX_SIXES} kali berturut-turut, bidak kembali ke kotak ${RESET_TO}! Giliran ${s.players[s.turn].name}.`;
        s.last = { n: s.n, type: 'roll', who: p.id, dice: d, kind: 'reset', finished: null, over: false, bonus: false, text };
        say(s, text);
        return;
      }
      let to = p.pos + d;
      if (to > 100) to = 200 - to; // melewati 100: memantul balik
      let end = to, kind = null;
      if (LADDERS[to]) { end = LADDERS[to]; kind = 'ladder'; }
      else if (SNAKES[to]) { end = SNAKES[to]; kind = 'snake'; }
      p.pos = end;
      s.move = { n: s.n, who: p.id, dice: d, from, to, end, kind };
      let text = `${p.name} mengocok ${d} dan sampai di kotak ${to}`;
      text += kind === 'ladder' ? `, naik tangga ke ${end}!` : kind === 'snake' ? `, dimakan ular dan turun ke ${end}.` : '.';
      let finished = null, over = false, bonus = false;
      if (p.pos === 100) {
        p.sixes = 0;
        p.done = true;
        p.rank = s.finishOrder.length + 1;
        s.finishOrder.push(p.id);
        finished = p.rank;
        text += ` ${p.name} finis di peringkat ${p.rank}!`;
        if (settle(s)) { over = true; text += ' Permainan selesai.'; }
        else { await nextTurn(s, row.level); text += ` Permainan berlanjut. Giliran ${s.players[s.turn].name}.`; }
      } else if (d === 6) {
        bonus = true; // giliran tetap di pemain ini, langsung kocok lagi (tanpa soal baru)
        text += ` Dapat angka 6 (${p.sixes}/${MAX_SIXES} berturut-turut), ${p.name} kocok dadu lagi!`;
      } else {
        await nextTurn(s, row.level);
        text += ` Giliran ${s.players[s.turn].name}.`;
      }
      s.last = { n: s.n, type: 'roll', who: p.id, dice: d, kind, finished, over, bonus, text };
      say(s, text);
      return;
    }
    throw new E('Aksi tidak dikenal.');
  });
  const mePl = tok ? s.players.find((x) => !x.left && x.tok === tok) : null;
  return { room: pub({ ...row, version }, s), pid: mePl ? mePl.id : null };
}

async function leave(b) {
  await ensure();
  const id = String(b.id || '').trim().toUpperCase();
  const tok = b.tok ? String(b.tok) : null;
  const [row] = await sql`select id, mode, state from ut_rooms where id = ${id}`;
  if (!row || !tok) return { ok: true };
  if (row.mode === 'local') {
    if (row.state.players[row.state.host]?.tok === tok) await sql`delete from ut_rooms where id = ${id}`;
    return { ok: true };
  }
  const me = row.state.players.find((p) => !p.left && p.tok === tok);
  if (me) await dropAndClean(id, [me.id], 'leave');
  else {
    const sp = (row.state.spectators || []).find((x) => x.tok === tok);
    if (sp) await mutate(id, (s) => { s.spectators = (s.spectators || []).filter((x) => x.id !== sp.id); });
  }
  return { ok: true };
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
    const tok = p.get('tok');
    let [row] = await sql`select id, level, mode, state, version, seen from ut_rooms where id = ${id}`;
    if (!row) throw new E('Room tidak ditemukan.', 404);

    if (row.mode === 'online') {
      const now = Date.now();
      const seen = row.seen || {};
      // catat tanda hidup pemain yang sedang membuka room
      const me = tok ? row.state.players.find((x) => !x.left && x.tok === tok) : null;
      const sp = !me && tok ? (row.state.spectators || []).find((x) => x.tok === tok) : null;
      const key = me ? me.id : sp ? `s${sp.id}` : null;
      if (key !== null && now - (seen[key] ?? 0) > HEARTBEAT_MS) { seen[key] = now; await touch(id, key); }
      // keluarkan pemain yang sudah lama tidak terlihat (tab ditutup, koneksi putus)
      if (row.state.status === 'lobby' || row.state.status === 'playing') {
        const stale = active(row.state).filter((x) => now - (seen[x.id] ?? now) > STALE_MS).map((x) => x.id);
        if (stale.length) {
          const out = await dropAndClean(id, stale, 'idle');
          if (!out) throw new E('Room sudah ditutup.', 404);
          row = { ...row, state: out.s, version: out.version };
        }
      }
      // penonton yang tab-nya sudah ditutup ikut dibersihkan
      const staleSp = (row.state.spectators || []).filter((x) => now - (seen[`s${x.id}`] ?? now) > STALE_MS).map((x) => x.id);
      if (staleSp.length) {
        const out = await mutate(id, (s) => {
          const before = (s.spectators || []).length;
          s.spectators = (s.spectators || []).filter((x) => !staleSp.includes(x.id));
          return s.spectators.length === before ? 'noop' : undefined;
        });
        row = { ...row, state: out.s, version: out.version };
      }
    }
    if (row.version === v) return Response.json({ changed: false });
    return Response.json({ room: pub(row, row.state) });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const b = await req.json();
    if (b.action === 'create') return Response.json(await create(b));
    if (b.action === 'join') return Response.json(await join(b));
    if (b.action === 'leave') return Response.json(await leave(b));
    if (['start', 'pick', 'sit', 'again', 'answer', 'roll'].includes(b.action)) return Response.json(await act(b));
    throw new E('Aksi tidak dikenal.');
  } catch (e) { return fail(e); }
}
