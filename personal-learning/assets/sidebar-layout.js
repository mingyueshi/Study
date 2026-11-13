/* 本系统独立使用：目录与辅助栏统一靠右，可切换并在当前浏览器记忆。
   注册真实侧栏，不把双栏正文、对照图或编辑预览当成导航侧栏。 */
(() => {
  'use strict';
  const storageKey = 'personal_learning_sidebar_side_v1';
  const registrations = [
    ['.module-card', '.module-overview', 'clamp(300px, 28vw, 420px)', 900],
    ['.study-shell', '.sidebar', 'clamp(248px, 20vw, 290px)', 1000, '.sidebar-progress'],
    ['.dev-shell', '.dev-sidebar', '244px', 1100, '.side-heading, #devProgress'],
    ['.coding-shell', '.coding-sidebar', '244px', 1100, '.coding-main-links, .coding-progress-label, #courseProgress'],
    ['.course-shell', '.course-sidebar', '264px', 1100],
    ['.lesson-layout', '.practice-column', 'clamp(300px, 28vw, 380px)', 1100],
    ['.guide-profile-layout', '.guide-profile-aside', 'clamp(300px, 28vw, 400px)', 1100],
    ['.lab-layout', '.lab-workbench', 'clamp(340px, 38vw, 600px)', 1100],
    ['.prompt-layout', '.prompt-context-column', 'clamp(300px, 30vw, 460px)', 1100],
    ['.coding-project-layout', '.coding-project-checks', 'clamp(300px, 30vw, 440px)', 1100],

  ];
  let side = 'right', nextId = 0, frame = 0;
  const instances = new Map();
  try { if (localStorage.getItem(storageKey) === 'left') side = 'left'; } catch (e) { /* 使用默认右侧 */ }

  function render(instance) {
    const {layout, toggle, breakpoint, collapseToggle} = instance;
    const compact = window.innerWidth < breakpoint;
    layout.dataset.slMode = compact ? 'compact' : 'wide';
    layout.dataset.slSide = side;
    layout.dataset.slCollapsed = String(Boolean(collapseToggle && instance.collapsed));
    const sidebarLabel = layout.dataset.sidebarLabel || '侧栏';
    const label = compact ? (layout.dataset.slOpen === 'true' ? `收起${sidebarLabel} ↑` : `展开${sidebarLabel} ↓`)
      : side === 'right' ? '← 移到左侧' : '移到右侧 →';
    if (toggle.textContent !== label) toggle.textContent = label;
    toggle.setAttribute('aria-label', compact ? toggle.textContent : side === 'right' ? '将侧栏移到左侧' : '将侧栏移到右侧');
    if (compact) toggle.setAttribute('aria-expanded', String(layout.dataset.slOpen === 'true'));
    else toggle.removeAttribute('aria-expanded');
    if (compact && layout.dataset.slOpen !== 'true' && instance.panels.some(panel => panel.contains(document.activeElement))) toggle.focus({preventScroll: true});
    if (collapseToggle) {
      const collapseLabel = `${instance.collapsed ? '展开' : '收起'}${sidebarLabel}`;
      if (collapseToggle.textContent !== collapseLabel) collapseToggle.textContent = collapseLabel;
      collapseToggle.setAttribute('aria-label', `${instance.collapsed ? '展开' : '收起'}${sidebarLabel}`);
      collapseToggle.setAttribute('aria-expanded', String(!instance.collapsed));
      if (compact && document.activeElement === collapseToggle) toggle.focus({preventScroll: true});
      if (!compact && instance.collapsed && instance.panels.some(panel => panel.contains(document.activeElement))) collapseToggle.focus({preventScroll: true});
    }
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
      if (layout.dataset.slMode === 'wide' && instance.collapsed) {
        wrapper.style.setProperty('--sl-size', Math.ceil(instance.toggle.parentElement.getBoundingClientRect().height) + 'px');
      }
      else if (layout.dataset.slMode === 'wide' || layout.dataset.slOpen === 'true') {
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

  function revealHash(instance) {
    let target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
    if (!target || !instance.panels.some(panel => panel.contains(target))) return;
    instance.collapsed = false;
    instance.layout.dataset.slOpen = 'true';
    requestAnimationFrame(() => target.scrollIntoView({block: 'nearest'}));
  }

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
    const collapseToggle = layout.dataset.sidebarCollapsible !== 'false' ? document.createElement('button') : null;
    if (collapseToggle) {
      collapseToggle.type = 'button'; collapseToggle.className = 'sl-toggle sl-collapse';
      header.append(collapseToggle);
    }
    header.append(toggle); wrapper.append(header);
    // 多块辅助栏集中到同侧，正文继续按原来的顺序排列。
    const host = panels.length > 1 ? document.createElement('div') : panels[0];
    if (panels.length > 1) { host.className = 'sl-panel'; panels.forEach(panel => { panel.classList.add('sl-section'); host.append(panel); }); }
    else host.classList.add('sl-panel');
    wrapper.append(host); layout.prepend(wrapper);
    contents.forEach((content, index) => { content.classList.add('sl-main'); content.style.setProperty('--sl-row', String(index + 1)); });
    wrapper.style.setProperty('--sl-rows', String(contents.length));
    const top = layout.matches('.study-shell') ? Math.max(24, Math.ceil(document.querySelector('header')?.getBoundingClientRect().height || 0) + 16) : 24;
    wrapper.style.setProperty('--sl-top', top + 'px');
    const collapseKey = layout.dataset.sidebarCollapseKey || 'personal_sidebar_collapsed_v1:' + sidebarSelector;
    let collapsed = false;
    try { if (collapseToggle && collapseKey) collapsed = localStorage.getItem(collapseKey) === 'true'; } catch (e) { /* 默认展开导航 */ }
    const instance = {layout, wrapper, toggle, collapseToggle, collapseKey, collapsed, panels: [host], breakpoint: Number(breakpoint), fixed, top, header: top > 24 ? document.querySelector('header') : null};
    if (!host.id) host.id = wrapper.id + '-panel';
    toggle.setAttribute('aria-controls', host.id);
    if (collapseToggle) {
      collapseToggle.setAttribute('aria-controls', host.id);
      collapseToggle.addEventListener('click', () => {
        instance.collapsed = !instance.collapsed;
        if (collapseKey) {
          try { localStorage.setItem(collapseKey, String(instance.collapsed)); } catch (e) { /* 本页仍可折叠 */ }
        }
        render(instance); schedule();
      });
    }
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
    revealHash(instance); render(instance); sizeObserver?.observe(layout);
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
  window.addEventListener('hashchange', () => { instances.forEach(revealHash); schedule(); });
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) side = event.newValue === 'left' ? 'left' : 'right';
    for (const instance of instances.values()) {
      if (event.key === instance.collapseKey || event.key === null) instance.collapsed = event.newValue === 'true';
    }
    schedule();
  });
})();
