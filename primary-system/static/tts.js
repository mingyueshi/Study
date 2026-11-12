/* 点读接线：把本项目的 SpeechKit 引擎接到服务端渲染页面上。
   - [data-say]：点击即朗读该属性文本（可选 data-rate 语速）
   - [data-tts-sequence]：连读按钮，按选择器取 [data-say-seq] 序列逐个朗读并高亮
   - #tts-voice：英语发音人偏好；教材与场景页共用 #tts-rate / #tts-volume */
'use strict';

(() => {
  const kit = window.SpeechKit;
  if (!kit) return;

  const rateControl = document.getElementById('tts-rate');
  const volumeControl = document.getElementById('tts-volume');
  const intervalControl = document.getElementById('tts-interval');
  const repeatControl = document.getElementById('tts-repeat');
  const sequenceStatus = document.getElementById('tts-sequence-status');
  const sequencePlayer = document.getElementById('tts-sequence-player');
  const sequenceCurrent = document.getElementById('tts-sequence-current');
  const sequenceProgress = document.getElementById('tts-sequence-progress');
  const unitPlay = document.getElementById('tts-unit-play') || document.getElementById('words-play-btn');
  const restartControl = document.getElementById('tts-sequence-restart');
  const stopControl = document.getElementById('tts-sequence-stop');
  const scopeControl = document.getElementById('tts-text-scope');
  const readingContent = document.getElementById('english-cards') || document.getElementById('english-dialogues') || document.getElementById('words-cards') || document.getElementById('idiom-cards');
  // 英语沿用原有偏好；中文速度和音量单独保存，避免影响英语跟读。
  const playbackKey = sequencePlayer?.dataset.ttsLanguage === 'zh-CN' ? 'chinese_tts_pref_v1' : 'words_tts_pref_v1';
  const sequenceKey = 'textbook_tts_sequence_pref_v1'; // 教材、场景单词和成语共用跟读间隔与次数。
  const readPreferences = (key) => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved;
    } catch (e) { /* 使用默认设置 */ }
    return {};
  };
  const playback = readPreferences(playbackKey);
  const sequencePreferences = readPreferences(sequenceKey);
  const bindSlider = (control, name, fallback, label, preferences = playback, key = playbackKey) => {
    if (!control) return;
    const saved = preferences[name];
    control.value = Number.isFinite(saved) && saved >= Number(control.min) && saved <= Number(control.max)
      && (Number(control.step) !== 1 || Number.isInteger(saved)) ? saved : fallback;
    const update = () => {
      const value = Number(control.value);
      const text = label(value);
      const output = document.getElementById(control.id + '-value');
      if (output) output.textContent = text;
      control.setAttribute('aria-valuetext', text);
      return value;
    };
    update();
    control.addEventListener('input', () => {
      preferences[name] = update();
      try { localStorage.setItem(key, JSON.stringify(preferences)); } catch (e) { /* 仍可在本页使用 */ }
    });
  };
  bindSlider(rateControl, 'rate', 0.8, (value) => value.toFixed(2) + '×');
  bindSlider(volumeControl, 'volume', 1, (value) => Math.round(value * 100) + '%');
  bindSlider(intervalControl, 'interval', 3, (value) => value + ' 秒', sequencePreferences, sequenceKey);
  bindSlider(repeatControl, 'repeat', 1, (value) => value + ' 次', sequencePreferences, sequenceKey);
  const readingOptions = (options = {}) => ({
    ...options,
    ...(rateControl ? { rate: Number(rateControl.value) } : {}),
    ...(volumeControl ? { volume: Number(volumeControl.value) } : {}),
  });
  const speak = (text, options) => kit.speak(text, readingOptions(options));

  /* 单点朗读：全页委托一次绑定 */
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-say]');
    if (!target) return;
    event.preventDefault();
    stopSequence();
    const rate = parseFloat(target.dataset.rate);
    speak(target.dataset.say, { rate: Number.isFinite(rate) ? rate : undefined });
  });

  /* 学习侧栏支持原位暂停／继续；其他页面仍保留再次点击停止的交互。 */
  let activeSequence = null;

  function clearPlaying() {
    document.querySelectorAll('.tts-playing').forEach((el) => {
      el.classList.remove('tts-playing');
      el.classList.remove('tts-paused');
      delete el.dataset.ttsFocusLabel;
      delete el.dataset.ttsPhase;
      delete el.dataset.ttsContentKey;
      el.removeAttribute('aria-current');
    });
  }

  function setPlayerState(state, message) {
    if (sequencePlayer) sequencePlayer.dataset.state = state;
    if (sequenceStatus) sequenceStatus.textContent = message;
    if (readingContent) readingContent.classList.toggle('tts-focus-mode', ['playing', 'following', 'paused'].includes(state));
  }

  function renderSequence(sequence) {
    const { index, iteration, items, repeat, phase, paused } = sequence;
    const position = `第 ${index + 1}／${items.length} 项，第 ${iteration + 1}／${repeat} 遍`;
    const message = paused
      ? `已暂停 · ${position}。${phase === 'gap' ? '继续后接着计时。' : '继续后接着刚才的位置读。'}`
      : phase === 'gap'
        ? `轮到你跟读啦！${position}，留出 ${Math.ceil(sequence.remaining / 1000)} 秒。`
        : `正在朗读${position}。`;
    setPlayerState(paused ? 'paused' : phase === 'gap' ? 'following' : 'playing', message);
    items[index].el.classList.toggle('tts-paused', paused);
    if (sequence.pausable) {
      const item = items[index].el;
      item.dataset.ttsPhase = paused ? 'paused' : phase === 'gap' ? 'following' : 'playing';
      item.dataset.ttsContentKey = sequence.textKey;
      item.dataset.ttsFocusLabel = paused ? '⏸ 在这里暂停' : phase === 'gap' ? '🎤 轮到你读' : sequence.focusLabel;
      item.setAttribute('aria-current', 'true');
      sequence.button.textContent = paused ? '▶ 继续连读' : '⏸ 暂停连读';
      if (sequenceCurrent) {
        sequenceCurrent.hidden = false;
        sequenceCurrent.textContent = items[index].text;
        if (readingContent?.id === 'idiom-cards') sequenceCurrent.classList.toggle('textbook-player-current-word', sequence.textKey === 'saySeq');
      }
      if (sequenceProgress) {
        sequenceProgress.hidden = false;
        sequenceProgress.max = items.length * repeat;
        sequenceProgress.value = index * repeat + iteration + (phase === 'gap' ? 1 : 0);
      }
    }
  }

  function stopSequence(message = '连读已结束，点击开始可重新练习。', state = 'idle') {
    // 先使旧回调失效；浏览器 cancel 可能同步或异步触发 end/error。
    const previous = activeSequence;
    activeSequence = null;
    if (previous) clearTimeout(previous.timer);
    if (previous && stopControl) stopControl.disabled = true;
    if (previous) setPlayerState(state, message);
    clearPlaying();
    document.querySelectorAll('[data-tts-sequence].tts-active').forEach((button) => {
      button.classList.remove('tts-active');
      button.textContent = button.dataset.ttsLabel;
    });
    try {
      window.speechSynthesis.cancel();
      // cancel 不一定清除浏览器的暂停标记，避免新的点读或重播仍被挂起。
      if (previous?.paused || window.speechSynthesis.paused) window.speechSynthesis.resume();
    } catch (e) { /* 引擎不可用则忽略 */ }
  }

  function resetSequence(message = '准备好了，点击开始连读。') {
    stopSequence();
    if (restartControl) restartControl.disabled = true;
    if (stopControl) stopControl.disabled = true;
    if (sequenceCurrent) { sequenceCurrent.hidden = true; sequenceCurrent.textContent = ''; }
    if (sequenceProgress) { sequenceProgress.hidden = true; sequenceProgress.value = 0; sequenceProgress.max = 1; }
    const supported = 'speechSynthesis' in window;
    setPlayerState(supported ? 'idle' : 'error', supported ? message : '当前浏览器不支持语音朗读。');
    document.dispatchEvent?.(new CustomEvent('tts:reset'));
  }

  function advanceSequence(sequence) {
    if (activeSequence !== sequence || sequence.paused) return;
    sequence.iteration += 1;
    if (sequence.iteration >= sequence.repeat) { sequence.index += 1; sequence.iteration = 0; }
    stepSequence(sequence);
  }

  function waitForFollowAlong(sequence) {
    if (activeSequence !== sequence || sequence.paused) return;
    if (sequence.remaining <= 0) { advanceSequence(sequence); return; }
    sequence.deadline = performance.now() + sequence.remaining;
    const token = ++sequence.timerToken;
    sequence.timer = setTimeout(() => {
      if (activeSequence !== sequence || sequence.paused || sequence.timerToken !== token) return;
      sequence.timer = null;
      advanceSequence(sequence);
    }, sequence.remaining);
  }

  function stepSequence(sequence) {
    if (activeSequence !== sequence || sequence.paused) return;
    const { items, index } = sequence;
    if (index >= items.length) { stopSequence('本次连读完成啦！可以从头再练一遍。', 'complete'); return; }
    sequence.phase = 'speaking';
    clearPlaying();
    const item = items[index];
    item.el.classList.add('tts-playing');
    renderSequence(sequence);
    if (sequence.iteration === 0) {
      const focusTarget = sequence.pausable ? item.el.querySelector?.(sequence.textKey === 'sayExample' ? '.idiom-practice' : '.wtop, .idiom-card-heading') || item.el : item.el;
      focusTarget.scrollIntoView({ block: sequence.pausable ? 'center' : 'nearest', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    let settled = false;
    speak(item.text, {
      rate: sequence.rate,
      onend: () => {
        if (activeSequence !== sequence || settled) return;
        settled = true;
        sequence.phase = 'gap';
        sequence.remaining = sequence.interval * 1000;
        renderSequence(sequence);
        waitForFollowAlong(sequence);
      },
      onerror: () => {
        if (activeSequence === sequence && !settled) {
          settled = true;
          stopSequence('朗读遇到问题，请从头再试一次。', 'error');
        }
      },
    });
  }

  function playSequence(button) {
    const container = document.querySelector(button.dataset.ttsSequence);
    if (!container) return;
    const selectedScope = scopeControl?.selectedOptions?.[0];
    const textKey = selectedScope?.dataset.ttsTextKey || 'saySeq';
    const items = Array.from(container.querySelectorAll('[data-say-seq]'))
      .map((el) => ({ el, text: el.dataset[textKey] }))
      .filter((item) => item.text?.trim());
    if (!items.length) return;
    stopSequence();
    const sequence = {
      button, items, index: 0, iteration: 0, phase: 'speaking', paused: false,
      timer: null, timerToken: 0, remaining: 0, deadline: 0,
      rate: parseFloat(button.dataset.ttsRate) || 0.78,
      interval: intervalControl ? Number(intervalControl.value) : 0,
      repeat: repeatControl ? Number(repeatControl.value) : 1,
      pausable: button.dataset.ttsPausable === 'true',
      textKey,
      focusLabel: selectedScope?.dataset.ttsFocusLabel || (readingContent?.id === 'idiom-cards' ? '🔊 听这个成语' : readingContent?.id === 'english-dialogues' ? '🔊 听这一句' : '🔊 听这个单词'),
    };
    activeSequence = sequence;
    button.dataset.ttsLabel = button.textContent;
    button.classList.add('tts-active');
    button.textContent = sequence.pausable ? '⏸ 暂停连读' : '⏹ 停止连读';
    if (sequence.pausable && restartControl) restartControl.disabled = false;
    if (stopControl) stopControl.disabled = false;
    stepSequence(sequence);
  }

  function pauseSequence(sequence) {
    sequence.paused = true;
    if (sequence.phase === 'gap') {
      sequence.remaining = Math.max(0, sequence.deadline - performance.now());
      clearTimeout(sequence.timer);
      sequence.timer = null;
      sequence.timerToken += 1;
    } else {
      try { window.speechSynthesis.pause(); } catch (e) {
        stopSequence('当前浏览器暂时无法暂停，请从头开始。', 'error');
        return;
      }
    }
    renderSequence(sequence);
  }

  function resumeSequence(sequence) {
    const wasGap = sequence.phase === 'gap';
    sequence.paused = false;
    renderSequence(sequence);
    // 浏览器的 paused 标记可能晚于 pause 请求更新；继续操作必须无条件发给引擎。
    try { window.speechSynthesis.resume(); } catch (e) {
      stopSequence('朗读未能继续，请从头再试一次。', 'error');
      return;
    }
    if (wasGap) waitForFollowAlong(sequence);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tts-sequence]');
    if (!button) return;
    event.preventDefault();
    if (activeSequence?.button === button && activeSequence.pausable) {
      if (activeSequence.paused) resumeSequence(activeSequence);
      else pauseSequence(activeSequence);
    } else if (activeSequence?.button === button) stopSequence();
    else playSequence(button);
  });
  if (restartControl && unitPlay) restartControl.addEventListener('click', () => {
    if (!restartControl.disabled) playSequence(unitPlay);
  });
  if (stopControl) stopControl.addEventListener('click', () => {
    if (!stopControl.disabled) resetSequence('已停止连读，可以自由浏览。再次开始会从头朗读。');
  });
  if (scopeControl && unitPlay) scopeControl.addEventListener('change', () => {
    resetSequence('已切换朗读范围，点击开始连读。');
    unitPlay.dataset.ttsSequence = scopeControl.value;
  });
  window.addEventListener('pagehide', () => stopSequence());

  /* 发音人偏好（profile、教材与场景页） */
  const select = document.getElementById('tts-voice');
  if (select) {
    const populate = () => {
      const voices = kit.englishVoiceList();
      select.innerHTML = '';
      if (!voices.length) {
        const none = document.createElement('option');
        none.value = '';
        none.textContent = '使用浏览器默认英语发音';
        select.append(none);
        select.disabled = true;
        return;
      }
      select.disabled = false;
      for (const voice of voices) {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = voice.name + ' · ' + voice.lang + (voice.localService ? '' : '（在线）');
        select.append(option);
      }
      select.value = kit.pref || kit.chosenEn || voices[0].name;
      if (!select.value) select.selectedIndex = 0;
    };
    populate();
    if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis.addEventListener) {
      window.speechSynthesis.addEventListener('voiceschanged', populate);
    }
    select.addEventListener('change', () => {
      stopSequence();
      kit.setVoicePref(select.value);
      speak('Hello! Nice to meet you.', { rate: 0.9 });
    });
  }

  if (!('speechSynthesis' in window)) {
    const status = document.getElementById('tts-status');
    if (status) status.textContent = '当前浏览器不支持语音朗读，可换用支持朗读的浏览器。';
    [rateControl, volumeControl, intervalControl, repeatControl, unitPlay, restartControl, stopControl, scopeControl, document.getElementById('tts-preview')].forEach((control) => { if (control) control.disabled = true; });
    if (sequencePlayer) setPlayerState('error', '当前浏览器不支持语音朗读。');
  }
  window.TTS = { stopSequence, resetSequence, speak };
})();
