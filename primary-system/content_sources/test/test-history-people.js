'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
global.window = {};
require('../history-timeline/content.js');
require('../history-timeline/timeline-data.js');
require('../history-timeline/people-data.js');
const data = window.HISTORY_PEOPLE;
let count = 0;
const check = (condition, message) => { count++; assert.ok(condition, message); };
const text = value => typeof value === 'string' && value.trim().length > 0 && !/["';\r\n]/.test(value);
const id = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
const date = value => value === null || (Number.isInteger(value) && value !== 0 && value >= -5000 && value <= 2100);
const sources = new Set(Object.keys(data.sources));
const refs = value => Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every(key => sources.has(key));
check(Array.isArray(data.groups) && data.groups.length >= 4, '人物馆应覆盖至少四类身份');
const groups = new Set();
for (const group of data.groups) {
  check(id(group.id) && !groups.has(group.id), '分类 id 应稳定唯一'); groups.add(group.id);
  check(text(group.label) && text(group.intro) && /^#[0-9a-f]{6}$/i.test(group.color), '分类应有名称、说明和颜色');
}
const kinds = new Set();
for (const kind of data.relationKinds) {
  check(id(kind.id) && !kinds.has(kind.id), '关系类型 id 应唯一'); kinds.add(kind.id);
  check(text(kind.label) && text(kind.note) && typeof kind.direct === 'boolean', '关系类型应说明直接交往与背景联系');
}
for (const [key, source] of Object.entries(data.sources)) {
  check(id(key) && text(source.title) && text(source.publisher) && /^https:\/\/[^\s]+$/.test(source.url), key + ' 出处应可核查');
}
const events = new Set(window.TIMELINE_EVENTS.map(ev => ev.id));
const eras = new Set(window.TIMELINE_ERAS.map(era => era.id));
const people = new Map(), decisions = new Set();
for (const person of data.people) {
  check(id(person.id) && !people.has(person.id), '人物 id 应稳定唯一'); people.set(person.id, person);
  check(groups.has(person.group) && eras.has(person.era), person.id + ' 分类与时代应有效');
  for (const field of ['name', 'life', 'region', 'role', 'summary']) check(text(person[field]), person.id + ' 缺少中文字段 ' + field);
  check(date(person.born) && date(person.died) && (person.born === null || person.died === null || person.born < person.died), person.id + ' 生卒年应合法，不详用 null');
  check(date(person.anchorYear) && person.anchorYear !== null, person.id + ' 应有时间轴定位年');
  check((person.born === null || person.anchorYear >= person.born) && (person.died === null || person.anchorYear <= person.died), person.id + ' 定位年应处于生平内');
  check(Array.isArray(person.aliases) && person.aliases.every(text), person.id + ' 别名应有效');
  check(Array.isArray(person.tags) && person.tags.length >= 2 && person.tags.every(text), person.id + ' 应有检索标签');
  check(Array.isArray(person.facts) && person.facts.length >= 2 && person.facts.every(f => text(f.label) && text(f.text)), person.id + ' 应有至少两项事迹');
  check(Array.isArray(person.eventIds) && person.eventIds.every(key => events.has(key)), person.id + ' 应关联已有事件');
  check(refs(person.sources), person.id + ' 应注明人物资料出处');
  const image = person.image;
  check(image && /^assets\/(people|history)\/[a-z0-9-]+\.(jpg|png|webp)$/.test(image.src) && fs.existsSync(path.join(__dirname, '../history-timeline', image.src)), person.id + ' 应有本地图片');
  check(image && [image.width, image.height].every(n => Number.isInteger(n) && n > 0) && ['alt','caption','credit'].every(k => text(image[k])) && /^https:\/\//.test(image.source), person.id + ' 图片应有尺寸、替代文字与来源');
  const bytes = fs.readFileSync(path.join(__dirname, '../history-timeline', image.src));
  check(image.src.endsWith('.png') ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes[0] === 255 && bytes[1] === 216, person.id + ' 素材应为实际图片，不能误存下载错误页');
  check(Array.isArray(person.decisions) && person.decisions.length > 0, person.id + ' 应有关键决策');
  for (const decision of person.decisions) {
    check(id(decision.id) && !decisions.has(decision.id), '决策 id 应唯一'); decisions.add(decision.id);
    for (const field of ['title','period','context','action','outcome','limits','prompt']) check(text(decision[field]), decision.id + ' 缺少字段 ' + field);
    check(refs(decision.sources), decision.id + ' 应有事实出处');
  }
}
for (const group of groups) check(data.people.filter(p => p.group === group).length >= 4, group + ' 应有足够的人物供比较');
const relationIds = new Set(), endpoints = new Set();
for (const relation of data.relations) {
  const from = people.get(relation.from), to = people.get(relation.to);
  check(id(relation.id) && !relationIds.has(relation.id), '关系 id 应唯一'); relationIds.add(relation.id);
  check(from && to && from !== to && kinds.has(relation.kind), relation.id + ' 关系端点与类型应有效');
  const key = [relation.from, relation.to].sort().join(':') + ':' + relation.kind;
  check(!endpoints.has(key), relation.id + ' 关系不应重复'); endpoints.add(key);
  check(text(relation.label) && text(relation.note) && refs(relation.sources), relation.id + ' 应有关系说明与出处');
  if (data.relationKinds.find(k => k.id === relation.kind).direct) {
    check(Math.max(from.born ?? -Infinity, to.born ?? -Infinity) <= Math.min(from.died ?? Infinity, to.died ?? Infinity), relation.id + ' 直接关系不应跨越不相交的生平');
  }
}
console.log(`人物 ${people.size} 位，分类 ${groups.size} 类，关系 ${relationIds.size} 条，决策 ${decisions.size} 项；${count} 项检查通过。`);
