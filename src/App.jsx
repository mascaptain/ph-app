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

  // NOUVEAUX EXERCICES (S4) - tagges par objectif
  {id:"kb26",n:"Halo KB",m:"Épaules · Core",eq:"kb",kg:10,reps:"10",rest:60,rpe:6,cue:"Cercle du KB autour de la tête, coudes proches.",goals:["seche","endurance","performance"]},
  {id:"kb27",n:"Figure 8 to Hold KB",m:"Core · Full body",eq:"kb",kg:12,reps:"10",rest:60,rpe:7,cue:"Passe le KB entre les jambes en huit puis tient en rack.",goals:["seche","endurance"]},
  {id:"kb28",n:"Renegade Row KB",m:"Dos · Core",eq:"kb",kg:14,reps:"8",rest:75,rpe:7,cue:"Position planche, tire le KB sans faire pivoter le bassin.",goals:["seche","hypertrophie","endurance"]},
  {id:"kb29",n:"Single Arm Overhead Carry KB",m:"Core · Épaules",eq:"kb",kg:16,reps:"20m",rest:90,rpe:7,cue:"Bras verrouillé au-dessus, marche stable.",goals:["seche","performance","endurance"]},
  {id:"kb30",n:"Double KB Front Squat",m:"Quads · Fessiers",eq:"kb",kg:16,reps:"10",rest:90,rpe:7,cue:"Deux KB en rack, torse droit, descend profond.",goals:["seche","hypertrophie","performance"]},
  {id:"kb31",n:"KB Thruster",m:"Full body",eq:"kb",kg:14,reps:"8",rest:90,rpe:8,cue:"Squat puis press explosif en un mouvement.",goals:["seche","endurance","performance"]},
  {id:"kb32",n:"Single Leg RDL KB",m:"Ischios · Fessiers",eq:"kb",kg:14,reps:"8",rest:75,rpe:7,cue:"Jambe tendue arrière, bascule du bassin, dos plat.",goals:["seche","hypertrophie","performance"]},
  {id:"kb33",n:"KB Around the Body Pass",m:"Core",eq:"kb",kg:10,reps:"12",rest:60,rpe:6,cue:"Passe le KB autour de la taille, garde le tronc gainé.",goals:["seche","endurance"]},
  {id:"kb34",n:"KB Man Maker",m:"Full body",eq:"kb",kg:12,reps:"6",rest:120,rpe:8,cue:"Pompe + row + clean + press, enchâine sans reposer.",goals:["seche","endurance","performance"]},
  {id:"kb35",n:"KB Sumo Deadlift High Pull",m:"Fessiers · Épaules",eq:"kb",kg:16,reps:"10",rest:75,rpe:7,cue:"Squat sumo puis tire le KB haut sous le menton.",goals:["seche","endurance"]},
  {id:"kb36",n:"Bottoms-Up Clean KB",m:"Avant-bras · Full body",eq:"kb",kg:8,reps:"6",rest:90,rpe:8,cue:"KB tenu tête en bas, exige un grip et gainage strict.",goals:["performance","endurance"]},
  {id:"kb37",n:"KB Push-up Row",m:"Dos · Pecs",eq:"kb",kg:14,reps:"8",rest:75,rpe:7,cue:"Pompe sur KB puis row unilatéral, alterne les côtés.",goals:["seche","hypertrophie"]},
  {id:"kb38",n:"KB Lateral Lunge",m:"Fessiers · Adducteurs",eq:"kb",kg:14,reps:"10",rest:60,rpe:7,cue:"Fente latérale, KB en goblet, genou aligné.",goals:["seche","endurance","performance"]},
  {id:"kb39",n:"KB Overhead Squat",m:"Full body",eq:"kb",kg:10,reps:"6",rest:90,rpe:8,cue:"KB verrouillé au-dessus, squat profond et contrôlé.",goals:["performance","seche"]},
  {id:"kb40",n:"Double KB Clean & Jerk",m:"Full body",eq:"kb",kg:14,reps:"5",rest:120,rpe:8,cue:"Deux KB, clean puis jerk explosif.",goals:["performance","endurance"]},
  {id:"kb41",n:"KB Bear Crawl Drag",m:"Full body · Core",eq:"kb",kg:10,reps:"20m",rest:75,rpe:7,cue:"Rampé en traînant le KB à côté, hanches basses.",goals:["seche","endurance"]},
  {id:"kb42",n:"KB Reverse Lunge to Press",m:"Full body",eq:"kb",kg:12,reps:"8",rest:90,rpe:7,cue:"Fente arrière puis press vertical au sommet.",goals:["performance","seche"]},
  {id:"kb43",n:"KB Windmill lourd",m:"Obliques · Épaules",eq:"kb",kg:10,reps:"6",rest:90,rpe:7,cue:"Bras verrouillé, hanche recule, regard sur le KB.",goals:["performance","endurance"]},
  {id:"kb44",n:"KB Single Arm Swing",m:"Fessiers · Core",eq:"kb",kg:16,reps:"12",rest:60,rpe:7,cue:"Swing unilatéral, résiste à la rotation du buste.",goals:["seche","endurance"]},
  {id:"kb45",n:"KB Goblet Reverse Lunge",m:"Quads · Fessiers",eq:"kb",kg:16,reps:"10",rest:75,rpe:7,cue:"KB en goblet, fente arrière contrôlée.",goals:["hypertrophie","seche","endurance"]},
  {id:"kb46",n:"KB Alternating Floor Press",m:"Pecs · Triceps",eq:"kb",kg:14,reps:"8",rest:75,rpe:7,cue:"Allé au sol, presse en alternant les bras.",goals:["hypertrophie","seche"]},
  {id:"kb47",n:"KB Suitcase Carry",m:"Core · Avant-bras",eq:"kb",kg:20,reps:"20m",rest:90,rpe:7,cue:"Un seul KB au sol, marche sans se pencher.",goals:["performance","seche","endurance"]},
  {id:"kb48",n:"KB High Pull unilatéral",m:"Épaules · Dos",eq:"kb",kg:12,reps:"10",rest:75,rpe:7,cue:"Coude haut, KB proche du corps.",goals:["seche","endurance"]},
  {id:"kb49",n:"KB Clean Pull",m:"Full body",eq:"kb",kg:16,reps:"6",rest:90,rpe:7,cue:"Tire le KB explosivement sans le recevoir en rack.",goals:["performance","seche"]},
  {id:"kb50",n:"KB Cossack Squat",m:"Adducteurs · Quads",eq:"kb",kg:10,reps:"8",rest:75,rpe:7,cue:"KB en goblet, descend d'un côté en gardant l'autre jambe tendue.",goals:["hypertrophie","seche","performance"]},
  {id:"bb19",n:"Squat Pause",m:"Quads · Fessiers",eq:"bar",kg:70,reps:"5",rest:180,rpe:8,cue:"Pause 2s au fond, remonte explosif.",goals:["force","performance"]},
  {id:"bb20",n:"Bench Press Tempo",m:"Pecs · Triceps",eq:"bar",kg:55,reps:"6",rest:150,rpe:8,cue:"Descente 3s, pause 1s, pousse rapide.",goals:["force","hypertrophie"]},
  {id:"bb21",n:"Sumo Deadlift",m:"Fessiers · Ischios",eq:"bar",kg:90,reps:"5",rest:180,rpe:8,cue:"Pieds larges, prise étroite, pousse le sol.",goals:["force","performance"]},
  {id:"bb22",n:"Overhead Squat",m:"Full body",eq:"bar",kg:30,reps:"5",rest:150,rpe:8,cue:"Barre verrouillée au-dessus, mobilité requise.",goals:["performance","force"]},
  {id:"bb23",n:"Push Jerk",m:"Full body",eq:"bar",kg:40,reps:"3",rest:180,rpe:9,cue:"Dip léger puis pousse explosive sous la barre.",goals:["performance"]},
  {id:"bb24",n:"Hip Thrust Barre",m:"Fessiers",eq:"bar",kg:60,reps:"8",rest:120,rpe:7,cue:"Dos sur banc, pousse les hanches, contracte en haut.",goals:["hypertrophie","force"]},
  {id:"bb25",n:"Barbell Row Pendlay",m:"Dos",eq:"bar",kg:60,reps:"6",rest:120,rpe:8,cue:"Barre au sol à chaque rep, tire explosif.",goals:["force","hypertrophie"]},
  {id:"bb26",n:"Close Grip Bench Press",m:"Triceps · Pecs",eq:"bar",kg:50,reps:"6",rest:120,rpe:7,cue:"Prise étroite, coudes proches du corps.",goals:["hypertrophie","force"]},
  {id:"bb27",n:"Front Squat",m:"Quads · Core",eq:"bar",kg:50,reps:"5",rest:150,rpe:8,cue:"Barre en rack avant, torse vertical.",goals:["force","performance"]},
  {id:"bb28",n:"Barbell Hip Thrust Lourd",m:"Fessiers",eq:"bar",kg:80,reps:"5",rest:150,rpe:8,cue:"Charge lourde, verrouillage complet en haut.",goals:["force","hypertrophie"]},
  {id:"bb29",n:"Incline Bench Press",m:"Pecs sup",eq:"bar",kg:45,reps:"8",rest:120,rpe:7,cue:"Banc incliné 30°, contrôle la descente.",goals:["hypertrophie","force"]},
  {id:"bb30",n:"Barbell Lunge",m:"Quads · Fessiers",eq:"bar",kg:40,reps:"8",rest:90,rpe:7,cue:"Barre sur les trapèzes, fentes alternées.",goals:["hypertrophie","performance"]},
  {id:"bb31",n:"Snatch Grip Deadlift",m:"Dos · Ischios",eq:"bar",kg:60,reps:"5",rest:150,rpe:8,cue:"Prise large, tire depuis le sol, dos plat.",goals:["force","performance"]},
  {id:"bb32",n:"Barbell Shrug",m:"Trapèzes",eq:"bar",kg:70,reps:"10",rest:90,rpe:7,cue:"Hausse les épaules, contracte 1s en haut.",goals:["hypertrophie"]},
  {id:"bb33",n:"Good Morning Léger",m:"Ischios · Lombaires",eq:"bar",kg:30,reps:"10",rest:90,rpe:6,cue:"Bascule le buste hanches reculées, dos plat.",goals:["hypertrophie","force"]},
  {id:"bb34",n:"Power Clean",m:"Full body",eq:"bar",kg:50,reps:"3",rest:180,rpe:9,cue:"Tire puis reçoit en rack, explosif.",goals:["performance","force"]},
  {id:"bb35",n:"Barbell Step-Up",m:"Quads · Fessiers",eq:"bar",kg:30,reps:"8",rest:90,rpe:7,cue:"Barre sur les trapèzes, monte sur banc.",goals:["hypertrophie","performance"]},
  {id:"bb36",n:"Floor Press Barre",m:"Triceps · Pecs",eq:"bar",kg:50,reps:"6",rest:120,rpe:7,cue:"Coudes touchent le sol, presse depuis le bas.",goals:["force","hypertrophie"]},
  {id:"bb37",n:"Barbell Curl",m:"Biceps",eq:"bar",kg:25,reps:"10",rest:75,rpe:6,cue:"Coudes fixes, monte sans balancer.",goals:["hypertrophie"]},
  {id:"bb38",n:"Seal Row",m:"Dos",eq:"bar",kg:50,reps:"8",rest:90,rpe:7,cue:"Allongé sur banc, tire sans triche.",goals:["hypertrophie","force"]},
  {id:"bb39",n:"Box Squat Lourd",m:"Fessiers · Quads",eq:"bar",kg:80,reps:"5",rest:180,rpe:8,cue:"S'assoit sur box, repart explosif sans rebondir.",goals:["force"]},
  {id:"bb40",n:"Barbell Rollout",m:"Core",eq:"bar",kg:20,reps:"8",rest:90,rpe:7,cue:"Genoux au sol, roule la barre en gainant fort.",goals:["hypertrophie","performance"]},
  {id:"bb41",n:"Push Press Lourd",m:"Épaules · Jambes",eq:"bar",kg:50,reps:"5",rest:150,rpe:8,cue:"Légère impulsion jambes puis verrouille au-dessus.",goals:["performance","force"]},
  {id:"bb42",n:"Deadlift Déficit",m:"Ischios · Dos",eq:"bar",kg:70,reps:"5",rest:180,rpe:8,cue:"Pieds sur plateforme, amplitude augmentée.",goals:["force"]},
  {id:"bb43",n:"Barbell Landmine Press",m:"Épaules",eq:"bar",kg:25,reps:"10",rest:90,rpe:7,cue:"Barre en landmine, presse en diagonale.",goals:["hypertrophie","performance"]},
  {id:"db21",n:"Arnold Press",m:"Épaules",eq:"db",kg:14,reps:"10",rest:90,rpe:7,cue:"Rotation des paumes en montant.",goals:["hypertrophie"]},
  {id:"db22",n:"Renegade Row Haltères",m:"Dos · Core",eq:"db",kg:12,reps:"8",rest:90,rpe:7,cue:"Position planche, tire sans tourner le bassin.",goals:["hypertrophie","seche"]},
  {id:"db23",n:"Single Arm Snatch DB",m:"Full body",eq:"db",kg:14,reps:"6",rest:90,rpe:8,cue:"Tire puis verrouille au-dessus en un mouvement.",goals:["performance","endurance"]},
  {id:"db24",n:"Goblet Lunge Haltère",m:"Quads · Fessiers",eq:"db",kg:16,reps:"10",rest:75,rpe:7,cue:"Haltère en goblet, fente contrôlée.",goals:["hypertrophie","seche"]},
  {id:"db25",n:"Skull Crusher Haltères",m:"Triceps",eq:"db",kg:10,reps:"12",rest:75,rpe:6,cue:"Coudes fixes, descend derrière la tête.",goals:["hypertrophie"]},
  {id:"db26",n:"Concentration Curl",m:"Biceps",eq:"db",kg:10,reps:"12",rest:60,rpe:6,cue:"Coude appuyé sur la cuisse, isole le biceps.",goals:["hypertrophie"]},
  {id:"db27",n:"DB Bench Press Prise Neutre",m:"Pecs",eq:"db",kg:22,reps:"10",rest:90,rpe:7,cue:"Paumes face à face, amplitude complète.",goals:["hypertrophie"]},
  {id:"db28",n:"Single Arm Overhead Press DB",m:"Épaules · Core",eq:"db",kg:14,reps:"8",rest:90,rpe:7,cue:"Anti-rotation du tronc pendant la press.",goals:["hypertrophie","performance"]},
  {id:"db29",n:"DB Romanian Deadlift Unilatéral",m:"Ischios · Fessiers",eq:"db",kg:16,reps:"8",rest:75,rpe:7,cue:"Un haltère, jambe libre en équilibre.",goals:["hypertrophie","force"]},
  {id:"db30",n:"DB Pullover",m:"Dos · Pecs",eq:"db",kg:18,reps:"10",rest:90,rpe:7,cue:"Allongé sur banc, descend l'haltère derrière la tête.",goals:["hypertrophie"]},
  {id:"db31",n:"DB Thruster",m:"Full body",eq:"db",kg:14,reps:"10",rest:90,rpe:7,cue:"Squat puis press, enchâine sans pause.",goals:["seche","endurance"]},
  {id:"db32",n:"DB Step-Up",m:"Quads · Fessiers",eq:"db",kg:16,reps:"10",rest:75,rpe:7,cue:"Monte sur banc, contrôle la descente.",goals:["hypertrophie","seche"]},
  {id:"db33",n:"DB Farmer Carry",m:"Core · Avant-bras",eq:"db",kg:24,reps:"20m",rest:90,rpe:7,cue:"Deux haltères, marche droite et stable.",goals:["performance","seche"]},
  {id:"db34",n:"DB Hammer Curl",m:"Biceps · Avant-bras",eq:"db",kg:12,reps:"12",rest:60,rpe:6,cue:"Prise neutre, coudes fixes.",goals:["hypertrophie"]},
  {id:"db35",n:"DB Lateral Raise Lourd",m:"Épaules",eq:"db",kg:8,reps:"12",rest:60,rpe:6,cue:"Légère flexion du coude, monte à hauteur d'épaule.",goals:["hypertrophie"]},
  {id:"db36",n:"DB Squat Jump",m:"Quads · Fessiers",eq:"db",kg:10,reps:"10",rest:75,rpe:7,cue:"Squat puis saut explosif, atterrit souple.",goals:["seche","endurance","performance"]},
  {id:"db37",n:"DB Chest Fly Incliné",m:"Pecs sup",eq:"db",kg:12,reps:"12",rest:75,rpe:6,cue:"Légère flexion des coudes, étire les pecs.",goals:["hypertrophie"]},
  {id:"db38",n:"DB Single Leg RDL",m:"Ischios · Fessiers",eq:"db",kg:14,reps:"8",rest:75,rpe:7,cue:"Équilibre sur une jambe, dos plat.",goals:["hypertrophie","performance"]},
  {id:"db39",n:"DB Zottman Curl",m:"Biceps · Avant-bras",eq:"db",kg:10,reps:"10",rest:60,rpe:6,cue:"Monte paume en haut, descend paume en bas.",goals:["hypertrophie"]},
  {id:"db40",n:"DB Clean & Press",m:"Full body",eq:"db",kg:14,reps:"8",rest:90,rpe:7,cue:"Clean puis press, un mouvement fluide.",goals:["performance","seche"]},
  {id:"db41",n:"DB Bulgarian Split Squat",m:"Quads · Fessiers",eq:"db",kg:16,reps:"8",rest:90,rpe:7,cue:"Pied arrière surélevé, descend droit.",goals:["hypertrophie","force"]},
  {id:"db42",n:"DB Reverse Fly",m:"Deltoïdes lat.",eq:"db",kg:8,reps:"12",rest:60,rpe:6,cue:"Buste penché, écarte les bras en arrière.",goals:["hypertrophie"]},
  {id:"db43",n:"DB Front Raise",m:"Épaules ant",eq:"db",kg:8,reps:"12",rest:60,rpe:6,cue:"Monte tendu jusqu'à hauteur d'épaule.",goals:["hypertrophie"]},
  {id:"db44",n:"DB Man Maker",m:"Full body",eq:"db",kg:12,reps:"6",rest:120,rpe:8,cue:"Pompe + row + clean + press, enchâîne.",goals:["seche","endurance","performance"]},
  {id:"db45",n:"DB Incline Curl",m:"Biceps",eq:"db",kg:10,reps:"12",rest:60,rpe:6,cue:"Banc incliné, étirement maximal du biceps.",goals:["hypertrophie"]},
  {id:"bw16",n:"Pistol Squat",m:"Quads · Fessiers",eq:"bw",kg:0,reps:"5",rest:90,rpe:8,cue:"Jambe tendue devant, descend contrôlé.",goals:["hypertrophie","seche","performance"]},
  {id:"bw17",n:"Nordic Curl",m:"Ischios",eq:"bw",kg:0,reps:"5",rest:90,rpe:8,cue:"Genoux bloqués, descend le plus lentement possible.",goals:["force","hypertrophie","performance"]},
  {id:"bw18",n:"Handstand Push-up Progression",m:"Épaules",eq:"bw",kg:0,reps:"5",rest:120,rpe:8,cue:"Pieds contre un mur, descend la tête vers le sol.",goals:["hypertrophie","performance"]},
  {id:"bw19",n:"Broad Jump",m:"Full body",eq:"bw",kg:0,reps:"5",rest:90,rpe:7,cue:"Saut horizontal max, atterrit souple.",goals:["performance","seche"]},
  {id:"bw20",n:"Bear Crawl",m:"Full body · Core",eq:"bw",kg:0,reps:"20m",rest:60,rpe:6,cue:"Genoux proches du sol sans toucher.",goals:["seche","endurance"]},
  {id:"bw21",n:"Muscle-up",m:"Dos · Pecs",eq:"bw",kg:0,reps:"3",rest:120,rpe:9,cue:"Traction puis passage au-dessus de la barre.",goals:["performance","hypertrophie"]},
  {id:"bw22",n:"Front Lever Progression",m:"Dos · Core",eq:"bw",kg:0,reps:"15s",rest:90,rpe:8,cue:"Corps horizontal suspendu, gaine fort.",goals:["performance","force"]},
  {id:"bw23",n:"Hollow Rock",m:"Core",eq:"bw",kg:0,reps:"20",rest:60,rpe:6,cue:"Corps en banane, balance sans casser la position.",goals:["seche","endurance"]},
  {id:"bw24",n:"Pike Push-up",m:"Épaules",eq:"bw",kg:0,reps:"10",rest:75,rpe:7,cue:"Hanches hautes, descend la tête vers les mains.",goals:["hypertrophie"]},
  {id:"bw25",n:"Sissy Squat",m:"Quads",eq:"bw",kg:0,reps:"10",rest:75,rpe:7,cue:"Genoux vers l'avant, buste et tibias alignés.",goals:["hypertrophie","seche"]},
  {id:"bw26",n:"Copenhagen Plank",m:"Adducteurs · Core",eq:"bw",kg:0,reps:"20s",rest:60,rpe:7,cue:"Jambe sur un banc, corps gainé latéralement.",goals:["performance","seche"]},
  {id:"bw27",n:"Broad Jump Latéral",m:"Fessiers · Adducteurs",eq:"bw",kg:0,reps:"6",rest:75,rpe:7,cue:"Saut latéral, réception stable.",goals:["performance","seche","endurance"]},
  {id:"bw28",n:"Wall Walk",m:"Épaules · Core",eq:"bw",kg:0,reps:"4",rest:120,rpe:8,cue:"Pieds contre le mur, marche vers une posture verticale.",goals:["performance"]},
  {id:"bw29",n:"Shrimp Squat",m:"Quads · Fessiers",eq:"bw",kg:0,reps:"6",rest:90,rpe:8,cue:"Genou arrière proche du sol, jambe avant travaille.",goals:["hypertrophie","seche","performance"]},
  {id:"bw30",n:"Superman Hold",m:"Lombaires · Fessiers",eq:"bw",kg:0,reps:"20s",rest:60,rpe:6,cue:"Bras et jambes levés, gaine le bas du dos.",goals:["seche","hypertrophie"]},
  {id:"bw31",n:"Archer Pull-up",m:"Dos · Biceps",eq:"bw",kg:0,reps:"5",rest:120,rpe:8,cue:"Traction en déportant le poids sur un bras.",goals:["performance","hypertrophie"]},
  {id:"bw32",n:"Plank to Push-up",m:"Core · Triceps",eq:"bw",kg:0,reps:"10",rest:75,rpe:7,cue:"Passe d'avant-bras à mains sans bouger le bassin.",goals:["seche","endurance"]},
  {id:"bw33",n:"Jump Lunge",m:"Quads · Fessiers",eq:"bw",kg:0,reps:"10",rest:75,rpe:7,cue:"Fente sautée, alterne les jambes en l'air.",goals:["seche","endurance","performance"]},
  {id:"bw34",n:"Dragon Squat",m:"Quads · Core",eq:"bw",kg:0,reps:"5",rest:90,rpe:8,cue:"Rotation profonde en squat sur une jambe.",goals:["performance","hypertrophie"]},
  {id:"bw35",n:"L-Sit Progression",m:"Core · Hanches",eq:"bw",kg:0,reps:"15s",rest:75,rpe:7,cue:"Jambes tendues devant, appui sur les mains.",goals:["performance","seche"]},
  {id:"mc13",n:"Leg Press",m:"Quads · Fessiers",eq:"mc",kg:100,reps:"10",rest:120,rpe:7,cue:"Pieds à largeur d'épaules, ne verrouille pas les genoux.",goals:["hypertrophie","force"]},
  {id:"mc14",n:"Hack Squat",m:"Quads",eq:"mc",kg:80,reps:"10",rest:120,rpe:7,cue:"Dos plaqué, descend contrôlé.",goals:["hypertrophie","force"]},
  {id:"mc15",n:"Leg Curl Allongé",m:"Ischios",eq:"mc",kg:35,reps:"12",rest:90,rpe:6,cue:"Contracte en haut, descend lentement.",goals:["hypertrophie"]},
  {id:"mc16",n:"Leg Extension",m:"Quads",eq:"mc",kg:35,reps:"12",rest:90,rpe:6,cue:"Extension complète, contrôle la descente.",goals:["hypertrophie"]},
  {id:"mc17",n:"Lat Pulldown Prise Serrée",m:"Dos",eq:"mc",kg:45,reps:"10",rest:90,rpe:7,cue:"Tire vers la poitrine, coudes proches du corps.",goals:["hypertrophie"]},
  {id:"mc18",n:"Cable Crossover",m:"Pecs",eq:"mc",kg:15,reps:"12",rest:75,rpe:6,cue:"Croise les câbles devant, contracte les pecs.",goals:["hypertrophie"]},
  {id:"mc19",n:"Seated Row Prise Large",m:"Dos",eq:"mc",kg:45,reps:"10",rest:90,rpe:7,cue:"Tire large, écarte les coudes.",goals:["hypertrophie"]},
  {id:"mc20",n:"Chest Press Machine",m:"Pecs",eq:"mc",kg:40,reps:"10",rest:90,rpe:7,cue:"Presse devant, contrôle le retour.",goals:["hypertrophie"]},
  {id:"mc21",n:"Hip Abduction Machine",m:"Fessiers moyens",eq:"mc",kg:30,reps:"15",rest:60,rpe:6,cue:"Écarte les genoux contre la résistance.",goals:["hypertrophie"]},
  {id:"mc22",n:"Hip Thrust Machine",m:"Fessiers",eq:"mc",kg:50,reps:"10",rest:90,rpe:7,cue:"Pousse avec les talons, contracte en haut.",goals:["hypertrophie","force"]},
  {id:"mc23",n:"Preacher Curl Machine",m:"Biceps",eq:"mc",kg:20,reps:"12",rest:75,rpe:6,cue:"Coudes fixes sur le pupitre.",goals:["hypertrophie"]},
  {id:"mc24",n:"Triceps Dip Machine",m:"Triceps",eq:"mc",kg:30,reps:"12",rest:75,rpe:6,cue:"Descend contrôlé, verrouille en haut.",goals:["hypertrophie"]},
  {id:"mc25",n:"Smith Machine Squat",m:"Quads · Fessiers",eq:"mc",kg:60,reps:"10",rest:120,rpe:7,cue:"Barre guidée, pieds légèrement avancés.",goals:["hypertrophie","force"]},
  {id:"mc26",n:"Reverse Pec Deck",m:"Deltoïdes lat.",eq:"mc",kg:25,reps:"12",rest:75,rpe:6,cue:"Écarte les bras en arrière, contracte les déltoïdes.",goals:["hypertrophie"]},
  {id:"mc27",n:"Calf Press Leg Press",m:"Mollets",eq:"mc",kg:80,reps:"15",rest:60,rpe:6,cue:"Pousse sur la pointe des pieds, amplitude complète.",goals:["hypertrophie"]},
  {id:"cd09",n:"Assault Bike Sprint",m:"Cardio",eq:"cd",kg:0,reps:"30s",rest:60,rpe:8,cue:"Effort maximal 30s, jambes et bras ensemble.",goals:["endurance","seche"]},
  {id:"cd10",n:"Sled Push",m:"Cardio · Jambes",eq:"cd",kg:40,reps:"20m",rest:90,rpe:8,cue:"Pousse fort, pas courts et puissants.",goals:["endurance","seche","performance"]},
  {id:"cd11",n:"Sled Pull",m:"Cardio · Dos",eq:"cd",kg:30,reps:"20m",rest:90,rpe:7,cue:"Tire en marchant en arrière, dos droit.",goals:["endurance","seche"]},
  {id:"cd12",n:"Battle Ropes",m:"Cardio · Épaules",eq:"cd",kg:0,reps:"30s",rest:45,rpe:7,cue:"Vagues alternées, garde le buste gainé.",goals:["endurance","seche"]},
  {id:"cd13",n:"Box Step-Up Cardio",m:"Cardio · Jambes",eq:"cd",kg:0,reps:"15",rest:45,rpe:6,cue:"Rythme soutenu, alterne les jambes.",goals:["endurance","seche"]},
  {id:"cd14",n:"Ski Erg",m:"Cardio · Dos",eq:"cd",kg:0,reps:"500m",rest:90,rpe:7,cue:"Tire avec tout le corps, rythme constant.",goals:["endurance","seche"]},
  {id:"cd15",n:"Shuttle Run",m:"Cardio",eq:"cd",kg:0,reps:"6x20m",rest:90,rpe:8,cue:"Sprint aller-retour, touche la ligne à chaque fois.",goals:["endurance","performance"]},
  {id:"cd16",n:"Burpee Broad Jump",m:"Cardio · Full body",eq:"cd",kg:0,reps:"10",rest:75,rpe:8,cue:"Burpee puis saut en longueur immédiat.",goals:["endurance","seche","performance"]},
  {id:"cd17",n:"Jump Rope Double Under",m:"Cardio · Mollets",eq:"cd",kg:0,reps:"30",rest:60,rpe:7,cue:"Deux tours de corde par saut.",goals:["endurance","seche"]},
  {id:"cd18",n:"Rowing Sprint 250m",m:"Cardio",eq:"cd",kg:0,reps:"250m",rest:90,rpe:8,cue:"Effort maximal, technique propre malgré la vitesse.",goals:["endurance","performance"]},
  {id:"ab11",n:"Cable Woodchop",m:"Obliques · Core",eq:"mc",kg:15,reps:"12",rest:60,rpe:6,cue:"Rotation du haut vers le bas, hanches stables.",goals:["hypertrophie","seche"]},
  {id:"ab12",n:"Ab Wheel Rollout",m:"Core",eq:"bw",kg:0,reps:"8",rest:90,rpe:7,cue:"Roule en avant sans casser le dos, revient contrôlé.",goals:["seche","performance","hypertrophie"]},
  {id:"ab13",n:"Weighted Sit-up",m:"Abdos",eq:"db",kg:8,reps:"12",rest:75,rpe:7,cue:"Disque sur la poitrine, monte complètement.",goals:["hypertrophie"]},
  {id:"ab14",n:"Pallof Press",m:"Core anti-rotation",eq:"mc",kg:15,reps:"10",rest:60,rpe:6,cue:"Résiste à la rotation du câble, presse devant soi.",goals:["hypertrophie","performance"]},
  {id:"ab15",n:"Hanging Windshield Wiper",m:"Obliques",eq:"bw",kg:0,reps:"8",rest:90,rpe:8,cue:"Suspendu, balance les jambes tendues de côté.",goals:["performance","hypertrophie"]},
  {id:"ab16",n:"Cable Crunch",m:"Abdos",eq:"mc",kg:25,reps:"12",rest:75,rpe:6,cue:"À genoux, enroule le buste vers le bas.",goals:["hypertrophie"]},
  {id:"ab17",n:"Dead Bug Lesté",m:"Core",eq:"db",kg:4,reps:"10",rest:60,rpe:6,cue:"Bras et jambe opposée s'étendent lentement.",goals:["hypertrophie","seche"]},
  {id:"ab18",n:"V-Up",m:"Abdos",eq:"bw",kg:0,reps:"12",rest:60,rpe:6,cue:"Mains et pieds se rejoignent au sommet.",goals:["seche","endurance"]},
  {id:"ab19",n:"Landmine Rotation",m:"Obliques · Core",eq:"bar",kg:10,reps:"10",rest:75,rpe:6,cue:"Rotation contrôlée de la barre en landmine.",goals:["performance","hypertrophie"]},
  {id:"ab20",n:"Suitcase Crunch",m:"Abdos · Hanches",eq:"bw",kg:0,reps:"12",rest:60,rpe:6,cue:"Genou et coude opposé se rejoignent au centre.",goals:["seche","hypertrophie"]},

  // NOUVEAUX EXERCICES (S4 batch 2 - pile 500)
  {id:"kb51",n:"KB Snatch Alterné Lourd",m:"Full body",eq:"kb",kg:16,reps:"6",rest:120,rpe:8,cue:"Alterne les bras sans reposer le KB au sol.",goals:["performance","endurance"]},
  {id:"kb52",n:"KB Double Front Rack Carry",m:"Core · Avant-bras",eq:"kb",kg:16,reps:"20m",rest:90,rpe:7,cue:"Deux KB en rack, marche stable et droite.",goals:["seche","performance"]},
  {id:"kb53",n:"KB Deck Squat",m:"Full body",eq:"kb",kg:12,reps:"8",rest:90,rpe:7,cue:"S'allonge puis se relève avec le KB en un mouvement.",goals:["endurance","seche"]},
  {id:"kb54",n:"KB Bottoms-Up Carry",m:"Avant-bras · Core",eq:"kb",kg:8,reps:"20m",rest:90,rpe:8,cue:"KB tête en bas, exige un grip strict en marchant.",goals:["performance","endurance"]},
  {id:"kb55",n:"KB Single Arm Push Press",m:"Épaules · Jambes",eq:"kb",kg:16,reps:"6",rest:90,rpe:7,cue:"Légère impulsion jambes, verrouille au-dessus.",goals:["performance","seche"]},
  {id:"kb56",n:"KB Plank Drag",m:"Core · Full body",eq:"kb",kg:10,reps:"10",rest:75,rpe:7,cue:"Position planche, tire le KB sous le corps.",goals:["seche","endurance"]},
  {id:"kb57",n:"KB Rotational Swing",m:"Fessiers · Obliques",eq:"kb",kg:14,reps:"10",rest:60,rpe:7,cue:"Swing avec rotation de la hanche en fin de mouvement.",goals:["seche","endurance"]},
  {id:"kb58",n:"KB Single Leg Deadlift Lourd",m:"Ischios · Fessiers",eq:"kb",kg:18,reps:"6",rest:90,rpe:8,cue:"Charge lourde, équilibre strict sur une jambe.",goals:["force","hypertrophie"]},
  {id:"kb59",n:"KB Waiter Carry",m:"Épaules · Core",eq:"kb",kg:12,reps:"20m",rest:90,rpe:7,cue:"KB verrouillé au-dessus d'une main, marche stable.",goals:["performance","seche"]},
  {id:"kb60",n:"KB Around the World Lourd",m:"Core · Avant-bras",eq:"kb",kg:14,reps:"10",rest:60,rpe:7,cue:"Passe le KB autour de la taille, sens alterné.",goals:["seche","endurance"]},
  {id:"bb44",n:"Deadlift Sumo Déficit",m:"Fessiers · Ischios",eq:"bar",kg:70,reps:"5",rest:180,rpe:8,cue:"Amplitude augmentée, prise sumo, dos plat.",goals:["force"]},
  {id:"bb45",n:"Barbell Overhead Lunge",m:"Full body",eq:"bar",kg:30,reps:"8",rest:90,rpe:7,cue:"Barre verrouillée au-dessus, fentes contrôlées.",goals:["performance"]},
  {id:"bb46",n:"Pin Press",m:"Pecs · Triceps",eq:"bar",kg:55,reps:"5",rest:150,rpe:8,cue:"Démarre depuis les pins, aucune élasticité.",goals:["force"]},
  {id:"bb47",n:"Barbell Glute Bridge",m:"Fessiers",eq:"bar",kg:50,reps:"10",rest:90,rpe:7,cue:"Version légère du hip thrust, dos au sol.",goals:["hypertrophie"]},
  {id:"bb48",n:"Barbell Reverse Lunge",m:"Quads · Fessiers",eq:"bar",kg:40,reps:"8",rest:90,rpe:7,cue:"Fente arrière, barre sur les trapèzes.",goals:["hypertrophie","performance"]},
  {id:"bb49",n:"Snatch Complet",m:"Full body",eq:"bar",kg:40,reps:"3",rest:180,rpe:9,cue:"Du sol au verrouillage au-dessus en un mouvement.",goals:["performance"]},
  {id:"bb50",n:"Barbell Skull Crusher",m:"Triceps",eq:"bar",kg:25,reps:"10",rest:75,rpe:6,cue:"Coudes fixes, descend vers le front.",goals:["hypertrophie"]},
  {id:"bb51",n:"Barbell Walking Lunge",m:"Quads · Fessiers",eq:"bar",kg:35,reps:"10",rest:90,rpe:7,cue:"Fentes en marchant, barre sur les trapèzes.",goals:["hypertrophie","performance"]},
  {id:"bb52",n:"Deadlift Prise Mixte",m:"Dos · Ischios",eq:"bar",kg:90,reps:"5",rest:180,rpe:8,cue:"Une main pronation, une supination pour tenir la charge.",goals:["force"]},
  {id:"bb53",n:"Barbell Thruster",m:"Full body",eq:"bar",kg:35,reps:"8",rest:120,rpe:8,cue:"Squat puis press explosif.",goals:["performance","seche"]},
  {id:"bb54",n:"Behind the Neck Press",m:"Épaules",eq:"bar",kg:30,reps:"8",rest:120,rpe:7,cue:"Presse derrière la nuque, mobilité requise.",goals:["force","performance"]},
  {id:"bb55",n:"Barbell Good Morning Lourd",m:"Ischios · Lombaires",eq:"bar",kg:50,reps:"8",rest:120,rpe:7,cue:"Bascule hanches reculées, dos plat rigide.",goals:["force","hypertrophie"]},
  {id:"bb56",n:"Rack Pull",m:"Dos · Trapèzes",eq:"bar",kg:100,reps:"5",rest:150,rpe:8,cue:"Barre à hauteur de genou, tire fort en haut.",goals:["force"]},
  {id:"bb57",n:"Barbell Complex Squat+Press",m:"Full body",eq:"bar",kg:30,reps:"5",rest:150,rpe:8,cue:"Squat puis press militaire enchâînés.",goals:["performance"]},
  {id:"bb58",n:"Spoto Press",m:"Pecs · Triceps",eq:"bar",kg:50,reps:"6",rest:120,rpe:7,cue:"Pause quelques cm au-dessus de la poitrine.",goals:["force","hypertrophie"]},
  {id:"db46",n:"DB Bench Press Tempo",m:"Pecs",eq:"db",kg:20,reps:"8",rest:90,rpe:7,cue:"Descente lente 3s, pousse explosif.",goals:["hypertrophie"]},
  {id:"db47",n:"DB Sumo Deadlift",m:"Fessiers · Ischios",eq:"db",kg:24,reps:"8",rest:90,rpe:7,cue:"Pieds larges, haltère entre les jambes.",goals:["hypertrophie","force"]},
  {id:"db48",n:"DB Push Press",m:"Épaules · Jambes",eq:"db",kg:16,reps:"8",rest:90,rpe:7,cue:"Légère impulsion jambes, verrouille en haut.",goals:["performance","seche"]},
  {id:"db49",n:"DB Curl 21s",m:"Biceps",eq:"db",kg:8,reps:"21",rest:75,rpe:7,cue:"7 reps basses, 7 hautes, 7 complètes.",goals:["hypertrophie"]},
  {id:"db50",n:"DB Incline Row",m:"Dos",eq:"db",kg:18,reps:"10",rest:90,rpe:7,cue:"Poitrine sur banc incliné, tire vers les hanches.",goals:["hypertrophie"]},
  {id:"db51",n:"DB Deadlift",m:"Ischios · Fessiers",eq:"db",kg:20,reps:"10",rest:90,rpe:7,cue:"Haltères le long du corps, dos plat.",goals:["hypertrophie","force"]},
  {id:"db52",n:"DB Overhead Triceps Extension",m:"Triceps",eq:"db",kg:12,reps:"12",rest:75,rpe:6,cue:"Deux mains sur un haltère, coudes fixes.",goals:["hypertrophie"]},
  {id:"db53",n:"DB Single Arm Row Lourd",m:"Dos",eq:"db",kg:26,reps:"8",rest:90,rpe:7,cue:"Charge lourde, dos plat, tire vers la hanche.",goals:["hypertrophie","force"]},
  {id:"db54",n:"DB Squat to Press",m:"Full body",eq:"db",kg:14,reps:"10",rest:90,rpe:7,cue:"Squat puis press, enchâîne fluide.",goals:["seche","performance"]},
  {id:"db55",n:"DB Rear Delt Row",m:"Deltoïdes lat.",eq:"db",kg:10,reps:"12",rest:75,rpe:6,cue:"Coudes hauts, tire vers les épaules.",goals:["hypertrophie"]},
  {id:"db56",n:"DB Waiter Carry",m:"Épaules · Core",eq:"db",kg:14,reps:"20m",rest:90,rpe:7,cue:"Haltère verrouillé au-dessus, marche stable.",goals:["performance","seche"]},
  {id:"db57",n:"DB Preacher Curl",m:"Biceps",eq:"db",kg:10,reps:"12",rest:75,rpe:6,cue:"Bras appuyé sur le pupitre, isole le biceps.",goals:["hypertrophie"]},
  {id:"db58",n:"DB Decline Press",m:"Pecs inf",eq:"db",kg:20,reps:"10",rest:90,rpe:7,cue:"Banc décliné, cible le bas des pecs.",goals:["hypertrophie"]},
  {id:"db59",n:"DB Suitcase Squat",m:"Quads · Core",eq:"db",kg:16,reps:"10",rest:75,rpe:7,cue:"Un haltère sur le côté, anti-flexion latérale.",goals:["hypertrophie","seche"]},
  {id:"db60",n:"DB Cuban Press",m:"Épaules · Rotateurs",eq:"db",kg:6,reps:"12",rest:75,rpe:6,cue:"Rotation externe puis press, contrôle total.",goals:["hypertrophie","performance"]},
  {id:"bw36",n:"Handstand Hold Mur",m:"Épaules · Core",eq:"bw",kg:0,reps:"20s",rest:90,rpe:7,cue:"Dos ou face au mur, gaine tout le corps.",goals:["performance","hypertrophie"]},
  {id:"bw37",n:"Single Leg Glute Bridge",m:"Fessiers",eq:"bw",kg:0,reps:"12",rest:60,rpe:6,cue:"Une jambe tendue, pousse avec le talon au sol.",goals:["hypertrophie","seche"]},
  {id:"bw38",n:"Skater Jump",m:"Quads · Fessiers",eq:"bw",kg:0,reps:"10",rest:75,rpe:7,cue:"Saut latéral, réception sur une jambe.",goals:["seche","endurance","performance"]},
  {id:"bw39",n:"Wall Sit",m:"Quads",eq:"bw",kg:0,reps:"30s",rest:60,rpe:6,cue:"Dos au mur, cuisses parallèles au sol.",goals:["seche","endurance"]},
  {id:"bw40",n:"Diamond Push-up",m:"Triceps · Pecs",eq:"bw",kg:0,reps:"12",rest:75,rpe:7,cue:"Mains en losange sous la poitrine.",goals:["hypertrophie"]},
  {id:"bw41",n:"Reverse Snow Angel",m:"Dos · Épaules",eq:"bw",kg:0,reps:"12",rest:60,rpe:6,cue:"Allongé face au sol, bras dessinent un arc.",goals:["hypertrophie","seche"]},
  {id:"bw42",n:"Step-Up Explosif",m:"Quads · Fessiers",eq:"bw",kg:0,reps:"10",rest:75,rpe:7,cue:"Monte sur banc puis saute en haut.",goals:["seche","endurance","performance"]},
  {id:"bw43",n:"Plank Shoulder Tap",m:"Core · Épaules",eq:"bw",kg:0,reps:"20",rest:60,rpe:6,cue:"Planche haute, touche l'épaule opposée sans bouger le bassin.",goals:["seche","endurance"]},
  {id:"bw44",n:"Tuck Jump",m:"Quads · Fessiers",eq:"bw",kg:0,reps:"10",rest:75,rpe:7,cue:"Genoux vers la poitrine en l'air, réception souple.",goals:["performance","seche"]},
  {id:"bw45",n:"Side Plank Rotation",m:"Obliques · Core",eq:"bw",kg:0,reps:"10",rest:60,rpe:6,cue:"Planche latérale, passe le bras sous le corps en rotation.",goals:["seche","hypertrophie"]},
  {id:"mc28",n:"Assisted Pull-up Machine",m:"Dos · Biceps",eq:"mc",kg:30,reps:"10",rest:90,rpe:7,cue:"Assistance dégressive, travaille l'amplitude complète.",goals:["hypertrophie"]},
  {id:"mc29",n:"Glute Kickback Machine",m:"Fessiers",eq:"mc",kg:25,reps:"12",rest:75,rpe:6,cue:"Pousse la jambe en arrière, contracte le fessier.",goals:["hypertrophie"]},
  {id:"mc30",n:"Seated Calf Raise",m:"Mollets",eq:"mc",kg:30,reps:"15",rest:60,rpe:6,cue:"Genoux plies, amplitude complète.",goals:["hypertrophie"]},
  {id:"mc31",n:"Torso Rotation Machine",m:"Obliques · Core",eq:"mc",kg:20,reps:"12",rest:60,rpe:6,cue:"Rotation contrôlée du buste, hanches fixes.",goals:["hypertrophie"]},
  {id:"mc32",n:"Shoulder Press Machine",m:"Épaules",eq:"mc",kg:35,reps:"10",rest:90,rpe:7,cue:"Presse verticale guidée, contrôle la descente.",goals:["hypertrophie"]},
  {id:"cd19",n:"Bike Erg Intervals",m:"Cardio",eq:"cd",kg:0,reps:"40s",rest:60,rpe:7,cue:"Effort soutenu puis récup courte, répète.",goals:["endurance","seche"]},
  {id:"cd20",n:"Farmer Carry Sprint",m:"Cardio · Avant-bras",eq:"cd",kg:0,reps:"20m",rest:75,rpe:7,cue:"Charge dans chaque main, marche rapide.",goals:["endurance","performance"]},
  {id:"cd21",n:"Suicide Sprint",m:"Cardio",eq:"cd",kg:0,reps:"5x10m",rest:90,rpe:8,cue:"Sprint navette avec distances croissantes.",goals:["endurance","performance"]},
  {id:"cd22",n:"Stair Sprint",m:"Cardio · Jambes",eq:"cd",kg:0,reps:"30s",rest:75,rpe:8,cue:"Monte les marches deux à deux si possible.",goals:["endurance","seche"]},
  {id:"cd23",n:"Air Bike Calories",m:"Cardio",eq:"cd",kg:0,reps:"15cal",rest:75,rpe:7,cue:"Objectif calories plutôt que temps, rythme régulier.",goals:["endurance","seche"]},
  {id:"ab21",n:"Reverse Crunch",m:"Abdos bas",eq:"bw",kg:0,reps:"15",rest:60,rpe:6,cue:"Genoux vers la poitrine, bas du dos au sol.",goals:["seche","hypertrophie"]},
  {id:"ab22",n:"Standing Cable Crunch",m:"Abdos",eq:"mc",kg:20,reps:"12",rest:60,rpe:6,cue:"Debout, enroule le buste contre la résistance.",goals:["hypertrophie"]},
  {id:"ab23",n:"Weighted Plank",m:"Core",eq:"db",kg:10,reps:"30s",rest:75,rpe:6,cue:"Disque sur le dos, planche stable.",goals:["seche","hypertrophie"]},
  {id:"ab24",n:"Toes to Bar",m:"Abdos · Grip",eq:"bw",kg:0,reps:"8",rest:90,rpe:8,cue:"Suspendu, pieds touchent la barre sans balancer.",goals:["performance","seche"]},
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
// Une seule periodisation. Deux modeles coexistaient et se contredisaient: un cycle MESO
// de 4 semaines qui pilotait REELLEMENT les charges, les series et les repos, et un modele
// PHASES12 de 12 blocs qui pilotait l'AFFICHAGE de la phase et les jalons du rapport.
// L'application annoncait donc une phase d'entrainement differente de celle qu'elle
// appliquait a tes charges. PHASES12 fait desormais autorite, et porte ses parametres.
const PHASE_PARAMS={
  "Accumulation":   {s: 1, r:0.90, i:1.00, g:"Séries hautes, tempo contrôlé"},
  "Intensification":{s: 0, r:1.20, i:1.06, g:"Charges lourdes, reps basses"},
  "Réalisation":    {s: 0, r:1.35, i:1.10, g:"Explosif, repos longs"},
  "Deload":         {s:-1, r:0.85, i:0.85, g:"Récupération, charges légères"},
  "Test / PR":      {s:-1, r:1.30, i:1.12, g:"Validation, nouveaux maxs"},
};
const REST_STEPS=[30,45,60,75,90,120,150,180,210,240,300];
const snapRest=(s)=>{ if(!s||s<=0) return 0; return REST_STEPS.reduce((a,b)=>Math.abs(b-s)<Math.abs(a-s)?b:a); };
const phaseOf = (w) => {
  const i=Math.max(0,Math.min(PHASES12.length-1,(Number(w)||1)-1));
  const name=PHASES12[i].n;
  const prm=PHASE_PARAMS[name]||PHASE_PARAMS["Accumulation"];
  return {k:name,...prm,deload:name==="Deload",peak:(name==="Réalisation"||name==="Test / PR")};
};
const PROG_WEEKS=12;
// Un programme fait 60 seances, POINT - que la semaine en cours en compte 3, 4 ou 5.
// La longueur etait calculee en 12*frequence (soit 48 a 4 seances/semaine), ce qui liait a tort
// la duree du programme au rythme hebdomadaire et ecrasait la valeur correcte des qu'on
// repassait dans l'onboarding ou qu'on touchait a sa frequence.
const PROGRAM_SESSIONS=60;
// Les 12 blocs de phase se repartissent donc sur les seances, pas sur des semaines calendaires.
const SESSIONS_PER_BLOCK=PROGRAM_SESSIONS/PROG_WEEKS; // 5
const progWeekRaw=(start)=>{ if(!start) return null; const ms=Date.now()-new Date(start+"T00:00:00").getTime(); return Math.floor(ms/604800000)+1; };
const progWeekOf=(start)=>{ const raw=progWeekRaw(start); if(raw==null) return programWeek(); return Math.min(PROG_WEEKS,Math.max(1,raw)); };
const progEndDate=(start)=>{ if(!start) return null; const d=new Date(start+"T00:00:00"); d.setDate(d.getDate()+PROG_WEEKS*7-1); return d; };
const fmtDateShort=(d)=>{ if(!d) return ""; const dd=(typeof d==="string")?new Date(d+"T00:00:00"):d; try{return dd.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});}catch(_e){return "";} };
// ─── SURCHARGE PROGRESSIVE ──────────────────────────────────────────────────
// La charge proposee derivait d'un bareme generique (poids de corps x niveau x phase) et
// ne regardait JAMAIS ce qui avait ete reellement souleve. Elle derive desormais de la
// derniere performance et du RPE ressenti - sans RPE collecte, aucune progression
// automatique n'est possible, c'est pour cela qu'il est demande en fin d'exercice.
// RPE = reps en reserve : 10 = plus rien, 9 = 1 rep, 8 = 2 reps, 7 = 3 reps.
const RPE_STEP={6:0.05,7:0.035,8:0.02,9:0,10:-0.05};
// Increment reel du materiel : une barre monte par 2,5 kg, un kettlebell ou une paire
// d'halteres par 2 kg. Sans cela, un ajustement de 5% sur 10 kg (0,5 kg) etait avale par
// l'arrondi et le ressenti n'avait AUCUN effet sur les charges legeres.
const loadStep=(eq)=>(eq==="kb"||eq==="db")?2:2.5;
const stepFor=(ex)=>loadStep(ex&&ex.eq);
const nextLoad=(prevKg,prevRpe,fallback,step)=>{
  if(!(prevKg>0)) return fallback;
  const st=step||2.5;
  const r=Math.round(Number(prevRpe));
  const k=(r>=6&&r<=10)?RPE_STEP[r]:0;
  if(!k) return prevKg;
  let out=Math.round(prevKg*(1+k)/st)*st;
  // Un ressenti non neutre doit TOUJOURS deplacer la charge d'au moins un increment,
  // sinon le coach reste muet sur tout le materiel leger.
  if(k>0&&out<=prevKg) out=prevKg+st;
  if(k<0&&out>=prevKg) out=prevKg-st;
  return Math.max(st,Math.round(out*10)/10);
};
// Derniere performance reelle par exercice (la plus recente qui compte des series faites).
const perfIndex=(sessions)=>{
  const m={};
  (sessions||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).forEach(s=>{
    (s.exercises||[]).forEach(e=>{
      if(!e||!e.id||!(Number(e.weight)>0)||!(Number(e.completedSets)>0)) return;
      m[e.id]={kg:Number(e.weight),rpe:(e.rpe!=null?Number(e.rpe):null),date:s.date};
    });
  });
  return m;
};
const RPE_LABEL={6:"Facile · 4 reps en réserve",7:"Confortable · 3 reps en réserve",8:"Exigeant · 2 reps en réserve",9:"Difficile · 1 rep en réserve",10:"Maximal · aucune rep en réserve"};

const LEVEL_LOAD={debutant:0.78,inter:1.0,avance:1.18,athlete:1.32};
const SEX_LOAD={homme:1.0,femme:0.62,autre:0.85};
const ENG_REF_BW=75;
const engineScale=(profile)=>{ const bw=Number(profile&&profile.weight_kg)||ENG_REF_BW; const lvl=LEVEL_LOAD[profile&&profile.level]||1.0; const sx=SEX_LOAD[profile&&profile.sex]||0.9; const bwf=Math.max(0.7,Math.min(1.3,bw/ENG_REF_BW)); return lvl*sx*bwf; };
// Repos fonde sur la NATURE de l'exercice. Il ne dependait que du nombre de repetitions et
// du materiel : un squat barre a 12 reps recevait 90 s quand une elevation laterale a 5 reps
// en aurait recu 180. Et le facteur de phase utilisait ph.r, concu comme multiplicateur de
// rotation (0,85 a 1,35), ce qui gonflait le repos jusqu'a 5 minutes sur des exercices
// d'isolation. Base par etage, ajustee par les reps, l'objectif, et une phase bornee.
// Une traction ne pese pas zero. Les exercices au poids de corps portaient weight=0, donc
// comptaient pour RIEN dans le tonnage : les 11 series de tractions et chin-ups du 29/07
// n'apparaissaient nulle part dans le volume hebdomadaire, ce qui le rendait incoherent avec
// l'effort reellement fourni. On estime la fraction de masse corporelle reellement deplacee.
const BW_FRACTION={pull_v:1.0,push_h:0.72,push_v:0.65,squat:0.85,hinge:0.6,arm_pull:0.5,arm_push:0.5,core:0,cardio:0};
const bodyLoadKg=(ex,bw)=>{
  if(!ex||ex.eq!=="bw"||!(bw>0)) return 0;
  const n=noAccent(ex.n);
  if(/dips|muscle-?up/.test(n)) return Math.round(bw*0.95);
  const f=BW_FRACTION[metaOf(ex).pattern];
  return f?Math.round(bw*f):0;
};

const REST_BY_TIER={lourd:210,compound:120,isolation:75,core:45,cardio:60};
const restFor=(ex,goal,ph)=>{
  const base0=REST_BY_TIER[metaOf(ex).tier]||90;
  const rn=repsNum(ex.reps);
  let base=base0;
  if(rn>0){ if(rn<=5) base*=1.15; else if(rn>=15) base*=0.70; else if(rn>=12) base*=0.85; }
  const gf=goal==="force"?1.2:goal==="endurance"?0.6:goal==="seche"?0.75:1.0;
  const pf=(ph&&ph.deload)?0.9:((ph&&ph.peak)?1.1:1.0);
  return snapRest(Math.max(30,Math.min(300,base*gf*pf)));
};

const personalizeDay=(day,profile,week,perf)=>{
  if(!day||!day.salle) return day;
  const scale=engineScale(profile);
  const ph=phaseOf(week);
  const intensity=ph.i;
  const setAdj=ph.s||0;
  const lvlSets=(profile&&profile.level==="debutant")?-1:(profile&&profile.level==="avance")?1:0;
  const rms=(profile&&profile.rms)||{};
  const goal=profile&&profile.goal;

  const exercises=(day.exercises||[]).map(ex=>{
    let kg=ex.kg;
    const rm=rms[ex.id];
    const p=perf&&perf[ex.id];
    // Ta derniere seance prime sur toute estimation : c'est la seule donnee vraie.
    if(p&&p.kg>0&&ex.eq!=="bw"){
      kg=nextLoad(p.kg,p.rpe,ex.kg,loadStep(ex.eq));
      if(ph.deload) kg=Math.max(2.5,Math.round(kg*0.85/2.5)*2.5);
    }
    else if(rm>0){ kg=Math.max(2.5,Math.round(rm*intensity/2.5)*2.5); }
    else if(typeof ex.kg==="number"&&ex.kg>0&&ex.eq!=="bw"){ kg=Math.max(2.5,Math.round(ex.kg*scale*intensity/2.5)*2.5); }
    let sets=ex.sets;
    if(typeof ex.sets==="number"){ sets=Math.max(2,Math.min(6,ex.sets+setAdj+lvlSets)); }
    const rest=restFor({...ex,reps:ex.reps},goal,ph);
    return {...ex,kg,sets,rest};
  });
  return {...day,exercises};
};
const baseGoal=(g)=>g==="force"?"force":g==="endurance"?"endurance":g==="seche"?"seche":"hybride";

// ─── CLASSIFICATION DU CATALOGUE ────────────────────────────────────────────
// Les 512 exercices ne portaient que leur materiel et un libelle musculaire en texte
// libre. Impossible, dans ces conditions, de decider si deux exercices peuvent
// s'enchainer : buildCircuits appariait donc les exercices par leur RANG dans la liste,
// ce qui pouvait mettre un soulevé de terre roumain en superset avec un squat gobelet.
// On derive ici, une fois pour toutes, trois proprietes par exercice.
const noAccent=(t)=>String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();

// Patron de mouvement. L'ordre des regles compte : du plus specifique au plus general.
const PATTERN_RULES=[
  [/gainage|planche|hollow|l-?sit|crunch|twist|releve.*jambe|jambe.*suspendu|ab ?wheel|ab ?rollout|dead ?bug|sit-?up|situp|dragon flag|bird ?dog|pallof/,"core"],
  [/rameur|velo|corde a sauter|corde 3|course|sprint|burpee|mountain climber|jumping jack|assault|ski erg|wall ball/,"cardio"],
  [/traction|chin-?up|pull-?up|tirage vertical|lat pulldown|muscle-?up|front lever/,"pull_v"],
  [/rowing|row |row$|tirage horizontal|face pull|tirage buste/,"pull_h"],
  [/souleve de terre|deadlift|romanian|good morning|hip thrust|glute bridge|swing|clean|snatch|kettlebell complex|sumo|turkish|get-?up|windmill/,"hinge"],
  [/squat|fente|lunge|presse a cuisse|leg press|step-?up|pistol|box jump|hack|bulgare/,"squat"],
  [/curl|biceps/,"arm_pull"],
  [/triceps|kickback|skull|barre au front|extension.*bras|dips triceps/,"arm_push"],
  [/couche|bench|pompe|push-?up|push up|dips|ecarte|fly|pec deck|pec |chest/,"push_h"],
  [/militaire|overhead|epaule|shoulder|arnold|elevation|oiseau|reverse fly|sots|bottoms-?up|press|developpe/,"push_v"],
];
const patternOf=(ex)=>{
  const n=noAccent(ex&&ex.n);
  for(const [re,pat] of PATTERN_RULES){ if(re.test(n)) return pat; }
  // Repli sur le libelle musculaire quand le nom ne dit rien.
  const m=noAccent(ex&&ex.m);
  if(/quad|fessier|jambe|mollet/.test(m)) return "squat";
  if(/ischio|lombaire/.test(m)) return "hinge";
  if(/dos/.test(m)) return "pull_h";
  if(/pec/.test(m)) return "push_h";
  if(/epaule/.test(m)) return "push_v";
  if(/biceps/.test(m)) return "arm_pull";
  if(/triceps/.test(m)) return "arm_push";
  if(/core|abdo|gainage/.test(m)) return "core";
  return "push_h";
};

// Etage de l'exercice : ce qui doit passer en premier, frais, et ce qui peut etre enchaine.
const COMPOUND=["squat","hinge","push_h","push_v","pull_v","pull_h"];
const tierOf=(ex,pattern)=>{
  if(pattern==="core") return "core";
  if(pattern==="cardio") return "cardio";
  const n=noAccent(ex&&ex.n);
  if(pattern==="arm_pull"||pattern==="arm_push") return "isolation";
  if(/elevation|oiseau|ecarte|fly|kickback|pec deck|leg extension|leg curl|mollet|shrug/.test(n)) return "isolation";
  // Seule la BARRE impose la serie droite : elle demande d'etre fraiche et de ne pas etre
  // enchainee. Les machines sont guidees et securisees, elles peuvent tres bien s'enchainer.
  if(ex.eq==="bar"&&COMPOUND.indexOf(pattern)>=0) return "lourd";
  if(COMPOUND.indexOf(pattern)>=0) return "compound";
  return "isolation";
};

// Type de progression : appliquer "+2,5 kg" a une planche ou a un kettlebell n'a aucun sens.
const progOf=(ex,pattern)=>{
  if(pattern==="cardio") return "densite";
  if(/\d+\s*s\b/.test(String(ex&&ex.reps))) return "temps";
  if(ex&&ex.eq==="kb") return "kb";
  if(ex&&ex.eq==="bw") return "bw";
  return "charge";
};

const EX_META={};
const metaOf=(ex)=>{
  if(!ex||!ex.id) return {pattern:"push_h",tier:"isolation",prog:"charge"};
  if(EX_META[ex.id]) return EX_META[ex.id];
  const pattern=patternOf(ex);
  const meta={pattern,tier:tierOf(ex,pattern),prog:progOf(ex,pattern)};
  EX_META[ex.id]=meta;
  return meta;
};

const REGION={push_h:"haut",push_v:"haut",pull_h:"haut",pull_v:"haut",arm_push:"haut",arm_pull:"haut",squat:"bas",hinge:"bas",core:"core",cardio:"cardio"};
const ANTAGONIST={push_h:"pull_h",pull_h:"push_h",push_v:"pull_v",pull_v:"push_v",squat:"hinge",hinge:"squat",arm_push:"arm_pull",arm_pull:"arm_push"};
const TIER_RANK={lourd:0,compound:1,isolation:2,core:3,cardio:4};

// Ordre de seance : lourd d'abord, a froid, puis polyarticulaire, isolation, gainage, cardio.
// L'ordre venait jusqu'ici du template ou du tirage au sort, sans aucune regle.
const orderDay=(day)=>{
  if(!day||!day.salle||!day.exercises||day.exercises.length<2) return day;
  const ranked=day.exercises.map((e,i)=>({e,i,r:TIER_RANK[metaOf(e).tier]!=null?TIER_RANK[metaOf(e).tier]:2}));
  ranked.sort((a,b)=>a.r-b.r||a.i-b.i);
  return {...day,exercises:ranked.map(x=>x.e)};
};

// Deux exercices peuvent-ils s'enchainer sans repos ?
const canPair=(a,b)=>{
  const ma=metaOf(a),mb=metaOf(b);
  if(ma.tier==="lourd"||mb.tier==="lourd") return false;          // jamais deux lourds enchaines
  if(primaryMuscle(a.m)===primaryMuscle(b.m)) return false;        // meme muscle : pas de recuperation
  if(ma.pattern===mb.pattern) return false;                        // meme patron : idem
  return true;
};
// Qualite d'un appariement : antagoniste d'abord, sinon haut/bas, sinon compatible.
const pairScore=(a,b)=>{
  const ma=metaOf(a),mb=metaOf(b);
  if(ANTAGONIST[ma.pattern]===mb.pattern) return 3;
  if(REGION[ma.pattern]!==REGION[mb.pattern]) return 2;
  return 1;
};

const buildCircuits=(day,profile)=>{
  const exos=day.exercises||[]; if(exos.length<3) return day;
  const goal=baseGoal(profile&&profile.goal);
  const gs=(goal==="seche"||goal==="endurance")?3:2;
  const out=exos.map(e=>({...e}));
  // L'appariement etait POSITIONNEL : on groupait les exercices deux a deux selon leur rang
  // dans la liste, sans jamais regarder ce qu'ils etaient. Un souleve de terre roumain
  // pouvait donc se retrouver enchaine sans repos avec un squat gobelet. On apparie
  // desormais sur des regles : jamais deux mouvements lourds, jamais le meme muscle,
  // jamais le meme patron, et de preference des antagonistes.
  const used=new Array(out.length).fill(false);
  let cid=0;
  for(let i=0;i<out.length;i++){
    if(used[i]) continue;
    if(metaOf(out[i]).tier==="lourd"){ used[i]=true; continue; } // series droites, a froid
    const group=[i];
    while(group.length<gs){
      let best=-1,bestScore=0;
      for(let j=i+1;j<out.length;j++){
        if(used[j]||group.indexOf(j)>=0) continue;
        if(!group.every(g=>canPair(out[g],out[j]))) continue;
        const sc=Math.min(...group.map(g=>pairScore(out[g],out[j])));
        if(sc>bestScore){ bestScore=sc; best=j; }
      }
      if(best<0) break;
      group.push(best);
    }
    if(group.length<2){ used[i]=true; continue; }  // rien de compatible : serie droite
    cid++;
    const gt=group.length>=3?"circuit":"superset";
    const tours=Math.max(...group.map(g=>(typeof out[g].sets==="number"&&out[g].sets>0)?out[g].sets:4));
    // Dans un superset on enchaine sans repos ; le repos se prend APRES le tour, et c'est
    // le plus long des membres qui commande. La valeur etait codee en dur a 90 s.
    const grest=Math.max(...group.map(g=>Number(out[g].rest)||90));
    group.forEach((g,k)=>{
      used[g]=true;
      out[g].groupRest=grest;
      // Un superset tourne le MEME nombre de tours pour tous ses membres, par definition.
      out[g].circuitId=cid; out[g].circuitPos=k+1; out[g].circuitSize=group.length;
      out[g].groupType=gt; out[g].groupTours=tours; out[g].sets=tours;
    });
  }
  // Les membres d'un groupe doivent etre CONTIGUS a l'affichage, sinon groupBlocks les
  // separe et le superset se lit comme deux exercices sans rapport.
  const ordered=[];const seen={};
  out.forEach(e=>{
    if(!e.circuitId){ ordered.push(e); return; }
    if(seen[e.circuitId]) return;
    seen[e.circuitId]=1;
    out.filter(x=>x.circuitId===e.circuitId).sort((a,b)=>a.circuitPos-b.circuitPos).forEach(x=>ordered.push(x));
  });
  return {...day,exercises:ordered};
};
const classifySession=(day)=>{ const ex=(day&&day.exercises)||[]; if(!ex.length) return {system:"force",metconEligible:false,condShare:0,hasBar:false}; let cond=0,hasBar=false; const n=ex.length; ex.forEach(e=>{ if(e.eq==="bar") hasBar=true; if(e.eq==="kb"||e.eq==="cd") cond+=1; else if(e.eq==="bw") cond+=0.8; else if(e.eq==="db") cond+=0.5; }); const condShare=cond/n; const metconEligible=!hasBar&&condShare>=0.5; const system=metconEligible?(condShare>0.85?"conditioning":"mixed"):"force"; return {system,metconEligible,condShare:+condShare.toFixed(2),hasBar}; };
const GOAL_METCON={force:0.10,hypertrophie:0.20,seche:0.55,hybride:0.45,endurance:0.70,performance:0.50};
const weeklyModePlan=(days,profile,week)=>{ const goal=(GOAL_METCON[profile&&profile.goal]!=null)?profile.goal:"hybride"; let ratio=GOAL_METCON[goal]; const ph=phaseOf(week); if(ph.deload) ratio*=0.4; const trainIdx=days.map((d,i)=>({i,salle:!!(d&&d.salle),cls:classifySession(d)})).filter(x=>x.salle); const nTrain=trainIdx.length; const eligible=trainIdx.filter(x=>x.cls.metconEligible); let nMet=Math.min(Math.round(ratio*nTrain),eligible.length); const ranked=eligible.slice().sort((a,b)=> b.cls.condShare-a.cls.condShare || a.i-b.i); const start=eligible.length?((week-1)%eligible.length):0; const chosen=[]; for(let k=0;k<nMet&&k<ranked.length;k++){ chosen.push(ranked[(start+k)%ranked.length].i); } const plan={}; const emomBias=ph.peak; chosen.sort((a,b)=>a-b).forEach((idx,order)=>{ const emom=emomBias?(order%2===0):(order%2===1); plan[idx]={mode:emom?"emom":"amrap",circuit:false}; }); trainIdx.forEach(x=>{ if(!plan[x.i]){ const circ=(goal!=="force"&&goal!=="hypertrophie"); plan[x.i]={mode:"classique",circuit:circ}; } }); return plan; };
const MET_BAN=["planche","dragon flag","muscle-up","handstand","l-sit","nordic","windmill","turkish","get-up","ab rollout","front lever","back lever","pistol","figure 8","around the world","pass under","halo","dead bug","hollow"];
const MET_KW=["swing","clean","snatch","thruster","press","pompe","push-up","push up","burpee","gobelet","goblet","squat","fente","lunge","step-up","jump","saut","corde","rameur","velo","mountain","twist","knee raise","relev","sit-up","situp","carry","farmer","slam","wall ball","complex","jumping","rowing","row"];
const MET_EQ_BASE={kb:3,cd:3,bw:2,db:2,bar:0,mc:0};
const metconScore=(ex,goal)=>{ const n=String(ex.n||"").toLowerCase(); if(MET_BAN.some(k=>n.indexOf(k)>=0)) return 0; let s=MET_EQ_BASE[ex.eq]||0; if(s===0) return 0; if(MET_KW.some(k=>n.indexOf(k)>=0)) s+=2; const e=ex.eq; if(goal==="endurance") s+=(e==="cd"?2:e==="bw"?1:0); else if(goal==="seche") s+=((e==="bw"||e==="cd")?1:0); else if(goal==="force") s+=((e==="kb"||e==="db")?1:0); else s+=((e==="kb"||e==="db")?1:0); return s; };
const metRepsAmrap=(ex)=> ex.eq==="cd"?0:ex.eq==="bw"?12:ex.eq==="kb"?12:10;
const metRepsEmom=(ex)=> ex.eq==="cd"?0:ex.eq==="bw"?12:ex.eq==="kb"?10:8;
const metKg=(ex,profile,f,perf)=>{
  if(ex.eq==="bw"||ex.eq==="cd") return 0;
  // Le RPE ressenti en EMOM/AMRAP ne servait a rien : les charges de metcon etaient
  // toujours recalculees depuis le bareme theorique. Elles suivent maintenant l'historique,
  // sans quoi le debrief de fin de bloc n'aurait aucun effet reel.
  const p=perf&&perf[ex.id];
  if(p&&p.kg>0) return nextLoad(p.kg,p.rpe,p.kg,loadStep(ex.eq));
  const sc=engineScale(profile); const base=(typeof ex.kg==="number"?ex.kg:0)*sc*f;
  return base>0?Math.max(4,Math.round(base/2)*2):0;
};
const buildMetcon=(day,mode,profile,week,seed,perf)=>{ if(!day||!day.salle) return day; const goal=baseGoal(profile&&profile.goal); const equip=(profile&&profile.equipment)||[]; const ph=phaseOf(week); let pool=DB.filter(e=>metconScore(e,goal)>0).filter(e=> e.eq==="bw" || !equip.length || equip.indexOf(e.eq)>=0); const seen={}; pool=pool.filter(e=>{ if(seen[e.n]) return false; seen[e.n]=1; return true; }); const dayEqs={};(day.exercises||[]).forEach(e=>{dayEqs[e.eq]=(dayEqs[e.eq]||0)+1;});pool=pool.map(e=>({e,s:metconScore(e,goal)+((dayEqs[e.eq]||0)>0?2:0)})).sort((a,b)=>b.s-a.s).map(x=>x.e); if(pool.length<6) pool=DB.filter(e=>metconScore(e,"hybride")>0); const off=pool.length?(((week-1)*3+(seed||0)*5)%pool.length):0; const rot=pool.slice(off).concat(pool.slice(0,off)); const lvl=profile&&profile.level; let nBlocks=lvl==="avance"?3:lvl==="debutant"?2:3; if(ph.deload) nBlocks=2; const perBlock=3; const rounds=lvl==="debutant"?3:lvl==="avance"?4:3; const cap=lvl==="avance"?12:10; const f=mode==="amrap"?0.55:0.65; const used={}; const blocks=[]; for(let b=0;b<nBlocks;b++){ const exs=[]; let cd=0; const mus={}; while(exs.length<perBlock){ let e=rot.find(x=>!used[x.n]&&(x.eq!=="cd"||cd<1)&&!mus[primaryMuscle(x.m)]); if(!e) e=rot.find(x=>!used[x.n]&&(x.eq!=="cd"||cd<1)); if(!e) e=rot.find(x=>!used[x.n]); if(!e) break; used[e.n]=1; if(e.eq==="cd")cd++; mus[primaryMuscle(e.m)]=1; exs.push(e); } if(!exs.length) break; const exercises=exs.map(ex=>{ const kg=metKg(ex,profile,f,perf); if(mode==="amrap"){ const r=metRepsAmrap(ex); return {...ex,kg,reps:String(ex.eq==="cd"?"40s":r),repsPerRound:r,modeTag:"AMRAP"}; } const r=metRepsEmom(ex); return {...ex,kg,reps:String(ex.eq==="cd"?"40s":r),repsPerMinute:r,modeTag:"EMOM"}; }); const durationMin=mode==="amrap"?cap:(exercises.length*rounds); blocks.push({label:(mode==="amrap"?"AMRAP ":"EMOM ")+(b+1),kind:mode,durationMin,rounds:mode==="emom"?rounds:0,exercises}); } const totalMin=blocks.reduce((a,bl)=>a+bl.durationMin,0)+Math.max(0,blocks.length-1)*2; const flat=[]; blocks.forEach((bl,bidx)=>bl.exercises.forEach(e=>{e.blockIdx=bidx;flat.push(e);})); return {...day,mode,metcon:true,blocks,totalMin,timeCapMin:blocks[0]?blocks[0].durationMin:cap,emomMinutes:blocks[0]?blocks[0].durationMin:8,exercises:flat}; };
const applyMode=(day,mode,profile,week,seed,perf)=>{ if(!day||!day.salle) return day; if(mode==="amrap"||mode==="emom") return buildMetcon(day,mode,profile,week,seed,perf); return day.circuit?buildCircuits(orderDay(day),profile):orderDay(day); };
const primaryMuscle = (m) => String(m||"").split("·")[0].trim().toLowerCase();
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
const GOAL_ADJ={force:{rest:1.25,reps:0.7},hypertrophie:{rest:0.9,reps:1.25},endurance:{rest:0.7,reps:1.5},seche:{rest:0.8,reps:1.15},hybride:{rest:1,reps:1},performance:{rest:0.85,reps:1.1}};
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
    const sub=DB.find(e=>e.id!==ex.id && primaryMuscle(e.m)===primaryMuscle(ex.m) && equip.includes(e.eq));
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

// ─── FILE D'ATTENTE DES ECRITURES ───────────────────────────────────────────
// Depuis le passage au tout-serveur, une coupure reseau en pleine seance faisait perdre
// les series des dernieres secondes : l'ecriture partait, echouait, et personne ne la
// rejouait. Toute ecriture passe desormais par cette file, rejouee automatiquement au
// retour du reseau avec un repli exponentiel. Les ecritures repetitives (log en cours,
// configuration) sont dedoublonnees par cle : seule la derniere version compte.
const OUTBOX=[];
let outboxTimer=null,outboxBusy=false;
const outboxSubs=new Set();
const outboxNotify=()=>{outboxSubs.forEach(f=>{try{f(OUTBOX.length);}catch(_e){}});};
const outboxSchedule=(ms)=>{clearTimeout(outboxTimer);outboxTimer=setTimeout(outboxFlush,ms);};
const enqueue=(key,label,run)=>{
  const job={key,label,run,tries:0};
  if(key){
    const i=OUTBOX.findIndex(j=>j.key===key);
    if(i>=0){ job.tries=OUTBOX[i].tries; OUTBOX[i]=job; outboxNotify(); outboxSchedule(300); return; }
  }
  OUTBOX.push(job); outboxNotify(); outboxSchedule(300);
};
async function outboxFlush(){
  if(outboxBusy||!OUTBOX.length) return;
  if(typeof navigator!=="undefined"&&navigator.onLine===false){ outboxSchedule(5000); return; }
  outboxBusy=true;
  while(OUTBOX.length){
    const job=OUTBOX[0];
    try{
      const res=await job.run();
      if(res&&res.error) throw new Error(res.error.message||"erreur");
      OUTBOX.shift(); outboxNotify();
    }catch(e){
      job.tries=(job.tries||0)+1;
      console.error("outbox "+job.label+":",e&&e.message);
      outboxBusy=false;
      // Repli exponentiel plafonne a 30 s : inutile de marteler un reseau absent.
      outboxSchedule(Math.min(30000,1000*Math.pow(2,Math.min(5,job.tries))));
      return;
    }
  }
  outboxBusy=false;
}
if(typeof window!=="undefined"){
  window.addEventListener("online",()=>outboxSchedule(200));
  document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible") outboxSchedule(200); });
}

// ─── SIGNAUX SONORES ────────────────────────────────────────────────────────
// Un son = un sens. L'application n'avait qu'un seul timbre pour la fin d'un repos,
// le changement de minute EMOM et la fin d'un bloc : trois evenements tres differents
// sonnaient pareil, ce qui obligeait a regarder l'ecran pour savoir ce qui venait de
// se passer. Quatre timbres distincts, synthetises a la volee (aucun fichier a charger).
const SOUND={enabled:true,vibrate:true,countdown:true,ctx:null};

// iOS refuse de produire du son tant que l'utilisateur n'a pas interagi avec la page,
// et l'ancienne implementation creait un AudioContext NEUF a chaque bip - donc une fuite
// et, sur mobile, un silence quasi systematique. Un seul contexte, debloque au premier tap.
const audioCtx=()=>{
  try{
    if(!SOUND.ctx) SOUND.ctx=new(window.AudioContext||window.webkitAudioContext)();
    if(SOUND.ctx.state==="suspended") SOUND.ctx.resume();
    return SOUND.ctx;
  }catch(_e){ return null; }
};
const unlockAudio=()=>{ const c=audioCtx(); if(c&&c.state==="suspended") c.resume(); };

const tone=(f,t0,d,g,type)=>{
  const c=audioCtx(); if(!c) return;
  const o=c.createOscillator(),v=c.createGain();
  o.type=type||"sine"; o.frequency.value=f;
  o.connect(v); v.connect(c.destination);
  const t=c.currentTime+t0;
  v.gain.setValueAtTime(0.0001,t);
  v.gain.exponentialRampToValueAtTime(g,t+0.012);
  v.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.start(t); o.stop(t+d+0.02);
};

const SFX={
  // Fin de repos : le seul moment ou l'ecran n'est pas regarde. Doit porter.
  cloche:()=>{[0,.16,.32].forEach(t=>tone(1046,t,0.16,0.22,"sine"));},
  // Decompte 3-2-1 : un clic par seconde, montant, pour se remettre en position.
  tick:(i)=>{tone([660,740,830][i]||830,0,0.09,0.18,"triangle");},
  // Minute EMOM : revient toutes les 60 s, donc volontairement bref et neutre.
  top:()=>{tone(880,0,0.07,0.20,"triangle");},
  // Fin de bloc / cap AMRAP : grave et long, aucune confusion avec le top de minute.
  gong:()=>{tone(196,0,1.1,0.26,"sine");tone(294,0.02,0.9,0.12,"sine");tone(392,0.04,0.5,0.06,"sine");},
  // Confirmation de tap, tres discret.
  clic:()=>{tone(1200,0,0.03,0.10,"triangle");},
};

const play=(name,arg)=>{ if(!SOUND.enabled) return; try{ if(SFX[name]) SFX[name](arg); }catch(_e){} };
const buzz=(ms)=>{ if(!SOUND.vibrate) return; try{ navigator.vibrate&&navigator.vibrate(ms); }catch(_e){} };
// Fin de repos : son + vibration, pour le cas ou le telephone est en poche ou en silencieux.
const signalRestOver=()=>{ play("cloche"); buzz([90,60,90]); };
const signalBlockOver=()=>{ play("gong"); buzz([180,80,180]); };
// Egrene le decompte des trois dernieres secondes d'un repos.
const signalCountdown=(remaining)=>{ if(!SOUND.countdown) return; if(remaining>=1&&remaining<=3){ play("tick",3-remaining); buzz(35); } };

// ─── HOOKS ───────────────────────────────────────────────────────────────────
// Chrono de seance base sur des TIMESTAMPS, jamais sur un compteur de ticks.
// Un setInterval est suspendu par le navigateur des que l'app passe en arriere-plan
// (ecran eteint, autre application) et perdu a chaque rechargement : le temps ecoule
// est donc recalcule a partir de l'heure de depart, ce qui reste juste dans tous les cas.
const clockSec=(s)=>{ if(!s) return 0; const acc=Number(s.acc)||0; const live=(s.running&&s.startedAt)?Math.max(0,Math.floor((Date.now()-s.startedAt)/1000)):0; return acc+live; };

// ─── PHOTOS : Supabase Storage, bucket prive ────────────────────────────────
// Une image encodee en base64 dans une colonne jsonb ne passe pas a l'echelle et
// n'est de toute facon jamais partie du telephone. Les fichiers vivent dans Storage,
// la base ne garde que leur chemin.
const PHOTO_BUCKET="progress";
const photoPath=(uid,date)=>`${uid}/${date}.jpg`;
const uploadPhoto=async(uid,date,blob)=>{
  const path=photoPath(uid,date);
  const{error}=await supabase.storage.from(PHOTO_BUCKET).upload(path,blob,{upsert:true,contentType:(blob&&blob.type)||"image/jpeg"});
  if(error) throw error;
  return path;
};
const removePhoto=async(path)=>{ if(!path) return; try{await supabase.storage.from(PHOTO_BUCKET).remove([path]);}catch(_e){} };
const dataUrlToBlob=async(d)=>{ const r=await fetch(d); return await r.blob(); };
// Bucket prive : l'affichage passe par des URL signees, regenerees a chaque chargement.
const signPhotos=async(map)=>{
  const entries=Object.entries(map||{}).filter(([,p])=>typeof p==="string"&&p&&p.indexOf("data:")!==0);
  if(!entries.length) return {};
  try{
    const{data,error}=await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(entries.map(([,p])=>p),3600);
    if(error||!data) return {};
    const out={};
    entries.forEach(([d],i)=>{ const s=data[i]; if(s&&s.signedUrl) out[d]=s.signedUrl; });
    return out;
  }catch(_e){ return {}; }
};

// ─── MIGRATION UNIQUE : localStorage -> serveur ─────────────────────────────
// Reprend ce qui n'a jamais quitte l'appareil (planning, log en cours, photos de
// progression, avatar), l'envoie sur le serveur, puis vide le stockage local.
// Aucun drapeau "deja migre" n'est necessaire : une fois les cles purgees, un second
// passage ne trouve plus rien et ne fait rien.
const purgeLegacy=(uid)=>{
  try{
    const ls=window.localStorage;
    const kill=["soma_photos","soma_clock",`soma_${uid}`,"soma_avatar_"+uid];
    Object.keys(ls).forEach(k=>{ if(k.indexOf("soma_avatar_")===0) kill.push(k); });
    kill.forEach(k=>{ try{ls.removeItem(k);}catch(_e){} });
  }catch(_e){}
  try{ sessionStorage.removeItem("sw"); }catch(_e){}
};

const migrateLocalToServer=async(uid)=>{
  let ls; try{ ls=window.localStorage; }catch(_e){ return; }
  if(!ls) return;
  try{
    const raw=ls.getItem(`soma_${uid}`);
    const local=raw?JSON.parse(raw):{};
    const patch={};
    if(Array.isArray(local.schedule)&&local.schedule.length) patch.schedule=local.schedule;
    if(Array.isArray(local.excluded))  patch.excluded=local.excluded;
    if(Array.isArray(local.favorites)) patch.favorites=local.favorites;
    if(Array.isArray(local.supersets)) patch.supersets=local.supersets;
    if(local.weights&&typeof local.weights==="object") patch.weights=local.weights;
    if(typeof local.accent==="string")     patch.accent=local.accent;
    if(typeof local.autoRotate==="boolean")patch.auto_rotate=local.autoRotate;

    // Photos : base64 local -> fichiers dans Storage, la base ne garde que le chemin.
    // Ces images n'existent NULLE PART ailleurs : au moindre echec d'envoi on renonce a
    // purger, quitte a retenter au prochain lancement. Ne jamais effacer ce qu'on n'a pas su sauver.
    let photoMap=null, photosPerdues=false;
    try{
      const pm=JSON.parse(ls.getItem("soma_photos")||"{}");
      const dates=Object.keys(pm).filter(d=>typeof pm[d]==="string"&&pm[d].indexOf("data:")===0);
      if(dates.length){
        photoMap={};
        for(const d of dates){
          try{ photoMap[d]=await uploadPhoto(uid,d,await dataUrlToBlob(pm[d])); }
          catch(e){ photosPerdues=true; console.error("migration photo",d,e&&e.message); }
        }
      }
    }catch(_e){ photosPerdues=true; }
    if(photoMap&&Object.keys(photoMap).length){
      const{data:cur}=await supabase.from("profiles").select("photos").eq("id",uid).maybeSingle();
      patch.photos={...((cur&&cur.photos)||{}),...photoMap};
    }
    const av=ls.getItem("soma_avatar_"+uid);
    if(av&&av.indexOf("data:")===0){
      try{ patch.avatar=await uploadPhoto(uid,"avatar",await dataUrlToBlob(av)); }catch(_e){}
    }
    if(Object.keys(patch).length){
      const{error}=await supabase.from("profiles").upsert({id:uid,...patch,updated_at:new Date().toISOString()},{onConflict:"id"});
      // En cas d'echec on NE purge PAS : mieux vaut retenter au prochain lancement
      // que de detruire des donnees qui n'existent nulle part ailleurs.
      if(error){ console.error("migration config:",error.message); return; }
    }
    if(local.log&&typeof local.log==="object"&&Object.keys(local.log).length){
      const{error}=await supabase.from("active_session").upsert({user_id:uid,date:todayKey(),log:local.log,updated_at:new Date().toISOString()},{onConflict:"user_id"});
      if(error){ console.error("migration log:",error.message); return; }
    }
    if(photosPerdues){ console.warn("migration : photos non transferees, stockage local conserve"); return; }
    purgeLegacy(uid);
  }catch(e){ console.error("migration",e); }
};

// Chrono pilote de l'exterieur : l'etat est persiste cote serveur (table active_session)
// par le composant parent. Une seance peut donc etre commencee sur un appareil et
// terminee sur un autre, et survit a un rechargement.
function useStopwatch(onPersist) {
  const[st,setSt]=useState(null);
  const[,tick]=useState(0);
  const stRef=useRef(null);
  const persistRef=useRef(onPersist);
  useEffect(()=>{persistRef.current=onPersist;},[onPersist]);
  useEffect(()=>{stRef.current=st;},[st]);
  const sec=clockSec(st);
  const running=!!(st&&st.running);
  useEffect(()=>{
    if(!running) return undefined;
    const id=setInterval(()=>tick(t=>t+1),1000);
    // Au retour au premier plan, le temps est recalcule immediatement (pas de rattrapage progressif).
    const sync=()=>tick(t=>t+1);
    document.addEventListener("visibilitychange",sync);
    window.addEventListener("focus",sync);
    return()=>{clearInterval(id);document.removeEventListener("visibilitychange",sync);window.removeEventListener("focus",sync);};
  },[running]);
  const apply=useCallback((next)=>{setSt(next);stRef.current=next;if(persistRef.current)persistRef.current(next);},[]);
  const start=useCallback(()=>apply({startedAt:Date.now(),acc:0,running:true,day:todayKey()}),[apply]);
  const resume=useCallback(()=>apply({startedAt:Date.now(),acc:clockSec(stRef.current),running:true,day:(stRef.current&&stRef.current.day)||todayKey()}),[apply]);
  const stop=useCallback(()=>{const p=stRef.current;if(!p)return;apply({startedAt:null,acc:clockSec(p),running:false,day:p.day});},[apply]);
  const reset=useCallback(()=>apply(null),[apply]);
  // Rehydratation depuis le serveur : ne doit PAS re-declencher une ecriture.
  const hydrate=useCallback((next)=>{setSt(next);stRef.current=next;},[]);
  return{sec,running,start,resume,stop,reset,hydrate};
}

function useCountdown(onDone) {
  const[sec,setSec]=useState(0);const[total,setTotal]=useState(0);const[running,setRunning]=useState(false);const[done,setDone]=useState(false);const ref=useRef(null);
  const left=useRef(0);
  const start=useCallback(s=>{
    clearInterval(ref.current);setSec(s);setTotal(s);setRunning(true);setDone(false);left.current=s;
    ref.current=setInterval(()=>{
      const nx=left.current-1; left.current=nx;
      if(nx<=0){clearInterval(ref.current);setSec(0);setRunning(false);setDone(true);signalRestOver();onDone&&onDone();return;}
      signalCountdown(nx);
      setSec(nx);
    },1000);
  },[onDone]);
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
    <div onPointerDown={()=>!disabled&&setP(true)} onPointerUp={(e)=>{setP(false);!disabled&&onTap?.(e);}} onPointerLeave={()=>setP(false)}
      style={{...style,transform:p&&!disabled?"scale(0.97)":"scale(1)",transition:`transform ${DUR.btn} ${EO}`,cursor:disabled?"default":"pointer",WebkitTapHighlightColor:"transparent",userSelect:"none"}}>
      {children}
    </div>
  );
}


// ─── WELCOME SCREEN ──────────────────────────────────────────────────────────
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
const METCON_PER_BLOCK=3;
const groupBlocks=(exos,mode)=>{
  const list=exos||[];
  const isMetcon=(mode==="amrap"||mode==="emom");
  const hasBlockIdx=list.some(e=>e&&e.blockIdx!=null);
  const blocks=[];
  list.forEach((ex,idx)=>{
    let key,label,gt=ex.groupType||null;
    if(hasBlockIdx&&ex.blockIdx!=null){
      key="b"+ex.blockIdx; label=`${mode==="emom"?"EMOM":"AMRAP"} ${Number(ex.blockIdx)+1}`; gt=gt||mode;
    }else if(isMetcon){
      // Seances enregistrees avant que le numero de bloc ne soit conserve : les metcons
      // etaient construits par blocs de trois exercices, on retrouve le decoupage d'origine.
      const b=Math.floor(idx/METCON_PER_BLOCK);
      key="b"+b; label=`${mode==="emom"?"EMOM":"AMRAP"} ${b+1}`; gt=gt||mode;
    }else if(ex.circuitId){
      key="c"+ex.circuitId; label=ex.m||"Divers";
    }else{
      key="m:"+(ex.m||"Divers"); label=ex.m||"Divers";
    }
    const last=blocks[blocks.length-1];
    if(last&&last.key===key) last.items.push({ex,idx});
    else blocks.push({key,muscle:label,groupType:gt,items:[{ex,idx}]});
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

function HomeTab({profile,streak,sessions,weights,todaySession,onStartToday,accent,trainingDaysPerWeek,weighIns,onSaveWeighIn}) {
  const now=new Date();
  const wk=(()=>{const d=new Date(now);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0);return d;})();
  // Meme fenetre que le bilan des statistiques : liste explicite des sept dates de la semaine.
  // La comparaison new Date(s.date) >= lundi melangeait une date lue en UTC et un lundi local,
  // et n'avait aucune borne haute - deux facons de ne pas tomber sur le meme total.
  const weekKeys=Array.from({length:7},(_,i)=>{const d=new Date(wk);d.setDate(wk.getDate()+i);return localDateKey(d);});
  const weekSessions=sessions.filter(s=>weekKeys.indexOf(s.date)>=0);
  const weekVol=weekSessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const totalSessions=sessions.length;
  const lwStart=new Date(wk);lwStart.setDate(lwStart.getDate()-7);
  const lastWeekSessions=sessions.filter(s=>{const sd=new Date(s.date);return sd>=lwStart&&sd<wk;});
  const lastWeekVol=lastWeekSessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const volDeltaPct=lastWeekVol>0?Math.round((weekVol-lastWeekVol)/lastWeekVol*100):null;
  // Temps d'entrainement cumule de la semaine : le tonnage seul ne dit rien de la charge
  // de travail d'une semaine faite de seances courtes et denses.
  const fmtMin=(m)=>m>=60?`${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`:`${m} min`;
  const weekMin=Math.round(weekSessions.reduce((a,s)=>a+(Number(s.duration)||0),0)/60);
  const lastWeekMin=Math.round(lastWeekSessions.reduce((a,s)=>a+(Number(s.duration)||0),0)/60);
  const minDelta=weekMin-lastWeekMin;
  const sessDelta=weekSessions.length-lastWeekSessions.length;
  const showBilan=lastWeekSessions.length>0||weekSessions.length>0;
  const bw=weights&&weights.length?weights[weights.length-1].kg:(profile&&profile.weight_kg);
  const hour=now.getHours();
  const hello=hour<12?"Bonjour":hour<18?"Bon après-midi":"Bonsoir";
  const name=(profile&&profile.name)?profile.name:"";
  const isRest=!todaySession||!todaySession.salle;
  const progIndex=Math.min(profile?.session_index||0,profile?.total_sessions||0);
  const progTotal=profile?.total_sessions||null;
  const goalLabel=(GOALS.find(g=>g[0]===profile?.goal)||[])[1]||null;
  const Stat=({v,l,sub})=>(<div style={{flex:1,background:C.s1,borderRadius:16,padding:"16px 14px"}}><div style={{fontSize:26,fontWeight:800,color:C.ink,lineHeight:1}}>{v}</div><div style={{fontSize:12,color:C.ink3,marginTop:6,fontWeight:600}}>{l}</div>{sub&&<div style={{fontSize:11,color:C.ink4,marginTop:2}}>{sub}</div>}</div>);
  return (<div style={{padding:"20px 20px 0",maxWidth:600,margin:"0 auto"}}>
    <div style={{fontSize:26,fontWeight:800,color:C.ink,letterSpacing:"-.02em",marginBottom:goalLabel?10:20}}>{hello}{name?(", "+name):""}</div>
    {goalLabel&&<div style={{marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
        <span style={{fontSize:13,fontWeight:700,color:C.ink2}}>Programme {goalLabel}</span>
        {progTotal>0&&<span style={{fontSize:12,fontWeight:600,color:C.ink4}}>Séance {progIndex}/{progTotal}</span>}
      </div>
      {progTotal>0&&<div style={{height:4,borderRadius:2,background:C.s2,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,progIndex/progTotal*100)}%`,background:accent||C.blue,borderRadius:2,transition:`width 400ms ${EO}`}}/></div>}
      {progTotal>0&&progIndex>=progTotal&&<div style={{marginTop:10,fontSize:12,fontWeight:600,color:C.green}}>Programme terminé — choisis un nouveau programme dans Réglages</div>}
    </div>}
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
      <Stat v={fmtMin(weekMin)} l="Temps semaine" sub="d'entraînement"/>
      <Stat v={totalSessions} l="Total" sub="séances faites"/>
    </div>
    {onSaveWeighIn&&<WeighInCard weighIns={weighIns} onSave={onSaveWeighIn}/>}
    {showBilan&&<div style={{background:C.s1,borderRadius:16,padding:"16px",marginBottom:12}}>
      <div style={{fontSize:11,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Bilan vs semaine dernière</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:13,color:C.ink3}}>Séances</span>
        <span style={{fontSize:14,fontWeight:700,color:C.ink}}>{weekSessions.length} <span style={{color:C.ink4,fontWeight:600}}>vs {lastWeekSessions.length}</span> {sessDelta!==0&&<span style={{color:sessDelta>0?C.green:C.red}}>{sessDelta>0?"▲":"▼"}{Math.abs(sessDelta)}</span>}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,color:C.ink3}}>Temps</span>
        <span style={{fontSize:14,fontWeight:700,color:C.ink}}>{fmtMin(weekMin)} <span style={{color:C.ink4,fontWeight:600}}>vs {fmtMin(lastWeekMin)}</span> {minDelta!==0&&<span style={{color:minDelta>0?C.green:C.red}}>{minDelta>0?"▲+":"▼"}{Math.abs(minDelta)} min</span>}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:13,color:C.ink3}}>Volume</span>
        <span style={{fontSize:14,fontWeight:700,color:C.ink}}>{Math.round(weekVol).toLocaleString("fr-FR")} kg {volDeltaPct!==null&&<span style={{color:volDeltaPct>=0?C.green:C.red}}>{volDeltaPct>=0?"▲+":"▼"}{Math.abs(volDeltaPct)}%</span>}</span>
      </div>
    </div>}
    {progTotal>0&&(()=>{
      const tdpw=trainingDaysPerWeek||5;
      const paliers=phaseBlocksList().map(b=>({label:b.name,threshold:Math.min(progTotal,b.endWeek*tdpw)}));
      return(
        <div style={{background:C.s1,borderRadius:16,padding:"16px",marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:14}}>Paliers du programme</div>
          <div style={{display:"flex",alignItems:"flex-start"}}>
            {paliers.map((p,i)=>{
              const reached=progIndex>=p.threshold;
              const isCurrent=!reached&&(i===0||progIndex>=paliers[i-1].threshold);
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
                  {i>0&&<div style={{position:"absolute",top:14,right:"50%",width:"100%",height:2,background:reached||isCurrent?C.blue:C.s3,zIndex:0}}/>}
                  <div style={{width:28,height:28,borderRadius:"50%",background:reached?C.blue:(isCurrent?C.bg:C.s2),border:`2px solid ${reached||isCurrent?C.blue:C.s3}`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1,flexShrink:0}}>
                    <span style={{fontSize:12,fontWeight:700,color:reached?"#000":(isCurrent?C.blue:C.ink4)}}>{reached?"✓":i+1}</span>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,color:reached||isCurrent?C.ink3:C.ink4,marginTop:6,textAlign:"center"}}>{p.label}</span>
                  <span style={{fontSize:9,color:C.ink4,marginTop:1}}>{p.threshold}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    })()}
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
  return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:Z.fullscreen,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:600,maxHeight:"88vh",overflowY:"auto",background:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:"20px 20px calc(20px + env(safe-area-inset-bottom))"}}>
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
function CircuitPlayer({mode,exos,onClose,defMin,blocks,onAllDone,startBlock,log,onLogSet,sDate}) {
  const BLK=(blocks&&blocks.length)?blocks:[{label:mode==="amrap"?"AMRAP":"EMOM",kind:mode,exercises:exos||[],durationMin:defMin||(mode==="amrap"?12:Math.max((exos||[]).length,8))}];
  const [bi,setBi]=useState(startBlock||0);
  const cur=BLK[Math.min(bi,BLK.length-1)]||{exercises:[]};
  const kind=cur.kind||mode||"amrap";
  const cexos=cur.exercises||[];
  const lastBlock=bi>=BLK.length-1;
  const [running,setRunning]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [rounds,setRounds]=useState(0);
  const [si,setSi]=useState(0);
  const [stour,setStour]=useState(1);
  const [resting,setResting]=useState(0);
  const ref=useRef(null); const lastMin=useRef(0); const restRef=useRef(null);
  const occRef=useRef({});
  const logOccurrence=(ex)=>{
    if(!ex||!onLogSet||!sDate) return;
    const cnt=occRef.current[ex.id]||0;
    occRef.current[ex.id]=cnt+1;
    onLogSet(`${sDate}_${ex.id}_s${cnt}`,{done:true,weight:ex.kg||0,reps:Number(String(ex.reps||"0").replace(/\D+/g,""))||0,date:sDate});
  };
  const durMin=cur.durationMin||defMin||(kind==="amrap"?12:Math.max(cexos.length,8));
  const total=durMin*60;
  const supTours=cur.tours||(cexos[0]&&cexos[0].groupTours)||(cexos[0]&&cexos[0].sets)||4;
  useEffect(()=>()=>{clearInterval(ref.current);clearInterval(restRef.current);},[]);
  useEffect(()=>{
    clearInterval(ref.current);clearInterval(restRef.current);
    setRunning(false);setElapsed(0);setRounds(0);setSi(0);setStour(1);setResting(0);lastMin.current=0;
    // Le compteur d'occurrences repartait de zero a chaque ouverture du lecteur : reprendre un
    // bloc interrompu reecrivait par-dessus les tours deja valides. On repart de ce qui est
    // reellement enregistre dans le log.
    const occ={};
    (cexos||[]).forEach(e=>{ if(!e||!e.id||!sDate) return; let c=0; while(log&&log[`${sDate}_${e.id}_s${c}`]&&log[`${sDate}_${e.id}_s${c}`].done) c++; occ[e.id]=c; });
    occRef.current=occ;
  },[bi]);
  const goNext=()=>{clearInterval(ref.current);clearInterval(restRef.current);if(lastBlock){onAllDone&&onAllDone();onClose&&onClose();}else{setBi(b=>b+1);}};
  // Fin de bloc : on ne passe plus directement au suivant. Le ressenti est demande ici,
  // et il pilote la charge des prochaines seances - c'est ce qui rend le coach dynamique.
  const [debrief,setDebrief]=useState(false);
  const finishBlock=()=>{clearInterval(ref.current);clearInterval(restRef.current);setRunning(false);setDebrief(true);};
  const submitDebrief=(rpe)=>{
    if(rpe&&sDate&&onLogSet) (cexos||[]).forEach(e=>{ if(e&&e.id) onLogSet(`${sDate}_${e.id}_rpe`,{rpe,date:sDate}); });
    setDebrief(false); goNext();
  };
  // Le decompte est pilote par une ref, jamais depuis l'updater de state : les effets de bord
  // qui s'y trouvaient (bip ET enregistrement d'occurrence) etaient joues deux fois sous
  // React StrictMode, ce qui pouvait compter une minute EMOM en double.
  const elRef=useRef(0);
  const startTimer=()=>{
    if(running||total<=0)return;
    setRunning(true); elRef.current=elapsed; lastMin.current=Math.floor(elapsed/60);
    const tt=total,isEmom=kind==="emom";
    ref.current=setInterval(()=>{
      const n=elRef.current+1; elRef.current=n;
      if(isEmom){
        const cm=Math.floor(n/60);
        if(cm!==lastMin.current&&n<tt){
          logOccurrence(cexos.length?cexos[lastMin.current%cexos.length]:null);
          lastMin.current=cm; play("top"); buzz(60);
        }
      }
      if(n>=tt){
        clearInterval(ref.current);
        if(isEmom&&cexos.length) logOccurrence(cexos[lastMin.current%cexos.length]);
        signalBlockOver(); setRunning(false); setElapsed(tt); setTimeout(()=>finishBlock(),900); return;
      }
      setElapsed(n);
    },1000);
  };
  const pause=()=>{clearInterval(ref.current);setRunning(false);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setElapsed(0);elRef.current=0;setRounds(0);lastMin.current=0;};
  const remaining=Math.max(0,total-elapsed);
  const done=total>0&&elapsed>=total;
  const curMin=Math.min(durMin,Math.floor(elapsed/60)+1);
  const secInMin=done?0:60-(elapsed%60);
  const emomEx=cexos.length?cexos[(curMin-1)%cexos.length]:null;
  const restLeft=useRef(0);
  const startRest=()=>{
    const rs=cur.restSec||90;
    clearInterval(restRef.current); setResting(rs); restLeft.current=rs;
    restRef.current=setInterval(()=>{
      const nx=restLeft.current-1; restLeft.current=nx;
      if(nx<=0){clearInterval(restRef.current);setResting(0);signalRestOver();return;}
      signalCountdown(nx); setResting(nx);
    },1000);
  };
  const validateAmrap=()=>{
    if(!running||done) return;
    logOccurrence(cexos[si]);
    if(si<cexos.length-1){ setSi(si+1); } else { setSi(0); setRounds(r=>r+1); }
  };
  const validateSup=()=>{if(resting>0)return;logOccurrence(cexos[si]);if(si<cexos.length-1){setSi(si+1);}else{setSi(0);if(stour>=supTours){finishBlock();}else{setStour(stour+1);startRest();}}};
  // Meme grammaire d'en-tete que l'ecran d'exercice : retour a gauche, intitule au centre,
  // emplacement d'action a droite. Les deux ecrans presentaient une croix ou une fleche
  // selon le type de seance, au meme endroit et avec le meme geste attendu.
  const HEAD=(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"16px 20px",flexShrink:0}}>
      <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:20,color:C.ink3}}>‹</span></Tap>
      <div style={{textAlign:"center",minWidth:0,flex:1}}>
        <div style={{fontSize:13,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Bloc {bi+1}/{BLK.length}</div>
        <div style={{fontSize:15,fontWeight:700,color:C.ink,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cur.label||(kind==="amrap"?"AMRAP":kind==="emom"?"EMOM":kind==="circuit"?"Circuit":"Superset")}</div>
      </div>
      <div style={{width:40,flexShrink:0}}/>
    </div>);
  // ─── "Une chose a la fois" applique aux lecteurs de bloc ────────────────────
  // Les trois regimes partagent desormais la meme grammaire : un anneau pour le temps,
  // l'exercice EN COURS en grand, la progression en tours, et ce qui vient ensuite.
  // L'ancienne liste de tous les exercices du bloc obligeait a chercher sa ligne en plein
  // effort, et ses cases a cocher n'etaient qu'un decor : elles n'ecrivaient rien.
  const RING=54,CIRC=2*Math.PI*RING;
  const Ring=({pct,value,label})=>(
    <div style={{position:"relative",width:158,height:158,margin:"0 auto"}}>
      <svg width="158" height="158" viewBox="0 0 132 132" style={{transform:"rotate(-90deg)"}}>
        <circle cx="66" cy="66" r={RING} fill="none" stroke={C.s2} strokeWidth="9"/>
        <circle cx="66" cy="66" r={RING} fill="none" stroke={C.green} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-Math.max(0,Math.min(1,pct)))}
          style={{transition:`stroke-dashoffset 900ms linear`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
        <span style={{fontSize:38,fontWeight:700,color:C.ink,letterSpacing:"-.03em",fontVariantNumeric:"tabular-nums"}}>{value}</span>
        <span style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{label}</span>
      </div>
    </div>
  );
  const TourBar=({d,t})=>(
    <div style={{display:"flex",gap:5}}>
      {Array.from({length:Math.max(1,t)},(_,i)=>(
        <div key={i} style={{flex:1,height:5,borderRadius:3,background:i<d?C.green:C.s3,transition:`background 200ms ${EO}`}}/>
      ))}
    </div>
  );
  const Dots=({n,at})=>(
    <div style={{display:"flex",gap:6,justifyContent:"center"}}>
      {Array.from({length:n},(_,i)=>(
        <div key={i} style={{width:i===at?10:8,height:i===at?10:8,borderRadius:"50%",
          background:i<at?C.green:i===at?C.ink4:C.s4,transition:`all 200ms ${EO}`}}/>
      ))}
    </div>
  );
  const exSub=(e)=>e?`${e.kg>0?e.kg+" kg · ":""}${e.reps} reps`:"";
  const Now=({ex,sub})=>(
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:28,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.15}}>{ex?ex.n:"—"}</div>
      <div style={{fontSize:16,color:C.ink3,marginTop:6,fontVariantNumeric:"tabular-nums"}}>{sub}</div>
    </div>
  );
  const NextUp=({label,ex})=> ex?(
    <div style={{background:C.s1,borderRadius:14,padding:"12px 15px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
      <span style={{fontSize:13,color:C.ink4,flexShrink:0}}>{label}</span>
      <span style={{fontSize:15,fontWeight:600,color:C.ink,textAlign:"right"}}>{ex.n}</span>
    </div>
  ):null;
  const Btn=({label,act,bg,fg,flex})=>(
    <Tap onTap={act} style={{flex:flex||1,padding:"18px",borderRadius:15,background:bg||C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontSize:17,fontWeight:700,color:fg||"#000"}}>{label}</span>
    </Tap>
  );
  const skipRest=()=>{clearInterval(restRef.current);setResting(0);};
  const WRAP={padding:"4px 20px 8px",width:"100%",display:"flex",flexDirection:"column",gap:20};
  const BAR={display:"flex",gap:10,padding:"12px 20px calc(12px + env(safe-area-inset-bottom))",flexShrink:0};

  let BODY,FOOT;
  if(kind==="superset"||kind==="circuit"){
    const curEx=cexos[si],nextEx=si<cexos.length-1?cexos[si+1]:null;
    const rs=cur.restSec||90;
    BODY=(<div style={WRAP}>
      {resting>0?(<>
        <Ring pct={rs>0?(rs-resting)/rs:0} value={fmtMSS(resting)} label="Récupération"/>
        <div style={{textAlign:"center",fontSize:14,color:C.ink3}}>Tour {Math.max(1,stour-1)} sur {supTours} terminé</div>
        <NextUp label="Reprend par" ex={cexos[0]}/>
      </>):(<>
        <div>
          <div style={{textAlign:"center",fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>Tour {stour} sur {supTours}</div>
          <TourBar d={stour-1} t={supTours}/>
        </div>
        <Now ex={curEx} sub={exSub(curEx)}/>
        <Dots n={cexos.length} at={si}/>
        <NextUp label={nextEx?"Enchaîner sans repos":"Puis"} ex={nextEx}/>
      </>)}
    </div>);
    FOOT=(<div style={BAR}>
      {resting>0
        ? <Btn label="Passer le repos" act={skipRest} bg={C.s2} fg={C.ink2}/>
        : <Btn label={si<cexos.length-1?"Fait · exercice suivant":(stour>=supTours?"Terminer le bloc":"Fait · repos")} act={validateSup}/>}
    </div>);
  } else if(kind==="amrap"){
    const curEx=cexos[si],nextEx=cexos.length?cexos[(si+1)%cexos.length]:null;
    BODY=(<div style={WRAP}>
      <Ring pct={total>0?elapsed/total:0} value={done?"FINI":fmtMSS(remaining)} label={done?"terminé":"restant"}/>
      <div style={{textAlign:"center",fontSize:14,color:C.ink3}}>
        <span style={{fontWeight:700,color:C.ink}}>{rounds}</span> tour{rounds>1?"s":""} complet{rounds>1?"s":""}
        {running&&!done&&si>0?` · ${si}/${cexos.length} dans le tour en cours`:""}
      </div>
      {running&&!done&&<><Now ex={curEx} sub={exSub(curEx)}/><Dots n={cexos.length} at={si}/><NextUp label="Ensuite" ex={nextEx}/></>}
      {!running&&!done&&<NextUp label="Commence par" ex={cexos[si]}/>}
    </div>);
    FOOT=(<div style={BAR}>
      {running&&!done&&<Btn label="Pause" act={pause} bg={C.s2} fg={C.ink3} flex={0} />}
      {done
        ? <Btn label={lastBlock?"Terminer":"Bloc suivant"} act={finishBlock} bg={C.green}/>
        : running
          ? <Btn label="Fait" act={validateAmrap} bg={C.green} flex={2}/>
          : <Btn label={elapsed>0?"Reprendre":"Démarrer le bloc"} act={startTimer}/>}
    </div>);
  } else {
    const nextEx=cexos.length?cexos[curMin%cexos.length]:null;
    BODY=(<div style={WRAP}>
      <Ring pct={done?1:(60-secInMin)/60} value={done?"FINI":fmtMSS(secInMin)} label={done?"terminé":`minute ${curMin} / ${durMin}`}/>
      {!done&&<><Now ex={emomEx} sub={exSub(emomEx)}/><TourBar d={curMin-1} t={durMin}/><NextUp label="Minute suivante" ex={nextEx}/></>}
    </div>);
    FOOT=(<div style={BAR}>
      {done
        ? <Btn label={lastBlock?"Terminer":"Bloc suivant"} act={finishBlock} bg={C.green}/>
        : running
          ? <Btn label="Pause" act={pause} bg={C.s2} fg={C.ink2}/>
          : <Btn label={elapsed>0?"Reprendre":"Démarrer le bloc"} act={startTimer}/>}
    </div>);
  }
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,height:"100dvh",maxHeight:"100dvh",background:C.bg,zIndex:Z.fullscreen,overflowY:"auto",overscrollBehavior:"none",WebkitOverflowScrolling:"touch",fontFamily:F,paddingTop:"env(safe-area-inset-top)",boxSizing:"border-box",animation:`sheetIn ${DUR.modal} ${ED} both`}}>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        {HEAD}
        <div key={`${bi}:${resting>0?"rest":done?"done":running?"run":"idle"}:${si}`} style={{animation:`stateIn 240ms ${EO} both`}}>{BODY}</div>
        {debrief&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:Z.fullscreen+50,display:"flex",alignItems:"flex-end",justifyContent:"center",animation:`fadeIn 200ms ${EO} both`}}>
            <div style={{width:"100%",maxWidth:600,maxHeight:"92vh",overflowY:"auto",background:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:"22px 20px calc(22px + env(safe-area-inset-bottom))",animation:`sheetIn ${DUR.modal} ${ED} both`}}>
              <div style={{fontSize:20,fontWeight:700,color:C.ink}}>{cur.label||"Bloc"} terminé</div>
              <div style={{fontSize:13,color:C.ink4,marginTop:4,marginBottom:6}}>Ta réponse ajuste les charges des prochaines séances.</div>
              <div style={{fontSize:12,color:C.ink4,marginBottom:16}}>{cexos.map(e=>e.n).join(" · ")}</div>
              {[[6,"Trop léger","La charge était sous-évaluée"],
                [7,"Ça passait","Il restait 3 répétitions"],
                [8,"Exigeant","Il restait 2 répétitions"],
                [9,"Très dur","Il restait 1 répétition"],
                [10,"Pas tenu","Charge trop lourde ou série cassée"]].map(([v,t,d])=>(
                <Tap key={v} onTap={()=>submitDebrief(v)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,background:C.s1,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:15,fontWeight:700,color:C.ink2}}>{v}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{t}</div>
                    <div style={{fontSize:12,color:C.ink4,marginTop:1}}>{d}</div>
                  </div>
                </Tap>
              ))}
              <Tap onTap={()=>submitDebrief(null)} style={{marginTop:6,padding:"13px",display:"flex",justifyContent:"center"}}>
                <span style={{fontSize:14,fontWeight:600,color:C.ink4}}>Passer sans noter</span>
              </Tap>
            </div>
          </div>
        )}
        {FOOT}
      </div>
    </div>);
}
function ExerciseRowCollapsed({ex,dayIdx,sDate,log,idx,onOpen,onReplace,doneSession,onOriginY}) {
  const plan=setPlanFor(ex);const n=plan.length;
  // Si la journee est deja enregistree (doneSession), c'est la SOURCE DE VERITE - ne jamais se fier
  // au log local qui peut etre incomplet/absent (ex: seance corrigee manuellement en base).
  const savedEx=doneSession?(doneSession.exercises||[]).find(e=>e.id===ex.id):null;
  // Une journee deja enregistree (doneSession) est CLOSE: on ne compare plus le nombre de series
  // fait a un "n" devine (setPlanFor n'a pas le vrai nombre prescrit pour un objet resume) - la
  // presence dans le compte-rendu final = termine, point final. Evite un faux "incomplet" permanent.
  // On compte les series REELLEMENT enregistrees (balayage par prefixe) au lieu de tester les
  // indices 0..n-1 : le lecteur de circuit numerote par TOURS DU BLOC, pas par series prescrites
  // de l'exercice, et en EMOM/AMRAP le nombre de tours depasse souvent le prescrit.
  const target=(ex.groupTours>0)?ex.groupTours:n;
  const loggedDone=Object.keys(log||{}).reduce((c,k)=>(k.indexOf(`${sDate}_${ex.id}_s`)===0&&log[k]&&log[k].done)?c+1:c,0);
  const completed=savedEx?n:Math.min(loggedDone,target);
  const allDone=savedEx?true:(target>0&&loggedDone>=target);
  // Pour une seance enregistree, les charges affichees sont celles REELLEMENT faites
  // (setsDetail), pas la rampe theorique 70%->100% que fabrique setPlanFor.
  const sd=(savedEx&&Array.isArray(savedEx.setsDetail)&&savedEx.setsDetail.length)?savedEx.setsDetail:null;
  // Sans detail serie par serie (seances anterieures au S5), la charge enregistree reste un
  // FAIT unique : on l'affiche telle quelle. La rampe 70%->100% de setPlanFor est une
  // prescription, elle n'a rien a faire sur une seance deja realisee.
  const ws=sd?sd.map(x=>Number(x.weight)||0)
    :(savedEx&&Number(savedEx.weight)>0?[Number(savedEx.weight)]:null);
  const w0=ws?ws[0]:plan[0].w, wn=ws?ws[ws.length-1]:plan[n-1].w;
  const wlabel=w0>0?(w0===wn?`${w0} kg`:`${w0}→${wn} kg`):"PdC";
  const restLbl=ex.rest>0?(ex.rest>=60?fmtMSS(ex.rest):`${ex.rest}s`):null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,background:C.s1,borderRadius:14,padding:"12px 14px",marginBottom:10,border:`1px solid ${allDone?C.green:C.s3}`,animation:`fadeSlideIn 280ms ${EO} ${idx*35}ms both`}}>
      <Tap onTap={(e)=>{
        // On note la position verticale de la carte avant d'ouvrir : l'ecran plein
        // s'agrandira depuis cet endroit plutot que depuis le centre.
        try{ const r=e&&e.currentTarget&&e.currentTarget.getBoundingClientRect&&e.currentTarget.getBoundingClientRect();
             if(r&&onOriginY) onOriginY(Math.max(0,Math.min(100,Math.round((r.top+r.height/2)/window.innerHeight*100)))); }catch(_e){}
        onOpen&&onOpen();
      }} style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:allDone?C.greenDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {allDone?(
            <span style={{fontSize:18,fontWeight:700,color:C.green}}>✓</span>
          ):(
            <svg width="22" height="22" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="9" fill="none" stroke={C.s3} strokeWidth="2.5"/>
              {completed>0&&<circle cx="11" cy="11" r="9" fill="none" stroke={C.ink3} strokeWidth="2.5" strokeDasharray={`${(completed/n)*56.5} 56.5`} strokeLinecap="round" transform="rotate(-90 11 11)"/>}
            </svg>
          )}
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

function ExerciseFocus({ex,dayIdx,sDate,log,onLogSet,onClose,onNext,hasNext,idx,count,onDetail,lastPerf,originY}) {
  // Fermeture animee : le composant reste monte le temps de l'animation de sortie, sinon
  // l'ecran disparaissait d'un coup et on perdait le lien avec la liste d'ou l'on venait.
  const [closing,setClosing]=useState(false);
  const leave=useCallback((after)=>{setClosing(true);setTimeout(()=>{(after||onClose)();},200);},[onClose]);
  const plan=setPlanFor(ex);const n=plan.length;
  const lk=`${sDate}_${ex.id}`;
  const [done,setDone]=useState(()=>plan.map((_,i)=>!!(log[`${lk}_s${i}`]&&log[`${lk}_s${i}`].done)));
  // Charge et reps ajustables serie par serie, initialisees sur ce qui est deja enregistre
  // pour cette date puis sur le prescrit. Le prescrit n'est qu'une proposition : sans ce
  // reglage, aucune montee en charge reelle ne pouvait etre enregistree.
  const [loads,setLoads]=useState(()=>plan.map((s,i)=>{const e=log[`${lk}_s${i}`];return (e&&e.weight!=null)?Number(e.weight):Number(s.w)||0;}));
  const [reps,setReps]=useState(()=>plan.map((s,i)=>{const e=log[`${lk}_s${i}`];return (e&&e.reps!=null)?Number(e.reps):(repsNum(s.reps)||repsNum(ex.reps)||8);}));
  // RPE ressenti pour CET exercice, demande une fois toutes les series faites.
  const [rpeVal,setRpeVal]=useState(()=>{const e=log[`${lk}_rpe`];return e&&e.rpe?Number(e.rpe):null;});
  const [resting,setResting]=useState(0);
  const [restTotal,setRestTotal]=useState(0);
  const restRef=useRef(null);
  const scRef=useRef(null);
  useEffect(()=>()=>clearInterval(restRef.current),[]);
  useEffect(()=>{ if(scRef.current) scRef.current.scrollTop=0; window.scrollTo&&window.scrollTo(0,0); },[ex.id]);
  const restLeft=useRef(0);
  const startRest=(s)=>{
    clearInterval(restRef.current); setRestTotal(s); setResting(s); restLeft.current=s;
    restRef.current=setInterval(()=>{
      const nx=restLeft.current-1; restLeft.current=nx;
      if(nx<=0){clearInterval(restRef.current);setResting(0);signalRestOver();return;}
      signalCountdown(nx); setResting(nx);
    },1000);
  };
  const skipRest=()=>{clearInterval(restRef.current);setResting(0);};
  const cur=done.findIndex(d=>!d);
  const allDone=cur===-1;
  const validate=()=>{
    if(allDone||resting>0) return;
    const i=cur;
    // On enregistre la charge et les reps REELLEMENT faites, pas le prescrit.
    onLogSet(`${lk}_s${i}`,{done:true,weight:loads[i],reps:reps[i],date:todayKey()});
    play("clic"); buzz(18);
    setDone(d=>d.map((v,j)=>j===i?true:v));
    // La charge de la serie suivante part de celle qu'on vient de faire : on ne
    // retombe pas sur le prescrit apres un ajustement.
    if(i<n-1) setLoads(l=>l.map((v,j)=>j===i+1&&!done[j]?loads[i]:v));
    if(i<n-1&&ex.rest>0) startRest(ex.rest);
  };
  // ─── "Une chose a la fois" ─────────────────────────────────────────────────
  // L'ecran ne montre que l'action en cours : cette serie, ou ce repos. Le reste
  // de la seance reste dans la liste, en arriere. La liste de toutes les series
  // empilees demandait de chercher sa ligne entre deux efforts et offrait des
  // cibles etroites; ici il n'y a qu'un geste possible a chaque instant.
  const dots=(
    <div style={{display:"flex",gap:6,justifyContent:"center"}}>
      {plan.map((_,i)=>(
        <div key={i} style={{width:done[i]?9:7,height:done[i]?9:7,borderRadius:"50%",
          background:done[i]?C.green:(i===cur?C.ink4:C.s4),transition:`all 200ms ${EO}`,
          animation:done[i]?`popIn 260ms ${EO} both`:"none"}}/>
      ))}
    </div>
  );
  const step=(lbl,act)=>(
    <Tap onTap={act} style={{width:52,height:52,borderRadius:14,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontSize:20,fontWeight:600,color:C.ink2}}>{lbl}</span>
    </Tap>
  );
  const curLoad=loads[cur>=0?cur:0]||0;
  const curReps=reps[cur>=0?cur:0]||0;
  const prevIdx=cur-1;
  const restPct=restTotal>0?(restTotal-resting)/restTotal:0;
  const RING=54,CIRC=2*Math.PI*RING;
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",alignItems:"center",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)",
      // L'ecran s'ouvre depuis la HAUTEUR de la carte touchee : on comprend d'ou l'on vient.
      transformOrigin:`50% ${originY!=null?originY:50}%`,
      animation:closing?`sheetOut 200ms ${EO} both`:`sheetIn ${DUR.modal} ${ED} both`}}>
    <div style={{width:"100%",maxWidth:600,display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px"}}>
        <Tap onTap={()=>leave()} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:20,color:C.ink3}}>‹</span></Tap>
        <div style={{textAlign:"center",minWidth:0,flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Exercice {idx+1}/{count}</div>
        </div>
        <Tap onTap={()=>onDetail&&onDetail(ex)} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:700,color:C.blue}}>i</span></Tap>
      </div>

      <div ref={scRef} key={resting>0?"rest":allDone?"done":`set${cur}`}
        style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",padding:"0 20px 20px",WebkitOverflowScrolling:"touch",animation:`stateIn 260ms ${EO} both`}}>

        {/* REPOS — il occupe l'ecran au lieu de se cacher sous la liste : on ne l'ecourte plus par distraction */}
        {resting>0?(
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:22,padding:"20px 0"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",animation:`dropIn 240ms ${EO} both`}}>Récupération</div>
            <div style={{position:"relative",width:132,height:132,animation:`riseIn 300ms ${EO} 60ms both`}}>
              <svg width="132" height="132" viewBox="0 0 132 132" style={{transform:"rotate(-90deg)"}}>
                <circle cx="66" cy="66" r={RING} fill="none" stroke={C.s2} strokeWidth="9"/>
                <circle cx="66" cy="66" r={RING} fill="none" stroke={C.green} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC*restPct} style={{transition:`stroke-dashoffset 900ms linear`}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:34,fontWeight:700,color:C.ink,letterSpacing:"-.03em",fontVariantNumeric:"tabular-nums"}}>{fmtMSS(resting)}</span>
              </div>
            </div>
            <div style={{textAlign:"center",animation:`riseIn 300ms ${EO} 140ms both`}}>
              <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>Ensuite</div>
              <div style={{fontSize:18,fontWeight:700,color:C.ink}}>Série {cur+1} · {curLoad>0?`${curLoad} kg`:"Poids du corps"} × {curReps}</div>
            </div>
            <Tap onTap={skipRest} style={{padding:"15px 26px",borderRadius:14,background:C.s2}}>
              <span style={{fontSize:16,fontWeight:600,color:C.ink2}}>Passer le repos</span>
            </Tap>
          </div>
        ):allDone?(
          /* EXERCICE TERMINE — la montee en charge se lit d'un coup d'oeil */
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",gap:20,padding:"20px 0"}}>
            <div style={{textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:C.green,margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:26,fontWeight:700,color:"#000"}}>✓</span>
              </div>
              <div style={{fontSize:24,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>{ex.n}</div>
              <div style={{fontSize:14,color:C.ink4,marginTop:5}}>{n} séries terminées</div>
            </div>
            <div style={{background:C.s1,borderRadius:16,padding:"14px 16px",display:"flex",flexDirection:"column",gap:7}}>
              {plan.map((_,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,color:C.ink4}}>Série {i+1}</span>
                  <span style={{fontSize:15,fontWeight:600,color:C.ink,fontVariantNumeric:"tabular-nums"}}>{loads[i]>0?`${loads[i]} kg`:"PdC"} × {reps[i]}</span>
                </div>
              ))}
            </div>
            {/* Le RPE est la seule donnee que l'application ne pouvait pas deduire, et c'est
                celle qui determine la charge de la prochaine seance. Demande une fois, ici. */}
            <div>
              <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10,textAlign:"center"}}>Difficulté ressentie</div>
              <div style={{display:"flex",gap:7}}>
                {[6,7,8,9,10].map(v=>{
                  const on=rpeVal===v;
                  return (
                    <Tap key={v} onTap={()=>{setRpeVal(v);onLogSet(`${lk}_rpe`,{rpe:v,date:todayKey()});play("clic");}}
                      style={{flex:1,padding:"14px 0",borderRadius:13,background:on?C.blue:C.s1,border:`1px solid ${on?C.blue:C.s3}`,display:"flex",alignItems:"center",justifyContent:"center",transition:`all 160ms ${EO}`}}>
                      <span style={{fontSize:17,fontWeight:700,color:on?"#000":C.ink3}}>{v}</span>
                    </Tap>
                  );
                })}
              </div>
              <div style={{fontSize:12,color:rpeVal?C.ink3:C.ink4,marginTop:9,textAlign:"center",minHeight:17}}>
                {rpeVal?RPE_LABEL[rpeVal]:"Combien de répétitions te restait-il ?"}
              </div>
            </div>
            <div>
              <Tap onTap={()=>leave()} style={{padding:"18px",borderRadius:16,background:C.green,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:17,fontWeight:700,color:"#000"}}>Retour à la liste</span>
              </Tap>
              {hasNext&&<Tap onTap={()=>leave(onNext)} style={{marginTop:10,padding:"15px",borderRadius:14,background:"transparent",border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Enchaîner sur le suivant →</span>
              </Tap>}
            </div>
          </div>
        ):(
          /* SERIE EN COURS — une seule serie a l'ecran, ajustable avant validation */
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:18,paddingTop:4}}>
            <div>
              <div style={{fontSize:26,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.15}}>{ex.n}</div>
              <div style={{fontSize:14,color:C.ink4,marginTop:5}}>{ex.m}{ex.cue?` · ${ex.cue}`:""}</div>
            </div>
            <div style={{textAlign:"center",padding:"6px 0"}}>
              <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>Série {cur+1} sur {n}</div>
              <div style={{fontSize:64,fontWeight:700,color:C.ink,letterSpacing:"-.04em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>
                {curLoad>0?curLoad:"PdC"}{curLoad>0&&<span style={{fontSize:24,fontWeight:600,color:C.ink3}}> kg</span>}
              </div>
              <div style={{fontSize:17,color:C.ink3,marginTop:8,fontVariantNumeric:"tabular-nums"}}>× {curReps} reps{ex.rpe?` · RPE ${ex.rpe}`:""}</div>
            </div>
            {/* Ajustement avant validation : la charge reelle differe souvent du prescrit,
                et c'est la seule facon d'enregistrer une vraie montee en charge. */}
            <div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"center"}}>
              {step("−",()=>setLoads(l=>l.map((v,i)=>i===cur?Math.max(0,Math.round((v-2.5)*10)/10):v)))}
              <span style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",width:56,textAlign:"center"}}>Charge</span>
              {step("+",()=>setLoads(l=>l.map((v,i)=>i===cur?Math.round((v+2.5)*10)/10:v)))}
              <div style={{width:14}}/>
              {step("−",()=>setReps(r=>r.map((v,i)=>i===cur?Math.max(1,v-1):v)))}
              <span style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",width:56,textAlign:"center"}}>Reps</span>
              {step("+",()=>setReps(r=>r.map((v,i)=>i===cur?v+1:v)))}
            </div>
            {prevIdx<0&&lastPerf&&lastPerf.kg>0&&(
              <div style={{background:C.s1,borderRadius:14,padding:"12px 15px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,color:C.ink4}}>La dernière fois</span>
                <span style={{fontSize:15,fontWeight:600,color:C.ink,fontVariantNumeric:"tabular-nums"}}>
                  {lastPerf.kg} kg{lastPerf.rpe?` · RPE ${lastPerf.rpe}`:""}
                  {curLoad>lastPerf.kg?<span style={{color:C.green}}> → +{Math.round((curLoad-lastPerf.kg)*10)/10} kg</span>:null}
                </span>
              </div>
            )}
            {prevIdx>=0&&(
              <div style={{background:C.s1,borderRadius:14,padding:"12px 15px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:13,color:C.ink4}}>Série précédente</span>
                <span style={{fontSize:15,fontWeight:600,color:C.ink,fontVariantNumeric:"tabular-nums"}}>{loads[prevIdx]>0?`${loads[prevIdx]} kg`:"PdC"} × {reps[prevIdx]}</span>
              </div>
            )}
            <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:16}}>
              {dots}
              <Tap onTap={validate} style={{padding:"20px",borderRadius:16,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:18,fontWeight:700,color:"#000"}}>Valider la série {cur+1}</span>
              </Tap>
            </div>
          </div>
        )}
      </div>
    </div>
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
function SessionReport({session,sessions,trainingDaysPerWeek,photoUrl,onClose,onDelete}) {
  if(!session) return null;
  const{totalKg=0,totalSets=0,duration=0,exercises=[],date="",dayLabel="",feedback,sessionIndex=0}=session;
  const score=computeScore(totalKg,totalSets,feedback,targetOf(session));
  const photo=photoUrl||null;
  const animScore=useCountUp(score,1200);
  const animKg=useCountUp(Math.round(totalKg/1000*10)/10*10,1400);
  const animSets=useCountUp(totalSets,1000);
  const newPBs=useMemo(()=>{
    const prior=(sessions||[]).filter(s=>s.date<date);
    const priorBest=computePBs(prior);
    const priorMap={};priorBest.forEach(pb=>{priorMap[pb.id]=pb.pbKg;});
    return (exercises||[]).filter(e=>e&&e.id&&e.completedSets>0&&e.weight>0&&e.weight>(priorMap[e.id]||0));
  },[sessions,date,exercises]);
  const newBadges=useMemo(()=>{
    const prior=(sessions||[]).filter(s=>s.date<date);
    const before=computeBadges(prior);
    const after=computeBadges([...prior,session]);
    return after.filter((b,i)=>b.ok&&!before[i].ok);
  },[sessions,date,session]);
  const milestoneReached=useMemo(()=>{
    if(!sessionIndex) return null;
    const tdpw=trainingDaysPerWeek||5;
    const blocks=phaseBlocksList();
    const weekBefore=Math.floor((sessionIndex-1)/tdpw)+1;
    const weekAfter=Math.floor(sessionIndex/tdpw)+1;
    const phaseOfWeek=(w)=>{const b=blocks.find(bl=>w<=bl.endWeek);return b?b.name:blocks[blocks.length-1].name;};
    const before=phaseOfWeek(weekBefore),after=phaseOfWeek(weekAfter);
    return before!==after?after:null;
  },[sessionIndex,trainingDaysPerWeek]);
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
        {newPBs.length>0&&(
          <div style={{margin:"0 24px 20px",padding:"16px 18px",borderRadius:16,background:C.blueDim,border:`1px solid ${C.blue}`,animation:`fadeUp 500ms ${EO} both`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0 2 4"/><path d="M17 6h3a2 2 0 0 1-2 4"/></svg>
              <span style={{fontSize:14,fontWeight:700,color:C.ink}}>{newPBs.length>1?`${newPBs.length} nouveaux records`:"Nouveau record"} 🎉</span>
            </div>
            {newPBs.map((e,i)=>(<div key={e.id||i} style={{fontSize:13,color:C.ink2,padding:"3px 0"}}>{e.n} <span style={{fontWeight:700}}>{e.weight}kg</span></div>))}
          </div>
        )}
        {newBadges.length>0&&(
          <div style={{margin:"0 24px 20px",padding:"16px 18px",borderRadius:16,background:C.s1,border:`1px solid ${C.s3}`,animation:`fadeUp 550ms ${EO} both`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M8.5 13 7 21l5-3 5 3-1.5-8"/></svg>
              <span style={{fontSize:14,fontWeight:700,color:C.ink}}>{newBadges.length>1?`${newBadges.length} nouveaux badges`:"Nouveau badge"} 🎉</span>
            </div>
            {newBadges.map((b,i)=>(<div key={i} style={{fontSize:13,color:C.ink2,padding:"3px 0"}}><span style={{fontWeight:700}}>{b.t}</span> · {b.d}</div>))}
          </div>
        )}
        {milestoneReached&&(
          <div style={{margin:"0 24px 20px",padding:"16px 18px",borderRadius:16,background:C.blueDim,border:`1px solid ${C.blue}`,animation:`fadeUp 600ms ${EO} both`}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></svg>
              <span style={{fontSize:14,fontWeight:700,color:C.ink}}>Nouveau palier : {milestoneReached} 🎉</span>
            </div>
          </div>
        )}
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
                  {/* Montee en charge de la seance : la charge max seule ne disait pas si les
                      series avaient ete montees progressivement ou faites a poids constant. */}
                  {(()=>{
                    const sd=Array.isArray(ex.setsDetail)?ex.setsDetail:[];
                    if(sd.length<2) return null;
                    const ws=sd.map(s=>Number(s.weight)||0);
                    const monte=ws.some(w=>w!==ws[0]);
                    return(
                      <div style={{fontSize:12,color:monte?C.blue:C.ink4,marginTop:3,fontVariantNumeric:"tabular-nums"}}>
                        {monte?`${ws.join(" → ")} kg`:`${sd.length} × ${sd[0].reps} reps`}
                      </div>
                    );
                  })()}
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
// Lundi de la semaine d'une date : sert de cle de semaine pour la pesee.
const mondayOf=(d)=>{const t=(typeof d==="string")?new Date(d+"T00:00:00"):new Date(d);const dow=(t.getDay()+6)%7;t.setDate(t.getDate()-dow);return localDateKey(t);};

// Pesee de debut de semaine. Proposee tant qu'aucune pesee n'existe pour la semaine en
// cours : on ne rate pas le suivi parce qu'on a ouvert l'app un mardi.
function WeighInCard({weighIns,onSave}) {
  const wk=mondayOf(new Date());
  const done=(weighIns||[]).find(w=>mondayOf(w.date)===wk);
  const last=(weighIns||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).pop();
  const [val,setVal]=useState(()=>done?String(done.weight_kg):(last?String(last.weight_kg):""));
  // La condition etait "done && !saved" : apres enregistrement, saved passait a true et la
  // confirmation etait donc SAUTEE, le formulaire se reaffichait comme si rien ne s'etait
  // passe. Une pesee enregistree s'affiche desormais comme telle, point.
  const prev=(weighIns||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).filter(w=>mondayOf(w.date)!==wk).pop();
  if(done) {
    const delta=prev?Math.round((Number(done.weight_kg)-Number(prev.weight_kg))*10)/10:null;
    return (
      <div style={{background:C.s1,borderRadius:16,padding:"14px 16px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <div>
          <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Poids de la semaine</div>
          <div style={{fontSize:13,color:C.ink3,marginTop:3}}>
            Enregistrée le {fmtDateShort(done.date)}
            {delta!==null&&delta!==0&&<span style={{color:C.ink4}}> · {delta>0?"+":""}{delta} kg vs semaine précédente</span>}
          </div>
        </div>
        <span style={{fontSize:22,fontWeight:700,color:C.ink,fontVariantNumeric:"tabular-nums"}}>{Number(done.weight_kg)} kg</span>
      </div>
    );
  }
  return (
    <div style={{background:C.s1,borderRadius:16,padding:"16px",marginBottom:12,animation:`riseIn 320ms ${EO} both`}}>
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Pesée de la semaine</div>
      <div style={{fontSize:13,color:C.ink3,marginBottom:12}}>Une fois par semaine suffit — de préférence le lundi, à jeun.</div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <input type="number" inputMode="decimal" step="0.1" value={val} onChange={e=>setVal(e.target.value)} placeholder="kg"
          style={{flex:1,height:48,borderRadius:12,border:`1px solid ${C.s4}`,background:C.bg,color:C.ink,fontSize:17,fontWeight:600,fontFamily:F,padding:"0 14px",outline:"none",boxSizing:"border-box"}}/>
        <Tap onTap={()=>{const n=parseFloat(String(val).replace(",","."));if(!(n>20&&n<300))return;onSave(n);play("cloche");buzz(40);}}
          style={{padding:"0 22px",height:48,borderRadius:12,background:C.blue,display:"flex",alignItems:"center"}}>
          <span style={{fontSize:16,fontWeight:700,color:"#000"}}>Enregistrer</span>
        </Tap>
      </div>
    </div>
  );
}

// Courbe de poids : trace simple, sans bibliotheque, avec la tendance chiffree.
function WeightChart({weighIns,accent}) {
  const pts=(weighIns||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)))
    .map(w=>({d:w.date,v:Number(w.weight_kg)})).filter(x=>x.v>0);
  if(pts.length<2) return (
    <div style={{background:C.s1,borderRadius:16,padding:"18px",marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:4}}>Progression du poids</div>
      <div style={{fontSize:13,color:C.ink4}}>Une deuxième pesée et la courbe apparaît.</div>
    </div>
  );
  const W=600,H=140,PAD=8;
  const vs=pts.map(p=>p.v);
  const min=Math.min(...vs),max=Math.max(...vs);
  const span=(max-min)||1;
  const x=(i)=>PAD+(i/(pts.length-1))*(W-PAD*2);
  const y=(v)=>PAD+(1-(v-min)/span)*(H-PAD*2);
  const line=pts.map((p,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const area=`${line} L${x(pts.length-1).toFixed(1)},${H} L${x(0).toFixed(1)},${H} Z`;
  const first=pts[0].v,lastV=pts[pts.length-1].v,delta=Math.round((lastV-first)*10)/10;
  return (
    <div style={{background:C.s1,borderRadius:16,padding:"18px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}}>
        <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Progression du poids</span>
        <span style={{fontSize:20,fontWeight:700,color:C.ink,fontVariantNumeric:"tabular-nums"}}>{lastV} kg</span>
      </div>
      <div style={{fontSize:12,color:C.ink4,marginBottom:12}}>
        {pts.length} pesées · {delta===0?"stable":`${delta>0?"+":""}${delta} kg`} depuis {fmtDateShort(pts[0].d)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{display:"block",overflow:"visible"}}>
        <path d={area} fill={C.greenDim}/>
        <path d={line} fill="none" stroke={accent||C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={x(pts.length-1)} cy={y(lastV)} r="4.5" fill={accent||C.green}/>
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.ink4,marginTop:8,fontVariantNumeric:"tabular-nums"}}>
        <span>{fmtDateShort(pts[0].d)} · {first} kg</span>
        <span>{fmtDateShort(pts[pts.length-1].d)}</span>
      </div>
    </div>
  );
}

function WeekSummary({sessions,accent,trainingDaysPerWeek}) {
  const days=["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
  const today=new Date();
  const dow=today.getDay()===0?6:today.getDay()-1;
  const weekDates=Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-dow+i);return localDateKey(d);});
  const thisWeek=sessions.filter(s=>weekDates.includes(s.date));
  const weekVol=thisWeek.reduce((a,s)=>a+(s.totalKg||0),0);
  // Temps d'entrainement cumule de la semaine : le volume seul ne dit rien de la charge
  // de travail reelle d'une semaine ou les seances sont courtes et denses.
  const weekMin=Math.round(thisWeek.reduce((a,s)=>a+(Number(s.duration)||0),0)/60);
  const weekTime=weekMin>=60?`${Math.floor(weekMin/60)}h${String(weekMin%60).padStart(2,"0")}`:`${weekMin}`;
  const target=trainingDaysPerWeek||5;
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
        <div><div style={{fontSize:22,fontWeight:700,color:C.ink}}>{thisWeek.length}<span style={{fontSize:13,fontWeight:400,color:C.ink4}}>/{target}</span></div><div style={{fontSize:11,color:C.ink4}}>Séances</div></div>
        {weekVol>0&&<div><div style={{fontSize:22,fontWeight:700,color:C.ink}}>{Math.round(weekVol/1000*10)/10}<span style={{fontSize:13,fontWeight:400,color:C.ink4}}>t</span></div><div style={{fontSize:11,color:C.ink4}}>Volume</div></div>}
        {weekMin>0&&<div><div style={{fontSize:22,fontWeight:700,color:C.ink}}>{weekTime}<span style={{fontSize:13,fontWeight:400,color:C.ink4}}>{weekMin>=60?"":"min"}</span></div><div style={{fontSize:11,color:C.ink4}}>Temps</div></div>}
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
  const start=()=>{if(running||total<=0)return;setRunning(true);lastMinRef.current=Math.floor(elapsed/60);const md=mode,tt=total;ref.current=setInterval(()=>{setElapsed(p=>{const n=p+1;if(md==="emom"){const cm=Math.floor(n/60);if(cm!==lastMinRef.current&&n<tt){lastMinRef.current=cm;play("top");buzz(60);}}if(n>=tt){clearInterval(ref.current);setRunning(false);signalBlockOver();return tt;}return n;});},1000);};
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
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",alignItems:"center",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
    <div style={{width:"100%",maxWidth:600,display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
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
    </div>
  );
}

function SkillsOctagon({sessions,profile}) {
  const axes=useMemo(()=>{
    const clamp=v=>Math.max(4,Math.min(100,Math.round(v)));
    if(!sessions||!sessions.length) return null;
    // Les seances arrivent par date DECROISSANTE. L'ancien calcul de progression comparait
    // la moitie recente a la moitie ancienne dans cet ordre, donc a l'envers : progresser
    // affichait une baisse. On travaille ici sur une copie triee du plus ancien au plus recent.
    const ord=sessions.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const bw=Number(profile&&profile.weight_kg)||75;

    let maxRatio=0,totalKg=0,totalSets=0,rpeSum=0,rpeCnt=0,denseSets=0,powerSets=0,allSets=0;
    const patterns={};
    ord.forEach(s=>{
      totalKg+=s.totalKg||0; totalSets+=s.totalSets||0;
      const metcon=(s.mode==="amrap"||s.mode==="emom");
      (s.exercises||[]).forEach(e=>{
        if(!e) return;
        const cs=Number(e.completedSets)||0;
        allSets+=cs;
        if(metcon||e.groupType) denseSets+=cs;
        const meta=metaOf(e);
        if(meta.pattern) patterns[meta.pattern]=(patterns[meta.pattern]||0)+cs;
        if(meta.pattern==="hinge"||meta.pattern==="squat") powerSets+=cs;
        const w=Number(e.weight)||0;
        if(w>0&&meta.tier!=="isolation"){ const r=w/bw; if(r>maxRatio) maxRatio=r; }
        // Le RPE est desormais reellement collecte : il vaut mieux que le ressenti global.
        if(e.rpe!=null){ rpeSum+=Number(e.rpe); rpeCnt++; }
      });
      if(!rpeCnt){ const fb=s.feedback; if(fb&&fb.global){ rpeSum+=Number(fb.global)*2; rpeCnt++; } }
    });

    // Force : charge relative au poids de corps, pas une charge absolue divisee par 1,5.
    const force=clamp(maxRatio/1.5*100);
    const volume=clamp(totalKg/30000*100);
    // Endurance : part du travail fait en densite (metcon, superset), et non un total de series.
    const endurance=clamp(allSets?denseSets/allSets*130:0);
    // Regularite : plus longue serie de semaines consecutives - meme mesure que les badges,
    // et non plus un simple comptage de seances qui doublonnait avec l'assiduite.
    const regularite=clamp(longestWeekStreak(ord)/12*100);
    const intensite=clamp(rpeCnt?(rpeSum/rpeCnt)/10*100:0);
    // Equilibre : couverture des patrons de mouvement. Rendu possible par la classification
    // du catalogue, et impossible a mesurer auparavant.
    const covered=Object.keys(patterns).filter(k=>patterns[k]>0).length;
    const equilibre=clamp(covered/8*100);
    const explosivite=clamp(allSets?powerSets/allSets*200:0);
    let prog=50;
    if(ord.length>=4){
      const h=Math.floor(ord.length/2);
      const oldH=ord.slice(0,h),newH=ord.slice(h);
      const avgOld=(oldH.reduce((x,s)=>x+(s.totalKg||0),0)/oldH.length)||1;
      const avgNew=newH.reduce((x,s)=>x+(s.totalKg||0),0)/newH.length;
      prog=clamp(50+(avgNew-avgOld)/avgOld*100);
    }
    return [["Force",force],["Volume",volume],["Endurance",endurance],["Régularité",regularite],
            ["Intensité",intensite],["Progression",prog],["Équilibre",equilibre],["Explosivité",explosivite]];
  },[sessions,profile]);
  if(!axes) return null;
  const cx=150,cy=150,R=92;
  const pt=(i,r)=>{const a=(-90+i*45)*Math.PI/180;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  const poly=axes.map((ax,i)=>pt(i,ax[1]/100*R).join(",")).join(" ");
  const grid=[25,50,75,100].map(g=>axes.map((_,i)=>pt(i,g/100*R).join(",")).join(" "));
  return (
    <div style={{background:C.s1,borderRadius:16,padding:"20px",marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Octogone de compétences</div>
      <div style={{fontSize:13,color:C.ink4,marginBottom:4}}>Tes 8 qualités, calculées sur ton historique.</div>
      <svg viewBox="0 0 300 268" style={{width:"100%",height:"auto",display:"block"}}>
        {grid.map((g,i)=>(<polygon key={"g"+i} points={g} fill="none" stroke={C.s3} strokeWidth="1"/>))}
        {axes.map((_,i)=>{const[x,y]=pt(i,R);return <line key={"l"+i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.s3} strokeWidth="1"/>;})}
        <polygon points={poly} fill={C.blue} fillOpacity="0.25" stroke={C.blue} strokeWidth="2"/>
        {axes.map((ax,i)=>{const[x,y]=pt(i,ax[1]/100*R);return <circle key={"c"+i} cx={x} cy={y} r="3" fill={C.blue}/>;})}
        {axes.map((ax,i)=>{const[x,y]=pt(i,R+16);return <text key={"t"+i} x={x} y={y} fill={C.ink3} fontSize="11" fontWeight="600" textAnchor="middle" dominantBaseline="middle" fontFamily={F}>{ax[0]}</text>;})}
      </svg>
    </div>
  );
}

function StatsTab({sessions,weights,accent,onOpenPhotos,pinnedPBs,onManagePBs,activeSkills,onManageSkills,onOpenRewards,trainingDaysPerWeek,profile}) {
  const total=sessions.length,totalKg=sessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const avgScore=total?Math.round(sessions.reduce((a,s)=>a+computeScore(s.totalKg,s.totalSets,s.feedback,targetOf(s)),0)/total):0;
  const pbs=useMemo(()=>computePBs(sessions),[sessions]);
  const pinnedSet=new Set(pinnedPBs||[]);
  const displayedPBs=(pinnedPBs&&pinnedPBs.length)?pbs.filter(pb=>pinnedSet.has(pb.id)):pbs.slice(0,5);
  const volumeByWeek=useMemo(()=>{
    const weeks={};sessions.forEach(s=>{const w=s.date.slice(0,7);weeks[w]=(weeks[w]||0)+(s.totalKg||0);});
    return Object.entries(weeks).slice(-8).map(([w,v])=>({date:w.slice(5),v:Math.round(v/1000)}));
  },[sessions]);

  return(
    <div style={{padding:"20px 20px 16px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      
      <WeekSummary sessions={sessions} accent={accent} trainingDaysPerWeek={trainingDaysPerWeek}/>
      <SkillsOctagon sessions={sessions} profile={profile}/>
      {/* Hero card: volume total, mise en avant */}
      <div style={{background:C.blueDim,border:`1px solid ${C.blue}`,borderRadius:18,padding:"20px",marginBottom:10,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:44,height:44,borderRadius:12,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7v10"/><path d="M18 7v10"/><path d="M4 10v4"/><path d="M20 10v4"/><path d="M6 12h12"/></svg>
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em",marginBottom:2}}>Volume total soulevé</div>
          <div style={{fontSize:30,fontWeight:800,color:C.ink,letterSpacing:"-.02em"}}>{totalKg>0?`${(totalKg/1000).toFixed(1)} tonnes`:"—"}</div>
        </div>
      </div>
      {/* Metrics grid avec icones */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {l:"Séances",v:total,icon:(<><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></>)},
          {l:"Score moy.",v:avgScore||"—",icon:(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>)},
          {l:"Cette semaine",v:`${sessions.filter(s=>{const d=new Date();const dow=d.getDay()===0?6:d.getDay()-1;const wd=new Date(d);wd.setDate(d.getDate()-dow);return s.date>=localDateKey(wd);}).length}`,icon:(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M9 15l2 2 4-4"/></>)},
        ].map(({l,v,icon})=>(
          <div key={l} style={{background:C.s1,borderRadius:16,padding:"14px 10px",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:C.ink,letterSpacing:"-.02em"}}>{v}</div>
              <div style={{fontSize:10,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".06em",marginTop:2}}>{l}</div>
            </div>
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
      {/* Apprentissage */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Apprentissage</span>
        {onManageSkills&&<Tap onTap={onManageSkills} style={{padding:"6px 12px",borderRadius:980,background:C.s2}}><span style={{fontSize:12,fontWeight:600,color:C.ink3}}>Gérer ({(activeSkills||[]).length}/2) ›</span></Tap>}
      </div>
      {(!activeSkills||activeSkills.length===0)?(
        <div style={{textAlign:"center",padding:"24px 0",fontSize:14,color:C.ink4,marginBottom:16}}>Ajoute un mouvement à apprendre (muscle-up, pistol squat...).</div>
      ):(activeSkills.map(as=>{
        const sk=SKILLS_CATALOG.find(s=>s.id===as.skillId);
        if(!sk) return null;
        const step=sk.steps[as.stepIndex]||sk.steps[sk.steps.length-1];
        const pct=Math.round(((as.stepIndex)/sk.steps.length)*100);
        return(
          <div key={as.skillId} style={{background:C.s1,borderRadius:16,padding:"16px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{sk.icon}</svg>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:C.ink}}>{sk.name}</div>
                <div style={{fontSize:12,color:C.ink3}}>Étape {as.stepIndex+1}/{sk.steps.length} · {step.label}</div>
              </div>
            </div>
            <div style={{height:4,borderRadius:2,background:C.s2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:C.blue,borderRadius:2}}/></div>
          </div>
        );
      }))}
      {/* Personal Bests - vue compacte + gestion */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <span style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Personal Bests</span>
        {pbs.length>0&&onManagePBs&&<Tap onTap={onManagePBs} style={{padding:"6px 12px",borderRadius:980,background:C.s2}}><span style={{fontSize:12,fontWeight:600,color:C.ink3}}>Gérer ({(pinnedPBs||[]).length}/5) ›</span></Tap>}
      </div>
      {pbs.length===0?<div style={{textAlign:"center",padding:"32px 0",fontSize:15,color:C.ink4}}>Réalise des séances avec charges pour débloquer tes PB.</div>:
        displayedPBs.map((pb,i)=>(
          <div key={pb.id||i} style={{background:C.s1,borderRadius:14,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PBCAT_ICON[PBCAT[Array.isArray(pb.eq)?pb.eq[0]:pb.eq]]||PBCAT_ICON.Autre}</svg>
              <div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>{pb.n}</div><div style={{fontSize:13,color:C.ink3}}>{pb.m}</div></div>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:C.ink}}>{pb.pbKg===0?"BW":pb.pbKg+"kg"}</div>
          </div>
        ))}
      {(()=>{const B=computeBadges(sessions);const earned=B.filter(b=>b.ok).length;
      const cats=[...new Set(B.map(b=>b.cat))];
      return(
      <div style={{marginTop:24,background:C.s1,borderRadius:16,padding:"16px"}}>
        <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:12}}>
          <span style={{fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".15em"}}>Récompenses</span>
          {onOpenRewards&&<Tap onTap={onOpenRewards} style={{padding:"6px 12px",borderRadius:980,background:C.s2}}><span style={{fontSize:12,fontWeight:600,color:C.ink3}}>Voir tout ({earned}/{B.length}) ›</span></Tap>}
        </div>
        {cats.map(cat=>{
          const list=B.filter(b=>b.cat===cat);
          const earnedList=list.filter(b=>b.ok);
          const current=earnedList[earnedList.length-1];
          const next=list.find(b=>!b.ok);
          return(
            <div key={cat} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderTop:`1px solid ${C.s2}`}}>
              <span style={{fontSize:13,color:C.ink3}}>{cat}</span>
              <span style={{fontSize:13,fontWeight:700,color:current?C.ink:C.ink4}}>{current?current.t:(next?`prochain : ${next.t}`:"—")}</span>
            </div>
          );
        })}
      </div>
    );})()}
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function PBManagerSheet({sessions,pinnedPBs,onSave,onClose}) {
  const pbs=useMemo(()=>computePBs(sessions),[sessions]);
  const [sel,setSel]=useState(pinnedPBs||[]);
  const toggle=(id)=>{
    setSel(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id);
      if(prev.length>=5) return prev;
      return [...prev,id];
    });
  };
  const groups={};pbs.forEach(pb=>{const eqc=Array.isArray(pb.eq)?pb.eq[0]:pb.eq;const k=PBCAT[eqc]||"Autre";(groups[k]=groups[k]||[]).push(pb);});
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,height:"100dvh",maxHeight:"100dvh",background:C.bg,zIndex:Z.fullscreen,overflowY:"auto",WebkitOverflowScrolling:"touch",fontFamily:F,paddingTop:"env(safe-area-inset-top)",boxSizing:"border-box"}}>
      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 20px calc(20px + env(safe-area-inset-bottom))"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>Mes Personal Bests</span>
          <Tap onTap={onClose} style={{width:36,height:36,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
        </div>
        <div style={{fontSize:13,color:C.ink4,marginBottom:20}}>Choisis jusqu'à 5 PB à afficher sur ta page Stats. ({sel.length}/5)</div>
        {Object.keys(groups).map(cat=>(
          <div key={cat} style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PBCAT_ICON[cat]||PBCAT_ICON.Autre}</svg>
              <span style={{fontSize:11,fontWeight:700,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{cat}</span>
            </div>
            {groups[cat].map(pb=>{
              const on=sel.includes(pb.id);
              const disabled=!on&&sel.length>=5;
              return(
                <Tap key={pb.id} onTap={()=>!disabled&&toggle(pb.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s1,borderRadius:14,padding:"14px 16px",marginBottom:8,opacity:disabled?0.4:1}}>
                  <div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>{pb.n}</div><div style={{fontSize:13,color:C.ink3}}>{pb.pbKg===0?"BW":pb.pbKg+"kg"}</div></div>
                  <div style={{width:44,height:26,borderRadius:980,background:on?C.blue:C.s3,position:"relative",transition:`background 150ms ${EO}`,flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:on?20:2,width:22,height:22,borderRadius:"50%",background:"#fff",transition:`left 150ms ${EO}`}}/>
                  </div>
                </Tap>
              );
            })}
          </div>
        ))}
        <Tap onTap={()=>{onSave(sel);onClose();}} style={{marginTop:8,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:16,fontWeight:700,color:"#000"}}>Enregistrer</span>
        </Tap>
      </div>
    </div>
  );
}

function RewardsManagerSheet({sessions,onClose}) {
  const B=useMemo(()=>computeBadges(sessions),[sessions]);
  const earned=B.filter(b=>b.ok).length;
  const cats=[...new Set(B.map(b=>b.cat))];
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,height:"100dvh",maxHeight:"100dvh",background:C.bg,zIndex:Z.fullscreen,overflowY:"auto",WebkitOverflowScrolling:"touch",fontFamily:F,paddingTop:"env(safe-area-inset-top)",boxSizing:"border-box"}}>
      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 20px calc(20px + env(safe-area-inset-bottom))"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>Récompenses</span>
          <Tap onTap={onClose} style={{width:36,height:36,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
        </div>
        <div style={{fontSize:13,color:C.ink4,marginBottom:20}}>{earned}/{B.length} paliers débloqués.</div>
        {cats.map(cat=>{
          const list=B.filter(b=>b.cat===cat);
          const catEarned=list.filter(b=>b.ok).length;
          return(
            <div key={cat} style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>{cat}</span>
                <span style={{fontSize:12,color:C.ink4}}>{catEarned}/{list.length}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {list.map((b,i)=>(<span key={i} style={{padding:"7px 12px",borderRadius:980,background:b.ok?C.blue:C.s2,fontSize:12,fontWeight:600,color:b.ok?"#000":C.ink4}}>{b.t}</span>))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function SkillManagerSheet({activeSkills,onSave,onClose}) {
  const [sel,setSel]=useState((activeSkills||[]).map(s=>s.skillId));
  const toggle=(id)=>{
    setSel(prev=>{
      if(prev.includes(id)) return prev.filter(x=>x!==id);
      if(prev.length>=2) return prev;
      return [...prev,id];
    });
  };
  const save=()=>{
    const next=sel.map(id=>{
      const existing=(activeSkills||[]).find(s=>s.skillId===id);
      return existing||{skillId:id,stepIndex:0,successCount:0};
    });
    onSave(next);
    onClose();
  };
  return(
    <div style={{position:"fixed",top:0,left:0,right:0,height:"100dvh",maxHeight:"100dvh",background:C.bg,zIndex:Z.fullscreen,overflowY:"auto",WebkitOverflowScrolling:"touch",fontFamily:F,paddingTop:"env(safe-area-inset-top)",boxSizing:"border-box"}}>
      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 20px calc(20px + env(safe-area-inset-bottom))"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>Apprentissage</span>
          <Tap onTap={onClose} style={{width:36,height:36,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
        </div>
        <div style={{fontSize:13,color:C.ink4,marginBottom:20}}>Choisis jusqu'à 2 mouvements à travailler. Un mini-bloc apparaîtra après l'échauffement, environ une séance sur deux. ({sel.length}/2)</div>
        {SKILLS_CATALOG.map(sk=>{
          const on=sel.includes(sk.id);
          const disabled=!on&&sel.length>=2;
          const existing=(activeSkills||[]).find(s=>s.skillId===sk.id);
          const stepIdx=existing?existing.stepIndex:0;
          return(
            <Tap key={sk.id} onTap={()=>!disabled&&toggle(sk.id)} style={{display:"flex",alignItems:"center",gap:12,background:C.s1,borderRadius:14,padding:"14px 16px",marginBottom:8,opacity:disabled?0.4:1,border:`1.5px solid ${on?C.blue:"transparent"}`}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{sk.icon}</svg>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{sk.name}</div>
                <div style={{fontSize:12,color:C.ink3}}>{existing?`Étape ${stepIdx+1}/${sk.steps.length}`:`${sk.steps.length} étapes`}</div>
              </div>
              <div style={{width:24,height:24,borderRadius:"50%",background:on?C.blue:C.s3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{on&&<span style={{fontSize:12,fontWeight:700,color:"#000"}}>✓</span>}</div>
            </Tap>
          );
        })}
        <Tap onTap={save} style={{marginTop:8,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:16,fontWeight:700,color:"#000"}}>Enregistrer</span>
        </Tap>
      </div>
    </div>
  );
}

// photos : { date -> chemin dans Storage }, urls : { date -> URL signee } (bucket prive).
function PhotoProgress({uid,photos,urls,onSavePhotos,onClose}) {
  const [date,setDate]=useState(todayKey());
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const _pf=useRef(null);
  const onPhoto=(e)=>{
    const f=e.target.files&&e.target.files[0];
    e.target.value="";
    if(!f||!uid) return;
    setErr("");setBusy(true);
    const rd=new FileReader();
    rd.onload=()=>{
      const im=new Image();
      im.onload=()=>{
        // Redimensionnement avant envoi : inutile de televerser 4 Mo pour une vignette.
        const mx=520;const sc=Math.min(1,mx/Math.max(im.width,im.height));
        const cw=Math.round(im.width*sc),ch=Math.round(im.height*sc);
        const cv=document.createElement("canvas");cv.width=cw;cv.height=ch;
        cv.getContext("2d").drawImage(im,0,0,cw,ch);
        cv.toBlob(async(blob)=>{
          if(!blob){setBusy(false);setErr("Image illisible.");return;}
          try{
            const path=await uploadPhoto(uid,date,blob);
            await onSavePhotos({...photos,[date]:path});
          }catch(ex){ setErr("Envoi impossible. Reessaie."); console.error("upload photo",ex&&ex.message); }
          setBusy(false);
        },"image/jpeg",0.72);
      };
      im.onerror=()=>{setBusy(false);setErr("Image illisible.");};
      im.src=rd.result;
    };
    rd.onerror=()=>{setBusy(false);setErr("Lecture impossible.");};
    rd.readAsDataURL(f);
  };
  const del=async(d)=>{ const next={...photos};const path=next[d];delete next[d];await onSavePhotos(next);await removePhoto(path); };
  const keys=Object.keys(photos||{}).sort();
  const first=keys[0],last=keys[keys.length-1];
  const gap=(first&&last&&first!==last)?Math.round((new Date(last)-new Date(first))/86400000):0;
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",alignItems:"center",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
    <div style={{width:"100%",maxWidth:600,display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
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
          <Tap onTap={()=>_pf.current&&_pf.current.click()} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,height:48,borderRadius:12,background:C.blue}}><span style={{fontSize:15,fontWeight:700,color:"#000"}}>Choisir une photo</span></Tap><input ref={_pf} type="file" accept="image/*" onChange={onPhoto} style={{display:"none"}}/>
          <div style={{fontSize:11,color:err?C.red:C.ink4,marginTop:10,lineHeight:1.5}}>
            {err?err:busy?"Envoi en cours…":"La photo est enregistrée sur ton compte et visible depuis tous tes appareils. Tu peux en ajouter une après coup pour n'importe quelle date."}
          </div>
        </div>
        {keys.length>=2&&(
          <div style={{background:C.s1,borderRadius:16,padding:"18px",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:4}}>Avant / Après</div>
            <div style={{fontSize:12,color:C.ink4,marginBottom:14}}>{gap} jours d'écart</div>
            <div style={{display:"flex",gap:10}}>
              {[["Avant",first],["Après",last]].map(([lbl,d])=>(
                <div key={d} style={{flex:1}}>
                  <div style={{borderRadius:12,overflow:"hidden",background:C.s2,aspectRatio:"3/4"}}><img src={(urls||{})[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
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
                <img src={(urls||{})[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <div style={{position:"absolute",left:0,right:0,bottom:0,padding:"4px 6px",background:"linear-gradient(transparent,rgba(0,0,0,.75))",fontSize:10,fontWeight:600,color:"#fff"}}>{d.slice(5)}</div>
                <Tap onTap={()=>del(d)} style={{position:"absolute",top:4,right:4,width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:12,color:"#fff"}}>✕</span></Tap>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

function HistoryTab({sessions,onSelect,accent,onOpenPhotos,photos:photoMap,urls}) {
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
        const dates=Object.keys(photoMap||{}).sort().reverse();
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
                    <img src={(urls||{})[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
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
              {computeScore(s.totalKg,s.totalSets,s.feedback,targetOf(s))>0&&<span style={{fontSize:15,fontWeight:700,color:accent||C.blue,padding:"4px 12px",background:C.s3,borderRadius:8}}>{computeScore(s.totalKg,s.totalSets,s.feedback,targetOf(s))}</span>}
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
    <div style={{position:"fixed",inset:0,zIndex:Z.fullscreen,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",fontFamily:F,animation:`slideUp 280ms ${EO}`}}>
    <div style={{width:"100%",maxWidth:600,display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
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
    </div>
  );
}

function SettingsTab({user,excluded,onToggleExclude,onSignOut,onReset,onOpenLibrary,profile,schedule,avatarUrl,onUpdateConfig,onOpenScheduleEditor,onRedoOnboarding}) {
  const[showLib,setShowLib]=useState(false);
  const[w,setW]=useState(profile?.weight_kg!=null?String(profile.weight_kg):"");
  const[h,setH]=useState(profile?.height_cm!=null?String(profile.height_cm):"");
  const[ag,setAg]=useState(profile?.age!=null?String(profile.age):"");
  const[saved,setSaved]=useState(false);
  const[saveErr,setSaveErr]=useState(false);
  const hasChanges=(w?Number(w):null)!==(profile?.weight_kg??null)||(h?Number(h):null)!==(profile?.height_cm??null)||(ag?Number(ag):null)!==(profile?.age??null);
  // Avatar : fichier dans Storage, apercu immediat via URL locale le temps de l'envoi.
  const[avatarPreview,setAvatarPreview]=useState("");
  const avatar=avatarPreview||avatarUrl||"";
  const avatarRef=useRef(null);
  const onAvatar=e=>{
    const f=e.target.files&&e.target.files[0];
    e.target.value="";
    const uid=user?.id;
    if(!f||!uid) return;
    setAvatarPreview(URL.createObjectURL(f));
    (async()=>{
      try{
        const path=await uploadPhoto(uid,"avatar",f);
        onUpdateConfig&&onUpdateConfig({avatar:path});
      }catch(ex){ console.error("upload avatar",ex&&ex.message); setAvatarPreview(""); }
    })();
  };
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
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,gap:8}}><span style={{fontSize:14,fontWeight:600,color:C.ink}}>Mon programme</span>{onOpenScheduleEditor&&<Tap onTap={onOpenScheduleEditor} style={{padding:"6px 12px",borderRadius:980,background:C.s2}}><span style={{fontSize:12,fontWeight:600,color:C.ink3}}>Modifier les séances ›</span></Tap>}</div>
        <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Objectif actuel</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.s1,border:`1px solid ${C.s3}`,borderRadius:14,padding:"14px 16px",marginBottom:18}}>
          <span style={{fontSize:15,fontWeight:700,color:C.ink}}>{(GOALS.find(g=>g[0]===profile?.goal)||[])[1]||"—"}</span>
          {onRedoOnboarding&&<Tap onTap={onRedoOnboarding} style={{padding:"7px 14px",borderRadius:980,background:C.blueDim}}><span style={{fontSize:12,fontWeight:700,color:C.blue}}>Changer ‹</span></Tap>}
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
        {(hasChanges||saved||saveErr)&&<Tap onTap={async()=>{const r=await onUpdateConfig({weight_kg:w?Number(w):null,height_cm:h?Number(h):null,age:ag?Number(ag):null});if(r&&r.error){setSaved(false);setSaveErr(true);setTimeout(()=>setSaveErr(false),2400);}else{setSaveErr(false);setSaved(true);setTimeout(()=>setSaved(false),1600);}}} style={{marginTop:18,height:48,borderRadius:12,background:saveErr?C.s4:(saved?C.blue:C.ink),display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,fontWeight:700,color:saveErr?C.ink:(saved?"#000":"#fff"),letterSpacing:".02em"}}>{saveErr?"Erreur — réessayer":(saved?"Enregistré ✓":"Enregistrer")}</span></Tap>}
        <div style={{marginTop:20,paddingTop:18,borderTop:`1px solid ${C.s3}`}}>
          <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Programme</div>
          {profile?.program_start?(
            <div style={{fontSize:14,color:C.ink2,marginBottom:12}}>Séance {Math.min(profile?.session_index||0,profile?.total_sessions||48)}/{profile?.total_sessions||48} · débuté le {fmtDateShort(profile.program_start)}</div>
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
      {/* Signaux */}
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10,marginTop:20}}>Signaux</div>
      {[
        ["sound_on","Sons","Fin de repos, minute EMOM, fin de bloc"],
        ["vibrate_on","Vibration","Utile en salle avec des écouteurs"],
        ["countdown_on","Décompte 3·2·1","Trois clics avant la fin du repos"],
      ].map(([k,t,d],i,arr)=>{
        const on=profile?.[k]!==false;
        return (
          <Tap key={k} onTap={()=>{ const next=!on; onUpdateConfig&&onUpdateConfig({[k]:next}); if(next){unlockAudio();play(k==="countdown_on"?"tick":"cloche");} }}
            style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"14px 16px",background:C.s1,
              borderRadius:i===0?"14px 14px 0 0":i===arr.length-1?"0 0 14px 14px":0,
              borderTop:i?`1px solid ${C.s2}`:"none",marginBottom:i===arr.length-1?0:0}}>
            <div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>{t}</div><div style={{fontSize:12,color:C.ink4,marginTop:2}}>{d}</div></div>
            <div style={{width:46,height:28,borderRadius:980,background:on?C.blue:C.s4,position:"relative",transition:`background 200ms ${EO}`,flexShrink:0}}>
              <div style={{position:"absolute",top:3,left:on?21:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:`left 200ms ${EO}`}}/>
            </div>
          </Tap>
        );
      })}
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
      <div style={{fontSize:12,color:C.ink4,textAlign:"center",marginTop:28}}>SŌMA · {"S"+weekNumber()} · {DB.length} exercices · build 23.74a</div>
    </div>
  );
}

// ─── TAB TRANSITION — slide between tabs ─────────────────────────────────────
function TabContent({tab,prevTab,children}) {
  const dir = useMemo(()=>{
    // La liste ne correspondait pas aux onglets reels ("home" manquait, "history" n'existe
    // pas) : indexOf renvoyait -1 et la direction du glissement etait fausse.
    const order=["home","seance","stats","settings"];
    const ci=order.indexOf(tab),pi=order.indexOf(prevTab||tab);
    return ci>pi?1:-1;
  },[tab,prevTab]);
  return(
    <div key={tab} style={{animation:`slideTab${dir>0?"Right":"Left"} 320ms ${EO} both`}}>
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
    <div style={{position:"fixed",inset:0,zIndex:Z.fullscreen,background:C.bg,fontFamily:F,overflowY:"auto"}}>
    <div style={{maxWidth:600,margin:"0 auto",padding:`calc(20px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom))`}}>
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
    </div>
  );
}

const FREQ_DAYS = {3:[0,2,4],4:[0,1,3,4],5:[0,1,2,3,4],6:[0,1,2,3,4,5]};
const DAY_LBL = ["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
const GOALS=[["force","Force","Force maximale & puissance"],["hypertrophie","Hypertrophie","Prise de muscle & volume"],["seche","Sèche","Perdre du gras, garder le muscle"],["hybride","Hybride","Force + conditionnement"],["endurance","Endurance","Cardio & endurance"],["performance","Performance","Athlétique complet"]];
const TRAIN_TEMPLATES = PROGRAM.filter(d=>d.salle);

// ─── MOTEUR DE PROGRAMMES DIFFERENCIES PAR OBJECTIF ────────────────────────────
const MUSCLE_GROUP_MAP={
  pecs:"push","pecs inf":"push","pecs sup":"push","épaules":"push","épaules ant":"push","épaules complet":"push","deltoïdes lat.":"push",triceps:"push","rear delt":"push",bras:"push",
  dos:"pull","dos large":"pull","dos épais":"pull","grand dorsal":"pull",biceps:"pull","biceps long":"pull","avant-bras":"pull",trapèzes:"pull",lombaires:"pull",grip:"pull",
  quads:"legs",fessiers:"legs","fessiers moyens":"legs",ischios:"legs",mollets:"legs",adducteurs:"legs",jambes:"legs",
  abdos:"core","abdos bas":"core",core:"core","core anti-rotation":"core","core bas":"core","core complet":"core","core oblique":"core","core obliques":"core","core postérieur":"core",obliques:"core",
  "mobilité":"core","mobilité dos":"core","mobilité hanche":"core","mobilité quad":"core","mobilité épaule":"core",
  cardio:"cardio","full body":"full",
};
const muscleGroupOf=(ex)=>MUSCLE_GROUP_MAP[primaryMuscle(ex.m)]||"full";
// Le score se mesurait sur des valeurs ABSOLUES : 40 points pour 5000 kg souleves, 30 pour
// 25 series. Une seance de jambes lourde plafonnait sans effort, une seance d'epaules ou de
// gainage ne pouvait structurellement pas bien scorer, aussi bien executee soit-elle.
// Il se mesure desormais a ce qui etait PRESCRIT ce jour-la : executer sa seance vaut 100.
// Les seances enregistrees avant l'ajout du prescrit retombent sur l'ancien bareme.
const computeScore=(totalKg,totalSets,feedback,target)=>{
  const fb=feedback||{};
  const g=Number(fb.global)||0,en=Number(fb.energy)||0;
  const mood=(g+en)/10*30;
  const tSets=Number(target&&target.sets)||0, tKg=Number(target&&target.kg)||0;
  if(tSets>0||tKg>0){
    const pSets=tSets>0?Math.min(1,(totalSets||0)/tSets):1;
    const pKg  =tKg  >0?Math.min(1,(totalKg  ||0)/tKg  ):1;
    return Math.round(pSets*35+pKg*35+mood);
  }
  return Math.round(Math.min((totalKg||0)/5000*40,40)+Math.min((totalSets||0)/25*30,30)+mood);
};
const targetOf=(s)=>({sets:s&&(s.targetSets!=null?s.targetSets:s.target_sets),kg:s&&(s.targetKg!=null?s.targetKg:s.target_kg)});
const computePBs=(sessions)=>{
  const m={};(sessions||[]).forEach(s=>{(s.exercises||[]).forEach(e=>{if(e&&e.id&&(e.completedSets>0)&&(e.weight>0)){if(!m[e.id]||e.weight>m[e.id])m[e.id]=e.weight;}});});
  return Object.entries(m).map(([id,kg])=>{const ex=DB.find(x=>x.id===id);if(!ex)return null;return{...ex,pbKg:kg,oneRM:orm(kg,ex.reps)};}).filter(Boolean).sort((a,b)=>(b.oneRM||0)-(a.oneRM||0));
};
const BADGE_TIERS={
  "Assiduité":[1,5,10,20,30,50,75,100,150,200],
  Force:[40,60,80,100,120,140,160,180,200,220],
  Volume:[0.5,1,2.5,5,10,15,25,50,75,100],
  "Régularité":[1,2,4,8,12,16,24,36,48,52],
  "Personal Bests":[1,3,5,10,15,20,25,30,40,50],
};
// Plus longue serie de semaines consecutives comportant au moins une seance.
const weekKeyOf=(d)=>{const t=new Date(String(d)+"T00:00:00");if(isNaN(t))return null;const dow=(t.getDay()+6)%7;t.setDate(t.getDate()-dow);return localDateKey(t);};
const longestWeekStreak=(sessions)=>{
  const keys=[...new Set((sessions||[]).map(s=>weekKeyOf(s.date)).filter(Boolean))].sort();
  let best=0,run=0,prev=null;
  keys.forEach(k=>{
    if(prev){ const gap=Math.round((new Date(k+"T00:00:00")-new Date(prev+"T00:00:00"))/86400000); run=(gap===7)?run+1:1; }
    else run=1;
    prev=k; if(run>best) best=run;
  });
  return best;
};
const computeBadges=(sessions)=>{
  const totalS=(sessions||[]).length;
  const maxW=(sessions||[]).reduce((m,s)=>Math.max(m,((s.exercises||[]).reduce((mm,e)=>Math.max(mm,e.weight||0),0))),0);
  const totalVol=(sessions||[]).reduce((a,s)=>a+(s.totalKg||0),0)/1000;
  // "Regularite" comptait les DATES DISTINCTES de seance. Comme une seule seance est
  // possible par date (contrainte d'unicite user_id+date), cette valeur etait toujours
  // STRICTEMENT EGALE a l'assiduite : deux des cinq familles de badges etaient un doublon.
  // Elle mesure desormais la plus longue serie de semaines consecutives avec seance.
  const days=longestWeekStreak(sessions);
  const nbPB=computePBs(sessions).length;
  const VALS={"Assiduité":totalS,Force:maxW,Volume:totalVol,"Régularité":days,"Personal Bests":nbPB};
  const UNIT={"Assiduité":"séances",Force:"kg",Volume:"t",Régularité:"semaines d'affilée","Personal Bests":"PB"};
  const out=[];
  Object.keys(BADGE_TIERS).forEach(cat=>{
    const val=VALS[cat];
    BADGE_TIERS[cat].forEach(tier=>{
      const unit=(cat==="Assiduité"&&tier===1)?"séance":(UNIT[cat]||"");
      out.push({cat,t:`${tier} ${unit}`.trim(),d:`Atteins ${tier} ${unit}`.trim(),ok:val>=tier,tier});
    });
  });
  return out;
};
const phaseBlocksList=()=>{
  const blocks=[];
  PHASES12.forEach((ph,i)=>{
    const last=blocks[blocks.length-1];
    if(last&&last.name===ph.n) last.endWeek=i+1;
    else blocks.push({name:ph.n,endWeek:i+1});
  });
  return blocks;
};
const PBCAT={bar:"Barre",db:"Haltères",kb:"Kettlebell",mc:"Machine",bw:"Poids du corps",cd:"Cardio"};
const PBCAT_ICON={
  Barre:(<><rect x="9" y="10" width="6" height="4" rx="1"/><path d="M6 12h1"/><path d="M17 12h1"/><path d="M3 10v4"/><path d="M21 10v4"/></>),
  "Haltères":(<><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/><path d="M8 12h8"/></>),
  Kettlebell:(<><circle cx="12" cy="14" r="6"/><path d="M9 8a3 3 0 0 1 6 0"/></>),
  Machine:(<><circle cx="12" cy="12" r="3"/><path d="M12 4v2"/><path d="M12 18v2"/><path d="M4 12h2"/><path d="M18 12h2"/></>),
  "Poids du corps":(<><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M8 10h8"/><path d="M12 13l-3 6"/><path d="M12 13l3 6"/></>),
  Cardio:(<><path d="M4 12h3l2-5 3 10 2-7 2 4h4"/></>),
  Autre:(<><circle cx="12" cy="12" r="9"/></>),
};

// ─── APPRENTISSAGE DE MOUVEMENTS (skill progression) ───────────────────────────
const SKILLS_CATALOG=[
  {id:"muscleup",name:"Muscle-up",icon:(<><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></>),steps:[
    {label:"Tractions strictes",exId:"bw01",target:"5×5 propres"},
    {label:"Dips stricts",exId:"bw04",target:"5×5 propres"},
    {label:"Tractions explosives (poitrine à la barre)",exId:"x072",target:"5×3 explosives"},
    {label:"Transition au sol (jump to support)",exId:null,target:"5×5 assis en haut de dips"},
    {label:"Muscle-up assisté (élastique)",exId:"bw15",target:"5×3 assistées"},
    {label:"Muscle-up strict",exId:"bw21",target:"1 répétition propre"},
  ]},
  {id:"pistol",name:"Pistol Squat",icon:(<><circle cx="12" cy="5" r="2"/><path d="M12 7v6"/><path d="M12 13l-4 7"/><path d="M12 13l3-2"/></>),steps:[
    {label:"Split squat bulgare",exId:"db41",target:"4×8/jambe"},
    {label:"Pistol assisté (support)",exId:null,target:"4×5/jambe"},
    {label:"Pistol négatif (descente lente)",exId:"bw11",target:"4×5/jambe"},
    {label:"Pistol complet",exId:"bw16",target:"3×5/jambe"},
  ]},
  {id:"handstand",name:"Handstand Push-up",icon:(<><path d="M12 4v6"/><path d="M8 22l4-12 4 12"/><path d="M7 10h10"/></>),steps:[
    {label:"Pike push-up",exId:"bw07",target:"4×8"},
    {label:"Handstand hold (mur)",exId:"bw36",target:"3×20s"},
    {label:"HSPU négatif (mur)",exId:"bw18",target:"4×5"},
    {label:"HSPU complet (mur)",exId:"bw13",target:"3×5"},
  ]},
  {id:"frontlever",name:"Front Lever",icon:(<><circle cx="12" cy="5" r="2"/><path d="M12 7v3"/><path d="M12 10h9"/><path d="M12 10h-9"/></>),steps:[
    {label:"Suspension active gainée",exId:null,target:"4×20s"},
    {label:"Tuck front lever",exId:"x107",target:"4×10s"},
    {label:"Front lever avancé (jambe tendue)",exId:"bw22",target:"4×8s"},
    {label:"Front lever complet",exId:null,target:"3×5s"},
  ]},
  {id:"planche",name:"Planche",icon:(<><circle cx="5" cy="10" r="2"/><path d="M7 10h14"/></>),steps:[
    {label:"Gainage planche (frog stand)",exId:"x096",target:"4×20s"},
    {label:"Tuck planche",exId:"ab04",target:"4×10s"},
    {label:"Planche avancée",exId:"ab05",target:"4×8s"},
    {label:"Planche complète",exId:null,target:"3×5s"},
  ]},
  {id:"onearmpushup",name:"One-Arm Push-up",icon:(<><path d="M4 18l8-6 8 6"/><path d="M12 12V4"/></>),steps:[
    {label:"Pompe archer",exId:"bw06",target:"4×8/côté"},
    {label:"Pompe excentrique un bras",exId:null,target:"4×5/côté"},
    {label:"One-arm push-up assisté",exId:null,target:"4×3/côté"},
    {label:"One-arm push-up complet",exId:null,target:"1 répétition/côté"},
  ]},
];
const SUCCESS_TO_ADVANCE=2;

const LEGACY_GOALS_BY_EQ={bar:["force","performance"],kb:["seche","endurance","performance"],bw:["seche","endurance","hypertrophie","performance"],db:["hypertrophie","performance","force"],mc:["hypertrophie"],cd:["endurance","seche"]};
const goalsOf=(ex)=>ex.goals||LEGACY_GOALS_BY_EQ[ex.eq]||[];
const GOAL_PROFILES={
  force:{splits:[
    {label:"Force — Bas (Squat)",groups:["legs","core"],mode:"classique",circuit:false},
    {label:"Force — Haut (Push)",groups:["push"],mode:"classique",circuit:false},
    {label:"Force — Haut (Pull)",groups:["pull"],mode:"classique",circuit:false},
    {label:"Force — Bas (Hinge)",groups:["legs","pull"],mode:"classique",circuit:false},
  ],eqBias:["bar","mc","db"],sets:5,repRange:[3,6],restSec:150,exCount:5},
  hypertrophie:{splits:[
    {label:"Hypertrophie — Push",groups:["push"],mode:"classique",circuit:true},
    {label:"Hypertrophie — Pull",groups:["pull"],mode:"classique",circuit:true},
    {label:"Hypertrophie — Jambes",groups:["legs"],mode:"classique",circuit:true},
    {label:"Hypertrophie — Push B",groups:["push","core"],mode:"classique",circuit:true},
    {label:"Hypertrophie — Pull B",groups:["pull","core"],mode:"classique",circuit:true},
  ],eqBias:["db","mc","bar"],sets:4,repRange:[8,12],restSec:75,exCount:6},
  seche:{splits:[
    {label:"Sèche — Full Body",groups:["full","legs","push","pull"],mode:"classique",circuit:true},
    {label:"Sèche — Haut + Cardio",groups:["push","pull","cardio"],mode:"amrap",circuit:false},
    {label:"Sèche — Bas + Core",groups:["legs","core"],mode:"classique",circuit:true},
    {label:"Sèche — Metcon",groups:["full","cardio","core"],mode:"emom",circuit:false},
  ],eqBias:["kb","bw","cd","db"],sets:3,repRange:[12,20],restSec:35,exCount:6},
  endurance:{splits:[
    {label:"Endurance — EMOM Full Body A",groups:["full","legs","push"],mode:"emom",circuit:false},
    {label:"Endurance — AMRAP Circuit",groups:["full","pull","core"],mode:"amrap",circuit:false},
    {label:"Endurance — EMOM Full Body B",groups:["full","legs","pull"],mode:"emom",circuit:false},
    {label:"Endurance — Cardio + Core",groups:["cardio","core"],mode:"amrap",circuit:false},
  ],eqBias:["kb","bw","cd"],sets:1,repRange:[10,15],restSec:0,exCount:5},
  performance:{splits:[
    {label:"Performance — Power Bas",groups:["legs"],mode:"classique",circuit:false},
    {label:"Performance — Push Athlétique",groups:["push"],mode:"classique",circuit:true},
    {label:"Performance — Pull Athlétique",groups:["pull"],mode:"classique",circuit:true},
    {label:"Performance — Power + Metcon",groups:["full","legs","push"],mode:"emom",circuit:false},
    {label:"Performance — Conditioning",groups:["cardio","core","full"],mode:"amrap",circuit:false},
  ],eqBias:["bar","kb","db","bw"],sets:4,repRange:[5,10],restSec:90,exCount:5},
};
const buildGoalSession=(goal,sessionIndex,equipment)=>{
  const gp=GOAL_PROFILES[goal];
  if(!gp) return null;
  const splitIdx=sessionIndex%gp.splits.length;
  const split=gp.splits[splitIdx];
  const equip=equipment&&equipment.length?equipment:null;
  const usable=(e)=>e.eq==="bw"||!equip||equip.includes(e.eq);
  const anatomic=(e)=>split.groups.includes(muscleGroupOf(e));
  let pool=DB.filter(e=>anatomic(e)&&usable(e)&&goalsOf(e).includes(goal));
  if(pool.length<gp.exCount) pool=DB.filter(e=>anatomic(e)&&usable(e)); // pas assez d'exos taggues pour cet objectif -> retombe sur muscle+materiel
  if(!pool.length) pool=DB.filter(e=>anatomic(e)); // securite: ne jamais rendre une seance vide
  pool=pool.slice().sort((a,b)=>{
    const pa=gp.eqBias.indexOf(a.eq),pb=gp.eqBias.indexOf(b.eq);
    const wa=pa<0?99:pa,wb=pb<0?99:pb;
    if(wa!==wb) return wa-wb;
    return a.id.localeCompare(b.id);
  });
  if(!pool.length) return null;
  const n=Math.min(gp.exCount,pool.length);
  const cycle=Math.floor(sessionIndex/gp.splits.length);
  const used=new Set();
  const exercises=[];
  const reps=String(Math.round((gp.repRange[0]+gp.repRange[1])/2));
  for(let i=0;i<n;i++){
    let idx=(cycle*n+i*5)%pool.length,tries=0;
    while(used.has(pool[idx].id)&&tries<pool.length){idx=(idx+1)%pool.length;tries++;}
    used.add(pool[idx].id);
    const ex=pool[idx];
    exercises.push({...ex,sets:gp.sets,reps,rest:gp.restSec});
  }
  return {label:split.label,salle:"full",muscle:split.groups.join(" · "),exercises,abs:[],recommendedMode:split.mode,circuit:!!split.circuit};
};
const HYBRID_MODES={"Push Force":{mode:"classique",circuit:true},"KB Power":{mode:"emom",circuit:false},"Pull & Legs":{mode:"classique",circuit:true},"KB Endurance":{mode:"amrap",circuit:false},"Full Power":{mode:"classique",circuit:true}};
const pendingSessionFor=(goal,sessionIndex,equipment)=>{
  const generated=buildGoalSession(goal,sessionIndex,equipment);
  if(generated) return generated;
  const tpl=TRAIN_TEMPLATES.length?TRAIN_TEMPLATES[sessionIndex%TRAIN_TEMPLATES.length]:null;
  if(!tpl) return null;
  const hm=HYBRID_MODES[tpl.label]||{mode:"classique",circuit:false};
  return {...tpl,recommendedMode:hm.mode,circuit:hm.circuit};
};

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

function OnboardingScreen({user,onDone,onClose}) {
  const [step,setStep]=useState(0);
  const [goal,setGoal]=useState(null);
  const [level,setLevel]=useState(null);
  const [equip,setEquip]=useState([]);
  const [freq,setFreq]=useState(4);
  const [weight,setWeight]=useState("");
  const [startDate,setStartDate]=useState(todayKey());
  const [saving,setSaving]=useState(false);
  const LEVELS=[["debutant","Debutant","Je debute"],["inter","Intermediaire","Quelques mois ou annees"],["avance","Avance","Entraine et regulier"],["athlete","Athlete","Niveau competition"]];
  const EQUIP=[["bw","Poids du corps"],["kb","Kettlebell"],["db","Halteres"],["bar","Barre"],["mc","Machine / salle"],["cd","Cardio"]];
  const FREQS=[3,4,5,6];
  const toggleEq=(k)=>setEquip(pr=>pr.includes(k)?pr.filter(x=>x!==k):[...pr,k]);
  const canNext = step===0?!!goal : step===1?!!level : step===2?equip.length>0 : step===5?!!startDate : true;
  const last = step===5;
  const card=(sel)=>({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderRadius:16,background:sel?C.blue:C.s1,border:`1px solid ${sel?C.blue:C.s3}`,marginBottom:12,cursor:"pointer"});
  const ttl=(sel)=>({fontSize:17,fontWeight:600,color:sel?"#000":C.ink});
  const dsc=(sel)=>({fontSize:13,color:sel?"rgba(0,0,0,.6)":C.ink4,marginTop:3});
  const chk=(sel)=> sel?<span style={{fontSize:18,fontWeight:700,color:"#000"}}>✓</span>:null;
  const next = async () => {
    if(!last){ setStep(step+1); return; }
    setSaving(true);
    await onDone({goal,level,equipment:equip,frequency:freq,weight_kg:weight?Number(weight):null,programStart:startDate});
  };
  const titles=["Ton objectif","Ton niveau","Ton equipement","Jours par semaine","Ton poids (optionnel)","Date de debut"];
  const subs=["Pour orienter ton programme","On calibre l'intensite","On choisit les exercices adaptes","On repartit tes seances","Pour suivre ta progression","Quand veux-tu commencer ?"];
  return (
    <div style={{position:"fixed",inset:0,zIndex:Z.fullscreen,background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",fontFamily:F}}>
    <div style={{width:"100%",maxWidth:600,display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
      <div style={{padding:`calc(22px + env(safe-area-inset-top)) 24px 8px`}}>
        {onClose&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><Tap onTap={onClose} style={{width:36,height:36,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap></div>}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {[0,1,2,3,4,5].map(i=>(<div key={i} style={{flex:1,height:4,borderRadius:980,background:i<=step?C.blue:C.s3,transition:`background 250ms ${EO}`}}/>))}
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
        {step===5 && (<div>
          <div style={{background:C.s1,borderRadius:16,padding:"20px",border:`1px solid ${C.s3}`,marginBottom:12}}>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:"transparent",border:"none",outline:"none",color:C.ink,fontSize:20,fontWeight:700,fontFamily:F}}/>
          </div>
          <Tap onTap={()=>setStartDate(todayKey())} style={{padding:"12px 16px",borderRadius:12,background:startDate===todayKey()?C.blueDim:C.s1,border:`1px solid ${startDate===todayKey()?C.blue:C.s3}`,display:"inline-flex"}}><span style={{fontSize:13,fontWeight:600,color:startDate===todayKey()?C.blue:C.ink3}}>Aujourd'hui</span></Tap>
          <div style={{fontSize:13,color:C.ink4,marginTop:14,lineHeight:1.5}}>Tu peux choisir une date future pour préparer ton programme à l'avance.</div>
        </div>)}
      </div>
      <div style={{padding:`14px 24px calc(20px + env(safe-area-inset-bottom))`,display:"flex",gap:10}}>
        {step>0&&<Tap onTap={()=>setStep(step-1)} style={{padding:"17px 22px",borderRadius:15,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:17,fontWeight:600,color:C.ink3}}>Retour</span></Tap>}
        <Tap onTap={canNext&&!saving?next:undefined} style={{flex:1,padding:"17px",borderRadius:15,background:canNext?C.blue:C.s3,display:"flex",alignItems:"center",justifyContent:"center",opacity:saving?0.6:1}}><span style={{fontSize:17,fontWeight:600,color:canNext?"#000":C.ink4}}>{saving?"Creation...":last?"Creer mon programme":"Continuer"}</span></Tap>
      </div>
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
  const[showOnboardingRedo,setShowOnboardingRedo]=useState(false);
  const[showPBManager,setShowPBManager]=useState(false);
  const[showSkillManager,setShowSkillManager]=useState(false);
  const[showRewardsManager,setShowRewardsManager]=useState(false);
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
  // L'etat du chrono part sur le serveur a chaque transition (demarrage, pause, reprise).
  // C'est peu d'ecritures - elles ne se produisent qu'aux transitions, jamais a chaque seconde,
  // le temps ecoule etant recalcule a partir de started_at.
  const clockPersist=useCallback((st)=>{
    const id=user?.id; if(!id) return;
    if(!st){ enqueue("clock","chrono",()=>supabase.from("active_session").delete().eq("user_id",id)); return; }
    enqueue("clock","chrono",()=>supabase.from("active_session").upsert({
      user_id:id,date:todayKey(),
      started_at:st.startedAt?new Date(st.startedAt).toISOString():null,
      accumulated_seconds:Math.round(Number(st.acc)||0),
      running:!!st.running,updated_at:new Date().toISOString(),
    },{onConflict:"user_id"}));
  },[user]);
  const perfRef=useRef({});
  // Hauteur (en % de l'ecran) de la carte touchee, pour que le plein ecran s'ouvre de la.
  const[focusOrigin,setFocusOrigin]=useState(50);
  const[weighIns,setWeighIns]=useState([]);
  const saveWeighIn=useCallback((kg)=>{
    const id=user?.id; if(!id||!(kg>0)) return;
    const date=todayKey();
    setWeighIns(prev=>[...prev.filter(w=>w.date!==date),{date,weight_kg:kg}]);
    // La pesee fait autorite sur le poids du profil : c'est lui qui echelonne le moteur.
    updateConfigRef.current&&updateConfigRef.current({weight_kg:kg});
    enqueue(`weigh:${date}`,"pesée",()=>supabase.from("weigh_ins").upsert({user_id:id,date,weight_kg:kg},{onConflict:"user_id,date"}));
  },[user]);
  const updateConfigRef=useRef(null);
  // Nombre d'ecritures encore en attente d'envoi : sans cet indicateur, rien ne distingue
  // une seance enregistree d'une seance qui n'a pas encore quitte le telephone.
  const[pending,setPending]=useState(0);
  useEffect(()=>{ outboxSubs.add(setPending); return()=>{outboxSubs.delete(setPending);}; },[]);
  const clock=useStopwatch(clockPersist);
  const rest=useCountdown(()=>setShowRestFull(true));
  // Photos : la base ne contient que des chemins Storage, l'affichage passe par des URL
  // signees regenerees a chaque chargement (bucket prive).
  const photos=useMemo(()=>(profile&&profile.photos&&typeof profile.photos==="object")?profile.photos:{},[profile]);
  const[photoUrls,setPhotoUrls]=useState({});
  const[avatarUrl,setAvatarUrl]=useState("");
  useEffect(()=>{ let alive=true; (async()=>{ const u=await signPhotos(photos); if(alive) setPhotoUrls(u); })(); return()=>{alive=false;}; },[photos]);
  // Les signaux sont declenches depuis des minuteurs, hors de l'arbre React : les preferences
  // sont donc recopiees dans le module audio a chaque changement de profil.
  useEffect(()=>{
    SOUND.enabled  = profile?.sound_on!==false;
    SOUND.vibrate  = profile?.vibrate_on!==false;
    SOUND.countdown= profile?.countdown_on!==false;
  },[profile]);
  // iOS n'autorise aucun son tant que la page n'a pas ete touchee : sans ce deblocage,
  // le tout premier bip d'une seance ne sort jamais.
  useEffect(()=>{
    const on=()=>{ unlockAudio(); window.removeEventListener("pointerdown",on); };
    window.addEventListener("pointerdown",on,{once:false});
    return()=>window.removeEventListener("pointerdown",on);
  },[]);
  // Index des dernieres performances reelles, qui alimente la surcharge progressive.
  const perf=useMemo(()=>perfIndex(sessions),[sessions]);
  useEffect(()=>{perfRef.current=perf;},[perf]);
  const avatarPath=profile&&profile.avatar;
  useEffect(()=>{ let alive=true; (async()=>{
    if(!avatarPath){ if(alive) setAvatarUrl(""); return; }
    const u=await signPhotos({a:avatarPath});
    if(alive) setAvatarUrl(u.a||"");
  })(); return()=>{alive=false;}; },[avatarPath]);
  const wk=weekNumber();
  const viewSchedule=useMemo(()=>{let s=autoRotate?schedule.map(d=>rotateDay(d,wk)):schedule;const eq=profile?.equipment;if(eq&&eq.length)s=s.map(d=>adaptEquip(d,eq));const g=profile?.goal;if(g&&g!=="hybride")s=s.map(d=>adaptGoal(d,g));s=s.map(d=>personalizeDay(d,profile,progWeekOf(profile?.program_start),perfRef.current));const _mp=weeklyModePlan(s,profile,progWeekOf(profile?.program_start));s=s.map((d,i)=>(d&&d.salle)?{...d,recommendedMode:(_mp[i]&&_mp[i].mode)||"classique",circuit:(_mp[i]&&_mp[i].circuit)||false}:d);return s;},[schedule,autoRotate,wk,profile]);


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
    // Reprise des donnees restees sur cet appareil avant le passage au tout-serveur.
    // Les photos de progression n'existaient QUE en local : elles seraient definitivement
    // perdues si on se contentait de vider le stockage. Migration unique, puis purge.
    await migrateLocalToServer(uid);
    // Le serveur est desormais la seule source. Plus aucune lecture locale.
    try{
      const[{data:sess},{data:pbs},{data:strData},{data:prof},{data:act},{data:wis}]=await Promise.all([
        supabase.from("sessions").select("*").eq("user_id",uid).order("date",{ascending:false}),
        supabase.from("personal_bests").select("*").eq("user_id",uid),
        supabase.from("streaks").select("*").eq("user_id",uid).maybeSingle(),
        supabase.from("profiles").select("*").eq("id",uid).maybeSingle(),
        supabase.from("active_session").select("*").eq("user_id",uid).maybeSingle(),
        supabase.from("weigh_ins").select("date,weight_kg").eq("user_id",uid).order("date",{ascending:true}),
      ]);
      setProfile(prof||null);
      setWeighIns(wis||[]);
      if(prof){
        if(Array.isArray(prof.schedule)&&prof.schedule.length) setSchedule(prof.schedule);
        if(Array.isArray(prof.excluded)) setExcluded(prof.excluded);
        if(Array.isArray(prof.favorites)) setFavorites(prof.favorites);
        if(Array.isArray(prof.supersets)) setSupersets(prof.supersets);
        if(prof.weights&&typeof prof.weights==="object") setWeights(prof.weights);
        if(prof.accent) setAccent(prof.accent);
        if(typeof prof.auto_rotate==="boolean") setAutoRotate(prof.auto_rotate);
      }
      // Seance en cours : le log des series cochees et le chrono reprennent ou qu'on soit,
      // mais uniquement si elle concerne aujourd'hui (sinon c'est un reste a jeter).
      if(act&&act.date===todayKey()){
        setLog(act.log||{});
        clock.hydrate(act.started_at||act.accumulated_seconds||act.running
          ?{startedAt:act.started_at?new Date(act.started_at).getTime():null,acc:Number(act.accumulated_seconds)||0,running:!!act.running,day:act.date}
          :null);
      }else{
        setLog({});
        if(act) supabase.from("active_session").delete().eq("user_id",uid).then(()=>{});
      }
      // Le serveur fait autorite : sa liste remplace le local (evite les seances fantomes apres suppression/wipe)
      const norm=(sess||[]).map(s=>({...s,
        dayLabel:s.day_label||s.dayLabel||s.day||"",
        totalKg:Number(s.total_kg||s.totalKg||0),
        totalSets:Number(s.total_sets||s.totalSets||0),
        sessionIndex:Number(s.session_index||s.sessionIndex||0),
        targetKg:s.target_kg!=null?Number(s.target_kg):null,
        targetSets:s.target_sets!=null?Number(s.target_sets):null,
        duration:Number(s.duration_seconds||s.duration||0),
        exercises:typeof s.exercises==="string"?JSON.parse(s.exercises||"[]"):(s.exercises||[]),
        feedback:typeof s.feedback==="string"?JSON.parse(s.feedback||"null"):s.feedback,
      }));
      if(strData) longestRef.current=Number(strData.longest_streak)||0;
      setSessions(norm);computeStreak(norm);
      if(pbs?.length){const w={};pbs.forEach(pb=>{w[pb.exercise_id||pb.exercise_name]=pb.weight_kg;});setWeights(prev=>{const next={...prev,...w};persist(uid,{weights:next});return next;});}
      if(strData) setStreak(strData.current_streak||0);
      setSbReady(true);
      setDataReady(true);
      // (l'ecran de bienvenue est du code mort : rendu derriere un if(false&&showWelcome))
    }catch(e){console.error(e);setDataReady(true);}
    finally{loadingRef.current=null;}
  },[]);

  useEffect(()=>{if(user) loadUserData(user.id);},[user]);

  // La table streaks etait lue au demarrage et supprimee au reset, mais JAMAIS ecrite :
  // 0 ligne en base, la serie etait donc recalculee en local a chaque chargement et
  // n'existait nulle part cote serveur. Elle est desormais tenue a jour a chaque calcul.
  const longestRef=useRef(0);
  const persistStreak=useCallback((cnt,sess)=>{
    const id=user?.id; if(!id) return;
    const longest=Math.max(cnt,longestRef.current||0);
    longestRef.current=longest;
    const dates=(sess||[]).map(s=>s.date).filter(Boolean).sort();
    enqueue("streak","série",()=>supabase.from("streaks").upsert({
      user_id:id,current_streak:cnt,longest_streak:longest,
      last_session_date:dates[dates.length-1]||null,
      total_sessions:(sess||[]).length,updated_at:new Date().toISOString(),
    },{onConflict:"user_id"}));
  },[user]);

  function computeStreak(sess){
    const dateSet=new Set((sess||[]).map(x=>x.date));
    let cnt=0;
    for(let i=0;i<180;i++){
      const dt=new Date();dt.setDate(dt.getDate()-i);
      const key=localDateKey(dt);
      // Une seance FAITE compte toujours, quel que soit ce que dit le planning ce jour-la.
      // Ce test passait apres le filtre "jour d'entrainement prevu" : une seance effectuee un
      // jour marque Repos etait donc purement invisible pour la serie, qui affichait 1 au lieu
      // de 2. C'est ce qui s'est reellement passe le 29/07 (mercredi, hors planning par defaut).
      if(dateSet.has(key)){cnt++;continue;}
      const dow=(dt.getDay()+6)%7;
      const dd=(schedule&&schedule[dow])||PROG_DEF[dow];
      if(!(dd&&dd.salle)) continue; // repos prevu et non travaille : n'interrompt pas la serie
      if(i===0) continue;           // aujourd'hui pas encore fait : la serie court toujours
      break;                        // seance prevue et manquee : la serie est rompue
    }
    setStreak(cnt);
    persistStreak(cnt,sess);
  }

  // ── Persistance : 100% serveur ──
  // "persist" ecrivait dans localStorage, donc chaque appareil accumulait sa propre verite.
  // Meme signature, mais l'ecriture part vers Supabase, groupee et differee pour ne pas
  // declencher une requete par clic. Les cles de configuration vont sur profiles,
  // le log des series en cours sur active_session.
  const PROFILE_KEYS={schedule:"schedule",excluded:"excluded",favorites:"favorites",supersets:"supersets",weights:"weights",accent:"accent",autoRotate:"auto_rotate"};
  const cfgBuf=useRef({}); const cfgTimer=useRef(null);
  const logBuf=useRef(null);  const logTimer=useRef(null);

  const flushCfg=useCallback((uid)=>{
    const patch=cfgBuf.current; cfgBuf.current={};
    if(!uid||!Object.keys(patch).length) return;
    enqueue("cfg","config",()=>supabase.from("profiles").upsert({id:uid,...patch,updated_at:new Date().toISOString()},{onConflict:"id"}));
  },[]);

  const flushLog=useCallback((uid,sDateKey)=>{
    const payload=logBuf.current; logBuf.current=null;
    if(!uid||payload==null) return;
    enqueue("log","log des séries",()=>supabase.from("active_session").upsert({user_id:uid,date:sDateKey,log:payload,updated_at:new Date().toISOString()},{onConflict:"user_id"}));
  },[]);

  const persist = useCallback((uid,updates)=>{
    const id=uid||user?.id;
    if(!id||!updates) return;
    Object.keys(updates).forEach(k=>{ if(PROFILE_KEYS[k]) cfgBuf.current[PROFILE_KEYS[k]]=updates[k]; });
    if(Object.keys(cfgBuf.current).length){
      clearTimeout(cfgTimer.current);
      cfgTimer.current=setTimeout(()=>flushCfg(id),700);
    }
    if(updates.log!==undefined){
      logBuf.current=updates.log;
      clearTimeout(logTimer.current);
      logTimer.current=setTimeout(()=>flushLog(id,todayKey()),700);
    }
    // "sessions" et "profile" ne sont pas traites ici : ils ont deja leur propre
    // ecriture serveur (tables sessions / profiles) et etaient purement dupliques en local.
  },[user,flushCfg,flushLog]);

  // Une fermeture d'onglet ne doit pas emporter les series des dernieres secondes.
  useEffect(()=>{
    const flushNow=()=>{ const id=user?.id; if(!id) return; clearTimeout(cfgTimer.current); clearTimeout(logTimer.current); flushCfg(id); flushLog(id,todayKey()); };
    window.addEventListener("pagehide",flushNow);
    document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flushNow(); });
    return()=>window.removeEventListener("pagehide",flushNow);
  },[user,flushCfg,flushLog]);

  const saveLog=useCallback((key,val)=>{
    // Filet de securite : le chrono ne demarrait que depuis le bouton "Demarrer" de l'onglet
    // Seance. Toute autre entree en seance (ouverture directe d'un exercice, lecteur de
    // circuit/EMOM/AMRAP) laissait la duree a 0. Des qu'une serie est validee, la seance a
    // commence : le chrono part, quel que soit le chemin emprunte.
    if(val&&val.done&&!clock.running&&clock.sec===0) clock.start();
    setLog(prev=>{const next={...prev,[key]:val};persist(user?.id,{log:next});return next;});
    if(val.weight) setWeights(prev=>{const exId=key.split("_s")[0];if(!prev[exId]||val.weight>prev[exId]){const next={...prev,[exId]:val.weight};persist(user?.id,{weights:next});return next;}return prev;});
  },[persist,clock]);

  const saveWeight=useCallback((id,val)=>{setWeights(prev=>{const next={...prev,[id]:val};persist(user?.id,{weights:next});return next;});},[persist]);
  const toggleExclude=useCallback(id=>{setExcluded(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];persist(user?.id,{excluded:next});return next;});},[persist]);

  // Supprimer une seance laissait la base incoherente sur trois points : la sequence du
  // programme ne reculait pas d'un cran, les records nes de cette seance survivaient a leur
  // source, et l'ecriture locale persist({sessions}) etait devenue un appel mort depuis le S6.
  const deleteSession=useCallback(async(s)=>{
    const uid=user?.id;
    const next=(sessions||[]).filter(x=>x.date!==s.date);
    setSessions(next); computeStreak(next);
    setShowReport(null);
    if(!uid) return;
    enqueue(`del:${s.date}`,"suppression",()=>supabase.from("sessions").delete().eq("user_id",uid).eq("date",s.date));
    // La sequence recule : sans cela le programme sautait un cran definitivement.
    const idx=Math.max(0,(Number(profile&&profile.session_index)||0)-1);
    if(updateConfigRef.current) updateConfigRef.current({session_index:idx});
    // Les records sont recalcules depuis ce qui RESTE. Un record ne peut pas survivre a la
    // seance qui l'a produit.
    const best={};
    next.forEach(x=>(x.exercises||[]).forEach(e=>{
      if(!e||!e.id) return;
      const w=Number(e.weight)||0;
      if(!(w>0)||!(Number(e.completedSets)>0)) return;
      if(!best[e.id]||w>best[e.id].weight_kg) best[e.id]={
        user_id:uid,exercise_id:e.id,exercise_name:e.n||e.name||"",
        weight_kg:w,reps:Number(e.reps)||8,one_rm:orm(w,String(e.reps||8)),achieved_at:x.date,
      };
    }));
    const rows=Object.values(best);
    setWeights(()=>{const m={};rows.forEach(r=>{m[r.exercise_id]=r.weight_kg;});return m;});
    enqueue("pb:rebuild","records",async()=>{
      const del=await supabase.from("personal_bests").delete().eq("user_id",uid);
      if(del.error) return del;
      return rows.length?await supabase.from("personal_bests").insert(rows):{error:null};
    });
  },[user,sessions,profile]);

  const toggleFav=useCallback(id=>{setFavorites(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];persist(user?.id,{favorites:next});return next;});},[persist]);
  const updateConfig=useCallback((updates)=>{
    const next={...(profile||{}),...updates};
    if(updates.days){ next.frequency=updates.days.length; const sched=generateScheduleDays(updates.days); setSchedule(sched); persist(user?.id,{schedule:sched}); next.total_sessions=PROGRAM_SESSIONS; }
    else if(updates.frequency){ const days=FREQ_DAYS[updates.frequency]||FREQ_DAYS[4]; const sched=generateScheduleDays(days); setSchedule(sched); persist(user?.id,{schedule:sched}); next.total_sessions=PROGRAM_SESSIONS; }
    setProfile(next);
    persist(user?.id,{profile:next});
    return (async()=>{ try{ const{error}=await supabase.from("profiles").upsert({id:user?.id,goal:next.goal,level:next.level,equipment:next.equipment,frequency:next.frequency,weight_kg:next.weight_kg,sex:next.sex,height_cm:next.height_cm,age:next.age,program_start:next.program_start,rms:next.rms,avatar:next.avatar,photos:next.photos,session_index:next.session_index,total_sessions:next.total_sessions,pinned_pbs:next.pinned_pbs,active_skills:next.active_skills,updated_at:new Date().toISOString()},{onConflict:"id"}); if(error)console.error("profile save",error.message); return {error}; }catch(e){ console.error("profile save",e); return {error:e}; } })();
  },[persist,user,profile]);
  useEffect(()=>{updateConfigRef.current=updateConfig;},[updateConfig]);

  const switchTab=useCallback(id=>{setPrevTab(tab);setTab(id);if(id==="seance"){const ti=todayIdx();setDayIdx(cur=>cur===ti?cur:ti);}try{window.scrollTo(0,0);}catch(_e){}},[tab]);
  useEffect(()=>{ if(focusIdx!=null){ try{window.scrollTo({top:0,behavior:"auto"});}catch(_e){try{window.scrollTo(0,0);}catch(__e){}} } },[focusIdx]);

  const handleStartRest=(s,n)=>{setRestLabel(n);rest.start(s);setShowRestFull(true);};

  const handleReplaceEx=(replaced,newEx)=>{
    // reutilise le "day"/"exos" du rendu principal (pilotes par la sequence session_index) - meme regle que handleFeedbackSave.
    const src=aiOverride?.exercises||day?.exercises||[];
    const newExos=src.map(ex=>ex.id===replaced.id?{...newEx,sets:ex.sets}:ex);
    setAiOverride(prev=>({...(prev||{titre:day.label,abs:day.abs}),exercises:newExos}));
    setShowPicker(null);setFullScreenEx(null);setFocusIdx(null);setShowCircuit(false);setModeOverride("classique");
  };

  const handleFeedbackSave=(fb)=>{
    // IMPORTANT: reutilise le "day"/"exos" du rendu principal (pilotes par la sequence session_index),
    // ne JAMAIS recalculer une version independante basee sur le jour de la semaine (bug precedent:
    // divergence entre la seance reellement affichee/jouee et celle enregistree/comptee comme faite).
    const sDateLocal=programDate(dayIdx);
    if(fb&&fb.photo){
      const shot=fb.photo; delete fb.photo;
      // La photo de fin de seance part dans Storage ; la base ne garde que son chemin.
      if(user?.id) (async()=>{
        try{
          const path=await uploadPhoto(user.id,sDateLocal,await dataUrlToBlob(shot));
          updateConfig({photos:{...photos,[sDateLocal]:path}});
        }catch(e){ console.error("photo seance:",e&&e.message); }
      })();
    }
    let totalKg=0,totalSets=0;
    const bodyWeight=Number(profile&&profile.weight_kg)||0;
    const exercisesData=exos.map(ex=>{
      const prefix=`${sDate}_${ex.id}_s`;
      // On balaie les series REELLEMENT enregistrees, au lieu d'un nombre attendu. En EMOM/AMRAP
      // "sets" n'est pas un nombre (les exos portent repsPerRound / repsPerMinute) : l'ancien
      // repli sur 4 plafonnait donc silencieusement le comptage a 4 tours, et tout tour au-dela
      // etait perdu, en volume comme en series.
      const planned=typeof ex.sets==="number"?ex.sets:0;
      const logged=Object.keys(log).reduce((mx,k)=>{
        if(k.indexOf(prefix)!==0) return mx;
        const i=parseInt(k.slice(prefix.length),10);
        return (isNaN(i)||i+1<=mx)?mx:i+1;
      },0);
      const n=Math.max(planned,logged);
      const defReps=parseFloat(String(ex.reps||"8").split("–")[0])||8;
      let completedSets=0,topWeight=0;
      const setsDetail=[];
      for(let i=0;i<n;i++){
        const e=log[`${prefix}${i}`];
        if(!e||!e.done) continue;
        // Charge effective pour le tonnage : la charge additionnelle, ou la fraction de poids
        // de corps deplacee. La charge ENREGISTREE reste 0 au poids de corps, pour ne pas
        // polluer les records avec un chiffre qui n'a pas ete souleve.
        const w=Number(e.weight)||0;
        const wEff=w>0?w:bodyLoadKg(ex,bodyWeight);
        const r=Number(e.reps)||defReps;
        completedSets++;
        if(w>topWeight) topWeight=w;
        totalKg+=wEff*r;
        totalSets++;
        // Detail conserve serie par serie : seule facon de revoir la montee en charge d'une
        // seance. L'ancien format n'en gardait que la charge maximale, le reste etait jete.
        setsDetail.push({i,weight:w,reps:r});
      }
      // La structure du jour (superset, circuit, tag EMOM/AMRAP) n'etait PAS sauvegardee :
      // une seance close se reaffichait donc integralement a plat, en classique, quel qu'ait
      // ete son agencement reel. On la conserve avec l'exercice.
      // RPE ressenti, saisi en fin d'exercice : c'est lui qui pilote la charge de la prochaine fois.
      const rpeLog=log[`${sDate}_${ex.id}_rpe`];
      return{id:ex.id,n:ex.n||ex.name,m:ex.m||ex.muscle,weight:topWeight,reps:defReps,completedSets,setsDetail,
        ...(rpeLog&&rpeLog.rpe?{rpe:Number(rpeLog.rpe)}:{}),
        ...(ex.groupType?{groupType:ex.groupType,circuitId:ex.circuitId,circuitPos:ex.circuitPos,circuitSize:ex.circuitSize,groupTours:ex.groupTours}:{}),
        ...(ex.modeTag?{modeTag:ex.modeTag}:{}),
        ...(ex.blockIdx!=null?{blockIdx:ex.blockIdx}:{})};
    });
    // Duree figee UNE fois ici : elle doit etre identique en local, dans le state et en base,
    // et ne pas dependre de l'etat du chrono au moment ou l'ecriture Supabase part.
    const durationSec=clock.sec;
    // Prescrit du jour : sans lui le score ne peut se mesurer qu'a des valeurs absolues.
    const targetSets=exos.reduce((a,e)=>a+((e.groupTours>0)?e.groupTours:((typeof e.sets==="number"&&e.sets>0)?e.sets:4)),0);
    // Le prescrit doit compter le poids de corps comme le realise, sinon le rapport
    // realise/prescrit du score depasse mecaniquement 1 sur toute seance au poids de corps.
    const targetKg=Math.round(exos.reduce((a,e)=>{
      const bwl=bodyLoadKg(e,bodyWeight);
      return a+setPlanFor(e).reduce((b,st)=>b+((Number(st.w)||0)||bwl)*(repsNum(st.reps)||0),0);
    },0));
    const score=computeScore(totalKg,totalSets,fb,{sets:targetSets,kg:targetKg});
    // Date = jour du programme (ex: LUN = date du lundi de cette semaine)
    const entry={
      day:day.day,
      dayLabel:aiOverride?.titre||day.label,
      date:sDate,
      exercises:exercisesData,
      totalKg:Math.round(totalKg),
      totalSets,
      targetKg,targetSets,
      duration:durationSec,
      score,
      feedback:fb,
      user_id:user?.id,
      sessionIndex:sessionIndex+1,
      mode:sessionMode,
      weights:{...weights,...Object.fromEntries(exercisesData.filter(e=>e.weight>0).map(e=>[e.id,e.weight]))}
    };
    // avance la sequence du programme (uniquement si ce jour est un jour d'entrainement pris en compte dans la file)
    if(day?.salle&&!programDone){
      const nextIdx=sessionIndex+1;
      updateConfig({session_index:nextIdx});
    }
    // 1. (l'ancien cache local des seances a disparu : la table sessions fait foi)
    const uid=user?.id;
    // 2. State React
    setSessions(prev=>{
      const next=[...prev.filter(s=>s.date!==sDate),entry];
      computeStreak(next);
      return next;
    });
    // 3. Fermer popup immédiatement
    // reset (et pas stop) : "stop" laissait le compteur a sa valeur, si bien que la seance
    // suivante demarrait avec le temps de la precedente et que le bouton Demarrer,
    // conditionne a sec===0, ne relancait jamais rien.
    clock.reset();
    setSessionActive(false);
    setShowFeedback(false);
    setShowReport(entry);
    // 4. Supabase en arrière-plan
    if(uid){
      // exercises/feedback en JSON natif : JSON.stringify dans une colonne jsonb produisait
      // une CHAINE de JSON, inexploitable en SQL sans deballage. Le lecteur accepte les deux.
      enqueue(`session:${sDate}`,"séance",()=>supabase.from("sessions").upsert({
        user_id:uid,date:sDate,week:"S"+wk,
        day:day.day,day_label:entry.dayLabel,
        session_type:entry.dayLabel,
        session_index:entry.sessionIndex,
        mode:sessionMode,
        total_kg:Math.round(totalKg),total_sets:totalSets,
        target_kg:targetKg,target_sets:targetSets,
        duration_seconds:durationSec,score,completed:true,
        exercises:exercisesData,
        feedback:fb,
        notes:fb.notes||""
      },{onConflict:"user_id,date"}));
      // Un record ne se remplace que s'il est BATTU. L'upsert ecrasait sans comparer : la
      // seance du 30/07 avait ainsi detruit trois records (16 -> 10 kg). Et les reps etaient
      // codees a 8 quel que soit le reel, donc tous les 1RM estimes etaient faux.
      const pbRows=exercisesData
        .filter(e=>e.weight>0&&e.completedSets>0&&e.weight>(Number(weights[e.id])||0))
        .map(e=>({
          user_id:uid,exercise_id:e.id,exercise_name:e.n||e.name||"",
          weight_kg:e.weight,reps:e.reps||8,one_rm:orm(e.weight,String(e.reps||8)),achieved_at:sDate
        }));
      if(pbRows.length) enqueue(`pb:${sDate}`,"records",()=>supabase.from("personal_bests").upsert(pbRows,{onConflict:"user_id,exercise_id"}));
    }
  };


  useEffect(()=>{
    if(!profile) return;
    const tdpw=(schedule||[]).filter(d=>d&&d.salle).length||(profile?.frequency||4);
    const expected=12*tdpw;
    // Plus de garde sur session_index===0 : la longueur du programme est une constante, elle doit
    // etre remise d'aplomb a tout moment, pas seulement avant la premiere seance.
    if(profile.total_sessions!==PROGRAM_SESSIONS){ updateConfig({total_sessions:PROGRAM_SESSIONS}); }
  },[profile,schedule]);

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
    const prof={id:uid,name:user?.user_metadata?.name||null,goal:data.goal,level:data.level,equipment:data.equipment,frequency:data.frequency,weight_kg:data.weight_kg,program_start:data.programStart||todayKey(),session_index:0,total_sessions:PROGRAM_SESSIONS,updated_at:new Date().toISOString()};
    setProfile(prof);
    persist(uid,{schedule:sched,profile:prof});
    try{await supabase.from("profiles").upsert(prof,{onConflict:"id"});}catch(e){console.error("profile",e);}
  }}/>;
  const redoOnboarding=async(data)=>{
    const uid=user.id;
    const sched=generateSchedule(data.frequency);
    setSchedule(sched);
    const next={...profile,goal:data.goal,level:data.level,equipment:data.equipment,frequency:data.frequency,weight_kg:data.weight_kg,program_start:data.programStart||todayKey(),session_index:0,total_sessions:PROGRAM_SESSIONS,updated_at:new Date().toISOString()};
    setProfile(next);
    persist(uid,{schedule:sched,profile:next});
    try{await supabase.from("profiles").upsert({id:uid,goal:next.goal,level:next.level,equipment:next.equipment,frequency:next.frequency,weight_kg:next.weight_kg,program_start:next.program_start,session_index:0,total_sessions:next.total_sessions,updated_at:next.updated_at},{onConflict:"id"});}catch(e){console.error("profile redo",e);}
    setShowOnboardingRedo(false);
  };

  const sessionIndex=profile?.session_index||0;
  const trainingDaysPerWeek=(schedule||[]).filter(d=>d&&d.salle).length||(profile?.frequency||4);
  const expectedTotalSessions=PROGRAM_SESSIONS;
  const totalSessions=profile?.total_sessions||PROGRAM_SESSIONS;
  // La phase avance avec les SEANCES effectuees, plus avec le calendrier : a 3 seances par
  // semaine on affichait "S12/12" pendant les 24 dernieres seances du programme.
  const sessionWeek=Math.min(PROG_WEEKS,Math.max(1,Math.floor(sessionIndex/SESSIONS_PER_BLOCK)+1));
  const programDone=sessionIndex>=totalSessions;
  const isViewingToday=dayIdx===todayIdx();
  const rawDay0=viewSchedule[dayIdx]||PROGRAM[dayIdx];
  const tabDate=programDate(dayIdx);
  const isDayDone=sessions.some(s=>s.date===tabDate);
  const doneSession=isDayDone?sessions.find(s=>s.date===tabDate):null;
  const isBeforeProgramStart=!!(profile?.program_start&&tabDate<profile.program_start);
  const pendingTemplate=(!programDone&&!isBeforeProgramStart)?pendingSessionFor(profile?.goal||"hybride",sessionIndex,profile?.equipment):null;
  // Une journee DEJA ENREGISTREE s'affiche telle qu'elle a ete faite : intitule, muscles et
  // exercices viennent de la seance sauvegardee, qui est la seule verite sur ce qui s'est passe
  // ce jour-la. Auparavant l'entete etait toujours recalculee - depuis la seance suivante en
  // attente si on etait sur aujourd'hui, sinon depuis le planning hebdomadaire fige. Une
  // journee travaillee pouvait donc s'afficher sous le nom d'une autre seance, et carrement en
  // "Recuperation / Generer une seance legere" quand le planning disait Repos ce jour-la.
  const doneDay=(isDayDone&&doneSession)?(()=>{
    // Un exercice ENREGISTRE porte weight / completedSets / reps, alors que tout l'affichage
    // attend kg / sets / reps d'un exercice PRESCRIT. Sans cette remise en forme, toutes les
    // charges d'une seance terminee s'affichaient en "PdC" (poids du corps) - un Romanian
    // Deadlift a 87,5 kg apparaissait comme fait au poids de corps.
    const dex=(doneSession.exercises||[]).map(e=>({...e,
      kg:(e.kg!=null?Number(e.kg):(Number(e.weight)||0)),
      sets:((typeof e.sets==="number"&&e.sets>0)?e.sets:(Number(e.completedSets)||0)),
      reps:(e.reps!=null?String(e.reps):(e.reps||"")),
    }));
    const mus=[...new Set(dex.map(e=>e&&e.m).filter(Boolean))].slice(0,3).join(" · ");
    return{
      day:rawDay0?.day||doneSession.day||"",
      label:doneSession.dayLabel||doneSession.day_label||doneSession.session_type||"Séance",
      muscle:mus||rawDay0?.muscle||"",
      salle:rawDay0?.salle||"full",
      exercises:dex,abs:[],
    };
  })():null;
  const day0=doneDay||(isBeforeProgramStart?{...REST_TPL,day:rawDay0?.day}:(isViewingToday&&rawDay0?.salle&&pendingTemplate)?(()=>{let c={...pendingTemplate,day:rawDay0.day};if(profile?.equipment?.length)c=adaptEquip(c,profile.equipment);c=personalizeDay(c,profile,sessionWeek,perf);return c;})():rawDay0);
  // Seance "aujourd'hui" pour la page Accueil : DOIT utiliser la meme logique de sequence que day0 ci-dessus,
  // independamment de l'onglet jour actuellement affiche (dayIdx peut pointer vers un autre jour que aujourd'hui).
  const todaySessionForHome=(()=>{
    const trIdx=todayIdx();
    const trRaw=viewSchedule[trIdx]||PROGRAM[trIdx];
    const trDate=programDate(trIdx);
    const trBeforeStart=!!(profile?.program_start&&trDate<profile.program_start);
    if(trBeforeStart) return {...REST_TPL,day:trRaw?.day};
    if(!trRaw?.salle||programDone||!pendingTemplate) return trRaw;
    let c={...pendingTemplate,day:trRaw.day};
    if(profile?.equipment?.length) c=adaptEquip(c,profile.equipment);
    c=personalizeDay(c,profile,sessionWeek,perf);
    return c;
  })();
  const effMode=isDayDone?(doneSession?.mode||"classique"):(modeOverride||day0?.recommendedMode||"classique");
  const sessionMode=effMode;
  // Une journee close n'est pas re-derivee : applyMode regenererait un metcon (blocs, tours,
  // exercices tires au sort) par-dessus une seance deja faite.
  const day=isDayDone?day0:applyMode(day0,effMode,profile,sessionWeek,dayIdx,perf);
  const sDate=tabDate;
  const isPastMissed=!!(day?.salle&&!isDayDone&&new Date(sDate+"T00:00:00")<new Date(new Date().toDateString()));
  const locked=isDayDone||isPastMissed;
  const isRest=!day?.salle;
  // Pour une journee close on part de doneDay (exercices enregistres REMIS EN FORME : kg issu
  // de weight, sets issu de completedSets) et non de doneSession.exercises brut. Lire la base
  // directement ici court-circuitait toute la normalisation : d'ou les charges affichees en
  // "PdC" et les blocs perdus, alors meme que la mise en forme existait juste au-dessus.
  const exos=((isDayDone&&doneDay)?(doneDay.exercises||[]):(aiOverride?.exercises||day?.exercises||[])).filter(e=>!excluded.includes(e.id));
  // Le badge n'annoncait que le mode principal : une seance classique comportant des supersets
  // s'affichait "Classique" tout court, y compris une fois terminee. L'agencement reel est
  // desormais lisible, et il survit a la cloture puisqu'il est sauvegarde avec les exercices.
  // Les exercices exclus sont retires APRES la constitution des groupes : un superset dont un
  // membre est exclu se retrouvait avec un seul exercice tout en gardant son etiquette, et
  // s'affichait comme un "Superset" d'un seul mouvement. On degroupe ce qui n'a plus de sens.
  (()=>{
    const n={};
    exos.forEach(e=>{ if(e&&e.circuitId) n[e.circuitId]=(n[e.circuitId]||0)+1; });
    exos.forEach(e=>{ if(e&&e.circuitId&&n[e.circuitId]<2){ delete e.circuitId; delete e.groupType; delete e.circuitPos; delete e.circuitSize; } });
  })();
  const groupKind=(exos||[]).reduce((g,e)=>g||((e&&e.groupType)||null),null);
  // Le badge annoncait "Classique + Superset" meme quand TOUS les exercices etaient
  // groupes : il n'y avait alors plus rien de classique dans la seance.
  const modeLabel=(()=>{
    const base=sessionMode==="amrap"?"AMRAP":sessionMode==="emom"?"EMOM":"Classique";
    if(sessionMode!=="classique"||!groupKind) return base;
    const nGrouped=(exos||[]).filter(e=>e&&e.groupType).length;
    const label=groupKind==="circuit"?"Circuit":"Superset";
    return (nGrouped>0&&nGrouped===exos.length)?label:`${base} + ${label}`;
  })();
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
        @keyframes sheetIn{from{opacity:0;transform:translateY(28px) scale(.985)}to{opacity:1;transform:none}}
        @keyframes stateIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){
          *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
        }
        @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes slideTabRight{from{opacity:0;transform:translateX(40px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes slideTabLeft{from{opacity:0;transform:translateX(-40px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes sheetOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(22px) scale(.98)}}
        @keyframes riseIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes dropIn{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
        @keyframes popIn{0%{transform:scale(.7);opacity:.4}60%{transform:scale(1.14)}100%{transform:scale(1);opacity:1}}
        @keyframes shimmer{from{background-position:-360px 0}to{background-position:360px 0}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        textarea::placeholder,input::placeholder{color:${C.ink4};}
        ::-webkit-scrollbar{display:none;}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:"rgba(255,255,255,.92)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:`1px solid ${C.s3}`,position:"sticky",top:0,zIndex:Z.sticky}}>
        <div style={{maxWidth:600,margin:"0 auto",padding:`calc(14px + env(safe-area-inset-top)) 20px 12px`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.04em"}}>SŌMA</div>
            <div style={{fontSize:10,fontWeight:600,color:C.ink4,letterSpacing:".16em",textTransform:"uppercase"}}>{"S"+wk+" · "}{user?.user_metadata?.name||"Athlète"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {pending>0&&<span title="Enregistrement en attente de réseau" style={{fontSize:12,fontWeight:600,color:C.ink3,background:C.s2,padding:"3px 10px",borderRadius:980,marginRight:8}}>⟳ {pending}</span>}
            {sessionActive&&(clock.running||clock.sec>0)&&<span style={{fontSize:15,fontWeight:700,color:C.red}}>{fmtDur(clock.sec)}</span>}
            {streak>0&&<span style={{fontSize:13,fontWeight:600,color:C.ink,padding:"4px 12px",borderRadius:980,background:C.s2}}>{streak}j</span>}
            {sbReady&&<div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>}
          </div>
        </div>
      </div>

      {/* DAY STRIP */}
      {tab==="seance"&&(
        <div style={{background:C.bg,borderBottom:`1px solid ${C.s3}`}}>
        <div style={{maxWidth:600,margin:"0 auto",display:"flex",overflowX:"auto",padding:"10px 16px",gap:6,scrollbarWidth:"none"}}>
          {viewSchedule.map((d,i)=>{
            const exList=d.exercises||[];
            const dStrDate=programDate(i);
            // Meme regle que dans la liste d'exercices : on compte ce qui est enregistre, on ne
            // teste pas des indices deduits d'un nombre de series suppose (4 par defaut).
            const done=exList.filter(e=>{
              const tgt=(e.groupTours>0)?e.groupTours:((typeof e.sets==="number"&&e.sets>0)?e.sets:4);
              const c=Object.keys(log||{}).reduce((a,k)=>(k.indexOf(`${dStrDate}_${e.id}_s`)===0&&log[k]&&log[k].done)?a+1:a,0);
              return c>=tgt;
            }).length;
            const pct=exList.length?done/exList.length:0;
            const dayFullyDone=sessions.some(s=>s.date===dStrDate);
            const isSel=i===dayIdx,isToday=i===todayIdx();
            return(
              <Tap key={i} onTap={()=>{setDayIdx(i);setAiOverride(null);setDayCons(null);setModeOverride(null);setCircuitStart(0);setSupBlock(null);}} style={{flexShrink:0,minWidth:52,padding:"10px 6px",textAlign:"center",borderRadius:12,background:isSel?C.s2:"transparent",border:`1px solid ${isSel?C.s4:"transparent"}`,transition:`all 200ms ${EO}`}}>
                <div style={{fontSize:10,fontWeight:600,color:isSel?C.ink2:C.ink4,letterSpacing:".06em",marginBottom:4}}>{d.day}</div>
                {isToday&&!dayFullyDone&&<div style={{width:6,height:6,borderRadius:"50%",background:C.lime,margin:"0 auto 4px"}}/>}
                {dayFullyDone?(
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent||C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{margin:"0 auto",display:"block"}}><path d="M20 6L9 17l-5-5"/></svg>
                ):(d.salle&&pct>0&&<div style={{width:"70%",height:2,background:C.s4,borderRadius:1,margin:"0 auto"}}>
                  <div style={{width:`${pct*100}%`,height:2,background:accent,borderRadius:1,transition:`width 400ms ${EO}`}}/>
                </div>)}
              </Tap>
            );
          })}
        </div>
        </div>
      )}

      {/* CONTENT */}
      <div style={{paddingBottom:80}}>
        <TabContent tab={tab} prevTab={prevTab}>
          {tab==="home"&&<HomeTab profile={profile} streak={streak} sessions={sessions} weights={weights} todaySession={todaySessionForHome} accent={accent} trainingDaysPerWeek={trainingDaysPerWeek} weighIns={weighIns} onSaveWeighIn={saveWeighIn} onStartToday={()=>{setDayIdx(todayIdx());switchTab("seance");}}/>}
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
                    <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:8}}>{day.day} · {"S"+wk} · {day.salle==="haut"?"Salle Haute":"Salle Basse"}{totalSessions>0&&day.salle&&` · Séance ${Math.min(sessionIndex+1,totalSessions)}/${totalSessions}`}</div>
                    <div style={{fontSize:34,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:8}}>{aiOverride?.titre||day.label}</div>
                    <div style={{fontSize:17,color:C.ink3}}>{day.muscle}</div>
                    {day.salle&&(()=>{const pw=sessionWeek;const ph12=PHASES12[pw-1];const pend=progEndDate(profile?.program_start);return(
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
                      ):isPastMissed?null:(
                        <Tap onTap={()=>{setSessionActive(true);if(!clock.running&&clock.sec===0)clock.start();}} style={{flex:1,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
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
                  {day.salle&&!locked&&(profile?.active_skills||[]).length>0&&sessionIndex%2===0&&(profile.active_skills.map(as=>{
                    const sk=SKILLS_CATALOG.find(s=>s.id===as.skillId);
                    if(!sk) return null;
                    const step=sk.steps[as.stepIndex]||sk.steps[sk.steps.length-1];
                    const doneToday=as.lastAssessedDate===sDate;
                    const assess=(success)=>{
                      const next=(profile.active_skills||[]).map(x=>{
                        if(x.skillId!==as.skillId) return x;
                        if(!success) return {...x,successCount:0,lastAssessedDate:sDate};
                        const newCount=(x.successCount||0)+1;
                        if(newCount>=SUCCESS_TO_ADVANCE&&x.stepIndex<sk.steps.length-1){
                          return {...x,stepIndex:x.stepIndex+1,successCount:0,lastAssessedDate:sDate};
                        }
                        return {...x,successCount:newCount,lastAssessedDate:sDate};
                      });
                      updateConfig({active_skills:next});
                    };
                    return(
                      <div key={as.skillId} style={{marginBottom:16,padding:"14px 16px",borderRadius:14,background:C.s1,border:`1px solid ${C.s3}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{sk.icon}</svg>
                          <span style={{fontSize:12,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".08em"}}>Apprentissage · {sk.name} · Étape {as.stepIndex+1}/{sk.steps.length}</span>
                        </div>
                        <div style={{fontSize:16,fontWeight:700,color:C.ink,marginBottom:2}}>{step.label}</div>
                        <div style={{fontSize:13,color:C.ink4,marginBottom:12}}>{step.target}</div>
                        {doneToday?(
                          <div style={{fontSize:13,fontWeight:600,color:C.blue}}>Validé aujourd'hui ✓</div>
                        ):(
                          <div style={{display:"flex",gap:8}}>
                            <Tap onTap={()=>assess(false)} style={{flex:1,padding:"10px",borderRadius:10,background:C.s2,textAlign:"center"}}><span style={{fontSize:13,fontWeight:600,color:C.ink3}}>Pas encore</span></Tap>
                            <Tap onTap={()=>assess(true)} style={{flex:1,padding:"10px",borderRadius:10,background:C.blue,textAlign:"center"}}><span style={{fontSize:13,fontWeight:700,color:"#000"}}>Ça passe</span></Tap>
                          </div>
                        )}
                      </div>
                    );
                  }))}
                  {day.salle&&<div style={{marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:sessionMode==="classique"?0:10}}><span style={{fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>Séance du jour</span><span style={{fontSize:11,fontWeight:800,color:"#000",background:C.blue,padding:"2px 9px",borderRadius:7,textTransform:"uppercase",letterSpacing:".06em"}}>{modeLabel}</span></div>
                    {sessionMode!=="classique"&&!locked&&<Tap onTap={()=>setShowCircuit(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px",borderRadius:12,background:C.blueDim,border:`1px solid ${C.blue}`}}><span style={{fontSize:15}}>⏱</span><span style={{fontSize:15,fontWeight:700,color:C.blue}}>Démarrer le circuit {sessionMode==="amrap"?"AMRAP":"EMOM"}</span></Tap>}
                  </div>}
                  <div>
                    {day.metcon&&!locked&&<div style={{marginBottom:16}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:13,fontWeight:700,color:C.ink}}>Séance {sessionMode==="amrap"?"AMRAP":"EMOM"} · {day.blocks.length} blocs</span><span style={{fontSize:13,fontWeight:700,color:"#000",background:C.blue,padding:"2px 10px",borderRadius:8}}>~{day.totalMin} min</span></div><div style={{fontSize:12,color:C.ink4,marginBottom:10}}>Touchez un bloc pour le démarrer</div>{day.blocks.map((bl,bi)=>(<Tap key={bi} onTap={()=>{if(locked)return;setCircuitStart(bi);setShowCircuit(true);}} style={{marginBottom:12,background:C.s1,borderRadius:14,padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:14,fontWeight:800,color:C.ink}}>{bl.label}</span><span style={{fontSize:12,fontWeight:600,color:C.ink3}}>{bl.kind==="emom"?bl.durationMin+" min · "+bl.rounds+" tours":bl.durationMin+" min"}</span></div>{bl.exercises.map((ex,ei)=>(<div key={ei} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderTop:ei?`1px solid ${C.s2}`:"none"}}><span style={{fontSize:14,color:C.ink2}}>{bl.kind==="emom"?("Min "+(ei+1)+" · "):""}{ex.n}</span><span style={{fontSize:13,fontWeight:600,color:C.ink3}}>{ex.kg>0?ex.kg+"kg · ":""}{ex.reps}{bl.kind==="emom"?"/min":"/tour"}</span></div>))}</Tap>))}</div>}
                    {!day.metcon&&groupBlocks(exos,effMode).map((blk,bi)=>(
                      <div key={bi} style={{marginBottom:16}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingLeft:2}}>
                          <span style={{fontSize:11,fontWeight:700,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>{blk.muscle}</span>
                          <span style={{fontSize:11,fontWeight:600,color:C.ink4}}>{blk.items.length} exo{blk.items.length>1?"s":""}</span>{blk.groupType&&<span style={{fontSize:10,fontWeight:700,color:"#000",background:C.blue,padding:"1px 7px",borderRadius:6,textTransform:"uppercase",letterSpacing:".08em"}}>{blk.groupType==="circuit"?"Circuit":blk.groupType==="amrap"?"AMRAP":blk.groupType==="emom"?"EMOM":"Superset"}</span>}
                        </div>
                        {blk.groupType&&blk.groupType!=="amrap"&&blk.groupType!=="emom"&&!locked&&<Tap onTap={()=>setSupBlock({label:blk.muscle,kind:blk.groupType==="circuit"?"circuit":"superset",exercises:blk.items.map(x=>x.ex),restSec:(blk.items[0]&&blk.items[0].ex&&blk.items[0].ex.groupRest)||90,tours:(blk.items[0]&&blk.items[0].ex&&blk.items[0].ex.sets)||4})} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:12,background:C.blueDim,border:`1px solid ${C.blue}`,marginBottom:10}}><span style={{fontSize:14,fontWeight:700,color:C.blue}}>Démarrer le {blk.groupType==="circuit"?"circuit":"superset"}</span></Tap>}
                        <div style={{paddingLeft:12,borderLeft:`2px solid ${C.s3}`}}>
                          {blk.items.map(({ex,idx})=>(
                            <ExerciseRowCollapsed key={ex.id} ex={ex} idx={idx} dayIdx={dayIdx} sDate={sDate} log={log} doneSession={doneSession}
                              onOpen={()=>{if(locked)return;if(sessionMode!=="classique"){setShowCircuit(true);return;}const _e=exos[idx];if(_e&&_e.circuitId){const _g=exos.filter(e=>e.circuitId===_e.circuitId);setSupBlock({label:_e.m||"Superset",kind:_g.length>=3?"circuit":"superset",exercises:_g,restSec:(_g[0]&&_g[0].groupRest)||90,tours:(_g[0]&&(_g[0].groupTours||_g[0].sets))||4});}else{setFocusIdx(idx);}}} onReplace={e=>setShowPicker(e)} onOriginY={setFocusOrigin}/>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
                  {!sessionActive&&!locked&&(
                    <Tap onTap={()=>setShowFeedback(true)} style={{marginTop:28,marginBottom:16,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:17,fontWeight:600,color:"#000"}}>Fin de séance</span>
                    </Tap>
                  )}
                </>
              )}
            </div>
          )}
          {tab==="stats"&&<><div style={{padding:"20px 20px 0",maxWidth:600,margin:"0 auto"}}><WeightChart weighIns={weighIns} accent={accent}/></div><StatsTab sessions={sessions} weights={weights} accent={accent} trainingDaysPerWeek={trainingDaysPerWeek} profile={profile} pinnedPBs={profile?.pinned_pbs} onManagePBs={()=>setShowPBManager(true)} activeSkills={profile?.active_skills} onManageSkills={()=>setShowSkillManager(true)} onOpenRewards={()=>setShowRewardsManager(true)}/><HistoryTab sessions={sessions} onSelect={setShowReport} accent={accent} onOpenPhotos={()=>setShowPhotos(true)} photos={photos} urls={photoUrls}/></>}
          {tab==="settings"&&<SettingsTab user={user} excluded={excluded} onToggleExclude={toggleExclude} onOpenLibrary={()=>setShowLibrary(true)} profile={profile} schedule={schedule} avatarUrl={avatarUrl} onUpdateConfig={updateConfig} onOpenScheduleEditor={()=>setShowSched(true)} onRedoOnboarding={()=>setShowOnboardingRedo(true)}
            onSignOut={async()=>{await supabase.auth.signOut();setUser(null);setLog({});setWeights({});setSessions([]);setExcluded([]);setStreak(0);}}
            onReset={async()=>{
              const uid=user?.id;
              purgeLegacy(uid); // au cas ou un reste d'avant la migration traine encore
              setLog({});setWeights({});setSessions([]);setExcluded([]);setStreak(0);
              loadingRef.current=null;
              if(uid){
                try{
                  await Promise.all([
                    supabase.from("sessions").delete().eq("user_id",uid),
                    supabase.from("personal_bests").delete().eq("user_id",uid),
                    supabase.from("streaks").delete().eq("user_id",uid),
                    supabase.from("active_session").delete().eq("user_id",uid),
                  ]);
                }catch(e){console.error("reset SB",e);}
              }
            }}
          />}
        </TabContent>
      </div>

      {showOnboardingRedo&&<OnboardingScreen user={user} onDone={redoOnboarding} onClose={()=>setShowOnboardingRedo(false)}/>}
      {showPBManager&&<PBManagerSheet sessions={sessions} pinnedPBs={profile?.pinned_pbs} onSave={(sel)=>updateConfig({pinned_pbs:sel})} onClose={()=>setShowPBManager(false)}/>}
      {showSkillManager&&<SkillManagerSheet activeSkills={profile?.active_skills} onSave={(sel)=>updateConfig({active_skills:sel})} onClose={()=>setShowSkillManager(false)}/>}
      {showRewardsManager&&<RewardsManagerSheet sessions={sessions} onClose={()=>setShowRewardsManager(false)}/>}
      {/* Overlays plein ecran sortis du wrapper anime (position:fixed casse sous un ancetre avec transform) */}
      {focusIdx!=null&&exos[focusIdx]&&(
        <ExerciseFocus key={exos[focusIdx].id} ex={exos[focusIdx]} idx={focusIdx} count={exos.length} dayIdx={dayIdx} sDate={sDate}
          log={log} onLogSet={saveLog} onDetail={e=>setDetailEx(e)} lastPerf={perf[exos[focusIdx].id]} originY={focusOrigin}
          onClose={()=>setFocusIdx(null)} hasNext={focusIdx<exos.length-1} onNext={()=>{
            const _n=exos[focusIdx+1];
            if(_n&&_n.circuitId){
              const _g=exos.filter(e=>e.circuitId===_n.circuitId);
              setFocusIdx(null);
              setSupBlock({label:_n.m||"Superset",kind:_g.length>=3?"circuit":"superset",exercises:_g,restSec:(_g[0]&&_g[0].groupRest)||90,tours:(_g[0]&&(_g[0].groupTours||_g[0].sets))||4});
            }else{
              setFocusIdx(focusIdx+1);
            }
          }}/>
      )}
      {supBlock&&<CircuitPlayer mode={supBlock.kind} exos={supBlock.exercises} blocks={[supBlock]} onClose={()=>setSupBlock(null)} onAllDone={()=>{}} log={log} onLogSet={saveLog} sDate={sDate}/>}
      {showCircuit&&sessionMode!=="classique"&&exos.length>0&&(
        <CircuitPlayer mode={sessionMode} exos={exos} blocks={day.blocks} defMin={sessionMode==="amrap"?(day.timeCapMin||12):(day.emomMinutes||Math.max(exos.length,8))} onClose={()=>setShowCircuit(false)} onAllDone={()=>{clock.stop();setShowFeedback(true);}} startBlock={circuitStart} log={log} onLogSet={saveLog} sDate={sDate}/>
      )}

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:Z.sticky+10,background:"rgba(255,255,255,.96)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`1px solid ${C.s3}`}}>
        <div style={{maxWidth:600,margin:"0 auto",display:"flex",paddingBottom:"env(safe-area-inset-bottom)"}}>
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
      </div>

      {/* OVERLAYS — z-index ordering per semantic scale */}
      {showRestFull&&<RestFullScreen timer={rest} label={restLabel} onSkip={()=>{rest.stop();setShowRestFull(false);}} onClose={()=>{rest.reset();setShowRestFull(false);}}/>}
      {!showRestFull&&rest.sec>0&&<MiniRest timer={rest} label={restLabel} onExpand={()=>setShowRestFull(true)}/>}
      {detailEx&&<ExerciseSheet ex={detailEx} fav={favorites.includes(detailEx.id)} onToggleFav={toggleFav} onClose={()=>setDetailEx(null)} sessions={sessions}/>}
      {showFeedback&&<FeedbackSheet onClose={()=>setShowFeedback(false)} onSave={handleFeedbackSave}/>}
      {showSettings&&<SessionSettingsSheet day={day} curMode={effMode} onClose={()=>setShowSettings(false)} onApply={({mode,cons})=>{setModeOverride(mode);setDayCons(cons);setShowSettings(false);}}/>}
      {showAI&&<AISheet onClose={()=>setShowAI(false)} onResult={o=>{setAiOverride(o);setShowAI(false);}} excluded={excluded}/>}
      {showPhotos&&<PhotoProgress uid={user?.id} photos={photos} urls={photoUrls} onClose={()=>setShowPhotos(false)} onSavePhotos={(map)=>updateConfig({photos:map})}/>}
      {showTimer&&<IntervalTimer onClose={()=>setShowTimer(false)}/>}
      {showPicker&&<ExPicker onSelect={newEx=>handleReplaceEx(showPicker,newEx)} onClose={()=>setShowPicker(null)} currentId={showPicker.id} excluded={excluded}/>}
      {showLibrary&&<LibraryTab favorites={favorites} onToggleFav={toggleFav} onClose={()=>setShowLibrary(false)} sessions={sessions}/>}
      {showReport&&<SessionReport session={showReport} sessions={sessions} trainingDaysPerWeek={trainingDaysPerWeek} photoUrl={photoUrls[showReport.date]} onClose={()=>setShowReport(null)} onDelete={deleteSession}/>}
      {showSched&&<ScheduleEditor schedule={schedule}
        onChange={ns=>{setSchedule(ns);persist(user?.id,{schedule:ns});}}
        onReset={()=>{setSchedule(PROGRAM);persist(user?.id,{schedule:PROGRAM});}}
        autoRotate={autoRotate}
        onToggleAuto={()=>setAutoRotate(v=>{const nv=!v;persist(user?.id,{autoRotate:nv});return nv;})}
        onClose={()=>setShowSched(false)}/>}
    </div>
  );
}
