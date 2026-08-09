// MOTEUR V5 — la semaine est decidee avant les exercices.
// Un libelle musculaire est une promesse de programmation, jamais une deduction
// faite apres coup a partir d'un tirage d'exercices.
import { DB } from "./catalog.js";
import { HEROES, heroFits } from "./heroes.js";
import { metaOf } from "./classify.js";

const find = (id) => DB.find((ex) => ex.id === id) || null;
const has = (ex, equipment) => ex && (ex.eq === "bw" || !equipment.length || equipment.includes(ex.eq));
const firstAvailable = (ids, equipment) => ids.map(find).find((ex) => has(ex, equipment)) || null;
const round = (eq, kg) => {
  if (!(kg > 0)) return 0;
  if (eq === "kb") return [6, 8, 10, 12, 16, 20, 24, 32].reduce((best, n) => Math.abs(n - kg) < Math.abs(best - kg) ? n : best, 6);
  if (eq === "db") return Math.max(2, Math.round(kg / 2) * 2);
  return Math.max(2.5, Math.round(kg / 2.5) * 2.5);
};

const prescribed = (ex, sets, reps, role, ctx, intensity = 1) => {
  if (!ex) return null;
  const perf = ctx.perf && ctx.perf[ex.id];
  const rm = ctx.rms && ctx.rms[ex.id];
  let kg = ex.kg || 0;
  if (ex.eq !== "bw" && kg > 0) {
    if (perf && perf.kg > 0) kg = perf.kg * (Number(perf.rpe) <= 7 ? 1.025 : Number(perf.rpe) >= 10 ? .9 : 1);
    else if (rm > 0) kg = rm * intensity;
    else kg *= ctx.scale || 1;
    kg = round(ex.eq, kg * (ctx.deload ? .85 : 1));
  }
  return { ...ex, kg, sets, reps: String(reps), rest: role === "pillar" ? 180 : 75, role, v5: true };
};

const strengthDay = (kind, ctx, week) => {
  const equipment = ctx.equipment || [];
  const upper = kind === "upper";
  const spec = upper ? {
    label: "Force · Pectoraux, Dos & Bras",
    muscle: "Développé couché · Dos · Biceps · Triceps",
    main: ["bb01", "x012", "db01", "mc06"],
    rows: [["bw01", "mc01"], ["bb06", "x018", "db06", "mc02"], ["db03", "bb08", "x021"], ["mc12", "bb10", "db13"]],
  } : {
    label: "Force · Jambes & Chaîne postérieure",
    muscle: "Quadriceps · Ischios · Fessiers · Mollets",
    main: week % 2 ? ["bb04", "x005", "bb07"] : ["bb03", "x001", "bb09"],
    rows: [["bb07", "db10", "mc05"], ["mc04", "db11", "bb16"], ["mc08"], ["bb13", "db01", "mc06"]],
  };
  const work = [];
  const main = firstAvailable(spec.main, equipment);
  if (main) work.push(prescribed(main, 5, upper ? 4 : (week % 2 ? 3 : 5), "pillar", ctx, upper ? .82 : .84));
  spec.rows.forEach((ids, i) => {
    const ex = firstAvailable(ids, equipment);
    if (ex) work.push(prescribed(ex, upper && i < 2 ? 4 : 3, i < 2 ? 8 : 10, "accessory", ctx, .7));
  });
  // Le rappel couche est volontaire : deux expositions hebdomadaires, une lourde,
  // une de volume. Il ne change pas l'identite de la seance jambes.
  if (!upper && work.length < 6) {
    const bench = firstAvailable(["bb01", "x012", "db01", "mc06"], equipment);
    if (bench) work.push(prescribed(bench, 3, 8, "accessory", ctx, .68));
  }
  return { label: spec.label, short: upper ? "FOR · HAUT" : "FOR · BAS", muscle: spec.muscle,
    salle: "full", exercises: work.filter(Boolean), abs: [], recommendedMode: "classique",
    badge: upper ? "Développé couché" : "Squat / hinge", archetype: upper ? "strength_upper" : "strength_lower",
    phase: ctx.deload ? "decharge" : "construction", v5: true };
};

const kbDay = (variant, ctx) => {
  const equipment = ctx.equipment || [];
  const ids = variant === "power" ? ["kb01", "kb03", "kb08", "kb10"] : ["kb01", "kb04", "kb08", "kb11"];
  const moves = ids.map(find).filter((ex) => has(ex, equipment)).map((ex, i) =>
    prescribed(ex, 1, variant === "power" ? [12, 6, 8, "30m"][i] : [15, 6, 10, 10][i], "density", ctx, .65));
  const kind = variant === "power" ? "emom" : "amrap";
  const durationMin = variant === "power" ? 20 : 18;
  return {
    label: variant === "power" ? "Kettlebell · Puissance-endurance" : "Kettlebell · Capacité de travail",
    short: "KB", muscle: "Kettlebell uniquement", salle: "full", exercises: moves,
    abs: [], recommendedMode: kind, metcon: true, totalMin: durationMin, timeCapMin: durationMin,
    emomMinutes: durationMin, badge: kind === "emom" ? "EMOM" : "AMRAP", archetype: "kettlebell", v5: true,
    blocks: [{ label: kind === "emom" ? "EMOM" : "AMRAP", kind, durationMin,
      rounds: kind === "emom" ? Math.floor(durationMin / Math.max(1, moves.length)) : 0, exercises: moves }],
  };
};

const heroDay = (ctx, week) => {
  const equipment = ctx.equipment || [];
  const pool = HEROES.filter((h) => heroFits(h, equipment) && h.cap <= 45 && (h.kind === "amrap" || h.kind === "rounds"));
  const hero = pool.length ? pool[week % pool.length] : null;
  if (!hero) return kbDay("capacity", ctx);
  const exercises = hero.moves.map((m, i) => ({ id: `hero_${hero.id}_${i}`, n: m.n, m: "Full body", eq: "bw", kg: m.kg || 0,
    sets: 1, reps: String(m.reps), rest: 0, role: "density", v5: true, blockIdx: 0 }));
  const label = hero.kind === "amrap" ? `AMRAP ${hero.cap}` : `${hero.rounds} tours`;
  return { label: `Hero · ${hero.name}`, short: "HERO", muscle: hero.tribute, salle: "full", exercises, abs: [],
    recommendedMode: "amrap", metcon: true, totalMin: hero.cap, timeCapMin: hero.cap, emomMinutes: hero.cap,
    badge: label, hero: hero.id, heroName: hero.name, archetype: "hero", v5: true,
    blocks: [{ label, kind: "amrap", durationMin: hero.cap, rounds: hero.rounds || 0, exercises }] };
};

const aerobicDay = (ctx) => {
  const equipment = ctx.equipment || [];
  const ex = firstAvailable(["cd02", "cd03", "cd04"], equipment);
  const work = ex ? [prescribed(ex, 1, "40 min", "aerobic", ctx, .5)] : [];
  return { label: "Endurance · Base aérobie", short: "END · Z2", muscle: "Effort continu facile · respiration contrôlée",
    salle: "full", exercises: work, abs: [], recommendedMode: "classique", badge: "Zone 2", archetype: "aerobic", v5: true };
};

// La fréquence actuelle est 5. Les fréquences inférieures conservent les priorités,
// les fréquences élevées obtiennent une seconde séance KB, jamais des séries droites.
export const buildV5Program = (ctx = {}) => {
  const frequency = Math.max(2, Math.min(7, Number(ctx.frequency) || 5));
  const total = Number(ctx.total) || 60;
  const weekly = frequency >= 6
    ? ["upper", "kb_power", "hero", "lower", "aerobic", "kb_capacity"]
    : frequency === 5 ? ["upper", "kb_power", "hero", "lower", "aerobic"]
    : ["upper", "hero", "lower", "aerobic"].slice(0, frequency);
  return Array.from({ length: total }, (_, index) => {
    const week = Math.floor(index / weekly.length);
    const step = weekly[index % weekly.length];
    const deload = week % 4 === 3;
    const local = { ...ctx, deload };
    if (step === "upper") return strengthDay("upper", local, week);
    if (step === "lower") return strengthDay("lower", local, week);
    if (step === "kb_power") return kbDay("power", local);
    if (step === "kb_capacity") return kbDay("capacity", local);
    if (step === "hero") return heroDay(local, week);
    return aerobicDay(local);
  });
};

const CACHE = new Map();
export const v5Session = (index, ctx = {}) => {
  const key = JSON.stringify({ frequency: ctx.frequency || 5, equipment: ctx.equipment || [], total: ctx.total || 60,
    rms: ctx.rms || {}, perf: ctx.perf || {}, excluded: ctx.excluded || [] });
  let program = CACHE.get(key);
  if (!program) { program = buildV5Program(ctx); CACHE.set(key, program); }
  return program[Math.max(0, index) % program.length] || null;
};
