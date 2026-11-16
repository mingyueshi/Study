const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({});ctx.window=ctx;const base=path.join(__dirname,'../static/study_topics/geo-map');
for(const f of ['map-discovery.js','china-terrain-section.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx);
const M=ctx.GMMapDiscovery,P=ctx.GMTerrainSection;
test('河流按分段弧长前进，数据缺口直接切换，不用虚构直线补河',()=>{
 const r=M.buildRiver([[[0,0],[2,0]],[[10,0],[10,3]]],[{id:'a',anchor:[0,0]},{id:'city',anchor:[10,1]},{id:'end',anchor:[10,3]}],p=>p.slice(0,2));
 assert.equal(r.length,5);assert.equal(r.tracks.length,2);assert.deepEqual(Array.from(M.atDistance(r,2).xy),[10,0]);assert.deepEqual(Array.from(M.atDistance(r,3).xy),[10,1]);assert.equal(r.stops[1].distance,3);assert.equal(r.stops.at(-1).distance,5);
});
test('长江与黄河实际站点沿源区到海口依次前进',()=>{
 for(const f of ['shared.js','china-rivers-data.js','china-river-tour-data.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx);
 for(const id of ['f20','f21']){
  const config=ctx.GM_CHINA_RIVER_TOURS.routes.find(r=>r.river===id),parts=ctx.GM_CHINA_RIVERS.rivers[id].paths;
  const route=M.buildRiver(parts,config.stops.filter(s=>s.kind!=='landform'),p=>ctx.GMShared.m(p[0],p[1]));
  assert.ok(route.length>0);assert.equal(route.tracks.length,parts.length);
  for(let i=1;i<route.stops.length;i++)assert.ok(route.stops[i].distance>route.stops[i-1].distance,route.stops[i].name+' 应在上一站下游');
  assert.equal(route.stops[0].distance,0);assert.equal(route.stops.at(-1).distance,route.length);
 }
});
test('有限回放到海口停止，暂停与旧帧不跳进度，重播和进度拖动互不抢控制',()=>{
 let id=0,now=0,available=true;const frames=new Map(),renders=[];
 const c=M.createReplay({request:f=>{frames.set(++id,f);return id;},cancel:i=>frames.delete(i),canPlay:()=>available,render:s=>renders.push(s),changed(){},duration:1});
 const tick=()=>{const [key,f]=frames.entries().next().value;frames.delete(key);f(now);now+=100;};
 c.play();tick();tick();const stale=[...frames.values()][0];c.pause();const before=c.state().progress;stale(999999);assert.equal(c.state().progress,before);
 c.seek(.6);assert.equal(c.state().progress,.6);assert.equal(frames.size,0);c.play();while(frames.size)tick();assert.equal(c.state().progress,1);assert.equal(c.state().playing,false);
 c.play();assert.equal(c.state().progress,0);available=false;tick();assert.equal(c.state().playing,false);assert.equal(frames.size,0);
 c.seek(-1);assert.equal(c.state().progress,0);c.seek(5);assert.equal(c.state().progress,1);
});
test('剖面探针读实际样本、保留负海拔，与A的高低比较不跨越空白补零',()=>{
 const r=P.sampleLine([100,30],[100.2,30],p=>p[0]>100.06&&p[0]<100.14?null:(p[0]-100)*2000-150);
 const first=P.inspect(r,0),last=P.inspect(r,r.points.length-1);assert.equal(first.meters,-150);assert.equal(first.delta,0);assert.ok(last.delta>390);assert.equal(last.point[0],100.2);
 const gap=r.points.findIndex(p=>p.meters===null);assert.ok(gap>0);assert.equal(P.inspect(r,gap).y,null);assert.equal(P.inspect(r,gap).delta,null);
 assert.equal(P.indexAt(r,-1),0);assert.equal(P.indexAt(r,2),r.points.length-1);assert.equal(P.inspect(r,Infinity).index,r.points.length-1);
 assert.equal(P.inspect(r,0).x,54);assert.equal(P.inspect(r,r.points.length-1).x,382);
});
