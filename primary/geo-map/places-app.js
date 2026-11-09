/* 地点目录独立于地图几何，靠地点 ID 生成跳转链接。 */
(() => {
  'use strict';
  const A = window.GMAtlas;
  const { esc } = window.GMShared;
  const root = document.querySelector('.places-topic');
  const $ = (id) => root.querySelector('#' + id);
  const search = $('place-search');
  const category = $('place-category');
  const list = $('place-results');
  const more = $('place-more');
  const params = new URLSearchParams(location.search);
  const batch = 24;
  let matches = [];
  let shown = 0;

  category.insertAdjacentHTML('beforeend', A.categories.map(([id, label]) =>
    `<option value="${esc(id)}">${esc(label)}</option>`).join(''));
  category.value = A.categories.some(([id]) => id === params.get('type')) ? params.get('type') : '';
  search.value = params.get('q') || '';

  const resultCard = (p) =>
    `<li class="gm-place-card"><small>${A.mapLabel(p)} · ${esc(p.context)}</small>` +
    `<h2>${esc(p.name)}</h2>` +
    (p.where ? `<p>${esc(p.where)}</p>` : '') +
    `<div class="gm-place-links"><a href="${esc(A.mapHref(p))}" aria-label="在${A.mapLabel(p)}上看${esc(p.name)}">地图上看 →</a>` +
    (p.adcode ? `<a href="province.html?adcode=${esc(p.adcode)}" aria-label="进入${esc(p.name)}省域站">进省域站 →</a>` : '') +
    '</div></li>';

  function appendResults() {
    const next = matches.slice(shown, shown + batch);
    const firstIndex = shown;
    list.insertAdjacentHTML('beforeend', next.map(resultCard).join(''));
    shown += next.length;
    $('place-count').textContent = `找到 ${matches.length} 个地点` + (matches.length ? `，已显示 ${shown} 个` : '');
    more.hidden = shown >= matches.length;
    return list.children[firstIndex]?.querySelector('a');
  }

  function refresh() {
    matches = A.search(search.value, category.value);
    list.innerHTML = '';
    shown = 0;
    $('place-empty').hidden = matches.length > 0;
    appendResults();
  }
  search.addEventListener('input', refresh);
  category.addEventListener('change', refresh);
  root.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    refresh();
  });
  more.addEventListener('click', () => appendResults()?.focus());
  refresh();
})();
