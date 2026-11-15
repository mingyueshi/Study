/* 音素原声、跟读与专题导航共用播放生命周期。 */
'use strict';

(() => {
  let current = null;
  let finishCurrent = null;
  const status = document.getElementById('ph-audio-status');

  function stopAudio() {
    if (current) {
      current.onended = null;
      current.onerror = null;
      current.pause();
      current = null;
    }
    if (finishCurrent) { finishCurrent({ok: false, cancelled: true}); finishCurrent = null; }
  }

  function playAudio(url) {
    stopAudio();
    window.TTS?.stopSequence();
    return new Promise((resolve) => {
      const audio = new Audio(url);
      current = audio;
      finishCurrent = resolve;
      const volume = Number(document.getElementById('tts-volume')?.value ?? 1);
      audio.volume = Math.min(1, Math.max(0, volume));
      const finish = (ok) => {
        if (current !== audio) return;
        current = null;
        finishCurrent = null;
        audio.onended = null;
        audio.onerror = null;
        resolve({ok, cancelled: false});
      };
      audio.onended = () => finish(true);
      audio.onerror = () => finish(false);
      audio.play().catch(() => finish(false));
    });
  }
  window.PhoneticsAudio = {play: playAudio, stop: stopAudio};

  // 在共享 TTS 的冒泡监听之前停止音素音频，避免两种声音重叠。
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-say], [data-tts-sequence], [data-ph-stop], [data-ph-restart]')) stopAudio();
  }, true);
  document.getElementById('tts-voice')?.addEventListener('change', stopAudio);
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-audio]');
    if (button) {
      event.preventDefault();
      if (status) status.textContent = '';
      const result = await playAudio(button.dataset.audio);
      if (!result.ok && !result.cancelled) {
        if (status) status.textContent = '音素音频暂时无法播放，改听例词的读音。';
        if (button.dataset.fallback) window.TTS?.speak(button.dataset.fallback);
      }
    }
    if (event.target.closest('[data-ph-stop]')) window.TTS?.resetSequence();
    const restart = event.target.closest('[data-ph-restart]');
    if (restart) {
      window.TTS?.resetSequence();
      restart.closest('.ph-group').querySelector('[data-tts-sequence]').click();
    }
  });

  const nav = document.querySelector('.library-layout .unit-nav');
  const groups = Array.from(document.querySelectorAll('.ph-group'));
  if (!nav || !groups.length) return;
  let activeGroup;
  function activateHash(scroll = false) {
    const target = document.getElementById(location.hash.slice(1));
    const group = target?.closest('.ph-group') || groups[0];
    if (activeGroup !== group) {
      stopAudio();
      window.TTS?.resetSequence();
      activeGroup = group;
      document.dispatchEvent(new CustomEvent('phonetics:groupchange'));
    }
    groups.forEach((item) => { item.hidden = item !== group; });
    nav.querySelectorAll('a').forEach((link) => {
      if (link.getAttribute('href') === `#${group.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (scroll && target) {
      const focus = target === group ? target.querySelector('h2') : target;
      focus.setAttribute('tabindex', '-1');
      focus.focus({preventScroll: true});
      focus.scrollIntoView({block: 'start'});
    }
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
    const hash = link.getAttribute('href');
    if (!document.getElementById(hash.slice(1))?.closest('.ph-group')) return;
    event.preventDefault();
    history.pushState(null, '', hash);
    activateHash(true);
  });
  window.addEventListener('hashchange', () => activateHash(true));
  window.addEventListener('pagehide', stopAudio);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopAudio(); window.TTS?.resetSequence(); }
  });
  activateHash(Boolean(location.hash));
})();
