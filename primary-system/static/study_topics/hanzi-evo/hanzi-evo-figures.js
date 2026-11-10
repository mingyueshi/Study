/* ============================================================
   乐学堂 · 汉字演变馆 —— 图示库
   馆前必读用的装饰性小图示，沿用 lit-figures 的注册接口。
   ============================================================ */
'use strict';

const HANZI_EVO_FIGURES = {
  'demo-he-turtle': '<svg viewBox="0 0 120 90" role="img" aria-label="龟甲简笔画">' +
    '<rect x="14" y="18" width="92" height="56" rx="10" fill="#f5ead2" stroke="#8a5a2b" stroke-width="3"/>' +
    '<path d="M28 28 h18 M56 28 h18 M84 28 h10 M28 46 h18 M56 46 h18 M84 46 h10 M28 64 h18 M56 64 h18" stroke="#b5893a" stroke-width="2" fill="none"/>' +
    '<path d="M40 34 l6 6 M62 52 l7 7 M74 30 l5 8" stroke="#9a3412" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '</svg>',
  'demo-he-bronze': '<svg viewBox="0 0 120 90" role="img" aria-label="青铜鼎简笔画">' +
    '<ellipse cx="60" cy="24" rx="26" ry="7" fill="none" stroke="#7a6aa0" stroke-width="3"/>' +
    '<path d="M36 26 q-2 22 24 22 q26 0 24 -22" fill="#e6e0f2" stroke="#7a6aa0" stroke-width="3"/>' +
    '<path d="M44 48 l-8 18 M76 48 l8 18 M60 50 v18" stroke="#7a6aa0" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M50 34 h20" stroke="#7a6aa0" stroke-width="2" stroke-dasharray="3 4"/>' +
    '</svg>',
  'demo-he-bamboo': '<svg viewBox="0 0 120 90" role="img" aria-label="竹简简笔画">' +
    '<rect x="24" y="14" width="10" height="62" rx="3" fill="#eef3e2" stroke="#4c8a1f" stroke-width="2.6"/>' +
    '<rect x="42" y="14" width="10" height="62" rx="3" fill="#eef3e2" stroke="#4c8a1f" stroke-width="2.6"/>' +
    '<rect x="60" y="14" width="10" height="62" rx="3" fill="#eef3e2" stroke="#4c8a1f" stroke-width="2.6"/>' +
    '<rect x="78" y="14" width="10" height="62" rx="3" fill="#eef3e2" stroke="#4c8a1f" stroke-width="2.6"/>' +
    '<path d="M22 30 h68 M22 48 h68 M22 66 h68" stroke="#8a5a2b" stroke-width="2.4"/>' +
    '</svg>',
};

HANZI_EVO_FIGURES.FIG_IDS = Object.keys(HANZI_EVO_FIGURES);
HANZI_EVO_FIGURES.has = id => Object.prototype.hasOwnProperty.call(HANZI_EVO_FIGURES, id);
HANZI_EVO_FIGURES.figHTML = id => (HANZI_EVO_FIGURES.has(id)
  ? '<figure class="fig he-figure">' + HANZI_EVO_FIGURES[id] + '</figure>'
  : '');

if (typeof module !== 'undefined' && module.exports) module.exports = HANZI_EVO_FIGURES;
if (typeof window !== 'undefined') window.HanziEvoFigures = HANZI_EVO_FIGURES;
