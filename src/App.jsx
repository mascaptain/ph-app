import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── DESIGN SYSTEM S10 ────────────────────────────────────────────────────────
// Inter only. 800 for impact, 600 for structure, 400 for body.
// Light theme. Lime accent is surgical — one place only.
// Responsive-first: every layout built for 390px iPhone, scales up.
// Removed: SVG illustrations (unclear), mixed fonts.
// Added: Start/End session button, auto rest timers, full responsive.

const T = {
  bg: "#F9F9F7",
  bgDeep: "#F0F0ED",
  card: "#FFFFFF",
  ink: "#0A0A09",
  ink2: "#222220",
  muted: "#6E6E6A",
  muted2: "#AEAEA8",
  border: "#E8E8E4",
  lime: "#CAFF00",
  limeDark: "#A8D400",
  limeBg: "#F4FFB8",
  green: "#15803D",
  greenBg: "#F0FDF4",
  greenBorder: "#86EFAC",
  orange: "#C2410C",
  orangeBg: "#FFF7ED",
  orangeBorder: "#FDBA74",
  red: "#B91C1C",
  redBg: "#FEF2F2",
  blue: "#1D4ED8",
  shadow: "0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)",
  shadowLg: "0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.04)",
  streak: "#D97706",
};

// ─── BASE DATA ────────────────────────────────────────────────────────────────
const BASE_KG = {
  "développé couché barre": 40, "développé militaire barre": 30,
  "développé incliné haltères": 16, "développé couché haltères": 18,
  "chest press": 16, "élévations latérales": 8, "oiseau inversé": 8,
  "arnold press": 12, "tractions": 0, "chin-up": 0, "pull-up": 0,
  "pulldown": 14, "romanian deadlift": 20, "rdl": 20,
  "rowing haltère": 20, "rowing barre": 50, "cable row": 14,
  "squat barre": 40, "soulevé de terre": 60, "hip thrust": 50,
  "fentes": 14, "gobelet squat": 18, "kettlebell swing": 18,
  "clean & press": 14, "turkish get-up": 10, "curl barre": 25,
  "curl haltères": 12, "curl marteau": 12, "curl incliné": 10,
  "dips": 0, "extensions triceps": 14, "skull crusher": 18,
  "face pull": 12, "rameur": 0, "skierg": 0, "corde": 0, "vélo": 0,
};
function baseKg(name) {
  const n = (name || "").toLowerCase();
  for (const [k, v] of Object.entries(BASE_KG)) { if (n.includes(k)) return v; }
  return 15;
}
function calc1RM(kg, reps) {
  if (!kg || kg === 0) return null;
  const r = parseFloat(String(reps).split("–")[0]) || 8;
  return Math.round(kg * (1 + r / 30));
}
function calcWarmup(kg) {
  if (!kg || kg <= 20) return [];
  return [
    { pct: "50%", kg: Math.round(kg * .5 / 2.5) * 2.5, reps: 8 },
    { pct: "70%", kg: Math.round(kg * .7 / 2.5) * 2.5, reps: 5 },
    { pct: "90%", kg: Math.round(kg * .9 / 2.5) * 2.5, reps: 2 },
  ];
}

const COACH_TIPS = {
  "traction": "Descente bras tendus complète — c'est là que le muscle se développe.",
  "développé couché": "Pause 1 sec sur la poitrine. Pas de rebond.",
  "soulevé": "Dos neutre absolu. Barre collée aux tibias tout le long.",
  "squat": "Sous la parallèle. Regard à 45°, pas en bas.",
  "curl": "Coudes fixes. 3 sec à la descente.",
  "rowing": "Rétraction omoplates avant de tirer.",
  "militaire": "Core serré. Barre passe devant le menton.",
  "kettlebell": "Poussée de hanches, pas un squat.",
  "dips": "Descente lente 3 sec. Coudes derrière.",
  "rdl": "Charnière hanche pure. Ressens l'étirement ischios.",
};
function getCoachTip(name) {
  const n = (name || "").toLowerCase();
  for (const [k, v] of Object.entries(COACH_TIPS)) { if (n.includes(k)) return v; }
  return null;
}

const DEFAULT_PROGRAM = [
  { day: "LUN", label: "Push Force", salle: "haut", muscle: "Pecs · Épaules · Triceps", exercises: [{ id: "lun1", name: "Développé couché barre", sets: 5, reps: "4–5", rest: 240, muscle: "Pecs" }, { id: "lun2", name: "Développé militaire barre", sets: 4, reps: "5–6", rest: 180, muscle: "Épaules" }, { id: "lun3", name: "Développé incliné haltères 30°", sets: 3, reps: "10–12", rest: 120, muscle: "Pecs sup" }, { id: "lun4", name: "Élévations latérales haltères", sets: 4, reps: "12–15", rest: 75, muscle: "Épaules lat" }, { id: "lun5", name: "Oiseau inversé haltères", sets: 3, reps: "15", rest: 60, muscle: "Rear delt" }, { id: "lun6", name: "Dips barres parallèles", sets: 4, reps: "8–12", rest: 90, muscle: "Triceps" }], abs: [{ id: "al1", name: "L-Sit dips", vol: "4×max" }, { id: "al2", name: "Crunch obliques", vol: "3×20" }] },
  { day: "MAR", label: "Hybrid Circuit", salle: "bas", muscle: "Full Body · Plurima · SkiErg", exercises: [{ id: "mar1", name: "Chest press Plurima", sets: 4, reps: "12", rest: 0, muscle: "Pecs" }, { id: "mar2", name: "Lat pulldown Plurima", sets: 4, reps: "12", rest: 0, muscle: "Dos" }, { id: "mar3", name: "Rowing haltère unilatéral", sets: 4, reps: "12", rest: 90, muscle: "Dos" }, { id: "mar4", name: "Développé couché haltères", sets: 4, reps: "12", rest: 0, muscle: "Pecs" }, { id: "mar5", name: "Curl haltères alternés", sets: 4, reps: "10", rest: 0, muscle: "Biceps" }, { id: "mar6", name: "SkiErg Sprints 20/10", sets: 8, reps: "20s", rest: 10, muscle: "Cardio" }], abs: [{ id: "am1", name: "Relevé de jambes", vol: "4×15" }, { id: "am2", name: "Planche dynamique", vol: "3×10" }] },
  { day: "MER", label: "Pull & Legs", salle: "haut", muscle: "Dos · Biceps · Jambes", exercises: [{ id: "mer1", name: "Tractions prise large", sets: 5, reps: "5–7", rest: 180, muscle: "Dos large" }, { id: "mer2", name: "Chin-up prise supination", sets: 4, reps: "6–8", rest: 150, muscle: "Dos + biceps" }, { id: "mer3", name: "Romanian Deadlift haltères", sets: 4, reps: "8–10", rest: 150, muscle: "Ischios" }, { id: "mer4", name: "Rowing haltère unilatéral", sets: 3, reps: "10–12", rest: 90, muscle: "Dos épais" }, { id: "mer5", name: "Gobelet squat kettlebell", sets: 4, reps: "12", rest: 0, muscle: "Quads" }, { id: "mer6", name: "Kettlebell Swing à deux mains", sets: 4, reps: "15", rest: 0, muscle: "Fessiers" }, { id: "mer7", name: "Curl barre EZ", sets: 4, reps: "8–10", rest: 90, muscle: "Biceps" }], abs: [{ id: "amer1", name: "Ab rollout barre", vol: "4×10" }, { id: "amer2", name: "Russian twist", vol: "3×20" }] },
  { day: "JEU", label: "Repos", salle: null, muscle: "Récupération active", exercises: [], abs: [] },
  { day: "VEN", label: "Endurance Force", salle: "bas", muscle: "Full Body · Rameur · Haltères", exercises: [{ id: "ven1", name: "Rameur Intervals 500m", sets: 4, reps: "500m", rest: 60, muscle: "Full body" }, { id: "ven2", name: "Développé couché haltères", sets: 4, reps: "12", rest: 0, muscle: "Pecs" }, { id: "ven3", name: "Rowing haltère unilatéral", sets: 4, reps: "12", rest: 0, muscle: "Dos" }, { id: "ven4", name: "Curl incliné haltères", sets: 4, reps: "10", rest: 0, muscle: "Biceps" }, { id: "ven5", name: "Élévations latérales haltères", sets: 4, reps: "15", rest: 90, muscle: "Épaules" }, { id: "ven6", name: "Corde à sauter", sets: 3, reps: "1min", rest: 0, muscle: "Cardio" }], abs: [{ id: "av1", name: "Hollow body hold", vol: "4×30s" }, { id: "av2", name: "Crunch câble", vol: "3×15" }] },
  { day: "SAM", label: "Full Power", salle: "haut", muscle: "Deadlift · Tractions · Kettlebell", exercises: [{ id: "sam1", name: "Soulevé de terre conventionnel", sets: 5, reps: "3–5", rest: 300, muscle: "Full body" }, { id: "sam2", name: "Hip thrust barre", sets: 4, reps: "10–12", rest: 150, muscle: "Fessiers" }, { id: "sam3", name: "Tractions lestées prise large", sets: 5, reps: "4–6", rest: 180, muscle: "Dos large" }, { id: "sam4", name: "Dips barres parallèles", sets: 3, reps: "8–10", rest: 120, muscle: "Triceps" }, { id: "sam5", name: "Kettlebell Swing unilatéral", sets: 4, reps: "8/bras", rest: 0, muscle: "Fessiers" }, { id: "sam6", name: "Turkish Get-Up", sets: 4, reps: "2/côté", rest: 120, muscle: "Stabilité" }], abs: [{ id: "as1", name: "Dragon flag", vol: "4×5–8" }, { id: "as2", name: "Relevé jambes suspendu", vol: "3×12" }] },
  { day: "DIM", label: "Repos", salle: null, muscle: "Reset total", exercises: [], abs: [] },
];

const SESSION_TYPES = [
  { id: "full", label: "Corps entier" }, { id: "upper", label: "Haut du corps" },
  { id: "lower", label: "Bas du corps" }, { id: "arms", label: "Bras" },
  { id: "bw", label: "Poids de corps" }, { id: "kb", label: "Kettlebell" },
  { id: "cardio", label: "Cardio hybride" }, { id: "strength", label: "Force pure" },
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const LS_KEY = "ph_s10";
const lsLoad = () => { try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : {}; } catch { return {}; } };
const lsSave = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} };

// ─── UTILS ────────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const todayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const fmtMSS = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const fmtDur = s => s >= 3600 ? `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;

function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    [0, .18, .36].forEach(d => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(.28, c.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d + .12);
      o.start(c.currentTime + d); o.stop(c.currentTime + d + .12);
    });
  } catch {}
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useCountdown(onDone) {
  const [sec, setSec] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const start = useCallback(s => {
    setSec(s); setTotal(s); setRunning(true); setDone(false);
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      setSec(p => {
        if (p <= 1) { clearInterval(ref.current); setRunning(false); setDone(true); beep(); onDone?.(); return 0; }
        return p - 1;
      });
    }, 1000);
  }, [onDone]);
  const stop = () => { clearInterval(ref.current); setRunning(false); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setDone(false); setSec(0); setTotal(0); };
  useEffect(() => () => clearInterval(ref.current), []);
  return { sec, total, running, done, start, stop, reset };
}

function useStopwatch() {
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const start = useCallback(() => { setSec(0); setRunning(true); ref.current = setInterval(() => setSec(p => p + 1), 1000); }, []);
  const stop = () => { clearInterval(ref.current); setRunning(false); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setSec(0); };
  useEffect(() => () => clearInterval(ref.current), []);
  return { sec, running, start, stop, reset };
}

// ─── RING TIMER (bottom overlay) ─────────────────────────────────────────────
function RingTimer({ sec, total, running, done, label, onStop, onReset }) {
  if (sec === 0 && !running && !done) return null;
  const R = 44, C = 2 * Math.PI * R;
  const pct = total > 0 ? sec / total : 0;
  const color = done ? T.green : T.ink;
  return (
    <div style={{ position: "fixed", bottom: 72, left: 0, right: 0, zIndex: 500, display: "flex", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ background: T.card, borderRadius: 20, padding: "16px 24px", boxShadow: T.shadowLg, display: "flex", alignItems: "center", gap: 20, maxWidth: 380, width: "100%" }}>
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r={R} fill="none" stroke={T.border} strokeWidth="6" />
            <circle cx="36" cy="36" r={R} fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={`${C * pct} ${C}`} strokeLinecap="round"
              style={{ transition: "stroke-dasharray .6s linear, stroke .3s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Inter", fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{fmtMSS(sec)}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 3 }}>
            {done ? "Prêt !" : "Repos"}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: done ? T.green : T.ink, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {done ? "Reprends ta série" : label || ""}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {running && <button onClick={onStop} style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}>Pause</button>}
            <button onClick={onReset} style={{ fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 8, border: "none", background: T.bgDeep, color: T.muted, cursor: "pointer" }}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LINE CHART ───────────────────────────────────────────────────────────────
function LineChart({ data, color = T.ink, height = 60 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 12, color: T.muted }}>Données insuffisantes</span>
    </div>
  );
  const vals = data.map(d => d.value), min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const W = 300, H = height;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * (W - 24) + 12,
    H - 6 - ((d.value - min) / range) * (H - 18)
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;
  const gid = `g${color.replace("#", "")}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".08" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} stroke={T.card} strokeWidth="2" />)}
        <text x={pts[pts.length - 1][0]} y={pts[pts.length - 1][1] - 8} textAnchor="middle" fontSize="9" fill={color} fontFamily="Inter" fontWeight="700">{data[data.length - 1].value}</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: 9, color: T.muted, fontWeight: 500 }}>{d.date}</span>)}
      </div>
    </div>
  );
}

// ─── RADAR CHART ──────────────────────────────────────────────────────────────
function RadarChart({ data }) {
  const labels = ["Pecs", "Dos", "Épaules", "Bras", "Jambes", "Core"];
  const n = labels.length, cx = 100, cy = 100, r = 72;
  const pts = labels.map((l, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2, val = (data[l] || 0) / 100;
    return { x: cx + r * val * Math.cos(a), y: cy + r * val * Math.sin(a), lx: cx + (r + 18) * Math.cos(a), ly: cy + (r + 18) * Math.sin(a) };
  });
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
  const grid = [.25, .5, .75, 1].map(s => labels.map((_, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`;
  }).join(" "));
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 200 }}>
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke={T.border} strokeWidth="1" />)}
      {labels.map((_, i) => {
        const a = (i / n) * 2 * Math.PI - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={T.border} strokeWidth="1" />;
      })}
      <polygon points={poly} fill={`${T.lime}60`} stroke={T.limeDark} strokeWidth="2" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill={T.ink} />
          <text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={T.muted} fontFamily="Inter" fontWeight="600">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── MONTH CALENDAR ───────────────────────────────────────────────────────────
function MonthCalendar({ sessionDates, onSelectDate }) {
  const [view, setView] = useState(new Date());
  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
  const off = first === 0 ? 6 : first - 1;
  const cells = Array.from({ length: off + dim }, (_, i) => {
    if (i < off) return null;
    const d = i - off + 1;
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { d, key, done: sessionDates.includes(key), isToday: key === todayKey() };
  });
  const MN = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const DN = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <div style={{ background: T.card, borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: T.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={() => setView(new Date(y, m - 1, 1))} style={{ background: T.bgDeep, border: "none", cursor: "pointer", color: T.muted, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <span style={{ fontFamily: "Inter", fontSize: 14, fontWeight: 700, color: T.ink }}>{MN[m]} {y}</span>
        <button onClick={() => setView(new Date(y, m + 1, 1))} style={{ background: T.bgDeep, border: "none", cursor: "pointer", color: T.muted, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DN.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.muted2, paddingBottom: 6 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          return (
            <div key={i} onClick={() => c.done && onSelectDate?.(c.key)}
              style={{ aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: c.done ? T.ink : c.isToday ? T.limeBg : "transparent", border: c.isToday ? `2px solid ${T.lime}` : "1px solid transparent", cursor: c.done ? "pointer" : "default" }}>
              <span style={{ fontSize: 12, fontWeight: c.done || c.isToday ? 700 : 400, color: c.done ? "#fff" : c.isToday ? T.ink : T.muted }}>{c.d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── EXERCISE CARD ────────────────────────────────────────────────────────────
function ExCard({ ex, weight, onWeightChange, log, onLogSet, onStartRest, sessionHistory }) {
  const [open, setOpen] = useState(false);
  const sets = typeof ex.sets === "number" ? ex.sets : 0;
  const doneArr = Array.from({ length: sets }, (_, i) => !!(log[`${ex.id}_s${i}`]?.done));
  const completedSets = doneArr.filter(Boolean).length;
  const allDone = sets > 0 && completedSets === sets;
  const kg = weight ?? baseKg(ex.name);
  const orm = calc1RM(kg, ex.reps);
  const warmup = calcWarmup(kg);
  const tip = getCoachTip(ex.name);
  const lastKg = useMemo(() => {
    const prev = sessionHistory.filter(s => (s.exercises || []).some(e => e.id === ex.id));
    if (!prev.length) return null;
    return prev[prev.length - 1].exercises?.find(e => e.id === ex.id)?.weight || null;
  }, [sessionHistory, ex.id]);

  const handleLogSet = (i) => {
    const wasAllDone = doneArr.filter(Boolean).length === sets - 1 && !doneArr[i];
    onLogSet(`${ex.id}_s${i}`, { done: !doneArr[i], weight: kg, date: todayKey() });
    // Auto-start rest timer after last set
    if (!doneArr[i] && ex.rest > 0) {
      onStartRest(ex.rest, ex.name);
    }
  };

  return (
    <div style={{
      background: T.card, borderRadius: 16, marginBottom: 10,
      boxShadow: T.shadow,
      border: `1px solid ${allDone ? T.greenBorder : "transparent"}`,
      borderLeft: `3px solid ${allDone ? T.green : "transparent"}`,
      transition: "all .2s", overflow: "hidden"
    }}>
      {/* Main row */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          {/* Set number indicator */}
          <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: allDone ? T.green : T.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: allDone ? "#fff" : T.muted }}>
              {completedSets}/{sets}
            </span>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: allDone ? T.green : T.ink, textDecoration: allDone ? "line-through" : "none", lineHeight: 1.3 }}>{ex.name}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: T.muted }}>{ex.muscle}</span>
              {orm && <span style={{ fontSize: 11, fontWeight: 600, color: T.blue }}>1RM ~{orm}kg</span>}
              {ex.rest > 0 && <span style={{ fontSize: 11, color: T.muted }}>· {ex.rest >= 60 ? `${ex.rest / 60}min` : `${ex.rest}s`} repos</span>}
            </div>
          </div>

          {/* Expand toggle */}
          <button onClick={() => setOpen(o => !o)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: open ? T.bgDeep : "transparent", cursor: "pointer", color: T.muted, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {open ? "▲" : "▼"}
          </button>
        </div>

        {/* Set buttons — always visible */}
        {sets > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {Array.from({ length: sets }, (_, i) => (
              <button key={i} onClick={() => handleLogSet(i)} style={{
                width: 44, height: 44, borderRadius: 12, cursor: "pointer",
                transition: "all .15s",
                border: `2px solid ${doneArr[i] ? T.green : T.border}`,
                background: doneArr[i] ? T.green : T.card,
                color: doneArr[i] ? "#fff" : T.muted,
                fontFamily: "Inter", fontSize: 14, fontWeight: 800,
              }}>
                {i + 1}
              </button>
            ))}
            {/* Quick rest button */}
            {ex.rest > 0 && (
              <button onClick={() => onStartRest(ex.rest, ex.name)} style={{
                height: 44, padding: "0 14px", borderRadius: 12, cursor: "pointer",
                border: `1.5px solid ${T.border}`, background: "transparent",
                color: T.muted, fontFamily: "Inter", fontSize: 12, fontWeight: 600,
              }}>
                ⏱ {ex.rest >= 60 ? `${ex.rest / 60}min` : `${ex.rest}s`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 16px", background: T.bg }}>
          {/* Weight control */}
          <div style={{ background: T.card, borderRadius: 12, padding: "12px 16px", marginBottom: 12, boxShadow: T.shadow }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
              Charge{lastKg ? ` · Dernière fois : ${lastKg}kg` : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => onWeightChange(ex.id, Math.max(0, kg - 2.5))} style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>−</button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontFamily: "Inter", fontSize: 28, fontWeight: 800, color: T.ink }}>{kg === 0 ? "BW" : `${kg}kg`}</span>
              </div>
              <button onClick={() => onWeightChange(ex.id, kg + 2.5)} style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>+</button>
            </div>
          </div>

          {/* Warmup */}
          {warmup.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Échauffement suggéré</div>
              <div style={{ display: "flex", gap: 6 }}>
                {warmup.map((w, i) => (
                  <div key={i} style={{ flex: 1, background: T.card, borderRadius: 10, padding: "10px 8px", textAlign: "center", boxShadow: T.shadow }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{w.kg === 0 ? "BW" : `${w.kg}kg`}</div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{w.reps} reps</div>
                    <div style={{ fontSize: 9, color: T.muted2 }}>{w.pct}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coach tip */}
          {tip && (
            <div style={{ background: T.limeBg, borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${T.lime}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.ink, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Conseil</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: T.ink2, lineHeight: 1.6 }}>{tip}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FEEDBACK MODAL ───────────────────────────────────────────────────────────
function FeedbackModal({ onClose, onSave }) {
  const [global, setGlobal] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");
  const INTENSITY = ["", "Très léger", "Léger", "Modéré", "Intense", "Maximum"];
  const ENERGY_L = ["", "Épuisé", "Fatigué", "Normal", "Énergisé", "Au top"];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(249,249,247,.97)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: "Inter" }}>
      <div style={{ background: T.card, borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", maxWidth: 600, width: "100%", boxShadow: T.shadowLg }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 100, margin: "0 auto 24px" }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Bilan de séance</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>Comment s'est passée ta séance ?</div>
        {[
          { label: "Intensité globale", val: global, set: setGlobal, labels: INTENSITY },
          { label: "Niveau d'énergie", val: energy, set: setEnergy, labels: ENERGY_L },
        ].map(({ label, val, set, labels }) => (
          <div key={label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, background: T.limeBg, padding: "2px 10px", borderRadius: 6 }}>{labels[val]}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} onClick={() => set(v)} style={{ flex: 1, height: 44, borderRadius: 12, border: `2px solid ${val === v ? T.ink : T.border}`, background: val === v ? T.ink : T.card, color: val === v ? "#fff" : T.muted, fontFamily: "Inter", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{v}</button>
              ))}
            </div>
          </div>
        ))}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes libres..." style={{ width: "100%", minHeight: 60, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`, fontFamily: "Inter", fontSize: 13, color: T.ink, resize: "none", outline: "none", background: T.bg, marginBottom: 16, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "14px", borderRadius: 14, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontFamily: "Inter", fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={onClose}>Annuler</button>
          <button style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={() => onSave({ global, energy, notes })}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ─── REGEN MODAL (AI) ─────────────────────────────────────────────────────────
function RegenModal({ dayInfo, excluded, history, weights, onClose, onResult }) {
  const [type, setType] = useState(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (!type && !custom) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Génère une séance fitness en JSON. Type: ${type || custom}. Exclure: ${excluded.join(", ") || "rien"}. Réponds UNIQUEMENT en JSON: {"titre": string, "exercises": [{"id": string, "name": string, "sets": number, "reps": string, "rest": number, "muscle": string}], "abs": [{"id": string, "name": string, "vol": string}]}`
          }]
        })
      });
      const data = await res.json();
      const raw = (data.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
      onResult(JSON.parse(raw)); onClose();
    } catch { alert("Erreur. Réessaie."); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(249,249,247,.97)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0, fontFamily: "Inter" }}>
      <div style={{ background: T.card, borderRadius: "24px 24px 0 0", padding: "28px 24px 40px", maxWidth: 600, width: "100%", boxShadow: T.shadowLg }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 100, margin: "0 auto 24px" }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Nouvelle séance</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Quel type de séance veux-tu ?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {SESSION_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id === type ? null : t.id)} style={{ padding: "12px 8px", borderRadius: 12, cursor: "pointer", border: `2px solid ${type === t.id ? T.ink : T.border}`, background: type === t.id ? T.ink : T.card, color: type === t.id ? "#fff" : T.ink2, fontFamily: "Inter", fontSize: 13, fontWeight: type === t.id ? 700 : 500, transition: "all .15s" }}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder="Ou décris librement..." style={{ width: "100%", minHeight: 52, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`, fontFamily: "Inter", fontSize: 13, color: T.ink, resize: "none", outline: "none", background: T.bg, marginBottom: 16, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "14px", borderRadius: 14, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontFamily: "Inter", fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={onClose}>Annuler</button>
          <button style={{ flex: 2, padding: "14px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (loading || (!type && !custom)) ? .5 : 1 }} onClick={generate} disabled={loading || (!type && !custom)}>{loading ? "Génération…" : "Générer"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION REPORT ───────────────────────────────────────────────────────────
function SessionReport({ session, onClose }) {
  if (!session) return null;
  const { totalKg = 0, totalSets = 0, duration = 0, exercises = [], date = "", dayLabel = "", day = "", score = 0 } = session;
  const muscleVol = {};
  exercises.forEach(ex => {
    const m = ex.muscle || "Autre";
    muscleVol[m] = (muscleVol[m] || 0) + (ex.weight || 0) * (ex.completedSets || 0) * (parseFloat(String(ex.reps || "8").split("–")[0]) || 8);
  });
  const MAP = { "Pecs": "Pecs", "Dos": "Dos", "Dos large": "Dos", "Dos épais": "Dos", "Dos + biceps": "Dos", "Épaules": "Épaules", "Épaules lat": "Épaules", "Rear delt": "Épaules", "Biceps": "Bras", "Brachialis": "Bras", "Triceps": "Bras", "Quads": "Jambes", "Ischios": "Jambes", "Fessiers": "Jambes", "Full body": "Pecs", "Core": "Core", "Stabilité": "Core", "Cardio": "Core" };
  const radarData = {};
  Object.entries(muscleVol).forEach(([m, v]) => { const k = MAP[m] || "Core"; radarData[k] = (radarData[k] || 0) + v; });
  const rMax = Math.max(...Object.values(radarData), 1);
  Object.keys(radarData).forEach(k => radarData[k] = Math.round(radarData[k] / rMax * 100));
  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 700, overflowY: "auto", fontFamily: "Inter" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 60 }}>
        <div style={{ background: T.ink, padding: "48px 24px 32px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: 100, background: "rgba(255,255,255,.1)", border: "none", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 10 }}>{date}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1.05, marginBottom: 6 }}>{dayLabel || day}</div>
          {score > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(202,255,0,.12)", border: "1px solid rgba(202,255,0,.25)", borderRadius: 100, padding: "5px 14px", marginTop: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.lime }}>{score}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(202,255,0,.6)", letterSpacing: ".12em" }}>SCORE</span>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { l: "Volume", v: totalKg > 0 ? `${(totalKg / 1000).toFixed(2).replace(".", ",")}` : "—", u: "tonnes" },
            { l: "Durée", v: duration > 0 ? fmtDur(duration) : "—", u: "" },
            { l: "Séries", v: `${totalSets}`, u: "complètes" },
          ].map(m => (
            <div key={m.l} style={{ background: T.card, padding: "20px 14px", margin: "1px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{m.l}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{m.v}</div>
              {m.u && <div style={{ fontSize: 10, fontWeight: 500, color: T.muted, marginTop: 3 }}>{m.u}</div>}
            </div>
          ))}
        </div>
        <div style={{ background: T.card, borderTop: "1px solid #F0F0ED", padding: "20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Volume musculaire</div>
          <div style={{ display: "flex", justifyContent: "center" }}><RadarChart data={radarData} /></div>
        </div>
        <div style={{ padding: "20px" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────
function ProgressTab({ sessionHistory, weights }) {
  const [selectedEx, setSelectedEx] = useState(null);
  const allExNames = useMemo(() => [...new Set(DEFAULT_PROGRAM.flatMap(d => d.exercises || []).map(e => e.name))], []);
  const progressData = useMemo(() => {
    if (!selectedEx) return [];
    return sessionHistory.filter(s => s.weights?.[selectedEx]).map(s => ({ date: s.date.slice(5), value: s.weights[selectedEx] })).slice(-8);
  }, [selectedEx, sessionHistory]);
  const volumeByWeek = useMemo(() => {
    const weeks = {};
    sessionHistory.forEach(s => { const w = s.date.slice(0, 7); weeks[w] = (weeks[w] || 0) + (s.totalKg || 0); });
    return Object.entries(weeks).slice(-8).map(([w, v]) => ({ date: w.slice(5), value: Math.round(v / 1000) }));
  }, [sessionHistory]);
  const globalRadar = useMemo(() => {
    const data = {};
    const MAP = { "Pecs": "Pecs", "Dos": "Dos", "Dos large": "Dos", "Épaules": "Épaules", "Épaules lat": "Épaules", "Rear delt": "Épaules", "Biceps": "Bras", "Triceps": "Bras", "Quads": "Jambes", "Ischios": "Jambes", "Fessiers": "Jambes", "Core": "Core", "Stabilité": "Core", "Cardio": "Core" };
    sessionHistory.forEach(s => { (s.exercises || []).forEach(ex => { const k = MAP[ex.muscle] || "Core"; data[k] = (data[k] || 0) + (ex.weight || 0) * (ex.completedSets || 0); }); });
    const max = Math.max(...Object.values(data), 1);
    Object.keys(data).forEach(k => data[k] = Math.round(data[k] / max * 100));
    return data;
  }, [sessionHistory]);

  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 680, margin: "0 auto" }}>
      {[
        { title: "Équilibre musculaire", sub: "Volume cumulé sur toutes tes séances", content: <div style={{ display: "flex", justifyContent: "center" }}><RadarChart data={globalRadar} /></div> },
        { title: "Volume hebdomadaire", sub: "Tonnes soulevées par semaine", content: <LineChart data={volumeByWeek} color={T.ink} height={60} /> },
      ].map(({ title, sub, content }) => (
        <div key={title} style={{ background: T.card, borderRadius: 16, padding: "20px", marginBottom: 12, boxShadow: T.shadow }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>{sub}</div>
          {content}
        </div>
      ))}
      <div style={{ background: T.card, borderRadius: 16, padding: "20px", marginBottom: 12, boxShadow: T.shadow }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Progression des charges</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Évolution sur un exercice</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {allExNames.slice(0, 8).map(n => (
            <button key={n} onClick={() => setSelectedEx(n === selectedEx ? null : n)} style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 100, border: `1.5px solid ${selectedEx === n ? T.ink : T.border}`, background: selectedEx === n ? T.ink : T.card, color: selectedEx === n ? "#fff" : T.muted, cursor: "pointer" }}>
              {n.split(" ").slice(0, 2).join(" ")}
            </button>
          ))}
        </div>
        {selectedEx ? <LineChart data={progressData} color={T.green} height={60} /> : <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: T.muted }}>Sélectionne un exercice</div>}
      </div>
      <div style={{ background: T.card, borderRadius: 16, overflow: "hidden", boxShadow: T.shadow }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Personal Bests</div>
        </div>
        {Object.keys(weights).length === 0
          ? <div style={{ padding: "28px", textAlign: "center", fontSize: 13, color: T.muted }}>Enregistre tes charges pendant les séances.</div>
          : Object.entries(weights).map(([id, kg], i) => {
            const ex = DEFAULT_PROGRAM.flatMap(d => d.exercises || []).find(e => e.id === id);
            if (!ex) return null;
            const orm = calc1RM(kg, ex.reps);
            return (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < Object.keys(weights).length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{ex.name}</div>
                  {orm && <div style={{ fontSize: 11, fontWeight: 600, color: T.blue }}>1RM estimé : {orm}kg</div>}
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{kg === 0 ? "BW" : `${kg}kg`}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ excluded, onToggleExclude, onExport, onImport, onReset }) {
  const fileRef = useRef(null);
  const allEx = DEFAULT_PROGRAM.flatMap(d => d.exercises || []);
  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 680, margin: "0 auto" }}>
      <div style={{ background: T.card, borderRadius: 16, padding: "20px", marginBottom: 12, boxShadow: T.shadow }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Sauvegarde</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.7 }}>Les données sont sauvegardées localement sur cet appareil.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 10, border: "none", background: T.ink, color: "#fff", cursor: "pointer" }} onClick={onExport}>↓ Exporter JSON</button>
          <button style={{ fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => fileRef.current?.click()}>↑ Importer JSON</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => { try { onImport(JSON.parse(ev.target.result)); } catch { alert("Fichier invalide."); } }; r.readAsText(f); } }} />
        </div>
      </div>
      <div style={{ background: T.card, borderRadius: 16, overflow: "hidden", marginBottom: 12, boxShadow: T.shadow }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 2 }}>Exercices exclus</div>
          <div style={{ fontSize: 12, color: T.muted }}>Masqués dans les séances et la génération IA.</div>
        </div>
        {allEx.map((ex, i) => (
          <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < allEx.length - 1 ? `1px solid ${T.border}` : "none", opacity: excluded.includes(ex.id) ? .4 : 1 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{ex.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{ex.muscle}</div>
            </div>
            <button onClick={() => onToggleExclude(ex.id)} style={{ padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${excluded.includes(ex.id) ? T.greenBorder : T.border}`, background: excluded.includes(ex.id) ? T.greenBg : "transparent", color: excluded.includes(ex.id) ? T.green : T.muted }}>
              {excluded.includes(ex.id) ? "Réactiver" : "Exclure"}
            </button>
          </div>
        ))}
      </div>
      <div style={{ background: T.card, borderRadius: 16, padding: "20px", boxShadow: T.shadow }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Données</div>
        <button onClick={onReset} style={{ fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${T.red}`, background: "transparent", color: T.red, cursor: "pointer" }}>Effacer toutes les données</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
export default function PHApp() {
  const [tab, setTab] = useState("seance");
  const [dayIdx, setDayIdx] = useState(todayIdx());
  const [schedule, setSchedule] = useState(DEFAULT_PROGRAM);
  const [log, setLog] = useState({});
  const [weights, setWeights] = useState({});
  const [sessionHistory, setSessionHistory] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [aiOverride, setAiOverride] = useState(null);
  const [streak, setStreak] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const [restLabel, setRestLabel] = useState("");
  const sessionClock = useStopwatch();
  const restTimer = useCountdown();

  useEffect(() => {
    const data = lsLoad();
    if (data.schedule) setSchedule(data.schedule);
    if (data.log) setLog(data.log);
    if (data.weights) setWeights(data.weights);
    if (data.sessionHistory) setSessionHistory(data.sessionHistory);
    if (data.excluded) setExcluded(data.excluded);
    const dates = (data.sessionHistory || []).map(s => s.date);
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (dates.includes(d.toISOString().slice(0, 10))) s++; else break;
    }
    setStreak(s);
  }, []);

  const persist = useCallback((updates) => { lsSave({ schedule, log, weights, sessionHistory, excluded, ...updates }); }, [schedule, log, weights, sessionHistory, excluded]);

  const saveLog = useCallback((key, val) => {
    setLog(prev => { const next = { ...prev, [key]: val }; persist({ log: next }); return next; });
    if (val.weight) {
      setWeights(prev => {
        const exId = key.split("_s")[0];
        if (!prev[exId] || val.weight > prev[exId]) { const next = { ...prev, [exId]: val.weight }; persist({ weights: next }); return next; }
        return prev;
      });
    }
  }, [persist]);

  const saveWeight = useCallback((id, val) => { setWeights(prev => { const next = { ...prev, [id]: val }; persist({ weights: next }); return next; }); }, [persist]);
  const toggleExclude = useCallback((id) => { setExcluded(prev => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; persist({ excluded: next }); return next; }); }, [persist]);

  const handleStartSession = () => {
    setSessionActive(true);
    sessionClock.start();
  };

  const handleEndSession = () => {
    sessionClock.stop();
    setShowFeedback(true);
  };

  const calcScore = (kg, sets, g, e) => Math.round(Math.min(kg / 5000 * 40, 40) + Math.min(sets / 25 * 30, 30) + ((g || 3) + (e || 3)) / 10 * 30);

  const handleFeedbackSave = (fb) => {
    const day = schedule[dayIdx];
    const exos = aiOverride?.exercises || day.exercises || [];
    let totalKg = 0, totalSets = 0;
    const exercisesData = exos.map(ex => {
      const s = typeof ex.sets === "number" ? ex.sets : 0;
      let completedSets = 0, lastWeight = 0;
      Array.from({ length: s }, (_, i) => {
        const e = log[`${ex.id}_s${i}`];
        if (e?.done) { completedSets++; lastWeight = e.weight || 0; const r = parseFloat(String(ex.reps).split("–")[0]) || 8; totalKg += lastWeight * r; totalSets++; }
      });
      return { id: ex.id, name: ex.name, muscle: ex.muscle, weight: lastWeight, completedSets };
    });
    const duration = sessionClock.sec;
    const score = calcScore(Math.round(totalKg), totalSets, fb.global, fb.energy);
    const entry = { ...fb, day: day.day, dayLabel: day.label, date: todayKey(), exercises: exercisesData, totalKg: Math.round(totalKg), totalSets, duration, weights: { ...weights }, score, feedback: fb };
    setSessionHistory(prev => { const next = [...prev.filter(s => s.date !== todayKey()), entry]; persist({ sessionHistory: next }); setStreak(s => s + 1); return next; });
    setSessionActive(false);
    sessionClock.reset();
    setShowFeedback(false);
    setShowReport(entry);
  };

  const handleExport = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(lsLoad(), null, 2)], { type: "application/json" })); a.download = `PH-backup-${todayKey()}.json`; a.click(); };
  const handleImport = (data) => { lsSave(data); if (data.schedule) setSchedule(data.schedule); if (data.log) setLog(data.log); if (data.weights) setWeights(data.weights); if (data.sessionHistory) setSessionHistory(data.sessionHistory); if (data.excluded) setExcluded(data.excluded); alert("Données restaurées."); };

  const day = schedule[dayIdx];
  const isRest = !day?.salle;
  const exos = (aiOverride?.exercises || day?.exercises || []).filter(e => !excluded.includes(e.id));
  const absExos = aiOverride?.abs || day?.abs || [];
  const sessionDates = sessionHistory.map(s => s.date);

  // Bottom nav tabs
  const TABS = [
    { id: "seance", label: "Séance", icon: "⚡" },
    { id: "progress", label: "Stats", icon: "📈" },
    { id: "history", label: "Historique", icon: "📅" },
    { id: "settings", label: "Réglages", icon: "⚙" },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", minHeight: "100dvh", color: T.ink, fontFamily: "Inter, -apple-system, sans-serif", maxWidth: "100vw", overflowX: "hidden" }}>

      {/* TOP BAR */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "12px 16px", position: "sticky", top: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, letterSpacing: "-.02em" }}>
            PH <span style={{ background: T.lime, color: T.ink, padding: "1px 7px", borderRadius: 6, fontSize: 14, fontWeight: 900 }}>APP</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, letterSpacing: ".16em", textTransform: "uppercase", marginTop: 1 }}>S24 · Sprint 10</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sessionActive && (
            <span style={{ fontSize: 13, fontWeight: 800, color: T.red, background: T.redBg, padding: "4px 12px", borderRadius: 8 }}>
              {fmtDur(sessionClock.sec)}
            </span>
          )}
          {streak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 100, padding: "4px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: T.streak }}>{streak}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: T.streak, letterSpacing: ".08em" }}>J</span>
            </div>
          )}
        </div>
      </div>

      {/* DAY STRIP — only on séance tab */}
      {tab === "seance" && (
        <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: "flex", overflowX: "auto", scrollbarWidth: "none", padding: "8px 12px", gap: 4 }}>
          {schedule.map((d, i) => {
            const exList = d.exercises || [];
            const done = exList.filter(e => Array.from({ length: typeof e.sets === "number" ? e.sets : 0 }, (_, si) => si).every(si => log[`${e.id}_s${si}`]?.done)).length;
            const pct = exList.length ? Math.round(done / exList.length * 100) : 0;
            const isToday = i === todayIdx(), isSel = i === dayIdx;
            return (
              <div key={i} onClick={() => { setDayIdx(i); setAiOverride(null); }}
                style={{ flexShrink: 0, minWidth: 52, padding: "8px 6px", textAlign: "center", cursor: "pointer", borderRadius: 12, background: isSel ? T.ink : isToday ? T.limeBg : "transparent", border: isToday && !isSel ? `2px solid ${T.lime}` : "2px solid transparent", transition: "all .15s" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isSel ? T.lime : isToday ? T.green : T.muted, letterSpacing: ".04em" }}>{d.day}</div>
                <div style={{ fontSize: 8, fontWeight: 500, color: isSel ? "rgba(255,255,255,.5)" : T.muted2, margin: "2px 0" }}>{d.label.split(" ")[0]}</div>
                {d.salle ? (
                  <div style={{ width: "70%", height: 3, background: isSel ? "rgba(255,255,255,.15)" : T.border, borderRadius: 100, margin: "0 auto", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: 3, background: isSel ? T.lime : T.green, borderRadius: 100 }} />
                  </div>
                ) : <div style={{ fontSize: 7, color: isSel ? "rgba(255,255,255,.2)" : T.muted2 }}>—</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div style={{ paddingBottom: 80 }}>

        {/* ── SÉANCE TAB ── */}
        {tab === "seance" && (
          <div style={{ padding: "16px 16px 0", maxWidth: 680, margin: "0 auto" }}>
            {isRest ? (
              <div style={{ textAlign: "center", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: T.muted }}>Récupération</div>
                <p style={{ fontSize: 14, color: T.muted, maxWidth: 300, lineHeight: 1.9 }}>
                  {dayIdx === 3 ? "Récupération musculaire active." : "Reset complet. Synthèse protéique prioritaire."}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  {["10km marche", "8h sommeil", "2g protéines/kg"].map(r => (
                    <span key={r} style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", border: `1.5px solid ${T.border}`, borderRadius: 100, color: T.muted }}>{r}</span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Session header */}
                <div style={{ background: T.card, borderRadius: 20, padding: "18px", marginBottom: 14, boxShadow: T.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 4 }}>{day.day} · S24</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, lineHeight: 1.1, letterSpacing: "-.01em" }}>{aiOverride?.titre || day.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: T.muted, marginTop: 4 }}>{day.muscle}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 100, background: day.salle === "haut" ? T.orangeBg : T.greenBg, color: day.salle === "haut" ? T.orange : T.green, border: `1.5px solid ${day.salle === "haut" ? T.orangeBorder : T.greenBorder}`, whiteSpace: "nowrap", flexShrink: 0 }}>
                      {day.salle === "haut" ? "Salle Haut" : "Salle Bas"}
                    </span>
                  </div>

                  {/* START / END SESSION BUTTON */}
                  {!sessionActive ? (
                    <button
                      onClick={handleStartSession}
                      style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: T.lime, color: T.ink, fontFamily: "Inter", fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: ".02em" }}>
                      ▶ Démarrer la séance
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1, padding: "13px", borderRadius: 14, background: T.redBg, border: `1.5px solid ${T.red}`, textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.red }}>⏱ {fmtDur(sessionClock.sec)}</span>
                      </div>
                      <button onClick={handleEndSession} style={{ flex: 2, padding: "13px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        ■ Terminer
                      </button>
                      <button onClick={() => setShowRegen(true)} style={{ padding: "13px 16px", borderRadius: 14, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontFamily: "Inter", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        IA
                      </button>
                    </div>
                  )}

                  {!sessionActive && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button style={{ flex: 1, fontSize: 13, fontWeight: 600, padding: "10px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => setShowRegen(true)}>✦ Générer IA</button>
                    </div>
                  )}
                </div>

                {/* Warmup */}
                <div style={{ background: T.card, borderRadius: 14, padding: "14px 16px", marginBottom: 14, boxShadow: T.shadow, borderLeft: `4px solid ${T.ink}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Échauffement · 8 min</div>
                  <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.8 }}>
                    {day.salle === "haut"
                      ? "Rotations épaules 2×10 · Wall slide 2×10 · Push-up to downdog 2×8 · Mobilité thoracique"
                      : "Corde à sauter 3 min · Hip circle 2×10 · Leg swing 2×10 · Rameur 3 min"}
                  </div>
                </div>

                {/* Exercises label */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Exercices</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.muted }}>{exos.length} mouvements</span>
                </div>

                {exos.map(ex => (
                  <ExCard key={ex.id} ex={ex}
                    weight={weights[ex.id] ?? baseKg(ex.name)}
                    onWeightChange={saveWeight}
                    log={log}
                    onLogSet={saveLog}
                    onStartRest={(s, n) => { setRestLabel(n); restTimer.start(s); }}
                    sessionHistory={sessionHistory}
                  />
                ))}

                {/* Abs */}
                {absExos.length > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 10px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: ".1em" }}>Abdominaux</span>
                    </div>
                    {absExos.map(a => (
                      <div key={a.id} style={{ background: T.card, borderRadius: 14, padding: "14px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: T.shadow }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{a.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: T.greenBg, color: T.green }}>{a.vol}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* End CTA if not active */}
                {!sessionActive && (
                  <div style={{ background: T.card, borderRadius: 16, padding: "20px", textAlign: "center", marginTop: 16, boxShadow: T.shadow }}>
                    <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Séance terminée ? Génère ton rapport.</div>
                    <button style={{ fontSize: 15, fontWeight: 700, padding: "14px 36px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", cursor: "pointer" }} onClick={() => setShowFeedback(true)}>Rapport de séance</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PROGRESS TAB ── */}
        {tab === "progress" && <ProgressTab sessionHistory={sessionHistory} weights={weights} />}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div style={{ padding: "16px 16px 0", maxWidth: 680, margin: "0 auto" }}>
            <MonthCalendar sessionDates={sessionDates} onSelectDate={key => { const s = sessionHistory.find(h => h.date === key); if (s) setShowReport(s); }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Séances récentes</div>
            {sessionHistory.length === 0 && <div style={{ textAlign: "center", padding: "36px", fontSize: 13, color: T.muted }}>Aucune séance enregistrée.</div>}
            {sessionHistory.slice().reverse().map((s, i) => (
              <div key={i} onClick={() => setShowReport(s)} style={{ background: T.card, borderRadius: 16, padding: "16px", marginBottom: 10, cursor: "pointer", boxShadow: T.shadow }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{s.dayLabel || s.day}</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.muted, marginTop: 2 }}>{s.date}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {s.score > 0 && <span style={{ fontSize: 13, fontWeight: 800, padding: "3px 12px", borderRadius: 8, background: T.limeBg, border: `1.5px solid ${T.lime}`, color: T.ink }}>{s.score}</span>}
                    {s.totalKg > 0 && <span style={{ fontSize: 12, color: T.muted }}>{s.totalKg.toLocaleString()}kg</span>}
                  </div>
                </div>
                {s.exercises && <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>{s.exercises.slice(0, 3).map(e => e.name).join(" · ")}{s.exercises.length > 3 ? ` +${s.exercises.length - 3}` : ""}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <SettingsTab
            excluded={excluded}
            onToggleExclude={toggleExclude}
            onExport={handleExport}
            onImport={handleImport}
            onReset={() => { if (!window.confirm("Effacer toutes les données ?")) return; lsSave({}); setLog({}); setWeights({}); setSessionHistory([]); setExcluded([]); setSchedule(DEFAULT_PROGRAM); setStreak(0); }}
          />
        )}
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300, background: T.card, borderTop: `1px solid ${T.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 4px 12px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === id ? 700 : 500, color: tab === id ? T.ink : T.muted, letterSpacing: ".02em" }}>{label}</span>
            {tab === id && <div style={{ width: 20, height: 2.5, background: T.lime, borderRadius: 100, marginTop: 1 }} />}
          </button>
        ))}
      </div>

      {/* ── OVERLAYS ── */}
      <RingTimer sec={restTimer.sec} total={restTimer.total} running={restTimer.running} done={restTimer.done} label={restLabel} onStop={() => restTimer.stop()} onReset={() => restTimer.reset()} />
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} onSave={handleFeedbackSave} />}
      {showRegen && <RegenModal dayInfo={day} excluded={excluded} history={sessionHistory} weights={weights} onClose={() => setShowRegen(false)} onResult={s => { setAiOverride(s); setTab("seance"); }} />}
      {showReport && <SessionReport session={showReport} onClose={() => setShowReport(null)} />}
    </div>
  );
}
