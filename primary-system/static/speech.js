/* ============================================================
   乐学堂 · 语音模块（练习系统与学习册共用）
   - 自动挑选系统中质量较好的英语/中文发音人
   - 支持手动选择发音人并记住（localStorage）
   - 中英文自动分流：中文文本自动用中文发音人
   本文件由 primary-system 独立维护，不再由 legacy 同步覆盖。
   ============================================================ */
'use strict';

const SPEECH_KEY = 'speech_pref_v1';
const speechPref = { voice: '' };
try { Object.assign(speechPref, JSON.parse(localStorage.getItem(SPEECH_KEY) || '{}')); } catch (e) { /* 忽略 */ }

/* 常见高质量发音人优先级（越靠前越优先） */
const EN_VOICE_LIKES = [
  'samantha', 'ava', 'allison', 'susan', 'zoe', 'google us english',
  'microsoft aria', 'microsoft jenny', 'microsoft zira', 'michael',
  'daniel', 'karen', 'moira', 'tessa', 'fiona', 'serena', 'nicky', 'catherine',
];
const ZH_VOICE_LIKES = [
  'tingting', '婷婷', 'meijia', '美佳', 'sinji', 'xiaoxiao', '晓晓',
  'google 普通话', 'microsoft yao', 'microsoft huihui', 'lili',
];

/* macOS 自带的搞怪/特效语音，不适合学发音，从选择列表里排除 */
const NOVELTY_VOICES = [
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos',
  'good news', 'jester', 'organ', 'superstar', 'trinoids', 'wobble',
  'zarvox', 'whisper', 'junior', 'ralph', 'eddy', 'flo', 'rocko',
  'grandma', 'grandpa', 'sandy', 'shelley', 'bananas', 'haunted',
];
function isNovelty(v) {
  const n = String(v && v.name || '').toLowerCase();
  return NOVELTY_VOICES.some(x => n.indexOf(x) >= 0);
}

let VOICES = [];

function refreshVoices() {
  try { VOICES = (window.speechSynthesis && window.speechSynthesis.getVoices()) || []; } catch (e) { VOICES = []; }
}

function likeScore(name, likes) {
  const n = String(name || '').toLowerCase();
  for (let i = 0; i < likes.length; i++) {
    if (n.indexOf(likes[i].toLowerCase()) >= 0) return likes.length - i;
  }
  return 0;
}

function voiceScore(v, likes) {
  let s = 0;
  if (speechPref.voice && v.name === speechPref.voice) s += 1000;
  s += likeScore(v.name, likes) * 10;
  if (/premium|enhanced|elocution|neural/i.test(v.name || '')) s += 8;
  if (v.localService) s += 3;
  if (/compact/i.test(v.voiceURI || '')) s -= 4;
  return s;
}

function pickVoice(kind) {
  if (!VOICES.length) refreshVoices();
  const prefix = kind === 'zh' ? 'zh' : 'en';
  const likes = kind === 'zh' ? ZH_VOICE_LIKES : EN_VOICE_LIKES;
  const list = VOICES.filter(v => String(v.lang || '').toLowerCase().replace('_', '-').indexOf(prefix) === 0);
  if (!list.length) return null;
  return list.slice().sort((a, b) => voiceScore(b, likes) - voiceScore(a, likes))[0];
}

/* 朗读：opts = { rate, volume, lang, onend, onerror }；回调可选，旧调用保持兼容。 */
function speak(text, opts) {
  opts = opts || {};
  const fail = (error) => {
    if (typeof opts.onerror === 'function') opts.onerror({ error });
    return null;
  };
  if (!('speechSynthesis' in window)) return fail('not-supported');
  try {
    const textStr = String(text);
    if (!textStr.trim()) return fail('empty-text');
    const isZh = /[\u4e00-\u9fff]/.test(textStr) || opts.lang === 'zh-CN';
    const v = pickVoice(isZh ? 'zh' : 'en');
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(textStr);
    if (v) { u.voice = v; u.lang = v.lang; }
    else u.lang = isZh ? 'zh-CN' : (opts.lang || 'en-US');
    u.rate = opts.rate != null ? opts.rate : 0.85;
    u.volume = Number.isFinite(opts.volume) ? Math.max(0, Math.min(1, opts.volume)) : 1;
    u.pitch = 1;
    if (typeof opts.onend === 'function') u.onend = opts.onend;
    if (typeof opts.onerror === 'function') u.onerror = opts.onerror;
    window.speechSynthesis.speak(u);
    return u;
  } catch (e) { return fail('speech-failed'); }
}

function setVoicePref(name) {
  speechPref.voice = name || '';
  try { localStorage.setItem(SPEECH_KEY, JSON.stringify(speechPref)); } catch (e) { /* 忽略 */ }
}

function englishVoiceList() {
  if (!VOICES.length) refreshVoices();
  return VOICES
    .filter(v => /^en/i.test(String(v.lang || '').replace('_', '-')) && !isNovelty(v))
    .sort((a, b) => (likeScore(b.name, EN_VOICE_LIKES) - likeScore(a.name, EN_VOICE_LIKES))
      || String(a.name).localeCompare(String(b.name)));
}

if ('speechSynthesis' in window) {
  refreshVoices();
  if (speechPref.voice && isNovelty({ name: speechPref.voice })) speechPref.voice = ''; // 清掉误选的搞怪语音
  if (typeof window.speechSynthesis.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
}

/* 供页面与自动化测试使用 */
window.SpeechKit = {
  speak, pickVoice, englishVoiceList, setVoicePref, refreshVoices,
  get pref() { return speechPref.voice; },
  get voiceCount() { return VOICES.length; },
  get chosenEn() { const v = pickVoice('en'); return v ? v.name : ''; },
};
