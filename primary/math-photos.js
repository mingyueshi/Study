/* ============================================================
   乐学堂 · 数学知识点 —— 公开图库配图（Pexels，免费商用）
   单元横幅照片 + 每个知识点一张「生活中的数学」情境照片
   图片文件位于 images/math/
   ============================================================ */
'use strict';

window.MATH_PHOTOS = (function () {
  const DIR = 'images/math/';

  /* 单元 / 特殊视图横幅照片 */
  const BANNER = {
    mu1: 'banner-mu1.jpg',
    mcode: 'banner-mcode.jpg',
    mu2: 'banner-mu2.jpg',
    mu3: 'banner-mu3.jpg',
    mu4: 'banner-mu4.jpg',
    mu5: 'banner-mu5.jpg',
    mplay: 'banner-mplay.jpg',
    mu6: 'banner-mu6.jpg',
    mu7: 'banner-mu7.jpg',
    mu8: 'banner-mu8.jpg',
    mnav: 'banner-mnav.jpg',
    formulas: 'banner-formulas.jpg',
    mistakes: 'banner-mistakes.jpg',
  };

  /* 知识点情境照片 + 一句「生活中的数学」 */
  const POINT = {
    'mu1-1': { img: 'p-mu1-1.jpg', life: '10 个一万是十万——十万张纸摞起来大约厚 10 米。' },
    'mu1-2': { img: 'p-mu1-2.jpg', life: '数位顺序表就像给每个数字安排「座位」，座位不同，大小不同。' },
    'mu1-3': { img: 'p-mu1-3.jpg', life: '鸟巢体育场能容纳约 8 万人，读作「八万」。' },
    'mu1-4': { img: 'p-mu1-4.jpg', life: '写大数时先四位分一级，就不容易漏 0、写错。' },
    'mu1-5': { img: 'p-mu1-5.jpg', life: '天平两边哪边重，哪边就「大」——比较先比位数。' },
    'mu1-6': { img: 'p-mu1-6.jpg', life: '量身高常说「约 1 米 4」，这就是近似数。' },
    'mu1-7': { img: 'p-mu1-7.jpg', life: '城市人口常说「约几十万」，不必精确到个位。' },
    'mu1-8': { img: 'p-mu1-8.jpg', life: '远古人数羊用结绳——数就是这样一步步发展来的。' },
    'mcode-1': { img: 'p-mcode-1.jpg', life: '商品一扫条形码，名称和价格立刻跳出来。' },
    'mcode-2': { img: 'p-mcode-2.jpg', life: '身份证号里藏着你的出生日期和性别，一串数字就是一段信息。' },
    'mcode-3': { img: 'p-mcode-3.jpg', life: '收付款二维码里，就藏着一串编码信息。' },
    'mu2-1': { img: 'p-mu2-1.jpg', life: '两条铁轨像永不相交的直线，伸向远方。' },
    'mu2-2': { img: 'p-mu2-2.jpg', life: '十字路口，横马路和竖马路正好互相垂直。' },
    'mu2-3': { img: 'p-mu2-3.jpg', life: '量角器就是专门用来量角的大小的工具。' },
    'mu2-4': { img: 'p-mu2-4.jpg', life: '钟表 3 点整，时针和分针正好组成一个直角。' },
    'mu2-5': { img: 'p-mu2-5.jpg', life: '用直尺和量角器，就能画出指定度数的角。' },
    'mu3-1': { img: 'p-mu3-1.jpg', life: '列竖式时数位对齐，从个位乘起，才不会算错。' },
    'mu3-2': { img: 'p-mu3-2.jpg', life: '买三样东西大约多少钱？先估一估再付款。' },
    'mu3-3': { img: 'p-mu3-3.jpg', life: '一箱 20 瓶，10 箱是 200 瓶——末尾的 0 别弄丢。' },
    'mu3-4': { img: 'p-mu3-4.jpg', life: '书一本本往上摞，总数随着倍数一起变。' },
    'mu3-5': { img: 'p-mu3-5.jpg', life: '用计算器多试几组，就能发现藏着的规律。' },
    'mu3-6': { img: 'p-mu3-6.jpg', life: '电影院座位够不够坐？先估一估总人数。' },
    'mu4-1': { img: 'p-mu4-1.jpg', life: '望远镜只能看到视野里的一小块——这就是观察范围。' },
    'mu4-2': { img: 'p-mu4-2.jpg', life: '站在广场不同位置拍照，纪念碑和纪念堂的左右关系会反过来。' },
    'mu5-1': { img: 'p-mu5-1.jpg', life: '先数这篮苹果还是先数那篮，总数都一样。' },
    'mu5-2': { img: 'p-mu5-2.jpg', life: '鸡蛋摆 4 行 6 列，和 6 行 4 列一样多。' },
    'mu5-3': { img: 'p-mu5-3.jpg', life: '一大片地砖，可以分成两块分别数，再相加。' },
    'mu5-4': { img: 'p-mu5-4.jpg', life: '把蛋糕平均分给大家，每人才一样多。' },
    'mplay-1': { img: 'p-mplay-1.jpg', life: '数图案要像排队一样按顺序，才不重不漏。' },
    'mu6-1': { img: 'p-mu6-1.jpg', life: '切开橙子，就能看见它里面的截面是什么形状。' },
    'mu6-2': { img: 'p-mu6-2.jpg', life: '一块一块往上搭，大楼越盖越高。' },
    'mu6-3': { img: 'p-mu6-3.jpg', life: '转骰子时，要在脑子里想清楚每个面翻滚后到了哪里。' },
    'mu7-1': { img: 'p-mu7-1.jpg', life: '一箱苹果连箱重 25 千克，去掉箱子才是苹果的重量。' },
    'mu7-2': { img: 'p-mu7-2.jpg', life: '货架上每瓶饮料都有标价，买几瓶就按单价算总价。' },
    'mu7-3': { img: 'p-mu7-3.jpg', life: '知道汽车跑多快、跑多久，就能算出跑了多远。' },
    'mu7-4': { img: 'p-mu7-4.jpg', life: '两车从两地相向而行，速度加在一起，很快就相遇了。' },
    'mu8-1': { img: 'p-mu8-1.jpg', life: '调查全班最爱吃的水果，要一个一个打勾记录。' },
    'mu8-2': { img: 'p-mu8-2.jpg', life: '条形统计图能一眼看出谁多谁少。' },
    'mu8-3': { img: 'p-mu8-3.jpg', life: '平均身高不是某个人的身高，而是全班身高的整体水平。' },
    'mnav-1': { img: 'p-mnav-1.jpg', life: '打开导航，它说 15 分钟到——这个时间准吗？' },
    'mnav-2': { img: 'p-mnav-2.jpg', life: '在教室里模拟出行：遇红灯要等，遇拥堵要慢。' },
    'mnav-3': { img: 'p-mnav-3.jpg', life: '真的走一趟，记录实际时间，和导航预计的比一比。' },
    'mnav-4': { img: 'p-mnav-4.jpg', life: '把研究结果讲给同学听，用数据说明导航时间准不准。' },
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
  module.exports = window.MATH_PHOTOS;
}
