/* 先验证流域、支流和河口的数据契约，再生成与挂载。 */
const assert = require('node:assert/strict');
global.window = {};
for (const file of ['map-data', 'china-3d-data', 'china-hydrology-data', 'china-hydrology-geo']) require('../geo-map/' + file + '.js');
const D = window.GM_CHINA_HYDROLOGY, geo = window.GM_CHINA_HYDROLOGY_GEO;
const riverIds = new Set(window.GM_CHINA_3D.rivers.map(r => r.feature));
const point = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 73 && p[0] <= 136 && p[1] >= 18 && p[1] <= 54;
const prose = s => assert.ok(typeof s === 'string' && s.trim() && !/["';\r\n]/.test(s), s);
const unique = rows => assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
assert.equal(D.basins.length, 5); assert.equal(Object.keys(geo.basins).length, 5);
assert.equal(D.lakeFloorMeters, 0, '本组六处地表湖的显示水面不低于海平面');
assert.ok(D.tributaries.length >= 12); unique(D.tributaries); unique(D.estuaries);
for (const basin of D.basins) {
  assert.ok(riverIds.has(basin.feature));
  assert.ok(Number.isFinite(basin.areaKm2) && basin.areaKm2 > 100000);
  ['name', 'areaLabel', 'text', 'observe', 'scope'].forEach(key => prose(basin[key]));
  assert.match(basin.source, /^https:\/\//);
  const record = geo.basins[basin.feature];
  assert.ok(record.basinIds.length && record.polygons.length);
  for (const polygon of record.polygons) for (const ring of polygon) assert.ok(ring.length >= 4 && ring.every(point));
}
for (const branch of D.tributaries) {
  assert.ok(riverIds.has(branch.river) && branch.river !== 'f43');
  ['name', 'text', 'relation'].forEach(key => prose(branch[key]));
  const record = geo.tributaries[branch.id];
  assert.ok(record && record.neIds.length);
  assert.ok(record.paths.length && record.paths.every(path => path.length >= 2 && path.every(point)));
}
assert.equal(D.estuaries.length, 3);
for (const estuary of D.estuaries) {
  assert.ok(['f20','f21','f41'].includes(estuary.river) && point(estuary.point));
  ['name','text','observe'].forEach(key => prose(estuary[key]));
  assert.match(estuary.source, /^https:\/\//);
  assert.ok(estuary.zoom >= 4 && estuary.zoom <= 12);
}
['intro','basinNote','canalNote','lakeNote','tributaryNote'].forEach(key => prose(D[key]));
for (const source of geo.sources) { assert.match(source.url, /^https:\/\//); assert.match(source.sha256, /^[a-f0-9]{64}$/); }
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const terrain = fs.readFileSync(path.join(__dirname,'../geo-map/china-terrain-data.js'));
assert.equal(crypto.createHash('sha256').update(terrain).digest('hex'), geo.terrainSha256);
for (const lake of Object.values(geo.lakes)) {
  assert.ok(lake.patches.length && Object.keys(lake.bedMasks).length);
  for (const patch of lake.patches) {
    assert.match(patch.province,/^p\d{6}$/); assert.ok(patch.triangles.length && patch.triangles.every(t => t.length === 3 && t.every(point)));
    for (const [a,b,c] of patch.triangles) assert.ok((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]) > 0, '湖面三角形必须向上');
  }
}
assert.ok(!geo.basins.f43, '人工运河不应虚构独立天然流域');
console.log('水文图层数据、几何、统计口径与稳定引用校验通过');
