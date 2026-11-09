# 📚 Study · 多学段学习系统仓库

每个学习系统独立一个目录：入口页面 + 数据 + 逻辑 + 测试，互不依赖、可单独拷走使用。

## 🖥 现有系统

| 目录 | 系统 | 面向 | 状态 |
|---|---|---|---|
| [`primary/`](primary/) | 🎒 乐学堂 | 小学（当前：四年级） | ✅ 使用中 |
| [`primary-system/`](primary-system/) | 乐学堂统一系统 | 多年级、多账号、多教材、多学科 | 数据库、Nova 后台、个人进度、开放词库接入与统一查字查词、未解之谜研究所 |
| [`personal-learning/`](personal-learning/) | 个人学习系统 | 个人知识与实践积累 | 英文学习（TechLex）可用，AI 基础篇可学习 |

**个人学习系统**：独立目录与总导航，当前包含英文学习和 AI 基础篇（6 阶段、24 个概念、自检与练习）。英文目录中的 TechLex 已有 12 大分类、205 个术语（含 57 个缩写）、24 条双语工作表达，支持点读、搜索、学习状态筛选与本机进度；以桌面宽屏和竖屏阅读为主。

快速开始：

- 乐学堂统一系统：在 [`primary-system/`](primary-system/) 运行 `python3.12 bootstrap.py --serve`。目录自带离线基础包和 211 道题，详见 [本地运行](primary-system/README.md#本地运行)。
- 小学版：双击 [`primary/index.html`](primary/index.html)，详见 [`primary/README.md`](primary/README.md)
- 语文知识点：双击 [`primary/knowledge.html`](primary/knowledge.html)，人教版（统编版·新课标）四年级上册单元知识点总结，配课文图示与实景照片，附作者小传、原文金句、真实百科与B站拓展视频（需联网），可点读、可搜索、可打印。
- 数学知识点：双击 [`primary/math.html`](primary/math.html)，北师大版（新课标）四年级上册单元知识点总结，含例题、图示与互动演示（转角认角、竖式逐步算、行程小车等）、公式速查与易错诊所。
- 教材同步单词：双击 [`primary/english.html`](primary/english.html)，外研版新标准三起（新课标）四年级上下册，含 12 单元 310 条词卡与 36 段课文对话点读。
- 英语语法：双击 [`primary/grammar/index.html`](primary/grammar/index.html)，小学语法精讲，八大主题 31 个知识点，覆盖名词、冠词、代词、be 动词、时态、比较级与句型变换，每点配规则讲解、句型结构、例题与巩固题，自测记录存浏览器。
- 英语音标：双击 [`primary/phonetics/index.html`](primary/phonetics/index.html)，48 个音标全覆盖，八大主题 33 个知识点，每点配发音要领、口型对比、例词音标标注与辨音巩固题，附词典与 BBC 发音资料链接（需联网）。
- 场景单词：双击 [`primary/words.html`](primary/words.html)，按教室、食物、农场、交通等 25 个生活场景学习 305 个单词，支持点读、拆分记忆与掌握记录。
- 成语接龙：双击 [`primary/chain.html`](primary/chain.html)，支持自己接龙、小龙陪练、释义提示与本地续玩。
- 地理探索：双击 [`primary/geo/index.html`](primary/geo/index.html)，适合小学生的地理知识学习，八大主题 37 个知识点，每点含定义、必学要点、例题、易错辨析与巩固题，配概念图、实景照片、讲解音频、动画实验室与原始机构延伸资料（外链需联网）。
- 天文探索：双击 [`primary/astro.html`](primary/astro.html)，适合小学生的天文宇宙知识学习，九大基地 46 个知识点（末站「未解之谜」讲暗物质、暗能量、黑洞内部、宇宙结局与时间之箭），配行星档案、月相变化互动演示、宇宙成分饼图与图示，可点读、可搜索、可打印。
- 历史长廊：双击 [`primary/history/index.html`](primary/history/index.html)，适合小学生的中华历史启蒙，从走进历史到宋元明清八大主题 37 个知识点，每点含定义、必学要点、例题、易错辨析与巩固题，配概念图、文物实景照片、讲解音频、丝路/汉字/造纸动画实验室与原始机构延伸资料（外链需联网）。
- 历史时间轴系统：双击 [`primary/history-timeline/index.html`](primary/history-timeline/index.html)。从双轨时间轴查找 9 个时代的 126 件中外大事，打开时代站或独立事件页，沿 30 组同期对照读另一边的故事，也可以在朝代更替页看夏到清的 16 个朝代并学习公元纪年。
- 地理图谱：双击 [`primary/geo-map/index.html`](primary/geo-map/index.html)。在中国和世界地图上切换图层、缩放、玩「找一找」，也可以查找 291 条地点档案、进入 34 个省域站，或沿三条主题路线跨图观察。 实景图册收录 13 张离线照片和太空影像，另有 3 项央视影片。
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
