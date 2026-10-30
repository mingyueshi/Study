'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;
  const PAGE_SIZE = 20;
  let state = null, gameBusy = false, gameReady = false, gameLoadPromise = null;
  let hint = null, hintRevision = '', composing = false, reloadRequired = false;
  let mode = 'learn', list = [], page = 1, pages = 1, total = 0, index = 0, query = '';
  let listTicket = 0, detailTicket = 0, selected = null, listLoading = false, detailLoading = false, externalEntry = false;
  let chineseVoice = null, speaking = false, speechVersion = 0;
  const synth = window.speechSynthesis;
  const directory = $('results-disclosure');
  const compact = window.matchMedia('(max-width: 999px)');
  const provided = value => typeof value === 'string' && value.trim() && value.trim() !== '无';
  const currentWord = () => Array.isArray(state?.chain) ? state.chain.at(-1) : null;

  async function request(url, payload) {
    const response = await fetch(url, {
      method: payload === undefined ? 'GET' : 'POST', credentials: 'same-origin',
      headers: payload === undefined ? {'Accept': 'application/json'} : {'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CSRFToken': csrf},
      ...(payload === undefined ? {} : {body: JSON.stringify(payload)}),
    });
    let data;
    try { data = await response.json(); }
    catch (_) { const error = new Error('服务暂时没有响应，请稍后重试。'); error.status = response.status; error.uncertain = true; throw error; }
    if (!response.ok) {
      const error = new Error(response.status === 403 ? '页面验证已过期，请刷新页面后继续。' : (data.error || '操作未完成，请重试。'));
      error.status = response.status; throw error;
    }
    return data;
  }
  function message(text, type = '') {
    $('feedback').textContent = text;
    $('feedback').className = 'feedback' + (type ? ' ' + type : '');
    if (type === 'error') $('word-input').setAttribute('aria-invalid', 'true');
    else $('word-input').removeAttribute('aria-invalid');
  }
  function clearHint() {
    hint = null; hintRevision = '';
    $('hint-card').hidden = true;
    $('hint-word').textContent = ''; $('hint-meaning').textContent = '';
  }
  function canUse(item) {
    if (!item || detailLoading) return '先读完词条，再试着接龙。';
    if (!item.game_eligible) return '这个词仅供查阅，暂不能用于四字接龙。';
    if (!gameReady || !state) return '返回接龙后，先重新读取当前对局。';
    if (gameBusy) return '这一局正在更新，请稍等。';
    if (state.chain.some(entry => entry.word === item.word)) return '这个成语在本局已经用过，换一个试试。';
    if (item.word[0] !== state.next_char) return `这一局要接“${state.next_char}”字开头的成语。`;
    return '';
  }
  function controls() {
    const locked = gameBusy || !gameReady;
    $('play-button').disabled = locked || state?.status !== 'playing';
    $('hint-button').disabled = locked || state?.status !== 'playing';
    $('restart-button').disabled = locked;
    $('word-input').disabled = locked || state?.status !== 'playing';
    $('current-detail').disabled = !currentWord();
    const staleHint = !hint || hintRevision !== `${state?.id}:${state?.revision}`;
    $('fill-hint').disabled = locked || staleHint;
    $('read-hint').disabled = staleHint;
    $('retry-game').disabled = gameBusy;
    $('round-status').textContent = gameBusy ? '正在更新…' : (gameReady ? '这一局已保存' : '等待连接');
    renderReaderControls(); refreshVoice();
  }
  function renderGame(data) {
    if (!data?.id || !Array.isArray(data.chain) || !Number.isInteger(data.revision)) throw new Error('对局资料暂时不完整，请重新读取。');
    state = data; gameReady = true; reloadRequired = false;
    clearHint(); $('retry-game').hidden = true;
    $('score').textContent = data.score;
    $('length').textContent = Math.max(0, data.chain.length - 1);
    $('next-char').textContent = data.next_char || '—';
    $('input-next-char').textContent = data.next_char || '—';
    $('word-input').placeholder = data.next_char ? `“${data.next_char}”字开头` : '输入四字成语';
    $('dictionary-count').textContent = data.dictionary_count ?? '—';
    if (Number.isFinite(data.total_dictionary_count)) $('dictionary-total').textContent = data.total_dictionary_count.toLocaleString('zh-CN');
    const current = currentWord();
    $('current-word').replaceChildren();
    if (current) {
      const chars = Array.from(current.word);
      $('current-word').append(document.createTextNode(chars.slice(0, -1).join('')));
      const last = document.createElement('span'); last.className = 'last-char'; last.textContent = chars.at(-1);
      $('current-word').append(last);
      $('current-meaning').textContent = current.meaning || '查看完整词条，了解这个成语。';
      $('current-pinyin').textContent = current.pinyin || '这局记录未附拼音，可查看完整词条。';
    }
    $('chain').replaceChildren();
    data.chain.forEach((item, i) => {
      const li = document.createElement('li');
      const number = document.createElement('span'); number.className = 'number'; number.textContent = String(i + 1).padStart(2, '0');
      const word = document.createElement('button'); word.type = 'button'; word.textContent = item.word;
      word.setAttribute('aria-label', `查看“${item.word}”的完整词条`); word.onclick = () => openWord(item);
      li.append(number, word); $('chain').append(li);
    });
    $('history').replaceChildren();
    (data.history || []).slice(0, 5).forEach(item => {
      const li = document.createElement('li'), detail = document.createElement('div');
      detail.textContent = `接上 ${Math.max(0, item.length)} 个成语`;
      const date = new Date(item.created_at);
      if (!Number.isNaN(date.getTime())) {
        const time = document.createElement('small');
        time.textContent = new Intl.DateTimeFormat('zh-CN', {timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}).format(date);
        detail.append(time);
      }
      const score = document.createElement('strong'); score.textContent = `${item.score} 分`;
      li.append(detail, score); $('history').append(li);
    });
    if (!data.history?.length) {
      const li = document.createElement('li'); li.className = 'empty'; li.textContent = '完成一局后，成绩会留在这里。'; $('history').append(li);
    }
    controls();
  }
  function showRetry(error) {
    gameReady = false; clearHint(); reloadRequired = error.status === 403;
    $('retry-game').textContent = reloadRequired ? '刷新页面' : '重新读取对局';
    $('retry-game').hidden = false;
  }
  function loadGame() {
    if (gameLoadPromise) return gameLoadPromise;
    gameBusy = true; gameReady = false; controls(); message('正在读取你的接龙进度…');
    gameLoadPromise = (async () => {
      try {
        renderGame(await request('/api/state/'));
        message('这一局已经准备好，想一想，再把成语接上。');
      } catch (error) { showRetry(error); message(error.message || '连接失败，请重试。', 'error'); }
      finally { gameBusy = false; gameLoadPromise = null; controls(); }
      return state;
    })();
    return gameLoadPromise;
  }
  function ensureGame() { return gameReady ? Promise.resolve(state) : loadGame(); }
  async function action(kind, payload = {}) {
    if (gameBusy || !gameReady || !state) return;
    gameBusy = true; controls(); message(kind === 'play' ? '正在核对成语…' : '正在处理…');
    try {
      const data = await request(`/api/${kind}/`, {...payload, revision: state.revision, round_id: state.id});
      renderGame(data);
      if (kind === 'hint' && data.hint) {
        hint = data.hint; hintRevision = `${state.id}:${state.revision}`;
        $('hint-word').textContent = hint.word; $('hint-meaning').textContent = hint.meaning;
        $('hint-card').hidden = false; message('提示已送达。可以先读懂，再填入，最后自己确认接上。');
      } else if (kind === 'play') { $('word-input').value = ''; message('接对啦！这条成语龙又长大了一点。', 'success'); }
      else if (kind === 'restart') { $('word-input').value = ''; message('新的一局，从这里出发。'); }
    } catch (error) {
      let explanation = error.message || '连接中断。请先重新读取对局，确认当前进度。';
      if (error.status === 409) {
        gameReady = false; clearHint();
        try { renderGame(await request('/api/state/')); explanation = '已同步这局最新进度，请核对接字后再试。'; }
        catch (refreshError) { showRetry(refreshError); explanation = '这局已更新，暂时无法读取最新进度，请重新读取对局。'; }
      } else if (!error.status || error.uncertain || error.status >= 500 || error.status === 403) showRetry(error);
      message(explanation, 'error');
    } finally {
      gameBusy = false; controls();
      if (kind === 'play' && mode === 'game' && gameReady && window.matchMedia('(min-width: 640px)').matches) $('word-input').focus();
    }
  }
  function stopSpeech() {
    speechVersion++; speaking = false;
    if (synth) synth.cancel();
    $('stop-speak').disabled = true;
    $('stop-current-speak').disabled = true;
    $('stop-current-speak').hidden = true;
  }
  function refreshVoice() {
    chineseVoice = synth ? synth.getVoices().find(voice => /^zh(?:-|_|$)/i.test(voice.lang)) : null;
    $('speak').disabled = !chineseVoice || !selected || detailLoading || listLoading;
    $('speak-current').disabled = !chineseVoice || !currentWord() || !gameReady;
    $('speak-current').title = chineseVoice ? '浏览器中文合成朗读' : '当前浏览器没有可用的中文语音';
    $('voice-note').textContent = chineseVoice ? '设备合成朗读，非权威录音；多音字请结合词典核对。' : '当前浏览器没有可用的中文语音，朗读暂不可用。';
    $('game-voice-note').textContent = chineseVoice ? '设备中文合成朗读' : '本浏览器暂无中文语音';
    $('stop-speak').disabled = !speaking;
    $('stop-current-speak').disabled = !speaking;
    $('stop-current-speak').hidden = !speaking;
  }
  function readAloud(text) {
    stopSpeech(); if (!chineseVoice || !synth) return;
    const ticket = speechVersion, utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = chineseVoice; utterance.lang = chineseVoice.lang; utterance.rate = .8;
    speaking = true; refreshVoice();
    utterance.onend = utterance.onerror = () => { if (ticket === speechVersion) { speaking = false; refreshVoice(); } };
    try { synth.speak(utterance); }
    catch (_) { speaking = false; refreshVoice(); $('voice-note').textContent = '朗读暂时无法使用，请稍后再试。'; }
  }
  function setMode(value, updateHash = true) {
    stopSpeech(); mode = value === 'game' ? 'game' : 'learn';
    document.body.dataset.mode = mode;
    $('learning').hidden = mode !== 'learn'; $('game-mode').hidden = mode !== 'game';
    for (const name of ['learn', 'game']) {
      const active = mode === name, tab = $(name + '-tab');
      tab.setAttribute('aria-selected', String(active)); tab.setAttribute('aria-pressed', String(active)); tab.tabIndex = active ? 0 : -1;
    }
    if (updateHash) history.replaceState(null, '', '#' + mode);
    if (mode === 'game') ensureGame();
  }

  function renderReaderControls() {
    const loading = listLoading || detailLoading;
    $('reading-card').setAttribute('aria-busy', String(loading));
    $('previous-word').disabled = loading || externalEntry || !list.length || (index === 0 && page <= 1);
    $('next-word').disabled = loading || externalEntry || !list.length || (index >= list.length - 1 && page >= pages);
    $('previous-page').disabled = loading || page <= 1;
    $('next-page').disabled = loading || page >= pages || !list.length;
    $('reading-count').textContent = loading ? '正在读取…' : externalEntry ? '来自接龙的词条' : total ? `第 ${(page - 1) * PAGE_SIZE + index + 1} / ${total} 条` : '暂无词条';
    $('page-label').textContent = listLoading ? '正在查询…' : list.length ? `第 ${page} / ${pages} 页` : '暂无结果';
    $('results-count').textContent = list.length;
    $('clear-search').hidden = !query && !$('dictionary-search').value.trim();
    $('game-return-bar').hidden = !externalEntry;
    $('back-to-results').hidden = !externalEntry;
    const reason = canUse(selected);
    $('use-word').disabled = Boolean(reason);
    $('use-word-note').textContent = reason || '可以接上当前的字。填入后仍需自己确认提交。';
    [...$('dictionary-results').children].forEach((button, i) => {
      if (selected && list[i]?.id === selected.id) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    refreshVoice();
  }
  function resetSourceDetails() {
    for (const id of ['reading-derivation', 'reading-example', 'reading-source', 'reading-source-status', 'reading-abbreviation', 'reading-summary-text', 'reading-raw-text']) $(id).textContent = '';
    $('reading-summary').hidden = true; $('reading-summary').open = false;
    $('reading-raw').open = false; $('reading-more').open = false;
    $('reading-source-link').hidden = true; $('reading-source-link').removeAttribute('href');
    document.querySelector('.source-details').open = false;
  }
  function clearReading(title, text) {
    selected = null;
    $('reading-word').textContent = title; $('reading-word').classList.remove('long-word');
    document.querySelector('.word-seal').textContent = '文';
    $('reading-pinyin').textContent = ''; $('reading-warning').textContent = '';
    $('reading-position').textContent = '成语阅读'; $('reading-meaning').textContent = text;
    resetSourceDetails();
  }
  async function detail(item, focus = false) {
    stopSpeech(); selected = null; detailLoading = true;
    const ticket = ++detailTicket;
    clearReading(item.word || '正在读取', '正在读取词条…'); renderReaderControls();
    try {
      const id = item.id || item.idiom_id;
      const data = await request(id ? `/api/idioms/${encodeURIComponent(id)}/` : `/api/idioms/lookup/?word=${encodeURIComponent(item.word)}`);
      if (ticket !== detailTicket) return;
      if (typeof data.word !== 'string') throw new Error('词条资料暂时无法读取，请稍后再试。');
      selected = data;
      $('reading-word').textContent = data.word;
      $('reading-word').classList.toggle('long-word', Array.from(data.word).length > 6);
      document.querySelector('.word-seal').textContent = Array.from(data.word)[0] || '文';
      $('reading-pinyin').textContent = provided(data.pinyin) ? data.pinyin : '来源暂未提供可用拼音';
      $('reading-warning').textContent = data.reading_status === 'format_checked' ? '拼音通过基本格式检查，尚未经人工校音。' : '原始读音待核，请结合权威词典确认。';
      const hasOriginal = provided(data.source_explanation);
      const explanation = hasOriginal ? data.source_explanation : provided(data.meaning) ? data.meaning : '来源暂未提供释义。';
      $('reading-meaning').textContent = explanation;
      $('reading-source-status').textContent = data.source_missing ? '仅有保留简释，暂无来源补充' : hasOriginal ? '完整释义 · 来源原文' : '来源暂缺完整释义';
      $('reading-summary').hidden = !provided(data.summary) || data.summary === explanation;
      $('reading-summary-text').textContent = data.summary || '';
      $('reading-derivation').textContent = provided(data.derivation) ? data.derivation : '来源暂未提供出处。';
      $('reading-example').textContent = provided(data.example) ? data.example : '来源暂未提供例句。';
      $('reading-abbreviation').textContent = `拼音首字母：${provided(data.abbreviation) ? data.abbreviation : '来源未提供'}`;
      $('reading-source').textContent = `来源标记：${data.source || '未标注'} · 数据版本：${data.source_version || '未标注'}`;
      $('reading-raw-text').textContent = data.source_raw && Object.keys(data.source_raw).length ? JSON.stringify(data.source_raw, null, 2) : '暂无原始来源记录。';
      try {
        const url = new URL(data.source_url);
        if (url.protocol === 'https:' || url.protocol === 'http:') { $('reading-source-link').href = url.href; $('reading-source-link').hidden = false; }
      } catch (_) { /* 缺少来源地址时不生成链接。 */ }
      $('reading-position').textContent = data.game_eligible ? '可用于四字接龙' : '仅供阅读 · 暂不参与接龙';
      if (focus && mode === 'learn') {
        $('reading-word').focus({preventScroll: true});
        $('reading-card').scrollIntoView({block: 'start', behavior: 'instant'});
      }
    } catch (error) {
      if (ticket !== detailTicket) return;
      clearReading(error.status === 404 ? '暂未收录' : '暂时读不到', error.status === 404 ? '当前词库未收录这个词，不代表它不是成语。试试其他关键词。' : (error.message || '连接中断，请重新选择词条或查询。'));
    } finally { if (ticket === detailTicket) { detailLoading = false; renderReaderControls(); } }
  }
  async function chooseEntry(i) {
    if (!list[i] || listLoading) return;
    index = i; externalEntry = false;
    if (compact.matches) directory.open = false;
    await detail(list[i], compact.matches);
  }
  async function search(targetPage = 1, selectLast = false) {
    stopSpeech(); const ticket = ++listTicket; ++detailTicket;
    selected = null; listLoading = true; detailLoading = false; externalEntry = false;
    list = []; total = 0; index = 0;
    $('dictionary-results').replaceChildren(); clearReading('正在查找', '正在打开成语词典…');
    $('search-feedback').textContent = '正在查询…'; renderReaderControls();
    try {
      const data = await request(`/api/idioms/?q=${encodeURIComponent(query)}&page=${targetPage}`);
      if (ticket !== listTicket) return;
      if (!Array.isArray(data.results)) throw new Error('查询结果暂时无法读取，请重试。');
      list = data.results; page = data.page; pages = data.pages; total = data.total;
      index = selectLast ? Math.max(0, list.length - 1) : 0;
      if (!query) $('dictionary-total').textContent = total.toLocaleString('zh-CN');
      list.forEach((item, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = item.word;
        button.onclick = () => chooseEntry(i); $('dictionary-results').append(button);
      });
      $('search-feedback').textContent = total ? `找到 ${total.toLocaleString('zh-CN')} 条，点一个成语开始阅读。` : '暂未找到匹配词条。未收录不等于不是成语，可以换个关键词。';
      listLoading = false;
      if (list.length) await detail(list[index]);
      else clearReading('暂未收录', '试试其他关键词，或清空搜索，浏览全部成语。');
    } catch (error) {
      if (ticket !== listTicket) return;
      list = []; total = 0; page = pages = 1; selected = null;
      $('search-feedback').textContent = error.message || '查询没有完成，请再试一次。';
      clearReading('再试一次', '词典暂时无法读取，可以点击“查一查”重试。');
    } finally { if (ticket === listTicket) { listLoading = false; renderReaderControls(); } }
  }
  function move(delta) {
    if (listLoading || detailLoading || externalEntry || !list.length) return;
    const next = index + delta;
    if (next < 0) { if (page > 1) search(page - 1, true); }
    else if (next >= list.length) { if (page < pages) search(page + 1); }
    else { index = next; detail(list[index]); }
  }
  async function openWord(item) {
    if (!item?.word) return;
    ++listTicket; listLoading = false; externalEntry = true;
    setMode('learn');
    $('search-feedback').textContent = '正在查看接龙词条；原来的搜索结果仍然保留。';
    if (compact.matches) directory.open = false;
    await detail(item, true);
  }

  $('learn-tab').onclick = () => setMode('learn');
  $('game-tab').onclick = () => setMode('game');
  document.querySelector('.mode-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 'learn' : event.key === 'End' ? 'game' : mode === 'learn' ? 'game' : 'learn';
    setMode(next); $(next + '-tab').focus();
  });
  window.addEventListener('hashchange', () => setMode(location.hash === '#game' ? 'game' : 'learn', false));
  $('read-to-game').onclick = () => setMode('game');
  $('return-to-game').onclick = async () => { setMode('game'); await ensureGame(); if (gameReady) $('word-input').focus(); };
  $('use-word').onclick = async () => {
    const item = selected; if (canUse(item)) return;
    setMode('game'); await ensureGame(); if (canUse(item)) return;
    $('word-input').value = item.word; $('word-input').focus(); message('已填入成语，确认后再点“接上它”。');
  };
  $('back-to-results').onclick = () => {
    externalEntry = false; $('dictionary-search').value = query;
    if (list.length) { $('search-feedback').textContent = `找到 ${total.toLocaleString('zh-CN')} 条，继续阅读。`; detail(list[index]); }
    else search();
  };
  $('search-form').onsubmit = event => { event.preventDefault(); query = $('dictionary-search').value.trim(); search(); };
  $('dictionary-search').addEventListener('input', () => { $('clear-search').hidden = !$('dictionary-search').value.trim() && !query; });
  $('clear-search').onclick = () => { query = ''; $('dictionary-search').value = ''; search(); };
  $('previous-word').onclick = () => move(-1); $('next-word').onclick = () => move(1);
  $('previous-page').onclick = () => { if (page > 1 && !listLoading && !detailLoading) search(page - 1); };
  $('next-page').onclick = () => { if (page < pages && !listLoading && !detailLoading) search(page + 1); };
  $('current-detail').onclick = () => openWord(currentWord());
  $('read-hint').onclick = () => { if (hint && hintRevision === `${state?.id}:${state?.revision}`) openWord(hint); };
  $('fill-hint').onclick = () => {
    if (gameBusy || !hint || hintRevision !== `${state?.id}:${state?.revision}`) return;
    $('word-input').value = hint.word; $('word-input').focus(); message('已填入提示，想好后再点“接上它”。');
  };
  $('word-input').addEventListener('compositionstart', () => { composing = true; });
  $('word-input').addEventListener('compositionend', () => { composing = false; });
  $('play-form').onsubmit = event => {
    event.preventDefault(); if (composing) return;
    const word = $('word-input').value.trim();
    if (word) action('play', {word}); else message('先写下一个四字成语，再接上它。', 'error');
  };
  $('hint-button').onclick = () => action('hint');
  $('restart-button').onclick = () => {
    if (gameBusy || !gameReady) return;
    if (state.chain.length > 1 && !window.confirm('结束当前对局并重新开始？当前成绩会保留在最近记录中。')) return;
    action('restart');
  };
  $('retry-game').onclick = () => { if (reloadRequired) location.reload(); else if (!gameBusy) loadGame(); };
  $('speak').onclick = () => { if (selected) readAloud(selected.word + '。' + $('reading-meaning').textContent); };
  $('speak-current').onclick = () => { const item = currentWord(); if (item) readAloud(item.word + '。' + (item.meaning || '')); };
  $('stop-speak').onclick = stopSpeech;
  $('stop-current-speak').onclick = stopSpeech;
  if (synth) synth.addEventListener('voiceschanged', refreshVoice);
  window.addEventListener('pagehide', stopSpeech);
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || mode !== 'learn' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input,textarea,select,[contenteditable],[role="tablist"]')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
  });
  const syncDirectory = () => { directory.open = !compact.matches; };
  syncDirectory(); compact.addEventListener('change', syncDirectory);
  refreshVoice(); renderReaderControls();
  setMode(location.hash === '#game' ? 'game' : 'learn', false);
  search();
})();
