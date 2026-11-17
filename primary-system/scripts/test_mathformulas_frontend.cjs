const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const script = fs.readFileSync(path.join(__dirname, '../static/mathformulas/formulas.js'), 'utf8');
const storageKey = scope => 'primary-math-formulas-favorites-v1:' + scope;
function element() {
  return {dataset: {}, hidden: false, value: '', textContent: '', handlers: {}, attrs: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
    setAttribute(name, value) { this.attrs[name] = value; },
    toggleAttribute(name, on) { if (on) this.attrs[name] = ''; else delete this.attrs[name]; },
    focus() { this.focused = true; }, scrollIntoView() { this.scrolled = true; },
  };
}
function page({url = 'http://study.test/mathformulas/', scope = 'guest', storage = new Map(), blockedRead = false, blockedWrite = false} = {}) {
  const fields = {}, events = {};
  const get = selector => fields[selector] || (fields[selector] = element());
  const items = [
    ['count-01-01', 'count', '数位分级', '小学 数位分级 大数读写'],
    ['plane-02-01', 'plane', '长方形面积', '小学 长方形面积 s=长×宽 地毯'],
    ['junior-01-01', 'junior', '三角形面积', '初中 三角形面积 底 高'],
  ].map(([id, chapter, name, search]) => {
    const row = element(), button = element(), label = element(), details = element();
    row.dataset = {id, chapter, search}; label.textContent = name;
    row.querySelector = selector => selector === '[data-mform-favorite]' ? button : selector === '[data-mform-name]' ? label : details;
    row.matches = () => true; button.closest = () => row;
    return {row, button, details};
  });
  const groups = items.map(({row}) => ({hidden: false, querySelector: () => row.hidden ? null : row}));
  const app = element(); app.dataset = {scope, chapter: 'count', stage: 'primary'};
  app.querySelector = get;
  app.querySelectorAll = selector => selector === '[data-mform-row]' ? items.map(x => x.row)
    : selector === '[data-mform-group]' ? groups : items.map(x => x.button);
  get('[data-mform-intro]').dataset = {chapterTitle: '数的认识', chapterIntro: '认识数位。'};
  get('[data-mform-search]').value = new URL(url).searchParams.get('q') || '';
  const location = {href: url, hash: new URL(url).hash};
  vm.runInNewContext(script, {
    URL, location,
    history: {replaceState(a, b, value) { location.href = String(value); location.hash = new URL(value).hash; }},
    document: {querySelector: () => app, getElementById: id => items.find(x => 'formula-' + x.row.dataset.id === id)?.row},
    window: {addEventListener(name, handler) { events[name] = handler; }},
    requestAnimationFrame: fn => fn(),
    localStorage: {
      getItem(key) { if (blockedRead) throw Error('blocked'); return storage.get(key); },
      setItem(key, value) { if (blockedWrite) throw Error('full'); storage.set(key, value); },
    },
  });
  return {get, storage, location, events, items, groups,
    visible: () => items.filter(x => !x.row.hidden).map(x => x.row.dataset.id),
    type(value) { get('[data-mform-search]').value = value; get('[data-mform-search]').handlers.input(); },
    favorite(id) { const button = items.find(x => x.row.dataset.id === id).button; app.handlers.click({target: {closest: () => button}}); },
    favorites() { get('[data-mform-favorites-view]').handlers.click(); },
    clear() { get('[data-mform-clear]').handlers.click(); },
  };
}

test('search spans chapters and stages, combines keywords and reports zero results accurately', () => {
  const p = page();
  assert.deepEqual(p.visible(), ['count-01-01']);
  p.type('面积');
  assert.deepEqual(p.visible(), ['plane-02-01', 'junior-01-01']);
  assert.match(p.get('[data-mform-count-note]').textContent, /2 条公式/);
  assert.equal(new URL(p.location.href).searchParams.get('q'), '面积');
  p.type('三角形 面积');
  assert.deepEqual(p.visible(), ['junior-01-01']);
  p.type('没有这样的公式');
  assert.deepEqual(p.visible(), []);
  assert.match(p.get('[data-mform-count-note]').textContent, /0 条公式/);
  assert.equal(p.get('[data-mform-empty]').hidden, false);
  p.clear();
  assert.deepEqual(p.visible(), ['count-01-01']);
});

test('favorites persist across chapters and reloads, toggle without duplicates, and isolate accounts', () => {
  const p = page();
  p.type('面积'); p.favorite('plane-02-01');
  p.clear(); p.favorites();
  assert.deepEqual(p.visible(), ['plane-02-01']);
  assert.equal(new URL(p.location.href).searchParams.get('view'), 'favorites');
  const reloaded = page({url:p.location.href, storage:p.storage});
  assert.deepEqual(reloaded.visible(), ['plane-02-01']);
  const account = page({storage:p.storage, scope:'user-7', url:p.location.href});
  assert.deepEqual(account.visible(), []);
  reloaded.favorite('plane-02-01');
  assert.deepEqual(reloaded.visible(), []);
  assert.match(reloaded.get('[data-mform-empty]').textContent, /收藏夹还是空/);
  assert.equal(reloaded.get('[data-mform-favorites-view]').focused, true);
});

test('favorites and search combine and ignore removed or invalid formula IDs', () => {
  const storage = new Map([[storageKey('guest'), JSON.stringify(['count-01-01', 'plane-02-01', 'retired', 8])]]);
  const p = page({storage, url:'http://study.test/mathformulas/?q=面积&view=favorites'});
  assert.deepEqual(p.visible(), ['plane-02-01']);
  assert.match(p.get('[data-mform-favorites-view]').textContent, /（2）/);
  p.type('三角形');
  assert.equal(p.get('[data-mform-empty]').hidden, false);
  assert.match(p.get('[data-mform-empty]').textContent, /清除关键词/);
});

test('disabled or full storage keeps search and multiple in-page favorites usable', () => {
  for (const blockedRead of [false, true]) {
    const p = page({blockedRead, blockedWrite:true});
    p.type('面积'); p.favorite('plane-02-01'); p.favorite('junior-01-01');
    p.clear(); p.favorites();
    assert.deepEqual(p.visible(), ['plane-02-01', 'junior-01-01']);
    assert.match(p.get('[data-mform-storage-note]').textContent, /关闭页面后不会保留/);
  }
  const corrupted = page({storage:new Map([[storageKey('guest'), '{bad']])});
  corrupted.favorite('count-01-01');
  assert.deepEqual(JSON.parse(corrupted.storage.get(storageKey('guest'))), ['count-01-01']);
});

test('other-tab favorites merge on write and storage events refresh the open collection', () => {
  const p = page();
  p.storage.set(storageKey('guest'), JSON.stringify(['junior-01-01']));
  p.favorite('plane-02-01');
  assert.deepEqual(JSON.parse(p.storage.get(storageKey('guest'))).sort(), ['junior-01-01', 'plane-02-01']);
  p.favorites();
  p.storage.set(storageKey('guest'), JSON.stringify(['count-01-01']));
  p.events.storage({key:storageKey('guest')});
  assert.deepEqual(p.visible(), ['count-01-01']);
});

test('formula deep link opens its worked example without creating a favorite', () => {
  const p = page({url:'http://study.test/mathformulas/#formula-count-01-01'});
  assert.equal(p.items[0].details.open, true);
  assert.equal(p.items[0].row.scrolled, true);
  assert.equal(p.storage.size, 0);
});
