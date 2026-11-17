import test from 'node:test';
import assert from 'node:assert/strict';
import {travelDay} from '../src/travel-session.js';
import {v5Session} from '../src/engine-v5.js';
const ctx={equipment:['bar','db','kb','mc','cd','bw'],frequency:5,total:60,scale:1,strength:{},rms:{},perf:{}};
const NOISY=/saut|jump|burpee|sprint|course|navette|box jump/i;
test('every programme archetype gets a bodyweight travel version that keeps its intent and structure', () => {
  const seen=new Set();
  for(let i=0;i<10;i++){
    const day=v5Session(i,ctx);seen.add(day.archetype);
    for(const place of ['indoor','outdoor']){
      const t=travelDay(day,place,i);
      assert.ok(t.exercises.length>=4,`${day.archetype} ${place}`);
      assert.ok(t.exercises.every(e=>e.eq==='bw'&&e.kg===0&&e.n));
      assert.equal(t.archetype,day.archetype);
      if(day.blocks&&day.blocks.length&&day.metcon){
        assert.equal(t.blocks.length,day.blocks.length);
        t.blocks.forEach((b,k)=>{assert.equal(b.kind,day.blocks[k].kind==='emom'?'emom':'amrap');if(b.kind==='emom')assert.equal(b.durationMin%b.exercises.length,0);});
      }
      if(place==='indoor') assert.ok(!t.exercises.some(e=>NOISY.test(e.n)),`bruit en intérieur : ${t.exercises.map(e=>e.n)}`);
      assert.ok(new Set(t.exercises.map(e=>e.id)).size===t.exercises.length,'identifiants uniques');
    }
  }
  assert.ok(seen.size>=4);
});
test('rest days and missing days are left untouched; consecutive trips vary', () => {
  assert.equal(travelDay(null),null);const rest={label:'Repos'};assert.equal(travelDay(rest),rest);
  const d=v5Session(0,ctx);
  assert.notDeepEqual(travelDay(d,'indoor',0).exercises.map(e=>e.n),travelDay(d,'indoor',1).exercises.map(e=>e.n));
});

test('travel sessions use bodyweight only: no bag, towel, furniture, bench or bar', () => {
  const GEAR=/b(sac|serviettes?|bouteilles?|chaises?|lit|bureau|table|banc|barre|porte)b/i;
  for(let i=0;i<10;i++){const d=v5Session(i,ctx);for(const p of ['indoor','outdoor']){
    travelDay(d,p,i).exercises.forEach(e=>{assert.ok(!GEAR.test(e.n)&&!GEAR.test(e.cue||''),`${p} : ${e.n} — ${e.cue}`);});}}
});
