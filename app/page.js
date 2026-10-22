"use client";
import { useEffect, useRef, useState } from "react";
import {
  MAPS,
  getMap,
  TILE_INFO,
  COLORS,
  LEVELS,
  ANIMALS,
  SKILLS,
  cx,
  snakePts,
  hopSquares,
} from "../lib/utboard";

const LNAME = Object.fromEntries(LEVELS.map(([k, n]) => [k, n]));
const AMAP = Object.fromEntries(ANIMALS.map(([k, e, n]) => [k, { e, n }]));
const face = (p) => (p.animal ? (AMAP[p.animal]?.e ?? "🐾") : "❓"); // emoji hewan pemain (❓ = belum dibagikan)
const ruleText = (r) =>
  r > 0
    ? `Skill pulih setelah ${r} jawaban benar beruntun.`
    : "Skill hanya bisa dipakai 1× per permainan.";
const ROLL_SKILLS = ["kelinci", "katak", "penguin"]; // skill yang langsung mengocok dadu
const skillLine = (p, recharge) => {
  const sk = SKILLS[p.animal];
  const st = !p.spent
    ? sk.when === "passive"
      ? "aktif"
      : "siap"
    : recharge > 0
      ? `terpakai, pulih ${p.streak}/${recharge}`
      : "terpakai";
  return `${sk.name} · ${st}${p.skip ? " · akan dilewati" : ""}`;
};
const SC = ["#ef4444", "#22a559", "#8b5cf6", "#f59e0b", "#0ea5e9", "#ec4899"]; // warna ular
const LVL_ICO = { mudah: "🌱", sedang: "📘", sulit: "🔥", olimpiade: "🏆" };
const MAP_ICO = {
  klasik: "🎲",
  rawa: "🐸",
  gunung: "🌋",
  es: "🧊",
  portal: "🌀",
};
const PIPS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};
const OFF = [
  [-7, -4],
  [7, -4],
  [-7, 4],
  [7, 4],
  [0, -8],
  [0, 8],
]; // geser kecil kalau satu kotak diisi banyak pemain
const HOP = 230; // lama satu lompatan (ms)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const makePieces = () =>
  Array.from({ length: 50 }, (_, k) => ({
    l: Math.random() * 100,
    c: COLORS[k % 6],
    d: Math.random() * 0.9,
    t: 2.6 + Math.random() * 1.8,
    s: 6 + Math.random() * 7,
    r: 360 + Math.random() * 540,
  }));

function Dice({ v, rolling }) {
  const [t, setT] = useState(1);
  useEffect(() => {
    if (!rolling) return;
    const i = setInterval(() => setT(1 + Math.floor(Math.random() * 6)), 90);
    return () => clearInterval(i);
  }, [rolling]);
  const n = rolling ? t : v || 1;
  return (
    <div
      className={
        "ut-dice" + (rolling ? " roll" : "") + (!v && !rolling ? " idle" : "")
      }
      role="img"
      aria-label={`Dadu ${n}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={PIPS[n].includes(i) ? "on" : ""} />
      ))}
    </div>
  );
}

function Ladder({ a, b }) {
  const [x1, y1] = cx(a),
    [x2, y2] = cx(b);
  const dx = x2 - x1,
    dy = y2 - y1,
    L = Math.hypot(dx, dy);
  const nx = (-dy / L) * 1.7,
    ny = (dx / L) * 1.7,
    steps = Math.max(2, Math.floor(L / 4.4));
  const rungs = Array.from({ length: steps - 1 }, (_, i) => {
    const t = (i + 1) / steps;
    return [x1 + dx * t, y1 + dy * t];
  });
  // satu lapisan tangga (bayangan, kayu, kilau) supaya terlihat bervolume
  const layer = (key, stroke, rail, rung, ox = 0, oy = 0) => (
    <g key={key} stroke={stroke} transform={`translate(${ox} ${oy})`}>
      <line
        x1={x1 + nx}
        y1={y1 + ny}
        x2={x2 + nx}
        y2={y2 + ny}
        strokeWidth={rail}
      />
      <line
        x1={x1 - nx}
        y1={y1 - ny}
        x2={x2 - nx}
        y2={y2 - ny}
        strokeWidth={rail}
      />
      {rungs.map(([x, y], i) => (
        <line
          key={i}
          x1={x + nx}
          y1={y + ny}
          x2={x - nx}
          y2={y - ny}
          strokeWidth={rung}
        />
      ))}
    </g>
  );
  return (
    <g strokeLinecap="round">
      {layer("s", "rgba(60,30,0,.25)", 1.5, 1, 0.45, 0.7)}
      {layer("w", "#9a5b22", 1.3, 0.85)}
      {layer("h", "#e6ad63", 0.5, 0.3)}
    </g>
  );
}

function Snake({ a, b, color }) {
  const pts = snakePts(a, b, 40);
  const n = pts.length;
  const w = (i) => 2.3 - 1.2 * (i / (n - 1)); // kepala tebal, ekor ramping
  const f = (v) => v.toFixed(2);
  const [x0, y0] = pts[0],
    [x1, y1] = pts[1];
  const deg = (Math.atan2(y0 - y1, x0 - x1) * 180) / Math.PI; // kepala menghadap menjauh dari badan
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("");
  const segs = pts.slice(0, -1);
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {segs.map(([x, y], i) => (
        <line
          key={"o" + i}
          x1={f(x)}
          y1={f(y)}
          x2={f(pts[i + 1][0])}
          y2={f(pts[i + 1][1])}
          stroke="rgba(20,12,50,.5)"
          strokeWidth={w(i) + 0.7}
        />
      ))}
      {segs.map(([x, y], i) => (
        <line
          key={"b" + i}
          x1={f(x)}
          y1={f(y)}
          x2={f(pts[i + 1][0])}
          y2={f(pts[i + 1][1])}
          stroke={color}
          strokeWidth={w(i)}
        />
      ))}
      <path
        d={d}
        stroke="rgba(255,255,255,.4)"
        strokeWidth=".55"
        strokeDasharray="0.01 1.7"
      />
      <g transform={`translate(${f(x0)} ${f(y0)}) rotate(${f(deg)})`}>
        <path
          d="M2.4 0H4.3M4.3 0l.8-.6M4.3 0l.8.6"
          stroke="#e11d48"
          strokeWidth=".3"
        />
        <ellipse
          cx=".2"
          rx="2.7"
          ry="2.2"
          fill={color}
          stroke="rgba(20,12,50,.5)"
          strokeWidth=".35"
        />
        <circle cx=".9" cy="-1" r=".72" fill="#fff" />
        <circle cx=".9" cy="1" r=".72" fill="#fff" />
        <circle cx="1.1" cy="-1" r=".33" fill="#111" />
        <circle cx="1.1" cy="1" r=".33" fill="#111" />
      </g>
    </g>
  );
}

// Ikon pemain: pin lokasi berwarna sesuai pemain, berisi emoji hewan pilihannya
function Pin({ color, label, fx }) {
  return (
    <svg viewBox="0 0 30 40" className={"ut-pin " + fx} aria-hidden="true">
      <path
        d="M15 39C15 39 2.5 24.5 2.5 14.5a12.5 12.5 0 0 1 25 0C27.5 24.5 15 39 15 39z"
        fill={color}
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="14.5" r="9.6" fill="#fff" />
      <circle
        cx="15"
        cy="14.5"
        r="9.6"
        fill="none"
        stroke={color}
        strokeOpacity=".28"
        strokeWidth="1.2"
      />
      <text x="15" y="19.4" textAnchor="middle" fontSize="13">
        {label}
      </text>
    </svg>
  );
}

function Board({ players, move, turn, playing, map }) {
  const mp = getMap(map);
  const [pawns, setPawns] = useState(() =>
    Object.fromEntries(
      players
        .filter((p) => p.pos > 0)
        .map((p) => {
          const [x, y] = cx(p.pos);
          return [p.id, { x, y, dur: 0, fx: "", k: 0 }];
        }),
    ),
  );
  const latest = useRef(players);
  latest.current = players;
  const seen = useRef(move?.n ?? 0); // langkah yang sudah ada saat papan dibuka tidak dianimasikan ulang
  const queue = useRef([]);
  const running = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const put = (id, x, y, dur, fx) =>
    setPawns((s) => ({
      ...s,
      [id]: { x, y, dur, fx, k: (s[id]?.k || 0) + 1 },
    }));
  const sync = () =>
    setPawns(
      Object.fromEntries(
        latest.current
          .filter((p) => p.pos > 0)
          .map((p) => {
            const [x, y] = cx(p.pos);
            return [p.id, { x, y, dur: 0, fx: "", k: 0 }];
          }),
      ),
    );

  // Mainkan satu langkah: lompat kotak demi kotak, lalu tangga / ular / lava / es / portal
  async function play(m) {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const [x, y] = cx(m.end);
      put(m.who, x, y, 0, "");
      await wait(300);
      return;
    }
    if (m.kind === "reset" || m.kind === "push") {
      // tiga kali 6 / Terkam: bidak meluncur mundur
      if (m.from > 0) {
        const [x0, y0] = cx(m.from);
        put(m.who, x0, y0, 0, "");
        await wait(30);
      }
      await wait(m.kind === "reset" ? 700 : 300); // beri waktu dadu terlihat dulu
      const [x, y] = cx(m.end);
      if (m.from === 0) {
        put(m.who, x, y, 0, "drop");
        await wait(480);
      } else {
        put(m.who, x, y, 700, "slide");
        await wait(700);
      }
      await wait(150);
      return;
    }
    if (m.from > 0) {
      const [x, y] = cx(m.from);
      put(m.who, x, y, 0, "");
      await wait(30);
    }
    const path = hopSquares(m.from, m.dice);
    for (let i = 0; i < path.length; i++) {
      if (!alive.current) return;
      const [x, y] = cx(path[i]);
      if (i === 0 && m.from === 0) {
        put(m.who, x, y, 0, "drop");
        await wait(480);
      } else {
        put(m.who, x, y, HOP, "hop");
        await wait(HOP);
      }
    }
    // Naik tangga atau meluncur di tubuh ular dari kotak a ke kotak b
    const travel = async (kind, a, b) => {
      if (kind === "ladder") {
        await wait(120);
        const [x1, y1] = cx(a),
          [x2, y2] = cx(b);
        const steps = Math.min(
          14,
          Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / 7)),
        );
        for (let i = 1; i <= steps; i++) {
          if (!alive.current) return;
          put(
            m.who,
            x1 + ((x2 - x1) * i) / steps,
            y1 + ((y2 - y1) * i) / steps,
            150,
            "climb",
          );
          await wait(150);
        }
      } else if (kind === "snake") {
        await wait(180);
        const [x1, y1] = cx(a),
          [x2, y2] = cx(b);
        const N = Math.min(
          56,
          Math.max(18, Math.round(Math.hypot(x2 - x1, y2 - y1) * 1.5)),
        );
        const pts = snakePts(a, b, N);
        for (let i = 1; i < pts.length; i++) {
          if (!alive.current) return;
          put(m.who, pts[i][0], pts[i][1], 40, "slide");
          await wait(40);
        }
      }
    };
    if (m.kind === "ladder" || m.kind === "snake") {
      await travel(m.kind, m.to, m.end);
    } else if (m.kind === "lava") {
      // terdorong mundur dari kotak lava
      await wait(250);
      const [x2, y2] = cx(m.end);
      put(m.who, x2, y2, 600, "slide");
      await wait(600);
    } else if (m.kind === "ice") {
      // meluncur maju di es, lalu mungkin naik tangga / dimakan ular
      await wait(200);
      const [xs, ys] = cx(m.slideTo);
      put(m.who, xs, ys, 450, "slide");
      await wait(450);
      if (m.slideKind) await travel(m.slideKind, m.slideTo, m.end);
    } else if (m.kind === "portal") {
      // tersedot portal, muncul di pasangannya
      await wait(300);
      const [x2, y2] = cx(m.end);
      put(m.who, x2, y2, 0, "drop");
      await wait(480);
    }
    await wait(150);
  }

  useEffect(() => {
    if (!move || move.n <= seen.current) return;
    seen.current = move.n;
    queue.current.push(move);
    if (running.current) return;
    (async () => {
      running.current = true;
      while (queue.current.length && alive.current)
        await play(queue.current.shift());
      running.current = false;
      if (alive.current) sync();
    })();
  }, [move?.n]);

  const cells = [];
  for (let r = 9; r >= 0; r--) {
    for (let c = 0; c < 10; c++) {
      const n = r * 10 + (r % 2 === 0 ? c + 1 : 10 - c);
      const t = mp.tiles[n];
      cells.push(
        <div
          key={n}
          className={
            "ut-cell " +
            ((r + c) % 2 ? "a" : "b") +
            (n === 100 ? " end" : "") +
            (n === 1 ? " start" : "") +
            (t ? " " + t : "")
          }
          data-pl={mp.portalLabels?.[n]}
        >
          {n}
        </div>,
      );
    }
  }

  return (
    <div className="ut-board">
      <div className="ut-grid">{cells}</div>
      <svg className="ut-svg" viewBox="0 0 100 100" aria-hidden="true">
        {Object.entries(mp.ladders).map(([a, b]) => (
          <Ladder key={a} a={+a} b={b} />
        ))}
        {Object.entries(mp.snakes).map(([a, b], i) => (
          <Snake key={a} a={+a} b={b} color={SC[i % SC.length]} />
        ))}
      </svg>
      {players.map((p) => {
        let s = pawns[p.id];
        if (!s) {
          if (p.pos <= 0) return null;
          if (move && move.who === p.id && move.n > seen.current) return null; // tunggu animasinya mulai
          const [x, y] = cx(p.pos);
          s = { x, y, dur: 0, fx: "", k: 0 };
        }
        const o = OFF[p.id % 6];
        const fx = s.fx || (playing && turn === p.id ? "idle" : "");
        return (
          <div
            key={p.id}
            className={
              "ut-pawn" +
              (s.fx ? " go" : "") +
              (playing && turn === p.id ? " turn" : "")
            }
            title={p.name}
            style={{
              left: s.x + "%",
              top: s.y + 3 + "%",
              transitionDuration: s.dur + "ms",
              transform: `translate(calc(-50% + ${o[0]}px), calc(-100% + ${o[1]}px))`,
            }}
          >
            <Pin key={s.k} color={COLORS[p.color]} label={face(p)} fx={fx} />
          </div>
        );
      })}
    </div>
  );
}

function PlayerList({ room }) {
  return (
    <ul className="ut-players">
      {room.players
        .filter((p) => !p.left)
        .map((p) => (
          <li
            key={p.id}
            className={
              room.status === "playing" && room.turn === p.id ? "cur" : ""
            }
          >
            <span className="ut-dot" style={{ background: COLORS[p.color] }} />
            <span className="ut-face" aria-hidden="true">
              {face(p)}
            </span>
            <span className="ut-pname">
              {p.name}
              {p.id === room.host && room.mode === "online" ? " (host)" : ""}
            </span>
            <small>
              {room.status === "lobby"
                ? ""
                : p.done
                  ? `Finis · peringkat ${p.rank}`
                  : room.status === "finished" && p.rank
                    ? `Peringkat ${p.rank} · kotak ${p.pos}`
                    : p.pos
                      ? `Kotak ${p.pos}`
                      : "Start"}
            </small>
            {room.status !== "lobby" && (
              <div className="ut-bar" aria-hidden="true">
                <i
                  style={{
                    width: Math.min(100, p.pos || 0) + "%",
                    background: COLORS[p.color],
                  }}
                />
              </div>
            )}
            {room.status !== "lobby" && p.animal && SKILLS[p.animal] && (
              <span className="ut-sk">{skillLine(p, room.recharge)}</span>
            )}
          </li>
        ))}
    </ul>
  );
}

// Pengaturan pemulihan skill: 0 = sekali per permainan, 1-10 = pulih setelah N jawaban benar beruntun
function SkillRule({ value, onChange, disabled }) {
  const recharge = value > 0;
  return (
    <div className="ut-rule">
      <div className="lv" role="radiogroup" aria-label="Aturan pemakaian skill">
        <button
          role="radio"
          aria-checked={!recharge}
          className={!recharge ? "on" : ""}
          disabled={disabled}
          onClick={() => onChange(0)}
        >
          <span className="ico">🎯</span>
          <b>1× per permainan</b>
          <small>Skill hanya dipakai sekali</small>
        </button>
        <button
          role="radio"
          aria-checked={recharge}
          className={recharge ? "on" : ""}
          disabled={disabled}
          onClick={() => onChange(value || 3)}
        >
          <span className="ico">🔄</span>
          <b>Pulih lewat kuis</b>
          <small>Aktif lagi setelah jawab benar beruntun</small>
        </button>
      </div>
      {recharge && (
        <div className="ut-rule-n">
          <label htmlFor="rc">
            Pulih setelah jawab benar beruntun sebanyak
          </label>
          <select
            id="rc"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(+e.target.value)}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} kali
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// Pilihan map. Dipakai di menu awal dan di ruang tunggu (khusus host)
function MapPick({ value, onChange, disabled }) {
  return (
    <div className="lv" role="radiogroup" aria-label="Pilih map">
      {Object.entries(MAPS).map(([k, m]) => (
        <button
          key={k}
          role="radio"
          aria-checked={value === k}
          className={value === k ? "on" : ""}
          disabled={disabled}
          onClick={() => onChange(k)}
        >
          <span className="ico">{MAP_ICO[k] ?? "🗺️"}</span>
          <b>{m.name}</b>
          <small>{m.desc}</small>
        </button>
      ))}
    </div>
  );
}

// Legenda papan: tangga, ular, dan kotak spesial milik map yang sedang dipakai
function TileLegend({ map }) {
  const kinds = [...new Set(Object.values(getMap(map).tiles))];
  return (
    <ul className="ut-legend">
      <li>
        <i className="ut-key ladder" />
        <span>
          <b>Tangga</b> naik
        </span>
      </li>
      <li>
        <i className="ut-key snake" />
        <span>
          <b>Ular</b> turun
        </span>
      </li>
      {kinds.map((k) => (
        <li key={k}>
          <i className={"ut-key " + k} />
          <span>
            <b>{TILE_INFO[k].name}</b> {TILE_INFO[k].desc}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Daftar semua hewan dan skill-nya (terbuka untuk semua pemain)
function AnimalGuide() {
  return (
    <ul className="ut-guide">
      {ANIMALS.map(([k, e, n]) => (
        <li key={k}>
          <span className="ut-face" aria-hidden="true">
            {e}
          </span>
          <div>
            <b>
              {n}: {SKILLS[k].name}
            </b>
            <small>{SKILLS[k].desc}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Kartu skill untuk pemain yang sedang giliran
function SkillPanel({ room, busy, onUse }) {
  const p = room.players[room.turn];
  const sk = p && SKILLS[p.animal];
  if (!sk || room.status !== "playing" || p.done) return null;
  const ph = room.phase,
    ready = !p.spent;
  const targets = room.players.filter(
    (x) => !x.left && !x.done && x.id !== p.id,
  );
  let body;
  if (sk.when === "passive") body = null;
  else if (!ready)
    body = (
      <p className="hint">
        Skill sudah terpakai
        {room.recharge > 0
          ? `. Jawab benar beruntun ${room.recharge - p.streak} kali lagi untuk memulihkannya.`
          : "."}
      </p>
    );
  else if (sk.when === "answer") {
    body = (
      <button
        className="btn alt"
        disabled={
          busy ||
          ph !== "answer" ||
          (p.animal === "rubah" && (room.q?.options.length ?? 0) <= 2)
        }
        onClick={() => onUse({})}
      >
        Pakai {sk.name}
      </button>
    );
  } else if (p.animal === "penguin") {
    body = (
      <>
        <p className="hint">
          Pilih angka dadu (langsung jalan, tanpa mengocok):
        </p>
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            className="btn alt"
            disabled={busy || ph !== "roll"}
            onClick={() => onUse({ value: v })}
          >
            {v}
          </button>
        ))}
      </>
    );
  } else if (sk.when === "roll") {
    body = (
      <button
        className="btn alt"
        disabled={busy || ph !== "roll"}
        onClick={() => onUse({})}
      >
        Pakai {sk.name} (langsung kocok)
      </button>
    );
  } else {
    body = (
      <>
        <p className="hint">Pilih lawan:</p>
        {targets.map((t) => (
          <button
            key={t.id}
            className="btn alt"
            disabled={
              busy ||
              (p.animal === "harimau" && t.pos < 2) ||
              (p.animal === "singa" && t.skip)
            }
            onClick={() => onUse({ target: t.id })}
          >
            {face(t)} {t.name}
          </button>
        ))}
      </>
    );
  }
  return (
    <div className="ut-skill">
      <div className="ut-skill-h">
        <span className="ut-face" aria-hidden="true">
          {face(p)}
        </span>
        <b>{sk.name}</b>
        <span className={"ut-chip" + (ready ? " on" : "")}>
          {ready
            ? sk.when === "passive"
              ? "aktif otomatis"
              : "siap"
            : "terpakai"}
        </span>
      </div>
      <p className="hint">{sk.desc}</p>
      {body && <div className="ut-sk-actions">{body}</div>}
    </div>
  );
}

function Spectators({ room }) {
  const sp = room.spectators || [];
  if (!sp.length) return null;
  return (
    <p className="hint ut-spectators">
      👀 Penonton ({sp.length}): {sp.map((x) => x.name).join(", ")}
    </p>
  );
}

export default function Page() {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("mudah");
  const [mapId, setMapId] = useState("klasik");
  const [joinId, setJoinId] = useState("");
  const [locals, setLocals] = useState(["Pemain 1", "Pemain 2"]);
  const [room, setRoom] = useState(null);
  const [me, setMe] = useState(null);
  const [resume, setResume] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [party, setParty] = useState(null);
  const [reveal, setReveal] = useState(false); // pembagian hewan & skill
  const [recharge, setRecharge] = useState(0); // 0 = skill 1× per permainan, 1-10 = pulih setelah N jawaban benar beruntun
  const partySeen = useRef(null);
  const ver = useRef(-1);

  const api = async (body) => {
    const r = await fetch("/api/ut", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Terjadi kesalahan.");
    return d;
  };
  const apply = (rm) => {
    if (rm && rm.version >= ver.current) {
      ver.current = rm.version;
      setRoom(rm);
    }
  };
  const enter = (d) => {
    const m = { id: d.id, tok: d.tok, pid: d.pid ?? null, sid: d.sid ?? null };
    ver.current = -1;
    setMe(m);
    apply(d.room);
    localStorage.setItem("ut-last", JSON.stringify(m));
  };
  const run = async (fn) => {
    setErr("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };
  // Keluar dari room: server menghapus pemain ini dari daftar (room lokal ikut dihapus)
  const leave = (msg = "") => {
    if (me) {
      fetch("/api/ut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ action: "leave", id: me.id, tok: me.tok }),
      }).catch(() => {});
    }
    setRoom(null);
    setMe(null);
    setResume(null);
    setReveal(false);
    setErr(msg);
    localStorage.removeItem("ut-last");
  };

  useEffect(() => {
    setName(localStorage.getItem("kuis-name") || "");
    const l = localStorage.getItem("kuis-level");
    if (LNAME[l]) setLevel(l);
    const mp = localStorage.getItem("kuis-map");
    if (MAPS[mp]) setMapId(mp);
    const rc = Number(localStorage.getItem("kuis-recharge"));
    if (Number.isInteger(rc) && rc >= 0 && rc <= 10) setRecharge(rc);
    const q = new URLSearchParams(location.search).get("room");
    if (q) setJoinId(q.toUpperCase());
    try {
      const last = JSON.parse(localStorage.getItem("ut-last") || "null");
      if (last)
        fetch(`/api/ut?id=${last.id}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.room && d.room.status !== "finished")
              setResume({ ...last, room: d.room });
          })
          .catch(() => {});
    } catch {}
  }, []);

  // Cek perubahan room tiap 1,5 detik (untuk main online)
  useEffect(() => {
    if (!me) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(
          `/api/ut?id=${me.id}&v=${ver.current}&tok=${me.tok}`,
          { cache: "no-store" },
        );
        if (r.status === 404) {
          leave("Room sudah ditutup.");
          return;
        }
        const d = await r.json();
        if (r.ok && d.room) apply(d.room);
      } catch {}
    }, 1500);
    return () => clearInterval(t);
  }, [me]);

  useEffect(() => {
    if (me && room && room.mode === "online" && room.players[me.pid]?.left)
      leave("Kamu dikeluarkan dari room karena tidak aktif.");
    // penonton yang sudah dibersihkan server karena tidak aktif
    if (
      me &&
      me.pid == null &&
      room &&
      room.mode === "online" &&
      !(room.spectators || []).some((x) => x.id === me.sid)
    )
      leave("Kamu dikeluarkan dari room karena tidak aktif.");
  }, [room]);

  // Rayakan tiap pemain yang finis (setelah bidaknya selesai bergerak)
  useEffect(() => {
    if (!room) {
      partySeen.current = null;
      return;
    }
    const n = room.last?.n ?? 0;
    if (partySeen.current === null) {
      partySeen.current = n;
      return;
    } // kejadian lama tidak dirayakan ulang
    if (n <= partySeen.current) return;
    partySeen.current = n;
    const l = room.last;
    if (l?.type === "start" || (l?.type === "again" && room.mode === "local")) {
      setReveal(true);
      return;
    } // hewan baru dibagikan
    if (l?.type !== "roll" || !l.finished) return;
    const title = room.players[l.who].name;
    const sub =
      l.finished === 1
        ? "finis pertama, juara 1!"
        : `finis di peringkat ${l.finished}!`;
    setTimeout(() => {
      setParty({ title, sub, pieces: makePieces() });
      setTimeout(() => setParty(null), 5200);
    }, 1500);
  }, [room]);

  const needName = () => {
    if (!name.trim()) {
      setErr("Isi nama dulu.");
      return true;
    }
    localStorage.setItem("kuis-name", name.trim());
    localStorage.setItem("kuis-level", level);
    localStorage.setItem("kuis-map", mapId);
    return false;
  };
  const createOnline = () => {
    if (!needName())
      run(async () =>
        enter(
          await api({
            action: "create",
            mode: "online",
            name,
            level,
            recharge,
            map: mapId,
          }),
        ),
      );
  };
  const joinRoom = () => {
    if (needName()) return;
    if (!joinId.trim()) {
      setErr("Isi ID room.");
      return;
    }
    run(async () => enter(await api({ action: "join", id: joinId, name })));
  };
  const createLocal = () => {
    localStorage.setItem("kuis-level", level);
    localStorage.setItem("kuis-map", mapId);
    run(async () => {
      enter(
        await api({
          action: "create",
          mode: "local",
          names: locals,
          level,
          recharge,
          map: mapId,
        }),
      );
      setReveal(true);
    });
  };
  const changeRecharge = (v) => {
    setRecharge(v);
    localStorage.setItem("kuis-recharge", String(v));
  };
  const setCount = (n) =>
    setLocals((a) =>
      Array.from({ length: n }, (_, i) => a[i] ?? `Pemain ${i + 1}`),
    );
  const act = (type, extra = {}, anim = false) =>
    run(async () => {
      if (type === "roll" || anim) {
        setRolling(true);
        const [d] = await Promise.all([
          api({ action: type, id: me.id, tok: me.tok, ...extra }),
          wait(800),
        ]);
        apply(d.room);
      } else {
        const d = await api({ action: type, id: me.id, tok: me.tok, ...extra });
        if (type === "sit" && d.pid != null) {
          const m = { ...me, pid: d.pid, sid: null };
          setMe(m);
          localStorage.setItem("ut-last", JSON.stringify(m));
        }
        apply(d.room);
      }
    }).finally(() => setRolling(false));
  const useSkill = (extra) =>
    act("skill", extra, ROLL_SKILLS.includes(room.players[room.turn]?.animal));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/?room=${room.id}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  /* ---------- Menu ---------- */
  if (!room) {
    return (
      <main>
        <header className="hero">
          <div className="hero-body">
            <span className="hero-badge">✨ Kuis × Ular Tangga</span>
            <h1>
              Ular Tangga <em>Kuis</em>
            </h1>
            <p className="hero-lead">
              Jawab soal dulu, baru boleh mengocok dadu. Siapa yang paling dulu
              sampai kotak 100?
            </p>
            <ol className="hero-steps">
              <li>
                <span>🧠</span>Jawab soal
              </li>
              <li>
                <span>🎲</span>Kocok dadu
              </li>
              <li>
                <span>🏁</span>Capai kotak 100
              </li>
            </ol>
            <details className="rules">
              <summary>Lihat aturan lengkap</summary>
              <ul>
                <li>
                  Jawab soal dengan benar untuk boleh mengocok dadu. Jawaban
                  salah membuat giliranmu dilewati.
                </li>
                <li>
                  Pemain yang sampai kotak 100 mendapat peringkat. Kalau
                  pemainnya banyak, permainan berlanjut sampai tinggal 2 pemain
                  yang belum finis.
                </li>
                <li>
                  Dapat angka 6 berarti kocok dadu lagi, tapi kalau dapat 6 tiga
                  kali berturut-turut, bidakmu kembali ke kotak 1.
                </li>
              </ul>
            </details>
          </div>
          <svg
            className="hero-art"
            viewBox="0 0 240 200"
            fill="none"
            aria-hidden="true"
          >
            <g strokeLinecap="round">
              <path
                d="M150 190L184 22M190 190L224 22"
                stroke="#fff"
                strokeOpacity=".6"
                strokeWidth="7"
              />
              <path
                d="M156 160h36M163 126h36M170 92h36M177 58h36"
                stroke="#fff"
                strokeOpacity=".45"
                strokeWidth="5"
              />
            </g>
            <path
              d="M20 186c60-10 96-34 52-66S30 70 84 54s58-30 24-44"
              stroke="#0b3b2e"
              strokeOpacity=".35"
              strokeWidth="18"
              strokeLinecap="round"
              transform="translate(3 5)"
            />
            <path
              d="M20 186c60-10 96-34 52-66S30 70 84 54s58-30 24-44"
              stroke="#34d399"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M20 186c60-10 96-34 52-66S30 70 84 54s58-30 24-44"
              stroke="#047857"
              strokeOpacity=".45"
              strokeWidth="14"
              strokeDasharray="3 11"
            />
            <circle cx="108" cy="12" r="11" fill="#34d399" />
            <circle cx="104" cy="9" r="3.4" fill="#fff" />
            <circle cx="104" cy="9" r="1.5" fill="#1b1f4b" />
            <rect
              x="112"
              y="96"
              width="48"
              height="48"
              rx="12"
              fill="#fff"
              transform="rotate(-12 136 120)"
            />
            <g fill="#4f46e5" transform="rotate(-12 136 120)">
              <circle cx="124" cy="108" r="4.2" />
              <circle cx="148" cy="108" r="4.2" />
              <circle cx="136" cy="120" r="4.2" />
              <circle cx="124" cy="132" r="4.2" />
              <circle cx="148" cy="132" r="4.2" />
            </g>
          </svg>
        </header>

        {resume && (
          <div className="card resume">
            <button className="btn sun" onClick={() => enter(resume)}>
              ▶ Lanjutkan room {resume.id}
            </button>
          </div>
        )}

        <div className="ut-menu">
          <div className="card">
            <h2>
              <span className="ico">⚙️</span>Pengaturan
            </h2>
            <label htmlFor="n">Nama kamu (untuk main online)</label>
            <input
              id="n"
              maxLength={16}
              value={name}
              placeholder="Contoh: Dewi"
              onChange={(e) => setName(e.target.value)}
            />
            <label className="mt">Tingkat soal</label>
            <div className="lv" role="radiogroup" aria-label="Tingkat soal">
              {LEVELS.map(([k, t, d]) => (
                <button
                  key={k}
                  data-l={k}
                  role="radio"
                  aria-checked={level === k}
                  className={level === k ? "on" : ""}
                  onClick={() => setLevel(k)}
                >
                  <span className="ico">{LVL_ICO[k]}</span>
                  <b>{t}</b>
                  <small>{d}</small>
                </button>
              ))}
            </div>
            <label className="mt">Pemulihan skill</label>
            <SkillRule value={recharge} onChange={changeRecharge} />
            <label className="mt">Map</label>
            <MapPick value={mapId} onChange={setMapId} />
          </div>

          <div className="card">
            <h2>
              <span className="ico cyan">🌐</span>Main online
            </h2>
            <p className="mute">Buat room lalu bagikan ID-nya ke teman.</p>
            <button className="btn" onClick={createOnline} disabled={busy}>
              Buat room baru
            </button>
            <p className="ut-or">atau gabung ke room teman</p>
            <label htmlFor="rid">ID room</label>
            <input
              id="rid"
              maxLength={5}
              value={joinId}
              placeholder="Contoh: K7M2P"
              onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            />
            <button className="btn alt" onClick={joinRoom} disabled={busy}>
              Gabung room
            </button>
            <p className="hint">
              Kalau permainan sudah dimulai atau room penuh, kamu bergabung
              sebagai penonton.
            </p>
          </div>
        </div>

        <div className="card">
          <h2>
            <span className="ico pink">🎮</span>Main 1 perangkat (gantian)
          </h2>
          <p className="mute">Semua pemain bergantian memakai perangkat ini.</p>
          <div className="ut-local">
            <div>
              <label htmlFor="cnt">Jumlah pemain</label>
              <select
                id="cnt"
                value={locals.length}
                onChange={(e) => setCount(+e.target.value)}
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} pemain
                  </option>
                ))}
              </select>
            </div>
            <div className="ut-names">
              {locals.map((v, i) => (
                <input
                  key={i}
                  maxLength={16}
                  value={v}
                  aria-label={`Nama pemain ${i + 1}`}
                  onChange={(e) =>
                    setLocals((a) =>
                      a.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                />
              ))}
            </div>
          </div>
          <button className="btn" onClick={createLocal} disabled={busy}>
            Mulai permainan
          </button>
        </div>
        {err && <p className="err">{err}</p>}
      </main>
    );
  }

  /* ---------- Room ---------- */
  const activeCount = room.players.filter((p) => !p.left).length;
  const cur = room.players[room.turn];
  const mine = room.mode === "local" || room.turn === me.pid;
  const spec = me.pid == null; // penonton
  const winner = room.winner != null ? room.players[room.winner] : null;
  const last = room.last;
  const tone = !last
    ? ""
    : last.type === "wrong" ||
        last.kind === "snake" ||
        last.kind === "reset" ||
        last.kind === "mud" ||
        last.kind === "lava" ||
        last.kind === "portal_down"
      ? " bad"
      : last.type === "correct" ||
          last.type === "skill" ||
          last.kind === "ladder" ||
          last.kind === "shield" ||
          last.kind === "ice" ||
          last.kind === "portal_up" ||
          last.bonus
        ? " good"
        : "";

  return (
    <main>
      <div className="ut-top">
        <div className="ut-brand">
          <span className="ut-logo" aria-hidden="true">
            🐍
          </span>
          <div>
            <b>Ular Tangga Kuis</b>
            <div className="ut-meta">
              <span className="ut-tag">Room {room.id}</span>
              <span className="ut-tag">{LNAME[room.level]}</span>
              <span className="ut-tag">{getMap(room.map).name}</span>
              {room.mode === "local" && (
                <span className="ut-tag">1 perangkat</span>
              )}
            </div>
          </div>
        </div>
        <button className="btn alt ut-exit" onClick={() => leave()}>
          Keluar
        </button>
      </div>

      {room.status === "lobby" && (
        <div className="card">
          <h2>
            <span className="ico">🚪</span>Ruang tunggu
          </h2>
          <div className="ut-room">{room.id}</div>
          <p className="mute">
            Bagikan ID ini atau tautan undangan ke temanmu (maksimal 6 pemain).
          </p>
          <button className="btn alt" onClick={copy}>
            {copied ? "Tautan tersalin!" : "Salin tautan undangan"}
          </button>
          <PlayerList room={room} />
          <Spectators room={room} />
          {spec ? (
            <>
              <p className="hint">
                Kamu sedang menonton. Kalau masih ada tempat, kamu bisa ikut
                bermain.
              </p>
              <button
                className="btn"
                onClick={() => act("sit")}
                disabled={busy || activeCount >= 6}
              >
                {activeCount >= 6
                  ? "Room penuh (maksimal 6 pemain)"
                  : "Gabung sebagai pemain"}
              </button>
            </>
          ) : (
            <>
              <h2 style={{ marginTop: 18 }}>Map</h2>
              {me.pid === room.host ? (
                <MapPick
                  value={room.map}
                  onChange={(v) => act("map", { map: v })}
                  disabled={busy}
                />
              ) : (
                <p className="mute">
                  <b>{getMap(room.map).name}</b>: {getMap(room.map).desc}
                </p>
              )}
              <h2 style={{ marginTop: 18 }}>Pemulihan skill</h2>
              {me.pid === room.host ? (
                <SkillRule
                  value={room.recharge}
                  onChange={(v) => act("rule", { recharge: v })}
                  disabled={busy}
                />
              ) : (
                <p className="mute">{ruleText(room.recharge)}</p>
              )}
              <h2 style={{ marginTop: 18 }}>Hewan dibagikan acak</h2>
              <p className="mute">
                Saat permainan dimulai, tiap pemain mendapat hewan berbeda
                secara acak, lengkap dengan skill-nya. Semua skill terbuka untuk
                semua pemain.
              </p>
              <AnimalGuide />
              {me.pid === room.host ? (
                <button
                  className="btn"
                  onClick={() => act("start")}
                  disabled={busy || activeCount < 2}
                >
                  {activeCount < 2
                    ? "Menunggu pemain lain..."
                    : `Mulai permainan (${activeCount} pemain)`}
                </button>
              ) : (
                <p className="hint">Menunggu host memulai permainan...</p>
              )}
            </>
          )}
          {err && <p className="err">{err}</p>}
        </div>
      )}

      {room.status !== "lobby" && (
        <div className="ut-game">
          <div>
            <Board
              key={room.round ?? 0}
              players={room.players.filter((p) => !p.left)}
              move={room.move}
              turn={room.turn}
              playing={room.status === "playing"}
              map={room.map}
            />
            <TileLegend map={room.map} />
          </div>
          <div>
            <div className="card">
              <div className="ut-turn">
                <span
                  className="ut-avatar"
                  style={{ "--c": COLORS[(winner || cur).color] }}
                  aria-hidden="true"
                >
                  {face(winner || cur)}
                </span>
                <div>
                  <small className="ut-turn-k">
                    {room.status === "finished" ? "Hasil akhir" : "Giliran"}
                  </small>
                  <div className="ut-turn-n">
                    {room.status === "finished"
                      ? winner
                        ? `${winner.name} juara 1!`
                        : "Permainan selesai"
                      : `${cur.name}${room.mode === "online" && mine ? " (kamu)" : ""}`}
                  </div>
                </div>
              </div>
              {spec && (
                <p className="ut-spec">
                  👀 Mode penonton: kamu menonton permainan ini.
                </p>
              )}
              {last && (
                <div className={"ut-banner" + tone} role="status">
                  {last.text}
                </div>
              )}
              {room.mode === "online" &&
                room.status === "playing" &&
                room.players[me.pid]?.done && (
                  <p className="hint">
                    Kamu sudah finis di peringkat {room.players[me.pid].rank}.
                    Kamu menonton sampai permainan selesai.
                  </p>
                )}

              {room.status === "playing" &&
                room.phase === "answer" &&
                room.q && (
                  <>
                    <div className="q-label">
                      🧠 Jawab soal · {LNAME[room.level]}
                    </div>
                    <p className="q">{room.q.q}</p>
                    {room.q.options.map((o, k) => (
                      <button
                        key={o}
                        className="opt"
                        data-k={k}
                        disabled={!mine || busy}
                        onClick={() => act("answer", { pick: o })}
                      >
                        <b>{"ABCD"[k]}</b>
                        {o}
                      </button>
                    ))}
                    {!mine && (
                      <p className="hint">Menunggu {cur.name} menjawab...</p>
                    )}
                  </>
                )}

              {room.status === "playing" && room.phase === "roll" && (
                <div className="ut-rollbox">
                  <Dice v={room.dice?.v} rolling={rolling} />
                  <button
                    className="btn"
                    disabled={!mine || busy}
                    onClick={() => act("roll")}
                  >
                    {mine
                      ? "🎲 Kocok dadu"
                      : `Menunggu ${cur.name} mengocok...`}
                  </button>
                </div>
              )}

              {room.status === "playing" && mine && (
                <SkillPanel room={room} busy={busy} onUse={useSkill} />
              )}

              {room.status === "finished" && (
                <>
                  <h2 style={{ marginTop: 14 }}>Peringkat akhir</h2>
                  <ol className="ut-ranking">
                    {room.ranking.map((pid, i) => {
                      const p = room.players[pid];
                      return (
                        <li key={pid}>
                          <span className={"ut-rank r" + Math.min(i + 1, 4)}>
                            {i + 1}
                          </span>
                          <span
                            className="ut-dot"
                            style={{ background: COLORS[p.color] }}
                          />
                          <span className="ut-face" aria-hidden="true">
                            {face(p)}
                          </span>
                          {p.name}
                          {p.left ? " (keluar)" : ""}
                          <small>{p.done ? "Finis" : `Kotak ${p.pos}`}</small>
                        </li>
                      );
                    })}
                  </ol>
                  {me.pid === room.host ? (
                    <button
                      className="btn sun"
                      onClick={() => act("again")}
                      disabled={busy}
                    >
                      Main lagi di room ini
                    </button>
                  ) : (
                    <p className="hint">Menunggu host mengajak main lagi...</p>
                  )}
                  <button className="btn alt" onClick={() => leave()}>
                    Keluar ke menu
                  </button>
                </>
              )}
              {err && <p className="err">{err}</p>}
            </div>

            <div className="card">
              <h2>
                <span className="ico">👥</span>Pemain
              </h2>
              <PlayerList room={room} />
              <Spectators room={room} />
              <p className="hint">{ruleText(room.recharge)}</p>
            </div>
            <div className="card">
              <h2>
                <span className="ico">📜</span>Riwayat
              </h2>
              <ul className="ut-log">
                {room.log.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {reveal && room.status === "playing" && (
        <div
          className="ut-reveal"
          role="dialog"
          aria-modal="true"
          aria-label="Pembagian hewan dan skill"
        >
          <div className="ut-reveal-box">
            <h2>Hewan dan skill kalian</h2>
            <ul>
              {room.players
                .filter((p) => !p.left && p.animal)
                .map((p) => (
                  <li
                    key={p.id}
                    className={
                      room.mode === "online" && me.pid === p.id ? "me" : ""
                    }
                  >
                    <span className="ut-face big" aria-hidden="true">
                      {face(p)}
                    </span>
                    <div>
                      <b>
                        {p.name}
                        {room.mode === "online" && me.pid === p.id
                          ? " (kamu)"
                          : ""}
                      </b>
                      <small>
                        {AMAP[p.animal]?.n} · {SKILLS[p.animal]?.name}
                      </small>
                      <small>{SKILLS[p.animal]?.desc}</small>
                    </div>
                  </li>
                ))}
            </ul>
            <p className="hint">{ruleText(room.recharge)}</p>
            <button className="btn" onClick={() => setReveal(false)}>
              Mulai bermain
            </button>
          </div>
        </div>
      )}

      {party && (
        <div className="party" role="status">
          {party.pieces.map((p, k) => (
            <i
              key={k}
              style={{
                left: p.l + "%",
                width: p.s,
                height: p.s * 1.6,
                background: p.c,
                "--t": p.t + "s",
                "--d": p.d + "s",
                "--r2": p.r + "deg",
              }}
            />
          ))}
          <div className="pop">
            <span className="pop-ico">🏆</span>
            <b>{party.title}</b>
            <span className="mute">{party.sub}</span>
          </div>
        </div>
      )}
    </main>
  );
}
