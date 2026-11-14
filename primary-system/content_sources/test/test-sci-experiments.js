'use strict';
const assert = require('node:assert/strict');
const data = require('../sci-experiments-data.js');
const text = value => assert.ok(typeof value === 'string' && value.trim() && !/["\n]|<[a-z/]/i.test(value), value);
assert.deepEqual(Object.keys(data), ['sound', 'tone', 'machine', 'magnet', 'electromagnet', 'buoyancy', 'structure']);
for (const entry of Object.values(data)) {
  for (const key of ['title', 'prompt', 'model']) text(entry[key]);
  assert.ok(entry.sources.length);
  entry.sources.forEach(s => { text(s.title); assert.equal(new URL(s.url).protocol, 'https:'); });
}
assert.deepEqual(data.sound.media.map(m => m.id), ['air', 'vacuum']);
data.sound.media.forEach(m => { text(m.label); text(m.note); });
for (const key of ['frequency', 'amplitude']) {
  const range = data.tone[key]; text(range.label);
  assert.ok(range.min > 0 && range.min <= range.initial && range.initial <= range.max);
}
assert.deepEqual(data.machine.modes.map(m => m.id), ['lever', 'pulley', 'ramp']);
data.machine.modes.forEach(m => { text(m.label); text(m.note); });
assert.deepEqual(data.machine.pulleys.map(m => m.id), ['fixed', 'moving']);
data.machine.pulleys.forEach(m => { text(m.label); text(m.note); });
assert.deepEqual(data.machine.fulcrum, {min:20, max:80, initial:30});
assert.deepEqual(data.machine.run, {min:100, max:400, initial:200});
assert.equal(data.machine.rise, 100);
assert.match(data.sound.model, /原位/); assert.match(data.tone.model, /时间/);
text(data.tone.note);
assert.match(data.machine.model, /摩擦/);
assert.deepEqual(data.magnet.poles.map(m => m.id), ['attract', 'repel']);
data.magnet.poles.forEach(m => { text(m.label); text(m.note); });
assert.deepEqual(data.electromagnet.current, {label:'电流档位', min:1, max:3, initial:2});
assert.deepEqual(data.electromagnet.turns, {label:'线圈匝数', min:4, max:12, initial:8});
for (const key of ['ready', 'on', 'off']) text(data.electromagnet[key]);
assert.match(data.magnet.model, /不计算/);
assert.match(data.electromagnet.model, /剩磁/);
assert.deepEqual(data.buoyancy.blocks.map(b=>b.id), ['light','balanced','heavy']);
assert.deepEqual(data.buoyancy.blocks.map(b=>b.ratio), [.6,1,1.6]);
data.buoyancy.blocks.forEach(b=>{text(b.label);text(b.note);assert.ok(Number.isFinite(b.ratio)&&b.ratio>0);});
assert.deepEqual(Object.keys(data.buoyancy.states), ['rising','floating','suspended','sinking']);
Object.values(data.buoyancy.states).forEach(text);
for(const entry of [data.buoyancy,data.structure]) Object.values(entry.labels).forEach(text);
assert.match(data.buoyancy.model,/阻力/);assert.match(data.buoyancy.model,/触底/);
assert.deepEqual(data.structure.directions.map(d=>d.id),['right','left']);
data.structure.directions.forEach(d=>text(d.label));
assert.deepEqual(data.structure.braces.map(b=>b.id),['on','off']);
data.structure.braces.forEach(b=>{text(b.label);text(b.note);});
assert.match(data.structure.model,/接头/);assert.match(data.structure.model,/强度/);
console.log('✅ 科学观察：声音、机械、磁、浮沉与框架的说明、参数、模型限制和出处校验通过');
