'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const data = require('../earth/earth-data.js');
assert.equal(data.version, 1);
assert.deepEqual(data.pages.map(p => p.id), ['index', 'rocks', 'quakes', 'plates', 'age']);
const sources = new Map(data.sources.map(s => [s.id, s]));
assert.equal(sources.size, data.sources.length);
for (const source of sources.values()) {
  assert.ok(source.title && source.scope && /^https:\/\//.test(source.url));
  assert.match(source.checked, /^\d{4}-\d{2}-\d{2}$/);
}
const refs = items => {
  for (const item of items) {
    assert.ok(item.id && item.title, '稳定 ID 与标题');
    assert.ok(item.sources.length && item.sources.every(id => sources.has(id)), item.id + ' 出处');
  }
  assert.equal(new Set(items.map(i => i.id)).size, items.length);
};
refs(data.pages); refs(data.layers); refs(data.specimens); refs(data.boundaries); refs(data.events);
assert.equal(data.layers.length, 4);
assert.equal(data.layers[0].top, 0);
assert.equal(data.layers.at(-1).bottom, data.radiusKm);
data.layers.forEach((layer, i) => {
  assert.ok(layer.bottom > layer.top && layer.state && layer.material && layer.detail);
  if (i) assert.equal(layer.top, data.layers[i - 1].bottom);
});
assert.equal(data.specimens.length, 4);
assert.deepEqual(new Set(data.specimens.map(s => s.kind)), new Set(['矿物', '火成岩', '沉积岩', '变质岩']));
const media = new Map(data.media.map(m => [m.id, m]));
assert.equal(media.size, data.media.length);
for (const item of media.values()) {
  assert.match(item.src, /^assets\/[a-z-]+\.jpg$/);
  assert.ok(item.alt && item.credit && item.license && /^https:\/\//.test(item.url) && /^https:\/\//.test(item.download));
  const bytes = fs.readFileSync(path.join(__dirname, '../earth', item.src));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, item.id + ' 原始图片指纹');
  assert.ok(bytes.length > 5000);
}
for (const specimen of data.specimens) assert.ok(media.has(specimen.media) && specimen.detail && specimen.observe);
assert.ok(data.volcanoes.every(v => media.has(v.media) && v.title && v.detail));
const nodes = new Set(data.rockStates.map(s => s.id));
assert.equal(nodes.size, 5);
for (const edge of data.rockPaths) assert.ok(nodes.has(edge.from) && nodes.has(edge.to) && edge.process && edge.detail);
for (const id of nodes) assert.ok(data.rockPaths.some(e => e.from === id), id + ' 有后续路径');
assert.deepEqual(data.boundaries.map(b => b.id), ['divergent', 'subduction', 'collision', 'transform']);
for (const boundary of data.boundaries) assert.ok(boundary.result && boundary.example && boundary.detail && boundary.motion);
assert.equal(data.ageMa, 4540);
assert.equal(data.halfLifeMa, 4470);
assert.equal(data.events[0].ma, data.ageMa);
assert.equal(data.events.at(-1).ma, 0);
data.events.forEach((event, i) => {
  assert.ok(event.ma >= 0 && event.ma <= data.ageMa && event.detail);
  if (i) assert.ok(event.ma < data.events[i - 1].ma);
});
for (const page of data.pages) {
  assert.ok(page.eyebrow && page.intro && page.question && page.answer && page.cards.length >= 2);
  for (const card of page.cards) assert.ok(card.title && card.body);
  assert.ok(fs.existsSync(path.join(__dirname, '../earth', page.id + '.html')));
}
const [plateSidebar, plateContent] = fs.readFileSync(path.join(__dirname, '../earth/plates.html'), 'utf8').split('</aside>');
assert.match(plateSidebar, /data-sidebar-layout="\.experiment-side"/);
assert.match(plateSidebar, /id="boundary-picker"/);
assert.match(plateSidebar, /<header[^>]*id="earth-eyebrow"/);
for (const id of ['plate-lab', 'plate-diagram', 'boundary-detail', 'earth-explain', 'earth-side-question']) {
  assert.ok(plateContent.includes(`id="${id}"`), id + ' 位于主区');
}
assert.match(plateContent, /data-play[\s\S]*data-step[\s\S]*data-reset[\s\S]*data-progress/);
console.log('地球内部：5 个页面、4 层结构、4 类标本、4 种边界、时间线、本地图片及板块实验布局校验通过');
