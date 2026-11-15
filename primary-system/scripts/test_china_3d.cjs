/* 交付的真实高程与 Three.js 网格回归，不依赖 WebGL 或网络。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const base = path.join(__dirname, '../static/study_topics/geo-map');
const context = vm.createContext({ console, AbortController, atob });
context.window = context;
for (const file of ['assets/vendor/three-map.js', 'china-geo.js', 'map-data.js', 'china-3d-data.js', 'china-terrain-data.js', 'china-rivers-data.js', 'china-3d-geometry.js']) {
  vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context);
}
const G = context.GMChina3DGeometry;
const data = context.GM_CHINA_TERRAIN;
const meshes = new Map(Object.entries(data.provinces).map(([code, record]) => [code, G.decode(record)]));

test('34 个省级行政区的真实地形完整，顶点、法线和三角索引有效', () => {
  assert.equal(meshes.size, 34);
  let count = 0;
  for (const [code, record] of Object.entries(data.provinces)) {
    const mesh = G.buildTerrain(record);
    assert.ok(mesh.positions.length > 0 && mesh.positions.every(Number.isFinite), code);
    assert.ok(mesh.elevations.every(z => z >= -500 && z <= 9000), code);
    assert.ok(mesh.top.getAttribute('normal').array.every(Number.isFinite), code);
    assert.ok(mesh.indices.every(index => index < record.vertexCount), code);
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const [a, b, c] = Array.from(mesh.indices.slice(i, i + 3), id => id * 3), p = mesh.positions;
      const area = (p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a]);
      assert.ok(area > 0, `${code} 三角形应朝上且非退化`);
    }
    count += record.triangleCount;
    for (const key of ['top', 'side', 'outline']) mesh[key].dispose();
  }
  assert.ok(count > 300000, '全国网格应包含足够地形细节');
});

test('高原、平原、盆地和负海拔洼地保持真实高低，采样方向正确', () => {
  const sample = (code, point) => G.heightAt(meshes.get(code), point);
  const plateau = sample('540000', [86, 33.5]);
  const plain = sample('370000', [116, 36]);
  const basin = sample('650000', [83, 39.5]);
  const depression = sample('650000', [89.2, 42.7]);
  assert.ok(plateau > 4000 && plateau < 5500);
  assert.ok(plain >= 0 && plain < 200);
  assert.ok(basin > 700 && basin < 1500);
  assert.ok(depression < -80 && depression > -200);
  assert.equal(sample('820000', [86, 33.5]), null, '澳门网格不得覆盖远处的高原');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(base, 'china-geo.js'))).digest('hex'), data.source.boundarySHA256);
});

test('放大倍率只改变显示高度，海拔反算与颜色保持独立', () => {
  for (const meters of [-151, 0, 40, 1061, 4885, 7000]) {
    for (const gain of [1, 50, 80]) assert.ok(Math.abs(G.elevationFromZ(G.heightToZ(meters, gain), gain) - meters) < 1e-8);
    assert.ok(G.terrainColor(meters).toArray().every(value => value >= 0 && value <= 1));
  }
  assert.ok(G.heightToZ(4885, 50) > G.heightToZ(40, 50));
});

test('每处地形定位落在关联省份的真实网格上，能够读到海拔', () => {
  for (const mark of context.GM_CHINA_3D.terrain.landmarks) {
    assert.notEqual(G.heightAt(meshes.get(mark.province.slice(1)), mark.point), null, mark.feature);
  }
});

test('相邻省份共享顶点的海拔一致，切换省份不能形成高度断层', () => {
  const points = new Map();
  let shared = 0;
  for (const [code, mesh] of meshes) {
    for (let i = 0; i < mesh.elevations.length; i++) {
      const key = `${mesh.positions[i * 3].toFixed(3)},${mesh.positions[i * 3 + 1].toFixed(3)}`;
      if (points.has(key)) {
        assert.equal(points.get(key), mesh.elevations[i], code + ' 交界高程应一致');
        shared++;
      } else points.set(key, mesh.elevations[i]);
    }
  }
  assert.ok(shared > 9000, '应校验足够多的共享边界顶点');
});

test('水系按全国地形采样，标签在原河线上，跨省仍能读取一致的高程', () => {
  const sample = G.createSurfaceSampler([...meshes.values()]);
  for (const mark of context.GM_CHINA_3D.terrain.landmarks) {
    const expected = G.heightAt(meshes.get(mark.province.slice(1)), mark.point);
    assert.ok(Math.abs(sample(mark.point) - expected) < .01, mark.feature);
  }
  for (const river of context.GM_CHINA_3D.rivers) {
    const feature = context.GM_FEATURES.find(f => f.id === river.feature);
    const record = context.GM_CHINA_RIVERS.rivers[river.feature];
    const draped = G.drapeRiver(record.paths, sample);
    assert.ok(draped.samples.length > 200, feature.name + ' 应密集采样以贴合地形');
    assert.equal(draped.paths.length, record.paths.length, '源数据的河段分隔必须保留');
    for (const path of draped.paths) {
      assert.ok(path.length >= 2);
      for (let i = 0; i < path.length; i++) {
        const { point, meters } = path[i];
        const actual = sample(point);
        assert.ok(Number.isFinite(meters));
        if (actual !== null) assert.ok(Math.abs(meters - actual) < .001);
        if (i && path[i].onTerrain && path[i - 1].onTerrain) {
          const previous = path[i - 1];
          const middle = sample([(point[0] + previous.point[0]) / 2, (point[1] + previous.point[1]) / 2]);
          const span = Math.hypot(point[0] - previous.point[0], point[1] - previous.point[1]);
          if (middle !== null && span > 1e-6) assert.ok(Math.abs((meters + previous.meters) / 2 - middle) < 5, `${feature.name} 河段中点也应贴合地形`);
        }
      }
    }
  }
  assert.equal(sample([140, 30]), null, '范围外不得编造高程');
});

test('真实河道经过峡谷与河口控制点，并与河谷加密输入绑定', () => {
  const rivers = context.GM_CHINA_RIVERS;
  for (const [id, point] of [['f20', [109.54, 31.03]], ['f20', [100.1, 27.2]], ['f21', [110.45, 36.15]]]) {
    const distance = Math.min(...rivers.rivers[id].paths.flat().map(p => Math.hypot(p[0] - point[0], p[1] - point[1])));
    assert.ok(distance < .06, `${id} 应经过真实峡谷附近，距离 ${distance}`);
  }
  assert.ok(rivers.rivers.f20.paths.flat().some(p => p[0] > 122), '长江应保留真实入海口河段');
  assert.equal(rivers.centerlinesSHA256, data.source.centerlinesSHA256);
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../content_sources/geo-map/river-centerlines.json'))).digest('hex'), rivers.centerlinesSHA256);
  assert.equal(data.riverSpacing, .01);
  assert.equal(data.source.riverZoom, 9);
});

test('水系遇到数据空白时分段，不产生跨海或跨缺失地形的连线', () => {
  const draped = G.drapeLine([[0, 0], [1, 0]], ([x]) => x > .3 && x < .7 ? null : x * 100, .1);
  assert.equal(draped.paths.length, 2);
  assert.ok(draped.paths[0].every(p => p.point[0] <= .3));
  assert.ok(draped.paths[1].every(p => p.point[0] >= .7));
  assert.equal(G.drapeLine([[0, 0], [1, 0]], () => null).paths.length, 0);
});
