const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createStore, selectRound, restoreRound} = require('../static/science/rumors-learning.js');
const {cases} = require('../content_sources/science-rumors.json');

function storage() {
  const values = new Map();
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
}

test('原有完成进度保留，判断改对后仍需迁移练习巩固', () => {
  const disk = storage();
  disk.setItem('primary.science-rumors.v1.magnets', '1');
  const store = createStore(disk);
  assert.equal(store.read('magnets').completed, true);
  store.judge('magnets', false);
  store.judge('magnets', true);
  assert.equal(store.read('magnets').review, true);
  store.practice('magnets', true);
  assert.equal(store.read('magnets').review, false);
  assert.equal(createStore(disk).read('magnets').completed, true);
  store.judge('magnets', false);
  assert.equal(store.read('magnets').quizDone, false);
});

test('迁移题与原任务进度分别记录，收藏和手记跨页面保留', () => {
  const disk = storage(), store = createStore(disk);
  store.bookmark('ice'); store.saveNote('ice', '先记录冰的位置。'); store.visit('ice');
  store.practice('ice', false); store.practice('ice', true);
  const restored = createStore(disk);
  assert.deepEqual(restored.read('ice'), {saved:true, review:false, quizDone:true, note:'先记录冰的位置。', completed:false});
  assert.equal(restored.last(), 'ice');
  assert.equal(restored.bookmark('ice'), false);
  restored.saveNote('ice', '字'.repeat(1200));
  assert.equal(restored.read('ice').note.length, 1000);
});

test('损坏与不完整记录不会产生假完成或执行手记中的文本', () => {
  const disk = storage();
  disk.setItem('primary.science-rumors.v2.ice', '{');
  assert.equal(createStore(disk).read('ice').note, '');
  disk.setItem('primary.science-rumors.v2.ice', JSON.stringify({saved:'true', review:1, note:7, completed:true}));
  assert.deepEqual(createStore(disk).read('ice'), {saved:false, review:false, quizDone:false, note:'', completed:false});
  const store = createStore(disk);
  store.saveNote('ice', '<script>这是一段手记</script>');
  assert.equal(createStore(disk).read('ice').note, '<script>这是一段手记</script>');
});

test('存储禁用或额度耗尽时仍能完成本轮，保留已读取的收藏和手记', () => {
  const denied = createStore({getItem(){throw Error('denied');}, setItem(){throw Error('denied');}});
  denied.judge('moon', true); denied.practice('moon', false);
  assert.equal(denied.available, false);
  assert.equal(denied.read('moon').completed, true);
  assert.equal(denied.read('moon').review, true);
  const disk = storage();
  const store = createStore(disk);
  store.bookmark('ice'); store.saveNote('ice', '旧手记');
  disk.setItem = () => {throw Error('quota');};
  store.practice('ice', false);
  assert.equal(store.available, false);
  assert.deepEqual(store.read('ice'), {saved:true, review:true, quizDone:false, note:'旧手记', completed:false});
  store.judge('ice', true);
  assert.equal(store.read('ice').completed, true);
});

test('随机轮次最多五道且不重复，复习不会混入其他任务', () => {
  for (let i=0; i<30; i++) {
    const round = selectRound(cases);
    assert.equal(round.ids.length, 5);
    assert.equal(new Set(round.ids).size, 5);
    assert.ok(round.ids.every(slug => cases.some(item => item.slug === slug)));
  }
  const pool = cases.slice(2,4);
  assert.deepEqual(new Set(selectRound([...pool, pool[0]]).ids), new Set(pool.map(item => item.slug)));
  assert.equal(selectRound([]), null);
});

test('刷新恢复待答、已答与结束状态，拒绝过期题目及非法轮次', () => {
  const round = {ids:cases.slice(0,2).map(item => item.slug), index:0, answers:[]};
  const restore = value => restoreRound(JSON.stringify(value), cases);
  assert.deepEqual(restore(round), round);
  round.answers.push(cases[0].challenge.answer);
  assert.deepEqual(restore(round), round);
  round.index = 1;
  assert.deepEqual(restore(round), round);
  round.answers.push(cases[1].challenge.answer); round.index = 2;
  assert.deepEqual(restore(round), round);
  for (const invalid of [null, {}, {...round,index:9}, {...round,ids:['missing']}, {...round,ids:['ice','ice']}, {...round,answers:['z','b']}, {...round,answers:[]}]) {
    assert.equal(restore(invalid), null);
  }
  assert.equal(restoreRound('{', cases), null);
});
