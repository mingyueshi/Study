'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const d = require('../astro-discovery-data.js');
assert.equal(d.scales.length, 5);
assert.equal(d.challenges.length, 6);
const ids = new Set();
for (const s of d.scales) {
  assert.ok(!ids.has(s.id)); ids.add(s.id);
  for (const key of ['name','address','text','kind','image','link','linkLabel']) assert.ok(s[key]);
  assert.ok(fs.existsSync(path.join(__dirname, '..', s.image)));
  assert.match(s.link, /^(#roam-|\?view=au)/);
}
for (const t of d.targets) {
  assert.ok(Number.isFinite(t.km) && t.km > 0);
  assert.equal(new URL(t.source).protocol, 'https:');
  assert.ok(t.from && t.to && t.note);
}
const qids = new Set();
for (const q of d.challenges) {
  assert.ok(!qids.has(q.id)); qids.add(q.id);
  assert.equal(q.options.length,3);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 3);
  assert.ok(q.question && q.explanation);
  assert.match(q.link, /^#roam-/);
}
function walk(v) {
  if(typeof v === 'string') assert.ok(!/["\n]|<[a-z/]/i.test(v),v);
  else if(v && typeof v === 'object') Object.values(v).forEach(walk);
}
walk(d);
const logic = require('../astro-discovery.js');
assert.ok(Math.abs(logic.travelSeconds(384400, 1)-1.2822)<.001);
assert.equal(logic.travelSeconds(149600000, 2), 2*logic.travelSeconds(149600000, 1));
assert.ok(logic.duration(499).includes('8 分'));
assert.ok(logic.duration(14994).includes('4 小时'));
const clean=logic.cleanProgress({moon:{first:99,last:1},distance:{first:0,last:2},unknown:{first:0,last:0}}, d.challenges);
assert.deepEqual(Object.keys(clean), ['distance']);
assert.deepEqual(logic.cleanProgress(null,d.challenges),{});
console.log('✅ 宇宙地址、光旅行计算、挑战关联和存档校验通过');
