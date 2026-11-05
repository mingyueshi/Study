/* ============================================================
   历史长廊数据测试（primary/history/ 自包含子目录版）
   运行：node test/test-history.js
   验证章节与知识点结构、字段完整、媒体资产、内容安全。
   数据文件面向浏览器（window.* 全局 / IIFE），require 前先在
   globalThis 上放 window/document 桩，使同一文件双环境可用。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

globalThis.window = {};
globalThis.document = { currentScript: null };
const DIR = path.join(__dirname, '..', 'history');
require('../history/content.js');
require('../history/knowledge-foundations.js');
require('../history/knowledge-dynasties.js');
require('../history/media.js');
require('../history/diagrams.js');
const W = globalThis.window;

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }
function fileExists(rel) { return fs.existsSync(path.join(DIR, rel)); }

/* ---------- 加载结果 ---------- */
console.log('— 数据加载 —');
const CH = W.HISTORY_CHAPTERS;
const LESSONS = [...(W.HISTORY_LESSONS_FOUNDATIONS || []), ...(W.HISTORY_LESSONS_DYNASTIES || [])];
const MEDIA = W.HISTORY_MEDIA || {};
const FILMS = W.HISTORY_FILMS || [];
const DIAGRAMS = W.HISTORY_DIAGRAMS || {};
check(Array.isArray(CH), 'HISTORY_CHAPTERS 应为数组');
check(Array.isArray(W.HISTORY_LESSONS_FOUNDATIONS), 'HISTORY_LESSONS_FOUNDATIONS 应为数组');
check(Array.isArray(W.HISTORY_LESSONS_DYNASTIES), 'HISTORY_LESSONS_DYNASTIES 应为数组');
check(Object.keys(MEDIA).length > 0, 'HISTORY_MEDIA 应非空');
check(Array.isArray(FILMS) && FILMS.length > 0, 'HISTORY_FILMS 应非空');
check(Object.keys(DIAGRAMS).length > 0, 'HISTORY_DIAGRAMS 应非空');

/* ---------- 章节与知识点结构 ---------- */
console.log('— 章节与知识点结构 —');
check(CH.length === 8, '应有 8 个章节，实际 ' + CH.length);
const lessonIds = new Set(LESSONS.map(l => l.id));
const seenInChapters = new Set();
CH.forEach((c, i) => {
  const tag = '[章' + (c.no || i + 1) + ']';
  check(c.no === String(i + 1).padStart(2, '0'), tag + ' 编号应为 ' + String(i + 1).padStart(2, '0'));
  check(isStr(c.id) && isStr(c.title) && isStr(c.description), tag + ' 缺少 id/标题/导语');
  check(Array.isArray(c.lessonIds) && c.lessonIds.length >= 1, tag + ' lessonIds 至少 1 条');
  c.lessonIds.forEach(id => {
    check(/^hu\d+-\d+$/.test(id), tag + ' 知识点 id 格式应为 hu章-序: ' + id);
    check(lessonIds.has(id), tag + ' 引用了不存在的知识点: ' + id);
    check(!seenInChapters.has(id), tag + ' 知识点重复归章: ' + id);
    seenInChapters.add(id);
  });
});
check(seenInChapters.size === LESSONS.length, '每个知识点都应恰好归入一个章节');

LESSONS.forEach(l => {
  const t = '[' + (l.id || '?') + ']';
  check(isStr(l.title), t + ' 缺少标题');
  check(isStr(l.definition), t + ' 缺少定义');
  check(Array.isArray(l.essentials) && l.essentials.length >= 2 && l.essentials.every(isStr), t + ' 必须掌握至少 2 条');
  check(l.example && isStr(l.example.question) && Array.isArray(l.example.steps) &&
    l.example.steps.length >= 1 && l.example.steps.every(isStr) && isStr(l.example.answer), t + ' 例题不完整（question/steps/answer）');
  check(l.misconception && isStr(l.misconception.wrong) && isStr(l.misconception.right), t + ' 易错辨析不完整（wrong/right）');
  check(l.quiz && isStr(l.quiz.question) && Array.isArray(l.quiz.options) && l.quiz.options.length >= 2, t + ' 巩固题至少 2 个选项');
  check(Number.isInteger(l.quiz && l.quiz.answer) && l.quiz.answer >= 0 &&
    l.quiz.answer < (l.quiz.options || []).length, t + ' 巩固题答案下标越界');
  check(isStr(l.quiz && l.quiz.explanation), t + ' 缺少巩固题解析');
  check(Array.isArray(l.sources) && l.sources.length >= 1 && l.sources.every(s => isStr(s.label) && isStr(s.url)), t + ' 来源至少 1 条且含 label/url');
  check(l.sources.every(s => /^https:\/\//.test(s.url || '')), t + ' 来源链接应为 https');
  if (l.facts) check(Array.isArray(l.facts) && l.facts.every(f => isStr(f.label) && isStr(f.value)), t + ' facts 格式应为 {label,value}');
  if (l.comparison) check(Array.isArray(l.comparison.headers) && l.comparison.headers.length >= 2 &&
    Array.isArray(l.comparison.rows) && l.comparison.rows.every(r => Array.isArray(r)), t + ' comparison 格式应为 {headers,rows}');
  if (l.formula !== undefined) check(isStr(l.formula), t + ' formula 应为字符串');
  if (l.imageCaption !== undefined) check(l.imageKey !== undefined, t + ' imageCaption 需要搭配 imageKey');
  if (l.imageKey) check(!!MEDIA[l.imageKey], t + ' imageKey 未注册: ' + l.imageKey);
});
check(LESSONS.length === 37, '全册应为 37 个知识点，实际 ' + LESSONS.length);

/* ---------- 配图与影片 ---------- */
console.log('— 配图与影片 —');
check(Object.keys(MEDIA).length >= 10, '实景配图至少 10 张，实际 ' + Object.keys(MEDIA).length);
Object.entries(MEDIA).forEach(([key, m]) => {
  check(isStr(m.src) && fileExists(m.src), '配图 ' + key + ' 文件不存在: ' + m.src);
  /* 图片条目要求 alt；本地短片条目（如 video）要求 poster */
  check(isStr(m.alt) || isStr(m.poster), '配图 ' + key + ' 缺少 alt（图片）或 poster（视频）');
  check(isStr(m.caption) && isStr(m.credit), '配图 ' + key + ' 缺少 caption/credit');
  check(/^https:\/\//.test(m.source || ''), '配图 ' + key + ' 来源应为 https 链接');
  if (m.poster) check(fileExists(m.poster), '配图 ' + key + ' 海报文件不存在: ' + m.poster);
});
FILMS.forEach((f, i) => {
  check(isStr(f.title) && isStr(f.url), '影片 ' + i + ' 缺少标题或链接');
  check(/^https:\/\//.test(f.url || ''), '影片 ' + i + ' 链接应为 https');
  check(!f.poster || fileExists(f.poster), '影片 ' + i + ' 海报文件不存在: ' + f.poster);
  check(!f.imageKey || !!MEDIA[f.imageKey], '影片 ' + i + ' imageKey 未注册: ' + f.imageKey);
});

/* ---------- 图示、动画与音频 ---------- */
console.log('— 图示、动画与音频 —');
check(Object.keys(DIAGRAMS).length >= 8, '概念图至少 8 幅，实际 ' + Object.keys(DIAGRAMS).length);
Object.keys(DIAGRAMS).forEach(id => {
  check(lessonIds.has(id), '概念图挂在未知知识点上: ' + id);
});
/* app.js 内联注册表：labs（动画）与 audioClips（音频），键必须是真实知识点 */
const appText = fs.readFileSync(path.join(DIR, 'app.js'), 'utf8');
const labsBlock = appText.match(/const labs = \{([^}]*)\}/);
if (labsBlock) {
  const labKeys = [...labsBlock[1].matchAll(/(\w+):/g)].map(m => m[1]);
  LESSONS.forEach(l => {
    if (l.lab) check(labKeys.includes(l.lab), '[' + l.id + '] 动画未在 app.js 注册: ' + l.lab);
  });
}
const audioBlock = appText.match(/const audioClips = \{([\s\S]*?)\n  \};/);
if (audioBlock) {
  [...audioBlock[1].matchAll(/'(hu\d+-\d+)':/g)].forEach(m => {
    check(lessonIds.has(m[1]), '音频挂在未知知识点上: ' + m[1]);
  });
}
/* 音频清单与磁盘文件对应 */
let manifest = null;
try { manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'assets/audio/manifest.json'), 'utf8')); } catch { /* 下方断言报告 */ }
check(!!manifest, 'assets/audio/manifest.json 应为可解析的 JSON');
if (manifest) {
  const onDisk = fs.readdirSync(path.join(DIR, 'assets/audio')).filter(f => f.endsWith('.m4a'));
  Object.entries(manifest).forEach(([key, a]) => {
    check(isStr(a.title) && isStr(a.credit), '音频 ' + key + ' 缺少 title/credit');
    check(isStr(a.file) && fileExists('assets/audio/' + a.file), '音频 ' + key + ' 文件不存在: ' + a.file);
    check(isStr(a.transcript) && fileExists('assets/audio/' + a.transcript), '音频 ' + key + ' 文字稿不存在: ' + a.transcript);
  });
  const listed = new Set(Object.values(manifest).map(a => a.file));
  onDisk.forEach(f => check(listed.has(f), '磁盘上的音频未登记进 manifest: ' + f));
  onDisk.forEach(f => {
    const txt = f.replace(/\.m4a$/, '.txt');
    check(fileExists('assets/audio/' + txt), '音频缺少文字稿: ' + txt);
  });
}

/* ---------- 关键内容覆盖 ---------- */
console.log('— 关键内容覆盖 —');
const allText = JSON.stringify(LESSONS) + JSON.stringify(CH);
['丝绸之路', '甲骨文', '造纸', '郑和', '郡县', '司母戊']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, pathStr) {
  if (typeof v === 'string') {
    /* 只拦截形如标签的 <字母；内容允许全角符号与数字区间 */
    check(!/<[a-zA-Z/]/.test(v), pathStr + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/"|\n/.test(v), pathStr + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, pathStr + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], pathStr + '.' + k));
  }
}
walk(LESSONS, 'lessons');
walk(CH, 'chapters');
walk(MEDIA, 'media');
walk(FILMS, 'films');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 章 37 知识点 + 配图影片 + 图示音频 + 内容安全）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
