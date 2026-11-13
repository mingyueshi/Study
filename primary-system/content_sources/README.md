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
