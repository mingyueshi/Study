/* 侧栏筛选按素材类型、主题与地图地点组合。 */
(() => {
  'use strict';
  const A = window.GMAtlas;
  const M = window.GMMedia;
  const { esc } = window.GMShared;
  const groups = window.GM_MEDIA_GROUPS;
  const $ = id => document.getElementById(id);
  const place = A.get(new URLSearchParams(location.search).get('place'));
  const entries = place ? M.forPlace(place.id) : M.entries;
  const kind = $('media-kind');
  const group = $('media-group');
  const all = $('media-all');
  const options = (list) => list.map(([id, label]) =>
    `<option value="${esc(id)}">${esc(label)}</option>`).join('');
  kind.insertAdjacentHTML('beforeend', options(M.types));
  group.insertAdjacentHTML('beforeend', options(groups.map(g => [g.id, g.name])));
  all.hidden = !place;
  if (place) {
    $('media-intro').textContent = `看看「${place.name}」的照片和影像，再回到地图找它的位置。`;
    document.title = `${place.name} · 实景图册`;
  }

  function render() {
    const matches = entries.filter(m => (!kind.value || m.kind === kind.value) && (!group.value || m.group === group.value));
    $('media-count').textContent = `${place ? place.name + ' · ' : ''}${matches.length} 项素材`;
    $('media-empty').hidden = matches.length > 0;
    $('media-list').innerHTML = groups.map(g => {
      const cards = matches.filter(m => m.group === g.id);
      return cards.length
        ? `<section class="gm-media-group"><h2>${esc(g.name)}</h2><div class="gm-media-grid">${cards.map(M.card).join('')}</div></section>`
        : '';
    }).join('');
  }

  kind.addEventListener('change', render);
  group.addEventListener('change', render);
  render();
})();
