/* 查询与深链接规则，供页面和校验共用。 */
(function (root) {
  'use strict';
  function route(hash, data) {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const tool = data.tools.find(item => item.id === params.get('tool')) || null;
    const group = tool && tool.groups.find(item => item.id === params.get('group')) || null;
    const command = tool && tool.groups.flatMap(item => item.commands).find(item => item.id === params.get('command')) || null;
    return { tool, group, command };
  }
  function select(data, options) {
    const words = (options.query || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
    return data.tools.filter(tool => !options.toolId || (words.length && options.scope === 'all') || tool.id === options.toolId).map(tool => ({
      tool,
      groups: tool.groups.map(group => ({
        ...group,
        commands: group.commands.filter(command => {
          const mastered = options.mastered[command.id] === true;
          if (options.mastery === 'mastered' && !mastered) return false;
          if (options.mastery === 'unmastered' && mastered) return false;
          const text = [tool.name, group.name, command.cmd, command.desc, command.example || '', command.note || ''].join(' ').toLowerCase();
          return words.every(word => text.includes(word));
        })
      })).filter(group => group.commands.length)
    })).filter(section => section.groups.length);
  }
  const api = { route, select };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DevCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
