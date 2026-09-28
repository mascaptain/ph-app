// 'rounds' : N tours pour le temps, avec un plafond — le format des Hero.
const formats=['classique','amrap','emom','rounds'];
const units=['reps','s','m','cal'];
const number=(v,min,max,integer=false)=>v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max&&(!integer||Number.isInteger(Number(v)));
export function validateWorkout(w) {
  const errors=[];
  if(!w?.name?.trim()||w.name.trim().length>80) errors.push('Donne un nom de 1 à 80 caractères.');
  if(!formats.includes(w?.format)) errors.push('Choisis un format.');
  if(!number(w?.durationMin,1,240,true)) errors.push('La durée doit être un entier entre 1 et 240 minutes.');
  if(w?.format==='rounds'&&!number(w?.rounds,1,100,true)) errors.push('Indique un nombre de tours entre 1 et 100.');
  const moves=Array.isArray(w?.moves)?w.moves:[];
  if(!moves.length||moves.length>20) errors.push('Ajoute entre 1 et 20 exercices.');
  moves.forEach((m,i)=>{
    const label=`Exercice ${i+1}`;
    if(!m.name?.trim()||m.name.trim().length>100) errors.push(`${label} : nom requis (100 caractères maximum).`);
    if(!units.includes(m.unit)||!number(m.quantity,1,10000,true)) errors.push(`${label} : quantité entière et unité requises.`);
    if(!number(m.kg,0,500)) errors.push(`${label} : charge entre 0 et 500 kg.`);
    if(w.format==='classique'&&(!number(m.sets,1,30,true)||!number(m.restSec,0,600,true))) errors.push(`${label} : séries (1–30) et repos (0–600 s) invalides.`);
    if(w.format==='emom'&&m.unit==='s'&&Number(m.quantity)>50) errors.push(`${label} : limite à 50 s pour garder une transition dans la minute.`);
  });
  if(w?.format==='emom'&&moves.length&&Number(w.durationMin)%moves.length!==0) errors.push('En EMOM, la durée doit être un multiple du nombre d’exercices : une station par minute.');
  return errors;
}
export function normalizeWorkout(w) {
  const errors=validateWorkout(w);if(errors.length) throw new Error(errors.join(' '));
  if(!w.id) throw new Error('Identifiant manquant.');
  return {id:w.id,name:w.name.trim(),format:w.format,durationMin:Number(w.durationMin),
    ...(w.format==='rounds'?{rounds:Number(w.rounds)}:{}),
    moves:w.moves.map(m=>({name:m.name.trim(),quantity:Number(m.quantity),unit:m.unit,kg:Number(m.kg),sets:w.format==='classique'?Number(m.sets):1,restSec:w.format==='classique'?Number(m.restSec):0}))};
}
export function customWorkoutDay(input,day='') {
  const workout=normalizeWorkout(input),timed=workout.format!=='classique';
  const exercises=workout.moves.map((m,i)=>({id:`custom_${workout.id}_${i}`,n:m.name,m:'Personnalisé',eq:m.kg?'db':'bw',kg:m.kg,
    sets:m.sets,reps:`${m.quantity}${m.unit==='reps'?'':m.unit}`,rest:m.restSec,role:'custom',v5:true,
    ...(timed?{blockIdx:0,modeTag:workout.format==='rounds'?'TOURS':workout.format.toUpperCase(),[workout.format==='emom'?'repsPerMinute':'repsPerRound']:m.quantity}:{})}));
  // Un format « tours pour le temps » se joue comme un AMRAP a tours manuels,
  // avec un objectif de tours et un plafond de temps — exactement comme un Hero.
  const kind=workout.format==='emom'?'emom':'amrap';
  const blocks=timed?[{label:workout.name,kind,execution:kind==='emom'?'minute_stations':'manual_rounds',
    cadenceSec:kind==='emom'?60:0,durationMin:workout.durationMin,
    rounds:kind==='emom'?workout.durationMin/exercises.length:(workout.rounds||0),exercises}]:[];
  return {v5:true,customWorkout:workout,day,label:workout.name,muscle:'Entraînement personnel',salle:'full',archetype:'custom',
    recommendedMode:timed?kind:'classique',mode:timed?kind:'classique',metcon:timed,blocks,exercises,abs:[],
    totalMin:workout.durationMin,timeCapMin:workout.durationMin,emomMinutes:workout.durationMin};
}
