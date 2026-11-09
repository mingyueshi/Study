/* 看释义猜成语：点候选字补空，服务端提示和判分。 */
'use strict';

(() => {
  const board = document.querySelector('[data-quiz-round]');
  if (!board) return;
  const node = (selector) => board.querySelector(selector);
  const slots = Array.from(board.querySelectorAll('[data-quiz-slot]'));
  const keys = Array.from(board.querySelectorAll('[data-quiz-key]'));
  const result = node('[data-quiz-result]');
  const feedback = node('[data-quiz-feedback]');
  const checkButton = node('[data-quiz-check]');
  const hintButton = node('[data-quiz-hint]');
  const clearButton = node('[data-quiz-clear]');
  let token = board.dataset.token;
  let busy = false;
  let finished = false;
  function renderScore(score) {
    node('[data-quiz-streak]').textContent = score.streak;
    node('[data-quiz-correct]').textContent = score.correct;
    node('[data-quiz-asked]').textContent = score.asked;
  }

  const filled = (slot) => slot.dataset.char || '';
  const emptySlots = () => slots.filter((slot) => !filled(slot));
  const fill = (slot, char) => {
    slot.dataset.char = char;
    slot.textContent = char;
    slot.classList.add('filled');
    slot.classList.remove('bad', 'ok');
  };
  const clearSlot = (slot) => {
    if (slot.classList.contains('hint')) return;
    delete slot.dataset.char;
    slot.textContent = '';
    slot.classList.remove('filled', 'bad', 'ok');
  };

  function updateControls() {
    checkButton.disabled = clearButton.disabled = busy || finished;
    hintButton.disabled = busy || finished || emptySlots().length === 0;
    keys.forEach((key) => { key.disabled = busy || finished; });
    slots.forEach((slot) => { slot.disabled = busy || finished || slot.classList.contains('hint'); });
  }

  async function request(action, fields, onSuccess) {
    if (busy || finished) return;
    busy = true;
    feedback.textContent = '';
    updateControls();
    try {
      const csrf = decodeURIComponent((document.cookie.match(/(?:^|;\s*)primary_csrftoken=([^;]*)/) || [])[1] || '');
      const response = await fetch(board.dataset.reportUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf},
        body: JSON.stringify({action, token, ...fields}),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        feedback.textContent = data?.error || '刚才没能检查，请再试一次。';
        return;
      }
      onSuccess(data);
    } catch (e) {
      feedback.textContent = '连接暂时中断，填好的字还在。请再试一次。';
    } finally {
      busy = false;
      updateControls();
    }
  }

  keys.forEach((key) => {
    key.addEventListener('click', () => {
      if (busy || finished) return;
      const target = emptySlots()[0];
      if (target) fill(target, key.dataset.char);
      updateControls();
    });
  });

  slots.forEach((slot) => {
    slot.addEventListener('click', () => {
      if (busy || finished) return;
      clearSlot(slot);
      updateControls();
    });
  });

  clearButton.addEventListener('click', () => {
    if (busy || finished) return;
    slots.forEach(clearSlot);
    feedback.textContent = '';
    updateControls();
  });

  hintButton.addEventListener('click', () => {
    const target = emptySlots()[0];
    if (!target) return;
    return request('hint', {position: Number(target.dataset.position)}, (data) => {
      token = data.token;
      fill(target, data.char);
      target.classList.add('hint');
    });
  });

  function showResult(card, firstCorrect, streak) {
    node('[data-quiz-headword]').textContent = card.headword;
    node('[data-quiz-say]').dataset.say = card.headword + '。' + card.definition;
    const pinyin = node('[data-quiz-pinyin]');
    pinyin.textContent = card.pinyin;
    pinyin.hidden = !card.pinyin;
    node('[data-quiz-explanation]').textContent = card.definition;
    const example = node('[data-quiz-example]');
    example.textContent = card.example ? '例：' + card.example : '';
    example.hidden = !card.example;
    node('[data-quiz-entry]').href = card.url;
    node('[data-quiz-praise]').textContent = !firstCorrect ? '这次填对啦！'
      : streak >= 3 ? '连续答对 ' + streak + ' 题，真棒！' : '答对啦，真棒！';
    result.hidden = false;
    finished = true;
  }

  checkButton.addEventListener('click', () => {
    if (busy || finished) return;
    const gaps = emptySlots();
    if (gaps.length) {
      gaps.forEach((slot) => slot.classList.add('bad'));
      feedback.textContent = '还有空格，填完再检查吧。';
      return;
    }
    return request('answer', {answer: slots.map(filled).join('')}, (data) => {
      slots.forEach((slot, index) => {
        slot.classList.toggle('bad', !data.marks[index]);
        slot.classList.toggle('ok', data.marks[index]);
      });
      renderScore(data.score);
      if (data.correct) showResult(data.card, data.first_correct, data.score.streak);
      else feedback.textContent = '再想想标红的字。';
      if (window.rewardToast && data.rewards) window.rewardToast(data.rewards);
    });
  });

  updateControls();
})();
