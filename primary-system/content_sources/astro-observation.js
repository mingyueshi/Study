/* 月相联动与日月食分步观察。内容在 astro-observation-data.js。 */
'use strict';
(() => {
  const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
  function moonGeometry(value) {
    const phase = clamp(value), angle = phase * Math.PI * 2;
    return {phase, x: 240 - 88 * Math.cos(angle), y: 140 + 88 * Math.sin(angle),
      lit: (1 - Math.cos(angle)) / 2, waxing: phase <= .5,
      index: Math.round(phase * 8) % 8};
  }
  function moonPath(value, radius = 66) {
    const phase = clamp(value), cosine = Math.cos(phase * Math.PI * 2);
    if (phase === 0 || phase === 1) return '';
    return `M0 ${-radius}A${radius} ${radius} 0 0 1 0 ${radius}` +
      `A${(Math.abs(cosine) * radius).toFixed(4)} ${radius} 0 0 ${cosine < 0 ? 1 : 0} 0 ${-radius}Z`;
  }
  const eclipseStage = value => Math.min(3, Math.floor(clamp(value) * 3 + 1e-7));
  function nextStep(value, divisions, direction) {
    const scaled = clamp(value) * divisions;
    return clamp((direction > 0 ? Math.floor(scaled + 1e-7) + 1 : Math.ceil(scaled - 1e-7) - 1) / divisions);
  }
  if (typeof module !== 'undefined') module.exports = {moonGeometry, moonPath, eclipseStage, nextStep};
  if (typeof document === 'undefined') return;
  const data = typeof ASTRO_OBSERVATION === 'undefined' ? null : ASTRO_OBSERVATION;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const records = new Map();
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null, frame = null, generation = 0, previous = null, serial = 0;
  const canPlay = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const write = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  const button = (action, label, value = '') => `<button type="button" class="fig-btn" data-observe="${action}" data-value="${value}">${esc(label)}</button>`;
  const source = index => `<details class="astro-observe-source"><summary>资料出处（需联网）</summary><a href="${esc(data.sources[index].url)}" target="_blank" rel="noopener noreferrer">${esc(data.sources[index].title)}</a></details>`;
  const controls = kind => '<div class="astro-observe-controls"><div class="fig-ctrl">' +
    '<button type="button" class="fig-btn" data-observe="play" aria-pressed="false" hidden>播放变化</button>' +
    button('previous', kind === 'moon' ? '上一月相' : '上一步') + button('next', kind === 'moon' ? '下一月相' : '下一步') +
    button('reset', kind === 'moon' ? '回到新月' : '回到开始') + '</div>' +
    '<p data-observe-status role="status"></p></div>';
  function html(kind) {
    if (!data) return null;
    let body;
    if (kind === 'moon') {
      body = '<div class="astro-observe-stage" tabindex="0" role="region" aria-label="月球位置与月相联动示意，可横向滚动">' +
        '<svg class="fig-svg astro-observe-moon" viewBox="0 0 640 270" role="img" aria-label="左侧是太阳方向、地球和月球位置，右侧是从地球看到的月面">' +
        '<rect x="380" y="20" width="244" height="230" rx="18" fill="#f0edfa"/>' +
        '<text x="240" y="26" text-anchor="middle">从北极上方看</text><text x="502" y="49" text-anchor="middle">从地球看月亮</text>' +
        '<circle cx="47" cy="140" r="28" fill="#f6b93b"/><text x="47" y="190" text-anchor="middle">太阳</text>' +
        '<path d="M84 99h45m-8-5 8 5-8 5M84 140h45m-8-5 8 5-8 5M84 181h45m-8-5 8 5-8 5" fill="none" stroke="#c58a24" stroke-width="2"/>' +
        '<circle cx="240" cy="140" r="88" fill="none" stroke="#b7b0d4" stroke-width="1.5" stroke-dasharray="4 5"/>' +
        '<line data-moon-sight x1="240" y1="140" x2="152" y2="140" stroke="#8477b3" stroke-dasharray="3 4"/>' +
        '<circle cx="240" cy="140" r="23" fill="#3d7fd9"/><path d="M240 117A23 23 0 0 1 240 163Z" fill="#243559"/>' +
        '<text x="240" y="181" text-anchor="middle">地球</text>' +
        '<g data-moon-orbit><circle r="13" fill="#424660"/><path d="M0 -13A13 13 0 0 0 0 13Z" fill="#f7e9b0"/><text y="29" text-anchor="middle" style="font-size:12px">月球</text></g>' +
        '<circle cx="502" cy="140" r="66" fill="#3b405e"/><g transform="translate(502 140)"><path data-moon-face fill="#f7e9b0"/></g>' +
        '<text x="502" y="233" text-anchor="middle" data-moon-name></text></svg></div>' +
        '<div class="astro-observe-readout"><span data-moon-time></span><span data-moon-percent></span></div>' +
        '<label class="astro-observe-range">拖动查看一轮月相<input type="range" min="0" max="1000" step="1" value="0" data-observe-range aria-label="一轮月相的进度"></label>' +
        '<div class="fig-ctrl astro-observe-choices">' + data.phases.map((p, i) => button('phase', p.label, i)).join('') + '</div>' +
        '<p class="astro-observe-note" data-observe-note role="status"></p>' + controls(kind) +
        `<p class="astro-observe-cause">${esc(data.moonCause)}</p><p class="astro-observe-model">${esc(data.moonModel)}</p>` + source(0);
    } else {
      body = '<div class="fig-ctrl">' + data.eclipses.map(e => button('mode', e.label, e.key)).join('') + '</div>' +
        '<p class="astro-observe-order" data-eclipse-order></p>' +
        '<div class="astro-observe-stage" tabindex="0" role="region" aria-label="日月食排列与影子示意，可横向滚动"><svg class="fig-svg" viewBox="0 0 640 245" role="img" aria-label="太阳、地球和月球的位置示意"><g data-eclipse-scene></g></svg></div>' +
        '<div class="fig-ctrl astro-observe-choices" data-eclipse-steps></div>' +
        '<p class="astro-observe-note" data-observe-note role="status"></p>' + controls(kind) +
        `<p class="astro-observe-cause">${esc(data.eclipseCondition)}</p><p class="astro-observe-model">${esc(data.eclipseModel)}</p><p class="astro-observe-model">${esc(data.solarSafety)}</p>` + source(1);
    }
    return `<section class="astro-observation" data-observation="${kind}"><p class="astro-observe-scroll">↔ 图示可左右滑动查看，也可以聚焦图示后按左右键。</p>${body}</section>`;
  }
  function eclipseScene(record) {
    const solar = record.mode === 'solar', earthX = solar ? 520 : 330, moonX = solar ? 330 : 520;
    const clip = `eclipse-target-${++serial}`;
    const shadow = solar ? 'M330 124L580 140L330 156Z' : 'M330 110L600 112L600 168L330 170Z';
    record.root.querySelector('[data-eclipse-scene]').innerHTML =
      `<defs><clipPath id="${clip}"><circle cx="${solar ? earthX : moonX}" cy="140" r="${solar ? 30 : 16}"/></clipPath></defs>` +
      '<path d="M120 140H584" stroke="#b5adc9" stroke-width="1.5" stroke-dasharray="4 5"/>' +
      '<circle cx="80" cy="140" r="32" fill="#f6b93b"/><text x="80" y="197" text-anchor="middle">太阳</text>' +
      `<path data-eclipse-shadow d="${shadow}" fill="#57516d" opacity=".24"/>` +
      `<circle cx="${earthX}" cy="140" r="30" fill="#3d7fd9"/><path d="M${earthX} 110A30 30 0 0 1 ${earthX} 170Z" fill="#243559"/>` +
      `<text x="${earthX}" y="195" text-anchor="middle">地球</text>` +
      `<g data-eclipse-moon><circle cx="${moonX}" cy="140" r="16" fill="#d9dbe6" stroke="#777b92" stroke-width="1.5"/><text x="${moonX}" y="172" text-anchor="middle">月球</text></g>` +
      `<path data-eclipse-shadow d="${shadow}" fill="#282638" opacity=".72" clip-path="url(#${clip})"/>`;
    const item = data.eclipses.find(e => e.key === record.mode);
    record.root.querySelector('[data-eclipse-order]').textContent = item.order;
    record.root.querySelector('[data-eclipse-steps]').innerHTML = item.steps.map((step, i) => button('step', `${i + 1} · ${step.label}`, i)).join('');
    record.lastStage = -1;
  }
  function draw(record) {
    const root = record.root, value = record.progress;
    if (record.kind === 'moon') {
      const model = moonGeometry(value), phase = data.phases[model.index];
      root.querySelector('[data-moon-orbit]').setAttribute('transform', `translate(${model.x.toFixed(3)} ${model.y.toFixed(3)})`);
      const sight = root.querySelector('[data-moon-sight]');
      sight.setAttribute('x2', model.x); sight.setAttribute('y2', model.y);
      const face = root.querySelector('[data-moon-face]');
      face.setAttribute('d', moonPath(value)); face.setAttribute('transform', model.waxing ? '' : 'scale(-1 1)');
      const near = Math.abs(value * 8 - Math.round(value * 8)) > .04;
      const name = phase.label + (near ? '附近' : '');
      write(root.querySelector('[data-moon-name]'), name);
      write(root.querySelector('[data-moon-time]'), `从新月起约 ${(value * data.cycleDays).toFixed(1)} 天`);
      write(root.querySelector('[data-moon-percent]'), `看到的亮面约 ${Math.round(model.lit * 100)}%`);
      write(root.querySelector('[data-observe-note]'), `${name}：${phase.note}${near ? '' : `（${phase.cal}）`}`);
      const range = root.querySelector('[data-observe-range]');
      range.value = String(Math.round(value * 1000));
      range.setAttribute('aria-valuetext', `${name}，从新月起约 ${(value * data.cycleDays).toFixed(1)} 天，亮面约 ${Math.round(model.lit * 100)}%`);
      root.querySelectorAll('[data-observe="phase"]').forEach(b => pressed(b, Number(b.dataset.value) === model.index));
    } else {
      const stage = eclipseStage(value);
      if (stage !== record.lastStage) {
        record.lastStage = stage;
        root.querySelector('[data-eclipse-moon]').style.transform = `translateY(${stage === 0 ? -62 : stage === 3 ? 62 : 0}px)`;
        root.querySelectorAll('[data-eclipse-shadow]').forEach(node => node.style.visibility = stage === 2 ? 'visible' : 'hidden');
        const step = data.eclipses.find(e => e.key === record.mode).steps[stage];
        write(root.querySelector('[data-observe-note]'), `${stage + 1} / 4 · ${step.label}：${step.note}`);
        root.querySelectorAll('[data-observe="step"]').forEach(b => pressed(b, Number(b.dataset.value) === stage));
      }
      root.querySelectorAll('[data-observe="mode"]').forEach(b => pressed(b, b.dataset.value === record.mode));
    }
    root.querySelector('[data-observe="previous"]').disabled = value <= 0;
    root.querySelector('[data-observe="next"]').disabled = value >= 1;
  }
  function pressed(button, on) {
    button.classList.toggle('fig-on', on); button.setAttribute('aria-pressed', String(on));
  }
  function sync(record) {
    const playing = active === record, button = record.root.querySelector('[data-observe="play"]');
    button.hidden = false;
    button.disabled = !canPlay();
    button.textContent = playing ? '暂停观察' : record.progress >= 1 ? '再看一轮' : '播放变化';
    button.setAttribute('aria-pressed', String(playing));
    write(record.root.querySelector('[data-observe-status]'), !canPlay() ? (record.kind === 'moon' ? '已减少动效，可用按钮或滑块手动观察。' : '已减少动效，可用步骤按钮手动观察。') : playing ? '正在演示，可随时暂停。' : record.progress >= 1 ? '本轮结束，可回看或再看一轮。' : '已暂停，点选或播放来观察变化。');
  }
  function pause() {
    if (!active) return;
    const record = active; active = null; generation++;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = previous = null; sync(record);
  }
  function seek(record, value) { pause(); record.progress = clamp(value); draw(record); sync(record); }
  function play(record) {
    if (!canPlay() || document.hidden || !record.fig.isConnected) return;
    pause();
    if (record.progress >= 1) record.progress = 0;
    active = record; sync(record); draw(record);
    const token = ++generation, duration = record.kind === 'moon' ? 24000 : 9000;
    const tick = now => {
      if (token !== generation || active !== record) return;
      if (!record.fig.isConnected || document.hidden || !canPlay()) { pause(); return; }
      if (previous !== null) record.progress = Math.min(1, record.progress + Math.min(now - previous, 100) / duration);
      previous = now; draw(record);
      if (record.progress >= 1) { pause(); return; }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
  }
  function mount(fig) {
    const root = fig.querySelector('.astro-observation');
    if (!root || records.has(fig)) return;
    const record = {fig, root, kind: root.dataset.observation, mode: 'solar', progress: 0, unwatch: null};
    record.click = event => {
      const button = event.target.closest('[data-observe]');
      if (!button || button.disabled) return;
      const action = button.dataset.observe;
      if (action === 'play') { if (active === record) pause(); else play(record); }
      else if (action === 'mode') { pause(); record.mode = button.dataset.value; eclipseScene(record); seek(record, 0); }
      else if (action === 'phase') seek(record, Number(button.dataset.value) / 8);
      else if (action === 'step') seek(record, Number(button.dataset.value) / 3);
      else if (action === 'reset') seek(record, 0);
      else {
        const direction = action === 'next' ? 1 : -1;
        seek(record, record.kind === 'moon' ? nextStep(record.progress, 8, direction) : (eclipseStage(record.progress) + direction) / 3);
      }
    };
    record.input = event => { if (event.target.matches('[data-observe-range]')) seek(record, Number(event.target.value) / 1000); };
    root.addEventListener('click', record.click); root.addEventListener('input', record.input);
    const offscreen = () => { if (active === record) pause(); };
    if (window.StudyEffects?.watch) record.unwatch = window.StudyEffects.watch(fig, offscreen);
    else if (typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(entries => { if (entries.some(e => !e.isIntersecting)) offscreen(); });
      observer.observe(fig); record.unwatch = () => observer.disconnect();
    }
    records.set(fig, record);
    if (record.kind === 'eclipse') eclipseScene(record);
    draw(record); sync(record);
  }
  function remove(record) {
    if (active === record) pause();
    record.unwatch?.();
    record.root.removeEventListener('click', record.click); record.root.removeEventListener('input', record.input);
    records.delete(record.fig);
  }
  function dispose() { [...records.values()].forEach(remove); }
  function prune() { [...records.values()].forEach(record => { if (!record.fig.isConnected) remove(record); }); }
  const preference = () => { if (!canPlay()) pause(); records.forEach(sync); };
  document.addEventListener('study:effects-change', preference); media.addEventListener('change', preference);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  window.AstroObservation = {html, mount, dispose, prune};
})();
