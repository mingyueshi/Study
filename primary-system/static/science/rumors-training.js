(() => {
  'use strict';
  const root = document.querySelector('[data-training]');
  if (!root || !window.RumorStation) return;
  const deck = JSON.parse(document.querySelector('#rumor-training-deck').textContent);
  const {store, changed} = window.RumorStation;
  const sessionKey = 'primary.science-rumors.training.v1';
  const find = selector => root.querySelector(selector);
  const lobby = find('[data-training-lobby]');
  const questionPanel = find('[data-training-question]');
  const resultPanel = find('[data-training-result]');
  let round = null;
  let session;
  try { session = window.sessionStorage; round = window.RumorLearning.restoreRound(session.getItem(sessionKey), deck); } catch { /* 本轮仍可在内存中完成。 */ }

  function save() {
    try { session.setItem(sessionKey, JSON.stringify(round)); } catch { find('[data-training-storage]').hidden = false; }
  }
  function show(panel) {
    [lobby, questionPanel, resultPanel].forEach(item => { item.hidden = item !== panel; });
  }
  function reviewItems() { return deck.filter(item => store.read(item.slug).review); }
  function refreshLobby() {
    find('[data-review-size]').textContent = `${reviewItems().length} 项`;
    find('[data-training-resume]').hidden = !round;
    find('[data-training-resume]').textContent = round && round.index === round.ids.length ? '查看上一轮结果 →' : '继续上一轮 →';
    if (!store.available) find('[data-training-storage]').hidden = false;
  }
  function start(mode, items) {
    const pool = items || (mode === 'review' ? reviewItems() : deck);
    if (!pool.length) {
      show(lobby);
      find('[data-training-message]').textContent = '目前没有待巩固题。可以先随机练一轮，遇到需要再想一想的题，它就会出现在这里。';
      refreshLobby();
      return;
    }
    round = window.RumorLearning.selectRound(pool);
    find('[data-training-message]').textContent = '';
    save(); render();
  }
  function renderFeedback(item) {
    const choice = item.challenge.options.find(option => option.id === round.answers[round.index]);
    const answered = Boolean(choice);
    const feedback = find('[data-training-feedback]');
    find('[data-training-submit]').hidden = answered;
    find('[data-training-after]').hidden = !answered;
    find('[data-training-form] fieldset').disabled = answered;
    feedback.textContent = '';
    delete feedback.dataset.state;
    if (!answered) return;
    const correct = choice.id === item.challenge.answer;
    const right = item.challenge.options.find(option => option.id === item.challenge.answer);
    feedback.dataset.state = correct ? 'correct' : 'retry';
    const headline = document.createElement('strong');
    headline.textContent = correct ? '判断有依据！' : '这题再巩固一下。';
    const reason = document.createElement('p'); reason.textContent = choice.feedback;
    feedback.append(headline, reason);
    if (!correct) {
      const answer = document.createElement('p');
      answer.textContent = `更合适的做法：${right.text} ${right.feedback}`;
      feedback.append(answer);
    }
    find('[data-training-next]').textContent = round.index === round.ids.length - 1 ? '看本轮报告 →' : '下一题 →';
  }
  function render() {
    if (round.index === round.ids.length) { renderResult(); return; }
    show(questionPanel);
    const item = deck.find(item => item.slug === round.ids[round.index]);
    find('[data-training-position]').textContent = `第 ${round.index + 1} / ${round.ids.length} 题`;
    find('[data-training-progress]').max = round.ids.length;
    find('[data-training-progress]').value = round.answers.length;
    find('[data-training-skill]').textContent = `这题练：${item.skill}`;
    find('#training-question-title').textContent = item.challenge.prompt;
    find('[data-training-case]').href = item.url;
    const options = find('[data-training-options]'); options.replaceChildren();
    item.challenge.options.forEach(option => {
      const label = document.createElement('label'); label.className = 'rumor-option';
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'choice'; input.value = option.id; input.required = true;
      input.checked = round.answers[round.index] === option.id;
      label.append(input, document.createTextNode(option.text)); options.append(label);
    });
    renderFeedback(item);
    find('#training-question-title').focus();
  }
  function missedItems() {
    return round.ids.map(slug => deck.find(item => item.slug === slug)).filter((item, i) => round.answers[i] !== item.challenge.answer);
  }
  function renderResult() {
    show(resultPanel);
    const missed = missedItems();
    const correct = round.ids.length - missed.length;
    find('#training-result-title').textContent = `${correct} / ${round.ids.length} 题，找到了更有依据的做法`;
    find('[data-training-result-tip]').textContent = missed.length
      ? '需要再想想的任务已加入待巩固。先看证据，再练一次，进步就藏在这里。'
      : '这一轮全部练对！遇到新说法时，也记得先找证据，再下结论。';
    const report = find('[data-training-report]'); report.replaceChildren();
    round.ids.forEach((slug, index) => {
      const item = deck.find(item => item.slug === slug);
      const correct = round.answers[index] === item.challenge.answer;
      const li = document.createElement('li');
      const status = document.createElement('span');
      status.className = correct ? 'rumor-done' : 'rumor-review-badge';
      status.textContent = correct ? '✓ 练对了' : '再巩固';
      const link = document.createElement('a'); link.href = item.url; link.textContent = item.claim;
      const skill = document.createElement('small'); skill.textContent = item.skill;
      li.append(status, link, skill); report.append(li);
    });
    find('[data-retry-missed]').hidden = missed.length === 0;
    find('#training-result-title').focus();
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-start]');
    if (button) start(button.dataset.start);
  });
  find('[data-training-form]').addEventListener('submit', event => {
    event.preventDefault();
    if (round.answers[round.index]) return;
    const item = deck.find(item => item.slug === round.ids[round.index]);
    const answer = new FormData(event.currentTarget).get('choice');
    if (!item.challenge.options.some(option => option.id === answer)) return;
    round.answers.push(answer);
    store.practice(item.slug, answer === item.challenge.answer);
    changed(); save(); renderFeedback(item);
    find('[data-training-progress]').value = round.answers.length;
    find('[data-training-next]').focus();
  });
  find('[data-training-next]').addEventListener('click', () => {
    if (!round.answers[round.index]) return;
    round.index++; save(); render();
  });
  find('[data-training-lobby-button]').addEventListener('click', () => { refreshLobby(); show(lobby); });
  find('[data-training-resume]').addEventListener('click', render);
  find('[data-retry-missed]').addEventListener('click', () => start('review', missedItems()));
  window.addEventListener('storage', refreshLobby);
  window.addEventListener('rumor:records-change', refreshLobby);
  refreshLobby(); root.hidden = false;
  if (root.dataset.mode === 'review') {
    if (!round) start('review');
    else find('[data-training-message]').textContent = '你有一轮训练记录。可以继续上一轮，也可以点「巩固错题」开始新的一轮。';
  }
})();
