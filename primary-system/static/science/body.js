(() => {
  'use strict';

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
        if (index === content.answer) window.BodyStudy?.solve(content.id);
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
