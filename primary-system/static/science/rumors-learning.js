/* 保留第一版的已查证标记，新记录仅保存在本机。 */
(function (root) {
  'use strict';
  const prefix = 'primary.science-rumors.v2.';
  const legacy = 'primary.science-rumors.v1.';
  function createStore(storage) {
    const memory = new Map();
    let available = Boolean(storage);
    function get(key) {
      try { if (available) return storage.getItem(key); } catch { available = false; }
      return memory.get(key) ?? null;
    }
    function put(key, value) {
      memory.set(key, value);
      try { if (available) storage.setItem(key, value); } catch { available = false; }
    }
    function read(slug) {
      let value;
      try { value = JSON.parse(get(prefix + slug)); } catch { /* 损坏记录按空记录读取。 */ }
      value = value && typeof value === 'object' ? value : {};
      const result = {
        saved: value.saved === true, review: value.review === true, quizDone: value.quizDone === true,
        note: typeof value.note === 'string' ? value.note.slice(0, 1000) : '',
        completed: get(legacy + slug) === '1',
      };
      memory.set(prefix + slug, JSON.stringify(result));
      if (result.completed) memory.set(legacy + slug, '1');
      return result;
    }
    function update(slug, changes) {
      const value = {...read(slug), ...changes};
      put(prefix + slug, JSON.stringify(value));
      return value;
    }
    return {
      get available() { return available; }, read,
      judge(slug, correct) {
        if (correct) put(legacy + slug, '1');
        else update(slug, {review: true, quizDone: false});
      },
      practice(slug, correct) { update(slug, {review: !correct, quizDone: correct}); },
      bookmark(slug) { return update(slug, {saved: !read(slug).saved}).saved; },
      saveNote(slug, note) { update(slug, {note: String(note).slice(0, 1000)}); },
      visit(slug) { put(prefix + 'last', slug); }, last() { return get(prefix + 'last'); },
    };
  }
  function selectRound(items, random = Math.random) {
    const ids = [...new Set(items.map(item => item.slug))];
    for (let i = ids.length - 1; i > 0; i--) {
      const target = Math.floor(random() * (i + 1));
      [ids[i], ids[target]] = [ids[target], ids[i]];
    }
    return ids.length ? {ids: ids.slice(0, 5), index: 0, answers: []} : null;
  }
  function restoreRound(raw, deck) {
    try {
      const value = JSON.parse(raw);
      if (!value || !Array.isArray(value.ids) || !Array.isArray(value.answers)) return null;
      const {ids, index, answers} = value;
      if (!ids.length || ids.length > 5 || new Set(ids).size !== ids.length) return null;
      if (!Number.isInteger(index) || index < 0 || index > ids.length) return null;
      if (answers.length !== index && answers.length !== index + 1) return null;
      if (answers.length > ids.length) return null;
      const items = ids.map(slug => deck.find(item => item.slug === slug));
      if (items.some(item => !item)) return null;
      if (!answers.every((answer, i) => items[i].challenge.options.some(option => option.id === answer))) return null;
      return {ids, index, answers};
    } catch { return null; }
  }
  const api = {createStore, selectRound, restoreRound};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RumorLearning = api;
})(typeof window === 'undefined' ? globalThis : window);
