/* 点位介绍从正文证据卡读取，避免在地图另存一份说明。 */
(() => {
  'use strict';
  const panel = document.getElementById('origins-site-preview');
  if (!panel) return;
  const links = [...document.querySelectorAll('[data-site-select]')];
  const records = new Map();
  links.forEach(link => {
    const id = link.getAttribute('href').slice(1), record = document.getElementById(id);
    if (record) records.set(id, record);
  });
  const full = document.getElementById('origins-site-preview-full');
  let selected = null;
  function select(id, focus = false) {
    const record = records.get(id);
    if (!record) return;
    selected = id;
    const meanings = record.querySelectorAll('dd');
    document.getElementById('origins-site-preview-heading').textContent = record.querySelector('h3').textContent;
    document.getElementById('origins-site-preview-period').textContent = record.querySelector('.origins-clue-place').textContent;
    document.getElementById('origins-site-preview-observation').textContent = meanings[0].textContent;
    document.getElementById('origins-site-preview-meaning').textContent = meanings[1].textContent;
    full.href = `#${id}`;
    links.forEach(link => {
      if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    panel.hidden = false;
    if (focus) {
      panel.focus({preventScroll: true});
      panel.scrollIntoView({block: 'nearest', behavior: 'instant'});
    }
  }
  const modified = event => event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;
  links.forEach(link => link.addEventListener('click', event => {
    if (modified(event)) return;
    const id = link.getAttribute('href').slice(1);
    if (!records.has(id)) return;
    event.preventDefault();
    select(id, true);
    try { window.history.replaceState(null, '', `#${id}`); } catch (_) { /* 原始锚点仍可访问 */ }
  }));
  full.addEventListener('click', event => {
    if (modified(event) || !selected) return;
    event.preventDefault();
    const record = records.get(selected);
    record.focus({preventScroll: true});
    record.scrollIntoView({block: 'start', behavior: 'instant'});
  });
  document.querySelectorAll('.origins-site-return').forEach(link => link.addEventListener('click', event => {
    if (modified(event)) return;
    const pin = links.find(item => item.closest('.origins-site-pin') && item.getAttribute('href') === `#${selected}`);
    if (!pin) return;
    event.preventDefault();
    pin.focus({preventScroll: true});
    document.getElementById('origins-sites-heading').scrollIntoView({block: 'start', behavior: 'instant'});
    try { window.history.replaceState(null, '', '#origins-sites-heading'); } catch (_) { /* 保留阅读位置 */ }
  }));
  const restore = () => select(window.location.hash.slice(1));
  window.addEventListener('hashchange', restore);
  window.addEventListener('popstate', restore);
  restore();
})();
