const assert = require('node:assert/strict');
const course = require('../word-maze.json');

function text(value, allowEmpty = false) {
  assert.equal(typeof value, 'string');
  assert.ok(allowEmpty || value.trim());
  assert.doesNotMatch(value, /["\r\n]/);
}

function ids(items) {
  assert.ok(items.length);
  const values = items.map(item => item.id);
  values.forEach(value => assert.match(value, /^[a-z]+(?:-[a-z]+)*$/));
  assert.equal(new Set(values).size, values.length);
}

assert.equal(course.schema_version, 1);
text(course.intro);
ids(course.routes);
ids(course.routes.flatMap(route => route.gates));
for (const route of course.routes) {
  for (const field of ['name', 'subtitle', 'method']) text(route[field]);
  assert.ok(route.gates.length >= 4);
  for (const gate of route.gates) {
    for (const field of ['title', 'prompt', 'hint', 'explanation']) text(gate[field]);
    assert.ok(gate.examples.length >= (route.id === 'polysemy' ? 2 : 1) && gate.examples.length <= 2);
    for (const sample of gate.examples) {
      assert.equal(sample.length, 3);
      sample.forEach((part, index) => text(part, index !== 1));
    }
    if (route.id === 'polysemy') assert.equal(new Set(gate.examples.map(sample => sample[1])).size, 1, gate.id);
    assert.equal(gate.choices.length, 3);
    ids(gate.choices);
    assert.equal(new Set(gate.choices.map(choice => choice.label)).size, 3);
    assert.ok(gate.choices.some(choice => choice.id === gate.answer), gate.id);
    gate.choices.forEach(choice => { text(choice.label); text(choice.feedback); });
  }
}
assert.ok(course.sources.length);
for (const { label, url } of course.sources) {
  text(label);
  assert.equal(new URL(url).protocol, 'https:');
}

console.log(`近反义词迷宫：${course.routes.length} 条路线、${course.routes.flatMap(route => route.gates).length} 关通过结构校验。`);
