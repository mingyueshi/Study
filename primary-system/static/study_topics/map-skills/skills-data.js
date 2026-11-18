/* 学习案例、练习地图与地形模型参数。平面坐标从西南角起算，向东、向北为正，统一用米。 */
(function () {
  'use strict';
  const sources = [
    {id:'map',title:'USGS · 用地图与指南针找方向',url:'https://pubs.usgs.gov/publication/fs03501',note:'图幅的指向标、比例尺和读地形的基本方法。'},
    {id:'scale',title:'USGS · 地图的图示比例尺',url:'https://pubs.usgs.gov/of/1998/of98-805/lessons/chpt1/act3-hnd.htm',note:'线段比例尺、符号说明和等高距。'},
    {id:'north',title:'USGS · 地形图上的几种北向',url:'https://www.usgs.gov/faqs/what-do-different-north-arrows-a-usgs-topographic-map-mean',note:'真北、磁北和方格北的区别。'},
    {id:'symbols',title:'USGS · 地图符号指南',url:'https://www.usgs.gov/ngp-standards-and-specifications/us-topo-map-symbol-guide',note:'不同地图用线、点和色块表达不同地物。'},
    {id:'layers',title:'USGS · 地形图的分色印刷',url:'https://www.usgs.gov/media/images/map-separates',note:'地形图局部及林地、地形等分色示例，公共领域。'},
    {id:'topography',title:'USGS · 什么是地形图？',url:'https://www.usgs.gov/faqs/what-a-topographic-map',note:'等高线把同一海拔的点连起来，帮助表达地面形态。'},
    {id:'relief',title:'USGS · 等高线与晕渲地形',url:'https://www.usgs.gov/media/images/contour-lines-and-shaded-relief-a-us-topo-map',note:'同一地形图同时表达等高线与地形明暗，公共领域。'},
    {id:'axes',title:'中国民航局 · 航空图编绘规范',url:'https://www.caac.gov.cn/XXGK/XXGK/BZGF/HYBZ/202111/P020211109571091129158.pdf',note:'平面图和剖面图可采用不同的水平、垂直比例。'}
  ];

  const pages = [
    {id:'index',title:'地图技能',intro:'在青石溪谷练习读图。从量距离、找方向和认图例开始，再沿等高线看山谷，把地形“切开”读剖面。',
      cards:[
        {title:'先确定这张图适合做什么',text:'全景图适合找位置，细节图便于看道路和建筑，地形图能帮助判断起伏。读图前先看图名、范围、指向标、比例尺和图例。'},
        {title:'把地图上的线和实际问题联系起来',text:'地图可以回答两地相隔多远、各在什么方向。路径绕行和地面起伏还会影响实际行走距离，读图时先说清自己量的是什么。'}],
      quiz:{prompt:'出发前要弄清地图上的蓝色线表示什么，先读哪里？',options:['图例','比例尺','图名'],answer:0,reveal:'图例说明各类线、点和色块的含义。'},
      sources:['map','scale','topography']},
    {id:'scale',title:'比例尺',intro:'在练习地图上点两个地标，用比例尺把图上长度换成实地距离。找一找，沿步道走比直线多多少。',
      cards:[
        {title:'先把单位统一',text:'比例尺是图上距离除以实际水平距离。1∶10 000 表示图上 1 厘米相当于实地 10 000 厘米，也就是 100 米。1 千米＝1 000 米＝100 000 厘米。'},
        {title:'分母较小，比例尺较大',text:'1∶5 000 比 1∶10 000 大。同样大的纸张使用较大的比例尺，通常表示的地面范围更小，能画进更多细节。'},
        {title:'数字比例尺与线段比例尺',text:'把纸图等比缩印或放大后，原印刷数字不再适用。线段尺跟着图一起缩放，仍能读距离。这里的纸面厘米由计算得出，图上比例尺随屏幕显示。'}],
      quiz:{prompt:'比例尺 1∶20 000，图上量得 2.5 厘米，实地水平距离是多少？',options:['50 米','500 米','5 千米'],answer:1,reveal:'2.5 × 20 000＝50 000 厘米，即 500 米。'},
      sources:['map','scale']},
    {id:'direction',title:'方向',intro:'改变起点和目标，再把地图顺时针转动。观察指北箭头，比较屏幕上的位置和地标之间的方向。',
      cards:[
        {title:'先说谁是参照点',text:'方向描述一个点相对于另一个点的位置。说“甲在乙的东边”时，乙是参照点。互换参照点，方位会反过来。'},
        {title:'读指向标，或读经纬网',text:'常见地图上北下南。遇到有指向标的地图，以标出的北向为准。经纬网地图可沿经线辨南北、沿纬线辨东西。不同投影的经纬线可以弯曲。'},
        {title:'从北顺时针量角',text:'方位角用北为 0°，顺时针量角，向东是 90°，向南是 180°，向西是 270°。八方位把一圈分为 8 个 45° 扇区。地理北与磁北的差别叫磁偏角。'}],
      quiz:{prompt:'把地图顺时针转 90° 后，北箭头指向屏幕右侧。一个地物在起点的屏幕下方，它位于起点哪个方向？',options:['南','东','西'],answer:1,reveal:'此时图面向右是北，再顺时针转 90°，图面向下就是东。'},
      sources:['map','north']},
    {id:'legend',title:'图例',intro:'点图例，看同类地物在哪里。观察一个点、一条线和一片色块分别适合表示什么。',
      cards:[
        {title:'点定位，线指出走向，面画出范围',text:'小范围地物常用点符号定位。步道、河流等可用线表示走向，湖泊和林地常用面表示范围。地图比例尺变了，同一地物的画法也可能变。'},
        {title:'用这张图的图例检查猜测',text:'颜色和线型由制图目的与制图规范决定。蓝线经常表示水系，仍要看这张图的说明。点符号大小和道路线宽也常为读图方便作了夸张。'}],
      quiz:{prompt:'在这张练习地图中，绿色色块表示什么？',options:['步道','林地','游客中心'],answer:1,reveal:'图例把绿色面列为林地。步道用橙色虚线表示。'},
      sources:['scale','symbols','layers']},
    {id:'contours',title:'等高线',intro:'改变等高距，再点青石溪谷里的山顶、鞍部、山脊和山谷，观察等高线如何围起来或拐弯。',
      cards:[
        {title:'一条线上的海拔相同',text:'等高线连接海拔相同的点。相邻普通等高线的高度差叫等高距。闭合线往内读数逐渐升高，通常表示山顶。如果向内更低，则可能是洼地，要结合标高和图例判断。'},
        {title:'比较疏密，先核对比例尺和等高距',text:'同一幅图里，等高距相同的时候，线密通常坡陡，线疏通常坡缓。单独加密等高线会让图面线条更多，地形的实际坡度保持一样。'},
        {title:'读山谷、山脊和鞍部',text:'过山谷的等高线常弯向高处，V 形尖端多指上游。山脊一带通常弯向较低处。两处高地之间的低槽是鞍部，横着走和顺着高地走会看到不同的起伏。'}],
      quiz:{prompt:'同一幅等高线图上，甲、乙两段都跨过 4 个等高距，甲段的水平距离更短。哪段平均坡度更大？',options:['甲段','乙段','一样大'],answer:0,reveal:'高度差相同，水平距离越短，平均坡度越大。'},
      sources:['topography','scale','relief']},
    {id:'profile',title:'地形剖面图',intro:'在地图上点下 A、B 或拖出一条剖面线。读出沿线的距离和海拔，再拖动读数点，对照平面图上的位置。',
      cards:[
        {title:'把交点“一一搬过去”',text:'从 A 开始，记录剖面线与各条等高线相交的位置。以到 A 的水平距离为横坐标，以交点海拔为纵坐标，能标出剖面上的一串点。中间的曲线需要结合地形推断。'},
        {title:'同一座山，从不同方向切开会不同',text:'剖面只说明选线经过的地形。绕开山顶的线可能显示不出最高点。把 A、B 互换，剖面的左右次序会反过来。'},
        {title:'纵向放大只改变图面的坡度',text:'剖面图可以用更大的垂直比例使起伏清楚。比较坡度时要看横纵轴和单位。剖面上的距离是沿所选直线的水平距离，和在坡面上实际走过的长度有区别。'}],
      quiz:{prompt:'保持选线不变，只把剖面图画得更高，发生了什么？',options:['山顶实际海拔增加','水平距离变短','图面上的起伏显得更明显'],answer:2,reveal:'海拔和水平距离量值保持不变。变的是图面纵向和横向的显示比例。'},
      sources:['topography','axes']}
  ];

  const terrain = {
    width:600, height:450, step:10, base:42, northRise:.11,
    hills:[
      {x:155,y:295,rise:240,sx:51,sy:95},
      {x:331,y:295,rise:185,sx:57,sy:80},
      {x:554,y:325,rise:95,sx:70,sy:75}
    ],
    valley:{east:440, amplitude:19, wavelength:82, cut:25, width:22, head:320}
  };

  const symbols = [
    {id:'river',name:'溪流',kind:'line',color:'#176f9a',text:'蓝色实线沿水道，把水流经过的位置连起来。'},
    {id:'trail',name:'步道',kind:'line',color:'#ad571e',text:'橙色虚线表示可沿线步行。走过多个弯时，路线长度要分段相加。'},
    {id:'woods',name:'林地',kind:'area',color:'#82ab65',text:'绿色色块画出林地范围，可以看到它大约延伸到哪些地方。'},
    {id:'lake',name:'湖泊',kind:'area',color:'#80c4dc',text:'浅蓝色的面表示水域范围，边缘可用来辨认湖岸。'},
    {id:'bridge',name:'桥',kind:'point',color:'#725084',text:'小方块标出桥的位置。为了读得清，图标大小不表示桥的实际尺寸。'},
    {id:'place',name:'地标',kind:'point',color:'#244a49',text:'深色圆点标出游客中心、观景台等便于定位的地方。'}
  ];
  const points = [
    {id:'center',name:'游客中心',at:[157,90],symbol:'place'},
    {id:'bridge',name:'青石桥',at:[457,90],symbol:'bridge'},
    {id:'deck',name:'北观景台',at:[157,290],symbol:'place'},
    {id:'pavilion',name:'山腰亭',at:[300,250],symbol:'place'}
  ];
  const route = {ends:['center','bridge'],nodes:[[157,90],[245,145],[355,155],[457,90]]};
  const land = {
    woods:[[45,195],[77,375],[172,413],[236,334],[190,234],[144,202]],
    lake:{at:[442,56],rx:53,ry:34}
  };
  const forms = [
    {id:'hill',name:'山顶',at:[156,302],text:'西侧一组等高线围成闭合圈，越向内海拔通常越高。看读数，再找圈内比较高的位置。'},
    {id:'saddle',name:'鞍部',at:[249,294],text:'两侧山顶较高，中间较低。朝南北两边离开鞍部，地面还会继续变低。'},
    {id:'ridge',name:'山脊',at:[150,210],text:'这一带是西侧山体向南伸出的高地。向两侧走会下降，沿脊线走则能到达较高位置。'},
    {id:'valley',name:'山谷',at:[447,231],text:'溪流沿附近低处向南。观察表示同一高度的线在溪谷附近怎样弯向北侧较高处。'}
  ];
  const presets = [
    {id:'hills',name:'横跨山岭',a:[36,290],b:[564,290]},
    {id:'stream',name:'横切溪谷',a:[296,187],b:[566,187]}
  ];
  const samples = [
    {id:'layers',file:'assets/map-layers.jpg',source:'layers',
      alt:'美国地质调查局的示例把同一幅地形图分成组合图、林地层、等高线层和更新层。',
      note:'先看左上角完整地图，再找绿层的林地和棕层的等高线。紫色是这个历史制图例中的补充资料。',
      original:'https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/Map%20Separates.jpg',
      sha256:'ce287807f9bb57fa761ac4bab959a275d6f3cf1732fd26679510c5c2f46a74c9'},
    {id:'relief',file:'assets/contour-relief.jpg',source:'relief',
      alt:'美国地质调查局真实地形图上，等高线叠在带阴影的起伏地面上。',
      note:'棕线表达海拔，底图的灰色明暗帮助看起伏。该图是美国地图局部，应按它自己的单位和图例读数。',
      original:'https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/thumbnails/image/ContourLines_0.jpg',
      sha256:'8b60b08b3365c823b7f5a9688d2bde71c4b3d9032afe69b39b47690b80bbf3b8'}
  ];
  const data = {pages,sources,terrain,land,points,symbols,route,forms,presets,samples};
  if (typeof module === 'object' && module.exports) module.exports = data;
  else window.MapSkillsData = data;
})();
