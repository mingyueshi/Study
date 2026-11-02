'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { TECH_UNITS: units } = require('../tech-data.js');
const progress = require('../progress.js');

const defaults = { learned: {}, lastUnit: null, sound: true };
assert.deepEqual(progress.sanitize(null, units), defaults);
assert.deepEqual(progress.sanitize({ learned: ['repository'], lastUnit: 'missing' }, units), defaults);
assert.deepEqual(progress.sanitize({ learned: { repository: true, missing: true, commit: 1 }, lastUnit: 't-ai', sound: false }, units), { learned: { repository: true }, lastUnit: 't-ai', sound: false });
assert.deepEqual(progress.merge({ learned: { repository: true }, lastUnit: 't-dev', sound: false }, { learned: { commit: true }, lastUnit: 't-data', sound: true }, units), { learned: { repository: true, commit: true }, lastUnit: 't-data', sound: true });
assert.equal(progress.merge({ sound: false }, null, units).sound, false);
const dangerous = JSON.parse('{"learned":{"__proto__":true,"repository":true},"lastUnit":"invalid"}');
assert.deepEqual(progress.sanitize(dangerous, units), { learned: { repository: true }, lastUnit: null, sound: true });

function browser(incoming, current, voice, denyWrites = false) {
  const values = new Map();
  if (current !== undefined) values.set(progress.key, JSON.stringify(current));
  if (voice !== undefined) values.set('speech_pref_v1', JSON.stringify({ voice }));
  const fragment = incoming === undefined ? '#cards' : '#' + new URLSearchParams({ 'techlex-migrate': typeof incoming === 'string' ? incoming : JSON.stringify(incoming) });
  let cleaned = false;
  let selectedVoice = '';
  const window = {
    location: { hash: fragment, href: 'file:///study/personal-learning/english/techlex/index.html' + fragment },
    history: { replaceState(_state, _title, url) { cleaned = !url.includes('#'); } },
    localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => { if (denyWrites) throw new Error('storage disabled'); values.set(key, value); } },
    SpeechKit: { setVoicePref(name) { selectedVoice = name; values.set('speech_pref_v1', JSON.stringify({ voice: name })); } },
  };
  const context = vm.createContext({ window, URLSearchParams });
  vm.runInContext(fs.readFileSync(require.resolve('../progress.js'), 'utf8'), context);
  const state = JSON.parse(JSON.stringify(window.LearningProgress.consume(units)));
  return { state, values, cleaned, selectedVoice };
}
let result = browser({ learned: { repository: true }, lastUnit: 't-ai', sound: false, speechVoice: 'Samantha' });
assert.deepEqual(result.state, { learned: { repository: true }, lastUnit: 't-ai', sound: false });
assert.equal(result.selectedVoice, 'Samantha');
assert.equal(result.cleaned, true);
assert.deepEqual(JSON.parse(result.values.get(progress.key)), result.state);

result = browser({ learned: { repository: true }, lastUnit: 't-ai', sound: false, speechVoice: 'Samantha' }, { learned: { commit: true }, lastUnit: 't-testing', sound: true }, 'Daniel');
assert.deepEqual(result.state.learned, { repository: true, commit: true });
assert.equal(result.state.lastUnit, 't-testing');
assert.equal(result.state.sound, true);
assert.equal(result.selectedVoice, '');
assert.equal(JSON.parse(result.values.get('speech_pref_v1')).voice, 'Daniel');

result = browser('{invalid', { learned: { repository: true }, sound: false });
assert.equal(result.state.learned.repository, true);
assert.equal(result.state.sound, false);
assert.equal(result.cleaned, true);

result = browser({ learned: { repository: true }, sound: false }, undefined, undefined, true);
assert.equal(result.state.learned.repository, true, '存储禁用时仍保留内存中的迁移结果');
assert.equal(result.state.sound, false);
assert.equal(result.cleaned, true);
result = browser(undefined, { learned: { commit: true } });
assert.equal(result.state.learned.commit, true);
assert.equal(result.cleaned, false, '普通页内锚点无需清除');
console.log('✅ 进度清理、合并、旧入口接收、语音偏好与存储异常检查通过');
