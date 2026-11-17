/* 可单独验证的模型，渲染与正文均不在这里。 */
(function (root) {
  'use strict';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  function layerRadii(radiusKm, layers, enlarged = false) {
    return layers.map(layer => ({id:layer.id, outer:(radiusKm-layer.top)/radiusKm, inner:(radiusKm-layer.bottom)/radiusKm}))
      .map((layer, i, all) => enlarged && i < 2
        ? {...layer, ...(i === 0 ? {inner:.93} : {outer:.93})} : layer);
  }
  function arrivals(distanceKm, depthKm = 20) {
    const pathKm = Math.hypot(clamp(distanceKm, 0, 1000), clamp(depthKm, 0, 700));
    return {pathKm, p:pathKm / 6, s:pathKm / 3.5};
  }
  function decay(halfLives, halfLifeMa = 4470) {
    const n = clamp(halfLives, 0, 4), parent = 2 ** -n;
    return {halfLives:n, parent, daughter:1-parent, ma:n * halfLifeMa};
  }
  function earthDay(ma, ageMa = 4540) { return (1 - clamp(ma, 0, ageMa) / ageMa) * 86400; }
  function clock(seconds) {
    const tenths = Math.round(clamp(seconds, 0, 86400) * 10);
    const h = Math.floor(tenths / 36000), m = Math.floor(tenths / 600) % 60, s = (tenths % 600) / 10;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${s.toFixed(1).padStart(4,'0')}`;
  }
  function rockOptions(paths, id) { return paths.filter(edge => edge.from === id); }
  const model = {clamp, layerRadii, arrivals, decay, earthDay, clock, rockOptions};
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.EarthModel = model;
})(typeof window === 'undefined' ? globalThis : window);
