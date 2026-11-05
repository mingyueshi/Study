/* 看释义猜成语：点候选字补空，前端判分；无刷新、无学习记录。
   服务端渲染字格（空位带 data-answer）与候选键盘，这里只做交互与计数。 */
'use strict';

(() => {
  const board = document.querySelector('[data-quiz-round]');
  if (!board) return;
  const slots = Array.from(board.querySelectorAll('[data-quiz-slot]'));
  const result = board.querySelector('[data-quiz-result]');
  const praiseEl = board.querySelector('[data-quiz-praise]');
  if (!slots.length || !result) return;

  const STORE_KEY = 'idioms_quiz_stats_v1';
  let stats = { streak: 0, correct: 0, asked: 0 };
  try {
    stats = { ...stats, ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
  } catch (e) { /* 忽略 */ }

  let counted = false; // 每轮只在第一次检查时计数

  const node = (name) => board.querySelector(name);

  const renderScore = () => {
    const streak = node('[data-quiz-streak]');
    const correct = node('[data-quiz-correct]');
    const asked = node('[data-quiz-asked]');
    if (streak) streak.textContent = stats.streak;
    if (correct) correct.textContent = stats.correct;
    if (asked) asked.textContent = stats.asked;
  };

  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(stats)); } catch (e) { /* 忽略 */ }
  };

  const filled = (slot) => slot.dataset.char || '';
  const answerOf = (slot) => slot.dataset.answer || '';
  const emptySlots = () => slots.filter((slot) => !filled(slot) && !slot.classList.contains('hint'));

  const fill = (slot, char) => {
    slot.dataset.char = char;
    slot.textContent = char;
    slot.classList.add('filled');
    slot.classList.remove('bad', 'ok');
  };

  const clearSlot = (slot) => {
    delete slot.dataset.char;
    slot.textContent = '';
    slot.classList.remove('filled', 'bad', 'ok');
    slot.disabled = false;
  };

  const clear = () => {
    slots.forEach((slot) => { if (!slot.classList.contains('hint')) clearSlot(slot); });
  };

  board.querySelectorAll('[data-quiz-key]').forEach((key) => {
    key.addEventListener('click', () => {
      const target = emptySlots()[0];
      if (target) fill(target, key.dataset.char || key.textContent.trim());
    });
  });

  slots.forEach((slot) => {
    slot.addEventListener('click', () => {
      if (slot.classList.contains('hint')) return;
      clearSlot(slot);
    });
  });

  const clearButton = node('[data-quiz-clear]');
  if (clearButton) clearButton.addEventListener('click', clear);

  const hintButton = node('[data-quiz-hint]');
  if (hintButton) {
    hintButton.addEventListener('click', () => {
      const target = emptySlots()[0];
      if (!target) return;
      target.dataset.char = answerOf(target);
      target.textContent = answerOf(target);
      target.classList.add('hint');
      target.disabled = true;
    });
  }

  const praiseText = (streak) => {
    if (streak >= 10) return '连对 ' + streak + ' 题，成语小达人！';
    if (streak >= 5) return '五连对，火力全开！';
    if (streak >= 3) return '三连对，越战越勇！';
    return '答对啦，真棒！';
  };

  const checkButton = node('[data-quiz-check]');
  if (checkButton) {
    checkButton.addEventListener('click', () => {
      const gaps = emptySlots();
      if (gaps.length) {
        gaps.forEach((slot) => slot.classList.add('bad'));
        return;
      }
      let wrong = 0;
      slots.forEach((slot) => {
        const ok = filled(slot) === answerOf(slot) || slot.classList.contains('hint');
        slot.classList.toggle('bad', !ok);
        slot.classList.toggle('ok', ok);
        if (!ok) wrong += 1;
      });
      if (wrong) {
        if (!counted) { stats.asked += 1; stats.streak = 0; counted = true; save(); renderScore(); }
        return;
      }
      if (!counted) { stats.correct += 1; stats.asked += 1; stats.streak += 1; counted = true; save(); }
      if (praiseEl) praiseEl.textContent = praiseText(stats.streak);
      result.hidden = false;
      renderScore();
    });
  }

  renderScore();
})();
