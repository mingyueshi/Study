# 词以类聚数据维护说明

`tree.json` 是「词以类聚」的静态树：用 WordNet 上下位关系（hypernym）把场景单词挂
成 10 棵枝干树。**只读专题**——没有模型、没有学习记录；掌握仍走 /words/ 场景页。

## 来源与生成

- 语料：`data/lexicon/english-wordnet-2025.xml.gz`（Open English Wordnet 2025，
  CC-BY-4.0，sha256 见 `lexicon/sources/registry.json`）。
- 生成：`make word-tree`（即 `.venv/bin/python scripts/build_word_tree.py`）。
  流式解析 WN-LMF，从 12 条根枝干（动物/食物/水果/蔬菜/植物/交通工具/衣物/工具/
  家具/乐器/建筑/容器）向下走 hypernym，深度 ≤3，更深的场景词上浮到边界节点。
- 剪枝：只保留枝干（子树内有场景词命中）或含场景词的叶；酒类枝干整体剪除；
  无词单链的分类学中间层自动坍缩。

## 中文标注

枝干节点中文写在 `zh-editorial.json`（按 synset id），生成时缺失项会自动补进
档案（`zh` 留空），人工填写后重跑生成即可生效；未填写的节点显示英文词形。
叶词的中文/音标/emoji 在运行时从场景单词（ScenarioWord）按词头连接取得——
不在树数据里维护，遵循「不同义项不自动对齐」的仓库纪律。

## 修改流程

1. 调根枝干/深度/排除词：改 `scripts/build_word_tree.py` 的 ROOTS/MAX_DEPTH/
   EXCLUDE_LEMMAS/PRUNE_SYNSETS，重跑生成。
2. 补枝干中文：改 `zh-editorial.json` 对应 id 的 `zh`，重跑生成。
3. `manage.py test words`（含 test_tree.py）：契约 + 页面全过。
4. 打开 `/words/tree/` 目检树结构与词卡。
