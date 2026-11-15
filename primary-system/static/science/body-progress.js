(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('body-progress-data').textContent);
  const key = 'study.body.progress.v1';
  const allowed = new Set(config.lessons.flatMap(lesson => lesson.questions));
  const locations = new Set(config.challenges);
  let persistent = true;
  let state = { solved: [], located: [] };
  function read() {
    let raw;
    try { raw = localStorage.getItem(key); }
    catch { persistent = false; return; }
    try {
      const value = JSON.parse(raw);
      if (value?.version === 1) state = {
        solved: [...new Set(Array.isArray(value.solved) ? value.solved : [])].filter(id => allowed.has(id)),
        located: [...new Set(Array.isArray(value.located) ? value.located : [])].filter(id => locations.has(id)),
      };
      else state = { solved: [], located: [] };
    } catch { state = { solved: [], located: [] }; }
  }
  function render() {
    config.lessons.forEach(lesson => {
      const count = lesson.questions.filter(id => state.solved.includes(id)).length;
      const stamp = document.querySelector(`[data-stamp="${lesson.slug}"]`);
      if (stamp) {
        stamp.dataset.complete = String(count === lesson.questions.length);
        stamp.querySelector('[data-stamp-count]').textContent = `${count}／${lesson.questions.length} 题已答对`;
      }
      const card = document.querySelector(`[data-course-progress="${lesson.slug}"]`);
      if (card && count) card.textContent = count === lesson.questions.length ? '本课三题已掌握 ✓' : `已答对 ${count}／${lesson.questions.length} 题`;
      else if (card) card.textContent = '动手试试';
      if (document.querySelector('[data-body-lesson]')?.dataset.bodyLesson === lesson.slug) {
        const current = document.querySelector('[data-current-progress]');
        current.hidden = false;
        current.textContent = `本课已答对 ${count}／${lesson.questions.length} 题。${persistent ? '学习足迹保存在当前浏览器。' : '浏览器未能保存，足迹仅在本页保留。'}`;
      }
    });
    const summary = document.querySelector('[data-progress-summary]');
    if (summary) summary.textContent = `课程自测 ${state.solved.length}／${allowed.size} 题已答对 · 器官定位 ${state.located.length}／${locations.size} 个已找到`;
    const meter = document.querySelector('[data-progress-meter]');
    if (meter) { meter.max = allowed.size; meter.value = state.solved.length; }
    const notice = document.querySelector('[data-progress-storage]');
    if (notice && !persistent) notice.textContent = '浏览器未能保存，当前足迹仅在本页保留。';
    document.querySelector('[data-passport]')?.removeAttribute('hidden');
    document.dispatchEvent(new CustomEvent('body:progress', { detail: { ...state } }));
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ version: 1, ...state })); }
    catch { persistent = false; }
    render();
  }
  function add(field, id, valid) {
    if (!valid.has(id)) return;
    // Merge a second open lesson's discoveries before writing.
    const previous = state;
    if (persistent) read();
    state.solved = [...new Set([...state.solved, ...previous.solved])];
    state.located = [...new Set([...state.located, ...previous.located])];
    if (!state[field].includes(id)) state[field].push(id);
    save();
  }
  window.BodyStudy = { solve: id => add('solved', id, allowed), locate: id => add('located', id, locations) };
  document.querySelector('[data-progress-clear]')?.addEventListener('click', () => {
    if (!window.confirm('重置课程答题和器官定位足迹？脉搏观察记录会保留。')) return;
    state = { solved: [], located: [] };
    save();
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) { read(); render(); } });
  read();
  render();
})();
