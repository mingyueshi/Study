/* 正文、天气案例、学习路线与出处。观测站的数值独立保存。 */
(function () {
  'use strict';
  const sources = [
    {id:'weather-climate',title:'NOAA · 天气和气候的区别',url:'https://www.ncei.noaa.gov/news/weather-vs-climate',note:'气候来自一段时期的观测，既可描述平均状况，也可比较变化和极端。'},
    {id:'normals',title:'日本气象厅 · 气候常年值说明',url:'https://www.data.jma.go.jp/tcc/tcc/products/climate/explanation/normal.html',note:'月均温和月降水常年值的统计期为 1991–2020 年。'},
    {id:'climatview',title:'日本气象厅 · ClimatView',url:'https://www.data.jma.go.jp/tcc/tcc/products/climate/climatview/outline.html',note:'逐站常年值来自该平台，每张气候图附本站来源。'},
    {id:'dewpoint',title:'美国国家气象局 · 露点与湿度',url:'https://www.weather.gov/lmk/humidity',note:'露点、饱和、凝结以及降水形成的条件。'},
    {id:'weather',title:'美国国家气象局 · 气象教育',url:'https://www.weather.gov/jkl/education',note:'云、雾、露、霜和降水的入门资料。'},
    {id:'hail',title:'美国国家气象局 · 冰雹术语',url:'https://forecast.weather.gov/glossary.php?word=HAIL',note:'冰雹与积雨云。'},
    {id:'storm',title:'NOAA GML · 积雨云实拍',url:'https://gml.noaa.gov/aero/about/sheridan/Weather.html',note:'1996 年 STERAO-A 项目观察的大型雷暴云砧。'},
    {id:'fog',title:'NASA · 旧金山的海雾',url:'https://science.nasa.gov/earth/earth-observatory/another-foggy-day-in-san-francisco-79119/',note:'2012 年 8 月 16 日 EO-1 卫星所见的沿岸雾。'},
    {id:'dust',title:'NASA · 内蒙古雪地与东传沙尘',url:'https://science.nasa.gov/earth/earth-observatory/snow-and-dust-over-inner-mongolia-1082/',note:'2001 年 1 月 2 日 SeaWiFS 对积雪、云和沙尘的观测。'},
    {id:'rainbow',title:'NOAA NESDIS · 彩虹怎样形成',url:'https://www.nesdis.noaa.gov/about/k-12-education/optical-phenomena/what-causes-rainbow',note:'光经水滴折射、反射和色散，条件合适时可见环状彩虹。'},
    {id:'types',title:'NOAA NESDIS · 世界气候类型',url:'https://www.nesdis.noaa.gov/about/k-12-education/understanding-our-planet/what-are-the-different-climate-types',note:'柯本气候分类和五个大类的入门。'},
    {id:'china',title:'中国政府网资料 · 中国气候',url:'https://www.locpg.gov.cn/zggq/2014-01/04/c_125956314.htm',note:'常见气候类型、温度带、干湿区和季风的组织口径。'},
    {id:'qinling',title:'中国气象局 · 秦岭生态气象',url:'https://www.cma.gov.cn/zfxxgk/gknr/jytabl/202108/P020210824377865879053.pdf',note:'秦岭的南北气候过渡作用。'},
    {id:'beck',title:'Beck 等（2023）· 柯本–盖格气候分类',url:'https://doi.org/10.1038/s41597-023-02549-6',note:'使用其 1991–2020 年历史分类，CC BY 4.0。专题图为中国范围的 0.25° 格心采样。'},
    {id:'geotiff',title:'斯坦福 Natural Capital Project · 分类栅格',url:'https://data.naturalcapitalalliance.stanford.edu/dataset/sts-b04939b0df93eb3f4305a065933c66122a0edc6fa425b157b99aa7b4b4446d20',note:'专题生成脚本读取的 Beck 分类图 GeoTIFF。'}
  ];

  const photos = [
    {id:'anvil',file:'assets/anvil.jpg',alt:'积雨云的顶部横向展开，形成砧形云顶。',credit:'NOAA GML · STERAO-A',source:'storm',original:'https://gml.noaa.gov/aero/about/sheridan/anvil.jpg',sha256:'d5f64d99ef234b142cbb343b3898427b274ef0edfc7275631ebc08ad05103b1d'},
    {id:'fog',file:'assets/fog.jpg',alt:'卫星看到旧金山近岸的白色海雾从海面接近陆地。',credit:'NASA Earth Observatory · Jesse Allen、Robert Simmon',source:'fog',original:'https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/79000/79119/sanfrancisco_ali_2012229_lrg.jpg?fit=clip&w=960',sha256:'fcd89d70146b52af5dc3b3ea7bfee9dd75f899c097a9774b8ba41a76e2068dc2'},
    {id:'dust',file:'assets/dust.jpg',alt:'SeaWiFS 卫星图中，黄褐色沙尘由中国东部向黄海和东海扩散，北侧可见雪地。',credit:'SeaWiFS Project · NASA Goddard · ORBIMAGE',source:'dust',original:'https://assets.science.nasa.gov/dynamicimage/assets/science/esd/eo/images/imagerecords/1000/1082/seawifs_china_snow_lrg.jpg?fit=clip&w=960',sha256:'2c71d8ffc46fb5b3e29e5256369890b6b3c1acdf1e1fb30d9abd480741d9ffd6'},
    {id:'rainbow',file:'assets/rainbow.webp',alt:'飞机上看到的环状彩虹，外侧呈红色，内侧偏蓝紫。',credit:'NOAA NESDIS',source:'rainbow',original:'https://www.nesdis.noaa.gov/s3/styles/webp/s3/2025-09/Circular-rainbow-plane-16x9.png.webp?itok=98EvYr-e',sha256:'663cc879719253dfb82b03d82cf0d7ec5fa3dfc95764e6cf6e687abc2a7d5234'}
  ];

  const pages = [
    {id:'index',title:'气象与气候',intro:'从今天的一场雨出发，分辨眼前的天气与多年形成的气候，再去地图上找南北、沿海和高原的差别。',
      cards:[
        {title:'天气说的是眼前的变化',text:'今天几度、下午有没有雷雨、夜里会不会起雾，都在描述某时某地的大气状态。天气预报关注未来几小时到几天的变化。'},
        {title:'气候说的是长期的规律',text:'一个地方常在哪几个月多雨，夏天和冬天通常差几度，极端天气有多常见，要用多年的观测回答。气候常年值通常采用 30 年作为一个参考时段。'},
        {title:'一个格点与一座城市',text:'站点记录来自特定位置和海拔，地图格网表示附近一片区域的分类。城市里的观测场、周围山地和沿海的天气与气候都可能有差别。'}],
      question:'冬天突然有一天很暖，可以由此判断当地是热带吗？',answer:'不能。判断气候需要看多年的气温和降水规律。单日偏暖可以与当地同一时节的常年值比较。',
      sources:['weather-climate','normals','beck']},
    {id:'weather',title:'天气现象',intro:'云、露、雪和彩虹各是怎样出现的？先看实景，再试着把空气降温到露点附近。',
      cards:[
        {title:'云和雾都能由水滴组成',text:'云和雾常由悬浮的小水滴组成，有时还含冰晶。贴近地面的雾让能见度降低。露和霜形成在物体表面。水蒸气本身是看不见的。'},
        {title:'为什么有的云不下雨？',text:'组成云的小水滴或冰晶太小，会随空气一起运动。形成能落到地面的降水，需要它们长大。下降途中空气的温度和湿度还会影响它们是否融化或蒸发。'},
        {title:'天气观测各有分工',text:'地面站测气温、湿度、降水和风。雷达用回波观察降水的分布与移动，卫星从上方观察云系和沙尘等现象。不同仪器提供的线索可以互相印证。'}],
      question:'空气降到露点，就一定会下雨吗？',answer:'到达露点表示空气接近饱和。它可能在适当条件下出现云、雾或露，形成雨还需要水滴或冰晶长大并落到地面。',
      sources:['dewpoint','weather','hail','storm','fog','dust','rainbow']},
    {id:'types',title:'气候类型',intro:'用同一套坐标比较 11 个站点。先找冷暖变化，再找雨量集中在哪几个月，最后结合位置判断气候特征。',
      cards:[
        {title:'先读气温曲线',text:'找最高和最低的月均温。两者相差多少，叫月均气温年较差。对照月份还可以看季节，南半球许多地方的暖季在年初，不能一律用 7 月代表夏季。'},
        {title:'再读降水柱',text:'柱子越高，当月的常年降水量越多。北半球站点可比较 4—9 月与 10—3 月的雨量。降雪按融化后的水量计入降水。'},
        {title:'分类标准会影响名称',text:'柯本–盖格用长期的温度、降水与降水季节分配来划分气候，有热带、干旱、温和、冷冬型与极地型五个大类。本页的站点标签是便于比较的教学名称，中国季风类型也结合了所在区域的环流特征。'}],
      question:'图上曲线和柱子碰到一起，能说明气温等于降水吗？',answer:'不能。曲线读左侧温度轴（℃），柱子读右侧降水量轴（毫米）。两种量的单位和尺度不同。',
      sources:['normals','climatview','types','china']},
    {id:'china',title:'中国气候分区',intro:'在地图上看五个气候大类的空间分布，再点代表站认识我国常见的季风、大陆性和高原山地气候。',
      cards:[
        {title:'从东南沿海到西北内陆',text:'我国年降水量总体从东南沿海向西北内陆减少。暖湿季风、距海远近和山地的阻挡都会影响水汽输送，局地不一定沿这条方向单调变化。'},
        {title:'秦岭—淮河附近有过渡',text:'秦岭—淮河一线常用来认识我国东部南北气候差异。气温、降水和植被的过渡带各有宽度，同一条等温线的位置也会随季节和统计期变化。'},
        {title:'一块地方可以同时有三种描述',text:'气候类型概括气温、降水和气候成因等特征。温度带关注热量积累，干湿区看水分供给与耗散。三套分区回答的问题不同，界线也各有依据。'}],
      question:'青藏高原的许多格点属于柯本 E 类，能说这里在极地吗？',answer:'地理上的极地由纬度和位置描述。柯本 E 类按最暖月温度等气候条件识别，青藏高原的高海拔也可使部分区域达到这类寒冷条件。',
      sources:['china','qinling','beck','geotiff','climatview']}
  ];

  const weather = [
    {id:'cloud',name:'云和雨',photo:'anvil',detail:'湿空气上升时会因气压降低而膨胀冷却。接近饱和之后，水汽可以凝结成小滴或形成冰晶。粒子长大到能落下来并抵达地面，就会形成降水。',observe:'看云的轮廓。图中是高耸的积雨云，云顶像一把展开的伞。只看一张云图，无法确定某地点量到了多少雨。'},
    {id:'fog',name:'雾、露和霜',photo:'fog',detail:'近地空气冷却并形成悬浮小水滴，会起雾。露是在较冷表面凝结的水滴。物体表面足够冷、满足水汽形成冰晶的条件时，可出现霜。',observe:'雾在空气里，露和霜附着在物面。图上浅色的海雾沿着海岸伸入湾区。'},
    {id:'snow',name:'雪',detail:'云中的冰晶在低温下增长、聚合成雪花。如果下降途中没有完全融化，雪可以到达地面。雪花能否积在地面，还要看地表温度与降雪强度。',observe:'降雪是正在下落的雪，积雪是已经留在地面的雪。卫星图上白色覆盖还需结合位置、形状和其他观测分辨。'},
    {id:'storm',name:'雷暴和冰雹',photo:'anvil',detail:'雷电是电荷积累后的放电，周围空气突然受热膨胀形成雷声。雷暴云内的强上升气流能把冰粒托在云中，使过冷水滴冻结在冰粒上，长大后可能落成冰雹。',observe:'积雨云向上长得很高。闪电与雷声属于同一过程，光先到达观察者，声音后到。'},
    {id:'rainbow',name:'彩虹',photo:'rainbow',detail:'阳光进入水滴时折射，在水滴内部反射，再出水滴时折射。不同波长的光偏折程度不同，观察者便能看到分开的颜色。',observe:'主虹一般出现在背向太阳的方向。地面常遮住下半圈，飞机上在合适条件下能看到一整圈。'},
    {id:'dust',name:'风和沙尘',photo:'dust',detail:'气压差推动空气运动，地球自转和地表摩擦也会影响风向。干燥裸露的地表遇到较强风，沙粒和尘粒可能被吹起。细尘能够随气流长距离输送。',observe:'卫星图中黄褐色羽状区域是被输送的尘，白色区域可能是云或地面积雪。结合形状、位置和时间变化比单看颜色可靠。'}
  ];

  const zones = [
    {id:'tropical',title:'热带季风',region:'海南岛及华南部分低纬地区',station:'haikou',text:'低纬度带来较多热量，全年暖热。季风与热带天气系统影响雨量，暖季通常较多雨。'},
    {id:'subtropical',title:'亚热带季风',region:'长江流域及其以南广大地区',station:'nanjing',text:'夏季高温、雨水多，冬季比北方多地温和。长江中下游初夏常有阶段性梅雨。'},
    {id:'temperate',title:'温带季风',region:'华北、东北等东部较高纬地区',station:'beijing',text:'季节温差明显，暖季集中降水，冬季较寒冷而干燥。东北的冬季通常比华北更冷。'},
    {id:'continental',title:'温带大陆性',region:'西北内陆的盆地与高地',station:'urumqi',text:'距海远且受地形阻隔，许多地区降水少、气温年较差较大。山地迎风坡和盆地的干湿程度也有差别。'},
    {id:'highland',title:'高原山地',region:'青藏高原及高山地区',station:'lhasa',text:'在相近纬度，高处往往较冷。海拔、坡向和水汽来向使同一山地的不同高度和坡面也呈现不同气候。'}
  ];
  const classes = [
    {id:'a',name:'A 热带',color:'#188c72',text:'终年暖热，再按旱雨季分亚类。'},
    {id:'b',name:'B 干旱',color:'#dea63a',text:'降水相对于热量和蒸发需求偏少，有沙漠和草原等亚类。'},
    {id:'c',name:'C 温和气候',color:'#88b95c',text:'冬季较温和，可包含部分亚热带和温带气候。'},
    {id:'d',name:'D 冷冬气候',color:'#6496ce',text:'冬季较冷，夏季有一定热量。可按降水季节进一步区分。'},
    {id:'e',name:'E 极地型',color:'#af83c2',text:'最暖月均温仍低于约 10℃。高海拔地区也可能出现。'}
  ];
  // 按 Beck 数据编码顺序排列，0 表示海面或无数据。
  const codes = ['','Af','Am','Aw','BWh','BWk','BSh','BSk','Csa','Csb','Csc','Cwa','Cwb','Cwc','Cfa','Cfb','Cfc','Dsa','Dsb','Dsc','Dsd','Dwa','Dwb','Dwc','Dwd','Dfa','Dfb','Dfc','Dfd','ET','EF'];
  const comparisons = [
    {id:'monsoon',title:'北京与南京',first:'beijing',second:'nanjing',prompt:'找两站的冬季温差，再看雨季峰值是否在同一个月。'},
    {id:'inland',title:'北京与乌鲁木齐',first:'beijing',second:'urumqi',prompt:'同处北方，哪个站夏季降水更集中？'},
    {id:'season',title:'南京与里斯本',first:'nanjing',second:'lisbon',prompt:'哪个站雨热同期？哪个站暖季反而较干？'},
    {id:'latitude',title:'吉隆坡与努克',first:'kuala',second:'nuuk',prompt:'跨越纬度对照，比较全年冷暖和最暖月的气温。'}
  ];
  const data = {sources,photos,pages,weather,zones,classes,codes,comparisons};
  if (typeof module === 'object' && module.exports) module.exports = data;
  else window.ClimateData = data;
})();
