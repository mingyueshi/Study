const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.join(__dirname,'../static/study_topics/astro');
const A=require(path.join(base,'vendor/astronomy-engine/astronomy.browser.min.js'));
const C=require(path.join(base,'astro-moon-calendar.js')),L=require(path.join(base,'astro-lab.js'));
const data=require('../content_sources/astro-lab-data.js'),media=require('../content_sources/astro-media-data.js');
test('日期固定在北京时间20时，校验闰日、越界日期与跨日时刻',()=>{
 assert.equal(C.parseDate('2024-02-29').toISOString(),'2024-02-29T12:00:00.000Z');
 for(const bad of ['2023-02-29','2024-02-30','1899-12-31','2101-01-01','2024-13-01','','2024-1-1'])assert.equal(C.parseDate(bad),null,bad);
 assert.equal(C.beijingKey(new Date('2024-01-31T16:01:00Z')),'2024-02-01');
 assert.equal(C.moonAt('2023-02-29',A),null);
});
test('月相对照USNO公布的四种2024年一月相位时刻，而非固定29.5天平移',()=>{
 // UTC：美国海军天文台 https://aa.usno.navy.mil/api/moon/phases/year?year=2024
 for(const [time,phase]of [['2024-01-04T03:30:00Z',.75],['2024-01-11T11:57:00Z',0],['2024-01-18T03:52:00Z',.25],['2024-01-25T17:54:00Z',.5]]){
  const p=C.moonAt(new Date(time),A),difference=Math.abs(p.phase-phase);
  assert.ok(Math.min(difference,1-difference)<.001,time+' 相位与独立历表一致');
  assert.ok(Math.abs(p.fraction-(1-Math.cos(phase*2*Math.PI))/2)<.003,time+' 亮面');
 }
 const eclipse=C.moonAt(new Date('2024-04-08T18:21:00Z'),A);assert.ok(eclipse.fraction<.0001);
});
test('月相日期控制可跨月换日，手动模型停止时钟同步，卸载移除定时器与监听',()=>{
 const events={},timers=new Map();let timer=0;const applied=[];
 const node=()=>({value:'',disabled:false,textContent:'',handlers:{},addEventListener(k,f){this.handlers[k]=f;},removeEventListener(k){delete this.handlers[k];}});
 const nodes=new Map(),root={dataset:{},isConnected:true,handlers:{},querySelector(k){if(!nodes.has(k))nodes.set(k,node());return nodes.get(k);},addEventListener(k,f){this.handlers[k]=f;},removeEventListener(k){delete this.handlers[k];}};
 const document={hidden:false,addEventListener(k,f){events[k]=f;},removeEventListener(k){delete events[k];}};
 const window={Astronomy:A,setInterval(f){timers.set(++timer,f);return timer;},clearInterval(id){timers.delete(id);}};
 vm.runInNewContext(fs.readFileSync(path.join(base,'astro-moon-calendar.js'),'utf8'),{window,document,ASTRO_LAB:data,Date});
 const mount=window.AstroMoonCalendar.mount(root,p=>applied.push(p)),input=root.querySelector('[data-moon-date]');
 input.value='2024-01-31';input.handlers.change();assert.equal(applied.at(-1).instant,'2024-01-31T12:00:00.000Z');
 root.handlers.click({target:{closest:s=>s==='[data-moon-day]'?{disabled:false,dataset:{moonDay:'1'}}:null}});assert.equal(input.value,'2024-02-01');
 const before=applied.length;input.value='2023-02-29';input.handlers.change();assert.equal(applied.length,before);
 mount.manual();for(const f of timers.values())f();assert.equal(applied.length,before);assert.equal(root.dataset.moonMode,'manual');
 root.handlers.click({target:{closest:s=>s==='[data-moon-now]'?{}:null}});assert.equal(root.dataset.moonMode,'now');assert.equal(applied.length,before+1);
 document.hidden=true;for(const f of timers.values())f();assert.equal(applied.length,before+1);
 mount.dispose();assert.equal(timers.size,0);assert.deepEqual(root.handlers,{});assert.deepEqual(input.handlers,{});assert.deepEqual(events,{});
});
test('比较排序使用数值，保留原太阳远近顺序；月球与火星筛选不改变里程碑时间',()=>{
 const p=[...media.planets,data.pluto],original=p.map(x=>x.id);
 assert.equal(L.sortedPlanets(p,'diameter')[0].id,'jupiter');assert.equal(L.sortedPlanets(p,'temperatureC')[0].id,'venus');
 const years=L.sortedPlanets(p,'periodDays');assert.equal(years[0].id,'mercury');assert.equal(years.at(-1).id,'pluto');assert.deepEqual(p.map(x=>x.id),original);
 for(const target of ['moon','mars']){const m=L.filterMissions(data.missions,target);assert.equal(m.length,7);assert.ok(m.every(x=>x.target===target));assert.deepEqual(m.map(x=>x.date),m.map(x=>x.date).sort());}
 assert.equal(L.filterMissions(data.missions,'all').length,14);
});
