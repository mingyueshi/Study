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

  const updateProgress = () => {
    $('[data-qb-index]').textContent = Math.min(index + 1, questions.length);
    $('[data-qb-total]').textContent = questions.length;
    $('[data-qb-correct]').textContent = correctCount;
  };

  const sayChip = (text) => `<button class="say-chip" type="button" data-say="${escapeHtml(text)}" aria-label="朗读题目">🔊</button>`;

  /* ── 每种题型自己的作答区 ─────────────────────────────────────────── */
  const renderers = {
    choice(question) {
      return `<div class="qb-options">${question.options.map((option, position) =>
        `<button class="qb-option" type="button" data-qb-option data-value="${position}">${escapeHtml(option)}</button>`).join('')}</div>`;
    },
    truefalse() {
      return `<div class="qb-boolean">
        <button class="qb-option" type="button" data-qb-option data-value="true">对 ✓</button>
        <button class="qb-option" type="button" data-qb-option data-value="false">错 ✗</button>
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
    questionBox.innerHTML = `
      <div class="qb-tag-row">${tags}</div>
      <p class="qb-stem">${escapeHtml(question.stem)}${sayChip(question.stem)}</p>
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
    updateProgress();
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
        if (button.textContent === verdict.reveal) button.classList.add('right');
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
    $('[data-qb-praise]').textContent =
      ratio === 1 ? '全部答对，太棒了！给自己一个大拇指 👍'
        : ratio >= 0.6 ? '很不错，继续加油！答错的题已经在错题本里等你。'
          : '别灰心，答错的题都收进错题本了，再练一遍就掌握啦！';
    const again = $('[data-qb-again]');
    const params = board.dataset.modeWrong === '1'
      ? `?mode=wrong&count=${board.dataset.size}`
      : `?${board.dataset.area ? `area=${board.dataset.area}&` : ''}count=${board.dataset.size}`;
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

  showQuestion();
})();
