/* 逐段观察现有字形；只切换观察重点，不生成缺失字形或推演中间形态。 */
(() => {
  'use strict';
  let dispose = () => {};
  function mount(root) {
    dispose();
    if (!root) return;
    const players = [...root.querySelectorAll('.evo-player')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canPlay = () => window.StudyEffects ? window.StudyEffects.motion === 'full' : !reduced.matches;
    let current = null, playing = false, timer = null, generation = 0, unwatch = null;
    const indexOf = player => Number(player.dataset.evoIndex || 0);
    const stages = player => [...player.querySelectorAll('[data-evo-stage]')];

    function controls(player) {
      const index = indexOf(player);
      const active = player === current && playing;
      const play = player.querySelector('[data-evo-action="play"]');
      play.disabled = !canPlay();
      play.textContent = active ? '暂停观察' : index === 3 ? '再看一遍' : '顺着看变化';
      play.setAttribute('aria-pressed', String(active));
      player.querySelector('[data-evo-action="previous"]').disabled = index === 0;
      player.querySelector('[data-evo-action="next"]').disabled = index === 3;
      player.querySelector('[data-evo-motion-note]').textContent = canPlay()
        ? '每段停留 4 秒，也可以点选字形慢慢看。' : '已减少连续运动，可以点字形或「下一段」逐段观察。';
    }
    function pause() {
      generation++; clearTimeout(timer); timer = null; playing = false;
      if (current) controls(current);
    }
    function activate(player) {
      if (current === player) return;
      pause(); unwatch?.(); current = player;
      if (window.StudyEffects) unwatch = window.StudyEffects.watch(player, pause);
      else if (typeof IntersectionObserver === 'function') {
        const observer = new IntersectionObserver(entries => { if (entries.some(e => !e.isIntersecting)) pause(); });
        observer.observe(player); unwatch = () => observer.disconnect();
      }
    }
    function select(index) {
      const cells = stages(current);
      index = Math.max(0, Math.min(cells.length - 1, index));
      current.dataset.evoIndex = String(index);
      cells.forEach((cell, i) => cell.setAttribute('aria-pressed', String(i === index)));
      const cell = cells[index];
      const name = cell.querySelector('.stage-name').textContent;
      const era = cell.querySelector('.stage-era').textContent;
      const note = cell.querySelector('.stage-note')?.textContent || cell.querySelector('.stage-none')?.textContent || '对照前面的字形，找一找笔画有哪些变化。';
      current.querySelector('[data-evo-status]').textContent = `第 ${index + 1}／${cells.length} 段 · ${name}${era === '—' ? '' : ' · ' + era}。${note}`;
      const strip = current.querySelector('.evo-strip');
      const box = cell.getBoundingClientRect(), viewport = strip.getBoundingClientRect();
      // 只移动字形条自身，不把整页或键盘焦点拉走。
      if (box.left < viewport.left) strip.scrollLeft -= viewport.left - box.left;
      else if (box.right > viewport.right) strip.scrollLeft += box.right - viewport.right;
      controls(current);
    }
    function schedule() {
      clearTimeout(timer);
      const token = ++generation;
      timer = setTimeout(() => {
        if (!playing || token !== generation || !current?.isConnected || !canPlay() || document.hidden) return;
        select(indexOf(current) + 1);
        if (indexOf(current) === 3) pause(); else schedule();
      }, 4000);
    }
    function click(event) {
      const button = event.target.closest('[data-evo-action], [data-evo-stage]');
      const player = button?.closest('.evo-player');
      if (!player || !root.contains(player)) return;
      activate(player);
      const action = button.dataset.evoAction;
      if (action === 'play') {
        if (playing) { pause(); return; }
        if (!canPlay() || document.hidden) return;
        select(indexOf(player) === 3 ? 0 : indexOf(player));
        playing = true; controls(player); schedule();
      } else {
        pause();
        select(action === 'previous' ? indexOf(player) - 1 : action === 'next' ? indexOf(player) + 1
          : action === 'reset' ? 0 : stages(player).indexOf(button));
      }
    }
    function preference() { if (!canPlay()) pause(); players.forEach(controls); }
    function visibility() { if (document.hidden) pause(); }
    players.forEach(player => {
      player.querySelector('.evo-controls').hidden = false;
      stages(player).forEach(button => { button.disabled = false; });
      controls(player);
    });
    root.addEventListener('click', click);
    document.addEventListener('study:effects-change', preference);
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', preference);
    window.addEventListener('pagehide', pause);
    dispose = () => {
      pause(); unwatch?.();
      root.removeEventListener('click', click);
      document.removeEventListener('study:effects-change', preference);
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', preference);
      window.removeEventListener('pagehide', pause);
    };
  }
  window.HanziEvolutionPlayer = {mount, dispose: () => dispose()};
})();
