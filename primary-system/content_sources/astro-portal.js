/* 天文总入口：目录与问题搜索。详细讲解和互动仍使用原知识点与记录。 */
(() => {
  'use strict';
  const esc = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function openAnchor() {
    const anchor = location.hash.slice(1);
    const unit = ASTRO.units.find(item => item.points.some(point => 'lesson-' + point.id === anchor));
    const anchorView = unit?.id || (anchor.startsWith('roam-') ? 'universe' : /^(sky-|mission-)/.test(anchor) ? 'lab' : '');
    if (!anchorView) return false;
    const url = new URL(location.href);
    url.searchParams.set('view', anchorView);
    location.replace(url);
    return true;
  }
  window.addEventListener('hashchange', openAnchor);
  if (openAnchor()) return;
  document.getElementById('astro-portal-intro').textContent = ASTRO.portal.intro;
  function render(query = '') {
    const term = query.trim().toLowerCase();
    const tools = ASTRO.portal.tools.filter(tool => (tool.title + tool.intro).toLowerCase().includes(term));
    document.getElementById('astro-tools').innerHTML = tools.map(tool =>
      '<a class="astro-tool" href="?view=' + tool.id + '"><span aria-hidden="true">' + tool.emoji + '</span><div><h3>' + esc(tool.title) + ' →</h3><p>' + esc(tool.intro) + '</p></div></a>').join('');
    document.querySelector('.astro-portal-tools').hidden = !tools.length;
    let matches = 0;
    const cards = ASTRO.units.map(item => {
      const all = !term || (item.name + item.intro).toLowerCase().includes(term);
      const points = item.points.filter(point => all || [point.title, point.overview, ...point.items].join(' ').toLowerCase().includes(term));
      if (!points.length) return '';
      matches += points.length;
      return '<article class="astro-topic" style="--topic-color:' + item.color + '">' +
        '<a class="astro-topic-link" href="?view=' + item.id + '"><span class="astro-topic-icon" aria-hidden="true">' + item.emoji + '</span><h2>' + esc(item.name) + '</h2><p>' + esc(item.intro) + '</p><span class="astro-topic-enter">进入主题 →</span></a>' +
        '<details' + (term ? ' open' : '') + '><summary>' + points.length + ' 个探索问题</summary><ul>' + points.map(point =>
          '<li><a href="?view=' + item.id + '#lesson-' + point.id + '">' + esc(point.title) + '</a></li>').join('') + '</ul></details></article>';
    }).join('');
    document.getElementById('astro-topics').innerHTML = cards;
    document.getElementById('astro-topic-empty').hidden = Boolean(cards || tools.length);
    document.getElementById('astro-search-status').textContent = term ? '找到 ' + matches + ' 个相关问题、' + tools.length + ' 个工具' : '';
  }
  document.getElementById('astro-topic-search').addEventListener('input', event => render(event.target.value));
  render();
})();
