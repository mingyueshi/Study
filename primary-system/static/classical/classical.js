/* 古文精读：内容来自已校验文件；自测与标记仅存当前浏览器。 */
(() => {
  'use strict';

  function maskText(text, hints, mode) {
    if (mode === 'full') return text;
    const visible = new Set();
    if (mode === 'keywords') {
      for (const hint of hints) {
        let offset = text.indexOf(hint);
        while (offset !== -1) {
          for (let i = offset; i < offset + hint.length; i++) visible.add(i);
          offset = text.indexOf(hint, offset + hint.length);
        }
      }
    }
    let index = 0;
    return Array.from(text, char => {
      const show = visible.has(index) || !/[\p{L}\p{N}]/u.test(char);
      index += char.length;
      return show ? char : '□';
    }).join('');
  }

  function cleanProgress(raw, article) {
    const clean = {answers: {}, selfchecks: []};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
    const answers = raw.answers && typeof raw.answers === 'object' ? raw.answers : {};
    for (const question of article.questions) {
      if (question.type === 'choice') {
        const value = answers[question.id];
        if (Number.isInteger(value) && value >= 0 && value < question.choices.length) clean.answers[question.id] = value;
      } else if (Array.isArray(raw.selfchecks) && raw.selfchecks.includes(question.id)) clean.selfchecks.push(question.id);
    }
    return clean;
  }

  function sectionSentences(article, id) {
    if (!id) return article.sentences;
    const section = (article.sections || []).find(row => row.id === id);
    return section ? article.sentences.filter(row => section.sentences.includes(row.id)) : [];
  }

  if (typeof module === 'object' && module.exports) module.exports = {maskText, cleanProgress, sectionSentences};
  if (typeof document === 'undefined') return;

  let storageWorks = true;
  function getStored(key) {
    try { return localStorage.getItem(key); } catch (_) { storageWorks = false; return null; }
  }
  function putStored(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (_) { storageWorks = false; return false; }
  }
  const markKey = (id, revision) => `classical_read_v1:${id}:${revision}`;
  for (const card of document.querySelectorAll('[data-article-card]')) {
    if (getStored(markKey(card.dataset.articleCard, card.dataset.revision)) === 'true') card.querySelector('[data-card-mark]').textContent = '已复习 ✓';
  }

  const reader = document.querySelector('[data-classical-reader]');
  if (!reader) return;
  let article;
  try { article = JSON.parse(document.getElementById('classical-data').textContent); } catch (_) { return; }
  const unitLabel = article.unit_label === '则' ? '则' : '句';
  const all = selector => Array.from(reader.querySelectorAll(selector));
  const one = selector => reader.querySelector(selector);
  all('[data-js-only]').forEach(element => { element.hidden = false; });
  const storageStatus = one('[data-storage-status]');
  function updateStorageStatus() {
    if (!storageWorks) storageStatus.textContent = '浏览器暂不允许保存，本页仍可使用；离开后不会保留标记与自测。';
  }

  function selectLine(id, focus) {
    all('[data-sentence]').forEach(element => element.classList.toggle('is-selected', element.dataset.sentence === id));
    const line = document.getElementById(`line-${id}`);
    if (focus && line) { line.scrollIntoView({block: 'start'}); line.focus({preventScroll: true}); }
  }
  function openNote(id, focus) {
    const note = document.getElementById(id);
    if (!note?.classList.contains('cw-note')) return false;
    note.open = true;
    selectLine(note.closest('[data-sentence]').dataset.sentence, false);
    if (focus) { note.scrollIntoView({block: 'nearest'}); note.querySelector('summary').focus({preventScroll: true}); }
    return true;
  }
  function restoreHash() {
    try { return openNote(decodeURIComponent(location.hash.slice(1)), false); } catch (_) { return false; }
  }
  all('[data-word]').forEach(link => {
    const id = link.getAttribute('aria-controls');
    const note = document.getElementById(id);
    note.addEventListener('toggle', () => link.setAttribute('aria-expanded', String(note.open)));
    link.addEventListener('click', event => {
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      openNote(id, true);
    });
  });
  window.addEventListener('hashchange', restoreHash);
  window.addEventListener('popstate', restoreHash);
  one('[data-show-breaks]').addEventListener('change', event => all('[data-breaks]').forEach(element => { element.hidden = !event.target.checked; }));
  one('[data-show-referents]').addEventListener('change', event => reader.classList.toggle('show-referents', event.target.checked));
  const translations = all('.cw-translation');
  const expand = one('[data-expand-translations]');
  const updateExpand = () => { expand.textContent = translations.every(element => element.open) ? '收起全部译文' : '展开全部译文'; };
  translations.forEach(element => element.addEventListener('toggle', updateExpand));
  expand.addEventListener('click', () => { const open = !translations.every(element => element.open); translations.forEach(element => { element.open = open; }); updateExpand(); });
  all('[data-evidence]').forEach(link => link.addEventListener('click', () => {
    const id = link.dataset.evidence;
    selectLine(id, true);
    document.getElementById(`line-${id}`).querySelector('.cw-translation').open = true;
  }));

  let maskMode = 'full';
  const revealed = new Set();
  function renderRecall() {
    for (const sentence of article.sentences) {
      const line = one(`[data-recall="${sentence.id}"]`);
      line.querySelector('[data-recall-text]').textContent = maskText(sentence.text, sentence.hints, revealed.has(sentence.id) ? 'full' : maskMode);
      const button = line.querySelector('[data-reveal]');
      button.disabled = maskMode === 'full';
      button.textContent = maskMode === 'full' ? '原文已显示' : revealed.has(sentence.id) ? `重新遮住这一${unitLabel}` : `揭开这一${unitLabel}`;
      button.setAttribute('aria-pressed', String(revealed.has(sentence.id)));
    }
    all('[data-mask]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mask === maskMode)));
    one('[data-recall-status]').textContent = maskMode === 'full' ? '当前显示完整原文。' : maskMode === 'keywords' ? '只留下关键词，标点也会帮助你回想。' : '文字已经遮住，试着按标点回忆。';
  }
  all('[data-mask]').forEach(button => button.addEventListener('click', () => { maskMode = button.dataset.mask; revealed.clear(); renderRecall(); }));
  all('[data-reveal]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.reveal;
    if (revealed.has(id)) revealed.delete(id); else revealed.add(id);
    renderRecall();
  }));
  renderRecall();

  for (const [selector, attribute] of [['[data-recite-section]', 'data-recall'], ['[data-practice-section]', 'data-question']]) {
    const select = one(selector);
    if (!select) continue;
    select.value = reader.dataset.initialSection || '';
    function filterSection() {
      const ids = new Set(sectionSentences(article, select.value).map(row => row.id));
      const visible = attribute === 'data-question' ? article.questions.filter(row => ids.has(row.sentence)).map(row => row.id) : [...ids];
      all(`[${attribute}]`).forEach(element => { element.hidden = !visible.includes(element.getAttribute(attribute)); });
    }
    select.addEventListener('change', filterSection);
    filterSection();
  }

  const quizKey = `classical_quiz_v1:${article.id}:${article.revision}`;
  let rawProgress;
  try { rawProgress = JSON.parse(getStored(quizKey) || 'null'); } catch (_) { rawProgress = null; }
  let progress = cleanProgress(rawProgress, article);
  const choiceQuestions = article.questions.filter(question => question.type === 'choice');
  function renderScore() {
    const done = Object.keys(progress.answers).length;
    const correct = choiceQuestions.filter(question => progress.answers[question.id] === question.answer).length;
    one('[data-quiz-score]').textContent = `选择题已检查 ${done}/${choiceQuestions.length} 题，目前答对 ${correct} 题；讲述题已自查 ${progress.selfchecks.length} 题。`;
  }
  function renderFeedback(question) {
    const given = progress.answers[question.id];
    const feedback = one(`[data-feedback="${question.id}"]`);
    if (!Number.isInteger(given)) { feedback.textContent = ''; delete feedback.dataset.correct; return; }
    const correct = given === question.answer;
    feedback.dataset.correct = String(correct);
    feedback.textContent = (correct ? '答对了！' : '再回原文找找线索。') + question.explanation;
    const input = one(`[data-quiz="${question.id}"] input[value="${given}"]`);
    if (input) input.checked = true;
  }
  function saveProgress() { putStored(quizKey, JSON.stringify(progress)); updateStorageStatus(); renderScore(); }
  for (const question of choiceQuestions) {
    const form = one(`[data-quiz="${question.id}"]`);
    renderFeedback(question);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = form.querySelector('input:checked');
      if (!selected) { one(`[data-feedback="${question.id}"]`).textContent = '先选一个你认为合适的答案。'; form.querySelector('input').focus(); return; }
      progress.answers[question.id] = Number(selected.value);
      renderFeedback(question); saveProgress();
    });
    form.addEventListener('change', () => { const feedback = one(`[data-feedback="${question.id}"]`); feedback.textContent = '选好了，可以再检查一次。'; delete feedback.dataset.correct; });
  }
  all('[data-selfcheck]').forEach(input => {
    input.checked = progress.selfchecks.includes(input.dataset.selfcheck);
    if (input.checked) input.closest('details').open = true;
    input.addEventListener('change', () => {
      progress.selfchecks = all('[data-selfcheck]').filter(element => element.checked).map(element => element.dataset.selfcheck);
      saveProgress();
    });
  });
  one('[data-reset-quiz]').addEventListener('click', () => {
    progress = {answers: {}, selfchecks: []};
    all('[data-quiz]').forEach(form => form.reset());
    all('[data-selfcheck]').forEach(input => { input.checked = false; });
    all('[data-answer]').forEach(element => { element.open = false; });
    choiceQuestions.forEach(renderFeedback); saveProgress();
  });
  renderScore();

  const mark = one('[data-toggle-read]');
  let read = getStored(markKey(article.id, article.revision)) === 'true';
  function renderMark() { mark.setAttribute('aria-pressed', String(read)); mark.textContent = read ? '已复习 ✓ 再点可取消' : '标记为已复习'; }
  mark.addEventListener('click', () => { read = !read; putStored(markKey(article.id, article.revision), String(read)); renderMark(); updateStorageStatus(); });
  renderMark(); updateStorageStatus();

  let speechToken = 0, speechTimer = null;
  const speechStatus = one('[data-speech-status]');
  const rate = one('[data-speech-rate]'), repeat = one('[data-speech-repeat]');
  const speechKey = 'classical_speech_v1';
  try {
    const prefs = JSON.parse(getStored(speechKey) || '{}');
    if (['0.65', '0.85', '1'].includes(String(prefs.rate))) rate.value = String(prefs.rate);
    if (['1', '2', '3'].includes(String(prefs.repeat))) repeat.value = String(prefs.repeat);
  } catch (_) { /* 使用默认值 */ }
  function stopSpeech(message) {
    speechToken++;
    clearTimeout(speechTimer); speechTimer = null;
    try { window.speechSynthesis?.cancel(); } catch (_) { /* 取消失败不影响阅读 */ }
    all('[data-sentence]').forEach(element => element.classList.remove('is-speaking'));
    if (message) speechStatus.textContent = message;
  }
  function startSpeech(id, section) {
    stopSpeech();
    if (!window.SpeechKit || !window.speechSynthesis) { speechStatus.textContent = '这台设备暂不支持朗读，可以看注音自己读。'; return; }
    const token = speechToken;
    const sentences = id ? article.sentences.filter(sentence => sentence.id === id) : sectionSentences(article, section);
    const times = Number(repeat.value);
    let index = 0, pass = 1;
    function next() {
      if (token !== speechToken) return;
      if (index >= sentences.length) { stopSpeech('朗读完成，轮到你试着读了。'); return; }
      const sentence = sentences[index];
      all('[data-sentence]').forEach(element => element.classList.toggle('is-speaking', element.dataset.sentence === sentence.id));
      speechStatus.textContent = `正在读第 ${article.sentences.indexOf(sentence) + 1} ${unitLabel} · 第 ${pass}/${times} 遍。`;
      window.SpeechKit.speak(sentence.text, {
        lang: 'zh-CN', rate: Number(rate.value),
        onend() {
          if (token !== speechToken) return;
          if (pass < times) pass++; else { pass = 1; index++; }
          speechTimer = setTimeout(next, 650);
        },
        onerror() { if (token === speechToken) stopSpeech('这次没有读出来，请检查设备语音后再试；仍可看注音自己读。'); },
      });
    }
    next();
  }
  all('[data-speak]').forEach(button => button.addEventListener('click', () => startSpeech(button.dataset.speak)));
  all('[data-speak-section]').forEach(button => button.addEventListener('click', () => startSpeech(null, button.dataset.speakSection)));
  one('[data-speak-all]').addEventListener('click', () => startSpeech());
  one('[data-stop-speech]').addEventListener('click', () => stopSpeech('已停止朗读。'));
  for (const select of [rate, repeat]) select.addEventListener('change', () => {
    stopSpeech('设置已更新，可以重新开始朗读。');
    putStored(speechKey, JSON.stringify({rate: rate.value, repeat: repeat.value})); updateStorageStatus();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeech('页面已切换，朗读已停止。'); });
  window.addEventListener('pagehide', () => stopSpeech());
  document.addEventListener('keydown', event => { if (event.key === 'Escape') stopSpeech('已停止朗读。'); });

  requestAnimationFrame(() => {
    if (restoreHash()) return;
    if (reader.dataset.initialLine) selectLine(reader.dataset.initialLine, true);
    else if (!location.hash && ['recite', 'practice'].includes(reader.dataset.initialMode)) document.getElementById(reader.dataset.initialMode).scrollIntoView({block: 'start'});
  });
})();
