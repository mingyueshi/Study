const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '../static/study_topics/sci/sci-experiments.js');
const data = require('../content_sources/sci-experiments-data.js');
const {soundOffset, toneOffset, machineModel, magnetModel, electromagnetModel, buoyancyModel, structureModel} = require(file);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test('声扰动到达前微粒静止，微粒在原位附近运动，真空不传递', () => {
  assert.equal(soundOffset(500, 1), 0);
  assert.notEqual(soundOffset(140, 1), 0);
  for(let t=0;t<=4;t+=.03) for(let x=140;x<=560;x+=20) {
    assert.ok(Math.abs(soundOffset(x,t))<=7);
    assert.equal(soundOffset(x,t,false),0);
    if(t>=(x-120)/180) near(soundOffset(x,t+.5),soundOffset(x,t));
  }
});
test('快慢与幅度是独立变量，振动周期和幅度符合控制值', () => {
  near(toneOffset(.25,1,1),15); near(toneOffset(.25,1,3),45);
  for(const frequency of [1,2,3,4]) for(const amplitude of [1,2,3]) {
    near(toneOffset(1/(4*frequency),frequency,amplitude),15*amplitude);
    near(toneOffset(.17+1/frequency,frequency,amplitude),toneOffset(.17,frequency,amplitude));
  }
});
test('杠杆力与竖直位移成反比，移动支点跨越省力、等力与费力', () => {
  assert.ok(machineModel('lever',20,1).effort<1);
  near(machineModel('lever',50,1).effort,1);
  assert.ok(machineModel('lever',80,1).effort>1);
  for(const f of [20,30,50,80]) for(const p of [.1,.5,1]) {
    const m=machineModel('lever',f,p);
    near(m.effort*m.handDistance,m.loadDistance);
    near(m.left.y+m.loadDistance,190); near(m.right.y-m.handDistance,190);
    assert.ok(m.left.x<m.pivot&&m.right.x>m.pivot);
  }
});
test('定滑轮与动滑轮方向、绳长守恒及二倍距离关系正确', () => {
  for(const moving of [false,true]) {
    const start=machineModel('pulley',0,0,moving);
    for(const p of [.25,.5,1]) {
      const m=machineModel('pulley',0,p,moving);
      near(start.loadY-m.loadY,m.loadDistance);
      near(Math.abs(m.handY-start.handY),m.handDistance);
      near(m.effort*m.handDistance,m.loadDistance);
      if(moving){near(m.handDistance,2*m.loadDistance);near(2*m.wheelY-m.handY,2*start.wheelY-start.handY);assert.ok(m.handY<start.handY);}
      else {near(m.loadY+m.handY,start.loadY+start.handY);assert.ok(m.handY>start.handY);}
    }
  }
});
test('斜面等高，越长越省力，移动距离和用力保持理想功的关系', () => {
  assert.ok(machineModel('ramp',400,1).effort<machineModel('ramp',100,1).effort);
  for(const run of [100,200,400]) for(const p of [0,.5,1]) {
    const m=machineModel('ramp',run,p);near(m.effort*m.handDistance,m.loadDistance);
    near(m.point.y,265-100*p);near(m.point.x,100+run*p);
  }
});

function environment(withEffects=true,withData=true) {
  const frames=new Map(),watches=new Map(),events={},winEvents={};let id=0,change,others=0;
  const media={matches:false,addEventListener(t,fn){change=fn;}};
  const effects={motion:'full',watch(fig,fn){watches.set(fig,fn);return()=>watches.delete(fig);}};
  const document={hidden:false,addEventListener(t,fn){events[t]=fn;}};
  const window={StudyEffects:withEffects?effects:undefined,matchMedia:()=>media,SciProcess:{pause(){others++;}},SciDemoMotion:{pause(){others++;}},
    addEventListener(t,fn){winEvents[t]=fn;},requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);}};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{window,document,...(withData?{SCI_EXPERIMENTS:data}:{})});
  function element(dataset={}){return{dataset,attrs:{},style:{},hidden:false,disabled:false,textContent:'',setAttribute(k,v){this.attrs[k]=String(v);}};}
  function figure(kind='machine') {
    const nodes=new Map(),handlers={},get=key=>{if(!nodes.has(key))nodes.set(key,element());return nodes.get(key);};
    const keys=kind==='tone'?['frequency','amplitude','progress']:kind==='machine'?['fulcrum','run','progress']:kind==='electromagnet'?['current','turns','progress']:['progress'];
    const inputs=keys.map(experimentInput=>element({experimentInput}));
    const choices={mode:['lever','pulley','ramp'],medium:['air','vacuum'],pulley:['fixed','moving'],poles:['attract','repel'],phase:['.5','1'],objectType:['light','balanced','heavy'],direction:['right','left'],brace:['on','off']};
    const groups=Object.fromEntries(Object.entries(choices).map(([key,values])=>[key,values.map(value=>element({value}))]));
    const dots=[140,300,560].map(airX=>element({airX}));
    const root={dataset:{experiment:kind},querySelector:get,querySelectorAll(s){return s==='[data-air-x]'?dots:s==='[data-experiment-input]'?inputs:groups[s.match(/"(.*?)"/)?.[1]]||[];},
      addEventListener(t,fn){handlers[t]=fn;},removeEventListener(t){delete handlers[t];}};
    const fig={isConnected:true,querySelector:()=>root};window.SciExperiments.mount(fig);
    const click=(action,value='')=>{const b=get(`[data-experiment-action="${action}"]`);b.dataset={experimentAction:action,value};handlers.click({target:{closest:()=>b}});};
    const input=(key,value)=>handlers.input({target:{dataset:{experimentInput:key},value}});
    return{fig,root,get,handlers,click,input,inputs,dots};
  }
  return{api:window.SciExperiments,frames,watches,figure,others:()=>others,
    tick(time){const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));},
    preference(value){effects.motion=value;events['study:effects-change']();},reduce(value){media.matches=value;change();},
    hide(){document.hidden=true;events.visibilitychange();},show(){document.hidden=false;events.visibilitychange();},pagehide(){winEvents.pagehide();}};
}
const progress=s=>Number(s.inputs.find(i=>i.dataset.experimentInput==='progress').value);
test('默认静止，暂停续播与终点重播有效，改机械条件清理旧帧', () => {
  const e=environment(),s=e.figure();assert.equal(e.frames.size,0);
  s.click('play');e.tick(0);e.tick(100);assert.ok(progress(s)>0);s.click('play');const p=progress(s);e.tick(500);assert.equal(progress(s),p);
  s.click('play');const old=[...e.frames.values()][0];s.input('fulcrum',80);old(1000);assert.equal(e.frames.size,0);assert.equal(progress(s),0);
  assert.match(s.get('[data-experiment-reading]').textContent,/400%/);
  s.click('mode','pulley');s.click('pulley','moving');s.input('progress',100);assert.match(s.get('[data-experiment-reading]').textContent,/50%.*50 厘米.*100 厘米/);
  s.click('play');assert.equal(progress(s),0);for(let t=0;t<=6200;t+=100)e.tick(t);
  assert.equal(progress(s),100);assert.equal(e.frames.size,0);assert.equal(s.get('[data-experiment-action="play"]').textContent,'再看一次');
  assert.ok(e.others()>0);
});
test('声音切真空仍有声源振动，调快慢不改幅度，手动观察保留数值', () => {
  const e=environment(),sound=e.figure('sound'),tone=e.figure('tone');
  sound.click('medium','vacuum');sound.input('progress',25);
  assert.equal(sound.get('[data-air-dots]').style.visibility,'hidden');assert.equal(sound.get('[data-air-guide]').style.visibility,'hidden');
  assert.notEqual(sound.get('[data-exp="source"]').attrs.x,'72');assert.equal(sound.get('[data-exp="receiver"]').attrs.transform,'translate(0 0)');
  tone.input('frequency',4);assert.equal(tone.inputs.find(i=>i.dataset.experimentInput==='amplitude').value,2);
  tone.input('amplitude',3);assert.equal(tone.inputs.find(i=>i.dataset.experimentInput==='frequency').value,4);
  tone.click('next');assert.equal(progress(tone),25);tone.click('previous');assert.equal(progress(tone),0);
});
test('互斥、卸载和过期帧，偏好与离屏后台离页均可停止', () => {
  const e=environment(),a=e.figure('sound'),b=e.figure('tone');a.click('play');const stale=[...e.frames.values()][0];b.click('play');stale(100);assert.equal(e.frames.size,1);
  for(const mode of ['gentle','off']){e.preference(mode);assert.equal(e.frames.size,0);assert.equal(b.get('[data-experiment-action="play"]').disabled,true);b.click('next');e.preference('full');assert.equal(e.frames.size,0);b.click('play');}
  e.reduce(true);assert.equal(e.frames.size,0);e.reduce(false);assert.equal(e.frames.size,0);
  for(const stop of [()=>e.watches.get(b.fig)(),()=>e.hide(),()=>e.pagehide()]){b.click('play');stop();assert.equal(e.frames.size,0);e.show();}
  b.click('play');b.fig.isConnected=false;e.api.prune();assert.equal(e.frames.size,0);assert.equal(e.watches.size,1);
  a.click('play');e.api.dispose();assert.equal(e.frames.size,0);assert.equal(e.watches.size,0);assert.deepEqual(a.handlers,{});assert.deepEqual(b.handlers,{});
  const fallback=environment(false),s=fallback.figure();fallback.reduce(true);assert.equal(s.get('[data-experiment-action="play"]').disabled,true);s.click('next');assert.equal(progress(s),25);
  assert.equal(environment(true,false).api.html('machine'),null);
});

test('异极靠近、同极远离且不穿过固定磁铁，吸起放下连续、断电后强弱提示归零', () => {
  let lastA=441,lastR=439;
  for(let p=0;p<=1;p+=.01){const a=magnetModel('attract',p),r=magnetModel('repel',p);assert.ok(a.center<=lastA&&r.center>=lastR);assert.ok(a.center-70>240&&r.center+70<=600);assert.equal(a.direction,-1);assert.equal(r.direction,1);lastA=a.center;lastR=r.center;}
  near(electromagnetModel(0,2,8).lift,0);near(electromagnetModel(.5,2,8).lift,50);near(electromagnetModel(1,2,8).lift,0);
  assert.equal(electromagnetModel(.5,2,8).on,true);assert.equal(electromagnetModel(.51,2,8).on,false);
  for(const p of [0,.75,1])assert.equal(electromagnetModel(p,3,12).strength,0);
  near(electromagnetModel(.5,2,8).strength,2*electromagnetModel(.5,1,8).strength);
  near(electromagnetModel(.5,2,8).strength,2*electromagnetModel(.5,2,4).strength);
});
test('磁铁翻面、电磁铁参数改变暂停并重置，通断电直达与减少动态手动观察可用',()=>{
  const e=environment(),m=e.figure('magnet'),em=e.figure('electromagnet');
  m.click('play');const stale=[...e.frames.values()][0];m.click('poles','repel');stale(100);assert.equal(progress(m),0);assert.equal(e.frames.size,0);m.input('progress',100);assert.match(m.get('[data-experiment-reading]').textContent,/相互排斥/);
  em.click('phase','.5');assert.equal(progress(em),50);assert.equal(em.get('[data-exp="switch"]').attrs.d,'M390 235H435');assert.ok(Number(em.get('[data-exp="strength"]').attrs.width)>0);
  em.click('phase','1');assert.equal(em.get('[data-exp="strength"]').attrs.width,'0');assert.equal(progress(em),100);
  em.click('play');em.input('turns',12);assert.equal(progress(em),0);assert.equal(e.frames.size,0);assert.equal(em.inputs.find(i=>i.dataset.experimentInput==='current').value,2);
  e.reduce(true);em.click('phase','.5');assert.equal(progress(em),50);assert.equal(em.get('[data-experiment-action="play"]').disabled,true);
  e.api.dispose();assert.equal(e.watches.size,0);
  for(const kind of ['magnet','electromagnet'])assert.equal(environment(true,false).api.html(kind),null);
});

test('浮沉按排水体积计算浮力，轻物块漂浮时平衡，悬浮不移动，下沉未触底且仍有浮力',()=>{
  for(const ratio of [.6,1,1.6]) {
    let last=170;
    for(let step=0;step<=100;step++) {
      const m=buoyancyModel(ratio,step/100);
      near(m.weight,ratio);near(m.buoyant,Math.min(1,Math.max(0,(m.center+30-90)/60)));
      assert.ok(m.center+30<270);assert.ok(m.buoyant>0);
      if(ratio<1){assert.ok(m.center<=last);assert.ok(m.buoyant+1e-8>=m.weight);}
      else if(ratio===1){near(m.center,170);near(m.buoyant,m.weight);}
      else{assert.ok(m.center>=last);assert.ok(m.buoyant<m.weight);}
      last=m.center;
    }
  }
  const floating=buoyancyModel(.6,1);near(floating.submerged,.6);near(floating.buoyant,floating.weight);
  assert.deepEqual([.6,1,1.6].map(r=>buoyancyModel(r,1).state),['floating','suspended','sinking']);
  near(buoyancyModel(.6,-1).center,170);near(buoyancyModel(.6,2).center,floating.center);
});
test('框架两方向推动均保持四边长度，底边固定，加斜杆时两个三角形保持形状',()=>{
  for(const direction of ['left','right'])for(const braced of [false,true])for(let step=0;step<=100;step++) {
    const m=structureModel(step/100,direction,braced),pts=m.points;
    for(let i=0;i<4;i++)near(Math.hypot(pts[i].x-pts[(i+1)%4].x,pts[i].y-pts[(i+1)%4].y),140);
    assert.deepEqual(pts.slice(0,2),[{x:0,y:250},{x:140,y:250}]);
    if(braced){near(m.shift,0);near(Math.hypot(pts[2].x,pts[2].y-250),Math.hypot(140,140));}
    else if(step)assert.ok(direction==='left'?m.shift<0:m.shift>0);
  }
});
test('浮沉换物块与框架拆装、换方向都停止旧播放并重置，互斥、终点和回看有效',()=>{
  const e=environment(),b=e.figure('buoyancy'),s=e.figure('structure');
  assert.equal(e.frames.size,0);b.click('play');const stale=[...e.frames.values()][0];b.click('objectType','heavy');stale(200);
  assert.equal(e.frames.size,0);assert.equal(progress(b),0);b.input('progress',100);assert.match(b.get('[data-experiment-reading]').textContent,/下沉观察/);
  b.click('objectType','balanced');b.input('progress',100);assert.equal(b.get('[data-exp="block"]').attrs.y,'140');
  b.click('objectType','light');b.click('play');s.click('play');assert.equal(b.get('[data-experiment-action="play"]').attrs['aria-pressed'],'false');
  s.click('brace','off');assert.equal(e.frames.size,0);assert.equal(progress(s),0);s.input('progress',100);
  assert.equal(s.get('[data-exp="frame-0"]').attrs.d,s.get('[data-exp="frame-1"]').attrs.d);
  s.click('direction','left');assert.equal(progress(s),0);s.click('brace','on');s.input('progress',100);
  assert.equal(s.get('[data-exp="brace-line"]').attrs.d,'M0 250L140 110');
  assert.notEqual(s.get('[data-exp="frame-0"]').attrs.d,s.get('[data-exp="frame-1"]').attrs.d);
  b.click('play');for(let t=0;t<=6200;t+=100)e.tick(t);assert.equal(progress(b),100);assert.equal(e.frames.size,0);assert.match(b.get('[data-experiment-reading]').textContent,/漂浮稳定/);
  b.click('previous');assert.equal(progress(b),75);b.click('reset');assert.equal(progress(b),0);
});
test('浮沉和框架遵守偏好、可见性与卸载，缺说明数据回到原图',()=>{
  for(const kind of ['buoyancy','structure']){
    const e=environment(),s=e.figure(kind);
    for(const mode of ['gentle','off']){s.click('play');e.preference(mode);assert.equal(e.frames.size,0);assert.ok(s.get('[data-experiment-action="play"]').disabled);s.click('next');assert.ok(progress(s)>0);e.preference('full');assert.equal(e.frames.size,0);}
    for(const stop of [()=>e.watches.get(s.fig)(),()=>e.hide(),()=>e.pagehide(),()=>e.reduce(true)]){s.click('play');stop();assert.equal(e.frames.size,0);e.show();e.reduce(false);assert.equal(e.frames.size,0);}
    s.click('play');s.fig.isConnected=false;e.api.prune();assert.equal(e.frames.size,0);assert.equal(e.watches.size,0);assert.deepEqual(s.handlers,{});
    const fallback=environment(false),f=fallback.figure(kind);fallback.reduce(true);assert.ok(f.get('[data-experiment-action="play"]').disabled);f.input('progress',100);assert.equal(progress(f),100);
    assert.equal(environment(true,false).api.html(kind),null);
  }
});
