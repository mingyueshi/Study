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
  // Reuse the original key so existing scene-word settings carry over to textbooks.
  const playbackKey = 'words_tts_pref_v1';
  let playback = {};
  try { playback = JSON.parse(localStorage.getItem(playbackKey) || '{}') || {}; } catch (e) { /* 使用默认设置 */ }
  const bindSlider = (control, name, fallback, label) => {
    if (!control) return;
    const saved = playback[name];
    control.value = Number.isFinite(saved) && saved >= Number(control.min) && saved <= Number(control.max) ? saved : fallback;
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
      // Textbook and scene pages share these playback options and the voice preference.
      playback = { rate: rateControl ? Number(rateControl.value) : 0.8, volume: volumeControl ? Number(volumeControl.value) : 1 };
      update();
      try { localStorage.setItem(playbackKey, JSON.stringify(playback)); } catch (e) { /* 仍可在本页使用 */ }
    });
  };
  bindSlider(rateControl, 'rate', 0.8, (value) => value.toFixed(2) + '×');
  bindSlider(volumeControl, 'volume', 1, (value) => Math.round(value * 100) + '%');
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

  /* 连读：步进高亮 + 滚动跟随；再次点击停止 */
  let activeSequence = null;

  function clearPlaying() {
    document.querySelectorAll('.tts-playing').forEach((el) => el.classList.remove('tts-playing'));
  }

  function stopSequence() {
    // 先使旧回调失效；浏览器 cancel 可能同步或异步触发 end/error。
    activeSequence = null;
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
    const sequence = { button };
    activeSequence = sequence;
    button.dataset.ttsLabel = button.textContent;
    button.classList.add('tts-active');
    button.textContent = '⏹ 停止连读';
    let index = 0;
    const step = () => {
      if (activeSequence !== sequence) return;
      if (index >= items.length) { stopSequence(); return; }
      clearPlaying();
      const item = items[index];
      item.el.classList.add('tts-playing');
      item.el.scrollIntoView({ block: 'nearest', behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      index += 1;
      speak(item.text, {
        rate,
        onend: step,
        onerror: () => { if (activeSequence === sequence) stopSequence(); },
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
    [rateControl, volumeControl, document.getElementById('tts-preview')].forEach((control) => { if (control) control.disabled = true; });
  }
  window.TTS = { stopSequence, speak };
})();
