/* 验证连续朗读依赖的完成、取消与错误回调，不调用真实语音服务。 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

let spoken;
let cancelled = 0;
let availableVoices = [];
const voiceEvents = {};
const preferences = new Map();
const synthesis = {
  getVoices: () => availableVoices,
  addEventListener(name, listener) { voiceEvents[name] = listener; },
  cancel() { cancelled++; },
  speak(utterance) { spoken = utterance; },
};
const context = {
  localStorage: { getItem: key => preferences.get(key) || null, setItem: (key, value) => preferences.set(key, value) },
  window: { speechSynthesis: synthesis },
  SpeechSynthesisUtterance: function (text) { this.text = text; },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(require.resolve('../speech.js'), 'utf8'), context);
const speech = context.window.SpeechKit;
let completed = 0;
let failed = 0;
speech.speak('repository', { lang: 'en-US', onend: () => completed++ });
assert.equal(spoken.lang, 'en-US');
assert.equal(spoken.text, 'repository');
const previous = spoken;
const previousEnd = previous.onend;
spoken.onend();
assert.equal(completed, 1);

speech.speak('代码仓库', { onend: () => completed++ });
assert.equal(spoken.lang, 'zh-CN');
const cancelledEnd = spoken.onend;
speech.stop();
assert.equal(spoken.onend, null);
cancelledEnd();
assert.equal(completed, 1, '取消后不能启动下一段朗读');

speech.speak('unit test', { onend: () => completed++, onerror: () => failed++ });
previousEnd();
assert.equal(completed, 1, '旧朗读的延迟事件不能影响新朗读');
spoken.onerror({ error: 'synthesis-failed' });
assert.equal(failed, 1);
assert.equal(completed, 1);

synthesis.speak = () => { throw new Error('unavailable'); };
speech.speak('fallback', { onerror: () => failed++ });
assert.equal(failed, 2, '语音服务抛错时也要通知调用方停止连读');
assert.ok(cancelled >= 4);

// 语音列表可能延迟加载；选择必须用于实际 utterance，中英设置互不覆盖。
let voiceChanges = 0;
speech.onVoicesChanged(() => voiceChanges++);
const english = { name: 'Daniel', voiceURI: 'system:daniel', lang: 'en-GB', localService: true };
const chinese = { name: 'Xiaoxiao', voiceURI: 'system:xiaoxiao', lang: 'zh-CN', localService: false };
availableVoices = [english, chinese, { name: 'Bubbles', voiceURI: 'bubbles', lang: 'en-US' }];
voiceEvents.voiceschanged();
assert.equal(voiceChanges, 1);
assert.equal(speech.englishVoiceList().length, 1, '特效语音不能进入学习发音列表');
assert.equal(speech.chineseVoiceList().length, 1);
speech.setVoicePref(english.voiceURI);
speech.setVoicePref(chinese.voiceURI, 'zh');
speech.setRatePref(1.15);
synthesis.speak = utterance => { spoken = utterance; };
speech.speak('repository', { rate: .8 });
assert.equal(spoken.voice, english);
assert.equal(spoken.lang, 'en-GB');
assert.ok(Math.abs(spoken.rate - .92) < 1e-10, '点读与连读传入的语速都会应用所选倍率');
speech.speak('代码仓库');
assert.equal(spoken.voice, chinese);
assert.equal(speech.pref, english.voiceURI);
assert.equal(speech.zhPref, chinese.voiceURI);
const saved = JSON.parse(preferences.get('speech_pref_v1'));
assert.equal(saved.voice, english.voiceURI);
assert.equal(saved.zhVoice, chinese.voiceURI);
assert.equal(saved.rate, 1.15);
speech.setVoicePref('Daniel');
assert.equal(speech.pickVoice('en'), english, '兼容旧档案中按名称保存的语音');
speech.setVoicePref('unavailable-voice');
assert.equal(speech.pickVoice('en'), english, '已移除的语音应回退可用发音人');
availableVoices = [{ name: 'Bubbles', voiceURI: 'bubbles', lang: 'en-US' }];
voiceEvents.voiceschanged();
assert.equal(speech.pickVoice('en'), null, '自动推荐同样排除特效语音');
speech.setRatePref(NaN);
assert.equal(speech.rate, 1.15);
console.log('✅ 语音回调、中英发音人选择、异步列表、语速、旧档案与回退检查通过');
