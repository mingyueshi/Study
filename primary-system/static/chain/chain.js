/* 成语接龙前端：服务端权威，本文件只做渲染与提交；409 时自动重拉状态。
   结构与交互对齐 legacy chain.html：当前词大字卡、接字目标、提示面板全量候选、龙迹最新在前。
   mode=duel（家长对决）为同屏轮流热座：先手每局可选，提示双方都能用、各扣各的分。 */
'use strict';

(() => {
  const stateEl = document.getElementById('chain-state');
  if (!stateEl) return;
  let state = JSON.parse(stateEl.textContent);
  let hintsShown = false;

  const $ = (id) => document.getElementById(id);
  const els = {
    turn: $('chain-turn'), pool: $('chain-pool'), poolNote: $('chain-pool-note'),
    currentWord: $('chain-current-word'), currentRead: $('chain-read-current'),
    currentPinyin: $('chain-current-pinyin'), currentMeaning: $('chain-current-meaning'),
    next: $('chain-next'), form: $('chain-form'), input: $('chain-word'),
    feedback: $('chain-feedback'), hints: $('chain-hints'), hintOptions: $('chain-hint-options'),
    hintButton: $('chain-hint-btn'), ended: $('chain-ended'), score: $('chain-score'),
    scoreP1: $('chain-score-p1'), scoreP2: $('chain-score-p2'),
    soloScore: $('chain-solo-score'), duelScore: $('chain-duel-score'),
    captionSolo: $('chain-caption-solo'), captionDuel: $('chain-caption-duel'),
    rulesSolo: $('chain-rules-solo'), rulesDuel: $('chain-rules-duel'),
    subtitle: $('chain-subtitle'), restartBtn: $('chain-restart-btn'),
    startChoice: $('chain-start-choice'), roundArea: $('chain-round-area'),
    length: $('chain-length'), hintsCount: $('chain-hints-count'), history: $('chain-history'),
    trail: $('chain-trail'), trailCount: $('chain-trail-count'),
  };

  const isDuel = () => state.mode === 'duel';
  const playerName = (side) => (side === 'p1' ? '孩子' : '家长');

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  const api = (path, body) => fetch(path, {
    method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf()},
    body: JSON.stringify({...body, round_id: state.id, revision: state.revision}),
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (response.status === 409) { await refresh(); return null; }
    if (response.status === 403) { showFeedback('页面停留太久安全校验过期了，刷新页面后再试。', 'error'); return null; }
    if (!response.ok) { showFeedback(data.error || '操作未成功，请重试。', 'error'); return null; }
    return data;
  });

  const stateUrl = () => (isDuel() ? '/chain/api/state/?mode=duel' : '/chain/api/state/');
  const refresh = () => fetch(stateUrl(), {headers: {'Accept': 'application/json'}})
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { if (data) { clearHints(); state = data; render(); } });

  function showFeedback(message, kind) {
    els.feedback.textContent = message;
    els.feedback.className = 'feedback' + (kind ? ' ' + kind : '');
  }

  function clearHints() {
    hintsShown = false;
    els.hints.hidden = true;
    els.hintButton.setAttribute('aria-expanded', 'false');
    els.hintOptions.innerHTML = '';
    els.hints.querySelectorAll('.hint-total').forEach((node) => node.remove());
  }

  /* 客户端预校验只做即时反馈，服务端仍是唯一裁判。 */
  const HAN = /^[\u3400-\u9fff]{4}$/;
  const canUse = (word) => HAN.test(word) && word[0] === state.next_char &&
    !state.chain.some((item) => item.word === word);

  const escapeHtml = (value) => value.replace(/[&<>"']/g, (ch) => (
    {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[ch]));

  function speak(text) {
    if (window.SpeechKit) window.SpeechKit.speak(text, { rate: 0.85 });
  }

  function renderModeChrome() {
    const duel = isDuel();
    els.soloScore.hidden = duel;
    els.duelScore.hidden = !duel;
    els.captionSolo.hidden = duel;
    els.captionDuel.hidden = !duel;
    els.rulesSolo.hidden = duel;
    els.rulesDuel.hidden = !duel;
    els.subtitle.textContent = duel
      ? '首尾同字，不重复，和孩子轮流看看谁更厉害。'
      : '首尾同字，不重复，和小龙轮流看看能接多长。';
    els.restartBtn.textContent = duel ? '↻ 重开一局' : '↻ 换个开头';
  }

  function renderHistory() {
    els.history.innerHTML = (state.history || []).map((item) => {
      const result = item.mode === 'duel'
        ? `${item.length} 手 · ${item.score}:${item.p2_score} ${item.ended_reason.includes('孩子获胜') ? '赢' : (item.ended_reason.includes('家长获胜') ? '负' : '')}`
        : `${item.length} 手 · ${item.score} 分`;
      return `<li><span>${escapeHtml(item.finished_at)}</span><span>${result}</span><span>${escapeHtml(item.ended_reason)}</span></li>`;
    }).join('') || '<li>还没有完成的对局，接出第一局吧。</li>';
  }

  function renderStartChoice() {
    els.turn.textContent = '先选谁先接';
    els.startChoice.hidden = false;
    els.roundArea.hidden = true;
    clearHints();
    els.trail.innerHTML = '';
    els.trailCount.textContent = '共 0 手';
    renderHistory();
  }

  function render() {
    renderModeChrome();
    if (state.status === 'needs_start') { renderStartChoice(); return; }
    els.startChoice.hidden = true;
    els.roundArea.hidden = false;

    const last = state.chain[state.chain.length - 1];
    const playing = state.status === 'playing';
    const duel = isDuel();

    els.turn.textContent = playing
      ? (duel ? `轮到${playerName(state.turn)}出词` : '轮到你啦')
      : '本局结束';
    els.pool.textContent = `词池 ${state.pool_count} 条成语`;
    els.poolNote.textContent = state.pool_count;
    const heroPool = $('chain-hero-pool');
    const heroLength = $('chain-hero-length');
    if (heroPool) heroPool.textContent = state.pool_count;
    if (heroLength) heroLength.textContent = Math.max(0, state.chain.length - 1);

    const head = last.word.slice(0, -1), tailChar = last.word.slice(-1);
    els.currentWord.innerHTML = `${escapeHtml(head)}<span class="tail">${escapeHtml(tailChar)}</span>`;
    els.currentRead.dataset.say = last.word;
    els.currentPinyin.textContent = last.pinyin || '';
    els.currentMeaning.textContent = last.meaning || '暂无释义，可以在查词词典里看看。';
    els.next.textContent = playing ? state.next_char : '—';

    if (duel) {
      els.scoreP1.textContent = state.score;
      els.scoreP2.textContent = state.p2_score;
    } else {
      els.score.textContent = state.score;
    }
    els.length.textContent = Math.max(0, state.chain.length - 1);
    els.hintsCount.textContent = state.hints;

    els.form.hidden = !playing;
    els.hintButton.hidden = !playing;
    els.hintButton.textContent = playing
      ? (duel ? `💡 给${playerName(state.turn)}一点提示（−5 分）` : '💡 给我一点提示（−5 分）')
      : '';
    els.ended.hidden = playing;
    if (!playing) {
      els.ended.innerHTML = duel
        ? `<h2>${state.ended_reason.includes('孩子获胜') ? '🎉 孩子赢啦！' : '💪 这局家长更厉害！'}</h2>` +
          `<p>${escapeHtml(state.ended_reason)}。比分 孩子 ${state.score} : ${state.p2_score} 家长，共接 ${Math.max(0, state.chain.length - 1)} 手。</p>` +
          '<button class="chain-button primary" type="button" id="chain-again">再开一局 · 选先手 →</button>'
        : `<h2>🎉 这条龙暂时接到底啦！</h2><p>${escapeHtml(state.ended_reason || '本局结束')}。共接 ${Math.max(0, state.chain.length - 1)} 手，得分 ${state.score}。</p>` +
          '<button class="chain-button primary" type="button" id="chain-again">换个开头，继续玩 →</button>';
      const again = document.getElementById('chain-again');
      if (again) again.addEventListener('click', duel ? showStartChoice : restart);
      clearHints();
    }

    renderHistory();

    els.trail.innerHTML = '';
    [...state.chain].reverse().forEach((item, index) => {
      const head2 = item.word.slice(0, -1), tail2 = item.word.slice(-1);
      const who = {start: '开局', player: '你', partner: '小龙', p1: '孩子', p2: '家长'}[item.by] || '';
      const otherSide = item.by === 'partner' || item.by === 'p2';
      const li = document.createElement('li');
      li.className = 'trail-entry' + (index === 0 ? ' latest' : '');
      // 已公开词条的成语点文字跳词典详情（新标签，不影响对局）；未公开的仅朗读。
      const wordEl = item.public
        ? `<a class="trail-word" href="/dictionary/${escapeHtml(item.entry_id)}/" target="_blank" rel="noopener noreferrer" title="查看词典详情">${escapeHtml(head2)}<span class="tail">${escapeHtml(tail2)}</span></a>`
        : `<button class="trail-word" type="button" data-say="${escapeHtml(item.word)}" aria-label="朗读 ${escapeHtml(item.word)}">${escapeHtml(head2)}<span class="tail">${escapeHtml(tail2)}</span></button>`;
      li.innerHTML = `<div class="entry-top"><span class="${otherSide ? 'entry-partner' : 'entry-player'}">${who}</span><span>${escapeHtml(item.pinyin || '')}</span></div>` +
        wordEl +
        `<p class="trail-meaning">${escapeHtml(item.meaning || '')}</p>`;
      els.trail.append(li);
    });
    els.trailCount.textContent = `共 ${state.chain.length} 手`;

    els.input.disabled = !playing;
    els.input.placeholder = playing ? `以「${state.next_char}」开头…` : '本局已结束';
  }

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const word = els.input.value.trim();
    if (!HAN.test(word)) { showFeedback('请输入四字成语。', 'error'); return; }
    if (state.next_char && word[0] !== state.next_char) { showFeedback(`请以“${state.next_char}”字开头，不使用谐音。`, 'error'); return; }
    if (state.chain.some((item) => item.word === word)) { showFeedback('这个成语已经用过了，换一个吧。', 'error'); return; }
    api('/chain/api/play/', {word}).then((data) => {
      if (!data) return;
      if (window.rewardToast && data.rewards) window.rewardToast(data.rewards);
      const gained = data.score - state.score;
      clearHints();
      state = data;
      els.input.value = '';
      showFeedback(isDuel()
        ? `接上了！${playerName(state.turn === 'p1' ? 'p2' : 'p1')} +10 分。轮到${playerName(state.turn)}出词。`
        : `接上了！${gained > 0 ? '+' + gained + ' 分。' : ''}轮到小龙想一想……`, 'success');
      render();
      speak(state.chain[state.chain.length - 1].word);
      els.input.focus();
    });
  });

  els.input.addEventListener('compositionstart', () => { els.input.dataset.composing = '1'; });
  els.input.addEventListener('compositionend', () => { delete els.input.dataset.composing; });

  els.hintButton.addEventListener('click', () => {
    if (hintsShown) { clearHints(); return; }
    api('/chain/api/hint/', {}).then((data) => {
      if (!data) return;
      state = data;
      hintsShown = true;
      els.hintButton.setAttribute('aria-expanded', 'true');
      els.hints.hidden = false;
      els.hintOptions.innerHTML = (data.hint || []).map((item) => {
        const dictLink = item.public
          ? `<a class="hint-dict" href="/dictionary/${escapeHtml(item.entry_id)}/" target="_blank" rel="noopener noreferrer">词典 ↗</a>` : '';
        return `<div class="hint-choice"><button class="hint-word" type="button" data-say="${escapeHtml(item.word)}" aria-label="朗读 ${escapeHtml(item.word)}"><strong>${escapeHtml(item.word)}</strong></button>${dictLink}` +
        `<span class="hint-pinyin">${escapeHtml(item.pinyin || '')}</span>` +
        `<span class="hint-meaning">${escapeHtml(item.meaning || '暂无释义')}</span>` +
        `<button class="hint-fill" type="button" data-fill="${escapeHtml(item.word)}">填入输入框</button></div>`;
      }).join('');
      if ((data.hint || []).length > 24) {
        els.hintOptions.insertAdjacentHTML('beforebegin', '<p class="hint-total">共 ' + data.hint.length + ' 个候选，往下滚动查看。</p>');
      }
      els.hintOptions.querySelectorAll('[data-fill]').forEach((button) => button.addEventListener('click', () => {
        els.input.value = button.dataset.fill;
        els.input.focus();
        speak(button.dataset.fill);
      }));
      render();
    });
  });
  document.querySelectorAll('[data-hints-hide]').forEach((button) => button.addEventListener('click', () => {
    clearHints();
  }));

  function restart() {
    api('/chain/api/restart/', {}).then((data) => {
      if (!data) return;
      clearHints();
      state = data;
      showFeedback('新的一局开始啦。', 'success');
      render();
      els.input.focus();
    });
  }

  /* 家长对决：重开一局回到先手选择；start 动作会自动结束旧局。 */
  function showStartChoice() {
    state = {...state, status: 'needs_start'};
    render();
  }

  els.startChoice.querySelectorAll('[data-first-player]').forEach((button) => button.addEventListener('click', () => {
    api('/chain/api/start/', {first_player: button.dataset.firstPlayer}).then((data) => {
      if (!data) return;
      clearHints();
      state = data;
      showFeedback(`${playerName(state.first_player)}先手，新的一局开始啦。`, 'success');
      render();
      els.input.focus();
    });
  }));

  $('chain-restart-btn').addEventListener('click', () => {
    if (state.status === 'needs_start') return;
    if (state.chain.length <= 1 || window.confirm('当前对局还没结束，确定重开吗？')) {
      if (isDuel()) showStartChoice(); else restart();
    }
  });

  render();
  if (state.status === 'playing' && !isDuel()) els.input.focus();
})();
