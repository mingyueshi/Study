/* 站内目录沿用片段书签。窄屏选中小节后把阅读位置交给正文。 */
(() => {
  'use strict';
  const reading = document.querySelector('.origins-reading');
  if (!reading) return;
  const sidebar = reading.querySelector('.origins-station-nav');
  const localLinks = [...sidebar.querySelectorAll('.origins-jumps a')];
  localLinks.filter(link => link.hidden).forEach(link => {
    const target = document.getElementById(link.hash.slice(1));
    if (target && !target.closest('[hidden]')) link.hidden = false;
  });
  const sections = new Set(localLinks.map(link => link.hash));

  function reveal(hash, focus = true) {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    const compact = reading.dataset.slMode === 'compact';
    const toggle = reading.querySelector('.sl-toggle:not(.sl-collapse)');
    if (sidebar.contains(target)) {
      const group = target.closest('details');
      if (group) group.open = true;
      if (compact && reading.dataset.slOpen !== 'true') toggle?.click();
      if (reading.dataset.slMode === 'wide' && reading.dataset.slCollapsed === 'true') reading.querySelector('.sl-collapse')?.click();
    } else if (sections.has(hash)) {
      if (compact && reading.dataset.slOpen === 'true') toggle?.click();
    } else return;

    const destination = target.matches('details') ? target.querySelector('summary') : target;
    if (focus) {
      if (!destination.matches('summary, [tabindex]')) destination.tabIndex = -1;
      destination.focus({preventScroll: true});
    }
    requestAnimationFrame(() => destination.scrollIntoView({block: sidebar.contains(destination) ? 'nearest' : 'start', behavior: 'instant'}));
  }

  reading.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('.origins-directory-link, .origins-jumps a');
    if (link?.hash === location.hash) {
      event.preventDefault();
      reveal(link.hash);
    }
  });
  window.addEventListener('hashchange', () => reveal(location.hash));
  window.addEventListener('load', () => reveal(location.hash, false), {once: true});
})();
