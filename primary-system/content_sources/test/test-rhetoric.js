const assert = require('node:assert/strict');
const { schema_version, intro, techniques, cases, sources } = require('../rhetoric.json');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim());
  assert.doesNotMatch(value, /["\r\n]/);
}

function index(items) {
  assert.ok(items.length);
  const ids = new Set(items.map(item => item.id));
  assert.equal(ids.size, items.length);
  ids.forEach(id => assert.match(id, /^[a-z]+(?:-[a-z]+)*$/));
  return ids;
}

assert.equal(schema_version, 1);
text(intro);
const techniqueIds = index(techniques);
const exampleIds = index(techniques.flatMap(item => item.examples));
index(cases);
assert.ok(sources.length);

for (const technique of techniques) {
  for (const field of ['name', 'definition', 'test']) text(technique[field]);
  assert.ok(technique.examples.length >= 2);
  assert.ok(cases.some(item => item.techniques.includes(technique.id)), technique.id);
  for (const { parts, effect } of technique.examples) {
    assert.ok(parts.some(part => part.focus === true), technique.id);
    for (const part of parts) {
      text(part.text);
      assert.ok(part.focus === undefined || part.focus === true);
    }
    text(effect);
  }
}

for (const item of cases) {
  for (const field of ['title', 'prompt', 'explanation']) text(item[field]);
  assert.ok(item.techniques.length);
  assert.equal(new Set(item.techniques).size, item.techniques.length);
  item.techniques.forEach(id => assert.ok(techniqueIds.has(id), id));
  assert.ok(item.sentences.length >= 1 && item.sentences.length <= 3);
  for (const sample of item.sentences) {
    if (typeof sample === 'string') text(sample);
    else assert.ok(exampleIds.has(sample.example), item.id);
  }
  assert.equal(item.choices.length, 3);
  assert.ok(index(item.choices).has(item.answer), item.id);
  assert.equal(new Set(item.choices.map(choice => choice.label)).size, item.choices.length);
  item.choices.forEach(choice => { text(choice.label); text(choice.feedback); });
}

for (const { label, url } of sources) {
  text(label);
  assert.equal(new URL(url).protocol, 'https:');
}

console.log(`修辞手法馆：${techniques.length} 种手法、${cases.length} 组辨析通过结构校验。`);
