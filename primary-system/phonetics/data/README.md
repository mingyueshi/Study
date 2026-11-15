# 音标数据维护说明

`phonemes.json` 是英语音标专题的静态课程数据：44 个音素的编排、发音要领与例词标注。
应用本身只读（无模型、无迁移），页面渲染时逐例词回查词库，数据漂移会显示「待核对」而不是错音。

`theory.json` 是首页「发音基础」的六节短课。每节含讲解、例词和听说练习，`phoneme_ids` 引用 `phonemes.json` 的稳定编号，复用相应音素原声。例词展示英式音标，点读跟随平台的发音设置。新增或调整短课时同步检查例词音标、练习和 `sources` 中的出处，再运行 `manage.py test phonetics`。

`practice.json` 编排 8 组易混音对比与 12 道理论题。`phonetics/practice.py` 校验版本、稳定编号、音素和理论课引用、选项与答案，再由每组两个音生成 16 道听辨题，共 28 题。对比卡复用音标卡的例词解析和音频，不另建一套词库。对比组含 `id`、`title`、两个 `phoneme_ids`、`focus` 和 `practice`；理论题含 `id`、`lesson_id`、`prompt`、带编号的 `choices`、`answer_id` 与 `explanation`。新增字段先补结构校验和测试。

自测每轮随机最多 8 题、不重复，选项也打乱，按稳定编号判分。听辨必须完整播放一次音素音频后才能作答，失败时提示重试，不用例词代读。普通音标卡仍可回退到例词点读。单词、音素、连读和导航切换会停止上一个播放，避免声音重叠。跟读复用 `tts.js` 的间隔、次数和暂停逻辑。

练习结果存在 `phonetics_practice_v1:user-<账号编号>` 或 `phonetics_practice_v1:guest` 的浏览器存储中，不写服务端学习记录，也不跨设备同步。访客共用访客记录。每题只按本轮首次选择计分，练对移出待巩固，练错重新加入；刷新重开一轮，已答结果保留。损坏或过期记录会过滤，存储不可用时仅维持本页状态。题意改变时使用新题目编号，避免旧成绩混用。

入口为 `/phonetics/#group-contrasts` 与 `/phonetics/#group-practice`。对比卡深链接为 `#contrast-<id>`，音标和理论旧链接继续可用。无 JavaScript 时可以完整阅读知识与对比卡，自测显示启用提示。

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
2. 跑 `.venv/bin/python manage.py test phonetics` 和 `node --test scripts/test_phonetics_practice.cjs`：核对数据引用、音频、例词回查、随机练习、错题迁移和播放取消；`make test-frontend` 包含该前端测试。
3. 打开 `/phonetics/` 目检新增或改动的卡片。

## 音素原声

`static/phonetics/audio/<id>.m4a` 是 44 个音素的预生成原声（页面点大音标或喇叭播放，
缺失时前端回退为浏览器发音人读关键例词）。由 [scripts/generate_phoneme_audio.py](../../scripts/generate_phoneme_audio.py)
用 espeak-ng 英式音素表合成、afconvert 转 m4a；重新生成只在该开发机执行
`brew install espeak-ng && python3 scripts/generate_phoneme_audio.py`，运行时不依赖 espeak-ng。
修改音素 id 或增删音素后必须重跑生成并一起提交。
