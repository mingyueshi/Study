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
        searchEl = $('words-search'), playBtn = $('words-play-btn'), feedbackEl = $('words-feedback');

  const WORDS_BY_ID = new Map(state.words.map((w) => [w.id, w]));
  const scenarioOf = (word) => word.scenario;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => (
    {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  function showFeedback(message, failed = false) {
    feedbackEl.textContent = message;
    feedbackEl.classList.toggle('error', failed);
  }

  async function markWord(wordId, learned) {
    showFeedback('正在保存掌握状态……');
    const selected = WORDS_BY_ID.get(wordId);
    let response, data;
    try {
      response = await fetch('/words/api/learn/', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf()},
        body: JSON.stringify({schema_version: 3, chinese_version_id: selected.chinese_version_id, presentation_revision: selected.presentation_revision, target_id: selected.target_id, revision: selected.revision, learned}),
      });
      data = await response.json().catch(() => ({}));
    } catch (error) {
      showFeedback('连接中断，尚未确认是否保存。请刷新页面核对后再试。', true);
      return;
    }
    if (!response.ok || typeof data?.learned !== 'boolean' || data?.target_id !== selected.target_id || !Number.isInteger(data?.revision)) {
      showFeedback(response.status === 403
        ? '登录状态或安全校验已变化，请刷新页面后重新标记。'
        : data?.error || '保存未成功，请刷新页面核对后再试。', true);
      return;
    }
    const word = WORDS_BY_ID.get(wordId);
    for (const item of state.words) {
      if (item.target_id === data.target_id) { item.learned = data.learned; item.revision = data.revision; }
    }
    for (const scenario of state.scenarios) {
      scenario.learned = state.words.filter((w) => w.scenario === scenario.id && w.learned).length;
    }
    if (window.TTS) window.TTS.stopSequence();
    render();
    showFeedback(`${word?.en || '单词'}：${data.learned ? '已标记掌握' : '已取消掌握'}。`);
    if (data.learned && window.TTS) window.TTS.speak('Great!', { rate: 0.9 });
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
      `<button class="rel" type="button" data-say="${escapeHtml(r.en)}" aria-label="朗读 ${escapeHtml(r.en)}">` +
      `<b>${escapeHtml(r.en)}</b>${r.ipa ? `<i class="rel-ipa">${escapeHtml(r.ipa)}</i>` : ''}` +
      `${r.zh ? `<i class="rel-zh">${escapeHtml(r.zh)}</i>` : ''}</button>`).join('');
    const unitTag = showUnitTag && unit.zh
      ? `<span class="unit-tag">${escapeHtml(unit.emoji || '')} ${escapeHtml(unit.zh)}</span>` : '';
    return `<article class="wcard${word.learned ? ' learned' : ''}" data-word="${escapeHtml(word.id)}" data-say-seq="${escapeHtml(word.en)}" style="--c:${escapeHtml(unit.color || '#4d96ff')}">${unitTag}` +
      `<div class="wtop"><button class="pic" type="button" data-say="${escapeHtml(word.en)}" aria-label="朗读 ${escapeHtml(word.en)}">${picHTML(word)}</button>` +
      `<div class="winfo"><div class="wline"><h2 class="word">${escapeHtml(word.en)}</h2><button class="say" type="button" data-say="${escapeHtml(word.en)}" aria-label="朗读 ${escapeHtml(word.en)}">🔊</button></div>` +
      `<div class="wmeta"><span class="ipa">${escapeHtml(word.ipa)}</span><span class="zh">${escapeHtml(word.zh || word.source_status || '')}</span></div></div></div>` +
      (word.chinese_example ? `<p class="memo">例：${escapeHtml(word.chinese_example)}</p>` : '') +
      (parts ? `<div class="wsec"><span class="seclabel">记</span><span class="parts">${parts}</span></div>` : '') +
      (word.memo ? `<p class="memo">💡 ${escapeHtml(word.memo)}</p>` : '') +
      (related ? `<div class="wsec"><span class="seclabel">联</span><span class="rels">${related}</span></div>` : '') +
      `<div class="wcard-footer"><button class="learn-btn${word.learned ? ' on' : ''}" type="button" data-learn="${escapeHtml(word.id)}" aria-pressed="${word.learned}" aria-label="${escapeHtml(word.en)}：${word.learned ? '取消掌握' : '标记掌握'}"><span aria-hidden="true">✓</span> ${word.learned ? '已掌握' : '标记掌握'}</button></div>` +
      '</article>';
  }

  function matchSearch(word) {
    if (!query) return true;
    const unit = state.scenarios.find((s) => s.id === word.scenario) || {};
    return word.en.toLowerCase().includes(query) || (word.zh || '').includes(query) ||
           (unit.zh || '').includes(query) || (unit.name || '').toLowerCase().includes(query);
  }

  function render() {
    const navScroll = chipsEl.scrollTop;
    const focusedUnit = document.activeElement?.closest?.('[data-unit]')?.dataset.unit;
    const searching = Boolean(query);
    const shown = state.words.filter(matchSearch);
    const unit = state.scenarios.find((s) => s.id === curUnit) || state.scenarios[0];

    chipsEl.innerHTML = state.scenarios.map((s) =>
      `<button class="chip${s.id === curUnit && !searching ? ' on' : ''}" type="button" data-unit="${s.id}" aria-pressed="${s.id === curUnit && !searching}" style="--c:${escapeHtml(s.color)}">` +
      `<span class="chip-emoji">${escapeHtml(s.emoji)}</span><span class="chip-name">${escapeHtml(s.zh)}</span>` +
      `<span class="chip-num${s.total && s.learned === s.total ? ' full' : ''}">${s.learned}/${s.total}</span></button>`).join('');
    chipsEl.scrollTop = navScroll;
    if (focusedUnit) {
      Array.from(chipsEl.querySelectorAll('[data-unit]')).find((chip) => chip.dataset.unit === focusedUnit)?.focus({ preventScroll: true });
    }
    navCountEl.textContent = `${state.scenarios.length} 个场景 · ${state.words.length} 词`;

    if (searching) {
      const hits = shown.length;
      cardsEl.innerHTML = hits
        ? `<p class="search-head">找到 ${hits} 个单词</p><div class="wgrid">${shown.map((w) => cardHTML(w, true)).join('')}</div>`
        : '<div class="empty">🐤 没找到，换个词试试？</div>';
    } else if (unit) {
      const learned = state.words.filter((w) => w.scenario === unit.id && w.learned).length;
      cardsEl.innerHTML = `<div class="unit-head"><span class="unit-emoji" aria-hidden="true">${escapeHtml(unit.emoji)}</span>` +
        `<h1>${escapeHtml(unit.name)} <span class="unit-cn">${escapeHtml(unit.zh)}</span></h1><p class="unit-progress">已掌握 <strong>${learned}</strong> / ${unit.total} 词</p></div>` +
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

  /* 词以类聚等页面的深链：/words/?word=dog 直接切到该词所在场景并高亮。 */
  const deepLink = new URLSearchParams(location.search).get('word');
  if (deepLink) {
    const hit = state.words.find((w) => w.en.toLowerCase() === deepLink.toLowerCase());
    if (hit) {
      curUnit = hit.scenario;
      render();
      requestAnimationFrame(() => {
        const card = cardsEl.querySelector(`[data-word="${hit.id}"]`);
        if (card) {
          card.classList.add('learned-flash');
          card.scrollIntoView({ block: 'center' });
        }
      });
    } else {
      render();
    }
  } else {
    render();
  }
})();
