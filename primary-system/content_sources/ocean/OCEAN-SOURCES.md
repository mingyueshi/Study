# 海洋世界的模型、图像与来源

五个页面共用 `ocean-data.js` 的正文和图像索引、`ocean-model.js` 的计算和 `ocean-app.js` 的交互。运行 `make study-topics-data` 发布。专题地址为 `/geography/ocean/`，分站支持查询参数 `current`、`phase`、`zone` 和 `profile`。

- 洋流底图复用项目里的 Natural Earth 低分辨率轮廓，纬度显示范围为南纬 70° 至北纬 80°。路线按来源说明手绘，箭头只表示代表方向，拖动进度是图上路径比例。洋流随季节和海况变化。资料见 [NOAA 洋流](https://oceanservice.noaa.gov/facts/current.html) 和专题内的各页参考。
- 潮位按 `h(t) = A · cos(4πt / 1490)` 示意。t 为分钟，大潮取 A = 1.7 米，小潮取 A = 0.7 米，两档共用尺度。振幅是教学设定；只使用单个理想半日分量，不代表具体岸站。参考 [NOAA 太阴日](https://oceanservice.noaa.gov/education/tutorial_tides/tides05_lunarday.html) 和 [大潮与小潮](https://oceanservice.noaa.gov/facts/springtide.html)。
- 水层分段为教学约数。生物照片代表栖息条件，滑块深度不对应照片拍摄深度，也不表示该物种的全部分布范围。压力按海面 1 个大气压、每下潜 10 米增加 1 个大气压估算。依据 [NOAA 海水中的光](https://oceanexplorer.noaa.gov/ocean-fact/light-distributed/)、[水深与压力](https://oceanservice.noaa.gov/facts/pressure.html) 和 [超深渊带](https://oceanexplorer.noaa.gov/expedition-feature/okeanos-ex2102-features-hadalzone/)。
- 两条剖面为手工录入的地貌示意节点，节点间线性插值。纵向夸张，深度范围和读数便于对比，大陆架宽度、地形位置与各节点深度均非实测剖面。参考 [NOAA 大陆边缘与深海地貌](https://osrefresh.oceanexplorer.noaa.gov/edu/curriculum/section4a.pdf) 和 [海底测绘](https://oceanexplorer.noaa.gov/explainers/mapping/)。

本地图片保存原始字节，具体下载地址和 SHA-256 见 `ocean-data.js`。画面署名如下。

| 文件 | 署名与原始出处 |
| --- | --- |
| turtle.jpg | Matt McIntosh / NOAA，[绿海龟照片](https://www.fisheries.noaa.gov/feature-story/11-marvelous-marine-life-photos) |
| squid.jpg | NOAA Fisheries，[草莓鱿照片](https://www.fisheries.noaa.gov/feature-story/11-marvelous-marine-life-photos) |
| cucumber.jpg | NOAA Ocean Exploration / 2026 Cook Islands ROV Exploration，[深海平原的海参](https://oceanexplorer.noaa.gov/ocean-fact/what-are-abyssal-plains/) |
| tubeworm.jpg | NOAA Ocean Exploration / MCR Expedition 2011，[冯达姆热液区管虫](https://oceanexplorer.noaa.gov/multimedia/daily-image-media-20210614/) |
| ridge.jpg | Elliot Lim / CIRES / NOAA NCEI，[全球洋中脊图](https://oceanexplorer.noaa.gov/ocean-fact/mid-ocean-ridge/) |
