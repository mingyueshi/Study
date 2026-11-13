# 朝代版图的轮廓与底图来源

## 历史范围

轮廓数据使用 [Cliopatria v0.2.1](https://github.com/Seshat-Global-History-Databank/cliopatria/tree/v0.2.1)。这项 Seshat 数据集用经纬度多边形和起止年代记录历史政权，项目介绍见 [Scientific Data 论文](https://www.nature.com/articles/s41597-025-04516-9)。数据许可为 CC BY 4.0。

本页按 22 个观察阶段选择对应年份的记录，将中文名称和地理标签集中到本地文件 `territory-geo.js`。每个区域保留源政权名称和原记录起止年。坐标保留到小数点后三位，图面为教学概略范围，界线的历史准确程度受原始重建资料限制。

- 夏不在 Cliopatria 的重建范围内。本页参考原有中文教学图，以虚线圈出黄河中游主要活动地区；中心标记为二里头一带。
- 春秋与战国分别显示若干主要诸侯国；三国、南北朝、宋辽金按政权分色。同一时期的原始合并区域记录未重复绘制。
- 数据集在 347—370 年将南方晋的记录命名为 Western Jin，页面按这一时期的历史名称标为东晋，几何坐标沿用原记录。
- 五代十国选择约 930 年快照，以后唐与吴、楚、吴越、南汉、闽、荆南等观察并立格局。
- 清选择约 1780 年快照，并将数据集单列的西藏地区与清朝轮廓同色显示，按原教学图一起观察。此处属于专题编排，保留两份原始轮廓及其出处。

## 自然底图

陆地采用 [Natural Earth 110m land](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson)，河流采用 [Natural Earth 50m rivers](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_rivers_lake_centerlines.geojson)。Natural Earth 数据为公有领域。本页裁取东亚陆地，选黄河、长江、黑龙江和澜沧江—湄公河作为定位线索。

地图使用同一经纬度投影和视窗。切换阶段时保留视角，叠加层直接绘制于同一底图，适合比较变化方向。都城与中心标记以通行地名作导读。

## 教学参考图

原有 21 张中文历史地图来自密西西比大学个人网页所收录的[《中国古代史地图》](https://home.olemiss.edu/~gg/hstrymap/lishidit.htm)，收在页面的可展开参考区。它们保留原图标题、图例、比例尺和小图，时代范围可能与矢量快照不同，不能逐像素对齐。网页未注明完整的原书版本信息，放大清晰度受扫描原件限制。

## 原图与页面阶段

| 阶段 | 页面年代 | 本地文件 | 原始出处 |
| --- | --- | --- | --- |
| 夏朝活动范围 | 约前 21—前 16 世纪 | `assets/territory/bc22bc11.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/bc22bc11.jpg) |
| 商朝活动范围 | 约前 16—前 11 世纪 | `assets/territory/bc22bc11.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/bc22bc11.jpg) |
| 西周与诸侯国 | 前 1046—前 771 年 | `assets/territory/bc11b771.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/bc11b771.jpg) |
| 春秋列国 | 前 770—前 476 年 | `assets/territory/b770b476.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/b770b476.jpg) |
| 战国七雄 | 前 475—前 221 年 | `assets/territory/b475b221.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/b475b221.jpg) |
| 从六国到秦统一 | 前 230—前 209 年间 | `assets/territory/b230b209.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/b230b209.jpg) |
| 西汉与西域 | 西汉时期 | `assets/territory/b2060025.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/b2060025.jpg) |
| 魏、蜀、吴并立 | 229—263 年间 | `assets/territory/02290263.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/02290263.jpg) |
| 西晋与人口迁徙 | 301—311 年间 | `assets/territory/03010311.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/03010311.jpg) |
| 东晋与十六国 | 4—5 世纪前期 | `assets/territory/03040439.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/03040439.jpg) |
| 刘宋与北魏 | 420—479 年间 | `assets/territory/04200479.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/04200479.jpg) |
| 南齐与北魏 | 479—502 年间 | `assets/territory/04790502.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/04790502.jpg) |
| 梁、东魏与西魏 | 534—557 年间 | `assets/territory/05020557.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/05020557.jpg) |
| 陈、北齐与北周 | 557—577 年间 | `assets/territory/05570589.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/05570589.jpg) |
| 隋统一南北 | 589—618 年间 | `assets/territory/05890618.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/05890618.jpg) |
| 唐前期与都护府 | 7—8 世纪前期 | `assets/territory/06690907.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/06690907.jpg) |
| 五代十国 | 10 世纪 | `assets/territory/08910979.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/08910979.jpg) |
| 北宋、辽与西夏 | 1038—1125 年间 | `assets/territory/10381125.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/10381125.jpg) |
| 南宋、金与西夏 | 1127—1234 年间 | `assets/territory/11271234.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/11271234.jpg) |
| 元与行省 | 元朝时期 | `assets/territory/12791368.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/12791368.jpg) |
| 明朝与周边地区 | 明朝时期 | `assets/territory/13681644.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/13681644.jpg) |
| 清前期的范围 | 18 世纪至 19 世纪前期 | `assets/territory/16441840.jpg` | [原图](https://home.olemiss.edu/~gg/hstrymap/16441840.jpg) |
