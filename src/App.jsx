import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const sb = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;
const USER_ID = "mascaptain";

// ─── DESIGN TOKENS — Apple dark system ───────────────────────────────────────
// SF Pro Display · system-ui · -apple-system
// One accent: #2997FF (Apple blue on dark). Used ONLY on interactive primary.
// No border-left accents. No decorative gradients. No shadows on chrome.
// Touch targets: 64px for workout actions, 44px for navigation.
const C = {
  bg:        "#000000",
  s1:        "#0A0A0A",   // surface 1
  s2:        "#111111",   // surface 2
  s3:        "#1C1C1E",   // surface 3 — iOS system grouped
  s4:        "#2C2C2E",   // surface 4
  div:       "#38383A",   // divider
  div2:      "#48484A",   // divider strong
  ink:       "#FFFFFF",
  ink2:      "rgba(255,255,255,.86)",
  ink3:      "rgba(255,255,255,.60)",
  ink4:      "rgba(255,255,255,.36)",
  ink5:      "rgba(255,255,255,.18)",
  blue:      "#2997FF",   // Apple blue on dark — PRIMARY ACCENT
  blueDim:   "rgba(41,151,255,.16)",
  green:     "#30D158",
  greenDim:  "rgba(48,209,88,.14)",
  red:       "#FF453A",
  redDim:    "rgba(255,69,58,.14)",
  orange:    "#FF9F0A",
  orangeDim: "rgba(255,159,10,.14)",
  lime:      "#A3E635",   // SŌMA brand — ONE use: active day indicator
  yellow:    "#FFD60A",
};
const F = "system-ui,-apple-system,'SF Pro Display',sans-serif";

// Emil: specific cubic-bezier, never `ease`, never `all`
const E1 = "cubic-bezier(0.25,0.46,0.45,0.94)";   // ease-out-quart
const E2 = "cubic-bezier(0.32,0.72,0,1)";          // drawer/sheet
const E3 = "cubic-bezier(0.23,1,0.32,1)";          // spring-ish

// ─── EXERCISE DATABASE ────────────────────────────────────────────────────────
const DB = [
  // KETTLEBELL
  {id:"kb01",name:"Swing KB deux mains",m:"Fessiers · Ischios",eq:"kb",kg:20,reps:"15",rest:60,cue:"Poussée de hanches explosive. Dos neutre. KB monte à hauteur d'épaules."},
  {id:"kb02",name:"Swing KB unilatéral",m:"Fessiers · Core",eq:"kb",kg:16,reps:"10",rest:60,cue:"Même mécanique. Résiste à la rotation du tronc."},
  {id:"kb03",name:"Clean KB",m:"Full body",eq:"kb",kg:16,reps:"8",rest:90,cue:"KB tracte sur le côté. Vient se loger en rack sans impact au poignet."},
  {id:"kb04",name:"Clean & Press KB",m:"Épaules · Full body",eq:"kb",kg:14,reps:"6",rest:120,cue:"Clean + press vertical. Core serré à la poussée."},
  {id:"kb05",name:"Push Press KB",m:"Épaules · Jambes",eq:"kb",kg:16,reps:"8",rest:90,cue:"Légère impulsion jambes, bras verrouillé en haut. Descente lente."},
  {id:"kb06",name:"Snatch KB",m:"Full body",eq:"kb",kg:12,reps:"5",rest:120,cue:"Du sol au lockout en un geste. Punch vers le haut en fin de trajectoire."},
  {id:"kb07",name:"Turkish Get-Up",m:"Full body · Core",eq:"kb",kg:12,reps:"3",rest:120,cue:"KB verrouillé bras tendu tout le long. 7 étapes. Lent et contrôlé."},
  {id:"kb08",name:"Gobelet Squat KB",m:"Quads · Fessiers",eq:"kb",kg:20,reps:"12",rest:90,cue:"KB contre la poitrine. Coudes entre les genoux en bas. Sous la parallèle."},
  {id:"kb09",name:"Halo KB",m:"Épaules · Core",eq:"kb",kg:10,reps:"10",rest:60,cue:"Orbite complète autour de la tête. Core anti-rotation."},
  {id:"kb10",name:"Farmer Carry KB",m:"Trapèzes · Core",eq:"kb",kg:24,reps:"40m",rest:90,cue:"Épaules en arrière. Regard horizontal. Core engagé."},
  {id:"kb11",name:"Row KB unilatéral",m:"Dos · Biceps",eq:"kb",kg:20,reps:"10",rest:90,cue:"Coude tracte vers la hanche. Rétraction omoplate avant."},
  {id:"kb12",name:"Deadlift KB",m:"Ischios · Fessiers",eq:"kb",kg:24,reps:"8",rest:90,cue:"Charnière hanche. KB entre les pieds. Dos neutre absolu."},
  {id:"kb13",name:"Windmill KB",m:"Core · Épaules",eq:"kb",kg:12,reps:"5",rest:90,cue:"KB verrouillé en haut. Rotation hanche pure. Regard sur le KB."},
  {id:"kb14",name:"Floor Press KB",m:"Pecs · Triceps",eq:"kb",kg:16,reps:"10",rest:90,cue:"Au sol. Coude à 45°. Amplitude réduite mais tension maximale."},
  {id:"kb15",name:"Complex KB",m:"Full body",eq:"kb",kg:14,reps:"5",rest:120,cue:"Swing+Clean+Press+Squat = 1 rep. Rythme constant."},
  {id:"kb16",name:"EMOM Swing KB",m:"Full body",eq:"kb",kg:20,reps:"20",rest:30,cue:"20 swings par minute. Repos = temps restant dans la minute."},
  {id:"kb17",name:"Rack Walk KB",m:"Core · Épaules",eq:"kb",kg:20,reps:"30m",rest:90,cue:"KB en rack. Tronc anti-rotation. Résiste à l'inclinaison."},
  {id:"kb18",name:"Figure 8 KB",m:"Core · Épaules",eq:"kb",kg:14,reps:"10",rest:60,cue:"Transfert entre les jambes. Dos neutre à chaque passage."},
  {id:"kb19",name:"Sumo Deadlift KB",m:"Fessiers · Adducteurs",eq:"kb",kg:24,reps:"10",rest:90,cue:"Stance large. Genoux vers l'extérieur. KB descend verticalement."},
  {id:"kb20",name:"Press KB assis",m:"Épaules · Core",eq:"kb",kg:12,reps:"8",rest:90,cue:"Assis en tailleur. Aucune aide des jambes. Force brute."},
  {id:"kb21",name:"Deadlift KB unilatéral",m:"Ischios · Équilibre",eq:"kb",kg:20,reps:"8",rest:90,cue:"Charnière hanche sur une jambe. KB le long de la jambe."},
  {id:"kb22",name:"Around the World KB",m:"Core · Épaules",eq:"kb",kg:12,reps:"8",rest:60,cue:"Passage fluide d'une main à l'autre dans le plan frontal."},
  {id:"kb23",name:"Pass Under KB",m:"Core · Fessiers",eq:"kb",kg:14,reps:"10",rest:60,cue:"KB sous le genou levé. Transfert propre."},
  {id:"kb24",name:"Hip Thrust KB",m:"Fessiers",eq:"kb",kg:24,reps:"12",rest:90,cue:"KB sur les hanches. Extension complète en haut."},
  {id:"kb25",name:"Arnold Press KB",m:"Épaules complet",eq:"kb",kg:12,reps:"10",rest:90,cue:"Rotation pronation→supination pendant le press. Amplitude complète."},
  // BARBELL
  {id:"bb01",name:"Développé couché barre",m:"Pecs",eq:"bar",kg:60,reps:"5",rest:240,cue:"Pause 1s sur la poitrine. Pas de rebond. Pouces autour de la barre."},
  {id:"bb02",name:"Développé militaire barre",m:"Épaules",eq:"bar",kg:40,reps:"5",rest:180,cue:"Core serré. Barre passe devant le menton. Verrouillage complet en haut."},
  {id:"bb03",name:"Squat barre",m:"Quads · Fessiers",eq:"bar",kg:80,reps:"5",rest:240,cue:"Sous la parallèle. Regard 45°. Genoux dans l'axe des orteils."},
  {id:"bb04",name:"Soulevé de terre",m:"Full body",eq:"bar",kg:100,reps:"3",rest:300,cue:"Dos neutre absolu. Barre collée aux tibias. Pousse le sol."},
  {id:"bb05",name:"Hip Thrust barre",m:"Fessiers",eq:"bar",kg:80,reps:"10",rest:150,cue:"Dos sur le banc. Barre sur les hanches. Extension complète."},
  {id:"bb06",name:"Rowing barre",m:"Dos épais",eq:"bar",kg:60,reps:"8",rest:150,cue:"Buste 45°. Barre vers le nombril. Rétraction omoplates."},
  {id:"bb07",name:"Romanian Deadlift",m:"Ischios · Fessiers",eq:"bar",kg:70,reps:"8",rest:180,cue:"Charnière hanche. Barre le long des cuisses. Ressens l'étirement."},
  {id:"bb08",name:"Curl barre EZ",m:"Biceps",eq:"bar",kg:30,reps:"10",rest:90,cue:"Coudes fixes. 3s descente. Supination prononcée en haut."},
  {id:"bb09",name:"Good Morning barre",m:"Ischios · Lombaires",eq:"bar",kg:40,reps:"8",rest:120,cue:"Genoux légèrement fléchis. Charnière hanche. Dos neutre impératif."},
  {id:"bb10",name:"Front Squat barre",m:"Quads · Core",eq:"bar",kg:60,reps:"5",rest:240,cue:"Coudes hauts. Torse vertical. Mobilité de poignet indispensable."},
  // DUMBBELL
  {id:"db01",name:"Développé couché haltères",m:"Pecs",eq:"db",kg:24,reps:"10",rest:120,cue:"Rotation interne en haut. Descente coudes à 45°."},
  {id:"db02",name:"Développé incliné haltères",m:"Pecs sup",eq:"db",kg:20,reps:"10",rest:120,cue:"Banc 30°. Focus contraction en haut."},
  {id:"db03",name:"Curl haltères alternés",m:"Biceps",eq:"db",kg:14,reps:"10",rest:90,cue:"Supination complète. Coudes fixes. 3s descente."},
  {id:"db04",name:"Curl marteau",m:"Biceps · Brachial",eq:"db",kg:16,reps:"10",rest:90,cue:"Prise neutre. Coudes fixes. Monte jusqu'à l'épaule."},
  {id:"db05",name:"Rowing haltère unilatéral",m:"Dos épais",eq:"db",kg:24,reps:"10",rest:90,cue:"Coude tracte vers la hanche. Omoplate rétractée."},
  {id:"db06",name:"Élévations latérales",m:"Deltoïdes lat.",eq:"db",kg:10,reps:"15",rest:75,cue:"Légère flexion coude. Horizontal. Descente 3s."},
  {id:"db07",name:"Oiseau inversé",m:"Rear delt",eq:"db",kg:8,reps:"15",rest:60,cue:"Buste horizontal. Pincement omoplates. Évite le momentum."},
  {id:"db08",name:"Arnold Press",m:"Épaules complet",eq:"db",kg:14,reps:"10",rest:90,cue:"Rotation pronation→supination pendant le press."},
  {id:"db09",name:"RDL haltères",m:"Ischios · Fessiers",eq:"db",kg:22,reps:"10",rest:120,cue:"Charnière hanche. Haltères le long des cuisses."},
  {id:"db10",name:"Fentes marchées",m:"Quads · Fessiers",eq:"db",kg:16,reps:"12",rest:90,cue:"Genou avant 90°. Genou arrière effleure le sol. Tronc vertical."},
  {id:"db11",name:"Pullover haltère",m:"Grand dorsal · Pecs",eq:"db",kg:20,reps:"12",rest:90,cue:"Arc de cercle. Côtes fermées. Étirement maximal."},
  {id:"db12",name:"Extensions triceps haltère",m:"Triceps",eq:"db",kg:12,reps:"12",rest:75,cue:"Coude immobile. Extension complète. Descente lente."},
  // BODYWEIGHT
  {id:"bw01",name:"Tractions prise large",m:"Dos large · Biceps",eq:"bw",kg:0,reps:"6",rest:180,cue:"Descente bras tendus complète. Sternum vers la barre."},
  {id:"bw02",name:"Chin-up supination",m:"Biceps · Dos",eq:"bw",kg:0,reps:"8",rest:150,cue:"Supination complète. Coudes vers les hanches en haut."},
  {id:"bw03",name:"Dips barres parallèles",m:"Triceps · Pecs",eq:"bw",kg:0,reps:"10",rest:120,cue:"Descente lente 3s. Coudes derrière. Légère inclinaison avant."},
  {id:"bw04",name:"Push-up",m:"Pecs · Triceps",eq:"bw",kg:0,reps:"20",rest:60,cue:"Corps aligné. Coudes 45°. Poitrine touche le sol."},
  {id:"bw05",name:"Dragon Flag",m:"Core complet",eq:"bw",kg:0,reps:"6",rest:120,cue:"Corps rigide. Descente lente contrôlée."},
  {id:"bw06",name:"L-Sit",m:"Core · Triceps",eq:"bw",kg:0,reps:"20s",rest:90,cue:"Bras verrouillés. Jambes horizontales. Épaules déprimées."},
  {id:"bw07",name:"Relevé de jambes suspendu",m:"Abdos bas",eq:"bw",kg:0,reps:"12",rest:90,cue:"Pas de balancement. Contrôle descente. Bassin en rétroversion."},
  {id:"bw08",name:"Pistol Squat",m:"Quads · Équilibre",eq:"bw",kg:0,reps:"5",rest:120,cue:"Descente contrôlée. Jambe libre tendue. Genou dans l'axe."},
  // MACHINE
  {id:"mc01",name:"Lat Pulldown câble",m:"Dos large",eq:"mc",kg:50,reps:"12",rest:90,cue:"Barre vers le haut de la poitrine. Coudes vers les hanches."},
  {id:"mc02",name:"Rowing câble assis",m:"Dos épais",eq:"mc",kg:50,reps:"12",rest:90,cue:"Tirage vers le nombril. Rétraction omoplates."},
  {id:"mc03",name:"Face Pull câble",m:"Rear delt",eq:"mc",kg:15,reps:"15",rest:60,cue:"Tirage vers le visage. Coudes à hauteur des épaules. Rotation externe."},
  {id:"mc04",name:"Leg Press",m:"Quads · Fessiers",eq:"mc",kg:100,reps:"12",rest:120,cue:"Pieds largeur d'épaules. Descente 90°. Pas de rebond."},
  {id:"mc05",name:"Leg Curl",m:"Ischios",eq:"mc",kg:35,reps:"12",rest:90,cue:"Hanche collée. Flexion 90°. Descente 3s."},
  {id:"mc06",name:"Chest Press machine",m:"Pecs",eq:"mc",kg:50,reps:"12",rest:90,cue:"Poignées à hauteur de poitrine. Pression constante."},
  // CARDIO
  {id:"cd01",name:"SkiErg Sprints 20/10",m:"Full body · Cardio",eq:"cd",kg:0,reps:"8×20s",rest:10,cue:"Double bras. Poussée hanches + bras. Max effort 20s / repos 10s."},
  {id:"cd02",name:"Rameur 500m",m:"Full body · Cardio",eq:"cd",kg:0,reps:"4×500m",rest:60,cue:"Drive jambes → tronc → bras. Ratio 1:2 push/recover."},
  {id:"cd03",name:"Vélo HIIT 30/30",m:"Cardio · Jambes",eq:"cd",kg:0,reps:"10×30s",rest:30,cue:"Sprint 30s résistance haute / récup 30s basse."},
  {id:"cd04",name:"Corde à sauter",m:"Cardio",eq:"cd",kg:0,reps:"3×1min",rest:30,cue:"Appuis avant du pied. Saut minimal. Poignets, pas les bras."},
  {id:"cd05",name:"Battle Ropes",m:"Cardio · Bras",eq:"cd",kg:0,reps:"4×30s",rest:30,cue:"Genoux fléchis. Core engagé. Alternance ou double frappe."},
];
const EQ = {kb:"KB",bar:"Barre",db:"Haltères",bw:"Corps",mc:"Machine",cd:"Cardio"};

// ─── PROGRAM ──────────────────────────────────────────────────────────────────
const PROG = [
  {day:"LUN",label:"Push Force",salle:"haut",muscle:"Pecs · Épaules · Triceps",
   exIds:[["bb01",5],["bb02",4],["db01",3],["db06",4],["db07",3],["bw03",4]],
   abs:[{id:"bw05",name:"Dragon Flag",vol:"4×6"},{id:"bw07",name:"Relevé jambes suspendu",vol:"3×12"}]},
  {day:"MAR",label:"KB Power",salle:"bas",muscle:"Full Body · Kettlebell",
   exIds:[["kb01",4],["kb03",4],["kb04",4],["kb07",3],["kb08",4],["kb16",1]],
   abs:[{id:"bw06",name:"L-Sit",vol:"4×20s"},{id:"bw05",name:"Dragon Flag",vol:"3×5"}]},
  {day:"MER",label:"Pull & Legs",salle:"haut",muscle:"Dos · Biceps · Jambes",
   exIds:[["bw01",5],["bw02",4],["bb07",4],["db05",3],["kb08",4],["bb08",4]],
   abs:[{id:"bw07",name:"Relevé jambes suspendu",vol:"4×12"},{id:"bw05",name:"Dragon Flag",vol:"3×6"}]},
  {day:"JEU",label:"Repos",salle:null,muscle:"Récupération active",exIds:[],abs:[]},
  {day:"VEN",label:"KB Endurance",salle:"bas",muscle:"KB · Rameur · Full Body",
   exIds:[["cd02",4],["kb05",4],["kb06",4],["kb15",3],["db05",4],["cd04",3]],
   abs:[{id:"bw06",name:"L-Sit",vol:"4×20s"},{id:"bw07",name:"Relevé jambes suspendu",vol:"3×15"}]},
  {day:"SAM",label:"Full Power",salle:"haut",muscle:"Deadlift · Tractions · KB",
   exIds:[["bb04",5],["bb05",4],["bw01",5],["bw03",3],["kb15",4],["kb07",3]],
   abs:[{id:"bw05",name:"Dragon Flag",vol:"4×8"},{id:"bw06",name:"L-Sit",vol:"3×25s"}]},
  {day:"DIM",label:"Repos",salle:null,muscle:"Reset total",exIds:[],abs:[]},
];
function buildDay(d) {
  return { ...d, exercises: d.exIds.map(([id,sets]) => { const ex = DB.find(e=>e.id===id); return ex ? {...ex,sets} : null; }).filter(Boolean) };
}
const PROGRAM = PROG.map(buildDay);

const SESSION_TYPES = ["KB Full","KB Endurance","KB Force","Push","Pull","Jambes","Corps entier","Bras","Cardio"];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const LS = "soma_s13";
const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS)||"{}"); } catch { return {}; } };
const lsSet = d => { try { localStorage.setItem(LS,JSON.stringify(d)); } catch {} };

// ─── UTILS ───────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0,10);
const todayIdx = () => { const d=new Date().getDay(); return d===0?6:d-1; };
const fmtMSS = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtDur = s => s>=3600?`${Math.floor(s/3600)}h${String(Math.floor((s%3600)/60)).padStart(2,"0")}m`:`${Math.floor(s/60)}m${String(s%60).padStart(2,"0")}s`;
const orm = (kg,reps) => kg>0 ? Math.round(kg*(1+(parseFloat(String(reps).split("–")[0])||8)/30)) : null;

function beep() {
  try {
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [0,.15,.30].forEach(d=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.value=1046;
      g.gain.setValueAtTime(.18,ctx.currentTime+d);
      g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.1);
      o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.1);
    });
  } catch {}
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useStopwatch() {
  const [sec,setSec]=useState(0);const[running,setRunning]=useState(false);const ref=useRef(null);
  const start=()=>{setSec(0);setRunning(true);ref.current=setInterval(()=>setSec(p=>p+1),1000);};
  const stop=()=>{clearInterval(ref.current);setRunning(false);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setSec(0);};
  useEffect(()=>()=>clearInterval(ref.current),[]);
  return{sec,running,start,stop,reset};
}
function useCountdown(onDone){
  const[sec,setSec]=useState(0);const[total,setTotal]=useState(0);const[running,setRunning]=useState(false);const[done,setDone]=useState(false);const ref=useRef(null);
  const start=useCallback(s=>{
    clearInterval(ref.current);setSec(s);setTotal(s);setRunning(true);setDone(false);
    ref.current=setInterval(()=>setSec(p=>{
      if(p<=1){clearInterval(ref.current);setRunning(false);setDone(true);beep();onDone?.();return 0;}
      return p-1;
    }),1000);
  },[onDone]);
  const stop=()=>{clearInterval(ref.current);setRunning(false);};
  const reset=()=>{clearInterval(ref.current);setRunning(false);setDone(false);setSec(0);setTotal(0);};
  useEffect(()=>()=>clearInterval(ref.current),[]);
  return{sec,total,running,done,start,stop,reset};
}

// ─── TAP ─────────────────────────────────────────────────────────────────────
// Emil: scale(0.97) on press, specific transition, never `all`
function Tap({children,onTap,style,disabled}){
  const[p,setP]=useState(false);
  return(
    <div onPointerDown={()=>!disabled&&setP(true)} onPointerUp={()=>{setP(false);!disabled&&onTap?.();}} onPointerLeave={()=>setP(false)}
      style={{...style,transform:p&&!disabled?"scale(0.97)":"scale(1)",transition:`transform 150ms ${E1}`,cursor:disabled?"default":"pointer",WebkitTapHighlightColor:"transparent",userSelect:"none"}}>
      {children}
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function Onboarding({onDone}){
  const[step,setStep]=useState(0);
  const[name,setName]=useState("");
  const[level,setLevel]=useState(null);
  const[equip,setEquip]=useState([]);
  const steps=[
    {title:"Bienvenue sur SŌMA",sub:"Ton coach de force personnel.",type:"intro"},
    {title:"Comment tu t'appelles ?",sub:"Pour personnaliser ton expérience.",type:"name"},
    {title:"Ton niveau actuel ?",sub:"Pour calibrer les charges suggérées.",type:"level"},
    {title:"Équipement disponible ?",sub:"Pour adapter les séances.",type:"equip"},
  ];
  const LEVELS=["Débutant","Intermédiaire","Avancé","Expert"];
  const EQUIPS=["Kettlebell","Barre olympique","Haltères","Tractions/Dips","Rameur","SkiErg","Machines"];
  const next=()=>{ if(step<steps.length-1) setStep(s=>s+1); else onDone({name,level,equip}); };
  const canNext=(step===0)||(step===1&&name.trim().length>0)||(step===2&&level)||(step===3);
  const s=steps[step];
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:900,display:"flex",flexDirection:"column",padding:"0 0 env(safe-area-inset-bottom)",fontFamily:F}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}`}</style>
      {/* Progress */}
      <div style={{display:"flex",gap:6,padding:"60px 28px 0"}}>
        {steps.map((_,i)=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=step?C.blue:C.s4,transition:`background 400ms ${E1}`}}/>
        ))}
      </div>
      {/* Content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 28px",animation:`fadeUp 400ms ${E1} both`}} key={step}>
        <div style={{fontSize:34,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.1,marginBottom:12}}>{s.title}</div>
        <div style={{fontSize:19,fontWeight:400,color:C.ink3,lineHeight:1.6,marginBottom:48}}>{s.sub}</div>
        {s.type==="name"&&(
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ton prénom" autoFocus
            style={{width:"100%",padding:"18px 20px",borderRadius:16,border:`1.5px solid ${name?C.blue:C.s4}`,background:C.s1,fontFamily:F,fontSize:19,fontWeight:500,color:C.ink,outline:"none",boxSizing:"border-box",transition:`border-color 200ms ${E1}`}}/>
        )}
        {s.type==="level"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {LEVELS.map(l=>(
              <Tap key={l} onTap={()=>setLevel(l)} style={{padding:"20px",borderRadius:16,border:`1.5px solid ${level===l?C.blue:C.s4}`,background:level===l?C.blueDim:C.s1,display:"flex",justifyContent:"space-between",alignItems:"center",transition:`all 200ms ${E1}`}}>
                <span style={{fontSize:17,fontWeight:level===l?600:400,color:level===l?C.blue:C.ink2}}>{l}</span>
                {level===l&&<span style={{color:C.blue,fontSize:17}}>✓</span>}
              </Tap>
            ))}
          </div>
        )}
        {s.type==="equip"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {EQUIPS.map(e=>{
              const sel=equip.includes(e);
              return(
                <Tap key={e} onTap={()=>setEquip(p=>sel?p.filter(x=>x!==e):[...p,e])}
                  style={{padding:"16px 14px",borderRadius:14,border:`1.5px solid ${sel?C.blue:C.s4}`,background:sel?C.blueDim:C.s1,textAlign:"center",transition:`all 200ms ${E1}`}}>
                  <span style={{fontSize:15,fontWeight:sel?600:400,color:sel?C.blue:C.ink3}}>{e}</span>
                </Tap>
              );
            })}
          </div>
        )}
      </div>
      {/* CTA */}
      <div style={{padding:"0 28px 32px"}}>
        <Tap onTap={canNext?next:null} style={{width:"100%",padding:"18px",borderRadius:16,background:canNext?C.blue:C.s3,display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${E1}`}} disabled={!canNext}>
          <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:canNext?"#000":C.ink4}}>{step===steps.length-1?"Commencer":"Continuer"}</span>
        </Tap>
      </div>
    </div>
  );
}

// ─── DAILY CHECK-IN ───────────────────────────────────────────────────────────
function DailyCheckin({onDone}){
  const[val,setVal]=useState(null);
  const STATES=[
    {v:1,label:"Épuisé",color:C.red,rec:"Réduis le volume de 30% aujourd'hui."},
    {v:2,label:"Fatigué",color:C.orange,rec:"Prends des temps de repos plus longs."},
    {v:3,label:"Normal",color:C.blue,rec:"Programme standard. Tu es dans la zone."},
    {v:4,label:"Bien",color:C.green,rec:"Pousse un peu plus fort. C'est le moment."},
    {v:5,label:"Au top",color:C.lime,rec:"Journée pour battre des PBs. Vas-y."},
  ];
  const chosen=STATES.find(s=>s.v===val);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div style={{background:C.s1,borderRadius:"28px 28px 0 0",padding:"28px 24px calc(36px + env(safe-area-inset-bottom))",maxWidth:600,width:"100%",animation:`slideUp 380ms ${E2} both`}}>
        <style>{`@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
        <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 28px"}}/>
        <div style={{fontSize:26,fontWeight:700,color:C.ink,letterSpacing:"-.02em",marginBottom:6}}>Comment tu te sens ?</div>
        <div style={{fontSize:15,color:C.ink3,marginBottom:28}}>3 secondes. Ça personnalise ta séance du jour.</div>
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          {STATES.map(s=>(
            <Tap key={s.v} onTap={()=>setVal(s.v)} style={{flex:1,height:56,borderRadius:14,border:`2px solid ${val===s.v?s.color:C.s4}`,background:val===s.v?s.color+"22":C.s2,display:"flex",alignItems:"center",justifyContent:"center",transition:`all 200ms ${E1}`}}>
              <span style={{fontFamily:F,fontSize:19,fontWeight:700,color:val===s.v?s.color:C.ink4}}>{s.v}</span>
            </Tap>
          ))}
        </div>
        {chosen&&(
          <div style={{padding:"14px 18px",borderRadius:14,background:chosen.color+"18",marginBottom:20,animation:`fadeIn 200ms ${E1} both`}}>
            <span style={{fontSize:15,fontWeight:600,color:chosen.color}}>{chosen.label} · </span>
            <span style={{fontSize:15,color:C.ink2}}>{chosen.rec}</span>
          </div>
        )}
        <Tap onTap={val?()=>onDone(val):null} style={{width:"100%",padding:"17px",borderRadius:16,background:val?C.blue:C.s3,display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${E1}`}} disabled={!val}>
          <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:val?"#000":C.ink4}}>Confirmer</span>
        </Tap>
      </div>
    </div>
  );
}

// ─── REST OVERLAY ─────────────────────────────────────────────────────────────
function RestOverlay({timer,label}){
  if(!timer.running&&!timer.done&&timer.sec===0) return null;
  const pct=timer.total>0?timer.sec/timer.total:0;
  const R=38,circ=2*Math.PI*R;
  const col=timer.done?C.green:C.blue;
  return(
    <div style={{position:"fixed",bottom:90,left:16,right:16,zIndex:400,display:"flex",justifyContent:"center",animation:`slideUpFade 300ms ${E3} both`}}>
      <style>{`@keyframes slideUpFade{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}} @keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{background:"rgba(17,17,17,.96)",border:`1px solid ${C.s4}`,borderRadius:22,padding:"16px 20px",display:"flex",alignItems:"center",gap:18,maxWidth:420,width:"100%",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)"}}>
        <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
          <svg width="80" height="80" style={{transform:"rotate(-90deg)"}}>
            <circle cx="40" cy="40" r={R} fill="none" stroke={C.s4} strokeWidth="5"/>
            <circle cx="40" cy="40" r={R} fill="none" stroke={col} strokeWidth="5"
              strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round"
              style={{transition:"stroke-dasharray .85s linear",transitionTimingFunction:"linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:F,fontSize:17,fontWeight:700,color:timer.done?C.green:C.ink,letterSpacing:"-.01em"}}>{timer.done?"GO":fmtMSS(timer.sec)}</span>
          </div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F,fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".12em",marginBottom:5}}>{timer.done?"Repos terminé":"Repos"}</div>
          <div style={{fontFamily:F,fontSize:15,fontWeight:600,color:timer.done?C.green:C.ink2,marginBottom:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
          <div style={{display:"flex",gap:8}}>
            {timer.running&&<Tap onTap={timer.stop} style={{padding:"6px 14px",borderRadius:980,border:`1px solid ${C.s4}`,background:"transparent"}}><span style={{fontFamily:F,fontSize:12,fontWeight:600,color:C.ink4}}>Passer</span></Tap>}
            <Tap onTap={timer.reset} style={{padding:"6px 14px",borderRadius:980,border:`1px solid ${C.s4}`,background:"transparent"}}><span style={{fontFamily:F,fontSize:12,fontWeight:600,color:C.ink4}}>Fermer</span></Tap>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FULL SCREEN EXERCISE MODE ────────────────────────────────────────────────
// Freeletics-level: one exercise fills the entire screen
function ExerciseFullScreen({ex,weight,onWeightChange,log,onLogSet,onStartRest,onClose,lastWeight,dayAccent}){
  const sets=typeof ex.sets==="number"?ex.sets:4;
  const done=Array.from({length:sets},(_,i)=>!!log[`${ex.id}_s${i}`]?.done);
  const completed=done.filter(Boolean).length;
  const allDone=sets>0&&completed===sets;
  const kg=weight??ex.kg??0;
  const oneRM=orm(kg,ex.reps);
  const col=allDone?C.green:dayAccent||C.blue;

  const handleSet=i=>{
    const newDone=!done[i];
    onLogSet(`${ex.id}_s${i}`,{done:newDone,weight:kg,date:todayKey()});
    if(newDone&&ex.rest>0) onStartRest(ex.rest,ex.name);
  };

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:500,display:"flex",flexDirection:"column",fontFamily:F,animation:`fadeIn 200ms ${E1} both`,paddingTop:"env(safe-area-inset-top)",paddingBottom:"env(safe-area-inset-bottom)"}}>
      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${C.s3}`}}>
        <Tap onTap={onClose} style={{width:40,height:40,borderRadius:10,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontFamily:F,fontSize:13,fontWeight:600,color:C.ink3}}>✕</span>
        </Tap>
        <div style={{fontFamily:F,fontSize:13,fontWeight:600,color:C.ink3,textTransform:"uppercase",letterSpacing:".1em"}}>
          {completed}/{sets} séries
        </div>
        <div style={{width:40}}/>
      </div>

      {/* Exercise info */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"28px 24px 24px",overflowY:"auto"}}>
        <div>
          {/* Name — massive */}
          <div style={{fontSize:40,fontWeight:700,color:allDone?C.green:C.ink,letterSpacing:"-.02em",lineHeight:1.05,marginBottom:10,transition:`color 300ms ${E1}`}}>
            {ex.name}
          </div>
          <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
            <span style={{fontSize:14,fontWeight:400,color:C.ink3}}>{ex.m}</span>
            <span style={{fontSize:14,fontWeight:400,color:C.ink5}}>·</span>
            <span style={{fontSize:14,fontWeight:600,padding:"3px 10px",borderRadius:980,background:C.s2,color:C.ink3}}>{EQ[ex.eq]}</span>
            {oneRM&&<><span style={{color:C.ink5}}>·</span><span style={{fontSize:14,fontWeight:600,color:C.blue}}>1RM ~{oneRM}kg</span></>}
          </div>

          {/* Suggestion */}
          {lastWeight&&lastWeight>0&&<div style={{padding:"12px 16px",borderRadius:12,background:C.orangeDim,marginBottom:20}}>
            <span style={{fontFamily:F,fontSize:14,fontWeight:600,color:C.orange}}>Dernière fois : {lastWeight}kg · Essaie {lastWeight+2.5}kg</span>
          </div>}

          {/* Coach cue */}
          {ex.cue&&<div style={{padding:"16px",borderRadius:14,background:C.s2,marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Cue technique</div>
            <div style={{fontSize:15,fontWeight:400,color:C.ink2,lineHeight:1.65}}>{ex.cue}</div>
          </div>}

          {/* Weight — big */}
          <div style={{background:C.s2,borderRadius:18,padding:"20px",marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Charge</div>
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <Tap onTap={()=>onWeightChange(ex.id,Math.max(0,kg-2.5))} style={{width:56,height:56,borderRadius:14,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:28,fontWeight:300,color:C.ink}}>−</span>
              </Tap>
              <div style={{flex:1,textAlign:"center"}}>
                <span style={{fontFamily:F,fontSize:48,fontWeight:700,color:C.ink,letterSpacing:"-.03em"}}>{kg===0?"BW":`${kg}`}</span>
                {kg>0&&<span style={{fontSize:24,fontWeight:300,color:C.ink3}}> kg</span>}
              </div>
              <Tap onTap={()=>onWeightChange(ex.id,kg+2.5)} style={{width:56,height:56,borderRadius:14,background:C.s3,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:28,fontWeight:300,color:C.ink}}>+</span>
              </Tap>
            </div>
          </div>
        </div>

        {/* SET BUTTONS — 64px minimum, impossible to miss */}
        <div>
          <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:14}}>
            {sets} séries · {ex.reps} reps{ex.rest>0?` · ${ex.rest>=60?`${ex.rest/60}min`:ex.rest+"s"} repos`:""}
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {Array.from({length:sets},(_,i)=>(
              <Tap key={i} onTap={()=>handleSet(i)} style={{
                width:64,height:64,borderRadius:16,flexShrink:0,
                border:`2px solid ${done[i]?C.green:C.s4}`,
                background:done[i]?C.greenDim:C.s2,
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:`all 220ms ${E1}`,
              }}>
                <span style={{fontFamily:F,fontSize:20,fontWeight:700,color:done[i]?C.green:C.ink3}}>{i+1}</span>
              </Tap>
            ))}
          </div>
          {ex.rest>0&&(
            <Tap onTap={()=>onStartRest(ex.rest,ex.name)} style={{marginTop:12,padding:"13px 20px",borderRadius:14,border:`1px solid ${C.s4}`,background:"transparent",display:"inline-flex",alignItems:"center"}}>
              <span style={{fontFamily:F,fontSize:14,fontWeight:600,color:C.ink3}}>Démarrer repos · {ex.rest>=60?`${ex.rest/60}min`:`${ex.rest}s`}</span>
            </Tap>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EXERCISE ROW (compact list view) ────────────────────────────────────────
function ExRow({ex,weight,onWeightChange,log,onLogSet,onStartRest,idx,lastWeight,onFullScreen}){
  const sets=typeof ex.sets==="number"?ex.sets:4;
  const done=Array.from({length:sets},(_,i)=>!!log[`${ex.id}_s${i}`]?.done);
  const completed=done.filter(Boolean).length;
  const allDone=sets>0&&completed===sets;
  const kg=weight??ex.kg??0;
  const oneRM=orm(kg,ex.reps);

  const handleSet=i=>{
    onLogSet(`${ex.id}_s${i}`,{done:!done[i],weight:kg,date:todayKey()});
    if(!done[i]&&ex.rest>0) onStartRest(ex.rest,ex.name);
  };

  return(
    <div style={{borderBottom:`1px solid ${C.s3}`,animation:`fadeSlideIn 280ms ${E1} ${idx*35}ms both`}}>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      {/* Row header */}
      <Tap onTap={()=>onFullScreen(ex)} style={{padding:"16px 0 10px",display:"flex",alignItems:"center",gap:14}}>
        {/* Progress ring */}
        <div style={{width:44,height:44,borderRadius:"50%",flexShrink:0,
          border:`2px solid ${allDone?C.green:C.s4}`,
          background:allDone?C.greenDim:"transparent",
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:`all 250ms ${E1}`}}>
          <span style={{fontFamily:F,fontSize:13,fontWeight:700,color:allDone?C.green:C.ink4}}>{completed}/{sets}</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F,fontSize:17,fontWeight:600,color:allDone?C.ink4:C.ink,textDecoration:allDone?"line-through":"none",marginBottom:4,transition:`color 250ms ${E1}`}}>{ex.name}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:14,color:C.ink3}}>{sets}×{ex.reps}</span>
            <span style={{color:C.s4}}>·</span>
            <span style={{fontSize:13,fontWeight:600,padding:"2px 8px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ[ex.eq]}</span>
            {oneRM&&<><span style={{color:C.s4}}>·</span><span style={{fontSize:13,fontWeight:600,color:C.blue}}>~{oneRM}kg</span></>}
            {lastWeight&&<span style={{fontSize:12,color:C.orange}}>{lastWeight}kg →+2.5</span>}
          </div>
        </div>
        {ex.rest>0&&<span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:980,background:C.s3,color:C.ink4,flexShrink:0}}>{ex.rest>=60?`${ex.rest/60}′`:`${ex.rest}″`}</span>}
        <span style={{color:C.ink5,fontSize:12,flexShrink:0}}>▶</span>
      </Tap>

      {/* Set buttons — 56px in list view */}
      <div style={{paddingBottom:16,display:"flex",gap:8,flexWrap:"wrap"}}>
        {Array.from({length:sets},(_,i)=>(
          <Tap key={i} onTap={()=>handleSet(i)} style={{
            width:56,height:56,borderRadius:14,flexShrink:0,
            border:`1.5px solid ${done[i]?C.green:C.s4}`,
            background:done[i]?C.greenDim:C.s2,
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:`all 220ms ${E1}`,
          }}>
            <span style={{fontFamily:F,fontSize:17,fontWeight:700,color:done[i]?C.green:C.ink4}}>{i+1}</span>
          </Tap>
        ))}
        {ex.rest>0&&<Tap onTap={()=>onStartRest(ex.rest,ex.name)} style={{height:56,padding:"0 14px",borderRadius:14,border:`1.5px solid ${C.s4}`,background:"transparent",display:"flex",alignItems:"center"}}>
          <span style={{fontFamily:F,fontSize:13,fontWeight:600,color:C.ink4}}>Repos</span>
        </Tap>}
      </div>
    </div>
  );
}

// ─── AI REGEN SHEET ───────────────────────────────────────────────────────────
function RegenSheet({onClose,onResult,excluded}){
  const[type,setType]=useState(null);const[custom,setCustom]=useState("");const[loading,setLoading]=useState(false);
  const generate=async()=>{
    if(!type&&!custom.trim()) return;
    setLoading(true);
    const dbList=DB.filter(e=>!excluded.includes(e.id)).map(e=>`${e.id}:${e.name}(${EQ[e.eq]},${e.m},${e.reps},rest:${e.rest}s)`).join("|");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:`Coach fitness expert. Génère séance "${type||custom}" uniquement avec exercices de cette base: ${dbList}. Réponds UNIQUEMENT en JSON valide: {"titre":string,"exercises":[{"id":string,"name":string,"sets":number,"reps":string,"rest":number,"m":string,"eq":string,"cue":string,"kg":number}],"abs":[{"id":string,"name":string,"vol":string}]}`}]})});
      const d=await res.json();
      const raw=(d.content?.find(b=>b.type==="text")?.text||"").replace(/```json|```/g,"").trim();
      onResult(JSON.parse(raw));onClose();
    }catch(e){console.error(e);alert("Erreur génération.");}
    setLoading(false);
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)"}}/>
      <div style={{position:"relative",background:C.s1,borderRadius:"28px 28px 0 0",padding:"28px 24px calc(36px + env(safe-area-inset-bottom))",maxWidth:600,width:"100%",animation:`slideUp 360ms ${E2} both`}}>
        <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{fontSize:28,fontWeight:700,color:C.ink,letterSpacing:"-.02em",marginBottom:20}}>Générer une séance</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          {SESSION_TYPES.map(t=>(
            <Tap key={t} onTap={()=>setType(t===type?null:t)} style={{padding:"13px 8px",borderRadius:12,textAlign:"center",border:`1.5px solid ${type===t?C.blue:C.s4}`,background:type===t?C.blueDim:C.s2,transition:`all 180ms ${E1}`}}>
              <span style={{fontFamily:F,fontSize:13,fontWeight:type===t?600:400,color:type===t?C.blue:C.ink3}}>{t}</span>
            </Tap>
          ))}
        </div>
        <textarea value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Ou décris librement ta séance..."
          style={{width:"100%",minHeight:52,padding:"12px 16px",borderRadius:14,border:`1px solid ${C.s4}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,resize:"none",outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
        <Tap onTap={generate} style={{padding:"17px",borderRadius:16,background:(!type&&!custom.trim())||loading?C.s3:C.blue,display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${E1}`}} disabled={(!type&&!custom.trim())||loading}>
          <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:(!type&&!custom.trim())||loading?C.ink5:"#000"}}>{loading?"Génération en cours…":"Générer avec IA"}</span>
        </Tap>
      </div>
    </div>
  );
}

// ─── EXERCISE PICKER ─────────────────────────────────────────────────────────
function ExPicker({onSelect,onClose,currentId,excluded}){
  const[search,setSearch]=useState("");const[eq,setEq]=useState(null);
  const filtered=DB.filter(e=>{
    if(excluded.includes(e.id)||e.id===currentId) return false;
    if(search&&!e.name.toLowerCase().includes(search.toLowerCase())&&!e.m.toLowerCase().includes(search.toLowerCase())) return false;
    if(eq&&e.eq!==eq) return false;
    return true;
  });
  return(
    <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(6px)"}}/>
      <div style={{position:"relative",background:C.s1,borderRadius:"28px 28px 0 0",width:"100%",maxWidth:600,maxHeight:"88vh",display:"flex",flexDirection:"column",animation:`slideUp 360ms ${E2} both`}}>
        <div style={{padding:"20px 20px 14px",borderBottom:`1px solid ${C.s3}`,flexShrink:0}}>
          <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 18px"}}/>
          <div style={{fontSize:22,fontWeight:700,color:C.ink,marginBottom:14}}>Choisir un exercice</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." autoFocus
            style={{width:"100%",padding:"12px 16px",borderRadius:12,border:`1px solid ${C.s4}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,outline:"none",boxSizing:"border-box",marginBottom:12}}/>
          <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
            {Object.entries(EQ).map(([k,l])=>(
              <Tap key={k} onTap={()=>setEq(eq===k?null:k)} style={{flexShrink:0,padding:"6px 14px",borderRadius:980,border:`1px solid ${eq===k?C.blue:C.s4}`,background:eq===k?C.blueDim:"transparent",transition:`all 150ms ${E1}`}}>
                <span style={{fontFamily:F,fontSize:12,fontWeight:600,color:eq===k?C.blue:C.ink4}}>{l}</span>
              </Tap>
            ))}
          </div>
        </div>
        <div style={{overflowY:"auto",flex:1,padding:"0 20px 40px"}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"32px 0",fontSize:15,color:C.ink4}}>Aucun exercice trouvé.</div>}
          {filtered.map(ex=>(
            <Tap key={ex.id} onTap={()=>onSelect(ex)} style={{padding:"16px 0",borderBottom:`1px solid ${C.s3}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:C.ink,marginBottom:4}}>{ex.name}</div>
                <div style={{display:"flex",gap:8}}>
                  <span style={{fontSize:13,color:C.ink3}}>{ex.m}</span>
                  <span style={{fontSize:12,fontWeight:600,padding:"1px 8px",borderRadius:980,background:C.s3,color:C.ink4}}>{EQ[ex.eq]}</span>
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
function FeedbackSheet({onClose,onSave}){
  const[intensity,setIntensity]=useState(3);const[energy,setEnergy]=useState(3);const[notes,setNotes]=useState("");
  const IL=["","Très léger","Léger","Modéré","Intense","Maximum"];
  const EL=["","Épuisé","Fatigué","Normal","Énergisé","Au top"];
  return(
    <div style={{position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:F}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)"}}/>
      <div style={{position:"relative",background:C.s1,borderRadius:"28px 28px 0 0",padding:"28px 24px calc(36px + env(safe-area-inset-bottom))",maxWidth:600,width:"100%",animation:`slideUp 360ms ${E2} both`}}>
        <div style={{width:36,height:4,background:C.s4,borderRadius:2,margin:"0 auto 24px"}}/>
        <div style={{fontSize:28,fontWeight:700,color:C.ink,letterSpacing:"-.02em",marginBottom:6}}>Bilan séance</div>
        <div style={{fontSize:17,color:C.ink3,marginBottom:28}}>Comment s'est passée ta séance ?</div>
        {[{label:"Intensité",val:intensity,set:setIntensity,labels:IL},{label:"Énergie",val:energy,set:setEnergy,labels:EL}].map(({label,val,set,labels})=>(
          <div key={label} style={{marginBottom:22}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:C.ink}}>{label}</span>
              <span style={{fontFamily:F,fontSize:14,color:C.ink3}}>{labels[val]}</span>
            </div>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5].map(v=>(
                <Tap key={v} onTap={()=>set(v)} style={{flex:1,height:52,borderRadius:13,border:`1.5px solid ${val===v?C.blue:C.s4}`,background:val===v?C.blueDim:C.s2,display:"flex",alignItems:"center",justifyContent:"center",transition:`all 160ms ${E1}`}}>
                  <span style={{fontFamily:F,fontSize:18,fontWeight:val===v?700:400,color:val===v?C.blue:C.ink4}}>{v}</span>
                </Tap>
              ))}
            </div>
          </div>
        ))}
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes libres..."
          style={{width:"100%",minHeight:60,padding:"12px 16px",borderRadius:13,border:`1px solid ${C.s4}`,fontFamily:F,fontSize:15,color:C.ink,background:C.s2,resize:"none",outline:"none",marginBottom:18,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:10}}>
          <Tap onTap={onClose} style={{flex:1,padding:"16px",borderRadius:15,border:`1px solid ${C.s4}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:C.ink3}}>Annuler</span>
          </Tap>
          <Tap onTap={()=>onSave({global:intensity,energy,notes})} style={{flex:2,padding:"16px",borderRadius:15,background:C.blue,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:"#000"}}>Enregistrer</span>
          </Tap>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION REPORT — animated counters ───────────────────────────────────────
function useCountUp(target,duration=1200){
  const[val,setVal]=useState(0);
  useEffect(()=>{
    let start=null,raf;
    const step=ts=>{
      if(!start) start=ts;
      const p=Math.min((ts-start)/duration,1);
      setVal(Math.round(target*p));
      if(p<1) raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(raf);
  },[target]);
  return val;
}

function SessionReport({session,onClose}){
  if(!session) return null;
  const{totalKg=0,totalSets=0,duration=0,exercises=[],date="",dayLabel="",score=0,feedback}=session;
  const animKg=useCountUp(Math.round(totalKg/1000*10)/10,1400);
  const animSets=useCountUp(totalSets,1000);
  const animScore=useCountUp(score,1200);
  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:700,overflowY:"auto",fontFamily:F,animation:`fadeIn 250ms ${E1} both`}}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
      <div style={{maxWidth:600,margin:"0 auto"}}>
        {/* Hero */}
        <div style={{padding:"56px 24px 36px",borderBottom:`1px solid ${C.s3}`}}>
          <Tap onTap={onClose} style={{position:"fixed",top:"calc(20px + env(safe-area-inset-top))",right:20,width:36,height:36,borderRadius:"50%",background:C.s2,border:`1px solid ${C.s4}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:14,color:C.ink3}}>✕</span>
          </Tap>
          <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:10}}>{date}</div>
          <div style={{fontSize:40,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.05,marginBottom:20}}>{dayLabel}</div>
          {score>0&&(
            <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 18px",borderRadius:980,background:C.s2,border:`1px solid ${C.s4}`}}>
              <span style={{fontSize:22,fontWeight:700,color:C.blue}}>{animScore}</span>
              <span style={{fontSize:12,fontWeight:600,color:C.ink4,letterSpacing:".1em"}}>SCORE</span>
            </div>
          )}
        </div>
        {/* Metrics — animated */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:`1px solid ${C.s3}`}}>
          {[
            {l:"Volume",v:totalKg>0?`${animKg}t`:"—"},
            {l:"Durée",v:duration>0?fmtDur(duration):"—"},
            {l:"Séries",v:`${animSets}`},
          ].map(({l,v},i)=>(
            <div key={l} style={{padding:"24px 16px",borderRight:i<2?`1px solid ${C.s3}`:"none"}}>
              <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>{l}</div>
              <div style={{fontSize:32,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>{v}</div>
            </div>
          ))}
        </div>
        {/* Exercises */}
        {exercises.filter(e=>e.completedSets>0).length>0&&(
          <div style={{padding:"20px 24px"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Exercices</div>
            {exercises.filter(e=>e.completedSets>0).map((ex,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${C.s3}`}}>
                <div>
                  <div style={{fontSize:16,fontWeight:600,color:C.ink,marginBottom:3}}>{ex.name}</div>
                  <div style={{fontSize:13,color:C.ink3}}>{ex.completedSets} séries · {ex.m}</div>
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
                <div key={l} style={{flex:1,background:C.s2,borderRadius:14,padding:"16px"}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{l}</div>
                  <div style={{fontSize:28,fontWeight:700,color:C.ink}}>{v}/5</div>
                </div>
              ))}
            </div>
            {feedback.notes&&<div style={{fontSize:15,color:C.ink3,lineHeight:1.65}}>{feedback.notes}</div>}
          </div>
        )}
        <div style={{padding:"0 24px 60px"}}>
          <Tap onTap={onClose} style={{padding:"16px",borderRadius:15,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:C.ink3}}>Fermer</span>
          </Tap>
        </div>
      </div>
    </div>
  );
}

// ─── WEEK SUMMARY ─────────────────────────────────────────────────────────────
function WeekSummary({sessions}){
  const days=["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
  const today=new Date();
  const weekDates=Array.from({length:7},(_,i)=>{
    const d=new Date(today);
    const dow=today.getDay()===0?6:today.getDay()-1;
    d.setDate(today.getDate()-dow+i);
    return d.toISOString().slice(0,10);
  });
  const thisWeekSessions=sessions.filter(s=>weekDates.includes(s.date));
  const weekVol=thisWeekSessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const weekSets=thisWeekSessions.reduce((a,s)=>a+(s.totalSets||0),0);
  return(
    <div style={{background:C.s1,borderRadius:20,padding:"20px",marginBottom:16}}>
      <div style={{fontFamily:F,fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Cette semaine</div>
      {/* 7 circles */}
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {days.map((d,i)=>{
          const date=weekDates[i];
          const done=sessions.find(s=>s.date===date);
          const isToday=date===todayKey();
          return(
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",
                background:done?C.blue:isToday?C.blueDim:"transparent",
                border:`2px solid ${done?C.blue:isToday?C.blue:C.s4}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                transition:`all 300ms ${E1}`}}>
                {done&&<span style={{fontFamily:F,fontSize:10,fontWeight:700,color:"#000"}}>✓</span>}
                {isToday&&!done&&<div style={{width:6,height:6,borderRadius:"50%",background:C.lime}}/>}
              </div>
              <span style={{fontFamily:F,fontSize:9,fontWeight:600,color:isToday?C.ink:C.ink4}}>{d}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:16,borderTop:`1px solid ${C.s3}`,paddingTop:14}}>
        <div>
          <div style={{fontFamily:F,fontSize:22,fontWeight:700,color:C.ink}}>{thisWeekSessions.length}<span style={{fontSize:13,fontWeight:400,color:C.ink4}}>/5</span></div>
          <div style={{fontFamily:F,fontSize:11,color:C.ink4}}>Séances</div>
        </div>
        {weekVol>0&&<div>
          <div style={{fontFamily:F,fontSize:22,fontWeight:700,color:C.ink}}>{Math.round(weekVol/1000*10)/10}<span style={{fontSize:13,fontWeight:400,color:C.ink4}}>t</span></div>
          <div style={{fontFamily:F,fontSize:11,color:C.ink4}}>Volume</div>
        </div>}
        {weekSets>0&&<div>
          <div style={{fontFamily:F,fontSize:22,fontWeight:700,color:C.ink}}>{weekSets}</div>
          <div style={{fontFamily:F,fontSize:11,color:C.ink4}}>Séries</div>
        </div>}
      </div>
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab({sessions,onSelect}){
  const[view,setView]=useState(new Date());
  const y=view.getFullYear(),m=view.getMonth();
  const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  const off=first===0?6:first-1;
  const MN=["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
  const DN=["L","M","M","J","V","S","D"];
  const dates=sessions.map(s=>s.date);
  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      <WeekSummary sessions={sessions}/>
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
                style={{aspectRatio:"1",borderRadius:8,background:done?C.blue:isToday?C.s3:"transparent",border:isToday&&!done?`1px solid ${C.s4}`:"none",display:"flex",alignItems:"center",justifyContent:"center",transition:`background 200ms ${E1}`}}>
                <span style={{fontSize:13,fontWeight:done||isToday?600:400,color:done?"#000":isToday?C.ink:C.ink4}}>{d}</span>
              </Tap>
            );
          })}
        </div>
      </div>
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>Séances récentes</div>
      {sessions.length===0&&<div style={{textAlign:"center",padding:"40px 0",fontSize:17,color:C.ink4}}>Aucune séance enregistrée.</div>}
      {sessions.slice().reverse().map((s,i)=>(
        <Tap key={i} onTap={()=>onSelect(s)} style={{background:C.s1,borderRadius:16,padding:"16px 18px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div style={{fontSize:17,fontWeight:600,color:C.ink}}>{s.dayLabel||s.day}</div>
            <div style={{display:"flex",gap:10}}>
              {s.score>0&&<span style={{fontSize:15,fontWeight:700,color:C.blue}}>{s.score}</span>}
              <span style={{fontSize:13,color:C.ink4}}>{s.date}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:14}}>
            {s.totalKg>0&&<span style={{fontSize:14,color:C.ink3}}>{s.totalKg.toLocaleString()}kg</span>}
            {s.duration>0&&<span style={{fontSize:14,color:C.ink3}}>{fmtDur(s.duration)}</span>}
            {s.totalSets>0&&<span style={{fontSize:14,color:C.ink3}}>{s.totalSets} séries</span>}
          </div>
        </Tap>
      ))}
    </div>
  );
}

// ─── STATS TAB ───────────────────────────────────────────────────────────────
function StatsTab({sessions,weights}){
  const total=sessions.length;
  const totalKg=sessions.reduce((a,s)=>a+(s.totalKg||0),0);
  const avgScore=total?Math.round(sessions.reduce((a,s)=>a+(s.score||0),0)/total):0;
  const best=sessions.reduce((b,s)=>(s.score||0)>(b?.score||0)?s:b,null);
  const pbs=Object.entries(weights).map(([id,kg])=>{
    const ex=DB.find(e=>e.id===id);if(!ex)return null;
    const oneRM=orm(kg,ex.reps);
    return{name:ex.name,kg,oneRM,m:ex.m};
  }).filter(Boolean).sort((a,b)=>(b.oneRM||0)-(a.oneRM||0));
  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      <WeekSummary sessions={sessions}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        {[{l:"Séances",v:total},{l:"Volume total",v:totalKg>0?`${(totalKg/1000).toFixed(1)}t`:"—"},{l:"Score moyen",v:avgScore||"—"},{l:"Meilleur",v:best?.score||"—"}].map(({l,v})=>(
          <div key={l} style={{background:C.s1,borderRadius:16,padding:"18px 16px"}}>
            <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>{l}</div>
            <div style={{fontSize:32,fontWeight:700,color:C.ink,letterSpacing:"-.02em"}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>Personal Bests</div>
      {pbs.length===0?<div style={{textAlign:"center",padding:"32px 0",fontSize:17,color:C.ink4}}>Enregistre des charges pendant tes séances.</div>:
        pbs.map((pb,i)=>(
          <div key={i} style={{background:C.s1,borderRadius:14,padding:"14px 18px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:15,fontWeight:600,color:C.ink,marginBottom:3}}>{pb.name}</div>
              <div style={{fontSize:13,color:C.ink3}}>{pb.m}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:700,color:C.ink}}>{pb.kg===0?"BW":`${pb.kg}kg`}</div>
              {pb.oneRM&&<div style={{fontSize:12,fontWeight:600,color:C.blue}}>1RM ~{pb.oneRM}kg</div>}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── SETTINGS TAB ────────────────────────────────────────────────────────────
function SettingsTab({excluded,onToggleExclude,onExport,onImport,onReset,profile}){
  const[showLib,setShowLib]=useState(false);
  const fileRef=useRef(null);
  return(
    <div style={{padding:"20px 20px 100px",maxWidth:600,margin:"0 auto",fontFamily:F}}>
      {/* Profile */}
      {profile?.name&&(
        <div style={{background:C.s1,borderRadius:16,padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:C.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:20,fontWeight:700,color:"#000"}}>{profile.name[0].toUpperCase()}</span>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:600,color:C.ink}}>{profile.name}</div>
            <div style={{fontSize:14,color:C.ink3}}>{profile.level||""}  {profile.equip?.slice(0,2).join(" · ")||""}</div>
          </div>
        </div>
      )}
      {/* Données */}
      <div style={{background:C.s1,borderRadius:16,overflow:"hidden",marginBottom:12}}>
        {[{l:"Exporter les données",a:onExport},{l:"Importer les données",a:()=>fileRef.current?.click()}].map(({l,a},i)=>(
          <Tap key={l} onTap={a} style={{padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:i===0?`1px solid ${C.s3}`:"none"}}>
            <span style={{fontSize:17,color:C.ink}}>{l}</span>
            <span style={{fontSize:17,color:C.blue}}>›</span>
          </Tap>
        ))}
      </div>
      <input ref={fileRef} type="file" accept=".json" style={{display:"none"}}
        onChange={e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>{try{onImport(JSON.parse(ev.target.result));}catch{alert("Fichier invalide.");}};r.readAsText(f);}}}/>
      {/* Exclusions */}
      <div style={{fontSize:12,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:10,marginTop:20}}>
        Exercices exclus {excluded.length>0&&`· ${excluded.length}`}
      </div>
      <Tap onTap={()=>setShowLib(o=>!o)} style={{background:C.s1,borderRadius:14,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showLib?0:12}}>
        <span style={{fontSize:17,color:C.ink}}>Gérer les exclusions · {DB.length} exo</span>
        <span style={{fontSize:17,color:C.blue,transform:showLib?"rotate(90deg)":"none",transition:`transform 200ms ${E1}`,display:"inline-block"}}>›</span>
      </Tap>
      {showLib&&(
        <div style={{background:C.s1,borderRadius:"0 0 14px 14px",overflow:"hidden",marginBottom:12,maxHeight:360,overflowY:"auto"}}>
          {DB.map((ex,i)=>(
            <div key={ex.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderTop:`1px solid ${C.s3}`,opacity:excluded.includes(ex.id)?.4:1}}>
              <div>
                <div style={{fontSize:14,fontWeight:500,color:C.ink}}>{ex.name}</div>
                <div style={{fontSize:12,color:C.ink4}}>{EQ[ex.eq]}</div>
              </div>
              <Tap onTap={()=>onToggleExclude(ex.id)} style={{padding:"5px 14px",borderRadius:980,border:`1px solid ${excluded.includes(ex.id)?C.green:C.s4}`,background:excluded.includes(ex.id)?C.greenDim:"transparent",transition:`all 150ms ${E1}`}}>
                <span style={{fontSize:12,fontWeight:600,color:excluded.includes(ex.id)?C.green:C.ink4}}>{excluded.includes(ex.id)?"Réactiver":"Exclure"}</span>
              </Tap>
            </div>
          ))}
        </div>
      )}
      {/* Reset */}
      <div style={{background:C.s1,borderRadius:14,overflow:"hidden"}}>
        <Tap onTap={()=>{if(window.confirm("Effacer toutes les données ?"))onReset();}} style={{padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:17,color:C.red}}>Effacer toutes les données</span>
          <span style={{fontSize:17,color:C.red}}>›</span>
        </Tap>
      </div>
      <div style={{fontSize:12,color:C.ink4,textAlign:"center",marginTop:28}}>SŌMA · S13 · {DB.length} exercices</div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function SomaApp(){
  const[tab,setTab]=useState("seance");
  const[dayIdx,setDayIdx]=useState(todayIdx());
  const[log,setLog]=useState({});
  const[weights,setWeights]=useState({});
  const[sessions,setSessions]=useState([]);
  const[excluded,setExcluded]=useState([]);
  const[aiOverride,setAiOverride]=useState(null);
  const[streak,setStreak]=useState(0);
  const[sessionActive,setSessionActive]=useState(false);
  const[showFeedback,setShowFeedback]=useState(false);
  const[showRegen,setShowRegen]=useState(false);
  const[showReport,setShowReport]=useState(null);
  const[showPicker,setShowPicker]=useState(null);
  const[fullScreenEx,setFullScreenEx]=useState(null);
  const[restLabel,setRestLabel]=useState("");
  const[sbReady,setSbReady]=useState(false);
  const[profile,setProfile]=useState(null);
  const[showOnboarding,setShowOnboarding]=useState(false);
  const[showCheckin,setShowCheckin]=useState(false);
  const[checkinDone,setCheckinDone]=useState(false);
  const[feelingScore,setFeelingScore]=useState(null);
  const clock=useStopwatch();
  const rest=useCountdown();

  // Load
  useEffect(()=>{
    const local=lsGet();
    if(local.log) setLog(local.log);
    if(local.weights) setWeights(local.weights);
    if(local.sessions){setSessions(local.sessions);computeStreak(local.sessions);}
    if(local.excluded) setExcluded(local.excluded);
    if(local.profile) setProfile(local.profile);
    else setShowOnboarding(true);
    // Show check-in if not done today
    if(local.lastCheckin!==todayKey()) setShowCheckin(true);
    if(sb){
      Promise.all([
        sb.from("sessions").select("*").eq("user_id",USER_ID).order("date",{ascending:false}),
        sb.from("personal_bests").select("*").eq("user_id",USER_ID),
      ]).then(([{data:sess},{data:pbs}])=>{
        if(sess?.length){setSessions(sess);computeStreak(sess);lsSet({...lsGet(),sessions:sess});}
        if(pbs?.length){const w={};pbs.forEach(pb=>{w[pb.exercise_id||pb.exercise_name]=pb.weight_kg;});setWeights(prev=>({...prev,...w}));}
        setSbReady(true);
      }).catch(()=>{});
    }
  },[]);

  function computeStreak(sess){
    const dates=(sess||[]).map(s=>s.date);let s=0;
    for(let i=0;i<60;i++){const d=new Date();d.setDate(d.getDate()-i);if(dates.includes(d.toISOString().slice(0,10)))s++;else break;}
    setStreak(s);
  }

  const persist=useCallback(updates=>{lsSet({...lsGet(),...updates});},[]);

  const saveLog=useCallback((key,val)=>{
    setLog(prev=>{const next={...prev,[key]:val};persist({log:next});return next;});
    if(val.weight) setWeights(prev=>{const exId=key.split("_s")[0];if(!prev[exId]||val.weight>prev[exId]){const next={...prev,[exId]:val.weight};persist({weights:next});return next;}return prev;});
  },[persist]);

  const saveWeight=useCallback((id,val)=>{setWeights(prev=>{const next={...prev,[id]:val};persist({weights:next});return next;});},[persist]);
  const toggleExclude=useCallback(id=>{setExcluded(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];persist({excluded:next});return next;});},[persist]);

  const handleOnboardingDone=data=>{
    setProfile(data);persist({profile:data});setShowOnboarding(false);
    if(lsGet().lastCheckin!==todayKey()) setShowCheckin(true);
  };

  const handleCheckin=val=>{
    setFeelingScore(val);setCheckinDone(true);setShowCheckin(false);
    persist({lastCheckin:todayKey(),lastFeeling:val});
  };

  const handleReplaceExercise=(replaced,newEx)=>{
    const day=PROGRAM[dayIdx];
    const src=aiOverride?.exercises||day.exercises||[];
    const newExos=src.map(ex=>ex.id===replaced.id?{...newEx,sets:ex.sets}:ex);
    setAiOverride(prev=>({...(prev||{titre:day.label,abs:day.abs}),exercises:newExos}));
    setShowPicker(null);setFullScreenEx(null);
  };

  const handleFeedbackSave=async fb=>{
    const day=PROGRAM[dayIdx];
    const exos=aiOverride?.exercises||day.exercises||[];
    let totalKg=0,totalSets=0;
    const exercisesData=exos.map(ex=>{
      const s=typeof ex.sets==="number"?ex.sets:4;
      let completedSets=0,lastWeight=0;
      Array.from({length:s},(_,i)=>{const e=log[`${ex.id}_s${i}`];if(e?.done){completedSets++;lastWeight=e.weight||0;const r=parseFloat(String(ex.reps||ex.defaultReps||"8").split("–")[0])||8;totalKg+=lastWeight*r;totalSets++;}});
      return{id:ex.id,name:ex.name,m:ex.m||ex.muscle,weight:lastWeight,completedSets};
    });
    const score=Math.round(Math.min(totalKg/5000*40,40)+Math.min(totalSets/25*30,30)+((fb.global+fb.energy)/10*30));
    const entry={day:day.day,dayLabel:aiOverride?.titre||day.label,date:todayKey(),exercises:exercisesData,totalKg:Math.round(totalKg),totalSets,duration:clock.sec,score,feedback:fb,user_id:USER_ID};
    if(sb){
      await sb.from("sessions").upsert({...entry,week:"S24",session_type:entry.dayLabel,completed:true,notes:fb.notes},{onConflict:"user_id,date"}).catch(()=>{});
      const{data:ex}=await sb.from("streaks").select("*").eq("user_id",USER_ID).single().catch(()=>({data:null}));
      const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
      const cur=ex?.last_session_date===yesterday?(ex.current_streak||0)+1:1;
      await sb.from("streaks").upsert({user_id:USER_ID,current_streak:cur,longest_streak:Math.max(cur,ex?.longest_streak||0),last_session_date:todayKey(),total_sessions:(ex?.total_sessions||0)+1,updated_at:new Date().toISOString()},{onConflict:"user_id"}).catch(()=>{});
      for(const e of exercisesData){
        if(e.weight>0) await sb.from("personal_bests").upsert({user_id:USER_ID,exercise_name:e.name,exercise_id:e.id,weight_kg:e.weight,reps:8,one_rm:orm(e.weight,"8"),achieved_at:todayKey()},{onConflict:"user_id,exercise_name"}).catch(()=>{});
      }
    }
    setSessions(prev=>{const next=[...prev.filter(s=>s.date!==todayKey()),entry];persist({sessions:next});computeStreak(next);return next;});
    setSessionActive(false);clock.reset();setShowFeedback(false);setShowReport(entry);
  };

  const lastWeightsPerEx=useMemo(()=>{
    const map={};
    sessions.slice().reverse().forEach(s=>{(s.exercises||[]).forEach(ex=>{if(ex.weight&&!map[ex.id])map[ex.id]=ex.weight;});});
    return map;
  },[sessions]);

  // Feeling-based accent
  const feelingAccent=feelingScore===5?C.lime:feelingScore===4?C.green:feelingScore===2?C.orange:feelingScore===1?C.red:C.blue;

  const day=PROGRAM[dayIdx];
  const isRest=!day?.salle;
  const exos=(aiOverride?.exercises||day?.exercises||[]).filter(e=>!excluded.includes(e.id));
  const absExos=aiOverride?.abs||day?.abs||[];
  const NAV=[{id:"seance",label:"Séance"},{id:"stats",label:"Stats"},{id:"history",label:"Historique"},{id:"settings",label:"Réglages"}];

  return(
    <div style={{background:C.bg,minHeight:"100dvh",color:C.ink,fontFamily:F,overflowX:"hidden"}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;}
        body{margin:0;background:${C.bg};}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        textarea::placeholder,input::placeholder{color:${C.ink5};}
        ::-webkit-scrollbar{display:none;}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}
      `}</style>

      {/* OVERLAYS PRIORITY */}
      {showOnboarding&&<Onboarding onDone={handleOnboardingDone}/>}
      {!showOnboarding&&showCheckin&&!checkinDone&&<DailyCheckin onDone={handleCheckin}/>}

      {/* TOP BAR */}
      <div style={{background:"rgba(0,0,0,.90)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${C.s3}`,padding:`calc(14px + env(safe-area-inset-top)) 20px 12px`,position:"sticky",top:0,zIndex:200,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontFamily:F,fontSize:22,fontWeight:700,color:C.ink,letterSpacing:"-.04em"}}>SŌMA</div>
          <div style={{fontFamily:F,fontSize:10,fontWeight:600,color:C.ink4,letterSpacing:".16em",textTransform:"uppercase"}}>S24 · {profile?.name||"Programme Hybride"}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {sessionActive&&<span style={{fontFamily:F,fontSize:15,fontWeight:700,color:C.red}}>{fmtDur(clock.sec)}</span>}
          {feelingScore&&<div style={{width:8,height:8,borderRadius:"50%",background:feelingAccent,transition:`background 300ms ${E1}`}}/>}
          {streak>0&&<span style={{fontFamily:F,fontSize:13,fontWeight:600,color:C.orange,padding:"4px 12px",borderRadius:980,background:C.orangeDim}}>{streak}j</span>}
          {sbReady&&<div style={{width:6,height:6,borderRadius:"50%",background:C.green}}/>}
        </div>
      </div>

      {/* DAY STRIP */}
      {tab==="seance"&&(
        <div style={{background:C.bg,borderBottom:`1px solid ${C.s3}`,display:"flex",overflowX:"auto",padding:"10px 16px",gap:6,scrollbarWidth:"none"}}>
          {PROGRAM.map((d,i)=>{
            const exList=d.exercises||[];
            const done=exList.filter(e=>Array.from({length:typeof e.sets==="number"?e.sets:4},(_,si)=>si).every(si=>log[`${e.id}_s${si}`]?.done)).length;
            const pct=exList.length?done/exList.length:0;
            const isSel=i===dayIdx,isToday=i===todayIdx();
            return(
              <Tap key={i} onTap={()=>{setDayIdx(i);setAiOverride(null);}} style={{flexShrink:0,minWidth:52,padding:"10px 6px",textAlign:"center",borderRadius:12,background:isSel?C.s2:"transparent",border:`1px solid ${isSel?C.s4:"transparent"}`,transition:`all 200ms ${E1}`}}>
                <div style={{fontFamily:F,fontSize:10,fontWeight:600,color:isSel?C.ink2:C.ink4,letterSpacing:".06em",marginBottom:4}}>{d.day}</div>
                {isToday&&<div style={{width:6,height:6,borderRadius:"50%",background:C.lime,margin:"0 auto 4px"}}/>}
                {d.salle&&pct>0&&<div style={{width:"70%",height:2,background:C.s4,borderRadius:1,margin:"0 auto"}}>
                  <div style={{width:`${pct*100}%`,height:2,background:feelingAccent,borderRadius:1,transition:`width 400ms ${E1}`}}/>
                </div>}
              </Tap>
            );
          })}
        </div>
      )}

      {/* CONTENT */}
      <div style={{paddingBottom:80}}>
        {tab==="seance"&&(
          <div style={{padding:"16px 20px 0",maxWidth:600,margin:"0 auto"}}>
            {isRest?(
              <div style={{textAlign:"center",padding:"80px 20px",animation:`fadeIn 200ms ${E1}`}}>
                <div style={{fontSize:36,fontWeight:700,color:C.ink4,letterSpacing:"-.02em",marginBottom:14}}>Récupération</div>
                <div style={{fontSize:17,color:C.ink4,lineHeight:1.65,maxWidth:300,margin:"0 auto 28px"}}>{dayIdx===3?"Récupération musculaire active.":"Reset complet. Synthèse protéique prioritaire."}</div>
                <Tap onTap={()=>setShowRegen(true)} style={{display:"inline-flex",padding:"13px 24px",borderRadius:980,border:`1px solid ${C.s4}`,background:"transparent"}}>
                  <span style={{fontFamily:F,fontSize:15,fontWeight:600,color:C.ink3}}>Générer une séance légère</span>
                </Tap>
              </div>
            ):(
              <>
                {/* Header */}
                <div style={{marginBottom:20,animation:`fadeIn 200ms ${E1}`}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".14em",marginBottom:8}}>{day.day} · S24 · {day.salle==="haut"?"Salle Haute":"Salle Basse"}</div>
                  <div style={{fontSize:36,fontWeight:700,color:C.ink,letterSpacing:"-.02em",lineHeight:1.05,marginBottom:8}}>{aiOverride?.titre||day.label}</div>
                  <div style={{fontSize:17,color:C.ink3}}>{day.muscle}</div>
                  {feelingScore&&feelingScore!==3&&(
                    <div style={{marginTop:12,padding:"10px 14px",borderRadius:12,background:feelingAccent+"18",animation:`fadeIn 200ms ${E1} both`}}>
                      <span style={{fontSize:13,fontWeight:600,color:feelingAccent}}>
                        {feelingScore>=4?"C'est le moment de pousser.":feelingScore<=2?"Adapte le volume aujourd'hui.":"Tu es dans la zone."}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                {!sessionActive?(
                  <div style={{display:"flex",gap:10,marginBottom:24}}>
                    <Tap onTap={()=>{setSessionActive(true);clock.start();}} style={{flex:1,padding:"16px",borderRadius:15,background:feelingAccent,display:"flex",alignItems:"center",justifyContent:"center",transition:`background 300ms ${E1}`}}>
                      <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:"#000"}}>Démarrer</span>
                    </Tap>
                    <Tap onTap={()=>setShowRegen(true)} style={{padding:"16px 20px",borderRadius:15,border:`1px solid ${C.s4}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:F,fontSize:14,fontWeight:600,color:C.ink3}}>IA</span>
                    </Tap>
                  </div>
                ):(
                  <div style={{display:"flex",gap:10,marginBottom:24}}>
                    <div style={{flex:1,padding:"15px",borderRadius:15,background:C.redDim,border:`1px solid ${C.red}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:F,fontSize:17,fontWeight:700,color:C.red}}>{fmtDur(clock.sec)}</span>
                    </div>
                    <Tap onTap={()=>{clock.stop();setShowFeedback(true);}} style={{flex:2,padding:"15px",borderRadius:15,background:C.s2,border:`1px solid ${C.s4}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:C.ink2}}>Terminer</span>
                    </Tap>
                    <Tap onTap={()=>setShowRegen(true)} style={{padding:"15px 16px",borderRadius:15,border:`1px solid ${C.s4}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:F,fontSize:13,fontWeight:600,color:C.ink3}}>IA</span>
                    </Tap>
                  </div>
                )}

                {/* Warmup */}
                <div style={{paddingLeft:16,borderLeft:`2px solid ${C.s3}`,marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Échauffement · 8 min</div>
                  <div style={{fontSize:14,color:C.ink3,lineHeight:1.75}}>{day.salle==="haut"?"Rotations épaules · Wall slide · Push-up to downdog · Mobilité thoracique":"Corde 3min · Hip circle · Leg swing · KB Swing léger ×10"}</div>
                </div>

                {/* Exercises */}
                <div style={{borderTop:`1px solid ${C.s3}`}}>
                  {exos.map((ex,i)=>(
                    <ExRow key={ex.id} ex={ex} idx={i}
                      weight={weights[ex.id]??ex.kg??0}
                      onWeightChange={saveWeight}
                      log={log}
                      onLogSet={saveLog}
                      onStartRest={(s,n)=>{setRestLabel(n);rest.start(s);}}
                      lastWeight={lastWeightsPerEx[ex.id]||null}
                      onFullScreen={ex=>setFullScreenEx(ex)}
                    />
                  ))}
                </div>

                {/* Abs */}
                {absExos.length>0&&(
                  <div style={{marginTop:24,paddingTop:20,borderTop:`1px solid ${C.s3}`}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.ink4,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16}}>Abdominaux</div>
                    {absExos.map(a=>(
                      <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:`1px solid ${C.s3}`}}>
                        <span style={{fontSize:17,fontWeight:400,color:C.ink}}>{a.name}</span>
                        <span style={{fontSize:15,fontWeight:600,color:C.ink3}}>{a.vol}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* End CTA */}
                {!sessionActive&&(
                  <Tap onTap={()=>setShowFeedback(true)} style={{marginTop:28,marginBottom:16,padding:"16px",borderRadius:15,background:C.s2,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontFamily:F,fontSize:17,fontWeight:600,color:C.ink3}}>Rapport de séance</span>
                  </Tap>
                )}
              </>
            )}
          </div>
        )}
        {tab==="stats"&&<StatsTab sessions={sessions} weights={weights}/>}
        {tab==="history"&&<HistoryTab sessions={sessions} onSelect={setShowReport}/>}
        {tab==="settings"&&<SettingsTab excluded={excluded} onToggleExclude={toggleExclude} profile={profile}
          onExport={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(lsGet(),null,2)],{type:"application/json"}));a.download=`SOMA-backup-${todayKey()}.json`;a.click();}}
          onImport={d=>{lsSet(d);if(d.log)setLog(d.log);if(d.weights)setWeights(d.weights);if(d.sessions){setSessions(d.sessions);computeStreak(d.sessions);}if(d.excluded)setExcluded(d.excluded);if(d.profile)setProfile(d.profile);alert("Restauré.");}}
          onReset={()=>{lsSet({});setLog({});setWeights({});setSessions([]);setExcluded([]);setStreak(0);setProfile(null);setCheckinDone(false);setFeelingScore(null);setShowOnboarding(true);}}
        />}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:300,background:"rgba(0,0,0,.92)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:`1px solid ${C.s3}`,display:"flex",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {NAV.map(({id,label})=>(
          <Tap key={id} onTap={()=>setTab(id)} style={{flex:1,padding:"10px 4px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{width:20,height:2,borderRadius:1,background:tab===id?feelingAccent:"transparent",marginBottom:2,transition:`background 250ms ${E1}`}}/>
            <span style={{fontFamily:F,fontSize:11,fontWeight:tab===id?600:400,color:tab===id?C.ink:C.ink4,transition:`color 250ms ${E1}`}}>{label}</span>
          </Tap>
        ))}
      </div>

      {/* OVERLAYS */}
      <RestOverlay timer={rest} label={restLabel}/>
      {fullScreenEx&&<ExerciseFullScreen ex={fullScreenEx} weight={weights[fullScreenEx.id]??fullScreenEx.kg??0} onWeightChange={saveWeight} log={log} onLogSet={saveLog} onStartRest={(s,n)=>{setRestLabel(n);rest.start(s);}} onClose={()=>setFullScreenEx(null)} lastWeight={lastWeightsPerEx[fullScreenEx.id]||null} dayAccent={feelingAccent}/>}
      {showFeedback&&<FeedbackSheet onClose={()=>setShowFeedback(false)} onSave={handleFeedbackSave}/>}
      {showRegen&&<RegenSheet onClose={()=>setShowRegen(false)} onResult={o=>{setAiOverride(o);setShowRegen(false);}} excluded={excluded}/>}
      {showPicker&&<ExPicker onSelect={newEx=>handleReplaceExercise(showPicker,newEx)} onClose={()=>setShowPicker(null)} currentId={showPicker.id} excluded={excluded}/>}
      {showReport&&<SessionReport session={showReport} onClose={()=>setShowReport(null)}/>}
    </div>
  );
}
