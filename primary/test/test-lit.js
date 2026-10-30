/* ============================================================
   文学常识数据测试
   运行：node test/test-lit.js
   验证八大文学苑结构、字段完整、图示注册、内容安全。
   ============================================================ */
'use strict';
const LIT = require('../lit-data.js');
const FIGS = require('../lit-figures.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 总体结构 ---------- */
console.log('— 文学苑与知识点结构 —');
check(Array.isArray(LIT.units) && LIT.units.length === 8, '应有 8 个文学苑，实际 ' + (LIT.units || []).length);
check(isStr(LIT.textbook), '缺少 textbook');
check(isStr(LIT.edition), '缺少 edition');

const EXPECT_IDS = ['lu1', 'lu2', 'lu3', 'lu4', 'lu5', 'lu6', 'lu7', 'lu8'];
const EXPECT_NAMES = ['认识文学', '诗歌殿堂', '四大名著', '古代文豪', '名家名篇', '文化常识', '名句典故', '文学问号'];
const seenPoints = new Set();
const unitNames = new Set();
LIT.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 文学苑顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 文学苑名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五六七八'[i] + '苑', tag + ' 编号应为第' + '一二三四五六七八'[i] + '苑');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(isStr(u.intro), tag + ' 缺少文学苑导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');
  unitNames.add(u.name);

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以文学苑 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 想一想不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
  });
});
check(seenPoints.size === 41, '全册应为 41 个知识点，实际 ' + seenPoints.size);

/* ---------- 与其他模块分开：独立的数据与苑地结构 ---------- */
console.log('— 模块独立检查 —');
check(seenPoints.size !== 37, '不应是地理 / 历史模块的 37 个知识点');
const allIds = [...seenPoints].join(',');
check(!allIds.includes('gu') && !allIds.includes('au') && !allIds.includes('hu'), '知识点 id 前缀应独立（lu）');

/* ---------- 文学速查与文学小诊所 ---------- */
console.log('— 文学速查与文学小诊所 —');
check(Array.isArray(LIT.facts) && LIT.facts.length >= 3, '文学速查至少 3 组');
LIT.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});
check(Array.isArray(LIT.mistakes) && LIT.mistakes.length >= 10, '文学小诊所至少 10 条');
LIT.mistakes.forEach(m => {
  check(isStr(m.unit) && isStr(m.wrong) && isStr(m.right), '易错条目不完整: ' + JSON.stringify(m));
  check(unitNames.has(m.unit), '易错条目的文学苑名不在文学苑中: ' + m.unit);
});

/* ---------- 关键内容覆盖 ---------- */
console.log('— 关键内容覆盖 —');
const allText = JSON.stringify(LIT);
['吴承恩', '罗贯中', '施耐庵', '曹雪芹', '诗仙', '诗圣', '司马迁', '苏轼', '安徒生',
  '唐宋八大家', '十二生肖', '二十四节气', '花甲', '歇后语', '对联', '状元']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, path) {
  if (typeof v === 'string') {
    /* 文学内容允许全角符号与书名号，只拦截形如标签的 <字母 */
    check(!/<[a-zA-Z/]/.test(v), path + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/"|\n/.test(v), path + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, path + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k));
  }
}
walk(LIT.units, 'units');
walk(LIT.facts, 'facts');
walk(LIT.mistakes, 'mistakes');

/* ---------- 图示库 ---------- */
console.log('— 文学图示库 —');
check(FIGS.FIG_IDS.length >= 17, '图示库应有 17 个以上图示，实际 ' + FIGS.FIG_IDS.length);
check(FIGS.has('demo-lit-classics') && FIGS.has('demo-lit-zodiac'), '缺少互动演示图示');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 文学苑 41 知识点 + 速查 + 小诊所 + 图示库）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
