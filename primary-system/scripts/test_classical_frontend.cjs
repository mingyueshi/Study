const {test} = require('node:test');
const assert = require('node:assert/strict');
const {maskText, cleanProgress, sectionSentences} = require('../static/classical/classical.js');

test('背诵按模式保留关键词与标点，揭示时能完整还原', () => {
  const text = '王戎七岁，尝与诸小儿游。';
  assert.equal(maskText(text, ['王戎', '游'], 'full'), text);
  assert.equal(maskText(text, ['王戎', '游'], 'keywords'), '王戎□□，□□□□□游。');
  assert.equal(maskText(text, ['王戎', '游'], 'blank'), '□□□□，□□□□□□。');
});

test('同词多次出现的关键词都能保留，中文引号与问号不遮挡', () => {
  assert.equal(maskText('「之，之？」', ['之'], 'keywords'), '「之，之？」');
  assert.equal(maskText('「之，之？」', ['之'], 'blank'), '「□，□？」');
  assert.equal(maskText('𠮷曰：好。', ['曰'], 'keywords'), '□曰：□。');
});

test('本机旧记录与越界作答被过滤，讲述自查不能变成选择题成绩', () => {
  const article = {questions: [
    {id: 'q1', type: 'choice', choices: ['甲', '乙', '丙']},
    {id: 'q2', type: 'choice', choices: ['甲', '乙']},
    {id: 'q3', type: 'selfcheck'},
  ]};
  assert.deepEqual(cleanProgress({answers: {q1: 2, q2: 9, unknown: 0}, selfchecks: ['q1', 'q3', 'q3', 'unknown']}, article), {answers: {q1: 2}, selfchecks: ['q3']});
  for (const value of [null, [], '坏数据', 7]) assert.deepEqual(cleanProgress(value, article), {answers: {}, selfchecks: []});
  for (const value of [false, true, '1', -1, NaN, Infinity, null]) assert.deepEqual(cleanProgress({answers: {q1: value}}, article).answers, {});
});

test('分段朗读与背诵只取连续原句，附诗独立且不修改全篇作答', () => {
  const article = require('../content_sources/classical/tengwanggexu.json');
  const before = JSON.stringify(article);
  const chosen = sectionSentences(article, 'p3');
  assert.equal(chosen.length, 8);
  assert.equal(chosen[0].id, 's19');
  assert.equal(chosen.at(-1).id, 's26');
  assert.equal(sectionSentences(article, 'poem')[0].id, 's68');
  assert.equal(sectionSentences(article, '').length, 71);
  assert.deepEqual(sectionSentences(article, 'missing'), []);
  const raw = {answers: {q1: 1, q7: 1, q23: 2}, selfchecks: ['q3', 'q24']};
  assert.deepEqual(cleanProgress(raw, article), raw);
  assert.equal(JSON.stringify(article), before);
  assert.equal(sectionSentences({sentences: chosen}, '').length, 8);
  assert.deepEqual(sectionSentences({sentences: chosen}, 'p3'), []);
});
