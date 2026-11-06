# 中文覆盖清点与首批完成情况

2026-11-02。只读全量清点的原始记录是inventory-before.json；补齐按引用归属的最终采用前记录为inventory-final-before.json（从本阶段backup只读生成），采用后为inventory-final-after.json。均位于`../output/primary-system-audit/2026-11-02/chinese-batch-01/`，包含DB路径、清点时间、全部来源当前版本及每项ID／位置／Sense／读音／证据／快照／原文语言／legacy中文／采用和可用状态。

|分母|批次01后|批次02后|批次03后|批次04后|其余legacy未经批次核对|
|---|---:|---:|---:|---:|---:|
|场景引用577（577目标）|26|47|74|103|474|
|教材引用306|13|13|13|13|293|
|合计引用883|39（4.42%）|60（6.80%）|87（9.85%）|116（13.14%）|767|
|唯一固定绑定883|39（4.42%）|60（6.80%）|87（9.85%）|116（13.14%）|767|

全部883项已有legacy中文，不是883项“缺中文”；缺少中文正文0，固定绑定当前失效0。采用前全部仅为旧中文存在，未通过新版本核对。本批39项是来源中文复用并经AI逐条核对采用，不是AI新译文或真人审校。

两域固定绑定交集0；严格区分大小写的同词形交集118。casefold后涉及多个Sense的词形86组，仅是待核对的不同绑定统计，不能当作可归并清单。May=五月与may=可以即使casefold相同也不能合并；同拼写跨来源的证据不同也不能共用版本。

39项范围：星期11/11完整；教室15/16；教材Unit1明确13项。其余844并未全部完成质量核查。其中明确暂缓4引用、3词形：场景light“灯／轻的”；教材light自身“照亮／灯；光”（不含轻的）；场景maths book音标疑点；场景orange名词／形容词边界。每条原因按domain＋具体引用保存，不按拼写套用。另840引用仅标未纳入，不冒称已经审查合格。

下一批具体待审候选21引用：书包与文具11项（排除maths book）、家居10项（study须先核名词／动词范围）；完整ID清单见next-batch-candidates.json。这是准备清单，不是已批准／可直接采用的批次。

### 批次02（2026-11-07导入）

`cn-foundation-20261102-02` 已按批准清单整批导入日常库：规范化摘要`c3b7a35e3a153746621788b34607d1f9037bcdbc2140c355fd8a4f77b852a01b`，21条创建／复跑0新增，回执入库；均为场景目标采用（场景47/577），教材引用不变。blocked 1条：study（旧义项混合书房／学习，先核义项边界，不以same掩盖拆义）；明确暂缓累计5引用、4词形（light、maths book、orange、study）。剩余823项仍未逐条核对，不计入已审范围。导入用既有`import_chinese_batch`命令，恢复点与验证文件在`output/primary-system-audit/2026-11-07/chinese-batch-02/`。

### 批次03（2026-11-07导入）

`cn-foundation-20261107-01`：场景u-colours全部11条＋u-numbers全部16条，共27条创建／复跑0新增，回执入库；场景74/577。逐条核对确认legacy中文与固定证据来源释义逐字一致（颜色词adj.＋数词num.），读音全部已核对，零同形多义。**orange原「名词／形容词边界」暂缓事由消解**：固定证据来源释义本身即「n. 橙子；adj. 橙色的」双词性并列，采用文本逐字一致、不收窄不新增，已纳入本批；light、maths book、study暂缓不变。批次清单与摘要在`data/chinese/cn-foundation-20261107-01.json`与`output/primary-system-audit/2026-11-07/chinese-batch-03/`。剩余796项仍未逐条核对，不计入已审范围。

### 批次04（2026-11-07导入）

`cn-foundation-20261107-02`：场景u-body全部16条＋u-fruit全部13条，共29条创建／复跑0新增，回执入库；场景103/577。逐条核对确认legacy中文与固定证据来源释义逐字一致（身体部位n.＋水果n.），读音全部已核对，零同形多义；kiwi（猕猴桃；几维鸟）、pineapple（菠萝；凤梨）、elbow（肘；胳膊肘）为证据自带双义/双名并列，中文逐字镜像，不收窄不新增。light、maths book、study暂缓不变。批次清单与摘要在`data/chinese/cn-foundation-20261107-02.json`与`output/primary-system-audit/2026-11-07/chinese-batch-03/batch4-summary.json`，导入前恢复点`before-batch-04.sqlite3`。剩余767项仍未逐条核对，不计入已审范围。

固定批准清单与摘要见[chinese-batch-01-candidates.md](chinese-batch-01-candidates.md)，实施证据见[首批报告](chinese-batch-01-implementation.md)。
