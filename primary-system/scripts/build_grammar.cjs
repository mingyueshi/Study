/* 把 content_sources/grammar/ 的语法数据确定性转换为两份产物：
   1. grammar/data/grammar.json —— 语法专题课程数据（章节 + 知识点，原样转换）；
   2. questionbank/data/questions/2026-11-grammar-quiz.json —— 31 道巩固题批次
      （choice 题走 import_questions 导入题库，选项做确定性轮换修正答案下标偏斜）。

   修改源数据后重跑本脚本，按批次维护规则导入题库。
   与 build_questionbank.cjs 同纪律：确定性产出、重跑无 diff。 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE_DIR = path.resolve(__dirname, '../content_sources/grammar');
const GRAMMAR_TARGET = process.argv[2] || path.resolve(__dirname, '../grammar/data/grammar.json');
const BATCH_ID = '2026-11-grammar-quiz';
const BATCH_TARGET = process.argv[3] || path.resolve(__dirname, '../questionbank/data/questions/', `${BATCH_ID}.json`);

// 静态数据文件以 window.XXX = [...] 结尾且无 module.exports，照 test-grammar.js 的桩加载。
globalThis.window = {};
require(path.join(SOURCE_DIR, 'content.js'));
require(path.join(SOURCE_DIR, 'knowledge-words.js'));
require(path.join(SOURCE_DIR, 'knowledge-sentences.js'));

const chapters = globalThis.window.GRAMMAR_CHAPTERS;
const lessons = [
  ...globalThis.window.GRAMMAR_LESSONS_WORDS,
  ...globalThis.window.GRAMMAR_LESSONS_SENTENCES,
];

const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

function uuid5(namespace, name) {
  const bytes = namespace.replace(/-/g, '').match(/../g).map((h) => parseInt(h, 16));
  const digest = crypto.createHash('sha1').update(Buffer.from(bytes)).update(name).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* 审计：内容契约与静态版 test-grammar.js 对齐——中文标点（禁英文双引号与裸换行）、
   8 章 31 点、id 契约、每点恰归一章、必填字段完整、sources 全 https。 */
function audit() {
  const errors = [];
  const checkString = (value, where) => {
    if (typeof value === 'string' && (value.includes('"') || /[\n\r]/.test(value))) {
      errors.push(`${where}：出现英文双引号或裸换行`);
    }
  };
  const walk = (value, where) => {
    if (typeof value === 'string') return checkString(value, where);
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${where}[${index}]`));
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, `${where}.${key}`);
    }
  };

  if (chapters.length !== 8) errors.push(`章节数应为 8，实际 ${chapters.length}`);
  if (lessons.length !== 31) errors.push(`知识点数应为 31，实际 ${lessons.length}`);
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const claimed = new Set();
  for (const chapter of chapters) {
    if (!/^\d{2}$/.test(chapter.no)) errors.push(`章节 ${chapter.id} 的 no 不是两位序号`);
    for (const lessonId of chapter.lessonIds) {
      if (!/^gr\d+-\d+$/.test(lessonId)) errors.push(`知识点 id 不合法：${lessonId}`);
      if (!byId.has(lessonId)) errors.push(`章节 ${chapter.id} 引用了不存在的 ${lessonId}`);
      if (claimed.has(lessonId)) errors.push(`知识点 ${lessonId} 被多章引用`);
      claimed.add(lessonId);
    }
  }
  for (const lesson of lessons) {
    if (!claimed.has(lesson.id)) errors.push(`知识点 ${lesson.id} 未归入任何章节`);
    walk(lesson, lesson.id);
    if (!lesson.title || !lesson.definition) errors.push(`${lesson.id} 缺 title/definition`);
    if (!Array.isArray(lesson.essentials) || lesson.essentials.length < 2) errors.push(`${lesson.id} essentials 不足 2 条`);
    const example = lesson.example || {};
    if (!example.question || !example.answer || !Array.isArray(example.steps) || example.steps.length < 1) {
      errors.push(`${lesson.id} example 不完整`);
    }
    if (!lesson.misconception || !lesson.misconception.wrong || !lesson.misconception.right) {
      errors.push(`${lesson.id} misconception 不完整`);
    }
    const quiz = lesson.quiz || {};
    if (!quiz.question || !Array.isArray(quiz.options) || quiz.options.length < 2
        || !Number.isInteger(quiz.answer) || quiz.answer < 0 || quiz.answer >= quiz.options.length
        || !quiz.explanation) {
      errors.push(`${lesson.id} quiz 不完整`);
    }
    if (!Array.isArray(lesson.sources) || lesson.sources.length < 1
        || lesson.sources.some((source) => !source.label || !/^https:\/\//.test(source.url))) {
      errors.push(`${lesson.id} sources 须非空且全为 https`);
    }
  }
  if (errors.length) {
    console.error(errors.slice(0, 20).join('\n'));
    process.exit(1);
  }
}

/* ── 产物一：课程数据（原样转换，键名规整为 snake_case）────────────────── */
function buildCurriculum() {
  const chapterOf = new Map(
    chapters.flatMap((chapter) => chapter.lessonIds.map((lessonId) => [lessonId, chapter])));
  return {
    schema_version: 1,
    source_code: 'primary-grammar',
    source_file: 'content_sources/grammar/',
    chapters: chapters.map((chapter) => ({
      id: chapter.id, no: chapter.no, title: chapter.title, description: chapter.description,
      lesson_ids: chapter.lessonIds,
    })),
    lessons: lessons.map((lesson) => {
      const chapter = chapterOf.get(lesson.id);
      return {
        id: lesson.id, title: lesson.title, definition: lesson.definition,
        essentials: lesson.essentials,
        facts: lesson.facts || null,
        formula: lesson.formula || null,
        comparison: lesson.comparison || null,
        example: lesson.example,
        misconception: lesson.misconception,
        quiz: lesson.quiz,
        sources: lesson.sources,
        chapter_id: chapter.id,
        chapter_title: chapter.title,
      };
    }),
  };
}

/* ── 产物二：题库批次（choice 题确定性轮换）──────────────────────────── */
function buildBatch() {
  const chapterOf = new Map(
    chapters.flatMap((chapter) => chapter.lessonIds.map((lessonId) => [lessonId, chapter])));
  const questions = lessons.map((lesson) => {
    const quiz = lesson.quiz;
    const sourceRef = `grammar:${lesson.id}:quiz`;
    const options = quiz.options;
    const rotate = parseInt(md5(sourceRef).slice(0, 2), 16) % options.length;
    const shuffled = options.slice(rotate).concat(options.slice(0, rotate));
    const chapter = chapterOf.get(lesson.id);
    return {
      uuid: uuid5('6ba7b811-9dad-11d1-80b4-00c04fd430c8', `primary-system/questionbank/primary-grammar/${sourceRef}`),
      type: 'choice',
      area: 'english',
      grade: null,
      stem: quiz.question,
      payload: {
        options: shuffled,
        answer: (quiz.answer - rotate + options.length) % options.length,
        explanation: quiz.explanation,
      },
      tags: ['英语·语法', `语法·${chapter.title}`],
      source_key: 'primary-grammar',
      source_ref: sourceRef,
    };
  });
  return {
    schema_version: 1,
    batch_id: BATCH_ID,
    generator: 'scripts/build_grammar.cjs',
    // 保留已发布批次的说明原文，避免改变同一 batch_id 的导入指纹。
    note: '内部数据规则生成：primary/grammar/ 各知识点的巩固题，选项确定性轮换修正答案下标偏斜。',
    questions,
  };
}

audit();
fs.mkdirSync(path.dirname(GRAMMAR_TARGET), { recursive: true });
fs.mkdirSync(path.dirname(BATCH_TARGET), { recursive: true });
const curriculum = buildCurriculum();
const batch = buildBatch();
fs.writeFileSync(GRAMMAR_TARGET, JSON.stringify(curriculum, null, 1) + '\n');
fs.writeFileSync(BATCH_TARGET, JSON.stringify(batch, null, 1) + '\n');

const countBy = (accessor) => batch.questions.reduce(
  (acc, item) => {
    const key = String(accessor(item));
    return { ...acc, [key]: (acc[key] || 0) + 1 };
  }, {});
console.log(JSON.stringify({
  chapters: curriculum.chapters.length,
  lessons: curriculum.lessons.length,
  facts: curriculum.lessons.filter((lesson) => lesson.facts).length,
  formula: curriculum.lessons.filter((lesson) => lesson.formula).length,
  comparison: curriculum.lessons.filter((lesson) => lesson.comparison).length,
  batch_id: batch.batch_id,
  questions: batch.questions.length,
  answer_distribution: countBy((item) => item.payload.answer),
  targets: [path.relative(process.cwd(), GRAMMAR_TARGET), path.relative(process.cwd(), BATCH_TARGET)],
}, null, 2));
