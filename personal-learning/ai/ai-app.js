/* AI 基础篇：路线、概念阅读、自检与本机笔记。 */
(function () {
  'use strict';
  const course = AI_COURSE;
  const lessons = course.stages.flatMap(stage => stage.lessons.map(lesson => ({ ...lesson, stage })));
  const byId = new Map(lessons.map(lesson => [lesson.id, lesson]));
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  let state = AILearningState.normalize(null, course);
  try { state = AILearningState.normalize(JSON.parse(localStorage.getItem(AILearningState.key) || 'null'), course); } catch (e) { /* 以空白档案开始 */ }
  let query = '';
  let filter = 'all';
  let pendingAnswer = null;

  function save() {
    try { localStorage.setItem(AILearningState.key, JSON.stringify(state)); $('storageNotice').hidden = true; }
    catch (e) { $('storageNotice').hidden = false; }
  }
  function current() {
    if (location.hash === '#concepts') return { view: 'concepts' };
    const id = new URLSearchParams(location.hash.slice(1)).get('lesson');
    return byId.has(id) ? { view: 'lesson', lesson: byId.get(id) } : { view: 'route' };
  }
  function resumeLesson(stage) {
    if (stage) return stage.lessons.find(lesson => !state.completed[lesson.id]) || stage.lessons[0];
    if (state.lastLesson && !state.completed[state.lastLesson]) return byId.get(state.lastLesson);
    return lessons.find(lesson => !state.completed[lesson.id]) || lessons[0];
  }
  const learnedCount = stage => stage.lessons.filter(lesson => state.completed[lesson.id]).length;
  function highlight(value) {
    const text = String(value);
    const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
    if (index < 0) return esc(text);
    return esc(text.slice(0, index)) + '<mark>' + esc(text.slice(index, index + query.length)) + '</mark>' + esc(text.slice(index + query.length));
  }
  function renderOverview() {
    const n = lessons.filter(lesson => state.completed[lesson.id]).length;
    $('courseStats').innerHTML = '<span><strong>' + course.stages.length + '</strong>学习阶段</span><span><strong>' + lessons.length + '</strong>基础概念</span><span><strong>' + n + '</strong>已学习</span>';
    $('progressLabel').textContent = n + ' / ' + lessons.length;
    $('courseProgress').max = lessons.length;
    $('courseProgress').value = n;
    $('resumeButton').textContent = n === lessons.length ? '复习基础篇 →' : state.lastLesson ? '继续学习 →' : '开始学习 →';
    const view = current();
    ['route', 'concepts'].forEach(name => {
      const link = $(name + 'Link');
      if (view.view === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const expanded = new Set([...$('courseTree').querySelectorAll('details[open]')].map(element => element.dataset.stage));
    const focused = document.activeElement && document.activeElement.dataset.aiLesson;
    $('courseTree').innerHTML = course.stages.map((stage, index) => {
      const active = view.lesson && view.lesson.stage.id === stage.id;
      return '<details class="stage-directory" data-stage="' + stage.id + '"' + (active || expanded.has(stage.id) ? ' open' : '') + '><summary><span class="stage-index">0' + (index + 1) + '</span><span>' + esc(stage.title) + '</span><small>' + learnedCount(stage) + '/' + stage.lessons.length + '</small></summary><div>' + stage.lessons.map(lesson => '<a data-ai-lesson="' + lesson.id + '" href="#lesson=' + lesson.id + '"' + (view.lesson && view.lesson.id === lesson.id ? ' aria-current="page"' : '') + '><span>' + esc(lesson.title) + '</span><span class="tree-check" aria-label="' + (state.completed[lesson.id] ? '已学习' : '待学习') + '">' + (state.completed[lesson.id] ? '✓' : '·') + '</span></a>').join('') + '</div></details>';
    }).join('');
    if (focused) {
      const target = $('courseTree').querySelector('[data-ai-lesson="' + focused + '"]');
      if (target) target.focus({ preventScroll: true });
    }
  }
  function practiceHTML(stage) {
    const p = stage.practice;
    return '<details class="stage-practice"><summary>本阶段小练习 · ' + esc(p.task) + '</summary><ol>' + p.steps.map(step => '<li>' + esc(step) + '</li>').join('') + '</ol><p><b>留下什么</b> ' + esc(p.deliverable) + '</p><p class="practice-label">完成后检查</p><ul>' + p.criteria.map(item => '<li>' + esc(item) + '</li>').join('') + '</ul></details>';
  }
  function renderRoute() {
    $('learningContent').innerHTML = '<section aria-labelledby="viewTitle"><div class="view-heading"><div><p class="eyebrow">YOUR LEARNING PATH</p><h2 id="viewTitle">从理解概念，到看懂一个 AI 应用</h2></div><span class="reading-tag">概念 → 例子 → 自检 → 练习</span></div><p class="view-lead">建议按顺序学习，也可以从目录进入感兴趣的概念。标记「已学习」记录自己的进展，小练习帮助你检查是否真的能解释清楚。</p><div class="route-grid">' + course.stages.map((stage, index) => '<article class="route-card"><div class="route-card-top"><span class="route-number">0' + (index + 1) + '</span><span class="stage-status">' + learnedCount(stage) + ' / ' + stage.lessons.length + ' 已学习</span></div><h3>' + esc(stage.title) + '</h3><p>' + esc(stage.goal) + '</p><ul class="concept-list">' + stage.lessons.map(lesson => '<li><a href="#lesson=' + lesson.id + '">' + esc(lesson.title) + (state.completed[lesson.id] ? ' <span aria-label="已学习">✓</span>' : '') + '</a></li>').join('') + '</ul><div class="stage-outcome"><span>学完能做到</span><p>' + esc(stage.outcome) + '</p></div>' + practiceHTML(stage) + '<a class="stage-start" href="#lesson=' + resumeLesson(stage).id + '">' + (learnedCount(stage) === stage.lessons.length ? '复习本阶段' : learnedCount(stage) ? '继续本阶段' : '开始本阶段') + ' <span aria-hidden="true">→</span></a></article>').join('') + '</div><details class="course-references"><summary>参考资料与查阅说明</summary><p>概念依据可在各概念页继续查阅；示例、自检与练习由本站编写。资料查阅日期：' + esc(course.checkedAt) + '。</p><ul>' + Object.values(course.sources).map(source => '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener noreferrer">' + esc(source.title) + ' ↗</a></li>').join('') + '</ul></details></section>';
    $('viewStatus').textContent = '学习路线，共 ' + course.stages.length + ' 个阶段、' + lessons.length + ' 个概念';
  }
  function renderCatalog() {
    const q = query.toLowerCase();
    const matches = lessons.filter(lesson => (!q || [lesson.title, lesson.english, lesson.summary, lesson.stage.title, ...lesson.detail, lesson.example].join(' ').toLowerCase().includes(q)) && (filter === 'all' || (filter === 'completed' ? !!state.completed[lesson.id] : !state.completed[lesson.id])));
    $('learningContent').innerHTML = '<section aria-labelledby="viewTitle"><div class="view-heading"><div><p class="eyebrow">THE CONCEPT LIBRARY</p><h2 id="viewTitle">基础概念</h2></div><span>' + matches.length + ' 个概念</span></div><div class="catalog-filters" role="group" aria-label="概念学习状态">' + [['all', '全部概念'], ['unlearned', '待学习'], ['completed', '已学习']].map(([value, text]) => '<button data-ai-act="filter" data-filter="' + value + '" aria-pressed="' + (filter === value) + '">' + text + '</button>').join('') + '</div>' + (matches.length ? '<div class="concept-grid">' + matches.map(lesson => '<a class="concept-card" href="#lesson=' + lesson.id + '"><span class="concept-category">' + esc(lesson.stage.title) + (state.completed[lesson.id] ? ' · 已学习 ✓' : '') + '</span><h3>' + highlight(lesson.title) + '</h3><p class="english-name" lang="en">' + highlight(lesson.english) + '</p><p>' + highlight(lesson.summary) + '</p><span class="read-link">阅读概念 <span aria-hidden="true">↗</span></span></a>').join('') + '</div>' : '<div class="empty-concepts"><h3>这个范围里没有找到概念</h3><p>试试其他关键词，或查看全部概念。</p><button data-ai-act="reset-catalog">查看全部概念 →</button></div>') + '</section>';
    $('viewStatus').textContent = '显示 ' + matches.length + ' 个概念';
  }
  function feedbackHTML(lesson) {
    if (!Object.prototype.hasOwnProperty.call(state.answers, lesson.id)) return '';
    const correct = state.answers[lesson.id] === lesson.quiz.answer;
    return '<p class="feedback-heading' + (correct ? ' correct' : '') + '">' + (correct ? '回答正确' : '再想一想') + '</p><p>' + esc(lesson.quiz.explanation) + '</p>' + (!correct ? '<p>参考答案：' + esc(lesson.quiz.options[lesson.quiz.answer]) + '</p>' : '');
  }
  function renderLesson(lesson) {
    pendingAnswer = Object.prototype.hasOwnProperty.call(state.answers, lesson.id) ? state.answers[lesson.id] : null;
    const position = lessons.findIndex(item => item.id === lesson.id);
    const previous = lessons[position - 1];
    const next = lessons[position + 1];
    const stageIndex = course.stages.findIndex(stage => stage.id === lesson.stage.id);
    $('learningContent').innerHTML = '<section aria-labelledby="viewTitle"><div class="lesson-heading"><p class="eyebrow">STAGE 0' + (stageIndex + 1) + ' · ' + esc(lesson.stage.title) + '</p><div><h2 id="viewTitle">' + esc(lesson.title) + '</h2><span class="lesson-position">概念 ' + (position + 1) + ' / ' + lessons.length + '</span></div><p class="english-name" lang="en">' + esc(lesson.english) + '</p></div><div class="lesson-layout"><article class="lesson-body"><p class="lesson-summary">' + esc(lesson.summary) + '</p><h3>先抓住核心</h3>' + lesson.detail.map(text => '<p>' + esc(text) + '</p>').join('') + (lesson.flow.length ? '<ol class="concept-flow" aria-label="概念流程示意">' + lesson.flow.map(item => '<li>' + esc(item) + '</li>').join('') + '</ol>' : '') + '<section class="work-example"><h3>放到一个例子里</h3><p>' + esc(lesson.example) + '</p></section><section class="misconception"><h3>容易混淆的地方</h3><p>' + esc(lesson.trap) + '</p></section><div class="lesson-sources"><span>继续查阅</span>' + lesson.sources.map(id => '<a href="' + esc(course.sources[id].url) + '" target="_blank" rel="noopener noreferrer">' + esc(course.sources[id].title) + ' ↗</a>').join('') + '</div></article><aside class="practice-column" aria-label="自检与学习记录"><section class="quiz-box"><p class="exercise-eyebrow">CHECK YOUR UNDERSTANDING</p><fieldset><legend>自检 · ' + esc(lesson.quiz.question) + '</legend>' + lesson.quiz.options.map((option, index) => '<label class="answer-option"><input type="radio" name="concept-answer" value="' + index + '"' + (pendingAnswer === index ? ' checked' : '') + '><span>' + esc(option) + '</span></label>').join('') + '</fieldset><button class="check-button" data-ai-act="check"' + (pendingAnswer === null ? ' disabled' : '') + '>检查答案</button><div id="quizFeedback" class="quiz-feedback" role="status" aria-live="polite">' + feedbackHTML(lesson) + '</div></section><section class="note-box"><label for="lessonNote">用自己的话记一句</label><p id="noteHint">记录理解、疑问或一个自己的例子。本机保存，最多 2000 字。</p><textarea id="lessonNote" aria-describedby="noteHint" maxlength="2000" rows="5" placeholder="我理解这个概念是…">' + esc(state.notes[lesson.id] || '') + '</textarea><button class="complete-button" data-ai-act="complete" aria-pressed="' + !!state.completed[lesson.id] + '">' + (state.completed[lesson.id] ? '✓ 已学习 · 可取消标记' : '✓ 标记为已学习') + '</button><p class="completion-hint">按自己的理解标记，自检结果不会自动替你标记。</p></section></aside></div>' + practiceHTML(lesson.stage) + '<nav class="lesson-pagination" aria-label="概念翻页"><a href="' + (previous ? '#lesson=' + previous.id : '#route') + '"><span>← ' + (previous ? '上一概念' : '学习路线') + '</span><b>' + esc(previous ? previous.title : '查看六阶段路线') + '</b></a><a href="' + (next ? '#lesson=' + next.id : '#route') + '"><span>' + (next ? '下一概念' : '返回路线') + ' →</span><b>' + esc(next ? next.title : '回顾本篇学习进度') + '</b></a></nav></section>';
    $('viewStatus').textContent = '正在学习：' + lesson.title;
  }
  function render() {
    const view = current();
    if (view.lesson) { state.lastLesson = view.lesson.id; save(); }
    renderOverview();
    $('clearSearch').hidden = !query;
    if (view.view === 'concepts') renderCatalog();
    else if (view.lesson) renderLesson(view.lesson);
    else renderRoute();
  }
  function navigate(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  function updateSearch(value) {
    query = value.trim();
    $('conceptSearch').value = value;
    $('clearSearch').hidden = !query;
    if (current().view !== 'concepts') navigate('#concepts');
    else renderCatalog();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-ai-act]');
    if (!button) return;
    const action = button.dataset.aiAct;
    const lesson = current().lesson;
    if (action === 'skip') {
      event.preventDefault();
      $('learningContent').focus({ preventScroll: true });
      $('learningContent').scrollIntoView({ block: 'start' });
    } else if (action === 'resume') navigate('#lesson=' + resumeLesson().id);
    else if (action === 'clear-search') { updateSearch(''); $('conceptSearch').focus(); }
    else if (action === 'filter') { filter = button.dataset.filter; renderCatalog(); $('learningContent').querySelector('[data-filter="' + filter + '"]').focus({ preventScroll: true }); }
    else if (action === 'reset-catalog') { filter = 'all'; updateSearch(''); }
    else if (action === 'check' && lesson && pendingAnswer !== null) {
      state.answers[lesson.id] = pendingAnswer;
      save();
      $('quizFeedback').innerHTML = feedbackHTML(lesson);
    } else if (action === 'complete' && lesson) {
      if (state.completed[lesson.id]) delete state.completed[lesson.id];
      else state.completed[lesson.id] = true;
      save(); renderOverview();
      button.setAttribute('aria-pressed', String(!!state.completed[lesson.id]));
      button.textContent = state.completed[lesson.id] ? '✓ 已学习 · 可取消标记' : '✓ 标记为已学习';
      $('viewStatus').textContent = lesson.title + (state.completed[lesson.id] ? '已标记为已学习' : '已取消学习标记');
    }
  });
  document.addEventListener('change', event => {
    if (event.target.name === 'concept-answer') {
      pendingAnswer = Number(event.target.value);
      $('learningContent').querySelector('.check-button').disabled = false;
      $('quizFeedback').textContent = '';
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'conceptSearch') updateSearch(event.target.value);
    if (event.target.id === 'lessonNote' && current().lesson) {
      state.notes[current().lesson.id] = event.target.value;
      save();
    }
  });
  document.addEventListener('keydown', event => {
    const typing = event.target.closest('input,textarea,select,[contenteditable="true"]');
    if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) { event.preventDefault(); $('conceptSearch').focus(); }
    if (event.key === 'Escape' && event.target === $('conceptSearch')) updateSearch('');
  });
  window.addEventListener('hashchange', () => {
    if (current().view === 'route') { query = ''; filter = 'all'; $('conceptSearch').value = ''; }
    render();
    $('learningContent').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  if (window.ResizeObserver) new ResizeObserver(entries => {
    document.documentElement.style.setProperty('--ai-tools-height', Math.ceil(entries[0].target.getBoundingClientRect().height) + 'px');
  }).observe(document.querySelector('.reader-tools'));
  window.AILearning = { get state() { return state; }, course, lessons };
  render();
})();
