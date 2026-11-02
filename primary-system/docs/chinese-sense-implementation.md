# 中文义项版本与学习记录实施

2026-11-02，实施完成，代码未提交／推送／部署。设计依据 foundation-data-plan §3/4/7；本轮只做词义中文版本、场景呈现及教材关联保护，不导入大语料。

## 设计决策（先行复核）

1. lexicon 新建不可变 ChineseSenseVersion：明确 Sense、SourceRecord、读音、原文字形与人工修订快照，zh-Hans-CN 中文正文／例句，翻译／教学解释／纠错类型、上版、生成与来源说明、核对人／时间／说明、学习含义分类。正文从创建起不可修改／删除；确认、撤回是另存的状态与审计，不能改变原正文。原英文及 gloss_language 不改。
2. 目标／教材关联显式持有采用版本与采用 revision；每次采用写不可变历史。仅确认、未撤回且与固定证据／修订快照完全一致的中文可用。来源失效、人工修订变化、实际固定字段变化会暂停正文（仅entry归属变化不暂停），API 不夹带旧中文／英文正文。没有中文采用的既有卡走明确 legacy 路径，不假称新中文已审校。
3. 同义呈现升级必须经维护者明确确认不改变含义。纠错变义版只能先用于尚未编排／未写进度的新目标，原目标及掌握不转移。教材内容掌握仍属于 ContentItem：变义／换义项、读音、证据须新内容身份，不覆盖原关联；旧收藏／笔记／掌握保持。原关联的重新确认仅允许显式同义声明，并保存旧选择历史。
4. WordProgress 新增最近一次状态所见中文版本／采用 revision，旧行保持 null。API schema3 同时提交目标 UUID、进度 revision、所见中文 UUID（可为 null 的 legacy）、采用 revision；过期页面或采用切换竞争返回409，不能把旧页面写成新版。只追溯最近一次状态，不新增通用事件史。
5. ContentEntryLink 补固定人工修订快照、选择 revision、中文采用及不可变选择历史。现有306条只冻结迁移时的选择，不能逆推过去学习时所见释义。来源／人工修订变动暂停词典区，禁止回退到词卡 source_payload/sections 中的旧释义旁路。
6. 业务写入由服务／维护命令实现，后台不可直接改采用指针、已确认正文或固定身份。统一锁顺序为来源→义项→读音→中文版本→教材父内容（适用时）→目标／教材关联；版本切换、修订、确认及进度提交依此形成可验证边界。

## 迁移与兼容方案

新增正式迁移，不重写0003/0004。先SQLite backup及逐行摘要→隔离空库与真实副本升级→通过后新恢复点升级日常库。保留所有原字段／ID／private progress，WordProgress 新呈现字段 null，不补造历史。教材选择快照以迁移时实际值填充并明确“继承旧关联”，不宣称历史审校。旧schema写入要求刷新。代表样例仅在隔离数据库使用，不声称577词位／306教材关联已全部中文审校。

## 验收重点（最终结果见下）

- 所有教材词典消费者、降级路径与关联API，尤其 record_payload 的当前人工修订泄漏。
- 教材重选对既有 mastered 的语义：同义确认可保留，改义须新 ContentItem，绝不清空旧私人数据。
- 多标签页旧中文提交、首次采用／撤回与源修订的PG竞争；跨形归并继续跟随稳定Sense，显示固定教学词形，不因entry归属变化暂停。
- 空库、真实副本、历史null、重复导入／人工保护、同义跨场景／同形异义、桌面及390px闭环。

下文为最终实现、验证与运行证据；主控维护独立验收文档。

### 主控补充后的进度与CAS决策

教材表单增加“明确更新学习状态”动作。仅改收藏／笔记保留原status及原学习依据，绝不把新采用版补写为已见；旧mastered无依据时显示“历史掌握，依据未记录／待确认”，不计入当前已确认掌握。显式更新状态才保存当前呈现依据。/me/、详情与首页使用同一个有效状态函数。经确认的同义中文升级保留有效掌握；变义使用新ContentItem，因此不会继承旧进度。

创建中文草稿、确认、采用及教材重新确认均带调用者所见的修订快照／review_revision／采用revision做CAS；上锁只保证串行，不代表同意采用锁后最新值。中文版本固定选择，确认时若当前来源／修订与该版不一致则拒绝。旧页面不会由服务器填当前呈现版本后冒充已见。


## 最终模型与学习语义

- `ChineseSenseVersion` 独立保存 zh-Hans-CN 解释及可选中文例句、translation/teaching/correction 类型、人工／来源／AI出处、工具及术语版本、作者、上版、变更依据和 same/changed/unknown 学习含义分类。固定 Sense、可选 Pronunciation、SourceRecord 及实际人工值／revision。正文从草稿创建起不可改写／删除；修改须新建版本，英文原文与 Sense.gloss_language 不变。AI草稿必须登记生成工具。
- `ChineseReview` 保存每次确认／撤回的核对人、说明、时间、review revision。确认须来源就绪且固定字段仍一致；unknown 不能确认。撤回永久保留正文与引用，不能原地重新启用；需要新版本。来源失效是派生的待复核状态，不覆盖旧正文或伪造新的核对事件。
- 场景目标增加显式中文指针和 presentation_revision；`TargetChineseAdoption` 记录每次采用。旧目标只允许从当前采用版直接升级到确认同义的下一版，不能跳越 changed/unknown 链。首次未采用中文不等于新目标：legacy 映射、编排、进度、采用历史及永久 semantic_established 标记都保留其已有语义事实。删编排／进度不会重置它。真正从未使用的新身份可将明确已确认版本作为初始中文，不继承任何旧进度。
- 中文 adopted 组合逐字段比对 Sense、Pronunciation、evidence、editorial snapshot，same 声明不能放宽这些绑定。换义／换读音／换证据须新目标；不同义项即使同形也不共享。仅词条归属的归并不改变稳定义项：孩子继续看到固定 target.label 或教材 selected_headword。
- `WordProgress` 只增加最近一次状态所见中文版本及采用 revision，旧行保持两个 null。schema3写入同时验证目标UUID、进度revision、所见中文UUID（legacy为null）及采用revision。版本切换／来源失效／撤回后的旧页提交409；合法先提交旧版则仍记录旧版，不能被并发采用伪装成新版。账号／游客不合并。
- `ContentEntryLink` 固定选择与选择 revision、中文指针及采用revision；`ContentLinkSelection` 是不可变选择历史。迁移只冻结当时实际选择，不推断过去版本。中文同义更新追加历史；非中文旧关联可在准确CAS和明确同义声明后重新确认纯释义表述，旧快照留档。读音修订即使声明同义也须新内容；已有中文采用遇英文人工快照变化时采取保守边界：使用新教材内容重新选用，不原地解除旧选择。
- 教材变义／换义项／读音／证据须新 ContentItem，不继承其 Progress。旧内容、编排、掌握原值、收藏、笔记均保留。仅保存附注不更新 status 或学习依据；明确勾选学习确认才保存当前所见引用。历史 mastered 无依据时显示“历史掌握，依据待确认”，详情、/me/及首页一致，不计作当前确认掌握。同义采用可保留已有有效掌握，旧 seen 仍不改写为新版本。

## 读取保护与请求规模

词卡／教材固定关联来源失效、删词、核心字段或人工修订值/revision改变、义项停用或中文撤回时，正文和音标停止下发；源生成memo、拆分描述及自定义say一并暂停，数据库原标注不删除。恢复固定语义／显式合法重新选择后才恢复。不能用旧summary/body/sections、source_payload、拓展词表或缓存补回。

保护覆盖场景HTML/JSON、教材详情/关联API/通用item API、目录摘要、教材搜索、词典相关教学卡片和打印所用DOM。**从未绑定的独立人工教材卡保留原内容路径**；已固定关联不可通过删除关联退回旧副本（历史保护引用阻止删除）。教材main及所有secondary slot均实际展示；普通非word教材使用“本课词义参考”列表，表单所记录集合等于页面可见集合。

`LessonResolver` 在每个请求中批量读取关联、当前来源和中文状态，搜索与页面／掌握汇总复用同一结果；不跨请求缓存。306条有效掌握的隔离副本：中文搜索13次SQL、首页11次、个人页5次，均200；证据 `performance-after.json`。80条规模查询上界回归也通过。主控独立复测得到相同13/11/5，替代实施初期1416/927/921次查询。

## 维护者实际操作

后台可只读检查中文版本、核对记录、目标采用及教材选择历史。创建／确认／采用用本地命令 `chinese_sense`；不新增公众写入入口，不改变既有权限组。原始关联、目标身份及已采用指针不能通过后台表单直接重写。

```sh
# 先核对固定证据、原始释义/读音及实际修订快照
.venv/bin/python manage.py chinese_sense inspect --id EVIDENCE_UUID
# 编辑JSON，明确保存刚才核对的expected_snapshot；先预演
.venv/bin/python manage.py chinese_sense create --input draft.json --dry-run
.venv/bin/python manage.py chinese_sense create --input draft.json
.venv/bin/python manage.py chinese_sense inspect --id VERSION_UUID
.venv/bin/python manage.py chinese_sense review --input review.json
.venv/bin/python manage.py chinese_sense adopt-target --input adopt.json
# 教材用adopt-link；撤回用review且decision=withdrawn
```

`draft.json` 必需字段：evidence_id、expected_snapshot、text、kind、learning_effect、author_label、provenance、change_reason；可选example、previous_id、origin、generation_tool、terminology_version。原快照结构是sense_revision/definition/pronunciation_revision/pronunciation，不能由服务端把旧输入补成最新版。

`review.json`：version_id、expected_revision、decision(confirmed/withdrawn)、reviewer、note。`adopt.json`：target_id（教材为link_id）、version_id、expected_revision（目标／关联采用revision）、expected_review_revision、reason。CLI与服务都校验所见CAS，撤回或修订竞争不会静默选新值。

新语义用`new-target`（label、version_id、expected_review_revision、reason），确认后再编排。教材先建独立新ContentItem且不要提前编排／写学习记录，再用`new-link`（content_id、evidence_id、expected_snapshot、reason）和`adopt-link`显式采用，随后编排。旧关联纯释义表述的显式重新确认用`reconfirm-link`（link_id、expected_revision为选择revision、expected_snapshot、same_meaning=true、reason）；它不允许换义项／读音／证据或绕过已有中文保护。所有写命令支持dry-run事务回滚。

## 接口兼容

场景state返回schema_version=3，每张词卡下发chinese_version_id、presentation_revision和presentation_mode(chinese/legacy)，正文只含可用呈现。POST示例：

```json
{"schema_version":3,"target_id":"目标UUID","revision":0,"learned":true,"chinese_version_id":null,"presentation_revision":0}
```

旧schema2请求返回409要求刷新，不能自行补当前版。已有未采用中文的卡仍用固定来源／人工快照的legacy呈现，不把旧中文存在当成本轮审校。

教材Progress GET提供presentation（页面实际展示的所有关联token）；有关联的POST须原样提交presentation及显式update_learning布尔值。仅附注设置false，不能重新认证掌握；status仍保留原值。普通无关联内容保留原接口。API保留原status并提供effective_status，避免历史mastered被当作当前掌握。关联API schema2及通用item的lexical_references包含每个可用／待复核引用，不包含失效正文；原内容schema_version仍表示原分节结构。

## 迁移、保护证据与实际结果

只新增五条正式迁移：lexicon.0004/0005、words.0005/0006、learning.0002，未改写之前已应用的迁移。新增中文／核对／采用／选择历史四表；为旧306条教材关联冻结选择并建立初始历史，577个已有目标标记已有语义。日常没有生成中文版本或中文采用，不补造历史呈现。

证据目录：`/Users/apple/Documents/GitHub/Study/output/primary-system-audit/2026-11-02/chinese/`。

| 验证 | 实际结果 |
|---|---|
| SQLite完整回归 | 184项：175通过，9项PG专用跳过；sqlite-tests-final.log |
| PostgreSQL18.6完整回归 | 184/184；postgres-tests-final.log；独立随机测试库已销毁 |
| PG真实竞争 | 同版本确认、草稿创建vs源修订、采用vs旧呈现提交、采用vs源修订、撤回vs状态写入、教材关联与编排首次并发；所有合法顺序保留真实已见，冲突不伪造最新版 |
| 父行锁 | 来源→义项→读音→中文版本→ContentItem→关联；首建关联、编排、教材学习写入共用父行锁，并保留当前编排／进度exists兜底；永久标记不因删除重置 |
| 非空历史升级 | ChineseMigrationTests在SQLite和PG隔离库升级旧结构，逐字段保留内容／关联／目标／词位、账号true及游客false、时间、教材mastered/收藏/笔记；两类新seen字段均保持null，旧英文及gloss_language不变 |
| 空库bootstrap | fresh-bootstrap.log成功，含全部新增迁移；4册394内容，词库暂存，0中文版本／账号／进度 |
| 真实副本逐行保护 | rehearsal-before-result.json：41张原表、313,408行，原列逐行SHA256一致，目标/词位映射不变，integrity ok |
| 日常库逐行保护 | daily-before-result.json：相同41表313,408原行原列不变，integrity ok |
| 新恢复点 | before-chinese.sqlite3，SQLite backup，0600；此前catalog/targets恢复点未覆盖或删除 |
| 主控独立业务摘要 | chinese-control/daily-original-rows-result.json：32张业务表313,132行原列无增删改，integrity ok（主控执行，本实施未运行或修改其校验脚本） |
| 导入／维护预演 | 代表性采用后重复场景导入保留人工标注及采用，dry-run回滚；原始教材导入既有get_or_create不覆盖选择；对应回归及import-dry-run.json/import-repeat.json |
| 前端 | Node 9/9；frontend-tests-final.log |
| 系统检查 | check、makemigrations --check --dry-run、diff --check通过，migrate计划为空 |

真实Playwright使用独立rehearsal数据库，样例包含classroom跨场景复用、bank银行／河岸独立义项、教材ability及同义B版和中文例句；均为隔离样例，不是全库审校。

- 桌面1440×1000与390×844正常展示中文及例句，无横向溢出，截图已实际查看。
- 游客保存classroom A后两个场景共享状态；登录账号未合并游客记录。账号在B页保存成功，另一个持A的标签页409，旧页保持已知false、不显示保存成功。
- 数据库保留游客seen A/采用1及账号seen B/采用2，均是各自实际状态写入的呈现。教材明确确认A后，在B页只改笔记，原seen仍A/采用1，status保持mastered且笔记更新；不因保存附注补记B。
- 撤回classroom B后保留learned及旧正文，儿童API的zh/memo/segments清空，无旧释义或拆分say旁路。主控另在独立8024完成四项行为探针及浏览器验收，见其独立验收文档。

浏览器证据：browser-guest-shared.log、browser-lesson-before.log、browser-lesson-confirmed.log、browser-b-save.log、browser-old-tab-conflict.log、browser-note-only.log、browser-progress-evidence.json、browser-withdrawn.log。截图：`output/playwright/primary-chinese-{desktop,words-mobile,lesson-mobile,withdrawn-mobile}.png`。预期409会产生浏览器网络console error，未将其误报为功能异常。

## 日常状态、清理与剩余边界

日常仍是4册32单元394内容／编排、306教材关联、46场景577词位／目标、6来源46,156来源记录。新增306条初始选择历史；中文版本、中文核对、采用、账号、两类学习进度均0。当前577张场景卡仍是legacy固定呈现，**没有声称577词位或306关联全部完成中文审校**。详见final-data.json。

日常服务保留`127.0.0.1:8012`，最终PID **72398**（最终代码已重启，首页／词典／登录HTTP200）；当前PID及日志位于chinese/runserver.pid、chinese/runserver-8012.log，父审计目录runserver.pid同步。临时8013服务、Playwright会话、rehearsal/fresh数据库及含会话凭据的browser-auth.json已清理，保留备份、摘要、脚本、测试／浏览器记录和截图。

本轮代码文件：lexicon/models.py、chinese.py、services.py、views.py、pages.py、admin.py、management/commands/chinese_sense.py及新增迁移／三组测试；words/models.py、services.py、views.py、admin.py、tests.py及新增迁移；learning/models.py、services.py、views.py、forms.py及迁移；catalog/models.py、views.py；四份learning模板（含新增lexical_references.html）、static/words/words.js、scripts/test_frontend.cjs；README、本地开发／系统设计／场景设计、本报告和VALIDATION。未修改主控的foundation-data-plan.md或chinese-sense-acceptance.md。

边界：历史未记录的呈现不反推，进度只记录最近一次状态，不是完整学习事件史；同义分类仍需维护者核对语义真实性。旧目标升级只支持直接前驱，不自动遍历／推断多跳链。绑定失效期间暂停全部无独立版本的memo／拆分提示，存储原文保留；从未绑定的人工卡仍由其教材内容本身负责。已有中文关联发生英文人工修订时保守使用新内容，不做复杂的自动重新匹配。未导入references大语料、未批量翻译、未建新学科或泛化平台；未部署，真实设备发音质量与内容逐条审校仍未覆盖。


后续首批39条来源主释义已完成独立AI核对和显式采用，最新覆盖、运行状态及恢复点见[首批实施报告](chinese-batch-01-implementation.md)。上文0采用及PID为本结构阶段交付时的历史快照。
