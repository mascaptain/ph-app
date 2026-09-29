// Charges des séances composées et des Hero, calculées depuis TA force.
//
// Une séance saisie à la main (« 40 thrusters ») ne porte aucune charge, et un
// Hero porte la charge de référence CrossFit (43 kg au thruster), identique pour
// tout le monde. Ici on relie chaque mouvement à une référence du catalogue, puis :
//   1. ta dernière performance sur cet exercice, si elle existe ;
//   2. sinon ton rapport de force sur le même schéma (squat, charnière, poussée…)
//      tiré de tes 1RM estimés ;
//   3. sinon ton gabarit (poids, niveau).
// La charge est ensuite convertie au nombre de répétitions demandé (Epley) : 5
// thrusters et 40 thrusters ne se font pas avec le même poids.
import { DB } from "./catalog.js";
import { noAccent, patternOf } from "./classify.js";

// Mouvement reconnu → exercice du catalogue, par ordre de préférence de matériel.
// Quand le catalogue n'a pas l'exercice, une référence prudente est donnée
// directement (charge de travail pour un gabarit moyen, à N répétitions).
const REFS = [
  [/burpee.*snatch/, [{ eq: "db", kg: 12, reps: 10, pattern: "hinge" }]],
  [/burpee|jump(ing)? ?lunge|fente.*saut|jump|pompe|push.?up|press.?up|knee to elbow|traction|pull.?up|chin|dips|mountain|jack|sit.?up|crunch|gainage|planche|course|rameur|velo|bike|corde|double.?under|box ?jump/, "bw"],
  [/wall.?ball/, [{ eq: "bw", kg: 9, reps: 20, pattern: "squat", fixed: true }]],
  [/arnold/, ["x040", "db09"]],
  [/upright|menton/, [{ eq: "db", kg: 10, reps: 10, pattern: "push_v" }]],
  [/gorilla/, [{ eq: "kb", kg: 20, reps: 10, pattern: "pull_h" }]],
  [/renegade/, ["x053"]],
  [/bent.?over|buste penche|rowing|row\b|rows\b/, ["x046", "x018", "kb11"]],
  [/\brdl\b|roumain|romanian|jambes tendues/, ["x035", "x007"]],
  [/souleve de terre|deadlift/, ["x007", "x035"]],
  [/front squat/, ["x060", "x002"]],
  [/thruster/, ["x054", "x027"]],
  [/push press/, ["kb05", "x017"]],
  [/snatch|arrache/, ["x062", "x025"]],
  [/clean/, [{ eq: "db", kg: 14, reps: 10, pattern: "hinge" }, "x023", "x059"]],
  [/swing/, ["kb01"]],
  [/lunge|fente/, ["x031", "x069"]],
  [/goblet|gobelet/, ["x030", "kb08"]],
  [/squat/, ["x030", "x001"]],
  [/developpe militaire|overhead press|shoulder press|alt(ernate)? press|\bpress\b/, ["db14", "x016"]],
  [/developpe couche|bench/, ["bb13"]],
  [/curl/, [{ eq: "db", kg: 12, reps: 10, pattern: "arm_pull" }]],
];
const byId = (id) => DB.find((e) => e.id === id) || null;

// Référence du mouvement, en respectant le matériel déclaré quand c'est possible.
export function loadRef(name, equipment = []) {
  const n = noAccent(name);
  for (const [re, target] of REFS) {
    if (!re.test(n)) continue;
    if (target === "bw") return { bw: true };
    const refs = target.map((t) => (typeof t === "string" ? (() => {
      const e = byId(t); return e ? { id: e.id, eq: e.eq, kg: e.kg, reps: parseInt(e.reps, 10) || 10, pattern: patternOf(e) } : null;
    })() : t)).filter(Boolean);
    const owned = refs.find((r) => !equipment.length || equipment.includes(r.eq));
    return owned || refs[0] || null;
  }
  return null;
}

const KB = [6, 8, 10, 12, 16, 20, 24, 32];
export const snapKg = (eq, kg) => {
  if (!(kg > 0)) return 0;
  if (eq === "kb") return KB.reduce((b, w) => (Math.abs(w - kg) < Math.abs(b - kg) ? w : b), KB[0]);
  if (eq === "db") return Math.max(2, Math.round(kg / 2) * 2);
  return Math.max(2.5, Math.round(kg / 2.5) * 2.5);
};
const repFactor = (from, to) => (1 + from / 30) / (1 + to / 30);

// Charge estimée d'un mouvement. `metcon` : enchaîné sous fatigue, 20 % de moins.
// Renvoie {kg, eq, bw} — bw = poids du corps, rien à charger.
export function estimateLoad({ name, quantity, unit = "reps" }, ctx = {}, metcon = true) {
  const ref = loadRef(name, ctx.equipment || []);
  if (!ref) return null;
  if (ref.bw) return { kg: 0, bw: true };
  if (ref.fixed) return { kg: ref.kg, eq: ref.eq, fixed: true };
  const reps = unit === "reps" && Number(quantity) > 0 ? Math.min(60, Number(quantity)) : ref.reps;
  const perf = ref.id && ctx.perf && ctx.perf[ref.id];
  let kg;
  if (perf && perf.kg > 0) {
    // Ta dernière série réelle sur cet exercice, ramenée au nombre de reps voulu.
    kg = perf.kg * repFactor(Number(perf.reps) > 0 ? Number(perf.reps) : ref.reps, reps);
  } else {
    const factor = (ctx.strength && ctx.strength[ref.pattern]) || ctx.scale || 1;
    kg = ref.kg * factor * repFactor(ref.reps, reps);
  }
  if (metcon) kg *= 0.8;
  return { kg: snapKg(ref.eq, kg), eq: ref.eq, auto: true };
}

// Un Hero prescrit la charge de référence CrossFit. On la ramène à ta force sur le
// schéma du mouvement, sans jamais dépasser la référence. Balles et gilets gardent
// leur poids : ils ne se « scalent » pas au kilo près.
export function heroLoad(move, ctx = {}) {
  const rx = Number(move && move.kg) || 0;
  if (!(rx > 0) || /wall.?ball|balle|gilet|vest|sac|sandbag/i.test(noAccent(move.n))) return rx;
  const pattern = patternOf({ n: move.n });
  const factor = (ctx.strength && ctx.strength[pattern]) || ctx.scale || 1;
  const n = noAccent(move.n);
  const eq = /halt|dumbbell|\bdb\b/.test(n) ? "db" : /kettlebell|\bkb\b|swing|goblet|turkish/.test(n) ? "kb" : "bar";
  // L'arrondi au matériel ne doit jamais faire dépasser la référence.
  const kg = snapKg(eq, Math.min(rx, rx * factor));
  return kg > rx ? rx : kg;
}
