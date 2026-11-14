const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function environment(kind,withEffects=true) {
  const nodes=new Map(),events={},winEvents={},timers=new Map(),watches=[];let id=0,mediaChange;
  function element(dataset={}){return{dataset,attrs:{},style:{},events:{},textContent:'',innerHTML:'',hidden:false,disabled:false,isConnected:true,
    classList:{add(){},remove(){},toggle(){}},setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k];},
    addEventListener(t,fn){this.events[t]=fn;},appendChild(){},focus(){},closest(){return dialog;},querySelector:get,querySelectorAll:all};}
  const get=selector=>{if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);};
  const choices=[0,1,2].map(i=>element({phaseChoice:'phase'+i}));
  const tabs=['route','glyph','paper'].map(name=>{const tab=element();tab.attrs['aria-controls']='lab-panel-'+name;return tab;});
  function all(selector) {
    if(selector==='[data-phase-choice]')return choices;
    if(selector==='[data-phase-note]')return choices.map(()=>element());
    if(selector==='.lab-tab')return tabs;
    return [];
  }
  const host=element(),dialog=element();
  const document={hidden:false,addEventListener(t,fn){events[t]=fn;},createElement:()=>element(),
    getElementById:id=>kind==='history'&&id==='history-lab'?host:null,
    querySelector:s=>kind==='heart'&&s==='[data-heart]'?host:null,querySelectorAll:()=>[]};
  const media={matches:false,addEventListener(t,fn){mediaChange=fn;}};
  const effects={motion:'full',watch(el,pause){watches.push(pause);return()=>{};}};
  const window={StudyEffects:withEffects?effects:undefined,matchMedia:()=>media,addEventListener(t,fn){winEvents[t]=fn;}};
  const filename=kind==='heart'?'../static/science/body.js':'../static/study_topics/history/lab.js';
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,filename),'utf8'),{window,document,
    setInterval(fn){timers.set(++id,fn);return id;},clearInterval(id){timers.delete(id);}});
  const play=get(kind==='heart'?'[data-heart-play]':'#lab-play');
  return{get,play,timers,choices,tabs,
    click(){if(!play.disabled)play.events.click();},tick(){[...timers.values()].forEach(fn=>fn());},
    position:()=>kind==='heart'?host.dataset.phase:get('#lab-stop-number').textContent,
    preference(mode){effects.motion=mode;events['study:effects-change']();},reduce(value){media.matches=value;mediaChange();},
    hide(){document.hidden=true;events.visibilitychange();},show(){document.hidden=false;events.visibilitychange();},
    offscreen(){watches.forEach(fn=>fn());},pagehide(){winEvents.pagehide();},close(){dialog.events.close?.();}};
}
for(const kind of ['heart','history']) {
  test(`${kind} 旧播放器响应统一偏好、离屏和后台，过期回调不会继续切阶段`,()=>{
    const e=environment(kind);assert.equal(e.timers.size,0);assert.equal(e.play.disabled,false);
    e.click();const stale=[...e.timers.values()][0];e.tick();e.preference('off');const saved=e.position();stale();assert.equal(e.position(),saved);assert.equal(e.timers.size,0);assert.equal(e.play.disabled,true);
    e.preference('gentle');assert.equal(e.play.disabled,true);e.preference('full');assert.equal(e.timers.size,0);
    for(const stop of [()=>e.offscreen(),()=>e.hide(),()=>e.pagehide()]){e.click();stop();assert.equal(e.timers.size,0);e.show();}
    e.click();e.reduce(true);assert.equal(e.timers.size,0);e.reduce(false);assert.equal(e.timers.size,0);
    const fallback=environment(kind,false);fallback.reduce(true);assert.equal(fallback.play.disabled,true);
    if(kind==='heart'){fallback.choices[1].events.click();assert.equal(fallback.position(),'phase1');}
    else{fallback.get('#lab-next').events.click();assert.equal(fallback.position(),'02');}
  });
}
test('丝路旅行到末站停止，关闭弹窗、切实验和手动跳站均取消播放',()=>{
  const e=environment('history');e.click();for(let i=0;i<4;i++)e.tick();assert.equal(e.position(),'05');assert.equal(e.timers.size,0);
  e.click();assert.equal(e.position(),'01');e.close();assert.equal(e.timers.size,0);
  e.click();e.tabs[1].events.click();assert.equal(e.timers.size,0);
  e.click();e.get('#lab-next').events.click();assert.equal(e.timers.size,0);
});
