/* 分支示意只负责认识人群；人物资料复用下方同一张证据卡。 */
(() => {
  'use strict';
  const root = document.getElementById('origins-family-tree');
  if (!root) return;
  const viewport = root.querySelector('.origins-tree-viewport');
  const frame = root.querySelector('.origins-tree-frame');
  const surface = root.querySelector('.origins-tree-surface');
  const minus = root.querySelector('[data-tree-minus]');
  const plus = root.querySelector('[data-tree-plus]');
  const fitButton = root.querySelector('[data-tree-fit]');
  const output = root.querySelector('[data-tree-scale]');
  const nodes = [...root.querySelectorAll('[data-tree-person]')];
  let scale = 1, fitted = true, drag = null;
  const min = .25, max = 2.5, width = 900, height = 520;

  function zoom(value) {
    const leftMargin = Math.max(0, (viewport.clientWidth - width * scale) / 2);
    const centre = {x: (viewport.scrollLeft + viewport.clientWidth / 2 - leftMargin) / scale,
      y: (viewport.scrollTop + viewport.clientHeight / 2) / scale};
    scale = Math.max(min, Math.min(max, value));
    frame.style.width = `${width * scale}px`;
    frame.style.height = `${height * scale}px`;
    surface.style.transform = `scale(${scale})`;
    viewport.scrollLeft = Math.max(0, centre.x * scale - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, centre.y * scale - viewport.clientHeight / 2);
    output.textContent = `${Math.round(scale * 100)}%`;
    minus.disabled = scale === min;
    plus.disabled = scale === max;
    fitButton.setAttribute('aria-pressed', String(fitted));
  }
  function fit() {
    fitted = true;
    zoom(Math.min(1, (viewport.clientWidth - 12) / width, (viewport.clientHeight - 12) / height));
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }
  minus.addEventListener('click', () => { fitted = false; zoom(scale - .25); });
  plus.addEventListener('click', () => { fitted = false; zoom(scale + .25); });
  fitButton.addEventListener('click', fit);
  window.addEventListener('resize', () => { if (fitted) fit(); });
  // 侧栏展开、折叠也会改变图面宽度，不一定触发窗口 resize。
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => { if (fitted) fit(); }).observe(viewport);
  }

  function highlight(id) {
    nodes.forEach(node => {
      if (`family-${node.dataset.treePerson}` === id) node.setAttribute('aria-current', 'location');
      else node.removeAttribute('aria-current');
    });
  }
  nodes.forEach(node => node.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const id = `family-${node.dataset.treePerson}`, card = document.getElementById(id);
    if (!card) return;
    event.preventDefault();
    card.open = true;
    highlight(id);
    try { window.history.replaceState(null, '', `#${id}`); } catch (_) { /* 受限环境仍可展开 */ }
    card.focus({preventScroll: true});
    card.scrollIntoView({block: 'start', behavior: 'instant'});
  }));
  document.querySelectorAll('.origins-tree-return').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const selected = nodes.find(node => node.getAttribute('aria-current')) || nodes[0];
    selected.focus({preventScroll: true});
    root.scrollIntoView({block: 'start', behavior: 'instant'});
    try { window.history.replaceState(null, '', '#origins-family-tree'); } catch (_) { /* 保留当前位置 */ }
  }));
  window.addEventListener('hashchange', () => highlight(window.location.hash.slice(1)));

  viewport.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.pointerType === 'touch' || event.target.closest('a, button')) return;
    drag = {x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop};
    viewport.setPointerCapture(event.pointerId);
    viewport.dataset.dragging = 'true';
    event.preventDefault();
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  });
  const stopDrag = () => { drag = null; viewport.dataset.dragging = 'false'; };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => viewport.addEventListener(type, stopDrag));
  root.querySelector('[data-tree-visual]').hidden = false;
  root.querySelector('[data-tree-fallback]').hidden = true;
  fit();
  highlight(window.location.hash.slice(1));
})();
