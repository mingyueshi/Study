const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = name => fs.readFileSync(path.join(__dirname, '../static/questionbank', name), 'utf8');
function field() { return {value: '', textContent: '', innerHTML: '', handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; }}; }
function leaderboard({scope = 'guest', storage = new Map(), blocked = false} = {}) {
  const fields = {};
  const get = selector => fields[selector] || (fields[selector] = field());
  const root = {dataset: {scope, size: '10', mode: 'challenge'}, querySelector: get};
  const window = {addEventListener() {}};
  vm.runInNewContext(source('olympiad.js'), {
    document: {querySelector: () => root}, window,
    localStorage: {getItem(key) { if (blocked) throw Error('blocked'); return storage.get(key); },
      setItem(key, value) { if (blocked) throw Error('blocked'); storage.set(key, value); }},
  });
  return {get, record: window.OlympiadChallenge.record, duration: window.OlympiadChallenge.duration, storage};
}
const round = (id, extra = {}) => ({id, tag: '', total: 10, correct: 8, elapsedMs: 60000,
  hintsUsed: 0, mode: 'challenge', completedAt: '2026-11-17T02:00:00Z', ...extra});
const entries = page => JSON.parse(page.storage.get('primary-olympiad-ranks-v1:guest') || '[]');

test('rank compares correct answers before time and separates types, sizes and modes', () => {
  const page = leaderboard();
  page.record(round('fast', {correct: 7, elapsedMs: 10000}));
  page.record(round('slower'));
  const rank = page.record(round('best', {elapsedMs: 50000, hintsUsed: 2}));
  assert.equal(rank.rank, 1);
  const html = page.get('[data-qb-rank-list]').innerHTML;
  assert.ok(html.indexOf('50 秒') < html.indexOf('1 分 0 秒'));
  assert.match(html, /2 题看过提示/);
  for (const extra of [{tag: '速算巧算'}, {total: 5, correct: 5}, {mode: 'wrong'}]) {
    const result = page.record(round(JSON.stringify(extra), extra));
    assert.equal(result.rank, 1);
    assert.equal((page.get('[data-qb-rank-list]').innerHTML.match(/<li /g) || []).length, 1);
  }
});

test('completed rounds persist on reload, deduplicate, retain the best ten and isolate accounts', () => {
  const page = leaderboard();
  for (let i = 0; i < 12; i++) page.record(round('round-' + i, {elapsedMs: 10000 + i * 1000}));
  assert.equal(entries(page).length, 10);
  assert.equal(entries(page).some(row => row.id === 'round-11'), false);
  page.record(round('round-0', {elapsedMs: 10000}));
  assert.equal(entries(page).length, 10);
  assert.match(leaderboard({storage: page.storage}).get('[data-qb-rank-list]').innerHTML, /答对 8／10 题/);
  const account = leaderboard({storage: page.storage, scope: 'user-2'});
  assert.match(account.get('[data-qb-rank-status]').textContent, /还没有成绩/);
  account.record(round('private'));
  assert.equal(entries(page).length, 10);
});

test('corrupt or disabled browser storage and invalid records preserve normal practice', () => {
  const storage = new Map([['primary-olympiad-ranks-v1:guest', '{broken']]);
  const page = leaderboard({storage});
  assert.equal(page.record(round('fixed')).saved, true);
  assert.equal(entries(page).length, 1);
  page.record(round('invalid', {correct: 11}));
  page.record(round('negative', {elapsedMs: -1}));
  assert.equal(entries(page).length, 1);
  const blocked = leaderboard({blocked: true});
  assert.equal(blocked.record(round('cannot-save')).saved, false);
  assert.match(blocked.get('[data-qb-rank-status]').textContent, /仍可正常练习/);
  assert.equal(blocked.duration(61001), '1 分 2 秒');
});
