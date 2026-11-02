# 本地开发与数据准备

所有命令在 `primary-system/` 执行。服务只监听本机 `127.0.0.1`，项目不自动读取 `.env`。

## 已有数据库

结构升级前先用 SQLite backup API 备份 `db.sqlite3`；不要在数据库正在写入时只复制主文件。2026-11-02 的专题退出升级会清理旧专题阅读数据，教材内容 UUID、教材单元／编排及其学习记录保持不变，词库和独立玩法保持。

```sh
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_platform
.venv/bin/python manage.py seed_lexicon_roles
PRIMARY_DEBUG=1 .venv/bin/python manage.py runserver 127.0.0.1:8012
```

前台：<http://127.0.0.1:8012/>；场景单词：<http://127.0.0.1:8012/words/>；接龙：<http://127.0.0.1:8012/chain/>；词典：<http://127.0.0.1:8012/dictionary/>；后台：<http://127.0.0.1:8012/admin/>。

不创建默认账号。需要管理账号时运行 `.venv/bin/python manage.py createsuperuser`；学习账号由管理员创建。管理账号从后台登录，普通登录页只用于学习账号。

## 从空库初始化

```sh
python3.12 bootstrap.py
```

脚本安装依赖、迁移、建立权限组，导入 4 本教材册及教材英语关联，并暂存场景英语来源。`--skip-install` 跳过安装；`--skip-content` 仅建空基座；`--serve` 完成后启动。

验证空库安装可指定另一数据库：

```sh
python3.12 bootstrap.py --skip-install --database ../output/primary-fresh.sqlite3
PRIMARY_SQLITE_PATH=../output/primary-fresh.sqlite3 PRIMARY_DEBUG=1 \
  .venv/bin/python manage.py runserver 127.0.0.1:8013
```

指定路径后，后续管理命令和启动命令必须传同一个 `PRIMARY_SQLITE_PATH`。脚本不会根据该参数另建虚拟环境。资料导出只在初始化／更新时依赖兄弟目录 `primary/` 和 Node，运行服务不依赖它们。

## 内部词库与场景单词

初始化暂存词库，不自动替维护者切换现有生效版本。后台“来源版本与导入任务”可查看版本 UUID。核对新增版本后，用当前生效 UUID（首次为 `none`）运行：

```sh
.venv/bin/python manage.py activate_lexicon RELEASE_UUID \
  --expected-current CURRENT_UUID_OR_none --reason '家庭教学：核对本次来源及导入范围后启用'
.venv/bin/python manage.py review_primary_readings
.venv/bin/python manage.py import_scenarios --input data/words-scenario.json
```

教材英语与场景英语分别使用 `primary-english`、`primary-words` 来源。场景来源应选择 `scenario-` 开头的全量版本，导入应为 46 场景、577 词位、0 个未匹配。启用内部来源不会自动改变词典的展示范围。

更新场景源：

```sh
node scripts/export_words_scenario.cjs
.venv/bin/python manage.py import_lexicon --adapter words-data --input data/words-scenario.json
```

接龙从已启用的成语来源建池：`.venv/bin/python manage.py seed_chain_pool`。空词池会显示暂不可用页面。词典初始数据与来源操作见 [词库维护](lexicon-operations.md) 和 [首批词典](public-dictionaries.md)。

## 场景目标升级与维护

本阶段新增 `words.0003_learningtarget_alter_scenarioword_options_and_more` 和 `0004_learningtarget_editorial_snapshot`，不修改旧 words 迁移。先在日常库副本运行 migrate 与逐行校验，通过后停止本项目服务、用 SQLite backup 保存新恢复点，再升级日常库。不要覆盖上一阶段备份，也不要删词位重导代替迁移。`scripts/verify_words_upgrade.py` 可在升级前保存原字段逐行 SHA256 和 backup，升级后用 `--verify` 生成映射／保护报告；报告和备份放在已忽略的 output，权限与访问同数据库管理。

```sh
.venv/bin/python manage.py import_scenarios --input data/words-scenario.json --dry-run
```

预演执行完整选择与校验后回滚，报告应为 577 preserved、0 歧义／冲突。正式导入移除 `--dry-run`。已有场景名称、顺序、词位标注始终保留；后台维护人工修改，重导不覆盖，也不删除缺失词位。新增场景可复用同一目标；输入词位支持 `target_id`，或显式 `evidence_id`。多个义项不能省略选择；同形不同义可在同一场景并存。报告的 issues 必须核对，命令不会随机选义或自动换绑旧词卡。

后台“词卡学习目标”可创建明确义项／读音／证据的目标；已有目标身份只读，变义必须新建目标，并显式增加或更换编排，原目标与进度仍保留。“场景单词”可新增／删除编排、重排与改教学标注。原 entry 是历史字段，新增编排从目标派生它；释义始终按目标读取。进度按词卡统计；用户／游客分开，默认不合并。旧页面写入会收到409升级提示；其他标签页先保存后，本页过期写入也返回409。

来源停用、变义或删词不删除目标、证据、学习记录；API 显示待复核并隐藏对应释义／音标。回退原语义后可恢复；人工修订变化也暂停显示并待复核；目标保留选用时修订值及 revision，明确新建并选用目标后才展示新版，旧进度不迁移。详细模型与边界见 [场景学习对象](scenario-learning.md)。当前本地恢复点、服务 PID 与验证结果见 [实施报告](scenario-learning-implementation.md)。

## 回归检查

```sh
.venv/bin/python manage.py test --noinput
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check --dry-run
node --test scripts/test_frontend.cjs
```

SQLite 会跳过 PostgreSQL 专用并发用例；结构调整还需在独立 PostgreSQL 测试库运行。浏览器检查至少覆盖查词、教材阅读与图示、学习记录保存、单词连读／掌握、接龙提示与出招，以及 390px 手机宽度。语音队列的自动检查不能代替真实设备听音。


## 中文义项版本与教材保护（2026-11-02）

新增lexicon.0004/0005、words.0005/0006和learning.0002；先backup及副本验证，再升级日常库。日常本阶段恢复点在`../output/primary-system-audit/2026-11-02/chinese/before-chinese.sqlite3`，不能覆盖之前的恢复点。旧进度的新呈现字段保持null，教材初始选择历史只说明迁移时冻结，不是补造历史审读。

中文创建、确认、采用和撤回使用`manage.py chinese_sense`，后台只读检查正文、核对和采用历史。先inspect固定证据及快照，JSON写入须提供所见expected_snapshot/review revision/采用revision；dry-run完整预演后回滚。源修订或版本状态变化时重新读取，不能自动补最新版。详细JSON字段和new-target/new-link工作流见 [实施报告](chinese-sense-implementation.md)。

场景API为schema3，提交所见chinese_version_id及presentation_revision，legacy明确使用null/0。教材有关联时GET进度提供presentation，POST还须显式update_learning。页面只改笔记／收藏时不勾选“明确更新学习状态”；原状态及原依据保留。历史掌握待确认会在详情、个人页和首页统计中一致处理。同一内容的所有参与确认词义均显示；普通正文不被强制改成词卡。

本阶段日常只创建306条继承选择历史，没有创建中文审校样例或验收账号。后续按明确范围逐项核对采用，不将既有中文视作已通过新流程。撤回保留正文但不下发；失效时关联卡的memo、分段提示及分段发音暂停，原标注不删除。主控资料规划与独立验收由主控维护。

## 首批39条来源中文采用（2026-11-02）

日常已按主控锁定digest执行cn-foundation-20261102-01：26目标＋13教材关联，中文逐字复用来源并经AI核对；不是全577／306完成审校。先只读`inventory_chinese --output 新文件.json`清点，固定候选审核后才运行`import_chinese_batch`。正式导入必须传`--expected-digest`与匹配reviewer；`--dry-run`执行完整预检并回滚。回执持久化，完整重跑no-op，任何对象／源／版本／人工采用漂移均整批拒绝。不能凭稳定来源键静默换UUID，跨环境先重新映射审核。详细命令、恢复点与剩余缺口见[chinese-batch-01-implementation.md](chinese-batch-01-implementation.md)。


## 当前六包资料库（2026-11-02退役后）

日常库保留8个就绪数据集，入口`/references/`现在收敛为五张卡片：查字查词、古诗文、国家地区、元素、HYG星表。字词工具在`/dictionary/`同页查询正式词义、汉英参考、英语读音、汉字属性和笔顺，分别显示来源与版本。南非CAPS教材及算术事实的运行模型／数据／页面已删除，arithmetic应用仅保留历史迁移stub供旧库和空库升级。

已有库升级先建立新的数据库及目标资产恢复点，再执行正式退役迁移；文件删除与数据库迁移分开，可精确预演并重跑：

```sh
.venv/bin/python manage.py migrate
.venv/bin/python manage.py cleanup_retired_references --dry-run
.venv/bin/python manage.py cleanup_retired_references --apply
.venv/bin/python manage.py import_reference_library --dry-run
.venv/bin/python manage.py import_reference_library
```

导入默认读取父目录`references/`中的当前六ZIP，也可传`--input-root`。三份03科学分包不再要求存在；混合02a包仍完整校验外包SHA／全部成员CRC及SHA，跳过存储和登记math_seed下7个文件，不改原ZIP。只登记6包／205个文件。预演使用临时解压scratch并删除，不写DB或项目资产；运行只依赖DB和项目`.reference-assets`。

`PRIMARY_REFERENCE_ROOT`可指定私有存储目录。清理命令只删除冻结清单中的425个匹配摘要文件，锁定三个03包目录、02a/math_seed及特定教材哈希目录；未知文件、路径越界、符号链接或摘要漂移会在删除前拒绝。不能扩大为泛删science根目录，未来其他科学资产应保留。文件清理失败不回滚数据库迁移，核实后可重试；导入不会恢复这两类数据或文件。

元素119条完整保留（公开118），只依赖periodic-elements就绪；重跑逐字段检查且不覆盖既有值。新的恢复点、准确范围和验证结果见[退役实施报告](reference-library-removal-implementation.md)及[独立验收](reference-library-removal-acceptance.md)。原九包导入回执与历史验收保留为历史，不能用来表示当前范围。
