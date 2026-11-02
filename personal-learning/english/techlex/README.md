# ⌨️ TechLex · 计算机英语学习系统（专业人员）

> 个人学习系统的英文学习模块，目录：`personal-learning/english/techlex/`。

[学习首页](../../index.html) · [英文学习目录](../index.html) · [AI 学习基础篇](../../ai/index.html)

面向**开发、运营、运维、测试、数据与 AI 从业者**的计算机英语术语本。支持明暗主题和等宽字体术语卡，用双语例句与工作表达练习技术英语。

## 🚀 快速开始

双击 `index.html` 即可（推荐 Chrome / Edge）。

## 📚 当前内容

12 大分类、205 个术语（其中缩写 57 个），另有 24 条双语工作表达与 12 条用词提醒。每个术语卡片包含：

- **音标**（普通单词）或 **缩写全称**（如 DNS = Domain Name System）；
- **中文释义**；
- **拆词助记**（每段可点读；拆分用于帮助记忆，不是严格的词源说明）；
- **英文例句 + 中文翻译**（都可点读，为常见工作场景编写的教学例句）；
- **关联术语**（可点读，全部带中文解释，词库内关联词使用柔和紫色背景）。

| 分类 | 例词 |
|---|---|
| 开发通用 | repository、commit、branch、merge、refactor、debug、compile、framework、dependency、asynchronous |
| 开发常用缩写 | fn、param、ctx、env、TODO、FIXME、WIP、LGTM、DRY、YAGNI、OOP |
| 前端 | component、render、state、router、responsive、viewport、stylesheet、bundle、accessibility、hot reload |
| 后端 | endpoint、payload、schema、query、index、transaction、migration、middleware、authentication、cache、queue |
| 运维 · CI/CD | deploy、release、rollback、pipeline、CI/CD、container、orchestration、scaling、monitoring、incident、postmortem、uptime |
| 网络与安全 | DNS、domain、CDN、latency、bandwidth、proxy、firewall、TLS、vulnerability、patch、encryption |
| 运营与增长 | A/B test、conversion、retention、churn、funnel、DAU、cohort、KPI、attribution、SEO、landing page |
| 云与基础设施 | instance、region、snapshot、bucket、provision、autoscaling、serverless、quota、billing、availability |
| 协作与敏捷 | sprint、standup、backlog、retrospective、milestone、roadmap、requirement、spec、code review、stakeholder |
| AI 与大模型 | LLM、prompt、token、context window、inference、embedding、RAG、hallucination、fine-tuning、agent、evaluation、multimodal |
| 测试与质量 | unit test、integration test、regression、smoke test、fixture、assertion、mock、coverage、test case、test suite、end-to-end、flaky test |
| 数据与分析 | dataset、data pipeline、ETL、data warehouse、data lake、metric、dimension、aggregation、outlier、data lineage、data quality、normalization |

## ✨ 功能

- 以桌面宽屏与竖屏学习为主：1920px 窗口展示四列卡片，1080px 竖屏展示双列；2560px、3000px 以上窗口分别展示五列、六列。列数按浏览器可用宽度计算；
- 881px 以上保留常驻分类侧栏；721–880px 使用完整的顶部分类目录；720px 以下才使用可展开的窄屏目录，选完自动收起；
- 顶部概览保持简洁，给首屏术语留出空间；桌面搜索与连读工具栏随页面滚动固定，侧栏目录可独立滚动；
- 阅读优先：术语使用 24–28px 等宽字体，音标使用独立的音标字体栈；英文例句与中文释义为 16px 正文字体，中文译句 15px，关联释义 13px（浏览器默认字号下）；正文行距约 1.8 倍，辅助文字提高对比度，主要文字尺寸使用 rem 以跟随浏览器字体设置；
- 全词库中英文搜索、匹配词高亮、快捷搜索词；按 `/` 聚焦搜索，按 `Escape` 清空搜索或停止连读；
- 「全部术语 / 待学习 / 已掌握」筛选、推荐或字母排序、分类与总进度；
- 「工作表达」可展开当前分类的双语表达、用词提醒与参考资料；
- 右上角可切换明暗主题并记住选择；蓝色区分例句、暖色区分助记，关联词使用紫色；
- 搜索栏下展开「系统发音」，可分别选择英语、中文发音人，调整语速和试听，设置沿用 `speech_pref_v1`；
- 连读**当前搜索、筛选和排序后的列表**，术语使用英语、释义使用中文，上一段完成后才继续；
- 点发音图标可听读音；缩写按 `say` 字段朗读，例如 DNS → "D N S"，RAG → "rag"；
- 关闭声音会停止当前朗读，并禁用连读；更换分类、搜索、筛选或排序会停止当前语音；
- 继续使用 `techlex_v1` 存储键，保留旧版掌握记录和上次分类；进度只保存在当前浏览器，无法跨设备同步。

浏览器语音合成需要浏览器及系统发音人支持，实际声音与离线可用性取决于运行环境。

## 内容参考

新增分类的技术概念参考 [Google Machine Learning Glossary](https://developers.google.com/machine-learning/glossary)、[Python unittest](https://docs.python.org/3/library/unittest.html)、[pytest Fixtures](https://docs.pytest.org/en/stable/explanation/fixtures.html)、[pytest Flaky tests](https://docs.pytest.org/en/stable/explanation/flaky.html) 与 [AWS ETL 介绍](https://aws.amazon.com/what-is/etl/)。中文释义与教学例句由本站整理编写。

## 检查

在 `personal-learning/english/techlex/` 下运行：

```sh
node test/test-tech.js
node test/test-speech.js
node test/test-progress.js
```

分别验证词条与分类学习指引、语音回调和发音人及语速设置，以及目录迁移时的进度合并与损坏数据处理。

## ➕ 添加术语

在 `tech-data.js` 对应分类的 `terms` 数组里照格式添加（格式说明见文件顶部注释）。若 `related` 里用了书外术语，需在 `TECH_ZH` 补一条中文解释。新增分类时，还需在 `TECH_GUIDES` 添加分类介绍、两条双语表达和用词提醒；`node test/test-tech.js` 会自动检查。
