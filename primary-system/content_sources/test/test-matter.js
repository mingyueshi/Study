/* ============================================================
   物质实验室数据测试
   运行：node test/test-matter.js
   验证五个化学启蒙室结构、图示注册、混合配对全覆盖与安全说明。
   ============================================================ */
'use strict';
const MATTER = require('../matter-data.js');
const FIGS = require('../matter-figures.js');
const MIX = require('../matter-mix-data.js');
const { pairKey, pairOf } = require('../matter-mix.js');
const SCI_PROCESS = require('../sci-process-data.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 实验室与知识点结构 ---------- */
console.log('— 化学启蒙室与知识点结构 —');
const EXPECT_IDS = ['mu1', 'mu2', 'mu3', 'mu4', 'mu5'];
const EXPECT_NAMES = ['三态进阶', '溶解分离', '酸碱显色', '反应观察', '元素探秘'];
check(Array.isArray(MATTER.units) && MATTER.units.length === 5, '应有 5 个化学启蒙室，实际 ' + (MATTER.units || []).length);
check(isStr(MATTER.textbook), '缺少 textbook');
check(isStr(MATTER.edition), '缺少 edition');

const seenPoints = new Set();
MATTER.units.forEach((u, i) => {
  const tag = '[' + (u.id || 'u?') + ']';
  check(u.id === EXPECT_IDS[i], tag + ' 实验室顺序应为 ' + EXPECT_IDS[i]);
  check(u.name === EXPECT_NAMES[i], tag + ' 实验室名称应为 ' + EXPECT_NAMES[i]);
  check(u.no === '第' + '一二三四五'[i] + '实验室', tag + ' 编号应为第' + '一二三四五'[i] + '实验室');
  check(typeof u.emoji === 'string' && u.emoji.length > 0, tag + ' 缺少 emoji');
  check(/^#[0-9a-f]{6}$/i.test(u.color), tag + ' 颜色格式: ' + u.color);
  check(FIGS.has(u.banner), tag + ' 横幅未注册: ' + u.banner);
  check(isStr(u.intro), tag + ' 缺少实验室导语');
  check(Array.isArray(u.goals) && u.goals.length >= 1 && u.goals.every(isStr), tag + ' 学习重点至少 1 条');
  check(Array.isArray(u.points) && u.points.length >= 1, tag + ' 至少 1 个知识点');

  u.points.forEach(p => {
    const t = tag + ' ' + (p.id || '?');
    check(!seenPoints.has(p.id), t + ' 知识点 id 重复');
    seenPoints.add(p.id);
    check(new RegExp('^' + u.id + '-').test(p.id), t + ' id 应以实验室 id 为前缀');
    check(isStr(p.title), t + ' 缺少标题');
    if (p.fig) {
      if (p.fig.startsWith('process-')) {
        check(SCI_PROCESS[p.fig.replace('process-', '')] !== undefined, t + ' 分段观察场景未注册: ' + p.fig);
      } else {
        check(FIGS.has(p.fig), t + ' 图示未注册: ' + p.fig);
      }
    }
    check(isStr(p.overview), t + ' 缺少概述');
    check(Array.isArray(p.items) && p.items.length >= 2 && p.items.every(isStr), t + ' 知识要点至少 2 条');
    check(p.example && isStr(p.example.q) && isStr(p.example.a) && isStr(p.example.steps), t + ' 想一想不完整（q/a/steps）');
    if (p.mistakes) check(p.mistakes.every(isStr), t + ' 易错提醒应为字符串');
    if (p.recall) check(isStr(p.recall), t + ' 口诀应为字符串');
    /* 内容安全：涉及明火的页面必须提示家长在场 */
    if (['mu4-2', 'mu4-4'].includes(p.id)) {
      const all = p.overview + p.items.join('') + p.example.steps;
      check(/家长|敞口/.test(all), t + ' 明火或产气实验应提示家长在场或敞口容器');
    }
  });
});
check(seenPoints.size === 21, '全册应为 21 个知识点，实际 ' + seenPoints.size);
check(MATTER.units.some(u => u.points.some(p => p.fig === 'process-dissolve')), '溶解分段观察应挂在一个知识点上');
check(MATTER.units.some(u => u.points.some(p => p.fig === 'process-filter')), '过滤分段观察应挂在一个知识点上');
check(MATTER.units.some(u => u.points.some(p => p.fig === 'process-burn')), '燃烧分段观察应挂在一个知识点上');
check(MATTER.units.some(u => u.points.some(p => p.fig === 'matter-ph-card')), 'pH 调色卡应挂在一个知识点上');
check(MATTER.units.some(u => u.points.some(p => p.fig === 'matter-reaction-table')), '反应观察表应挂在一个知识点上');
check(MATTER.units.some(u => u.points.some(p => p.fig === 'matter-element-link')), '元素资料入口应挂在一个知识点上');

/* ---------- 物质速查 ---------- */
console.log('— 物质速查 —');
check(Array.isArray(MATTER.facts) && MATTER.facts.length >= 4, '物质速查至少 4 组');
MATTER.facts.forEach(f => {
  check(isStr(f.title), f.title + ' 分组缺少标题');
  check(Array.isArray(f.items) && f.items.length >= 2 &&
    f.items.every(it => Array.isArray(it) && it.length === 2 && it.every(isStr)), f.title + ' 格式应为 [名称, 内容]');
  check(isStr(f.note), f.title + ' 缺少说明');
});

/* ---------- 混合实验模拟器数据 ---------- */
console.log('— 混合实验模拟器 —');
check(isStr(MIX.safety) && /敞口/.test(MIX.safety), '模拟器缺少安全说明或未提敞口容器');
check(isStr(MIX.model), '模拟器缺少模型说明');
check(Array.isArray(MIX.reagents) && MIX.reagents.length === 10, '应有 10 种试剂，实际 ' + (MIX.reagents || []).length);
const reagentIds = MIX.reagents.map(r => r.id);
check(new Set(reagentIds).size === reagentIds.length, '试剂 id 重复');
MIX.reagents.forEach(r => {
  check(isStr(r.id) && isStr(r.name), '试剂缺少 id 或名称: ' + r.id);
  check(/^#[0-9a-f]{6}$/i.test(r.color), '试剂颜色格式: ' + (r.id || '?') + ' ' + r.color);
  check(isStr(r.type) && isStr(r.note), '试剂缺少类型或说明: ' + r.id);
});

const allPairs = new Set();
for (let i = 0; i < reagentIds.length; i++) {
  for (let j = i + 1; j < reagentIds.length; j++) {
    allPairs.add(pairKey(reagentIds[i], reagentIds[j]));
  }
}
const definedPairs = Object.keys(MIX.pairs);
check(definedPairs.length === allPairs.size, '配对数应恰好 ' + allPairs.size + '，实际 ' + definedPairs.length);
for (const key of allPairs) {
  const pair = MIX.pairs[key];
  check(pair !== undefined, '缺少配对: ' + key);
  if (!pair) continue;
  check(isStr(pair.kind), key + ' 缺少现象类型');
  check(isStr(pair.text), key + ' 缺少现象描述');
  check(isStr(pair.why), key + ' 缺少原因解释');
  check(MIX.kinds[pair.kind] !== undefined, key + ' 的类型没有中文标签: ' + pair.kind);
}
check(definedPairs.every(key => allPairs.has(key)), '存在超出试剂组合的配对键');
check(isStr(MIX.fallback.text) && isStr(MIX.fallback.why), '兜底配对缺少现象与解释');

/* 产气配对的安全提示 */
for (const key of definedPairs) {
  const pair = MIX.pairs[key];
  if (pair.kind === 'gas') check(/二氧化碳/.test(pair.why), key + ' 产气反应应解释二氧化碳');
}

/* ---------- 播放器配对逻辑 ---------- */
console.log('— 播放器配对逻辑 —');
const gasPair = pairOf('vinegar', 'soda');
check(gasPair && gasPair.kind === 'gas', '醋＋小苏打应命中产气反应');
check(pairKey('soda', 'soap') === 'soap+soda', '配对键应按字典序排序');
check(pairOf('salt', 'sugar').kind === 'dry', '盐＋糖应命中固体干混');

/* ---------- 图示库渲染 ---------- */
console.log('— 图示库 —');
FIGS.FIG_IDS.forEach(id => {
  const html = FIGS.figHTML(id);
  check(html && html.length > 40, '图示渲染过短: ' + id);
});
check(FIGS.figHTML('不存在的图') === '', '未注册图示应返回空串');

console.log('');
if (fails) {
  console.error('❌ 物质实验室数据有 ' + fails + ' 处问题（断言 ' + checked + ' 项）');
  process.exit(1);
} else {
  console.log('✅ 全部通过（共断言 ' + checked + ' 项：5 室 21 知识点 + 速查 + 45 组配对 + 图示库）');
}
