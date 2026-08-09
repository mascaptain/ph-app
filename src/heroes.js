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

export const HEROES = RAW.map(([name, form, cap, text]) => {
  const [kind, rounds] = String(form).split(":");
  const moves = String(text).split("·").map((x) => x.trim()).filter(Boolean)
    .map((t) => {
      // On retire du NOM le nombre, l'unite et la charge : ils sont deja lus a
      // part. Sans cela le mouvement s'appelait "m course" ou "cal rameur".
      const n = String(t)
        .replace(/^\s*\d+(?:[.,]\d+)?(?:-\d+)*\s*(km|m|cal|min|s)?\b\s*/i, "")
        .replace(/\s*\d+(?:\.\d+)?\s*kg/i, "")
        .trim();
      return { n: n || String(t), reps: parseReps(t) || "1", kg: parseKg(t), raw: t };
    });
  const eq = [];
  EQ_RULES.forEach(([re, e]) => { if (re.test(text) && eq.indexOf(e) < 0) eq.push(e); });
  if (!eq.length) eq.push("bw");
  return {
    id: slug(name), name, kind, cap: Number(cap) || 30,
    rounds: rounds ? Number(rounds) : 0,
    eq, special: SPECIAL_RE.test(text), moves, text,
    // Les tres longues ne se glissent pas dans une semaine ordinaire.
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
