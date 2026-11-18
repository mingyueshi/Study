/* 长列表沿用原生 select。显式标记的短列表可用按钮操作同一个表单字段。 */
(() => {
  'use strict';

  const scope = '.site-masthead select, .shell select';
  const single = 'select:not([multiple]):is(:not([size]), [size="1"])';
  const customPicker = window.CSS?.supports('appearance', 'base-select') && 'HTMLSelectedContentElement' in window;
  const groups = new WeakMap();
  let nextLabel = 0;

  function enhanceInline(select) {
    const container = select.closest('[data-inline-choice]');
    if (!container) return false;
    let group = groups.get(select);
    const options = [...select.options];
    if (!select.matches(single) || select.querySelector('optgroup') || options.length < 2 || options.length > 6) {
      if (group) {
        group.remove();
        groups.delete(select);
        select.hidden = false;
      }
      return false;
    }
    if (!group) {
      const label = select.labels[0];
      if (!label) return false;
      label.id ||= 'inline-choice-label-' + (++nextLabel);
      group = document.createElement('div');
      group.className = 'inline-choice-options';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-labelledby', label.id);
      const description = select.getAttribute('aria-describedby');
      if (description) group.setAttribute('aria-describedby', description);
      group.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button || button.disabled) return;
        const index = [...group.children].indexOf(button);
        if (index === select.selectedIndex) return;
        select.selectedIndex = index;
        select.dispatchEvent(new Event('input', {bubbles: true}));
        select.dispatchEvent(new Event('change', {bubbles: true}));
      });
      container.append(group);
      groups.set(select, group);
    }
    const buttons = [...group.children];
    if (buttons.length !== options.length || options.some((option, i) => option.value !== buttons[i].value || option.label !== buttons[i].textContent)) {
      group.replaceChildren(...options.map(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.value = option.value;
        button.textContent = option.label;
        return button;
      }));
    }
    select.hidden = true;
    options.forEach((option, i) => {
      const button = group.children[i];
      button.disabled = select.disabled || option.disabled;
      button.setAttribute('aria-pressed', String(option.selected));
    });
    return true;
  }

  function enhance(select) {
    if (!select.isConnected || !select.matches(scope)) return;
    const owned = select.querySelector(':scope > button[data-select-trigger]');
    if (enhanceInline(select)) { owned?.remove(); return; }
    if (!customPicker) return;
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
    for (const name of ['input', 'change']) document.addEventListener(name, event => {
      if (event.target.matches?.('select')) enhanceInline(event.target);
    });
    document.addEventListener('reset', event => {
      requestAnimationFrame(() => event.target.querySelectorAll('select').forEach(enhanceInline));
    });
    new MutationObserver((records) => {
      const pending = new Set();
      for (const record of records) {
        const target = record.target;
        // selectedcontent 由浏览器同步，不重复处理它的自动克隆。
        if (target.nodeType === 1 && target.closest('selectedcontent')) continue;
        const select = target.parentElement?.closest('select');
        if (select) pending.add(select);
        if (target.nodeType === 1 && target.matches('select')) pending.add(target);
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches('select')) pending.add(node);
          node.querySelectorAll('select').forEach((select) => pending.add(select));
        }
      }
      pending.forEach(enhance);
    }).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['multiple', 'size', 'disabled', 'selected', 'label', 'value']});
  }

  window.StudyChoices = {sync: enhanceInline};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
