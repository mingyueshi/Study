'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
global.window={};
require('../history-timeline/content.js');
require('../history-timeline/timeline-data.js');
require('../history-timeline/media-data.js');
require('../history-timeline/civilizations-data.js');
const D=window.HISTORY_CIVILIZATIONS;
let checks=0;
const check=(value,message)=>{checks++;assert.ok(value,message);};
const text=value=>typeof value==='string'&&value.trim().length>0&&!/[\r\n]/.test(value);
const id=value=>typeof value==='string'&&/^[a-z][a-z0-9-]*$/.test(value);
const refs=value=>Array.isArray(value)&&value.length>0&&new Set(value).size===value.length&&value.every(key=>D.sources[key]);
const date=value=>Number.isInteger(value)&&value!==0&&value>=-5000&&value<=2100;
check(Array.isArray(D.civilizations)&&D.civilizations.length>=6,'应包含至少六个文明');
check(D.themes.map(t=>t.id).join(',')==='architecture,writing,governance,achievements','覆盖建筑、文字、制度、成就四个主题');
for(const theme of D.themes)check(id(theme.id)&&text(theme.label)&&text(theme.question),'主题应有稳定编号与讲解问题');
for(const [key,source] of Object.entries(D.sources))check(id(key)&&text(source.title)&&text(source.publisher)&&/^https:\/\/[^\s]+$/.test(source.url),key+' 来源无效');
const events=new Set(window.TIMELINE_EVENTS.map(e=>e.id)), eras=new Set(window.TIMELINE_ERAS.map(e=>e.id));
const seen=new Set(), stations=new Set();
for(const civ of D.civilizations){
  check(id(civ.id)&&!seen.has(civ.id),'文明编号应稳定唯一');seen.add(civ.id);
  for(const field of ['name','subtitle','region','period','scope','summary','question','caution'])check(text(civ[field]),civ.id+' 缺少 '+field);
  check(/^#[0-9a-f]{6}$/i.test(civ.color)&&date(civ.start)&&date(civ.end)&&civ.start<civ.end,civ.id+' 观察年代应有效');
  check(date(civ.anchorYear)&&civ.anchorYear>=civ.start&&civ.anchorYear<=civ.end,civ.id+' 时间轴定位年应在观察范围内');
  check(eras.has(civ.era)&&refs(civ.sources),civ.id+' 时代及资料出处应有效');
  check(Array.isArray(civ.tags)&&civ.tags.length>=3&&civ.tags.every(text),civ.id+' 应有检索关键词');
  check(Array.isArray(civ.eventIds)&&civ.eventIds.length>0&&civ.eventIds.every(key=>events.has(key)),civ.id+' 应关联已有事件');
  check(Array.isArray(civ.sections)&&civ.sections.length===4&&D.themes.every(theme=>civ.sections.some(s=>s.theme===theme.id)),civ.id+' 四个主题不完整');
  for(const section of civ.sections){
    check(id(section.id)&&!stations.has(section.id),'知识站编号应唯一');stations.add(section.id);
    for(const field of ['title','lead','example','explanation','prompt','answer','boundary'])check(text(section[field]),section.id+' 缺少 '+field);
    check(Array.isArray(section.points)&&section.points.length>=2&&section.points.every(text)&&refs(section.sources),section.id+' 需有知识点与依据');
  }
  check(Array.isArray(civ.milestones)&&civ.milestones.length>=3,civ.id+' 需有关键年代');
  let previous=-Infinity;
  for(const m of civ.milestones){check(date(m.year)&&m.year>=previous&&text(m.label)&&text(m.text),civ.id+' 年代应排序并有说明');previous=m.year;}
  check(Array.isArray(civ.images)&&civ.images.length>=2,civ.id+' 应有至少两项本地观察素材');
  for(const entry of civ.images){
    if(entry.mediaEvent)check(events.has(entry.mediaEvent)&&window.TIMELINE_MEDIA[entry.mediaEvent]?.[0]?.type==='image',civ.id+' 复用的素材应存在');
    const image=entry.mediaEvent?{...window.TIMELINE_MEDIA[entry.mediaEvent][0],theme:entry.theme}:entry;
    check(D.themes.some(t=>t.id===image.theme),civ.id+' 图像主题无效');
    for(const field of ['title','alt','caption','prompt','credit','license'])check(text(image[field]),civ.id+' 图像缺少 '+field);
    check(/^https:\/\//.test(image.source)&&[image.width,image.height].every(n=>Number.isInteger(n)&&n>0),civ.id+' 图像应有出处和尺寸');
    check(/^assets\/(history|civilizations)\/[a-z0-9-]+\.(jpg|png|webp)$/.test(image.src),civ.id+' 应使用目录内素材');
    const file=path.join(__dirname,'../history-timeline',image.src);check(fs.existsSync(file),civ.id+' 素材不存在');
    const bytes=fs.readFileSync(file);check(bytes[0]===255&&bytes[1]===216||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),civ.id+' 素材不能是下载错误页');
  }
}
for(const civ of ['egypt','greece','rome','maya','persia','arab-islamic'])check(seen.has(civ),'缺少用户指定文明 '+civ);
console.log(`文明 ${seen.size} 站，知识站 ${stations.size} 个，${checks} 项校验通过。`);
