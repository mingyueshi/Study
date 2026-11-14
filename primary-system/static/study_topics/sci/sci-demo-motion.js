/* 科学示意图的显式播放、单步观察与生命周期。 */
'use strict';
(() => {
  function particlePosition(kind, index, seconds) {
    const col = index % 3, row = Math.floor(index / 3), phase = index * 2.4;
    if (kind === 'ice') return {
      x: (col - 1) * 24 + 2 * Math.sin(seconds * 5 + phase),
      y: (row - 1) * 22 + 2 * Math.cos(seconds * 5 + phase),
    };
    if (kind === 'water') return {
      x: (col - 1) * 25 + 12 * Math.sin(seconds * .9 + phase),
      y: (row - 1) * 19 + 9 * Math.cos(seconds * .7 + phase),
    };
    return {x: 59 * Math.sin(seconds * 1.2 + phase), y: 42 * Math.cos(seconds * 1.5 + index * 1.7)};
  }
  if (typeof module !== 'undefined') module.exports = {particlePosition};
  if (typeof document === 'undefined') return;

  const records = new Map();
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null, frame = null, generation = 0, previous = null;
  const fullMotion = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const available = record => record.particles.length > 0 || record.tracks.length > 0;

  function sync(record) {
    const playing = record === active, enabled = available(record);
    const play = record.fig.querySelector('[data-sci-motion="play"]');
    play.textContent = playing ? '暂停观察' : '播放示意';
    play.setAttribute('aria-pressed', String(playing));
    play.disabled = !fullMotion() || !enabled;
    record.fig.querySelector('[data-sci-motion="step"]').disabled = !enabled;
    record.fig.querySelector('[data-sci-motion-status]').textContent = !enabled
      ? '电路未连通，没有电流路径。'
      : !fullMotion() ? '已减少动效，可点「前进一步」观察。' : playing ? '正在播放，可随时暂停观察。' : '已暂停，可播放或前进一步。';
  }

  function draw(record) {
    for (const group of record.particles) {
      group.nodes.forEach((node, index) => {
        const point = particlePosition(group.kind, index, record.seconds);
        node.setAttribute('cx', (group.cx + point.x).toFixed(2));
        node.setAttribute('cy', (72 + point.y).toFixed(2));
      });
    }
    for (const track of record.tracks) {
      track.nodes.forEach((node, index) => {
        const distance = (record.seconds * 65 + index * track.length / track.nodes.length) % track.length;
        const point = track.path.getPointAtLength(distance);
        node.setAttribute('cx', point.x.toFixed(2));
        node.setAttribute('cy', point.y.toFixed(2));
        node.setAttribute('visibility', 'visible');
      });
    }
  }

  function pause(fig) {
    if (!active || (fig && active.fig !== fig)) return;
    const record = active;
    active = null;
    generation++;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = previous = null;
    sync(record);
  }

  function play(record) {
    if (!fullMotion() || document.hidden || !available(record) || !record.fig.isConnected) return;
    pause();
    window.SciProcess?.pause();
    window.SciExperiments?.pause();
    active = record;
    sync(record);
    const token = ++generation;
    const tick = now => {
      if (token !== generation || active !== record) return;
      if (!record.fig.isConnected || document.hidden || !fullMotion()) { pause(); return; }
      if (previous !== null) record.seconds += Math.min((now - previous) / 1000, .1);
      previous = now;
      draw(record);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
  }

  function refresh(fig) {
    const record = records.get(fig);
    if (!record) return;
    pause(fig);
    record.seconds = 0;
    record.particles = Array.from(fig.querySelectorAll('[data-sci-particles]'), group => ({
      kind: group.dataset.sciParticles, cx: Number(group.dataset.cx), nodes: Array.from(group.querySelectorAll('circle')),
    }));
    record.tracks = Array.from(fig.querySelectorAll('[data-sci-flow]'), group => {
      const path = group.querySelector('path');
      return {path, length: path.getTotalLength(), nodes: Array.from(group.querySelectorAll('circle'))};
    }).filter(track => track.length > 0);
    draw(record);
    sync(record);
  }

  function mount(fig) {
    if (records.has(fig) || !fig.querySelector('.sci-motion-controls')) return;
    const record = {fig, seconds: 0, particles: [], tracks: [], unwatch: null};
    records.set(fig, record);
    if (window.StudyEffects?.watch) record.unwatch = window.StudyEffects.watch(fig, () => pause(fig));
    else if (typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) pause(fig); });
      observer.observe(fig);
      record.unwatch = () => observer.disconnect();
    }
    refresh(fig);
    fig.querySelector('.sci-motion-controls').hidden = false;
  }

  function dispose() {
    pause();
    records.forEach(record => record.unwatch?.());
    records.clear();
  }
  function prune() {
    for (const [fig, record] of records) if (!fig.isConnected) {
      pause(fig);
      record.unwatch?.();
      records.delete(fig);
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-sci-motion]');
    if (!button || button.disabled) return;
    const record = records.get(button.closest('.fig'));
    if (!record) return;
    if (button.dataset.sciMotion === 'play') {
      if (active === record) pause(); else play(record);
    } else {
      pause();
      record.seconds = button.dataset.sciMotion === 'reset' ? 0 : record.seconds + .25;
      draw(record);
      sync(record);
    }
  });
  const preferencesChanged = () => { if (!fullMotion()) pause(); records.forEach(sync); };
  document.addEventListener('study:effects-change', preferencesChanged);
  media.addEventListener('change', preferencesChanged);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => pause());
  window.SciDemoMotion = {mount, refresh, pause, dispose, prune};
})();
