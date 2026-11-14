/* 统一反馈的行为契约：偏好、降级、异步取消及去重。 */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup({saved, reduced = false, blocked = false} = {}) {
  const events = {}, windowEvents = {}, scripts = [], canvases = [], writes = [], bursts = [];
  const media = {matches: reduced, addEventListener: (_, callback) => { media.change = callback; }};
  const document = {
    documentElement: {dataset: {}}, hidden: false,
    currentScript: {dataset: {confettiUrl: '/static/vendor/canvas-confetti/confetti.browser.js'}},
    getElementById: () => null, querySelectorAll: () => [],
    addEventListener: (name, callback) => { events[name] = callback; },
    dispatchEvent: () => {},
    head: {append: node => scripts.push(node)}, body: {append: node => canvases.push(node)},
    createElement: name => ({name, setAttribute() {}, remove() { this.removed = true; }}),
  };
  const window = {matchMedia: () => media, innerHeight: 900,
    addEventListener: (name, callback) => { windowEvents[name] = callback; }};
  const context = vm.createContext({document, window, IntersectionObserver: undefined,
    CustomEvent: class {}, setTimeout, clearTimeout,
    localStorage: {
      getItem: () => { if (blocked) throw Error('blocked'); return saved; },
      setItem: (key, value) => { if (blocked) throw Error('blocked'); writes.push(JSON.parse(value)); },
    },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/study-effects.js'), 'utf8'), context);
  const load = () => {
    window.confetti = {create: () => { const burst = options => { bursts.push(options); return Promise.resolve(); }; burst.reset = () => {}; return burst; }};
    scripts.at(-1).onload();
  };
  return {effects: window.StudyEffects, window, document, media, scripts, canvases, writes, bursts, events, windowEvents, load};
}

test('invalid or unavailable storage retains usable defaults and controls', () => {
  for (const options of [{saved: 'broken'}, {saved: '{"motion":"bad","sound":"yes"}'}, {blocked: true}]) {
    const page = setup(options);
    assert.equal(page.effects.motion, 'full');
    assert.equal(page.effects.preferences.sound, false);
    page.effects.setPreferences({motion: 'off', sound: true});
    assert.equal(page.effects.motion, 'off');
    assert.equal(page.effects.preferences.sound, true);
  }
});

test('system reduced motion always wins and live changes are reflected', async () => {
  const page = setup({reduced: true});
  assert.equal(page.effects.motion, 'gentle');
  await page.effects.celebrate({key: 'round'});
  assert.equal(page.scripts.length, 0);
  page.media.matches = false; page.media.change();
  assert.equal(page.effects.motion, 'full');
  page.effects.setPreferences({motion: 'gentle'});
  assert.equal(page.effects.motion, 'gentle');
  assert.equal(page.writes.at(-1).motion, 'gentle');
});

test('celebrations load locally on demand and the same completion never repeats', async () => {
  const page = setup();
  assert.equal(page.scripts.length, 0);
  const pending = page.effects.celebrate({key: 'round'});
  assert.match(page.scripts[0].src, /^\/static\//);
  page.load(); await pending;
  await page.effects.celebrate({key: 'round'});
  assert.equal(page.bursts.length, 1);
  assert.equal(page.canvases[0].removed, true);
});

test('turning motion off while the library loads cancels pending confetti', async () => {
  const page = setup();
  const pending = page.effects.celebrate({key: 'round'});
  page.effects.setPreferences({motion: 'off'});
  page.load(); await pending;
  assert.equal(page.bursts.length, 0);
});

test('hidden pages pause registered teaching scenes and do not celebrate', async () => {
  const page = setup(); let pauses = 0;
  const unwatch = page.effects.watch({}, () => { pauses += 1; });
  page.document.hidden = true; page.events.visibilitychange();
  await page.effects.celebrate({key: 'round'});
  assert.equal(pauses, 1); assert.equal(page.scripts.length, 0);
  unwatch(); page.events.visibilitychange(); assert.equal(pauses, 1);
});

test('failed optional library cannot reject the completion flow', async () => {
  const page = setup();
  const pending = page.effects.celebrate({key: 'round'});
  page.scripts[0].onerror(); await pending;
  assert.equal(page.canvases.length, 0);
});

test('preferences synchronize across tabs including clearing storage', () => {
  const page = setup();
  page.windowEvents.storage({key: 'study_effects_v1', newValue: '{"motion":"off","sound":true}'});
  assert.equal(page.effects.motion, 'off');
  page.windowEvents.storage({key: null, newValue: null});
  assert.equal(page.effects.motion, 'full');
  assert.equal(page.effects.preferences.sound, false);
});

test('sound stays opt-in, yields to speech or media and stops when muted', async () => {
  const page = setup(); let tones = 0, stopped = 0;
  page.window.AudioContext = class {
    constructor() { this.currentTime = 0; this.state = 'running'; }
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    createGain() { return {connect() {}, disconnect() {}, gain: {setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}}}; }
    createOscillator() { tones += 1; return {frequency: {}, connect() {}, disconnect() {}, start() {}, stop() { stopped += 1; }}; }
  };
  page.effects.setPreferences({motion: 'off'});
  await page.effects.celebrate({key: 'muted'});
  assert.equal(tones, 0);
  page.effects.setPreferences({sound: true});
  page.window.speechSynthesis = {speaking: true};
  await page.effects.celebrate({key: 'speaking'});
  assert.equal(tones, 0);
  page.window.speechSynthesis.speaking = false;
  page.document.querySelectorAll = () => [{paused: false, ended: false}];
  await page.effects.celebrate({key: 'media'});
  assert.equal(tones, 0);
  page.document.querySelectorAll = () => [];
  await page.effects.celebrate({key: 'enabled'});
  assert.equal(tones, 3);
  page.effects.setPreferences({sound: false});
  assert.equal(stopped, 6); // 三个已计划结束的音符立即再收到停止指令。
});
