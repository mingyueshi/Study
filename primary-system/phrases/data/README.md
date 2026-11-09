# 日常用语数据说明

`phrases.json` 是**生成物**：由 `scripts/build_phrases.cjs` 从
`content_sources/english-data.js` 的 `ENGLISH_PHRASES`（挂在教材词卡上的常见短语与
短句，外研版四上/四下口径）确定性转换而来，重跑无 diff。**en/zh 文本以教材
语料为单一数据源**——改句子去教材数据改，重跑本脚本自动同步。

```sh
node scripts/build_phrases.cjs        # 重新生成（输出分布统计）
manage.py test phrases                # 契约测试
```

## schema（schema_version: 1）

- 顶层：`schema_version`、`source{name,references,method}`、`patterns[]`、
  `scenarios[]`、`items[]`
- pattern：`{code, name, formula}`——句式组（Let's… / Can… / There be /
  日常套语…），formula 是给孩子的一句中文口诀
- scenario：`{code, zh}`——情景码**只取 words 应用既有的 46 个 `u-*` 子集**
  （11 个话题），保证「去场景单词学词」互链可达
- item：`{id(ph-+md5 前 10 位), en, zh, head, heads[], unit_id, scenario,
  pattern, tier}`——`tier: core` 为句子形态（141 句，进「看中文选英文」
  练习池，必有句式分组）；`tier: extended` 为搭配类（456 条，如 play
  volleyball，pattern 为空、只浏览）

## 组织口径（一份数据两个视图）

- **句式视图**：core 句子按 pattern 分组，组头带 formula
- **话题视图**：全部条目按 scenario 分组，组头挂「去场景单词学词 →」
- scenario 由短语 → 词头所属教材单元 → `UNIT_SCENARIO` 映射表推导；
  pattern 由句首功能正则切组（句首感叹词/时间副词先剥离），个别落空项在
  脚本 `PATTERN_OVERRIDES` 覆盖表精确指派。规模基线：**597 条**
  （core 141 + extended 456），契约测试断言下限。

## 练习的干扰项

「看中文选英文」的选项集在加载期确定性生成：正确句 + 两个同句式干扰 +
一个同话题干扰（不足时回退同话题、再回退任意）；`?q_seed=` 只做展示顺序
轮换。report 端点按同一确定性选项集复核，前端结论不被信任。

## 修订流程

1. 改 `content_sources/english-data.js` 的 ENGLISH_PHRASES（或单元/词卡）
2. 重跑生成脚本，核对输出统计（597 / core 141 / misc=0）
3. `manage.py test phrases` + 打开 `/phrases/` 目检双视图与练习
4. 学习记录、总览卡与游客清理不依赖本文件内容，无需额外操作
