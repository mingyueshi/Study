/* 成语配对：左右两栏各五张词卡，点左再点右提交配对；判定在服务端。
   签名态保存已配对结果与尝试次数；本页临时练习，刷新重开。 */
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

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  async function request(action, extra = {}) {
    if (busy) return null;
    busy = true;
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
    } finally {
      busy = false;
    }
    if (data.token) token = data.token;
    return data;
  }

  function renderError(message, restart) {
    board.innerHTML = `<div class="pairs-error">${escape(message)}` +
      (restart ? ' <button type="button" class="pairs-again" id="pairs-restart">重新开始</button>' : '') + '</div>';
    document.getElementById('pairs-restart')?.addEventListener('click', start);
  }

  function renderStats(result) {
    attemptsEl.textContent = result.attempts;
    matchedEl.textContent = result.matched;
    sizeEl.textContent = result.size;
  }

  function renderRows(result) {
    rowsEl.innerHTML = (result.rows || []).map(row =>
      `<div class="pairs-row${row.relation === 'near' ? ' near' : ' opp'}">` +
      `<b>${escape(row.a.headword)}</b><span class="pairs-relation">${row.relation_label}</span><b>${escape(row.b.headword)}</b>` +
      `<p class="pairs-row-def">${escape(row.a.definition || row.b.definition || '')}</p></div>`).join('');
  }

  function tile(word, side, locked) {
    return `<button type="button" class="pairs-tile ${side}${locked ? ' locked' : ''}" data-side="${side}" data-word="${escape(word)}">${escape(word)}</button>`;
  }

  function renderRound(result) {
    renderStats(result);
    renderRows(result);
    const tiles = result.tiles || {left: [], right: []};
    board.innerHTML = `
      <p class="pairs-hint">先点左边一个成语，再点右边它的近义或反义。</p>
      <div class="pairs-columns">
        <div class="pairs-column">${tiles.left.map(w => tile(w, 'left', false)).join('')}</div>
        <div class="pairs-column">${tiles.right.map(w => tile(w, 'right', false)).join('')}</div>
      </div>
      <p class="pairs-feedback" id="pairs-feedback">${escape(result.message || '')}</p>`;
    pickedLeft = null;
    board.querySelectorAll('.pairs-tile').forEach(button => {
      button.addEventListener('click', async () => {
        if (busy) return;
        const side = button.dataset.side;
        if (side === 'left') {
          board.querySelectorAll('.pairs-tile.left').forEach(el => el.classList.remove('picked'));
          button.classList.add('picked');
          pickedLeft = button.dataset.word;
          return;
        }
        if (!pickedLeft) { feedback('先从左边选一个成语。'); return; }
        const right = button.dataset.word;
        const answer = await request('match', {left: pickedLeft, right});
        if (answer) renderAll(answer);
      });
    });
  }

  function feedback(message) {
    const el = document.getElementById('pairs-feedback');
    if (el) el.textContent = message;
  }

  function renderMatched(result) {
    renderStats(result);
    renderRows(result);
    const matched = result.matched_pair;
    const relation = matched.relation === 'near' ? '近义' : '反义';
    board.innerHTML = `
      <p class="pairs-hint">配对成功！</p>
      <div class="pairs-matched-pair ${matched.relation}">
        <span class="pairs-matched-word">${escape(matched.a.headword)}</span>
        <span class="pairs-matched-link">${relation} ⇌</span>
        <span class="pairs-matched-word">${escape(matched.b.headword)}</span>
      </div>
      <p class="pairs-feedback ok">${escape(result.message || '')}</p>`;
  }

  function renderSummary(result) {
    renderStats(result);
    renderRows(result);
    board.innerHTML = `
      <div class="pairs-summary">
        <p class="pairs-summary-label">本局小结</p>
        <h2>${result.matched} 对全部配对成功！</h2>
        <p class="pairs-summary-copy">一共尝试了 ${result.attempts} 次。${result.attempts <= result.size ? '又快又准，太厉害了！' : '多练几局，会越来越快。'}</p>
        <button type="button" class="pairs-again" id="pairs-again">🎲 再来一局</button>
      </div>`;
    document.getElementById('pairs-again').addEventListener('click', start);
  }

  function renderAll(result) {
    if (!result.available) { renderError(result.message || '题库正在准备中。', false); return; }
    if (result.finished) { renderSummary(result); return; }
    if (result.matched_pair) renderMatched(result); else renderRound(result);
  }

  async function start() {
    const next = await request('new');
    if (next) renderAll(next);
  }

  renderAll(state);
})();
