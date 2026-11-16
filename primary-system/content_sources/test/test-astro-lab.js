'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const data=require('../astro-lab-data.js'),media=require('../astro-media-data.js');
const text=v=>assert.ok(typeof v==='string'&&v.trim()&&!/["\r\n]|<[a-z/]/i.test(v),v);
const url=v=>assert.equal(new URL(v).protocol,'https:');
assert.equal(data.moon.minYear,1900);assert.equal(data.moon.maxYear,2100);
for(const k of ['note','manualNote'])text(data.moon[k]);url(data.moon.source);
assert.equal(data.pluto.id,'pluto');assert.equal(data.pluto.category,'矮行星');
for(const p of [...media.planets,data.pluto]){
 assert.match(p.id,/^[a-z]+$/);text(p.name);text(p.fact);
 for(const k of ['diameter','period','periodDays'])assert.ok(Number.isFinite(p[k])&&p[k]>0,p.name+'.'+k);
 assert.ok(Number.isFinite(p.temperatureC));assert.ok(Math.abs(p.periodDays/365.25-p.period)<.01);
}
assert.equal(new Set([...media.planets,data.pluto].map(p=>p.id)).size,9);
for(const k of ['comparisonNote','temperatureNote','missionNote'])text(data[k]);
assert.equal(data.quiz.length,3);const qids=new Set();
for(const q of data.quiz){assert.ok(!qids.has(q.id));qids.add(q.id);text(q.question);text(q.explanation);assert.equal(q.options.length,3);assert.ok(q.options.some(o=>o.id===q.answer));assert.equal(new Set(q.options.map(o=>o.id)).size,3);q.options.forEach(o=>text(o.label));}
assert.equal(data.polaris.stars.length,7);assert.equal(data.polaris.steps.length,4);
for(const s of data.polaris.stars){text(s.name);assert.ok(s.point.length===2&&s.point.every(Number.isFinite));}
const [dubhe,merak]=data.polaris.stars,polaris=data.polaris.point;
for(let axis=0;axis<2;axis++)assert.equal(polaris[axis],dubhe.point[axis]+5*(dubhe.point[axis]-merak.point[axis]));
data.polaris.steps.forEach(s=>{text(s.title);text(s.note);});text(data.polaris.note);url(data.polaris.source);
assert.equal(data.missions.length,14);const mids=new Set();
for(const [i,m]of data.missions.entries()){
 assert.ok(!mids.has(m.id));mids.add(m.id);assert.match(m.date,/^\d{4}-\d{2}-\d{2}$/);assert.ok(Number.isFinite(Date.parse(m.date)));
 if(i)assert.ok(m.date>=data.missions[i-1].date,'里程碑按发生日期排列');
 assert.ok(['moon','mars'].includes(m.target));for(const k of ['name','nation','event','where','result'])text(m[k]);url(m.source);
}
assert.equal(data.missions.filter(m=>m.target==='moon').length,7);assert.equal(data.missions.filter(m=>m.target==='mars').length,7);
url(data.planetSource);url(data.engine.source);assert.equal(data.engine.version,'2.1.19');
const vendor=fs.readFileSync(path.join(__dirname,'../vendor/astronomy-engine/astronomy.browser.min.js'));
assert.equal(crypto.createHash('sha256').update(vendor).digest('hex'),data.engine.sha256);
assert.match(fs.readFileSync(path.join(__dirname,'../vendor/astronomy-engine/LICENSE.txt'),'utf8'),/MIT License/);
console.log('✅ 天文实验室：日期范围、九个天体、三道问答、找星几何、十四站时间线与本地引擎通过校验');
