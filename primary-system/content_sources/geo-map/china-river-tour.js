/* 沿真实河道移动的镜头行程。停站与前进分开计时，保留源数据分段。 */
(() => {
  'use strict';
  const Flow = typeof module !== 'undefined' ? require('./china-river-flow.js') : window.GMRiverFlow;
  function buildRoute(paths, stops, directions) {
    let length = 0;
    const tracks = paths.map((path, i) => {
      const track = Flow.createTrack(path, directions[i]);
      const entry = { track, start: length };
      length += track.length;
      return entry;
    });
    const located = stops.map((stop, index) => {
      let best = Infinity, distance = 0;
      for (const { track, start } of tracks) {
        track.points.forEach((sample, i) => {
          const delta = Math.hypot((sample.point[0] - stop.anchor[0]) * Math.cos(stop.anchor[1] * Math.PI / 180), sample.point[1] - stop.anchor[1]);
          if (delta < best) { best = delta; distance = start + track.distances[i]; }
        });
      }
      if (index === 0) distance = 0;
      if (index === stops.length - 1) distance = length;
      return { ...stop, distance };
    });
    if (!length || located.some((stop, i) => i && stop.distance <= located[i - 1].distance)) throw new Error('漫游站点顺序与河道不符');
    return { tracks, stops: located, length };
  }
  function position(route, distance) {
    const target = Math.max(0, Math.min(route.length, distance));
    let part = route.tracks.length - 1;
    for (let i = 0; i < route.tracks.length; i++) {
      if (target < route.tracks[i].start + route.tracks[i].track.length) { part = i; break; }
    }
    const { track, start } = route.tracks[part];
    return { ...Flow.atDistance(track, target - start), part };
  }
  function createTour({ route, holdSeconds = 8, travelSeconds = 90, request, cancel, canPlay, moved, changed }) {
    let index = 0, distance = 0, phase = 'stop', remaining = holdSeconds, speed = 1;
    let playing = false, frame = null, previous = null, generation = 0, disposed = false, lastPaint = null;
    const snapshot = () => ({ index, distance, phase, remaining, speed, playing, progress: distance / route.length });
    const paint = () => moved(position(route, distance), snapshot());
    const clear = () => { generation++; if (frame !== null) cancel(frame); frame = previous = lastPaint = null; };
    const pause = () => { playing = false; clear(); changed(snapshot()); };
    const jump = target => {
      if (disposed) return;
      pause();
      index = Math.max(0, Math.min(route.stops.length - 1, target));
      distance = route.stops[index].distance;
      phase = index === route.stops.length - 1 ? 'complete' : 'stop';
      remaining = holdSeconds;
      paint(); changed(snapshot());
    };
    const play = () => {
      if (disposed || playing || !canPlay()) return;
      if (phase === 'complete') jump(0);
      playing = true;
      const token = ++generation;
      changed(snapshot());
      const tick = now => {
        if (disposed || token !== generation || !playing) return;
        frame = null;
        if (!canPlay()) { pause(); return; }
        const elapsed = previous === null ? 0 : Math.min(Math.max(0, (now - previous) / 1000), .1);
        previous = now;
        let phaseChanged = false;
        if (phase === 'stop') {
          remaining = Math.max(0, remaining - elapsed);
          if (remaining === 0) { phase = 'travel'; phaseChanged = true; }
        } else {
          const next = route.stops[index + 1].distance;
          distance = Math.min(next, distance + route.length / travelSeconds * speed * elapsed);
          if (distance === next) {
            index++; remaining = holdSeconds;
            phase = index === route.stops.length - 1 ? 'complete' : 'stop';
            phaseChanged = true;
            if (phase === 'complete') { playing = false; clear(); }
          }
        }
        // 镜头最多约 30 帧／秒，停站时也保留进度提示；不每帧重建网格。
        if (phaseChanged || lastPaint === null || now - lastPaint >= 32) { paint(); lastPaint = now; }
        if (phaseChanged) changed(snapshot());
        if (playing) frame = request(tick);
      };
      frame = request(tick);
    };
    return { snapshot, play, pause, jump,
      setSpeed(value) { speed = value === 2 ? 2 : 1; changed(snapshot()); },
      refresh() { if (!canPlay()) pause(); else changed(snapshot()); },
      dispose() { disposed = true; pause(); },
    };
  }
  const api = { buildRoute, position, createTour };
  if (typeof module !== 'undefined') module.exports = api;
  if (typeof window !== 'undefined') window.GMRiverTour = api;
})();
