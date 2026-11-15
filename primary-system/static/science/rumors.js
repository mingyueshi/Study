(() => {
  'use strict';
  let storage;
  try { storage = window.localStorage; } catch { /* 浏览器禁用存储。 */ }
  const store = window.RumorLearning.createStore(storage);
  const changed = () => window.dispatchEvent(new Event('rumor:records-change'));
  window.RumorStation = {store, changed};

  const directory = document.querySelector('#rumor-directory-data');
  if (directory) {
    const cases = JSON.parse(directory.textContent);
    const cards = [...document.querySelectorAll('[data-rumor-card]')];
    const filters = document.querySelector('[data-progress-filters]');
    const progress = document.querySelector('.rumor-progress');
    const desk = document.querySelector('[data-learning-desk]');
    const summary = document.querySelector('[data-server-results]').textContent.trim();
    let view = filters.dataset.view;
    const labels = {all: '全部', unseen: '还没查证', review: '待巩固', saved: '我的收藏'};
    function refresh() {
      const records = new Map(cases.map(item => [item.slug, store.read(item.slug)]));
      const count = key => [...records.values()].filter(value => value[key]).length;
      const completed = count('completed');
      desk.querySelector('[data-desk-done]').textContent = completed;
      desk.querySelector('[data-desk-review]').textContent = count('review');
      desk.querySelector('[data-desk-saved]').textContent = count('saved');
      progress.querySelector('[data-completed-count]').textContent = completed;
      progress.querySelector('progress').value = completed;
      const last = cases.find(item => item.slug === store.last());
      const next = last && !records.get(last.slug).completed ? last : cases.find(item => !records.get(item.slug).completed);
      const resume = desk.querySelector('[data-resume]');
      resume.href = (next || last || cases[0]).url;
      resume.textContent = next ? '接着查证 →' : '再看一项 →';
      desk.querySelector('[data-learning-tip]').textContent = next ? `下一项：${next.claim}` : '全部任务都查过了！试试五题训练，把方法带到新问题里。';
      desk.querySelector('[data-storage-tip]').textContent = store.available
        ? '进度、收藏和手记保存在当前浏览器，换设备不会自动同步。'
        : '当前浏览器无法保存记录，本次仍可练习；关闭页面后新记录可能丢失。';
      let visible = 0;
      for (const card of cards) {
        const record = records.get(card.dataset.rumorCard);
        card.querySelector('.rumor-done').hidden = !record.completed;
        card.querySelector('.rumor-review-badge').hidden = !record.review;
        card.querySelector('.rumor-saved-badge').hidden = !record.saved;
        const show = view === 'all' || (view === 'unseen' ? !record.completed : record[view]);
        card.parentElement.hidden = !show;
        if (show) visible++;
      }
      filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.progressFilter === view)));
      const results = document.querySelector('[data-local-results]');
      results.textContent = `${summary} · ${labels[view]}：${visible} 项`;
      document.querySelector('[data-server-results]').hidden = true;
      results.hidden = false;
      document.querySelector('[data-local-empty]').hidden = visible !== 0 || cards.length === 0;
      document.querySelector('[data-random]').disabled = visible === 0;
      progress.hidden = desk.hidden = filters.hidden = false;
    }
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-progress-filter]');
      if (!button) return;
      view = button.dataset.progressFilter;
      document.querySelector('[data-progress-query]').value = view;
      document.querySelectorAll('.rumor-categories a').forEach(link => {
        const url = new URL(link.href);
        url.searchParams.set('view', view);
        link.href = url;
      });
      const url = new URL(window.location.href);
      url.searchParams.set('view', view);
      window.history.replaceState(null, '', url);
      refresh();
    });
    document.querySelector('[data-random]').addEventListener('click', () => {
      const pool = cards.filter(card => !card.parentElement.hidden);
      if (pool.length) window.location.assign(pool[Math.floor(Math.random() * pool.length)].href);
    });
    window.addEventListener('pageshow', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('rumor:records-change', refresh);
    refresh();
  }

  const tools = document.querySelector('[data-case-tools]');
  if (!tools) return;
  const slug = tools.dataset.caseTools;
  store.visit(slug);
  const bookmark = tools.querySelector('[data-bookmark]');
  function refreshTools() {
    const record = store.read(slug);
    bookmark.textContent = record.saved ? '★ 已收藏' : '☆ 收藏这项';
    bookmark.setAttribute('aria-pressed', String(record.saved));
    tools.querySelector('[data-case-status]').textContent = record.review
      ? '这项还待巩固。试试下面的迁移题，练对就能移出待巩固清单。'
      : record.completed ? '✓ 这项已查证。可以再做判断，或试试迁移题。' : '先翻证据，再做判断。';
  }
  bookmark.addEventListener('click', () => { store.bookmark(slug); changed(); });
  window.addEventListener('rumor:records-change', refreshTools);
  window.addEventListener('storage', refreshTools);
  window.addEventListener('pageshow', refreshTools);
  refreshTools();
  tools.hidden = false;

  const seen = new Set();
  const clues = [...document.querySelectorAll('.rumor-clue')];
  const reading = document.querySelector('[data-evidence-count]');
  function refreshReading() { reading.textContent = `已翻看 ${seen.size} / ${clues.length} 张`; }
  clues.forEach((clue, index) => clue.addEventListener('toggle', () => {
    if (clue.open) seen.add(index);
    refreshReading();
  }));
  refreshReading();
  reading.hidden = false;

  const form = document.querySelector('[data-rumor]');
  const answer = document.querySelector('#rumor-answer');
  const feedback = form.querySelector('.rumor-feedback');
  const hint = form.querySelector('#rumor-hint').content.textContent.trim();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const correct = new FormData(form).get('verdict') === form.dataset.verdict;
    store.judge(slug, correct);
    changed();
    if (!correct) {
      feedback.textContent = `再看看证据。${hint}这项已加入待巩固，下面还有一道迁移题可以练。`;
      feedback.dataset.state = 'retry';
      return;
    }
    feedback.textContent = '判断正确！查证结论已展开，再试试下面的新情境。';
    feedback.dataset.state = 'correct';
    answer.hidden = false;
    answer.open = true;
  });
  answer.hidden = !store.read(slug).completed;
  answer.open = !answer.hidden;
  form.hidden = false;

  const quiz = document.querySelector('[data-transfer-quiz]');
  const question = JSON.parse(document.querySelector('#rumor-question').textContent);
  const quizFeedback = quiz.querySelector('.rumor-feedback');
  quiz.addEventListener('submit', event => {
    event.preventDefault();
    const choice = question.options.find(option => option.id === new FormData(quiz).get('choice'));
    if (!choice) return;
    const correct = choice.id === question.answer;
    store.practice(slug, correct);
    quizFeedback.textContent = (correct ? '想法很棒！' : '再想一想。') + choice.feedback + (correct ? '这项已移出待巩固清单。' : '可以换个选项再试试，这项会留在待巩固清单。');
    quizFeedback.dataset.state = correct ? 'correct' : 'retry';
    changed();
  });
  if (store.read(slug).quizDone) {
    quizFeedback.textContent = '✓ 这道迁移题已经练对过，可以再试一次。';
    quizFeedback.dataset.state = 'correct';
  }
  document.querySelector('[data-quiz-fallback]').hidden = true;
  quiz.hidden = false;

  const notebook = document.querySelector('[data-notebook]');
  const note = notebook.querySelector('textarea');
  const noteStatus = notebook.querySelector('[data-note-status]');
  note.value = store.read(slug).note;
  notebook.open = Boolean(note.value);
  note.addEventListener('input', () => { noteStatus.textContent = '有未保存的修改，写好后点「保存手记」。'; });
  notebook.querySelector('[data-save-note]').addEventListener('click', () => {
    store.saveNote(slug, note.value);
    noteStatus.textContent = store.available ? '手记已保存在当前浏览器。' : '本次暂存成功；浏览器无法保存，关闭页面后可能丢失。';
  });
  notebook.hidden = false;
})();
