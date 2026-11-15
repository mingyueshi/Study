const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '../static/study_topics/geo-map');
const context = vm.createContext({console, AbortController, URLSearchParams});
context.window = context;
for (const file of ['assets/vendor/three-map.js', 'world-geo.js', 'world-3d-geometry.js', 'world-3d-learning-data.js', 'world-3d-learning.js', 'world-3d-tools-data.js', 'world-3d-tools.js', 'world-3d-sun-data.js', 'world-3d-sun.js', 'world-3d-detective-data.js', 'world-3d-detective.js']) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context);
const G = context.GMWorld3DGeometry;
const S = context.GMWorldSun;
test('地理侦探区分猜错、海洋和找到，重复提交不会重复累计', () => {
  const missions = context.GM_WORLD_DETECTIVE.missions, round = context.GMWorldDetective.createRound(missions);
  assert.equal(round.guess(undefined), 'ocean'); assert.equal(round.guess('Brazil'), 'wrong'); assert.equal(round.state().found.size, 0);
  assert.equal(round.guess('China'), 'correct'); assert.equal(round.state().found.size, 1);
  assert.equal(round.guess('China'), 'locked'); assert.equal(round.state().found.size, 1);
  round.select(missions[0].id); assert.equal(round.guess('Taiwan'), 'correct'); assert.equal(round.state().found.size, 1);
});
test('提示逐步给出，查看答案不算完成，重新挑战后才能自己提交', () => {
  const missions = context.GM_WORLD_DETECTIVE.missions, round = context.GMWorldDetective.createRound(missions);
  round.hint(); assert.equal(round.state().hints, 1); round.hint(); round.hint(); assert.equal(round.state().hints, 2);
  round.reveal(); assert.equal(round.state().status, 'revealed'); assert.equal(round.guess('China'), 'locked'); assert.equal(round.state().found.size, 0);
  round.select(missions[0].id); assert.equal(round.state().hints, 0); assert.equal(round.guess('China'), 'correct');
});
test('继续未完成过滤旧 ID，重练保留历史完成记录，非法任务不改变当前轮次', () => {
  const missions = context.GM_WORLD_DETECTIVE.missions;
  const round = context.GMWorldDetective.createRound(missions, new Set([missions[0].id, 'retired']));
  round.resume(); assert.equal(round.state().index, 1); assert.equal(round.state().found.size, 1);
  assert.equal(round.select('missing'), false); assert.equal(round.state().index, 1);
  for (const m of missions) { round.select(m.id); assert.equal(round.guess(m.answer), 'correct'); }
  round.resume(); assert.equal(round.state().index, 0); assert.equal(round.state().status, 'asking'); assert.equal(round.state().found.size, missions.length);
  const copy = round.state().found; copy.clear(); assert.equal(round.state().found.size, missions.length);
});
test('四时昼长：赤道近半日，南北半球互补，极昼极夜及分至极点不产生无效数', () => {
  for (const declination of [0, 23.5, -23.5]) {
    assert.equal(S.daylight(0, declination), 12);
    for (const latitude of [15, 45, 60, 80]) assert.ok(Math.abs(S.daylight(latitude, declination) + S.daylight(-latitude, declination) - 24) < 1e-8);
  }
  assert.ok(S.daylight(45, 23.5) > 15 && S.daylight(45, 23.5) < 16);
  assert.equal(S.daylight(80, 23.5), 24); assert.equal(S.daylight(80, -23.5), 0);
  assert.equal(S.daylight(-90, -23.5), 24); assert.equal(S.daylight(90, -23.5), 0);
  assert.equal(S.daylight(90, 0), null); assert.equal(S.daylight(-90, 0), null);
});
test('光照方向与 UTC、经度对应，晨昏圈垂直太阳方向且都在单位球上', () => {
  for (const name of ['Line2', 'LineGeometry', 'LineMaterial']) assert.equal(typeof context.GMThree[name], 'function');
  assert.equal(S.model([0, 0], 12, 0).phase, 'day');
  assert.equal(S.model([180, 0], 12, 0).phase, 'night');
  assert.equal(S.model([90, 0], 12, 0).phase, 'boundary');
  assert.equal(S.model([120, 0], 4, 0).phase, 'day');
  assert.equal(JSON.stringify(S.model([0, 45], 36, 23.5)), JSON.stringify(S.model([0, 45], 12, 23.5)));
  for (const p of [[0, 0], [180, 23.5], [-120, -23.5]]) for (const v of S.terminator(p)) {
    assert.ok(Math.abs(Math.hypot(...v) - 1) < 1e-8);
    assert.ok(Math.abs(v.reduce((sum, x, i) => sum + x * G.xyz(p)[i], 0)) < 1e-8);
  }
});
function clockHarness() {
  let id = 0, available = true; const frames = new Map();
  const clock = S.createClock({request: fn => { frames.set(++id, fn); return id; }, cancel: id => frames.delete(id), available: () => available, render() {}, changed() {}});
  const tick = stamp => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(stamp)); };
  return {clock, frames, tick, available: value => { available = value; }};
}
test('一天播放暂停后保留时刻，继续不跳时，完成后停止且可再看一天', () => {
  const h = clockHarness(), c = h.clock; c.play(); h.tick(0); h.tick(5000);
  assert.equal(c.state().hour, 13); c.pause();
  assert.equal(h.frames.size, 0); c.play(); h.tick(100000); h.tick(103000);
  assert.equal(c.state().hour, 16); h.tick(119000);
  assert.equal(c.state().hour, 8); assert.equal(c.state().elapsed, 24); assert.equal(c.state().playing, false);
  assert.equal(h.frames.size, 0); c.play(); h.tick(120000); h.tick(121000); assert.equal(c.state().hour, 9);
});
test('离屏和减少动态停播，恢复不自动播放，过期帧不能恢复旧循环', () => {
  const h = clockHarness(), c = h.clock; c.play(); const stale = [...h.frames.values()][0]; c.pause(); c.play();
  stale(1000); assert.equal(h.frames.size, 1); h.tick(2000); h.tick(3000); assert.equal(c.state().hour, 9);
  h.available(false); c.refresh(); assert.equal(c.state().playing, false); assert.equal(h.frames.size, 0);
  h.available(true); c.refresh(); assert.equal(c.state().playing, false);
  c.setHour(23); c.setHour(c.state().hour + 3); assert.equal(c.state().hour, 2); assert.equal(c.state().elapsed, 0);
});
test('球面测距采用短弧，同点、跨 180° 经线和对跖点都稳定', () => {
  const radius = context.GM_WORLD_TOOLS.radiusKm;
  assert.equal(G.angle([120, 30], [120, 30]), 0);
  assert.ok(Math.abs(G.angle([0, 0], [90, 0]) * radius - 10007.54) < .01);
  assert.ok(Math.abs(G.angle([170, 0], [-170, 0]) * radius - 2223.90) < .01);
  assert.ok(Math.abs(G.angle([0, 90], [0, -90]) - Math.PI) < 1e-12);
  for (const [a, b] of [[[0, 0], [0, 0]], [[170, 30], [-170, 30]], [[0, 90], [0, -90]], [[0, 0], [180, 0]], [[30, 20], [-149.99999, -20]]]) {
    const arc = G.arc(a, b);
    assert.ok(arc[0].every((v, i) => Math.abs(v - G.xyz(a)[i]) < 1e-9));
    assert.ok(arc.at(-1).every((v, i) => Math.abs(v - G.xyz(b)[i]) < 1e-9));
    arc.forEach(p => assert.ok(Math.abs(Math.hypot(...p) - 1) < 1e-8));
    let length = 0;
    for (let i = 1; i < arc.length; i++) length += Math.acos(Math.max(-1, Math.min(1, arc[i].reduce((sum, x, k) => sum + x * arc[i - 1][k], 0))));
    assert.ok(Math.abs(length - G.angle(a, b)) < 1e-6);
  }
});
test('坐标输入拒绝空白、非数值和越界，允许零与边界', () => {
  for (const p of [['', '0'], [' ', '20'], ['a', 20], [Infinity, 0], [null, 0], [false, 0], [181, 0], [0, -91]]) assert.equal(G.parsePoint(...p), null);
  for (const p of [[0, 0], [-180, -90], [180, 90], [-60.5, 30.25]]) assert.equal(JSON.stringify(G.parsePoint(...p.map(String))), JSON.stringify(p));
});
test('寻宝按球面夹角判定，东西经接缝和两极不误判', () => {
  const judge = context.GMWorldTools.judge;
  assert.equal(judge([0, 0], [0, 0], 8).found, true);
  assert.equal(judge([8, 0], [0, 0], 8).found, true);
  assert.equal(judge([8.01, 0], [0, 0], 8).found, false);
  assert.equal(judge([-179, 0], [179, 0], 8).found, true);
  assert.equal(judge([160, 89], [-20, 89], 8).found, true);
  for (const m of context.GM_WORLD_TOOLS.missions) assert.equal(judge(m.point, m.point, 8).found, true);
});
test('测距标记所需的本地渲染接口存在', () => {
  for (const name of ['Group', 'LineSegments', 'LineBasicMaterial']) assert.equal(typeof context.GMThree[name], 'function');
});
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
