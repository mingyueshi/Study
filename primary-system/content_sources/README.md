# 小学课程文件源

从 `primary-system/` 目录维护。课程、素材和图示改这里的源文件；`make` 生成的静态文件与数据随项目提交，供 Django 直接读取。

| 内容 | 编辑位置 | 生成命令 |
|---|---|---|
| 跨学科 · 能源与环境 | `energy-environment.json`（五站正文、风机讲解、用电量与碳账本初始值）；复用地理图谱的三峡卫星影像 | Django 直接读取，`node content_sources/test/test-energy-environment.js` 校验 |
| 跨学科 · 货币与贸易 | `money-trade.json`（五站正文、购物篮分值、供需模型、照片署名及出处）；实物照片在 `static/study_topics/money-trade/` | Django 直接读取，`node content_sources/test/test-money-trade.js` 校验 |
| 跨学科 · 伟大工程 | `great-works.json`（六项工程的档案、图注、读图点位、推理任务与出处）；对应原理图在 `static/study_topics/great-works.svg`，编号按同一 360 × 160 坐标系叠加 | Django 直接读取；`node content_sources/test/test-great-works.js` 校验 |
| 跨学科 · 时间的故事 | `time-story.json`（五站正文、自测、换算参数及出处）；四张节气卡引用 `solar-terms.json` | Django 直接读取；`node content_sources/test/test-time-story.js` 校验 |
| 数学 · 数学家的故事 | `mathematicians.json`（中外人物生平、问题、解法、动手题、出处与联读路线）；七桥实验的地点与桥也在对应人物条目中 | Django 直接读取。保留人物 `id` 和分组 `id` 以维持详情与目录深链接。运行 `node content_sources/test/test-mathematicians.js` 和 `.venv/bin/python manage.py test catalog.test_study_topics.StudyTopicPageTests.test_mathematicians_directory_and_stable_person_pages` |
| 数学、语文教材 | `math-data.js`、`knowledge-data.js`、图示与 `images/` | `make mathbook-data chinesebook-data` |
| 图形运动实验室 | `geometry-lab.json`（图形顶点、实验手记和挑战目标，生成时校验） | `make study-topics-data` |
| 英语教材、日常用语 | `english-data.js` | `make phrases-data`；教材导出见项目 README |
| 英语语法 | `grammar/` | `make grammar-data` |
| 作文坊 | `writing-data.js` | `make writing-data` |
| 积分兑换奖励 | `rewards.json`（版本 2，22 项，五类分类，50～5000 积分）；`rewards-activities.json`、`rewards-device-time.json` 保留旧活动和设备时长目录 | 先迁移，再用 `.venv/bin/python manage.py import_rewards --dry-run` 预览，去掉 `--dry-run` 导入并补齐空白分类；可用 `--retire-source` 下架未修改的旧项目，已有同名配置保留，见 [奖励目录维护](../incentives/data/README.md) |
| 对联工坊 | `couplets.json`（入门线索、主题分类、例联词组与句尾拼音、选择题、拼联引用、词语素材、自查与出处） | Django 直接读取。保留规则、例联和练习的 `id` 以维持深链接，修改后运行 `node content_sources/test/test-couplets.js`。选择题的内容指纹变化后重新计进度；作品在当前浏览器按账号保存，草稿在当前标签页刷新后恢复 |
| 标点符号实验室 | `punctuation.json`（12 种标点、12 组辨析、24 道练习与出处） | Django 直接读取，无需生成或入库。修改前补 `test/test-punctuation.js` 校验，修改后运行该校验、`node --test scripts/test_punctuation.cjs` 和 `.venv/bin/python manage.py test chinesebook.test_punctuation`。练习 `chunks` 是相邻空格之间的原文，`answers` 是完整答案向量列表，空字符串表示不加标点；判题按完整向量匹配，不混拼不同答案。保留稳定 ID；内容指纹变化后重新计该题进度。用法深链接为 `/punctuation/?view=usage#mark-quotation`，练习为 `?view=practice&question=complete-quote`；记录按账号保存在当前浏览器，游客共用游客记录 |
| 修辞手法馆 | `rhetoric.json`（8 种手法、16 条标注例句、16 组辨析与出处） | Django 直接读取。讲解例句的 `parts` 用 `focus` 标出关键字句，辨析的 `sentences` 可直接写句子或用 `example` 引用例句 ID。保留手法与辨析 ID 以维持深链接，如 `/rhetoric/#technique-simile` 和 `/rhetoric/?technique=simile#cases`。修改后运行 `node content_sources/test/test-rhetoric.js` 和 `.venv/bin/python manage.py test chinesebook.test_rhetoric` |
| 近反义词迷宫 | `word-maze.json`（3 条路线、18 关与出处） | Django 直接读取。每关 `examples` 用「前文、目标词、后文」标出词语，`answer` 引用选项 ID。保留路线和关卡 ID，内容指纹变化后重新计该关进度。路线可用 `/word-maze/?route=polysemy#play` 直达。修改后运行 `node content_sources/test/test-word-maze.js` 和 `.venv/bin/python manage.py test chinesebook.test_word_maze` |
| 古文精读馆 | `classical/catalog.json` 与一篇章一个 JSON（11 篇精选（含《滕王阁序》）、《论语》二十篇及《道德经》八十一章，共 1054 个精读段、367 道练习；《道德经》含 428 句自编译解、243 道章后练习；原六则已合并） | Django 直接读取并校验，无需入库。运行 `node content_sources/test/test-classical.js` 和 `.venv/bin/python manage.py test classical`；结构、逐段原典定位与打印见 [专题维护](../classical/README.md) |
| 病句医院、错别字诊所 | `chinese-clinics.json`（病例、句子和辨析提示），形近字与多音字候选来自四上教材的 `knowledge-data.js` | 病例由 Django 直接读取。改教材字词后运行 `make chinesebook-data`，再运行 `.venv/bin/python manage.py test chinesebook.test_clinics` |
| 场景单词导入来源 | `words-data.js` | `node scripts/export_words_scenario.cjs`，默认导出到 `data/words-scenario.json` |
| 词以类聚 · 拼写家族 | `word-families.json`（词尾、例词、音标和释义） | Django 直接读取。改后运行 `.venv/bin/python manage.py test words.test_tree` |
| 词以类聚 · 词根词缀树 | `word-morphology.json`（前缀、后缀、词根家族、拆分、拼写说明、双语例句与出处） | Django 直接读取并校验，无需生成或入库。保留家族及例词 ID，修改后运行 `.venv/bin/python manage.py test words.test_morphology words.test_tree` |
| 教材练习 | 与教材共用语数英数据 | `make questionbank-data` |
| 历史、地理 | `history/`、`history-timeline/`、`geo/`、`geo-map/` | `make study-topics-data` |
| 天文、文学、科学 | `astro-*`、`lit-*`、`sci-*` 及 `images/` | `make study-topics-data` |
| 物质实验室 | `matter-data.js`（5 室 21 知识点与物质速查）、`matter-figures.js`（图示库与 pH 调色卡、反应观察表）、`matter.css`、`matter-app.js`；`matter-mix-data.js` + `matter-mix.js`（桌面混合实验台） | `make study-topics-data`。试剂 `id`、配对键（两 id 按字典序 `a+b`）与现象 `kind` 须稳定：45 组配对必须全覆盖，缺组走 `fallback` 无现象。混合记录存本浏览器 `matter_mix_records_v1`，反应观察表存 `matter_reactions_v1`，不写题库或数据库；知识点 `id`（mu1-1…）与配对键保留维持深链接和记录。溶解、过滤、燃烧分段观察复用 `sci-process-data.js` 的 `dissolve`、`filter`、`burn` 场景。修改后运行 `node content_sources/test/test-matter.js`、`test/test-sci-process.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics` |
| 微生物·看不见的世界 | `microbes-data.js`（5 室 21 知识点与微生物速查）、`microbes-figures.js`（图示库与洗手公平比较台）、`microbes.css`、`microbes-app.js`；`microbe-scale-data.js` + `microbe-scale.js`（尺度缩放台，astro-discovery 的向下镜像） | `make study-topics-data`。缩放台固定 5 级（hair→cell→bacteria→virus→molecule），级序与挑战题 `id` 须稳定：挑战沿用天文口径，`first`/`last` 记录只保留合法选项；缩放进度存本浏览器 `microbe_scale_v1`，洗手观察存 `microbe_handwash_v1`，知识点 `id`（mm1-1…）保留维持深链接。尺度挑战题与级别回链按 `#lesson-mmX-Y` 锚点校验；发酵与酿造内容必须保留家庭安全边界表述。修改后运行 `node content_sources/test/test-microbes.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics` |
| 科学流言粉碎机 | `science-rumors.json`（24 项任务的说法、证据卡、判断、迁移题与出处，另含可选 `icon`、`media` 和 `activity`） | Django 直接读取。`skills` 为四种查证方法，任务 `skill` 引用其 ID；`challenge` 为迁移题，含题干、三个稳定选项 ID、逐项反馈和正确选项，详情与五题训练共用；`toolkit_sources` 保存方法出处。`media` 记录本地素材路径、图注、署名与原始资料页，`activity` 记录材料、步骤和注意事项。新增媒体放在 `static/science/rumor-media/`，也可复用本系统已有素材。保留任务 `slug` 以维持深链接和旧版进度；本机收藏、手记、待巩固和训练轮次由 `static/science/rumors-learning.js` 管理，不写入题库或数据库。修改后运行 `node content_sources/test/test-science-rumors.js`、`node --test scripts/test_rumors_learning.cjs` 与 `.venv/bin/python manage.py test science.test_rumors` |
| 二十四节气馆 | `solar-terms.json`（节气、三候、习俗、农谚、24 个观察任务、12 道挑战、72 个联读任务、课程关联、出处与诗篇定位） | Django 直接读取。诗篇按题名、作者及从零开始的段落序号在当前简体语料中取句。保留季节与节气 `id` 以维持深链接和本机观察笔记，挑战的 `term` 指向节气卡。`learning_lessons` 登记课程 ID 与标题，`learning` 维护每卡地理、文学与读诗问题，校验时核对课程源中的真实 ID 和标题；跨页 `solar_term` 只按已知节气 ID 恢复。修改后运行 `node content_sources/test/test-solar-terms.js` |
| 人体奥秘站 | `human-body.json`（12 课、18 幅本地图像及出处、36 道自测、人体图层、健康生活情境、成长路线和脉搏手册） | Django 直接读取。原六课的过程演示由 `animation.modes[].phases[]` 和 `static/science/body-process.js` 驱动，新课的分步图解使用 `route_title` 与 `stops[]`。`expedition.organs[]` 维护器官档案，`expedition.layers[]` 维护图层说明，其图形在 `templates/science/body/system-layers.html`；`health.scenarios[]` 的 `links[]` 同时生成情境到课程及课程回情境的入口。`growth.stages[]` 维护成长时间线。保留课程 `slug`、题目 `id` 和科学实验室的 `su6-5` 以维持深链接及本地学习足迹，修改后运行 `node content_sources/test/test-human-body.js`。 |
| 汉字演变馆 | `hanzi-evo-*`、`images/glyphs/`（古字形 SVG）与 `hanzi-evo-availability.json` | `make study-topics-data`；字形重抓见 `scripts/fetch_hanzi_glyphs.py` |

`make test-content-sources` 运行本目录的源文件校验。`make content-data` 重生成全部随项目维护的文件和题库批次；命令只写文件。题库题目发生变化时，按[题库数据说明](../questionbank/data/README.md)处理新批次。已发布批次的备注可能保留旧来源名称，以维持原有导入指纹。

专题的统一版关联和去重内容维护在 `static/study_topics/connections-data.js`，平台样式维护在同目录的 `platform-bridge.css` 和 `course.css`。历史与地理音频、地理图谱底图随源文件保存，对应重制工具在 `history/scripts/`、`geo/scripts/` 和 `geo-map/scripts/`。

音标、成语场景和接龙的现行实现及测试分别在 `phonetics`、`idioms` 和 `chain`。旧离线页面、旧音标数据和旧成语玩法的实现与测试随离线版归档。

### 文学人物关系与作家名片

`lit-data.js` 的 `authors` 保存 41 张名片（稳定 ID、年代、代表作、趣闻、课程 ID 与出处），`classics` 保存四大名著 31 位人物的情节、回目、版本和关系分支。每条 `links` 用 `from`、`to`、`label` 标明两个人的关系，分支需从 `rootId` 连通且无环；人物只在一个分支出现。小说中的关系与历史事实分开说明，作者署名沿用课程通行说法，格林兄弟注明共同搜集整理。外部原文标注需联网，本地情节和名片不依赖网络。

新增字段先补 `test/test-lit.js` 的结构、关系完整性与课程引用校验。`lit-app.js` 负责展开、人物选择、分类、搜索与深链接，`lit.css` 负责卡片和关系树，沿用共用侧栏的右侧默认位置与位置记忆。入口为 `/literature/#view-relationships`、`/literature/#view-authors`；人物可用 `#relationships-sanguo-zhugeliang`，作家可用 `#author-sushi`，原有 `#lesson-lu6-5` 等课程链接和掌握记录继续可用。

修改后运行 `node content_sources/test/test-lit.js`、`make study-topics-data`、`.venv/bin/python scripts/build_study_topics.py --check`、`make test-frontend` 和 `.venv/bin/python manage.py test catalog.test_study_topics`。交互回归在 `scripts/test_lit_explore.cjs`，覆盖切书、选人物、分类、搜索、深链接、旧记录与不可用的浏览器存储。

### 天文宇宙漫游

`astro-media-data.js` 维护 3 个主题的中文图注、观察任务、原始媒体与外部资料链接，以及 8 颗行星的近似数值和模型说明；`astro-media.js` 负责大图、原生视频和三种比例视图。6 幅图、2 张额外视频封面和 3 段 WebM 动画保存在 `images/astro/roam-*`，随 `make study-topics-data` 发布，页面无需连接外部图库即可看图和播放。各素材的 `source` 是说明页，`original` 是原始下载地址，核对日期记录在 `checked`。外部探索明确标为需联网。

修改后运行 `node content_sources/test/test-astro-media.js`、`node content_sources/test/test-astro.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics`。入口为 `/astronomy/?view=universe`，可用 `#roam-solar`、`#roam-galaxy`、`#roam-deep` 直达各主题；课程仍使用原知识点与学习记录。

### 科学微粒与电路演示

`sci-demo-data.js` 维护三态说明、温度与模型限制、串并联通断反馈和出处；`sci-figures.js` 负责图示与开关，`sci-demo-motion.js` 负责显式播放、步进和暂停清理。复用 `su2-2`、`su5-2` 课程，保留原课文与知识点 ID。新增说明字段先补 `test/test-sci-demos.js` 的校验，再运行 `node content_sources/test/test-sci-demos.js`、`node content_sources/test/test-sci.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics`。

### 光路与水循环观察

`sci-process-data.js` 维护光路介质参数、分段说明、水循环四步和模型限制，`sci-process.js` 与 `sci-process.css` 负责观察交互。光路接在科学 `su4-2`；水循环接在地理 `gu5-1` 原有的「动画：水循环过程」实验中。统一编排已将科学 `su7-3` 改为节水测量活动，不在这里重复水循环正文。地理文件源通过 `../sci-process*` 引用本系统内的共享文件，生成器将其解析到本地 `study_topics/sci/`；两项保留原课程和实验入口。

新增说明字段先补 `test/test-sci-process.js`。修改后运行该校验、`test/test-sci.js`、`test/test-geo.js`、`make study-topics-data`、`make test-frontend` 和 `.venv/bin/python manage.py test catalog.test_study_topics`。水循环的旧图保留作脚本或数据缺失时的手动四步降级，旧的无限自动循环已移除。

### 光合作用与食物链观察

继续复用 `sci-process-data.js`、`sci-process.js` 与 `sci-process.css`，新增 `photo`、`foodchain` 两组观察说明。节点名称、关系方向、分段说明、模型限制和出处维护在数据文件，SVG 布局和播放逻辑留在渲染器。`test/test-sci-process.js` 校验节点／阶段 ID 唯一性、关系引用与方向，避免把原料进出、取食方向画反。原知识点 `su6-2`、`su6-4` 和五种生物保持不变，动效模块或数据缺失时由 `sci-figures.js` 保留原静态图。

修改后运行 `node content_sources/test/test-sci-process.js`、`node content_sources/test/test-sci.js`、`node content_sources/test/test-geo.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics science`；共用控制器改动也应回归地理水循环。分段顺序只用于讲解，不代表自然过程必须排队进行；食物链亮点只表示传递方向，不表示不变的能量数量。

### 物质实验室的分段观察

`sci-process-data.js` 另维护物质实验室共用的 `dissolve`（溶解）、`filter`（过滤）与 `burn`（燃烧条件与灭火）三组场景：溶解、过滤是带路径的静态实验场景，燃烧沿用节点高亮（步骤含 `from`/`to`）。物质实验室在 `matter-figures.js` 注册 `process-*` 包装图调用 `SciProcess.html(kind)`，播放器、样式与动效偏好和科学课程共用；播放器或数据缺失时退回静态示意。修改场景说明后运行 `node content_sources/test/test-sci-process.js` 与 `node --test scripts/test_sci_process.cjs`，并按上表回归物质实验室页面。

### 声音与简单机械观察

`sci-experiments-data.js` 维护声音介质、快慢与幅度参数、三种机械的说明、理想模型限制与出处，`sci-experiments.js` 负责数值计算和播放，复用 `sci-process.css`。入口沿用科学 `su4-4`、`su4-5` 和 `su3-5`，不新增课程或学习记录。声音图示只用于观察，不播放声音。动效模块或数据缺失时由 `sci-figures.js` 保留原静态图。

新增字段先补 `test/test-sci-experiments.js`。修改后运行该校验、`test/test-sci.js`、`make study-topics-data`、`make test-frontend` 和 `.venv/bin/python manage.py test catalog.test_study_topics science`。原有心跳控制在 `static/science/body.js`，丝路旅行控制在 `history/lab.js`，两者也遵守统一动效和系统减少动态设置；后台、离屏、离页时停止，手动阶段仍可用。

### 磁铁、电磁铁与昼夜四季

磁铁 `su5-4` 和电磁铁 `su5-5` 继续扩展 `sci-experiments-data.js`、`sci-experiments.js`，分别维护相对磁极说明、电流／匝数范围、通断电说明、模型限制和出处，字段由 `test/test-sci-experiments.js` 校验。计算与 SVG 留在控制器，`sci-figures.js` 保留静态回退。正文和静态图同步使用「断电后磁性大大减弱」，不再把剩磁说成必定为零。

地理沿用 `gu4-3` 的四季探究实验，`geo/earth-data.js` 维护昼夜与四季的四个位置、纬度、倾角和模型说明，结构先由 `test/test-geo-earth.js` 校验；`geo/earth.js` 负责两种图示、示意昼长计算和有限播放。`geo/lab.js` 挂载到原弹窗，与水循环互斥，关闭或切页时暂停；依赖失效仍使用原四季图与四个位置按钮。发布文件由 `build_study_topics.py` 同步，复用 `sci-process.css`，不新增天文入口或课程知识点。

修改后运行上述两项结构校验、`node content_sources/test/test-sci.js`、`node content_sources/test/test-geo.js`、`make study-topics-data`、`make test-frontend` 和 `.venv/bin/python manage.py test catalog.test_study_topics science`。前端回归分别在 `scripts/test_sci_experiments.cjs` 和 `scripts/test_geo_earth.cjs`，覆盖方向、昼长、条件独立、播放生命周期及降级。浏览器同时回归原电路、地图与水循环。

### 浮沉与框架稳定观察

科学原知识点 `su3-2`、`su8-4` 继续扩展 `sci-experiments-data.js` 的 `buoyancy`、`structure` 数据，物块相对密度、观察说明、推动方向、斜杆选项、图中标签和模型限制由 `test/test-sci-experiments.js` 先校验。`sci-experiments.js` 计算浸入比例、浮力与重力对照，以及固定杆长的框架几何，沿用原播放器生命周期；没有新库或额外入口。

`sci-data.js` 同步说明漂浮稳定时受力平衡，限定三角框架保持形状的条件；`sci-figures.js` 保留静态回退并同步修正受力、框架斜杆及图注。修改后运行 `node content_sources/test/test-sci-experiments.js`、`node content_sources/test/test-sci.js`、`make study-topics-data`、`make test-frontend`、`.venv/bin/python manage.py test catalog.test_study_topics science`。浏览器核对三种浮沉结果、框架左右推动和拆装循环，并回归共用播放器的简单机械与电磁铁。

### 月相与日月食观察

`astro-observation-data.js` 是八种月相说明、两类日月食步骤、模型限制和出处的主来源；`astro-observation.js` 负责联动图示与播放清理。`astro-figures.js` 沿用 `demo-astro-moonphases`、`astro-eclipse`，动效脚本失效时读取同一份月相说明显示静态图；`astro-app.js` 支持原知识点 ID 的直达链接。修改后运行 `node content_sources/test/test-astro-observation.js`、`node content_sources/test/test-astro.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics`。不要把模型中的月相天数用作当日天象预报。

天文漫游进阶功能：`astro-discovery-data.js` 维护五级宇宙地址、三条光信号路线与六道观察挑战；`astro-discovery.js` 计算传播时间并管理浏览器挑战记录（首次答案与最新答案分开，存储不可用时使用当前页面内存）。不计入账号积分或原课程掌握标记。增加 `node content_sources/test/test-astro-discovery.js` 校验数据、计算和存档过滤；新增锚点为 `#roam-address`、`#roam-light`、`#roam-challenges`。图片沿用本专题素材，传播时间使用真空光速与平均距离估算，非实时天体测距。

### 二十四节气馆：交节、简笔画与家乡日记

`solar-terms.json` 的 `solarLongitude` 为每节气的太阳黄经，`phenology[].scene` 与 `custom_scene` 引用 `experience.scenes.kinds` 的简笔画类型；说明继续读原三候、地方习俗，不再复制正文。`experience` 维护北京时间、支持年份、模型说明、6 秒单幅时长与天气选项。新增结构由 `test/test-solar-terms.js` 先校验，Django 直接读取，不需要生成或导入数据库。

`static/study_topics/solar-calendar.js` 复用本系统 Astronomy Engine 2.1.19，用太阳视黄经每 15°的交节时刻判断当前区间。计算覆盖当前及相邻年份，避免一月与冬至跨年出错；支持 1900—2100 年，统一显示北京时间。当前卡和目录入口同时突出，顶部倒计时可直接回卡或记今天；每分钟与返回前台时刷新，保留原季节筛选和深链接。节气含义参照[香港天文台](https://www.hko.gov.hk/tc/gts/time/24solarterms.htm)，2026 年立冬与小雪时刻对照其年历；不拿卡片常见日期硬套每一年。

`solar-scenes.js` 为 24 张卡提供共 96 幅简笔画。每卡按初候、二候、三候和习俗点选，单幅 6 秒、连看 24 秒，到尾停止，多个播放器互斥；收起、离屏、筛掉卡片、开日记或挑战、后台和离页时暂停。减少动态仍可读画面与原说明。解冻、隐虹与雷收声分别减少冰面或淡出，旧说用书页和想象提示，不把动物互变画成现代生物学事实。

`solar-diary.js` 按条目保存 `study_solar_diary_v2:<条目ID>`，字段为节气、日期、家乡、可选地点、天气、可选实测气温、植物、动物和手记。家乡以城市或乡镇自由填写，不读取定位或外部天气。可以按年、季节和家乡组合筛选，按日期倒序阅读，同节气跨年、连续多天均可记；导出包含全部条目，不受当前筛选限制。新记录不覆盖同节气的旧页。

旧键 `study_solar_note_v1:<节气ID>` 只在读取时适配，不自动迁移、删除或改写。编辑旧页仍写原键并保留版本 1 的日期、地点和文字，同时增加可选日记字段，让旧窗口仍能读取基本笔记；删除旧页需主动确认。新旧记录的保存、删除都比对打开时的原值，遇到其他窗口修改先提示，不静默覆盖。存储受限或已满时保留表单并显示未保存；坏记录留在原存储，不当作空记录覆盖。家乡预填单独保存在 `study_solar_hometown_v1`，观察记录仍由当前浏览器的使用者共同查看。

验证：`node content_sources/test/test-solar-terms.js`、`node --test scripts/test_solar_terms.cjs`、`make test-frontend` 与 `.venv/bin/python manage.py test geographystudy.test_solar_terms catalog.test_study_topics`。行为测试覆盖独立交节时刻、跨年、闰日、旧笔记兼容、多条保存、并发修改、坏存储、筛选导出和有限场景帧。

### 天文实验室

入口 `/astronomy/?view=lab`，四项玩法分别使用 `#sky-moon`、`#sky-planets`、`#sky-polaris` 和 `#sky-missions`。侧栏直接进入实验室，太阳系、月球、恒星、航天课程也提供对应链接；原知识点 ID、搜索、宇宙漫游与掌握记录继续使用。

`astro-lab-data.js` 维护日期范围与说明、冥王星、3 道比较题、北斗七星的示意坐标和四步找星说明，以及 7 个探月、7 个探火星代表性里程碑。任务日期区分发射、入轨、着陆、返回；成果不是都发生在同一天。14 站是已发生的精选清单，不代表完整或最新任务名录。每站保存 NASA 或国家航天局出处。原八行星数值集中在 `astro-media-data.js`，补充稳定 ID、平均参考温度与公转天数，直径统一为 NASA 数据表的近似赤道直径。冥王星属于矮行星，不写成九大行星；岩石表面温度和四颗巨行星约 1 巴大气处温度分开说明。

`astro-moon-calendar.js` 在原 `astro-observation.js` 图示上挂接日期。选日期统一取北京时间 20 时，前后换日不受电脑所在时区或夏令时影响；此刻使用系统时间，每分钟刷新，后台暂停刷新，手动选月相、拖滑块或播放模型后退出日期同步。月相角和亮面比例由本地 Astronomy Engine 2.1.19 计算，避免把固定 29.5 天模型直接当成日期月相。引擎原文件与 MIT 许可放在 `vendor/astronomy-engine/`，生成时复制到本专题；校验元数据保存原文件 SHA-256。来源为官方 npm `astronomy-engine@2.1.19`，下载包完整性以 npm 发布的 SHA-512 核对，无需运行时联网或 npm 构建。

`astro-lab.js` 负责排序、三题反馈、目的地筛选和有限找星播放。星位经过简化，天璇指向天枢、从天枢继续约五倍的方向由坐标校验；不是实时星图。播放遵循系统减少动态和统一偏好，离屏、后台、离页和切换课程会清理。数据结构与引用先由 `node content_sources/test/test-astro-lab.js` 校验；`scripts/test_astro_lab.cjs` 对照[美国海军天文台 2024 月相历表](https://aa.usno.navy.mil/api/moon/phases/year?year=2024)，并验证闰日、时区、日期控制清理、数值排序和时间顺序。

修改后运行上述源校验、`node content_sources/test/test-astro-media.js`、`node content_sources/test/test-astro-observation.js`、`node content_sources/test/test-astro.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics`。

### 天文专题总入口

`/astronomy/` 使用独立的轻量目录模板 `astronomy_portal.html`，只加载 `astro-data.js`、`astro-portal.js` 与 `astro-portal.css`。9 个主题和 46 个问题复用原 `units`，七个工具入口的文案维护在 `ASTRO.portal`，由 `test/test-astro.js` 校验；搜索同时筛选工具、主题与问题，并展开对应问题。具体讲解及互动通过 `?view=au1`、`?view=lab` 等原视图打开。旧 `/astronomy/study/` 保留永久跳转，参数与锚点继续解析；无视图参数的 `#lesson-*`、`#roam-*`、`#sky-*`、`#mission-*` 在目录中补齐视图后定位。星表独立为 `/astronomy/stars/`，原 `/astronomy/<编号>/` 不变，旧根地址的星表筛选参数转到新星表入口。修改后运行源校验、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics astronomy`。

三个观测专题分别从 `?view=constellations`、`?view=sky` 和 `?view=telescope` 进入。星图书签使用 IAU 三字母缩写（如 `#Ori`）。`astro-constellations.json` 同时提供星表沿用的中文名，以及识图用的拉丁名、星点、路径索引和观察提示。数据整理自 [D3-Celestial 0.7.35](https://www.npmjs.com/package/d3-celestial/v/0.7.35) 的 `constellations.json`、`constellations.lines.json` 、`stars.8.json` 和 `starnames.json`：按 J2000 经纬对匹配 XHIP 视星等，保留连线使用的星点，标注图中最亮星的原名或编号，并合并巨蛇座两段。每个星点存放赤经（度，−180 至 180）、赤纬（度）、视星等。许可在 `vendor/d3-celestial/LICENSE.txt`。识别连线仅用于认形，区域定义参照 [IAU 星座表](https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx)。

`astro-sky.js` 在本机调用 Astronomy Engine 的 SearchRiseSet、Equator、Horizon、Elongation 及原月相计算。所有地点的日期边界和输入输出均为 UTC+8；按分钟更新，手动选时后暂停跟随。默认北京，支持城市和自定经纬度。`astro-telescope.json` 维护架镜、校准、观测与故障问答。`node content_sources/test/test-astro-field.js` 校验数据结构、跨日、极区和可见性判断，并对照[香港天文台 2024 年历](https://www.hko.gov.hk/en/gts/astron2024/files/HKO_almanac_2024.pdf)的夏至日出日落。

### 中国省份文化

`geo-map/province-culture-data.js` 按 34 个原省级行政区代码维护简称别称、特产、民俗技艺、代表景观、观察问题与来源索引。行政区、地图和中心参考点复用原文件；页面为 `geo-map/province-culture.html`，发布入口 `/geography/province-culture/`，旧 `/geography/atlas/province-culture.html` 继续跳转。先运行 `node content_sources/test/test-province-culture.js`，再按[图谱说明](geo-map/README.md)生成与验证。
