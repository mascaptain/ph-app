// Date-only contracts: no timezone-dependent parsing or timer-based resume.
export function validDate(value) {
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date=new Date(value+"T12:00:00Z");
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function shiftDate(value, days) {
  if(!validDate(value)) throw new Error("Date invalide");
  const date=new Date(value+"T12:00:00Z");
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}
export function pauseOn(pauses, date) {
  return (Array.isArray(pauses)?pauses:[]).find(p=>p&&!p.cancelled&&validDate(p.start)
    &&p.start<=date&&(!p.end||(validDate(p.end)&&date<=p.end)))||null;
}
export function addPause(pauses, pause) {
  if(!["vacances","blessure"].includes(pause.reason)||!validDate(pause.start)
    ||(pause.end&&(!validDate(pause.end)||pause.end<pause.start))
    ||(pause.reason==="vacances"&&!pause.end)) throw new Error("Vérifie les dates de la pause.");
  const previous=Array.isArray(pauses)?pauses:[];
  if(previous.some(p=>!p.cancelled&&p.start<=(pause.end||"9999-12-31")
    &&(!p.end||p.end>=pause.start))) throw new Error("Une pause existe déjà sur cette période.");
  return [...previous,{...pause,end:pause.end||null}];
}
export function resumePause(pauses,id,today) {
  return pauses.map(p=>p.id!==id?p:p.start>=today?{...p,cancelled:true}
    :{...p,end:shiftDate(today,-1)});
}
export function projectedEnd({from,remaining,trainingDays,pauses=[]}) {
  if(!validDate(from)||!trainingDays.length) return null;
  if(remaining<=0) return from;
  let count=0;
  for(let i=0;i<3660;i++) {
    const date=shiftDate(from,i);
    const dow=(new Date(date+"T12:00:00Z").getUTCDay()+6)%7;
    const pause=pauseOn(pauses,date);
    if(pause&&!pause.end) return null;
    if(!pause&&trainingDays.includes(dow)&&++count>=remaining) return date;
  }
  return null;
}
