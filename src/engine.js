// ─── MOTEUR V4 ───────────────────────────────────────────────────────────────
// Le moteur precedent piochait des exercices a une position arithmetique dans une
// liste triee, et "hybride" n'avait meme pas de profil : il retombait sur cinq
// seances ecrites a la main, jouees douze fois chacune. Vingt-quatre exercices sur
// cinq cents.
//
// Celui-ci separe les decisions en couches, de la plus lente a la plus rapide.
// Chacune ne voit que ce qui la concerne et se verifie seule :
//
//   0  profil derive      ce que tu fais reellement, pas ce que tu as declare
//   1  mesocycle          l'intention du bloc de douze seances
//   2  budget hebdo       combien de series par schema, plancher et plafond
//   3  gabarit            la charpente du jour, sans encore nommer d'exercice
//   4  selection          une NOTE par exercice, pas une position dans une liste
//   5  prescription       charge, series, repetitions, repos
//   6  assemblage         ordre, appariements, blocs de densite
//
// Le programme entier est construit d'un coup et de facon deterministe : c'est ce
// qui permet a la couche 4 de savoir ce qui a deja ete propose, et de garantir
// qu'aucune seance ne se repete.
import { DB } from "./catalog.js";
import { metaOf } from "./classify.js";
import { HEROES, heroFits } from "./heroes.js";

// ─── VOCABULAIRE ─────────────────────────────────────────────────────────────
// Six familles pour le budget. Les patrons fins du classifieur y sont regroupes :
// on raisonne "combien de poussee cette semaine", pas "combien de poussee verticale".
export const FAMILIES = ["hinge", "squat", "push", "pull", "carry", "core"];
const FAMILY_OF = {
  hinge: "hinge", squat: "squat",
  push_h: "push", push_v: "push", arm_push: "push",
  pull_h: "pull", pull_v: "pull", arm_pull: "pull",
  core: "core", cardio: "core",
};
const FAM_FR = { hinge: "Charnière", squat: "Squat", push: "Poussée", pull: "Tirage", carry: "Port", core: "Gainage" };
const CARRY_RE = /carry|farmer|suitcase|waiter|porte|marche.*fermier|yoke/i;
const MOBILITY_RE = /stretch|etirement|mobilit|foam|rouleau|respiration|breathing|yoga|cat-?cow|90\/90|hip flexor|thoracic opener/i;
export const familyOf = (ex) => {
  if (CARRY_RE.test(String(ex && ex.n))) return "carry";
  return FAMILY_OF[metaOf(ex).pattern] || "push";
};

// ─── COUCHE 1 — LE MESOCYCLE ─────────────────────────────────────────────────
// Douze seances ne sont pas douze fois la meme intention. L'intensite monte, le
// volume monte puis retombe, et la douzieme est une decharge.
const BLOCK = 12;
// Part visee de chaque type dans un bloc. C'est une intention, pas un calendrier :
// la seance du jour est celle dont le type est le plus en retard sur sa part.
const DEFAULT_SHARE = { force: 0.42, metcon: 0.25, accessoire: 0.17, mixte: 0.16, skill: 0 };
export const phaseOf = (i) => {
  const p = i % BLOCK;
  if (p === BLOCK - 1) return { name: "decharge", int: 0.82, vol: 0.6, deload: true };
  if (p < 5) return { name: "accumulation", int: 0.94, vol: 1.0, deload: false };
  if (p < 9) return { name: "intensification", int: 1.0, vol: 0.92, deload: false };
  return { name: "realisation", int: 1.05, vol: 0.8, deload: false };
};
export const blockOf = (i) => Math.floor(i / BLOCK);

// ─── LES SIX MODELES ─────────────────────────────────────────────────────────
// Un modele ne dit plus "voici cinq seances". Il dit ce que l'objectif cherche,
// combien de series chaque famille doit recevoir dans la semaine, a quelle
// intensite, et quels mouvements ne doivent jamais disparaitre.
export const GOAL_MODELS = {
  hybride: {
    label: "Hybride",
    // Composition d'un bloc de douze. La douzieme est la decharge.
    share: { force: 0.34, metcon: 0.34, mixte: 0.20, accessoire: 0.12, skill: 0 },
    budget: { hinge: 8, squat: 8, push: 10, pull: 12, carry: 4, core: 6 },
    intensity: { pillar: [0.80, 0.90], accessory: [0.62, 0.74], density: [0.40, 0.55] },
    reps: { pillar: [3, 5], accessory: [8, 12], density: [12, 20] },
    rest: { pillar: 150, accessory: 75, density: 45 },
    pillars: ["bb04", "bb03", "bb01", "bw01"],
    kbPillars: ["kb01", "kb03", "kb08"],   // swing, clean, gobelet squat
    kbDays: 2,                              // seances entierement kettlebell par semaine
    eqBias: ["bar", "kb", "bw", "db", "mc", "cd"],
    minutes: 52,
  },
  force: {
    label: "Force",
    share: { force: 0.62, accessoire: 0.25, mixte: 0.13, metcon: 0, skill: 0 },
    budget: { hinge: 10, squat: 10, push: 12, pull: 12, carry: 2, core: 4 },
    intensity: { pillar: [0.82, 0.92], accessory: [0.68, 0.78], density: [0.50, 0.60] },
    reps: { pillar: [3, 5], accessory: [6, 8], density: [10, 12] },
    rest: { pillar: 200, accessory: 120, density: 75 },
    pillars: ["bb03", "bb04", "bb01", "bb02"],
    eqBias: ["bar", "mc", "db", "bw", "kb", "cd"],
    minutes: 60,
  },
  hypertrophie: {
    label: "Hypertrophie",
    share: { accessoire: 0.55, force: 0.32, mixte: 0.13, metcon: 0, skill: 0 },
    budget: { hinge: 10, squat: 12, push: 16, pull: 16, carry: 2, core: 6 },
    intensity: { pillar: [0.72, 0.82], accessory: [0.62, 0.74], density: [0.50, 0.62] },
    reps: { pillar: [6, 8], accessory: [8, 12], density: [12, 20] },
    rest: { pillar: 120, accessory: 75, density: 45 },
    pillars: ["bb01", "bb06", "bb03", "bw01"],
    eqBias: ["db", "mc", "cd", "bar", "bw", "kb"],
    minutes: 58,
  },
  seche: {
    label: "Sèche",
    share: { mixte: 0.38, metcon: 0.38, accessoire: 0.24, force: 0, skill: 0 },
    budget: { hinge: 8, squat: 10, push: 12, pull: 12, carry: 4, core: 8 },
    intensity: { pillar: [0.68, 0.78], accessory: [0.58, 0.68], density: [0.38, 0.50] },
    reps: { pillar: [8, 10], accessory: [12, 15], density: [15, 20] },
    rest: { pillar: 90, accessory: 45, density: 30 },
    pillars: ["kb08", "bw01", "kb01", "bw04"],
    kbPillars: ["kb01", "kb08"],
    kbDays: 2,
    eqBias: ["kb", "bw", "cd", "db", "mc", "bar"],
    minutes: 45,
  },
  endurance: {
    label: "Endurance",
    share: { metcon: 0.58, mixte: 0.25, force: 0.17, accessoire: 0, skill: 0 },
    budget: { hinge: 9, squat: 8, push: 8, pull: 8, carry: 4, core: 8 },
    intensity: { pillar: [0.62, 0.70], accessory: [0.50, 0.60], density: [0.35, 0.48] },
    reps: { pillar: [10, 12], accessory: [15, 20], density: [15, 25] },
    rest: { pillar: 90, accessory: 40, density: 25 },
    pillars: ["kb01", "bw05", "bw01", "kb08"],
    kbPillars: ["kb01", "kb05", "kb08"],
    kbDays: 2,
    eqBias: ["kb", "bw", "cd", "db", "mc", "bar"],
    minutes: 42,
  },
  performance: {
    label: "Performance",
    share: { force: 0.34, skill: 0.25, mixte: 0.25, metcon: 0.16, accessoire: 0 },
    budget: { hinge: 8, squat: 8, push: 10, pull: 10, carry: 4, core: 8 },
    intensity: { pillar: [0.78, 0.88], accessory: [0.60, 0.72], density: [0.42, 0.55] },
    reps: { pillar: [2, 4], accessory: [6, 10], density: [10, 15] },
    rest: { pillar: 180, accessory: 100, density: 60 },
    pillars: ["kb03", "kb06", "bb03", "bb02", "bw01"],
    kbPillars: ["kb03", "kb06"],
    kbDays: 1,
    eqBias: ["kb", "bar", "bw", "db", "mc", "cd"],
    minutes: 50,
  },
};

// ─── COUCHE 3 — LES GABARITS ─────────────────────────────────────────────────
// Une charpente, pas des exercices. Elle dit combien de places et de quel role ;
// la couche 4 seule decide quel mouvement remplit chaque place.
//   pillar    un gros mouvement charge, frais, en premier
//   accessory un exercice de soutien, appariable
//   density   un bloc chronometre
//   core      le finisseur de gainage
const TEMPLATES = {
  force:      { mode: "classique", slots: [["pillar", 1], ["accessory", 4], ["core", 2]] },
  accessoire: { mode: "classique", slots: [["pillar", 1], ["accessory", 4], ["core", 2]] },
  mixte:      { mode: "classique", slots: [["pillar", 1], ["accessory", 3], ["density", 3], ["core", 2]] },
  metcon:     { mode: "emom",      slots: [["density", 3], ["carry", 1], ["core", 2]] },
  skill:      { mode: "classique", slots: [["pillar", 1], ["accessory", 4], ["core", 2]] },
  decharge:   { mode: "classique", slots: [["pillar", 1], ["accessory", 3], ["core", 2]] },
};
// Les soixante libelles du catalogue ramenes a dix groupes nommables.
const GROUP_MAP = [
  [/pec/i, "Pectoraux"],
  [/deltoid|épaule|epaule|rear delt|rotateur|scapula|trapèze|trapeze/i, "Épaules"],
  [/dorsal|dos/i, "Dos"],
  [/biceps|brachial/i, "Biceps"],
  [/triceps/i, "Triceps"],
  [/quad/i, "Quadriceps"],
  [/ischio/i, "Ischios"],
  [/fessier/i, "Fessiers"],
  [/mollet|adducteur|jambe|hanche/i, "Jambes"],
  [/core|abdo|oblique|lombaire|gainage/i, "Abdominaux"],
  [/avant-bras|grip|poignet/i, "Avant-bras"],
];
const HAUT = ["Pectoraux", "Épaules", "Dos", "Biceps", "Triceps", "Avant-bras"];
const BAS = ["Quadriceps", "Ischios", "Fessiers", "Jambes"];

const FAM_GROUPS = {
  hinge: ["Ischios", "Fessiers"], squat: ["Quadriceps", "Fessiers"],
  push: ["Pectoraux", "Épaules"], pull: ["Dos"], carry: [], core: ["Abdominaux"],
};
const groupsOf = (ex) => {
  const out = [];
  String((ex && ex.m) || "").split("·").map((x) => x.trim()).filter(Boolean).forEach((lab) => {
    for (const [re, g] of GROUP_MAP) { if (re.test(lab)) { if (out.indexOf(g) < 0) out.push(g); return; } }
  });
  // "Full body", "Cardio", "Puissance" ne sont pas des groupes musculaires :
  // quand la fiche n'en donne aucun, on prend ceux de la famille du mouvement.
  if (!out.length) return (FAM_GROUPS[familyOf(ex)] || []).slice();
  return out;
};

// Zone de la seance : on compte les series par groupe, on garde ceux qui portent
// l'essentiel du travail, et on bascule vers la region des qu'il y en a trois.
const zoneOf = (all) => {
  const w = {};
  const body = all.filter((e) => e.role !== "core");
  const exercises = body.length ? body : all;
  exercises.forEach((e) => {
    const gs = groupsOf(e);
    // Le mouvement principal definit la seance : il pese trois fois plus que le
    // reste. Sans cela, quatre accessoires de tirage renommaient un jour de
    // souleve de terre en "Haut du Corps".
    const weight = e.role === "pillar" ? 3 : 1;
    const n = ((Number(e.sets) || 1) * weight) / (gs.length || 1);
    gs.forEach((g) => { w[g] = (w[g] || 0) + n; });
  });
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  if (!tot) return "Full Body";
  // Groupes qui comptent vraiment : au moins un sixieme du travail.
  const main = Object.entries(w).filter(([, v]) => v / tot >= 0.16)
    .sort((a, b) => b[1] - a[1]).map(([g]) => g);
  if (!main.length) return "Full Body";
  if (main.length === 1) return main[0];
  if (main.length === 2) return `${main[0]} & ${main[1]}`;
  const top2 = (w[main[0]] + w[main[1]]) / tot;
  if (top2 >= 0.5) return `${main[0]} & ${main[1]}`;
  const haut = main.filter((g) => HAUT.indexOf(g) >= 0).length;
  const bas = main.filter((g) => BAS.indexOf(g) >= 0).length;
  if (haut && bas) return "Full Body";
  return haut ? "Haut du Corps" : "Bas du Corps";
};
// Cinq types, cinq intentions. Le format d'un bloc chronometre — AMRAP, EMOM —
// n'en fait pas partie : c'est une facon de l'executer, pas une facon de
// s'entrainer. Il vit dans la pastille.
const TYPE_OF = {
  force: "Force", mixte: "Force", accessoire: "Volume",
  metcon: "Conditionnement", skill: "Puissance", decharge: "Décharge",
};
const sessionTitle = (arch, zone) => `${TYPE_OF[arch] || "Force"} · ${zone}`;

// Ce que dit la pastille, a droite du titre.
const sessionBadge = (arch, day) => {
  if (day.hero) return day.blocks && day.blocks[0] ? day.blocks[0].label : "Hero";
  if (arch === "metcon") return `${day.recommendedMode === "amrap" ? "AMRAP" : "EMOM"} ${day.totalMin}`;
  if (arch === "mixte") return "+ conditionnement";
  if (arch === "accessoire") return `${day.exercises.length} exercices`;
  if (arch === "decharge") return "allégé";
  const p = day.exercises.find((e) => e.role === "pillar");
  return p ? `${p.sets} séries` : `${day.exercises.length} exercices`;
};

// Forme courte pour la bande de semaine.
const shortTitle = (arch, zone) => {
  const T = { Force: "FOR", Volume: "VOL", Conditionnement: "COND", Puissance: "PUI", "Décharge": "DÉCH" };
  const t = T[TYPE_OF[arch]] || "FOR";
  if (arch === "decharge") return "DÉCH";
  const z = zone === "Full Body" ? "FB" : zone === "Haut du Corps" ? "HAUT"
    : zone === "Bas du Corps" ? "BAS" : zone.split(" & ")[0].slice(0, 3).toUpperCase();
  return `${t} · ${z}`;
};

// ─── COUCHE 0 — LE PROFIL DERIVE ─────────────────────────────────────────────
// La force de reference se tient PAR SCHEMA, pas par exercice. C'est ce qui
// permet d'estimer la charge d'un mouvement jamais fait : on part de ce qu'on
// sait du schema, corrige par le rapport des charges de reference du catalogue.
export const patternStrength = (rms) => {
  const best = {};
  Object.keys(rms || {}).forEach((id) => {
    const ex = DB.find((e) => e.id === id);
    if (!ex || !(rms[id] > 0) || !(ex.kg > 0)) return;
    const p = metaOf(ex).pattern;
    const ratio = rms[id] / ex.kg;           // combien de fois la reference du catalogue
    if (!best[p] || ratio > best[p]) best[p] = ratio;
  });
  return best;
};

const RPE_UP = { 6: 0.05, 7: 0.025, 8: 0, 9: 0, 10: -0.05 };
const KB_RACK = [6, 8, 10, 12, 16, 20, 24, 32];
const snapLoad = (eq, kg) => {
  const k = Array.isArray(eq) ? eq[0] : eq;
  if (!(kg > 0)) return 0;
  if (k === "kb") return KB_RACK.reduce((b, w) => (Math.abs(w - kg) < Math.abs(b - kg) ? w : b), KB_RACK[0]);
  if (k === "db") return Math.max(2, Math.round(kg / 2) * 2);
  return Math.max(2.5, Math.round(kg / 2.5) * 2.5);
};

// ─── COUCHE 5 — LA PRESCRIPTION ──────────────────────────────────────────────
const prescribe = (ex, role, model, ph, ctx) => {
  const meta = metaOf(ex);
  const band = role === "pillar" ? "pillar" : role === "density" ? "density" : "accessory";
  const [lo, hi] = model.reps[band];
  const own = parseInt(String(ex.reps), 10);
  const reps = (own >= lo && own <= hi) ? own : Math.round((lo + hi) / 2);
  const [ilo, ihi] = model.intensity[role === "pillar" ? "pillar" : role === "density" ? "density" : "accessory"];
  const intensity = Math.min(1, ((ilo + ihi) / 2) * ph.int);

  let kg = 0;
  if (meta.prog !== "bw" && meta.prog !== "temps" && ex.kg > 0) {
    const p = ctx.perf && ctx.perf[ex.id];
    if (p && p.kg > 0) {
      // Ta derniere seance prime sur toute estimation : c'est la seule donnee vraie.
      const bump = RPE_UP[Math.round(Number(p.rpe))] || 0;
      kg = p.kg * (1 + bump) * (ph.deload ? 0.85 : 1);
    } else if (ctx.rms && ctx.rms[ex.id] > 0) {
      // Un vrai 1RM : la, le pourcentage a un sens.
      kg = ctx.rms[ex.id] * intensity;
    } else {
      // Jamais fait. La charge du catalogue est deja une charge de TRAVAIL pour un
      // gabarit de reference : on la transpose par le rapport de force observe sur
      // le meme schema, et on ne la module que par la phase. Lui appliquer en plus
      // un pourcentage de 1RM la divisait par deux.
      const r = (ctx.strength || {})[meta.pattern];
      kg = ex.kg * (r || ctx.scale || 1) * ph.int * (role === "density" ? 0.8 : 1);
    }
    kg = snapLoad(ex.eq, kg);
  }

  const sets = role === "pillar" ? (ph.deload ? 3 : 5)
    : role === "density" ? 3
    : (ph.deload ? 2 : 3);
  const rest = model.rest[role === "pillar" ? "pillar" : role === "density" ? "density" : "accessory"];
  return { ...ex, kg, sets, reps: String(reps), rest, role, v4: true };
};

// ─── COUCHE 4 — LA SELECTION ─────────────────────────────────────────────────
// Une note, pas une position. C'est ici que se joue la variete — et la regle qui
// compte : elle ne s'applique PAS uniformement. Les piliers reviennent souvent,
// sinon aucune progression n'est mesurable ; les accessoires tournent en
// permanence. Varier tout, c'est ne progresser sur rien.
const ROLE_TIERS = {
  pillar: { lourd: 60, compound: 35, isolation: -60, core: -80, cardio: -80 },
  accessory: { compound: 40, isolation: 35, lourd: 5, core: -30, cardio: -20 },
  density: { compound: 30, cardio: 40, isolation: 10, core: 5, lourd: -50 },
  core: { core: 80, isolation: -20, compound: -60, lourd: -80, cardio: -40 },
  carry: { compound: 10, isolation: 0, lourd: 0, core: 0, cardio: 0 },
};
// Compagnes d'une famille lourde. Ce sont des seances classiques :
//   charniere + tirage   la chaine posterieure
//   squat + poussee      bas puis haut
//   poussee + tirage     le haut du corps en antagonistes
const COMPANIONS = {
  hinge: ["hinge", "pull", "carry"],   // chaine posterieure, puis le port
  squat: ["squat", "push", "carry"],   // bas puis haut
  push:  ["push", "pull", "carry"],    // le haut en antagonistes
  pull:  ["pull", "push", "carry"],
};
// Ordre de lecture d'une seance : le lourd d'abord, puis chaque famille d'un
// bloc, le port et le gainage en fin.
const ORDER_ROLE = { pillar: 0, accessory: 1, density: 2, carry: 3, core: 4 };

const COOLDOWN = { pillar: 0, accessory: 6, density: 5, core: 8, carry: 5 };

// Bruit deterministe : departage les ex aequo sans jamais rendre deux programmes
// differents pour un meme profil. Un Math.random ici rendrait tout invérifiable.
const jitter = (id, i) => {
  let h = 2166136261;
  const s = id + ":" + i;
  for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 100;   // 0 → 10
};

// Piliers de la famille demandee, dans l'ordre du modele.
const pillarsOf = (model, fam, ctx) => model.pillars
  .map((id) => DB.find((e) => e.id === id))
  .filter((e) => e && familyOf(e) === fam)
  .filter((e) => !(ctx.excluded || []).includes(e.id))
  .filter((e) => e.eq === "bw" || !(ctx.equipment || []).length || ctx.equipment.includes(e.eq));

// Roles ou la kettlebell a sa place : le geste continu et le port.
const KB_ROLES = { density: 1, carry: 1 };
// Preparation, correctif, gainage debout : utile, mais pas a la place d'un
// accessoire charge sur une seance de force.
const PREHAB_RE = /superman|bird ?dog|wall slide|scapular|pass under|halo|around the world|dead ?bug|band pull|face pull|y raise|external rotation|rotation externe|shrug|mollet|calf|couch|cat-?cow|hollow|plank|gainage/i;

const pickExercise = (want, role, model, idx, state, ctx) => {
  const eq = ctx.equipment && ctx.equipment.length ? ctx.equipment : null;
  let best = null, bestScore = -1e9;
  for (const ex of DB) {
    if (state.usedToday.has(ex.id)) continue;
    if (ctx.excluded && ctx.excluded.indexOf(ex.id) >= 0) continue;
    if (MOBILITY_RE.test(ex.n)) continue;
    if (ex.eq !== "bw" && eq && eq.indexOf(ex.eq) < 0) continue;

    const meta = metaOf(ex);
    const fam = familyOf(ex);
    if (want && fam !== want) continue;
    if (role === "core" && meta.pattern !== "core") continue;
    if (role === "carry" && !CARRY_RE.test(ex.n)) continue;

    // Une serie droite chargee ne se fait pas a la cloche : la kettlebell est
    // reservee aux blocs chronometres et aux ports.
    if (ex.eq === "kb" && !KB_ROLES[role] && !state.kbDay) continue;

    if (role === "accessory" && PREHAB_RE.test(ex.n)) continue;
    // Sur un creneau d'accessoire, une charge vaut mieux qu'un mouvement a vide :
    // c'est la que se construit le volume qui compte.
    let sc = (ROLE_TIERS[role] || {})[meta.tier] || 0;
    // Jour kettlebell : la cloche passe devant, tout le reste recule.
    if (state.kbDay && ex.eq === "kb") sc += 90;
    if (state.kbDay && ex.eq !== "kb" && role !== "core") sc -= 70;
    if (role === "accessory" && Number(ex.kg) > 0) sc += 18;

    // Une seance ne doit pas devenir un cours de kettlebell parce que le catalogue
    // en contient beaucoup et que la nouveaute les favorise. Au-dela de deux
    // exercices du meme materiel dans la journee, la note chute.
    const sameEq = state.eqToday[ex.eq] || 0;
    sc -= sameEq * 22;

    // Materiel privilegie par l'objectif
    const eb = model.eqBias.indexOf(ex.eq);
    sc += eb < 0 ? 0 : (model.eqBias.length - eb) * 4;

    // Piliers : ils doivent revenir, et seulement sur leur role.
    const isPillar = model.pillars.indexOf(ex.id) >= 0;
    if (role === "pillar") { if (isPillar) sc += 120; }
    else if (isPillar) sc -= 40;

    // Nouveaute et recence — le coeur de la variete.
    const last = state.lastSeen[ex.id];
    // Plafond de nouveaute : passer une seance a decouvrir six mouvements, c'est
    // ne forcer sur aucun. Au-dela du quota, l'inconnu n'est plus favorise.
    if (last == null && state.newToday >= 2) sc -= 140;
    if (last == null) sc += role === "pillar" ? 0 : 45;
    else {
      const gap = idx - last;
      if (gap < COOLDOWN[role]) continue;             // interdit, pas seulement penalise
      sc += Math.min(30, gap * 2);
    }

    // Une charge au poids du corps ne convient pas a un role de pilier charge.
    if (role === "pillar" && meta.prog === "bw" && !isPillar) sc -= 25;
    // Un bloc de densite veut du geste continu, pas une barre lourde a charger.
    if (role === "density" && ex.eq === "bar") sc -= 30;

    sc += jitter(ex.id, idx);
    if (sc > bestScore) { bestScore = sc; best = ex; }
  }
  return best;
};

// Type de la seance : celui dont la part realisee est la plus en retard sur la
// part visee, parmi ceux que les contraintes autorisent.
const chooseArch = (model, i, state, ph) => {
  if (ph.deload) return "decharge";
  const share = model.share || DEFAULT_SHARE;
  const done = state.archCount || {};
  const seen = Object.values(done).reduce((a, b) => a + b, 0) || 1;
  const allowed = Object.keys(share).filter((k) => (share[k] || 0) > 0).filter((k) => {
    // Deux conditionnements de suite se marchent dessus.
    if (k === "metcon" && state.lastArch === "metcon") return false;
    // La veille d'un Hero, on n'arrive pas casse par une seance lourde.
    if (state.heroNext && (k === "force" || k === "mixte")) return false;
    return true;
  });
  const pool = allowed.length ? allowed : Object.keys(share).filter((k) => (share[k] || 0) > 0);
  let best = pool[0], bestGap = -Infinity;
  pool.forEach((k) => {
    const gap = (share[k] || 0) - ((done[k] || 0) / seen);
    if (gap > bestGap) { bestGap = gap; best = k; }
  });
  return best;
};

// ─── COUCHE 2 — LE BUDGET ────────────────────────────────────────────────────
// La couche absente jusqu'ici, et celle qui garantit l'equilibre. On pose les
// series a placer dans la semaine ; chaque seance les CONSOMME ; la derniere
// seance de la semaine n'a plus le choix, elle va chercher le deficit.
// Series de travail qu'une seance produit, selon sa duree cible.
const setsPerSession = (minutes) => Math.max(12, Math.round(minutes / 2.8));
export const weeklyBudget = (model, freq) => {
  const total = freq * setsPerSession(model.minutes);
  const w = model.budget;
  const sum = FAMILIES.reduce((a, f) => a + (w[f] || 0), 0) || 1;
  const out = {};
  FAMILIES.forEach((f) => { out[f] = Math.round(total * (w[f] || 0) / sum); });
  out.core = Math.max(out.core, freq * 3);
  out.carry = Math.max(out.carry, Math.round(freq * 1.8));
  return out;
};

const deficits = (budget, spent) =>
  FAMILIES.map((f) => ({ f, left: (budget[f] || 0) - (spent[f] || 0) }))
          .sort((a, b) => b.left - a.left);
// Un budget qui ne fait qu'ORDONNER ne contraint rien : il faut aussi savoir
// dire non. Une famille au plafond ne recoit plus d'accessoire cette semaine.
const roomLeft = (budget, spent, f) => (budget[f] || 0) - (spent[f] || 0);

// ─── COUCHE 6 — L'ASSEMBLAGE ─────────────────────────────────────────────────
const estimateMinutes = (exercises) => {
  let s = 300;                                   // echauffement : 5 min
  exercises.forEach((e) => {
    const n = Number(e.sets) || 1;
    const r = parseInt(String(e.reps), 10) || 10;
    s += n * (r * 3.5 + (Number(e.rest) || 60));
  });
  return Math.round(s / 60);
};

// ─── CONSTRUCTION DU PROGRAMME ───────────────────────────────────────────────
export const buildProgram = (goal, ctx = {}) => {
  const model = GOAL_MODELS[goal] || GOAL_MODELS.hybride;
  const total = ctx.total || 60;
  const freq = Math.max(2, Math.min(7, ctx.frequency || 5));
  const budget = weeklyBudget(model, freq);
  const state = { lastSeen: {}, usedToday: new Set(), spent: {}, heavyFam: null,
                  eqToday: {}, newToday: 0, pillarTurn: 0,
                  archCount: {}, lastArch: null, heroNext: false, heroesThisWeek: 0,
                  heroSeen: {}, heroIdx: 0, kbDay: false, kbThisWeek: 0 };
  // Un a deux Hero par semaine : deux des que la frequence le permet.
  const heroQuota = ctx.heroQuota != null ? ctx.heroQuota : (freq >= 5 ? 1 : 1);
  const out = [];

  for (let i = 0; i < total; i++) {
    // Nouvelle semaine : tous les compteurs hebdomadaires repartent de zero,
    // AVANT le choix du type de seance qui les consulte.
    if (i % freq === 0) { state.spent = {}; state.heroesThisWeek = 0; state.kbThisWeek = 0;
      state.weekNo = Math.floor(i / freq); }
    const ph = phaseOf(i);
    // ── Le type de la seance se decide, il n'est plus lu dans un tableau. ──
    const arch = chooseArch(model, i, state, ph);
    // Jour kettlebell : deux par semaine, sur un conditionnement ou une force.
    // On ne le pose ni sur une decharge ni sur un Hero, qui ont leur propre
    // contenu.
    state.kbDay = (model.kbDays > 0) && (state.kbThisWeek < model.kbDays)
      && (arch === "metcon" || arch === "force" || arch === "mixte") && !ph.deload;
    // Dernier jour de la semaine sans aucune seance kettlebell : on la place ici.
    // Sinon une semaine ou les Hero ont pris tous les conditionnements n'en a
    // aucune, et la cloche disparait sept jours durant.
    if (!ph.deload && (model.kbDays > 0) && (state.kbThisWeek || 0) === 0
        && (i % freq === freq - 1) && arch !== "decharge") state.kbDay = true;
    const tpl = TEMPLATES[arch] || TEMPLATES.force;
    state.usedToday = new Set();
    state.eqToday = {};
    state.newToday = 0;


    // Famille lourde du jour : rotation reguliere sur les quatre grandes familles
    // plutot que "toujours celle qui a le plus de retard". Prendre systematiquement
    // le plus gros deficit revenait a servir le tirage presque tout le temps —
    // seize seances de tractions contre quatre de developpe couche.
    const BIG = ["hinge", "push", "squat", "pull"];
    const hasPillar = tpl.slots.some(([r]) => r === "pillar");
    let mainFam = BIG[(hasPillar ? state.pillarTurn : i) % BIG.length];
    if (mainFam === state.heavyFam) mainFam = BIG[((hasPillar ? state.pillarTurn : i) + 1) % BIG.length];
    if (hasPillar) state.pillarTurn++;

    const exercises = [];
    const spend = (pres) => {
      const fam = familyOf(pres);
      // Un tour de bloc chronometre coute moins qu'une serie droite chargee :
      // le compter pareil revenait a saturer le budget des le deuxieme jour.
      const cost = pres.role === "density" ? 1 : (Number(pres.sets) || 0);
      state.spent[fam] = (state.spent[fam] || 0) + cost;
    };
    const famsToday = () => new Set(exercises.map((e) => familyOf(e)).filter((f) => f !== "core"));
    const place = (role, want, force) => {
      // Au-dela de trois familles, une seance n'a plus de theme : on refuse d'en
      // ouvrir une quatrieme et on retombe sur celles deja engagees.
      if (!force && role !== "core" && role !== "pillar") {
        const fs = famsToday();
        if (!fs.has(want) && fs.size >= 3) return false;
      }
      // Une famille au plafond ne recoit plus d'accessoire : sans ce refus, le
      // budget ne faisait qu'ordonner et la poussee montait a 44 series pour 10.
      // Une place d'une seule serie n'en est pas une : un accessoire en coute trois.
      // Sans ce seuil, le port montait a 12 series pour un budget de 8.
      if (!force && (role === "accessory" || role === "carry")
          && roomLeft(budget, state.spent, want) < 3) return false;
      let ex = null;
      if (role === "pillar") {
        // Rotation entre les piliers de la famille. Les piliers a la cloche sont
        // ecartes des seances classiques : le swing progresse dans les blocs de
        // densite, ou il a sa place.
        const ps = state.kbDay
          ? (model.kbPillars || []).map((id) => DB.find((e) => e.id === id)).filter(Boolean)
          : pillarsOf(model, want, ctx).filter((e) => e.eq !== "kb");
        if (ps.length) ex = ps[Math.floor(i / BIG.length) % ps.length];
      }
      if (!ex) ex = pickExercise(want, role, model, i, state, ctx);
      if (!ex) return false;
      if (state.lastSeen[ex.id] == null) state.newToday++;
      state.usedToday.add(ex.id);
      state.lastSeen[ex.id] = i;
      state.eqToday[ex.eq] = (state.eqToday[ex.eq] || 0) + 1;
      const pres = prescribe(ex, role, model, ph, ctx);
      spend(pres);
      exercises.push(pres);
      return true;
    };

    // Familles du THEME du jour, les plus en retard d'abord. Hors theme, on
    // n'ajoute rien : c'est ce qui donne une seance qui se tient.
    const theme = COMPANIONS[mainFam] || ["push", "pull", "core"];
    const openFams = () => deficits(budget, state.spent)
      .filter((d) => d.f !== "core" && d.left > 0 && theme.indexOf(d.f) >= 0)
      .map((d) => d.f);
    // Si le theme est sature, on elargit — mais en gardant l'ordre du theme en
    // tete, pour que l'ajout reste le moins depaysant possible.
    const openAny = () => deficits(budget, state.spent)
      .filter((d) => d.f !== "core" && d.left > 0)
      .sort((a, b) => (theme.indexOf(a.f) < 0 ? 9 : 0) - (theme.indexOf(b.f) < 0 ? 9 : 0))
      .map((d) => d.f);

    for (const [role, count] of tpl.slots) {
      for (let k = 0; k < count; k++) {
        if (role === "pillar") { place("pillar", mainFam); continue; }
        if (role === "core") { place("core", "core"); continue; }
        if (role === "carry") { place("carry", "carry"); continue; }
        // On essaie les familles ouvertes, dans l'ordre du retard. Si aucune n'a de
        // place, on prend celle qui a le MOINS depasse — jamais une au hasard.
        let open = openFams().filter((f) => f !== mainFam || role === "density");
        if (!open.length) open = openAny();
        let done = false;
        for (let t = 0; t < open.length && !done; t++) {
          done = place(role, open[(k + t) % open.length]);
        }
        // Si rien n'a de place, le creneau reste vide. Forcer ici rendait le
        // plafond decoratif ; le plancher de seance garantit deja le minimum.
      }
    }

    // Plancher de seance. Quand le budget de la semaine est epuise, le refus
    // d'ajouter produisait des seances de trois exercices : un leger depassement
    // vaut mieux qu'une seance qui ne vaut pas le deplacement.
    let floorGuard = 0;
    while (exercises.filter((e) => e.role !== "core").length < 5 && floorGuard++ < 8) {
      const least = deficits(budget, state.spent).filter((d) => d.f !== "core")[0];
      if (!least || !place("accessory", least.f, true)) break;
    }

    // La seance doit durer ce qu'elle annonce. On complete par les familles encore
    // en retard tant qu'on n'a pas atteint la cible de duree du modele.
    let guard = 0;
    while (estimateMinutes(exercises) < model.minutes - 6
           && exercises.length < 8 && guard++ < 8) {
      const open = openFams().length ? openFams() : openAny();
      if (!open.length) break;                      // semaine pleine : on s'arrete la
      let added = false;
      for (let t = 0; t < open.length && !added; t++) added = place("accessory", open[t]);
      if (!added) break;
    }
    // Le Hero de la semaine prochaine se decide ici : la seance qui precede en
    // tiendra compte et evitera de te casser la veille.
    state.heroNext = (arch !== "metcon") && (state.heroesThisWeek < heroQuota + 1)
      && ((i + 1) % freq !== 0);

    if (state.kbDay) state.kbThisWeek = (state.kbThisWeek || 0) + 1;
    state.archCount[arch] = (state.archCount[arch] || 0) + 1;
    state.lastArch = arch;
    if (["hinge", "squat", "push", "pull"].indexOf(mainFam) >= 0 && arch !== "metcon") {
      state.heavyFam = mainFam;
    } else state.heavyFam = null;

    // Regroupement par famille, dans l'ordre du theme. Sans cela l'ordre etait
    // celui du tirage au sort et la seance sautait d'un groupe a l'autre.
    exercises.sort((a, b) => {
      const ra = ORDER_ROLE[a.role] ?? 9, rb = ORDER_ROLE[b.role] ?? 9;
      // Le pilier ouvre, le gainage et le port ferment. Entre les deux,
      // accessoires et densite se rangent PAR FAMILLE : on termine un groupe
      // musculaire avant d'en commencer un autre.
      // Quatre temps : le lourd, les accessoires, le bloc chronometre, le
      // finisseur. Accessoires et densite partageaient le meme temps.
      const ea = ra === 0 ? 0 : ra === 1 ? 1 : ra === 2 ? 2 : 3;
      const eb = rb === 0 ? 0 : rb === 1 ? 1 : rb === 2 ? 2 : 3;
      if (ea !== eb) return ea - eb;
      const fa = familyOf(a), fb = familyOf(b);
      const ia = theme.indexOf(fa) < 0 ? 9 : theme.indexOf(fa);
      const ib = theme.indexOf(fb) < 0 ? 9 : theme.indexOf(fb);
      if (ia !== ib) return ia - ib;
      if (fa !== fb) return fa < fb ? -1 : 1;   // groupe les hors-theme entre eux
      return ra - rb;
    });

    const fams = [...new Set(exercises.map((e) => familyOf(e)))];
    const day = {
      label: sessionTitle(arch, state.kbDay ? "Kettlebell" : zoneOf(exercises)),
      salle: "full",
      muscle: fams.map((f) => FAM_FR[f] || f).join(" · "),
      // Le gainage n'est pas un exercice parmi les autres : il ferme la seance,
      // dans son propre bloc, comme avant le moteur V4.
      exercises: exercises.filter((e) => e.role !== "core"),
      abs: exercises.filter((e) => e.role === "core")
        .map((e) => ({ id: e.id, n: e.n, eq: e.eq, vol: `${e.sets}×${e.reps}` })),
      recommendedMode: tpl.mode,
      circuit: arch === "mixte" || arch === "accessoire",
      v4: true,
      archetype: arch,
      phase: ph.name,
      block: blockOf(i) + 1,
      estMin: estimateMinutes(exercises),
      short: shortTitle(arch, state.kbDay ? "Kettlebell" : zoneOf(exercises)),
      budget,
    };

    // Un jour de densite se joue en bloc chronometre : on lui donne la meme forme
    // que ce qu'attend le lecteur de circuit.
    // ── Un Hero remplace le bloc chronometre quand le quota de la semaine le
    //    permet. Il garde ses charges et ses repetitions : c'est le principe.
    const heroPool = HEROES.filter((h) => heroFits(h, ctx.equipment)
      && !(ctx.excluded || []).includes("hero:" + h.id)
      && h.cap <= 60
      && (!h.long || i % 12 >= 8));
    const quotaNow = heroQuota + ((freq >= 5 && (state.weekNo || 0) % 2 === 0) ? 1 : 0);
    if (arch === "metcon" && state.heroesThisWeek < quotaNow && heroPool.length) {
      const fresh = heroPool.filter((h) => state.heroSeen[h.id] == null);
      const pick = (fresh.length ? fresh : heroPool)[
        (fresh.length ? state.heroIdx : state.heroIdx + 3) % (fresh.length || heroPool.length)];
      state.kbDay = false;
      state.heroSeen[pick.id] = i;
      state.heroIdx++;
      state.heroesThisWeek++;
      const hx = pick.moves.map((m, k) => ({
        id: `hero_${pick.id}_${k}`, n: m.n, m: "Full body", eq: "bw",
        kg: m.kg || 0, sets: 1, reps: String(m.reps), rest: 0, role: "density", v4: true,
      }));
      day.hero = pick.id;
      day.heroName = pick.name;
      day.label = `Hero · ${pick.name}`;
      day.short = "HERO";
      day.muscle = pick.tribute;
      day.exercises = hx;
      day.recommendedMode = pick.kind === "amrap" ? "amrap" : "fortime";
      day.metcon = true;
      day.totalMin = pick.cap;
      day.timeCapMin = pick.cap;
      day.emomMinutes = pick.cap;
      day.estMin = pick.cap + 8;
      day.blocks = [{
        label: pick.kind === "amrap" ? `AMRAP ${pick.cap}`
          : pick.kind === "rounds" ? `${pick.rounds} tours`
          : `Pour le temps · ${pick.cap} min`,
        kind: pick.kind === "amrap" ? "amrap" : "fortime",
        durationMin: pick.cap, rounds: pick.rounds || 0, exercises: hx,
      }];
      hx.forEach((e) => { e.blockIdx = 0; });
      day.badge = day.blocks[0].label;
      out.push(day);
      continue;
    }

    if (tpl.mode === "emom" || tpl.mode === "amrap") {
      const kind = i % 2 === 0 ? "emom" : "amrap";
      // Le bloc, ce sont les mouvements de densite et le port — pas les
      // accessoires ajoutes par ailleurs pour completer la seance.
      const inBlock = exercises.filter((e) => e.role === "density" || e.role === "carry");
      const blockEx = inBlock.length ? inBlock : exercises;
      const rounds = 3;
      const dur = Math.max(8, Math.min(16,
        kind === "emom" ? blockEx.length * rounds : 12));
      day.recommendedMode = kind;
      day.label = sessionTitle(arch, state.kbDay ? "Kettlebell" : zoneOf(blockEx));
      day.metcon = true;
      day.blocks = [{
        label: (kind === "emom" ? "EMOM " : "AMRAP ") + dur,
        kind, durationMin: dur,
        rounds: kind === "emom" ? Math.max(1, Math.round(dur / blockEx.length)) : 0,
        exercises: blockEx,
      }];
      day.totalMin = dur;
      day.timeCapMin = dur;
      day.emomMinutes = dur;
      blockEx.forEach((e) => { e.blockIdx = 0; });
    }
    day.badge = sessionBadge(arch, day);
    out.push(day);
  }
  return out;
};


// Memoire de programme : rebattre soixante seances a chaque rendu serait absurde.
const CACHE = new Map();
export const v4Session = (goal, index, ctx = {}) => {
  const key = [goal, index < 0 ? 0 : 0, (ctx.equipment || []).join(","), ctx.frequency || 5,
               Object.keys(ctx.rms || {}).length, Object.keys(ctx.perf || {}).length,
               (ctx.excluded || []).length, ctx.total || 60].join("|");
  let prog = CACHE.get(key);
  if (!prog) { prog = buildProgram(goal, ctx); CACHE.set(key, prog); }
  if (CACHE.size > 8) CACHE.delete(CACHE.keys().next().value);
  return prog[Math.max(0, index) % prog.length] || null;
};
