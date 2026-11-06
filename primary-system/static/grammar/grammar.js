/* 英语语法专题：巩固题页内前端判分 + 练习进度（localStorage）。
   判分只服务本页的即时巩固；同样的题已进挑战题库，由服务端判分、落记录、
   进错题本——两边口径独立，不互相同步。 */
'use strict';

(() => {
  const STORE_KEY = 'grammar-progress-v1';
  const progressNode = document.querySelector('[data-grammar-progress]');
  const quizzes = Array.from(document.querySelectorAll('[data-grammar-quiz]'));

  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return saved && typeof saved === 'object' && typeof saved.correct === 'object' ? saved : { correct: {} };
    } catch (e) {
      return { correct: {} };
    }
  };
  const store = (state) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* 无痕模式等场景下静默降级 */ }
  };
  const updateProgress = (state) => {
    if (progressNode) progressNode.textContent = Object.keys(state.correct).length;
  };

  const state = load();
  updateProgress(state);

  quizzes.forEach((quiz) => {
    const lessonId = quiz.dataset.lesson;
    const options = Array.from(quiz.querySelectorAll('[data-grammar-option]'));
    const explain = quiz.querySelector('[data-grammar-explain]');
    const answer = Number(quiz.dataset.answer);

    // 已答对的题展示为完成态（换章回来不掉进度）。
    if (state.correct[lessonId]) {
      options.forEach((option) => {
        option.disabled = true;
        if (Number(option.dataset.index) === answer) option.classList.add('right');
      });
      if (explain) explain.hidden = false;
    }

    quiz.addEventListener('click', (event) => {
      const option = event.target.closest('[data-grammar-option]');
      if (!option || option.disabled) return;
      const chosen = Number(option.dataset.index);
      if (chosen === answer) {
        option.classList.add('right');
        options.forEach((other) => { other.disabled = true; });
        if (explain) explain.hidden = false;
        state.correct[lessonId] = true;
        store(state);
        updateProgress(state);
      } else {
        option.classList.add('wrong');
        option.disabled = true;
      }
    });
  });
})();
