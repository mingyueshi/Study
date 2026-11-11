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
    if (typeof AI_PRACTICE !== 'undefined') {
      values['ai-practice-total'] = AI_PRACTICE.labs.length;
      values['ai-model-total'] = AI_PRACTICE.models.length;
      values['ai-tool-total'] = AI_PRACTICE.tools.length;
    }
    if (typeof AI_PROMPTS !== 'undefined') {
      values['ai-prompt-total'] = AI_PROMPTS.prompts.length;
      values['ai-prompt-category-total'] = AI_PROMPTS.categories.length;
    }
    if (typeof CODING_COURSE !== 'undefined') {
      values['coding-track-total'] = CODING_COURSE.tracks.length;
      values['coding-lesson-total'] = CODING_COURSE.tracks.reduce((sum, track) => sum + track.lessons.length, 0);
      values['coding-project-total'] = CODING_COURSE.projects.length;
    }
    if (typeof DEV_TOOLS !== 'undefined' && typeof DevState !== 'undefined') {
      const devCommands = DEV_TOOLS.tools.reduce((sum, tool) => sum + tool.groups.reduce((count, group) => count + group.commands.length, 0), 0);
      let devMastered = 0;
      try {
        devMastered = Object.keys(DevState.normalize(JSON.parse(localStorage.getItem(DevState.key) || 'null'), DEV_TOOLS).mastered).length;
      } catch (error) { devMastered = 0; }
      values['dev-tool-total'] = DEV_TOOLS.tools.length;
      values['dev-command-total'] = devCommands;
      values['dev-mastered'] = devMastered;
      values['dev-percentage'] = Math.round(devMastered / devCommands * 100) + '%';
      document.querySelectorAll('[data-dev-progress]').forEach(element => {
        element.max = devCommands;
        element.value = devMastered;
      });
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
  window.addEventListener('storage', event => { if (!event.key || event.key === window.LearningProgress.key || (window.DevState && event.key === window.DevState.key)) renderSummary(); });
  renderSummary();
})();
