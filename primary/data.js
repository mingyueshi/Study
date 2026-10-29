/* ============================================================
   乐学堂 · 四年级 —— 题库与出题逻辑
   家长想加题？只需在下面的数组里照格式添加即可（见 README.md）
   ============================================================ */
'use strict';

/* ---------- 小工具 ---------- */
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[rnd(0, arr.length - 1)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sample(arr, n) { return shuffle(arr).slice(0, n); }
/* 把一组选项打乱，返回 { choices, answerIndex } */
function shuffleChoices(choices, answerIndex) {
  const correct = choices[answerIndex];
  const mixed = shuffle(choices);
  return { choices: mixed, answerIndex: mixed.indexOf(correct) };
}
/* 为一个数值答案生成 3 个"长得像"的错误选项 */
function numDistractors(ansStr) {
  const a = Number(ansStr);
  const cands = [a + 10, a - 10, a + 1, a - 1, a * 2, Math.round(a / 2), a + 100, a - 100, a * 10, a + 5, a - 5];
  const good = shuffle([...new Set(cands.filter(v => Number.isInteger(v) && v > 0 && v !== a))]).slice(0, 3).map(String);
  while (good.length < 3) good.push(String(a + good.length + 2));
  return good;
}

/* ============================================================
   数  学
   ============================================================ */
const MATH = {
  /* 一道口算题（随机模板，覆盖四年级上/下册口算重点） */
  oralOne() {
    const t = rnd(1, 8);
    if (t <= 2) {                                   // 两位数加减（进退位）
      const a = rnd(21, 89), b = rnd(11, 88);
      if (Math.random() < 0.5)
        return { q: a + ' + ' + b, ans: String(a + b), ex: a + ' + ' + b + ' = ' + (a + b) };
      const x = Math.max(a, b), y = Math.min(a, b);
      return { q: x + ' − ' + y, ans: String(x - y), ex: x + ' − ' + y + ' = ' + (x - y) };
    }
    if (t === 3) {                                  // 两位数 × 一位数
      const a = rnd(12, 89), b = rnd(3, 9);
      return { q: a + ' × ' + b, ans: String(a * b), ex: a + ' × ' + b + ' = ' + (a * b) };
    }
    if (t === 4) {                                  // 三位数 × 一位数
      const a = rnd(102, 799), b = rnd(2, 9);
      return { q: a + ' × ' + b, ans: String(a * b), ex: a + ' × ' + b + ' = ' + (a * b) };
    }
    if (t === 5) {                                  // 两位数 × 整十数
      const a = rnd(11, 49), b = rnd(2, 9) * 10;
      return { q: a + ' × ' + b, ans: String(a * b), ex: a + ' × ' + b + ' = ' + (a * b) + '（先算 ' + a + ' × ' + (b / 10) + '，再在末尾添 0）' };
    }
    if (t === 6) {                                  // 除数是一位数
      const d = rnd(2, 9), q2 = rnd(11, 49);
      return { q: (d * q2) + ' ÷ ' + d, ans: String(q2), ex: (d * q2) + ' ÷ ' + d + ' = ' + q2 };
    }
    if (t === 7) {                                  // 除数是两位数（口算范围内）
      const d = rnd(12, 24), q2 = rnd(2, 8);
      return { q: (d * q2) + ' ÷ ' + d, ans: String(q2), ex: (d * q2) + ' ÷ ' + d + ' = ' + q2 + '（想乘法：' + d + ' × ' + q2 + ' = ' + (d * q2) + '）' };
    }
    /* 一位小数加减（四年级下册） */
    const a = rnd(12, 98) / 10, b = rnd(12, 98) / 10;
    if (Math.random() < 0.5) {
      const ans = (a + b).toFixed(1);
      return { q: a + ' + ' + b, ans: ans, ex: a + ' + ' + b + ' = ' + ans + '（小数点对齐再算）' };
    }
    const x = Math.max(a, b), y = Math.min(a, b);
    const ans2 = (x - y).toFixed(1);
    return { q: x + ' − ' + y, ans: ans2, ex: x + ' − ' + y + ' = ' + ans2 + '（小数点对齐再算）' };
  },

  oral() {
    return Array.from({ length: 10 }, () => {
      const t = this.oralOne();
      return { type: 'input', key: 'mo-' + t.q, prompt: t.q + ' =', pad: 'number', answer: t.ans, explain: t.ex };
    });
  },

  /* 竖式/笔算：大数计算，建议在草稿纸上列竖式 */
  verticalOne() {
    const t = rnd(1, 3);
    if (t === 1) {                                  // 三位数 × 两位数（四上重点）
      const a = rnd(102, 899), b = rnd(11, 89);
      return {
        q: a + ' × ' + b, ans: String(a * b),
        ex: a + ' × ' + b + ' = ' + (a * b) + '。列竖式：先算 ' + a + ' × ' + (b % 10) + '，再算 ' + a + ' × ' + Math.floor(b / 10) + ' 个十，最后把两次结果相加。'
      };
    }
    if (t === 2) {                                  // 除数是两位数的除法（四上重点）
      const d = rnd(12, 32), q2 = rnd(11, 29);
      return {
        q: (d * q2) + ' ÷ ' + d, ans: String(q2),
        ex: (d * q2) + ' ÷ ' + d + ' = ' + q2 + '。试商技巧：把除数 ' + d + ' 看成整十数 ' + (Math.round(d / 10) * 10) + ' 来试商。'
      };
    }
    const a = rnd(105, 950), b = rnd(105, 950);     // 三位数减三位数（连续退位）
    const x = Math.max(a, b), y = Math.min(a, b);
    return { q: x + ' − ' + y, ans: String(x - y), ex: x + ' − ' + y + ' = ' + (x - y) + '。不够减时向高位借 1 当 10。' };
  },

  vertical() {
    return Array.from({ length: 6 }, () => {
      const t = this.verticalOne();
      return { type: 'input', key: 'mv-' + t.q, prompt: t.q + ' =', pad: 'number', answer: t.ans, explain: t.ex, hint: '在草稿纸上列竖式算一算' };
    });
  },

  sheetOne() { return this.oralOne(); }
};

/* 应用题题库（覆盖：行程、价格、面积、平均数、倍数、鸡兔同笼、优化、植树等） */
const MATH_WORD_BANK = [
  { q: '一辆汽车每小时行驶 85 千米，行驶了 4 小时，一共行驶多少千米？', a: '340', ex: '85 × 4 = 340（千米）。路程 = 速度 × 时间。' },
  { q: '学校买了 3 盒钢笔，每盒 12 支。每支钢笔 8 元，一共要花多少元？', a: '288', ex: '12 × 3 = 36（支），36 × 8 = 288（元）。' },
  { q: '果园里有苹果树 128 棵，梨树的棵数是苹果树的 3 倍。苹果树和梨树一共有多少棵？', a: '512', ex: '128 × 3 = 384（棵），384 + 128 = 512（棵）。' },
  { q: '一本书共 240 页，小华每天看 25 页，看了 8 天。还剩多少页没有看？', a: '40', ex: '25 × 8 = 200（页），240 − 200 = 40（页）。' },
  { q: '学校操场长 90 米，宽 60 米，操场的面积是多少平方米？', a: '5400', ex: '90 × 60 = 5400（平方米）。长方形面积 = 长 × 宽。' },
  { q: '一块正方形菜地边长 200 米，它的面积是多少平方米？合多少公顷？', a: '4 公顷', options: ['4 公顷', '40 公顷', '40000 公顷', '4000 公顷'], ex: '200 × 200 = 40000（平方米），40000 平方米 = 4 公顷。' },
  { q: '王阿姨买了 5 千克苹果，付了 50 元，找回 5 元。每千克苹果多少元？', a: '9', ex: '50 − 5 = 45（元），45 ÷ 5 = 9（元）。' },
  { q: '甲乙两地相距 320 千米，一辆汽车已经行驶了 140 千米。剩下的路程每小时行 60 千米，还要行驶几小时？', a: '3', ex: '320 − 140 = 180（千米），180 ÷ 60 = 3（小时）。' },
  { q: '四年级 168 人去春游，每辆车正好坐 42 人，一共需要几辆车？', a: '4', ex: '168 ÷ 42 = 4（辆）。' },
  { q: '商店运来 24 箱橘子，每箱 15 千克，卖出 180 千克，还剩多少千克？', a: '180', ex: '24 × 15 = 360（千克），360 − 180 = 180（千克）。' },
  { q: '小明家到学校 550 米，他每天往返 2 次（每天要走 4 个单程），一天一共走多少米？', a: '2200', ex: '550 × 4 = 2200（米）。' },
  { q: '食堂每天节约 12 千克大米，十月份（31 天）一共节约多少千克？', a: '372', ex: '12 × 31 = 372（千克）。' },
  { q: '一列火车 3 小时行驶 450 千米。照这样的速度，5 小时能行驶多少千米？', a: '750', ex: '450 ÷ 3 = 150（千米/时），150 × 5 = 750（千米）。' },
  { q: '修路队要修一条长 1500 米的路，每天修 125 米，修了 8 天。还剩多少米没修？', a: '500', ex: '125 × 8 = 1000（米），1500 − 1000 = 500（米）。' },
  { q: '（鸡兔同笼）笼子里鸡和兔共有 8 个头、22 只脚。鸡和兔各有几只？', a: '鸡 5 只，兔 3 只', options: ['鸡 5 只，兔 3 只', '鸡 3 只，兔 5 只', '鸡 6 只，兔 2 只', '鸡 4 只，兔 4 只'], ex: '假设全是鸡：8 × 2 = 16 只脚，多出 22 − 16 = 6 只脚；每只兔比鸡多 2 只脚，所以兔有 6 ÷ 2 = 3 只，鸡有 8 − 3 = 5 只。' },
  { q: '（鸡兔同笼）停车场里自行车和小汽车共有 10 辆，一共有 28 个轮子。自行车和小汽车各有几辆？', a: '自行车 6 辆，小汽车 4 辆', options: ['自行车 6 辆，小汽车 4 辆', '自行车 4 辆，小汽车 6 辆', '自行车 7 辆，小汽车 3 辆', '自行车 5 辆，小汽车 5 辆'], ex: '假设全是自行车：10 × 2 = 20 个轮子，多出 28 − 20 = 8 个；每辆小汽车多 2 个轮子，所以小汽车 8 ÷ 2 = 4 辆，自行车 6 辆。' },
  { q: '第一小组 5 名同学的身高分别是 138、140、142、135、145 厘米，平均身高是多少厘米？', a: '140', ex: '138 + 140 + 142 + 135 + 145 = 700（厘米），700 ÷ 5 = 140（厘米）。' },
  { q: '小刚前 3 次数学测验的平均分是 92 分，第 4 次考了 100 分。4 次测验的平均分是多少？', a: '94', ex: '92 × 3 = 276（分），276 + 100 = 376（分），376 ÷ 4 = 94（分）。' },
  { q: '爸爸今年比小明大 28 岁，爸爸的年龄正好是小明的 5 倍。小明今年几岁？', a: '7', ex: '年龄差 28 岁对应 5 − 1 = 4 倍，28 ÷ 4 = 7（岁）。' },
  { q: '长方形花坛长 12 米、宽 8 米，四周有一条 1 米宽的小路。小路的面积是多少平方米？', a: '44', ex: '大长方形：(12 + 2) × (8 + 2) = 140（平方米），花坛 12 × 8 = 96（平方米），140 − 96 = 44（平方米）。' },
  { q: '一条 100 米的小路，每隔 5 米栽一棵树（两端都栽）。一共要栽多少棵？', a: '21', ex: '100 ÷ 5 = 20（段），两端都栽时要加 1：20 + 1 = 21（棵）。' },
  { q: '在 ★ ÷ 6 = 12 …… ☆ 中，☆ 最大是几？这时 ★ 是几？', a: '☆ 最大 5，★ 是 77', options: ['☆ 最大 5，★ 是 77', '☆ 最大 6，★ 是 78', '☆ 最大 5，★ 是 72', '☆ 最大 7，★ 是 79'], ex: '余数要比除数小，所以 ☆ 最大是 5；★ = 12 × 6 + 5 = 77。' },
  { q: '钢笔每支 15 元，商店“买 3 支送 1 支”。李老师要买 12 支，一共要付多少元？', a: '135', ex: '买 3 送 1，就是每 4 支只需付 3 支的钱。12 ÷ 4 = 3 组，付 3 × 3 = 9 支的钱，9 × 15 = 135（元）。' },
  { q: '烧一壶水要 8 分钟，洗茶杯要 2 分钟，拿茶叶要 1 分钟，沏茶要 1 分钟。合理安排，最少多少分钟就能沏好茶？', a: '9 分钟', options: ['9 分钟', '12 分钟', '11 分钟', '8 分钟'], ex: '烧水的 8 分钟里可以同时洗茶杯、拿茶叶，所以 8 + 1 = 9（分钟）。' },
  { q: '妈妈带 100 元买东西：买肉用去 42 元，买菜用去 18 元，还剩多少元？（试着用简便方法算）', a: '40', ex: '100 − 42 − 18 = 100 −（42 + 18）= 100 − 60 = 40（元）。' },
];

function genWordProblems() {
  return sample(MATH_WORD_BANK, 5).map(item => {
    let choices, answerIndex;
    if (item.options) {
      ({ choices, answerIndex } = shuffleChoices(item.options.slice(), item.options.indexOf(item.a)));
    } else {
      ({ choices, answerIndex } = shuffleChoices([item.a].concat(numDistractors(item.a)), 0));
    }
    return { type: 'choice', key: 'mw-' + item.q.slice(0, 14), prompt: item.q, choices, answerIndex, explain: item.ex };
  });
}

/* 单位换算（四上：公顷与平方千米；及长度、质量、人民币、时间复习） */
const UNIT_PAIRS = [
  { big: '千米', small: '米', f: 1000 },
  { big: '米', small: '分米', f: 10 },
  { big: '分米', small: '厘米', f: 10 },
  { big: '平方米', small: '平方分米', f: 100 },
  { big: '公顷', small: '平方米', f: 10000 },
  { big: '平方千米', small: '公顷', f: 100 },
  { big: '千克', small: '克', f: 1000 },
  { big: '吨', small: '千克', f: 1000 },
  { big: '元', small: '角', f: 10 },
  { big: '时', small: '分', f: 60 },
  { big: '分', small: '秒', f: 60 },
];

function genUnit() {
  return Array.from({ length: 10 }, () => {
    const p = pick(UNIT_PAIRS);
    const toSmall = Math.random() < 0.5;
    let q, ansStr, ex;
    if (toSmall) {
      const n = rnd(2, 9);
      ansStr = String(n * p.f);
      q = n + ' ' + p.big + ' = ？ ' + p.small;
      ex = '1 ' + p.big + ' = ' + p.f + ' ' + p.small + '，所以 ' + n + ' ' + p.big + ' = ' + n + ' × ' + p.f + ' = ' + ansStr + ' ' + p.small + '。';
    } else {
      const n = p.f * rnd(2, 9);
      ansStr = String(n / p.f);
      q = n + ' ' + p.small + ' = ？ ' + p.big;
      ex = p.f + ' ' + p.small + ' = 1 ' + p.big + '，所以 ' + n + ' ÷ ' + p.f + ' = ' + ansStr + ' ' + p.big + '。';
    }
    const a = Number(ansStr);
    const cands = [a * 10, a / 10, a * 100, a / 100, a * p.f, a / p.f, a + 1, a - 1];
    const good = shuffle([...new Set(cands.filter(v => v > 0 && Number.isInteger(v) && v !== a))]).slice(0, 3).map(String);
    while (good.length < 3) good.push(String(a + good.length + 2));
    const { choices, answerIndex } = shuffleChoices([ansStr].concat(good), 0);
    return { type: 'choice', key: 'unit-' + q, prompt: q, choices, answerIndex, explain: ex };
  });
}

/* ============================================================
   语  文（统编版四年级上下册）
   ============================================================ */
/* 看拼音写词语：['拼音', '词语'] */
const CN_WORDS = [
  ['yì lì', '屹立'], ['héng guàn', '横贯'], ['qí jì', '奇迹'], ['zhú jiàn', '逐渐'],
  ['yóu rú', '犹如'], ['kuān kuò', '宽阔'], ['huī fù', '恢复'], ['zhèn dòng', '震动'],
  ['zhù zhái', '住宅'], ['shèn zhòng', '慎重'], ['xuǎn zé', '选择'], ['dòng xué', '洞穴'],
  ['róu ruò', '柔弱'], ['píng tǎn', '平坦'], ['jūn yún', '均匀'], ['kòng xì', '空隙'],
  ['láo gù', '牢固'], ['hén jì', '痕迹'], ['yǔn xǔ', '允许'], ['róng huà', '融化'],
  ['yáng yì', '洋溢'], ['gū dú', '孤独'], ['fù gài', '覆盖'], ['dīng zhǔ', '叮嘱'],
  ['xiàn mù', '羡慕'], ['xùn chì', '训斥'], ['táo qì', '淘气'], ['wān yán', '蜿蜒'],
  ['mǐn jié', '敏捷'], ['jǐng jiè', '警戒'], ['ruì lì', '锐利'], ['yǎn hù', '掩护'],
  ['bó dòu', '搏斗'], ['pì rú', '譬如'], ['qī xī', '栖息'], ['zhuāng shì', '装饰'],
  ['shùn xù', '顺序'], ['hé xié', '和谐'],
];

function genPinyin() {
  return sample(CN_WORDS, 10).map(item => {
    const py = item[0], word = item[1];
    const decoys = shuffle(CN_WORDS.filter(w => w[1] !== word)).slice(0, 3).map(w => w[1]);
    const { choices, answerIndex } = shuffleChoices([word].concat(decoys), 0);
    return { type: 'choice', key: 'py-' + word, prompt: py, big: true, choices, answerIndex, explain: py + ' → ' + word };
  });
}

/* 古诗词（四年级必背） */
const POEMS = [
  { title: '暮江吟', dynasty: '唐', author: '白居易', lines: ['一道残阳铺水中', '半江瑟瑟半江红', '可怜九月初三夜', '露似真珠月似弓'],
    qs: [{ prompt: '“露似真珠月似弓”把露珠和月亮分别比作什么？', choices: ['珍珠和弯弓', '白银和圆盘', '宝石和小船'], a: 0, ex: '诗人把露珠比作珍珠，把初三的月牙比作弯弓。' }] },
  { title: '题西林壁', dynasty: '宋', author: '苏轼', lines: ['横看成岭侧成峰', '远近高低各不同', '不识庐山真面目', '只缘身在此山中'],
    qs: [{ prompt: '“不识庐山真面目，只缘身在此山中”告诉我们什么道理？', choices: ['当局者迷，要跳出局部、全面地看问题', '山太高了所以看不清', '要多去游览名山大川'], a: 0, ex: '身在山中反而看不清庐山全貌，说明观察问题要客观全面。' }] },
  { title: '雪梅', dynasty: '宋', author: '卢钺', lines: ['梅雪争春未肯降', '骚人搁笔费评章', '梅须逊雪三分白', '雪却输梅一段香'],
    qs: [{ prompt: '“梅须逊雪三分白，雪却输梅一段香”告诉我们什么？', choices: ['人和事物都各有长处和短处', '梅花开得比雪还要白', '冬天没有夏天好'], a: 0, ex: '梅不如雪白，雪没有梅香——要取长补短、正确看待自己和别人。' }] },
  { title: '嫦娥', dynasty: '唐', author: '李商隐', lines: ['云母屏风烛影深', '长河渐落晓星沉', '嫦娥应悔偷灵药', '碧海青天夜夜心'],
    qs: [{ prompt: '《嫦娥》这首诗写的是主人公怎样的心情？', choices: ['孤独寂寞', '开心快乐', '生气愤怒'], a: 0, ex: '烛影深、晓星沉、夜夜心，写出了主人公彻夜不眠的孤寂。' }] },
  { title: '出塞', dynasty: '唐', author: '王昌龄', lines: ['秦时明月汉时关', '万里长征人未还', '但使龙城飞将在', '不教胡马度阴山'],
    qs: [{ prompt: '“但使龙城飞将在，不教胡马度阴山”表达了诗人怎样的愿望？', choices: ['希望有英勇的将领守卫边关，让边疆安宁', '想去阴山看一看', '希望战争赶快打起来'], a: 0, ex: '诗人借怀念名将，表达了希望良将守边、平息战事的愿望。' }] },
  { title: '凉州词', dynasty: '唐', author: '王翰', lines: ['葡萄美酒夜光杯', '欲饮琵琶马上催', '醉卧沙场君莫笑', '古来征战几人回'],
    qs: [{ prompt: '“醉卧沙场君莫笑”表现了将士们怎样的精神？', choices: ['豪迈旷达、视死如归', '贪杯误事', '特别想家'], a: 0, ex: '即使醉倒在沙场也请君莫笑，写出将士们豪放洒脱的气概。' }] },
  { title: '夏日绝句', dynasty: '宋', author: '李清照', lines: ['生当作人杰', '死亦为鬼雄', '至今思项羽', '不肯过江东'],
    qs: [{ prompt: '“生当作人杰，死亦为鬼雄”表达了诗人怎样的情怀？', choices: ['活着要做人中豪杰，充满爱国豪情', '想搬到江东去住', '喜欢写诗'], a: 0, ex: '诗人借项羽宁可自刎也不苟且偷生的气节，表达爱国之情。' }] },
  { title: '别董大', dynasty: '唐', author: '高适', lines: ['千里黄云白日曛', '北风吹雁雪纷纷', '莫愁前路无知己', '天下谁人不识君'],
    qs: [{ prompt: '“莫愁前路无知己，天下谁人不识君”是劝慰朋友的话，意思是？', choices: ['不要担心前路遇不到知音，天下人都认识你', '前面的路上一个人也没有', '不要认识太多陌生人'], a: 0, ex: '这是对朋友的宽慰和鼓励：以你的才华，到哪里都会有人赏识。' }] },
  { title: '鹿柴', dynasty: '唐', author: '王维', lines: ['空山不见人', '但闻人语响', '返景入深林', '复照青苔上'],
    qs: [{ prompt: '“空山不见人，但闻人语响”中“但”的意思是？', choices: ['只', '但是', '只要'], a: 0, ex: '这里“但闻”就是“只听见”的意思。' }] },
  { title: '芙蓉楼送辛渐', dynasty: '唐', author: '王昌龄', lines: ['寒雨连江夜入吴', '平明送客楚山孤', '洛阳亲友如相问', '一片冰心在玉壶'],
    qs: [{ prompt: '“一片冰心在玉壶”表达了诗人怎样的品格？', choices: ['像冰一样纯洁透明，不慕名利', '很喜欢漂亮的玉壶', '天气非常寒冷'], a: 0, ex: '诗人以冰心玉壶自喻，表明自己心地纯洁、清廉自守。' }] },
  { title: '塞下曲', dynasty: '唐', author: '卢纶', lines: ['月黑雁飞高', '单于夜遁逃', '欲将轻骑逐', '大雪满弓刀'],
    qs: [{ prompt: '“欲将轻骑逐，大雪满弓刀”描写了怎样的情景？', choices: ['将军正要率轻骑兵追击敌人，大雪落满了弓刀', '士兵们在雪地里练习射箭', '猎人打猎满载而归'], a: 0, ex: '敌军夜逃，将军准备追击，茫茫大雪落满弓刀，场面雄壮。' }] },
  { title: '墨梅', dynasty: '元', author: '王冕', lines: ['我家洗砚池头树', '朵朵花开淡墨痕', '不要人夸好颜色', '只留清气满乾坤'],
    qs: [{ prompt: '“不要人夸好颜色，只留清气满乾坤”赞美了梅花怎样的品格？', choices: ['不求外表艳丽，只留清香正气，高洁淡泊', '颜色越鲜艳越好', '长得越高大越好'], a: 0, ex: '墨梅不靠艳丽外表讨人夸，只把清香气留在天地间，这也是诗人自己的追求。' }] },
  { title: '宿新市徐公店', dynasty: '宋', author: '杨万里', lines: ['篱落疏疏一径深', '树头新绿未成阴', '儿童急走追黄蝶', '飞入菜花无处寻'],
    qs: [{ prompt: '“儿童急走追黄蝶，飞入菜花无处寻”，为什么找不到蝴蝶了？', choices: ['黄蝶飞进黄色的菜花里，颜色一样分不出来了', '蝴蝶飞到天上去了', '儿童跑得太慢'], a: 0, ex: '黄蝶和金黄的菜花颜色相同，所以“无处寻”，很有童趣。' }] },
  { title: '四时田园杂兴（其二十五）', dynasty: '宋', author: '范成大', lines: ['梅子金黄杏子肥', '麦花雪白菜花稀', '日长篱落无人过', '惟有蜻蜓蛱蝶飞'],
    qs: [{ prompt: '“梅子金黄杏子肥”描写的是哪个季节？', choices: ['初夏', '深秋', '初春'], a: 0, ex: '梅子黄、杏子肥、麦花开，正是江南初夏农忙时节。' }] },
  { title: '清平乐·村居', dynasty: '宋', author: '辛弃疾', lines: ['茅檐低小', '溪上青青草', '醉里吴音相媚好', '白发谁家翁媪', '大儿锄豆溪东', '中儿正织鸡笼', '最喜小儿亡赖', '溪头卧剥莲蓬'],
    qs: [{ prompt: '“最喜小儿亡赖”中“亡赖”是骂人的话吗？', choices: ['不是，是顽皮可爱的意思，带着喜爱', '是，骂小孩没出息', '是害怕的意思'], a: 0, ex: '“亡赖”通“无赖”，这里指小儿子顽皮可爱，是喜爱的口吻。' }] },
  { title: '江畔独步寻花', dynasty: '唐', author: '杜甫', lines: ['黄四娘家花满蹊', '千朵万朵压枝低', '留连戏蝶时时舞', '自在娇莺恰恰啼'],
    qs: [{ prompt: '“留连戏蝶时时舞”中“留连”的意思是？', choices: ['舍不得离开', '站着一动不动', '流泪'], a: 0, ex: '蝴蝶舍不得离开花枝，不停地起舞，写出花儿的繁茂芬芳。' }] },
];

function genPoem() {
  /* 1) 上下句接龙题 */
  const couplets = [];
  POEMS.forEach(p => {
    for (let i = 0; i + 1 < p.lines.length; i += 2) couplets.push({ poem: p, l1: p.lines[i], l2: p.lines[i + 1] });
  });
  const allLines = POEMS.reduce((acc, p) => acc.concat(p.lines), []);
  const pickedCouplets = sample(couplets, 5).map(c => {
    let pool = shuffle(allLines.filter(l => l !== c.l1 && l !== c.l2 && Math.abs(l.length - c.l2.length) <= 1));
    if (pool.length < 3) {
      pool = pool.concat(shuffle(allLines.filter(l => l !== c.l1 && l !== c.l2 && pool.indexOf(l) < 0)).slice(0, 3 - pool.length));
    }
    const { choices, answerIndex } = shuffleChoices([c.l2].concat(pool.slice(0, 3)), 0);
    return {
      type: 'choice', key: 'pm-' + c.l1,
      prompt: '「' + c.l1 + '」的下一句是？', choices, answerIndex,
      explain: c.poem.title + '（' + c.poem.dynasty + ' · ' + c.poem.author + '）：' + c.l1 + '，' + c.l2 + '。'
    };
  });
  /* 2) 作者题（作者去重，避免同一人既是答案又是干扰项） */
  const authors = [...new Set(POEMS.map(p => p.author))];
  const pickedAuthors = sample(POEMS, 2).map(p => {
    const decoys = shuffle(authors.filter(a => a !== p.author)).slice(0, 3);
    const { choices, answerIndex } = shuffleChoices([p.author].concat(decoys), 0);
    return {
      type: 'choice', key: 'pa-' + p.title,
      prompt: '《' + p.title + '》的作者是谁？', choices, answerIndex,
      explain: '《' + p.title + '》是' + p.dynasty + '代诗人 ' + p.author + ' 的作品。'
    };
  });
  /* 3) 诗句理解题 */
  const staticQs = POEMS.filter(p => p.qs && p.qs.length).map(p => ({
    type: 'choice', key: 'pq-' + p.title, prompt: p.qs[0].prompt,
    choices: p.qs[0].choices, answerIndex: p.qs[0].a, explain: p.qs[0].ex
  }));
  return shuffle(pickedCouplets.concat(pickedAuthors, sample(staticQs, 3))).slice(0, 10);
}

/* 成语填空 */
const IDIOMS = [
  { p: '（　）流不息', a: '川', o: ['川', '穿', '传', '船'] },
  { p: '（　）澜壮阔', a: '波', o: ['波', '拨', '泼', '坡'] },
  { p: '水天相（　）', a: '接', o: ['接', '结', '节', '洁'] },
  { p: '（　）山峻岭', a: '崇', o: ['崇', '丛', '从', '宗'] },
  { p: '（　）云驾雾', a: '腾', o: ['腾', '藤', '疼', '卷'] },
  { p: '（　）规蹈矩', a: '循', o: ['循', '寻', '训', '巡'] },
  { p: '随遇而（　）', a: '安', o: ['安', '按', '岸', '案'] },
  { p: '不（　）其数', a: '计', o: ['计', '记', '纪', '济'] },
  { p: '（　）然大悟', a: '恍', o: ['恍', '晃', '慌', '荒'] },
  { p: '金碧辉（　）', a: '煌', o: ['煌', '皇', '黄', '凰'] },
  { p: '若隐若（　）', a: '现', o: ['现', '线', '见', '宪'] },
  { p: '理（　）气壮', a: '直', o: ['直', '值', '植', '执'] },
  { p: '千（　）百态', a: '姿', o: ['姿', '资', '滋', '瓷'] },
  { p: '（　）接不暇', a: '应', o: ['应', '英', '迎', '营'] },
  { p: '胆战心（　）', a: '惊', o: ['惊', '京', '经', '精'] },
  { p: '如虎添（　）', a: '翼', o: ['翼', '意', '亿', '忆'] },
  { p: '画龙点（　）', a: '睛', o: ['睛', '晴', '清', '情'] },
  { p: '一（　）不苟', a: '丝', o: ['丝', '斯', '思', '私'] },
  { p: '全神（　）注', a: '贯', o: ['贯', '惯', '冠', '灌'] },
  { p: '神清气（　）', a: '爽', o: ['爽', '霜', '双', '帅'] },
];

function genIdioms() {
  return sample(IDIOMS, 10).map(item => {
    const { choices, answerIndex } = shuffleChoices(item.o.slice(), item.o.indexOf(item.a));
    return {
      type: 'choice', key: 'id-' + item.p,
      prompt: '把成语补充完整：' + item.p, choices, answerIndex,
      explain: '这个成语是「' + item.p.replace('（　）', item.a) + '」。'
    };
  });
}

/* 多音字 / 形近字 */
const CHAR_QS = [
  { prompt: '“投降”的“降”读什么？', choices: ['xiáng', 'jiàng'], a: 0, ex: '投降读 xiáng；下降、降落读 jiàng。' },
  { prompt: '“薄荷”的“薄”读什么？', choices: ['bò', 'báo', 'bó'], a: 0, ex: '薄荷读 bò；薄纸、薄被读 báo；单薄、淡薄读 bó。' },
  { prompt: '“便宜”的“便”读什么？', choices: ['pián', 'biàn'], a: 0, ex: '便宜读 pián yi；方便、便利读 biàn。' },
  { prompt: '“缝隙”的“缝”读什么？', choices: ['fèng', 'féng'], a: 0, ex: '缝隙读 fèng；缝补、缝衣服读 féng。' },
  { prompt: '“处理”的“处”读什么？', choices: ['chǔ', 'chù'], a: 0, ex: '处理、处分读 chǔ；到处、住处读 chù。' },
  { prompt: '选字填空：妹妹很（　）气。', choices: ['淘', '萄', '陶'], a: 0, ex: '淘气、淘米是三点水的“淘”；葡萄是草字头的“萄”；陶器是“阝”的“陶”。' },
  { prompt: '选字填空：争（　）', choices: ['辩', '辨', '辫'], a: 0, ex: '辩论用言字旁的“辩”；分辨用中间一点的“辨”；辫子用中间“丝”的“辫”。' },
  { prompt: '选字填空：分（　）是非', choices: ['辨', '辩', '辫'], a: 0, ex: '“辨别”用中间一点的“辨”。' },
  { prompt: '选字填空：寂（　）', choices: ['寞', '漠', '模'], a: 0, ex: '寂寞是宝盖头的“寞”；沙漠是三点水的“漠”；模范是木字旁的“模”。' },
  { prompt: '选字填空：傍晚的（　）色', choices: ['暮', '幕', '墓'], a: 0, ex: '暮色指傍晚，“日”落在草下；开幕、银幕是“巾”底的“幕”；坟墓是“土”底的“墓”。' },
  { prompt: '选字填空：（　）树', choices: ['栽', '裁', '载'], a: 0, ex: '栽树是木字底的“栽”；裁缝是“衣”底的“裁”；记载、装载是“车”底的“载”。' },
  { prompt: '选字填空：（　）开礼物', choices: ['拆', '折', '析'], a: 0, ex: '拆开是提手旁加“斥”的“拆”；折纸、打折是“折”；分析是木字旁加“斤”的“析”。' },
  { prompt: '“气候”的“候”，选正确的字：', choices: ['候', '侯'], a: 0, ex: '“候”中间有一小竖；气候、等候用“候”；诸侯、王侯用“侯”。' },
  { prompt: '“恢复”的“恢”是什么偏旁？', choices: ['忄（竖心旁）', '氵（三点水）', '木字旁'], a: 0, ex: '“恢”是竖心旁，不要写成三点水。' },
  { prompt: '选字组词：（　）伟的长城', choices: ['雄', '难', '谁'], a: 0, ex: '雄伟、英雄用“雄”。' },
];

function genCharQs() {
  return sample(CHAR_QS, 10).map(item => {
    const { choices, answerIndex } = shuffleChoices(item.choices.slice(), item.a);
    return { type: 'choice', key: 'ch-' + item.prompt, prompt: item.prompt, choices, answerIndex, explain: item.ex };
  });
}

/* ============================================================
   英  语（PEP 四年级上下册词汇）
   ============================================================ */
const EN_WORDS = [
  { en: 'window', zh: '窗户' }, { en: 'door', zh: '门' }, { en: 'desk', zh: '课桌' },
  { en: 'chair', zh: '椅子' }, { en: 'light', zh: '电灯' }, { en: 'picture', zh: '图画' },
  { en: 'blackboard', zh: '黑板' }, { en: 'computer', zh: '电脑' }, { en: 'fan', zh: '风扇' },
  { en: 'wall', zh: '墙壁' }, { en: 'floor', zh: '地板' }, { en: 'classroom', zh: '教室' },
  { en: 'schoolbag', zh: '书包' }, { en: 'maths book', zh: '数学书' }, { en: 'English book', zh: '英语书' },
  { en: 'Chinese book', zh: '语文书' }, { en: 'storybook', zh: '故事书' }, { en: 'notebook', zh: '笔记本' },
  { en: 'candy', zh: '糖果' }, { en: 'toy', zh: '玩具' }, { en: 'key', zh: '钥匙' },
  { en: 'strong', zh: '强壮的' }, { en: 'friendly', zh: '友好的' }, { en: 'quiet', zh: '安静的' },
  { en: 'thin', zh: '瘦的' }, { en: 'tall', zh: '高的' }, { en: 'hair', zh: '头发' },
  { en: 'glasses', zh: '眼镜' }, { en: 'shoe', zh: '鞋子' },
  { en: 'bedroom', zh: '卧室' }, { en: 'living room', zh: '客厅' }, { en: 'study', zh: '书房' },
  { en: 'kitchen', zh: '厨房' }, { en: 'bathroom', zh: '卫生间' }, { en: 'bed', zh: '床' },
  { en: 'phone', zh: '电话' }, { en: 'table', zh: '餐桌' }, { en: 'sofa', zh: '沙发' },
  { en: 'fridge', zh: '冰箱' },
  { en: 'beef', zh: '牛肉' }, { en: 'chicken', zh: '鸡肉' }, { en: 'noodles', zh: '面条' },
  { en: 'soup', zh: '汤' }, { en: 'vegetable', zh: '蔬菜' }, { en: 'chopsticks', zh: '筷子' },
  { en: 'bowl', zh: '碗' }, { en: 'fork', zh: '叉子' }, { en: 'knife', zh: '刀' },
  { en: 'spoon', zh: '勺子' },
  { en: 'parents', zh: '父母' }, { en: 'uncle', zh: '叔叔；舅舅' }, { en: 'aunt', zh: '姑姑；姨母' },
  { en: 'baby brother', zh: '婴儿小弟弟' },
  { en: 'library', zh: '图书馆' }, { en: 'playground', zh: '操场' }, { en: 'garden', zh: '花园' },
  { en: "teachers' office", zh: '教师办公室' }, { en: 'computer room', zh: '计算机房' },
  { en: 'art room', zh: '美术教室' }, { en: 'music room', zh: '音乐教室' },
  { en: 'breakfast', zh: '早餐' }, { en: 'lunch', zh: '午餐' }, { en: 'dinner', zh: '晚餐' },
  { en: 'English class', zh: '英语课' }, { en: 'music class', zh: '音乐课' },
  { en: 'cold', zh: '寒冷的' }, { en: 'cool', zh: '凉爽的' }, { en: 'warm', zh: '温暖的' },
  { en: 'hot', zh: '炎热的' }, { en: 'sunny', zh: '晴朗的' }, { en: 'windy', zh: '多风的' },
  { en: 'cloudy', zh: '多云的' }, { en: 'snowy', zh: '下雪的' }, { en: 'rainy', zh: '下雨的' },
  { en: 'tomato', zh: '西红柿' }, { en: 'potato', zh: '马铃薯' }, { en: 'carrot', zh: '胡萝卜' },
  { en: 'horse', zh: '马' }, { en: 'cow', zh: '奶牛；母牛' }, { en: 'sheep', zh: '绵羊' },
  { en: 'hen', zh: '母鸡' }, { en: 'farm', zh: '农场' }, { en: 'goat', zh: '山羊' },
  { en: 'hat', zh: '帽子' }, { en: 'sunglasses', zh: '太阳镜' }, { en: 'scarf', zh: '围巾' },
  { en: 'gloves', zh: '手套' }, { en: 'umbrella', zh: '雨伞' },
  { en: 'pretty', zh: '美观的；精致的' }, { en: 'expensive', zh: '昂贵的' },
  { en: 'cheap', zh: '便宜的' }, { en: 'nice', zh: '好看的' },
];

function genE2Z() {
  return sample(EN_WORDS, 10).map(w => {
    const seen = new Set([w.zh]);
    const decoys = [];
    for (const x of shuffle(EN_WORDS)) {
      if (!seen.has(x.zh)) { seen.add(x.zh); decoys.push(x.zh); }
      if (decoys.length === 3) break;
    }
    const { choices, answerIndex } = shuffleChoices([w.zh].concat(decoys), 0);
    return { type: 'choice', key: 'e2z-' + w.en, prompt: w.en, speak: w.en, choices, answerIndex, explain: w.en + ' = ' + w.zh };
  });
}

function genZ2E() {
  return sample(EN_WORDS, 10).map(w => {
    const seen = new Set([w.en]);
    const decoys = [];
    for (const x of shuffle(EN_WORDS)) {
      if (!seen.has(x.en)) { seen.add(x.en); decoys.push(x.en); }
      if (decoys.length === 3) break;
    }
    const { choices, answerIndex } = shuffleChoices([w.en].concat(decoys), 0);
    return { type: 'choice', key: 'z2e-' + w.en, prompt: w.zh, choices, answerIndex, explain: w.zh + ' → ' + w.en };
  });
}

function genSpell() {
  const pool = EN_WORDS.filter(w => /^[a-z]+$/i.test(w.en));
  return sample(pool, 10).map(w => ({
    type: 'input', key: 'spell-' + w.en, prompt: w.zh + ' 的英语单词是？', pad: 'text',
    answer: w.en, explain: w.zh + ' → ' + w.en,
    hint: '首字母是 ' + w.en[0].toUpperCase() + '，共 ' + w.en.length + ' 个字母'
  }));
}

/* 情景对话 */
const EN_SENTS = [
  { prompt: '别人帮助了你，你应该说：', choices: ['Thank you.', 'Sorry.', 'Goodbye.'], a: 0, ex: 'Thank you. 谢谢你。' },
  { prompt: '早上见到老师，你应该说：', choices: ['Good morning.', 'Good night.', 'Thank you.'], a: 0, ex: 'Good morning. 早上好。' },
  { prompt: '你想知道几点了，应该问：', choices: ['What time is it?', 'What colour is it?', 'Who is she?'], a: 0, ex: 'What time is it? 现在几点了？' },
  { prompt: '“现在七点了。”怎么说？', choices: ["It's 7 o'clock.", 'It is 7 books.', 'It is Monday.'], a: 0, ex: "It's 7 o'clock. 现在七点整。" },
  { prompt: '你想知道今天天气怎么样，应该问：', choices: ["What's the weather like today?", 'Where is the weather?', 'What time is it?'], a: 0, ex: "What's the weather like today? 今天天气怎么样？" },
  { prompt: '“我想要一些牛肉。”怎么说？', choices: ["I'd like some beef.", 'I like beef very much.', 'The beef is big.'], a: 0, ex: "I'd like some beef. 我想要些牛肉。" },
  { prompt: '“我的书包在哪儿？”应该问：', choices: ['Where is my schoolbag?', 'What is my schoolbag?', 'Whose schoolbag?'], a: 0, ex: 'Where is my schoolbag? 我的书包在哪里？' },
  { prompt: '— Where is Amy? — ______', choices: ["She's in the study.", 'She is Amy.', "It's nine o'clock."], a: 0, ex: "问在哪里，回答 She's in the study. 她在书房。" },
  { prompt: '— How many books do you have? — ______', choices: ['I have six.', 'They are red.', 'Yes, I do.'], a: 0, ex: 'How many 问数量，回答 I have six. 我有六本。' },
  { prompt: '— Is this your schoolbag? — ______', choices: ['Yes, it is.', "Yes, it isn't.", 'No, it is.'], a: 0, ex: '一般疑问句的肯定回答：Yes, it is.' },
  { prompt: '把你的朋友介绍给妈妈认识，应该说：', choices: ['This is my friend.', 'I am your friend.', 'She is my mother.'], a: 0, ex: 'This is my friend. 这是我的朋友。' },
  { prompt: '“晚饭好了！”主人会说：', choices: ["Dinner's ready!", 'Good night!', 'Excuse me.'], a: 0, ex: "Dinner's ready! 晚饭好了。" },
  { prompt: "— Let's clean the classroom! — ______", choices: ['OK. Let me help you.', 'Thank you.', "It's under the chair."], a: 0, ex: '别人提议一起做，回答 OK. Let me help you. 好呀，让我来帮忙。' },
  { prompt: '— What would you like for dinner? — ______', choices: ["I'd like some soup and rice.", 'I like my school.', "It's sunny."], a: 0, ex: "What would you like...? 问想吃什么，用 I'd like... 回答。" },
];

function genSent() {
  return sample(EN_SENTS, 10).map(item => {
    const { choices, answerIndex } = shuffleChoices(item.choices.slice(), item.a);
    return { type: 'choice', key: 'sent-' + item.prompt, prompt: item.prompt, choices, answerIndex, explain: item.ex };
  });
}

/* ============================================================
   科目与玩法注册表
   ============================================================ */
const SUBJECTS = [
  {
    id: 'chinese', name: '语文', emoji: '📖', color: '#ff6b6b', gradient: '#ff9a8b,#ff5252',
    modes: [
      { id: 'py', name: '看拼音写词', emoji: '🔤', desc: '读拼音，选出正确的词语', gen: genPinyin },
      { id: 'poem', name: '古诗天地', emoji: '🏯', desc: '接诗句、背古诗、悟诗意', gen: genPoem },
      { id: 'idiom', name: '成语填空', emoji: '🧩', desc: '把成语补充完整', gen: genIdioms },
      { id: 'char', name: '字词诊所', emoji: '🩺', desc: '多音字、形近字辨一辨', gen: genCharQs },
    ]
  },
  {
    id: 'math', name: '数学', emoji: '🔢', color: '#4d96ff', gradient: '#6ec3ff,#3a7bd5',
    modes: [
      { id: 'oral', name: '口算挑战', emoji: '⚡', desc: '又快又对，连算 10 道', gen: function () { return MATH.oral(); } },
      { id: 'vertical', name: '竖式计算', emoji: '📝', desc: '三位数乘两位数等大数计算', gen: function () { return MATH.vertical(); } },
      { id: 'word', name: '应用题乐园', emoji: '🎡', desc: '解决生活中的数学问题', gen: genWordProblems },
      { id: 'unit', name: '单位换算', emoji: '📐', desc: '公顷、平方千米、时间…', gen: genUnit },
      { id: 'sheet', name: '口算打印卡', emoji: '🖨️', desc: '生成 40 道口算题，打印成卷练习', kind: 'print' },
    ]
  },
  {
    id: 'english', name: '英语', emoji: '📣', color: '#2fbf71', gradient: '#7bdc9a,#1f9d5b',
    modes: [
      { id: 'e2z', name: '单词认读', emoji: '👀', desc: '看英语，选中文（可听发音）', gen: genE2Z },
      { id: 'z2e', name: '看词说英', emoji: '💡', desc: '看中文，选英语', gen: genZ2E },
      { id: 'spell', name: '单词拼写', emoji: '✏️', desc: '根据中文拼出英语单词', gen: genSpell },
      { id: 'sent', name: '情景对话', emoji: '💬', desc: '选句子，补全对话', gen: genSent },
      { id: 'cards', name: '单词卡', emoji: '🃏', desc: '翻卡片、听发音、记单词', kind: 'flash' },
    ]
  },
];

function subjectById(id) { return SUBJECTS.find(s => s.id === id); }
function modeById(sid, mid) {
  const s = subjectById(sid);
  return s && s.modes.find(m => m.id === mid);
}

/* 供 Node 冒烟测试加载（浏览器环境下无副作用） */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MATH, MATH_WORD_BANK, UNIT_PAIRS, SUBJECTS,
    genUnit, genWordProblems, genPinyin, genPoem, genIdioms, genCharQs,
    genE2Z, genZ2E, genSpell, genSent,
  };
}
