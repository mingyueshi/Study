'use strict';
const assert = require('node:assert/strict');
const data = require('../geo/earth-data.js');
const text = s => assert.ok(typeof s === 'string' && s.trim() && !/["\n]|<[a-z/]/i.test(s), s);
assert.equal(data.tilt,23.5);
assert.deepEqual(data.latitudes.map(n=>n.value),[40,0,-40]);
data.latitudes.forEach(n=>text(n.label));
for (const key of ['day','year']) {
  const entry=data[key];
  for (const field of ['label','prompt','model']) text(entry[field]);
  assert.equal(entry.stops.length,4);
  assert.equal(new Set(entry.stops.map(s=>s.id)).size,4);
  entry.stops.forEach((s,i)=>{text(s.id);text(s.label);text(s.note);assert.equal(s.progress,i/4);});
}
assert.deepEqual(data.year.stops.map(s=>s.id),['june','september','december','march']);
data.year.stops.forEach(s=>assert.match(s.label,/^\d{1,2}月.+$/));
assert.match(data.day.model,/北极/); assert.match(data.day.model,/赤道/);
assert.match(data.year.model,/折射/); assert.match(data.year.model,/比例/);
for (const field of ['lit','dark','boundary']) text(data.day[field]);
for (const field of ['between','untilt']) text(data.year[field]);
data.sources.forEach(s=>{text(s.title);assert.equal(new URL(s.url).protocol,'https:');});
console.log('✅ 昼夜与四季：四个位置、纬度、倾角、模型限制和出处通过结构校验');
