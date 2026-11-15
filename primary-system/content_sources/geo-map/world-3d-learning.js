/* 逐站导览与探索题独立于 WebGL；显示失败时仍可阅读和答题。 */
window.GMWorldLearning = (() => {
  'use strict';
  const KEY = 'study_world_globe_mastered_v1';
  const MISTAKES_KEY = 'study_world_globe_mistakes_v1';
  function readProgress(raw, questions) {
    try {
      const ids = JSON.parse(raw), valid = new Set(questions.map(q => q.id));
      return new Set(Array.isArray(ids) ? ids.filter(id => valid.has(id)) : []);
    } catch { return new Set(); }
  }
  function resolveTour(params, tours) {
    const tour = tours.find(t => t.id === params.get('tour'));
    if (!tour) return null;
    const index = tour.stops.findIndex(s => s.id === params.get('stop'));
    return {tour, index: index < 0 ? 0 : index};
  }
  function mount({root, choose, setLine, setLayer, startSun}) {
    const D = window.GM_WORLD_LEARNING, esc = window.GMShared.esc, $ = id => root.querySelector(`#${id}`);
    let tour = null, step = 0, question = 0, mastered = new Set(), mistakes = new Set(), queue = D.questions, practice = false;
    try { mastered = readProgress(localStorage.getItem(KEY), D.questions); mistakes = readProgress(localStorage.getItem(MISTAKES_KEY), D.questions); }
    catch { $('gw-quiz-storage').textContent = '当前浏览器无法保存记录，本次仍可完成挑战。'; }
    let roundSolved = new Set(mastered);
    $('gw-tour-cards').innerHTML = D.tours.map((t, i) => `<article><p class="gw-eyebrow">路线 ${i + 1} · ${t.stops.length} 站</p><h3>${esc(t.name)}</h3><p>${esc(t.intro)}</p><button type="button" data-tour="${esc(t.id)}">出发探索 →</button></article>`).join('');
    $('gw-sources').innerHTML = D.sources.map(s => `<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}（需联网）↗</a></p>`).join('') + '<p>大洲、国家、大洋与地标正文沿用平面世界地图的同一份资料。</p>';
    function stopTour(clearURL = true) {
      tour = null; $('gw-tour-panel').hidden = true;
      if (clearURL) {
        const url = new URL(location.href); url.searchParams.delete('tour'); url.searchParams.delete('stop'); history.replaceState(null, '', url);
      }
    }
    function showStop(moveFocus = false) {
      const stop = tour.stops[step];
      choose(stop.place, true, 'tour');
      setLayer(tour.id === 'latitude-trip' ? 'zones' : 'continent');
      setLine(stop.line || '', false);
      $('gw-tour-panel').hidden = false;
      $('gw-tour-count').textContent = `${tour.name} · 第 ${step + 1} / ${tour.stops.length} 站`;
      $('gw-tour-title').textContent = stop.title;
      $('gw-tour-text').textContent = stop.text;
      $('gw-tour-observe').textContent = '看图想一想：' + stop.observe;
      $('gw-tour-prev').disabled = step === 0; $('gw-tour-next').disabled = step === tour.stops.length - 1;
      $('gw-tour-next').textContent = step === tour.stops.length - 1 ? '已到最后一站' : '下一站';
      const url = new URL(location.href); url.searchParams.set('tour', tour.id); url.searchParams.set('stop', stop.id); history.replaceState(null, '', url);
      if (moveFocus) { $('gw-tour-panel').scrollIntoView({block: 'start'}); $('gw-tour-title').focus({preventScroll: true}); }
    }
    $('gw-tour-cards').addEventListener('click', event => {
      const button = event.target.closest('[data-tour]'); if (!button) return;
      tour = D.tours.find(t => t.id === button.dataset.tour); step = 0; showStop(true);
    });
    $('gw-tour-prev').addEventListener('click', () => { if (tour && step > 0) { step--; showStop(true); } });
    $('gw-tour-next').addEventListener('click', () => { if (tour && step < tour.stops.length - 1) { step++; showStop(true); } });
    $('gw-tour-locate').addEventListener('click', () => { if (tour) showStop(); });
    $('gw-tour-close').addEventListener('click', () => { stopTour(); $('gw-tour-heading').scrollIntoView({block: 'center'}); });
    root.addEventListener('gm-world-selection', event => { if (event.detail.origin !== 'tour') stopTour(false); });
    root.addEventListener('gm-world-free-view', () => stopTour());
    function renderQuiz(moveFocus = false) {
      const q = queue[question], done = q && roundSolved.has(q.id);
      $('gw-quiz-number').textContent = q ? `${practice ? '本轮复习 · ' : ''}第 ${question + 1} / ${queue.length} 题` : '错题复习';
      $('gw-quiz-progress').textContent = `已掌握 ${mastered.size} / ${D.questions.length}`;
      $('gw-quiz-mistakes').textContent = `错题再练（${mistakes.size}）`;
      $('gw-quiz-look').disabled = !q; $('gw-quiz-hint').disabled = !q;
      $('gw-quiz-prev').disabled = question === 0;
      $('gw-quiz-next').disabled = !q || question === queue.length - 1;
      if (!q) {
        $('gw-quiz-question').textContent = '还没有答错的题，继续探索吧！';
        $('gw-quiz-options').innerHTML = ''; $('gw-quiz-feedback').textContent = '选择「全部再练」开始新一轮。';
        if (moveFocus) $('gw-quiz-question').focus({preventScroll: true});
        return;
      }
      $('gw-quiz-question').textContent = q.prompt;
      $('gw-quiz-options').innerHTML = q.options.map((option, i) => `<button type="button" data-answer="${i}"${done ? ' disabled' : ''}${done && i === q.answer ? ' class="is-correct"' : ''}>${esc(option)}${done && i === q.answer ? ' ✓' : ''}</button>`).join('');
      $('gw-quiz-feedback').textContent = done ? (practice ? '本轮答对：' : '已经掌握：') + q.explanation : '选一选，也可以先到地球仪上观察。';
      if (moveFocus) $('gw-quiz-question').focus({preventScroll: true});
    }
    $('gw-quiz-options').addEventListener('click', event => {
      const button = event.target.closest('[data-answer]'); if (!button) return;
      const q = queue[question]; if (!q || roundSolved.has(q.id)) return;
      if (Number(button.dataset.answer) !== q.answer) {
        mistakes.add(q.id);
        try { localStorage.setItem(MISTAKES_KEY, JSON.stringify([...mistakes])); }
        catch { $('gw-quiz-storage').textContent = '本次已记下，浏览器未能保存到下次。'; }
        $('gw-quiz-mistakes').textContent = `错题再练（${mistakes.size}）`;
        $('gw-quiz-feedback').textContent = '再想一想：' + q.hint; button.classList.add('is-retry'); return;
      }
      mastered.add(q.id); roundSolved.add(q.id);
      root.dispatchEvent(new CustomEvent('gm-world-progress', {detail: {kind: 'quiz', ids: [...mastered]}}));
      try { localStorage.setItem(KEY, JSON.stringify([...mastered])); }
      catch { $('gw-quiz-storage').textContent = '本次已记下，浏览器未能保存到下次。'; }
      renderQuiz(); $('gw-quiz-question').focus({preventScroll: true});
      $('gw-quiz-feedback').textContent = '答对了！' + q.explanation + (queue.every(item => roundSolved.has(item.id)) ? ' 这一轮全部完成啦！' : '');
    });
    $('gw-quiz-prev').addEventListener('click', () => { if (question > 0) { question--; renderQuiz(true); } });
    $('gw-quiz-next').addEventListener('click', () => { if (question < queue.length - 1) { question++; renderQuiz(true); } });
    $('gw-quiz-hint').addEventListener('click', () => { if (queue[question]) $('gw-quiz-feedback').textContent = queue[question].hint; });
    function review(onlyMistakes) {
      queue = onlyMistakes ? D.questions.filter(q => mistakes.has(q.id)) : D.questions;
      question = 0; practice = true; roundSolved = new Set(); renderQuiz(true);
    }
    $('gw-quiz-restart').addEventListener('click', () => review(false));
    $('gw-quiz-mistakes').addEventListener('click', () => review(true));
    $('gw-quiz-look').addEventListener('click', () => {
      const q = queue[question]; if (!q) return; choose(q.place, true, 'quiz');
      setLayer(q.id === 'tropics' || q.id === 'latitude-weather' ? 'zones' : 'continent'); setLine(q.line || '', false);
      if (q.sunStudy) startSun(q.sunStudy);
      $('map').scrollIntoView({block: 'start'});
    });
    function restore() {
      const state = resolveTour(new URLSearchParams(location.search), D.tours);
      if (state) { tour = state.tour; step = state.index; showStop(); }
      else stopTour();
    }
    renderQuiz(); restore(); window.addEventListener('popstate', restore);
    return {stopTour, resumeQuiz: () => {
      queue = D.questions; question = queue.findIndex(q => !mastered.has(q.id));
      practice = question < 0;
      if (practice) question = 0;
      roundSolved = practice ? new Set() : new Set(mastered);
      renderQuiz(true); $('gw-quiz').scrollIntoView({block: 'start'});
    }};
  }
  return {readProgress, resolveTour, mount};
})();
