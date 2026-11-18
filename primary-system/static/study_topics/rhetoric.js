(() => {
  'use strict';
  document.querySelectorAll('[data-rhetoric-quiz]').forEach(form => {
    const feedback = form.querySelector('[data-rhetoric-feedback]');
    const answer = form.closest('[data-rhetoric-case]').querySelector('.rhetoric-reason');

    form.addEventListener('submit', event => {
      event.preventDefault();
      const selected = form.querySelector('input:checked');
      if (!selected) {
        feedback.textContent = '请先选一项，再检查判断。';
        form.querySelector('input').focus();
        return;
      }
      const correct = selected.value === form.dataset.answer;
      feedback.dataset.result = correct ? 'correct' : 'retry';
      feedback.textContent = selected.dataset.feedback;
      if (correct) answer.open = true;
    });

    form.addEventListener('change', () => {
      feedback.textContent = '';
      delete feedback.dataset.result;
    });
    form.hidden = false;
  });
})();
