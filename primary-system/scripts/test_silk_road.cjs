'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.window={};global.document={currentScript:{src:'https://study.local/static/study_topics/history/media.js'},querySelector:()=>null};
require('../content_sources/history/media.js');require('../content_sources/history/knowledge-dynasties.js');
for(const name of ['media-data','silk-road-data','silk-road-geo','shared'])require('../content_sources/history-timeline/'+name+'.js');
document.currentScript.src='https://study.local/static/study_topics/history-timeline/silk-road-shared.js';
require('../content_sources/history-timeline/silk-road-shared.js');
const H=window.SilkRoad;
test('city search understands ancient names, geography and route filters',()=>{
 assert.equal(H.filter().length,12);assert.equal(H.filter('','land').length,6);assert.equal(H.filter('','sea').length,6);
 assert.deepEqual(H.filter('刺 桐').map(c=>c.id),['quanzhou']);assert.deepEqual(H.filter('calicut').map(c=>c.id),['calicut']);
 assert.ok(H.filter('绿洲','land').length>=3);assert.equal(H.filter('<script>').length,0);assert.equal(H.filter('古里','land').length,0);
});
test('URL restoration rejects missing and conflicting route/city pairs',()=>{
 const sea=H.readState(new URLSearchParams('route=sea&city=hormuz&focus=city&q=港'));assert.equal(sea.city,'hormuz');assert.equal(sea.focus,true);assert.equal(sea.query,'港');
 const conflict=H.readState(new URLSearchParams('route=land&city=aden'));assert.equal(conflict.city,'changan');
 const invalid=H.readState(new URLSearchParams('route=bad&city=bad&focus=bad'));assert.equal(invalid.route,'all');assert.equal(invalid.city,'changan');assert.equal(invalid.focus,false);
 const land=H.selectRoute(sea,'land');assert.equal(land.city,'changan');assert.equal(land.focus,false);assert.equal(land.query,'港');
 assert.equal(H.selectRoute(sea,'bad'),sea);
});
test('city browsing stays inside its route and clamps at the two ends',()=>{
 const start=H.readState(new URLSearchParams('route=land'));assert.equal(H.adjacent(start,-1),'changan');assert.equal(H.adjacent(start,1),'luoyang');
 const end={...start,city:'samarkand'};assert.equal(H.adjacent(end,1),'samarkand');
 assert.equal(H.selectRoute(end,'all').city,'samarkand');
 const sea=H.readState(new URLSearchParams('route=sea'));assert.equal(sea.city,'quanzhou');assert.equal(H.adjacent(sea,1),'guangzhou');
});
test('projection keeps north up and east right; focused view stays inside map bounds',()=>{
 assert.ok(H.project([110,30])[0]>H.project([70,30])[0]);assert.ok(H.project([110,40])[1]<H.project([110,20])[1]);
 for(const city of H.data.cities){const [x,y,w,h]=H.viewport({city:city.id,focus:true}).split(' ').map(Number);assert.ok(x>=0&&y>=0&&x+w<=1010&&y+h<=745);}
 const land=H.mapHTML(H.readState(new URLSearchParams('route=land'))),sea=H.mapHTML(H.readState(new URLSearchParams('route=sea')));
 assert.equal((land.match(/data-map-city=/g)||[]).length,6);assert.equal((sea.match(/data-map-city=/g)||[]).length,6);
 assert.ok(land.includes('查看敦煌')&&!land.includes('查看古里'));assert.ok(sea.includes('查看古里')&&!sea.includes('查看长安'));
});
test('shared lesson, audio, image provenance and stable backlinks stay connected',()=>{
 assert.equal(H.lesson,window.HISTORY_LESSONS_DYNASTIES.find(l=>l.id==='hu5-3'));
 assert.equal(H.lessonHref('hu5-3'),'../history/index.html#lesson-hu5-3');
 assert.equal(H.resolveImage('chart'),window.TIMELINE_MEDIA.tc27[0]);
 assert.equal(H.resolveImage('ship').src,'https://study.local/static/study_topics/history/assets/zhenghe-ship.jpg');
 assert.equal(H.forEvent('tc14')[0].id,'land');assert.equal(H.forEvent('tc27')[0].id,'sea');assert.equal(H.forPerson('zhang-qian')[0].id,'land');
 assert.equal(H.cityHref(H.cityMap.get('quanzhou'),'city-evidence'),'silk-city.html?city=quanzhou#city-evidence');
 assert.ok(H.imageHTML('mogao').includes('assets/silk-road/mogao.jpg'));
});
