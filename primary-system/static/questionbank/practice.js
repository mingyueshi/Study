/* 挑战题库练习：逐题作答、服务端判分、即时反馈。
   选择/判断题内嵌数据不带答案与解析，作答 POST 到判分端点，由服务端返回
   判定、正确答案与解析后再展示；自评题的答案与思路随题内嵌，供对照自评。
   上报失败可重试，不打扰答题。 */
'use strict';

(() => {
  const board = document.querySelector('[data-qb-practice]');
  if (!board) return;
  const { owner, practiceUrl, area, tag, modeWrong, size, newRound, restartUrl } = board.dataset;
  const storageKey = 'primary-questionbank-round-v1:' + JSON.stringify([owner, practiceUrl, area, tag, modeWrong, size]);
  const initialQuestions = JSON.parse(document.getElementById('qb-questions').textContent || '[]');

  function readRound() {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.questions) || !saved.questions.length || saved.questions.length > 20
          || !saved.questions.every(question => question?.attempt_id && ['choice', 'truefalse', 'selfcheck'].includes(question.type))
          || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.questions.length
          || !Array.isArray(saved.answers) || ![saved.index, saved.index + 1].includes(saved.answers.length)
          || !saved.answers.every(answer => typeof answer?.correct === 'boolean' && answer.given)
          || (saved.completed && saved.answers.length !== saved.questions.length)
          || !Array.isArray(saved.hints) || !Number.isFinite(saved.elapsedMs)) return null;
      return saved;
    } catch (_) { return null; }
  }

  if (newRound === '1') {
    try { window.sessionStorage.removeItem(storageKey); } catch (_) { /* 仍可练习 */ }
    const url = new URL(window.location.href);
    url.searchParams.delete('new');
    window.history.replaceState(window.history.state, '', url);
  }
  const restored = newRound !== '1' && readRound();
  const round = restored || {
    questions: initialQuestions, index: 0, answers: [], hints: [], elapsedMs: 0,
    pending: null, revealed: false, explanationOpen: false, completed: null,
  };
  const questions = round.questions;
  if (!questions.length) return;
  board.hidden = false;
  document.getElementById('qb-empty').hidden = true;
  const $ = (name) => board.querySelector(name);
  const questionBox = $('[data-qb-question]');
  const feedback = $('[data-qb-feedback]');
  const result = $('[data-qb-result]');

  let submitting = false;
  let storedHere = Boolean(restored);
  const olympiad = board.dataset.track === 'olympiad';
  let startedAt = null;
  let timer;
  const elapsed = () => Math.max(1, Math.round(round.elapsedMs + (startedAt === null ? 0 : performance.now() - startedAt)));
  const updateTimer = () => { $('[data-qb-timer]').textContent = window.OlympiadChallenge.duration(elapsed()); };
  function pauseTimer() {
    if (startedAt === null) return;
    round.elapsedMs = elapsed();
    startedAt = null;
    clearInterval(timer);
  }
  function startTimer() {
    if (!olympiad || round.answers.length === questions.length || startedAt !== null) return;
    startedAt = performance.now();
    timer = setInterval(updateTimer, 1000);
  }
  function saveRound() {
    try {
      // 返回到浏览器保留的旧页面时，不覆盖此后新抽的题组。
      const stored = storedHere && readRound();
      if (stored && stored.questions[0].attempt_id !== questions[0].attempt_id) return;
      window.sessionStorage.setItem(storageKey, JSON.stringify({ ...round, elapsedMs: olympiad ? elapsed() : 0 }));
      storedHere = true;
    } catch (_) { /* 存储不可用时仍可练习 */ }
  }
  const selfcheckTotal = questions.filter((question) => question.type === 'selfcheck').length;
  const objectiveTotal = questions.length - selfcheckTotal;
  const currentAnswer = () => round.answers[round.index];
  function tally() {
    return round.answers.reduce((score, answer, index) => {
      if (questions[index].type === 'selfcheck') {
        score.selfcheckCount++;
        if (answer.correct) score.selfcheckRight++;
      } else if (answer.correct) score.correctCount++;
      return score;
    }, {correctCount: 0, selfcheckCount: 0, selfcheckRight: 0});
  }

  const csrf = () => decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');
  const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));

  const updateProgress = () => {
    $('[data-qb-index]').textContent = round.index + 1;
    $('[data-qb-total]').textContent = questions.length;
    const {correctCount, selfcheckCount} = tally();
    const counts = [];
    if (objectiveTotal) counts.push(`答对 ${correctCount} 题`);
    if (selfcheckTotal) counts.push(`已自评 ${selfcheckCount} 题`);
    $('[data-qb-tally]').textContent = ' · ' + counts.join(' · ');
    const fill = $('[data-qb-progress-fill]');
    if (fill) fill.style.width = `${(round.answers.length / questions.length) * 100}%`;
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
  const showQuestion = (focus = false) => {
    feedback.hidden = true;
    feedback.classList.remove('good', 'bad');
    const question = questions[round.index];
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
      ${renderers[question.type](question)}
      ${olympiad && question.hints?.length ? `<section class="qb-hints" aria-label="分步提示">
        <h2>💡 卡住了？看一步就好</h2><p>先自己想一想，提示会一步一步打开。</p>
        <ol id="qb-hint-list" data-qb-hint-list aria-live="polite"></ol>
        <button class="button small ghost" type="button" data-qb-hint aria-controls="qb-hint-list">看第 1 步提示（共 ${question.hints.length} 步）</button>
      </section>` : ''}`;
    if (round.revealed) revealSelfcheck(false);
    if (olympiad && question.hints?.length) renderHints(question);
    updateProgress();
    if (currentAnswer()) {
      showVerdict(question, currentAnswer(), false);
      return;
    }
    if (round.pending) {
      disableOptions();
      showSubmissionError(false);
      return;
    }
    const focusTarget = questionBox.querySelector('[data-qb-option], [data-qb-reveal]');
    if (focus && focusTarget) focusTarget.focus();
  };

  /* ── 提交与反馈 ───────────────────────────────────────────────────── */
  const disableOptions = () => questionBox.querySelectorAll('[data-qb-option]').forEach(button => { button.disabled = true; });

  const submit = async (given) => {
    if (submitting || currentAnswer() || round.blocked) return;
    submitting = true;
    round.pending ??= given;
    const question = questions[round.index];
    disableOptions();
    saveRound();
    const response = await fetch(board.dataset.answerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() },
      body: JSON.stringify({ uuid: question.uuid, attempt_id: question.attempt_id, revision: question.revision, given: round.pending }),
    }).catch(() => null);
    const verdict = response?.ok ? await response.json().catch(() => null) : null;
    submitting = false;
    if (typeof verdict?.correct !== 'boolean') {
      round.blocked = response?.status === 400 || response?.status === 409;
      saveRound();
      showSubmissionError(true);
      return;
    }
    const answer = {
      given: round.pending, correct: verdict.correct, reveal: verdict.reveal || '',
      explanation: verdict.explanation || '', steps: verdict.steps || '',
    };
    round.answers.push(answer);
    round.pending = null;
    if (olympiad && round.answers.length === questions.length) {
      pauseTimer();
      updateTimer();
    }
    saveRound();
    updateProgress();
    showVerdict(question, answer, true);
    if (window.rewardToast && verdict.rewards) window.rewardToast(verdict.rewards);
  };

  const showSubmissionError = (focus) => showFeedback({
    correct: false, retry: !round.blocked, restart: round.blocked,
    head: round.blocked ? '题目或作答状态已变化，请重新抽题。'
      : focus ? '上报没成功，稍等片刻点重试。' : '这道题的提交还未确认，点重试查看结果。',
    reveal: '', explanation: '', steps: '',
  }, focus);

  const showVerdict = (question, answer, focus) => {
    const hintButton = questionBox.querySelector('[data-qb-hint]');
    if (hintButton) hintButton.disabled = true;
    const selfcheck = question.type === 'selfcheck';
    markChoices(question, answer.given, answer);
    showFeedback({
      ...answer, selfcheck,
      head: selfcheck ? '自评已记录。' : answer.correct ? '答对了！' : '再想一想～',
    }, focus);
  };

  const showFeedback = ({ correct, head, reveal, explanation, steps, retry, restart, selfcheck }, focus) => {
    feedback.classList.toggle('good', Boolean(correct));
    feedback.classList.toggle('bad', !correct);
    feedback.querySelector('[data-qb-feedback-head]').textContent = head;
    feedback.querySelector('[data-qb-feedback-answer]').textContent = reveal ? `${selfcheck ? '参考答案' : '正确答案'}：${reveal}` : '';
    feedback.querySelector('[data-qb-feedback-explain]').textContent = explanation;
    feedback.querySelector('[data-qb-feedback-steps]').textContent = steps;
    const explanationPanel = feedback.querySelector('[data-qb-full-explanation]');
    if (explanationPanel) explanationPanel.open = Boolean(currentAnswer() && round.explanationOpen);
    const actions = feedback.querySelector('.qb-feedback-actions');
    if (retry) {
      actions.innerHTML = '<button class="button small" type="button" data-qb-retry>重试 ↻</button>';
      actions.querySelector('[data-qb-retry]').addEventListener('click', () => submit(round.pending));
    } else if (restart) {
      actions.innerHTML = '<a class="button small" data-qb-restart>重新抽题</a>';
      actions.querySelector('[data-qb-restart]').href = restartUrl;
    } else {
      const last = round.index === questions.length - 1;
      actions.innerHTML = `<button class="button small" type="button" data-qb-next>${last ? '看结果 🏁' : '下一题 →'}</button>`;
      actions.querySelector('[data-qb-next]').addEventListener('click', next);
    }
    feedback.hidden = false;
    if (focus) actions.querySelector('button, a').focus();
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
    if (!currentAnswer() || round.completed) return;
    if (round.index === questions.length - 1) return finish();
    round.index++;
    round.revealed = false;
    round.explanationOpen = false;
    saveRound();
    showQuestion(true);
  };

  const finish = (restoring = false) => {
    if (round.answers.length !== questions.length || (round.completed && !restoring)) return;
    const {correctCount, selfcheckRight} = tally();
    if (!round.completed) {
      round.completed = olympiad ? window.OlympiadChallenge.record({
        id: questions[0].attempt_id, tag: tag || '', total: questions.length,
        correct: correctCount, elapsedMs: elapsed(), hintsUsed: round.hints.filter(Boolean).length,
        mode: modeWrong === '1' ? 'wrong' : 'challenge', completedAt: new Date().toISOString(),
      }) : {};
      saveRound();
    }
    questionBox.hidden = true;
    feedback.hidden = true;
    const scores = [];
    if (objectiveTotal) scores.push(`答对 ${correctCount}／${objectiveTotal} 题`);
    if (selfcheckTotal) scores.push(`自评做对 ${selfcheckRight}／${selfcheckTotal} 题`);
    $('[data-qb-final-score]').textContent = scores.join(' · ');
    const starsBox = $('[data-qb-stars]');
    if (objectiveTotal) {
      const ratio = correctCount / objectiveTotal;
      const stars = ratio >= 1 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0;
      starsBox.innerHTML = [0, 1, 2].map((i) => `<span class="qb-star${i < stars ? ' on' : ''}">★</span>`).join('');
      starsBox.setAttribute('aria-label', `判分题获得 ${stars} 颗星（满分 3 颗）`);
      starsBox.hidden = false;
    }
    $('[data-qb-praise]').textContent = correctCount + selfcheckRight === questions.length
      ? '这一组练完啦，给自己一个大拇指 👍'
      : '需要再想一想的题已收进错题本。';
    const again = $('[data-qb-again]');
    again.href = restartUrl;
    if (olympiad) {
      const {saved, rank} = round.completed;
      const hintsUsed = round.hints.filter(Boolean).length;
      $('[data-qb-round-result]').textContent = `用时 ${window.OlympiadChallenge.duration(elapsed())} · ${hintsUsed ? `${hintsUsed} 题看过提示` : '独立完成'}。`
        + (!saved ? '浏览器未能保存成绩，本次结果仍在这里。' : rank ? `本机同组第 ${rank} 名！` : '本次未进入前 10 名，再来挑战吧！');
    }
    result.hidden = false;
    if (restoring) return;
    again.focus();
    if (questions.every(question => question.area === 'math')) {
      result.classList.add('is-complete');
      // 成绩、错题与重练入口先显示，庆祝失败也不影响练习结果。
      try { window.StudyEffects?.celebrate({key: 'math-round-complete', target: result}); } catch (error) { /* 可选反馈 */ }
    }
  };

  /* ── 事件接线 ─────────────────────────────────────────────────────── */
  const renderHints = (question) => {
    const step = round.hints[round.index] || 0;
    const button = questionBox.querySelector('[data-qb-hint]');
    if (!button) return;
    questionBox.querySelector('[data-qb-hint-list]').innerHTML = question.hints.slice(0, step).map(text => `<li>${escapeHtml(text)}</li>`).join('');
    button.disabled = step >= question.hints.length;
    button.textContent = button.disabled ? '提示看完啦，试着自己算一算'
      : step ? `再看第 ${step + 1} 步提示（共 ${question.hints.length} 步）` : `看第 1 步提示（共 ${question.hints.length} 步）`;
  };

  questionBox.addEventListener('click', (event) => {
    const question = questions[round.index];
    if (event.target.closest('[data-qb-hint]')) {
      const step = round.hints[round.index] || 0;
      if (submitting || currentAnswer() || step >= (question.hints || []).length) return;
      round.hints[round.index] = step + 1;
      renderHints(question);
      saveRound();
      return;
    }
    const option = event.target.closest('[data-qb-option]');
    if (option) return submit(givenFor[question.type](option.dataset.value));
    if (event.target.closest('[data-qb-reveal]')) {
      round.revealed = true;
      revealSelfcheck(true);
      saveRound();
    }
  });

  const revealSelfcheck = (focus) => {
    const question = questions[round.index];
    const reveal = questionBox.querySelector('[data-qb-reveal]');
    if (!reveal) return;
    reveal.remove();
    const panel = document.createElement('div');
    panel.innerHTML = `
      <p class="qb-feedback-answer">参考答案：${escapeHtml(question.answer)}</p>
      ${question.steps ? `<p class="qb-feedback-steps">解题思路：${escapeHtml(question.steps)}</p>` : ''}
      <div class="qb-selfcheck">
        <button class="qb-option" type="button" data-qb-option data-value="right">我做对了 🎉</button>
        <button class="qb-option" type="button" data-qb-option data-value="wrong">我再想想 🤔</button>
      </div>`;
    questionBox.appendChild(panel);
    if (focus) panel.querySelector('[data-qb-option]').focus();
  };

  $('[data-qb-full-explanation]')?.addEventListener('toggle', (event) => {
    if (feedback.hidden || !currentAnswer()) return;
    round.explanationOpen = event.target.open;
    saveRound();
  });

  /* 键盘：数字 1~4 选当前可见选项（含自评按钮）；反馈态 Enter 下一题。
     焦点在按钮/链接上时 Enter 交给原生激活，避免双重触发。 */
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const active = document.activeElement;
    if (active?.matches?.('input, textarea, select, [contenteditable="true"]')
        || (active && active !== document.body && !board.contains(active))) return;
    if (event.key === 'Enter') {
      if (active?.closest?.('a, button, summary')) return;
      if (!feedback.hidden) {
        const action = feedback.querySelector('[data-qb-next], [data-qb-retry]');
        if (action) { event.preventDefault(); action.click(); }
      }
      return;
    }
    if (submitting || round.pending || currentAnswer() || questionBox.hidden) return;
    const index = ['1', '2', '3', '4'].indexOf(event.key);
    if (index < 0) return;
    const options = [...questionBox.querySelectorAll('[data-qb-option]')].filter((button) => !button.disabled);
    const target = options[index];
    if (target) { event.preventDefault(); target.click(); }
  });

  if (round.completed) {
    updateProgress();
    finish(true);
  } else showQuestion();
  if (olympiad) updateTimer();
  startTimer();
  saveRound();
  window.addEventListener('pagehide', () => { pauseTimer(); saveRound(); });
  window.addEventListener('pageshow', event => { if (event.persisted) startTimer(); });
})();
