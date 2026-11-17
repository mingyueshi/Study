/* 地球内部专题的正文、参数与出处；单位：深度 km，年代 Ma（百万年）。 */
(function (root) {
  'use strict';
  const data = {
    version: 1, radiusKm: 6371, ageMa: 4540, halfLifeMa: 4470,
    sources: [
      {id:'mantle-solid',title:'USGS · 板块浮在岩浆上吗？',url:'https://www.usgs.gov/faqs/are-tectonic-plates-floating-magma',scope:'地幔以固态为主，固体在地质时间尺度上的流动。',checked:'2026-11-17'},
      {id:'hardness',title:'NPS · 莫氏硬度',url:'https://www.nps.gov/articles/mohs-hardness-scale.htm',scope:'相对抗刻划能力，石英为 7、方解石为 3。',checked:'2026-11-17'},
      {id:'inside',title:'USGS · 地球内部',url:'https://pubs.usgs.gov/gip/dynamic/inside.html',scope:'地壳、地幔、地核的组成与分层；深度取教学约数。',checked:'2026-11-17'},
      {id:'seismic',title:'USGS · 地震的科学',url:'https://www.usgs.gov/programs/earthquake-hazards/science-earthquakes',scope:'断层、震源与震中、P 波和 S 波、震级与烈度。',checked:'2026-11-17'},
      {id:'mineral',title:'USGS · 岩石与矿物有什么不同？',url:'https://www.usgs.gov/faqs/what-difference-between-a-rock-and-a-mineral',scope:'矿物的定义、岩石与矿物的关系。',checked:'2026-11-17'},
      {id:'metamorphic',title:'USGS · 什么是变质岩？',url:'https://www.usgs.gov/faqs/what-are-metamorphic-rocks',scope:'已有岩石在温度、压力与流体作用下改变。',checked:'2026-11-17'},
      {id:'cycle',title:'USGS · 岩石循环',url:'https://pubs.usgs.gov/of/1994/0636/report.pdf',scope:'岩石类型与风化、沉积、变质、熔融、结晶之间的多条路径。',checked:'2026-11-17'},
      {id:'plates',title:'USGS · 理解板块运动',url:'https://pubs.usgs.gov/gip/dynamic/understanding.html',scope:'张裂、俯冲、碰撞与转换边界及典型实例。',checked:'2026-11-17'},
      {id:'boundaries',title:'NOAA · 板块边界',url:'https://oceanexplorer.noaa.gov/ocean-fact/plate-boundaries/',scope:'三类基本边界；本专题将汇聚型再分为俯冲和大陆碰撞。',checked:'2026-11-17'},
      {id:'dating',title:'NIST · 怎样知道古老事物的年龄？',url:'https://www.nist.gov/how-do-you-measure-it/how-do-you-know-age-fossils-and-other-old-things',scope:'地球年龄约 45.4±0.5 亿年；铀—238 半衰期约 44.7 亿年。',checked:'2026-11-17'},
      {id:'earth-age',title:'USGS · 地球年龄',url:'https://pubs.usgs.gov/gip/geotime/age.html',scope:'用陨石、地球与月球样品的同位素证据约束地球形成时间。',checked:'2026-11-17'},
      {id:'time',title:'NPS · 地质年代表',url:'https://www.nps.gov/subjects/geology/time-scale.htm',scope:'地质时期的先后与代表事件；本页采用便于比较的约数。',checked:'2026-11-17'},
      {id:'human',title:'史密森学会 · 智人',url:'https://humanorigins.si.edu/evidence/human-fossils/species/homo-sapiens',scope:'智人的化石记录可追溯至约 30 万年前。',checked:'2026-11-17'}
    ],
    pages: [
      {id:'index',title:'地球内部',eyebrow:'从脚下的石头，走进深时间',intro:'山为什么会升高？火山从哪里来？一块石头能保存多久以前的故事？先打开地球剖面，再沿四条线索探索。',sources:['inside','seismic','mantle-solid'],question:'地幔能缓慢流动，说明它全部是液体吗？',answer:'不能。地幔大部分是固态岩石；在高温、高压和漫长时间下，固体也能缓慢变形、流动。局部地区才存在少量熔体。',cards:[
        {title:'用成分分层',body:'按主要组成，地球分为地壳、地幔和地核；地核又分液态外核与固态内核。图中四种颜色沿用这套分法。'},
        {title:'用力学性质分层',body:'岩石圈包含地壳和最上部的坚硬地幔；它下方较易变形的软流圈仍以固态为主。岩石圈、软流圈与地壳、地幔属于两套不同的分类。'},
        {title:'没有走到地心，怎样知道？',body:'地震波在内部传播时会改变速度、反射和折射。S 波不能穿过液态外核，这些记录结合高压实验、重力和陨石成分，帮助科学家建立可检验的内部模型。'}]},
      {id:'rocks',title:'岩石与矿物',eyebrow:'第一站 · 地球的材料',intro:'石英是一种矿物，花岗岩是一种岩石。看标本、读线索，再让一块岩石沿不同路径经历变化。',sources:['mineral','metamorphic','cycle','hardness'],question:'石灰岩变成大理岩，一定要先熔化吗？',answer:'不需要。变质作用发生时岩石总体保持固态，矿物重新结晶或产生新矿物；如果熔融后再冷却结晶，形成的就是火成岩。',cards:[
        {title:'矿物：有结构的天然材料',body:'矿物通常是天然形成、具有一定化学组成和晶体结构的无机固体。石英的主要成分是二氧化硅；方解石是碳酸钙。矿物名称对应组成与结构，并不只对应一种颜色。'},
        {title:'岩石：矿物等材料的集合',body:'岩石通常由一种或多种矿物组成，也可能含天然玻璃等非晶质材料。花岗岩常见石英、长石和云母；大理岩则常以方解石等碳酸盐矿物为主。'},
        {title:'怎样识别一块标本？',body:'同时观察颗粒、层理、光泽、条痕、解理和硬度。石英的莫氏硬度为 7，方解石为 3；这是相互刻划的相对顺序，不是「硬度大约是两倍」的线性刻度。照片与颜色通常不足以独立定名。'}]},
      {id:'quakes',title:'地震与火山',eyebrow:'第二站 · 释放的能量',intro:'断层突然错动，把能量传向远方；岩浆抵达地表，留下新的岩石。两者常出现在相近地区，发生机制却各有条件。',sources:['seismic','plates'],question:'为什么同一次地震，在不同城市感受到的摇晃不一样？',answer:'震级描述一次地震的规模；烈度描述某地的震动影响。距离、震源深度、传播路径、当地地层与建筑条件都能改变影响，因此一次地震可以对应多个烈度。',cards:[
        {title:'先积累，再错动',body:'断层两侧可能被摩擦暂时锁住，周围岩石持续变形、积累弹性能。突然滑动时，部分能量以地震波传播。震源在地下，震中是震源正上方的地表位置。'},
        {title:'P 波先到，S 波后到',body:'P 波是纵波，介质沿传播方向压缩与伸张；S 波是横波，介质振动方向与传播方向垂直。P 波通常更快，能穿过固体与液体；S 波不能在液体内部传播。真实地球中的波速随材料与深度变化。'},
        {title:'预警和预测不同',body:'地震预警利用已经发生的地震所发出的波，争取较强震动到达前的时间。它并非提前预测某天某地将发生地震；目前不能可靠地给出一次未来地震的精确时间、地点和震级。'},
        {title:'岩浆到了地表，叫熔岩',body:'火山喷发方式与岩浆成分、温度、黏度、气体和周围水等因素有关。同一座火山也会改变喷发方式。很多火山位于张裂带和俯冲带，一些则与板块内部的热点有关。'}]},
      {id:'plates',title:'板块构造',eyebrow:'第三站 · 缓慢移动的地表',intro:'板块并非只是一块大陆。大陆与海底可以同在一块岩石圈上，沿不同边界分开、相遇或擦肩而过。',sources:['plates','boundaries','seismic','mantle-solid'],question:'每一种板块碰撞，都会形成一串火山吗？',answer:'不会。海洋板块俯冲时，释放的水等挥发分有助于上覆地幔局部熔融，常形成火山弧；两个大陆相撞通常以地壳缩短、增厚和造山为主，并不具有同样的典型火山弧。',cards:[
        {title:'板块是一整块岩石圈',body:'板块包含地壳和最上部的坚硬地幔，并非大陆轮廓，也不是浮在全球岩浆海上的薄壳。板块大小不同，分区可随研究尺度细分，不能把一种简化地图当作唯一划分。'},
        {title:'慢到每年几厘米，也能造山',body:'许多板块的相对速度是每年几厘米，经过数千万年便能改变海陆格局。俯冲板片的重力拉力、洋脊附近的重力作用和地幔流动共同参与驱动，不是图中箭头所代表的一台单独传送带。'},
        {title:'证据需要互相支持',body:'海底岩石年龄和磁条带记录洋底扩张；地震深度与火山带勾勒边界；GNSS 卫星定位可直接测量当代运动。大陆拼合、古生物与古气候线索也是证据，但只看海岸线形状还不够。'}]},
      {id:'age',title:'地球年龄',eyebrow:'第四站 · 石头里的时钟',intro:'地球约有 45.4 亿年历史，常见估计的不确定度约为 0.5 亿年。用衰变模型读懂时间，再把漫长地史压缩成一天。',sources:['dating','earth-age','time','human'],question:'测到一块火成岩 1 亿岁，能说明地球只有 1 亿岁吗？',answer:'不能。它通常记录那块岩石结晶或同位素系统封闭的时间。地球不断生成、改造和回收岩石，推算地球形成时间还要结合古老矿物、陨石和月球样品等多种证据。',cards:[
        {title:'半衰期不是一粒原子的闹钟',body:'单个原子何时衰变具有随机性；大量原子的总体比例却遵循稳定规律。经过一个半衰期，母体平均剩下一半；再经过一个，剩下四分之一，并非每次都减少最初数量的一半。'},
        {title:'真实测年比这个模型复杂',body:'铀—238 经过一串中间衰变，最终成为稳定的铅—206。模型假设起初没有子体、系统封闭，且不丢失或增加母体与子体。实际测年须处理初始铅、封闭温度和后期扰动，常用不同同位素体系相互检查。'},
        {title:'为什么不直接给地球表面「量岁数」？',body:'熔融、变质和侵蚀会改写岩石的记录。科学家把地球、月球与陨石的同位素证据结合，约束早期太阳系与地球的形成历史。地球的形成是一个过程，45.4 亿年不是某个精确到一天的生日。'},
        {title:'碳—14 不是万能时钟',body:'碳—14 适合研究较近时期曾经参与碳循环的材料；数十亿年的岩石需要半衰期更长、适合其矿物组成的同位素体系。先问材料是什么、想测哪个事件，再选择时钟。'}]}
    ],
    layers: [
      {id:'crust',title:'地壳',top:0,bottom:35,color:'#9a7155',state:'固态',material:'以硅酸盐岩石为主',detail:'陆壳一般约 30—70 千米厚，洋壳一般约 5—10 千米厚。剖面的比例模式统一以 35 千米作大陆地壳示例；全球边界并不是一个等厚球壳。',sources:['inside']},
      {id:'mantle',title:'地幔',top:35,bottom:2890,color:'#cf7542',state:'大部分固态',material:'富含镁、铁的硅酸盐',detail:'从地壳底部到约 2890 千米深处，是最厚的一层。固态岩石在地质时间尺度上缓慢流动，局部地区可发生部分熔融。',sources:['inside']},
      {id:'outer',title:'外核',top:2890,bottom:5150,color:'#ecac43',state:'液态',material:'以铁为主的合金',detail:'深度约 2890—5150 千米。液态金属的运动与地球磁场的产生有关；S 波不能穿过液态外核，是判断其状态的重要证据。',sources:['inside','seismic']},
      {id:'inner',title:'内核',top:5150,bottom:6371,color:'#ffe3a0',state:'固态',material:'以铁为主的合金',detail:'从约 5150 千米深处到地心。内核很热，却因为压力极高而保持固态，不能用「越热就一定越液态」简单判断。',sources:['inside']}
    ],
    specimens: [
      {id:'quartz',title:'石英',kind:'矿物',media:'quartz',detail:'主要成分为二氧化硅，常见于多种岩石。透明、乳白和紫色等外观都可能出现在石英中。',observe:'看晶体的几何外形与玻璃光泽；完整晶体与岩石中的不规则颗粒外观不同。',sources:['mineral']},
      {id:'basalt',title:'玄武岩',kind:'火成岩',media:'basalt',detail:'玄武质岩浆到地表或近地表较快冷却形成，矿物颗粒通常较细；有些标本带气孔。',observe:'看细小颗粒。冷却速度、气体与结晶条件都会影响外观，不是所有玄武岩都有孔洞。',sources:['cycle']},
      {id:'sandstone',title:'砂岩',kind:'沉积岩',media:'sandstone',detail:'砂粒沉积后，经历压实和胶结成为岩石；颗粒大小、形状与层理保留了环境线索。',observe:'这张是砂岩的野外露头照片，可以找层理与整体形态；远景不能代替对砂粒和胶结物的近距离观察。',sources:['cycle']},
      {id:'marble',title:'大理岩',kind:'变质岩',media:'marble',detail:'石灰岩或白云岩在变质条件下重新结晶形成，常有相互镶嵌的碳酸盐矿物颗粒。',observe:'观察结晶颗粒。建筑装饰中「大理石」的商业名称范围可能更宽，不能直接当作地质分类。',sources:['metamorphic']}
    ],
    rockStates:[{id:'magma',title:'岩浆',detail:'地下的熔融物质，常含晶体与气体。'},{id:'igneous',title:'火成岩',detail:'岩浆或熔岩冷却、结晶形成。'},{id:'sediment',title:'沉积物',detail:'风化与侵蚀形成的颗粒，被搬运后沉积。'},{id:'sedimentary',title:'沉积岩',detail:'沉积物经过压实、胶结等成岩过程形成。'},{id:'metamorphic',title:'变质岩',detail:'已有岩石在总体保持固态时发生矿物与结构的改变。'}],
    rockPaths:[
      {from:'magma',to:'igneous',process:'冷却结晶',detail:'冷却较慢通常给晶体更长的生长时间；冷却极快也可能形成天然玻璃。'},
      {from:'igneous',to:'sediment',process:'风化 → 侵蚀搬运 → 沉积',detail:'岩石在地表破碎或发生化学变化，颗粒被水、风或冰等搬运并沉积。'},
      {from:'sedimentary',to:'sediment',process:'再度风化与侵蚀',detail:'沉积岩也可以被剥蚀，重新加入沉积物的旅程。'},
      {from:'metamorphic',to:'sediment',process:'抬升出露、风化与侵蚀',detail:'深处形成的岩石可以抬升出露，再变成颗粒。'},
      {from:'sediment',to:'sedimentary',process:'压实与胶结',detail:'颗粒逐渐紧密，孔隙中的胶结物把颗粒结合起来。'},
      {from:'igneous',to:'metamorphic',process:'升温、加压与流体作用',detail:'总体不熔融，矿物重新组合或结构改变。'},
      {from:'sedimentary',to:'metamorphic',process:'变质作用',detail:'例如石灰岩重新结晶成为大理岩；并不要求先熔化。'},
      {from:'igneous',to:'magma',process:'熔融',detail:'满足温度、压力与挥发分等条件时，岩石可以部分或全部熔融。'},
      {from:'sedimentary',to:'magma',process:'熔融',detail:'熔融改变了路径；此后冷却形成的是火成岩。'},
      {from:'metamorphic',to:'magma',process:'继续升温等条件促成熔融',detail:'变质与熔融是不同过程，跨过熔融条件后才进入岩浆路径。'}
    ],
    volcanoes:[
      {media:'lava',title:'基拉韦厄 · 熔岩流',detail:'2018 年夏威夷裂隙喷发中的熔岩通道。玄武质熔岩常较易流动，但这不代表所有喷发都平静，也不代表这座火山只会溢流。'},
      {media:'eruption',title:'圣海伦斯 · 爆炸式喷发',detail:'1980 年 5 月 18 日喷发，火山口边缘可见火山碎屑密度流。喷发柱包含气体、火山灰与碎屑，不能把整根喷发柱理解成液态熔岩。'}
    ],
    boundaries:[
      {id:'divergent',title:'张裂边界',motion:'← 分开 →',example:'大西洋中脊',result:'形成新洋壳',detail:'两侧板块分离，地幔物质上升、减压并部分熔融，岩浆冷却形成新的洋壳。图示放大了裂口与位移。',sources:['plates','boundaries']},
      {id:'subduction',title:'俯冲边界',motion:'→ 相遇 ↙',example:'安第斯山脉一带',result:'海沟与火山弧',detail:'海洋岩石圈向下俯冲。它释放的水等挥发分有助于上覆地幔部分熔融，岩浆上升可形成火山弧；并非整块板片一入地就全部熔化。',sources:['plates','boundaries']},
      {id:'collision',title:'大陆碰撞',motion:'→ 挤压 ←',example:'喜马拉雅山脉',result:'地壳缩短、增厚',detail:'两个大陆相遇，地壳强烈变形、增厚并隆起，形成高大山系。造山伴随侵蚀与复杂深部过程，示意图只表现挤压方向。',sources:['plates','boundaries']},
      {id:'transform',title:'转换边界',motion:'↑ 擦过 ↓',example:'圣安德烈斯断层',result:'水平错动',detail:'两侧板块沿边界水平滑动，边界本身通常不制造或消耗岩石圈。这里使用俯视图，其余三幅为剖面图。',sources:['plates','boundaries']}
    ],
    events:[
      {id:'formation',title:'地球形成',ma:4540,detail:'约 45.4 亿年前。尘埃与星子逐步聚集，碰撞、加热和分异塑造早期地球。',sources:['earth-age','dating']},
      {id:'proterozoic',title:'元古宙开始',ma:2500,detail:'约 25 亿年前。这是地质年代表的分界，不是所有环境与生命在一瞬间一起改变。',sources:['time']},
      {id:'cambrian',title:'寒武纪开始前后',ma:540,detail:'约 5.4 亿年前。许多动物类群在化石记录中变得丰富；生命并非到此时才出现。这里使用教学约数。',sources:['time']},
      {id:'mesozoic',title:'中生代开始',ma:252,detail:'约 2.52 亿年前。此后恐龙等类群逐渐兴起；并不是所有爬行动物都属于恐龙。',sources:['time']},
      {id:'extinction',title:'白垩纪末大灭绝',ma:66,detail:'约 6600 万年前。非鸟恐龙灭绝，鸟类作为恐龙的一支延续到今天。',sources:['time']},
      {id:'sapiens',title:'早期智人',ma:0.3,detail:'约 30 万年前。在这一天的尺度上，距离午夜只剩约 5.7 秒；这是物种历史的约数，并非单一祖先的精确生日。',sources:['human']},
      {id:'present',title:'今天',ma:0,detail:'从人类记录的短暂片段，回望岩石保存的漫长历史。一天仅是等比例换算的比喻。',sources:['dating']}
    ],
    media: [
  {
    "id": "quartz",
    "src": "assets/quartz.jpg",
    "url": "https://www.usgs.gov/media/images/quartz-crystal-3",
    "download": "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/media/images/quartz_3_0.jpg",
    "alt": "石英矿物标本，可见晶体与浅色光泽",
    "credit": "USGS / Office of Communications",
    "license": "Public Domain",
    "checked": "2026-11-17",
    "sha256": "00c45c8c44a8bdde7ca4a90096ea3469839318ca32e305b5515a0007c053f20c"
  },
  {
    "id": "basalt",
    "src": "assets/basalt.jpg",
    "url": "https://commons.wikimedia.org/wiki/File:BasaltUSGOV.jpg",
    "download": "https://upload.wikimedia.org/wikipedia/commons/0/08/BasaltUSGOV.jpg",
    "alt": "玄武岩手标本，表面呈细粒深灰色",
    "credit": "USGS / Minerals in Your World",
    "license": "Public Domain",
    "checked": "2026-11-17",
    "sha256": "5a3faf3db417aa7c62ac1a6105a2e6eea8a8925f2bb1b6d1bb3b3c14a0058139"
  },
  {
    "id": "sandstone",
    "src": "assets/sandstone.jpg",
    "url": "https://www.usgs.gov/media/images/white-sandstone",
    "download": "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/dce00125-1-.jpg",
    "alt": "美国北达科他州Fox Hills砂岩的野外露头",
    "credit": "USGS Personnel / Dakota Water Science Center",
    "license": "Public Domain",
    "checked": "2026-11-17",
    "sha256": "019e634f11461971408809f2b66e75ca67222fc17a4dc226a5266aedebe208a3"
  },
  {
    "id": "marble",
    "src": "assets/marble.jpg",
    "url": "https://commons.wikimedia.org/wiki/File:MarbleUSGOV.jpg",
    "download": "https://upload.wikimedia.org/wikipedia/commons/8/8d/MarbleUSGOV.jpg",
    "alt": "大理岩手标本，可观察重新结晶的外观",
    "credit": "USGS / Minerals in Your World",
    "license": "Public Domain",
    "checked": "2026-11-17",
    "sha256": "a18b86fe19c44f4e372ab01ce35cf0989c6e595228d42f3229867208664707ae"
  },
  {
    "id": "lava",
    "src": "assets/lava.jpg",
    "url": "https://www.usgs.gov/media/images/kilauea-volcano-1",
    "download": "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/multimediaFile-2145.jpg",
    "alt": "2018年基拉韦厄裂隙8喷发中的熔岩通道航拍",
    "credit": "USGS / Hawaiian Volcano Observatory",
    "license": "Public Domain",
    "checked": "2026-11-17",
    "sha256": "b75aadb6c65976fb8717630fbcbf562d4bbc3f78f613f5d20f3d6c52e25343f7"
  },
  {
    "id": "eruption",
    "src": "assets/eruption.jpg",
    "url": "https://www.usgs.gov/media/images/may-18-1980-eruption-mount-st-helens",
    "download": "https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/vhp_img5461.jpg",
    "alt": "1980年5月18日圣海伦斯火山喷发实景",
    "credit": "J. G. Rosenbaum / USGS",
    "license": "Public Domain",
    "checked": "2026-11-17",
    "sha256": "123fcef586f5299421e4884a1cae6596e15999f3b73268bb137700ff4959ba38"
  }
]
  };
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.EARTH_INTERIOR = data;
})(typeof window === 'undefined' ? globalThis : window);
