# 流域、支流与立体湖面

本批次继续使用原有 6 条主要水系、6 个湖泊的地点 ID 与原始地形，不增加运行时联网请求。新正文维护在 `china-hydrology-data.js`，新几何与地形掩膜由 `scripts/build-hydrology.py` 生成到 `china-hydrology-geo.js`。

## 流域图层

采用 [HydroBASINS v1c 亚洲标准第 5 级](https://www.hydrosheds.org/products/hydrobasins)。按 `MAIN_BAS`、`PFAF_ID` 和 `ENDO` 提取汇水区，与既有中国省域模型相交。几何保留所用 `HYBAS_ID`，下载包保留 SHA-256；使用遵循 HydroSHEDS 数据条款。

| 水系 | 图层范围 | 面积文字的口径 |
| --- | --- | --- |
| 长江 | 主流域，排除 HydroBASINS 中汇向洪泽湖的淮河部分 | 通行约数约 180 万平方千米，参考[长江流域概况](https://cjjjd.ndrc.gov.cn/zoujinchangjiang/jingjishehuifazhan/201907/t20190713_941469.htm) |
| 黄河 | 主流域，排除另列的内流终点子流域 | 黄河区约 80 万平方千米，参考[黄河流域水功能区划](https://huanghejg.mee.gov.cn/xxgk/hhlyjxbzhgk/hhsgnqh/202001/t20200119_760240.html) |
| 珠江 | 西江、北江所在主流域与东江主流域合并 | 全流域约 45 万、中国境内约 44 万平方千米，参考[珠江水系范围](https://zjhy.mot.gov.cn/hudongjl/requestion/202312/t20231204_3962002.html) |
| 黑龙江 | 主流域与中国模型相交的部分 | 面积文字为跨中国、俄罗斯和蒙古的全流域约 184 万平方千米，参考[中国科学院地理资源所](https://igsnrr.cas.cn/cbkx/kpyd/zgdl/cnszy/202009/t20200910_5692419.html) |
| 淮河 | `PFAF_ID` 以 4342 开头的汇向洪泽湖部分 | 全流域约 27 万平方千米包含淮河、沂沭泗两个水系；图层不是这 27 万平方千米的完整范围，参考[中国科学院地理资源所](https://igsnrr.cas.cn/cbkx/kpyd/zgdl/cnszy/202009/t20200910_5692422.html) |

HydroBASINS 按自然地形和水流连接提取，不等同于水利部门的完整管理边界或面积统计口径。平原水网、人工通道、内流区和三角洲都有资料概化。因此面积文字是引用的参考约数，**不从模型面片反算面积，不把跨国全流域与图内部分直接排序**。京杭大运河不生成独立天然流域。

浏览器显示采用绑定既有 DEM 三角形的掩膜，按三角形中心判定归属，随真实地形起伏。掩膜不是洪水淹没范围。边缘受约 6—9 千米底网及河谷加密网格限制；文件另存约 0.018 度简化的多边形用于核对，不将一片省份或大矩形冒充流域。源地形文件指纹变化后必须重新生成。

## 支流与水系支干

新增 16 条代表河流，取自 [Natural Earth 1∶1000 万河流中心线](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/)。用 `rivernum` 精确选择，保留 `ne_id` 和源包指纹，按中国模型裁切，最多以 0.002 度容差简化。原有六条主线继续使用 [RIVER-SOURCES.md](RIVER-SOURCES.md) 的 HydroRIVERS 与 OpenStreetMap 河道，没有替换为概化河网。

- 长江：雅砻江、岷江、嘉陵江、乌江、汉江、湘江、沅江、赣江。湘江、沅江经洞庭湖水系，赣江经鄱阳湖与长江相连，不强拉直线接到干流。
- 黄河：渭河、汾河。
- 珠江：北江、东江、柳江。北江与东江标为珠江水系主要河流，不能都说成西江的支流。
- 黑龙江：松花江、乌苏里江。
- 淮河：颍河。

支流沿现有地形三角边切分并采样，保留资料缺口，越出地形覆盖时不画线，不人为平滑或补连。颜色为深蓝干流、浅蓝支流或水系支干、湖蓝湖面；线宽不代表真实河宽。全国概化河网与更细主线可能存在位置偏差，不作工程或航行依据。

## 湖面与湖盆

保留原 6 处 Natural Earth 湖泊轮廓，按省界裁切后作向上的约束三角剖分。每个湖的所有面片共享一个显示高度，半透明湖面不再随 DEM 波动。高度取湖内有效 DEM 采样的第 30 百分位作为估计；本组 6 处地表湖的显示下限是海平面。太湖附近原 DEM 有负值，不能直接当水面高度，故使用这个下限。**该高度不是实测或实时水位，不用于读数。**

湖面下方相交的显示地形面片适度压低到估计水面以下约 25 米，提供可见的湖盆；深度是观察示意，不是实测水深。只替换显示顶点，原始顶点、高程、河流采样、剖面和判题数据均保留。点击地形的海拔读数仍从原采样器读取。关闭湖泊会完整恢复显示地形。水面和湖盆随高度倍率、省份抬起及缓升保持一致。

## 河口观察

长江三角洲与河口、黄河三角洲、珠江口三个按钮会停止原漫游并切到局部视角，同时说明泥沙沉积、分汊、潮流和波浪。珠江不补画缺失的全部口门，黄河也不表示岸线一直向外推进。可返回整条河流。

深链接支持 `?river=f20&estuary=yangtze-mouth`、`?basin=f20` 和 `?lake=f22`。原省份、地形、河流与漫游链接继续可用。

## 重建与验证

在 `content_sources/geo-map/` 下运行，原下载包留在仓库外：

```sh
curl -fL https://data.hydrosheds.org/file/hydrobasins/standard/hybas_as_lev05_v1c.zip -o /tmp/study-hybas-as-05.zip
curl -fL https://naciscdn.org/naturalearth/10m/physical/ne_10m_rivers_lake_centerlines.zip -o /tmp/study-ne-rivers.zip
uv run --with pyshp==2.3.1 --with shapely==2.1.2 python scripts/build-hydrology.py --cache /tmp
```

回到 `primary-system/` 运行 `node content_sources/test/test-china-hydrology.js`、`make study-topics-data`、`make test-frontend` 和 `.venv/bin/python manage.py test catalog.test_study_topics`。
