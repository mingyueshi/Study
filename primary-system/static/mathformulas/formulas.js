/* 全库搜索与本机收藏：静态内容先由服务端渲染，JS 只处理筛选与浏览器收藏。 */
(() => {
  'use strict';
  const app = document.querySelector('[data-mform-app]');
  if (!app) return;
  const $ = selector => app.querySelector(selector);
  const search = $('[data-mform-search]');
  const rows = [...app.querySelectorAll('[data-mform-row]')];
  const groups = [...app.querySelectorAll('[data-mform-group]')];
  const ids = new Set(rows.map(row => row.dataset.id));
  const storageKey = `primary-math-formulas-favorites-v1:${app.dataset.scope}`;
  const chapterButton = $('[data-mform-chapter-view]');
  const favoritesButton = $('[data-mform-favorites-view]');
  const storageNote = $('[data-mform-storage-note]');
  const intro = $('[data-mform-intro]');
  const empty = $('[data-mform-empty]');
  let favoritesOnly = new URL(location.href).searchParams.get('view') === 'favorites';
  const read = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return {ids: new Set(Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string' && ids.has(id)) : []), available: true};
    } catch (error) { return {ids: new Set(), available: false}; }
  };
  let {ids: favorites, available} = read();
  let pendingLocal = false;
  if (!available) storageNote.textContent = '浏览器暂时无法读取收藏，仍可搜索和阅读例题。';

  const render = (updateURL = false) => {
    const query = search.value.trim().slice(0, 80);
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
    rows.forEach(row => {
      const collected = favorites.has(row.dataset.id);
      const inScope = favoritesOnly ? collected : tokens.length || row.dataset.chapter === app.dataset.chapter;
      const matched = inScope && tokens.every(token => row.dataset.search.includes(token));
      row.hidden = !matched;
      row.toggleAttribute('data-mform-hit', Boolean(matched && tokens.length));
      if (matched) count += 1;
      const button = row.querySelector('[data-mform-favorite]');
      button.textContent = collected ? '★ 已收藏' : '☆ 收藏';
      button.setAttribute('aria-pressed', String(collected));
      button.setAttribute('aria-label', `${collected ? '取消收藏' : '收藏'}${row.querySelector('[data-mform-name]').textContent}`);
    });
    groups.forEach(group => { group.hidden = !group.querySelector('[data-mform-row]:not([hidden])'); });
    favoritesButton.textContent = `⭐ 我的收藏（${favorites.size}）`;
    favoritesButton.setAttribute('aria-pressed', String(favoritesOnly));
    chapterButton.setAttribute('aria-pressed', String(!favoritesOnly && !tokens.length));
    $('[data-mform-clear]').hidden = !query;
    $('[data-mform-count-note]').textContent = `${favoritesOnly ? '收藏夹' : query ? '全部学段搜索' : '本章'}：${count} 条公式${query ? `，关键词「${query}」` : ''}。`;
    $('[data-mform-heading]').textContent = favoritesOnly ? '我的公式收藏夹' : query ? '搜索结果 · 全部学段' : intro.dataset.chapterTitle;
    intro.textContent = favoritesOnly ? '常用和容易忘的公式放在一起，点击星星可以取消收藏。'
      : query ? '按名称、公式和使用场景查找，点击出处可回到原章节。' : intro.dataset.chapterIntro;
    empty.hidden = count > 0;
    empty.textContent = favoritesOnly ? query ? '收藏夹里没有匹配的公式，试试清除关键词。'
      : '收藏夹还是空的。点击公式旁的「☆ 收藏」，把常用或易错公式收进来。' : '没有找到匹配的公式，换个关键词试试。';
    if (updateURL) {
      const url = new URL(location.href);
      if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
      if (favoritesOnly) url.searchParams.set('view', 'favorites'); else url.searchParams.delete('view');
      url.hash = '';
      history.replaceState(null, '', url);
    }
  };

  app.querySelectorAll('[data-mform-enhanced], [data-mform-favorite]').forEach(element => { element.hidden = false; });
  search.addEventListener('input', () => render(true));
  $('[data-mform-search-form]').addEventListener('submit', event => { event.preventDefault(); render(true); });
  $('[data-mform-clear]').addEventListener('click', () => { search.value = ''; render(true); search.focus(); });
  chapterButton.addEventListener('click', () => { favoritesOnly = false; search.value = ''; render(true); });
  favoritesButton.addEventListener('click', () => { favoritesOnly = true; render(true); });
  app.addEventListener('click', event => {
    const button = event.target.closest('[data-mform-favorite]');
    if (!button) return;
    const row = button.closest('[data-mform-row]');
    const latest = read();
    if (latest.available && !pendingLocal) favorites = latest.ids;
    const id = row.dataset.id;
    const removing = favorites.has(id);
    if (removing) favorites.delete(id); else favorites.add(id);
    let saved = true;
    try { localStorage.setItem(storageKey, JSON.stringify([...favorites])); } catch (error) { saved = false; }
    pendingLocal = !saved;
    render();
    storageNote.textContent = saved ? `${removing ? '已取消收藏' : '已收藏'}「${row.querySelector('[data-mform-name]').textContent}」。仅保存在当前浏览器，清理浏览器数据会清空。`
      : '本页的收藏已更新；浏览器无法保存，关闭页面后不会保留。搜索和例题仍可使用。';
    if (favoritesOnly && row.hidden) favoritesButton.focus();
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    favorites = read().ids;
    render();
  });
  window.addEventListener('popstate', () => {
    const params = new URL(location.href).searchParams;
    search.value = params.get('q') || '';
    favoritesOnly = params.get('view') === 'favorites';
    render();
  });
  const revealHash = () => {
    const row = document.getElementById(location.hash.slice(1));
    if (!row || !row.matches('[data-mform-row]') || row.hidden) return;
    row.querySelector('details').open = true;
    requestAnimationFrame(() => row.scrollIntoView({block: 'start'}));
  };
  window.addEventListener('hashchange', revealHash);
  render();
  revealHash();
})();
