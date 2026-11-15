# 中国真实地形数据

## 数据来源

- [Mapzen Terrain Tiles · AWS 开放数据登记](https://registry.opendata.aws/terrain-tiles/)，访问日期：2026-11-15。使用公开的 Terrarium PNG 高程瓦片，全国底网使用第 6 级瓦片 117 张，河谷使用第 9 级瓦片 404 张。
- [原始资料与署名说明](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)、[数据来源说明](https://github.com/tilezen/joerd/blob/master/docs/data-sources.md)、[Terrarium 编码](https://github.com/tilezen/joerd/blob/master/docs/formats.md)。源数据是已有的公开地形模型，非实时测量。每张瓦片具体采用的 GMTED、SRTM 等数据来源，以响应的 `x-amz-meta-x-imagery-sources` 为准，已随清单保存。
- 下载端点：`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`。`china-terrain-data.js` 的 `source.tiles`、`source.riverTiles` 保存每张瓦片的 URL、S3 版本、最后修改时间、资料源及 SHA-256，`source.boundarySHA256` 绑定本次采用的省界文件，`source.centerlinesSHA256` 绑定河道输入。
- 行政区范围使用本项目已有 `china-geo.js` 的教学简化轮廓；南海诸岛仍用原小图展示，不套用大陆地形高度。

## 显示精度与处理

Terrarium 按 `R × 256 + G + B / 256 − 32768` 解码为米。构建时拼接瓦片，按经纬度定位像元中心，再做双线性采样。全国底网间隔为 0.08 度，在中国范围约为 6—9 千米；沿河加密至 0.01 度（约 1 千米），并加入真实河道坐标节点，河谷采用更细 DEM，与底网渐变过渡。坐标存为千分之一度整数，高程存为有符号整米。34 个省级行政区共 447599 个顶点、843942 个三角形，小岛和边界单元按原轮廓裁切。各省使用同一高程源，共享顶点高程一致；简化省界微量重叠与裁切取整处仍可能有细小接缝。

原始 DEM 中有 28 个内陆像元低于负 500 米的异常毛刺，使用 5×5 邻域中值修复，并保留原瓦片校验和及逐瓦片修复数量。海岸轮廓和高程像元不完全吻合，距离全国轮廓约 0.12 度以内的负值按海平面收边，避免将海底深度画成海岸断崖；内陆洼地的负海拔保留，例如吐鲁番检查点约 −151 米。部分细小山峰、山谷、海岸和小岛会被简化，不能拿网格读数当山峰测量值。读数标明「此处网格海拔」，按十米取约数。

地图沿用现有等经距示意投影，纬向比例为 1.22；纵向一模型单位约为 `111320 / 1.22` 米。高度默认放大 50 倍，可在 1—80 倍之间调整，1 倍为近似原比例。每次调整都使用原海拔，颜色与海拔读数不随倍率改变。省份选中只高亮边界与色调，不抬升省份。边缘侧壁是展示模型的切面，底座高度不计入海拔。

## 水系与地形名称

6 条水系使用 HydroRIVERS 与 OpenStreetMap 的真实河道中心线，名称和档案继续复用 `map-data.js`。河道输入、覆盖范围及许可见 [真实河道数据说明](RIVER-SOURCES.md)。渲染时按地形三角边切分河段，再以端点和中点检查贴合；省界重叠处使用可见上表面并进一步细分。简化模型以外的边境与河口河段保留真实位置，使用本地 DEM 采样高程。为避免闪烁略微离面，线宽不代表实际河宽，也不表示水位。25 处地形和 6 条水系均可从分类目录定位，名称和原档案维持同一稳定 ID。

## 重新生成

平时运行、部署、`make study-topics-data` 和测试均直接读取已保存的生成物，无需网络或新增 Python 包。只有重建高程时需要在单独的构建环境安装固定版本依赖：

```sh
python -m pip install numpy==2.2.6 shapely==2.1.2 pillow==11.3.0 scipy==1.16.3
python content_sources/geo-map/scripts/build-terrain.py --cache /tmp/study-terrain-tiles
# 缓存完整后可离线复现：
python content_sources/geo-map/scripts/build-terrain.py --cache /tmp/study-terrain-tiles --offline
make study-topics-data
node content_sources/test/test-geo-map.js
node --test scripts/test_china_3d.cjs
```

缓存目录放在仓库外；原始 PNG 不随项目发布，生成脚本、高程网格、河道输入及其来源清单随项目保存。地形回归校验全部省份的三角形、索引、法线、高低对照、内陆负海拔、共享省界高程一致性及高度倍率的反算；浏览器还需核对地形定位、海拔读取、切换配色、控件和降级提示。
