const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const course = require('../great-works.json');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim().length);
}

assert.equal(course.schema_version, 1);
text(course.title);
text(course.intro);
const drawings = fs.readFileSync(path.join(__dirname, '../../static/study_topics/great-works.svg'), 'utf8');
assert.deepEqual(course.works.map(work => work.id), [
  'great-wall', 'grand-canal', 'dujiangyan', 'zhaozhou-bridge', 'forbidden-city', 'hzmb',
]);
for (const work of course.works) {
  for (const key of ['name', 'place', 'period', 'question', 'setting', 'solution', 'tradeoff', 'caption', 'task', 'answer']) text(work[key]);
  assert.ok(drawings.includes('<symbol id="' + work.id + '"'));
  assert.equal(work.clues.length, 3);
  for (const clue of work.clues) {
    text(clue.label);
    text(clue.text);
    assert.ok(Number.isInteger(clue.x) && clue.x >= 12 && clue.x <= 348);
    assert.ok(Number.isInteger(clue.y) && clue.y >= 12 && clue.y <= 148);
  }
  assert.ok(work.sources.length);
  for (const source of work.sources) { text(source.label); assert.equal(new URL(source.url).protocol, 'https:'); }
  text(work.related.label);
  assert.match(work.related.route, /^[a-z-]+$/);
  assert.match(work.related.suffix, /^[?#][a-z0-9=-]+$/);
}
