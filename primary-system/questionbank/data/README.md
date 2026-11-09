# 题库批次数据说明

`questionbank/data/questions/` 存放 Git 跟踪的题库批次 JSON。每份文件是一个
「全有或全无」的导入批次，经 `manage.py import_questions` 导入数据库，运行时
只读数据库表。首次初始化导入随项目提供的三个批次，后续默认初始化只读核对回执。

## 当前批次

| 文件 | batch_id | 内容 | 题量 |
|---|---|---|---|
| `2026-11-internal-core.json` | `2026-11-internal-core` | 内部数据规则生成首批 | 150 |
| `2026-11-grammar-quiz.json` | `2026-11-grammar-quiz` | 语法精讲知识点巩固题 | 31 |
| `2026-11-olympiad-intro.json` | `2026-11-olympiad-intro` | 人工撰写的四年级奥数入门（奥数轨） | 30 |

## 生成与导入

批次由转换脚本从 `primary/` 同源数据规则生成（对齐作文坊/场景词的导出模式）：

```sh
node scripts/build_questionbank.cjs          # 生成批次 JSON（确定性，重跑无 diff）
.venv/bin/python manage.py import_questions \
  --input questionbank/data/questions/2026-11-internal-core.json [--dry-run]
```

生成规则（改规则会改变内容指纹，需换 batch_id 重新导入）：

- **数学 `primary-math`**：知识点 `example{q,a,steps}` → 自评题（答案与解题
  步骤随题内嵌供对照）；顶层易错诊所 `{unit,wrong,right}` → 判断题。
- **语文 `primary-chinese`**：课文 `poly` 与顶层 `polyphonic`
  `[字,音1,词1,音2,词2]` → 「给词选读音」选择题（两音确定性轮换）。
- **英语 `primary-english`**：教材同步单词按单元轮转取样（上限 60）→
  词义四选一（干扰项取同册词义池，去词性前缀）。

## 字段与身份

批次顶层：`schema_version:1`、`batch_id`、`generator`、`questions[]`。每题：

| 字段 | 说明 |
|---|---|
| `uuid` | 稳定内容身份 = `uuid5(NAMESPACE_URL, 'primary-system/questionbank/' + source_key + '/' + source_ref)`，导入时重算比对，防止手改来源定位后身份漂移 |
| `type` | 题型：`choice` / `truefalse` / `selfcheck`（见 `questionbank/types.py` 注册表，加新题型只注册不改框架） |
| `area` | `math` / `chinese` / `english` |
| `track` | 轨别：`regular`（普通，缺省值）/ `olympiad`（奥数）。普通题库与奥数挑战两个入口各从本轨抽题；奥数轨题目 `tags` 记主题（速算巧算、鸡兔同笼……），练习页按主题过滤 |
| `grade` | 年级整数，可空 |
| `stem` | 题干（中文标点，不允许英文双引号与裸换行，测试拦截） |
| `payload` | 按题型：choice→`{options[],answer,explanation}`；truefalse→`{answer,explanation}`；selfcheck→`{answer,steps}` |
| `tags` | 知识点标签列表（如「数学·认识更大的数」） |
| `source_key` / `source_ref` | 来源与定位（如 `math:mu1-1:example`），可溯源到原数据 |

## 导入纪律

- 同 `batch_id` 重复导入同内容幂等跳过（回执存 `ImportReceipt`）；
  同 `batch_id` 内容变了直接拒绝——**批次演进必须换新 batch_id**。
- 导入只新增：同 uuid 同内容跳过，同 uuid 不同内容报错中止（保护人工内容），
  从不自动覆盖。
- `--dry-run` 走完整校验后回滚，不落任何行。
- 数据契约测试：`manage.py test questionbank.tests.test_data` 断言批次形状、
  规模下限（math≥55 / chinese≥20 / english≥35、总量≥210，奥数轨≥30 且来源
  全为 `primary-olympiad`、主题≥6）与中文标点。

## 奥数轨与希望杯真题

奥数首批为人工撰写并逐题核对解答（uuid 由 `questionbank.types.question_uuid`
推导，答案下标按确定性轮换分散）。后续批次候选：希望杯官网历届真题 PDF
（四年级 10 份），需转录为结构化题目并单独建 batch，来源标注届次；
CMATH 等外部数据集的调研结论见下节。

## 数据源调研记录（2026-11-07）

首批数据源策略为**内部数据规则转换**（质量可控、贴合教材、零外部依赖）。
外部开放数据集已完成调研，留作后续批次候选：

| 数据集 | 内容 | 规模 | 许可 | 结论 |
|---|---|---|---|---|
| CMATH（小米） | 小学数学应用题，按 1-6 年级分级，带答案与步骤 | ~2.5K | Apache-2.0 | 后续首选；可支撑 `numeric` 数值判分题型 |
| TAL-SCQ5K（好未来） | 数学选择题带解析 | 5K | MIT | 偏竞赛，需按年级过滤后精选 |
| Ape210K（猿辅导） | 小学数学应用题 | 210K | MIT | 量大但表述/难度参差，备选 |
| CMM-Math | 多模态数学题 | 28K | 研究用 | 需图片素材，暂不采用 |
| 语文/英语方向 | 无现成开源题库（经 CLUEDatasetSearch 索引核查） | — | — | 继续走词库/教材数据的规则生成 |

注：HuggingFace 下载在本机网络可能需要 hf-mirror.com 镜像。国家中小学智慧
教育平台无公开 API、习题为 PDF 任务单，不采用。引入外部批次前需完成清洗
规则与适龄过滤，并单独建 batch 与来源 key。
