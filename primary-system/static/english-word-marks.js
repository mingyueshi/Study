(() => {
  'use strict';

  const grid = document.getElementById('english-cards');
  const toolbar = document.getElementById('english-word-filters');
  const marks = JSON.parse(document.getElementById('english-word-marks').textContent);
  const feedback = document.getElementById('english-word-feedback');
  const empty = document.getElementById('english-word-empty');
  const play = document.getElementById('tts-unit-play');
  const filters = Array.from(toolbar.querySelectorAll('[data-word-filter]'));
  const cards = Array.from(grid.querySelectorAll('[data-word-id]'));
  const csrfToken = grid.dataset.csrfToken;
  const storagePrefix = 'primary_english_word_mark_v1:';
  const labels = { mastered: ['标记掌握', '已掌握'], tricky: ['标记易错', '已标易错'] };
  let activeFilter = filters[0];

  function guestStatus(card) {
    try {
      const saved = JSON.parse(localStorage.getItem(storagePrefix + card.dataset.wordId));
      const mark = marks[card.dataset.wordId];
      if (saved?.status === 'tricky') return 'tricky';
      if (saved?.status === 'mastered' && mark.available
          && JSON.stringify(saved.linkIds) === JSON.stringify(mark.presentation.map(link => link.link_id))) return 'mastered';
    } catch (error) { /* 浏览器存储不可读时按未标记显示。 */ }
    return 'new';
  }

  function render() {
    const counts = { all: cards.length, mastered: 0, tricky: 0, unmarked: 0 };
    const selected = activeFilter.dataset.wordFilter;
    let visibilityChanged = false;
    for (const card of cards) {
      const { wordStatus } = card.dataset;
      const category = wordStatus === 'mastered' || wordStatus === 'tricky' ? wordStatus : 'unmarked';
      counts[category]++;
      const hidden = selected !== 'all' && selected !== category;
      visibilityChanged ||= hidden !== card.hidden;
      if (hidden && card.contains(document.activeElement)) activeFilter.focus();
      card.hidden = hidden;
      for (const button of card.querySelectorAll('[data-word-mark]')) {
        const pressed = wordStatus === button.dataset.wordMark;
        button.setAttribute('aria-pressed', String(pressed));
        button.textContent = labels[button.dataset.wordMark][Number(pressed)];
      }
    }
    for (const filter of filters) {
      filter.setAttribute('aria-pressed', String(filter === activeFilter));
      filter.querySelector('span').textContent = counts[filter.dataset.wordFilter];
    }
    const visible = counts[selected];
    empty.hidden = visible > 0;
    if (visibilityChanged) {
      window.TTS?.resetSequence(visible ? '已更新朗读范围，点击开始连读。' : '当前筛选下没有可连读的单词。');
    }
    play.disabled = visible === 0 || !('speechSynthesis' in window);
    return visible;
  }

  async function saveMark(card, status) {
    const { wordId, progressUrl } = card.dataset;
    const mark = marks[wordId];
    const { revision, presentation, available } = mark;
    if (status === 'mastered' && !available) throw new Error('这个单词的词义待核对，暂时无法标记已掌握。');
    if (!progressUrl) {
      try {
        if (status === 'new') localStorage.removeItem(storagePrefix + wordId);
        else localStorage.setItem(storagePrefix + wordId, JSON.stringify({ status, linkIds: presentation.map(link => link.link_id) }));
      } catch (error) {
        throw new Error('无法保存标记，请检查浏览器的存储设置。');
      }
      return status;
    }
    const response = await fetch(progressUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ revision, status, presentation }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || '保存失败，请刷新后重试。');
    mark.revision = data.revision;
    return data.effective_status;
  }

  grid.addEventListener('click', async event => {
    const button = event.target.closest('[data-word-mark]');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    const card = button.closest('[data-word-id]');
    const status = card.dataset.wordStatus === button.dataset.wordMark ? 'new' : button.dataset.wordMark;
    const errorLine = card.querySelector('.word-mark-error');
    const buttons = card.querySelectorAll('[data-word-mark]');
    for (const action of buttons) action.setAttribute('aria-disabled', 'true');
    errorLine.textContent = '';
    try {
      card.dataset.wordStatus = await saveMark(card, status);
      render();
      feedback.textContent = `${card.dataset.saySeq} ${status === 'new' ? '已取消标记' : labels[status][1]}`;
    } catch (error) {
      errorLine.textContent = error instanceof TypeError ? '连接失败，请重试。' : error.message;
    } finally {
      for (const action of buttons) action.removeAttribute('aria-disabled');
    }
  });

  for (const filter of filters) {
    filter.addEventListener('click', () => {
      activeFilter = filter;
      feedback.textContent = `显示 ${render()} 个单词`;
    });
  }

  for (const card of cards) {
    if (!csrfToken) card.dataset.wordStatus = guestStatus(card);
    card.querySelector('.word-mark-actions').hidden = false;
  }
  if (!csrfToken) window.addEventListener('storage', event => {
    if (event.key && !event.key.startsWith(storagePrefix)) return;
    for (const card of cards) card.dataset.wordStatus = guestStatus(card);
    render();
  });
  render();
  toolbar.hidden = false;
})();
