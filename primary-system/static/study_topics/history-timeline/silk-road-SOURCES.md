# 丝绸之路：资料与维护

入口为 `/history/timeline/silk-road.html`，城市档案为 `silk-city.html?city=quanzhou`。首批含 2 类路线、12 座城市、6 类贸易品、4 组文化交流。核对日期：2026-11-17。

## 编排与已有精讲

- `silk-road-data.js` 维护路线分支、选读年代、城市问题、商品、文化交流、证据边界与来源；`silk-road-shared.js` 维护索引、检索、链接和经纬度投影。
- 直接加载历史精讲的 `knowledge-dynasties.js` 与 `media.js`，复用 `hu5-3` 的定义及编号，不在专题复制精讲正文与练习。
- 讲解录音和文字稿继续读取 `history/assets/audio/silk-road.m4a` 与 `silk-road.txt`。模型图片继续读取 `HISTORY_MEDIA.zhenghe` 的文件和主出处；《郑和航海图》继续读取 `TIMELINE_MEDIA.tc27`。没有新建重复音频或图像副本。
- `connections-data.js` 给 `hu5-3` 增加专题入口；张骞及相关事件提供反向链接。所有链接沿用原人物、事件和精讲编号。
- 侧栏默认在右，可切换左右并保存。城市检索只筛目录，路线切换同时筛选地图、商品和文化交流；地图支持选城、前后浏览、聚焦与全览。网址保存路线、城市、检索词与视野。

## 路线与年代的边界

陆路重点选读汉唐以来的代表性路网，海路以宋元贸易网络为中心并联系明代远航。支线概括跨时期的地理联系，不复原某次出使、某个商队或某支船队的完整行程。城市目录顺序不是航次，不表示所有节点同时繁盛；陆海路线长期并存，不作简单替代叙事。

图中自然陆地不显示国界。城市为古今地名相联系的概略定位，不能据此判断古代行政范围；忽鲁谟斯使用约 1300 年迁至岛上以后的点位，档案明确区分较早的大陆旧城。南缘、北缘与海上航线都为教学概括，不能用于现代导航、通关或精确里程计算。

商品的产地、集散地和发现地点分别讨论。作物传播不集中归于张骞一次出使；出土外来器物不直接证明船员国籍或未经中转。宗教、语言、艺术与技术交流都通过具体材料进入，不把陶俑、壁画当作现场录像。

UNESCO 的预备名单文本与正式列入世界遗产的资料明确区分。问题、参考回答及运输条件分析是教学解释，不伪装成古人原话。

## 底图输入与生成

`assets/silk-road/ne-110m-land.geojson` 随项目保留 [Natural Earth 110m land 原始输入](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson)，数据为公有领域。由 `scripts/build_silk_road_map.py` 裁取东经 40°—126°、南纬 8°—北纬 49°，生成 `silk-road-geo.js`。不依赖第三方地图库或在线地图服务。

在 `primary-system/` 中运行：

```sh
.venv/bin/python scripts/build_silk_road_map.py
.venv/bin/python scripts/build_silk_road_map.py --check
node content_sources/test/test-silk-road.js
node --test scripts/test_silk_road.cjs
make study-topics-data
.venv/bin/python scripts/build_study_topics.py --check
```

## 新增本地图像

均保留原始出处与署名，未将馆方图像统一标成开放许可。Commons 图片使用站点提供的缩小副本。

| 文件 | 内容与边界 | 署名与出处 |
| --- | --- | --- |
| `camel.jpg` | 唐三彩载乐骆驼；艺术造型有比例夸张，不是商队实录。 | [中国国家博物馆藏、官网图像](https://www.chnmuseum.cn/zp/zpml/kgfjp/202008/t20200824_247230.shtml) |
| `mogao.jpg` | 莫高窟 2006 年外观照片，含后世修建与保护设施。 | [Yaohua2000，CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Mogao_Caves.jpg) |
| `quanzhou.jpg` | 清净寺门楼及周边建筑现状，照片拍摄于 2012 年；不同建筑不能一概归为宋代。 | [Zhangzhugang，CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Quanzhou_Qingjing_Si_20120229-01.jpg) |
| `afrasiab.jpg` | 约 7 世纪阿弗拉西阿卜壁画西壁图像，已有缺损；人物身份应结合铭文与研究。 | [Thorsten Greve，PD-Art](https://commons.wikimedia.org/wiki/File:Afrasiab._West_wall_of_the_Hall_of_the_Ambassadors._Mid_7th_century_CE.jpg) |

## 内容资料入口

- [UNESCO 世界遗产中心 · 长安—天山廊道的路网](https://whc.unesco.org/en/list/1442/)
- [UNESCO 世界遗产中心 · 泉州：宋元中国的世界海洋商贸中心](https://whc.unesco.org/en/list/1561/)
- [UNESCO 世界遗产中心 · 莫高窟](https://whc.unesco.org/en/list/440/)
- [UNESCO 世界遗产中心 · 撒马尔罕：文化交汇之地](https://whc.unesco.org/en/list/603/)
- [UNESCO 丝绸之路项目 · 丝路的路线、货物与交流](https://www.unesco.org/en/silk-roads/about-silk-roads)
- [UNESCO 丝绸之路项目 · 从历史文献理解丝路交流](https://en.unesco.org/silkroad/publications/silk-roads-brief-history-documents)
- [澳门文化遗产网 · 海上丝绸之路的空间网络与港口](https://www.culturalheritage.mo/msricf/2022/en/about/msr/)
- [中国提交、UNESCO 预备名单 · 中国境内丝路与海上港口的申遗资料](https://whc.unesco.org/en/tentativelists/6093/)
- [UNESCO 丝路研究资料 · 苏门答腊东岸的考古与贸易线索](https://en.unesco.org/silkroad/sites/default/files/knowledge-bank-article/the_establisment_of_islamic_rule_in_eastern_coast_of_sumatra.pdf)
- [国际制图协会研究论文 · 1375 年加泰罗尼亚地图与约 1300 年的忽鲁谟斯](https://ica-adv.copernicus.org/articles/1/11/2019/)
- [也门提交、UNESCO 预备名单 · 亚丁古城的地理与港口作用](https://whc.unesco.org/en/tentativelists/6858/)
- [中国国家博物馆 · 三彩釉陶载乐骆驼](https://www.chnmuseum.cn/zp/zpml/kgfjp/202008/t20200824_247230.shtml)
- [史密森学会 · 阿弗拉西阿卜壁画与粟特人的世界](https://sogdians.si.edu/afrasiab-mural-paintings/)
