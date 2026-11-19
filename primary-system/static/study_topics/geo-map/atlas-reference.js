/* 地点、路线和图册共用侧栏跳转及筛选书签。 */
window.GMAtlasReference = (() => {
  'use strict';
  const workspace = document.querySelector('.gm-atlas-reference .gm-flat-workspace');
  const jump = workspace.querySelector('.gm-tools-jump');

  function toolsFor(hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return null; }
    const group = document.getElementById(id)?.closest('.gm-flat-tools');
    return group && workspace.contains(group) ? group : null;
  }

  function openTargetGroup() {
    const group = toolsFor(location.hash);
    if (group) group.open = true;
  }

  window.addEventListener('hashchange', openTargetGroup);
  openTargetGroup();
  jump.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const group = toolsFor(jump.hash);
    if (!group) return;
    group.open = true;
    // 同一锚点再次点击时也能从折叠状态打开。
    if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen === 'false') {
      workspace.querySelector('.sl-toggle:not(.sl-collapse)').click();
    } else if (workspace.dataset.slMode === 'wide' && workspace.dataset.slCollapsed === 'true') {
      workspace.querySelector('.sl-collapse').click();
    }
    requestAnimationFrame(() => group.querySelector('summary').focus());
  });

  function bindFilters(fields, render) {
    const controls = Object.entries(fields);
    let currentQuery;

    function restore() {
      if (location.search === currentQuery) return;
      currentQuery = location.search;
      const params = new URLSearchParams(currentQuery);
      for (const [name, field] of controls) {
        field.value = params.get(name) || '';
        if (field.tagName === 'SELECT') {
          if (field.selectedIndex === -1) field.value = '';
          window.StudyChoices?.sync(field);
        }
      }
      render();
    }

    function update() {
      const url = new URL(location.href);
      for (const [name, field] of controls) {
        if (field.value) url.searchParams.set(name, field.value);
        else url.searchParams.delete(name);
      }
      if (url.href !== location.href) {
        try { history.replaceState(history.state, '', url); } catch { /* 不支持写入地址时仍可筛选 */ }
      }
      currentQuery = location.search;
      render();
    }

    for (const [, field] of controls) field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', update);
    window.addEventListener('popstate', restore);
    restore();
    return update;
  }

  return {bindFilters};
})();
