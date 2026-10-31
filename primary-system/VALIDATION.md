# 验证记录

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
