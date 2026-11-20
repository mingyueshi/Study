'use strict';
const assert = require('node:assert/strict');
const atlas = require('../astro-constellations.json');
assert.equal(Object.keys(atlas).length, 88);
assert.equal(new Set(Object.values(atlas).map(row => row.name)).size, 88);
for (const [code, {name, latin, stars, paths, tip, anchor}] of Object.entries(atlas)) {
  assert.match(code, /^[A-Z][A-Za-z]{2}$/);
  assert.ok(name.endsWith('座') && latin.length >= 3);
  assert.ok(tip === undefined || typeof tip === 'string' && tip.length > 10);
  assert.ok(Number.isInteger(anchor.hip) && anchor.hip > 0 && anchor.label.trim());
  assert.ok(stars.length >= 2 && paths.length > 0);
  for (const [ra, dec, magnitude] of stars) {
    assert.ok(Number.isFinite(ra) && Math.abs(ra) <= 180);
    assert.ok(Number.isFinite(dec) && Math.abs(dec) <= 90);
    assert.ok(Number.isFinite(magnitude) && magnitude > -3 && magnitude < 10);
  }
  const used = new Set(paths.flat());
  assert.equal(used.size, stars.length);
  for (const path of paths) {
    assert.ok(path.length >= 2 && path.every(i => Number.isInteger(i) && i >= 0 && i < stars.length));
  }
}
assert.equal(atlas.Ser.latin, 'Serpens');
assert.equal(atlas.Cas.stars.length, 5);
console.log('88 个星座的名称、星点、星等与连线通过校验。');

const guide = require('../astro-telescope.json');
assert.match(guide.safety, /太阳/);
assert.equal(guide.parts.length, 3);
for (const part of guide.parts) assert.ok(part.name?.trim() && part.use?.trim());
for (const step of guide.steps) assert.ok(['title', 'action', 'check'].every(k => step[k]?.trim()));
for (const issue of guide.troubleshooting) assert.ok(issue.symptom?.trim() && issue.answer?.trim());

const sky = require('../astro-sky.js');
const engine = require('../vendor/astronomy-engine/astronomy.browser.min.js');
const moon = require('../astro-moon-calendar.js');
assert.equal(sky.parseClock('2024-01-01T00:01').toISOString(), '2023-12-31T16:01:00.000Z');
for (const value of ['2023-02-29T00:00', '2101-01-01T00:00', '', '2024-01-01T24:00']) {
  assert.equal(sky.parseClock(value), null);
}
assert.ok(moon.moonAt(sky.parseClock('1900-01-01T00:00'), engine));
// 香港天文台《2024 年历》，6 月 21 日日出 05:40，日落 19:10。取整及折射差容许两分钟。
const observer = new engine.Observer(22.302, 114.174, 0);
const solstice = sky.parseClock('2024-06-21T00:01');
const [rise, set] = sky.solarDay(engine, observer, solstice);
function minutes(time) { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
assert.ok(Math.abs(minutes(rise) - 340) <= 2);
assert.ok(Math.abs(minutes(set) - 1150) <= 2);
for (const date of [solstice, sky.parseClock('2024-12-21T23:59')]) {
  assert.deepEqual(sky.solarDay(engine, new engine.Observer(80, 0, 0), date), [null, null]);
}
assert.match(sky.visibility('Mars', -1, -15, 40), /地平线下/);
assert.match(sky.visibility('Venus', 40, 25, 30), /白昼/);
assert.match(sky.visibility('Mercury', 12, -8, 13), /太近/);
assert.match(sky.visibility('Uranus', 40, -20, 120), /双筒镜/);
assert.match(sky.visibility('Neptune', 40, -20, 120), /望远镜/);
console.log('望远镜课程、日界、历表日出日落、极区与行星可见性通过校验。');
