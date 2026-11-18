const assert = require('node:assert/strict');
const course = require('../punctuation.json');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim());
  assert.doesNotMatch(value, /[\r\n"]/);
}
function ids(items) {
  assert.ok(items.length);
  items.forEach(item => assert.match(item.id, /^[a-z]+(?:-[a-z]+)*$/));
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
}
assert.equal(course.schema_version, 1);
text(course.title);
text(course.intro);
for (const items of [course.groups, course.levels, course.marks, course.pitfalls, course.questions, course.demo.variants]) ids(items);
for (const item of [...course.groups, ...course.levels]) text(item.label);
const markIds = new Set(course.marks.map(item => item.id));
const questionIds = new Set(course.questions.map(item => item.id));
const groups = new Set(course.groups.map(item => item.id));
const levels = new Set(course.levels.map(item => item.id));
const punctuation = /^[，。？！、；：“”‘’《》（）—…]*$/u;
for (const mark of course.marks) {
  for (const field of ['symbol', 'name', 'summary', 'tip', 'reference']) text(mark[field]);
  assert.ok(groups.has(mark.group));
  assert.ok(mark.examples.length >= 2);
  mark.examples.forEach(example => { text(example.text); text(example.note); });
}
for (const question of course.questions) {
  for (const field of ['title', 'context', 'hint', 'explanation']) text(question[field]);
  assert.ok(groups.has(question.group));
  assert.ok(levels.has(question.level));
  assert.ok(question.chunks.length >= 2);
  question.chunks.forEach(chunk => assert.equal(typeof chunk, 'string'));
  assert.ok(question.answers.length);
  assert.equal(new Set(question.answers.map(answer => JSON.stringify(answer))).size, question.answers.length);
  for (const answer of question.answers) {
    assert.equal(answer.length, question.chunks.length - 1, question.id);
    answer.forEach(token => assert.match(token, punctuation));
    // 完整参考句的成对标点必须匹配，且保留原文字序。
    const sentence = question.chunks.map((chunk, i) => chunk + (answer[i] || '')).join('');
    const stack = [];
    const pairs = { '”': '“', '’': '‘', '》': '《', '）': '（' };
    for (const char of sentence) {
      if (Object.values(pairs).includes(char)) stack.push(char);
      if (pairs[char]) assert.equal(stack.pop(), pairs[char], question.id);
    }
    assert.equal(stack.length, 0, question.id);
  }
  assert.ok(question.mark_ids.length);
  question.mark_ids.forEach(id => assert.ok(markIds.has(id), id));
}
for (const mark of course.marks) assert.ok(course.questions.some(q => q.mark_ids.includes(mark.id)), mark.id);
for (const item of course.pitfalls) {
  for (const field of ['title', 'wrong', 'right', 'reason', 'reference']) text(item[field]);
  assert.notEqual(item.wrong, item.right);
  item.mark_ids.forEach(id => assert.ok(markIds.has(id)));
  assert.ok(questionIds.has(item.question_id));
}
text(course.demo.text);
course.demo.variants.forEach(item => { text(item.label); text(item.text); text(item.meaning); });
course.sources.forEach(source => { text(source.label); assert.equal(new URL(source.url).protocol, 'https:'); });
assert.ok(course.sources.length >= 2);
console.log(`标点符号实验室：${course.marks.length} 种标点、${course.pitfalls.length} 组辨析、${course.questions.length} 道练习校验通过。`);
