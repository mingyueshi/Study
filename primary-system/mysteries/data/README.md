# 未解之谜案卷

`cases.json` 是专题正文、线索、互动和出处的唯一数据源。目录按 `category` 分组，分类按首次出现的顺序展示，组内保留文件顺序。`slug` 用于详情地址，发布后保持稳定。正文和图注使用简体中文。

- 可选的 `background` 放在线索前，包含标题 `title`、引言 `intro`、知识卡 `facts`（每张有 `title` 和 `text`）、过渡段 `transition` 及出处编号列表 `sources`。出处编号从 1 开始，对应本篇的 `sources`。
- 每篇放 3–5 条线索。分别记录观察与解释，`source` 引用本篇 `sources` 中从 1 开始的序号，图像出处也用同一套序号。
- 线索可加 `image`，沿用封面 `figure` 的 `path`、`alt`、`caption`、`credit` 和 `source`。图注可以请读者寻找一个细节，再用「查看大图」读清小字或局部。
- 案卷可加 `media`，每项沿用图像字段，并补上 `title` 和 `kind`。实拍短片用 `video` 和本地 MP4，动图用 `animation` 和本地 GIF，两者都加静态 `poster`。有节选、慢放或去声时在图注标明，播放器由读者主动开启。
- 互动读图用 `diagram`。底图仍用 `path`，`steps` 写 2–4 个观察点。每步给出短标题 `label`、说明 `text` 和整数百分比坐标 `x`、`y`，原点在图片左上角。无脚本时同时显示各步说明。读研究图时按原图例区分观测点、平均方向和推算位置。
- 深海的 `depth_explorer` 使用五个深度带，`layers` 按 `minimum` 从浅到深排列，最深一层的 `maximum` 设为 `null`。每层的 `animals` 复用图片字段，加上 `title` 和 `depth_note`。后者区分照片的拍摄深度、标本的采集深度和动物的已知活动水域。无脚本时可从标尺跳到每一层的图片和说明。
- 题目设 3 个选项，只有一个选项把 `correct` 设为 `true`。每个选项都说明理由，围绕证据能支持的判断设题。
- 分开写已知、待解问题和下一步调查。核对原始资料后填写 `checked_on`，有新进展时一起复查正文、结论和反馈。
- 核心图片、视频、动图和图示放在本项目的 `static/mysteries/`。真实图像注明机构和原始页面，解释用的示意图写清「示意」。核对资料和原图时可点外链。
- 鳗鲡追踪图与朗戈朗戈图使用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，图注标记了裁切。纳斯卡蜂鸟照片和飞行短片使用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)，短片保留作者署名并标明节选、去声。

改完在 `primary-system/` 运行 `.venv/bin/python manage.py test mysteries`，刷新页面即可查看新版内容。
