'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const dir = path.join(__dirname, '../ocean');
const data = require('../ocean/ocean-data.js');
const model = require('../ocean/ocean-model.js');

function index(items) {
  const ids = new Set();
  for (const item of items) {
    assert.match(item.id, /^[a-z][a-z-]*$/);
    assert.ok(!ids.has(item.id), '重复 ID ' + item.id);
    ids.add(item.id);
  }
  return ids;
}

const sources = index(data.sources);
for (const source of data.sources) {
  assert.ok(source.title && source.note);
  assert.equal(new URL(source.url).protocol, 'https:');
}
const media = index(data.media);
for (const photo of data.media) {
  assert.ok(photo.alt && photo.credit && sources.has(photo.source));
  assert.match(photo.file, /^assets\/[a-z-]+\.jpg$/);
  assert.equal(new URL(photo.original).protocol, 'https:');
  const bytes = fs.readFileSync(path.join(dir, photo.file));
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), photo.sha256);
}
index(data.pages);
assert.deepEqual(data.pages.map(p => p.id), ['index','currents','tides','life','seafloor']);
for (const page of data.pages) {
  assert.ok(page.title && page.intro && page.question && page.answer);
  assert.ok(page.cards.length >= 2 && page.cards.every(c => c.title && c.text));
  assert.ok(page.sources.length && page.sources.every(id => sources.has(id)));
  assert.ok(fs.existsSync(path.join(dir, page.id + '.html')));
}
index(data.currents);
for (const current of data.currents) {
  assert.ok(current.title && current.direction && current.text);
  assert.ok(['warm', 'cold', 'circumpolar'].includes(current.kind));
  assert.ok(current.points.length >= 2);
  for (const [lon, lat] of current.points) {
    assert.ok(Number.isFinite(lon) && lat >= -70 && lat <= 80);
  }
  current.points.slice(1).forEach(([lon, lat], i) => {
    const [previousLon, previousLat] = current.points[i];
    assert.ok(Math.abs(lon - previousLon) < 180);
    assert.ok(lon !== previousLon || lat !== previousLat);
  });
}
index(data.phases);
assert.deepEqual(data.phases.map(p => p.angle), [0, 90, 180, 270]);
assert.ok(data.phases.every(p => p.title && p.text));
index(data.layers);
assert.deepEqual(data.layers.map(l => l.from), [0, 200, 1000, 6000]);
assert.ok(data.layers.every(l => l.title && l.text && l.light && (!l.photo || media.has(l.photo))));
assert.ok(media.has(data.vent.photo) && data.vent.title && data.vent.text);
for (const layer of data.layers) assert.equal(model.layerAt(data.layers, layer.example), layer);
assert.equal(model.layerAt(data.layers, 199).id, 'sunlit');
assert.equal(model.layerAt(data.layers, 200).id, 'twilight');
assert.equal(model.layerAt(data.layers, 6000).id, 'hadal');
index(data.profiles);
for (const profile of data.profiles) {
  assert.equal(profile.points[0][0], 0);
  const end = profile.points.at(-1)[0];
  profile.points.forEach(([km, depth], i) => {
    assert.ok(Number.isFinite(depth) && depth >= 0 && depth <= 11000);
    if (i) assert.ok(km > profile.points[i - 1][0]);
  });
  index(profile.stops);
  assert.ok(profile.stops.every(s => s.km >= 0 && s.km <= end && s.title && s.text));
  for (const [km, depth] of profile.points) assert.equal(model.depthAt(profile.points, km), depth);
}
const {tide, depthAt, trace, positionAt, nearestOnRoute} = model;
assert.equal(tide(0, 0).height, tide(180, 745).height);
assert.equal(tide(90, 0).range, tide(270, 1490).range);
assert.ok(tide(0, 0).range > tide(90, 0).range);
assert.ok(Math.abs(tide(0, 1490 / 4).height + 1.7) < 1e-9);
assert.equal(depthAt([[0, 50], [200, 150]], 150), 125);
const wrapped = trace([[358, 130], [362, 130]]);
assert.equal(positionAt(wrapped, .5).x, 360);
assert.deepEqual(nearestOnRoute(wrapped, 361, 131), {distance:1, fraction:.75});
for (const [page, choice, drawings] of [
  ['currents', 'current-choices', ['ocean-map', 'current-position', 'current-result']],
  ['tides', 'phase-choices', ['tide-alignment', 'tide-chart', 'tide-time', 'tide-result']],
]) {
  const [sidebar, content] = fs.readFileSync(path.join(dir, page + '.html'), 'utf8').split('</aside>');
  assert.match(sidebar, /data-sidebar-layout="\.experiment-side"/);
  assert.ok(sidebar.includes(`id="${choice}"`), choice + ' 位于侧栏');
  for (const drawing of drawings) assert.ok(content.includes(`id="${drawing}"`), drawing + ' 位于主区');
  assert.match(content, /data-play[\s\S]*data-step[\s\S]*data-reset[\s\S]*data-progress/);
}
console.log('海洋世界：页面、来源、图像、洋流坐标、月相、水层、剖面及实验布局通过校验');
