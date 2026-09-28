// Séances composées par l'utilisateur.
//
// Formats :
//   classique  séries et repos, exercice par exercice
//   amrap      le plus de tours possible dans le temps
//   emom       une station par minute
//   rounds     N tours d'une séquence, avec repos entre les tours
//   fortime    la séquence (N tours, souvent 1) le plus vite possible, avec un plafond
//
// Un mouvement marqué `link` s'enchaîne avec le précédent : « 5 squats + arnold
// press » forme UNE station, faite d'une traite. Sans cette notion, un complexe
// devenait deux exercices séparés et le compte des tours était faux.
const formats=['classique','amrap','emom','rounds','fortime'];
const units=['reps','s','m','cal'];
const UNIT_LABEL={reps:'',s:' s',m:' m',cal:' cal'};
const number=(v,min,max,integer=false)=>v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max&&(!integer||Number.isInteger(Number(v)));
const hasRounds=f=>f==='rounds'||f==='fortime';

// Regroupe les mouvements en stations : un mouvement lié rejoint la station précédente.
export function stationsOf(moves=[]) {
  const out=[];
  moves.forEach((m,i)=>{if(m.link&&out.length&&i>0) out[out.length-1].push(m);else out.push([m]);});
  return out;
}
const qty=m=>`${m.quantity}${UNIT_LABEL[m.unit]??''}`;
// « 5 Squats + Arnold press » si les quantités sont égales, sinon « 5 Squats + 10 Arnold press ».
export function stationLabel(station) {
  if(station.length===1) return {name:station[0].name,reps:qty(station[0])};
  const same=station.every(m=>m.quantity===station[0].quantity&&m.unit===station[0].unit);
  return same?{name:station.map(m=>m.name).join(' + '),reps:qty(station[0])}
    :{name:station.map(m=>`${qty(m)} ${m.name}`).join(' + '),reps:''};
}
// Volume d'un tour et de la séance, par unité : « 30 reps · 200 m ».
export function workoutVolume(w) {
  const perRound={};
  (w.moves||[]).forEach(m=>{const q=Number(m.quantity)||0;const k=m.unit||'reps';perRound[k]=(perRound[k]||0)+q*(w.format==='classique'?Number(m.sets)||1:1);});
  const rounds=hasRounds(w.format)?Math.max(1,Number(w.rounds)||1):1;
  const total=Object.fromEntries(Object.entries(perRound).map(([k,v])=>[k,v*rounds]));
  return {perRound,total,rounds};
}

// Saisie rapide : une ligne = une station. « 5 squats + arnold press »,
// « 40 burpees », « 200 m rameur », « 30 s gainage », « 15 cal bike ».
const LINE_RE=/^\s*(\d+)\s*(?:(reps?|répétitions?|s|sec|secondes?|m|mètres?|cal|calories?)(?=\s|$))?\s*(?:x\s*)?(.*)$/i;
const unitOf=u=>!u?'reps':/^s|^sec/i.test(u)?'s':/^m/i.test(u)?'m':/^cal/i.test(u)?'cal':'reps';
export function parseQuickEntry(text) {
  const moves=[],skipped=[];
  String(text||'').split(/\n|;/).map(l=>l.trim()).filter(Boolean).forEach(line=>{
    let last=null;
    line.split(/\s*\+\s*/).filter(Boolean).forEach((part,k)=>{
      const m=part.match(LINE_RE);
      const withQty=m&&m[3].trim();
      const q=withQty?Number(m[1]):last?last.quantity:null;
      const unit=withQty?unitOf(m[2]):last?last.unit:'reps';
      const name=(withQty?m[3]:part).trim().replace(/^de\s+/i,'');
      if(!q||!name){skipped.push(part);return;}
      last={name:name.charAt(0).toUpperCase()+name.slice(1),quantity:q,unit,kg:0,sets:3,restSec:60,link:k>0};
      moves.push(last);
    });
  });
  return {moves,skipped};
}

export function validateWorkout(w) {
  const errors=[];
  if(!w?.name?.trim()||w.name.trim().length>80) errors.push('Donne un nom de 1 à 80 caractères.');
  if(!formats.includes(w?.format)) errors.push('Choisis un format.');
  if(!number(w?.durationMin,1,240,true)) errors.push('La durée doit être un entier entre 1 et 240 minutes.');
  if(hasRounds(w?.format)&&!number(w?.rounds,1,100,true)) errors.push('Indique un nombre de tours entre 1 et 100.');
  if(w?.format==='rounds'&&!number(w?.roundRestSec??0,0,600,true)) errors.push('Le repos entre les tours va de 0 à 600 secondes.');
  const moves=Array.isArray(w?.moves)?w.moves:[];
  if(!moves.length||moves.length>30) errors.push('Ajoute entre 1 et 30 mouvements.');
  moves.forEach((m,i)=>{
    const label=`Mouvement ${i+1}`;
    if(!m.name?.trim()||m.name.trim().length>100) errors.push(`${label} : nom requis (100 caractères maximum).`);
    if(!units.includes(m.unit)||!number(m.quantity,1,10000,true)) errors.push(`${label} : quantité entière et unité requises.`);
    if(!number(m.kg,0,500)) errors.push(`${label} : charge entre 0 et 500 kg.`);
    if(w.format==='emom'&&m.unit==='s'&&Number(m.quantity)>50) errors.push(`${label} : limite à 50 s pour garder une transition dans la minute.`);
    if(w.format==='classique'&&!m.link&&(!number(m.sets,1,30,true)||!number(m.restSec,0,600,true))) errors.push(`${label} : séries (1–30) et repos (0–600 s) invalides.`);
  });
  const stations=stationsOf(moves);
  if(w?.format==='emom'&&stations.length&&Number(w.durationMin)%stations.length!==0) errors.push('En EMOM, la durée doit être un multiple du nombre de stations : une station par minute.');
  return errors;
}
export function normalizeWorkout(w) {
  const errors=validateWorkout(w);if(errors.length) throw new Error(errors.join(' '));
  if(!w.id) throw new Error('Identifiant manquant.');
  const classic=w.format==='classique';
  return {id:w.id,name:w.name.trim(),format:w.format,durationMin:Number(w.durationMin),
    ...(hasRounds(w.format)?{rounds:Number(w.rounds)}:{}),
    ...(w.format==='rounds'?{roundRestSec:Number(w.roundRestSec??0)}:{}),
    moves:w.moves.map((m,i)=>({name:m.name.trim(),quantity:Number(m.quantity),unit:m.unit,kg:Number(m.kg),
      sets:classic?Number(m.sets)||1:1,restSec:classic?Number(m.restSec)||0:0,...(m.link&&i>0?{link:true}:{})}))};
}
export function customWorkoutDay(input,day='') {
  const workout=normalizeWorkout(input),f=workout.format,timed=f!=='classique';
  const stations=stationsOf(workout.moves);
  // Une station devient un « exercice » du lecteur : un complexe se valide d'un geste.
  const exercises=stations.map((st,i)=>{const {name,reps}=stationLabel(st);const kg=Math.max(...st.map(m=>m.kg||0));
    return {id:`custom_${workout.id}_${i}`,n:name,m:'Personnalisé',eq:kg?'db':'bw',kg,
      sets:st[0].sets,reps,rest:st[0].restSec,role:'custom',v5:true,
      ...(timed?{blockIdx:0,modeTag:{amrap:'AMRAP',emom:'EMOM',rounds:'TOURS',fortime:'CHRONO'}[f],[f==='emom'?'repsPerMinute':'repsPerRound']:st[0].quantity}:{})};});
  const kind=f==='emom'?'emom':f==='rounds'?'circuit':'amrap';
  const blocks=timed?[{label:workout.name,kind,
    execution:kind==='emom'?'minute_stations':'manual_rounds',cadenceSec:kind==='emom'?60:0,durationMin:workout.durationMin,
    rounds:kind==='emom'?workout.durationMin/exercises.length:(workout.rounds||0),
    // Tours avec repos : le lecteur « circuit » enchaîne les stations puis lance le repos.
    ...(f==='rounds'?{tours:workout.rounds,restSec:workout.roundRestSec||0}:{}),
    // Pour le temps : le chrono s'arrête quand le dernier tour est validé.
    ...(f==='fortime'?{targetRounds:workout.rounds}:{}),exercises}]:[];
  return {v5:true,customWorkout:workout,day,label:workout.name,muscle:'Entraînement personnel',salle:'full',archetype:'custom',
    recommendedMode:timed?kind:'classique',mode:timed?kind:'classique',metcon:timed,blocks,exercises,abs:[],
    totalMin:workout.durationMin,timeCapMin:workout.durationMin,emomMinutes:workout.durationMin};
}
// Résumé court, partagé par la bibliothèque, l'écran Hero et le créateur.
export function workoutSummary(w) {
  const r=Number(w.rounds)||1;
  if(w.format==='rounds') return `${r} tours${Number(w.roundRestSec)?` · repos ${w.roundRestSec} s`:''}`;
  if(w.format==='fortime') return `${r>1?`${r} tours p`:'P'}our le temps · ${w.durationMin} min max`;
  if(w.format==='classique') return `Classique · ~${w.durationMin} min`;
  return `${w.format==='emom'?'EMOM':'AMRAP'} ${w.durationMin} min`;
}
