# 首批公开词库与统一查词页

核对日期：2026-10-30。这里的“公开”指本地应用已允许匿名读取已审范围；本轮没有部署网站、开放远程服务或提供整库下载。

## 来源选择

| 来源 | 本期选择 | 依据与边界 |
|---|---|---|
| Unicode Unihan 18.0.0 | 接入 IICore 的 9,810 个汉字，附同版 CJKRadicals 部首映射 | 官方 [UAX #38](https://www.unicode.org/reports/tr38/tr38-41.html)、[固定版本目录](https://www.unicode.org/Public/18.0.0/ucd/)、[Unicode License v3](https://www.unicode.org/license.txt)。保留署名及许可原文。IICore 是通用字集，不是小学年级表。 |
| Open English Wordnet 2025 | 接入现有教材词形范围的英英资料 | 官方 [2025-edition 发布](https://github.com/globalwordnet/english-wordnet/releases/tag/2025-edition)、[数据下载](https://en-word.net/downloads)、[版本许可](https://github.com/globalwordnet/english-wordnet/blob/2025-edition/LICENSE.md)。CC BY 4.0，并保留 Princeton WordNet 原始数据许可及双重署名。 |
| Wiktionary | 后续候选 | [版权说明](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)明确开放许可，但需要单独落实版本提取、页面署名、共享要求及词义结构解析。本期不混入其释义。 |
| ECDICT / chinese-xinhua | 暂不批准公开词典原文 | [ECDICT 项目说明](https://github.com/skywind3000/ECDICT)和仓库现有成语来源记录仍不足以逐项确定本项目所需第三方释义的使用依据。本期未因仓库的代码许可而批量批准其内容。 |

这次筛选针对来源使用依据和可维护性，不声称完成逐条语言权威性或儿童适宜性审校。数据作为标明来源的词典参考；中文教学讲解保持独立。

## 实际收录与缺失

- 汉字：9,810 个字形条目；其中 215 条没有英文简释，55 条没有 `kMandarin` 常用音。属性完整性不推导为释义完整性。
- 英文：固定选择清单有 536 个原词形，实际匹配 499 个；导入 861 个上游词条（含不同词性）和 3,700 个独立义项。37 个未匹配词形保留在报告，不用猜测词形还原或生成解释补齐。
- 英文 2,411 个义项没有当前可独立展示的音标；同一词条的多个义项可能引用同一上游音标，所以这个数字不是缺音标的词头数。
- 本地共 10,671 个可查词条、13,510 条公开来源记录。原来的 31,763 条来源记录、868 处教学关联保持不变；其他四个来源仍未获得词典公开准入。

英文范围文件为 [`primary-english-scope-v1.json`](../lexicon/sources/primary-english-scope-v1.json)：来自教材和场景卡片，额外明确列入少量查询示例。只采用上游明确给出的词形关系，不因为小写、相似拼写或中文短释一致就合并义项。

Unihan 的 `kMandarin` 是用于特定字音场景的常用音，官方说明明确它不一定包含词典全部读法；有两个值时分别保留 CN/TW 顺序。比如查“行”不能因为首批只显示 `xíng` 就推断没有 `háng`。部首取 CJKRadicals 的对应字形，笔画的多个来源值原样保留。英文简释没有自动翻译成中文。

## 固定版本与下载

所有路径以 `primary-system/` 为当前目录。登记表 [`registry.json`](../lexicon/sources/registry.json) 固定网址、版本、SHA256、署名、许可、加工说明与许可文件名。下载到被 Git 忽略的 `data/lexicon/`，不会随服务启动自动联网。

```sh
.venv/bin/python manage.py migrate
.venv/bin/python manage.py fetch_lexicon unihan
.venv/bin/python manage.py fetch_lexicon oewn
.venv/bin/python manage.py import_lexicon --adapter unihan \
  --input data/lexicon/unihan-18.0.0.zip --dry-run
.venv/bin/python manage.py import_lexicon --adapter oewn \
  --input data/lexicon/english-wordnet-2025.xml.gz \
  --selection lexicon/sources/primary-english-scope-v1.json --dry-run
```

下载会检查已有文件、下载上限和完整摘要；不覆盖不匹配的文件。Unihan 下载同时取得配套部首表。移除 `--dry-run` 才写入暂存区，可加 `--report <报告路径>`。网络超时可以重试下载；摘要不匹配应核对上游版本，不能直接接受新字节。

| 文件 | SHA256 |
|---|---|
| Unihan 18.0.0 ZIP | `4c93ea9c1f636451729a840978f1667a53886af37ba854fdcce109721c63d43e` |
| CJKRadicals 18.0.0 | `689e2e5852699e7115823dc0b6d3e615eb767c7f477b615678f4f989d1f06105` |
| OEWN 2025 XML GZIP | `9ca6d1dcb75f822fdd66617f7d9da48142ace38dd544d6ad5e2feca1674ad3fe` |

许可原文随源码保存在 [`lexicon/notices/`](../lexicon/notices/)；`index.json` 按数据文件摘要对应许可文件及其摘要。更新登记表时保留旧索引和原文，旧版本与回退后的页面仍显示自己的署名和许可，不读取最新版覆盖旧信息。公开页面提供完整文本。OEWN 文本包括 CC BY 4.0，以及独立的 Princeton WordNet 许可文件。适配器保留英文定义与例句，结构提取、字段拼接和范围筛选在加工说明中明确标注。

## 发布、更新和替换

导入只暂存。检查报告、范围与抽样原文后，受信任维护者可执行：

```sh
.venv/bin/python manage.py publish_lexicon RELEASE_UUID \
  --expected-checksum MANIFEST_SHA256 --expected-current none \
  --reason '填写已核对的来源、数据范围、字段映射和审查结论'
```

`MANIFEST_SHA256` 是后台来源版本中的“输入 SHA256”，与上表的原文件摘要不同。首次启用填 `none`，后续填刚核对的当前生效版本 UUID。该命令只接受与登记表一致的开放来源及文件，不可用于批准旧成语快照或任意 JSON 来源；来源准入、原文审查记录和版本切换在一个事务中完成。失败回滚。已有人工修订仍需单独审查，不被批量发布。

这次的本地版本：

| 来源 | 版本 | 清单 SHA256 |
|---|---|---|
| unicode-unihan | `18.0.0-iicore-v1` | `b9485644b5add504da6c5e0d8f41d1f7c32eb03f165a9f2d543a3423460b99f0` |
| open-english-wordnet | `2025-scope-c4d256e93d1d110d` | `a064117b50eb4f20817aac6668b5e418959ee2131e7e4ff948c671dfccb65f32` |

同一来源升级时：

1. 核对官方新版本、许可、下载字节和结构，再更新登记表及许可归档索引；将旧快照继续保留在备份／归档中，不覆盖旧许可文件。只改文件、不改登记的导入会被拒绝；缺少对应许可原文的版本不能通过发布命令。
2. 导入新完整版本；词形范围变化也产生新的版本。来源键稳定时保留义项 UUID；Wordnet 词条组键保留一个词头下的多个独立义项。
3. 后台核对新增／变化／缺失与教学关联影响，再显式启用。新许可与当前已公开准入依据不同，普通版本切换会被拒绝，必须先撤回公开准入并重新核对。
4. 回退使用原有 `activate_lexicon`，只切换来源指针，不覆盖之后的人工修订。若许可发生变化，回退也须先核对对应准入依据。

换供应方时仍使用独立 source code，通过经核对的 `target_sense` 对齐具体义项；没有语义确认的记录只生成候选。新来源的公开权限单独审批。详见 [维护手册的替换流程](lexicon-operations.md#6-版本启用回退与来源替换)。

每个 `SourceRelease` 新增导入时来源／许可快照；`SourceBinding.entry_key` 保存上游词条组身份。Unihan 的码位、原行、文件名和行号，Wordnet 的词条／义项／同义集 ID 与 XML 树投影都保存在原记录中。多段定义依照原顺序分段保留。原文与独立人工值不互相覆盖。

## 页面与读取规则

- `/dictionary/`：汉字、英文、成语范围筛选；词头／词形前缀、拼音和 `U+5B66` 码位查询；精确词形优先，每页 24 个词条。拼音支持 `xue/xué`、`lv/lü/lǜ`。
- `/dictionary/<uuid>/`：独立义项、音标或常用音、部首笔画／简繁关系、原语言释义、来源例句、版本及许可；每页 20 条来源义项。
- `/dictionary/sources/`：当前来源、版本、收录与加工说明、完整许可文本。
- 主导航和现有单词／成语教学卡片提供查词入口。页面下方的教学卡片按字词相关性查找，明确不等同于义项对齐。
- JSON 接口沿用 `/api/v1/lexicon/` 和详情地址，补充公开属性、版本化署名／许可与加工说明。

公开页面和接口共用准入查询，禁止缓存；停用来源或撤回内容审查立即隐藏相关词典记录。读音属性与读音查询同样要求读音审查通过，不能通过属性字段绕过。空结果、缺失释义和缺失读音有独立提示；公开前台不展示后台原始证据对象或内部审查依据。

## 验证与下一步

详细结果见 [VALIDATION.md](../VALIDATION.md)。本地更新前备份及真实导入／复跑报告保存在仓库 `output/lexicon-public-validation/`。

后续继续补足未匹配教材词形、可靠的中文释义与多音字、地区读音、儿童教学审校及音频。全量 Wordnet、多语言自动翻译、学习能力进度和接龙仍未在本期开放。
