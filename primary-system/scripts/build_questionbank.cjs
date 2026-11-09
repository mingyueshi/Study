/* 把 content_sources/ 的数学、语文、英语数据按规则转换为题库批次 JSON。
   产出 questionbank/data/questions/2026-11-internal-core.json，经
   `manage.py import_questions --input <文件>` 导入。

   生成规则（改规则重跑会产生新的内容指纹，需换批次号再导入）：
   - math：知识点 example{q,a,steps} → 自评题；顶层易错诊所 → 判断题。
   - chinese：课文 poly 与顶层 polyphonic[字,音1,词1,音2,词2] → 「给词选读音」选择题。
   - english：教材同步单词按单元轮转取样 → 词义四选一（干扰项取同册词义池）。

   内容身份 uuid5 = NAMESPACE_URL + 'primary-system/questionbank/' + source_key
   + '/' + source_ref，与 questionbank/types.py 的推导一致；重跑本脚本无 diff。 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCES = path.resolve(__dirname, '../content_sources');
const BATCH = '2026-11-internal-core';
const TARGET = process.argv[2] || path.resolve(__dirname, '../questionbank/data/questions/', `${BATCH}.json`);
const ENGLISH_CAP = 60; // 教材同步词义题上限（按单元轮转取样，各单元覆盖均匀）

const MKB = require(path.join(SOURCES, 'math-data.js'));
const KB = require(path.join(SOURCES, 'knowledge-data.js'));
const ENGLISH = require(path.join(SOURCES, 'english-data.js'));

const GRADE = 4; // 三册数据均为四年级（北师大数学四上 / 统编语文四上 / 外研英语四上四下）

/* ── 工具 ─────────────────────────────────────────────────────────────────── */
const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

function uuid5(namespace, name) {
  const bytes = namespace.replace(/-/g, '').match(/../g).map((h) => parseInt(h, 16));
  const digest = crypto.createHash('sha1').update(Buffer.from(bytes)).update(name).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function entry({ type, area, grade = GRADE, stem, payload, tags, sourceKey, sourceRef }) {
  return {
    uuid: uuid5('6ba7b811-9dad-11d1-80b4-00c04fd430c8', `primary-system/questionbank/${sourceKey}/${sourceRef}`),
    type, area, grade, stem, payload, tags,
    source_key: sourceKey, source_ref: sourceRef,
  };
}

/* 数据文案用中文标点；出现英文双引号或裸换行直接报错。 */
function audit(entries) {
  const errors = [];
  const seen = new Map();
  const walk = (value, where) => {
    if (typeof value === 'string') {
      if (value.includes('"') || /[\n\r]/.test(value)) errors.push(`${where}：出现英文双引号或裸换行`);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${where}[${index}]`));
    } else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, `${where}.${key}`);
    }
  };
  for (const item of entries) {
    walk(item, `${item.source_key}/${item.source_ref}`);
    const key = `${item.source_key}/${item.source_ref}`;
    if (seen.has(key)) errors.push(`来源定位重复：${key}`);
    seen.set(key, true);
  }
  if (errors.length) {
    console.error(errors.slice(0, 20).join('\n'));
    process.exit(1);
  }
}

/* ── 数学：例题自评 + 易错诊所判断 ─────────────────────────────────────────── */
function mathQuestions() {
  const list = [];
  for (const unit of MKB.units) {
    for (const point of unit.points || []) {
      const example = point.example;
      if (!example || !example.q || !example.a) continue;
      list.push(entry({
        type: 'selfcheck', area: 'math',
        stem: example.q,
        payload: { answer: example.a, steps: example.steps || '' },
        tags: [`数学·${unit.name}`, `数学·${point.title}`],
        sourceKey: 'primary-math',
        sourceRef: `math:${point.id}:example`,
      }));
    }
  }
  for (const item of MKB.mistakes || []) {
    const wrong = item.wrong.replace(/^[「」]+/, '').replace(/[「」]+$/, '');
    if (!wrong) continue;
    list.push(entry({
      type: 'truefalse', area: 'math',
      stem: `${wrong}，对吗？`,
      payload: { answer: false, explanation: item.right },
      tags: [`数学·${item.unit}`],
      sourceKey: 'primary-math',
      sourceRef: `math:mistakes:${md5(`${item.unit}|${item.wrong}`).slice(0, 8)}`,
    }));
  }
  return list;
}

/* ── 语文：多音字给词选读音 ───────────────────────────────────────────────── */
function polyQuestion({ char, py1, word1, py2, word2, tags, sourceRef }) {
  const first = word1.split('、')[0];
  if (!first || !first.includes(char) || py1 === py2) return null;
  const rotate = parseInt(md5(sourceRef).slice(0, 2), 16) % 2; // 确定性轮换，正确项不固定在首位
  const options = rotate ? [py2, py1] : [py1, py2];
  return entry({
    type: 'choice', area: 'chinese',
    stem: `「${char}」在「${first}」中读哪个音？`,
    payload: {
      options,
      answer: options.indexOf(py1),
      explanation: `「${char}」读 ${py1} 时可组成「${word1}」；读 ${py2} 时可组成「${word2}」。`,
    },
    tags, sourceKey: 'primary-chinese', sourceRef,
  });
}

function chineseQuestions() {
  const list = [];
  for (const unit of KB.units || []) {
    for (const lesson of unit.lessons || []) {
      for (const row of lesson.poly || []) {
        if (row.length !== 5) continue;
        const question = polyQuestion({
          char: row[0], py1: row[1], word1: row[2], py2: row[3], word2: row[4],
          tags: ['语文·多音字', `四上·《${lesson.title}》`],
          sourceRef: `chinese:${unit.id}-${lesson.id}:poly:${row[0]}`,
        });
        if (question) list.push(question);
      }
    }
  }
  for (const row of KB.polyphonic || []) {
    if (row.length !== 5) continue;
    const question = polyQuestion({
      char: row[0], py1: row[1], word1: row[2], py2: row[3], word2: row[4],
      tags: ['语文·多音字'],
      sourceRef: `chinese:polyphonic:${row[0]}`,
    });
    if (question) list.push(question);
  }
  return list;
}

/* ── 英语：教材同步词义四选一 ─────────────────────────────────────────────── */
const stripPos = (zh) => zh.replace(/^[a-zA-Z]+(?:\s*&\s*[a-zA-Z]+)*\.\s*/, '') || zh;

function englishQuestions() {
  const units = ENGLISH.ENGLISH_UNITS || [];
  const poolByBook = new Map();
  for (const unit of units) {
    const pool = poolByBook.get(unit.book) || [];
    for (const word of unit.words || []) pool.push(word);
    poolByBook.set(unit.book, pool);
  }
  // 各单元轮转取样，保证 4a/4b、各单元覆盖均匀。
  const sampled = [];
  const seen = new Set();
  for (let index = 0; sampled.length < ENGLISH_CAP; index += 1) {
    let offered = false;
    for (const unit of units) {
      const word = (unit.words || [])[index];
      if (!word || sampled.length >= ENGLISH_CAP) continue;
      offered = true;
      if (seen.has(word.en)) continue;
      seen.add(word.en);
      sampled.push({ unit, word });
    }
    if (!offered) break;
  }

  const list = [];
  for (const { unit, word } of sampled) {
    const correct = stripPos(word.zh);
    const pool = [];
    const poolSeen = new Set([correct]);
    const bookWords = poolByBook.get(unit.book) || [];
    const offset = parseInt(md5(word.en).slice(0, 8), 16) % bookWords.length;
    for (let step = 0; pool.length < 3 && step < bookWords.length; step += 1) {
      const candidate = stripPos(bookWords[(offset + step) % bookWords.length].zh);
      if (poolSeen.has(candidate)) continue;
      poolSeen.add(candidate);
      pool.push(candidate);
    }
    const options = [correct, ...pool];
    const rotate = parseInt(md5(word.en).slice(8, 12), 16) % options.length;
    const shuffled = options.slice(rotate).concat(options.slice(0, rotate));
    list.push(entry({
      type: 'choice', area: 'english',
      stem: `「${word.en}」是什么意思？`,
      payload: {
        options: shuffled,
        answer: shuffled.indexOf(correct),
        explanation: `${word.en} ${word.ipa} ${word.zh}。`,
      },
      tags: [`英语·${unit.name}`],
      sourceKey: 'primary-english',
      sourceRef: `english:${unit.id}:${word.en}`,
    }));
  }
  return list;
}

/* ── 汇总产出 ─────────────────────────────────────────────────────────────── */
const questions = [...mathQuestions(), ...chineseQuestions(), ...englishQuestions()];
audit(questions);

const payload = {
  schema_version: 1,
  batch_id: BATCH,
  generator: 'scripts/build_questionbank.cjs',
  note: '内部数据规则生成：数学例题与易错、语文多音字、英语教材同步词义。来源定位与内容身份一一对应。',
  questions,
};

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, JSON.stringify(payload, null, 1) + '\n');

const countBy = (field) => questions.reduce(
  (acc, item) => ({ ...acc, [item[field]]: (acc[item[field]] || 0) + 1 }), {});
console.log(JSON.stringify({
  batch_id: BATCH,
  total: questions.length,
  by_area: countBy('area'),
  by_type: countBy('type'),
  target: path.basename(TARGET),
}, null, 2));
