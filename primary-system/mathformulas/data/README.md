# 数学公式数据维护说明

`formulas.json` 是数学公式专题的全部内容（Git 跟踪、手工维护），加载与校验在
`mathformulas/content.py::load_data()`——数据改坏会直接拒绝上线，改完先跑
`python manage.py test mathformulas`。

## 结构

- `stages`：三个学段固定为 `primary`（小学）/ `junior`（初中）/ `senior`（高中），
  `wip: true` 的学段在前端显示「整理中」徽标。
- `chapters`：章节按学段归属（`code` 唯一，小写字母加连字符），顺序即页面左栏
  导航顺序，`emoji` + `intro` 一行简介。
- `groups`：公式组沿用 `content_sources/math-data.js` 公式速查的形状——
  `{chapter, title, items: [[名称, 公式], …], note?}`，`note` 可省略。

## 文本契约（校验强制）

- 值内**禁英文双引号、裸换行、HTML 标签**；行文用中文标点（（）、「」，）。
- 公式用 Unicode 纯文本：`²`、`³`、`√`、`π`、`±`、`ᵐ`、`ₙ` 等，不引入 LaTeX。
- 名称 ≤ 30 字、公式 ≤ 140 字、组标题 ≤ 40 字、note ≤ 160 字、intro ≤ 100 字。

## 规模下限（校验强制）

小学 ≥ 8 章 / 36 组 / 150 条公式（当前 10 章 / 42 组 / 157 条）；初中、高中各
至少 4 组打底公式。新增学段章节随手补 `chapters` 与 `groups`，测试里的规模
断言（`test_primary_scale`、`test_stage_counts`）按实际增长同步上调。

## 内容准确性口径

公式按通行教材口径整理（数字用通行约数，如 π ≈ 3.14、1 公顷 = 10000 平方米），
不引入学术争议细节；每个公式给「名称 + 公式」二元组，易混处写进组 `note`
（如商不变时余数跟着变、圆锥是圆柱的三分之一）。改公式先核对教材，再更新
`VALIDATION.md`。
