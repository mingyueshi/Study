/* 日期折叠使用原生 details；脚本只补充本页批量操作与定位。 */
(() => {
  'use strict';
  const days = [...document.querySelectorAll('.upgrade-day-details')];
  const controls = document.querySelector('.upgrade-toggles');
  if (!days.length || !controls) return;
  const expand = controls.querySelector('[data-upgrade-toggle="expand"]');
  const collapse = controls.querySelector('[data-upgrade-toggle="collapse"]');
  const sync = () => {
    expand.disabled = days.every(day => day.open);
    collapse.disabled = days.every(day => !day.open);
  };
  controls.hidden = false;
  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-upgrade-toggle]');
    if (!button || !controls.contains(button)) return;
    days.forEach(day => { day.open = button.dataset.upgradeToggle === 'expand'; });
    sync();
  });
  days.forEach(day => day.addEventListener('toggle', sync));

  function revealTarget() {
    const id = location.hash.slice(1);
    if (!/^change-[0-9a-f]{40}$/.test(id)) return;
    const target = document.getElementById(id);
    const day = target?.closest('.upgrade-day-details');
    if (!day) return;
    day.open = true;
    target.scrollIntoView({block: 'nearest'});
    sync();
  }
  window.addEventListener('hashchange', revealTarget);
  revealTarget();
  sync();

  // 打印本页完整记录，返回页面后恢复原来的折叠状态。
  let beforePrint;
  window.addEventListener('beforeprint', () => {
    if (beforePrint) return;
    beforePrint = days.map(day => day.open);
    days.forEach(day => { day.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!beforePrint) return;
    days.forEach((day, index) => { day.open = beforePrint[index]; });
    beforePrint = undefined;
    sync();
  });
})();
