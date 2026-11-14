const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '../static/study_topics/sci/sci-process.js');
const data = require('../content_sources/sci-process-data.js');
const {lightGeometry, stageAt, stepTo, lifePaths} = require(file);

test('光线相对法线成角，反射对称；空气入水满足折射定律，垂直入水不偏折', () => {
  for (let angle = 0; angle <= 75; angle++) {
    const model = lightGeometry(angle, data.light.indices);
    assert.equal(model.reflected, angle);
    assert.ok(Math.abs(model.source.x + model.mirror.x - 640) < 1e-9);
    assert.equal(model.source.y, model.mirror.y);
    assert.ok(model.water.y > model.origin.y);
    assert.ok(Math.abs(Math.sin(angle * Math.PI / 180) - 1.333 * Math.sin(model.refracted * Math.PI / 180)) < 1e-9);
    if (angle > 0) assert.ok(model.refracted < angle);
    for (const point of [model.source, model.mirror, model.water]) {
      assert.ok(point.x >= 48 && point.x <= 592 && point.y >= 40 && point.y <= 340);
      assert.ok(Math.abs(Math.hypot(point.x - 320, point.y - 190) - 140) < 1e-9);
    }
  }
  assert.equal(lightGeometry(0).refracted, 0);
  assert.equal(lightGeometry(0).water.x, 320);
  assert.ok(Math.abs(lightGeometry(45).refracted - 32.03) < .05);
  assert.equal(lightGeometry(-20).angle, 0);
  assert.equal(lightGeometry(100).angle, 75);
});

test('分段回看覆盖中途和整点，完成时保留最后一步，不越过边界', () => {
  assert.deepEqual([0, .3, 1, 1.01, 2, 3, 4].map(p => stageAt(p, 4)), [0, 0, 0, 1, 1, 2, 3]);
  for (const [p, direction, result] of [[0,-1,0],[0,1,1],[1,1,2],[1,-1,0],[1.2,-1,1],[1.2,1,2],[4,1,4]]) {
    assert.equal(stepTo(p, 4, direction), result);
  }
});

function environment(withEffects = true, withData = true) {
  const frames = new Map(), watches = new Map(), events = {}, winEvents = {};
  let frameID = 0, change, otherPaused = 0;
  const media = {matches:false, addEventListener(type, fn) { change = fn; }};
  const effects = {motion:'full', watch(fig, fn) { watches.set(fig, fn); return () => watches.delete(fig); }};
  const document = {hidden:false, addEventListener(type, fn) { events[type] = fn; }};
  const window = {StudyEffects:withEffects ? effects : undefined, matchMedia:()=>media,
    SciDemoMotion:{pause() { otherPaused++; }}, addEventListener(type, fn) { winEvents[type] = fn; },
    requestAnimationFrame(fn) { frames.set(++frameID, fn); return frameID; }, cancelAnimationFrame(id) { frames.delete(id); }};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {window, document, ...(withData ? {SCI_PROCESS:data} : {})});
  function element(dataset = {}) { return {dataset, attrs:{}, textContent:'', disabled:false, hidden:false,
    setAttribute(key, value) { this.attrs[key] = String(value); }}; }
  function figure(kind = 'light') {
    const nodes = new Map(), handlers = {}, get = key => { if (!nodes.has(key)) nodes.set(key, element()); return nodes.get(key); };
    const tracks = Array.from({length:kind === 'light' ? 2 : data[kind].steps.length}, (_, i) => ({...element(), getTotalLength:()=>100,
      getPointAtLength:distance=>({x:distance, y:i * 10})}));
    const steps = tracks.map((_, i)=>element({value:String(i+1)})), modes=['mirror','water'].map(value=>element({value}));
    const lifeNodes = (data[kind].nodes || []).map(n => element({processNode:n.id}));
    const root = {dataset:{sciProcess:kind}, querySelector:get,
      querySelectorAll(selector) { return selector === '[data-process-path]' ? tracks : selector === '[data-process-node]' ? lifeNodes : selector.includes('"step"') ? steps : modes; },
      addEventListener(type, fn) { handlers[type] = fn; }, removeEventListener(type) { delete handlers[type]; }};
    const fig = {isConnected:true, querySelector:()=>root};
    window.SciProcess.mount(fig);
    const click = (action, value = '') => {
      const button = get(`[data-process="${action}"]`); button.dataset = {process:action, value:String(value)};
      handlers.click({target:{closest:()=>button}});
    };
    const angle = value => handlers.input({target:{value:String(value), matches:()=>true}});
    return {fig,root,get,handlers,click,angle,tracks,lifeNodes};
  }
  return {api:window.SciProcess,figure,frames,watches,otherPaused:()=>otherPaused,
    tick(time) { const pending=[...frames.values()]; frames.clear(); pending.forEach(fn=>fn(time)); },
    preference(value) { effects.motion=value; events['study:effects-change'](); },
    reduce(value) { media.matches=value; change(); },
    hide() { document.hidden=true; events.visibilitychange(); }, show() { document.hidden=false; events.visibilitychange(); },
    pagehide() { winEvents.pagehide(); }};
}
const progress = scene => scene.get('[data-process-progress]').value;

test('光路默认静止，播放暂停保留位置，改角度或介质清理旧帧并回到起点', () => {
  const env=environment(), scene=env.figure();
  assert.equal(progress(scene),0); assert.equal(env.frames.size,0);
  scene.click('play'); env.tick(0); env.tick(100); assert.ok(progress(scene)>0);
  scene.click('play'); const saved=progress(scene); env.tick(200); assert.equal(progress(scene),saved);
  scene.click('play'); const stale=[...env.frames.values()][0]; scene.angle(0); stale(900);
  assert.equal(progress(scene),0); assert.equal(env.frames.size,0);
  assert.match(scene.get('[data-light-cause]').textContent,/沿原路返回/);
  scene.click('mode','water'); assert.match(scene.get('[data-light-cause]').textContent,/方向不改变/);
  scene.angle(60); assert.match(scene.get('[data-light-readout]').textContent,/入射角 60° · 折射角约 40.5°/);
  scene.click('next'); assert.equal(progress(scene),1);
  scene.click('next'); assert.equal(progress(scene),2);
  scene.click('previous'); assert.equal(progress(scene),1);
  assert.equal(env.frames.size,0); assert.ok(env.otherPaused()>0);
});

test('水循环依次到达四环节，手动回看不播放，一轮结束停止并可从头重播', () => {
  const env=environment(), scene=env.figure('water');
  for (let i=1;i<=4;i++) {
    scene.click('next'); assert.equal(progress(scene),i);
    assert.match(scene.get('[data-process-note]').textContent,new RegExp(data.water.steps[i-1].label));
    assert.equal(scene.tracks[i-1].attrs['stroke-dasharray'],'1 1');
  }
  assert.equal(scene.get('[data-process="next"]').disabled,true);
  scene.click('step',2); assert.equal(progress(scene),2); assert.equal(env.frames.size,0);
  scene.click('play');
  for(let time=0;time<=5400;time+=100) env.tick(time);
  assert.equal(progress(scene),4); assert.equal(env.frames.size,0);
  assert.equal(scene.get('[data-process="play"]').textContent,'再看一轮');
  scene.click('play'); assert.equal(progress(scene),0);
  scene.click('reset'); assert.equal(progress(scene),0); assert.equal(env.frames.size,0);
});

test('光路自然结束停在出射光端点，手动调用暂停不会被过期回调重新启动', () => {
  const env=environment(), scene=env.figure();
  scene.click('play');
  for(let time=0;time<=3800;time+=100) env.tick(time);
  assert.equal(progress(scene),2); assert.equal(env.frames.size,0);
  scene.click('play'); const stale=[...env.frames.values()][0]; env.api.pause(); stale(5000);
  assert.equal(env.frames.size,0); assert.equal(progress(scene),0);
});

test('两图互斥播放，离屏、后台、离页暂停，恢复可见不自动续播', () => {
  const env=environment(), a=env.figure(), b=env.figure('water');
  a.click('play'); const stale=[...env.frames.values()][0]; b.click('play'); stale(100);
  assert.equal(env.frames.size,1); assert.equal(a.get('[data-process="play"]').attrs['aria-pressed'],'false');
  env.watches.get(b.fig)(); assert.equal(env.frames.size,0);
  b.click('play'); env.hide(); assert.equal(env.frames.size,0);
  b.click('play'); assert.equal(env.frames.size,0);
  env.show(); assert.equal(env.frames.size,0);
  b.click('play'); env.pagehide(); assert.equal(env.frames.size,0);
});

test('动效轻柔、关闭和系统减少动态效果暂停播放，仍可手动调角、切模式、看步骤', () => {
  const env=environment(), scene=env.figure();
  for(const mode of ['gentle','off']) {
    scene.click('play'); env.preference(mode); assert.equal(env.frames.size,0);
    assert.equal(scene.get('[data-process="play"]').disabled,true);
    scene.click('mode','water'); scene.angle(30); scene.click('next'); assert.equal(progress(scene),1);
    env.preference('full'); assert.equal(env.frames.size,0);
  }
  scene.click('play'); env.reduce(true); assert.equal(env.frames.size,0);
  env.reduce(false); assert.equal(env.frames.size,0);
  const fallback=environment(false), water=fallback.figure('water'); fallback.reduce(true);
  assert.equal(water.get('[data-process="play"]').disabled,true);
  water.click('step',4); assert.equal(progress(water),4);
});

test('重复挂载不重复注册，切课卸载清理监听和观察器，缺数据时保留静态图入口', () => {
  const env=environment(), a=env.figure(), b=env.figure('water');
  env.api.mount(a.fig); assert.equal(env.watches.size,2);
  b.click('play'); const stale=[...env.frames.values()][0]; b.fig.isConnected=false; env.api.prune(); stale(100);
  assert.equal(env.frames.size,0); assert.equal(env.watches.size,1); assert.deepEqual(b.handlers,{});
  a.click('play'); env.api.dispose(); assert.equal(env.frames.size,0); assert.equal(env.watches.size,0); assert.deepEqual(a.handlers,{});
  assert.equal(environment(true,false).api.html('light'),null);
  assert.equal(environment(true,false).api.html('water'),null);
  const figures=require('../static/study_topics/sci/sci-figures.js');
  assert.match(figures.figHTML('sci-reflect'),/<svg/);
  assert.match(figures.figHTML('sci-water-cycle'),/<svg/);
});

test('生命图示沿原料进入与产物离开绘制，食物链的四条路径都指向取食者', () => {
  assert.equal(lifePaths('photo').length,5);
  const endpoints = d => {
    const values=d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    // 这些光合路径末段分别为 Q、V、H、Q、Q。
    return {start:values.slice(0,2),values};
  };
  const photo=lifePaths('photo').map(endpoints);
  assert.ok(photo[0].values.at(-2)>photo[0].start[0]); // 阳光朝向叶片。
  assert.ok(photo[1].values.at(-1)<photo[1].start[1]); // 水沿茎向上。
  assert.ok(photo[2].values.at(-1)>photo[2].start[0]); // 二氧化碳从空气进入。
  for(const i of [3,4]) assert.ok(photo[i].values.at(-2)>photo[i].start[0]); // 产物从绿叶离开。
  lifePaths('foodchain').forEach((d,i)=>{
    const [,start,end]=d.match(/^M(\d+) 160H(\d+)$/).map(Number);
    const source=65+i*128,target=source+128;
    assert.ok(start>source && end<target && end>start);
    assert.equal(data.foodchain.steps[i].to,data.foodchain.nodes[i+1].id);
  });
  assert.deepEqual(lifePaths('unknown'),[]);
});

test('光合作用五段可直接选看，联动来处和去处，暂停续播并在氧气阶段自然结束', () => {
  const env=environment(), scene=env.figure('photo');
  assert.equal(progress(scene),0); assert.equal(env.frames.size,0);
  for(let i=0;i<5;i++) {
    scene.click('step',i+1);
    assert.equal(progress(scene),i+1);
    const step=data.photo.steps[i];
    assert.deepEqual(scene.lifeNodes.filter(n=>n.attrs['data-active']==='true').map(n=>n.dataset.processNode).sort(),[step.from,step.to].sort());
    assert.match(scene.get('[data-process-note]').textContent,new RegExp(step.label));
  }
  scene.click('reset'); scene.click('play'); env.tick(0); env.tick(100);
  scene.click('play'); const saved=progress(scene); env.tick(400); assert.equal(progress(scene),saved);
  scene.click('play'); env.tick(500); env.tick(600); assert.ok(progress(scene)>saved);
  for(let time=700;time<=14000;time+=100) env.tick(time);
  assert.equal(progress(scene),5); assert.equal(env.frames.size,0);
  assert.equal(scene.get('[data-process="play"]').textContent,'再看一轮');
  scene.click('play'); assert.equal(progress(scene),0);
  scene.click('reset'); assert.equal(env.frames.size,0);
  assert.ok(scene.lifeNodes.every(n=>n.attrs['data-active']==='false'));
});

test('食物链与光合作用互斥，手动回看和减少动态保持箭头与说明，旧帧不再推进', () => {
  const env=environment(), photo=env.figure('photo'), chain=env.figure('foodchain');
  photo.click('play'); const stale=[...env.frames.values()][0]; chain.click('play'); stale(100);
  assert.equal(env.frames.size,1); assert.equal(progress(photo),0);
  chain.click('step',4); assert.equal(env.frames.size,0); assert.equal(progress(chain),4);
  chain.click('previous'); assert.equal(progress(chain),3);
  chain.click('play'); env.preference('gentle'); assert.equal(env.frames.size,0);
  chain.click('step',2); assert.equal(progress(chain),2);
  assert.match(chain.get('[data-process-note]').textContent,/不是青蛙扑向蝗虫/);
  env.preference('full'); assert.equal(env.frames.size,0);
  chain.click('play'); env.watches.get(chain.fig)(); assert.equal(env.frames.size,0);
  chain.click('play'); env.hide(); assert.equal(env.frames.size,0); env.show();
  chain.click('play'); env.pagehide(); assert.equal(env.frames.size,0);
});

test('生命图示卸载释放观察器和监听，缺说明或播放器时仍有原静态图', () => {
  const env=environment(), scene=env.figure('photo');
  scene.click('play'); const stale=[...env.frames.values()][0]; scene.fig.isConnected=false;
  env.api.prune(); stale(300); assert.equal(env.frames.size,0); assert.equal(env.watches.size,0);
  assert.deepEqual(scene.handlers,{});
  const fallback=environment(false), chain=fallback.figure('foodchain');
  chain.click('play'); fallback.reduce(true); assert.equal(fallback.frames.size,0);
  chain.click('next'); assert.equal(progress(chain),1);
  for(const kind of ['photo','foodchain']) assert.equal(environment(true,false).api.html(kind),null);
  const figures=require('../static/study_topics/sci/sci-figures.js');
  assert.match(figures.figHTML('sci-photo'),/<svg/);
  assert.match(figures.figHTML('sci-foodchain'),/<svg/);
});
