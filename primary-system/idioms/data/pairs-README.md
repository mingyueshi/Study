# 成语配对数据维护说明

`pairs.json` 是成语近义/反义配对玩法的题库：49 对配对（近义 11 / 反义 38）。
**只读玩法**——判定与计分在页面签名状态里（飞花令同款），刷新重开。

## 结构

- `schema_version`：当前 `1`；改结构必须升版本并同步 `idioms/test_pairs.py`。
- `source_code`：固定 `chinese-xinhua-idioms`。
- `pairs[]`：`{id, headword_a, headword_b, relation: 'near'|'opp'} + 双侧钉词九件套`
  （a_/b_ 前缀的 entry_id / binding_id / sense_id / pronunciation_id / evidence_id /
  source_key / source_version / lexical_hash / editorial_snapshot）。
- 同一成语可出现在多个配对里（如 画蛇添足 同时配 多此一举[近义] 与 画龙点睛[反义]），
  但同局抽取保证词头不相交。

## 配对约定

- 配对关系是**编辑判定**的近义或反义（成语近义有程度差异），页面如实标注。
- emoji 类似：AI 可批量起草新配对，入库前必须逐条核对关系明确、无争议、两侧都在
  词库唯一命中（chinese-xinhua-idioms），并回填钉词九件套。

## 修改流程

1. 新增配对：核对唯一命中 → 回填钉词 → `manage.py test idioms`。
2. `manage.py test idioms`（含 test_pairs.py）：契约 + 钉词校验 + 判定全过。
3. 打开 `/idioms/pairs/` 玩一局目检新题。
