import test from 'node:test';
import assert from 'node:assert/strict';
import {addPause,pauseOn,resumePause,projectedEnd,validDate} from '../src/training-pause.js';
const vacation={id:'v',reason:'vacances',start:'2026-09-28',end:'2026-10-01'};
test('pause inclusive, automatic resume October 2 without advancing program',()=>{
  const pauses=addPause([],vacation);
  assert.ok(pauseOn(pauses,'2026-10-01'));
  assert.equal(pauseOn(pauses,'2026-10-02'),null);
  assert.equal(projectedEnd({from:'2026-09-28',remaining:2,trainingDays:[0,1,3,4,5],pauses}),'2026-10-03');
});
test('injury stays paused until explicit resume, retains history',()=>{
  const pauses=addPause([],{...vacation,reason:'blessure',end:null});
  assert.ok(pauseOn(pauses,'2027-01-01'));
  assert.equal(projectedEnd({from:'2026-09-28',remaining:60,trainingDays:[0],pauses}),null);
  const resumed=resumePause(pauses,'v','2026-10-02');
  assert.ok(pauseOn(resumed,'2026-10-01'));
  assert.equal(pauseOn(resumed,'2026-10-02'),null);
});
test('reject invalid and overlapping periods; cancelling future pause preserves history',()=>{
  assert.equal(validDate('2026-02-30'),false);
  assert.throws(()=>addPause([],{...vacation,end:'2026-09-27'}));
  assert.throws(()=>addPause([vacation],{...vacation,id:'b'}));
  assert.equal(pauseOn(resumePause([vacation],'v','2026-09-27'),'2026-09-28'),null);
});
