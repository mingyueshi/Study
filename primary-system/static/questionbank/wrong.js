// 浏览器后退可能恢复重练前的页面，重新读取最近一次作答。
window.addEventListener('pageshow', (event) => {
  if (event.persisted) window.location.reload();
});
