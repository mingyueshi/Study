/* ============================================================
   TechLex · 独立语音模块
   - 自动挑选系统中质量较好的英语/中文发音人
   - 支持手动选择发音人并记住（localStorage）
   - 中英文自动分流：中文文本自动用中文发音人
   ============================================================ */
'use strict';

const SPEECH_KEY = 'speech_pref_v1';
const speechPref = { voice: '', zhVoice: '', rate: 1 };
try {
  const saved = JSON.parse(localStorage.getItem(SPEECH_KEY) || '{}');
  for (const key of ['voice', 'zhVoice']) if (typeof saved[key] === 'string') speechPref[key] = saved[key];
  if (typeof saved.rate === 'number' && Number.isFinite(saved.rate)) speechPref.rate = Math.max(.7, Math.min(1.25, saved.rate));
} catch (e) { /* 忽略 */ }

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
let activeUtterance = null;
const voiceListeners = new Set();

function stopSpeech() {
  if (activeUtterance) {
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance = null;
  }
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* 语音不可用 */ }
}

function refreshVoices() {
  try { VOICES = (window.speechSynthesis && window.speechSynthesis.getVoices()) || []; } catch (e) { VOICES = []; }
  voiceListeners.forEach(listener => listener());
}

function likeScore(name, likes) {
  const n = String(name || '').toLowerCase();
  for (let i = 0; i < likes.length; i++) {
    if (n.indexOf(likes[i].toLowerCase()) >= 0) return likes.length - i;
  }
  return 0;
}

function voiceScore(v, likes, preference) {
  let s = 0;
  if (preference && (v.voiceURI === preference || v.name === preference)) s += 1000;
  s += likeScore(v.name, likes) * 10;
  if (/premium|enhanced|elocution|neural/i.test(v.name || '')) s += 8;
  if (v.localService) s += 3;
  if (/compact/i.test(v.voiceURI || '')) s -= 4;
  return s;
}

function pickVoice(kind) {
  const prefix = kind === 'zh' ? 'zh' : 'en';
  const likes = kind === 'zh' ? ZH_VOICE_LIKES : EN_VOICE_LIKES;
  const list = VOICES.filter(v => String(v.lang || '').toLowerCase().replace('_', '-').indexOf(prefix) === 0 && !isNovelty(v));
  if (!list.length) return null;
  const preference = kind === 'zh' ? speechPref.zhVoice : speechPref.voice;
  return list.slice().sort((a, b) => voiceScore(b, likes, preference) - voiceScore(a, likes, preference))[0];
}

/* 朗读：opts = { rate, lang }；中文文本自动使用中文发音人 */
function speak(text, opts) {
  opts = opts || {};
  if (!('speechSynthesis' in window)) {
    if (opts.onerror) opts.onerror();
    return;
  }
  try {
    const textStr = String(text);
    if (!textStr.trim()) return;
    const isZh = /[\u4e00-\u9fff]/.test(textStr) || opts.lang === 'zh-CN';
    const v = pickVoice(isZh ? 'zh' : 'en');
    stopSpeech();
    const u = new SpeechSynthesisUtterance(textStr);
    activeUtterance = u;
    if (v) { u.voice = v; u.lang = v.lang; }
    else u.lang = isZh ? 'zh-CN' : (opts.lang || 'en-US');
    u.rate = Math.max(.4, Math.min(2, (opts.rate != null ? opts.rate : 0.85) * speechPref.rate));
    u.pitch = 1;
    u.onend = () => {
      if (activeUtterance !== u) return;
      activeUtterance = null;
      if (opts.onend) opts.onend();
    };
    u.onerror = event => {
      if (activeUtterance !== u) return;
      activeUtterance = null;
      if (opts.onerror) opts.onerror(event);
    };
    window.speechSynthesis.speak(u);
  } catch (e) {
    stopSpeech();
    if (opts.onerror) opts.onerror(e);
  }
}

function saveSpeechPref() {
  try { localStorage.setItem(SPEECH_KEY, JSON.stringify(speechPref)); } catch (e) { /* 忽略 */ }
}
function setVoicePref(identifier, kind) {
  speechPref[kind === 'zh' ? 'zhVoice' : 'voice'] = typeof identifier === 'string' ? identifier : '';
  saveSpeechPref();
}
function setRatePref(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return;
  speechPref.rate = Math.max(.7, Math.min(1.25, rate));
  saveSpeechPref();
}
function voiceList(kind) {
  const prefix = kind === 'zh' ? 'zh' : 'en';
  const likes = kind === 'zh' ? ZH_VOICE_LIKES : EN_VOICE_LIKES;
  return VOICES
    .filter(v => String(v.lang || '').toLowerCase().startsWith(prefix) && !isNovelty(v))
    .sort((a, b) => (likeScore(b.name, likes) - likeScore(a.name, likes))
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
  speak, stop: stopSpeech, pickVoice, englishVoiceList: () => voiceList('en'), chineseVoiceList: () => voiceList('zh'), setVoicePref, setRatePref, refreshVoices,
  onVoicesChanged(listener) { voiceListeners.add(listener); return () => voiceListeners.delete(listener); },
  get pref() { return speechPref.voice; },
  get zhPref() { return speechPref.zhVoice; },
  get rate() { return speechPref.rate; },
  get voiceCount() { return VOICES.length; },
  get chosenEn() { const v = pickVoice('en'); return v ? v.name : ''; },
  get chosenZh() { const v = pickVoice('zh'); return v ? v.name : ''; },
};
