/* TechLex 学习档案：各入口共用，目录迁移时合并已有掌握记录。 */
(function (root) {
  'use strict';
  const KEY = 'techlex_v1';

  function sanitize(value, units) {
    const source = value && typeof value === 'object' ? value : {};
    const learned = {};
    if (source.learned && typeof source.learned === 'object' && !Array.isArray(source.learned)) {
      units.forEach(unit => unit.terms.forEach(word => {
        if (source.learned[word.term] === true) learned[word.term] = true;
      }));
    }
    return {
      learned,
      lastUnit: units.some(unit => unit.id === source.lastUnit) ? source.lastUnit : null,
      sound: source.sound !== false,
    };
  }

  function merge(incoming, current, units) {
    const imported = sanitize(incoming, units);
    const existing = sanitize(current, units);
    return {
      learned: { ...imported.learned, ...existing.learned },
      lastUnit: existing.lastUnit || imported.lastUnit,
      sound: current && typeof current.sound === 'boolean' ? current.sound : imported.sound,
    };
  }

  function load() {
    try { return JSON.parse(root.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }

  function read(units) { return sanitize(load(), units); }

  function consume(units) {
    const current = load();
    let state = sanitize(current, units);
    const params = new URLSearchParams(root.location.hash.slice(1));
    if (!params.has('techlex-migrate')) return state;
    try {
      const incoming = JSON.parse(params.get('techlex-migrate'));
      state = merge(incoming, current, units);
      // 即使浏览器禁止持久化，也把合并后的档案交给页面在内存中使用。
      try { root.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 内存模式 */ }
      if (incoming && typeof incoming.speechVoice === 'string' && incoming.speechVoice.length <= 200) {
        try {
          const pref = JSON.parse(root.localStorage.getItem('speech_pref_v1') || 'null');
          if (!pref || !pref.voice) {
            if (root.SpeechKit) root.SpeechKit.setVoicePref(incoming.speechVoice);
            else root.localStorage.setItem('speech_pref_v1', JSON.stringify({ voice: incoming.speechVoice }));
          }
        } catch (e) { /* 可继续使用默认发音人 */ }
      }
    } catch (e) { /* 损坏的迁移内容不影响原档案 */ }
    try { root.history.replaceState(null, '', root.location.href.split('#')[0]); } catch (e) { /* 不影响学习 */ }
    return state;
  }

  const api = { key: KEY, sanitize, merge, read, consume };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LearningProgress = api;
})(typeof window !== 'undefined' ? window : globalThis);
