/* 图示装载器：服务端输出占位 div，本脚本按 data-fig-placeholder 注入图示库产物。
   图示库自带事件委托与 MutationObserver，注入后互动演示即自动可用。 */
'use strict';

(() => {
  const FALLBACK = '<p class="fig-missing">这条内容的图示还在准备中。</p>';

  function mount(placeholder) {
    const lib = window[placeholder.dataset.figLib];
    const id = placeholder.dataset.figFig;
    const caption = placeholder.dataset.figCaption || '';
    if (!lib || typeof lib.figHTML !== 'function') {
      placeholder.innerHTML = FALLBACK;
      return;
    }
    if (!lib.has(id)) {
      placeholder.innerHTML = FALLBACK;
      return;
    }
    placeholder.outerHTML = lib.figHTML(id, caption || undefined);
  }

  function mountAll(root) {
    (root || document).querySelectorAll('[data-fig-placeholder]').forEach(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mountAll(document));
  } else {
    mountAll(document);
  }

  window.FigureLoader = { mountAll };
})();
