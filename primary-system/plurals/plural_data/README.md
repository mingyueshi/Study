# 不规则复数数据说明

`plurals.json` 是**手工维护**的教学词表（与多音字从 CC-CEDICT 推导不同——
英语不规则复数是封闭的常识词表，仓库词库的 WordNet 只覆盖 536 词选择范围，
man/child 等核心词不在其中，故不推导）。运行时离线只读，不查库。

## 来源口径

- 参照 Cambridge Dictionary 与 British Council LearnEnglish Kids 的常见
  不规则复数清单整理；`source.references` 随文件记录。
- 每组单复数各标一种常见美式读法。参照 [CMUdict 美式读音词表](https://github.com/cmusphinx/cmudict/tree/74790861f652b15e4ac49015a90074ad62a27690)，对照词义选择读法，例如 [basis → bases](https://dictionary.cambridge.org/pronunciation/english/bases)、[axis → axes](https://dictionary.cambridge.org/us/pronunciation/english/axes)、[focus → foci](https://dictionary.cambridge.org/dictionary/english/focus)；个别缺项对照词典补齐，例如 [alga → algae](https://www.merriam-webster.com/dictionary/alga) 和 [addendum → addenda](https://www.merriam-webster.com/dictionary/addendum)。
- `tier: core` 为小学必会词（27 个，进「练一练」题池）；`tier: extended`
  仅浏览、卡片标「拓展」徽章（43 个）。
- 分六组：元音变化 / -en 词尾 / f 变 ves / 单复同形 / 其他要记的 / 外来词
  （外来词全部为拓展层）。规模基线：**70 对**（core 27 + extended 43），
  契约测试断言下限。

## schema（schema_version: 1）

- 顶层：`schema_version`、`source{name, references, method}`、`groups[]`、`items[]`
- group：`{code, name, hint}`
- item：`{singular(全表唯一), plural, singular_ipa, plural_ipa, zh, emoji?, group, tier, note?, examples}`
  ——`singular_ipa` 和 `plural_ipa` 均须用斜杠括起。单复同形词使用相同音标。note 用中文标点，契约测试拦截
  英文双引号、裸换行与 HTML 标签形态。
- `examples` 由 `singular` 和 `plural` 两个例句组成，各写一条英文（`en`）和中文（`cn`）。
  两句用同一场景，改变数量、目标词形和必要的句子成分。单复同形词用数字和动词让数量差别可见。
  词卡展开后对照两句，每句可用设备语音点读。

## 练习的干扰项

「给单数选复数」的选项集在加载期确定性生成：正确复数 + 机械规则误推形态
（+s、+es，即 childs、foots、knifes 这类真实典型错误）+ 一个他词复数；
`?q_seed=` 只做展示顺序轮换。report 端点按同一确定性选项集复核，前端结论
不被信任。
题干显示单数音标。答完后显示正确复数及其音标，下方一起展示该词的单复数双语例句，可分别点读。
词卡、练习和单词变身屋共用同一份音标和例句。
词卡在主区，「练一练」在筛选侧栏内默认展开，可点击标题收起。窄屏先展开侧栏，也可直接打开 `/plurals/#practice`。

## 单词变身屋

`/plurals/#transform` 可直接展开「单词变身屋」，平时只显示折叠入口。活动使用同一词表中 27 个核心词。前端从已渲染词卡读取词形、音标、
释义、例句与提示，每轮打乱顺序逐个展示。点击单数揭晓复数并切换例句，再点可变回。单复同形词通过
数量图示与说明强调「数量变多，词形不变」。同一词反复点击只计一次，跳过的词不算已
变身，最后一个可重新开一轮。支持听当前词的读音，揭晓和计数仅用于记忆，不调用
`report`，不写学习记录，也不发放答题奖励。关闭 JavaScript 时仍可浏览完整词表。

## 修订流程

1. 改 `plurals.json`（增删词、调 tier、补 note，新增词时补齐单复数音标和双语例句）
2. `manage.py test plurals`（契约测试会核对规模与形状）
3. 打开 `/plurals/` 目检浏览与练习
4. 学习记录、总览卡与游客清理不依赖本文件内容，无需额外操作
