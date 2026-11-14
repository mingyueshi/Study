/* 两张地图共用图层工具、地点定位、视图控制、档案关联与找一找。 */
window.GMMapUI = (() => {
  'use strict';
  const A = window.GMAtlas;
  const { esc } = window.GMShared;

  function zoomControls(svg, controls) {
    const base = svg.viewBox.baseVal;
    const width = base.width;
    const height = base.height;
    const steps = [1, 1.5, 2, 3, 4];
    let level = 0;
    let x = 0;
    let y = 0;
    let drag = null;
    let dragged = false;

    const button = (action, label, text) =>
      `<button type="button" data-view="${action}" aria-label="${label}">${text}</button>`;
    controls.innerHTML = button('in', '放大地图', '＋') + button('out', '缩小地图', '−') +
      button('reset', '恢复地图全景', '全景') +
      '<span class="gm-view-hint" hidden>拖动地图或按方向键移动</span>';

    function render() {
      const w = width / steps[level];
      const h = height / steps[level];
      x = Math.max(0, Math.min(x, width - w));
      y = Math.max(0, Math.min(y, height - h));
      svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
      svg.classList.toggle('gm-zoomed', level > 0);
      controls.querySelector('[data-view="in"]').disabled = level === steps.length - 1;
      controls.querySelector('[data-view="out"]').disabled = level === 0;
      controls.querySelector('.gm-view-hint').hidden = level === 0;
    }

    function reset() {
      level = 0;
      render();
    }

    controls.addEventListener('click', (e) => {
      const action = e.target.closest('[data-view]')?.dataset.view;
      if (!action) return;
      if (action === 'reset') { reset(); return; }
      const next = level + (action === 'in' ? 1 : -1);
      x += (width / steps[level] - width / steps[next]) / 2;
      y += (height / steps[level] - height / steps[next]) / 2;
      level = next;
      render();
      if (e.target.disabled) controls.querySelector('[data-view="reset"]').focus();
    });
    svg.addEventListener('pointerdown', (e) => {
      dragged = false;
      if (!level || !e.isPrimary || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, mapX: x, mapY: y };
    });
    svg.addEventListener('pointermove', (e) => {
      if (drag?.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!dragged && Math.hypot(dx, dy) < 5) return;
      if (!dragged) svg.setPointerCapture(e.pointerId);
      dragged = true;
      const ratio = width / steps[level] / svg.getBoundingClientRect().width;
      x = drag.mapX - dx * ratio;
      y = drag.mapY - dy * ratio;
      render();
    });
    for (const event of ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture']) {
      svg.addEventListener(event, (e) => {
        if (drag?.id === e.pointerId) drag = null;
      });
    }
    svg.addEventListener('click', (e) => {
      if (dragged && e.detail) e.stopImmediatePropagation();
    }, true);
    svg.addEventListener('keydown', (e) => {
      const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!level || !Array.isArray(delta)) return;
      e.preventDefault();
      x += delta[0] * width / steps[level] / 8;
      y += delta[1] * height / steps[level] / 8;
      render();
    });
    render();
    return reset;
  }

  function mount({ root, svg, map, layers, legends, pool, openCard, hintFor, onLayerChange }) {
    const $ = (id) => root.querySelector('#' + id);
    const card = $('gm-card');
    const filters = $('gm-filters');
    const picker = $('gm-map-place');
    const banner = $('gm-quiz');
    const start = $('gm-quiz-start');
    const statusBar = $('gm-status');
    const resetView = zoomControls(svg, $('gm-view-tools'));
    const places = A.places.filter(p => p.map === map).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    const targets = [...svg.querySelectorAll('[data-id][role="button"]')];
    const locateTarget = (id) => targets.find(el => el.dataset.id === id &&
      (!el.closest('[data-g]') || el.closest('[data-g]').dataset.g === root.dataset.layer));
    const quiz = { queue: null, index: 0, timer: null, layer: '' };
    let statusTimer;
    let tour = null;

    function status(message) {
      statusBar.textContent = message;
      statusBar.classList.add('visible');
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => statusBar.classList.remove('visible'), 4200);
    }

    filters.innerHTML = layers.map(l =>
      `<button type="button" data-layer="${esc(l.id)}" aria-pressed="false">${esc(l.icon)} ${esc(l.name)}</button>`).join('');

    function clearHighlight() {
      svg.querySelector('.is-active')?.classList.remove('is-active');
    }

    function setLayer(id) {
      const layer = layers.find(l => l.id === id) || layers[0];
      root.dataset.layer = layer.id;
      clearHighlight();
      resetView();
      for (const b of filters.querySelectorAll('button')) {
        b.setAttribute('aria-pressed', String(b.dataset.layer === layer.id));
      }
      $('gm-layer-hint').textContent = layer.hint;
      $('gm-legend').innerHTML = (legends[layer.id] || []).map(({ name, color }) =>
        `<li><span style="--key:${esc(color)}"></span>${esc(name)}</li>`).join('');
      if (!quiz.queue) {
        picker.innerHTML = '<option value="">选择地点</option>' + places.filter(p => locateTarget(p.id))
          .map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
      }
      card.classList.add('gm-card--blank');
      card.style.setProperty('--accent', layer.accent);
      card.innerHTML = `<p class="gm-card-blank-icon" aria-hidden="true">${esc(layer.icon)}</p>` +
        `<p class="gm-card-blank">${esc(layer.blank)}</p>`;
      onLayerChange?.(layer.id, Boolean(quiz.queue));
    }

    function select(id, el) {
      const p = A.get(id);
      if (p?.map !== map) return;
      clearHighlight();
      el?.classList.add('is-active');
      openCard(id);
      card.insertAdjacentHTML('beforeend', window.StudyTopicConnections.related('places', id));
      picker.value = id;
      const media = window.GMMedia.preview(id);
      if (media) card.insertAdjacentHTML('beforeend', media);
      const links = A.related(id);
      if (links.length) {
        card.insertAdjacentHTML('beforeend', '<div class="gm-card-related"><p>接着去看</p><ul>' +
          links.map(p => `<li><a href="${esc(A.mapHref(p))}">${esc(p.name)}<small>${A.mapLabel(p)}</small></a></li>`).join('') +
          '</ul></div>');
      }
    }

    function renderQuestion() {
      const p = A.get(quiz.queue[quiz.index]);
      if (!p) {
        banner.innerHTML = `<div class="gm-quiz-result"><b>${'⭐'.repeat(quiz.queue.length)}</b>` +
          `<p>你找到了全部 ${quiz.queue.length} 个地点！</p>` +
          '<button type="button" class="gm-btn" data-quiz-act="again">再来一轮</button>' +
          '<button type="button" class="gm-btn gm-btn--ghost" data-quiz-act="exit">退出找一找</button></div>';
        banner.querySelector('[data-quiz-act="again"]').focus();
        return;
      }
      setLayer(p.layer);
      banner.innerHTML = `<div class="gm-quiz-head"><b>找一找</b><span>第 ${quiz.index + 1}／${quiz.queue.length} 题</span>` +
        '<button type="button" class="gm-quiz-exit" data-quiz-act="exit" aria-label="退出找一找">✕</button></div>' +
        `<p class="gm-quiz-target">请在地图上点出 <span class="gm-quiz-name">${esc(p.name)}</span></p>`;
      banner.focus();
    }

    function startQuiz() {
      tour?.pause();
      clearTimeout(quiz.timer);
      quiz.timer = null;
      if (!quiz.queue) quiz.layer = root.dataset.layer;
      const candidates = pool.filter(id => A.get(id)?.map === map);
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      if (!candidates.length) return;
      quiz.queue = candidates.slice(0, 5);
      quiz.index = 0;
      root.dataset.quiz = 'on';
      start.disabled = true;
      banner.hidden = false;
      renderQuestion();
    }

    function stopQuiz() {
      clearTimeout(quiz.timer);
      quiz.timer = null;
      quiz.queue = null;
      delete root.dataset.quiz;
      banner.hidden = true;
      start.disabled = false;
      svg.querySelector('.is-found')?.classList.remove('is-found');
      setLayer(quiz.layer);
      start.focus();
      status('继续自由探索地图吧。');
    }

    function activate(el) {
      const id = el.dataset.id;
      if (!quiz.queue) { tour?.pause(); select(id, el); return; }
      const expected = quiz.queue[quiz.index];
      if (!expected || quiz.timer !== null) return;
      if (id !== expected) {
        status(`再想想：${hintFor(expected)}。`);
        return;
      }
      el.classList.add('is-found');
      status(`答对啦！${A.get(id).name}就在这里。`);
      quiz.timer = setTimeout(() => {
        el.classList.remove('is-found');
        quiz.timer = null;
        quiz.index++;
        renderQuestion();
      }, 650);
    }

    function targetFor(event) {
      return event.target.closest('[data-id][role="button"]');
    }
    function revealMap() {
      const { top, bottom } = svg.getBoundingClientRect();
      if (top > window.innerHeight - 120 || bottom <= 0) $('map').scrollIntoView();
    }
    svg.addEventListener('click', (e) => {
      const target = targetFor(e);
      if (target) activate(target);
    });
    svg.addEventListener('keydown', (e) => {
      const target = targetFor(e);
      if (target && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (!e.repeat) activate(target);
      }
    });
    filters.addEventListener('click', (e) => {
      const layer = e.target.closest('button')?.dataset.layer;
      if (layer && !quiz.queue) {
        tour?.pause();
        setLayer(layer);
        revealMap();
      }
    });
    picker.addEventListener('change', () => {
      tour?.pause();
      if (!picker.value) { setLayer(root.dataset.layer); return; }
      resetView();
      select(picker.value, locateTarget(picker.value));
      revealMap();
    });
    start.addEventListener('click', startQuiz);
    banner.addEventListener('click', (e) => {
      const action = e.target.closest('[data-quiz-act]')?.dataset.quizAct;
      if (action === 'exit') stopQuiz();
      if (action === 'again') startQuiz();
    });

    const params = new URLSearchParams(location.search);
    const place = A.get(params.get('place'));
    const requestedLayer = params.get('layer');
    const validLayer = layers.some(l => l.id === requestedLayer);
    setLayer(validLayer ? requestedLayer : place?.map === map ? place.layer : layers[0].id);
    if (place?.map === map) {
      if (!locateTarget(place.id)) setLayer(place.layer);
      select(place.id, locateTarget(place.id));
      const stop = A.routeStop(params);
      if (stop) tour = mountRoute($('gm-route-stop'), stop, svg, map, (p) => {
        if (quiz.queue) stopQuiz();
        setLayer(p.layer);
        select(p.id, locateTarget(p.id));
        const url = new URL(location.href);
        url.searchParams.set('place', p.id);
        url.searchParams.delete('layer');
        history.replaceState(null, '', url);
      });
    } else if (params.has('place')) {
      status('这张地图上没找到这个地点。可以从地点索引重新选择。');
    }
    return { setLayer, revealMap };
  }

  function mountRoute(el, { route, index }, svg, map, selectStep) {
    let playing = false, timer = null, token = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canPlay = () => window.StudyEffects ? window.StudyEffects.motion === 'full' : !reduced.matches;
    el.hidden = false;
    el.innerHTML = `<div class="gm-tour-copy" aria-live="polite"></div>
      <div class="gm-tour-controls"><button type="button" class="gm-btn" data-tour-play aria-pressed="false">开始逐站导览</button>
      <label>每站停留 <select data-tour-speed><option value="8000">8 秒</option><option value="15000">15 秒</option></select></label>
      <progress data-tour-progress max="${route.steps.length}" aria-label="路线站点进度"></progress>
      <p data-tour-status role="status"></p></div>
      <nav aria-label="路线站点"></nav>`;
    const control = el.querySelector('[data-tour-play]');
    const speed = el.querySelector('[data-tour-speed]');
    const nextPlace = () => A.get(route.steps[index + 1]?.place);
    function clear() { token++; clearTimeout(timer); timer = null; }
    function clearTrace() { svg.querySelectorAll('.gm-tour-trace').forEach(path => path.remove()); }
    function render() {
      const step = route.steps[index];
      const next = nextPlace();
      el.querySelector('.gm-tour-copy').innerHTML = `<p class="gm-kicker">${esc(route.icon)} ${esc(route.title)} · 第 ${index + 1}／${route.steps.length} 站</p>
        <h2>${esc(A.get(step.place).name)}</h2><p>${esc(step.observe)}</p>` +
        (next ? '' : `<p class="gm-route-question"><b>走完想一想</b> ${esc(route.question)}</p>`);
      el.querySelector('nav').innerHTML = (index > 0 ? `<a data-tour-step="${index - 1}" href="${esc(A.stepHref(route, index - 1))}">← 上一站</a>` : '') +
        `<a href="routes.html#${esc(route.id)}">路线总览</a>` +
        (next ? `<a class="gm-route-next" data-tour-step="${index + 1}" href="${esc(A.stepHref(route, index + 1))}">下一站：${esc(next.name)} →</a>` :
          `<a data-tour-step="0" href="${esc(A.stepHref(route, 0))}">回到第一站</a>`);
      el.querySelector('[data-tour-progress]').value = index + 1;
      control.disabled = !canPlay() || !next || next.map !== map;
      control.textContent = playing ? '暂停导览' : '开始逐站导览';
      control.setAttribute('aria-pressed', String(playing));
      el.querySelector('[data-tour-status]').textContent = !next ? '这一条路线看完啦，试着回答上面的问题。'
        : next.map !== map ? `下一站在${A.mapLabel(next)}，准备好后点「下一站」。`
        : !canPlay() ? '已减少连续运动，可以用「下一站」逐站观察。'
        : playing ? '正在导览。点暂停可以慢慢读，离开地图也会暂停。' : '点播放后按站点顺序看地图，也可以手动去下一站。';
    }
    function pause() { clear(); playing = false; clearTrace(); render(); }
    function trace() {
      clearTrace();
      if (!canPlay()) return;
      const line = svg.querySelector('.is-active .gm-river, .is-active .gm-mtn');
      if (!line) return;
      const path = line.cloneNode(false);
      path.setAttribute('class', 'gm-tour-trace'); path.setAttribute('pathLength', '1');
      path.setAttribute('aria-hidden', 'true');
      line.parentNode.append(path);
      path.addEventListener('animationend', () => path.remove(), {once: true});
    }
    function move(to) { index = to; selectStep(A.get(route.steps[index].place)); render(); trace(); }
    function schedule() {
      clear();
      const ownToken = token;
      timer = setTimeout(() => {
        if (!playing || ownToken !== token || !canPlay() || document.hidden) return;
        const next = nextPlace();
        if (!next || next.map !== map) { pause(); return; }
        move(index + 1);
        if (nextPlace()?.map === map) schedule(); else { playing = false; clear(); render(); }
      }, Number(speed.value));
    }
    control.addEventListener('click', () => {
      if (playing) { pause(); return; }
      if (!canPlay() || nextPlace()?.map !== map || document.hidden) return;
      // 自由点图后重新播放时，先回到当前路线站点。
      selectStep(A.get(route.steps[index].place));
      playing = true; render(); trace(); schedule();
    });
    speed.addEventListener('change', () => { if (playing) schedule(); });
    el.addEventListener('click', event => {
      const link = event.target.closest('[data-tour-step]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const to = Number(link.dataset.tourStep);
      if (A.get(route.steps[to].place).map !== map) return;
      const forward = to > index;
      event.preventDefault(); pause(); move(to);
      (el.querySelector(`[data-tour-step="${index + (forward ? 1 : -1)}"]`) || el.querySelector('nav a')).focus({preventScroll: true});
    });
    const preference = () => { if (!canPlay()) pause(); else render(); };
    document.addEventListener('study:effects-change', preference);
    reduced.addEventListener('change', preference);
    const viewport = svg.closest('.gm-map-workspace') || svg;
    if (window.StudyEffects) window.StudyEffects.watch(viewport, pause);
    else {
      const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => { if (entries.some(e => !e.isIntersecting)) pause(); }) : null;
      observer?.observe(viewport);
      document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    }
    window.addEventListener('pagehide', pause);
    render();
    return {pause};
  }

  return { mount };
})();
