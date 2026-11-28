/* 英语语法专题：巩固题页内前端判分 + 练习进度（localStorage）。
   判分只服务本页的即时巩固；同样的题已进挑战题库，由服务端判分、落记录、
   进错题本——两边口径独立，不互相同步。 */
'use strict';

(() => {
  const hub = document.querySelector('[data-grammar-first-chapter]');
  const revealBookmark = () => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    if (hub?.dataset.grammarFirstAnchors.split(' ').includes(id)) {
      window.location.replace(hub.dataset.grammarFirstChapter + '#' + id);
      return;
    }
    const target = document.getElementById(id);
    const disclosure = target?.closest('.grammar-rule, .grammar-chapter-review');
    if (disclosure) {
      disclosure.open = true;
      requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
    }
  };
  revealBookmark();
  window.addEventListener('hashchange', revealBookmark);
  document.querySelector('.grammar-review-jump')?.addEventListener('click', () => {
    document.getElementById('chapter-review').open = true;
  });

  const STORE_KEY = 'grammar-progress-v1';
  const progressNode = document.querySelector('[data-grammar-progress]');
  const chapterProgress = document.querySelector('[data-grammar-chapter-progress]');
  const quizzes = Array.from(document.querySelectorAll('[data-grammar-quiz]'));

  const load = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return saved?.correct && typeof saved.correct === 'object' && !Array.isArray(saved.correct)
        ? saved : { correct: {} };
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
    if (chapterProgress) chapterProgress.textContent = quizzes.filter(quiz => state.correct[quiz.dataset.lesson]).length;
  };

  const state = load();
  updateProgress(state);

  quizzes.forEach((quiz) => {
    const lessonId = quiz.dataset.lesson;
    const options = Array.from(quiz.querySelectorAll('[data-grammar-option]'));
    const explain = quiz.querySelector('[data-grammar-explain]');
    const completed = quiz.closest('.grammar-review-item')?.querySelector('[data-grammar-review-state]');
    const answer = Number(quiz.dataset.answer);

    const showCorrect = () => {
      options.forEach((option) => {
        option.disabled = true;
        if (Number(option.dataset.index) === answer) option.classList.add('right');
      });
      if (explain) explain.hidden = false;
      if (completed) completed.hidden = false;
    };

    // 已答对的题在折叠时也显示完成状态。
    if (state.correct[lessonId]) showCorrect();

    quiz.addEventListener('click', (event) => {
      const option = event.target.closest('[data-grammar-option]');
      if (!option || option.disabled) return;
      const chosen = Number(option.dataset.index);
      if (chosen === answer) {
        showCorrect();
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
