/* 科学演示：开关决定连通，动画只负责观察，并能完整停止。 */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = path.join(__dirname, '../static/study_topics/sci/');
const {circuitState, circuitLayout} = require(path.join(source, 'sci-figures.js'));
const {particlePosition} = require(path.join(source, 'sci-demo-motion.js'));

test('串联任一断开两灯都灭，并联各支路独立，断路入口沿用串联规则', () => {
  const cases = [
    [false, false, [false, false], [false, false], 'parallelNone'],
    [false, true, [false, false], [false, true], 'parallelOne'],
    [true, false, [false, false], [true, false], 'parallelOne'],
    [true, true, [true, true], [true, true], 'parallelBoth'],
  ];
  for (const [one, two, series, parallel, status] of cases) {
    for (const mode of ['series', 'open']) {
      assert.deepEqual(circuitState(mode, one, two), {lamps: series, status: one && two ? 'seriesClosed' : 'seriesOpen'});
      assert.equal(circuitLayout(mode, one, two).includes('data-sci-flow'), one && two);
    }
    assert.deepEqual(circuitState('parallel', one, two), {lamps: parallel, status});
    const html = circuitLayout('parallel', one, two);
    assert.equal(html.includes('data-sci-flow="branch-1"'), one);
    assert.equal(html.includes('data-sci-flow="branch-2"'), two);
    assert.equal(html.includes('data-sci-flow="positive"'), one || two);
    assert.equal(html.includes('data-sci-flow="negative"'), one || two);
    assert.equal((html.match(/data-lit="true"/g) || []).length, Number(one) + Number(two));
  }
});

test('微粒运动始终在各自容器内，固态围绕固定位置振动，时间可重复定位', () => {
  for (const kind of ['ice', 'water', 'vapor']) for (let i = 0; i < 9; i++) {
    for (let t = 0; t < 60; t += .25) {
      const {x, y} = particlePosition(kind, i, t);
      assert.ok(Math.abs(x) <= 59 && Math.abs(y) <= 42);
      if (kind === 'ice') {
        assert.ok(Math.abs(x - (i % 3 - 1) * 24) <= 2.001);
        assert.ok(Math.abs(y - (Math.floor(i / 3) - 1) * 22) <= 2.001);
      }
    }
    assert.notDeepEqual(particlePosition(kind, i, 0), particlePosition(kind, i, .25));
  }
});

function scene(motion = 'full', withEffects = true) {
  const events = {}, windowEvents = {}, frames = new Map(), watchers = new Map();
  let frameID = 0, mediaChange;
  const media = {matches: false, addEventListener(type, fn) { mediaChange = fn; }};
  const effects = {motion, watch(fig, pause) { watchers.set(fig, pause); return () => watchers.delete(fig); }};
  const document = {hidden: false, addEventListener(type, fn) { events[type] = fn; }};
  const window = {StudyEffects: withEffects ? effects : undefined, matchMedia: () => media,
    addEventListener(type, fn) { windowEvents[type] = fn; },
    requestAnimationFrame(fn) { frames.set(++frameID, fn); return frameID; },
    cancelAnimationFrame(id) { frames.delete(id); }};
  vm.runInNewContext(fs.readFileSync(path.join(source, 'sci-demo-motion.js'), 'utf8'), {window, document});
  function element(dataset = {}) { return {dataset, attrs: {}, disabled: false, hidden: false,
    setAttribute(k, v) { this.attrs[k] = v; }}; }
  function figure(circuit = false) {
    const buttons = Object.fromEntries(['play', 'step', 'reset'].map(key => [key, element({sciMotion: key})]));
    const controls = element(), status = element(), dots = Array.from({length: 9}, () => element());
    const particles = {dataset: {sciParticles: 'water', cx: '316'}, querySelectorAll: () => dots};
    const path = {getTotalLength: () => 100, getPointAtLength: n => ({x: n, y: 94})};
    const track = {querySelector: () => path, querySelectorAll: () => dots};
    const fig = {isConnected: true, connectedCircuit: true,
      querySelector(selector) { return selector === '.sci-motion-controls' ? controls : selector === '[data-sci-motion-status]' ? status : buttons[selector.match(/"(.*?)"/)[1]]; },
      querySelectorAll(selector) { return selector === '[data-sci-particles]' ? (circuit ? [] : [particles]) : (circuit && this.connectedCircuit ? [track] : []); }};
    Object.values(buttons).forEach(button => { button.closest = () => fig; });
    window.SciDemoMotion.mount(fig);
    return {fig, dots, buttons, status};
  }
  return {api: window.SciDemoMotion, frames, watchers, effects, document, figure,
    click(scene, key) { events.click({target: {closest: () => scene.buttons[key]}}); },
    tick(time) { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time)); },
    preference(value) { effects.motion = value; events['study:effects-change'](); },
    reduce(value) { media.matches = value; mediaChange(); },
    hide() { document.hidden = true; events.visibilitychange(); },
    pagehide() { windowEvents.pagehide(); }};
}
const positions = s => s.dots.map(dot => [dot.attrs.cx, dot.attrs.cy]);

test('默认静止，播放推进，暂停冻结，步进与重置没有留下动画循环', () => {
  const env = scene(), s = env.figure(), initial = positions(s);
  assert.equal(env.frames.size, 0);
  env.click(s, 'play'); env.tick(0); env.tick(100);
  assert.notDeepEqual(positions(s), initial);
  env.click(s, 'play'); const paused = positions(s); env.tick(200);
  assert.deepEqual(positions(s), paused);
  env.click(s, 'step'); assert.notDeepEqual(positions(s), paused);
  env.click(s, 'reset'); assert.deepEqual(positions(s), initial);
  assert.equal(env.frames.size, 0);
});

test('断开电路清除电流运动，重新闭合仍需主动播放，旧回调不能复活', () => {
  const env = scene(), s = env.figure(true);
  env.click(s, 'play'); const stale = [...env.frames.values()][0];
  s.fig.connectedCircuit = false; env.api.refresh(s.fig);
  assert.equal(env.frames.size, 0);
  assert.equal(s.buttons.play.disabled, true);
  assert.equal(s.buttons.step.disabled, true);
  stale(500); assert.equal(env.frames.size, 0);
  s.fig.connectedCircuit = true; env.api.refresh(s.fig);
  assert.equal(s.buttons.play.disabled, false); assert.equal(env.frames.size, 0);
  env.click(s, 'play'); stale(700); assert.equal(env.frames.size, 1);
});

test('同页只播放一处，移除和卸载同时释放观察器与动画帧', () => {
  const env = scene(), a = env.figure(), b = env.figure();
  env.api.mount(a.fig); assert.equal(env.watchers.size, 2);
  env.click(a, 'play'); env.click(b, 'play');
  assert.equal(a.buttons.play.attrs['aria-pressed'], 'false');
  assert.equal(b.buttons.play.attrs['aria-pressed'], 'true'); assert.equal(env.frames.size, 1);
  b.fig.isConnected = false; env.api.prune();
  assert.equal(env.frames.size, 0); assert.equal(env.watchers.size, 1);
  env.click(a, 'play'); const stale = [...env.frames.values()][0];
  env.api.dispose(); stale(900);
  assert.equal(env.frames.size, 0); assert.equal(env.watchers.size, 0);
});

test('统一偏好与系统减少动态效果停止播放，保留步进，恢复后不自动运行', () => {
  const env = scene(), s = env.figure();
  for (const mode of ['gentle', 'off']) {
    env.click(s, 'play'); env.preference(mode);
    assert.equal(env.frames.size, 0); assert.equal(s.buttons.play.disabled, true);
    const before = positions(s); env.click(s, 'step'); assert.notDeepEqual(positions(s), before);
    env.preference('full'); assert.equal(env.frames.size, 0);
  }
  env.click(s, 'play'); env.reduce(true);
  assert.equal(env.frames.size, 0); assert.equal(s.buttons.play.disabled, true);
  env.reduce(false); assert.equal(env.frames.size, 0);
  const fallback = scene('full', false), f = fallback.figure();
  fallback.reduce(true); fallback.click(f, 'play');
  assert.equal(fallback.frames.size, 0); assert.equal(f.buttons.play.disabled, true);
  fallback.click(f, 'step'); assert.equal(f.buttons.step.disabled, false);
});

test('离屏、后台和离页信号暂停且不擅自续播', () => {
  const env = scene(), s = env.figure();
  env.click(s, 'play'); env.watchers.get(s.fig)(); assert.equal(env.frames.size, 0);
  env.click(s, 'play'); env.hide(); assert.equal(env.frames.size, 0);
  env.click(s, 'play'); assert.equal(env.frames.size, 0);
  env.document.hidden = false; assert.equal(env.frames.size, 0);
  env.click(s, 'play'); env.pagehide(); assert.equal(env.frames.size, 0);
});
