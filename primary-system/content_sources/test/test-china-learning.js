const assert = require('node:assert/strict');
global.window = {};
for (const file of ['content', 'china-hydrology-data', 'china-hydrology-geo', 'china-learning-data'])
  require('../geo-map/' + file + '.js');
const D = window.GM_CHINA_LEARNING,
  branches = new Set(window.GM_CHINA_HYDROLOGY.tributaries.map((b) => b.id));
const rivers = new Set(window.GM_CHINA_HYDROLOGY.basins.map((b) => b.feature));
const point = (p) =>
  Array.isArray(p) &&
  p.length === 2 &&
  p.every(Number.isFinite) &&
  p[0] >= 73 &&
  p[0] <= 136 &&
  p[1] >= 18 &&
  p[1] <= 54;
const prose = (s) => assert.ok(typeof s === 'string' && s.trim() && !/["';\r\n]/.test(s), s);
assert.equal(D.steps.length, 3);
assert.equal(new Set(D.steps.map((s) => s.no)).size, 3);
for (const s of D.steps) {
  assert.ok([1, 2, 3].includes(s.no));
  prose(s.name);
  prose(s.hint);
  assert.ok(point(s.example));
}
for (const ring of [D.firstStep, D.boundary12, D.boundary23])
  assert.ok(ring.length >= 5 && ring.every(point));
assert.deepEqual(D.firstStep.slice(0, D.boundary12.length), D.boundary12);
assert.ok(D.transitionKm >= 10 && D.transitionKm <= 60);
assert.equal(D.puzzle.pieces.length, 4);
assert.equal(new Set(D.puzzle.pieces.map((p) => p.id)).size, 4);
for (const p of D.puzzle.pieces) {
  assert.ok(branches.has(p.branch));
  assert.equal(window.GM_CHINA_HYDROLOGY.tributaries.find((b) => b.id === p.branch).river, D.puzzle.river);
  prose(p.name);
  prose(p.text);
  assert.ok(window.GM_CHINA_HYDROLOGY_GEO.tributaries[p.branch].paths.length);
}
assert.equal(D.puzzle.river, 'f20');
assert.ok(D.puzzle.snapPixels >= 15 && D.puzzle.snapPixels <= 50);
assert.ok(D.questions.length >= 5 && new Set(D.questions.map((q) => q.id)).size === D.questions.length);
for (const q of D.questions) {
  prose(q.title);
  prose(q.prompt);
  prose(q.explanation);
  assert.equal(q.options.length, 3);
  q.options.forEach(prose);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 3);
  assert.equal(q.hints.length, 2);
  q.hints.forEach(prose);
  assert.ok(point(q.point));
  assert.ok(q.zoom >= 1 && q.zoom <= 8);
  if (q.river) assert.ok(rivers.has(q.river));
  assert.ok(q.sources.length);
  q.sources.forEach((s) => assert.match(s, /^https:\/\//));
}
['stepNote', 'pinNote', 'compareNote', 'puzzleNote'].forEach((k) => prose(D[k]));
assert.ok(D.sources.length);
for (const source of D.sources) { prose(source.name); assert.match(source.url, /^https:\/\//); }
console.log('地图教学玩法的数据、地理口径和稳定引用校验通过');
