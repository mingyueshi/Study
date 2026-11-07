/* 挑战题库练习：逐题作答、服务端判分、即时反馈。
   选择/判断题内嵌数据不带答案与解析，作答 POST 到判分端点，由服务端返回
   判定、正确答案与解析后再展示；自评题的答案与思路随题内嵌，供对照自评。
   上报失败可重试，不打扰答题。 */
'use strict';

(() => {
  const board = document.querySelector('[data-qb-practice]');
  if (!board) return;
  const questions = JSON.parse(document.getElementById('qb-questions').textContent || '[]');
  if (!questions.length) return;
  const $ = (name) => board.querySelector(name);
  const questionBox = $('[data-qb-question]');
  const feedback = $('[data-qb-feedback]');
  const result = $('[data-qb-result]');

  let index = 0;
  let correctCount = 0;
  let locked = false;

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  const updateProgress = (answered = false) => {
    $('[data-qb-index]').textContent = Math.min(index + 1, questions.length);
    $('[data-qb-total]').textContent = questions.length;
    $('[data-qb-correct]').textContent = correctCount;
    const fill = $('[data-qb-progress-fill]');
    if (fill) fill.style.width = `${((index + (answered ? 1 : 0)) / questions.length) * 100}%`;
  };

  const sayChip = (text, label) => `<button class="say-chip" type="button" data-say="${escapeHtml(text)}" aria-label="${escapeHtml(label || '朗读')}">🔊</button>`;

  /* ── 每种题型自己的作答区 ─────────────────────────────────────────── */
  const renderers = {
    choice(question) {
      return `<div class="qb-options">${question.options.map((option, position) =>
        `<button class="qb-option" type="button" data-qb-option data-value="${position}" data-text="${escapeHtml(option)}">` +
        `<i class="qb-key" aria-hidden="true">${position + 1}</i><span>${escapeHtml(option)}</span></button>`).join('')}</div>`;
    },
    truefalse() {
      return `<div class="qb-boolean">
        <button class="qb-option" type="button" data-qb-option data-value="true" data-text="对">对 ✓</button>
        <button class="qb-option" type="button" data-qb-option data-value="false" data-text="错">错 ✗</button>
      </div>`;
    },
    selfcheck() {
      return `<div class="qb-selfcheck">
        <button class="button small" type="button" data-qb-reveal>看答案 👀</button>
        <span class="qb-label">先自己想一想、写一写，再对照答案。</span>
      </div>`;
    },
  };

  const givenFor = {
    choice: (value) => ({ value: Number(value) }),
    truefalse: (value) => ({ value: value === 'true' }),
    selfcheck: (value) => ({ self: value }),
  };

  /* ── 渲染 ─────────────────────────────────────────────────────────── */
  const showQuestion = () => {
    locked = false;
    feedback.hidden = true;
    feedback.classList.remove('good', 'bad');
    const question = questions[index];
    const tags = (question.tags || []).map((tag) => `<span class="qb-tag">${escapeHtml(tag)}</span>`).join('');
    /* 朗读只给英语题：读引号里的单词本身，不读整句题干。 */
    let readButton = '';
    if (question.area === 'english') {
      const word = (question.stem.match(/「([^」]+)」/) || [])[1];
      if (word) readButton = sayChip(word, `朗读单词 ${word}`);
    }
    questionBox.innerHTML = `
      <div class="qb-tag-row">${tags}</div>
      <p class="qb-stem">${escapeHtml(question.stem)}${readButton}</p>
      ${renderers[question.type](question)}`;
    updateProgress();
    const focusTarget = questionBox.querySelector('[data-qb-option], [data-qb-reveal]');
    if (focusTarget) focusTarget.focus();
  };

  /* ── 提交与反馈 ───────────────────────────────────────────────────── */
  const submit = async (given) => {
    if (locked) return;
    locked = true;
    const question = questions[index];
    const response = await fetch(board.dataset.answerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() },
      body: JSON.stringify({ uuid: question.uuid, given }),
    }).catch(() => null);
    if (!response || !response.ok) {
      locked = false;
      showFeedback({
        correct: false, retry: true, given,
        head: '上报没成功，稍等片刻点重试。',
        reveal: '', explanation: '', steps: '',
      });
      return;
    }
    const verdict = await response.json();
    if (verdict.correct) correctCount += 1;
    markChoices(question, given, verdict);
    updateProgress(true);
    showFeedback({
      correct: verdict.correct, given,
      head: verdict.correct ? `${correctCount >= 3 ? correctCount + ' 连对，' : ''}答对了！` : '再想一想～',
      reveal: verdict.reveal || '',
      explanation: verdict.explanation || '',
      steps: verdict.steps || '',
    });
  };

  const showFeedback = ({ correct, head, reveal, explanation, steps, retry, given }) => {
    feedback.classList.toggle('good', Boolean(correct));
    feedback.classList.toggle('bad', !correct);
    feedback.querySelector('[data-qb-feedback-head]').textContent = head;
    feedback.querySelector('[data-qb-feedback-answer]').textContent = reveal ? `正确答案：${reveal}` : '';
    feedback.querySelector('[data-qb-feedback-explain]').textContent = explanation;
    feedback.querySelector('[data-qb-feedback-steps]').textContent = steps;
    const actions = feedback.querySelector('.qb-feedback-actions');
    if (retry) {
      actions.innerHTML = '<button class="button small" type="button" data-qb-retry>重试 ↻</button>';
      actions.querySelector('[data-qb-retry]').addEventListener('click', () => submit(given));
    } else {
      const last = index === questions.length - 1;
      actions.innerHTML = `<button class="button small" type="button" data-qb-next>${last ? '看结果 🏁' : '下一题 →'}</button>`;
      actions.querySelector('[data-qb-next]').addEventListener('click', next);
    }
    feedback.hidden = false;
    actions.querySelector('button').focus();
  };

  const markChoices = (question, given, verdict) => {
    const buttons = questionBox.querySelectorAll('[data-qb-option]');
    if (question.type === 'truefalse') {
      const answerIsTrue = verdict.reveal === '对';
      buttons.forEach((button) => {
        button.disabled = true;
        const value = button.dataset.value === 'true';
        if (value === answerIsTrue) button.classList.add('right');
        if (value === given.value && !verdict.correct) button.classList.add('wrong');
      });
    } else {
      buttons.forEach((button) => {
        button.disabled = true;
        if (button.dataset.text === verdict.reveal) button.classList.add('right');
        if (question.type === 'choice' && Number(button.dataset.value) === given.value && !verdict.correct) {
          button.classList.add('wrong');
        }
      });
    }
  };

  const next = () => {
    if (index === questions.length - 1) return finish();
    index += 1;
    showQuestion();
  };

  const finish = () => {
    questionBox.hidden = true;
    feedback.hidden = true;
    $('[data-qb-final-correct]').textContent = correctCount;
    $('[data-qb-final-total]').textContent = questions.length;
    const ratio = correctCount / questions.length;
    const stars = ratio >= 1 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0;
    const starsBox = $('[data-qb-stars]');
    starsBox.innerHTML = [0, 1, 2].map((i) => `<span class="qb-star${i < stars ? ' on' : ''}">★</span>`).join('');
    starsBox.setAttribute('aria-label', `获得 ${stars} 颗星（满分 3 颗）`);
    starsBox.hidden = false;
    $('[data-qb-praise]').textContent =
      ratio === 1 ? '全部答对，太棒了！给自己一个大拇指 👍'
        : ratio >= 0.6 ? '很不错，继续加油！答错的题已经在错题本里等你。'
          : '别灰心，答错的题都收进错题本了，再练一遍就掌握啦！';
    const again = $('[data-qb-again]');
    const params = board.dataset.modeWrong === '1'
      ? `?mode=wrong&count=${board.dataset.size}`
      : `?${board.dataset.area ? `area=${board.dataset.area}&` : ''}${board.dataset.tag ? `tag=${board.dataset.tag}&` : ''}count=${board.dataset.size}`;
    again.href = board.dataset.practiceUrl + params;
    result.hidden = false;
    again.focus();
  };

  /* ── 事件接线 ─────────────────────────────────────────────────────── */
  questionBox.addEventListener('click', (event) => {
    const option = event.target.closest('[data-qb-option]');
    if (option) return submit(givenFor[questions[index].type](option.dataset.value));
    if (event.target.closest('[data-qb-reveal]')) return revealSelfcheck();
  });

  const revealSelfcheck = () => {
    const question = questions[index];
    const reveal = questionBox.querySelector('[data-qb-reveal]');
    if (reveal) reveal.remove();
    const panel = document.createElement('div');
    panel.innerHTML = `
      <p class="qb-feedback-answer">参考答案：${escapeHtml(question.answer)}</p>
      ${question.steps ? `<p class="qb-feedback-steps">解题思路：${escapeHtml(question.steps)}</p>` : ''}
      <div class="qb-selfcheck">
        <button class="qb-option" type="button" data-qb-option data-value="right">我做对了 🎉</button>
        <button class="qb-option" type="button" data-qb-option data-value="wrong">我再想想 🤔</button>
      </div>`;
    questionBox.appendChild(panel);
    panel.querySelector('[data-qb-option]').focus();
  };

  /* 键盘：数字 1~4 选当前可见选项（含自评按钮）；反馈态 Enter 下一题。
     焦点在按钮/链接上时 Enter 交给原生激活，避免双重触发。 */
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const active = document.activeElement;
    if (event.key === 'Enter') {
      if (!feedback.hidden) {
        const action = feedback.querySelector('[data-qb-next], [data-qb-retry]');
        if (action) { event.preventDefault(); action.click(); }
      }
      return;
    }
    if (locked || questionBox.hidden) return;
    const index = ['1', '2', '3', '4'].indexOf(event.key);
    if (index < 0) return;
    const options = [...questionBox.querySelectorAll('[data-qb-option]')].filter((button) => !button.disabled);
    const target = options[index];
    if (target) { event.preventDefault(); target.click(); }
  });

  showQuestion();
})();
