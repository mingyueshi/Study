(() => {
  'use strict';
  const controls = document.querySelector('.site-scroll-tools');
  const masthead = document.querySelector('.site-masthead');
  const page = document.scrollingElement;
  if (!controls || !masthead || !page) return;

  const top = controls.querySelector('[data-page-scroll="top"]');
  const up = controls.querySelector('[data-page-scroll="up"]');
  const down = controls.querySelector('[data-page-scroll="down"]');

  function setUnavailable(button, unavailable) {
    const value = String(unavailable);
    if (button.getAttribute('aria-disabled') !== value) {
      button.setAttribute('aria-disabled', value);
    }
  }

  function updateControls() {
    const scrollable = page.scrollHeight - page.clientHeight;
    const offset = window.scrollY;
    if (scrollable <= 1 && controls.contains(document.activeElement)) {
      masthead.focus({preventScroll: true});
    }
    controls.hidden = scrollable <= 1;
    setUnavailable(top, offset <= 1);
    setUnavailable(up, offset <= 1);
    setUnavailable(down, scrollable - offset <= 1);
  }

  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-page-scroll]');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    // 由站点的 scroll-behavior 统一处理动效偏好。
    if (button === top) {
      masthead.focus({preventScroll: true});
      window.scrollTo({top: 0});
    } else {
      const direction = button === up ? -1 : 1;
      window.scrollBy({top: direction * page.clientHeight});
    }
  });

  window.addEventListener('scroll', updateControls, {passive: true});
  window.addEventListener('resize', updateControls);
  window.addEventListener('pageshow', updateControls);
  // 时间线等页面追加内容后，重新判断能否继续向下滚动。
  if ('ResizeObserver' in window) new ResizeObserver(updateControls).observe(document.body);
  updateControls();
})();
