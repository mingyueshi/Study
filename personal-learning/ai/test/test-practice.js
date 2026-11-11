'use strict';
const assert = require('node:assert/strict');
const guide = require('../ai-practice-data.js');
const course = require('../ai-data.js');
const core = require('../ai-practice-core.js');
assert.notEqual(core.key, require('../ai-state.js').key, '实操不能覆盖原概念档案');
assert.notEqual(core.key, 'personal_dev_v1');
const lessonIds = new Set(course.stages.flatMap(stage => stage.lessons.map(lesson => lesson.id)));
function text(value, where) {
  assert.equal(typeof value, 'string', where);
  assert.ok(value.trim(), where + ' 不能为空');
  assert.ok(!/["\r\n]/.test(value), where + ' 应使用中文标点和分段数组');
}
function strings(values, where, min = 1) {
  assert.ok(Array.isArray(values) && values.length >= min, where);
  values.forEach(value => text(value, where));
}
function ids(items, where) {
  const result = new Set();
  for (const item of items) {
    assert.match(item.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(!result.has(item.id), where + ' ID 重复'); result.add(item.id);
  }
  return result;
}
assert.match(guide.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
const modelIds = ids(guide.models, '模型');
const toolIds = ids(guide.tools, '工具');
const labIds = ids(guide.labs, '实操');
const categoryIds = ids(guide.categories, '工具分类');
assert.ok(guide.modelBasics.length >= 2 && guide.modelGlossary.length >= 3);
for (const item of [...guide.modelBasics, ...guide.modelGlossary]) {
  text(item.term, '模型说明词'); text(item.description, item.term);
  if (item.sources) item.sources.forEach(id => assert.ok(guide.sources[id], item.term + ' 缺少来源'));
}
for (const category of guide.categories) text(category.name, category.id);
for (const source of Object.values(guide.sources)) {
  text(source.title, '资料名称'); assert.equal(new URL(source.url).protocol, 'https:');
}
function sources(entry) {
  strings(entry.sources, entry.id + '.sources');
  entry.sources.forEach(id => assert.ok(guide.sources[id], '缺少资料：' + id));
}
for (const model of guide.models) {
  ['name', 'provider', 'summary', 'accessNote', 'choose', 'caution'].forEach(key => text(model[key], model.id + '.' + key));
  strings(model.useCases, model.id + '.useCases', 2);
  strings(model.access, model.id + '.access');
  model.access.forEach(value => assert.ok(['hosted', 'weights'].includes(value)));
  model.toolIds.forEach(id => assert.ok(toolIds.has(id))); sources(model);
}
for (const tool of guide.tools) {
  ['name', 'summary', 'environment', 'firstTask', 'caution'].forEach(key => text(tool[key], tool.id + '.' + key));
  assert.ok(categoryIds.has(tool.category));
  assert.equal(new URL(tool.url).protocol, 'https:');
  strings(tool.steps, tool.id + '.steps', 3);
  tool.modelIds.forEach(id => assert.ok(modelIds.has(id))); sources(tool);
}
for (const lab of guide.labs) {
  ['title', 'summary', 'duration', 'environment', 'deliverable'].forEach(key => text(lab[key], lab.id + '.' + key));
  assert.ok(['入门', '开发与运维', '资料与数据', '本地与工作流'].includes(lab.category));
  strings(lab.prompt, lab.id + '.prompt', 3);
  strings(lab.steps, lab.id + '.steps', 3);
  strings(lab.checks, lab.id + '.checks', 3);
  strings(lab.reference, lab.id + '.reference', 2);
  lab.toolIds.forEach(id => assert.ok(toolIds.has(id)));
  lab.lessonIds.forEach(id => assert.ok(lessonIds.has(id)));
  for (const material of lab.materials) {
    text(material.title, lab.id + '.material.title');
    assert.match(material.filename, /^[a-z0-9][a-z0-9._-]*\.(txt|csv|js)$/);
    assert.ok(!material.filename.includes('..'));
    strings(material.lines, lab.id + '.material.lines');
  }
  if (lab.validation) {
    assert.equal(lab.validation.kind, 'ticket-json');
    assert.equal(new Set(lab.validation.rows.map(row => row.id)).size, lab.validation.rows.length);
    lab.validation.rows.forEach(row => ['id', 'category', 'evidence'].forEach(key => text(row[key], '参考结果')));
  }
  sources(lab);
}
assert.ok(modelIds.size >= 8 && toolIds.size >= 13 && labIds.size >= 9);
assert.equal(core.route('#lesson=rag', guide), null, '原概念链接交回基础课程处理');
assert.equal(core.route('#lab=log-triage', guide).item.id, 'log-triage');
assert.equal(core.route('#model=qwen', guide).item.id, 'qwen');
assert.equal(core.route('#tool=ollama', guide).item.id, 'ollama');
assert.equal(core.route('#lab=removed', guide).view, 'practice');
assert.equal(core.route('#model=removed', guide).view, 'models');
assert.equal(core.route('#tool=removed', guide).view, 'tools');
assert.ok(core.matches(guide.tools.find(item => item.id === 'ollama'), '本地 模型'));
assert.ok(!core.matches(guide.models[0], '完全不存在的词'));
const empty = { completed: {}, checks: {}, notes: {}, prompts: {}, outputs: {}, lastLab: null };
assert.deepEqual(core.normalize(null, guide), empty);
const dirty = core.normalize({ completed: { 'log-triage': true, removed: true }, checks: { 'log-triage': [true, 1, false, true, true, true, true] }, notes: { 'log-triage': '<script>笔记</script>', removed: '旧' }, prompts: { 'log-triage': '字'.repeat(13000) }, outputs: { 'ticket-json': '字'.repeat(17000) }, lastLab: 'removed' }, guide);
assert.deepEqual(dirty.completed, { 'log-triage': true });
assert.equal(dirty.notes['log-triage'], '<script>笔记</script>');
assert.equal(dirty.prompts['log-triage'].length, 12000);
assert.equal(dirty.outputs['ticket-json'].length, 16000);
assert.equal(dirty.lastLab, null);
assert.ok(dirty.checks['log-triage'].every(value => typeof value === 'boolean'));
assert.equal(dirty.checks['log-triage'].length, guide.labs.find(item => item.id === 'log-triage').checks.length);
const ticket = guide.labs.find(item => item.id === 'ticket-json');
const expected = JSON.stringify(ticket.validation.rows);
assert.equal(core.validate(ticket, expected).ok, true);
assert.equal(core.validate(ticket, '{bad').ok, false);
assert.equal(core.validate(ticket, '{}').ok, false);
assert.equal(core.validate(ticket, JSON.stringify([...ticket.validation.rows, ticket.validation.rows[0]])).ok, false);
assert.equal(core.validate(ticket, expected.replace('登录', '支付')).ok, false, '结构正确也要核对材料内容');
assert.equal(core.validate(ticket, expected.replace(ticket.validation.rows[0].evidence, '编造的证据')).ok, false);
assert.ok(core.prompt(ticket).includes(ticket.materials[0].lines[0]));
assert.ok(!core.prompt(ticket).includes('参考结果'), '复制提示词不混入参考答案');
console.log('✅ 实操资料、模型工具关联、深链接、组合搜索、本机档案和 JSON 结果检查通过');
