const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createStore, matchesCase, comparisonIds} = require('../static/mysteries/notebook-store.js');
const PREFIX = 'primary.mysteries.v1.';
function disk() {
  const values = new Map();
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
}
const ids = ['mars-life', 'deep-ocean'];

test('来访不算读完，稍后读、三栏笔记与手动阅读标记分别保存', () => {
  const storage = disk(), store = createStore(storage, ids);
  store.visit(ids[0]);
  assert.equal(store.read(ids[0]).completed, false);
  store.toggle(ids[0], 'saved');
  store.saveNote(ids[0], 'observation', '岩石里有河道形状。');
  store.saveNote(ids[0], 'hypothesis', '我猜曾经有水。');
  store.toggle(ids[0], 'completed');
  const restored = createStore(storage, ids);
  assert.equal(restored.last(), ids[0]);
  assert.deepEqual(restored.read(ids[0]), {saved:true, completed:true, notes:{observation:'岩石里有河道形状。', hypothesis:'我猜曾经有水。', next:''}});
  restored.toggle(ids[0], 'completed');
  assert.equal(store.read(ids[0]).completed, false);
  assert.equal(store.read(ids[0]).saved, true);
});

test('两页更新不同字段，不覆盖另一页的笔记与标记', () => {
  const storage = disk(), first = createStore(storage, ids), second = createStore(storage, ids);
  first.saveNote(ids[0], 'observation', '第一条线索');
  second.toggle(ids[0], 'saved');
  first.saveNote(ids[0], 'next', '再查其他地点');
  second.saveNote(ids[1], 'observation', '深海照片');
  assert.deepEqual(first.read(ids[0]), {saved:true, completed:false, notes:{observation:'第一条线索', hypothesis:'', next:'再查其他地点'}});
  assert.equal(first.read(ids[1]).notes.observation, '深海照片');
});

test('存储被禁用或写满时保留本页笔记，不把失败报告为保存成功', () => {
  const denied = createStore({getItem(){throw Error('denied');}, setItem(){throw Error('denied');}}, ids);
  denied.saveNote(ids[0], 'next', '当前页的调查');
  denied.toggle(ids[0], 'saved');
  assert.equal(denied.available, false);
  assert.equal(denied.read(ids[0]).notes.next, '当前页的调查');
  const storage = disk(), store = createStore(storage, ids);
  store.saveNote(ids[0], 'observation', '旧记录');
  storage.setItem = () => {throw Error('quota');};
  store.saveNote(ids[0], 'hypothesis', '新猜想');
  store.toggle(ids[0], 'completed');
  assert.equal(store.available, false);
  assert.deepEqual(store.read(ids[0]).notes, {observation:'旧记录', hypothesis:'新猜想', next:''});
});

test('损坏数据、非法字段和过期案卷不会造成假完成或任意键写入', () => {
  const storage = disk(), store = createStore(storage, ids);
  storage.setItem(PREFIX + ids[0], '{');
  assert.equal(store.read(ids[0]).completed, false);
  storage.setItem(PREFIX + ids[0], JSON.stringify({saved:'true', completed:1, notes:{observation:7, next:'字'.repeat(2500)}}));
  assert.equal(store.read(ids[0]).saved, false);
  assert.equal(store.read(ids[0]).notes.observation, '');
  assert.equal(store.read(ids[0]).notes.next.length, 2000);
  store.saveNote('__proto__', 'next', '不要写入');
  store.saveNote(ids[0], '__proto__', '不要写入');
  store.visit('missing');
  storage.setItem(PREFIX + 'last', 'https://example.com');
  assert.equal(store.last(), '');
  assert.equal(storage.getItem(PREFIX + '__proto__'), null);
  store.saveNote(ids[0], 'hypothesis', '<img onerror=alert(1)>');
  assert.equal(store.read(ids[0]).notes.hypothesis, '<img onerror=alert(1)>');
});

test('多关键词、领域、素材与阅读状态组合筛选，空白笔记不算已记录', () => {
  const item = {search:'土星 SATURN 六边形 气流',category:'太空与信号',kinds:['animation','diagram']};
  const record = {saved:true,completed:false,notes:{observation:'  ',hypothesis:'',next:''}};
  assert.equal(matchesCase(item, {q:'ｓａｔｕｒｎ 气流',category:'太空与信号',kind:'animation',status:'saved'}, record), true);
  assert.equal(matchesCase(item, {q:'六边形 火星'}, record), false);
  assert.equal(matchesCase(item, {kind:'video'}, record), false);
  assert.equal(matchesCase(item, {status:'completed'}, record), false);
  assert.equal(matchesCase(item, {status:'notes'}, record), false);
  assert.equal(matchesCase(item, {status:'unread'}, record), true);
});

test('对照深链接只接受两份不同且仍存在的案卷', () => {
  assert.deepEqual(comparisonIds('missing,deep-ocean,deep-ocean,mars-life,extra', ids), ['deep-ocean','mars-life']);
  assert.deepEqual(comparisonIds(null, ids), []);
});
