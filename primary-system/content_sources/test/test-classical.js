// 源头与 Django 共用一个契约，避免两套校验漂移。
const {execFileSync} = require('node:child_process');
const {existsSync} = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const local = path.join(root, '.venv/bin/python');
process.stdout.write(execFileSync(existsSync(local) ? local : 'python3', ['classical/content.py'], {cwd: root, encoding: 'utf8'}));
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'content_sources/knowledge-data.js'), 'utf8') + '\nthis.data = KB;', context);
const normalized = value => value.replace(/[「」“”]/g, '');
for (const id of ['jingwei', 'wangrong']) {
  const article = JSON.parse(fs.readFileSync(path.join(root, `content_sources/classical/${id}.json`), 'utf8'));
  const source = context.data.poems.find(poem => poem.title === article.title);
  assert.ok(source, `教材缺少${article.title}`);
  assert.equal(normalized(article.sentences.map(sentence => sentence.text).join('')), normalized(source.lines.join('')), `${article.title}与教材原文发生漂移，须先复核教学版本`);
}
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'content_sources/classical/catalog.json'), 'utf8'));
const answerPositions = new Map();
for (const id of catalog.articles) {
  const article = JSON.parse(fs.readFileSync(path.join(root, `content_sources/classical/${id}.json`), 'utf8'));
  for (const question of article.questions.filter(question => question.type === 'choice')) {
    if (!answerPositions.has(question.id)) answerPositions.set(question.id, {count: 0, positions: new Set()});
    const group = answerPositions.get(question.id);
    group.count++;
    group.positions.add(question.answer);
  }
}
for (const {count, positions} of answerPositions.values()) {
  if (count > 1) assert.ok(positions.size >= 2, '各篇同序号题目不能总在同一位置给出正确答案');
}
