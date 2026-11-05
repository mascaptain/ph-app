import test from 'node:test';
import assert from 'node:assert/strict';
import {patternStrength,historyFor,twinIds} from '../src/strength-model.js';
import {DB} from '../src/catalog.js';
import {v5Session} from '../src/engine-v5.js';

// Profil réel au 02/11/2026 (1RM estimés) : le front squat sortait à 135 kg.
const rms={bb01:75,bb04:93.5,bb05:92.3,bb06:78,bb07:117,bb08:51.3,bb16:80.2,db03:20.5,db06:42,db11:35.8,db13:17.1,db17:33.6,kb01:38.4,kb08:32.8,mc01:68.3,mc02:71.5,mc07:84.5,mc08:104.5,mc12:37.6,x060:20.8,x069:27.3};
test('strength factors compare a max to a max: realistic ratios, every pattern filled', () => {
  const s=patternStrength(rms);
  for(const p of ['squat','hinge','push_h','push_v','pull_h','pull_v','arm_pull','arm_push']){assert.ok(s[p]>0.7&&s[p]<1.5,`${p}=${s[p]}`);}
  assert.ok(s._global>0.8&&s._global<1.3);
  assert.deepEqual(patternStrength({}),{});
});
test('a never-done front squat is estimated from squat strength, not at olympic loads', () => {
  const ctx={rms,perf:{},strength:patternStrength(rms),scale:1,equipment:['bar','db','kb','mc','cd','bw'],frequency:5,total:60};
  const day=v5Session(18,ctx);const fs=day.exercises.find(e=>/front squat/i.test(e.n));
  assert.ok(fs,'front squat attendu');assert.ok(fs.kg>=45&&fs.kg<=75,`front squat à ${fs.kg} kg`);
});
test('history on a catalogue twin counts for the exercise (same name, same equipment)', () => {
  const bb09=DB.find(e=>e.id==='bb09');assert.ok(twinIds(bb09).includes('x002'));
  assert.deepEqual(historyFor({x002:{kg:55}},bb09),{kg:55});
  assert.equal(historyFor({x060:{kg:20}},bb09),null);
});
