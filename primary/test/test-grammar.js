/* ============================================================
   英语语法数据测试（primary/grammar/ 自包含子目录版）
   运行：node test/test-grammar.js
   验证章节与知识点结构、字段完整、来源链接、内容安全。
   数据文件面向浏览器（window.* 全局），require 前先在
   globalThis 上放 window 桩，使同一文件双环境可用。
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

globalThis.window = {};
globalThis.document = { currentScript: null };
const DIR = path.join(__dirname, '..', 'grammar');
require('../grammar/content.js');
require('../grammar/knowledge-words.js');
require('../grammar/knowledge-sentences.js');
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
const CH = W.GRAMMAR_CHAPTERS;
const LESSONS = [...(W.GRAMMAR_LESSONS_WORDS || []), ...(W.GRAMMAR_LESSONS_SENTENCES || [])];
check(Array.isArray(CH), 'GRAMMAR_CHAPTERS 应为数组');
check(Array.isArray(W.GRAMMAR_LESSONS_WORDS), 'GRAMMAR_LESSONS_WORDS 应为数组');
check(Array.isArray(W.GRAMMAR_LESSONS_SENTENCES), 'GRAMMAR_LESSONS_SENTENCES 应为数组');

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
    check(/^gr\d+-\d+$/.test(id), tag + ' 知识点 id 格式应为 gr章-序: ' + id);
    check(lessonIds.has(id), tag + ' 引用了不存在的知识点: ' + id);
    check(!seenInChapters.has(id), tag + ' 知识点重复归章: ' + id);
    seenInChapters.add(id);
  });
});
check(seenInChapters.size === LESSONS.length, '每个知识点都应恰好归入一个章节');

LESSONS.forEach(l => {
  const t = '[' + (l.id || '?') + ']';
  check(isStr(l.title), t + ' 缺少标题');
  check(isStr(l.definition), t + ' 缺少规则讲解');
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
  /* 英文例句里允许撇号（don't），但值里不能有 ASCII 双引号、换行或 HTML 标签（见下方安全检查） */
});
check(LESSONS.length === 31, '全册应为 31 个知识点，实际 ' + LESSONS.length);

/* ---------- 语法内容覆盖 ---------- */
console.log('— 语法内容覆盖 —');
const allText = JSON.stringify(LESSONS) + JSON.stringify(CH);
['名词复数', '所有格', '三单', 'there be', '比较级', '一般过去时', '疑问句']
  .forEach(k => check(allText.includes(k), '关键内容缺失: ' + k));
/* 每章都要有例题和巩固题（加载层面已保证字段存在，这里抽查章节均衡） */
CH.forEach(c => check(c.lessonIds.length >= 3, '[章' + c.no + '] 每章至少 3 个知识点'));

/* ---------- 内容安全与标点 ---------- */
console.log('— 数据内容安全 —');
function walk(v, pathStr) {
  if (typeof v === 'string') {
    /* 只拦截形如标签的 <字母；英文内容允许撇号和英文字母，值里不能有 ASCII 双引号或裸换行 */
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
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项：8 章 31 知识点 + 内容覆盖 + 内容安全）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
