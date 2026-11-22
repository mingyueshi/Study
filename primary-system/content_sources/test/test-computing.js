/* ============================================================
   电脑与 AI 怎样工作数据测试
   运行：node test/test-computing.js
   验证五站结构、图示注册、二进制换算、排序步骤、二分查找、
   分类器训练与考试口径。
   ============================================================ */
'use strict';
const COMPUTING = require('../computing-data.js');
const LABS = require('../computing-labs-data.js');
const FIGS = require('../computing-figures.js');
const {bitsToNumber, numberToBits, bubbleSortSteps, selectionSortSteps, binarySearchSteps,
  classifyAll, accuracyOf, bestThreshold, examFruit} = require('../computing-labs.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 站点与知识点结构 ---------- */
console.log('— 站点与知识点结构 —');
const EXPECT_IDS = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5'];
const EXPECT_NAMES = ['比特与开关', '指令与程序', '算法思维', '数据与模型', '网络与信息真伪'];
check(Array.isArray(COMPUTING.units) && COMPUTING.units.length === 5, '应有 5 个站点，实际 ' + (COMPUTING.units || []).length);
check(isStr(COMPUTING.textbook), '缺少 textbook');
check(isStr(COMPUTING.edition), '缺少 edition');

const seenPoints = new Set();
COMPUTING.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 站点顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 站点名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五'[i] + '站', tag + ' 编号应为第' + '一二三四五'[i] + '站');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(FIGS.has(u.banner), tag + ' 横幅未注册: ' + u.banner);
  check(isStr(u.intro), tag + ' 缺少站点导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以站点 id 为前缀');
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
for (const fig of ['cp-binary-lab', 'cp-sort-lab', 'cp-search-lab', 'cp-classify-lab']) {
  check(COMPUTING.units.some(u => u.points.some(p => p.fig === fig)), fig + ' 应挂在一个知识点上');
}

/* ---------- 计算机速查 ---------- */
console.log('— 计算机速查 —');
check(Array.isArray(COMPUTING.facts) && COMPUTING.facts.length >= 4, '计算机速查至少 4 组');
COMPUTING.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});

/* ---------- 实验台数据 ---------- */
console.log('— 实验台数据 —');
check(LABS.binary.width === 8, '二进制台应为 8 位开关');
check(isStr(LABS.binary.note) && /比特/.test(LABS.binary.note), '二进制台说明应提到比特');
check(LABS.sort.bars === 8 && LABS.sort.maxValue === 10, '排序台应为 8 根柱、值域 1～10');
check(LABS.sort.algorithms.map(a => a.id).join(',') === 'bubble,selection', '排序台应有冒泡与选择两种算法');
check(LABS.search.min === 1 && LABS.search.max === 100, '二分台范围应为 1～100');
check(LABS.classify.examCount === 5, '分类器考试应为 5 个新果子');
check(Array.isArray(LABS.classify.training) && LABS.classify.training.length === 12, '训练果子应为 12 个');
const labels = LABS.classify.training.map(f => f.label);
check(labels.every(l => l === 'apple' || l === 'lemon'), '训练果子标签只能是 apple/lemon');
check(labels.filter(l => l === 'apple').length === 6 && labels.filter(l => l === 'lemon').length === 6, '苹果柠檬应各 6 个');
check(LABS.classify.training.every(f => f.sweet >= 1 && f.sweet <= 10 && f.y >= 0 && f.y <= 1), '训练果子甜度与摆放高度越界');
check(isStr(LABS.classify.note) && /阈值/.test(LABS.classify.note), '分类器说明应提到阈值');

/* ---------- 纯计算校验 ---------- */
console.log('— 纯计算 —');
for (let n = 0; n <= 255; n++) {
  const back = bitsToNumber(numberToBits(n, 8));
  if (back !== n) throw new Error(`二进制往返失败：${n} → ${back}`);
}
check(bitsToNumber([1, 0, 1, 1]) === 11, '1011 应等于 11');
check(bitsToNumber(numberToBits(255, 8)) === 255, '八位全 1 应为 255');
check(bitsToNumber([0, 0, 0, 0]) === 0, '全 0 应为 0');

const sortedAsc = a => a.every((v, i) => i === 0 || a[i - 1] <= v);
[['bubble', bubbleSortSteps], ['selection', selectionSortSteps]].forEach(([name, gen]) => {
  for (const values of [[3, 1, 2], [5, 4, 3, 2, 1], [1, 2, 3], [7, 7, 1]]) {
    const steps = gen(values);
    const last = steps[steps.length - 1];
    check(last.kind === 'done' && sortedAsc(last.arr), name + ' 最终应升序: ' + values.join(','));
    check(steps.every(s => s.kind !== 'compare' || s.arr[s.i] !== undefined), name + ' 步骤索引合法');
  }
});
const bubbleFull = bubbleSortSteps([10, 9, 8, 7, 6, 5, 4, 3]);
const selectionFull = selectionSortSteps([10, 9, 8, 7, 6, 5, 4, 3]);
check(bubbleFull.filter(s => s.kind === 'compare').length >= selectionFull.filter(s => s.kind === 'compare').length,
  '最坏输入下冒泡比较次数不应少于选择');
check(binarySearchSteps(50, 100)[0].mid === 50, '目标 50 第一次就应猜中');
for (let t = 1; t <= 100; t++) {
  const steps = binarySearchSteps(t, 100);
  const last = steps[steps.length - 1];
  if (!(last.hit && last.mid === t && steps.length <= 7)) throw new Error(`二分失败：目标 ${t}，${steps.length} 轮`);
}
const worst = Math.max(...Array.from({length: 100}, (_, i) => binarySearchSteps(i + 1, 100).length));
check(worst === 7, '1～100 最坏情况应恰好 7 轮，实际 ' + worst);
check(classifyAll(LABS.classify.training, 6).every(f => f.predicted === f.label), '阈值 6 应把 12 个训练果子全分对');
check(accuracyOf(LABS.classify.training, 6) === 12, '阈值 6 的训练正确率应为 12/12');
check(bestThreshold(LABS.classify.training, 1, 10).correct === 12, '最佳阈值应可达全对');
check(accuracyOf(LABS.classify.training, 1) < 12, '阈值太低应分错（苹果落左边）');
const rng = () => 0.42;
for (let i = 0; i < 200; i++) {
  const a = examFruit('apple', rng), l = examFruit('lemon', rng);
  if (!(a.sweet >= 5 && a.sweet <= 10)) throw new Error('考试苹果甜度越界: ' + a.sweet);
  if (!(l.sweet >= 1 && l.sweet <= 7)) throw new Error('考试柠檬甜度越界: ' + l.sweet);
}
check(true, '考试果子甜度都在苹果 5～10、柠檬 1～7 内（有重叠区）');

/* ---------- 图示库渲染 ---------- */
console.log('— 图示库 —');
FIGS.FIG_IDS.forEach(id => {
  const html = FIGS.figHTML(id);
  check(html && html.length > 40, '图示渲染过短: ' + id);
});
check(FIGS.figHTML('不存在的图') === '', '未注册图示应返回空串');
/* 图示不应带未转义的尖括号文案（数据里的「」引号除外） */
check(!FIGS.figHTML('cp-verify').includes('foreignObject'), '查证图示应使用纯 SVG 文本');

console.log('');
if (fails) {
  console.error('❌ 计算乐园数据有 ' + fails + ' 处问题（断言 ' + checked + ' 项）');
  process.exit(1);
} else {
  console.log('✅ 全部通过（共断言 ' + checked + ' 项：5 站 21 知识点 + 速查 + 二进制往返 + 排序步骤 + 二分收敛 + 分类器口径）');
}
