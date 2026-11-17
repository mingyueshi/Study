'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.window={};global.document={currentScript:{src:'https://study.local/static/study_topics/history-timeline/civilizations-shared.js'}};
require('../content_sources/history-timeline/media-data.js');
require('../content_sources/history-timeline/civilizations-data.js');
require('../content_sources/history-timeline/shared.js');
require('../content_sources/history-timeline/civilizations-shared.js');
const H=window.HistoryCivilizations;
test('search finds civilizations by names, regions and focused knowledge',()=>{
  assert.equal(H.filter().length,8);
  assert.deepEqual(H.filter('玛 雅').map(c=>c.id),['maya']);
  assert.ok(H.filter('字母','writing').some(c=>c.id==='greece'));
  assert.ok(H.filter('奴隶','governance').some(c=>c.id==='greece'));
  assert.equal(H.filter('<script>').length,0);
});
test('comparison URLs recover safely and keep two distinct civilizations',()=>{
  let state=H.readState(new URLSearchParams('view=compare&left=maya&right=maya&theme=writing'));
  assert.equal(state.left,'maya');assert.notEqual(state.right,'maya');assert.equal(state.theme,'writing');
  state=H.choose(state,'right','maya');assert.equal(state.right,'maya');assert.notEqual(state.left,'maya');
  const invalid=H.readState(new URLSearchParams('left=unknown&right=unknown&theme=unknown&view=unknown'));
  assert.equal(invalid.view,'catalog');assert.equal(invalid.theme,'all');assert.notEqual(invalid.left,invalid.right);
  assert.equal(H.choose(state,'other','egypt'),state);
  assert.equal(H.choose(state,'left','unknown'),state);
});
test('deep links, event backlinks and shared image metadata use stable IDs',()=>{
  const maya=H.civMap.get('maya');
  assert.equal(H.detailHref(maya,'writing'),'civilization.html?civilization=maya#station-maya-writing');
  assert.deepEqual(H.forEvent('tw22').map(c=>c.id),['maya']);assert.deepEqual(H.forEvent('unknown'),[]);
  assert.equal(H.imagesFor(H.civMap.get('egypt'))[0].src,window.TIMELINE_MEDIA.tw4[0].src);
  const html=H.comparisonHTML(H.readState(new URLSearchParams('view=compare&theme=writing')));
  assert.ok(html.includes('station-egypt-writing'));assert.ok(!html.includes('station-egypt-governance'));
  assert.ok(H.imageHTML(H.imagesFor(maya)[0]).includes('https://study.local/static/study_topics/history-timeline/assets/'));
});
