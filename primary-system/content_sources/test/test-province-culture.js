'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
global.window = {};
require('../geo-map/map-data.js');
require('../geo-map/china-geo.js');
require('../geo-map/map-discovery-data.js');
require('../geo-map/province-culture-data.js');
const data = window.GM_PROVINCE_CULTURE;
const provinces = window.GM_PROVINCES;
assert.equal(data.version, 1);
for (const key of ['title', 'intro', 'scopeNote', 'capitalNote']) assert.equal(typeof data[key], 'string');
assert.equal(data.provinces.length, 34);
assert.deepEqual(data.provinces.map(p => p.adcode).sort(), provinces.map(p => p.adcode).sort());
const sources = new Map(data.sources.map(s => [s.id, s]));
assert.equal(sources.size, data.sources.length);
for (const s of sources.values()) {
  assert.ok(s.title && s.scope && /^https:\/\//.test(s.url), s.id);
  assert.match(s.checked, /^\d{4}-\d{2}-\d{2}$/);
}
let items = 0;
for (const entry of data.provinces) {
  const province = provinces.find(p => p.adcode === entry.adcode);
  assert.ok(window.GEO_CHINA_GEO.provinces[entry.adcode], province.name + ' 地图边界可复用');
  assert.ok(window.GM_MAP_DISCOVERY.provinces[province.id]?.point.length === 2, province.name + ' 中心参考点');
  assert.ok(entry.shortNames.includes(province.short), province.name + ' 保留既有简称');
  assert.equal(new Set(entry.shortNames).size, entry.shortNames.length);
  assert.ok(entry.shortNames.every(x => typeof x === 'string' && x.length));
  assert.ok(entry.question && entry.explanation, province.name + ' 观察问题');
  for (const kind of ['specialties', 'customs', 'landscapes']) {
    assert.ok(Array.isArray(entry[kind]) && entry[kind].length >= (kind === 'customs' ? 1 : 2), province.name + ' ' + kind);
    for (const item of entry[kind]) {
      assert.ok(item.name && item.detail && item.location, province.name + ' 条目完整');
      assert.ok(item.sources.length && item.sources.every(id => sources.has(id)), province.name + ' 出处有效');
      items++;
    }
  }
  for (const text of [entry.question, entry.explanation, ...['specialties','customs','landscapes'].flatMap(k => entry[k].flatMap(i => [i.name,i.detail,i.location]))]) {
    assert.ok(!/[<>\r\n"]/.test(text), province.name + ' 正文安全');
  }
}
const dir = path.join(__dirname, '../geo-map');
const page = fs.readFileSync(path.join(dir, 'province-culture.html'), 'utf8');
for (const dep of ['province-culture-data.js','province-culture.js','province-culture.css','china-geo.js','map-data.js','shared.js']) assert.ok(page.includes(dep));
assert.ok(!/<select\b/.test(page), '直接点选，不用下拉');
assert.ok(page.includes('class="gm-sidebar"') && page.includes('id="content" class="gm-content"'));
console.log(`省份文化校验通过：34 个省级行政区，${items} 项文化条目，${sources.size} 项来源。`);
