'use strict';
const assert = require('node:assert/strict');
const data = require('../sci-process-data.js');
const text = value => assert.ok(typeof value === 'string' && value.trim() && !/["\n]|<[a-z/]/i.test(value), value);
assert.deepEqual(Object.keys(data), ['light', 'water', 'photo', 'foodchain']);
assert.deepEqual(data.light.modes.map(mode => mode.id), ['mirror', 'water']);
assert.deepEqual(data.light.angle, {min: 0, max: 75, initial: 40});
assert.equal(data.light.indices.air, 1);
assert.equal(data.light.indices.water, 1.333);
for (const mode of data.light.modes) {
  text(mode.label); text(mode.note); text(mode.straightNote);
  assert.equal(mode.steps.length, 2);
  mode.steps.forEach(step => { text(step.label); text(step.note); });
}
assert.deepEqual(data.water.steps.map(step => step.id), ['evaporation', 'condensation', 'precipitation', 'runoff']);
data.water.steps.forEach(step => { text(step.label); text(step.note); });
for (const section of Object.values(data)) {
  text(section.model); text(section.prompt);
  assert.ok(section.sources.length > 0);
  section.sources.forEach(source => { text(source.title); assert.equal(new URL(source.url).protocol, 'https:'); });
}
assert.match(data.water.model, /同时/);
assert.match(data.water.steps[0].note, /看不见/);
assert.match(data.light.modes[1].note, /反射一部分/);
assert.deepEqual(data.photo.steps.map(step => step.id), ['sunlight', 'water', 'carbon', 'sugar', 'oxygen']);
assert.deepEqual(data.foodchain.nodes.map(node => node.id), ['rice', 'locust', 'frog', 'snake', 'hawk']);
for (const key of ['photo', 'foodchain']) {
  const section = data[key];
  for (const field of ['title', 'diagramLabel', 'heading', 'footer']) text(section[field]);
  assert.equal(new Set(section.nodes.map(node => node.id)).size, section.nodes.length);
  assert.equal(new Set(section.steps.map(step => step.id)).size, section.steps.length);
  section.nodes.forEach(node => { text(node.id); text(node.label); text(node.detail); });
  section.steps.forEach(step => {
    text(step.id); text(step.label); text(step.note);
    for (const end of ['from', 'to']) assert.ok(section.nodes.some(node => node.id === step[end]));
    assert.notEqual(step.from, step.to);
  });
}
assert.deepEqual(data.photo.steps.map(step => [step.from, step.to]),
  [['sun', 'leaf'], ['water', 'leaf'], ['carbon', 'leaf'], ['leaf', 'sugar'], ['leaf', 'oxygen']]);
assert.equal(data.foodchain.steps.length, 4);
data.foodchain.steps.forEach((step, i) => {
  assert.equal(step.from, data.foodchain.nodes[i].id);
  assert.equal(step.to, data.foodchain.nodes[i + 1].id);
});
assert.match(data.photo.model, /同时/);
assert.match(data.photo.model, /呼吸/);
assert.match(data.foodchain.model, /不循环/);
console.log('✅ 光路、水循环、光合作用与食物链：参数、关系方向、分步说明和出处通过结构校验');
