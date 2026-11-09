# 小学课程文件源

从 `primary-system/` 目录维护。课程、素材和图示改这里的源文件；`make` 生成的静态文件与数据随项目提交，供 Django 直接读取。

| 内容 | 编辑位置 | 生成命令 |
|---|---|---|
| 数学、语文教材 | `math-data.js`、`knowledge-data.js`、图示与 `images/` | `make mathbook-data chinesebook-data` |
| 图形运动实验室 | `geometry-lab.json`（实验手记和挑战目标） | `make study-topics-data` |
| 英语教材、日常用语 | `english-data.js` | `make phrases-data`；教材导出见项目 README |
| 英语语法 | `grammar/` | `make grammar-data` |
| 作文坊 | `writing-data.js` | `make writing-data` |
| 场景单词导入来源 | `words-data.js` | `node scripts/export_words_scenario.cjs`，默认导出到 `data/words-scenario.json` |
| 教材练习 | 与教材共用语数英数据 | `make questionbank-data` |
| 历史、地理 | `history/`、`history-timeline/`、`geo/`、`geo-map/` | `make study-topics-data` |
| 天文、文学、科学 | `astro-*`、`lit-*`、`sci-*` 及 `images/` | `make study-topics-data` |

`make test-content-sources` 运行本目录的源文件校验。`make content-data` 重生成全部随项目维护的文件和题库批次；命令只写文件。题库题目发生变化时，按[题库数据说明](../questionbank/data/README.md)处理新批次。已发布批次的备注可能保留旧来源名称，以维持原有导入指纹。

专题的统一版关联和去重内容维护在 `static/study_topics/connections-data.js`，平台样式维护在同目录的 `platform-bridge.css` 和 `course.css`。历史与地理音频、地理图谱底图随源文件保存，对应重制工具在 `history/scripts/`、`geo/scripts/` 和 `geo-map/scripts/`。

音标、成语场景和接龙的现行实现及测试分别在 `phonetics`、`idioms` 和 `chain`。旧离线页面、旧音标数据和旧成语玩法的实现与测试随离线版归档。
