/* TechLex 分类目录交互；随个人学习系统一同使用。 */
(() => {
  'use strict';
  const directory = document.querySelector('.category-nav');
  const chips = document.getElementById('chips');
  if (!directory || !chips) return;

  // 与 tech.css 一致：桌面竖屏保留目录，只有窄窗口折叠。
  const compact = window.matchMedia('(max-width: 720px)');
  const summary = directory.querySelector('summary');
  const current = directory.querySelector('.nav-current');
  const count = document.querySelector('.nav-count');
  const header = document.querySelector('header');
  // 放大文字或换行后，同步目录和搜索栏的固定位置。
  if (header && window.ResizeObserver) {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', Math.ceil(header.getBoundingClientRect().height) + 'px');
    }).observe(header);
  }
  // 响应式样式会先隐藏旧焦点，记录目录是否正在被键盘操作。
  let directoryFocused = directory.contains(document.activeElement);
  document.addEventListener('focusin', event => {
    if (event.target !== document.body) directoryFocused = directory.contains(event.target);
  });
  document.addEventListener('pointerdown', event => {
    if (!directory.contains(event.target)) directoryFocused = false;
  });
  const syncMode = () => {
    directory.open = !compact.matches;
    if (directoryFocused) {
      const target = compact.matches ? summary : chips.querySelector('.chip.on') || chips.querySelector('.chip');
      if (target) target.focus({ preventScroll: true });
    }
  };
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
      const scroller = directory.closest('.sl-scroll') || directory;
      const top = active.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      if (top < 0) scroller.scrollTop += top;
      else if (top + active.offsetHeight > scroller.clientHeight) {
        scroller.scrollTop += top + active.offsetHeight - scroller.clientHeight;
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
