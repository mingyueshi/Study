/* 给可定制的原生 select 补上可省略的选中文本，不接管选择或表单事件。 */
(() => {
  'use strict';
  if (!window.CSS?.supports('appearance', 'base-select') || !('HTMLSelectedContentElement' in window)) return;

  const scope = '.site-masthead select, .shell select';
  const single = 'select:not([multiple]):is(:not([size]), [size="1"])';

  function enhance(select) {
    if (!select.isConnected || !select.matches(scope)) return;
    const owned = select.querySelector(':scope > button[data-select-trigger]');
    if (!select.matches(single)) {
      owned?.remove();
      return;
    }
    if (select.querySelector(':scope > button')) return;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.dataset.selectTrigger = '';
    trigger.append(document.createElement('selectedcontent'));
    select.prepend(trigger);
  }

  function start() {
    document.querySelectorAll(scope).forEach(enhance);
    new MutationObserver((records) => {
      const pending = new Set();
      for (const record of records) {
        const target = record.target;
        // selectedcontent 由浏览器同步，不重复处理它的自动克隆。
        if (target.nodeType === 1 && target.closest('selectedcontent')) continue;
        if (target.nodeType === 1 && target.matches('select')) pending.add(target);
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches('select')) pending.add(node);
          node.querySelectorAll('select').forEach((select) => pending.add(select));
        }
      }
      pending.forEach(enhance);
    }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['multiple', 'size']});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
