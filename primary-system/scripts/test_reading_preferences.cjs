const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function declaration(values = {}) {
  const style = Object.keys(values);
  style.getPropertyValue = key => values[key] || '';
  style.getPropertyPriority = key => key === 'font-size' ? 'important' : '';
  style.priorities = {};
  style.setProperty = (key, value, priority) => { values[key] = value; style.priority = priority; style.priorities[key] = priority; };
  return style;
}

function setup({saved, blocked = false, sheets = []} = {}) {
  const events = {}, windowEvents = {}, writes = [], microtasks = [], buttons = [];
  for (const [field, choices] of [['readingTheme', ['light', 'dark', 'warm']], ['readingSize', ['small', 'medium', 'large']]]) {
    for (const value of choices) buttons.push({tagName: 'BUTTON', dataset: {[field]: value},
      setAttribute(key, value) { this[key] = value; }, addEventListener(event, fn) { this[event] = fn; }});
  }
  const summary = {focus() { this.focused = true; }};
  const elements = {'reading-current': {}, 'reading-note': {}, 'reading-settings': {
    hidden: true, handlers: {}, addEventListener(event, fn) { this.handlers[event] = fn; }, contains: () => false,
    querySelector: () => summary,
  }};
  const paletteStyle = {dataset: {}, textContent: ''};
  const document = {documentElement: {dataset: {}}, head: {append() {}}, body: {}, styleSheets: sheets,
    getElementById: id => elements[id], querySelector: () => null,
    querySelectorAll: selector => selector === '[style]' ? [] : buttons.filter(button =>
      selector.includes('],') || selector.includes('theme') && button.dataset.readingTheme || selector.includes('size') && button.dataset.readingSize),
    createElement: () => paletteStyle, dispatchEvent() {},
    addEventListener: (event, fn) => { events[event] = fn; },
  };
  const window = {CSS: {supports: () => true}, addEventListener: (event, fn) => { windowEvents[event] = fn; }};
  let mutations;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../static/reading-preferences.js'), 'utf8'), {
    document, window, URL, location: {href: 'http://study.test/', origin: 'http://study.test'},
    CustomEvent: class {}, MutationObserver: class {constructor(fn) { mutations = fn; } observe() {}},
    queueMicrotask: fn => microtasks.push(fn),
    localStorage: {getItem() { if (blocked) throw Error('blocked'); return saved; },
      setItem(key, value) { if (blocked) throw Error('blocked'); writes.push({key, value: JSON.parse(value)}); }},
  });
  const flush = () => { while (microtasks.length) microtasks.shift()(); };
  const ready = () => { events.DOMContentLoaded(); flush(); };
  return {document, window, events, windowEvents, writes, buttons, elements, summary, paletteStyle, ready, flush,
    mutate: record => { mutations([record]); flush(); }};
}

test('preferences restore before DOM ready, controls save and synchronize across tabs', () => {
  const page = setup({saved: '{"theme":"warm","size":"large"}'});
  assert.equal(page.document.documentElement.dataset.readingTheme, 'warm');
  assert.equal(page.document.documentElement.dataset.readingSize, 'large');
  assert.equal(page.writes.length, 0);
  page.ready();
  assert.equal(page.elements['reading-settings'].hidden, false);
  assert.match(page.elements['reading-current'].textContent, /暖色护眼 · 大字/);
  const dark = page.buttons.find(button => button.dataset.readingTheme === 'dark');
  dark.click();
  assert.equal(dark['aria-pressed'], 'true');
  assert.deepEqual(page.writes.at(-1).value, {theme: 'dark', size: 'large'});
  page.windowEvents.storage({key: 'study_reading_v1', newValue: '{"theme":"light","size":"small"}'});
  assert.equal(page.document.documentElement.dataset.readingSize, 'small');
  page.windowEvents.storage({key: null, newValue: null});
  assert.equal(page.document.documentElement.dataset.readingSize, 'medium');
  assert.equal(page.writes.length, 1);
});

test('bad storage falls back safely and unavailable storage still permits switching', () => {
  for (const saved of ['broken', '{"theme":"toString","size":"bad"}', 'null', '[]']) {
    const page = setup({saved}); page.ready();
    assert.equal(page.window.StudyReading.preferences.theme, 'light');
    assert.equal(page.window.StudyReading.preferences.size, 'medium');
  }
  const page = setup({blocked: true}); page.ready();
  page.window.StudyReading.setPreferences({theme: 'dark', size: 'large'});
  assert.equal(page.document.documentElement.dataset.readingTheme, 'dark');
  assert.match(page.elements['reading-note'].textContent, /本页已调整/);
});

test('Escape closes an open native picker before closing the surrounding settings', () => {
  const page = setup(); page.ready();
  const settings = page.elements['reading-settings'];
  settings.open = true;
  let stopped = false;
  settings.handlers.keydown({key: 'Escape', target: {closest: () => ({matches: () => true})},
    stopPropagation() { stopped = true; }});
  assert.equal(stopped, true);
  assert.equal(settings.open, true);
  assert.equal(page.summary.focused, undefined);
  settings.handlers.keydown({key: 'Escape', target: {closest: () => ({matches: () => false})}});
  assert.equal(settings.open, false);
  assert.equal(page.summary.focused, true);
});

test('legacy type and palette adapt once, retain variables, media, priorities and media artwork', () => {
  const base = declaration({'font-size': '18px', '--paper': '#f7faf5'});
  const card = declaration({'font-size': 'clamp(20px, 2vw, 30px)', color: 'var(--green-dark)',
    background: 'linear-gradient(#fff, rgba(240, 230, 200, .5))', fill: '#ee7711', stroke: 'black',
    'background-image': 'url("/static/green.svg")'});
  const print = declaration({'font-size': '13px', color: '#000'});
  const shorthand = declaration({'background-color': ''});
  const read = shorthand.getPropertyValue;
  shorthand.getPropertyValue = key => read(key) || (key === 'background' ? 'var(--card, #fff)' : '');
  const select = declaration({background: '#fffefa url("/static/green.svg") no-repeat right center'});
  const sheet = {href: 'http://study.test/static/topic.css', cssRules: [
    {selectorText: ':root', style: base},
    {cssRules: [{selectorText: '.card', style: card}]},
    {selectorText: '.panel', style: shorthand},
    {selectorText: 'select', style: select},
    {media: {mediaText: 'print'}, cssRules: [{selectorText: '.card', style: print}]},
  ]};
  const page = setup({sheets: [sheet]}); page.ready();
  assert.equal(base.getPropertyValue('font-size'), '18px');
  assert.match(card.getPropertyValue('font-size'), /calc\(\(clamp\(20px, 2vw, 30px\)\) \* var\(--reading-scale, 1\)\)/);
  assert.equal(card.priorities['font-size'], 'important');
  assert.equal(card.getPropertyValue('color'), 'var(--green-dark)');
  assert.match(card.getPropertyValue('background'), /var\(--reading-color-/);
  assert.equal(shorthand.priority, '');
  // CSSOM 仅枚举空长写时，仍会设置含适配颜色的简写。
  assert.match(shorthand.getPropertyValue('background'), /var\(--card, var\(--reading-color-\d+, #fff\)\)/);
  assert.match(select.getPropertyValue('background'), /^var\(--reading-color-\d+, #fffefa\) url\("\/static\/green.svg"\)/);
  assert.equal(card.getPropertyValue('fill'), '#ee7711');
  assert.equal(card.getPropertyValue('stroke'), 'black');
  assert.equal(card.getPropertyValue('background-image'), 'url("/static/green.svg")');
  assert.equal(print.getPropertyValue('font-size'), '13px');
  assert.equal(print.getPropertyValue('color'), '#000');
  assert.match(page.paletteStyle.textContent, /^@media screen/);
  assert.match(page.paletteStyle.textContent, /data-reading-theme="warm"/);
  const original = card.getPropertyValue('background');
  page.events.load({target: {tagName: 'LINK', sheet}}); page.flush();
  assert.equal(card.getPropertyValue('background'), original);
});

test('dynamic inline styles scale without compounding and SVG inline attributes are left alone', () => {
  const page = setup(); page.ready();
  const style = declaration({'font-size': '22px', color: 'white'});
  const node = {nodeType: 1, closest: () => null, matches: () => false, hasAttribute: () => true, style};
  page.mutate({type: 'attributes', target: node});
  assert.equal(style.getPropertyValue('font-size'), 'calc((22px) * var(--reading-scale, 1))');
  const original = style.getPropertyValue('color');
  page.mutate({type: 'attributes', target: node});
  assert.equal(style.getPropertyValue('color'), original);
  assert.equal(style.getPropertyValue('font-size'), 'calc((22px) * var(--reading-scale, 1))');
  style.setProperty('font-size', '30px');
  node.closest = () => ({});
  page.mutate({type: 'attributes', target: node});
  assert.equal(style.getPropertyValue('font-size'), '30px');
});
