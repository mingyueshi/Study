const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const base=path.join(__dirname,'../static/study_topics/geo-map');
const ctx=vm.createContext({console,Intl,Date,URLSearchParams});ctx.window=ctx;
for(const f of ['world-data','world-3d-data','world-3d-geometry','world-expeditions-data','world-outlines-data','world-voyages','world-explorers'])vm.runInContext(fs.readFileSync(path.join(base,f+'.js'),'utf8'),ctx);
const G=ctx.GMWorld3DGeometry,V=ctx.GMWorldVoyages,E=ctx.GMWorldExplorers,D=ctx.GM_WORLD_EXPEDITIONS;
const Clock=require('../static/study_topics/geo-map/china-river-tour.js');

test('两条航线站点递增，船的球面位置沿大圆弧移动，跨日期线不绕远路',()=>{
 for(const config of D.voyages){const route=V.buildRoute(config);assert.ok(route.length>10000);assert.equal(route.stops[0].distance,0);assert.equal(route.stops.at(-1).distance,route.length);
  assert.ok(route.stops.every((s,i)=>!i||s.distance>route.stops[i-1].distance));
  for(const stop of route.stops){const p=V.position(route,stop.distance).point;assert.ok(G.angle(p,stop.point)<1e-7,stop.name);}
  for(let i=0;i<=100;i++){const p=V.position(route,route.length*i/100).point;assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...G.xyz(p))-1)<1e-8);}
 }
 const crossing={stops:[{point:[170,0]},{point:[-170,0],via:[[-170,0]]}]},r=V.buildRoute(crossing);
 assert.ok(Math.abs(r.length-6371*Math.PI/9)<1e-7);assert.ok(Math.abs(V.position(r,r.length/2).point[0])>179.9);
});

test('球面漫游复用停站时钟，暂停、旧帧、逐站和完成不影响中国默认定位器',()=>{
 const route=V.buildRoute(D.voyages[0]);let id=0,time=0,available=true;const frames=new Map(),moves=[];
 const clock=Clock.createTour({route,positionAt:V.position,holdSeconds:.2,travelSeconds:2,request:f=>{frames.set(++id,f);return id;},cancel:i=>frames.delete(i),canPlay:()=>available,moved:p=>moves.push(p),changed(){}});
 const advance=n=>{for(let i=0;i<n&&frames.size;i++){const [key,f]=frames.entries().next().value;frames.delete(key);f(time);time+=100;}};
 clock.play();advance(8);assert.ok(clock.snapshot().distance>0);const stale=[...frames.values()][0];clock.pause();const before=clock.snapshot().distance;stale(999999);assert.equal(clock.snapshot().distance,before);
 clock.jump(3);assert.ok(G.angle(moves.at(-1).point,route.stops[3].point)<1e-7);
 available=false;clock.play();assert.equal(frames.size,0);available=true;clock.play();advance(100);assert.equal(clock.snapshot().phase,'complete');assert.equal(frames.size,0);
});

test('北京时间早上八点时纽约冬季前日十九点、夏季前日二十点；日期和半小时偏移正确',()=>{
 assert.equal(E.zonedTime('2026-01-15',0,'Asia/Shanghai').text,'08：00');
 const winter=E.zonedTime('2026-01-15',0,'America/New_York'),summer=E.zonedTime('2026-07-15',0,'America/New_York');
 assert.equal(winter.text,'19：00');assert.equal(winter.day,-1);assert.equal(winter.date,'01月14日');assert.equal(summer.text,'20：00');
 assert.equal(E.zonedTime('2026-01-15',0,'Asia/Kolkata').text,'05：30');
 assert.equal(E.zonedTime('2026-01-31',23,'Asia/Tokyo').date,'02月01日');
 assert.equal(E.zonedTime('2026-02-30',0,'UTC'),null);assert.equal(E.zonedTime('',0,'UTC'),null);
});

test('多点行程累加各段短弧，回到起点仍保留环线里程，零点与单点为零',()=>{
 assert.equal(E.itinerary([]).total,0);assert.equal(E.itinerary([[0,0]]).total,0);
 const trip=E.itinerary([[0,0],[90,0],[90,90],[0,0]]);assert.equal(trip.legs.length,3);assert.ok(Math.abs(trip.total-6371*Math.PI*1.5)<1e-8);
 assert.ok(E.itinerary([[170,0],[-170,0]]).total<2300);
});

test('七洲轮廓是有效闭合路径，南极和跨日期线轮廓都能投影到画框内',()=>{
 for(const c of ctx.GM_WORLD_OUTLINES.continents){const d=E.outlinePath(c);assert.ok(d.startsWith('M')&&d.endsWith('Z'));assert.ok(!/NaN|Infinity/.test(d));
  const numbers=d.match(/-?\d+(?:\.\d+)?/g).map(Number);numbers.forEach((n,i)=>assert.ok(n>0&&n<(i%2?320:500),c.id));
 }
});
