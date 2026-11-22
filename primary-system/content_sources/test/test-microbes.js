/* ============================================================
   微生物（看不见的世界）数据测试
   运行：node test/test-microbes.js
   验证五个微生物室结构、图示注册、尺度缩放数据与挑战题记录口径。
   ============================================================ */
'use strict';
const MICROBES = require('../microbes-data.js');
const FIGS = require('../microbes-figures.js');
const SCALE = require('../microbe-scale-data.js');
const { levelRatios, cleanProgress } = require('../microbe-scale.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 微生物室与知识点结构 ---------- */
console.log('— 微生物室与知识点结构 —');
const EXPECT_IDS = ['mm1', 'mm2', 'mm3', 'mm4', 'mm5'];
const EXPECT_NAMES = ['微生物家族', '看得见的尺度', '发酵厨房', '免疫与疫苗', '健康习惯室'];
check(Array.isArray(MICROBES.units) && MICROBES.units.length === 5, '应有 5 个微生物室，实际 ' + (MICROBES.units || []).length);
check(isStr(MICROBES.textbook), '缺少 textbook');
check(isStr(MICROBES.edition), '缺少 edition');

const seenPoints = new Set();
MICROBES.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 微生物室顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 微生物室名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五'[i] + '室', tag + ' 编号应为第' + '一二三四五'[i] + '室');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(FIGS.has(u.banner), tag + ' 横幅未注册: ' + u.banner);
  check(isStr(u.intro), tag + ' 缺少微生物室导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以微生物室 id 为前缀');
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
check(MICROBES.units.some(u => u.points.some(p => p.fig === 'microbe-scale-lab')), '尺度缩放台应挂在一个知识点上');
check(MICROBES.units.some(u => u.points.some(p => p.fig === 'microbe-handwash')), '洗手公平比较台应挂在一个知识点上');
check(MICROBES.units.some(u => u.points.some(p => /发酵|酵母|酸奶|酿造/.test(p.title))), '发酵内容应独立成课');

/* 内容安全：发酵与酿造必须提示家庭安全边界 */
const brewing = MICROBES.units.flatMap(u => u.points).find(p => p.id === 'mm3-4');
check(/不做|正规/.test(brewing.overview + brewing.items.join('') + brewing.example.steps + brewing.mistakes.join('')), '酿造课必须提示家庭自酿风险');

/* ---------- 微生物速查 ---------- */
console.log('— 微生物速查 —');
check(Array.isArray(MICROBES.facts) && MICROBES.facts.length >= 4, '微生物速查至少 4 组');
MICROBES.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});

/* ---------- 尺度缩放台数据 ---------- */
console.log('— 尺度缩放台 —');
check(isStr(SCALE.scaleNote), '缩放台缺少说明');
check(Array.isArray(SCALE.levels) && SCALE.levels.length === 5, '应有 5 个缩放级别，实际 ' + (SCALE.levels || []).length);
const levelIds = SCALE.levels.map(l => l.id);
check(new Set(levelIds).size === levelIds.length, '缩放级别 id 重复');
check(levelIds.join(',') === 'hair,cell,bacteria,virus,molecule', '级别顺序应为 头发→细胞→细菌→病毒→水分子');
SCALE.levels.forEach(l => {
  check(isStr(l.id) && isStr(l.name) && isStr(l.address), '级别缺少 id/名称/地址: ' + (l.id || '?'));
  check(isStr(l.sizeLabel) && isStr(l.tool), '级别缺少尺寸或工具: ' + (l.id || '?'));
  check(isStr(l.text) && isStr(l.compare), '级别缺少正文或比较: ' + (l.id || '?'));
  check(/^#lesson-/.test(l.link) && isStr(l.linkLabel), '级别回链应是课文锚点: ' + (l.id || '?'));
});
/* 挑战题：选项、答案、解释与课文回链 */
check(Array.isArray(SCALE.challenges) && SCALE.challenges.length >= 5, '挑战题至少 5 道');
const seenQ = new Set();
SCALE.challenges.forEach(q => {
  check(!seenQ.has(q.id), '挑战题 id 重复: ' + q.id);
  seenQ.add(q.id);
  check(isStr(q.question) && Array.isArray(q.options) && q.options.length >= 2 && q.options.every(isStr), '挑战题干或选项不完整: ' + q.id);
  check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, '答案越界: ' + q.id);
  check(isStr(q.explanation), '缺少解析: ' + q.id);
  check(/^#lesson-/.test(q.link), '挑战题回链应是课文锚点: ' + q.id);
});
/* 级宽基准能算出倍率（镜像宇宙地址的数量级语言） */
const ratios = levelRatios(SCALE.levels);
check(ratios.every(n => n >= 1 && Number.isFinite(n)), '相邻级倍率应有效: ' + ratios.join('/'));
check(ratios[1] >= 10 && ratios[2] >= 10, '细胞→细菌→病毒应跨数量级: ' + ratios.join('/'));

/* 记录口径与天文挑战一致：first/last 只在合法选项内保留 */
check(cleanProgress(null, SCALE.challenges) && Object.keys(cleanProgress(null, SCALE.challenges)).length === 0, '空进度应清理为空对象');
check(cleanProgress({bad: {first: 99, last: -1}}, SCALE.challenges) && !cleanProgress({bad: {first: 99, last: -1}}, SCALE.challenges).bad, '越界进度应被丢弃');

/* ---------- 图示库渲染 ---------- */
console.log('— 图示库 —');
FIGS.FIG_IDS.forEach(id => {
  const html = FIGS.figHTML(id);
  check(html && html.length > 40, '图示渲染过短: ' + id);
});
check(FIGS.figHTML('不存在的图') === '', '未注册图示应返回空串');

console.log('');
if (fails) {
  console.error('❌ 微生物数据有 ' + fails + ' 处问题（断言 ' + checked + ' 项）');
  process.exit(1);
} else {
  console.log('✅ 全部通过（共断言 ' + checked + ' 项：5 室 21 知识点 + 速查 + 5 级缩放 + 挑战题）');
}
