/* Page-local practice. The server checks both answers and signed state. */
'use strict';
(() => {
  const initial = document.getElementById('feihualing-state');
  if (!initial) return;
  let state = JSON.parse(initial.textContent);
  let busy = false, composing = false, epoch = 0, pendingKeyword = null, needsRestart = false;
  const $ = id => document.getElementById(id);
  const els = Object.fromEntries(['keywords','keyword','writing-title','dots','unavailable','unavailable-copy','form','answer','count','submit','feedback','complete','complete-title','complete-copy','again','change','reset','hint-panel','hint-button','hint','hint-source','masked','reveal','corpus-note','history-count','history-empty','history','confirm','confirm-title','confirm-copy','confirm-yes','confirm-no','custom-char','custom-start'].map(key => [key, $('fh-' + key)]));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const feedback = (message, error=false) => {
    els.feedback.textContent = message;
    els.feedback.classList.toggle('is-error', error);
  };
  const poemMarkup = text => (String(text).match(/[^，。！？；：、,.!?;:]+[，。！？；：、,.!?;:]*/g) || [text])
    .map(line => `<span class="fh-poem-line">${escape(line.trim()).split(escape(state.keyword)).join(`<mark>${escape(state.keyword)}</mark>`)}</span>`).join('');
  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');

  function render() {
    const available = state.available === true;
    const playing = available && state.status === 'playing' && !needsRestart;
    els.keywords.innerHTML = (state.keywords || []).map(row => `<button type="button" class="fh-keyword" data-keyword="${escape(row.char)}" aria-label="${escape(row.char)}字令，${row.count}句可用" aria-pressed="${row.char === state.keyword}" ${busy || !row.enabled ? 'disabled' : ''}><b>${escape(row.char)}</b><small>${row.enabled ? `${Number(row.count).toLocaleString('zh-CN')} 句` : '资料不足'}</small></button>`).join('');
    els.keyword.textContent = state.keyword || '月';
    els.keyword.setAttribute('aria-label', '本局令字' + (state.keyword || '月'));
    els['writing-title'].textContent = `写一句含“${state.keyword || '月'}”的诗`;
    els.answer.placeholder = `写一句含“${state.keyword || '月'}”的诗`;
    els.count.textContent = `${state.count || 0} / 5`;
    els['history-count'].textContent = `${state.count || 0} / 5`;
    els.dots.innerHTML = Array.from({length:5}, (_, i) => `<span class="${i < (state.count || 0) ? 'is-done' : ''}" aria-hidden="true"></span>`).join('');
    els.dots.setAttribute('aria-label', `已完成${state.count || 0}次，共五次`);
    els.unavailable.hidden = available;
    els['unavailable-copy'].textContent = available ? '' : state.message;
    els.form.hidden = !available || !playing;
    els.answer.disabled = !playing;
    els.answer.readOnly = busy;
    els.submit.disabled = busy || !playing;
    els.submit.textContent = busy ? '正在核对…' : '提交诗句 ↗';
    els.form.setAttribute('aria-busy', String(busy));
    els.reset.disabled = busy || !available;
    els['hint-panel'].hidden = !playing;
    els['hint-button'].disabled = busy || !playing;
    els['hint-button'].textContent = state.hint ? '提示笺已展开' : '借张提示笺';
    els.hint.hidden = !state.hint || !playing;
    if (state.hint) {
      els['hint-source'].textContent = `《${state.hint.title}》 · ${state.hint.author}`;
      els.masked.textContent = state.hint.masked;
    }
    els.reveal.disabled = busy || !playing;
    const finished = available && (state.status === 'completed' || state.status === 'exhausted');
    els.complete.hidden = !finished;
    els['complete-title'].textContent = state.status === 'exhausted' ? '这枚令字的诗句练完啦' : '五句完成，真不错！';
    els['complete-copy'].textContent = `独立作答 ${state.independent || 0} 次，提示学习 ${state.learning || 0} 次。再读一遍，把诗句留在心里。`;
    els.again.textContent = `再练“${state.keyword || '月'}”字`;
    els.again.disabled = els.change.disabled = busy;
    const history = state.history || [];
    els['history-empty'].hidden = history.length > 0;
    els.history.innerHTML = history.map(item => `<li class="fh-history-item"><blockquote>${poemMarkup(item.text)}</blockquote><p>《${escape(item.title)}》 · ${escape(item.author)}</p>${item.editorial_note ? `<p class="fh-editorial-note">${escape(item.editorial_note)}</p>` : ''}<div class="fh-history-meta"><span class="${item.mode === 'learning' ? 'is-learning' : ''}">${escape(item.label)}</span><a href="${escape(item.url)}" target="_blank" rel="noopener noreferrer">查看原诗 ↗</a></div></li>`).join('');
    if (available) els['corpus-note'].textContent = `唐诗、宋词、诗经、楚辞与千家诗 · 可用完整诗句 ${Number(state.sentence_count || 0).toLocaleString('zh-CN')} 句。完成一局会计入你的学习足迹。`;
    els['confirm-yes'].disabled = els['confirm-no'].disabled = busy;
  }

  async function request(action, extra={}) {
    if (busy) return;
    const ticket = ++epoch;
    busy = true;
    render();
    try {
      const response = await fetch($('feihualing').dataset.api, {
        method:'POST', headers:{'Content-Type':'application/json','X-CSRFToken':csrf()},
        body:JSON.stringify({action, token:state.token, ...extra}),
      });
      const data = await response.json().catch(() => null);
      if (ticket !== epoch) return;
      if (!response.ok) {
        if (data?.restart_required) needsRestart = true;
        feedback(response.status === 403 ? '安全校验已过期，请刷新页面后重新练习。' : data?.error || '暂时无法核对，请稍后再试；诗句和当前练习已保留。', true);
        return;
      }
      if (!data || data.available !== true || typeof data.token !== 'string' || !Array.isArray(data.history) || !Number.isInteger(data.count) || data.count < 0 || data.count > 5) {
        feedback('返回信息未完整确认，诗句和原局已保留，请稍后再试。', true);
        return;
      }
      state = data;
      needsRestart = false;
      if (action === 'new' || data.outcome === 'accepted' || data.outcome === 'revealed') els.answer.value = '';
      els.confirm.hidden = true;
      pendingKeyword = null;
      feedback(data.message || '新一局已准备好，慢慢想一句吧。', ['unknown','duplicate','missing_keyword'].includes(data.outcome));
    } catch (error) {
      if (ticket === epoch) feedback('连接中断，诗句和原局已保留。可以重新提交；不会自动重发。', true);
    } finally {
      if (ticket === epoch) { busy = false; render(); if (action === 'answer' && !els.form.hidden) els.answer.focus(); }
    }
  }

  function choose(keyword, explicitNew=false) {
    if (busy) return;
    if ((state.count > 0 || els.answer.value.trim()) && !explicitNew) {
      pendingKeyword = keyword;
      els['confirm-title'].textContent = keyword === state.keyword ? '重新练习这个字？' : `换成“${keyword}”字令？`;
      els['confirm-copy'].textContent = '新一局会清空本页诗单。想好了，再轻轻换一页。';
      els['confirm-yes'].textContent = '开启新局';
      els.confirm.hidden = false;
      els['confirm-no'].focus();
      els.confirm.scrollIntoView({block:'nearest'});
      return;
    }
    request('new', {keyword});
  }

  els.keywords.addEventListener('click', event => {
    const button = event.target.closest('[data-keyword]');
    if (button && !button.disabled) choose(button.dataset.keyword);
  });
  /* 自定义令字：任意单个汉字；语料不足五句时后端会如实拒绝。 */
  const CUSTOM_HAN = /^[\u3400-\u9fff\uf900-\ufaff\U00020000-\U000323af]$/;
  const startCustom = () => {
    const value = (els['custom-char'].value || '').trim();
    if (!CUSTOM_HAN.test(value)) {
      feedback('自定义令字请输入一个汉字。', true);
      els['custom-char'].focus();
      return;
    }
    choose(value);
  };
  els['custom-start'].addEventListener('click', startCustom);
  els['custom-char'].addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); startCustom(); }
  });
  els.form.addEventListener('submit', event => {
    event.preventDefault();
    if (composing || busy) return;
    if (!els.answer.value.trim()) { feedback('先写一句诗，再提交吧。', true); els.answer.focus(); return; }
    request('answer', {answer:els.answer.value});
  });
  els.answer.addEventListener('compositionstart', () => { composing = true; });
  els.answer.addEventListener('compositionend', () => { composing = false; });
  els.answer.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (composing || event.isComposing || event.keyCode === 229)) return;
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); els.form.requestSubmit(); }
  });
  els['hint-button'].addEventListener('click', () => request('hint'));
  els.reveal.addEventListener('click', () => request('reveal'));
  els.reset.addEventListener('click', () => choose(state.keyword));
  els.again.addEventListener('click', () => choose(state.keyword, true));
  els.change.addEventListener('click', () => {
    const first = els.keywords.querySelector('button:not(:disabled)');
    first?.focus();
    els.keywords.scrollIntoView({block:'center'});
    feedback('在令字笺上选一个字，开启下一页练习。');
  });
  els['confirm-yes'].addEventListener('click', () => { if (pendingKeyword) request('new', {keyword:pendingKeyword}); });
  els['confirm-no'].addEventListener('click', () => { els.confirm.hidden = true; pendingKeyword = null; els.answer.focus(); });
  render();
})();
