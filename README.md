# 📚 Study · 多学段学习系统仓库

本仓库按**学段**组织学习系统，每个学段一个目录、独立成套（入口页面 + 数据 + 逻辑 + 测试），互不依赖、可单独拷走使用。

## 🗂 目录规划

| 目录 | 学段 | 状态 | 系统名 |
|---|---|---|---|
| [`primary/`](primary/) | 小学 | ✅ 使用中（当前：四年级） | 乐学堂 |
| `junior/` | 初中 | 🚧 规划中 | 待定 |
| `senior/` | 高中 | 🚧 规划中 | 待定 |
| `university/` | 大学 | 🚧 规划中 | 待定 |
| [`professional/`](professional/) | 专业人员 | ✅ 使用中（计算机英语） | TechLex |

> 命名约定：目录名 = 学段英文（primary / junior / senior / university / professional），新增学段请沿用。

## 🎒 小学系统（primary）当前功能

- **练习系统** `index.html`：语文 / 数学 / 英语每日任务、错题本、星星与打卡激励、口算打印卡；
- **单词本** `words.html`：17 个单元 205 词，大示意图 / 音标 / 拆分记忆 / 相关词全部可点读；
- **成语本** `idioms.html`：6 大主题 53 条成语，逐字点读、典故故事、例句与近反义解释；
- **作文坊** `writing.html`：写作锦囊、带点评的范文、素材百宝箱、灵感抽签、可动笔的作文本。

快速开始：双击 [`primary/index.html`](primary/index.html)，详见 [`primary/README.md`](primary/README.md)。

## ⌨️ 专业人员系统（professional）当前功能

**TechLex · 计算机英语**：面向开发 / 运营 / 运维的术语本，深色专业界面。

- **8 大分类 86 个术语**：开发通用、前端、后端、运维 CI/CD、网络与安全、运营与增长、云与基础设施、协作与敏捷；
- 每个术语：音标或缩写全称（DNS = Domain Name System）、中文释义、构词拆解（可点读）、双语例句（可点读）、关联术语（带中文解释）；
- 缩写术语逐字母朗读、连读本单元、已掌握标记、中英文混合搜索。

快速开始：双击 [`professional/index.html`](professional/index.html)，详见 [`professional/README.md`](professional/README.md)。

## 🧭 新学段的建议做法

1. 复制 `primary/` 作为起点（架构已验证：页面 + 数据 + 逻辑分离，离线可用）；
2. 替换目录内的题库/词库数据（`*-data.js`），调整年级与教材版本；
3. 在本表和各系统 README 中登记入口。

## 🧪 数据质量保障

每个系统自带数据测试（不依赖浏览器）：`node <目录>/test/ 下的各文件`，修改数据后运行即可自动检查格式、答案与中文解释覆盖。
