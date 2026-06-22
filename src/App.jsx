import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "./supabase.js";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Apple dark system + Emil micro-interactions + Impeccable rules
// OKLCH-inspired palette. One accent. No border-left hacks. No nested cards.
// Letter-spacing floor: -0.03em on display. Body: 17px/1.47.
const C = {
  bg:      "#000000",
  s1:      "#0A0A0A",
  s2:      "#111111",
  s3:      "#1C1C1E",
  s4:      "#2C2C2E",
  div:     "#38383A",
  ink:     "#FFFFFF",
  ink2:    "rgba(255,255,255,.86)",
  ink3:    "rgba(255,255,255,.60)",
  ink4:    "rgba(255,255,255,.36)",
  ink5:    "rgba(255,255,255,.18)",
  blue:    "#2997FF",
  blueDim: "rgba(41,151,255,.16)",
  green:   "#30D158",
  greenDim:"rgba(48,209,88,.14)",
  red:     "#FF453A",
  redDim:  "rgba(255,69,58,.14)",
  orange:  "#FF9F0A",
  orDim:   "rgba(255,159,10,.14)",
  lime:    "#A3E635",   // brand — ONE use
  purple:  "#BF5AF2",
  purDim:  "rgba(191,90,242,.14)",
};

const F = "system-ui,-apple-system,'SF Pro Display',sans-serif";

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
const weekNumber = () => { const now=new Date(); const t=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()); const epoch=Date.UTC(2026,0,5); return Math.max(0,Math.floor((t-epoch)/604800000)); };
const MESO = [ {k:"Volume",s:1,g:"Series hautes, tempo controle"}, {k:"Intensite",s:0,g:"Charges lourdes, reps basses"}, {k:"Puissance",s:0,g:"Explosif, repos longs"}, {k:"Deload",s:-1,g:"Recuperation, charges legeres"} ];
const phaseOf = (w) => MESO[((w%4)+4)%4];
const primaryMuscle = (m) => String(m||"").split("\u00b7")[0].trim().toLowerCase();
const altPool = (ex) => DB.filter(e=>e.id!==ex.id && e.eq===ex.eq && primaryMuscle(e.m)===primaryMuscle(ex.m));
const rotateDay = (day,w) => {
  if(!day || !day.salle) return day;
  const ph=phaseOf(w);
  const exercises=(day.exercises||[]).map((ex,i)=>{
    const pool=[ex,...altPool(ex)];
    const pick=pool[(w+i)%pool.length];
    const base=typeof ex.sets==="number"?ex.sets:4;
    return {...pick,sets:Math.max(2,Math.min(6,base+ph.s))};
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
function ExFullScreen({ex,weight,onWeightChange,log,onLogSet,onStartRest,onClose,lastKg,accent,dayIdx}) {
  const sets=typeof ex.sets==="number"?ex.sets:4;
  const lk=`d${dayIdx}_${ex.id}`;
  const done=Array.from({length:sets},(_,i)=>!!log[`${lk}_s${i}`]?.done);
  const completed=done.filter(Boolean).length;
  const allDone=sets>0&&completed===sets;
  const kg=weight??ex.kg??0;
  const oneRM=orm(kg,ex.reps);

  const [reps,setReps]=useState(()=>{const m=String(ex.reps||"").match(/\d+/);return m?parseInt(m[0]):10;});
  const handleSet=i=>{
    const newDone=!done[i];
    onLogSet(`${lk}_s${i}`,{done:newDone,weight:kg,reps,date:todayKey()});
    if(newDone&&ex.rest>0) onStartRest(ex.rest,ex.n);
  };

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",fontFamily:F,animation:`fadeIn 200ms ${EO} both`,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.s3}`}}>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:13,fontWeight:600,color:C.ink3}}>✕</span>
        </Tap>
        <div style={{fontSize:13,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{completed}/{sets}</div>
        <div style={{width:40}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 20px"}}>
        <div style={{fontSize:36,fontWeight:700,color:allDone?C.green:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:10,transition:`color 300ms ${EO}`}}>{ex.n}</div>
        <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
          <span style={{fontSize:14,color:C.ink3}}>{ex.m}</span>
          <span style={{color:C.s4}}>·</span>
          <span style={{fontSize:13,fontWeight:600,padding:"2px 10px",borderRadius:980,background:C.s2,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span>
        </div>
        {lastKg>0&&<div style={{padding:"12px 16px",borderRadius:12,background:C.orDim,marginBottom:20}}>
          <span style={{fontSize:14,fontWeight:600,color:C.orange}}>Dernière fois : {lastKg}kg · Essaie {lastKg+2.5}kg</span>
        </div>}
        {/* Weight */}
        <div style={{background:C.s2,borderRadius:18,padding:"20px",marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Charge</div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <Tap onTap={()=>onWeightChange(ex.id,Math.max(0,kg-2.5))} style={{width:56,height:56,borderRadius:14,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:28,fontWeight:300,color:C.ink}}>−</span>
            </Tap>
            <div style={{flex:1,textAlign:"center"}}>
              <span style={{fontSize:52,fontWeight:700,color:C.ink,letterSpacing:"-.03em"}}>{kg===0?"BW":`${kg}`}</span>
              {kg>0&&<span style={{fontSize:24,fontWeight:300,color:C.ink3}}> kg</span>}
            </div>
            <Tap onTap={()=>onWeightChange(ex.id,kg+2.5)} style={{width:56,height:56,borderRadius:14,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:28,fontWeight:300,color:C.ink}}>+</span>
            </Tap>
          </div>
        </div>
        {/* Reps */}
        <div style={{background:C.s2,borderRadius:18,padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Reps effectuées</div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <Tap onTap={()=>setReps(r=>Math.max(1,r-1))} style={{width:44,height:44,borderRadius:12,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:24,fontWeight:300,color:C.ink}}>−</span></Tap>
            <span style={{fontSize:30,fontWeight:700,color:C.ink,minWidth:42,textAlign:"center"}}>{reps}</span>
            <Tap onTap={()=>setReps(r=>r+1)} style={{width:44,height:44,borderRadius:12,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:24,fontWeight:300,color:C.ink}}>+</span></Tap>
          </div>
        </div>
        {/* Cue */}
        {ex.cue&&<div style={{padding:"16px",borderRadius:14,background:C.s2,marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Cue technique</div>
          <div style={{fontSize:15,color:C.ink2,lineHeight:1.65}}>{ex.cue}</div>
        </div>}
        {/* RPE */}
        <div style={{fontSize:12,color:C.ink4,marginBottom:12}}>RPE cible : {ex.rpe}/10</div>
        {/* Set buttons — 64px */}
        <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:14}}>{sets} séries · {ex.reps} reps{ex.rest>0?` · ${ex.rest>=60?`${ex.rest/60}min`:`${ex.rest}s`} repos`:""}</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {Array.from({length:sets},(_,i)=>(
            <Tap key={i} onTap={()=>handleSet(i)} style={{width:64,height:64,borderRadius:16,border:`2px solid ${done[i]?C.green:C.div}`,background:done[i]?C.greenDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",transition:`all 220ms ${EO}`}}>
              <span style={{fontSize:22,fontWeight:700,color:done[i]?C.green:C.ink4}}>{i+1}</span>
            </Tap>
          ))}
        </div>
        {ex.rest>0&&<Tap onTap={()=>onStartRest(ex.rest,ex.n)} style={{marginTop:16,padding:"13px 20px",borderRadius:14,border:`1px solid ${C.div}`,background:"transparent",display:"inline-flex",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:600,color:C.ink3}}>Démarrer repos · {ex.rest>=60?`${ex.rest/60}min`:`${ex.rest}s`}</span>
        </Tap>}
      </div>
    </div>
  );
}

// ─── EXERCISE ROW ─────────────────────────────────────────────────────────────
function ExRow({ex,weight,onWeightChange,log,onLogSet,onStartRest,idx,lastKg,onFullScreen,dayIdx}) {
  const sets=typeof ex.sets==="number"?ex.sets:4;
  const lk=`d${dayIdx}_${ex.id}`;
  const done=Array.from({length:sets},(_,i)=>!!log[`${lk}_s${i}`]?.done);
  const completed=done.filter(Boolean).length;
  const allDone=sets>0&&completed===sets;
  const kg=weight??ex.kg??0;
  const oneRM=orm(kg,ex.reps);

  const handleSet=i=>{
    onLogSet(`${lk}_s${i}`,{done:!done[i],weight:kg,date:todayKey()});
    if(!done[i]&&ex.rest>0) onStartRest(ex.rest,ex.n);
  };

  return(
    <div style={{borderBottom:`1px solid ${C.s3}`,animation:`fadeSlideIn 280ms ${EO} ${idx*35}ms both`}}>
      <Tap onTap={()=>onFullScreen(ex)} style={{padding:"16px 0 10px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,border:`2px solid ${allDone?C.green:C.div}`,background:allDone?C.greenDim:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:`all 250ms ${EO}`}}>
          <span style={{fontSize:13,fontWeight:700,color:allDone?C.green:C.ink4}}>{completed}/{sets}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:8,marginBottom:3,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:17,fontWeight:600,color:allDone?C.ink4:C.ink,textDecoration:allDone?"line-through":"none",transition:`color 250ms ${EO}`}}>{ex.n}</span>
            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:14,color:C.ink3}}>{sets}×{ex.reps}</span>
            <span style={{color:C.s4}}>·</span>
            <span style={{fontSize:14,color:C.ink3}}>{ex.m}</span>
            {lastKg>0&&<span style={{fontSize:12,fontWeight:600,color:C.orange}}>↑{lastKg}kg</span>}
          </div>
        </div>
        {ex.rest>0&&<span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:980,background:C.s3,color:C.ink4,flexShrink:0}}>{ex.rest>=60?`${ex.rest/60}′`:`${ex.rest}″`}</span>}
        <span style={{color:C.ink5,fontSize:12,flexShrink:0}}>▶</span>
      </Tap>
      {/* Set buttons — 56px in list */}
      <div style={{paddingBottom:14,display:"flex",gap:8,flexWrap:"wrap"}}>
        {Array.from({length:sets},(_,i)=>(
          <Tap key={i} onTap={()=>handleSet(i)} style={{width:56,height:56,borderRadius:14,border:`1.5px solid ${done[i]?C.green:C.div}`,background:done[i]?C.greenDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",transition:`all 200ms ${EO}`}}>
            <span style={{fontSize:17,fontWeight:700,color:done[i]?C.green:C.ink4}}>{i+1}</span>
          </Tap>
        ))}
        {ex.rest>0&&<Tap onTap={()=>onStartRest(ex.rest,ex.n)} style={{height:56,padding:"0 14px",borderRadius:14,border:`1.5px solid ${C.div}`,background:"transparent",display:"flex",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:600,color:C.ink4}}>Repos</span>
        </Tap>}
      </div>
    </div>
  );
}

// ─── PROGRESSION CHART (mini line graph) ─────────────────────────────────────
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
  const IL=["","Très léger","Léger","Modéré","Intense","Maximum"];
  const EL=["","Épuisé","Fatigué","Normal","Énergisé","Au top"];
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
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes libres..."
          style={{width:"100%",minHeight:60,padding:"12px 16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,resize:"none",outline:"none",marginBottom:20,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{...bs,flex:1,background:C.s2,color:C.ink3}}>Annuler</button>
          <button onClick={()=>onSave({global:intensity,energy,notes})} style={{...bs,flex:2,background:C.blue,color:"#000"}}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION REPORT ───────────────────────────────────────────────────────────
function SessionReport({session,onClose,onDelete}) {
  if(!session) return null;
  const{totalKg=0,totalSets=0,duration=0,exercises=[],date="",dayLabel="",score=0,feedback}=session;
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
function StatsTab({sessions,weights,accent}) {
  const[selEx,setSelEx]=useState(null);
  const total=sessions.length,totalKg=sessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const avgScore=total?Math.round(sessions.reduce((a,s)=>a+(s.score||0),0)/total):0;
  const pbs=Object.entries(weights).map(([id,kg])=>{const ex=DB.find(e=>e.id===id);if(!ex)return null;return{...ex,pbKg:kg,oneRM:orm(kg,ex.reps)};}).filter(Boolean).sort((a,b)=>(b.oneRM||0)-(a.oneRM||0));
  const progressData=useMemo(()=>{
    if(!selEx) return [];
    return sessions.filter(s=>s.weights?.[selEx]).map(s=>({date:s.date.slice(5),v:s.weights[selEx]})).slice(-8);
  },[selEx,sessions]);
  const volumeByWeek=useMemo(()=>{
    const weeks={};sessions.forEach(s=>{const w=s.date.slice(0,7);weeks[w]=(weeks[w]||0)+(s.totalKg||0);});
    return Object.entries(weeks).slice(-8).map(([w,v])=>({date:w.slice(5),v:Math.round(v/1000)}));
  },[sessions]);

  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      <WeekSummary sessions={sessions} accent={accent}/>
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
        {selEx?<ProgressLine data={progressData} color={C.green} height={56}/>:<div style={{height:56,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.ink4}}>Sélectionne un exercice</div>}
      </div>
      {/* PBs */}
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>Personal Bests</div>
      {pbs.length===0?<div style={{textAlign:"center",padding:"32px 0",fontSize:17,color:C.ink4}}>Log des charges pour voir tes PBs.</div>:
        pbs.map((pb,i)=>(
          <div key={i} style={{background:C.s1,borderRadius:14,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{pb.n}</div>
              <div style={{fontSize:13,color:C.ink3}}>{pb.m}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:20,fontWeight:700,color:C.ink}}>{pb.pbKg===0?"BW":`${pb.pbKg}kg`}</div>
              {pb.oneRM&&<div style={{fontSize:12,fontWeight:600,color:C.blue}}>1RM ~{pb.oneRM}kg</div>}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab({sessions,onSelect,accent}) {
  const[view,setView]=useState(new Date());
  const y=view.getFullYear(),m=view.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const off=first===0?6:first-1;
  const MN=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const DN=["L","M","M","J","V","S","D"];
  const dates=sessions.map(s=>s.date);
  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      <WeekSummary sessions={sessions} accent={accent}/>
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

function SettingsTab({user,excluded,onToggleExclude,onSignOut,onReset}) {
  const[showLib,setShowLib]=useState(false);
  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      {/* Profile card */}
      <div style={{background:C.s1,borderRadius:20,padding:"24px",marginBottom:16,display:"flex",alignItems:"center",gap:18}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontSize:22,fontWeight:700,color:"#000"}}>{(user?.user_metadata?.name||user?.email||"U")[0].toUpperCase()}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:19,fontWeight:600,color:C.ink,marginBottom:3}}>{user?.user_metadata?.name||"Athlète"}</div>
          <div style={{fontSize:14,color:C.ink3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.email||""}</div>
        </div>
      </div>
      {/* Compte */}
      <div style={{background:C.s1,borderRadius:16,overflow:"hidden",marginBottom:12}}>
        <Tap onTap={onSignOut} style={{padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:17,color:C.ink}}>Se déconnecter</span>
          <span style={{fontSize:17,color:C.blue}}>›</span>
        </Tap>
      </div>
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
      <div style={{fontSize:12,color:C.ink4,textAlign:"center",marginTop:28}}>SŌMA · S14 · Auth Supabase · {DB.length} exercices</div>
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

// ─── ONBOARDING (epic A) ────────────────────────────────
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

function OnboardingScreen({user,onDone}) {
  const [step,setStep]=useState(0);
  const [goal,setGoal]=useState(null);
  const [level,setLevel]=useState(null);
  const [equip,setEquip]=useState([]);
  const [freq,setFreq]=useState(4);
  const [weight,setWeight]=useState("");
  const [saving,setSaving]=useState(false);
  const GOALS=[["force","Force","Soulever plus lourd"],["endurance","Endurance","Tenir plus longtemps"],["hybride","Hybride","Force + condition"],["seche","Perte de gras","Bruler, rester sec"]];
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
  const[tab,setTab]=useState("seance");
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
  const[showReport,setShowReport]=useState(null);
  const[showPicker,setShowPicker]=useState(null);
  const[fullScreenEx,setFullScreenEx]=useState(null);
  const[showRestFull,setShowRestFull]=useState(false);
  const[restLabel,setRestLabel]=useState("");
  const[sbReady,setSbReady]=useState(false);
  const[accent,setAccent]=useState(C.blue);
  const clock=useStopwatch();
  const rest=useCountdown(()=>setShowRestFull(true));
  const wk=weekNumber();
  const viewSchedule=useMemo(()=>autoRotate?schedule.map(d=>rotateDay(d,wk)):schedule,[schedule,autoRotate,wk]);

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

  const switchTab=useCallback(id=>{setPrevTab(tab);setTab(id);},[tab]);

  const handleStartRest=(s,n)=>{setRestLabel(n);rest.start(s);setShowRestFull(true);};

  const handleReplaceEx=(replaced,newEx)=>{
    const day=viewSchedule[dayIdx]||PROGRAM[dayIdx];
    const src=aiOverride?.exercises||day.exercises||[];
    const newExos=src.map(ex=>ex.id===replaced.id?{...newEx,sets:ex.sets}:ex);
    setAiOverride(prev=>({...(prev||{titre:day.label,abs:day.abs}),exercises:newExos}));
    setShowPicker(null);setFullScreenEx(null);
  };

  const handleFeedbackSave=(fb)=>{
    const day=viewSchedule[dayIdx]||PROGRAM[dayIdx];
    const sDate=programDate(dayIdx);
    const exos=aiOverride?.exercises||day.exercises||[];
    let totalKg=0,totalSets=0;
    const exercisesData=exos.map(ex=>{
      const s=typeof ex.sets==="number"?ex.sets:4;
      let completedSets=0,lastWeight=0;
      Array.from({length:s},(_,i)=>{
        const e=log[`d${dayIdx}_${ex.id}_s${i}`];
        if(e?.done){completedSets++;lastWeight=e.weight||0;const r=Number(e.reps)||parseFloat(String(ex.reps||"8").split("–")[0])||8;totalKg+=lastWeight*r;totalSets++;}
      });
      return{id:ex.id,n:ex.n||ex.name,m:ex.m||ex.muscle,weight:lastWeight,completedSets};
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
      weights:{...weights}
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
    const prof={id:uid,name:user?.user_metadata?.name||null,goal:data.goal,level:data.level,equipment:data.equipment,frequency:data.frequency,weight_kg:data.weight_kg,updated_at:new Date().toISOString()};
    setProfile(prof);
    persist(uid,{schedule:sched,profile:prof});
    try{await supabase.from("profiles").upsert(prof,{onConflict:"id"});}catch(e){console.error("profile",e);}
  }}/>;
  if(showWelcome) return(<WelcomeScreen user={user} todaySession={viewSchedule[todayIdx()]||PROGRAM[todayIdx()]} streak={streak} onStart={()=>{setShowWelcome(false);setDayIdx(todayIdx());}} onSkip={()=>setShowWelcome(false)}/>);

  const day=viewSchedule[dayIdx]||PROGRAM[dayIdx];
  const sDate=programDate(dayIdx);
  const isDayDone=sessions.some(s=>s.date===sDate&&s.day===day?.day);
  const isRest=!day?.salle;
  const exos=(aiOverride?.exercises||day?.exercises||[]).filter(e=>!excluded.includes(e.id));
  const absExos=aiOverride?.abs||day?.abs||[];
  const NAV=[{id:"seance",l:"Séance"},{id:"stats",l:"Stats"},{id:"history",l:"Historique"},{id:"settings",l:"Réglages"}];

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
              <Tap key={i} onTap={()=>{setDayIdx(i);setAiOverride(null);}} style={{flexShrink:0,minWidth:52,padding:"10px 6px",textAlign:"center",borderRadius:12,background:isSel?C.s2:"transparent",border:`1px solid ${isSel?C.s4:"transparent"}`,transition:`all 200ms ${EO}`}}>
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
          {tab==="seance"&&(
            <div style={{padding:"16px 20px 0",maxWidth:600,margin:"0 auto"}}>
              {isRest?(
                <div style={{textAlign:"center",padding:"80px 20px"}}>
                  <div style={{fontSize:36,fontWeight:700,color:C.ink4,letterSpacing:"-.02em",marginBottom:14}}>Récupération</div>
                  <div style={{fontSize:17,color:C.ink4,lineHeight:1.65,maxWidth:300,margin:"0 auto 28px"}}>{dayIdx===3?"Récupération active. Tes fibres consolident.":"Reset total. Synthèse protéique prioritaire."}</div>
                  <Tap onTap={()=>setShowAI(true)} style={{display:"inline-flex",padding:"13px 24px",borderRadius:980,border:`1px solid ${C.div}`,background:"transparent"}}>
                    <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Générer une séance légère</span>
                  </Tap>
                </div>
              ):(
                <>
                  <div style={{marginBottom:20}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:8}}>{day.day} · {"S"+wk} · {day.salle==="haut"?"Salle Haute":"Salle Basse"}</div>
                    <div style={{fontSize:34,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:8}}>{aiOverride?.titre||day.label}</div>
                    <div style={{fontSize:17,color:C.ink3}}>{day.muscle}</div>
                    {autoRotate&&day.salle&&<div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:8,padding:"5px 12px",borderRadius:980,background:C.s2}}><span style={{fontSize:11,fontWeight:700,color:C.blue,letterSpacing:".05em",textTransform:"uppercase"}}>{phaseOf(wk).k}</span><span style={{fontSize:12,color:C.ink4}}>{phaseOf(wk).g}</span></div>}
                  </div>
                  {!sessionActive?(
                    <div style={{display:"flex",gap:10,marginBottom:24}}>
                      {isDayDone?(
                        <div style={{flex:1,padding:"16px",borderRadius:15,background:C.greenDim,border:`1px solid ${C.green}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:17,fontWeight:600,color:C.green}}>Séance terminée ✓</span>
                        </div>
                      ):(
                        <Tap onTap={()=>{setSessionActive(true);}} style={{flex:1,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <span style={{fontSize:17,fontWeight:600,color:"#000"}}>Démarrer</span>
                        </Tap>
                      )}
                      <Tap onTap={()=>setShowAI(true)} style={{padding:"16px 20px",borderRadius:15,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:14,fontWeight:600,color:C.ink3}}>IA</span>
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
                      <Tap onTap={()=>setShowAI(true)} style={{padding:"15px 16px",borderRadius:15,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:13,fontWeight:600,color:C.ink3}}>IA</span>
                      </Tap>
                    </div>
                  )}
                  <div style={{paddingLeft:16,borderLeft:`2px solid ${C.s3}`,marginBottom:24}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Échauffement · 8 min</div>
                    <div style={{fontSize:14,color:C.ink3,lineHeight:1.75}}>{day.salle==="haut"?"Rotations épaules · Wall slide · Push-up to downdog · Mobilité thoracique":"Corde 3min · Hip circle · Leg swing · KB Swing léger ×10"}</div>
                  </div>
                  <div style={{borderTop:`1px solid ${C.s3}`}}>
                    {exos.map((ex,i)=>(
                      <ExRow key={ex.id} ex={ex} idx={i}
                        weight={weights[ex.id]??ex.kg??0}
                        onWeightChange={saveWeight}
                        log={log}
                        onLogSet={saveLog}
                        onStartRest={handleStartRest}
                        lastKg={lastKgPerEx[ex.id]||0}
                        onFullScreen={ex=>setFullScreenEx(ex)}
                        dayIdx={dayIdx}
                      />
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
                  {!sessionActive&&!isDayDone&&(
                    <Tap onTap={()=>setShowFeedback(true)} style={{marginTop:28,marginBottom:16,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:17,fontWeight:600,color:"#000"}}>Fin de séance</span>
                    </Tap>
                  )}
                </>
              )}
            </div>
          )}
          {tab==="stats"&&<StatsTab sessions={sessions} weights={weights} accent={accent}/>}
          {tab==="history"&&<HistoryTab sessions={sessions} onSelect={setShowReport} accent={accent}/>}
          {tab==="settings"&&<SettingsTab user={user} excluded={excluded} onToggleExclude={toggleExclude}
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
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:Z.sticky+10,background:"rgba(0,0,0,.92)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`1px solid ${C.s3}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {NAV.map(({id,l})=>(
          <Tap key={id} onTap={()=>switchTab(id)} style={{flex:1,padding:"10px 4px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{width:20,height:2,borderRadius:1,background:tab===id?accent:"transparent",marginBottom:2,transition:`background 250ms ${EO}`}}/>
            <span style={{fontSize:11,fontWeight:tab===id?600:400,color:tab===id?C.ink:C.ink4,transition:`color 250ms ${EO}`}}>{l}</span>
          </Tap>
        ))}
      </div>

      {/* OVERLAYS — z-index ordering per semantic scale */}
      {showRestFull&&<RestFullScreen timer={rest} label={restLabel} onSkip={()=>{rest.stop();setShowRestFull(false);}} onClose={()=>{rest.reset();setShowRestFull(false);}}/>}
      {!showRestFull&&rest.sec>0&&<MiniRest timer={rest} label={restLabel} onExpand={()=>setShowRestFull(true)}/>}
      {fullScreenEx&&<ExFullScreen ex={fullScreenEx} weight={weights[fullScreenEx.id]??fullScreenEx.kg??0} onWeightChange={saveWeight} log={log} onLogSet={saveLog} onStartRest={handleStartRest} onClose={()=>setFullScreenEx(null)} lastKg={lastKgPerEx[fullScreenEx.id]||0} accent={accent} dayIdx={dayIdx}/>}
      {showFeedback&&<FeedbackSheet onClose={()=>setShowFeedback(false)} onSave={handleFeedbackSave}/>}
      {showAI&&<AISheet onClose={()=>setShowAI(false)} onResult={o=>{setAiOverride(o);setShowAI(false);}} excluded={excluded}/>}
      {showPicker&&<ExPicker onSelect={newEx=>handleReplaceEx(showPicker,newEx)} onClose={()=>setShowPicker(null)} currentId={showPicker.id} excluded={excluded}/>}
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
