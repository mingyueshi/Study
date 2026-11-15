const {test} = require('node:test');
const assert = require('node:assert/strict');
const {recordPrefix, createStore, createRound} = require('../content_sources/geo-map/animals-learning.js');
const animals = Array.from({length: 30}, (_, i) => ({id: `animal-${i}`}));
const ids = animals.map(item => item.id);
function disk() {
  const values = new Map();
  return {getItem: key => values.get(key), setItem: (key, value) => values.set(key, value)};
}

test('四张地图分别保存观察，同名 ID 互不影响且保留原有动物记录', () => {
  const storage = disk();
  storage.setItem('primary.animals.observed.v1.china.same-id', '1');
  const maps = [[undefined, undefined], [undefined, 'world'], ['plant', undefined], ['plant', 'world']];
  const stores = maps.map(([life, map]) => createStore(storage, recordPrefix(life, map), ['same-id']));
  assert.deepEqual(stores.map(store => store.count), [1, 0, 0, 0]);
  stores[2].toggle('same-id');
  stores[3].toggle('same-id');
  stores[2].toggle('same-id');
  assert.deepEqual(maps.map(([life, map]) => createStore(storage, recordPrefix(life, map), ['same-id']).count), [1, 0, 0, 1]);
});

test('观察记录刷新保留、可取消，中国与世界互不覆盖', () => {
  const storage = disk();
  const china = createStore(storage, 'china.', ids);
  china.toggle(ids[0]);
  assert.equal(createStore(storage, 'china.', ids).count, 1);
  assert.equal(createStore(storage, 'world.', ids).count, 0);
  china.toggle(ids[0]);
  assert.equal(createStore(storage, 'china.', ids).count, 0);
  storage.setItem('china.' + ids[1], 'true');
  china.toggle('unknown');
  assert.equal(createStore(storage, 'china.', ids).count, 0);
});

test('并行页面独立保存各项，跨标签页刷新记录', () => {
  const storage = disk();
  const first = createStore(storage, 'china.', ids);
  const second = createStore(storage, 'china.', ids);
  first.toggle(ids[0]); second.toggle(ids[1]);
  first.reload(); second.reload();
  assert.equal(first.count, 2);
  assert.equal(second.count, 2);
});

test('存储不可用或写满时保留本次观察，不误报持久保存', () => {
  const denied = createStore(null, 'china.', ids);
  denied.toggle(ids[0]);
  assert.equal(denied.count, 1);
  assert.equal(denied.available, false);
  const storage = disk();
  storage.setItem('china.' + ids[0], '1');
  const store = createStore(storage, 'china.', ids);
  storage.setItem = () => { throw Error('quota'); };
  store.toggle(ids[1]); store.reload();
  assert.equal(store.count, 2);
  assert.equal(store.available, false);
});

test('每轮最多五题且不重复，每题四个选项并含正确动物', () => {
  for (let i = 0; i < 30; i++) {
    const round = createRound(animals, animals);
    assert.equal(round.questions.length, 5);
    assert.equal(new Set(round.questions.map(q => q.animal.id)).size, 5);
    for (const question of round.questions) {
      assert.equal(new Set(question.options.map(item => item.id)).size, 4);
      assert.ok(question.options.includes(question.animal));
    }
  }
  assert.equal(createRound([], animals).finished, true);
  const narrow = createRound([animals[4], animals[4]], animals);
  assert.equal(narrow.questions.length, 1);
  assert.equal(narrow.current.animal.id, ids[4]);
});

test('只能提交一次，答完才能进入下一题，错题重练只含本轮错题', () => {
  const round = createRound(animals, animals);
  round.next();
  assert.equal(round.index, 0);
  assert.equal(round.answer('invalid'), false);
  const wrong = round.current.options.find(item => item !== round.current.animal);
  assert.equal(round.answer(wrong.id), true);
  assert.equal(round.answer(round.current.animal.id), false);
  round.next();
  while (!round.finished) {
    round.answer(round.current.animal.id);
    round.next();
  }
  assert.equal(round.score, 4);
  assert.equal(round.missed.length, 1);
  const retry = createRound(round.missed, animals);
  assert.deepEqual(retry.questions.map(q => q.animal.id), round.missed.map(item => item.id));
  round.next();
  assert.equal(round.index, 5);
  assert.equal(round.answer(ids[0]), false);
});
