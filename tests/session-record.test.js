import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionRecord} from '../src/session-record.js';

const columns=new Set('user_id date week day day_label session_type session_index mode total_kg total_sets target_kg target_sets duration_seconds score completed exercises feedback notes'.split(' '));
test('Hero saves only actual sessions columns, preserving both block identities',()=>{
  const entry={user_id:'test-user',date:'2026-09-08',day:'MAR',dayLabel:'Hero - Corps entier',
    tag:'hero:havana',sessionIndex:13,mode:'amrap',duration:3765,totalSets:24,
    exercises:[],feedback:{global:4},weights:{ignored:42}};
  const blocks=[{heroId:'havana',heroName:'Havana',kind:'amrap',durationMin:25,exercises:[]},
    {heroId:'ricky',heroName:'Ricky',kind:'amrap',durationMin:20,exercises:[]}];
  const record=sessionRecord(entry,{week:'S37',blocks});
  assert.ok(Object.keys(record).every(key=>columns.has(key)));
  assert.equal(Object.hasOwn(record,'tag'),false);
  assert.equal(record.feedback.workout.tag,'hero:havana');
  assert.deepEqual(record.feedback.workout.blocks.map(b=>b.heroId),['havana','ricky']);
  assert.deepEqual(entry.feedback,{global:4});
  assert.equal(record.duration_seconds,3765);assert.equal(record.completed,true);
});
test('classic save has no fabricated Hero metadata',()=>{
  const record=sessionRecord({dayLabel:'Force - Jambes',feedback:null,exercises:[]});
  assert.equal(record.feedback.workout,undefined);assert.equal(record.notes,'');
});
test('custom workout snapshot survives saving without introducing SQL columns',()=>{
  const custom={id:'custom-test',name:'Mon entraînement',format:'emom',durationMin:12,moves:[]};
  const record=sessionRecord({feedback:{workout:{custom}},exercises:[]},{blocks:[{kind:'emom',durationMin:12,exercises:[]}]});
  assert.deepEqual(record.feedback.workout.custom,custom);
  assert.ok(Object.keys(record).every(key=>columns.has(key)));
});
