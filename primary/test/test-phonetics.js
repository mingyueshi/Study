/* ============================================================
   英语音标数据测试（primary/phonetics/ 自包含子目录版）
   运行：node test/test-phonetics.js
   验证章节与知识点结构、字段完整、来源链接、内容安全。
   数据文件面向浏览器（window.* 全局），require 前先在
   globalThis 上放 window 桩，使同一文件双环境可用。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

globalThis.window = {};
globalThis.document = { currentScript: null };
const DIR = path.join(__dirname, '..', 'phonetics');
require('../phonetics/content.js');
require('../phonetics/knowledge-vowels.js');
require('../phonetics/knowledge-consonants.js');
const W = globalThis.window;

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}
function isStr(v) { return typeof v === 'string' && v.trim().length > 0; }

/* ---------- 加载结果 ---------- */
console.log('— 数据加载 —');
const CH = W.PHONETICS_CHAPTERS;
const LESSONS = [...(W.PHONETICS_LESSONS_VOWELS || []), ...(W.PHONETICS_LESSONS_CONSONANTS || [])];
check(Array.isArray(CH), 'PHONETICS_CHAPTERS 应为数组');
check(Array.isArray(W.PHONETICS_LESSONS_VOWELS), 'PHONETICS_LESSONS_VOWELS 应为数组');
check(Array.isArray(W.PHONETICS_LESSONS_CONSONANTS), 'PHONETICS_LESSONS_CONSONANTS 应为数组');

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
    check(/^ph\d+-\d+$/.test(id), tag + ' 知识点 id 格式应为 ph章-序: ' + id);
    check(lessonIds.has(id), tag + ' 引用了不存在的知识点: ' + id);
    check(!seenInChapters.has(id), tag + ' 知识点重复归章: ' + id);
    seenInChapters.add(id);
  });
});
check(seenInChapters.size === LESSONS.length, '每个知识点都应恰好归入一个章节');

LESSONS.forEach(l => {
  const t = '[' + (l.id || '?') + ']';
  check(isStr(l.title), t + ' 缺少标题');
  check(isStr(l.definition), t + ' 缺少发音要领');
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
  /* 巩固题选项不能带 HTML 标记（渲染时会被转义成可见文本） */
  check((l.quiz.options || []).every(o => !/<[a-zA-Z/]/.test(o)), t + ' 巩固题选项含疑似 HTML 标签');
});
check(LESSONS.length === 33, '全册应为 33 个知识点，实际 ' + LESSONS.length);

/* ---------- 音标覆盖与内容覆盖 ---------- */
console.log('— 音标覆盖与内容覆盖 —');
const allText = JSON.stringify(LESSONS) + JSON.stringify(CH);
['长元音', '短元音', '双元音', '爆破音', '摩擦音', '清辅音', '浊辅音', '48 个音标']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));
/* 核心 IPA 符号应出现（单元音、双元音、代表辅音） */
['/iː/', '/ə/', '/æ/', '/ʊ/', '/eɪ/', '/aʊ/', '/θ/', '/ʃ/', '/tʃ/', '/ŋ/', '/w/', '/l/']
  .forEach(k => check(allText.includes(k), '核心音标缺失: ' + k));
/* 例词要有英语单词（检查英文词数下限），讲解要有中文 */
const englishWords = (JSON.stringify(LESSONS).match(/\/[a-z]{2,}\//g) || []).length;
check(englishWords >= 60, '例词音标标注应不少于 60 处，实际 ' + englishWords);

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, pathStr) {
  if (typeof v === 'string') {
    /* 只拦截形如标签的 <字母；IPA 符号、撇号、英文单词都放行，值里不能有 ASCII 双引号或裸换行 */
    check(!/<[a-zA-Z/]/.test(v), pathStr + ' 含有疑似 HTML 标签: ' + v.slice(0, 24));
    check(!/["\n]/.test(v), pathStr + ' 含有 ASCII 双引号或换行: ' + v.slice(0, 24));
  } else if (Array.isArray(v)) {
    v.forEach((x, i) => walk(x, pathStr + '[' + i + ']'));
  } else if (v && typeof v === 'object') {
    Object.keys(v).forEach(k => walk(v[k], pathStr + '.' + k));
  }
}
walk(LESSONS, 'lessons');
walk(CH, 'chapters');

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 章 33 知识点 + 音标覆盖 + 内容安全）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
