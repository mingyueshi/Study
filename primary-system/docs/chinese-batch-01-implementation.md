# 首批中文主释义采用实施报告

2026-11-02。实施完成；未提交、推送、部署，不改其他项目。主控独立验收由主控维护，本报告只记录实施与证据。

## 范围与内容结论

固定清单：`data/chinese/cn-foundation-20261102-01.json`，batch_id=`cn-foundation-20261102-01`，规范化JSON（排序键、UTF-8、紧凑分隔符）SHA256：

`91e7a07da970887d89d107375188457b47824351702b42b835ff91a62b94d281`

主控锁定批准副本后才执行日常导入。39个唯一固定绑定，严格是26场景目标＋13教材关联；星期完整11项、教室15项（light暂缓）、教材Unit1的13项。正文和词性逐字复用固定证据已有中文，没有新例句；origin=source，generation_tool空，作者注明“既有教学来源；GPT-6.1 SOL整理”，复核为`AI: Codex 主控（独立逐条复核）`。这是AI对文本的独立核对，不是用户／人工审校或真人听音。

**本批通过的是39条固定主释义，不是39张卡的全部memo／拆分提示。** 主控另登记window旧memo词源归属待纠错，未在本批白名单内修改。所有原教学标注保留，后续应单独核对。

清点前883引用都已有legacy中文，不应称作883缺中文；采用前确认0，采用后39。引用与唯一固定绑定分母本库均883；场景26/577，教材13/306，总体39/883（4.42%）。剩余844项中，4引用明确暂缓：场景light（灯／轻的）、教材light（照亮／灯；光）、场景maths book（读音疑点）、场景orange（名词／形容词边界）；其余840仅未纳入，未冒称完成质量核查。两域严格同词形交集118，固定绑定交集0；casefold多Sense组86不能当作可合并清单，May／may明确分开。完整ID、源版本、原文语言、快照、位置和剩余原因见[覆盖清点](chinese-coverage-inventory.md)。

## 实现与维护

新增`ChineseBatchReceipt`及lexicon.0006迁移，持久保存batch ID、批准清单、规范化摘要和实际对象／版本归属。每个版本UUID由batch ID＋row key确定；不以词形为身份，不扫描同拼写词扩用。中文创建／确认／采用仍调用既有create_chinese/review_chinese/adopt_chinese，不写Sense.editorial_definition或gloss_language。

首导整批锁定来源、义项、读音、父内容、目标／关联后重新预检。要求root及每条审核approved、匹配审核身份、调用者所见摘要、全部批准UUID、精确证据与修订快照、完整位置集合及预期采用revision。稳定来源键、原始摘要及版本摘要只用于核证；**跨环境UUID不同必须只读生成新映射清单再审核，正式导入不能静默重配**。

复跑要求回执清单及digest、原正文／元数据、确认历史、采用历史、当前指针／revision、实际对象归属全部吻合才no-op。撤回、人工改选、源修订、目标替换、清单变化均冲突，不刷新revision后重建。完整位置集合具有静态核验逻辑；本轮没有将独立位置集合变更另列实测用例。全部操作在同一事务，预检失败或后半条创建失败均整批回滚。dry-run执行同样路径后回滚。没有构建通用导入平台。

```sh
.venv/bin/python manage.py inventory_chinese --output 新的审计文件.json
.venv/bin/python manage.py import_chinese_batch \
  --input data/chinese/cn-foundation-20261102-01.json \
  --reviewer 'AI: Codex 主控（独立逐条复核）' --dry-run
# 正式写入必须提供主控锁定摘要；本机已经执行，不需为了验证再次写日常库
.venv/bin/python manage.py import_chinese_batch \
  --input data/chinese/cn-foundation-20261102-01.json \
  --reviewer 'AI: Codex 主控（独立逐条复核）' \
  --expected-digest 91e7a07da970887d89d107375188457b47824351702b42b835ff91a62b94d281
```

`inventory_chinese`只读数据库且拒绝覆盖既有输出。正文／范围变更不能沿用此批准摘要；不要编辑已有回执或恢复撤回版。

## 验证与保护证据

证据根目录：`/Users/apple/Documents/GitHub/Study/output/primary-system-audit/2026-11-02/chinese-batch-01/`。

| 检查 | 实际结果 |
|---|---|
| SQLite相关回归 | 38项：37通过、1项PG并发跳过；related-tests-final.log |
| PG批次回归 | 10/10，含同批并发首导一个创建／另一个no-op；postgres-tests-final.log，随机测试库已销毁 |
| 前端Node | 9/9；frontend-tests.log；没有重复运行此前184项全量基线 |
| 真实副本 | dry-run报告39且零写；首导39；完全重复0新增／39 unchanged；first-import.json、repeat-import.json |
| 错误保护 | 错摘要、pending、同证据新目标、部分预检冲突、已写首条后第二条创建失败、撤回和后来人工改选均有拒绝／整批回滚回归 |
| 主控独立隔离验证 | chinese-batch-control/independent-checks.json：9/9，包括非空账号true／游客false／教材mastered收藏笔记和2020时间、历史seen保留，重复全业务摘要不变（主控执行，未修改其文件） |
| 本阶段恢复点 | before-batch.sqlite3，SQLite backup、0600，旧恢复点保留 |
| 日常原行白名单 | daily-original-result.json：46表313,781原行（含迁移／认证等元数据），仅批准39行的采用字段变化；增39中文、39核对、26目标采用、13教材选择历史、1回执及迁移／模型权限元数据，其他原字段无变化，integrity ok |
| 主控独立日常比对 | chinese-batch-control/daily-whitelist-result.json：原36业务表313,438行除批准字段外不变；daily-http-result.json逐项验证26场景卡／13教材API及ability搜索 |
| 日常学习记录 | 账号0、场景进度0、教材进度0；采用没有制造学习记录 |
| 检查 | check、makemigrations --check --dry-run、diff --check通过 |

浏览器使用单独browser.sqlite3与8013：桌面1440×1000、390×844均正常显示批准中文，无横向溢出；实际查看截图。旧legacy/null/0页面在采用后提交409，刷新新版本后标记200，只有隔离游客记录写入；教材ability显示“n. 能力”，中文搜索命中ability，SpeechKit点读收到end事件。证据browser-before/conflict/success/mobile/lesson-search-speech.log，截图`output/playwright/chinese-batch-01-{desktop,mobile,lesson-mobile}.png`。预期409为有意冲突，不误报为保存成功。

## 覆盖率、边界和运行状态

采用前后全清单：inventory-final-before.json（从本阶段backup只读重建并修正按引用原因）、inventory-final-after.json；初次原始读取保留inventory-before.json。next-batch-candidates.json给出下一批21个待审ID：书包11项（maths book暂缓）、家居10项（study先核范围），均尚未批准。其余资料不批量导入／翻译。

日常仍为577目标／词位、306教材关联，39个中文版本及39核对，26目标采用、13新增教材选择历史；原有学习数据不迁移、清空或扩大含义。39个唯一绑定没有跨域自动复用，源英文及原语言字段保持原样。AI文本审核不保证设备实际发音或其他教学提示质量。

8012最终代码服务保留，PID99880，日志／PID在本阶段runserver.log和runserver.pid。本轮8013、浏览器、rehearsal.sqlite3和browser.sqlite3已清理；保留backup、全部清单、摘要、回执、日志与截图。代码未提交／推送／部署。

本轮新增或修改：lexicon/models.py、chinese_batches.py、management/commands/{import_chinese_batch,inventory_chinese}.py、migrations/0006_chinesebatchreceipt.py、tests/test_chinese_batches.py，scripts/{inventory_chinese,audit_chinese_batch}.py，固定data/chinese JSON、覆盖／候选／本报告及相关运行文档。未修改主控验收文件。
