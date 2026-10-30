/* ============================================================
   历史长廊数据测试
   运行：node test/test-history.js
   验证八大历史长廊结构、字段完整、图示注册、内容安全。
   ============================================================ */
'use strict';
const HIS = require('../history-data.js');
const FIGS = require('../history-figures.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 总体结构 ---------- */
console.log('— 长廊与知识点结构 —');
check(Array.isArray(HIS.units) && HIS.units.length === 8, '应有 8 个历史长廊，实际 ' + (HIS.units || []).length);
check(isStr(HIS.textbook), '缺少 textbook');
check(isStr(HIS.edition), '缺少 edition');

const EXPECT_IDS = ['hu1', 'hu2', 'hu3', 'hu4', 'hu5', 'hu6', 'hu7', 'hu8'];
const EXPECT_NAMES = ['走进历史', '上古传说', '夏商西周', '春秋战国', '秦汉一统', '三国两晋南北朝', '隋唐盛世', '宋元明清'];
const seenPoints = new Set();
const unitNames = new Set();
HIS.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 长廊顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 长廊名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五六七八'[i] + '廊', tag + ' 编号应为第' + '一二三四五六七八'[i] + '廊');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(isStr(u.intro), tag + ' 缺少长廊导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');
  unitNames.add(u.name);

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以长廊 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 想一想不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
  });
});
check(seenPoints.size === 37, '全册应为 37 个知识点，实际 ' + seenPoints.size);

/* ---------- 历史速查与历史小诊所 ---------- */
console.log('— 历史速查与历史小诊所 —');
check(Array.isArray(HIS.facts) && HIS.facts.length >= 4, '历史速查至少 4 组');
HIS.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});
check(Array.isArray(HIS.mistakes) && HIS.mistakes.length >= 10, '历史小诊所至少 10 条');
HIS.mistakes.forEach(m => {
  check(isStr(m.unit) && isStr(m.wrong) && isStr(m.right), '易错条目不完整: ' + JSON.stringify(m));
  check(unitNames.has(m.unit), '易错条目的长廊名不在历史长廊中: ' + m.unit);
});

/* ---------- 关键内容覆盖 ---------- */
console.log('— 关键内容覆盖 —');
const allText = JSON.stringify(HIS);
['炎黄子孙', '甲骨文', '后母戊鼎', '百家争鸣', '都江堰', '丝绸之路', '史记', '赤壁之战',
  '大运河', '文成公主', '郑和', '四大发明', '鸦片战争', '一统秦两汉']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, path) {
  if (typeof v === 'string') {
    /* 历史内容允许全角符号与数字区间，只拦截形如标签的 <字母 */
    check(!/<[a-zA-Z/]/.test(v), path + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/"|\n/.test(v), path + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, path + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], path + '.' + k));
  }
}
walk(HIS.units, 'units');
walk(HIS.facts, 'facts');
walk(HIS.mistakes, 'mistakes');

/* ---------- 图示库 ---------- */
console.log('— 历史图示库 —');
check(FIGS.FIG_IDS.length >= 12, '图示库应有 12 个以上图示，实际 ' + FIGS.FIG_IDS.length);
check(FIGS.has('demo-history-timeline'), '缺少朝代互动演示图示');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 长廊 37 知识点 + 速查 + 小诊所 + 图示库）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
