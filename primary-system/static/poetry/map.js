/* 诗词地图：地点切换走 URL（?place=），这里只做客户端的搜索与省份过滤。
   过滤同时作用于左侧地点列表和地图上的标记。 */
'use strict';

(() => {
  const searchEl = document.getElementById('map-search');
  const provinceBox = document.getElementById('map-provinces');
  if (!searchEl || !provinceBox) return;

  let province = '';
  const rows = Array.from(document.querySelectorAll('.place-row'));
  const markers = Array.from(document.querySelectorAll('.map-marker'));

  function match(el) {
    const query = searchEl.value.trim().toLowerCase();
    const hitQuery = !query
      || (el.dataset.name || '').toLowerCase().includes(query)
      || (el.dataset.city || '').toLowerCase().includes(query)
      || (el.dataset.province || '').toLowerCase().includes(query);
    const hitProvince = !province || el.dataset.province === province;
    return hitQuery && hitProvince;
  }

  function apply() {
    rows.forEach((row) => row.classList.toggle('hidden', !match(row)));
    markers.forEach((marker) => marker.classList.toggle('dimmed', !match(marker)));
  }

  searchEl.addEventListener('input', apply);
  provinceBox.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-province]');
    if (!chip) return;
    province = chip.dataset.province;
    provinceBox.querySelectorAll('.chip').forEach((el) => el.classList.toggle('on', el === chip));
    apply();
  });
})();
