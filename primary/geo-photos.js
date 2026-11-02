/* ============================================================
   乐学堂 · 地理探索 —— 公开图库配图（自用无版权问题）
   - Pexels 免费图库照片（站点横幅 + 实景小照片）
   - B站纪录片节目截图（仅自用学习）
   站点横幅照片 + 部分知识点一张「世界真面目」实景照片
   图片文件位于 images/geo/
   ============================================================ */
'use strict';

const GEO_PHOTOS = (function () {
  const DIR = 'images/geo/';

  /* 站点 / 特殊视图横幅照片 */
  const BANNER = {};

  /* 知识点实景照片 + 一句「世界真面目」注解 */
  const POINT = {};

  const url = n => DIR + n;

  const api = {
    DIR,
    /* 站点/特殊视图横幅照片地址，无则 '' */
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
  window.GEO_PHOTOS = GEO_PHOTOS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GEO_PHOTOS;
}
