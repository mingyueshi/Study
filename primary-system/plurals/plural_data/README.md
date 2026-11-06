# 不规则复数数据说明

`plurals.json` 是**手工维护**的教学词表（与多音字从 CC-CEDICT 推导不同——
英语不规则复数是封闭的常识词表，仓库词库的 WordNet 只覆盖 536 词选择范围，
man/child 等核心词不在其中，故不推导）。运行时离线只读，不查库。

## 来源口径

- 参照 Cambridge Dictionary 与 British Council LearnEnglish Kids 的常见
  不规则复数清单整理；`source.references` 随文件记录。
- `tier: core` 为小学必会词（27 个，进「练一练」题池）；`tier: extended`
  仅浏览、卡片标「拓展」徽章（43 个）。
- 分六组：元音变化 / -en 词尾 / f 变 ves / 单复同形 / 其他要记的 / 外来词
  （外来词全部为拓展层）。规模基线：**70 对**（core 27 + extended 43），
  契约测试断言下限。

## schema（schema_version: 1）

- 顶层：`schema_version`、`source{name, references, method}`、`groups[]`、`items[]`
- group：`{code, name, hint}`
- item：`{singular(全表唯一), plural, zh, emoji?, group, tier, note?}`
  ——单复同形词 plural 与 singular 相同；note 用中文标点，契约测试拦截
  英文双引号、裸换行与 HTML 标签形态。

## 练习的干扰项

「给单数选复数」的选项集在加载期确定性生成：正确复数 + 机械规则误推形态
（+s、+es，即 childs、foots、knifes 这类真实典型错误）+ 一个他词复数；
`?q_seed=` 只做展示顺序轮换。report 端点按同一确定性选项集复核，前端结论
不被信任。

## 修订流程

1. 改 `plurals.json`（增删词、调 tier、补 note）
2. `manage.py test plurals`（契约测试会核对规模与形状）
3. 打开 `/plurals/` 目检浏览与练习
4. 学习记录、总览卡与游客清理不依赖本文件内容，无需额外操作
