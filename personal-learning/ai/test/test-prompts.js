'use strict';
const assert = require('node:assert/strict');
const data = require('../ai-prompts-data.js');
const core = require('../ai-prompts-core.js');
function text(value, where) {
  assert.equal(typeof value, 'string', where);
  assert.ok(value.trim(), where + ' 不能为空');
  assert.ok(!/["\r\n]/.test(value), where + ' 使用中文标点和分段数组');
}
const categories = new Set();
for (const item of data.categories) {
  assert.match(item.id, /^[a-z][a-z0-9-]+$/);
  assert.ok(!categories.has(item.id)); categories.add(item.id);
  text(item.name, item.id); text(item.description, item.id);
}
assert.equal(categories.size, 7);
assert.ok(data.commonRules.length >= 2);
data.commonRules.forEach(value => text(value, '通用约定'));
const ids = new Set();
for (const item of data.prompts) {
  assert.match(item.id, /^[a-z][a-z0-9-]+$/);
  assert.ok(!ids.has(item.id)); ids.add(item.id);
  assert.ok(categories.has(item.category));
  ['title', 'summary', 'deliverable'].forEach(key => text(item[key], item.id + '.' + key));
  assert.ok(item.tags.length >= 2 && item.checks.length >= 3 && item.followups.length >= 2);
  [...item.tags, ...item.checks, ...item.followups].forEach(value => text(value, item.id));
  assert.ok(item.fields.length >= 3 && item.fields.length <= 7);
  const fields = new Set();
  for (const field of item.fields) {
    assert.match(field.id, /^[a-z][a-z0-9-]+$/);
    assert.ok(!fields.has(field.id)); fields.add(field.id);
    text(field.label, item.id); text(field.example, item.id);
  }
  assert.ok(item.body.length >= 6);
  item.body.forEach(value => text(value, item.id));
  const tokens = new Set([...item.body.join(' ').matchAll(/\{\{([a-z][a-z0-9-]*)\}\}/g)].map(match => match[1]));
  assert.deepEqual(tokens, fields, item.id + ' 字段应与正文占位符对应');
  const values = Object.fromEntries(item.fields.map(field => [field.id, '填写：' + field.label]));
  const built = core.build(item, values, true, data);
  assert.ok(item.fields.every(field => built.includes('填写：' + field.label)));
  assert.ok(!built.includes('{{'));
  assert.ok(built.includes(data.commonRules[0]));
  assert.ok(!core.build(item, values, false, data).includes(data.commonRules[0]));
  assert.ok(core.build(item, {}, false, data).includes('【待填：'));
  assert.ok(core.build(item, Object.fromEntries(item.fields.map(field => [field.id, '字'.repeat(4000)])), true, data).length <= 28000, '填写项上限不应超过正文容量');
}
for (const id of categories) assert.ok(data.prompts.filter(item => item.category === id).length >= 5);
assert.ok(ids.size >= 35);
assert.equal(core.route('#prompts', data).view, 'prompts');
assert.equal(core.route('#category=frontend', data).category, 'frontend');
assert.equal(core.route('#category=missing', data).category, 'all');
assert.equal(core.route('#prompt=repo-onboard', data).item.id, 'repo-onboard');
assert.equal(core.route('#prompt=missing', data).view, 'prompts');
assert.equal(core.route('#lesson=rag', data), null);
assert.equal(core.route('#practice', data), null);
assert.ok(core.matches(data.prompts.find(item => item.id === 'frontend-api'), '前端 接口'));
assert.ok(!core.matches(data.prompts[0], '完全不存在'));
assert.notEqual(core.key, require('../ai-state.js').key);
assert.notEqual(core.key, require('../ai-practice-core.js').key);
assert.deepEqual(core.normalize(null, data), { favorites: {}, drafts: {}, lastPrompt: null });
const first = data.prompts[0];
const fieldId = first.fields[0].id;
const normalized = core.normalize({ favorites: { [first.id]: true, removed: true }, drafts: { [first.id]: { values: { [fieldId]: '字'.repeat(5000), removed: 'x' }, custom: '字'.repeat(30000), rules: false }, removed: {} }, lastPrompt: 'removed' }, data);
assert.deepEqual(normalized.favorites, { [first.id]: true });
assert.equal(normalized.drafts[first.id].values[fieldId].length, 4000);
assert.equal(normalized.drafts[first.id].values.removed, undefined);
assert.equal(normalized.drafts[first.id].custom.length, 28000);
assert.equal(normalized.drafts[first.id].rules, false);
assert.equal(normalized.lastPrompt, null);
const literal = '$& <script> {{project}}';
assert.ok(core.build(first, { [fieldId]: literal }, false, data).includes(literal), '填写内容应按原文插入，不再次解析');
console.log('✅ 开发提示词：' + categories.size + ' 类、' + ids.size + ' 个模板；字段、组合搜索、占位符、独立草稿与收藏校验通过');
