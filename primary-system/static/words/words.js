/* 场景单词前端：legacy words-app 体验移植。服务端下发的 state 为唯一数据源，
   场景切换/搜索在本地完成；「标记掌握」走 API（游客挂会话、登录挂账号）。 */
'use strict';

(() => {
  const stateEl = document.getElementById('words-state');
  if (!stateEl) return;
  const state = JSON.parse(stateEl.textContent);
  let curUnit = state.scenarios[0] ? state.scenarios[0].id : null;
  let query = '';

  const $ = (id) => document.getElementById(id);
  const chipsEl = $('words-chips'), cardsEl = $('words-cards'), navCountEl = $('words-nav-count'),
        searchEl = $('words-search'), playBtn = $('words-play-btn');

  const WORDS_BY_ID = new Map(state.words.map((w) => [w.id, w]));
  const scenarioOf = (word) => word.scenario;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => (
    {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  function markWord(wordId, learned) {
    return fetch('/words/api/learn/', {
      method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf()},
      body: JSON.stringify({word_id: wordId, learned}),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { console.warn('标记失败', data.error); return null; }
      const word = WORDS_BY_ID.get(wordId);
      if (word) word.learned = data.learned;
      for (const scenario of state.scenarios) {
        scenario.learned = state.words.filter((w) => w.scenario === scenario.id && w.learned).length;
      }
      render();
      if (learned && window.SpeechKit) window.SpeechKit.speak('Great!', { rate: 0.9 });
      return data;
    });
  }

  function picHTML(word) {
    if (word.emoji) return `<span class="pic-emoji">${escapeHtml(word.emoji)}</span>`;
    return `<span class="pic-fallback">${escapeHtml(word.en.slice(0, 2))}</span>`;
  }

  function cardHTML(word, showUnitTag) {
    const unit = state.scenarios.find((s) => s.id === word.scenario) || {};
    const parts = (word.segments || []).map((part) =>
      `<button class="part" type="button" data-say="${escapeHtml(part.say || part.t)}" aria-label="跟读 ${escapeHtml(part.t)}"><b>${escapeHtml(part.t)}</b><i>${escapeHtml(part.d)}</i></button>`).join('<span class="plus">＋</span>');
    const related = (word.related || []).map((r) =>
      `<button class="rel" type="button" data-say="${escapeHtml(r)}" aria-label="朗读 ${escapeHtml(r)}">${escapeHtml(r)}</button>`).join('');
    const unitTag = showUnitTag && unit.zh
      ? `<span class="unit-tag">${escapeHtml(unit.emoji || '')} ${escapeHtml(unit.zh)}</span>` : '';
    return `<article class="wcard${word.learned ? ' learned' : ''}" data-word="${escapeHtml(word.id)}" style="--c:${escapeHtml(unit.color || '#4d96ff')}">${unitTag}` +
      `<button class="learn-btn${word.learned ? ' on' : ''}" type="button" data-learn="${escapeHtml(word.id)}" aria-pressed="${word.learned}">✓</button>` +
      `<div class="wtop"><button class="pic" type="button" data-say="${escapeHtml(word.en)}" aria-label="朗读 ${escapeHtml(word.en)}">${picHTML(word)}</button>` +
      `<div class="winfo"><p class="wline"><span class="word">${escapeHtml(word.en)}</span> <button class="say" type="button" data-say="${escapeHtml(word.en)}" aria-label="朗读">🔊</button></p>` +
      `<p class="ipa">${escapeHtml(word.ipa)}</p><p class="zh">${escapeHtml(word.zh)}</p></div></div>` +
      (parts ? `<div class="wsec"><span class="seclabel">记</span><span class="parts">${parts}</span></div>` : '') +
      (word.memo ? `<p class="memo">💡 ${escapeHtml(word.memo)}</p>` : '') +
      (related ? `<div class="wsec"><span class="seclabel">联</span><span class="rels">${related}</span></div>` : '') +
      '</article>';
  }

  function matchSearch(word) {
    if (!query) return true;
    const unit = state.scenarios.find((s) => s.id === word.scenario) || {};
    return word.en.toLowerCase().includes(query) || (word.zh || '').includes(query) ||
           (unit.zh || '').includes(query) || (unit.name || '').toLowerCase().includes(query);
  }

  function render() {
    const searching = Boolean(query);
    const shown = state.words.filter(matchSearch);
    const unit = state.scenarios.find((s) => s.id === curUnit) || state.scenarios[0];

    chipsEl.innerHTML = state.scenarios.map((s) =>
      `<button class="chip${s.id === curUnit && !searching ? ' on' : ''}" type="button" data-unit="${s.id}" style="--c:${escapeHtml(s.color)}">` +
      `<span class="chip-emoji">${escapeHtml(s.emoji)}</span><span class="chip-name">${escapeHtml(s.zh)}</span>` +
      `<span class="chip-num${s.total && s.learned === s.total ? ' full' : ''}">${s.learned}/${s.total}</span></button>`).join('');
    navCountEl.textContent = `${state.scenarios.length} 个场景 · ${state.words.length} 词`;

    if (searching) {
      const hits = shown.length;
      cardsEl.innerHTML = hits
        ? `<p class="search-head">找到 ${hits} 个单词</p><div class="wgrid">${shown.map((w) => cardHTML(w, true)).join('')}</div>`
        : '<div class="empty">🐤 没找到，换个词试试？</div>';
    } else if (unit) {
      const learned = state.words.filter((w) => w.scenario === unit.id && w.learned).length;
      cardsEl.innerHTML = `<div class="unit-head"><span class="unit-emoji">${escapeHtml(unit.emoji)}</span>` +
        `<h1>${escapeHtml(unit.name)} · ${escapeHtml(unit.zh)}</h1><p>已掌握 ${learned} / ${unit.total} 词</p></div>` +
        `<div class="wgrid">${state.words.filter((w) => w.scenario === unit.id).map((w) => cardHTML(w, false)).join('')}</div>`;
    } else {
      cardsEl.innerHTML = '<div class="empty">场景正在准备中。</div>';
    }
    playBtn.hidden = searching || !unit;
  }

  cardsEl.addEventListener('click', (event) => {
    const learnButton = event.target.closest('[data-learn]');
    if (!learnButton) return;
    event.preventDefault();
    learnButton.disabled = true;
    markWord(learnButton.dataset.learn, !WORDS_BY_ID.get(learnButton.dataset.learn).learned)
      .finally(() => { learnButton.disabled = false; });
  });

  chipsEl.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-unit]');
    if (!chip) return;
    event.preventDefault();
    curUnit = chip.dataset.unit;
    query = '';
    searchEl.value = '';
    if (window.TTS) window.TTS.stopSequence();
    render();
  });

  searchEl.addEventListener('input', () => {
    query = searchEl.value.trim().toLowerCase();
    if (query && window.TTS) window.TTS.stopSequence();
    render();
  });

  render();
})();
