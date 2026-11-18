/* 海洋世界的专题正文与教学模型数据。坐标按经度、纬度排列，深度以米计。 */
(function () {
  'use strict';

  const sources = [
    {id:'current',title:'NOAA · 洋流的驱动',url:'https://oceanservice.noaa.gov/facts/current.html',note:'风、密度差与潮汐影响海水运动。'},
    {id:'gyres',title:'NOAA · 大洋环流与边界流',url:'https://oceanservice.noaa.gov/education/tutorial_currents/04currents3.html',note:'表层环流、科里奥利效应和湾流。'},
    {id:'pacific',title:'NOAA · 北太平洋代表洋流',url:'https://uat.oceanservice.noaa.gov/education/tutorial-coastal/marine-debris/md05.html',note:'黑潮与加利福尼亚寒流的示意方向。'},
    {id:'enso',title:'NOAA · 东太平洋上升流与 ENSO',url:'https://www.noaa.gov/jetstream/tropical/enso/enso-patterns',note:'南美西岸上升流与暖水变化。'},
    {id:'acc',title:'NOAA AOML · 南极绕极流',url:'https://www.aoml.noaa.gov/phod/altimetry/cvar/acc/',note:'南大洋环绕南极的向东流动。'},
    {id:'overturn',title:'NOAA · 全球海洋翻转环流',url:'https://oceanservice.noaa.gov/facts/conveyor.html',note:'温度和盐度影响密度，风和混合参与全球环流。'},
    {id:'tidal-day',title:'NOAA · 太阴日和潮汐频率',url:'https://oceanservice.noaa.gov/education/tutorial_tides/tides05_lunarday.html',note:'太阴日约 24 小时 50 分和半日潮的理想周期。'},
    {id:'spring',title:'NOAA · 大潮和小潮',url:'https://oceanservice.noaa.gov/facts/springtide.html',note:'朔望与上下弦时日月位置对潮差的影响。'},
    {id:'light',title:'NOAA · 海水中的光',url:'https://oceanexplorer.noaa.gov/ocean-fact/light-distributed/',note:'透光带、暮光带与无光水层的典型深度。'},
    {id:'pressure',title:'NOAA · 水深与压力',url:'https://oceanservice.noaa.gov/facts/pressure.html',note:'海水深度每增加约 10 米，压力增加约 1 个大气压。'},
    {id:'wildlife',title:'NOAA Fisheries · 海洋生物实拍',url:'https://www.fisheries.noaa.gov/feature-story/11-marvelous-marine-life-photos',note:'近岸绿海龟和暮光带草莓鱿的观察记录。'},
    {id:'eyes',title:'WHOI · 草莓鱿',url:'https://twilightzone.whoi.edu/explore-the-otz/creature-features/strawberry-squid/',note:'两只大小不同的眼睛与垂直活动范围。'},
    {id:'abyss',title:'NOAA · 深海平原',url:'https://oceanexplorer.noaa.gov/ocean-fact/what-are-abyssal-plains/',note:'深海平原的地貌和海参实拍。'},
    {id:'hadal',title:'NOAA · 超深渊带',url:'https://oceanexplorer.noaa.gov/expedition-feature/okeanos-ex2102-features-hadalzone/',note:'海沟的典型深度范围，以及适应高压的生物。'},
    {id:'vent',title:'NOAA · 热液喷口与冷泉',url:'https://oceanexplorer.noaa.gov/ocean-fact/seeps-vents/',note:'喷口生态系统与化能合成。'},
    {id:'worm',title:'NOAA · 冯达姆热液区管虫',url:'https://oceanexplorer.noaa.gov/multimedia/daily-image-media-20210614/',note:'2011 年中开曼海隆考察实拍。'},
    {id:'margin',title:'NOAA · 大陆边缘与深海地貌',url:'https://osrefresh.oceanexplorer.noaa.gov/edu/curriculum/section4a.pdf',note:'大陆架、大陆坡及深海地形的教学资料。'},
    {id:'ridge',title:'NOAA · 洋中脊',url:'https://oceanexplorer.noaa.gov/ocean-fact/mid-ocean-ridge/',note:'全球洋中脊分布与洋底扩张。'},
    {id:'sonar',title:'NOAA · 测绘海底',url:'https://oceanexplorer.noaa.gov/explainers/mapping/',note:'多波束声呐与挑战者深渊的量测。'},
    {id:'land',title:'Natural Earth · 世界地图底图',url:'https://www.naturalearthdata.com/about/terms-of-use/',note:'复用地理图谱的本地简化大陆轮廓。'}
  ];

  const media = [
    {id:'turtle',file:'assets/turtle.jpg',alt:'浅海中的绿海龟和围绕它的小鱼',credit:'Matt McIntosh / NOAA',source:'wildlife',original:'https://www.fisheries.noaa.gov/s3/styles/original/s3/2022-03/green-sea-turtle-noaa.jpg?itok=GW9d141F',sha256:'41fd75d071f537eb4f21c502934a0a1b6699ab0614508aabd40aca68252cc050'},
    {id:'squid',file:'assets/squid.jpg',alt:'深色背景中的草莓鱿，身上分布点状发光器',credit:'NOAA Fisheries',source:'wildlife',original:'https://www.fisheries.noaa.gov/s3/styles/media_750_x500/s3/dam-migration/strawberry-squid-deep-see.jpg?itok=tiYY1LWL',sha256:'78991ff31279e603d9dfbbcba2a7defb9856bce0bf81a5bf4733e82b9263e9b5'},
    {id:'cucumber',file:'assets/cucumber.jpg',alt:'库克群岛深海平原上正在取食的海参',credit:'NOAA Ocean Exploration · 2026 Cook Islands ROV Exploration',source:'abyss',original:'https://oceanexplorer.noaa.gov/wp-content/uploads/2026/07/ex2605-dive09-seacucumber.jpg',sha256:'43a24d0ae24edd635e088df6931490f48f42ad8c54bbd900c13d641b79161af8'},
    {id:'tubeworm',file:'assets/tubeworm.jpg',alt:'遥控潜水器拍到的热液区管虫',credit:'NOAA Ocean Exploration · MCR Expedition 2011',source:'worm',original:'https://oceanexplorer.noaa.gov/wp-content/uploads/2021/06/20210614-hires.jpg',sha256:'f76d8f16e321d8a67ca06b918e56849cd99d0ee6ba6563fc0492c0f030e19db7'},
    {id:'ridge',file:'assets/ridge.jpg',alt:'全球海底地形图用红色标出新洋壳形成的洋中脊系统',credit:'Elliot Lim / CIRES / NOAA NCEI',source:'ridge',original:'https://oceanexplorer.noaa.gov/wp-content/uploads/2014/07/mid-ocean-ridge-800.jpg',sha256:'31dd12f6bfd18ed8d27679765b4b78d9273578deb3f3070e18b228dc03124ece'}
  ];

  const pages = [
    {
      id:'index',title:'海洋世界',intro:'从世界地图出发，追一股洋流、看一轮潮涨潮落，再潜入不同深度，寻找海底的山脉和峡谷。',
      cards:[
        {title:'一片连通的海洋',text:'地图上标出的五个大洋是便于定位的分区。水与热量会跨越分区输运，南大洋把太平洋、大西洋和印度洋连在一起。跨越 180° 经线时，地图的左右两边在地球上相接。'},
        {title:'海水怎样动？',text:'风浪是在表面传播的短周期波动，潮汐是更长周期的海面升降，洋流则描述海水的输运。三者可以同时发生，沿岸涨落还可带来往复的潮流。'}
      ],
      question:'海底是不是一片平坦的地面？',answer:'海底也有高低起伏。大陆边缘的缓坡通向深海，洋中脊可抬高几千米，俯冲带还能形成狭长的海沟。',
      sources:['land','current','ridge','sonar']
    },
    {
      id:'currents',title:'洋流',intro:'点选代表洋流，沿箭头追踪海水的大致去向。比较同一海盆两岸，你会看到不一样的暖流和寒流。',
      cards:[
        {title:'表层环流怎样形成？',text:'盛行风长期推着海面，地球自转造成的科里奥利效应、海水压力梯度以及大陆边界共同影响流向。北半球副热带环流通常顺时针，南半球通常逆时针；并非每股洋流都沿同一个方向转。'},
        {title:'寒暖是相对的',text:'暖流通常把相对温暖的水送到更冷的地区；寒流通常将相对较冷的水带到较暖的地区。南美西岸的沿岸风还可促成上升流，把较冷、富营养的深层水带到近表层。'},
        {title:'深层也在移动',text:'在其他条件接近时，降温或增盐通常让海水更密。某些海域的致密水会下沉，深水再经混合与上涌返回浅层。全球翻转环流有多条路径和多个时间尺度，并非一条速度均一的输送带。'}
      ],
      question:'为什么漂流物跨过地图右边还能接着走？',answer:'平面地图在 180° 经线展开，左右两边在球面上相接。看南极绕极流时，可以沿最右侧的箭头接到最左侧。',
      sources:['current','gyres','pacific','enso','acc','overturn','land']
    },
    {
      id:'tides',title:'潮汐',intro:'新月、满月和上下弦时，太阳与月球的相对位置有何不同？切换月相，再沿曲线读一个太阴日的海面高度。',
      cards:[
        {title:'日月引潮力怎样叠加？',text:'关键是日月的引力在地球各处略有不同。新月与满月时，两者的引潮作用沿近似同一条轴叠加，平均潮差较大；上下弦时两条轴近似垂直，潮差通常较小。'},
        {title:'同一个月相，不同海岸',text:'海盆形状、水深、岸线、共振与海底摩擦会改变潮位和时刻，有的地方一天主要一次高潮，有的两次且高低不同。真实大潮的日期也可能相对于朔望滞后。'},
        {title:'月亮每天晚一点回到同一方向',text:'地球自转时，月球也在沿公转轨道前进。地球要多转一点，平均约 24 小时 50 分才让同一地点回到近似相同的月球方向。理想半日潮的相邻高潮约隔 12 小时 25 分。'}
      ],
      question:'大潮表示一天出现更多次高潮吗？',answer:'大潮说的是高潮与低潮的高度差较大。模型里的大潮和小潮都有同一个半日周期，只改变振幅。',
      sources:['tidal-day','spring']
    },
    {
      id:'life',title:'海洋生物',intro:'把观察舱从海面往下移。比较光线、压力与食物来源，再看这些条件怎样影响生物的生活方式。',
      cards:[
        {title:'海洋食物网的起点',text:'多数海洋食物网依靠日光驱动的光合作用。浮游植物、藻类和海草把光能转成有机物；部分有机颗粒沉下去，形成像雪花一样的海洋雪，给深海生物供食。'},
        {title:'变暗之后怎样看？',text:'暮光带的光线很弱。草莓鱿的大眼向上看剪影，小眼向下找生物发光。不同生物能发光的用途各异，可能引诱猎物、迷惑捕食者或帮助交流。'},
        {title:'无光不等于没有生态系统',text:'大部分深海生态依靠从上层落下或由水流送来的有机物。热液喷口附近，一些微生物还能用无机物发生氧化等化学反应所释放的能量合成有机物。'}
      ],
      question:'管虫周围没有阳光，食物从哪里来？',answer:'某些热液管虫体内有共生微生物。它们利用喷口流体和海水混合所提供的化学条件制造有机物，部分营养由管虫获得。',
      sources:['light','pressure','wildlife','eyes','abyss','hadal','vent','worm']
    },
    {
      id:'seafloor',title:'海底地形',intro:'沿剖面移动测深点，从大陆架滑向深海平原。比较张裂形成的洋中脊与俯冲形成的海沟。',
      cards:[
        {title:'大陆架和大陆坡怎么分？',text:'大陆架是大陆在海面以下较平缓的边缘，外缘常在约一两百米水深。再往外，相对陡峭的大陆坡通向更深的海底。各地的宽度、深度和坡度差异很大。'},
        {title:'洋中脊是高处，海沟是低处',text:'新洋壳在张裂边界形成，洋中脊相对周围海底隆起。俯冲带中下沉板块在边缘弯曲，可形成海沟。马里亚纳海沟的挑战者深渊接近 11 千米深，具体读数随量测位置和方法而异。'},
        {title:'不下水也能画海底地图',text:'船上的多波束声呐发出声波，再记录各个方向的海底回波。垂直测距可近似用声速乘往返时间再除以二。精确测绘还要修正海水声速、波束角度和船体姿态。'}
      ],
      question:'回声经过 4 秒才回来，水深就是 6000 米吗？',answer:'若取声速 1500 米／秒且声波竖直往返，6000 米是来回总路程，近似水深是 3000 米。',
      sources:['margin','abyss','ridge','sonar']
    }
  ];

  // 路径是手绘教学代表线。南极绕极流用连续经度跨过 180°，渲染时在图边裁切。
  const currents = [
    {id:'gulf',kind:'warm',title:'湾流',direction:'北大西洋西侧 → 东北',text:'温暖水从佛罗里达海峡出发，沿北美东岸向北，再离岸向东北输送热量。向欧洲一带延伸的部分属于北大西洋暖流系统。',points:[[-79.6,25],[-79,28],[-76,33],[-72,37],[-65,39],[-56,41],[-49,43]]},
    {id:'kuroshio',kind:'warm',title:'黑潮',direction:'台湾岛东侧 → 日本南侧 → 向东',text:'黑潮把西北太平洋低纬度的暖水向北输送，沿台湾岛东侧和琉球群岛一带流向日本南侧，出海后接黑潮延伸体。',points:[[125,17],[123.3,22],[123,25.5],[126,28],[131,31],[137,32],[145,34],[155,35]]},
    {id:'california',kind:'cold',title:'加利福尼亚寒流',direction:'北美西岸外海 → 南',text:'位于北太平洋东侧，沿北美西岸外海总体向南，输送相对凉的水。它与西侧向北的黑潮形成对照。',points:[[-132,49],[-130,44],[-128,39],[-125,34],[-120,29],[-117,24]]},
    {id:'peru',kind:'cold',title:'秘鲁寒流',direction:'南美西岸外海 → 北',text:'又叫洪堡寒流。海水沿智利和秘鲁外海流向低纬度；沿岸上升流补充营养盐，支持丰富的浮游生物和鱼类。厄尔尼诺期间上升流的冷却和供养作用可减弱。',points:[[-77,-43],[-75,-33],[-74,-24],[-76,-17],[-80,-12],[-84,-6],[-88,-3]]},
    {id:'antarctic',kind:'circumpolar',title:'南极绕极流',direction:'绕南极由西向东',text:'南大洋的西风和海洋压力场共同影响这股环流。它穿过德雷克海峡，绕过南极洲，连接太平洋、大西洋和印度洋。图上跨越换日线时可接到另一边。',points:[[-110,-57],[-85,-58],[-64,-59],[-42,-54],[-20,-51],[5,-50],[35,-49],[60,-51],[85,-53],[110,-55],[138,-57],[160,-56],[180,-56],[204,-57],[226,-58],[250,-57]]}
  ];

  const phases = [
    {id:'new',title:'新月',angle:0,text:'月球在地球与太阳之间附近，日月的引潮轴接近重合，潮差偏大。'},
    {id:'first',title:'上弦月',angle:90,text:'从地球看，日月方向约成直角，两者对潮差的影响部分抵消。'},
    {id:'full',title:'满月',angle:180,text:'地球位于日月之间附近。尽管日月方向相反，引潮轴仍接近重合，潮差偏大。'},
    {id:'last',title:'下弦月',angle:270,text:'日月方向再次约成直角，潮差偏小。'}
  ];

  const layers = [
    {id:'sunlit',title:'透光带',from:0,example:30,light:'日光充足的上层',photo:'turtle',text:'上层水体可支持光合作用。照片里的绿海龟在浅海珊瑚礁的「清洁站」，附近的小鱼会取食它身上的藻类和小生物。'},
    {id:'twilight',title:'暮光带',from:200,example:600,light:'微弱日光',photo:'squid',text:'日光已难以支持光合作用。草莓鱿可在这一带活动，有些生物夜晚上浮取食，白天回到较深的水层。'},
    {id:'dark',title:'深海无光层',from:1000,example:4800,light:'基本没有来自海面的日光',photo:'cucumber',text:'许多动物依靠由浅处沉降的有机物。照片中的海参在深海平原取食，能从沉积物中取得营养。'},
    {id:'hadal',title:'超深渊带',from:6000,example:8500,light:'没有来自海面的日光',text:'海沟中可见适应高压的端足类等动物。某些海沟还发现了深渊狮子鱼。不同物种的深度范围不同，连同一海沟的底部和坡面也并不一样。'}
  ];

  const profiles = [
    {
      id:'ridge',title:'从大陆边缘到洋中脊',points:[[0,0],[130,50],[330,180],[530,850],[920,3000],[1350,4260],[2550,4350],[3050,4020],[3450,3120],[3710,2350],[3840,2670],[3970,2390],[4350,3260],[4790,4100],[5350,4390],[6000,4500]],
      stops:[
        {id:'shelf',title:'大陆架',km:235,text:'近岸、浅而缓，是大陆的水下延伸。'},
        {id:'slope',title:'大陆坡',km:720,text:'从大陆架外缘向深海较陡地下降。'},
        {id:'plain',title:'深海平原',km:1920,text:'深海盆底较平坦的部分，沉积物常覆盖小起伏。'},
        {id:'ridge',title:'洋中脊',km:3710,text:'洋底扩张形成延伸很长的山系，脊顶仍在水下。'}
      ]
    },
    {
      id:'trench',title:'从深海盆地到海沟',points:[[0,4500],[600,4800],[1500,5040],[2250,5150],[2530,4830],[2810,5650],[2940,7930],[3050,10900],[3120,8890],[3280,6310],[3500,3890],[3820,1410],[4050,260],[4300,1220],[4700,2150],[5100,2700]],
      stops:[
        {id:'basin',title:'深海盆地',km:1500,text:'较老的海洋岩石圈随着冷却和沉降变深，这里是俯冲前的深海盆地示意。'},
        {id:'trench',title:'海沟',km:3050,text:'板片在向下俯冲前弯曲，海底形成狭长深槽。此处 10 900 米为教学取值。'},
        {id:'arc',title:'火山岛弧一侧',km:4050,text:'在部分俯冲带的上盘，岩浆活动形成一串火山，是否露出海面取决于火山高度与水深。'}
      ]
    }
  ];

  const data = {
    pages, sources, media, currents, phases, layers, profiles,
    vent:{title:'热液喷口 · 海底的化学能',photo:'tubeworm',text:'海水沿裂隙下渗、受热并和岩石发生反应，富含化学物质的热液从海底冒出。与海水混合处，一些微生物从化学反应获取能量，支撑管虫等生物所在的局部生态系统。'}
  };
  if (typeof module === 'object' && module.exports) module.exports = data;
  else window.OceanData = data;
})();
