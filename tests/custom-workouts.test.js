import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWorkout,normalizeWorkout,customWorkoutDay,parseQuickEntry,stationsOf,workoutVolume} from '../src/custom-workouts.js';
import {HOUSE_WORKOUTS} from '../src/house-workouts.js';
const base={id:'test',name:'Mon circuit',format:'emom',durationMin:12,moves:[{name:'Swing',quantity:12,unit:'reps',kg:20,sets:3,restSec:60},{name:'Carry',quantity:30,unit:'m',kg:24,sets:3,restSec:60}]};
test('EMOM composer preserves stations, duration, units and automatic 60-second cadence',()=>{
 const day=customWorkoutDay(base);assert.equal(day.blocks[0].rounds,6);assert.equal(day.blocks[0].cadenceSec,60);assert.equal(day.exercises[1].reps,'30 m');assert.equal(day.totalMin,12);
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

test('rounds with rest play in the circuit player: N tours then rest', () => {
  const w={id:'r1',name:'Duo',format:'rounds',rounds:10,roundRestSec:60,durationMin:45,moves:[
    {name:'Squats',quantity:5,unit:'reps',kg:0},{name:'Arnold press',quantity:5,unit:'reps',kg:0,link:true},{name:'Burpees',quantity:5,unit:'reps',kg:0}]};
  const d=customWorkoutDay(w);
  assert.equal(d.blocks[0].kind,'circuit');assert.equal(d.blocks[0].tours,10);assert.equal(d.blocks[0].restSec,60);
  assert.deepEqual(d.exercises.map(e=>[e.n,e.reps]),[['Squats + Arnold press','5'],['Burpees','5']]);
  assert.deepEqual(workoutVolume(w).total,{reps:150});
  assert.ok(validateWorkout({...w,rounds:0}).some(e=>e.includes('tours')));
});
test('for time stops on the last round and keeps the cap', () => {
  const d=customWorkoutDay({id:'c',name:'Chipper',format:'fortime',rounds:1,durationMin:20,moves:[{name:'Thrusters',quantity:40,unit:'reps',kg:0}]});
  assert.equal(d.blocks[0].kind,'amrap');assert.equal(d.blocks[0].targetRounds,1);assert.equal(d.blocks[0].durationMin,20);assert.equal(d.blocks[0].cadenceSec,0);
});
test('quick entry: one line per station, + chains, units kept, missing quantity reported', () => {
  const {moves,skipped}=parseQuickEntry('5 squats + arnold press\n40 burpees\n200 m rameur\n30 s gainage\n10 cal bike\nplanche');
  assert.deepEqual(moves.map(m=>[m.quantity,m.unit,m.name,!!m.link]),[[5,'reps','Squats',false],[5,'reps','Arnold press',true],[40,'reps','Burpees',false],[200,'m','Rameur',false],[30,'s','Gainage',false],[10,'cal','Bike',false]]);
  assert.deepEqual(skipped,['planche']);
});
test('house workouts are valid and match the prescriptions', () => {
  const [duo,chip]=HOUSE_WORKOUTS;
  assert.deepEqual(validateWorkout(duo),[]);assert.deepEqual(validateWorkout(chip),[]);
  assert.equal(stationsOf(duo.moves).length,5);assert.deepEqual(workoutVolume(duo).total,{reps:400});
  assert.deepEqual(workoutVolume(chip).total,{reps:280});assert.equal(chip.durationMin,20);
});
