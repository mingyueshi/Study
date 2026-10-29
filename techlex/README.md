# ⌨️ TechLex · 计算机英语学习系统（专业人员）

> Study 多学段学习仓库中的独立系统（目录：`techlex/`），与小学版（`primary/`）并列。

面向**开发、运营、运维**等专业人员的计算机英语术语本。深色界面、等宽字体术语卡，贴近真实工作语境。

## 🚀 快速开始

双击 `index.html` 即可（推荐 Chrome / Edge）。

## 📚 当前内容

8 大分类 86 个术语（其中缩写 8 个），每个术语卡片包含：

- **音标**（普通单词）或 **缩写全称**（如 DNS = Domain Name System）；
- **中文释义**；
- **构词拆解**（每段可点读，如 de + ploy、re + pository）；
- **英文例句 + 中文翻译**（都可点读，来自真实工作语境）；
- **关联术语**（可点读，全部带中文解释，书内术语带 ◆ 角标）。

| 分类 | 例词 |
|---|---|
| 开发通用 | repository、commit、branch、merge、refactor、debug、compile、framework、dependency、asynchronous |
| 前端 | component、render、state、router、responsive、viewport、stylesheet、bundle、accessibility、hot reload |
| 后端 | endpoint、payload、schema、query、index、transaction、migration、middleware、authentication、cache、queue |
| 运维 · CI/CD | deploy、release、rollback、pipeline、CI/CD、container、orchestration、scaling、monitoring、incident、postmortem、uptime |
| 网络与安全 | DNS、domain、CDN、latency、bandwidth、proxy、firewall、TLS、vulnerability、patch、encryption |
| 运营与增长 | A/B test、conversion、retention、churn、funnel、DAU、cohort、KPI、attribution、SEO、landing page |
| 云与基础设施 | instance、region、snapshot、bucket、provision、autoscaling、serverless、quota、billing、availability |
| 协作与敏捷 | sprint、standup、backlog、retrospective、milestone、roadmap、requirement、spec、code review、stakeholder |

## ✨ 功能

- 分类切换（平铺不裁剪）、连读本单元（读术语 + 中文释义）、已掌握标记、中英文混合搜索；
- 缩写术语逐字母朗读（DNS → "D N S"），点卡片上的 🔊 即可；
- 进度保存在本机浏览器。

## ➕ 添加术语

在 `tech-data.js` 对应分类的 `terms` 数组里照格式添加（格式说明见文件顶部注释）。若 `related` 里用了书外术语，需在底部 `TECH_ZH` 补一条中文解释——`node test/test-tech.js` 会自动检查。
