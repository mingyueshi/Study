/* 标注元数据只引用原省份、邻国和河流档案，先校验再接交互。 */
const assert=require('node:assert/strict');
global.window={};global.document={currentScript:null};
for(const f of ['content','map-data','world-data','atlas-data','atlas','map-discovery-data','china-river-tour-data'])require('../geo-map/'+f+'.js');
const D=window.GM_MAP_DISCOVERY;
assert.equal(Object.keys(D.provinces).length,34);
for(const p of window.GM_PROVINCES){const m=D.provinces[p.id];assert.ok(m&&m.point.length===2&&m.point.every(Number.isFinite));assert.ok(m.point[0]>=73&&m.point[0]<=136&&m.point[1]>=18&&m.point[1]<=54);assert.ok(Number.isInteger(m.climateFact)&&m.climateFact>=0&&typeof p.facts[m.climateFact]==='string');}
assert.match(D.source.sha256,/^[a-f0-9]{64}$/);
for(const key of ['url','dataUrl'])assert.equal(new URL(D.source[key]).protocol,'https:');
for(const value of [D.source.label,D.riverNote,D.capitalNote,D.neighborIntro]){assert.ok(typeof value==='string'&&value.trim());assert.ok(!/["\r\n]/.test(value),'文案不用英文双引号或裸换行');}
assert.deepEqual(D.rivers,['f20','f21']);
for(const id of D.rivers){assert.ok(window.GM_FEATURES.some(f=>f.id===id&&f.kind==='river'));assert.ok(window.GM_CHINA_RIVER_TOURS.routes.some(r=>r.river===id));}
assert.equal(D.durationSeconds,24);
assert.equal(window.GM_NEIGHBORS.filter(n=>n.rel==='land').length,14);
assert.equal(window.GM_NEIGHBORS.filter(n=>n.rel==='sea').length,6);
for(const n of window.GM_NEIGHBORS){assert.ok(window.GMAtlas.related(n.id).some(p=>p.category==='country'),'邻国必须关联世界地图档案：'+n.name);}
console.log('省会点位、地理特征引用、河流及二十个邻国关联校验通过');
