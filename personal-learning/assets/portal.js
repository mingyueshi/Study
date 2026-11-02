/* 从英文模块读取本机进度，导航页不另存一份学习档案。 */
(function () {
  'use strict';
  function renderSummary() {
    const fileMode = window.location.protocol === 'file:';
    document.querySelectorAll('[data-local-progress]').forEach(element => { element.hidden = fileMode; });
    document.querySelectorAll('[data-file-progress]').forEach(element => { element.hidden = !fileMode; });
    const state = window.LearningProgress.read(TECH_UNITS);
    const total = TECH_UNITS.reduce((sum, unit) => sum + unit.terms.length, 0);
    const mastered = Object.keys(state.learned).length;
    const values = { 'library-total': total, 'unit-total': TECH_UNITS.length, mastered, remaining: total - mastered, percentage: Math.round(mastered / total * 100) + '%' };
    if (typeof AI_COURSE !== 'undefined') {
      values['ai-stage-total'] = AI_COURSE.stages.length;
      values['ai-lesson-total'] = AI_COURSE.stages.reduce((sum, stage) => sum + stage.lessons.length, 0);
      values['ai-practice-total'] = AI_COURSE.stages.filter(stage => stage.practice).length;
    }
    Object.entries(values).forEach(([key, value]) => {
      document.querySelectorAll('[data-' + key + ']').forEach(element => { element.textContent = value; });
    });
    document.querySelectorAll('[data-learning-progress]').forEach(element => {
      element.max = total;
      element.value = mastered;
    });
  }
  window.addEventListener('pageshow', renderSummary);
  window.addEventListener('storage', event => { if (!event.key || event.key === window.LearningProgress.key) renderSummary(); });
  renderSummary();
})();
