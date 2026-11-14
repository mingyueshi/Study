/* 光路、水循环与生命世界：分段观察、有限播放及统一动效生命周期。 */
'use strict';
(() => {
  const bound = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  function lightGeometry(value, indices = {air: 1, water: 1.333}) {
    const angle = bound(value, 0, 75), radians = angle * Math.PI / 180;
    const refracted = Math.asin(indices.air / indices.water * Math.sin(radians));
    const origin = {x: 320, y: 190}, radius = 140;
    return {angle, reflected: angle, refracted: refracted * 180 / Math.PI, origin,
      source: {x: 320 - radius * Math.sin(radians), y: 190 - radius * Math.cos(radians)},
      mirror: {x: 320 + radius * Math.sin(radians), y: 190 - radius * Math.cos(radians)},
      water: {x: 320 + radius * Math.sin(refracted), y: 190 + radius * Math.cos(refracted)}};
  }
  const stageAt = (progress, count) => Math.min(count - 1, Math.max(0, Math.ceil(progress - 1e-8) - 1));
  const stepTo = (progress, count, direction) => bound(direction > 0 ? Math.floor(progress + 1e-8) + 1 : Math.ceil(progress - 1e-8) - 1, 0, count);
  function lifePaths(kind) {
    if (kind === 'photo') return ['M124 70Q197 70 251 133', 'M125 310H280Q305 310 305 285V205',
      'M145 175H238', 'M350 196Q389 240 434 265', 'M398 147Q438 147 466 128'];
    if (kind === 'foodchain') return Array.from({length:4}, (_, i) => `M${101 + i * 128} 160H${157 + i * 128}`);
    return [];
  }
  if (typeof module !== 'undefined') module.exports = {lightGeometry, stageAt, stepTo, lifePaths};
  if (typeof document === 'undefined') return;

  const data = typeof SCI_PROCESS === 'undefined' ? null : SCI_PROCESS;
  const records = new Map(), media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = null, frame = null, generation = 0, previous = null;
  const canPlay = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const write = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  const button = (action, label, value = '') => `<button type="button" class="fig-btn" data-process="${action}" data-value="${value}">${esc(label)}</button>`;
  const paths = definitions => definitions.map((d, index) => `<path d="${d}" class="sci-process-guide"/><path d="${d}" data-process-path="${index}" pathLength="1" stroke-dasharray="0 1"/><path data-process-arrow="${index}" d="M-6 -5 2 0-6 5" fill="none" stroke-width="3" visibility="hidden"/>`).join('');
  const marker = '<g data-process-marker aria-hidden="true"><circle r="8" fill="#fff" stroke="#b65013" stroke-width="3"/><path d="M-4 -4 3 0-4 4" fill="none" stroke="#b65013" stroke-width="2"/></g>';

  function lifeScene(kind) {
    const entry = data[kind], label = (x, y, value, css = '') => `<text x="${x}" y="${y}" text-anchor="middle" class="${css}">${esc(value)}</text>`;
    const node = (id, x, y, w, h, decoration = '') => {
      const item = entry.nodes.find(n => n.id === id);
      return `<g data-process-node="${id}"><rect class="sci-life-halo" x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="12"/>${decoration}` +
        label(x, y + h - 29, item.label) + label(x, y + h - 9, item.detail, 'sci-life-detail') + '</g>';
    };
    if (kind === 'foodchain') {
      const icons = ['🌾', '🦗', '🐸', '🐍', '🦅'];
      return '<rect x="8" y="8" width="624" height="334" rx="16" fill="#f4f9ee"/>' + label(320, 52, entry.heading) +
        entry.nodes.map((n, i) => node(n.id, 65 + i * 128, 112, 84, 147,
          `<circle cx="${65 + i * 128}" cy="160" r="34" fill="#fff" stroke="#84a77c" stroke-width="2"/>` +
          label(65 + i * 128, 172, icons[i], 'sci-life-icon'))).join('') +
        paths(lifePaths(kind)) + label(320, 314, entry.footer) + marker;
    }
    return '<rect x="8" y="8" width="624" height="334" rx="16" fill="#f1f9f2"/>' +
      '<rect x="8" y="288" width="365" height="54" rx="12" fill="#eee1c5"/>' +
      '<path d="M310 291V193M310 290l-30 34m30-34 30 34m-30-22v25" fill="none" stroke="#659552" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M235 185Q235 100 405 115Q404 225 235 185Z" fill="#cfe7a7" stroke="#63954f" stroke-width="2"/>' +
      node('sun', 95, 26, 112, 109, '<circle cx="95" cy="65" r="24" fill="#ffd36b"/>') +
      node('water', 101, 232, 150, 65) + node('carbon', 89, 137, 142, 65) +
      node('leaf', 324, 140, 104, 58) + node('sugar', 521, 230, 174, 78) + node('oxygen', 540, 90, 140, 65) +
      paths(lifePaths(kind)) + label(320, 31, entry.heading) + label(482, 335, entry.footer, 'sci-life-detail') + marker;
  }

  function html(kind) {
    if (!data || !data[kind]) return null;
    const section = data[kind];
    const life = kind === 'photo' || kind === 'foodchain';
    const title = section.title || (kind === 'light' ? '光路分段观察' : '水循环分步观察');
    const diagramLabel = section.diagramLabel || (kind === 'light' ? '入射光与出射光相对法线的方向，数值见图下说明' : '从海洋蒸发、在空中凝结、降水到陆地、沿地表流回海洋');
    const scene = kind === 'light' ? '<g data-light-scene></g>' : life ? lifeScene(kind) :
      '<rect x="8" y="8" width="624" height="326" rx="18" fill="#eef8fc"/>' +
      '<circle cx="67" cy="65" r="26" fill="#ffd36b"/><text x="67" y="111" text-anchor="middle">太阳供能</text>' +
      '<path d="M257 253 452 139 625 246V334H257Z" fill="#d9eac7"/>' +
      '<path d="m412 163 40-24 43 26-29-6-16-10-17 12Z" fill="#f8fbf6"/>' +
      '<path d="M8 253Q70 242 128 253T257 253V334H8Z" fill="#b7e1f3"/>' +
      '<path d="M30 272q20 9 40 0t40 0M60 293q20 9 40 0t40 0" fill="none" stroke="#76bedb" stroke-width="3"/>' +
      '<path d="M475 190C520 235 350 235 315 260S215 295 150 260" fill="none" stroke="#a6d5e6" stroke-width="14" stroke-linecap="round"/>' +
      '<g data-process-cloud><path d="M264 86C239 64 263 44 288 49C300 17 352 25 358 47C393 29 425 56 408 86Z" fill="#fff" stroke="#aabeca" stroke-width="2"/></g>' +
      paths(['M150 260C130 170 175 90 270 85', 'M270 85C290 45 365 45 406 89', 'M406 89C440 115 456 157 475 190', 'M475 190C520 235 350 235 315 260S215 295 150 260']) +
      '<text x="130" y="176" text-anchor="end">① 蒸发</text><text x="340" y="113" text-anchor="middle">② 凝结成云</text>' +
      '<text x="484" y="123">③ 降水</text><text x="397" y="291">④ 地表径流</text>' +
      '<text x="66" y="321">海洋</text><text x="553" y="254">陆地</text>' + marker;
    return `<section class="sci-process" data-sci-process="${kind}" aria-label="${esc(title)}">` +
      `<p class="sci-process-prompt">${esc(section.prompt)}</p>` +
      (kind === 'light' ? '<div class="fig-ctrl">' + section.modes.map(mode => button('mode', mode.label, mode.id)).join('') + '</div>' : '') +
      '<div class="fig-ctrl"><button type="button" class="fig-btn" data-process="play" aria-pressed="false" hidden>播放一轮</button>' +
      button('previous', '上一步') + button('next', '下一步') + button('reset', '回到开始') + '</div>' +
      `<div class="sci-demo-stage" tabindex="0" role="region" aria-label="${esc(title)}图示，可横向滚动"><svg class="fig-svg sci-process-svg" viewBox="0 0 640 ${kind === 'light' ? 360 : 350}" role="img" aria-label="${esc(diagramLabel)}">${scene}</svg></div>` +
      '<p class="sci-scroll-hint">左右滑动图示，看完整个观察场景。</p>' +
      (kind === 'light' ? `<label class="sci-process-angle">入射角 <output data-light-angle></output><input type="range" data-light-angle-input min="${section.angle.min}" max="${section.angle.max}" step="1" value="${section.angle.initial}" aria-label="入射角"></label><p class="sci-process-readout" data-light-readout></p><p class="sci-process-cause" data-light-cause></p>` : '') +
      '<div class="fig-ctrl sci-process-steps" data-process-steps></div>' +
      '<p class="sci-observation" data-process-note role="status"></p>' +
      '<progress data-process-progress aria-label="本轮演示进度"></progress>' +
      '<p class="sci-process-status" data-process-status role="status"></p>' +
      `<p class="sci-model-note">${esc(section.model)}</p>` +
      '<details class="sci-demo-sources"><summary>资料出处（需联网）</summary>' + section.sources.map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a>`).join(' · ') + '</details></section>';
  }

  function lightScene(record) {
    const model = lightGeometry(record.angle, data.light.indices), out = model[record.mode], origin = model.origin;
    const d = point => `${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
    const radians = (record.mode === 'mirror' ? model.reflected : model.refracted) * Math.PI / 180;
    const incoming = model.angle * Math.PI / 180, isWater = record.mode === 'water';
    record.root.querySelector('[data-light-scene]').innerHTML =
      `<rect x="48" y="190" width="544" height="156" rx="8" fill="${isWater ? '#e1f2fc' : '#edf0f4'}"/>` +
      '<line x1="48" y1="190" x2="592" y2="190" stroke="#8497a9" stroke-width="4"/>' +
      '<line x1="320" y1="40" x2="320" y2="340" stroke="#738398" stroke-width="1.5" stroke-dasharray="5 5"/>' +
      '<text x="335" y="32">法线</text><text x="530" y="62">空气</text>' +
      `<text x="530" y="218">${isWater ? '水' : '平面镜'}</text>` +
      '<text x="100" y="55" class="sci-light-in">入射光</text>' +
      `<text x="465" y="${isWater ? 324 : 55}" class="sci-light-out">${isWater ? '折射光' : '反射光'}</text>` +
      `<path d="M320 146A44 44 0 0 0 ${320 - 44 * Math.sin(incoming)} ${190 - 44 * Math.cos(incoming)}" class="sci-light-arc sci-light-in"/>` +
      `<path d="M320 ${isWater ? 234 : 146}A44 44 0 0 ${isWater ? 0 : 1} ${320 + 44 * Math.sin(radians)} ${190 + (isWater ? 1 : -1) * 44 * Math.cos(radians)}" class="sci-light-arc sci-light-out"/>` +
      paths([`M${d(model.source)}L${d(origin)}`, `M${d(origin)}L${d(out)}`]) + marker;
    write(record.root.querySelector('[data-light-angle]'), `${model.angle}°`);
    write(record.root.querySelector('[data-light-readout]'), `入射角 ${model.angle}° · ${isWater ? `折射角约 ${model.refracted.toFixed(1)}°` : `反射角 ${model.reflected}°`}`);
    const mode = data.light.modes.find(mode => mode.id === record.mode);
    write(record.root.querySelector('[data-light-cause]'), model.angle === 0 ? mode.straightNote : mode.note);
  }

  function rebuild(record) {
    record.steps = record.kind === 'light' ? data.light.modes.find(mode => mode.id === record.mode).steps : data[record.kind].steps;
    if (record.kind === 'light') lightScene(record);
    record.root.querySelector('[data-process-steps]').innerHTML = record.steps.map((step, index) => button('step', `${index + 1} · ${step.label}`, index + 1)).join('');
    record.tracks = Array.from(record.root.querySelectorAll('[data-process-path]'), (path, index) => {
      const length = path.getTotalLength(), midpoint = path.getPointAtLength(length / 2);
      const after = path.getPointAtLength(length / 2 + 1);
      const arrow = record.root.querySelector(`[data-process-arrow="${index}"]`);
      arrow.setAttribute('transform', `translate(${midpoint.x} ${midpoint.y}) rotate(${Math.atan2(after.y - midpoint.y, after.x - midpoint.x) * 180 / Math.PI})`);
      return {path, length, arrow};
    });
    record.root.querySelector('[data-process-progress]').max = record.steps.length;
    draw(record);
  }

  function draw(record) {
    const root = record.root, count = record.steps.length, index = stageAt(record.progress, count);
    record.tracks.forEach(({path, arrow}, i) => {
      const color = record.kind === 'light' ? (i ? '#246ba4' : '#b65013') : (i === index ? (record.kind === 'water' ? '#167963' : '#b65013') : '#438ca4');
      path.setAttribute('stroke-dasharray', `${bound(record.progress - i, 0, 1)} 1`);
      path.setAttribute('stroke', color); arrow.setAttribute('stroke', color);
      arrow.setAttribute('visibility', record.progress - i >= .5 ? 'visible' : 'hidden');
    });
    const track = record.tracks[index], distance = track.length * bound(record.progress - index, 0, 1);
    const point = track.path.getPointAtLength(distance);
    const before = track.path.getPointAtLength(Math.max(0, distance - 1));
    const after = track.path.getPointAtLength(Math.min(track.length, distance + 1));
    root.querySelector('[data-process-marker]').setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI})`);
    root.querySelectorAll('[data-process="step"]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.value) === index + 1)));
    root.querySelectorAll('[data-process="mode"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === record.mode)));
    if (record.kind === 'photo' || record.kind === 'foodchain') {
      const step = record.steps[index];
      root.querySelectorAll('[data-process-node]').forEach(node => node.setAttribute('data-active',
        String(record.progress > 0 && [step.from, step.to].includes(node.dataset.processNode))));
    }
    write(root.querySelector('[data-process-note]'), `${index + 1} / ${count} · ${record.steps[index].label}：${record.steps[index].note}`);
    root.querySelector('[data-process-progress]').value = record.progress;
    sync(record);
  }

  function sync(record) {
    const root = record.root, playing = active === record, done = record.progress >= record.steps.length;
    const play = root.querySelector('[data-process="play"]');
    write(play, playing ? '暂停观察' : done ? '再看一轮' : '播放一轮');
    play.setAttribute('aria-pressed', String(playing)); play.disabled = !canPlay();
    root.querySelector('[data-process="previous"]').disabled = record.progress <= 0;
    root.querySelector('[data-process="next"]').disabled = done;
    write(root.querySelector('[data-process-status]'), !canPlay() ? '已减少动效，可用步骤按钮慢慢观察。' :
      playing ? '正在分段播放，可随时暂停。' : done ? '这一轮观察完成，可以回看任意一步。' :
      record.progress > 0 ? '已暂停，继续播放或逐步查看。' : '准备好了，点「下一步」或「播放一轮」开始。');
  }

  function pause(fig) {
    if (!active || (fig && active.fig !== fig)) return;
    const record = active; active = null; generation++;
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = previous = null; sync(record);
  }
  function play(record) {
    if (!canPlay() || document.hidden || !record.fig.isConnected) return;
    pause(); window.SciDemoMotion?.pause(); window.SciExperiments?.pause(); window.GeoEarth?.pause();
    if (record.progress >= record.steps.length) record.progress = 0;
    active = record; draw(record);
    const token = ++generation;
    const tick = now => {
      if (token !== generation || active !== record) return;
      if (!record.fig.isConnected || document.hidden || !canPlay()) { pause(); return; }
      if (previous !== null) record.progress = Math.min(record.steps.length, record.progress + Math.max(0, Math.min(now - previous, 100)) / (record.kind === 'light' ? 1800 : 2600));
      previous = now; draw(record);
      if (record.progress >= record.steps.length) { pause(); return; }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
  }

  function mount(fig) {
    if (!data || records.has(fig)) return;
    const root = fig.querySelector('[data-sci-process]');
    if (!root) return;
    const record = {fig, root, kind: root.dataset.sciProcess, mode: 'mirror', angle: data.light.angle.initial, progress: 0};
    records.set(fig, record); rebuild(record);
    record.click = event => {
      const button = event.target.closest('[data-process]');
      if (!button || button.disabled) return;
      const action = button.dataset.process;
      if (action === 'play') { if (active === record) pause(); else play(record); return; }
      pause(fig);
      if (action === 'mode') { record.mode = button.dataset.value; record.progress = 0; rebuild(record); }
      else {
        record.progress = action === 'reset' ? 0 : action === 'step' ? bound(button.dataset.value, 0, record.steps.length) : stepTo(record.progress, record.steps.length, action === 'next' ? 1 : -1);
        draw(record);
      }
    };
    record.input = event => {
      if (!event.target.matches('[data-light-angle-input]')) return;
      pause(fig); record.angle = bound(event.target.value, data.light.angle.min, data.light.angle.max);
      record.progress = 0; rebuild(record);
    };
    root.addEventListener('click', record.click); root.addEventListener('input', record.input);
    if (window.StudyEffects?.watch) record.unwatch = window.StudyEffects.watch(fig, () => pause(fig));
    else if (typeof IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) pause(fig); });
      observer.observe(fig); record.unwatch = () => observer.disconnect();
    }
    root.querySelector('[data-process="play"]').hidden = false;
  }
  function remove(fig, record) {
    pause(fig); record.unwatch?.();
    record.root.removeEventListener('click', record.click); record.root.removeEventListener('input', record.input);
    records.delete(fig);
  }
  const dispose = () => { for (const [fig, record] of records) remove(fig, record); };
  const prune = () => { for (const [fig, record] of records) if (!fig.isConnected) remove(fig, record); };
  const preferencesChanged = () => { if (!canPlay()) pause(); records.forEach(sync); };
  document.addEventListener('study:effects-change', preferencesChanged);
  media.addEventListener('change', preferencesChanged);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', () => pause());
  window.SciProcess = {html, mount, pause, dispose, prune};
})();
