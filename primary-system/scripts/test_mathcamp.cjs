const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../static/mathcamp/engine.js');
const data = require('../mathcamp/data/camp.json');
const tracks = Object.fromEntries(data.tracks.map(t => [t.id, t]));
const drills = data.tracks.flatMap(t => t.drills), ids = drills.map(d => d.id);
const answer = d => (d.puzzle.solution || (Array.isArray(d.puzzle.answer) ? d.puzzle.answer : [d.puzzle.answer])).map(String);
const empty = d => d.kind === 'logic' ? d.puzzle.labels.map(() => '') : ['sudoku', 'magic'].includes(d.kind) ? d.puzzle.givens.map(g => g ? String(g) : '') : answer(d).map(() => '');

test('十五关参考解均满足规则，未填写不计完成', () => {
  for (const d of drills) {
    assert.equal(E.check(d, answer(d)).complete, true, d.id);
    assert.equal(E.check(d, empty(d)).complete, false, d.id);
    assert.ok(E.check(d, empty(d)).remaining > 0, d.id);
  }
});
test('整数输入兼容全角，拒绝小数、指数、溢出与混入字符', () => {
  assert.equal(E.integer(' １２３ '), 123); assert.equal(E.integer(''), null);
  for (const s of ['1.5', '1e2', '-2', '三', '2abc', 'Infinity', '9007199254740993']) assert.ok(Number.isNaN(E.integer(s)), s);
  const d = tracks.sudoku.drills[0], raw = empty(d), i = raw.indexOf('');
  for (const s of ['0', '5', 'NaN']) { raw[i] = s; assert.ok(E.check(d, raw).conflicts.includes(i)); }
});
test('逻辑题逐条约束且必须一一对应；每关唯一', () => {
  const permutations = arr => arr.length ? arr.flatMap((v, i) => permutations(arr.filter((_, j) => i !== j)).map(p => [v, ...p])) : [[]];
  for (const d of tracks.logic.drills) {
    const valid = permutations(d.puzzle.labels.map((_, i) => i)).filter(p => E.check(d, p.map(String)).complete);
    assert.deepEqual(valid, [d.puzzle.solution]);
    const raw = answer(d); raw[0] = raw[1]; assert.equal(E.check(d, raw).complete, false);
  }
});
test('逻辑顺序、不相邻与未确定线索分别处理', () => {
  const d = tracks.logic.drills[2];
  assert.deepEqual(E.check(d, ['', '', '', '']).clues, [null, null, null]);
  const r = E.check(d, ['2', '1', '0', '3']);
  assert.equal(r.clues[1], true); assert.equal(r.clues[2], false);
});
test('数独检查独立的宫限制，不能只检查拉丁方的行列', () => {
  const d = structuredClone(tracks.sudoku.drills[0]); d.puzzle.givens.fill(0);
  const latin = [1,2,3,4,2,3,4,1,3,4,1,2,4,1,2,3].map(String);
  const r = E.check(d, latin);
  assert.equal(r.complete, false); assert.ok(r.errors.some(s => s.includes('宫')));
  assert.ok(!r.errors.some(s => /行|列/.test(s)));
});
test('数独不把无直接冲突的半成品判为完成，题设不可篡改', () => {
  for (const d of tracks.sudoku.drills) {
    const r = E.check(d, empty(d)); assert.equal(r.conflicts.length, 0); assert.ok(r.remaining);
    const raw = answer(d), i = d.puzzle.givens.findIndex(Boolean); raw[i] = '';
    assert.equal(E.check(d, raw).complete, false); assert.ok(E.check(d, raw).errors.includes('题设数字不能修改。'));
  }
});
test('候选数是行列宫允许集合的交集，并随填写变化', () => {
  const p = {size:4,box_rows:2,box_cols:2,givens:[]};
  const raw = ['1','','3','4','3','4','1','2','2','1','4','3','4','3','2','1'];
  assert.deepEqual(E.candidates(p, raw)[1], [2]);
  raw[1] = '2'; assert.deepEqual(E.candidates(p, raw)[1], []);
  const groups = E.units(6,2,3); assert.equal(groups.length,18);
  assert.deepEqual(groups[12].cells,[0,1,2,6,7,8]);
});
test('幻方校验两条对角线，接受参考解之外的合法摆法', () => {
  const d = structuredClone(tracks.magic.drills[0]); d.puzzle.givens.fill(0);
  const bad = E.check(d, [1,5,9,6,7,2,8,3,4].map(String));
  assert.equal(bad.complete,false); assert.equal(bad.totals.filter(t => t.sum!==t.target).length,2);
  const real = tracks.magic.drills[1];
  assert.equal(E.check(real,[8,3,4,1,5,9,6,7,2].map(String)).complete,true);
});
test('幻方数字全局不重复，四阶目标为三十四', () => {
  const d=structuredClone(tracks.magic.drills[2]);d.puzzle.givens.fill(0);
  const raw=answer(d);raw[0]=raw[1];assert.equal(E.check(d,raw).complete,false);
  assert.ok(E.check(d,raw).errors.some(s=>s.includes('只能使用一次')));
  assert.ok(E.check(d,answer(d)).totals.every(t=>t.sum===34));
});
test('找规律按声明模型生成正确后续，不能交换两项', () => {
  const expected=[[17,20],[36,49],[8,40]];
  tracks.patterns.drills.forEach((d,i)=>{
    assert.deepEqual(d.puzzle.answer,expected[i]);
    assert.equal(E.check(d,expected[i].toReversed().map(String)).complete,false);
    assert.equal(E.check(d,[String(expected[i][0])]).complete,false);
  });
});
test('巧算示例的独立算术结果与答案一致', () => {
  assert.equal(tracks.mental.drills[0].puzzle.answer,398+247+602+753);
  assert.equal(tracks.mental.drills[1].puzzle.answer,37*99+37);
  assert.equal(tracks.mental.drills[2].puzzle.answer,Array.from({length:100},(_,i)=>i+1).reduce((a,b)=>a+b));
  for (const d of tracks.mental.drills)assert.equal(E.check(d,[String(d.puzzle.answer+1)]).complete,false);
});
test('完成标记只接受已发布 ID 和合法状态，不信任损坏存储', () => {
  assert.deepEqual(E.cleanProgress(null,ids),{});assert.deepEqual(E.cleanProgress([],ids),{});
  assert.deepEqual(E.cleanProgress({[ids[0]]:'independent',unknown:'independent',[ids[1]]:'done',[ids[2]]:true},ids),{[ids[0]]:'independent'});
});
test('合并其他标签页结果时保留自主完成，借助提示不会覆盖已有自主标记', () => {
  const result=E.mergeProgress({[ids[0]]:'independent',[ids[1]]:'assisted'},{[ids[0]]:'assisted',[ids[2]]:'assisted'},ids);
  assert.deepEqual(result,{[ids[0]]:'independent',[ids[1]]:'assisted',[ids[2]]:'assisted'});
  assert.deepEqual(E.mergeProgress(result,{[ids[1]]:'independent'},ids)[ids[1]],'independent');
});
