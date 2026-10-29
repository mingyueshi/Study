/* 运行：node primary/test/test-chain.js。验证真实词库连通性、接龙规则与续玩。 */
'use strict';
const assert = require('node:assert/strict');
const E = require('../chain-engine.js');
const D = require('../idioms-data.js');
const { CHAIN_SUPPLEMENTS } = require('../chain-data.js');
let checked = 0;
function check(condition, message) { checked++; assert.ok(condition, message); }
const dictionary = E.createDictionary(D.IDIOM_UNITS, D.IDIOM_ZH, CHAIN_SUPPLEMENTS);
const snapshot = (words, mode = 'solo') => ({
  version: 1, mode,
  totals: { accepted: 0, rounds: 1, best: { solo: 0, partner: 0 } },
  round: { trail: words.map((idiom, index) => ({ idiom, by: !index ? 'start' : mode === 'solo' || index % 2 ? 'player' : 'partner' })), hinted: [] },
});

console.log('— 词库与常见接法 —');
check(dictionary.entries.length >= 700, '合并词库至少 700 条');
check(dictionary.byId.size === dictionary.entries.length, '词库去重');
const seen = new Set();
for (const word of CHAIN_SUPPLEMENTS) {
  check(/^[\u4e00-\u9fff]{4}$/.test(word.idiom), word.idiom + ' 必须为四字成语');
  check(!seen.has(word.idiom), word.idiom + ' 补充词不能重复');
  seen.add(word.idiom);
  check(word.zh.length >= 8, word.idiom + ' 缺少释义');
  const syllables = word.pinyin.split(/\s+/);
  check(syllables.length === 4 && syllables.every(s => /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]+$/i.test(s)), word.idiom + ' 拼音不完整');
}
for (const unit of D.IDIOM_UNITS) for (const word of unit.idioms) {
  check(dictionary.byId.get(word.idiom).zh === word.zh, word.idiom + ' 应优先保留成语本释义');
}
for (const word of dictionary.entries) check(/^[\u4e00-\u9fff]{4}$/.test(word.idiom) && word.zh.trim(), word.idiom + ' 可供接龙');
check(dictionary.byId.get('用之不竭').pinyin, '补充词包含读音');
check(E.normalize(' 人 山 人 海 \n') === '人山人海', '中文空格规范化');

const familiar = ['一鸣惊人', '人山人海', '海阔天空', '空前绝后', '后起之秀', '秀外慧中', '中流砥柱'];
const familiarGame = E.createGame(dictionary, snapshot([familiar[0]]));
for (const word of familiar.slice(1)) check(familiarGame.submit(word).ok, '常见接法 ' + word);
check(familiarGame.status().playerCount === familiar.length - 1, '开头不计入接对数');

console.log('— 输入校验与失败不改记录 —');
const game = E.createGame(dictionary, snapshot(['一鸣惊人']));
for (const [input, code] of [['', 'format'], ['人海', 'format'], ['<img>', 'format'], ['人人人人', 'unknown'], ['春暖花开', 'mismatch'], ['一鸣惊人', 'repeat']]) {
  const before = JSON.stringify(game.snapshot());
  const result = game.submit(input);
  check(!result.ok && result.code === code, input + ' 校验代码应为 ' + code);
  check(JSON.stringify(game.snapshot()) === before, input + ' 校验失败不修改进度');
}
check(game.submit(' 人 山 人 海 ').ok, '四字成语允许空格输入');
check(game.snapshot().totals.accepted === 1 && game.snapshot().totals.best.solo === 1, '累计与最佳只增加一次');
const restored = E.createGame(dictionary, JSON.parse(JSON.stringify(game.snapshot())));
check(restored.status().current.idiom === '人山人海' && restored.status().playerCount === 1, '刷新恢复同一轮');
check(restored.snapshot().totals.rounds === game.snapshot().totals.rounds, '续玩不增加轮数');

const homophones = E.createDictionary([], { 人山人海: '形容人聚集得非常多。', 海阔天空: '形容非常广阔或谈话无拘无束。', 害群之马: '比喻危害集体利益的人。' });
check(E.createGame(homophones, snapshot(['人山人海'])).submit('害群之马').code === 'mismatch', '同音不同字不能接');

console.log('— 提示、陪练与结束边界 —');
const beforeHint = game.snapshot();
const hints = game.hint();
check(hints.length > 0 && hints.length <= 3, '提示返回最多三个可接词');
check(hints.every(word => word.idiom[0] === '海' && !beforeHint.round.trail.some(entry => entry.idiom === word.idiom)), '提示满足同字与不重复');
game.hint();
check(game.status().hintCount === 1, '同一接点反复查看提示只计一次');
check(game.snapshot().totals.accepted === beforeHint.totals.accepted, '查看提示不直接加分');
const loop = E.createDictionary([], { 人山人海: '形容人聚集得非常多。', 海阔天空: '形容非常广阔。', 空前绝后: '以前没有过以后很难有。', 后继有人: '后来还有人接续事业。', 人定胜天: '依靠人的力量克服困难。' });
const loopGame = E.createGame(loop, snapshot(['人山人海', '海阔天空', '空前绝后', '后继有人']));
check(loopGame.submit('人山人海').code === 'repeat', '绕回相同首字仍不能重复成语');

const fixture = E.createDictionary([], { 万众一心: '大家团结一心共同努力。', 心想事成: '心里希望的事情能够实现。', 成家立业: '建立家庭并成就事业。', 成千上万: '形容数量非常多。', 万无一失: '十分有把握不会有差错。', 失而复得: '丢失以后又重新得到。' });
const partner = E.createGame(fixture, snapshot(['万众一心'], 'partner'), () => 0);
const partnerMove = partner.submit('心想事成');
check(partnerMove.ok && partnerMove.reply === '成千上万', '陪练优先选能让孩子继续接的路线');
check(partner.status().playerCount === 1 && partner.snapshot().totals.accepted === 1, '小龙的回答不计入玩家分数');
check(partner.snapshot().totals.best.partner === 1 && partner.snapshot().totals.best.solo === 0, '不同玩法分别统计最佳');
const partnerReload = E.createGame(fixture, partner.snapshot());
check(partnerReload.status().current.idiom === '成千上万', '陪练恢复停在正确的玩家回合');
check(partnerReload.submit('万无一失').reply === '失而复得', '恢复后小龙继续按规则接');
check(partnerReload.status().ended && partnerReload.hint().length === 0, '词库无候选时自然结束');
const endState = JSON.stringify(partnerReload.snapshot());
check(partnerReload.submit('得心应手').code === 'ended' && JSON.stringify(partnerReload.snapshot()) === endState, '结束后不能继续加分');
partnerReload.newRound('solo');
check(partnerReload.status().mode === 'solo' && partnerReload.status().playerCount === 0, '切换玩法新开一轮');
check(partnerReload.snapshot().totals.best.partner === 2, '新一轮保留旧纪录');

console.log('— 无效存档与开局可玩性 —');
for (const invalid of [null, [], 'bad', { version: 1, mode: 'other', round: {} },
  { ...snapshot(['一鸣惊人']), round: { trail: [{ idiom: '不存在的词', by: 'start' }] } },
  snapshot(['一鸣惊人', '春暖花开']), snapshot(['一鸣惊人', '人山人海', '一鸣惊人']),
  snapshot(['万众一心', '心想事成'], 'partner'),
  { ...snapshot(['一鸣惊人']), totals: { accepted: -8, rounds: 'bad', best: { solo: null } } },
]) {
  const recovered = E.createGame(dictionary, invalid, () => .35);
  check(recovered.snapshot().round.trail.every(entry => dictionary.byId.has(entry.idiom)), '无效存档可恢复为有效进度');
  check(Number.isSafeInteger(recovered.snapshot().totals.accepted) && recovered.snapshot().totals.accepted >= 0, '无效分数不会污染统计');
}
for (let seed = 0; seed < 30; seed++) {
  const run = E.createGame(dictionary, null, () => seed / 30);
  const starting = run.status().current.idiom;
  check(!!run.status().current.pinyin, '开头优先使用有拼音的完整记录');
  for (let i = 0; i < 4; i++) {
    const suggestion = run.hint()[0];
    check(!!suggestion && run.submit(suggestion.idiom).ok, starting + ' 开局至少支持四步接龙');
  }
  run.newRound();
  check(run.snapshot().round.trail[0].idiom !== starting, '换开头不会再次抽中同一个开头');
}
const largeStats = snapshot(['一鸣惊人']);
largeStats.totals.accepted = Number.MAX_SAFE_INTEGER;
largeStats.totals.rounds = Number.MAX_SAFE_INTEGER;
const bounded = E.createGame(dictionary, largeStats);
bounded.submit('人山人海');
bounded.newRound();
check(Number.isSafeInteger(bounded.snapshot().totals.accepted) && Number.isSafeInteger(bounded.snapshot().totals.rounds), '异常大统计不溢出安全整数');
assert.throws(() => E.createGame(E.createDictionary([], {})), /词库不能为空/);
console.log('✅ 成语接龙通过（' + dictionary.entries.length + ' 条词库，共 ' + checked + ' 项断言）');
