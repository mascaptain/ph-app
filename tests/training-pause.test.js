import test from 'node:test';
import assert from 'node:assert/strict';
import {addPause,editPause,pauseOn,resumePause,projectedEnd,validDate} from '../src/training-pause.js';
const vacation={id:'v',reason:'vacances',start:'2026-09-28',end:'2026-10-01'};
test('edit both boundaries of active, future or past pause without duplicating identity',()=>{
  const original=[vacation];
  const edited=editPause(original,'v',{start:'2026-09-25',end:'2026-10-05'});
  assert.equal(edited.length,1);assert.equal(edited[0].id,'v');assert.equal(original[0].end,'2026-10-01');
  assert.ok(pauseOn(edited,'2026-10-05'));
  assert.equal(pauseOn(editPause(edited,'v',{start:'2026-10-10',end:'2026-10-15'}),'2026-09-29'),null);
  assert.equal(pauseOn(editPause(edited,'v',{start:'2026-09-20',end:'2026-09-22'}),'2026-09-29'),null);
});
test('edited dates reject overlap and reversed dates, and support open-ended injury',()=>{
  const second={...vacation,id:'b',start:'2026-10-10',end:'2026-10-12'};
  assert.throws(()=>editPause([vacation,second],'v',{start:vacation.start,end:second.start}));
  assert.throws(()=>editPause([vacation],'v',{start:vacation.start,end:'2026-09-20'}));
  assert.throws(()=>editPause([vacation],'missing',vacation));
  const injury=editPause([{...vacation,reason:'blessure'}],'v',{start:vacation.start,end:null});
  assert.ok(pauseOn(injury,'2027-01-01'));
  assert.equal(pauseOn(editPause(injury,'v',{start:vacation.start,end:'2026-10-02'}),'2026-10-03'),null);
});
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
