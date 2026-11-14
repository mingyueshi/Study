/* 统一学习反馈：偏好先于页面初始化；第三方撒花只在需要时本地加载。 */
(() => {
  'use strict';
  const KEY = 'study_effects_v1';
  const root = document.documentElement;
  const confettiUrl = document.currentScript?.dataset.confettiUrl;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const defaults = {motion: 'auto', sound: false};
  const clean = (value) => ({
    motion: ['auto', 'gentle', 'off'].includes(value?.motion) ? value.motion : 'auto',
    sound: value?.sound === true,
  });
  let prefs = {...defaults};
  try { prefs = clean(JSON.parse(localStorage.getItem(KEY))); } catch (error) { /* 使用默认设置 */ }
  let loading, burst, canvas, audio, audioTimer, generation = 0;
  const played = new Set(), tones = new Set(), watchers = new Set();
  const motion = () => prefs.motion === 'off' ? 'off' : prefs.motion === 'gentle' || media.matches ? 'gentle' : 'full';
  const visible = (target) => {
    if (document.hidden) return false;
    if (!target) return true;
    const box = target.getBoundingClientRect();
    return target.isConnected && box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight;
  };

  function stopSound() {
    clearTimeout(audioTimer);
    for (const tone of tones) { try { tone.stop(); } catch (error) { /* 已结束 */ } }
    tones.clear();
    if (audio?.state === 'running') audio.suspend().catch(() => {});
  }

  function stop() {
    generation += 1;
    burst?.reset();
    stopSound();
    canvas?.remove();
    canvas = burst = null;
  }

  function sync() {
    root.dataset.studyMotion = motion();
    const select = document.getElementById('study-motion');
    const sound = document.getElementById('study-sound');
    const note = document.getElementById('study-effects-note');
    if (select) select.value = prefs.motion;
    if (sound) sound.checked = prefs.sound;
    if (note) note.textContent = media.matches
      ? '已跟随系统减少动态效果。教学演示仍可逐步查看。'
      : '设置保存在这个浏览器。音效不会打断朗读。';
  }

  function change(value, save = true) {
    prefs = clean(value);
    if (save) { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (error) { /* 本页仍生效 */ } }
    stop();
    sync();
    document.dispatchEvent(new CustomEvent('study:effects-change', {detail: {...prefs, effectiveMotion: motion()}}));
  }

  function canSound() {
    return prefs.sound && !document.hidden && !window.speechSynthesis?.speaking && !window.speechSynthesis?.pending
      && ![...document.querySelectorAll('audio, video')].some(item => !item.paused && !item.ended);
  }

  async function chime() {
    if (!canSound()) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const token = generation;
    try {
      audio ||= new Audio();
      await audio.resume();
      if (token !== generation || !canSound()) { stopSound(); return; }
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        const tone = audio.createOscillator(), volume = audio.createGain();
        const start = audio.currentTime + index * .09;
        tone.frequency.value = frequency;
        volume.gain.setValueAtTime(0, start);
        volume.gain.linearRampToValueAtTime(.035, start + .015);
        volume.gain.exponentialRampToValueAtTime(.001, start + .18);
        tone.connect(volume); volume.connect(audio.destination);
        tones.add(tone);
        tone.onended = () => { tones.delete(tone); tone.disconnect(); volume.disconnect(); };
        tone.start(start); tone.stop(start + .19);
      });
      audioTimer = setTimeout(stopSound, 650);
    } catch (error) { stopSound(); }
  }

  function loadConfetti() {
    if (window.confetti) return Promise.resolve(window.confetti);
    if (!confettiUrl) return Promise.resolve(null);
    if (!loading) loading = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = confettiUrl;
      script.onload = () => resolve(window.confetti || null);
      script.onerror = () => resolve(null);
      document.head.append(script);
    });
    return loading;
  }

  async function celebrate({key, target} = {}) {
    if (key && played.has(key)) return;
    if (key) played.add(key);
    if (!visible(target)) return;
    stop();
    const token = generation;
    void chime();
    if (motion() !== 'full') return;
    try {
      const confetti = await loadConfetti();
      if (!confetti || token !== generation || motion() !== 'full' || !visible(target)) return;
      canvas = document.createElement('canvas');
      canvas.className = 'study-confetti';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.append(canvas);
      burst = confetti.create(canvas, {resize: true, disableForReducedMotion: true});
      await burst({particleCount: 48, spread: 65, startVelocity: 23, ticks: 110,
        origin: {x: .5, y: .65}, colors: ['#ef8354', '#35a99a', '#f3c447', '#6c8ee8']});
      if (token === generation) { canvas?.remove(); canvas = burst = null; }
    } catch (error) { if (token === generation) stop(); }
  }

  // 离屏或切到后台只暂停，不擅自恢复教学演示。
  function watch(target, pause) {
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      if (entries.some(entry => !entry.isIntersecting)) pause();
    }) : null;
    const callback = () => pause();
    observer?.observe(target);
    watchers.add(callback);
    return () => { observer?.disconnect(); watchers.delete(callback); };
  }

  window.StudyEffects = {celebrate, stop, stopSound, watch,
    setPreferences: (value) => change({...prefs, ...value}),
    get preferences() { return {...prefs}; }, get motion() { return motion(); }};
  sync();
  media.addEventListener('change', () => change(prefs, false));
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    try { change(JSON.parse(event.newValue), false); } catch (error) { change(defaults, false); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); watchers.forEach(pause => pause()); }
  });
  window.addEventListener('pagehide', () => { stop(); watchers.forEach(pause => pause()); });
  document.addEventListener('play', stopSound, true);
  document.addEventListener('DOMContentLoaded', () => {
    sync();
    const settings = document.getElementById('study-effects-settings');
    if (!settings) return;
    settings.hidden = false;
    document.getElementById('study-motion').addEventListener('change', event => change({...prefs, motion: event.target.value}));
    document.getElementById('study-sound').addEventListener('change', event => change({...prefs, sound: event.target.checked}));
    settings.addEventListener('keydown', event => {
      if (event.key === 'Escape') { settings.open = false; settings.querySelector('summary').focus(); }
    });
    document.addEventListener('click', event => { if (!settings.contains(event.target)) settings.open = false; });
  });
})();
