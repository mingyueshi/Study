# 未解之谜案卷

`cases.json` 是专题正文、线索、互动和出处的唯一数据源。案卷按文件顺序展示，`slug` 用于详情地址，发布后保持稳定。正文和图注使用简体中文。

- 可选的 `background` 放在线索前，包含标题 `title`、引言 `intro`、知识卡 `facts`（每张有 `title` 和 `text`）、过渡段 `transition` 及出处编号列表 `sources`。出处编号从 1 开始，对应本篇的 `sources`。
- 每篇放 3–5 条线索。分别记录观察与解释，`source` 引用本篇 `sources` 中从 1 开始的序号，图像出处也用同一套序号。
- 题目设 3 个选项，只有一个选项把 `correct` 设为 `true`。每个选项都说明理由，围绕证据能支持的判断设题。
- 分开写已知、待解问题和下一步调查。核对原始资料后填写 `checked_on`，有新进展时一起复查正文、结论和反馈。
- 核心图片和图示放在本项目的 `static/mysteries/`。真实图像注明机构和原始页面，解释用的示意图写清「示意」。核对资料和原图时可点外链。

改完在 `primary-system/` 运行 `.venv/bin/python manage.py test mysteries`，刷新页面即可查看新版内容。
