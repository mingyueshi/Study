/* 实操资料的路由、检索、记录校验与固定练习检查，不调用模型。 */
(function (root) {
  'use strict';
  const key = 'personal_ai_practice_v1';
  function route(hash, guide) {
    if (['#practice', '#models', '#tools'].includes(hash)) return { view: hash.slice(1) };
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    for (const [name, collection, fallback] of [['lab', 'labs', 'practice'], ['model', 'models', 'models'], ['tool', 'tools', 'tools']]) {
      if (!params.has(name)) continue;
      const item = guide[collection].find(entry => entry.id === params.get(name));
      return item ? { view: name, item } : { view: fallback };
    }
    return null;
  }
  function catalog(view) { return ({ lab: 'practice', model: 'models', tool: 'tools' })[view] || view; }
  function matches(item, query) {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const text = [item.name, item.title, item.summary, item.provider, item.category, item.environment, item.firstTask, ...(item.useCases || [])].join(' ').toLowerCase();
    return words.every(word => text.includes(word));
  }
  function normalize(raw, guide) {
    const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const result = { completed: {}, checks: {}, notes: {}, prompts: {}, outputs: {}, lastLab: null };
    for (const lab of guide.labs) {
      if (value.completed && value.completed[lab.id] === true) result.completed[lab.id] = true;
      if (value.checks && Array.isArray(value.checks[lab.id])) result.checks[lab.id] = lab.checks.map((_, index) => value.checks[lab.id][index] === true);
      for (const [field, limit] of [['notes', 4000], ['prompts', 12000], ['outputs', 16000]]) {
        if (value[field] && typeof value[field][lab.id] === 'string') result[field][lab.id] = value[field][lab.id].slice(0, limit);
      }
    }
    if (guide.labs.some(lab => lab.id === value.lastLab)) result.lastLab = value.lastLab;
    return result;
  }
  function prompt(lab) {
    return [...lab.prompt, ...lab.materials.flatMap(material => ['', '练习材料：' + material.title, ...material.lines])].join('\n');
  }
  function validate(lab, text) {
    if (!lab.validation) return { ok: false, messages: ['这项任务请按检查表和参考思路复核。'] };
    let rows;
    try { rows = JSON.parse(text); } catch (error) { return { ok: false, messages: ['JSON 无法解析，请检查标点，并去掉 Markdown 代码围栏。'] }; }
    if (!Array.isArray(rows)) return { ok: false, messages: ['结果必须是 JSON 数组。'] };
    const expected = lab.validation.rows;
    const messages = [];
    if (rows.length !== expected.length) messages.push('应恰好包含 ' + expected.length + ' 条工单。');
    const seen = new Set();
    rows.forEach((row, index) => {
      const prefix = '第 ' + (index + 1) + ' 条：';
      if (!row || Array.isArray(row) || typeof row !== 'object') { messages.push(prefix + '必须是对象。'); return; }
      if (Object.keys(row).sort().join(',') !== 'category,evidence,id' || ['id', 'category', 'evidence'].some(field => typeof row[field] !== 'string')) {
        messages.push(prefix + '只能包含 id、category、evidence 三个字符串字段。'); return;
      }
      const original = expected.find(item => item.id === row.id);
      if (!original || seen.has(row.id)) { messages.push(prefix + '工单编号不存在或重复。'); return; }
      seen.add(row.id);
      if (row.category !== original.category) messages.push(prefix + '分类与原工单不一致，请回到材料核对。');
      const source = lab.materials.flatMap(material => material.lines).find(line => line.startsWith(row.id + '：')) || '';
      const evidence = row.evidence.trim();
      if (evidence.length < 4 || !source.slice(source.indexOf('：') + 1).includes(evidence)) messages.push(prefix + '证据应摘自对应工单，至少四个字符。');
    });
    return { ok: messages.length === 0, messages: messages.length ? messages : ['本练习的结构、编号、分类和原文证据检查通过。请继续按检查表复核。'] };
  }
  const api = { key, route, catalog, matches, normalize, prompt, validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AIPracticeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
