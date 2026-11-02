# 南非教材与算术事实退役（2026-11-02）

用户明确要求删除南非CAPS教材、算术事实及相应数据。本轮已完成新增正式迁移、项目内专属资产清理、导入范围收缩和前台移除；元素119条完整保留，前台118条。没有提交、推送、部署或修改兄弟references原ZIP。

## 当前范围

资料探索只保留七类：汉英词头、英语读音、汉字与笔顺、古诗文、国家地区、元素、HYG星表。日常8个Dataset全部ready，6个ArchivePackage、205个SourceFile，项目私有资产也正好205个文件／146759739字节。ImportRun现有2条：原九包历史回执原样保留，新的六包scope另有回执；历史计数不冒充当前范围。

`science`当前只有Element模型、元素导入和两条元素路由。元素就绪独立检查periodic-elements，不依赖已删除的science-caps4。`arithmetic`仅留AppConfig／历史迁移stub，不含运行模型、页面、导入或测试旧玩法。没有新增通用内容架构。

## 删除清单

|原业务表|删除行数|
|---|---:|
|arithmetic_arithmeticfact|543|
|science_sciencebook|1|
|science_sciencedocument|5|
|science_sciencesection|120|
|science_scienceimage|358|
|science_scienceactivity|174|
|science_sciencequestion|327|
|science_restrictedscience|615|
|合计|2143|

上述8表均由新增Django迁移删除，不修改既有迁移：arithmetic.0002、science.0003，随后reference_library.0002删除science-caps4／arithmetic两个Dataset、三份03 ArchivePackage及其66个SourceFile、02a/math_seed下7个SourceFile。专用8个ContentType及29个Permission移除，其他权限与contenttypes逐行保持。旧ImportRun不修改。

文件清单冻结于`reference_library/retirement_manifest.json`，425个文件共124196663字节，逐项与独立基线一致。包括三个03分包私有目录的66文件、02a/math_seed下7文件、原始EPUB及351个独立图像文件。358张图记录存在摘要复用，不能将记录数当作物理文件数。

精确清理只覆盖五个根：三个03包目录、`packages/02a_geography_english_elements_math_2026-11-02/math_seed`、`science/48f0d1027ea9e12abceb1aeca17372c9ddd7357c35e23f0d8c001a0a7901322a`。不泛删science根目录，不清理未来其他科学资产，不修改混合02a其余文件。

## 操作与恢复点

本阶段新恢复点位于`Study/output/reference-library-removal/`：

- `before-removal.sqlite3`：删除前完整数据库，0600；旧恢复点保留。
- `retired-assets-before-removal.tar.gz`：425个目标文件的恢复副本，0600。
- `pre-removal-assets-preview.json`、`daily-cleanup-preview.json`：逐路径预演及冻结清单摘要。

先副本迁移及清理／重跑验证，再停止旧8012，日常执行迁移、清理预演、实际清理、重复清理、六包重跑和摘要核验。文件清理不在数据迁移中执行，失败不会使迁移依赖文件系统，可核实后重跑。

```sh
.venv/bin/python manage.py migrate
.venv/bin/python manage.py cleanup_retired_references --dry-run
.venv/bin/python manage.py cleanup_retired_references --apply
.venv/bin/python manage.py import_reference_library --dry-run
.venv/bin/python manage.py import_reference_library
```

清理命令默认只预演；实际删除前必须全部文件通过路径、类型、无符号链接、大小及SHA检查，未知文件／目录或内容漂移会整次拒绝，不递归扫除用户新文件。应用删除前还检查退役表和登记已清除。重复执行为0删除；导入后再次清理仍425项已缺失、0复活。

恢复点属于退役前历史，包含当时资料；恢复需要单独核实后续业务变化。不能直接用旧整库覆盖后续用户数据。迁移中的数据删除不可逆，恢复依赖保留的恢复点；本轮未执行恢复。

## 导入不会恢复退役内容

`reference_library.scope`显式限定四个01包及02a／02b，共六包。三个03输入ZIP可完全不在输入目录，导入仍成功。02a外包整体SHA和所有成员CRC／SHA仍核验；math_seed成员核验后不存储、不登记、不导入。原九包冻结审计清单作为历史不改写。

科学EPUB拼接、XML解析、学生／教师投影、图片提取和私有下载代码已删除，science.import_data只读取元素原始119条与有效118条投影。已有119行和Dataset只读逐字段检查，匹配返回unchanged，不覆盖原字段；缺行、孤立记录或漂移会拒绝。长英文释义原文及既有中文短名覆盖仍保留。

## 验证与保护

证据目录：`Study/output/reference-library-removal/`；主控独立证据：`Study/output/primary-system-audit/2026-11-02/reference-removal-control/`。

- 删除前新数据库／目标资产备份完成；精确425文件清单与主控基线全一致。
- 真实副本完成三项新迁移、425文件清理、重复清理0、已有资料预演／重跑；六包独立输入目录重跑成功，不要求03科学ZIP。
- 副本54张保留表2517153行摘要、全部205保留文件和9个原ZIP摘要一致；8退役表、8专用contenttypes及29权限均移除。空库全迁移成功，只存在元素表，不再有退役表／contenttypes。
- 完整SQLite回归228项通过（12项条件跳过）；退役／元素定向11项通过，PostgreSQL18.6同11项全部通过。check、迁移一致性及最终无待迁移通过。新增／重写Python文件已格式化，无新运行依赖。
- Playwright 1440／390px七类列表与氢详情均200、无页面溢出、无脚本错误；汇总精确7卡片。算术及原科学首页／教材／章节／图片／教师／原文／EPUB九条旧URL均404。氢密度及中文元素名仍展示，119号原始异常条目不公开。
- 日常清理425文件／124196663字节，重复0；六包导入28.349秒，所有保留数据集unchanged／created0。剩8ready Dataset／6包／205源文件／2历史及当前回执，元素119／公开118。

### 并行接龙变化（未触碰）

副本54表全部不变；日常基线核验发现只有chain_gameround存在独立变化：原2行变6行，1条原行的revision/status/updated_at/finished_at变化，新增4行在2026-11-02 15:45:40—15:45:45（Asia/Shanghai）。这些发生在15:51日常退役迁移之前；本轮完整测试于15:47:22启动并使用独立测试库，浏览器于15:49:21首次打开，未访问chain路由。旧服务未单独持久化日志，无法确认操作者，不能擅自归因用户。未删除／回滚这些记录；保留该并行变更。其余53张受保护表逐项一致，全部保留资产及9原ZIP均一致，SQLite完整性ok。详见`concurrent-chain-change.json`和`chain-origin-review.json`；未将保护核验的这一差异隐藏为全表通过。

日常8012保留，当前PID见证据目录`runserver.pid`；本轮测试库、六包测试输入软链接、临时资产副本、8013及浏览器在验收后清理。保留恢复点、清单和所有报告。
