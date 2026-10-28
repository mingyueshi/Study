/* ============================================================
   乐学堂题库冒烟测试
   运行：node test/test-data.js
   验证所有出题函数的题目结构完整、选项唯一、数学答案正确。
   ============================================================ */
'use strict';
const D = require('../data.js');

let fails = 0;
let checked = 0;
function check(cond, msg) {
  checked++;
  if (!cond) { fails++; console.error('  ❌ ' + msg); }
}

function validateChoice(q, tag, min) {
  min = min || 3;
  check(q.type === 'choice', tag + ' type 应为 choice');
  check(Array.isArray(q.choices) && q.choices.length >= min, tag + ' 选项数 >= ' + min + ': ' + JSON.stringify(q.choices));
  check(new Set(q.choices).size === q.choices.length, tag + ' 选项不重复: ' + JSON.stringify(q.choices));
  check(Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex < q.choices.length, tag + ' answerIndex 越界');
  check(typeof q.explain === 'string' && q.explain.length > 0, tag + ' 缺少 explain');
}

function validateInput(q, tag) {
  check(q.type === 'input', tag + ' type 应为 input');
  check(q.answer !== undefined && String(q.answer).length > 0, tag + ' 缺少 answer');
  check(['number', 'text'].includes(q.pad), tag + ' pad 应为 number/text');
}

/* 安全的表达式求值：只处理 "a + b" 这类二元算式，不做动态执行 */
function calc(expr) {
  const m = expr.match(/^(\d+(?:\.\d+)?)\s*([+−×÷])\s*(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error('无法解析算式: ' + expr);
  const a = parseFloat(m[1]), b = parseFloat(m[3]);
  switch (m[2]) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return a / b;
  }
}
const round1 = x => Math.round(x * 10) / 10;

console.log('— 数学口算 / 竖式（各 300 组，逐题核对答案）—');
[['oral', D.MATH.oral, 10], ['vertical', D.MATH.vertical, 6]].forEach(([name, fn, count]) => {
  for (let i = 0; i < 300; i++) {
    const qs = fn.call(D.MATH);
    check(qs.length === count, name + ' 题数应为 ' + count + '，实际 ' + qs.length);
    for (const q of qs) {
      validateInput(q, name);
      const expr = q.prompt.replace(/ =$/, '');
      const expect = round1(calc(expr));
      const got = parseFloat(q.answer);
      check(Math.abs(expect - got) < 1e-9, name + ' 答案错误: ' + expr + ' 期望 ' + expect + ' 实际 ' + q.answer);
      check(!Number.isNaN(got), name + ' 答案非数字: ' + q.answer);
    }
  }
});

console.log('— 单位换算（300 组，按单位进制重算验证）—');
for (let i = 0; i < 300; i++) {
  for (const q of D.genUnit()) {
    validateChoice(q, 'unit');
    const m = q.prompt.match(/^(\d+) (.+) = ？ (.+)$/);
    check(m, 'unit 题面格式: ' + q.prompt);
    if (m) {
      const n = Number(m[1]);
      const pair = D.UNIT_PAIRS.find(p => (p.big === m[2] && p.small === m[3]) || (p.small === m[2] && p.big === m[3]));
      check(pair, 'unit 未找到单位对: ' + q.prompt);
      if (pair) {
        const expect = m[2] === pair.big ? n * pair.f : n / pair.f;
        check(Math.abs(expect - Number(q.choices[q.answerIndex])) < 1e-9,
          'unit 答案错误: ' + q.prompt + ' → ' + q.choices[q.answerIndex]);
      }
    }
  }
}

console.log('— 应用题（40 轮）—');
for (let i = 0; i < 40; i++) {
  const qs = D.genWordProblems();
  check(qs.length === 5, 'word 题数应为 5');
  for (const q of qs) {
    validateChoice(q, 'word');
    check(q.choices.every(c => !/NaN|undefined/.test(c)), 'word 选项异常: ' + JSON.stringify(q.choices));
  }
}

console.log('— 语文：拼音 / 古诗 / 成语 / 字词（各 40 轮）—');
[['py', D.genPinyin], ['poem', D.genPoem], ['idiom', D.genIdioms], ['char', D.genCharQs]].forEach(([name, fn]) => {
  for (let i = 0; i < 40; i++) {
    const qs = fn();
    check(qs.length === 10, name + ' 题数应为 10，实际 ' + qs.length);
    qs.forEach(q => validateChoice(q, name, name === 'char' ? 2 : 3));
  }
});

console.log('— 英语：认读 / 翻译 / 拼写 / 对话（各 40 轮）—');
[['e2z', D.genE2Z], ['z2e', D.genZ2E], ['spell', D.genSpell], ['sent', D.genSent]].forEach(([name, fn]) => {
  for (let i = 0; i < 40; i++) {
    const qs = fn();
    check(qs.length === 10, name + ' 题数应为 10');
    qs.forEach(q => (q.type === 'choice' ? validateChoice(q, name) : validateInput(q, name)));
    if (name === 'spell') qs.forEach(q => check(/^[a-z]+$/i.test(q.answer), 'spell 答案应为纯单词: ' + q.answer));
  }
});

console.log('— 古诗题目示例 —');
const poemQ = D.genPoem();
console.log('  ' + poemQ[0].prompt);
console.log('  选项: ' + poemQ[0].choices.join(' / '));

console.log('— 科目注册表完整性 —');
check(D.SUBJECTS.length === 3, '应有 3 个科目');
for (const s of D.SUBJECTS) {
  check(s.modes.length >= 4, s.id + ' 玩法 >= 4');
  check(s.color && s.gradient && s.emoji, s.id + ' 缺少外观配置');
}

console.log(fails === 0
  ? '\n✅ 全部通过（共断言 ' + checked + ' 项）'
  : '\n❌ 共 ' + fails + ' / ' + checked + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
