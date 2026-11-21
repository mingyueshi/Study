const {test}=require('node:test'),assert=require('node:assert/strict');
const {readFileSync}=require('node:fs'),{runInNewContext}=require('node:vm');
const data=require('../content_sources/solar-terms.json'),A=require('../static/study_topics/astro/vendor/astronomy-engine/astronomy.browser.min.js');
const C=require('../static/study_topics/solar-calendar.js'),D=require('../static/study_topics/solar-diary.js'),S=require('../static/study_topics/solar-scenes.js');
const terms=data.seasons.flatMap(s=>s.terms),ids=terms.map(t=>t.id);
const storage=()=>{const map=new Map();return {get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};};
const note=(id='note-a',extra={})=>({id,term:'lidong',date:'2026-11-17',hometown:'浙江杭州',place:'小花园',weather:'晴',temperature:18,plants:'银杏叶黄了',animals:'看见一只鸟',text:'今天风不大。',...extra});

test('缺少观察提示段落时，节气卡仍可筛选，日记仍能初始化', () => {
 const element = () => ({value: '', addEventListener() {}, querySelector: () => null});
 const nodes = new Map();
 const get = id => {
  if (!id) return null;
  if (!nodes.has(id)) nodes.set(id, element());
  return nodes.get(id);
 };
 const season = {id: 'chun', querySelector: () => card.hidden ? null : card};
 const card = {
  id: 'lichun', textContent: '立春', closest: () => season,
  querySelector: selector => selector === 'h3' ? {textContent: '立春'} : null,
 };
 const hall = {
  querySelectorAll: selector => ({'.solar-card': [card], '.solar-season': [season]})[selector] || [],
  querySelector: element,
  dispatchEvent() {},
 };
 for (const [id, value] of [
  ['solar-experience', data.experience], ['solar-term-experience', []], ['solar-challenges', []],
 ]) get(id).textContent = JSON.stringify(value);
 get('solar-challenge').querySelector = element;
 let mounted = false;
 runInNewContext(readFileSync(require.resolve('../static/study_topics/solar-terms.js'), 'utf8'), {
  document: {querySelector: () => hall, getElementById: get},
  location: {search: '?q=立春', hash: ''},
  URLSearchParams, Event,
  window: {
   addEventListener() {},
   SolarDiary: {mount({terms}) {
    assert.equal(terms.get('lichun').prompt, '');
    mounted = true;
   }},
   SolarScenes: {mount() {}},
   SolarCalendar: {mount() {}},
  },
 });
 assert.equal(mounted, true);
 assert.equal(card.hidden, false);
 assert.match(get('solar-filter-status').textContent, /找到 1 \//);
});
test('2026年交节时刻对照香港天文台年历；交节前后和一月跨年不混淆',()=>{
 const calendar=C.createCalendar(terms,A),events=calendar.events(2026);
 assert.equal(events.length,24);assert.equal(new Set(events.map(e=>e.term.solarLongitude)).size,24);
 // HKO 2026年11月历：立冬11月7日17:52、小雪11月22日15:23（UTC+8）。
 const winter=events.find(e=>e.term.id==='lidong'),snow=events.find(e=>e.term.id==='xiaoxue');
 assert.ok(Math.abs(winter.time-Date.parse('2026-11-07T09:52:00Z'))<60000);
 assert.ok(Math.abs(snow.time-Date.parse('2026-11-22T07:23:00Z'))<60000);
 assert.equal(calendar.at(winter.time-1).current.term.id,'shuangjiang');assert.equal(calendar.at(winter.time).current.term.id,'lidong');
 assert.equal(calendar.at('2027-01-01T00:00:00Z').current.term.id,'dongzhi');assert.equal(calendar.at('2026-12-31T20:00:00Z').next.term.id,'xiaohan');
 assert.equal(calendar.at('2024-02-29T12:00:00Z').current.term.id,'yushui');
 assert.equal(C.dateKey(Date.parse('2026-12-31T16:01:00Z')),'2027-01-01');
 assert.throws(()=>calendar.at('invalid'));assert.match(C.countdown(86400000+7200000),/1 天 2 小时/);assert.equal(C.countdown(1),'不到 1 分钟');
});
test('旧笔记只读兼容；同节气可保存多条，不覆盖旧页和其他年份',()=>{
 const s=storage(),raw=JSON.stringify({version:1,date:'2025-11-07',place:'老家院子',text:'旧笔记原文。'});s.setItem('study_solar_note_v1:lidong',raw);
 const store=D.createStore(s,ids,data.experience.diary.weather);let list=store.list();assert.equal(list.entries.length,1);assert.equal(list.entries[0].legacy,true);assert.equal(s.getItem('study_solar_note_v1:lidong'),raw);
 store.save(note(),null);store.save(note('note-b',{date:'2026-11-18'}),null);assert.equal(store.list().entries.length,3);assert.equal(s.getItem('study_solar_note_v1:lidong'),raw);
 const legacy=list.entries[0];store.save({...legacy,hometown:'河北正定',weather:'多云'},raw);const saved=JSON.parse(s.getItem('study_solar_note_v1:lidong'));assert.equal(saved.version,1);assert.equal(saved.diaryVersion,2);assert.equal(saved.text,'旧笔记原文。');assert.equal(saved.hometown,'河北正定');
 assert.equal(store.list().entries.length,3);
});
test('修改与删除检查原记录，确认覆盖不越过后来的新改动，存储失败不冒充保存',()=>{
 const s=storage(),store=D.createStore(s,ids,data.experience.diary.weather);const first=store.save(note(),null);
 const other=store.save(note('note-a',{text:'另一个窗口先保存。'}),first.raw);
 const conflict=store.save(note('note-a',{text:'我眼前的版本。'}),first.raw);assert.equal(conflict.conflict,true);assert.equal(conflict.raw,other.raw);
 const later=store.save(note('note-a',{text:'另一窗口又改了。'}),other.raw);assert.equal(store.save(note(),first.raw,conflict.raw).conflict,true);
 assert.equal(store.remove('note-a',first.raw),false);assert.equal(store.remove('note-a',later.raw),true);
 s.setItem=()=>{throw new DOMException('quota','QuotaExceededError');};assert.throws(()=>store.save(note('note-c'),null),{name:'QuotaExceededError'});
});
test('日记校验天气、温度、真实日期；坏记录留在原存储，导出和筛选保留家乡与季节',()=>{
 const s=storage(),store=D.createStore(s,ids,data.experience.diary.weather);
 for(const extra of [{date:'2026-02-30'},{hometown:''},{weather:'随机值'},{temperature:100},{temperature:'NaN'},{term:'unknown'}])assert.throws(()=>store.save(note('bad',extra),null));
 const minimal=store.save(note('temperature-only',{weather:'',plants:'',animals:'',text:'',temperature:0}),null);assert.equal(minimal.note.temperature,0);
 s.setItem('study_solar_diary_v2:broken','{');assert.equal(store.list().issues.length,1);assert.equal(s.getItem('study_solar_diary_v2:broken'),'{');
 const entries=[note(),note('note-b',{date:'2025-05-05',term:'lixia',hometown:'河北正定'})],seasons={lidong:'dong',lixia:'xia'};
 assert.equal(D.selectEntries(entries,{year:'2026',season:'dong',home:'浙江杭州'},seasons).length,1);
 assert.equal(D.selectEntries(entries,{year:'2025',season:'dong',home:'all'},seasons).length,0);
 const text=D.exportText(entries,{lidong:'立冬',lixia:'立夏'});assert.match(text,/浙江杭州/);assert.match(text,/银杏叶黄了/);assert.match(text,/18℃/);assert.match(text,/2025-05-05 · 立夏/);
});
test('96幅场景都有有限帧，连看四幅到习俗结束，解冻和消隐方向不会反过来',()=>{
 let count=0;for(const t of terms)for(const kind of [...t.phenology.map(p=>p.scene),t.custom_scene]){for(const p of [0,.5,1]){const svg=S.picture(kind,p);assert.match(svg,/<svg/);assert.doesNotMatch(svg,/NaN|Infinity|undefined/);}count++;}assert.equal(count,96);
 assert.deepEqual(S.timelineFrame(1,true,0),{index:3,position:1});assert.deepEqual(S.timelineFrame(0,true,3),{index:0,position:0});assert.deepEqual(S.timelineFrame(1,false,2),{index:2,position:1});
 assert.notEqual(S.picture('thaw',0),S.picture('thaw',1));assert.match(S.picture('rainbow-hide',1),/opacity="0\.15/);assert.match(S.picture('old-saying',1),/古人的想象/);
 for(const kind of data.experience.scenes.kinds)assert.ok(new Set([0,.125,.5,.875,1].map(t=>S.picture(kind,t))).size>1,kind+' 需要实际画面变化');
});
