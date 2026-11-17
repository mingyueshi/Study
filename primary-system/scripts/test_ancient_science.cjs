'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.window={};global.document={currentScript:{src:'https://study.local/static/study_topics/history-timeline/ancient-science-shared.js'}};
for(const file of ['media-data','people-data','ancient-science-data','shared','ancient-science-shared'])require('../content_sources/history-timeline/'+file+'.js');
const H=window.AncientScience;
test('technology search combines category, person and principle vocabulary',()=>{
  assert.equal(H.filter().length,12);assert.equal(H.filter('','inventions').length,4);
  assert.ok(H.filter('祖 冲 之','mathematics').some(t=>t.id==='pi'));
  assert.deepEqual(H.filter('飞沙堰').map(t=>t.id),['dujiangyan']);
  assert.equal(H.filter('<script>').length,0);
  assert.equal(H.readState(new URLSearchParams('category=missing')).category,'all');
});
test('polygon perimeter bounds enclose pi and converge from both sides',()=>{
  let previous={lower:0,upper:Infinity};
  for(const n of H.data.demos.pi.sides){const b=H.piBounds(n);assert.ok(b.lower<Math.PI&&b.upper>Math.PI);assert.ok(b.lower>previous.lower&&b.upper<previous.upper);previous=b;}
  assert.ok(previous.upper-previous.lower<0.0005);
  assert.throws(()=>H.piBounds(0),RangeError);assert.throws(()=>H.piBounds(7),RangeError);
});
test('print state replaces one character and preserves orientation source text',()=>{
  assert.equal(H.printingState('type',2,false).text,'山水云天');
  assert.equal(H.printingState('type',2,true).text,'山水风天');
  assert.equal(H.printingState('block',9,true).stage,3);
  assert.equal(H.printingState('invalid',-1,false).mode,'type');
});
test('demonstration deep links restore supported values and reject invalid values',()=>{
  assert.deepEqual(H.readDemo(new URLSearchParams('sides=96&stage=3&mode=block&changed=1&water=high')),{sides:96,stage:3,mode:'block',changed:true,water:'high'});
  assert.deepEqual(H.readDemo(new URLSearchParams('sides=-1&stage=1.5&mode=wrong&water=wrong')),{sides:6,stage:0,mode:'type',changed:false,water:'low'});
});
test('stable links connect events, people and shared image provenance',()=>{
  const pi=H.topicMap.get('pi');assert.equal(H.detailHref(pi,'principle'),'technology.html?topic=pi#principle');
  assert.ok(H.forPerson('zu-chongzhi').includes(pi));assert.ok(H.forEvent('tc19').includes(pi));
  assert.deepEqual(H.forEvent('missing'),[]);
  const water=H.imagesFor(H.topicMap.get('dujiangyan'))[0];assert.equal(water,window.TIMELINE_MEDIA.tc12[0]);
  assert.equal(H.imagesFor(pi)[0].source,window.HISTORY_PEOPLE.people.find(p=>p.id==='zu-chongzhi').image.source);
  assert.ok(H.imageHTML(water).includes('https://study.local/static/study_topics/history-timeline/assets/'));
});
