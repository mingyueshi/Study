/* 奥数本机榜：按账号、题型、实际题数和练习方式分别比较。 */
'use strict';
(() => {
  const root = document.querySelector('[data-qb-leaderboard]');
  if (!root) return;
  const key = `primary-olympiad-ranks-v1:${root.dataset.scope}`;
  const tagSelect = root.querySelector('[data-qb-rank-tag]');
  const sizeSelect = root.querySelector('[data-qb-rank-size]');
  const modeSelect = root.querySelector('[data-qb-rank-mode]');
  const list = root.querySelector('[data-qb-rank-list]');
  const status = root.querySelector('[data-qb-rank-status]');
  const initialSize = Number(root.dataset.size) || 10;
  let highlightedId = '';
  let renderedSizes = '';
  const escape = (value) => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const duration = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    return seconds < 60 ? `${seconds} 秒` : `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
  };
  const valid = row => row && typeof row.id === 'string' && row.id.length > 0 && row.id.length <= 128
    && typeof row.tag === 'string' && row.tag.length <= 80
    && ['challenge', 'wrong'].includes(row.mode)
    && Number.isInteger(row.total) && row.total >= 1 && row.total <= 20
    && Number.isInteger(row.correct) && row.correct >= 0 && row.correct <= row.total
    && Number.isInteger(row.elapsedMs) && row.elapsedMs >= 1 && row.elapsedMs <= 604800000
    && Number.isInteger(row.hintsUsed) && row.hintsUsed >= 0 && row.hintsUsed <= row.total
    && typeof row.completedAt === 'string' && Number.isFinite(Date.parse(row.completedAt));
  const read = () => {
    try {
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      return {rows: Array.isArray(rows) ? rows.filter(valid) : [], available: true};
    } catch (error) { return {rows: [], available: false}; }
  };
  const compare = (a, b) => b.correct - a.correct || a.elapsedMs - b.elapsedMs
    || Date.parse(a.completedAt) - Date.parse(b.completedAt) || a.id.localeCompare(b.id);
  const ranked = (rows, tag, total, mode) => rows.filter(row => row.tag === tag
    && row.total === total && row.mode === mode).sort(compare).slice(0, 10);
  const render = (size = Number(sizeSelect.value) || initialSize) => {
    const {rows, available} = read();
    const sizes = [...new Set([5, 10, 20, initialSize, size, ...rows.map(row => row.total)])].sort((a, b) => a - b);
    const signature = sizes.join(',');
    if (signature !== renderedSizes) {
      renderedSizes = signature;
      sizeSelect.innerHTML = sizes.map(total => `<option value="${total}">${total} 题</option>`).join('');
    }
    sizeSelect.value = String(size);
    window.StudyChoices?.sync(sizeSelect);
    const visible = ranked(rows, tagSelect.value, size, modeSelect.value);
    status.textContent = !available ? '浏览器暂时无法读取本机榜，仍可正常练习。'
      : visible.length ? `这一栏已有 ${visible.length} 条挑战成绩。` : '这一栏还没有成绩，完成一组就来占个位置吧！';
    list.innerHTML = visible.map((row, index) => `<li class="${row.id === highlightedId ? 'is-current' : ''}">
      <span class="qb-rank-place">${index + 1}</span><div><b>答对 ${row.correct}／${row.total} 题</b>
      <span>${escape(duration(row.elapsedMs))} · ${row.hintsUsed ? `${row.hintsUsed} 题看过提示` : '独立完成'}${row.id === highlightedId ? ' · 本次挑战' : ''}</span></div>
      <time datetime="${escape(row.completedAt)}">${escape(new Date(row.completedAt).toLocaleString('zh-CN', {month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'}))}</time></li>`).join('');
  };
  const showRound = ({id, tag, total, mode}) => {
    highlightedId = id;
    tagSelect.value = tag;
    modeSelect.value = mode;
    window.StudyChoices?.sync(modeSelect);
    render(total);
  };
  const record = (round) => {
    if (!valid(round)) return {saved: false, rank: 0};
    const {rows} = read();
    // 同一组结算两次或多次点击，只保留一条成绩。
    const combined = [...rows.filter(row => row.id !== round.id), round];
    const groups = new Map();
    for (const row of combined) {
      const group = JSON.stringify([row.tag, row.total, row.mode]);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(row);
    }
    const kept = [...groups.values()].flatMap(group => group.sort(compare).slice(0, 10));
    let saved = true;
    try { localStorage.setItem(key, JSON.stringify(kept)); } catch (error) { saved = false; }
    showRound(round);
    return {saved, rank: ranked(kept, round.tag, round.total, round.mode).findIndex(row => row.id === round.id) + 1};
  };
  tagSelect.value = root.dataset.tag || '';
  modeSelect.value = root.dataset.mode || 'challenge';
  window.StudyChoices?.sync(modeSelect);
  [tagSelect, sizeSelect, modeSelect].forEach(select => select.addEventListener('change', () => render()));
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) render(); });
  window.OlympiadChallenge = {record, showRound, duration};
  render(initialSize);
})();
