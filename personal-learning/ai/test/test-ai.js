'use strict';
const assert = require('node:assert/strict');
const course = require('../ai-data.js');
const { normalize, key } = require('../ai-state.js');
assert.notEqual(key, 'techlex_v1');
assert.ok(course.stages.length >= 6);
const ids = new Set();
const stages = new Set();
let count = 0;
for (const stage of course.stages) {
  assert.ok(stage.id && !stages.has(stage.id)); stages.add(stage.id);
  assert.ok(stage.title && stage.goal && stage.outcome && stage.lessons.length);
  assert.ok(stage.practice.task && stage.practice.deliverable);
  assert.ok(stage.practice.steps.length >= 3 && stage.practice.criteria.length >= 2);
  for (const lesson of stage.lessons) {
    count++;
    assert.ok(lesson.id && !ids.has(lesson.id)); ids.add(lesson.id);
    assert.ok(lesson.title && lesson.english && lesson.summary.length >= 15);
    assert.ok(lesson.detail.length >= 2 && lesson.detail.every(text => text.length >= 15));
    assert.ok(lesson.example.length >= 20 && lesson.trap.length >= 15);
    assert.ok(lesson.quiz.question && lesson.quiz.explanation.length >= 15);
    assert.equal(lesson.quiz.options.length, 3);
    assert.equal(new Set(lesson.quiz.options).size, 3);
    assert.ok(Number.isInteger(lesson.quiz.answer) && lesson.quiz.answer >= 0 && lesson.quiz.answer < 3);
    assert.ok(lesson.sources.length >= 1);
    lesson.sources.forEach(id => assert.ok(course.sources[id] && /^https:\/\//.test(course.sources[id].url), '缺少来源：' + id));
  }
}
assert.ok(count >= 24);
const empty = { completed: {}, answers: {}, notes: {}, lastLesson: null };
assert.deepEqual(normalize(null, course), empty);
assert.deepEqual(normalize([], course), empty);
const dirty = { completed: { ai: true, llm: 1, removed: true }, answers: { ai: 0, llm: 8, removed: 1 }, notes: { ai: '<script>我的笔记</script>', llm: '字'.repeat(2500), removed: '旧笔记' }, lastLesson: 'ai' };
const state = normalize(dirty, course);
assert.deepEqual(state.completed, { ai: true });
assert.deepEqual(state.answers, { ai: 0 });
assert.equal(state.notes.ai, dirty.notes.ai, '笔记保留为纯文本，渲染层负责转义');
assert.equal(state.notes.llm.length, 2000);
assert.equal(state.lastLesson, 'ai');
assert.equal(normalize({ lastLesson: 'removed' }, course).lastLesson, null);
console.log('✅ AI 课程：' + stages.size + ' 个阶段、' + count + ' 个概念、自检与练习完整；进度、答案和笔记校验通过');
require('./test-practice.js');
require('./test-prompts.js');
