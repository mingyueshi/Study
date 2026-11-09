/* 数学公式页搜索：纯前端渐进增强——过滤当前章节的公式行，命中行高亮。
   无 JS 时页面完整可用；搜索只在当前章节范围内找，换章走左侧导航。 */
(function () {
  'use strict';
  const search = document.querySelector('[data-mform-search]');
  const rows = Array.from(document.querySelectorAll('[data-mform-row]'));
  const groups = Array.from(document.querySelectorAll('[data-mform-group]'));
  const visible = document.querySelector('[data-mform-visible]');
  const empty = document.querySelector('[data-mform-empty]');
  if (!search || !rows.length) return;

  search.addEventListener('input', () => {
    const keyword = search.value.trim().toLowerCase();
    let hits = 0;
    rows.forEach((row) => {
      const matched = !keyword || row.textContent.toLowerCase().includes(keyword);
      row.hidden = !matched;
      if (matched && keyword) {
        row.dataset.mformHit = '';
        hits += 1;
      } else {
        delete row.dataset.mformHit;
      }
    });
    groups.forEach((group) => {
      const any = group.querySelectorAll('[data-mform-row]:not([hidden])').length > 0;
      group.hidden = !any;
    });
    if (visible) visible.textContent = String(hits || rows.length);
    if (empty) empty.hidden = !(keyword && hits === 0);
  });
})();
