const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const ctx = vm.createContext({ console, URL });
ctx.window = ctx;
const base = path.join(__dirname, '../static/study_topics/geo-map');
for (const file of ['china-learning-data', 'china-learning', 'china-learning-visual'])
  vm.runInContext(fs.readFileSync(path.join(base, file + '.js'), 'utf8'), ctx);
const D = ctx.GM_CHINA_LEARNING,
  L = ctx.GMChinaLearning,
  V = ctx.GMChinaLearningVisual;
test('阶梯按地理区域判定，高山与低盆地不因海拔阈值误分', () => {
  for (const [point, meters, step] of [
    [[88, 33], 4700, 1],
    [[94.5, 36.5], 2700, 1],
    [[86, 43], 6000, 2],
    [[104.1, 30.7], 400, 2],
    [[89, 42.8], -150, 2],
    [[116.5, 34], 50, 3],
    [[118, 27], 2100, 3],
    [[121, 24], 3800, 3],
  ])
    assert.equal(L.classifyStep(point, meters), step, JSON.stringify(point));
});
test('示意分界过渡带不强判，无高程、空坐标及越界输入不编造阶梯', () => {
  assert.equal(L.classifyStep(D.boundary23[5], 1500), 0);
  assert.equal(L.classifyStep([101.9, 29.6], 7500), 0, '贡嘎山附近属于横断山过渡带');
  for (const [point, meters] of [
    [null, 1000],
    [[0, 0], 10],
    [[100, 55], 1000],
    [[100, 30], null],
    [[100, 30], NaN],
  ])
    assert.equal(L.classifyStep(point, meters), null);
});
test('三级灯独立累计且只亮一次，查看参考位置锁定计分，重练保留历史灯', () => {
  const s = L.createSteps();
  assert.equal(s.guess([116.5, 34], 30).result, 'wrong');
  assert.equal(s.state().found.size, 0);
  s.reveal();
  assert.equal(s.guess([88, 33], 4700).result, 'revealed');
  assert.equal(s.state().found.size, 0);
  s.retry();
  assert.equal(s.guess([88, 33], 4700).result, 'correct');
  s.guess([88, 33], 4700);
  assert.equal(s.state().found.size, 1);
  s.select(2);
  s.guess([104.1, 30.7], 400);
  s.select(3);
  s.guess([116.5, 34], 30);
  assert.equal(s.state().found.size, 3);
  s.state().found.clear();
  assert.equal(s.state().found.size, 3);
});
test('水系拼图校验位移与目标，重复拖动不累计，参考答案不算独立拼好', () => {
  const p = L.createPuzzle();
  assert.equal(p.drop('yalong', 100, 100), 'wrong');
  assert.equal(p.drop('yalong', NaN, 0), 'wrong');
  assert.equal(p.slot('yalong', 'han'), 'wrong');
  assert.equal(p.drop('yalong', 10, 8), 'correct');
  assert.equal(p.drop('yalong', 0, 0), 'locked');
  p.reveal();
  assert.equal(p.state().placed, 1);
  assert.equal(p.state().complete, false);
  assert.equal(p.slot('han', 'han'), 'locked');
  p.restart();
  for (const piece of D.puzzle.pieces) assert.equal(p.slot(piece.id, piece.id), 'correct');
  assert.equal(p.state().complete, true);
  assert.equal(p.state().placed, 4);
});
test('关系题提示分两步，错答不掌握，揭示后需重新观察才可独立作答', () => {
  const q = L.createQuestions();
  q.hint();
  q.hint();
  q.hint();
  assert.equal(q.state().hints, 2);
  assert.equal(q.answer(2), 'wrong');
  assert.equal(q.state().found.size, 0);
  q.reveal();
  assert.equal(q.answer(0), 'locked');
  q.retry();
  assert.equal(q.answer(0), 'correct');
  assert.equal(q.answer(0), 'locked');
  assert.equal(q.state().found.size, 1);
  q.select(D.questions[1].id);
  assert.equal(q.state().hints, 0);
  assert.equal(q.state().found.size, 1);
});
test('新进度过滤旧 ID、重复、类型错误和损坏存储，不读取或覆盖旧侦探记录', () => {
  const p = L.readProgress(
    JSON.stringify({
      steps: [1, 1, 4, '2'],
      questions: [D.questions[0].id, D.questions[0].id, 'old'],
      puzzle: true,
    }),
  );
  assert.equal(p.steps.size, 1);
  assert.equal(p.questions.size, 1);
  assert.equal(p.puzzle, true);
  for (const raw of ['bad', 'null', '[]', '42', 'true']) {
    const p = L.readProgress(raw);
    assert.equal(p.steps.size, 0);
    assert.equal(p.questions.size, 0);
    assert.equal(p.puzzle, false);
  }
});
test('海拔柱的标记高度有限，正负海拔保留大小，改变倍率不会改写海拔数值', () => {
  for (const meters of [-6000, 0, 6000])
    for (const gain of [1, 50, 80])
      assert.ok(
        Number.isFinite(V.pinHeight(meters, gain, 91245.9)) && V.pinHeight(meters, gain, 91245.9) > 0,
      );
  assert.equal(V.pinHeight(6000, 50, 91245.9) / V.pinHeight(6000, 1, 91245.9), 50);
  assert.equal(V.pinHeight(-6000, 50, 91245.9), V.pinHeight(6000, 50, 91245.9));
});
test('双视口左右边缘与分界正确归一化，点击右半幅不会误用左半幅的高度倍率', () => {
  assert.equal(V.viewportPoint(0, 0, 1000, 600, true).x, -1);
  assert.equal(V.viewportPoint(500, 300, 1000, 600, true).panel, 1);
  assert.equal(V.viewportPoint(500, 300, 1000, 600, true).x, -1);
  assert.equal(V.viewportPoint(750, 300, 1000, 600, true).x, 0);
  assert.equal(V.viewportPoint(750, 300, 1000, 600, true).gain, 50);
  assert.equal(V.viewportPoint(250, 300, 1000, 600, true).gain, 1);
  assert.equal(V.viewportPoint(1000, 600, 1000, 600, true).x, 1);
  assert.equal(V.viewportPoint(500, 300, 1000, 600, false).x, 0);
  assert.equal(V.viewportPoint(-1, 0, 1000, 600, true), null);
  assert.equal(V.viewportPoint(0, 0, 0, 600, true), null);
});
