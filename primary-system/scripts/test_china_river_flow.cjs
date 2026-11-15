const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createTrack, atDistance, createPlayback } = require('../static/study_topics/geo-map/china-river-flow.js');
const point = (x, y, meters) => ({ point: [x, y], meters });

test('流向沿弯曲河段按距离推进，保留贴地高程且不因向西折返而倒流', () => {
  const samples = [point(100, 30, 900), point(101, 30, 600), point(100.5, 31, 100)];
  const track = createTrack(samples);
  assert.deepEqual(atDistance(track, 0), samples[0]);
  assert.deepEqual(atDistance(track, track.length), samples[2]);
  const firstMid = atDistance(track, track.distances[1] / 2);
  assert.deepEqual(firstMid, point(100.5, 30, 750));
  const lastMid = atDistance(track, (track.distances[1] + track.length) / 2);
  assert.deepEqual(lastMid, point(100.75, 30.5, 350));
  const reverse = createTrack(samples, -1);
  assert.deepEqual(atDistance(reverse, 0), samples[2]);
  assert.deepEqual(atDistance(reverse, reverse.length), samples[0]);
  assert.deepEqual(samples[0], point(100, 30, 900), '不能修改原河道顺序');
});

test('河道分段独立、不会跨越缺口插值，退化点也返回有限值', () => {
  const left = createTrack([point(100, 30, 400), point(101, 30, 300)]);
  const right = createTrack([point(102, 30, 200), point(103, 30, 100)]);
  assert.deepEqual(atDistance(left, 1e9), point(101, 30, 300));
  assert.deepEqual(atDistance(right, -1), point(102, 30, 200));
  assert.deepEqual(atDistance(createTrack([point(100, 30, 50), point(100, 30, 50)]), 10), point(100, 30, 50));
  assert.equal(atDistance(createTrack([]), 10), null);
});

function playback() {
  const frames = new Map(), rendered = [], state = { available: true, motion: true, visible: true };
  let nextId = 0;
  const controller = createPlayback({ request: fn => { frames.set(++nextId, fn); return nextId; },
    cancel: id => frames.delete(id), available: () => state.available,
    canAnimate: () => state.motion && state.visible, render: seconds => rendered.push(seconds), changed() {} });
  const tick = now => { const [id, fn] = frames.entries().next().value; frames.delete(id); fn(now); };
  return { controller, frames, rendered, state, tick };
}

test('播放、暂停、继续和单步保持进度，没有重复动画循环', () => {
  const { controller: p, frames, rendered, tick } = playback();
  p.play(); p.play(); assert.equal(frames.size, 1);
  tick(1000); tick(1100); assert.equal(p.seconds, .1);
  const stale = [...frames.values()][0];
  p.pause(); stale(1200);
  assert.equal(frames.size, 0); assert.equal(p.seconds, .1);
  p.play(); tick(9000); assert.equal(p.seconds, .1, '暂停时间不应计入进度');
  p.step(); assert.equal(p.seconds, .6); assert.equal(frames.size, 0);
  assert.equal(rendered.at(-1), .6);
  p.reset(); assert.equal(p.seconds, 0);
});

test('减少动效可单步，离屏、隐藏河流和卸载会停止且不会自动重播', () => {
  const { controller: p, frames, state, tick } = playback();
  p.play(); tick(0); state.motion = false; p.refresh();
  assert.equal(p.playing, false); assert.equal(frames.size, 0);
  p.play(); assert.equal(frames.size, 0);
  p.step(); assert.equal(p.seconds, .5);
  state.motion = true; p.refresh(); assert.equal(p.playing, false);
  p.play(); state.visible = false; tick(1); assert.equal(frames.size, 0);
  state.visible = true; state.available = false; p.play(); p.step(); assert.equal(p.seconds, .5);
  state.available = true; p.play(); const stale = [...frames.values()][0]; p.dispose(); stale(2); p.play();
  assert.equal(frames.size, 0);
});

test('实际端点区分入海口、出境河段、湖泊和人工运河，流向分段顺序已核对', () => {
  const context = { window: {} }, base = path.join(__dirname, '../static/study_topics/geo-map');
  for (const file of ['china-3d-data.js', 'china-rivers-data.js']) vm.runInNewContext(fs.readFileSync(path.join(base, file), 'utf8'), context);
  const records = context.window.GM_CHINA_RIVERS.rivers;
  const configs = context.window.GM_CHINA_3D.rivers;
  const config = id => configs.find(river => river.feature === id).flow;
  assert.equal(config('f20').endpoints[1].kind, 'mouth');
  assert.match(config('f20').endpoints[1].label, /东海/);
  assert.equal(config('f21').endpoints[1].kind, 'mouth');
  assert.match(config('f21').endpoints[1].label, /渤海/);
  assert.equal(config('f40').endpoints[0].kind, 'confluence');
  assert.equal(config('f40').endpoints[1].kind, 'continuation');
  assert.equal(config('f42').endpoints[1].kind, 'lake');
  assert.equal(config('f43').mode, 'managed');
  assert.ok(config('f43').directions.every(d => d === 0));
  for (const { feature, flow } of configs.filter(c => c.flow.mode === 'downstream')) {
    for (let i = 0; i < records[feature].paths.length; i++) {
      const source = records[feature].paths[i], track = createTrack(source.map(p => point(p[0], p[1], p[2])), flow.directions[i]);
      // 本次保存的自然河道各段均按上游到下游排列；方向与数据版本另有哈希绑定。
      assert.ok(atDistance(track, 0).point[0] < atDistance(track, track.length).point[0]);
    }
  }
});
