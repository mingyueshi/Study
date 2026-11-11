/* 静态课程阅读、代码复制、项目材料下载与独立学习记录。 */
(function () {
 'use strict';
 const data = CODING_COURSE, core = CodingCore, all = core.lessons(data);
 const el = id => document.getElementById(id);
 const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 let blocked = false, raw = null;
 try { raw = JSON.parse(localStorage.getItem(core.key) || 'null'); } catch (error) { blocked = true; }
 const state = core.normalize(raw, data);
 let query = '', statusFilter = 'all', pendingAnswer = null, renderedHash = location.hash, toastTimer;
 const current = () => core.route(location.hash, data);
 const trackById = id => data.tracks.find(track => track.id === id);
 const count = track => track.lessons.filter(lesson => state.completed[lesson.id]).length;
 function save() {
  try { localStorage.setItem(core.key, JSON.stringify(state)); blocked = false; } catch (error) { blocked = true; }
  el('storageNotice').hidden = !blocked;
 }
 function toast(text) {
  el('copyStatus').textContent = text; el('copyStatus').hidden = false; clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el('copyStatus').hidden = true; }, 2400);
 }
 async function copy(text) {
  if (navigator.clipboard && window.isSecureContext) {
   try { await navigator.clipboard.writeText(text); toast('已复制。'); return; } catch (error) { /* 本地文件回退 */ }
  }
  const active = document.activeElement, area = document.createElement('textarea');
  area.value = text; area.style.cssText = 'position:fixed;opacity:0;'; document.body.appendChild(area); area.select();
  try { toast(document.execCommand('copy') ? '已复制。' : '复制未成功，请选中文本后手动复制。'); }
  catch (error) { toast('复制未成功，请选中文本后手动复制。'); }
  area.remove(); if (active?.isConnected) active.focus({preventScroll:true});
 }
 function download(bytes, filename, type) {
  const url = URL.createObjectURL(new Blob([bytes], {type})), link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('已准备下载：' + filename);
 }
 function heading(title, summary, label = '') {
  return '<div class="coding-heading"><h2 id="viewTitle">' + esc(title) + '</h2><span>' + esc(label) + '</span></div><p class="coding-lead">' + esc(summary) + '</p>';
 }
 function refs(item) {
  return '<div class="coding-sources"><span>官方资料 · 需联网 · 核对于 ' + data.checkedAt + '</span>' + item.sources.map(id => '<a href="' + esc(data.sources[id].url) + '" target="_blank" rel="noopener noreferrer">' + esc(data.sources[id].title) + ' ↗</a>').join('') + '</div>';
 }
 function resume(track) {
  if (state.lastLesson) {
   const last = all.find(item => item.id === state.lastLesson);
   if ((!track || last.track.id === track.id) && !state.completed[last.id]) return last;
  }
  return (track ? all.filter(item => item.track.id === track.id) : all).find(item => !state.completed[item.id]) || (track ? all.find(item => item.track.id === track.id) : all[0]);
 }
 function overview(view) {
  const completed = all.filter(item => state.completed[item.id]).length;
  el('progressLabel').textContent = completed + ' / ' + all.length; el('courseProgress').value = completed; el('courseProgress').max = all.length;
  el('courseSummary').textContent = data.tracks.length + ' 条路线 · ' + all.length + ' 节课 · ' + data.projects.length + ' 个项目';
  el('storageNotice').hidden = !blocked;
  const track = view.track || (view.project && trackById(view.project.track));
  el('trackSelect').value = track?.id || 'all';
  el('resumeButton').textContent = state.lastLesson ? '继续学习 →' : '开始学习 →';
  document.querySelectorAll('[data-course-view]').forEach(link => {
   const active = link.dataset.courseView === (view.view.startsWith('project') ? 'projects' : 'home');
   if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  const expanded = new Set([...el('courseDirectory').querySelectorAll('details[open]')].map(node => node.dataset.track));
  el('courseDirectory').innerHTML = data.tracks.map(item => '<details class="coding-directory" data-track="' + item.id + '"' + (track?.id === item.id || expanded.has(item.id) ? ' open' : '') + '><summary><span>' + item.name + '</span><small>' + count(item) + '/' + item.lessons.length + '</small></summary><a class="coding-track-overview" href="#track=' + item.id + '">查看路线与课程 →</a>' + item.lessons.map((lesson, index) => '<a href="#lesson=' + lesson.id + '"' + (view.lesson?.id === lesson.id ? ' aria-current="page"' : '') + '><span>' + (index+1) + '. ' + esc(lesson.title) + '</span><span aria-label="' + (state.completed[lesson.id] ? '已学习' : '待学习') + '">' + (state.completed[lesson.id] ? '✓' : '·') + '</span></a>').join('') + '</details>').join('');
 }
 function homeHTML() {
  return heading('把语言与框架串起来学', '先学 Python 处理数据，再用 Django 提供接口，最后用 Vue 做出可以操作的页面。也可以直接进入正在使用的技术。', '每条路线 10 节课') +
   '<div class="track-grid">' + data.tracks.map(track => '<article class="track-panel track-' + track.id + '"><div class="track-heading"><h3>' + track.name + '</h3><span>' + esc(track.kind) + '</span></div><p>' + esc(track.summary) + '</p><p class="track-outcome">学完做出：' + esc(track.outcome) + '</p><ol>' + track.lessons.map(lesson => '<li><a href="#lesson=' + lesson.id + '">' + esc(lesson.title) + (state.completed[lesson.id] ? '<span aria-label="已学习">✓</span>' : '') + '</a></li>').join('') + '</ol><div class="track-panel-footer"><a href="#track=' + track.id + '">路线与准备 →</a><a href="#lesson=' + resume(track).id + '">' + (count(track) ? '继续学习' : '开始学习') + ' →</a></div></article>').join('') + '</div>' +
   '<section class="coding-project-bridge"><div><h3>用一个任务清单，做三次实操</h3><p>命令行保存任务 → 后端提供接口 → 前端读取与提交。材料可打包下载，安装工具和依赖的步骤单独说明。</p></div><a href="#projects">查看 3 个实操项目 →</a></section><p class="coding-offline-note">课程、代码和材料可离线查阅。实际运行需要本机解释器或项目环境，首次安装与官方资料链接需联网；页面提供材料，不执行输入的代码。</p>';
 }
 function catalogHTML(track) {
  const items = all.filter(item => (!track || item.track.id === track.id) && core.matches(item, query) && (statusFilter === 'all' || (statusFilter === 'done' ? !!state.completed[item.id] : !state.completed[item.id])));
  return heading(track ? track.name + ' 学习路线' : '课程搜索', track ? track.outcome : '按语言、概念或代码关键词查找，多个关键词用空格分隔。', items.length + ' 节课') +
   (track ? '<div class="coding-track-preparation"><p>' + esc(track.baseline) + '</p><details><summary>开始前准备什么</summary><ul>' + track.prerequisites.map(line => '<li>' + esc(line) + '</li>').join('') + '</ul>' + refs(track) + '</details></div>' : '') +
   '<div class="coding-filters" role="group" aria-label="课程学习状态">' + [['all','全部课程'],['todo','待学习'],['done','已学习']].map(([id,label]) => '<button type="button" data-code-act="filter" data-filter="' + id + '" aria-pressed="' + (statusFilter === id) + '">' + label + '</button>').join('') + '</div>' +
   (items.length ? '<div class="lesson-list">' + items.map(item => '<a href="#lesson=' + item.id + '" class="lesson-list-row"><span class="lesson-track-label">' + item.track.name + (state.completed[item.id] ? ' · 已学习 ✓' : '') + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(item.summary) + '</p><span class="coding-read-link">阅读与动手 →</span></a>').join('') + '</div>' : '<div class="coding-empty"><h3>没有找到符合条件的课程</h3><p>试试其他关键词或学习状态。</p><button type="button" data-code-act="reset-search">查看全部课程</button></div>');
 }
 function blockHTML(block, index) {
  const kind = {run:'独立脚本',fragment:'项目片段',commands:'终端命令'}[block.kind];
  return '<section class="coding-example"><div class="coding-code-heading"><div><span>' + kind + '</span><h3>' + esc(block.filename) + '</h3></div><div><button type="button" data-code-act="copy-block" data-index="' + index + '">复制</button><button type="button" data-code-act="download-block" data-index="' + index + '">下载</button></div></div><p class="coding-context">' + esc(block.context) + '</p><pre tabindex="0" aria-label="' + esc(block.filename) + ' 代码"><code>' + esc(block.lines.join('\n')) + '</code></pre><div class="coding-expected"><h4>运行或接入后看什么</h4><ul>' + block.expected.map(line => '<li>' + esc(line) + '</li>').join('') + '</ul></div></section>';
 }
 function completeHTML(item, label) {
  return '<button type="button" class="coding-complete" data-code-act="complete" aria-pressed="' + !!state.completed[item.id] + '">' + (state.completed[item.id] ? '✓ 已完成 · 可取消标记' : '标记' + label + '已完成') + '</button>';
 }
 function noteHTML(item) {
  return '<section class="coding-note"><label for="learningNote">记录结果与疑问</label><p>保存在当前浏览器，最多 2000 字。</p><textarea id="learningNote" rows="5" maxlength="2000" placeholder="改了什么？看到了什么结果？哪里还需要继续检查？">' + esc(state.notes[item.id] || '') + '</textarea></section>';
 }
 function feedback(lesson) {
  if (!Object.prototype.hasOwnProperty.call(state.answers,lesson.id)) return '';
  const correct = state.answers[lesson.id] === lesson.quiz.answer;
  return '<strong>' + (correct ? '回答正确' : '再核对一下') + '</strong><p>' + esc(lesson.quiz.explanation) + '</p>' + (correct ? '' : '<p>参考答案：' + esc(lesson.quiz.options[lesson.quiz.answer]) + '</p>');
 }
 function lessonHTML(lesson) {
  pendingAnswer = state.answers[lesson.id] ?? null;
  const index = lesson.track.lessons.findIndex(item => item.id === lesson.id), previous = lesson.track.lessons[index-1], next = lesson.track.lessons[index+1];
  const project = data.projects.find(item => item.track === lesson.track.id);
  return '<a class="coding-back" href="#track=' + lesson.track.id + '">← ' + lesson.track.name + ' 学习路线</a>' + heading(lesson.title,lesson.summary,lesson.track.name + ' · 第 ' + (index+1) + ' / ' + lesson.track.lessons.length + ' 课') +
   '<button type="button" class="coding-jump" data-code-act="example">跳到示例代码 ↓</button><div class="coding-lesson-layout"><article class="coding-explanation"><h3>先理解这件事</h3>' + lesson.body.map(line => '<p>' + esc(line) + '</p>').join('') + '<h3>跟着做</h3><ol>' + lesson.steps.map(line => '<li>' + esc(line) + '</li>').join('') + '</ol><details class="coding-pitfalls"><summary>容易踩的坑</summary><ul>' + lesson.pitfalls.map(line => '<li>' + esc(line) + '</li>').join('') + '</ul></details>' + refs(lesson) + '<div class="coding-related">' + lesson.links.map(link => '<a href="' + esc(link.href) + '">' + esc(link.label) + ' ↗</a>').join('') + '<a href="#project=' + project.id + '">放进实操项目 →</a></div></article><div class="coding-examples">' + lesson.blocks.map(blockHTML).join('') + '</div></div>' +
   '<div class="coding-practice-layout"><section class="coding-exercise"><h3>自己改一改</h3><p>' + esc(lesson.task.goal) + '</p><ul>' + lesson.task.checks.map(line => '<li>' + esc(line) + '</li>').join('') + '</ul>' + completeHTML(lesson,'本课') + '<p class="coding-small">按自己的理解与操作标记，自检不会自动标记完成。</p>' + noteHTML(lesson) + '</section><section class="coding-quiz"><fieldset><legend>自检 · ' + esc(lesson.quiz.question) + '</legend>' + lesson.quiz.options.map((option,n) => '<label><input type="radio" name="coding-answer" value="' + n + '"' + (pendingAnswer === n ? ' checked' : '') + '><span>' + esc(option) + '</span></label>').join('') + '</fieldset><button type="button" data-code-act="check"' + (pendingAnswer === null ? ' disabled' : '') + '>检查答案</button><div id="quizFeedback" role="status" class="coding-feedback">' + feedback(lesson) + '</div></section></div>' +
   '<nav class="coding-pagination" aria-label="课程翻页"><a href="' + (previous ? '#lesson='+previous.id : '#track='+lesson.track.id) + '">← ' + esc(previous ? previous.title : '查看整条路线') + '</a><a href="' + (next ? '#lesson='+next.id : '#project='+project.id) + '">' + esc(next ? next.title : '进入配套实操') + ' →</a></nav>';
 }
 function projectsHTML() {
  return heading('三个项目，把知识用起来','可以分别完成，也可以先运行 Django 接口，再用 Vue 页面连接它。每份材料都附有操作说明与验收检查。') +
   '<div class="coding-projects">' + data.projects.map(project => '<article class="coding-project-row"><div><span class="lesson-track-label">' + trackById(project.track).name + (state.completed[project.id] ? ' · 已完成 ✓' : '') + '</span><h3><a href="#project=' + project.id + '">' + esc(project.title) + '</a></h3><p>' + esc(project.summary) + '</p><p class="coding-small">' + esc(project.environment) + '</p></div><div><a href="#project=' + project.id + '" class="coding-primary">材料与步骤 →</a><button type="button" data-code-act="download-project" data-project="' + project.id + '">下载 ZIP</button></div></article>').join('') + '</div>';
 }
 function projectHTML(project) {
  return '<a class="coding-back" href="#projects">← 实操项目</a>' + heading(project.title,project.summary,project.files.length + ' 份文件') +
   '<div class="coding-project-actions"><button type="button" class="coding-primary" data-code-act="download-project" data-project="' + project.id + '">下载完整材料 ZIP</button><span>按目录结构解压，README.txt 随材料保存。</span></div><p class="coding-environment">' + esc(project.environment) + '</p><div class="coding-project-layout"><div><h3>按步骤完成</h3><ol class="coding-project-steps">' + project.steps.map(line => '<li>' + esc(line) + '</li>').join('') + '</ol><div class="coding-code-heading"><h3>终端命令</h3><button type="button" data-code-act="copy-commands">复制命令</button></div><p class="coding-small">结合上面的步骤，在对应目录逐行运行。</p><pre tabindex="0"><code>' + esc(project.commands.join('\n')) + '</code></pre><h3 class="coding-files-title">材料文件 · 展开查阅</h3>' + project.files.map((file,index) => '<details class="coding-project-file"><summary>' + esc(file.path) + '</summary><div class="coding-code-heading"><span>' + file.lines.length + ' 行</span><button type="button" data-code-act="copy-file" data-index="' + index + '">复制文件内容</button></div><pre tabindex="0"><code>' + esc(file.lines.join('\n') || '（空文件，用于包结构）') + '</code></pre></details>').join('') + '</div><aside class="coding-project-checks"><h3>完成后逐项检查</h3><ul>' + project.checks.map(line => '<li>' + esc(line) + '</li>').join('') + '</ul>' + completeHTML(project,'本项目') + noteHTML(project) + '<h3>回到相关课程</h3><div class="coding-related">' + project.lessonIds.map(id => '<a href="#lesson=' + id + '">' + esc(all.find(item => item.id === id).title) + ' ↗</a>').join('') + '</div>' + refs(project) + '</aside></div>';
 }
 function render() {
  renderedHash = location.hash;
  const view = current();
  if (view.lesson && state.lastLesson !== view.lesson.id) { state.lastLesson = view.lesson.id; save(); }
  overview(view); el('clearSearch').hidden = !query;
  let html;
  if (view.view === 'lesson') html = lessonHTML(view.lesson);
  else if (view.view === 'project') html = projectHTML(view.project);
  else if (view.view === 'projects') html = projectsHTML();
  else if (view.view === 'track' || query || statusFilter !== 'all') html = catalogHTML(view.track);
  else html = homeHTML();
  el('lessonContent').innerHTML = '<section aria-labelledby="viewTitle">' + html + '</section>';
  el('viewStatus').textContent = el('viewTitle').textContent;
  document.title = el('viewTitle').textContent + ' · 语言与框架 · 个人学习';
 }
 function navigate(hash, searching = false) {
  if (!searching) { query = ''; statusFilter = 'all'; el('lessonSearch').value = ''; }
  location.hash = hash; render();
  if (!searching) { el('lessonContent').focus({preventScroll:true}); el('lessonContent').scrollIntoView({block:'start'}); }
 }
 function search(value) {
  query = value.trim(); el('lessonSearch').value = value;
  const view = current();
  if (view.view === 'lesson') navigate('#track='+view.track.id,true);
  else if (view.view.startsWith('project')) navigate('#home',true);
  else render();
 }
 document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && /^#(?:home|projects|track=|lesson=|project=)/.test(link.getAttribute('href'))) {
   event.preventDefault(); navigate(link.getAttribute('href')); return;
  }
  const button = event.target.closest('[data-code-act]'); if (!button) return;
  const view = current(), item = view.lesson || view.project, act = button.dataset.codeAct;
  if (act === 'skip') { event.preventDefault(); el('lessonContent').focus({preventScroll:true}); el('lessonContent').scrollIntoView({block:'start'}); }
  else if (act === 'resume') navigate('#lesson='+resume(view.track || (view.project && trackById(view.project.track))).id);
  else if (act === 'example' && view.lesson) { document.querySelector('.coding-examples').scrollIntoView({block:'start'}); document.querySelector('.coding-example pre').focus({preventScroll:true}); }
  else if (act === 'clear-search') { search(''); el('lessonSearch').focus(); }
  else if (act === 'reset-search') { statusFilter='all'; search(''); }
  else if (act === 'filter') { statusFilter=button.dataset.filter; render(); el('lessonContent').querySelector('[data-filter="'+statusFilter+'"]').focus({preventScroll:true}); }
  else if (act === 'download-project') {
   const project = data.projects.find(entry => entry.id === button.dataset.project);
   if (project) download(core.zip(project.files), project.id+'.zip','application/zip');
  } else if (act === 'copy-block' && view.lesson) copy(view.lesson.blocks[Number(button.dataset.index)].lines.join('\n'));
  else if (act === 'download-block' && view.lesson) {
   const block = view.lesson.blocks[Number(button.dataset.index)];
   download(block.lines.join('\n')+'\n',block.filename.split('/').pop(),'text/plain;charset=utf-8');
  } else if (act === 'copy-commands' && view.project) copy(view.project.commands.join('\n'));
  else if (act === 'copy-file' && view.project) copy(view.project.files[Number(button.dataset.index)].lines.join('\n'));
  else if (act === 'complete' && item) {
   if (state.completed[item.id]) delete state.completed[item.id]; else state.completed[item.id]=true;
   save(); overview(view); button.setAttribute('aria-pressed',String(!!state.completed[item.id]));
   button.textContent=state.completed[item.id]?'✓ 已完成 · 可取消标记':'标记'+(view.lesson?'本课':'本项目')+'已完成';
   el('viewStatus').textContent=item.title+(state.completed[item.id]?'已标记完成':'已取消完成标记');
  } else if (act === 'check' && view.lesson && pendingAnswer !== null) {
   state.answers[view.lesson.id]=pendingAnswer;save();el('quizFeedback').innerHTML=feedback(view.lesson);
  }
 });
 document.addEventListener('input', event => {
  if (event.target.id==='lessonSearch') search(event.target.value);
  if (event.target.id==='learningNote') { const view=current(),item=view.lesson||view.project;if(item){state.notes[item.id]=event.target.value;save();} }
 });
 document.addEventListener('change', event => {
  if(event.target.id==='trackSelect')navigate(event.target.value==='all'?'#home':'#track='+event.target.value);
  if(event.target.name==='coding-answer') { pendingAnswer=Number(event.target.value);el('lessonContent').querySelector('[data-code-act="check"]').disabled=false;el('quizFeedback').textContent=''; }
 });
 document.addEventListener('keydown', event => {
  const typing=event.target.closest('input,textarea,select,[contenteditable="true"]');
  if(event.key==='/'&&!typing&&!event.metaKey&&!event.ctrlKey&&!event.altKey){event.preventDefault();el('lessonSearch').focus();}
  if(event.key==='Escape'&&event.target===el('lessonSearch'))search('');
 });
 window.addEventListener('hashchange',()=>{if(location.hash===renderedHash)return;query='';statusFilter='all';el('lessonSearch').value='';render();el('lessonContent').scrollIntoView({block:'start'});});
 if(window.ResizeObserver)new ResizeObserver(entries=>document.documentElement.style.setProperty('--coding-tools-height',Math.ceil(entries[0].target.getBoundingClientRect().height)+'px')).observe(document.querySelector('.coding-toolbar'));
 window.CodingLearning={data,all,get state(){return state;}};
 render();
})();
