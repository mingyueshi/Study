# 语法课程数据说明

`grammar.json` 是**生成物**：由 `scripts/build_grammar.cjs` 从 `content_sources/grammar/`
静态版（`content.js` + `knowledge-words.js` + `knowledge-sentences.js`）确定性
转换而来，重跑无 diff。**内容源头在 `content_sources/`**——修改知识点、增删章节都去
`content_sources/grammar/` 改，然后：

```sh
node scripts/build_grammar.cjs       # 重新生成 grammar.json 与题库批次
.venv/bin/python manage.py import_questions \
  --input questionbank/data/questions/2026-11-grammar-quiz.json
manage.py test grammar               # 契约测试
```

## schema（schema_version: 1）

- 顶层：`schema_version`、`source_code: "primary-grammar"`、`chapters[]`、`lessons[]`
- chapter：`{id, no("01".."08"), title, description, lesson_ids[]}`，每个知识点恰好归一章
- lesson：`{id "gr{章}-{序}", title, definition, essentials[>=2],
  example{question, steps[], answer}, misconception{wrong, right},
  quiz{question, options[3], answer 下标, explanation}, sources[{label, url 全 https}]}`
  可选 `facts[{label,value}]`、`formula`、`comparison{headers[], rows[][]}`，空为 `null`
- 内容契约与源测试 `content_sources/test/test-grammar.js` 一致：中文标点（禁英文双引号、
  裸换行、HTML 标签形态）、31 点、来源全 https。加载期 `grammar/catalog.py::validate()`
  再校验一遍，坏数据拒绝上线。

## 与挑战题库的关系

每个知识点的巩固题同时作为 `primary-grammar` 批次（`batch_id 2026-11-grammar-quiz`）
进入题库：选项做确定性轮换（静态版答案下标集中在 index 1，轮换后 9/13/9 分散），
`source_ref = grammar:{知识点id}:quiz` 可溯源。语法页内判分在前端、进度只存浏览器。
「练本章」按章节的 `lesson_ids` 和题目来源选题，由题库服务端判分并记录作答。
本章错题与重练沿用这个题池，取每道题最近一次的作答结果。批次内容随本文件重跑后一起再生成。

## 修订流程

1. 改 `content_sources/grammar/knowledge-*.js`（或补新章节数据文件并在脚本里接入）
2. 重跑生成脚本，核对输出规模（8 章 31 点 / facts 5 / formula 12 / comparison 21）
3. 题库批次有变化时换新 `batch_id` 再导入（批次纪律见题库数据说明）
4. `manage.py test grammar` + 打开 `/grammar/` 目检
