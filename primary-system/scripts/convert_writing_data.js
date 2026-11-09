#!/usr/bin/env node
'use strict';
/* 把 content_sources/writing-data.js 的作文坊数据转换成 writing/data/topics.json。
   开发期工具：node scripts/convert_writing_data.js（在 primary-system 目录运行）。 */

const fs = require('fs');
const path = require('path');

// 静态相对路径（相对本脚本目录），避免动态 require。
const { WRITING_UNITS, WRITING_MATERIALS } = require('../content_sources/writing-data.js');
const OUT = path.join(__dirname, '..', 'writing', 'data', 'topics.json');

const problems = [];
const titles = new Set();
const categories = [];
let topicCount = 0;

for (const unit of WRITING_UNITS) {
  if (!unit.id || !unit.name || !unit.emoji || !unit.color) problems.push(`分类缺字段：${unit.id}`);
  if (!Array.isArray(unit.topics) || unit.topics.length < 2) problems.push(`分类题目不足：${unit.id}`);
  const topics = [];
  for (const topic of unit.topics || []) {
    topicCount += 1;
    if (titles.has(topic.title)) problems.push(`题目重复：${topic.title}`);
    titles.add(topic.title);
    if (!topic.goal) problems.push(`缺写作目标：${topic.title}`);
    const outline = topic.outline || [];
    if (outline.length !== 3) problems.push(`结构锦囊不是 3 步：${topic.title}`);
    else {
      const labels = outline.map((s) => s.label).join('');
      if (!labels.includes('开头') || !labels.includes('结尾')) problems.push(`锦囊缺开头/结尾：${topic.title}`);
    }
    if (!Array.isArray(topic.words) || topic.words.length < 3) problems.push(`好词不足：${topic.title}`);
    if (!Array.isArray(topic.sentences) || topic.sentences.length < 2) problems.push(`好句不足：${topic.title}`);
    if (!topic.model || topic.model.length < 120) problems.push(`范文过短：${topic.title}`);
    if (!topic.comment) problems.push(`缺点评：${topic.title}`);
    if (!topic.task) problems.push(`缺小练笔：${topic.title}`);
    topics.push({
      title: topic.title, goal: topic.goal,
      outline: outline.map((s) => ({ label: s.label, text: s.text })),
      words: topic.words, sentences: topic.sentences,
      model: topic.model, comment: topic.comment, task: topic.task,
    });
  }
  categories.push({ id: unit.id, name: unit.name, emoji: unit.emoji, color: unit.color, topics });
}

const materials = {
  starts: WRITING_MATERIALS.starts || [],
  ends: WRITING_MATERIALS.ends || [],
  wordGroups: WRITING_MATERIALS.wordGroups || [],
  sentences: WRITING_MATERIALS.sentences || [],
};
if (materials.starts.length < 5) problems.push('好开头不足');
if (materials.ends.length < 4) problems.push('好结尾不足');
if (materials.wordGroups.length < 3) problems.push('好词分类不足');
if (materials.sentences.length < 5) problems.push('好句素材不足');

if (problems.length) {
  console.error('校验未通过：\n' + problems.map((p) => '- ' + p).join('\n'));
  process.exit(1);
}

const payload = {
  schema_version: 1,
  source_code: 'primary-writing',
  converted_from: 'content_sources/writing-data.js',
  categories,
  materials,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 1) + '\n', 'utf8');
console.log(`已写入 ${OUT}`);
console.log(`分类 ${categories.length} 个，题目 ${topicCount} 篇，素材：开头 ${materials.starts.length} / 结尾 ${materials.ends.length} / 词组 ${materials.wordGroups.length} / 句 ${materials.sentences.length}`);
