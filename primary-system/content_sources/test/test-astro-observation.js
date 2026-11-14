'use strict';
const assert = require('node:assert/strict');
const data = require('../astro-observation-data.js');
const text = value => assert.ok(typeof value === 'string' && value.trim() && !/["\n]|<[a-z/]/i.test(value), value);
assert.equal(data.cycleDays, 29.5);
assert.deepEqual(data.phases.map(p => p.key), ['new', 'waxcres', 'firstq', 'waxgib', 'full', 'wanggib', 'lastq', 'wancres']);
data.phases.forEach(p => { text(p.label); text(p.cal); text(p.note); });
for (const key of ['moonModel', 'moonCause', 'eclipseModel', 'eclipseCondition', 'solarSafety']) text(data[key]);
assert.deepEqual(data.eclipses.map(e => e.key), ['solar', 'lunar']);
for (const item of data.eclipses) {
  text(item.label); text(item.order);
  assert.equal(item.steps.length, 4);
  item.steps.forEach(step => { text(step.label); text(step.note); });
}
assert.equal(data.sources.length, 2);
data.sources.forEach(s => { text(s.title); assert.equal(new URL(s.url).protocol, 'https:'); });
assert.match(data.moonCause, /不是地球的影子/);
assert.match(data.eclipseCondition, /不是每次/);
console.log('✅ 月相与日月食：八种月相、两类四步演示、模型说明及出处通过结构校验');
