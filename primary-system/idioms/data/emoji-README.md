# 成语表情猜猜看数据维护说明

`emoji.json` 是表情猜谜的题库：80 个画面感强、孩子熟悉的成语，每个配一组
emoji（AI 辅助生成、人工逐条核对合理性）。**只读玩法**——没有模型、没有学习
记录；判定、计分都在页面签名状态里（飞花令同款），刷新重开。

## 结构

- `schema_version`：当前 `1`；改结构必须升版本并同步 `idioms/test_emoji.py`。
- `source_code`：固定 `chinese-xinhua-idioms`。
- `entries[]`：`{headword, emoji, hint} + 词库钉词九件套`（binding_id / entry_id /
  sense_id / pronunciation_id / evidence_id / source_key / source_version /
  lexical_hash / editorial_snapshot），与 `stories.json` 钉词同规。
- `hint` 是四选一之外的类别提示（动物类/数字类/动作类/表情类/器物类/自然类）。

## emoji 映射约定

- emoji 描述成语的**画面或字面**（画蛇添足 = 🐍🎨🦶），2~4 个，避免成语接龙式的
  谐音梗；语义牵强的宁可不收。
- 映射是编辑内容，允许孩子在「提示学习」中反馈不理解；逐条人工核对后再收。
- AI 可以批量起草新映射，但入库前必须逐条核对（emoji 歧义、文化差异、词库
  是否唯一命中）。

## 修改流程

1. 新增成语：先在词库核对唯一命中，回填钉词九件套（与典故馆同流程）。
2. `manage.py test idioms`（含 test_emoji.py）：契约 + 钉词校验 + 判定全过。
3. 打开 `/idioms/emoji/` 玩一局目检新题。
