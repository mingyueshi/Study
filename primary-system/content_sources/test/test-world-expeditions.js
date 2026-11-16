const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
global.window = {};
for (const f of ['world-data', 'world-expeditions-data', 'world-outlines-data']) require('../geo-map/' + f + '.js');
require('../history-timeline/timeline-data.js');
const D = window.GM_WORLD_EXPEDITIONS, O = window.GM_WORLD_OUTLINES;
const point = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
const prose = s => typeof s === 'string' && s.trim() && !/["';\r\n]/.test(s);
assert.equal(D.version, 1);
assert.equal(new Set(D.voyages.map(v => v.id)).size, D.voyages.length);
assert.ok(D.voyages.some(v => v.id === 'zhenghe'));
for (const v of D.voyages) {
  assert.ok(prose(v.name) && prose(v.note));
  assert.ok(v.stops.length >= 6 && new Set(v.stops.map(s => s.id)).size === v.stops.length);
  for (const [i,s] of v.stops.entries()) {
    assert.ok(point(s.point) && prose(s.name) && prose(s.text) && prose(s.observe));
    assert.ok(window.TIMELINE_EVENTS.some(e => e.id === s.history));
    assert.ok(s.sources.length && s.sources.every(id => D.sources.some(source => source.id === id)));
    if (i) { assert.ok(s.via.length && s.via.every(point)); assert.deepEqual(s.via.at(-1), s.point); }
  }
}
assert.ok(D.cities.length >= 10 && new Set(D.cities.map(c => c.id)).size === D.cities.length);
for (const c of D.cities) { assert.ok(point(c.point) && prose(c.name)); new Intl.DateTimeFormat('zh-CN', {timeZone:c.zone}).format(new Date()); }
assert.deepEqual(O.continents.map(c => c.id).sort(), window.GM_CONTINENTS.map(c => c.id).sort());
for (const c of O.continents) {
  assert.ok(c.rings.length && c.rings.every(r => r.length >= 4 && r.every(point)));
  assert.ok(prose(c.hint));
}
assert.match(O.source.sha256, /^[a-f0-9]{64}$/);
const html=fs.readFileSync(path.join(__dirname,'../geo-map/world-3d.html'),'utf8');
for (const f of ['world-expeditions-data.js','world-outlines-data.js','world-voyages.js','world-explorers.js','world-animals-data.js','world-plants-data.js','animals-learning.js']) assert.ok(html.includes(f));
console.log('世界地球仪航线、城市时区、七洲轮廓和历史关联校验通过');
