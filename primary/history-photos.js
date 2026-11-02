/* ============================================================
   乐学堂 · 历史长廊 —— 公开图库配图（自用无版权问题）
   - Pexels 免费图库照片（长廊横幅 + 实景小照片）
   - B站纪录片节目截图（文物小照片，仅自用学习）
   单元横幅照片 + 部分知识点一张「文物真面目」实景照片
   图片文件位于 images/history/
   ============================================================ */
'use strict';

const HISTORY_PHOTOS = (function () {
  const DIR = 'images/history/';

  /* 长廊 / 特殊视图横幅照片 */
  const BANNER = {
    hu1: 'banner-hu1.jpg',
    hu2: 'banner-hu2.jpg',
    hu3: 'banner-hu3.jpg',
    hu4: 'banner-hu4.jpg',
    hu5: 'banner-hu5.jpg',
    hu6: 'banner-hu6.jpg',
    hu7: 'banner-hu7.jpg',
    hu8: 'banner-hu8.jpg',
    facts: 'banner-facts.jpg',
    cinema: 'banner-cinema.jpg',
    clinic: 'banner-clinic.jpg',
  };

  /* 知识点实景照片 + 一句「文物真面目」注解 */
  const POINT = {
    'hu1-4': { img: 'p-hu1-4.jpg', life: '秦始皇陵兵马俑发掘现场：文物埋在哪一层、哪个位置，本身就是重要信息。' },
    'hu2-1': { img: 'p-hu2-1.jpg', life: '石壁上的龙：龙是古人想象出来的神兽——神话，就是古人开的大脑洞。' },
    'hu2-4': { img: 'p-hu2-4.jpg', life: '奔腾的黄河：上古洪水泛滥，大禹用「疏导」治住了它。' },
    'hu3-4': { img: 'videos/v-bianzhong.jpg', life: '曾侯乙编钟：铜人托举着编钟——礼乐制度最重要的见证。' },
    'hu5-1': { img: 'p-hu5-1.jpg', life: '秦始皇陵兵马俑：千人千面，统一天下的秦始皇留下了这支地下大军。' },
    'hu5-4': { img: 'p-hu5-4.jpg', life: '手工抄出来的纸：又轻又便宜，让知识飞进寻常人家。' },
    'hu6-2': { img: 'p-hu6-2.jpg', life: '文房四宝：笔、墨、纸、砚，王羲之把它们用成了艺术。' },
    'hu6-4': { img: 'p-hu6-4.jpg', life: '戏曲舞台上的将军：木兰替父从军的故事，被一代代人搬上舞台。' },
    'hu7-2': { img: 'p-hu7-2.jpg', life: '江南贡院：古代科举的考场，考生在小号舍里一待就是好几天。' },
    'hu7-4': { img: 'banner-hu7.jpg', life: '西安大雁塔：为保存玄奘从天竺带回的佛经而建。' },
    'hu7-6': { img: 'p-hu7-6.jpg', life: '大雁塔与「雁塔题名」：唐代进士考中后，会把名字题在雁塔下。' },
    'hu8-2': { img: 'videos/v-song.jpg', life: '展馆里还原的宋金战场：岳家军北伐，「冻死不拆屋，饿死不掳掠」。' },
  };

  const url = n => DIR + n;

  const api = {
    DIR,
    /* 长廊/特殊视图横幅照片地址，无则 '' */
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

if (typeof window !== 'undefined') {
  window.HISTORY_PHOTOS = HISTORY_PHOTOS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HISTORY_PHOTOS;
}
