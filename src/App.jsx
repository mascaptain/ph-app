import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "./supabase.js";
import { DB } from "./catalog.js";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Apple dark system + Emil micro-interactions + Impeccable rules
// OKLCH-inspired palette. One accent. No border-left hacks. No nested cards.
// Letter-spacing floor: -0.03em on display. Body: 17px/1.47.
// ─── ICONOGRAPHIE ───────────────────────────────────────────────────────────
// Un seul jeu pour toute l'application : geometrique, filaire, trace de 1,6 sur une grille
// de 24. Les icones etaient jusqu'ici dessinees au cas par cas avec des epaisseurs et des
// styles differents selon l'ecran, ce qui se voyait des qu'on les mettait cote a cote.
const ICONS={
  // navigation
  home:(<><rect x="3.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2.2"/></>),
  seance:(<><rect x="2.5" y="9" width="3.5" height="6" rx="1.4"/><rect x="18" y="9" width="3.5" height="6" rx="1.4"/><path d="M6 12h12"/><path d="M7.5 7.5v9"/><path d="M16.5 7.5v9"/></>),
  stats:(<><rect x="3.5" y="13" width="4" height="7.5" rx="1.6"/><rect x="10" y="8" width="4" height="12.5" rx="1.6"/><rect x="16.5" y="4" width="4" height="16.5" rx="1.6"/></>),
  settings:(<><circle cx="12" cy="8.5" r="3.6"/><path d="M4.6 20.2c.9-3.6 3.9-5.5 7.4-5.5s6.5 1.9 7.4 5.5"/></>),
  // actions
  back:(<path d="M14.5 5.5L8 12l6.5 6.5"/>),
  close:(<><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>),
  info:(<><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4"/><path d="M12 7.9v.1"/></>),
  check:(<path d="M5 12.6l4.6 4.4L19 7.4"/>),
  plus:(<><path d="M12 5.5v13"/><path d="M5.5 12h13"/></>),
  minus:(<path d="M5.5 12h13"/>),
  play:(<path d="M8 5.6l10 6.4-10 6.4z"/>),
  pause:(<><rect x="7" y="5.5" width="3.4" height="13" rx="1.3"/><rect x="13.6" y="5.5" width="3.4" height="13" rx="1.3"/></>),
  clock:(<><circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.2 2"/></>),
  flame:(<path d="M12 3.5c3.4 3 5.4 5.5 5.4 8.6a5.4 5.4 0 1 1-10.8 0c0-1.6.7-3 1.9-4.3.3 1.2.9 2 1.8 2.4-.2-2.6.4-4.7 1.7-6.7z"/>),
  weight:(<><path d="M5.4 20.5l1.9-11h9.4l1.9 11z"/><circle cx="12" cy="6" r="2.6"/></>),
  bell:(<><path d="M6.6 10a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.6 1.6 5.6H5s1.6-1.6 1.6-5.6z"/><path d="M10.3 19a2 2 0 0 0 3.4 0"/></>),
  camera:(<><rect x="3" y="7" width="18" height="13" rx="3.4"/><circle cx="12" cy="13.5" r="3.4"/><path d="M8.5 7l1.4-2.4h4.2L15.5 7"/></>),
  target:(<><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r=".6"/></>),
  swap:(<><path d="M4 8.5h13l-3-3"/><path d="M20 15.5H7l3 3"/></>),
  chevron:(<path d="M9.5 5.5L16 12l-6.5 6.5"/>),
  dot:(<circle cx="12" cy="12" r="2.4"/>),
};
const Icon=({name,size,stroke,fill,sw,style,title})=>(
  <svg width={size||22} height={size||22} viewBox="0 0 24 24" fill={fill||"none"}
    stroke={stroke||"currentColor"} strokeWidth={sw||1.6} strokeLinecap="round" strokeLinejoin="round"
    style={style} aria-hidden={title?undefined:true} role={title?"img":undefined}>
    {title?<title>{title}</title>:null}{ICONS[name]||ICONS.dot}</svg>
);

// ─── PALETTE ────────────────────────────────────────────────────────────────
// Eerie Black 1B1B1B · Washed Black 343434 · Black Denim 1C1C2B · Primary C0B4FE · White.
// Deux themes construits sur les MEMES cinq couleurs : le clair pose l'encre sur du blanc,
// le sombre pose le blanc sur l'encre et teinte les surfaces de Black Denim, ce qui donne
// de la profondeur sans introduire une seule teinte supplementaire.
// ─── PALETTE ─────────────────────────────────────────────────────────────────
// Cinq couleurs sources, et rien d'autre :
//   Eerie Black #1B1B1B · Washed Black #343434 · Black Denim #1C1C2B
//   Primary #C0B4FE · White #FFFFFF
//
// Les jetons portaient des noms de TEINTES qui mentaient : "blue" valait du
// lavande, "green" valait du bleu-nuit en clair et du lavande en sombre, "red"
// valait du noir. En clair, C.done et C.alert designaient donc quasiment la meme
// couleur. Un nom faux empeche de raisonner. Chaque jeton nomme desormais son
// ROLE, et un role a un seul usage.
//
// Regle qui tranche le conflit action / succes : l'accent PLEIN ne designe qu'une
// chose a l'ecran, ce qu'il faut faire maintenant. Ce qui est termine prend
// l'accent attenue. Aucune sixieme couleur n'est introduite.
const LIGHT = {
  bg:      "#FFFFFF",  // page et carte
  s1:      "#F5F4FA",  // creux            — Denim 3 %
  s2:      "#EDEBF6",  // filet            — Denim 8 %
  s3:      "#E2DFF0",  // filet fort       — Denim 18 %
  s4:      "#CFC9E7",  // bord marque
  div:     "#E2DFF0",
  ink:     "#1B1B1B",              // texte           — Eerie
  // Texte secondaire teinte Denim : c'est ce qui donne au theme clair sa note
  // bleu marine sans toucher au contraste du texte courant.
  ink2:    "rgba(28,28,43,.84)",
  ink3:    "rgba(28,28,43,.64)",   // texte second
  ink4:    "rgba(28,28,43,.44)",   // texte tertiaire
  ink5:    "rgba(28,28,43,.16)",   // ombre
  accent:      "#C0B4FE",                  // a faire maintenant
  accentSoft:  "rgba(192,180,254,.22)",
  onAccent:    "#1B1B1B",                  // texte sur accent — jamais #000
  fill:        "#1C1C2B",                  // encre pleine     — Denim
  onFill:      "#FFFFFF",
  onDark:      "#FFFFFF",                  // texte sur surface toujours sombre
  onDark2:     "rgba(255,255,255,.52)",
  onDark3:     "rgba(255,255,255,.12)",
  idcard:      "#1C1C2B",                  // carte d'identite — Denim
  done:        "#1C1C2B",                  // termine          — Denim
  doneSoft:    "rgba(28,28,43,.09)",
  alert:       "#343434",                  // action lourde    — Washed
  alertSoft:   "rgba(52,52,52,.07)",
  knob:        "#FFFFFF",
  scrim:       "rgba(255,255,255,.86)",
};
const DARK = {
  bg:      "#1B1B1B",
  s1:      "#1C1C2B",  // creux — Denim
  s2:      "#2E2E3E",  // filet — Blanc 9 % sur Denim
  s3:      "#343434",  // filet fort — Washed
  s4:      "#4B4B55",
  div:     "#343434",
  ink:     "#FFFFFF",
  ink2:    "rgba(255,255,255,.84)",
  ink3:    "rgba(255,255,255,.66)",
  ink4:    "rgba(255,255,255,.44)",
  ink5:    "rgba(255,255,255,.14)",
  accent:      "#C0B4FE",
  accentSoft:  "rgba(192,180,254,.20)",
  onAccent:    "#1B1B1B",
  // En sombre, l'encre pleine ne peut pas etre du noir sur du noir : elle devient
  // l'accent, et son texte suit.
  fill:        "#C0B4FE",
  onFill:      "#1B1B1B",
  onDark:      "#FFFFFF",
  onDark2:     "rgba(255,255,255,.52)",
  onDark3:     "rgba(255,255,255,.12)",
  // #1C1C2B sert deja de creux : la carte d'identite doit descendre plus bas,
  // sinon elle se confond avec la surface.
  idcard:      "#0E0E17",
  // "termine" valait l'accent PUR en sombre : un bloc fait et le bouton a faire
  // portaient exactement la meme couleur. Il passe a l'accent attenue.
  done:        "rgba(192,180,254,.55)",
  doneSoft:    "rgba(192,180,254,.14)",
  alert:       "rgba(255,255,255,.74)",
  alertSoft:   "rgba(255,255,255,.08)",
  knob:        "#FFFFFF",
  scrim:       "rgba(28,28,43,.86)",
};
// Surface de carte : en clair la page et la carte partagent le blanc, l'ombre
// suffit a les separer. En sombre il faut une surface distincte, et ce n'est pas
// un gris neutre mais du Denim eclairci — c'est ce qui garde la teinte violacee
// coherente avec l'accent au lieu d'un gris froid.
LIGHT.card = "#FFFFFF";
DARK.card  = "#242433";
const C = {...LIGHT};
const applyTheme=(mode)=>{
  const src=(mode==="dark")?DARK:LIGHT;
  Object.keys(src).forEach(k=>{C[k]=src[k];});
  try{
    document.documentElement.style.background=src.bg;
    document.body.style.background=src.bg;
    document.body.style.color=src.ink;
    const m=document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute("content",src.bg);
  }catch(_e){}
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
/* Catalogue deplace dans ./catalog.js */

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
// Une seance manquee n'est pas un jour de repos : elle a ete ratee, et la file
// l'a deja reportee. On le dit, et on n'affiche aucun exercice.
const MISSED_TPL = {label:"Séance manquée",salle:null,
  muscle:"Reportée — elle reprendra sa place dans le programme",
  exercises:[],abs:[],ids:[],missed:true};

// rawDay      la journee du planning hebdomadaire
// doneDay     la seance reellement enregistree ce jour-la, s'il y en a une
// beforeStart la date precede le debut du programme
// past        journee passee et non faite
// queueSession() la seance que la file propose pour cette journee
const resolveDay = ({rawDay, doneDay, beforeStart, past, queueSession}) => {
  if (doneDay) return doneDay;
  const day = rawDay && rawDay.day;
  if (beforeStart) return {...REST_TPL, day};
  // Jour desactive dans le planning : repos, meme si on est en retard.
  if (!rawDay || !rawDay.salle) return {...REST_TPL, day};
  if (past) return {...MISSED_TPL, day};
  return queueSession();
};

const SESSION_TEMPLATES = [...PROGRAM.filter(d=>d.salle).map(d=>({label:d.label,salle:d.salle,muscle:d.muscle,exercises:d.exercises,abs:d.abs,ids:d.ids})), REST_TPL];

// Rotation hebdo - mesocycle hybride (Volume -> Intensite -> Puissance -> Deload)
const VERSION="2.1.0";
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
// Numero de semaine ISO d'une date quelconque : weekNumber() ne savait traiter
// qu'aujourd'hui, ce qui interdisait d'etiqueter un historique.
const isoWeekOf=(ds)=>{ const dt=(typeof ds==="string")?new Date(ds+"T00:00:00"):new Date(ds);
  const d=new Date(Date.UTC(dt.getFullYear(),dt.getMonth(),dt.getDate())); const dn=(d.getUTCDay()+6)%7;
  d.setUTCDate(d.getUTCDate()-dn+3); const ft=new Date(Date.UTC(d.getUTCFullYear(),0,4));
  const fn=(ft.getUTCDay()+6)%7; ft.setUTCDate(ft.getUTCDate()-fn+3);
  return 1+Math.round((d-ft)/604800000); };
const fmtDateShort=(d)=>{ if(!d) return ""; const dd=(typeof d==="string")?new Date(d+"T00:00:00"):d; try{return dd.toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});}catch(_e){return "";} };
// ─── SURCHARGE PROGRESSIVE ──────────────────────────────────────────────────
// La charge proposee derivait d'un bareme generique (poids de corps x niveau x phase) et
// ne regardait JAMAIS ce qui avait ete reellement souleve. Elle derive desormais de la
// derniere performance et du RPE ressenti - sans RPE collecte, aucune progression
// automatique n'est possible, c'est pour cela qu'il est demande en fin d'exercice.
// RPE = reps en reserve : 10 = plus rien, 9 = 1 rep, 8 = 2 reps, 7 = 3 reps.
// ─── 1RM ESTIME ─────────────────────────────────────────────────────────────
// profiles.rms etait LU en priorite par le moteur et n'a jamais ete rempli : {} en base.
// Chaque serie charge x reps x RPE permet pourtant de l'estimer. Formule d'Epley corrigee
// par les repetitions en reserve : une serie a RPE 8 en laissait 2, il faut les compter.
const RIR={6:4,7:3,8:2,9:1,10:0};
const e1rmOf=(kg,reps,rpe)=>{
  const w=Number(kg)||0,r=Number(reps)||0;
  if(!(w>0)||!(r>0)) return 0;
  const rr=Math.round(Number(rpe));
  const rir=(rr>=6&&rr<=10)?RIR[rr]:1;           // sans RPE, hypothese prudente d'1 rep
  return Math.round(w*(1+(r+rir)/30)*10)/10;
};
// Meilleur 1RM estime par exercice sur l'historique, avec la date qui l'a produit.
const rmIndex=(sessions)=>{
  const m={};
  (sessions||[]).forEach(s=>{
    (s.exercises||[]).forEach(e=>{
      if(!e||!e.id) return;
      const sets=Array.isArray(e.setsDetail)&&e.setsDetail.length
        ? e.setsDetail.map(x=>({kg:x.weight,reps:x.reps}))
        : [{kg:e.weight,reps:e.reps}];
      sets.forEach(st=>{
        const v=e1rmOf(st.kg,st.reps,e.rpe);
        if(v>0&&(!m[e.id]||v>m[e.id].kg)) m[e.id]={kg:v,date:s.date};
      });
    });
  });
  return m;
};

const RPE_STEP={6:0.05,7:0.035,8:0.02,9:0,10:-0.05};
// Increment reel du materiel : une barre monte par 2,5 kg, un kettlebell ou une paire
// d'halteres par 2 kg. Sans cela, un ajustement de 5% sur 10 kg (0,5 kg) etait avale par
// l'arrondi et le ressenti n'avait AUCUN effet sur les charges legeres.
const loadStep=(eq)=>(eq==="kb"||eq==="db")?2:2.5;
// Toute charge produite par le moteur passe par ici : une kettlebell est ramenee
// a une cloche du ratelier, le reste au pas de 2,5 kg.
const snapFor=(eq,kg)=>{ const k=Array.isArray(eq)?eq[0]:eq;
  if(!(kg>0)) return 0;
  return (k==="kb")?snapKb(kg):Math.max(2.5,Math.round(kg/2.5)*2.5); };
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
  if(/dips banc|bench dip/.test(n)) return Math.round(bw*0.35); // appui arriere, bien plus facile
  if(/dips|muscle-?up/.test(n)) return Math.round(bw*0.95);
  const f=BW_FRACTION[metaOf(ex).pattern];
  return f?Math.round(bw*f):0;
};

const REST_BY_TIER={lourd:170,compound:105,isolation:65,core:40,cardio:50};
const restFor=(ex,goal,ph)=>{
  const base0=REST_BY_TIER[metaOf(ex).tier]||90;
  const rn=repsNum(ex.reps);
  let base=base0;
  if(rn>0){ if(rn<=5) base*=1.15; else if(rn>=15) base*=0.70; else if(rn>=12) base*=0.85; }
  // "hybride" tombait dans le cas par defaut, donc sur le bareme de la force pure.
  const gf=goal==="force"?1.15:goal==="endurance"?0.6:goal==="seche"?0.7
    :goal==="hypertrophie"?0.85:goal==="hybride"?0.8:0.9;
  const pf=(ph&&ph.deload)?0.9:((ph&&ph.peak)?1.1:1.0);
  return snapRest(Math.max(30,Math.min(240,base*gf*pf)));
};

const personalizeDay=(day,profile,week,perf)=>{
  if(!day||!day.salle) return day;
  if(day.v4) return day;
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
      if(ph.deload) kg=kg*0.85;
      kg=snapFor(ex.eq,kg);
    }
    else if(rm>0){ kg=snapFor(ex.eq,rm*intensity); }
    else if(typeof ex.kg==="number"&&ex.kg>0&&ex.eq!=="bw"){ kg=snapFor(ex.eq,ex.kg*scale*intensity); }
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
import { noAccent, patternOf, tierOf, progOf, metaOf } from "./classify.js";
import { v4Session, patternStrength } from "./engine.js";

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
  if(p&&p.kg>0) return snapFor(ex.eq,nextLoad(p.kg,p.rpe,p.kg,loadStep(ex.eq)));
  const sc=engineScale(profile); const base=(typeof ex.kg==="number"?ex.kg:0)*sc*f;
  return base>0?snapFor(ex.eq,base):0;
};
const buildMetcon=(day,mode,profile,week,seed,perf)=>{ if(!day||!day.salle) return day; const goal=baseGoal(profile&&profile.goal); const equip=(profile&&profile.equipment)||[]; const ph=phaseOf(week); let pool=DB.filter(e=>metconScore(e,goal)>0).filter(e=> e.eq==="bw" || !equip.length || equip.indexOf(e.eq)>=0); const seen={}; pool=pool.filter(e=>{ if(seen[e.n]) return false; seen[e.n]=1; return true; }); const dayEqs={};(day.exercises||[]).forEach(e=>{dayEqs[e.eq]=(dayEqs[e.eq]||0)+1;});pool=pool.map(e=>({e,s:metconScore(e,goal)+((dayEqs[e.eq]||0)>0?2:0)})).sort((a,b)=>b.s-a.s).map(x=>x.e); if(pool.length<6) pool=DB.filter(e=>metconScore(e,"hybride")>0); const off=pool.length?(((week-1)*3+(seed||0)*5)%pool.length):0; const rot=pool.slice(off).concat(pool.slice(0,off)); const lvl=profile&&profile.level; let nBlocks=lvl==="avance"?3:lvl==="debutant"?2:3; if(ph.deload) nBlocks=2; const perBlock=3; const rounds=lvl==="debutant"?3:lvl==="avance"?4:3; const cap=lvl==="avance"?12:10; const f=mode==="amrap"?0.55:0.65; const used={}; const blocks=[]; for(let b=0;b<nBlocks;b++){ const exs=[]; let cd=0; const mus={}; while(exs.length<perBlock){ let e=rot.find(x=>!used[x.n]&&(x.eq!=="cd"||cd<1)&&!mus[primaryMuscle(x.m)]); if(!e) e=rot.find(x=>!used[x.n]&&(x.eq!=="cd"||cd<1)); if(!e) e=rot.find(x=>!used[x.n]); if(!e) break; used[e.n]=1; if(e.eq==="cd")cd++; mus[primaryMuscle(e.m)]=1; exs.push(e); } if(!exs.length) break; const exercises=exs.map(ex=>{ const kg=metKg(ex,profile,f,perf); if(mode==="amrap"){ const r=metRepsAmrap(ex); return {...ex,kg,reps:String(ex.eq==="cd"?"40s":r),repsPerRound:r,modeTag:"AMRAP"}; } const r=metRepsEmom(ex); return {...ex,kg,reps:String(ex.eq==="cd"?"40s":r),repsPerMinute:r,modeTag:"EMOM"}; }); const durationMin=mode==="amrap"?cap:(exercises.length*rounds); blocks.push({label:(mode==="amrap"?"AMRAP ":"EMOM ")+(b+1),kind:mode,durationMin,rounds:mode==="emom"?rounds:0,exercises}); } const totalMin=blocks.reduce((a,bl)=>a+bl.durationMin,0)+Math.max(0,blocks.length-1)*2; const flat=[]; blocks.forEach((bl,bidx)=>bl.exercises.forEach(e=>{e.blockIdx=bidx;flat.push(e);})); return {...day,mode,metcon:true,blocks,totalMin,timeCapMin:blocks[0]?blocks[0].durationMin:cap,emomMinutes:blocks[0]?blocks[0].durationMin:8,exercises:flat}; };
const applyMode=(day,mode,profile,week,seed,perf)=>{ if(!day||!day.salle) return day;
  if(day.v4) return day.circuit?buildCircuits(orderDay(day),profile):orderDay(day); if(mode==="amrap"||mode==="emom") return buildMetcon(day,mode,profile,week,seed,perf); return day.circuit?buildCircuits(orderDay(day),profile):orderDay(day); };
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
  // Le moteur V4 a deja filtre sur le materiel disponible, et la charge de chaque
  // exercice a ete calculee pour LUI : substituer ici casserait la prescription.
  if (day && day.v4) return day;
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
// Quinze console.error et aucune surface utilisateur : quand une ecriture ou un envoi de
// photo echouait, rien ne le disait. Le compteur de file ne couvre que l'attente reseau,
// pas l'echec.
const TOASTS=[];const toastSubs=new Set();
let toastSeq=0;
const toastNotify=()=>{toastSubs.forEach(f=>{try{f(TOASTS.slice());}catch(_e){}});};
const notify=(msg)=>{
  if(!msg) return;
  const t={id:++toastSeq,msg};
  TOASTS.push(t); toastNotify();
  setTimeout(()=>{const i=TOASTS.findIndex(x=>x.id===t.id);if(i>=0){TOASTS.splice(i,1);toastNotify();}},5200);
};

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
      // On alerte a la troisieme tentative : les coupures breves se resolvent seules et
      // n'ont pas a inquieter, un echec persistant si.
      if(job.tries===3) notify("Enregistrement en attente : "+job.label);
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

const play=(name,arg)=>{ if(!SOUND.enabled) return;
  // Une reprise ratee laissait le contexte suspendu pour toute la seance :
  // on la retente a chaque son plutot qu'une seule fois au demarrage.
  try{ const c=audioCtx(); if(c&&c.state==="suspended") c.resume(); }catch(_e){}
  try{ if(SFX[name]) SFX[name](arg); }catch(_e){} };
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
// Toute l'interaction de l'application passe par ce composant. C'etait un simple <div> avec
// des evenements de pointeur : aucun role, aucun focus, aucune navigation au clavier, rien
// pour un lecteur d'ecran - l'application entiere etait inutilisable autrement qu'au doigt.
// On garde un div (un <button> imbrique dans un autre serait du HTML invalide, et il y a des
// Tap dans des Tap) mais avec le role, le focus et le clavier qui vont avec.
function Tap({children,onTap,style,disabled,label}) {
  const[p,setP]=useState(false);
  const fire=(e)=>{ if(!disabled) onTap?.(e); };
  return(
    <div role="button" tabIndex={disabled?-1:0} aria-disabled={disabled?true:undefined} aria-label={label}
      onPointerDown={()=>!disabled&&setP(true)} onPointerUp={(e)=>{setP(false);fire(e);}} onPointerLeave={()=>setP(false)}
      onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); setP(true); } }}
      onKeyUp={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); setP(false); fire(e); } }}
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

  const inputStyle = {width:"100%",padding:"16px",borderRadius:12,border:`1.5px solid ${C.div}`,background:C.s2,fontFamily:F,fontSize:15,color:C.ink,outline:"none",boxSizing:"border-box",transition:`border-color ${DUR.dropdown} ${EO}`};

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.auth,display:"flex",flexDirection:"column",padding:"env(safe-area-inset-top) 0 env(safe-area-inset-bottom)",fontFamily:F,overflowY:"auto"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        input:focus{border-color:${C.accent}!important;}
      `}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 28px",maxWidth:440,margin:"0 auto",width:"100%",animation:`fadeUp 400ms ${EO} both`}}>
        {/* Brand */}
        <div style={{marginBottom:48}}>
          <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}><Wordmark h={34}/></div>
          <div style={{fontSize:15,color:C.ink3,lineHeight:1.5}}>
            {mode==="login"?"Bon retour.":mode==="signup"?"Crée ton compte et commence à tracker.":"Connexion sans mot de passe."}
          </div>
        </div>

        {/* Mode switch */}
        <div style={{display:"flex",background:C.s2,borderRadius:12,padding:3,marginBottom:28,gap:3}}>
          {[["login","Connexion"],["signup","Inscription"],["magic","Magic Link"]].map(([m,l])=>(
            <Tap key={m} onTap={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"9px 6px",borderRadius:12,background:mode===m?C.s4:"transparent",textAlign:"center",transition:`background ${DUR.dropdown} ${EO}`}}>
              <span style={{fontSize:12.5,fontWeight:mode===m?600:400,color:mode===m?C.ink:C.ink4}}>{l}</span>
            </Tap>
          ))}
        </div>

        {/* Fields */}
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {mode==="signup"&&(
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom" style={inputStyle}/>
          )}
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" autoCapitalize="none" style={inputStyle}/>
          {mode!=="magic"&&(
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mot de passe" type="password" style={inputStyle} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
          )}
        </div>

        {/* Error / Success */}
        {error&&<div style={{padding:"16px",borderRadius:12,background:C.alertSoft,marginBottom:16}}><span style={{fontSize:14,color:C.alert}}>{error}</span></div>}
        {success&&<div style={{padding:"16px",borderRadius:12,background:C.doneSoft,marginBottom:16}}><span style={{fontSize:14,color:C.done}}>{success}</span></div>}

        {/* CTA */}
        <Tap onTap={loading?null:handleSubmit} disabled={loading} style={{padding:"16px",borderRadius:22,background:loading?C.s3:C.accent,display:"flex",alignItems:"center",justifyContent:"center",transition:`background ${DUR.dropdown} ${EO}`}}>
          <span style={{fontSize:15,fontWeight:600,color:loading?C.ink5:C.onAccent}}>
            {loading?"...":{login:"Se connecter",signup:"Créer le compte",magic:"Envoyer le lien"}[mode]}
          </span>
        </Tap>

        <div style={{fontSize:12.5,color:C.ink4,textAlign:"center",marginTop:24,lineHeight:1.6}}>
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
      <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:32}}>{timer.done?"Prêt à reprendre":"Repos · Prochain exercice"}</div>
      <div style={{fontSize:21,fontWeight:600,color:timer.done?C.done:C.ink2,marginBottom:40,textAlign:"center",padding:"0 32px"}}>{label}</div>
      {/* Big ring */}
      <div style={{position:"relative",width:240,height:240,marginBottom:48}}>
        <svg width="240" height="240" style={{transform:"rotate(-90deg)"}}>
          <circle cx="120" cy="120" r={R} fill="none" stroke={C.s3} strokeWidth="8"/>
          <circle cx="120" cy="120" r={R} fill="none" stroke={timer.done?C.done:C.accent} strokeWidth="8"
            strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round"
            style={{transition:"stroke-dasharray .9s linear",transitionTimingFunction:"linear"}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:56,fontWeight:600,color:timer.done?C.done:C.ink,letterSpacing:"-.02em",lineHeight:1}}>{timer.done?"GO":fmtMSS(timer.sec)}</span>
          {!timer.done&&<span style={{fontSize:14,color:C.ink4,marginTop:4}}>/{fmtMSS(timer.total)}</span>}
        </div>
      </div>
      {/* Actions */}
      <div style={{display:"flex",gap:10}}>
        {timer.running&&<Tap onTap={onSkip} style={{padding:"14px 28px",borderRadius:999,border:`1.5px solid ${C.div}`,background:"transparent"}}>
          <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Passer</span>
        </Tap>}
        {timer.done&&<Tap onTap={onClose} style={{padding:"14px 36px",borderRadius:999,background:C.accent}}>
          <span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>Reprendre</span>
        </Tap>}
        {!timer.done&&<Tap onTap={onClose} style={{padding:"14px 28px",borderRadius:999,border:`1.5px solid ${C.div}`,background:"transparent"}}>
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
      <Tap onTap={onExpand} style={{background:"rgba(17,17,17,.96)",border:`1px solid ${C.s4}`,borderRadius:22,padding:"16px",display:"flex",alignItems:"center",gap:10,maxWidth:380,width:"100%",backdropFilter:"blur(24px)"}}>
        <svg width="40" height="40" style={{transform:"rotate(-90deg)",flexShrink:0}}>
          <circle cx="20" cy="20" r={R} fill="none" stroke={C.s4} strokeWidth="4"/>
          <circle cx="20" cy="20" r={R} fill="none" stroke={timer.done?C.done:C.accent} strokeWidth="4"
            strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray .8s linear"}}/>
        </svg>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{timer.done?"Repos terminé — Go !":"Repos en cours"}</div>
          <div style={{fontSize:15,fontWeight:600,color:timer.done?C.done:C.ink,marginTop:2}}>{timer.done?"Reprends ta série":fmtMSS(timer.sec)}</div>
        </div>
        <span style={{fontSize:12.5,fontWeight:600,color:C.accent}}>Agrandir</span>
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
// Materiel a charge FIXE : on saisit une cloche, on ne la change pas en cours
// d'exercice. Une rampe y prescrivait des poids qui n'existent pas (17,5 / 22,5 kg)
// et un changement de kettlebell entre chaque serie.
const FIXED_LOAD_EQ={kb:true};
// Ratelier reel. Toute charge de kettlebell est ramenee a la cloche existante la plus
// proche : le moteur prescrivait 17,5 ou 22,5 kg, qui ne se soulevent nulle part.
const KB_RACK=[6,8,10,12,16,20,24,32];
const snapKb=(kg)=>{ if(!(kg>0)) return 0;
  return KB_RACK.reduce((best,w)=>Math.abs(w-kg)<Math.abs(best-kg)?w:best,KB_RACK[0]); };
// Cloche suivante / precedente du ratelier : les boutons + et − sautaient de 2,5 kg,
// ce qui fabriquait des poids inexistants des la premiere pression.
const kbStep=(kg,dir)=>{ const i=KB_RACK.indexOf(snapKb(kg));
  return KB_RACK[Math.max(0,Math.min(KB_RACK.length-1,(i<0?0:i)+dir))]; };
const isFixedLoad=(ex)=>{const e=ex&&ex.eq;const k=Array.isArray(e)?e[0]:e;return !!FIXED_LOAD_EQ[k];};
// Echauffement : chaque mouvement porte sa duree, et la somme fait exactement 5 min.
const WARMUP={
  haut:[["Rotations épaules","60s"],["Wall slide","60s"],["Push-up to downdog","60s"],
        ["Mobilité thoracique","60s"],["Band pull-apart","60s"]],
  bas :[["Corde à sauter","60s"],["Hip circle","60s"],["Leg swing","60s"],
        ["Squat à vide","60s"],["KB Swing léger","60s"]],
};
const warmupExos=(salle)=>(WARMUP[salle==="haut"?"haut":"bas"]).map(([n,d],i)=>(
  {id:`warm_${salle==="haut"?"h":"b"}${i}`,n,m:"Échauffement",eq:"bw",kg:0,sets:1,reps:d,rest:0,aux:"warmup"}));
const WARMUP_SEC=300;

// Gainage : le catalogue donne un volume texte ("4×6", "3×20s"). Pour se comporter
// comme un exercice il faut un nombre de series et des reps separes.
const absExo=(a)=>{
  const m=String(a.vol||"").match(/^(\d+)\s*[x×]\s*(.+)$/);
  return {id:a.id,n:a.n||a.name,m:"Gainage · abdominaux",eq:a.eq||"bw",kg:0,
    sets:m?parseInt(m[1]):3,reps:m?m[2]:(a.vol||"12"),rest:45,aux:"abs"};
};

// Etape d'apprentissage : l'objectif est ecrit "5×5 propres". Meme traitement.
const skillExo=(sk,step)=>{
  const m=String(step.target||"").match(/^(\d+)\s*[x×]\s*([^\s]+)/);
  return {id:`skill_${sk.id}`,n:step.label,m:`Apprentissage · ${sk.name}`,eq:"bw",kg:0,
    sets:m?parseInt(m[1]):4,reps:m?m[2]:(step.target||"5"),rest:90,aux:"skill"};
};

const setPlanFor=(ex)=>{
  const n=Math.max(1,typeof ex.sets==="number"?ex.sets:4);
  const fixed=isFixedLoad(ex);
  const W=fixed?snapKb(ex.kg||0):(ex.kg||0);
  return Array.from({length:n},(_,i)=>{
    // Une cloche de 24 kg pese 24 kg : l'arrondi au pas de 2,5 la faisait afficher a 25.
    if(fixed) return {w:W,reps:ex.reps};
    const frac=n>1?(0.7+0.3*i/(n-1)):1;
    return {w:W>0?Math.round(W*frac/2.5)*2.5:0,reps:ex.reps};
  });
};
const repsNum=(r)=>{const m=String(r||"").match(/\d+/);return m?parseInt(m[0]):0;};

function HomeTab({profile,streak,sessions,weights,todaySession,onStartToday,accent,trainingDaysPerWeek,weighIns}) {
  const now=new Date();
  const wk=(()=>{const d=new Date(now);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);d.setHours(0,0,0,0);return d;})();
  const weekKeys=Array.from({length:7},(_,i)=>{const d=new Date(wk);d.setDate(wk.getDate()+i);return localDateKey(d);});
  const weekSessions=sessions.filter(s=>weekKeys.indexOf(s.date)>=0);
  const weekVol=weekSessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const weekSets=weekSessions.reduce((a,s)=>a+(Number(s.totalSets)||0),0);
  // Seances de CE programme : le meme perimetre que la barre d'avancement juste
  // en dessous, qui annoncait "5 / 60" au-dessus de "6 seances enregistrees".
  const progStart=profile&&profile.program_start;
  const progSessions=progStart?sessions.filter(x=>x&&x.date>=progStart):sessions;
  const totalSessions=progSessions.length;
  const lwStart=new Date(wk);lwStart.setDate(lwStart.getDate()-7);
  const lwKeys=Array.from({length:7},(_,i)=>{const d=new Date(lwStart);d.setDate(lwStart.getDate()+i);return localDateKey(d);});
  const lastWeekSessions=sessions.filter(s=>lwKeys.indexOf(s.date)>=0);
  const lastWeekVol=lastWeekSessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const volDeltaPct=lastWeekVol>0?Math.round((weekVol-lastWeekVol)/lastWeekVol*100):null;
  const fmtMin=(m)=>m>=60?`${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`:`${m} min`;
  const weekMin=Math.round(weekSessions.reduce((a,s)=>a+(Number(s.duration)||0),0)/60);
  const lastWeekMin=Math.round(lastWeekSessions.reduce((a,s)=>a+(Number(s.duration)||0),0)/60);
  const minDelta=weekMin-lastWeekMin;
  const sessDelta=weekSessions.length-lastWeekSessions.length;
  const showBilan=lastWeekSessions.length>0||weekSessions.length>0;
  const hour=now.getHours();
  const hello=hour<12?"Bonjour":hour<18?"Bon après-midi":"Bonsoir";
  const name=(profile&&profile.name)?profile.name:"";
  const isRest=!todaySession||!todaySession.salle;
  const progIndex=Math.min(totalSessions,profile?.total_sessions||PROGRAM_SESSIONS);
  const progTotal=profile?.total_sessions||PROGRAM_SESSIONS;
  const goalLabel=(GOALS.find(g=>g[0]===profile?.goal)||[])[1]||null;
  const todayKeyStr=todayKey();

  // Minutes par jour de la semaine : ce sont elles qui donnent la hauteur des barres.
  const dayMin=weekKeys.map(k=>{
    const found=sessions.filter(x=>x.date===k);
    return Math.round(found.reduce((a,x)=>a+(Number(x.duration)||0),0)/60);
  });
  const maxMin=Math.max(1,...dayMin);
  const DAYS=["L","M","M","J","V","S","D"];

  // Courbe de poids : les huit dernieres pesees, ou le poids du profil a defaut.
  const wpts=(weighIns||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(-8)
    .map(w=>Number(w.weight_kg)).filter(v=>v>0);
  const lastW=wpts.length?wpts[wpts.length-1]:(Number(profile&&profile.weight_kg)||0);
  const wDelta=wpts.length>1?Math.round((wpts[wpts.length-1]-wpts[0])*10)/10:null;

  // ── briques visuelles du tableau de bord ──
  const Card=({children,bg,pad,style})=>(
    <div style={{background:bg||C.bg,borderRadius:22,padding:pad||"16px",
      boxShadow:`0 3px 16px ${C.ink5}`,border:`1px solid ${C.s2}`,...style}}>{children}</div>
  );
  const Pill=({children,bg,fg,style})=>(
    <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,whiteSpace:"nowrap",
      background:bg||C.accentSoft,color:fg||C.ink2,...style}}>{children}</span>
  );
  const K=({children})=>(<span style={{fontSize:11.5,fontWeight:500,color:C.ink4}}>{children}</span>);
  const Row=({children,style})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,...style}}>{children}</div>);
  const Curve=({vals,h,stroke})=>{
    const n=(vals||[]).length;
    if(n<2) return <div style={{height:h||40}}/>;
    const mn=Math.min(...vals),mx=Math.max(...vals),sp=(mx-mn)||1;
    const W=120,H=h||40,P=5;
    const pt=(v,i)=>[P+(i/(n-1))*(W-P*2),P+(1-(v-mn)/sp)*(H-P*2)];
    const d=vals.map((v,i)=>`${i?"L":"M"}${pt(v,i)[0].toFixed(1)},${pt(v,i)[1].toFixed(1)}`).join(" ");
    const last=pt(vals[n-1],n-1);
    return (<svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{display:"block",overflow:"visible"}}>
      <path d={d} fill="none" stroke={stroke||C.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="3.4" fill={C.ink}/></svg>);
  };

  return (<div style={{padding:"18px 18px 0",maxWidth:600,margin:"0 auto",display:"flex",flexDirection:"column",gap:10}}>

    {/* En-tete */}
    <Row style={{marginBottom:2}}>
      <div>
        <K>{hello}</K>
        <div style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em",lineHeight:1.15}}>{name||"Athlète"}</div>
      </div>
      <Pill bg={C.accent} fg={C.onAccent} style={{fontSize:11.5,padding:"7px 14px"}}>Séance {progIndex} / {progTotal}</Pill>
    </Row>

    {/* Carte maitresse : volume de la semaine + barres hachurees, jour en cours plein */}
    <Card>
      <Row><span style={{fontSize:14,fontWeight:600,color:C.ink}}>Volume d'entraînement</span>
        <Pill bg={C.s2} fg={C.ink3}>Semaine</Pill></Row>
      <div style={{display:"flex",gap:10,alignItems:"flex-end",marginTop:10}}>
        <div style={{flex:"0 0 auto",minWidth:104}}>
          {volDeltaPct!==null&&<Pill>{volDeltaPct>=0?"+":""}{volDeltaPct} % vs S-1</Pill>}
          <div style={{fontSize:34,fontWeight:500,color:C.ink,letterSpacing:"-.035em",lineHeight:1,marginTop:8,fontVariantNumeric:"tabular-nums"}}>
            {String(Math.round(weekVol/100)/10).replace(".",",")}<span style={{fontSize:12.5,fontWeight:400,color:C.ink4}}> t</span>
          </div>
          <div style={{display:"flex",gap:5,marginTop:9,flexWrap:"wrap"}}>
            <Pill bg={C.ink} fg={C.bg}>{fmtMin(weekMin)}</Pill>
            <Pill bg={C.ink} fg={C.bg}>{weekSets} séries</Pill>
          </div>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:6,height:112}}>
          {dayMin.map((m,i)=>{
            const isToday=weekKeys[i]===todayKeyStr;
            const h=Math.max(9,Math.round(m/maxMin*100));
            return (<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5,height:"100%",justifyContent:"flex-end"}}>
              <div title={`${m} min`} style={{width:"100%",height:`${h}%`,borderRadius:999,
                background:isToday?C.ink:"transparent",
                backgroundImage:isToday?"none":`repeating-linear-gradient(115deg, ${C.bg} 0 4px, ${C.s2} 4px 9px)`,
                border:isToday?"none":`1px solid ${C.s2}`,transition:`height 480ms ${EO}`}}/>
              <span style={{fontSize:10,fontWeight:500,color:isToday?C.ink:C.ink4}}>{DAYS[i]}</span>
            </div>);
          })}
        </div>
      </div>
    </Card>

    {/* Seance du jour + serie en cours */}
    <Row style={{marginTop:2}}><span style={{fontSize:14,fontWeight:600,color:C.ink}}>Séance du jour</span>
      {goalLabel&&<K>Programme {goalLabel}</K>}</Row>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Card bg={isRest?C.s1:C.accent} style={{minWidth:0,display:"flex",flexDirection:"column"}}>
        <K>{isRest?"Aujourd'hui":"À faire"}</K>
        <div style={{fontSize:15,fontWeight:600,color:isRest?C.ink:C.onAccent,letterSpacing:"-.02em",lineHeight:1.15,marginTop:3}}>
          {todaySession?todaySession.label:"Repos"}</div>
        <div style={{fontSize:11.5,color:isRest?C.ink4:"rgba(27,27,27,.6)",marginTop:2,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {todaySession?todaySession.muscle:"Récupération active"}</div>
        {!isRest&&<Tap label="Démarrer la séance" onTap={onStartToday}
          style={{marginTop:"auto",paddingTop:0,height:44,borderRadius:12,background:C.fill,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:14,fontWeight:600,color:C.onFill}}>Démarrer</span></Tap>}
      </Card>
      <Card bg={C.s1} style={{minWidth:0,display:"flex",flexDirection:"column"}}>
        <K>Série en cours</K>
        <div style={{fontSize:34,fontWeight:500,color:C.ink,letterSpacing:"-.03em",lineHeight:1,marginTop:4,fontVariantNumeric:"tabular-nums"}}>
          {streak}<span style={{fontSize:11.5,fontWeight:400,color:C.ink4}}> {streak>1?"jours":"jour"}</span></div>
        <div style={{marginTop:"auto",paddingTop:10}}>
          <Curve vals={dayMin.some(v=>v>0)?dayMin:[0,1,0,2,1,0,1]} h={30} stroke={C.ink3}/>
        </div>
      </Card>
    </div>

    {/* Poids + avancement du programme */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Card>
        <Row><K>Poids de corps</K>{wDelta!==null&&wDelta!==0&&<Pill bg={C.s2} fg={C.ink3}>{wDelta>0?"+":""}{wDelta}</Pill>}</Row>
        <div style={{marginTop:6}}><Curve vals={wpts.length>1?wpts:[lastW,lastW]} h={38}/></div>
        <div style={{fontSize:21,fontWeight:500,color:C.ink,letterSpacing:"-.03em",marginTop:4,fontVariantNumeric:"tabular-nums"}}>
          {lastW?String(lastW).replace(".",","):"—"}<span style={{fontSize:11.5,fontWeight:400,color:C.ink4}}> kg</span></div>
      </Card>
      <Card>
        <Row><K>Programme</K><Pill bg={C.s2} fg={C.ink3}>{Math.round(progIndex/progTotal*100)} %</Pill></Row>
        <div style={{fontSize:21,fontWeight:500,color:C.ink,letterSpacing:"-.03em",marginTop:6,fontVariantNumeric:"tabular-nums"}}>
          {progIndex}<span style={{fontSize:11.5,fontWeight:400,color:C.ink4}}> / {progTotal}</span></div>
        <div style={{display:"flex",gap:2.5,marginTop:11,height:26,alignItems:"flex-end"}}>
          {Array.from({length:20},(_,i)=>(
            <span key={i} style={{flex:1,height:"100%",borderRadius:999,
              background:i<Math.round(progIndex/progTotal*20)?C.accent:C.s2,transition:`background 400ms ${EO}`}}/>
          ))}
        </div>
        <div style={{fontSize:11.5,color:C.ink4,marginTop:7}}>{totalSessions} séance{totalSessions>1?"s":""} dans ce programme</div>
      </Card>
    </div>

    {showBilan&&<Card bg={C.s1}>
      <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Bilan vs semaine dernière</div>
      {[["Séances",`${weekSessions.length} vs ${lastWeekSessions.length}`,sessDelta,""],
        ["Temps",`${fmtMin(weekMin)} vs ${fmtMin(lastWeekMin)}`,minDelta," min"],
        ["Volume",`${Math.round(weekVol).toLocaleString("fr-FR")} kg`,volDeltaPct," %"]].map(([l,v,d,u],i)=>(
        <Row key={l} style={{padding:"6px 0",borderTop:i?`1px solid ${C.s2}`:"none"}}>
          <span style={{fontSize:12.5,color:C.ink3}}>{l}</span>
          <span style={{fontSize:12.5,fontWeight:500,color:C.ink}}>{v}
            {d!==null&&d!==0&&<span style={{color:C.ink3,fontWeight:400}}> · {d>0?"+":""}{d}{u}</span>}</span>
        </Row>
      ))}
    </Card>}

    {progTotal>0&&progIndex>=progTotal&&<Card bg={C.accentSoft}>
      <span style={{fontSize:12.5,fontWeight:600,color:C.ink}}>Programme terminé — choisis un nouveau programme dans Réglages</span></Card>}

    <div style={{height:6}}/>
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
  const Chip=({on,label,onTap})=>(<Tap onTap={onTap} style={{padding:"10px 14px",borderRadius:12,background:on?C.accent:C.s2,border:`1px solid ${on?C.accent:C.div}`}}><span style={{fontSize:14,fontWeight:600,color:on?C.onAccent:C.ink2}}>{label}</span></Tap>);
  const apply=()=>{ const cons={injury}; if(equipMode==="bw") cons.bw=true; else if(equipMode==="pick"&&equip.length) cons.equipment=equip; onApply({mode,cons}); };
  return (<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:Z.fullscreen,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:600,maxHeight:"88vh",overflowY:"auto",background:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:"20px 20px calc(20px + env(safe-area-inset-bottom))"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}><span style={{fontSize:15,fontWeight:600,color:C.ink}}>Réglages de la séance</span><Tap onTap={onClose} style={{width:36,height:36,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap></div>
      <div style={{fontSize:11.5,color:C.ink4,marginBottom:18}}>Ces réglages ne s'appliquent qu'à cette séance, pas au reste du programme.</div>
      <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Format</div>
      <div style={{display:"flex",gap:8,marginBottom:22}}>{[["classique","Classique"],["amrap","AMRAP"],["emom","EMOM"]].map(([m,l])=><div key={m} style={{flex:1}}><Chip on={mode===m} label={l} onTap={()=>setMode(m)}/></div>)}</div>
      <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Blessure — zone à éviter</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:22}}>{ZONES.map(([k,l])=><Chip key={k} on={injury.indexOf(k)>=0} label={l} onTap={()=>tog(injury,setInjury,k)}/>)}</div>
      <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Équipement</div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>{[["all","Tout"],["bw","Poids du corps"],["pick","Choisir"]].map(([k,l])=><Chip key={k} on={equipMode===k} label={l} onTap={()=>setEquipMode(k)}/>)}</div>
      {equipMode==="pick"&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>{EQS.map(([k,l])=><Chip key={k} on={equip.indexOf(k)>=0} label={l} onTap={()=>tog(equip,setEquip,k)}/>)}</div>}
      <Tap onTap={apply} style={{marginTop:14,height:52,borderRadius:12,background:C.fill,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.onFill}}>Appliquer à cette séance</span></Tap>
    </div>
  </div>);
}
function CircuitPlayer({mode,exos,onClose,defMin,blocks,onAllDone,startBlock,log,onLogSet,sDate,blockNo,blockCount}) {
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
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"16px",flexShrink:0}}>
      <Tap onTap={onClose} style={{width:40,height:40,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:21,color:C.ink3}}>‹</span></Tap>
      <div style={{textAlign:"center",minWidth:0,flex:1}}>
        <div style={{fontSize:12.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>Bloc {blockNo||(bi+1)}/{blockCount||BLK.length}</div>
        <div style={{fontSize:15,fontWeight:600,color:C.ink,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cur.label||(kind==="amrap"?"AMRAP":kind==="emom"?"EMOM":kind==="circuit"?"Circuit":"Superset")}</div>
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
        <circle cx="66" cy="66" r={RING} fill="none" stroke={C.done} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC*(1-Math.max(0,Math.min(1,pct)))}
          style={{transition:`stroke-dashoffset 900ms linear`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
        <span style={{fontSize:34,fontWeight:600,color:C.ink,letterSpacing:"-.03em",fontVariantNumeric:"tabular-nums"}}>{value}</span>
        <span style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{label}</span>
      </div>
    </div>
  );
  const TourBar=({d,t})=>(
    <div style={{display:"flex",gap:5}}>
      {Array.from({length:Math.max(1,t)},(_,i)=>(
        <div key={i} style={{flex:1,height:5,borderRadius:3,background:i<d?C.done:C.s3,transition:`background 200ms ${EO}`}}/>
      ))}
    </div>
  );
  const Dots=({n,at})=>(
    <div style={{display:"flex",gap:6,justifyContent:"center"}}>
      {Array.from({length:n},(_,i)=>(
        <div key={i} style={{width:i===at?10:8,height:i===at?10:8,borderRadius:"50%",
          background:i<at?C.done:i===at?C.ink4:C.s4,transition:`all 200ms ${EO}`}}/>
      ))}
    </div>
  );
  const exSub=(e)=>e?`${e.kg>0?e.kg+" kg · ":""}${e.reps} reps`:"";
  const Now=({ex,sub})=>(
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:34,fontWeight:600,color:C.ink,letterSpacing:"-.02em",lineHeight:1.15}}>{ex?ex.n:"—"}</div>
      <div style={{fontSize:15,color:C.ink3,marginTop:6,fontVariantNumeric:"tabular-nums"}}>{sub}</div>
    </div>
  );
  const NextUp=({label,ex})=> ex?(
    <div style={{background:C.s1,borderRadius:22,padding:"12px 15px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
      <span style={{fontSize:12.5,color:C.ink4,flexShrink:0}}>{label}</span>
      <span style={{fontSize:15,fontWeight:600,color:C.ink,textAlign:"right"}}>{ex.n}</span>
    </div>
  ):null;
  const Btn=({label,act,bg,fg,flex})=>(
    <Tap onTap={act} style={{flex:flex||1,padding:"16px",borderRadius:12,background:bg||C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontSize:15,fontWeight:600,color:fg||C.onAccent}}>{label}</span>
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
          <div style={{textAlign:"center",fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>Tour {stour} sur {supTours}</div>
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
        <span style={{fontWeight:600,color:C.ink}}>{rounds}</span> tour{rounds>1?"s":""} complet{rounds>1?"s":""}
        {running&&!done&&si>0?` · ${si}/${cexos.length} dans le tour en cours`:""}
      </div>
      {running&&!done&&<><Now ex={curEx} sub={exSub(curEx)}/><Dots n={cexos.length} at={si}/><NextUp label="Ensuite" ex={nextEx}/></>}
      {!running&&!done&&<NextUp label="Commence par" ex={cexos[si]}/>}
    </div>);
    FOOT=(<div style={BAR}>
      {running&&!done&&<Btn label="Pause" act={pause} bg={C.s2} fg={C.ink3} flex={0} />}
      {done
        ? <Btn label={lastBlock?"Terminer":"Bloc suivant"} act={finishBlock} bg={C.done}/>
        : running
          ? <Btn label="Fait" act={validateAmrap} bg={C.done} flex={2}/>
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
        ? <Btn label={lastBlock?"Terminer":"Bloc suivant"} act={finishBlock} bg={C.done}/>
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
              <div style={{fontSize:21,fontWeight:600,color:C.ink}}>{cur.label||"Bloc"} terminé</div>
              <div style={{fontSize:12.5,color:C.ink4,marginTop:4,marginBottom:6}}>Ta réponse ajuste les charges des prochaines séances.</div>
              <div style={{fontSize:11.5,color:C.ink4,marginBottom:16}}>{cexos.map(e=>e.n).join(" · ")}</div>
              {[[6,"Trop léger","La charge était sous-évaluée"],
                [7,"Ça passait","Il restait 3 répétitions"],
                [8,"Exigeant","Il restait 2 répétitions"],
                [9,"Très dur","Il restait 1 répétition"],
                [10,"Pas tenu","Charge trop lourde ou série cassée"]].map(([v,t,d])=>(
                <Tap key={v} onTap={()=>submitDebrief(v)} style={{display:"flex",alignItems:"center",gap:10,padding:"16px",borderRadius:12,background:C.s1,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:15,fontWeight:600,color:C.ink2}}>{v}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{t}</div>
                    <div style={{fontSize:11.5,color:C.ink4,marginTop:1}}>{d}</div>
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
function ExerciseRowCollapsed({ex,dayIdx,sDate,log,idx,onOpen,onReplace,doneSession,onOriginY,barColor,grouped,first}) {
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
  // Ligne de la maquette : filet de couleur, intitule, ligne de detail, valeur a droite.
  // L'ancienne ligne etait une carte grise autonome avec une pastille de progression de
  // 44 px et un chevron - trois elements qui empechaient de lire un bloc comme un tout.
  const sub=grouped?"enchaîner":(restLbl?`repos ${restLbl}`:null);
  const sub2=[sub,(ex.rpe?`RPE ${ex.rpe}`:null)].filter(Boolean).join(" · ");
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",
      borderTop:first?"none":`1px solid ${C.s2}`,
      animation:`fadeSlideIn 280ms ${EO} ${idx*30}ms both`}}>
      <Tap label={ex.n} onTap={(e)=>{
        try{ const r=e&&e.currentTarget&&e.currentTarget.getBoundingClientRect&&e.currentTarget.getBoundingClientRect();
             if(r&&onOriginY) onOriginY(Math.max(0,Math.min(100,Math.round((r.top+r.height/2)/window.innerHeight*100)))); }catch(_e){}
        onOpen&&onOpen();
      }} style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10}}>
        <span style={{width:4,height:30,borderRadius:2,flexShrink:0,
          background:allDone?C.done:(barColor||C.s4),transition:`background 240ms ${EO}`}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:500,color:allDone?C.ink4:C.ink,
            textDecoration:allDone?"line-through":"none",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ex.n}</div>
          {(sub2||completed>0)&&<div style={{fontSize:11.5,color:C.ink4,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {allDone?`${completed} séries faites`:(completed>0?`${completed}/${target} · ${sub2}`:sub2)}
          </div>}
        </div>
        <span style={{fontSize:12.5,color:allDone?C.ink4:C.ink2,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>
          {n} × {wlabel}
        </span>
      </Tap>
      {!allDone&&onReplace&&<Tap label="Remplacer l'exercice" onTap={()=>onReplace(ex)}
        style={{width:28,height:28,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name="swap" size={15} stroke={C.ink4}/></Tap>}
    </div>
  );
}


function ExerciseFocus({ex,dayIdx,sDate,log,onLogSet,onClose,onNext,hasNext,idx,count,heading,onDetail,lastPerf,originY}) {
  // Fermeture animee : le composant reste monte le temps de l'animation de sortie, sinon
  // l'ecran disparaissait d'un coup et on perdait le lien avec la liste d'ou l'on venait.
  const [closing,setClosing]=useState(false);
  const leave=useCallback((after)=>{setClosing(true);setTimeout(()=>{(after||onClose)();},200);},[onClose]);
  const plan=setPlanFor(ex);const n=plan.length;
  const fixedLoad=isFixedLoad(ex);
  const lk=`${sDate}_${ex.id}`;
  const [done,setDone]=useState(()=>plan.map((_,i)=>!!(log[`${lk}_s${i}`]&&log[`${lk}_s${i}`].done)));
  // Charge et reps ajustables serie par serie, initialisees sur ce qui est deja enregistre
  // pour cette date puis sur le prescrit. Le prescrit n'est qu'une proposition : sans ce
  // reglage, aucune montee en charge reelle ne pouvait etre enregistree.
  const restEnd=useRef(0);
  // Horloge de l'exercice : on cumule le temps ecoule entre deux series validees,
  // reprises comprises. Sortir de l'ecran et y revenir n'ajoute rien d'artificiel
  // puisque le cumul repart du dernier repere pose.
  const durKey=`${sDate}_${ex.id}_dur`;
  const mark=useRef(Date.now());
  // Retour au premier plan : on recale le decompte sur l'heure de fin reelle.
  useEffect(()=>{
    const resync=()=>{
      if(document.hidden||!restEnd.current) return;
      const left=Math.max(0,Math.round((restEnd.current-Date.now())/1000));
      restLeft.current=left; setResting(left);
      if(left<=0){ clearInterval(restRef.current); restEnd.current=0; signalRestOver(); }
    };
    document.addEventListener("visibilitychange",resync);
    window.addEventListener("focus",resync);
    return ()=>{ document.removeEventListener("visibilitychange",resync);
      window.removeEventListener("focus",resync); };
  },[]);
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
    restEnd.current=Date.now()+s*1000;
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
    const now=Date.now();
    const seg=Math.min(1800,Math.max(0,Math.round((now-mark.current)/1000)));
    mark.current=now;
    onLogSet(durKey,{dur:((log[durKey]&&log[durKey].dur)||0)+seg,date:sDate});
    const drift=Math.round((loads[i]-(Number(plan[i].w)||0))*10)/10;
    if(i<n-1&&drift!==0){
      setLoads(l=>l.map((v,j)=>(j>i&&!done[j])
        ? Math.max(0,Math.round(((Number(plan[j].w)||0)+drift)*10)/10) : v));
    }
    if(i<n-1&&ex.rest>0) startRest(ex.rest);
  };
  // ─── "Une chose a la fois" ─────────────────────────────────────────────────
  // L'ecran ne montre que l'action en cours : cette serie, ou ce repos. Le reste
  // de la seance reste dans la liste, en arriere. La liste de toutes les series
  // empilees demandait de chercher sa ligne entre deux efforts et offrait des
  // cibles etroites; ici il n'y a qu'un geste possible a chaque instant.
  // Cinq pastilles rondes disaient seulement combien de series restaient. Elles deviennent
  // la montee en charge complete : chaque serie affiche SA charge, l'etat fait / en cours /
  // a venir se lit d'un coup d'oeil, et on sait ou l'on va avant de commencer.
  const dots=(
    <div style={{display:"flex",gap:6}}>
      {plan.map((_,i)=>{
        const isCur=i===cur&&resting===0;
        const on=done[i]||isCur;
        return (
          <div key={i} style={{flex:"1 1 0",minWidth:0,padding:"8px 3px",borderRadius:12,textAlign:"center",
            background:done[i]?C.done:(isCur?C.accent:C.bg),
            border:`1px solid ${done[i]?C.done:(isCur?C.accent:C.s3)}`,
            transition:`all 240ms ${EO}`,animation:done[i]?`popIn 260ms ${EO} both`:"none"}}>
            <div style={{fontSize:10,fontWeight:600,letterSpacing:".06em",color:on?C.onAccent:C.ink4}}>S{i+1}</div>
            <div style={{fontSize:12.5,fontWeight:600,marginTop:1,fontVariantNumeric:"tabular-nums",
              color:on?C.onAccent:C.ink3}}>{loads[i]>0?loads[i]:"PdC"}</div>
          </div>
        );
      })}
    </div>
  );
  const step=(lbl,act)=>(
    <Tap label={lbl==="+"?"Augmenter":"Diminuer"} onTap={act}
      style={{width:52,height:52,borderRadius:22,background:C.bg,border:`1px solid ${C.s3}`,
        boxShadow:`0 2px 10px ${C.ink5}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Icon name={lbl==="+"?"plus":"minus"} size={18} stroke={C.ink2}/>
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px"}}>
        <Tap onTap={()=>leave()} style={{width:40,height:40,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:21,color:C.ink3}}>‹</span></Tap>
        <div style={{textAlign:"center",minWidth:0,flex:1}}>
          <div style={{fontSize:12.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{heading||`Exercice ${idx+1}/${count}`}</div>
        </div>
        <Tap onTap={()=>onDetail&&onDetail(ex)} style={{width:40,height:40,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.accent}}>i</span></Tap>
      </div>

      <div ref={scRef} key={resting>0?"rest":allDone?"done":`set${cur}`}
        style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",padding:"0 20px 20px",WebkitOverflowScrolling:"touch",animation:`stateIn 260ms ${EO} both`}}>

        {/* REPOS — il occupe l'ecran au lieu de se cacher sous la liste : on ne l'ecourte plus par distraction */}
        {resting>0?(
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:22,padding:"20px 0"}}>
            <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",animation:`dropIn 240ms ${EO} both`}}>Récupération</div>
            <div style={{position:"relative",width:132,height:132,animation:`riseIn 300ms ${EO} 60ms both`}}>
              <svg width="132" height="132" viewBox="0 0 132 132" style={{transform:"rotate(-90deg)"}}>
                <circle cx="66" cy="66" r={RING} fill="none" stroke={C.s2} strokeWidth="9"/>
                <circle cx="66" cy="66" r={RING} fill="none" stroke={C.done} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC*restPct} style={{transition:`stroke-dashoffset 900ms linear`}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:34,fontWeight:600,color:C.ink,letterSpacing:"-.03em",fontVariantNumeric:"tabular-nums"}}>{fmtMSS(resting)}</span>
              </div>
            </div>
            <div style={{textAlign:"center",animation:`riseIn 300ms ${EO} 140ms both`}}>
              <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>Ensuite</div>
              <div style={{fontSize:15,fontWeight:600,color:C.ink}}>Série {cur+1} · {curLoad>0?`${curLoad} kg`:"Poids du corps"} × {curReps}</div>
            </div>
            <Tap onTap={skipRest} style={{padding:"15px 26px",borderRadius:12,background:C.s2}}>
              <span style={{fontSize:15,fontWeight:600,color:C.ink2}}>Passer le repos</span>
            </Tap>
          </div>
        ):allDone?(
          /* EXERCICE TERMINE — la montee en charge se lit d'un coup d'oeil */
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",gap:20,padding:"20px 0"}}>
            <div style={{textAlign:"center"}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:C.done,margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:21,fontWeight:600,color:C.onAccent}}>✓</span>
              </div>
              <div style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em"}}>{ex.n}</div>
              <div style={{fontSize:14,color:C.ink4,marginTop:5}}>{n} séries terminées</div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
              borderRadius:22,padding:"15px 17px",display:"flex",flexDirection:"column",gap:7}}>
              {plan.map((_,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:12.5,color:C.ink4}}>Série {i+1}</span>
                  <span style={{fontSize:15,fontWeight:600,color:C.ink,fontVariantNumeric:"tabular-nums"}}>{loads[i]>0?`${loads[i]} kg`:"PdC"} × {reps[i]}</span>
                </div>
              ))}
            </div>
            {/* Le RPE est la seule donnee que l'application ne pouvait pas deduire, et c'est
                celle qui determine la charge de la prochaine seance. Demande une fois, ici. */}
            <div>
              <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10,textAlign:"center"}}>Difficulté ressentie</div>
              <div style={{display:"flex",gap:7}}>
                {[6,7,8,9,10].map(v=>{
                  const on=rpeVal===v;
                  return (
                    <Tap key={v} onTap={()=>{setRpeVal(v);onLogSet(`${lk}_rpe`,{rpe:v,date:todayKey()});play("clic");}}
                      style={{flex:1,padding:"14px 0",borderRadius:22,background:on?C.accent:C.bg,
                        border:`1px solid ${on?C.accent:C.s3}`,boxShadow:on?"none":`0 2px 10px ${C.ink5}`,
                        display:"flex",alignItems:"center",justifyContent:"center",transition:`all 160ms ${EO}`}}>
                      <span style={{fontSize:15,fontWeight:600,color:on?C.onAccent:C.ink3}}>{v}</span>
                    </Tap>
                  );
                })}
              </div>
              <div style={{fontSize:11.5,color:rpeVal?C.ink3:C.ink4,marginTop:9,textAlign:"center",minHeight:17}}>
                {rpeVal?RPE_LABEL[rpeVal]:"Combien de répétitions te restait-il ?"}
              </div>
            </div>
            <div>
              <Tap onTap={()=>leave()} style={{padding:"16px",borderRadius:22,background:C.fill,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:15,fontWeight:600,color:C.onFill}}>Retour à la liste</span>
              </Tap>
              {hasNext&&<Tap onTap={()=>leave(onNext)} style={{marginTop:10,padding:"16px",borderRadius:22,background:"transparent",border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Enchaîner sur le suivant →</span>
              </Tap>}
            </div>
          </div>
        ):(
          /* SERIE EN COURS — une seule serie a l'ecran, ajustable avant validation */
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:18,paddingTop:4}}>
            <div>
              <div style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em",lineHeight:1.15}}>{ex.n}</div>
              <div style={{fontSize:14,color:C.ink4,marginTop:5}}>{ex.m}{ex.cue?` · ${ex.cue}`:""}</div>
            </div>
            <div style={{textAlign:"center",padding:"6px 0"}}>
              <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>Série {cur+1} sur {n}</div>
              <div style={{fontSize:64,fontWeight:600,color:C.ink,letterSpacing:"-.04em",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>
                {curLoad>0?curLoad:"PdC"}{curLoad>0&&<span style={{fontSize:21,fontWeight:600,color:C.ink3}}> kg</span>}
              </div>
              <div style={{fontSize:15,color:C.ink3,marginTop:8,fontVariantNumeric:"tabular-nums"}}>× {curReps} reps{ex.rpe?` · RPE ${ex.rpe}`:""}</div>
            </div>
            {/* Ajustement avant validation : la charge reelle differe souvent du prescrit,
                et c'est la seule facon d'enregistrer une vraie montee en charge. */}
            <div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"center"}}>
              {step("−",()=>setLoads(l=>l.map((v,i)=>i!==cur?v:(fixedLoad?kbStep(v,-1):Math.max(0,Math.round((v-2.5)*10)/10)))))}
              <span style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",width:56,textAlign:"center"}}>Charge</span>
              {step("+",()=>setLoads(l=>l.map((v,i)=>i!==cur?v:(fixedLoad?kbStep(v,1):Math.round((v+2.5)*10)/10))))}
              <div style={{width:14}}/>
              {step("−",()=>setReps(r=>r.map((v,i)=>i===cur?Math.max(1,v-1):v)))}
              <span style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",width:56,textAlign:"center"}}>Reps</span>
              {step("+",()=>setReps(r=>r.map((v,i)=>i===cur?v+1:v)))}
            </div>
            {prevIdx<0&&lastPerf&&lastPerf.kg>0&&(
              <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
                borderRadius:22,padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
                <span style={{fontSize:12.5,color:C.ink4}}>La dernière fois</span>
                <span style={{fontSize:15,fontWeight:600,color:C.ink,fontVariantNumeric:"tabular-nums"}}>
                  {lastPerf.kg} kg{lastPerf.rpe?` · RPE ${lastPerf.rpe}`:""}
                  {/* On compare la charge la plus lourde PREVUE aujourd'hui a la plus lourde
                      faite la derniere fois. Comparer la premiere serie de montee - souvent
                      70% du haut de seance - a la meilleure charge precedente n'avait aucun
                      sens et n'affichait donc jamais d'ecart. */}
                  {(()=>{const top=Math.max(...loads);return top>lastPerf.kg
                    ?<span style={{color:C.done}}> → +{Math.round((top-lastPerf.kg)*10)/10} kg</span>:null;})()}
                </span>
              </div>
            )}
            {prevIdx>=0&&(
              <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
                borderRadius:22,padding:"16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12.5,color:C.ink4}}>Série précédente</span>
                <span style={{fontSize:15,fontWeight:600,color:C.ink,fontVariantNumeric:"tabular-nums"}}>{loads[prevIdx]>0?`${loads[prevIdx]} kg`:"PdC"} × {reps[prevIdx]}</span>
              </div>
            )}
            <div style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:16}}>
              {dots}
              <Tap onTap={validate} style={{padding:"16px",borderRadius:22,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>Valider la série {cur+1}</span>
              </Tap>
            </div>
          </div>
        )}
      </div>
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
        <div style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em",marginBottom:20}}>Générer une séance</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {SESSION_TYPES.map(t=>(
            <Tap key={t} onTap={()=>setType(t===type?null:t)} style={{padding:"12px 6px",borderRadius:12,textAlign:"center",border:`1.5px solid ${type===t?C.accent:C.div}`,background:type===t?C.accentSoft:C.s2,transition:`all 180ms ${EO}`}}>
              <span style={{fontSize:11.5,fontWeight:type===t?600:400,color:type===t?C.accent:C.ink3}}>{t}</span>
            </Tap>
          ))}
        </div>
        <textarea value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Ou décris ta séance..."
          style={{width:"100%",minHeight:52,padding:"16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,resize:"none",outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
        <Tap onTap={generate} disabled={(!type&&!custom.trim())||loading} style={{padding:"16px",borderRadius:22,background:(!type&&!custom.trim())||loading?C.s3:C.accent,display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${EO}`}}>
          <span style={{fontSize:15,fontWeight:600,color:(!type&&!custom.trim())||loading?C.ink5:C.onAccent}}>{loading?"Génération…":"Générer avec IA"}</span>
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
          <div style={{fontSize:21,fontWeight:600,color:C.ink,marginBottom:14}}>Remplacer l'exercice</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{width:"100%",padding:"16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:16,color:C.ink,background:C.s2,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
            {Object.entries(EQ_LABELS).map(([k,l])=>(
              <Tap key={k} onTap={()=>setEq(eq===k?null:k)} style={{flexShrink:0,padding:"6px 14px",borderRadius:999,border:`1px solid ${eq===k?C.accent:C.div}`,background:eq===k?C.accentSoft:"transparent",transition:`all 150ms ${EO}`}}>
                <span style={{fontSize:11.5,fontWeight:600,color:eq===k?C.accent:C.ink4}}>{l}</span>
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
                  <span style={{fontSize:12.5,color:C.ink3}}>{ex.m}</span>
                  <span style={{fontSize:11.5,fontWeight:600,padding:"1px 8px",borderRadius:999,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span>
                </div>
              </div>
              <span style={{fontSize:21,color:C.accent,fontWeight:400}}>+</span>
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
  const bs={fontFamily:F,fontSize:15,fontWeight:600,padding:"16px",borderRadius:12,border:"none",cursor:"pointer",WebkitTapHighlightColor:"transparent",touchAction:"manipulation",width:"100%"};
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.8)"}} onClick={onClose}/>
      <div style={{position:"relative",zIndex:10000,background:C.s1,borderRadius:"28px 28px 0 0",padding:"28px 24px calc(44px + env(safe-area-inset-bottom))",maxWidth:600,width:"100%"}}>
        <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{fontSize:21,fontWeight:600,color:C.ink,marginBottom:6}}>Bilan séance</div>
        <div style={{fontSize:15,color:C.ink3,marginBottom:24}}>Comment c'était ?</div>
        {[{label:"Intensité",val:intensity,set:setIntensity,labels:IL},{label:"Énergie",val:energy,set:setEnergy,labels:EL}].map(({label,val,set,labels})=>(
          <div key={label} style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:15,fontWeight:600,color:C.ink}}>{label}</span>
              <span style={{fontSize:14,color:C.ink3}}>{labels[val]}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5].map(v=>(
                <button key={v} onClick={()=>set(v)} style={{flex:1,height:52,borderRadius:12,border:`2px solid ${val===v?C.accent:C.div}`,background:val===v?C.accentSoft:C.s2,color:val===v?C.accent:C.ink4,fontSize:15,fontWeight:val===v?700:400,cursor:"pointer",fontFamily:F,WebkitTapHighlightColor:"transparent"}}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".06em",marginBottom:10}}>Photo du jour (optionnel)</div>
          {photo
            ? <div style={{position:"relative",display:"inline-block"}}><img src={photo} alt="" style={{width:96,height:128,objectFit:"cover",borderRadius:12,display:"block"}}/><button onClick={()=>setPhoto(null)} style={{position:"absolute",top:-8,right:-8,width:26,height:26,borderRadius:"50%",background:C.s4,color:C.ink,border:"none",fontSize:15,cursor:"pointer",lineHeight:1}}>×</button></div>
            : <label style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:96,height:128,borderRadius:12,border:`1.5px dashed ${C.div}`,background:C.s2,cursor:"pointer"}}><span style={{fontSize:34,color:C.ink4,fontWeight:400}}>+</span><input type="file" accept="image/*" onChange={onPhoto} style={{display:"none"}}/></label>}
        </div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes libres..."
          style={{width:"100%",minHeight:60,padding:"16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,resize:"none",outline:"none",marginBottom:20,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{...bs,flex:1,background:C.s2,color:C.ink3}}>Annuler</button>
          <button onClick={()=>onSave({global:intensity,energy,notes,photo})} style={{...bs,flex:2,background:C.accent,color:C.onAccent}}>Enregistrer</button>
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
          <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:10}}>{date}</div>
          <div style={{fontSize:34,fontWeight:600,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:20}}>{dayLabel}</div>
          {score>0&&<div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 18px",borderRadius:999,background:C.s2,border:`1px solid ${C.div}`}}>
            <span style={{fontSize:21,fontWeight:600,color:C.accent}}>{animScore}</span>
            <span style={{fontSize:11.5,fontWeight:600,color:C.ink4,letterSpacing:".1em"}}>SCORE</span>
          </div>}
        </div>
        {newPBs.length>0&&(
          <div style={{margin:"0 24px 20px",padding:"16px",borderRadius:22,background:C.accentSoft,border:`1px solid ${C.accent}`,animation:`fadeUp 500ms ${EO} both`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a2 2 0 0 0 2 4"/><path d="M17 6h3a2 2 0 0 1-2 4"/></svg>
              <span style={{fontSize:14,fontWeight:600,color:C.ink}}>{newPBs.length>1?`${newPBs.length} nouveaux records`:"Nouveau record"} 🎉</span>
            </div>
            {newPBs.map((e,i)=>(<div key={e.id||i} style={{fontSize:12.5,color:C.ink2,padding:"3px 0"}}>{e.n} <span style={{fontWeight:600}}>{e.weight}kg</span></div>))}
          </div>
        )}
        {newBadges.length>0&&(
          <div style={{margin:"0 24px 20px",padding:"16px",borderRadius:22,background:C.s1,border:`1px solid ${C.s3}`,animation:`fadeUp 550ms ${EO} both`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M8.5 13 7 21l5-3 5 3-1.5-8"/></svg>
              <span style={{fontSize:14,fontWeight:600,color:C.ink}}>{newBadges.length>1?`${newBadges.length} nouveaux badges`:"Nouveau badge"} 🎉</span>
            </div>
            {newBadges.map((b,i)=>(<div key={i} style={{fontSize:12.5,color:C.ink2,padding:"3px 0"}}><span style={{fontWeight:600}}>{b.t}</span> · {b.d}</div>))}
          </div>
        )}
        {milestoneReached&&(
          <div style={{margin:"0 24px 20px",padding:"16px",borderRadius:22,background:C.accentSoft,border:`1px solid ${C.accent}`,animation:`fadeUp 600ms ${EO} both`}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></svg>
              <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Nouveau palier : {milestoneReached} 🎉</span>
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
              <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>{l}</div>
              <div style={{fontSize:34,fontWeight:600,color:C.ink,letterSpacing:"-.02em"}}>{v}</div>
            </div>
          ))}
        </div>
        {photo&&(
          <div style={{padding:"20px 24px 0"}}>
            <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>Photo</div>
            <img src={photo} alt="" style={{width:150,borderRadius:12,display:"block"}}/>
          </div>
        )}
        {exercises.filter(e=>e.completedSets>0).length>0&&(
          <div style={{padding:"16px"}}>
            <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Exercices</div>
            {exercises.filter(e=>e.completedSets>0).map((ex,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.s3}`}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{ex.n||ex.name}</div>
                  <div style={{fontSize:12.5,color:C.ink3}}>{ex.completedSets} séries · {ex.m||ex.muscle}</div>
                  {/* Montee en charge de la seance : la charge max seule ne disait pas si les
                      series avaient ete montees progressivement ou faites a poids constant. */}
                  {(()=>{
                    const sd=Array.isArray(ex.setsDetail)?ex.setsDetail:[];
                    if(sd.length<2) return null;
                    const ws=sd.map(s=>Number(s.weight)||0);
                    const monte=ws.some(w=>w!==ws[0]);
                    return(
                      <div style={{fontSize:11.5,color:monte?C.accent:C.ink4,marginTop:3,fontVariantNumeric:"tabular-nums"}}>
                        {monte?`${ws.join(" → ")} kg`:`${sd.length} × ${sd[0].reps} reps`}
                      </div>
                    );
                  })()}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
                  {/* Combien de temps a pris CET exercice, repos compris : le resume ne
                      donnait que la duree totale de la seance. */}
                  {ex.durSec>0&&<span style={{fontSize:11.5,color:C.ink4,fontVariantNumeric:"tabular-nums"}}>
                    {fmtMSS(ex.durSec)}</span>}
                  {ex.weight>0&&<span style={{fontSize:15,fontWeight:600,color:C.ink}}>{ex.weight}kg</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {feedback&&(
          <div style={{padding:"16px",borderTop:`1px solid ${C.s3}`}}>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              {[{l:"Intensité",v:feedback.global},{l:"Énergie",v:feedback.energy}].map(({l,v})=>(
                <div key={l} style={{flex:1,background:C.s2,borderRadius:12,padding:"16px"}}>
                  <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>{l}</div>
                  <div style={{fontSize:21,fontWeight:600,color:C.ink}}>{v}/5</div>
                </div>
              ))}
            </div>
            {feedback.notes&&<div style={{fontSize:15,color:C.ink3,lineHeight:1.65}}>{feedback.notes}</div>}
          </div>
        )}
        <div style={{padding:"0 24px 60px",display:"flex",flexDirection:"column",gap:10}}>
          <Tap onTap={onClose} style={{padding:"16px",borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Fermer</span>
          </Tap>
          {onDelete&&<Tap onTap={()=>{if(window.confirm("Supprimer cette séance ? Action définitive.")) onDelete(session);}} style={{padding:"16px",borderRadius:12,background:"transparent",border:`1px solid ${C.alert}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:15,fontWeight:600,color:C.alert}}>Supprimer la séance</span>
          </Tap>}
        </div>
      </div>
    </div>
  );
}

// ─── WEEK SUMMARY ─────────────────────────────────────────────────────────────
// Lundi de la semaine d'une date : sert de cle de semaine pour la pesee.
const mondayOf=(d)=>{const t=(typeof d==="string")?new Date(d+"T00:00:00"):new Date(d);const dow=(t.getDay()+6)%7;t.setDate(t.getDate()-dow);return localDateKey(t);};

// Pesee libre. Elle etait bornee a une par semaine, indexee sur le lundi : une pesee
// du mercredi ecrasait celle du lundi et la courbe restait pauvre. La table weigh_ins
// est deja unique par (user_id, date), donc une pesee par JOUR : c'est cette granularite
// qu'on expose. Plus de points, une courbe plus juste.
function WeighInCard({weighIns,onSave}) {
  const list=(weighIns||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const today=todayKey();
  const [date,setDate]=useState(today);
  const [openDate,setOpenDate]=useState(false);
  const done=list.find(w=>w.date===date);
  const prev=list.filter(w=>w.date<date).pop();
  const [val,setVal]=useState(()=>{const d=list.find(w=>w.date===today);
    return d?String(d.weight_kg):(list.length?String(list[list.length-1].weight_kg):"");});
  const [flash,setFlash]=useState(false);

  // Changer de date recharge la valeur de ce jour-la : sans cela on ecraserait
  // une pesee passee avec le poids affiche pour aujourd'hui.
  const pick=(d)=>{ setDate(d); const e=list.find(w=>w.date===d);
    setVal(e?String(e.weight_kg):(list.length?String(list[list.length-1].weight_kg):"")); };

  const num=parseFloat(String(val).replace(",","."));
  const valid=num>20&&num<300;
  const changed=valid&&(!done||Math.abs(num-Number(done.weight_kg))>=0.05);
  const save=()=>{ if(!changed) return; onSave(num,date); setFlash(true);
    setTimeout(()=>setFlash(false),1600); play("cloche"); buzz(40); };
  const jour=(()=>{ const d=new Date(date+"T00:00:00");
    const J=["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
    return `${J[d.getDay()]} ${d.getDate()}`; })();

  return (
    <div style={{background:C.s1,borderRadius:22,padding:"16px",marginBottom:10,
      animation:`riseIn 320ms ${EO} both`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <span style={{fontSize:15,fontWeight:600,color:C.ink}}>Pesée libre</span>
        <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,
          background:flash?C.accent:C.s2,color:flash?C.onAccent:C.ink3,whiteSpace:"nowrap",
          transition:`background 240ms ${EO}`}}>{flash?"Enregistrée":(done?"Déjà pesé":"Nouveau")}</span>
      </div>
      <div style={{fontSize:11.5,color:C.ink4,marginTop:5,lineHeight:1.5}}>
        N'importe quel jour, autant de fois que tu veux. Chaque pesée est un point de plus sur la courbe.</div>

      <div style={{display:"flex",gap:10,alignItems:"stretch",marginTop:13}}>
        <div style={{flex:1,minWidth:0,background:C.bg,borderRadius:22,padding:"10px 12px",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <input type="number" inputMode="decimal" step="0.1" value={val}
            onChange={e=>setVal(e.target.value)} onFocus={e=>e.target.select()}
            placeholder={prev?String(prev.weight_kg):"—"} aria-label="Poids en kilogrammes"
            style={{width:"100%",border:"none",background:"transparent",color:C.ink,textAlign:"center",
              fontSize:21,fontWeight:500,fontFamily:F,letterSpacing:"-.03em",outline:"none",padding:0,
              fontVariantNumeric:"tabular-nums",userSelect:"text",WebkitUserSelect:"text"}}/>
          <span style={{fontSize:11.5,color:C.ink4,marginTop:2}}>kg</span>
        </div>
        <Tap label="Enregistrer la pesée" onTap={changed?save:undefined}
          style={{flex:1,minWidth:0,borderRadius:22,background:changed?C.fill:C.s2,
            display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${EO}`}}>
          <span style={{fontSize:15,fontWeight:600,color:changed?C.onFill:C.ink4}}>Enregistrer</span></Tap>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginTop:11}}>
        <span style={{fontSize:11.5,color:C.ink4}}>
          {date===today?`Aujourd'hui · ${jour}`:`Le ${fmtDateShort(date)}`}</span>
        {openDate
          ? <input type="date" value={date} max={today} onChange={e=>{pick(e.target.value||today);setOpenDate(false);}}
              aria-label="Date de la pesée"
              style={{border:`1px solid ${C.s3}`,borderRadius:12,background:C.bg,color:C.ink,fontSize:12.5,
                fontFamily:F,padding:"7px 10px",outline:"none",fontVariantNumeric:"tabular-nums",
                userSelect:"text",WebkitUserSelect:"text"}}/>
          : <Tap label="Changer la date" onTap={()=>setOpenDate(true)}>
              <span style={{fontSize:11.5,fontWeight:600,color:C.ink3}}>Changer la date ›</span></Tap>}
      </div>
    </div>
  );
}

// Courbe de poids. Les points etaient espaces par leur RANG : deux pesees a un jour
// d'ecart occupaient la meme largeur que deux pesees a trois semaines d'ecart. Maintenant
// que la pesee est libre, l'axe doit etre le temps reel, sinon la courbe ment.
function WeightChart({weighIns,accent,compact}) {
  const pts=(weighIns||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)))
    .map(w=>({d:w.date,v:Number(w.weight_kg),t:new Date(w.date+"T00:00:00").getTime()})).filter(x=>x.v>0);
  if(pts.length<2) return (
    <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
      borderRadius:22,padding:"16px",marginBottom:10}}>
      <div style={{fontSize:15,fontWeight:600,color:C.ink,marginBottom:3}}>Poids de corps</div>
      <div style={{fontSize:11.5,color:C.ink4}}>Une deuxième pesée et la courbe apparaît.</div>
    </div>
  );
  // Au-dela de huit points les dates se chevauchent : on garde les huit dernieres.
  const shown=pts.slice(-8);
  const W=340,H=compact?76:104,PADX=14,PADY=13;
  const vs=shown.map(x=>x.v), min=Math.min(...vs), max=Math.max(...vs), span=(max-min)||1;
  const t0=shown[0].t, tSpan=(shown[shown.length-1].t-t0)||1;
  const x=(q)=>PADX+((q.t-t0)/tSpan)*(W-PADX*2);
  const y=(v)=>PADY+(1-(v-min)/span)*(H-PADY*2);
  const line=shown.map((q,k)=>`${k?"L":"M"}${x(q).toFixed(1)},${y(q.v).toFixed(1)}`).join(" ");
  const first=pts[0].v,lastV=pts[pts.length-1].v,delta=Math.round((lastV-first)*10)/10;
  const days=Math.max(1,Math.round((pts[pts.length-1].t-pts[0].t)/86400000));
  return (
    <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
      borderRadius:22,padding:"16px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
        <span style={{fontSize:15,fontWeight:600,color:C.ink}}>Poids de corps</span>
        <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,background:C.s2,
          color:C.ink3,whiteSpace:"nowrap"}}>{pts.length} pesées</span>
      </div>
      <div style={{fontSize:34,fontWeight:500,color:C.ink,letterSpacing:"-.035em",lineHeight:1,marginTop:10,
        fontVariantNumeric:"tabular-nums"}}>{String(lastV).replace(".",",")}
        <span style={{fontSize:12.5,fontWeight:400,color:C.ink4}}> kg</span></div>
      <div style={{fontSize:11.5,color:C.ink4,marginTop:5}}>
        {delta===0?"stable":`${delta>0?"+":""}${String(delta).replace(".",",")} kg`} en {days} jours</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block",marginTop:14,
        overflow:"visible"}}>
        <g stroke={C.s2} strokeWidth="1">
          <line x1="0" y1={PADY} x2={W} y2={PADY}/>
          <line x1="0" y1={H/2} x2={W} y2={H/2}/>
          <line x1="0" y1={H-PADY} x2={W} y2={H-PADY}/></g>
        <path d={line} fill="none" stroke={accent||C.accent} strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"/>
        {shown.slice(0,-1).map((q,k)=>(
          <circle key={k} cx={x(q)} cy={y(q.v)} r="3.6" fill={C.card}
            stroke={accent||C.accent} strokeWidth="2"/>))}
        <circle cx={x(shown[shown.length-1])} cy={y(lastV)} r="4.6" fill={accent||C.accent}/>
      </svg>
      {/* Une date sous chaque point : sans elles, un creux ne dit pas quand. */}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:9}}>
        {shown.map(q=>(
          <span key={q.d} style={{fontSize:10,color:C.ink4,fontVariantNumeric:"tabular-nums"}}>
            {q.d.slice(8,10)}/{q.d.slice(5,7)}</span>))}
      </div>
    </div>
  );
}

// Volume par semaine, en barres. La courbe precedente lisait s.date.slice(0,7) - le MOIS,
// pas la semaine - dans l'ordre d'arrivee des seances (les plus recentes d'abord), et
// arrondissait a la tonne entiere. Deux points, a l'envers, faux.
function VolumeBars({sessions,accent}) {
  const data=useMemo(()=>{
    const weeks={};
    (sessions||[]).forEach(s=>{ if(!s||!s.date) return; const k=mondayOf(s.date);
      weeks[k]=(weeks[k]||0)+(s.totalKg||0); });
    return Object.keys(weeks).sort().slice(-6)
      .map(k=>({k,w:isoWeekOf(k),v:Math.round(weeks[k]/100)/10}));
  },[sessions]);
  if(data.length<2) return null;
  const max=Math.max(...data.map(d=>d.v))||1;
  const best=data.reduce((a,b)=>b.v>a.v?b:a,data[0]);
  const cur=data[data.length-1],pre=data.length>1?data[data.length-2]:null;
  const trend=(pre&&pre.v>0)?Math.round((cur.v/pre.v-1)*100):null;
  return (
    <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
      borderRadius:22,padding:"16px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:2}}>
        <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Tendance hebdomadaire</span>
        <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,
          background:C.s2,color:C.ink3}}>{data.length} semaines</span>
      </div>
      <div style={{fontSize:11.5,color:C.ink4,marginBottom:13}}>
        {trend!==null?`${trend>0?"+":""}${trend} % vs S${pre.w}`:"Tonnes soulevées par semaine"}
        {best.v>0&&` · record S${best.w} à ${String(best.v).replace(".",",")} t`}
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:7,height:78}}>
        {data.map((d,i)=>(
          <div key={d.k} style={{flex:1,minWidth:0,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
            <div style={{fontSize:10,color:C.ink4,textAlign:"center",marginBottom:4,
              fontVariantNumeric:"tabular-nums",opacity:d.v>0?1:0}}>{String(d.v).replace(".",",")}</div>
            <div style={{height:`${Math.max(4,(d.v/max)*78)}%`,borderRadius:"3px 3px 0 0",
              background:i===data.length-1?(accent||C.accent):C.s2,transition:`height 420ms ${EO}`}}/>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:7,marginTop:6}}>
        {data.map(d=>(<span key={d.k} style={{flex:1,textAlign:"center",fontSize:10,color:C.ink4,
          fontVariantNumeric:"tabular-nums"}}>S{d.w}</span>))}
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
    <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,borderRadius:22,padding:"16px",marginBottom:10}}>
      <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Cette semaine</div>
      <div style={{display:"flex",gap:6,marginBottom:18}}>
        {days.map((d,i)=>{
          const date=weekDates[i];const done=sessions.find(s=>s.date===date);const isToday=date===todayKey();
          return(
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <div style={{width:"100%",aspectRatio:"1",borderRadius:12,
                background:done?(accent||C.accent):(isToday?C.accentSoft:"transparent"),
                backgroundImage:(!done&&!isToday)?`repeating-linear-gradient(115deg, ${C.bg} 0 3px, ${C.s2} 3px 7px)`:"none",
                border:`1.5px solid ${done?(accent||C.accent):isToday?C.accent:C.s2}`,
                display:"flex",alignItems:"center",justifyContent:"center",transition:`all 300ms ${EO}`}}>
                {done&&<span style={{fontSize:10,fontWeight:600,color:C.onAccent}}>✓</span>}
                {isToday&&!done&&<div style={{width:5,height:5,borderRadius:"50%",background:C.accent}}/>}
              </div>
              <span style={{fontSize:10,fontWeight:600,color:isToday?C.ink:C.ink4}}>{d}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:20,borderTop:`1px solid ${C.s3}`,paddingTop:14}}>
        <div><div style={{fontSize:21,fontWeight:600,color:C.ink}}>{thisWeek.length}<span style={{fontSize:12.5,fontWeight:400,color:C.ink4}}>/{target}</span></div><div style={{fontSize:11.5,color:C.ink4}}>Séances</div></div>
        {weekVol>0&&<div><div style={{fontSize:21,fontWeight:600,color:C.ink}}>{Math.round(weekVol/1000*10)/10}<span style={{fontSize:12.5,fontWeight:400,color:C.ink4}}>t</span></div><div style={{fontSize:11.5,color:C.ink4}}>Volume</div></div>}
        {weekMin>0&&<div><div style={{fontSize:21,fontWeight:600,color:C.ink}}>{weekTime}<span style={{fontSize:12.5,fontWeight:400,color:C.ink4}}>{weekMin>=60?"":"min"}</span></div><div style={{fontSize:11.5,color:C.ink4}}>Temps</div></div>}
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
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.s2,borderRadius:12,padding:"16px",marginBottom:10}}>
      <span style={{fontSize:15,color:C.ink2}}>{label}</span>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <Tap onTap={()=>!running&&setVal(Math.max(min,val-1))} style={{width:38,height:38,borderRadius:12,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:21,color:C.ink}}>−</span></Tap>
        <span style={{fontSize:21,fontWeight:600,color:C.ink,minWidth:58,textAlign:"center"}}>{val}{unit}</span>
        <Tap onTap={()=>!running&&setVal(Math.min(max,val+1))} style={{width:38,height:38,borderRadius:12,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:21,color:C.ink}}>+</span></Tap>
      </div>
    </div>
  );
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:Z.fullscreen,display:"flex",flexDirection:"column",alignItems:"center",fontFamily:F,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
    <div style={{width:"100%",maxWidth:600,display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px"}}>
        <div style={{fontSize:21,fontWeight:600,color:C.ink}}>Intervalles</div>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
      </div>
      <div style={{display:"flex",gap:8,padding:"0 20px 16px"}}>
        {[["amrap","AMRAP"],["emom","EMOM"]].map(([m,l])=>(<Tap key={m} onTap={()=>!running&&setMode(m)} style={{flex:1,padding:"12px",borderRadius:12,background:mode===m?C.accent:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:mode===m?C.onAccent:C.ink3}}>{l}</span></Tap>))}
      </div>
      <div style={{flex:1,overflowY:"auto",overscrollBehavior:"contain",padding:"0 20px 24px",display:"flex",flexDirection:"column",justifyContent:"flex-start"}}>
        <div style={{fontSize:12.5,color:C.ink4,lineHeight:1.5,marginBottom:16}}>{mode==="amrap"?"As Many Rounds As Possible : un max de tours avant la fin du temps. Compte tes tours avec le bouton.":"Every Minute On the Minute : à chaque début de minute (bip), fais tes reps, repose-toi le reste de la minute."}</div>
        {mode==="amrap"
          ? <Step label="Durée" val={amrapMin} setVal={setAmrapMin} min={1} max={60} unit=" min"/>
          : <><Step label="Durée" val={emomMin} setVal={setEmomMin} min={1} max={60} unit=" min"/><Step label="Reps / minute" val={emomReps} setVal={setEmomReps} min={1} max={50} unit=""/></>}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 0"}}>
          {mode==="emom"&&running&&<div style={{fontSize:14,fontWeight:600,color:C.accent,marginBottom:8}}>Minute {curMin}/{emomMin} · {emomReps} reps</div>}
          <div style={{fontSize:72,fontWeight:600,color:done?C.done:C.ink,letterSpacing:"-.03em",lineHeight:1}}>{done?"FINI":(mode==="emom"&&running?fmtMSS(secInMin):fmtMSS(remaining))}</div>
          {mode==="emom"&&running&&<div style={{fontSize:12.5,color:C.ink4,marginTop:8}}>Temps total : {fmtMSS(remaining)}</div>}
          {mode==="amrap"&&<div style={{marginTop:24,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}><div style={{fontSize:48,fontWeight:600,color:C.accent,lineHeight:1}}>{rounds}</div><div style={{fontSize:11.5,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>tours</div><Tap onTap={()=>running&&setRounds(r=>r+1)} style={{marginTop:6,padding:"14px 34px",borderRadius:999,background:C.s2,border:`1px solid ${C.div}`,opacity:running?1:0.5}}><span style={{fontSize:15,fontWeight:600,color:C.ink2}}>+1 tour</span></Tap></div>}
        </div>
      </div>
      <div style={{display:"flex",gap:10,padding:"12px 20px"}}>
        <Tap onTap={reset} style={{padding:"16px 22px",borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Reset</span></Tap>
        <Tap onTap={running?pause:(done?reset:start)} style={{flex:1,padding:"16px",borderRadius:12,background:running?C.alertSoft:C.accent,border:running?`1px solid ${C.alert}`:"none",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:running?C.alert:C.onAccent}}>{running?"Pause":(done?"Recommencer":"Démarrer")}</span></Tap>
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
    // Progression mesuree sur le 1RM ESTIME des exercices communs aux deux moities, et non
    // plus sur le tonnage : soulever plus lourd et soulever plus longtemps ne sont pas la
    // meme chose, et seul le premier est une progression de force.
    let prog=50;
    if(ord.length>=4){
      const h=Math.floor(ord.length/2);
      const a=rmIndex(ord.slice(0,h)),b=rmIndex(ord.slice(h));
      const common=Object.keys(b).filter(k=>a[k]);
      if(common.length){
        const ratio=common.reduce((x,k)=>x+(b[k].kg/a[k].kg),0)/common.length;
        prog=clamp(50+(ratio-1)*250);
      }else{
        const avgOld=(ord.slice(0,h).reduce((x,s)=>x+(s.totalKg||0),0)/h)||1;
        const avgNew=ord.slice(h).reduce((x,s)=>x+(s.totalKg||0),0)/(ord.length-h);
        prog=clamp(50+(avgNew-avgOld)/avgOld*100);
      }
    }
    return [["Force",force],["Volume",volume],["Endurance",endurance],["Régularité",regularite],
            ["Intensité",intensite],["Progression",prog],["Équilibre",equilibre],["Explosivité",explosivite]];
  },[sessions,profile]);
  if(!axes) return null;
  const cx=150,cy=118,R=88;
  const pt=(i,r)=>{const a=(-90+i*45)*Math.PI/180;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  const poly=axes.map((ax,i)=>pt(i,ax[1]/100*R).join(",")).join(" ");
  // Deux anneaux, comme la maquette : quatre transformaient le fond en cible.
  const grid=[45,100].map(g=>axes.map((_,i)=>pt(i,g/100*R).join(",")).join(" "));
  return (
    <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
      borderRadius:22,padding:"16px",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:2}}>
        <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Octogone de compétences</span>
        <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,background:C.s2,color:C.ink3}}>8 qualités</span>
      </div>
      <div style={{fontSize:11.5,color:C.ink4,marginBottom:2}}>Calculées sur ton historique.</div>
      <svg viewBox="0 0 300 246" style={{width:"100%",height:"auto",display:"block",marginTop:6}}>
        {grid.map((g,i)=>(<polygon key={"g"+i} points={g} fill="none" stroke={C.s3} strokeWidth="1"/>))}
        <polygon points={poly} fill={C.accent} fillOpacity="0.22" stroke={C.accent}
          strokeWidth="2.4" strokeLinejoin="round"/>
        {axes.map((ax,i)=>{
          const[x,y]=pt(i,R+15);
          const dx=x-cx;
          const anchor=dx>2?"start":(dx<-2?"end":"middle");
          return <text key={"t"+i} x={x+(dx>2?4:(dx<-2?-4:0))} y={y} fill={C.ink4} fontSize="11.5"
            fontWeight="500" textAnchor={anchor} dominantBaseline="middle" fontFamily={F}>{ax[0]}</text>;})}
      </svg>
    </div>
  );
}

// Stats en trois vues plutot qu'en une colonne sans fin. La page empilait onze blocs
// pleine largeur de hauteurs toutes differentes : on scrollait quatre ecrans pour trois
// questions distinctes. Une question par vue, une vue par ecran.
//   Resume — ou j'en suis      Corps — comment j'evolue      Force — ce que je vaux
function StatsTab({sessions,weights,accent,onOpenPhotos,pinnedPBs,onManagePBs,activeSkills,onManageSkills,onOpenRewards,trainingDaysPerWeek,profile,weighIns,onSaveWeighIn,photos,photoUrls,children}) {
  const [view,setView]=useState("resume");
  // Meme perimetre que l'accueil et que la page profil : ce programme.
  const progStart=profile&&profile.program_start;
  const inProg=progStart?sessions.filter(x=>x&&x.date>=progStart):sessions;
  const total=inProg.length,totalKg=inProg.reduce((a,s)=>a+(s.totalKg||0),0);
  const avgScore=total?Math.round(inProg.reduce((a,s)=>a+computeScore(s.totalKg,s.totalSets,s.feedback,targetOf(s)),0)/total):0;
  const pbs=useMemo(()=>computePBs(sessions),[sessions]);
  const pinnedSet=new Set(pinnedPBs||[]);
  const displayedPBs=(pinnedPBs&&pinnedPBs.length)?pbs.filter(pb=>pinnedSet.has(pb.id)):pbs.slice(0,4);
  const totalMin=Math.round(inProg.reduce((a,s)=>a+(Number(s.duration)||0),0)/60);
  const totalTime=totalMin>=60?`${Math.floor(totalMin/60)}h${String(totalMin%60).padStart(2,"0")}`:`${totalMin}min`;
  const badges=useMemo(()=>computeBadges(sessions),[sessions]);
  const earned=badges.filter(b=>b.ok).length;
  // Variation du volume d'une semaine a l'autre, en semaines reelles.
  const trend=useMemo(()=>{
    const w={};sessions.forEach(x=>{if(x&&x.date)w[mondayOf(x.date)]=(w[mondayOf(x.date)]||0)+(x.totalKg||0);});
    const ks=Object.keys(w).sort();if(ks.length<2)return null;
    const a=w[ks[ks.length-2]],b=w[ks[ks.length-1]];
    return a>0?Math.round((b/a-1)*100):null;
  },[sessions]);

  const CARD={background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,borderRadius:22};
  const LBL={fontSize:10,fontWeight:600,letterSpacing:".11em",textTransform:"uppercase",color:C.ink4};
  // Une seule fabrique de tuile : les hauteurs cessent d'etre subies bloc par bloc.
  const Tile=({label,value,unit,sub,onTap:tap,icon})=>{
    const inner=(
      <div style={{height:86,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <span style={LBL}>{label}</span>
          {icon&&<Icon name={icon} size={15} stroke={C.ink4}/>}
        </div>
        <div>
          <div style={{fontSize:21,fontWeight:500,color:C.ink,letterSpacing:"-.03em",lineHeight:1,
            fontVariantNumeric:"tabular-nums"}}>{value}{unit&&<span style={{fontSize:11.5,fontWeight:400,color:C.ink4}}> {unit}</span>}</div>
          {sub&&<div style={{fontSize:10,color:C.ink4,marginTop:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sub}</div>}
        </div>
      </div>
    );
    const st={...CARD,padding:"16px"};
    return tap?<Tap label={label} onTap={tap} style={st}>{inner}</Tap>:<div style={st}>{inner}</div>;
  };

  const VIEWS=[["resume","Résumé"],["corps","Corps"],["force","Force"]];
  return(
    <div style={{padding:"14px 18px 16px",maxWidth:600,margin:"0 auto",fontFamily:F}}>

      {/* Selecteur de vue. Colle en haut : on change de vue sans remonter. */}
      <div style={{position:"sticky",top:0,zIndex:Z.sticky,background:C.bg,paddingBottom:11,marginBottom:0}}>
        <div style={{display:"flex",gap:4,background:C.s1,borderRadius:999,padding:4}} role="tablist">
          {VIEWS.map(([k,l])=>{
            const on=view===k;
            return(
              <Tap key={k} label={l} onTap={()=>{setView(k);play("tick");}}
                style={{flex:1,padding:"9px 0",borderRadius:999,background:on?C.bg:"transparent",
                  boxShadow:on?`0 2px 9px ${C.ink5}`:"none",display:"flex",alignItems:"center",
                  justifyContent:"center",transition:`all 220ms ${EO}`}}>
                <span style={{fontSize:12.5,fontWeight:on?600:500,color:on?C.ink:C.ink4}}>{l}</span>
              </Tap>
            );
          })}
        </div>
      </div>

      {view==="resume"&&(
      <div key="resume" style={{animation:`riseIn 300ms ${EO} both`}}>
        {/* Chiffre-titre : le seul bloc pleine largeur de la vue. */}
        <div style={{background:C.accent,border:`1px solid ${C.accent}`,borderRadius:22,padding:"16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,fontWeight:600,color:"rgba(27,27,27,.62)"}}>Volume de ce programme</span>
            {trend!==null&&<span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,
              background:"rgba(255,255,255,.5)",color:C.onAccent}}>{trend>0?"+":""}{trend} % cette semaine</span>}
          </div>
          <div style={{fontSize:34,fontWeight:500,color:C.onAccent,letterSpacing:"-.035em",lineHeight:1,marginTop:9,
            fontVariantNumeric:"tabular-nums"}}>
            {totalKg>0?String(Math.round(totalKg/100)/10).replace(".",","):"—"}
            <span style={{fontSize:12.5,fontWeight:400,color:"rgba(27,27,27,.55)"}}> tonnes</span>
          </div>
          <div style={{fontSize:11.5,color:"rgba(27,27,27,.62)",marginTop:6}}>
            {total} / {(profile&&profile.total_sessions)||60} séances du programme
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <Tile label="Séances" value={total} icon="check"/>
          <Tile label="Temps" value={totalTime} icon="clock"/>
          <Tile label="Score" value={avgScore||"—"} icon="target"/>
        </div>

        <WeekSummary sessions={sessions} accent={accent} trainingDaysPerWeek={trainingDaysPerWeek}/>
        <VolumeBars sessions={sessions} accent={accent}/>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <Tile label="Records" value={pbs.length} sub="Voir la vue Force ›" icon="flame" onTap={()=>setView("force")}/>
          <Tile label="Récompenses" value={earned} unit={`/ ${badges.length}`} sub="Voir tout ›" icon="bell" onTap={onOpenRewards}/>
        </div>

        {children}
      </div>)}

      {view==="corps"&&(
      <div key="corps" style={{animation:`riseIn 300ms ${EO} both`}}>
        <WeightChart weighIns={weighIns} accent={accent}/>
        {onSaveWeighIn&&<WeighInCard weighIns={weighIns} onSave={onSaveWeighIn}/>}
        <PhotoStrip photos={photos} urls={photoUrls} onOpen={onOpenPhotos}/>
        {(()=>{
          const vs=(weighIns||[]).map(w=>Number(w.weight_kg)).filter(v=>v>0);
          const lo=vs.length?Math.min(...vs):null,hi=vs.length?Math.max(...vs):null;
          const nb=vs.length;
          return(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <Tile label="Amplitude" value={nb?String(Math.round((hi-lo)*10)/10).replace(".",","):"—"} unit="kg"
                sub={nb?`${String(lo).replace(".",",")} → ${String(hi).replace(".",",")} kg`:"Pas encore de pesée"} icon="weight"/>
              <Tile label="Pesées" value={nb} sub={nb?"Enregistre quand tu veux":"Aucune pesée"} icon="check"/>
            </div>
          );
        })()}
      </div>)}

      {view==="force"&&(
      <div key="force" style={{animation:`riseIn 300ms ${EO} both`}}>
        <SkillsOctagon sessions={sessions} profile={profile}/>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:9,padding:"0 2px"}}>
          <span style={LBL}>Records</span>
          {pbs.length>0&&onManagePBs&&<Tap label="Gérer les records" onTap={onManagePBs}
            style={{padding:"6px 12px",borderRadius:999,background:C.s2}}>
            <span style={{fontSize:11.5,fontWeight:600,color:C.ink3}}>Gérer ({(pinnedPBs||[]).length}/5) ›</span></Tap>}
        </div>
        {pbs.length===0
          ?<div style={{...CARD,padding:"24px 17px",textAlign:"center",fontSize:12.5,color:C.ink4,marginBottom:10}}>
             Réalise des séances avec charges pour débloquer tes records.</div>
          :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {displayedPBs.map((pb,i)=>(
              <div key={pb.id||i} style={{...CARD,padding:"16px",height:86,display:"flex",
                flexDirection:"column",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:8,minWidth:0}}>
                  <svg width="14" height="14" style={{flexShrink:0,marginTop:2}} viewBox="0 0 24 24" fill="none"
                    stroke={C.ink4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {PBCAT_ICON[PBCAT[Array.isArray(pb.eq)?pb.eq[0]:pb.eq]]||PBCAT_ICON.Autre}</svg>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12.5,fontWeight:500,color:C.ink,lineHeight:1.22}}>{pb.n}</div>
                    <div style={{fontSize:10,color:C.ink4,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",
                      textOverflow:"ellipsis"}}>{pb.m}</div>
                  </div>
                </div>
                <div style={{fontSize:21,fontWeight:500,color:C.ink,letterSpacing:"-.03em",lineHeight:1,
                  fontVariantNumeric:"tabular-nums"}}>{pb.pbKg===0?"PdC":String(pb.pbKg).replace(".",",")+" kg"}</div>
              </div>
            ))}
          </div>}

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:9,padding:"0 2px"}}>
          <span style={LBL}>Apprentissage</span>
          {onManageSkills&&<Tap label="Gérer les apprentissages" onTap={onManageSkills}
            style={{padding:"6px 12px",borderRadius:999,background:C.s2}}>
            <span style={{fontSize:11.5,fontWeight:600,color:C.ink3}}>Gérer ({(activeSkills||[]).length}/2) ›</span></Tap>}
        </div>
        {(!activeSkills||activeSkills.length===0)
          ?<div style={{...CARD,padding:"24px 17px",textAlign:"center",fontSize:12.5,color:C.ink4}}>
             Ajoute un mouvement à apprendre — muscle-up, pistol squat…</div>
          :activeSkills.map(as=>{
            const sk=SKILLS_CATALOG.find(x=>x.id===as.skillId);
            if(!sk) return null;
            const step=sk.steps[as.stepIndex]||sk.steps[sk.steps.length-1];
            const pct=Math.round((as.stepIndex/sk.steps.length)*100);
            return(
              <div key={as.skillId} style={{...CARD,padding:"16px",marginBottom:9}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round">{sk.icon}</svg>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.ink}}>{sk.name}</div>
                    <div style={{fontSize:11.5,color:C.ink4}}>Étape {as.stepIndex+1}/{sk.steps.length} · {step.label}</div>
                  </div>
                  <span style={{fontSize:11.5,fontWeight:600,color:C.ink3,fontVariantNumeric:"tabular-nums"}}>{pct} %</span>
                </div>
                <div style={{height:5,borderRadius:3,background:C.s2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:accent||C.accent,borderRadius:3,
                    transition:`width 420ms ${EO}`}}/></div>
              </div>
            );
          })}
      </div>)}
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
          <span style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em"}}>Mes Personal Bests</span>
          <Tap onTap={onClose} style={{width:36,height:36,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
        </div>
        <div style={{fontSize:12.5,color:C.ink4,marginBottom:20}}>Choisis jusqu'à 5 PB à afficher sur ta page Stats. ({sel.length}/5)</div>
        {Object.keys(groups).map(cat=>(
          <div key={cat} style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{PBCAT_ICON[cat]||PBCAT_ICON.Autre}</svg>
              <span style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em"}}>{cat}</span>
            </div>
            {groups[cat].map(pb=>{
              const on=sel.includes(pb.id);
              const disabled=!on&&sel.length>=5;
              return(
                <Tap key={pb.id} onTap={()=>!disabled&&toggle(pb.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.s1,borderRadius:22,padding:"16px",marginBottom:8,opacity:disabled?0.4:1}}>
                  <div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>{pb.n}</div><div style={{fontSize:12.5,color:C.ink3}}>{pb.pbKg===0?"BW":pb.pbKg+"kg"}</div></div>
                  <div style={{width:44,height:26,borderRadius:999,background:on?C.accent:C.s3,position:"relative",transition:`background 150ms ${EO}`,flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:on?20:2,width:22,height:22,borderRadius:"50%",background:C.knob,transition:`left 150ms ${EO}`}}/>
                  </div>
                </Tap>
              );
            })}
          </div>
        ))}
        <Tap onTap={()=>{onSave(sel);onClose();}} style={{marginTop:8,padding:"16px",borderRadius:12,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>Enregistrer</span>
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
          <span style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em"}}>Récompenses</span>
          <Tap onTap={onClose} style={{width:36,height:36,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
        </div>
        <div style={{fontSize:12.5,color:C.ink4,marginBottom:20}}>{earned}/{B.length} paliers débloqués.</div>
        {cats.map(cat=>{
          const list=B.filter(b=>b.cat===cat);
          const catEarned=list.filter(b=>b.ok).length;
          return(
            <div key={cat} style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                <span style={{fontSize:11.5,fontWeight:600,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>{cat}</span>
                <span style={{fontSize:11.5,color:C.ink4}}>{catEarned}/{list.length}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {list.map((b,i)=>(<span key={i} style={{padding:"7px 12px",borderRadius:999,background:b.ok?C.accent:C.s2,fontSize:11.5,fontWeight:600,color:b.ok?C.onAccent:C.ink4}}>{b.t}</span>))}
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
          <span style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em"}}>Apprentissage</span>
          <Tap onTap={onClose} style={{width:36,height:36,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
        </div>
        <div style={{fontSize:12.5,color:C.ink4,marginBottom:20}}>Choisis jusqu'à 2 mouvements à travailler. Un mini-bloc apparaîtra après l'échauffement, environ une séance sur deux. ({sel.length}/2)</div>
        {SKILLS_CATALOG.map(sk=>{
          const on=sel.includes(sk.id);
          const disabled=!on&&sel.length>=2;
          const existing=(activeSkills||[]).find(s=>s.skillId===sk.id);
          const stepIdx=existing?existing.stepIndex:0;
          return(
            <Tap key={sk.id} onTap={()=>!disabled&&toggle(sk.id)} style={{display:"flex",alignItems:"center",gap:10,background:C.s1,borderRadius:22,padding:"16px",marginBottom:8,opacity:disabled?0.4:1,border:`1.5px solid ${on?C.accent:"transparent"}`}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{sk.icon}</svg>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:C.ink}}>{sk.name}</div>
                <div style={{fontSize:11.5,color:C.ink3}}>{existing?`Étape ${stepIdx+1}/${sk.steps.length}`:`${sk.steps.length} étapes`}</div>
              </div>
              <div style={{width:24,height:24,borderRadius:"50%",background:on?C.accent:C.s3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{on&&<span style={{fontSize:11.5,fontWeight:600,color:C.onAccent}}>✓</span>}</div>
            </Tap>
          );
        })}
        <Tap onTap={save} style={{marginTop:8,padding:"16px",borderRadius:12,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>Enregistrer</span>
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
          }catch(ex){ setErr("Envoi impossible. Réessaie."); notify("La photo n'a pas pu être envoyée."); console.error("upload photo",ex&&ex.message); }
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px"}}>
        <div style={{fontSize:21,fontWeight:600,color:C.ink}}>Progression photo</div>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"0 20px 24px"}}>
        <div style={{background:C.s1,borderRadius:22,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:14}}>Ajouter une photo</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <span style={{fontSize:12.5,color:C.ink3,width:46}}>Date</span>
            <input type="date" value={date} max={todayKey()} onChange={e=>setDate(e.target.value)} style={{flex:1,height:44,borderRadius:12,border:`1px solid ${C.s4}`,background:C.s2,color:C.ink,fontSize:16,fontFamily:F,padding:"0 12px",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <Tap onTap={()=>_pf.current&&_pf.current.click()} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,height:48,borderRadius:12,background:C.accent}}><span style={{fontSize:16,fontWeight:600,color:C.onAccent}}>Choisir une photo</span></Tap><input ref={_pf} type="file" accept="image/*" onChange={onPhoto} style={{display:"none"}}/>
          <div style={{fontSize:11.5,color:err?C.alert:C.ink4,marginTop:10,lineHeight:1.5}}>
            {err?err:busy?"Envoi en cours…":"La photo est enregistrée sur ton compte et visible depuis tous tes appareils. Tu peux en ajouter une après coup pour n'importe quelle date."}
          </div>
        </div>
        {keys.length>=2&&(
          <div style={{background:C.s1,borderRadius:22,padding:"16px",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:4}}>Avant / Après</div>
            <div style={{fontSize:11.5,color:C.ink4,marginBottom:14}}>{gap} jours d'écart</div>
            <div style={{display:"flex",gap:10}}>
              {[["Avant",first],["Après",last]].map(([lbl,d])=>(
                <div key={d} style={{flex:1}}>
                  <div style={{borderRadius:12,overflow:"hidden",background:C.s2,aspectRatio:"3/4"}}><img src={(urls||{})[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
                  <div style={{fontSize:11.5,fontWeight:600,color:C.ink3,marginTop:6,textAlign:"center"}}>{lbl} · {d.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Toutes les photos</div>
        {keys.length===0?(
          <div style={{textAlign:"center",color:C.ink4,fontSize:14,padding:"30px 0"}}>Aucune photo pour l'instant.</div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[...keys].reverse().map(d=>(
              <div key={d} style={{position:"relative",borderRadius:12,overflow:"hidden",background:C.s2,aspectRatio:"3/4"}}>
                <img src={(urls||{})[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <div style={{position:"absolute",left:0,right:0,bottom:0,padding:"4px 6px",background:"linear-gradient(transparent,rgba(0,0,0,.75))",fontSize:10,fontWeight:600,color:C.onDark}}>{d.slice(5)}</div>
                <Tap onTap={()=>del(d)} style={{position:"absolute",top:4,right:4,width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:11.5,color:C.onDark}}>✕</span></Tap>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

// Bande photo. Elle vivait dans l'historique, donc dans la vue Resume : la
// progression du corps n'a rien a y faire, elle appartient a la vue Corps.
function PhotoStrip({photos,urls,onOpen}) {
  const dates=Object.keys(photos||{}).sort().reverse();
  return (
    <Tap label="Progression photo" onTap={onOpen} style={{display:"block",background:C.card,
      border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,borderRadius:22,
      padding:"16px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,
        marginBottom:dates.length?13:0}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:C.ink}}>Progression photo</div>
          <div style={{fontSize:11.5,color:C.ink4,marginTop:2}}>
            {dates.length?`${dates.length} photo${dates.length>1?"s":""} · voir l'évolution`:"Ajoute ta première photo"}</div>
        </div>
        <span style={{fontSize:11.5,fontWeight:600,padding:"6px 12px",borderRadius:999,
          background:C.s2,color:C.ink3,flexShrink:0}}>{dates.length?"Gérer ›":"+ Ajouter"}</span>
      </div>
      {dates.length>0&&(
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:3,scrollbarWidth:"none"}}>
          {dates.slice(0,12).map(d=>(
            <div key={d} style={{flexShrink:0,width:78,height:104,borderRadius:12,overflow:"hidden",
              background:C.s2,position:"relative"}}>
              <img src={(urls||{})[d]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",left:0,right:0,bottom:0,padding:"4px 8px",
                background:"linear-gradient(transparent,rgba(0,0,0,.75))",fontSize:10,fontWeight:600,
                color:C.onDark,fontVariantNumeric:"tabular-nums"}}>{d.slice(5)}</div>
            </div>
          ))}
        </div>
      )}
    </Tap>
  );
}

// Calendrier des seances. La liste "Seances recentes" qui le suivait disait exactement
// la meme chose que lui : un jour marque s'ouvre d'un tap et donne le rapport complet.
// Elle ajoutait un ecran de scroll pour un doublon.
function HistoryTab({sessions,onSelect,accent}) {
  const[view,setView]=useState(new Date());
  const y=view.getFullYear(),m=view.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const off=first===0?6:first-1;
  const MN=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const DN=["L","M","M","J","V","S","D"];
  const dates=sessions.map(s=>s.date);
  const monthCount=dates.filter(d=>d.slice(0,7)===`${y}-${String(m+1).padStart(2,"0")}`).length;
  // Plus de conteneur a gouttiere propre : la carte se cale sur la grille de la page,
  // sinon elle apparait plus etroite que les tuiles qui la precedent.
  return(
    <div style={{background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,
      borderRadius:22,padding:"16px",marginBottom:10,fontFamily:F}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:14}}>
        <Tap label="Mois précédent" onTap={()=>setView(new Date(y,m-1,1))}
          style={{width:34,height:34,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="back" size={15} stroke={C.ink3}/></Tap>
        <div style={{textAlign:"center",minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:C.ink}}>{MN[m]} {y}</div>
          <div style={{fontSize:11.5,color:C.ink4,marginTop:1}}>
            {monthCount?`${monthCount} séance${monthCount>1?"s":""} · appuie pour le détail`:"Aucune séance"}</div>
        </div>
        <Tap label="Mois suivant" onTap={()=>setView(new Date(y,m+1,1))}
          style={{width:34,height:34,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",
            justifyContent:"center",transform:"scaleX(-1)"}}>
          <Icon name="back" size={15} stroke={C.ink3}/></Tap>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:5}}>
        {DN.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:600,color:C.ink4}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {Array.from({length:off+days},(_,i)=>{
          if(i<off) return <div key={i}/>;
          const d=i-off+1;
          const key=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const done=dates.includes(key),isToday=key===todayKey();
          return(
            <Tap key={i} label={done?`Séance du ${d}`:undefined}
              onTap={()=>{if(done){const x=sessions.find(h=>h.date===key);if(x)onSelect(x);}}}
              style={{aspectRatio:"1",borderRadius:12,background:done?(accent||C.accent):(isToday?C.s2:"transparent"),
                border:isToday&&!done?`1px solid ${C.s4}`:"none",display:"flex",alignItems:"center",
                justifyContent:"center",transition:`background 200ms ${EO}`}}>
              <span style={{fontSize:12.5,fontWeight:done||isToday?600:400,
                color:done?C.onAccent:(isToday?C.ink:C.ink4),fontVariantNumeric:"tabular-nums"}}>{d}</span>
            </Tap>
          );
        })}
      </div>
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
          <div style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.03em"}}>Modifier la semaine</div>
          <div style={{fontSize:12.5,color:C.ink4,marginTop:2}}>Choisis la séance de chaque jour</div>
        </div>
        <Tap onTap={onClose} style={{width:38,height:38,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,color:C.ink3}}>✕</span></Tap>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
        <Tap onTap={onToggleAuto} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px",borderRadius:12,background:C.s1,marginBottom:20}}>
          <div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>Rotation automatique</div><div style={{fontSize:11.5,color:C.ink4,marginTop:2}}>Séances différentes chaque semaine</div></div>
          <div style={{width:46,height:28,borderRadius:999,background:autoRotate?C.accent:C.s4,position:"relative",transition:`background 200ms ${EO}`,flexShrink:0}}><div style={{position:"absolute",top:3,left:autoRotate?21:3,width:22,height:22,borderRadius:"50%",background:C.knob,transition:`left 200ms ${EO}`}}/></div>
        </Tap>
        {schedule.map((d,i)=>(
          <div key={i} style={{marginBottom:18}}>
            <div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:8}}>{d.day} · <span style={{color:d.salle?C.accent:C.ink4}}>{d.label}</span></div>
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:2,scrollbarWidth:"none"}}>
              {SESSION_TEMPLATES.map((tp,ti)=>{
                const sel=tp.label===d.label;
                return(
                  <Tap key={ti} onTap={()=>assign(i,tp)} style={{flexShrink:0,padding:"10px 14px",borderRadius:12,background:sel?C.accent:C.s2,border:`1px solid ${sel?C.accent:C.s4}`}}>
                    <span style={{fontSize:14,fontWeight:600,color:sel?C.onAccent:C.ink2}}>{tp.label}</span>
                  </Tap>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:`14px 20px calc(14px + env(safe-area-inset-bottom))`,borderTop:`1px solid ${C.s3}`,display:"flex",gap:10}}>
        <Tap onTap={onReset} style={{flex:1,padding:"16px",borderRadius:12,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Programme par défaut</span></Tap>
        <Tap onTap={onClose} style={{flex:1,padding:"16px",borderRadius:12,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>Terminé</span></Tap>
      </div>
    </div>
    </div>
  );
}

// Profil en deux vues, comme les Stats. La page melait dix choses de nature
// differente au meme niveau : un reglage de son pesait visuellement autant que
// l'objectif d'entrainement. La frontiere est desormais nette —
//   Moi       ce qui te decrit et ce qui nourrit le moteur
//   Reglages  ce qui habille l'application et le compte
function SettingsTab({user,excluded,onToggleExclude,onSignOut,onReset,onOpenLibrary,profile,schedule,avatarUrl,onUpdateConfig,onOpenScheduleEditor,onRedoOnboarding,progDone}) {
  const[view,setView]=useState("moi");
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
  const goalLabel=(GOALS.find(g=>g[0]===profile?.goal)||[])[1]||"Non défini";
  const total=profile?.total_sessions||60;
  // Le compte vient des seances reellement enregistrees dans ce programme, pas
  // du compteur stocke : c'est lui qui avait derive et affichait un cran de moins.
  const doneN=Math.min(progDone!=null?progDone:(profile?.session_index||0),total);
  const pct=total?Math.round(doneN/total*100):0;
  // Semaine du programme : "semaine 6" se deduit de la date de debut, pas du calendrier.
  const progWeek=profile?.program_start
    ?Math.max(1,Math.floor((new Date(todayKey()+"T00:00:00")-new Date(profile.program_start+"T00:00:00"))/604800000)+1)
    :null;

  const CARD={background:C.card,border:`1px solid ${C.s2}`,boxShadow:`0 3px 16px ${C.ink5}`,borderRadius:22};
  const LBL={fontSize:10,fontWeight:600,letterSpacing:".11em",textTransform:"uppercase",color:C.ink4};
  const PILL={fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,background:C.s2,color:C.ink3,whiteSpace:"nowrap"};
  const FIELD={height:46,borderRadius:22,border:`1px solid ${C.s3}`,background:C.bg,color:C.ink,fontSize:15,
    fontWeight:500,fontFamily:F,textAlign:"center",outline:"none",boxSizing:"border-box",width:112,
    fontVariantNumeric:"tabular-nums"};

  // Ligne de reglage : intitule a gauche, valeur et chevron a droite. Une seule
  // fabrique, pour que dix reglages ne produisent pas dix mises en page.
  const Line=({label,value,onTap:tap,first,danger})=>{
    const inner=(
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"13px 0",
        borderTop:first?"none":`1px solid ${C.s2}`}}>
        <span style={{fontSize:14,fontWeight:500,color:danger?C.alert:C.ink}}>{label}</span>
        <span style={{fontSize:12.5,color:C.ink4,flexShrink:0,fontVariantNumeric:"tabular-nums"}}>
          {value!=null&&<span style={{marginRight:7}}>{value}</span>}›</span>
      </div>
    );
    return tap?<Tap label={label} onTap={tap} style={{display:"block"}}>{inner}</Tap>:inner;
  };

  const Measure=({v,u,l})=>(
    <div style={{minWidth:0}}>
      <div style={{fontSize:21,fontWeight:500,color:C.onDark,letterSpacing:"-.03em",lineHeight:1,
        fontVariantNumeric:"tabular-nums"}}>{v}<span style={{fontSize:11.5,fontWeight:400,color:C.onDark2}}>{u?` ${u}`:""}</span></div>
      <div style={{fontSize:10,color:C.onDark2,marginTop:4}}>{l}</div>
    </div>
  );

  const VIEWS=[["moi","Moi"],["reglages","Réglages"]];
  return(
    <div style={{padding:"14px 18px 16px",maxWidth:600,margin:"0 auto",fontFamily:F}}>

      <div style={{position:"sticky",top:0,zIndex:Z.sticky,background:C.bg,paddingBottom:11}}>
        <div style={{display:"flex",gap:4,background:C.s1,borderRadius:999,padding:4}}>
          {VIEWS.map(([k,l])=>{
            const on=view===k;
            return(
              <Tap key={k} label={l} onTap={()=>{setView(k);play("tick");}}
                style={{flex:1,padding:"9px 0",borderRadius:999,background:on?C.bg:"transparent",
                  boxShadow:on?`0 2px 9px ${C.ink5}`:"none",display:"flex",alignItems:"center",
                  justifyContent:"center",transition:`all 220ms ${EO}`}}>
                <span style={{fontSize:12.5,fontWeight:on?600:500,color:on?C.ink:C.ink4}}>{l}</span>
              </Tap>
            );
          })}
        </div>
      </div>

      {view==="moi"&&(
      <div key="moi" style={{animation:`riseIn 300ms ${EO} both`}}>

        {/* Carte d'identite : ton profil sportif n'est pas un reglage. */}
        <div style={{background:C.idcard,borderRadius:22,padding:"16px",marginBottom:10}}>
          <div style={{display:"flex",gap:13,alignItems:"center"}}>
            <div onClick={()=>avatarRef.current&&avatarRef.current.click()}
              style={{position:"relative",width:60,height:60,borderRadius:22,background:C.accent,display:"flex",
                alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden",cursor:"pointer"}}>
              {avatar
                ?<img src={avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                :<span style={{fontSize:21,fontWeight:500,color:C.onAccent}}>
                   {(user?.user_metadata?.name||user?.email||"U").slice(0,2).toUpperCase()}</span>}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" onChange={onAvatar} style={{display:"none"}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,color:C.onDark,letterSpacing:"-.015em",whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis"}}>{user?.user_metadata?.name||"Athlète"}</div>
              <div style={{fontSize:11.5,color:C.onDark2,marginTop:2,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis"}}>{user?.email||""}</div>
            </div>
            <Tap label="Changer la photo" onTap={()=>avatarRef.current&&avatarRef.current.click()}
              style={{padding:"6px 12px",borderRadius:999,background:C.onDark3,flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:600,color:C.onDark}}>{avatar?"Modifier":"Ajouter"}</span></Tap>
          </div>
          <div style={{height:1,background:C.onDark3,margin:"14px 0 12px"}}/>
          <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
            <Measure v={profile?.weight_kg!=null?String(profile.weight_kg).replace(".",","):"—"} u="kg" l="Poids"/>
            <Measure v={profile?.height_cm||"—"} u="cm" l="Taille"/>
            <Measure v={profile?.age||"—"} u="ans" l="Âge"/>
            <Measure v={profile?.sex==="femme"?"F":profile?.sex==="homme"?"H":"—"} l="Sexe"/>
          </div>
        </div>

        {/* Programme en cours */}
        <div style={{background:C.accent,border:`1px solid ${C.accent}`,borderRadius:22,padding:"16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
            <span style={{fontSize:11.5,fontWeight:600,color:"rgba(27,27,27,.62)"}}>Programme en cours</span>
            {progWeek&&<span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,
              background:"rgba(255,255,255,.5)",color:C.onAccent,whiteSpace:"nowrap"}}>Semaine {progWeek}</span>}
          </div>
          <div style={{fontSize:34,fontWeight:500,color:C.onAccent,letterSpacing:"-.035em",lineHeight:1,marginTop:9,
            fontVariantNumeric:"tabular-nums"}}>{doneN}
            <span style={{fontSize:12.5,fontWeight:400,color:"rgba(27,27,27,.5)"}}> / {total} séances</span></div>
          <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,.45)",overflow:"hidden",marginTop:12}}>
            <div style={{height:"100%",width:`${pct}%`,background:C.onAccent,borderRadius:3,
              transition:`width 460ms ${EO}`}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginTop:11}}>
            <span style={{fontSize:11.5,color:"rgba(27,27,27,.62)"}}>{goalLabel} · {trainDays.length} jours/semaine</span>
            {onOpenScheduleEditor&&<Tap label="Modifier les séances" onTap={onOpenScheduleEditor}>
              <span style={{fontSize:11.5,fontWeight:600,color:C.onAccent}}>Modifier ›</span></Tap>}
          </div>
        </div>

        {/* Objectif : c'est lui qui pilote le moteur, il merite d'etre choisi ici. */}
        <div style={{...CARD,padding:"16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Objectif</span>
            <span style={PILL}>Pilote le moteur</span>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {GOALS.map(([k,l])=>{
              const on=profile?.goal===k;
              return(
                <Tap key={k} label={l} onTap={()=>{onUpdateConfig&&onUpdateConfig({goal:k});play("clic");buzz(15);}}
                  style={{padding:"8px 14px",borderRadius:999,background:on?C.fill:C.s1,
                    transition:`all 180ms ${EO}`}}>
                  <span style={{fontSize:11.5,fontWeight:on?600:500,color:on?C.onFill:C.ink3}}>{l}</span></Tap>
              );
            })}
          </div>
        </div>

        {/* Jours de seance */}
        <div style={{...CARD,padding:"16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Jours de séance</span>
            <span style={PILL}>{trainDays.length} / semaine</span>
          </div>
          <div style={{display:"flex",gap:5}}>
            {["L","M","M","J","V","S","D"].map((lbl,i)=>{
              const on=trainDays.includes(i);
              return(
                <Tap key={i} label={`Jour ${i+1}`}
                  onTap={()=>{const nd=on?trainDays.filter(x=>x!==i):[...trainDays,i];
                    if(nd.length&&onUpdateConfig){onUpdateConfig({days:nd});play("clic");buzz(15);}}}
                  style={{flex:1,padding:"11px 0",borderRadius:12,background:on?C.accent:C.s1,
                    display:"flex",alignItems:"center",justifyContent:"center",transition:`all 180ms ${EO}`}}>
                  <span style={{fontSize:11.5,fontWeight:600,color:on?C.onAccent:C.ink4}}>{lbl}</span></Tap>
              );
            })}
          </div>
        </div>

        {/* Mensurations modifiables */}
        <div style={{...CARD,padding:"16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:13}}>
            <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Mensurations</span>
            <span style={PILL}>Échelonne les charges</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["Poids",w,setW,"kg",v=>v.replace(/[^0-9.]/g,""),()=>onUpdateConfig({weight_kg:w?Number(w):null})],
              ["Taille",h,setH,"cm",v=>v.replace(/[^0-9]/g,""),()=>onUpdateConfig({height_cm:h?Number(h):null})],
              ["Âge",ag,setAg,"ans",v=>v.replace(/[^0-9]/g,""),()=>onUpdateConfig({age:ag?Number(ag):null})]
            ].map(([l,val,set,u,clean,blur])=>(
              <div key={l}>
                <div style={{...LBL,marginBottom:6}}>{l}</div>
                <input inputMode="decimal" value={val} onChange={e=>set(clean(e.target.value))} onBlur={blur}
                  placeholder={u} aria-label={l} style={{...FIELD,width:"100%"}}/>
              </div>
            ))}
          </div>
          <div style={{...LBL,margin:"14px 0 7px"}}>Sexe</div>
          <div style={{display:"flex",gap:7}}>
            {[["homme","Homme"],["femme","Femme"]].map(([k,l])=>{
              const on=profile?.sex===k;
              return(
                <Tap key={k} label={l} onTap={()=>onUpdateConfig&&onUpdateConfig({sex:k})}
                  style={{flex:1,padding:"11px 0",borderRadius:22,background:on?C.accent:C.s1,
                    display:"flex",alignItems:"center",justifyContent:"center",transition:`all 180ms ${EO}`}}>
                  <span style={{fontSize:12.5,fontWeight:600,color:on?C.onAccent:C.ink3}}>{l}</span></Tap>
              );
            })}
          </div>
          {(hasChanges||saved||saveErr)&&(
            <Tap label="Enregistrer les mensurations" onTap={async()=>{
              const r=await onUpdateConfig({weight_kg:w?Number(w):null,height_cm:h?Number(h):null,age:ag?Number(ag):null});
              if(r&&r.error){setSaved(false);setSaveErr(true);setTimeout(()=>setSaveErr(false),2400);}
              else{setSaveErr(false);setSaved(true);setTimeout(()=>setSaved(false),1600);}}}
              style={{marginTop:13,height:48,borderRadius:22,background:saveErr?C.s4:(saved?C.accent:C.fill),
                display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:14,fontWeight:600,color:saveErr?C.ink:(saved?C.onAccent:C.onFill)}}>
                {saveErr?"Erreur — réessayer":(saved?"Enregistré":"Enregistrer")}</span></Tap>
          )}
        </div>

        <div style={{...CARD,padding:"2px 16px",marginBottom:10}}>
          <Line first label={profile?.program_start?"Recommencer un programme":"Démarrer un programme"}
            value="12 semaines" onTap={()=>onUpdateConfig&&onUpdateConfig({program_start:todayKey()})}/>
          <Line label="Refaire l'introduction" onTap={onRedoOnboarding}/>
        </div>
      </div>)}

      {view==="reglages"&&(
      <div key="reglages" style={{animation:`riseIn 300ms ${EO} both`}}>

        <div style={{...CARD,padding:"16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:600,color:C.ink}}>Apparence</span>
            <span style={PILL}>{((profile&&profile.theme)||"light")==="dark"?"Sombre":"Clair"}</span>
          </div>
          <div style={{display:"flex",gap:10}}>
            {[["light","Clair","Encre sur blanc"],["dark","Sombre","Blanc sur encre"]].map(([v,t,d])=>{
              const on=((profile&&profile.theme)||"light")===v;
              return(
                <Tap key={v} label={t} onTap={()=>{onUpdateConfig&&onUpdateConfig({theme:v});play("clic");buzz(15);}}
                  style={{flex:1,padding:"16px",borderRadius:22,background:on?C.accentSoft:C.s1,
                    border:`1px solid ${on?C.accent:"transparent"}`,transition:`all 200ms ${EO}`}}>
                  <div style={{display:"flex",gap:5,marginBottom:9}}>
                    <span style={{width:19,height:19,borderRadius:12,background:v==="dark"?"#1B1B1B":"#FFFFFF",border:`1px solid ${C.s4}`}}/>
                    <span style={{width:19,height:19,borderRadius:12,background:v==="dark"?"#1C1C2B":"#F5F4FA",border:`1px solid ${C.s4}`}}/>
                    <span style={{width:19,height:19,borderRadius:12,background:"#C0B4FE"}}/>
                  </div>
                  <div style={{fontSize:14,fontWeight:600,color:C.ink}}>{t}</div>
                  <div style={{fontSize:11.5,color:C.ink4,marginTop:1}}>{d}</div>
                </Tap>
              );
            })}
          </div>
        </div>

        <div style={{...CARD,padding:"16px",marginBottom:10}}>
          <div style={{fontSize:14,fontWeight:600,color:C.ink,marginBottom:2}}>Signaux</div>
          <div style={{fontSize:11.5,color:C.ink4,marginBottom:4}}>Ce que l'app te dit sans que tu regardes l'écran.</div>
          {[["sound_on","Sons","Fin de repos, minute EMOM, fin de bloc"],
            ["vibrate_on","Vibration","Utile en salle avec des écouteurs"],
            ["countdown_on","Décompte 3·2·1","Trois clics avant la fin du repos"],
          ].map(([k,t,d],i)=>{
            const on=profile?.[k]!==false;
            return(
              <Tap key={k} label={t} onTap={()=>{const next=!on;onUpdateConfig&&onUpdateConfig({[k]:next});
                if(next){unlockAudio();play(k==="countdown_on"?"tick":"cloche");}}}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"12px 0",
                  borderTop:i?`1px solid ${C.s2}`:`1px solid ${C.s2}`}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,color:C.ink}}>{t}</div>
                  <div style={{fontSize:11.5,color:C.ink4,marginTop:1}}>{d}</div>
                </div>
                <div style={{width:44,height:26,borderRadius:999,background:on?C.accent:C.s3,position:"relative",
                  transition:`background 200ms ${EO}`,flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:on?21:3,width:20,height:20,borderRadius:"50%",
                    background:C.knob,transition:`left 200ms ${EO}`,boxShadow:"0 1px 3px rgba(0,0,0,.25)"}}/>
                </div>
              </Tap>
            );
          })}
        </div>

        <div style={{...CARD,padding:"2px 16px",marginBottom:10}}>
          <Line first label="Bibliothèque d'exercices" value={DB.length} onTap={onOpenLibrary}/>
          <Line label="Exercices exclus" value={excluded.length||"aucun"} onTap={()=>setShowLib(o=>!o)}/>
        </div>
        {showLib&&(
          <div style={{...CARD,padding:"6px 16px",marginBottom:10,maxHeight:340,overflowY:"auto"}}>
            {DB.map((ex,i)=>(
              <div key={ex.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,
                padding:"10px 0",borderTop:i?`1px solid ${C.s2}`:"none",opacity:excluded.includes(ex.id)?.45:1}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:500,color:C.ink,whiteSpace:"nowrap",overflow:"hidden",
                    textOverflow:"ellipsis"}}>{ex.n}</div>
                  <div style={{fontSize:11.5,color:C.ink4}}>{EQ_LABELS[ex.eq]}</div>
                </div>
                <Tap label={excluded.includes(ex.id)?"Réactiver":"Exclure"} onTap={()=>onToggleExclude(ex.id)}
                  style={{padding:"5px 13px",borderRadius:999,flexShrink:0,
                    border:`1px solid ${excluded.includes(ex.id)?C.done:C.s3}`,
                    background:excluded.includes(ex.id)?C.doneSoft:"transparent"}}>
                  <span style={{fontSize:11.5,fontWeight:600,color:excluded.includes(ex.id)?C.done:C.ink4}}>
                    {excluded.includes(ex.id)?"Réactiver":"Exclure"}</span></Tap>
              </div>
            ))}
          </div>
        )}

        <div style={{...CARD,padding:"2px 16px",marginBottom:10}}>
          <Line first label="Se déconnecter" onTap={onSignOut}/>
          <Line label="Effacer les données" danger
            onTap={()=>{if(window.confirm("Effacer toutes les données locales ?"))onReset();}}/>
        </div>

        <div style={{fontSize:11.5,color:C.ink4,textAlign:"center",padding:"6px 0 4px"}}>
          SŌMA · {"S"+weekNumber()} · {DB.length} exercices · version {VERSION}</div>
      </div>)}
    </div>
  );
}

// ─── TAB TRANSITION — slide between tabs ─────────────────────────────────────
// Le nom compose, avec la barre DESSINEE au-dessus du O. S'appuyer sur le glyphe
// Ō laissait la barre a la merci de la police installee : longueur, epaisseur et
// hauteur changeaient d'un appareil a l'autre.
function Wordmark({h=22,color}) {
  const c=color||C.ink;
  return (
    <span role="img" aria-label="SŌMA" style={{display:"inline-flex",alignItems:"baseline",
      fontFamily:F,fontSize:h,fontWeight:400,letterSpacing:".2em",color:c,lineHeight:1,
      whiteSpace:"nowrap"}}>
      <span>S</span>
      <span style={{position:"relative",display:"inline-block"}}>
        O
        <span style={{position:"absolute",left:0,width:"1em",height:Math.max(1,h*0.045),
          top:"-.30em",background:c,borderRadius:0}}/>
      </span>
      <span>MA</span>
    </span>
  );
}

function TabContent({tab,prevTab,children}) {
  const dir = useMemo(()=>{
    // La liste ne correspondait pas aux onglets reels ("home" manquait, "history" n'existe
    // pas) : indexOf renvoyait -1 et la direction du glissement etait fausse.
    const order=["home","seance","stats","settings"];
    const ci=order.indexOf(tab),pi=order.indexOf(prevTab||tab);
    return ci>pi?1:-1;
  },[tab,prevTab]);
  return(
    <div key={tab} className="tabin" style={{animation:`slideTab${dir>0?"Right":"Left"} 320ms ${EO} both`}}>
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
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:21,fontWeight:600,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1}}>{ex.n}</div>
              <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}><span style={{fontSize:14,color:C.ink3}}>{ex.m}</span><span style={{fontSize:11.5,fontWeight:600,padding:"2px 9px",borderRadius:999,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span></div>
            </div>
            <Tap onTap={()=>onToggleFav(ex.id)} style={{width:44,height:44,borderRadius:12,background:fav?C.accentSoft:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:21,color:fav?C.accent:C.ink4}}>{fav?"★":"☆"}</span></Tap>
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"18px 20px 40px"}}>
          <div style={{display:"flex",gap:10,marginBottom:20}}>
            {meta.map(([l,v])=>(<div key={l} style={{flex:1,background:C.s2,borderRadius:12,padding:"16px",textAlign:"center"}}><div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:600,color:C.ink}}>{v}</div></div>))}
          </div>
          {hist.length>=2?(()=>{const W=320,H=120,pad=10;const xs=hist.map((_,i)=>pad+i*(W-2*pad)/(hist.length-1));const mn=Math.min(...hist.map(h=>h.kg)),mx=Math.max(...hist.map(h=>h.kg)),rng=(mx-mn)||1;const ys=hist.map(h=>H-pad-(h.kg-mn)/rng*(H-2*pad));const pts=xs.map((x,i)=>x+","+ys[i]).join(" ");return <div style={{marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}><div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em"}}>Progression — charge</div><div style={{fontSize:12.5,fontWeight:600,color:C.accent}}>PR {mx}kg</div></div><svg viewBox={"0 0 "+W+" "+H} style={{width:"100%",height:"auto",display:"block"}}><polyline points={pts} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>{xs.map((x,i)=>(<circle key={i} cx={x} cy={ys[i]} r="3.5" fill={C.accent}/>))}</svg><div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:11.5,color:C.ink4}}>{hist[0].date.slice(5)}</span><span style={{fontSize:11.5,color:C.ink4}}>{hist[hist.length-1].date.slice(5)}</span></div></div>;})():(<div style={{background:C.s2,borderRadius:12,padding:"16px",marginBottom:20,fontSize:12.5,color:C.ink4,lineHeight:1.5}}>Fais cet exercice quelques fois pour voir ta courbe de progression.</div>)}
          {ex.cue&&<div style={{background:C.s2,borderRadius:12,padding:"16px",marginBottom:20}}><div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Technique</div><div style={{fontSize:15,color:C.ink2,lineHeight:1.5}}>{ex.cue}</div></div>}
          {variants.length>0&&<div><div style={{fontSize:11.5,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Variantes</div>{variants.map(v=>(<div key={v.id} style={{padding:"12px 0",borderBottom:`1px solid ${C.s3}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,color:C.ink}}>{v.n}</span><span style={{fontSize:11.5,fontWeight:600,padding:"1px 8px",borderRadius:999,background:C.s3,color:C.ink4}}>{EQ_LABELS[v.eq]}</span></div>))}</div>}
        </div>
        <div style={{padding:"0 20px calc(24px + env(safe-area-inset-bottom))"}}><Tap onTap={onClose} style={{padding:"16px",borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Fermer</span></Tap></div>
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
  const chip=(active)=>({flexShrink:0,padding:"6px 14px",borderRadius:999,border:`1px solid ${active?C.accent:C.div}`,background:active?C.accentSoft:"transparent"});
  return(
    <div style={{position:"fixed",inset:0,zIndex:Z.fullscreen,background:C.bg,fontFamily:F,overflowY:"auto"}}>
    <div style={{maxWidth:600,margin:"0 auto",padding:`calc(20px + env(safe-area-inset-top)) 20px calc(40px + env(safe-area-inset-bottom))`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div><div style={{fontSize:34,fontWeight:600,color:C.ink,letterSpacing:"-.03em"}}>Bibliothèque</div><div style={{fontSize:14,color:C.ink4,marginTop:4}}>{DB.length} exercices</div></div>
        <Tap onTap={onClose} style={{width:38,height:38,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:15,color:C.ink3}}>✕</span></Tap>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un exercice..." style={{width:"100%",padding:"16px",borderRadius:12,border:`1px solid ${C.div}`,fontFamily:F,fontSize:16,color:C.ink,background:C.s2,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:10}}>
        <Tap onTap={()=>setFavOnly(v=>!v)} style={chip(favOnly)}><span style={{fontSize:11.5,fontWeight:600,color:favOnly?C.accent:C.ink4}}>★ Favoris</span></Tap>
        {Object.entries(EQ_LABELS).map(([k,l])=>(<Tap key={k} onTap={()=>setEq(eq===k?null:k)} style={chip(eq===k)}><span style={{fontSize:11.5,fontWeight:600,color:eq===k?C.accent:C.ink4}}>{l}</span></Tap>))}
      </div>
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:16}}>
        {MG.map(([l])=>(<Tap key={l} onTap={()=>setMg(mg===l?null:l)} style={chip(mg===l)}><span style={{fontSize:11.5,fontWeight:600,color:mg===l?C.accent:C.ink4}}>{l}</span></Tap>))}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 0",fontSize:15,color:C.ink4}}>Aucun résultat.</div>}
      {filtered.map(ex=>(
        <Tap key={ex.id} onTap={()=>setSel(ex)} style={{padding:"14px 0",borderBottom:`1px solid ${C.s3}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div style={{minWidth:0}}><div style={{fontSize:15,fontWeight:600,color:C.ink,marginBottom:4}}>{ex.n}</div><div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:12.5,color:C.ink3}}>{ex.m}</span><span style={{fontSize:11.5,fontWeight:600,padding:"1px 8px",borderRadius:999,background:C.s3,color:C.ink4}}>{EQ_LABELS[ex.eq]}</span></div></div>
          {favorites.includes(ex.id)&&<span style={{fontSize:15,color:C.accent,flexShrink:0}}>★</span>}
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
const pendingSessionFor=(goal,sessionIndex,equipment,ctx)=>{
  // Moteur V4. L'ancien chemin subsiste en repli : si le V4 ne rend rien pour une
  // raison quelconque, on ne se retrouve pas sans seance.
  const v4=v4Session(goal||"hybride",sessionIndex,{
    equipment:(equipment&&equipment.length)?equipment:["bar","db","kb","mc","cd","bw"],
    frequency:(ctx&&ctx.frequency)||5,
    rms:(ctx&&ctx.rms)||{},
    perf:(ctx&&ctx.perf)||{},
    strength:(ctx&&ctx.strength)||{},
    scale:(ctx&&ctx.scale)||1,
    excluded:(ctx&&ctx.excluded)||[],
    total:(ctx&&ctx.total)||60,
  });
  if(v4) return v4;
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
  const card=(sel)=>({display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px",borderRadius:22,background:sel?C.accent:C.s1,border:`1px solid ${sel?C.accent:C.s3}`,marginBottom:10,cursor:"pointer"});
  const ttl=(sel)=>({fontSize:15,fontWeight:600,color:sel?C.onAccent:C.ink});
  const dsc=(sel)=>({fontSize:12.5,color:sel?"rgba(0,0,0,.6)":C.ink4,marginTop:3});
  const chk=(sel)=> sel?<span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>✓</span>:null;
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
        {onClose&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}><Tap onTap={onClose} style={{width:36,height:36,borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,color:C.ink3}}>✕</span></Tap></div>}
        <div style={{display:"flex",gap:6,marginBottom:28}}>
          {[0,1,2,3,4,5].map(i=>(<div key={i} style={{flex:1,height:4,borderRadius:999,background:i<=step?C.accent:C.s3,transition:`background 250ms ${EO}`}}/>))}
        </div>
        <div style={{fontSize:34,fontWeight:600,color:C.ink,letterSpacing:"-.03em",lineHeight:1.1}}>{titles[step]}</div>
        <div style={{fontSize:15,color:C.ink4,marginTop:6}}>{subs[step]}</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px"}}>
        {step===0 && GOALS.map(([k,tt,d])=>(<Tap key={k} onTap={()=>setGoal(k)} style={card(goal===k)}><div><div style={ttl(goal===k)}>{tt}</div><div style={dsc(goal===k)}>{d}</div></div>{chk(goal===k)}</Tap>))}
        {step===1 && LEVELS.map(([k,tt,d])=>(<Tap key={k} onTap={()=>setLevel(k)} style={card(level===k)}><div><div style={ttl(level===k)}>{tt}</div><div style={dsc(level===k)}>{d}</div></div>{chk(level===k)}</Tap>))}
        {step===2 && EQUIP.map(([k,tt])=>(<Tap key={k} onTap={()=>toggleEq(k)} style={card(equip.includes(k))}><div style={ttl(equip.includes(k))}>{tt}</div>{chk(equip.includes(k))}</Tap>))}
        {step===3 && FREQS.map(f=>(<Tap key={f} onTap={()=>setFreq(f)} style={card(freq===f)}><div style={ttl(freq===f)}>{f} jours / semaine</div>{chk(freq===f)}</Tap>))}
        {step===4 && (<div style={{display:"flex",alignItems:"center",gap:14,background:C.s1,borderRadius:22,padding:"16px",border:`1px solid ${C.s3}`}}><input value={weight} onChange={e=>setWeight(e.target.value.replace(/[^0-9.]/g,""))} inputMode="decimal" placeholder="75" style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.ink,fontSize:34,fontWeight:600,fontFamily:F,width:"100%"}}/><span style={{fontSize:16,color:C.ink4}}>kg</span></div>)}
        {step===5 && (<div>
          <div style={{background:C.s1,borderRadius:22,padding:"16px",border:`1px solid ${C.s3}`,marginBottom:10}}>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",background:"transparent",border:"none",outline:"none",color:C.ink,fontSize:21,fontWeight:600,fontFamily:F}}/>
          </div>
          <Tap onTap={()=>setStartDate(todayKey())} style={{padding:"16px",borderRadius:12,background:startDate===todayKey()?C.accentSoft:C.s1,border:`1px solid ${startDate===todayKey()?C.accent:C.s3}`,display:"inline-flex"}}><span style={{fontSize:12.5,fontWeight:600,color:startDate===todayKey()?C.accent:C.ink3}}>Aujourd'hui</span></Tap>
          <div style={{fontSize:12.5,color:C.ink4,marginTop:14,lineHeight:1.5}}>Tu peux choisir une date future pour préparer ton programme à l'avance.</div>
        </div>)}
      </div>
      <div style={{padding:`14px 24px calc(20px + env(safe-area-inset-bottom))`,display:"flex",gap:10}}>
        {step>0&&<Tap onTap={()=>setStep(step-1)} style={{padding:"17px 22px",borderRadius:12,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Retour</span></Tap>}
        <Tap onTap={canNext&&!saving?next:undefined} style={{flex:1,padding:"16px",borderRadius:12,background:canNext?C.accent:C.s3,display:"flex",alignItems:"center",justifyContent:"center",opacity:saving?0.6:1}}><span style={{fontSize:15,fontWeight:600,color:canNext?C.onAccent:C.ink4}}>{saving?"Creation...":last?"Creer mon programme":"Continuer"}</span></Tap>
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
  const[accent,setAccent]=useState(C.accent);
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
  const profileRef=useRef(null);
  const[weighIns,setWeighIns]=useState([]);
  const weighInsRef=useRef([]);
  useEffect(()=>{weighInsRef.current=weighIns;},[weighIns]);
  // La pesee acceptait implicitement la date du jour : impossible de rattraper une
  // pesee oubliee, alors que la courbe vit justement du nombre de points.
  const saveWeighIn=useCallback((kg,when)=>{
    const id=user?.id; if(!id||!(kg>0)) return;
    const date=(typeof when==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(when))?when:todayKey();
    setWeighIns(prev=>[...prev.filter(w=>w.date!==date),{date,weight_kg:kg}]);
    // La pesee fait autorite sur le poids du profil - mais seule la plus RECENTE :
    // saisir une pesee d'il y a trois semaines ne doit pas redefinir le poids courant.
    if(date>=todayKey()||!weighInsRef.current.some(w=>w.date>date))
      updateConfigRef.current&&updateConfigRef.current({weight_kg:kg});
    enqueue(`weigh:${date}`,"pesée",()=>supabase.from("weigh_ins").upsert({user_id:id,date,weight_kg:kg},{onConflict:"user_id,date"}));
  },[user]);
  const updateConfigRef=useRef(null);
  // Nombre d'ecritures encore en attente d'envoi : sans cet indicateur, rien ne distingue
  // une seance enregistree d'une seance qui n'a pas encore quitte le telephone.
  const[pending,setPending]=useState(0);
  useEffect(()=>{ outboxSubs.add(setPending); return()=>{outboxSubs.delete(setPending);}; },[]);
  // Le theme est applique AVANT le rendu des enfants : ils lisent C au moment de rendre,
  // donc reecrire ses cles ici suffit, sans toucher a un seul style en ligne.
  const themeMode=(profile&&profile.theme==="dark")?"dark":"light";
  applyTheme(themeMode);
  const[toasts,setToasts]=useState([]);
  useEffect(()=>{ toastSubs.add(setToasts); return()=>{toastSubs.delete(setToasts);}; },[]);
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
    // On re-tente a chaque appui tant que le contexte n'est pas reellement en
    // marche, au lieu d'abandonner apres le premier essai.
    const on=()=>{ unlockAudio();
      const c=SOUND.ctx; if(c&&c.state==="running"){
        window.removeEventListener("pointerdown",on);
        window.removeEventListener("touchend",on); } };
    window.addEventListener("pointerdown",on,{once:false});
    window.addEventListener("touchend",on,{once:false});
    return()=>{ window.removeEventListener("pointerdown",on);
      window.removeEventListener("touchend",on); };
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
  // La rotation des variantes suivait la semaine du CALENDRIER alors que tout le reste est
  // passe sur le numero de seance au S9 : sauter une semaine faisait tourner les exercices
  // sans que la moindre seance ait ete faite.
  const rotIdx=Math.max(1,Math.floor((Number(profile&&profile.session_index)||0)/SESSIONS_PER_BLOCK)+1);
  const viewSchedule=useMemo(()=>{let s=autoRotate?schedule.map(d=>rotateDay(d,rotIdx)):schedule;const eq=profile?.equipment;if(eq&&eq.length)s=s.map(d=>adaptEquip(d,eq));const g=profile?.goal;if(g&&g!=="hybride")s=s.map(d=>adaptGoal(d,g));s=s.map(d=>personalizeDay(d,profile,progWeekOf(profile?.program_start),perfRef.current));const _mp=weeklyModePlan(s,profile,progWeekOf(profile?.program_start));s=s.map((d,i)=>(d&&d.salle)?{...d,recommendedMode:(_mp[i]&&_mp[i].mode)||"classique",circuit:(_mp[i]&&_mp[i].circuit)||false}:d);return s;},[schedule,autoRotate,rotIdx,profile]);


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
    // On repart de la DERNIERE valeur connue, pas de celle capturee au rendu :
    // sans cela deux appels rapproches se recouvrent au lieu de se cumuler.
    const base=profileRef.current||profile||{};
    const next={...base,...updates};
    profileRef.current=next;
    if(updates.days){ next.frequency=updates.days.length; const sched=generateScheduleDays(updates.days); setSchedule(sched); persist(user?.id,{schedule:sched}); next.total_sessions=PROGRAM_SESSIONS; }
    else if(updates.frequency){ const days=FREQ_DAYS[updates.frequency]||FREQ_DAYS[4]; const sched=generateScheduleDays(days); setSchedule(sched); persist(user?.id,{schedule:sched}); next.total_sessions=PROGRAM_SESSIONS; }
    setProfile(next);
    persist(user?.id,{profile:next});
    return (async()=>{ try{ const{error}=await supabase.from("profiles").upsert({id:user?.id,goal:next.goal,level:next.level,equipment:next.equipment,frequency:next.frequency,weight_kg:next.weight_kg,sex:next.sex,height_cm:next.height_cm,age:next.age,program_start:next.program_start,rms:next.rms,avatar:next.avatar,photos:next.photos,session_index:next.session_index,total_sessions:next.total_sessions,pinned_pbs:next.pinned_pbs,active_skills:next.active_skills,updated_at:new Date().toISOString()},{onConflict:"id"}); if(error)console.error("profile save",error.message); return {error}; }catch(e){ console.error("profile save",e); return {error:e}; } })();
  },[persist,user,profile]);
  useEffect(()=>{updateConfigRef.current=updateConfig;},[updateConfig]);
  useEffect(()=>{profileRef.current=profile;},[profile]);
  // Remise en accord du compteur stocke avec le nombre reel de seances. Sans
  // cela, l'accueil et la page profil continueraient d'annoncer l'ancienne
  // position tant qu'aucune seance n'est enregistree.
  useEffect(()=>{
    if(!user||!dataReady) return;
    if(!sessions) return;
    const start=profile&&profile.program_start;
    const real=start?sessions.filter(x=>x&&x.date>=start).length:sessions.length;
    if(profile&&Number(profile.session_index||0)!==real&&updateConfigRef.current){
      updateConfigRef.current({session_index:real});
    }
  },[sessions,profile,user,dataReady]);


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
      const durSec=(log[`${sDate}_${ex.id}_dur`]||{}).dur||0;
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
        ...(durSec>0?{durSec}:{}),
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
    // La sequence n'a plus besoin d'etre incrementee a la main : elle se deduit
    // du nombre de seances enregistrees, et l'effet de bord ci-dessous remet le
    // compteur stocke en accord. C'est cet increment manuel qui pouvait etre
    // ecrase par une ecriture concurrente et bloquer le programme.
    // 1. (l'ancien cache local des seances a disparu : la table sessions fait foi)
    const uid=user?.id;
    // 2. State React
    setSessions(prev=>{
      const next=[...prev.filter(s=>s.date!==sDate),entry];
      // Le 1RM estime est remis a jour et ENFIN ecrit dans profiles.rms, que le moteur lit
      // en priorite depuis toujours sans que rien ne l'alimente.
      try{
        const idx=rmIndex(next),rms={};
        Object.keys(idx).forEach(k=>{rms[k]=idx[k].kg;});
        if(updateConfigRef.current) updateConfigRef.current({rms});
      }catch(_e){}
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
          weight_kg:e.weight,reps:e.reps||8,one_rm:e1rmOf(e.weight,e.reps||8,e.rpe)||orm(e.weight,String(e.reps||8)),achieved_at:sDate
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
      <Wordmark h={30}/>
      <div style={{width:6,height:6,borderRadius:"50%",background:C.accent,animation:"pulse 1s ease-in-out infinite"}}/>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );

  if(!user) return <AuthScreen onAuth={u=>{setUser(u);loadUserData(u.id);}}/>;
  if(!dataReady) return(<div style={{position:"fixed",inset:0,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20,fontFamily:F}}><style>{"@keyframes p{0%,100%{opacity:.3}50%{opacity:1}}"}</style><Wordmark h={30}/><div style={{width:8,height:8,borderRadius:"50%",background:C.accent,animation:"p 1s ease-in-out infinite"}}/></div>);
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

  // Position dans la file = nombre de seances deja faites DEPUIS le debut du
  // programme. Les seances anterieures a program_start n'en font pas partie :
  // celle du 22 juin precedait le programme du 13 juillet et decalait tout d'un
  // cran si on la comptait.
  const sessionIndex=(()=>{
    const start=profile&&profile.program_start;
    if(!sessions) return profile?.session_index||0;
    return start?sessions.filter(x=>x&&x.date>=start).length:sessions.length;
  })();
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
  const isPastUndone=tabDate<todayKey()&&!isDayDone;
  // Le programme est une SEQUENCE de 60 seances, pas un calendrier. Une seance non faite
  // devait donc etre reportee jusqu'a etre executee. Or la seance en attente n'etait proposee
  // que si le planning de la semaine declarait ce jour comme un jour d'entrainement : rater
  // un lundi et se presenter un mardi de repos affichait "Recuperation", et la sequence
  // restait bloquee. On compte les creneaux prevus et deja passes qui n'ont pas ete honores.
  // Calcul simple et NON memoise : ce bloc se trouve apres les retours anticipes du
  // composant (authLoading, absence d'utilisateur, donnees non pretes). Un hook place ici
  // n'est appele que sur une partie des rendus, ce que React refuse - d'ou l'ecran blanc.
  const overdueCount=(()=>{
    const start=profile?.program_start; if(!start) return 0;
    const today=todayKey(); if(today<=start) return 0;
    // On compte les creneaux manques DEPUIS LA DERNIERE SEANCE, et non depuis le debut du
    // programme : un cumul depuis l'origine annoncerait "7 seances en retard" a quelqu'un
    // qui s'est entraine hier, ce qui n'a aucun sens et decourage sans rien apprendre.
    const last=(sessions||[]).map(x=>x.date).filter(x=>x<today).sort().pop()||start;
    let slots=0,guard=0;
    const d=new Date(last+"T00:00:00"); d.setDate(d.getDate()+1);
    const end=new Date(today+"T00:00:00");
    while(d<end&&guard++<400){
      const dow=(d.getDay()+6)%7;
      const dd=(schedule&&schedule[dow])||PROG_DEF[dow];
      if(dd&&dd.salle) slots++;
      d.setDate(d.getDate()+1);
    }
    return slots;
  })();
  const isLate=overdueCount>0;
  const engineCtx={frequency:trainingDaysPerWeek,rms:profile?.rms||{},perf,
    strength:patternStrength(profile?.rms||{}),scale:engineScale(profile),
    excluded,total:totalSessions};
  const pendingTemplate=(!programDone&&!isBeforeProgramStart)
    ?pendingSessionFor(profile?.goal||"hybride",sessionIndex,profile?.equipment,engineCtx):null;
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
  // Combien de creneaux d'entrainement separent aujourd'hui du jour affiche.
  // C'est ce nombre qui decale la file : rater un lundi ne change pas la seance
  // proposee mardi, il la repousse.
  const queueOffset=(targetIdx)=>{
    const ti=todayIdx();
    if(targetIdx<=ti) return 0;
    let n=0;
    for(let k=ti;k<targetIdx;k++){
      const d=viewSchedule[k]||PROGRAM[k];
      // Le creneau d'aujourd'hui ne compte que s'il reste a faire.
      if(k===ti){ if(d&&d.salle&&!sessions.some(x=>x.date===programDate(k))) n++; }
      else if(d&&d.salle) n++;
    }
    return n;
  };
  const sessionFromQueue=(idx,rawDay)=>{
    const tpl=(!programDone&&!isBeforeProgramStart)
      ?pendingSessionFor(profile?.goal||"hybride",sessionIndex+idx,profile?.equipment,engineCtx):null;
    if(!tpl) return rawDay;
    let c={...tpl,day:rawDay?.day};
    if(profile?.equipment?.length) c=adaptEquip(c,profile.equipment);
    return personalizeDay(c,profile,sessionWeek,perf);
  };
  const day0=resolveDay({
    rawDay:rawDay0, doneDay, beforeStart:isBeforeProgramStart, past:isPastUndone,
    queueSession:()=>sessionFromQueue(queueOffset(dayIdx),rawDay0),
  });
  // Seance "aujourd'hui" pour la page Accueil : DOIT utiliser la meme logique de sequence que day0 ci-dessus,
  // independamment de l'onglet jour actuellement affiche (dayIdx peut pointer vers un autre jour que aujourd'hui).
  const todaySessionForHome=(()=>{
    const trIdx=todayIdx();
    const trRaw=viewSchedule[trIdx]||PROGRAM[trIdx];
    const trDate=programDate(trIdx);
    const trBeforeStart=!!(profile?.program_start&&trDate<profile.program_start);
    if(trBeforeStart) return {...REST_TPL,day:trRaw?.day};
    // Meme regle que l'onglet Seance : un jour desactive n'a pas de seance.
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
  // Echauffement, gainage et apprentissage etaient du texte : on ne pouvait ni les
  // ouvrir, ni les cocher, ni voir qu'ils etaient faits. Ils deviennent des exercices
  // a part entiere, dans la meme liste que les autres, donc lisibles par le meme
  // lecteur. Ils restent apres les exercices principaux pour ne pas decaler les index
  // deja utilises par les blocs, les supersets et les circuits.
  // Position reelle de chaque exercice : le lecteur affichait son rang dans la liste
  // brute, qui sert a le retrouver, et ignorait completement le decoupage en blocs.
  const mainBlocks=(day&&!day.metcon)?groupBlocks(exos,effMode):[];
  const blockOf={};
  mainBlocks.forEach((blk,bi)=>blk.items.forEach(({idx},k)=>{
    blockOf[idx]={no:bi+1,total:mainBlocks.length,pos:k+1,len:blk.items.length};}));
  const warmExos=day?.salle?warmupExos(day.salle):[];
  const absAsExos=absExos.map(absExo);
  const skillPairs=(day?.salle&&(profile?.active_skills||[]).length&&sessionIndex%2===0)
    ?(profile.active_skills.map(as=>{const sk=SKILLS_CATALOG.find(x=>x.id===as.skillId);
        if(!sk) return null; const st=sk.steps[as.stepIndex]||sk.steps[sk.steps.length-1];
        return {as,sk,step:st,ex:skillExo(sk,st)};}).filter(Boolean)):[];
  const auxExos=warmExos.concat(absAsExos,skillPairs.map(x=>x.ex));
  const focusList=exos.concat(auxExos);
  const WARM_OFF=exos.length, ABS_OFF=WARM_OFF+warmExos.length, SKILL_OFF=ABS_OFF+absAsExos.length;
  // Un bloc auxiliaire est termine quand chacune de ses lignes a ses series enregistrees.
  const auxDone=(list)=>list.length>0&&list.every(ex=>{
    const tgt=setPlanFor(ex).length;
    const c=Object.keys(log||{}).reduce((a,k)=>(k.indexOf(`${sDate}_${ex.id}_s`)===0&&log[k]&&log[k].done)?a+1:a,0);
    return tgt>0&&c>=tgt;
  });
const NAV=[{id:"home",l:"Accueil"},{id:"seance",l:"Séances"},{id:"stats",l:"Stats"},{id:"settings",l:"Profil"}];

  return(
    <div style={{background:C.bg,minHeight:"100dvh",color:C.ink,fontFamily:F,overflowX:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;}
        /* Un champ de saisie doit rester selectionnable : la regle universelle
           ci-dessus lui interdisait le curseur sur iOS Safari. */
        input,textarea,select{user-select:text;-webkit-user-select:text;}
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
        @keyframes cardIn{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:none}}
        /* Entree en cascade des cartes a chaque changement d'onglet : les elements arrivent
           l'un apres l'autre au lieu d'apparaitre d'un bloc. */
        .tabin>*{animation:cardIn 460ms cubic-bezier(.23,1,.32,1) both}
        .tabin>*:nth-child(1){animation-delay:10ms}   .tabin>*:nth-child(2){animation-delay:55ms}
        .tabin>*:nth-child(3){animation-delay:100ms}  .tabin>*:nth-child(4){animation-delay:145ms}
        .tabin>*:nth-child(5){animation-delay:185ms}  .tabin>*:nth-child(6){animation-delay:220ms}
        .tabin>*:nth-child(7){animation-delay:250ms}  .tabin>*:nth-child(8){animation-delay:275ms}
        .tabin>*:nth-child(n+9){animation-delay:300ms}
        .themed{transition:background-color 280ms cubic-bezier(.23,1,.32,1),color 280ms cubic-bezier(.23,1,.32,1)}
        /* Responsive : jamais de debordement horizontal, quelle que soit la largeur, et un
           peu plus d'air sur les grands ecrans sans casser la lecture en colonne. */
        html,body{overflow-x:hidden;max-width:100%}
        img,svg{max-width:100%}
        @media (min-width:820px){ .tabin{padding-inline:8px} }
        @media (max-width:340px){
          .tabin{font-size:.96em}
        }
        [role="button"]:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{
          outline:2px solid ${C.ink};outline-offset:3px;border-radius:10px}
        [role="button"]:focus:not(:focus-visible){outline:none}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        textarea::placeholder,input::placeholder{color:${C.ink4};}
        ::-webkit-scrollbar{display:none;}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      {/* TOP BAR */}
      <div style={{background:C.bg,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:Z.sticky}}>
        <div style={{maxWidth:600,margin:"0 auto",padding:`calc(14px + env(safe-area-inset-top)) 18px 10px`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
          <div>
            <Wordmark h={19}/>
            <div style={{fontSize:10,fontWeight:600,color:C.ink4,letterSpacing:".16em",textTransform:"uppercase"}}>{"S"+wk+" · "}{user?.user_metadata?.name||"Athlète"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {pending>0&&<span title="Enregistrement en attente de réseau" style={{fontSize:11.5,fontWeight:600,color:C.ink3,background:C.s2,padding:"3px 10px",borderRadius:999,marginRight:8}}>⟳ {pending}</span>}
            {sessionActive&&(clock.running||clock.sec>0)&&<span style={{fontSize:15,fontWeight:600,color:C.alert}}>{fmtDur(clock.sec)}</span>}
            {streak>0&&<span style={{fontSize:12.5,fontWeight:600,color:C.ink,padding:"4px 12px",borderRadius:999,background:C.s2}}>{streak}j</span>}
            {sbReady&&<div style={{width:6,height:6,borderRadius:"50%",background:C.done}}/>}
          </div>
        </div>
      </div>

      {/* DAY STRIP */}
      {tab==="seance"&&(
        <div style={{background:C.bg}}>
        <div style={{maxWidth:600,margin:"0 auto",display:"flex",overflowX:"auto",padding:"2px 18px 12px",gap:6,scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
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
            // Trois etats distincts etaient confondus : la barre ne montrait qu'une coche
            // pour le fait et un point pour aujourd'hui. Une echeance passee sans seance
            // n'etait signalee nulle part, alors que c'est l'information qui doit alerter.
            const isPastDay=dStrDate<todayKey();
            const wasPlanned=!!(d&&d.salle);
            const isMissed=isPastDay&&wasPlanned&&!dayFullyDone&&(!profile?.program_start||dStrDate>=profile.program_start);
            return(
              <Tap key={i} label={d.day} onTap={()=>{setDayIdx(i);setAiOverride(null);setDayCons(null);setModeOverride(null);setCircuitStart(0);setSupBlock(null);}} style={{flex:"1 1 0",minWidth:42,padding:"9px 4px",textAlign:"center",borderRadius:22,background:isSel?C.accentSoft:"transparent",border:`1px solid ${isSel?C.accent:"transparent"}`,transition:`all 220ms ${EO}`}}>
                <div style={{fontSize:10,fontWeight:600,color:isSel?C.ink2:C.ink4,letterSpacing:".06em",marginBottom:4}}>{d.day}</div>
                {isToday&&!dayFullyDone&&<div style={{width:6,height:6,borderRadius:"50%",background:C.accent,margin:"0 auto 4px"}}/>}

                {dayFullyDone?(
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={accent||C.done} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{margin:"0 auto",display:"block"}}><path d="M20 6L9 17l-5-5"/></svg>
                ):isMissed?(
                  // La fleche de rattrapage, redessinee dans le jeu unifie : elle disait
                  // que la seance n'est pas perdue mais reportee, ce qu'un anneau creux
                  // ne dit pas. Le caractere brut, lui, se lisait comme un tilde.
                  <span title="Séance manquée — reportée" style={{display:"flex",justifyContent:"center"}}>
                    <Icon name="swap" size={13} stroke={C.ink4} sw={1.8}/></span>
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
      <div style={{paddingBottom:104}}>
        <TabContent tab={tab} prevTab={prevTab}>
          {tab==="home"&&<HomeTab profile={profile} streak={streak} sessions={sessions} weights={weights} todaySession={todaySessionForHome} accent={accent} trainingDaysPerWeek={trainingDaysPerWeek} weighIns={weighIns} onStartToday={()=>{setDayIdx(todayIdx());switchTab("seance");}}/>}
          {tab==="seance"&&(
            <div style={{padding:"14px 18px 0",maxWidth:600,margin:"0 auto"}}>
              {isRest?(
                <div style={{textAlign:"center",padding:"80px 20px"}}>
                  <div style={{fontSize:34,fontWeight:600,color:C.ink4,letterSpacing:"-.02em",marginBottom:14}}>Récupération</div>
                  <div style={{fontSize:15,color:C.ink4,lineHeight:1.65,maxWidth:300,margin:"0 auto 28px"}}>{dayIdx===3?"Récupération active. Tes fibres consolident.":"Reset total. Synthèse protéique prioritaire."}</div>
                  <Tap onTap={()=>setShowSettings(true)} style={{display:"inline-flex",padding:"13px 24px",borderRadius:999,border:`1px solid ${C.div}`,background:"transparent"}}>
                    <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>Générer une séance légère</span>
                  </Tap>
                </div>
              ):(
                <>
                  {/* En-tete de seance en carte, comme l'accueil : le titre flottait
                      jusqu'ici directement sur le fond, sans surface qui le porte. */}
                  <div style={{background:C.card,border:`1px solid ${C.s2}`,borderRadius:22,padding:"16px",
                               boxShadow:`0 3px 16px ${C.ink5}`,marginBottom:14}}>
                    <div style={{fontSize:11.5,fontWeight:500,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:8}}>{day.day} · {"S"+wk} · {day.salle==="haut"?"Salle Haute":"Salle Basse"}{totalSessions>0&&day.salle&&` · Séance ${Math.min(sessionIndex+1,totalSessions)}/${totalSessions}`}</div>
                    <div style={{fontSize:34,fontWeight:500,color:C.ink,letterSpacing:"-.03em",lineHeight:1.1,marginBottom:6}}>{aiOverride?.titre||day.label}</div>
                    <div style={{fontSize:14,color:C.ink3}}>{day.muscle}</div>
                    {day.salle&&(()=>{const pw=sessionWeek;const ph12=PHASES12[pw-1];const pend=progEndDate(profile?.program_start);return(
                      <div style={{marginTop:14,padding:"13px 15px",borderRadius:22,background:C.s1}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <span style={{fontSize:11.5,fontWeight:600,color:C.accent,textTransform:"uppercase",letterSpacing:".06em"}}>Cycle 12 sem · S{pw}/12</span>
                          <span style={{fontSize:11.5,fontWeight:600,color:C.ink3}}>{ph12.n}</span>
                        </div>
                        <div style={{height:6,borderRadius:999,background:C.s4,overflow:"hidden"}}><div style={{height:"100%",width:`${pw/12*100}%`,background:C.accent,borderRadius:999}}/></div>
                        {profile?.program_start&&<div style={{fontSize:11.5,color:C.ink4,marginTop:8}}>Programme : {fmtDateShort(profile.program_start)} → {fmtDateShort(pend)}</div>}
                        {autoRotate&&<div style={{fontSize:11.5,color:C.ink4,marginTop:6}}>{ph12.f} · phase {phaseOf(pw).k}</div>}
                      </div>);})()}
                  </div>
                  {!sessionActive?(
                    <div style={{display:"flex",gap:10,marginBottom:24}}>
                      {isDayDone?(
                        <Tap onTap={()=>doneSession&&setShowReport(doneSession)} style={{flex:1,padding:"16px",borderRadius:12,background:C.doneSoft,border:`1px solid ${C.done}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                          <span style={{fontSize:15,fontWeight:600,color:C.done}}>Séance terminée ✓</span>
                          <span style={{fontSize:11.5,fontWeight:600,color:C.done}}>Voir le rapport →</span>
                        </Tap>
                      ):isPastMissed?null:(
                        <Tap label="Démarrer la séance" onTap={()=>{setSessionActive(true);if(!clock.running&&clock.sec===0)clock.start();}}
                          style={{flex:1,padding:"16px",borderRadius:22,background:C.fill,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                          <Icon name="play" size={16} stroke={C.bg} fill={C.bg}/>
                          <span style={{fontSize:15,fontWeight:600,color:C.bg}}>Démarrer la séance</span>
                        </Tap>
                      )}
                      <Tap onTap={()=>setShowSettings(true)} style={{padding:"16px",borderRadius:12,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:14,fontWeight:600,color:C.ink3}}>Réglages</span>
                      </Tap>
                    </div>
                  ):(
                    <div style={{display:"flex",gap:10,marginBottom:24}}>
                      <Tap onTap={()=>{if(clock.running){clock.stop();}else if(clock.sec>0){clock.resume();}else{clock.start();}}} style={{flex:1,padding:"16px",borderRadius:12,background:clock.running?C.alertSoft:C.s2,border:`1px solid ${clock.running?C.alert:C.div}`,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        <span style={{fontSize:12.5}}>{clock.running?"⏸":"▶"}</span>
                        <span style={{fontSize:15,fontWeight:600,color:clock.running?C.alert:C.ink2}}>{clock.sec>0||clock.running?fmtDur(clock.sec):"Chrono"}</span>
                      </Tap>
                      <Tap onTap={()=>{clock.stop();setShowFeedback(true);}} style={{flex:2,padding:"16px",borderRadius:12,background:C.accent,border:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>Fin de séance</span>
                      </Tap>
                      <Tap onTap={()=>setShowSettings(true)} style={{padding:"16px",borderRadius:12,border:`1px solid ${C.div}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:12.5,fontWeight:600,color:C.ink3}}>Réglages</span>
                      </Tap>
                    </div>
                  )}
                  {/* L'echauffement etait une liste de texte : meme carte, mais on ne
                      pouvait rien y faire. Il devient un bloc d'exercices comme les autres,
                      lignes ouvrables et cochables comprises. */}
                  {warmExos.length>0&&(()=>{
                    const wDone=auxDone(warmExos);
                    return(
                    <div style={{background:C.bg,border:`1px solid ${wDone?C.done:C.s2}`,borderRadius:22,
                      padding:"16px",marginBottom:10,boxShadow:`0 3px 16px ${C.ink5}`,
                      transition:`border-color 260ms ${EO}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:4}}>
                        <span style={{fontSize:11.5,fontWeight:500,color:C.ink4}}>Bloc échauffement</span>
                        <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,whiteSpace:"nowrap",
                          background:wDone?C.doneSoft:C.s2,color:wDone?C.done:C.ink3}}>
                          {wDone?"terminé":`${Math.round(WARMUP_SEC/60)} min`}</span>
                      </div>
                      {warmExos.map((ex,k)=>(
                        <ExerciseRowCollapsed key={ex.id} ex={ex} idx={k} first={k===0} barColor={C.s4}
                          dayIdx={dayIdx} sDate={sDate} log={log} doneSession={doneSession}
                          onOpen={()=>{if(!locked)setFocusIdx(WARM_OFF+k);}} onOriginY={setFocusOrigin}/>
                      ))}
                    </div>);
                  })()}
                  {/* L'apprentissage etait un encart a part : titre, objectif en texte et
                      deux boutons de verdict. Il devient un bloc de seance — la ligne s'ouvre
                      et se coche comme un exercice — et le verdict reste, car c'est lui qui
                      fait avancer l'etape. */}
                  {skillPairs.length>0&&skillPairs.map(({as,sk,step,ex},k)=>{
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
                      play(success?"cloche":"clic");buzz(40);
                    };
                    return(
                    <div key={as.skillId} style={{background:C.bg,
                      border:`1px solid ${doneToday?C.done:C.s2}`,borderRadius:22,padding:"16px",
                      marginBottom:10,boxShadow:`0 3px 16px ${C.ink5}`,transition:`border-color 260ms ${EO}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:4}}>
                        <span style={{fontSize:11.5,fontWeight:500,color:C.ink4}}>Bloc apprentissage · {sk.name}</span>
                        <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,whiteSpace:"nowrap",
                          background:doneToday?C.doneSoft:C.s2,color:doneToday?C.done:C.ink3}}>
                          {doneToday?"validé":`étape ${as.stepIndex+1}/${sk.steps.length}`}</span>
                      </div>
                      <ExerciseRowCollapsed ex={ex} idx={0} first barColor={C.accent}
                        dayIdx={dayIdx} sDate={sDate} log={log} doneSession={doneSession}
                        onOpen={()=>{if(!locked)setFocusIdx(SKILL_OFF+k);}} onOriginY={setFocusOrigin}/>
                      {!locked&&(doneToday?(
                        <div style={{marginTop:9,fontSize:11.5,fontWeight:600,color:C.done}}>Validé aujourd'hui</div>
                      ):(
                        <div style={{display:"flex",gap:8,marginTop:11}}>
                          <Tap label="Pas encore acquis" onTap={()=>assess(false)}
                            style={{flex:1,padding:"11px",borderRadius:12,background:C.bg,border:`1px solid ${C.s3}`,
                              display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:12.5,fontWeight:600,color:C.ink3}}>Pas encore</span></Tap>
                          <Tap label="Étape acquise" onTap={()=>assess(true)}
                            style={{flex:1,padding:"11px",borderRadius:12,background:C.accent,
                              display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:12.5,fontWeight:600,color:C.onAccent}}>Ça passe</span></Tap>
                        </div>
                      ))}
                    </div>);
                  })}
                  {isViewingToday&&isLate&&!isDayDone&&(
                    <div style={{background:C.s2,border:`1px solid ${C.s4}`,borderRadius:12,padding:"12px 15px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
                      <Icon name="swap" size={17} stroke={C.ink}/>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:C.ink}}>Reprise du programme</div>
                        <div style={{fontSize:11.5,color:C.ink3,marginTop:1}}>
                          Voici la prochaine séance, à sa place dans la séquence.
                        </div>
                      </div>
                    </div>
                  )}
                  {day.salle&&<div style={{marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:sessionMode==="classique"?0:10}}><span style={{fontSize:11.5,fontWeight:600,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>Séance du jour</span><span style={{fontSize:11.5,fontWeight:600,color:C.onAccent,background:C.accent,padding:"2px 9px",borderRadius:12,textTransform:"uppercase",letterSpacing:".06em"}}>{modeLabel}</span></div>
                    {sessionMode!=="classique"&&!locked&&<Tap onTap={()=>setShowCircuit(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"16px",borderRadius:12,background:C.accentSoft,border:`1px solid ${C.accent}`}}><span style={{fontSize:15}}>⏱</span><span style={{fontSize:15,fontWeight:600,color:C.accent}}>Démarrer le circuit {sessionMode==="amrap"?"AMRAP":"EMOM"}</span></Tap>}
                  </div>}
                  <div>
                    {day.metcon&&!locked&&<div style={{marginBottom:16}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:12.5,fontWeight:600,color:C.ink}}>Séance {sessionMode==="amrap"?"AMRAP":"EMOM"} · {day.blocks.length} blocs</span><span style={{fontSize:12.5,fontWeight:600,color:C.onAccent,background:C.accent,padding:"2px 10px",borderRadius:12}}>~{day.totalMin} min</span></div><div style={{fontSize:11.5,color:C.ink4,marginBottom:10}}>Touchez un bloc pour le démarrer</div>{day.blocks.map((bl,bi)=>(<Tap key={bi} onTap={()=>{if(locked)return;setCircuitStart(bi);setShowCircuit(true);}} style={{marginBottom:10,background:C.s1,borderRadius:22,padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:14,fontWeight:600,color:C.ink}}>{bl.label}</span><span style={{fontSize:11.5,fontWeight:600,color:C.ink3}}>{bl.kind==="emom"?bl.durationMin+" min · "+bl.rounds+" tours":bl.durationMin+" min"}</span></div>{bl.exercises.map((ex,ei)=>(<div key={ei} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderTop:ei?`1px solid ${C.s2}`:"none"}}><span style={{fontSize:14,color:C.ink2}}>{bl.kind==="emom"?("Min "+(ei+1)+" · "):""}{ex.n}</span><span style={{fontSize:12.5,fontWeight:600,color:C.ink3}}>{ex.kg>0?ex.kg+"kg · ":""}{ex.reps}{bl.kind==="emom"?"/min":"/tour"}</span></div>))}</Tap>))}</div>}
                    {!day.metcon&&mainBlocks.map((blk,bi)=>{
                      // Une CARTE par bloc, comme la maquette : en-tete "Bloc N · type",
                      // pastille de tours ou mention Lourd, puis les exercices en lignes
                      // filetees. Avant, chaque exercice etait sa propre carte grise et le
                      // bloc n'existait que sous forme d'un titre et d'un trait vertical.
                      const first=blk.items[0]&&blk.items[0].ex;
                      const heavy=first&&metaOf(first).tier==="lourd";
                      const isGroup=!!blk.groupType&&blk.groupType!=="amrap"&&blk.groupType!=="emom";
                      const tours=first?((first.groupTours>0)?first.groupTours:((typeof first.sets==="number"&&first.sets>0)?first.sets:4)):4;
                      const kind=blk.groupType==="circuit"?"circuit":blk.groupType==="superset"?"superset"
                        :blk.groupType==="amrap"?"AMRAP":blk.groupType==="emom"?"EMOM":"série droite";
                      const BAR=[C.ink,C.accent,C.ink3,C.s4];
                      const barColor=heavy?C.ink:BAR[(bi+1)%BAR.length];
                      const done=blk.items.every(({ex})=>{
                        const sv=doneSession?(doneSession.exercises||[]).find(e=>e.id===ex.id):null;
                        if(sv) return true;
                        const tgt=(ex.groupTours>0)?ex.groupTours:setPlanFor(ex).length;
                        const c=Object.keys(log||{}).reduce((a,k)=>(k.indexOf(`${sDate}_${ex.id}_s`)===0&&log[k]&&log[k].done)?a+1:a,0);
                        return tgt>0&&c>=tgt;
                      });
                      return (
                      <div key={bi} style={{background:C.bg,border:`1px solid ${done?C.done:C.s2}`,borderRadius:22,
                        padding:"16px",marginBottom:10,boxShadow:`0 3px 16px ${C.ink5}`,transition:`border-color 260ms ${EO}`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:4}}>
                          <span style={{fontSize:11.5,fontWeight:500,color:C.ink4}}>Bloc {bi+1} · {kind}</span>
                          <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,whiteSpace:"nowrap",
                            background:done?C.doneSoft:(heavy?C.accentSoft:C.s2),color:done?C.done:C.ink3}}>
                            {done?"terminé":heavy?"lourd":isGroup?`${tours} tours`:`${tours} séries`}
                          </span>
                        </div>
                        {blk.items.map(({ex,idx},k)=>(
                          <ExerciseRowCollapsed key={ex.id} ex={ex} idx={k} first={k===0} barColor={barColor} grouped={isGroup&&k<blk.items.length-1}
                            dayIdx={dayIdx} sDate={sDate} log={log} doneSession={doneSession}
                            onOpen={()=>{if(locked)return;if(sessionMode!=="classique"){setShowCircuit(true);return;}const _e=exos[idx];if(_e&&_e.circuitId){const _g=exos.filter(e=>e.circuitId===_e.circuitId);setSupBlock({label:_e.m||"Superset",kind:_g.length>=3?"circuit":"superset",exercises:_g,restSec:(_g[0]&&_g[0].groupRest)||90,tours:(_g[0]&&(_g[0].groupTours||_g[0].sets))||4,no:bi+1,total:mainBlocks.length});}else{setFocusIdx(idx);}}}
                            onReplace={locked?null:(e)=>setShowPicker(e)} onOriginY={setFocusOrigin}/>
                        ))}
                        {isGroup&&!locked&&!done&&<Tap label={`Démarrer le ${kind}`}
                          onTap={()=>setSupBlock({label:blk.muscle,kind:blk.groupType==="circuit"?"circuit":"superset",exercises:blk.items.map(x=>x.ex),restSec:(blk.items[0]&&blk.items[0].ex&&blk.items[0].ex.groupRest)||90,tours,no:bi+1,total:mainBlocks.length})}
                          style={{marginTop:11,padding:"11px",borderRadius:12,background:C.accentSoft,border:`1px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                          <Icon name="play" size={14} stroke={C.ink} fill={C.ink}/>
                          <span style={{fontSize:12.5,fontWeight:600,color:C.ink}}>Démarrer le {kind}</span></Tap>}
                      </div>);
                    })}
                  </div>
                  {/* Les abdominaux etaient une liste de texte a droite de laquelle on
                      lisait "4×6" sans jamais pouvoir l'ouvrir ni la valider. */}
                  {absAsExos.length>0&&(()=>{
                    const aDone=auxDone(absAsExos);
                    return(
                    <div style={{background:C.bg,border:`1px solid ${aDone?C.done:C.s2}`,borderRadius:22,
                      padding:"16px",marginBottom:10,boxShadow:`0 3px 16px ${C.ink5}`,
                      transition:`border-color 260ms ${EO}`}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:4}}>
                        <span style={{fontSize:11.5,fontWeight:500,color:C.ink4}}>Bloc gainage · abdominaux</span>
                        <span style={{fontSize:10,fontWeight:600,padding:"4px 11px",borderRadius:999,whiteSpace:"nowrap",
                          background:aDone?C.doneSoft:C.s2,color:aDone?C.done:C.ink3}}>
                          {aDone?"terminé":`${absAsExos.length} exercice${absAsExos.length>1?"s":""}`}</span>
                      </div>
                      {absAsExos.map((ex,k)=>(
                        <ExerciseRowCollapsed key={ex.id} ex={ex} idx={k} first={k===0} barColor={C.s4}
                          dayIdx={dayIdx} sDate={sDate} log={log} doneSession={doneSession}
                          onOpen={()=>{if(!locked)setFocusIdx(ABS_OFF+k);}} onOriginY={setFocusOrigin}/>
                      ))}
                    </div>);
                  })()}
                  {!sessionActive&&!locked&&(
                    <Tap onTap={()=>setShowFeedback(true)} style={{marginTop:28,marginBottom:16,padding:"16px",borderRadius:12,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:15,fontWeight:600,color:C.onAccent}}>Fin de séance</span>
                    </Tap>
                  )}
                </>
              )}
            </div>
          )}
          {tab==="stats"&&<StatsTab sessions={sessions} weights={weights} accent={accent} trainingDaysPerWeek={trainingDaysPerWeek} profile={profile} weighIns={weighIns} onSaveWeighIn={saveWeighIn} onOpenPhotos={()=>setShowPhotos(true)} photos={photos} photoUrls={photoUrls} pinnedPBs={profile?.pinned_pbs} onManagePBs={()=>setShowPBManager(true)} activeSkills={profile?.active_skills} onManageSkills={()=>setShowSkillManager(true)} onOpenRewards={()=>setShowRewardsManager(true)}><HistoryTab sessions={sessions} onSelect={setShowReport} accent={accent}/></StatsTab>}
          {tab==="settings"&&<SettingsTab progDone={sessionIndex} user={user} excluded={excluded} onToggleExclude={toggleExclude} onOpenLibrary={()=>setShowLibrary(true)} profile={profile} schedule={schedule} avatarUrl={avatarUrl} onUpdateConfig={updateConfig} onOpenScheduleEditor={()=>setShowSched(true)} onRedoOnboarding={()=>setShowOnboardingRedo(true)}
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
      {focusIdx!=null&&focusList[focusIdx]&&(()=>{
        const seg=(focusIdx<WARM_OFF)?[0,WARM_OFF]
          :(focusIdx<ABS_OFF)?[WARM_OFF,ABS_OFF]
          :(focusIdx<SKILL_OFF)?[ABS_OFF,SKILL_OFF]:[SKILL_OFF,focusList.length];
        // L'en-tete situe l'exercice la ou l'oeil le cherche : dans son bloc.
        const _b=blockOf[focusIdx];
        const heading=(focusIdx<WARM_OFF)
          ?(_b?`Bloc ${_b.no}/${_b.total} · Exercice ${_b.pos}/${_b.len}`:`Exercice ${focusIdx+1}/${exos.length}`)
          :(focusIdx<ABS_OFF)?`Échauffement · ${focusIdx-WARM_OFF+1}/${warmExos.length}`
          :(focusIdx<SKILL_OFF)?`Gainage · ${focusIdx-ABS_OFF+1}/${absAsExos.length}`
          :`Apprentissage · ${focusIdx-SKILL_OFF+1}/${skillPairs.length}`;
        return (
        <ExerciseFocus key={focusList[focusIdx].id} ex={focusList[focusIdx]} idx={focusIdx-seg[0]} count={seg[1]-seg[0]} dayIdx={dayIdx} sDate={sDate}
          log={log} onLogSet={saveLog} heading={heading} onDetail={e=>setDetailEx(e)} lastPerf={perf[focusList[focusIdx].id]} originY={focusOrigin}
          onClose={()=>setFocusIdx(null)} hasNext={focusIdx<seg[1]-1} onNext={()=>{
            const _n=focusList[focusIdx+1];
            if(_n&&_n.circuitId){
              const _g=exos.filter(e=>e.circuitId===_n.circuitId);
              setFocusIdx(null);
              const _b=blockOf[focusIdx+1];
              setSupBlock({label:_n.m||"Superset",kind:_g.length>=3?"circuit":"superset",exercises:_g,restSec:(_g[0]&&_g[0].groupRest)||90,tours:(_g[0]&&(_g[0].groupTours||_g[0].sets))||4,no:_b&&_b.no,total:_b&&_b.total});
            }else{
              setFocusIdx(focusIdx+1);
            }
          }}/>);
      })()}
      {supBlock&&<CircuitPlayer mode={supBlock.kind} exos={supBlock.exercises} blocks={[supBlock]} blockNo={supBlock.no} blockCount={supBlock.total} onClose={()=>setSupBlock(null)} onAllDone={()=>{}} log={log} onLogSet={saveLog} sDate={sDate}/>}
      {showCircuit&&sessionMode!=="classique"&&exos.length>0&&(
        <CircuitPlayer mode={sessionMode} exos={exos} blocks={day.blocks} defMin={sessionMode==="amrap"?(day.timeCapMin||12):(day.emomMinutes||Math.max(exos.length,8))} onClose={()=>setShowCircuit(false)} onAllDone={()=>{clock.stop();setShowFeedback(true);}} startBlock={circuitStart} log={log} onLogSet={saveLog} sDate={sDate}/>
      )}

      {/* BOTTOM NAV */}
      {/* Barre flottante : elle etait collee au bord bas, pleine largeur et separee du contenu
          par un filet. Elle devient une pastille posee SUR la page, dans le meme langage de
          cartes que le reste, avec l'onglet actif en carre sombre. */}
      <div style={{position:"fixed",left:0,right:0,bottom:0,zIndex:Z.sticky+10,display:"flex",justifyContent:"center",
                   padding:"0 18px calc(14px + env(safe-area-inset-bottom))",pointerEvents:"none"}}>
        <div style={{pointerEvents:"auto",display:"flex",gap:4,padding:6,borderRadius:22,width:"100%",maxWidth:600,
                     background:C.scrim,
                     backdropFilter:"blur(22px)",WebkitBackdropFilter:"blur(22px)",
                     border:`1px solid ${C.s2}`,boxShadow:`0 10px 30px ${C.ink5}`}}>
        {NAV.map(({id,l})=>{
          const on=tab===id;
          return (
          <Tap key={id} label={l} onTap={()=>switchTab(id)}
            style={{flex:1,height:46,borderRadius:22,display:"flex",alignItems:"center",justifyContent:"center",
                    background:on?C.ink:"transparent",transition:`background 240ms ${EO}`}}>
            <Icon name={id} size={21} stroke={on?C.bg:C.ink4} sw={on?1.8:1.6}
                  style={{transition:`stroke 220ms ${EO}`}} title={l}/>
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
      {/* Alertes : jusqu'ici tout echec partait dans la console et l'utilisateur n'en savait rien. */}
      {toasts.length>0&&(
        <div role="status" aria-live="polite" style={{position:"fixed",left:0,right:0,bottom:"calc(78px + env(safe-area-inset-bottom))",zIndex:Z.fullscreen+200,display:"flex",flexDirection:"column",alignItems:"center",gap:8,pointerEvents:"none",padding:"0 20px"}}>
          {toasts.map(t=>(
            <div key={t.id} style={{maxWidth:560,width:"100%",background:C.fill,color:C.onFill,borderRadius:12,padding:"16px",fontSize:14,fontWeight:600,fontFamily:F,boxShadow:"0 10px 30px rgba(0,0,0,.22)",animation:`riseIn 260ms ${EO} both`}}>
              {t.msg}
            </div>
          ))}
        </div>
      )}
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

































