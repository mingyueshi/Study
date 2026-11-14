/* 科学演示说明与状态结构；先校验，再发布。 */
'use strict';
const assert = require('node:assert/strict');
const data = require('../sci-demo-data.js');
const text = value => assert.ok(typeof value === 'string' && value.trim() && !/["\n]|<[a-z/]/i.test(value), value);
assert.deepEqual(data.states.map(item => item.id), ['ice', 'water', 'vapor']);
for (const state of data.states) {
  for (const key of ['name', 'note', 'condition']) text(state[key]);
  assert.match(state.color, /^#[a-f0-9]{6}$/i);
}
for (const key of ['stateModelNote', 'temperatureNote', 'circuitModelNote']) text(data[key]);
assert.deepEqual(data.circuits.map(item => item.id), ['series', 'parallel', 'open']);
for (const circuit of data.circuits) { text(circuit.name); text(circuit.note); }
assert.deepEqual(Object.keys(data.circuitStatus), ['seriesClosed', 'seriesOpen', 'parallelBoth', 'parallelOne', 'parallelNone']);
Object.values(data.circuitStatus).forEach(text);
assert.deepEqual(Object.keys(data.sources), ['states', 'circuit']);
for (const sources of Object.values(data.sources)) {
  assert.ok(sources.length > 0);
  for (const source of sources) { text(source.title); assert.equal(new URL(source.url).protocol, 'https:'); }
}
assert.match(data.states[2].condition, /常温.*蒸发/);
assert.match(data.circuitModelNote, /约定电流方向/);
console.log('✅ 科学演示：三态、三种电路入口、五种通断反馈及出处通过结构校验');
