# 数学之美内容与模型

`topics.json` 是专题正文、活动、题目、实验配置和出处的唯一内容源。应用无模型、
无迁移，不写学习记录，不创建游客会话。入口 `/mathbeauty/` 注册于学习广场「数学」。

## 编排与身份

五站稳定 ID：`golden`（黄金分割）、`fibonacci`（斐波那契数列）、
`symmetry-fractals`（对称与分形）、`mobius`（莫比乌斯环）、`topology`（拓扑入门）。
每站从问题与前置知识开始，先操作模型，再读概念；深入阅读展开方程、极限、
分形维数或曲面不变量。年龄不是访问门槛。

每站有三个概念、一项桌面活动、三道探索判断和可核查的资料链接，共八个实验、
十五道题。实验 ID 和题目 ID 不随文案调整而改变；`#lab-<ID>`、`#deeper`、
`#activity`、`#quiz` 和 `#sources` 支持直接定位。

## schema 1

- 顶层 `title`、`lead`、`topics`；每站的 `opening`、`concepts`、`deep`、`activity`、`cautions`、`quiz`、`sources` 维护阅读内容。
- `labs` 每项包含 `id`、`kind`、`title`、`lead`、`caption`、`fallback`、`figure`、`controls`、`readouts`、`actions`、`messages`。
- 控件为 range、select 或 checkbox，提供明确边界、步长、默认值或选项。控件 ID、读数 ID 和必要反馈键与 `content.py::CONTRACTS` 对应；修改结构先补校验。
- 题目为 `{id, prompt, options, answer, explanation}`，答案是从 0 开始的选项下标。练习只反馈理由，不计分、不持久化；无脚本时可以展开答案和理由。
- 图示必须指向 `static/mathbeauty/figures/<kind>.svg`；出处用 HTTPS，正文禁裸换行、HTML 标签和英文双引号。`content.py::validate` 校验后再缓存加载。

## 同一模型，交互与静态两种呈现

`static/mathbeauty/models.js` 是纯数学函数和 SVG 绘图，浏览器与 Node 共用；
`app.js` 负责控件、数值、反馈和题目接线。没有 CDN、外部字体、运行时网络请求或自动播放。

| 实验 | 模型与显示边界 |
|---|---|
| 黄金分割 | 总长归一化为 100，比较整体／长段与长段／短段；滑块为有限小数，明确显示近似误差 |
| 斐波那契拼图 | 3～12 项，正方形无重叠拼满矩形；四分之一圆端点相接，明确为近似螺线 |
| 种子点阵 | 40～300 点，第 n 点半径与 √n 成正比，固定转角；画框随总点数归一化，不冒充真实植物测量 |
| 正多边形对称 | 3～10 边，按 0.1° 滑块精度判断重合；按最小角转动时避免累积舍入误差 |
| 谢尔宾斯基 | 第 0～6 步，最多 729 个小三角形；分别显示块数、边长比例与总面积比例 |
| 莫比乌斯环 | 忽略厚度的参数曲面；圆点走中心线、箭头表示局部法向，区分一圈反向与两圈恢复；不模拟剪纸 |
| 橡皮片变形 | 圆片／圆环连续变为圆角方片／方环，选定对象的连通块、平面内洞和边界条数保持不变 |
| 欧拉数 | 四面体、立方体、八面体、三角划分立方体与 4×4 周期环面网格；点、边、面由同一网格计算 |

曲面图采用有深度排序的投影；四边形环面网格较粗，外形接近方环，但拓扑连接关系与计数明确。
八张默认状态 SVG 由同一套模型生成，随项目保存。脚本不可用时仍能读图、看默认值、
展开深入内容与答案。页面继承平台主题、字号和侧栏换边设置。

## 准确性与来源

各站末尾保留萨里大学、剑桥 NRICH／Plus／数学讲义、UCI 曲面图库与欧拉公式资料、
Zeeman 拓扑讲义及莫比乌斯环剪切论文的来源链接。外部原文需联网，本地核心阅读不依赖它们。
正文区分有限步骤和无限极限、圆弧拼接和黄金对数螺线、数学模型与真实生物、
有边界的纸片和紧致无边界曲面。欧拉示性数不被当作区分所有空间的唯一标准。

## 生成与验证

在 `primary-system/` 内：

```sh
make mathbeauty-data
node scripts/build_mathbeauty.cjs --check
node --test scripts/test_mathbeauty.cjs
.venv/bin/python manage.py test mathbeauty catalog.tests.CatalogTests
```

`mathbeauty-data` 已接入 `make content-data`，前端测试已接入 `make test-frontend`。
模型测试核对比例定义、方格拼合与圆弧连续、种子半径平方、对称角、分形真实图形面积、
莫比乌斯接缝与法向、环面网格的两面共边与 V－E＋F，不只核对显示字符串。
