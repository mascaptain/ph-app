// Échange de séances dans la file du programme.
//
// La file est une suite de positions (0, 1, 2…) ; la séance affichée à la position p
// est celle que le moteur a construite pour l'indice swaps[p] (p si aucun échange).
// Échanger p et q fait donc jouer aujourd'hui le contenu de q, et plus tard celui de p :
// rien n'est perdu ni dupliqué, l'équilibre de la semaine (force, kettlebell, Hero…)
// est conservé.
export const SWAP_RANGE = 5;

export const effectiveIndex = (swaps, position) => {
  const v = swaps && swaps[position];
  return Number.isInteger(Number(v)) && v !== undefined && v !== null ? Number(v) : position;
};

// Positions proposées à l'échange : les 5 suivantes, dans la limite du programme.
export const swapCandidates = (position, total) =>
  Array.from({ length: SWAP_RANGE }, (_, k) => position + 1 + k).filter((p) => p < total);

// Renvoie les nouveaux échanges après avoir permuté deux positions. Si les deux
// positions étaient déjà échangées entre elles, l'échange est annulé.
export const swapPositions = (swaps, a, b) => {
  const next = { ...(swaps || {}) };
  const ea = effectiveIndex(next, a), eb = effectiveIndex(next, b);
  const set = (p, e) => { if (e === p) delete next[p]; else next[p] = e; };
  set(a, eb); set(b, ea);
  return next;
};

// Les positions déjà jouées n'ont plus à être mémorisées.
export const pruneSwaps = (swaps, sessionIndex) => {
  const out = {};
  Object.keys(swaps || {}).forEach((k) => { if (Number(k) >= sessionIndex) out[k] = swaps[k]; });
  return out;
};
