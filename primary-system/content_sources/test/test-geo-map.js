/* ============================================================
   中国地图导览数据测试（content_sources/geo-map/ 自包含子目录）
   运行：node test/test-geo-map.js
   验证图层/区域/阶梯元数据、省份档案与地图几何的对应、山河标记、
   邻国、口诀卡、中外对照、找一找题库与入口文件引用。
   数据文件面向浏览器（window.* 全局 / IIFE），require 前先在
   globalThis 上放 window/document 桩，使同一文件双环境可用。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

globalThis.window = {};
globalThis.document = { currentScript: null };
const DIR = path.join(__dirname, '..', 'geo-map');
require('../geo-map/content.js');
require('../geo-map/china-geo.js');
require('../geo-map/map-data.js');
require('../geo-map/world-geo.js');
require('../geo-map/world-data.js');
require('../geo-map/atlas-data.js');
require('../geo-map/atlas.js');
require('../geo-map/media-data.js');
require('../geo-map/animals-data.js');
require('../geo-map/world-animals-data.js');
require('../geo-map/shared.js');
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
const LAYERS = W.GM_LAYERS;
const REGIONS = W.GM_REGIONS;
const STEPS = W.GM_STEPS;
const STEP_LINES = W.GM_STEP_LINES;
const PROVINCES = W.GM_PROVINCES;
const FEATURES = W.GM_FEATURES;
const NEIGHBORS = W.GM_NEIGHBORS;
const CAPITAL = W.GM_CAPITAL;
const RHYMES = W.GM_RHYMES;
const TEASERS = W.GM_WORLD_TEASERS;
const POOL = W.GM_FIND_POOL;
const GEO = W.GEO_CHINA_GEO;
check(Array.isArray(LAYERS) && LAYERS.length > 0, 'GM_LAYERS 应为非空数组');
check(Array.isArray(REGIONS) && REGIONS.length > 0, 'GM_REGIONS 应为非空数组');
check(Array.isArray(PROVINCES) && PROVINCES.length > 0, 'GM_PROVINCES 应为非空数组');
check(Array.isArray(FEATURES) && FEATURES.length > 0, 'GM_FEATURES 应为非空数组');
check(Array.isArray(NEIGHBORS) && NEIGHBORS.length > 0, 'GM_NEIGHBORS 应为非空数组');
check(Array.isArray(RHYMES) && RHYMES.length > 0, 'GM_RHYMES 应为非空数组');
check(Array.isArray(TEASERS) && TEASERS.length > 0, 'GM_WORLD_TEASERS 应为非空数组');
check(Array.isArray(POOL) && POOL.length > 0, 'GM_FIND_POOL 应为非空数组');
check(GEO && typeof GEO === 'object' && GEO.provinces, 'GEO_CHINA_GEO.provinces 应存在');
if (!GEO || !Array.isArray(PROVINCES) || !Array.isArray(LAYERS)) {
  console.log(`\n共 ${checked} 项检查，${fails} 项未通过。数据无法加载，中止。`);
  process.exit(1);
}

/* ---------- 图层与区域 ---------- */
console.log('— 图层与区域 —');
check(LAYERS.length === 3, '应有 3 个图层，实际 ' + LAYERS.length);
const layerIds = new Set();
LAYERS.forEach((l, i) => {
  const tag = `[图层${i + 1}]`;
  check(isStr(l.id) && !layerIds.has(l.id), tag + ' id 应非空且唯一: ' + l.id);
  layerIds.add(l.id);
  check(isStr(l.name), tag + ' 缺少 name');
  check(isStr(l.icon), tag + ' 缺少 icon');
  check(isStr(l.accent) && /^#[0-9a-fA-F]{6}$/.test(l.accent), tag + ' accent 应为 6 位十六进制颜色');
  check(isStr(l.hint), tag + ' 缺少 hint');
  check(isStr(l.blank), tag + ' 缺少 blank（图层空状态引导语）');
  ['name', 'hint', 'blank'].forEach(k => check(!hasBadPunct(l[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + l[k]));
});
check(REGIONS.length === 4, '四大地理区域应为 4 个，实际 ' + REGIONS.length);
const regionIds = new Set();
REGIONS.forEach((r) => {
  check(isStr(r.id) && !regionIds.has(r.id), '[区域] id 应非空且唯一: ' + r.id);
  regionIds.add(r.id);
  check(isStr(r.name), '[区域] 缺少 name: ' + r.id);
  check(isStr(r.hint), '[区域] 缺少 hint: ' + r.id);
  check(isStr(r.color) && /^#[0-9a-fA-F]{6}$/.test(r.color), '[区域] color 应为 6 位十六进制: ' + r.id);
  ['name', 'hint'].forEach(k => check(!hasBadPunct(r[k]), '[区域] ' + r.id + ` ${k} 含英文引号/分号/裸换行`));
});
check(STEPS.length === 3, '三级阶梯应为 3 级，实际 ' + STEPS.length);
STEPS.forEach((s, i) => {
  check(s.no === i + 1, `[阶梯${i + 1}] no 应为 ${i + 1}`);
  check(isStr(s.name), `[阶梯${i + 1}] 缺少 name`);
  check(isStr(s.altitude), `[阶梯${i + 1}] 缺少 altitude`);
  check(isStr(s.areas), `[阶梯${i + 1}] 缺少 areas`);
  check(isStr(s.color) && /^#[0-9a-fA-F]{6}$/.test(s.color), `[阶梯${i + 1}] color 应为 6 位十六进制`);
});
check(Array.isArray(STEP_LINES) && STEP_LINES.length === 2, '阶梯分界线应为 2 条');
STEP_LINES.forEach((l) => {
  check(l.id === 'line12' || l.id === 'line23', '[分界线] id 应为 line12 / line23: ' + l.id);
  check(isStr(l.label), '[分界线] 缺少 label');
  check(isStr(l.role), '[分界线] 缺少 role');
  check(Array.isArray(l.line) && l.line.length >= 3 && l.line.every(pt => pt.length === 2 && pt.every(Number.isFinite)),
    '[分界线] line 应为至少 3 个 [经度,纬度] 对: ' + l.id);
});

/* ---------- 省份档案 ---------- */
console.log('— 省份档案 —');
check(PROVINCES.length === 34, '应有 34 个省级行政区，实际 ' + PROVINCES.length);
const provIds = new Set();
const provAdcodes = new Set();
const shorts = new Set();
const typeCount = { '省': 0, '直辖市': 0, '自治区': 0, '特别行政区': 0 };
PROVINCES.forEach((p) => {
  const tag = `[${p.id || '?'}]`;
  check(p.id === 'p' + p.adcode, tag + ' id 应为 p＋adcode: ' + p.id);
  check(isStr(p.adcode) && /^\d{6}$/.test(p.adcode), tag + ' adcode 应为 6 位数字字符串: ' + p.adcode);
  check(!provIds.has(p.id), tag + ' id 重复');
  check(!provAdcodes.has(p.adcode), tag + ' adcode 重复');
  provIds.add(p.id);
  provAdcodes.add(p.adcode);
  check(isStr(p.name), tag + ' 缺少 name');
  check(isStr(p.short), tag + ' 缺少 short（简称）');
  check(!shorts.has(p.short), tag + ' 简称重复: ' + p.short);
  shorts.add(p.short);
  check(typeCount[p.type] !== undefined, tag + ' type 应为 省/直辖市/自治区/特别行政区: ' + p.type);
  if (typeCount[p.type] !== undefined) typeCount[p.type]++;
  check(regionIds.has(p.region), tag + ' region 应为四大区域之一: ' + p.region);
  check(isStr(p.where), tag + ' 缺少 where（方位短语）');
  check(isStr(p.note), tag + ' 缺少 note');
  if (p.type === '省' || p.type === '自治区') {
    check(isStr(p.capital), tag + ` ${p.type}应给出省会/首府`);
  } else {
    check(p.capital === undefined, tag + ` ${p.type}不应有 capital 字段`);
  }
  check(Array.isArray(p.facts) && p.facts.length === 5 && p.facts.every(isStr),
    tag + ' facts 应为 5 条非空字符串（省域站「记一记」：地形位置、山河、人文物产、气候物产、趣味名胜）');
  (p.facts || []).forEach((f, i) => check(!hasBadPunct(f), tag + ` facts 第 ${i + 1} 条含英文引号/分号/裸换行: ` + f));
  ['name', 'short', 'type', 'where', 'note'].forEach(k => check(!hasBadPunct(p[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + p[k]));
});
check(typeCount['省'] === 23, '省应为 23 个，实际 ' + typeCount['省']);
check(typeCount['直辖市'] === 4, '直辖市应为 4 个，实际 ' + typeCount['直辖市']);
check(typeCount['自治区'] === 5, '自治区应为 5 个，实际 ' + typeCount['自治区']);
check(typeCount['特别行政区'] === 2, '特别行政区应为 2 个，实际 ' + typeCount['特别行政区']);

/* ---------- 山河湖海 ---------- */
console.log('— 山河湖海 —');
const KINDS = ['mountain', 'plateau', 'plain', 'basin', 'river', 'lake', 'sea', 'island'];
const KIND_CN = { mountain: '山脉', plateau: '高原', plain: '平原', basin: '盆地', river: '大河', lake: '湖泊', sea: '海域', island: '岛屿' };
const featureIds = new Set();
FEATURES.forEach((f) => {
  const tag = `[${f.id || '?'}]`;
  check(/^f\d+$/.test(f.id), tag + ' id 应为 f数字');
  check(!featureIds.has(f.id), tag + ' id 重复');
  featureIds.add(f.id);
  check(KINDS.includes(f.kind), tag + ' kind 应为 ' + KINDS.join('/') + ': ' + f.kind);
  check(isStr(f.name), tag + ' 缺少 name');
  check(isStr(f.where), tag + ' 缺少 where（方位短语）');
  check(isStr(f.note), tag + ' 缺少 note');
  ['name', 'where', 'note'].forEach(k => check(!hasBadPunct(f[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + f[k]));
  const coordOK = (pt) => Array.isArray(pt) && pt.length === 2 && pt.every(Number.isFinite);
  const inRange = (pt) => pt[0] >= 72 && pt[0] <= 137 && pt[1] >= 2 && pt[1] <= 55;
  if (f.kind === 'river' || f.kind === 'mountain') {
    check(Array.isArray(f.line) && f.line.length >= 3 && f.line.every(pt => coordOK(pt) && inRange(pt)),
      tag + ` ${KIND_CN[f.kind]}应给出至少 3 个范围内的 [经度,纬度] 拐点`);
    check(f.point === undefined, tag + ' 线状要素不应有 point');
  } else {
    check(coordOK(f.point) && inRange(f.point), tag + ' point 应为范围内的 [经度,纬度]');
    check(f.line === undefined, tag + ' 点状要素不应有 line');
  }
});
const names = FEATURES.map(f => f.name);
['长江', '黄河', '珠江', '黑龙江', '京杭大运河', '青藏高原', '太湖', '南岭', '台湾岛', '海南岛', '钓鱼岛', '赤尾屿'].forEach(n =>
  check(names.includes(n), '山河标记应包含「' + n + '」'));
check(FEATURES.length >= 45, '山河标记应不少于 45 处（含五大淡水湖与主要阶梯界山），实际 ' + FEATURES.length);
/* 五大淡水湖要齐全 */
['鄱阳湖', '洞庭湖', '太湖', '洪泽湖', '巢湖'].forEach(n =>
  check(names.includes(n), '五大淡水湖应包含「' + n + '」'));

/* ---------- 邻国 ---------- */
console.log('— 邻国 —');
const SIDES = ['north', 'northeast', 'northwest', 'west', 'southwest', 'south', 'sea'];
const neighborIds = new Set();
let landN = 0, seaN = 0;
NEIGHBORS.forEach((n) => {
  const tag = `[${n.id || '?'}]`;
  check(/^n\d+$/.test(n.id), tag + ' id 应为 n数字');
  check(!neighborIds.has(n.id), tag + ' id 重复');
  neighborIds.add(n.id);
  check(n.rel === 'land' || n.rel === 'sea', tag + ' rel 应为 land / sea');
  if (n.rel === 'land') landN++; else seaN++;
  check(SIDES.includes(n.side), tag + ' side 应为 ' + SIDES.join('/') + ': ' + n.side);
  if (n.rel === 'sea') check(n.side === 'sea', tag + ' 隔海相望的国家 side 应为 sea');
  if (n.rel === 'land') check(n.side !== 'sea', tag + ' 陆上邻国 side 不应为 sea');
  check(isStr(n.name), tag + ' 缺少 name');
  check(isStr(n.note), tag + ' 缺少 note');
  ['name', 'note'].forEach(k => check(!hasBadPunct(n[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + n[k]));
});
check(landN === 14, '陆上邻国应为 14 个，实际 ' + landN);
check(seaN === 6, '隔海相望应为 6 个，实际 ' + seaN);
check(isStr(CAPITAL && CAPITAL.name), 'GM_CAPITAL 缺少 name');
check(Number.isFinite(CAPITAL && CAPITAL.lng) && Number.isFinite(CAPITAL && CAPITAL.lat), 'GM_CAPITAL 应给出经纬度');
check(isStr(CAPITAL && CAPITAL.text) && !hasBadPunct(CAPITAL.text), 'GM_CAPITAL.text 应为无违规标点的非空字符串');

/* ---------- 口诀与预告 ---------- */
console.log('— 口诀与对照 —');
const rhymeIds = new Set();
RHYMES.forEach((r) => {
  const tag = `[${r.id || '?'}]`;
  check(/^r\d+$/.test(r.id), tag + ' id 应为 r数字');
  check(!rhymeIds.has(r.id), tag + ' id 重复');
  rhymeIds.add(r.id);
  check(isStr(r.icon), tag + ' 缺少 icon');
  check(isStr(r.title), tag + ' 缺少 title');
  check(Array.isArray(r.lines) && r.lines.length >= 3 && r.lines.every(isStr), tag + ' lines 应为至少 3 行非空字符串');
  check(isStr(r.note), tag + ' 缺少 note');
  ['title', 'note'].forEach(k => check(!hasBadPunct(r[k]), tag + ` ${k} 含英文引号/分号/裸换行`));
  (r.lines || []).forEach((l, i) => check(!hasBadPunct(l), tag + ` 第 ${i + 1} 行含英文引号/分号/裸换行: ` + l));
});
check(RHYMES.length === 7, '口诀卡应为 7 张，实际 ' + RHYMES.length);
check(TEASERS.length === 3, '中外对照应为 3 组，实际 ' + TEASERS.length);
TEASERS.forEach((t) => {
  const tag = `[${t.id || '?'}]`;
  check(/^w\d+$/.test(t.id), tag + ' id 应为 w数字');
  check(isStr(t.chinaLabel), tag + ' 缺少 chinaLabel');
  check(isStr(t.worldLabel), tag + ' 缺少 worldLabel');
  check(isStr(t.note), tag + ' 缺少 note');
  ['chinaLabel', 'worldLabel', 'note'].forEach(k => check(!hasBadPunct(t[k]), tag + ` ${k} 含英文引号/分号/裸换行: ` + t[k]));
});

/* ---------- 找一找题库 ---------- */
console.log('— 找一找题库 —');
check(POOL.length >= 12, '题库至少 12 条，实际 ' + POOL.length);
check(new Set(POOL).size === POOL.length, '题库不应有重复条目');
POOL.forEach((id) => {
  const ok = provIds.has(id) || featureIds.has(id) || neighborIds.has(id);
  check(ok, '题库引用了不存在的条目: ' + id);
});

/* ---------- 地图几何 ---------- */
console.log('— 地图几何 —');
const geoCodes = Object.keys(GEO.provinces || {});
check(geoCodes.length === 34, 'china-geo.js 应含 34 个省级要素，实际 ' + geoCodes.length);
check(geoCodes.every(c => provAdcodes.has(c)), 'china-geo.js 存在省份档案未覆盖的 adcode: ' +
  geoCodes.filter(c => !provAdcodes.has(c)).join('，'));
check(provAdcodes.size && geoCodes.every(c => true) && [...provAdcodes].every(c => geoCodes.includes(c)),
  '省份档案存在 china-geo.js 未覆盖的 adcode: ' + [...provAdcodes].filter(c => !geoCodes.includes(c)).join('，'));
let rngOK = true, ringOK = true;
const allRings = Object.values(GEO.provinces || {}).flat();
for (const ring of allRings) {
  if (!Array.isArray(ring) || ring.length < 3) { ringOK = false; break; }
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length !== 2 || !pt.every(Number.isFinite)) { ringOK = false; }
    else if (pt[0] < 72 || pt[0] > 137 || pt[1] < 2 || pt[1] > 55) { rngOK = false; }
  }
}
check(ringOK, '每个多边形环应至少 3 个 [经度,纬度] 点');
check(rngOK, '坐标应落在东经 72—137、北纬 2—55 范围内');
check(allRings.length > 34, '省级要素应包含岛屿环（含钓鱼岛、赤尾屿等）');
const twRings = (GEO.provinces['710000'] || []).flat();
check(twRings.length && Math.max(...twRings.map(p => p[0])) > 124, '台湾省应保留赤尾屿（东经 124 以东）的环');
check(Array.isArray(GEO.seaDash) && GEO.seaDash.length === 10, '十段线应有 10 段，实际 ' + (GEO.seaDash || []).length);
check(Array.isArray(GEO.southSeaIslands) && GEO.southSeaIslands.length >= 50, '南海诸岛应至少 50 个环，实际 ' + (GEO.southSeaIslands || []).length);
const hnRings = GEO.provinces['460000'] || [];
check(hnRings.length === 1 && Math.min(...hnRings[0].map(p => p[1])) >= 17.5, '海南省应只保留本岛（南海诸岛已拆出）');

/* ---------- 世界地图数据 ---------- */
console.log('— 世界地图数据 —');
const WORLD_GEO = W.GEO_WORLD_GEO;
const WORLD_LAYERS = W.GM_WORLD_LAYERS;
const CONTINENTS = W.GM_CONTINENTS;
const OCEANS = W.GM_OCEANS;
const WFEATURES = W.GM_WORLD_FEATURES;
const COUNTRY_META = W.GM_COUNTRY_META;
const MAJOR_LABELS = W.GM_MAJOR_LABELS;
const WORLD_POOL = W.GM_WORLD_POOL;
const CHINA_CARD = W.GM_CHINA_CARD;
check(WORLD_GEO && Array.isArray(WORLD_GEO.countries) && WORLD_GEO.countries.length >= 150,
  'GEO_WORLD_GEO.countries 应不少于 150 个，实际 ' + (WORLD_GEO && WORLD_GEO.countries ? WORLD_GEO.countries.length : 0));
check(Array.isArray(WORLD_LAYERS) && WORLD_LAYERS.length === 3, '世界图层应为 3 个');
WORLD_LAYERS.forEach((l, i) => {
  check(isStr(l.id) && isStr(l.name) && isStr(l.hint) && isStr(l.blank), `[世界图层${i + 1}] 字段应齐全`);
});
check(Array.isArray(CONTINENTS) && CONTINENTS.length === 7, '七大洲应为 7 个，实际 ' + (CONTINENTS || []).length);
const continentIds = new Set();
CONTINENTS.forEach((r) => {
  check(isStr(r.id) && !continentIds.has(r.id), '[大洲] id 应非空且唯一: ' + r.id);
  continentIds.add(r.id);
  check(isStr(r.name), '[大洲] 缺少 name: ' + r.id);
  check(isStr(r.hint), '[大洲] 缺少 hint: ' + r.id);
  check(isStr(r.location) && isStr(r.observe) && !hasBadPunct(r.location + r.observe), '[大洲] 位置与观察问题不完整：' + r.id);
  check(Array.isArray(r.facts) && r.facts.length === 3 &&
    r.facts.every(f => isStr(f.title) && isStr(f.text) && !hasBadPunct(f.title + f.text)), '[大洲] 应有三条带标题的重点：' + r.id);
  check(Array.isArray(r.places) && r.places.length > 0 && new Set(r.places).size === r.places.length &&
    r.places.every(id => COUNTRY_META[id]?.[1] === r.id), '[大洲] 代表地点应属于本图中的该洲：' + r.id);
  check(typeof r.source === 'string' && /^https:\/\//.test(r.source), '[大洲] 重点内容应注明来源：' + r.id);
  check(isStr(r.color) && /^#[0-9a-fA-F]{6}$/.test(r.color), '[大洲] color 应为 6 位十六进制: ' + r.id);
});
check(Array.isArray(OCEANS) && OCEANS.length === 4, '四大洋应为 4 个，实际 ' + (OCEANS || []).length);
const oceanIds = new Set();
OCEANS.forEach((o) => {
  check(/^o\d+$/.test(o.id), '[大洋] id 应为 o数字: ' + o.id);
  check(!oceanIds.has(o.id), '[大洋] id 重复: ' + o.id);
  oceanIds.add(o.id);
  check(isStr(o.name) && isStr(o.where) && isStr(o.note), '[大洋] ' + o.id + ' name/where/note 应齐全');
  check(Array.isArray(o.point) && o.point.length === 2 && o.point.every(Number.isFinite), '[大洋] point 应为 [经度,纬度]');
  check(!hasBadPunct(o.name + o.where + o.note), '[大洋] ' + o.id + ' 文案含英文引号/分号/裸换行');
});
const WORLD_KINDS = ['mountain', 'peak', 'river', 'desert', 'plateau', 'trench', 'reef', 'island'];
check(Array.isArray(WFEATURES) && WFEATURES.length >= 10, '世界之最应不少于 10 处');
const wfeatureIds = new Set();
WFEATURES.forEach((f) => {
  const tag = `[${f.id || '?'}]`;
  check(/^wf\d+$/.test(f.id), tag + ' id 应为 wf数字');
  check(!wfeatureIds.has(f.id), tag + ' id 重复');
  wfeatureIds.add(f.id);
  check(WORLD_KINDS.includes(f.kind), tag + ' kind 应为 ' + WORLD_KINDS.join('/') + ': ' + f.kind);
  check(isStr(f.name) && isStr(f.where) && isStr(f.note), tag + ' name/where/note 应齐全');
  check(!hasBadPunct(f.name + f.where + f.note), tag + ' 文案含英文引号/分号/裸换行');
  const inRange = (pt) => pt[0] >= -180 && pt[0] <= 180 && pt[1] >= -63 && pt[1] <= 85;
  if (f.kind === 'river' || f.kind === 'mountain') {
    check(Array.isArray(f.line) && f.line.length >= 3 && f.line.every(pt => pt.length === 2 && pt.every(Number.isFinite) && inRange(pt)),
      tag + ' line 应为至少 3 个范围内的 [经度,纬度] 拐点');
  } else {
    check(Array.isArray(f.point) && f.point.length === 2 && f.point.every(Number.isFinite) && inRange(f.point),
      tag + ' point 应为范围内的 [经度,纬度]');
  }
});
/* 国家中文名与大洲映射须与几何一一对应 */
const geoNames = (WORLD_GEO.countries || []).map(c => c.name);
const wrapRing = W.GMShared.wrapRing;
for (const country of WORLD_GEO.countries.filter(c => c.name !== 'Antarctica')) {
  for (const ring of country.rings) {
    check(wrapRing(ring).every(copy => copy.every(([lng], i) =>
      Math.abs(lng - copy[(i + 1) % copy.length][0]) <= 180)), '世界地图出现跨整张图的连线：' + country.name);
  }
}
const dateline = wrapRing([[179, 10], [-179, 10], [-179, 11], [179, 11]]);
check(dateline.length === 2 && dateline.some(ring => ring.some(([lng]) => lng > 180)) &&
  dateline.some(ring => ring.some(([lng]) => lng < -180)), '跨日期变更线的轮廓应出现在地图两侧');
check(COUNTRY_META && typeof COUNTRY_META === 'object', 'GM_COUNTRY_META 应存在');
const metaNames = Object.keys(COUNTRY_META || {});
geoNames.forEach((n) => check(metaNames.includes(n), '几何里的国家缺少中文名映射: ' + n));
metaNames.forEach((n) => check(geoNames.includes(n), '映射里的国家在几何中不存在: ' + n));
metaNames.forEach((n) => {
  const v = COUNTRY_META[n];
  check(Array.isArray(v) && isStr(v[0]), '[国家映射] ' + n + ' 应给出非空中文名');
  check(continentIds.has(v[1]), '[国家映射] ' + n + ' 大洲 id 应为七大洲之一: ' + v[1]);
  check(!hasBadPunct(v[0]), '[国家映射] ' + n + ' 中文名含英文引号/分号/裸换行');
});
check(COUNTRY_META['Taiwan'] && COUNTRY_META['Taiwan'][0] === '中国台湾省', '台湾在映射里应写作「中国台湾省」');
check(COUNTRY_META['China'] && COUNTRY_META['China'][1] === 'asia', '中国应属于亚洲');
check(Array.isArray(MAJOR_LABELS) && MAJOR_LABELS.length >= 10, '重点国家标注应不少于 10 个');
MAJOR_LABELS.forEach((m) => {
  check(geoNames.includes(m.name), '[重点标注] 引用了几何里不存在的国家: ' + m.name);
  check(Array.isArray(m.at) && m.at.length === 2 && m.at.every(Number.isFinite), '[重点标注] at 应为 [经度,纬度]: ' + m.name);
});
check(Array.isArray(WORLD_POOL) && WORLD_POOL.length >= 20, '世界找一找题库应不少于 20 条');
check(new Set(WORLD_POOL).size === WORLD_POOL.length, '世界题库不应有重复条目');
WORLD_POOL.forEach((id) => {
  const ok = oceanIds.has(id) || wfeatureIds.has(id) || geoNames.includes(id);
  check(ok, '世界题库引用了不存在的条目: ' + id);
});
check(Array.isArray(CHINA_CARD.facts) && CHINA_CARD.facts.length >= 3, '中国与世界档案应至少 3 条要点');
CHINA_CARD.facts.forEach((f, i) => check(!hasBadPunct(f), `[中国要点${i + 1}] 含英文引号/分号/裸换行`));

/* ---------- 地点索引与主题路线 ---------- */
console.log('— 地点索引与主题路线 —');
const A = W.GMAtlas;
const places = A.places;
check(places.length === PROVINCES.length + FEATURES.length + NEIGHBORS.length + 1 +
  OCEANS.length + WFEATURES.length + geoNames.length, '地点索引应覆盖两张地图的所有档案');
check(new Set(places.map(p => p.id)).size === places.length, '地点 ID 跨地图唯一');
for (const p of places) {
  const url = new URL(A.mapHref(p), 'file:///geo-map/');
  const layers = p.map === 'china' ? LAYERS : WORLD_LAYERS;
  check(layers.some(layer => layer.id === p.layer), '地点图层不存在：' + p.id);
  check(url.pathname.endsWith('/' + p.map + '.html') && url.searchParams.get('place') === p.id &&
    A.get(p.id) === p, '地图链接应能还原地点：' + p.id);
}
check(A.search('京', 'province').some(p => p.id === 'p110000'), '可用简称查省份');
check(A.search('new zealand', 'country').some(p => p.id === 'New Zealand'), '英文地点名搜索忽略大小写');
check(A.search('青藏高原').filter(p => p.name === '青藏高原').length === 2, '同名地点保留中国与世界两个视角');
check(A.search('青藏高原', 'world-feature').length === 1, '可按地点分类筛选');
check(A.search('长江').some(p => p.id === 'f20'), '可查山河');
check(A.search('不存在的地点').length === 0, '找不到地点时结果为空');
check(!A.get('constructor'), '无效地点 ID 回退为空');

for (const t of TEASERS) {
  check(t.places?.length === 2 && t.places[0] !== t.places[1] && t.places.every(id => A.get(id)),
    '对照卡应引用两个有效地点：' + t.id);
}
for (const n of NEIGHBORS) {
  check(A.related(n.id).some(p => p.category === 'country' && p.name === n.name), '邻居缺少世界地图位置：' + n.name);
}
const routes = W.GM_ATLAS_ROUTES;
check(routes.length >= 3, '至少三条主题路线');
check(new Set(routes.map(r => r.id)).size === routes.length, '路线 ID 唯一');
check(routes.some(r => new Set(r.steps.map(step => A.get(step.place)?.map)).size === 2), '至少一条路线横跨中国地图与世界地图');
for (const route of routes) {
  check(/^[a-z-]+$/.test(route.id) && [route.title, route.icon, route.intro, route.question].every(v => isStr(v) && !hasBadPunct(v)), '路线字段不完整：' + route.id);
  check(route.steps.length >= 3, '路线至少三站：' + route.id);
  check(new Set(route.steps.map(s => s.place)).size === route.steps.length, '路线地点不能重复：' + route.id);
  for (const [i, step] of route.steps.entries()) {
    check(Boolean(A.get(step.place)) && isStr(step.observe) && !hasBadPunct(step.observe), '路线站点无效：' + step.place);
    const url = new URL(A.stepHref(route, i), 'file:///geo-map/');
    check(url.searchParams.get('route') === route.id && url.searchParams.get('place') === step.place &&
      A.routeStop(url.searchParams)?.index === i, '路线链接应能还原站序：' + step.place);
  }
}
check(!A.routeStop(new URLSearchParams('route=rivers&place=invalid')), '无效路线站点应被忽略');
for (const pair of W.GM_ATLAS_RELATIONS) {
  const [a, b] = pair;
  check(pair.length === 2 && a !== b && A.get(a) && A.get(b), '关联地点无效：' + pair);
  check(A.related(a).some(p => p.id === b) && A.related(b).some(p => p.id === a), '地点关联应可双向跳转：' + pair);
}

/* ---------- 实景与影像 ---------- */
const media = W.GM_MEDIA;
const mediaGroups = W.GM_MEDIA_GROUPS;
const mediaGroupIds = new Set(mediaGroups.map(g => g.id));
check(mediaGroupIds.size === mediaGroups.length && mediaGroups.every(g => /^[a-z-]+$/.test(g.id) && isStr(g.name)),
  '图册分组须有唯一 ID 和名称');
check(new Set(media.map(m => m.id)).size === media.length, '图册素材 ID 唯一');
check(['photo', 'orbit', 'video'].every(kind => media.some(m => m.kind === kind)), '图册包含实拍、太空影像和影片');
check(media.some(m => m.images?.length === 2), '图册应保留一组可对照的影像');
const photoFiles = new Set();
for (const m of media) {
  check(/^[a-z-]+$/.test(m.id) && mediaGroupIds.has(m.group) && ['photo', 'orbit', 'video'].includes(m.kind),
    '图册条目 ID、主题或类型无效：' + m.id);
  check([m.title, m.caption, m.observe, m.credit].every(v => isStr(v) && !hasBadPunct(v)), '素材文字字段不完整：' + m.id);
  check(/^https:\/\//.test(m.source) && (!m.license || /^https:\/\//.test(m.license)), '素材应保留来源和适用的授权链接：' + m.id);
  check(m.places.length > 0 && new Set(m.places).size === m.places.length && m.places.every(id => A.get(id)),
    '素材需关联有效地点：' + m.id);
  check(m.kind === 'video' ? !m.images : m.images?.length >= 1 && m.images.length <= 2,
    '实拍与太空影像用本地图，影片用官方外链：' + m.id);
  for (const img of m.images || []) {
    check(isStr(img.alt) && !hasBadPunct(img.alt) && (m.images.length === 1 || isStr(img.label)),
      '影像应有替代文字，成组影像需标注日期或视角：' + m.id);
    check(/^assets\/[a-z0-9-]+\.jpg$/.test(img.src) && fileExists(img.src) && !photoFiles.has(img.src),
      '本地影像路径不存在或重复：' + img.src);
    if (fileExists(img.src)) {
      const data = fs.readFileSync(path.join(DIR, img.src));
      check(data[0] === 0xff && data[1] === 0xd8 && data.length < 512 * 1024, '影像应为压缩 JPEG：' + img.src);
    }
    photoFiles.add(img.src);
  }
}
for (const route of routes) {
  for (const step of route.steps) {
    check(media.some(m => m.kind !== 'video' && m.places.includes(step.place)), '路线站点应有离线素材：' + step.place);
  }
}

/* ---------- 中国与世界动物地图 ---------- */
console.log('— 中国与世界动物地图 —');
function checkWildlife({ habitats, animals }, [west, east, south, north], checkPlace) {
  const habitatIds = new Set();
  for (const { id, name, color } of habitats) {
    check(/^[a-z-]+$/.test(id) && !habitatIds.has(id), '栖息地 ID 应唯一：' + id);
    check(isStr(name) && !hasBadPunct(name), '栖息地名称应使用中文标点：' + id);
    check(/^#[0-9a-f]{6}$/.test(color), '栖息地应有十六进制图例颜色：' + id);
    check(animals.some(animal => animal.habitat === id), '栖息地应有动物档案：' + id);
    habitatIds.add(id);
  }
  const animalIds = new Set();
  for (const animal of animals) {
    const { id, habitat, point, source, photoSource } = animal;
    check(/^[a-z-]+$/.test(id) && !animalIds.has(id), '动物 ID 应唯一：' + id);
    animalIds.add(id);
    check(habitatIds.has(habitat), '动物应引用有效的栖息地：' + id);
    check(Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) &&
      point[0] >= west && point[0] <= east && point[1] >= south && point[1] <= north, '标记应在底图范围内：' + id);
    check(checkPlace(animal), '动物应关联有效的地图档案：' + id);
    for (const field of ['name', 'place', 'home', 'clue']) {
      check(isStr(animal[field]) && !hasBadPunct(animal[field]), field + ' 应使用中文标点：' + id);
    }
    check(animal.labelSide === undefined || ['left', 'top', 'top-right', 'bottom'].includes(animal.labelSide), '标签方向无效：' + id);
    check(/^https:\/\/[^\s]+$/.test(source), '动物应有资料出处：' + id);
    check(photoSource === undefined || /^https:\/\/[^\s]+$/.test(photoSource), '照片出处应为 HTTPS 链接：' + id);
    check(fileExists('assets/animals/' + id + '.jpg'), '缺少本地动物照片：' + id);
  }
  check(habitatIds.size >= 4 && animalIds.size >= 12, '动物地图应覆盖多种栖息地与代表动物');
}
checkWildlife(W.GM_WILDLIFE, [73, 136, 17.8, 53.8], animal => provAdcodes.has(animal.adcode));
check(W.GM_WILDLIFE.animals.length >= 30, '中国动物地图应有至少 30 种代表动物');
check(new Set(W.GM_WILDLIFE.animals.map(animal => animal.adcode)).size >= 27, '中国动物地图应覆盖至少 27 个省级行政区');
checkWildlife(W.GM_WORLD_WILDLIFE, [-180, 180, -73, 87], animal => A.get(animal.mapPlace)?.map === 'world');
const worldAnimalPlaces = W.GM_WORLD_WILDLIFE.animals.map(animal => animal.mapPlace);
check(worldAnimalPlaces.length >= 30, '世界动物地图应有至少 30 种代表动物');
for (const continent of CONTINENTS) {
  check(worldAnimalPlaces.some(place => COUNTRY_META[place]?.[1] === continent.id), '应有代表动物：' + continent.name);
}
for (const ocean of ['o1', 'o2', 'o3']) {
  check(worldAnimalPlaces.includes(ocean), '应有代表海洋动物：' + A.get(ocean).name);
}

/* ---------- 入口文件（多页面系统） ---------- */
console.log('— 入口文件（多页面系统） —');
['index.html', 'china.html', 'animals.html', 'world-animals.html', 'province.html', 'world.html', 'places.html', 'routes.html', 'gallery.html',
  'content.js', 'china-geo.js', 'map-data.js', 'shared.js',
  'china-app.js', 'home-app.js', 'province-app.js', 'world-app.js', 'animals-data.js', 'world-animals-data.js', 'animals-app.js', 'animals.css',
  'styles.css', 'province.css', 'README.md',
  'world-geo.js', 'world-data.js', 'atlas-data.js', 'atlas.js', 'map-ui.js',
  'places-app.js', 'routes-app.js', 'media-data.js', 'media.js', 'gallery-app.js',
  'scripts/build-geo.py', 'scripts/build-world.py']
  .forEach(f => check(fileExists(f), '缺少文件: ' + f));
const PAGE_REFS = {
  'index.html': ['content.js', 'china-geo.js', 'map-data.js', 'shared.js', 'home-app.js', 'styles.css',
    'china.html', 'province.html', 'world.html', 'animals.html', 'world-animals.html'],
  'china.html': ['content.js', 'china-geo.js', 'map-data.js', 'shared.js', 'media-data.js', 'media.js', 'map-ui.js', 'china-app.js', 'styles.css',
    'province.html', 'world.html', 'index.html', 'animals.html'],
  'animals.html': ['animals-data.js', 'animals-app.js', 'animals.css', 'styles.css', 'china-geo.js', 'map-data.js', 'shared.js', 'china.html', 'world-animals.html'],
  'world-animals.html': ['world-animals-data.js', 'animals-app.js', 'animals.css', 'styles.css', 'world-geo.js', 'shared.js', 'world.html', 'animals.html'],
  'province.html': ['content.js', 'china-geo.js', 'map-data.js', 'shared.js', 'media-data.js', 'media.js', 'province-app.js',
    'styles.css', 'province.css', 'china.html', 'index.html'],
  'world.html': ['map-data.js', 'world-geo.js', 'world-data.js', 'shared.js', 'media-data.js', 'media.js', 'map-ui.js', 'world-app.js', 'styles.css',
    'china.html', 'index.html', 'world-animals.html'],
  'places.html': ['places-app.js', 'styles.css'],
  'routes.html': ['routes-app.js', 'styles.css'],
  'gallery.html': ['media-data.js', 'media.js', 'gallery-app.js', 'styles.css']
};
Object.entries(PAGE_REFS).forEach(([page, refs]) => {
  if (!fileExists(page)) return;
  const html = fs.readFileSync(path.join(DIR, page), 'utf8');
  refs.forEach(f => check(html.includes(f), page + ' 应引用 ' + f));
  check(html.includes('lang="zh-CN"'), page + ' 应声明 zh-CN');
  if (!page.endsWith('animals.html')) {
    ['atlas.js', 'atlas-data.js', 'places.html', 'routes.html', 'gallery.html'].forEach(f =>
      check(html.includes(f), page + ' 应引用 ' + f));
    check(html.includes('gm-sysnav'), page + ' 应有系统导航条');
    check(html.includes('class="gm-sidebar"') && html.includes('id="content" class="gm-content"'),
      page + ' 应使用共用侧栏和内容区');
  }
  check(!/https?:\/\//.test(html.replace(/<!--[\s\S]*?-->/g, '')), page + ' 不应引用外部网络资源（离线优先）');
});
if (fileExists('README.md')) {
  const readme = fs.readFileSync(path.join(DIR, 'README.md'), 'utf8');
  check(readme.includes('province.html'), 'README 应登记省域站页面');
  check(readme.includes('facts'), 'README 应说明 facts 字段的维护方式');
  check(readme.includes('build-geo.py'), 'README 应说明 china-geo.js 的重新生成方式');
  check(readme.includes('test-geo-map.js'), 'README 应给出测试命令');
}

/* ---------- 汇总 ---------- */
console.log(`\n页面 ${Object.keys(PAGE_REFS).length} 个，地点 ${places.length} 条，主题路线 ${routes.length} 条。中国地图有 ${PROVINCES.length} 个省级行政区、${FEATURES.length} 处山河湖海、${NEIGHBORS.length} 个邻居。世界地图有 ${geoNames.length} 个国家和地区、${CONTINENTS.length} 大洲、${OCEANS.length} 大洋、${WFEATURES.length} 处世界之最。`);
console.log(`共 ${checked} 项检查，${fails} 项未通过。`);
process.exit(fails ? 1 : 0);
