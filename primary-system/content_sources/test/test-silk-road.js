'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.window={};global.document={currentScript:null};
for(const f of ['content','timeline-data','people-data','media-data','silk-road-data','silk-road-geo'])require('../history-timeline/'+f+'.js');
require('../history/knowledge-dynasties.js');require('../history/media.js');
const D=window.SILK_ROAD,G=window.SILK_ROAD_GEO;let checks=0;
const check=(v,m)=>{checks++;assert.ok(v,m);},text=v=>typeof v==='string'&&v.trim()&&!/[\r\n]/.test(v),id=v=>typeof v==='string'&&/^[a-z][a-z0-9-]*$/.test(v);
const unique=items=>new Set(items).size===items.length,point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=40&&p[0]<=126&&p[1]>=-8&&p[1]<=49;
const sources=ids=>Array.isArray(ids)&&ids.length&&unique(ids)&&ids.every(k=>D.sources[k]);
const cities=new Set(D.cities.map(c=>c.id)),goods=new Set(D.goods.map(g=>g.id)),routes=new Set(D.routes.map(r=>r.id)),exchange=new Set(D.exchanges.map(e=>e.id));
const people=new Set(window.HISTORY_PEOPLE.people.map(p=>p.id)),events=new Set(window.TIMELINE_EVENTS.map(e=>e.id)),eras=new Set(window.TIMELINE_ERAS.map(e=>e.id));
check(D.cities.length===12&&cities.size===12&&D.routes.length===2&&routes.has('land')&&routes.has('sea'),'两类路线与十二座城市应有稳定编号');
for(const [key,s]of Object.entries(D.sources))check(id(key)&&text(s.title)&&text(s.publisher)&&/^https:\/\/\S+$/.test(s.url),key+' 出处无效');
for(const c of D.cities){
 check(id(c.id)&&routes.has(c.route)&&point(c.point)&&Number.isInteger(c.year)&&c.year!==0&&sources(c.sources),c.id+' 位置、分类或出处无效');
 for(const f of ['name','alias','period','role','geography','trade','question','answer'])check(text(c[f]),c.id+' 缺少 '+f);
 check(c.evidence&&['title','text','limits'].every(k=>text(c.evidence[k])),c.id+' 应有材料与边界');
 check(c.images.every(k=>D.images[k]),c.id+' 图像引用无效');
}
for(const r of D.routes){
 check(id(r.id)&&r.stops.length>=6&&unique(r.stops)&&r.stops.every(k=>cities.has(k)&&D.cities.find(c=>c.id===k).route===r.id),r.id+' 城市顺序无效');
 for(const f of ['title','period','lead','question','mechanism','limits'])check(text(r[f]),r.id+' 缺少 '+f);
 check(/^#[a-f0-9]{6}$/i.test(r.color)&&Number.isInteger(r.year)&&eras.has(r.era)&&sources(r.sources),r.id+' 年代或出处无效');
 check(r.goods.every(k=>goods.has(k))&&r.exchanges.every(k=>exchange.has(k))&&r.eventIds.every(k=>events.has(k))&&r.people.every(k=>people.has(k)),r.id+' 关联无效');
 check(r.branches.length>=2&&r.branches.every(b=>id(b.id)&&text(b.title)&&text(b.note)&&b.points.length>=3&&b.points.every(point)),r.id+' 路线应有分支与位置');
}
for(const g of D.goods){check(id(g.id)&&sources(g.sources)&&g.routes.every(k=>routes.has(k))&&g.cities.every(k=>cities.has(k)),g.id+' 商品关联无效');for(const f of ['name','icon','flow','logistics','evidence','boundary'])check(text(g[f]),g.id+' 缺少 '+f);}
check(D.goods.length>=6&&D.exchanges.length>=4,'商品与交流应覆盖多个维度');
for(const e of D.exchanges){check(id(e.id)&&sources(e.sources)&&e.routes.every(k=>routes.has(k))&&e.images.every(k=>D.images[k]),e.id+' 交流关联无效');for(const f of ['title','mechanism','evidence','question','answer'])check(text(e[f]),e.id+' 缺少 '+f);}
for(const m of D.milestones)check(Number.isInteger(m.year)&&m.year!==0&&text(m.label)&&text(m.text)&&(!m.eventId||events.has(m.eventId)),'年代节点无效');
check(D.resources.lesson==='hu5-3'&&window.HISTORY_LESSONS_DYNASTIES.some(l=>l.id===D.resources.lesson),'应复用现有精讲编号');
for(const file of [D.resources.audio,D.resources.transcript])check(fs.existsSync(path.resolve(__dirname,'../history-timeline',file)),'本地音频或文字稿缺失');
for(const [key,i]of Object.entries(D.images)){
 if(i.mediaEvent){check(window.TIMELINE_MEDIA[i.mediaEvent]?.[0]?.type==='image',key+' 共享素材无效');continue;}
 if(i.lessonImage){check(window.HISTORY_MEDIA[i.lessonImage],key+' 精讲素材无效');continue;}
 for(const field of ['title','alt','caption','credit','license','source'])check(text(i[field]),key+' 缺少 '+field);
 check(/^https:\/\//.test(i.source)&&[i.width,i.height].every(n=>Number.isInteger(n)&&n>0),key+' 图片来源或尺寸无效');
 const bytes=fs.readFileSync(path.resolve(__dirname,'../history-timeline',i.src));check(bytes[0]===255&&bytes[1]===216,key+' 应保存实际 JPG 图像');
}
check(G.land.length>10&&G.land.every(r=>r.length>=4&&r.every(point)),'本地自然陆地轮廓应完整有效');
check(text(G.meta.source)&&text(G.meta.license)&&G.labels.every(l=>text(l.text)&&point(l.point)),'底图来源与标签应有效');
console.log(`丝绸之路：${D.routes.length} 类路线、${D.cities.length} 座城市、${D.goods.length} 类贸易品、${D.exchanges.length} 组交流；${checks} 项检查通过。`);
