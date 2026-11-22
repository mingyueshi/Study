/* ============================================================
   概率与统计乐园数据测试
   运行：node test/test-probability.js
   验证五个乐园结构、图示注册、两骰组合数、模拟收敛与查证题记录口径。
   ============================================================ */
'use strict';
const PROBABILITY = require('../probability-data.js');
const LABS = require('../probability-labs-data.js');
const FIGS = require('../probability-figures.js');
const {rollDie, rollSum, applyRolls, piEstimate, cleanProgress} = require('../probability-labs.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 乐园与知识点结构 ---------- */
console.log('— 乐园与知识点结构 —');
const EXPECT_IDS = ['ps1', 'ps2', 'ps3', 'ps4', 'ps5'];
const EXPECT_NAMES = ['随机与可能', '实验出真知', '频率与概率', '数据会说话', '误区粉碎机'];
check(Array.isArray(PROBABILITY.units) && PROBABILITY.units.length === 5, '应有 5 个乐园，实际 ' + (PROBABILITY.units || []).length);
check(isStr(PROBABILITY.textbook), '缺少 textbook');
check(isStr(PROBABILITY.edition), '缺少 edition');

const seenPoints = new Set();
PROBABILITY.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 乐园顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 乐园名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五'[i] + '乐园', tag + ' 编号应为第' + '一二三四五'[i] + '乐园');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(FIGS.has(u.banner), tag + ' 横幅未注册: ' + u.banner);
  check(isStr(u.intro), tag + ' 缺少乐园导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以乐园 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 想一想不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
  });
});
check(seenPoints.size === 21, '全册应为 21 个知识点，实际 ' + seenPoints.size);
for (const fig of ['prob-dice-lab', 'prob-survey-lab', 'prob-pi-lab', 'prob-myth-quiz']) {
  check(PROBABILITY.units.some(u => u.points.some(p => p.fig === fig)), fig + ' 应挂在一个知识点上');
}

/* ---------- 概率速查 ---------- */
console.log('— 概率速查 —');
check(Array.isArray(PROBABILITY.facts) && PROBABILITY.facts.length >= 4, '概率速查至少 4 组');
PROBABILITY.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});

/* ---------- 实验台数据 ---------- */
console.log('— 实验台数据 —');
check(isStr(LABS.dice.note) && /随机数/.test(LABS.dice.note), '掷骰台应说明使用浏览器随机数');
check(LABS.dice.modes.length === 2 && LABS.dice.modes.map(m => m.id).join(',') === 'one,two', '掷骰台应有一枚与两枚两种模式');
const two = LABS.dice.modes[1];
check(two.faces.join(',') === '2,3,4,5,6,7,8,9,10,11,12', '两骰模式应为和 2 到 12');
const comboCounts = [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1];
check(comboCounts.reduce((a, b) => a + b, 0) === 36, '两骰组合数总和应为 36');
two.faces.forEach(sum => {
  const theory = two.theory(sum);
  check(Math.abs(theory * 36 - comboCounts[sum - 2]) < 1e-9, '和 ' + sum + ' 的理论值应等于组合数/36');
});
check(Math.abs(two.theory(7) - 6 / 36) < 1e-12 && Math.abs(two.theory(2) - 1 / 36) < 1e-12, '7 应为 6/36，2 应为 1/36');

check(LABS.survey.templates.length === 3, '调查应有三套题目模板');
LABS.survey.templates.forEach(t => {
  check(isStr(t.question) && t.options.length === 4 && t.options.every(o => isStr(o.id) && isStr(o.name)), '调查模板不完整: ' + (t.id || '?'));
  const ids = t.options.map(o => o.id);
  check(new Set(ids).size === ids.length, '调查选项 id 重复: ' + t.id);
});

check(Array.isArray(LABS.pi.batches) && LABS.pi.batches.length === 3, '估 π 台应有三档撒点');
check(LABS.pi.drawCap >= 1000 && LABS.pi.truth > 3.14 && LABS.pi.truth < 3.142, '估 π 台参数不正确');

/* ---------- 模拟计算校验 ---------- */
console.log('— 模拟计算 —');
let seed = 20261123;
const rng = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
for (let i = 0; i < 200; i++) {
  const d = rollDie(rng);
  if (!(d >= 1 && d <= 6 && Number.isInteger(d))) throw new Error('骰子越界: ' + d);
  const s = rollSum(rng);
  if (!(s >= 2 && s <= 12)) throw new Error('和越界: ' + s);
}
check(true, '单骰与两骰结果都在合法范围内');
const oneCounts = new Array(6).fill(0);
applyRolls(oneCounts, 6000, 'one', rng);
const oneTotal = oneCounts.reduce((a, b) => a + b, 0);
check(oneTotal === 6000, '掷 6000 次应累计 6000 次');
check(oneCounts.every(c => c / 6000 > 0.14 && c / 6000 < 0.20), '单骰各面频率应靠近 1/6: ' + oneCounts.map(c => (c / 60).toFixed(1) + '%').join(' '));
const twoCounts = new Array(11).fill(0);
applyRolls(twoCounts, 60000, 'two', rng);
const p7 = twoCounts[5] / 60000;
check(Math.abs(p7 - 6 / 36) < 0.01, '两骰 P(7) 应靠近 6/36≈16.7%: ' + (p7 * 100).toFixed(2) + '%');
check(Math.abs(piEstimate(785, 1000) - 3.14) < 1e-9 && piEstimate(0, 0) === 0, 'π 估算公式应为 4×圆内/总数');
check(Object.keys(cleanProgress({x: {first: 9, last: -1}}, [{id: 'x', options: [1, 2]}])).length === 0, '越界查证记录应被丢弃');

/* ---------- 查证题 ---------- */
console.log('— 反直觉查证题 —');
check(Array.isArray(LABS.myths.questions) && LABS.myths.questions.length === 6, '查证题应为 6 道');
const seenQ = new Set();
LABS.myths.questions.forEach(q => {
  check(!seenQ.has(q.id), '查证题 id 重复: ' + q.id);
  seenQ.add(q.id);
  check(isStr(q.question) && Array.isArray(q.options) && q.options.length === 3 && q.options.every(isStr), '查证题干或选项不完整: ' + q.id);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, '答案越界: ' + q.id);
  check(isStr(q.explanation), '缺少解析: ' + q.id);
  check(/^#lesson-/.test(q.link), '查证题回链应是课文锚点: ' + q.id);
});
/* 反直觉题必须覆盖核心误区 */
for (const id of ['coin-streak', 'two-dice', 'lottery', 'average']) {
  check(seenQ.has(id), '查证题应覆盖误区: ' + id);
}

/* ---------- 图示库渲染 ---------- */
console.log('— 图示库 —');
FIGS.FIG_IDS.forEach(id => {
  const html = FIGS.figHTML(id);
  check(html && html.length > 40, '图示渲染过短: ' + id);
});
check(FIGS.figHTML('不存在的图') === '', '未注册图示应返回空串');

console.log('');
if (fails) {
  console.error('❌ 概率乐园数据有 ' + fails + ' 处问题（断言 ' + checked + ' 项）');
  process.exit(1);
} else {
  console.log('✅ 全部通过（共断言 ' + checked + ' 项：5 园 21 知识点 + 速查 + 两骰组合 + 模拟收敛 + 查证题）');
}
