/* 疆域专题与时间轴弹窗共用东亚底图和阶段轮廓。 */
window.TerritoryRender = (() => {
  'use strict';
  const {esc} = window.TLShared;
  const geo = window.TERRITORY_GEO;
  const fullView = {x: 0, y: 0, w: 1000, h: 830};
  const project = ([lng, lat]) => [(lng - 64) * fullView.w / 81, (64 - lat) * fullView.h / 56];
  const pathOf = (points, close = true) => points.map((point, i) =>
    `${i ? 'L' : 'M'}${project(point).map(n => n.toFixed(2)).join(' ')}`).join('') + (close ? 'Z' : '');
  const regionPath = id => geo.regions[id].rings.map(ring => pathOf(ring)).join('');
  const yearText = year => year < 0 ? `约前 ${-year} 年` : `约 ${year} 年`;
  function landHTML() {
    return `<g class="territory-land"><path d="${geo.land.map(ring => pathOf(ring)).join('')}" fill-rule="evenodd"/></g>`;
  }
  function riversHTML() {
    return `<g class="territory-rivers">${geo.rivers.flatMap(river => river.lines.map(line =>
      `<path d="${pathOf(line, false)}"><title>${esc(river.name)}</title></path>`)).join('')}</g>`;
  }
  return {fullView, project, pathOf, regionPath, yearText, landHTML, riversHTML};
})();
