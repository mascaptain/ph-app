import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "./supabase.js";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Apple dark system + Emil micro-interactions + Impeccable rules
// OKLCH-inspired palette. One accent. No border-left hacks. No nested cards.
// Letter-spacing floor: -0.03em on display. Body: 17px/1.47.
const C = {
  bg:      "#FFFFFF",
  s1:      "#F2F2F3",
  s2:      "#EAEAEB",
  s3:      "#DBDADD",
  s4:      "#C9C8CC",
  div:     "#DBDADD",
  ink:     "#000000",
  ink2:    "rgba(0,0,0,.82)",
  ink3:    "rgba(0,0,0,.56)",
  ink4:    "rgba(0,0,0,.40)",
  ink5:    "rgba(0,0,0,.16)",
  blue:    "#75FB90",
  blueDim: "rgba(117,251,144,.22)",
  green:   "#75FB90",
  greenDim:"rgba(117,251,144,.18)",
  red:     "#000000",
  redDim:  "rgba(0,0,0,.07)",
  orange:  "#000000",
  orDim:   "rgba(0,0,0,.06)",
  lime:    "#75FB90",
  purple:  "#AAA9AB",
  purDim:  "rgba(170,169,171,.16)",
};

const F = "'Urbanist',system-ui,sans-serif";

// Emil: custom curves only — never ease/ease-in/linear for UI
const EO  = "cubic-bezier(0.23,1,0.32,1)";      // strong ease-out
const EIO = "cubic-bezier(0.77,0,0.175,1)";      // ease-in-out for on-screen
const ED  = "cubic-bezier(0.32,0.72,0,1)";       // drawer/sheet

const DUR = { btn: "160ms", tooltip: "125ms", dropdown: "200ms", modal: "340ms", page: "280ms" };

// Z-index scale — semantic, never arbitrary
const Z = { sticky: 100, overlay: 200, sheet: 300, rest: 400, fullscreen: 500, auth: 900 };

// ─── EXERCISE DATABASE — 150+ ─────────────────────────────────────────────────
const DB = [
  // KETTLEBELL (25)
  {id:"kb01",n:"Swing KB deux mains",m:"Fessiers · Ischios",eq:"kb",kg:20,reps:"15",rest:60,rpe:7,cue:"Poussée de hanches explosive. Dos neutre. KB à hauteur d'épaules."},
  {id:"kb02",n:"Swing KB unilatéral",m:"Fessiers · Core",eq:"kb",kg:16,reps:"10",rest:60,rpe:7,cue:"Même mécanique. Résiste à la rotation du tronc."},
  {id:"kb03",n:"Clean KB",m:"Full body",eq:"kb",kg:16,reps:"8",rest:90,rpe:7,cue:"KB tracte sur le côté. Vient en rack sans impact au poignet."},
  {id:"kb04",n:"Clean & Press KB",m:"Épaules · Full body",eq:"kb",kg:14,reps:"6",rest:120,rpe:8,cue:"Clean + press vertical. Core serré."},
  {id:"kb05",n:"Push Press KB",m:"Épaules · Jambes",eq:"kb",kg:16,reps:"8",rest:90,rpe:7,cue:"Légère impulsion jambes. Bras verrouillé en haut. Descente lente."},
  {id:"kb06",n:"Snatch KB",m:"Full body",eq:"kb",kg:12,reps:"5",rest:120,rpe:8,cue:"Du sol au lockout en un geste. Punch vers le haut en fin de trajectoire."},
  {id:"kb07",n:"Turkish Get-Up",m:"Full body · Core",eq:"kb",kg:12,reps:"3",rest:120,rpe:8,cue:"KB verrouillé bras tendu. 7 étapes. Lent et contrôlé."},
  {id:"kb08",n:"Gobelet Squat KB",m:"Quads · Fessiers",eq:"kb",kg:20,reps:"12",rest:90,rpe:6,cue:"KB contre la poitrine. Coudes entre genoux. Sous la parallèle."},
  {id:"kb09",n:"Halo KB",m:"Épaules · Core",eq:"kb",kg:10,reps:"10",rest:60,rpe:5,cue:"Orbite complète autour de la tête. Core anti-rotation."},
  {id:"kb10",n:"Farmer Carry KB",m:"Trapèzes · Core",eq:"kb",kg:24,reps:"40m",rest:90,rpe:7,cue:"Épaules en arrière. Regard horizontal. Core engagé."},
  {id:"kb11",n:"Row KB unilatéral",m:"Dos · Biceps",eq:"kb",kg:20,reps:"10",rest:90,rpe:7,cue:"Coude vers la hanche. Rétraction omoplate avant."},
  {id:"kb12",n:"Deadlift KB",m:"Ischios · Fessiers",eq:"kb",kg:24,reps:"8",rest:90,rpe:7,cue:"Charnière hanche. KB entre les pieds. Dos neutre."},
  {id:"kb13",n:"Windmill KB",m:"Core · Épaules",eq:"kb",kg:12,reps:"5",rest:90,rpe:7,cue:"KB verrouillé en haut. Rotation hanche pure. Regard sur le KB."},
  {id:"kb14",n:"Floor Press KB",m:"Pecs · Triceps",eq:"kb",kg:16,reps:"10",rest:90,rpe:7,cue:"Au sol. Coude 45°. Amplitude réduite, tension maximale."},
  {id:"kb15",n:"Complex KB Swing+Clean+Press",m:"Full body",eq:"kb",kg:14,reps:"5",rest:120,rpe:9,cue:"Swing+Clean+Press = 1 rep. Rythme constant. Qualité avant vitesse."},
  {id:"kb16",n:"EMOM Swing KB",m:"Full body",eq:"kb",kg:20,reps:"20",rest:30,rpe:8,cue:"20 swings toutes les minutes. Repos = temps restant."},
  {id:"kb17",n:"Rack Walk KB",m:"Core · Épaules",eq:"kb",kg:20,reps:"30m",rest:90,rpe:6,cue:"KB en rack. Tronc anti-rotation."},
  {id:"kb18",n:"Figure 8 KB",m:"Core · Épaules",eq:"kb",kg:14,reps:"10",rest:60,rpe:5,cue:"Transfert entre jambes. Dos neutre à chaque passage."},
  {id:"kb19",n:"Sumo Deadlift KB",m:"Fessiers · Adducteurs",eq:"kb",kg:24,reps:"10",rest:90,rpe:6,cue:"Stance large. Genoux vers l'extérieur. KB descend vertical."},
  {id:"kb20",n:"Press KB assis",m:"Épaules · Core",eq:"kb",kg:12,reps:"8",rest:90,rpe:7,cue:"Assis en tailleur. Aucune aide des jambes. Force brute."},
  {id:"kb21",n:"Deadlift KB unilatéral",m:"Ischios · Équilibre",eq:"kb",kg:20,reps:"8",rest:90,rpe:7,cue:"Charnière sur une jambe. KB le long de la jambe d'appui."},
  {id:"kb22",n:"Around the World KB",m:"Core · Épaules",eq:"kb",kg:12,reps:"8",rest:60,rpe:5,cue:"Passage fluide d'une main à l'autre dans le plan frontal."},
  {id:"kb23",n:"Pass Under KB",m:"Core · Fessiers",eq:"kb",kg:14,reps:"10",rest:60,rpe:5,cue:"KB sous le genou levé. Transfert propre."},
  {id:"kb24",n:"Hip Thrust KB",m:"Fessiers",eq:"kb",kg:24,reps:"12",rest:90,rpe:6,cue:"KB sur les hanches. Extension complète en haut."},
  {id:"kb25",n:"Snatch KB low rep",m:"Full body",eq:"kb",kg:16,reps:"3",rest:120,rpe:9,cue:"Concentre-toi sur la qualité. Pause lockout 1 sec."},
  // BARBELL (18)
  {id:"bb01",n:"Développé couché barre",m:"Pecs",eq:"bar",kg:60,reps:"5",rest:240,rpe:8,cue:"Pause 1s sur la poitrine. Pas de rebond."},
  {id:"bb02",n:"Développé militaire barre",m:"Épaules",eq:"bar",kg:40,reps:"5",rest:180,rpe:8,cue:"Core serré. Verrouillage complet en haut."},
  {id:"bb03",n:"Squat barre",m:"Quads · Fessiers",eq:"bar",kg:80,reps:"5",rest:240,rpe:8,cue:"Sous la parallèle. Regard 45°."},
  {id:"bb04",n:"Soulevé de terre conv.",m:"Full body",eq:"bar",kg:100,reps:"3",rest:300,rpe:9,cue:"Dos neutre absolu. Barre collée aux tibias."},
  {id:"bb05",n:"Hip Thrust barre",m:"Fessiers",eq:"bar",kg:80,reps:"10",rest:150,rpe:7,cue:"Dos sur banc. Barre sur hanches. Extension complète."},
  {id:"bb06",n:"Rowing barre pronation",m:"Dos épais",eq:"bar",kg:60,reps:"8",rest:150,rpe:7,cue:"Buste 45°. Barre vers le nombril. Rétraction omoplates."},
  {id:"bb07",n:"Romanian Deadlift barre",m:"Ischios · Fessiers",eq:"bar",kg:70,reps:"8",rest:180,rpe:7,cue:"Charnière hanche. Barre le long des cuisses."},
  {id:"bb08",n:"Curl barre EZ",m:"Biceps",eq:"bar",kg:30,reps:"10",rest:90,rpe:7,cue:"Coudes fixes. 3s descente."},
  {id:"bb09",n:"Front Squat barre",m:"Quads · Core",eq:"bar",kg:60,reps:"5",rest:240,rpe:8,cue:"Coudes hauts. Torse vertical."},
  {id:"bb10",n:"Skull Crusher EZ",m:"Triceps",eq:"bar",kg:25,reps:"10",rest:90,rpe:7,cue:"Coudes fixes. Descente vers le front. Extension explosive."},
  {id:"bb11",n:"Good Morning barre",m:"Ischios · Lombaires",eq:"bar",kg:40,reps:"8",rest:120,rpe:6,cue:"Genoux légèrement fléchis. Charnière hanche pure."},
  {id:"bb12",n:"Power Clean barre",m:"Full body",eq:"bar",kg:50,reps:"3",rest:180,rpe:9,cue:"Triple extension. Tirage haut. Coulissement sous la barre."},
  {id:"bb13",n:"Bench Press prise serrée",m:"Triceps · Pecs",eq:"bar",kg:50,reps:"8",rest:120,rpe:7,cue:"Prise épaule-largeur. Coudes collés au corps."},
  {id:"bb14",n:"Deadlift roumain barre",m:"Ischios",eq:"bar",kg:70,reps:"8",rest:150,rpe:7,cue:"Hanches en arrière. Ressens l'étirement ischios."},
  {id:"bb15",n:"Rowing Pendlay",m:"Dos épais",eq:"bar",kg:60,reps:"5",rest:180,rpe:8,cue:"Barre au sol entre chaque rep. Explosif. Torse horizontal."},
  {id:"bb16",n:"Squat bulgare barre",m:"Quads · Fessiers",eq:"bar",kg:40,reps:"8",rest:150,rpe:8,cue:"Pied arrière surélevé. Descente verticale."},
  {id:"bb17",n:"Développé incliné barre",m:"Pecs sup",eq:"bar",kg:50,reps:"8",rest:150,rpe:7,cue:"Banc 30°. Focus partie haute des pecs."},
  {id:"bb18",n:"Zercher Squat",m:"Quads · Core · Biceps",eq:"bar",kg:50,reps:"6",rest:180,rpe:8,cue:"Barre dans les creux des coudes. Torse vertical. Core maximal."},
  // DUMBBELL (20)
  {id:"db01",n:"Développé couché haltères",m:"Pecs",eq:"db",kg:24,reps:"10",rest:120,rpe:7,cue:"Rotation interne en haut. Descente coudes 45°."},
  {id:"db02",n:"Développé incliné haltères",m:"Pecs sup",eq:"db",kg:20,reps:"10",rest:120,rpe:7,cue:"Banc 30°. Contraction en haut."},
  {id:"db03",n:"Curl haltères alternés",m:"Biceps",eq:"db",kg:14,reps:"10",rest:90,rpe:6,cue:"Supination complète. Coudes fixes. 3s descente."},
  {id:"db04",n:"Curl marteau haltères",m:"Biceps · Brachial",eq:"db",kg:16,reps:"10",rest:90,rpe:6,cue:"Prise neutre. Coudes fixes."},
  {id:"db05",n:"Curl incliné haltères",m:"Biceps long",eq:"db",kg:12,reps:"10",rest:90,rpe:6,cue:"Banc 60°. Stretch maximal en bas."},
  {id:"db06",n:"Rowing haltère unilatéral",m:"Dos épais",eq:"db",kg:24,reps:"10",rest:90,rpe:7,cue:"Coude vers la hanche. Omoplate rétractée."},
  {id:"db07",n:"Élévations latérales",m:"Deltoïdes lat.",eq:"db",kg:10,reps:"15",rest:75,rpe:6,cue:"Légère flexion coude. Horizontal. 3s descente."},
  {id:"db08",n:"Oiseau inversé haltères",m:"Rear delt",eq:"db",kg:8,reps:"15",rest:60,rpe:6,cue:"Buste horizontal. Pincement omoplates."},
  {id:"db09",n:"Arnold Press",m:"Épaules complet",eq:"db",kg:14,reps:"10",rest:90,rpe:7,cue:"Rotation pronation→supination pendant le press."},
  {id:"db10",n:"RDL haltères",m:"Ischios · Fessiers",eq:"db",kg:22,reps:"10",rest:120,rpe:7,cue:"Charnière hanche. Haltères le long des cuisses."},
  {id:"db11",n:"Fentes marchées haltères",m:"Quads · Fessiers",eq:"db",kg:16,reps:"12",rest:90,rpe:7,cue:"Genou avant 90°. Genou arrière effleure le sol."},
  {id:"db12",n:"Pullover haltère",m:"Grand dorsal · Pecs",eq:"db",kg:20,reps:"12",rest:90,rpe:6,cue:"Arc de cercle. Côtes fermées. Étirement maximal."},
  {id:"db13",n:"Extensions triceps haltère",m:"Triceps",eq:"db",kg:12,reps:"12",rest:75,rpe:6,cue:"Coude immobile. Extension complète."},
  {id:"db14",n:"Développé militaire haltères",m:"Épaules",eq:"db",kg:18,reps:"10",rest:90,rpe:7,cue:"Coudes 90° en bas. Extension complète."},
  {id:"db15",n:"Step-up haltères",m:"Quads · Fessiers",eq:"db",kg:16,reps:"10",rest:90,rpe:6,cue:"Appui sur le talon en haut. Extension complète de hanche."},
  {id:"db16",n:"Shrug haltères",m:"Trapèzes",eq:"db",kg:26,reps:"15",rest:60,rpe:6,cue:"Haussement pur. Pas de rotation. Maintien 1s en haut."},
  {id:"db17",n:"Gobelet Squat haltère",m:"Quads · Fessiers",eq:"db",kg:24,reps:"12",rest:90,rpe:6,cue:"Haltère vertical sous le menton. Coudes entre genoux."},
  {id:"db18",n:"Fly haltères couché",m:"Pecs",eq:"db",kg:14,reps:"12",rest:90,rpe:6,cue:"Arc de cercle. Légère flexion coude. Étirement maximal."},
  {id:"db19",n:"Reverse fly haltères",m:"Rear delt · Dos",eq:"db",kg:8,reps:"15",rest:60,rpe:5,cue:"Buste à 45°. Élévation latérale arrière. Lent."},
  {id:"db20",n:"Concentration curl",m:"Biceps",eq:"db",kg:12,reps:"12",rest:75,rpe:7,cue:"Coude contre la cuisse. Isolation totale. Lent."},
  // BODYWEIGHT (15)
  {id:"bw01",n:"Tractions prise large",m:"Dos large · Biceps",eq:"bw",kg:0,reps:"6",rest:180,rpe:8,cue:"Descente bras tendus complète. Sternum vers la barre."},
  {id:"bw02",n:"Chin-up supination",m:"Biceps · Dos",eq:"bw",kg:0,reps:"8",rest:150,rpe:7,cue:"Supination complète. Coudes vers les hanches en haut."},
  {id:"bw03",n:"Tractions neutres",m:"Dos · Brachial",eq:"bw",kg:0,reps:"7",rest:150,rpe:7,cue:"Prise en marteau. Elbows back."},
  {id:"bw04",n:"Dips barres parallèles",m:"Triceps · Pecs",eq:"bw",kg:0,reps:"10",rest:120,rpe:7,cue:"Descente lente 3s. Coudes derrière."},
  {id:"bw05",n:"Push-up",m:"Pecs · Triceps",eq:"bw",kg:0,reps:"20",rest:60,rpe:5,cue:"Corps aligné. Coudes 45°. Poitrine touche le sol."},
  {id:"bw06",n:"Push-up archer",m:"Pecs · Épaules",eq:"bw",kg:0,reps:"8",rest:90,rpe:7,cue:"Un bras tendu sur le côté pendant la descente."},
  {id:"bw07",n:"Pike Push-up",m:"Épaules",eq:"bw",kg:0,reps:"12",rest:90,rpe:6,cue:"Hanches hautes. Tête vers le sol."},
  {id:"bw08",n:"Dragon Flag",m:"Core complet",eq:"bw",kg:0,reps:"6",rest:120,rpe:9,cue:"Corps rigide. Descente lente contrôlée."},
  {id:"bw09",n:"L-Sit",m:"Core · Triceps",eq:"bw",kg:0,reps:"20s",rest:90,rpe:8,cue:"Bras verrouillés. Jambes horizontales."},
  {id:"bw10",n:"Relevé de jambes suspendu",m:"Abdos bas",eq:"bw",kg:0,reps:"12",rest:90,rpe:7,cue:"Pas de balancement. Contrôle descente."},
  {id:"bw11",n:"Pistol Squat",m:"Quads · Équilibre",eq:"bw",kg:0,reps:"5",rest:120,rpe:9,cue:"Descente contrôlée. Jambe libre tendue."},
  {id:"bw12",n:"Nordic Curl",m:"Ischios",eq:"bw",kg:0,reps:"5",rest:120,rpe:9,cue:"Descente lente excentrique. Pousse avec les mains en bas."},
  {id:"bw13",n:"Handstand Push-up",m:"Épaules · Triceps",eq:"bw",kg:0,reps:"5",rest:120,rpe:9,cue:"Contre le mur. Core serré. Descente lente."},
  {id:"bw14",n:"Ab Rollout",m:"Core complet",eq:"bw",kg:0,reps:"10",rest:90,rpe:8,cue:"Bras tendus. Corps rigide. Ne laisse pas le dos se creuser."},
  {id:"bw15",n:"Muscle-up",m:"Dos · Triceps · Core",eq:"bw",kg:0,reps:"3",rest:180,rpe:10,cue:"Transition explosive. Pousse au-dessus de la barre."},
  // MACHINE (12)
  {id:"mc01",n:"Lat Pulldown câble",m:"Dos large",eq:"mc",kg:50,reps:"12",rest:90,rpe:6,cue:"Barre vers haut de la poitrine. Coudes vers les hanches."},
  {id:"mc02",n:"Rowing câble assis",m:"Dos épais",eq:"mc",kg:50,reps:"12",rest:90,rpe:6,cue:"Tirage vers le nombril. Rétraction omoplates."},
  {id:"mc03",n:"Face Pull câble",m:"Rear delt",eq:"mc",kg:15,reps:"15",rest:60,rpe:5,cue:"Tirage vers le visage. Coudes à hauteur des épaules."},
  {id:"mc04",n:"Leg Press",m:"Quads · Fessiers",eq:"mc",kg:100,reps:"12",rest:120,rpe:7,cue:"Pieds largeur d'épaules. Descente 90°. Pas de rebond."},
  {id:"mc05",n:"Leg Curl",m:"Ischios",eq:"mc",kg:35,reps:"12",rest:90,rpe:6,cue:"Hanche collée. Flexion 90°. Descente 3s."},
  {id:"mc06",n:"Chest Press machine",m:"Pecs",eq:"mc",kg:50,reps:"12",rest:90,rpe:6,cue:"Poignées hauteur de poitrine. Pression constante."},
  {id:"mc07",n:"Leg Extension",m:"Quads",eq:"mc",kg:40,reps:"15",rest:90,rpe:6,cue:"Extension complète. Maintien 1s en haut. Descente lente."},
  {id:"mc08",n:"Calf Raise machine",m:"Mollets",eq:"mc",kg:60,reps:"20",rest:60,rpe:6,cue:"Amplitude complète. Monte sur la pointe."},
  {id:"mc09",n:"Pec Deck machine",m:"Pecs",eq:"mc",kg:40,reps:"15",rest:75,rpe:6,cue:"Coudes légèrement fléchis. Pince forte en fermeture."},
  {id:"mc10",n:"Shoulder Press machine",m:"Épaules",eq:"mc",kg:40,reps:"12",rest:90,rpe:6,cue:"Extension complète sans hyperextension."},
  {id:"mc11",n:"Cable Fly",m:"Pecs",eq:"mc",kg:12,reps:"15",rest:75,rpe:6,cue:"Poulies en haut. Arc de cercle vers le bas. Contraction."},
  {id:"mc12",n:"Triceps Pushdown câble",m:"Triceps",eq:"mc",kg:20,reps:"15",rest:75,rpe:6,cue:"Coudes fixes. Extension complète. Descente contrôlée."},
  // CARDIO (8)
  {id:"cd01",n:"SkiErg Sprints 20/10",m:"Full body · Cardio",eq:"cd",kg:0,reps:"8×20s",rest:10,rpe:9,cue:"Double bras. Poussée hanches + bras. Max effort 20s."},
  {id:"cd02",n:"Rameur Intervals 500m",m:"Full body · Cardio",eq:"cd",kg:0,reps:"4×500m",rest:60,rpe:8,cue:"Drive jambes → tronc → bras. Ratio 1:2."},
  {id:"cd03",n:"Vélo HIIT 30/30",m:"Cardio · Jambes",eq:"cd",kg:0,reps:"10×30s",rest:30,rpe:8,cue:"Sprint 30s / récup 30s."},
  {id:"cd04",n:"Corde à sauter",m:"Cardio",eq:"cd",kg:0,reps:"3×1min",rest:30,rpe:7,cue:"Appuis avant du pied. Poignets, pas les bras."},
  {id:"cd05",n:"Battle Ropes",m:"Cardio · Bras",eq:"cd",kg:0,reps:"4×30s",rest:30,rpe:8,cue:"Genoux fléchis. Core engagé."},
  {id:"cd06",n:"Burpee",m:"Full body · Cardio",eq:"cd",kg:0,reps:"10",rest:60,rpe:8,cue:"Planche → push-up → saut. Pas de pause."},
  {id:"cd07",n:"Box Jump",m:"Jambes · Puissance",eq:"cd",kg:0,reps:"8",rest:90,rpe:7,cue:"Atterrissage amorti. Extension complète en haut."},
  {id:"cd08",n:"Sprint 100m",m:"Full body · Cardio",eq:"cd",kg:0,reps:"6×100m",rest:120,rpe:9,cue:"Départ bas. Montée progressive. Max effort."},
  // ABS (10)
  {id:"ab01",n:"Crunch câble",m:"Abdos",eq:"mc",kg:15,reps:"15",rest:60,rpe:6,cue:"Flexion colonne, pas hanches. Contraction maximale en bas."},
  {id:"ab02",n:"Russian Twist",m:"Obliques",eq:"bw",kg:0,reps:"20",rest:60,rpe:6,cue:"Pieds décollés. Rotation complète. Contrôle."},
  {id:"ab03",n:"Hollow Body Hold",m:"Core complet",eq:"bw",kg:0,reps:"30s",rest:60,rpe:7,cue:"Bas du dos collé. Bras et jambes décollés. Banane."},
  {id:"ab04",n:"Planche",m:"Core",eq:"bw",kg:0,reps:"45s",rest:45,rpe:6,cue:"Corps rigide. Core engagé. Respiration normale."},
  {id:"ab05",n:"Planche dynamique",m:"Core · Épaules",eq:"bw",kg:0,reps:"10",rest:60,rpe:7,cue:"De la planche au push-up et retour. Corps rigide."},
  {id:"ab06",n:"Dead Bug",m:"Core · Coordination",eq:"bw",kg:0,reps:"10",rest:60,rpe:5,cue:"Bas du dos collé. Étends bras et jambe opposés simultanément."},
  {id:"ab07",n:"Side Planche",m:"Obliques · Core",eq:"bw",kg:0,reps:"30s",rest:45,rpe:7,cue:"Corps aligné. Hanche décollée. Regard droit."},
  {id:"ab08",n:"Pallof Press câble",m:"Core anti-rotation",eq:"mc",kg:10,reps:"12",rest:60,rpe:6,cue:"Résiste à la rotation. Presse et ramène. Lent."},
  {id:"ab09",n:"Hanging Knee Raise",m:"Abdos · Fléchisseurs",eq:"bw",kg:0,reps:"15",rest:60,rpe:6,cue:"Pas de balancement. Genou vers la poitrine. Contrôle."},
  {id:"ab10",n:"L-Sit pull-up",m:"Core · Dos · Abdos",eq:"bw",kg:0,reps:"5",rest:120,rpe:9,cue:"Jambes horizontales pendant la traction. Ultra intense."},

  // ── EXTENSION BIBLIOTHÈQUE (hybride) ──
  {id:"x001",n:"Back Squat",m:"Quads · Fessiers",eq:"bar",kg:60,reps:"5",rest:180,rpe:8,cue:"Barre haute. Descends sous parallèle. Gainage max."},
  {id:"x002",n:"Front Squat",m:"Quads · Core",eq:"bar",kg:50,reps:"5",rest:180,rpe:8,cue:"Coudes hauts. Tronc vertical. Talons ancrés."},
  {id:"x003",n:"Box Squat",m:"Quads · Fessiers",eq:"bar",kg:60,reps:"5",rest:180,rpe:7,cue:"Assieds sur la box. Explose à la remontée."},
  {id:"x004",n:"Pause Squat",m:"Quads",eq:"bar",kg:50,reps:"3",rest:180,rpe:8,cue:"2s en bas sans rebond. Reste serré."},
  {id:"x005",n:"Soulevé de terre",m:"Ischios · Dos",eq:"bar",kg:80,reps:"5",rest:210,rpe:8,cue:"Barre contre tibias. Dos neutre. Pousse le sol."},
  {id:"x006",n:"Soulevé sumo",m:"Fessiers · Adducteurs",eq:"bar",kg:80,reps:"5",rest:210,rpe:8,cue:"Pieds larges. Genoux vers l'extérieur. Buste droit."},
  {id:"x007",n:"Soulevé roumain",m:"Ischios · Fessiers",eq:"bar",kg:60,reps:"8",rest:150,rpe:7,cue:"Charnière hanche. Légère flexion genoux. Étire."},
  {id:"x008",n:"Deficit Deadlift",m:"Ischios · Dos",eq:"bar",kg:70,reps:"4",rest:210,rpe:8,cue:"Debout sur disque. Amplitude accrue."},
  {id:"x009",n:"Rack Pull",m:"Dos · Trapèzes",eq:"bar",kg:90,reps:"5",rest:180,rpe:8,cue:"Départ aux genoux. Tire fort en fin."},
  {id:"x010",n:"Good Morning",m:"Ischios · Lombaires",eq:"bar",kg:40,reps:"8",rest:120,rpe:7,cue:"Barre haut du dos. Hanche en arrière. Dos plat."},
  {id:"x011",n:"Hip Thrust barre",m:"Fessiers",eq:"bar",kg:70,reps:"10",rest:120,rpe:7,cue:"Dos sur banc. Verrouille fessiers en haut 1s."},
  {id:"x012",n:"Développé couché",m:"Pecs · Triceps",eq:"bar",kg:60,reps:"5",rest:180,rpe:8,cue:"Omoplates serrées. Barre au sternum. Pieds ancrés."},
  {id:"x013",n:"Couché incliné",m:"Pecs sup",eq:"bar",kg:45,reps:"8",rest:150,rpe:7,cue:"Banc 30°. Trajectoire vers le haut des pecs."},
  {id:"x014",n:"Couché prise serrée",m:"Triceps · Pecs",eq:"bar",kg:45,reps:"8",rest:120,rpe:7,cue:"Mains largeur épaules. Coudes près du corps."},
  {id:"x015",n:"Floor Press",m:"Pecs · Triceps",eq:"bar",kg:50,reps:"6",rest:120,rpe:7,cue:"Au sol. Coudes touchent puis explose."},
  {id:"x016",n:"Développé militaire",m:"Épaules",eq:"bar",kg:40,reps:"5",rest:150,rpe:8,cue:"Debout. Barre au menton. Verrouille au-dessus."},
  {id:"x017",n:"Push Press barre",m:"Épaules · Jambes",eq:"bar",kg:45,reps:"5",rest:150,rpe:7,cue:"Impulsion jambes. Lockout franc."},
  {id:"x018",n:"Rowing barre",m:"Dos épais",eq:"bar",kg:50,reps:"8",rest:120,rpe:7,cue:"Buste à 45°. Barre au nombril. Squeeze."},
  {id:"x019",n:"Rowing Pendlay",m:"Dos épais",eq:"bar",kg:55,reps:"6",rest:120,rpe:8,cue:"Barre repart du sol chaque rep. Explosif."},
  {id:"x020",n:"Rowing Yates",m:"Dos · Biceps",eq:"bar",kg:55,reps:"8",rest:120,rpe:7,cue:"Prise supination. Buste 60°. Coudes serrés."},
  {id:"x021",n:"Curl barre",m:"Biceps",eq:"bar",kg:25,reps:"10",rest:90,rpe:7,cue:"Coudes fixes. Pas d'élan. Contraction haute."},
  {id:"x022",n:"Hip Hinge clean",m:"Full body",eq:"bar",kg:40,reps:"5",rest:120,rpe:7,cue:"Tire explosif. Réception en rack."},
  {id:"x023",n:"Power Clean",m:"Full body",eq:"bar",kg:45,reps:"3",rest:180,rpe:9,cue:"Triple extension. Réception quart de squat."},
  {id:"x024",n:"Hang Clean",m:"Full body",eq:"bar",kg:40,reps:"3",rest:180,rpe:8,cue:"Départ aux genoux. Coudes rapides."},
  {id:"x025",n:"Power Snatch",m:"Full body",eq:"bar",kg:30,reps:"3",rest:180,rpe:9,cue:"Du sol au lockout en un geste. Punch."},
  {id:"x026",n:"Overhead Squat",m:"Full body · Mobilité",eq:"bar",kg:30,reps:"5",rest:150,rpe:8,cue:"Barre verrouillée au-dessus. Squat profond."},
  {id:"x027",n:"Thruster barre",m:"Full body",eq:"bar",kg:40,reps:"8",rest:120,rpe:8,cue:"Front squat enchaîné au press. Fluide."},
  {id:"x028",n:"Zercher Squat",m:"Quads · Core",eq:"bar",kg:45,reps:"6",rest:150,rpe:8,cue:"Barre au creux des coudes. Tronc gainé."},
  {id:"x029",n:"Split Squat barre",m:"Quads · Fessiers",eq:"bar",kg:40,reps:"8",rest:120,rpe:7,cue:"Fente arrière. Genou frôle le sol."},
  {id:"x030",n:"Goblet Squat haltère",m:"Quads · Fessiers",eq:"db",kg:24,reps:"12",rest:90,rpe:6,cue:"Haltère vertical contre poitrine. Profond."},
  {id:"x031",n:"Fentes haltères",m:"Quads · Fessiers",eq:"db",kg:18,reps:"10",rest:90,rpe:7,cue:"Pas long. Genou arrière vers le sol."},
  {id:"x032",n:"Fentes marchées",m:"Quads · Fessiers",eq:"db",kg:16,reps:"20m",rest:90,rpe:7,cue:"Avance en alternant. Buste droit."},
  {id:"x033",n:"Bulgarian Split Squat",m:"Quads · Fessiers",eq:"db",kg:16,reps:"10",rest:90,rpe:8,cue:"Pied arrière sur banc. Descente verticale."},
  {id:"x034",n:"Step-up haltères",m:"Quads · Fessiers",eq:"db",kg:16,reps:"10",rest:90,rpe:7,cue:"Pousse sur le talon. Contrôle la descente."},
  {id:"x035",n:"Soulevé roumain haltères",m:"Ischios",eq:"db",kg:22,reps:"10",rest:120,rpe:7,cue:"Charnière hanche. Haltères longent les jambes."},
  {id:"x036",n:"Développé haltères",m:"Pecs",eq:"db",kg:24,reps:"10",rest:120,rpe:7,cue:"Descente large. Presse en convergence."},
  {id:"x037",n:"Couché incliné haltères",m:"Pecs sup",eq:"db",kg:20,reps:"10",rest:120,rpe:7,cue:"Banc 30°. Étire bien en bas."},
  {id:"x038",n:"Écarté haltères",m:"Pecs",eq:"db",kg:12,reps:"12",rest:90,rpe:6,cue:"Arc large. Léger fléchi des coudes."},
  {id:"x039",n:"Pull-over haltère",m:"Pecs · Dos",eq:"db",kg:16,reps:"12",rest:90,rpe:6,cue:"Bras semi-tendus. Étire la cage."},
  {id:"x040",n:"Développé Arnold",m:"Épaules",eq:"db",kg:14,reps:"10",rest:90,rpe:7,cue:"Rotation paume vers l'avant en montant."},
  {id:"x041",n:"Développé épaules haltères",m:"Épaules",eq:"db",kg:16,reps:"10",rest:120,rpe:7,cue:"Coudes sous poignets. Lockout contrôlé."},
  {id:"x042",n:"Élévations latérales",m:"Épaules",eq:"db",kg:8,reps:"15",rest:60,rpe:6,cue:"Monte à l'horizontale. Coudes légers fléchis."},
  {id:"x043",n:"Élévations frontales",m:"Épaules ant",eq:"db",kg:8,reps:"12",rest:60,rpe:6,cue:"Monte devant à hauteur d'yeux. Sans élan."},
  {id:"x044",n:"Oiseau haltères",m:"Rear delt",eq:"db",kg:8,reps:"15",rest:60,rpe:6,cue:"Buste penché. Serre les omoplates."},
  {id:"x045",n:"Rowing haltère un bras",m:"Dos épais",eq:"db",kg:26,reps:"10",rest:90,rpe:7,cue:"Appui sur banc. Coude vers la hanche."},
  {id:"x046",n:"Rowing haltères buste penché",m:"Dos",eq:"db",kg:20,reps:"10",rest:90,rpe:7,cue:"Double traction. Squeeze en haut."},
  {id:"x047",n:"Curl haltères",m:"Biceps",eq:"db",kg:14,reps:"12",rest:75,rpe:7,cue:"Supination en montant. Pas de balancier."},
  {id:"x048",n:"Curl marteau",m:"Biceps · Avant-bras",eq:"db",kg:14,reps:"12",rest:75,rpe:7,cue:"Prise neutre. Coudes fixes."},
  {id:"x049",n:"Curl incliné",m:"Biceps",eq:"db",kg:10,reps:"12",rest:75,rpe:7,cue:"Banc incliné. Étire le biceps en bas."},
  {id:"x050",n:"Extension triceps nuque",m:"Triceps",eq:"db",kg:16,reps:"12",rest:75,rpe:7,cue:"Coudes serrés. Descends derrière la tête."},
  {id:"x051",n:"Kickback triceps",m:"Triceps",eq:"db",kg:8,reps:"15",rest:60,rpe:6,cue:"Bras parallèle au sol. Verrouille en arrière."},
  {id:"x052",n:"Shrug haltères",m:"Trapèzes",eq:"db",kg:26,reps:"15",rest:60,rpe:6,cue:"Hausse pur. Pause 1s en haut."},
  {id:"x053",n:"Renegade Row",m:"Dos · Core",eq:"db",kg:16,reps:"10",rest:90,rpe:8,cue:"Position pompe. Tire sans tourner les hanches."},
  {id:"x054",n:"Thruster haltères",m:"Full body",eq:"db",kg:16,reps:"10",rest:90,rpe:8,cue:"Squat puis press. Enchaîné."},
  {id:"x055",n:"Devil Press",m:"Full body · Cardio",eq:"db",kg:14,reps:"8",rest:120,rpe:9,cue:"Burpee + snatch haltères. Brutal."},
  {id:"x056",n:"Man Maker",m:"Full body · Cardio",eq:"db",kg:14,reps:"6",rest:120,rpe:9,cue:"Pompe-row + clean + press. Complet."},
  {id:"x057",n:"Swing haltère",m:"Fessiers · Cardio",eq:"db",kg:20,reps:"15",rest:75,rpe:7,cue:"Poussée hanche. Comme un swing KB."},
  {id:"x058",n:"Double Swing KB",m:"Fessiers · Cardio",eq:"kb",kg:16,reps:"12",rest:75,rpe:7,cue:"Deux KB. Hanche explosive synchronisée."},
  {id:"x059",n:"Double Clean KB",m:"Full body",eq:"kb",kg:16,reps:"6",rest:120,rpe:8,cue:"Deux KB en rack simultané."},
  {id:"x060",n:"Double Front Squat KB",m:"Quads · Core",eq:"kb",kg:16,reps:"8",rest:120,rpe:8,cue:"Deux KB en rack. Coudes hauts."},
  {id:"x061",n:"Double Press KB",m:"Épaules",eq:"kb",kg:14,reps:"6",rest:120,rpe:8,cue:"Deux KB au-dessus. Core anti-extension."},
  {id:"x062",n:"KB Snatch alterné",m:"Full body",eq:"kb",kg:12,reps:"10",rest:120,rpe:8,cue:"Alterne les bras. Lockout franc."},
  {id:"x063",n:"KB Sots Press",m:"Épaules · Mobilité",eq:"kb",kg:10,reps:"6",rest:120,rpe:8,cue:"En bas du squat. Press vertical."},
  {id:"x064",n:"KB Suitcase Deadlift",m:"Core · Ischios",eq:"kb",kg:24,reps:"10",rest:90,rpe:7,cue:"KB d'un côté. Anti-inclinaison."},
  {id:"x065",n:"KB Single Leg Deadlift",m:"Ischios · Équilibre",eq:"kb",kg:16,reps:"8",rest:90,rpe:7,cue:"Sur une jambe. Charnière contrôlée."},
  {id:"x066",n:"KB Bottoms-Up Press",m:"Épaules · Poignet",eq:"kb",kg:10,reps:"6",rest:90,rpe:7,cue:"KB tête en bas. Poignet stable."},
  {id:"x067",n:"KB Around the World",m:"Core",eq:"kb",kg:12,reps:"10",rest:60,rpe:5,cue:"Orbite autour de la taille. Lent."},
  {id:"x068",n:"KB Russian Twist",m:"Core",eq:"kb",kg:12,reps:"20",rest:60,rpe:6,cue:"Assis. Rotation tronc KB en main."},
  {id:"x069",n:"KB Goblet Reverse Lunge",m:"Quads · Fessiers",eq:"kb",kg:20,reps:"10",rest:90,rpe:7,cue:"Goblet. Fente arrière profonde."},
  {id:"x070",n:"KB High Pull",m:"Dos · Épaules",eq:"kb",kg:16,reps:"10",rest:90,rpe:7,cue:"Tire le KB au menton. Coude haut."},
  {id:"x071",n:"KB Figure 8",m:"Core · Cardio",eq:"kb",kg:12,reps:"10",rest:60,rpe:6,cue:"Passe le KB en 8 entre les jambes."},
  {id:"x072",n:"Traction pronation",m:"Dos · Biceps",eq:"bw",kg:0,reps:"8",rest:120,rpe:8,cue:"Menton au-dessus. Descente complète."},
  {id:"x073",n:"Traction supination",m:"Dos · Biceps",eq:"bw",kg:0,reps:"8",rest:120,rpe:8,cue:"Paumes vers soi. Squeeze biceps."},
  {id:"x074",n:"Traction prise large",m:"Dos large",eq:"bw",kg:0,reps:"6",rest:120,rpe:8,cue:"Coudes vers le bas. Cible le grand dorsal."},
  {id:"x075",n:"Traction lestée",m:"Dos · Biceps",eq:"bw",kg:10,reps:"5",rest:150,rpe:9,cue:"Ceinture lestée. Amplitude pleine."},
  {id:"x076",n:"Muscle-up",m:"Full body",eq:"bw",kg:0,reps:"3",rest:180,rpe:9,cue:"Transition explosive au-dessus de la barre."},
  {id:"x077",n:"Australian Row",m:"Dos",eq:"bw",kg:0,reps:"12",rest:90,rpe:6,cue:"Corps gainé. Tire la poitrine à la barre."},
  {id:"x078",n:"Pompes",m:"Pecs · Triceps",eq:"bw",kg:0,reps:"15",rest:60,rpe:6,cue:"Corps aligné. Poitrine frôle le sol."},
  {id:"x079",n:"Pompes diamant",m:"Triceps",eq:"bw",kg:0,reps:"12",rest:60,rpe:7,cue:"Mains en losange. Coudes serrés."},
  {id:"x080",n:"Pompes déclinées",m:"Pecs sup",eq:"bw",kg:0,reps:"12",rest:60,rpe:7,cue:"Pieds surélevés. Cible le haut."},
  {id:"x081",n:"Pompes archer",m:"Pecs · Force",eq:"bw",kg:0,reps:"8",rest:90,rpe:8,cue:"Poids sur un bras. L'autre tendu."},
  {id:"x082",n:"Pompes pseudo planche",m:"Épaules · Pecs",eq:"bw",kg:0,reps:"8",rest:90,rpe:8,cue:"Mains au niveau taille. Penche en avant."},
  {id:"x083",n:"Pike Push-up",m:"Épaules",eq:"bw",kg:0,reps:"10",rest:90,rpe:7,cue:"Bassin haut. Tête vers le sol."},
  {id:"x084",n:"Handstand Push-up",m:"Épaules",eq:"bw",kg:0,reps:"5",rest:150,rpe:9,cue:"Contre le mur. Descends contrôlé."},
  {id:"x085",n:"Dips barres",m:"Pecs · Triceps",eq:"bw",kg:0,reps:"10",rest:120,rpe:8,cue:"Descends jusqu'à 90°. Buste penché pour pecs."},
  {id:"x086",n:"Dips lestés",m:"Pecs · Triceps",eq:"bw",kg:15,reps:"6",rest:150,rpe:9,cue:"Ceinture lestée. Contrôle total."},
  {id:"x087",n:"Dips banc",m:"Triceps",eq:"bw",kg:0,reps:"15",rest:60,rpe:6,cue:"Mains sur banc. Coudes vers l'arrière."},
  {id:"x088",n:"Pistol Squat",m:"Quads · Équilibre",eq:"bw",kg:0,reps:"6",rest:120,rpe:8,cue:"Une jambe. Descente complète contrôlée."},
  {id:"x089",n:"Squat bulgare au poids",m:"Quads",eq:"bw",kg:0,reps:"15",rest:75,rpe:6,cue:"Pied arrière surélevé. Tempo lent."},
  {id:"x090",n:"Squat sauté",m:"Quads · Cardio",eq:"bw",kg:0,reps:"15",rest:60,rpe:7,cue:"Explose vers le haut. Réception douce."},
  {id:"x091",n:"Fentes sautées",m:"Quads · Cardio",eq:"bw",kg:0,reps:"20",rest:60,rpe:7,cue:"Change de jambe en l'air."},
  {id:"x092",n:"Nordic Curl",m:"Ischios",eq:"bw",kg:0,reps:"6",rest:120,rpe:9,cue:"Genoux ancrés. Descente freinée max."},
  {id:"x093",n:"Glute Bridge",m:"Fessiers",eq:"bw",kg:0,reps:"20",rest:45,rpe:5,cue:"Pousse les hanches. Squeeze en haut."},
  {id:"x094",n:"Hip Thrust une jambe",m:"Fessiers",eq:"bw",kg:0,reps:"12",rest:60,rpe:7,cue:"Une jambe. Bassin stable."},
  {id:"x095",n:"Mollets debout",m:"Mollets",eq:"bw",kg:0,reps:"20",rest:45,rpe:5,cue:"Monte sur la pointe. Pause en haut."},
  {id:"x096",n:"Gainage planche",m:"Core",eq:"bw",kg:0,reps:"60s",rest:45,rpe:5,cue:"Corps aligné. Bassin verrouillé."},
  {id:"x097",n:"Planche latérale",m:"Core oblique",eq:"bw",kg:0,reps:"45s",rest:45,rpe:5,cue:"Hanche haute. Corps en ligne."},
  {id:"x098",n:"Hollow Hold",m:"Core",eq:"bw",kg:0,reps:"40s",rest:45,rpe:6,cue:"Bas du dos plaqué. Épaules décollées."},
  {id:"x099",n:"Hollow Rock",m:"Core",eq:"bw",kg:0,reps:"20",rest:45,rpe:6,cue:"Bascule en gardant la forme hollow."},
  {id:"x100",n:"L-Sit",m:"Core · Force",eq:"bw",kg:0,reps:"20s",rest:90,rpe:8,cue:"Jambes tendues à l'horizontale. Épaules basses."},
  {id:"x101",n:"Dragon Flag",m:"Core",eq:"bw",kg:0,reps:"6",rest:90,rpe:9,cue:"Corps droit. Descente ultra-contrôlée."},
  {id:"x102",n:"Relevé jambes suspendu",m:"Core bas",eq:"bw",kg:0,reps:"12",rest:75,rpe:7,cue:"Sans balancier. Bassin enroulé."},
  {id:"x103",n:"Toes to Bar",m:"Core · Cardio",eq:"bw",kg:0,reps:"10",rest:90,rpe:8,cue:"Pieds à la barre. Rythme contrôlé."},
  {id:"x104",n:"Mountain Climber",m:"Core · Cardio",eq:"bw",kg:0,reps:"40",rest:45,rpe:6,cue:"Genoux vers la poitrine. Vite."},
  {id:"x105",n:"Superman",m:"Lombaires",eq:"bw",kg:0,reps:"15",rest:45,rpe:5,cue:"Bras et jambes décollés. Pause en haut."},
  {id:"x106",n:"Bird Dog",m:"Core · Stabilité",eq:"bw",kg:0,reps:"12",rest:45,rpe:5,cue:"Bras et jambe opposés. Anti-rotation."},
  {id:"x107",n:"Front Lever progression",m:"Dos · Core",eq:"bw",kg:0,reps:"10s",rest:120,rpe:9,cue:"Corps horizontal. Tucks selon niveau."},
  {id:"x108",n:"Burpee",m:"Full body · Cardio",eq:"bw",kg:0,reps:"15",rest:60,rpe:8,cue:"Pompe + saut. Rythme soutenu."},
  {id:"x109",n:"Rameur intervalle",m:"Full body · Cardio",eq:"cd",kg:0,reps:"500m",rest:90,rpe:8,cue:"Tire jambes-hanches-bras. Retour bras-hanches-jambes."},
  {id:"x110",n:"Rameur endurance",m:"Full body · Cardio",eq:"cd",kg:0,reps:"2000m",rest:0,rpe:6,cue:"Cadence régulière. Respiration contrôlée."},
  {id:"x111",n:"Assault Bike sprint",m:"Full body · Cardio",eq:"cd",kg:0,reps:"30s",rest:90,rpe:9,cue:"Bras et jambes à fond. All-out."},
  {id:"x112",n:"Assault Bike calories",m:"Cardio",eq:"cd",kg:0,reps:"20cal",rest:90,rpe:8,cue:"Rythme constant et puissant."},
  {id:"x113",n:"Corde à sauter",m:"Cardio · Mollets",eq:"cd",kg:0,reps:"100",rest:45,rpe:6,cue:"Poignets relâchés. Petits sauts."},
  {id:"x114",n:"Double Unders",m:"Cardio",eq:"cd",kg:0,reps:"40",rest:60,rpe:8,cue:"Deux tours par saut. Timing serré."},
  {id:"x115",n:"Sprint navette",m:"Cardio · Jambes",eq:"cd",kg:0,reps:"10x20m",rest:90,rpe:9,cue:"Accélère, touche, repart. Explosif."},
  {id:"x116",n:"Montées de genoux",m:"Cardio",eq:"cd",kg:0,reps:"50",rest:45,rpe:6,cue:"Genoux hauts. Rythme rapide."},
  {id:"x117",n:"Ski Erg",m:"Full body · Cardio",eq:"cd",kg:0,reps:"500m",rest:90,rpe:8,cue:"Tire vers le bas. Engage le tronc."},
  {id:"x118",n:"Box Jump",m:"Jambes · Cardio",eq:"cd",kg:0,reps:"12",rest:75,rpe:7,cue:"Réception souple. Extension complète en haut."},
  {id:"x119",n:"Wall Ball",m:"Full body · Cardio",eq:"cd",kg:6,reps:"15",rest:75,rpe:8,cue:"Squat puis lance la balle à la cible."},
  {id:"x120",n:"Battle Rope",m:"Bras · Cardio",eq:"cd",kg:0,reps:"30s",rest:60,rpe:8,cue:"Vagues continues. Gainage constant."},
  {id:"x121",n:"Sled Push",m:"Jambes · Cardio",eq:"cd",kg:40,reps:"20m",rest:120,rpe:8,cue:"Pousse bas. Pas courts et puissants."},
  {id:"x122",n:"Course tempo",m:"Cardio",eq:"cd",kg:0,reps:"5min",rest:0,rpe:6,cue:"Allure soutenue mais tenable."},
  {id:"x123",n:"Tirage vertical",m:"Dos large",eq:"mc",kg:55,reps:"12",rest:90,rpe:6,cue:"Tire au haut des pecs. Coudes vers les côtes."},
  {id:"x124",n:"Tirage horizontal",m:"Dos épais",eq:"mc",kg:55,reps:"12",rest:90,rpe:6,cue:"Buste droit. Squeeze omoplates."},
  {id:"x125",n:"Tirage bras tendus",m:"Grand dorsal",eq:"mc",kg:25,reps:"15",rest:60,rpe:6,cue:"Bras tendus. Pousse la barre vers les cuisses."},
  {id:"x126",n:"Presse à cuisses",m:"Quads · Fessiers",eq:"mc",kg:120,reps:"12",rest:120,rpe:7,cue:"Pieds largeur épaules. Ne verrouille pas les genoux."},
  {id:"x127",n:"Leg Extension",m:"Quads",eq:"mc",kg:40,reps:"15",rest:75,rpe:6,cue:"Verrouille en haut 1s. Descente lente."},
  {id:"x128",n:"Leg Curl allongé",m:"Ischios",eq:"mc",kg:35,reps:"12",rest:75,rpe:6,cue:"Talons vers les fessiers. Contrôle."},
  {id:"x129",n:"Mollets à la presse",m:"Mollets",eq:"mc",kg:80,reps:"15",rest:60,rpe:6,cue:"Amplitude pleine. Pause étirée."},
  {id:"x130",n:"Pec Deck",m:"Pecs",eq:"mc",kg:40,reps:"15",rest:75,rpe:6,cue:"Coudes hauts. Serre au centre."},
  {id:"x131",n:"Cable Crossover",m:"Pecs",eq:"mc",kg:15,reps:"15",rest:60,rpe:6,cue:"Arc descendant. Croise devant."},
  {id:"x132",n:"Cable Fly haut",m:"Pecs inf",eq:"mc",kg:15,reps:"15",rest:60,rpe:6,cue:"Poulies hautes. Vers le bas."},
  {id:"x133",n:"Triceps poulie corde",m:"Triceps",eq:"mc",kg:25,reps:"15",rest:60,rpe:6,cue:"Écarte la corde en bas. Coudes fixes."},
  {id:"x134",n:"Triceps poulie barre",m:"Triceps",eq:"mc",kg:30,reps:"12",rest:60,rpe:6,cue:"Pousse vers le bas. Verrouille."},
  {id:"x135",n:"Curl poulie basse",m:"Biceps",eq:"mc",kg:25,reps:"12",rest:60,rpe:6,cue:"Tension constante. Pas d'élan."},
  {id:"x136",n:"Face Pull",m:"Rear delt · Dos",eq:"mc",kg:20,reps:"15",rest:60,rpe:6,cue:"Tire vers le visage. Rotation externe."},
  {id:"x137",n:"Cable Lateral Raise",m:"Épaules",eq:"mc",kg:8,reps:"15",rest:45,rpe:6,cue:"Poulie basse. Monte à l'horizontale."},
  {id:"x138",n:"Pallof Press",m:"Core anti-rotation",eq:"mc",kg:12,reps:"12",rest:60,rpe:6,cue:"Résiste à la rotation. Bras tendus lent."},
  {id:"x139",n:"Cable Woodchopper",m:"Core · Obliques",eq:"mc",kg:15,reps:"12",rest:60,rpe:6,cue:"Diagonale haut-bas. Pivote les hanches."},
  {id:"x140",n:"Cable Pull-through",m:"Fessiers · Ischios",eq:"mc",kg:25,reps:"15",rest:75,rpe:6,cue:"Charnière hanche. Poulie entre les jambes."},
  {id:"x141",n:"Hack Squat machine",m:"Quads",eq:"mc",kg:80,reps:"10",rest:120,rpe:7,cue:"Dos plaqué. Descente profonde."},
  {id:"x142",n:"Hip Abduction",m:"Fessiers moyens",eq:"mc",kg:40,reps:"15",rest:60,rpe:5,cue:"Écarte contre résistance. Squeeze."},
  {id:"x143",n:"Dead Bug",m:"Core · Stabilité",eq:"bw",kg:0,reps:"12",rest:45,rpe:5,cue:"Bras et jambe opposés. Bas du dos plaqué."},
  {id:"x144",n:"Bear Crawl",m:"Full body · Core",eq:"bw",kg:0,reps:"20m",rest:45,rpe:6,cue:"Genoux à 2cm du sol. Dos plat."},
  {id:"x145",n:"Ours latéral",m:"Épaules · Core",eq:"bw",kg:0,reps:"15",rest:45,rpe:6,cue:"Déplacement latéral gainé."},
  {id:"x146",n:"Cossack Squat",m:"Mobilité · Adducteurs",eq:"bw",kg:0,reps:"10",rest:60,rpe:6,cue:"Squat latéral. Jambe opposée tendue."},
  {id:"x147",n:"90/90 Hanche",m:"Mobilité hanche",eq:"bw",kg:0,reps:"10",rest:45,rpe:4,cue:"Pivote les hanches au sol. Buste droit."},
  {id:"x148",n:"Couch Stretch",m:"Mobilité quad",eq:"bw",kg:0,reps:"40s",rest:30,rpe:3,cue:"Genou au mur. Ouvre le psoas."},
  {id:"x149",n:"Cat-Cow",m:"Mobilité dos",eq:"bw",kg:0,reps:"12",rest:30,rpe:3,cue:"Alterne flexion-extension de la colonne."},
  {id:"x150",n:"Wall Slide",m:"Mobilité épaule",eq:"bw",kg:0,reps:"12",rest:30,rpe:4,cue:"Dos au mur. Glisse les bras vers le haut."},
  {id:"x151",n:"Scapular Pull-up",m:"Dos · Scapula",eq:"bw",kg:0,reps:"10",rest:60,rpe:6,cue:"Bras tendus. Descends puis remonte par les omoplates."},
  {id:"x152",n:"Hanging Hold",m:"Grip · Dos",eq:"bw",kg:0,reps:"40s",rest:60,rpe:6,cue:"Suspension passive. Relâche les épaules."},
  {id:"x153",n:"Copenhagen Plank",m:"Adducteurs · Core",eq:"bw",kg:0,reps:"30s",rest:45,rpe:7,cue:"Jambe haute sur appui. Anti-chute du bassin."},
  {id:"x154",n:"Reverse Plank",m:"Core postérieur",eq:"bw",kg:0,reps:"30s",rest:45,rpe:5,cue:"Face vers le haut. Hanches hautes."},
  {id:"x155",n:"Sit-up",m:"Core",eq:"bw",kg:0,reps:"20",rest:45,rpe:5,cue:"Enroule la colonne. Contrôle la descente."},
  {id:"x156",n:"V-up",m:"Core",eq:"bw",kg:0,reps:"15",rest:60,rpe:7,cue:"Bras et jambes se rejoignent. Forme V."},
  {id:"x157",n:"Flutter Kicks",m:"Core bas",eq:"bw",kg:0,reps:"40",rest:45,rpe:6,cue:"Battements de jambes. Bas du dos plaqué."},
  {id:"x158",n:"Russian Twist au poids",m:"Core obliques",eq:"bw",kg:0,reps:"24",rest:45,rpe:6,cue:"Rotation tronc. Pieds décollés."},
  {id:"x159",n:"Ab Wheel",m:"Core",eq:"bw",kg:0,reps:"10",rest:75,rpe:8,cue:"Déroule loin. Anti-extension lombaire."},
  {id:"x160",n:"Plank Up-Down",m:"Core · Épaules",eq:"bw",kg:0,reps:"16",rest:45,rpe:6,cue:"Passe coudes-mains en gardant le bassin stable."},
  {id:"x161",n:"Pendlay déficit",m:"Dos épais",eq:"bar",kg:50,reps:"8",rest:120,rpe:8,cue:"Sur disque. Tire explosif depuis le sol."},
  {id:"x162",n:"Shrug barre",m:"Trapèzes",eq:"bar",kg:60,reps:"15",rest:75,rpe:6,cue:"Hausse vertical. Pause en haut."},
  {id:"x163",n:"Curl Larry Scott",m:"Biceps",eq:"db",kg:10,reps:"12",rest:75,rpe:7,cue:"Bras sur pupitre incliné. Isole le biceps."},
  {id:"x164",n:"Préacheur poulie",m:"Biceps",eq:"mc",kg:20,reps:"12",rest:60,rpe:6,cue:"Coudes calés. Tension continue."},
  {id:"x165",n:"JM Press",m:"Triceps",eq:"bar",kg:35,reps:"10",rest:90,rpe:7,cue:"Hybride couché-extension. Coudes vers l'avant."},
  {id:"x166",n:"Skullcrusher",m:"Triceps",eq:"bar",kg:25,reps:"10",rest:90,rpe:7,cue:"Barre vers le front. Coudes fixes."},
  {id:"x167",n:"Reverse Curl",m:"Avant-bras · Biceps",eq:"bar",kg:20,reps:"12",rest:75,rpe:6,cue:"Prise pronation. Cible les extenseurs."},
  {id:"x168",n:"Wrist Curl",m:"Avant-bras",eq:"db",kg:8,reps:"15",rest:45,rpe:5,cue:"Flexion poignet sur banc. Amplitude pleine."},
  {id:"x169",n:"Incline Y Raise",m:"Rear delt · Trapèze inf",eq:"db",kg:6,reps:"15",rest:60,rpe:5,cue:"Buste sur banc incliné. Bras en Y."},
  {id:"x170",n:"Tate Press",m:"Triceps",eq:"db",kg:10,reps:"12",rest:75,rpe:6,cue:"Coudes ouverts. Haltères vers la poitrine."},
  {id:"x171",n:"Kettlebell Complex",m:"Full body · Cardio",eq:"kb",kg:16,reps:"5x3",rest:120,rpe:9,cue:"Clean-squat-press enchaînés sans poser."},
  {id:"x172",n:"Barbell Complex",m:"Full body · Cardio",eq:"bar",kg:40,reps:"5x3",rest:150,rpe:9,cue:"Deadlift-row-clean-press-squat sans lâcher."},
  {id:"x173",n:"EMOM Thruster",m:"Full body · Cardio",eq:"bar",kg:40,reps:"10x5",rest:0,rpe:8,cue:"5 reps en haut de chaque minute."},
  {id:"x174",n:"AMRAP Burpee Pull-up",m:"Full body · Cardio",eq:"bw",kg:0,reps:"10min",rest:0,rpe:9,cue:"Max de tours burpee + traction."},
  {id:"x175",n:"Sprint colline",m:"Cardio · Jambes",eq:"cd",kg:0,reps:"8x15m",rest:90,rpe:9,cue:"Montée explosive. Récup en marchant."},
  {id:"x176",n:"Tabata Squat",m:"Cardio · Jambes",eq:"cd",kg:0,reps:"8x20s",rest:10,rpe:9,cue:"20s effort / 10s repos. 8 rounds."},
  {id:"x177",n:"Carry mixte",m:"Core · Grip",eq:"kb",kg:24,reps:"40m",rest:90,rpe:7,cue:"Un KB en rack, un en farmer. Anti-rotation."},
  {id:"x178",n:"Yoke Carry",m:"Full body · Grip",eq:"bar",kg:60,reps:"20m",rest:120,rpe:8,cue:"Charge lourde sur le dos. Pas contrôlés."},
  {id:"x179",n:"Sandbag Clean",m:"Full body",eq:"db",kg:30,reps:"8",rest:120,rpe:8,cue:"Ramène le sac à la poitrine. Hanche explosive."},
  {id:"x180",n:"Broad Jump",m:"Jambes · Puissance",eq:"bw",kg:0,reps:"8",rest:90,rpe:7,cue:"Saut horizontal max. Réception stable."},
  {id:"x181",n:"Depth Jump",m:"Jambes · Puissance",eq:"bw",kg:0,reps:"6",rest:120,rpe:8,cue:"Descends de la box puis rebondis vite."},
  {id:"x182",n:"Pogo Jumps",m:"Mollets · Réactivité",eq:"bw",kg:0,reps:"20",rest:45,rpe:6,cue:"Petits sauts raides. Contact bref au sol."},
  {id:"x183",n:"Single Leg RDL haltère",m:"Ischios · Équilibre",eq:"db",kg:14,reps:"10",rest:90,rpe:7,cue:"Une jambe. Charnière hanche. Dos plat."},
  {id:"x184",n:"Step Down",m:"Quads · Contrôle",eq:"bw",kg:0,reps:"10",rest:60,rpe:6,cue:"Descends une jambe d'une box. Lent."},
  {id:"x185",n:"Shrimp Squat",m:"Quads · Équilibre",eq:"bw",kg:0,reps:"6",rest:120,rpe:9,cue:"Une jambe. Genou arrière au sol."},
  {id:"x186",n:"Sissy Squat",m:"Quads",eq:"bw",kg:0,reps:"12",rest:75,rpe:7,cue:"Bascule arrière sur la pointe. Étire les quads."},
  {id:"x187",n:"Calf Raise une jambe",m:"Mollets",eq:"bw",kg:0,reps:"15",rest:45,rpe:6,cue:"Sur une jambe. Amplitude complète."},
  {id:"x188",n:"Wall Sit",m:"Quads · Endurance",eq:"bw",kg:0,reps:"60s",rest:60,rpe:6,cue:"Dos au mur. Cuisses à l'horizontale."},
  {id:"x189",n:"Jefferson Curl",m:"Mobilité · Chaîne post",eq:"db",kg:16,reps:"8",rest:75,rpe:6,cue:"Déroule la colonne vertèbre par vertèbre."},
  {id:"x190",n:"Hyperextension",m:"Lombaires · Fessiers",eq:"bw",kg:0,reps:"15",rest:60,rpe:6,cue:"Remonte jusqu'à l'alignement. Sans hyperextension."},
  {id:"x191",n:"Reverse Hyper",m:"Fessiers · Lombaires",eq:"mc",kg:20,reps:"15",rest:75,rpe:6,cue:"Jambes montent derrière. Décompresse le bas du dos."},
  {id:"x192",n:"Cable Kickback fessier",m:"Fessiers",eq:"mc",kg:15,reps:"15",rest:60,rpe:5,cue:"Pousse la jambe en arrière. Squeeze."},
  {id:"x193",n:"Standing Cable Crunch",m:"Core",eq:"mc",kg:25,reps:"15",rest:60,rpe:6,cue:"Enroule le tronc contre la poulie."},
  {id:"x194",n:"Landmine Press",m:"Épaules · Core",eq:"bar",kg:25,reps:"10",rest:90,rpe:7,cue:"Barre en angle. Presse en diagonale."},
  {id:"x195",n:"Landmine Row",m:"Dos épais",eq:"bar",kg:30,reps:"10",rest:90,rpe:7,cue:"Barre en T. Tire vers la poitrine."},
  {id:"x196",n:"Landmine Squat to Press",m:"Full body",eq:"bar",kg:25,reps:"10",rest:90,rpe:8,cue:"Squat puis press en un mouvement."},
  {id:"x197",n:"Z Press",m:"Épaules · Core",eq:"bar",kg:30,reps:"6",rest:120,rpe:8,cue:"Assis jambes tendues. Press strict."},
  {id:"x198",n:"Bradford Press",m:"Épaules",eq:"bar",kg:30,reps:"10",rest:90,rpe:7,cue:"Alterne nuque-devant sans verrouiller."},
];

const EQ_LABELS = {kb:"KB",bar:"Barre",db:"Haltères",bw:"Corps",mc:"Machine",cd:"Cardio"};

// ─── PROGRAM S24 ─────────────────────────────────────────────────────────────
const PROG_DEF = [
  {day:"LUN",label:"Push Force",salle:"haut",muscle:"Pecs · Épaules · Triceps",
   ids:[["bb01",5],["bb02",4],["db01",3],["db07",4],["db08",3],["bw04",4]],
   abs:[{id:"bw08",n:"Dragon Flag",vol:"4×6"},{id:"ab10",n:"L-Sit Pull-up",vol:"3×5"}]},
  {day:"MAR",label:"KB Power",salle:"bas",muscle:"Full Body · Kettlebell Complexe",
   ids:[["kb01",4],["kb03",4],["kb04",4],["kb07",3],["kb08",4],["kb16",1]],
   abs:[{id:"bw09",n:"L-Sit",vol:"4×20s"},{id:"ab03",n:"Hollow Body",vol:"3×30s"}]},
  {day:"MER",label:"Pull & Legs",salle:"haut",muscle:"Dos · Biceps · Jambes",
   ids:[["bw01",5],["bw02",4],["bb07",4],["db06",3],["kb08",4],["bb08",4]],
   abs:[{id:"bw10",n:"Relevé jambes suspendu",vol:"4×12"},{id:"bw08",n:"Dragon Flag",vol:"3×6"}]},
  {day:"JEU",label:"Repos",salle:null,muscle:"Récupération active",ids:[],abs:[]},
  {day:"VEN",label:"KB Endurance",salle:"bas",muscle:"KB · Rameur · Full Body",
   ids:[["cd02",4],["kb05",4],["kb06",4],["kb15",3],["db06",4],["cd04",3]],
   abs:[{id:"bw09",n:"L-Sit",vol:"4×20s"},{id:"ab02",n:"Russian Twist",vol:"3×20"}]},
  {day:"SAM",label:"Full Power",salle:"haut",muscle:"Deadlift · Tractions · KB",
   ids:[["bb04",5],["bb05",4],["bw01",5],["bw04",3],["kb15",4],["kb07",3]],
   abs:[{id:"bw08",n:"Dragon Flag",vol:"4×8"},{id:"bw09",n:"L-Sit",vol:"3×25s"}]},
  {day:"DIM",label:"Repos",salle:null,muscle:"Reset total",ids:[],abs:[]},
];
const PROGRAM = PROG_DEF.map(d=>({...d,exercises:d.ids.map(([id,sets])=>{const ex=DB.find(e=>e.id===id);return ex?{...ex,sets}:null}).filter(Boolean)}));

// Templates de seances reassignables (les 5 seances + Repos) pour l'editeur de semaine
const REST_TPL = {label:"Repos",salle:null,muscle:"Recuperation active",exercises:[],abs:[],ids:[]};
const SESSION_TEMPLATES = [...PROGRAM.filter(d=>d.salle).map(d=>({label:d.label,salle:d.salle,muscle:d.muscle,exercises:d.exercises,abs:d.abs,ids:d.ids})), REST_TPL];

// Rotation hebdo - mesocycle hybride (Volume -> Intensite -> Puissance -> Deload)
const weekNumber = () => { const dt=new Date(); const d=new Date(Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate())); const dn=(d.getUTCDay()+6)%7; d.setUTCDate(d.getUTCDate()-dn+3); const ft=new Date(Date.UTC(d.getUTCFullYear(),0,4)); const fn=(ft.getUTCDay()+6)%7; ft.setUTCDate(ft.getUTCDate()-fn+3); return 1+Math.round((d-ft)/604800000); };
const PHASES12=[{n:"Accumulation",f:"Volume, base"},{n:"Accumulation",f:"Volume"},{n:"Accumulation",f:"Volume +"},{n:"Intensification",f:"Charges +"},{n:"Intensification",f:"Charges ++"},{n:"Intensification",f:"Lourd"},{n:"Réalisation",f:"Explosif"},{n:"Réalisation",f:"Puissance"},{n:"Réalisation",f:"Pic de force"},{n:"Deload",f:"Récupération"},{n:"Test / PR",f:"Validation"},{n:"Test / PR",f:"Nouveaux maxs"}];
const programWeek=()=>((weekNumber()-1)%12)+1;
const MESO = [ {k:"Volume",s:1,r:0.9,g:"Series hautes, tempo controle"}, {k:"Intensite",s:0,r:1.2,g:"Charges lourdes, reps basses"}, {k:"Puissance",s:0,r:1.35,g:"Explosif, repos longs"}, {k:"Deload",s:-1,r:0.85,g:"Recuperation, charges legeres"} ];
const REST_STEPS=[30,45,60,75,90,120,150,180,210,240,300];
const snapRest=(s)=>{ if(!s||s<=0) return 0; return REST_STEPS.reduce((a,b)=>Math.abs(b-s)<Math.abs(a-s)?b:a); };
const phaseOf = (w) => MESO[((w%4)+4)%4];
const PROG_WEEKS=12;
const progWeekRaw=(start)=>{ if(!start) return null; const ms=Date.now()-new Date(start+"T00:00:00").getTime(); return Math.floor(ms/604800000)+1; };
const progWeekOf=(start)=>{ const raw=progWeekRaw(start); if(raw==null) return programWeek(); return Math.min(PROG_WEEKS,Math.max(1,raw)); };
const progEndDate=(start)=>{ if(!start) return null; const d=new Date(start+"T00:00:00"); d.setDate(d.getDate()+PROG_WEEKS*7-1); return d; };
const fmtDateShort=(d)=>{ if(!d) return ""; const dd=(typeof d==="string")?new Date(d+"T00:00:00"):d; try{return dd.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});}catch(_e){return "";} };
const LEVEL_LOAD={debutant:0.78,intermediaire:1.0,avance:1.18};
const SEX_LOAD={homme:1.0,femme:0.62,autre:0.85};
const ENG_REF_BW=75;
const engineScale=(profile)=>{ const bw=Number(profile&&profile.weight_kg)||ENG_REF_BW; const lvl=LEVEL_LOAD[profile&&profile.level]||1.0; const sx=SEX_LOAD[profile&&profile.sex]||0.9; const bwf=Math.max(0.7,Math.min(1.3,bw/ENG_REF_BW)); return lvl*sx*bwf; };
const personalizeDay=(day,profile,week)=>{
  if(!day||!day.salle) return day;
  const scale=engineScale(profile);
  const ph=phaseOf(week);
  const intensity=ph.k==="Intensite"?1.06:ph.k==="Deload"?0.85:1.0;
  const setAdj=ph.s||0;
  const lvlSets=(profile&&profile.level==="debutant")?-1:(profile&&profile.level==="avance")?1:0;
  const rms=(profile&&profile.rms)||{};
  const goal=profile&&profile.goal;
  const gf=goal==="force"?1.25:goal==="endurance"?0.6:goal==="seche"?0.75:1.0;
  const restPF=ph.k==="Intensite"?1.1:ph.k==="Deload"?0.85:1.0;
  const exercises=(day.exercises||[]).map(ex=>{
    let kg=ex.kg;
    const rm=rms[ex.id];
    if(rm>0){ kg=Math.max(2.5,Math.round(rm*intensity/2.5)*2.5); }
    else if(typeof ex.kg==="number"&&ex.kg>0&&ex.eq!=="bw"){ kg=Math.max(2.5,Math.round(ex.kg*scale*intensity/2.5)*2.5); }
    let sets=ex.sets;
    if(typeof ex.sets==="number"){ sets=Math.max(2,Math.min(6,ex.sets+setAdj+lvlSets)); }
    const rn=repsNum(ex.reps);
    let base; if(ex.eq==="bw"){ base=(rn>0&&rn<=8)?75:45; } else if(rn>0&&rn<=5){ base=180; } else if(rn<=8){ base=150; } else if(rn<=10){ base=120; } else if(rn<=12){ base=90; } else if(rn<=15){ base=75; } else { base=45; }
    const rest=snapRest(base*gf*restPF);
    return {...ex,kg,sets,rest};
  });
  return {...day,exercises};
};
const MODE_WEEK_PLANS={force:["classique","classique","classique","classique+circuit","classique"],seche:["classique+circuit","amrap","classique+circuit","emom","classique+circuit"],hybride:["classique","emom","classique+circuit","amrap","classique"],endurance:["amrap","classique+circuit","emom","amrap","classique+circuit"]};
const baseGoal=(g)=>g==="force"?"force":g==="endurance"?"endurance":g==="seche"?"seche":"hybride";
const assignMode=(day,idx,profile,week)=>{ if(!day||!day.salle) return day; const plan=MODE_WEEK_PLANS[baseGoal(profile&&profile.goal)]||MODE_WEEK_PLANS.hybride; let tag=plan[idx%plan.length]; const ph=phaseOf(week); if(ph.k==="Deload") tag=tag.indexOf("circuit")>=0?"classique+circuit":"classique"; const circuit=tag.indexOf("circuit")>=0; const recommendedMode=tag.indexOf("amrap")>=0?"amrap":tag.indexOf("emom")>=0?"emom":"classique"; return {...day,recommendedMode,circuit}; };
const buildCircuits=(day,profile)=>{ const exos=day.exercises||[]; if(exos.length<3) return day; const goal=baseGoal(profile&&profile.goal); const gs=(goal==="seche"||goal==="endurance")?3:2; const out=exos.map(e=>({...e})); let cid=0; for(let i=1;i<out.length;i+=gs){ const slice=out.slice(i,i+gs); if(slice.length<2) break; cid++; const gt=slice.length>=3?"circuit":"superset"; slice.forEach((e,k)=>{ e.circuitId=cid; e.circuitPos=k+1; e.circuitSize=slice.length; e.groupType=gt; }); } return {...day,exercises:out}; };
const classifySession=(day)=>{ const ex=(day&&day.exercises)||[]; if(!ex.length) return {system:"force",metconEligible:false,condShare:0,hasBar:false}; let cond=0,hasBar=false; const n=ex.length; ex.forEach(e=>{ if(e.eq==="bar") hasBar=true; if(e.eq==="kb"||e.eq==="cd") cond+=1; else if(e.eq==="bw") cond+=0.8; else if(e.eq==="db") cond+=0.5; }); const condShare=cond/n; const metconEligible=!hasBar&&condShare>=0.5; const system=metconEligible?(condShare>0.85?"conditioning":"mixed"):"force"; return {system,metconEligible,condShare:+condShare.toFixed(2),hasBar}; };
const GOAL_METCON={force:0.10,hypertrophie:0.20,seche:0.55,hybride:0.45,endurance:0.70,performance:0.50};
const weeklyModePlan=(days,profile,week)=>{ const goal=(GOAL_METCON[profile&&profile.goal]!=null)?profile.goal:"hybride"; let ratio=GOAL_METCON[goal]; const ph=phaseOf(week); if(ph.k==="Deload") ratio*=0.4; const trainIdx=days.map((d,i)=>({i,salle:!!(d&&d.salle),cls:classifySession(d)})).filter(x=>x.salle); const nTrain=trainIdx.length; const eligible=trainIdx.filter(x=>x.cls.metconEligible); let nMet=Math.min(Math.round(ratio*nTrain),eligible.length); const ranked=eligible.slice().sort((a,b)=> b.cls.condShare-a.cls.condShare || a.i-b.i); const start=eligible.length?((week-1)%eligible.length):0; const chosen=[]; for(let k=0;k<nMet&&k<ranked.length;k++){ chosen.push(ranked[(start+k)%ranked.length].i); } const plan={}; const emomBias=(ph.k==="Intensite"||ph.k==="Puissance"); chosen.sort((a,b)=>a-b).forEach((idx,order)=>{ const emom=emomBias?(order%2===0):(order%2===1); plan[idx]={mode:emom?"emom":"amrap",circuit:false}; }); trainIdx.forEach(x=>{ if(!plan[x.i]){ const circ=(goal!=="force"&&goal!=="hypertrophie"); plan[x.i]={mode:"classique",circuit:circ}; } }); return plan; };
const MET_BAN=["planche","dragon flag","muscle-up","handstand","l-sit","nordic","windmill","turkish","get-up","ab rollout","front lever","back lever","pistol","figure 8","around the world","pass under","halo","dead bug","hollow"];
const MET_KW=["swing","clean","snatch","thruster","press","pompe","push-up","push up","burpee","gobelet","goblet","squat","fente","lunge","step-up","jump","saut","corde","rameur","velo","mountain","twist","knee raise","relev","sit-up","situp","carry","farmer","slam","wall ball","complex","jumping","rowing","row"];
const MET_EQ_BASE={kb:3,cd:3,bw:2,db:2,bar:0,mc:0};
const metconScore=(ex,goal)=>{ const n=String(ex.n||"").toLowerCase(); if(MET_BAN.some(k=>n.indexOf(k)>=0)) return 0; let s=MET_EQ_BASE[ex.eq]||0; if(s===0) return 0; if(MET_KW.some(k=>n.indexOf(k)>=0)) s+=2; const e=ex.eq; if(goal==="endurance") s+=(e==="cd"?2:e==="bw"?1:0); else if(goal==="seche") s+=((e==="bw"||e==="cd")?1:0); else if(goal==="force") s+=((e==="kb"||e==="db")?1:0); else s+=((e==="kb"||e==="db")?1:0); return s; };
const metRepsAmrap=(ex)=> ex.eq==="cd"?0:ex.eq==="bw"?12:ex.eq==="kb"?12:10;
const metRepsEmom=(ex)=> ex.eq==="cd"?0:ex.eq==="bw"?12:ex.eq==="kb"?10:8;
const metKg=(ex,profile,f)=>{ if(ex.eq==="bw"||ex.eq==="cd") return 0; const sc=engineScale(profile); const base=(typeof ex.kg==="number"?ex.kg:0)*sc*f; return base>0?Math.max(4,Math.round(base/2)*2):0; };
const buildMetcon=(day,mode,profile,week,seed)=>{ if(!day||!day.salle) return day; const goal=baseGoal(profile&&profile.goal); const equip=(profile&&profile.equipment)||[]; const ph=phaseOf(week); let pool=DB.filter(e=>metconScore(e,goal)>0).filter(e=> e.eq==="bw" || !equip.length || equip.indexOf(e.eq)>=0); const seen={}; pool=pool.filter(e=>{ if(seen[e.n]) return false; seen[e.n]=1; return true; }); const dayEqs={};(day.exercises||[]).forEach(e=>{dayEqs[e.eq]=(dayEqs[e.eq]||0)+1;});pool=pool.map(e=>({e,s:metconScore(e,goal)+((dayEqs[e.eq]||0)>0?2:0)})).sort((a,b)=>b.s-a.s).map(x=>x.e); if(pool.length<6) pool=DB.filter(e=>metconScore(e,"hybride")>0); const off=pool.length?(((week-1)*3+(seed||0)*5)%pool.length):0; const rot=pool.slice(off).concat(pool.slice(0,off)); const lvl=profile&&profile.level; let nBlocks=lvl==="avance"?3:lvl==="debutant"?2:3; if(ph.k==="Deload") nBlocks=2; const perBlock=3; const rounds=lvl==="debutant"?3:lvl==="avance"?4:3; const cap=lvl==="avance"?12:10; const f=mode==="amrap"?0.55:0.65; const used={}; const blocks=[]; for(let b=0;b<nBlocks;b++){ const exs=[]; let cd=0; const mus={}; while(exs.length<perBlock){ let e=rot.find(x=>!used[x.n]&&(x.eq!=="cd"||cd<1)&&!mus[primaryMuscle(x.m)]); if(!e) e=rot.find(x=>!used[x.n]&&(x.eq!=="cd"||cd<1)); if(!e) e=rot.find(x=>!used[x.n]); if(!e) break; used[e.n]=1; if(e.eq==="cd")cd++; mus[primaryMuscle(e.m)]=1; exs.push(e); } if(!exs.length) break; const exercises=exs.map(ex=>{ const kg=metKg(ex,profile,f); if(mode==="amrap"){ const r=metRepsAmrap(ex); return {...ex,kg,reps:String(ex.eq==="cd"?"40s":r),repsPerRound:r,modeTag:"AMRAP"}; } const r=metRepsEmom(ex); return {...ex,kg,reps:String(ex.eq==="cd"?"40s":r),repsPerMinute:r,modeTag:"EMOM"}; }); const durationMin=mode==="amrap"?cap:(exercises.length*rounds); blocks.push({label:(mode==="amrap"?"AMRAP ":"EMOM ")+(b+1),kind:mode,durationMin,rounds:mode==="emom"?rounds:0,exercises}); } const totalMin=blocks.reduce((a,bl)=>a+bl.durationMin,0)+Math.max(0,blocks.length-1)*2; const flat=[]; blocks.forEach(bl=>bl.exercises.forEach(e=>flat.push(e))); return {...day,mode,metcon:true,blocks,totalMin,timeCapMin:blocks[0]?blocks[0].durationMin:cap,emomMinutes:blocks[0]?blocks[0].durationMin:8,exercises:flat}; };
const applyMode=(day,mode,profile,week,seed)=>{ if(!day||!day.salle) return day; if(mode==="amrap"||mode==="emom") return buildMetcon(day,mode,profile,week,seed); return day.circuit?buildCircuits(day,profile):day; };
const primaryMuscle = (m) => String(m||"").split("\u00b7")[0].trim().toLowerCase();
const altPool = (ex) => DB.filter(e=>e.id!==ex.id && e.eq===ex.eq && primaryMuscle(e.m)===primaryMuscle(ex.m));
const rotateDay = (day,w) => {
  if(!day || !day.salle) return day;
  const ph=phaseOf(w);
  const exercises=(day.exercises||[]).map((ex,i)=>{
    const pool=[ex,...altPool(ex)];
    const pick=pool[(w+i)%pool.length];
    const base=typeof ex.sets==="number"?ex.sets:4;
    return {...pick,sets:Math.max(2,Math.min(6,base+ph.s)),rest:snapRest((typeof pick.rest==="number"?pick.rest:60)*(ph.r||1))};
  });
  return {...day,exercises};
};

// Adapte les exercices au materiel disponible (epic A) : remplace un exo non realisable par une variante du meme muscle dans le materiel dispo
const GOAL_ADJ={force:{rest:1.25,reps:0.7},endurance:{rest:0.7,reps:1.5},seche:{rest:0.8,reps:1.15},hybride:{rest:1,reps:1}};
const adaptGoal = (day, goal) => {
  if(!day || !day.salle) return day;
  const a=GOAL_ADJ[goal]||GOAL_ADJ.hybride;
  const exercises=(day.exercises||[]).map(ex=>{
    let reps=ex.reps;
    const m=/^\s*(\d+)\s*$/.exec(String(ex.reps||""));
    if(m) reps=String(Math.max(3,Math.min(30,Math.round(parseInt(m[1])*a.reps))));
    const rest=(typeof ex.rest==="number"&&ex.rest>0)?snapRest(ex.rest*a.rest):ex.rest;
    return {...ex,reps,rest};
  });
  return {...day,exercises};
};
const adaptEquip = (day, equip) => {
  if(!day || !day.salle || !equip || !equip.length) return day;
  const exercises=(day.exercises||[]).map(ex=>{
    if(equip.includes(ex.eq)) return ex;
    const sub=DB.find(e=>e.id!==ex.id && primaryMuscle(e)===primaryMuscle(ex) && equip.includes(e.eq));
    return sub?{...sub,sets:ex.sets,rest:ex.rest}:ex;
  });
  return {...day,exercises};
};

const SESSION_TYPES = ["KB Full","KB Endurance","KB Force","Push","Pull & Dos","Jambes","Corps entier","Bras","Cardio HIIT"];

// ─── UTILS ───────────────────────────────────────────────────────────────────
// Cle de date LOCALE (jamais UTC) - evite le decalage d'un jour selon le fuseau.
const localDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const todayKey = () => localDateKey();
// Date réelle du jour de programme dans la semaine courante
// dayIdx 0=LUN ... 6=DIM
const programDate = (dIdx) => {
  const t = new Date();
  const dow = t.getDay() === 0 ? 6 : t.getDay() - 1; // 0=lun
  const d = new Date(t);
  d.setDate(t.getDate() + (dIdx - dow));
  return localDateKey(d);
};
const todayIdx = () => { const d=new Date().getDay(); return d===0?6:d-1; };
const fmtMSS = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtDur = s => s>=3600?`${Math.floor(s/3600)}h${String(Math.floor((s%3600)/60)).padStart(2,"0")}m`:`${Math.floor(s/60)}m${String(s%60).padStart(2,"0")}s`;
const orm = (kg,reps) => kg>0?Math.round(kg*(1+(parseFloat(String(reps).split("–")[0])||8)/30)):null;

function beep() {
  try {
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [0,.15,.30].forEach(d=>{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=1046;g.gain.setValueAtTime(.18,ctx.currentTime+d);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.1);o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.1);});
  } catch {}
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useStopwatch() {
  const [sec,setSec]=useState(0);const[running,setRunning]=useState(false);const ref=useRef(null);
  const start=()=>{setSec(0);setRunning(true);clearInterval(ref.current);ref.current=setInterval(()=>setSec(p=>p+1),1000);};
  const resume=()=>{if(ref.current)clearInterval(ref.current);setRunning(true);ref.current=setInterval(()=>setSec(p=>p+1),1000);};
  const stop=()=>{clearInterval(ref.current);setRunning(false);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setSec(0);};
  useEffect(()=>()=>clearInterval(ref.current),[]);
  return{sec,running,start,resume,stop,reset};
}

function useCountdown(onDone) {
  const[sec,setSec]=useState(0);const[total,setTotal]=useState(0);const[running,setRunning]=useState(false);const[done,setDone]=useState(false);const ref=useRef(null);
  const start=useCallback(s=>{clearInterval(ref.current);setSec(s);setTotal(s);setRunning(true);setDone(false);ref.current=setInterval(()=>setSec(p=>{if(p<=1){clearInterval(ref.current);setRunning(false);setDone(true);beep();onDone?.();return 0;}return p-1;}),1000);},[onDone]);
  const stop=()=>{clearInterval(ref.current);setRunning(false);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setDone(false);setSec(0);setTotal(0);};
  useEffect(()=>()=>clearInterval(ref.current),[]);
  return{sec,total,running,done,start,stop,reset};
}

function useCountUp(target,duration=1200) {
  const[val,setVal]=useState(0);
  useEffect(()=>{
    let start=null,raf;
    const step=ts=>{if(!start)start=ts;const p=Math.min((ts-start)/duration,1);setVal(Math.round(target*p));if(p<1)raf=requestAnimationFrame(step);};
    raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
  },[target]);
  return val;
}

// ─── TAP — Emil: scale(0.97) on press, specific property transition ───────────
function Tap({children,onTap,style,disabled}) {
  const[p,setP]=useState(false);
  return(
    <div onPointerDown={()=>!disabled&&setP(true)} onPointerUp={()=>{setP(false);!disabled&&onTap?.();}} onPointerLeave={()=>setP(false)}
      style={{...style,transform:p&&!disabled?"scale(0.97)":"scale(1)",transition:`transform ${DUR.btn} ${EO}`,cursor:disabled?"default":"pointer",WebkitTapHighlightColor:"transparent",userSelect:"none"}}>
      {children}
    </div>
  );
}


// ─── WELCOME SCREEN ──────────────────────────────────────────────────────────
function WelcomeScreen({user,todaySession,streak,onStart,onSkip}){
  const h=new Date().getHours();
  const greet=h<12?"Bonjour":h<18?"Bon après-midi":"Bonsoir";
  const name=user?.user_metadata?.name||"Athlète";
  const isRest=!todaySession?.salle;
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:850,display:"flex",flexDirection:"column",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"52px 24px 32px",maxWidth:480,margin:"0 auto",width:"100%"}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:12}}>{greet}</div>
          <div style={{fontSize:42,fontWeight:700,color:C.ink,letterSpacing:"-.03em",lineHeight:1.05,marginBottom:24}}>{name}</div>
          {streak>0&&<div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:980,background:C.orDim}}><span style={{fontSize:17,fontWeight:700,color:C.orange}}>{streak}</span><span style={{fontSize:14,color:C.orange}}>{" jours"}</span></div>}
        </div>
        <div style={{background:C.s1,borderRadius:22,padding:"24px",marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:12}}>{isRest?"Aujourd'hui":(todaySession?.day||"")+" · Séance du jour"}</div>
          {isRest
            ?<><div style={{fontSize:28,fontWeight:700,color:C.ink4,marginBottom:8}}>Récupération</div><div style={{fontSize:16,color:C.ink4}}>{todaySession?.muscle||"Repos actif"}</div></>
            :<><div style={{fontSize:28,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:10}}>{todaySession?.label}</div><div style={{fontSize:16,color:C.ink3,marginBottom:18}}>{todaySession?.muscle}</div><div style={{display:"flex",gap:8}}><span style={{padding:"6px 12px",borderRadius:8,background:C.s3,fontSize:13,fontWeight:600,color:C.ink3}}>{(todaySession?.exercises||[]).length} exercices</span><span style={{padding:"6px 12px",borderRadius:8,background:C.s3,fontSize:13,fontWeight:600,color:C.ink3}}>{todaySession?.salle==="haut"?"Salle Haute":"Salle Basse"}</span></div></>
          }
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {!isRest&&<Tap onTap={onStart} style={{padding:"17px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:17,fontWeight:600,color:"#000"}}>Commencer</span></Tap>}
          <Tap onTap={onSkip} style={{padding:"15px",borderRadius:15,border:`1px solid ${C.s4}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:17,fontWeight:600,color:C.ink3}}>{isRest?"Entrer":"Voir le programme"}</span></Tap>
        </div>
      </div>
    </div>
  );
}
// ─── AUTH SCREEN ─────────────────────────────────────────────────────────────
function AuthScreen({onAuth}) {
  const[mode,setMode]=useState("login"); // login | signup | magic
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[name,setName]=useState("");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[success,setSuccess]=useState("");

  const handleSubmit = async () => {
    setError("");setSuccess("");
    if(!email.trim()){setError("Email requis.");return;}
    setLoading(true);
    try {
      if(mode==="magic") {
        const{error:e}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});
        if(e) throw e;
        setSuccess("Lien envoyé ! Vérifie ta boîte mail.");
      } else if(mode==="signup") {
        if(!name.trim()){setError("Prénom requis.");setLoading(false);return;}
        if(password.length<6){setError("Mot de passe : 6 caractères min.");setLoading(false);return;}
        const{data,error:e}=await supabase.auth.signUp({email,password,options:{data:{name}}});
        if(e) throw e;
        if(data.user) onAuth(data.user);
        else setSuccess("Vérifie ta boîte mail pour confirmer.");
      } else {
        const{data,error:e}=await supabase.auth.signInWithPassword({email,password});
        if(e) throw e;
        if(data.user) onAuth(data.user);
      }
    } catch(e) {
      const msg=e.message||"Erreur inconnue.";
      setError(msg.includes("Invalid login")||msg.includes("invalid_credentials")?"Email ou mot de passe incorrect.":msg.includes("already registered")?"Email déjà utilisé. Connecte-toi.":msg);
    }
    setLoading(false);
  };

  const inputStyle = {width:"100%",padding:"16px",borderRadius:14,border:`1.5px solid ${C.div}`,background:C.s2,fontFamily:F,fontSize:17,color:C.ink,outline:"none",boxSizing:"border-box",transition:`border-color ${DUR.dropdown} ${EO}`};

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.auth,display:"flex",flexDirection:"column",padding:"env(safe-area-inset-top) 0 env(safe-area-inset-bottom)",fontFamily:F,overflowY:"auto"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        input:focus{border-color:${C.blue}!important;}
      `}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 28px",maxWidth:440,margin:"0 auto",width:"100%",animation:`fadeUp 400ms ${EO} both`}}>
        {/* Brand */}
        <div style={{marginBottom:48}}>
          <div style={{fontSize:40,fontWeight:700,color:C.ink,letterSpacing:"-.03em",marginBottom:6}}>SŌMA</div>
          <div style={{fontSize:17,color:C.ink3,lineHeight:1.5}}>
            {mode==="login"?"Bon retour.":mode==="signup"?"Crée ton compte et commence à tracker.":"Connexion sans mot de passe."}
          </div>
        </div>

        {/* Mode switch */}
        <div style={{display:"flex",background:C.s2,borderRadius:12,padding:3,marginBottom:28,gap:3}}>
          {[["login","Connexion"],["signup","Inscription"],["magic","Magic Link"]].map(([m,l])=>(
            <Tap key={m} onTap={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"9px 6px",borderRadius:10,background:mode===m?C.s4:"transparent",textAlign:"center",transition:`background ${DUR.dropdown} ${EO}`}}>
              <span style={{fontSize:13,fontWeight:mode===m?600:400,color:mode===m?C.ink:C.ink4}}>{l}</span>
            </Tap>
          ))}
        </div>

        {/* Fields */}
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
          {mode==="signup"&&(
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom" style={inputStyle}/>
          )}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" autoCapitalize="none" style={inputStyle}/>
          {mode!=="magic"&&(
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" type="password" style={inputStyle} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          )}
        </div>

        {/* Error / Success */}
        {error&&<div style={{padding:"12px 16px",borderRadius:12,background:C.redDim,marginBottom:16}}><span style={{fontSize:14,color:C.red}}>{error}</span></div>}
        {success&&<div style={{padding:"12px 16px",borderRadius:12,background:C.greenDim,marginBottom:16}}><span style={{fontSize:14,color:C.green}}>{success}</span></div>}

        {/* CTA */}
        <Tap onTap={loading?null:handleSubmit} disabled={loading} style={{padding:"17px",borderRadius:16,background:loading?C.s3:C.blue,display:"flex",alignItems:"center",justifyContent:"center",transition:`background ${DUR.dropdown} ${EO}`}}>
          <span style={{fontSize:17,fontWeight:600,color:loading?C.ink5:"#000"}}>
            {loading?"...":{login:"Se connecter",signup:"Créer le compte",magic:"Envoyer le lien"}[mode]}
          </span>
        </Tap>

        <div style={{fontSize:13,color:C.ink4,textAlign:"center",marginTop:24,lineHeight:1.6}}>
          Tes données sont sauvegardées sur ton compte et accessibles depuis n'importe quel appareil.
        </div>
      </div>
    </div>
  );
}

// ─── REST FULL SCREEN — Freeletics-level ─────────────────────────────────────
function RestFullScreen({timer,label,onSkip,onClose}) {
  if(!timer.running&&!timer.done&&timer.sec===0) return null;
  const pct=timer.total>0?timer.sec/timer.total:0;
  const R=100,circ=2*Math.PI*R;
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.rest,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:F,animation:`fadeIn 200ms ${EO} both`}}>
      <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:32}}>{timer.done?"Prêt à reprendre":"Repos · Prochain exercice"}</div>
      <div style={{fontSize:22,fontWeight:600,color:timer.done?C.green:C.ink2,marginBottom:40,textAlign:"center",padding:"0 32px"}}>{label}</div>
      {/* Big ring */}
      <div style={{position:"relative",width:240,height:240,marginBottom:48}}>
        <svg width="240" height="240" style={{transform:"rotate(-90deg)"}}>
          <circle cx="120" cy="120" r={R} fill="none" stroke={C.s3} strokeWidth="8"/>
          <circle cx="120" cy="120" r={R} fill="none" stroke={timer.done?C.green:C.blue} strokeWidth="8"
            strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray .9s linear",transitionTimingFunction:"linear"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:56,fontWeight:700,color:timer.done?C.green:C.ink,letterSpacing:"-.02em",lineHeight:1}}>{timer.done?"GO":fmtMSS(timer.sec)}</span>
          {!timer.done&&<span style={{fontSize:14,color:C.ink4,marginTop:4}}>/{fmtMSS(timer.total)}</span>}
        </div>
      </div>
      {/* Actions */}
      <div style={{display:"flex",gap:12}}>
        {timer.running&&<Tap onTap={onSkip} style={{padding:"14px 28px",borderRadius:980,border:`1.5px solid ${C.div}`,background:"transparent"}}>
          <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Passer</span>
        </Tap>}
        {timer.done&&<Tap onTap={onClose} style={{padding:"14px 36px",borderRadius:980,background:C.blue}}>
          <span style={{fontSize:17,fontWeight:600,color:"#000"}}>Reprendre</span>
        </Tap>}
        {!timer.done&&<Tap onTap={onClose} style={{padding:"14px 28px",borderRadius:980,border:`1.5px solid ${C.div}`,background:"transparent"}}>
          <span style={{fontSize:15,fontWeight:600,color:C.ink4}}>Fermer</span>
        </Tap>}
      </div>
    </div>
  );
}

// ─── MINI REST OVERLAY (when full screen is closed) ──────────────────────────
function MiniRest({timer,label,onExpand}) {
  if(!timer.running&&!timer.done&&timer.sec===0) return null;
  const pct=timer.total>0?timer.sec/timer.total:0;
  const R=16,circ=2*Math.PI*R;
  return(
    <div style={{position:"fixed",bottom:90,left:16,right:16,zIndex:Z.overlay,display:"flex",justifyContent:"center"}}>
      <Tap onTap={onExpand} style={{background:"rgba(17,17,17,.96)",border:`1px solid ${C.s4}`,borderRadius:16,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,maxWidth:380,width:"100%",backdropFilter:"blur(24px)"}}>
        <svg width="40" height="40" style={{transform:"rotate(-90deg)",flexShrink:0}}>
          <circle cx="20" cy="20" r={R} fill="none" stroke={C.s4} strokeWidth="4"/>
          <circle cx="20" cy="20" r={R} fill="none" stroke={timer.done?C.green:C.blue} strokeWidth="4"
            strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray .8s linear"}}/>
        </svg>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{timer.done?"Repos terminé — Go !":"Repos en cours"}</div>
          <div style={{fontSize:15,fontWeight:700,color:timer.done?C.green:C.ink,marginTop:2}}>{timer.done?"Reprends ta série":fmtMSS(timer.sec)}</div>
        </div>
        <span style={{fontSize:13,fontWeight:600,color:C.blue}}>Agrandir</span>
      </Tap>
    </div>
  );
}

// ─── EXERCISE FULL SCREEN ────────────────────────────────────────────────────
function ExFullScreen({ex,log,onLogSet,onStartRest,onClose,lastKg,dayIdx,exercises,onNav}) {
  const sets=typeof ex.sets==="number"?ex.sets:4;
  const lk=`d${dayIdx}_${ex.id}`;
  const defReps=(()=>{const m=String(ex.reps||"").match(/\d+/);return m?parseInt(m[0]):10;})();
  const [rpe,setRpe]=useState(()=>Number(ex.rpe)||8);
  const [rows,setRows]=useState(()=>Array.from({length:sets},(_,i)=>{const e=log[`${lk}_s${i}`];return{done:!!(e&&e.done),weight:(e&&e.weight!=null)?e.weight:(ex.kg||0),reps:(e&&e.reps!=null)?e.reps:defReps};}));
  const completed=rows.filter(r=>r.done).length;
  const allDone=sets>0&&completed===sets;
  const list=exercises||[];
  const idx=list.findIndex(e=>e.id===ex.id);
  const total=list.length;
  const writeLog=(i,r)=>onLogSet(`${lk}_s${i}`,{done:r.done,weight:r.weight,reps:r.reps,rpe,date:todayKey()});
  const upd=(i,patch)=>setRows(rs=>{const nr=rs.map((r,j)=>j===i?{...r,...patch}:r);if(nr[i].done)writeLog(i,nr[i]);return nr;});
  const toggle=i=>setRows(rs=>{const nr=rs.map((r,j)=>j===i?{...r,done:!r.done}:r);const r=nr[i];writeLog(i,r);if(r.done&&ex.rest>0)onStartRest(ex.rest,ex.n);return nr;});
  const restLbl=ex.rest>=60?fmtMSS(ex.rest):`${ex.rest}s`;
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",fontFamily:F,animation:`fadeIn 200ms ${EO} both`,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.s3}`}}>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,fontWeight:600,color:C.ink3}}>✕</span></Tap>
        <div style={{fontSize:13,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{idx>=0?`Exercice ${idx+1}/${total}`:""}</div>
        <div style={{fontSize:13,fontWeight:600,color:allDone?C.green:C.ink4}}>{completed}/{sets}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 20px"}}>
        <div style={{fontSize:34,fontWeight:700,color:allDone?C.green:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:10,transition:`color 300ms ${EO}`}}>{ex.n}</div>
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:14,color:C.ink3}}>{ex.m}</span><span style={{color:C.s4}}>·</span>
          <span style={{fontSize:13,fontWeight:600,padding:"2px 10px",borderRadius:980,background:C.s2,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span>
          {ex.rest>0&&<><span style={{color:C.s4}}>·</span><span style={{fontSize:13,color:C.ink4}}>repos {restLbl}</span></>}
        </div>
        {lastKg>0&&<div style={{padding:"12px 16px",borderRadius:12,background:C.orDim,marginBottom:20}}><span style={{fontSize:14,fontWeight:600,color:C.orange}}>Dernière fois : {lastKg}kg · vise {lastKg+2.5}kg</span></div>}
        {ex.cue&&<div style={{padding:"16px",borderRadius:14,background:C.s2,marginBottom:20}}><div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Cue technique</div><div style={{fontSize:15,color:C.ink2,lineHeight:1.6}}>{ex.cue}</div></div>}
        <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>RPE — effort ressenti</div>
        <div style={{display:"flex",gap:8,marginBottom:24}}>{[6,7,8,9,10].map(v=>(<Tap key={v} onTap={()=>setRpe(v)} style={{flex:1,height:42,borderRadius:11,background:rpe===v?C.blue:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:700,color:rpe===v?"#000":C.ink3}}>{v}</span></Tap>))}</div>
        <div style={{display:"flex",alignItems:"center",marginBottom:6,padding:"0 2px"}}>
          <span style={{width:30,fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase"}}>Série</span>
          <span style={{flex:1,textAlign:"center",fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em"}}>Charge</span>
          <span style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginRight:8}}>Reps</span>
          <span style={{width:44}}/>
        </div>
        {rows.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderTop:`1px solid ${C.s3}`}}>
            <span style={{fontSize:14,fontWeight:700,color:r.done?C.green:C.ink4,width:30,flexShrink:0}}>{i+1}</span>
            <div style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"center"}}>
              <Tap onTap={()=>upd(i,{weight:Math.max(0,Math.round((r.weight-2.5)*10)/10)})} style={{width:36,height:36,borderRadius:9,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,fontWeight:300,color:C.ink}}>−</span></Tap>
              <span style={{fontSize:16,fontWeight:700,color:C.ink,minWidth:54,textAlign:"center"}}>{r.weight===0?"BW":`${r.weight}kg`}</span>
              <Tap onTap={()=>upd(i,{weight:Math.round((r.weight+2.5)*10)/10})} style={{width:36,height:36,borderRadius:9,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,fontWeight:300,color:C.ink}}>+</span></Tap>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <Tap onTap={()=>upd(i,{reps:Math.max(1,r.reps-1)})} style={{width:34,height:34,borderRadius:9,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:300,color:C.ink}}>−</span></Tap>
              <span style={{fontSize:15,fontWeight:600,color:C.ink2,minWidth:24,textAlign:"center"}}>{r.reps}</span>
              <Tap onTap={()=>upd(i,{reps:r.reps+1})} style={{width:34,height:34,borderRadius:9,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:300,color:C.ink}}>+</span></Tap>
            </div>
            <Tap onTap={()=>toggle(i)} style={{width:44,height:44,borderRadius:12,border:`2px solid ${r.done?C.green:C.div}`,background:r.done?C.greenDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:18,fontWeight:700,color:r.done?C.green:C.ink4}}>{r.done?"✓":""}</span></Tap>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:24}}>
          {idx>0&&<Tap onTap={()=>onNav(-1)} style={{padding:"15px 18px",borderRadius:14,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>← Préc.</span></Tap>}
          {idx>=0&&idx<total-1
            ? <Tap onTap={()=>onNav(1)} style={{flex:1,padding:"15px",borderRadius:14,background:allDone?C.blue:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:600,color:allDone?"#000":C.ink2}}>Exercice suivant →</span></Tap>
            : <Tap onTap={onClose} style={{flex:1,padding:"15px",borderRadius:14,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:600,color:"#000"}}>Terminer</span></Tap>}
        </div>
      </div>
    </div>
  );
}
function ExRow({ex,weight,onWeightChange,log,onLogSet,onStartRest,idx,lastKg,onFullScreen,dayIdx}) {
  const sets=typeof ex.sets==="number"?ex.sets:4;
  const lk=`d${dayIdx}_${ex.id}`;
  const completed=Array.from({length:sets},(_,i)=>!!(log[`${lk}_s${i}`]&&log[`${lk}_s${i}`].done)).filter(Boolean).length;
  const allDone=sets>0&&completed===sets;
  const kg=weight??ex.kg??0;
  const restLbl=ex.rest>0?(ex.rest>=60?fmtMSS(ex.rest):`${ex.rest}s`):null;
  return(
    <Tap onTap={()=>onFullScreen(ex)} style={{borderBottom:`1px solid ${C.s3}`,padding:"16px 0",display:"flex",alignItems:"center",gap:14,animation:`fadeSlideIn 280ms ${EO} ${idx*35}ms both`}}>
      <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,border:`2px solid ${allDone?C.green:C.div}`,background:allDone?C.greenDim:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:`all 250ms ${EO}`}}>
        <span style={{fontSize:13,fontWeight:700,color:allDone?C.green:C.ink4}}>{completed}/{sets}</span>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",gap:8,marginBottom:4,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:17,fontWeight:600,color:allDone?C.ink4:C.ink,textDecoration:allDone?"line-through":"none",transition:`color 250ms ${EO}`}}>{ex.n}</span>
          <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:600,color:C.ink2}}>{sets} × {ex.reps}</span>
          <span style={{color:C.s4}}>·</span>
          <span style={{fontSize:14,color:C.ink3}}>{kg===0?"Poids du corps":`${kg}kg`}</span>
          {restLbl&&<><span style={{color:C.s4}}>·</span><span style={{fontSize:13,color:C.ink4}}>repos {restLbl}</span></>}
          {lastKg>0&&<span style={{fontSize:12,fontWeight:600,color:C.orange}}>↑{lastKg}kg</span>}
        </div>
      </div>
      <span style={{color:C.ink4,fontSize:14,flexShrink:0}}>▶</span>
    </Tap>
  );
}
const groupBlocks=(exos)=>{
  const blocks=[];
  (exos||[]).forEach((ex,idx)=>{
    const key=ex.circuitId?("c"+ex.circuitId):("m:"+(ex.m||"Divers"));
    const last=blocks[blocks.length-1];
    if(last&&last.key===key) last.items.push({ex,idx});
    else blocks.push({key,muscle:ex.m||"Divers",groupType:ex.groupType||null,items:[{ex,idx}]});
  });
  return blocks;
};
const setPlanFor=(ex)=>{
  const n=Math.max(1,typeof ex.sets==="number"?ex.sets:4);
  const W=ex.kg||0;
  return Array.from({length:n},(_,i)=>{
    const frac=n>1?(0.7+0.3*i/(n-1)):1;
    const w=W>0?Math.round(W*frac/2.5)*2.5:0;
    return {w,reps:ex.reps};
  });
};
const repsNum=(r)=>{const m=String(r||"").match(/\d+/);return m?parseInt(m[0]):0;};

function HomeTab({profile,streak,sessions,weights,todaySession,onStartToday,accent}) {
  const now=new Date();
  const wk=(()=>{const d=new Date(now);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0);return d;})();
  const weekSessions=sessions.filter(s=>{const sd=new Date(s.date);return sd>=wk;});
  const weekVol=weekSessions.reduce((a,s)=>a+(s.total_kg||0),0);
  const totalSessions=sessions.length;
  const bw=weights&&weights.length?weights[weights.length-1].kg:(profile&&profile.weight_kg);
  const hour=now.getHours();
  const hello=hour<12?"Bonjour":hour<18?"Bon après-midi":"Bonsoir";
  const name=(profile&&profile.name)?profile.name:"";
  const isRest=!todaySession||!todaySession.salle;
  const Stat=({v,l,sub})=>(<div style={{flex:1,background:C.s1,borderRadius:16,padding:"16px 14px"}}><div style={{fontSize:26,fontWeight:800,color:C.ink,lineHeight:1}}>{v}</div><div style={{fontSize:12,color:C.ink3,marginTop:6,fontWeight:600}}>{l}</div>{sub&&<div style={{fontSize:11,color:C.ink4,marginTop:2}}>{sub}</div>}</div>);
  return (<div style={{padding:"20px 20px 0",maxWidth:600,margin:"0 auto"}}>
    <div style={{marginBottom:6,fontSize:13,color:C.ink4}}>{hello}{name?(", "+name):""}</div>
    <div style={{fontSize:26,fontWeight:800,color:C.ink,letterSpacing:"-.02em",marginBottom:20}}>SŌMA</div>
    <div style={{background:isRest?C.s1:C.ink,borderRadius:20,padding:"20px",marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:isRest?C.ink4:"rgba(255,255,255,.55)",marginBottom:8}}>Aujourd'hui</div>
      <div style={{fontSize:22,fontWeight:800,color:isRest?C.ink:"#fff",marginBottom:4}}>{todaySession?todaySession.label:"Repos"}</div>
      <div style={{fontSize:13,color:isRest?C.ink3:"rgba(255,255,255,.7)",marginBottom:isRest?0:16}}>{todaySession?todaySession.muscle:"Récupération"}</div>
      {!isRest&&<Tap onTap={onStartToday} style={{height:50,borderRadius:14,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:800,color:"#000"}}>Démarrer la séance</span></Tap>}
    </div>
    <div style={{display:"flex",gap:10,marginBottom:12}}>
      <Stat v={streak} l="Série" sub={streak>1?"jours d'affilée":"jour"}/>
      <Stat v={weekSessions.length} l="Cette semaine" sub="séances"/>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:12}}>
      <Stat v={Math.round(weekVol).toLocaleString("fr-FR")} l="Volume semaine" sub="kg soulevés"/>
      <Stat v={totalSessions} l="Total" sub="séances faites"/>
    </div>
    {bw>0&&<div style={{background:C.s1,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:13,color:C.ink3,fontWeight:600}}>Poids de corps</span><span style={{fontSize:17,fontWeight:800,color:C.ink}}>{bw} kg</span></div>}
  </div>);
}
function SessionSettingsSheet({day,curMode,onClose,onApply}) {
  const[mode,setMode]=useState(curMode||"classique");
  const[injury,setInjury]=useState([]);
  const[equipMode,setEquipMode]=useState("all");
  const[equip,setEquip]=useState([]);
  const ZONES=[["epaule","Épaule"],["genou","Genou"],["dos","Dos"],["poignet","Poignet"],["hanche","Hanche"]];
  const EQS=[["kb","Kettlebell"],["db","Haltères"],["bar","Barre"],["mc","Machine"],["cd","Cardio"],["bw","Poids du corps"]];
  const tog=(arr,set,v)=>set(arr.indexOf(v)>=0?arr.filter(x=>x!==v):[...arr,v]);
  const Chip=({on,label,onTap})=>(<Tap onTap={onTap} style={{padding:"10px 14px",borderRadius:11,background:on?C.blue:C.s2,border:`1px solid ${on?C.blue:C.div}`}}><span style={{fontSize:14,fontWeight:600,color:on?"#000":C.ink2}}>{label}</span></Tap>);
  const apply=()=>{ const cons={injury}; if(equipMode==="bw") cons.bw=true; else if(equipMode==="pick"&&equip.length) cons.equipment=equip; onApply({mode,cons}); };
  return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:Z.fullscreen,display:"flex",alignItems:"flex-end",fontFamily:F}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxHeight:"88vh",overflowY:"auto",background:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:"20px 20px calc(20px + env(safe-area-inset-bottom))"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><span style={{fontSize:18,fontWeight:700,color:C.ink}}>Réglages de la séance</span><Tap onTap={onClose} style={{width:36,height:36,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap></div>
      <div style={{fontSize:12,color:C.ink4,marginBottom:18}}>Ces réglages ne s'appliquent qu'à cette séance, pas au reste du programme.</div>
      <div style={{fontSize:12,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Format</div>
      <div style={{display:"flex",gap:8,marginBottom:22}}>{[["classique","Classique"],["amrap","AMRAP"],["emom","EMOM"]].map(([m,l])=><div key={m} style={{flex:1}}><Chip on={mode===m} label={l} onTap={()=>setMode(m)}/></div>)}</div>
      <div style={{fontSize:12,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Blessure — zone à éviter</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:22}}>{ZONES.map(([k,l])=><Chip key={k} on={injury.indexOf(k)>=0} label={l} onTap={()=>tog(injury,setInjury,k)}/>)}</div>
      <div style={{fontSize:12,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Équipement</div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>{[["all","Tout"],["bw","Poids du corps"],["pick","Choisir"]].map(([k,l])=><Chip key={k} on={equipMode===k} label={l} onTap={()=>setEquipMode(k)}/>)}</div>
      {equipMode==="pick"&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>{EQS.map(([k,l])=><Chip key={k} on={equip.indexOf(k)>=0} label={l} onTap={()=>tog(equip,setEquip,k)}/>)}</div>}
      <Tap onTap={apply} style={{marginTop:14,height:52,borderRadius:14,background:C.ink,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:700,color:"#fff"}}>Appliquer à cette séance</span></Tap>
    </div>
  </div>);
}
function CircuitPlayer({mode,exos,onClose,defMin,blocks,onAllDone,startBlock}) {
  const BLK=(blocks&&blocks.length)?blocks:[{label:mode==="amrap"?"AMRAP":"EMOM",kind:mode,exercises:exos||[],durationMin:defMin||(mode==="amrap"?12:Math.max((exos||[]).length,8))}];
  const [bi,setBi]=useState(startBlock||0);
  const cur=BLK[Math.min(bi,BLK.length-1)]||{exercises:[]};
  const kind=cur.kind||mode||"amrap";
  const cexos=cur.exercises||[];
  const lastBlock=bi>=BLK.length-1;
  const [running,setRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [rounds,setRounds]=useState(0);
  const [checked,setChecked]=useState({});
  const [si,setSi]=useState(0);
  const [stour,setStour]=useState(1);
  const [resting,setResting]=useState(0);
  const ref=useRef(null); const lastMin=useRef(0); const restRef=useRef(null);
  const durMin=cur.durationMin||defMin||(kind==="amrap"?12:Math.max(cexos.length,8));
  const total=durMin*60;
  const supTours=cur.tours||(cexos[0]&&cexos[0].sets)||4;
  useEffect(()=>()=>{clearInterval(ref.current);clearInterval(restRef.current);},[]);
  useEffect(()=>{clearInterval(ref.current);clearInterval(restRef.current);setRunning(false);setElapsed(0);setRounds(0);setChecked({});setSi(0);setStour(1);setResting(0);lastMin.current=0;},[bi]);
  const goNext=()=>{clearInterval(ref.current);clearInterval(restRef.current);if(lastBlock){onAllDone&&onAllDone();onClose&&onClose();}else{setBi(b=>b+1);}};
  const startTimer=()=>{if(running||total<=0)return;setRunning(true);lastMin.current=Math.floor(elapsed/60);const tt=total;const isEmom=kind==="emom";ref.current=setInterval(()=>{setElapsed(p=>{const n=p+1;if(isEmom){const cm=Math.floor(n/60);if(cm!==lastMin.current&&n<tt){lastMin.current=cm;beep();}}if(n>=tt){clearInterval(ref.current);beep();setRunning(false);setTimeout(()=>goNext(),900);return tt;}return n;});},1000);};
  const pause=()=>{clearInterval(ref.current);setRunning(false);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setElapsed(0);setRounds(0);lastMin.current=0;};
  const remaining=Math.max(0,total-elapsed);
  const done=total>0&&elapsed>=total;
  const curMin=Math.min(durMin,Math.floor(elapsed/60)+1);
  const secInMin=done?0:60-(elapsed%60);
  const emomEx=cexos.length?cexos[(curMin-1)%cexos.length]:null;
  const startRest=()=>{const rs=cur.restSec||90;setResting(rs);clearInterval(restRef.current);restRef.current=setInterval(()=>{setResting(pp=>{if(pp<=1){clearInterval(restRef.current);beep();return 0;}return pp-1;});},1000);};
  const validateSup=()=>{if(resting>0)return;if(si<cexos.length-1){setSi(si+1);}else{setSi(0);if(stour>=supTours){goNext();}else{setStour(stour+1);startRest();}}};
  const HEAD=(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",flexShrink:0}}>
      <div><div style={{fontSize:20,fontWeight:700,color:C.ink}}>{cur.label||(kind==="amrap"?"AMRAP":kind==="emom"?"EMOM":kind==="circuit"?"Circuit":"Superset")}</div><div style={{fontSize:12,color:C.ink4,marginTop:2}}>Bloc {bi+1}/{BLK.length} \u00b7 {cexos.length} exercices</div></div>
      <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>\u2715</span></Tap>
    </div>);
  let BODY,FOOT;
  if(kind==="superset"||kind==="circuit"){
    BODY=(<div style={{margin:"auto 0",padding:"0 20px 8px",width:"100%"}}>
      {resting>0?(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          <div style={{fontSize:13,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Repos</div>
          <div style={{fontSize:72,fontWeight:700,color:C.green,letterSpacing:"-.03em",lineHeight:1}}>{fmtMSS(resting)}</div>
          <div style={{fontSize:13,color:C.ink4}}>Tour {stour-1>0?stour-1:1}/{supTours} termin\u00e9</div>
        </div>
      ):(
        <div>
          <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:14}}>Tour {stour}/{supTours}</div>
          {cexos.map((ex,i)=>{const act=i===si;const dn=i<si;return(
            <div key={ex.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"16px",borderRadius:14,background:act?C.blueDim:C.s1,border:`1.5px solid ${act?C.blue:"transparent"}`,marginBottom:10,opacity:dn?0.5:1}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:act?C.blue:C.s3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:13,fontWeight:700,color:act?"#000":C.ink3}}>{dn?"\u2713":String.fromCharCode(65+i)}</span></div>
              <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700,color:C.ink}}>{ex.n}</div><div style={{fontSize:13,color:C.ink3}}>{ex.kg>0?ex.kg+"kg \u00b7 ":""}{ex.reps} reps</div></div>
            </div>);})}
        </div>
      )}
    </div>);
    FOOT=(<div style={{display:"flex",gap:10,padding:"12px 20px calc(12px + env(safe-area-inset-bottom))",flexShrink:0}}>
      <Tap onTap={onClose} style={{padding:"16px 22px",borderRadius:14,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Quitter</span></Tap>
      <Tap onTap={resting>0?undefined:validateSup} style={{flex:1,padding:"16px",borderRadius:14,background:resting>0?C.s3:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:700,color:resting>0?C.ink4:"#000"}}>{resting>0?"Repos en cours\u2026":(si<cexos.length-1?("Valider "+String.fromCharCode(65+si)):(stour>=supTours?"Terminer le bloc":"Valider \u2192 repos"))}</span></Tap>
    </div>);
  } else {
    const big=kind==="emom"?fmtMSS(secInMin):fmtMSS(remaining);
    BODY=(<div style={{margin:"auto 0",padding:"0 20px 8px",width:"100%"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:18}}>
        {kind==="emom"&&<div style={{fontSize:14,fontWeight:700,color:C.blue,marginBottom:6}}>Minute {curMin}/{durMin}</div>}
        {kind==="amrap"&&<div style={{fontSize:14,fontWeight:700,color:C.blue,marginBottom:6}}>{rounds} tour{rounds>1?"s":""}</div>}
        <div style={{fontSize:72,fontWeight:700,color:done?C.green:C.ink,letterSpacing:"-.03em",lineHeight:1}}>{done?"FINI":big}</div>
        {kind==="emom"&&emomEx&&!done&&<div style={{marginTop:14,textAlign:"center"}}><div style={{fontSize:22,fontWeight:700,color:C.ink}}>{emomEx.n}</div><div style={{fontSize:15,color:C.ink3,marginTop:2}}>{emomEx.kg>0?emomEx.kg+"kg \u00b7 ":""}{emomEx.reps} reps</div></div>}
      </div>
      <div>
        {cexos.map((ex,i)=>{const hot=kind==="emom"&&running&&emomEx&&emomEx.id===ex.id;const ck=!!checked[i];return(
          <Tap key={ex.id||i} onTap={()=>setChecked(c=>({...c,[i]:!c[i]}))} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,background:(ck||hot)?C.blueDim:C.s1,border:`1px solid ${(ck||hot)?C.blue:"transparent"}`,marginBottom:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:ck?C.blue:C.s3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:13,fontWeight:700,color:ck?"#000":C.ink3}}>{ck?"\u2713":(i+1)}</span></div>
            <div style={{flex:1,fontSize:15,fontWeight:600,color:C.ink,textDecoration:ck?"line-through":"none",opacity:ck?0.6:1}}>{ex.n}</div>
            <div style={{fontSize:14,color:C.ink3}}>{ex.reps}{kind==="emom"?"/min":"/tour"}</div>
          </Tap>);})}
      </div>
    </div>);
    FOOT=(<div style={{display:"flex",gap:10,padding:"12px 20px calc(12px + env(safe-area-inset-bottom))",flexShrink:0}}>
      <Tap onTap={running?pause:reset} style={{padding:"16px 22px",borderRadius:14,background:running?C.redDim:C.s2,border:running?`1px solid ${C.red}`:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:running?C.red:C.ink3}}>{running?"Pause":"Reset"}</span></Tap>
      {(kind==="amrap"&&running&&!done)
        ? <Tap onTap={()=>{setRounds(r=>r+1);setChecked({});}} style={{flex:1,padding:"16px",borderRadius:14,background:C.green,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:700,color:"#000"}}>+1 tour</span></Tap>
        : (!running ? <Tap onTap={startTimer} style={{flex:1,padding:"16px",borderRadius:14,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,fontWeight:700,color:"#000"}}>{elapsed>0?"Reprendre":"D\u00e9marrer le bloc"}</span></Tap> : <div style={{flex:1}}/>)}
    </div>);
  }
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",fontFamily:F,paddingTop:"env(safe-area-inset-top)"}}>
      {HEAD}
      <div style={{flex:1,overflowY:"auto",overscrollBehavior:"contain",display:"flex",flexDirection:"column"}}>{BODY}</div>
      {FOOT}
    </div>);
}
function ExerciseRowCollapsed({ex,dayIdx,log,idx,onOpen,onReplace}) {
  const plan=setPlanFor(ex);const n=plan.length;
  const completed=plan.filter((_,i)=>log[`d${dayIdx}_${ex.id}_s${i}`]&&log[`d${dayIdx}_${ex.id}_s${i}`].done).length;
  const allDone=completed===n;
  const w0=plan[0].w,wn=plan[n-1].w;
  const wlabel=w0>0?(w0===wn?`${w0} kg`:`${w0}→${wn} kg`):"PdC";
  const restLbl=ex.rest>0?(ex.rest>=60?fmtMSS(ex.rest):`${ex.rest}s`):null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,background:C.s1,borderRadius:14,padding:"12px 14px",marginBottom:10,border:`1px solid ${allDone?C.green:C.s3}`,animation:`fadeSlideIn 280ms ${EO} ${idx*35}ms both`}}>
      <Tap onTap={onOpen} style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:allDone?C.greenDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontSize:allDone?18:14,fontWeight:700,color:allDone?C.green:C.ink3}}>{allDone?"✓":`${completed}/${n}`}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:16,fontWeight:600,color:allDone?C.ink4:C.ink,textDecoration:allDone?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.n}</div>
          <div style={{fontSize:13,color:C.ink4,marginTop:2}}>{n} × {ex.reps} · {wlabel}{restLbl?` · ${restLbl}`:""}</div>
        </div>
      </Tap>
      <Tap onTap={()=>onReplace(ex)} style={{width:34,height:34,borderRadius:9,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:15,color:C.ink3}}>⇄</span></Tap>
      <span style={{fontSize:22,color:C.ink4,flexShrink:0,lineHeight:1}}>›</span>
    </div>
  );
}

function ExerciseFocus({ex,dayIdx,log,onLogSet,onClose,onNext,hasNext,idx,count,onDetail}) {
  const plan=setPlanFor(ex);const n=plan.length;
  const lk=`d${dayIdx}_${ex.id}`;
  const [done,setDone]=useState(()=>plan.map((_,i)=>!!(log[`${lk}_s${i}`]&&log[`${lk}_s${i}`].done)));
  const [resting,setResting]=useState(0);
  const restRef=useRef(null);
  const scRef=useRef(null);
  useEffect(()=>()=>clearInterval(restRef.current),[]);
  useEffect(()=>{ if(scRef.current) scRef.current.scrollTop=0; window.scrollTo&&window.scrollTo(0,0); },[ex.id]);
  const startRest=(s)=>{clearInterval(restRef.current);setResting(s);restRef.current=setInterval(()=>{setResting(pp=>{if(pp<=1){clearInterval(restRef.current);beep();return 0;}return pp-1;});},1000);};
  const skipRest=()=>{clearInterval(restRef.current);setResting(0);};
  const cur=done.findIndex(d=>!d);
  const allDone=cur===-1;
  const validate=()=>{
    if(allDone||resting>0) return;
    const i=cur;
    onLogSet(`${lk}_s${i}`,{done:true,weight:plan[i].w,reps:repsNum(ex.reps),date:todayKey()});
    setDone(d=>d.map((v,j)=>j===i?true:v));
    if(i<n-1&&ex.rest>0) startRest(ex.rest);
  };
  const primary=resting>0?{label:`Passer le repos · ${fmtMSS(resting)}`,act:skipRest,bg:C.s2,fg:C.ink}
    :allDone?(hasNext?{label:"Exercice suivant →",act:onNext,bg:C.blue,fg:"#000"}:{label:"Terminer",act:onClose,bg:C.green,fg:"#000"})
    :{label:`Valider la série ${cur+1}`,act:validate,bg:C.blue,fg:"#000"};
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px"}}>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,color:C.ink3}}>‹</span></Tap>
        <span style={{fontSize:13,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Exercice {idx+1}/{count}</span>
        <Tap onTap={()=>onDetail&&onDetail(ex)} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:700,color:C.blue}}>i</span></Tap>
      </div>
      <div style={{padding:"0 24px 8px"}}>
        <div style={{fontSize:30,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1}}>{ex.n}</div>
        <div style={{fontSize:14,color:C.ink4,marginTop:6}}>{ex.m}{ex.cue?` · ${ex.cue}`:""}</div>
      </div>
      <div ref={scRef} style={{flex:1,overflowY:"auto",padding:"12px 20px",WebkitOverflowScrolling:"touch"}}>
        {plan.map((s,i)=>{
          const d=done[i];const isCur=i===cur&&resting===0;
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:16,marginBottom:10,background:isCur?C.blueDim:C.s1,border:`1px solid ${d?C.green:isCur?C.blue:C.s3}`,transition:`all 200ms ${EO}`}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:d?C.green:isCur?C.blue:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:15,fontWeight:700,color:d||isCur?"#000":C.ink3}}>{d?"✓":i+1}</span></div>
              <div style={{flex:1}}><span style={{fontSize:22,fontWeight:700,color:d?C.ink4:C.ink}}>{s.w>0?`${s.w} kg`:"Poids du corps"}</span><span style={{fontSize:16,color:C.ink3,marginLeft:10}}>× {s.reps}</span></div>
            </div>
          );
        })}
        {resting>0&&(
          <div style={{textAlign:"center",padding:"24px 0 8px"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Repos</div>
            <div style={{fontSize:64,fontWeight:700,color:C.ink,letterSpacing:"-.03em",lineHeight:1}}>{fmtMSS(resting)}</div>
          </div>
        )}
        <Tap onTap={primary.act} style={{marginTop:14,padding:"18px",borderRadius:16,background:primary.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:17,fontWeight:700,color:primary.fg}}>{primary.label}</span></Tap>
      </div>
    </div>
  );
}

function WorkoutExercise({ex,log,onLogSet,onStartRest,lastKg,dayIdx,idx,onDetail,onReplace,linked,isLast,onToggleLink}) {
  const sets=typeof ex.sets==="number"?ex.sets:4;
  const lk=`d${dayIdx}_${ex.id}`;
  const defReps=(()=>{const m=String(ex.reps||"").match(/\d+/);return m?parseInt(m[0]):10;})();
  const [rows,setRows]=useState(()=>Array.from({length:sets},(_,i)=>{const e=log[`${lk}_s${i}`];return{done:!!(e&&e.done),weight:(e&&e.weight!=null)?String(e.weight):(ex.kg?String(ex.kg):""),reps:(e&&e.reps!=null)?String(e.reps):String(defReps)};}));
  const completed=rows.filter(r=>r.done).length;
  const allDone=sets>0&&completed===sets;
  const write=(i,r)=>onLogSet(`${lk}_s${i}`,{done:r.done,weight:parseFloat(r.weight)||0,reps:parseInt(r.reps)||0,date:todayKey()});
  const setField=(i,k,v)=>setRows(rs=>{const nr=rs.map((r,j)=>j===i?{...r,[k]:v}:r);if(nr[i].done)write(i,nr[i]);return nr;});
  const toggle=i=>setRows(rs=>{const nr=rs.map((r,j)=>j===i?{...r,done:!r.done}:r);const r=nr[i];write(i,r);if(r.done&&ex.rest>0&&!linked)onStartRest(ex.rest,ex.n);return nr;});
  const restLbl=ex.rest>0?(ex.rest>=60?fmtMSS(ex.rest):`${ex.rest}s`):null;
  const inp={width:"100%",height:40,borderRadius:10,border:`1px solid ${C.s4}`,background:C.s2,color:C.ink,fontSize:16,fontWeight:600,fontFamily:F,textAlign:"center",outline:"none",boxSizing:"border-box"};
  return (
    <div style={{background:C.s1,borderRadius:16,padding:"14px",marginBottom:12,border:`1px solid ${allDone?C.green:C.s3}`,transition:`border-color 250ms ${EO}`,animation:`fadeSlideIn 280ms ${EO} ${idx*35}ms both`}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <Tap onTap={()=>onDetail(ex)} style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <span style={{fontSize:17,fontWeight:600,color:allDone?C.ink4:C.ink,textDecoration:allDone?"line-through":"none"}}>{ex.n}</span>
            <span style={{width:18,height:18,borderRadius:"50%",background:C.s3,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.blue,flexShrink:0}}>i</span>
          </div>
          <div style={{fontSize:13,color:linked?C.blue:C.ink4}}>{linked?"⛓ Superset · enchaîné au suivant (sans repos)":`${ex.m}${restLbl?` · repos ${restLbl}`:""}`}</div>
        </Tap>
        {!isLast&&<Tap onTap={onToggleLink} style={{width:36,height:36,borderRadius:10,background:linked?C.blueDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:15,color:linked?C.blue:C.ink3}}>⛓</span></Tap>}
        <Tap onTap={()=>onReplace(ex)} style={{width:36,height:36,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:16,color:C.ink3}}>⇄</span></Tap>
        <div style={{fontSize:13,fontWeight:700,color:allDone?C.green:C.ink4,minWidth:32,textAlign:"right",flexShrink:0}}>{completed}/{sets}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"26px 1fr 60px 60px 44px",gap:8,alignItems:"center",marginBottom:6,padding:"0 2px"}}>
        <span style={{fontSize:10,fontWeight:600,color:C.ink4,textTransform:"uppercase"}}>Sér</span>
        <span style={{fontSize:10,fontWeight:600,color:C.ink4,textTransform:"uppercase"}}>Objectif</span>
        <span style={{fontSize:10,fontWeight:600,color:C.ink4,textTransform:"uppercase",textAlign:"center"}}>Kg</span>
        <span style={{fontSize:10,fontWeight:600,color:C.ink4,textTransform:"uppercase",textAlign:"center"}}>Reps</span>
        <span/>
      </div>
      {rows.map((r,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"26px 1fr 60px 60px 44px",gap:8,alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:15,fontWeight:700,color:r.done?C.green:C.ink3}}>{i+1}</span>
          <span style={{fontSize:13,color:C.ink4}}>{ex.kg?`${ex.kg}kg`:"PdC"} × {ex.reps}</span>
          <input inputMode="decimal" value={r.weight} onChange={e=>setField(i,"weight",e.target.value.replace(/[^0-9.]/g,""))} placeholder={ex.kg?String(ex.kg):"0"} style={inp}/>
          <input inputMode="numeric" value={r.reps} onChange={e=>setField(i,"reps",e.target.value.replace(/[^0-9]/g,""))} placeholder={String(defReps)} style={inp}/>
          <Tap onTap={()=>toggle(i)} style={{width:44,height:40,borderRadius:10,border:`2px solid ${r.done?C.green:C.div}`,background:r.done?C.greenDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,fontWeight:700,color:r.done?C.green:C.ink4}}>{r.done?"✓":""}</span></Tap>
        </div>
      ))}
    </div>
  );
}

function ProgressLine({data,color=C.blue,height=48}) {
  if(!data||data.length<2) return <div style={{height,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,color:C.ink4}}>Données insuffisantes</span></div>;
  const vals=data.map(d=>d.v),min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
  const W=320,H=height;
  const pts=data.map((d,i)=>[(i/(data.length-1))*(W-24)+12,H-6-((d.v-min)/range)*(H-18)]);
  const path=pts.map((p,i)=>`${i===0?"M":"L"} ${p[0]} ${p[1]}`).join(" ");
  const area=`${path} L ${pts[pts.length-1][0]} ${H} L ${pts[0][0]} ${H} Z`;
  return(
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height}} preserveAspectRatio="none">
        <defs><linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".12"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        <path d={area} fill={`url(#g${color.replace("#","")})`}/>
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3" fill={color} stroke={C.bg} strokeWidth="2"/>)}
        <text x={pts[pts.length-1][0]} y={pts[pts.length-1][1]-8} textAnchor="middle" fontSize="10" fill={color} fontFamily={F} fontWeight="700">{data[data.length-1].v}</text>
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <span style={{fontSize:10,color:C.ink4,fontFamily:F}}>{data[0].date}</span>
        <span style={{fontSize:10,color:C.ink4,fontFamily:F}}>{data[data.length-1].date}</span>
      </div>
    </div>
  );
}

// ─── AI SHEET ─────────────────────────────────────────────────────────────────
function AISheet({onClose,onResult,excluded}) {
  const[type,setType]=useState(null);const[custom,setCustom]=useState("");const[loading,setLoading]=useState(false);
  const generate=async()=>{
    if(!type&&!custom.trim()) return;
    setLoading(true);
    const dbList=DB.filter(e=>!excluded.includes(e.id)).map(e=>`${e.id}:${e.n}(${EQ_LABELS[e.eq]},${e.m},${e.reps},rest:${e.rest}s,rpe:${e.rpe})`).join("|");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`Coach fitness expert. Génère une séance "${type||custom}" UNIQUEMENT avec des exercices de cette base: ${dbList}. 6-7 exercices. JSON valide uniquement: {"titre":string,"exercises":[{"id":string,"n":string,"sets":number,"reps":string,"rest":number,"m":string,"eq":string,"cue":string,"kg":number,"rpe":number}],"abs":[{"id":string,"n":string,"vol":string}]}`}]})});
      const d=await res.json();
      const raw=(d.content?.find(b=>b.type==="text")?.text||"").replace(/```json|```/g,"").trim();
      onResult(JSON.parse(raw));onClose();
    }catch(e){console.error(e);alert("Erreur génération IA.");}
    setLoading(false);
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:Z.sheet,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.72)",backdropFilter:"blur(8px)"}}/>
      <div style={{position:"relative",background:C.s1,borderRadius:"28px 28px 0 0",padding:"28px 24px calc(36px + env(safe-area-inset-bottom))",maxWidth:600,width:"100%",animation:`slideUp ${DUR.modal} ${ED} both`}}>
        <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{fontSize:26,fontWeight:700,color:C.ink,letterSpacing:"-.02em",marginBottom:20}}>Générer une séance</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {SESSION_TYPES.map(t=>(
            <Tap key={t} onTap={()=>setType(t===type?null:t)} style={{padding:"12px 6px",borderRadius:12,textAlign:"center",border:`1.5px solid ${type===t?C.blue:C.div}`,background:type===t?C.blueDim:C.s2,transition:`all 180ms ${EO}`}}>
              <span style={{fontSize:12,fontWeight:type===t?600:400,color:type===t?C.blue:C.ink3}}>{t}</span>
            </Tap>
          ))}
        </div>
        <textarea value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Ou décris ta séance..."
          style={{width:"100%",minHeight:52,padding:"12px 16px",borderRadius:14,border:`1px solid ${C.div}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,resize:"none",outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
        <Tap onTap={generate} disabled={(!type&&!custom.trim())||loading} style={{padding:"16px",borderRadius:16,background:(!type&&!custom.trim())||loading?C.s3:C.blue,display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${EO}`}}>
          <span style={{fontSize:17,fontWeight:600,color:(!type&&!custom.trim())||loading?C.ink5:"#000"}}>{loading?"Génération…":"Générer avec IA"}</span>
        </Tap>
      </div>
    </div>
  );
}

// ─── EXERCISE PICKER ─────────────────────────────────────────────────────────
function ExPicker({onSelect,onClose,currentId,excluded}) {
  const[search,setSearch]=useState("");const[eq,setEq]=useState(null);
  const filtered=DB.filter(e=>(!excluded.includes(e.id))&&e.id!==currentId&&(!search||e.n.toLowerCase().includes(search.toLowerCase())||e.m.toLowerCase().includes(search.toLowerCase()))&&(!eq||e.eq===eq));
  return(
    <div style={{position:"fixed",inset:0,zIndex:Z.sheet,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.72)",backdropFilter:"blur(8px)"}}/>
      <div style={{position:"relative",background:C.s1,borderRadius:"28px 28px 0 0",width:"100%",maxWidth:600,maxHeight:"88vh",display:"flex",flexDirection:"column",animation:`slideUp ${DUR.modal} ${ED} both`}}>
        <div style={{padding:"20px 20px 14px",borderBottom:`1px solid ${C.s3}`,flexShrink:0}}>
          <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 18px"}}/>
          <div style={{fontSize:22,fontWeight:700,color:C.ink,marginBottom:14}}>Remplacer l'exercice</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
          <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
            {Object.entries(EQ_LABELS).map(([k,l])=>(
              <Tap key={k} onTap={()=>setEq(eq===k?null:k)} style={{flexShrink:0,padding:"6px 14px",borderRadius:980,border:`1px solid ${eq===k?C.blue:C.div}`,background:eq===k?C.blueDim:"transparent",transition:`all 150ms ${EO}`}}>
                <span style={{fontSize:12,fontWeight:600,color:eq===k?C.blue:C.ink4}}>{l}</span>
              </Tap>
            ))}
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"0 20px 40px"}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"32px 0",fontSize:15,color:C.ink4}}>Aucun résultat.</div>}
          {filtered.map(ex=>(
            <Tap key={ex.id} onTap={()=>onSelect(ex)} style={{padding:"16px 0",borderBottom:`1px solid ${C.s3}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:C.ink,marginBottom:4}}>{ex.n}</div>
                <div style={{display:"flex",gap:8}}>
                  <span style={{fontSize:13,color:C.ink3}}>{ex.m}</span>
                  <span style={{fontSize:11,fontWeight:600,padding:"1px 8px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span>
                </div>
              </div>
              <span style={{fontSize:20,color:C.blue,fontWeight:300}}>+</span>
            </Tap>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FEEDBACK SHEET ───────────────────────────────────────────────────────────
function FeedbackSheet({onClose,onSave}) {
  const[intensity,setIntensity]=useState(3);
  const[energy,setEnergy]=useState(3);
  const[notes,setNotes]=useState("");
  const[photo,setPhoto]=useState(null);
  const IL=["","Très léger","Léger","Modéré","Intense","Maximum"];
  const EL=["","Épuisé","Fatigué","Normal","Énergisé","Au top"];
  const onPhoto=(e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const mx=420;const sc=Math.min(1,mx/Math.max(im.width,im.height));const cw=Math.round(im.width*sc),ch=Math.round(im.height*sc);const cv=document.createElement("canvas");cv.width=cw;cv.height=ch;cv.getContext("2d").drawImage(im,0,0,cw,ch);setPhoto(cv.toDataURL("image/jpeg",0.7));};im.src=rd.result;};rd.readAsDataURL(f);};
  const bs={fontFamily:F,fontSize:17,fontWeight:600,padding:"15px",borderRadius:14,border:"none",cursor:"pointer",WebkitTapHighlightColor:"transparent",touchAction:"manipulation",width:"100%"};
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.8)"}} onClick={onClose}/>
      <div style={{position:"relative",zIndex:10000,background:C.s1,borderRadius:"28px 28px 0 0",padding:"28px 24px calc(44px + env(safe-area-inset-bottom))",maxWidth:600,width:"100%"}}>
        <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{fontSize:26,fontWeight:700,color:C.ink,marginBottom:6}}>Bilan séance</div>
        <div style={{fontSize:17,color:C.ink3,marginBottom:24}}>Comment c'était ?</div>
        {[{label:"Intensité",val:intensity,set:setIntensity,labels:IL},{label:"Énergie",val:energy,set:setEnergy,labels:EL}].map(({label,val,set,labels})=>(
          <div key={label} style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:17,fontWeight:600,color:C.ink}}>{label}</span>
              <span style={{fontSize:14,color:C.ink3}}>{labels[val]}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5].map(v=>(
                <button key={v} onClick={()=>set(v)} style={{flex:1,height:52,borderRadius:12,border:`2px solid ${val===v?C.blue:C.div}`,background:val===v?C.blueDim:C.s2,color:val===v?C.blue:C.ink4,fontSize:18,fontWeight:val===v?700:400,cursor:"pointer",fontFamily:F,WebkitTapHighlightColor:"transparent"}}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Photo du jour (optionnel)</div>
          {photo
            ? <div style={{position:"relative",display:"inline-block"}}><img src={photo} alt="" style={{width:96,height:128,objectFit:"cover",borderRadius:12,display:"block"}}/><button onClick={()=>setPhoto(null)} style={{position:"absolute",top:-8,right:-8,width:26,height:26,borderRadius:"50%",background:C.s4,color:C.ink,border:"none",fontSize:15,cursor:"pointer",lineHeight:1}}>×</button></div>
            : <label style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:96,height:128,borderRadius:12,border:`1.5px dashed ${C.div}`,background:C.s2,cursor:"pointer"}}><span style={{fontSize:30,color:C.ink4,fontWeight:300}}>+</span><input type="file" accept="image/*" onChange={onPhoto} style={{display:"none"}}/></label>}
        </div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes libres..."
          style={{width:"100%",minHeight:60,padding:"12px 16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,resize:"none",outline:"none",marginBottom:20,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{...bs,flex:1,background:C.s2,color:C.ink3}}>Annuler</button>
          <button onClick={()=>onSave({global:intensity,energy,notes,photo})} style={{...bs,flex:2,background:C.blue,color:"#000"}}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION REPORT ───────────────────────────────────────────────────────────
function SessionReport({session,onClose,onDelete}) {
  if(!session) return null;
  const{totalKg=0,totalSets=0,duration=0,exercises=[],date="",dayLabel="",score=0,feedback}=session;
  const photo=(()=>{try{return JSON.parse(localStorage.getItem("soma_photos")||"{}")[date]||null;}catch(_e){return null;}})();
  const animScore=useCountUp(score,1200);
  const animKg=useCountUp(Math.round(totalKg/1000*10)/10*10,1400);
  const animSets=useCountUp(totalSets,1000);
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen+100,overflowY:"auto",fontFamily:F,animation:`fadeIn 250ms ${EO} both`}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <div style={{padding:"60px 24px 32px",borderBottom:`1px solid ${C.s3}`}}>
          <Tap onTap={onClose} style={{position:"fixed",top:"calc(20px + env(safe-area-inset-top))",right:20,width:36,height:36,borderRadius:"50%",background:C.s2,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:14,color:C.ink3}}>✕</span>
          </Tap>
          <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:10}}>{date}</div>
          <div style={{fontSize:36,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:20}}>{dayLabel}</div>
          {score>0&&<div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 18px",borderRadius:980,background:C.s2,border:`1px solid ${C.div}`}}>
            <span style={{fontSize:22,fontWeight:700,color:C.blue}}>{animScore}</span>
            <span style={{fontSize:12,fontWeight:600,color:C.ink4,letterSpacing:".1em"}}>SCORE</span>
          </div>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:`1px solid ${C.s3}`}}>
          {[
            {l:"Volume",v:totalKg>0?`${animKg/10}t`:"—"},
            {l:"Durée",v:duration>0?fmtDur(duration):"—"},
            {l:"Séries",v:`${animSets}`},
          ].map(({l,v},i)=>(
            <div key={l} style={{padding:"20px 16px",borderRight:i<2?`1px solid ${C.s3}`:"none"}}>
              <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>{l}</div>
              <div style={{fontSize:30,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>{v}</div>
            </div>
          ))}
        </div>
        {photo&&(
          <div style={{padding:"20px 24px 0"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>Photo</div>
            <img src={photo} alt="" style={{width:150,borderRadius:14,display:"block"}}/>
          </div>
        )}
        {exercises.filter(e=>e.completedSets>0).length>0&&(
          <div style={{padding:"20px 24px"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Exercices</div>
            {exercises.filter(e=>e.completedSets>0).map((ex,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.s3}`}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{ex.n||ex.name}</div>
                  <div style={{fontSize:13,color:C.ink3}}>{ex.completedSets} séries · {ex.m||ex.muscle}</div>
                </div>
                {ex.weight>0&&<span style={{fontSize:18,fontWeight:700,color:C.ink}}>{ex.weight}kg</span>}
              </div>
            ))}
          </div>
        )}
        {feedback&&(
          <div style={{padding:"20px 24px",borderTop:`1px solid ${C.s3}`}}>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              {[{l:"Intensité",v:feedback.global},{l:"Énergie",v:feedback.energy}].map(({l,v})=>(
                <div key={l} style={{flex:1,background:C.s2,borderRadius:14,padding:"14px"}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>{l}</div>
                  <div style={{fontSize:26,fontWeight:700,color:C.ink}}>{v}/5</div>
                </div>
              ))}
            </div>
            {feedback.notes&&<div style={{fontSize:15,color:C.ink3,lineHeight:1.65}}>{feedback.notes}</div>}
          </div>
        )}
        <div style={{padding:"0 24px 60px",display:"flex",flexDirection:"column",gap:10}}>
          <Tap onTap={onClose} style={{padding:"16px",borderRadius:15,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:17,fontWeight:600,color:C.ink3}}>Fermer</span>
          </Tap>
          {onDelete&&<Tap onTap={()=>{if(window.confirm("Supprimer cette séance ? Action définitive.")) onDelete(session);}} style={{padding:"14px",borderRadius:15,background:"transparent",border:`1px solid ${C.red}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:15,fontWeight:600,color:C.red}}>Supprimer la séance</span>
          </Tap>}
        </div>
      </div>
    </div>
  );
}

// ─── WEEK SUMMARY ─────────────────────────────────────────────────────────────
function WeekSummary({sessions,accent}) {
  const days=["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
  const today=new Date();
  const dow=today.getDay()===0?6:today.getDay()-1;
  const weekDates=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-dow+i);return localDateKey(d);});
  const thisWeek=sessions.filter(s=>weekDates.includes(s.date));
  const weekVol=thisWeek.reduce((a,s)=>a+(s.totalKg||0),0);
  return(
    <div style={{background:C.s1,borderRadius:20,padding:"20px",marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Cette semaine</div>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {days.map((d,i)=>{
          const date=weekDates[i];const done=sessions.find(s=>s.date===date);const isToday=date===todayKey();
          return(
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",background:done?accent||C.blue:isToday?C.blueDim:"transparent",border:`2px solid ${done?accent||C.blue:isToday?C.blue:C.div}`,display:"flex",alignItems:"center",justifyContent:"center",transition:`all 300ms ${EO}`}}>
                {done&&<span style={{fontSize:10,fontWeight:700,color:"#000"}}>✓</span>}
                {isToday&&!done&&<div style={{width:5,height:5,borderRadius:"50%",background:C.lime}}/>}
              </div>
              <span style={{fontSize:9,fontWeight:600,color:isToday?C.ink:C.ink4}}>{d}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:20,borderTop:`1px solid ${C.s3}`,paddingTop:14}}>
        <div><div style={{fontSize:22,fontWeight:700,color:C.ink}}>{thisWeek.length}<span style={{fontSize:13,fontWeight:400,color:C.ink4}}>/5</span></div><div style={{fontSize:11,color:C.ink4}}>Séances</div></div>
        {weekVol>0&&<div><div style={{fontSize:22,fontWeight:700,color:C.ink}}>{Math.round(weekVol/1000*10)/10}<span style={{fontSize:13,fontWeight:400,color:C.ink4}}>t</span></div><div style={{fontSize:11,color:C.ink4}}>Volume</div></div>}
      </div>
    </div>
  );
}

// ─── STATS TAB ───────────────────────────────────────────────────────────────
function IntervalTimer({onClose}) {
  const [mode,setMode]=useState("amrap");
  const [amrapMin,setAmrapMin]=useState(12);
  const [emomMin,setEmomMin]=useState(10);
  const [emomReps,setEmomReps]=useState(10);
  const [running,setRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [rounds,setRounds]=useState(0);
  const ref=useRef(null);
  const lastMinRef=useRef(0);
  const total=mode==="amrap"?amrapMin*60:emomMin*60;
  useEffect(()=>()=>clearInterval(ref.current),[]);
  const start=()=>{if(running||total<=0)return;setRunning(true);lastMinRef.current=Math.floor(elapsed/60);const md=mode,tt=total;ref.current=setInterval(()=>{setElapsed(p=>{const n=p+1;if(md==="emom"){const cm=Math.floor(n/60);if(cm!==lastMinRef.current&&n<tt){lastMinRef.current=cm;beep();}}if(n>=tt){clearInterval(ref.current);setRunning(false);beep();return tt;}return n;});},1000);};
  const pause=()=>{clearInterval(ref.current);setRunning(false);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setElapsed(0);setRounds(0);lastMinRef.current=0;};
  const remaining=Math.max(0,total-elapsed);
  const done=total>0&&elapsed>=total;
  const curMin=Math.min(emomMin,Math.floor(elapsed/60)+1);
  const secInMin=done?0:(60-(elapsed%60));
  const Step=({label,val,setVal,min,max,unit})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.s2,borderRadius:14,padding:"12px 16px",marginBottom:10}}>
      <span style={{fontSize:15,color:C.ink2}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <Tap onTap={()=>!running&&setVal(Math.max(min,val-1))} style={{width:38,height:38,borderRadius:10,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,color:C.ink}}>−</span></Tap>
        <span style={{fontSize:20,fontWeight:700,color:C.ink,minWidth:58,textAlign:"center"}}>{val}{unit}</span>
        <Tap onTap={()=>!running&&setVal(Math.min(max,val+1))} style={{width:38,height:38,borderRadius:10,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,color:C.ink}}>+</span></Tap>
      </div>
    </div>
  );
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px"}}>
        <div style={{fontSize:20,fontWeight:700,color:C.ink}}>Intervalles</div>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
      </div>
      <div style={{display:"flex",gap:8,padding:"0 20px 16px"}}>
        {[["amrap","AMRAP"],["emom","EMOM"]].map(([m,l])=>(<Tap key={m} onTap={()=>!running&&setMode(m)} style={{flex:1,padding:"12px",borderRadius:12,background:mode===m?C.blue:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:700,color:mode===m?"#000":C.ink3}}>{l}</span></Tap>))}
      </div>
      <div style={{flex:1,overflowY:"auto",overscrollBehavior:"contain",padding:"0 20px 24px",display:"flex",flexDirection:"column",justifyContent:"flex-start"}}>
        <div style={{fontSize:13,color:C.ink4,lineHeight:1.5,marginBottom:16}}>{mode==="amrap"?"As Many Rounds As Possible : un max de tours avant la fin du temps. Compte tes tours avec le bouton.":"Every Minute On the Minute : à chaque début de minute (bip), fais tes reps, repose-toi le reste de la minute."}</div>
        {mode==="amrap"
          ? <Step label="Durée" val={amrapMin} setVal={setAmrapMin} min={1} max={60} unit=" min"/>
          : <><Step label="Durée" val={emomMin} setVal={setEmomMin} min={1} max={60} unit=" min"/><Step label="Reps / minute" val={emomReps} setVal={setEmomReps} min={1} max={50} unit=""/></>}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 0"}}>
          {mode==="emom"&&running&&<div style={{fontSize:14,fontWeight:600,color:C.blue,marginBottom:8}}>Minute {curMin}/{emomMin} · {emomReps} reps</div>}
          <div style={{fontSize:72,fontWeight:700,color:done?C.green:C.ink,letterSpacing:"-.03em",lineHeight:1}}>{done?"FINI":(mode==="emom"&&running?fmtMSS(secInMin):fmtMSS(remaining))}</div>
          {mode==="emom"&&running&&<div style={{fontSize:13,color:C.ink4,marginTop:8}}>Temps total : {fmtMSS(remaining)}</div>}
          {mode==="amrap"&&<div style={{marginTop:24,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:48,fontWeight:700,color:C.blue,lineHeight:1}}>{rounds}</div><div style={{fontSize:12,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>tours</div><Tap onTap={()=>running&&setRounds(r=>r+1)} style={{marginTop:6,padding:"14px 34px",borderRadius:980,background:C.s2,border:`1px solid ${C.div}`,opacity:running?1:0.5}}><span style={{fontSize:16,fontWeight:600,color:C.ink2}}>+1 tour</span></Tap></div>}
        </div>
      </div>
      <div style={{display:"flex",gap:10,padding:"12px 20px"}}>
        <Tap onTap={reset} style={{padding:"16px 22px",borderRadius:14,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Reset</span></Tap>
        <Tap onTap={running?pause:(done?reset:start)} style={{flex:1,padding:"16px",borderRadius:14,background:running?C.redDim:C.blue,border:running?`1px solid ${C.red}`:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:17,fontWeight:700,color:running?C.red:"#000"}}>{running?"Pause":(done?"Recommencer":"Démarrer")}</span></Tap>
      </div>
    </div>
  );
}

function SkillsOctagon({sessions}) {
  const axes=useMemo(()=>{
    const clamp=v=>Math.max(4,Math.min(100,Math.round(v)));
    if(!sessions||!sessions.length) return null;
    let maxW=0,totalKg=0,totalSets=0,rpeSum=0,rpeCnt=0;
    sessions.forEach(s=>{totalKg+=s.totalKg||0;totalSets+=s.totalSets||0;(s.exercises||[]).forEach(e=>{if((e.weight||0)>maxW)maxW=e.weight;});const fb=s.feedback;if(fb&&fb.global){rpeSum+=fb.global;rpeCnt++;}});
    const force=clamp(maxW/1.5);
    const volume=clamp(totalKg/30000*100);
    const endurance=clamp(totalSets/300*100);
    const seances=clamp(sessions.length/30*100);
    const regularite=clamp(sessions.slice(-20).length/15*100);
    const intensite=clamp(rpeCnt?rpeSum/rpeCnt/5*100:0);
    let prog=50;
    if(sessions.length>=4){const h=Math.floor(sessions.length/2);const a=sessions.slice(0,h),b=sessions.slice(h);const avgA=(a.reduce((x,s)=>x+(s.totalKg||0),0)/a.length)||1;const avgB=b.reduce((x,s)=>x+(s.totalKg||0),0)/b.length;prog=clamp(50+(avgB-avgA)/avgA*100);}
    const puissance=clamp((force+intensite)/2);
    return [["Force",force],["Volume",volume],["Endurance",endurance],["Régularité",regularite],["Intensité",intensite],["Progression",prog],["Séances",seances],["Puissance",puissance]];
  },[sessions]);
  if(!axes) return null;
  const cx=150,cy=150,R=92;
  const pt=(i,r)=>{const a=(-90+i*45)*Math.PI/180;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  const poly=axes.map((ax,i)=>pt(i,ax[1]/100*R).join(",")).join(" ");
  const grid=[25,50,75,100].map(g=>axes.map((_,i)=>pt(i,g/100*R).join(",")).join(" "));
  return (
    <div style={{background:C.s1,borderRadius:16,padding:"20px",marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Octogone de compétences</div>
      <div style={{fontSize:13,color:C.ink4,marginBottom:4}}>Tes 8 qualités, calculées sur ton historique.</div>
      <svg viewBox="0 0 300 320" style={{width:"100%",height:"auto",display:"block"}}>
        {grid.map((g,i)=>(<polygon key={"g"+i} points={g} fill="none" stroke={C.s3} strokeWidth="1"/>))}
        {axes.map((_,i)=>{const[x,y]=pt(i,R);return <line key={"l"+i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.s3} strokeWidth="1"/>;})}
        <polygon points={poly} fill={C.blue} fillOpacity="0.25" stroke={C.blue} strokeWidth="2"/>
        {axes.map((ax,i)=>{const[x,y]=pt(i,ax[1]/100*R);return <circle key={"c"+i} cx={x} cy={y} r="3" fill={C.blue}/>;})}
        {axes.map((ax,i)=>{const[x,y]=pt(i,R+16);return <text key={"t"+i} x={x} y={y} fill={C.ink3} fontSize="11" fontWeight="600" textAnchor="middle" dominantBaseline="middle" fontFamily={F}>{ax[0]}</text>;})}
      </svg>
    </div>
  );
}

function LoadChart({data,color=C.blue}){
  if(!data||data.length===0) return <div style={{height:90,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,color:C.ink4}}>Pas encore de données pour cet exercice.</span></div>;
  const vals=data.map(d=>d.v);const max=Math.max(...vals);const min=Math.min(...vals);
  if(data.length===1){
    const v=vals[0];const scaleMax=Math.max(v*1.5,v+10);const frac=Math.min(1,Math.max(0,v/scaleMax));const ang=Math.PI*(1-frac);const cx=110,cy=92,r=80;const nx=cx+r*Math.cos(ang),ny=cy-r*Math.sin(ang);
    return(<div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg viewBox="0 0 220 110" style={{width:"100%",maxWidth:240}}>
        <path d="M30 92 A80 80 0 0 1 190 92" fill="none" stroke={C.s3} strokeWidth="12" strokeLinecap="round"/>
        <path d={`M30 92 A80 80 0 0 1 ${nx} ${ny}`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"/>
        <circle cx={nx} cy={ny} r="7" fill={color}/>
      </svg>
      <div style={{fontSize:24,fontWeight:700,color:C.ink,marginTop:-6}}>{v}kg</div>
      <div style={{fontSize:12,color:C.ink4}}>1 séance enregistrée</div>
    </div>);
  }
  const H=90;const range=(max-min)||1;
  return(<div>
    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:H}}>
      {data.map((d,i)=>{const h=14+((d.v-min)/range)*(H-26);const last=i===data.length-1;return(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%"}}>
          <span style={{fontSize:10,fontWeight:700,color:last?color:C.ink3,marginBottom:3}}>{d.v}</span>
          <div style={{width:"100%",maxWidth:34,height:h,borderRadius:8,background:last?color:C.s3}}/>
        </div>);})}
    </div>
    <div style={{display:"flex",gap:6,marginTop:6}}>
      {data.map((d,i)=>(<div key={i} style={{flex:1,textAlign:"center",fontSize:10,color:C.ink4}}>{d.date}</div>))}
    </div>
  </div>);
}
function StatsTab({sessions,weights,accent,onOpenPhotos}) {
  const[selEx,setSelEx]=useState(null);
  const total=sessions.length,totalKg=sessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const avgScore=total?Math.round(sessions.reduce((a,s)=>a+(s.score||0),0)/total):0;
  const PBCAT={bar:"Barre",db:"Haltères",kb:"Kettlebell",mc:"Machine",bw:"Poids du corps",cd:"Cardio"};
  const[showAllPB,setShowAllPB]=useState(false);
  const pbs=useMemo(()=>{const m={};(sessions||[]).forEach(s=>{(s.exercises||[]).forEach(e=>{if(e&&e.id&&(e.completedSets>0)&&(e.weight>0)){if(!m[e.id]||e.weight>m[e.id])m[e.id]=e.weight;}});});return Object.entries(m).map(([id,kg])=>{const ex=DB.find(x=>x.id===id);if(!ex)return null;return{...ex,pbKg:kg,oneRM:orm(kg,ex.reps)};}).filter(Boolean).sort((a,b)=>(b.oneRM||0)-(a.oneRM||0));},[sessions]);
  const progressData=useMemo(()=>{
    if(!selEx) return [];
    return (sessions||[]).filter(s=>(s.exercises||[]).some(e=>e.id===selEx&&e.weight>0)).map(s=>{const e=(s.exercises||[]).find(x=>x.id===selEx);return{date:(s.date||"").slice(5),v:e?e.weight:0};}).filter(d=>d.v>0).slice(-10);
  },[selEx,sessions]);
  const volumeByWeek=useMemo(()=>{
    const weeks={};sessions.forEach(s=>{const w=s.date.slice(0,7);weeks[w]=(weeks[w]||0)+(s.totalKg||0);});
    return Object.entries(weeks).slice(-8).map(([w,v])=>({date:w.slice(5),v:Math.round(v/1000)}));
  },[sessions]);

  return(
    <div style={{padding:"20px 20px 16px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      
      <WeekSummary sessions={sessions} accent={accent}/>
      <SkillsOctagon sessions={sessions}/>
      {/* Metrics grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[{l:"Séances",v:total},{l:"Volume total",v:totalKg>0?`${(totalKg/1000).toFixed(1)}t`:"—"},{l:"Score moyen",v:avgScore||"—"},{l:"Semaine",v:`${sessions.filter(s=>{const d=new Date();const dow=d.getDay()===0?6:d.getDay()-1;const wd=new Date(d);wd.setDate(d.getDate()-dow);return s.date>=localDateKey(wd);}).length}/5`}].map(({l,v})=>(
          <div key={l} style={{background:C.s1,borderRadius:16,padding:"18px 16px"}}>
            <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>{l}</div>
            <div style={{fontSize:32,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>{v}</div>
          </div>
        ))}
      </div>
      {/* Volume chart */}
      {volumeByWeek.length>1&&(
        <div style={{background:C.s1,borderRadius:16,padding:"20px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:4}}>Volume hebdomadaire</div>
          <div style={{fontSize:12,color:C.ink4,marginBottom:16}}>Tonnes soulevées par semaine</div>
          <ProgressLine data={volumeByWeek} color={accent||C.blue}/>
        </div>
      )}
      {/* Progression par exercice */}
      <div style={{background:C.s1,borderRadius:16,padding:"20px",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:4}}>Progression des charges</div>
        <div style={{fontSize:12,color:C.ink4,marginBottom:16}}>Sélectionne un exercice</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {pbs.slice(0,6).map(pb=>(
            <Tap key={pb.id} onTap={()=>setSelEx(selEx===pb.id?null:pb.id)} style={{padding:"6px 14px",borderRadius:980,border:`1.5px solid ${selEx===pb.id?C.blue:C.div}`,background:selEx===pb.id?C.blueDim:"transparent",transition:`all 150ms ${EO}`}}>
              <span style={{fontSize:12,fontWeight:600,color:selEx===pb.id?C.blue:C.ink3}}>{pb.n.split(" ").slice(0,2).join(" ")}</span>
            </Tap>
          ))}
        </div>
        {selEx?<LoadChart data={progressData} color={C.green}/>:<div style={{height:56,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.ink4}}>Sélectionne un exercice</div>}
      </div>
      {/* PBs */}
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>Personal Bests</div>
      {pbs.length===0?<div style={{textAlign:"center",padding:"32px 0",fontSize:15,color:C.ink4}}>Réalise des séances avec charges pour débloquer tes PB.</div>:
        (()=>{
          const Row=(pb,i)=>(<div key={pb.id||i} style={{background:C.s1,borderRadius:14,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>{pb.n}</div><div style={{fontSize:13,color:C.ink3}}>{pb.m}</div></div><div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:700,color:C.ink}}>{pb.pbKg===0?"BW":pb.pbKg+"kg"}</div></div></div>);
          if(!showAllPB){return(<>{pbs.slice(0,5).map(Row)}{pbs.length>5&&<Tap onTap={()=>setShowAllPB(true)} style={{textAlign:"center",padding:"12px 0",marginTop:2}}><span style={{fontSize:14,fontWeight:700,color:C.blue}}>Voir tous les PB ({pbs.length}) ›</span></Tap>}</>);}
          const groups={};pbs.forEach(pb=>{const eqc=Array.isArray(pb.eq)?pb.eq[0]:pb.eq;const k=PBCAT[eqc]||"Autre";(groups[k]=groups[k]||[]).push(pb);});
          return(<>{Object.keys(groups).map(cat=>(<div key={cat} style={{marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>{cat}</div>{groups[cat].map(Row)}</div>))}<Tap onTap={()=>setShowAllPB(false)} style={{textAlign:"center",padding:"12px 0"}}><span style={{fontSize:14,fontWeight:700,color:C.ink3}}>Réduire ‹</span></Tap></>);
        })()}
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function PhotoProgress({onClose}) {
  const [photos,setPhotos]=useState(()=>{try{return JSON.parse(localStorage.getItem("soma_photos")||"{}");}catch(_e){return {};}});
  const [date,setDate]=useState(todayKey());
  const save=(map)=>{try{localStorage.setItem("soma_photos",JSON.stringify(map));}catch(_e){} setPhotos({...map});};
  const onPhoto=(e)=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const mx=520;const sc=Math.min(1,mx/Math.max(im.width,im.height));const cw=Math.round(im.width*sc),ch=Math.round(im.height*sc);const cv=document.createElement("canvas");cv.width=cw;cv.height=ch;cv.getContext("2d").drawImage(im,0,0,cw,ch);const next={...photos,[date]:cv.toDataURL("image/jpeg",0.72)};save(next);};im.src=rd.result;};rd.readAsDataURL(f);e.target.value="";};
  const del=(d)=>{const next={...photos};delete next[d];save(next);};
  const keys=Object.keys(photos).sort();
  const first=keys[0],last=keys[keys.length-1];
  const gap=(first&&last&&first!==last)?Math.round((new Date(last)-new Date(first))/86400000):0;
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px"}}>
        <div style={{fontSize:20,fontWeight:700,color:C.ink}}>Progression photo</div>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 20px 24px"}}>
        <div style={{background:C.s1,borderRadius:16,padding:"18px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:14}}>Ajouter une photo</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <span style={{fontSize:13,color:C.ink3,width:46}}>Date</span>
            <input type="date" value={date} max={todayKey()} onChange={e=>setDate(e.target.value)} style={{flex:1,height:44,borderRadius:10,border:`1px solid ${C.s4}`,background:C.s2,color:C.ink,fontSize:15,fontFamily:F,padding:"0 12px",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,height:48,borderRadius:12,background:C.blue,cursor:"pointer"}}><span style={{fontSize:15,fontWeight:700,color:"#000"}}>Choisir une photo</span><input type="file" accept="image/*" onChange={onPhoto} style={{display:"none"}}/></label>
          <div style={{fontSize:11,color:C.ink4,marginTop:10,lineHeight:1.5}}>La photo est enregistrée sur cet appareil. Tu peux en ajouter une après coup pour n'importe quelle date.</div>
        </div>
        {keys.length>=2&&(
          <div style={{background:C.s1,borderRadius:16,padding:"18px",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:4}}>Avant / Après</div>
            <div style={{fontSize:12,color:C.ink4,marginBottom:14}}>{gap} jours d'écart</div>
            <div style={{display:"flex",gap:10}}>
              {[["Avant",first],["Après",last]].map(([lbl,d])=>(
                <div key={d} style={{flex:1}}>
                  <div style={{borderRadius:12,overflow:"hidden",background:C.s2,aspectRatio:"3/4"}}><img src={photos[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
                  <div style={{fontSize:11,fontWeight:600,color:C.ink3,marginTop:6,textAlign:"center"}}>{lbl} · {d.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12}}>Toutes les photos</div>
        {keys.length===0?(
          <div style={{textAlign:"center",color:C.ink4,fontSize:14,padding:"30px 0"}}>Aucune photo pour l'instant.</div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[...keys].reverse().map(d=>(
              <div key={d} style={{position:"relative",borderRadius:12,overflow:"hidden",background:C.s2,aspectRatio:"3/4"}}>
                <img src={photos[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <div style={{position:"absolute",left:0,right:0,bottom:0,padding:"4px 6px",background:"linear-gradient(transparent,rgba(0,0,0,.75))",fontSize:10,fontWeight:600,color:"#fff"}}>{d.slice(5)}</div>
                <Tap onTap={()=>del(d)} style={{position:"absolute",top:4,right:4,width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:12,color:"#fff"}}>✕</span></Tap>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({sessions,onSelect,accent,onOpenPhotos}) {
  const[view,setView]=useState(new Date());
  const y=view.getFullYear(),m=view.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const off=first===0?6:first-1;
  const MN=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const DN=["L","M","M","J","V","S","D"];
  const dates=sessions.map(s=>s.date);
  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      {(()=>{
        let photos={};try{photos=JSON.parse(localStorage.getItem("soma_photos")||"{}");}catch(_e){}
        const dates=Object.keys(photos).sort().reverse();
        return (
          <Tap onTap={onOpenPhotos} style={{display:"block"}}>
            <div style={{background:C.s1,borderRadius:20,padding:"20px",marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:dates.length?14:0}}>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:C.ink}}>Progression photo</div>
                  <div style={{fontSize:12,color:C.ink4,marginTop:2}}>{dates.length?`${dates.length} photo${dates.length>1?"s":""} · voir l'évolution`:"Ajoute ta première photo"}</div>
                </div>
                <span style={{fontSize:13,fontWeight:600,color:C.blue}}>{dates.length?"Gérer ›":"+ Ajouter"}</span>
              </div>
              {dates.length>0&&<div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4}}>
                {dates.slice(0,12).map(d=>(
                  <div key={d} style={{flexShrink:0,width:84,height:112,borderRadius:14,overflow:"hidden",background:C.s2,position:"relative"}}>
                    <img src={photos[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <div style={{position:"absolute",left:0,right:0,bottom:0,padding:"4px 8px",background:"linear-gradient(transparent,rgba(0,0,0,.75))",fontSize:11,fontWeight:600,color:"#fff"}}>{d.slice(5)}</div>
                  </div>
                ))}
              </div>}
            </div>
          </Tap>
        );
      })()}
      <div style={{background:C.s1,borderRadius:20,padding:"20px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <Tap onTap={()=>setView(new Date(y,m-1,1))} style={{width:36,height:36,borderRadius:8,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,color:C.ink3}}>‹</span></Tap>
          <span style={{fontSize:17,fontWeight:600,color:C.ink}}>{MN[m]} {y}</span>
          <Tap onTap={()=>setView(new Date(y,m+1,1))} style={{width:36,height:36,borderRadius:8,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:16,color:C.ink3}}>›</span></Tap>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
          {DN.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,fontWeight:600,color:C.ink4,paddingBottom:6}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {Array.from({length:off+days},(_,i)=>{
            if(i<off) return <div key={i}/>;
            const d=i-off+1;
            const key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const done=dates.includes(key),isToday=key===todayKey();
            return(
              <Tap key={i} onTap={()=>{if(done){const s=sessions.find(h=>h.date===key);if(s)onSelect(s);}}}
                style={{aspectRatio:"1",borderRadius:8,background:done?accent||C.blue:isToday?C.s3:"transparent",border:isToday&&!done?`1px solid ${C.div}`:"none",display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${EO}`}}>
                <span style={{fontSize:13,fontWeight:done||isToday?600:400,color:done?"#000":isToday?C.ink:C.ink4}}>{d}</span>
              </Tap>
            );
          })}
        </div>
      </div>
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>Séances récentes</div>
      {sessions.length===0&&<div style={{textAlign:"center",padding:"40px 0",fontSize:17,color:C.ink4}}>Aucune séance terminée.</div>}
      {sessions.slice().reverse().map((s,i)=>{
        const prog=PROGRAM.find(p=>p.day===s.day);
        const label=s.dayLabel||prog?.label||s.day||"Séance";
        return(
          <Tap key={i} onTap={()=>onSelect(s)} style={{background:C.s1,borderRadius:16,padding:"16px 18px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:17,fontWeight:600,color:C.ink}}>{label}</div>
                <div style={{fontSize:13,color:C.ink4,marginTop:2}}>{s.day} · {s.date}</div>
              </div>
              {s.score>0&&<span style={{fontSize:15,fontWeight:700,color:accent||C.blue,padding:"4px 12px",background:C.s3,borderRadius:8}}>{s.score}</span>}
            </div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {s.totalKg>0&&<span style={{fontSize:13,color:C.ink3}}>{s.totalKg.toLocaleString()}kg</span>}
              {s.duration>0&&<span style={{fontSize:13,color:C.ink3}}>{fmtDur(s.duration)}</span>}
              {s.totalSets>0&&<span style={{fontSize:13,color:C.ink3}}>{s.totalSets} séries</span>}
            </div>
          </Tap>
        );
      })}
    </div>
  );
}

// ─── SETTINGS TAB ────────────────────────────────────────────────────────────
function ScheduleEditor({schedule,onChange,onReset,onClose,autoRotate,onToggleAuto}) {
  const assign=(i,tpl)=>{
    const next=schedule.map((d,idx)=>idx===i?{...tpl,day:d.day}:d);
    onChange(next);
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:Z.fullscreen,background:C.bg,display:"flex",flexDirection:"column",fontFamily:F,animation:`slideUp 280ms ${EO}`}}>
      <div style={{padding:`calc(16px + env(safe-area-inset-top)) 20px 14px`,borderBottom:`1px solid ${C.s3}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.03em"}}>Modifier la semaine</div>
          <div style={{fontSize:13,color:C.ink4,marginTop:2}}>Choisis la séance de chaque jour</div>
        </div>
        <Tap onTap={onClose} style={{width:38,height:38,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:18,color:C.ink3}}>✕</span></Tap>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        <Tap onTap={onToggleAuto} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderRadius:14,background:C.s1,marginBottom:20}}>
          <div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>Rotation automatique</div><div style={{fontSize:12,color:C.ink4,marginTop:2}}>Séances différentes chaque semaine</div></div>
          <div style={{width:46,height:28,borderRadius:980,background:autoRotate?C.blue:C.s4,position:"relative",transition:`background 200ms ${EO}`,flexShrink:0}}><div style={{position:"absolute",top:3,left:autoRotate?21:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:`left 200ms ${EO}`}}/></div>
        </Tap>
        {schedule.map((d,i)=>(
          <div key={i} style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:8}}>{d.day} · <span style={{color:d.salle?C.blue:C.ink4}}>{d.label}</span></div>
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2,scrollbarWidth:"none"}}>
              {SESSION_TEMPLATES.map((tp,ti)=>{
                const sel=tp.label===d.label;
                return(
                  <Tap key={ti} onTap={()=>assign(i,tp)} style={{flexShrink:0,padding:"10px 14px",borderRadius:12,background:sel?C.blue:C.s2,border:`1px solid ${sel?C.blue:C.s4}`}}>
                    <span style={{fontSize:14,fontWeight:600,color:sel?"#000":C.ink2}}>{tp.label}</span>
                  </Tap>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:`14px 20px calc(14px + env(safe-area-inset-bottom))`,borderTop:`1px solid ${C.s3}`,display:"flex",gap:10}}>
        <Tap onTap={onReset} style={{flex:1,padding:"15px",borderRadius:14,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Programme par défaut</span></Tap>
        <Tap onTap={onClose} style={{flex:1,padding:"15px",borderRadius:14,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:"#000"}}>Terminé</span></Tap>
      </div>
    </div>
  );
}

function SettingsTab({user,excluded,onToggleExclude,onSignOut,onReset,onOpenLibrary,profile,schedule,onUpdateConfig}) {
  const[showLib,setShowLib]=useState(false);
  const[w,setW]=useState(profile?.weight_kg!=null?String(profile.weight_kg):"");
  const[h,setH]=useState(profile?.height_cm!=null?String(profile.height_cm):"");
  const[ag,setAg]=useState(profile?.age!=null?String(profile.age):"");
  const[saved,setSaved]=useState(false);
  const[saveErr,setSaveErr]=useState(false);
  const[avatar,setAvatar]=useState(()=>{try{return localStorage.getItem("soma_avatar_"+(user?.id||""))||"";}catch(_e){return"";}});
  const avatarRef=useRef(null);
  const onAvatar=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const d=r.result;setAvatar(d);try{localStorage.setItem("soma_avatar_"+(user?.id||""),d);}catch(_e){}};r.readAsDataURL(f);};
  const trainDays=(schedule||[]).map((d,i)=>(d&&d.salle)?i:-1).filter(i=>i>=0);
  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      {/* Profile card */}
      <div style={{background:C.s1,borderRadius:20,padding:"24px",marginBottom:16,display:"flex",alignItems:"center",gap:18}}>
        <div onClick={()=>avatarRef.current&&avatarRef.current.click()} style={{position:"relative",width:56,height:56,borderRadius:"50%",background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",cursor:"pointer"}}>
          {avatar?<img src={avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:22,fontWeight:700,color:"#000"}}>{(user?.user_metadata?.name||user?.email||"U")[0].toUpperCase()}</span>}
          <div style={{position:"absolute",left:0,right:0,bottom:0,background:"rgba(0,0,0,.45)",fontSize:9,color:"#fff",textAlign:"center",padding:"1px 0"}}>{avatar?"Modifier":"Ajouter"}</div>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" onChange={onAvatar} style={{display:"none"}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:19,fontWeight:600,color:C.ink,marginBottom:3}}>{user?.user_metadata?.name||"Athlète"}</div>
          <div style={{fontSize:14,color:C.ink3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.email||""}</div>
        </div>
      </div>
      {/* Mon programme */}
      {onUpdateConfig&&<div style={{background:C.s1,borderRadius:16,padding:"20px",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:16}}>Mon programme</div>
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Objectif</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
          {[["force","Force"],["endurance","Endurance"],["hybride","Hybride"],["seche","Perte de gras"]].map(([k,l])=>(
            <Tap key={k} onTap={()=>onUpdateConfig({goal:k})} style={{padding:"9px 16px",borderRadius:980,border:`1.5px solid ${profile?.goal===k?C.blue:C.div}`,background:profile?.goal===k?C.blueDim:"transparent"}}><span style={{fontSize:13,fontWeight:600,color:profile?.goal===k?C.blue:C.ink3}}>{l}</span></Tap>
          ))}
        </div>
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Jours de séance</div>
        <div style={{display:"flex",gap:6,marginBottom:18}}>
          {["LUN","MAR","MER","JEU","VEN","SAM","DIM"].map((lbl,i)=>{
            const on=trainDays.includes(i);
            return <Tap key={i} onTap={()=>{const nd=on?trainDays.filter(x=>x!==i):[...trainDays,i];if(nd.length)onUpdateConfig({days:nd});}} style={{flex:1,padding:"10px 0",borderRadius:10,background:on?C.blue:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11,fontWeight:700,color:on?"#000":C.ink3}}>{lbl}</span></Tap>;
          })}
        </div>
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Poids de corps</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input inputMode="decimal" value={w} onChange={e=>setW(e.target.value.replace(/[^0-9.]/g,""))} onBlur={()=>onUpdateConfig({weight_kg:w?Number(w):null})} placeholder="kg" style={{width:120,height:46,borderRadius:12,border:`1px solid ${C.s4}`,background:C.s2,color:C.ink,fontSize:17,fontWeight:600,fontFamily:F,textAlign:"center",outline:"none",boxSizing:"border-box"}}/>
          <span style={{fontSize:15,color:C.ink4}}>kg</span>
        </div>
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",margin:"18px 0 8px"}}>Taille</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input inputMode="numeric" value={h} onChange={e=>setH(e.target.value.replace(/[^0-9]/g,""))} onBlur={()=>onUpdateConfig({height_cm:h?Number(h):null})} placeholder="cm" style={{width:120,height:46,borderRadius:12,border:`1px solid ${C.s4}`,background:C.s2,color:C.ink,fontSize:17,fontWeight:600,fontFamily:F,textAlign:"center",outline:"none",boxSizing:"border-box"}}/>
          <span style={{fontSize:15,color:C.ink4}}>cm</span>
        </div>
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",margin:"18px 0 8px"}}>Sexe</div>
        <div style={{display:"flex",gap:8}}>
          {[["homme","Homme"],["femme","Femme"]].map(([k,l])=>(
            <Tap key={k} onTap={()=>onUpdateConfig({sex:k})} style={{flex:1,padding:"10px",borderRadius:10,background:profile?.sex===k?C.blue:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:13,fontWeight:700,color:profile?.sex===k?"#000":C.ink3}}>{l}</span></Tap>
          ))}
        </div>
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",margin:"18px 0 8px"}}>Âge</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input inputMode="numeric" value={ag} onChange={e=>setAg(e.target.value.replace(/[^0-9]/g,""))} onBlur={()=>onUpdateConfig({age:ag?Number(ag):null})} placeholder="ans" style={{width:120,height:46,borderRadius:12,border:`1px solid ${C.s4}`,background:C.s2,color:C.ink,fontSize:17,fontWeight:600,fontFamily:F,textAlign:"center",outline:"none",boxSizing:"border-box"}}/>
          <span style={{fontSize:15,color:C.ink4}}>ans</span>
        </div>
        <Tap onTap={async()=>{const r=await onUpdateConfig({weight_kg:w?Number(w):null,height_cm:h?Number(h):null,age:ag?Number(ag):null});if(r&&r.error){setSaved(false);setSaveErr(true);setTimeout(()=>setSaveErr(false),2400);}else{setSaveErr(false);setSaved(true);setTimeout(()=>setSaved(false),1600);}}} style={{marginTop:18,height:48,borderRadius:12,background:saveErr?C.s4:(saved?C.blue:C.ink),display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,fontWeight:700,color:saveErr?C.ink:(saved?"#000":"#fff"),letterSpacing:".02em"}}>{saveErr?"Erreur — réessayer":(saved?"Enregistré ✓":"Enregistrer")}</span></Tap>
        <div style={{marginTop:20,paddingTop:18,borderTop:`1px solid ${C.s3}`}}>
          <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Programme</div>
          {profile?.program_start?(
            <div style={{fontSize:14,color:C.ink2,marginBottom:12}}>Semaine {progWeekOf(profile.program_start)}/12 · {fmtDateShort(profile.program_start)} → {fmtDateShort(progEndDate(profile.program_start))}</div>
          ):(
            <div style={{fontSize:14,color:C.ink4,marginBottom:12}}>Aucun programme démarré.</div>
          )}
          <Tap onTap={()=>onUpdateConfig({program_start:todayKey()})} style={{padding:"13px",borderRadius:12,background:C.s2,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,fontWeight:600,color:C.blue}}>{profile?.program_start?"Recommencer un programme (12 sem)":"Démarrer un programme (12 sem)"}</span></Tap>
        </div>
      </div>}
      {/* Compte */}
      <div style={{background:C.s1,borderRadius:16,overflow:"hidden",marginBottom:12}}>
        <Tap onTap={onSignOut} style={{padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:17,color:C.ink}}>Se déconnecter</span>
          <span style={{fontSize:17,color:C.blue}}>›</span>
        </Tap>
      </div>
      {/* Bibliotheque */}
      <Tap onTap={onOpenLibrary} style={{background:C.s1,borderRadius:14,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:17,color:C.ink}}>Bibliothèque d'exercices</span>
        <span style={{fontSize:17,color:C.blue}}>›</span>
      </Tap>
      {/* Exclusions */}
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10,marginTop:20}}>
        Exercices exclus {excluded.length>0&&`· ${excluded.length}`}
      </div>
      <Tap onTap={()=>setShowLib(o=>!o)} style={{background:C.s1,borderRadius:showLib?"14px 14px 0 0":14,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:17,color:C.ink}}>Gérer les exclusions · {DB.length} exo</span>
        <span style={{fontSize:17,color:C.blue,transform:showLib?"rotate(90deg)":"none",transition:`transform 200ms ${EO}`,display:"inline-block"}}>›</span>
      </Tap>
      {showLib&&(
        <div style={{background:C.s1,borderRadius:"0 0 14px 14px",overflow:"hidden",marginBottom:12,maxHeight:340,overflowY:"auto"}}>
          {DB.map(ex=>(
            <div key={ex.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderTop:`1px solid ${C.s3}`,opacity:excluded.includes(ex.id)?.4:1}}>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:C.ink}}>{ex.n}</div>
                <div style={{fontSize:12,color:C.ink4}}>{EQ_LABELS[ex.eq]}</div>
              </div>
              <Tap onTap={()=>onToggleExclude(ex.id)} style={{padding:"5px 14px",borderRadius:980,border:`1px solid ${excluded.includes(ex.id)?C.green:C.div}`,background:excluded.includes(ex.id)?C.greenDim:"transparent",transition:`all 150ms ${EO}`}}>
                <span style={{fontSize:12,fontWeight:600,color:excluded.includes(ex.id)?C.green:C.ink4}}>{excluded.includes(ex.id)?"Réactiver":"Exclure"}</span>
              </Tap>
            </div>
          ))}
        </div>
      )}
      {/* Reset */}
      <div style={{background:C.s1,borderRadius:14,overflow:"hidden",marginTop:showLib?0:0}}>
        <Tap onTap={()=>{if(window.confirm("Effacer toutes les données locales ?"))onReset();}} style={{padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:17,color:C.red}}>Effacer les données</span>
          <span style={{fontSize:17,color:C.red}}>›</span>
        </Tap>
      </div>
      <div style={{fontSize:12,color:C.ink4,textAlign:"center",marginTop:28}}>SŌMA · {"S"+weekNumber()} · {DB.length} exercices · build 23.21a</div>
    </div>
  );
}

// ─── TAB TRANSITION — slide between tabs ─────────────────────────────────────
function TabContent({tab,prevTab,children}) {
  const dir = useMemo(()=>{
    const order=["seance","stats","history","settings"];
    const ci=order.indexOf(tab),pi=order.indexOf(prevTab||tab);
    return ci>pi?1:-1;
  },[tab,prevTab]);
  return(
    <div key={tab} style={{animation:`slideTab${dir>0?"Right":"Left"} ${DUR.page} ${EO} both`}}>
      {children}
    </div>
  );
}

// \u2500\u2500\u2500 BIBLIOTHEQUE (epic C) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function ExerciseSheet({ex,fav,onToggleFav,onClose,sessions}) {
  const variants=altPool(ex).slice(0,6);
  const meta=[["Reps",ex.reps],["Repos",ex.rest?ex.rest+"s":"—"],["RPE",ex.rpe||"—"]];
  const hist=(sessions||[]).filter(s=>s.weights&&Number(s.weights[ex.id])>0).map(s=>({date:s.date,kg:Number(s.weights[ex.id])})).sort((a,b)=>a.date<b.date?-1:1);
  return(
    <div style={{position:"fixed",inset:0,zIndex:Z.sheet,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.72)",backdropFilter:"blur(8px)"}}/>
      <div style={{position:"relative",background:C.s1,borderRadius:"28px 28px 0 0",width:"100%",maxWidth:600,maxHeight:"88vh",display:"flex",flexDirection:"column",animation:`slideUp ${DUR.modal} ${ED} both`}}>
        <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.s3}`}}>
          <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 18px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:24,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1}}>{ex.n}</div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}><span style={{fontSize:14,color:C.ink3}}>{ex.m}</span><span style={{fontSize:11,fontWeight:600,padding:"2px 9px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span></div>
            </div>
            <Tap onTap={()=>onToggleFav(ex.id)} style={{width:44,height:44,borderRadius:12,background:fav?C.blueDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:20,color:fav?C.blue:C.ink4}}>{fav?"★":"☆"}</span></Tap>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"18px 20px 40px"}}>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            {meta.map(([l,v])=>(<div key={l} style={{flex:1,background:C.s2,borderRadius:14,padding:"14px",textAlign:"center"}}><div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:C.ink}}>{v}</div></div>))}
          </div>
          {hist.length>=2?(()=>{const W=320,H=120,pad=10;const xs=hist.map((_,i)=>pad+i*(W-2*pad)/(hist.length-1));const mn=Math.min(...hist.map(h=>h.kg)),mx=Math.max(...hist.map(h=>h.kg)),rng=(mx-mn)||1;const ys=hist.map(h=>H-pad-(h.kg-mn)/rng*(H-2*pad));const pts=xs.map((x,i)=>x+","+ys[i]).join(" ");return <div style={{marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}><div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em"}}>Progression — charge</div><div style={{fontSize:13,fontWeight:700,color:C.blue}}>PR {mx}kg</div></div><svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto",display:"block"}}><polyline points={pts} fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>{xs.map((x,i)=>(<circle key={i} cx={x} cy={ys[i]} r="3.5" fill={C.blue}/>))}</svg><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11,color:C.ink4}}>{hist[0].date.slice(5)}</span><span style={{fontSize:11,color:C.ink4}}>{hist[hist.length-1].date.slice(5)}</span></div></div>;})():(<div style={{background:C.s2,borderRadius:14,padding:"16px",marginBottom:20,fontSize:13,color:C.ink4,lineHeight:1.5}}>Fais cet exercice quelques fois pour voir ta courbe de progression.</div>)}
          {ex.cue&&<div style={{background:C.s2,borderRadius:14,padding:"16px",marginBottom:20}}><div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Technique</div><div style={{fontSize:15,color:C.ink2,lineHeight:1.5}}>{ex.cue}</div></div>}
          {variants.length>0&&<div><div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Variantes</div>{variants.map(v=>(<div key={v.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.s3}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,color:C.ink}}>{v.n}</span><span style={{fontSize:11,fontWeight:600,padding:"1px 8px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ_LABELS[v.eq]}</span></div>))}</div>}
        </div>
        <div style={{padding:"0 20px calc(24px + env(safe-area-inset-bottom))"}}><Tap onTap={onClose} style={{padding:"16px",borderRadius:15,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:17,fontWeight:600,color:C.ink3}}>Fermer</span></Tap></div>
      </div>
    </div>
  );
}

function LibraryTab({favorites,onToggleFav,onClose,sessions}) {
  const [search,setSearch]=useState("");
  const [eq,setEq]=useState(null);
  const [mg,setMg]=useState(null);
  const [favOnly,setFavOnly]=useState(false);
  const [sel,setSel]=useState(null);
  const MG=[["Pecs",["pec"]],["Dos",["dos","dorsal","trap"]],["Épaules",["épaul","epaul","delt"]],["Bras",["biceps","triceps","avant-bras"]],["Jambes",["quad","ischio","mollet","adduct","jambe"]],["Fessiers",["fessier"]],["Core",["core","oblique","lombaire","abdo","gainage","équilibre","equilibre","stab"]],["Full / Cardio",["full","cardio","puissance"]]];
  const mgKeys=mg?((MG.find(x=>x[0]===mg)||[])[1]||[]):null;
  const sl=search.toLowerCase();
  const filtered=DB.filter(e=>(!sl||e.n.toLowerCase().includes(sl)||e.m.toLowerCase().includes(sl))&&(!eq||e.eq===eq)&&(!mgKeys||mgKeys.some(k=>e.m.toLowerCase().includes(k)))&&(!favOnly||favorites.includes(e.id)));
  const chip=(active)=>({flexShrink:0,padding:"6px 14px",borderRadius:980,border:`1px solid ${active?C.blue:C.div}`,background:active?C.blueDim:"transparent"});
  return(
    <div style={{position:"fixed",inset:0,zIndex:Z.fullscreen,background:C.bg,fontFamily:F,overflowY:"auto",padding:`calc(20px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom))`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div><div style={{fontSize:28,fontWeight:700,color:C.ink,letterSpacing:"-.03em"}}>Bibliothèque</div><div style={{fontSize:14,color:C.ink4,marginTop:4}}>{DB.length} exercices</div></div>
        <Tap onTap={onClose} style={{width:38,height:38,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:18,color:C.ink3}}>✕</span></Tap>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un exercice..." style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:10}}>
        <Tap onTap={()=>setFavOnly(v=>!v)} style={chip(favOnly)}><span style={{fontSize:12,fontWeight:600,color:favOnly?C.blue:C.ink4}}>★ Favoris</span></Tap>
        {Object.entries(EQ_LABELS).map(([k,l])=>(<Tap key={k} onTap={()=>setEq(eq===k?null:k)} style={chip(eq===k)}><span style={{fontSize:12,fontWeight:600,color:eq===k?C.blue:C.ink4}}>{l}</span></Tap>))}
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:16}}>
        {MG.map(([l])=>(<Tap key={l} onTap={()=>setMg(mg===l?null:l)} style={chip(mg===l)}><span style={{fontSize:12,fontWeight:600,color:mg===l?C.blue:C.ink4}}>{l}</span></Tap>))}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",fontSize:15,color:C.ink4}}>Aucun résultat.</div>}
      {filtered.map(ex=>(
        <Tap key={ex.id} onTap={()=>setSel(ex)} style={{padding:"14px 0",borderBottom:`1px solid ${C.s3}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div style={{minWidth:0}}><div style={{fontSize:15,fontWeight:600,color:C.ink,marginBottom:4}}>{ex.n}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:13,color:C.ink3}}>{ex.m}</span><span style={{fontSize:11,fontWeight:600,padding:"1px 8px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span></div></div>
          {favorites.includes(ex.id)&&<span style={{fontSize:16,color:C.blue,flexShrink:0}}>★</span>}
        </Tap>
      ))}
      {sel&&<ExerciseSheet ex={sel} fav={favorites.includes(sel.id)} onToggleFav={onToggleFav} onClose={()=>setSel(null)} sessions={sessions}/>}
    </div>
  );
}

const FREQ_DAYS = {3:[0,2,4],4:[0,1,3,4],5:[0,1,2,3,4],6:[0,1,2,3,4,5]};
const DAY_LBL = ["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
const generateSchedule = (freq) => {
  const trainIdx = FREQ_DAYS[freq] || FREQ_DAYS[4];
  const train = PROGRAM.filter(d=>d.salle);
  let ti=0;
  return DAY_LBL.map((lbl,i)=>{
    if(trainIdx.includes(i)){ const tpl=train[ti%train.length]; ti++; return {label:tpl.label,salle:tpl.salle,muscle:tpl.muscle,exercises:tpl.exercises,abs:tpl.abs,ids:tpl.ids,day:lbl}; }
    return {...REST_TPL,day:lbl};
  });
};

const generateScheduleDays = (dayIdxArr) => {
  const trainIdx = (dayIdxArr&&dayIdxArr.length)?[...dayIdxArr].sort((a,b)=>a-b):FREQ_DAYS[4];
  const train = PROGRAM.filter(d=>d.salle);
  let ti=0;
  return DAY_LBL.map((lbl,i)=>{
    if(trainIdx.includes(i)){ const tpl=train[ti%train.length]; ti++; return {label:tpl.label,salle:tpl.salle,muscle:tpl.muscle,exercises:tpl.exercises,abs:tpl.abs,ids:tpl.ids,day:lbl}; }
    return {...REST_TPL,day:lbl};
  });
};

function OnboardingScreen({user,onDone}) {
  const [step,setStep]=useState(0);
  const [goal,setGoal]=useState(null);
  const [level,setLevel]=useState(null);
  const [equip,setEquip]=useState([]);
  const [freq,setFreq]=useState(4);
  const [weight,setWeight]=useState("");
  const [saving,setSaving]=useState(false);
  const GOALS=[["force","Force","Force maximale & puissance"],["hypertrophie","Hypertrophie","Prise de muscle & volume"],["seche","Sèche","Perdre du gras, garder le muscle"],["hybride","Hybride","Force + conditionnement"],["endurance","Endurance","Cardio & endurance"],["performance","Performance","Athlétique complet"]];
  const LEVELS=[["debutant","Debutant","Je debute"],["inter","Intermediaire","Quelques mois ou annees"],["avance","Avance","Entraine et regulier"],["athlete","Athlete","Niveau competition"]];
  const EQUIP=[["bw","Poids du corps"],["kb","Kettlebell"],["db","Halteres"],["bar","Barre"],["mc","Machine / salle"],["cd","Cardio"]];
  const FREQS=[3,4,5,6];
  const toggleEq=(k)=>setEquip(pr=>pr.includes(k)?pr.filter(x=>x!==k):[...pr,k]);
  const canNext = step===0?!!goal : step===1?!!level : step===2?equip.length>0 : true;
  const last = step===4;
  const card=(sel)=>({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderRadius:16,background:sel?C.blue:C.s1,border:`1px solid ${sel?C.blue:C.s3}`,marginBottom:12,cursor:"pointer"});
  const ttl=(sel)=>({fontSize:17,fontWeight:600,color:sel?"#000":C.ink});
  const dsc=(sel)=>({fontSize:13,color:sel?"rgba(0,0,0,.6)":C.ink4,marginTop:3});
  const chk=(sel)=> sel?<span style={{fontSize:18,fontWeight:700,color:"#000"}}>✓</span>:null;
  const next = async () => {
    if(!last){ setStep(step+1); return; }
    setSaving(true);
    await onDone({goal,level,equipment:equip,frequency:freq,weight_kg:weight?Number(weight):null});
  };
  const titles=["Ton objectif","Ton niveau","Ton equipement","Jours par semaine","Ton poids (optionnel)"];
  const subs=["Pour orienter ton programme","On calibre l'intensite","On choisit les exercices adaptes","On repartit tes seances","Pour suivre ta progression"];
  return (
    <div style={{position:"fixed",inset:0,zIndex:Z.fullscreen,background:C.bg,display:"flex",flexDirection:"column",fontFamily:F}}>
      <div style={{padding:`calc(22px + env(safe-area-inset-top)) 24px 8px`}}>
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {[0,1,2,3,4].map(i=>(<div key={i} style={{flex:1,height:4,borderRadius:980,background:i<=step?C.blue:C.s3,transition:`background 250ms ${EO}`}}/>))}
        </div>
        <div style={{fontSize:28,fontWeight:700,color:C.ink,letterSpacing:"-.03em",lineHeight:1.1}}>{titles[step]}</div>
        <div style={{fontSize:15,color:C.ink4,marginTop:6}}>{subs[step]}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
        {step===0 && GOALS.map(([k,tt,d])=>(<Tap key={k} onTap={()=>setGoal(k)} style={card(goal===k)}><div><div style={ttl(goal===k)}>{tt}</div><div style={dsc(goal===k)}>{d}</div></div>{chk(goal===k)}</Tap>))}
        {step===1 && LEVELS.map(([k,tt,d])=>(<Tap key={k} onTap={()=>setLevel(k)} style={card(level===k)}><div><div style={ttl(level===k)}>{tt}</div><div style={dsc(level===k)}>{d}</div></div>{chk(level===k)}</Tap>))}
        {step===2 && EQUIP.map(([k,tt])=>(<Tap key={k} onTap={()=>toggleEq(k)} style={card(equip.includes(k))}><div style={ttl(equip.includes(k))}>{tt}</div>{chk(equip.includes(k))}</Tap>))}
        {step===3 && FREQS.map(f=>(<Tap key={f} onTap={()=>setFreq(f)} style={card(freq===f)}><div style={ttl(freq===f)}>{f} jours / semaine</div>{chk(freq===f)}</Tap>))}
        {step===4 && (<div style={{display:"flex",alignItems:"center",gap:14,background:C.s1,borderRadius:16,padding:"20px",border:`1px solid ${C.s3}`}}><input value={weight} onChange={e=>setWeight(e.target.value.replace(/[^0-9.]/g,""))} inputMode="decimal" placeholder="75" style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.ink,fontSize:32,fontWeight:700,fontFamily:F,width:"100%"}}/><span style={{fontSize:18,color:C.ink4}}>kg</span></div>)}
      </div>
      <div style={{padding:`14px 24px calc(20px + env(safe-area-inset-bottom))`,display:"flex",gap:10}}>
        {step>0&&<Tap onTap={()=>setStep(step-1)} style={{padding:"17px 22px",borderRadius:15,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:17,fontWeight:600,color:C.ink3}}>Retour</span></Tap>}
        <Tap onTap={canNext&&!saving?next:undefined} style={{flex:1,padding:"17px",borderRadius:15,background:canNext?C.blue:C.s3,display:"flex",alignItems:"center",justifyContent:"center",opacity:saving?0.6:1}}><span style={{fontSize:17,fontWeight:600,color:canNext?"#000":C.ink4}}>{saving?"Creation...":last?"Creer mon programme":"Continuer"}</span></Tap>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function SomaApp() {
  const[user,setUser]=useState(null);
  const[authLoading,setAuthLoading]=useState(true);
  const[showWelcome,setShowWelcome]=useState(false);
  const[dataReady,setDataReady]=useState(false);
  const[profile,setProfile]=useState(null);
  const[favorites,setFavorites]=useState([]);
  const[supersets,setSupersets]=useState([]);
  const toggleLink=(exId)=>{const key=dayIdx+"_"+exId;setSupersets(prev=>{const next=prev.includes(key)?prev.filter(x=>x!==key):[...prev,key];persist(user?.id,{supersets:next});return next;});};
  const[showLibrary,setShowLibrary]=useState(false);
  const[tab,setTab]=useState("home");
  const[prevTab,setPrevTab]=useState(null);
  const[dayIdx,setDayIdx]=useState(todayIdx());
  const[log,setLog]=useState({});
  const[weights,setWeights]=useState({});
  const[sessions,setSessions]=useState([]);
  const[excluded,setExcluded]=useState([]);
  const[aiOverride,setAiOverride]=useState(null);
  const[schedule,setSchedule]=useState(PROGRAM);
  const[streak,setStreak]=useState(0);
  const[sessionActive,setSessionActive]=useState(false);
  const[showSched,setShowSched]=useState(false);
  const[autoRotate,setAutoRotate]=useState(true);
  const[showFeedback,setShowFeedback]=useState(false);
  const[showAI,setShowAI]=useState(false);
  const[showPhotos,setShowPhotos]=useState(false);
  const[showTimer,setShowTimer]=useState(false);
  const[showReport,setShowReport]=useState(null);
  const[showPicker,setShowPicker]=useState(null);
  const[fullScreenEx,setFullScreenEx]=useState(null);
  const[detailEx,setDetailEx]=useState(null);
  const[focusIdx,setFocusIdx]=useState(null);
  const[showCircuit,setShowCircuit]=useState(false);
  const[supBlock,setSupBlock]=useState(null);
  const[circuitStart,setCircuitStart]=useState(0);
  const[showSettings,setShowSettings]=useState(false);
  const[dayCons,setDayCons]=useState(null);
  const[modeOverride,setModeOverride]=useState(null);
  const[showRestFull,setShowRestFull]=useState(false);
  const[restLabel,setRestLabel]=useState("");
  const[sbReady,setSbReady]=useState(false);
  const[accent,setAccent]=useState(C.blue);
  const clock=useStopwatch();
  const rest=useCountdown(()=>setShowRestFull(true));
  const wk=weekNumber();
  const viewSchedule=useMemo(()=>{let s=autoRotate?schedule.map(d=>rotateDay(d,wk)):schedule;const eq=profile?.equipment;if(eq&&eq.length)s=s.map(d=>adaptEquip(d,eq));const g=profile?.goal;if(g&&g!=="hybride")s=s.map(d=>adaptGoal(d,g));s=s.map(d=>personalizeDay(d,profile,progWeekOf(profile?.program_start)));const _mp=weeklyModePlan(s,profile,progWeekOf(profile?.program_start));s=s.map((d,i)=>(d&&d.salle)?{...d,recommendedMode:(_mp[i]&&_mp[i].mode)||"classique",circuit:(_mp[i]&&_mp[i].circuit)||false}:d);return s;},[schedule,autoRotate,wk,profile]);


  // ── Auth listener ──
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user||null);setAuthLoading(false);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user||null);
    });
    return()=>subscription.unsubscribe();
  },[]);

  const loadingRef=useRef(null);
  const loadUserData = useCallback(async(uid)=>{
    if(!uid||loadingRef.current===uid) return; // garde anti-doublon
    loadingRef.current=uid;
    // Load from local first (instant)
    const local=JSON.parse(localStorage.getItem(`soma_${uid}`)||"{}");
    if(local.log) setLog(local.log);
    if(local.weights) setWeights(local.weights);
    if(local.sessions){setSessions(local.sessions);computeStreak(local.sessions);}
    if(local.excluded) setExcluded(local.excluded);
    if(local.accent) setAccent(local.accent);
    if(local.schedule) setSchedule(local.schedule);
    if(typeof local.autoRotate==="boolean") setAutoRotate(local.autoRotate);
    if(local.profile) setProfile(local.profile);
    if(local.favorites) setFavorites(local.favorites);
    if(local.supersets) setSupersets(local.supersets);
    // Then sync from Supabase
    try{
      const[{data:sess},{data:pbs},{data:strData},{data:prof}]=await Promise.all([
        supabase.from("sessions").select("*").eq("user_id",uid).order("date",{ascending:false}),
        supabase.from("personal_bests").select("*").eq("user_id",uid),
        supabase.from("streaks").select("*").eq("user_id",uid).single(),
        supabase.from("profiles").select("*").eq("id",uid).maybeSingle(),
      ]);
      setProfile(prof||null); if(prof) persist(uid,{profile:prof});
      // Le serveur fait autorite : sa liste remplace le local (evite les seances fantomes apres suppression/wipe)
      const norm=(sess||[]).map(s=>({...s,
        dayLabel:s.day_label||s.dayLabel||s.day||"",
        totalKg:Number(s.total_kg||s.totalKg||0),
        totalSets:Number(s.total_sets||s.totalSets||0),
        duration:Number(s.duration_seconds||s.duration||0),
        exercises:typeof s.exercises==="string"?JSON.parse(s.exercises||"[]"):(s.exercises||[]),
        feedback:typeof s.feedback==="string"?JSON.parse(s.feedback||"null"):s.feedback,
      }));
      setSessions(norm);computeStreak(norm);persist(uid,{sessions:norm});
      if(pbs?.length){const w={};pbs.forEach(pb=>{w[pb.exercise_id||pb.exercise_name]=pb.weight_kg;});setWeights(prev=>{const next={...prev,...w};persist(uid,{weights:next});return next;});}
      if(strData) setStreak(strData.current_streak||0);
      setSbReady(true);
      setDataReady(true);
      if(!sessionStorage.getItem('sw')){setShowWelcome(true);sessionStorage.setItem('sw','1');}
    }catch(e){console.error(e);setDataReady(true);}
    finally{loadingRef.current=null;}
  },[]);

  useEffect(()=>{if(user) loadUserData(user.id);},[user]);

  function computeStreak(sess){
    const dates=(sess||[]).map(s=>s.date);let s=0;
    for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);if(dates.includes(localDateKey(d)))s++;else break;}
    setStreak(s);
  }

  const persist = useCallback((uid,updates)=>{
    const key=`soma_${uid||user?.id||"anon"}`;
    const current=JSON.parse(localStorage.getItem(key)||"{}");
    localStorage.setItem(key,JSON.stringify({...current,...updates}));
  },[user]);

  const saveLog=useCallback((key,val)=>{
    setLog(prev=>{const next={...prev,[key]:val};persist(user?.id,{log:next});return next;});
    if(val.weight) setWeights(prev=>{const exId=key.split("_s")[0];if(!prev[exId]||val.weight>prev[exId]){const next={...prev,[exId]:val.weight};persist(user?.id,{weights:next});return next;}return prev;});
  },[persist]);

  const saveWeight=useCallback((id,val)=>{setWeights(prev=>{const next={...prev,[id]:val};persist(user?.id,{weights:next});return next;});},[persist]);
  const toggleExclude=useCallback(id=>{setExcluded(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];persist(user?.id,{excluded:next});return next;});},[persist]);

  const deleteSession=useCallback(async(s)=>{
    const uid=user?.id;
    setSessions(prev=>{const next=prev.filter(x=>x.date!==s.date);computeStreak(next);persist(uid,{sessions:next});return next;});
    setShowReport(null);
    if(uid){try{await supabase.from("sessions").delete().eq("user_id",uid).eq("date",s.date);}catch(e){console.error("del session",e);}}
  },[user,persist]);

  const toggleFav=useCallback(id=>{setFavorites(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];persist(user?.id,{favorites:next});return next;});},[persist]);
  const updateConfig=useCallback((updates)=>{
    const next={...(profile||{}),...updates};
    if(updates.days){ next.frequency=updates.days.length; const sched=generateScheduleDays(updates.days); setSchedule(sched); persist(user?.id,{schedule:sched}); }
    else if(updates.frequency){ const days=FREQ_DAYS[updates.frequency]||FREQ_DAYS[4]; const sched=generateScheduleDays(days); setSchedule(sched); persist(user?.id,{schedule:sched}); }
    setProfile(next);
    persist(user?.id,{profile:next});
    return (async()=>{ try{ const{error}=await supabase.from("profiles").upsert({id:user?.id,goal:next.goal,level:next.level,equipment:next.equipment,frequency:next.frequency,weight_kg:next.weight_kg,sex:next.sex,height_cm:next.height_cm,age:next.age,program_start:next.program_start,rms:next.rms,updated_at:new Date().toISOString()},{onConflict:"id"}); if(error)console.error("profile save",error.message); return {error}; }catch(e){ console.error("profile save",e); return {error:e}; } })();
  },[persist,user,profile]);

  const switchTab=useCallback(id=>{setPrevTab(tab);setTab(id);try{window.scrollTo(0,0);}catch(_e){}},[tab]);
  useEffect(()=>{ if(focusIdx!=null){ try{window.scrollTo({top:0,behavior:"auto"});}catch(_e){try{window.scrollTo(0,0);}catch(__e){}} } },[focusIdx]);

  const handleStartRest=(s,n)=>{setRestLabel(n);rest.start(s);setShowRestFull(true);};

  const handleReplaceEx=(replaced,newEx)=>{
    const day=viewSchedule[dayIdx]||PROGRAM[dayIdx];
    const src=aiOverride?.exercises||day.exercises||[];
    const newExos=src.map(ex=>ex.id===replaced.id?{...newEx,sets:ex.sets}:ex);
    setAiOverride(prev=>({...(prev||{titre:day.label,abs:day.abs}),exercises:newExos}));
    setShowPicker(null);setFullScreenEx(null);setFocusIdx(null);setShowCircuit(false);setSessionMode("classique");
  };

  const handleFeedbackSave=(fb)=>{
    const day=viewSchedule[dayIdx]||PROGRAM[dayIdx];
    const sDate=programDate(dayIdx);
    if(fb&&fb.photo){try{const pm=JSON.parse(localStorage.getItem("soma_photos")||"{}");pm[sDate]=fb.photo;localStorage.setItem("soma_photos",JSON.stringify(pm));}catch(_e){} delete fb.photo;}
    const exos=aiOverride?.exercises||day.exercises||[];
    let totalKg=0,totalSets=0;
    const exercisesData=exos.map(ex=>{
      const s=typeof ex.sets==="number"?ex.sets:4;
      let completedSets=0,lastWeight=0,topWeight=0;
      Array.from({length:s},(_,i)=>{
        const e=log[`d${dayIdx}_${ex.id}_s${i}`];
        if(e?.done){completedSets++;lastWeight=e.weight||0;if(lastWeight>topWeight)topWeight=lastWeight;const r=Number(e.reps)||parseFloat(String(ex.reps||"8").split("–")[0])||8;totalKg+=lastWeight*r;totalSets++;}
      });
      return{id:ex.id,n:ex.n||ex.name,m:ex.m||ex.muscle,weight:topWeight,completedSets};
    });
    const score=Math.round(Math.min(totalKg/5000*40,40)+Math.min(totalSets/25*30,30)+((fb.global+fb.energy)/10*30));
    // Date = jour du programme (ex: LUN = date du lundi de cette semaine)
    const entry={
      day:day.day,
      dayLabel:aiOverride?.titre||day.label,
      date:sDate,
      exercises:exercisesData,
      totalKg:Math.round(totalKg),
      totalSets,
      duration:clock.sec,
      score,
      feedback:fb,
      user_id:user?.id,
      weights:{...weights,...Object.fromEntries(exercisesData.filter(e=>e.weight>0).map(e=>[e.id,e.weight]))}
    };
    // 1. localStorage immédiat
    const uid=user?.id;
    if(uid){
      try{
        const k=`soma_${uid}`;
        const cur=JSON.parse(localStorage.getItem(k)||"{}" );
        const prev=cur.sessions||[];
        const next=[...prev.filter(s=>s.date!==sDate),entry];
        localStorage.setItem(k,JSON.stringify({...cur,sessions:next}));
      }catch(e){console.error("LS",e);}
    }
    // 2. State React
    setSessions(prev=>{
      const next=[...prev.filter(s=>s.date!==sDate),entry];
      computeStreak(next);
      return next;
    });
    // 3. Fermer popup immédiatement
    clock.stop();
    setSessionActive(false);
    setShowFeedback(false);
    setShowReport(entry);
    // 4. Supabase en arrière-plan
    if(uid){
      supabase.from("sessions").upsert({
        user_id:uid,date:sDate,week:"S"+wk,
        day:day.day,day_label:entry.dayLabel,
        session_type:entry.dayLabel,
        total_kg:Math.round(totalKg),total_sets:totalSets,
        duration_seconds:clock.sec,score,
        exercises:JSON.stringify(exercisesData),
        feedback:JSON.stringify(fb),
        notes:fb.notes||""
      },{onConflict:"user_id,date"}).then(({error:e})=>{
        if(e) console.error("SB session:",e.message);
      });
      supabase.from("personal_bests").upsert(
        exercisesData.filter(e=>e.weight>0).map(e=>({
          user_id:uid,exercise_id:e.id,exercise_name:e.n||e.name||"",
          weight_kg:e.weight,reps:8,one_rm:orm(e.weight,"8"),achieved_at:sDate
        })),{onConflict:"user_id,exercise_id"}
      ).then(({error:e})=>{ if(e) console.error("SB pb:",e.message); });
    }
  };

  const lastKgPerEx=useMemo(()=>{
    const map={};sessions.slice().reverse().forEach(s=>{(s.exercises||[]).forEach(ex=>{if(ex.weight&&!map[ex.id])map[ex.id]=ex.weight;});});return map;
  },[sessions]);

  if(authLoading) return(
    <div style={{position:"fixed",inset:0,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:F}}>
      <div style={{fontSize:32,fontWeight:700,color:C.ink,letterSpacing:"-.03em"}}>SŌMA</div>
      <div style={{width:6,height:6,borderRadius:"50%",background:C.blue,animation:"pulse 1s ease-in-out infinite"}}/>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );

  if(!user) return <AuthScreen onAuth={u=>{setUser(u);loadUserData(u.id);}}/>;
  if(!dataReady) return(<div style={{position:"fixed",inset:0,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20,fontFamily:F}}><style>{"@keyframes p{0%,100%{opacity:.3}50%{opacity:1}}"}</style><div style={{fontSize:36,fontWeight:700,color:C.ink,letterSpacing:"-.03em"}}>SŌMA</div><div style={{width:8,height:8,borderRadius:"50%",background:C.blue,animation:"p 1s ease-in-out infinite"}}/></div>);
  if(!profile) return <OnboardingScreen user={user} onDone={async(data)=>{
    const uid=user.id;
    const sched=generateSchedule(data.frequency);
    setSchedule(sched);
    const prof={id:uid,name:user?.user_metadata?.name||null,goal:data.goal,level:data.level,equipment:data.equipment,frequency:data.frequency,weight_kg:data.weight_kg,program_start:todayKey(),updated_at:new Date().toISOString()};
    setProfile(prof);
    persist(uid,{schedule:sched,profile:prof});
    try{await supabase.from("profiles").upsert(prof,{onConflict:"id"});}catch(e){console.error("profile",e);}
  }}/>;
  if(false&&showWelcome) return(<WelcomeScreen user={user} todaySession={viewSchedule[todayIdx()]||PROGRAM[todayIdx()]} streak={streak} onStart={()=>{setShowWelcome(false);setDayIdx(todayIdx());}} onSkip={()=>setShowWelcome(false)}/>);

  const day0=viewSchedule[dayIdx]||PROGRAM[dayIdx];
  const effMode=modeOverride||day0?.recommendedMode||"classique";
  const sessionMode=effMode;
  const day=applyMode(day0,effMode,profile,progWeekOf(profile?.program_start),dayIdx,dayCons);
  const sDate=programDate(dayIdx);
  const isDayDone=sessions.some(s=>s.date===sDate&&s.day===day?.day);
  const doneSession=isDayDone?sessions.find(s=>s.date===sDate&&s.day===day?.day):null;
  const isRest=!day?.salle;
  const exos=((isDayDone&&doneSession)?(doneSession.exercises||[]):(aiOverride?.exercises||day?.exercises||[])).filter(e=>!excluded.includes(e.id));
  const absExos=aiOverride?.abs||day?.abs||[];
  const NAV_ICONS={
  home:(<><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10"/></>),
  seance:(<><path d="M6.5 6.5l11 11"/><path d="M21 21l-1-1"/><path d="M3 3l1 1"/><path d="M18 22l4-4"/><path d="M2 6l4-4"/><path d="M3 10l7-7"/><path d="M14 21l7-7"/></>),
  stats:(<><path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="7"/><rect x="12" y="6" width="3" height="11"/><rect x="17" y="13" width="3" height="4"/></>),
  history:(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  settings:(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>)
};
const NAV=[{id:"home",l:"Accueil"},{id:"seance",l:"Séances"},{id:"stats",l:"Stats"},{id:"settings",l:"Profil"}];

  return(
    <div style={{background:C.bg,minHeight:"100dvh",color:C.ink,fontFamily:F,overflowX:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;}
        body{margin:0;background:${C.bg};}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes slideTabRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
        @keyframes slideTabLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        textarea::placeholder,input::placeholder{color:${C.ink4};}
        ::-webkit-scrollbar{display:none;}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:"rgba(0,0,0,.92)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:`1px solid ${C.s3}`,padding:`calc(14px + env(safe-area-inset-top)) 20px 12px`,position:"sticky",top:0,zIndex:Z.sticky,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.04em"}}>SŌMA</div>
          <div style={{fontSize:10,fontWeight:600,color:C.ink4,letterSpacing:".16em",textTransform:"uppercase"}}>{"S"+wk+" · "}{user?.user_metadata?.name||"Athlète"}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {sessionActive&&(clock.running||clock.sec>0)&&<span style={{fontSize:15,fontWeight:700,color:C.red}}>{fmtDur(clock.sec)}</span>}
          {streak>0&&<span style={{fontSize:13,fontWeight:600,color:C.orange,padding:"4px 12px",borderRadius:980,background:C.orDim}}>{streak}j</span>}
          {sbReady&&<div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>}
        </div>
      </div>

      {/* DAY STRIP */}
      {tab==="seance"&&(
        <div style={{background:C.bg,borderBottom:`1px solid ${C.s3}`,display:"flex",overflowX:"auto",padding:"10px 16px",gap:6,scrollbarWidth:"none"}}>
          {viewSchedule.map((d,i)=>{
            const exList=d.exercises||[];
            const done=exList.filter(e=>Array.from({length:typeof e.sets==="number"?e.sets:4},(_,si)=>si).every(si=>log[`d${i}_${e.id}_s${si}`]?.done)).length;
            const pct=exList.length?done/exList.length:0;
            const isSel=i===dayIdx,isToday=i===todayIdx();
            return(
              <Tap key={i} onTap={()=>{setDayIdx(i);setAiOverride(null);setDayCons(null);setModeOverride(null);setCircuitStart(0);setSupBlock(null);}} style={{flexShrink:0,minWidth:52,padding:"10px 6px",textAlign:"center",borderRadius:12,background:isSel?C.s2:"transparent",border:`1px solid ${isSel?C.s4:"transparent"}`,transition:`all 200ms ${EO}`}}>
                <div style={{fontSize:10,fontWeight:600,color:isSel?C.ink2:C.ink4,letterSpacing:".06em",marginBottom:4}}>{d.day}</div>
                {isToday&&<div style={{width:6,height:6,borderRadius:"50%",background:C.lime,margin:"0 auto 4px"}}/>}
                {d.salle&&pct>0&&<div style={{width:"70%",height:2,background:C.s4,borderRadius:1,margin:"0 auto"}}>
                  <div style={{width:`${pct*100}%`,height:2,background:accent,borderRadius:1,transition:`width 400ms ${EO}`}}/>
                </div>}
              </Tap>
            );
          })}
          <Tap onTap={()=>setShowSched(true)} style={{flexShrink:0,minWidth:52,padding:"10px 6px",textAlign:"center",borderRadius:12,background:"transparent",border:`1px dashed ${C.s4}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:16,color:C.ink4,lineHeight:1}}>\u270e</span>
            <span style={{fontSize:9,fontWeight:600,color:C.ink4,letterSpacing:".04em",marginTop:3}}>Modifier</span>
          </Tap>
        </div>
      )}

      {/* CONTENT */}
      <div style={{paddingBottom:80}}>
        <TabContent tab={tab} prevTab={prevTab}>
          {tab==="home"&&<HomeTab profile={profile} streak={streak} sessions={sessions} weights={weights} todaySession={viewSchedule[todayIdx()]||PROGRAM[todayIdx()]} accent={accent} onStartToday={()=>{setDayIdx(todayIdx());switchTab("seance");}}/>}
          {tab==="seance"&&(
            <div style={{padding:"16px 20px 0",maxWidth:600,margin:"0 auto"}}>
              {isRest?(
                <div style={{textAlign:"center",padding:"80px 20px"}}>
                  <div style={{fontSize:36,fontWeight:700,color:C.ink4,letterSpacing:"-.02em",marginBottom:14}}>Récupération</div>
                  <div style={{fontSize:17,color:C.ink4,lineHeight:1.65,maxWidth:300,margin:"0 auto 28px"}}>{dayIdx===3?"Récupération active. Tes fibres consolident.":"Reset total. Synthèse protéique prioritaire."}</div>
                  <Tap onTap={()=>setShowSettings(true)} style={{display:"inline-flex",padding:"13px 24px",borderRadius:980,border:`1px solid ${C.div}`,background:"transparent"}}>
                    <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Générer une séance légère</span>
                  </Tap>
                </div>
              ):(
                <>
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:8}}>{day.day} · {"S"+wk} · {day.salle==="haut"?"Salle Haute":"Salle Basse"}</div>
                    <div style={{fontSize:34,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:8}}>{aiOverride?.titre||day.label}</div>
                    <div style={{fontSize:17,color:C.ink3}}>{day.muscle}</div>
                    {day.salle&&(()=>{const pw=progWeekOf(profile?.program_start);const ph12=PHASES12[pw-1];const pend=progEndDate(profile?.program_start);return(
                      <div style={{marginTop:12,padding:"12px 14px",borderRadius:14,background:C.s2}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:12,fontWeight:700,color:C.blue,textTransform:"uppercase",letterSpacing:".06em"}}>Cycle 12 sem · S{pw}/12</span>
                          <span style={{fontSize:12,fontWeight:600,color:C.ink3}}>{ph12.n}</span>
                        </div>
                        <div style={{height:6,borderRadius:980,background:C.s4,overflow:"hidden"}}><div style={{height:"100%",width:`${pw/12*100}%`,background:C.blue,borderRadius:980}}/></div>
                        {profile?.program_start&&<div style={{fontSize:11,color:C.ink4,marginTop:8}}>Programme : {fmtDateShort(profile.program_start)} → {fmtDateShort(pend)}</div>}
                        {autoRotate&&<div style={{fontSize:12,color:C.ink4,marginTop:6}}>{ph12.f} · phase {phaseOf(pw).k}</div>}
                      </div>);})()}
                  </div>
                  {!sessionActive?(
                    <div style={{display:"flex",gap:10,marginBottom:24}}>
                      {isDayDone?(
                        <Tap onTap={()=>doneSession&&setShowReport(doneSession)} style={{flex:1,padding:"14px 16px",borderRadius:15,background:C.greenDim,border:`1px solid ${C.green}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                          <span style={{fontSize:17,fontWeight:700,color:C.green}}>Séance terminée ✓</span>
                          <span style={{fontSize:12,fontWeight:700,color:C.green}}>Voir le rapport →</span>
                        </Tap>
                      ):(
                        <Tap onTap={()=>{setSessionActive(true);}} style={{flex:1,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:17,fontWeight:600,color:"#000"}}>Démarrer</span>
                        </Tap>
                      )}
                      <Tap onTap={()=>setShowSettings(true)} style={{padding:"16px 20px",borderRadius:15,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:14,fontWeight:600,color:C.ink3}}>Réglages</span>
                      </Tap>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:10,marginBottom:24}}>
                      <Tap onTap={()=>{if(clock.running){clock.stop();}else if(clock.sec>0){clock.resume();}else{clock.start();}}} style={{flex:1,padding:"15px",borderRadius:15,background:clock.running?C.redDim:C.s2,border:`1px solid ${clock.running?C.red:C.div}`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <span style={{fontSize:13}}>{clock.running?"⏸":"▶"}</span>
                        <span style={{fontSize:17,fontWeight:700,color:clock.running?C.red:C.ink2}}>{clock.sec>0||clock.running?fmtDur(clock.sec):"Chrono"}</span>
                      </Tap>
                      <Tap onTap={()=>{clock.stop();setShowFeedback(true);}} style={{flex:2,padding:"15px",borderRadius:15,background:C.blue,border:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:17,fontWeight:600,color:"#000"}}>Fin de séance</span>
                      </Tap>
                      <Tap onTap={()=>setShowSettings(true)} style={{padding:"15px 16px",borderRadius:15,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:13,fontWeight:600,color:C.ink3}}>Réglages</span>
                      </Tap>
                    </div>
                  )}
                  <div style={{paddingLeft:16,borderLeft:`2px solid ${C.s3}`,marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Échauffement · 8 min</div>
                    <div style={{fontSize:14,color:C.ink3,lineHeight:1.75}}>{day.salle==="haut"?"Rotations épaules · Wall slide · Push-up to downdog · Mobilité thoracique":"Corde 3min · Hip circle · Leg swing · KB Swing léger ×10"}</div>
                  </div>
                  {day.salle&&<div style={{marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:sessionMode==="classique"?0:10}}><span style={{fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>Séance du jour</span><span style={{fontSize:11,fontWeight:800,color:"#000",background:C.blue,padding:"2px 9px",borderRadius:7,textTransform:"uppercase",letterSpacing:".06em"}}>{sessionMode==="amrap"?"AMRAP":sessionMode==="emom"?"EMOM":"Classique"}</span></div>
                    {sessionMode!=="classique"&&!isDayDone&&<Tap onTap={()=>setShowCircuit(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px",borderRadius:12,background:C.blueDim,border:`1px solid ${C.blue}`}}><span style={{fontSize:15}}>⏱</span><span style={{fontSize:15,fontWeight:700,color:C.blue}}>Démarrer le circuit {sessionMode==="amrap"?"AMRAP":"EMOM"}</span></Tap>}
                  </div>}
                  <div>
                    {day.metcon&&!isDayDone&&<div style={{marginBottom:16}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:13,fontWeight:700,color:C.ink}}>Séance {sessionMode==="amrap"?"AMRAP":"EMOM"} · {day.blocks.length} blocs</span><span style={{fontSize:13,fontWeight:700,color:"#000",background:C.blue,padding:"2px 10px",borderRadius:8}}>~{day.totalMin} min</span></div><div style={{fontSize:12,color:C.ink4,marginBottom:10}}>Touchez un bloc pour le démarrer</div>{day.blocks.map((bl,bi)=>(<Tap key={bi} onTap={()=>{if(isDayDone)return;setCircuitStart(bi);setShowCircuit(true);}} style={{marginBottom:12,background:C.s1,borderRadius:14,padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:14,fontWeight:800,color:C.ink}}>{bl.label}</span><span style={{fontSize:12,fontWeight:600,color:C.ink3}}>{bl.kind==="emom"?bl.durationMin+" min · "+bl.rounds+" tours":bl.durationMin+" min"}</span></div>{bl.exercises.map((ex,ei)=>(<div key={ei} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderTop:ei?`1px solid ${C.s2}`:"none"}}><span style={{fontSize:14,color:C.ink2}}>{bl.kind==="emom"?("Min "+(ei+1)+" · "):""}{ex.n}</span><span style={{fontSize:13,fontWeight:600,color:C.ink3}}>{ex.kg>0?ex.kg+"kg · ":""}{ex.reps}{bl.kind==="emom"?"/min":"/tour"}</span></div>))}</Tap>))}</div>}
                    {!day.metcon&&groupBlocks(exos).map((blk,bi)=>(
                      <div key={bi} style={{marginBottom:16}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingLeft:2}}>
                          <span style={{fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>{blk.muscle}</span>
                          <span style={{fontSize:11,fontWeight:600,color:C.ink4}}>{blk.items.length} exo{blk.items.length>1?"s":""}</span>{blk.groupType&&<span style={{fontSize:10,fontWeight:700,color:"#000",background:C.blue,padding:"1px 7px",borderRadius:6,textTransform:"uppercase",letterSpacing:".08em"}}>{blk.groupType==="circuit"?"Circuit":"Superset"}</span>}
                        </div>
                        {blk.groupType&&!isDayDone&&<Tap onTap={()=>setSupBlock({label:blk.muscle,kind:blk.groupType==="circuit"?"circuit":"superset",exercises:blk.items.map(x=>x.ex),restSec:90,tours:(blk.items[0]&&blk.items[0].ex&&blk.items[0].ex.sets)||4})} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:12,background:C.blueDim,border:`1px solid ${C.blue}`,marginBottom:10}}><span style={{fontSize:14,fontWeight:700,color:C.blue}}>Démarrer le {blk.groupType==="circuit"?"circuit":"superset"}</span></Tap>}
                        <div style={{paddingLeft:12,borderLeft:`2px solid ${C.s3}`}}>
                          {blk.items.map(({ex,idx})=>(
                            <ExerciseRowCollapsed key={ex.id} ex={ex} idx={idx} dayIdx={dayIdx} log={log}
                              onOpen={()=>{if(isDayDone)return;sessionMode==="classique"?setFocusIdx(idx):setShowCircuit(true);}} onReplace={e=>setShowPicker(e)}/>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {focusIdx!=null&&exos[focusIdx]&&(
                    <ExerciseFocus key={exos[focusIdx].id} ex={exos[focusIdx]} idx={focusIdx} count={exos.length} dayIdx={dayIdx}
                      log={log} onLogSet={saveLog} onDetail={e=>setDetailEx(e)}
                      onClose={()=>setFocusIdx(null)} hasNext={focusIdx<exos.length-1} onNext={()=>setFocusIdx(focusIdx+1)}/>
                  )}
                  {supBlock&&<CircuitPlayer mode={supBlock.kind} exos={supBlock.exercises} blocks={[supBlock]} onClose={()=>setSupBlock(null)} onAllDone={()=>{}}/>}
                  {showCircuit&&sessionMode!=="classique"&&exos.length>0&&(
                    <CircuitPlayer mode={sessionMode} exos={exos} blocks={day.blocks} defMin={sessionMode==="amrap"?(day.timeCapMin||12):(day.emomMinutes||Math.max(exos.length,8))} onClose={()=>setShowCircuit(false)} onAllDone={()=>{}} startBlock={circuitStart}/>
                  )}
                  {absExos.length>0&&(
                    <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${C.s3}`}}>
                      <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Abdominaux</div>
                      {absExos.map(a=>(
                        <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${C.s3}`}}>
                          <span style={{fontSize:17,fontWeight:400,color:C.ink}}>{a.n||a.name}</span>
                          <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>{a.vol}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!sessionActive&&!isDayDone&&(
                    <Tap onTap={()=>setShowFeedback(true)} style={{marginTop:28,marginBottom:16,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:17,fontWeight:600,color:"#000"}}>Fin de séance</span>
                    </Tap>
                  )}
                </>
              )}
            </div>
          )}
          {tab==="stats"&&<><StatsTab sessions={sessions} weights={weights} accent={accent}/><HistoryTab sessions={sessions} onSelect={setShowReport} accent={accent}/></>}
          {tab==="settings"&&<SettingsTab user={user} excluded={excluded} onToggleExclude={toggleExclude} onOpenLibrary={()=>setShowLibrary(true)} profile={profile} schedule={schedule} onUpdateConfig={updateConfig}
            onSignOut={async()=>{await supabase.auth.signOut();setUser(null);setLog({});setWeights({});setSessions([]);setExcluded([]);setStreak(0);}}
            onReset={async()=>{
              const uid=user?.id;
              const key=`soma_${uid||"anon"}`;
              localStorage.removeItem(key);
              setLog({});setWeights({});setSessions([]);setExcluded([]);setStreak(0);
              loadingRef.current=null;
              if(uid){
                try{
                  await Promise.all([
                    supabase.from("sessions").delete().eq("user_id",uid),
                    supabase.from("personal_bests").delete().eq("user_id",uid),
                    supabase.from("streaks").delete().eq("user_id",uid),
                  ]);
                }catch(e){console.error("reset SB",e);}
              }
            }}
          />}
        </TabContent>
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:Z.sticky+10,background:"rgba(255,255,255,.96)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`1px solid ${C.s3}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {NAV.map(({id,l})=>{
          const on=tab===id;
          const ic=NAV_ICONS[id]||NAV_ICONS.seance;
          return (
          <Tap key={id} onTap={()=>switchTab(id)} style={{flex:1,padding:"9px 4px calc(8px + env(safe-area-inset-bottom))",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={on?accent:C.ink4} strokeWidth={on?2.4:2} strokeLinecap="round" strokeLinejoin="round" style={{transition:`stroke 200ms ${EO}`}}>{ic}</svg>
            <span style={{fontSize:11.5,fontWeight:on?700:500,color:on?C.ink:C.ink4,transition:`color 200ms ${EO}`}}>{l}</span>
          </Tap>);
        })}
      </div>

      {/* OVERLAYS — z-index ordering per semantic scale */}
      {showRestFull&&<RestFullScreen timer={rest} label={restLabel} onSkip={()=>{rest.stop();setShowRestFull(false);}} onClose={()=>{rest.reset();setShowRestFull(false);}}/>}
      {!showRestFull&&rest.sec>0&&<MiniRest timer={rest} label={restLabel} onExpand={()=>setShowRestFull(true)}/>}
      {detailEx&&<ExerciseSheet ex={detailEx} fav={favorites.includes(detailEx.id)} onToggleFav={toggleFav} onClose={()=>setDetailEx(null)} sessions={sessions}/>}
      {showFeedback&&<FeedbackSheet onClose={()=>setShowFeedback(false)} onSave={handleFeedbackSave}/>}
      {showSettings&&<SessionSettingsSheet day={day} curMode={effMode} onClose={()=>setShowSettings(false)} onApply={({mode,cons})=>{setModeOverride(mode);setDayCons(cons);setShowSettings(false);}}/>}
      {showAI&&<AISheet onClose={()=>setShowAI(false)} onResult={o=>{setAiOverride(o);setShowAI(false);}} excluded={excluded}/>}
      {showPhotos&&<PhotoProgress onClose={()=>setShowPhotos(false)}/>}
      {showTimer&&<IntervalTimer onClose={()=>setShowTimer(false)}/>}
      {showPicker&&<ExPicker onSelect={newEx=>handleReplaceEx(showPicker,newEx)} onClose={()=>setShowPicker(null)} currentId={showPicker.id} excluded={excluded}/>}
      {showLibrary&&<LibraryTab favorites={favorites} onToggleFav={toggleFav} onClose={()=>setShowLibrary(false)} sessions={sessions}/>}
      {showReport&&<SessionReport session={showReport} onClose={()=>setShowReport(null)} onDelete={deleteSession}/>}
      {showSched&&<ScheduleEditor schedule={schedule}
        onChange={ns=>{setSchedule(ns);persist(user?.id,{schedule:ns});}}
        onReset={()=>{setSchedule(PROGRAM);persist(user?.id,{schedule:PROGRAM});}}
        autoRotate={autoRotate}
        onToggleAuto={()=>setAutoRotate(v=>{const nv=!v;persist(user?.id,{autoRotate:nv});return nv;})}
        onClose={()=>setShowSched(false)}/>}
    </div>
  );
}
