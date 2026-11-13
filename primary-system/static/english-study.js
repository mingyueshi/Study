/* 教材与场景学习页共用侧栏位置和折叠，操作时保留正在进行的朗读。 */
'use strict';

(() => {
  const layout = document.querySelector('[data-reading-layout]') || document.getElementById('english-textbook-layout');
  const toggle = document.getElementById('english-sidebar-toggle');
  const collapse = document.getElementById('reading-sidebar-collapse');
  const sidebar = layout?.querySelector('.english-sidebar');
  if (!layout || !toggle || !sidebar) return;
  const key = 'english_textbook_sidebar_side_v1';
  const kind = document.getElementById('words-cards') ? 'words' : document.getElementById('idiom-cards') ? 'idioms' : 'textbook';
  const collapseKey = 'primary_reading_sidebar_collapsed_v1:' + kind;
  let collapsed = false, compactOpen = false;
  try { collapsed = localStorage.getItem(collapseKey) === 'true'; } catch (e) { /* 默认展开 */ }
  function applyCollapse() {
    if (!collapse) return;
    collapse.hidden = false;
    const compact = window.innerWidth < 760;
    const closed = compact ? !compactOpen : collapsed;
    layout.dataset.sidebarCollapsed = String(closed);
    toggle.hidden = compact || closed;
    const label = closed ? '展开侧栏' : '收起侧栏';
    if (collapse.textContent !== label) collapse.textContent = label;
    collapse.setAttribute('aria-expanded', String(!closed));
    if (closed && sidebar.contains(document.activeElement) && document.activeElement !== collapse) collapse.focus({preventScroll: true});
  }
  const applySide = (side) => {
    layout.dataset.sidebarSide = side;
    toggle.textContent = side === 'right' ? '← 移到左侧' : '移到右侧 →';
    toggle.setAttribute('aria-label', side === 'right' ? '将侧栏移到左侧' : '将侧栏移到右侧');
  };
  let side = 'right';
  try { if (localStorage.getItem(key) === 'left') side = 'left'; } catch (e) { /* 使用默认右侧 */ }
  applySide(side);
  applyCollapse();
  collapse?.addEventListener('click', () => {
    if (window.innerWidth < 760) compactOpen = !compactOpen;
    else {
      collapsed = !collapsed;
      try { localStorage.setItem(collapseKey, String(collapsed)); } catch (e) { /* 本页仍可折叠 */ }
    }
    applyCollapse(); scheduleHeight();
  });
  toggle.addEventListener('click', () => {
    const next = layout.dataset.sidebarSide === 'right' ? 'left' : 'right';
    applySide(next);
    try { localStorage.setItem(key, next); } catch (e) { /* 仍可在本页切换 */ }
    scheduleHeight();
  });

  let frame = 0;
  function updateHeight() {
    applyCollapse();
    const top = window.innerWidth < 760 ? 24 : Math.max(24, sidebar.getBoundingClientRect().top);
    const height = Math.max(0, (window.visualViewport?.height || window.innerHeight) - top - 24);
    sidebar.style.setProperty('--reading-sidebar-height', height + 'px');
  }
  function scheduleHeight() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; updateHeight(); });
  }
  window.addEventListener('resize', scheduleHeight, { passive: true });
  function revealHash() {
    let target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
    if (!target || !sidebar.contains(target) || target === collapse) return;
    collapsed = false; compactOpen = true;
    applyCollapse(); scheduleHeight();
    requestAnimationFrame(() => target.scrollIntoView({block: 'nearest'}));
  }
  window.addEventListener('hashchange', revealHash);
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) applySide(event.newValue === 'left' ? 'left' : 'right');
    if (event.key === collapseKey || event.key === null) collapsed = event.newValue === 'true';
    scheduleHeight();
  });
  window.visualViewport?.addEventListener('resize', scheduleHeight, { passive: true });
  window.addEventListener('scroll', () => {
    // 窄屏侧栏随页面滚动，保持其高度，避免正文跟着滚动位置反复移动。
    if (window.innerWidth >= 760) scheduleHeight();
  }, { passive: true });
  revealHash(); updateHeight();
})();
