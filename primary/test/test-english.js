/* ============================================================
   乐学堂 · 外研版教材同步英语数据测试
   运行：node test/test-english.js
   ============================================================ */
'use strict';
const { ENGLISH_UNITS, ENGLISH_BOOKS, ENGLISH_WORDS, ENGLISH_DIALOGUES, RELATION_ORDER } = require('../english-data.js');

let fails = 0;
let checked = 0;
const ok = (condition, message) => {
  checked++;
  if (!condition) { fails++; console.error('  ❌ ' + message); }
};
const normalize = text => text.toLowerCase().replace(/[^a-z]/g, '');
const allWords = new Set(ENGLISH_UNITS.flatMap(unit => unit.words.map(word => word.en)));
const allKeys = new Set(ENGLISH_UNITS.flatMap(unit => unit.words.map(word => word.key)));

console.log('— 教材结构 —');
ok(ENGLISH_UNITS.length === 12, '四年级上下册应有 12 个单元，实际 ' + ENGLISH_UNITS.length);
ok(ENGLISH_BOOKS.length === 2 && ENGLISH_BOOKS[0] === '四年级上册' && ENGLISH_BOOKS[1] === '四年级下册', '册别顺序应为四年级上册、下册');
for (const book of ENGLISH_BOOKS) {
  ok(ENGLISH_UNITS.filter(unit => unit.book === book).length === 6, book + ' 应有 6 个单元');
}
const expectedTitles = [
  'I love sports', 'Helping at home', "What's the weather like?", 'Wonderful seasons', "Let's go!", 'Find your way',
  'People at work', 'How do you feel today?', "Everyone's got talent!", 'Plant life', 'School activities', 'Cool clothes',
];
ENGLISH_UNITS.forEach((unit, index) => {
  ok(unit.name.includes(expectedTitles[index]), '单元顺序或标题不符：' + unit.id + ' / ' + unit.name);
});

console.log('— 词卡完整性 —');
const unitIds = new Set();
const keys = new Set();
let total = 0;
for (const unit of ENGLISH_UNITS) {
  ok(unit.id && !unitIds.has(unit.id), '单元 id 唯一：' + unit.id);
  unitIds.add(unit.id);
  ok(unit.words.length >= 10, unit.id + ' 至少 10 条词汇，实际 ' + unit.words.length);
  ok(!unit.patterns, unit.id + ' 不应再包含句型数据');
  const localWords = new Set(unit.words.map(word => word.en));
  for (const word of unit.words) {
    total++;
    const tag = '[' + unit.id + '] ' + word.en;
    ok(word.key === unit.id + ':' + word.en, tag + ' key 应由单元和英文组成');
    ok(!keys.has(word.key), tag + ' key 重复');
    keys.add(word.key);
    ok(/^\/.+\/$/.test(word.ipa || ''), tag + ' 音标需用 / / 包裹');
    ok(word.zh && word.zh.length > 0, tag + ' 缺少中文释义');
    ok(typeof word.emoji === 'string', tag + ' emoji 应为字符串');
    ok(Array.isArray(word.parts) && word.parts.length >= 1 && word.parts.length <= 4, tag + ' 拆分段应为 1～4 段');
    ok(normalize(word.parts.map(part => part.t).join('')) === normalize(word.en), tag + ' 拆分后不能还原原词');
    for (const part of word.parts) ok(part.t && part.d, tag + ' 拆分段缺少文本或说明');
    ok(word.memo && word.memo.length >= 4, tag + ' 缺少记忆提示');
    ok(Array.isArray(word.links) && word.links.length >= 3, tag + ' 至少 3 条关联词');
    ok(word.links.filter(link => link.inBook).length >= 2, tag + ' 至少 2 条课内关联词');
    for (const link of word.links) {
      ok(link.en && link.en !== word.en, tag + ' 关联词不能是自己');
      ok(RELATION_ORDER.includes(link.type), tag + ' 关联类型未知：' + link.type);
      ok(link.zh && link.zh.length > 0, tag + ' 关联词缺少中文：' + link.en);
      ok(/^[A-Za-z][A-Za-z \-']*$/.test(link.en), tag + ' 关联词应为英文单词：' + link.en);
      if (link.inBook) {
        ok(allWords.has(link.en), tag + ' 课内关联词不在教材中：' + link.en);
        ok(allKeys.has(link.key), tag + ' 课内关联词缺少词卡定位：' + link.en);
      }
    }
  }
}
ok(total === 310, '总词数应为 310，实际 ' + total);
ok(ENGLISH_WORDS.length === total, '练习索引导出数应与词卡数一致');

console.log('— 课文对话 —');
const unitIdSet = new Set(ENGLISH_UNITS.map(unit => unit.id));
const dlgIds = new Set();
let dlgLineTotal = 0;
for (const dlg of ENGLISH_DIALOGUES) {
  const tag = '[' + dlg.id + ']';
  ok(dlg.id && !dlgIds.has(dlg.id), tag + ' 对话 id 缺失或重复');
  dlgIds.add(dlg.id);
  ok(unitIdSet.has(dlg.unitId), tag + ' unitId 不在教材中：' + dlg.unitId);
  ok(dlg.title && dlg.zh && typeof dlg.emoji === 'string', tag + ' 缺少标题、场景名或 emoji');
  ok(Array.isArray(dlg.lines) && dlg.lines.length >= 2, tag + ' 对话至少 2 句');
  const speakers = new Set();
  for (const line of dlg.lines) {
    dlgLineTotal++;
    const lineTag = tag + ' ' + (line.who || '?');
    ok(line.who && typeof line.who === 'string', lineTag + ' 缺少说话人');
    speakers.add(line.who);
    ok(typeof line.emoji === 'string', lineTag + ' emoji 应为字符串');
    ok(line.en && /^[A-Za-z.][A-Za-z0-9 ,.!?;:'’\-]*$/.test(line.en), lineTag + ' 英文句不合法：' + line.en);
    ok(line.zh && line.zh.length > 0, lineTag + ' 缺少中文翻译');
    ok(!/["'\n]/.test(line.zh), lineTag + ' 中文翻译应使用中文标点：' + line.zh);
  }
  ok(speakers.size >= 1 && speakers.size <= 6, tag + ' 说话人应为 1～6 人（歌谣可为 1 人齐唱）');
}
ok(dlgIds.size === ENGLISH_DIALOGUES.length, '对话 id 应唯一');
ok(ENGLISH_DIALOGUES.length >= 1, '至少录入 1 段课文对话');

console.log(fails === 0
  ? '\n✅ 全部通过（' + ENGLISH_UNITS.length + ' 单元，' + total + ' 条词卡，共断言 ' + checked + ' 项）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
