/* 音标专题：点击喇叭/大音标播放音素原声（预生成 m4a）。
   文件缺失或播放失败时回退到浏览器发音人读关键例词。 */
'use strict';

(() => {
  let current = null;

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-audio]');
    if (!button) return;
    event.preventDefault();
    try { window.speechSynthesis?.cancel(); } catch (e) { /* 引擎不可用则忽略 */ }
    if (current) { current.pause(); current = null; }
    const audio = new Audio(button.dataset.audio);
    current = audio;
    audio.play().catch(() => {
      // 音频缺失/不受支持时，退回浏览器发音人读关键例词。
      if (window.SpeechKit && button.dataset.fallback) SpeechKit.speak(button.dataset.fallback);
    });
  });
})();
