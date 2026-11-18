const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const course = require('../money-trade.json');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim());
}

function slug(value) {
  assert.match(value, /^[a-z]+(?:-[a-z]+)*$/);
}

assert.equal(course.schema_version, 1);
text(course.title);
text(course.intro);
assert.deepEqual(course.stations.map(station => station.id), ['exchange', 'money', 'prices', 'market', 'trade']);
for (const station of course.stations) {
  for (const key of ['label', 'question', 'intro', 'challenge', 'answer']) text(station[key]);
  assert.ok(station.notes.length >= 2);
  for (const note of station.notes) { text(note.title); text(note.text); }
  for (const link of station.links ?? []) {
    text(link.label);
    slug(link.route);
    if (link.argument) assert.match(link.argument, /^[a-z0-9-]+$/);
    if (link.suffix) assert.match(link.suffix, /^[?#][\w=-]+$/);
  }
  for (const source of station.sources ?? []) {
    text(source.label);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
}

const { photo, basket, market } = course;
for (const key of ['alt', 'caption', 'credit']) text(photo[key]);
assert.match(photo.path, /^study_topics\/money-trade\/[a-z-]+\.jpg$/);
assert.ok(existsSync(join(__dirname, '../../static', photo.path)));
assert.equal(new URL(photo.source).protocol, 'https:');
assert.ok(Number.isInteger(basket.budget_cents) && basket.budget_cents > 0 && basket.budget_cents <= 99999);
assert.ok(basket.items.length >= 2);
assert.equal(new Set(basket.items.map(item => item.id)).size, basket.items.length);
for (const item of basket.items) {
  slug(item.id);
  text(item.name);
  assert.ok(Number.isInteger(item.cents) && item.cents > 0 && item.cents <= 99999);
  assert.ok(Number.isInteger(item.quantity) && item.quantity >= 0 && item.quantity <= 99);
}
assert.ok(basket.items.some(item => item.quantity > 0));
assert.ok(market.prices.length >= 3);
assert.ok(market.prices.every((price, index) => Number.isInteger(price) && price > (market.prices[index - 1] ?? 0)));
assert.ok(market.prices.includes(market.initial_price));
assert.ok(market.scenarios.length >= 2);
assert.equal(new Set(market.scenarios.map(scenario => scenario.id)).size, market.scenarios.length);
for (const scenario of market.scenarios) {
  slug(scenario.id);
  text(scenario.label);
  for (const series of [scenario.supply, scenario.demand]) {
    assert.equal(series.length, market.prices.length);
    assert.ok(series.every(value => Number.isInteger(value) && value >= 0));
  }
  assert.ok(scenario.supply.every((value, index) => !index || value >= scenario.supply[index - 1]));
  assert.ok(scenario.demand.every((value, index) => !index || value <= scenario.demand[index - 1]));
  assert.equal(scenario.supply.filter((value, index) => value === scenario.demand[index]).length, 1);
}
