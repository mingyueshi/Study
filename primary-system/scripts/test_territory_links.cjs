'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
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
