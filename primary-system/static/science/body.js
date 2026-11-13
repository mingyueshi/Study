(() => {
  'use strict';

  const demo = document.querySelector('[data-body-demo]');
  if (demo) {
    const buttons = [...demo.querySelectorAll('[data-demo-step]')];
    const notes = [...demo.querySelectorAll('[data-demo-note]')];
    const angle = demo.querySelector('[data-arm-angle]');
    let stepIndex = 0;

    function showStep(index) {
      stepIndex = index;
      const state = buttons[index].dataset.demoStep;
      demo.dataset.state = state;
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      notes.forEach((note, i) => { note.hidden = i !== index; });

      if (demo.dataset.bodyDemo === 'digestion') {
        const organ = demo.querySelector('[data-food-organ="' + state + '"]');
        demo.querySelector('.body-food-dot').setAttribute('transform',
          'translate(' + organ.dataset.foodX + ' ' + organ.dataset.foodY + ')');
      }
      if (demo.dataset.bodyDemo === 'breathing') {
        demo.querySelector('.body-diaphragm').setAttribute('d',
          state === 'inhale' ? 'M128 345Q236 317 344 345' : 'M128 323Q236 220 344 323');
      }
    }

    function updateArm(value) {
      const radians = value * Math.PI / 180;
      const x = 227 + 8 * Math.cos(radians) + 30 * Math.sin(radians);
      const y = 270 - 8 * Math.sin(radians) + 30 * Math.cos(radians);
      const width = 16 + value / 8;
      const middle = (112 + y - 20) / 2;
      demo.querySelector('.body-forearm').setAttribute('transform', 'rotate(' + -value + ' 227 270)');
      demo.querySelector('.body-biceps').setAttribute('d',
        'M247 112Q' + (247 + width) + ' ' + middle + ' ' + x + ' ' + (y - 20) +
        'Q' + (247 - width) + ' ' + middle + ' 247 112Z');
      demo.querySelector('.body-biceps-tendon').setAttribute('d',
        'M' + x + ' ' + (y - 20) + 'L' + x + ' ' + y);
      demo.querySelector('.body-triceps').setAttribute('d',
        'M207 105Q' + (160 + value / 6) + ' 175 202 256Q' + (229 - value / 10) + ' 191 207 105Z');
      demo.querySelector('.body-tendon-leader').setAttribute('d', 'M88 359H162L' + x + ' ' + (y - 8));
      showStep(value >= 60 ? 1 : 0);
      angle.setAttribute('aria-valuetext', Math.round(value / 120 * 100) + '％');
    }

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (angle) {
          angle.value = index === 0 ? 0 : 110;
          updateArm(Number(angle.value));
        } else showStep(index);
      });
    });
    demo.querySelector('[data-demo-next]')?.addEventListener('click',
      () => showStep((stepIndex + 1) % buttons.length));
    angle?.addEventListener('input', () => updateArm(Number(angle.value)));
    if (angle) updateArm(Number(angle.value));
    else showStep(0);
    demo.querySelector('.body-demo-controls').hidden = false;
  }

  const heart = document.querySelector('[data-heart]');
  if (heart) {
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
      heart.dataset.phase = flow.dataset.phase;
      all.setAttribute('aria-pressed', String(index < 0));
      choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      notes.forEach((note, i) => { note.hidden = index >= 0 && i !== index; });
    }

    function stopPlayback() {
      clearInterval(playback);
      playback = null;
      delete flow.dataset.playing;
      delete heart.dataset.playing;
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
      heart.dataset.playing = '';
      play.textContent = '暂停播放';
      if (current < 0) showPhase(0);
      playback = setInterval(() => showPhase((current + 1) % choices.length), 2600);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && playback !== null) stopPlayback();
    });
    showPhase(-1);
    heart.querySelector('[data-heart-controls]').hidden = false;
  }

  const viewer = document.getElementById('body-media-dialog');
  if (viewer && typeof viewer.showModal === 'function') {
    document.querySelectorAll('[data-body-photo]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        const card = link.closest('figure');
        const photo = link.querySelector('img');
        const large = viewer.querySelector('[data-large-photo]');
        large.src = link.href;
        large.alt = photo.alt;
        viewer.querySelector('h2').textContent = card.querySelector('h3').textContent;
        viewer.querySelector('[data-large-caption]').textContent = card.querySelector('.body-media-description').textContent;
        viewer.showModal();
      });
    });
  }

  document.querySelectorAll('[data-body-question]').forEach(question => {
    const content = JSON.parse(question.querySelector('script[type="application/json"]').textContent);
    const options = [...question.querySelectorAll('[data-check-option]')];
    const feedback = question.querySelector('.body-check-feedback');
    question.querySelector('.body-check-options').hidden = false;
    question.querySelector('.body-check-answer').hidden = true;
    options.forEach((button, index) => {
      button.addEventListener('click', () => {
        options.forEach((option, i) => {
          option.setAttribute('aria-pressed', String(i === index));
          option.dataset.correct = String(i === content.answer);
        });
        feedback.hidden = false;
        feedback.textContent = (index === content.answer ? '答对了！' : '再看一眼。') + content.explanation;
        feedback.dataset.correct = String(index === content.answer);
      });
    });
  });

  const reaction = document.querySelector('[data-body-reaction]');
  if (reaction) {
    const copy = JSON.parse(document.getElementById('body-reaction-copy').textContent);
    const button = reaction.querySelector('[data-reaction-button]');
    const result = reaction.querySelector('[data-reaction-result]');
    let waiting = null;
    let appearedAt = 0;

    button.addEventListener('click', () => {
      const state = reaction.dataset.state;
      if (state === 'waiting') {
        clearTimeout(waiting);
        reaction.dataset.state = 'done';
        button.textContent = copy.again;
        result.textContent = copy.early;
      } else if (state === 'ready') {
        const elapsed = Math.round(performance.now() - appearedAt);
        reaction.dataset.state = 'done';
        button.textContent = copy.again;
        result.textContent = copy.result + ' ' + elapsed + ' ' + copy.unit + '。';
      } else {
        reaction.dataset.state = 'waiting';
        result.textContent = '';
        button.textContent = copy.waiting;
        waiting = setTimeout(() => {
          appearedAt = performance.now();
          reaction.dataset.state = 'ready';
          button.textContent = copy.go;
        }, 1500 + Math.random() * 2500);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && ['waiting', 'ready'].includes(reaction.dataset.state)) {
        clearTimeout(waiting);
        reaction.dataset.state = 'idle';
        button.textContent = copy.start;
        result.textContent = copy.interrupted;
      }
    });
    reaction.hidden = false;
  }

  const timer = document.querySelector('[data-pulse-timer]');
  if (!timer) return;
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
