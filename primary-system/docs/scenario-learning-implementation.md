# 场景词卡目标实施报告

2026-11-02，primary-system 本地实施。代码保留未提交；没有新建分支、推送或部署。沿用原工作区，其他目录及上一阶段未提交改动保留。设计与验收矩阵见 [scenario-learning.md](scenario-learning.md)。

## 最终模型与语义

- `LearningTarget`：UUID，能力限定 `card`，固定 Sense、可选 Pronunciation、不可变来源证据和选用时人工修订快照。保存自动校验义项／读音／证据一致；创建时锁定并重新读取修订值，避免调用者缓存的旧对象污染快照。已有身份及快照不可改写。
- `ScenarioWord`：场景编排，保留旧主键、词形、标注、创建时间、原 entry 追溯字段；新增 target、order、导入基线。数据库按场景＋目标唯一，不再限制英文全局唯一。旧 entry 不用于释义；归并后由稳定 Sense 身份找到当前词条。
- `WordProgress`：账号或游客＋目标唯一，归属互斥；仍表示该词卡掌握。保留原主键、true/false、更新时间、旧词位关联和永久追溯编号，增加 revision。删除编排仅将旧词位关联置空，目标与进度仍在。
- 同目标跨场景共享词卡状态；不同目标即使同形、同场景，也不共享。不会推断拼写、听辨或同词其他义项掌握，不自动合并登录与游客数据。

词库来源停用、未就绪、删词、核心字段变化、词条／义项停用，都会暂停对应释义／音标并显示待复核，保留目标、标注、原证据及进度。回退同一核心语义可恢复。人工修订的 revision 或实际值变化也会暂停，即使有人绕过修订服务直接改字段也不能旁路展示；新建并显式选用已复核目标后才显示新版，旧进度不转移。关联词存在多个目标时不按拼写选义；已知词库词形不从旧拓展表补回停用释义。API 不下发被暂停的历史快照正文。

## 迁移与保护证据

新增 `words.0003_learningtarget_alter_scenarioword_options_and_more`，逐个旧词位创建目标，不按拼写合并。唯一生效证据才自动关联；缺失／多义保留待复核目标和候选清单。新增 `0004_learningtarget_editorial_snapshot` 固定人工修订值及版本；没有改写已应用的0003，也没有改动此前专题清理迁移。

真实日常库没有旧 WordProgress，因此不能把真实库升级结果当作历史进度保留的全部证明。独立历史迁移用例另建 3 张旧词卡（唯一证据、多义、无证据），6 条账号／游客记录，覆盖 true/false 和固定旧时间，逐字段断言原记录与标注保留；多义／缺证据目标保留待复核，不猜选。SQLite 与 PostgreSQL 均通过。旧代码未保存学习时的词义版本，不能反推旧时间点的历史释义；迁移保留的是原词卡掌握声明。

证据目录：`/Users/apple/Documents/GitHub/Study/output/primary-system-audit/2026-11-02/targets/`。

| 验证 | 结果／文件 |
|---|---|
| 真实库副本0002→0003 | `rehearsal-before-result.json`：40张原表、312,826行，所有原字段逐行SHA256一致，577条词位→目标映射，0待复核，完整性ok |
| 日常库0002→最终结构 | `daily-before-result.json`：相同原字段逐行保护通过；577个旧词位和原教材／词库身份保持 |
| 日常库0003→0004 | `daily-before-editorial-result.json`：41张表、313,408行原字段逐行一致，包括577个已有目标UUID |
| 新增行解释 | 0003新增577个目标，以及正常post_migrate新增1个ContentType、4个权限；没有新增日常账号或进度 |
| 恢复点一 | `before-learning-targets.sqlite3`，SQLite backup，迁移前0002状态，0600，保留 |
| 恢复点二 | `before-editorial-guard.sqlite3`，SQLite backup，0003后／0004前，0600，保留 |
| 前一阶段恢复点 | 原 `../before-catalog-upgrade.sqlite3` 等未覆盖、未删除 |

报告保存每行原字段摘要和明确映射，不保存业务行正文；会话主键使用摘要，报告权限0600。回退本阶段需要停止服务，使用相应恢复点及匹配代码；迁移故意不提供可能丢失新目标／进度的反向删除操作。不要删数据重导代替回退。

## 导入、接口与后台

导入事务内锁来源；dry-run执行相同选择和校验后回滚。按场景＋目标新增编排，复用唯一明确的目标，保护已有场景字段、排序、教学标注、人工修订和进度，不删除输入中缺失的对象。多义、身份冲突、人工修订变化报告后跳过；可用target_id或evidence_id明确选择，二者同时提供必须一致。需要同步更新已有教学标注时由维护者在后台修改，重复导入不覆盖。

真实副本预演／重跑均为46场景、577 preserved，0新目标、0新词位、0未匹配／歧义／冲突，见`import-dry-run.json`、`import-repeat.json`。独立测试覆盖同词两场景、同形不同义同场景、人工修改保护、删除编排和幂等。

API schema_version=2，写入使用target_id、learned、revision；旧word_id请求返回409要求刷新。服务锁稳定目标后比较revision，首写也串行；数据库归属／唯一约束兜底。过期请求返回409，不覆盖最新记录；前端保留已知状态、提示刷新，并在成功时同步所有共享目标的词位。

后台可创建明确的学习目标，已有目标身份／修订快照只读；可新增、删除、重排编排及修改标注。新增编排自动从目标派生历史entry字段，不需要手填旧引用。进度后台只读。维护账号需要对应words模型权限和词库查看权限；本轮未改写既有权限组。

## 实际验证

| 检查 | 最终结果 |
|---|---|
| SQLite完整回归 | 158项：155通过，3项PG专用跳过；`sqlite-tests-final.log` |
| PostgreSQL18.6完整回归 | 158/158；`postgres-tests-final.log`，随机隔离迁移schema与独立测试库已销毁 |
| 并发首写 | 同游客／同目标两次revision=0：一次保存、一次409冲突，只有1条记录；后续过期写入不覆盖 |
| 前端Node | 9/9；`frontend-tests.log`，包含共享目标同步、409保留状态及原连读／错误反馈回归 |
| 空库bootstrap | `fresh-bootstrap-final.log`成功，含0003/0004；4教材册、394内容，词库暂存，不自动启用，不创建默认账号 |
| 系统检查／迁移漂移／diff空白 | 通过；最终migrate计划为空 |

真实Playwright使用独立库副本，临时增加共享编排和修订后目标，不写日常库：

- 桌面1440×1000：原场景浏览、释义、音标、教学标注正常；classroom标记后教室与共享场景计数同步，刷新仍保留；搜索可找到同目标的多个编排。
- 390×844：单列词卡、掌握按钮与标注正常，页面无水平溢出。截图已实际查看。
- 两个标签页同时持有旧revision：第一页200，第二页409并显示“记录已在其他页面更新，请刷新后再保存”；刷新读取最新状态。
- 真实SpeechSynthesis有180个voice，连续收到classroom、window、door的end事件；单点classroom也收到start/end。队列按语音结束推进；不能替代人工听音或真实手机发音质量验收。
- 人工修订验收：两个旧classroom编排保留相同目标与learned=true，但释义为空、状态待复核；新选目标显示校订释义且learned=false，见`browser-editorial-guard.log`。最终390px检查无溢出，当前页面console为0 error／0 warning；跨标签页的409是预期冲突。

截图位于`/Users/apple/Documents/GitHub/Study/output/playwright/primary-targets-{desktop,mobile-search,mobile-card,editorial-review}.png`。单点与修订验证记录在`browser-single-reading.log`、`browser-editorial-guard.log`、`browser-final-viewport.log`。

## 最终运行状态与范围

日常数据库仍为`primary-system/db.sqlite3`：46场景、577编排、577目标，释义／音标577/577；4教材册、32单元、394内容／编排、306教材词库关联，6来源、46,156来源记录。日常账号0、场景进度0，未塞入测试记录；完整性ok。详细数量见`final-data.json`。

日常服务保留在`127.0.0.1:8012`，最终PID **87474**，日志`targets/runserver-8012.log`，当前PID同时记入`targets/runserver.pid`及上一阶段目录的`runserver.pid`。本轮8013验收服务、Playwright会话、rehearsal/fresh临时数据库已清理；备份、摘要、测试日志和截图保留。

本轮改动：words模型／服务／API／后台／导入与测试、新增0003/0004迁移，static/words/words.js，scripts/test_frontend.cjs与verify_words_upgrade.py，以及README、设计／本地开发文档、本报告和VALIDATION。其他领域代码没有作为本阶段扩展目标；原工作区的既有未提交改动完整保留。

剩余边界：未上线，未创建学习账号；学习能力目前只有词卡掌握。历史学习时版本无法逆推、游客无cookie的首次独立请求无法事先识别为同一归属；已建立会话后多标签页使用稳定游客键。已有旧游客键保持，不登录合并。词库内容审校、真实手机听音、跨学科总览仍属于后续工作。本阶段没有复原TopicBook、复制词典或建设全平台进度框架。
