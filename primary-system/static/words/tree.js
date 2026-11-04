/* 词以类聚：服务端已渲染整棵树；这里只做两件小事——
   1. 点击词卡链接前记住各枝干展开状态（返回本页时还原）；
   2. 深链词滚动到可视位置。 */
'use strict';

(() => {
  const STORE_KEY = 'words_tree_expand_v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch (e) { /* 忽略 */ }

  document.querySelectorAll('.tree-branch details').forEach((details) => {
    const id = (details.closest('.tree-branch')?.querySelector('summary')?.textContent || '').trim();
    if (!id) return;
    if (id in saved) details.open = saved[id];
    details.addEventListener('toggle', () => {
      saved[id] = details.open;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch (e) { /* 忽略 */ }
    });
  });

  const active = document.querySelector('.tree-word.on');
  if (active) active.scrollIntoView({ block: 'center' });
})();
