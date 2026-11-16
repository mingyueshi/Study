const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Tour = require('../static/study_topics/geo-map/china-river-tour.js');
const point = (x, y, meters = 100) => ({ point: [x, y], meters });
const stops = anchors => anchors.map((anchor, i) => ({ id: `s${i}`, anchor }));

test('镜头沿弯曲河段前进并保留海拔，湖区缺口切换河段而不补直线', () => {
  const route = Tour.buildRoute([[point(100, 30, 500), point(101, 30, 300), point(101, 31, 100)], [point(103, 31, 80), point(104, 31, 0)]], stops([[100, 30], [101, 31], [104, 31]]), [1, 1]);
  const first = route.tracks[0];
  assert.deepEqual(Tour.position(route, first.track.distances[1] / 2).point, [100.5, 30]);
  assert.equal(Tour.position(route, first.track.distances[1] / 2).meters, 400);
  assert.deepEqual(Tour.position(route, first.track.length).point, [103, 31]);
  assert.deepEqual(Tour.position(route, route.length).point, [104, 31]);
  assert.throws(() => Tour.buildRoute([[point(0, 0), point(1, 0), point(2, 0), point(3, 0)]], stops([[0, 0], [2, 0], [1, 0], [3, 0]]), [1]), /顺序/);
});

test('真实长江与黄河各 12 站按下游排序，起点和终点覆盖交付河道', () => {
  const context = { window: {} }, base = path.join(__dirname, '../static/study_topics/geo-map');
  for (const file of ['china-3d-data.js', 'china-rivers-data.js', 'china-river-tour-data.js']) vm.runInNewContext(fs.readFileSync(path.join(base, file), 'utf8'), context);
  const data = context.window.GM_CHINA_RIVER_TOURS;
  for (const config of data.routes) {
    const paths = context.window.GM_CHINA_RIVERS.rivers[config.river].paths.map(part => part.map(p => point(p[0], p[1], p[2])));
    const direction = context.window.GM_CHINA_3D.rivers.find(r => r.feature === config.river).flow.directions;
    const route = Tour.buildRoute(paths, config.stops, direction);
    assert.equal(route.stops.length, 12);
    assert.ok(route.length > 4000);
    assert.equal(route.stops[0].distance, 0);
    assert.equal(route.stops.at(-1).distance, route.length);
    assert.deepEqual(Tour.position(route, 0).point, paths[0][0].point);
    assert.deepEqual(Tour.position(route, route.length).point, paths.at(-1).at(-1).point);
    for (const stop of route.stops) assert.ok(Number.isFinite(Tour.position(route, stop.distance).meters));
  }
});

function setup() {
  const route = Tour.buildRoute([[point(100, 30), point(101, 30), point(102, 30)]], stops([[100, 30], [101, 30], [102, 30]]), [1]);
  const frames = new Map(), changes = [], moves = [];
  let id = 0, enabled = true, time = 0;
  const tour = Tour.createTour({ route, holdSeconds: 1, travelSeconds: 2,
    request: fn => { frames.set(++id, fn); return id; }, cancel: frame => frames.delete(frame), canPlay: () => enabled,
    moved: (point, state) => moves.push({ point, ...state }), changed: state => changes.push(state),
  });
  function tick() { const [id, fn] = frames.entries().next().value; frames.delete(id); fn(time); time += 100; }
  function advance(count) { for (let i = 0; i < count && frames.size; i++) tick(); }
  return { route, tour, frames, changes, moves, tick, advance, setEnabled: value => { enabled = value; } };
}

test('连续漫游按顺序停站，在海口完成并停止，可从源头重播', () => {
  const { tour, frames, changes, advance, moves } = setup();
  tour.jump(0); tour.play(); tour.play(); assert.equal(frames.size, 1);
  advance(100);
  assert.equal(tour.snapshot().phase, 'complete');
  assert.equal(tour.snapshot().playing, false);
  assert.equal(tour.snapshot().progress, 1);
  assert.equal(frames.size, 0);
  assert.ok(changes.some(s => s.index === 1 && s.phase === 'stop'));
  assert.ok(moves.some(s => s.distance > 0 && s.progress < .5), '站点之间确实沿河移动');
  tour.play(); assert.equal(tour.snapshot().index, 0); assert.equal(tour.snapshot().progress, 0);
});

test('暂停保留途中位置，改速度不跳站，手动上一站或下一站会取消旧帧', () => {
  const { tour, route, frames, advance, tick } = setup();
  tour.play(); advance(16);
  const before = tour.snapshot().distance;
  assert.ok(before > 0 && before < route.length / 2);
  const stale = [...frames.values()][0]; tour.pause(); stale(10000);
  assert.equal(frames.size, 0); assert.equal(tour.snapshot().distance, before);
  tour.setSpeed(2); tour.play(); tick(); assert.equal(tour.snapshot().distance, before);
  tick(); assert.ok(Math.abs(tour.snapshot().distance - before - route.length * .1) < 1e-8);
  const old = [...frames.values()][0]; tour.jump(1); old(11000);
  assert.equal(frames.size, 0); assert.equal(tour.snapshot().distance, route.stops[1].distance);
  tour.jump(0); assert.equal(tour.snapshot().progress, 0);
});

test('减少动效、后台或离屏不能播放，但可逐站阅读，恢复后不自动重播', () => {
  const { tour, frames, setEnabled, tick } = setup();
  setEnabled(false); tour.play(); assert.equal(frames.size, 0);
  tour.jump(1); assert.equal(tour.snapshot().index, 1);
  setEnabled(true); tour.refresh(); assert.equal(frames.size, 0);
  tour.play(); setEnabled(false); tick(); assert.equal(tour.snapshot().playing, false); assert.equal(frames.size, 0);
  setEnabled(true); tour.play(); const stale = [...frames.values()][0]; tour.dispose(); stale(5000); tour.play();
  assert.equal(frames.size, 0);
});


test('到站配音时等待，朗读结束后继续停站计时，途中暂停仍可用', () => {
  const route = Tour.buildRoute([[point(100, 30), point(101, 30)]], stops([[100, 30], [101, 30]]), [1]);
  const frames = new Map(); let id = 0, reading = true, time = 0;
  const tour = Tour.createTour({ route, holdSeconds: 1, travelSeconds: 2,
    request: fn => { frames.set(++id, fn); return id; }, cancel: key => frames.delete(key), canPlay: () => true,
    moved() {}, changed() {}, holdWhile: () => reading,
  });
  function advance(n) { for (let i = 0; i < n && frames.size; i++) { const [key, fn] = frames.entries().next().value; frames.delete(key); fn(time); time += 100; } }
  tour.play(); advance(30); assert.equal(tour.snapshot().distance, 0); assert.equal(tour.snapshot().remaining, 1);
  reading = false; advance(20); assert.ok(tour.snapshot().distance > 0);
  tour.pause(); assert.equal(frames.size, 0); tour.dispose();
});
