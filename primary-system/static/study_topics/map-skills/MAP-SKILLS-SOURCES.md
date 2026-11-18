# 地图技能专题的资料与模型

专题总览和五站共用 `skills-data.js`，其中定义教学正文、练习题、地点、图层、示范剖面和图片索引。地图计算在 `skills-model.js`，绘图在 `skills-diagrams.js`。执行 `make study-topics-data` 后，用 `node content_sources/test/test-map-skills.js` 校验。

- 青石溪谷是虚构的 600 米 × 450 米练习地图，平面坐标从西南角起算。图上横纵采用同一个缩放率，线段比例尺跟随显示。比例尺按钮提供印刷换算的分母，结果中的厘米是期望的纸面长度。浏览器像素与设备的物理厘米可能不一致。角度从北顺时针量，旋转时同步变化的是图面和指北标。[USGS 地图与指南针](https://pubs.usgs.gov/publication/fs03501)
- 步道沿数据中的节点折线计长。直距和分段值都是水平量，示意中不计坡面或测量误差。图例符号为了辨认可夸大尺寸。[USGS 图例与比例尺资料](https://pubs.usgs.gov/of/1998/of98-805/lessons/chpt1/act3-hnd.htm)
- 教学地形在 10 米规则网格采样，网格按固定对角线划成三角形。各三角内以线性插值得到海拔。连接各三角边上同一高度的交点得到等高线，改等高距只改变所选高度。溪流线用于辨认模型谷地，不是水文计算结果。[USGS 地形图说明](https://www.usgs.gov/faqs/what-a-topographic-map)
- 剖面沿 A→B 取 121 个等间距样点，并纳入与等高线检测到的交点。两图用同一模型，橙色读数点的坐标和高度同步。若选线与等高线局部重合，模型不把重合线段当作一个离散交点。剖面两轴独立，图面坡度受到纵横显示比例影响。[中国民航局航空图编绘规范](https://www.caac.gov.cn/XXGK/XXGK/BZGF/HYBZ/202111/P020211109571091129158.pdf)

两份地形图例保存来源提供的原文件。原图下载链接与 SHA-256 见 `skills-data.js`。

- 分色印刷示例为 USGS 公共领域资料。[Map Separates](https://www.usgs.gov/media/images/map-separates)
- 等高线与地形晕渲图为 USGS 公共领域资料。[Contour lines and shaded relief](https://www.usgs.gov/media/images/contour-lines-and-shaded-relief-a-us-topo-map)
