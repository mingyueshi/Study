/* 内容、答案和解析来自 punctuation.json；判题不上传，也不改账号题库。 */
(function () {
  'use strict';
  const aliases = { ',': '，', '?': '？', '!': '！', ':': '：', ';': '；', '(': '（', ')': '）' };
  function normalize(value) {
    return String(value).replace(/\s/g, '').replace(/∅/g, '').replace(/[,?!:;()]/g, char => aliases[char]);
  }
  function hasAnswerVectors(question) {
    const { chunks, answers } = question;
    if (!Array.isArray(chunks) || chunks.length < 2 || Array.from(chunks).some(chunk => typeof chunk !== 'string')
      || !Array.isArray(answers) || !answers.length) return false;
    for (const answer of answers) {
      if (!Array.isArray(answer) || answer.length !== chunks.length - 1
        || Array.from(answer).some(token => typeof token !== 'string' || /[^，。？！、；：“”‘’《》（）—…]/u.test(token))) return false;
    }
    return true;
  }
  function check(question, values) {
    if (!hasAnswerVectors(question)) return { complete: false, correct: false, slots: [], invalid: true };
    if (values.length !== question.chunks.length - 1 || values.some(value => !String(value).trim())) {
      return { complete: false, correct: false, slots: [] };
    }
    const normalized = values.map(normalize);
    const vectors = question.answers.map(answer => answer.map(normalize));
    // 按完整答案向量判断，不能把不同合理答案的局部拼成一个错误组合。
    const scores = vectors.map(answer => answer.filter((token, i) => token === normalized[i]).length);
    const nearest = vectors[scores.indexOf(Math.max(...scores))];
    const slots = nearest.map((token, i) => token === normalized[i]);
    return { complete: true, correct: slots.every(Boolean), slots };
  }
  function restore(raw, questions) {
    const clean = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
    questions.forEach(question => {
      const record = raw[question.id];
      if (!record || record.revision !== question.revision) return;
      clean[question.id] = {
        revision: question.revision, independent: record.independent === true,
        assisted: record.assisted === true, revealed: record.revealed === true, wrong: record.wrong === true,
      };
    });
    return clean;
  }
  function recordAttempt(previous, question, correct) {
    const revealed = previous?.revealed === true;
    const independent = previous?.independent === true || (correct && !revealed);
    return { revision: question.revision, independent, assisted: !independent && (previous?.assisted === true || (correct && revealed)), revealed, wrong: !correct };
  }
  const api = { normalize, check, restore, recordAttempt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;
  const root = document.querySelector('.punctuation-lab');
  if (!root) return;
  const course = JSON.parse(document.getElementById('punctuation-data').textContent);
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text != null) element.textContent = text;
    if (className) element.className = className;
    return element;
  };

  $('[data-demo-controls]').hidden = false;
  $$('[data-demo]').forEach(button => button.addEventListener('click', () => {
    const variant = course.demo.variants.find(item => item.id === button.dataset.demo);
    $('[data-demo-sentence]').textContent = variant.text;
    $('[data-demo-meaning]').textContent = variant.meaning;
    $$('[data-demo]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));

  if ($('[data-usage-tools]')) {
    const cards = $$('[data-mark]');
    function filterMarks() {
      const group = $('[data-mark-group]').value;
      const search = $('[data-mark-search]').value.trim();
      cards.forEach(card => { card.hidden = Boolean((group && card.dataset.group !== group) || !card.textContent.includes(search)); });
      const count = cards.filter(card => !card.hidden).length;
      $('[data-mark-count]').textContent = count ? `共 ${count} 种标点` : '没有找到，换个词或分类试试。';
    }
    $('[data-mark-group]').addEventListener('change', filterMarks);
    $('[data-mark-search]').addEventListener('input', filterMarks);
    function revealHash() {
      const card = cards.find(item => '#' + item.id === location.hash);
      if (!card) return;
      $('[data-mark-group]').value = '';
      window.StudyChoices?.sync($('[data-mark-group]'));
      $('[data-mark-search]').value = '';
      filterMarks();
      card.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    window.addEventListener('hashchange', revealHash);
    $('[data-usage-tools]').hidden = false;
    filterMarks();
    revealHash();
  }

  if (!$('[data-practice]')) return;
  const questions = course.questions;
  const key = `punctuation_v1:${root.dataset.storageScope}`;
  let records = {};
  let storageAvailable = true;
  try { records = restore(JSON.parse(localStorage.getItem(key)), questions); } catch { storageAvailable = false; }
  const drafts = new Map();
  let markFilter = new URLSearchParams(location.search).get('mark');
  if (!course.marks.some(mark => mark.id === markFilter)) markFilter = null;
  let current = null;
  let pool = [];
  let activeInput = null;
  const select = $('[data-question-select]');
  const feedback = $('[data-feedback]');
  const reference = $('[data-reference]');
  const group = $('[data-practice-group]');
  const level = $('[data-practice-level]');
  const mode = $('[data-practice-mode]');
  const answerForm = $('[data-answer-form]');
  const invalidQuestion = '这道题的数据有误，暂时无法作答。';

  function updateProgress() {
    const values = Object.values(records);
    const independent = values.filter(item => item.independent).length;
    const assisted = values.filter(item => !item.independent && item.assisted).length;
    const wrong = values.filter(item => item.wrong).length;
    const seen = values.filter(item => item.revealed && !item.independent && !item.assisted).length;
    $('[data-progress]').textContent = `共 ${questions.length} 题 · 自己答对 ${independent} 题 · 看答案后练会 ${assisted} 题 · 仅看参考 ${seen} 题 · 待巩固 ${wrong} 题`;
    if (!storageAvailable) $('[data-storage-note]').textContent = '浏览器暂时不能保存记录，本页仍可继续练习；离开或刷新后记录可能丢失。';
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(records)); } catch { storageAvailable = false; }
    updateProgress();
  }
  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set('view', 'practice');
    if (current) url.searchParams.set('question', current.id);
    else url.searchParams.delete('question');
    if (markFilter) url.searchParams.set('mark', markFilter);
    else url.searchParams.delete('mark');
    history.replaceState(null, '', url);
  }
  function saveDraft() {
    if (current) drafts.set(current.id, $$('[data-gap]').map(input => input.value));
  }
  function clearFeedback() {
    feedback.textContent = '';
    delete feedback.dataset.result;
    reference.hidden = true;
    $$('[data-gap]').forEach(input => { delete input.dataset.result; input.removeAttribute('aria-invalid'); });
  }
  function showReference() {
    reference.replaceChildren(node('p', current.answers.length > 1 ? '本题可接受的写法' : '按本题语境的参考写法'));
    current.references.forEach(sentence => {
      const line = node('p');
      line.append(node('strong', sentence));
      reference.append(line);
    });
    reference.append(node('p', current.explanation));
    reference.hidden = false;
  }
  function questionLabel(question) {
    const record = records[question.id];
    const status = record?.wrong ? '待巩固' : record?.independent ? '自己答对' : record?.assisted ? '看后练会' : record?.revealed ? '看过参考' : '未练';
    return `${questions.indexOf(question) + 1}. ${question.title} · ${status}`;
  }
  function refreshOptions() {
    [...select.options].forEach(option => {
      const question = questions.find(item => item.id === option.value);
      option.textContent = questionLabel(question);
    });
  }
  function renderQuestion(id, focus = false) {
    current = pool.find(question => question.id === id) || pool[0] || null;
    activeInput = null;
    clearFeedback();
    $('[data-exercise]').hidden = !current;
    $('[data-empty]').hidden = Boolean(current);
    select.disabled = !current;
    const index = pool.indexOf(current);
    $('[data-position]').textContent = current ? `本组 ${index + 1} / ${pool.length}` : '本组 0 题';
    $('[data-previous]').disabled = index <= 0;
    $('[data-next]').disabled = !current || index >= pool.length - 1;
    if (!current) { updateUrl(); return; }
    select.value = current.id;
    const labels = [
      course.groups.find(item => item.id === current.group)?.label,
      course.levels.find(item => item.id === current.level)?.label,
    ].filter(Boolean);
    $('[data-question-level]').textContent = labels.join(' / ');
    $('[data-question-title]').textContent = current.title;
    $('[data-context]').textContent = current.context;
    const sentence = $('[data-sentence]');
    sentence.replaceChildren();
    const related = $('[data-related]');
    answerForm.hidden = !hasAnswerVectors(current);
    if (answerForm.hidden) {
      related.hidden = true;
      feedback.textContent = invalidQuestion;
      updateUrl();
      return;
    }
    current.chunks.forEach((chunk, i) => {
      sentence.append(document.createTextNode(chunk));
      if (i === current.chunks.length - 1) return;
      const input = node('input');
      input.type = 'text';
      input.maxLength = 8;
      input.placeholder = `空 ${i + 1}`;
      input.setAttribute('aria-label', `第 ${i + 1} 个空的标点`);
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');
      input.dataset.gap = String(i);
      input.value = drafts.get(current.id)?.[i] || '';
      input.addEventListener('focus', () => { activeInput = input; });
      input.addEventListener('input', () => { clearFeedback(); saveDraft(); });
      sentence.append(input);
    });
    activeInput = $('[data-gap]');
    related.replaceChildren(document.createTextNode('回看用法：'));
    const markIds = Array.isArray(current.mark_ids) ? current.mark_ids : [];
    const marks = markIds.map(id => course.marks.find(mark => mark.id === id)).filter(Boolean);
    related.hidden = !marks.length;
    marks.forEach((mark, i) => {
      const link = node('a', mark.name);
      link.href = `?view=usage#mark-${mark.id}`;
      if (i) related.append(document.createTextNode(' · '));
      related.append(link);
    });
    if (records[current.id]?.revealed) feedback.textContent = '这题已看过参考。继续练会后，记录为「看答案后练会」。';
    if (records[current.id]?.independent) feedback.textContent = '这题已经自己答对过，可以再练一遍。';
    updateUrl();
    if (focus) $('[data-question-title]').focus({ preventScroll: true });
  }
  function filterQuestions(preferredId) {
    pool = questions.filter(question => (!group.value || question.group === group.value)
      && (!level.value || question.level === level.value)
      && (!markFilter || (Array.isArray(question.mark_ids) && question.mark_ids.includes(markFilter)))
      && (mode.value !== 'wrong' || records[question.id]?.wrong));
    select.replaceChildren(...pool.map(question => {
      const option = node('option', questionLabel(question));
      option.value = question.id;
      return option;
    }));
    $('[data-clear-filter]').hidden = !markFilter;
    if (markFilter) $('[data-clear-filter]').textContent = `取消「${course.marks.find(mark => mark.id === markFilter).name}」筛选`;
    renderQuestion(preferredId);
  }
  ['，', '。', '？', '！', '、', '；', '：', '“', '”', '‘', '’', '《', '》', '（', '）', '——', '……', '∅', '清空'].forEach(token => {
    const button = node('button', token === '∅' ? '不加 ∅' : token);
    button.type = 'button';
    button.dataset.token = token;
    const names = { '“': '前双引号', '”': '后双引号', '‘': '前单引号', '’': '后单引号', '《': '前书名号', '》': '后书名号', '（': '前括号', '）': '后括号', '∅': '不加标点', '清空': '清空当前空格' };
    const mark = course.marks.find(item => item.symbol === token);
    button.setAttribute('aria-label', names[token] || mark?.name || token);
    button.addEventListener('click', () => {
      if (!activeInput || !current) return;
      clearFeedback();
      if (token === '清空') activeInput.value = '';
      else if (token === '∅') activeInput.value = '∅';
      else activeInput.value = ((activeInput.value === '∅' ? '' : activeInput.value) + token).slice(0, 8);
      saveDraft();
      activeInput.focus({ preventScroll: true });
    });
    $('[data-palette]').append(button);
  });
  answerForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!current) return;
    const inputs = $$('[data-gap]');
    const result = check(current, inputs.map(input => input.value));
    clearFeedback();
    if (result.invalid) {
      feedback.textContent = invalidQuestion;
      return;
    }
    if (!result.complete) {
      feedback.textContent = '还有空格没填写。不需要标点的地方，请点「不加」。';
      inputs.find(input => !input.value.trim())?.focus({ preventScroll: true });
      return;
    }
    inputs.forEach((input, i) => {
      input.dataset.result = result.slots[i] ? 'correct' : 'wrong';
      input.setAttribute('aria-invalid', String(!result.slots[i]));
    });
    records[current.id] = recordAttempt(records[current.id], current, result.correct);
    feedback.dataset.result = result.correct ? 'correct' : 'wrong';
    const wrongSlots = result.slots.flatMap((correct, i) => correct ? [] : [i + 1]).join('、');
    feedback.textContent = result.correct
      ? `标点合适！${records[current.id].independent ? '已记录自己答对。' : '已记录看答案后练会。'}${current.explanation}`
      : `再想一想，第 ${wrongSlots} 个空需要调整。${current.hint}`;
    if (result.correct) showReference();
    save();
    refreshOptions();
    // 待巩固组在本次浏览中保持稳定，避免答对后自动跳题、丢失解析。
  });
  $('[data-reveal]').addEventListener('click', () => {
    if (!current) return;
    if (!hasAnswerVectors(current)) {
      clearFeedback();
      feedback.textContent = invalidQuestion;
      return;
    }
    const previous = records[current.id] || {};
    records[current.id] = { ...previous, revision: current.revision, revealed: true };
    save();
    refreshOptions();
    feedback.textContent = '先看理由，再自己填一次。查看参考不计为自己答对。';
    delete feedback.dataset.result;
    showReference();
  });
  $('[data-hint]').addEventListener('click', () => {
    if (!current) return;
    feedback.textContent = current.hint;
    delete feedback.dataset.result;
  });
  $('[data-reset]').addEventListener('click', () => {
    if (!current) return;
    drafts.delete(current.id);
    renderQuestion(current.id);
    activeInput?.focus({ preventScroll: true });
  });
  select.addEventListener('change', () => { saveDraft(); renderQuestion(select.value, true); });
  [group, level, mode].forEach(control => control.addEventListener('change', () => { saveDraft(); filterQuestions(current?.id); }));
  $('[data-clear-filter]').addEventListener('click', () => { saveDraft(); markFilter = null; filterQuestions(current?.id); });
  $('[data-previous]').addEventListener('click', () => {
    const id = pool[pool.indexOf(current) - 1]?.id;
    if (id) { saveDraft(); renderQuestion(id, true); }
  });
  $('[data-next]').addEventListener('click', () => {
    const id = pool[pool.indexOf(current) + 1]?.id;
    if (id) { saveDraft(); renderQuestion(id, true); }
  });
  $('[data-retry]').addEventListener('click', () => {
    saveDraft();
    group.value = ''; level.value = ''; markFilter = null; mode.value = 'wrong';
    for (const control of [group, level, mode]) window.StudyChoices?.sync(control);
    questions.filter(question => records[question.id]?.wrong).forEach(question => drafts.delete(question.id));
    filterQuestions();
  });
  $('[data-practice]').hidden = false;
  updateProgress();
  filterQuestions(new URLSearchParams(location.search).get('question'));
}());
