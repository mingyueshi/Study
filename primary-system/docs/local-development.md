# 本地开发与数据准备

所有命令在 `primary-system/` 执行。Python 3.12+，服务只监听 `127.0.0.1`，项目不自动读取 `.env`。

## 新机完整运行

```sh
python3.12 bootstrap.py --serve
```

脚本按 `requirements.txt` 准备虚拟环境，校验基础包，迁移空库，离线恢复基础内容与资料文件，导入 5 个题库批次（296 道可练题），建立必要权限组并预建飞花令索引。内容恢复不访问网络，不需要 Node、历史 `output/` 或人工逐个启用词库；首次安装 Python 依赖可能联网。已有依赖可加 `--skip-install`。只有完整校验成功才启动服务，不会在只准备了半份内容时显示“就绪”。

默认数据库为 `db.sqlite3`。不创建默认账号或密码；管理账号需运行 `.venv/bin/python manage.py createsuperuser`。后台登录与普通学习登录分开，学习账号由管理员创建。

- 前台：<http://127.0.0.1:8012/>
- 资料探索：<http://127.0.0.1:8012/references/>
- 查字查词：<http://127.0.0.1:8012/dictionary/>
- 场景单词：<http://127.0.0.1:8012/words/>
- 场景成语：<http://127.0.0.1:8012/idioms/>
- 管理后台：<http://127.0.0.1:8012/admin/>

指定独立数据库验证新机效果：

```sh
python3.12 bootstrap.py --skip-install --database "$PWD/db.baseline.sqlite3" --serve --port 8013
```

后续命令都应使用相同的绝对路径，例如：

```sh
PRIMARY_SQLITE_PATH="$PWD/db.baseline.sqlite3" PRIMARY_DEBUG=1 \
  .venv/bin/python manage.py runserver 127.0.0.1:8013
```

`--skip-content` 只用于创建空结构的开发测试，不是可学习的完整初始化；不能与 `--refresh-data` 组合，也不会用于修改已有数据库。

## 已有数据库

默认运行 `bootstrap.py` 只校验已有数据库、资料文件和题库批次回执，不自动迁移、补写资料或重置数据。内容完全匹配时即使已有账号、学习记录、会话与游戏回合也不改动数据。部分旧初始化只导入教材并暂存少量词库，校验会明确报告差异与修复命令。

已有题库可通过 [题库批次说明](../questionbank/data/README.md) 中的 `import_questions` 命令补题，保留学习记录。

**刷新前先停止目标数据库对应的本地服务**，避免备份后又产生新的学习记录。需要修复没有个人学习历史的旧开发库时：

```sh
python3.12 bootstrap.py --skip-install --refresh-data
```

有独立数据库时同样传 `--database "$PWD/你的库.sqlite3"`。刷新在迁移前使用 SQLite backup API 创建权限 0600、唯一命名的 `.backups/base-data/*.sqlite3` 恢复点；不能只复制可能正在写入的主文件。备份保留，不覆盖上一恢复点。

刷新规则：

- 已与基础包完全一致：不重置，包括已有个人记录的情况。
- 现有基础记录是同 UUID、每个字段都一致的真子集：只补缺失，不改已有引用；可保留个人记录。
- 需要替换旧环境随机 UUID：仅无个人记录且无受保护人工内容／释义／读音修订、额外中文版本／核对／采用历史时允许。旧教材自动初始关联必须与当前固定选择、初始快照和来源证据一致，且按内容来源键与词位位置等价于基线；额外词位或人工改选不能被当成初始化记录。
- 教材进度、词卡掌握、作答、草稿、游戏回合或激励记录任一非空，且需要替换基础身份：拒绝，原库保留，并给出新 `--database` 路径。
- 存在待应用迁移且有以上个人记录：迁移前只读拒绝，避免历史退役迁移先清理记录。请用独立新库运行；需要保留旧专题阅读的库也不要直接迁移。

允许替换时保留账号、权限组、会话与其他非基础表；账号年级按稳定 `code` 对应到基线，无法对应则拒绝。恢复事务内检查外键与逐表摘要，失败回滚。此工具限本地 SQLite，不是生产部署或跨数据库同步工具。

## 基础包范围

`data/baseline/manifest.json` 固定 48 张表的列定义、迁移状态、记录数、文件大小、分片 SHA256、解压内容摘要及总摘要。76 个有序 JSONL gzip 分片共 2,523,907 行；当前总压缩约 249 MiB，最大单文件约 11.09 MiB，每片必须小于 40 MiB。压缩时间戳固定为零，同一源内容重复导出字节一致。

基础包包含：

- 当前学段／年级／学科、4 本数据库教材册（含已下架的语文和数学册）、单元编排、内容及稳定 UUID。
- 六个词库来源、九个版本、来源证据、词条／义项／读音、审核与公开准入、生效指针、教材词义关联、同形候选和审计记录。
- 46 个场景、577 个在用词卡目标及编排，以及中文版本、核对、采用历史和批次回执。全部在用场景词卡及 310 个教材词卡均有已核对的中文采用记录。纠音替换的旧词卡目标保留历史。
- 接龙词池及九个资料数据集的完整领域记录、包／来源文件登记与导入回执。

排除账号、密码、权限与账号关联、会话、验证码、后台操作日志、教材学习记录、词卡掌握和游戏回合；词库审计中的 `actor_id` 置空，业务证据与历史保留。

本目录的 `data/reference-archives/` 保留七个固定 ZIP，完整验证外包及成员后恢复 354 个当前文件到 `.reference-assets/`。三份已退役 03 科学教材 ZIP 已删除；混合 02a 原包保持原字节，`math_seed/` 七个文件只校验、不解压入运行存储。恢复只补资产，不运行会生成新 UUID 的领域导入器。

`data/lexicon/` 跟踪 `unihan-18.0.0.zip`、`CJKRadicals-18.0.0.txt`、`english-wordnet-2025.xml.gz`，许可原文和摘要索引保留在 `lexicon/notices/`。这些来源用于明确的后续维护；日常恢复使用完整基础包，不现场重建已发布状态。

日常数据库、私有数据、密钥、虚拟环境、`.backups/` 和 `.reference-assets/` 缓存不进 Git。

场景成语编排独立保存在 `idioms/data/scenarios.json`，随代码同步；词条、义项和原始词典证据已包含在完整基础包中。它不需要新增导入命令或迁移，也不依赖审计用的 `output/`。例句与用法提示的维护、来源变化后的复核见 [场景清单说明](../idioms/data/README.md)。

## 基础包维护

内容经当前后台或合法维护流程核对后，从当前 SQLite 库导出：

```sh
.venv/bin/python manage.py export_base_data --output data/baseline-candidate
.venv/bin/python manage.py verify_base_data --input data/baseline-candidate
```

导出先通过只读源连接调用 SQLite backup，再从临时快照读取固定白名单表；不改日常数据库。先审查候选差异、规模与来源状态，再决定是否替换基线。更新现有包必须显式：

```sh
.venv/bin/python manage.py export_base_data --replace
.venv/bin/python manage.py verify_base_data
```

`--replace` 只允许替换格式与文件白名单均通过的既有基础包，拒绝普通文件夹和符号链接。分片、清单或来源文件缺失／损坏会中止，不会跳过检查继续启动。导出的新目录可能包含内部业务证据，提交前应自行核对范围；本项目按个人自用保存这些基础内容。

现有已迁移数据库可只读核对内容：

```sh
.venv/bin/python manage.py verify_base_data --database
```

包内迁移状态与运行代码须配套；新增迁移后应重新导出并在新库验证，不能手改清单摘要绕过兼容检查。

## 可选领域维护

以下命令保留维护用途，不参与启动：词库导入、审核、发布、回退与中文批次命令；`import_reference_library`；`cleanup_retired_references`；场景导入与接龙建池。先查各领域说明和 `--help`，不要把阶段报告中的历史导入序列当成初始化清单。

`import_scenarios` 必须显式提供 `--input INPUT_JSON`；输入不是随 Git 保存的旧 `words-scenario.json`。场景原名称、顺序、词位标注与目标身份按领域导入规则保护；同形多义不能省略选择。词库 primary 适配器默认仅教材英语。可选教材导出命令 `scripts/export_primary.cjs` 从 `content_sources/` 读取语文、数学和英语教材源。场景单词快照可用 `scripts/export_words_scenario.cjs` 从同目录的 `words-data.js` 生成。全部文件生成命令见 [课程文件源](../content_sources/README.md)。

- [场景学习对象与迁移](scenario-learning.md)
- [词库维护与历史阶段记录](lexicon-operations.md)
- [固定公开词典来源与可选来源维护](public-dictionaries.md)
- [中文义项版本保护](chinese-sense-implementation.md)、[首批39条采用](chinese-batch-01-implementation.md)
- [资料退役范围与精确清理](reference-library-removal-implementation.md)

## 回归检查

```sh
.venv/bin/python -m unittest config.test_base_data
.venv/bin/python manage.py test --noinput
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check --dry-run
make test-frontend
```

Node 仅供可选前端测试／历史教材导出，完整初始化不依赖它。SQLite 跳过 PostgreSQL 专用并发用例，不能据此声称生产并发通过。浏览器／设备语音和实际页面验收独立于这些检查。
