/* ============================================================
   历史双轨时间轴数据测试（primary/history-timeline/ 自包含子目录）
   运行：node test/test-timeline.js
   验证时代带、双轨事件、同期对照组、首页速览与入口文件引用。
   数据文件面向浏览器（window.* 全局 / IIFE），require 前先在
   globalThis 上放 window/document 桩，使同一文件双环境可用。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

globalThis.window = {};
globalThis.document = { currentScript: null };
const DIR = path.join(__dirname, '..', 'history-timeline');
require('../history-timeline/content.js');
require('../history-timeline/timeline-data.js');
require('../history-timeline/dynasty-data.js');
const W = globalThis.window;

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }
function fileExists(rel) { return fs.existsSync(path.join(DIR, rel)); }
/* 中文标点约定：正文里不出现英文双引号、单引号、分号与裸换行。 */
function hasBadPunct(s) {
  return typeof s === 'string' && /["';]|[\r\n]/.test(s);
}

/* ---------- 加载结果 ---------- */
console.log('— 数据加载 —');
const ERAS = W.TIMELINE_ERAS;
const EVENTS = W.TIMELINE_EVENTS;
const PAIRS = W.TIMELINE_PAIRS;
const SPOTLIGHTS = W.TIMELINE_SPOTLIGHTS;
check(Array.isArray(ERAS) && ERAS.length > 0, 'TIMELINE_ERAS 应为非空数组');
check(Array.isArray(EVENTS) && EVENTS.length > 0, 'TIMELINE_EVENTS 应为非空数组');
check(Array.isArray(PAIRS) && PAIRS.length > 0, 'TIMELINE_PAIRS 应为非空数组');
check(Array.isArray(SPOTLIGHTS) && SPOTLIGHTS.length > 0, 'TIMELINE_SPOTLIGHTS 应为非空数组');
if (!Array.isArray(ERAS) || !Array.isArray(EVENTS)) {
  console.log(`\n共 ${checked} 项检查，${fails} 项未通过。数据无法加载，中止。`);
  process.exit(1);
}

/* ---------- 时代带 ---------- */
console.log('— 时代带 —');
check(ERAS.length === 9, '应有 9 个时代带（含现代），实际 ' + ERAS.length);
const eraIds = new Set();
ERAS.forEach((e, i) => {
  const tag = `[时代${i + 1}]`;
  check(e.no === i + 1, tag + ' no 应为 ' + (i + 1));
  check(isStr(e.id) && !eraIds.has(e.id), tag + ' id 应非空且唯一: ' + e.id);
  eraIds.add(e.id);
  check(isStr(e.name), tag + ' 缺少 name');
  check(isStr(e.span), tag + ' 缺少 span（年代范围）');
  check(isStr(e.compare), tag + ' 缺少 compare（同期对照一句话）');
  check(isStr(e.accent) && /^#[0-9a-fA-F]{6}$/.test(e.accent), tag + ' accent 应为 6 位十六进制颜色');
  ['name', 'span', 'compare'].forEach(k => check(!hasBadPunct(e[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + e[k]));
  check(!('note' in e) || isStr(e.note), tag + ' note 若存在应为非空字符串');
});

/* ---------- 双轨事件 ---------- */
console.log('— 双轨事件 —');
const eventIds = new Set();
const byEraTrack = new Map();
EVENTS.forEach(ev => {
  const tag = `[${ev.id || '?'}]`;
  check(/^t[cw]\d+$/.test(ev.id), tag + ' id 应为 tc数字 / tw数字: ' + ev.id);
  check(!eventIds.has(ev.id), tag + ' id 重复');
  eventIds.add(ev.id);
  const wantTrack = ev.id.startsWith('tc') ? 'china' : 'world';
  check(ev.track === wantTrack, tag + ` track 应为 ${wantTrack}`);
  check(eraIds.has(ev.era), tag + ' 引用了不存在的时代: ' + ev.era);
  check(isStr(ev.year), tag + ' 缺少 year（展示年代）');
  check(ev.year.includes('年') || ev.year.includes('世纪'), tag + ' year 里应出现「年」或「世纪」: ' + ev.year);
  check(typeof ev.sort === 'number' && Number.isFinite(ev.sort), tag + ' sort 应为数字');
  check(isStr(ev.title), tag + ' 缺少 title');
  check(isStr(ev.text), tag + ' 缺少 text');
  check(isStr(ev.tag), tag + ' 缺少 tag（朝代/文明标签）');
  check(ev.icon === undefined || (isStr(ev.icon) && [...ev.icon].length <= 2), tag + ' icon 应为单个图形字符');
  ['year', 'title', 'text', 'tag'].forEach(k => check(!hasBadPunct(ev[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + ev[k]));
  const key = ev.era + '·' + ev.track;
  if (!byEraTrack.has(key)) byEraTrack.set(key, []);
  byEraTrack.get(key).push(ev);
});
ERAS.forEach(e => {
  ['china', 'world'].forEach(track => {
    const list = byEraTrack.get(e.id + '·' + track) || [];
    check(list.length >= 3, `[时代 ${e.id}] ${track} 轨至少 3 条事件，实际 ${list.length}`);
    for (let i = 1; i < list.length; i++) {
      check(list[i].sort >= list[i - 1].sort,
        `[时代 ${e.id}] ${track} 轨应按 sort 升序：${list[i - 1].id}(${list[i - 1].sort}) → ${list[i].id}(${list[i].sort})`);
    }
  });
});
const chinaCount = EVENTS.filter(e => e.track === 'china').length;
check(Math.abs(chinaCount - (EVENTS.length - chinaCount)) <= 6,
  `两条轨的事件数应大致均衡（中国 ${chinaCount} / 世界 ${EVENTS.length - chinaCount}）`);

/* ---------- 同期对照 ---------- */
console.log('— 同期对照 —');
const pairOfEvent = new Map();
const pairIds = new Set();
PAIRS.forEach(p => {
  const tag = `[${p.id || '?'}]`;
  check(/^p\d+$/.test(p.id), tag + ' id 应为 p数字: ' + p.id);
  check(!pairIds.has(p.id), tag + ' id 重复');
  pairIds.add(p.id);
  const a = eventIds.has(p.china) ? EVENTS.find(e => e.id === p.china) : null;
  const b = eventIds.has(p.world) ? EVENTS.find(e => e.id === p.world) : null;
  check(Boolean(a), tag + ' china 指向不存在的事件: ' + p.china);
  check(Boolean(b), tag + ' world 指向不存在的事件: ' + p.world);
  if (a) check(a.track === 'china', tag + ' china 指向了世界轨事件: ' + p.china);
  if (b) check(b.track === 'world', tag + ' world 指向了中国轨事件: ' + p.world);
  if (a && b) {
    check(a.era === b.era, tag + ` 对照应属同一时代（${a.era} vs ${b.era}）`);
    check(!pairOfEvent.has(a.id), tag + ' 事件重复配对: ' + a.id);
    check(!pairOfEvent.has(b.id), tag + ' 事件重复配对: ' + b.id);
    pairOfEvent.set(a.id, p);
    pairOfEvent.set(b.id, p);
  }
  check(isStr(p.label), tag + ' 缺少 label（对照一句话）');
  check(!hasBadPunct(p.label || ''), tag + ' label 含英文引号/分号/裸换行: ' + p.label);
  /* 两侧年代差不宜过大：同类演示应为「同一时期」，容忍相邻时代。 */
  if (a && b) {
    const span = Math.abs(a.sort - b.sort);
    check(span <= 350, tag + ` 两侧年代差 ${span} 年，超过 350 年不属于同一时期`);
  }
});
check(PAIRS.length >= 12, '同期对照至少 12 组，实际 ' + PAIRS.length);
check(SPOTLIGHTS.every(id => pairIds.has(id)), 'TIMELINE_SPOTLIGHTS 引用了不存在的对照 id: ' +
  SPOTLIGHTS.filter(id => !pairIds.has(id)).join('，'));
check(SPOTLIGHTS.length === 3 && new Set(SPOTLIGHTS).size === 3, '首页速览应为 3 组不重复的对照');

/* ---------- 朝代速览 ---------- */
console.log('— 朝代速览 —');
const DYN = W.TIMELINE_DYNASTIES;
check(Array.isArray(DYN) && DYN.length > 0, 'TIMELINE_DYNASTIES 应为非空数组');
if (Array.isArray(DYN)) {
  check(DYN.length === 16, '应有 16 个朝代条目（夏到清），实际 ' + DYN.length);
  const dynastyNames = new Set();
  DYN.forEach((d, i) => {
    const tag = `[朝代${i + 1}]`;
    check(isStr(d.name) && !dynastyNames.has(d.name), tag + ' name 应非空且唯一: ' + d.name);
    dynastyNames.add(d.name);
    check(isStr(d.span) && (d.span.includes('年') || d.span.includes('前') || /^\d/.test(d.span)),
      tag + ' span 应是年代范围: ' + d.span);
    check(typeof d.sort === 'number' && Number.isFinite(d.sort), tag + ' sort 应为数字');
    check(eraIds.has(d.era), tag + ' era 应指向存在的时代带: ' + d.era);
    check(d.note === undefined || isStr(d.note), tag + ' note 若存在应为非空字符串');
    ['name', 'span'].concat(d.note ? ['note'] : []).forEach(k =>
      check(!hasBadPunct(d[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + d[k]));
    if (i > 0) check(d.sort >= DYN[i - 1].sort, `朝代应按 sort 升序：${DYN[i - 1].name} → ${d.name}`);
  });
}

/* ---------- 朝代更替子页 ---------- */
console.log('— 朝代更替子页 —');
const BANDS = W.DYNASTY_BANDS;
const BRIDGES = W.DYNASTY_TRANSITIONS;
check(isStr(W.CALENDAR_INTRO), 'CALENDAR_INTRO 应为非空介绍文字');
check(!hasBadPunct(W.CALENDAR_INTRO || ''), 'CALENDAR_INTRO 含英文引号/分号/裸换行');
check(Array.isArray(BANDS) && BANDS.length > 0, 'DYNASTY_BANDS 应为非空数组');
const bandIdx = new Map();
if (Array.isArray(BANDS)) {
  check(BANDS.length === 16, '朝代更替应有 16 个朝代带（夏到清），实际 ' + BANDS.length);
  BANDS.forEach((b, i) => {
    const tag = `[带 ${b.id || i + 1}]`;
    check(isStr(b.id) && !bandIdx.has(b.id), tag + ' id 应非空且唯一: ' + b.id);
    bandIdx.set(b.id, i);
    check(isStr(b.name), tag + ' 缺少 name');
    check(isStr(b.span), tag + ' 缺少 span（展示年代）');
    check(typeof b.startYear === 'number' && typeof b.endYear === 'number' && b.startYear < b.endYear,
      tag + ' 起止年代应满足 startYear < endYear: ' + b.startYear + ' → ' + b.endYear);
    check(isStr(b.duration), tag + ' 缺少 duration（存在时长）');
    check(isStr(b.rise), tag + ' 缺少 rise（建立故事）');
    check(isStr(b.fall), tag + ' 缺少 fall（灭亡故事）');
    check(isStr(b.capital), tag + ' 缺少 capital（都城）');
    check(b.note === undefined || isStr(b.note), tag + ' note 若存在应为非空字符串');
    ['name', 'span', 'duration', 'rise', 'fall', 'capital'].concat(b.note ? ['note'] : []).forEach(k =>
      check(!hasBadPunct(b[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + b[k]));
    if (i > 0) check(b.startYear >= BANDS[i - 1].endYear - 120,
      `朝代带应按时间先后排列：${BANDS[i - 1].name}（止 ${BANDS[i - 1].endYear}）→ ${b.name}（起 ${b.startYear}）`);
  });
  /* 朝代更替带应与主页朝代速览一一对应 */
  if (Array.isArray(DYN)) {
    check(JSON.stringify(BANDS.map(b => b.name)) === JSON.stringify(DYN.map(d => d.name)),
      '朝代更替带与朝代速览的 16 个朝代应一一对应且顺序一致');
  }
}
check(Array.isArray(BRIDGES) && BRIDGES.length > 0, 'DYNASTY_TRANSITIONS 应为非空数组');
if (Array.isArray(BRIDGES) && Array.isArray(BANDS)) {
  check(BRIDGES.length === 15, '16 个朝代之间应有 15 次更替，实际 ' + BRIDGES.length);
  BRIDGES.forEach((t, i) => {
    const tag = `[更替${i + 1}]`;
    check(isStr(t.year) && t.year.includes('年'), tag + ' year 应是展示年代: ' + t.year);
    check(isStr(t.label), tag + ' 缺少 label（更替关键事件）');
    check(!hasBadPunct((t.year || '') + (t.label || '')), tag + ' year/label 含英文引号/分号/裸换行');
    check(bandIdx.has(t.from), tag + ' from 指向不存在的朝代带: ' + t.from);
    check(bandIdx.has(t.to), tag + ' to 指向不存在的朝代带: ' + t.to);
    if (bandIdx.has(t.from) && bandIdx.has(t.to)) {
      check(bandIdx.get(t.to) === bandIdx.get(t.from) + 1,
        tag + ` 更替应连接相邻朝代（${t.from} → ${t.to}）`);
    }
  });
}
const AXIS = W.CALENDAR_AXIS;
check(Array.isArray(AXIS) && AXIS.length >= 7, 'CALENDAR_AXIS 时间数轴至少 7 个刻度，实际 ' +
  (Array.isArray(AXIS) ? AXIS.length : 0));
if (Array.isArray(AXIS)) {
  AXIS.forEach((t, i) => {
    check(isStr(t.label) && t.label.includes('年') || t.label === '今年', `[数轴${i + 1}] label 应含「年」或是「今年」: ` + t.label);
    check(isStr(t.note), `[数轴${i + 1}] 缺少 note`);
    check(!hasBadPunct((t.label || '') + (t.note || '')), `[数轴${i + 1}] 含英文引号/分号/裸换行`);
  });
  const zeroBefore = AXIS.findIndex(t => t.label === '前 1 年');
  const zeroAfter = AXIS.findIndex(t => t.label === '公元 1 年');
  check(zeroBefore >= 0 && zeroAfter >= 0, '数轴应有「前 1 年」与「公元 1 年」两个刻度');
  if (zeroBefore >= 0 && zeroAfter >= 0) {
    check(zeroAfter === zeroBefore + 1, '「前 1 年」应紧挨着「公元 1 年」，直观展示没有公元 0 年');
  }
}
const RULES = W.CALENDAR_RULES;
check(Array.isArray(RULES) && RULES.length === 3, 'CALENDAR_RULES 应有 3 条计算规则，实际 ' +
  (Array.isArray(RULES) ? RULES.length : 0));
if (Array.isArray(RULES)) {
  RULES.forEach((r, i) => {
    check(isStr(r.title) && isStr(r.text) && isStr(r.example), `[规则${i + 1}] 缺少 title/text/example`);
    check(!hasBadPunct((r.title || '') + (r.text || '') + (r.example || '')), `[规则${i + 1}] 含英文引号/分号/裸换行`);
  });
}
const QUIZ = W.CALENDAR_QUIZ;
check(Array.isArray(QUIZ) && QUIZ.length >= 3, 'CALENDAR_QUIZ 至少 3 道练一练，实际 ' +
  (Array.isArray(QUIZ) ? QUIZ.length : 0));
if (Array.isArray(QUIZ)) {
  QUIZ.forEach((q, i) => {
    check(isStr(q.question) && isStr(q.answer), `[练一练${i + 1}] 缺少 question/answer`);
    check(!hasBadPunct((q.question || '') + (q.answer || '')), `[练一练${i + 1}] 含英文引号/分号/裸换行`);
  });
}

/* ---------- 入口文件（多页面系统） ---------- */
console.log('— 入口文件（多页面系统） —');
['index.html', 'timeline.html', 'dynasties.html', 'era.html',
  'content.js', 'timeline-data.js', 'dynasty-data.js', 'shared.js',
  'timeline-app.js', 'era-app.js', 'dynasty-app.js', 'home-app.js',
  'styles.css', 'era.css', 'dynasty.css', 'README.md']
  .forEach(f => check(fileExists(f), '缺少文件: ' + f));
/* 四个页面各自应引用的脚本/样式/互链：门户 → 时间轴/朝代/时代站，
   时间轴与时代站共用 shared.js 渲染事件卡。 */
const PAGE_REFS = {
  'index.html': ['content.js', 'shared.js', 'home-app.js', 'styles.css', 'timeline.html', 'dynasties.html', 'era.html'],
  'timeline.html': ['content.js', 'timeline-data.js', 'shared.js', 'timeline-app.js', 'styles.css',
    'dynasties.html', 'era.html'],
  'dynasties.html': ['content.js', 'dynasty-data.js', 'dynasty-app.js', 'styles.css', 'dynasty.css',
    'timeline.html'],
  'era.html': ['content.js', 'timeline-data.js', 'shared.js', 'era-app.js', 'styles.css', 'era.css',
    'timeline.html']
};
Object.entries(PAGE_REFS).forEach(([page, refs]) => {
  if (!fileExists(page)) return;
  const html = fs.readFileSync(path.join(DIR, page), 'utf8');
  refs.forEach(f => check(html.includes(f), page + ' 应引用 ' + f));
  check(html.includes('lang="zh-CN"'), page + ' 应声明 zh-CN');
  check(html.includes('tl-sysnav'), page + ' 应有系统导航条');
  check(!/https?:\/\//.test(html.replace(/<!--[\s\S]*?-->/g, '')), page + ' 不应引用外部网络资源（离线优先）');
});

/* ---------- 汇总 ---------- */
const total = EVENTS.length;
console.log(`\n时代 ${ERAS.length} 个，事件 ${total} 条（中国 ${chinaCount} / 世界 ${total - chinaCount}），对照 ${PAIRS.length} 组，朝代条目 ${Array.isArray(DYN) ? DYN.length : 0} 条。`);
console.log(`共 ${checked} 项检查，${fails} 项未通过。`);
process.exit(fails ? 1 : 0);
