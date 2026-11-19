/* 文学名片、关系树与深链接的行为回归，不启动服务或连接外部资料。 */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function page({hash = '', state = {last: 'lu1', learned: {}}, storageBlocked = false} = {}) {
  const elements = new Map(), handlers = {}, windowHandlers = {}, writes = [];
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', value: '', textContent: '', dataset: {},
      focus() { this.focused = true; }, scrollIntoView() { this.scrolled = true; },
      setAttribute(name, value) { this[name] = value; },
      querySelector() { return null; },
    });
    return elements.get(id);
  };
  const location = {hash};
  let people = [], branches = [];
  const context = vm.createContext({
    console,
    window: {
      location, scrollTo() {},
      history: {pushState(_state, _title, hash) { location.hash = hash; }},
      addEventListener(type, fn) { windowHandlers[type] = fn; },
    },
    document: {
      getElementById: get,
      querySelector(selector) {
        if (selector.startsWith('.lit-workspace')) return null;
        return get(selector);
      },
      querySelectorAll(selector) { return selector === '.lit-person' ? people : branches; },
      addEventListener(type, fn) { handlers[type] = fn; },
    },
    localStorage: {
      getItem() { if (storageBlocked) throw Error('blocked'); return JSON.stringify(state); },
      setItem(_key, value) { if (storageBlocked) throw Error('blocked'); writes.push(JSON.parse(value)); },
    },
  });
  for (const file of ['lit-data.js', 'lit-app.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'content_sources', file), 'utf8'), context);
  }
  handlers.DOMContentLoaded();
  return {
    app: context.window.LitExplore, get, writes, location,
    click(dataset) { handlers.click({target: {closest() { return {dataset}; }}, preventDefault() {}}); },
    search(value) { get('search').value = value; handlers.input({target: {...get('search'), id: 'search'}}); },
    follow(hash) { location.hash = hash; windowHandlers.hashchange(); },
    setPeople(items) { people = items; }, setBranches(items) { branches = items; },
  };
}

test('four books switch independently and character selection keeps existing branches and marks', () => {
  const p = page({hash: '#relationships-sanguo', state: {last: 'lu4', learned: {'lu4-lu4-3': true}}});
  assert.equal(p.app.view, 'relationships');
  assert.match(p.get('cards').innerHTML, /刘备一方/);
  const before = p.get('cards').innerHTML;
  const people = ['liubei', 'zhugeliang'].map(id => ({dataset: {id}, setAttribute(key, value) { this[key] = value; }}));
  p.setPeople(people);
  p.click({act: 'character', id: 'zhugeliang'});
  assert.equal(p.get('cards').innerHTML, before, '选人物只更新档案，保留已展开的分支');
  assert.match(p.get('lit-character-detail').innerHTML, /草船借箭/);
  assert.match(p.get('lit-character-detail').innerHTML, /第四十六回/);
  assert.equal(people[1]['aria-pressed'], 'true');
  assert.equal(p.location.hash, '#relationships-sanguo-zhugeliang');
  for (const book of p.app.data.classics) {
    p.click({act: 'book', id: book.id});
    assert.equal(p.app.selectedBook, book.id);
    assert.match(p.get('cards').innerHTML, new RegExp(book.title));
    assert.equal(p.app.selectedCharacter, book.characters[0].id);
  }
  assert.equal(p.app.state.learned['lu4-lu4-3'], true);
  const branches = [{open: true}, {open: true}];
  p.setBranches(branches);
  p.click({act: 'branches', open: 'false'});
  assert.ok(branches.every(b => !b.open));
  p.click({act: 'branches', open: 'true'});
  assert.ok(branches.every(b => b.open));
});

test('author filters, cross-book search and escaped empty results work together', () => {
  const p = page({hash: '#view-authors'});
  assert.match(p.get('cards').innerHTML, /李白/);
  p.click({act: 'author-group', group: '外国作家'});
  assert.match(p.get('cards').innerHTML, /正在看 3 位作家/);
  assert.doesNotMatch(p.get('cards').innerHTML, /id="author-libai"/);
  p.search('剪刀');
  assert.match(p.get('cards').innerHTML, /安徒生/);
  p.search('草船借箭');
  assert.match(p.get('cards').innerHTML, /#relationships-sanguo-zhugeliang/);
  p.search('三国演义');
  assert.match(p.get('cards').innerHTML, /罗贯中/);
  p.search('<img onerror="bad">');
  assert.doesNotMatch(p.get('cards').innerHTML, /<img onerror/);
  assert.match(p.get('cards').innerHTML, /&lt;img/);
});

test('author, character and old lesson links clear searches and remain usable through history', () => {
  const p = page({hash: '#author-sushi'});
  assert.equal(p.app.view, 'authors');
  assert.ok(p.get('author-sushi').focused);
  p.search('任意词');
  p.follow('#relationships-xiyou-sunwukong');
  assert.equal(p.app.view, 'relationships');
  assert.equal(p.app.selectedCharacter, 'sunwukong');
  assert.equal(p.app.query, '');
  assert.ok(p.get('character-xiyou-sunwukong').focused);
  p.follow('#lesson-lu6-5');
  assert.equal(p.app.view, 'lu6');
  assert.ok(p.get('lesson-lu6-5').focused);
  p.follow('#view-facts');
  assert.equal(p.app.view, 'facts');
  p.follow('#author-jacob-grimm');
  assert.equal(p.app.view, 'authors');
  assert.ok(p.get('author-jacob-grimm').focused);
  p.follow('#relationships-unknown-missing');
  assert.equal(p.app.view, 'authors');
});

test('new views restore without changing old mastery keys and work when storage is unavailable', () => {
  const p = page({state: {last: 'authors', learned: {'lu3-lu3-2': true}}});
  assert.equal(p.app.view, 'authors');
  p.app.toggleLearn('lu3', 'lu3-3');
  assert.equal(p.writes.at(-1).learned['lu3-lu3-2'], true);
  assert.equal(p.writes.at(-1).learned['lu3-lu3-3'], true);
  const blocked = page({storageBlocked: true});
  blocked.app.selectView('relationships');
  blocked.app.selectBook('honglou');
  assert.equal(blocked.app.selectedBook, 'honglou');
  blocked.app.selectBook('invalid');
  blocked.app.selectCharacter('invalid');
  assert.equal(blocked.app.selectedBook, 'honglou');
});

test('chapter and lesson navigation keep their own directories and retrace reading links', () => {
  const p = page({state: {last: 'lu4', learned: {}}});
  assert.match(p.get('chips').innerHTML, /data-id="lu4" aria-current="true"/);
  assert.doesNotMatch(p.get('chips').innerHTML, /文学速查/);
  assert.match(p.get('lit-extras').innerHTML, /文学速查/);
  p.app.selectView('lu6');
  assert.equal(p.location.hash, '#view-lu6');
  assert.match(p.get('lit-points').innerHTML, /href="#lesson-lu6-5"/);
  p.follow('#lesson-lu6-5');
  assert.match(p.get('lit-points').innerHTML, /href="#lesson-lu6-5" data-act="lesson" aria-current="location"/);
  p.search('杜甫');
  assert.equal(p.get('lit-directory').hidden, true);
  p.search('');
  assert.equal(p.get('lit-directory').hidden, false);
  p.follow('#view-clinic');
  assert.equal(p.get('lit-directory').hidden, true);
  assert.match(p.get('cards').innerHTML, /文学小诊所/);
  p.follow('#view-constructor');
  assert.equal(p.app.view, 'clinic');
  p.follow('');
  assert.equal(p.app.view, 'lu4');
  assert.match(p.get('lit-points').innerHTML, /href="#lesson-lu4-/);
});
