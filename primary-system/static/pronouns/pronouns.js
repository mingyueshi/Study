'use strict';

(() => {
  const topic = document.querySelector('[data-pronouns]');
  if (!topic) return;

  let playing = null;

  topic.addEventListener('click', (event) => {
    const button = event.target.closest('[data-pronoun-say]');
    if (button) {
      const feedback = button.closest('.pronoun-word, .pronoun-answer').querySelector('[data-pronoun-audio]');
      if (playing) playing.button.removeAttribute('data-playing');

      const playback = {button};
      playing = playback;
      feedback.textContent = '';
      button.setAttribute('data-playing', '');

      const finish = (message = '') => {
        if (playing !== playback) return;
        button.removeAttribute('data-playing');
        feedback.textContent = message;
        playing = null;
      };
      const unavailable = '暂时无法点读，请检查设备是否有可用的英语语音。';
      if (!window.SpeechKit) {
        finish(unavailable);
        return;
      }
      window.SpeechKit.speak(button.dataset.pronounSay, {
        lang: 'en-US',
        rate: 0.82,
        onend: () => finish(),
        onerror: ({error}) => finish(['canceled', 'interrupted'].includes(error) ? '' : unavailable),
      });
      return;
    }

    const option = event.target.closest('[data-pronoun-option]');
    if (!option) return;

    const question = option.closest('[data-pronoun-question]');
    const correct = option.textContent === question.dataset.answer;
    question.querySelectorAll('[data-pronoun-option]').forEach((choice) => {
      choice.setAttribute('aria-pressed', String(choice === option));
    });
    question.dataset.result = correct ? 'correct' : 'retry';
    question.querySelector('[data-pronoun-feedback]').textContent = correct ? '答对了！' : '再试一次。';
    question.querySelector('[data-pronoun-answer]').hidden = !correct;
  });

  window.addEventListener('pagehide', () => {
    if (!playing) return;
    playing.button.removeAttribute('data-playing');
    playing = null;
    window.speechSynthesis?.cancel();
  });
})();
