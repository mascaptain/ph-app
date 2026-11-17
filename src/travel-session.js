// Séance « En voyage » : la séance prévue par le programme, refaite au poids du corps.
//
// Elle garde l'INTENTION du jour (force haut, force jambes, kettlebell, conditionnement,
// Hero) et sa STRUCTURE (séries classiques, ou blocs EMOM/AMRAP aux mêmes durées), pour
// que la semaine reste cohérente. Seul le matériel change.
//   intérieur  : sans bruit — aucun saut, aucune course, aucun burpee (hôtel, voisins)
//   extérieur  : sauts, sprints et course autorisés ; une barre de parc pour tirer
import { DB } from "./catalog.js";

const byId = new Map(DB.map((e) => [e.id, e]));
// Mouvements libres absents du catalogue : identifiants stables, poids du corps.
const FREE = {
  t_rlunge: { n: "Fentes arrière alternées", m: "Quads · Fessiers", reps: "12" },
  t_tempo_sq: { n: "Squat tempo 3-1-1", m: "Quads · Fessiers", reps: "15" },
  t_towel_row: { n: "Rowing serviette (porte fermée)", m: "Dos", reps: "12" },
  t_chair_dip: { n: "Dips sur chaise", m: "Triceps", reps: "12" },
  t_good_morning: { n: "Good morning une jambe", m: "Ischios", reps: "10" },
  t_inchworm: { n: "Inchworm", m: "Full body", reps: "8" },
  t_shadow: { n: "Shadow boxing", m: "Cardio", reps: "40s" },
  t_run: { n: "Course", m: "Cardio", reps: "200m" },
};
const ex = (id) => {
  const c = byId.get(id);
  if (c) return { id: c.id, n: c.n, m: c.m, reps: c.reps };
  const f = FREE[id];
  return f ? { id, ...f } : null;
};

// Choix par intention et par lieu. Chaque emplacement liste des options : la position
// dans le programme les fait tourner, deux voyages de suite ne donnent pas la même séance.
const PLANS = {
  indoor: {
    upper: [["x081", "x080", "bw06"], ["t_towel_row", "bw41", "x105"], ["x083", "bw24", "x160"], ["x079", "bw40", "t_chair_dip"], ["bw43", "x160"]],
    lower: [["x089", "x088", "x185"], ["x094", "bw37", "x093"], ["x146", "t_rlunge"], ["x186", "x184"], ["x188", "x187"]],
    metcon: ["x078", "t_tempo_sq", "x104", "bw43", "t_rlunge", "x099", "x093", "x144", "x146", "t_shadow", "bw32", "t_inchworm"],
  },
  outdoor: {
    upper: [["bw01", "x072", "x073"], ["x077", "x081"], ["x080", "x083"], ["x087", "x079"], ["bw43", "x160"]],
    lower: [["x089", "x088"], ["bw33", "x091"], ["x180", "bw38"], ["x094", "bw37"], ["x175", "x187"]],
    metcon: ["x108", "x115", "x090", "x078", "bw33", "t_run", "x104", "x180", "bw01", "x144", "bw38", "x175"],
  },
};
export const TRAVEL_LABEL = { indoor: "intérieur · sans bruit", outdoor: "extérieur" };

const pick = (opts, seed) => ex(opts[((seed % opts.length) + opts.length) % opts.length]);
const kind = (day) => {
  const a = day && day.archetype;
  if (a === "strength_upper") return "upper";
  if (a === "strength_lower") return "lower";
  if (a === "kettlebell" || a === "conditioning" || a === "hero" || (day && day.metcon)) return "metcon";
  return /haut|upper/i.test(day && day.label || "") ? "upper" : /jambe|lower|bas/i.test(day && day.label || "") ? "lower" : "metcon";
};
const bw = (e, extra) => ({ ...e, eq: "bw", kg: 0, v5: true, travel: true, ...extra });

export function travelDay(day, place = "indoor", seed = 0) {
  if (!day || !day.salle) return day;
  const plan = PLANS[place] || PLANS.indoor;
  const k = kind(day);
  const base = {
    ...day, travel: place, v5: true, metcon: k === "metcon",
    label: `${day.label} · voyage`, muscle: `Poids du corps · ${TRAVEL_LABEL[place] || TRAVEL_LABEL.indoor}`,
    badge: `En voyage · ${place === "outdoor" ? "extérieur" : "intérieur"}`, short: "VOYAGE",
  };
  if (k !== "metcon") {
    // Force : même nombre d'exercices et de séries, au poids du corps. Les reps montent
    // (une pompe pèse moins qu'un développé) et le repos baisse.
    const slots = plan[k];
    const n = Math.max(4, Math.min(slots.length, (day.exercises || []).length || slots.length));
    const exercises = slots.slice(0, n).map((opts, i) => {
      const e = pick(opts, seed + i);
      return bw(e, { sets: i < 2 ? 4 : 3, rest: i < 2 ? 75 : 60, role: i < 2 ? "pillar" : "accessory" });
    });
    return { ...base, recommendedMode: "classique", mode: "classique", blocks: undefined, exercises };
  }
  // Métabolique : mêmes blocs, mêmes formats et durées ; les mouvements tournent dans
  // la liste du lieu.
  const pool = plan.metcon;
  const srcBlocks = Array.isArray(day.blocks) && day.blocks.length ? day.blocks
    : [{ label: "Bloc 1", kind: "amrap", execution: "manual_rounds", durationMin: 15, cadenceSec: 0, exercises: [{}, {}, {}] }];
  let cursor = seed;
  const blocks = srcBlocks.map((b, bi) => {
    const size = Math.max(2, Math.min(5, (b.exercises || []).length || 3));
    const exercises = Array.from({ length: size }, (_, j) => {
      const e = ex(pool[(cursor++) % pool.length]);
      return bw(e, { id: `travel_${e.id}_${bi}_${j}`, baseId: e.id, sets: 1, rest: 0, role: "density", blockIdx: bi });
    });
    const emom = b.kind === "emom";
    const durationMin = emom ? Math.ceil((Number(b.durationMin) || 12) / size) * size : (Number(b.durationMin) || 15);
    return {
      label: `Bloc ${bi + 1} · ${emom ? "EMOM" : "AMRAP"} poids du corps`, kind: emom ? "emom" : "amrap",
      execution: emom ? "minute_stations" : "manual_rounds", cadenceSec: emom ? 60 : 0,
      durationMin, rounds: emom ? durationMin / size : 0, exercises,
    };
  });
  const workMin = blocks.reduce((s, b) => s + b.durationMin, 0);
  return {
    ...base, hero: undefined, heroName: undefined, archetype: day.archetype,
    recommendedMode: blocks[0].kind, mode: blocks[0].kind, blocks,
    exercises: blocks.flatMap((b) => b.exercises),
    timeCapMin: workMin, emomMinutes: workMin, totalMin: workMin + (day.warmupMin || 5) + (day.coreMin || 6),
  };
}
