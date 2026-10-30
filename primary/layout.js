/* 窄屏使用原生可折叠目录，桌面保持侧栏展开。无需改变学习存档。 */
(() => {
  'use strict';
  const directory = document.querySelector('.category-nav');
  const chips = document.getElementById('chips');
  if (!directory || !chips) return;

  const compact = window.matchMedia('(max-width: 999px)');
  const summary = directory.querySelector('summary');
  const current = directory.querySelector('.nav-current');
  const count = document.querySelector('.nav-count');
  const syncMode = () => { directory.open = !compact.matches; };
  const syncSelection = () => {
    const buttons = chips.querySelectorAll('.chip');
    buttons.forEach(button => {
      if (button.classList.contains('on')) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    const selected = chips.querySelector('.chip.on .chip-name');
    current.textContent = selected ? selected.textContent :
      (document.querySelector('.draft-layout') ? '我的作文本' : '全部分类');
    if (count) count.textContent = buttons.length;
    // 只滚动侧栏自身，恢复上次单元时不把正文一起推走。
    const active = chips.querySelector('.chip.on');
    if (active && !compact.matches) {
      const top = active.getBoundingClientRect().top - directory.getBoundingClientRect().top;
      if (top < 0) directory.scrollTop += top;
      else if (top + active.offsetHeight > directory.clientHeight) {
        directory.scrollTop += top + active.offsetHeight - directory.clientHeight;
      }
    }
  };

  syncMode();
  syncSelection();
  compact.addEventListener('change', syncMode);
  /* 软刷新时浏览器可能恢复折叠前的目录状态，重新按屏宽归位 */
  window.addEventListener('pageshow', syncMode);
  new MutationObserver(syncSelection).observe(chips, { childList: true });
  document.addEventListener('click', event => {
    // 学习脚本先重绘了 chips，原按钮此时已从父节点移除。
    if (compact.matches && event.target.closest('.chip[data-act="unit"]')) {
      directory.open = false;
      summary.focus({ preventScroll: true });
    }
  });
})();
