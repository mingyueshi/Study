const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { schema_version, station, lessons, heart, pulse } = require('../human-body.json');
const art = fs.readFileSync(path.join(__dirname, '../../static/science/body-atlas.svg'), 'utf8');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim(), '文案不能留空');
  assert.doesNotMatch(value, /["\r\n]|<[a-zA-Z/]/, '文案须使用中文标点且不能含 HTML 或裸换行');
}

function texts(object, fields) {
  fields.forEach(field => text(object[field]));
}

function sources(items) {
  assert.ok(Array.isArray(items) && items.length > 0);
  for (const source of items) {
    text(source.label);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
}

assert.equal(schema_version, 1);
texts(station, ['title', 'intro', 'prompt', 'answer']);
assert.deepEqual(lessons.map(lesson => lesson.slug), ['breathing', 'digestion', 'circulation', 'movement']);
for (const id of ['atlas', ...lessons.map(lesson => lesson.slug)]) {
  assert.ok(art.includes(`<symbol id="${id}"`), `缺少本地图示 ${id}`);
}
for (const lesson of lessons) {
  texts(lesson, ['label', 'title', 'teaser', 'intro', 'observe', 'takeaway']);
  assert.ok(lesson.stops.length >= 3);
  for (const stop of lesson.stops) texts(stop, ['title', 'body']);
  assert.equal(new Set(lesson.stops.map(stop => stop.title)).size, lesson.stops.length);
  texts(lesson.quiz, ['question', 'answer']);
  sources(lesson.sources);
}

texts(heart, ['title', 'intro', 'route', 'legend']);
assert.deepEqual(heart.phases.map(phase => phase.id), ['return', 'fill', 'pump']);
for (const phase of heart.phases) texts(phase, ['label', 'description']);

texts(pulse, ['title', 'teaser', 'intro', 'comparison', 'safety']);
assert.equal(pulse.seconds, 30);
assert.equal(pulse.steps.length, 3);
for (const step of pulse.steps) texts(step, ['title', 'body']);
sources(pulse.sources);

console.log('人体奥秘站：四课、心脏泵血和测脉搏通过结构校验。');
