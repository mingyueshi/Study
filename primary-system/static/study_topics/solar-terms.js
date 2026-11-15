/* 节气筛选、每节气一页的观察册与五题小挑战。正文由 Django 渲染。 */
(() => {
  'use strict';
  const hall = document.querySelector('.solar-hall');
  if (!hall) return;
  const get = id => document.getElementById(id);
  const cards = Array.from(hall.querySelectorAll('.solar-card'));
  const terms = new Map(cards.map(card => [card.id, {
    card,
    name: card.querySelector('h3').textContent,
    season: card.closest('.solar-season').id,
    search: card.textContent.toLocaleLowerCase(),
    prompt: card.querySelector('.solar-observation p').textContent,
  }]));
  const search = get('solar-search');
  const seasonButtons = hall.querySelectorAll('[data-season]');
  let season = 'all';

  function filterCards(writeURL = true) {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const term of terms.values()) {
      term.card.hidden = (season !== 'all' && season !== term.season) || !term.search.includes(query);
      if (!term.card.hidden) count += 1;
    }
    hall.querySelectorAll('.solar-season').forEach(section => {
      section.hidden = !section.querySelector('.solar-card:not([hidden])');
    });
    seasonButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.season === season)));
    get('solar-filter-status').textContent = `找到 ${count} / 24 张节气卡`;
    get('solar-empty').hidden = count !== 0;
    if (writeURL) {
      const url = new URL(location.href);
      url.hash = '';
      url.searchParams.delete('season');
      url.searchParams.delete('q');
      if (season !== 'all') url.searchParams.set('season', season);
      if (query) url.searchParams.set('q', search.value.trim());
      history.replaceState(null, '', url);
    }
  }

  function resetFilter() {
    season = 'all';
    search.value = '';
    filterCards();
  }

  function revealHash() {
    const target = get(location.hash.slice(1));
    if (!target || (!target.matches('.solar-card, .solar-season'))) return;
    if (target.hidden || target.closest('.solar-season').hidden) {
      season = 'all';
      search.value = '';
      filterCards(false);
      const url = new URL(location.href);
      url.searchParams.delete('season');
      url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
    target.scrollIntoView({block: 'start'});
    target.focus({preventScroll: true});
  }

  function restoreURL() {
    const params = new URLSearchParams(location.search);
    season = ['chun', 'xia', 'qiu', 'dong'].includes(params.get('season')) ? params.get('season') : 'all';
    search.value = (params.get('q') || '').slice(0, 80);
    filterCards(false);
    revealHash();
  }

  search.addEventListener('input', () => filterCards());
  seasonButtons.forEach(button => button.addEventListener('click', () => {
    season = button.dataset.season;
    filterCards();
  }));
  window.addEventListener('hashchange', revealHash);
  window.addEventListener('popstate', restoreURL);
  hall.querySelector('[data-action="reset"]').addEventListener('click', resetFilter);

  const storagePrefix = 'study_solar_note_v1:';
  const notebook = get('solar-notebook');
  const editor = get('solar-note-editor');
  const form = get('solar-note-form');
  let editingId = '';
  let loadedRaw = null;
  let initialForm = '';
  let conflictRaw;

  function storageFailure(message) {
    get('solar-storage-status').textContent = message;
    get('solar-status').textContent = message;
  }

  function readNote(id) {
    try {
      const raw = localStorage.getItem(storagePrefix + id);
      if (!raw) return null;
      const note = JSON.parse(raw);
      if (note?.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(note.date) ||
          typeof note.place !== 'string' || typeof note.text !== 'string') {
        throw new Error('invalid note');
      }
      return note;
    } catch {
      storageFailure('有一页笔记暂时读不到，或浏览器限制了存储。保存前请留意提示。');
      return null;
    }
  }

  function refreshNotes() {
    let count = 0;
    const list = get('solar-notebook-list');
    list.replaceChildren();
    for (const [id, term] of terms) {
      const note = readNote(id);
      term.card.querySelector('.solar-note-badge').textContent = note ? '已记录' : '未记录';
      if (!note) continue;
      count += 1;
      const item = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = term.name;
      const meta = document.createElement('p');
      meta.className = 'solar-note';
      meta.textContent = `${note.date} · ${note.place}`;
      const text = document.createElement('p');
      text.className = 'solar-note-text';
      text.textContent = note.text;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.dataset.note = id;
      edit.textContent = `修改${term.name}这一页`;
      item.append(title, meta, text, edit);
      list.append(item);
    }
    if (!count) {
      const empty = document.createElement('p');
      empty.textContent = '观察册还是空的。挑一张节气卡，照着「去观察」试一试，再点「记一笔」。';
      list.append(empty);
    }
    get('solar-note-count').textContent = `${count} / 24`;
    get('solar-export').disabled = count === 0;
  }

  function formSnapshot() {
    return JSON.stringify([form.elements.date.value, form.elements.place.value, form.elements.text.value]);
  }

  function openNote(id) {
    const term = terms.get(id);
    if (!term) return;
    editingId = id;
    const note = readNote(id);
    try { loadedRaw = localStorage.getItem(storagePrefix + id); } catch { loadedRaw = null; }
    const today = new Date();
    const date = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    form.elements.date.value = note?.date || date;
    form.elements.place.value = note?.place || '';
    form.elements.text.value = note?.text || '';
    initialForm = formSnapshot();
    conflictRaw = undefined;
    get('solar-save').textContent = '保存这一页';
    get('solar-save-status').textContent = '';
    get('solar-delete').hidden = !note;
    get('solar-note-title').textContent = `${term.name} · 我的观察`;
    get('solar-note-prompt').textContent = term.prompt;
    editor.showModal();
  }

  function closeDialog(dialog) {
    if (dialog === editor && formSnapshot() !== initialForm &&
        !window.confirm('这一页还有未保存的内容，确定离开吗？')) return;
    dialog.close();
  }

  hall.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeDialog(dialog);
    });
  });
  hall.addEventListener('click', event => {
    const button = event.target.closest('[data-note]');
    if (button) openNote(button.dataset.note);
  });
  hall.querySelector('[data-action="notebook"]').addEventListener('click', () => {
    refreshNotes();
    notebook.showModal();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const note = {
      version: 1, date: form.elements.date.value,
      place: form.elements.place.value.trim(), text: form.elements.text.value.trim(),
    };
    if (!note.place || !note.text) {
      get('solar-save-status').textContent = '写下观察地点和看到的现象，再保存吧。';
      return;
    }
    try {
      const current = localStorage.getItem(storagePrefix + editingId);
      if (current !== loadedRaw && current !== conflictRaw) {
        conflictRaw = current;
        get('solar-save-status').textContent = '另一页窗口刚修改过这份笔记。再次保存会用眼前的内容替换它，也可以关闭后重新打开查看。';
        get('solar-save').textContent = '仍然保存眼前的内容';
        return;
      }
      localStorage.setItem(storagePrefix + editingId, JSON.stringify(note));
      loadedRaw = JSON.stringify(note);
      initialForm = formSnapshot();
      conflictRaw = undefined;
      get('solar-save').textContent = '保存这一页';
      get('solar-save-status').textContent = '已保存，下一次打开这个浏览器还能看到。';
      get('solar-delete').hidden = false;
      refreshNotes();
    } catch {
      get('solar-save-status').textContent = '这次没能保存。浏览器存储可能已满或被限制，请先复制文字留存，再试一次。';
    }
  });
  get('solar-delete').addEventListener('click', () => {
    if (!window.confirm('确定删除这个节气的观察笔记吗？')) return;
    try {
      if (localStorage.getItem(storagePrefix + editingId) !== loadedRaw) {
        get('solar-save-status').textContent = '另一页窗口修改过这份笔记，请关闭后重新打开，再确认删除。';
        return;
      }
      localStorage.removeItem(storagePrefix + editingId);
      initialForm = formSnapshot();
      editor.close();
      refreshNotes();
    } catch {
      get('solar-save-status').textContent = '这次没能删除，请稍后再试。';
    }
  });
  window.addEventListener('storage', event => {
    if (event.key === null || event.key.startsWith(storagePrefix)) refreshNotes();
  });
  window.addEventListener('beforeunload', event => {
    if (editor.open && formSnapshot() !== initialForm) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  get('solar-export').addEventListener('click', () => {
    const pages = ['我的四季观察册'];
    for (const [id, term] of terms) {
      const note = readNote(id);
      if (note) pages.push(`${term.name}\n${note.date} · ${note.place}\n${note.text}`);
    }
    const url = URL.createObjectURL(new Blob(['\uFEFF' + pages.join('\n\n')], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = '我的四季观察册.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const challenges = JSON.parse(get('solar-challenges').textContent);
  const quiz = get('solar-challenge');
  let round = [];
  let questionIndex = 0;
  let wrong = [];
  let answered = false;

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const other = Math.floor(Math.random() * (i + 1));
      [result[i], result[other]] = [result[other], result[i]];
    }
    return result;
  }

  function showQuestion() {
    answered = false;
    const question = round[questionIndex];
    get('solar-quiz-progress').textContent = `第 ${questionIndex + 1} / ${round.length} 题`;
    get('solar-quiz-question').textContent = question.question;
    get('solar-quiz-feedback').textContent = '';
    get('solar-quiz-next').hidden = true;
    get('solar-quiz-reference').hidden = true;
    get('solar-quiz-next').textContent = questionIndex === round.length - 1 ? '看本轮结果 →' : '下一题 →';
    const options = get('solar-quiz-options');
    options.replaceChildren();
    shuffle(question.options.map((text, index) => ({text, index}))).forEach(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.answer = option.index;
      button.textContent = option.text;
      options.append(button);
    });
    get('solar-quiz-question').focus();
  }

  function startRound(pool) {
    round = shuffle(pool).slice(0, 5);
    questionIndex = 0;
    wrong = [];
    get('solar-quiz-round').hidden = false;
    get('solar-quiz-result').hidden = true;
    showQuestion();
  }

  hall.querySelector('[data-action="challenge"]').addEventListener('click', () => {
    quiz.showModal();
    if (!round.length) startRound(challenges);
  });
  get('solar-quiz-options').addEventListener('click', event => {
    const selected = event.target.closest('button[data-answer]');
    if (!selected || answered) return;
    answered = true;
    const question = round[questionIndex];
    const correct = Number(selected.dataset.answer) === question.answer;
    if (!correct) wrong.push(question);
    get('solar-quiz-options').querySelectorAll('button').forEach(button => {
      button.disabled = true;
      if (Number(button.dataset.answer) === question.answer) {
        button.classList.add('is-correct');
        button.textContent += ' ✓ 正确答案';
      } else if (button === selected) {
        button.classList.add('is-incorrect');
        button.textContent += ' · 再想一想';
      }
    });
    get('solar-quiz-feedback').textContent = (correct ? '答对了！' : '一起看看线索。') + question.explanation;
    const reference = get('solar-quiz-reference');
    reference.href = '#' + question.term;
    reference.textContent = `回${terms.get(question.term).name}卡看看 →`;
    reference.hidden = false;
    get('solar-quiz-next').hidden = false;
  });
  get('solar-quiz-reference').addEventListener('click', () => quiz.close());
  get('solar-quiz-next').addEventListener('click', () => {
    if (!answered) return;
    questionIndex += 1;
    if (questionIndex < round.length) {
      showQuestion();
      return;
    }
    get('solar-quiz-round').hidden = true;
    get('solar-quiz-result').hidden = false;
    get('solar-quiz-score').textContent = `这一轮答对 ${round.length - wrong.length} / ${round.length} 题`;
    get('solar-quiz-review').replaceChildren();
    wrong.forEach(question => {
      const item = document.createElement('li');
      item.textContent = `${question.question} ${question.explanation}`;
      get('solar-quiz-review').append(item);
    });
    get('solar-quiz-retry').hidden = wrong.length === 0;
    get('solar-quiz-score').focus();
  });
  get('solar-quiz-restart').addEventListener('click', () => startRound(challenges));
  get('solar-quiz-retry').addEventListener('click', () => startRound(wrong));

  let speaking = null;
  let speechRun = 0;
  function stopReading() {
    speechRun += 1;
    if (speaking) {
      speaking.textContent = '听诗句';
      speaking.setAttribute('aria-pressed', 'false');
      window.speechSynthesis?.cancel();
      speaking = null;
    }
  }
  hall.querySelectorAll('[data-read]').forEach(button => button.addEventListener('click', () => {
    const wasSpeaking = speaking === button;
    stopReading();
    if (wasSpeaking) return;
    const line = terms.get(button.dataset.read).card.querySelector('blockquote').textContent;
    speaking = button;
    const run = speechRun;
    button.textContent = '停止朗读';
    button.setAttribute('aria-pressed', 'true');
    if (!window.SpeechKit) {
      stopReading();
      button.textContent = '朗读暂不可用';
      return;
    }
    window.SpeechKit.speak(line, {
      lang: 'zh-CN', rate: 0.8,
      onend: () => { if (run === speechRun) stopReading(); },
      onerror: () => {
        if (run !== speechRun) return;
        stopReading();
        button.textContent = '朗读暂不可用';
      },
    });
  }));
  window.addEventListener('pagehide', stopReading);
  refreshNotes();
  hall.querySelectorAll('.solar-interactive').forEach(element => { element.hidden = false; });
  restoreURL();
})();
