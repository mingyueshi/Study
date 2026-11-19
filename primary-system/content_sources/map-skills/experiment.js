/* 到参数区或图面时保留当前实验地址与运行状态。 */
(() => {
  'use strict';
  const workspace = document.querySelector('.experiment-workspace');
  const sidebar = workspace.querySelector('.experiment-side');

  function targetAt(hash) {
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return null; }
  }

  function revealDetails(target) {
    for (let group = target?.closest('details'); group; group = group.parentElement.closest('details')) group.open = true;
  }

  function restoreAnchor() {
    const target = targetAt(location.hash);
    if (!target?.closest('details')) return;
    revealDetails(target);
    requestAnimationFrame(() => target.scrollIntoView({block: 'nearest'}));
  }

  window.addEventListener('hashchange', restoreAnchor);
  restoreAnchor();
  workspace.addEventListener('click', event => {
    const link = event.target.closest('[data-experiment-jump], [data-experiment-return]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const target = targetAt(link.hash);
    if (!target) return;
    event.preventDefault();
    revealDetails(target);
    if (sidebar.contains(target)) {
      if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen === 'false') {
        workspace.querySelector('.sl-toggle:not(.sl-collapse)').click();
      } else if (workspace.dataset.slMode === 'wide' && workspace.dataset.slCollapsed === 'true') {
        workspace.querySelector('.sl-collapse').click();
      }
    }
    const focus = target.matches('details') ? target.querySelector('summary') : target;
    if (!focus.matches('summary, [tabindex]')) focus.tabIndex = -1;
    focus.focus({preventScroll: true});
    focus.scrollIntoView({block: 'start'});
  });
})();
