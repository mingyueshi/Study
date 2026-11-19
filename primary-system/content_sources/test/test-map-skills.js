'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const data = require('../map-skills/skills-data.js');
const model = require('../map-skills/skills-model.js');
const root = path.join(__dirname, '../map-skills');
const {terrain, points, symbols, route, presets, forms, pages} = data;

function ids(items) {
  const result = items.map(item => item.id);
  assert.equal(new Set(result).size, items.length, '标识不能重复');
  assert.ok(result.every(id => /^[a-z][a-z-]*$/.test(id)));
  return new Set(result);
}

function inMap([x, y]) {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= terrain.width && y >= 0 && y <= terrain.height;
}

const sources = ids(data.sources);
assert.ok(data.sources.every(s => s.title && new URL(s.url).protocol === 'https:'));
ids(pages);
assert.deepEqual(pages.map(p => p.id), ['index','scale','direction','legend','contours','profile']);
for (const page of pages) {
  assert.ok(page.title && page.intro && page.quiz.prompt && page.quiz.reveal);
  assert.ok(page.cards.length >= 2 && page.cards.every(c => c.title && c.text));
  assert.ok(page.sources.length && page.sources.every(id => sources.has(id)));
  assert.ok(page.quiz.options.length === 3 && page.quiz.answer >= 0 && page.quiz.answer < 3);
  assert.ok(fs.existsSync(path.join(root, page.id + '.html')));
}
const pointIds = ids(points);
const symbolIds = ids(symbols);
assert.ok(points.every(p => p.name && symbolIds.has(p.symbol) && inMap(p.at)));
assert.ok(route.nodes.length > 2 && route.nodes.every(inMap));
assert.ok(route.ends.length === 2 && route.ends.every(id => pointIds.has(id)));
assert.ok(forms.every(f => inMap(f.at) && f.name && f.text));
assert.ok(presets.every(p => inMap(p.a) && inMap(p.b) && model.distance(p.a, p.b) > 0));
for (const sample of data.samples) {
  assert.match(sample.file, /^assets\/[a-z-]+\.(jpg|png)$/);
  assert.ok(sample.alt && sample.note && sources.has(sample.source));
  assert.equal(new URL(sample.original).protocol, 'https:');
  const bytes = fs.readFileSync(path.join(root, sample.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sample.sha256);
}

assert.equal(model.distance([0,0],[300,400]), 500);
assert.equal(model.paperCm(500, 10000), 5);
assert.equal(model.groundMeters(5, 10000), 500);
assert.equal(model.azimuth([0,0],[1,1]), 45);
assert.equal(model.azimuth([1,1],[0,0]), 225);
assert.equal(model.azimuth([0,0],[0,0]), null);
assert.equal(model.sector(315), '西北');
for (const rotation of [0, 90, 180, 270]) {
  const view = model.view(terrain, 680, 455, rotation);
  for (const point of [[0,0],[terrain.width,terrain.height],[200,155]]) {
    const back = view.unproject(view.project(point));
    assert.ok(model.distance(back, point) < 1e-8);
  }
}

const surface = model.createSurface(terrain);
assert.equal(terrain.width % terrain.step, 0);
assert.equal(terrain.height % terrain.step, 0);
assert.equal(terrain.valley.head % terrain.step, 0);
let previousHeight = surface.elevation([model.riverEast(terrain,0),0]);
for (let y = 1; y <= terrain.valley.head; y++) {
  const start = Math.floor((y-1)/terrain.step)*terrain.step;
  const end = start+terrain.step;
  const point = model.lerp([model.riverEast(terrain,start),start],[model.riverEast(terrain,end),end],(y-start)/terrain.step);
  const height = surface.elevation(point);
  assert.ok(height > previousHeight, '溪流由图中源头向南流经较低点');
  previousHeight = height;
}
const triangle = [[0,0,0],[10,0,10],[0,10,20]];
assert.deepEqual(model.contourSegment(triangle, 10), [[10,0],[0,5]]);
assert.equal(model.contourSegment(triangle, 25), null);
assert.ok(surface.contours(40).every(group => group.height % 40 === 0 && group.lines.length > 0));
const set = surface.contours(20);
assert.ok(set.length > surface.contours(40).length);
const {a,b} = presets[0];
const profile = surface.profile(a,b,40);
const reverse = surface.profile(b,a,40);
assert.equal(profile.length, reverse.length);
assert.equal(profile.points[0].height, reverse.points.at(-1).height);
assert.equal(profile.points.at(-1).height, reverse.points[0].height);
assert.ok(profile.crossings.length >= 6);
assert.ok(profile.crossings.every(p => Math.abs(surface.elevation(p.at) - p.height) < 1e-6));
assert.ok(profile.crossings.every((p,i) => i === 0 || p.t > profile.crossings[i - 1].t));
assert.ok(profile.points.some((p,i) => i > 0 && i < profile.points.length - 1 && p.height > 200));
for (const [id, parameters, readings] of [
  ['scale', ['scale-choices', 'paper-cm', 'reset-scale'], ['measure-title', 'scale-result', 'paper-result']],
  ['contours', ['interval-choices', 'form-choices', 'reset-contours'], ['contour-title', 'contour-result']],
  ['profile', ['profile-presets', 'show-crossings', 'reset-profile'], ['profile-title', 'profile-chart', 'profile-probe', 'profile-reading']],
]) {
  const [sidebar, content] = fs.readFileSync(path.join(root, id + '.html'), 'utf8').split('</aside>');
  assert.match(sidebar, /data-sidebar-layout="\.experiment-side"/);
  for (const parameter of parameters) assert.ok(sidebar.includes(`id="${parameter}"`), parameter + ' 位于侧栏');
  for (const reading of ['skills-map', ...readings]) assert.ok(content.includes(`id="${reading}"`), reading + ' 位于主区');
}
console.log('地图技能：题目、坐标、素材、距离与方位、等高线、剖面交点及实验布局通过校验');
