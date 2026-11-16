/* 显示层内容独立维护，海拔和省界仍复用原资料。 */
window.GM_CHINA_TERRAIN_VISUAL = {
  version: 1,
  contours: {
    interval: 500,
    color: "#70523b",
    opacity: 0.48,
    note: "相邻等高线相差 500 米，细线越挤，坡面通常越陡。先看全图，再放大看更细的山河；高度放大不改变线的海拔，细小山谷仍可能被省略。",
  },
  light: {
    azimuth: 218,
    elevation: 55,
    presets: [
      { id: "east", name: "从东边照", azimuth: 90 },
      { id: "south", name: "从南边照", azimuth: 180 },
      { id: "west", name: "从西边照", azimuth: 270 },
      { id: "north", name: "从北边照", azimuth: 0 },
      { id: "southwest", name: "恢复西南光", azimuth: 218 },
    ],
    note: "指南圈按地理方向表示光从哪边来，拖动滑块也能换方向。山坡的明暗会改变，山高和形状没有变；这是坡面光照示意，不是实时日照或天气。",
  },
  snow: {
    min: 0,
    max: 9000,
    step: 100,
    initial: 5000,
    note: "拖动滑块，把指定海拔以上的地方变白，看看哪些山更高。白色是统一高度的观察示意，不代表这里一定有永久积雪；真实积雪还受气候、坡向和季节影响。",
  },
  opacity: {
    initial: 100,
    note: "100％是不透明，0％时地形面隐去，边界、水系和打开的等高线仍可观察。透明显示不改变点选海拔，模型底部的切面也不是真实地下结构。",
  },
  mountainIcon: "⛰",
  sources: [
    {
      name: "NSIDC · 积雪持续时间与环境",
      url: "https://nsidc.org/learn/ask-scientist/snow-cover-changing",
    },
  ],
};
