/* 地球仪内容先校验：复用原档案 ID，极区保持完整。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
global.window = global;
require('../geo-map/world-geo.js');
require('../geo-map/world-data.js');
require('../geo-map/world-3d-data.js');
require('../geo-map/world-3d-polar.js');
require('../geo-map/world-3d-learning-data.js');
const data = GM_WORLD_3D;
const point = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
assert.ok(point(data.home));
assert.deepEqual(Object.keys(data.continentViews).sort(), GM_CONTINENTS.map(c => c.id).sort());
Object.values(data.continentViews).forEach(p => assert.ok(point(p)));
assert.equal(data.views.length, 4);
const ids = new Set([...GEO_WORLD_GEO.countries.map(c => c.name), ...GM_OCEANS.map(o => o.id), ...GM_WORLD_FEATURES.map(f => f.id)]);
data.views.forEach(v => { assert.ok(v.id && v.name && point(v.point)); });
assert.equal(new Set(data.views.map(v => v.id)).size, data.views.length);
assert.ok(data.observations.length >= 3);
data.observations.forEach(o => {
  assert.ok(o.title && o.text && ids.has(o.place));
  assert.ok(!/["\r\n]/.test(o.title + o.text));
});
assert.equal(GM_WORLD_3D_POLAR.source.url, 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json');
assert.match(GM_WORLD_3D_POLAR.source.sha256, /^[a-f0-9]{64}$/);
assert.ok(GM_WORLD_3D_POLAR.rings.length > 0);
GM_WORLD_3D_POLAR.rings.forEach(ring => { assert.ok(ring.length >= 3); ring.forEach(p => assert.ok(point(p))); });
assert.ok(GM_WORLD_3D_POLAR.rings.flat().some(p => p[1] < -85), '地球仪的南极洲不能沿用平面图截到南纬 73° 的轮廓');
assert.ok(GM_WORLD_3D_POLAR.rings.some(r => r.slice(-2).every(p => p[1] === -90) && Math.abs(r.at(-1)[0] - r.at(-2)[0]) === 360), '南极海岸须在纹理两侧经南极点闭合，不能留下海洋圆孔');
assert.ok(data.note && !/["\r\n]/.test(data.note));
const dir = path.join(__dirname, '../geo-map');
const learning = GM_WORLD_LEARNING;
const unique = rows => assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
const prose = value => assert.ok(typeof value === 'string' && value.trim() && !/["\r\n]/.test(value));
assert.equal(learning.lines.length, 6); unique(learning.lines);
learning.lines.forEach(line => {
  assert.ok(['latitude', 'longitude'].includes(line.axis));
  assert.ok(Number.isFinite(line.value) && Math.abs(line.value) <= (line.axis === 'latitude' ? 90 : 180));
  assert.ok(point(line.point));
  ['name', 'text', 'observe'].forEach(key => prose(line[key]));
  assert.match(line.color, /^#[a-f0-9]{6}$/i);
});
const lineIds = new Set(learning.lines.map(l => l.id));
assert.equal(learning.zones.length, 5); unique(learning.zones);
let previous = -90;
learning.zones.forEach(zone => {
  assert.equal(zone.min, previous); assert.ok(zone.max > zone.min); previous = zone.max;
  prose(zone.name); prose(zone.text); assert.match(zone.color, /^#[a-f0-9]{6}$/i);
});
assert.equal(previous, 90);
prose(learning.zoneNote);
assert.equal(learning.tours.length, 3); unique(learning.tours);
learning.tours.forEach(tour => {
  prose(tour.name); prose(tour.intro); assert.equal(tour.stops.length, 5); unique(tour.stops);
  tour.stops.forEach(stop => { assert.ok(ids.has(stop.place)); prose(stop.title); prose(stop.text); prose(stop.observe); if (stop.line) assert.ok(lineIds.has(stop.line)); });
});
assert.equal(learning.questions.length, 12); unique(learning.questions);
learning.questions.forEach(q => {
  prose(q.prompt); prose(q.hint); prose(q.explanation); assert.ok(ids.has(q.place));
  assert.equal(q.options.length, 3); q.options.forEach(prose); assert.equal(new Set(q.options).size, 3);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
  if (q.line) assert.ok(lineIds.has(q.line));
});
learning.sources.forEach(s => { prose(s.name); assert.ok(/^https:\/\//.test(s.url)); });
const html = fs.readFileSync(path.join(dir, 'world-3d.html'), 'utf8');
for (const match of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g)) {
  assert.ok(!/^https?:/.test(match[1]), '地球仪资源应在本地提供');
  assert.ok(fs.existsSync(path.join(dir, match[1])), '资源存在：' + match[1]);
}
for (const file of ['index.html', 'china.html', 'world.html']) assert.ok(fs.readFileSync(path.join(dir, file), 'utf8').includes('href="world-3d.html"'), file + ' 应可进入地球仪');
console.log('3D 世界地图内容与极区结构校验通过');
