import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkout,normalizeWorkout,customWorkoutDay} from '../src/custom-workouts.js';
const base={id:'test',name:'Mon circuit',format:'emom',durationMin:12,moves:[{name:'Swing',quantity:12,unit:'reps',kg:20,sets:3,restSec:60},{name:'Carry',quantity:30,unit:'m',kg:24,sets:3,restSec:60}]};
test('EMOM composer preserves stations, duration, units and automatic 60-second cadence',()=>{
 const day=customWorkoutDay(base);assert.equal(day.blocks[0].rounds,6);assert.equal(day.blocks[0].cadenceSec,60);assert.equal(day.exercises[1].reps,'30m');assert.equal(day.totalMin,12);
});
test('AMRAP composer keeps manual rounds, never automatic movement cadence',()=>{
 const day=customWorkoutDay({...base,format:'amrap',durationMin:17});assert.equal(day.blocks[0].execution,'manual_rounds');assert.equal(day.blocks[0].cadenceSec,0);
});
test('classic preserves sets/rest, does not turn estimated duration into forced cutoff',()=>{
 const day=customWorkoutDay({...base,format:'classique'});assert.equal(day.metcon,false);assert.equal(day.exercises[0].sets,3);assert.equal(day.exercises[0].rest,60);assert.deepEqual(day.blocks,[]);
});
test('composer rejects NaN, empty workouts, partial EMOM cycles and impossible timed station',()=>{
 for(const patch of [{durationMin:'NaN'},{moves:[]},{durationMin:13},{moves:[{...base.moves[0],unit:'s',quantity:61}]}]) assert.ok(validateWorkout({...base,...patch}).length);
 assert.throws(()=>normalizeWorkout({...base,durationMin:0}));
});
test('identities remain stable across reloads and distinct across repeated exercises',()=>{
 const original=JSON.stringify(base);const a=customWorkoutDay(base),b=customWorkoutDay(JSON.parse(original));
 assert.deepEqual(a,b);assert.equal(JSON.stringify(base),original);assert.notEqual(a.exercises[0].id,a.exercises[1].id);
});

test('rounds-for-time plays as manual rounds with a round target and time cap', () => {
  const w={id:'r1',name:'Murph maison',format:'rounds',rounds:5,durationMin:40,moves:[{name:'Tractions',quantity:10,unit:'reps',kg:0}]};
  const day=customWorkoutDay(w,'2026-09-29');
  assert.equal(day.blocks[0].kind,'amrap');
  assert.equal(day.blocks[0].execution,'manual_rounds');
  assert.equal(day.blocks[0].rounds,5);
  assert.equal(day.blocks[0].cadenceSec,0);
  assert.equal(day.timeCapMin,40);
  assert.ok(validateWorkout({...w,rounds:0}).some(e=>e.includes('tours')));
});
