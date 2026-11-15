/* 沿贴地河道按弧长前进；每个源数据分段独立，不跨湖区缺口连线。 */
(() => {
  'use strict';
  function createTrack(samples, direction = 1) {
    const points = direction < 0 ? [...samples].reverse() : [...samples];
    const distances = new Float64Array(points.length);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1].point, b = points[i].point;
      const dx = (b[0] - a[0]) * Math.cos((a[1] + b[1]) * Math.PI / 360);
      distances[i] = distances[i - 1] + Math.hypot(dx, b[1] - a[1]) * 111.32;
    }
    return { points, distances, length: distances.at(-1) || 0 };
  }
  function atDistance(track, distance) {
    if (!track.points.length) return null;
    const target = Math.max(0, Math.min(track.length, distance));
    let low = 0, high = track.points.length - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (track.distances[mid] < target) low = mid + 1;
      else high = mid;
    }
    const end = low, start = Math.max(0, end - 1);
    const a = track.points[start], b = track.points[end];
    const span = track.distances[end] - track.distances[start];
    const t = span > 0 ? (target - track.distances[start]) / span : 0;
    return { point: a.point.map((value, i) => value + (b.point[i] - value) * t), meters: a.meters + (b.meters - a.meters) * t };
  }
  function createPlayback({ request, cancel, available, canAnimate, render, changed }) {
    let playing = false, seconds = 0, frame = null, previous = null, generation = 0, disposed = false;
    const pause = () => {
      playing = false; generation++;
      if (frame !== null) cancel(frame);
      frame = previous = null;
      changed();
    };
    const play = () => {
      if (disposed || playing || !available() || !canAnimate()) return;
      playing = true; previous = null;
      const token = ++generation;
      changed();
      const tick = now => {
        if (disposed || token !== generation || !playing) return;
        frame = null;
        if (!available() || !canAnimate()) { pause(); return; }
        if (previous !== null) seconds += Math.min(Math.max(0, (now - previous) / 1000), .1);
        previous = now;
        render(seconds);
        frame = request(tick);
      };
      frame = request(tick);
    };
    return {
      get playing() { return playing; }, get seconds() { return seconds; }, play, pause,
      step() { if (disposed || !available()) return; pause(); seconds += .5; render(seconds); },
      reset() { pause(); seconds = 0; if (!disposed) render(seconds); },
      refresh() { if (!available() || !canAnimate()) pause(); else changed(); },
      dispose() { disposed = true; pause(); },
    };
  }
  const api = { createTrack, atDistance, createPlayback };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GMRiverFlow = api;
})();
