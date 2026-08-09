// MOTEUR V5 — la semaine est decidee avant les exercices.
// Un libelle musculaire est une promesse de programmation, jamais une deduction
// faite apres coup a partir d'un tirage d'exercices.
import { DB } from "./catalog.js";
import { HEROES, heroFits } from "./heroes.js";
import { metaOf } from "./classify.js";

const find = (id) => DB.find((ex) => ex.id === id) || null;
const INJURY_RULES = {
  "épaule": /couché|bench|press|développé|traction|tirage vertical|dips|élévation|halo|snatch/i,
  coude: /curl|traction|tirage|row|press|développé|dips|triceps/i,
  poignet: /barre|haltère|kettlebell|traction|pompe|push-up|carry/i,
  dos: /squat|deadlift|soulevé|rowing|row|rameur|swing|clean|hinge/i,
  hanche: /squat|fente|deadlift|soulevé|swing|clean|rameur|vélo/i,
  genou: /squat|fente|step|jump|rameur|vélo|course/i,
  cheville: /jump|sprint|course|corde|fente|step/i,
};
const isSafe = (ex, zones = []) => ex && !zones.some((zone) => INJURY_RULES[zone] && INJURY_RULES[zone].test(ex.n));
const has = (ex, equipment, zones, excluded = []) => ex && !excluded.includes(ex.id)
  && (ex.eq === "bw" || !equipment.length || equipment.includes(ex.eq)) && isSafe(ex, zones);
const firstAvailable = (ids, equipment, zones = [], excluded = []) => ids.map(find).find((ex) => has(ex, equipment, zones, excluded)) || null;
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
  const equipment = ctx.equipment || [], zones = ctx.injuryZones || [], excluded = ctx.excluded || [];
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
    rows: [["bb07", "db10", "mc05"], ["mc04", "db11", "bb16"], ["mc08", "mc07", "bw12"]],
  };
  const work = [];
  const main = firstAvailable(spec.main, equipment, zones, excluded);
  if (main) work.push(prescribed(main, 5, upper ? 4 : (week % 2 ? 3 : 5), "pillar", ctx, upper ? .82 : .84));
  spec.rows.forEach((ids, i) => {
    const ex = firstAvailable(ids, equipment, zones, excluded);
    if (ex) work.push(prescribed(ex, upper && i < 2 ? 4 : 3, i < 2 ? 8 : 10, "accessory", ctx, .7));
  });
  // Une séance jambes reste jambes : aucun rappel de bench, de pecs ou de bras.
  // On complète uniquement avec une quatrième exposition bas du corps.
  if (!upper && work.length < 5) {
    const legs = firstAvailable(["mc07", "mc08", "db11", "mc04"], equipment, zones, excluded);
    if (legs) work.push(prescribed(legs, 3, 12, "accessory", ctx, .64));
  }
  return { label: spec.label, short: upper ? "FOR · HAUT" : "FOR · BAS", muscle: spec.muscle,
    salle: "full", exercises: work.filter(Boolean), abs: [], recommendedMode: "classique",
    badge: upper ? "Développé couché" : "Squat / hinge", archetype: upper ? "strength_upper" : "strength_lower",
    phase: ctx.deload ? "decharge" : "construction", v5: true };
};

const kbDay = (variant, ctx) => {
  const equipment = ctx.equipment || [], zones = ctx.injuryZones || [], excluded = ctx.excluded || [];
  const build = (ids, reps) => ids.map(find).filter((ex) => has(ex, equipment, zones, excluded))
    .map((ex, i) => prescribed(ex, 1, reps[i], "density", ctx, .65));
  // Deux intentions, deux blocs. Une séance KB n'est jamais un unique EMOM
  // uniforme : on construit d'abord la qualité technique, puis la capacité à
  // répéter les gestes sous fatigue. Les six mouvements sont tous à la cloche.
  const technical = variant === "power"
    ? build(["kb03", "kb08", "kb05"], [6, 8, 6])
    : build(["kb01", "kb04", "kb08"], [12, 6, 10]);
  const capacity = variant === "power"
    ? build(["kb01", "kb11", "kb10"], [15, 10, "30m"])
    : build(["kb12", "kb11", "kb10"], [12, 10, "30m"]);
  const blocks = variant === "power"
    ? [{ label: "Bloc 1 · Technique sous cadence", kind: "emom", durationMin: 12, rounds: 4, exercises: technical },
       { label: "Bloc 2 · Capacité de travail", kind: "amrap", durationMin: 10, rounds: 0, exercises: capacity }]
    : [{ label: "Bloc 1 · Volume continu", kind: "amrap", durationMin: 12, rounds: 0, exercises: technical },
       { label: "Bloc 2 · Puissance répétée", kind: "emom", durationMin: 9, rounds: 3, exercises: capacity }];
  blocks.forEach((block, blockIdx) => block.exercises.forEach((ex) => { ex.blockIdx = blockIdx; }));
  const moves = blocks.flatMap((block) => block.exercises);
  const durationMin = blocks.reduce((sum, block) => sum + block.durationMin, 0) + 2;
  return {
    label: variant === "power" ? "Kettlebell · Puissance-endurance" : "Kettlebell · Capacité de travail",
    short: "KB", muscle: "Kettlebell uniquement", salle: "full", exercises: moves,
    abs: [], recommendedMode: "emom", metcon: true, totalMin: durationMin, timeCapMin: durationMin,
    emomMinutes: 12, badge: "2 blocs", archetype: "kettlebell", v5: true, blocks,
  };
};

const heroDay = (ctx, week) => {
  const equipment = ctx.equipment || [], zones = ctx.injuryZones || [];
  // Un Hero automatique est un benchmark court et faisable, jamais un WOD long
  // ou incompatible avec une douleur déclarée.
  const pool = HEROES.filter((h) => heroFits(h, equipment) && h.cap >= 12 && h.cap <= 35
    && h.kind === "amrap" && h.moves.every((move) => isSafe({ n: move.n }, zones)));
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
  const equipment = ctx.equipment || [], zones = ctx.injuryZones || [], excluded = ctx.excluded || [];
  const ex = firstAvailable(["cd02", "cd03", "cd04"], equipment, zones, excluded);
  // Une sortie facile est un entraînement continu, pas un faux exercice isolé.
  // Le plan est affiché dans la séance ; l'unique ligne sert de chronomètre et de log.
  const work = ex ? [{ ...prescribed(ex, 1, "45 min", "aerobic", ctx, .5), n: `${ex.n.split(" ")[0]} · Zone 2 continue`, rest: 0 }] : [];
  return { label: "Endurance · Base aérobie", short: "END · Z2", muscle: "Effort continu facile · respiration contrôlée",
    salle: "full", exercises: work, abs: [], recommendedMode: "classique", badge: "Zone 2", archetype: "aerobic", v5: true,
    plan: ["10 min de mise en route très facile", "30 min continus en Zone 2 · conversation possible", "5 min de retour au calme"] };
};

// ─── CONTRATS DU MOTEUR ─────────────────────────────────────────────────────
// Ces invariants sont volontairement exécutés à chaque construction. Ils sont le
// garde-fou qui manquait aux versions précédentes : aucune étiquette ne peut plus
// promettre un contenu que la séance ne respecte pas.
const upperPatterns = new Set(["push_h", "push_v", "pull_h", "pull_v", "arm_pull", "arm_push"]);
const lowerPatterns = new Set(["squat", "hinge"]);
const fail = (message) => { throw new Error(`V5 invariant: ${message}`); };
const names = (day) => (day.exercises || []).map((ex) => ex.n).join(" · ");

const validateDay = (day, ctx) => {
  if (!day || !day.label || !day.archetype) fail("séance incomplète");
  const exercises = day.exercises || [];
  if (/abdominaux|gainage|core/i.test(day.label)) fail(`titre core interdit (${day.label})`);
  if (day.archetype === "strength_upper") {
    if (!exercises.some((ex) => /développé couché|bench/i.test(ex.n))) fail("force haut sans développé couché");
    if (!exercises.some((ex) => /curl|biceps/i.test(ex.n)) || !exercises.some((ex) => /triceps|skull|pushdown/i.test(ex.n))) fail("force haut sans bras directs");
    if (exercises.some((ex) => !upperPatterns.has(metaOf(ex).pattern))) fail(`mouvement hors haut du corps: ${names(day)}`);
  }
  if (day.archetype === "strength_lower") {
    if (exercises.some((ex) => !lowerPatterns.has(metaOf(ex).pattern))) fail(`mouvement hors jambes/chaîne postérieure: ${names(day)}`);
    if (exercises.some((ex) => /bench|couché|développé|curl|triceps/i.test(ex.n))) fail(`haut du corps dans séance jambes: ${names(day)}`);
    if (!exercises.some((ex) => metaOf(ex).pattern === "squat") || !exercises.some((ex) => metaOf(ex).pattern === "hinge")) fail("force jambes sans squat et hinge");
  }
  if (day.archetype === "kettlebell") {
    if (!Array.isArray(day.blocks) || day.blocks.length < 2) fail("kettlebell sans deux blocs");
    const formats = new Set(day.blocks.map((block) => block.kind));
    if (!formats.has("emom") || !formats.has("amrap")) fail("kettlebell sans EMOM et AMRAP");
    if (exercises.length < 5 || exercises.some((ex) => ex.eq !== "kb")) fail(`kettlebell non pure: ${names(day)}`);
    if (day.blocks.some((block) => !block.exercises.length || block.durationMin < 8)) fail("bloc kettlebell trop court ou vide");
  }
  if (day.archetype === "aerobic") {
    if (!Array.isArray(day.plan) || day.plan.length !== 3) fail("endurance sans échauffement, continu et retour au calme");
    if (exercises.length !== 1 || !/\b45 min\b/.test(exercises[0].reps) || metaOf(exercises[0]).pattern !== "cardio") fail("endurance non continue ou non chronométrée");
  }
  if (day.archetype === "hero") {
    if (!day.hero || !day.blocks || day.blocks.length !== 1 || day.totalMin > 35) fail("Hero hors cadre hybrid");
  }
  return true;
};

export const validateV5Program = (program, frequency, ctx = {}) => {
  const size = frequency;
  program.forEach((day) => validateDay(day, ctx));
  for (let i = 0; i < program.length; i += size) {
    const week = program.slice(i, i + size);
    if (week.length < size) break;
    if (frequency >= 3 && week.filter((day) => day.archetype === "hero").length !== 1) fail(`semaine ${i / size + 1} sans Hero unique`);
    if (frequency >= 3 && week.filter((day) => day.archetype === "kettlebell").length < 1) fail(`semaine ${i / size + 1} sans kettlebell`);
    if (frequency >= 4 && (!week.some((day) => day.archetype === "strength_upper") || !week.some((day) => day.archetype === "strength_lower"))) fail(`semaine ${i / size + 1} sans les deux forces`);
    if (frequency >= 5 && !week.some((day) => day.archetype === "aerobic")) fail(`semaine ${i / size + 1} sans base aérobie`);
  }
  return true;
};

// La fréquence actuelle est 5. Les fréquences inférieures conservent les priorités,
// les fréquences élevées obtiennent une seconde séance KB, jamais des séries droites.
export const buildV5Program = (ctx = {}) => {
  const frequency = Math.max(2, Math.min(7, Number(ctx.frequency) || 5));
  const total = Number(ctx.total) || 60;
  const weekly = frequency === 7
    ? ["upper", "kb_power", "hero", "lower", "aerobic", "kb_capacity", "aerobic"]
    : frequency === 6 ? ["upper", "kb_power", "hero", "lower", "aerobic", "kb_capacity"]
    : frequency === 5 ? ["upper", "kb_power", "hero", "lower", "aerobic"]
    : frequency === 4 ? ["upper", "kb_power", "hero", "lower"]
    : frequency === 3 ? ["upper", "kb_power", "hero"]
    : ["upper", "lower"];
  const program = Array.from({ length: total }, (_, index) => {
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
  validateV5Program(program, weekly.length, ctx);
  return program;
};

const CACHE = new Map();
export const v5Session = (index, ctx = {}) => {
  const key = JSON.stringify({ frequency: ctx.frequency || 5, equipment: ctx.equipment || [], total: ctx.total || 60,
    rms: ctx.rms || {}, perf: ctx.perf || {}, excluded: ctx.excluded || [], injuryZones: ctx.injuryZones || [] });
  let program = CACHE.get(key);
  if (!program) { program = buildV5Program(ctx); CACHE.set(key, program); }
  return program[Math.max(0, index) % program.length] || null;
};
