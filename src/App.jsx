import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── DESIGN SYSTEM S9 ────────────────────────────────────────────────────────
// Philosophy: Athletic minimalism. Every element earns its place.
// Type: Inter only — weight does the work. 800 for impact, 400 for clarity.
// Color: Near-white base (#F9F9F7), true black ink, lime as a single surgical accent.
// Depth: Subtle shadows replace borders where possible. Cards float, not sit.
// Spacing: Generous. Breathing room is a feature, not waste.
// Interaction: Every tap has a response. Active states are immediate and clear.

const T = {
  bg: "#F9F9F7",
  bgDeep: "#F0F0ED",
  card: "#FFFFFF",
  cardHover: "#FAFAF8",
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
  blue: "#1D4ED8",
  blueBg: "#EFF6FF",
  shadow: "0 1px 3px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04)",
  shadowLg: "0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.04)",
  streak: "#D97706",
};

// ─── SVG ILLUSTRATIONS ────────────────────────────────────────────────────────
const STROKE = { stroke: "#1A1A18", strokeWidth: "1.8", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
const STROKE_ACTIVE = { stroke: "#0A0A09", strokeWidth: "2.2", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };

function IlloBench({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .25s ease", transform: active ? "translateY(-2px)" : "none" }}>
      <rect x="8" y="24" width="56" height="7" rx="3" {...s} fill={active ? "#F4F4F2" : "#F8F8F6"} />
      <rect x="12" y="31" width="4" height="12" rx="1.5" {...STROKE} fill="#F8F8F6" />
      <rect x="56" y="31" width="4" height="12" rx="1.5" {...STROKE} fill="#F8F8F6" />
      <ellipse cx="36" cy="18" rx="6" ry="7" {...s} fill="#F8F8F6" />
      <line x1="42" y1="21" x2="58" y2="24" {...s} />
      <line x1="30" y1="21" x2="14" y2="24" {...s} />
      <rect x="1" y="21" width="7" height="6" rx="3" {...STROKE} fill="#F8F8F6" />
      <rect x="64" y="21" width="7" height="6" rx="3" {...STROKE} fill="#F8F8F6" />
    </svg>
  );
}

function IlloPullup({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .3s ease", transform: active ? "translateY(-5px)" : "none" }}>
      <rect x="4" y="3" width="64" height="5" rx="2.5" {...s} fill="#F8F8F6" />
      <ellipse cx="36" cy="19" rx="6" ry="7" {...s} fill="#F8F8F6" />
      <line x1="32" y1="8" x2="28" y2="19" {...s} />
      <line x1="40" y1="8" x2="44" y2="19" {...s} />
      <line x1="36" y1="26" x2="33" y2="42" {...s} />
      <line x1="36" y1="26" x2="39" y2="42" {...s} />
      <line x1="33" y1="34" x2="26" y2="42" {...s} />
      <line x1="39" y1="34" x2="46" y2="42" {...s} />
    </svg>
  );
}

function IlloDeadlift({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .25s ease", transform: active ? "translateY(-3px)" : "none" }}>
      <ellipse cx="36" cy="12" rx="6" ry="7" {...s} fill="#F8F8F6" />
      <line x1="36" y1="19" x2="36" y2="30" {...s} />
      <line x1="36" y1="24" x2="27" y2="34" {...s} />
      <line x1="36" y1="24" x2="45" y2="34" {...s} />
      <line x1="27" y1="34" x2="25" y2="48" {...s} />
      <line x1="45" y1="34" x2="47" y2="48" {...s} />
      <rect x="6" y="43" width="60" height="5" rx="2.5" {...s} fill="#F8F8F6" />
      <rect x="1" y="39" width="9" height="13" rx="4.5" {...STROKE} fill="#F8F8F6" />
      <rect x="62" y="39" width="9" height="13" rx="4.5" {...STROKE} fill="#F8F8F6" />
      <line x1="32" y1="19" x2="12" y2="43" {...s} />
      <line x1="40" y1="19" x2="60" y2="43" {...s} />
    </svg>
  );
}

function IlloSquat({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .25s ease", transform: active ? "scaleY(.94)" : "scaleY(1)" }}>
      <ellipse cx="36" cy="9" rx="6" ry="6" {...s} fill="#F8F8F6" />
      <rect x="6" y="13" width="60" height="4" rx="2" {...s} fill="#F8F8F6" />
      <rect x="1" y="10" width="8" height="11" rx="4" {...STROKE} fill="#F8F8F6" />
      <rect x="63" y="10" width="8" height="11" rx="4" {...STROKE} fill="#F8F8F6" />
      <line x1="36" y1="17" x2="28" y2="32" {...s} />
      <line x1="36" y1="17" x2="44" y2="32" {...s} />
      <line x1="28" y1="32" x2="24" y2="50" {...s} />
      <line x1="44" y1="32" x2="48" y2="50" {...s} />
      <line x1="28" y1="32" x2="16" y2="42" {...s} />
      <line x1="44" y1="32" x2="56" y2="42" {...s} />
    </svg>
  );
}

function IlloRow({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .25s ease", transform: active ? "translateX(4px)" : "none" }}>
      <ellipse cx="16" cy="16" rx="6" ry="6" {...s} fill="#F8F8F6" />
      <line x1="16" y1="22" x2="14" y2="35" {...s} />
      <line x1="16" y1="27" x2="7" y2="33" {...s} />
      <line x1="14" y1="35" x2="10" y2="50" {...s} />
      <line x1="14" y1="35" x2="20" y2="48" {...s} />
      <line x1="16" y1="22" x2="48" y2="24" {...s} />
      <rect x="48" y="20" width="20" height="8" rx="4" {...s} fill="#F8F8F6" />
    </svg>
  );
}

function IlloPress({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .3s ease", transform: active ? "translateY(-5px)" : "none" }}>
      <ellipse cx="36" cy="34" rx="6" ry="6" {...s} fill="#F8F8F6" />
      <line x1="32" y1="30" x2="26" y2="20" {...s} />
      <line x1="40" y1="30" x2="46" y2="20" {...s} />
      <rect x="8" y="13" width="56" height="5" rx="2.5" {...s} fill="#F8F8F6" />
      <rect x="2" y="9" width="9" height="13" rx="4.5" {...STROKE} fill="#F8F8F6" />
      <rect x="61" y="9" width="9" height="13" rx="4.5" {...STROKE} fill="#F8F8F6" />
      <line x1="36" y1="40" x2="33" y2="51" {...s} />
      <line x1="36" y1="40" x2="39" y2="51" {...s} />
    </svg>
  );
}

function IlloCurl({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .25s ease", transform: active ? "rotate(-6deg)" : "none" }}>
      <ellipse cx="36" cy="9" rx="6" ry="6" {...s} fill="#F8F8F6" />
      <line x1="36" y1="15" x2="36" y2="26" {...s} />
      <line x1="36" y1="20" x2="46" y2="25" {...s} />
      <path d="M46 25 Q54 25 52 38" {...s} />
      <rect x="44" y="36" width="15" height="6" rx="3" {...s} fill="#F8F8F6" />
      <line x1="36" y1="26" x2="32" y2="50" {...s} />
      <line x1="36" y1="26" x2="40" y2="50" {...s} />
    </svg>
  );
}

function IlloKB({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .35s ease", transform: active ? "rotate(12deg) translateY(-3px)" : "none" }}>
      <path d="M25 17 Q36 4 47 17" {...s} />
      <circle cx="36" cy="34" r="15" {...s} fill="#F8F8F6" />
      <rect x="29" y="15" width="14" height="8" rx="2" {...STROKE} fill="#F8F8F6" />
    </svg>
  );
}

function IlloDips({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .25s ease", transform: active ? "translateY(-4px)" : "none" }}>
      <line x1="12" y1="2" x2="12" y2="50" {...s} />
      <line x1="60" y1="2" x2="60" y2="50" {...s} />
      <line x1="6" y1="18" x2="18" y2="18" {...s} />
      <line x1="54" y1="18" x2="66" y2="18" {...s} />
      <ellipse cx="36" cy="14" rx="6" ry="6" {...s} fill="#F8F8F6" />
      <line x1="30" y1="19" x2="18" y2="18" {...s} />
      <line x1="42" y1="19" x2="54" y2="18" {...s} />
      <line x1="36" y1="20" x2="33" y2="38" {...s} />
      <line x1="36" y1="20" x2="39" y2="38" {...s} />
    </svg>
  );
}

function IlloDefault({ active }) {
  const s = active ? STROKE_ACTIVE : STROKE;
  return (
    <svg viewBox="0 0 72 52" fill="none" style={{ width: 64, height: 46, transition: "transform .25s ease", transform: active ? "scale(1.05)" : "none" }}>
      <ellipse cx="36" cy="13" rx="6" ry="6" {...s} fill="#F8F8F6" />
      <line x1="36" y1="19" x2="36" y2="32" {...s} />
      <line x1="36" y1="25" x2="24" y2="32" {...s} />
      <line x1="36" y1="25" x2="48" y2="32" {...s} />
      <line x1="36" y1="32" x2="30" y2="50" {...s} />
      <line x1="36" y1="32" x2="42" y2="50" {...s} />
    </svg>
  );
}

function Illo({ name, active = false }) {
  const n = (name || "").toLowerCase();
  if (n.includes("développé") || n.includes("bench") || n.includes("chest")) return <IlloBench active={active} />;
  if (n.includes("traction") || n.includes("chin") || n.includes("pulldown")) return <IlloPullup active={active} />;
  if (n.includes("soulevé") || n.includes("deadlift") || n.includes("rdl") || n.includes("romanian")) return <IlloDeadlift active={active} />;
  if (n.includes("squat") || n.includes("gobelet") || n.includes("presse")) return <IlloSquat active={active} />;
  if (n.includes("rowing") || n.includes("row") || n.includes("tirage")) return <IlloRow active={active} />;
  if (n.includes("militaire") || n.includes("press") || n.includes("arnold") || n.includes("élévation")) return <IlloPress active={active} />;
  if (n.includes("curl") || n.includes("biceps")) return <IlloCurl active={active} />;
  if (n.includes("kettlebell") || n.includes("swing") || n.includes("turkish") || n.includes("clean")) return <IlloKB active={active} />;
  if (n.includes("dips")) return <IlloDips active={active} />;
  return <IlloDefault active={active} />;
}

// ─── BASE DATA ────────────────────────────────────────────────────────────────
const BASE_KG = { "développé couché barre": 40, "développé militaire barre": 30, "développé incliné haltères": 16, "développé couché haltères": 18, "chest press": 16, "élévations latérales": 8, "oiseau inversé": 8, "arnold press": 12, "tractions": 0, "chin-up": 0, "pull-up": 0, "pulldown": 14, "romanian deadlift": 20, "rdl": 20, "rowing haltère": 20, "rowing barre": 50, "cable row": 14, "squat barre": 40, "soulevé de terre": 60, "hip thrust": 50, "fentes": 14, "gobelet squat": 18, "kettlebell swing": 18, "clean & press": 14, "turkish get-up": 10, "curl barre": 25, "curl haltères": 12, "curl marteau": 12, "curl incliné": 10, "dips": 0, "extensions triceps": 14, "skull crusher": 18, "face pull": 12, "rameur": 0, "skierg": 0, "corde": 0, "vélo": 0, "cable fly": 14, "lat pulldown": 14 };
function baseKg(name) { const n = (name || "").toLowerCase(); for (const [k, v] of Object.entries(BASE_KG)) { if (n.includes(k)) return v; } return 15; }
function calc1RM(kg, reps) { if (!kg || kg === 0) return null; const r = parseFloat(String(reps).split("–")[0]) || 8; return Math.round(kg * (1 + r / 30)); }
function calcWarmup(kg) { if (!kg || kg <= 20) return []; return [{ pct: "50%", kg: Math.round(kg * .5 / 2.5) * 2.5, reps: 8 }, { pct: "70%", kg: Math.round(kg * .7 / 2.5) * 2.5, reps: 5 }, { pct: "90%", kg: Math.round(kg * .9 / 2.5) * 2.5, reps: 2 }]; }

const COACH_TIPS = { "traction": "Descente bras tendus complète — c'est là que le muscle se développe.", "développé couché": "Pause 1 sec sur la poitrine. Pas de rebond.", "soulevé": "Dos neutre absolu. Barre collée aux tibias tout le long.", "squat": "Sous la parallèle. Regard à 45°, pas en bas.", "curl": "Coudes fixes. 3 sec à la descente.", "rowing": "Rétraction omoplates avant de tirer.", "militaire": "Core serré. Barre passe devant le menton.", "kettlebell": "Poussée de hanches, pas un squat.", "dips": "Descente lente 3 sec. Coudes derrière.", "rdl": "Charnière hanche pure. Ressens l'étirement ischios." };
function getCoachTip(name) { const n = (name || "").toLowerCase(); for (const [k, v] of Object.entries(COACH_TIPS)) { if (n.includes(k)) return v; } return null; }

const SALLE_HAUT = "Rack olympique · Barre + disques · Haltères 30kg · Kettlebells 25kg · Station tractions/dips · Banc";
const SALLE_BAS = "Plurima 3 stations · Haltères 26kg · SkiErg · Rameur · Vélo · Tapis marche · Corde à sauter";

const DEFAULT_PROGRAM = [
  { day: "LUN", label: "Push Force", salle: "haut", muscle: "Pecs · Épaules · Triceps", exercises: [{ id: "lun1", name: "Développé couché barre", sets: 5, reps: "4–5", rest: 240, muscle: "Pecs" }, { id: "lun2", name: "Développé militaire barre", sets: 4, reps: "5–6", rest: 180, muscle: "Épaules" }, { id: "lun3", name: "Développé incliné haltères 30°", sets: 3, reps: "10–12", rest: 120, muscle: "Pecs sup" }, { id: "lun4", name: "Élévations latérales haltères", sets: 4, reps: "12–15", rest: 75, muscle: "Épaules lat" }, { id: "lun5", name: "Oiseau inversé haltères", sets: 3, reps: "15", rest: 60, muscle: "Rear delt" }, { id: "lun6", name: "Dips barres parallèles", sets: 4, reps: "8–12", rest: 90, muscle: "Triceps" }], abs: [{ id: "al1", name: "L-Sit dips", vol: "4×max" }, { id: "al2", name: "Crunch obliques", vol: "3×20" }] },
  { day: "MAR", label: "Hybrid Circuit", salle: "bas", muscle: "Full Body · Plurima · SkiErg", exercises: [{ id: "mar1", name: "Chest press Plurima", sets: 4, reps: "12", rest: 0, muscle: "Pecs" }, { id: "mar2", name: "Lat pulldown Plurima", sets: 4, reps: "12", rest: 0, muscle: "Dos" }, { id: "mar3", name: "Rowing haltère unilatéral", sets: 4, reps: "12", rest: 90, muscle: "Dos" }, { id: "mar4", name: "Développé couché haltères", sets: 4, reps: "12", rest: 0, muscle: "Pecs" }, { id: "mar5", name: "Curl haltères alternés", sets: 4, reps: "10", rest: 0, muscle: "Biceps" }, { id: "mar6", name: "SkiErg Sprints 20/10", sets: 8, reps: "20s", rest: 10, muscle: "Cardio" }], abs: [{ id: "am1", name: "Relevé de jambes", vol: "4×15" }, { id: "am2", name: "Planche dynamique", vol: "3×10" }] },
  { day: "MER", label: "Pull & Legs", salle: "haut", muscle: "Dos · Biceps · Jambes", exercises: [{ id: "mer1", name: "Tractions prise large", sets: 5, reps: "5–7", rest: 180, muscle: "Dos large" }, { id: "mer2", name: "Chin-up prise supination", sets: 4, reps: "6–8", rest: 150, muscle: "Dos + biceps" }, { id: "mer3", name: "Romanian Deadlift haltères", sets: 4, reps: "8–10", rest: 150, muscle: "Ischios" }, { id: "mer4", name: "Rowing haltère unilatéral", sets: 3, reps: "10–12", rest: 90, muscle: "Dos épais" }, { id: "mer5", name: "Gobelet squat kettlebell", sets: 4, reps: "12", rest: 0, muscle: "Quads" }, { id: "mer6", name: "Kettlebell Swing à deux mains", sets: 4, reps: "15", rest: 0, muscle: "Fessiers" }, { id: "mer7", name: "Curl barre EZ", sets: 4, reps: "8–10", rest: 90, muscle: "Biceps" }], abs: [{ id: "amer1", name: "Ab rollout barre", vol: "4×10" }, { id: "amer2", name: "Russian twist", vol: "3×20" }] },
  { day: "JEU", label: "Repos", salle: null, muscle: "Récupération active", exercises: [], abs: [] },
  { day: "VEN", label: "Endurance Force", salle: "bas", muscle: "Full Body · Rameur · Haltères", exercises: [{ id: "ven1", name: "Rameur Intervals 500m", sets: 4, reps: "500m", rest: 60, muscle: "Full body" }, { id: "ven2", name: "Développé couché haltères", sets: 4, reps: "12", rest: 0, muscle: "Pecs" }, { id: "ven3", name: "Rowing haltère unilatéral", sets: 4, reps: "12", rest: 0, muscle: "Dos" }, { id: "ven4", name: "Curl incliné haltères", sets: 4, reps: "10", rest: 0, muscle: "Biceps" }, { id: "ven5", name: "Élévations latérales haltères", sets: 4, reps: "15", rest: 90, muscle: "Épaules" }, { id: "ven6", name: "Corde à sauter", sets: 3, reps: "1min", rest: 0, muscle: "Cardio" }], abs: [{ id: "av1", name: "Hollow body hold", vol: "4×30s" }, { id: "av2", name: "Crunch câble", vol: "3×15" }] },
  { day: "SAM", label: "Full Power", salle: "haut", muscle: "Deadlift · Tractions · Kettlebell", exercises: [{ id: "sam1", name: "Soulevé de terre conventionnel", sets: 5, reps: "3–5", rest: 300, muscle: "Full body" }, { id: "sam2", name: "Hip thrust barre", sets: 4, reps: "10–12", rest: 150, muscle: "Fessiers" }, { id: "sam3", name: "Tractions lestées prise large", sets: 5, reps: "4–6", rest: 180, muscle: "Dos large" }, { id: "sam4", name: "Dips barres parallèles", sets: 3, reps: "8–10", rest: 120, muscle: "Triceps" }, { id: "sam5", name: "Kettlebell Swing unilatéral", sets: 4, reps: "8/bras", rest: 0, muscle: "Fessiers" }, { id: "sam6", name: "Turkish Get-Up", sets: 4, reps: "2/côté", rest: 120, muscle: "Stabilité" }], abs: [{ id: "as1", name: "Dragon flag", vol: "4×5–8" }, { id: "as2", name: "Relevé jambes suspendu", vol: "3×12" }] },
  { day: "DIM", label: "Repos", salle: null, muscle: "Reset total", exercises: [], abs: [] },
];

const SESSION_TYPES = [{ id: "full", label: "Corps entier" }, { id: "upper", label: "Haut du corps" }, { id: "lower", label: "Bas du corps" }, { id: "arms", label: "Bras" }, { id: "bw", label: "Poids de corps" }, { id: "kb", label: "Kettlebell" }, { id: "cardio", label: "Cardio hybride" }, { id: "strength", label: "Force pure" }, { id: "recovery", label: "Récup active" }];

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const LS_KEY = "ph_s9";
const lsLoad = () => { try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : {}; } catch { return {}; } };
const lsSave = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} };

// ─── UTILS ────────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const todayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const fmtMSS = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const fmtDur = s => s >= 3600 ? `${Math.floor(s / 3600)}h${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, "0")}s`;

function beep() { try { const c = new (window.AudioContext || window.webkitAudioContext)(); [0, .18, .36].forEach(d => { const o = c.createOscillator(), g = c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.setValueAtTime(.28, c.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d + .12); o.start(c.currentTime + d); o.stop(c.currentTime + d + .12); }); } catch {} }

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useCountdown(onDone) {
  const [sec, setSec] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const start = useCallback(s => { setSec(s); setTotal(s); setRunning(true); setDone(false); clearInterval(ref.current); ref.current = setInterval(() => { setSec(p => { if (p <= 1) { clearInterval(ref.current); setRunning(false); setDone(true); beep(); onDone?.(); return 0; } return p - 1; }); }, 1000); }, [onDone]);
  const stop = () => { clearInterval(ref.current); setRunning(false); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setDone(false); setSec(0); setTotal(0); };
  useEffect(() => () => clearInterval(ref.current), []);
  return { sec, total, running, done, start, stop, reset };
}

function useStopwatch() {
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const start = () => { setSec(0); setRunning(true); ref.current = setInterval(() => setSec(p => p + 1), 1000); };
  const stop = () => { clearInterval(ref.current); setRunning(false); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setSec(0); };
  useEffect(() => () => clearInterval(ref.current), []);
  return { sec, running, start, stop, reset };
}

function useSessionClock() {
  const [sec, setSec] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef(null);
  const startClock = () => { if (!active) { setActive(true); ref.current = setInterval(() => setSec(p => p + 1), 1000); } };
  const stopClock = () => { clearInterval(ref.current); setActive(false); return sec; };
  useEffect(() => () => clearInterval(ref.current), []);
  return { sec, active, startClock, stopClock };
}

// ─── RING TIMER ───────────────────────────────────────────────────────────────
function RingTimer({ sec, total, running, done, label, onStop, onReset }) {
  if (sec === 0 && !running && !done) return null;
  const R = 56, C = 2 * Math.PI * R;
  const pct = total > 0 ? sec / total : 0;
  const color = done ? T.green : T.ink;
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500, display: "flex", justifyContent: "center", padding: "0 20px 24px" }}>
      <div style={{ background: T.card, borderRadius: 24, padding: "20px 32px 20px", boxShadow: T.shadowLg, display: "flex", alignItems: "center", gap: 24, maxWidth: 360, width: "100%" }}>
        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="44" cy="44" r={R} fill="none" stroke={T.border} strokeWidth="7" />
            <circle cx="44" cy="44" r={R} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${C * pct} ${C}`} strokeLinecap="round" style={{ transition: "stroke-dasharray .6s linear, stroke .3s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "Inter", fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{fmtMSS(sec)}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>{done ? "Prêt à repartir" : label || "Repos"}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 12 }}>{done ? "La prochaine série t'attend." : `${Math.round(pct * 100)}% écoulé`}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {running && <button onClick={onStop} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }}>Pause</button>}
            <button onClick={onReset} style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, border: "none", background: T.bgDeep, color: T.muted, cursor: "pointer" }}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LINE CHART ───────────────────────────────────────────────────────────────
function LineChart({ data, color = T.ink, height = 64 }) {
  if (!data || data.length < 2) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 12, color: T.muted }}>Données insuffisantes</span></div>;
  const vals = data.map(d => d.value), min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const W = 300, H = height;
  const pts = data.map((d, i) => [(i / (data.length - 1)) * (W - 24) + 12, H - 6 - ((d.value - min) / range) * (H - 18)]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;
  const gid = `g${color.replace("#", "")}`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".08" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill={color} stroke={T.card} strokeWidth="2" />)}
        <text x={pts[pts.length - 1][0]} y={pts[pts.length - 1][1] - 8} textAnchor="middle" fontSize="9" fill={color} fontFamily="Inter" fontWeight="700">{data[data.length - 1].value}</text>
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {data.map((d, i) => <span key={i} style={{ fontSize: 9, color: T.muted, fontWeight: 500 }}>{d.date}</span>)}
      </div>
    </div>
  );
}

// ─── RADAR CHART ──────────────────────────────────────────────────────────────
function RadarChart({ data }) {
  const labels = ["Pecs", "Dos", "Épaules", "Bras", "Jambes", "Core"];
  const n = labels.length, cx = 100, cy = 100, r = 74;
  const pts = labels.map((l, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2, val = (data[l] || 0) / 100; return { x: cx + r * val * Math.cos(a), y: cy + r * val * Math.sin(a), lx: cx + (r + 18) * Math.cos(a), ly: cy + (r + 18) * Math.sin(a) }; });
  const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
  const grid = [.25, .5, .75, 1].map(s => labels.map((_, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2; return `${cx + r * s * Math.cos(a)},${cy + r * s * Math.sin(a)}`; }).join(" "));
  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: 200 }}>
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke={T.border} strokeWidth="1" />)}
      {labels.map((_, i) => { const a = (i / n) * 2 * Math.PI - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={T.border} strokeWidth="1" />; })}
      <polygon points={poly} fill={`${T.lime}50`} stroke={T.limeDark} strokeWidth="2" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="3" fill={T.ink} /><text x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={T.muted} fontFamily="Inter" fontWeight="600">{labels[i]}</text></g>)}
    </svg>
  );
}

// ─── MONTH CALENDAR ───────────────────────────────────────────────────────────
function MonthCalendar({ sessionDates, onSelectDate }) {
  const [view, setView] = useState(new Date());
  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
  const off = first === 0 ? 6 : first - 1;
  const cells = Array.from({ length: off + dim }, (_, i) => { if (i < off) return null; const d = i - off + 1; const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; return { d, key, done: sessionDates.includes(key), isToday: key === todayKey() }; });
  const MN = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const DN = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <div style={{ background: T.card, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: T.shadow }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <button onClick={() => setView(new Date(y, m - 1, 1))} style={{ background: T.bgDeep, border: "none", cursor: "pointer", color: T.muted, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
        <span style={{ fontFamily: "Inter", fontSize: 14, fontWeight: 700, color: T.ink, letterSpacing: ".02em" }}>{MN[m]} {y}</span>
        <button onClick={() => setView(new Date(y, m + 1, 1))} style={{ background: T.bgDeep, border: "none", cursor: "pointer", color: T.muted, fontSize: 18, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
        {DN.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: T.muted2, paddingBottom: 8 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {cells.map((c, i) => { if (!c) return <div key={i} />; return (<div key={i} onClick={() => c.done && onSelectDate?.(c.key)} style={{ aspectRatio: "1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: c.done ? T.ink : c.isToday ? T.limeBg : "transparent", border: c.isToday ? `2px solid ${T.lime}` : "1px solid transparent", cursor: c.done ? "pointer" : "default", transition: "all .12s" }}><span style={{ fontSize: 12, fontWeight: c.done || c.isToday ? 700 : 400, color: c.done ? "#fff" : c.isToday ? T.ink : T.muted }}>{c.d}</span></div>); })}
      </div>
    </div>
  );
}

// ─── EXERCISE CARD ────────────────────────────────────────────────────────────
function ExCard({ ex, weight, onWeightChange, log, onLogSet, onStartRest, activeSw, onStartSw, onStopSw, swSec, onExclude, sessionHistory }) {
  const [open, setOpen] = useState(false);
  const sets = typeof ex.sets === "number" ? ex.sets : 0;
  const doneArr = Array.from({ length: sets }, (_, i) => !!(log[`${ex.id}_s${i}`]?.done));
  const completedSets = doneArr.filter(Boolean).length;
  const allDone = sets > 0 && completedSets === sets;
  const isActive = activeSw === ex.id;
  const kg = weight ?? baseKg(ex.name);
  const orm = calc1RM(kg, ex.reps);
  const warmup = calcWarmup(kg);
  const tip = getCoachTip(ex.name);
  const lastKg = useMemo(() => { const prev = sessionHistory.filter(s => (s.exercises || []).some(e => e.id === ex.id)); if (!prev.length) return null; return prev[prev.length - 1].exercises?.find(e => e.id === ex.id)?.weight || null; }, [sessionHistory, ex.id]);
  const suggestionKg = useMemo(() => { const recent = sessionHistory.filter(s => (s.completedExos || []).includes(ex.id)).slice(-2); if (recent.length < 2) return null; return kg + 2.5; }, [sessionHistory, ex.id, kg]);

  return (
    <div style={{ background: T.card, borderRadius: 16, marginBottom: 10, boxShadow: isActive ? T.shadowMd : T.shadow, border: `1px solid ${allDone ? T.greenBorder : isActive ? T.ink : "transparent"}`, borderLeft: `3px solid ${allDone ? T.green : isActive ? T.ink : "transparent"}`, transition: "all .2s ease", overflow: "hidden" }}>

      {/* Main row — always visible */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Illustration */}
          <div style={{ flexShrink: 0, width: 64, height: 46, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? T.bgDeep : T.bg, borderRadius: 12, opacity: isActive ? 1 : .7, transition: "all .2s" }}>
            <Illo name={ex.name} active={isActive} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: allDone ? T.green : T.ink, textDecoration: allDone ? "line-through" : "none", lineHeight: 1.3 }}>{ex.name}</span>
              {suggestionKg && <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: T.greenBg, border: `1px solid ${T.greenBorder}`, padding: "1px 7px", borderRadius: 4 }}>↑ {suggestionKg}kg</span>}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: T.muted }}>{ex.muscle}</span>
              {orm && <span style={{ fontSize: 11, fontWeight: 600, color: T.blue }}>1RM ~{orm}kg</span>}
              {ex.rest > 0 && <span style={{ fontSize: 11, color: T.muted }}>· {ex.rest >= 60 ? `${ex.rest / 60}min` : `${ex.rest}s`} repos</span>}
            </div>
          </div>

          {/* Quick set buttons — always visible, no accordion needed */}
          <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
            {sets > 0 && Array.from({ length: sets }, (_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); onLogSet(`${ex.id}_s${i}`, { done: !doneArr[i], weight: kg, date: todayKey() }); }} style={{ width: 34, height: 34, borderRadius: 10, cursor: "pointer", transition: "all .15s", border: `1.5px solid ${doneArr[i] ? T.green : T.border}`, background: doneArr[i] ? T.green : T.card, color: doneArr[i] ? "#fff" : T.muted, fontFamily: "Inter", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setOpen(o => !o)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: open ? T.bgDeep : "transparent", cursor: "pointer", color: T.muted, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {open ? "▲" : "▼"}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px", background: T.bg }}>
          {/* Weight control */}
          <div style={{ background: T.card, borderRadius: 12, padding: "12px 16px", marginBottom: 14, boxShadow: T.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 2 }}>Charge</div>
                {lastKg && <div style={{ fontSize: 11, color: T.muted2 }}>Dernière fois : <b style={{ color: T.muted }}>{lastKg}kg</b></div>}
              </div>
              <button onClick={() => onWeightChange(ex.id, Math.max(0, kg - 2.5))} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, flexShrink: 0 }}>−</button>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <span style={{ fontFamily: "Inter", fontSize: 26, fontWeight: 800, color: T.ink }}>{kg === 0 ? "BW" : `${kg}kg`}</span>
              </div>
              <button onClick={() => onWeightChange(ex.id, kg + 2.5)} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, flexShrink: 0 }}>+</button>
            </div>
          </div>

          {/* Warmup */}
          {warmup.length > 0 && (
            <div style={{ marginBottom: 14 }}>
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
            <div style={{ background: T.limeBg, borderRadius: 10, padding: "10px 14px", marginBottom: 14, borderLeft: `3px solid ${T.lime}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.ink, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Conseil</div>
              <div style={{ fontSize: 13, fontWeight: 400, color: T.ink2, lineHeight: 1.6 }}>{tip}</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!isActive
              ? <button style={{ fontSize: 12, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "none", background: T.ink, color: "#fff", cursor: "pointer" }} onClick={() => onStartSw(ex.id)}>▶ Démarrer série</button>
              : <button style={{ fontSize: 12, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "none", background: T.red, color: "#fff", cursor: "pointer" }} onClick={() => onStopSw(ex.id)}>■ Stop · {fmtMSS(swSec)}</button>
            }
            {ex.rest > 0 && <button style={{ fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => onStartRest(ex.rest, ex.name)}>⏱ {ex.rest >= 60 ? `${ex.rest / 60}min` : `${ex.rest}s`}</button>}
            <button style={{ fontSize: 11, fontWeight: 500, padding: "9px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: "transparent", color: T.muted2, cursor: "pointer", marginLeft: "auto" }} onClick={() => onExclude(ex.id)}>Exclure</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GYM MODE ─────────────────────────────────────────────────────────────────
function GymMode({ exercises, log, weights, onLogSet, onWeightChange, onClose }) {
  const [idx, setIdx] = useState(0);
  const [restLabel, setRestLabel] = useState("");
  const rest = useCountdown();
  const sw = useStopwatch();
  const ex = exercises[idx];
  if (!ex) return null;
  const kg = weights[ex.id] ?? baseKg(ex.name);
  const sets = typeof ex.sets === "number" ? ex.sets : 0;
  const doneArr = Array.from({ length: sets }, (_, i) => !!(log[`${ex.id}_s${i}`]?.done));
  const completedSets = doneArr.filter(Boolean).length;
  const orm = calc1RM(kg, ex.reps);
  const tip = getCoachTip(ex.name);
  const pct = exercises.length > 1 ? idx / (exercises.length - 1) : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 600, display: "flex", flexDirection: "column", fontFamily: "Inter" }}>
      {/* Top bar */}
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.card, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, background: T.border, borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: 4, background: T.ink, width: `${pct * 100}%`, borderRadius: 100, transition: "width .4s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontWeight: 500 }}>{idx + 1} / {exercises.length} exercices</div>
        </div>
        <button style={{ background: T.bgDeep, border: "none", cursor: "pointer", color: T.muted, fontSize: 16, width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 16 }} onClick={onClose}>✕</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px 24px", gap: 24 }}>
        {/* Big illustration */}
        <div style={{ width: 140, height: 100, background: T.card, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: T.shadowMd, transform: sw.running ? "scale(1.04)" : "scale(1)", transition: "transform .3s ease" }}>
          <div style={{ transform: "scale(1.8)", transformOrigin: "center" }}>
            <Illo name={ex.name} active={sw.running} />
          </div>
        </div>

        {/* Name */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, lineHeight: 1.1, marginBottom: 4 }}>{ex.name}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>{ex.muscle}</div>
        </div>

        {/* Weight */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button onClick={() => onWeightChange(ex.id, Math.max(0, kg - 2.5))} style={{ width: 48, height: 48, borderRadius: 14, border: `1.5px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, boxShadow: T.shadow }}>−</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 44, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{kg === 0 ? "BW" : `${kg}kg`}</div>
            {orm && <div style={{ fontSize: 12, fontWeight: 600, color: T.blue, marginTop: 4 }}>1RM estimé {orm}kg</div>}
          </div>
          <button onClick={() => onWeightChange(ex.id, kg + 2.5)} style={{ width: 48, height: 48, borderRadius: 14, border: `1.5px solid ${T.border}`, background: T.card, color: T.ink, fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, boxShadow: T.shadow }}>+</button>
        </div>

        {/* Specs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {[sets > 0 ? `${sets} séries` : String(ex.sets), String(ex.reps), ex.rest > 0 ? `${ex.rest >= 60 ? `${ex.rest / 60}min` : `${ex.rest}s`} repos` : null].filter(Boolean).map((t, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 100, background: T.card, border: `1px solid ${T.border}`, color: T.ink2, boxShadow: T.shadow }}>{t}</span>
          ))}
        </div>

        {/* Set buttons */}
        {sets > 0 && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {Array.from({ length: sets }, (_, i) => (
              <button key={i} onClick={() => onLogSet(`${ex.id}_s${i}`, { done: !doneArr[i], weight: kg, date: todayKey() })} style={{ width: 60, height: 60, borderRadius: 16, cursor: "pointer", border: `2px solid ${doneArr[i] ? T.green : T.border}`, background: doneArr[i] ? T.green : T.card, color: doneArr[i] ? "#fff" : T.muted, fontFamily: "Inter", fontSize: 18, fontWeight: 800, transition: "all .15s", boxShadow: T.shadow }}>
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Stopwatch */}
        {sw.running && <div style={{ fontSize: 22, fontWeight: 800, color: T.red }}>{fmtMSS(sw.sec)}</div>}

        {/* Coach tip */}
        {tip && (
          <div style={{ background: T.limeBg, borderRadius: 14, padding: "12px 16px", maxWidth: 320, width: "100%", borderLeft: `3px solid ${T.lime}` }}>
            <div style={{ fontSize: 12, fontWeight: 400, color: T.ink2, lineHeight: 1.7 }}>{tip}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {!sw.running
            ? <button style={{ fontSize: 14, fontWeight: 700, padding: "13px 28px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", cursor: "pointer" }} onClick={() => sw.start()}>▶ Démarrer</button>
            : <button style={{ fontSize: 14, fontWeight: 700, padding: "13px 28px", borderRadius: 14, border: "none", background: T.red, color: "#fff", cursor: "pointer" }} onClick={() => sw.stop()}>■ Stop</button>
          }
          {ex.rest > 0 && <button style={{ fontSize: 14, fontWeight: 600, padding: "13px 24px", borderRadius: 14, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => { setRestLabel(ex.name); rest.start(ex.rest); sw.stop(); }}>Repos</button>}
        </div>

        {/* Mini ring timer in gym mode */}
        {(rest.sec > 0 || rest.running || rest.done) && (
          <div style={{ background: T.card, borderRadius: 16, padding: "16px 24px", boxShadow: T.shadowMd, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 72, height: 72 }}>
              <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke={T.border} strokeWidth="5" />
                <circle cx="36" cy="36" r="30" fill="none" stroke={rest.done ? T.green : T.ink} strokeWidth="5" strokeDasharray={`${rest.total > 0 ? 2 * Math.PI * 30 * (rest.sec / rest.total) : 0} ${2 * Math.PI * 30}`} strokeLinecap="round" style={{ transition: "stroke-dasharray .5s" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: rest.done ? T.green : T.ink }}>{fmtMSS(rest.sec)}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: rest.done ? T.green : T.ink }}>{rest.done ? "Prêt !" : "Repos en cours"}</div>
              {rest.running && <button style={{ marginTop: 6, fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => rest.stop()}>Pause</button>}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, background: T.card }}>
        <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontFamily: "Inter", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: idx === 0 ? .4 : 1 }} onClick={() => idx > 0 && setIdx(i => i - 1)} disabled={idx === 0}>← Préc.</button>
        {idx < exercises.length - 1
          ? <button style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={() => setIdx(i => i + 1)}>Suivant →</button>
          : <button style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: T.green, color: "#fff", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={onClose}>Terminer ✓</button>
        }
      </div>
    </div>
  );
}

// ─── SESSION REPORT ───────────────────────────────────────────────────────────
function SessionReport({ session, onClose }) {
  if (!session) return null;
  const { totalKg = 0, totalSets = 0, duration = 0, exercises = [], feedback = {}, date = "", dayLabel = "", day = "", score = 0 } = session;
  const muscleVol = {};
  exercises.forEach(ex => { const m = ex.muscle || "Autre"; muscleVol[m] = (muscleVol[m] || 0) + (ex.weight || 0) * (ex.completedSets || 0) * (parseFloat(String(ex.reps || "8").split("–")[0]) || 8); });
  const maxVol = Math.max(...Object.values(muscleVol), 1);
  const MAP = { "Pecs": "Pecs", "Dos": "Dos", "Dos large": "Dos", "Dos épais": "Dos", "Dos + biceps": "Dos", "Épaules": "Épaules", "Épaules lat": "Épaules", "Rear delt": "Épaules", "Biceps": "Bras", "Brachialis": "Bras", "Triceps": "Bras", "Quads": "Jambes", "Ischios": "Jambes", "Fessiers": "Jambes", "Full body": "Pecs", "Core": "Core", "Stabilité": "Core", "Cardio": "Core" };
  const radarData = {};
  Object.entries(muscleVol).forEach(([m, v]) => { const k = MAP[m] || "Core"; radarData[k] = (radarData[k] || 0) + v; });
  const rMax = Math.max(...Object.values(radarData), 1);
  Object.keys(radarData).forEach(k => radarData[k] = Math.round(radarData[k] / rMax * 100));

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 700, overflowY: "auto", fontFamily: "Inter" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 60 }}>
        {/* Hero header */}
        <div style={{ background: T.ink, padding: "40px 24px 32px", position: "relative" }}>
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

        {/* Primary metrics row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "#F0F0ED" }}>
          {[
            { l: "Volume", v: totalKg > 0 ? `${(totalKg / 1000).toFixed(2).replace(".", ",")}` : "—", u: "tonnes", sub: totalKg > 0 ? `${totalKg.toLocaleString()} kg` : "" },
            { l: "Durée", v: duration > 0 ? fmtDur(duration) : "—", u: "", sub: "" },
            { l: "Séries", v: `${totalSets}`, u: "", sub: "complètes" },
          ].map(m => (
            <div key={m.l} style={{ background: T.card, padding: "20px 14px", margin: "1px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{m.l}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{m.v}</div>
              {m.u && <div style={{ fontSize: 10, fontWeight: 500, color: T.muted, marginTop: 3 }}>{m.u}</div>}
              {m.sub && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{m.sub}</div>}
            </div>
          ))}
        </div>

        {/* Secondary metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#F0F0ED" }}>
          {[
            { l: "Intensité", v: feedback.global > 0 ? `${feedback.global} / 5` : "—", sub: ["", "Très léger", "Léger", "Modéré", "Intense", "Maximum"][feedback.global || 0] || "" },
            { l: "Énergie", v: feedback.energy > 0 ? `${feedback.energy} / 5` : "—", sub: "" },
          ].map(m => (
            <div key={m.l} style={{ background: T.card, padding: "16px 14px", margin: "1px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{m.v}</div>
              {m.sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{m.sub}</div>}
            </div>
          ))}
        </div>

        {/* Radar + volume bars */}
        <div style={{ background: T.card, borderTop: "1px solid #F0F0ED", padding: "20px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Volume par groupe musculaire</div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <RadarChart data={radarData} />
            <div style={{ flex: 1, minWidth: 150, display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(muscleVol).slice(0, 6).map(([m, v]) => (
                <div key={m}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: T.ink2 }}>{m}</span>
                    <span style={{ fontSize: 11, color: T.muted }}>{Math.round(v / 1000 * 10) / 10}T</span>
                  </div>
                  <div style={{ height: 5, background: T.bgDeep, borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: 5, background: T.ink, width: `${(v / maxVol) * 100}%`, borderRadius: 100, transition: "width .6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Exercise breakdown */}
        <div style={{ background: T.card, borderTop: "1px solid #F0F0ED" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F0ED" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Exercices</div>
          </div>
          {exercises.map((ex, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < exercises.length - 1 ? "1px solid #F0F0ED" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 30, opacity: .35, flexShrink: 0 }}><Illo name={ex.name || ""} active={false} /></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{ex.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{ex.muscle} · {ex.completedSets || 0} séries</div>
                </div>
              </div>
              {ex.weight > 0 && <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{ex.weight}kg</div>}
            </div>
          ))}
        </div>

        {/* Feedback */}
        {(feedback.good?.length > 0 || feedback.hard?.length > 0 || feedback.notes) && (
          <div style={{ background: T.card, borderTop: "1px solid #F0F0ED", padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>Observations</div>
            {feedback.good?.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{feedback.good.map(m => <span key={m} style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 100, background: T.greenBg, border: `1px solid ${T.greenBorder}`, color: T.green }}>{m}</span>)}</div>}
            {feedback.hard?.length > 0 && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{feedback.hard.map(m => <span key={m} style={{ fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 100, background: T.orangeBg, border: `1px solid ${T.orangeBorder}`, color: T.orange }}>{m}</span>)}</div>}
            {feedback.notes && <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.7, fontStyle: "italic", padding: "12px 14px", background: T.bg, borderRadius: 10, marginTop: 8 }}>"{feedback.notes}"</div>}
          </div>
        )}

        <div style={{ padding: "24px 20px" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Fermer le rapport</button>
        </div>
      </div>
    </div>
  );
}

// ─── FEEDBACK MODAL ───────────────────────────────────────────────────────────
function FeedbackModal({ onClose, onSave }) {
  const [global, setGlobal] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");
  const [good, setGood] = useState([]);
  const [hard, setHard] = useState([]);
  const muscles = ["Pecs", "Dos", "Épaules", "Biceps", "Triceps", "Jambes", "Fessiers", "Core", "Cardio"];
  const toggle = (arr, set, m) => set(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 600, overflowY: "auto", padding: "24px 20px", fontFamily: "Inter" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>Bilan de séance</div>
          <button style={{ background: T.bgDeep, border: "none", fontSize: 16, cursor: "pointer", color: T.muted, width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Intensité ressentie</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setGlobal(n)} style={{ flex: 1, height: 56, borderRadius: 14, border: `2px solid ${global >= n ? T.ink : T.border}`, background: global >= n ? T.ink : T.card, color: global >= n ? "#fff" : T.muted, fontFamily: "Inter", fontSize: 18, fontWeight: 800, cursor: "pointer", transition: "all .15s", boxShadow: global >= n ? T.shadow : "none" }}>{n}</button>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {["Léger", "", "Modéré", "", "Maximum"].map((l, i) => <span key={i} style={{ fontSize: 10, fontWeight: 500, color: T.muted }}>{l}</span>)}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Niveau d'énergie</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setEnergy(n)} style={{ flex: 1, height: 44, borderRadius: 12, border: `2px solid ${energy >= n ? T.limeDark : T.border}`, background: energy >= n ? T.lime : T.card, color: T.ink, fontFamily: "Inter", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>{n}</button>)}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Bonnes sensations</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {muscles.map(m => <button key={m} onClick={() => toggle(good, setGood, m)} style={{ padding: "8px 16px", borderRadius: 100, border: `1.5px solid ${good.includes(m) ? T.greenBorder : T.border}`, background: good.includes(m) ? T.greenBg : T.card, color: good.includes(m) ? T.green : T.muted, fontFamily: "Inter", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .12s" }}>{m}</button>)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>À améliorer</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {muscles.map(m => <button key={m} onClick={() => toggle(hard, setHard, m)} style={{ padding: "8px 16px", borderRadius: 100, border: `1.5px solid ${hard.includes(m) ? T.orangeBorder : T.border}`, background: hard.includes(m) ? T.orangeBg : T.card, color: hard.includes(m) ? T.orange : T.muted, fontFamily: "Inter", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .12s" }}>{m}</button>)}
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations techniques, ressenti, douleurs..." style={{ width: "100%", minHeight: 96, padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${T.border}`, fontFamily: "Inter", fontSize: 13, color: T.ink, resize: "vertical", outline: "none", background: T.card, lineHeight: 1.6, boxSizing: "border-box" }} />
        </div>
        <button style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 15, fontWeight: 700, cursor: "pointer" }} onClick={() => { onSave({ global, energy, good, hard, notes }); onClose(); }}>Enregistrer le bilan</button>
      </div>
    </div>
  );
}

// ─── REGEN MODAL ──────────────────────────────────────────────────────────────
function RegenModal({ dayInfo, excluded, history, weights, onClose, onResult }) {
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [custom, setCustom] = useState("");
  const generate = async () => {
    if (!type && !custom) return;
    setLoading(true);
    const excNames = excluded.map(id => DEFAULT_PROGRAM.flatMap(d => d.exercises || []).find(e => e.id === id)?.name).filter(Boolean);
    const histS = history.slice(-4).map(h => (h.exercises || []).slice(0, 3).map(e => e.name).join(", ") || "").join(" / ") || "aucun";
    const wS = Object.entries(weights).slice(0, 6).map(([id, kg]) => { const e = DEFAULT_PROGRAM.flatMap(d => d.exercises || []).find(e => e.id === id); return e ? `${e.name.split(" ").slice(0, 2).join(" ")}:${kg}kg` : ""; }).filter(Boolean).join(", ");
    const salle = dayInfo.salle === "haut" ? SALLE_HAUT : SALLE_BAS;
    const sys = `Coach hybride. JSON pur uniquement, sans backticks ni texte.
Profil: homme 76kg 173cm intermédiaire. Corps hybride athlétique sec.
Salle: ${salle}
Exclus: ${excNames.join(", ") || "aucun"}
Historique: ${histS}
Charges: ${wS}
Type: ${SESSION_TYPES.find(t => t.id === type)?.label || custom}
Format: {"titre":"...","exercises":[{"id":"ai1","name":"...","sets":4,"reps":"10","rest":90,"muscle":"..."}],"abs":[{"id":"ab1","name":"...","vol":"3x12"}]}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: `${sys}\n\nRaison: ${custom || SESSION_TYPES.find(t => t.id === type)?.label}. Jour: ${dayInfo.day}. Salle: ${dayInfo.salle}.` }] }) });
      const data = await res.json();
      const raw = (data.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
      onResult(JSON.parse(raw)); onClose();
    } catch { alert("Erreur. Réessaie."); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(249,249,247,.96)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter" }}>
      <div style={{ background: T.card, borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", boxShadow: T.shadowLg }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Nouvelle séance</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Quel type de séance veux-tu ?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {SESSION_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id === type ? null : t.id)} style={{ padding: "12px 8px", borderRadius: 12, cursor: "pointer", border: `2px solid ${type === t.id ? T.ink : T.border}`, background: type === t.id ? T.ink : T.card, color: type === t.id ? "#fff" : T.ink2, fontFamily: "Inter", fontSize: 12, fontWeight: type === t.id ? 700 : 500, transition: "all .15s" }}>
              {t.label}
            </button>
          ))}
        </div>
        <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder="Ou décris librement ta demande..." style={{ width: "100%", minHeight: 52, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.border}`, fontFamily: "Inter", fontSize: 13, color: T.ink, resize: "none", outline: "none", background: T.bg, marginBottom: 16, boxSizing: "border-box" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, fontFamily: "Inter", fontSize: 14, fontWeight: 600, cursor: "pointer" }} onClick={onClose}>Annuler</button>
          <button style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (loading || (!type && !custom)) ? .5 : 1 }} onClick={generate} disabled={loading || (!type && !custom)}>{loading ? "Génération…" : "Générer"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE EDITOR ──────────────────────────────────────────────────────────
function ScheduleEditor({ schedule, onSave, onClose }) {
  const [local, setLocal] = useState(schedule.map(d => ({ ...d })));
  const LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const toggle = i => setLocal(prev => prev.map((d, idx) => idx === i ? { ...d, salle: d.salle ? null : (DEFAULT_PROGRAM[idx].salle || "haut") } : d));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(249,249,247,.97)", zIndex: 500, overflowY: "auto", padding: "24px 20px", fontFamily: "Inter" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>Planification</div>
          <button style={{ background: T.bgDeep, border: "none", fontSize: 16, cursor: "pointer", color: T.muted, width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>✕</button>
        </div>
        <div style={{ background: T.card, borderRadius: 16, overflow: "hidden", marginBottom: 20, boxShadow: T.shadow }}>
          {local.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < 6 ? `1px solid ${T.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{LABELS[i]}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.muted, marginTop: 2 }}>{d.salle ? d.label : "Repos"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {d.salle && <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 100, background: d.salle === "haut" ? T.orangeBg : T.greenBg, color: d.salle === "haut" ? T.orange : T.green, border: `1px solid ${d.salle === "haut" ? T.orangeBorder : T.greenBorder}` }}>{d.salle === "haut" ? "Haut" : "Bas"}</span>}
                <button onClick={() => toggle(i)} style={{ width: 48, height: 28, borderRadius: 100, border: "none", background: d.salle ? T.ink : T.bgDeep, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 100, background: "#fff", position: "absolute", top: 3, left: d.salle ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: "15px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", fontFamily: "Inter", fontSize: 15, fontWeight: 700, cursor: "pointer" }} onClick={() => { onSave(local); onClose(); }}>Sauvegarder</button>
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────
function SettingsTab({ excluded, onToggleExclude, onExport, onImport, onReset }) {
  const fileRef = useRef(null);
  const allEx = DEFAULT_PROGRAM.flatMap(d => d.exercises || []);
  return (
    <div style={{ padding: "20px 20px 80px", maxWidth: 680, margin: "0 auto", fontFamily: "Inter" }}>
      <div style={{ background: T.card, borderRadius: 16, padding: "20px", marginBottom: 12, boxShadow: T.shadow }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Sauvegarde</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.7 }}>Données dans le <code style={{ background: T.bg, padding: "1px 6px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>localStorage</code>. Exporte régulièrement pour sauvegarder dans iCloud Drive.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={{ fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 10, border: "none", background: T.ink, color: "#fff", cursor: "pointer" }} onClick={onExport}>↓ Exporter JSON</button>
          <button style={{ fontSize: 13, fontWeight: 600, padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => fileRef.current?.click()}>↑ Importer JSON</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => { try { onImport(JSON.parse(ev.target.result)); } catch { alert("Fichier invalide."); } }; r.readAsText(f); } }} />
        </div>
      </div>
      <div style={{ background: T.card, borderRadius: 16, overflow: "hidden", marginBottom: 12, boxShadow: T.shadow }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 2 }}>Exercices exclus</div>
          <div style={{ fontSize: 12, color: T.muted }}>Masqués dans les séances et exclus de la génération IA.</div>
        </div>
        {allEx.map((ex, i) => (
          <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < allEx.length - 1 ? `1px solid ${T.border}` : "none", opacity: excluded.includes(ex.id) ? .4 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ opacity: .35, flexShrink: 0 }}><Illo name={ex.name} active={false} /></div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{ex.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{ex.muscle}</div>
              </div>
            </div>
            <button onClick={() => onToggleExclude(ex.id)} style={{ padding: "6px 16px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${excluded.includes(ex.id) ? T.greenBorder : T.border}`, background: excluded.includes(ex.id) ? T.greenBg : "transparent", color: excluded.includes(ex.id) ? T.green : T.muted, transition: "all .12s" }}>{excluded.includes(ex.id) ? "Réactiver" : "Exclure"}</button>
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

// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────
function ProgressTab({ sessionHistory, weights }) {
  const [selectedEx, setSelectedEx] = useState(null);
  const allExNames = useMemo(() => [...new Set(DEFAULT_PROGRAM.flatMap(d => d.exercises || []).map(e => e.name))], []);
  const progressData = useMemo(() => { if (!selectedEx) return []; return sessionHistory.filter(s => s.weights?.[selectedEx]).map(s => ({ date: s.date.slice(5), value: s.weights[selectedEx] })).slice(-8); }, [selectedEx, sessionHistory]);
  const volumeByWeek = useMemo(() => { const weeks = {}; sessionHistory.forEach(s => { const w = s.date.slice(0, 7); weeks[w] = (weeks[w] || 0) + (s.totalKg || 0); }); return Object.entries(weeks).slice(-8).map(([w, v]) => ({ date: w.slice(5), value: Math.round(v / 1000) })); }, [sessionHistory]);
  const globalRadar = useMemo(() => {
    const data = {};
    const MAP = { "Pecs": "Pecs", "Dos": "Dos", "Dos large": "Dos", "Dos épais": "Dos", "Dos + biceps": "Dos", "Épaules": "Épaules", "Épaules lat": "Épaules", "Rear delt": "Épaules", "Biceps": "Bras", "Brachialis": "Bras", "Triceps": "Bras", "Quads": "Jambes", "Ischios": "Jambes", "Fessiers": "Jambes", "Full body": "Pecs", "Core": "Core", "Stabilité": "Core", "Cardio": "Core" };
    sessionHistory.forEach(s => { (s.exercises || []).forEach(ex => { const k = MAP[ex.muscle] || "Core"; data[k] = (data[k] || 0) + (ex.weight || 0) * (ex.completedSets || 0); }); });
    const max = Math.max(...Object.values(data), 1);
    Object.keys(data).forEach(k => data[k] = Math.round(data[k] / max * 100));
    return data;
  }, [sessionHistory]);

  const Card = ({ children, title, sub }) => (
    <div style={{ background: T.card, borderRadius: 16, padding: "20px", marginBottom: 12, boxShadow: T.shadow }}>
      {title && <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: sub ? 4 : 16 }}>{title}</div>}
      {sub && <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>{sub}</div>}
      {children}
    </div>
  );

  return (
    <div style={{ padding: "20px 20px 80px", maxWidth: 680, margin: "0 auto", fontFamily: "Inter" }}>
      <Card title="Équilibre musculaire" sub="Volume cumulé sur toutes tes séances">
        <div style={{ display: "flex", justifyContent: "center" }}><RadarChart data={globalRadar} /></div>
      </Card>
      <Card title="Volume hebdomadaire" sub="Tonnes soulevées par semaine">
        <LineChart data={volumeByWeek} color={T.ink} height={64} />
      </Card>
      <Card title="Progression des charges" sub="Évolution de la charge sur un exercice">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {allExNames.slice(0, 8).map(n => (
            <button key={n} onClick={() => setSelectedEx(n === selectedEx ? null : n)} style={{ fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 100, border: `1.5px solid ${selectedEx === n ? T.ink : T.border}`, background: selectedEx === n ? T.ink : T.card, color: selectedEx === n ? "#fff" : T.muted, cursor: "pointer", transition: "all .12s" }}>{n.split(" ").slice(0, 2).join(" ")}</button>
          ))}
        </div>
        {selectedEx ? <LineChart data={progressData} color={T.green} height={64} /> : <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: T.muted }}>Sélectionne un exercice</div>}
      </Card>
      <div style={{ background: T.card, borderRadius: 16, overflow: "hidden", boxShadow: T.shadow }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}><div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Personal Bests</div></div>
        {Object.keys(weights).length === 0 && <div style={{ padding: "28px", textAlign: "center", fontSize: 13, color: T.muted }}>Enregistre tes charges pendant les séances.</div>}
        {Object.entries(weights).map(([id, kg], i) => {
          const ex = DEFAULT_PROGRAM.flatMap(d => d.exercises || []).find(e => e.id === id);
          if (!ex) return null;
          const orm = calc1RM(kg, ex.reps);
          return (
            <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < Object.keys(weights).length - 1 ? `1px solid ${T.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ opacity: .35, flexShrink: 0 }}><Illo name={ex.name} active={false} /></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{ex.name}</div>
                  {orm && <div style={{ fontSize: 11, fontWeight: 600, color: T.blue }}>1RM estimé : {orm}kg</div>}
                </div>
              </div>
              <span style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{kg === 0 ? "BW" : `${kg}kg`}</span>
            </div>
          );
        })}
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
  const [intensity, setIntensity] = useState(3);
  const [streak, setStreak] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [gymMode, setGymMode] = useState(false);
  const [activeSw, setActiveSw] = useState(null);
  const [restLabel, setRestLabel] = useState("");
  const sw = useStopwatch();
  const restTimer = useCountdown();
  const sessionClock = useSessionClock();

  useEffect(() => {
    const data = lsLoad();
    if (data.schedule) setSchedule(data.schedule);
    if (data.log) setLog(data.log);
    if (data.weights) setWeights(data.weights);
    if (data.sessionHistory) setSessionHistory(data.sessionHistory);
    if (data.excluded) setExcluded(data.excluded);
    const dates = (data.sessionHistory || []).map(s => s.date);
    let s = 0;
    for (let i = 0; i < 30; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (dates.includes(d.toISOString().slice(0, 10))) s++; else break; }
    setStreak(s);
  }, []);

  const persist = useCallback((updates) => { lsSave({ schedule, log, weights, sessionHistory, excluded, ...updates }); }, [schedule, log, weights, sessionHistory, excluded]);

  const saveLog = useCallback((key, val) => {
    setLog(prev => { const next = { ...prev, [key]: val }; persist({ log: next }); return next; });
    if (!sessionClock.active) sessionClock.startClock();
    const exId = key.split("_s")[0];
    if (val.weight) { setWeights(prev => { if (!prev[exId] || val.weight > prev[exId]) { const next = { ...prev, [exId]: val.weight }; persist({ weights: next }); return next; } return prev; }); }
  }, [persist, sessionClock]);

  const saveWeight = useCallback((id, val) => { setWeights(prev => { const next = { ...prev, [id]: val }; persist({ weights: next }); return next; }); }, [persist]);
  const toggleExclude = useCallback((id) => { setExcluded(prev => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; persist({ excluded: next }); return next; }); }, [persist]);

  const calcScore = (kg, sets, g, e) => Math.round(Math.min(kg / 5000 * 40, 40) + Math.min(sets / 25 * 30, 30) + ((g || 3) + (e || 3)) / 10 * 30);

  const handleFeedbackSave = (fb) => {
    const day = schedule[dayIdx];
    const exos = aiOverride?.exercises || day.exercises || [];
    let totalKg = 0, totalSets = 0;
    const exercisesData = exos.map(ex => {
      const s = typeof ex.sets === "number" ? ex.sets : 0;
      let completedSets = 0, lastWeight = 0, completedReps = 0;
      Array.from({ length: s }, (_, i) => { const e = log[`${ex.id}_s${i}`]; if (e?.done) { completedSets++; lastWeight = e.weight || 0; const r = parseFloat(String(ex.reps).split("–")[0]) || 8; totalKg += lastWeight * r; totalSets++; completedReps += r; } });
      return { id: ex.id, name: ex.name, muscle: ex.muscle, weight: lastWeight, completedSets, completedReps };
    });
    const completedExos = exercisesData.filter(e => e.completedSets > 0).map(e => e.id);
    const muscles = [...new Set(exos.map(e => e.muscle).filter(Boolean))];
    const duration = sessionClock.active ? sessionClock.stopClock() : 0;
    const score = calcScore(Math.round(totalKg), totalSets, fb.global, fb.energy);
    const entry = { ...fb, day: day.day, dayLabel: day.label, date: todayKey(), exercises: exercisesData, totalKg: Math.round(totalKg), totalSets, duration, weights: { ...weights }, completedExos, muscles, score, feedback: fb };
    setSessionHistory(prev => { const next = [...prev.filter(s => s.date !== todayKey()), entry]; persist({ sessionHistory: next }); setStreak(s => s + 1); return next; });
    setShowReport(entry);
  };

  const handleExport = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(lsLoad(), null, 2)], { type: "application/json" })); a.download = `PH-backup-${todayKey()}.json`; a.click(); };
  const handleImport = (data) => { lsSave(data); if (data.schedule) setSchedule(data.schedule); if (data.log) setLog(data.log); if (data.weights) setWeights(data.weights); if (data.sessionHistory) setSessionHistory(data.sessionHistory); if (data.excluded) setExcluded(data.excluded); alert("Données restaurées."); };

  const day = schedule[dayIdx];
  const isRest = !day?.salle;
  const exos = (aiOverride?.exercises || day?.exercises || []).filter(e => !excluded.includes(e.id));
  const absExos = aiOverride?.abs || day?.abs || [];
  const sessionDates = sessionHistory.map(s => s.date);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.ink, fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* TOP BAR */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "14px 20px", position: "sticky", top: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-.02em" }}>
            PH <span style={{ background: T.lime, color: T.ink, padding: "1px 7px", borderRadius: 6, fontSize: 16, fontWeight: 900 }}>APP</span>
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, letterSpacing: ".16em", textTransform: "uppercase", marginTop: 1 }}>S24 · Sprint 9</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sessionClock.active && <span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>{fmtDur(sessionClock.sec)}</span>}
          {streak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 100, padding: "5px 14px" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: T.streak }}>{streak}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: T.streak, letterSpacing: ".08em" }}>JOURS</span>
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
        {[["seance", "Séance"], ["progress", "Progression"], ["history", "Historique"], ["settings", "Paramètres"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ fontSize: 12, fontWeight: tab === id ? 700 : 500, letterSpacing: ".02em", padding: "13px 20px", border: "none", background: "transparent", cursor: "pointer", color: tab === id ? T.ink : T.muted, borderBottom: `2.5px solid ${tab === id ? T.ink : "transparent"}`, whiteSpace: "nowrap", transition: "all .15s" }}>{label}</button>
        ))}
      </div>

      {/* SÉANCE TAB */}
      {tab === "seance" && (
        <>
          {/* Week strip */}
          <div style={{ background: T.card, borderBottom: `1px solid ${T.border}`, display: "flex", overflowX: "auto", scrollbarWidth: "none", padding: "10px 16px", gap: 6 }}>
            {schedule.map((d, i) => {
              const exos = d.exercises || [];
              const done = exos.filter(e => Array.from({ length: typeof e.sets === "number" ? e.sets : 0 }, (_, si) => si).every(si => log[`${e.id}_s${si}`]?.done)).length;
              const pct = exos.length ? Math.round(done / exos.length * 100) : 0;
              const isToday = i === todayIdx(), isSel = i === dayIdx;
              return (
                <div key={i} onClick={() => { setDayIdx(i); setAiOverride(null); }} style={{ flexShrink: 0, minWidth: 58, padding: "10px 8px", textAlign: "center", cursor: "pointer", borderRadius: 14, background: isSel ? T.ink : isToday ? T.limeBg : "transparent", border: isToday && !isSel ? `2px solid ${T.lime}` : "2px solid transparent", transition: "all .15s" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? T.lime : isToday ? T.green : T.muted, letterSpacing: ".04em" }}>{d.day}</div>
                  <div style={{ fontSize: 9, fontWeight: 500, color: isSel ? "rgba(255,255,255,.5)" : T.muted2, margin: "3px 0", lineHeight: 1.3 }}>{d.label.split(" ")[0]}</div>
                  {d.salle ? (
                    <div style={{ width: "70%", height: 3, background: isSel ? "rgba(255,255,255,.15)" : T.border, borderRadius: 100, margin: "0 auto", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: 3, background: isSel ? T.lime : T.green, borderRadius: 100 }} />
                    </div>
                  ) : <div style={{ fontSize: 7, color: isSel ? "rgba(255,255,255,.2)" : T.muted2 }}>—</div>}
                </div>
              );
            })}
          </div>

          <div style={{ padding: "20px 20px 120px", maxWidth: 680, margin: "0 auto" }}>
            {isRest ? (
              <div style={{ textAlign: "center", padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: T.muted, letterSpacing: "-.02em" }}>Récupération</div>
                <p style={{ fontSize: 14, color: T.muted, maxWidth: 320, lineHeight: 1.9, fontWeight: 400 }}>{dayIdx === 3 ? "Récupération musculaire active. Tes fibres consolident les adaptations." : "Semaine accomplie. Synthèse protéique et sommeil prioritaires."}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
                  {["10km marche", "8h sommeil", "2g protéines/kg", "Hydratation"].map(r => <span key={r} style={{ fontSize: 12, fontWeight: 500, padding: "7px 16px", border: `1.5px solid ${T.border}`, borderRadius: 100, color: T.muted }}>{r}</span>)}
                </div>
              </div>
            ) : (
              <>
                {/* Session header card */}
                <div style={{ background: T.card, borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: T.shadow }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 4 }}>{day.day} · S24</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, lineHeight: 1.05, letterSpacing: "-.01em" }}>{aiOverride?.titre || day.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: T.muted, marginTop: 5 }}>{day.muscle}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 13px", borderRadius: 100, background: day.salle === "haut" ? T.orangeBg : T.greenBg, color: day.salle === "haut" ? T.orange : T.green, border: `1.5px solid ${day.salle === "haut" ? T.orangeBorder : T.greenBorder}` }}>{day.salle === "haut" ? "Salle Haut" : "Salle Bas"}</span>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button style={{ fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 12, border: "none", background: T.lime, color: T.ink, cursor: "pointer", flex: "1 1 auto" }} onClick={() => setGymMode(true)}>Mode Salle</button>
                    <button style={{ fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => setShowRegen(true)}>Changer</button>
                    <button style={{ fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => setShowSchedule(true)}>⚙</button>
                    <button style={{ fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 12, border: `1.5px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer" }} onClick={() => setShowFeedback(true)}>Bilan</button>
                  </div>
                </div>

                {/* Intensity */}
                <div style={{ background: T.card, borderRadius: 14, padding: "14px 18px", marginBottom: 12, boxShadow: T.shadow, display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.muted, minWidth: 72 }}>Intensité</span>
                  <input type="range" min="1" max="5" value={intensity} onChange={e => setIntensity(Number(e.target.value))} style={{ flex: 1, accentColor: T.ink, cursor: "pointer" }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: T.ink, background: T.lime, padding: "3px 10px", borderRadius: 8, minWidth: 60, textAlign: "center" }}>{["Récup", "Léger", "Normal", "Intense", "Max"][intensity - 1]}</span>
                </div>

                {/* Warmup */}
                <div style={{ background: T.card, borderRadius: 14, padding: "14px 18px", marginBottom: 16, boxShadow: T.shadow, borderLeft: `4px solid ${T.ink}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Échauffement · 8 min</div>
                  <div style={{ fontSize: 13, color: T.ink2, lineHeight: 1.8 }}>{day.salle === "haut" ? "Rotations épaules 2×10 · Wall slide 2×10 · Push-up to downdog 2×8 · Mobilité thoracique" : "Corde à sauter 3 min · Hip circle 2×10 · Leg swing 2×10 · Rameur 3 min"}</div>
                </div>

                {/* Exercises */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em" }}>Exercices</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.muted }}>{exos.length} mouvements</span>
                </div>
                {exos.map(ex => (
                  <ExCard key={ex.id} ex={ex}
                    weight={weights[ex.id] ?? baseKg(ex.name)}
                    onWeightChange={saveWeight} log={log} onLogSet={saveLog}
                    onStartRest={(s, n) => { setRestLabel(n); restTimer.start(s); }}
                    activeSw={activeSw}
                    onStartSw={id => { setActiveSw(id); sw.start(); }}
                    onStopSw={id => { sw.stop(); setActiveSw(null); }}
                    swSec={sw.sec} onExclude={toggleExclude}
                    sessionHistory={sessionHistory}
                  />
                ))}

                {/* Abs */}
                {absExos.length > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 12px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: ".1em" }}>Abdominaux</span>
                    </div>
                    {absExos.map(a => (
                      <div key={a.id} style={{ background: T.card, borderRadius: 14, padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: T.shadow }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{a.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 8, background: T.greenBg, color: T.green }}>{a.vol}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* End CTA */}
                <div style={{ background: T.card, borderRadius: 16, padding: "20px", textAlign: "center", marginTop: 20, boxShadow: T.shadow }}>
                  <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Séance terminée ? Génère ton rapport.</div>
                  <button style={{ fontSize: 15, fontWeight: 700, padding: "14px 36px", borderRadius: 14, border: "none", background: T.ink, color: "#fff", cursor: "pointer" }} onClick={() => setShowFeedback(true)}>Rapport de séance</button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab === "progress" && <ProgressTab sessionHistory={sessionHistory} weights={weights} />}

      {tab === "history" && (
        <div style={{ padding: "20px 20px 80px", maxWidth: 680, margin: "0 auto", fontFamily: "Inter" }}>
          <MonthCalendar sessionDates={sessionDates} onSelectDate={key => { const s = sessionHistory.find(h => h.date === key); if (s) setShowReport(s); }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>Séances récentes</div>
          {sessionHistory.length === 0 && <div style={{ textAlign: "center", padding: "36px", fontSize: 13, color: T.muted }}>Aucune séance enregistrée.</div>}
          {sessionHistory.slice().reverse().map((s, i) => (
            <div key={i} onClick={() => setShowReport(s)} style={{ background: T.card, borderRadius: 16, padding: "16px 20px", marginBottom: 10, cursor: "pointer", boxShadow: T.shadow, transition: "box-shadow .15s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadowMd}
              onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{s.dayLabel || s.day}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: T.muted, marginTop: 2 }}>{s.date}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {s.score > 0 && <span style={{ fontSize: 13, fontWeight: 800, padding: "3px 12px", borderRadius: 8, background: T.limeBg, border: `1.5px solid ${T.lime}`, color: T.ink }}>{s.score}</span>}
                  {s.totalKg > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: T.muted }}>{s.totalKg.toLocaleString()}kg</span>}
                  {s.duration > 0 && <span style={{ fontSize: 12, fontWeight: 500, color: T.muted }}>{fmtDur(s.duration)}</span>}
                </div>
              </div>
              {s.exercises && <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>{s.exercises.slice(0, 4).map(e => e.name).join(" · ")}{s.exercises.length > 4 ? ` +${s.exercises.length - 4}` : ""}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && <SettingsTab excluded={excluded} onToggleExclude={toggleExclude} onExport={handleExport} onImport={handleImport} onReset={() => { if (!window.confirm("Effacer toutes les données ?")) return; lsSave({}); setLog({}); setWeights({}); setSessionHistory([]); setExcluded([]); setSchedule(DEFAULT_PROGRAM); setStreak(0); }} />}

      {/* OVERLAYS */}
      <RingTimer sec={restTimer.sec} total={restTimer.total} running={restTimer.running} done={restTimer.done} label={restLabel} onStop={() => restTimer.stop()} onReset={() => restTimer.reset()} />
      {gymMode && <GymMode exercises={exos} log={log} weights={weights} onLogSet={saveLog} onWeightChange={saveWeight} onClose={() => setGymMode(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} onSave={fb => { handleFeedbackSave(fb); setShowFeedback(false); }} />}
      {showRegen && <RegenModal dayInfo={day} excluded={excluded} history={sessionHistory} weights={weights} onClose={() => setShowRegen(false)} onResult={s => { setAiOverride(s); setTab("seance"); }} />}
      {showReport && <SessionReport session={showReport} onClose={() => setShowReport(null)} />}
      {showSchedule && <ScheduleEditor schedule={schedule} onSave={s => { setSchedule(s); persist({ schedule: s }); }} onClose={() => setShowSchedule(false)} />}
    </div>
  );
}
