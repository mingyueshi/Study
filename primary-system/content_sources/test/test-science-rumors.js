const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { schema_version, verdicts, cases } = require('../science-rumors.json');
const illustrations = fs.readFileSync(path.join(__dirname, '../../static/science/rumors.svg'), 'utf8');
const slugPattern = /^[a-z]+(?:-[a-z]+)*$/;

function checkText(text) {
  assert.equal(typeof text, 'string');
  assert.ok(text.trim(), '正文不能留空');
  assert.doesNotMatch(text, /["\r\n]/, '正文用中文引号且不能有裸换行');
}

assert.equal(schema_version, 1);
assert.deepEqual(Object.keys(verdicts), ['supported', 'false', 'depends', 'unclear']);
Object.values(verdicts).forEach(checkText);
assert.ok(cases.length > 0);
assert.equal(new Set(cases.map(item => item.slug)).size, cases.length);
assert.deepEqual(new Set(cases.map(item => item.verdict)), new Set(Object.keys(verdicts)));

for (const item of cases) {
  assert.match(item.slug, slugPattern);
  assert.ok(illustrations.includes(`<symbol id="${item.slug}"`), `${item.slug} 缺少本地图示`);
  for (const field of ['category', 'claim', 'teaser', 'scenario', 'explanation', 'hint', 'method', 'transfer']) {
    checkText(item[field]);
  }
  assert.equal(item.evidence.length, 2);
  for (const clue of item.evidence) {
    checkText(clue.title);
    checkText(clue.body);
  }
  assert.ok(item.sources.length > 0);
  for (const source of item.sources) {
    checkText(source.label);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
}

console.log(`科学流言粉碎机：${cases.length} 份查证任务通过结构校验。`);
