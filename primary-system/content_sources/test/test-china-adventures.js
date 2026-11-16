/* 新玩法先校验数据，再由页面挂载；稳定 ID 用于本机记录。 */
const assert = require('node:assert/strict');
global.window = {};
for (const file of ['map-data', 'china-3d-data', 'china-rivers-data', 'china-adventures-data']) require('../geo-map/' + file + '.js');
const D = window.GM_CHINA_ADVENTURES, provinces = new Set(window.GM_PROVINCES.map(p => p.id)), features = new Set(window.GM_FEATURES.map(f => f.id));
const point = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 73 && p[0] <= 136 && p[1] >= 18 && p[1] <= 54;
const chinese = s => typeof s === 'string' && s.length > 0 && !/["';\r\n]/.test(s);
assert.equal(D.version, 1);
assert.ok(D.missions.length >= 12);
assert.equal(new Set(D.missions.map(m => m.id)).size, D.missions.length);
for (const m of D.missions) {
  assert.ok(['detective', 'hunt'].includes(m.kind));
  assert.ok(['id', 'title', 'clue', 'explanation'].every(k => chinese(m[k])), m.id);
  assert.ok(m.hints.length === 2 && m.hints.every(chinese));
  assert.ok(point(m.point));
  if (m.kind === 'detective') assert.ok(provinces.has(m.answer));
  else assert.ok(m.toleranceKm >= 30 && m.toleranceKm <= 150);
  assert.ok(/^https:\/\//.test(m.source));
}
assert.equal(D.routes.length, 2);
for (const route of D.routes) {
  assert.ok(['flight', 'canal'].includes(route.kind));
  assert.ok(chinese(route.note) && chinese(route.name));
  if (route.river) assert.ok(window.GM_CHINA_RIVERS.rivers[route.river]);
  else assert.ok(route.path.length >= 5 && route.path.every(point));
  assert.ok(route.stops.length >= 5 && new Set(route.stops.map(s => s.id)).size === route.stops.length);
  for (const stop of route.stops) {
    assert.ok(point(stop.anchor));
    assert.ok(['name', 'terrain', 'description', 'observe'].every(k => chinese(stop[k])));
    assert.ok(stop.related.every(id => features.has(id)));
    assert.ok(stop.sources.every(id => D.sources.some(s => s.id === id)));
  }
}
assert.equal(D.lakes.length, 6);
for (const lake of D.lakes) {
  assert.ok(features.has(lake.feature));
  assert.ok(lake.rings.length && lake.rings.every(ring => ring.length >= 4 && ring.every(point)));
}
assert.ok(/^[a-f0-9]{64}$/.test(D.lakeSource.sha256));
assert.ok(chinese(D.snowNote) && D.snowMeters === 5000);
console.log('中国地图新玩法数据结构、来源与稳定引用校验通过');
