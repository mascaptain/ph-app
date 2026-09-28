// Select complete sessions, not a greedy pair that merely fills 45 minutes.
export function selectHeroCombination(pool, {previous=[], uses={}, occurrence=0}={}) {
  const available=pool.filter(h=>!previous.includes(h.id));
  const choices=[];
  function visit(start,picks,total) {
    if(total>=45 && total<=65) choices.push([...picks]);
    if(picks.length===3 || total>=65) return;
    for(let i=start;i<available.length;i++) visit(i+1,[...picks,available[i]],total+available[i].cap);
  }
  visit(0,[],0);
  const counts=[...new Set(choices.map(c=>c.length))].sort();
  const targetCount=counts[occurrence%counts.length];
  const score=picks=>{
    const names=picks.flatMap(h=>h.moves.map(m=>m.n.toLowerCase()));
    const overlap=names.length-new Set(names).size;
    const minutes=picks.reduce((sum,h)=>sum+h.cap,0);
    return Math.abs(picks.length-targetCount)*1000
      +picks.reduce((sum,h)=>sum+(uses[h.id]||0),0)*20
      +overlap*5+Math.abs(minutes-[45,50,55,60][occurrence%4]);
  };
  return choices.sort((a,b)=>score(a)-score(b)||a.map(h=>h.id).join().localeCompare(b.map(h=>h.id).join()))[0]||[];
}
