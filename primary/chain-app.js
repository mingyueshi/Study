/* 成语接龙界面：输入与中文输入法、提示、点读、进度保存。 */
'use strict';

(() => {
  const STORE_KEY = 'idiom_chain_v1';
  const dictionary = ChainEngine.createDictionary(IDIOM_UNITS, IDIOM_ZH, CHAIN_SUPPLEMENTS);
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (error) { /* 存档不可用时从新一轮开始 */ }
  const game = ChainEngine.createGame(dictionary, saved);
  let sound = !saved || saved.sound !== false;
  let composing = false;
  let hints = [];
  const $ = id => document.getElementById(id);
  const answer = $('answer');
  const form = $('answerForm');
  const labels = { start: '开头', player: '我接的', partner: '小龙接的' };
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const wordHTML = word => esc(word.slice(0, -1)) + '<span class="tail">' + esc(word.slice(-1)) + '</span>';

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ ...game.snapshot(), sound }));
      $('storageNote').textContent = '本轮进度与纪录自动保存在当前浏览器';
    } catch (error) { $('storageNote').textContent = '浏览器未允许保存，本次进度仅在当前页面保留'; }
  }

  function speak(text) {
    if (window.SpeechKit) SpeechKit.speak(text, { rate: .85 });
  }

  function feedback(message, kind) {
    $('feedback').textContent = message;
    $('feedback').className = 'feedback' + (kind ? ' ' + kind : '');
    answer.setAttribute('aria-invalid', kind === 'error' ? 'true' : 'false');
  }

  function hideHints() {
    hints = [];
    $('hintPanel').hidden = true;
    $('hintButton').setAttribute('aria-expanded', 'false');
  }

  function render() {
    const now = game.status();
    const state = game.snapshot();
    const last = state.round.trail[state.round.trail.length - 1];
    $('currentLabel').textContent = last.by === 'start' ? '从这个成语开始' : last.by === 'partner' ? '小龙接上了' : '你刚刚接上了';
    $('currentWord').innerHTML = wordHTML(now.current.idiom);
    $('readCurrent').setAttribute('aria-label', '朗读 ' + now.current.idiom);
    $('currentPinyin').textContent = now.current.pinyin;
    $('currentPinyin').hidden = !now.current.pinyin;
    $('currentMeaning').textContent = now.current.zh;
    $('nextChar').textContent = now.tail;
    $('poolCount').textContent = '内置词库 ' + dictionary.entries.length + ' 条';
    $('turnLabel').textContent = now.ended ? '本轮完成' : '轮到你啦';
    answer.placeholder = '「' + now.tail + '」字开头';
    answer.disabled = now.ended;
    $('submitButton').disabled = now.ended;
    $('hintButton').disabled = now.ended;
    $('roundEnd').hidden = !now.ended;
    if (now.ended) $('endMessage').textContent = '你接对了 ' + now.playerCount + ' 个成语！当前词库中没有未用过的「' + now.tail + '」字开头的成语了，换个开头继续积累吧。';
    $('roundScore').textContent = now.playerCount;
    $('bestLabel').textContent = now.mode === 'solo' ? '自己接龙最佳' : '小龙陪练最佳';
    $('bestScore').textContent = state.totals.best[now.mode];
    $('totalScore').textContent = state.totals.accepted;
    $('trailCount').textContent = state.round.trail.length + ' 个成语';
    $('soundButton').textContent = sound ? '🔊' : '🔇';
    $('soundButton').setAttribute('aria-label', sound ? '关闭自动朗读' : '开启自动朗读');
    $('soundButton').setAttribute('aria-pressed', String(sound));
    document.querySelectorAll('[data-action="mode"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === now.mode)));
    $('trailList').innerHTML = state.round.trail.map((entry, index) => {
      const word = dictionary.byId.get(entry.idiom);
      return '<li class="trail-entry' + (index === state.round.trail.length - 1 ? ' latest' : '') + '" value="' + (index + 1) + '">' +
        '<div class="entry-top"><span class="entry-' + entry.by + '">' + labels[entry.by] + '</span><span>第 ' + (index + 1) + ' 个</span></div>' +
        '<button class="trail-word" type="button" data-action="say" data-word="' + esc(word.idiom) + '" aria-label="朗读 ' + esc(word.idiom) + '">' + wordHTML(word.idiom) + '</button>' +
        (word.pinyin ? '<p class="trail-pinyin">' + esc(word.pinyin) + '</p>' : '') +
        '<p class="trail-meaning">' + esc(word.zh) + '</p></li>';
    }).reverse().join('');
  }

  function start(mode) {
    game.newRound(mode);
    hideHints();
    answer.value = '';
    render();
    feedback('新一轮开始啦！以「' + game.status().tail + '」字开头，试着接一个成语。');
    save();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (composing) return;
    const result = game.submit(answer.value);
    if (!result.ok) { feedback(result.message, 'error'); answer.focus({ preventScroll: true }); return; }
    answer.value = '';
    hideHints();
    render();
    feedback(result.reply ? '接对啦！小龙接了「' + result.reply + '」，接下来轮到你。' : '接对啦！「' + result.word + '」已经加入这条成语龙。', 'success');
    save();
    if (sound) speak(result.reply ? result.word + '。小龙接：' + result.reply : result.word);
    if (!game.status().ended) answer.focus({ preventScroll: true });
  });
  answer.addEventListener('compositionstart', () => { composing = true; });
  answer.addEventListener('compositionend', () => { composing = false; });
  answer.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.isComposing || event.keyCode === 229 || composing)) event.preventDefault();
  });
  answer.addEventListener('input', () => {
    if (answer.getAttribute('aria-invalid') === 'true') feedback('想一想，再试一次。');
  });

  $('hintButton').addEventListener('click', () => {
    if (!$('hintPanel').hidden) { hideHints(); return; }
    hints = game.hint();
    if (!hints.length) return;
    $('hintOptions').innerHTML = hints.map(word =>
      '<button type="button" class="hint-choice" data-action="fill" data-word="' + esc(word.idiom) + '"><strong>' + esc(word.idiom) + '</strong>' +
      '<span class="hint-meaning">' + esc(word.zh) + '</span><span class="hint-fill">填入这个成语 ↗</span></button>'
    ).join('');
    $('hintPanel').hidden = false;
    $('hintButton').setAttribute('aria-expanded', 'true');
    save();
  });
  $('readCurrent').addEventListener('click', () => speak(game.status().current.idiom));
  $('soundButton').addEventListener('click', () => {
    sound = !sound;
    if (!sound) { try { speechSynthesis.cancel(); } catch (error) {} }
    render();
    save();
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'new') start();
    else if (action === 'mode' && button.dataset.mode !== game.status().mode) start(button.dataset.mode);
    else if (action === 'say') speak(button.dataset.word);
    else if (action === 'hide-hints') hideHints();
    else if (action === 'fill' && hints.some(word => word.idiom === button.dataset.word)) {
      answer.value = button.dataset.word;
      feedback('读懂释义后，点「接上它」继续吧。');
      answer.focus({ preventScroll: true });
      form.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  });
  window.addEventListener('pagehide', () => { try { speechSynthesis.cancel(); } catch (error) {} });

  render();
  if (game.status().ended) feedback('本轮进度已恢复，可以换个开头继续玩。');
  else if (game.status().playerCount) feedback('已恢复上次的接龙，继续以「' + game.status().tail + '」字开头吧。');
  save();
  window.IdiomChainApp = { game, dictionary };
})();
