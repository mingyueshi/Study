/* 密码可见性只作用于当前输入框，不保存输入内容。 */
(() => {
  'use strict';
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    if (!input || input.type !== 'password') return;
    button.hidden = false;
    button.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = visible ? '隐藏' : '显示';
      button.setAttribute('aria-pressed', String(visible));
      button.setAttribute('aria-label', (visible ? '隐藏' : '显示') + button.dataset.passwordLabel);
    });
  });
})();
