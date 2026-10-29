/* 成语接龙规则与存档。独立于 DOM，浏览器和 Node 共用。 */
'use strict';

const ChainEngine = (() => {
  const MODES = ['solo', 'partner'];
  const isIdiom = word => /^[\u4e00-\u9fff]{4}$/.test(word);
  const normalize = value => String(value || '').normalize('NFKC').replace(/\s/g, '');
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  const increment = value => Math.min(Number.MAX_SAFE_INTEGER, value + 1);

  function createDictionary(units, definitions, supplements) {
    const byId = new Map();
    const add = record => {
      if (record && isIdiom(record.idiom) && typeof record.zh === 'string' && record.zh.trim()) {
        byId.set(record.idiom, { pinyin: '', example: '', ...record });
      }
    };
    Object.entries(definitions || {}).forEach(([idiom, zh]) => add({ idiom, zh }));
    (supplements || []).forEach(add);
    (units || []).forEach(unit => (unit.idioms || []).forEach(word => add({ ...word, category: unit.name })));
    const entries = [...byId.values()];
    const byFirst = new Map();
    entries.forEach(word => {
      const first = word.idiom[0];
      if (!byFirst.has(first)) byFirst.set(first, []);
      byFirst.get(first).push(word);
    });
    return { entries, byId, byFirst };
  }

  function candidates(dictionary, current, used) {
    return (dictionary.byFirst.get(current.slice(-1)) || []).filter(word => !used.has(word.idiom));
  }

  // 只看有限步数，既避免重复，也优先保留能让孩子继续接的路线。
  function depth(dictionary, current, used, remaining) {
    if (!remaining) return 0;
    let best = 0;
    for (const word of candidates(dictionary, current, used)) {
      used.add(word.idiom);
      best = Math.max(best, 1 + depth(dictionary, word.idiom, used, remaining - 1));
      used.delete(word.idiom);
      if (best === remaining) break;
    }
    return best;
  }

  function ranked(dictionary, current, used) {
    return candidates(dictionary, current, used).map(word => ({
      word, depth: depth(dictionary, word.idiom, new Set([...used, word.idiom]), 3),
    })).sort((a, b) => b.depth - a.depth || Number(!!b.word.pinyin) - Number(!!a.word.pinyin));
  }

  function createGame(dictionary, saved, random) {
    if (!dictionary.entries.length) throw new Error('接龙词库不能为空');
    random = random || Math.random;
    saved = saved && typeof saved === 'object' ? saved : {};
    const mode = MODES.includes(saved.mode) ? saved.mode : 'solo';
    const oldTotals = saved.totals && typeof saved.totals === 'object' ? saved.totals : {};
    const state = {
      mode,
      totals: { accepted: count(oldTotals.accepted), rounds: count(oldTotals.rounds), best: {
        solo: count((oldTotals.best || {}).solo), partner: count((oldTotals.best || {}).partner),
      } },
      round: { trail: [], hinted: [] },
    };
    const starters = dictionary.entries.filter(word => depth(dictionary, word.idiom, new Set([word.idiom]), 4) >= 4);
    const annotated = starters.filter(word => word.pinyin);
    const fallback = dictionary.entries.filter(word => candidates(dictionary, word.idiom, new Set([word.idiom])).length);
    const startPool = annotated.length ? annotated : starters.length ? starters : fallback.length ? fallback : dictionary.entries;
    const choose = pool => pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
    const used = () => new Set(state.round.trail.map(entry => entry.idiom));
    const current = () => state.round.trail[state.round.trail.length - 1].idiom;
    const playerCount = () => state.round.trail.filter(entry => entry.by === 'player').length;

    function newRound(nextMode) {
      const previous = state.round.trail[0] && state.round.trail[0].idiom;
      const pool = startPool.filter(word => word.idiom !== previous);
      state.mode = MODES.includes(nextMode) ? nextMode : state.mode;
      state.round = { trail: [{ idiom: choose(pool.length ? pool : startPool).idiom, by: 'start' }], hinted: [] };
      state.totals.rounds = increment(state.totals.rounds);
    }

    function restoreRound(round) {
      if (!round || !Array.isArray(round.trail) || !round.trail.length || round.trail.length > dictionary.entries.length) return false;
      const seen = new Set();
      for (let i = 0; i < round.trail.length; i++) {
        const entry = round.trail[i];
        const actor = !i ? 'start' : (state.mode === 'solo' || i % 2 === 1 ? 'player' : 'partner');
        if (!entry || !dictionary.byId.has(entry.idiom) || seen.has(entry.idiom) || entry.by !== actor) return false;
        if (i && round.trail[i - 1].idiom.slice(-1) !== entry.idiom[0]) return false;
        seen.add(entry.idiom);
      }
      const last = round.trail[round.trail.length - 1];
      if (state.mode === 'partner' && last.by === 'player' && candidates(dictionary, last.idiom, seen).length) return false;
      state.round = {
        trail: round.trail.map(entry => ({ idiom: entry.idiom, by: entry.by })),
        hinted: [...new Set(Array.isArray(round.hinted) ? round.hinted.filter(idiom => seen.has(idiom)) : [])],
      };
      state.totals.accepted = Math.max(state.totals.accepted, playerCount());
      state.totals.rounds = Math.max(state.totals.rounds, 1);
      state.totals.best[state.mode] = Math.max(state.totals.best[state.mode], playerCount());
      return true;
    }

    if (saved.version !== 1 || !restoreRound(saved.round)) newRound();

    function status() {
      const options = candidates(dictionary, current(), used());
      return { current: dictionary.byId.get(current()), tail: current().slice(-1),
        options, ended: !options.length, playerCount: playerCount(), mode: state.mode,
        hintCount: state.round.hinted.length };
    }

    function submit(value) {
      const word = normalize(value);
      const now = status();
      if (now.ended) return { ok: false, code: 'ended', message: '这条龙暂时接到底啦，换个开头再玩一轮吧。' };
      if (!isIdiom(word)) return { ok: false, code: 'format', message: '请输入一个四字成语，再点「接上它」。' };
      if (used().has(word)) return { ok: false, code: 'repeat', message: '「' + word + '」本轮已经用过了，换一个试试。' };
      if (!dictionary.byId.has(word)) return { ok: false, code: 'unknown', message: '词库暂未收录「' + word + '」，可以看提示换一个试试。' };
      if (word[0] !== now.tail) return { ok: false, code: 'mismatch', message: '这次要以「' + now.tail + '」开头，首尾的字要相同哦。' };

      state.round.trail.push({ idiom: word, by: 'player' });
      state.totals.accepted = increment(state.totals.accepted);
      state.totals.best[state.mode] = Math.max(state.totals.best[state.mode], playerCount());
      let reply = null;
      if (state.mode === 'partner') {
        const options = ranked(dictionary, current(), used());
        if (options.length) {
          const best = options.filter(option => option.depth === options[0].depth);
          reply = choose(best).word.idiom;
          state.round.trail.push({ idiom: reply, by: 'partner' });
        }
      }
      return { ok: true, word, reply, ended: status().ended };
    }

    function hint() {
      if (status().ended) return [];
      if (!state.round.hinted.includes(current())) state.round.hinted.push(current());
      return ranked(dictionary, current(), used()).slice(0, 3).map(option => option.word);
    }

    return { status, submit, hint, newRound,
      snapshot: () => JSON.parse(JSON.stringify({ version: 1, ...state })),
    };
  }

  return { createDictionary, createGame, normalize, candidates, ranked };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = ChainEngine;
