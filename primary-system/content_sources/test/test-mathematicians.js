'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const course = require('../mathematicians.json');
const staticRoot = path.resolve(__dirname, '../../static');
const slug = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function text(record, keys, context) {
  for (const key of keys) {
    assert.ok(typeof record[key] === 'string' && record[key].trim(), `${context}.${key} 应有文字`);
  }
}

function ids(items, context) {
  assert.ok(Array.isArray(items) && items.length, `${context} 应有至少一项`);
  const result = new Set();
  for (const item of items) {
    assert.ok(typeof item.id === 'string' && slug.test(item.id), `${context} ID 无效`);
    assert.ok(!result.has(item.id), `${context} ID 重复：${item.id}`);
    result.add(item.id);
  }
  return result;
}

function source(item, context) {
  text(item, ['label', 'url'], context);
  const url = new URL(item.url);
  assert.equal(url.protocol, 'https:', context);
  assert.ok(!url.username && !url.password, context);
}

assert.equal(course.schema_version, 1);
const groups = ids(course.groups, '分组');
const people = ids(course.people, '人物');
assert.ok(people.has(course.featured), '首页推荐应引用本专题人物');
ids(course.trails, '联读路线');

for (const group of course.groups) {
  text(group, ['title'], group.id);
  assert.ok(course.people.some(person => person.group === group.id), `${group.id} 应有人物`);
}

const linked = new Set();
for (const trail of course.trails) {
  text(trail, ['title', 'intro'], trail.id);
  assert.ok(Array.isArray(trail.people) && new Set(trail.people).size === trail.people.length && trail.people.length >= 2, trail.id);
  for (const id of trail.people) {
    assert.ok(people.has(id), `${trail.id} 引用不存在的人物 ${id}`);
    linked.add(id);
  }
}
assert.deepEqual(linked, people, '每位人物至少有一条联读路线');

for (const person of course.people) {
  const id = person.id;
  assert.ok(groups.has(person.group), `${id} 分组不存在`);
  text(person, ['name', 'place', 'years', 'field', 'question', 'problem', 'notation', 'result', 'evidence'], id);
  for (const key of ['biography', 'steps']) {
    assert.ok(Array.isArray(person[key]) && person[key].length >= 2, `${id}.${key} 需要分段`);
    for (const part of person[key]) text(part, ['title', 'text'], `${id}.${key}`);
  }
  text(person.practice, ['prompt', 'answer'], `${id}.practice`);
  assert.ok(Array.isArray(person.sources) && person.sources.length, `${id} 缺少出处`);
  for (const item of person.sources) source(item, id);
  if (person.extension) {
    text(person.extension, ['label', 'route'], `${id}.extension`);
    assert.ok(Array.isArray(person.extension.args) && person.extension.args.every(arg => typeof arg === 'string' && slug.test(arg)), id);
    assert.ok(/^(?:[?#].*)?$/.test(person.extension.suffix), id);
  }
  if (person.artifact) {
    text(person.artifact, ['path', 'caption', 'alt'], `${id}.artifact`);
    source(person.artifact, `${id}.artifact`);
    const file = path.resolve(staticRoot, person.artifact.path);
    assert.ok(file.startsWith(staticRoot + path.sep) && fs.statSync(file).isFile(), `${id} 缺少本地素材`);
  }
  if (person.bridges) {
    const places = ids(person.bridges.places, `${id}.places`);
    for (const place of person.bridges.places) text(place, ['label'], id);
    assert.equal(places.size, 4, id);
    assert.equal(person.bridges.edges.length, 7, id);
    const degree = new Map([...places].map(place => [place, 0]));
    for (const edge of person.bridges.edges) {
      assert.ok(Array.isArray(edge) && edge.length === 2 && edge[0] !== edge[1], id);
      for (const place of edge) {
        assert.ok(places.has(place), `${id} 桥端地点不存在`);
        degree.set(place, degree.get(place) + 1);
      }
    }
    assert.deepEqual([...degree.values()].sort(), [3, 3, 3, 5], id);
  }
}

console.log(`数学家的故事：${course.people.length} 位人物、${course.trails.length} 条联读路线校验通过`);
