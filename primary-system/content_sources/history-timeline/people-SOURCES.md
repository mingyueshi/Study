# 历史人物馆资料说明

## 编排与事实边界

首批 24 位人物、四类身份、18 条关系、24 个关键决策或创作选择案例。人物与关系正文集中在 `people-data.js`，各档案、关系说明与决策展开区都提供事实出处，外部核查标明「需联网」。核心正文、关系图与图片随系统保存。

- 人物分类用于发现内容，不代表一个人只从事一个领域。
- 直接关系只用于任职和有据可查的交往；学术承接、后世推重、同代环境与主题比较分别标注。虚线不表示见过面、合作或师承，图下文字优先于连线简写。
- 关键决策案例按背景、实际做法、后续影响与证据局限编排。「先想一想」为教学问题，非历史人物原话或心理记录。文学和艺术案例可讨论作品中可观察的表达选择，不虚构作者的私人决策过程。
- 生卒不详或有异说时，用 `null` 和文字说明保留不确定性；代表年份只用于进入时间轴，不用于补造生卒年。公元前年份为负数，没有零年。牛顿日期按公历显示。
- 张衡地动仪区分古籍记载、失传原器与现代复原；《兰亭序》、顾恺之与吴道子相关图像区分原迹、摹本和传统归属；诗文与画卷不等同于逐日实录或完整社会调查。
- 档案的 `eventIds` 只指向已有事件，事件页反向读取人物索引。资料正文不在两个位置重复维护。

## 图像来源与使用说明

图片下载于 2026-11-17，保留源站公开提供的教学副本。维基共享资源图片的原始作者、馆藏与授权以每条原图页为准；现代雕塑照片在署名中保留摄影者和 CC BY-SA 版本。故宫官网图像用于本项目个人教学，未把官网数字图像另行声称为开放许可。王羲之复用本目录已有 `assets/history/lanting.jpg`。图片未作为人物真实相貌的证明。

| 人物 | 本地文件 | 图像说明 | 来源与署名 |
| --- | --- | --- | --- |
| 秦始皇 | [assets/people/qin-shihuang.jpg](assets/people/qin-shihuang.jpg) | 19 世纪绘制的秦始皇像，属于后世想象。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:QinShiHuang19century.jpg) |
| 汉武帝 | [assets/people/han-wudi.jpg](assets/people/han-wudi.jpg) | 后世刊本中的汉武帝像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:%E4%B8%89%E6%89%8D%E5%9C%96%E6%9C%83_%E6%BC%A2%E6%AD%A6%E5%B8%9D%E5%8A%89%E5%BE%B9%E7%9B%B8.jpg) |
| 唐太宗 | [assets/people/tang-taizong.jpg](assets/people/tang-taizong.jpg) | 后世流传的唐太宗绘像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Tang_Emperor_Taizong.jpg) |
| 武则天 | [assets/people/wu-zetian.png](assets/people/wu-zetian.png) | 传统武则天绘像，非当时实录。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:%E5%94%90%E5%90%8E%E8%A1%8C%E5%BE%9E%E5%9C%96_%28%E5%B1%80%E9%83%A8%29_-_%E6%AD%A6%E5%89%87%E5%A4%A9.png) |
| 诸葛亮 | [assets/people/zhuge-liang.jpg](assets/people/zhuge-liang.jpg) | 后世绘制的诸葛亮像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:%E6%98%8E%E4%BA%BA%E7%BB%98_%E3%80%8A%E8%AF%B8%E8%91%9B%E4%BA%AE%E5%83%8F%E3%80%8B%EF%BC%88%E5%8D%97%E8%96%B0%E6%AE%BF%E6%9C%AC%EF%BC%89.jpg) |
| 张骞 | [assets/people/zhang-qian.jpg](assets/people/zhang-qian.jpg) | 敦煌壁画中的张骞出使场景，非汉代现场记录。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:ZhangQianTravels.jpg) |
| 张衡 | [assets/people/zhang-heng.jpg](assets/people/zhang-heng.jpg) | 张衡墓地的现代纪念塑像。 | [Windmemories 摄 · CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:20251004_Tomb_of_Zhang_Heng_03.jpg) |
| 祖冲之 | [assets/people/zu-chongzhi.jpg](assets/people/zu-chongzhi.jpg) | 祖冲之的现代纪念雕塑。 | [三猎 摄 · CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:%E7%A5%96%E5%86%B2%E4%B9%8B%E9%93%9C%E5%83%8F.jpg) |
| 沈括 | [assets/people/shen-kuo.jpg](assets/people/shen-kuo.jpg) | 沈括的现代纪念塑像。 | [Hans A. Rosbach 摄 · CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Beijing_Ancient_Observatory_20090715-19_%28cropped%29.jpg) |
| 徐光启 | [assets/people/xu-guangqi.jpg](assets/people/xu-guangqi.jpg) | 历史版画：左为利玛窦，右为徐光启。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Kircher_-_Toonneel_van_China_-_Ricci_and_Guangqi.jpg) |
| 伽利略 | [assets/people/galileo.jpg](assets/people/galileo.jpg) | 伽利略肖像画。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Galileo_Galilei_(1564-1642)_RMG_BHC2700.tiff) |
| 牛顿 | [assets/people/newton.jpg](assets/people/newton.jpg) | 牛顿肖像画。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Portrait_of_Sir_Isaac_Newton%2C_1689_%28brightened%29.jpg) |
| 司马迁 | [assets/people/sima-qian.jpg](assets/people/sima-qian.jpg) | 后世绘制的司马迁像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Si_maqian.jpg) |
| 李白 | [assets/people/li-bai.jpg](assets/people/li-bai.jpg) | 后世绘制的李白像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:LiBai.jpg) |
| 杜甫 | [assets/people/du-fu.jpg](assets/people/du-fu.jpg) | 后世绘制的杜甫像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Dufu.jpg) |
| 苏轼 | [assets/people/su-shi.jpg](assets/people/su-shi.jpg) | 后世流传的苏轼绘像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Su_shi.jpg) |
| 曹雪芹 | [assets/people/cao-xueqin.jpg](assets/people/cao-xueqin.jpg) | 曹雪芹的现代纪念雕塑。 | [Yongxinge 摄 · CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Statue_of_Cao_Xueqin.JPG) |
| 莎士比亚 | [assets/people/shakespeare.jpg](assets/people/shakespeare.jpg) | 传统认作莎士比亚的肖像画。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:William_Shakespeare_by_John_Taylor%2C_edited.jpg) |
| 王羲之 | [assets/history/lanting.jpg](assets/history/lanting.jpg) | 《兰亭序》摹本，属于书法作品，非人物肖像。 | [传唐冯承素摹 · 故宫博物院藏 · 公有领域](https://commons.wikimedia.org/wiki/File:XingshuLantingxv.jpg) |
| 顾恺之 | [assets/people/gu-kaizhi.jpg](assets/people/gu-kaizhi.jpg) | 传顾恺之《洛神赋图》卷的宋代摹本局部，非人物肖像。 | [故宫博物院藏 · 故宫博物院官网教学图像](https://www.dpm.org.cn/collection/paint/234597.html) |
| 吴道子 | [assets/people/wu-daozi.jpg](assets/people/wu-daozi.jpg) | 传吴道子所绘孔子像的后世图像，画中是孔子，非吴道子本人。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Confucius_Tang_Dynasty.jpg) |
| 张择端 | [assets/people/zhang-zeduan.jpg](assets/people/zhang-zeduan.jpg) | 张择端《清明上河图》卷局部，属于作品，非人物肖像。 | [故宫博物院藏 · 故宫博物院官网教学图像](https://www.dpm.org.cn/collection/paint/228226.html) |
| 达·芬奇 | [assets/people/leonardo.png](assets/people/leonardo.png) | 传梅尔齐绘制的达·芬奇肖像。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Francesco_Melzi_-_Portrait_of_Leonardo_%28colour_correction%29.png) |
| 米开朗琪罗 | [assets/people/michelangelo.jpg](assets/people/michelangelo.jpg) | 米开朗琪罗肖像画。 | [维基共享资源收录 · 公有领域](https://commons.wikimedia.org/wiki/File:Michelangelo_Daniele_da_Volterra_%28dettaglio%29.jpg) |

## 文字与关系依据

以下是 `sources` 注册表，按人物与关系字段引用。机构说明用于基本事实，原典用于可直接阅读的文字证据；后续影响与讨论边界为教学编写时的解释，应与所引史实区分。

- `qin-edict`：[中国国家博物馆 · 秦始皇、秦二世双诏版](https://www.chnmuseum.cn/zp/zpml/csp/202008/t20200826_247416.shtml)
- `han-envoy`：[中国国家博物馆 · 中华史诗美术大展·张骞奉使西域](https://en.chnmuseum.cn/Portals/0/web/exhibition/exhibitions/161120Chines-Epic/)
- `tang-advice`：[中国文化研究院 · 唐太宗·兼听纳谏](https://chiculture.org.hk/sites/mainsite/files/2021-07/0108_tangtaizong_yuanwen_cn.pdf)
- `wu-biography`：[吕梁市人民政府 · 武则天](https://www.lvliang.gov.cn/zjll/mlll/lsmr/200702/t20070201_231958.html)
- `wu-court`：[重庆市纪委监委 · 武则天《臣轨》](https://www.dcqjw.gov.cn/ljcq/lsbl/201405/t20140508_477600.html)
- `zhuge-strategy`：[中国文化研究院 · 诸葛亮·隆中对策](https://chiculture.org.hk/sites/mainsite/files/2021-11/0104_zhugeliang_pdf_cn.pdf)
- `zhang-seismoscope`：[中国科学院自然科学史研究所 · 张衡地动仪：史料、功能与复原模型研究](https://english.ihns.cas.cn/institute/OS/journal/shns/201011/t20101109_61115.html)
- `zu-pi`：[中国数字科技馆 · 圆周率的计算](https://www.cdstm.cn/museum/zphc/hxzg2017x/art/2017/art_ab597c13859f46419105c59582a0ea2b.html)
- `shen-book`：[中国国家博物馆 · 《梦溪笔谈》馆藏说明](https://www.chnmuseum.cn/zp/zpml/gjwxbt/202203/t20220301_254035.shtml)
- `xu-science`：[中国科学院光电技术研究所 · 徐光启与科学著作](https://www.ioe.cas.cn/qtgn/zt/lstk/201311/t20131114_3978564.html)
- `xu-galileo`：[中国科学院国家天文台 · 伽利略与徐光启的同时代科学背景](https://nao.cas.cn/news/zh/202203/t20220330_6414746.html)
- `galileo-museum`：[伽利略博物馆 · Galileo Galilei 生平与望远镜观测](https://catalogue.museogalileo.it/biography/GalileoGalilei.html)
- `newton-project`：[牛津大学 Newton Project · 牛顿生平与著作年表](https://newtonproject.ox.ac.uk/his-life-and-work-at-a-glance)
- `sima-bio`：[故宫博物院 · 司马迁](https://www.dpm.org.cn/lemmas/240631.html)
- `sima-letter`：[中国哲学书电子化计划 · 《报任安书》条目与原典引文](https://ctext.org/dictionary.pl?char=%E5%A0%B1%E4%BB%BB%E5%AE%89%E6%9B%B8&if=gb)
- `li-bio`：[济南市人民政府 · 李白](https://www.gsjn.gov.cn/zjjn/cjmr/art/2022/art_c4a08000425a49e8a1d5f9500b2ae453.html)
- `li-du`：[广州市政协 · 李白、杜甫的交往](https://gzszx.gov.cn/wstd/wsmb/33750.shtml)
- `du-poem`：[维基文库·杜甫作品 · 《石壕吏》原文](https://zh.wikisource.org/wiki/%E7%9F%B3%E5%A3%95%E5%90%8F)
- `du-zhuge`：[维基文库·杜甫作品 · 《蜀相》原文](https://zh.wikisource.org/wiki/%E8%9C%80%E7%9B%B8)
- `su-redcliff`：[故宫博物院 · 《后赤壁赋》](https://www.dpm.org.cn/lemmas/243403.html)
- `cao-editions`：[清华大学出版社 · 《红楼梦》的版本与整理](https://www.tup.tsinghua.edu.cn/booksCenter/bookpreface?id=10488101)
- `cao-reading`：[维基文库·原典 · 《红楼梦》第四十八回](https://zh.wikisource.org/wiki/%E7%B4%85%E6%A8%93%E5%A4%A2/%E7%AC%AC048%E5%9B%9E)
- `shakespeare-lease`：[福尔杰莎士比亚图书馆 · 1599 年环球剧场用地租约](https://shakespearedocumented.folger.edu/node/796)
- `wang-lanting`：[故宫博物院 · 宋拓定武本兰亭与王羲之](https://www.dpm.org.cn/collection/impres/228604.html)
- `gu-painting`：[故宫博物院 · 顾恺之与传神论](https://www.dpm.org.cn/lemmas/240503.html)
- `wu-painting`：[故宫博物院 · 吴道子](https://www.dpm.org.cn/lemmas/242062.html)
- `zhang-scroll`：[故宫博物院 · 《清明上河图》手卷](https://www.dpm.org.cn/journal_detail/239215.html)
- `leonardo-study`：[大都会艺术博物馆 · Leonardo da Vinci（1452—1519）](https://www.metmuseum.org/ko/essays/leonardo-da-vinci-1452-1519)
- `michelangelo-david`：[佛罗伦萨学院美术馆 · 米开朗琪罗《大卫》](https://www.galleriaaccademiafirenze.it/en/artworks/david-michelangelo/)
- `florence-artists`：[英国国家美术馆 · 1500 年前后的达·芬奇、米开朗琪罗与拉斐尔](https://www.nationalgallery.org.uk/about-us/press-and-media/press-releases-archive/leonardo-michelangelo-raphael-about-1500)
- `shakespeare-life`：[Shakespeare Birthplace Trust · William Shakespeare Biography](https://www.shakespeare.org.uk/explore-shakespeare/shakespedia/william-shakespeare/william-shakespeare-biography/)

新增字段先补 `content_sources/test/test-history-people.js`；新增人物保持稳定 id，补齐本地图像说明、决策依据与事件关联，再运行目录 README 中的校验和 `make study-topics-data`。
