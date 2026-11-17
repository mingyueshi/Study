/* 有限播放；后台、离屏和减少动态时暂停，不自动恢复。 */
(() => {
  'use strict';
  if (typeof window === 'undefined') return;
  window.EarthMotion = function mount(panel, draw) {
    const play = panel.querySelector('[data-play]'), range = panel.querySelector('[data-progress]');
    const status = panel.querySelector('[data-motion-status]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let value = 0, frame = null, previous = null, token = 0, playing = false;
    const allowed = () => !reduced.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
    function sync() {
      panel.dataset.playing = String(playing);
      range.value = String(Math.round(value * 100));
      play.textContent = playing ? '暂停观察' : value >= 1 ? '重新播放' : '播放示意';
      play.setAttribute('aria-pressed', String(playing));
      play.disabled = !allowed();
      status.textContent = !allowed() ? '已减少动态，可拖动进度或前进一格。' : playing ? '正在播放，8 秒后停止；可随时暂停。' : value >= 1 ? '本轮已结束，可重播或拖动比较。' : '已暂停，可播放、单步或拖动进度。';
    }
    function pause() {
      playing = false; token++;
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = previous = null;
      sync();
    }
    function set(next) { pause(); value = window.EarthModel.clamp(next, 0, 1); draw(value); sync(); }
    function start() {
      const rect = panel.getBoundingClientRect();
      if (!allowed() || document.hidden || !panel.isConnected || rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      pause(); if (value >= 1) value = 0;
      playing = true; sync(); const current = ++token;
      const tick = now => {
        if (current !== token || !playing) return;
        const rect = panel.getBoundingClientRect();
        if (document.hidden || !allowed() || !panel.isConnected || rect.bottom <= 0 || rect.top >= window.innerHeight) { pause(); return; }
        if (previous !== null) value = Math.min(1, value + Math.min(now - previous, 100) / 8000);
        previous = now; draw(value);
        if (value >= 1) { pause(); return; }
        sync(); frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }
    play.addEventListener('click', () => playing ? pause() : start());
    panel.querySelector('[data-step]').addEventListener('click', () => set(Math.min(1, (Math.floor(value * 10 + .00001) + 1) / 10)));
    panel.querySelector('[data-reset]').addEventListener('click', () => set(0));
    range.addEventListener('input', () => set(Number(range.value) / 100));
    const preferences = () => { if (!allowed()) pause(); sync(); };
    document.addEventListener('study:effects-change', preferences);
    reduced.addEventListener('change', preferences);
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    window.addEventListener('pagehide', pause);
    window.StudyEffects?.watch(panel, pause);
    set(0);
    return {set, pause, get value() { return value; }};
  };
})();
