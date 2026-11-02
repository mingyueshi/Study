/* 共用阅读主题：先于样式应用，避免打开页面时闪烁。 */
(function () {
  'use strict';
  const key = 'personal_learning_theme_v1';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'dark' || value === 'light';
  const script = document.currentScript;
  const systemRoot = script ? new URL('../', script.src).pathname : '';
  let preference = null;
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch (e) { /* 当前页面仍可切换 */ }
  if (location.protocol === 'file:') {
    const incoming = new URLSearchParams(location.search).get('theme');
    if (valid(incoming)) {
      preference = incoming;
      try { localStorage.setItem(key, incoming); } catch (e) { /* 当前页面仍可切换 */ }
    }
  }
  function apply() {
    const dark = (preference || (media.matches ? 'dark' : 'light')) === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      const label = dark ? '切换为亮色主题' : '切换为暗色主题';
      button.setAttribute('aria-label', label);
      button.title = label;
      button.querySelector('[data-theme-icon]').textContent = dark ? '☀' : '☾';
      button.querySelector('[data-theme-label]').textContent = dark ? '亮色' : '暗色';
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#141b20' : '#f4f3ef';
  }
  function set(value) {
    if (!valid(value)) return;
    preference = value;
    try { localStorage.setItem(key, value); } catch (e) { /* 当前页面仍可切换 */ }
    apply();
  }
  apply();
  document.addEventListener('DOMContentLoaded', apply);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-theme-toggle]')) {
      set(root.dataset.theme === 'dark' ? 'light' : 'dark');
      return;
    }
    // file 页面可能各有一份本机存储；只在本系统跨页导航时带上主题。
    const link = event.target.closest('a[href]');
    if (location.protocol !== 'file:' || !link || !systemRoot) return;
    const target = new URL(link.href, location.href);
    if (target.protocol === 'file:' && target.pathname.startsWith(systemRoot) && target.pathname !== location.pathname) {
      target.searchParams.set('theme', root.dataset.theme);
      link.href = target.href;
    }
  });
  media.addEventListener('change', () => { if (!preference) apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    apply();
  });
  window.addEventListener('pageshow', () => {
    try { const saved = localStorage.getItem(key); preference = valid(saved) ? saved : preference; } catch (e) { /* 保留当前选择 */ }
    apply();
  });
  window.LearningTheme = { key, set, get current() { return root.dataset.theme; } };
})();
