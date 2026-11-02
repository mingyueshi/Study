/* 地理漫游：本目录独立运行，不读取或改写原版页面。 */
(() => {
  'use strict';
  const chapters = window.GEO_CHAPTERS || [];
  const media = window.GEO_MEDIA || {};
  const films = window.GEO_FILMS || [];
  const root = document.querySelector('.geography-topic');
  if (!root) return;
  const assetBase = document.currentScript?.src ? new URL('.', document.currentScript.src) : new URL('.', location.href);
  const $ = id => root.querySelector(`#${id}`);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if (!chapters.length || !media.earth) {
    $('story-title').textContent = '地理手册还没装好，请确认整个文件夹已完整保存。';
    return;
  }
  const storageKey = 'geo-explorer-passport-v1';
  let completed = new Set();
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) completed = new Set(saved.filter(id => chapters.some(c => c.id === id)));
  } catch { storageAvailable = false; }
  let active = chapters.find(c => c.id === location.hash.slice(1)) || chapters.find(c => c.id === 'earth') || chapters[0];
  let filter = active.id;
  let quizSolved = false;
  let toastTimer;
  let speaking = false;
  const imageOf = key => media[key] || media.earth;
  const setImage = (id, entry) => {
    const img = $(id);
    img.src = entry.src;
    img.alt = entry.alt || '';
  };
  const setLink = (id, url) => {
    const link = $(id);
    link.href = url || '#';
    link.hidden = !url;
  };
  const toast = message => {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3200);
  };
  const openDialog = id => {
    const dialog = $(id);
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
  };
  root.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.close-dialog')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => {
      // Search inputs can consume Escape to clear text; keep closing consistent.
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dialog.close();
      }
    }, true);
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  });
  function renderNav() {
    $('station-nav').innerHTML = chapters.map(c => `<button class="station-button" data-chapter="${c.id}" aria-pressed="${c.id === active.id}" aria-controls="story"><span class="station-number">${c.no}</span><span class="station-title">${escape(c.title)}</span><span class="station-period">${escape(c.period)}</span>${completed.has(c.id) ? '<span class="station-completed" aria-label="已获得印章">✓</span>' : ''}</button>`).join('');
    $('stamp-count').textContent = completed.size;
    $('open-passport').setAttribute('aria-label', `我的足迹，已收集${completed.size}枚印章`);
  }
  function stopSpeaking() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    speaking = false;
    $('read-story').querySelector('span').textContent = '听本章讲解';
    $('read-story').setAttribute('aria-pressed', 'false');
  }
  function selectChapter(id, scroll = false) {
    const chapter = chapters.find(c => c.id === id);
    if (!chapter) return;
    stopSpeaking();
    active = chapter;
    root.dataset.chapter = active.id;
    renderNav();
    $('story-number').textContent = `${active.no} / 08`;
    $('story-tag').textContent = active.tagline;
    $('story-period').textContent = active.period;
    $('story-title').textContent = active.headline.replace('，', '，\n');
    $('story-intro').textContent = active.intro;
    const picture = imageOf(active.imageKey);
    setImage('story-image', picture);
    $('story-image-label').textContent = active.title;
    $('story-image-caption').textContent = picture.caption;
    setLink('story-image-source', picture.source);
    $('takeaways').innerHTML = active.takeaways.map(t => `<li><strong>${escape(t.label)}</strong><p>${escape(t.text)}</p></li>`).join('');
    $('story-mission').textContent = active.mission;
    const scene = imageOf(active.artifactKey);
    setImage('scene-image', scene);
    setImage('zoom-image', scene);
    $('scene-title').textContent = active.artifactTitle;
    $('scene-date').textContent = active.artifactDate;
    $('scene-look').textContent = active.artifactLook;
    $('scene-fact').textContent = active.artifactFact;
    setLink('scene-source', scene.source);
    $('zoom-caption').textContent = `${scene.caption} · ${scene.credit}`;
    $('scene-clue').hidden = true;
    $('reveal-clue').setAttribute('aria-expanded', 'false');
    $('reveal-clue').querySelector('.clue-icon').textContent = '＋';
    $('reveal-clue').querySelector('span:last-child').textContent = '打开风景里的线索';
    const gallery = [chapters[2], chapters[4], chapters[6]].filter(c => c.id !== active.id);
    if (gallery.length < 3) gallery.push(chapters[7]);
    $('scene-mini-gallery').innerHTML = gallery.map(c => `<button class="scene-mini" data-exhibit="${c.id}" aria-label="换看${escape(c.artifactTitle)}" title="${escape(c.artifactTitle)}"><img src="${escape(imageOf(c.artifactKey).src)}" alt="${escape(c.artifactTitle)}" loading="lazy"></button>`).join('');
    $('quiz-question').textContent = active.quiz.question;
    $('quiz-options').innerHTML = active.quiz.options.map((option, i) => `<button class="quiz-option" data-answer="${i}"><b aria-hidden="true">${String.fromCharCode(65 + i)}</b><span>${escape(option)}</span></button>`).join('');
    quizSolved = false;
    $('quiz-feedback').textContent = completed.has(active.id) ? '这一站的印章已经在护照里啦。也可以再答一遍，巩固发现。' : '';
    $('collect-stamp').hidden = true;
    $('collect-stamp').disabled = false;
    $('collect-stamp').innerHTML = '收下这一站的印章 <span aria-hidden="true">✳</span>';
    $('pocket-tags').innerHTML = active.cards.slice(0, 3).map(c => `<span>${escape(c.title)}</span>`).join('');
    const next = chapters[(chapters.indexOf(active) + 1) % chapters.length];
    $('next-chapter-name').textContent = next.title;
    $('story').classList.remove('is-changing');
    void $('story').offsetWidth;
    $('story').classList.add('is-changing');
    if (scroll) $('story').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  $('station-nav').addEventListener('click', event => {
    const button = event.target.closest('[data-chapter]');
    if (!button) return;
    const index = chapters.findIndex(c => c.id === button.dataset.chapter);
    selectChapter(button.dataset.chapter);
    // Keep keyboard focus on the button after rebuilding the navigation.
    $('station-nav').children[index]?.focus({preventScroll: true});
  });
  $('scene-mini-gallery').addEventListener('click', event => {
    const button = event.target.closest('[data-exhibit]');
    if (button) { selectChapter(button.dataset.exhibit); $('fieldwork').scrollIntoView({behavior: 'smooth'}); $('zoom-scene').focus({preventScroll: true}); }
  });
  root.querySelector('.hero-note a').addEventListener('click', event => {
    event.preventDefault();
    selectChapter('earth', true);
  });
  $('reveal-clue').addEventListener('click', () => {
    const open = $('scene-clue').hidden;
    $('scene-clue').hidden = !open;
    $('reveal-clue').setAttribute('aria-expanded', String(open));
    $('reveal-clue').querySelector('.clue-icon').textContent = open ? '−' : '＋';
    $('reveal-clue').querySelector('span:last-child').textContent = open ? '收起风景里的线索' : '打开风景里的线索';
  });
  $('zoom-scene').addEventListener('click', () => openDialog('zoom-dialog'));
  $('read-story').addEventListener('click', () => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      toast('这个浏览器暂不支持朗读，可以和家人一起读这段讲解。'); return;
    }
    if (speaking) { stopSpeaking(); return; }
    const utterance = new SpeechSynthesisUtterance(`${active.title}。${active.intro}。${active.takeaways.map(t => `${t.label}。${t.text}`).join('。')}`);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    const chineseVoice = speechSynthesis.getVoices().find(v => /zh[-_]CN/i.test(v.lang));
    if (chineseVoice) utterance.voice = chineseVoice;
    utterance.onend = () => stopSpeaking();
    utterance.onerror = () => { stopSpeaking(); toast('朗读暂时不可用，请检查设备的中文语音设置。'); };
    speaking = true;
    $('read-story').querySelector('span').textContent = '停止朗读';
    $('read-story').setAttribute('aria-pressed', 'true');
    speechSynthesis.speak(utterance);
  });
  $('quiz-options').addEventListener('click', event => {
    const button = event.target.closest('[data-answer]');
    if (!button || quizSolved) return;
    const index = Number(button.dataset.answer);
    $('quiz-options').querySelectorAll('button').forEach(b => { b.classList.remove('is-wrong'); b.removeAttribute('aria-pressed'); });
    button.setAttribute('aria-pressed', 'true');
    if (index !== active.quiz.answer) {
      button.classList.add('is-wrong');
      $('quiz-feedback').textContent = '再想一想，回头看看本章的线索，然后再试一次。';
      return;
    }
    quizSolved = true;
    button.classList.add('is-right');
    $('quiz-feedback').textContent = active.quiz.explanation;
    if (completed.has(active.id)) $('quiz-feedback').textContent += ' 这一站的印章已收好。';
    else $('collect-stamp').hidden = false;
  });
  $('collect-stamp').addEventListener('click', () => {
    if (!quizSolved || completed.has(active.id)) return;
    completed.add(active.id);
    try { localStorage.setItem(storageKey, JSON.stringify([...completed])); } catch { storageAvailable = false; }
    renderNav();
    $('collect-stamp').innerHTML = '印章已装进护照 <span aria-hidden="true">✓</span>';
    $('collect-stamp').disabled = true;
    toast(storageAvailable ? `已收下“${active.title}”印章！继续保持好奇。` : '印章已收下！当前浏览器无法保存，关闭页面后足迹会消失。');
  });
  $('next-chapter').addEventListener('click', () => {
    selectChapter(chapters[(chapters.indexOf(active) + 1) % chapters.length].id, true);
    $('story-title').tabIndex = -1;
    $('story-title').focus({preventScroll: true});
  });
  function renderPocket() {
    const query = $('knowledge-search').value.trim().toLocaleLowerCase();
    const results = chapters.filter(c => filter === 'all' || c.id === filter).flatMap(chapter => chapter.cards.map(card => ({chapter, card}))).filter(({chapter, card}) => !query || `${chapter.title}${card.title}${card.text}${card.remember}`.toLocaleLowerCase().includes(query));
    $('pocket-filter').innerHTML = [{id: 'all', title: '全部主题'}, ...chapters].map(c => `<button data-filter="${c.id}" aria-pressed="${filter === c.id}">${escape(c.title)}</button>`).join('');
    $('result-count').textContent = `找到 ${results.length} 条知识线索${query ? ` · “${$('knowledge-search').value.trim()}”` : ''}`;
    $('knowledge-results').innerHTML = results.length ? results.map(({chapter, card}) => `<article class="knowledge-card"><p class="card-topic">${chapter.no} / ${escape(chapter.title)}</p><h3>${escape(card.title)}</h3><p>${escape(card.text)}</p><p class="remember">小口令 · ${escape(card.remember)}</p></article>`).join('') : '<p class="empty-state">还没找到这条线索。试试更短的词，或换到“全部主题”。</p>';
  }
  function openPocket(all = false) {
    filter = all ? 'all' : active.id;
    $('knowledge-search').value = '';
    renderPocket();
    openDialog('pocket-dialog');
    if (all) $('knowledge-search').focus();
  }
  ['open-pocket', 'open-chapter-cards'].forEach(id => $(id).addEventListener('click', () => openPocket()));
  $('open-search').addEventListener('click', () => openPocket(true));
  $('knowledge-search').addEventListener('input', renderPocket);
  $('pocket-filter').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    renderPocket();
    $('pocket-filter').querySelector(`[data-filter="${filter}"]`)?.focus({preventScroll: true});
  });
  function renderPassport() {
    $('passport-progress-text').textContent = `${completed.size} / 8 站已盖章`;
    $('passport-progress').value = completed.size;
    $('passport-progress').setAttribute('aria-label', `已收集${completed.size}枚，共8枚探索印章`);
    $('passport-grid').innerHTML = chapters.map(c => `<button class="passport-stamp ${completed.has(c.id) ? 'done' : ''}" data-passport="${c.id}" aria-label="${escape(c.title)}，${completed.has(c.id) ? '已获得印章' : '尚未获得，前往探索'}"><strong>${c.no}</strong><span>${escape(c.title)}</span><small>${completed.has(c.id) ? '已留下足迹 ✓' : '等待你的发现'}</small></button>`).join('');
    $('storage-note').textContent = storageAvailable ? '足迹保存在这个浏览器里。下次还可以接着探索。' : '当前浏览器无法保存足迹，关闭页面后记录会消失。';
  }
  $('open-passport').addEventListener('click', () => { renderPassport(); openDialog('passport-dialog'); });
  $('passport-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-passport]');
    if (!button) return;
    $('passport-dialog').close();
    selectChapter(button.dataset.passport, true);
  });
  setImage('hero-image', media.earth);
  const video = media.video;
  if (video?.src) {
    const player = document.createElement('video');
    player.controls = true;
    player.preload = 'metadata';
    player.playsInline = true;
    player.poster = video.poster;
    player.src = video.src;
    player.setAttribute('aria-label', video.title);
    const fallback = document.createElement('a');
    fallback.href = video.src;
    fallback.textContent = '浏览器不支持这个视频格式，点此打开原始短片。';
    player.append(fallback);
    $('film-container').append(player);
    player.addEventListener('error', () => {
      const hint = document.createElement('p');
      hint.className = 'video-error';
      hint.innerHTML = '当前浏览器未能播放短片，<a target="_blank" rel="noopener noreferrer">点击查看来源页面 ↗</a>';
      hint.querySelector('a').href = video.source;
      if (!$('film-container').querySelector('.video-error')) $('film-container').append(hint);
    });
    $('film-title').textContent = video.title;
    $('film-caption').textContent = video.caption;
    setLink('film-source', video.source);
  }
  $('film-links').innerHTML = films.map((film, i) => `<a class="film-link" href="${escape(film.url)}" target="_blank" rel="noopener noreferrer"><span class="film-thumbnail"><img src="${escape(film.poster || imageOf(film.imageKey).src)}" alt="相关自然景观，非节目截图" loading="lazy"><span aria-hidden="true">▷</span></span><span class="film-link-copy"><strong>${escape(film.title)}</strong><p>${escape(film.question || film.description)}</p><em>${escape(film.source)}${film.duration ? ` · ${escape(film.duration)}` : ''} · 前往观看 ↗</em></span><span class="film-link-arrow" aria-hidden="true">↗</span></a>`).join('');
  const seenSources = new Set();
  root.querySelectorAll('.source-docs a').forEach(link => {
    link.href = new URL(link.getAttribute('href'), assetBase).href;
  });
  $('source-list').innerHTML = Object.values(media).filter(item => {
    if (!item.source || seenSources.has(item.source)) return false;
    seenSources.add(item.source); return true;
  }).map(item => `<div class="source-item"><strong>${escape(item.title || item.alt)}</strong><p>${escape(item.credit)}</p><a href="${escape(item.source)}" target="_blank" rel="noopener noreferrer">查看素材原始记录 ↗</a></div>`).join('');
  $('open-sources').addEventListener('click', () => openDialog('sources-dialog'));
  window.addEventListener('pagehide', stopSpeaking);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopSpeaking(); root.querySelector('video')?.pause(); } });
  selectChapter(active.id);
})();
