const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const course = require('../energy-environment.json');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim());
}

assert.equal(course.schema_version, 1);
text(course.title);
text(course.intro);
assert.deepEqual(course.stations.map(station => station.id), ['sources', 'generation', 'saving', 'environment', 'carbon']);
for (const station of course.stations) {
  for (const key of ['label', 'question', 'intro', 'challenge', 'answer']) text(station[key]);
  assert.ok(station.notes.length >= 2);
  for (const note of station.notes) { text(note.title); text(note.text); }
  assert.ok(station.sources.length > 0);
  for (const source of station.sources) {
    text(source.label);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
  for (const link of station.links ?? []) {
    text(link.label);
    assert.match(link.route, /^[a-z]+(?:-[a-z]+)*$/);
    if (link.fragment) assert.match(link.fragment, /^[a-z][a-z0-9-]*$/);
  }
}

const { photo, turbine, electricity, carbon } = course;
for (const key of ['alt', 'caption', 'credit']) text(photo[key]);
assert.match(photo.path, /^study_topics\/[a-z-]+\/assets\/[a-z-]+\.jpg$/);
assert.ok(existsSync(join(__dirname, '../../static', photo.path)));
assert.ok(Number.isInteger(photo.width) && photo.width > 0);
assert.ok(Number.isInteger(photo.height) && photo.height > 0);
assert.equal(new URL(photo.source).protocol, 'https:');
for (const key of ['task', 'note', 'blades', 'shaft', 'generator']) text(turbine[key]);
for (const key of ['before', 'after']) assert.ok(Number.isInteger(electricity[key]) && electricity[key] >= 0 && electricity[key] <= 5000);
assert.ok(electricity.hours >= 0 && electricity.hours <= 24 && Number.isInteger(electricity.hours * 4));
assert.ok(Number.isInteger(electricity.days) && electricity.days >= 1 && electricity.days <= 366);
assert.ok(Number.isInteger(carbon.baseline) && carbon.baseline > 0 && carbon.baseline <= 10000);
for (const key of ['reduced', 'removed']) assert.ok(Number.isInteger(carbon[key]) && carbon[key] >= 0 && carbon[key] <= carbon.baseline);
