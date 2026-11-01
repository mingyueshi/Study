/* ============================================================
   乐学堂 · 天文探索 —— 公开图库配图（自用无版权问题）
   - NASA Image Library：公有领域（Public Domain），真实的太空照片
   - Wikimedia Commons：公有领域 / CC 授权的中国航天等照片
   单元横幅照片 + 每个知识点一张「宇宙真面目」实景照片
   图片文件位于 images/astro/
   ============================================================ */
'use strict';

window.ASTRO_PHOTOS = (function () {
  const DIR = 'images/astro/';

  /* 单元 / 特殊视图横幅照片 */
  const BANNER = {
    au1: 'banner-au1.jpg',
    au2: 'banner-au2.jpg',
    au3: 'banner-au3.jpg',
    au4: 'banner-au4.jpg',
    au5: 'banner-au5.jpg',
    au6: 'banner-au6.jpg',
    au7: 'banner-au7.jpg',
    au8: 'banner-au8.jpg',
    facts: 'banner-facts.jpg',
    clinic: 'banner-clinic.jpg',
  };

  /* 知识点实景照片 + 一句「宇宙真面目」注解 */
  const POINT = {
    'au1-1': { img: 'p-au1-1.jpg', life: 'NASA 太阳动力学天文台在太空拍下的太阳——亮斑和暗纹是太阳大气里的活跃区。' },
    'au1-2': { img: 'p-au1-2.jpg', life: '八兄弟排排站：木星是当之无愧的大块头，水星只有它的一小圈。' },
    'au1-3': { img: 'p-au1-3.jpg', life: '木星的大红斑：一场刮了 300 多年的巨型风暴，能装下整个地球。' },
    'au1-4': { img: 'p-au1-4.jpg', life: '罗塞塔号近距离拍的彗星：向阳面喷出气体和尘埃，这就是彗尾的原料。' },
    'au1-5': { img: 'p-au1-5.jpg', life: '2015 年新视野号拍到的冥王星真面目——那个浅色区域像不像一颗心？' },
    'au2-1': { img: 'p-au2-1.jpg', life: '满月照片：暗色斑块是「月海」，亮的地方是月面高地。' },
    'au2-2': { img: 'p-au2-2.jpg', life: '娥眉月：亮面总是鼓向太阳的方向，农历月初的黄昏挂在西边天。' },
    'au2-3': { img: 'p-au2-3.jpg', life: '环形山特写：边缘隆起、底部平坦，是陨石砸出的「伤疤」。' },
    'au2-4': { img: 'p-au2-4.jpg', life: '2017 年日全食：月亮完全遮住太阳，露出平时看不见的银白色日冕。' },
    'au2-5': { img: 'p-au2-5.jpg', life: '钱塘江大潮：月球引力「导演」的怒潮，观潮一定要站在安全区。' },
    'au2-6': { img: 'p-au2-6.jpg', life: '阿波罗 11 号宇航员奥尔德林站在月面上——月面的脚印能保留上百万年。' },
    'au3-1': { img: 'p-au3-1.jpg', life: '远离城市的夜空：肉眼能看到的约 6000 颗星，几乎全是恒星。' },
    'au3-2': { img: 'p-au3-2.jpg', life: '猎户座大星云：恒星的「育婴房」，许多新恒星正在云气里诞生。' },
    'au3-3': { img: 'p-au3-3.jpg', life: '旅行者 1 号从 60 亿千米外回望，地球成了一个「淡蓝色小点」。' },
    'au3-4': { img: 'p-au3-4.jpg', life: '北斗七星：勺口两星连线延长约 5 倍，就能找到北极星。' },
    'au3-5': { img: 'p-au3-5.jpg', life: '球状星团：几十万颗星星挤在一起，颜色不同，表面温度也不同。' },
    'au4-1': { img: 'p-au4-1.jpg', life: '英仙座流星雨划过夜空：沙粒大的流星体烧出一道道亮线。' },
    'au4-2': { img: 'p-au4-2.jpg', life: '韦布太空望远镜的 18 块金色镜面：口径越大，收集的星光越多。' },
    'au4-3': { img: 'p-au4-3.jpg', life: '观星爱好者带着望远镜到郊外：远离灯光，星星立刻多起来。' },
    'au4-4': { img: 'p-au4-4.jpg', life: '老照片里的日食观测镜：看太阳，从来都要用合格的专用眼镜。' },
    'au4-5': { img: 'p-au4-5.jpg', life: '长时间曝光下星星「画」出圆圈——圆心就是北极星，这是地球自转的痕迹。' },
    'au5-1': { img: 'p-au5-1.jpg', life: '银河光带横过夜空：那是无数颗星星连成的「光之河」。' },
    'au5-2': { img: 'p-au5-2.jpg', life: '仙女座星系：和银河系差不多大的「宇宙岛」，远在 254 万光年外。' },
    'au5-3': { img: 'p-au5-3.jpg', life: '宇宙微波背景辐射图：138 亿年前大爆炸留下的「余温」。' },
    'au5-4': { img: 'p-au5-4.jpg', life: '哈勃深空场：看似空空的一小块天区，藏着上千个星系。' },
    'au5-5': { img: 'p-au5-5.jpg', life: '超大质量黑洞的想象图：周围橙色圆环是被引力加热的吸积盘。' },
    'au6-1': { img: 'p-au6-1.jpg', life: '夜间火箭发射：尾焰向下猛喷，火箭借反作用力直冲夜空。' },
    'au6-2': { img: 'p-au6-2.jpg', life: '绕地球飞行的卫星：气象预报、导航定位全靠它们。' },
    'au6-3': { img: 'p-au6-3.jpg', life: '国际空间站全景：太阳电池板展开，像一对金色翅膀。' },
    'au6-4': { img: 'p-au6-4.jpg', life: '失重环境里宇航员飘着「游」进空间站——像游泳一样移动。' },
    'au6-5': { img: 'p-au6-5.jpg', life: '航天飞机点火升空：人类第一种可重复使用的载人飞船。' },
    'au7-1': { img: 'p-au7-1.jpg', life: '东方红一号卫星（模型）：1970 年升空，在太空播放《东方红》。' },
    'au7-2': { img: 'p-au7-2.jpg', life: '玉兔号月球车：中国留在月面上的第一道车辙。' },
    'au7-3': { img: 'p-au7-3.jpg', life: '火星车自拍照：边走边拍，把火星地表看得清清楚楚。' },
    'au7-4': { img: 'p-au7-4.jpg', life: '中国空间站：天和核心舱 + 问天、梦天两个实验舱组成「太空之家」。' },
    'au7-5': { img: 'p-au7-5.jpg', life: '艺术家笔下的火星基地：把家安到别的星球，正在从梦想变成计划。' },
    'au8-1': { img: 'p-au8-1.jpg', life: '「蓝色弹珠」：从太空看，地球是一颗被海洋包裹的生命星球。' },
    'au8-2': { img: 'p-au8-2.jpg', life: 'TRAPPIST-1 的 7 颗类地行星：好几颗正好落在宜居带里。' },
    'au8-3': { img: 'p-au8-3.jpg', life: '火星的水手号峡谷：干涸的痕迹说明远古火星有河有湖。' },
    'au8-4': { img: 'p-au8-4.jpg', life: '工程师正在安装旅行者号金唱片——一张寄给外星文明的「地球名片」。' },
    'au8-5': { img: 'p-au8-5.jpg', life: '空间站上拍到的极光：美丽的极光，常被误认成「不明飞行物」。' },
  };

  const url = n => DIR + n;

  const api = {
    DIR,
    /* 单元/特殊视图横幅照片地址，无则 '' */
    banner(id) { return BANNER[id] ? url(BANNER[id]) : ''; },
    /* 知识点照片 {img, life}，无则 null */
    point(pid) {
      const p = POINT[pid];
      return p ? { img: url(p.img), life: p.life } : null;
    },
    hasBanner(id) { return !!BANNER[id]; },
    hasPoint(pid) { return !!POINT[pid]; },
    BANNER_IDS: Object.keys(BANNER),
    POINT_IDS: Object.keys(POINT),
  };
  return api;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.ASTRO_PHOTOS;
}
