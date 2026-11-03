# 音标数据维护说明

`phonemes.json` 是英语音标专题的静态课程数据：44 个音素的编排、发音要领与例词标注。
应用本身只读（无模型、无迁移），页面渲染时逐例词回查词库，数据漂移会显示「待核对」而不是错音。

## 结构

- `schema_version`：当前 `1`；改结构必须升版本并同步 `phonetics/catalog.py` 的校验。
- `source_code`：固定 `primary-phonetics`。
- `groups`：5 个分组（单元音·短 / 单元音·长 / 双元音 / 辅音·清浊成对 / 辅音·其他），`phonemes[].group` 必须引用这里的 `code`。
- `phonemes`：44 条，`id` 形如 `01-i`（序号 + 拼写提示 slug），`symbol` 为 `/.../` 包裹的英式 DJ 音标。

## 例词约定

- 例词优先取自词库当前生效的教学来源（`primary-words` 场景单词 577 词 + `primary-english` 教材词 306 词），运行时按「词头 + 音标完全一致」解析；解析通过的例词显示词库读音与来源，解析不到的标记 `extended: true`，渲染为「拓展例词」，点读但标注待核对。
- 目前仅 `/ʒ/` 与 `/ʊə/` 两卡使用拓展例词（词库池中没有真实含 ʒ / ʊə 的教学词），后续词库扩充后应替换为已核对例词。
- `zh` 与 `emoji` 是教学标注，留在本数据里维护；读音永远以词库当前生效版本为准，不要把音标「修」进本文件来绕开待核对状态。

## 修订流程

1. 改 `phonemes.json`（升 `schema_version` 如涉及结构）。
2. 跑 `manage.py test phonetics`：数据契约、44 音素完整性、例词回查全部通过。
3. 打开 `/phonetics/` 目检新增或改动的卡片。

## 音素原声

`static/phonetics/audio/<id>.m4a` 是 44 个音素的预生成原声（页面点大音标或喇叭播放，
缺失时前端回退为浏览器发音人读关键例词）。由 [scripts/generate_phoneme_audio.py](../../scripts/generate_phoneme_audio.py)
用 espeak-ng 英式音素表合成、afconvert 转 m4a；重新生成只在该开发机执行
`brew install espeak-ng && python3 scripts/generate_phoneme_audio.py`，运行时不依赖 espeak-ng。
修改音素 id 或增删音素后必须重跑生成并一起提交。
