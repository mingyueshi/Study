# 地球内部专题：内容与素材依据

维护源位于本目录，生成模板与静态资源分别位于 templates/study_topics/earth/ 与 static/study_topics/earth/。不要直接修改生成物。运行 make study-topics-data，使用 --check 核对；源结构校验为 node content_sources/test/test-earth-interior.js，模型回归为 node --test scripts/test_earth_interior.cjs。

## 页面与数据

- 总览及四个分站共 5 页；正文、稳定 ID、模型参数和出处在 earth-data.js，计算在 earth-model.js，交互在 earth-app.js，有限播放在 earth-motion.js。
- 服务入口为 /geography/earth/；分站使用 rocks.html、quakes.html、plates.html、age.html。支持 layer、scale、specimen、boundary、event 查询参数；未知值回到默认状态，不改变旧地理课程或观察记录。
- 使用平台阅读主题、动效偏好与侧栏位置偏好。浏览器不需要下载外部资料即可看正文、图片并操作全部模型；来源链接需要联网。

## 科学口径与模型边界

- 地球平均半径取 6371 千米，地幔底界取约 2890 千米，内外核界取约 5150 千米。洋壳与陆壳厚度不同，等厚 35 千米仅作陆壳比例示例；放大模式将地壳夸大到半径的 7%。描边和剖面均不代表局部实测。
- 地壳、地幔、地核按组成分类；岩石圈、软流圈按力学性质划分。地幔大部分是固态。内核固态、外核液态，不能只按温度判断状态。
- 岩石循环给出多条可能路径。变质作用总体保持固态，熔融另成路径；图片区含三件手标本与一幅砂岩野外露头，不能只凭照片或颜色鉴定。
- 地震波采用均匀介质、20 千米震源深度、P 波 6 千米／秒与 S 波 3.5 千米／秒，按斜距计算到时；不模拟分层、折射、表面波、衰减或破坏，也不用于真实地震的震中定位或预警计算。P／S 波前只显示地下部分。
- 板块台将三类基本边界中的汇聚型再分为海洋俯冲和大陆碰撞。形变、厚度、速度均夸大；转换边界为俯视，另外三种为剖面。地球仪原入口的六组简化分区不作为唯一板块划分。
- 地球年龄采用约 45.4±0.5 亿年。半衰期模型取铀—238 为 44.7 亿年，忽略初始子体、系统开放与中间衰变时间，以大量原子的预期比例展示；实际测年需评估封闭历史并交叉检验。模型可超过地球年龄，用于演示重复减半。
- 地球一天按 45.4 亿年换算成 86400 秒，地质事件采用明确注明的约数。寒武纪起始约 5.4 亿年；地质年代表的精确标定会更新，不把旧版 541 Ma 当作不变精确值。智人约 30 万年对应午夜前约 5.7 秒。

## 核查资料

- [USGS · 板块浮在岩浆上吗？](https://www.usgs.gov/faqs/are-tectonic-plates-floating-magma)：地幔以固态为主，固体在地质时间尺度上的流动。 核对 2026-11-17。
- [NPS · 莫氏硬度](https://www.nps.gov/articles/mohs-hardness-scale.htm)：相对抗刻划能力，石英为 7、方解石为 3。 核对 2026-11-17。
- [USGS · 地球内部](https://pubs.usgs.gov/gip/dynamic/inside.html)：地壳、地幔、地核的组成与分层；深度取教学约数。 核对 2026-11-17。
- [USGS · 地震的科学](https://www.usgs.gov/programs/earthquake-hazards/science-earthquakes)：断层、震源与震中、P 波和 S 波、震级与烈度。 核对 2026-11-17。
- [USGS · 岩石与矿物有什么不同？](https://www.usgs.gov/faqs/what-difference-between-a-rock-and-a-mineral)：矿物的定义、岩石与矿物的关系。 核对 2026-11-17。
- [USGS · 什么是变质岩？](https://www.usgs.gov/faqs/what-are-metamorphic-rocks)：已有岩石在温度、压力与流体作用下改变。 核对 2026-11-17。
- [USGS · 岩石循环](https://pubs.usgs.gov/of/1994/0636/report.pdf)：岩石类型与风化、沉积、变质、熔融、结晶之间的多条路径。 核对 2026-11-17。
- [USGS · 理解板块运动](https://pubs.usgs.gov/gip/dynamic/understanding.html)：张裂、俯冲、碰撞与转换边界及典型实例。 核对 2026-11-17。
- [NOAA · 板块边界](https://oceanexplorer.noaa.gov/ocean-fact/plate-boundaries/)：三类基本边界；本专题将汇聚型再分为俯冲和大陆碰撞。 核对 2026-11-17。
- [NIST · 怎样知道古老事物的年龄？](https://www.nist.gov/how-do-you-measure-it/how-do-you-know-age-fossils-and-other-old-things)：地球年龄约 45.4±0.5 亿年；铀—238 半衰期约 44.7 亿年。 核对 2026-11-17。
- [USGS · 地球年龄](https://pubs.usgs.gov/gip/geotime/age.html)：用陨石、地球与月球样品的同位素证据约束地球形成时间。 核对 2026-11-17。
- [NPS · 地质年代表](https://www.nps.gov/subjects/geology/time-scale.htm)：地质时期的先后与代表事件；本页采用便于比较的约数。 核对 2026-11-17。
- [史密森学会 · 智人](https://humanorigins.si.edu/evidence/human-fossils/species/homo-sapiens)：智人的化石记录可追溯至约 30 万年前。 核对 2026-11-17。

## 本地照片

均从来源提供的图像下载，保留原始字节，不裁切、不改变颜色。展示使用 CSS 等比适配。图片指纹保存在 earth-data.js 中，由源校验检查。

- assets/quartz.jpg：[来源页](https://www.usgs.gov/media/images/quartz-crystal-3)；[所用图像](https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/media/images/quartz_3_0.jpg)。USGS / Office of Communications；Public Domain。石英矿物标本，可见晶体与浅色光泽。
- assets/basalt.jpg：[来源页](https://commons.wikimedia.org/wiki/File:BasaltUSGOV.jpg)；[所用图像](https://upload.wikimedia.org/wikipedia/commons/0/08/BasaltUSGOV.jpg)。USGS / Minerals in Your World；Public Domain。玄武岩手标本，表面呈细粒深灰色。
- assets/sandstone.jpg：[来源页](https://www.usgs.gov/media/images/white-sandstone)；[所用图像](https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/dce00125-1-.jpg)。USGS Personnel / Dakota Water Science Center；Public Domain。美国北达科他州Fox Hills砂岩的野外露头。
- assets/marble.jpg：[来源页](https://commons.wikimedia.org/wiki/File:MarbleUSGOV.jpg)；[所用图像](https://upload.wikimedia.org/wikipedia/commons/8/8d/MarbleUSGOV.jpg)。USGS / Minerals in Your World；Public Domain。大理岩手标本，可观察重新结晶的外观。
- assets/lava.jpg：[来源页](https://www.usgs.gov/media/images/kilauea-volcano-1)；[所用图像](https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/multimediaFile-2145.jpg)。USGS / Hawaiian Volcano Observatory；Public Domain。2018年基拉韦厄裂隙8喷发中的熔岩通道航拍。
- assets/eruption.jpg：[来源页](https://www.usgs.gov/media/images/may-18-1980-eruption-mount-st-helens)；[所用图像](https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/vhp_img5461.jpg)。J. G. Rosenbaum / USGS；Public Domain。1980年5月18日圣海伦斯火山喷发实景。
