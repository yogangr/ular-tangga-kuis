'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SNAKES, LADDERS, COLORS, LEVELS } from '../lib/utboard';

const LNAME = Object.fromEntries(LEVELS.map(([k, n]) => [k, n]));
const SC = ['#EF4444', '#16A34A', '#8B5CF6', '#F59E0B'];
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const OFF = [[-9, -9], [9, -9], [-9, 9], [9, 9], [0, -11], [0, 11]];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// pusat kotak n dalam koordinat 0..100 (kotak 1 di kiri bawah, jalur zig-zag)
const cx = (n) => {
  const r = Math.floor((n - 1) / 10), k = (n - 1) % 10, c = r % 2 ? 9 - k : k;
  return [c * 10 + 5, (9 - r) * 10 + 5];
};

function Dice({ v, rolling }) {
  const [t, setT] = useState(1);
  useEffect(() => {
    if (!rolling) return;
    const i = setInterval(() => setT(1 + Math.floor(Math.random() * 6)), 90);
    return () => clearInterval(i);
  }, [rolling]);
  const n = rolling ? t : v || 1;
  return (
    <div className={'ut-dice' + (rolling ? ' roll' : '') + (!v && !rolling ? ' idle' : '')} role="img" aria-label={`Dadu ${n}`}>
      {Array.from({ length: 9 }, (_, i) => <i key={i} className={PIPS[n].includes(i) ? 'on' : ''} />)}
    </div>
  );
}

function Ladder({ a, b }) {
  const [x1, y1] = cx(a), [x2, y2] = cx(b);
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  const nx = (-dy / L) * 1.5, ny = (dx / L) * 1.5, steps = Math.max(2, Math.floor(L / 5));
  return (
    <g stroke="#B9772B" strokeLinecap="round">
      <line x1={x1 + nx} y1={y1 + ny} x2={x2 + nx} y2={y2 + ny} strokeWidth="0.9" />
      <line x1={x1 - nx} y1={y1 - ny} x2={x2 - nx} y2={y2 - ny} strokeWidth="0.9" />
      {Array.from({ length: steps - 1 }, (_, i) => {
        const t = (i + 1) / steps;
        return <line key={i} x1={x1 + dx * t + nx} y1={y1 + dy * t + ny} x2={x1 + dx * t - nx} y2={y1 + dy * t - ny} strokeWidth="0.6" />;
      })}
    </g>
  );
}

function Snake({ a, b, color }) {
  const [x1, y1] = cx(a), [x2, y2] = cx(b);
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const pts = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20, o = Math.sin(t * Math.PI * 4) * 2.2 * (0.35 + 0.65 * (1 - t));
    return `${(x1 + dx * t + nx * o).toFixed(2)},${(y1 + dy * t + ny * o).toFixed(2)}`;
  }).join(' ');
  return (
    <g>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      <circle cx={x1} cy={y1} r="2.2" fill={color} />
      <circle cx={x1 - 0.7} cy={y1 - 0.5} r=".5" fill="#fff" />
      <circle cx={x1 + 0.7} cy={y1 - 0.5} r=".5" fill="#fff" />
    </g>
  );
}

function Board({ players }) {
  const cells = [];
  for (let r = 9; r >= 0; r--) {
    for (let c = 0; c < 10; c++) {
      const n = r * 10 + (r % 2 === 0 ? c + 1 : 10 - c);
      cells.push(<div key={n} className={'ut-cell ' + ((r + c) % 2 ? 'a' : 'b') + (n === 100 ? ' end' : '')}>{n}</div>);
    }
  }
  return (
    <div className="ut-board">
      <div className="ut-grid">{cells}</div>
      <svg className="ut-svg" viewBox="0 0 100 100" aria-hidden="true">
        {Object.entries(LADDERS).map(([a, b]) => <Ladder key={a} a={+a} b={b} />)}
        {Object.entries(SNAKES).map(([a, b], i) => <Snake key={a} a={+a} b={b} color={SC[i % SC.length]} />)}
      </svg>
      {players.filter((p) => p.pos > 0).map((p) => {
        const [x, y] = cx(p.pos), o = OFF[p.id % 6];
        return (
          <div key={p.id} className="ut-pawn" title={p.name}
            style={{ left: x + '%', top: y + '%', background: COLORS[p.color], transform: `translate(calc(-50% + ${o[0]}px), calc(-50% + ${o[1]}px))` }} />
        );
      })}
    </div>
  );
}

function PlayerList({ room }) {
  return (
    <ul className="ut-players">
      {room.players.map((p) => (
        <li key={p.id} className={room.status === 'playing' && room.turn === p.id ? 'cur' : ''}>
          <span className="ut-dot" style={{ background: COLORS[p.color] }} />
          {p.name}{p.id === room.host && room.mode === 'online' ? ' (host)' : ''}
          <small>{room.status === 'lobby' ? '' : p.pos ? `Kotak ${p.pos}` : 'Start'}</small>
        </li>
      ))}
    </ul>
  );
}

export default function Page() {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('mudah');
  const [joinId, setJoinId] = useState('');
  const [locals, setLocals] = useState(['Pemain 1', 'Pemain 2']);
  const [room, setRoom] = useState(null);
  const [me, setMe] = useState(null);
  const [resume, setResume] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [party, setParty] = useState(false);
  const ver = useRef(-1);

  const api = async (body) => {
    const r = await fetch('/api/ut', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Terjadi kesalahan.');
    return d;
  };
  const apply = (rm) => { if (rm && rm.version >= ver.current) { ver.current = rm.version; setRoom(rm); } };
  const enter = (d) => {
    const m = { id: d.id, tok: d.tok, pid: d.pid };
    ver.current = -1; setMe(m); apply(d.room);
    localStorage.setItem('ut-last', JSON.stringify(m));
  };
  const run = async (fn) => { setErr(''); setBusy(true); try { await fn(); } catch (e) { setErr(e.message); } setBusy(false); };
  const leave = () => { setRoom(null); setMe(null); setResume(null); setErr(''); localStorage.removeItem('ut-last'); };

  useEffect(() => {
    setName(localStorage.getItem('kuis-name') || '');
    const l = localStorage.getItem('kuis-level'); if (LNAME[l]) setLevel(l);
    const q = new URLSearchParams(location.search).get('room'); if (q) setJoinId(q.toUpperCase());
    try {
      const last = JSON.parse(localStorage.getItem('ut-last') || 'null');
      if (last) fetch(`/api/ut?id=${last.id}`).then((r) => r.json())
        .then((d) => { if (d.room && d.room.status !== 'finished') setResume({ ...last, room: d.room }); }).catch(() => {});
    } catch {}
  }, []);

  // Cek perubahan room tiap 1,5 detik (untuk main online)
  useEffect(() => {
    if (!me) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/ut?id=${me.id}&v=${ver.current}`, { cache: 'no-store' });
        const d = await r.json();
        if (r.ok && d.room) apply(d.room);
      } catch {}
    }, 1500);
    return () => clearInterval(t);
  }, [me]);

  useEffect(() => {
    if (room?.status !== 'finished') return;
    setParty(true);
    const t = setTimeout(() => setParty(false), 5200);
    return () => clearTimeout(t);
  }, [room?.status]);

  const pieces = useMemo(() => (room?.status === 'finished'
    ? Array.from({ length: 50 }, (_, k) => ({ l: Math.random() * 100, c: COLORS[k % 6], d: Math.random() * 0.9, t: 2.6 + Math.random() * 1.8, s: 6 + Math.random() * 7, r: 360 + Math.random() * 540 }))
    : []), [room?.status]);

  const needName = () => { if (!name.trim()) { setErr('Isi nama dulu.'); return true; } localStorage.setItem('kuis-name', name.trim()); localStorage.setItem('kuis-level', level); return false; };
  const createOnline = () => { if (!needName()) run(async () => enter(await api({ action: 'create', mode: 'online', name, level }))); };
  const joinRoom = () => {
    if (needName()) return;
    if (!joinId.trim()) { setErr('Isi ID room.'); return; }
    run(async () => enter(await api({ action: 'join', id: joinId, name })));
  };
  const createLocal = () => { localStorage.setItem('kuis-level', level); run(async () => enter(await api({ action: 'create', mode: 'local', names: locals, level }))); };
  const setCount = (n) => setLocals((a) => Array.from({ length: n }, (_, i) => a[i] ?? `Pemain ${i + 1}`));
  const act = (type, extra = {}) => run(async () => {
    if (type === 'roll') {
      setRolling(true);
      const [d] = await Promise.all([api({ action: type, id: me.id, tok: me.tok }), wait(800)]);
      apply(d.room);
    } else {
      apply((await api({ action: type, id: me.id, tok: me.tok, ...extra })).room);
    }
  }).finally(() => setRolling(false));
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/?room=${room.id}`); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  /* ---------- Menu ---------- */
  if (!room) {
    return (
      <main>
        <div className="card">
          <h1>Ular Tangga Kuis</h1>
          <p className="mute">Jawab soal dengan benar untuk boleh mengocok dadu. Jawaban salah membuat giliranmu dilewati. Yang lebih dulu sampai kotak 100 menang.</p>
        </div>
        {resume && (
          <div className="card">
            <button className="btn sun" style={{ marginTop: 0 }} onClick={() => enter(resume)}>Lanjutkan room {resume.id}</button>
          </div>
        )}
        <div className="ut-menu">
          <div className="card">
            <h2>Pengaturan</h2>
            <label htmlFor="n">Nama kamu (untuk main online)</label>
            <input id="n" maxLength={16} value={name} placeholder="Contoh: Dewi" onChange={(e) => setName(e.target.value)} />
            <label style={{ marginTop: 14 }}>Tingkat soal</label>
            <div className="lv" role="radiogroup" aria-label="Tingkat soal">
              {LEVELS.map(([k, t, d]) => (
                <button key={k} data-l={k} role="radio" aria-checked={level === k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)}>
                  <b>{t}</b><small>{d}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <h2>Main online</h2>
            <p className="mute" style={{ marginBottom: 6 }}>Buat room lalu bagikan ID-nya ke teman.</p>
            <button className="btn" style={{ marginTop: 8 }} onClick={createOnline} disabled={busy}>Buat room baru</button>
            <p className="ut-or">atau gabung ke room teman</p>
            <label htmlFor="rid">ID room</label>
            <input id="rid" maxLength={5} value={joinId} placeholder="Contoh: K7M2P" style={{ textTransform: 'uppercase' }}
              onChange={(e) => setJoinId(e.target.value.toUpperCase())} />
            <button className="btn alt" onClick={joinRoom} disabled={busy}>Gabung room</button>
          </div>
        </div>
        <div className="card">
          <h2>Main 1 perangkat (gantian)</h2>
          <p className="mute">Semua pemain bergantian memakai perangkat ini.</p>
          <label htmlFor="cnt">Jumlah pemain</label>
          <select id="cnt" value={locals.length} onChange={(e) => setCount(+e.target.value)}
            style={{ width: '100%', font: 'inherit', padding: 12, border: '2px solid var(--line)', borderRadius: 14, marginBottom: 10 }}>
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} pemain</option>)}
          </select>
          <div className="ut-names">
            {locals.map((v, i) => (
              <input key={i} maxLength={16} value={v} aria-label={`Nama pemain ${i + 1}`}
                onChange={(e) => setLocals((a) => a.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
          </div>
          <button className="btn" onClick={createLocal} disabled={busy}>Mulai permainan</button>
        </div>
        {err && <p className="err">{err}</p>}
      </main>
    );
  }

  /* ---------- Room ---------- */
  const cur = room.players[room.turn];
  const mine = room.mode === 'local' || room.turn === me.pid;
  const winner = room.winner != null ? room.players[room.winner] : null;
  const last = room.last;
  const tone = !last ? '' : last.type === 'wrong' || last.kind === 'snake' ? ' bad' : last.type === 'correct' || last.kind === 'ladder' ? ' good' : '';

  return (
    <main>
      <div className="ut-top">
        <div>
          <b>Ular Tangga Kuis</b> <span className="mute">· Room {room.id} · {LNAME[room.level]}{room.mode === 'local' ? ' · 1 perangkat' : ''}</span>
        </div>
        <button className="btn alt" style={{ width: 'auto', marginTop: 0, padding: '8px 16px' }} onClick={leave}>Keluar</button>
      </div>

      {room.status === 'lobby' && (
        <div className="card">
          <h2>Ruang tunggu</h2>
          <div className="ut-room">{room.id}</div>
          <p className="mute">Bagikan ID ini atau tautan undangan ke temanmu (maksimal 6 pemain).</p>
          <button className="btn alt" onClick={copy}>{copied ? 'Tautan tersalin!' : 'Salin tautan undangan'}</button>
          <PlayerList room={room} />
          {me.pid === room.host
            ? <button className="btn" onClick={() => act('start')} disabled={busy || room.players.length < 2}>
                {room.players.length < 2 ? 'Menunggu pemain lain...' : `Mulai permainan (${room.players.length} pemain)`}
              </button>
            : <p className="hint">Menunggu host memulai permainan...</p>}
          {err && <p className="err">{err}</p>}
        </div>
      )}

      {room.status !== 'lobby' && (
        <div className="ut-game">
          <Board players={room.players} />
          <div>
            <div className="card">
              <div className="ut-turn">
                <span className="ut-dot" style={{ background: COLORS[(winner || cur).color] }} />
                {room.status === 'finished'
                  ? `${winner.name} menang!`
                  : `Giliran ${cur.name}${room.mode === 'online' && mine ? ' (kamu)' : ''}`}
              </div>
              {last && <div className={'ut-banner' + tone} role="status">{last.text}</div>}

              {room.status === 'playing' && room.phase === 'answer' && room.q && (
                <>
                  <p className="q" style={{ fontSize: 19, minHeight: 0 }}>{room.q.q}</p>
                  {room.q.options.map((o, k) => (
                    <button key={o} className="opt" disabled={!mine || busy} onClick={() => act('answer', { pick: o })}>
                      <b>{'ABCD'[k]}</b>{o}
                    </button>
                  ))}
                  {!mine && <p className="hint">Menunggu {cur.name} menjawab...</p>}
                </>
              )}

              {room.status === 'playing' && room.phase === 'roll' && (
                <div className="ut-rollbox">
                  <Dice v={room.dice?.v} rolling={rolling} />
                  <button className="btn" disabled={!mine || busy} onClick={() => act('roll')}>
                    {mine ? 'Kocok dadu' : `Menunggu ${cur.name} mengocok...`}
                  </button>
                </div>
              )}

              {room.status === 'finished' && (
                <button className="btn sun" onClick={leave}>Main lagi</button>
              )}
              {err && <p className="err">{err}</p>}
            </div>

            <div className="card">
              <h2>Pemain</h2>
              <PlayerList room={room} />
            </div>
            <div className="card">
              <h2>Riwayat</h2>
              <ul className="ut-log">{room.log.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {party && winner && (
        <div className="party" role="status">
          {pieces.map((p, k) => (
            <i key={k} style={{ left: p.l + '%', width: p.s, height: p.s * 1.6, background: p.c, '--t': p.t + 's', '--d': p.d + 's', '--r2': p.r + 'deg' }} />
          ))}
          <div className="pop">
            <b>{winner.name}</b>
            <span className="mute">memenangkan permainan!</span>
          </div>
        </div>
      )}
    </main>
  );
}
