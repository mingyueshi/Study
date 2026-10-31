/* 把 legacy words-data.js 的场景单词数据导出为固定 JSON 快照（46 场景 / 577 词）。
   产出被 words 应用导入（场景/词位）与词典适配器（words_manifest）共用；
   SHA256 随快照记录，来源更新后重跑本脚本并走一次导入校验。 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const source = process.argv[2] || path.resolve(__dirname, '../../primary/words-data.js');
const target = process.argv[3] || path.resolve(__dirname, '../data/words-scenario.json');

const raw = fs.readFileSync(source);
const data = require(source);
const units = data.WORD_UNITS;
const payload = {
  schema_version: 1,
  source_file: path.relative(path.dirname(target), source).split(path.sep).join('/'),
  sha256: crypto.createHash('sha256').update(raw).digest('hex'),
  units: units,
};

const errors = [];
const seen = new Set();
for (const unit of units) {
  for (const word of unit.words) {
    if (seen.has(word.en)) errors.push(`重复词头：${word.en}`);
    seen.add(word.en);
    if (!/^\/.+\/$/.test(word.ipa || '')) errors.push(`${word.en} 的音标未用 / 包裹`);
    if (!word.memo) errors.push(`${word.en} 缺少记忆提示`);
    if (!word.parts || !word.parts.length) errors.push(`${word.en} 缺少拆分`);
  }
}
if (errors.length) {
  console.error(errors.slice(0, 20).join('\n'));
  process.exit(1);
}
fs.writeFileSync(target, JSON.stringify(payload, null, 1) + '\n');
console.log(JSON.stringify({ source_file: payload.source_file, sha256: payload.sha256,
  units: units.length, words: seen.size, target: path.basename(target) }));
