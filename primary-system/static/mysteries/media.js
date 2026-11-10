document.querySelectorAll('[data-mystery-animation]').forEach((figure) => {
  const image = figure.querySelector('[data-animation-src]');
  const button = figure.querySelector('[data-animation-toggle]');
  const still = image.getAttribute('src');
  let playing = false;

  button.addEventListener('click', () => {
    playing = !playing;
    image.src = playing ? image.dataset.animationSrc : still;
    button.textContent = playing ? '停止动图' : '播放动图';
  });
  button.hidden = false;
});

document.querySelectorAll('[data-mystery-diagram]').forEach((figure) => {
  const controls = figure.querySelector('.mystery-diagram-buttons');
  const buttons = [...controls.querySelectorAll('button')];
  const pins = figure.querySelectorAll('.mystery-diagram-pin');
  const notes = figure.querySelectorAll('.mystery-diagram-note');

  function showStep(selected) {
    buttons.forEach((button, index) => {
      const active = index === selected;
      button.setAttribute('aria-pressed', String(active));
      pins[index].toggleAttribute('data-current', active);
      notes[index].hidden = !active;
    });
  }

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => showStep(index));
  });
  showStep(0);
  controls.hidden = false;
});
