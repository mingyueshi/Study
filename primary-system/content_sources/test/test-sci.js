/* ============================================================
   科学实验室数据测试
   运行：node test/test-sci.js
   验证八大科学实验室结构、字段完整、图示注册、内容安全。
   ============================================================ */
'use strict';
const SCI = require('../sci-data.js');
const FIGS = require('../sci-figures.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 总体结构 ---------- */
console.log('— 实验室与知识点结构 —');
check(Array.isArray(SCI.units) && SCI.units.length === 8, '应有 8 个科学实验室，实际 ' + (SCI.units || []).length);
check(isStr(SCI.textbook), '缺少 textbook');
check(isStr(SCI.edition), '缺少 edition');

const EXPECT_IDS = ['su1', 'su2', 'su3', 'su4', 'su5', 'su6', 'su7', 'su8'];
const EXPECT_NAMES = ['走进科学', '物质与变化', '力与运动', '光与声', '电与磁', '生命世界', '地球家园', '技术与工程'];
const seenPoints = new Set();
const unitNames = new Set();
SCI.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 实验室顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 实验室名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五六七八'[i] + '实验室', tag + ' 编号应为第' + '一二三四五六七八'[i] + '实验室');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(isStr(u.intro), tag + ' 缺少实验室导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');
  unitNames.add(u.name);

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以实验室 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 想一想不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
  });
});
check(seenPoints.size === 39, '全册应为 39 个知识点，实际 ' + seenPoints.size);

/* ---------- 科学速查与科学小诊所 ---------- */
console.log('— 科学速查与科学小诊所 —');
check(Array.isArray(SCI.facts) && SCI.facts.length >= 4, '科学速查至少 4 组');
SCI.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});
check(Array.isArray(SCI.mistakes) && SCI.mistakes.length >= 10, '科学小诊所至少 10 条');
SCI.mistakes.forEach(m => {
  check(isStr(m.unit) && isStr(m.wrong) && isStr(m.right), '易错条目不完整: ' + JSON.stringify(m));
  check(unitNames.has(m.unit), '易错条目的实验室名不在科学实验室中: ' + m.unit);
});

/* ---------- 关键内容覆盖 ---------- */
console.log('— 关键内容覆盖 —');
const allText = JSON.stringify(SCI);
['科学探究', '三态', '占据空间', '溶解', '摩擦力', '杠杆', '直线传播', '串联', '磁极', '电磁铁',
  '光合作用', '食物链', '水循环', '工程设计', '袁隆平', '北斗']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, path) {
  if (typeof v === 'string') {
    /* 科学内容允许全角符号与数字区间，只拦截形如标签的 <字母 */
    check(!/<[a-zA-Z/]/.test(v), path + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/"|\n/.test(v), path + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, path + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k));
  }
}
walk(SCI.units, 'units');
walk(SCI.facts, 'facts');
walk(SCI.mistakes, 'mistakes');

/* ---------- 图示库 ---------- */
console.log('— 科学图示库 —');
check(FIGS.FIG_IDS.length >= 14, '图示库应有 14 个以上图示，实际 ' + FIGS.FIG_IDS.length);
check(FIGS.has('demo-sci-states'), '缺少三态变化互动演示图示');
check(FIGS.has('demo-sci-circuit'), '缺少电路互动演示图示');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 实验室 39 知识点 + 速查 + 小诊所 + 图示库）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
