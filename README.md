# 📚 Study · 多学段学习系统仓库

每个学习系统独立一个目录：入口页面 + 数据 + 逻辑 + 测试，互不依赖、可单独拷走使用。

## 🖥 现有系统

| 目录 | 系统 | 面向 | 状态 |
|---|---|---|---|
| [`primary-system/`](primary-system/) | 乐学堂统一系统 | 多年级、多账号、多教材、多学科 | 数据库、Nova 后台、个人进度、开放词库与统一查字查词、历史与地理专题、天文探索、文学常识、科学实验室、未解之谜研究所、人类起源 |
| [`personal-learning/`](personal-learning/) | 个人学习系统 | 个人知识与实践积累 | 英文学习（TechLex）可用，AI 基础篇可学习 |

**个人学习系统**：独立目录与总导航，当前包含英文学习和 AI 基础篇（6 阶段、24 个概念、自检与练习）。英文目录中的 TechLex 已有 12 大分类、205 个术语（含 57 个缩写）、24 条双语工作表达，支持点读、搜索、学习状态筛选与本机进度；以桌面宽屏和竖屏阅读为主。

快速开始：

- 乐学堂统一系统可在 [`primary-system/`](primary-system/) 运行 `python3.12 bootstrap.py --serve`。目录自带离线基础包和 296 道可练题，详见[本地运行](primary-system/README.md#本地运行)。
- 小学课程维护：教材、专题、素材、生成命令和测试见[小学课程文件源](primary-system/content_sources/README.md)。
- 个人学习：双击 [`personal-learning/index.html`](personal-learning/index.html)，从总导航进入英文学习或 AI 基础篇；详见 [`personal-learning/README.md`](personal-learning/README.md)。

原 `primary/` 双击离线版已归档，可从 Git 修订 `fb47d0b` 下恢复。小学课程统一在 `primary-system/` 使用和维护。

## 🚧 学段规划

| 规划目录 | 学段 | 状态 |
|---|---|---|
| `junior/` | 初中 | 🚧 规划中 |
| `senior/` | 高中 | 🚧 规划中 |
| `university/` | 大学 | 🚧 规划中 |

> 命名约定：每个系统一个顶层目录，目录名用系统标识（如 primary-system、personal-learning）；面向某学段的系统可在根 README 的表格登记。个人学习方向统一放在 `personal-learning/`，英文、AI 等大类分别使用子目录，TechLex 位于 `personal-learning/english/techlex/`。

## 🧭 新系统的建议做法

1. 复制现有系统作为起点（架构已验证：页面 + 数据 + 逻辑分离，离线可用，语音模块 `speech.js` 可直接复用）；
2. 替换数据文件（`*-data.js`），调整内容与难度；
3. 在本 README 的表格登记入口，并为数据文件补一套 `test/`。

## 🧪 数据质量保障

小学版在 `primary-system/` 运行 `make test-content-sources`、`make test-frontend` 和 `make test`。个人学习系统用 Node 运行 `personal-learning/test/` 下的测试。
