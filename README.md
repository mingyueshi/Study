# 📚 Study · 多学段学习系统仓库

每个学习系统独立一个目录：入口页面 + 数据 + 逻辑 + 测试，互不依赖、可单独拷走使用。

## 🖥 现有系统

| 目录 | 系统 | 面向 | 状态 |
|---|---|---|---|
| [`primary/`](primary/) | 🎒 乐学堂 | 小学（当前：四年级） | ✅ 使用中 |
| [`history-explorer/`](history-explorer/) | 历史漫游 · 时光手册 | 小学中高年级历史启蒙 | 独立多媒体编排演示 |
| [`primary-system/`](primary-system/) | 乐学堂统一系统 | 多年级、多账号、多教材、多学科 | 数据库、Nova 后台、个人进度、开放词库接入与统一查字查词 |
| [`personal-learning/`](personal-learning/) | 个人学习系统 | 个人知识与实践积累 | 英文学习（TechLex）可用，AI 基础篇可学习 |

**个人学习系统**：独立目录与总导航，当前包含英文学习和 AI 基础篇（6 阶段、24 个概念、自检与练习）。英文目录中的 TechLex 已有 12 大分类、205 个术语（含 57 个缩写）、24 条双语工作表达，支持点读、搜索、学习状态筛选与本机进度；以桌面宽屏和竖屏阅读为主。

快速开始：

- 小学版：双击 [`primary/index.html`](primary/index.html)，详见 [`primary/README.md`](primary/README.md)
- 语文知识点：双击 [`primary/knowledge.html`](primary/knowledge.html)，人教版（统编版·新课标）四年级上册单元知识点总结，配课文图示与实景照片，附作者小传、原文金句、真实百科与B站拓展视频（需联网），可点读、可搜索、可打印。
- 数学知识点：双击 [`primary/math.html`](primary/math.html)，北师大版（新课标）四年级上册单元知识点总结，含例题、图示与互动演示（转角认角、竖式逐步算、行程小车等）、公式速查与易错诊所。
- 教材同步单词：双击 [`primary/english.html`](primary/english.html)，外研版新标准三起（新课标）四年级上下册，含 12 单元 306 条词卡点读。
- 场景单词：双击 [`primary/words.html`](primary/words.html)，按教室、食物、农场、交通等 25 个生活场景学习 305 个单词，支持点读、拆分记忆与掌握记录。
- 成语接龙：双击 [`primary/chain.html`](primary/chain.html)，支持自己接龙、小龙陪练、释义提示与本地续玩。
- 地理探索：双击 [`primary/geo.html`](primary/geo.html)，适合小学生的地理知识学习，八大站点 37 个知识点，配罗盘、四季互动演示与图示，可点读、可搜索、可打印。
- 天文探索：双击 [`primary/astro.html`](primary/astro.html)，适合小学生的天文宇宙知识学习，八大基地 41 个知识点，配行星档案、月相变化互动演示与图示，可点读、可搜索、可打印。
- 历史长廊：双击 [`primary/history.html`](primary/history.html)，适合小学生的中华历史启蒙，八大长廊 37 个知识点，配甲骨文、丝绸之路、郑和宝船等图示与朝代长河互动演示，可点读、可搜索、可打印。
- 历史漫游：双击 [`history-explorer/index.html`](history-explorer/index.html)，独立重编的多媒体历史演示，包含真实文物观察、丝路/汉字/造纸互动、遗址短片、37条知识口袋与时光护照；详见 [`history-explorer/README.md`](history-explorer/README.md)。
- 文学常识：双击 [`primary/lit.html`](primary/lit.html)，适合小学生的文学常识学习，八大文学苑 41 个知识点，涵盖四大名著、古今作家、文化常识与名句典故，配名著档案、生肖档案互动演示与图示，可点读、可搜索、可打印。
- 科学实验室：双击 [`primary/sci.html`](primary/sci.html)，适合小学生的科学知识学习，八大实验室 39 个知识点，涵盖物质、力、光声、电磁、生命、地球与技术工程，配三态变化、电路串联并联互动演示与图示，可点读、可搜索、可打印。
- 个人学习：双击 [`personal-learning/index.html`](personal-learning/index.html)，从总导航进入英文学习或 AI 基础篇；详见 [`personal-learning/README.md`](personal-learning/README.md)。旧 [`techlex/index.html`](techlex/index.html) 会转到新的英文学习模块。

## 🚧 学段规划

| 规划目录 | 学段 | 状态 |
|---|---|---|
| `junior/` | 初中 | 🚧 规划中 |
| `senior/` | 高中 | 🚧 规划中 |
| `university/` | 大学 | 🚧 规划中 |

> 命名约定：每个系统一个顶层目录，目录名用系统标识（如 primary、personal-learning）；面向某学段的系统可在根 README 的表格登记。个人学习方向统一放在 `personal-learning/`，英文、AI 等大类分别使用子目录，TechLex 位于 `personal-learning/english/techlex/`。

## 🧭 新系统的建议做法

1. 复制现有系统作为起点（架构已验证：页面 + 数据 + 逻辑分离，离线可用，语音模块 `speech.js` 可直接复用）；
2. 替换数据文件（`*-data.js`），调整内容与难度；
3. 在本 README 的表格登记入口，并为数据文件补一套 `test/`。

## 🧪 数据质量保障

每个系统自带数据测试（不依赖浏览器）：`node <目录>/test/ 下的各文件`，修改数据后运行即可自动检查格式、答案、读音与中文解释覆盖。
