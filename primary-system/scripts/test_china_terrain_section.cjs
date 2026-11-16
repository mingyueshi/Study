const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '../static/study_topics/geo-map');
const context = vm.createContext({ console, AbortController, atob });
context.window = context;
for (const file of ['assets/vendor/three-map.js', 'china-3d-data.js', 'china-terrain-data.js', 'china-3d-geometry.js', 'china-terrain-section.js']) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context);
const P = context.GMTerrainSection, G = context.GMChina3DGeometry;
test('距离按纬度计算，反向采样保留 A→B 的方向和负海拔', () => {
  assert.ok(Math.abs(P.distance([0, 0], [1, 0]) - 111.2) < .1);
  assert.ok(P.distance([0, 60], [1, 60]) < 56);
  const result = P.sampleLine([100, 30], [99, 30], ([lng]) => (lng - 99) * 1000 - 150);
  assert.equal(result.points[0].meters, 850);
  assert.equal(result.points.at(-1).meters, -150);
  assert.ok(result.points.every((p, i, all) => !i || p.km > all[i - 1].km));
  assert.equal(result.min, -150);
  assert.ok(!/NaN|Infinity/.test(P.chartSVG(result)));
});
test('越出陆地范围不补零，不跨缺口连线，空白和极短剖面仍能渲染', () => {
  const result = P.sampleLine([100, 30], [104, 30], ([lng]) => lng > 101 && lng < 103 ? null : 1000);
  assert.ok(result.missing > 0);
  assert.equal(result.min, 1000);
  assert.equal((P.chartSVG(result).match(/class="gm3-section-curve"/g) || []).length, 2);
  const empty = P.sampleLine([0, 0], [0, 0], () => null);
  assert.equal(empty.min, null);
  assert.ok(!/NaN|Infinity/.test(P.chartSVG(empty)));
  assert.match(P.chartSVG(empty), /没有地形数据/);
});
test('西向东示范直接读取交付地形，高原到东部低地保持实际高低', () => {
  const meshes = Object.values(context.GM_CHINA_TERRAIN.provinces).map(record => G.decode(record));
  const sample = G.createSurfaceSampler(meshes);
  const config = context.GM_CHINA_3D.section;
  const result = P.sampleLine(config.from, config.to, sample);
  assert.ok(result.points[0].meters > 4000);
  assert.ok(result.points.at(-1).meters >= -10 && result.points.at(-1).meters < 100);
  assert.ok(result.km > 2800 && result.km < 3000);
  assert.ok(result.missing < result.points.length * .01);
  for (const p of result.points.filter(p => p.meters !== null)) {
    assert.equal(p.meters, sample(p.point));
    for (const gain of [1, 50, 80]) assert.ok(Math.abs(G.elevationFromZ(G.heightToZ(p.meters, gain), gain) - p.meters) < 1e-8);
  }
});
