/* 教材与场景学习页共用侧栏位置，切换时保留正在进行的朗读。 */
'use strict';

(() => {
  const layout = document.querySelector('[data-reading-layout]') || document.getElementById('english-textbook-layout');
  const toggle = document.getElementById('english-sidebar-toggle');
  const sidebar = layout?.querySelector('.english-sidebar');
  if (!layout || !toggle || !sidebar) return;
  const key = 'english_textbook_sidebar_side_v1';
  const applySide = (side) => {
    layout.dataset.sidebarSide = side;
    toggle.textContent = side === 'right' ? '← 移到左侧' : '移到右侧 →';
    toggle.setAttribute('aria-label', side === 'right' ? '将侧栏移到左侧' : '将侧栏移到右侧');
  };
  let side = 'right';
  try { if (localStorage.getItem(key) === 'left') side = 'left'; } catch (e) { /* 使用默认右侧 */ }
  applySide(side);
  toggle.addEventListener('click', () => {
    const next = layout.dataset.sidebarSide === 'right' ? 'left' : 'right';
    applySide(next);
    try { localStorage.setItem(key, next); } catch (e) { /* 仍可在本页切换 */ }
    scheduleHeight();
  });

  let frame = 0;
  function updateHeight() {
    const top = window.innerWidth < 760 ? 24 : Math.max(24, sidebar.getBoundingClientRect().top);
    const height = Math.max(0, (window.visualViewport?.height || window.innerHeight) - top - 24);
    sidebar.style.setProperty('--reading-sidebar-height', height + 'px');
  }
  function scheduleHeight() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; updateHeight(); });
  }
  window.addEventListener('resize', scheduleHeight, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleHeight, { passive: true });
  window.addEventListener('scroll', () => {
    // 窄屏侧栏随页面滚动，保持其高度，避免正文跟着滚动位置反复移动。
    if (window.innerWidth >= 760) scheduleHeight();
  }, { passive: true });
  updateHeight();
})();
