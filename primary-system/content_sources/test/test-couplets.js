const assert = require('node:assert/strict');
const content = require('../couplets.json');

function checkText(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim(), '正文不能留空');
  assert.doesNotMatch(value, /["\r\n]/, '正文用中文引号且不能有裸换行');
}

function checkIds(items) {
  assert.ok(items.length > 0);
  assert.equal(new Set(items.map(({ id }) => id)).size, items.length);
  items.forEach(({ id }) => assert.match(id, /^[a-z]+(?:-[a-z]+)*$/));
}

const han = /^[\p{Unified_Ideograph}〇]+$/u;

assert.equal(content.schema_version, 1);
for (const items of [content.rules, content.examples, content.questions]) checkIds(items);

for (const rule of content.rules) {
  for (const field of ['title', 'text', 'clue']) checkText(rule[field]);
}

for (const example of content.examples) {
  for (const field of ['title', 'scene', 'note']) checkText(example[field]);
  assert.ok(example.upper.length > 0);
  assert.equal(example.upper.length, example.lower.length, example.id);
  example.upper.forEach((part, index) => {
    assert.match(part, han);
    assert.match(example.lower[index], han);
    assert.equal([...part].length, [...example.lower[index]].length, example.id);
  });
  assert.ok([...example.upper.join('')].length <= 12);
  assert.match(example.banner, han);
  assert.ok([...example.banner].length <= 6);
}

for (const question of content.questions) {
  for (const field of ['skill', 'prompt', 'hint', 'explanation']) checkText(question[field]);
  assert.equal(question.choices.length, 3);
  question.choices.forEach(checkText);
  assert.equal(new Set(question.choices).size, question.choices.length);
  assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.choices.length);
}

assert.ok(content.checklist.length > 0);
content.checklist.forEach(checkText);
assert.ok(content.sources.length > 0);
for (const source of content.sources) {
  checkText(source.label);
  assert.equal(new URL(source.url).protocol, 'https:');
}

console.log(`对联工坊：${content.rules.length} 条入门线索、${content.examples.length} 副例联、${content.questions.length} 道练习通过结构校验。`);
