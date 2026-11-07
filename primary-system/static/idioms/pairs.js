/* 成语配对：左右两栏各五张词卡，点左再点右提交配对；判定在服务端。
   签名态保存已配对结果与尝试次数；本页临时练习，刷新重开。
   配对成功不整屏替换：横幅展示这一对（拼音/释义/朗读/词典），
   剩余词卡原地继续，答错抖动两卡并保留左侧选中，键盘 1~5 / Esc 可用。 */
'use strict';

(() => {
  const stateEl = document.getElementById('pairs-state');
  if (!stateEl) return;
  const state = JSON.parse(stateEl.textContent);
  const API = '/idioms/pairs/api/action/';
  const board = document.getElementById('pairs-board');
  const attemptsEl = document.getElementById('pairs-attempts');
  const matchedEl = document.getElementById('pairs-matched');
  const sizeEl = document.getElementById('pairs-size');
  const rowsEl = document.getElementById('pairs-rows');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let token = state.token || null;
  let busy = false;
  let pickedLeft = null;
  let finished = Boolean(state.finished);

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  async function request(action, extra = {}) {
    let data;
    try {
      const response = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf()},
        body: JSON.stringify({action, token, ...extra}),
      });
      data = await response.json().catch(() => ({}));
      if (!response.ok) {
        renderError(data.error || '请求没成功，请刷新页面。', data.restart_required);
        return null;
      }
    } catch (error) {
      renderError('网络不给力，请刷新页面再试。', false);
      return null;
    }
    if (data.token) token = data.token;
    return data;
  }

  async function run(action, extra = {}) {
    if (busy) return;
    busy = true;
    try {
      const data = await request(action, extra);
      if (data) renderAll(data);
    } finally {
      busy = false;
    }
  }

  function renderError(message, restart) {
    board.innerHTML = `<div class="pairs-error">${escape(message)}` +
      (restart ? ' <button type="button" class="pairs-again" id="pairs-restart">重新开始</button>' : '') + '</div>';
    document.getElementById('pairs-restart')?.addEventListener('click', () => run('new'));
  }

  function renderStats(result) {
    attemptsEl.textContent = result.attempts;
    matchedEl.textContent = result.matched;
    sizeEl.textContent = result.size;
  }

  function renderRows(result) {
    rowsEl.innerHTML = (result.rows || []).map(row =>
      `<div class="pairs-row${row.relation === 'near' ? ' near' : ' opp'}">` +
      `<b>${escape(row.a.headword)}</b><span class="pairs-relation">${escape(row.relation_label)}</span><b>${escape(row.b.headword)}</b>` +
      `<button type="button" class="say-chip" data-say="${escape(row.a.headword)}。${escape(row.b.headword)}。" aria-label="朗读 ${escape(row.a.headword)} 和 ${escape(row.b.headword)}">🔊</button>` +
      `<p class="pairs-row-def">${escape(row.a.definition || row.b.definition || '')}</p></div>`).join('');
  }

  function tile(word, side) {
    return `<button type="button" class="pairs-tile ${side}" data-side="${side}" data-word="${escape(word)}">${escape(word)}</button>`;
  }

  function matchedBanner(matched) {
    const def = (card) => card.definition
      ? `<p class="pairs-banner-def"><b>${escape(card.headword)}</b>${card.pinyin ? `<i>${escape(card.pinyin)}</i>` : ''}${escape(card.definition)}` +
        ` <button type="button" class="say-chip" data-say="${escape(card.headword)}。${escape(card.definition)}" aria-label="朗读 ${escape(card.headword)}">🔊</button>` +
        (card.entry_id ? `<a class="pairs-dict" href="/idioms/entries/${card.entry_id}/">词典 →</a>` : '') + '</p>'
      : '';
    return `
      <div class="pairs-banner">
        <p class="pairs-banner-head">
          <b class="pairs-banner-word">${escape(matched.a.headword)}</b>
          <span class="pairs-banner-relation">${escape(matched.relation_label)}</span>
          <b class="pairs-banner-word">${escape(matched.b.headword)}</b>
        </p>
        <div class="pairs-banner-defs">${def(matched.a)}${def(matched.b)}</div>
      </div>`;
  }

  function renderRound(result) {
    renderStats(result);
    renderRows(result);
    const tiles = result.tiles || {left: [], right: []};
    const banner = result.matched_pair ? matchedBanner(result.matched_pair) : '';
    board.innerHTML = `
      ${banner}
      <p class="pairs-hint">先点左边一个成语，再点右边它的近义或反义。数字键 1~5 也能选。</p>
      <div class="pairs-columns">
        <div class="pairs-column">${tiles.left.map(w => tile(w, 'left')).join('')}</div>
        <div class="pairs-column">${tiles.right.map(w => tile(w, 'right')).join('')}</div>
      </div>
      <p class="pairs-feedback" id="pairs-feedback">${escape(result.message || '')}</p>`;
    pickedLeft = null;
    finished = Boolean(result.finished);
    board.querySelectorAll('.pairs-tile.left').forEach(button => {
      button.addEventListener('click', () => pickLeft(button));
    });
    board.querySelectorAll('.pairs-tile.right').forEach(button => {
      button.addEventListener('click', () => match(button.dataset.word));
    });
  }

  function pickLeft(button) {
    if (busy) return;
    board.querySelectorAll('.pairs-tile.left').forEach(el => el.classList.remove('picked'));
    button.classList.add('picked');
    pickedLeft = button.dataset.word;
    feedback('左边选好了，点右边它的近义或反义。');
  }

  function clearPicked() {
    board.querySelectorAll('.pairs-tile.left').forEach(el => el.classList.remove('picked'));
    pickedLeft = null;
  }

  async function match(right) {
    if (busy) return;
    if (!pickedLeft) { feedback('先从左边选一个成语。'); return; }
    const left = pickedLeft;
    busy = true;
    const data = await request('match', {left, right});
    busy = false;
    if (!data) return;
    renderAll(data);
    if (!data.matched_pair && !data.finished) {
      /* 答错：抖动刚才的两个词卡；保留左侧选中，孩子只需换右边重试。 */
      const leftTile = [...board.querySelectorAll('.pairs-tile.left')].find(el => el.dataset.word === left);
      const rightTile = [...board.querySelectorAll('.pairs-tile.right')].find(el => el.dataset.word === right);
      [leftTile, rightTile].filter(Boolean).forEach(el => {
        el.classList.add('shake');
        el.addEventListener('animationend', () => el.classList.remove('shake'), {once: true});
      });
      if (leftTile) { leftTile.classList.add('picked'); pickedLeft = left; }
    }
  }

  function feedback(message) {
    const el = document.getElementById('pairs-feedback');
    if (el) el.textContent = message;
  }

  function renderSummary(result) {
    renderStats(result);
    renderRows(result);
    finished = true;
    board.innerHTML = `
      <div class="pairs-summary">
        <p class="pairs-summary-label">本局小结</p>
        <h2>${result.matched} 对全部配对成功！</h2>
        <p class="pairs-summary-copy">一共尝试了 ${result.attempts} 次。${result.attempts <= result.size ? '又快又准，太厉害了！' : '多练几局，会越来越快。'}</p>
        <button type="button" class="pairs-again" id="pairs-again">🎲 再来一局</button>
      </div>`;
    document.getElementById('pairs-again').addEventListener('click', () => run('new'));
  }

  function renderAll(result) {
    if (!result.available) { renderError(result.message || '题库正在准备中。', false); return; }
    if (result.finished) { renderSummary(result); return; }
    renderRound(result);
  }

  /* 键盘：1~5 选左边（未选时）或配对右边（已选时）；Esc 取消选择；
     小结态 Enter 再来一局。输入框里不抢按键。 */
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest?.('input, textarea, select')) return;
    if (busy) return;
    if (event.key === 'Escape') { clearPicked(); feedback('已取消选择。'); return; }
    if (event.key === 'Enter') {
      if (finished) { event.preventDefault(); run('new'); }
      return;
    }
    const index = ['1', '2', '3', '4', '5'].indexOf(event.key);
    if (index < 0) return;
    const lefts = [...board.querySelectorAll('.pairs-tile.left')];
    const rights = [...board.querySelectorAll('.pairs-tile.right')];
    if ((pickedLeft ? rights : lefts)[index] === undefined) return;
    event.preventDefault();
    if (!pickedLeft) {
      pickLeft(lefts[index]);
    } else {
      match(rights[index].dataset.word);
    }
  });

  renderAll(state);
})();
