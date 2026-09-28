import test from 'node:test';
import assert from 'node:assert/strict';
import {buildV5Program,v5Session} from '../src/engine-v5.js';
import {selectHeroCombination} from '../src/program-selection.js';
import {circuitClock} from '../src/circuit-clock.js';
test('availability preserves all pending prescriptions',()=>{
 const expected=buildV5Program({frequency:5});
 for(const frequency of [2,3,4,6,7]) assert.deepEqual(buildV5Program({frequency}),expected);
 assert.equal(expected[15].archetype,'strength_upper');
});
test('all cycles contain five hybrid archetypes',()=>{
 const p=buildV5Program();
 for(let i=0;i<60;i+=5) assert.deepEqual(p.slice(i,i+5).map(d=>d.archetype),['strength_upper','kettlebell','hero','strength_lower','conditioning']);
});
test('KB structure varies and clocks match formats',()=>{
 const days=buildV5Program().filter(d=>d.archetype==='kettlebell');
 assert.ok(new Set(days.map(d=>d.blocks.map(b=>b.exercises.length).join())).size>=4);
 for(const day of days){assert.ok(day.workMin>=45);for(const b of day.blocks){
 if(b.kind==='emom') assert.equal(b.durationMin%b.exercises.length,0);
 else {assert.equal(b.execution,'manual_rounds');assert.equal(b.cadenceSec,0);}
 }}
});
test('missing feedback is not easy feedback; fatigue wins conflicts',()=>{
 const kb=ctx=>buildV5Program(ctx)[1].exercises;
 assert.deepEqual(kb({}),kb({kbFeedback:{rpe:null,intensity:null}}));
 const normal=kb({}),hard=kb({kbFeedback:{rpe:10,intensity:1}});
 normal.forEach((ex,i)=>{if(/^\d+$/.test(ex.reps)) assert.ok(Number(hard[i].reps)<=Number(ex.reps));});
});
test('Hero count and duration vary, without adjacent repeat',()=>{
 const days=buildV5Program().filter(d=>d.archetype==='hero');
 assert.ok(new Set(days.map(d=>d.blocks.length)).size>1);
 days.forEach((d,i)=>{assert.ok(d.workMin>=45&&d.workMin<=65);assert.equal(d.hero,d.blocks[0].heroId);
 if(i) assert.ok(d.blocks.every(b=>!days[i-1].blocks.some(p=>p.heroId===b.heroId)));});
 const long={id:'long',cap:45,moves:[{n:'a'}]};assert.deepEqual(selectHeroCombination([long]),[long]);
});
test('cache protects prescriptions and does not wrap completed program',()=>{
 const d=v5Session(0);d.label='changed';assert.notEqual(v5Session(0).label,'changed');assert.equal(v5Session(60),null);
});
test('EMOM advances once per minute even after background suspension',()=>{
 const clock=s=>circuitClock({kind:'emom',startedAt:1000,now:1000+s*1000,durationSec:900});
 for(const s of [0,20,40,59]) assert.equal(clock(s).completedMinutes,0);
 assert.equal(clock(60).completedMinutes,1);assert.equal(clock(180).completedMinutes,3);
 assert.equal(clock(999).completedMinutes,15);assert.equal(clock(999).done,true);assert.equal(clock(55).countdown,5);
});
test('AMRAP never invents completed movements; invalid time stays finite',()=>{
 const s=circuitClock({kind:'amrap',startedAt:1000,now:896000,durationSec:900});
 assert.equal(s.completedMinutes,0);assert.equal(s.countdown,5);
 assert.equal(circuitClock({kind:'emom',startedAt:'bad',durationSec:900,elapsed:NaN}).elapsed,0);
});
