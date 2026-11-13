/* 图片使用本地原图；没有脚本时，链接仍可直接打开图片。 */
(() => {
  'use strict';
  const dialog = document.getElementById('origins-image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('origins-large-image');
  const caption = document.getElementById('origins-large-caption');
  const original = document.getElementById('origins-original-image');
  document.querySelectorAll('[data-origins-zoom]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      caption.textContent = link.closest('figure').querySelector('figcaption').textContent.trim();
      original.href = link.href;
      dialog.showModal();
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
