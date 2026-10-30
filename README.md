# 📚 Study · 多学段学习系统仓库

每个学习系统独立一个目录：入口页面 + 数据 + 逻辑 + 测试，互不依赖、可单独拷走使用。

## 🖥 现有系统

| 目录 | 系统 | 面向 | 状态 |
|---|---|---|---|
| [`primary/`](primary/) | 🎒 乐学堂 | 小学（当前：四年级） | ✅ 使用中 |
| [`primary-system/`](primary-system/) | 乐学堂统一系统 | 多年级、多账号、多教材、多学科 | 数据库、Nova 后台、个人进度、开放词库接入与统一查字查词 |
| [`techlex/`](techlex/) | ⌨️ TechLex · 计算机英语 | 开发 / 运营 / 运维专业人员 | ✅ 使用中 |

**TechLex 亮点**：9 大分类 169 个术语（含 54 个缩写），其中「开发常用缩写」单元收录 fn、param、ctx、env、TODO、FIXME、WIP、LGTM、DRY、YAGNI、OOP 等代码里的高频缩写；每个术语含音标或缩写全称、中文释义、构词拆解、双语例句、关联术语，全部可点读（缩写逐字母朗读）。

快速开始：

- 小学版：双击 [`primary/index.html`](primary/index.html)，详见 [`primary/README.md`](primary/README.md)
- 语文知识点：双击 [`primary/knowledge.html`](primary/knowledge.html)，人教版（统编版·新课标）四年级上册单元知识点总结，配课文图示，可点读、可搜索、可打印。
- 数学知识点：双击 [`primary/math.html`](primary/math.html)，北师大版（新课标）四年级上册单元知识点总结，含例题、图示与互动演示（转角认角、竖式逐步算、行程小车等）、公式速查与易错诊所。
- 教材同步单词：双击 [`primary/english.html`](primary/english.html)，外研版新标准三起（新课标）四年级上下册，含 12 单元 306 条词卡点读。
- 场景单词：双击 [`primary/words.html`](primary/words.html)，按教室、食物、农场、交通等 25 个生活场景学习 305 个单词，支持点读、拆分记忆与掌握记录。
- 成语接龙：双击 [`primary/chain.html`](primary/chain.html)，支持自己接龙、小龙陪练、释义提示与本地续玩。
- 地理探索：双击 [`primary/geo.html`](primary/geo.html)，适合小学生的地理知识学习，八大站点 37 个知识点，配罗盘、四季互动演示与图示，可点读、可搜索、可打印。
- 天文探索：双击 [`primary/astro.html`](primary/astro.html)，适合小学生的天文宇宙知识学习，八大基地 41 个知识点，配行星档案、月相变化互动演示与图示，可点读、可搜索、可打印。
- 历史长廊：双击 [`primary/history.html`](primary/history.html)，适合小学生的中华历史启蒙，八大长廊 37 个知识点，配甲骨文、丝绸之路、郑和宝船等图示与朝代长河互动演示，可点读、可搜索、可打印。
- 文学常识：双击 [`primary/lit.html`](primary/lit.html)，适合小学生的文学常识学习，八大文学苑 41 个知识点，涵盖四大名著、古今作家、文化常识与名句典故，配名著档案、生肖档案互动演示与图示，可点读、可搜索、可打印。
- 科学实验室：双击 [`primary/sci.html`](primary/sci.html)，适合小学生的科学知识学习，八大实验室 39 个知识点，涵盖物质、力、光声、电磁、生命、地球与技术工程，配三态变化、电路串联并联互动演示与图示，可点读、可搜索、可打印。
- TechLex：双击 [`techlex/index.html`](techlex/index.html)，详见 [`techlex/README.md`](techlex/README.md)

## 🚧 学段规划

| 规划目录 | 学段 | 状态 |
|---|---|---|
| `junior/` | 初中 | 🚧 规划中 |
| `senior/` | 高中 | 🚧 规划中 |
| `university/` | 大学 | 🚧 规划中 |

> 命名约定：每个系统一个顶层目录，目录名用系统标识（如 primary、techlex）；面向某学段的系统可在根 README 的表格登记。专业人员方向已有 TechLex，更多专业系统可作为新目录并列加入。

## 🧭 新系统的建议做法

1. 复制现有系统作为起点（架构已验证：页面 + 数据 + 逻辑分离，离线可用，语音模块 `speech.js` 可直接复用）；
2. 替换数据文件（`*-data.js`），调整内容与难度；
3. 在本 README 的表格登记入口，并为数据文件补一套 `test/`。

## 🧪 数据质量保障

每个系统自带数据测试（不依赖浏览器）：`node <目录>/test/ 下的各文件`，修改数据后运行即可自动检查格式、答案、读音与中文解释覆盖。
