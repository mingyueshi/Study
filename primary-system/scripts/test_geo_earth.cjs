const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const file=path.join(__dirname,'../static/study_topics/geo/earth.js');
const data=require('../content_sources/geo/earth-data.js');
const {dayModel,seasonModel}=require(file);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('北极俯视地点按正午、日落、午夜、日出逆时针经过亮暗半球',()=>{
  const list=[0,.25,.5,.75,1].map(dayModel);
  assert.deepEqual(list.map(m=>m.hours),[12,18,0,6,12]);
  assert.deepEqual(list.map(m=>m.phase),['lit','boundary','dark','boundary','lit']);
  assert.ok(list[0].x<320&&list[1].y>180&&list[2].x>320&&list[3].y<180);
  for(let p=0;p<=1;p+=.01){const m=dayModel(p);near(Math.hypot(m.x-320,m.y-180),105);}
});
test('二至二分、南北互补、赤道与零倾角昼长满足球面几何，地轴朝向不随公转转动',()=>{
  near(seasonModel(0).declination,23.5);near(seasonModel(.25).declination,0);near(seasonModel(.5).declination,-23.5);near(seasonModel(.75).declination,0);
  assert.ok(Math.abs(seasonModel(0).daylight-14.85)<.02);
  for(let p=0;p<=1;p+=.01){const m=seasonModel(p);near(m.daylight+seasonModel(p,-40).daylight,24);near(seasonModel(p,0).daylight,12);near(seasonModel(p,40,0).daylight,12);
    near(m.axisX,seasonModel(0).axisX);near(m.axisY,seasonModel(0).axisY);near(((m.x-320)/220)**2+((m.y-180)/95)**2,1);}
});
function environment(withEffects=true,withData=true){
  const frames=new Map(),events={},winEvents={},nodes=new Map(),handlers={};let id=0,change,unwatched=0,watch,otherPaused=0;
  const element=(dataset={})=>({dataset,attrs:{},textContent:'',hidden:false,disabled:false,setAttribute(k,v){this.attrs[k]=String(v);}});
  const get=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s);};
  const groups={mode:['day','year'],latitude:['40','0','-40'],tilt:['23.5','0'],stop:['0','.25','.5','.75']};
  for(const [key,values] of Object.entries(groups))groups[key]=values.map(value=>element({value}));
  const root={querySelector:get,querySelectorAll:s=>groups[s.match(/"(.*?)"/)?.[1]]||[],addEventListener(t,f){handlers[t]=f;},removeEventListener(t){delete handlers[t];}};
  const host={isConnected:true,querySelector:()=>root};
  const media={matches:false,addEventListener(t,f){change=f;}},effects={motion:'full',watch(h,f){watch=f;return()=>unwatched++;}};
  const document={hidden:false,addEventListener(t,f){events[t]=f;}};
  const window={StudyEffects:withEffects?effects:undefined,matchMedia:()=>media,SciProcess:{pause(){otherPaused++;}},addEventListener(t,f){winEvents[t]=f;},requestAnimationFrame(f){frames.set(++id,f);return id;},cancelAnimationFrame(id){frames.delete(id);}};
  class Observer { constructor(fn){watch=()=>fn([{isIntersecting:false}]);} observe(){} disconnect(){unwatched++;} }
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,document,IntersectionObserver:Observer,...(withData?{GEO_EARTH:data}:{})});
  const api=window.GeoEarth;if(withData)api.mount(host);
  return{api,host,get,frames,handlers,
    click(a,value=''){const b=get(`[data-earth="${a}"]`);b.dataset={earth:a,value:String(value)};handlers.click({target:{closest:()=>b}});},
    input(value){handlers.input({target:{value,matches:()=>true}});},
    tick(time){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f(time));},
    preference(value){effects.motion=value;events['study:effects-change']();},reduce(value){media.matches=value;change();},
    offscreen(){watch();},hide(){document.hidden=true;events.visibilitychange();},show(){document.hidden=false;events.visibilitychange();},pagehide(){winEvents.pagehide();},
    unwatched:()=>unwatched,otherPaused:()=>otherPaused};
}
const progress=e=>Number(e.get('[data-earth-progress]').value);
test('四季默认静止，选位置与条件保持日期，切昼夜重置，暂停续播和自然结束有效',()=>{
  const e=environment();assert.equal(e.frames.size,0);e.click('stop',.5);assert.equal(progress(e),50);assert.match(e.get('[data-earth-reading]').textContent,/南纬 23.5/);
  e.click('latitude',-40);assert.equal(progress(e),50);assert.match(e.get('[data-earth-reading]').textContent,/昼约 14.9/);
  e.click('tilt',0);assert.equal(progress(e),50);assert.match(e.get('[data-earth-reading]').textContent,/昼约 12.0/);
  e.click('mode','day');assert.equal(progress(e),0);e.click('next');assert.equal(progress(e),25);e.click('previous');assert.equal(progress(e),0);
  e.click('play');e.tick(0);e.tick(100);e.click('play');const saved=progress(e);e.tick(500);assert.equal(progress(e),saved);
  e.click('play');for(let t=600;t<=13000;t+=100)e.tick(t);assert.equal(progress(e),100);assert.equal(e.frames.size,0);assert.equal(e.get('[data-earth="play"]').textContent,'再看一圈');
  e.click('play');assert.equal(progress(e),0);e.click('reset');assert.equal(e.frames.size,0);assert.ok(e.otherPaused()>0);
});
test('参数、离屏、后台和偏好取消旧帧，恢复不自动播放，减少动态保留手动进度',()=>{
  const e=environment();e.click('play');const stale=[...e.frames.values()][0];e.click('tilt',0);stale(200);assert.equal(e.frames.size,0);
  for(const mode of ['gentle','off']){e.click('play');e.preference(mode);assert.equal(e.frames.size,0);assert.equal(e.get('[data-earth="play"]').disabled,true);e.input(75);assert.equal(progress(e),75);e.preference('full');assert.equal(e.frames.size,0);}
  for(const stop of [()=>e.offscreen(),()=>e.hide(),()=>e.pagehide()]){e.click('play');stop();assert.equal(e.frames.size,0);e.show();}
  e.click('play');e.reduce(true);assert.equal(e.frames.size,0);e.reduce(false);assert.equal(e.frames.size,0);
  e.click('play');const old=[...e.frames.values()][0];e.api.dispose();old(300);assert.equal(e.frames.size,0);assert.equal(e.unwatched(),1);assert.deepEqual(e.handlers,{});
});
test('缺统一偏好时仍响应系统设置，缺数据保留旧实验入口，重复挂载不重复监听',()=>{
  const e=environment(false);e.reduce(true);assert.equal(e.get('[data-earth="play"]').disabled,true);e.click('stop',.25);assert.equal(progress(e),25);
  e.api.mount(e.host);assert.equal(e.unwatched(),0);e.api.dispose();assert.equal(e.unwatched(),1);
  assert.equal(environment(true,false).api.html(),null);
});
