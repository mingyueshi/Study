const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { schema_version, verdicts, cases } = require('../science-rumors.json');
const illustrations = fs.readFileSync(path.join(__dirname, '../../static/science/rumors.svg'), 'utf8');
const slugPattern = /^[a-z]+(?:-[a-z]+)*$/;
const staticRoot = path.join(__dirname, '../../static');

function checkText(text) {
  assert.equal(typeof text, 'string');
  assert.ok(text.trim(), '正文不能留空');
  assert.doesNotMatch(text, /["\r\n]/, '正文用中文引号且不能有裸换行');
}

function checkAsset(asset, extensions) {
  assert.match(asset, /^[a-z0-9/_-]+\.[a-z0-9]+$/);
  assert.ok(!asset.startsWith('/') && !asset.includes('..'), '素材使用系统内的相对路径');
  assert.ok(extensions.includes(path.extname(asset)), `素材格式不受支持：${asset}`);
  assert.ok(fs.statSync(path.join(staticRoot, asset)).size > 0, `素材不能为空：${asset}`);
}

assert.equal(schema_version, 1);
assert.deepEqual(Object.keys(verdicts), ['supported', 'false', 'depends', 'unclear']);
Object.values(verdicts).forEach(checkText);
assert.ok(cases.length > 0);
assert.equal(new Set(cases.map(item => item.slug)).size, cases.length);
assert.deepEqual(new Set(cases.map(item => item.verdict)), new Set(Object.keys(verdicts)));

for (const item of cases) {
  assert.match(item.slug, slugPattern);
  assert.ok(illustrations.includes(`<symbol id="${item.icon || item.slug}"`), `${item.slug} 缺少本地图示`);
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
  if (item.media) {
    assert.ok(item.media.length > 0);
    for (const media of item.media) {
      assert.ok(['image', 'video'].includes(media.kind));
      for (const field of ['alt', 'caption', 'credit']) checkText(media[field]);
      assert.equal(new URL(media.source_url).protocol, 'https:');
      checkAsset(media.path, media.kind === 'image' ? ['.jpg', '.webp', '.png'] : ['.mp4', '.m4v']);
      if (media.kind === 'video') checkAsset(media.poster, ['.jpg', '.webp', '.png']);
    }
  }
  if (item.activity) {
    for (const field of ['title', 'materials', 'note']) checkText(item.activity[field]);
    assert.ok(item.activity.steps.length >= 2);
    item.activity.steps.forEach(checkText);
  }
}

console.log(`科学流言粉碎机：${cases.length} 份查证任务通过结构校验。`);
