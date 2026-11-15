# 真实河道数据与河谷地形

## 河道来源

3D 页的河道不再读取 `map-data.js` 的教学折线。`river-centerlines.json` 保存独立的 WGS84 河道中心线与来源快照；`china-rivers-data.js` 增加真实 DEM 采样高程，供页面离线使用。名称、正文和稳定地点 ID 仍复用原档案。

| 地点 ID | 河流 | 几何来源与显示范围 |
|---|---|---|
| f20 | 长江 | HydroRIVERS 源区—通天河—金沙江上游链，接 OpenStreetMap 宜宾至入海口河道 |
| f21 | 黄河 | OpenStreetMap 黄河主河道，湖区资料缺口保留分段 |
| f41 | 珠江 | HydroRIVERS 南盘江—红水河—西江主干，未绘出全部分汊 |
| f40 | 黑龙江 | OpenStreetMap 主河道，保留中俄边境至抚远附近范围 |
| f42 | 淮河 | HydroRIVERS 上游至洪泽湖，不继续将入江通道和长江标作淮河 |
| f43 | 京杭大运河 | OpenStreetMap 运河主线，保留资料中的分段 |

- [HydroRIVERS v1.0](https://www.hydrosheds.org/products/hydrorivers)：由约 500 米（15 角秒）水文网格提取。使用亚洲包，沿 `NEXT_DOWN` 追踪连通河段，保存原 `HYRIV_ID` 清单；[技术文档](https://data.hydrosheds.org/file/technical-documentation/HydroRIVERS_TechDoc_v10.pdf)。出处：Lehner, B. 与 Grill, G.（2013），[Global river hydrography and network routing](https://doi.org/10.1002/hyp.9740)。数据保留 HydroSHEDS License Agreement。
- © OpenStreetMap contributors，数据按 [ODbL 1.0](https://www.openstreetmap.org/copyright) 提供。使用关系 [9392345（长江）](https://www.openstreetmap.org/relation/9392345)、[171843（黄河）](https://www.openstreetmap.org/relation/171843)、[197653（黑龙江）](https://www.openstreetmap.org/relation/197653)、[1112801（京杭大运河）](https://www.openstreetmap.org/relation/1112801) 的主河道成员，排除支流、旁汊；仅合并完全重合的端点。OSM 派生河道部分保留 ODbL，页面保留署名与许可链接。
- 访问日期：2026-11-15。`sources` 保存下载 URL、原文件 SHA-256、OSM 关系版本、更新时间及 way ID。原始下载文件留在仓库外，选取后的河道和来源清单随系统发布。

## 处理方式与精度

河道最多以 0.00025 度（约 30 米）容差做简化，不以原示意折线平滑或移动河道。长江两来源在宜宾共同河段接合，接合距离约 0.0026 度，具体距离随生成数据保存；原始资料的不相接河段保留分段。资料年代、源分辨率、河口变化与地形采样都限制精度，这些数据适合观察全国河流及河谷，不是航行、工程测量或实时水位资料。

全国地形继续用 0.08 度底网；沿真实河道加密到 0.01 度（约 1 千米），并加入河道坐标节点。河谷使用 Mapzen Terrarium 第 9 级 DEM，当前瓦片来源为 SRTM 等公开高程资料，具体见 `china-terrain-data.js` 的 `source.riverTiles`。这里的第 9 级是瓦片层级，不是九米分辨率。河谷 DEM 与底网之间渐变过渡，避免高程源切换的突变。细网格与粗网格交界补齐边缘节点。简化省界自身的微量重叠、裁切取整仍可能带来细小表面接缝。

少量 SRTM 陆地像元有低于负 500 米的异常毛刺，构建时用 5×5 邻域中值替代，逐瓦片记录 `invalidLandPixelsRepaired`，原文件校验和不变；海洋像元不按此规则修改，吐鲁番等内陆真实负海拔仍保留。

渲染时在每个地形三角形边界切分河段，河段端点和中间部分使用同一地形表面。重叠省界取可见的上表面；中点与线性高程相差超过 2 米时继续细分，直到贴合或水平跨度不足约 0.1 米的数值接缝。绘制偏移仅用于避免深度闪烁，不把蓝线当水位，不通过压低整个流域或绘制长直线制造河谷。边境与河口超出简化国土模型时使用该河段本地保存的 DEM 高程，保留真实经纬度，不向国界内硬吸附。

## 重建

平时运行、部署与测试不联网、不需要新增 Python 依赖。重建时使用仓库外的独立 Python 环境：

```sh
python -m pip install numpy==2.2.6 shapely==2.1.2 pillow==11.3.0 scipy==1.16.3 pyshp==2.3.1
python content_sources/geo-map/scripts/build-rivers.py --cache /tmp
python content_sources/geo-map/scripts/build-terrain.py --cache /tmp/study-terrain-tiles
make study-topics-data
node content_sources/test/test-geo-map.js
node --test scripts/test_china_3d.cjs
```

`build-rivers.py` 的输入缓存：

- `/tmp/study-hydrorivers-asia.zip`：下载自 `https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_as_shp.zip`，解压到 `/tmp/study-hydrorivers-asia/`。
- `/tmp/study-yangtze-osm.xml`、`study-yellow-osm.xml`、`study-amur-osm.xml`、`study-canal-osm.xml`：分别下载对应关系的 `https://api.openstreetmap.org/api/0.6/relation/关系ID/full` 快照。更新快照会改变版本与校验和；精确复现须保留同一缓存。

只重建地形时直接使用随项目保存的 `river-centerlines.json`，无需重新获取河道。高程缓存完整时可给 `build-terrain.py` 加 `--offline`。河道、地形共同保存 `centerlinesSHA256`，校验不允许两者采用不同的中心线版本。

## 流向与端点注记

`china-3d-data.js` 的 `rivers[].flow` 为每段中心线显式记录下游方向，并通过 `flowCenterlinesSHA256` 绑定核验过的河道版本。HydroRIVERS 段按 `NEXT_DOWN`；当前 OSM 黄河段、黑龙江段根据上下游端点与河网连接逐段核验。方向不由高程逐点递减或简单的西向东推断。动画分别沿每个已显示的贴地分段前进，原资料缺口不连线。

端点使用源区、入海区域等大致位置，长江和黄河的标点取交付河道首尾；珠江源区与入海区域另用地域提示，不把当前西江截取河段末点当成唯一海口。黑龙江实际海口在国土模型外，因此用图内末端表示继续流向；淮河只显示至洪泽湖；京杭大运河标南北端，不赋予统一自然流向。

解说来源分别随每条水系保存：重庆市水利局（长江）、宁夏水利厅（黄河）、云南省水利厅及交通运输部珠江航务管理局（珠江）、中国科学院地理资源所（黑龙江）、河南省水文水资源中心（淮河）、中国网信网转载大运河分水与调水报道（运河）。访问日期：2026-11-15。标点不表示精确泉眼、实时河口或水位。

## 沿河镜头行程

长江和黄河分别使用交付中心线的完整范围，按分段水平弧长推进，镜头目标海拔沿用已经贴合三角网的河道。站点锚点吸附到最近的交付河道节点，按源区至海口顺序校验；源头和海口用各路线首尾，湖区缺口不补线。城市名称指附近的河段，不代表城市中心坐标或实景航拍。

24 个站点的说明、观察问题、关联档案与参考来源保存在 `china-river-tour-data.js`。参考中国科学院地理资源所、川渝六江生态廊道规划、地方水利部门、生态环境部、文化和旅游部、地方档案馆及山东大学黄河国家战略研究院的公开资料，逐站保存出处链接，访问日期为 2026-11-15。演示速度和地图高度倍率不用于估计航行时间。
