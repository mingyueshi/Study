/* 只保存开发命令模块的本机记录，与其他学习方向使用不同的键。 */
(function (root) {
  'use strict';
  const key = 'personal_dev_v1';
  function normalize(raw, data) {
    const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const state = { mastered: {}, lastTool: null };
    const ids = new Set();
    data.tools.forEach(tool => tool.groups.forEach(group => group.commands.forEach(command => ids.add(command.id))));
    ids.forEach(id => { if (value.mastered && value.mastered[id] === true) state.mastered[id] = true; });
    if (data.tools.some(tool => tool.id === value.lastTool)) state.lastTool = value.lastTool;
    return state;
  }
  const api = { key, normalize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DevState = api;
})(typeof window !== 'undefined' ? window : globalThis);
