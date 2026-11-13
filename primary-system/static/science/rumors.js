(() => {
  const storageKey = 'primary.science-rumors.v1.';
  const progress = document.querySelector('.rumor-progress');

  if (progress) {
    const cards = document.querySelectorAll('[data-rumor-card]');
    const count = progress.querySelector('[data-completed-count]');
    const bar = progress.querySelector('progress');
    const slugs = JSON.parse(document.querySelector('#rumor-all-slugs').textContent);

    window.addEventListener('pageshow', () => {
      try {
        for (const card of cards) {
          const done = localStorage.getItem(storageKey + card.dataset.rumorCard) === '1';
          card.querySelector('.rumor-done').hidden = !done;
        }
        const completed = slugs.filter(slug => localStorage.getItem(storageKey + slug) === '1').length;
        count.textContent = completed;
        bar.value = completed;
      } catch {
        progress.hidden = true;
        return;
      }
      progress.hidden = false;
    });
  }

  const form = document.querySelector('[data-rumor]');
  if (!form) return;

  const answer = document.querySelector('#rumor-answer');
  const feedback = form.querySelector('.rumor-feedback');
  const hint = form.querySelector('#rumor-hint').content.textContent.trim();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const verdict = new FormData(form).get('verdict');
    if (verdict !== form.dataset.verdict) {
      feedback.textContent = `再看看证据。${hint}`;
      feedback.dataset.state = 'retry';
      return;
    }

    feedback.textContent = '判断正确！查证结论已展开。';
    feedback.dataset.state = 'correct';
    answer.hidden = false;
    answer.open = true;
    try {
      localStorage.setItem(storageKey + form.dataset.rumor, '1');
    } catch {
      // 浏览器禁用本地存储时，仍可作答并查看结论。
    }
  });
  answer.hidden = true;
  form.hidden = false;
})();
