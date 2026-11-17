'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.window={};
require('../history-timeline/content.js');require('../history-timeline/timeline-data.js');
require('../history-timeline/media-data.js');require('../history-timeline/people-data.js');
require('../history-timeline/ancient-science-data.js');
const D=window.ANCIENT_SCIENCE;let checks=0;
const check=(v,message)=>{checks++;assert.ok(v,message);};
const text=v=>typeof v==='string'&&v.trim().length>0&&!/[\r\n]/.test(v);
const id=v=>typeof v==='string'&&/^[a-z][a-z0-9-]*$/.test(v);
const refs=v=>Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(k=>D.sources[k]);
const eventIds=new Set(window.TIMELINE_EVENTS.map(e=>e.id)),peopleIds=new Set(window.HISTORY_PEOPLE.people.map(p=>p.id)),eras=new Set(window.TIMELINE_ERAS.map(e=>e.id));
const categories=new Set();for(const c of D.categories){check(id(c.id)&&!categories.has(c.id)&&text(c.label)&&text(c.intro)&&/^#[0-9a-f]{6}$/i.test(c.color),'分类应完整且编号唯一');categories.add(c.id);}
check(categories.size===6,'覆盖四大发明、天文历法、数学、医学、水利、建筑六类');
for(const [key,s]of Object.entries(D.sources))check(id(key)&&text(s.title)&&text(s.publisher)&&/^https:\/\/[^\s]+$/.test(s.url),key+' 出处无效');
const topics=new Set();
for(const t of D.topics){
  check(id(t.id)&&!topics.has(t.id),'专题编号应稳定唯一');topics.add(t.id);
  check(categories.has(t.category)&&eras.has(t.era)&&Number.isInteger(t.year)&&t.year!==0,t.id+' 分类和代表年代应有效');
  for(const f of ['title','period','summary','question','principle'])check(text(t[f]),t.id+' 缺少 '+f);
  check(Array.isArray(t.tags)&&t.tags.length>=2&&t.tags.every(text)&&refs(t.sources),t.id+' 应有关键词和出处');
  check(Array.isArray(t.steps)&&t.steps.length>=3&&t.steps.every(s=>text(s.title)&&text(s.text)),t.id+' 原理应渐进解释');
  check(t.evidence&&['title','text','limits'].every(f=>text(t.evidence[f])),t.id+' 应区分史料、解释和局限');
  check(Array.isArray(t.impact)&&t.impact.length>=2&&t.impact.every(text),t.id+' 影响应说明条件');
  check(t.misconception&&text(t.misconception.claim)&&text(t.misconception.explanation),t.id+' 应有辨误');
  check(t.reflection&&text(t.reflection.question)&&text(t.reflection.answer),t.id+' 应有讨论问题与参考');
  check(Array.isArray(t.eventIds)&&t.eventIds.every(k=>eventIds.has(k)),t.id+' 事件关联无效');
  check(Array.isArray(t.people)&&t.people.every(p=>peopleIds.has(p.id)&&text(p.role)),t.id+' 人物角色应注明');
  check(t.demo===null||['printing','pi','water'].includes(t.demo),t.id+' 演示类型无效');
  check(Array.isArray(t.images)&&t.images.length>0,t.id+' 应有本地观察素材');
  for(const entry of t.images){
    let image=entry;
    if(entry.imageRef){check(D.images[entry.imageRef],t.id+' 图片索引无效');image=D.images[entry.imageRef];}
    if(entry.mediaEvent){check(window.TIMELINE_MEDIA[entry.mediaEvent]?.[0]?.type==='image',t.id+' 事件图片无效');image=window.TIMELINE_MEDIA[entry.mediaEvent][0];}
    if(entry.personImage){check(peopleIds.has(entry.personImage),t.id+' 人物图像无效');image=window.HISTORY_PEOPLE.people.find(p=>p.id===entry.personImage).image;}
    check(['alt','caption','credit','source'].every(f=>text(image[f]))&&/^https:\/\//.test(image.source),t.id+' 图像需有图注与来源');
    check([image.width,image.height].every(n=>Number.isInteger(n)&&n>0),t.id+' 图像尺寸无效');
    check(/^assets\/(history|people|ancient-science)\/[a-z0-9-]+\.(jpg|png|webp)$/.test(image.src),t.id+' 应使用目录内图片');
    const bytes=fs.readFileSync(path.join(__dirname,'../history-timeline',image.src));check(bytes[0]===255&&bytes[1]===216||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),t.id+' 图像不能误存为错误页');
  }
}
for(const required of ['paper','printing','compass','gunpowder','sky-observation','calendar','pi','rods','herbals','dujiangyan','wood-building','stone-bridge'])check(topics.has(required),'缺少专题 '+required);
check(D.demos.pi.sides.every(n=>Number.isInteger(n)&&n>=6&&n<=192)&&D.demos.pi.sides.length>=4,'割圆演示边数应有效');
check(D.demos.printing.stages.length>=3&&D.demos.printing.stages.every(s=>id(s.id)&&text(s.label)&&text(s.text)),'排印演示阶段需有讲解');
check(D.demos.printing.blockLabels.length===D.demos.printing.stages.length&&D.demos.printing.blockLabels.every(text)&&D.demos.printing.blockStages.length===D.demos.printing.stages.length&&D.demos.printing.blockStages.every(text)&&['type','block'].every(k=>text(D.demos.printing.changeNotes[k])),'雕版与活字的操作含义应分别解释');
check(D.demos.water.modes.length===2&&D.demos.water.modes.every(m=>id(m.id)&&text(m.label)&&text(m.text)),'水利演示应解释枯水与丰水情境');
check(D.demos.water.features.length===3&&D.demos.water.features.every(f=>text(f.title)&&text(f.text))&&text(D.demos.water.boundary)&&text(D.demos.pi.boundary),'演示应有部件说明和模型边界');
console.log(`古代科技 ${topics.size} 个专题、${categories.size} 类、3 个原理演示；${checks} 项校验通过。`);
