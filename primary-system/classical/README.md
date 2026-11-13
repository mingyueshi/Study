# 古文精读馆

独立 Django 应用，无数据库模型与迁移。学习广场「语文」、文学常识导航和四上教材侧栏直达 `/classical/`。现有 11 篇精选古文（含《滕王阁序》）、《论语》二十篇全文与《道德经》八十一章，共 112 个阅读页面、1054 个精读段、367 道练习（248 道选择、119 道讲述自查）。《论语》依本机底本分为 513 则；《道德经》分为 428 句，配 243 道章后练习。原《论语六则》合并到全书，不再单列入口。四上两篇的教材关联不变，其余只标选读。

## 唯一编辑位置

`content_sources/classical/catalog.json` 维护顺序、难度、体裁和能力分类。一篇一个 JSON，Django 直接读取并校验，无需生成、联网或导入数据库。教学定稿包含句段划分和对应解释；四上两篇的全文与教材主源 `knowledge-data.js` 作一致性校验，仅容许引号样式不同。修改正文时必须一起复核词语位置、停顿、译文、背诵提示和题目。

- 篇目 `id`、句子 `id`、词语 `id`、题目 `id` 发布后保持稳定。目录文件不允许路径跳转。
- `chunks` 拼接必须等于原文；斜线仅作朗读提示，不写回正文。
- 词语由所属句子、`quote` 和从 1 开始的 `occurrence` 定位；默认第一次。标注不能重叠，重复的「之」可以分别指代不同对象。`kind=referent` 必须写 `refers_to` 与 `reason`。
- `hints` 必须出现在原文中，供关键词背诵使用。`supplement` 只解释省略，不改原文。
- `unit_label` 可为「句」或「则」，默认「句」，控制精读、朗读、背诵和打印用语。「则」用于跨篇章的格言选读，每则必须提供 `reference`，包含出处名称 `label`、HTTPS 查阅链接 `url` 和本机定位 `source_ref`。原典入口以 `?line=s1` 等稳定编号分别解析，编号无效返回 404，绝不回退到其他章句。
- 短篇每篇三至五题；带 `sections` 的长篇每段三至五题，`choice` 采用从 0 开始的答案序号；`selfcheck` 写参考答案。所有题目必须关联有效句子及本篇能力。页内即时判题是公开内容自测，不接账号题库、积分或学习足迹。
- `source` 保存原典书名、章节、链接与选用版本说明。108 个页面通过 `source_ref` 关联本机原典；用版本、文件路径、来源 SHA256、段落定位和原句钉住现有原典。点击时只读核对就绪状态与原句，再跳资料库详情。4 篇暂无篇级本机来源定位，仍保留原典出处。绝不按题名猜主键，版本漂移时展示回到精读与相应篇章的联网查阅入口。
- 核心阅读不依赖数据库或外部服务。朗读复用 `speech.js` 的设备语音，支持逐句、全文、三档语速和每句一至三遍；停止、离页、隐藏页面或改变设置会取消当前播放和后续回调。设备语音不等于校核音频，难读字以标注为准。
- 使用平台共用侧栏：默认右侧，可左右切换并记忆；窄屏展开目录。页面整组随宽屏展开，正文和侧栏各保留阅读尺寸。

## 长篇分段

《滕王阁序》保留七段完整序文，另列一段附读《滕王阁》诗，共 71 个精读单元、190 处词义／典故标注、24 道练习。七段正文采用《全唐文》固定修订版的正文用字，原文存档、指纹和整理说明见 [来源说明](../content_sources/classical/tengwanggexu/README.md)。译文、讲解、练习为本馆自编，附诗单独关联本机《全唐诗》，不把诗的原典位置当成序文出处。

- 可选 `sections` 每项必须含 `id`、`title`、`intro`、`sentences`；按连续原文完整划分句子编号，不能重排、重复或遗漏。每段三至五题，题目通过 `sentence` 归属段落，不另抄一份教学数据。
- 目录可跳读、单段听读、进入本段背诵／练习、打开四种本段打印页。背诵和练习按浏览器选择显示，全篇数据与作答记录始终保留；全篇复习与成绩统计仍以本篇为单位。
- `/classical/tengwanggexu/?section=p3&mode=recite#recite` 选第三段背诵；`?section=poem&mode=practice#practice` 练附诗。`#section-p3` 跳正文段落；`?line=s24#line-s24` 跳名句。无脚本仍能跳读、展开译解与答案、打印所选段。
- `/classical/tengwanggexu/print/?section=p3&view=study` 只打印第三段，句子编号和题号沿用全篇。`section` 无效或与 `unit` 混用返回 404；已有短篇与全书的深链接继续使用。

## 全书编排

- `catalog.collections` 登记全书 ID、标题、简介与按书序排列的 `parts`。每篇章登记分段数 `count` 与汉字序列 SHA256，防止漏章、重排或原文漂移。正文保存到 `lunyu-*.json` 或 `daodejing-*.json`，无需数据库字段。可选 `part_label` 只能为「篇」或「章」；可选 `landmarks` 登记分卷导航的名称及目标篇章，目标须在本书且不重复。目录、数量和导航文案按各书单位呈现，不把《论语》的名称和单位写死在模板里。
- 二十篇分段数为 16、24、26、26、28、30、38、21、31、28、26、24、30、44、42、14、26、11、25、3。这里的 513 则是本馆底本分段，不冒充其他版本分章号。
- 六则使用 `{id, reuse: {article, sentence}, reference}` 引用内部保留的 `lunyu.json` 教学正文，只覆盖编号与出处。禁止自引用、嵌套引用、正文私自覆盖或缺失目标。全书原有内容指纹不变，已有全书自测与复习标记继续可用。
- `catalog.retired_articles` 登记已合并篇目的 `id` 与目标 `collection`。内部源仍校验，但不计入公开篇目、规模、搜索或侧栏。旧章句的新位置从 `reuse` 关系推导，须在目标全书中有且只有一个对应位置，不能凭文字猜测。加载后派生的 `retired_targets` 仅用于兼容跳转，不写回源文件。
- `edition` 保存译注资料名称、固定提交、HTTPS 链接、许可与整理说明；普通章句的 `translation_entry` 对应上游条目 ID。来源及分段处理见 [论语来源说明](../content_sources/classical/lunyu/README.md)。
- 首页显示精选卡片与两部全书入口。全书目录可搜索全部原文、译文、解读与词义，每页 30 条结果并直达章句。书内前后篇和侧栏只列本书，不再提供入门六则的重复入口。
- 全书每篇两道选择、一题讲述自查；并非每则都配置单独题目。各则复用朗读、背诵与释义交互，增加原文／讲解单则打印入口。整篇仍提供四种打印。

## 本机状态与深链接

复习标记和自测仅保存在当前浏览器，不代表账号成绩；共享浏览器会共享这些标记。存储键包含篇目 ID 与内容 SHA256 前 16 位，正文、讲解或题目变化后旧状态不冒充新版掌握情况。存储不可用或损坏时，本页仍可阅读、练习，并说明不能保留。

- `/classical/?curriculum=4a` 只看已有四上两篇。搜索、难度、体裁、能力和教材条件可以组合，无脚本也能筛选。
- `/classical/xueyi/?line=s3#line-s3` 定位第三句。
- `/classical/xueyi/#note-s3-zhi-bird` 定位第二个「之」的解释。
- `/classical/xueyi/?mode=recite` 和 `?mode=practice` 进入背诵与练习。
- `/classical/lunyu/` 及不带章句的旧打印／原典链接永久跳转全书目录；`?line=s5` 转到《述而》第二十二则，旧打印的 `?unit=` 转到对应单则，保留有效背诵模式及打印版式。原六则浏览器记录不删除，也不把六则已学误算为整篇已学；原六则的五道专属练习随独立页面下线，不再计入公开练习数。
- `/classical/books/lunyu/?q=温故` 搜全书；`/classical/lunyu-weizheng/?line=s11#line-s11` 跳到温故知新；`/classical/lunyu-weizheng/print/?view=study&unit=s11` 只打印第十一则，编号不重排。
- `/classical/books/daodejing/` 读八十一章；`?q=上善若水` 搜句子；`/classical/daodejing-11/?line=s3#line-s3` 定位房屋空处的第三句；`/classical/daodejing-11/print/?view=study&unit=s3` 只打印此句。上篇道经为第一至三十七章，下篇德经为第三十八至八十一章。逐句原文、译文、词义与自编练习的维护说明见 [道德经来源](../content_sources/classical/daodejing/README.md)。
- `/classical/xueyi/print/?view=original|study|practice|answers` 分别提供原文、讲解、练习和答案页。练习页不带答案和解析；打印独立使用完整原文，不受背诵遮挡或折叠状态影响。

## 验证

在 `primary-system/` 运行：

```sh
node content_sources/test/test-classical.js
make test-frontend
.venv/bin/python manage.py test classical catalog.test_study_topics chinesebook.test_couplets chinesebook.test_clinics
```

源校验与运行时共用 `classical/content.py`；Django 测试覆盖无数据库阅读、每篇与四种打印页、深链接、组合筛选、入口与来源漂移；前端测试覆盖背诵遮挡与损坏记录过滤。浏览器另核对 390、820、1920、3440 像素下的首页、目录、详情、深链接及打印，检查实际交互、语音取消与不可用降级。
