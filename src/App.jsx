import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const sb = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;
const USER_ID = "mascaptain";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Apple Fitness+ dark-first. One accent. No gradients. No decorations.
const C = {
  bg:         "#000000",
  surface:    "#0A0A0A",
  surface2:   "#111111",
  surface3:   "#1A1A1A",
  border:     "#1F1F1F",
  border2:    "#2A2A2A",
  ink:        "#FFFFFF",
  ink80:      "rgba(255,255,255,.80)",
  ink48:      "rgba(255,255,255,.48)",
  ink24:      "rgba(255,255,255,.24)",
  ink12:      "rgba(255,255,255,.12)",
  accent:     "#0A84FF",   // Apple blue on dark
  accentDim:  "rgba(10,132,255,.15)",
  lime:       "#A3E635",   // PH brand — used ONE place only (active day dot)
  green:      "#30D158",   // Apple green
  greenDim:   "rgba(48,209,88,.12)",
  red:        "#FF453A",   // Apple red
  redDim:     "rgba(255,69,58,.12)",
  orange:     "#FF9F0A",
  orangeDim:  "rgba(255,159,10,.12)",
};

// ─── TYPOGRAPHY ──────────────────────────────────────────────────────────────
// SF Pro Display via system-ui — exact Apple weights: 300/400/600/700
// No weight 500. Body at 17px. Display at 28–40px with -0.02em spacing.
const F = "system-ui, -apple-system, 'SF Pro Display', sans-serif";

// ─── EASING ──────────────────────────────────────────────────────────────────
const EASE_OUT  = "cubic-bezier(0.23, 1, 0.32, 1)";
const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
const T_FAST    = "150ms";
const T_MED     = "220ms";
const T_DRAWER  = "340ms";

// ─── PROGRAM DATA ────────────────────────────────────────────────────────────
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
  "face pull": 12,
};
function baseKg(name) {
  const n = (name || "").toLowerCase();
  for (const [k, v] of Object.entries(BASE_KG)) { if (n.includes(k)) return v; }
  return 15;
}
function calc1RM(kg, reps) {
  if (!kg) return null;
  const r = parseFloat(String(reps).split("–")[0]) || 8;
  return Math.round(kg * (1 + r / 30));
}

const PROGRAM = [
  { day: "LUN", label: "Push Force", salle: "haut", muscle: "Pecs · Épaules · Triceps", exercises: [
    { id: "l1", name: "Développé couché barre",       sets: 5, reps: "4–5", rest: 240, muscle: "Pecs" },
    { id: "l2", name: "Développé militaire barre",    sets: 4, reps: "5–6", rest: 180, muscle: "Épaules" },
    { id: "l3", name: "Développé incliné haltères",   sets: 3, reps: "10–12", rest: 120, muscle: "Pecs sup" },
    { id: "l4", name: "Élévations latérales haltères",sets: 4, reps: "12–15", rest: 75,  muscle: "Deltoïdes" },
    { id: "l5", name: "Oiseau inversé haltères",      sets: 3, reps: "15",    rest: 60,  muscle: "Rear delt" },
    { id: "l6", name: "Dips barres parallèles",       sets: 4, reps: "8–12", rest: 90,  muscle: "Triceps" },
  ], abs: [{ id: "la1", name: "L-Sit dips", vol: "4×max" }, { id: "la2", name: "Crunch obliques", vol: "3×20" }] },

  { day: "MAR", label: "Hybrid Circuit", salle: "bas", muscle: "Full Body · Plurima · SkiErg", exercises: [
    { id: "m1", name: "Chest press Plurima",          sets: 4, reps: "12",  rest: 0,   muscle: "Pecs" },
    { id: "m2", name: "Lat pulldown Plurima",         sets: 4, reps: "12",  rest: 0,   muscle: "Dos" },
    { id: "m3", name: "Rowing haltère unilatéral",    sets: 4, reps: "12",  rest: 90,  muscle: "Dos" },
    { id: "m4", name: "Développé couché haltères",    sets: 4, reps: "12",  rest: 0,   muscle: "Pecs" },
    { id: "m5", name: "Curl haltères alternés",       sets: 4, reps: "10",  rest: 0,   muscle: "Biceps" },
    { id: "m6", name: "SkiErg Sprints 20/10",         sets: 8, reps: "20s", rest: 10,  muscle: "Cardio" },
  ], abs: [{ id: "ma1", name: "Relevé de jambes", vol: "4×15" }, { id: "ma2", name: "Planche dynamique", vol: "3×10" }] },

  { day: "MER", label: "Pull & Legs", salle: "haut", muscle: "Dos · Biceps · Jambes", exercises: [
    { id: "me1", name: "Tractions prise large",        sets: 5, reps: "5–7",   rest: 180, muscle: "Dos large" },
    { id: "me2", name: "Chin-up prise supination",     sets: 4, reps: "6–8",   rest: 150, muscle: "Dos + biceps" },
    { id: "me3", name: "Romanian Deadlift haltères",   sets: 4, reps: "8–10",  rest: 150, muscle: "Ischios" },
    { id: "me4", name: "Rowing haltère unilatéral",    sets: 3, reps: "10–12", rest: 90,  muscle: "Dos épais" },
    { id: "me5", name: "Gobelet squat kettlebell",     sets: 4, reps: "12",    rest: 0,   muscle: "Quads" },
    { id: "me6", name: "Kettlebell Swing à deux mains",sets: 4, reps: "15",    rest: 0,   muscle: "Fessiers" },
    { id: "me7", name: "Curl barre EZ",                sets: 4, reps: "8–10",  rest: 90,  muscle: "Biceps" },
  ], abs: [{ id: "mea1", name: "Ab rollout barre", vol: "4×10" }, { id: "mea2", name: "Russian twist", vol: "3×20" }] },

  { day: "JEU", label: "Repos", salle: null, muscle: "Récupération active", exercises: [], abs: [] },

  { day: "VEN", label: "Endurance Force", salle: "bas", muscle: "Full Body · Rameur · Haltères", exercises: [
    { id: "v1", name: "Rameur Intervals 500m",          sets: 4, reps: "500m", rest: 60, muscle: "Full body" },
    { id: "v2", name: "Développé couché haltères",      sets: 4, reps: "12",   rest: 0,  muscle: "Pecs" },
    { id: "v3", name: "Rowing haltère unilatéral",      sets: 4, reps: "12",   rest: 0,  muscle: "Dos" },
    { id: "v4", name: "Curl incliné haltères",          sets: 4, reps: "10",   rest: 0,  muscle: "Biceps" },
    { id: "v5", name: "Élévations latérales haltères",  sets: 4, reps: "15",   rest: 90, muscle: "Deltoïdes" },
    { id: "v6", name: "Corde à sauter",                 sets: 3, reps: "1min", rest: 0,  muscle: "Cardio" },
  ], abs: [{ id: "va1", name: "Hollow body hold", vol: "4×30s" }, { id: "va2", name: "Crunch câble", vol: "3×15" }] },

  { day: "SAM", label: "Full Power", salle: "haut", muscle: "Deadlift · Tractions · Kettlebell", exercises: [
    { id: "s1", name: "Soulevé de terre conventionnel",  sets: 5, reps: "3–5",    rest: 300, muscle: "Full body" },
    { id: "s2", name: "Hip thrust barre",                sets: 4, reps: "10–12",  rest: 150, muscle: "Fessiers" },
    { id: "s3", name: "Tractions lestées prise large",   sets: 5, reps: "4–6",    rest: 180, muscle: "Dos large" },
    { id: "s4", name: "Dips barres parallèles",          sets: 3, reps: "8–10",   rest: 120, muscle: "Triceps" },
    { id: "s5", name: "Kettlebell Swing unilatéral",     sets: 4, reps: "8/bras", rest: 0,   muscle: "Fessiers" },
    { id: "s6", name: "Turkish Get-Up",                  sets: 4, reps: "2/côté", rest: 120, muscle: "Stabilité" },
  ], abs: [{ id: "sa1", name: "Dragon flag", vol: "4×5–8" }, { id: "sa2", name: "Relevé jambes suspendu", vol: "3×12" }] },

  { day: "DIM", label: "Repos", salle: null, muscle: "Reset total", exercises: [], abs: [] },
];

const SESSION_TYPES = [
  "Corps entier", "Haut du corps", "Bas du corps",
  "Bras", "Poids de corps", "Kettlebell", "Cardio hybride", "Force pure",
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const todayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const fmtMSS = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const fmtDur = s => s >= 3600 ? `${Math.floor(s/3600)}h${String(Math.floor((s%3600)/60)).padStart(2,"0")}m` : `${Math.floor(s/60)}m${String(s%60).padStart(2,"0")}s`;

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .15, .30].forEach(d => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 1046;
      g.gain.setValueAtTime(.2, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .1);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .1);
    });
  } catch {}
}

// ─── LOCAL STORAGE FALLBACK ───────────────────────────────────────────────────
const LS = "ph_s11";
const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch { return {}; } };
const lsSet = d => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch {} };

// ─── HOOKS ───────────────────────────────────────────────────────────────────
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

function useCountdown(onDone) {
  const [sec, setSec] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const start = useCallback(s => {
    clearInterval(ref.current);
    setSec(s); setTotal(s); setRunning(true); setDone(false);
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

// ─── REST TIMER OVERLAY ───────────────────────────────────────────────────────
function RestOverlay({ timer, label }) {
  if (!timer.running && !timer.done && timer.sec === 0) return null;
  const pct = timer.total > 0 ? timer.sec / timer.total : 0;
  const R = 36, circ = 2 * Math.PI * R;
  const color = timer.done ? C.green : C.accent;
  return (
    <div style={{
      position: "fixed", bottom: 90, left: 16, right: 16, zIndex: 400,
      display: "flex", justifyContent: "center",
      animation: `slideUp ${T_DRAWER} ${EASE_DRAWER} both`,
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div style={{
        background: C.surface2, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 16,
        maxWidth: 420, width: "100%",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r={R} fill="none" stroke={C.border2} strokeWidth="5"/>
            <circle cx="36" cy="36" r={R} fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"
              style={{ transition: `stroke-dasharray .8s linear, stroke ${T_MED}` }}/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
            <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: timer.done ? C.green : C.ink, lineHeight: 1 }}>
              {timer.done ? "GO" : fmtMSS(timer.sec)}
            </span>
          </div>
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
            {timer.done ? "Repos terminé" : "Temps de repos"}
          </div>
          <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: timer.done ? C.green : C.ink80, marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {label}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {timer.running && (
              <button onClick={timer.stop} style={btnGhost("small")}>Passer</button>
            )}
            <button onClick={timer.reset} style={btnGhost("small")}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
function btnGhost(size = "default") {
  const pad = size === "small" ? "6px 14px" : "12px 20px";
  const fs = size === "small" ? 12 : 15;
  return {
    fontFamily: F, fontSize: fs, fontWeight: 600, padding: pad,
    borderRadius: 980, border: `1px solid ${C.border2}`,
    background: "transparent", color: C.ink48, cursor: "pointer",
    transition: `transform ${T_FAST} ${EASE_OUT}, opacity ${T_FAST}`,
    WebkitTapHighlightColor: "transparent",
  };
}
function btnPrimary(color = C.accent, size = "default") {
  const pad = size === "small" ? "6px 16px" : "14px 24px";
  const fs = size === "small" ? 13 : 17;
  return {
    fontFamily: F, fontSize: fs, fontWeight: 600, padding: pad,
    borderRadius: 980, border: "none",
    background: color, color: "#000", cursor: "pointer",
    transition: `transform ${T_FAST} ${EASE_OUT}, opacity ${T_FAST}`,
    WebkitTapHighlightColor: "transparent",
  };
}
function btnFull(color = C.surface3, textColor = C.ink) {
  return {
    fontFamily: F, fontSize: 17, fontWeight: 600, padding: "16px",
    borderRadius: 14, border: "none", background: color, color: textColor,
    cursor: "pointer", width: "100%",
    transition: `transform ${T_FAST} ${EASE_OUT}, opacity ${T_FAST}`,
    WebkitTapHighlightColor: "transparent",
  };
}

// Active press: scale(0.97) — Emil pattern
function Tap({ children, onTap, style, disabled }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => { setPressed(false); !disabled && onTap?.(); }}
      onPointerLeave={() => setPressed(false)}
      style={{ ...style, transform: pressed && !disabled ? "scale(0.97)" : "scale(1)", transition: `transform ${T_FAST} ${EASE_OUT}`, cursor: disabled ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}
    >
      {children}
    </div>
  );
}

// ─── EXERCISE ROW ─────────────────────────────────────────────────────────────
function ExRow({ ex, weight, onWeightChange, log, onLogSet, onStartRest, idx }) {
  const [open, setOpen] = useState(false);
  const sets = typeof ex.sets === "number" ? ex.sets : 0;
  const done = Array.from({ length: sets }, (_, i) => !!log[`${ex.id}_s${i}`]?.done);
  const completed = done.filter(Boolean).length;
  const allDone = sets > 0 && completed === sets;
  const kg = weight ?? baseKg(ex.name);
  const orm = calc1RM(kg, ex.reps);

  const handleSet = i => {
    const newDone = !done[i];
    onLogSet(`${ex.id}_s${i}`, { done: newDone, weight: kg, date: todayKey() });
    if (newDone && ex.rest > 0) onStartRest(ex.rest, ex.name);
  };

  const animDelay = `${idx * 40}ms`;

  return (
    <div style={{
      borderBottom: `1px solid ${C.border}`,
      animation: `fadeSlideIn 300ms ${EASE_OUT} ${animDelay} both`,
    }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>

      {/* Main row */}
      <Tap onTap={() => setOpen(o => !o)} style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 14 }}>
        {/* Completion ring */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          border: `2px solid ${allDone ? C.green : C.border2}`,
          background: allDone ? C.greenDim : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: `all ${T_MED} ${EASE_OUT}`,
        }}>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: allDone ? C.green : C.ink48 }}>
            {completed}/{sets}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: allDone ? C.ink48 : C.ink, letterSpacing: "-.01em", lineHeight: 1.2, marginBottom: 3, textDecoration: allDone ? "line-through" : "none", transition: `color ${T_MED}` }}>
            {ex.name}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink48 }}>{ex.sets}×{ex.reps}</span>
            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink24 }}>·</span>
            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink48 }}>{ex.muscle}</span>
            {orm && <><span style={{ color: C.ink24 }}>·</span><span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.accent }}>1RM ~{orm}kg</span></>}
          </div>
        </div>

        {/* Rest pill */}
        {ex.rest > 0 && (
          <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 980, background: C.surface3, color: C.ink48, flexShrink: 0 }}>
            {ex.rest >= 60 ? `${ex.rest / 60}′` : `${ex.rest}″`}
          </div>
        )}

        {/* Chevron */}
        <div style={{ color: C.ink24, fontSize: 12, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: `transform ${T_MED} ${EASE_OUT}` }}>▾</div>
      </Tap>

      {/* Set buttons — always visible when open=false stays compact; show below tap area */}
      <div style={{ paddingBottom: completed > 0 || sets <= 4 ? 14 : 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from({ length: sets }, (_, i) => (
            <Tap key={i} onTap={() => handleSet(i)} style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              border: `1.5px solid ${done[i] ? C.green : C.border2}`,
              background: done[i] ? C.greenDim : C.surface3,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: `all ${T_MED} ${EASE_OUT}`,
            }}>
              <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: done[i] ? C.green : C.ink48 }}>{i + 1}</span>
            </Tap>
          ))}
          {ex.rest > 0 && (
            <Tap onTap={() => onStartRest(ex.rest, ex.name)} style={{
              height: 44, padding: "0 14px", borderRadius: 12,
              border: `1.5px solid ${C.border2}`, background: "transparent",
              display: "flex", alignItems: "center",
              transition: `all ${T_FAST} ${EASE_OUT}`,
            }}>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.ink48 }}>Repos</span>
            </Tap>
          )}
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ paddingBottom: 20, animation: `fadeIn 200ms ${EASE_OUT} both` }}>
          {/* Weight */}
          <div style={{ background: C.surface2, borderRadius: 14, padding: "16px", marginBottom: 12 }}>
            <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>Charge de travail</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Tap onTap={() => onWeightChange(ex.id, Math.max(0, kg - 2.5))} style={{
                width: 48, height: 48, borderRadius: 12,
                border: `1.5px solid ${C.border2}`, background: C.surface3,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: F, fontSize: 22, fontWeight: 400, color: C.ink }}>−</span>
              </Tap>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontFamily: F, fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-.02em" }}>
                  {kg === 0 ? "BW" : `${kg}`}
                </span>
                {kg > 0 && <span style={{ fontFamily: F, fontSize: 20, fontWeight: 400, color: C.ink48 }}> kg</span>}
              </div>
              <Tap onTap={() => onWeightChange(ex.id, kg + 2.5)} style={{
                width: 48, height: 48, borderRadius: 12,
                border: `1.5px solid ${C.border2}`, background: C.surface3,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: F, fontSize: 22, fontWeight: 400, color: C.ink }}>+</span>
              </Tap>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FEEDBACK SHEET ───────────────────────────────────────────────────────────
function FeedbackSheet({ onClose, onSave }) {
  const [intensity, setIntensity] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");
  const IL = ["", "Très léger", "Léger", "Modéré", "Intense", "Maximum"];
  const EL = ["", "Épuisé", "Fatigué", "Normal", "Énergisé", "Au top"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}/>
      <div style={{
        position: "relative", background: C.surface, borderRadius: "24px 24px 0 0",
        padding: "32px 24px calc(40px + env(safe-area-inset-bottom))",
        maxWidth: 600, width: "100%",
        animation: `slideUp ${T_DRAWER} ${EASE_DRAWER} both`,
      }}>
        <div style={{ width: 36, height: 4, background: C.border2, borderRadius: 2, margin: "0 auto 28px" }}/>
        <div style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", marginBottom: 6 }}>Bilan séance</div>
        <div style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.ink48, marginBottom: 28, lineHeight: 1.47 }}>Comment s'est passée ta séance ?</div>

        {[
          { label: "Intensité", val: intensity, set: setIntensity, labels: IL },
          { label: "Énergie", val: energy, set: setEnergy, labels: EL },
        ].map(({ label, val, set, labels }) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink }}>{label}</span>
              <span style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink48 }}>{labels[val]}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(v => (
                <Tap key={v} onTap={() => set(v)} style={{
                  flex: 1, height: 48, borderRadius: 12,
                  border: `1.5px solid ${val === v ? C.accent : C.border2}`,
                  background: val === v ? C.accentDim : C.surface2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: `all ${T_FAST} ${EASE_OUT}`,
                }}>
                  <span style={{ fontFamily: F, fontSize: 17, fontWeight: val === v ? 700 : 400, color: val === v ? C.accent : C.ink48 }}>{v}</span>
                </Tap>
              ))}
            </div>
          </div>
        ))}

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes libres..."
          style={{ width: "100%", minHeight: 72, padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.border2}`, fontFamily: F, fontSize: 17, color: C.ink, background: C.surface2, resize: "none", outline: "none", marginBottom: 20, boxSizing: "border-box", lineHeight: 1.47, "::placeholder": { color: C.ink24 } }}/>

        <div style={{ display: "flex", gap: 10 }}>
          <Tap onTap={onClose} style={{ ...btnFull(C.surface2, C.ink48), borderRadius: 14 }}><span style={{ fontFamily: F, fontSize: 17, fontWeight: 600 }}>Annuler</span></Tap>
          <Tap onTap={() => onSave({ global: intensity, energy, notes })} style={{ ...btnFull(C.accent, "#000"), borderRadius: 14 }}><span style={{ fontFamily: F, fontSize: 17, fontWeight: 600 }}>Enregistrer</span></Tap>
        </div>
      </div>
    </div>
  );
}

// ─── AI REGEN SHEET ───────────────────────────────────────────────────────────
function RegenSheet({ onClose, onResult }) {
  const [type, setType] = useState(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!type && !custom.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: `Génère une séance fitness en JSON. Type: ${type || custom}. Réponds UNIQUEMENT en JSON valide: {"titre": string, "exercises": [{"id": string, "name": string, "sets": number, "reps": string, "rest": number, "muscle": string}], "abs": [{"id": string, "name": string, "vol": string}]}` }]
        })
      });
      const d = await res.json();
      const raw = (d.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
      onResult(JSON.parse(raw)); onClose();
    } catch { alert("Erreur génération. Réessaie."); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }}/>
      <div style={{ position: "relative", background: C.surface, borderRadius: "24px 24px 0 0", padding: "32px 24px calc(40px + env(safe-area-inset-bottom))", maxWidth: 600, width: "100%", animation: `slideUp ${T_DRAWER} ${EASE_DRAWER} both` }}>
        <div style={{ width: 36, height: 4, background: C.border2, borderRadius: 2, margin: "0 auto 28px" }}/>
        <div style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", marginBottom: 24 }}>Nouvelle séance</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {SESSION_TYPES.map(t => (
            <Tap key={t} onTap={() => setType(t === type ? null : t)} style={{
              padding: "14px 12px", borderRadius: 14, textAlign: "center",
              border: `1.5px solid ${type === t ? C.accent : C.border2}`,
              background: type === t ? C.accentDim : C.surface2,
              transition: `all ${T_FAST} ${EASE_OUT}`,
            }}>
              <span style={{ fontFamily: F, fontSize: 15, fontWeight: type === t ? 600 : 400, color: type === t ? C.accent : C.ink48 }}>{t}</span>
            </Tap>
          ))}
        </div>
        <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder="Ou décris librement ta séance..."
          style={{ width: "100%", minHeight: 56, padding: "12px 16px", borderRadius: 14, border: `1px solid ${C.border2}`, fontFamily: F, fontSize: 15, color: C.ink, background: C.surface2, resize: "none", outline: "none", marginBottom: 20, boxSizing: "border-box" }}/>
        <Tap onTap={generate} style={{ ...btnFull(loading || (!type && !custom.trim()) ? C.surface3 : C.accent, loading || (!type && !custom.trim()) ? C.ink24 : "#000"), borderRadius: 14, opacity: loading ? .6 : 1 }}>
          <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600 }}>{loading ? "Génération en cours…" : "Générer avec IA"}</span>
        </Tap>
      </div>
    </div>
  );
}

// ─── SESSION REPORT ───────────────────────────────────────────────────────────
function SessionReport({ session, onClose }) {
  if (!session) return null;
  const { totalKg = 0, totalSets = 0, duration = 0, exercises = [], date = "", dayLabel = "", score = 0, feedback } = session;

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 700, overflowY: "auto", fontFamily: F, animation: `fadeIn 200ms ${EASE_OUT} both` }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ padding: "60px 24px 40px", borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ position: "fixed", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, color: C.ink48, cursor: "pointer", fontFamily: F, fontSize: 14 }}>✕</button>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 12 }}>{date}</div>
          <div style={{ fontSize: 40, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: 16 }}>{dayLabel}</div>
          {score > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 980, border: `1px solid ${C.border2}`, background: C.surface2 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: C.accent }}>{score}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.ink48, letterSpacing: ".08em" }}>SCORE</span>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${C.border}` }}>
          {[
            { l: "Volume", v: totalKg > 0 ? `${(totalKg/1000).toFixed(1)}t` : "—" },
            { l: "Durée", v: duration > 0 ? fmtDur(duration) : "—" },
            { l: "Séries", v: `${totalSets}` },
          ].map(({ l, v }, i) => (
            <div key={l} style={{ padding: "24px 16px", borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{l}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: "-.01em" }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Exercises */}
        {exercises.length > 0 && (
          <div style={{ padding: "24px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Exercices</div>
            {exercises.filter(e => e.completedSets > 0).map((ex, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 2 }}>{ex.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 400, color: C.ink48 }}>{ex.completedSets} séries · {ex.muscle}</div>
                </div>
                {ex.weight > 0 && <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{ex.weight}kg</span>}
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div style={{ padding: "24px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              {[{ l: "Intensité", v: feedback.global }, { l: "Énergie", v: feedback.energy }].map(({ l, v }) => (
                <div key={l} style={{ flex: 1, background: C.surface2, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: C.ink }}>{v}/5</div>
                </div>
              ))}
            </div>
            {feedback.notes && <div style={{ fontSize: 15, fontWeight: 400, color: C.ink48, lineHeight: 1.6 }}>{feedback.notes}</div>}
          </div>
        )}

        <div style={{ padding: "0 24px 60px" }}>
          <Tap onTap={onClose} style={btnFull(C.surface2, C.ink)}><span style={{ fontFamily: F, fontSize: 17, fontWeight: 600 }}>Fermer</span></Tap>
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab({ sessions, onSelect }) {
  const [view, setView] = useState(new Date());
  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const off = first === 0 ? 6 : first - 1;
  const MN = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const DN = ["L","M","M","J","V","S","D"];
  const sessionDates = sessions.map(s => s.date);

  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      {/* Calendar */}
      <div style={{ background: C.surface, borderRadius: 20, padding: "20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Tap onTap={() => setView(new Date(y, m-1, 1))} style={{ width: 36, height: 36, borderRadius: 8, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F, fontSize: 16, color: C.ink48 }}>‹</span>
          </Tap>
          <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink }}>{MN[m]} {y}</span>
          <Tap onTap={() => setView(new Date(y, m+1, 1))} style={{ width: 36, height: 36, borderRadius: 8, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F, fontSize: 16, color: C.ink48 }}>›</span>
          </Tap>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {DN.map((d, i) => <div key={i} style={{ textAlign: "center", fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink24, paddingBottom: 8 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array.from({ length: off + days }, (_, i) => {
            if (i < off) return <div key={i}/>;
            const d = i - off + 1;
            const key = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const done = sessionDates.includes(key);
            const isToday = key === todayKey();
            return (
              <Tap key={i} onTap={() => { if (done) { const s = sessions.find(h => h.date === key); if (s) onSelect(s); }}}
                style={{ aspectRatio: "1", borderRadius: 8, background: done ? C.accent : isToday ? C.surface3 : "transparent", border: isToday && !done ? `1px solid ${C.border2}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: done || isToday ? 600 : 400, color: done ? "#000" : isToday ? C.ink : C.ink48 }}>{d}</span>
              </Tap>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Séances récentes</div>
      {sessions.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", fontFamily: F, fontSize: 17, color: C.ink48 }}>Aucune séance enregistrée.</div>
      )}
      {sessions.slice().reverse().map((s, i) => (
        <Tap key={i} onTap={() => onSelect(s)} style={{ background: C.surface, borderRadius: 16, padding: "18px", marginBottom: 10, display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink }}>{s.dayLabel || s.day}</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {s.score > 0 && <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: C.accent }}>{s.score}</span>}
              <span style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink48 }}>{s.date}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {s.totalKg > 0 && <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{s.totalKg.toLocaleString()}kg</span>}
            {s.duration > 0 && <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{fmtDur(s.duration)}</span>}
            {s.totalSets > 0 && <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{s.totalSets} séries</span>}
          </div>
        </Tap>
      ))}
    </div>
  );
}

// ─── STATS TAB ────────────────────────────────────────────────────────────────
function StatsTab({ sessions, weights }) {
  const totalSessions = sessions.length;
  const totalKg = sessions.reduce((a, s) => a + (s.totalKg || 0), 0);
  const avgScore = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.score || 0), 0) / sessions.length) : 0;
  const bestSession = sessions.reduce((b, s) => (s.score || 0) > (b?.score || 0) ? s : b, null);

  // PBs from weights
  const allEx = PROGRAM.flatMap(d => d.exercises || []);
  const pbs = Object.entries(weights).map(([id, kg]) => {
    const ex = allEx.find(e => e.id === id);
    if (!ex) return null;
    return { name: ex.name, kg, orm: calc1RM(kg, ex.reps), muscle: ex.muscle };
  }).filter(Boolean).sort((a, b) => (b.orm || 0) - (a.orm || 0));

  const MetricCard = ({ label, value, sub }) => (
    <div style={{ flex: 1, background: C.surface, borderRadius: 16, padding: "20px 16px" }}>
      <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: F, fontSize: 34, fontWeight: 700, color: C.ink, letterSpacing: "-.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: C.ink48, marginTop: 6 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <MetricCard label="Séances" value={totalSessions}/>
        <MetricCard label="Volume total" value={totalKg > 0 ? `${(totalKg/1000).toFixed(1)}t` : "—"}/>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <MetricCard label="Score moyen" value={avgScore || "—"}/>
        <MetricCard label="Meilleur" value={bestSession?.score || "—"} sub={bestSession?.dayLabel}/>
      </div>

      <div style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Personal Bests</div>
      {pbs.length === 0 ? (
        <div style={{ fontFamily: F, fontSize: 17, color: C.ink48, textAlign: "center", padding: "32px 0" }}>Aucun PB enregistré. Commence une séance.</div>
      ) : pbs.map((pb, i) => (
        <div key={i} style={{ background: C.surface, borderRadius: 16, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{pb.name}</div>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink48 }}>{pb.muscle}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: C.ink }}>{pb.kg === 0 ? "BW" : `${pb.kg}kg`}</div>
            {pb.orm && <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.accent }}>1RM ~{pb.orm}kg</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SETTINGS TAB ────────────────────────────────────────────────────────────
function SettingsTab({ onExport, onImport, onReset }) {
  const fileRef = useRef(null);
  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: C.surface, borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
        {[
          { label: "Exporter les données", sub: "Sauvegarde JSON locale", action: onExport },
          { label: "Importer les données", sub: "Restaurer depuis un fichier", action: () => fileRef.current?.click() },
        ].map(({ label, sub, action }, i) => (
          <Tap key={label} onTap={action} style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i === 0 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <div style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.ink }}>{label}</div>
              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink48, marginTop: 2 }}>{sub}</div>
            </div>
            <span style={{ fontFamily: F, fontSize: 17, color: C.accent }}>›</span>
          </Tap>
        ))}
      </div>
      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }}
        onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => { try { onImport(JSON.parse(ev.target.result)); } catch { alert("Fichier invalide."); } }; r.readAsText(f); }}}/>

      <div style={{ background: C.surface, borderRadius: 20, overflow: "hidden" }}>
        <Tap onTap={() => { if (window.confirm("Effacer toutes les données ?")) onReset(); }} style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.red }}>Effacer toutes les données</span>
          <span style={{ fontFamily: F, fontSize: 17, color: C.red }}>›</span>
        </Tap>
      </div>

      <div style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: C.ink24, textAlign: "center", marginTop: 32, lineHeight: 1.6 }}>
        PH App · S11 · Sprint 11{"\n"}Données stockées localement + Supabase
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function PHApp() {
  const [tab, setTab] = useState("seance");
  const [dayIdx, setDayIdx] = useState(todayIdx());
  const [log, setLog] = useState({});
  const [weights, setWeights] = useState({});
  const [sessions, setSessions] = useState([]);
  const [aiOverride, setAiOverride] = useState(null);
  const [streak, setStreak] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const [restLabel, setRestLabel] = useState("");
  const [sbReady, setSbReady] = useState(false);
  const clock = useStopwatch();
  const rest = useCountdown();

  // Load data — Supabase first, localStorage fallback
  useEffect(() => {
    const local = lsGet();
    if (local.log) setLog(local.log);
    if (local.weights) setWeights(local.weights);
    if (local.sessions) { setSessions(local.sessions); computeStreak(local.sessions); }

    if (sb) {
      Promise.all([
        sb.from("sessions").select("*").eq("user_id", USER_ID).order("date", { ascending: false }),
        sb.from("personal_bests").select("*").eq("user_id", USER_ID),
      ]).then(([{ data: sess }, { data: pbs }]) => {
        if (sess?.length) { setSessions(sess); computeStreak(sess); lsSet({ ...lsGet(), sessions: sess }); }
        if (pbs?.length) {
          const w = {};
          pbs.forEach(pb => { w[pb.exercise_id || pb.exercise_name] = pb.weight_kg; });
          setWeights(prev => ({ ...prev, ...w }));
        }
        setSbReady(true);
      }).catch(() => setSbReady(false));
    }
  }, []);

  function computeStreak(sess) {
    const dates = (sess || []).map(s => s.date);
    let s = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (dates.includes(d.toISOString().slice(0, 10))) s++; else break;
    }
    setStreak(s);
  }

  const persist = useCallback((updates) => {
    const current = lsGet();
    lsSet({ ...current, ...updates });
  }, []);

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

  const saveWeight = useCallback((id, val) => {
    setWeights(prev => { const next = { ...prev, [id]: val }; persist({ weights: next }); return next; });
  }, [persist]);

  const handleFeedbackSave = async (fb) => {
    const day = PROGRAM[dayIdx];
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
    const score = Math.round(Math.min(totalKg / 5000 * 40, 40) + Math.min(totalSets / 25 * 30, 30) + ((fb.global + fb.energy) / 10 * 30));
    const entry = { day: day.day, dayLabel: day.label, date: todayKey(), exercises: exercisesData, totalKg: Math.round(totalKg), totalSets, duration: clock.sec, score, feedback: fb, user_id: USER_ID };

    // Save to Supabase
    if (sb) {
      const { error } = await sb.from("sessions").upsert({ ...entry, week: "S24", session_type: day.label, completed: true, notes: fb.notes }, { onConflict: "user_id,date" });
      if (!error) {
        // Update streak in Supabase
        const { data: existing } = await sb.from("streaks").select("*").eq("user_id", USER_ID).single().catch(() => ({ data: null }));
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const cur = existing?.last_session_date === yesterday ? (existing.current_streak || 0) + 1 : 1;
        await sb.from("streaks").upsert({ user_id: USER_ID, current_streak: cur, longest_streak: Math.max(cur, existing?.longest_streak || 0), last_session_date: todayKey(), total_sessions: (existing?.total_sessions || 0) + 1, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
        // Save PBs
        for (const ex of exercisesData) {
          if (ex.weight > 0) {
            await sb.from("personal_bests").upsert({ user_id: USER_ID, exercise_name: ex.name, exercise_id: ex.id, weight_kg: ex.weight, reps: parseInt(String(exos.find(e => e.id === ex.id)?.reps).split("–")[0]) || 8, one_rm: calc1RM(ex.weight, exos.find(e => e.id === ex.id)?.reps || "8"), achieved_at: todayKey() }, { onConflict: "user_id,exercise_name" }).catch(() => {});
          }
        }
      }
    }

    setSessions(prev => { const next = [...prev.filter(s => s.date !== todayKey()), entry]; persist({ sessions: next }); computeStreak(next); return next; });
    setSessionActive(false); clock.reset(); setShowFeedback(false); setShowReport(entry);
  };

  const handleExport = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(lsGet(), null, 2)], { type: "application/json" })); a.download = `PH-backup-${todayKey()}.json`; a.click(); };
  const handleImport = d => { lsSet(d); if (d.log) setLog(d.log); if (d.weights) setWeights(d.weights); if (d.sessions) { setSessions(d.sessions); computeStreak(d.sessions); } alert("Restauré."); };
  const handleReset = () => { lsSet({}); setLog({}); setWeights({}); setSessions([]); setStreak(0); };

  const day = PROGRAM[dayIdx];
  const isRest = !day?.salle;
  const exos = (aiOverride?.exercises || day?.exercises || []);
  const absExos = aiOverride?.abs || day?.abs || [];

  const NAV = [
    { id: "seance", label: "Séance" },
    { id: "stats", label: "Stats" },
    { id: "history", label: "Historique" },
    { id: "settings", label: "Réglages" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", color: C.ink, fontFamily: F, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: ${C.bg}; }
        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp   { from { transform: translateY(32px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        textarea::placeholder { color: ${C.ink24}; }
        input::placeholder    { color: ${C.ink24}; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "14px 20px 12px", position: "sticky", top: 0, zIndex: 200, display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "calc(14px + env(safe-area-inset-top))" }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: C.ink, letterSpacing: "-.03em" }}>
            PH <span style={{ fontWeight: 300, color: C.ink48, fontSize: 16 }}>Programme Hybride</span>
          </div>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink24, letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }}>S24</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {sessionActive && (
            <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: C.red, letterSpacing: "-.01em" }}>{fmtDur(clock.sec)}</div>
          )}
          {streak > 0 && (
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.orange, padding: "4px 12px", borderRadius: 980, background: C.orangeDim }}>
              {streak}d
            </div>
          )}
          {sbReady && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }}/>}
        </div>
      </div>

      {/* DAY STRIP */}
      {tab === "seance" && (
        <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", overflowX: "auto", padding: "10px 16px", gap: 6, scrollbarWidth: "none" }}>
          {PROGRAM.map((d, i) => {
            const exList = d.exercises || [];
            const done = exList.filter(e => Array.from({ length: typeof e.sets === "number" ? e.sets : 0 }, (_, si) => si).every(si => log[`${e.id}_s${si}`]?.done)).length;
            const pct = exList.length ? done / exList.length : 0;
            const isSel = i === dayIdx, isToday = i === todayIdx();
            return (
              <Tap key={i} onTap={() => { setDayIdx(i); setAiOverride(null); }} style={{
                flexShrink: 0, minWidth: 50, padding: "10px 6px", textAlign: "center", borderRadius: 12,
                background: isSel ? C.surface2 : "transparent",
                border: `1px solid ${isSel ? C.border2 : "transparent"}`,
              }}>
                <div style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: isSel ? C.ink80 : C.ink24, letterSpacing: ".06em", marginBottom: 4 }}>{d.day}</div>
                {isToday && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime, margin: "0 auto 4px" }}/>}
                {d.salle && pct > 0 && (
                  <div style={{ width: "70%", height: 2, background: C.border2, borderRadius: 1, margin: "0 auto" }}>
                    <div style={{ width: `${pct * 100}%`, height: 2, background: C.accent, borderRadius: 1, transition: `width ${T_MED} ${EASE_OUT}` }}/>
                  </div>
                )}
              </Tap>
            );
          })}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ paddingBottom: 80 }}>

        {/* SÉANCE */}
        {tab === "seance" && (
          <div style={{ padding: "16px 20px 0", maxWidth: 600, margin: "0 auto" }}>
            {isRest ? (
              <div style={{ textAlign: "center", padding: "80px 0", animation: `fadeIn 200ms ${EASE_OUT}` }}>
                <div style={{ fontFamily: F, fontSize: 34, fontWeight: 600, color: C.ink48, letterSpacing: "-.02em", marginBottom: 16 }}>Récupération</div>
                <div style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.ink24, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 28px" }}>
                  {dayIdx === 3 ? "Récupération musculaire active. Tes fibres consolident les adaptations." : "Reset complet. Synthèse protéique et sommeil prioritaires."}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  {["10km marche", "8h sommeil", "2g prot/kg"].map(r => (
                    <span key={r} style={{ fontFamily: F, fontSize: 14, fontWeight: 400, padding: "7px 16px", border: `1px solid ${C.border2}`, borderRadius: 980, color: C.ink48 }}>{r}</span>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ marginBottom: 20, animation: `fadeIn 200ms ${EASE_OUT}` }}>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink24, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 8 }}>
                    {day.day} · S24 · {day.salle === "haut" ? "Salle Haute" : "Salle Basse"}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 34, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: 8 }}>
                    {aiOverride?.titre || day.label}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.ink48 }}>{day.muscle}</div>
                </div>

                {/* START / END button — the ONE big action */}
                {!sessionActive ? (
                  <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                    <Tap onTap={() => { setSessionActive(true); clock.start(); }} style={{ flex: 1, padding: "16px", borderRadius: 14, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: "#000" }}>Démarrer</span>
                    </Tap>
                    <Tap onTap={() => setShowRegen(true)} style={{ padding: "16px 20px", borderRadius: 14, border: `1px solid ${C.border2}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: C.ink48 }}>IA</span>
                    </Tap>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                    <div style={{ flex: 1, padding: "14px 16px", borderRadius: 14, background: C.redDim, border: `1px solid ${C.red}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: C.red }}>{fmtDur(clock.sec)}</span>
                    </div>
                    <Tap onTap={() => { clock.stop(); setShowFeedback(true); }} style={{ flex: 2, padding: "14px", borderRadius: 14, background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink80 }}>Terminer</span>
                    </Tap>
                    <Tap onTap={() => setShowRegen(true)} style={{ padding: "14px 20px", borderRadius: 14, border: `1px solid ${C.border2}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: C.ink48 }}>IA</span>
                    </Tap>
                  </div>
                )}

                {/* Warmup note */}
                <div style={{ borderLeft: `2px solid ${C.border2}`, paddingLeft: 16, marginBottom: 28 }}>
                  <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink24, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Échauffement · 8 min</div>
                  <div style={{ fontFamily: F, fontSize: 14, fontWeight: 400, color: C.ink48, lineHeight: 1.7 }}>
                    {day.salle === "haut"
                      ? "Rotations épaules · Wall slide · Push-up to downdog · Mobilité thoracique"
                      : "Corde à sauter 3min · Hip circle · Leg swing · Rameur 3min"}
                  </div>
                </div>

                {/* Exercises */}
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {exos.map((ex, i) => (
                    <ExRow key={ex.id} ex={ex} idx={i}
                      weight={weights[ex.id] ?? baseKg(ex.name)}
                      onWeightChange={saveWeight}
                      log={log}
                      onLogSet={saveLog}
                      onStartRest={(s, n) => { setRestLabel(n); rest.start(s); }}
                    />
                  ))}
                </div>

                {/* Abs */}
                {absExos.length > 0 && (
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink24, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Abdominaux</div>
                    {absExos.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.ink }}>{a.name}</span>
                        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: C.ink48 }}>{a.vol}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* End CTA */}
                {!sessionActive && (
                  <Tap onTap={() => setShowFeedback(true)} style={{ marginTop: 32, marginBottom: 16, padding: "16px", borderRadius: 14, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink48 }}>Rapport de séance</span>
                  </Tap>
                )}
              </>
            )}
          </div>
        )}

        {tab === "stats" && <StatsTab sessions={sessions} weights={weights}/>}
        {tab === "history" && <HistoryTab sessions={sessions} onSelect={setShowReport}/>}
        {tab === "settings" && <SettingsTab onExport={handleExport} onImport={handleImport} onReset={handleReset}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300, background: `rgba(0,0,0,.88)`, borderTop: `1px solid ${C.border}`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map(({ id, label }) => (
          <Tap key={id} onTap={() => setTab(id)} style={{ flex: 1, padding: "10px 4px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: 20, height: 2, borderRadius: 1, background: tab === id ? C.accent : "transparent", marginBottom: 4, transition: `background ${T_MED}` }}/>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: tab === id ? 600 : 400, color: tab === id ? C.ink : C.ink48, letterSpacing: ".02em", transition: `color ${T_MED}` }}>{label}</span>
          </Tap>
        ))}
      </div>

      {/* OVERLAYS */}
      <RestOverlay timer={rest} label={restLabel}/>
      {showFeedback && <FeedbackSheet onClose={() => setShowFeedback(false)} onSave={handleFeedbackSave}/>}
      {showRegen && <RegenSheet onClose={() => setShowRegen(false)} onResult={o => { setAiOverride(o); setShowRegen(false); }}/>}
      {showReport && <SessionReport session={showReport} onClose={() => setShowReport(null)}/>}
    </div>
  );
}
