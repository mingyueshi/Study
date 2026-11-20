(() => {
  'use strict';
  const challenge = document.getElementById('challenge');
  const form = challenge.querySelector('[data-reasoning-form]');
  const fallback = challenge.querySelector('[data-reasoning-fallback]');
  const feedback = fallback.querySelectorAll('.mystery-feedback');
  const result = form.querySelector('.mystery-reasoning-result');
  const retry = form.querySelector('button[type="reset"]');
  const clues = challenge.querySelectorAll('.mystery-reasoning-clue');

  form.addEventListener('submit', event => {
    event.preventDefault();
    const choice = feedback[form.elements.judgment.value];
    if (!choice) return;
    result.replaceChildren(choice.cloneNode(true));
    retry.hidden = false;
  });

  form.addEventListener('change', () => result.replaceChildren());
  form.addEventListener('reset', () => {
    result.replaceChildren();
    retry.hidden = true;
    clues.forEach(clue => { clue.open = false; });
    clues[0].querySelector('summary').focus();
  });

  fallback.hidden = true;
  form.hidden = false;
})();
