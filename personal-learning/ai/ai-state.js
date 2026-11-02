/* 只保存 AI 基础篇的本机记录，与其他学习方向使用不同的键。 */
(function (root) {
  'use strict';
  const key = 'personal_ai_v1';
  function normalize(raw, course) {
    const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const state = { completed: {}, answers: {}, notes: {}, lastLesson: null };
    const lessons = course.stages.flatMap(stage => stage.lessons);
    lessons.forEach(lesson => {
      if (value.completed && value.completed[lesson.id] === true) state.completed[lesson.id] = true;
      const answer = value.answers && value.answers[lesson.id];
      if (Number.isInteger(answer) && answer >= 0 && answer < lesson.quiz.options.length) state.answers[lesson.id] = answer;
      const note = value.notes && value.notes[lesson.id];
      if (typeof note === 'string') state.notes[lesson.id] = note.slice(0, 2000);
    });
    if (lessons.some(lesson => lesson.id === value.lastLesson)) state.lastLesson = value.lastLesson;
    return state;
  }
  const api = { key, normalize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AILearningState = api;
})(typeof window !== 'undefined' ? window : globalThis);
