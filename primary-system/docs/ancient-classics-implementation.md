# 古文经典数据接入实施（2026-11-06）

hanzhaodeng/chinese-ancient-text 62 册简体古籍接入 `poetry` 浏览管线，独立数据集
`ancient-classics`，与既有诗词语料（`poetry` 数据集，180 文档／147,352 正文）共享
PoetryDocument／PoetryText 表但来源版本互不覆盖。本文记录来源、契约与维护方式。

## 来源与许可

- 上游：https://github.com/hanzhaodeng/chinese-ancient-text，钉定 commit
  `01a1183cd9bbc243bb156967043c32b6685c0d2f`（2020-08 后上游未再变更）。
- 正文简体原生，不做繁简转换；原典公版，仓库未声明 license，包内
  `docs/资源来源与许可索引.json` 记「原典公版+转录来源」；书名篇名来自上游
  原文，未逐字校勘。
- 资料包 `references/01e_ancient_classics_2026-11-06.zip`（与其他固定来源 ZIP
  同待遇进 Git，跨机同步随仓库分发），登记于 `docs/reference-manifest-2026-11-02.json`
  （archive_count 11）与 `reference_library/scope.py`（SCOPE
  `reference-library-20261106-ancient-classics`，激活七包）。

## 打包与导入

- 打包：`make ancient-text`（`scripts/build_ancient_text_package.py`）。62 册的
  collection 归类与 canonical 树规范化在 `poetry/ancient_sources.py`（打包脚本、
  测试、导入守卫三方共用）：`{name, description, articles}` 重塑为
  `{title: 书名, description, content: [{title: 篇名, content: [句,…]}]}`，
  单篇册或篇名与书名同名时以书名为题。`--source` 可传本地浅克隆
  （HEAD 校验等于钉定 commit）替代逐册网络抓取。
- 包内 layout：`ancient_text/poetry/simplified/<collection>/<书名>.json`，
  标记文件 `ancient_text/source_selection.json`。
- 导入：`poetry/ancient_importing.py`，dataset code `ancient-classics`，
  `VERSION = <上游commit>+native`，计数守卫 62 文档／5,258 正文。只建
  documents 与 texts（与既有简体层同约定，不建 PoetryNode）。
- 九个 collection（全新命名，不与 全唐诗/宋词/诗经/楚辞/蒙学 重叠——详情页
  双层配对按 collection+locator 匹配，重名会串册）：蒙学读物 5、儒家经典 13、
  史书典籍 9、诸子百家 8、兵法谋略 12、笔记杂谈 8、科技博物 3、医学典籍 2、
  佛典经文 2。

## 存储与页面约定

- `source_data` 剔除与 paragraphs 重复的 `content` 键，避免正文三份冗余
  （paragraphs/body/source_data）；详情页 metadata 展示本就剔除这些键。
- 页面零改动生效：古诗文索引 collection 下拉动态生成，layer 默认 simplified；
  详情页无繁简配对即不渲染切换链接（如实降级）。
- 飞花令（`feihualing_index.py` 的 collection 范围）、题材分类
  （`themes.json`）、诗词地图（`map.py`）均不收古文经典。
- 与既有诗词导入器共享表：双方行数／逐行指纹守卫均按
  `PoetryDocument.version` 圈定（`poetry/importing.py` 已同步改为 version
  过滤），互不干扰；`lexicon/reference_importing.locate` 的固定输入唯一性
  按当前激活包范围判定，历史退役包解压残留不参与计数。

## 规模与基线

62 文档、5,258 篇正文、约 1,225 万字；基础包 76 分片、2,596,608 行、约
249.15 MiB（旧 64 分片／2,591,219 行／152.27 MiB）。变化仅落在 poetry 两表
与 reference_library 四表（+1 包、+1 数据集、+1 导入回执、+66 源文件）。
重新生成资料包不会改变既有主键；更新语料需 bump VERSION 并重导基线。
