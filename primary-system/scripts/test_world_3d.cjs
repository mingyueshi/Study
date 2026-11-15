const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '../static/study_topics/geo-map');
const context = vm.createContext({console, AbortController, URLSearchParams});
context.window = context;
for (const file of ['assets/vendor/three-map.js', 'world-geo.js', 'world-3d-geometry.js', 'world-3d-learning-data.js', 'world-3d-learning.js']) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context);
const G = context.GMWorld3DGeometry;
test('经纬度读数不丢失南纬西经，舍入到零不显示负零', () => {
  assert.equal(G.coordinates([-60, -20]), '南纬 20.0°，西经 60.0°');
  assert.equal(G.coordinates([116.4, 39.9]), '北纬 39.9°，东经 116.4°');
  assert.equal(G.coordinates([-.01, -.01]), '赤道 0°，经度 0°');
});
test('五带完整覆盖两极及边界，每个纬度只落入一带', () => {
  const zones = context.GM_WORLD_LEARNING.zones;
  for (const [lat, expected] of [[-90, 'south-polar'], [-80, 'south-polar'], [-45, 'south-temperate'], [0, 'tropical'], [40, 'north-temperate'], [80, 'north-polar'], [90, 'north-polar']]) assert.equal(G.zoneAt(lat, zones).id, expected);
  for (let lat = -90; lat <= 90; lat += .5) assert.ok(G.zoneAt(lat, zones), lat);
  assert.equal(G.zoneAt(91, zones), undefined);
});
test('答对记录排除旧题、重复项与损坏存储，不把未答题算作掌握', () => {
  const questions = context.GM_WORLD_LEARNING.questions, learning = context.GMWorldLearning;
  const progress = learning.readProgress(JSON.stringify([questions[0].id, questions[0].id, 'retired', null, 4]), questions);
  assert.equal(progress.size, 1); assert.ok(progress.has(questions[0].id));
  for (const raw of ['bad-json', '{}', 'null', '12']) assert.equal(learning.readProgress(raw, questions).size, 0);
});
test('导览深链接按稳定站点 ID 恢复，无效站点回到首站', () => {
  const tours = context.GM_WORLD_LEARNING.tours, learning = context.GMWorldLearning;
  for (const tour of tours) for (const [index, stop] of tour.stops.entries()) {
    const state = learning.resolveTour(new URLSearchParams({tour: tour.id, stop: stop.id}), tours);
    assert.equal(state.tour.id, tour.id); assert.equal(state.index, index);
  }
  assert.equal(learning.resolveTour(new URLSearchParams('tour=latitude-trip&stop=unknown'), tours).index, 0);
  assert.equal(learning.resolveTour(new URLSearchParams('tour=unknown'), tours), null);
});
test('球面经纬度往返一致，中国、太平洋和两极没有镜像或错位', () => {
  for (const p of [[110, 22], [-155, 5], [0, 0], [179.9, 50], [-179.9, -50], [0, 89.9], [0, -89.9]]) {
    const [x, y, z] = G.xyz(p), actual = G.lonLat({x, y, z});
    assert.ok(Math.abs(actual[0] - p[0]) < 1e-8);
    assert.ok(Math.abs(actual[1] - p[1]) < 1e-8);
    assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-8);
  }
});
test('跨日期变更线的小岛按连续经度绘制，国家定位保持有效', () => {
  const ring = G.unwrap([[179, 10], [-179, 10], [-178, 12], [179, 12]]);
  assert.equal(ring[1][0], 181);
  for (const country of context.GEO_WORLD_GEO.countries) {
    const [lon, lat] = G.center(country);
    assert.ok(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90, country.name);
  }
});
test('球面三角形向外、法线长度正确，纹理经纬方向保持一致', () => {
  const geometry = G.sphere(context.GMThree);
  const p = geometry.getAttribute('position'), uv = geometry.getAttribute('uv'), ids = geometry.index.array;
  for (let i = 0; i < p.count; i++) {
    assert.ok(Math.abs(Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) - 1) < 1e-6);
    const expected = G.xyz([uv.getX(i) * 360 - 180, uv.getY(i) * 180 - 90]);
    assert.ok(expected.every((v, j) => Math.abs(v - p.array[i * 3 + j]) < 1e-6));
  }
  for (let i = 0; i < ids.length; i += 3) {
    const a = new context.GMThree.Vector3().fromBufferAttribute(p, ids[i]);
    const b = new context.GMThree.Vector3().fromBufferAttribute(p, ids[i + 1]);
    const c = new context.GMThree.Vector3().fromBufferAttribute(p, ids[i + 2]);
    assert.ok(b.sub(a).cross(c.sub(a)).dot(a) > 0);
  }
  geometry.dispose();
});
