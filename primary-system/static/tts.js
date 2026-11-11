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
  // Reuse the original key so existing scene-word settings carry over to textbooks.
  const playbackKey = 'words_tts_pref_v1';
  const sequenceKey = 'textbook_tts_sequence_pref_v1';
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

  /* 连读：发音结束后留出跟读时间，同一项读够次数再前进；再次点击停止。 */
  let activeSequence = null;

  function clearPlaying() {
    document.querySelectorAll('.tts-playing').forEach((el) => el.classList.remove('tts-playing'));
  }

  function stopSequence(message = '连读已停止，可以再选一段练习。') {
    // 先使旧回调失效；浏览器 cancel 可能同步或异步触发 end/error。
    const previous = activeSequence;
    activeSequence = null;
    if (previous) clearTimeout(previous.timer);
    if (previous && sequenceStatus) sequenceStatus.textContent = message;
    clearPlaying();
    document.querySelectorAll('[data-tts-sequence].tts-active').forEach((button) => {
      button.classList.remove('tts-active');
      button.textContent = button.dataset.ttsLabel;
    });
    try { window.speechSynthesis.cancel(); } catch (e) { /* 引擎不可用则忽略 */ }
  }

  function playSequence(button) {
    const container = document.querySelector(button.dataset.ttsSequence);
    if (!container) return;
    const items = Array.from(container.querySelectorAll('[data-say-seq]'))
      .map((el) => ({ el, text: el.dataset.saySeq }))
      .filter((item) => item.text.trim());
    if (!items.length) return;
    stopSequence();
    const rate = parseFloat(button.dataset.ttsRate) || 0.78;
    // 仅提供教材连读设置的页面启用间隔和重复，其他页面保持原有节奏。
    const interval = intervalControl ? Number(intervalControl.value) : 0;
    const repeat = repeatControl ? Number(repeatControl.value) : 1;
    const sequence = { button, timer: null };
    activeSequence = sequence;
    button.dataset.ttsLabel = button.textContent;
    button.classList.add('tts-active');
    button.textContent = '⏹ 停止连读';
    let index = 0;
    let iteration = 0;
    const step = () => {
      if (activeSequence !== sequence) return;
      if (index >= items.length) { stopSequence('本次连读完成啦！'); return; }
      clearPlaying();
      const item = items[index];
      item.el.classList.add('tts-playing');
      if (iteration === 0) item.el.scrollIntoView({ block: 'nearest', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      if (sequenceStatus) sequenceStatus.textContent = `正在朗读第 ${index + 1}／${items.length} 项，第 ${iteration + 1}／${repeat} 遍。`;
      let settled = false;
      speak(item.text, {
        rate,
        onend: () => {
          if (activeSequence !== sequence || settled) return;
          settled = true;
          iteration += 1;
          if (iteration >= repeat) { index += 1; iteration = 0; }
          if (interval > 0) {
            if (sequenceStatus) sequenceStatus.textContent = `轮到你跟读啦！留出 ${interval} 秒，试着读一读。`;
            sequence.timer = setTimeout(() => { sequence.timer = null; step(); }, interval * 1000);
          } else step();
        },
        onerror: () => {
          if (activeSequence === sequence && !settled) {
            settled = true;
            stopSequence('朗读遇到问题，请再试一次。');
          }
        },
      });
    };
    step();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tts-sequence]');
    if (!button) return;
    event.preventDefault();
    if (activeSequence?.button === button) stopSequence();
    else playSequence(button);
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
    [rateControl, volumeControl, intervalControl, repeatControl, document.getElementById('tts-preview')].forEach((control) => { if (control) control.disabled = true; });
  }
  window.TTS = { stopSequence, speak };
})();
