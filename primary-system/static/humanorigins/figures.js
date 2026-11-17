/* 图片使用本地原图；没有脚本时，链接仍可直接打开图片。 */
(() => {
  'use strict';
  const dialog = document.getElementById('origins-image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('origins-large-image');
  const caption = document.getElementById('origins-large-caption');
  const original = document.getElementById('origins-original-image');
  const stage = document.getElementById('origins-inspector-stage');
  const lens = document.getElementById('origins-detail-lens');
  const toggle = document.getElementById('origins-lens-toggle');
  const power = document.getElementById('origins-lens-power');
  const status = document.getElementById('origins-lens-status');
  const question = document.getElementById('origins-inspector-question');
  let enabled = true, magnification = 3, point = {x: .5, y: .5}, pointer = null;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function renderLens() {
    const bounds = image.getBoundingClientRect();
    lens.hidden = !enabled || !dialog.open || !image.naturalWidth || !bounds.width || !bounds.height;
    if (lens.hidden) return;
    const outer = stage.getBoundingClientRect(), diameter = Math.min(160, bounds.width, bounds.height);
    lens.style.width = `${diameter}px`;
    lens.style.height = `${diameter}px`;
    // 以实际图片边界计算，留白不计入放大位置；背景仍使用同一张本地原图。
    lens.style.left = `${bounds.left - outer.left + clamp(point.x * bounds.width - diameter / 2, 0, Math.max(0, bounds.width - diameter))}px`;
    lens.style.top = `${bounds.top - outer.top + clamp(point.y * bounds.height - diameter / 2, 0, Math.max(0, bounds.height - diameter))}px`;
    lens.style.backgroundImage = `url("${image.src}")`;
    lens.style.backgroundSize = `${bounds.width * magnification}px ${bounds.height * magnification}px`;
    lens.style.backgroundPosition = `${diameter / 2 - point.x * bounds.width * magnification}px ${diameter / 2 - point.y * bounds.height * magnification}px`;
  }

  function renderControls() {
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? '收起放大镜' : '开启放大镜';
    stage.dataset.lens = String(enabled);
    status.textContent = enabled ? `正在看 ${magnification} 倍细节` : '正在看完整图片';
    renderLens();
  }

  function moveLens(event) {
    if (!enabled) return;
    const bounds = image.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const inside = event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
    if (!inside && pointer === null) { lens.hidden = true; return; }
    point = {x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1)};
    renderLens();
  }

  toggle.addEventListener('click', () => { enabled = !enabled; renderControls(); });
  power.addEventListener('change', () => {
    magnification = [2, 3, 4].includes(Number(power.value)) ? Number(power.value) : 3;
    power.value = String(magnification);
    renderControls();
  });
  stage.addEventListener('pointermove', moveLens);
  stage.addEventListener('pointerdown', event => {
    if (!enabled || event.button !== 0) return;
    pointer = event.pointerId;
    stage.setPointerCapture(pointer);
    stage.focus({preventScroll: true});
    moveLens(event);
    event.preventDefault();
  });
  function releasePointer() {
    if (pointer !== null && stage.hasPointerCapture?.(pointer)) stage.releasePointerCapture(pointer);
    pointer = null;
  }
  stage.addEventListener('pointerup', releasePointer);
  stage.addEventListener('pointercancel', releasePointer);
  stage.addEventListener('lostpointercapture', releasePointer);
  stage.addEventListener('pointerleave', () => { if (pointer === null) lens.hidden = true; });
  stage.addEventListener('focus', renderLens);
  stage.addEventListener('keydown', event => {
    const delta = {ArrowLeft: [-.04, 0], ArrowRight: [.04, 0], ArrowUp: [0, -.04], ArrowDown: [0, .04]}[event.key];
    if (!delta) return;
    event.preventDefault();
    point = {x: clamp(point.x + delta[0], 0, 1), y: clamp(point.y + delta[1], 0, 1)};
    if (!enabled) { enabled = true; renderControls(); } else renderLens();
  });
  image.addEventListener('load', renderLens);
  window.addEventListener('resize', () => { if (dialog.open) renderLens(); });
  dialog.addEventListener('close', () => { releasePointer(); lens.hidden = true; });
  document.querySelectorAll('[data-origins-zoom]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      caption.textContent = link.closest('figure').querySelector('figcaption').textContent.trim();
      original.href = link.href;
      const observation = link.closest('figure').querySelector('.origins-observation');
      question.hidden = !observation;
      question.open = false;
      question.querySelector('summary').textContent = observation?.querySelector('summary').textContent || '';
      question.querySelector('p').textContent = observation?.querySelector('p').textContent || '';
      point = {x: .5, y: .5};
      enabled = true;
      dialog.showModal();
      renderControls();
    });
  });
  dialog.querySelector('[data-origins-image-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  // 从时间条或深链接进入折叠卡片时直接展开，原生锚点仍保持可用。
  function revealCard() {
    const id = window.location.hash.slice(1);
    if (!id.startsWith('family-')) return;
    const card = document.getElementById(id);
    if (card?.matches('.origins-family-card')) card.open = true;
  }
  window.addEventListener('hashchange', revealCard);
  revealCard();
})();
