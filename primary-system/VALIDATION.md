# 验证记录

> 当前资料范围：南非教材和算术事实已于2026-11-02退役，保留七类／9个数据集／七包／361源文件。下方各阶段记录按时间保留；当前删除验证见本文末尾及[退役报告](docs/reference-library-removal-implementation.md)。

> 最新结果见文末「挑战题库普通/奥数双轨拆分（2026-11-07）」；之前章节为历史记录。

日期：2026-10-30（Asia/Shanghai）。范围为本地统一学习系统基座，未发布、未提交 Git。

## 自动验证

| 检查 | 实际结果 |
|---|---|
| Python / Django | 3.12.16 / 6.1.2 |
| 新虚拟环境依赖安装及 `pip check` | 成功；依赖无冲突 |
| 全新 SQLite 迁移、种子、现有内容导入 | 成功；12 模块、12 学习册、126 单元、1,219 内容 |
| 重复导入 | 新增 0、更新 0、未变 1,219；没有新增学习册 |
| SQLite `manage.py test --noinput` | 共 25 项，24 通过；跳过仅 PostgreSQL 适用的并发测试 1 项 |
| PostgreSQL 18.6 `manage.py test --noinput` | 25 / 25 通过；独立随机命名测试数据库已自动销毁 |
| `manage.py check` | 无问题 |
| `manage.py makemigrations --check --dry-run` | 无模型与迁移漂移 |
| `collectstatic --noinput` | 成功，164 个静态文件 |
| 已跟踪文件 diff / 新文件空白检查 | 通过 |

测试覆盖：

- 独立账号的读写隔离，拒绝通过请求指定另一用户；个人偏好不能修改管理权限。
- CSRF、只允许 POST 退出、登录重定向限制；职员不能从普通登录表单绕过后台验证码入口。
- 内容编辑不能管理账号或读取个人记录；后台所有目录模型列表与新增表单可渲染。
- 草稿、归档、学习册下架、模块关闭及未编排内容在读取路径隐藏；隐藏项不能通过搜索泄露。
- 年级／学科／教材筛选、多个学习册的模块计数、增加新学段和教材。
- 教材与内容跨学科／跨模块的模型校验；纯文本输出转义与分节结构校验。
- 种子和导入幂等、人工保护锁、发布状态保留、dry-run 回滚、整批失败原子回滚。
- 重复／旧版本进度写入冲突，首次读取不创建记录，JSON 类型与大小限制。
- PostgreSQL 两个线程同时以 revision 0 创建同一进度：一个成功、一个冲突，仅一行进度且 revision 为 1。

## 浏览器验证

使用 Playwright，在独立 SQLite 副本和临时测试账号中验证；没有向交付数据库写测试用户或学习记录。

- 桌面 1440 × 1000 与手机 390 × 844 的首页检查、截图。
- 真实表单登录、进入数学学习册、打开知识卡、保存掌握状态／收藏／笔记、在“我的学习”读取、退出。
- 手机阅读页 `document.scrollWidth === innerWidth === 390`，无水平溢出。
- 上述学习流程控制台无错误或警告。
- Nova 后台登录页显示用户名、密码和拼图；验证码初始化与挑战接口均返回 HTTP 200。未实际拖动验证码并登录后台；后台权限和管理表单由 Django 测试验证。
- 浏览器发现后台缺省请求 `/favicon.ico` 返回 404，已补重定向到本地学习图标。

截图保存在仓库 `output/playwright/primary-system/`（已忽略，不作为源码）：

- `home-desktop.png`
- `home-mobile.png`
- `my-learning-mobile.png`

## 当前交付状态与限制

本地 `primary-system/db.sqlite3` 已初始化，未创建默认管理员或学习账号。创建管理员和启动命令见 [README.md](README.md)。临时浏览器验证服务在验收后关闭。

当前可验证的是目录管理、基础文字阅读与账号学习记录。原图示／点读／互动／接龙、原游客与 localStorage 进度迁移、生产部署、真实移动设备和线上负载均未验收。教材和知识内容沿用原 `primary` 资料，本轮没有做内容权威性或实物教材核验。

## 基础词库首期增量验证（同日）

本节记录新增 `lexicon` 后的结果，前文 25 项为基础平台交付时的结果。

| 检查 | 实际结果 |
|---|---|
| SQLite 全套回归 | 58 项：56 通过，2 项 PostgreSQL 专用并发测试跳过 |
| PostgreSQL 18.6 全套回归 | 58 / 58 通过，独立随机测试库自动销毁 |
| 读音占位符缺失统计补充检查 | 对应导入测试通过 |
| 系统检查、迁移漂移、空白检查 | 通过 |
| 真实 SQLite 迁移与权限种子 | 成功；新增词库模型及两个权限组 |
| 教学词卡导入 | 306 教材英语 + 305 场景英语 + 257 成语；868 处内容关联 |
| 本地固定成语快照暂存 | 30,895 条，固定文件摘要校验成功 |
| 来源总量 | 4 来源、4 版本、31,763 记录、31,739 初始词条；24 处精确复用、299 对待审候选 |
| 两类真实导入重复运行 | 新增词条／来源映射／教学关联／候选均为 0；868 处既有教学关联保留 |
| 通用 JSON 示例 dry-run | 通过，未创建示例来源；缺失读音报告为 1 |
| 迁移前后逐行比较 | 内容 1,219、编排 1,219、单元 126、学习册 12、用户 0、进度 0，全部完全一致 |
| 来源公开边界 | 三个教学来源内部启用，成语大库仅暂存；公开准入来源数为 0 |

新增测试覆盖：字段证据与原文一致性、重复键和版本摘要冲突、预演零写入、分批中断续跑、精确复用／多义／多音／大小写歧义、扩展区与异体选择符、显式替代来源保留义项 UUID、人工修订与回退保护、教学证据变化不自动改绑、原始记录只读、来源公开和内容审查多重过滤、来源撤回与禁止缓存、归并旧 UUID 跳转与撤回、后台权限隔离与 CSRF、过期编辑表单拒绝覆盖、版本切换并发只有一方成功。

数据迁移保护同时使用有人工教学修订、有用户笔记及掌握状态的自动测试样本验证；交付库本身尚无真实账号和进度，不把空库比较当作有历史学习记录的实测。

真实导入报告和数据保护证据在仓库 `output/lexicon-validation/`：`primary-import.json`、`primary-repeat.json`、`xinhua-stage.json`、`xinhua-repeat.json`、`preservation-check.json`。导入前 SQLite 备份独立保留，文件权限 0600。

词库后台另经 Playwright 在独立数据库副本验收：来源列表、30,895 条版本的差异确认页、同形词双方证据确认页、按词头查询义项，以及人工修订保存。保存后 revision 从 0 变为 1、审查状态为待审、原始释义未变，并产生一条修订审计。控制台无错误或警告。使用 Django 测试客户端生成的临时会话进入后台，未验证真人拖动验证码登录；没有向交付库写测试账号。截图位于 `output/playwright/primary-system/lexicon-*.png`。临时服务和浏览器已关闭，会话文件与测试数据库已移除。

操作流程和当前限制见 [词库维护手册](docs/lexicon-operations.md)。词库导入、来源准入与内容审校是不同阶段；没有把上述记录数量作为已核准公开的词典规模。

## 公开来源与查字查词增量验证（2026-10-30）

本节记录首批开放来源接入后的最终状态，覆盖前文较早的测试数量和公开规模。

| 检查 | 实际结果 |
|---|---|
| PostgreSQL 18.6 全套回归 | 73 / 73 通过；独立随机测试数据库自动销毁 |
| SQLite 全套回归 | 73 项：71 通过，2 项 PostgreSQL 专用并发测试跳过 |
| 系统检查、迁移漂移、已跟踪文件空白检查 | 通过；本地已应用 `lexicon.0002` |
| 静态资源收集 | 成功，共 165 个文件 |
| Unihan 18.0.0 IICore | 9,810 个字形条目；同版部首映射一同导入；215 条缺英文简释、55 条缺常用音 |
| Open English Wordnet 2025 | 536 个指定词形匹配 499 个；861 个词条、3,700 个独立义项；37 个未匹配词形在报告中列明 |
| 实际公开查询 | 2 个来源、10,671 个词条、13,510 条来源记录；原四个来源仍未准入公开词典 |
| 两套导入重复运行 | 新增词条、映射及候选均为 0；现有教学关联保持 868 处 |
| 逐行保护比较 | 13 张表的原有行及原有字段完全一致，含 1,219 条教学内容、1,219 处编排、31,763 条来源记录和 868 处教学关联 |
| 归档许可检查 | 按数据摘要读取对应许可，校验许可文件摘要；升级登记不影响旧版本许可和署名 |

新增 15 项自动测试覆盖：Unihan 码位、部首、异体及原行追溯；Wordnet 显式词形、多段定义、多义项分批分组及升级保留身份；原有义项顺序；下载摘要冲突、XML 实体拒绝、词条组身份冲突；许可变化的启用限制；发布摘要校验与人工修订保护；匿名页面和接口共用公开准入、撤回即时隐藏、无结果和非法输入、输出转义；拼音／码位查询、读音审查与结构属性一致；精确匹配优先；来源快照及许可归档在登记更新后保持独立。

真实导入使用固定官方文件及 SHA256，抽样核对“学”“行”“bank”等原始字段；这不是逐条语言学或儿童适宜性审校。具体来源、许可、选择范围及缺失项见 [公开词库说明](docs/public-dictionaries.md)。未改写原教学释义，没有自动把同形词的全部义项绑定到教学卡片。

Playwright 在独立数据库副本中验证：桌面查词首页、汉字详情；手机 390 × 844 的汉字、英文多义项、完整许可展开；实际输入 `xue` 并提交查询；现有 bank 教学卡片点击“查字查词”进入对应结果。已查手机页面的 `scrollWidth` 与 `innerWidth` 均为 390；最终教学卡到词典流程控制台错误和警告均为 0。英文 bank 名词展示 10 个独立来源义项，词性有中文标签，保留上游顺序。许可页切换为版本归档后重新加载成功。

截图在 `output/playwright/public-dictionary/`：`lookup-desktop.png`、`character-desktop.png`、`character-mobile.png`、`english-mobile.png`、`sources-mobile.png`。导入、复跑、数据保护和最终测试报告在 `output/lexicon-public-validation/`。导入前备份 `before-public-sources.sqlite3` 保留，权限 0600；浏览器验证数据库和临时服务已清理。

交付库没有测试账号或学习进度；本轮没有提交、推送、部署或公开启动服务。当前英文定义保留英语，汉字仅首批属性、常用音及英文简释；中文词典译文、完整多音字及音频仍未接入。

## 宽屏与儿童友好界面验证（2026-10-30）

本次调整前台公共样式、导航、课程与书架图标，以及个人学习筛选的选中状态。

- SQLite 全套回归 73 项：71 通过，2 项 PostgreSQL 专用并发测试按条件跳过；`manage.py check` 无问题，迁移漂移检查通过。
- Playwright 检查 23 种真实模板页面状态，包括游客／已登录／管理账号／长昵称首页、空书架、课程、单元、阅读器、查词结果与空结果、汉字、英文多义项、许可来源、登录错误、学习偏好、密码表单及学习记录。
- 在 320、360、390、540、600、768、900、1024、1200、1440、1680、1920、2560px 共 13 个宽度下完成 299 次布局检查，最终无页面横向溢出、课程图标与学科标签重叠、图片缺失或主要操作区域小于 44px 的情况；无页面脚本错误。
- 宽屏课程列数为 6、书架列数为 4；2560px 屏幕内容区宽度为 2240px。手机采用单列横向课程卡，正文仍保持 20px。
- 检查手机掌握状态选择、收藏勾选、笔记输入及 Tab 到保存按钮的 3px 可见焦点；“跳到主要内容”可将焦点移至正文。减少动态效果设置可停用卡片过渡和页面平滑滚动。
- 手机完整展开来源许可后仍无横向溢出。人工查看桌面首页、宽屏查词页和手机首页、阅读器、汉字详情及登录截图。

浏览器使用 Django RequestFactory 渲染的真实页面和本地静态资源，由 Playwright 路由响应提供；没有启动服务。预览账号与学习记录只存在于内存中；渲染期间 SQLite 连接设置为只读查询，交付数据库 SHA256 前后相同。浏览器本次核验布局和控件交互，真实数据保存由现有后端回归覆盖。

截图与检查结果位于 `output/playwright/primary-system-responsive/`（已忽略）：`home-wide.png`、`home-desktop.png`、`home-mobile.png`、`reader-desktop.png`、`reader-mobile.png`、`lookup-wide.png`、`lookup-mobile.png`、`character-mobile.png`、`english-desktop.png`、`collection-tablet.png`、`login-mobile.png`、`layout-report.json`。

## 后台导航与接龙词池增量验证（2026-10-31）

本次新增 `games`（现 `chain`）接龙词池（词池旁表 + 后台注册）并启用 Nova 导航扩展（分组、图标、常用模型、收藏、计数徽标）。未改动 lexicon 模型与导入流程。

| 检查 | 实际结果 |
|---|---|
| SQLite 全套回归 | 82 项：80 通过，2 项 PostgreSQL 专用并发测试按条件跳过（原 73 项 + 新增 games 9 项） |
| `manage.py check` | 无问题（含 nova_admin 导航扩展自检：徽标 provider、图标名、分组 key 均通过） |
| `manage.py makemigrations --check --dry-run` | 无模型与迁移漂移；`games.0001_initial` 已应用（现属 `chain`） |
| `collectstatic --noinput` | 成功，165 个文件 |
| `seed_platform` 幂等 | 建立 `游戏管理` 组（games 全部权限）；既有目录与组保持不变 |
| PostgreSQL 回归 | 本轮未运行 |

浏览器验证在独立 SQLite 副本（`PRIMARY_SQLITE_PATH=output/admin-check.sqlite3`）进行，未向交付库写任何测试数据：

- 登录页品牌标识与滑块拼图渲染正常，完成滑块验证后登录进入站点总览。
- 侧边栏按「课程内容／基础词库／游戏中心／学习记录／账号与权限」五个分组折叠展示；常用模型快捷方式带图标与计数徽标（学习内容 1219 草稿、接龙词池 0）。
- 接龙词池新增表单：基础词条自动补全列出启用成语，勾选可接龙并留空首尾字保存「守株待兔」→ 自动派生 守／兔，成功消息与侧边栏徽标 0→1。
- 批量动作「移出接龙／设为可接龙」经界面往返执行生效；可接龙过滤器（是／否）、按词头搜索、收藏星标与当前页高亮正常。
- 截图位于 `output/playwright/primary-system/`（已忽略）：`admin-login-captcha.png`、`admin-nav-groups.png`、`admin-chainword-list.png`。检查用数据库与临时服务（8013 端口）验收后已删除和停止。

边界：对局与计分尚未建模；取词范围经测试确认只含生效版本且不要求公开准入，30,895 条成语快照仍仅暂存未启用；演示成语来源只存在于检查库，未进交付库。

## chinese-xinhua 三数据集与查词性能验证（2026-10-31）

- 本地库在 2026-10-30 后重建；成语 30,895 条幂等重导确认，新增汉字 16,142（多音字按行拆为 14,810 个词条的多个义项）、词语 264,431（跳过 3 条上游完全重复行）暂存并激活。适配器只接受固定 commit `8de1001a` 的 SHA256。
- Unihan／OEWN 经 `fetch_lexicon`＋`publish_lexicon`（registry 校验）重新发布；chinese-xinhua 三来源经 `activate_lexicon` 启用、补许可表述与带日期使用依据（`source_policy` 审计）后由新命令 `review_lexicon` 批量审核发布。
- 读音分级核对：成语 30,291 通过、604 未核对（四字格内逗号等，与 idiom-chain 导入证据的 608 口径一致，差额为 U+0261 手写体 g 变体归一）；汉字 16,132 通过、10 条格式异常未核对；词语来源未提供读音。空释义词义不批量发布，已发布的 28 条退回待审（含审计）。
- 字段展示：成语详情页渲染出处／例句／拼音缩写，`无` 占位与纯空白不显示；汉字属性块新增异体字形。新增测试覆盖渲染、占位隐藏、批量命令的读音分级与未准入拒绝，`manage.py test` 85 项通过。
- 查词性能：32.5 万来源记录规模下，`matching_entries` 由跨 join 的 OR（触发 SQLite 全表扫描、单查询 8–10 秒）重构为按索引前缀的三分支并集＋主键字面量两阶段查询；隔离副本实测搜索 130–370ms（此前 6–18 秒）。空查询浏览全集改走审核状态快路径，与逐记录精确扫描的计数一致（320,722 条）；任一公开来源被禁用或回退时自动退回精确路径，保证撤回立即生效。
- 报告与证据：`output/lexicon-validation/`（xinhua-{idioms,chars,words}-stage.json、*-review.json、unihan/oewn-stage.json）。主库实时性能测量受本机 Navicat 打开同一数据库的 I/O 干扰存在波动，以隔离副本数据为准。

## 成语接龙对局与陪练增量验证（2026-10-31）

- 在既有接龙词池旁表（`games.ChainWord`（现 `chain.ChainWord`），取词只消费词库生效版本、不要求公开准入）上新增玩家侧对局：`games.GameRound`（现 `chain.GameRound`）（统一账号 FK、链 JSON、revision 乐观锁）、`games/urls.py`（现路由 `/chain/` 与 `/chain/api/state|play|hint|restart/`，config 路由改 include）、服务层内存词池缓存与 depth-3 前瞻陪练（移植 idiom-chain 规则：四字纯汉字、严格同字不谐音、+10/−5 计分、待接方无候选自动终局）。
- `seed_chain_pool` 从词库生效版本填充词池：29,502 条四字纯汉字成语（1,393 条非四字不进池），幂等、bulk_create 显式派生首尾字；后台「游戏管理」组可继续人工勾选与改首尾字。
- 端到端实测（真实词池）：页面 448ms、state 15ms、出招含陪练前瞻 34ms、提示 33ms、重开 55ms；陪练正常回应、提示返回 3 个候选并扣分、重开排除上一局起点。
- 「成语本」模块软下架（`is_active=False`，数据/关联/进度全保留可恢复）：入口从学习广场消失，257 张成语教学卡随 `published_items()` 过滤从查词页教学卡区移除（单词卡不受影响）；接龙模块占位页改为进入入口，主导航新增「成语接龙」。
- 测试：games 套件 24 项（词池命令幂等/干跑、对局 API 全链路、四种 400 拒绝、revision 409、跨用户 409、未登录 401、hint 扣分、自动终局两种、重开与历史）；全库 100 项通过，全链路测试 10 连跑稳定。

## 内容块 schema v2、图示复用与点读验证（2026-10-31）

- `sections` 升级为类型化块（v1 `{title,text}` 兼容读取、v2 `{"type":"text"}`／`{"type":"figure","fig","caption"?}`），`clean()` 分类型严格校验（未知 type/键、超长 fig/caption 拒绝），`save()` 自动派生 `schema_version`（含 typed 块为 2）。
- 六个 legacy 图示库（106 个图示，含互动演示）＋figures.css 以逐字节 SHA256 校验复制进 `static/figures/`（`scripts/sync_legacy_assets.py`，`--check` 回归）；`loader.js` 按占位符注入，图示缺失有空态兜底；模块→库映射固定（knowledge/math→Figures、sci/geo/astro/history/lit→各自库）。
- 导入管线升级：`item_defaults` 生成显式 text 块，`raw.fig` 置首位 figure 块；`convert_figures` 幂等迁移 98 条既有内容（astro 14/geo 16/history 12/knowledge 8/lit 17/math 16/sci 15，import_locked 跳过，重跑 0 变更）。
- 完整性校验：`scripts/verify_figure_refs.cjs` 对 primary.json 全量扫描，98 个 fig id 全部命中对应图示库（missing=0）。
- 点读完整移植：`speech.js` 引擎原样复用；`tts.js` 提供 `[data-say]` 单点朗读、`[data-tts-sequence]` 连读（2200ms 步进＋高亮滚动）、英语发音人偏好（与 legacy 共用 localStorage 键）；接线 item 页逐节朗读、english 词卡整词＋音节段按钮（parts 取自 source_payload 只读投影）、english 册子连读条、profile 页发音人选择；打印隐藏朗读控件。
- 测试：catalog 新增块校验/schema_version/占位渲染转义/convert 命令测试；lexicon 新增 v2 显式 text 块下音标证据路径不破坏；全库 110 项通过。
- 手动验证：math 图示页占位与脚本标记齐全（44ms）、v1 词卡不加载图示资产、english 词卡点读按钮渲染。浏览器端互动演示与 TTS 实听按「本地使用」清单在 runserver 下核对（loader 注入后 demo 由库内 MutationObserver 自动初始化）。

## 接龙游客免登录验证（2026-10-31）

- `GameRound` 归属双轨化：登录玩家挂账号 FK，游客挂浏览器会话内随机键 `guest_key`（数据库 CheckConstraint 强制两者互斥），迁移 `games.0003`（现属 `chain`）。
- 服务层改为 owner 过滤字典；账号对局保留账号行锁串行化首写，游客无行锁（同浏览器请求天然串行）；`current_round` 原子内重查防并发重复开局。
- 页面与全部 API 去登录门；模板加游客模式提示（登录后记录跟随账号）；游客对局随会话过期失效，与账号对局天然隔离（越界操作 409）。
- 测试：新增游客免登录全链路（页面 200/开局/出招计分）、游客不可触账号对局（409）、双游客隔离；全库 112 项通过。实测：游客打开接龙页直接开局（opener=因陋守旧，词池 29,502）。

## games 应用更名 chain 验证（2026-10-31）

- 应用户对玩法命名的要求，应用 `games` 更名 `chain`（app 即玩法；路由同步 `/games/`→`/chain/`，旧路由 404）；后台「游戏中心」分组、常用模型与徽标引用同步更新。
- 迁移史 surgery：`django_migrations` 与 `django_content_type` 的 app 标签 UPDATE（权限经 content_type 外键自动跟随，`游戏管理` 组权限无感）；迁移文件 dependency 改 `('chain', ...)`；存量数据表 `games_chainword`/`games_gameround` 重命名为 `chain_chainword`/`chain_gameround`（表名手术为一次性维护操作，不进迁移历史——从零建库按 0001–0003 直接得到新表名）。索引与约束名保留 `games_` 前缀（无语义冲突，省一次 DDL）。
- 过程中纠正一处自查错误：0004 RunSQL 表名误写 `chain_chainround`（`GameRound` 默认表名应为 `chain_gameround`），已撤销该迁移并按正确名对齐存量库。
- 全库 112 项测试通过、`makemigrations --check` 无漂移、`/chain/` 200 且 `/games/` 404；`游戏管理` 权限组、导航徽标、seed_platform 幂等均验证正常。

## 接龙提示 403 修复（2026-10-31）

- 症状：游客点提示无反应。根因双重——重写对局模板时 `{% csrf_token %}` 丢失（页面不种 CSRF cookie、POST 全线 403），且前端把非 JSON 的 403 响应吞成「没反应」；测试未抓到是因为 test client 默认关闭 CSRF 校验。
- 修复：模板恢复 csrf_token 并对页面视图显式 `@ensure_csrf_cookie`；前端对 403 给出「安全校验过期，请刷新」反馈。
- 回归锁定：新增 `enforce_csrf_checks=True` 的游客全链路用例（真实浏览器路径：种 cookie → 带 token 出招 200 → 无 token 403）。全库 113 项通过。

## 场景单词词典驱动验证（2026-11-01）

- primary-words / primary-english 来源激活为内部词库源（active_release 就位，公开准入保持关闭，与接龙词池同边界）；`review_primary_readings` 批量核对 609 条教学卡音标（words 305 + english 304，2 条英文卡无读音值；幂等重跑 0 变更，审计写明沿用教学卡原值）。
- 词卡词典驱动：words 模块词卡经 ContentEntryLink 在 active release 中定位来源记录（link_state 模式，来源变更可感知），复用 record_payload 渲染 IPA／释义／词性；教学标注（记忆提示、拆分跟读按钮）保留在卡上；旧扁平 sections（音标/拆分/关联词）停止渲染，数据保留可回滚。
- 关联词双层管理落地：人工策划关联（source_payload.related）解析为卡内跳转（同/跨场景卡）或词典查询兜底；同场景词按兄弟 Placement 派生（零存储），点读 pills。
- 降级路径：关联缺失、来源停用或来源更新未对上时，词卡回退教学标注渲染（view 判定，空壳词卡不出现）。
- 实测 dance 卡 52ms：IPA／释义／emoji／拆分跟读／关联词（sing、music room 均有卡链接）／同场景 pills／来源状态全部呈现；测试新增场景词卡 4 项（词典驱动渲染、双卡词典视图、无来源键降级、API），全库 117 项通过。

## 教材单词同构词典驱动验证（2026-11-01）

- 渲染判定从「words 模块」泛化为「kind=word 且词典数据可用」（context 名 `is_dictionary_word`），english 教材单词 306 卡与场景单词同构接入；降级路径不变（无关联/来源异常回退教学标注）。
- 实测 ability 卡 51ms：IPA／释义／emoji／同场景 pills（Unit 1 兄弟词）／来源状态全部呈现；测试新增 english 模块用例（含兄弟词 pills），全库 118 项通过。

## 打印版式与安全审计收尾（2026-11-01）

- 阅读页打印版式：单栏展开（隐藏导航/进度面板/朗读控件/返回链接），阅读节与词卡防断页，图示保留而互动控件隐藏（figures.css 内建规则），字体降密适配纸面。
- 查词页 zh 教学卡区核实：`teaching.html` 以 `{% if teaching %}` 包裹，成语本下架后中文查询**本就干净地不渲染**，无空壳区域，无需补位改动。
- Mimosa 深度安全扫描（deep，`scan-2026-10-31T16-18-27.644Z-32fb3029a12d`，封印 sha256:4da726ce…）：**发现数 0**；依赖扫描 8 包，离线告警比对无命中。此前提交时的「扫描覆盖不完整」提示就此收尾。

## 教材与主题分表验证（2026-11-01）

- 应用户决策（当前数据为 legacy 静态页临时导入、结构可能大调整，长远分表避免技术债）：`Collection` 拆分为 `TextbookBook`（教材同步册，textbook 必填，一教材一册）与 `TopicBook`（主题探索册，grades 表达适用年级）；`Unit` 双 FK（textbook_book/topic_book）＋互斥 CheckConstraint＋分表唯一约束。
- 重导路径而非存量迁移：编排层（册/单元/编排）删除重建，**内容 1,219 条、进度、868 词卡关联、29,502 词池全部不动**（均挂模块或内容 UUID）；`importing.py` 按模块语义建双表册（knowledge/math/english→教材册，english 沿用 book 字段拆 4a/4b），重导后 12 本册（4+8）、126 单元、1,219 编排与拆分前一致。
- 消费面适配：admin 双 ModelAdmin、views 合并鸭子接口（published_books/kind/subject/subtitle）、首页书架分区、`catalog_api` kind 标记与 `?kind=` 参数、册页 `/books/<code>/` 双表先后查询；Nova 导航图标/常用模型键同步（topicbook 图标换用 nova 支持的 `lucide:map-pin`）。
- 教训两笔：①迁移生成顺序会把 `unit_book_exclusive` 约束放在存量行仍违反的位置——迁移前先清编排层（重导路径下无损失）；②表名重命名这类「存量手术」不进迁移历史（同 chain 更名先例）。
- 全库 121 项测试通过、check 无问题、无迁移漂移；实测首页双架/textbook 4 本/topic 7 本（成语册随模块下架暂隐）/教材册页/词卡词典驱动/接龙/词典全部 200。

## 专题内容退场与目录教材专用化验证（2026-11-01）

- 领域决策：**教材 = 固定结构的目录编排管线；专题 = 独立玩法应用**（各自带模型/服务/前端，如 chain）。TopicBook 模型、Unit.topic_book、主题书架、API kind 参数全部退场（迁移 0005/0006，SQLite 删列须先删引用约束的顺序教训入档）；seed_platform MODULES 缩减为教材三模块＋接龙入口。
- 数据删除（源头可恢复）：8 本专题册、94 专题单元、825 专题编排、825 内容卡（words 306/idioms 258/lit 51/astro 51/sci 49/geo 47/history 47/writing 16）、562 词卡教学关联、8 个专题模块行。**源头完好**：legacy 各 *-data.js、primary.json、词典 5 来源（primary-words/english 保持激活，609 音标核对保留）、接龙词池、图示库——场景单词等玩法 app 可随时从源头重取数据。
- importing：非目录模块的快照数据改为跳过并记录 skipped_modules（primary.json 保持全量导出）；首页只剩教材书架与接龙入口（模块卡 4 张）。
- 词卡词典驱动测试迁移至 english 教材卡（fixture 用 seed 的 fltrp-english-4a 教材册），关联词解析修正为同模块词卡（原写死 words 模块的 bug 被新测试抓住）。全库 120 项测试通过；实测教材册页/词卡/接龙/词典 200，专题册 URL 404。

## 场景单词玩法应用验证（2026-11-01）

- 新应用 `words`（路由 `/words/`）：`Scenario`（46 场景）＋`ScenarioWord`（577 词位，entry 必挂词典词条、教学标注留卡上）＋`WordProgress`（双轨归属互斥约束，与接龙同模式）。
- 词典全量补入：`scripts/export_words_scenario.cjs` 从 legacy words-data.js 导出校验快照（en 唯一/音标包裹/拆分齐全），`words_scenario_manifest` 适配器投影 577 词进 primary-words 新版本（exact_reuse 复用 316 个既有义项），激活后 `review_primary_readings` 核对新读音——**577 词 IPA/释义全部已核对可展示**。
- 导入命令 `import_scenarios`：46 场景/577 词位、entry 匹配 100%、幂等重跑（修正了按未挂接过滤导致的重跑失配）。
- API/页面：全量 state 下发（约 300KB，一次查询批量组装修正了 N+1）、learn 幂等切换、游客/账号隔离、CSRF 回归用例（`ensure_csrf_cookie`＋enforce_csrf_checks——chain 教训防复发）、word_id 数字校验防 500。
- 入口：seed MODULES 加回 words 模块卡（module.html 特判）；首页模块卡 5 张。前端 words.js/words.css 按 legacy words-app 体验移植（chips 进度/词卡网格/搜索/连读/掌握标记走 API）。
- 全库 126 项测试通过；实测 /words/ 200、46 场景 577 词 IPA+释义覆盖 100%。

## 接龙词典桥接与同形词判定辅助（2026-11-01）

- 接龙链上词条的词典桥接：`chain_entry_info` 附带 public 标记（来源公开准入＋义项/词条已发布），链迹与提示里**已公开成语**（如 xinhua 快照 30,895 条）点文字新标签跳词典详情；内部来源（教学成语卡）保持仅点读，避免 404。
- 同形词判定辅助：MatchAdmin 列表加保留/候选词头列与双方来源列（按来源快速识别 xinhua↔unihan 等组合）；EntryAdmin 详情加「待判定同形词」直达链接（带词头搜索跳转）。约 9,800 对积压的后台人工判定效率提升。

## 系统性验收与三项修复（2026-11-01）

- 系统性验收扫描：14 个页面、7 个 API、错误处理（非法参数/空字节/超长输入全部 400）、后台 14 页、权限组边界（游戏管理 200/403 分明）——发现三项问题并全部修复。
- **后台遗漏**：GameRound 与 words 三模型（Scenario/ScenarioWord/WordProgress）未注册后台——补 GameRound 只读展示（玩家/手数/得分/终局）与 words 双 ModelAdmin（场景/词位可编辑教学标注、掌握记录只读）。
- **连写拼音查不到**：发音键保留音节空格（'a bi di yu'），用户连写 'abidiyu' 无法前缀匹配；且原 `pinyin != normalized` 条件对纯 ASCII 输入跳过拼音分支。修复：SourceRecord 增 `pronunciation_key_compact` 无空格紧缩键（迁移含 SQL 回填存量 3.3 万行，导入管线同步双写），查询恒定走紧缩键分支——连写/分写/带调三种输入全部命中，英文输入空匹配无副作用。
- 全库 126 项测试通过；拼音查询矩阵（连写/带调分写/前缀/英文）实测全通过。

## 本地启动、专题退出与设计基线复核（2026-11-02）

本节为当前工作树和本地数据库的最新结果，覆盖前文关于规模、运行状态和“待接入”功能的历史描述。设计方向见 [系统设计基线](docs/system-design.md)，启动见 [本地开发](docs/local-development.md)。未提交 Git、未部署。

### 范围与迁移

用户确认：彻底清理通用专题阅读，后续按学科开发独立页面、功能与数据模型。未清理仓库其他研究目录。

启动前实际库仍处于 `catalog.0001`，有 12 本旧学习册、126 单元、1,219 内容。原 `0003` 没有搬迁数据就添加互斥约束；原 `0005` 依赖一次手工清库。此次补入历史模型迁移，并增加前向 `0007` 清理已升级库中的孤儿专题内容；SQLite 和 PostgreSQL 均保留原子性。

- 原库通过 SQLite backup API 备份，权限 0600；备份完整性检查为 `ok`。
- 删除 825 条旧专题阅读内容及其编排、对应旧教学关联；没有创建伪教材或恢复专题阅读器。
- 升级后为 4 本教材册、32 单元、394 内容、394 编排、306 教材词库关联，模块入口为 knowledge/math/english/words/chain。
- 迁移前后，教材内容原字段、教材单元／编排、教材词库关联逐行比较一致；13 张词库及账号相关表原字段一致，45,273 条原始来源记录保留。原库实际账号、教材学习记录均为 0；有笔记／收藏／人工改动的情况另由历史迁移测试覆盖。
- 随后执行新版内容导入，更新未锁定教材的类型化分节／图示，保持内容 UUID；教材英语与全量场景英语各暂存并启用内部版本。词库现有 46,156 条来源记录、6 个来源，原记录保留，原词典展示范围未扩大。
- 场景词为 46 场景、577 词位，词位匹配 100%，释义／已核对音标均非空。启用已有内部成语快照后，接龙词池为 29,515 个唯一词形（包含教学成语补充）。

备份、校验和运行日志保存在仓库已忽略的 `output/primary-system-audit/2026-11-02/`：`before-catalog-upgrade.sqlite3`、`before-upgrade.json`、`migration-preservation.json`、`current-data.json`、测试及启动日志。

### 修复与自动验证

| 检查 | 实际结果 |
|---|---|
| PostgreSQL 18.6 全套回归 | 145 / 145 通过，独立测试库已销毁 |
| SQLite 全套回归 | 145 项：143 通过、2 项 PostgreSQL 并发测试跳过 |
| 前端 Node 回归 | 7 / 7 通过，覆盖连读结束／取消／失败、掌握保存失败和接龙提示失效 |
| 真实历史升级 | 有数据的 0001、0002 升级及原 0006 的前向清理，两个数据库均通过 |
| 全新 bootstrap | 成功；4 本教材册、394 内容；词库暂存、不擅自切换来源 |
| 重复导入 | 新增 0、更新 0、394 unchanged，跳过 8 个非教材模块 |
| 系统检查／迁移漂移／依赖／diff 空白 | 均通过 |

本轮修复：

1. `import_primary` 用显式教材适配范围，避免 seed 后把 words 误当教材而中断。bootstrap 只从教材卡抽取英语，场景英语通过独立快照暂存；支持独立 `--database`。
2. 英语 `RELATION_META/RELATION_ORDER` 是展示配置，不再误导入为两条教材内容；保留真实教学附加资料。首次检查中本轮误建的两条配置卡和两个空资料单元已清除，原教材身份未变。
3. 词典空查询与搜索／详情统一使用生效来源过滤，停用、撤回、版本删词及时生效。
4. 接龙实际取词尊重生效版本、词条停用／归并与人工禁用；同形成语在游戏层按词形排重，切来源换 UUID 也不能重复；每个请求只读取一次词池。空词池有页面空态与明确 API 响应。
5. 场景词主释义与关联词采用人工修订，来源停用后不再显示旧来源释义。
6. 场景连读补齐朗读目标；队列改为语音结束事件驱动，不再固定 2.2 秒截断。停止与迟到回调不会串入新队列。
7. 掌握保存提供保存中、成功、403／503／断网／异常响应的可访问提示；失败保留已知状态。
8. 接龙出招、重开、冲突刷新与终局会清理旧提示、数量和展开状态。

### 真实浏览器

Playwright 使用独立数据库副本与临时学习账号，在桌面 1440×1000 和手机 390×844 验收：

- 登录 → 数学教材 → 图示内容 → 保存已掌握／收藏／笔记 → “我的学习”读取成功。
- 场景词 46 场景／577 词渲染，classroom 掌握标记成功且刷新后仍为已掌握。
- 真实浏览器 SpeechSynthesis（180 个可用 voice）连续收到 classroom、window 两个 `end` 事件，队列按结束推进；这验证引擎与队列接线，不代替人工听音或真实移动设备发音质量验收。
- 接龙提示 → 填入“和睦相处” → 服务端加 10 分并获得陪练回应；共 3 手，提示面板清空并关闭。
- `xue` 查询返回结果，进入“学”详情正常显示读音与来源属性。
- 手机学习记录、场景词、接龙、词典页面未发现水平溢出；检查期间浏览器控制台 error/warning 均为 0。
- 最终本地主页为 394 条教材内容，筛选不再出现“专题”文案。

截图位于 `output/playwright/primary-system-audit-*.png`。临时测试账号与数据库仅存在于验收副本，验收后清理；日常数据库没有写入测试账号或教材学习记录。

### 保留的问题与运行状态

本地服务保留在 `127.0.0.1:8012`，日常库为 `primary-system/db.sqlite3`；PID 与日志在上述审查目录。账号未自动创建，管理账号由维护者运行 `createsuperuser` 设置。

仍需处理：场景词全局唯一限制与缺少教学义项／证据绑定、归并后的领域引用、跨学科学习总览与入口启用规则、教材分节正文搜索、游客业务数据保留期。内容方面，中文词典解释仍偏英文；内部成语来源有 10 条释义含异常字符 `⊥`，其 30,895 条读音未逐条审校，未把内部启用当作审读完成。具体优先级已进入设计基线。

已有 7 个图示副本与 legacy 来源不同（本轮修改前即存在），不能直接覆盖同步。`speech.js` 已明确由本项目独立维护，不再参加 legacy 覆盖同步。未做部署、全量内容准确性审校或真实手机听音验收。

## 场景词卡目标、编排与学习记录验证（2026-11-02）

本节为本阶段最终结果，补充并更新上一节“场景词全局唯一／缺少义项证据”的待办。实施细节、证据路径及边界见 [实施报告](docs/scenario-learning-implementation.md)，模型与验收矩阵见 [场景学习对象](docs/scenario-learning.md)。未提交、未推送、未部署。

- 新增稳定UUID词卡目标，固定义项、可选读音、来源证据及人工修订快照；场景词位按场景＋目标编排。相同目标跨场景共享词卡掌握，同形异义独立；不扩张为全词、拼写或听辨掌握。
- 新增words.0003、0004正式迁移，保留旧词位主键、标注和旧进度语义。账号／游客、true/false、时间及追溯映射由SQLite和PG历史迁移用例逐字段验证；歧义旧卡保留待复核，不猜选、不合并。
- 真实副本和日常库：40张原表312,826行逐行原字段摘要一致，577词位全部映射、0待复核。人工修订快照迁移另核对41张表313,408行（含577目标），已有UUID不变。SQLite完整性ok。两份本阶段backup恢复点权限0600，上一阶段备份保留。
- 来源停用／变义／删词／回退、人工修订变化、归并、非法跨义项／读音绑定、删除编排、重复导入／预演／人工保护、归属隔离、并发首写和过期写入均有回归。源码／当前人工值不匹配时暂停释义，不从关联词表或缓存补回。明确选用新修订目标不会继承旧掌握。
- API升级为schema_version=2，使用target_id＋revision；旧word_id请求和过期修改返回409。前端成功后同步共享目标全部词位，失败保留已知状态并反馈。

| 检查 | 实际结果 |
|---|---|
| SQLite完整回归 | 158项：155通过，3项PG专用跳过 |
| PostgreSQL18.6完整回归 | 158/158；测试库／隔离schema已销毁 |
| Node前端 | 9/9 |
| 空库bootstrap | 成功，含0003/0004；4教材册、394内容，来源暂存 |
| 真实副本预演／重跑 | 577 preserved，0新增、0歧义／冲突 |
| check／迁移漂移／diff空白／migrate计划 | 通过／无待迁移 |
| 桌面1440×1000和390×844 | 浏览、搜索、共享掌握、刷新、过期标签页409通过；无水平溢出 |
| 语音 | 真实classroom→window→door结束事件推进，单点classroom start/end通过 |
| 修订浏览器验收 | 旧目标learned保留且待复核；新目标显示新版并未掌握 |

证据位于`output/primary-system-audit/2026-11-02/targets/`，截图为`output/playwright/primary-targets-*.png`。临时副本、账号归属数据及8013服务已清理。日常8012服务保留（最终PID87474），46场景、577编排／目标，释义和音标均577/577；教材394、词库6来源／46,156记录不变，日常账号和场景学习记录均0。原学习时的历史词义版本未被旧系统记录，无法逆推；本轮只保留词卡掌握声明。未做全库内容审校、真实移动设备听音或上线。

## 中文义项版本、所见呈现与教材修订保护（2026-11-02）

最终实施见 [中文义项报告](docs/chinese-sense-implementation.md)，主控独立结果见 [验收文档](docs/chinese-sense-acceptance.md)。本轮未提交、推送或部署，未导入references大语料或批量翻译。

- 新增独立中文正文、核对、目标采用和教材选择历史。中文精确绑定Sense／读音／固定证据／人工修订快照，确认及采用带CAS；撤回保留正文但停止儿童端下发。同义只允许直接前驱升级，改义／改读音／换证据使用新学习身份，不继承旧掌握。既有语义标记不因删编排或进度重置。
- 场景schema3提交实际所见中文版本／采用revision，旧schema与旧页面409；历史新字段保持null。教材区分附注修改和明确学习确认，不因只保存笔记将旧mastered绑定到新版本。未知历史掌握保留并标记待确认，详情／个人页／首页一致。
- 固定关联失效时封住summary/body/sections、memo、拆分提示和自定义say旁路，覆盖详情／目录／API／搜索／词典教学卡；未绑定人工卡保留独立路径。word与非word教材均展示所有参与确认的词义。
- 查询改为请求内批量解析，不做跨请求缓存。306条有效掌握实测中文搜索13次SQL、首页11次、个人页5次；主控独立复测一致。

| 最终检查 | 实际结果 |
|---|---|
| SQLite完整回归 | 184项：175通过、9项PG专用跳过 |
| PostgreSQL18.6完整回归 | 184/184，含6项新增真实竞争：确认、创建／源修订、采用／旧提交、采用／源修订、撤回／写入、首次关联／编排 |
| 非空历史升级 | 两库均逐字段保留旧true/false、账号／游客、时间、教材mastered／收藏／笔记及目标／关联／内容身份；所见历史为null |
| 空库bootstrap | 全部新增迁移成功，4册394内容、来源暂存、无默认账号 |
| 实际副本及日常保护 | 41表313,408原行原列摘要一致，integrity ok；日常独立业务比对32表313,132原行亦通过 |
| 前端Node | 9/9 |
| 浏览器 | 1440×1000与390×844中文／例句、跨场景共享、游客隔离、A→B旧标签页409、教材明确确认及只改笔记通过；无横向溢出 |
| check／迁移漂移／diff空白／migrate计划 | 通过，无待迁移 |

本阶段新恢复点：`output/primary-system-audit/2026-11-02/chinese/before-chinese.sqlite3`，SQLite backup、0600；先前恢复点保留。逐行报告、两库测试、性能及浏览器证据在同目录，截图为`output/playwright/primary-chinese-*.png`。主控比对由主控自行执行，其校验脚本未被本实施运行或修改。

日常库仍394教材内容／编排、306教材关联、46场景577词位／目标、6来源46,156来源记录；新增306条继承选择历史。**中文版本、核对、采用、账号及两类进度均0**，没有将隔离样例或原有中文冒充全库审校完成。原历史呈现不能逆推；只记录最近一次状态而非完整学习事件史。8012日常服务保留，当前PID见本阶段runserver.pid；本轮8013、浏览器、临时数据库与会话凭据已清理，保留恢复点和验收证据。

## 首批中文主释义采用（2026-11-02）

固定批次cn-foundation-20261102-01，主控锁定规范化SHA256 `91e7a07da970887d89d107375188457b47824351702b42b835ff91a62b94d281` 后采用39条来源中文：26场景目标＋13教材关联。AI逐条核对，不是人工／真人听音；不是全部memo或拆分提示质量通过。

SQLite相关38项（37通过／1PG跳过）、PG批次10/10含并发首导、前端9/9；未反复全跑184基线。副本dry-run零写、首导39、重复零新增；错误摘要／pending、换目标、源修订、撤回、人工改选、后半条失败均拒绝或整批回滚。浏览器1440和390px显示、中文搜索、点读end、旧呈现409／刷新后200通过。备份及报告在output/primary-system-audit/2026-11-02/chinese-batch-01/。

日常白名单保护：46表313,781原行（含元数据），只有批准39行采用字段变化及预期新增；主控独立36业务表313,438原行比对通过。账号和两类进度仍0，没有制造学习记录。完整来源原文／语言／教学标注保留。源版本／审核与采用历史持久化，复跑不能覆盖后来人工选择。

覆盖39/883引用及固定绑定，余844未完成本批审核，明确暂缓4引用／3词形；清点见docs/chinese-coverage-inventory.md。39条主释义通过不扩张为window词源等旧memo全部通过。8012 PID99880保留，本轮临时库／8013／浏览器已清理，恢复点和证据保留。未提交、推送或部署。详细交付见docs/chinese-batch-01-implementation.md。


## 九包全量资料库（2026-11-02）

全量现已落入日常库：9包／278源文件／10就绪数据集／1唯一回执；CEDICT125346、CMU135166、笔顺9574、Unihan102998字／1555629属性、诗文73676正文、国家地区250、元素有效118／原始119、运算543、HYG119626及具名499、科学120目录／358图／66表／174活动／327题干／327答案／288教师节点。

空库与真实副本完成迁移、全量预演、导入；副本和日常重跑均零新增，已入库预演逐行摘要通过。完整回归228项通过（10项SQLite跳过）；最终新增领域42项通过（3项SQLite行锁跳过），PG18.6针对性24项全部通过，包括三域并发首导一个创建／另一个unchanged。check和迁移一致性通过；新增Python已格式化且无新运行依赖。

独立业务保护：37表313557行原字段全部不变、0旧业务新增、integrity ok；账号及两类进度保持0。全量来源没有隐式替换既有577目标、306教材关联或39条中文采用。Playwright桌面／390px入口与详情、笔顺交互、子诗检索、科学图片和手机表格可读性通过；匿名／普通登录不具备答案／原文／私有图片权限。数学Unicode²友好400，星表200，无500。

日常首次全量50.107s、重跑24.439s、已有预演23.279s；SQLite约862MiB，私有资产约260MiB。新恢复点为`output/reference-library-implementation/daily-before-reference-20261102.sqlite3`（0600），旧恢复点保留。报告和哈希证据在同目录；测试空库／副本及临时服务清理，最终日常8012保留，当前PID见该目录runserver.pid。未提交、推送或部署。详见[实施报告](docs/reference-library-implementation.md)和主控独立[验收](docs/reference-library-acceptance.md)。

全量验收后的短名补充：仅改静态标签，首都覆盖246/247、语言152/153；拉帕斯／齐巴韦语／通加语已注明领事服务网和上海外国语大学来源。8012重启后GNQ、ZWE、NAM详情均200，新增三名正确显示、Kwangali继续标缺。未重导或改写业务数据，未重复全套测试；证据`output/reference-library-implementation/short-name-followup.json`。

## 南非教材与算术事实退役（2026-11-02，当前）

新增arithmetic.0002／science.0003／reference_library.0002正式迁移删除8表2143行、2 Dataset、3包及73 SourceFile、8专用ContentType／29 Permission；精确清理425文件124196663字节，清理重跑0。元素119条原字段全部保留，公开118且独立readiness；六包导入不再需要科学ZIP，math_seed全成员继续校验但不存储／登记，重跑不会复活两项资料。

当前七卡片／8ready Dataset／6包／205源文件，旧九包ImportRun保持历史，新六包scope独立回执。副本54保留表2517153行、全部保留资产和9原ZIP摘要一致；空库迁移通过，SQLite全回归228项通过（12条件跳过），定向11项及PG11项通过，桌面／390px七列表与氢详情200、旧九URL404、无溢出。日常实际清理与重跑通过，元素和其余53表保持；chain_gameround出现15:45:40—45并行活动（1原行更新／4新增），早于15:51日常迁移，操作者未确认，本任务未回滚或删除，详见退役报告。未将该差异归为全表一致。

新恢复点及证据`output/reference-library-removal/`，旧备份不动。当前8012保留，未提交、推送或部署。详见[退役实施报告](docs/reference-library-removal-implementation.md)与[主控验收](docs/reference-library-removal-acceptance.md)。

## 查字查词前端整合（2026-11-02）

新旧资料现在同查：正式公开词义、CC-CEDICT汉英参考、CMU读音、Unihan17属性及笔顺同页展示，正式UUID详情有同形补充内容，旧来源列表兼容302、详情仍可用。资料探索语言卡收敛后为五入口；没有合并学习身份、自动matched_sense、重导或schema变化。

完整SQLite241项通过（12条件跳过）、PG关联37项通过、最后模板38项通过，check及迁移一致性通过。1440／390真实查询、木逐笔、长hash折叠、缺音来源限定、旧入口跳转和来源版本隔离验证通过；主控新基线54表2517158行／205资产／迁移记录完全不变。日常接龙未访问、已退役两项未恢复。报告见[统一展示实施](docs/dictionary-unification-implementation.md)与[独立验收](docs/dictionary-unification-acceptance.md)。


## 2026-11-03：跨 Mac 基础数据与导入流程收口

- Git 基础包：48 张固定内容表、2,517,152 行、64 个确定性 JSONL gzip 分片，约 152.27 MiB，最大文件约 11.09 MiB；保留原内容 UUID、编排、选义、发布状态与中文采用。个人账号、会话、学习记录、游戏回合不打包。
- 主控独立新库初始化通过；恢复后的48张表逐行摘要与导出前日常库一致，11个页面读取检查通过，205个来源文件摘要一致。
- 复现旧 bootstrap 的394条教材／848个暂存词条／306条教学关联后，显式 refresh 成功；账号、权限及所有非基础表逐行保持。含学习记录的旧库拒绝替换，64张表逐行不变。完整基线带学习记录重复启动返回 unchanged，64张表逐行不变。
- 仅复制 Git 已跟踪及未忽略候选文件共414个，隔离目录不带旧 primary、本机数据库、资料缓存或历史 output，复用已安装Python依赖；完整 bootstrap 再次成功。本次没有在另一台物理Mac上执行。
- 当前日常库64张表与任务开始时逐行摘要一致。主控校验脚本及日志位于 output/data-portability/，该目录不作为运行依赖。
- 新增数据保护定向测试9项通过；Django相关回归160项中151项通过、9项PostgreSQL专用测试因SQLite跳过；前端Node测试9项通过。校验包括损坏包拒绝、确定性导出、普通目录不可替换、账号年级映射、初始继承与人工选义区分，以及个人记录保护。
- 本轮未提交、推送或部署；跨机同步须将代码、基础包和固定来源文件一起提交。日常运行库和密钥仍被Git忽略。

## 2026-11-03：飞花令专题首版

- `/poetry/feihualing/` 提供单字令五句练习，首页与古诗文页均有入口。桌面三栏为选字、作答、诗单；支持提示、揭晓、原诗新标签页和换字确认。
- 人工选句清单随 Git 保存：28 首、136 个分句。月/花/春/山/水/风分别有10/11/9/15/9/8个可用分句。主控逐段核对来源、简体显示与原文字形，28首均通过实际数据库来源校验；加载只执行3次SELECT。
- 不新增数据库表或迁移，不变更基础数据包；短期签名保留本页局内状态，刷新开新局。独立作答与提示学习分开，不写入账号、会话或学习记录。主控服务层实际查询捕获和端点测试均验证零写入。
- 主控独立执行 `.venv/bin/python manage.py test poetry --noinput`：16项通过；`node --test scripts/test_feihualing_frontend.cjs`：10项通过。包含来源失效、签名过期、CSRF、精确匹配、整段与分句去重、完成统计、中文输入法、网络失败与换字输入保护。
- 实际浏览器完成月字五次作答；验证繁简整联、重复、缺字、暂未收录、提示不计分、揭晓计入提示学习和原诗跳转。模拟网络失败后输入与原局保留；模拟composition Enter既不提交也不阻止原生确认，未进行真实系统输入法人工测试。
- 1920×1080、1440×1000、1366×768桌面与390×844窄屏检查通过：无横向溢出，桌面输入和提交位于首屏。已目视初始、完成、窄屏与最终整联分行截图。窄屏使用纵向滚动布局。唯一浏览器控制台错误来自主动模拟的网络失败。
- 主控证据：`output/feihualing/corpus-control-audit.json`、`output/playwright/feihualing-control-*.png`。没有运行全项目回归或远端CI；未提交、推送或部署。8012本地服务保持可用。

## 2026-11-03：飞花令扩充入库诗词与完整句

- 从当前已就绪版本的全唐诗、宋词、诗经、楚辞和千家诗生成索引，扫描73,623个来源文本入口、394,972个段落。解析397,665个句子单位，排除723个含夹注等不可读单位、292,059个不含当前六个令字的单位，合并4,271个重复完整句，最终可用100,612句；另有67个不完整尾段未纳入句子单位。来源入口数不称为唯一作品数。
- 花/月/春/山/水/风分别可用21,197/17,302/19,526/21,654/15,603/27,327句，各令字之间存在交集。29首清单仅作常见版本、字形采用和提示优先层，不限制准入范围；OpenCC依赖固定为0.1.7。原始资料不改写。
- 输入完整分句后展示原文所在完整句，逗号不截断；不跨原段拼句。楚辞无句终标点的结构化对句可保留。已显示完整句中含令字的其他分句一起标用，不能拆开再计分；输入本身必须含令字，不能依赖自动补全满足规则。
- 独立索引约42.65MiB，Git忽略，可从正式内容库重建，缺失/损坏/版本变化自动重建。冷建约26秒为实施会话实测；主控v3实际库请求平均4.12ms、最大48.26ms（Django测试客户端，不等同网络响应时间）。正常请求不扫描全集，现场复核被引用原文；构建只读诗词投影，不备份整个日常库。
- 主控独立执行诗文测试20项、前端测试10项，均通过。对实际库另执行10组分句→完整句用例，覆盖上述五类来源；补全缺字拒绝、繁简与整句/半句去重、4次独立+1次提示学习完成均通过，捕获正式内容库写SQL为0。
- 主控真实浏览器验证《水调歌头》《把酒问月》《春江花月夜》《月下独酌》的完整句展示与一局完成，提示笺保留标点、揭晓显示完整句；1440桌面、1366首屏输入/提交和390窄屏无横溢出，桌面及窄屏截图已目视。
- 独立证据：`output/feihualing-expansion/control-acceptance.json`、`control-cases.json`、`source-audit.json`及`output/playwright/feihualing-expanded-control-*.png`；实施会话构建日志位于`output/feihualing/expanded-build.log`。未运行全项目回归、远端CI或另一台物理Mac，未提交/推送/部署；8012已重启供本地使用。

## 2026-11-03：场景成语专题

- 新增只读 `idioms` 应用：首页、场景页与词典详情共用现有 `chinese-xinhua-idioms` 当前启用来源。6类、24个场景，192个唯一成语、200个场景词位；8个成语跨场景复用固定身份。192条词头、绑定、义项、读音、核心摘要和人工修订快照均与实际数据库逐条一致。场景例句与提示单独编写并标示，不冒充词典原文或真人审校结果。
- 全量搜索覆盖30,895条当前来源记录，结果按词条去重、每页24条；场景清单外的「画龙点睛」可以查到。来源停用、非就绪、缺词、归并、义项停用、非法跨词条读音、核心词义或人工修订变化会暂停场景关联；相同身份和语义的新版本仍可用。公开词典准入和读音审核状态未改变。
- 主控独立执行 `manage.py test idioms catalog lexicon.tests.test_unified_lookup --noinput`，52项通过；`check`、迁移一致性及本轮差异空白检查通过。首次执行时误写不存在的 `lexicon.test_pages` 标签导致测试加载失败，纠正标签后的上述52项为有效结果。未执行全项目回归、PostgreSQL专项、远端CI或另一台物理Mac测试。
- 主控对日常实际库执行225个读取请求，覆盖24个场景、192个详情、搜索分页/零结果/输入转义/异常输入、首页和词典入口，全部符合预期；捕获写SQL为0，无会话Cookie。批量解析192个引用仅1次SELECT；每个场景读取亦为1次SELECT。没有新增模型、迁移或个人学习状态，基础数据包无需重新导出。
- 实际浏览器已验收桌面三栏、选词、词典详情、多场景跳转、全量搜索和零结果；1440×1000、1366×768及390×844无横向溢出，桌面和窄屏截图已目视。手机采用纵向浏览，不把桌面三栏压缩成小字。
- 场景JSON随Git同步，启动依赖既有基础包而非审计目录。证据位于 `output/idiom-scenarios/manifest-acceptance.json`、`control-acceptance.json` 与 `output/playwright/idioms-control-*.png`。8012日常库和8014原隔离预览库均按原数据库路径重启，当前PID记录在 `output/idiom-scenarios/services.json`。未提交、推送或部署。

## 2026-11-06：古文经典62册接入与基础包重导

- hanzhaodeng/chinese-ancient-text 62 册简体古籍以独立数据集 `ancient-classics` 接入 poetry 浏览管线：九个 collection（蒙学读物5/儒家经典13/史书典籍9/诸子百家8/兵法谋略12/笔记杂谈8/科技博物3/医学典籍2/佛典经文2），62 文档、5,258 篇正文、约1,225万字；VERSION 钉定上游 commit `01a1183c…+native`。collection 全新命名，不与 全唐诗/宋词/诗经/楚辞/蒙学 重叠，详情页双层配对不会串册。
- 资料包 `01e_ancient_classics_2026-11-06.zip`（16.85MB，sha256 `30bc34d6…`）由 `scripts/build_ancient_text_package.py` 确定性生成（manifest+SHA256SUMS+许可索引齐备，上游 commit 钉定），登记进 reference-manifest（11 包）与 scope.py（SCOPE 升为 reference-library-20261106-ancient-classics，激活七包）；IMPORTERS 新增 `poetry.ancient_importing`。
- 与既有诗词导入器共享四张 poetry 表：双方行数与逐行指纹守卫改为按 `PoetryDocument.version` 圈定（`poetry/importing.py` 同步修改）；`lexicon/reference_importing.locate` 固定输入唯一性改为按当前激活包范围判定——修复历史繁体包 `01d_classical_poetry_2026-11-02` 解压残留导致的 locate 重复命中（该残留此前未被任何流程清理，正式导入首跑即暴露）。
- 导入实测：dry-run 7 包 361 文件全过、既有 6 导入器全部 unchanged；正式导入后复跑两轮，古诗文 unchanged 73,676、古文经典 unchanged 5,258，幂等成立。首次导入因路径双前缀错误（poetry/poetry/…）已清理重导。
- 基线重导：48 表 76 分片 2,596,608 行、约 249.15 MiB（旧 64 分片／2,591,219 行／152.27 MiB）；差异仅 poetry 两表（+62/+5,258）与 reference_library 四表（+1 包/+1 数据集/+1 回执/+66 源文件），其余 42 表逐行不变。`verify_base_data` 包校验与 `--database` 现库只读核对通过（同一 digest `991b6e61…`）。
- 导入器对古文 source_data 剔除与 paragraphs 重复的 content 键，避免正文三份冗余；详情页 metadata 展示本就剔除这些键。页面抽验：蒙学读物/儒家经典筛选 200，三字经详情书名为题、无繁简切换（如实降级），飞花令 scope 不收新 collection。`poetry.test_ancient` 7 项通过；`make check` 通过。文档同步：README 当前功能与数据规模、docs/local-development.md 基础包范围、新增 docs/ancient-classics-implementation.md、Makefile `ancient-text` 目标、bootstrap 完成文案去硬编码数字。
- 未运行 PostgreSQL 专项、真实浏览器全面回归或另一台物理Mac验证；未提交、推送或部署。

## 2026-11-06：Unihan 全量属性升 18.0.0

- 目的：消除词库 IICore Unihan 18.0.0 与 reference_library 全量 Unihan 17.0.0 的版本偏差（原设计「17 归档作对照、不导入覆盖当前18」；本次落地 foundation-data-plan 的「18 同版扩展属性」）。
- 新资料包 `01f_unihan_18_2026-11-06.zip`（9,997,293 字节，sha256 `d8277fd2…`）由新增 `scripts/build_unihan18_package.py` 确定性构建：主输入 `data/lexicon/unihan-18.0.0.zip` 与词库同源（sha256 与 registry.json 钉定值一致），附 ReadMe/Unicode 许可（unicode.org 白名单下载）与 selected 字段 normalized 层（仅审计用，导入层不读）。登记 reference-manifest（12 包）；scope.py 换 01c→01f，SCOPE 升为 reference-library-20261106-unihan18。
- 导入器与引用面整体改名：`hanzi/importing.py` 读 18.0.0 包并按新计数守卫（102,999 字／1,479,698 属性行／99 属性名；18.0.0 上游精简属性，较 17.0.0 的 1,555,629 行减少 75,931 行）；dataset code `unihan17`→`unihan18`，`hanzi/views.py`、`lexicon/lookup_sources.py`、`hanzi/tests.py` 同步；`UnihanCharacter.version` 默认值改 18.0.0（迁移 hanzi.0002）。
- 导入实测：先备份日常库，清空旧 UnihanCharacter 102,998 行／UnihanProperty 1,555,629 行与 unihan17 数据集行；`manage.py migrate` + `manage.py import_reference_library` 七包校验与导入全过（45.6s），unihan18 ready，样例「学」=U+5B66 xué、版本字段全 18.0.0；既有导入器 unchanged 幂等。
- 基线重导：48 表 76 分片 2,520,689 行（旧 2,596,608）；差异仅 hanzi_unihancharacter ×2、hanzi_unihanproperty ×4、reference_library 四表与 manifest，其余表不变。`verify_base_data` 通过（digest `a6e99396…`）。
- 全量测试 403 项通过（skipped 14）。文档同步：system-design、foundation-data-plan、reference-library-implementation；Makefile 新增 unihan18-package 目标。
- 未运行 PostgreSQL 专项或另一台物理 Mac 验证；01c 归档包与历史审计文档（reference-audit-2026-11-02 等）按历史证据保留不改写。

## 2026-11-07：挑战题库普通/奥数双轨拆分

- 挑战题库拆成普通与奥数两条轨：`Question.track` choices（`regular/普通` 缺省、`olympiad/奥数`，带索引），迁移 `questionbank.0002_question_track`（AddField 默认值，SQLite 即时完成）；导入管线 `validate_entry` 接受可选 `track`（缺省归普通、非法值拒绝），`SCHEMA_VERSION` 保持 1，旧批次文件仍合法，`content_checksum` 不纳入 track（append-only 不重算旧行指纹）。
- 奥数独立专题入口：`/questionbank/olympiad/` 落地页（题量、按轨统计、错题条、八主题 chips）＋ `/questionbank/olympiad/practice/`（只从奥数轨抽题，`?tag=` 主题过滤，非法主题忽略）；普通路由锁定 `track=regular` 且不接受主题过滤，普通主页计数锁定普通轨并加奥数导流条；错题本两轨共用，默认全部展示并标注轨别徽标，`?track=` 可按轨过滤，重练按钮按轨别指向对应练习路由。首页 `SPECIAL_ENTRIES` 末尾追加「奥数挑战」卡（catalog 测试末位断言同步）。
- 首批奥数题：`2026-11-olympiad-intro` 30 题人工撰写并逐题核对（速算巧算/等差数列/鸡兔同笼/盈亏/还原/行程初步/图形计数/逻辑推理各 3~4 题），choice 4 选项、grade 4、来源 `primary-olympiad`，uuid 由 `question_uuid` 推导、答案下标确定性轮换（分布 7/8/7/8）。导入幂等复跑 `already`。
- 标签过滤在 Python 侧完成（JSON 数组 `contains` 查找仅 PG 支持，SQLite 会 NotSupportedError），`pick_questions` 先取整池再筛标签随机取样。
- 测试：questionbank＋catalog 132 项通过，全量 `make test` 570 项通过（skipped 14）；新增 track 模型/导入/服务/视图用例、数据契约（来源白名单＋奥数轨≥30＋主题≥6）、迁移演练（隔离连接 0001→0002：旧题默认普通轨、指纹不重算、作答记录逐字段保留）。
- 基线重导：`export_base_data --replace` 后 48 表 76 分片 2,520,689 行，manifest `required_migrations` 含 `["questionbank","0002_question_track"]`；`verify_base_data --database` 通过（digest `9cc1f027…`）。
- 8012 常驻服务器（自动 reload，未重启）DOM 目检：普通主页「150 道题＋奥数挑战已开张」、奥数落地「30 道题＋八主题 chips」、奥数练习只出奥数题且不泄漏答案、`?tag=鸡兔同笼` 命中 4 题全同主题、普通练习 20 题无奥数混入、判分 API 服务端判对错并返回解析、错题本奥数徽标与轨别过滤/重练链接正确；目检产生的 2 条游客作答记录已清理（库中作答记录归零）。
- 未运行 PostgreSQL 专项回归；希望杯真题转录（四年级 10 份 PDF）留作后续批次，未经真实浏览器全面回归；未提交。

## 2026-11-07：首页题库分组

- 首页入口区拆为主网格＋专题分组：`SPECIAL_ENTRIES` 支持可选 `group` 键（带组的卡从主网格摘出），`ENTRY_GROUPS` 登记分组元信息（题库组：挑战题库＋奥数挑战，注册顺序展示）；`home` 视图按组拆分并让 `?area=` 学科筛选对主网格与分组同时生效，组卡被筛空时整组隐藏；「探索方向」计数口径不变（仍含分组卡）。
- 模板：入口卡抽成 `templates/catalog/_entry_card.html` partial（主网格与分组共用一个循环），主网格下方新增 `.entry-group` 分组区（组头标题＋说明＋独立 module-grid），`platform.css` 补分组样式。
- 测试：catalog 新增分组断言（组内卡序、主网格不含题库卡、总数口径、math 保留组 / poetry 筛空组）；全量 `make test` 572 项通过（skipped 14）。
- 8012 常驻服务器 DOM 目检：分组区位于主网格与书架之间、组头「题库」与说明渲染正确，主网格不再出现两张题库卡；`?area=math` 分组保留且飞花令隐藏，`?area=poetry` 分组隐藏且飞花令显示。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-07：题库分组改为专题网格内就地成组

- 修正上一条记录的实现形态：不再把分组卡拆到独立区块，改为在专题网格内就地分组——组头行（`grid-group-title`，占满一整行）插在组首卡原位置（模块卡之后），组内卡收拢其后按注册顺序，其余卡位置不动；`home` 视图把带组卡的展示序列压平为「卡片/组头」交替列表（`entry_cards` 单上下文），学科筛选先过滤再压平，整组被筛掉时组头自然消失；总数与筛选 chips 仍按未筛选全量计。
- 模板收回单一 `module-grid` 循环（组头与卡片同循环渲染），`platform.css` 组头样式改为网格内通栏行（去掉独立区块样式）。
- 测试：catalog 分组断言改为就地形态（组头位置、组内卡序、总数含组头行、math/poetry 联动）；全量 `make test` 572 项通过（skipped 14）。
- 8012 常驻服务器 DOM 目检：网格序列为 7 张模块卡 → 组头「题库」→ 挑战题库 → 奥数挑战 → 其余专题卡（多音字殿后）；`?area=math` 组头与两卡保留，`?area=poetry` 组头隐藏、飞花令显示。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-07：首页题库卡改为一张卡内双入口

- 按用户指正的二维模型重构：学科是第一维度（area chips 筛选），普通/奥数是题库玩法内部的第二维度——不应产生横跨学科维度的「题库分组」（前两版分组实现就此废弃）。`SPECIAL_ENTRIES` 新增 `links` 写法：一个玩法一张卡、卡内多按钮（题库卡＝「挑战题库」＋「普通题库→/questionbank/」「奥数挑战→/questionbank/olympiad/」两个入口），`ENTRY_GROUPS` 与组头行逻辑删除，`home` 视图还原扁平卡列表。
- 模板 `_entry_card.html` 支持两种卡形（单链接 `<a>` 卡 / 带按钮的 `div` 卡），`platform.css` 以 `.module-card-links` 替换组头样式。
- 测试：catalog 断言改为「一卡双入口」（卡内按钮名与顺序、area 仍为 math、poetry 筛选不出现/math 出现、末位与总数口径恢复）；全量 `make test` 571 项通过（skipped 14）。
- 8012 常驻服务器 DOM 目检：网格中题库为一张 div 双按钮卡（按钮链接与文案正确），位置在模块卡之后，无组头行、无单独奥数卡；`?area=math` 出现、`?area=poetry` 不出现。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-07：题库入口定为专题标题侧特殊入口＋库内四域同级

- 按用户定稿模型重构首页与题库首页：题库跨学科（内部再分数学/语文/英语/奥数），不进首页专题网格——入口放在专题区标题右侧（`section-aside`：说明句＋「挑战题库→」按钮），网格不再出现任何题库卡；`SPECIAL_ENTRIES` 删除题库条目与 `links` 写法，`_entry_card.html` 还原单一卡形，`.module-card-links`/组头样式全部移除。
- 题库首页改为四张同级领域卡：数学/语文/英语（普通轨计数）＋奥数（奥数轨计数、金色系独立呈现、按钮直达奥数练习与 `?track=olympiad` 错题本），原「奥数挑战已开张」导流条移除；hero 总数与统计按普通＋奥数全轨计，错题条按全轨计。
- 测试：catalog 断言「网格无题库卡＋标题侧入口存在」；questionbank 断言四卡同级（奥数卡计数/链接/错题参数、全轨总数）；全量 `make test` 571 项通过（skipped 14）。
- 8012 常驻服务器 DOM 目检：首页专题网格无题库卡、标题右侧入口指向 /questionbank/；题库首页领域卡序为 数学58/语文32/英语60/奥数30，奥数卡直达 /questionbank/olympiad/practice/。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-07：奥数挑战上首页专题网格

- 应用户要求把奥数提到首页：`SPECIAL_ENTRIES` 末尾追加「奥数挑战」卡（数学向、route=questionbank-olympiad、quiz 图标），点击直达奥数练习入口页；挑战题库整体入口保持专题区标题右侧药丸不变——题库卡与奥数卡分工不再重复（题库=全库入口、奥数=学科向专题）。
- catalog 测试同步（末位卡=奥数挑战、网格含奥数挑战且不含挑战题库）；全量 `make test` 571 项通过（skipped 14）。
- 8012 常驻服务器 DOM 目检：网格 20 张卡、奥数挑战压轴直达 /questionbank/olympiad/，标题侧入口保留。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-07：数学教材改为文件编排（mathbook 试点）

- 新增零模型应用 `mathbook`（照 grammar 先例，按册编排：`/mathbook/` 册次入口（单册自动跳转）＋册页 `/mathbook/<册>/`，册次码对齐 catalog 教材码后缀，新册在 build 脚本 BOOKS 映射加一行）：册页套 base.html 导航，
  内容与交互全在前端（移植 primary/math-app.js：单元切换、要点/例题/易错标签页、
  图示互动演示、点读、搜索、打印、公式速查、易错诊所、B站视频），「已掌握」存
  localStorage；内容源头 primary/math-data.js 经 `scripts/build_mathbook.cjs`
  确定性同步（books/4a.js 数据 + books/4a.json manifest + 共享图示库 + 照片，
  页面数据版本取来源 sha256 前 8 位），加载期校验；未注册册次回 404。
- `make mathbook-data` 跑两遍无 diff；`node primary/test/test-math-knowledge.js`
  通过（源头未动）。共享 `static/figures/figures.js|css` 从 primary 换新
  （补互动演示），`learning/views.py` 与 `item.html` 引用升 `?v=2`。
- catalog 迁移 0008 下架 `primary-math-all`（可逆），基线包重导
  （`export_base_data --replace`）后 `verify_base_data` 摘要一致；仅
  textbookbook 分片与 manifest 变化。
- 全量 `make test`：577 项通过（skipped 14）。8012 常驻服务器浏览器目检：
  见本节末尾补记。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-08：语文教材改为文件编排（chinesebook）

- 新增零模型应用 `chinesebook`（照 mathbook 先例，按册编排：`/chinesebook/` 册次
  列表（列表优先，mathbook 入口同步取消单册自动跳转）＋册页 `/chinesebook/<册>/`）：册页套 base.html 导航，内容
  与交互全在前端（移植 primary/knowledge-app.js：单元切换、课文卡（作者小传/
  原文金句/真实百科/词语/多音字/近反义词/拓展视频外链卡）、必背古诗文（意境图/
  注释/创作背景/诗人小传）、日积月累、字词复习、点读、搜索、打印），「已复习」
  存 localStorage（键改按教材名派生）；内容源头 primary/knowledge-data.js 经
  `scripts/build_chinesebook.cjs` 确定性同步（books/4a.js + books/4a.json +
  共享图示库 + lessons/poems 图片），加载期校验（语文正文禁任何尖括号）。
- `make chinesebook-data` 跑两遍无 diff；`node primary/test/test-knowledge.js`
  通过（源头未动）。
- catalog 迁移 0009 下架 `primary-knowledge-all`（可逆），基线包重导
  （`export_base_data --replace`）后 `verify_base_data` 摘要一致；仅
  textbookbook 分片与 manifest 变化。
- 全量 `make test`：589 项通过（skipped 14）。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-08：英语阅读器套学习页皮肤

- 结论先行：英语教材保留 DB 编排（306 条 ContentEntryLink 词义固定绑定 +
  专用词卡/气泡渲染分支与内容形态匹配），不做文件迁移；视觉统一走皮肤——
  新增 `static/english-study.css`（.study-skin 作用域：重定 --green/--line 等
  变量到学习页 english 主题色 + 卡片实色投影），不改结构不复制组件。
- `collection.html` 与 `item.html` 的英语分支套 `<div class="study-skin">`
  包裹层并加载皮肤（english.css 本体不动，仍 ?v=2）。
- 全量 `make test`：589 项通过（skipped 14）。8012 服务器 DOM/截图目检：
  册页与课文 tab 暖底 + 英语绿强调生效（--green 解析 #5e9f7a、词卡
  0 3px 0 投影），英语内容页 skin 挂载确认。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-08：首页书架与科目筛选下线，英语模块页成教材同步册专属书架

- 语文/数学改文件编排后书架只剩英语两册：首页删除「教材书架」区与筛选表单
  （hero 按钮改指模块网格），`module.html` 非落地分支删除筛选表单——英语模块页
  成为教材同步册专属书架；`/api/v1/catalog/`、`/api/v1/items/` 的筛选口径保留
  （CatalogFilter/filter_books 仅服务 API）。`filters.html` 模板删除。
- 测试：test_home_and_filtered_catalog 改断言首页无书架、API 筛选不变；
  test_area_filter_single_select 去掉书架参数透传断言；test_home_shelf_renders_
  textbook_section_only 改在英语模块页验证书架网格。全量 `make test` 589 项通过。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-08：注册与改密取消密码复制度限制

- 自用家庭系统定位：AUTH_PASSWORD_VALIDATORS 清空（长度/常见密码/全数字/
  与用户名相似四项全不拦，注册、改密、后台同口径）；注册表单只保留
  「两次输入一致」，help_text 改为「给自己一个好记的密码就行」。
- 测试：原「弱密码拒绝」断言改为「1234 直接注册成功」（独立会话避免注册
  成功登录影响主会话），重复注册与两次不一致口径不变。全量 `make test`
  589 项通过（skipped 14）。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-09：激励系统（积分 + 勋章 + 连续打卡 + 兑换奖励）

- 结论先行：新增独立 `incentives` 应用——学习动作完成后自动发积分、自动
  打卡、点亮勋章；积分可在家长后台配置的奖励项上兑换、家长核销或退回。
  设计决策（用户确认）：学习即打卡（无手动签到）、积分可兑换、完成给大分
  ＋答对给小分（答错不扣分、每类每日上限防刷）。
- 数据：PointEvent 正负流水单一账本（余额即求和）、CheckIn(user,date) 唯一、
  BadgeAward(user,badge) 唯一、RewardItem（家长后台配置，无种子数据）、
  Redemption（待核销/已完成/已退回 + cost 快照）。纯增量迁移 0001，旧库
  直接升级成功，无数据触碰。
- 规则集中在 `incentives/rules.py`（14 个发分事件 + 称号 5 级 + 勋章 28 枚），
  `validate_rules` 测试自检；勋章判定取源数据表计数，对存量学习记录追溯
  补发。hooks 挂 11 个服务层写入点，仅状态跃迁发分；`record_event` 整体
  兜底异常，激励故障不阻断学习主流程。激励仅登录用户，游客路径零改动。
- 页面：`/rewards/`（打卡日历/勋章墙带进度条/兑换专区/积分明细/规则表）、
  导航「我的奖励」（trophy.svg 新图标，登录可见）、登录态首页激励条；AJAX
  响应带 `rewards`，11 个前端 JS 经共享 `reward-toast.js` 弹庆祝条，教材表单
  路径走 messages。Nova「学习记录」组新增 incentives 五个模型（兑换带核销
  /退回 admin 动作，流水/打卡/勋章只读）。
- 测试：`incentives` 33 项（规则自检、发分/上限/打卡连击含跨月、勋章追溯、
  兑换/退回、奖励页、plurals 上报端点集成、record_play/save_draft/教材跃迁
  矩阵）；全量 `make test`：622 项通过（skipped 14），游客与既有行为零回归。
- 8012 冒烟闭环（真实 server）：注册冒烟账号 → plurals 答对（返回 rewards：
  +1 分、打卡 1 天、点亮「第一次打卡」）→ 再答不重发、答错无激励 → 后台配
  奖励项「周末公园郊游」2 分 → 页面兑换成功（消息提示 + 待核销 + 余额 0）→
  shell 核销（已完成）→ 再兑换后取消退回（余额还原 5，流水含 redeem/-2 与
  redeem_refund/+2）→ 余额不足拒单文案正确。冒烟账号与测试奖励项已删除，
  五张激励表残留为 0。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-09：数学公式专题（小学全覆盖 + 初高中框架）

- 结论先行：新增零模型只读 app `mathformulas`（照 grammar 先例）——
  `/mathformulas/` 左右工作区布局（左 sticky 章节导航 + 搜索、右公式组卡流），
  hero 学段切换走服务端 `?stage=`（小学/初中/高中，非法参数与跨学段 chapter
  一律回退），重点完善小学 1-6 年级全覆盖。
- 内容：Git 跟踪 `mathformulas/data/formulas.json`，公式组沿用 math-data.js
  公式速查形状 `{title, items:[[名称,公式],…], note}`。小学 10 章 42 组 157 条
  （数的认识与整除/数的运算/式与方程/分数与百分数/比与比例/平面图形/立体
  图形/常考数量关系/单位换算/统计与可能性）；初中、高中各 5 章框架 + 打底
  公式（9 组/7 组，标「整理中」）。`content.py::validate` 契约校验：学段归属、
  章节唯一、二元组形状、文本契约（禁英文双引号/裸换行/HTML 标签）、规模下限
  （小学 ≥8 章/36 组/150 条），数据坏拒绝上线；data/README.md 记维护口径。
- 注册：INSTALLED_APPS、`/mathformulas/` 路由（name `math-formulas`）、
  `SPECIAL_ENTRIES` 数学区专题卡（新图标 formula.svg）；不进顶部导航（与
  phrases/plurals 同口径）。
- 测试：`mathformulas` 16 项（数据契约、validate 拒坏数据、?stage/?chapter 分
  视图与回退、GET 零会话、首页专题卡渲染）；全量 `make test` 638 项通过
  （skipped 14）。catalog 既有守卫测试「专题卡殿后」断言随注册顺序更新为
  「数学公式」。
- 8012 冒烟 + 截图目检（桌面 1440px）：小学默认页（10 章·42 组、公式行左右
  两栏式）、`?stage=junior`（整理中徽标、数与式 3 组）、`?chapter=plane`
  （圆环面积/周长公式）、跨学段 chapter 回退到该学段第一章、首页数学卡可点
  达；Unicode 数学符号（a²、aᵐ⁺ⁿ、√、π）渲染正常。
- 未运行 PostgreSQL 专项；未提交→随本次提交入库。

## 2026-11-09：初始化与项目诊断修复

- 在仓库目录和没有同级资料目录的独立副本内分别验证空库初始化与再次只读校验。基础包恢复 48 表、2,522,359 行，七个资料包恢复 354 个文件。三批题库共 211 题，复跑零新增。实际查询确认 Unihan 18 有 102,999 条汉字记录，577 个场景词目标均有中文采用记录。缺失资料的只读校验未创建资产目录。
- SQLite 全量 641 项（626 通过、15 跳过），PostgreSQL 全量 641 项（639 通过、2 跳过），Node 前端回归 22 项通过。迁移一致性检查通过。覆盖发分并发上限、重复退款、作答重试、游客草稿登录往返、单词与课文分流、词库切换后即时降级。
- 用同一隔离库比较诗词题材调整前后的分类结果，内容一致。实测猜成语首次约 0.7 秒，诗词四季约 1.7 秒，飞花令预建索引后的首次请求约 0.45 秒。耗时为本机 Django 客户端测量。

## 2026-11-09：题库统计和猜成语判分

- 普通数学和奥数分开统计。错题首页、错题本与重练入口统一使用仍启用且最近一次答错的题。
- 使用隔离库的真实词库验证猜成语。请求缺少 CSRF 凭据时被拒绝。登录账号重复提交和游客只带原 CSRF Cookie 重试都只生成一条记录。PostgreSQL 同题并发提交两次，仅落一条作答并发放一次积分。
- SQLite 645 项（630 通过、15 跳过），PostgreSQL 645 项（643 通过、2 跳过），Node 前端回归 27 项通过。新增迁移与基础包一致，空库初始化和再次只读校验均通过。

## 2026-11-09：学习足迹回访和语法章节练习

- 「我的学习」的作文和场景单词分别链接到草稿 UUID 和词卡目标。覆盖草稿跨账号隔离、从链接打开不在最近列表中的草稿、保留未保存修改，以及同拼写词卡定位。
- 用实际语法题批次验证从讲解进入章节练习、作答进本章错题本、答对后退出错题本。关闭的题和其他来源的题不会进入本章题池。
- SQLite 全量 647 项（632 通过、15 跳过），Node 前端回归 30 项通过。迁移一致性检查通过。

## 2026-11-09：数学教材账号进度

- 覆盖跨浏览器续读、账号切换、过期版本、CSRF 校验和显式导入。游客仍可使用原有本机存档。「我的学习」展示该账号的数学掌握数和续读链接。
- SQLite 全量 653 项（638 通过、15 跳过），Node 前端回归 33 项通过，数学源数据 2438 项断言通过。迁移一致性检查通过。
- 隔离库空库初始化及再次只读校验均通过。已有账号和作文草稿在迁移后完整保留，新增数学进度表纳入基础包刷新保护范围。

## 2026-11-09：数学教材直达练习与分开计数

- 用实际题库批次验证四上知识点直达对应例题，易错诊所只抽本册判断题，停用的例题从教材入口移除。题库和学习足迹分开计自评与客观答对。
- 使用隔离库渲染页面，在 Playwright 中点通知识卡、例题自评、返回原知识点和标为已读。390px 下回访页面无横向溢出。
- SQLite 全量 658 项（643 通过、15 跳过），Node 前端回归 36 项通过，数学源数据 2438 项断言通过。迁移一致性、空库初始化和再次只读校验均通过。旧版数学账号的掌握标记和续读位置在升级后保留。

## 2026-11-09 基础数据修复

- 题库已导入批次逐题核对来源、内容和轨别，验证了题目缺失和轨别错放会报错。跨模块编排保存被拒绝，公开查询也排除绕过保存校验的错误编排。
- 斯瓦尔巴特的面积显示为来源未提供，原始负值留在来源字段。四上判断题包含 15 道正确陈述和 15 道错误陈述。场景词卡 `maths book` 显示 `/mæθs bʊk/`。教材词库绑定和中文采用均为 310/310。
- 新版基础包在空库恢复 48 表、2,523,907 行、354 个资料文件及 226 道题。再次启动校验无新增。SQLite 全量 662 项（647 通过、15 跳过），前端回归 36 项通过，迁移一致性检查通过。静态词卡音标断言通过，静态词卡全量测试仍有一项既有的相关词释义覆盖失败，已在修改前版本复现。
- 日常库副本完成 18 条迁移，外键检查通过。基础数据刷新因 3 条接龙记录及有差异的中文版本、核对和采用历史被保护机制拒绝。迁移后副本仍有这 3 条接龙记录和 60 条中文核对记录。
