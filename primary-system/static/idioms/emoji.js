/* 成语表情猜猜看：emoji 四选一。服务端签名态保存作答序列，正确答案每次
   由服务端实时生成（不在前端留痕）；本页临时练习，刷新重开。 */
'use strict';

(() => {
  const stateEl = document.getElementById('emoji-state');
  if (!stateEl) return;
  const state = JSON.parse(stateEl.textContent);
  const API = '/idioms/emoji/api/action/';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const board = document.getElementById('eq-board');
  const dotsEl = document.getElementById('eq-dots');
  const correctEl = document.getElementById('eq-correct');
  const revealedEl = document.getElementById('eq-revealed');
  const historyEl = document.getElementById('eq-history');
  let token = state.token || null;
  let busy = false;

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
    board.innerHTML = `<div class="eq-error">${escape(message)}` +
      (restart ? ' <button type="button" class="eq-again" id="eq-restart">重新开始</button>' : '') + '</div>';
    document.getElementById('eq-restart')?.addEventListener('click', restart ? start : renderAll);
  }

  function renderDots(result) {
    const rows = result.answers || [];
    dotsEl.innerHTML = Array.from({length: result.size}, (_, i) =>
      `<span class="eq-dot${i < rows.length ? ` ${rows[i].outcome}` : ''}${i === result.index && !result.finished ? ' now' : ''}">${i + 1}</span>`).join('');
    correctEl.textContent = result.correct ?? 0;
    revealedEl.textContent = result.revealed ?? 0;
    historyEl.innerHTML = rows.map(row =>
      `<a class="eq-history-row${row.outcome === 'correct' ? ' ok' : ''}" href="/idioms/entries/${row.entry_id}/">` +
      `${escape(row.emoji)} <b>${escape(row.headword)}</b><i>${row.outcome === 'correct' ? '猜对' : row.outcome === 'revealed' ? '揭示' : '没猜中'}</i></a>`).join('');
  }

  function renderSummary(result) {
    renderDots(result);
    board.innerHTML = `
      <div class="eq-summary">
        <p class="eq-summary-label">本局小结</p>
        <h2>${result.correct} / ${result.size} 猜对${result.revealed ? `，揭示 ${result.revealed} 题` : ''}</h2>
        <p class="eq-summary-copy">${result.correct >= result.size - 1 ? 'emoji 都难不倒你，太厉害了！' : '猜错的都是新朋友，再来一轮就熟了。'}</p>
        <button type="button" class="eq-again" id="eq-again">🎲 再来一局</button>
      </div>`;
    document.getElementById('eq-again').addEventListener('click', async () => {
      const next = await request('new');
      if (next) renderAll(next);
    });
  }

  function renderAnswer(result) {
    renderDots(result);
    const card = result.card || {};
    const correct = card.outcome === 'correct';
    board.querySelectorAll('.eq-option').forEach(button => {
      if (button.dataset.text === card.headword) button.classList.add('right');
      else if (button.classList.contains('picked')) button.classList.add('wrong');
    });
    const feedback = board.querySelector('.eq-feedback');
    feedback.innerHTML = `${correct ? '🎉 猜对啦！就是这么画。' : '😅 没猜中，正确答案已标绿。'}<b class="eq-answer">${escape(card.headword)}</b>` +
      (card.pinyin ? `<span class="eq-pinyin">${escape(card.pinyin)}</span>` : '') +
      (card.definition ? `<span class="eq-def">${escape(card.definition)}</span>` : '') +
      ` <button type="button" class="eq-say" data-say="${escape(card.headword)}。${escape(card.definition || '')}" aria-label="朗读 ${escape(card.headword)}">🔊</button>` +
      (card.entry_id ? ` <a class="eq-entry" href="/idioms/entries/${card.entry_id}/">词典 →</a>` : '');
    feedback.classList.add(correct ? 'ok' : 'bad');
    setTimeout(() => { result.finished ? renderSummary(result) : renderQuestion(result); }, correct ? 900 : 1700);
  }

  function renderQuestion(result) {
    const q = result.current;
    if (!q) { renderSummary(result); return; }
    renderDots(result);
    board.innerHTML = `
      <p class="eq-counter">第 ${q.index + 1} / ${q.size} 题 · ${escape(q.hint)}</p>
      <p class="eq-emoji">${escape(q.emoji)}</p>
      <p class="eq-question">这是哪个成语？</p>
      <div class="eq-options">${q.options.map(option =>
        `<button type="button" class="eq-option" data-text="${escape(option.text)}">${escape(option.text)}</button>`).join('')}</div>
      <p class="eq-feedback" id="eq-feedback"></p>`;
    board.querySelectorAll('.eq-option').forEach(button => {
      button.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        board.querySelectorAll('.eq-option').forEach(other => { other.disabled = true; });
        button.classList.add('picked');
        busy = false;
        const answer = await request('answer', {chosen: button.dataset.text});
        if (answer) renderAnswer(answer);
      });
    });
  }

  function renderAll(result) {
    if (!result.available) { renderError(result.message || '题库正在准备中。', false); return; }
    result.finished ? renderSummary(result) : renderQuestion(result);
  }

  async function start() {
    const next = await request('new');
    if (next) renderAll(next);
  }

  try {
    renderAll(state);
  } catch (error) {
    const fallback = document.getElementById('eq-board');
    if (fallback) fallback.textContent = '练习初始化出错：' + error.message;
  }
})();
