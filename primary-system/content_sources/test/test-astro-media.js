/* 天文漫游：内容、来源、媒体与课程关联的发布前校验。 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../astro-media-data.js');
const astro = require('../astro-data.js');
const ids = new Set();
const unitIds = new Set(astro.units.map(u => u.id));
const local = file => {
  assert.match(file, /^images\/astro\/[a-z0-9-]+\.(jpg|webm)$/);
  const bytes = fs.readFileSync(path.join(__dirname, '..', file));
  assert.ok(bytes.length > 1000, file);
  assert.ok(file.endsWith('.jpg') ? bytes[0] === 255 && bytes[1] === 216 : bytes.subarray(0, 4).toString('hex') === '1a45dfa3', file);
};
const url = value => assert.equal(new URL(value).protocol, 'https:');
assert.deepEqual(data.chapters.map(c => c.id), ['solar', 'galaxy', 'deep']);
for (const c of data.chapters) {
  assert.ok(unitIds.has(c.unit));
  for (const f of ['title', 'intro', 'question', 'answer', 'scale', 'credit', 'watch']) assert.ok(c[f]?.trim(), c.id + '.' + f);
  assert.ok(c.images.length >= 2);
  for (const m of [...c.images, c.movie]) {
    assert.ok(!ids.has(m.id)); ids.add(m.id);
    for (const f of ['title', 'caption', 'kind', 'credit']) assert.ok(m[f]?.trim(), m.id + '.' + f);
    local(m.src); url(m.source); url(m.original);
    if (m.poster) local(m.poster);
  }
  assert.ok(c.links.length >= 2);
  for (const l of c.links) { assert.ok(l.title && l.note); url(l.url); }
}
assert.equal(data.planets.length, 8);
assert.deepEqual(Object.keys(data.modelNotes), ['orbits', 'distance', 'size']);
assert.ok(Object.values(data.modelNotes).every(v => typeof v === 'string' && v.length > 20));
url(data.planetSource);
assert.match(data.checked, /^\d{4}-\d{2}-\d{2}$/);
for (const p of data.planets) {
  assert.ok(p.name && p.fact); assert.ok(p.au > 0 && p.period > 0 && p.diameter > 0);
  assert.match(p.color, /^#[a-f0-9]{6}$/i);
}
assert.ok(data.planets.every((p, i) => i === 0 || p.au > data.planets[i - 1].au));
function walk(v) {
  if (typeof v === 'string') assert.ok(!/["\n]|<[a-z/]/i.test(v), v);
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
}
walk(data);
console.log('✅ 天文漫游：3 个主题、6 幅图、3 段动画、8 颗行星的结构与本地媒体通过');
