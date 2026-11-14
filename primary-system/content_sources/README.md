# 小学课程文件源

从 `primary-system/` 目录维护。课程、素材和图示改这里的源文件；`make` 生成的静态文件与数据随项目提交，供 Django 直接读取。

| 内容 | 编辑位置 | 生成命令 |
|---|---|---|
| 数学、语文教材 | `math-data.js`、`knowledge-data.js`、图示与 `images/` | `make mathbook-data chinesebook-data` |
| 图形运动实验室 | `geometry-lab.json`（实验手记和挑战目标） | `make study-topics-data` |
| 英语教材、日常用语 | `english-data.js` | `make phrases-data`；教材导出见项目 README |
| 英语语法 | `grammar/` | `make grammar-data` |
| 作文坊 | `writing-data.js` | `make writing-data` |
| 积分兑换奖励 | `rewards.json`（版本 2，22 项，五类分类，50～5000 积分）；`rewards-activities.json`、`rewards-device-time.json` 保留旧活动和设备时长目录 | 先迁移，再用 `.venv/bin/python manage.py import_rewards --dry-run` 预览，去掉 `--dry-run` 导入并补齐空白分类；可用 `--retire-source` 下架未修改的旧项目，已有同名配置保留，见 [奖励目录维护](../incentives/data/README.md) |
| 对联工坊 | `couplets.json`（入门线索、例联词组、练习、自查与出处） | Django 直接读取。保留规则、例联和练习的 `id` 以维持深链接，修改后运行 `node content_sources/test/test-couplets.js` |
| 古文精读馆 | `classical/catalog.json` 与一篇章一个 JSON（11 篇精选（含《滕王阁序》）、《论语》二十篇及《道德经》八十一章，共 1054 个精读段、367 道练习；《道德经》含 428 句自编译解、243 道章后练习；原六则已合并） | Django 直接读取并校验，无需入库。运行 `node content_sources/test/test-classical.js` 和 `.venv/bin/python manage.py test classical`；结构、逐段原典定位与打印见 [专题维护](../classical/README.md) |
| 病句医院、错别字诊所 | `chinese-clinics.json`（病例、句子和辨析提示），形近字与多音字候选来自四上教材的 `knowledge-data.js` | 病例由 Django 直接读取。改教材字词后运行 `make chinesebook-data`，再运行 `.venv/bin/python manage.py test chinesebook.test_clinics` |
| 场景单词导入来源 | `words-data.js` | `node scripts/export_words_scenario.cjs`，默认导出到 `data/words-scenario.json` |
| 词以类聚 · 拼写家族 | `word-families.json`（词尾、例词、音标和释义） | Django 直接读取。改后运行 `.venv/bin/python manage.py test words.test_tree` |
| 教材练习 | 与教材共用语数英数据 | `make questionbank-data` |
| 历史、地理 | `history/`、`history-timeline/`、`geo/`、`geo-map/` | `make study-topics-data` |
| 天文、文学、科学 | `astro-*`、`lit-*`、`sci-*` 及 `images/` | `make study-topics-data` |
| 科学流言粉碎机 | `science-rumors.json`（24 项任务的说法、证据卡、判断、迁移题与出处，另含可选 `icon`、`media` 和 `activity`） | Django 直接读取。`media` 记录系统内素材路径、图注、署名与原始资料页，`activity` 记录材料、步骤和注意事项。新增媒体放在 `static/science/rumor-media/`，也可复用本系统已有素材。保留任务 `slug` 以维持深链接和进度，修改后运行 `node content_sources/test/test-science-rumors.js` |
| 二十四节气馆 | `solar-terms.json`（节气、三候、习俗、农谚、出处与诗篇定位） | Django 直接读取。诗篇按题名、作者及从零开始的段落序号在当前简体语料中取句。保留季节与节气 `id` 以维持深链接。修改后运行 `node content_sources/test/test-solar-terms.js` |
| 人体奥秘站 | `human-body.json`（六课、图解、12 幅本地图像及出处、小实验与 18 道自测） | Django 直接读取。保留课程 `slug` 和科学实验室的 `su6-5` 以维持深链接，修改后运行 `node content_sources/test/test-human-body.js` |
| 汉字演变馆 | `hanzi-evo-*`、`images/glyphs/`（古字形 SVG）与 `hanzi-evo-availability.json` | `make study-topics-data`；字形重抓见 `scripts/fetch_hanzi_glyphs.py` |

`make test-content-sources` 运行本目录的源文件校验。`make content-data` 重生成全部随项目维护的文件和题库批次；命令只写文件。题库题目发生变化时，按[题库数据说明](../questionbank/data/README.md)处理新批次。已发布批次的备注可能保留旧来源名称，以维持原有导入指纹。

专题的统一版关联和去重内容维护在 `static/study_topics/connections-data.js`，平台样式维护在同目录的 `platform-bridge.css` 和 `course.css`。历史与地理音频、地理图谱底图随源文件保存，对应重制工具在 `history/scripts/`、`geo/scripts/` 和 `geo-map/scripts/`。

音标、成语场景和接龙的现行实现及测试分别在 `phonetics`、`idioms` 和 `chain`。旧离线页面、旧音标数据和旧成语玩法的实现与测试随离线版归档。

### 天文宇宙漫游

`astro-media-data.js` 维护 3 个主题的中文图注、观察任务、原始媒体与外部资料链接，以及 8 颗行星的近似数值和模型说明；`astro-media.js` 负责大图、原生视频和三种比例视图。6 幅图、2 张额外视频封面和 3 段 WebM 动画保存在 `images/astro/roam-*`，随 `make study-topics-data` 发布，页面无需连接外部图库即可看图和播放。各素材的 `source` 是说明页，`original` 是原始下载地址，核对日期记录在 `checked`。外部探索明确标为需联网。

修改后运行 `node content_sources/test/test-astro-media.js`、`node content_sources/test/test-astro.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics`。入口为 `/astronomy/study/?view=universe`，可用 `#roam-solar`、`#roam-galaxy`、`#roam-deep` 直达各主题；课程仍使用原知识点与学习记录。

### 科学微粒与电路演示

`sci-demo-data.js` 维护三态说明、温度与模型限制、串并联通断反馈和出处；`sci-figures.js` 负责图示与开关，`sci-demo-motion.js` 负责显式播放、步进和暂停清理。复用 `su2-2`、`su5-2` 课程，保留原课文与知识点 ID。新增说明字段先补 `test/test-sci-demos.js` 的校验，再运行 `node content_sources/test/test-sci-demos.js`、`node content_sources/test/test-sci.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics`。

### 光路与水循环观察

`sci-process-data.js` 维护光路介质参数、分段说明、水循环四步和模型限制，`sci-process.js` 与 `sci-process.css` 负责观察交互。光路接在科学 `su4-2`；水循环接在地理 `gu5-1` 原有的「动画：水循环过程」实验中。统一编排已将科学 `su7-3` 改为节水测量活动，不在这里重复水循环正文。地理文件源通过 `../sci-process*` 引用本系统内的共享文件，生成器将其解析到本地 `study_topics/sci/`；两项保留原课程和实验入口。

新增说明字段先补 `test/test-sci-process.js`。修改后运行该校验、`test/test-sci.js`、`test/test-geo.js`、`make study-topics-data`、`make test-frontend` 和 `.venv/bin/python manage.py test catalog.test_study_topics`。水循环的旧图保留作脚本或数据缺失时的手动四步降级，旧的无限自动循环已移除。

### 光合作用与食物链观察

继续复用 `sci-process-data.js`、`sci-process.js` 与 `sci-process.css`，新增 `photo`、`foodchain` 两组观察说明。节点名称、关系方向、分段说明、模型限制和出处维护在数据文件，SVG 布局和播放逻辑留在渲染器。`test/test-sci-process.js` 校验节点／阶段 ID 唯一性、关系引用与方向，避免把原料进出、取食方向画反。原知识点 `su6-2`、`su6-4` 和五种生物保持不变，动效模块或数据缺失时由 `sci-figures.js` 保留原静态图。

修改后运行 `node content_sources/test/test-sci-process.js`、`node content_sources/test/test-sci.js`、`node content_sources/test/test-geo.js`、`make study-topics-data`、`make test-frontend` 与 `.venv/bin/python manage.py test catalog.test_study_topics science`；共用控制器改动也应回归地理水循环。分段顺序只用于讲解，不代表自然过程必须排队进行；食物链亮点只表示传递方向，不表示不变的能量数量。

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
