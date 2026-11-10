(() => {
  'use strict';

  document.querySelectorAll('[data-question]').forEach(question => {
    const form = question.querySelector('[data-quiz]');
    const feedback = form.querySelector('[role="status"]');
    const hint = question.querySelector('[data-hint]').textContent;
    const explanation = question.querySelector('[data-explanation]').textContent;

    form.addEventListener('submit', event => {
      event.preventDefault();
      const choice = new FormData(form).get('choice');
      const correct = choice === form.dataset.answer;
      feedback.dataset.result = correct ? 'correct' : 'retry';
      feedback.textContent = correct ? `对啦！${explanation}` : `再试一次。${hint}`;
    });
    form.addEventListener('change', () => {
      feedback.textContent = '';
      delete feedback.dataset.result;
    });
    form.hidden = false;
  });

  const studio = document.querySelector('[data-studio]');
  const editor = studio.querySelector('[data-editor]');
  const door = studio.querySelector('[data-door-preview]');
  const upper = editor.querySelector('[data-ink="upper"]');
  const lower = editor.querySelector('[data-ink="lower"]');
  const banner = editor.querySelector('[data-ink="banner"]');
  const counts = editor.querySelector('[data-counts]');
  const upperPaper = door.querySelector('[data-paper="upper"]');
  const lowerPaper = door.querySelector('[data-paper="lower"]');
  const bannerPaper = door.querySelector('[data-paper="banner"]');
  const caption = door.querySelector('[data-door-caption]');
  const clear = editor.querySelector('[data-clear]');
  const lineLimit = 12;
  const bannerLimit = 6;

  function characters(input) {
    return input.value.match(/[\p{Unified_Ideograph}〇]/gu) || [];
  }

  function updatePaper() {
    const upperChars = characters(upper);
    const lowerChars = characters(lower);
    const bannerChars = characters(banner);

    upperPaper.textContent = upperChars.slice(0, lineLimit).join('') || '等你来写';
    lowerPaper.textContent = lowerChars.slice(0, lineLimit).join('') || '等你来写';
    bannerPaper.replaceChildren(...bannerChars.slice(0, bannerLimit).map(character => {
      const tile = document.createElement('span');
      tile.textContent = character;
      return tile;
    }));

    let note = '';
    if (upperChars.length > lineLimit || lowerChars.length > lineLimit || bannerChars.length > bannerLimit) {
      note = '。多出的字暂时没有排上红纸。';
    } else if (upperChars.length && lowerChars.length) {
      note = upperChars.length === lowerChars.length ? '。两边字数对齐了！' : '。两边字数还没对齐。';
    }
    const message = `上联 ${upperChars.length} 字 · 下联 ${lowerChars.length} 字${note}`;
    if (counts.textContent !== message) counts.textContent = message;
    clear.disabled = !upper.value && !lower.value && !banner.value;
  }

  function updateDirection() {
    const direction = editor.querySelector('[name="direction"]:checked').value;
    door.dataset.direction = direction;
    caption.textContent = direction === 'right' ? '面对门看 · 横批从右往左读' : '面对门看 · 横批从左往右读';
  }

  editor.addEventListener('input', event => {
    if (event.target.hasAttribute('data-ink')) updatePaper();
  });
  editor.addEventListener('change', event => {
    if (event.target.name === 'direction') updateDirection();
  });
  clear.addEventListener('click', () => {
    upper.value = '';
    lower.value = '';
    banner.value = '';
    updatePaper();
    upper.focus();
  });
  editor.hidden = false;
  updatePaper();
  updateDirection();
})();
