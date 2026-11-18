/* 日期折叠使用原生 details，滚动加载复用服务端渲染的下一批。 */
(() => {
  'use strict';
  const timeline = document.getElementById('upgrade-days');
  const controls = document.querySelector('.upgrade-toggles');
  if (!timeline || !controls) return;
  const days = () => [...timeline.querySelectorAll('.upgrade-day-details')];
  if (!days().length) return;
  const expand = controls.querySelector('[data-upgrade-toggle="expand"]');
  const collapse = controls.querySelector('[data-upgrade-toggle="collapse"]');
  const sync = () => {
    const loadedDays = days();
    expand.disabled = loadedDays.every(day => day.open);
    collapse.disabled = loadedDays.every(day => !day.open);
  };
  controls.hidden = false;
  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-upgrade-toggle]');
    if (!button || !controls.contains(button)) return;
    days().forEach(day => { day.open = button.dataset.upgradeToggle === 'expand'; });
    sync();
  });
  timeline.addEventListener('toggle', sync, true);

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

  // 打印已加载的记录，返回页面后恢复原来的折叠状态。
  let beforePrint;
  window.addEventListener('beforeprint', () => {
    if (beforePrint) return;
    beforePrint = new Map(days().map(day => [day, day.open]));
    beforePrint.forEach((open, day) => { day.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!beforePrint) return;
    beforePrint.forEach((open, day) => { day.open = open; });
    beforePrint = undefined;
    sync();
  });

  const next = document.querySelector('[data-upgrade-next]');
  if (!next || !window.fetch || !window.DOMParser) return;
  const status = document.querySelector('.upgrade-load-status');
  let loading = false;
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) loadOlder();
  }, {rootMargin: '0px 0px 160px'}) : null;

  async function loadOlder(manual = false) {
    if (loading || next.hidden) return;
    loading = true;
    observer?.unobserve(next);
    next.setAttribute('aria-disabled', 'true');
    status.textContent = '正在加载更早的记录…';
    const url = next.href;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const batch = new DOMParser().parseFromString(await response.text(), 'text/html');
      const sections = [...batch.querySelectorAll('#upgrade-days > .upgrade-day')];
      if (!batch.getElementById('upgrade-days')) throw new Error('缺少升级记录');
      const followingLink = batch.querySelector('[data-upgrade-next]');
      const following = followingLink ? new URL(followingLink.getAttribute('href'), url) : null;

      const added = sections.filter(section => !document.getElementById(section.getAttribute('aria-labelledby')));
      const isSearch = new URL(url).searchParams.has('q');
      for (const section of added) {
        const day = section.querySelector('.upgrade-day-details');
        day.open = isSearch;
        if (beforePrint) {
          beforePrint.set(day, day.open);
          day.open = true;
        }
      }
      const moveFocus = document.activeElement === next && (manual || !following);
      timeline.append(...added);
      sync();
      if (moveFocus) added[0]?.querySelector('summary')?.focus();
      if (following) {
        next.href = following.href;
        status.textContent = added.length ? `已加载 ${added.length} 天的记录` : '';
        observer?.observe(next);
      } else {
        next.hidden = true;
        status.textContent = '没有更早的记录了';
      }
    } catch {
      status.textContent = '加载失败，请点击「加载更早的记录」重试。';
    } finally {
      loading = false;
      next.removeAttribute('aria-disabled');
    }
  }
  next.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    loadOlder(true);
  });
  observer?.observe(next);
})();
