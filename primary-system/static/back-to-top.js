(() => {
  'use strict';
  const button = document.querySelector('.site-back-to-top');
  const masthead = document.querySelector('.site-masthead');
  if (!button || !masthead) return;

  function updateVisibility() {
    const hidden = window.scrollY < 240;
    if (button.hidden === hidden) return;
    if (hidden && document.activeElement === button) {
      masthead.focus({preventScroll: true});
    }
    button.hidden = hidden;
  }

  button.addEventListener('click', () => {
    masthead.focus({preventScroll: true});
    // 由站点的 scroll-behavior 统一处理动效偏好。
    window.scrollTo({top: 0, left: 0});
  });
  window.addEventListener('scroll', updateVisibility, {passive: true});
  window.addEventListener('pageshow', updateVisibility);
  updateVisibility();
})();
