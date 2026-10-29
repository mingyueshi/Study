/* ============================================================
   数学知识点数据测试
   运行：node test/test-math-knowledge.js
   验证单元/知识点结构与新修订教材目录一致、字段完整、内容安全。
   ============================================================ */
'use strict';
const MKB = require('../math-data.js');
const FIGS = require('../figures.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 总体结构 ---------- */
console.log('— 单元与知识点结构 —');
check(Array.isArray(MKB.units) && MKB.units.length === 10, '应有 10 个板块（8 单元 + 编码 + 数学好玩），实际 ' + (MKB.units || []).length);
check(isStr(MKB.textbook), '缺少 textbook');
check(isStr(MKB.edition), '缺少 edition');

const EXPECT_IDS = ['mu1', 'mcode', 'mu2', 'mu3', 'mu4', 'mu5', 'mplay', 'mu6', 'mu7', 'mu8'];
const seenPoints = new Set();
MKB.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 板块顺序应为 ' + EXPECT_IDS[i]);
  check(isStr(u.no) && u.name && u.no !== u.name, tag + ' 缺少编号或名称');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(isStr(u.intro), tag + ' 缺少单元导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以单元 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 例题不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
  });
});
check(seenPoints.size === 37, '全册应为 37 个知识点，实际 ' + seenPoints.size);

/* ---------- 公式与易错 ---------- */
console.log('— 公式法则与易错诊所 —');
check(Array.isArray(MKB.formulas) && MKB.formulas.length >= 4, '公式速查至少 4 组');
MKB.formulas.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 式子]');
  check(isStr(f.note), f.title + ' 缺少说明');
});
check(Array.isArray(MKB.mistakes) && MKB.mistakes.length >= 10, '易错诊所至少 10 条');
MKB.mistakes.forEach(m => {
  check(isStr(m.unit) && isStr(m.wrong) && isStr(m.right), '易错条目不完整: ' + JSON.stringify(m));
});

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, path) {
  if (typeof v === 'string') {
    /* 数学内容允许比较符号 <、>（渲染时统一 esc 转义），只拦截形如标签的 <字母 */
    check(!/<[a-zA-Z/]/.test(v), path + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/"|\n/.test(v), path + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, path + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k));
  }
}
walk(MKB.units, 'units');
walk(MKB.formulas, 'formulas');
walk(MKB.mistakes, 'mistakes');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：10 板块 37 知识点 + 公式 + 易错）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
