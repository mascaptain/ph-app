// Modèle de force : comment estimer la charge d'un exercice à partir de ce que tu
// as réellement soulevé.
//
// Les 1RM estimés (profiles.rms) sont des MAXIMUMS sur une répétition ; la charge
// du catalogue est une charge de TRAVAIL pour un gabarit de référence, à N reps.
// Les comparer directement (ancienne version) donnait un rapport gonflé d'environ
// ×2 : un front squat jamais fait sortait à 135 kg. On compare donc maximum à
// maximum : ton 1RM contre le 1RM implicite de la référence (Epley).
//
// Puis, pour chaque schéma (squat, charnière, poussée…), on garde la MÉDIANE des
// rapports — un seul exercice exceptionnel ne doit pas tirer tout un schéma — et
// on la mélange avec ta force globale (médiane de tous tes exercices), d'autant
// plus que le schéma est peu documenté. Un schéma sans aucune donnée prend ta
// force globale.
import { DB } from "./catalog.js";
import { metaOf, noAccent } from "./classify.js";

const PATTERNS = ["squat", "hinge", "push_h", "push_v", "pull_h", "pull_v", "arm_pull", "arm_push", "core", "cardio"];
const MIN_RATIO = 0.4, MAX_RATIO = 1.8;
const byId = new Map(DB.map((e) => [e.id, e]));
const epley = (kg, reps) => kg * (1 + (Number(reps) || 0) / 30);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const clamp = (x) => Math.max(MIN_RATIO, Math.min(MAX_RATIO, x));

// Rapport « ta force / force de référence » pour chaque exercice documenté.
export const strengthRatios = (rms) => {
  const out = [];
  Object.keys(rms || {}).forEach((id) => {
    const ex = byId.get(id);
    const rm = Number(rms[id]);
    if (!ex || !(rm > 0) || !(ex.kg > 0) || ex.eq === "bw") return;
    const ref = epley(ex.kg, parseInt(ex.reps, 10) || 8);
    out.push({ id, pattern: metaOf(ex).pattern, ratio: clamp(rm / ref) });
  });
  return out;
};

// Facteur par schéma, rempli pour TOUS les schémas (global en repli), plus `_global`.
export const patternStrength = (rms) => {
  const ratios = strengthRatios(rms);
  if (!ratios.length) return {};
  const global = median(ratios.map((r) => r.ratio));
  const out = { _global: Math.round(global * 1000) / 1000 };
  PATTERNS.forEach((p) => {
    const own = ratios.filter((r) => r.pattern === p).map((r) => r.ratio);
    // 1 exercice : moitié schéma, moitié global ; 3 et plus : le schéma domine.
    const f = own.length ? (median(own) * own.length + global) / (own.length + 1) : global;
    out[p] = Math.round(f * 1000) / 1000;
  });
  return out;
};

// Le catalogue contient des doublons (« Front Squat barre » bb09 et « Front Squat »
// x002) : ton historique sur l'un vaut pour l'autre.
const key = (n) => noAccent(n).replace(/\b(barre|bar)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const sameName = new Map();
DB.forEach((e) => { const k = key(e.n); if (!sameName.has(k)) sameName.set(k, []); sameName.get(k).push(e.id); });
export const twinIds = (ex) => (ex && sameName.get(key(ex.n)) || []).filter((id) => id !== ex.id);

// Donnée d'historique d'un exercice : la sienne, sinon celle d'un doublon du même
// matériel (une barre ne se compare pas à une paire d'haltères).
export const historyFor = (map, ex) => {
  if (!map || !ex) return null;
  if (map[ex.id] != null) return map[ex.id];
  const twin = twinIds(ex).find((id) => map[id] != null && byId.get(id)?.eq === ex.eq);
  return twin ? map[twin] : null;
};

// Prudence pour une première fois : on commence un cran sous l'estimation.
export const FIRST_TIME = 0.9;
