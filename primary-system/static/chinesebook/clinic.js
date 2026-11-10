'use strict';

(() => {
  const root = document.querySelector('[data-clinic]');
  const { groups, cases } = JSON.parse(document.getElementById('clinic-data').textContent);
  const hospital = root.dataset.clinic === 'sentence';
  const groupById = new Map(groups.map(group => [group.id, group]));
  const registration = root.querySelector('[data-registration]');
  const work = root.querySelector('[data-work]');
  const finish = root.querySelector('[data-finish]');
  const steps = [...root.querySelectorAll('.clinic-steps li')];
  const prompt = work.querySelector('[data-prompt]');
  const diagnosis = work.querySelector('[data-diagnosis]');
  const question = work.querySelector('[data-question]');
  const choices = work.querySelector('[data-choices]');
  const feedback = work.querySelector('[data-feedback]');
  const review = work.querySelector('[data-review]');
  const next = work.querySelector('[data-next]');

  let queue = [];
  let index = 0;
  let firstPass = 0;
  let missed = false;

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function round(groupId) {
    if (groupId !== 'mixed') {
      return shuffle(cases.filter(item => item.cause === groupId)).slice(0, hospital ? 3 : 6);
    }
    // 混合接诊每种病因来一题，字词两种题型各来三题。
    return shuffle(groups.flatMap(group =>
      shuffle(cases.filter(item => item.cause === group.id)).slice(0, hospital ? 1 : 3)
    ));
  }

  function setStep(step) {
    steps.forEach(item => item.removeAttribute('aria-current'));
    steps[step]?.setAttribute('aria-current', 'step');
  }

  function ask(title, options, answer, hint, onCorrect) {
    question.textContent = title;
    feedback.textContent = '';
    const buttons = options.map(({ value, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'clinic-choice';
      button.textContent = label;
      button.addEventListener('click', () => {
        if (value === answer) {
          onCorrect();
        } else {
          missed = true;
          button.dataset.tried = 'true';
          feedback.textContent = '再试试。' + hint;
        }
      });
      return button;
    });
    choices.replaceChildren(...buttons);
    question.focus();
  }

  function askAnswer(item) {
    const group = groupById.get(item.cause);
    if (hospital) {
      setStep(2);
      diagnosis.textContent = '已确诊 · ' + group.name;
      diagnosis.hidden = false;
    }
    let title = '哪张处方能改通句子，又保留原意？';
    if (!hospital) {
      title = item.cause === 'shape'
        ? '把标出的「' + item.target + '」换成哪个字？'
        : '「' + item.focus + '」里的「' + item.target + '」怎么读？';
    }
    const options = shuffle(item.options).map(value => ({ value, label: value }));
    ask(title, options, item.answer, group.tip, () => showReview(item));
  }

  function renderPrompt(item) {
    prompt.textContent = item.prompt;
    if (!item.focus) return;
    const start = item.prompt.indexOf(item.focus) + item.focus.indexOf(item.target);
    const target = document.createElement('mark');
    target.textContent = item.target;
    prompt.replaceChildren(item.prompt.slice(0, start), target, item.prompt.slice(start + 1));
  }

  function showCase() {
    const item = queue[index];
    missed = false;
    setStep(1);
    review.hidden = true;
    diagnosis.hidden = true;
    work.querySelector('[data-progress]').textContent = '病例 ' + (index + 1) + ' / ' + queue.length;
    renderPrompt(item);
    if (hospital) {
      const options = groups.map(group => ({ value: group.id, label: group.name }));
      ask('这句话的病因是什么？', options, item.cause,
        '先找出句子里读着不通的地方，也可以翻翻随身手册。', () => askAnswer(item));
    } else {
      askAnswer(item);
    }
  }

  function showReview(item) {
    if (!missed) firstPass += 1;
    setStep(2);
    choices.replaceChildren();
    feedback.textContent = '';
    question.textContent = hospital ? '处方开好啦！' : '检查通过！';
    review.querySelector('[data-result]').textContent = item.result || item.answer;
    review.querySelector('[data-explanation]').textContent = item.explanation;
    const compare = review.querySelector('[data-compare]');
    compare.hidden = !item.compare;
    compare.replaceChildren();
    for (const [key, examples] of item.compare || []) {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = key;
      description.textContent = examples;
      compare.append(term, description);
    }
    next.textContent = index + 1 < queue.length ? '接诊下一位 →' : '查看值班小结 →';
    review.hidden = false;
    question.focus();
  }

  const registerButtons = registration.querySelector('[data-register-buttons]');
  registerButtons.addEventListener('click', event => {
    const button = event.target.closest('[data-register]');
    if (!button) return;
    queue = round(button.dataset.register);
    index = 0;
    firstPass = 0;
    registration.hidden = true;
    work.hidden = false;
    showCase();
  });
  registerButtons.hidden = false;

  next.addEventListener('click', () => {
    index += 1;
    if (index < queue.length) {
      showCase();
      return;
    }
    work.hidden = true;
    finish.hidden = false;
    setStep(-1);
    finish.querySelector('[data-summary]').textContent =
      '你处理了 ' + queue.length + ' 张病例，其中 ' + firstPass + ' 张一次答对。';
    finish.querySelector('[data-finish-title]').focus();
  });

  finish.querySelector('[data-restart]').addEventListener('click', () => {
    finish.hidden = true;
    registration.hidden = false;
    setStep(0);
    registration.querySelector('h2').focus();
  });
})();
