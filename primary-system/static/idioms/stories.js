(() => {
  'use strict';

  const hall = document.querySelector('[data-idiom-hall]');
  if (!hall) return;
  const workspace = hall.querySelector('.hall-workspace');
  const narrowToggle = () => workspace.querySelector('.sl-toggle:not(.sl-collapse)');
  const directory = document.getElementById('hall-directory');
  const results = document.getElementById('hall-results');
  const stories = [...hall.querySelectorAll('[data-hall-story]')];
  const directoryLinks = [...directory.querySelectorAll('[data-hall-jump]')];
  const readingLinks = hall.querySelector('.hall-reading-links');
  const storyByHash = new Map(stories.map(story => ['#' + story.id, story]));
  let current = null, playback = null;

  function focusReading(target) {
    if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen === 'true') narrowToggle().click();
    target.scrollIntoView({block: 'start', behavior: 'instant'});
    target.focus({preventScroll: true});
  }

  function setReadingLink(link, story, prefix) {
    link.hidden = !story;
    if (!story) {
      link.removeAttribute('href');
      return;
    }
    link.href = '#' + story.id;
    link.textContent = prefix + story.querySelector('.story-title').textContent;
  }

  function selectStory(story) {
    if (!story || current === story) return;
    stopSpeech('已停止朗读。', true);
    current = story;
    stories.forEach(card => { card.hidden = card !== story; });
    directoryLinks.forEach(link => {
      if (storyByHash.get(link.hash) === story) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (!readingLinks) return;
    const index = stories.indexOf(story);
    readingLinks.hidden = false;
    setReadingLink(readingLinks.querySelector('[data-hall-previous]'), stories[index - 1], '上一则 · ');
    setReadingLink(readingLinks.querySelector('[data-hall-next]'), stories[index + 1], '下一则 · ');
    readingLinks.querySelector('[data-hall-position]').textContent = (index + 1) + ' / ' + stories.length;
  }

  function restoreLocation(focus = false) {
    const hash = window.location.hash;
    const match = storyByHash.get(hash);
    if (match || !current || !hash || hash === '#hall-results') selectStory(match || stories[0]);
    if (focus && (match || hash === '#hall-results')) focusReading(match || results);
  }

  function stopSpeech(message, cancel = false) {
    if (!playback) return;
    const {button, status} = playback;
    playback = null;
    if (cancel) window.speechSynthesis.cancel();
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '朗读成语与释义';
    status.textContent = message;
  }

  function speak(button) {
    if (playback?.button === button) {
      stopSpeech('已停止朗读。', true);
      return;
    }
    stopSpeech('已停止朗读。', true);
    const status = button.closest('[data-hall-story]').querySelector('[data-hall-speech-status]');
    if (!window.SpeechKit || !window.speechSynthesis) {
      status.textContent = '这台设备暂不支持语音朗读。';
      return;
    }
    const task = {button, status};
    playback = task;
    button.setAttribute('aria-pressed', 'true');
    button.textContent = '停止朗读';
    status.textContent = '正在朗读。';
    window.SpeechKit.speak(button.dataset.hallSay, {
      lang: 'zh-CN',
      onend() { if (playback === task) stopSpeech('朗读完成。'); },
      onerror() { if (playback === task) stopSpeech('这次没有读出来。请检查设备语音后再试。'); },
    });
  }

  const opener = hall.querySelector('[data-hall-directory]');
  if (opener) {
    opener.hidden = false;
    opener.addEventListener('click', () => {
      if (workspace.dataset.slMode === 'compact' && workspace.dataset.slOpen === 'false') narrowToggle().click();
      if (workspace.dataset.slMode === 'wide' && workspace.dataset.slCollapsed === 'true') workspace.querySelector('.sl-collapse').click();
      directory.open = true;
      const summary = directory.querySelector('summary');
      requestAnimationFrame(() => {
        summary.scrollIntoView({block: 'nearest'});
        summary.focus({preventScroll: true});
      });
    });
  }

  hall.querySelectorAll('[data-hall-say]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => speak(button));
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeech('已停止朗读。', true); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') stopSpeech('已停止朗读。', true); });
  window.addEventListener('pagehide', () => stopSpeech('已停止朗读。', true));

  hall.addEventListener('click', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('[data-hall-jump], [data-hall-previous], [data-hall-next]');
    if (!link || !storyByHash.has(link.hash)) return;
    event.preventDefault();
    if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
    restoreLocation(true);
  });
  restoreLocation();
  window.addEventListener('pageshow', () => requestAnimationFrame(() => restoreLocation(true)), {once: true});
  window.addEventListener('hashchange', () => restoreLocation(true));
})();
