// Séance « En voyage » : la séance prévue par le programme, refaite sans salle.
//
// Elle garde l'INTENTION du jour (force haut, force jambes, kettlebell, conditionnement,
// Hero) et sa STRUCTURE (séries classiques, ou blocs EMOM/AMRAP aux mêmes durées), pour
// que la semaine reste cohérente. Le matériel devient ce qu'on a vraiment sous la main :
//   intérieur  : chambre d'hôtel, sans bruit — sac à dos chargé (vêtements, bouteilles,
//                ~8-12 kg), lit, chaise, bureau, serviette, mur. Aucun saut ni course.
//   extérieur  : parc, plage, rue — banc, barre de parc, côte, escaliers ; sauts et
//                sprints autorisés.
// Le poids du corps ne suffit pas à un niveau avancé : la difficulté vient du tempo,
// de l'unilatéral, des pauses et du sac à dos.

const X = (id, n, m, reps, cue) => ({ id, n, m, reps, cue });
const MOVES = Object.fromEntries([
  // ── Intérieur ──
  X("ti_push_bed", "Pompes pieds sur le lit", "Pecs · Épaules", "12", "Pieds sur le lit, mains au sol. Descente 3 s, poitrine à 2 cm du sol."),
  X("ti_push_bag", "Pompes avec sac à dos", "Pecs · Triceps", "10", "Sac à dos chargé bien serré. Corps gainé, coudes à 45°."),
  X("ti_push_archer", "Pompes archer tempo 3-1-1", "Pecs · Force", "6", "Un bras travaille, l'autre reste tendu. 6 par côté."),
  X("ti_row_desk", "Rowing inversé sous le bureau", "Dos · Biceps", "10", "Sous un bureau ou une table SOLIDE, mains au bord. Tire la poitrine vers le plateau."),
  X("ti_row_towel", "Rowing serviette à la porte", "Dos", "12", "Serviette nouée à la poignée, porte FERMÉE vers toi. Pieds près de la porte, recule le buste."),
  X("ti_row_bag", "Rowing sac à dos un bras", "Dos épais", "12", "Main libre sur la chaise, dos plat. Coude vers la hanche, pause 1 s en haut."),
  X("ti_pike_chair", "Pike push-up pieds sur la chaise", "Épaules", "8", "Pieds sur la chaise, hanches hautes. La tête descend devant les mains."),
  X("ti_press_bag", "Développé sac à dos", "Épaules", "12", "Debout, sac tenu par les bretelles au niveau des épaules. Pousse au-dessus de la tête."),
  X("ti_hs_wall", "Handstand hold dos au mur", "Épaules · Gainage", "30s", "Pieds qui montent au mur, bras verrouillés, regard entre les mains."),
  X("ti_dips_chairs", "Dips entre deux chaises", "Triceps · Pecs", "10", "Deux chaises stables, dossiers vers l'extérieur. Descente lente, épaules basses."),
  X("ti_curl_bag", "Curl sac à dos tempo 3 s", "Biceps", "12", "Sac tenu par la poignée. Montée 1 s, descente 3 s."),
  X("ti_diamond", "Pompes diamant tempo", "Triceps", "10", "Mains en losange sous le sternum. Descente 3 s."),
  X("ti_ytw", "Y-T-W au sol", "Épaules · Haut du dos", "8", "Ventre au sol, pouces vers le haut. 8 Y, 8 T, 8 W sans reposer les bras."),
  X("ti_lat_bottles", "Élévations latérales bouteilles", "Épaules", "15", "Deux bouteilles pleines. Coudes légèrement fléchis, jusqu'à hauteur d'épaules."),
  X("ti_shoulder_tap", "Plank shoulder tap", "Gainage · Épaules", "20", "Pieds écartés, bassin immobile. Touche l'épaule opposée."),
  X("ti_bss_bed", "Squat bulgare pied sur le lit", "Quads · Fessiers", "10", "Pied arrière sur le lit, sac à dos sur le dos. Descente 3 s. 10 par jambe."),
  X("ti_pistol_bed", "Pistol assis sur le lit", "Quads", "6", "Sur une jambe, descends t'asseoir sur le bord du lit puis remonte sans élan."),
  X("ti_thrust_bed", "Hip thrust épaules sur le lit", "Fessiers", "12", "Épaules sur le lit, sac à dos sur les hanches. Pause 2 s en haut."),
  X("ti_bridge_1l", "Pont fessier une jambe pause 2 s", "Fessiers · Ischios", "12", "Talon proche des fesses, l'autre jambe tendue. 12 par côté."),
  X("ti_towel_curl", "Leg curl serviette au sol", "Ischios", "8", "Talons sur une serviette, sol lisse. Bassin haut, ramène les talons lentement."),
  X("ti_gm_bag", "Good morning une jambe sac à dos", "Ischios · Fessiers", "10", "Sac serré contre la poitrine, dos plat, hanche en arrière. 10 par côté."),
  X("ti_wallsit_bag", "Chaise contre le mur, sac sur les cuisses", "Quads", "60s", "Cuisses parallèles au sol, sac posé sur les genoux."),
  X("ti_cossack", "Cossack squat lent", "Adducteurs · Quads", "8", "Pieds très écartés, bascule d'un côté à l'autre, talon au sol."),
  X("ti_calf_step", "Mollets une jambe sur une marche", "Mollets", "15", "Avant du pied sur un livre ou une marche, pause 1 s en haut."),
  X("ti_slide_lunge", "Fentes arrière glissées serviette", "Quads · Fessiers", "10", "Pied arrière sur une serviette, glisse-le en arrière. 10 par jambe."),
  X("ti_goblet_bag", "Goblet squat sac à dos", "Quads · Fessiers", "15", "Sac serré contre la poitrine, coudes entre les genoux."),
  X("ti_thruster_bag", "Thruster sac à dos", "Full body", "12", "Squat puis développé dans le même geste."),
  X("ti_climber_slow", "Mountain climber glissé", "Cardio · Gainage", "30", "Pieds sur des serviettes : on glisse, on ne tape pas."),
  X("ti_hollow", "Hollow rock", "Abdos", "20", "Bas du dos collé au sol, on se balance sans casser la forme."),
  X("ti_bodysaw", "Body saw serviette", "Gainage", "12", "Gainage sur les avant-bras, pieds sur une serviette : avance et recule les épaules."),
  X("ti_inchworm", "Inchworm + pompe", "Full body", "8", "Marche avec les mains jusqu'à la planche, une pompe, retour."),
  X("ti_shadow", "Shadow boxing", "Cardio", "40s", "Garde haute, enchaînements rapides, sans sauter."),
  X("ti_twist_bag", "Russian twist sac à dos", "Abdos · Obliques", "20", "Pieds décollés, le sac passe d'une hanche à l'autre."),
  X("ti_bear_hold", "Bear hold, genoux à 2 cm", "Gainage", "30s", "À quatre pattes, genoux juste décollés du sol, dos plat."),
  // ── Extérieur ──
  X("to_pullup", "Tractions barre de parc", "Dos · Biceps", "6", "Prise large, menton au-dessus de la barre, descente contrôlée."),
  X("to_pullup_bag", "Tractions avec sac à dos", "Dos · Force", "5", "Sac chargé sur le dos. Amplitude complète."),
  X("to_row_bar", "Rowing inversé barre basse", "Dos", "12", "Barre à hauteur de hanches, corps gainé sous la barre."),
  X("to_push_bench", "Pompes pieds sur le banc", "Pecs · Épaules", "15", "Pieds sur le banc, descente 2 s."),
  X("to_clap", "Pompes claquées", "Pecs · Puissance", "8", "Poussée explosive, réception bras fléchis."),
  X("to_dips_bars", "Dips barres du parc", "Triceps · Pecs", "10", "Barres parallèles ou dossier de banc solide."),
  X("to_dips_bench", "Dips au banc", "Triceps", "15", "Mains au bord du banc, jambes tendues."),
  X("to_pike_bench", "Pike push-up pieds sur le banc", "Épaules", "10", "Hanches hautes, tête devant les mains."),
  X("to_bss_bench", "Squat bulgare pied sur le banc", "Quads · Fessiers", "12", "Pied arrière sur le banc, sac à dos si possible. 12 par jambe."),
  X("to_stepup", "Step-up banc genou haut", "Quads · Fessiers", "12", "Pousse sur la jambe du banc, genou opposé à la hanche. 12 par jambe."),
  X("to_jump_lunge", "Fentes sautées", "Quads · Puissance", "20", "Changement de jambe en l'air, réception douce."),
  X("to_broad", "Broad jump", "Puissance", "8", "Saut en longueur pieds joints, réception stable."),
  X("to_hill", "Sprints en côte", "Puissance · Cardio", "8x15m", "Côte ou escaliers, sprint à fond, retour en marchant."),
  X("to_stairs", "Montées d'escaliers", "Cardio · Jambes", "4x1min", "Une marche à la fois, vite ; retour en marchant."),
  X("to_pistol_bench", "Pistol au banc", "Quads", "6", "Descends t'asseoir sur le banc sur une jambe, remonte sans élan."),
  X("to_burpee", "Burpee", "Full body", "12", "Poitrine au sol, saut et mains au-dessus de la tête."),
  X("to_burpee_pull", "Burpee traction", "Full body", "8", "Burpee sous la barre, saut directement en traction."),
  X("to_sprint", "Sprint 50 m", "Cardio", "50m", "À fond, retour en marchant."),
  X("to_run", "Course", "Cardio", "200m", "Allure soutenue."),
  X("to_box_bench", "Saut sur le banc", "Puissance", "10", "Banc stable, réception les deux pieds, redescends en marchant."),
  X("to_bear", "Bear crawl", "Full body", "20m", "Genoux à 2 cm du sol, dos plat."),
  X("to_skater", "Skater jump", "Jambes · Cardio", "16", "Bond latéral sur une jambe, réception stable."),
  X("to_knees", "Montées de genoux", "Cardio", "40", "Genoux à la hanche, bras actifs."),
  X("to_walk_lunge", "Fentes marchées", "Quads · Fessiers", "20", "Genou arrière frôle le sol, buste droit."),
  X("to_squat_jump", "Squat sauté", "Puissance", "15", "Descente contrôlée, saut, réception douce."),
  X("to_nordic", "Nordic curl talons sous le banc", "Ischios", "5", "Talons coincés sous le banc, corps droit : descends le plus lentement possible, rattrape-toi avec les mains."),
  X("to_hang", "Suspension à la barre", "Préhension · Gainage", "40s", "Épaules actives, corps immobile."),
].map((e) => [e.id, e]));

// Emplacements par intention : chaque emplacement liste des options, la position dans
// le programme les fait tourner — deux voyages de suite ne donnent pas la même séance.
const PLANS = {
  indoor: {
    upper: [["ti_push_bed", "ti_push_bag", "ti_push_archer"], ["ti_row_desk", "ti_row_towel", "ti_row_bag"],
      ["ti_pike_chair", "ti_press_bag", "ti_hs_wall"], ["ti_dips_chairs", "ti_diamond"],
      ["ti_curl_bag", "ti_lat_bottles", "ti_ytw"]],
    lower: [["ti_bss_bed", "ti_pistol_bed"], ["ti_thrust_bed", "ti_bridge_1l"], ["ti_towel_curl", "ti_gm_bag"],
      ["ti_cossack", "ti_slide_lunge"], ["ti_calf_step", "ti_wallsit_bag"]],
    // Métabolique : familles alternées dans chaque bloc (jambes, haut, moteur/gainage),
    // sinon des blocs entiers de gainage sortaient pour un Hero.
    metcon: [["ti_goblet_bag", "ti_thruster_bag", "ti_slide_lunge", "ti_bridge_1l", "ti_cossack"],
      ["ti_push_bag", "ti_row_bag", "ti_inchworm", "ti_shoulder_tap", "ti_press_bag", "ti_dips_chairs"],
      ["ti_climber_slow", "ti_shadow", "ti_hollow", "ti_bodysaw", "ti_twist_bag", "ti_bear_hold"]],
  },
  outdoor: {
    upper: [["to_pullup", "to_pullup_bag"], ["to_push_bench", "to_clap"], ["to_row_bar", "to_hang"],
      ["to_dips_bars", "to_dips_bench"], ["to_pike_bench"]],
    lower: [["to_bss_bench", "to_pistol_bench"], ["to_stepup", "to_walk_lunge"], ["to_broad", "to_jump_lunge"],
      ["to_nordic"], ["to_skater", "to_squat_jump"]],
    metcon: [["to_walk_lunge", "to_stepup", "to_squat_jump", "to_skater", "to_box_bench"],
      ["to_pullup", "to_push_bench", "to_dips_bench", "to_burpee_pull", "to_bear"],
      ["to_burpee", "to_sprint", "to_run", "to_knees"]],
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
