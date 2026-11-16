const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.join(__dirname, '../static/study_topics/geo-map');
const ctx = vm.createContext({ console, AbortController, atob, performance }); ctx.window = ctx;
for (const file of ['assets/vendor/three-map', 'map-data', 'china-3d-data', 'china-adventures-data', 'china-terrain-data', 'china-rivers-data', 'china-3d-geometry', 'china-terrain-section', 'china-adventures', 'china-terrain-play']) vm.runInContext(fs.readFileSync(path.join(base, file + '.js'), 'utf8'), ctx);
const D = ctx.GM_CHINA_ADVENTURES, A = ctx.GMChinaAdventures, G = ctx.GMChina3DGeometry;
const Tour = require('../static/study_topics/geo-map/china-river-tour.js');

test('猜省区、误选、提示、查看答案和重新挑战共用判题状态，查看不增加进度', () => {
  const r = A.createRound(D.missions, new Set(['hebei', 'old-id']));
  assert.deepEqual([...r.state().found], ['hebei']);
  r.select('xinjiang'); assert.equal(r.guess('p130000').result, 'wrong');
  r.hint(); r.hint(); r.hint(); assert.equal(r.state().hints, 2);
  r.reveal(); assert.equal(r.guess('p650000').result, 'locked'); assert.equal(r.state().found.size, 1);
  r.select('xinjiang'); assert.equal(r.guess('p650000').result, 'correct'); assert.equal(r.state().found.size, 2);
  r.select('xinjiang'); assert.equal(r.guess('p650000').result, 'correct'); assert.equal(r.state().found.size, 2);
  assert.equal(A.readProgress('{bad}', D.missions).size, 0);
});

test('坐标寻宝按千米误差判定，不接受缺失、无穷或越界坐标', () => {
  const r = A.createRound(D.missions); r.select('yangtze-source');
  for (const p of [null, [NaN, 33], [Infinity, 33], [200, 33]]) assert.equal(r.guess('', p).result, 'empty');
  assert.equal(r.guess('', [110, 33]).result, 'wrong');
  assert.equal(r.guess('', [91.175, 33.454167]).result, 'correct');
  assert.equal(r.state().found.size, 1);
});
const meshes = Object.entries(ctx.GM_CHINA_TERRAIN.provinces).map(([code, record]) => ({ ...G.decode(record), province: 'p' + code }));
const sample = G.createSurfaceSampler(meshes);
test('山脊飞行和运河行船站点顺序有效、行程有起终点且保留资料分段', () => {
  for (const config of D.routes) {
    const paths = config.path ? G.drapeLine(config.path, sample).paths : ctx.GM_CHINA_RIVERS.rivers[config.river].paths.map(p => p.map(point => ({point: point.slice(0, 2), meters: point[2]})));
    const route = Tour.buildRoute(paths, config.stops, paths.map(() => 1));
    assert.equal(route.stops[0].distance, 0); assert.equal(route.stops.at(-1).distance, route.length);
    assert.ok(route.stops.every((s, i) => !i || s.distance > route.stops[i - 1].distance));
    assert.ok(route.length > 1000);
    if (config.kind === 'canal') assert.equal(route.tracks.length, ctx.GM_CHINA_RIVERS.rivers.f43.paths.length);
  }
});

test('湖泊来自六个原档案、表面顶点只使用实际 DEM 采样，省份归属与海拔独立', () => {
  for (const lake of D.lakes) {
    const triangles = ctx.GMChinaTerrainPlay.lakeTriangles(lake.rings, sample);
    assert.ok(triangles.length > 5, lake.feature);
    for (const p of triangles.flat()) {
      assert.ok(ctx.GMChinaTerrainPlay.inside(p.point, lake.rings));
      assert.equal(p.meters, sample(p.point));
    }
  }
  const hit = sample.locate([86, 33.5]);
  assert.equal(hit.mesh.province, 'p540000'); assert.equal(hit.meters, sample([86, 33.5]));
});

test('省份抬起、高度缓升与雪线不改原始海拔，减少动效即时稳定', () => {
  const T = ctx.GMThree, geo = G.buildTerrain(ctx.GM_CHINA_TERRAIN.provinces['630000']);
  const original = Array.from(geo.elevations), buttons = new Map();
  const button = id => { if (!buttons.has(id)) buttons.set(id, { textContent: '', innerHTML: '', attrs: {}, handlers: {}, addEventListener(n, f) { this.handlers[n] = f; }, setAttribute(k,v) { this.attrs[k]=v; }, getAttribute(k) { return this.attrs[k]; } }); return buttons.get(id); };
  const root = { dataset: {}, querySelector: button }; ctx.GMShared = { esc: s => s };
  const group = new T.Group(); group.position.z = G.datum;
  const models = new Map([['p630000', { group, geometry: geo }]]);
  const play = ctx.GMChinaTerrainPlay.create({ root, models, rivers: new Map(), scene: new T.Scene(), sample, locate: sample.locate, requestDraw() {}, fullMotion: () => false, canAnimate: () => true, gain: () => 50 });
  play.select('p630000'); play.tick(performance.now());
  assert.equal(group.position.z, G.datum + .9); assert.equal(group.scale.z, 50);
  play.flatten(true); play.tick(performance.now()); assert.equal(group.position.z, G.datum);
  button('#gm3-snow').handlers.click({ currentTarget: button('#gm3-snow') });
  assert.deepEqual(Array.from(geo.elevations), original);
  play.settle(); assert.equal(root.dataset.rise, '1.000');
});

test('配音停止使旧朗读回调失效，不支持语音仍保留文字入口', () => {
  const buttons = new Map();
  const el = id => { if (!buttons.has(id)) buttons.set(id, { textContent: '', handlers: {}, addEventListener(k, f) { this.handlers[k] = f; }, setAttribute() {} }); return buttons.get(id); };
  const root = { querySelector: el }; let last;
  ctx.document = { addEventListener() {} }; ctx.addEventListener = () => {};
  ctx.speechSynthesis = { cancel() {} }; ctx.SpeechKit = { speak(text, opts) { last = opts; } };
  const n = ctx.GMChinaNarrator.create(root, () => '当前站');
  // Auto is off; entering a station cannot speak without the user choosing it.
  n.station('不得自动朗读'); assert.equal(last, undefined);
  el('#gm3-voice-tour').handlers.click(); assert.equal(n.reading, true);
  const old = last; n.stop(); old.onend(); assert.equal(el('#gm3-voice-status').textContent, '可朗读剖面或当前站点。');
  el('#gm3-voice-tour').handlers.click(); const previous = last;
  el('#gm3-voice-tour').handlers.click(); previous.onerror(); assert.equal(n.reading, true); last.onend(); assert.equal(n.reading, false);
  delete ctx.speechSynthesis; delete ctx.SpeechKit;
  ctx.GMChinaNarrator.create(root, () => '当前站'); assert.equal(el('#gm3-voice-tour').disabled, true);
});
