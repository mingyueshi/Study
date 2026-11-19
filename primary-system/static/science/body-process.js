/* 人体过程演示：所有画面由同一进度驱动，暂停时保留位置。 */
(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  function frameAt(phases, milliseconds) {
    const total = phases.reduce((sum, phase) => sum + phase.duration, 0);
    const time = Math.max(0, Math.min(total, Number.isFinite(milliseconds) ? milliseconds : 0));
    let start = 0;
    for (let index = 0; index < phases.length; index++) {
      const phase = phases[index];
      if (time < start + phase.duration || index === phases.length - 1) return {index, phase, fraction:clamp((time - start) / phase.duration), start, total};
      start += phase.duration;
    }
  }
  function createPlayer({duration, render, changed = () => {}, allowed = () => true, request, cancel}) {
    let time = 0, playing = false, speed = 1, frame = null, previous = null, generation = 0;
    const state = () => ({time, playing, speed, duration});
    function pause() {
      generation++;
      if (frame !== null) cancel(frame);
      frame = previous = null;
      playing = false;
      changed(state());
    }
    function seek(value) {
      pause();
      time = Math.max(0, Math.min(duration, Number.isFinite(value) ? value : 0));
      render(state()); changed(state());
    }
    function play() {
      if (playing || !allowed()) return;
      if (time >= duration) time = 0;
      playing = true;
      previous = null;
      const token = ++generation;
      render(state()); changed(state());
      const tick = now => {
        if (token !== generation || !playing) return;
        if (!allowed()) { pause(); return; }
        if (previous !== null) time = Math.min(duration, time + Math.max(0, Math.min(now - previous, 100)) * speed);
        previous = now;
        render(state());
        if (time >= duration) { pause(); return; }
        frame = request(tick);
      };
      frame = request(tick);
    }
    return {state, play, pause, seek, setSpeed(value) { if ([.5, 1, 1.5].includes(value)) speed = value; changed(state()); }};
  }
  if (typeof module !== 'undefined') module.exports = {frameAt, createPlayer, smooth};
  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-body-process]');
  if (!root) return;
  const content = JSON.parse(document.getElementById('body-animation-data').textContent);
  const kind = root.dataset.bodyProcess;
  const settings = root.closest('.experiment-workspace')?.querySelector('[data-breath-observation]') || root;
  const $ = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fullMotion = () => !media.matches && (!window.StudyEffects || window.StudyEffects.motion === 'full');
  const playButton = $('[data-process-play]');
  const progress = $('[data-process-progress]');
  const explanation = $('[data-process-explanation]');
  const speed = settings.querySelector('[data-process-speed]');
  const phaseList = settings.querySelector('[data-process-phases]');
  const arm = $('[data-arm-angle]');
  const paths = new Map();
  const dots = new Map();
  let mode, player, lastPhase = -1;
  all('[data-motion-path], [data-circuit-track]').forEach(path => paths.set(path.dataset.motionPath || path.dataset.circuitTrack, {path, length:path.getTotalLength()}));
  const attr = (node, name, value) => { if (node) node.setAttribute(name, String(value)); };
  function point(key, t) {
    const track = paths.get(key);
    return track.path.getPointAtLength(track.length * clamp(t));
  }
  function particles(key, t, count, color, radius = 6, spread = true) {
    if (!dots.has(key)) {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.dataset.processParticles = key;
      group.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < count; i++) {
        const node = document.createElementNS(group.namespaceURI, 'circle');
        attr(node, 'r', radius); attr(node, 'fill', color); attr(node, 'stroke', '#fffdf2'); attr(node, 'stroke-width', 2);
        group.append(node);
      }
      paths.get(key).path.ownerSVGElement.append(group);
      dots.set(key, group);
    }
    const group = dots.get(key);
    attr(group, 'visibility', 'visible');
    [...group.children].forEach((node, i) => {
      const at = spread ? ((t + i / count) % 1 + 1) % 1 : clamp(t);
      const p = point(key, at);
      attr(node, 'cx', p.x); attr(node, 'cy', p.y);
    });
  }
  function armShape(value) {
    const radians = value * Math.PI / 180;
    const x = 227 + 8 * Math.cos(radians) + 30 * Math.sin(radians);
    const y = 270 - 8 * Math.sin(radians) + 30 * Math.cos(radians);
    const width = 16 + value / 8;
    const middle = (112 + y - 20) / 2;
    attr($('.body-forearm'), 'transform', `rotate(${-value} 227 270)`);
    attr($('.body-biceps'), 'd', `M247 112Q${247 + width} ${middle} ${x} ${y - 20}Q${247 - width} ${middle} 247 112Z`);
    attr($('.body-biceps-tendon'), 'd', `M${x} ${y - 20}L${x} ${y}`);
    attr($('.body-triceps'), 'd', `M207 105Q${160 + value / 6} 175 202 256Q${229 - value / 10} 191 207 105Z`);
    attr($('.body-tendon-leader'), 'd', `M88 359H162L${x} ${y - 8}`);
    arm.value = value;
    arm.setAttribute('aria-valuetext', `${Math.round(value / 110 * 100)}％`);
  }
  function draw(frame) {
    const {phase, fraction: t, index} = frame;
    const id = phase.id;
    const eased = smooth(t);
    dots.forEach(group => attr(group, 'visibility', 'hidden'));
    root.dataset.state = kind === 'senses' ? mode.id : id;
    root.dataset.phase = id;
    if (kind === 'breathing') {
      const volume = id === 'inhale' ? eased : id === 'exhale' ? 1 - eased : 1;
      $('.body-breath-lungs').style.transform = `scale(${.87 + .18 * volume}, ${.84 + .23 * volume})`;
      attr($('.body-diaphragm'), 'd', `M128 ${323 + 22 * volume}Q236 ${220 + 97 * volume} 344 ${323 + 22 * volume}`);
      if (id !== 'exchange') {
        const travel = id === 'inhale' ? t : -t;
        particles('air-left', travel, 3, '#267969'); particles('air-right', travel, 3, '#267969');
      }
      // Gas exchange continues throughout breathing; the middle step only shifts attention.
      const gasTime = frame.start / 5000 + t;
      particles('oxygen', gasTime, 2, '#b34845'); particles('carbon', gasTime, 2, '#327b9e');
      $('.body-gas-inset').classList.toggle('body-process-focus', id === 'exchange');
    } else if (kind === 'digestion') {
      const p = point(`food-${id}`, t);
      attr($('.body-food-dot'), 'transform', `translate(${p.x} ${p.y})`);
      const shrink = id === 'mouth' ? 1 - .35 * t : id === 'esophagus' ? .65 : id === 'stomach' ? .65 - .3 * t : .35;
      attr($('[data-food-core]'), 'r', 10 * shrink);
      attr($('[data-food-core]'), 'fill', index >= 4 ? '#967047' : '#e8b132');
      attr($('[data-food-pieces]'), 'opacity', id === 'mouth' ? t : 1);
      attr($('[data-food-pieces]'), 'fill', index >= 4 ? '#967047' : '#e8b132');
      attr($('[data-food-push]'), 'visibility', id === 'esophagus' ? 'visible' : 'hidden');
      if (id === 'esophagus') { const push = point('food-esophagus', Math.max(0, t - .1)); attr($('[data-food-push]'), 'cx', push.x); attr($('[data-food-push]'), 'cy', push.y); }
      if (id === 'intestine') particles('nutrients', t * 2, 4, '#559a5b', 5);
      if (id === 'colon') particles('water', t * 2, 3, '#378ba4', 5);
    } else if (kind === 'circulation' && mode.id === 'pump') {
      const contraction = id === 'pump' ? Math.sin(Math.PI * t) : 0;
      $('.body-heart-ventricles').style.transform = `scale(${1 - .12 * contraction})`;
      $('.body-heart-atria').style.transform = `scale(${1 - (id === 'fill' ? .06 * Math.sin(Math.PI * t) : 0)})`;
      attr($('[data-heart-valves]'), 'd', id === 'pump' ? 'M250 199H282M360 199H392' : 'M250 199L257 214M282 199L275 214M360 199L367 214M392 199L385 214');
      particles(`cycle-${id}-blue`, t, 2, '#2d719b', 6); particles(`cycle-${id}-red`, t, 2, '#b84d48', 6);
    } else if (kind === 'circulation') {
      const p = point(id, t);
      attr($('[data-circuit-token]'), 'transform', `translate(${p.x} ${p.y})`);
      const oxygen = id === 'oxygenate' ? t : id === 'deliver' ? 1 - t : index >= 4 ? 1 : 0;
      const blue = [54,125,162], red = [185,80,77];
      attr($('[data-circuit-token] circle'), 'fill', `rgb(${blue.map((v, i) => Math.round(v + (red[i] - v) * oxygen)).join(',')})`);
      all('[data-circuit-track]').forEach(path => { path.style.opacity = path.dataset.circuitTrack === id ? '1' : '.28'; path.style.strokeWidth = path.dataset.circuitTrack === id ? '11' : '7'; });
    } else if (kind === 'movement') {
      armShape(110 * (id === 'bend' ? eased : 1 - eased));
    } else if (kind === 'nerves') {
      attr($('[data-hand-fingers]'), 'transform', `rotate(${id === 'respond' ? -12 * eased : 0} 485 282)`);
      attr($('[data-brain-halo]'), 'opacity', id === 'process' ? .25 + .65 * Math.sin(Math.PI * t) : 0);
      if (id !== 'process') particles(id === 'sense' ? 'nerve-in' : 'nerve-out', t, 1, id === 'sense' ? '#c28a27' : '#327e9d', 9, false);
    } else if (kind === 'senses') {
      attr($('[data-ear-drum]'), 'transform', `translate(${id === 'vibrate' ? 3 * Math.sin(t * Math.PI * 16) : 0} 0)`);
      if (id === 'light') { particles('eye-light', t, 1, '#c79428', 7, false); particles('eye-light-lower', t, 1, '#c79428', 7, false); }
      if (id === 'vision') particles('eye-signal', t, 1, '#327e9d', 8, false);
      if (id === 'sound') particles('ear-sound', t, 2, '#c79428', 6);
      if (id === 'vibrate') particles('ear-vibrate', t, 1, '#c79428', 7, false);
      if (id === 'hearing') particles('ear-signal', t, 1, '#327e9d', 8, false);
      if (id === 'smell') {
        if (t < .45) particles('nose-air', t / .45, 1, '#c79428', 7, false);
        else particles('nose-signal', (t - .45) / .55, 1, '#327e9d', 8, false);
      }
      if (id === 'taste') particles('taste-signal', t, 1, '#327e9d', 8, false);
    }
  }
  function render(state) {
    const frame = frameAt(mode.phases, state.time);
    draw(frame);
    progress.value = Math.round(state.time / state.duration * 1000);
    progress.setAttribute('aria-valuetext', `第 ${frame.index + 1} 步，${frame.phase.label}，本步 ${Math.round(frame.fraction * 100)}％`);
    $('[data-process-position]').textContent = `${frame.index + 1}／${mode.phases.length} · ${frame.phase.label}`;
    $('[data-process-prev]').disabled = frame.index === 0;
    $('[data-process-next]').disabled = frame.index === mode.phases.length - 1;
    if (frame.index !== lastPhase) {
      lastPhase = frame.index;
      [...phaseList.children].forEach((button, index) => button.setAttribute('aria-pressed', String(index === frame.index)));
      $('[data-process-title]').textContent = frame.phase.title;
      $('[data-process-body]').textContent = frame.phase.body;
      $('[data-process-cue]').textContent = frame.phase.cue;
    }
  }
  function sync(state) {
    playButton.disabled = !fullMotion();
    playButton.textContent = state.playing ? '暂停观察' : state.time >= state.duration ? '再播放一遍' : state.time > 0 ? '继续播放' : '播放过程';
    playButton.setAttribute('aria-pressed', String(state.playing));
    explanation.setAttribute('aria-live', state.playing ? 'off' : 'polite');
    root.dataset.playing = String(state.playing);
    $('[data-process-status]').textContent = !fullMotion() ? '已减少动效，可以选步骤或拖动进度观察。' : state.playing ? '正在播放，随时可以暂停；演示速度不代表真实速度。' : state.time >= state.duration ? '本次过程看完了，可以从头再看。' : state.time > 0 ? '已暂停在这里，继续播放会接着走。' : '准备好了。按播放，或者先选一个步骤。';
  }
  function jump(index) {
    const start = mode.phases.slice(0, index).reduce((sum, phase) => sum + phase.duration, 0);
    player.seek(start + mode.phases[index].duration * .5);
  }
  function chooseMode(id) {
    player?.pause();
    mode = content.modes.find(item => item.id === id);
    root.dataset.processMode = id;
    lastPhase = -1;
    all('[data-process-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.processMode === id)));
    all('[data-process-view]').forEach(view => { view.hidden = view.dataset.processView !== id; });
    $('[data-process-caption]').textContent = mode.caption;
    phaseList.replaceChildren();
    mode.phases.forEach((phase, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.processPhase = phase.id;
      const number = document.createElement('span'); number.textContent = index + 1;
      button.append(number, document.createTextNode(phase.label));
      button.addEventListener('click', () => jump(index));
      phaseList.append(button);
    });
    player = createPlayer({duration:mode.phases.reduce((sum, phase) => sum + phase.duration, 0), render, changed:sync,
      allowed:() => fullMotion() && !document.hidden && root.isConnected,
      request:callback => window.requestAnimationFrame(callback), cancel:id => window.cancelAnimationFrame(id)});
    player.setSpeed(Number(speed.value));
    player.seek(0);
  }
  playButton.addEventListener('click', () => { if (player.state().playing) player.pause(); else player.play(); });
  $('[data-process-reset]').addEventListener('click', () => player.seek(0));
  $('[data-process-prev]').addEventListener('click', () => { const index = frameAt(mode.phases, player.state().time).index; if (index > 0) jump(index - 1); });
  $('[data-process-next]').addEventListener('click', () => { const index = frameAt(mode.phases, player.state().time).index; if (index < mode.phases.length - 1) jump(index + 1); });
  progress.addEventListener('input', () => player.seek(Number(progress.value) / 1000 * player.state().duration));
  speed.addEventListener('change', () => player.setSpeed(Number(speed.value)));
  arm?.addEventListener('input', () => {
    const volume = Number(arm.value) / 110;
    // Inverse of smoothstep keeps the manual angle slider aligned with the timeline.
    let low = 0, high = 1;
    for (let i = 0; i < 24; i++) { const mid = (low + high) / 2; if (smooth(mid) < volume) low = mid; else high = mid; }
    player.seek((low + high) / 2 * mode.phases[0].duration);
  });
  all('[data-process-mode]').forEach(button => button.addEventListener('click', () => chooseMode(button.dataset.processMode)));
  const preferencesChanged = () => { if (!fullMotion()) player.pause(); sync(player.state()); };
  media.addEventListener('change', preferencesChanged);
  document.addEventListener('study:effects-change', preferencesChanged);
  document.addEventListener('visibilitychange', () => { if (document.hidden) player.pause(); });
  window.addEventListener('pagehide', () => player.pause());
  chooseMode(content.modes[0].id);
  if (window.StudyEffects?.watch) window.StudyEffects.watch(root, () => player.pause());
  else if (typeof IntersectionObserver === 'function') new IntersectionObserver(entries => { if (entries.some(entry => !entry.isIntersecting)) player.pause(); }).observe(root);
  (settings === root ? $('[data-process-controls]') : settings).hidden = false;
  $('[data-process-player]').hidden = false;
})();
