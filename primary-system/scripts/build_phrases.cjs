/* 把 primary/english-data.js 的 ENGLISH_PHRASES（挂在教材词卡上的常见短语与
   短句）确定性转换为日常用语专题数据 phrases/data/phrases.json。

   组织方式（一份数据两个视图）：
   - scenario：短语 → 词头所属教材单元 → 情景码（只取 words 应用既有的 u-* 码，
     保证与场景单词互链可达）；
   - pattern：句首功能正则切组（Can you…? / Let's… / I like… 等），配覆盖表校准；
     句子形态（以 .?! 结尾）有句式分组并进练习池（tier core），纯搭配类
     （无标点结尾，如 play volleyball）pattern 为空、只浏览（tier extended）。

   en/zh 文本以教材语料为单一数据源，本脚本不改写内容；重跑无 diff。 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../..');
const TARGET = process.argv[2] || path.resolve(__dirname, '../phrases/data/phrases.json');

const ENGLISH = require(path.join(ROOT, 'primary/english-data.js'));

const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

/* ── 教材单元 → words 应用情景码（46 个 u-* 的子集，保证互链可达）────────── */
const UNIT_SCENARIO = {
  '4a-u1': 'u-sports',      // I love sports
  '4a-u2': 'u-housework',   // Helping at home
  '4a-u3': 'u-seasons',     // What's the weather like?
  '4a-u4': 'u-seasons',     // Wonderful seasons
  '4a-u5': 'u-travel',      // Let's go!
  '4a-u6': 'u-directions',  // Find your way
  '4b-u1': 'u-jobs',        // People at work
  '4b-u2': 'u-feelings',    // How do you feel today?
  '4b-u3': 'u-actions',     // Everyone's got talent!
  '4b-u4': 'u-plants',      // Plant life
  '4b-u5': 'u-school',      // School activities
  '4b-u6': 'u-clothes',     // Cool clothes
};

/* 情景卡的展示信息（code 与 words-data.js 的单元 id 对齐） */
const SCENARIOS = [
  { code: 'u-sports', zh: '运动' },
  { code: 'u-housework', zh: '在家帮忙' },
  { code: 'u-seasons', zh: '天气与四季' },
  { code: 'u-travel', zh: '出行' },
  { code: 'u-directions', zh: '问路与方位' },
  { code: 'u-jobs', zh: '职业' },
  { code: 'u-feelings', zh: '心情感受' },
  { code: 'u-actions', zh: '动作与本领' },
  { code: 'u-plants', zh: '植物' },
  { code: 'u-school', zh: '学校生活' },
  { code: 'u-clothes', zh: '服装' },
];

/* ── 句式分组：正则按序首中即停；formula 给孩子一句中文口诀 ───────────────── */
const PATTERNS = [
  { code: 'lets', name: "Let's… 提议", formula: "Let's + 动词原形 = 我们……吧", re: /^let's\b/i },
  { code: 'would', name: 'Will/Would… 询问与将来', formula: 'Will you come? / Would you like…? = 你会来吗？你想要……吗？', re: /^(will|would)\b/i },
  { code: 'going-to', name: 'be going to 计划', formula: "I'm going to… = 我打算……", re: /^i'?m going to\b/i },
  { code: 'can', name: 'can/may 会、能与许可', formula: 'Can you…? / May I…? / I can… = 你会……吗？我可以……吗？我会……', re: /^(can|could|can't|may)\b|\b(i|you) (can|may)\b/i },
  { code: 'how-many', name: 'How many/much 多少', formula: 'How many + 可数 / How much + 不可数', re: /^how (many|much|old|long|often)\b/i },
  { code: 'how', name: 'How 怎么样', formula: 'How…? = ……怎么样/怎么……', re: /^how\b/i },
  { code: 'what', name: 'What 什么', formula: 'What…? = 什么/什么样的……', re: /^what\b/i },
  { code: 'where', name: 'Where 哪里', formula: 'Where is/are…? = ……在哪里', re: /^where\b/i },
  { code: 'question-word', name: '其他疑问词', formula: 'When 何时 / Who 谁 / Why 为什么 / Which 哪个', re: /^(when|who|whose|why|which)\b/i },
  { code: 'do-you', name: 'Do/Does… 一般疑问', formula: 'Do you + 动词原形…? = 你……吗？', re: /^(do|does)\b/i },
  { code: 'imperative', name: '动词开头祈使', formula: '动词原形开头 = 去做……（Be careful! 小心！）', re: /^(have a|wait a|be |get |try |never mind)\b/i },
  { code: 'be-q', name: 'Is/Are/Have…? 确认', formula: 'Is it…? / Are you…? / Have you got…? = 它是……吗？你有……吗？', re: /^(is|are|am|was|were|have|has|had)\b/i },
  { code: 'there-be', name: 'There be 有', formula: 'There is + 单个 / There are + 多个 = 有……', re: /^there\b/i },
  { code: 'i-like', name: 'I like… 喜好', formula: 'I (really) like/love… = 我（很）喜欢……', re: /^(i|we) (really |also |always )?(like|love|enjoy)\b/i },
  { code: 'i-statement', name: 'I… 自我陈述', formula: 'I + 动词 = 我……', re: /^i\b/i },
  { code: 'be', name: 'be 动词陈述', formula: "I'm / It's / He's… = ……是……的样子", re: /^(i'm|i am|it's|it is|he's|she's|they're|we're|you're|that's|this is|that is)\b/i },
  { code: 'don-t', name: "Don't… 劝阻", formula: "Don't + 动词原形 = 不要……", re: /^(don't|do not|doesn't)\b/i },
  { code: 'daily', name: '日常套语', formula: 'Good job! / See you. / No problem. = 整句记、整句用', re: /^(good|see you|no problem|hope|thank|thanks|sorry|excuse|welcome|nice|congratulations|happy|well done|merry)\b/i },
  { code: 'statement', name: '人/物陈述', formula: '某物/某人 + 动词 = 谁怎么样、谁做什么', re: /^(he|she|it|they|we|you|my|our|his|her|their|people|everyone|everyone's|the|spring|summer|autumn|winter|snowstorms|tomorrow|snow|that)\b/i },
];

/* 覆盖表：正则切错或落空的短语按 en 精确指派（pattern 为空 = 搭配类只浏览） */
const PATTERN_OVERRIDES = {
  'Never fail to try.': 'imperative',
  'Please speak slowly.': 'imperative',
};

const isSentence = (en) => /[.?!]$/.test(en.trim());

/* 句首的感叹词与时间副词先剥掉再判组：Phew! It's hot. → It's hot. */
const LEAD_STRIP_RE = /^(phew|wow|oops|oh|ah|well|woof|meow|beep|whoosh|bang|cock-a-doodle-doo|first|then|sometimes|usually|often|always|never|now|today|at first)[,!\s]+/i;

function classify(en) {
  if (Object.prototype.hasOwnProperty.call(PATTERN_OVERRIDES, en)) {
    return PATTERN_OVERRIDES[en] || null;
  }
  if (!isSentence(en)) return null; // 搭配类不进句式视图
  let text = en.trim();
  for (let round = 0; round < 2; round += 1) {
    const stripped = text.replace(LEAD_STRIP_RE, '');
    if (stripped === text) break;
    text = stripped;
  }
  if (!text.trim()) return 'daily';
  for (const pattern of PATTERNS) {
    if (pattern.re.test(text)) return pattern.code;
  }
  return 'misc';
}

function build() {
  const items = new Map();
  for (const unit of ENGLISH.ENGLISH_UNITS) {
    const scenario = UNIT_SCENARIO[unit.id];
    if (!scenario) throw new Error(`单元缺少情景映射：${unit.id}`);
    for (const word of unit.words) {
      for (const phrase of word.phrases || []) {
        if (items.has(phrase.en)) {
          items.get(phrase.en).heads.push(word.en);
          continue;
        }
        items.set(phrase.en, {
          id: 'ph-' + md5(phrase.en).slice(0, 10),
          en: phrase.en,
          zh: phrase.zh,
          head: word.en,
          heads: [word.en],
          unit_id: unit.id,
          scenario,
          pattern: classify(phrase.en),
          tier: isSentence(phrase.en) ? 'core' : 'extended',
        });
      }
    }
  }
  return [...items.values()];
}

/* 审计：内容契约——中文标点（zh/note 不允许英文双引号与裸换行）、情景码合法、
   句子必须有句式分组、覆盖表指向的短语真实存在。 */
function audit(items) {
  const errors = [];
  const scenarioCodes = new Set(SCENARIOS.map((scenario) => scenario.code));
  const patternCodes = new Set([...PATTERNS.map((pattern) => pattern.code), 'misc', null]);
  const enSet = new Set(items.map((item) => item.en));
  for (const key of Object.keys(PATTERN_OVERRIDES)) {
    if (!enSet.has(key)) errors.push(`覆盖表指向不存在的短语：${key}`);
  }
  for (const item of items) {
    if (!scenarioCodes.has(item.scenario)) errors.push(`${item.en} 情景码不合法：${item.scenario}`);
    if (!patternCodes.has(item.pattern)) errors.push(`${item.en} 句式码不合法：${item.pattern}`);
    if (item.tier === 'core' && !item.pattern) errors.push(`${item.en} 是句子但缺句式分组`);
    for (const value of [item.en, item.zh]) {
      if (value.includes('"') || /[\n\r]/.test(value)) errors.push(`${item.en} 出现英文双引号或裸换行`);
    }
  }
  if (items.length < 400) errors.push(`短语条目不足 400：${items.length}`);
  if (errors.length) {
    console.error(errors.slice(0, 20).join('\n'));
    process.exit(1);
  }
}

const items = build();
audit(items);

const payload = {
  schema_version: 1,
  source: {
    name: 'primary-english-phrases',
    references: '外研版《英语（新标准）》四年级上/下册词卡短语（primary/english-data.js ENGLISH_PHRASES）',
    method: 'en/zh 原文转换；情景由词头单元映射；句式由句首功能正则切组 + 覆盖表校准；句子形态进练习池',
  },
  patterns: PATTERNS.map(({ code, name, formula }) => ({ code, name, formula })),
  scenarios: SCENARIOS,
  items,
};

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.writeFileSync(TARGET, JSON.stringify(payload, null, 1) + '\n');

const countBy = (field) => items.reduce((acc, item) => {
  const key = String(item[field]);
  return { ...acc, [key]: (acc[key] || 0) + 1 };
}, {});
const misc = items.filter((item) => item.pattern === 'misc').map((item) => item.en);
console.log(JSON.stringify({
  total: items.length,
  core: items.filter((item) => item.tier === 'core').length,
  by_pattern: countBy('pattern'),
  by_scenario: countBy('scenario'),
  misc_sample: misc.slice(0, 25),
  misc_total: misc.length,
  target: path.basename(TARGET),
}, null, 2));
