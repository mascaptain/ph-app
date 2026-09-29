import React,{useMemo,useState} from 'react';
import {normalizeWorkout,validateWorkout,parseQuickEntry,stationsOf,workoutVolume,workoutSummary} from './custom-workouts.js';
import {HOUSE_WORKOUTS} from './house-workouts.js';
import {DB} from './catalog.js';
import {estimateLoad} from './load-estimate.js';

const FORMATS=[
  {id:'rounds',label:'Tours',tag:'TOURS',hint:'La séquence N fois, avec un repos après chaque tour.'},
  {id:'fortime',label:'Chrono',tag:'CHRONO',hint:'Tout finir le plus vite possible. Le chrono s’arrête quand tu valides le dernier mouvement.'},
  {id:'amrap',label:'AMRAP',tag:'AMRAP',hint:'Un maximum de tours dans le temps imparti.'},
  {id:'emom',label:'EMOM',tag:'EMOM',hint:'Une station par minute, le chrono passe tout seul à la suivante.'},
  {id:'classique',label:'Séries',tag:'SÉRIES',hint:'Séries et repos, exercice par exercice.'},
];
const UNITS=['reps','s','m','cal'];
const UNIT_TXT={reps:'reps',s:'sec',m:'m',cal:'cal'};
const fmtOf=id=>FORMATS.find(f=>f.id===id)||FORMATS[0];
const blank=()=>({id:crypto.randomUUID(),name:'',format:'rounds',durationMin:30,rounds:5,roundRestSec:60,moves:[]});
const fromCatalog=e=>{const n=parseInt(e.reps,10);const sec=/s$/i.test(String(e.reps||''));
  return {name:e.n,quantity:Number.isFinite(n)&&n>0?n:10,unit:sec?'s':'reps',kg:0,sets:3,restSec:e.rest||60};};
const plain=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const flatten=stations=>stations.flatMap(st=>st.map((m,k)=>{const {link:_l,...rest}=m;return k?{...rest,link:true}:rest;}));
const volumeText=v=>Object.entries(v).map(([u,q])=>`${q} ${UNIT_TXT[u]}`).join(' · ');
// Ce qui arrive des anciennes versions : valeurs par défaut des nouveaux champs.
const withDefaults=w=>({rounds:1,roundRestSec:0,...w,moves:(w.moves||[]).map(m=>({sets:1,restSec:0,...m}))});

function Stepper({value,onChange,min,max,step=1,suffix,C,label}) {
  const n=Number(value)||0,set=v=>onChange(Math.min(max,Math.max(min,Math.round(v*2)/2)));
  const b={width:36,height:36,borderRadius:999,border:0,background:C.s1,color:C.ink,font:'inherit',fontSize:15,cursor:'pointer'};
  return <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
    <button type="button" aria-label={`Moins — ${label}`} style={b} onClick={()=>set(n-step)} disabled={n<=min}>−</button>
    <input inputMode="numeric" aria-label={label} value={value} onChange={e=>onChange(e.target.value.replace(',','.'))}
      onBlur={e=>{const v=Number(e.target.value);set(Number.isFinite(v)?v:min);}}
      style={{width:44,height:36,padding:0,textAlign:'center',border:0,borderRadius:12,background:'transparent',color:C.ink,font:'inherit',fontSize:16,fontVariantNumeric:'tabular-nums'}}/>
    <button type="button" aria-label={`Plus — ${label}`} style={b} onClick={()=>set(n+step)} disabled={n>=max}>+</button>
    {suffix&&<span style={{fontSize:12.5,color:C.ink3,minWidth:22}}>{suffix}</span>}
  </div>;
}

function Picker({C,title,onPick,onClose}) {
  const [q,setQ]=useState('');
  const hits=useMemo(()=>{const k=plain(q.trim()),seen=new Set();
    // Le catalogue contient des homonymes (deux « Burpee ») : un seul par nom.
    return DB.filter(e=>{const n=plain(e.n);if(seen.has(n)) return false;seen.add(n);return !k||plain(e.n+' '+(e.m||'')).includes(k);}).slice(0,60);},[q]);
  const exact=hits.some(e=>plain(e.n)===plain(q.trim()));
  return <div role="dialog" aria-label={title} style={{position:'fixed',inset:0,zIndex:1300,background:C.scrim,display:'flex',alignItems:'flex-end'}} onClick={onClose}>
    <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,margin:'0 auto',maxHeight:'82vh',display:'flex',flexDirection:'column',background:C.bg,borderRadius:'22px 22px 0 0',paddingBottom:'env(safe-area-inset-bottom)'}}>
      <div style={{padding:16,display:'grid',gap:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:15,fontWeight:600,color:C.ink}}>{title}</span>
          <button type="button" onClick={onClose} style={{border:0,background:'transparent',color:C.ink3,font:'inherit',fontSize:14,cursor:'pointer'}}>Fermer</button>
        </div>
        <input autoFocus placeholder="Rechercher ou taper un nom" value={q} onChange={e=>setQ(e.target.value)}
          style={{height:48,padding:'0 14px',borderRadius:12,border:`1px solid ${C.s3}`,background:C.s1,color:C.ink,font:'inherit',fontSize:16}}/>
      </div>
      <div style={{overflowY:'auto',padding:'0 16px 16px',display:'grid',gap:6}}>
        {q.trim()&&!exact&&<button type="button" onClick={()=>onPick({name:q.trim().slice(0,100),quantity:10,unit:'reps',kg:0,sets:3,restSec:60})}
          style={{textAlign:'left',padding:'12px 14px',borderRadius:12,border:`1px dashed ${C.accent}`,background:'transparent',color:C.ink,font:'inherit',cursor:'pointer'}}>
          <div style={{fontSize:14,fontWeight:500}}>Ajouter « {q.trim()} »</div>
          <div style={{fontSize:11.5,color:C.ink3}}>Mouvement libre, hors catalogue</div></button>}
        {hits.map(e=><button key={e.id} type="button" onClick={()=>onPick(fromCatalog(e))}
          style={{textAlign:'left',padding:'10px 14px',borderRadius:12,border:0,background:C.card,color:C.ink,font:'inherit',cursor:'pointer'}}>
          <div style={{fontSize:14,fontWeight:500}}>{e.n}</div>
          <div style={{fontSize:11.5,color:C.ink3}}>{e.m}</div></button>)}
      </div>
    </div>
  </div>;
}

// Une ligne de mouvement : quantité, unité, nom, charge. Tout tient sur deux lignes.
// La charge laissée vide est calculée depuis ta force ; la toucher la fixe à la main.
function MoveRow({m,C,onChange,onRemove,estimate}) {
  const manual=Number(m.kg)>0;
  const est=manual?null:estimate(m);
  const chip={height:32,padding:'0 10px',borderRadius:999,border:0,background:C.s1,color:C.ink2,font:'inherit',fontSize:12.5,cursor:'pointer'};
  return <div style={{display:'grid',gap:8}}>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <input aria-label="Quantité" inputMode="numeric" value={m.quantity} onChange={e=>onChange({quantity:e.target.value.replace(/\D/g,'')})}
        style={{width:56,height:40,boxSizing:'border-box',borderRadius:12,border:`1px solid ${C.s3}`,background:C.s1,color:C.ink,font:'inherit',fontSize:16,textAlign:'center',fontVariantNumeric:'tabular-nums'}}/>
      <button type="button" aria-label="Changer d’unité" onClick={()=>onChange({unit:UNITS[(UNITS.indexOf(m.unit)+1)%UNITS.length]})}
        style={{...chip,minWidth:48}}>{UNIT_TXT[m.unit]}</button>
      <input aria-label="Nom du mouvement" value={m.name} maxLength={100} onChange={e=>onChange({name:e.target.value})}
        style={{flex:1,minWidth:0,width:0,height:40,border:0,borderBottom:`1px solid ${C.s3}`,background:'transparent',color:C.ink,font:'inherit',fontSize:16,outline:'none'}}/>
      <button type="button" aria-label={`Retirer ${m.name}`} onClick={onRemove}
        style={{width:32,height:32,borderRadius:999,border:0,background:'transparent',color:C.ink3,font:'inherit',fontSize:16,cursor:'pointer'}}>×</button>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:8,paddingLeft:64}}>
      {manual?<>
          <Stepper C={C} label={`Charge ${m.name}`} value={m.kg} min={0} max={500} step={m.eq==='kb'||m.eq==='db'||!m.eq?2:2.5} suffix="kg" onChange={v=>onChange({kg:v})}/>
          <button type="button" style={{...chip,background:'transparent'}} onClick={()=>onChange({kg:0})}>Auto</button></>
        :est?.bw?<span style={{fontSize:12.5,color:C.ink3}}>Poids du corps</span>
        :est?.kg>0?<button type="button" style={chip} aria-label={`Charge calculée ${est.kg} kg, toucher pour la modifier`}
            onClick={()=>onChange({kg:est.kg,eq:est.eq})}>≈ {est.kg} kg · ta force</button>
        :<button type="button" style={chip} onClick={()=>onChange({kg:10})}>+ charge</button>}
    </div>
  </div>;
}

function Editor({initial,isNew,C,onSave,onDelete,onClose,loadCtx}) {
  const [w,setW]=useState(()=>withDefaults(initial));
  const [picker,setPicker]=useState(null),[busy,setBusy]=useState(false),[errors,setErrors]=useState([]),[confirmDel,setConfirmDel]=useState(false);
  const [quick,setQuick]=useState(''),[quickOpen,setQuickOpen]=useState(isNew&&!(initial.moves||[]).length),[quickNote,setQuickNote]=useState('');
  const set=(k,v)=>setW(d=>({...d,[k]:v}));
  const stations=stationsOf(w.moves);
  const setStations=fn=>setW(d=>({...d,moves:flatten(fn(stationsOf(d.moves).map(st=>[...st])))}));
  const f=fmtOf(w.format),n=stations.length,rounded=w.format==='rounds'||w.format==='fortime';
  const vol=workoutVolume(w);
  const estimate=m=>estimateLoad(m,loadCtx||{},w.format!=='classique');
  // Un complexe se fait avec le même outil : chaque mouvement affiche la charge de
  // la station (celle du plus faible), exactement ce que le lecteur prescrira.
  const stationEstimate=st=>m=>{const e=estimate(m);if(!(e?.kg>0)||st.length<2) return e;
    const loads=st.map(x=>Number(x.kg)>0?Number(x.kg):estimate(x)?.kg||0).filter(k=>k>0);
    return {...e,kg:Math.min(...loads)};};
  const emomFix=w.format==='emom'&&n&&Number(w.durationMin)%n?Math.max(n,Math.round(Number(w.durationMin)/n)*n):null;
  function addQuick() {
    const {moves,skipped}=parseQuickEntry(quick);
    if(!moves.length){setQuickNote('Écris une ligne par station, par exemple « 5 squats + arnold press ».');return;}
    const added=stationsOf(moves).length;
    setW(d=>({...d,moves:[...d.moves,...moves.map((m,k)=>k===0?{...m,link:false}:m)]}));setQuick('');setErrors([]);
    setQuickNote(`${added} station${added>1?'s':''} ajoutée${added>1?'s':''}.${skipped.length?` Ignoré : ${skipped.join(', ')} (quantité manquante).`:''}`);
    setQuickOpen(false);
  }
  async function save() {
    const errs=validateWorkout(w);setErrors(errs);if(errs.length) return;
    setBusy(true);try {await onSave(normalizeWorkout(w));} catch(e) {setErrors([e.message||'Enregistrement impossible.']);} finally {setBusy(false);}
  }
  const cap={fontSize:11.5,color:C.ink3,letterSpacing:'.04em',textTransform:'uppercase',fontWeight:500};
  const card={background:C.card,borderRadius:22,padding:16};
  const ghost={height:32,padding:'0 12px',borderRadius:999,border:`1px solid ${C.s3}`,background:'transparent',color:C.ink2,font:'inherit',fontSize:12.5,cursor:'pointer'};
  const row={display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,minWidth:0};
  const stationName=i=>w.format==='emom'?`Minute ${i+1}`:`Station ${i+1}`;
  return <div role="dialog" aria-label="Créateur d’entraînement" style={{position:'fixed',inset:0,zIndex:1200,background:C.bg,color:C.ink,display:'flex',flexDirection:'column'}}>
    <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'calc(env(safe-area-inset-top) + 12px) 16px 12px',gap:10}}>
      <button type="button" onClick={onClose} style={{border:0,background:'transparent',color:C.ink3,font:'inherit',fontSize:14,cursor:'pointer',padding:0}}>Fermer</button>
      <span style={{fontSize:14,fontWeight:600}}>{isNew?'Nouvel entraînement':'Modifier'}</span>
      <span style={{width:44}}/>
    </header>
    <div style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'0 16px 130px'}}><div style={{maxWidth:560,margin:'0 auto',display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:10}}>
      <input aria-label="Nom de l’entraînement" placeholder="Nom de l’entraînement" maxLength={80} value={w.name} onChange={e=>set('name',e.target.value)}
        style={{width:'100%',boxSizing:'border-box',border:0,borderBottom:`1px solid ${C.s3}`,background:'transparent',color:C.ink,font:'inherit',fontSize:34,fontWeight:500,padding:'8px 0 10px',outline:'none'}}/>

      <div style={card}>
        <div role="radiogroup" aria-label="Format" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:2,padding:4,borderRadius:999,background:C.s1}}>
          {FORMATS.map(x=>{const on=w.format===x.id;return <button key={x.id} type="button" role="radio" aria-checked={on}
            onClick={()=>setW(d=>({...d,format:x.id,...(x.id==='fortime'&&d.format!=='fortime'?{rounds:1}:{})}))}
            style={{height:36,borderRadius:999,border:0,background:on?C.fill:'transparent',color:on?C.onFill:C.ink2,font:'inherit',fontSize:12.5,fontWeight:on?600:500,cursor:'pointer',padding:0}}>{x.label}</button>;})}
        </div>
        <p style={{margin:'10px 0 0',fontSize:12.5,color:C.ink2,lineHeight:1.5}}>{f.hint}</p>
        <div style={{display:'grid',gap:12,marginTop:14}}>
          {rounded&&<div style={row}><span style={{fontSize:14,flex:1,minWidth:0}}>Tours</span>
            <Stepper C={C} label="Nombre de tours" value={w.rounds} min={1} max={100} onChange={v=>set('rounds',v)}/></div>}
          {w.format==='rounds'&&<div style={row}><span style={{fontSize:14,flex:1,minWidth:0}}>Repos après chaque tour</span>
            <Stepper C={C} label="Repos entre les tours" value={w.roundRestSec} min={0} max={600} step={15} suffix="s" onChange={v=>set('roundRestSec',v)}/></div>}
          <div style={row}>
            <span style={{fontSize:14,flex:1,minWidth:0}}>{w.format==='fortime'?'Temps limite':w.format==='rounds'||w.format==='classique'?'Durée estimée':'Durée'}</span>
            <Stepper C={C} label="Durée en minutes" value={w.durationMin} min={1} max={240} step={w.format==='emom'&&n?n:1} suffix="min" onChange={v=>set('durationMin',v)}/></div>
          {w.format==='emom'&&n>0&&!emomFix&&<div style={{fontSize:12.5,color:C.ink3}}>{Number(w.durationMin)/n} tour{Number(w.durationMin)/n>1?'s':''} de {n} minute{n>1?'s':''}.</div>}
          {emomFix&&<button type="button" onClick={()=>set('durationMin',emomFix)} style={{...ghost,justifySelf:'start',borderColor:C.accent,color:C.ink}}>Ajuster à {emomFix} min pour {n} stations</button>}
        </div>
      </div>

      <div style={card}>
        <button type="button" onClick={()=>setQuickOpen(o=>!o)} aria-expanded={quickOpen}
          style={{...row,width:'100%',border:0,padding:0,background:'transparent',color:C.ink,font:'inherit',cursor:'pointer'}}>
          <span style={{fontSize:14,fontWeight:600}}>Saisie rapide</span>
          <span style={{fontSize:12.5,color:C.ink3}}>{quickOpen?'Masquer':'Ouvrir'}</span></button>
        {quickOpen&&<div style={{display:'grid',gap:10,marginTop:10}}>
          <span style={{fontSize:12.5,color:C.ink3,lineHeight:1.5}}>Une ligne par station. Un « + » enchaîne des mouvements sans pause.</span>
          <textarea aria-label="Saisie rapide" rows={5} value={quick} onChange={e=>setQuick(e.target.value)}
            placeholder={'5 squats + arnold press\n5 bent over rows + upright rows\n200 m rameur\n30 s gainage'}
            style={{width:'100%',boxSizing:'border-box',padding:12,borderRadius:12,border:`1px solid ${C.s3}`,background:C.s1,color:C.ink,font:'inherit',fontSize:16,lineHeight:1.5,resize:'vertical'}}/>
          <button type="button" onClick={addQuick} disabled={!quick.trim()}
            style={{height:44,borderRadius:999,border:0,background:quick.trim()?C.fill:C.s1,color:quick.trim()?C.onFill:C.ink3,font:'inherit',fontSize:14,fontWeight:600,cursor:'pointer'}}>Ajouter ces stations</button>
        </div>}
        {quickNote&&<div role="status" style={{fontSize:12.5,color:C.ink2,marginTop:10}}>{quickNote}</div>}
      </div>

      <div style={{...row,alignItems:'baseline',marginTop:6}}>
        <span style={cap}>{w.format==='emom'?'Minutes':'Stations'} · {n}</span>
        {w.moves.length>0&&<span style={{fontSize:11.5,color:C.ink3,textAlign:'right'}}>
          {rounded&&vol.rounds>1?`${volumeText(vol.perRound)} par tour · ${volumeText(vol.total)} au total`:`${volumeText(vol.total)} au total`}</span>}
      </div>

      {stations.map((st,i)=><div key={i} style={{...card,display:'grid',gridTemplateColumns:'minmax(0,1fr)',gap:12}}>
        <div style={row}>
          <span style={{fontSize:12.5,fontWeight:600,color:C.ink2}}>{stationName(i)}{st.length>1?' · enchaîné':''}</span>
          <div style={{display:'flex',gap:4}}>
            <button type="button" style={{...ghost,width:32,padding:0}} disabled={i===0} aria-label="Monter la station" onClick={()=>setStations(s=>{[s[i-1],s[i]]=[s[i],s[i-1]];return s;})}>↑</button>
            <button type="button" style={{...ghost,width:32,padding:0}} disabled={i===n-1} aria-label="Descendre la station" onClick={()=>setStations(s=>{[s[i+1],s[i]]=[s[i],s[i+1]];return s;})}>↓</button>
          </div>
        </div>
        {st.map((m,k)=><React.Fragment key={k}>
          {k>0&&<div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{width:56,textAlign:'center',fontSize:15,color:C.accent}}>+</span>
            <button type="button" style={{...ghost,height:26,fontSize:11.5}} onClick={()=>setStations(s=>{const a=s[i].slice(0,k),b=s[i].slice(k);s.splice(i,1,a,b);return s;})}>Séparer</button>
          </div>}
          <MoveRow C={C} m={m} estimate={stationEstimate(st)} onChange={patch=>setStations(s=>{s[i][k]={...s[i][k],...patch};return s;})}
            onRemove={()=>setStations(s=>{s[i].splice(k,1);return s.filter(x=>x.length);})}/>
        </React.Fragment>)}
        {w.format==='classique'&&<div style={{display:'grid',gap:10,paddingTop:10,borderTop:`1px solid ${C.s2}`}}>
          <div style={row}><span style={{fontSize:12.5,color:C.ink3,flex:1}}>Séries</span>
            <Stepper C={C} label={`Séries station ${i+1}`} value={st[0].sets} min={1} max={30} onChange={v=>setStations(s=>{s[i][0]={...s[i][0],sets:v};return s;})}/></div>
          <div style={row}><span style={{fontSize:12.5,color:C.ink3,flex:1}}>Repos</span>
            <Stepper C={C} label={`Repos station ${i+1}`} value={st[0].restSec} min={0} max={600} step={15} suffix="s" onChange={v=>setStations(s=>{s[i][0]={...s[i][0],restSec:v};return s;})}/></div>
        </div>}
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button type="button" style={ghost} onClick={()=>setPicker({mode:'link',station:i})}>+ Enchaîner</button>
          <button type="button" style={ghost} onClick={()=>setStations(s=>{s.splice(i+1,0,s[i].map(m=>({...m})));return s;})}>Dupliquer</button>
          {i>0&&<button type="button" style={ghost} onClick={()=>setStations(s=>{s[i-1]=[...s[i-1],...s[i]];s.splice(i,1);return s;})}>Lier au-dessus</button>}
        </div>
      </div>)}

      <button type="button" disabled={w.moves.length>=30} onClick={()=>setPicker({mode:'new'})}
        style={{height:56,borderRadius:22,border:`1px dashed ${C.accent}`,background:'transparent',color:C.ink,font:'inherit',fontSize:14,fontWeight:600,cursor:'pointer'}}>
        + Ajouter une station</button>

      {!isNew&&<div style={{marginTop:14,textAlign:'center'}}>
        {!confirmDel?<button type="button" onClick={()=>setConfirmDel(true)} style={{border:0,background:'transparent',color:C.ink3,font:'inherit',fontSize:12.5,cursor:'pointer'}}>Supprimer cet entraînement</button>
          :<div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button type="button" style={{...ghost,borderColor:C.ink}} onClick={()=>onDelete(w.id)}>Confirmer la suppression</button>
            <button type="button" style={ghost} onClick={()=>setConfirmDel(false)}>Garder</button></div>}
      </div>}
    </div></div>

    <footer style={{position:'absolute',left:0,right:0,bottom:0,padding:'12px 16px calc(env(safe-area-inset-bottom) + 12px)',background:C.bg,borderTop:`1px solid ${C.s2}`}}>
      <div style={{maxWidth:560,margin:'0 auto',display:'grid',gap:8}}>
        {errors.length>0&&<div role="alert" style={{fontSize:12.5,color:C.ink2,lineHeight:1.4}}>{errors[0]}{errors.length>1?` (+${errors.length-1})`:''}</div>}
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{w.name.trim()||'Sans nom'}</div>
            <div style={{fontSize:11.5,color:C.ink3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{workoutSummary(w)} · {n} station{n>1?'s':''}</div>
          </div>
          <button type="button" disabled={busy} onClick={save} style={{height:48,padding:'0 22px',borderRadius:999,border:0,background:C.fill,color:C.onFill,font:'inherit',fontSize:14,fontWeight:600,cursor:'pointer',opacity:busy?.6:1}}>
            {busy?'Enregistrement…':'Enregistrer'}</button>
        </div>
      </div>
    </footer>
    {picker&&<Picker C={C} title={picker.mode==='link'?`Enchaîner avec la station ${picker.station+1}`:'Ajouter une station'} onClose={()=>setPicker(null)}
      onPick={m=>{if(picker.mode==='link'){const q=stations[picker.station][0];setStations(s=>{s[picker.station].push({...m,quantity:q.quantity,unit:q.unit});return s;});}
        else setW(d=>({...d,moves:[...d.moves,m]}));setPicker(null);setErrors([]);}}/>}
  </div>;
}

export default function WorkoutComposer({workouts=[],onSave,onLaunch,colors:C,loadCtx}) {
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
  // Un modèle s'ouvre en copie : on le modifie sans toucher à l'original.
  const open=(w,house)=>{setMessage('');const {house:_h,...copy}=structuredClone(w);setEditing({w:house?{...copy,id:crypto.randomUUID()}:copy,isNew:!!house});};
  const item=(w,house)=><div key={w.id} style={{padding:12,borderRadius:12,background:C.s1}}>
    <button type="button" onClick={()=>open(w,house)}
      style={{display:'flex',width:'100%',alignItems:'center',gap:10,border:0,padding:0,background:'transparent',color:C.ink,font:'inherit',textAlign:'left',cursor:'pointer'}}>
      <span style={{fontSize:10,fontWeight:600,letterSpacing:'.06em',padding:'4px 8px',borderRadius:999,background:C.accentSoft,flexShrink:0}}>{fmtOf(w.format).tag}</span>
      <span style={{flex:1,minWidth:0}}>
        <span style={{display:'block',fontSize:14,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{w.name}</span>
        <span style={{display:'block',fontSize:11.5,color:C.ink3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{workoutSummary(w)} · {stationsOf(w.moves).length} stations</span>
      </span>
      <span style={{fontSize:12.5,color:C.ink3,flexShrink:0}}>{house?'Copier':'Modifier'}</span>
    </button>
    {!house&&(launchId!==w.id?<div style={{display:'flex',gap:8,marginTop:10}}>
      <button type="button" style={pill(false)} disabled={busy} onClick={()=>setLaunchId(w.id)}>Faire aujourd’hui</button></div>
      :<div style={{marginTop:10,display:'grid',gap:8}}>
        <span style={{fontSize:12.5,color:C.ink2,lineHeight:1.5}}>Elle remplace la séance prévue aujourd’hui et comptera dans ton programme une fois terminée.</span>
        <div style={{display:'flex',gap:8}}>
          <button type="button" style={pill(true)} disabled={busy} onClick={()=>launch(w)}>{busy?'Préparation…':'Lancer'}</button>
          <button type="button" style={pill(false)} disabled={busy} onClick={()=>setLaunchId(null)}>Annuler</button></div>
      </div>)}
  </div>;
  return <section aria-label="Mes entraînements" style={{background:C.card,color:C.ink,padding:16,borderRadius:22,marginBottom:10}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}>
      <span style={{fontSize:15,fontWeight:600}}>Mes entraînements</span>
      <button type="button" style={pill(true)} onClick={()=>{setMessage('');setEditing({w:blank(),isNew:true});}}>Créer</button>
    </div>
    <p style={{margin:'6px 0 0',fontSize:12.5,lineHeight:1.5,color:C.ink3}}>Tes séances apparaissent aussi dans l’écran Hero, rubrique « Séances maison ».</p>
    {list.length>0&&<div style={{display:'grid',gap:8,marginTop:14}}>{list.map(w=>item(w,false))}</div>}
    <div style={{fontSize:11.5,color:C.ink3,letterSpacing:'.04em',textTransform:'uppercase',fontWeight:500,margin:'16px 0 8px'}}>Modèles</div>
    <div style={{display:'grid',gap:8}}>{HOUSE_WORKOUTS.map(w=>item(w,true))}</div>
    {message&&<p role="status" aria-live="polite" style={{margin:'12px 0 0',fontSize:12.5,color:C.ink2}}>{message}</p>}
    {editing&&<Editor C={C} loadCtx={loadCtx} initial={editing.w} isNew={editing.isNew} onClose={()=>setEditing(null)}
      onSave={w=>persist(list.some(x=>x.id===w.id)?list.map(x=>x.id===w.id?w:x):[...list,w],'Entraînement enregistré.')}
      onDelete={id=>persist(list.filter(x=>x.id!==id),'Entraînement supprimé.').catch(e=>setMessage(e.message||'Suppression impossible.'))}/>}
  </section>;
}
