/* History notes: core facts, comparisons and source analysis lead each lesson. */
(() => {
  'use strict';
  const root = document.querySelector('.history-topic');
  if (!root) return;
  const $ = id => root.querySelector(`#${id}`);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const assetBase = document.currentScript?.src ? new URL('.', document.currentScript.src) : new URL('.', location.href);
  const asset = name => new URL(name, assetBase).href;
  const media = window.HISTORY_MEDIA || {};
  const films = window.HISTORY_FILMS || [];
  const diagrams = window.HISTORY_DIAGRAMS || {};
  const lessonMap = new Map([...(window.HISTORY_LESSONS_FOUNDATIONS || []), ...(window.HISTORY_LESSONS_DYNASTIES || [])].map(l => [l.id, l]));
  const chapters = (window.HISTORY_CHAPTERS || []).map(c => ({...c, lessonIds: c.lessonIds || c.cards?.map(l => l.id) || []}));
  const compactLayout = matchMedia('(max-width: 899px)');
  const directoryDetails = root.querySelector('.knowledge-directory > details');
  directoryDetails.open = !compactLayout.matches;
  compactLayout.addEventListener('change', event => { directoryDetails.open = !event.matches; });
  const ordered = chapters.flatMap(c => c.lessonIds.map(id => lessonMap.get(id))).filter(Boolean);
  if (ordered.length !== 37) {
    $('lessons').innerHTML = '<p class="notice">知识文件尚未完整加载。请确认已保存整个目录，并重新打开页面。</p>';
    return;
  }
  // Pre-compute a lowercase searchable text blob per lesson so search input does not
  // re-serialize 37 objects on every keystroke.
  const searchIndex = new Map(ordered.map(l => [l.id,
    [l.title, l.definition, l.essentials.join(' '), l.formula || '',
      JSON.stringify(l.comparison), JSON.stringify(l.example), JSON.stringify(l.misconception)]
      .join(' ').toLocaleLowerCase()]));
  const chapterOf = id => chapters.find(c => c.lessonIds.includes(id));
  const key = 'history-knowledge-progress-v1';
  let completed = new Set(), storageOK = true;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) completed = new Set(saved.filter(id => lessonMap.has(id)));
  } catch { storageOK = false; }
  const sessionAnswers = new Map();
  const hashLesson = location.hash.replace(/^#lesson-/, '');
  let active = chapterOf(hashLesson) || chapters.find(c => c.id === location.hash.slice(1)) || chapters[0];
  let speakingId = null, utterance = null, statusTimer, previousOverflow = '';
  const audioClips = {
    'hu1-2': {name:'chronology', title:'公元纪年与世纪换算'},
    'hu5-1': {name:'qin-system', title:'秦朝统一与郡县制度'},
    'hu5-3': {name:'silk-road', title:'丝绸之路的网络与交流'},
    'hu8-1': {name:'inventions', title:'四大发明的演进与区别'}
  };
  const labs = {route:'丝绸之路交流示意', glyph:'象形字与现代汉字', paper:'造纸主要工序'};
  const status = message => {
    $('status-message').textContent = message;
    $('status-message').classList.add('visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => $('status-message').classList.remove('visible'), 3600);
  };
  function stopSpeaking() {
    const wasSpeaking = Boolean(speakingId);
    speakingId = null; utterance = null;
    if (wasSpeaking && 'speechSynthesis' in window) speechSynthesis.cancel();
    root.querySelectorAll('[data-read]').forEach(b => { b.setAttribute('aria-pressed','false'); b.textContent='朗读要点'; });
  }
  function pauseMedia(except) {
    root.querySelectorAll('audio,video').forEach(player => { if (player !== except) player.pause(); });
  }
  root.addEventListener('play', event => { pauseMedia(event.target); stopSpeaking(); }, true);
  function openDialog(id) {
    root.querySelectorAll('dialog[open]').forEach(d => d.close());
    previousOverflow = document.body.style.overflow;
    $(id).showModal();
    document.body.style.overflow = 'hidden';
  }
  root.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dialog.close(); } }, true);
    dialog.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.id === 'video-dialog') $('observation-video').pause();
      if (dialog.id === 'lab-dialog') $('lab-tab-route')?.click(); // tab switching stops the Silk Road animation timer
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  });
  root.querySelectorAll('[data-local-doc]').forEach(link => { link.href = asset(link.getAttribute('href')); link.target='_blank'; link.rel='noopener noreferrer'; });
  function numberOf(id) {
    const c = chapterOf(id);
    return `${c.no}.${String(c.lessonIds.indexOf(id)+1).padStart(2,'0')}`;
  }
  function renderNav() {
    $('chapter-nav').innerHTML = chapters.map(c => `<div class="chapter-group"><button class="chapter-select" data-chapter="${c.id}"${c.id===active.id?' aria-current="page"':''}><span class="chapter-number">${c.no}</span>${esc(c.title)}<small>${c.lessonIds.length} 点</small></button>${c.id===active.id?`<div class="directory-lessons">${c.lessonIds.map(id=>`<a href="#lesson-${id}" data-jump="${id}"><span>${numberOf(id)}</span>${esc(lessonMap.get(id).title)}</a>`).join('')}</div>`:''}</div>`).join('');
    $('progress-count').textContent = `${completed.size} / 37`;
  }
  function resources(l) {
    const picture = l.imageKey && media[l.imageKey];
    const clip = audioClips[l.id];
    const film = Number.isInteger(l.film) ? films[l.film] : null;
    return `<aside class="lesson-resources" aria-label="${esc(l.title)}的辅助资料"><p class="resource-label">配套图像与资料</p>${picture?`<figure class="resource-figure"><button class="resource-image" data-image="${esc(l.imageKey)}" aria-label="放大：${esc(picture.alt)}"><img src="${esc(picture.src)}" alt="${esc(picture.alt)}" loading="lazy" width="640" height="430"></button><figcaption>${esc(l.imageCaption || picture.caption)}<br><a class="resource-image-source" href="${esc(picture.source)}" target="_blank" rel="noopener noreferrer">原图及拍摄说明 ↗</a></figcaption></figure>`:''}<div class="resource-links-block">${l.lab && labs[l.lab]?`<button class="resource-action" data-lab="${l.lab}">动画：${labs[l.lab]}<span aria-hidden="true">↗</span></button>`:''}${l.id==='hu5-2'?'<button class="resource-action" data-video>视频：汉长城遗址实拍<span aria-hidden="true">▷</span></button>':''}${film?`<a class="resource-action" href="${esc(film.url)}" target="_blank" rel="noopener noreferrer">影片：${esc(film.title)}<span aria-hidden="true">↗</span></a>`:''}${l.film===2?'<p class="small-note">影片展示陕西历史博物馆藏品；配图为中国国家博物馆藏品，两者不是同一件器物。</p>':''}</div>${clip?`<div class="local-audio"><strong>音频｜${esc(clip.title)}</strong><p>知识摘要 · 中文语音合成，可离线播放</p><audio controls preload="metadata" src="${asset(`assets/audio/${clip.name}.m4a`)}" aria-label="${esc(clip.title)}讲解音频"></audio><a class="resource-image-source" href="${asset(`assets/audio/${clip.name}.txt`)}" target="_blank" rel="noopener noreferrer">音频文字稿 ↗</a></div>`:''}<div class="resource-links-block"><p class="resource-label">延伸阅读与核对</p><ul class="reference-list">${l.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a><span class="source-type">原始机构资料 · 需要联网</span></li>`).join('')}</ul></div></aside>`;
  }
  function renderLesson(l) {
    const diagram = diagrams[l.id];
    const figure = typeof diagram === 'function' ? diagram() : diagram;
    const done = completed.has(l.id);
    const selected = sessionAnswers.get(l.id);
    const knownCorrect = done || selected === l.quiz.answer;
    return `<article class="lesson" id="lesson-${l.id}" aria-labelledby="title-${l.id}" tabindex="-1"><header class="lesson-heading"><div><p class="lesson-kicker">知识点 ${numberOf(l.id)}</p><h3 id="title-${l.id}">${esc(l.title)}</h3></div><button class="lesson-read" data-read="${l.id}" aria-pressed="false" aria-label="朗读：${esc(l.title)}">朗读要点</button></header><div class="lesson-layout"><div class="lesson-main"><p class="definition"><strong>概念 / 核心史实</strong>${esc(l.definition)}</p><h4 class="lesson-subheading">必须掌握</h4><ul class="essentials">${l.essentials.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>${l.facts?.length?`<dl class="facts-grid">${l.facts.map(f=>`<div class="fact"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>`:''}${l.formula?`<h4 class="lesson-subheading">纪年 / 计算规则</h4><div class="formula">${esc(l.formula)}</div>`:''}${l.comparison?`<h4 class="lesson-subheading">年代与知识对比</h4><div class="table-scroll" role="region" aria-label="${esc(l.title)}对比表" tabindex="0"><table><thead><tr>${l.comparison.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${l.comparison.rows.map(row=>`<tr>${row.map((cell,i)=>i===0?`<th scope="row">${esc(cell)}</th>`:`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}${figure?`<div class="lesson-diagram">${figure}<p class="diagram-note">配套知识图解 · 比例与范围见图内标注；关系示意不表示疆域或国力</p></div>`:''}<section class="worked-example"><h4>例题 / 史料分析</h4><p class="example-question">${esc(l.example.question)}</p><details class="example-solution"><summary>展开分析与答案</summary><ol class="example-steps">${l.example.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="example-answer">答案：${esc(l.example.answer)}</p></details></section><section class="misconception"><h4>易错辨析</h4><p class="incorrect">误区：${esc(l.misconception.wrong)}</p><p>正确：${esc(l.misconception.right)}</p></section></div>${resources(l)}</div><details class="lesson-practice" data-practice="${l.id}"><summary>巩固题 <span class="practice-state">${done?'本次记录：已答对':'检验概念与应用'}</span></summary><p class="practice-question">${esc(l.quiz.question)}</p><div class="practice-options">${l.quiz.options.map((option,i)=>`<button class="practice-option${knownCorrect&&i===l.quiz.answer?' correct':!knownCorrect&&selected===i?' incorrect':''}" data-answer="${i}" data-lesson="${l.id}"${selected===i?' aria-pressed="true"':''}><b aria-hidden="true">${String.fromCharCode(65+i)}</b><span>${esc(option)}</span></button>`).join('')}</div><p class="practice-feedback" aria-live="polite">${knownCorrect?esc(l.quiz.explanation):selected!==undefined?'答案还不正确。请对照史实、对比表或例题后再试。':''}</p></details></article>`;
  }
  function renderChapter(id, scroll=false) {
    const chapter = chapters.find(c=>c.id===id);
    if (!chapter) return;
    stopSpeaking(); pauseMedia(); active=chapter;
    renderNav();
    $('chapter-label').textContent = `第 ${chapter.no} 章 / 8`;
    $('chapter-title').textContent = chapter.title;
    $('chapter-description').textContent = chapter.description || chapter.intro;
    $('chapter-count').textContent = `${chapter.lessonIds.length} 个知识点`;
    $('lesson-index').innerHTML = chapter.lessonIds.map(id=>`<a href="#lesson-${id}" data-jump="${id}">${numberOf(id)} ${esc(lessonMap.get(id).title)}</a>`).join('');
    $('lessons').innerHTML = chapter.lessonIds.map(id=>renderLesson(lessonMap.get(id))).join('');
    $('next-chapter-name').textContent=chapters[(chapters.indexOf(active)+1)%chapters.length].title;
    if (scroll) {
      try { history.replaceState(null,'',`#${chapter.id}`); } catch { /* Some local viewers restrict URL updates. */ }
      $('knowledge-main').scrollIntoView({behavior:'smooth'}); $('chapter-title').tabIndex=-1; $('chapter-title').focus({preventScroll:true});
    }
  }
  function jump(id) {
    const chapter=chapterOf(id); if (!chapter) return;
    if (chapter.id!==active.id) renderChapter(chapter.id);
    const target=$(`lesson-${id}`); target.scrollIntoView({behavior:'smooth',block:'start'}); target.focus({preventScroll:true});
    try { history.replaceState(null,'',`#lesson-${id}`); } catch { /* File viewers may restrict URL updates. */ }
  }
  function readLesson(id) {
    if (speakingId===id) { stopSpeaking(); return; }
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) { status('此浏览器没有可用的朗读功能。部分知识点另有本地讲解音频。'); return; }
    stopSpeaking(); pauseMedia();
    const l=lessonMap.get(id);
    utterance=new SpeechSynthesisUtterance(`${l.title}。定义。${l.definition}。必须掌握。${l.essentials.join('。')}。${(l.facts || []).map(f=>`${f.label}，${f.value}`).join('。')}。易错辨析。${l.misconception.right}`);
    const request = utterance;
    utterance.lang='zh-CN'; utterance.rate=.88;
    const voice=speechSynthesis.getVoices().find(v=>/zh[-_]CN/i.test(v.lang)); if (voice) utterance.voice=voice;
    utterance.onend=()=>{ if(utterance!==request)return; speakingId=null; const b=root.querySelector(`[data-read="${id}"]`); if(b){b.textContent='朗读要点';b.setAttribute('aria-pressed','false');} utterance=null; };
    utterance.onerror=event=>{ if(utterance!==request)return; stopSpeaking(); if(!['canceled','interrupted'].includes(event.error))status('设备中文语音暂不可用。可阅读文字，或播放知识点旁的本地音频。'); };
    speakingId=id;
    const b=root.querySelector(`[data-read="${id}"]`); b.textContent='停止朗读'; b.setAttribute('aria-pressed','true');
    speechSynthesis.speak(utterance);
  }
  root.addEventListener('click',event=>{
    const target=event.target;
    const chapterButton=target.closest('[data-chapter]');
    if(chapterButton){ renderChapter(chapterButton.dataset.chapter,true); return; }
    const jumpButton=target.closest('[data-jump]');
    if(jumpButton){event.preventDefault();root.querySelectorAll('dialog[open]').forEach(d=>d.close());jump(jumpButton.dataset.jump);return;}
    const readButton=target.closest('[data-read]'); if(readButton){readLesson(readButton.dataset.read);return;}
    const image=target.closest('[data-image]');
    if(image){const m=media[image.dataset.image];$('large-image').src=m.src;$('large-image').alt=m.alt;$('large-caption').textContent=`${m.caption} · ${m.credit}`;$('large-source').href=m.source;openDialog('image-dialog');return;}
    const lab=target.closest('[data-lab]'); if(lab){openDialog('lab-dialog');$(`lab-tab-${lab.dataset.lab}`)?.click();return;}
    if(target.closest('[data-video]')){openDialog('video-dialog');return;}
    const answer=target.closest('[data-answer]');
    if(answer){
      const id=answer.dataset.lesson,l=lessonMap.get(id),index=Number(answer.dataset.answer),practice=answer.closest('.lesson-practice');
      sessionAnswers.set(id,index);
      practice.querySelectorAll('[data-answer]').forEach(b=>{b.classList.remove('correct','incorrect');b.setAttribute('aria-pressed',String(b===answer));});
      if(index!==l.quiz.answer){answer.classList.add('incorrect');practice.querySelector('.practice-feedback').textContent='答案还不正确。请对照史实、对比表或例题后再试。';return;}
      answer.classList.add('correct');practice.querySelector('.practice-feedback').textContent=l.quiz.explanation;
      practice.querySelector('.practice-state').textContent='本次记录：已答对';completed.add(id);
      try{localStorage.setItem(key,JSON.stringify([...completed]));storageOK=true;}catch{storageOK=false;status('当前浏览器无法保存自测记录，关闭页面后会丢失。');}
      $('progress-count').textContent=`${completed.size} / 37`;
    }
  });
  function renderSearch() {
    const query=$('knowledge-search').value.trim().toLocaleLowerCase();
    const results=ordered.filter(l=>!query||searchIndex.get(l.id).includes(query));
    $('search-count').textContent=`共找到 ${results.length} 个知识点`;
    $('search-results').innerHTML=results.length?results.map(l=>`<button class="search-result" data-jump="${l.id}"><small>${esc(chapterOf(l.id).title)} · ${numberOf(l.id)}</small><strong>${esc(l.title)}</strong><p>${esc(l.definition)}</p></button>`).join(''):'<p class="empty-results">没有匹配的知识点，请试试更短的关键词。</p>';
  }
  $('open-search').addEventListener('click',()=>{$('knowledge-search').value='';renderSearch();openDialog('search-dialog');$('knowledge-search').focus();});
  $('knowledge-search').addEventListener('input',renderSearch);
  $('open-progress').addEventListener('click',()=>{
    $('progress-summary').textContent=`37个知识点中，${completed.size} 个已有答对巩固题的记录。${storageOK?'':'当前无法持久保存。'}`;
    $('progress-list').innerHTML=ordered.map(l=>`<button class="progress-row${completed.has(l.id)?' done':''}" data-jump="${l.id}"><span>${numberOf(l.id)} ${esc(l.title)}</span><small>${completed.has(l.id)?'已答对 ✓':'未记录'}</small></button>`).join('');
    openDialog('progress-dialog');
  });
  $('next-chapter').addEventListener('click',()=>renderChapter(chapters[(chapters.indexOf(active)+1)%chapters.length].id,true));
  if(media.video){const v=media.video;$('observation-video').src=v.src;$('observation-video').poster=v.poster;$('observation-video').setAttribute('aria-label',v.title);$('video-title').textContent=v.title;$('video-caption').textContent=v.caption;$('video-source').href=v.source;}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopSpeaking();pauseMedia();}});
  window.addEventListener('pagehide',()=>{stopSpeaking();pauseMedia();});
  renderChapter(active.id);
  if(lessonMap.has(hashLesson)) jump(hashLesson);
})();
