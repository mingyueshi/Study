/* Focused, dependency-free tests for fossil detail coordinates and diagram navigation. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function node() {
  return {
    style: {}, dataset: {}, attributes: {}, handlers: {}, textContent: '', hidden: false,
    addEventListener(type, fn) { this.handlers[type] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name] ?? null; },
    removeAttribute(name) { delete this.attributes[name]; },
    focus() { this.focusCount = (this.focusCount || 0) + 1; },
    scrollIntoView(options) { this.scrolled = options; },
    setPointerCapture(id) { this.captured = id; },
    hasPointerCapture(id) { return this.captured === id; },
    releasePointerCapture() { this.captured = null; },
    closest() { return null; },
  };
}
function fire(target, type = 'click', values = {}) {
  const event = {button: 0, pointerId: 1, pointerType: 'mouse', target,
    preventDefault() { this.prevented = true; }, ...values};
  target.handlers[type](event);
  return event;
}
function environment(document, hash = '') {
  const events = {}, location = {hash};
  return {events, location, context: vm.createContext({document,
    window: {location, addEventListener(type, fn) { events[type] = fn; },
      history: {replaceState(_, __, value) { location.hash = value; }}}})};
}
function run(file, context) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../static/humanorigins', file), 'utf8'), context);
}

function inspector() {
  const nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
  const dialog = get('origins-image-dialog'), close = node();
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.handlers.close(); };
  dialog.querySelector = () => close;
  const image = get('origins-large-image'), stage = get('origins-inspector-stage');
  image.naturalWidth = 1200;
  image.getBoundingClientRect = () => ({left: 100, top: 50, right: 500, bottom: 250, width: 400, height: 200});
  stage.getBoundingClientRect = () => ({left: 0, top: 0});
  const prompt = node(), answer = node(), question = get('origins-inspector-question');
  question.querySelector = selector => selector === 'summary' ? prompt : answer;
  const links = [true, false].map((hasQuestion, i) => {
    const link = node(), observation = node(), figure = node();
    const summary = {textContent: '找到保存下来的骨骼。'}, p = {textContent: '先观察，再作解释。'};
    observation.querySelector = selector => selector === 'summary' ? summary : p;
    figure.querySelector = selector => selector === 'figcaption' ? {textContent: '实物图的中文图注'} : hasQuestion ? observation : null;
    link.href = `/static/fossil-${i}.jpg`;
    link.querySelector = () => ({alt: `化石 ${i}`});
    link.closest = () => figure;
    return link;
  });
  const env = environment({getElementById: get, querySelectorAll: () => links});
  run('figures.js', env.context);
  return {get, links, close, prompt, answer, dialog, image, stage, ...env};
}

test('fossil lens maps the actual image rectangle and magnifies the selected detail', () => {
  const page = inspector(), lens = page.get('origins-detail-lens');
  fire(page.links[0]);
  assert.equal(page.dialog.open, true);
  assert.equal(lens.style.backgroundSize, '1200px 600px');
  assert.equal(lens.style.backgroundPosition, '-520px -220px');
  fire(page.stage, 'pointermove', {clientX: 200, clientY: 100});
  assert.equal(lens.style.left, '120px', 'letterboxing must not become part of image coordinates');
  assert.equal(lens.style.top, '50px');
  assert.equal(lens.style.backgroundPosition, '-220px -70px');
  page.get('origins-lens-power').value = '4';
  fire(page.get('origins-lens-power'), 'change');
  assert.equal(lens.style.backgroundSize, '1600px 800px');
  assert.equal(lens.style.backgroundPosition, '-320px -120px');
});

test('fossil lens supports keyboard movement, boundary clamping and a whole-image mode', () => {
  const page = inspector(), lens = page.get('origins-detail-lens');
  fire(page.links[0]);
  fire(page.stage, 'keydown', {key: 'ArrowRight'});
  assert.equal(lens.style.backgroundPosition, '-568px -220px');
  for (let i = 0; i < 40; i++) fire(page.stage, 'keydown', {key: 'ArrowLeft'});
  assert.equal(lens.style.backgroundPosition, '80px -220px');
  fire(page.get('origins-lens-toggle'));
  assert.equal(lens.hidden, true);
  assert.equal(page.get('origins-lens-toggle').getAttribute('aria-pressed'), 'false');
  fire(page.stage, 'keydown', {key: 'ArrowRight'});
  assert.equal(lens.hidden, false);
  assert.equal(page.get('origins-lens-toggle').getAttribute('aria-pressed'), 'true');
});

test('image changes reset the observation answer and closing releases pointer capture', () => {
  const page = inspector(), question = page.get('origins-inspector-question');
  fire(page.links[0]);
  assert.equal(page.prompt.textContent, '找到保存下来的骨骼。');
  assert.equal(page.answer.textContent, '先观察，再作解释。');
  question.open = true;
  fire(page.stage, 'pointerdown', {clientX: 200, clientY: 100});
  assert.equal(page.stage.captured, 1);
  fire(page.close);
  assert.equal(page.stage.captured, null);
  assert.equal(page.get('origins-detail-lens').hidden, true);
  fire(page.links[1]);
  assert.equal(question.hidden, true);
  assert.equal(question.open, false);
  assert.equal(page.answer.textContent, '');
  page.dialog.close();
  const modified = fire(page.links[0], 'click', {ctrlKey: true});
  assert.equal(modified.prevented, undefined);
  assert.equal(page.dialog.open, false);
});

function familyTree() {
  const selectors = new Map(), get = selector => {
    if (!selectors.has(selector)) selectors.set(selector, node()); return selectors.get(selector);
  };
  const root = node(); root.querySelector = get;
  const nodes = ['sapiens', 'denisovans'].map(id => Object.assign(node(), {dataset: {treePerson: id}}));
  root.querySelectorAll = () => nodes;
  const viewport = get('.origins-tree-viewport');
  Object.assign(viewport, {clientWidth: 1200, clientHeight: 560, scrollLeft: 0, scrollTop: 0});
  const cards = new Map(nodes.map(n => [`family-${n.dataset.treePerson}`, node()])), back = node();
  const env = environment({getElementById: id => id === 'origins-family-tree' ? root : cards.get(id),
    querySelectorAll: () => [back]});
  let resize;
  env.context.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe(target) { assert.equal(target, viewport); }
  };
  run('family-tree.js', env.context);
  return {root, get, nodes, viewport, cards, back, resize, ...env};
}

test('family tree zooms within bounds, preserves the centre and fits a resized viewport', () => {
  const page = familyTree();
  assert.equal(page.get('[data-tree-scale]').textContent, '100%');
  fire(page.get('[data-tree-plus]')); fire(page.get('[data-tree-plus]'));
  assert.equal(page.get('[data-tree-scale]').textContent, '150%');
  assert.equal(page.viewport.scrollLeft, 75);
  for (let i = 0; i < 20; i++) fire(page.get('[data-tree-plus]'));
  assert.equal(page.get('[data-tree-scale]').textContent, '250%');
  assert.equal(page.get('[data-tree-plus]').disabled, true);
  for (let i = 0; i < 20; i++) fire(page.get('[data-tree-minus]'));
  assert.equal(page.get('[data-tree-minus]').disabled, true);
  page.viewport.clientWidth = 720;
  fire(page.get('[data-tree-fit]'));
  assert.equal(page.get('[data-tree-scale]').textContent, '79%');
  page.viewport.clientWidth = 900; page.events.resize();
  assert.equal(page.get('[data-tree-scale]').textContent, '99%');
  page.viewport.clientWidth = 600; page.resize();
  assert.equal(page.get('[data-tree-scale]').textContent, '65%');
  fire(page.get('[data-tree-plus]'));
  page.viewport.clientWidth = 900; page.resize();
  assert.equal(page.get('[data-tree-scale]').textContent, '90%');
});

test('clicking a tree person expands the canonical card and return keeps the chosen zoom', () => {
  const page = familyTree();
  fire(page.get('[data-tree-plus]'));
  fire(page.nodes[1]);
  const card = page.cards.get('family-denisovans');
  assert.equal(card.open, true);
  assert.equal(card.focusCount, 1);
  assert.equal(page.location.hash, '#family-denisovans');
  assert.equal(page.nodes[1].getAttribute('aria-current'), 'location');
  fire(page.back);
  assert.equal(page.nodes[1].focusCount, 1);
  assert.equal(page.get('[data-tree-scale]').textContent, '125%');
  assert.equal(page.location.hash, '#origins-family-tree');
});

test('dragging tree whitespace pans the diagram while node links and touch retain their actions', () => {
  const page = familyTree();
  page.viewport.scrollLeft = 100; page.viewport.scrollTop = 80;
  fire(page.viewport, 'pointerdown', {clientX: 200, clientY: 100});
  fire(page.viewport, 'pointermove', {clientX: 160, clientY: 70});
  assert.equal(page.viewport.scrollLeft, 140);
  assert.equal(page.viewport.scrollTop, 110);
  fire(page.viewport, 'pointerup');
  fire(page.viewport, 'pointermove', {clientX: 50, clientY: 20});
  assert.equal(page.viewport.scrollLeft, 140);
  const touch = fire(page.viewport, 'pointerdown', {pointerType: 'touch'});
  assert.equal(touch.prevented, undefined);
});

function sites(hash = '') {
  const nodes = new Map(), get = id => {
    if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);
  };
  get('origins-site-preview').hidden = true;
  const records = new Map(['site-harbin', 'clue-3'].map(id => {
    const record = node();
    record.observation = {textContent: `观察 ${id}`};
    record.querySelector = selector => ({textContent: selector === 'h3' ? `标题 ${id}` : `年代 ${id}`});
    record.querySelectorAll = () => [record.observation, {textContent: `解释 ${id}`}];
    return [id, record];
  }));
  const links = [...records.keys()].flatMap(id => [true, false].map(pin => {
    const link = node(); link.setAttribute('href', `#${id}`);
    link.closest = () => pin ? {} : null;
    return link;
  }));
  const back = node();
  const env = environment({getElementById: id => records.get(id) || get(id),
    querySelectorAll: selector => selector === '[data-site-select]' ? links : [back]}, hash);
  run('sites.js', env.context);
  return {get, records, links, back, ...env};
}

test('China point selection reads current canonical text and shows the nearby preview', () => {
  const page = sites();
  fire(page.links[0]);
  assert.equal(page.get('origins-site-preview').hidden, false);
  assert.equal(page.get('origins-site-preview-heading').textContent, '标题 site-harbin');
  assert.equal(page.get('origins-site-preview-observation').textContent, '观察 site-harbin');
  assert.equal(page.get('origins-site-preview').focusCount, 1);
  assert.equal(page.links[1].getAttribute('aria-current'), 'location');
  page.records.get('site-harbin').observation.textContent = '更新后的原文';
  fire(page.links[1]);
  assert.equal(page.get('origins-site-preview-observation').textContent, '更新后的原文');
  fire(page.links[2]);
  assert.equal(page.links[0].getAttribute('aria-current'), null);
  assert.equal(page.get('origins-site-preview-heading').textContent, '标题 clue-3');
});

test('China preview opens the complete evidence and returns focus to the selected map point', () => {
  const page = sites();
  fire(page.links[0]); fire(page.get('origins-site-preview-full'));
  assert.equal(page.records.get('site-harbin').focusCount, 1);
  fire(page.back);
  assert.equal(page.links[0].focusCount, 1);
  assert.equal(page.location.hash, '#origins-sites-heading');
  const legacy = sites('#clue-3');
  assert.equal(legacy.get('origins-site-preview-heading').textContent, '标题 clue-3');
  assert.equal(legacy.get('origins-site-preview').focusCount, undefined, 'deep links must not steal focus');
  const modified = sites();
  fire(modified.links[0], 'click', {metaKey: true});
  assert.equal(modified.get('origins-site-preview').hidden, true);
});
