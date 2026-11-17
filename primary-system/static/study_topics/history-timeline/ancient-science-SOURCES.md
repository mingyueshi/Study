# 中国古代科技：资料与素材

正文、图注、演示说明与关联的主出处为 `ancient-science-data.js`，来源按条目列出。采集核对日期：2026-11-17。

## 内容与证据边界

- 12 个档案覆盖六类，四大发明分别建档。讲解区分考古实物、古代文献、现代模型与当代教学解释；代表年代只用于定位，不把长期发展压缩为单一发明年。
- 造纸区分蔡伦改进与更早古纸；印刷区分雕版、毕昇泥活字及沈括记述；指南针照片是王振铎复原模型；明代火铳不作为最初火药的实物。
- 天文仪器区分观测仪器、天体模型和地动仪；干支纪日、朔望月与季节协调是不同问题，不把商代牛骨当作《大明历》材料。
- 祖冲之的圆周率界限与密率是不同表达。`355/113` 为近似分数，不写成位于 `3.1415926` 与 `3.1415927` 之间。其《缀术》已佚，演示不是原算法复原。
- 算筹图是清代器物；本草页讨论分类、版本与知识史，不把古代记载直接当作现代疗效证据。
- 都江堰的长期作用依赖分水、排沙、引水与维护，不能解释为永久不需维护或不会遭遇洪水。
- 明清斗栱不等同于唐宋斗栱，木构也非完全不用金属；石桥图复用元代万宁桥照片，图注明确不是赵州桥。

## 本地图像

8 张新增图片为馆方官网图像的本地教学副本，保留馆方署名与原始出处，未标为 CC0。另 5 项直接复用 `media-data.js` 与 `people-data.js` 中的文件和元数据，不另建重复主出处。基础阅读不依赖外链图片。

| 本地文件 | 图像与性质 | 原图 |
| --- | --- | --- |
| `assets/ancient-science/paper.jpg` | 东汉带字纸残片；甘肃武威旱滩坡出土的东汉带字纸。它是早期纸张的实物证据，不是蔡伦个人遗物。 | [原图](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/images/2-4-1-1.jpg) |
| `assets/ancient-science/firearm.jpg` | 明代铜火铳；「雷字六百四十号」铜火铳，属明代永乐时期。它展示后来的火药技术应用，不是最早火药的实物。 | [原图](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/images/2-6-3-1.jpg) |
| `assets/ancient-science/printed-book.jpg` | 南宋刊本《诗集传》；国博所藏南宋刊本，用来观察雕版书页；这张照片不能当作毕昇活字字模的实物图。 | [原图](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/images/2-4-4-1.jpg) |
| `assets/ancient-science/compass-model.jpg` | 缕悬法指南针复原模型；王振铎依据《梦溪笔谈》记述制作的现代复原模型，表现宋代悬挂磁针的方法，并非宋代原物。 | [原图](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/images/2-5-2-1.jpg) |
| `assets/ancient-science/star-chart.jpg` | 南宋天文图碑拓片；南宋淳祐七年（1247）刻石的天文图拓片，图的编制还利用了更早的观测资料。 | [原图](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/images/1-1-5-1.jpg) |
| `assets/ancient-science/rods.jpg` | 清代嵌银乌木算筹；这套算筹属于清代，用于观察计算工具的形态，不能当作祖冲之使用过的原物。 | [原图](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/images/1-2-1-1.jpg) |
| `assets/ancient-science/calendar-bone.jpg` | 商代刻干支表牛骨；商代干支表牛骨展示早期纪日符号；它与南朝《大明历》不是同一时代、同一类材料。 | [原图](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/images/1-1-2-1.jpg) |
| `assets/ancient-science/dougong.jpg` | 故宫木构中的斗栱；故宫建筑中的木构细部。明清斗栱的尺度、位置和装饰作用，与唐宋建筑不能简单等同。 | [原图](https://img.dpm.org.cn/Uploads/Picture/2018/01/18/s5a607b0536486.jpg) |

复用素材：都江堰（`tc12`）、《本草纲目》（`tc29`）、紫禁城（`tc28`）、万宁桥（`tc21`）以及祖冲之后世纪念像（`zu-chongzhi`）。原图属性、作者、许可说明和链接沿用对应主出处。

## 演示模型

- 排印：横向四字教学版面，印面整体镜像，纸面正向。凸版、着墨、转印与复用为示意，不模拟真实纸墨接触和工艺参数。
- 割圆：同一圆的内接、外切正多边形。以现代三角函数计算 `n sin(π/n)` 与 `n tan(π/n)`，分别为周长与直径之比。显示下界向下取值、上界向上取值，避免舍入误导。不是祖冲之失传方法的复原。
- 水利：定性部件联系图。线宽不是流量，分流没有固定百分比，图形不是地形或现状工程测绘。丰水情境额外突出飞沙堰溢流回外江，排沙以独立虚线标明。

## 资料入口

- [中国国家博物馆 · 科技的力量：古代科技实物与说明](https://www.chnmuseum.cn/portals/0/web/zt/202012kxyjs/)
- [甘肃省文化博览局 · 酒泉出土的古纸缀合](https://www.gswbj.gov.cn/a/2024/09/27/22390.html)
- [中国科学技术馆 · 木活字印刷体验](https://cstm.cdstm.cn/cszl/hxzg/jyhd/art/2020/art_a99fb1cef1ef4a17910e28aa38675c93.html)
- [中国国家博物馆 · 《梦溪笔谈》](https://www.chnmuseum.cn/zp/zpml/gjwxbt/202203/t20220301_254035.shtml)
- [中国国家博物馆 · 现存最早有纪年的火炮](https://www.chnmuseum.cn/yj/xscg/xslw/201812/t20181224_33241.shtml)
- [中国国家博物馆 · 简仪模型](https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/t20211116_252346.shtml)
- [故宫博物院 · 日晷](https://www.dpm.org.cn/lemmas/240224.html)
- [中国科学院紫金山天文台 · 历书基本术语简介](https://www.pmo.cas.cn/xwdt2019/kpdt2019/202203/t20220314_6389637.html)
- [中国科学院紫金山天文台 · 历书科普问题解答](https://www.pmo.cas.cn/xwdt2019/kpdt2019/202203/t20220317_6399980.html)
- [中国科学技术馆 · 圆周率的计算](https://www.cdstm.cn/museum/zphc/hxzg2017x/art/2017/art_ab597c13859f46419105c59582a0ea2b.html)
- [中国科学院自然科学史研究所 · 《祖冲之科学著作校释》简介](https://www.ihns.cas.cn/yjcg/xszz/zztj/202212/t20221207_6570702.html)
- [中国科学院自然科学史研究所 · 中国古代是怎么算数的？](https://ihns.cas.cn/kxcb_/kxjd/202212/t20221206_6567234.html)
- [中国国家博物馆 · 中医药学的宝库](https://www.chnmuseum.cn/yj/xscg/xslw/201812/t20181224_33259.shtml)
- [国家图书馆 · 本草纲目与古籍版本](https://www.nlc.cn/migrated/www.nlc.cn/newhxjy/wjsy/wjls/wjqcsy/wjd34q/zhzgyy/201108/P020110826366184693437.pdf)
- [澜湄水资源合作中心 · 都江堰——世界水利史上的璀璨明珠](https://cn.lmcwater.org.cn/knowledge_sharing/water_culture/202007/t20200720_35713.shtml)
- [国家民族事务委员会 · 战国始建的都江堰水利工程](https://www.neac.gov.cn/seac/c103391/202308/1166522.shtml)
- [故宫博物院 · 斗栱千千万](https://www.dpm.org.cn/architectural_art/246282.html)
- [中国国家博物馆 · 安济桥石栏板与敞肩拱](https://www.chnmuseum.cn/zp/zpml/kgfjp/202111/t20211112_252139.shtml)
