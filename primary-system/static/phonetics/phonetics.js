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

  /* 音标分组以标签页切换：点侧栏只显示对应组；无 JS 时回退为锚点滚动全列。 */
  const nav = document.querySelector('.library-layout .unit-nav');
  const groups = Array.from(document.querySelectorAll('.ph-group'));
  if (nav && groups.length) {
    const activate = (code) => {
      groups.forEach((group) => { group.hidden = group.id !== `group-${code}`; });
      nav.querySelectorAll('a').forEach((link) => {
        if (link.getAttribute('href') === `#group-${code}`) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#group-"]');
      if (!link) return;
      event.preventDefault();
      const code = link.getAttribute('href').replace('#group-', '');
      activate(code);
      history.replaceState(null, '', `#group-${code}`);
    });
    const target = document.getElementById(location.hash.slice(1));
    const initialGroup = target?.closest('.ph-group') || groups[0];
    activate(initialGroup.id.replace('group-', ''));
    if (target && target !== initialGroup && initialGroup.contains(target)) target.scrollIntoView();
  }
})();
