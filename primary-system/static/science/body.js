(() => {
  'use strict';

  const heart = document.querySelector('[data-heart]');
  const flow = heart.querySelector('.body-flow');
  const choices = [...heart.querySelectorAll('[data-phase-choice]')];
  const notes = [...heart.querySelectorAll('[data-phase-note]')];
  const noteList = heart.querySelector('.body-phase-notes');
  const play = heart.querySelector('[data-heart-play]');
  const all = heart.querySelector('[data-heart-all]');
  let current = -1;
  let playback = null;

  for (const route of flow.querySelectorAll('.flow-route')) {
    const particle = route.cloneNode();
    particle.classList.add('flow-particle');
    particle.setAttribute('pathLength', '100');
    particle.removeAttribute('marker-end');
    route.after(particle);
  }

  function showPhase(index) {
    current = index;
    flow.dataset.phase = choices[index]?.dataset.phaseChoice ?? 'all';
    all.setAttribute('aria-pressed', String(index < 0));
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    notes.forEach((note, i) => { note.hidden = index >= 0 && i !== index; });
  }

  function stopPlayback() {
    clearInterval(playback);
    playback = null;
    delete flow.dataset.playing;
    noteList.setAttribute('aria-live', 'polite');
    play.textContent = '连续播放';
  }

  choices.forEach((button, index) => {
    button.addEventListener('click', () => {
      stopPlayback();
      showPhase(index);
    });
  });
  all.addEventListener('click', () => {
    stopPlayback();
    showPhase(-1);
  });
  play.addEventListener('click', () => {
    if (playback !== null) {
      stopPlayback();
      return;
    }
    noteList.setAttribute('aria-live', 'off');
    flow.dataset.playing = '';
    play.textContent = '暂停播放';
    if (current < 0) showPhase(0);
    playback = setInterval(() => showPhase((current + 1) % choices.length), 2600);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playback !== null) stopPlayback();
  });
  showPhase(-1);
  heart.querySelector('[data-heart-controls]').hidden = false;

  const timer = document.querySelector('[data-pulse-timer]');
  const duration = Number(timer.dataset.seconds);
  const clock = timer.querySelector('[data-pulse-time]');
  const start = timer.querySelector('[data-pulse-start]');
  const reset = timer.querySelector('[data-pulse-reset]');
  const status = timer.querySelector('[data-pulse-status]');
  let countdown = null;

  function stopTimer() {
    clearInterval(countdown);
    countdown = null;
    start.disabled = false;
  }

  start.addEventListener('click', () => {
    const deadline = performance.now() + duration * 1000;
    clock.textContent = duration;
    start.disabled = true;
    status.textContent = '开始数脉搏。';
    countdown = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      if (clock.textContent !== String(remaining)) clock.textContent = remaining;
      if (remaining === 0) {
        stopTimer();
        status.textContent = '时间到，把数到的次数填进记录。';
      }
    }, 100);
  });
  reset.addEventListener('click', () => {
    stopTimer();
    clock.textContent = duration;
    status.textContent = '计时器已重置。';
  });
  timer.hidden = false;

  const records = document.querySelector('[data-pulse-records]');
  const resting = records.querySelector('[data-pulse-rest]');
  const active = records.querySelector('[data-pulse-active]');
  const result = records.querySelector('[data-pulse-result]');

  records.addEventListener('input', () => {
    if ([resting, active].some(input => input.validity.badInput || (input.value && !input.validity.valid))) {
      result.textContent = '请填写数到的正整数次数。';
      return;
    }
    const toRate = 60 / duration;
    const restRate = resting.value ? resting.valueAsNumber * toRate : null;
    const activeRate = active.value ? active.valueAsNumber * toRate : null;
    const messages = [];
    if (restRate !== null) messages.push(`静坐时约每分钟 ${restRate} 次。`);
    if (activeRate !== null) messages.push(`活动后约每分钟 ${activeRate} 次。`);
    if (restRate !== null && activeRate !== null) {
      const difference = activeRate - restRate;
      if (difference === 0) messages.push('两次一样多。');
      else messages.push(`活动后每分钟约${difference > 0 ? '多' : '少'} ${Math.abs(difference)} 次。`);
    }
    result.textContent = messages.join('');
  });
  records.hidden = false;
})();
