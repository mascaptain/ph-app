import React,{useState} from 'react';
import {normalizeWorkout,validateWorkout} from './custom-workouts.js';
const movement=()=>({name:'',quantity:10,unit:'reps',kg:0,sets:3,restSec:60});
export default function WorkoutComposer({workouts=[],onSave,onLaunch,colors:C}) {
  const [draft,setDraft]=useState(null),[step,setStep]=useState(0),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [launchId,setLaunchId]=useState(null);
  const field={width:'100%',boxSizing:'border-box',padding:12,borderRadius:12,border:`1px solid ${C.div}`,background:C.s1,color:C.ink,font:'inherit'};
  const button={...field,cursor:'pointer',fontWeight:600,marginTop:10};
  const edit=(key,value)=>setDraft(d=>({...d,[key]:value}));
  const editMove=(index,key,value)=>setDraft(d=>({...d,moves:d.moves.map((m,i)=>i===index?{...m,[key]:value}:m)}));
  function open(workout) {setDraft(workout?structuredClone(workout):{id:crypto.randomUUID(),name:'',format:'classique',durationMin:45,moves:[movement()]});setStep(0);setMessage('');setLaunchId(null);}
  async function save() {
    setBusy(true);setMessage('');
    try {const workout=normalizeWorkout(draft);const result=await onSave({custom_workouts:[...workouts.filter(w=>w.id!==workout.id),workout]});
      if(result?.error) throw result.error;setDraft(null);setMessage('Entraînement enregistré dans ta bibliothèque. Aucune séance du programme n’a été validée.');
    } catch(error) {setMessage(error.message||'Enregistrement impossible.');} finally {setBusy(false);}
  }
  async function launch(workout) {
    setBusy(true);setMessage('');
    try {await onLaunch(workout);} catch(error) {setMessage(error.message||'Impossible de préparer la séance.');}
    finally {setBusy(false);setLaunchId(null);}
  }
  function next() {
    const errors=validateWorkout(draft);
    if(step===0) {
      const basics=errors.filter(e=>e.startsWith('Donne')||e.startsWith('Choisis')||e.startsWith('La durée'));
      if(basics.length){setMessage(basics.join(' '));return;}
    } else if(errors.length){setMessage(errors.join(' '));return;}
    setMessage('');setStep(s=>s+1);
  }
  return <section aria-label="Compositeur d’entraînement" style={{padding:18,borderRadius:22,background:C.card,color:C.ink,marginBottom:12,border:`1px solid ${C.s2}`}}>
    <h3 style={{margin:'0 0 8px'}}>Mes entraînements</h3>
    {!draft?<>
      <p style={{fontSize:13}}>Compose une séance classique, un AMRAP ou un EMOM. La création seule ne change pas ta progression.</p>
      <button style={{...button,background:C.accent}} disabled={busy} onClick={()=>open(null)}>Créer un entraînement</button>
      {workouts.map(w=><article key={w.id} style={{marginTop:14,padding:12,borderRadius:14,background:C.s1}}>
        <strong>{w.name}</strong><div>{w.format.toUpperCase()} · {w.durationMin} min{w.format==='classique'?' estimées':''} · {w.moves.length} exercices</div>
        <button style={button} disabled={busy} onClick={()=>open(w)}>Modifier</button>
        {launchId!==w.id?<button style={button} disabled={busy} onClick={()=>setLaunchId(w.id)}>Utiliser aujourd’hui</button>:<>
          <p>Cette séance remplacera la séance du programme en attente pour aujourd’hui. À sa validation, elle comptera comme une séance du programme. Aucun changement avant confirmation.</p>
          <button style={{...button,background:C.accent}} disabled={busy} onClick={()=>launch(w)}>Confirmer le remplacement</button>
          <button style={button} disabled={busy} onClick={()=>setLaunchId(null)}>Annuler</button>
        </>}
      </article>)}
    </>:<>
      <p>Étape {step+1}/3 · {['Format et durée','Exercices','Vérification'][step]}</p>
      <fieldset disabled={busy} style={{border:0,padding:0,margin:0,display:'grid',gap:12}}>
      {step===0&&<>
        <label>Nom<input style={field} maxLength={80} value={draft.name} onChange={e=>edit('name',e.target.value)}/></label>
        <label>Format<select style={field} value={draft.format} onChange={e=>edit('format',e.target.value)}><option value="classique">Classique — séries et repos</option><option value="amrap">AMRAP — tours libres</option><option value="emom">EMOM — une station par minute</option></select></label>
        <label>{draft.format==='classique'?'Durée prévue (indicative)':'Durée du bloc chronométré'} en minutes<input style={field} type="number" min="1" max="240" step="1" value={draft.durationMin} onChange={e=>edit('durationMin',e.target.value)}/></label>
        <p style={{fontSize:13}}>{draft.format==='emom'?'Passage automatique à l’exercice suivant toutes les 60 secondes. Prévois des objectifs réalisables avec du temps pour la transition.':draft.format==='amrap'?'Le chrono continue ; tu valides les mouvements et les tours réalisés manuellement.':'Chaque série se valide manuellement ; le repos utilise son propre minuteur. La durée prévue ne coupe pas la séance.'}</p>
      </>}
      {step===1&&<>
        {draft.moves.map((m,i)=><div key={i} style={{border:`1px solid ${C.div}`,borderRadius:14,padding:12,display:'grid',gap:10}}>
          <strong>Exercice {i+1}{draft.format==='emom'?` · minute ${i+1}`:''}</strong>
          <label>Nom<input style={field} maxLength={100} value={m.name} onChange={e=>editMove(i,'name',e.target.value)}/></label>
          <label>Quantité<input style={field} type="number" min="1" step="1" value={m.quantity} onChange={e=>editMove(i,'quantity',e.target.value)}/></label>
          <label>Unité<select style={field} value={m.unit} onChange={e=>editMove(i,'unit',e.target.value)}><option value="reps">Répétitions</option><option value="s">Secondes</option><option value="m">Mètres</option><option value="cal">Calories</option></select></label>
          <label>Charge additionnelle (kg, 0 = sans charge)<input style={field} type="number" min="0" max="500" step="0.5" value={m.kg} onChange={e=>editMove(i,'kg',e.target.value)}/></label>
          {draft.format==='classique'&&<><label>Séries<input style={field} type="number" min="1" max="30" value={m.sets} onChange={e=>editMove(i,'sets',e.target.value)}/></label><label>Repos entre séries (secondes)<input style={field} type="number" min="0" max="600" value={m.restSec} onChange={e=>editMove(i,'restSec',e.target.value)}/></label></>}
          <button style={button} disabled={i===0} onClick={()=>{const moves=[...draft.moves];[moves[i-1],moves[i]]=[moves[i],moves[i-1]];edit('moves',moves);}}>Monter</button>
          <button style={button} onClick={()=>edit('moves',draft.moves.filter((_,j)=>j!==i))}>Retirer cet exercice</button>
        </div>)}
        <button style={button} disabled={draft.moves.length>=20} onClick={()=>edit('moves',[...draft.moves,movement()])}>Ajouter un exercice</button>
      </>}
      {step===2&&<div><h4>{draft.name}</h4><p>{draft.format.toUpperCase()} · {draft.durationMin} min{draft.format==='classique'?' estimées, hors échauffement':''}</p>
        <ol>{draft.moves.map((m,i)=><li key={i}>{m.name} — {draft.format==='classique'?`${m.sets} × `:''}{m.quantity} {m.unit} · {m.kg} kg{draft.format==='classique'?` · repos ${m.restSec} s`:''}</li>)}</ol>
        <p>Un échauffement standard sera proposé séparément. Les objectifs saisis ne sont pas une validation de leur adéquation à une blessure.</p>
      </div>}
      {step>0&&<button style={button} onClick={()=>{setMessage('');setStep(s=>s-1);}}>Précédent</button>}
      {step<2?<button style={{...button,background:C.accent}} onClick={next}>Continuer</button>:<button style={{...button,background:C.accent}} onClick={save}>Enregistrer l’entraînement</button>}
      <button style={button} onClick={()=>{setDraft(null);setMessage('Brouillon abandonné, bibliothèque inchangée.');}}>Annuler les modifications</button>
      </fieldset>
    </>}
    <p role="status" aria-live="polite">{busy?'Enregistrement…':message}</p>
  </section>;
}
