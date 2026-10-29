# 📚 Study · 多学段学习系统仓库

每个学习系统独立一个目录：入口页面 + 数据 + 逻辑 + 测试，互不依赖、可单独拷走使用。

## 🖥 现有系统

| 目录 | 系统 | 面向 | 状态 |
|---|---|---|---|
| [`primary/`](primary/) | 🎒 乐学堂 | 小学（当前：四年级） | ✅ 使用中 |
| [`techlex/`](techlex/) | ⌨️ TechLex · 计算机英语 | 开发 / 运营 / 运维专业人员 | ✅ 使用中 |

**TechLex 亮点**：9 大分类 116 个术语（含 38 个缩写），其中「开发常用缩写」单元收录 fn、param、ctx、env、TODO、FIXME、WIP、LGTM、DRY、YAGNI、OOP 等代码里的高频缩写；每个术语含音标或缩写全称、中文释义、构词拆解、双语例句、关联术语，全部可点读（缩写逐字母朗读）。

快速开始：

- 小学版：双击 [`primary/index.html`](primary/index.html)，详见 [`primary/README.md`](primary/README.md)
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
