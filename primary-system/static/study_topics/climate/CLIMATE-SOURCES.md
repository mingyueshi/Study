# 气象与气候专题的资料与模型

四页的正文和出处维护在 `climate-data.js`，常年值在 `station-normals.js`，地图数据在 `china-climate-grid.js`。执行 `make study-topics-data` 更新生成模板和资源，再用 `node content_sources/test/test-climate-world.js` 核查资料、图片与数据。

## 站点与读图方法

- 11 站的月平均气温（℃）和月降水量（毫米）取自[日本气象厅 ClimatView](https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/outline.html)，参考期 1991–2020 年。表格保留一位小数，站号与坐标取页面元数据。各站原表链接见气候图内「逐月数据与站号」。
- 所有气候图共用 −40 至 40℃、0 至 400 毫米的显示尺度。月均温年较差取最暖与最冷月的差值，各月降水合计为月常年值之和。站点标签用于比较典型组合，分站未用站点表重算柯本编号。
- 露点实验固定初始露点 12℃，只展示未饱和、到达初始露点及继续冷却可能凝结。达到饱和后，气相水汽量会因凝结而变化。图中滴数无物理单位。依据 [NWS 露点和湿度](https://www.weather.gov/lmk/humidity)。

## 分类格网

- [Beck 等（2023）](https://doi.org/10.1038/s41597-023-02549-6) 的柯本–盖格 1991–2020 年观测驱动分类，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。[作者下载页](https://www.gloh2o.org/koppen/)列出原始图例。专题使用 [Stanford Natural Capital Project 提供的数据集](https://data.naturalcapitalalliance.stanford.edu/dataset/sts-b04939b0df93eb3f4305a065933c66122a0edc6fa425b157b99aa7b4b4446d20) 的 [GeoTIFF](https://data.naturalcapitalalliance.stanford.edu/download/global/koppen_geiger_climatezones/koppen_geiger_climatezones_1991_2020_1km.tif)。原文件 SHA-256 为 `3b5a7ddda98e501d7045a7dc35951d22b486630aee4ac015dde04e0d1216a9d0`。
- 本地用 `.venv/bin/python scripts/build_climate_grid.py /path/to/koppen.tif` 裁出东经 72–136°、北纬 17–55° 的范围，取 0.25° 格心所在的原始像元类别。格网自北向南逐行编码，0 表示缺测或海面，1–30 与原图图例对应。渲染时复用地理图谱的省域轮廓裁切，并按亚类代码首字母着色。格心抽样可能遗漏细小格局，省界为底图定位。
- 五个站点标记讲解[我国常见的五种教学气候类型](https://www.locpg.gov.cn/zggq/2014-01/04/c_125956314.htm)，和柯本格网采用不同口径。某代表站周边的分类颜色未必与教学名称一一对应。行政区、温度带、干湿区也不能当作气候格网边界。

## 本地实景

所有素材文件均为来源提供的版本。每张图的下载 URL、署名及 SHA-256 在 `climate-data.js` 中，校验脚本比对字节。

- 积雨云见 [NOAA GML、STERAO-A](https://gml.noaa.gov/aero/about/sheridan/Weather.html)。
- 旧金山海雾见 [NASA Earth Observatory，Jesse Allen 和 Robert Simmon](https://science.nasa.gov/earth/earth-observatory/another-foggy-day-in-san-francisco-79119/)。
- 积雪与沙尘见 [SeaWiFS Project、NASA Goddard 和 ORBIMAGE](https://science.nasa.gov/earth/earth-observatory/snow-and-dust-over-inner-mongolia-1082/)。
- 环状彩虹见 [NOAA NESDIS](https://www.nesdis.noaa.gov/about/k-12-education/optical-phenomena/what-causes-rainbow)。
