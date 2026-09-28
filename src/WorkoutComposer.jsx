import React,{useMemo,useState} from 'react';
import {normalizeWorkout,validateWorkout} from './custom-workouts.js';
import {DB} from './catalog.js';

const FORMATS=[
  {id:'classique',label:'Classique',tag:'SÉRIES',hint:'Séries et repos, chaque série se valide à la main.'},
  {id:'amrap',label:'AMRAP',tag:'AMRAP',hint:'Un maximum de tours dans le temps imparti. Tu comptes tes tours.'},
  {id:'emom',label:'EMOM',tag:'EMOM',hint:'Une station par minute, le chrono passe tout seul à la suivante.'},
  {id:'rounds',label:'Tours',tag:'TOURS',hint:'Un nombre de tours à boucler le plus vite possible, avec un temps limite.'},
];
const UNITS=[{id:'reps',label:'reps'},{id:'s',label:'sec'},{id:'m',label:'m'},{id:'cal',label:'cal'}];
const fmtOf=id=>FORMATS.find(f=>f.id===id)||FORMATS[0];
const blank=()=>({id:crypto.randomUUID(),name:'',format:'amrap',durationMin:20,rounds:5,moves:[]});
const fromCatalog=e=>{const n=parseInt(e.reps,10);const sec=/s$/i.test(String(e.reps||''));
  return {name:e.n,quantity:Number.isFinite(n)&&n>0?n:10,unit:sec?'s':'reps',kg:e.eq==='bw'?0:(e.kg||0),sets:3,restSec:e.rest||60};};
const plain=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const moveLine=(m,format)=>`${format==='classique'?`${m.sets} × `:''}${m.quantity} ${UNITS.find(u=>u.id===m.unit)?.label||m.unit}${Number(m.kg)?` · ${m.kg} kg`:''}`;
export const workoutSummary=w=>{const f=fmtOf(w.format);
  if(w.format==='rounds') return `${w.rounds} tours · limite ${w.durationMin} min`;
  if(w.format==='classique') return `${w.moves.length} exercice${w.moves.length>1?'s':''} · ~${w.durationMin} min`;
  return `${f.label} ${w.durationMin} min`;};

function Stepper({value,onChange,min,max,step=1,suffix,C,label}) {
  const n=Number(value)||0,set=v=>onChange(Math.min(max,Math.max(min,Math.round(v*2)/2)));
  const b={width:36,height:36,borderRadius:999,border:0,background:C.s1,color:C.ink,font:'inherit',fontSize:15,cursor:'pointer'};
  return <div style={{display:'flex',alignItems:'center',gap:6}} aria-label={label}>
    <button type="button" aria-label={`Moins — ${label}`} style={b} onClick={()=>set(n-step)} disabled={n<=min}>−</button>
    <input inputMode="decimal" aria-label={label} value={value} onChange={e=>onChange(e.target.value.replace(',','.'))}
      onBlur={e=>{const v=Number(e.target.value);set(Number.isFinite(v)?v:min);}}
      style={{width:52,height:36,textAlign:'center',border:0,borderRadius:12,background:'transparent',color:C.ink,font:'inherit',fontSize:16,fontVariantNumeric:'tabular-nums'}}/>
    <button type="button" aria-label={`Plus — ${label}`} style={b} onClick={()=>set(n+step)} disabled={n>=max}>+</button>
    {suffix&&<span style={{fontSize:12.5,color:C.ink3}}>{suffix}</span>}
  </div>;
}

function Picker({C,onPick,onClose}) {
  const [q,setQ]=useState('');
  const hits=useMemo(()=>{const k=plain(q.trim());
    const seen=new Set();
    // Le catalogue contient des homonymes (deux « Burpee ») : un seul par nom.
    const all=DB.filter(e=>{const n=plain(e.n);if(seen.has(n)) return false;seen.add(n);return !k||plain(e.n+' '+(e.m||'')).includes(k);});return all.slice(0,60);},[q]);
  const exact=hits.some(e=>plain(e.n)===plain(q.trim()));
  return <div role="dialog" aria-label="Choisir un exercice" style={{position:'fixed',inset:0,zIndex:1300,background:C.scrim,display:'flex',alignItems:'flex-end'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,margin:'0 auto',maxHeight:'82vh',display:'flex',flexDirection:'column',background:C.bg,borderRadius:'22px 22px 0 0',paddingBottom:'env(safe-area-inset-bottom)'}}>
      <div style={{padding:16,display:'grid',gap:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:15,fontWeight:600,color:C.ink}}>Ajouter un exercice</span>
          <button type="button" onClick={onClose} style={{border:0,background:'transparent',color:C.ink3,font:'inherit',fontSize:14,cursor:'pointer'}}>Fermer</button>
        </div>
        <input autoFocus placeholder="Rechercher : burpee, squat, rameur…" value={q} onChange={e=>setQ(e.target.value)}
          style={{height:48,padding:'0 14px',borderRadius:12,border:`1px solid ${C.s3}`,background:C.s1,color:C.ink,font:'inherit',fontSize:16}}/>
      </div>
      <div style={{overflowY:'auto',padding:'0 16px 16px',display:'grid',gap:6}}>
        {q.trim()&&!exact&&<button type="button" onClick={()=>onPick({name:q.trim().slice(0,100),quantity:10,unit:'reps',kg:0,sets:3,restSec:60})}
          style={{textAlign:'left',padding:'12px 14px',borderRadius:12,border:`1px dashed ${C.accent}`,background:'transparent',color:C.ink,font:'inherit',cursor:'pointer'}}>
          <div style={{fontSize:14,fontWeight:500}}>Créer « {q.trim()} »</div>
          <div style={{fontSize:11.5,color:C.ink3}}>Exercice libre, hors catalogue</div></button>}
        {hits.map(e=><button key={e.id} type="button" onClick={()=>onPick(fromCatalog(e))}
          style={{textAlign:'left',padding:'10px 14px',borderRadius:12,border:0,background:C.card,color:C.ink,font:'inherit',cursor:'pointer'}}>
          <div style={{fontSize:14,fontWeight:500}}>{e.n}</div>
          <div style={{fontSize:11.5,color:C.ink3}}>{e.m}</div></button>)}
        {!hits.length&&!q.trim()&&<div style={{fontSize:12.5,color:C.ink3}}>Catalogue vide.</div>}
      </div>
    </div>
  </div>;
}

function Editor({initial,isNew,C,onSave,onDelete,onClose}) {
  const [w,setW]=useState(initial),[picker,setPicker]=useState(false),[busy,setBusy]=useState(false),[errors,setErrors]=useState([]),[confirmDel,setConfirmDel]=useState(false);
  const set=(k,v)=>setW(d=>({...d,[k]:v}));
  const setMove=(i,k,v)=>setW(d=>({...d,moves:d.moves.map((m,j)=>j===i?{...m,[k]:v}:m)}));
  const move=(i,dir)=>setW(d=>{const m=[...d.moves],j=i+dir;if(j<0||j>=m.length) return d;[m[i],m[j]]=[m[j],m[i]];return {...d,moves:m};});
  const f=fmtOf(w.format),n=w.moves.length;
  // EMOM : une station par minute, la durée reste un multiple du nombre de stations.
  const emomFix=w.format==='emom'&&n&&Number(w.durationMin)%n?Math.max(n,Math.round(Number(w.durationMin)/n)*n):null;
  async function save() {
    const errs=validateWorkout(w);setErrors(errs);if(errs.length) return;
    setBusy(true);try {await onSave(normalizeWorkout(w));} catch(e) {setErrors([e.message||'Enregistrement impossible.']);} finally {setBusy(false);}
  }
  const cap={fontSize:11.5,color:C.ink3,letterSpacing:'.04em',textTransform:'uppercase',fontWeight:500};
  const card={background:C.card,borderRadius:22,padding:16};
  const iconBtn={height:32,padding:'0 10px',borderRadius:999,border:`1px solid ${C.s3}`,background:'transparent',color:C.ink2,font:'inherit',fontSize:12.5,cursor:'pointer'};
  return <div role="dialog" aria-label="Créateur d’entraînement" style={{position:'fixed',inset:0,zIndex:1200,background:C.bg,color:C.ink,display:'flex',flexDirection:'column'}}>
    <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'calc(env(safe-area-inset-top) + 12px) 16px 12px',gap:10}}>
      <button type="button" onClick={onClose} style={{border:0,background:'transparent',color:C.ink3,font:'inherit',fontSize:14,cursor:'pointer',padding:0}}>Fermer</button>
      <span style={{fontSize:14,fontWeight:600}}>{isNew?'Nouvel entraînement':'Modifier'}</span>
      <span style={{width:44}}/>
    </header>
    <div style={{flex:1,overflowY:'auto',padding:'0 16px 120px'}}><div style={{maxWidth:560,margin:'0 auto',display:'grid',gap:10}}>
      <input aria-label="Nom de l’entraînement" placeholder="Nom de l’entraînement" maxLength={80} value={w.name} onChange={e=>set('name',e.target.value)}
        style={{width:'100%',boxSizing:'border-box',border:0,borderBottom:`1px solid ${C.s3}`,background:'transparent',color:C.ink,font:'inherit',fontSize:34,fontWeight:500,padding:'8px 0 10px',outline:'none'}}/>

      <div style={card}>
        <div style={cap}>Format</div>
        <div role="radiogroup" aria-label="Format" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,padding:4,marginTop:10,borderRadius:999,background:C.s1}}>
          {FORMATS.map(x=>{const on=w.format===x.id;return <button key={x.id} type="button" role="radio" aria-checked={on} onClick={()=>set('format',x.id)}
            style={{height:38,borderRadius:999,border:0,background:on?C.fill:'transparent',color:on?C.onFill:C.ink2,font:'inherit',fontSize:12.5,fontWeight:on?600:500,cursor:'pointer'}}>{x.label}</button>;})}
        </div>
        <p style={{margin:'10px 0 0',fontSize:12.5,color:C.ink2,lineHeight:1.5}}>{f.hint}</p>
        <div style={{display:'grid',gap:12,marginTop:14}}>
          {w.format==='rounds'&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:14}}>Tours</span><Stepper C={C} label="Nombre de tours" value={w.rounds??5} min={1} max={100} onChange={v=>set('rounds',v)}/></div>}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:14}}>{w.format==='classique'?'Durée estimée':w.format==='rounds'?'Temps limite':'Durée'}</span>
            <Stepper C={C} label="Durée en minutes" value={w.durationMin} min={1} max={240} step={w.format==='emom'&&n?n:1} suffix="min" onChange={v=>set('durationMin',v)}/></div>
          {w.format==='emom'&&n>0&&!emomFix&&<div style={{fontSize:12.5,color:C.ink3}}>{Number(w.durationMin)/n} tour{Number(w.durationMin)/n>1?'s':''} de {n} minute{n>1?'s':''}.</div>}
          {emomFix&&<button type="button" onClick={()=>set('durationMin',emomFix)} style={{...iconBtn,justifySelf:'start',borderColor:C.accent,color:C.ink}}>
            Ajuster à {emomFix} min pour {n} stations</button>}
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:6}}>
        <span style={cap}>{w.format==='emom'?'Stations':'Exercices'} · {n}</span>
        {w.format!=='classique'&&n>0&&<span style={{fontSize:11.5,color:C.ink3}}>{w.format==='emom'?'une par minute':'= un tour'}</span>}
      </div>

      {w.moves.map((m,i)=><div key={i} style={{...card,display:'grid',gap:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{width:28,height:28,borderRadius:999,background:C.accentSoft,color:C.ink,fontSize:12.5,fontWeight:600,display:'grid',placeItems:'center',flexShrink:0}}>{i+1}</span>
          <input aria-label={`Nom de l’exercice ${i+1}`} value={m.name} maxLength={100} onChange={e=>setMove(i,'name',e.target.value)}
            style={{flex:1,minWidth:0,border:0,background:'transparent',color:C.ink,font:'inherit',fontSize:16,fontWeight:500,outline:'none'}}/>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:10}}>
          <Stepper C={C} label={`Quantité exercice ${i+1}`} value={m.quantity} min={1} max={10000} step={m.unit==='m'?50:m.unit==='s'?5:1} onChange={v=>setMove(i,'quantity',v)}/>
          <div role="radiogroup" aria-label="Unité" style={{display:'flex',gap:2,padding:3,borderRadius:999,background:C.s1}}>
            {UNITS.map(u=>{const on=m.unit===u.id;return <button key={u.id} type="button" role="radio" aria-checked={on} onClick={()=>setMove(i,'unit',u.id)}
              style={{height:30,padding:'0 10px',borderRadius:999,border:0,background:on?C.fill:'transparent',color:on?C.onFill:C.ink3,font:'inherit',fontSize:12.5,fontWeight:on?600:500,cursor:'pointer'}}>{u.label}</button>;})}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12.5,color:C.ink3}}>Charge</span>
          <Stepper C={C} label={`Charge exercice ${i+1}`} value={m.kg} min={0} max={500} step={2.5} suffix="kg" onChange={v=>setMove(i,'kg',v)}/></div>
        {w.format==='classique'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12.5,color:C.ink3}}>Séries</span>
            <Stepper C={C} label={`Séries exercice ${i+1}`} value={m.sets} min={1} max={30} onChange={v=>setMove(i,'sets',v)}/></div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:12.5,color:C.ink3}}>Repos</span>
            <Stepper C={C} label={`Repos exercice ${i+1}`} value={m.restSec} min={0} max={600} step={15} suffix="s" onChange={v=>setMove(i,'restSec',v)}/></div>
        </>}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button type="button" style={iconBtn} disabled={i===0} onClick={()=>move(i,-1)} aria-label="Monter">↑</button>
          <button type="button" style={iconBtn} disabled={i===n-1} onClick={()=>move(i,1)} aria-label="Descendre">↓</button>
          <button type="button" style={iconBtn} disabled={n>=20} onClick={()=>setW(d=>({...d,moves:[...d.moves.slice(0,i+1),{...m},...d.moves.slice(i+1)]}))}>Dupliquer</button>
          <button type="button" style={{...iconBtn,marginLeft:'auto'}} onClick={()=>setW(d=>({...d,moves:d.moves.filter((_,j)=>j!==i)}))}>Retirer</button>
        </div>
      </div>)}

      <button type="button" disabled={n>=20} onClick={()=>setPicker(true)}
        style={{height:56,borderRadius:22,border:`1px dashed ${C.accent}`,background:'transparent',color:C.ink,font:'inherit',fontSize:14,fontWeight:600,cursor:'pointer'}}>
        + Ajouter un exercice</button>

      {!isNew&&<div style={{marginTop:14,textAlign:'center'}}>
        {!confirmDel?<button type="button" onClick={()=>setConfirmDel(true)} style={{border:0,background:'transparent',color:C.ink3,font:'inherit',fontSize:12.5,cursor:'pointer'}}>Supprimer cet entraînement</button>
          :<div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button type="button" style={{...iconBtn,borderColor:C.ink}} onClick={()=>onDelete(w.id)}>Confirmer la suppression</button>
            <button type="button" style={iconBtn} onClick={()=>setConfirmDel(false)}>Garder</button></div>}
      </div>}
    </div></div>

    <footer style={{position:'absolute',left:0,right:0,bottom:0,padding:'12px 16px calc(env(safe-area-inset-bottom) + 12px)',background:C.bg,borderTop:`1px solid ${C.s2}`}}>
      <div style={{maxWidth:560,margin:'0 auto',display:'grid',gap:8}}>
        {errors.length>0&&<div role="alert" style={{fontSize:12.5,color:C.ink2,lineHeight:1.4}}>{errors[0]}{errors.length>1?` (+${errors.length-1})`:''}</div>}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{w.name.trim()||'Sans nom'}</div>
            <div style={{fontSize:11.5,color:C.ink3}}>{workoutSummary(w)} · {n} exercice{n>1?'s':''}</div>
          </div>
          <button type="button" disabled={busy} onClick={save} style={{height:48,padding:'0 22px',borderRadius:999,border:0,background:C.fill,color:C.onFill,font:'inherit',fontSize:14,fontWeight:600,cursor:'pointer',opacity:busy?.6:1}}>
            {busy?'Enregistrement…':'Enregistrer'}</button>
        </div>
      </div>
    </footer>
    {picker&&<Picker C={C} onClose={()=>setPicker(false)} onPick={m=>{setW(d=>({...d,moves:[...d.moves,m]}));setPicker(false);setErrors([]);}}/>}
  </div>;
}

export default function WorkoutComposer({workouts=[],onSave,onLaunch,colors:C}) {
  const [editing,setEditing]=useState(null),[launchId,setLaunchId]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const list=Array.isArray(workouts)?workouts:[];
  async function persist(next,done) {
    const result=await onSave({custom_workouts:next});if(result?.error) throw result.error;setEditing(null);setMessage(done);
  }
  async function launch(w) {
    setBusy(true);setMessage('');
    try {await onLaunch(w);} catch(e) {setMessage(e.message||'Impossible de préparer la séance.');}
    finally {setBusy(false);setLaunchId(null);}
  }
  const pill=(primary)=>({height:36,padding:'0 14px',borderRadius:999,border:primary?0:`1px solid ${C.s3}`,background:primary?C.fill:'transparent',color:primary?C.onFill:C.ink,font:'inherit',fontSize:12.5,fontWeight:600,cursor:'pointer'});
  return <section aria-label="Mes entraînements" style={{background:C.card,color:C.ink,padding:16,borderRadius:22,marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
      <span style={{fontSize:15,fontWeight:600}}>Mes entraînements</span>
      <button type="button" style={pill(true)} onClick={()=>{setMessage('');setEditing({w:blank(),isNew:true});}}>Créer</button>
    </div>
    <p style={{margin:'6px 0 0',fontSize:12.5,lineHeight:1.5,color:C.ink3}}>Compose tes propres séances : classique, AMRAP, EMOM ou tours pour le temps.</p>
    {list.length>0&&<div style={{display:'grid',gap:8,marginTop:14}}>
      {list.map(w=><div key={w.id} style={{padding:12,borderRadius:12,background:C.s1}}>
        <button type="button" onClick={()=>{setMessage('');setEditing({w:structuredClone({rounds:5,...w}),isNew:false});}}
          style={{display:'flex',width:'100%',alignItems:'center',gap:10,border:0,padding:0,background:'transparent',color:C.ink,font:'inherit',textAlign:'left',cursor:'pointer'}}>
          <span style={{fontSize:10,fontWeight:600,letterSpacing:'.06em',padding:'4px 8px',borderRadius:999,background:C.accentSoft}}>{fmtOf(w.format).tag}</span>
          <span style={{flex:1,minWidth:0}}>
            <span style={{display:'block',fontSize:14,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{w.name}</span>
            <span style={{display:'block',fontSize:11.5,color:C.ink3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{workoutSummary(w)} · {w.moves.map(m=>m.name).join(', ')}</span>
          </span>
        </button>
        {launchId!==w.id?<div style={{display:'flex',gap:8,marginTop:10}}>
          <button type="button" style={pill(false)} disabled={busy} onClick={()=>setLaunchId(w.id)}>Faire aujourd’hui</button></div>
          :<div style={{marginTop:10,display:'grid',gap:8}}>
            <span style={{fontSize:12.5,color:C.ink2,lineHeight:1.5}}>Elle remplace la séance prévue aujourd’hui et comptera dans ton programme une fois terminée.</span>
            <div style={{display:'flex',gap:8}}>
              <button type="button" style={pill(true)} disabled={busy} onClick={()=>launch(w)}>{busy?'Préparation…':'Lancer'}</button>
              <button type="button" style={pill(false)} disabled={busy} onClick={()=>setLaunchId(null)}>Annuler</button></div>
          </div>}
      </div>)}
    </div>}
    {message&&<p role="status" aria-live="polite" style={{margin:'12px 0 0',fontSize:12.5,color:C.ink2}}>{message}</p>}
    {editing&&<Editor C={C} initial={editing.w} isNew={editing.isNew} onClose={()=>setEditing(null)}
      onSave={w=>persist(list.some(x=>x.id===w.id)?list.map(x=>x.id===w.id?w:x):[...list,w],'Entraînement enregistré.')}
      onDelete={id=>persist(list.filter(x=>x.id!==id),'Entraînement supprimé.').catch(e=>setMessage(e.message||'Suppression impossible.'))}/>}
  </section>;
}
