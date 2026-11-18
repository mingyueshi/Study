/* 缩放坐标与教学模型。潮位为相对平均水面，时间单位为分钟。 */
(function () {
  'use strict';
  const lunarDay = 1490;
  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

  function tide(angle, minute) {
    const amplitude = 1.2 + 0.5 * Math.cos(angle * Math.PI / 90);
    const position = 4 * Math.PI * clamp(minute, 0, lunarDay) / lunarDay;
    return {height: amplitude * Math.cos(position), range: 2 * amplitude, rising: Math.sin(position) < 0};
  }

  function layerAt(layers, depth) {
    return layers.findLast(layer => layer.from <= depth) || layers[0];
  }

  function depthAt(points, distance) {
    const next = points.findIndex(([km]) => km >= distance);
    if (next === 0) return points[0][1];
    if (next === -1) return points.at(-1)[1];
    const [start, shallow] = points[next - 1];
    const [end, deep] = points[next];
    return shallow + (deep - shallow) * (distance - start) / (end - start);
  }

  function trace(points) {
    let length = 0;
    const segments = points.slice(1).map((end, i) => {
      const start = points[i];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const size = Math.hypot(dx, dy);
      const segment = {start, dx, dy, size, offset:length};
      length += size;
      return segment;
    });
    return {length, segments};
  }

  function positionAt(route, fraction) {
    const distance = route.length * clamp(fraction, 0, 1);
    const segment = route.segments.find(s => distance <= s.offset + s.size) || route.segments.at(-1);
    const part = (distance - segment.offset) / segment.size;
    return {
      x:segment.start[0] + part * segment.dx,
      y:segment.start[1] + part * segment.dy,
      angle:Math.atan2(segment.dy, segment.dx)
    };
  }

  function nearestOnRoute(route, x, y) {
    let nearest = {distance:Infinity, fraction:0};
    for (const s of route.segments) {
      const part = clamp(((x - s.start[0]) * s.dx + (y - s.start[1]) * s.dy) / s.size ** 2, 0, 1);
      const distance = Math.hypot(x - s.start[0] - part * s.dx, y - s.start[1] - part * s.dy);
      if (distance < nearest.distance) nearest = {distance, fraction:(s.offset + part * s.size) / route.length};
    }
    return nearest;
  }

  const model = {lunarDay, clamp, tide, layerAt, depthAt, trace, positionAt, nearestOnRoute};
  if (typeof module === 'object' && module.exports) module.exports = model;
  else window.OceanModel = model;
})();
