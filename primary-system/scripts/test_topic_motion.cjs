/* 教学演示回归：时间推进、偏好切换与卸载不留下播放循环。 */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function solarPage(motion = 'full') {
  function element(dataset = {}) {
    return {dataset, hidden: false, disabled: false, textContent: '', children: [], attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; }, append(...children) { this.children.push(...children); },
      replaceChildren() { this.children = []; }, insertAdjacentHTML() {},
      addEventListener() {}, removeEventListener() {}};
  }
  const nodes = new Map(), get = key => { if (!nodes.has(key)) nodes.set(key, element()); return nodes.get(key); };
  const modes = ['orbits', 'distance', 'size'].map(roamMode => element({roamMode}));
  const planets = Array.from({length: 8}, (_, i) => element({roamPlanet: String(i)}));
  const events = {}, rootEvents = {}, frames = new Map();
  let nextFrame = 0, pause;
  const root = {isConnected: true, querySelector: get,
    querySelectorAll: selector => selector === '[data-roam-mode]' ? modes : selector === '[data-roam-planet]' ? planets : [],
    addEventListener: (type, fn) => { rootEvents[type] = fn; }, removeEventListener: type => { delete rootEvents[type]; }};
  get('[data-roam-speed]').value = '1';
  const media = {matches: false, addEventListener() {}, removeEventListener() {}};
  const effects = {motion, watch: (_, fn) => { pause = fn; return () => { pause = null; }; }};
  const doc = {hidden: false, currentScript: {src: 'https://study.test/astro-media.js'},
    querySelector: () => root, createElementNS: () => element(),
    addEventListener: (type, fn) => { events[type] = fn; }, removeEventListener: type => { delete events[type]; }};
  const window = {StudyEffects: effects, matchMedia: () => media, addEventListener() {}, removeEventListener() {}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../content_sources/astro-media.js'), 'utf8'), {
    URL, ASTRO_MEDIA: require('../content_sources/astro-media-data.js'), document: doc, window,
    requestAnimationFrame: fn => { frames.set(++nextFrame, fn); return nextFrame; }, cancelAnimationFrame: id => frames.delete(id),
  });
  window.AstroMedia.mount();
  const click = (selector, index = 0) => rootEvents.click({target: {closest: key => key === selector
    ? key === '[data-roam-mode]' ? modes[index] : key === '[data-roam-planet]' ? planets[index] : get(key) : null}});
  const tick = time => { const [id, fn] = frames.entries().next().value; frames.delete(id); fn(time); };
  return {get, click, tick, frames, events, effects, root, doc, media: window.AstroMedia, offscreen: () => pause()};
}

test('solar stepping compares periods and switching views preserves elapsed time', () => {
  const page = solarPage();
  page.click('[data-roam-step]');
  assert.equal(page.get('[data-roam-elapsed]').textContent, '已过 0.25 地球年');
  page.click('[data-roam-planet]', 0);
  assert.match(page.get('[data-roam-laps]').textContent, /水星约转了 1.04 圈/);
  page.click('[data-roam-mode]', 1);
  assert.equal(page.get('[data-roam-time-controls]').hidden, true);
  page.click('[data-roam-mode]', 0);
  assert.equal(page.get('[data-roam-elapsed]').textContent, '已过 0.25 地球年');
  page.click('[data-roam-reset]');
  assert.equal(page.get('[data-roam-elapsed]').textContent, '已过 0.00 地球年');
});

test('solar playback uses selected speed, pauses offscreen, and cancels stale frames on dispose', () => {
  const page = solarPage();
  page.get('[data-roam-speed]').value = '3';
  page.click('[data-roam-play]'); page.tick(1000); page.tick(1100);
  assert.equal(page.get('[data-roam-elapsed]').textContent, '已过 0.03 地球年');
  const stale = [...page.frames.values()][0];
  page.offscreen(); stale(1200);
  assert.equal(page.frames.size, 0);
  page.click('[data-roam-play]');
  page.media.dispose();
  assert.equal(page.frames.size, 0);
  assert.equal(page.events['study:effects-change'], undefined);
});

test('solar reduced motion stops running frames and retains manual controls without auto resume', () => {
  const page = solarPage(); page.click('[data-roam-play]'); page.tick(1000);
  page.effects.motion = 'gentle'; page.events['study:effects-change']();
  assert.equal(page.frames.size, 0);
  assert.equal(page.get('[data-roam-play]').disabled, true);
  page.click('[data-roam-play]'); assert.equal(page.frames.size, 0);
  page.click('[data-roam-step]'); assert.match(page.get('[data-roam-elapsed]').textContent, /0.25/);
  page.effects.motion = 'full'; page.events['study:effects-change']();
  assert.equal(page.frames.size, 0);
  assert.equal(page.get('[data-roam-play]').disabled, false);
});

test('solar hidden-page signal cancels playback and ignores play until visible', () => {
  const page = solarPage(); page.click('[data-roam-play]');
  page.doc.hidden = true; page.events.visibilitychange();
  assert.equal(page.frames.size, 0);
  page.click('[data-roam-play]'); assert.equal(page.frames.size, 0);
  page.doc.hidden = false; page.events.visibilitychange();
  assert.equal(page.frames.size, 0);
  page.click('[data-roam-play]'); assert.equal(page.frames.size, 1);
});

function evolutionPage(motion = 'full') {
  const events = {}, timers = new Map(); let nextId = 0, watched = null;
  const node = () => ({dataset: {}, textContent: '', disabled: false, hidden: false, scrollLeft: 0, attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; }, getBoundingClientRect: () => ({left: 0, right: 320})});
  const players = [0, 1].map(() => {
    const player = {...node(), isConnected: true}, nodes = new Map();
    const get = key => { if (!nodes.has(key)) nodes.set(key, node()); return nodes.get(key); };
    const cells = ['甲骨文', '金文', '小篆', '楷书'].map((name, i) => {
      const cell = {...node(), dataset: {evoStage: String(i)}};
      cell.querySelector = key => key === '.stage-name' ? {textContent: name} : key === '.stage-era' ? {textContent: i === 1 ? '—' : '示意时期'}
        : key === '.stage-none' && i === 1 ? {textContent: '未见于金文'} : null;
      cell.closest = () => player; return cell;
    });
    for (const action of ['play', 'previous', 'next', 'reset']) {
      const button = get(`[data-evo-action="${action}"]`); button.dataset.evoAction = action; button.closest = () => player;
    }
    player.querySelector = get; player.querySelectorAll = () => cells;
    return {player, get, cells};
  });
  const root = {querySelectorAll: () => players.map(p => p.player), contains: p => players.some(item => item.player === p),
    addEventListener: (type, fn) => { events['root-' + type] = fn; }, removeEventListener: type => { delete events['root-' + type]; }};
  const effects = {motion, watch: (_, fn) => { watched = fn; return () => { watched = null; }; }};
  const doc = {hidden: false, addEventListener: (type, fn) => { events[type] = fn; }, removeEventListener: type => { delete events[type]; }};
  const window = {StudyEffects: effects, matchMedia: () => ({matches: false, addEventListener() {}, removeEventListener() {}}),
    addEventListener() {}, removeEventListener() {}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../content_sources/hanzi-evo-player.js'), 'utf8'), {
    window, document: doc, setTimeout: (fn, ms) => { timers.set(++nextId, {fn, ms}); return nextId; }, clearTimeout: id => timers.delete(id),
  });
  window.HanziEvolutionPlayer.mount(root);
  const click = (p, action) => {
    const button = typeof action === 'number' ? players[p].cells[action] : players[p].get(`[data-evo-action="${action}"]`);
    events['root-click']({target: {closest: () => button}});
  };
  const tick = () => { const [id, timer] = timers.entries().next().value; timers.delete(id); timer.fn(); };
  return {players, click, tick, timers, events, effects, offscreen: () => watched(), dispose: window.HanziEvolutionPlayer.dispose};
}

test('evolution sequence includes missing forms and stops at the fourth stage', () => {
  const p = evolutionPage(); p.click(0, 'play'); p.tick();
  assert.equal(p.players[0].player.dataset.evoIndex, '1');
  assert.match(p.players[0].get('[data-evo-status]').textContent, /未见于金文/);
  p.tick(); p.tick(); assert.equal(p.timers.size, 0);
  assert.equal(p.players[0].get('[data-evo-action="play"]').textContent, '再看一遍');
  p.click(0, 'play'); assert.equal(p.players[0].player.dataset.evoIndex, '0');
  assert.equal(p.timers.size, 1);
});

test('evolution keeps only one card playing and cancels stale ticks after selection or unmount', () => {
  const p = evolutionPage(); p.click(0, 'play'); const stale = [...p.timers.values()][0].fn;
  p.click(1, 'play'); stale();
  assert.equal(p.players[1].player.dataset.evoIndex, '0'); assert.equal(p.timers.size, 1);
  assert.equal(p.players[0].get('[data-evo-action="play"]').attrs['aria-pressed'], 'false');
  p.click(1, 2); assert.equal(p.timers.size, 0); assert.equal(p.players[1].player.dataset.evoIndex, '2');
  p.click(1, 'play'); p.dispose(); assert.equal(p.timers.size, 0); stale();
  assert.equal(p.events['root-click'], undefined); assert.equal(p.events['study:effects-change'], undefined);
});

test('evolution preferences and offscreen pause retain manual stages without auto resume', () => {
  const p = evolutionPage(); p.click(0, 'play'); p.offscreen(); assert.equal(p.timers.size, 0);
  p.click(0, 'play'); p.effects.motion = 'off'; p.events['study:effects-change']();
  assert.equal(p.timers.size, 0);
  assert.equal(p.players[0].get('[data-evo-action="play"]').disabled, true);
  p.click(0, 'next'); assert.equal(p.players[0].player.dataset.evoIndex, '1');
  p.effects.motion = 'full'; p.events['study:effects-change'](); assert.equal(p.timers.size, 0);
});

function territoryPage(query = '', motion = 'full') {
  const nodes = new Map(), events = {}, timers = new Map(); let nextId = 0, offscreen;
  const get = id => {
    if (!nodes.has(id)) nodes.set(id, {id, attrs: {}, handlers: {}, dataset: {}, style: {setProperty() {}}, clientWidth: 1000, clientHeight: 830,
      checked: false, textContent: '', innerHTML: '', value: '', hidden: false,
      setAttribute(k, v) { this.attrs[k] = v; }, after() {}, querySelectorAll: () => [], querySelector: s => get(s),
      addEventListener(type, fn) { this.handlers[type] = fn; }});
    return nodes.get(id);
  };
  get('territory-speed').value = '6000';
  const effects = {motion, watch: (_, fn) => { offscreen = fn; }};
  const location = new URL('https://study.test/history/dynasties.html' + query);
  const window = {StudyEffects: effects, matchMedia: () => ({matches: false, addEventListener() {}}),
    TLShared: {esc: String, eraHref: era => 'era.html?era=' + era.id}, addEventListener: (type, fn) => { events[type] = fn; }};
  const context = vm.createContext({URL, URLSearchParams, window, location, history: {replaceState: (_, __, url) => { location.href = url.href; }},
    document: {hidden: false, getElementById: get, currentScript: {src: 'https://study.test/territory-app.js'}, createElement: () => get('created'),
      addEventListener: (type, fn) => { events[type] = fn; }}, ResizeObserver: class { observe() {} },
    setTimeout: (fn, ms) => { timers.set(++nextId, {fn, ms}); return nextId; }, clearTimeout: id => timers.delete(id),
  });
  for (const file of ['content', 'dynasty-data', 'territory-data', 'territory-geo', 'territory-app']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, `../content_sources/history-timeline/${file}.js`), 'utf8'), context);
  }
  const click = id => get(id).handlers.click();
  const tick = () => { const [id, timer] = timers.entries().next().value; timers.delete(id); timer.fn(); };
  return {get, click, tick, timers, events, effects, offscreen: () => offscreen(), maps: window.TERRITORY_MAPS, location};
}

test('territory playback advances existing stages with stable view and preserves deep links', () => {
  const p = territoryPage('?map=qin');
  const initial = Number(p.get('territory-range').value);
  assert.ok(initial > 0);
  p.click('territory-zoom-in'); const view = p.get('territory-svg').attrs.viewBox;
  p.click('territory-play'); p.tick();
  assert.equal(Number(p.get('territory-range').value), initial + 1);
  assert.equal(p.get('territory-svg').attrs.viewBox, view);
  assert.equal(p.location.searchParams.get('map'), p.maps[initial + 1].id);
  assert.equal(p.timers.size, 1);
});

test('territory comparison, manual dates and offscreen stop pending playback', () => {
  const p = territoryPage('?map=qin'); p.click('territory-play'); const stale = [...p.timers.values()][0].fn;
  p.get('territory-compare').checked = true; p.get('territory-compare').handlers.change();
  assert.equal(p.timers.size, 0); assert.match(p.get('territory-outlines').innerHTML, /territory-old-range/);
  const index = p.get('territory-range').value; stale(); assert.equal(p.get('territory-range').value, index);
  p.click('territory-play'); p.get('territory-speed').value = '10000'; p.get('territory-speed').handlers.change();
  assert.equal(p.timers.size, 1); assert.equal([...p.timers.values()][0].ms, 10000);
  p.offscreen(); assert.equal(p.timers.size, 0);
});

test('territory stops at the last stage and reduced motion retains previous and restart controls', () => {
  const p = territoryPage(); p.get('territory-range').value = p.maps.length - 2; p.get('territory-range').handlers.input();
  p.click('territory-play'); p.tick(); assert.equal(p.timers.size, 0);
  assert.equal(p.get('territory-play').textContent, '从头再看');
  p.effects.motion = 'gentle'; p.events['study:effects-change'](); assert.equal(p.get('territory-play').disabled, true);
  p.click('territory-prev'); assert.equal(Number(p.get('territory-range').value), p.maps.length - 2);
  p.click('territory-restart'); assert.equal(Number(p.get('territory-range').value), 0); assert.equal(p.timers.size, 0);
  p.effects.motion = 'full'; p.events['study:effects-change'](); assert.equal(p.timers.size, 0);
});
