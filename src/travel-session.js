// Séance « En voyage » : la séance prévue par le programme, refaite sans salle.
//
// Elle garde l'INTENTION du jour (force haut, force jambes, kettlebell, conditionnement,
// Hero) et sa STRUCTURE (séries classiques, ou blocs EMOM/AMRAP aux mêmes durées), pour
// que la semaine reste cohérente. Uniquement le poids du corps : aucun accessoire, ni
// sac, ni serviette, ni meuble — le sol, et un mur en intérieur.
//   intérieur  : sans bruit, aucun saut ni course.
//   extérieur  : sauts, sprints et course autorisés.
// La difficulté vient du tempo, de l'unilatéral et des pauses.

const X = (id, n, m, reps, cue) => ({ id, n, m, reps, cue });
const MOVES = Object.fromEntries([
  // ── Intérieur : sans bruit ──
  X("ti_push_tempo", "Pompes tempo 3-1-1", "Pecs · Triceps", "12", "Descente 3 s, pause 1 s à 2 cm du sol, remontée explosive."),
  X("ti_push_archer", "Pompes archer", "Pecs · Force", "6", "Un bras travaille, l'autre reste tendu sur le côté. 6 par côté."),
  X("ti_push_wall", "Pompes pieds au mur", "Pecs · Épaules", "10", "Pieds contre le mur à hauteur de hanches, corps gainé."),
  X("ti_pseudo", "Pompes pseudo-planche", "Pecs · Épaules", "8", "Mains au niveau des hanches, épaules en avant des mains."),
  X("ti_hindu", "Pompes hindoues", "Pecs · Épaules · Mobilité", "10", "Hanches hautes, plonge vers l'avant en rasant le sol, remonte en cobra."),
  X("ti_diamond", "Pompes diamant tempo", "Triceps", "10", "Mains en losange sous le sternum. Descente 3 s."),
  X("ti_sphinx", "Sphinx push-up", "Triceps", "10", "Avant-bras au sol, pousse jusqu'aux bras tendus sans avancer les épaules."),
  X("ti_pike", "Pike push-up", "Épaules", "10", "Hanches hautes, la tête descend devant les mains."),
  X("ti_hs_wall", "Handstand hold face au mur", "Épaules · Gainage", "30s", "Monte les pieds au mur, mains près du mur, bras verrouillés."),
  X("ti_prone_pull", "Tirage à plat ventre", "Dos", "12", "Ventre au sol, bras tendus devant : tire les coudes vers les côtes en serrant les omoplates, pause 2 s."),
  X("ti_ytw", "Y-T-W au sol", "Épaules · Haut du dos", "8", "Ventre au sol, pouces vers le haut. 8 Y, 8 T, 8 W sans reposer les bras."),
  X("ti_snow_angel", "Reverse snow angel", "Dos · Épaules", "12", "Ventre au sol, bras décollés : balaie des hanches au-dessus de la tête."),
  X("ti_superman", "Superman hold", "Lombaires · Dos", "30s", "Bras et jambes décollés, regard au sol."),
  X("ti_shoulder_tap", "Plank shoulder tap", "Gainage · Épaules", "20", "Pieds écartés, bassin immobile. Touche l'épaule opposée."),
  X("ti_pistol_wall", "Pistol squat main au mur", "Quads", "6", "Une main légère au mur pour l'équilibre, descente 3 s. 6 par jambe."),
  X("ti_shrimp", "Shrimp squat", "Quads · Fessiers", "6", "Tiens ton pied arrière, le genou arrière vient frôler le sol. 6 par jambe."),
  X("ti_split_tempo", "Fente arrière tempo 3 s", "Quads · Fessiers", "10", "Recul lent, genou arrière à 2 cm du sol. 10 par jambe."),
  X("ti_lat_lunge", "Fente latérale", "Adducteurs · Fessiers", "10", "Pied large sur le côté, hanche en arrière, l'autre jambe tendue."),
  X("ti_cossack", "Cossack squat lent", "Adducteurs · Quads", "8", "Pieds très écartés, bascule d'un côté à l'autre, talon au sol."),
  X("ti_bridge_1l", "Pont fessier une jambe pause 2 s", "Fessiers · Ischios", "12", "Talon proche des fesses, l'autre jambe tendue. 12 par côté."),
  X("ti_bridge_far", "Pont fessier talons loin", "Ischios", "12", "Talons loin des fesses : ce sont les ischios qui montent le bassin."),
  X("ti_sl_rdl", "Soulevé de terre une jambe", "Ischios · Équilibre", "10", "Dos plat, la jambe libre part en arrière, mains vers le sol. 10 par côté."),
  X("ti_wallsit_1l", "Chaise au mur une jambe", "Quads", "30s", "Dos au mur, cuisses parallèles, une jambe tendue devant. 30 s par jambe."),
  X("ti_sissy", "Sissy squat", "Quads", "10", "Sur la pointe des pieds, genoux vers l'avant, corps droit des genoux aux épaules."),
  X("ti_calf_1l", "Mollets une jambe", "Mollets", "20", "Sur une jambe, montée complète, pause 1 s en haut."),
  X("ti_squat_tempo", "Squat tempo 4-0-1", "Quads · Fessiers", "15", "Descente 4 s, remontée rapide."),
  X("ti_inchworm", "Inchworm + pompe", "Full body", "8", "Marche avec les mains jusqu'à la planche, une pompe, retour."),
  X("ti_climber_slow", "Mountain climber lent", "Cardio · Gainage", "30", "Genou à la poitrine, pied reposé sans bruit."),
  X("ti_hollow", "Hollow rock", "Abdos", "20", "Bas du dos collé au sol, on se balance sans casser la forme."),
  X("ti_vup", "V-up", "Abdos", "15", "Mains et pieds se rejoignent au-dessus des hanches."),
  X("ti_side_plank", "Planche latérale avec rotation", "Obliques", "10", "Le bras passe sous le corps puis s'ouvre vers le plafond. 10 par côté."),
  X("ti_shadow", "Shadow boxing", "Cardio", "40s", "Garde haute, enchaînements rapides, sans sauter."),
  X("ti_bear_hold", "Bear hold, genoux à 2 cm", "Gainage", "30s", "À quatre pattes, genoux juste décollés du sol, dos plat."),
  X("ti_crawl_place", "Bear crawl sur place", "Full body", "20", "Avance et recule d'un pas, genoux à 2 cm du sol, sans bruit."),
  // ── Extérieur : sauts et course permis ──
  X("to_clap", "Pompes claquées", "Pecs · Puissance", "8", "Poussée explosive, réception bras fléchis."),
  X("to_archer", "Pompes archer", "Pecs · Force", "8", "Un bras travaille, l'autre tendu. 8 par côté."),
  X("to_diamond", "Pompes diamant", "Triceps", "12", "Mains en losange sous le sternum, coudes serrés."),
  X("to_pike", "Pike push-up", "Épaules", "10", "Hanches hautes, tête devant les mains."),
  X("to_hindu", "Pompes hindoues", "Pecs · Épaules", "12", "Plonge vers l'avant en rasant le sol, remonte en cobra."),
  X("to_prone_pull", "Tirage à plat ventre", "Dos", "15", "Bras devant, tire les coudes vers les côtes, pause 2 s."),
  X("to_snow_angel", "Reverse snow angel", "Dos · Épaules", "15", "Ventre au sol, bras décollés, grand balayage."),
  X("to_pistol", "Pistol squat", "Quads", "6", "Sur une jambe, descente contrôlée, remontée sans élan. 6 par jambe."),
  X("to_shrimp", "Shrimp squat", "Quads · Fessiers", "8", "Tiens le pied arrière, genou qui frôle le sol."),
  X("to_sl_rdl", "Soulevé de terre une jambe", "Ischios", "12", "Dos plat, jambe libre en arrière. 12 par côté."),
  X("to_jump_lunge", "Fentes sautées", "Quads · Puissance", "20", "Changement de jambe en l'air, réception douce."),
  X("to_broad", "Broad jump", "Puissance", "8", "Saut en longueur pieds joints, réception stable."),
  X("to_squat_jump", "Squat sauté", "Puissance", "15", "Descente contrôlée, saut, réception douce."),
  X("to_skater", "Skater jump", "Jambes · Cardio", "16", "Bond latéral sur une jambe, réception stable."),
  X("to_walk_lunge", "Fentes marchées", "Quads · Fessiers", "20", "Genou arrière frôle le sol, buste droit."),
  X("to_burpee", "Burpee", "Full body", "12", "Poitrine au sol, saut et mains au-dessus de la tête."),
  X("to_burpee_broad", "Burpee broad jump", "Full body", "8", "Burpee puis saut en longueur, on enchaîne."),
  X("to_sprint", "Sprint 50 m", "Cardio", "50m", "À fond, retour en marchant."),
  X("to_run", "Course", "Cardio", "200m", "Allure soutenue."),
  X("to_bear", "Bear crawl", "Full body", "20m", "Genoux à 2 cm du sol, dos plat."),
  X("to_knees", "Montées de genoux", "Cardio", "40", "Genoux à la hanche, bras actifs."),
  X("to_vup", "V-up", "Abdos", "15", "Mains et pieds se rejoignent au-dessus des hanches."),
].map((e) => [e.id, e]));

// Emplacements par intention : chaque emplacement liste des options, la position dans
// le programme les fait tourner — deux voyages de suite ne donnent pas la même séance.
const PLANS = {
  indoor: {
    upper: [["ti_push_tempo", "ti_push_archer", "ti_pseudo"], ["ti_prone_pull", "ti_snow_angel", "ti_ytw"],
      ["ti_pike", "ti_hs_wall", "ti_push_wall"], ["ti_diamond", "ti_sphinx"], ["ti_hindu", "ti_shoulder_tap", "ti_superman"]],
    lower: [["ti_pistol_wall", "ti_shrimp"], ["ti_bridge_1l", "ti_sl_rdl"], ["ti_split_tempo", "ti_cossack", "ti_lat_lunge"],
      ["ti_bridge_far", "ti_sissy"], ["ti_wallsit_1l", "ti_calf_1l"]],
    // Métabolique : familles alternées dans chaque bloc (jambes, haut, moteur/gainage).
    metcon: [["ti_squat_tempo", "ti_split_tempo", "ti_cossack", "ti_bridge_1l", "ti_lat_lunge"],
      ["ti_push_tempo", "ti_inchworm", "ti_shoulder_tap", "ti_pike", "ti_prone_pull", "ti_crawl_place"],
      ["ti_climber_slow", "ti_shadow", "ti_hollow", "ti_vup", "ti_side_plank", "ti_bear_hold"]],
  },
  outdoor: {
    upper: [["to_clap", "to_archer"], ["to_prone_pull", "to_snow_angel"], ["to_pike", "to_hindu"],
      ["to_diamond"], ["to_bear"]],
    lower: [["to_pistol", "to_shrimp"], ["to_sl_rdl"], ["to_broad", "to_jump_lunge"],
      ["to_walk_lunge", "to_jump_lunge"], ["to_skater", "to_squat_jump"]],
    metcon: [["to_walk_lunge", "to_squat_jump", "to_skater", "to_jump_lunge", "to_broad"],
      ["to_clap", "to_hindu", "to_pike", "to_bear", "to_burpee_broad"],
      ["to_burpee", "to_sprint", "to_run", "to_knees", "to_vup"]],
  },
};
export const TRAVEL_LABEL = { indoor: "intérieur · sans bruit", outdoor: "extérieur" };

const at = (opts, seed) => MOVES[opts[((seed % opts.length) + opts.length) % opts.length]];
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
    label: `${day.label} · voyage`, muscle: `Sans salle · ${TRAVEL_LABEL[place] || TRAVEL_LABEL.indoor}`,
    badge: `En voyage · ${place === "outdoor" ? "extérieur" : "intérieur"}`, short: "VOYAGE",
  };
  if (k !== "metcon") {
    // Force : 5 exercices, les deux premiers en piliers (4 séries, repos plus long).
    const exercises = plan[k].map((opts, i) => bw(at(opts, seed + i), {
      sets: i < 2 ? 4 : 3, rest: i < 2 ? 90 : 60, role: i < 2 ? "pillar" : "accessory",
    }));
    return { ...base, recommendedMode: "classique", mode: "classique", blocks: undefined, exercises };
  }
  // Métabolique : mêmes blocs, mêmes formats et durées ; les mouvements tournent.
  const fam = plan.metcon;
  const used = fam.map((_, f) => seed + f);
  const srcBlocks = Array.isArray(day.blocks) && day.blocks.length ? day.blocks
    : [{ kind: "amrap", durationMin: 15, exercises: [{}, {}, {}] }];
  const blocks = srcBlocks.map((b, bi) => {
    const size = Math.max(2, Math.min(5, (b.exercises || []).length || 3));
    const exercises = Array.from({ length: size }, (_, j) => {
      const f = (j + bi) % fam.length, list = fam[f];
      const e = MOVES[list[(used[f]++) % list.length]];
      return bw(e, { id: `travel_${e.id}_${bi}_${j}`, baseId: e.id, sets: 1, rest: 0, role: "density", blockIdx: bi });
    });
    const emom = b.kind === "emom";
    const durationMin = emom ? Math.ceil((Number(b.durationMin) || 12) / size) * size : (Number(b.durationMin) || 15);
    return {
      label: `Bloc ${bi + 1} · ${emom ? "EMOM" : "AMRAP"} sans salle`, kind: emom ? "emom" : "amrap",
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
