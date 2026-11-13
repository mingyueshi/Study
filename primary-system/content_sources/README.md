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
| 病句医院、错别字诊所 | `chinese-clinics.json`（病例、句子和辨析提示），形近字与多音字候选来自四上教材的 `knowledge-data.js` | 病例由 Django 直接读取。改教材字词后运行 `make chinesebook-data`，再运行 `.venv/bin/python manage.py test chinesebook.test_clinics` |
| 场景单词导入来源 | `words-data.js` | `node scripts/export_words_scenario.cjs`，默认导出到 `data/words-scenario.json` |
| 词以类聚 · 拼写家族 | `word-families.json`（词尾、例词、音标和释义） | Django 直接读取。改后运行 `.venv/bin/python manage.py test words.test_tree` |
| 教材练习 | 与教材共用语数英数据 | `make questionbank-data` |
| 历史、地理 | `history/`、`history-timeline/`、`geo/`、`geo-map/` | `make study-topics-data` |
| 天文、文学、科学 | `astro-*`、`lit-*`、`sci-*` 及 `images/` | `make study-topics-data` |
| 科学流言粉碎机 | `science-rumors.json`（说法、证据卡、判断、迁移题与出处） | Django 直接读取。保留任务 `slug` 以维持深链接和进度，修改后运行 `node content_sources/test/test-science-rumors.js` |
| 二十四节气馆 | `solar-terms.json`（节气、三候、习俗、农谚、出处与诗篇定位） | Django 直接读取。诗篇按题名、作者及从零开始的段落序号在当前简体语料中取句。保留季节与节气 `id` 以维持深链接。修改后运行 `node content_sources/test/test-solar-terms.js` |
| 人体奥秘站 | `human-body.json`（四课、泵血分步说明、测脉搏实验和出处） | Django 直接读取。保留课程 `slug` 和科学实验室的 `su6-5` 以维持深链接，修改后运行 `node content_sources/test/test-human-body.js` |
| 汉字演变馆 | `hanzi-evo-*`、`images/glyphs/`（古字形 SVG）与 `hanzi-evo-availability.json` | `make study-topics-data`；字形重抓见 `scripts/fetch_hanzi_glyphs.py` |

`make test-content-sources` 运行本目录的源文件校验。`make content-data` 重生成全部随项目维护的文件和题库批次；命令只写文件。题库题目发生变化时，按[题库数据说明](../questionbank/data/README.md)处理新批次。已发布批次的备注可能保留旧来源名称，以维持原有导入指纹。

专题的统一版关联和去重内容维护在 `static/study_topics/connections-data.js`，平台样式维护在同目录的 `platform-bridge.css` 和 `course.css`。历史与地理音频、地理图谱底图随源文件保存，对应重制工具在 `history/scripts/`、`geo/scripts/` 和 `geo-map/scripts/`。

音标、成语场景和接龙的现行实现及测试分别在 `phonetics`、`idioms` 和 `chain`。旧离线页面、旧音标数据和旧成语玩法的实现与测试随离线版归档。
