(function (root) {
  'use strict';
  const PREFIX = 'primary.mysteries.v1.';
  const FIELDS = ['observation', 'hypothesis', 'next'];
  function clean(value) {
    const notes = {};
    FIELDS.forEach(field => {
      notes[field] = typeof value?.notes?.[field] === 'string' ? value.notes[field].slice(0, 2000) : '';
    });
    return { saved: value?.saved === true, completed: value?.completed === true, notes };
  }
  function createStore(storage, slugs) {
    const allowed = new Set(slugs), memory = new Map(), unsaved = new Set();
    let available = true;
    function get(key) {
      if (unsaved.has(key)) return memory.get(key);
      try {
        const value = storage.getItem(key);
        memory.set(key, value);
        return value;
      } catch { available = false; return memory.get(key) ?? null; }
    }
    function put(key, value) {
      memory.set(key, value);
      try { storage.setItem(key, value); unsaved.delete(key); }
      catch { available = false; unsaved.add(key); }
    }
    function read(slug) {
      if (!allowed.has(slug)) return clean(null);
      try { return clean(JSON.parse(get(PREFIX + slug))); }
      catch { return clean(null); }
    }
    function toggle(slug, field) {
      if (!allowed.has(slug) || !['saved', 'completed'].includes(field)) return false;
      const value = read(slug);
      value[field] = !value[field];
      put(PREFIX + slug, JSON.stringify(value));
      return value[field];
    }
    return {
      read, toggle,
      get available() { return available; },
      saveNote(slug, field, text) {
        if (!allowed.has(slug) || !FIELDS.includes(field) || typeof text !== 'string') return;
        // Read the latest entry before changing one field, preserving other tabs' notes and flags.
        const value = read(slug);
        value.notes[field] = text.slice(0, 2000);
        put(PREFIX + slug, JSON.stringify(value));
      },
      visit(slug) { if (allowed.has(slug)) put(PREFIX + 'last', slug); },
      last() { const slug = get(PREFIX + 'last'); return allowed.has(slug) ? slug : ''; },
      acceptsEvent(key) { return key === null || key.startsWith(PREFIX); },
    };
  }
  function matchesCase(item, filters, record) {
    const normalize = value => String(value || '').normalize('NFKC').toLowerCase();
    const words = normalize(filters.q).trim().split(/\s+/).filter(Boolean);
    return words.every(word => normalize(item.search).includes(word))
      && (!filters.category || item.category === filters.category)
      && (!filters.kind || item.kinds.includes(filters.kind))
      && (!filters.progress || item.progress === filters.progress)
      && (!filters.status || (filters.status === 'saved' && record.saved)
        || (filters.status === 'completed' && record.completed)
        || (filters.status === 'unread' && !record.completed)
        || (filters.status === 'notes' && Object.values(record.notes).some(note => note.trim())));
  }
  function comparisonIds(value, slugs) {
    const allowed = new Set(slugs);
    return [...new Set(String(value || '').split(','))].filter(slug => allowed.has(slug)).slice(0, 2);
  }
  const api = { createStore, matchesCase, comparisonIds };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MysteryNotebook = api;
})(typeof window !== 'undefined' ? window : globalThis);
