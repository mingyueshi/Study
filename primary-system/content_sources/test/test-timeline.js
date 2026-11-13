/* ============================================================
   历史双轨时间轴数据测试（content_sources/history-timeline/ 自包含子目录）
   运行：node content_sources/test/test-timeline.js
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
require('../history-timeline/media-data.js');
require('../history-timeline/dynasty-data.js');
require('../history-timeline/territory-data.js');
require('../history-timeline/territory-geo.js');
require('../history-timeline/shared.js');
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
  check(/^[a-z]+$/.test(e.id) && !eraIds.has(e.id), tag + ' id 应非空且唯一: ' + e.id);
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

/* ---------- 共用时间轴索引 ---------- */
console.log('— 共用时间轴索引 —');
const ctx = W.TLShared.makeContext(ERAS, EVENTS, PAIRS);
ERAS.forEach(era => {
  const expected = EVENTS.filter(ev => ev.era === era.id).sort((a, b) => a.sort - b.sort);
  const rows = ctx.byEra.get(era.id);
  check(JSON.stringify(rows.flat().map(ev => ev.id)) === JSON.stringify(expected.map(ev => ev.id)),
    era.id + ' 年代行应按时间合并中外大事，每件只出现一次');
  check(rows.every(row => row.every(ev => ev.sort === row[0].sort)),
    era.id + ' 同一行只放排序年代相同的大事');
  check(rows.every((row, i) => i === 0 || row[0].sort > rows[i - 1][0].sort),
    era.id + ' 排序年代相同的大事应合并在同一行');
});
EVENTS.forEach(ev => {
  check(ctx.eventMap.get(ev.id) === ev, ev.id + ' 应能按稳定 id 定位事件');
  check(ctx.pairOfEvent.get(ev.id) === pairOfEvent.get(ev.id), ev.id + ' 的同期对照应与数据一致');
  check(W.TLShared.eventHref(ev) === 'event.html?event=' + ev.id, ev.id + ' 应有独立详情入口');
});

/* ---------- 朝代更替子页 ---------- */
console.log('— 朝代更替子页 —');
const BANDS = W.DYNASTY_BANDS;
const BRIDGES = W.DYNASTY_TRANSITIONS;
check(isStr(W.CALENDAR_INTRO), 'CALENDAR_INTRO 应为非空介绍文字');
check(!hasBadPunct(W.CALENDAR_INTRO || ''), 'CALENDAR_INTRO 含英文引号/分号/裸换行');
check(Array.isArray(BANDS) && BANDS.length > 0, 'DYNASTY_BANDS 应为非空数组');
const bandIdx = new Map();
const dynastyNames = new Set();
if (Array.isArray(BANDS)) {
  check(BANDS.length === 16, '朝代更替应有 16 个朝代带（夏到清），实际 ' + BANDS.length);
  BANDS.forEach((b, i) => {
    const tag = `[带 ${b.id || i + 1}]`;
    check(/^[a-z]+$/.test(b.id) && !bandIdx.has(b.id), tag + ' id 应非空且唯一: ' + b.id);
    bandIdx.set(b.id, i);
    check(isStr(b.name) && !dynastyNames.has(b.name), tag + ' name 应非空且唯一');
    dynastyNames.add(b.name);
    check(eraIds.has(b.era), tag + ' era 应指向存在的时代站');
    if (i > 0) check(b.startYear >= BANDS[i - 1].startYear, tag + ' 朝代速览应按起始年代排序');
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

/* ---------- 教学素材 ---------- */
console.log('— 教学素材 —');
const mediaPaths = new Set();
const mediaEras = new Set();
const isSource = value => typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value);
for (const [id, items] of Object.entries(W.TIMELINE_MEDIA)) {
  const event = EVENTS.find(ev => ev.id === id);
  check(Boolean(event), '素材应指向存在的事件：' + id);
  check(Array.isArray(items) && items.length > 0, id + ' 的素材应为非空数组');
  if (!Array.isArray(items)) continue;
  for (const item of items) {
    const tag = id + ' / ' + item.title;
    const isImage = item.type === 'image';
    check(isImage || item.type === 'audio', tag + ' 应是图片或录音');
    const validPath = /^assets\/history\/[a-z0-9-]+\.(jpg|mp3)$/.test(item.src);
    check(validPath && item.src.endsWith(isImage ? '.jpg' : '.mp3') && fileExists(item.src),
      tag + ' 应引用本目录内存在的素材文件');
    check(!mediaPaths.has(item.src), tag + ' 素材路径重复');
    mediaPaths.add(item.src);
    for (const field of ['kind', 'title', 'caption', 'prompt', 'credit', 'license']) {
      check(isStr(item[field]) && !hasBadPunct(item[field]), tag + ' 缺少有效的 ' + field);
    }
    check(isSource(item.source), tag + ' 应有 HTTPS 来源链接');
    check(item.further === undefined || (isStr(item.further.label) && isSource(item.further.url)),
      tag + ' 的延伸资料应有名称和 HTTPS 链接');
    if (isImage) {
      check(isStr(item.alt) && !hasBadPunct(item.alt), tag + ' 应有图片替代文字');
      check([item.width, item.height].every(n => Number.isInteger(n) && n > 0), tag + ' 应有有效的图片尺寸');
      if (event) mediaEras.add(event.era);
    }
  }
}
ERAS.forEach(era => check(mediaEras.has(era.id), era.name + ' 应有可离线查看的图片素材'));

/* ---------- 朝代版图 ---------- */
console.log('— 朝代版图 —');
const territoryIds = new Set();
const territoryDynasties = new Set();
const TERRITORIES = W.TERRITORY_MAPS;
const TERRITORY_GEO = W.TERRITORY_GEO;
const validPoint = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
  && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90;
function validateRings(rings, label) {
  check(Array.isArray(rings) && rings.length > 0, label + ' 应有轮廓');
  rings.forEach(ring => {
    check(ring.length >= 4 && ring.every(validPoint), label + ' 应有有效经纬度');
    check(JSON.stringify(ring[0]) === JSON.stringify(ring.at(-1)), label + ' 轮廓应闭合');
  });
}
check(TERRITORY_GEO?.meta.version === 'Cliopatria v0.2.1', '历史轮廓应记录数据版本');
validateRings(TERRITORY_GEO.land, '底图陆地');
check(Array.isArray(TERRITORY_GEO.rivers) && TERRITORY_GEO.rivers.some(river => river.name === '黄河')
  && TERRITORY_GEO.rivers.some(river => river.name === '长江'), '底图应有黄河与长江定位线索');
TERRITORY_GEO.rivers.forEach(river => {
  check(isStr(river.name) && Array.isArray(river.lines) && river.lines.length > 0
    && river.lines.every(line => line.length >= 2 && line.every(validPoint)), river.name + ' 河流线应有效');
});
Object.entries(TERRITORY_GEO.regions).forEach(([id, region]) => {
  check(/^[a-z0-9-]+$/.test(id), '区域 id 有效：' + id);
  check(isStr(region.name) && !hasBadPunct(region.name), id + ' 应有中文区域名称');
  check(/^#[a-f0-9]{6}$/i.test(region.color), id + ' 应有颜色');
  check(validPoint(region.label), id + ' 标签应有经纬度');
  check(isStr(region.source), id + ' 应有轮廓来源');
  validateRings(region.rings, id);
});
check(Array.isArray(TERRITORIES) && TERRITORIES.length > 0, 'TERRITORY_MAPS 应为非空数组');
if (Array.isArray(TERRITORIES)) TERRITORIES.forEach((map, i) => {
  const tag = '[版图 ' + map.id + ']';
  check(/^[a-z-]+$/.test(map.id) && !territoryIds.has(map.id), tag + ' id 应有效且唯一');
  territoryIds.add(map.id);
  check(BANDS.some(band => band.id === map.dynasty), tag + ' 应关联存在的朝代');
  territoryDynasties.add(map.dynasty);
  check(Number.isInteger(map.year) && map.year !== 0, tag + ' 应有示意年份');
  const band = BANDS.find(band => band.id === map.dynasty);
  check(band && map.year >= band.startYear && map.year <= band.endYear, tag + ' 示意年份应在所属朝代内');
  check(Array.isArray(map.regions) && map.regions.length > 0 && map.regions.every(id => TERRITORY_GEO.regions[id]),
    tag + ' 应引用有效的地图轮廓');
  check(new Set(map.regions).size === map.regions.length, tag + ' 区域引用不得重复');
  check(Array.isArray(map.capitals) && map.capitals.length > 0 && map.capitals.every(capital =>
    isStr(capital.name) && validPoint(capital.point)), tag + ' 应有都城或中心地点标记');
  check(Number.isFinite(map.sort) && map.sort !== 0, tag + ' 应有排序年代');
  if (i > 0) check(map.sort >= TERRITORIES[i - 1].sort, tag + ' 应按时间排列');
  for (const field of ['title', 'period', 'alt', 'credit', 'note', 'question', 'answer']) {
    check(isStr(map[field]) && !hasBadPunct(map[field]), tag + ' 应有中文 ' + field);
  }
  check(Array.isArray(map.observe) && map.observe.length >= 2 && map.observe.every(text => isStr(text) && !hasBadPunct(text)),
    tag + ' 应有至少两条观察提示');
  check(/^assets\/territory\/[a-z0-9-]+\.jpg$/.test(map.src) && fileExists(map.src), tag + ' 应引用本地地图');
  check([map.width, map.height].every(n => Number.isInteger(n) && n > 0), tag + ' 应有图片宽高');
  check(/^https:\/\/home\.olemiss\.edu\/~gg\/hstrymap\/[^\s]+\.jpg$/.test(map.source), tag + ' 应保存地图原始出处');
});
BANDS.forEach(band => check(territoryDynasties.has(band.id), band.name + ' 应有对应地图'));

/* ---------- 入口文件（多页面系统） ---------- */
console.log('— 入口文件（多页面系统） —');
check(fileExists('README.md'), '缺少历史时间轴维护说明');
/* 页面引用均应在可独立拷走的目录内。 */
const PAGE_REFS = {
  'index.html': ['content.js', 'timeline-data.js', 'dynasty-data.js', 'shared.js', 'home-app.js', 'styles.css', 'timeline.html', 'dynasties.html', 'era.html'],
  'timeline.html': ['content.js', 'timeline-data.js', 'media-data.js', 'dynasty-data.js', 'shared.js', 'timeline-app.js', 'styles.css', 'timeline.css',
    'dynasties.html', 'era.html'],
  'dynasties.html': ['content.js', 'dynasty-data.js', 'territory-data.js', 'territory-geo.js', 'shared.js', 'dynasty-app.js', 'territory-app.js', 'styles.css', 'dynasty.css', 'territory.css',
    'timeline.html'],
  'era.html': ['content.js', 'timeline-data.js', 'media-data.js', 'dynasty-data.js', 'shared.js', 'era-app.js', 'styles.css', 'era.css', 'media.css',
    'timeline.html'],
  'event.html': ['content.js', 'timeline-data.js', 'media-data.js', 'shared.js', 'event-app.js', 'styles.css', 'era.css', 'media.css',
    'timeline.html', 'era.html']
};
Object.entries(PAGE_REFS).forEach(([page, refs]) => {
  check(fileExists(page), '缺少页面 ' + page);
  if (!fileExists(page)) return;
  const html = fs.readFileSync(path.join(DIR, page), 'utf8');
  refs.forEach(f => check(html.includes(f), page + ' 应引用 ' + f));
  for (const [, target] of html.matchAll(/(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    check(!/[/:]/.test(target) && fileExists(target), page + ' 应引用目录内存在的文件：' + target);
  }
  check(html.includes('lang="zh-CN"'), page + ' 应声明 zh-CN');
  check(html.includes('tl-sysnav'), page + ' 应有系统导航条');
  check(!/https?:\/\//.test(html.replace(/<!--[\s\S]*?-->/g, '').replace(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g, '')), page + ' 不应引用外部网络资源（离线优先）');
});

/* ---------- 汇总 ---------- */
const total = EVENTS.length;
console.log(`\n时代 ${ERAS.length} 个，事件 ${total} 条（中国 ${chinaCount} / 世界 ${total - chinaCount}），对照 ${PAIRS.length} 组，朝代条目 ${Array.isArray(BANDS) ? BANDS.length : 0} 条。`);
console.log(`共 ${checked} 项检查，${fails} 项未通过。`);
process.exit(fails ? 1 : 0);
