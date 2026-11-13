/* Nova 模板扩展的数据层：只请求本站已授权的聚合统计。 */
(() => {
  'use strict';
  const root = document.getElementById('study-dashboard');
  if (!root) return;
  const form = document.getElementById('study-dashboard-filter');
  const content = document.getElementById('study-dashboard-content');
  const status = document.getElementById('study-refresh-status');
  const button = form.querySelector('button');
  let charts = [];
  let pending = false;

  function destroyCharts() {
    charts.forEach(chart => chart.destroy());
    charts = [];
  }

  function renderCharts() {
    destroyCharts();
    if (!window.Chart) return; // 本地资源不可用时保留完整数据表。
    const data = JSON.parse(document.getElementById('study-dashboard-charts').textContent);
    const style = getComputedStyle(root);
    const ink = style.getPropertyValue('--body-fg').trim() || '#1f2937';
    const grid = style.getPropertyValue('--hairline-color').trim() || '#d9e0e8';
    const colors = ['#4f7cf7', '#ed8b35', '#1ba888', '#b16ddb'];
    data.forEach(spec => {
      const canvas = document.getElementById(`study-chart-${spec.key}`);
      if (!canvas) return;
      canvas.parentElement.hidden = false;
      try {
        const round = spec.type === 'doughnut';
        const chart = new Chart(canvas, {
          type: spec.type,
          data: {
            labels: spec.labels,
            datasets: spec.series.map((series, i) => ({
              label: series.label, data: series.data,
              backgroundColor: round ? colors : colors[i % colors.length],
              borderColor: round ? 'transparent' : colors[i % colors.length],
              borderWidth: spec.type === 'line' ? 2 : 0,
              pointRadius: spec.labels.length > 35 ? 0 : 2,
              tension: 0.15,
            })),
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            color: ink,
            plugins: { legend: { display: round || spec.series.length > 1, labels: { color: ink, usePointStyle: true, padding: 18 } } },
            scales: round ? {} : {
              x: { grid: { display: false }, ticks: { color: ink, maxTicksLimit: 8, maxRotation: 0 } },
              y: { beginAtZero: true, ticks: { color: ink, precision: 0 }, grid: { color: grid } },
            },
          },
        });
        charts.push(chart);
        canvas.closest('.study-chart').querySelector('details').open = false;
      } catch (_) {
        canvas.parentElement.hidden = true;
      }
    });
  }

  async function refresh() {
    if (pending) return;
    pending = true;
    button.disabled = true;
    form.elements.period.disabled = true;
    root.setAttribute('aria-busy', 'true');
    status.textContent = '正在更新数据…';
    const url = new URL(root.dataset.endpoint, location.href);
    url.searchParams.set('period', form.elements.period.value);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('unavailable');
      const data = await response.json();
      const expanded = new Set([...content.querySelectorAll('.study-chart-table[open]')].map(table => table.dataset.chart));
      const focused = document.activeElement?.closest('.study-chart-table')?.dataset.chart;
      destroyCharts();
      content.innerHTML = data.html;
      form.elements.period.value = String(data.period);
      renderCharts();
      content.querySelectorAll('.study-chart-table').forEach(table => {
        if (expanded.has(table.dataset.chart)) table.open = true;
        if (focused === table.dataset.chart) table.querySelector('summary').focus();
      });
      status.textContent = `更新于 ${data.updated_at} · 每分钟自动刷新`;
      const current = new URL(location.href);
      current.searchParams.set('period', data.period);
      history.replaceState(null, '', current);
    } catch (_) {
      status.textContent = '更新未完成，已保留上次数据。请重试；登录过期时请重新登录。';
    } finally {
      clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      form.elements.period.disabled = false;
      root.removeAttribute('aria-busy');
    }
  }

  renderCharts();
  form.addEventListener('submit', event => { event.preventDefault(); refresh(); });
  form.elements.period.addEventListener('change', refresh);
  let timer;
  function scheduleRefresh() {
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) refresh(); }, 60000);
  }
  scheduleRefresh();
  window.addEventListener('pageshow', scheduleRefresh);
  window.addEventListener('pagehide', () => clearInterval(timer));
  new MutationObserver(() => renderCharts()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
