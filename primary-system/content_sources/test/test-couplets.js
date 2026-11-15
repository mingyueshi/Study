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
for (const items of [content.rules, content.examples, content.questions, content.categories, content.word_banks]) checkIds(items);
content.categories.forEach(item => checkText(item.label));

for (const rule of content.rules) {
  for (const field of ['title', 'text', 'clue']) checkText(rule[field]);
}

for (const example of content.examples) {
  for (const field of ['title', 'scene', 'note']) checkText(example[field]);
  assert.ok(content.categories.some(category => category.id === example.category));
  for (const [index, ending] of example.endings.entries()) {
    checkText(ending.pinyin);
    assert.ok((index === 0 ? [3, 4] : [1, 2]).includes(ending.tone));
  }
  assert.equal(example.endings.length, 2);
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

assert.equal(new Set(content.puzzles).size, content.puzzles.length);
for (const id of content.puzzles) {
  const example = content.examples.find(item => item.id === id);
  assert.ok(example && example.lower.length >= 3, '拼联必须引用至少三个词组的例联');
}
for (const bank of content.word_banks) {
  checkText(bank.title);
  checkText(bank.tip);
  assert.ok(bank.pairs.length > 0);
  for (const pair of bank.pairs) {
    assert.equal(pair.length, 2);
    pair.forEach(word => assert.match(word, han));
    assert.equal([...pair[0]].length, [...pair[1]].length);
  }
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
