/* 成语接龙前端：服务端权威，本文件只做渲染与提交；409 时自动重拉状态。 */
'use strict';

(() => {
  const stateEl = document.getElementById('chain-state');
  if (!stateEl) return;
  let state = JSON.parse(stateEl.textContent);

  const $ = (id) => document.getElementById(id);
  const chainEl = $('chain'), currentEl = $('chain-current'), nextEl = $('chain-next'),
        scoreEl = $('chain-score'), lengthEl = $('chain-length'), hintsEl = $('chain-hints'),
        errorEl = $('chain-error'), form = $('chain-form'), input = $('chain-word'),
        hintsEl2 = $('chain-hints'), endedEl = $('chain-ended'), historyEl = $('chain-history'),
        speakBtn = $('chain-speak-btn');
  let speakOn = false, composing = false;

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  const api = (path, body) => fetch(path, {
    method: 'POST', headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf()},
    body: JSON.stringify({...body, round_id: state.id, revision: state.revision}),
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (response.status === 409) { await refresh(); return null; }
    if (!response.ok) { showError(data.error || '操作未成功，请重试。'); return null; }
    return data;
  });

  const refresh = () => fetch('/games/api/state/', {headers: {'Accept': 'application/json'}})
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => { if (data) { state = data; render(); } });

  function showError(message) {
    errorEl.textContent = message; errorEl.hidden = false;
  }
  function clearError() { errorEl.hidden = true; }

  /* 客户端预校验只做即时反馈，服务端仍是唯一裁判。 */
  const HAN = /^[\u3400-\u9fff]{4}$/;
  const canUse = (word) => HAN.test(word) && word[0] === state.next_char &&
    !state.chain.some((item) => item.word === word);

  function speak(text) {
    if (!speakOn || !('speechSynthesis' in window) || !text) return;
    try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } catch (e) { /* 可选能力 */ }
  }

  function render() {
    chainEl.innerHTML = '';
    state.chain.forEach((item, index) => {
      const li = document.createElement('li');
      const who = item.by === 'partner' ? '小龙' : (item.by === 'start' ? '开局' : '你');
      li.innerHTML = `<span class="chain-no">${index + 1}</span><span class="chain-word">${item.word}</span>` +
        `<span class="chain-meta">${who}${item.pinyin ? ' · ' + item.pinyin : ''}</span>`;
      li.classList.toggle('is-partner', item.by === 'partner');
      chainEl.appendChild(li);
    });
    chainEl.scrollTop = chainEl.scrollHeight;

    const last = state.chain[state.chain.length - 1];
    if (last) {
      const head = last.word.slice(0, -1), tail = last.word.slice(-1);
      currentEl.innerHTML = `<p class="chain-bigword">${head}<b>${tail}</b></p>` +
        `<p class="chain-meaning">${last.meaning || '暂无释义，可在查词词典查看。'}</p>`;
    }
    nextEl.textContent = state.next_char || '—';
    scoreEl.textContent = state.score;
    lengthEl.textContent = Math.max(0, state.chain.length - 1);
    hintsEl.textContent = state.hints;

    const playing = state.status === 'playing';
    form.hidden = !playing;
    endedEl.hidden = playing;
    if (!playing) {
      endedEl.innerHTML = `<h2>${state.ended_reason || '本局结束'}</h2><p>共接 ${Math.max(0, state.chain.length - 1)} 手，得分 ${state.score}。</p>` +
        '<button class="button" type="button" id="chain-again">再来一局</button>';
      const again = document.getElementById('chain-again');
      if (again) again.addEventListener('click', restart);
    }
    hintsEl2.hidden = true;

    historyEl.innerHTML = (state.history || []).map((item) =>
      `<li><span>${item.finished_at}</span><span>${item.length} 手 · ${item.score} 分</span><span>${item.ended_reason}</span></li>`
    ).join('') || '<li>还没有完成的对局，接出第一局吧。</li>';

    input.disabled = !playing;
    $('chain-hint-btn').disabled = !playing;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();
    const word = input.value.trim();
    if (!HAN.test(word)) { showError('请输入四字成语。'); return; }
    if (state.next_char && word[0] !== state.next_char) { showError(`请以“${state.next_char}”字开头，不使用谐音。`); return; }
    if (state.chain.some((item) => item.word === word)) { showError('这个成语已经用过了，换一个吧。'); return; }
    api('/games/api/play/', {word}).then((data) => {
      if (!data) return;
      state = data; input.value = ''; render(); speak(state.chain[state.chain.length - 1].word);
      input.focus();
    });
  });

  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; });

  $('chain-hint-btn').addEventListener('click', () => {
    clearError();
    api('/games/api/hint/', {}).then((data) => {
      if (!data) return;
      state = data; render();
      const hints = data.hint || [];
      hintsEl2.innerHTML = '<h3>小龙的提示（任选一个填入）</h3>' + (hints.map((item, index) =>
        `<div class="chain-hint"><button class="text-button" type="button" data-fill="${item.word}">填入</button>` +
        `<b>${item.word}</b> ${item.pinyin ? '· ' + item.pinyin : ''}<br>${item.meaning || ''}</div>`).join(''));
      hintsEl2.hidden = false;
      hintsEl2.querySelectorAll('[data-fill]').forEach((button) => button.addEventListener('click', () => {
        input.value = button.dataset.fill; input.focus();
      }));
    });
  });

  function restart() {
    clearError();
    api('/games/api/restart/', {}).then((data) => { if (data) { state = data; render(); } });
  }
  $('chain-restart-btn').addEventListener('click', () => {
    if (state.chain.length <= 1 || window.confirm('当前对局还没结束，确定重新开始吗？')) restart();
  });

  speakBtn.addEventListener('click', () => {
    speakOn = !speakOn;
    speakBtn.textContent = speakOn ? '🔊 读词：开' : '🔊 读词：关';
    speakBtn.setAttribute('aria-pressed', String(speakOn));
    if (speakOn) speak(state.chain[state.chain.length - 1].word);
  });

  render();
  input.focus();
})();
