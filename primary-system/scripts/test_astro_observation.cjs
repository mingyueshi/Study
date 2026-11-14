const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.join(__dirname, '../static/study_topics/astro/astro-observation.js');
const data = require('../content_sources/astro-observation-data.js');
const {moonGeometry, moonPath, eclipseStage, nextStep} = require(file);

test('新月、上弦、满月、下弦的位置与亮面联动，一轮回到新月', () => {
  for (const [phase, x, y, lit, waxing] of [[0,152,140,0,true],[.25,240,228,.5,true],[.5,328,140,1,true],[.75,240,52,.5,false],[1,152,140,0,false]]) {
    const actual = moonGeometry(phase);
    for (const key of ['x','y','lit']) assert.ok(Math.abs(actual[key] - {x,y,lit}[key]) < 1e-8);
    assert.equal(actual.waxing, waxing);
  }
  assert.equal(moonPath(0), ''); assert.equal(moonPath(1), '');
  assert.match(moonPath(.25), /A0\.0000 66/);
  assert.match(moonPath(.5), /A66\.0000 66 0 0 1/);
  for (let i = 0; i <= 1000; i++) assert.doesNotMatch(moonPath(i / 1000), /NaN|Infinity/);
});

test('手动月相前后步进正确处理整点、播放中间位置和首尾边界', () => {
  assert.equal(nextStep(.25, 8, 1), .375);
  assert.equal(nextStep(.25, 8, -1), .125);
  assert.equal(nextStep(.3, 8, -1), .25);
  assert.equal(nextStep(.3, 8, 1), .375);
  assert.equal(nextStep(0, 8, -1), 0);
  assert.equal(nextStep(1, 8, 1), 1);
  assert.deepEqual([0,1/3,2/3,1].map(eclipseStage), [0,1,2,3]);
});

function environment(withEffects = true) {
  const frames = new Map(), watches = new Map(), events = {}, winEvents = {};
  let frameID = 0, change;
  const media = {matches:false, addEventListener(type, fn) { change = fn; }};
  const effects = {motion:'full', watch(fig, fn) { watches.set(fig, fn); return () => watches.delete(fig); }};
  const document = {hidden:false, addEventListener(type, fn) { events[type] = fn; }};
  const window = {StudyEffects: withEffects ? effects : undefined, matchMedia:()=>media,
    addEventListener(type, fn) { winEvents[type] = fn; },
    requestAnimationFrame(fn) { frames.set(++frameID, fn); return frameID; }, cancelAnimationFrame(id) { frames.delete(id); }};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {window, document, ASTRO_OBSERVATION:data});
  function element(dataset = {}) { return {dataset, attrs:{}, style:{}, textContent:'', disabled:false, hidden:false,
    classList:{toggle(){}}, setAttribute(key,value) { this.attrs[key] = String(value); }}; }
  function figure(kind = 'moon') {
    const nodes = new Map(), handlers = {}, get = key => { if (!nodes.has(key)) nodes.set(key, element()); return nodes.get(key); };
    const phases = data.phases.map((_,i)=>element({value:String(i)}));
    const steps = [0,1,2,3].map(i=>element({value:String(i)}));
    const modes = ['solar','lunar'].map(value=>element({value}));
    const shadows = [element(),element()];
    const root = {dataset:{observation:kind}, querySelector:get,
      querySelectorAll(selector) { return selector.includes('"phase"')?phases:selector.includes('"step"')?steps:selector.includes('"mode"')?modes:shadows; },
      addEventListener(type, fn) { handlers[type] = fn; }, removeEventListener(type) { delete handlers[type]; }};
    const fig = {isConnected:true, querySelector:()=>root};
    window.AstroObservation.mount(fig);
    const click = (action, value = '') => {
      const button = get(`[data-observe="${action}"]`);
      button.dataset = {observe:action,value:String(value)};
      handlers.click({target:{closest:()=>button}});
    };
    const input = value => handlers.input({target:{value:String(value), matches:()=>true}});
    return {fig,root,get,handlers,click,input,shadows};
  }
  return {api:window.AstroObservation,figure,frames,watches,
    tick(time) { const pending=[...frames.values()]; frames.clear(); pending.forEach(fn=>fn(time)); },
    preference(value) { effects.motion=value; events['study:effects-change'](); },
    reduce(value) { media.matches=value; change(); },
    hide() { document.hidden=true; events.visibilitychange(); },
    show() { document.hidden=false; events.visibilitychange(); },
    pagehide() { winEvents.pagehide(); }};
}
const value = scene => Number(scene.get('[data-observe-range]').value);

test('月相默认静止，暂停保留位置，播放一轮自动停止，重播从新月开始', () => {
  const env=environment(), scene=env.figure();
  assert.equal(value(scene),0); assert.equal(env.frames.size,0);
  scene.click('play'); env.tick(0); env.tick(100);
  assert.ok(value(scene)>0); scene.click('play');
  const paused=value(scene); env.tick(200); assert.equal(value(scene),paused);
  scene.input(990); assert.equal(env.frames.size,0); scene.click('play');
  for(let time=300;time<=700;time+=100) env.tick(time);
  assert.equal(value(scene),1000); assert.equal(env.frames.size,0);
  assert.equal(scene.get('[data-observe="next"]').disabled,true);
  assert.equal(scene.get('[data-observe="play"]').textContent,'再看一轮');
  scene.click('play'); assert.equal(value(scene),0);
  scene.click('phase',4); assert.equal(value(scene),500); assert.equal(env.frames.size,0);
  scene.click('reset'); assert.equal(value(scene),0);
});

test('日月食分步展示影子，模式切换清理旧播放，完成后停在离开阶段', () => {
  const env=environment(), scene=env.figure('eclipse');
  assert.ok(scene.shadows.every(s=>s.style.visibility==='hidden'));
  scene.click('next'); assert.match(scene.get('[data-observe-note]').textContent,/2 \/ 4/);
  scene.click('next'); assert.ok(scene.shadows.every(s=>s.style.visibility==='visible'));
  scene.click('previous'); assert.ok(scene.shadows.every(s=>s.style.visibility==='hidden'));
  scene.click('play'); const stale=[...env.frames.values()][0];
  scene.click('mode','lunar'); stale(500);
  assert.equal(env.frames.size,0); assert.match(scene.get('[data-eclipse-order]').textContent,/地球在中间/);
  scene.click('step',2); scene.click('play');
  for(let time=0;time<=3200;time+=100) env.tick(time);
  assert.equal(env.frames.size,0); assert.match(scene.get('[data-observe-note]').textContent,/4 \/ 4/);
  assert.ok(scene.shadows.every(s=>s.style.visibility==='hidden'));
});

test('两演示互斥播放，卸载释放监听和观察器，过期帧不能恢复', () => {
  const env=environment(), a=env.figure(), b=env.figure('eclipse');
  env.api.mount(a.fig); assert.equal(env.watches.size,2);
  a.click('play'); const stale=[...env.frames.values()][0]; b.click('play'); stale(400);
  assert.equal(env.frames.size,1); assert.equal(a.get('[data-observe="play"]').attrs['aria-pressed'],'false');
  b.fig.isConnected=false; env.api.prune(); assert.equal(env.frames.size,0); assert.equal(env.watches.size,1);
  a.click('play'); const old=[...env.frames.values()][0]; env.api.dispose(); old(800);
  assert.equal(env.frames.size,0); assert.equal(env.watches.size,0); assert.deepEqual(a.handlers,{}); assert.deepEqual(b.handlers,{});
});

test('减少动态效果及统一偏好失效时保留手动观察，恢复偏好不自动播放', () => {
  const env=environment(), scene=env.figure();
  for(const mode of ['gentle','off']) {
    scene.click('play'); env.preference(mode); assert.equal(env.frames.size,0);
    assert.equal(scene.get('[data-observe="play"]').disabled,true);
    scene.click('phase',4); assert.equal(value(scene),500);
    env.preference('full'); assert.equal(env.frames.size,0);
  }
  scene.click('play'); env.reduce(true); assert.equal(env.frames.size,0);
  env.reduce(false); assert.equal(env.frames.size,0);
  const fallback=environment(false), staticScene=fallback.figure(); fallback.reduce(true);
  assert.equal(staticScene.get('[data-observe="play"]').disabled,true);
  staticScene.click('next'); assert.equal(value(staticScene),125);
});

test('离屏、后台、离页均暂停，返回可见后仍等待手动开始', () => {
  const env=environment(), scene=env.figure();
  scene.click('play'); env.watches.get(scene.fig)(); assert.equal(env.frames.size,0);
  scene.click('play'); env.hide(); assert.equal(env.frames.size,0);
  scene.click('play'); assert.equal(env.frames.size,0);
  env.show(); assert.equal(env.frames.size,0);
  scene.click('play'); env.pagehide(); assert.equal(env.frames.size,0);
});

test('天文知识点深链接打开所属课程，切换链接清理旧演示，未知链接不破坏当前课程', () => {
  const nodes = new Map(), events = {}, scrolled = [];
  let disposed = 0;
  const document = {addEventListener() {}, getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, {innerHTML:'', textContent:'', value:'', scrollIntoView() { scrolled.push(id); }});
    return nodes.get(id);
  }};
  const location = {hash:'#lesson-au2-2', search:'?view=universe'};
  const window = {location, AstroObservation:{dispose() { disposed++; }}, addEventListener(type, fn) { events[type]=fn; }};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../content_sources/astro-app.js'),'utf8'), {
    window,document,location,URLSearchParams,ASTRO:require('../content_sources/astro-data.js'),
    localStorage:{getItem:()=>null,setItem(){assert.fail('只读深链接不应写学习记录');}},
  });
  assert.equal(window.AstroExplore.view,'au2');
  assert.match(nodes.get('cards').innerHTML,/id="lesson-au2-2"/);
  assert.deepEqual(scrolled,['lesson-au2-2']);
  location.hash='#lesson-au2-4'; events.hashchange();
  assert.equal(disposed,2); assert.equal(scrolled.at(-1),'lesson-au2-4');
  location.hash='#lesson-missing'; events.hashchange();
  assert.equal(disposed,2); assert.equal(window.AstroExplore.view,'au2');
});
