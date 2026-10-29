/* 此系统可独立拷走；目录交互保留在本目录内。 */
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
    current.textContent = selected ? selected.textContent : '全部分类';
    if (count) count.textContent = buttons.length;
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
  new MutationObserver(syncSelection).observe(chips, { childList: true });
  document.addEventListener('click', event => {
    // 原按钮可能已被学习脚本的重绘移除，直接匹配按钮本身。
    if (compact.matches && event.target.closest('.chip[data-act="unit"]')) {
      directory.open = false;
      summary.focus({ preventScroll: true });
    }
  });
})();
