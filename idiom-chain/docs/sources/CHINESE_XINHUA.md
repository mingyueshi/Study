# chinese-xinhua 数据来源与本项目使用说明

本项目按用户要求选择 `pwxcoo/chinese-xinhua`，用于家庭自用的成语学习与接龙；没有公开发布或再分发数据服务。

## 固定输入

- 仓库：https://github.com/pwxcoo/chinese-xinhua
- 数据版本：`8de1001aa499cd65fb97ef8712550188c0297a08`
- 数据文件：https://github.com/pwxcoo/chinese-xinhua/blob/8de1001aa499cd65fb97ef8712550188c0297a08/data/idiom.json
- 输入字节：10,319,857
- SHA-256：`1d4b4f454ce1c416d6a1ab2369d6e66c0ff99e04390172eef70790499e21ce19`
- 实测输入：30,895条、30,895唯一词形，29,502条四字。README自述的数量不代表此固定输入的实测结果。

同目录 `chinese-xinhua-LICENSE` 和 `chinese-xinhua-README.md` 是从上述固定版本下载的原文件。保留上游 MIT License 和 Copyright (c) 2018 PWXCOO。

上游 README 的声明说明，数据由作者从网上收集整理、从各网站抓取，并保留抓取脚本。**仓库MIT许可证不自动证明被抓取词典内容具有完整的第三方授权；家庭自用也不等于版权无风险。** 本项目不声称这是官方新华字典授权数据，也不承诺“最新最全”或全部准确。若将来公开发布、商业使用或分发，需重新核对适用权利，不能沿用本次家庭自用决策。

## 数据处理边界

- 以词形幂等导入；记录来源URL、固定版本、原始JSON。不会删除既有对局。
- 后台人工编辑条目会启用 `import_locked` 导入锁。再次导入遇到锁定条目时整条跳过更新（计入 `manual_locked_preserved`），保留人工修正及其既有来源快照；只统计输入源记录，不把来源版本强行推进。经管理员明确解除导入锁后，下次导入才允许重新覆盖上游字段。
- 与自编种子同名时，保留自编释义与人工来源标签，同时补充上游读音、出处、例句及原记录；不将两种释义来源混淆。
- 不擅自修复 `@`、多读分隔、异常拼音、缺损引号等；原字段保持可追溯。读音 `format_checked` 只表示通过字符/音节格式检查，**不是人工校勘或正确发音保证**。
- 只有符合游戏格式和基础读音检查的四字条目用于接龙；其他条目仍可供词典查询。
- 上游未提供近义词、反义词或音频。本项目不以模型生成结果填充并冒充词典原文。
- 例句和出处原值“无”代表来源未提供，不应计为有内容；空值同样处理。

## 命令

```sh
.venv/bin/python manage.py import_xinhua /path/to/idiom.json --dry-run --report /path/to/dry-run.json
.venv/bin/python manage.py import_xinhua /path/to/idiom.json --report /path/to/import-report.json
```

命令仅接受上面锁定的SHA-256，校验失败不导入。`--dry-run`只作检查和计数，不写数据库；报告为JSON，包含异常词形/原读音及原因。报告路径不得与输入相同。导入使用原子事务，失败不留下部分数据库导入；`enabled`人工禁用状态保留。将来换数据版本需要单独审核，不自动追随上游。
