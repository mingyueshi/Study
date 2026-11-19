'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
global.window={};require('../content_sources/history-timeline/territory-links.js');
const H=window.TerritoryLinks;
test('legacy map bookmarks preserve stage aliases and other query parameters',()=>{
 assert.equal(H.legacyHref('?map=han','#territory-maps'),'territory.html?map=han#territory-maps');
 assert.equal(H.legacyHref('?map=qing&from=timeline',''),'territory.html?map=qing&from=timeline#territory-maps');
 assert.equal(H.legacyHref('','#territory-maps'),'territory.html#territory-maps');
});
test('dynasty stories and calendar anchors keep their existing destinations',()=>{
 for(const hash of ['#dyn-qing','#dyn-han','#cal-title','#dyn-title'])assert.equal(H.legacyHref('?map=qing',hash),null);
 assert.equal(H.legacyHref('',''),null);assert.equal(H.legacyHref('?q=地图',''),null);
});
test('canonical map links keep stable IDs and safely encode unexpected input',()=>{
 assert.equal(H.mapHref('western-han'),'territory.html?map=western-han#territory-maps');
 assert.equal(H.mapHref(),'territory.html#territory-maps');
 assert.equal(new URL(H.mapHref('qing&play=1'),'https://study.local/').searchParams.get('map'),'qing&play=1');
});
test('朝代、阶段与对照位于侧栏，地图、时间轴与观察留在主区', () => {
 const page = fs.readFileSync(path.join(__dirname, '../content_sources/history-timeline/territory.html'), 'utf8');
 const [sidebar, content] = page.split('</aside>');
 assert.match(sidebar, /id="territory-maps" data-tl-anchor/);
 for (const id of ['territory-dynasties', 'territory-stages', 'territory-compare', 'territory-compare-select']) {
  assert.ok(sidebar.includes(`id="${id}"`), id);
 }
 for (const id of ['territory-svg', 'territory-range', 'territory-playback', 'territory-observe', 'territory-question']) {
  assert.ok(content.includes(`id="${id}"`), id);
 }
});
