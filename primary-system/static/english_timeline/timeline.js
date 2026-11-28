'use strict';

(() => {
  const timeline = document.querySelector('[data-english-timeline]');
  if (!timeline) return;

  const form = timeline.querySelector('.timeline-controls');
  const examples = JSON.parse(document.getElementById('english-timeline-examples').textContent);
  const current = timeline.querySelector('[data-timeline-current]');
  const will = timeline.querySelector('[data-timeline-will]');
  const compare = timeline.querySelectorAll('[data-compare-time]');
  const cues = timeline.querySelectorAll('[data-time-cue]');
  let playback = 0;

  function showExample(panel, example) {
    panel.querySelectorAll('[data-timeline-text]').forEach((node) => {
      const value = example[node.dataset.timelineText];
      node.textContent = value;
      if (node.dataset.timelineText === 'past_note') node.hidden = !value;
    });
    panel.querySelectorAll('[data-timeline-audio]').forEach((button) => {
      const sentence = button.dataset.timelineAudio === 'speech';
      button.dataset.timelineSpeak = example[button.dataset.timelineAudio];
      button.setAttribute('aria-label', sentence ? '听整句 ' + example.en : '朗读动词 ' + example.word);
    });
    panel.querySelector('[data-timeline-status]').textContent = '';
  }

  form.querySelector('[data-timeline-apply]').hidden = true;
  form.addEventListener('change', () => {
    const state = new FormData(form);
    const moment = state.get('moment');
    const action = examples[state.get('action')][state.get('person')];

    playback += 1;
    window.TTS?.stopSequence();
    showExample(current, action[moment]);
    showExample(will, action.will);
    will.hidden = moment !== 'plan';
    cues.forEach((cue) => { cue.textContent = action[cue.dataset.timeCue].cue; });
    compare.forEach((row) => {
      const id = row.dataset.compareTime;
      showExample(row, action[id]);
      if (id === moment) row.setAttribute('aria-current', 'true');
      else row.removeAttribute('aria-current');
    });

    const url = new URL(window.location.href);
    state.forEach((value, key) => url.searchParams.set(key, value));
    window.history.replaceState(null, '', url);
  });

  timeline.addEventListener('click', (event) => {
    const button = event.target.closest('[data-timeline-speak]');
    if (button) {
      const status = button.closest('[data-timeline-audio-group]').querySelector('[data-timeline-status]');
      const id = ++playback;
      const failure = '暂时无法点读，请检查设备是否有可用的英语语音。';
      status.textContent = '';
      if (!window.TTS) {
        status.textContent = failure;
        return;
      }
      window.TTS.stopSequence();
      window.TTS.speak(button.dataset.timelineSpeak, {
        lang: 'en-US',
        rate: 0.82,
        onerror: ({error}) => {
          if (id === playback && !['canceled', 'interrupted'].includes(error)) status.textContent = failure;
        },
      });
      return;
    }

    const option = event.target.closest('[data-timeline-option]');
    if (!option) return;
    const question = option.closest('[data-timeline-question]');
    const correct = option.textContent === question.dataset.answer;
    question.querySelectorAll('[data-timeline-option]').forEach((choice) => {
      choice.setAttribute('aria-pressed', String(choice === option));
    });
    question.dataset.result = correct ? 'correct' : 'retry';
    question.querySelector('[data-timeline-feedback]').textContent = correct ? '答对了！' : '再试一次。';
    question.querySelector('[data-timeline-solution]').hidden = !correct;
  });
})();
