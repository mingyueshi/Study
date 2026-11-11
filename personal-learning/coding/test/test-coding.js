'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../coding-data.js');
const core = require('../coding-core.js');
const root = path.resolve(__dirname, '../..');
const toolIds = new Set(require('../../dev/dev-data.js').tools.map(item => item.id));
const promptIds = new Set(require('../../ai/ai-prompts-data.js').prompts.map(item => item.id));
function text(value, where, empty = false) {
 assert.equal(typeof value, 'string', where);
 assert.ok(empty || value.trim(), where + ' 不能为空');
 assert.ok(!/["\r\n]/.test(value), where + ' 使用中文标点与行数组');
}
const ids=new Set();
function id(item) {assert.match(item.id,/^[a-z][a-z0-9-]+$/);assert.ok(!ids.has(item.id));ids.add(item.id);}
function strings(values,where,min=1) {assert.ok(Array.isArray(values)&&values.length>=min,where);values.forEach(x=>text(x,where));}
function sources(item) {strings(item.sources,item.id+'.sources');item.sources.forEach(x=>assert.ok(data.sources[x]));}
function localLink(link) {
 text(link.label,'关联名称');
 const [file,hash]=link.href.split('#');
 const target=path.resolve(root,'coding',file);
 assert.ok(target.startsWith(root+path.sep)&&fs.existsSync(target),'关联入口存在：'+link.href);
 assert.ok(hash,'关联须直达内容');
 const params = new URLSearchParams(hash);
 if (file.includes('/dev/')) assert.ok(toolIds.has(params.get('tool')), '关联的命令工具应存在');
 if (file.includes('/ai/')) assert.ok(promptIds.has(params.get('prompt')), '关联的开发提示词应存在');
}
assert.deepEqual(data.tracks.map(x=>x.id),['python','vue','django']);
assert.match(data.checkedAt,/^\d{4}-\d{2}-\d{2}$/);
for(const value of Object.values(data.sources)){text(value.title,'官方资料');assert.equal(new URL(value.url).protocol,'https:');}
const lessonIds=new Set();
for(const track of data.tracks){
 id(track);['name','kind','summary','baseline','outcome'].forEach(k=>text(track[k],track.id));strings(track.prerequisites,track.id);sources(track);
 assert.ok(track.lessons.length>=10);
 for(const lesson of track.lessons){
  id(lesson);lessonIds.add(lesson.id);['title','summary'].forEach(k=>text(lesson[k],lesson.id));
  strings(lesson.body,lesson.id,2);strings(lesson.pitfalls,lesson.id,2);strings(lesson.steps,lesson.id,2);sources(lesson);
  text(lesson.task.goal,lesson.id);strings(lesson.task.checks,lesson.id,2);
  assert.ok(lesson.blocks.length>=1);
  for(const block of lesson.blocks){
   ['label','context','filename'].forEach(k=>text(block[k],lesson.id));
   assert.ok(['python','javascript','vue','shell'].includes(block.language));
   assert.ok(['run','fragment','commands'].includes(block.kind));
   assert.ok(Array.isArray(block.lines)&&block.lines.length>=2);block.lines.forEach(x=>text(x,lesson.id,true));
   strings(block.expected,lesson.id);
  }
  text(lesson.quiz.question,lesson.id);text(lesson.quiz.explanation,lesson.id);
  assert.equal(lesson.quiz.options.length,3);strings(lesson.quiz.options,lesson.id,3);
  assert.ok(Number.isInteger(lesson.quiz.answer)&&lesson.quiz.answer>=0&&lesson.quiz.answer<3);
  lesson.links.forEach(localLink);
 }
}
assert.equal(data.projects.length,3);
for(const project of data.projects){
 id(project);['title','summary','environment'].forEach(k=>text(project[k],project.id));
 assert.ok(data.tracks.some(x=>x.id===project.track));project.lessonIds.forEach(x=>assert.ok(lessonIds.has(x)));
 strings(project.steps,project.id,3);strings(project.checks,project.id,3);strings(project.commands,project.id,2);sources(project);
 const paths=new Set();assert.ok(project.files.length>=2);
 for(const file of project.files){
  assert.match(file.path,/^[a-zA-Z0-9_][a-zA-Z0-9_./-]*$/);assert.ok(!file.path.split('/').includes('..'));assert.ok(!paths.has(file.path));paths.add(file.path);
  assert.ok(Array.isArray(file.lines));file.lines.forEach(line=>text(line,file.path,true));
 }
}
assert.equal(core.route('',data).view,'home');
assert.equal(core.route('#track=vue',data).track.id,'vue');
assert.equal(core.route('#lesson=py-values',data).lesson.id,'py-values');
assert.equal(core.route('#projects',data).view,'projects');
assert.equal(core.route('#project=python-cli',data).project.id,'python-cli');
assert.equal(core.route('#lesson=missing',data).view,'home');
const lessons=core.lessons(data);
assert.equal(lessons.length,30);
assert.ok(core.matches(lessons.find(x=>x.id==='dj-queries'),'Django 查询'));
assert.deepEqual(core.normalize(null,data),{completed:{},answers:{},notes:{},lastLesson:null});
const state=core.normalize({completed:{'py-values':true,removed:true},answers:{'py-values':2,'vue-start':8},notes:{'py-values':'字'.repeat(3000),removed:'x'},lastLesson:'missing'},data);
assert.deepEqual(state.completed,{'py-values':true});assert.equal(state.notes['py-values'].length,2000);assert.equal(state.lastLesson,null);assert.equal(state.answers['vue-start'],undefined);
assert.ok(!['personal_ai_v1','personal_ai_practice_v1','personal_ai_prompts_v1','personal_dev_v1'].includes(core.key));
const zip=core.zip(data.projects[0].files);
assert.ok(zip instanceof Uint8Array && zip[0]===0x50 && zip[1]===0x4b,'可离线生成 ZIP');
assert.throws(()=>core.zip([{path:'../outside.txt',lines:['x']}]),/路径/);
assert.throws(()=>core.zip([{path:'a.txt',lines:['x']},{path:'a.txt',lines:['y']}]),/重复/);
console.log('✅ 语言与框架：3 条路线、30 节课、3 个项目；结构、关联、路由、搜索、独立进度与 ZIP 校验通过');
