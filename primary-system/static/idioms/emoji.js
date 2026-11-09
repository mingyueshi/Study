/* 成语表情猜猜看：emoji 四选一。服务端签名态保存作答序列，正确答案每次
   由服务端实时生成（不在前端留痕）；本页临时练习，刷新重开。
   节奏：答对稍作庆祝自动进下一题（Enter 可跳过等待）；答错/看答案后
   停留在释义卡，由孩子点「下一题」或按 Enter 继续，读完再走。 */
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
  let busy = false;           // 在途操作锁：请求 + 渲染完成后才放行
  let advanceTimer = null;    // 答对后的自动进题定时器
  let view = 'question';      // question / answering / feedback / summary
  let lastResult = null;      // 最近一次作答结果，供 Enter / 下一题续播
  let optionCount = 0;        // 当前题选项数（夹具题库可能少于 4）
  const HINT_CLASS = {'动物类': 'animal', '数字类': 'number', '动作类': 'action',
                      '自然类': 'nature', '器物类': 'object', '表情类': 'face'};

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
      if (window.rewardToast && data.rewards) window.rewardToast(data.rewards);
    } catch (error) {
      renderError('网络不给力，请刷新页面再试。', false);
      return null;
    }
    if (data.token) token = data.token;
    return data;
  }

  /* 所有用户操作统一走这里：同一时刻只放行一个在途操作。 */
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
    clearTimeout(advanceTimer);
    view = 'error';
    board.innerHTML = `<div class="eq-error">${escape(message)}` +
      (restart ? ' <button type="button" class="eq-again" id="eq-restart">重新开始</button>' : '') + '</div>';
    document.getElementById('eq-restart')?.addEventListener('click', () => run('new'));
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

  function starCount(correct, size) {
    const ratio = size ? correct / size : 0;
    return ratio >= 1 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0;
  }

  function starCopy(stars) {
    return stars >= 3 ? 'emoji 都难不倒你，太厉害了！'
      : stars === 2 ? '就差一点点，再来一轮全对！'
      : stars === 1 ? '猜错的都是新朋友，再来一轮就熟了。'
      : '多看多猜，下一局一定更棒。';
  }

  function streakOf(result) {
    const rows = result.answers || [];
    let streak = 0;
    for (let i = rows.length - 1; i >= 0 && rows[i].outcome === 'correct'; i--) streak++;
    return streak;
  }

  function renderSummary(result) {
    clearTimeout(advanceTimer);
    view = 'summary';
    renderDots(result);
    const stars = starCount(result.correct, result.size);
    const missed = (result.answers || []).filter(row => row.outcome !== 'correct');
    board.innerHTML = `
      <div class="eq-summary">
        <p class="eq-summary-label">本局小结</p>
        <p class="eq-stars" role="img" aria-label="获得 ${stars} 颗星（满分 3 颗）">${[0, 1, 2].map(i =>
          `<span class="eq-star${i < stars ? ' on' : ''}">★</span>`).join('')}</p>
        <h2>${result.correct} / ${result.size} 猜对${result.revealed ? `，揭示 ${result.revealed} 题` : ''}</h2>
        <p class="eq-summary-copy">${starCopy(stars)}</p>
        ${missed.length ? `
        <div class="eq-review">
          <h3>没猜中的 ${missed.length} 个，再认识一下：</h3>
          <ul>${missed.map(row => `
            <li>
              <span class="eq-review-emoji" aria-hidden="true">${escape(row.emoji)}</span>
              <span class="eq-review-word"><b>${escape(row.headword)}</b>
                ${row.pinyin ? `<i>${escape(row.pinyin)}</i>` : ''}
                ${row.definition ? `<em>${escape(row.definition)}</em>` : ''}
              </span>
              <span class="eq-review-links">
                <button type="button" class="eq-say" data-say="${escape(row.headword)}。${escape(row.definition || '')}" aria-label="朗读 ${escape(row.headword)}">🔊 朗读</button>
                ${row.entry_id ? `<a class="eq-entry" href="/idioms/entries/${row.entry_id}/">词典 →</a>` : ''}
              </span>
            </li>`).join('')}</ul>
        </div>` : ''}
        <button type="button" class="eq-again" id="eq-again">🎲 再来一局</button>
      </div>`;
    document.getElementById('eq-again').addEventListener('click', () => run('new'));
  }

  function renderAnswer(result) {
    clearTimeout(advanceTimer);
    view = 'feedback';
    lastResult = result;
    renderDots(result);
    board.querySelector('.eq-actions')?.remove();   // 答案已揭晓，收起「看答案」
    const card = result.card || {};
    const correct = card.outcome === 'correct';
    const revealed = card.outcome === 'revealed';
    board.querySelectorAll('.eq-option').forEach(button => {
      if (button.dataset.text === card.headword) button.classList.add('right');
      else if (button.classList.contains('picked')) button.classList.add('wrong');
    });
    const verdict = correct ? '🎉 猜对啦！就是这么画。'
      : revealed ? '💡 揭示答案，下次一定猜中。'
      : '😅 没猜中，正确答案已标绿。';
    const streak = correct ? streakOf(result) : 0;
    const combo = streak >= 2 ? `<span class="eq-combo">🔥 连对 ${streak} 题</span>` : '';
    const finished = result.finished;
    const feedback = board.querySelector('.eq-feedback');
    feedback.className = `eq-feedback ${correct ? 'ok' : revealed ? 'hinted' : 'bad'}`;
    feedback.innerHTML = `
      <p class="eq-verdict">${verdict}${combo}</p>
      <div class="eq-answer-card">
        <p class="eq-answer-line">
          <b class="eq-answer">${escape(card.headword)}</b>
          ${card.pinyin ? `<span class="eq-pinyin">${escape(card.pinyin)}</span>` : ''}
          <button type="button" class="eq-say" data-say="${escape(card.headword)}。${escape(card.definition || '')}" aria-label="朗读 ${escape(card.headword)}">🔊 朗读</button>
          ${card.entry_id ? `<a class="eq-entry" href="/idioms/entries/${card.entry_id}/">词典 →</a>` : ''}
        </p>
        ${card.definition ? `<p class="eq-def">${escape(card.definition)}</p>` : ''}
      </div>
      ${correct && !finished ? '' : `<button type="button" class="eq-next" id="eq-next">${finished ? '看看小结 →' : '下一题 →'}</button>`}`;
    if (correct && !finished) {
      advanceTimer = setTimeout(advance, 1100);
    } else {
      document.getElementById('eq-next')?.addEventListener('click', advance);
    }
  }

  /* 从最近一次作答结果继续：答对自动调用，答错由按钮/Enter 调用。 */
  function advance() {
    clearTimeout(advanceTimer);
    if (!lastResult) return;
    lastResult.finished ? renderSummary(lastResult) : renderQuestion(lastResult);
  }

  function renderQuestion(result) {
    const q = result.current;
    if (!q) { renderSummary(result); return; }
    clearTimeout(advanceTimer);
    view = 'question';
    lastResult = null;
    renderDots(result);
    const hintChip = `<span class="eq-hint-chip eq-hint-${HINT_CLASS[q.hint] || 'generic'}">${escape(q.hint)}</span>`;
    board.innerHTML = `
      <p class="eq-counter">第 ${q.index + 1} / ${q.size} 题 ${hintChip}</p>
      <p class="eq-emoji" role="img" aria-label="emoji 谜面">${escape(q.emoji)}</p>
      <p class="eq-question">这是哪个成语？</p>
      <div class="eq-options">${q.options.map((option, i) =>
        `<button type="button" class="eq-option" data-text="${escape(option.text)}">` +
        `<i class="eq-option-key" aria-hidden="true">${i + 1}</i><span>${escape(option.text)}</span></button>`).join('')}</div>
      <div class="eq-actions"><button type="button" class="eq-reveal" id="eq-reveal">🤔 不会？看答案</button></div>
      <p class="eq-feedback" id="eq-feedback"></p>`;
    optionCount = q.options.length;
    board.querySelectorAll('.eq-option').forEach(button => {
      button.addEventListener('click', () => pick(button));
    });
    document.getElementById('eq-reveal').addEventListener('click', () => {
      view = 'answering';
      run('reveal');
    });
  }

  function pick(button) {
    if (busy || view !== 'question') return;
    view = 'answering';
    board.querySelectorAll('.eq-option').forEach(other => { other.disabled = true; });
    button.classList.add('picked');
    run('answer', {chosen: button.dataset.text});
  }

  function renderAll(result) {
    if (!result.available) { renderError(result.message || '题库正在准备中。', false); return; }
    // 作答/揭示响应带 card，走反馈视图；开新局响应直接进题目或小结。
    if (result.card) { renderAnswer(result); return; }
    result.finished ? renderSummary(result) : renderQuestion(result);
  }

  /* 键盘：1~4 选答案（题目态）；Enter 跳过等待/继续下一题/再来一局。
     Enter 统一在此处理并 preventDefault，避免焦点按钮的原生激活重复触发。 */
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    if (busy) return;
    if (event.key === 'Enter') {
      if (view === 'feedback') { event.preventDefault(); advance(); }
      else if (view === 'summary') { event.preventDefault(); run('new'); }
      return;
    }
    if (view !== 'question') return;
    const index = ['1', '2', '3', '4'].indexOf(event.key);
    if (index < 0 || index >= optionCount) return;
    const button = board.querySelectorAll('.eq-option')[index];
    if (button) { event.preventDefault(); pick(button); }
  });

  try {
    renderAll(state);
  } catch (error) {
    const fallback = document.getElementById('eq-board');
    if (fallback) fallback.textContent = '练习初始化出错：' + error.message;
  }
})();
