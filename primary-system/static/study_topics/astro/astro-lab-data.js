/* 天文实验室：数值口径、观察步骤、任务里程碑与资料出处。 */
'use strict';
const ASTRO_LAB = {
  moon: {
    minYear:1900,maxYear:2100,
    note:'默认看此刻；选日期后统一看那一天北京时间 20 时的月相。亮面按日、地、月位置计算，月面按北半球常见方向示意；实际倾斜、升落时间、天气和遮挡会影响你能否看到月亮。',
    manualNote:'现在是手动模型，不对应某一天。点「看此刻」或重新选日期，可回到日期月相。',
    source:'https://science.nasa.gov/moon/moon-phases/'
  },
  engine:{version:'2.1.19',source:'https://github.com/cosinekitty/astronomy',sha256:'f41139a87941ea017ab902b954c9389fa27ea72083d7fab4971756d7769d14e6'},
  pluto:{id:'pluto',name:'冥王星',category:'矮行星',diameter:2376,periodDays:90560,period:247.94,temperatureC:-225,color:'#c8b39d',fact:'有浅色的心形区域；2006 年起被归为矮行星。'},
  planetSource:'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',
  comparisonNote:'八大行星，加上一位老朋友冥王星。直径采用近似赤道直径，冥王星用近似直径；公转一圈用地球日或地球年表示。圆形图标帮助认名字，大小比例看数值条。',
  temperatureNote:'温度采用 NASA 数据表的平均参考值：岩石天体看表面，木星、土星、天王星、海王星看大气约 1 巴处。它们没有可站立的固体表面；同一天体不同地方、昼夜和季节也会有温差。',
  quiz:[
    {id:'largest',question:'八大行星里，哪颗的直径最大？',options:[{id:'earth',label:'地球'},{id:'jupiter',label:'木星'},{id:'saturn',label:'土星'}],answer:'jupiter',explanation:'木星最大，直径约 14.3 万千米，约为地球的 11 倍。土星虽然有宽阔光环，行星本体仍比木星小。'},
    {id:'hottest',question:'离太阳最近的水星，一定是最热的行星吗？',options:[{id:'mercury',label:'是，水星最热'},{id:'venus',label:'不是，金星更热'},{id:'same',label:'每颗都一样热'}],answer:'venus',explanation:'金星平均表面温度约 464℃，高于水星。厚厚的大气带来强烈的温室效应；远近不是唯一条件。'},
    {id:'pluto',question:'把冥王星也放进对比表，太阳系就又有九大行星了吗？',options:[{id:'nine',label:'有九大行星了'},{id:'star',label:'冥王星变成恒星了'},{id:'dwarf',label:'仍是八大行星，冥王星是矮行星'}],answer:'dwarf',explanation:'对比表可以放不同类别的天体。冥王星属于矮行星，和八大行星放在一起比较，不会改变它的分类。'}
  ],
  polaris:{
    stars:[
      {id:'dubhe',name:'天枢',point:[160,285]},
      {id:'merak',name:'天璇',point:[120,320]},
      {id:'phecda',name:'天玑',point:[200,348]},
      {id:'megrez',name:'天权',point:[230,285]},
      {id:'alioth',name:'玉衡',point:[290,310]},
      {id:'mizar',name:'开阳',point:[350,310]},
      {id:'alkaid',name:'摇光',point:[410,355]}
    ],
    point:[360,110],
    steps:[
      {title:'先认七颗星',note:'找像大勺子的北斗七星。它们是大熊座的一部分，四颗围成勺斗，另外三颗连成勺柄。'},
      {title:'找到勺口两星',note:'先找天璇，再找天枢。图中的金色短线，就是这两颗指极星之间的一份距离。'},
      {title:'沿勺口延长五份',note:'从天璇指向天枢，越过天枢，沿同一方向继续延长约五份这样的距离。跟着小圆点数一数。'},
      {title:'找到北极星',note:'延长线附近那颗星就是北极星。朝着它，便大致朝向北方；它亮度中等，并不是夜空中最亮的星。'}
    ],
    note:'这是北半球找星方法的示意，星位经过排版简化，不是某地某时的实时星图。北斗的方向会随季节和时刻变化，连线方法仍相同；先找能看到北方天空的开阔地方。',
    source:'https://science.nasa.gov/solar-system/what-is-the-north-star-and-how-do-you-find-it/'
  },
  missionNote:'挑选 14 个探月、探火星的代表性里程碑，按标明的发射、入轨、着陆或样品返回日期排列；任务成果来自整个探测过程。这里不是全部任务清单，发现水活动线索也不等于发现生命。',
  missions:[
    {id:'luna-3',date:'1959-10-04',name:'月球三号',nation:'苏联',target:'moon',event:'发射奔月',where:'月球附近，飞掠观测',result:'此后首次拍回月球背面的照片，让人类看见总是背向地球的另一面。',source:'https://science.nasa.gov/moon/missions/'},
    {id:'mariner-4',date:'1965-07-15',name:'水手四号',nation:'美国',target:'mars',event:'飞掠火星（UTC）',where:'从火星旁飞过',result:'拍回首批火星近距离照片，看到许多撞击坑，并测到火星大气十分稀薄。',source:'https://science.nasa.gov/mission/mariner-4/'},
    {id:'luna-9',date:'1966-02-03',name:'月球九号',nation:'苏联',target:'moon',event:'月面软着陆',where:'月球风暴洋附近',result:'首次实现月球软着陆，并从月面拍摄照片，把近处的月面景象传回地球。',source:'https://science.nasa.gov/moon/missions/'},
    {id:'mariner-9',date:'1971-11-14',name:'水手九号',nation:'美国',target:'mars',event:'进入火星轨道',where:'围绕火星运行',result:'拍下大范围火星地形，展示巨大的火山和峡谷。火星不只有撞击坑。',source:'https://science.nasa.gov/mission/mariner-9/'},
    {id:'viking-1',date:'1976-07-20',name:'海盗一号',nation:'美国',target:'mars',event:'着陆火星',where:'火星克律塞平原',result:'从地面拍照、测天气、分析土壤；进行了生命探测实验，但没有获得确认生命存在的证据。',source:'https://science.nasa.gov/mission/viking-1/'},
    {id:'pathfinder',date:'1997-07-04',name:'火星探路者与旅居者号',nation:'美国',target:'mars',event:'着陆火星',where:'火星阿瑞斯谷',result:'把首辆火星车送上火星，让小车靠近岩石观察，测量岩石、土壤和天气。',source:'https://science.nasa.gov/mission/mars-pathfinder/'},
    {id:'change-1',date:'2007-11-05',name:'嫦娥一号',nation:'中国',target:'moon',event:'进入环月轨道',where:'围绕月球运行',result:'中国首颗月球探测卫星，拍摄月面，帮助绘制全月球影像图。',source:'https://science.nasa.gov/moon/missions/'},
    {id:'curiosity',date:'2012-08-06',name:'好奇号',nation:'美国',target:'mars',event:'着陆火星',where:'火星盖尔陨石坑',result:'从岩石和矿物中找到过去适宜微生物生存环境的证据，帮助研究古代火星的水与气候。',source:'https://science.nasa.gov/mission/msl-curiosity/'},
    {id:'change-3',date:'2013-12-14',name:'嫦娥三号与玉兔号',nation:'中国',target:'moon',event:'月面软着陆',where:'月球雨海',result:'中国首次月球软着陆，玉兔号在月面巡视，观察岩石、土壤与地下结构。',source:'https://science.nasa.gov/moon/missions/'},
    {id:'change-4',date:'2019-01-03',name:'嫦娥四号与玉兔二号',nation:'中国',target:'moon',event:'月球背面软着陆',where:'月背冯·卡门撞击坑',result:'首次在月球背面软着陆，由鹊桥中继星转发信号，让背面的近距离探测成为可能。',source:'https://science.nasa.gov/moon/missions/'},
    {id:'change-5',date:'2020-12-17',name:'嫦娥五号',nation:'中国',target:'moon',event:'样品返回地球',where:'从月球风暴洋带样品回地球',result:'带回月球岩石和土壤，科学家可以在地面实验室研究它们的成分与年龄。',source:'https://www.cnsa.gov.cn/n6758823/n6758838/c6810928/content.html'},
    {id:'perseverance',date:'2021-02-18',name:'毅力号',nation:'美国',target:'mars',event:'着陆火星',where:'火星耶泽罗陨石坑',result:'研究古代湖泊与三角洲的岩石，寻找古代生命可能留下的线索，并封装岩芯样品。',source:'https://science.nasa.gov/mission/mars-2020-perseverance/'},
    {id:'tianwen-1',date:'2021-05-15',name:'天问一号与祝融号',nation:'中国',target:'mars',event:'着陆火星（北京时间）',where:'火星乌托邦平原',result:'一次任务完成环绕、着陆和巡视。祝融号测量表面地形、土壤与气象，研究火星环境。',source:'https://www.cnsa.gov.cn/n6758822/c6812001/content.html'},
    {id:'change-6',date:'2024-06-25',name:'嫦娥六号',nation:'中国',target:'moon',event:'月背样品返回地球',where:'从月背南极—艾特肯盆地带样品回地球',result:'首次把月球背面的样品带回地球，为比较月球正面与背面提供新的实物资料。',source:'https://www.cnsa.gov.cn/n6758823/n6758844/n10518102/n10518147/c10565180/content.html'}
  ]
};
if(typeof module!=='undefined')module.exports=ASTRO_LAB;
