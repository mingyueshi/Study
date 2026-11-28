'use strict';

(() => {
  const lab = document.querySelector('[data-sentence-lab]');
  if (!lab) return;

  const controls = lab.querySelector('.lab-controls');
  const scenes = lab.querySelectorAll('[data-lab-example]');
  const comparisons = lab.querySelectorAll('[data-lab-comparison]');
  const announcement = lab.querySelector('[data-lab-live]');
  let playback = 0;

  controls.querySelector('[data-lab-apply]').hidden = true;
  controls.addEventListener('change', () => {
    const choices = new FormData(controls);
    const example = choices.get('example');
    const mode = choices.get('mode');
    playback += 1;
    window.TTS?.stopSequence();

    for (const scene of scenes) {
      scene.hidden = scene.dataset.labExample !== example;
      for (const panel of scene.querySelectorAll('[data-lab-mode]')) {
        panel.hidden = panel.dataset.labMode !== mode;
        if (!scene.hidden && !panel.hidden) {
          announcement.textContent = panel.querySelector('[data-lab-announcement]').textContent.trim();
        }
      }
    }
    for (const comparison of comparisons) {
      comparison.hidden = comparison.dataset.labComparison !== example;
      for (const row of comparison.querySelectorAll('[data-lab-row]')) {
        if (row.dataset.labRow === mode) row.setAttribute('aria-current', 'true');
        else row.removeAttribute('aria-current');
      }
    }
    lab.querySelectorAll('[data-lab-status]').forEach((status) => { status.textContent = ''; });

    const url = new URL(window.location.href);
    choices.forEach((value, key) => url.searchParams.set(key, value));
    window.history.replaceState(window.history.state, '', url);
  });

  lab.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lab-say]');
    if (button) {
      const status = button.closest('[data-lab-audio-group]').querySelector('[data-lab-status]');
      const id = ++playback;
      const failure = '暂时无法点读，请检查设备是否有可用的英语语音。';
      status.textContent = '';
      if (!window.TTS) {
        status.textContent = failure;
        return;
      }
      window.TTS.stopSequence();
      window.TTS.speak(button.dataset.labSay, {
        lang: 'en-US',
        rate: 0.82,
        onerror: ({error}) => {
          if (id === playback && !['canceled', 'interrupted'].includes(error)) status.textContent = failure;
        },
      });
      return;
    }

    const option = event.target.closest('[data-lab-option]');
    if (!option) return;
    const question = option.closest('[data-lab-question]');
    const correct = option.textContent === question.dataset.answer;
    for (const choice of question.querySelectorAll('[data-lab-option]')) {
      choice.setAttribute('aria-pressed', String(choice === option));
    }
    question.dataset.result = correct ? 'correct' : 'retry';
    question.querySelector('[data-lab-feedback]').textContent = correct ? '答对了！' : '再试一次。';
    question.querySelector('[data-lab-answer]').hidden = !correct;
  });
})();
