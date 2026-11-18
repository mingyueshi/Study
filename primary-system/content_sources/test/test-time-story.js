const assert = require('node:assert/strict');
const course = require('../time-story.json');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim());
}

assert.equal(course.schema_version, 1);
text(course.title);
text(course.intro);
assert.deepEqual(course.stations.map(station => station.id), ['calendars', 'solar-terms', 'time-zones', 'clocks', 'eras']);
for (const station of course.stations) {
  for (const key of ['label', 'question', 'intro', 'challenge', 'answer']) text(station[key]);
  assert.ok(station.cards.length >= 2);
  for (const card of station.cards) { text(card.title); text(card.text); }
  assert.ok(station.links.length && station.sources.length);
  for (const link of station.links) {
    text(link.label);
    assert.match(link.route, /^[a-z][a-z0-9-]+$/);
    if (link.argument !== undefined) assert.match(link.argument, /^[a-z][a-z0-9-]*$/);
    if (link.suffix) assert.match(link.suffix, /^[?#][\w=&#-]+$/);
  }
  for (const source of station.sources) { text(source.label); assert.equal(new URL(source.url).protocol, 'https:'); }
}
const era = course.era;
text(era.name);
assert.ok(Number.isInteger(era.first) && Number.isInteger(era.last) && era.first > 0 && era.last >= era.first);
assert.ok(course.offsets.every(Number.isInteger));
assert.ok(course.offsets.every(value => value >= -720 && value <= 840));
assert.equal(new Set(course.offsets).size, course.offsets.length);
for (const offset of [0, 330, 480]) assert.ok(course.offsets.includes(offset));
