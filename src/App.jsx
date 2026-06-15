import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const sb = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;
const USER_ID = "mascaptain";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg: "#000000", surface: "#0A0A0A", surface2: "#111111", surface3: "#1A1A1A",
  border: "#1F1F1F", border2: "#2A2A2A",
  ink: "#FFFFFF", ink80: "rgba(255,255,255,.80)", ink48: "rgba(255,255,255,.48)",
  ink24: "rgba(255,255,255,.24)", ink12: "rgba(255,255,255,.12)",
  accent: "#0A84FF", accentDim: "rgba(10,132,255,.15)",
  lime: "#A3E635",
  green: "#30D158", greenDim: "rgba(48,209,88,.12)",
  red: "#FF453A", redDim: "rgba(255,69,58,.12)",
  orange: "#FF9F0A", orangeDim: "rgba(255,159,10,.12)",
};
const F = "system-ui, -apple-system, 'SF Pro Display', sans-serif";
const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const EASE_D = "cubic-bezier(0.32, 0.72, 0, 1)";

// ─── EXERCISE DATABASE ───────────────────────────────────────────────────────
// 200+ exercises across all equipment types
const EXERCISE_DB = [
  // ── KETTLEBELL (20+) ──────────────────────────────────────────────────────
  { id: "kb01", name: "Swing KB deux mains",        muscle: "Fessiers · Ischios", equipment: "kettlebell", type: "compound", defaultKg: 20, defaultReps: "15", defaultRest: 60,  cue: "Poussée de hanches explosive. Dos neutre. Le KB monte à hauteur d'épaules." },
  { id: "kb02", name: "Swing KB unilatéral",         muscle: "Fessiers · Core",    equipment: "kettlebell", type: "compound", defaultKg: 16, defaultReps: "10", defaultRest: 60,  cue: "Même mécanique que le swing deux mains. Résiste à la rotation du tronc." },
  { id: "kb03", name: "Clean KB",                    muscle: "Full body",           equipment: "kettlebell", type: "compound", defaultKg: 16, defaultReps: "8",  defaultRest: 90,  cue: "KB tracte sur le côté du corps. La cloche vient se loger en rack sans impact sur le poignet." },
  { id: "kb04", name: "Clean & Press KB",            muscle: "Épaules · Full body", equipment: "kettlebell", type: "compound", defaultKg: 14, defaultReps: "6",  defaultRest: 120, cue: "Clean + press strictement vertical. Core serré à la poussée." },
  { id: "kb05", name: "Push Press KB",               muscle: "Épaules · Jambes",   equipment: "kettlebell", type: "compound", defaultKg: 16, defaultReps: "8",  defaultRest: 90,  cue: "Légère impulsion des jambes, bras verrouillé en haut. Descente lente." },
  { id: "kb06", name: "Snatch KB",                   muscle: "Full body",           equipment: "kettlebell", type: "compound", defaultKg: 12, defaultReps: "5",  defaultRest: 120, cue: "Du sol au lockout en un mouvement. Punch vers le haut en fin de trajectoire." },
  { id: "kb07", name: "Half Snatch KB",              muscle: "Épaules · Full body", equipment: "kettlebell", type: "compound", defaultKg: 14, defaultReps: "6",  defaultRest: 90,  cue: "Snatch jusqu'en rack, redescente en rack puis swing. Rythme constant." },
  { id: "kb08", name: "Turkish Get-Up",              muscle: "Full body · Core",    equipment: "kettlebell", type: "compound", defaultKg: 12, defaultReps: "3",  defaultRest: 120, cue: "KB verrouillé bras tendu tout le long. 7 étapes distinctes. Lent et contrôlé." },
  { id: "kb09", name: "Gobelet Squat KB",            muscle: "Quads · Fessiers",   equipment: "kettlebell", type: "compound", defaultKg: 20, defaultReps: "12", defaultRest: 90,  cue: "KB tenu contre la poitrine. Coudes entre les genoux en bas. Sous la parallèle." },
  { id: "kb10", name: "Gobelet Squat KB profond",    muscle: "Quads · Mobilité",   equipment: "kettlebell", type: "compound", defaultKg: 16, defaultReps: "10", defaultRest: 90,  cue: "Position basse tenue 2 sec. Travail de mobilité de cheville et hanche." },
  { id: "kb11", name: "Halo KB",                     muscle: "Épaules · Core",     equipment: "kettlebell", type: "isolation", defaultKg: 10, defaultReps: "10", defaultRest: 60,  cue: "Orbite complète autour de la tête. Core anti-rotation. Lent." },
  { id: "kb12", name: "Around the World KB",         muscle: "Core · Épaules",     equipment: "kettlebell", type: "isolation", defaultKg: 12, defaultReps: "8",  defaultRest: 60,  cue: "Passage fluide d'une main à l'autre dans le plan frontal." },
  { id: "kb13", name: "Farmer Carry KB",             muscle: "Trapèzes · Core",    equipment: "kettlebell", type: "compound", defaultKg: 24, defaultReps: "40m", defaultRest: 90, cue: "Épaules en arrière et basses. Marche droite, regard horizontal." },
  { id: "kb14", name: "Rack Walk KB",                muscle: "Core · Épaules",     equipment: "kettlebell", type: "compound", defaultKg: 20, defaultReps: "30m", defaultRest: 90, cue: "KB en position rack. Tronc anti-rotation. Résiste à l'inclinaison latérale." },
  { id: "kb15", name: "Row KB unilatéral",           muscle: "Dos · Biceps",       equipment: "kettlebell", type: "compound", defaultKg: 20, defaultReps: "10", defaultRest: 90,  cue: "Coude tracte vers la hanche. Rétraction omoplate avant de tirer." },
  { id: "kb16", name: "Deadlift KB",                 muscle: "Ischios · Fessiers", equipment: "kettlebell", type: "compound", defaultKg: 24, defaultReps: "8",  defaultRest: 90,  cue: "Hanches en charnière. KB reste entre les pieds. Dos neutre absolu." },
  { id: "kb17", name: "Sumo Deadlift KB",            muscle: "Fessiers · Adducteurs", equipment: "kettlebell", type: "compound", defaultKg: 24, defaultReps: "10", defaultRest: 90, cue: "Stance large. Genoux poussés vers l'extérieur. Descente verticale du KB." },
  { id: "kb18", name: "Figure 8 KB",                 muscle: "Core · Épaules",     equipment: "kettlebell", type: "compound", defaultKg: 14, defaultReps: "10", defaultRest: 60,  cue: "Transfert entre les jambes en figure 8. Dos neutre à chaque passage." },
  { id: "kb19", name: "Windmill KB",                 muscle: "Core · Épaules",     equipment: "kettlebell", type: "compound", defaultKg: 12, defaultReps: "5",  defaultRest: 90,  cue: "KB verrouillé en haut. Rotation de hanche pure. Regard sur le KB." },
  { id: "kb20", name: "Floor Press KB",              muscle: "Pecs · Triceps",     equipment: "kettlebell", type: "compound", defaultKg: 16, defaultReps: "10", defaultRest: 90,  cue: "Allongé au sol. Coude à 45°. Amplitude réduite mais tension maximale." },
  { id: "kb21", name: "Complex KB (Swing+Clean+Press+Squat)", muscle: "Full body", equipment: "kettlebell", type: "compound", defaultKg: 14, defaultReps: "5",  defaultRest: 120, cue: "4 mouvements enchaînés = 1 répétition. Rythme constant. Qualité avant vitesse." },
  { id: "kb22", name: "EMOM Swing KB",               muscle: "Full body",           equipment: "kettlebell", type: "cardio",   defaultKg: 20, defaultReps: "20", defaultRest: 30,  cue: "20 swings toutes les minutes. Repos = temps restant dans la minute." },
  { id: "kb23", name: "Pass Under KB",               muscle: "Core · Fessiers",    equipment: "kettlebell", type: "compound", defaultKg: 14, defaultReps: "10", defaultRest: 60,  cue: "KB passe sous le genou levé. Transfert propre d'une main à l'autre." },
  { id: "kb24", name: "Deadlift KB unilatéral",      muscle: "Ischios · Équilibre", equipment: "kettlebell", type: "compound", defaultKg: 20, defaultReps: "8",  defaultRest: 90, cue: "Charnière hanche sur une jambe. KB descend le long de la jambe d'appui." },
  { id: "kb25", name: "Press KB strictement assis",  muscle: "Épaules · Core",     equipment: "kettlebell", type: "isolation", defaultKg: 12, defaultReps: "8",  defaultRest: 90, cue: "Assis en tailleur. Aucune aide des jambes. Teste ta force brute d'épaule." },

  // ── BARBELL ───────────────────────────────────────────────────────────────
  { id: "bb01", name: "Développé couché barre",      muscle: "Pecs",               equipment: "barbell", type: "compound", defaultKg: 60,  defaultReps: "5",    defaultRest: 240, cue: "Pause 1 sec sur la poitrine. Pas de rebond. Pouces autour de la barre." },
  { id: "bb02", name: "Développé militaire barre",   muscle: "Épaules",            equipment: "barbell", type: "compound", defaultKg: 40,  defaultReps: "5",    defaultRest: 180, cue: "Core serré. Barre passe devant le menton. Verrouillage complet en haut." },
  { id: "bb03", name: "Squat barre",                 muscle: "Quads · Fessiers",   equipment: "barbell", type: "compound", defaultKg: 80,  defaultReps: "5",    defaultRest: 240, cue: "Sous la parallèle. Regard à 45°. Genoux dans l'axe des orteils." },
  { id: "bb04", name: "Front Squat barre",           muscle: "Quads · Core",       equipment: "barbell", type: "compound", defaultKg: 60,  defaultReps: "5",    defaultRest: 240, cue: "Coudes hauts. Torse vertical. Mobilité de poignet indispensable." },
  { id: "bb05", name: "Soulevé de terre conv.",      muscle: "Full body",           equipment: "barbell", type: "compound", defaultKg: 100, defaultReps: "3",    defaultRest: 300, cue: "Dos neutre absolu. Barre collée aux tibias. Poussée du sol, pas tirage." },
  { id: "bb06", name: "Soulevé de terre roumain",    muscle: "Ischios · Fessiers", equipment: "barbell", type: "compound", defaultKg: 70,  defaultReps: "8",    defaultRest: 180, cue: "Charnière hanche pure. Barre le long des cuisses. Ressens l'étirement ischios." },
  { id: "bb07", name: "Hip Thrust barre",            muscle: "Fessiers",           equipment: "barbell", type: "compound", defaultKg: 80,  defaultReps: "10",   defaultRest: 150, cue: "Dos sur le banc, barre sur les hanches. Extension complète en haut." },
  { id: "bb08", name: "Rowing barre pronation",      muscle: "Dos épais",          equipment: "barbell", type: "compound", defaultKg: 60,  defaultReps: "8",    defaultRest: 150, cue: "Buste à 45°. Barre tirée vers le nombril. Rétraction omoplates." },
  { id: "bb09", name: "Curl barre EZ",               muscle: "Biceps",             equipment: "barbell", type: "isolation", defaultKg: 30, defaultReps: "10",   defaultRest: 90,  cue: "Coudes fixes. 3 sec descente. Supination prononcée en haut." },
  { id: "bb10", name: "Skull Crusher barre EZ",      muscle: "Triceps",            equipment: "barbell", type: "isolation", defaultKg: 25, defaultReps: "10",   defaultRest: 90,  cue: "Coudes immobiles. Descente vers le front. Extension explosive." },
  { id: "bb11", name: "Good Morning barre",          muscle: "Ischios · Lombaires", equipment: "barbell", type: "compound", defaultKg: 40, defaultReps: "8",    defaultRest: 120, cue: "Genoux légèrement fléchis. Charnière hanche. Dos neutre impératif." },
  { id: "bb12", name: "Power Clean",                 muscle: "Full body",           equipment: "barbell", type: "compound", defaultKg: 50, defaultReps: "3",    defaultRest: 180, cue: "Triple extension hanche/genou/cheville. Tirage haut, coulissement sous la barre." },

  // ── DUMBBELL ──────────────────────────────────────────────────────────────
  { id: "db01", name: "Développé couché haltères",   muscle: "Pecs",               equipment: "dumbbell", type: "compound", defaultKg: 24, defaultReps: "10",   defaultRest: 120, cue: "Rotation interne en haut. Descente coudes à 45°." },
  { id: "db02", name: "Développé incliné haltères",  muscle: "Pecs sup",           equipment: "dumbbell", type: "compound", defaultKg: 20, defaultReps: "10",   defaultRest: 120, cue: "Banc à 30°. Focus sur la contraction en haut." },
  { id: "db03", name: "Curl haltères alternés",      muscle: "Biceps",             equipment: "dumbbell", type: "isolation", defaultKg: 14, defaultReps: "10",  defaultRest: 90,  cue: "Supination complète. Coudes fixes. 3 sec descente." },
  { id: "db04", name: "Curl marteau haltères",       muscle: "Biceps · Brachial",  equipment: "dumbbell", type: "isolation", defaultKg: 16, defaultReps: "10",  defaultRest: 90,  cue: "Prise neutre. Coudes fixes. Monte jusqu'à l'épaule." },
  { id: "db05", name: "Curl incliné haltères",       muscle: "Biceps long",        equipment: "dumbbell", type: "isolation", defaultKg: 12, defaultReps: "10",  defaultRest: 90,  cue: "Banc incliné à 60°. Stretch maximal en bas. Concentration totale." },
  { id: "db06", name: "Rowing haltère unilatéral",   muscle: "Dos épais",          equipment: "dumbbell", type: "compound", defaultKg: 24, defaultReps: "10",   defaultRest: 90,  cue: "Coude tracte vers la hanche. Omoplate rétractée avant de tirer." },
  { id: "db07", name: "Élévations latérales",        muscle: "Deltoïdes lat.",     equipment: "dumbbell", type: "isolation", defaultKg: 10, defaultReps: "15",  defaultRest: 75,  cue: "Légère flexion coude. Montée jusqu'à horizontal. Descente en 3 sec." },
  { id: "db08", name: "Oiseau inversé haltères",     muscle: "Rear delt",          equipment: "dumbbell", type: "isolation", defaultKg: 8,  defaultReps: "15",  defaultRest: 60,  cue: "Buste horizontal. Pincement omoplates en haut. Évite le momentum." },
  { id: "db09", name: "Arnold Press",                muscle: "Épaules complet",    equipment: "dumbbell", type: "compound", defaultKg: 14, defaultReps: "10",   defaultRest: 90,  cue: "Rotation de la pronation à la supination pendant le press. Amplitude complète." },
  { id: "db10", name: "Développé militaire haltères", muscle: "Épaules",           equipment: "dumbbell", type: "compound", defaultKg: 18, defaultReps: "10",   defaultRest: 90,  cue: "Coudes à 90° en bas. Extension complète sans hyperextension lombaire." },
  { id: "db11", name: "Pullover haltère",            muscle: "Grand dorsal · Pecs", equipment: "dumbbell", type: "compound", defaultKg: 20, defaultReps: "12",  defaultRest: 90,  cue: "Arc de cercle du front derrière la tête. Côtes fermées. Étirement maximal." },
  { id: "db12", name: "RDL haltères",                muscle: "Ischios · Fessiers", equipment: "dumbbell", type: "compound", defaultKg: 22, defaultReps: "10",   defaultRest: 120, cue: "Charnière hanche. Haltères le long des cuisses. Dos neutre." },
  { id: "db13", name: "Fentes marchées haltères",    muscle: "Quads · Fessiers",   equipment: "dumbbell", type: "compound", defaultKg: 16, defaultReps: "12",   defaultRest: 90,  cue: "Genou avant à 90°, genou arrière effleure le sol. Tronc vertical." },
  { id: "db14", name: "Gobelet Squat haltère",       muscle: "Quads · Fessiers",   equipment: "dumbbell", type: "compound", defaultKg: 24, defaultReps: "12",   defaultRest: 90,  cue: "Haltère tenu vertical sous le menton. Coudes entre les genoux." },
  { id: "db15", name: "Extensions triceps haltère",  muscle: "Triceps",            equipment: "dumbbell", type: "isolation", defaultKg: 12, defaultReps: "12",  defaultRest: 75,  cue: "Coude immobile. Extension complète. Descente lente." },
  { id: "db16", name: "Shrug haltères",              muscle: "Trapèzes",           equipment: "dumbbell", type: "isolation", defaultKg: 26, defaultReps: "15",  defaultRest: 60,  cue: "Haussement pur. Pas de rotation. Maintien 1 sec en haut." },
  { id: "db17", name: "Step-up haltères",            muscle: "Quads · Fessiers",   equipment: "dumbbell", type: "compound", defaultKg: 16, defaultReps: "10",   defaultRest: 90,  cue: "Appui sur le talon en haut. Extension complète de hanche. Contrôle descente." },

  // ── BODYWEIGHT ────────────────────────────────────────────────────────────
  { id: "bw01", name: "Tractions prise large",       muscle: "Dos large · Biceps", equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "6",   defaultRest: 180, cue: "Descente bras tendus complète. Montée sternum vers la barre." },
  { id: "bw02", name: "Chin-up supination",          muscle: "Biceps · Dos",       equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "8",   defaultRest: 150, cue: "Supination complète. Coudes tirés vers les hanches en haut." },
  { id: "bw03", name: "Tractions neutres",           muscle: "Dos · Brachial",     equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "7",   defaultRest: 150, cue: "Prise en marteau. Plus accessible que la prise large. Elbows back." },
  { id: "bw04", name: "Dips barres parallèles",      muscle: "Triceps · Pecs",     equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "10",  defaultRest: 120, cue: "Descente lente 3 sec. Coudes derrière. Légère inclinaison avant." },
  { id: "bw05", name: "Push-up classique",           muscle: "Pecs · Triceps",     equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "20",  defaultRest: 60,  cue: "Corps aligné. Coudes à 45°. Poitrine touche le sol." },
  { id: "bw06", name: "Push-up archer",              muscle: "Pecs · Épaules",     equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "8",   defaultRest: 90,  cue: "Un bras tendu sur le côté pendant la descente. Alterne côtés." },
  { id: "bw07", name: "Pike Push-up",                muscle: "Épaules",            equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "12",  defaultRest: 90,  cue: "Hanches hautes. Tête vers le sol. Prépare le handstand push-up." },
  { id: "bw08", name: "Dragon Flag",                 muscle: "Core complet",       equipment: "bodyweight", type: "isolation", defaultKg: 0, defaultReps: "6",  defaultRest: 120, cue: "Corps rigide. Descente lente contrôlée. Lombaires ne touchent pas." },
  { id: "bw09", name: "L-Sit",                       muscle: "Core · Triceps",     equipment: "bodyweight", type: "isolation", defaultKg: 0, defaultReps: "20s", defaultRest: 90, cue: "Bras verrouillés. Jambes horizontales. Épaules déprimées." },
  { id: "bw10", name: "Relevé de jambes suspendu",   muscle: "Abdos bas",          equipment: "bodyweight", type: "isolation", defaultKg: 0, defaultReps: "12",  defaultRest: 90, cue: "Pas de balancement. Contrôle descente. Bassin en rétroversion en haut." },
  { id: "bw11", name: "Pistol Squat",                muscle: "Quads · Équilibre",  equipment: "bodyweight", type: "compound", defaultKg: 0, defaultReps: "5",   defaultRest: 120, cue: "Descente contrôlée. Jambe libre tendue devant. Genou dans l'axe." },
  { id: "bw12", name: "Nordic Curl",                 muscle: "Ischios",            equipment: "bodyweight", type: "isolation", defaultKg: 0, defaultReps: "5",  defaultRest: 120, cue: "Descente lente en excentriq. Pousse avec les mains en bas. Très intense." },

  // ── MACHINE / CABLES ──────────────────────────────────────────────────────
  { id: "mc01", name: "Lat Pulldown câble prise large", muscle: "Dos large",       equipment: "machine", type: "compound", defaultKg: 50, defaultReps: "12",   defaultRest: 90,  cue: "Barre tirée vers le haut de la poitrine. Coudes vers les hanches." },
  { id: "mc02", name: "Rowing câble assis",           muscle: "Dos épais",          equipment: "machine", type: "compound", defaultKg: 50, defaultReps: "12",   defaultRest: 90,  cue: "Tirage vers le nombril. Rétraction omoplates avant de tirer." },
  { id: "mc03", name: "Face Pull câble",              muscle: "Rear delt · Trapèzes", equipment: "machine", type: "isolation", defaultKg: 15, defaultReps: "15", defaultRest: 60, cue: "Tirage vers le visage. Coudes à hauteur des épaules. Rotation externe." },
  { id: "mc04", name: "Chest Press machine",          muscle: "Pecs",               equipment: "machine", type: "compound", defaultKg: 50, defaultReps: "12",   defaultRest: 90,  cue: "Siège ajusté poignées à hauteur de poitrine. Pression constante." },
  { id: "mc05", name: "Leg Press machine",            muscle: "Quads · Fessiers",   equipment: "machine", type: "compound", defaultKg: 100, defaultReps: "12",  defaultRest: 120, cue: "Pieds écartés largeur d'épaules. Descente jusqu'à 90°. Pas de rebond." },
  { id: "mc06", name: "Leg Curl machine",             muscle: "Ischios",            equipment: "machine", type: "isolation", defaultKg: 35, defaultReps: "12",  defaultRest: 90,  cue: "Hanche collée à la machine. Flexion jusqu'à 90°. Descente en 3 sec." },
  { id: "mc07", name: "Leg Extension machine",        muscle: "Quads",              equipment: "machine", type: "isolation", defaultKg: 40, defaultReps: "15",  defaultRest: 90,  cue: "Extension complète. Maintien 1 sec en haut. Descente lente." },
  { id: "mc08", name: "Calf Raise machine",           muscle: "Mollets",            equipment: "machine", type: "isolation", defaultKg: 60, defaultReps: "20",  defaultRest: 60,  cue: "Amplitude complète. Monte sur la pointe. Étirement complet en bas." },
  { id: "mc09", name: "Pec Deck machine",             muscle: "Pecs",               equipment: "machine", type: "isolation", defaultKg: 40, defaultReps: "15",  defaultRest: 75,  cue: "Coudes légèrement fléchis. Arc de cercle. Pince forte en fermeture." },
  { id: "mc10", name: "Shoulder Press machine",       muscle: "Épaules",            equipment: "machine", type: "compound", defaultKg: 40, defaultReps: "12",   defaultRest: 90,  cue: "Extension complète sans verrouiller. Retour lent contrôlé." },
  { id: "mc11", name: "Hip Abduction machine",        muscle: "Fessiers · Abducteurs", equipment: "machine", type: "isolation", defaultKg: 40, defaultReps: "15", defaultRest: 60, cue: "Contraction à l'extérieur. Maintien 1 sec. Retour contrôlé." },

  // ── CARDIO ────────────────────────────────────────────────────────────────
  { id: "cd01", name: "SkiErg Sprints 20/10",        muscle: "Full body · Cardio",  equipment: "cardio", type: "cardio", defaultKg: 0, defaultReps: "8×20s",  defaultRest: 10,  cue: "Double bras. Poussée hanches + bras. 20 sec max effort / 10 sec repos." },
  { id: "cd02", name: "Rameur Intervals 500m",        muscle: "Full body · Cardio",  equipment: "cardio", type: "cardio", defaultKg: 0, defaultReps: "4×500m", defaultRest: 60,  cue: "Drive puissant avec les jambes. Chaîne cinétique jambes → tronc → bras." },
  { id: "cd03", name: "Vélo HIIT 30/30",             muscle: "Cardio · Jambes",    equipment: "cardio", type: "cardio", defaultKg: 0, defaultReps: "10×30s", defaultRest: 30,  cue: "30 sec sprint résistance haute / 30 sec récup résistance basse." },
  { id: "cd04", name: "Corde à sauter",               muscle: "Cardio",             equipment: "cardio", type: "cardio", defaultKg: 0, defaultReps: "3×1min", defaultRest: 30,  cue: "Appuis avant du pied. Saut minimal. Poignets, pas les bras." },
  { id: "cd05", name: "Battle Ropes",                 muscle: "Cardio · Bras",      equipment: "cardio", type: "cardio", defaultKg: 0, defaultReps: "4×30s", defaultRest: 30,  cue: "Genoux fléchis. Core engagé. Alternance ou double frappe." },

  // ── ABS ───────────────────────────────────────────────────────────────────
  { id: "ab01", name: "Ab Rollout barre",             muscle: "Core complet",       equipment: "barbell", type: "isolation", defaultKg: 0, defaultReps: "10",   defaultRest: 90,  cue: "Bras tendus. Corps rigide. Retour genou-sol. Ne laisse pas le dos se creuser." },
  { id: "ab02", name: "Crunch câble",                 muscle: "Abdos",              equipment: "machine", type: "isolation", defaultKg: 15, defaultReps: "15",  defaultRest: 60,  cue: "Flexion de la colonne, pas des hanches. Contraction maximale en bas." },
  { id: "ab03", name: "Russian Twist",                muscle: "Obliques",           equipment: "bodyweight", type: "isolation", defaultKg: 0, defaultReps: "20", defaultRest: 60, cue: "Pieds décollés. Rotation complète. Contrôle de la descente." },
  { id: "ab04", name: "Hollow Body Hold",             muscle: "Core complet",       equipment: "bodyweight", type: "isolation", defaultKg: 0, defaultReps: "30s", defaultRest: 60, cue: "Bas du dos collé au sol. Bras et jambes tendus et décollés. Corps en banane." },
  { id: "ab05", name: "Planche dynamique",            muscle: "Core · Épaules",     equipment: "bodyweight", type: "isolation", defaultKg: 0, defaultReps: "10",  defaultRest: 60, cue: "De la planche au push-up et retour. Corps rigide tout le long." },
];

const EQ_LABELS = { kettlebell: "KB", barbell: "Barre", dumbbell: "Haltères", bodyweight: "Poids corps", machine: "Machine", cardio: "Cardio" };
const MUSCLES = ["Full body", "Pecs", "Dos", "Épaules", "Biceps", "Triceps", "Quads", "Ischios", "Fessiers", "Core", "Cardio"];

// ─── PROGRAM S24 ─────────────────────────────────────────────────────────────
const PROGRAM = [
  { day: "LUN", label: "Push Force", salle: "haut", muscle: "Pecs · Épaules · Triceps",
    exercises: ["bb01","bb02","db01","db07","db08","bw04"].map(id => EXERCISE_DB.find(e => e.id === id)).filter(Boolean).map(ex => ({ ...ex, sets: ex.id === "bb01" ? 5 : 4 })),
    abs: [{ id: "ab01", name: "Ab Rollout barre", vol: "4×10" }, { id: "ab03", name: "Russian Twist", vol: "3×20" }] },

  { day: "MAR", label: "Kettlebell Power", salle: "bas", muscle: "Full Body · KB Complex",
    exercises: ["kb01","kb03","kb04","kb08","kb09","kb22"].map(id => EXERCISE_DB.find(e => e.id === id)).filter(Boolean).map(ex => ({ ...ex, sets: 4 })),
    abs: [{ id: "ab04", name: "Hollow Body Hold", vol: "4×30s" }, { id: "ab05", name: "Planche dynamique", vol: "3×10" }] },

  { day: "MER", label: "Pull & Legs", salle: "haut", muscle: "Dos · Biceps · Jambes",
    exercises: ["bw01","bw02","bb06","db06","kb09","kb16","bb09"].map(id => EXERCISE_DB.find(e => e.id === id)).filter(Boolean).map(ex => ({ ...ex, sets: ex.id === "bw01" ? 5 : 4 })),
    abs: [{ id: "ab01", name: "Ab Rollout barre", vol: "4×10" }, { id: "ab02", name: "Crunch câble", vol: "3×15" }] },

  { day: "JEU", label: "Repos", salle: null, muscle: "Récupération active", exercises: [], abs: [] },

  { day: "VEN", label: "Kettlebell Endurance", salle: "bas", muscle: "KB · Rameur · Full Body",
    exercises: ["cd02","kb05","kb06","db06","db07","cd04"].map(id => EXERCISE_DB.find(e => e.id === id)).filter(Boolean).map(ex => ({ ...ex, sets: 4 })),
    abs: [{ id: "ab04", name: "Hollow Body Hold", vol: "4×30s" }, { id: "ab02", name: "Crunch câble", vol: "3×15" }] },

  { day: "SAM", label: "Full Power", salle: "haut", muscle: "Deadlift · Tractions · KB",
    exercises: ["bb05","bb07","bw01","bw04","kb21","kb08"].map(id => EXERCISE_DB.find(e => e.id === id)).filter(Boolean).map(ex => ({ ...ex, sets: ex.id === "bb05" || ex.id === "bw01" ? 5 : 4 })),
    abs: [{ id: "bw09", name: "L-Sit", vol: "4×20s" }, { id: "bw10", name: "Relevé jambes suspendu", vol: "3×12" }] },

  { day: "DIM", label: "Repos", salle: null, muscle: "Reset total", exercises: [], abs: [] },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const todayIdx = () => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1; };
const fmtMSS = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const fmtDur = s => s >= 3600 ? `${Math.floor(s/3600)}h${String(Math.floor((s%3600)/60)).padStart(2,"0")}m` : `${Math.floor(s/60)}m${String(s%60).padStart(2,"0")}s`;

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .15, .30].forEach(d => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 1046;
      g.gain.setValueAtTime(.2, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .1);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .1);
    });
  } catch {}
}

const LS = "soma_s12";
const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch { return {}; } };
const lsSet = d => { try { localStorage.setItem(LS, JSON.stringify(d)); } catch {} };

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useStopwatch() {
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  const start = () => { setSec(0); setRunning(true); ref.current = setInterval(() => setSec(p => p + 1), 1000); };
  const stop = () => { clearInterval(ref.current); setRunning(false); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setSec(0); };
  useEffect(() => () => clearInterval(ref.current), []);
  return { sec, running, start, stop, reset };
}

function useCountdown(onDone) {
  const [sec, setSec] = useState(0);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef(null);
  const start = useCallback(s => {
    clearInterval(ref.current);
    setSec(s); setTotal(s); setRunning(true); setDone(false);
    ref.current = setInterval(() => {
      setSec(p => { if (p <= 1) { clearInterval(ref.current); setRunning(false); setDone(true); beep(); onDone?.(); return 0; } return p - 1; });
    }, 1000);
  }, [onDone]);
  const stop = () => { clearInterval(ref.current); setRunning(false); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setDone(false); setSec(0); setTotal(0); };
  useEffect(() => () => clearInterval(ref.current), []);
  return { sec, total, running, done, start, stop, reset };
}

// ─── TAP COMPONENT ───────────────────────────────────────────────────────────
function Tap({ children, onTap, style, disabled }) {
  const [p, setP] = useState(false);
  return (
    <div onPointerDown={() => !disabled && setP(true)} onPointerUp={() => { setP(false); !disabled && onTap?.(); }} onPointerLeave={() => setP(false)}
      style={{ ...style, transform: p && !disabled ? "scale(0.97)" : "scale(1)", transition: `transform 150ms ${EASE}`, cursor: disabled ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}>
      {children}
    </div>
  );
}

// ─── REST OVERLAY ─────────────────────────────────────────────────────────────
function RestOverlay({ timer, label }) {
  if (!timer.running && !timer.done && timer.sec === 0) return null;
  const pct = timer.total > 0 ? timer.sec / timer.total : 0;
  const R = 36, circ = 2 * Math.PI * R;
  return (
    <div style={{ position: "fixed", bottom: 90, left: 16, right: 16, zIndex: 400, display: "flex", justifyContent: "center" }}>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 20, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, maxWidth: 420, width: "100%", backdropFilter: "blur(20px)" }}>
        <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="36" cy="36" r={R} fill="none" stroke={C.border2} strokeWidth="5"/>
            <circle cx="36" cy="36" r={R} fill="none" stroke={timer.done ? C.green : C.accent} strokeWidth="5"
              strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray .8s linear" }}/>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: timer.done ? C.green : C.ink }}>
              {timer.done ? "GO" : fmtMSS(timer.sec)}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 4 }}>
            {timer.done ? "Repos terminé" : "Temps de repos"}
          </div>
          <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: timer.done ? C.green : C.ink80, marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {timer.running && <Tap onTap={timer.stop} style={{ padding: "6px 14px", borderRadius: 980, border: `1px solid ${C.border2}`, background: "transparent" }}><span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink48 }}>Passer</span></Tap>}
            <Tap onTap={timer.reset} style={{ padding: "6px 14px", borderRadius: 980, border: `1px solid ${C.border2}`, background: "transparent" }}><span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink48 }}>Fermer</span></Tap>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EXERCISE ROW ─────────────────────────────────────────────────────────────
function ExRow({ ex, weight, onWeightChange, log, onLogSet, onStartRest, idx, lastWeight, onReplace }) {
  const [open, setOpen] = useState(false);
  const sets = typeof ex.sets === "number" ? ex.sets : 4;
  const done = Array.from({ length: sets }, (_, i) => !!log[`${ex.id}_s${i}`]?.done);
  const completed = done.filter(Boolean).length;
  const allDone = sets > 0 && completed === sets;
  const kg = weight ?? ex.defaultKg ?? 0;
  const orm = kg > 0 ? Math.round(kg * (1 + (parseFloat(String(ex.defaultReps).split("–")[0]) || 8) / 30)) : null;
  const suggestion = lastWeight && lastWeight > kg ? lastWeight + 2.5 : null;

  const handleSet = i => {
    const newDone = !done[i];
    onLogSet(`${ex.id}_s${i}`, { done: newDone, weight: kg, date: todayKey() });
    if (newDone && ex.defaultRest > 0) onStartRest(ex.defaultRest, ex.name);
  };

  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, animation: `fadeSlideIn 300ms ${EASE} ${idx * 40}ms both` }}>
      <Tap onTap={() => setOpen(o => !o)} style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, border: `2px solid ${allDone ? C.green : C.border2}`, background: allDone ? C.greenDim : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: `all 220ms ${EASE}` }}>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: allDone ? C.green : C.ink48 }}>{completed}/{sets}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: allDone ? C.ink48 : C.ink, textDecoration: allDone ? "line-through" : "none" }}>{ex.name}</span>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 980, background: C.surface3, color: C.ink48 }}>{EQ_LABELS[ex.equipment] || ex.equipment}</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{sets}×{ex.defaultReps}</span>
            <span style={{ color: C.ink24 }}>·</span>
            <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{ex.muscle}</span>
            {orm && <><span style={{ color: C.ink24 }}>·</span><span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.accent }}>1RM ~{orm}kg</span></>}
          </div>
          {suggestion && <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.orange, marginTop: 4 }}>Suggestion : essaie {suggestion}kg</div>}
        </div>
        {ex.defaultRest > 0 && (
          <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 980, background: C.surface3, color: C.ink48, flexShrink: 0 }}>
            {ex.defaultRest >= 60 ? `${ex.defaultRest / 60}′` : `${ex.defaultRest}″`}
          </span>
        )}
        <span style={{ color: C.ink24, fontSize: 12, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: `transform 220ms ${EASE}` }}>▾</span>
      </Tap>

      {/* Set buttons */}
      <div style={{ paddingBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from({ length: sets }, (_, i) => (
            <Tap key={i} onTap={() => handleSet(i)} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, border: `1.5px solid ${done[i] ? C.green : C.border2}`, background: done[i] ? C.greenDim : C.surface3, display: "flex", alignItems: "center", justifyContent: "center", transition: `all 220ms ${EASE}` }}>
              <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: done[i] ? C.green : C.ink48 }}>{i + 1}</span>
            </Tap>
          ))}
          {ex.defaultRest > 0 && (
            <Tap onTap={() => onStartRest(ex.defaultRest, ex.name)} style={{ height: 44, padding: "0 14px", borderRadius: 12, border: `1.5px solid ${C.border2}`, background: "transparent", display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.ink48 }}>Repos</span>
            </Tap>
          )}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ paddingBottom: 20, animation: `fadeIn 200ms ${EASE} both` }}>
          {/* Weight */}
          <div style={{ background: C.surface2, borderRadius: 14, padding: "16px", marginBottom: 10 }}>
            <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink24, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
              Charge{lastWeight ? ` · Dernière fois : ${lastWeight}kg` : ""}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Tap onTap={() => onWeightChange(ex.id, Math.max(0, kg - 2.5))} style={{ width: 48, height: 48, borderRadius: 12, border: `1.5px solid ${C.border2}`, background: C.surface3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F, fontSize: 22, color: C.ink }}>−</span>
              </Tap>
              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{ fontFamily: F, fontSize: 34, fontWeight: 700, color: C.ink }}>{kg === 0 ? "BW" : `${kg}`}</span>
                {kg > 0 && <span style={{ fontFamily: F, fontSize: 20, color: C.ink48 }}> kg</span>}
              </div>
              <Tap onTap={() => onWeightChange(ex.id, kg + 2.5)} style={{ width: 48, height: 48, borderRadius: 12, border: `1.5px solid ${C.border2}`, background: C.surface3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F, fontSize: 22, color: C.ink }}>+</span>
              </Tap>
            </div>
          </div>
          {/* Coach tip */}
          {ex.cue && (
            <div style={{ borderLeft: `2px solid ${C.border2}`, paddingLeft: 14 }}>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: C.ink48, lineHeight: 1.6 }}>{ex.cue}</div>
            </div>
          )}
          {/* Replace button */}
          <Tap onTap={() => onReplace(ex)} style={{ marginTop: 12, padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.border2}`, background: "transparent", display: "inline-flex" }}>
            <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.ink48 }}>Remplacer cet exercice</span>
          </Tap>
        </div>
      )}
    </div>
  );
}

// ─── EXERCISE PICKER ─────────────────────────────────────────────────────────
function ExercisePicker({ onSelect, onClose, currentId, excluded }) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState(null);
  const [equipment, setEquipment] = useState(null);

  const filtered = EXERCISE_DB.filter(ex => {
    if (excluded.includes(ex.id)) return false;
    if (ex.id === currentId) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase()) && !ex.muscle.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscle && !ex.muscle.toLowerCase().includes(muscle.toLowerCase())) return false;
    if (equipment && ex.equipment !== equipment) return false;
    return true;
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}/>
      <div style={{ position: "relative", background: C.surface, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 600, maxHeight: "85vh", display: "flex", flexDirection: "column", animation: `slideUp 340ms ${EASE_D} both` }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: C.border2, borderRadius: 2, margin: "0 auto 20px" }}/>
          <div style={{ fontFamily: F, fontSize: 22, fontWeight: 600, color: C.ink, marginBottom: 14 }}>Choisir un exercice</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border2}`, fontFamily: F, fontSize: 15, color: C.ink, background: C.surface2, outline: "none", boxSizing: "border-box", marginBottom: 12 }}/>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {Object.entries(EQ_LABELS).map(([k, l]) => (
              <Tap key={k} onTap={() => setEquipment(equipment === k ? null : k)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 980, border: `1px solid ${equipment === k ? C.accent : C.border2}`, background: equipment === k ? C.accentDim : "transparent" }}>
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: equipment === k ? C.accent : C.ink48 }}>{l}</span>
              </Tap>
            ))}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 40px" }}>
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", fontFamily: F, fontSize: 15, color: C.ink48 }}>Aucun exercice trouvé.</div>}
          {filtered.map(ex => (
            <Tap key={ex.id} onTap={() => onSelect(ex)} style={{ padding: "16px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{ex.name}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: F, fontSize: 12, color: C.ink48 }}>{ex.muscle}</span>
                  <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, padding: "1px 8px", borderRadius: 980, background: C.surface3, color: C.ink48 }}>{EQ_LABELS[ex.equipment]}</span>
                </div>
              </div>
              <span style={{ fontFamily: F, fontSize: 17, color: C.accent }}>+</span>
            </Tap>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI REGEN SHEET ───────────────────────────────────────────────────────────
function RegenSheet({ onClose, onResult, excluded }) {
  const [type, setType] = useState(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const SESSION_TYPES = ["Kettlebell Full", "KB Endurance", "KB Force", "Push Force", "Pull & Dos", "Jambes", "Corps entier", "Bras", "Cardio hybride"];

  const generate = async () => {
    if (!type && !custom.trim()) return;
    setLoading(true);
    const dbList = EXERCISE_DB.filter(e => !excluded.includes(e.id))
      .map(e => `${e.id}:${e.name}(${EQ_LABELS[e.equipment]},${e.muscle},${e.defaultReps},rest:${e.defaultRest}s)`)
      .join("|");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: `Tu es un coach fitness expert. Génère une séance de type "${type || custom}" en utilisant UNIQUEMENT des exercices de cette base: ${dbList}. Exclus les IDs: ${excluded.join(",")||"aucun"}. Pour du KB, utilise maximum les exercices KB. Réponds UNIQUEMENT en JSON valide sans markdown: {"titre": string, "exercises": [{"id": string, "name": string, "sets": number, "defaultReps": string, "defaultRest": number, "muscle": string, "equipment": string, "cue": string}], "abs": [{"id": string, "name": string, "vol": string}]}` }]
        })
      });
      const d = await res.json();
      const raw = (d.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim();
      onResult(JSON.parse(raw)); onClose();
    } catch(e) { console.error(e); alert("Erreur génération."); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}/>
      <div style={{ position: "relative", background: C.surface, borderRadius: "24px 24px 0 0", padding: "28px 24px calc(40px + env(safe-area-inset-bottom))", maxWidth: 600, width: "100%", animation: `slideUp 340ms ${EASE_D} both` }}>
        <div style={{ width: 36, height: 4, background: C.border2, borderRadius: 2, margin: "0 auto 24px" }}/>
        <div style={{ fontFamily: F, fontSize: 24, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", marginBottom: 20 }}>Générer une séance</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {SESSION_TYPES.map(t => (
            <Tap key={t} onTap={() => setType(t === type ? null : t)} style={{ padding: "12px 8px", borderRadius: 12, textAlign: "center", border: `1.5px solid ${type === t ? C.accent : C.border2}`, background: type === t ? C.accentDim : C.surface2 }}>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: type === t ? 600 : 400, color: type === t ? C.accent : C.ink48 }}>{t}</span>
            </Tap>
          ))}
        </div>
        <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder="Ou décris librement ta séance..."
          style={{ width: "100%", minHeight: 52, padding: "12px 16px", borderRadius: 14, border: `1px solid ${C.border2}`, fontFamily: F, fontSize: 15, color: C.ink, background: C.surface2, resize: "none", outline: "none", marginBottom: 16, boxSizing: "border-box" }}/>
        <Tap onTap={generate} style={{ padding: "15px", borderRadius: 14, background: (!type && !custom.trim()) || loading ? C.surface3 : C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: (!type && !custom.trim()) || loading ? C.ink24 : "#000" }}>
            {loading ? "Génération en cours…" : "Générer avec IA"}
          </span>
        </Tap>
      </div>
    </div>
  );
}

// ─── FEEDBACK SHEET ───────────────────────────────────────────────────────────
function FeedbackSheet({ onClose, onSave }) {
  const [intensity, setIntensity] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");
  const IL = ["","Très léger","Léger","Modéré","Intense","Maximum"];
  const EL = ["","Épuisé","Fatigué","Normal","Énergisé","Au top"];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }}/>
      <div style={{ position: "relative", background: C.surface, borderRadius: "24px 24px 0 0", padding: "28px 24px calc(40px + env(safe-area-inset-bottom))", maxWidth: 600, width: "100%", animation: `slideUp 340ms ${EASE_D} both` }}>
        <div style={{ width: 36, height: 4, background: C.border2, borderRadius: 2, margin: "0 auto 24px" }}/>
        <div style={{ fontFamily: F, fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Bilan séance</div>
        <div style={{ fontFamily: F, fontSize: 17, color: C.ink48, marginBottom: 24 }}>Comment s'est passée ta séance ?</div>
        {[{ label: "Intensité", val: intensity, set: setIntensity, labels: IL }, { label: "Énergie", val: energy, set: setEnergy, labels: EL }].map(({ label, val, set, labels }) => (
          <div key={label} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink }}>{label}</span>
              <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{labels[val]}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5].map(v => (
                <Tap key={v} onTap={() => set(v)} style={{ flex: 1, height: 48, borderRadius: 12, border: `1.5px solid ${val===v ? C.accent : C.border2}`, background: val===v ? C.accentDim : C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: F, fontSize: 17, fontWeight: val===v ? 700 : 400, color: val===v ? C.accent : C.ink48 }}>{v}</span>
                </Tap>
              ))}
            </div>
          </div>
        ))}
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes libres..."
          style={{ width: "100%", minHeight: 64, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.border2}`, fontFamily: F, fontSize: 15, color: C.ink, background: C.surface2, resize: "none", outline: "none", marginBottom: 16, boxSizing: "border-box" }}/>
        <div style={{ display: "flex", gap: 10 }}>
          <Tap onTap={onClose} style={{ flex: 1, padding: "15px", borderRadius: 14, border: `1px solid ${C.border2}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink48 }}>Annuler</span>
          </Tap>
          <Tap onTap={() => onSave({ global: intensity, energy, notes })} style={{ flex: 2, padding: "15px", borderRadius: 14, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: "#000" }}>Enregistrer</span>
          </Tap>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION REPORT ───────────────────────────────────────────────────────────
function SessionReport({ session, onClose }) {
  if (!session) return null;
  const { totalKg = 0, totalSets = 0, duration = 0, exercises = [], date = "", dayLabel = "", score = 0, feedback } = session;
  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 700, overflowY: "auto", fontFamily: F, animation: `fadeIn 200ms ${EASE} both` }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ padding: "60px 24px 32px", borderBottom: `1px solid ${C.border}` }}>
          <Tap onTap={onClose} style={{ position: "fixed", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>✕</span>
          </Tap>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>{date}</div>
          <div style={{ fontSize: 34, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: 14 }}>{dayLabel}</div>
          {score > 0 && <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 980, border: `1px solid ${C.border2}`, background: C.surface2 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: C.accent }}>{score}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.ink48, letterSpacing: ".08em" }}>SCORE</span>
          </div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${C.border}` }}>
          {[{ l: "Volume", v: totalKg > 0 ? `${(totalKg/1000).toFixed(1)}t` : "—" }, { l: "Durée", v: duration > 0 ? fmtDur(duration) : "—" }, { l: "Séries", v: `${totalSets}` }].map(({ l, v }, i) => (
            <div key={l} style={{ padding: "20px 16px", borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{l}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.ink }}>{v}</div>
            </div>
          ))}
        </div>
        {exercises.filter(e => e.completedSets > 0).length > 0 && (
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Exercices</div>
            {exercises.filter(e => e.completedSets > 0).map((ex, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{ex.name}</div>
                  <div style={{ fontSize: 13, color: C.ink48 }}>{ex.completedSets} séries · {ex.muscle}</div>
                </div>
                {ex.weight > 0 && <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{ex.weight}kg</span>}
              </div>
            ))}
          </div>
        )}
        {feedback && (
          <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              {[{ l: "Intensité", v: feedback.global }, { l: "Énergie", v: feedback.energy }].map(({ l, v }) => (
                <div key={l} style={{ flex: 1, background: C.surface2, borderRadius: 12, padding: "14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{l}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.ink }}>{v}/5</div>
                </div>
              ))}
            </div>
            {feedback.notes && <div style={{ fontSize: 15, color: C.ink48, lineHeight: 1.6 }}>{feedback.notes}</div>}
          </div>
        )}
        <div style={{ padding: "0 24px 60px" }}>
          <Tap onTap={onClose} style={{ padding: "15px", borderRadius: 14, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink48 }}>Fermer</span>
          </Tap>
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab({ sessions, onSelect }) {
  const [view, setView] = useState(new Date());
  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1).getDay(), days = new Date(y, m+1, 0).getDate();
  const off = first === 0 ? 6 : first - 1;
  const MN = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const DN = ["L","M","M","J","V","S","D"];
  const dates = sessions.map(s => s.date);
  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: "20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <Tap onTap={() => setView(new Date(y,m-1,1))} style={{ width: 36, height: 36, borderRadius: 8, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: F, fontSize: 16, color: C.ink48 }}>‹</span></Tap>
          <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink }}>{MN[m]} {y}</span>
          <Tap onTap={() => setView(new Date(y,m+1,1))} style={{ width: 36, height: 36, borderRadius: 8, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: F, fontSize: 16, color: C.ink48 }}>›</span></Tap>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {DN.map((d,i) => <div key={i} style={{ textAlign: "center", fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink24, paddingBottom: 6 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array.from({ length: off + days }, (_, i) => {
            if (i < off) return <div key={i}/>;
            const d = i - off + 1;
            const key = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const done = dates.includes(key), isToday = key === todayKey();
            return (
              <Tap key={i} onTap={() => { if (done) { const s = sessions.find(h => h.date === key); if (s) onSelect(s); }}} style={{ aspectRatio: "1", borderRadius: 8, background: done ? C.accent : isToday ? C.surface3 : "transparent", border: isToday && !done ? `1px solid ${C.border2}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: done || isToday ? 600 : 400, color: done ? "#000" : isToday ? C.ink : C.ink48 }}>{d}</span>
              </Tap>
            );
          })}
        </div>
      </div>
      <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Séances récentes</div>
      {sessions.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", fontFamily: F, fontSize: 17, color: C.ink48 }}>Aucune séance enregistrée.</div>}
      {sessions.slice().reverse().map((s, i) => (
        <Tap key={i} onTap={() => onSelect(s)} style={{ background: C.surface, borderRadius: 16, padding: "16px 18px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink }}>{s.dayLabel || s.day}</div>
            <div style={{ display: "flex", gap: 10 }}>
              {s.score > 0 && <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: C.accent }}>{s.score}</span>}
              <span style={{ fontFamily: F, fontSize: 13, color: C.ink48 }}>{s.date}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {s.totalKg > 0 && <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{s.totalKg.toLocaleString()}kg</span>}
            {s.duration > 0 && <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{fmtDur(s.duration)}</span>}
            {s.totalSets > 0 && <span style={{ fontFamily: F, fontSize: 14, color: C.ink48 }}>{s.totalSets} séries</span>}
          </div>
        </Tap>
      ))}
    </div>
  );
}

// ─── STATS TAB ────────────────────────────────────────────────────────────────
function StatsTab({ sessions, weights }) {
  const totalSessions = sessions.length;
  const totalKg = sessions.reduce((a,s) => a + (s.totalKg||0), 0);
  const avgScore = sessions.length ? Math.round(sessions.reduce((a,s) => a+(s.score||0),0)/sessions.length) : 0;
  const bestSession = sessions.reduce((b,s) => (s.score||0) > (b?.score||0) ? s : b, null);
  const allEx = EXERCISE_DB;
  const pbs = Object.entries(weights).map(([id, kg]) => {
    const ex = allEx.find(e => e.id === id); if (!ex) return null;
    const orm = kg > 0 ? Math.round(kg * (1 + (parseFloat(String(ex.defaultReps).split("–")[0])||8)/30)) : null;
    return { name: ex.name, kg, orm, muscle: ex.muscle };
  }).filter(Boolean).sort((a,b) => (b.orm||0)-(a.orm||0));

  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        {[{ l: "Séances", v: totalSessions }, { l: "Volume total", v: totalKg > 0 ? `${(totalKg/1000).toFixed(1)}t` : "—" }, { l: "Score moyen", v: avgScore||"—" }, { l: "Meilleur score", v: bestSession?.score||"—" }].map(({ l, v }) => (
          <div key={l} style={{ background: C.surface, borderRadius: 16, padding: "18px 16px" }}>
            <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{l}</div>
            <div style={{ fontFamily: F, fontSize: 30, fontWeight: 700, color: C.ink, letterSpacing: "-.02em" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Personal Bests</div>
      {pbs.length === 0 ? <div style={{ textAlign: "center", padding: "32px 0", fontFamily: F, fontSize: 17, color: C.ink48 }}>Enregistre des charges pendant tes séances.</div> :
        pbs.map((pb, i) => (
          <div key={i} style={{ background: C.surface, borderRadius: 14, padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: C.ink }}>{pb.name}</div>
              <div style={{ fontFamily: F, fontSize: 13, color: C.ink48 }}>{pb.muscle}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: C.ink }}>{pb.kg === 0 ? "BW" : `${pb.kg}kg`}</div>
              {pb.orm && <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.accent }}>1RM ~{pb.orm}kg</div>}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── SETTINGS TAB ────────────────────────────────────────────────────────────
function SettingsTab({ excluded, onToggleExclude, onExport, onImport, onReset }) {
  const [showExLib, setShowExLib] = useState(false);
  const fileRef = useRef(null);
  return (
    <div style={{ padding: "20px 20px 100px", maxWidth: 600, margin: "0 auto" }}>
      {/* Sauvegarde */}
      <div style={{ background: C.surface, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
        {[
          { l: "Exporter les données", action: onExport },
          { l: "Importer les données", action: () => fileRef.current?.click() },
        ].map(({ l, action }, i) => (
          <Tap key={l} onTap={action} style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i === 0 ? `1px solid ${C.border}` : "none" }}>
            <span style={{ fontFamily: F, fontSize: 17, color: C.ink }}>{l}</span>
            <span style={{ fontFamily: F, fontSize: 17, color: C.accent }}>›</span>
          </Tap>
        ))}
      </div>
      <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }}
        onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => { try { onImport(JSON.parse(ev.target.result)); } catch { alert("Fichier invalide."); }}; r.readAsText(f); }}}/>

      {/* Exercices exclus */}
      <div style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: C.ink48, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10, marginTop: 20 }}>
        Exercices exclus {excluded.length > 0 && `· ${excluded.length} exclus`}
      </div>
      <Tap onTap={() => setShowExLib(o => !o)} style={{ background: C.surface, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showExLib ? 0 : 12 }}>
        <span style={{ fontFamily: F, fontSize: 17, color: C.ink }}>Gérer les exclusions</span>
        <span style={{ fontFamily: F, fontSize: 17, color: C.accent, transform: showExLib ? "rotate(90deg)" : "none", transition: `transform 200ms ${EASE}` }}>›</span>
      </Tap>
      {showExLib && (
        <div style={{ background: C.surface, borderRadius: "0 0 14px 14px", overflow: "hidden", marginBottom: 12, maxHeight: 360, overflowY: "auto" }}>
          {EXERCISE_DB.map((ex, i) => (
            <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderTop: `1px solid ${C.border}`, opacity: excluded.includes(ex.id) ? .4 : 1 }}>
              <div>
                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: C.ink }}>{ex.name}</div>
                <div style={{ fontFamily: F, fontSize: 12, color: C.ink48 }}>{EQ_LABELS[ex.equipment]}</div>
              </div>
              <Tap onTap={() => onToggleExclude(ex.id)} style={{ padding: "5px 14px", borderRadius: 980, border: `1px solid ${excluded.includes(ex.id) ? C.green : C.border2}`, background: excluded.includes(ex.id) ? C.greenDim : "transparent" }}>
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: excluded.includes(ex.id) ? C.green : C.ink48 }}>{excluded.includes(ex.id) ? "Réactiver" : "Exclure"}</span>
              </Tap>
            </div>
          ))}
        </div>
      )}

      {/* Danger */}
      <div style={{ background: C.surface, borderRadius: 14, overflow: "hidden" }}>
        <Tap onTap={() => { if (window.confirm("Effacer toutes les données ?")) onReset(); }} style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: F, fontSize: 17, color: C.red }}>Effacer toutes les données</span>
          <span style={{ fontFamily: F, fontSize: 17, color: C.red }}>›</span>
        </Tap>
      </div>

      <div style={{ fontFamily: F, fontSize: 12, color: C.ink24, textAlign: "center", marginTop: 28 }}>
        SŌMA · S12 · {EXERCISE_DB.length} exercices dans la base
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function SomaApp() {
  const [tab, setTab] = useState("seance");
  const [dayIdx, setDayIdx] = useState(todayIdx());
  const [log, setLog] = useState({});
  const [weights, setWeights] = useState({});
  const [sessions, setSessions] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [aiOverride, setAiOverride] = useState(null);
  const [streak, setStreak] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const [showPicker, setShowPicker] = useState(null); // exercise to replace
  const [restLabel, setRestLabel] = useState("");
  const [sbReady, setSbReady] = useState(false);
  const clock = useStopwatch();
  const rest = useCountdown();

  useEffect(() => {
    const local = lsGet();
    if (local.log) setLog(local.log);
    if (local.weights) setWeights(local.weights);
    if (local.sessions) { setSessions(local.sessions); computeStreak(local.sessions); }
    if (local.excluded) setExcluded(local.excluded);
    if (sb) {
      Promise.all([
        sb.from("sessions").select("*").eq("user_id", USER_ID).order("date", { ascending: false }),
        sb.from("personal_bests").select("*").eq("user_id", USER_ID),
      ]).then(([{ data: sess }, { data: pbs }]) => {
        if (sess?.length) { setSessions(sess); computeStreak(sess); lsSet({ ...lsGet(), sessions: sess }); }
        if (pbs?.length) { const w = {}; pbs.forEach(pb => { w[pb.exercise_id || pb.exercise_name] = pb.weight_kg; }); setWeights(prev => ({ ...prev, ...w })); }
        setSbReady(true);
      }).catch(() => {});
    }
  }, []);

  function computeStreak(sess) {
    const dates = (sess||[]).map(s => s.date); let s = 0;
    for (let i = 0; i < 60; i++) { const d = new Date(); d.setDate(d.getDate()-i); if (dates.includes(d.toISOString().slice(0,10))) s++; else break; }
    setStreak(s);
  }

  const persist = useCallback((updates) => { lsSet({ ...lsGet(), ...updates }); }, []);

  const saveLog = useCallback((key, val) => {
    setLog(prev => { const next = { ...prev, [key]: val }; persist({ log: next }); return next; });
    if (val.weight) setWeights(prev => { const exId = key.split("_s")[0]; if (!prev[exId] || val.weight > prev[exId]) { const next = { ...prev, [exId]: val.weight }; persist({ weights: next }); return next; } return prev; });
  }, [persist]);

  const saveWeight = useCallback((id, val) => { setWeights(prev => { const next = { ...prev, [id]: val }; persist({ weights: next }); return next; }); }, [persist]);
  const toggleExclude = useCallback((id) => { setExcluded(prev => { const next = prev.includes(id) ? prev.filter(x => x!==id) : [...prev,id]; persist({ excluded: next }); return next; }); }, [persist]);

  // Replace exercise
  const handleReplaceExercise = (replacedEx, newEx) => {
    if (!aiOverride) {
      const day = PROGRAM[dayIdx];
      const newExos = (day.exercises||[]).map(ex => ex.id === replacedEx.id ? { ...newEx, sets: ex.sets } : ex);
      setAiOverride({ titre: day.label, exercises: newExos, abs: day.abs });
    } else {
      const newExos = aiOverride.exercises.map(ex => ex.id === replacedEx.id ? { ...newEx, sets: ex.sets||4 } : ex);
      setAiOverride(prev => ({ ...prev, exercises: newExos }));
    }
    setShowPicker(null);
  };

  const handleFeedbackSave = async (fb) => {
    const day = PROGRAM[dayIdx];
    const exos = aiOverride?.exercises || day.exercises || [];
    let totalKg = 0, totalSets = 0;
    const exercisesData = exos.map(ex => {
      const s = typeof ex.sets === "number" ? ex.sets : 4;
      let completedSets = 0, lastWeight = 0;
      Array.from({ length: s }, (_, i) => { const e = log[`${ex.id}_s${i}`]; if (e?.done) { completedSets++; lastWeight = e.weight||0; const r = parseFloat(String(ex.defaultReps||"8").split("–")[0])||8; totalKg += lastWeight * r; totalSets++; }});
      return { id: ex.id, name: ex.name, muscle: ex.muscle, weight: lastWeight, completedSets };
    });
    const score = Math.round(Math.min(totalKg/5000*40,40) + Math.min(totalSets/25*30,30) + ((fb.global+fb.energy)/10*30));
    const entry = { day: day.day, dayLabel: aiOverride?.titre||day.label, date: todayKey(), exercises: exercisesData, totalKg: Math.round(totalKg), totalSets, duration: clock.sec, score, feedback: fb, user_id: USER_ID };
    if (sb) {
      await sb.from("sessions").upsert({ ...entry, week: "S24", session_type: entry.dayLabel, completed: true, notes: fb.notes }, { onConflict: "user_id,date" }).catch(()=>{});
      const { data: ex } = await sb.from("streaks").select("*").eq("user_id", USER_ID).single().catch(()=>({data:null}));
      const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
      const cur = ex?.last_session_date === yesterday ? (ex.current_streak||0)+1 : 1;
      await sb.from("streaks").upsert({ user_id: USER_ID, current_streak: cur, longest_streak: Math.max(cur,ex?.longest_streak||0), last_session_date: todayKey(), total_sessions: (ex?.total_sessions||0)+1, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).catch(()=>{});
      for (const ex of exercisesData) {
        if (ex.weight > 0) await sb.from("personal_bests").upsert({ user_id: USER_ID, exercise_name: ex.name, exercise_id: ex.id, weight_kg: ex.weight, reps: 8, one_rm: Math.round(ex.weight*(1+8/30)), achieved_at: todayKey() }, { onConflict: "user_id,exercise_name" }).catch(()=>{});
      }
    }
    setSessions(prev => { const next = [...prev.filter(s => s.date !== todayKey()), entry]; persist({ sessions: next }); computeStreak(next); return next; });
    setSessionActive(false); clock.reset(); setShowFeedback(false); setShowReport(entry);
  };

  // Last weights per exercise
  const lastWeightsPerEx = useMemo(() => {
    const map = {};
    sessions.slice().reverse().forEach(s => {
      (s.exercises||[]).forEach(ex => { if (ex.weight && !map[ex.id]) map[ex.id] = ex.weight; });
    });
    return map;
  }, [sessions]);

  const day = PROGRAM[dayIdx];
  const isRest = !day?.salle;
  const exos = (aiOverride?.exercises || day?.exercises || []).filter(e => !excluded.includes(e.id));
  const absExos = aiOverride?.abs || day?.abs || [];

  const NAV = [{ id: "seance", label: "Séance" }, { id: "stats", label: "Stats" }, { id: "history", label: "Historique" }, { id: "settings", label: "Réglages" }];

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", color: C.ink, fontFamily: F, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: ${C.bg}; }
        @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp     { from { transform: translateY(32px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        textarea::placeholder, input::placeholder { color: ${C.ink24}; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: "rgba(0,0,0,.88)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: `calc(14px + env(safe-area-inset-top)) 20px 12px`, position: "sticky", top: 0, zIndex: 200, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: "-.04em" }}>SŌMA</div>
          <div style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: C.ink24, letterSpacing: ".16em", textTransform: "uppercase" }}>Programme Hybride · S24</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {sessionActive && <span style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: C.red }}>{fmtDur(clock.sec)}</span>}
          {streak > 0 && <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.orange, padding: "4px 12px", borderRadius: 980, background: C.orangeDim }}>{streak}j</span>}
          {sbReady && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }}/>}
        </div>
      </div>

      {/* DAY STRIP */}
      {tab === "seance" && (
        <div style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, display: "flex", overflowX: "auto", padding: "10px 16px", gap: 6, scrollbarWidth: "none" }}>
          {PROGRAM.map((d, i) => {
            const exList = d.exercises || [];
            const done = exList.filter(e => Array.from({ length: typeof e.sets === "number" ? e.sets : 4 }, (_,si) => si).every(si => log[`${e.id}_s${si}`]?.done)).length;
            const pct = exList.length ? done/exList.length : 0;
            const isSel = i === dayIdx, isToday = i === todayIdx();
            return (
              <Tap key={i} onTap={() => { setDayIdx(i); setAiOverride(null); }} style={{ flexShrink: 0, minWidth: 50, padding: "10px 6px", textAlign: "center", borderRadius: 12, background: isSel ? C.surface2 : "transparent", border: `1px solid ${isSel ? C.border2 : "transparent"}` }}>
                <div style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: isSel ? C.ink80 : C.ink24, letterSpacing: ".06em", marginBottom: 4 }}>{d.day}</div>
                {isToday && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.lime, margin: "0 auto 4px" }}/>}
                {d.salle && pct > 0 && (
                  <div style={{ width: "70%", height: 2, background: C.border2, borderRadius: 1, margin: "0 auto" }}>
                    <div style={{ width: `${pct*100}%`, height: 2, background: C.accent, borderRadius: 1, transition: `width 300ms ${EASE}` }}/>
                  </div>
                )}
              </Tap>
            );
          })}
        </div>
      )}

      {/* CONTENT */}
      <div style={{ paddingBottom: 80 }}>
        {tab === "seance" && (
          <div style={{ padding: "16px 20px 0", maxWidth: 600, margin: "0 auto" }}>
            {isRest ? (
              <div style={{ textAlign: "center", padding: "80px 0", animation: `fadeIn 200ms ${EASE}` }}>
                <div style={{ fontFamily: F, fontSize: 34, fontWeight: 600, color: C.ink48, letterSpacing: "-.02em", marginBottom: 12 }}>Récupération</div>
                <div style={{ fontFamily: F, fontSize: 17, color: C.ink24, lineHeight: 1.6, maxWidth: 280, margin: "0 auto 28px" }}>
                  {dayIdx === 3 ? "Récupération musculaire active." : "Reset complet. Synthèse protéique prioritaire."}
                </div>
                {/* Generate KB session on rest days too */}
                <Tap onTap={() => setShowRegen(true)} style={{ display: "inline-flex", padding: "12px 24px", borderRadius: 980, border: `1px solid ${C.border2}`, background: "transparent" }}>
                  <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: C.ink48 }}>Générer une séance légère</span>
                </Tap>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ marginBottom: 20, animation: `fadeIn 200ms ${EASE}` }}>
                  <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink24, textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 8 }}>
                    {day.day} · S24 · {day.salle === "haut" ? "Salle Haute" : "Salle Basse"}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 34, fontWeight: 600, color: C.ink, letterSpacing: "-.02em", lineHeight: 1.1, marginBottom: 8 }}>
                    {aiOverride?.titre || day.label}
                  </div>
                  <div style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.ink48 }}>{day.muscle}</div>
                </div>

                {/* CTA */}
                {!sessionActive ? (
                  <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                    <Tap onTap={() => { setSessionActive(true); clock.start(); }} style={{ flex: 1, padding: "15px", borderRadius: 14, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: "#000" }}>Démarrer</span>
                    </Tap>
                    <Tap onTap={() => setShowRegen(true)} style={{ padding: "15px 20px", borderRadius: 14, border: `1px solid ${C.border2}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: C.ink48 }}>IA</span>
                    </Tap>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                    <div style={{ flex: 1, padding: "14px", borderRadius: 14, background: C.redDim, border: `1px solid ${C.red}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: C.red }}>{fmtDur(clock.sec)}</span>
                    </div>
                    <Tap onTap={() => { clock.stop(); setShowFeedback(true); }} style={{ flex: 2, padding: "14px", borderRadius: 14, background: C.surface2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink80 }}>Terminer</span>
                    </Tap>
                    <Tap onTap={() => setShowRegen(true)} style={{ padding: "14px 16px", borderRadius: 14, border: `1px solid ${C.border2}`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: C.ink48 }}>IA</span>
                    </Tap>
                  </div>
                )}

                {/* Warmup */}
                <div style={{ borderLeft: `2px solid ${C.border2}`, paddingLeft: 16, marginBottom: 24 }}>
                  <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink24, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Échauffement · 8 min</div>
                  <div style={{ fontFamily: F, fontSize: 14, color: C.ink48, lineHeight: 1.7 }}>
                    {day.salle === "haut" ? "Rotations épaules · Wall slide · Push-up to downdog · Mobilité thoracique" : "Corde à sauter 3min · Hip circle · Leg swing · KB Swing léger 3×10"}
                  </div>
                </div>

                {/* Exercises */}
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  {exos.map((ex, i) => (
                    <ExRow key={ex.id} ex={ex} idx={i}
                      weight={weights[ex.id] ?? ex.defaultKg ?? 0}
                      onWeightChange={saveWeight}
                      log={log}
                      onLogSet={saveLog}
                      onStartRest={(s, n) => { setRestLabel(n); rest.start(s); }}
                      lastWeight={lastWeightsPerEx[ex.id] || null}
                      onReplace={(ex) => setShowPicker(ex)}
                    />
                  ))}
                </div>

                {/* Abs */}
                {absExos.length > 0 && (
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: C.ink24, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 16 }}>Abdominaux</div>
                    {absExos.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontFamily: F, fontSize: 17, fontWeight: 400, color: C.ink }}>{a.name}</span>
                        <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: C.ink48 }}>{a.vol}</span>
                      </div>
                    ))}
                  </div>
                )}

                {!sessionActive && (
                  <Tap onTap={() => setShowFeedback(true)} style={{ marginTop: 28, marginBottom: 16, padding: "15px", borderRadius: 14, background: C.surface2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.ink48 }}>Rapport de séance</span>
                  </Tap>
                )}
              </>
            )}
          </div>
        )}

        {tab === "stats" && <StatsTab sessions={sessions} weights={weights}/>}
        {tab === "history" && <HistoryTab sessions={sessions} onSelect={setShowReport}/>}
        {tab === "settings" && <SettingsTab excluded={excluded} onToggleExclude={toggleExclude} onExport={() => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(lsGet(),null,2)],{type:"application/json"})); a.download=`SOMA-backup-${todayKey()}.json`; a.click(); }} onImport={d => { lsSet(d); if(d.log)setLog(d.log); if(d.weights)setWeights(d.weights); if(d.sessions){setSessions(d.sessions);computeStreak(d.sessions);} if(d.excluded)setExcluded(d.excluded); alert("Restauré."); }} onReset={() => { lsSet({}); setLog({}); setWeights({}); setSessions([]); setExcluded([]); setStreak(0); }}/>}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300, background: "rgba(0,0,0,.92)", backdropFilter: "blur(20px)", borderTop: `1px solid ${C.border}`, display: "flex", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map(({ id, label }) => (
          <Tap key={id} onTap={() => setTab(id)} style={{ flex: 1, padding: "10px 4px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: 20, height: 2, borderRadius: 1, background: tab===id ? C.accent : "transparent", marginBottom: 2, transition: `background 200ms` }}/>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: tab===id ? 600 : 400, color: tab===id ? C.ink : C.ink48 }}>{label}</span>
          </Tap>
        ))}
      </div>

      {/* OVERLAYS */}
      <RestOverlay timer={rest} label={restLabel}/>
      {showFeedback && <FeedbackSheet onClose={() => setShowFeedback(false)} onSave={handleFeedbackSave}/>}
      {showRegen && <RegenSheet onClose={() => setShowRegen(false)} onResult={o => { setAiOverride(o); setShowRegen(false); }} excluded={excluded}/>}
      {showPicker && <ExercisePicker onSelect={newEx => handleReplaceExercise(showPicker, newEx)} onClose={() => setShowPicker(null)} currentId={showPicker.id} excluded={excluded}/>}
      {showReport && <SessionReport session={showReport} onClose={() => setShowReport(null)}/>}
    </div>
  );
}
