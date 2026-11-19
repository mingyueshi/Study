# 成语典故馆数据维护说明

`stories.json` 是成语典故馆的编排数据：25 位人物档案 + 30 个有人物故事的成语
典故卡。故事、简明释义和人物档案随编排文件保存。读音和例句取自词库当前生效记录
（chinese-xinhua-idioms），由 `idioms/catalog.py::matches_pin` 逐条校验。漂移的卡片
显示「待核对」。专题只读浏览，朗读使用设备语音。

`/idioms/stories/` 的可折叠侧栏提供搜索、分类和目录。使用 `?book=` 按典籍筛选，
使用 `?figure=` 查看人物线索，`?q=` 在当前范围内搜索，`#story-<id>` 直达典故。
搜到同名成语时优先显示该篇。关闭脚本后，筛选、搜索和原锚点仍可使用。

## 结构

- `schema_version`：当前 `1`；改结构必须升版本并同步 `idioms/test_stories.py`。
- `source_code`：固定 `chinese-xinhua-idioms`。
- `figures[]`：`{id, name, era, role, emoji, blurb}`。
- `stories[]`：`{id, headword, figure_ids[], source_book, source_chapter, quote,
  story, meaning, clue, featured(可选)} + 词库钉词字段（binding_id / entry_id /
  sense_id / pronunciation_id / evidence_id / source_key / source_version /
  lexical_hash / editorial_snapshot）`，结构与 `scenarios.json` 的钉词一致。
- `source_book` 是**编辑归组**（从语料 derivation 规范化）：同一本典籍的卡片在
  典籍筛选里聚在一起；`source_chapter` 保留语料里的具体篇名。

## 修改流程

1. 新增故事前先在词库核对 headword 唯一且 `derivation` 非空（`manage.py shell`
   查 `active_records()`）；故事复述与 clue 是编辑内容，其余以词典为准。
2. 钉词字段从维护库回填（binding_id 等九项，与 scenarios.json 同规），缺一不可。
3. `manage.py test idioms`（含 test_stories.py）：契约 + 钉词校验 + 页面全过。
4. 打开 `/idioms/stories/` 目检新卡。

## 语料原文瑕疵说明

语料 derivation 存在上游错字与标点问题（如「勾路」应为「勾践」、「草森」应为
「草木」、未闭合的引号），卡片上的出处原句按语料原样展示、不做改动；孩子读的
「故事」复述是编辑内容，不受影响。
