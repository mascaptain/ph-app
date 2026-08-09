// ─── HERO WODS ───────────────────────────────────────────────────────────────
// Les seances "Hero" du CrossFit portent le nom de militaires, policiers et
// pompiers morts en service. On garde la PRESCRIPTION — mouvements, series,
// charges — telle qu'elle est publiee. Les textes commemoratifs appartiennent a
// leurs auteurs et ne sont pas repris.
//
// Le catalogue complet vit dans heroes-raw.js sous une forme compacte. Ici on le
// lit : decoupage des mouvements, deduction du materiel, et les quelques
// fonctions dont l'application a besoin.
import { RAW } from "./heroes-raw.js";

// Materiel deduit des mots de la prescription. On ne devine pas : chaque regle
// correspond a un mouvement qui EXIGE ce materiel.
const EQ_RULES = [
  [/barre|thruster|clean|snatch|jerk|soulevé|deadlift|squat.*\d+kg|overhead squat|front squat|back squat|développé couché|push press|sumo deadlift|shoulder-to-overhead|arraché/i, "bar"],
  [/haltère|dumbbell|farmer carry haltères/i, "db"],
  [/kettlebell|swing|goblet|turkish|kb/i, "kb"],
  [/rameur|cal vélo|ski|bike/i, "mc"],
  [/poulie|câble/i, "cd"],
];
// Ce qu'on ne peut pas faire dans une salle ordinaire : la seance est marquee,
// pas exclue — a toi de decider si tu l'adaptes.
const SPECIAL_RE = /nage|swim|sled|traîneau|sandbag|corde à grimper|montée de corde|GHD|yoke|buddy carry|partenaire|versa climb|wall climb|parallettes|anneaux/i;

const slug = (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "").slice(0, 20);

const parseKg = (t) => { const m = String(t).match(/(\d+(?:\.\d+)?)\s*kg/i); return m ? Number(m[1]) : 0; };
// La prescription garde son unite : "1000 m", "60s", "17 cal", "21-15-9".
// La perdre faisait afficher "1000 reps" pour un kilometre de course, et le
// chronometre ne se declenchait jamais faute de savoir qu'il s'agissait de temps.
const parseReps = (t) => {
  const str = String(t);
  let m = str.match(/(\d+(?:[.,]\d+)?)\s*(km|cal|min)\b/i);
  if (m) return m[1] + " " + m[2].toLowerCase();
  m = str.match(/(\d+(?:[.,]\d+)?)\s*m\b/i);
  if (m) return m[1] + " m";
  m = str.match(/(\d+)\s*s\b/i);
  if (m) return m[1] + "s";
  m = str.match(/^\s*(\d+(?:-\d+)+)/);
  if (m) return m[1];
  m = str.match(/^\s*(\d+)/);
  return m ? m[1] : "1";
};

// Un segment peut etre un mouvement seul ("21 thrusters 43kg") ou un TOUR
// compose ("9 tours de 20 cal rameur et 20 burpees"). Dans le second cas on
// ouvre le tour et chaque mouvement redevient une ligne.
// Un segment peut prendre quatre formes :
//   "21 thrusters 43kg"                        un mouvement seul
//   "9 tours de 20 cal rameur et 20 burpees"   un tour compose
//   "AMRAP 20 : 7 tractions, 77 double-unders" un bloc chronometre
//   "21-15-9 soulevés de terre, burpees"       un schema partage
// Dans les trois derniers cas, chaque mouvement doit redevenir une ligne : sinon
// on ne peut ni le valider, ni le chronometrer, ni le compter.
const ROUND_RE = /^(\d+)\s*tours?\s+de\s+(.+)$/i;
const BLOCK_RE = /^(?:.*?)\b(?:AMRAP|EMOM)\b[^:]*(?::|\s+de\s+)(.+)$/i;
const SCHEME_RE = /^((?:\d+-)+\d+)\s+(.+)$/;
// Ces formulations decrivent un format, pas une liste de mouvements. Les
// decouper n'aurait aucun sens ; on les garde telles quelles, en note.
const FREEFORM_RE = /échelle|fractionn|au choix|chaque lâcher|stations|puis on change|de 1 à|jusqu'à/i;

const cleanName = (t) => String(t)
  .replace(/^\s*\d+(?:[.,]\d+)?(?:-\d+)*\s*(km|m|cal|min|s)?\b\s*/i, "")
  .replace(/\s*\d+(?:\.\d+)?\s*kg/i, "")
  .trim();

const mkMove = (t, rounds, gi, k, scheme) => {
  const n = cleanName(t);
  return { n: n || String(t), reps: scheme || parseReps(t) || "1", kg: parseKg(t),
           rounds: rounds || 0, group: rounds ? gi : -1, first: k === 0, raw: t };
};

const splitMoves = (segment, gi) => {
  const seg = String(segment).trim();
  if (FREEFORM_RE.test(seg)) return [{ n: seg, reps: "", kg: 0, rounds: 0, group: -1, note: true, raw: seg }];

  let m = seg.match(ROUND_RE);
  if (m) {
    const rounds = Number(m[1]);
    return m[2].split(/,| et /i).map((x) => x.trim()).filter(Boolean)
      .map((t, k) => mkMove(t, rounds, gi, k));
  }
  m = seg.match(BLOCK_RE);
  if (m) {
    return m[1].split(/,| et /i).map((x) => x.trim()).filter(Boolean)
      .map((t, k) => mkMove(t, 0, gi, k));
  }
  m = seg.match(SCHEME_RE);
  if (m) {
    // "21-15-9 soulevés de terre, burpees" : le schema vaut pour chaque mouvement.
    return m[2].split(/,| et /i).map((x) => x.trim()).filter(Boolean)
      .map((t, k) => mkMove(t, 0, gi, k, m[1]));
  }
  if (/,/.test(seg) && seg.split(",").length <= 6) {
    return seg.split(",").map((x) => x.trim()).filter(Boolean).map((t, k) => mkMove(t, 0, gi, k));
  }
  return [mkMove(seg, 0, gi, 0)];
};

export const HEROES = RAW.map(([name, form, cap, text]) => {
  const [kind, rounds] = String(form).split(":");
  const segs = String(text).split("·").map((x) => x.trim()).filter(Boolean);
  const moves = segs.flatMap((seg, gi) => splitMoves(seg, gi));
  const eq = [];
  EQ_RULES.forEach(([re, e]) => { if (re.test(text) && eq.indexOf(e) < 0) eq.push(e); });
  if (!eq.length) eq.push("bw");
  return {
    id: slug(name), name, kind, cap: Number(cap) || 30,
    rounds: rounds ? Number(rounds) : 0,
    eq, special: SPECIAL_RE.test(text), moves, text,
    long: Number(cap) >= 45,
  };
});

// Un Hero doit etre faisable avec le materiel declare. Le poids du corps est
// toujours disponible ; on ne verifie que le reste. Les seances qui demandent
// une piscine, un traineau ou un partenaire sont ecartees de la programmation
// automatique, mais restent choisissables a la main.
export const heroFits = (h, equipment, allowSpecial) => {
  if (h.special && !allowSpecial) return false;
  const eq = equipment && equipment.length ? equipment : ["bar", "db", "kb", "mc", "cd", "bw"];
  return (h.eq || []).every((e) => e === "bw" || eq.indexOf(e) >= 0);
};

export const heroById = (id) => HEROES.find((h) => h.id === id) || null;

export const heroSummary = (h) =>
  h.kind === "amrap" ? `AMRAP ${h.cap} min`
  : h.kind === "rounds" ? `${h.rounds} tours · ${h.cap} min max`
  : h.kind === "inter" ? `Intervalles · ${h.cap} min`
  : `Pour le temps · ${h.cap} min max`;

// Ce qu'on garde d'une tentative : les tours pour un AMRAP, le temps sinon.
export const heroScoreLabel = (h) => (h && h.kind === "amrap" ? "tours" : "temps");
