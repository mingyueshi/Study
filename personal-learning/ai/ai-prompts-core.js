/* 开发提示词的路由、填写拼接与本机记录校验。 */
(function (root) {
  'use strict';
  const key = 'personal_ai_prompts_v1';
  function route(hash, data) {
    if (hash === '#prompts') return { view: 'prompts', category: 'all' };
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    if (params.has('category')) return { view: 'prompts', category: data.categories.some(item => item.id === params.get('category')) ? params.get('category') : 'all' };
    if (!params.has('prompt')) return null;
    const item = data.prompts.find(entry => entry.id === params.get('prompt'));
    return item ? { view: 'prompt', item } : { view: 'prompts', category: 'all' };
  }
  function matches(item, query) {
    const haystack = [item.title, item.summary, item.deliverable, ...item.tags, ...item.body].join(' ').toLowerCase();
    return query.toLowerCase().trim().split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
  }
  function build(item, values, rules, data) {
    const fields = new Map(item.fields.map(field => [field.id, field]));
    const body = item.body.map(line => line.replace(/\{\{([a-z][a-z0-9-]*)\}\}/g, (_, id) => typeof values[id] === 'string' && values[id].trim() ? values[id].trim() : '【待填：' + fields.get(id).label + '】')).join('\n');
    return body + (rules ? '\n\n协作约定：\n' + data.commonRules.map((line, index) => (index + 1) + '. ' + line).join('\n') : '');
  }
  function normalize(raw, data) {
    const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const state = { favorites: {}, drafts: {}, lastPrompt: null };
    for (const item of data.prompts) {
      if (value.favorites?.[item.id] === true) state.favorites[item.id] = true;
      const draft = value.drafts?.[item.id];
      if (!draft || typeof draft !== 'object' || Array.isArray(draft)) continue;
      const values = {};
      for (const field of item.fields) if (typeof draft.values?.[field.id] === 'string') values[field.id] = draft.values[field.id].slice(0, 4000);
      state.drafts[item.id] = { values, rules: draft.rules !== false, custom: typeof draft.custom === 'string' ? draft.custom.slice(0, 28000) : null };
    }
    if (data.prompts.some(item => item.id === value.lastPrompt)) state.lastPrompt = value.lastPrompt;
    return state;
  }
  const api = { key, route, matches, build, normalize };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AIPromptsCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
