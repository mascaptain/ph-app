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

// Le temps est un contrat du moteur, pas une promesse dans l'interface. Chaque
// seance hybride inclut les 5 min d'echauffement rendues par l'app et un bloc
// gainage court. Le contenu principal doit completer le budget de 45 min.
const WARMUP_MIN = 5;
const CORE_MIN = 6;
const MIN_SESSION_MIN = 45;
const coreFinish = (week = 0) => week % 2
  ? [{ id: "bw10", n: "Relevé de jambes suspendu", vol: "3×10" }, { id: "ab02", n: "Russian Twist", vol: "3×16" }]
  : [{ id: "ab03", n: "Hollow Body Hold", vol: "3×30s" }, { id: "bw09", n: "L-Sit", vol: "3×20s" }];
const timed = (ex, minutes, label, ctx) => ex ? {
  ...prescribed(ex, 1, `${minutes} min`, "aerobic", ctx, .5), n: label, rest: 0,
} : null;
const complete = (day, workMin, week = 0) => {
  const totalMin = workMin + WARMUP_MIN + CORE_MIN;
  // A future edit cannot silently produce a session shorter than the contract.
  if (totalMin < MIN_SESSION_MIN) throw new Error(`V5 invariant: duration too short (${totalMin} min)`);
  return {
    ...day, abs: coreFinish(week), warmupMin: WARMUP_MIN, coreMin: CORE_MIN,
    workMin, totalMin, minSessionMin: MIN_SESSION_MIN,
  };
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
  return complete({ label: spec.label, short: upper ? "FOR · HAUT" : "FOR · BAS", muscle: spec.muscle,
    salle: "full", warmupFocus: upper ? "haut" : "bas", exercises: work.filter(Boolean), abs: [], recommendedMode: "classique",
    badge: upper ? "Développé couché" : "Squat / hinge", archetype: upper ? "strength_upper" : "strength_lower",
    phase: ctx.deload ? "decharge" : "construction", v5: true }, 36, week);
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
  const finisher = variant === "power"
    ? build(["kb12", "kb05", "kb01"], [10, 6, 12])
    : build(["kb03", "kb08", "kb11"], [6, 10, 10]);
  const blocks = variant === "power"
    ? [{ label: "Bloc 1 · Technique sous cadence", kind: "emom", durationMin: 12, rounds: 4, exercises: technical },
       { label: "Bloc 2 · Capacité de travail", kind: "amrap", durationMin: 10, rounds: 0, exercises: capacity },
       { label: "Bloc 3 · Finisseur", kind: "amrap", durationMin: 10, rounds: 0, exercises: finisher }]
    : [{ label: "Bloc 1 · Volume continu", kind: "amrap", durationMin: 12, rounds: 0, exercises: technical },
       { label: "Bloc 2 · Puissance répétée", kind: "emom", durationMin: 9, rounds: 3, exercises: capacity },
       { label: "Bloc 3 · Finisseur", kind: "amrap", durationMin: 11, rounds: 0, exercises: finisher }];
  blocks.forEach((block, blockIdx) => block.exercises.forEach((ex) => { ex.blockIdx = blockIdx; }));
  const moves = blocks.flatMap((block) => block.exercises);
  const durationMin = blocks.reduce((sum, block) => sum + block.durationMin, 0) + 2;
  return complete({
    label: variant === "power" ? "Kettlebell · Puissance-endurance" : "Kettlebell · Capacité de travail",
    short: "KB", muscle: "Kettlebell uniquement", salle: "full", warmupFocus: "bas", exercises: moves,
    abs: [], recommendedMode: "emom", metcon: true, totalMin: durationMin, timeCapMin: durationMin,
    emomMinutes: 12, badge: "3 blocs", archetype: "kettlebell", v5: true, blocks,
  }, durationMin, 0);
};

const heroDay = (ctx, week) => {
  const equipment = ctx.equipment || [], zones = ctx.injuryZones || [];
  // Un Hero automatique est un benchmark court et faisable, jamais un WOD long
  // ou incompatible avec une douleur déclarée. Le catalogue brut est trop large
  // pour une programmation automatique : certains Hero répètent un mouvement ou
  // demandent une charge/installation que leur fiche résume mal. La sélection
  // automatique se limite donc aux benchmarks hybrides lisibles et réalisables;
  // le catalogue complet reste disponible au choix manuel.
  const HYBRID_HERO_IDS = new Set(["danny", "havana", "jack", "jennifer", "laura", "mcghee", "rah oi", "rahoi", "rankel", "ricky", "tk", "viola"]);
  const pool = HEROES.filter((h) => HYBRID_HERO_IDS.has(String(h.id).toLowerCase())
    && heroFits(h, equipment) && h.cap >= 12 && h.cap <= 35 && h.kind === "amrap"
    && h.moves.length >= 3 && h.moves.length <= 4
    && new Set(h.moves.map((move) => String(move.n).toLowerCase())).size === h.moves.length
    && h.moves.every((move) => isSafe({ n: move.n }, zones)));
  const hero = pool.length ? pool[week % pool.length] : null;
  if (!hero) return kbDay("capacity", ctx);
  const support = pool.length > 1 ? pool[(week + 1) % pool.length] : hero;
  const toBlock = (entry, blockIdx) => {
    const exercises = entry.moves.map((m, i) => ({ id: `hero_${entry.id}_${blockIdx}_${i}`, n: m.n, m: "Full body", eq: "bw", kg: m.kg || 0,
      sets: 1, reps: String(m.reps), rest: 0, role: "density", v5: true, blockIdx }));
    return { label: `Hero ${blockIdx + 1} · ${entry.name} · AMRAP ${entry.cap}`, kind: "amrap", durationMin: entry.cap, rounds: 0, exercises };
  };
  const picks = [hero, support];
  // Deux Hero sont la base. Lorsque deux benchmarks courts ne couvrent pas le
  // budget de travail requis, un troisieme est ajoute automatiquement.
  for (let offset = 2; picks.reduce((sum, entry) => sum + entry.cap, 0) < 34 && offset < pool.length; offset += 1) {
    picks.push(pool[(week + offset) % pool.length]);
  }
  const blocks = picks.map(toBlock);
  const exercises = blocks.flatMap((block) => block.exercises);
  const workMin = blocks.reduce((sum, block) => sum + block.durationMin, 0);
  return complete({ label: `Hero · ${hero.name}`, short: "HERO", muscle: hero.tribute, salle: "full", warmupFocus: "full", exercises, abs: [],
    recommendedMode: "amrap", metcon: true, timeCapMin: workMin, emomMinutes: workMin,
    badge: `${blocks.length} Hero`, hero: hero.id, heroName: hero.name, archetype: "hero", v5: true, blocks }, workMin, week);
};

const aerobicDay = (ctx) => {
  const equipment = ctx.equipment || [], zones = ctx.injuryZones || [], excluded = ctx.excluded || [];
  const choices = ["x110", "x122", "x111"].map((id) => firstAvailable([id], equipment, zones, excluded));
  const fallback = firstAvailable(["cd02", "cd04"], equipment, zones, excluded);
  const [rower, run, bike] = choices.map((ex) => ex || fallback);
  // Trois portions executables et chronometrables : on ne masque plus une
  // seance de 45 min derriere une unique ligne « rameur ».
  const work = [
    timed(rower, 15, "Rameur · Zone 2", ctx),
    timed(run, 15, "Course facile · Zone 2", ctx),
    timed(bike, 15, "Assault Bike · Zone 2", ctx),
  ].filter(Boolean);
  return complete({ label: "Endurance · Base aérobie", short: "END · Z2", muscle: "Effort continu facile · respiration contrôlée",
    salle: "full", warmupFocus: "bas", exercises: work, abs: [], recommendedMode: "classique", badge: "Zone 2", archetype: "aerobic", v5: true,
    plan: ["15 min rameur facile · Zone 2", "15 min course facile · Zone 2", "15 min Assault Bike · Zone 2"] }, 45);
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
  if (!(day.totalMin >= MIN_SESSION_MIN) || day.minSessionMin !== MIN_SESSION_MIN) fail(`session under ${MIN_SESSION_MIN} min`);
  if (!Array.isArray(day.abs) || day.abs.length < 2) fail("session without core finisher");
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
    if (!Array.isArray(day.plan) || day.plan.length !== 3) fail("endurance sans trois portions réelles");
    if (exercises.length !== 3 || exercises.some((ex) => !/\b15 min\b/.test(ex.reps) || metaOf(ex).pattern !== "cardio")) fail("endurance without three timed cardio blocks");
  }
  if (day.archetype === "hero") {
    if (!day.hero || !day.blocks || day.blocks.length < 2 || day.blocks.some((block) => block.kind !== "amrap" || block.durationMin < 12)) fail("Hero without two AMRAP blocks");
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
