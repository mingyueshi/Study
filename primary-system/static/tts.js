/* 点读接线：把 legacy 的 SpeechKit 引擎接到服务端渲染页面上。
   - [data-say]：点击即朗读该属性文本（可选 data-rate 语速）
   - [data-tts-sequence]：连读按钮，按选择器取 [data-say-seq] 序列逐个朗读并高亮
   - #tts-voice：英语发音人偏好（记忆在 localStorage，与 legacy 共用同一键） */
'use strict';

(() => {
  const kit = window.SpeechKit;
  if (!kit) return;

  /* 单点朗读：全页委托一次绑定 */
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-say]');
    if (!target) return;
    event.preventDefault();
    const rate = parseFloat(target.dataset.rate);
    kit.speak(target.dataset.say, { rate: Number.isFinite(rate) ? rate : undefined });
  });

  /* 连读：步进高亮 + 滚动跟随；再次点击停止 */
  let timer = null;

  function clearPlaying() {
    document.querySelectorAll('.tts-playing').forEach((el) => el.classList.remove('tts-playing'));
  }

  function stopSequence() {
    if (timer) { clearInterval(timer); timer = null; }
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
    const interval = parseInt(button.dataset.ttsInterval, 10) || 2200;
    const rate = parseFloat(button.dataset.ttsRate) || 0.78;
    button.dataset.ttsLabel = button.textContent;
    button.classList.add('tts-active');
    button.textContent = '⏹ 停止连读';
    let index = 0;
    const step = () => {
      if (index >= items.length) { stopSequence(); return; }
      clearPlaying();
      const item = items[index];
      item.el.classList.add('tts-playing');
      item.el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      kit.speak(item.text, { rate });
      index += 1;
    };
    step();
    timer = setInterval(step, interval);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tts-sequence]');
    if (!button) return;
    event.preventDefault();
    if (timer) stopSequence();
    else playSequence(button);
  });

  /* 发音人偏好（profile 页） */
  const select = document.getElementById('tts-voice');
  if (select) {
    const populate = () => {
      const voices = kit.englishVoiceList();
      if (!voices.length) {
        const none = document.createElement('option');
        none.textContent = '本机暂无英语发音人';
        select.append(none);
        select.disabled = true;
        return;
      }
      select.disabled = false;
      select.innerHTML = '';
      for (const voice of voices) {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = voice.name + (voice.localService ? '' : '（在线）');
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
      kit.setVoicePref(select.value);
      kit.speak('Hello! Nice to meet you.', { rate: 0.9 });
    });
  }

  window.TTS = { stopSequence };
})();
