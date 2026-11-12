/* 本系统独立使用：目录与辅助栏统一靠右，可切换并在当前浏览器记忆。
   注册真实侧栏，不把双栏正文、对照图或编辑预览当成导航侧栏。 */
(() => {
  'use strict';
  const storageKey = 'english_textbook_sidebar_side_v1';
  const registrations = [
    ['.library-layout:not(.english-library-layout)', '.unit-nav', 'clamp(250px, 20vw, 330px)', 760, 'h2, .grammar-progress-row'],
    ['.study-page .study-shell', '.sidebar', 'clamp(240px, 20vw, 280px)', 1000, '.sidebar-label, .stats-pill'],
    ['.reader-layout', '.progress-panel', 'clamp(300px, 23vw, 400px)', 900],
    ['.dictionary-reader-layout', '.dictionary-aside', 'clamp(300px, 23vw, 400px)', 900],
    ['.phrase-workspace', '.phrase-side', 'clamp(320px, 26vw, 380px)', 900, '.phrase-side-tools'],
    ['.plural-workspace', '.plural-side', 'clamp(320px, 26vw, 380px)', 900, '.plural-side-tools'],
    ['.mform-workspace', '.mform-side', 'clamp(300px, 26vw, 380px)', 900, '.mform-side-tools'],
    ['.map-shell', '.map-side', 'clamp(300px, 26vw, 360px)', 900, '.map-search, .map-provinces'],
    ['.theme-workspace', '.theme-side, .theme-nav', 'clamp(280px, 23vw, 320px)', 900],
    ['.seasons-workspace', '.seasons-side', 'clamp(300px, 25vw, 340px)', 900, '.seasons-side-block:not(nav)'],
    ['.hall-shell', '.hall-sidebar', '290px', 900, '.hall-books'],
    ['.eq-layout', '.eq-side', '280px', 900],
    ['.pairs-layout', '.pairs-side', 'clamp(300px, 30vw, 460px)', 900],
    ['.idiom-entry-layout', '.idiom-scene-nav', 'clamp(260px, 23vw, 340px)', 760],
    ['.chain-layout', '.chain-aside', '320px', 900],
    ['.qb-practice-layout', '.qb-side', '280px', 900],
    ['.clinic-layout', '.clinic-guide', 'clamp(260px, 24vw, 360px)', 900],
    ['.geometry-workspace', '.geometry-notebook', 'clamp(280px, 24vw, 400px)', 900],
    ['.body-workspace', '.body-side', 'clamp(300px, 30vw, 460px)', 900],
    ['.origins-layout', '.origins-side', '250px', 760],
    ['.gm-topic', '.gm-sidebar', 'clamp(240px, 24vw, 290px)', 900, '.gm-sysnav, .gm-toolbar, .gm-search, .gm-media-filters'],
    ['.timeline-topic', '.timeline-sidebar', 'clamp(250px, 23vw, 300px)', 900, '.timeline-heading, .tl-sysnav'],
    ['.history-topic .lesson-layout, .geography-topic .lesson-layout', '.lesson-resources', 'clamp(280px, 24vw, 340px)', 1000],
    ['.poly-shell', '.poly-browse', 'clamp(365px, 32vw, 480px)', 1000, '.poly-card-heading, .poly-search-row, .poly-buckets, .poly-alphabet'],
    ['.tree-shell', '.tree-word-panel', 'clamp(320px, 32vw, 520px)', 1000],
    ['.gm-wildlife-workspace', '#gm-animal-card', 'clamp(284px, 26vw, 424px)', 1000],
    ['.fh-layout', '.fh-choices, .fh-notebook', 'clamp(300px, 26vw, 380px)', 900],

  ];
  let side = 'right', nextId = 0, frame = 0;
  const instances = new Map();
  try { if (localStorage.getItem(storageKey) === 'left') side = 'left'; } catch (e) { /* 使用默认右侧 */ }

  function render(instance) {
    const {layout, toggle, breakpoint} = instance;
    const compact = window.innerWidth < breakpoint;
    layout.dataset.slMode = compact ? 'compact' : 'wide';
    layout.dataset.slSide = side;
    const label = compact ? (layout.dataset.slOpen === 'true' ? '收起侧栏 ↑' : '展开侧栏 ↓')
      : side === 'right' ? '← 移到左侧' : '移到右侧 →';
    if (toggle.textContent !== label) toggle.textContent = label;
    toggle.setAttribute('aria-label', compact ? toggle.textContent : side === 'right' ? '将侧栏移到左侧' : '将侧栏移到右侧');
    if (compact) toggle.setAttribute('aria-expanded', String(layout.dataset.slOpen === 'true'));
    else toggle.removeAttribute('aria-expanded');
    if (compact && layout.dataset.slOpen !== 'true' && instance.panels.some(panel => panel.contains(document.activeElement))) toggle.focus({preventScroll: true});
  }

  function preparePanel(instance, panel) {
    if (panel.querySelector(':scope > .sl-scroll')) return;
    // 有些词卡会替换 innerHTML，外层按钮不随词卡消失，内部只接回现有节点。
    const nodes = Array.from(panel.childNodes);
    const fixed = document.createElement('div');
    fixed.className = 'sl-fixed';
    const scroll = document.createElement('div');
    scroll.className = 'sl-scroll';
    for (const node of nodes) {
      if (node.nodeType === 1 && instance.fixed && node.matches(instance.fixed)) fixed.append(node);
      else scroll.append(node);
    }
    if (fixed.childElementCount) panel.append(fixed);
    panel.append(scroll);
  }

  function refresh() {
    frame = 0;
    for (const [layout, instance] of instances) {
      if (!layout.isConnected) { sizeObserver?.unobserve(layout); instances.delete(layout); continue; }
      render(instance);
      instance.panels.forEach(panel => preparePanel(instance, panel));
      const {wrapper} = instance;
      if (instance.header) {
        instance.top = Math.max(24, Math.ceil(instance.header.getBoundingClientRect().height) + 16);
        wrapper.style.setProperty('--sl-top', instance.top + 'px');
      }
      const top = layout.dataset.slMode === 'compact' ? instance.top : Math.max(instance.top, wrapper.getBoundingClientRect().top);
      const available = Math.max(120, Math.floor((window.visualViewport?.height || window.innerHeight) - top - 24));
      wrapper.style.setProperty('--sl-height', available + 'px');
      if (layout.dataset.slMode === 'wide' || layout.dataset.slOpen === 'true') {
        const natural = instance.panels.reduce((total, panel) => {
          const scroll = panel.querySelector(':scope > .sl-scroll');
          const fixed = panel.querySelector(':scope > .sl-fixed');
          const first = scroll.firstElementChild, last = scroll.lastElementChild;
          const contentHeight = first && last ? last.getBoundingClientRect().bottom - first.getBoundingClientRect().top : 0;
          const style = getComputedStyle(panel);
          const edges = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((sum, key) => sum + (parseFloat(style[key]) || 0), 0);
          return total + edges + Math.max(0, contentHeight) + 10 + (fixed ? Math.min(fixed.scrollHeight, available * .55) + 12 : 0);
        }, instance.toggle.parentElement.getBoundingClientRect().height + 12);
        wrapper.style.setProperty('--sl-size', Math.min(available, Math.ceil(natural)) + 'px');
      }
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(refresh);
  }
  const sizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;

  function attach(layout, sidebarSelector, width, breakpoint = 900, fixed = '') {
    const previous = instances.get(layout);
    if (previous?.wrapper.parentElement === layout) return;
    if (previous) { sizeObserver?.unobserve(layout); instances.delete(layout); }
    const panels = Array.from(layout.children).filter(child => child.matches(sidebarSelector));
    if (!panels.length) return;
    const contents = Array.from(layout.children).filter(child => !panels.includes(child) && !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(child.tagName));
    if (!contents.length) return;
    layout.dataset.slReady = 'true';
    layout.dataset.slOpen = 'false';
    layout.style.setProperty('--sl-width', width);
    const wrapper = document.createElement('div');
    wrapper.className = 'sl-sidebar';
    wrapper.id = 'layout-sidebar-' + (++nextId);
    const header = document.createElement('div');
    header.className = 'sl-header';
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'sl-toggle';
    toggle.setAttribute('aria-controls', wrapper.id);
    header.append(toggle); wrapper.append(header);
    // 多块辅助栏集中到同侧，正文继续按原来的顺序排列。
    const host = panels.length > 1 ? document.createElement('div') : panels[0];
    if (panels.length > 1) { host.className = 'sl-panel'; panels.forEach(panel => { panel.classList.add('sl-section'); host.append(panel); }); }
    else host.classList.add('sl-panel');
    wrapper.append(host); layout.prepend(wrapper);
    contents.forEach((content, index) => { content.classList.add('sl-main'); content.style.setProperty('--sl-row', String(index + 1)); });
    wrapper.style.setProperty('--sl-rows', String(contents.length));
    const top = 24;
    wrapper.style.setProperty('--sl-top', top + 'px');
    const instance = {layout, wrapper, toggle, panels: [host], breakpoint: Number(breakpoint), fixed, top, header: top > 24 ? document.querySelector('header') : null};
    if (!host.id) host.id = wrapper.id + '-panel';
    toggle.setAttribute('aria-controls', host.id);
    instances.set(layout, instance);
    preparePanel(instance, host);
    toggle.addEventListener('click', () => {
      if (window.innerWidth < instance.breakpoint) {
        layout.dataset.slOpen = String(layout.dataset.slOpen !== 'true');
        if (layout.dataset.slOpen === 'true') host.querySelectorAll('.category-nav').forEach(directory => { directory.open = true; });
      }
      else {
        side = side === 'right' ? 'left' : 'right';
        try { localStorage.setItem(storageKey, side); } catch (e) { /* 本页仍然可以切换 */ }
      }
      instances.forEach(render); schedule();
    });
    render(instance); sizeObserver?.observe(layout);
  }

  function scan() {
    for (const [selector, sidebar, width, breakpoint, fixed] of registrations) {
      document.querySelectorAll(selector).forEach(layout => attach(layout, sidebar, width, breakpoint, fixed));
    }
    document.querySelectorAll('[data-sidebar-layout]').forEach(layout => attach(layout,
      layout.dataset.sidebarLayout || 'aside', layout.dataset.sidebarWidth || '300px', layout.dataset.sidebarBreakpoint || 900, layout.dataset.sidebarFixed || ''));
    schedule();
  }
  scan();
  // 页面切换、搜索或重绘知识卡时，新的侧栏自动接入，旧实例随 DOM 移除。
  const changes = new MutationObserver(scan);
  changes.observe(document.body, {childList: true, subtree: true});
  document.addEventListener('load', schedule, true);
  window.addEventListener('resize', schedule, {passive: true});
  window.visualViewport?.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    side = event.newValue === 'left' ? 'left' : 'right';
    schedule();
  });
})();
