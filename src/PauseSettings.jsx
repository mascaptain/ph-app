import React,{useState} from 'react';
import {addPause,editPause,pauseOn,resumePause,shiftDate,validDate} from './training-pause.js';

// Dates affichées « mer. 30 sept. » : jamais d'ISO brut à l'écran.
const fmt=(d,withDay=true)=>validDate(d)?new Intl.DateTimeFormat('fr-FR',{timeZone:'UTC',...(withDay?{weekday:'short'}:{}),day:'numeric',month:'short'})
  .format(new Date(d+'T12:00:00Z')):'';
const days=(a,b)=>Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/864e5)+1;
const LABEL={vacances:'Vacances',blessure:'Blessure'};

export default function PauseSettings({pauses=[],today,onSave,colors:C,busyWorkout=false}) {
  const [form,setForm]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const list=Array.isArray(pauses)?pauses:[];
  const active=pauseOn(list,today);
  const upcoming=list.filter(p=>!p.cancelled&&p.start>today).sort((a,b)=>a.start<b.start?-1:1);

  async function save(make,done) {
    setMessage('');setBusy(true);
    try {
      const next=make();
      if(busyWorkout&&pauseOn(next,today)&&!pauseOn(list,today)) throw new Error('Termine et enregistre la séance en cours avant de mettre aujourd’hui en pause.');
      const result=await onSave({training_pauses:next});if(result?.error) throw result.error;
      setForm(null);setMessage(done);
    } catch(error) {setMessage(error.message||'Enregistrement impossible. Réessaie.');}
    finally {setBusy(false);}
  }
  const openNew=()=>{setMessage('');setForm({id:null,reason:'vacances',start:today,end:shiftDate(today,6)});};
  const openEdit=p=>{setMessage('');setForm({...p});};
  function submit() {
    const f=form;
    if(!validDate(f.start)) return setMessage('Choisis une date de début.');
    if(f.end!==null&&(!validDate(f.end)||f.end<f.start)) return setMessage('La fin doit être le même jour ou après le début.');
    if(f.id) save(()=>editPause(list,f.id,{start:f.start,end:f.end}),'Dates mises à jour. Le planning suit.');
    else save(()=>addPause(list,{id:crypto.randomUUID(),reason:f.reason,start:f.start,end:f.end}),
      f.start<=today?'Pause activée. Ta progression t’attend.':'Pause planifiée.');
  }

  const btn=(primary)=>({height:44,padding:'0 16px',borderRadius:999,border:primary?0:`1px solid ${C.s3}`,background:primary?C.fill:'transparent',
    color:primary?C.onFill:C.ink,font:'inherit',fontSize:14,fontWeight:600,cursor:busy?'default':'pointer',opacity:busy?.6:1});
  const small={...btn(false),height:34,padding:'0 12px',fontSize:12.5};
  const dateInput={width:'100%',boxSizing:'border-box',height:48,padding:'0 12px',borderRadius:12,border:`1px solid ${C.s3}`,
    background:C.s1,color:C.ink,font:'inherit',fontSize:16,colorScheme:'inherit'};
  const cap={fontSize:11.5,color:C.ink3,letterSpacing:'.04em',textTransform:'uppercase',fontWeight:500};

  const resumeDay=p=>p.end?shiftDate(p.end,1):null;
  return <section aria-label="Pause du programme" style={{background:C.card,color:C.ink,padding:16,borderRadius:22,marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
      <span style={{fontSize:15,fontWeight:600}}>Pause du programme</span>
      {!form&&<button type="button" style={small} disabled={busy||busyWorkout} onClick={openNew}>Planifier</button>}
    </div>
    <p style={{margin:'6px 0 0',fontSize:12.5,lineHeight:1.5,color:C.ink3}}>Vacances ou blessure : tes séances restent dans l’ordre, rien ne compte comme manqué.</p>

    {active&&!form&&<div style={{marginTop:14,padding:14,borderRadius:12,background:C.accentSoft}}>
      <div style={cap}>En cours · {LABEL[active.reason]}</div>
      <div style={{fontSize:21,fontWeight:500,marginTop:6}}>{active.end?`Jusqu’au ${fmt(active.end)}`:'Reprise quand tu veux'}</div>
      <div style={{fontSize:12.5,color:C.ink2,marginTop:4}}>{active.end?`Retour au programme le ${fmt(resumeDay(active))}`:'Aucune date de fin : le programme reprend à ta demande.'}</div>
      <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}>
        <button type="button" style={btn(true)} disabled={busy} onClick={()=>save(()=>resumePause(list,active.id,today),'Bon retour. Le programme reprend aujourd’hui.')}>Reprendre aujourd’hui</button>
        <button type="button" style={btn(false)} disabled={busy} onClick={()=>openEdit(active)}>Modifier</button>
      </div>
    </div>}

    {upcoming.length>0&&!form&&<div style={{marginTop:14,display:'grid',gap:8}}>
      <div style={cap}>À venir</div>
      {upcoming.map(p=><div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:12,background:C.s1}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:500}}>{LABEL[p.reason]}</div>
          <div style={{fontSize:12.5,color:C.ink3}}>{fmt(p.start)} → {p.end?fmt(p.end):'sans date de fin'}</div>
        </div>
        <button type="button" style={small} disabled={busy} onClick={()=>openEdit(p)}>Modifier</button>
        <button type="button" style={small} disabled={busy} onClick={()=>save(()=>resumePause(list,p.id,today),'Pause annulée.')}>Annuler</button>
      </div>)}
    </div>}

    {form&&<div style={{marginTop:14,display:'grid',gap:12}}>
      {!form.id&&<div role="radiogroup" aria-label="Motif" style={{display:'flex',padding:4,borderRadius:999,background:C.s1}}>
        {['vacances','blessure'].map(r=>{const on=form.reason===r;return <button key={r} type="button" role="radio" aria-checked={on}
          onClick={()=>setForm(f=>({...f,reason:r,end:r==='vacances'&&f.end===null?(f.start>today?f.start:today):f.end}))}
          style={{flex:1,height:38,borderRadius:999,border:0,background:on?C.fill:'transparent',color:on?C.onFill:C.ink2,font:'inherit',fontSize:14,fontWeight:on?600:500,cursor:'pointer'}}>{LABEL[r]}</button>;})}
      </div>}
      {form.id&&<div style={cap}>Modifier · {LABEL[form.reason]}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <label style={{display:'grid',gap:6}}><span style={cap}>Début</span>
          <input type="date" style={dateInput} value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value,end:f.end!==null&&f.end<e.target.value?e.target.value:f.end}))}/></label>
        <label style={{display:'grid',gap:6,opacity:form.end===null?.4:1}}><span style={cap}>Dernier jour</span>
          <input type="date" style={dateInput} min={form.start} disabled={form.end===null} value={form.end||''} onChange={e=>setForm(f=>({...f,end:e.target.value}))}/></label>
      </div>
      {form.reason==='blessure'&&<label style={{display:'flex',alignItems:'center',gap:10,fontSize:14,cursor:'pointer'}}>
        <input type="checkbox" style={{width:20,height:20,accentColor:C.accent}} checked={form.end===null}
          onChange={e=>setForm(f=>({...f,end:e.target.checked?null:f.start}))}/>Je ne connais pas encore ma date de reprise</label>}
      <div style={{fontSize:12.5,color:C.ink2}}>
        {validDate(form.start)&&(form.end===null?`À partir du ${fmt(form.start)}, jusqu’à ta reprise`
          :validDate(form.end)&&form.end>=form.start?`${days(form.start,form.end)} jour${days(form.start,form.end)>1?'s':''} de pause · retour le ${fmt(shiftDate(form.end,1))}`:'')}
      </div>
      {form.reason==='blessure'&&<p style={{margin:0,fontSize:11.5,color:C.ink3}}>La date de reprise organise ton planning ; elle ne remplace pas un avis médical.</p>}
      <div style={{display:'flex',gap:10}}>
        <button type="button" style={{...btn(true),flex:1}} disabled={busy} onClick={submit}>{form.id?'Enregistrer':'Activer la pause'}</button>
        <button type="button" style={btn(false)} disabled={busy} onClick={()=>{setForm(null);setMessage('');}}>Annuler</button>
      </div>
    </div>}

    {busyWorkout&&!active&&!form&&<p style={{margin:'12px 0 0',fontSize:12.5,color:C.ink3}}>Une séance est en cours : termine-la avant de planifier une pause.</p>}
    {(busy||message)&&<p role="status" aria-live="polite" style={{margin:'12px 0 0',fontSize:12.5,color:C.ink2}}>{busy?'Enregistrement…':message}</p>}
  </section>;
}
