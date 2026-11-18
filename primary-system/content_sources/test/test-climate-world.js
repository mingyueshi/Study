'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.join(__dirname, '../climate');
const data = require('../climate/climate-data.js');
const model = require('../climate/climate-model.js');
const stations = require('../climate/station-normals.js');
const grid = require('../climate/china-climate-grid.js');

function ids(items) {
  const result = new Set();
  for (const item of items) {
    assert.match(item.id, /^[a-z][a-z-]*$/);
    assert.ok(!result.has(item.id), item.id);
    result.add(item.id);
  }
  return result;
}

const sources = ids(data.sources);
for (const source of data.sources) {
  assert.ok(source.title && source.note);
  assert.equal(new URL(source.url).protocol, 'https:');
}
const photos = ids(data.photos);
for (const photo of data.photos) {
  assert.match(photo.file, /^assets\/[a-z-]+\.(jpg|webp)$/);
  assert.ok(photo.alt && photo.credit && sources.has(photo.source));
  assert.equal(new URL(photo.original).protocol, 'https:');
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, photo.file))).digest('hex'), photo.sha256);
}
ids(data.pages);
assert.deepEqual(data.pages.map(p => p.id), ['index', 'weather', 'types', 'china']);
for (const page of data.pages) {
  assert.ok(page.title && page.intro && page.question && page.answer);
  assert.ok(page.cards.length >= 2 && page.cards.every(c => c.title && c.text));
  assert.ok(page.sources.length && page.sources.every(id => sources.has(id)));
  assert.ok(fs.existsSync(path.join(root, page.id + '.html')));
}

ids(data.weather);
assert.ok(data.weather.every(p => p.name && p.detail && p.observe && (!p.photo || photos.has(p.photo))));
const stationIds = ids(stations);
assert.equal(stations.length, 11);
for (const station of stations) {
  assert.match(station.number, /^\d{4,5}$/);
  assert.ok(station.name && station.type && station.note && Number.isFinite(station.elevation));
  assert.ok(Math.abs(station.lon) <= 180 && Math.abs(station.lat) <= 90);
  assert.equal(station.temperature.length, 12);
  assert.equal(station.precipitation.length, 12);
  assert.ok(station.temperature.every(t => Number.isFinite(t) && t >= -40 && t <= 40));
  assert.ok(station.precipitation.every(p => Number.isFinite(p) && p >= 0 && p <= 400));
}
ids(data.zones);
assert.equal(data.zones.length, 5);
assert.ok(data.zones.every(z => stationIds.has(z.station) && z.title && z.region && z.text));
assert.ok(data.zones.every(z => stations.find(s => s.id === z.station).group === 'china'));
assert.ok(data.comparisons.every(c => stationIds.has(c.first) && stationIds.has(c.second) && c.first !== c.second));
assert.deepEqual(data.classes.map(c => c.id), ['a','b','c','d','e']);
assert.equal(data.codes.length, 31);
assert.equal(grid.rows.length, (grid.north - grid.south) / grid.step);
assert.ok(grid.rows.every(row => row.length === (grid.east - grid.west) / grid.step && /^[0-9a-u]+$/.test(row)));
assert.equal(new Set(grid.rows.join('')).size > 20, true);
// 抽查东南、内陆、高原和东北，防止裁切时颠倒南北或误读分类编码。
for (const [lon, lat, major] of [[110.375,19.875,'A'],[83.125,40.125,'B'],[118.875,32.125,'C'],[122.125,47.125,'D'],[90.125,34.125,'E']]) {
  assert.equal(data.codes[model.cellAt(grid, lon, lat)][0], major);
}
assert.equal(model.cellAt(grid, -1, 0), 0);
assert.equal(model.cellAt(grid, grid.east, grid.north), 0);
assert.equal(model.condensation(13, 12), 'clear');
assert.equal(model.condensation(12, 12), 'saturated');
assert.equal(model.condensation(8, 12), 'droplets');
const beijing = model.statistics(stations.find(s => s.id === 'beijing'));
assert.equal(beijing.tempRange, 30);
assert.equal(beijing.wettest, 6);
assert.ok(beijing.warmHalfShare > .8);
console.log('气象与气候：页面、图片、11 站常年值、裁切分类格网与模型通过校验');
