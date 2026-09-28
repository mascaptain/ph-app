import React,{useState} from 'react';
import {addPause,pauseOn,resumePause,shiftDate} from './training-pause.js';
export default function PauseSettings({pauses=[],today,onSave,colors:C,busyWorkout=false}) {
  const [reason,setReason]=useState('vacances'),[start,setStart]=useState(today),[end,setEnd]=useState(today);
  const [openEnded,setOpenEnded]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const active=pauseOn(pauses,today),upcoming=pauses.filter(p=>!p.cancelled&&p.start>today);
  const input={width:'100%',boxSizing:'border-box',padding:12,borderRadius:12,border:`1px solid ${C.div}`,background:C.s1,color:C.ink,font:'inherit'};
  async function save(make) {
    setMessage('');setBusy(true);
    try {const result=await onSave({training_pauses:make()});if(result?.error) throw result.error;setMessage('Pause enregistrée. La progression est conservée.');}
    catch(error) {setMessage(error.message||'Enregistrement impossible. Réessaie.');} finally {setBusy(false);}
  }
  const btn={...input,background:C.accent,color:C.ink,fontWeight:600,cursor:'pointer',marginTop:12};
  return <section aria-label="Pause du programme" style={{background:C.card,color:C.ink,padding:18,borderRadius:22,marginBottom:12,border:`1px solid ${C.s2}`}}>
    <h3 style={{margin:'0 0 8px'}}>Pause vacances / blessure</h3>
    <p style={{fontSize:13,lineHeight:1.5}}>Les séances en attente sont conservées dans leur ordre. Aucun retard ni séance réalisée ne sera ajouté pendant la pause.</p>
    {active&&<div><strong>{active.reason==='blessure'?'Pause blessure':'Vacances'}</strong><p>{active.end?`Jusqu’au ${active.end} inclus. Reprise des créneaux à partir du ${shiftDate(active.end,1)}.`:'Sans date de fin : reprise uniquement à ta demande.'}</p>
      <button style={btn} disabled={busy} onClick={()=>save(()=>resumePause(pauses,active.id,today))}>Reprendre le programme aujourd’hui</button></div>}
    {upcoming.map(p=><div key={p.id} style={{marginTop:12}}>Pause prévue : {p.start} → {p.end||'reprise manuelle'}<button style={input} disabled={busy} onClick={()=>save(()=>resumePause(pauses,p.id,today))}>Annuler cette pause prévue</button></div>)}
    {!active&&<fieldset disabled={busy||busyWorkout} style={{border:0,padding:0,margin:0,display:'grid',gap:12}}>
      <label>Motif<select style={input} value={reason} onChange={e=>setReason(e.target.value)}><option value="vacances">Vacances</option><option value="blessure">Blessure</option></select></label>
      <label>Début<input style={input} type="date" value={start} onChange={e=>setStart(e.target.value)}/></label>
      {reason==='blessure'&&<label><input type="checkbox" checked={openEnded} onChange={e=>setOpenEnded(e.target.checked)}/> Reprise manuelle, sans date de fin</label>}
      {!(reason==='blessure'&&openEnded)&&<label>Dernier jour de pause inclus<input style={input} type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></label>}
      <button style={btn} onClick={()=>save(()=>addPause(pauses,{id:crypto.randomUUID(),reason,start,end:reason==='blessure'&&openEnded?null:end}))}>Activer la pause</button>
    </fieldset>}
    {busyWorkout&&<p>Termine et enregistre la séance en cours avant d’activer une pause. Ton brouillon reste conservé.</p>}
    {reason==='blessure'&&<p style={{fontSize:12}}>La date de reprise est un choix de planning, pas une validation médicale.</p>}
    <p role="status" aria-live="polite" style={{fontSize:13}}>{busy?'Enregistrement…':message}</p>
  </section>;
}
