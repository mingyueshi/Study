/* ============================================================
   乐学堂 · 四年级 —— 界面与逻辑
   ============================================================ */
'use strict';

const STORE_KEY = 'letang_grade4_v1';
const DAILY_GOAL = 10;   // 每科每日目标题数

/* ---------- 学习档案（localStorage 持久化） ---------- */
function defaultState() {
  return {
    stars: 0,                    // 星星总数
    streak: 0,                   // 连续打卡天数
    lastDaily: '',               // 上次领奖日期
    daily: { date: '', chinese: 0, math: 0, english: 0, bonus: false },
    totals: { q: 0, ok: 0, perfect: 0, redoFixed: 0 },
    wrong: { chinese: [], math: [], english: [] },
    sound: true,
  };
}
let state = defaultState();
try {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) {
    const s = JSON.parse(raw);
    const d = defaultState();
    state = {
      ...d, ...s,
      daily: { ...d.daily, ...(s.daily || {}) },
      totals: { ...d.totals, ...(s.totals || {}) },
      wrong: { ...d.wrong, ...(s.wrong || {}) },
    };
  }
} catch (e) { /* localStorage 不可用时仅使用内存状态 */ }

function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

function fmtDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const today = () => fmtDate(new Date());
const yesterday = () => fmtDate(new Date(Date.now() - 86400000));

function rollDaily() {
  if (state.daily.date !== today()) {
    state.daily = { date: today(), chinese: 0, math: 0, english: 0, bonus: false };
    if (state.lastDaily && state.lastDaily !== yesterday()) state.streak = 0;
    save();
  }
}

/* ---------- 运行时视图状态 ---------- */
let view = 'home';          // home | subject | quiz | result | wrong | sheet | flash | flashEnd
let curSubject = null;
let session = null;         // 进行中的练习
let result = null;          // 上一次练习结果
let flash = null;           // 单词卡
let sheetHTML = '';         // 口算打印卡
let modal = null;           // settings | celebrate

/* ---------- 工具 ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

/* 朗读（统一走 speech.js：自动挑最优发音人，中英文自动分流） */
function speak(text, lang) {
  if (!state.sound || !window.SpeechKit) return;
  SpeechKit.speak(text, { rate: 0.85 });
}

/* 音效 */
let audioCtx = null;
function sfx(ok) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    (ok ? [660, 880] : [220, 170]).forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = ok ? 'sine' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.12, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.18);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.2);
    });
  } catch (e) {}
}

function confetti(n) {
  const colors = ['#ff6b6b', '#ffa630', '#2fbf71', '#4d96ff', '#9b5de5', '#f15bb5'];
  for (let i = 0; i < (n || 50); i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    p.style.animationDelay = (Math.random() * 0.4) + 's';
    p.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 3600);
  }
}

/* ============================================================
   练习会话
   ============================================================ */
function clearSession() {
  if (session && session.timer) clearTimeout(session.timer);
  session = null;
}

function startQuiz(sid, mid) {
  const m = modeById(sid, mid);
  let qs;
  if (mid === 'redo') {
    qs = shuffle(state.wrong[sid] || []).slice(0, 10).map(q => ({ ...q }));
  } else {
    qs = m.gen();
  }
  session = {
    sid, mid,
    modeName: mid === 'redo' ? '错题重做' : m.name,
    questions: qs, idx: 0, ok: 0, stars: 0,
    results: [], input: '', picked: -1, phase: 'answer', timer: null, lastCorrect: false,
  };
  view = 'quiz';
  render();
}

function bumpDaily(sid) {
  state.daily[sid] = (state.daily[sid] || 0) + 1;
}

function addWrong(sid, q) {
  const book = state.wrong[sid] || (state.wrong[sid] = []);
  const exist = book.find(w => w.key === q.key);
  if (exist) { exist.ok = 0; return; }
  book.push({ ...q, ok: 0 });
  if (book.length > 60) book.shift();
}

function updateRedoBook(q, correct) {
  if (!session || session.mid !== 'redo') return;
  const book = state.wrong[session.sid];
  const i = book.findIndex(w => w.key === q.key);
  if (i < 0) return;
  if (correct) {
    book[i].ok = (book[i].ok || 0) + 1;
    if (book[i].ok >= 2) { book.splice(i, 1); state.totals.redoFixed++; }
  } else {
    book[i].ok = 0;
  }
}

function chooseAnswer(i) {
  if (!session || session.phase !== 'answer') return;
  const q = session.questions[session.idx];
  session.picked = i;
  settle(i === q.answerIndex);
}

function submitPad() {
  if (!session || session.phase !== 'answer' || !session.input) return;
  const q = session.questions[session.idx];
  const a = parseFloat(session.input), b = parseFloat(q.answer);
  settle(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1e-9);
}

function submitText() {
  if (!session || session.phase !== 'answer' || !session.input) return;
  const q = session.questions[session.idx];
  const norm = v => String(v).trim().toLowerCase().replace(/\s+/g, ' ');
  settle(norm(session.input) === norm(q.answer));
}

function settle(correct) {
  const q = session.questions[session.idx];
  const ansDisplay = q.type === 'choice' ? q.choices[q.answerIndex] : q.answer;
  session.phase = 'feedback';
  session.lastCorrect = correct;
  session.results.push({ prompt: q.prompt, ok: correct, ans: ansDisplay, explain: q.explain || '' });
  state.totals.q++;
  bumpDaily(session.sid);
  if (correct) {
    state.totals.ok++;
    session.ok++;
    session.stars++;
    state.stars++;
    if (session.sid === 'english') speak(ansDisplay, 'en-US');
    if (session.sid === 'chinese') speak(ansDisplay, 'zh-CN');
  } else {
    addWrong(session.sid, q);
  }
  updateRedoBook(q, correct);
  save();
  if (correct) {
    session.timer = setTimeout(() => { if (session && session.phase === 'feedback') nextQuestion(); }, 1600);
  }
  render();
  sfx(correct);
}

function nextQuestion() {
  if (!session) return;
  if (session.timer) { clearTimeout(session.timer); session.timer = null; }
  if (session.phase !== 'feedback') return;
  session.idx++;
  if (session.idx >= session.questions.length) { finishQuiz(); return; }
  session.phase = 'answer';
  session.input = '';
  session.picked = -1;
  render();
}

function finishQuiz() {
  const total = session.questions.length;
  let bonus = 0;
  if (session.ok === total && total >= 5) { bonus = 2; state.stars += bonus; state.totals.perfect++; }
  result = {
    sid: session.sid, mid: session.mid, modeName: session.modeName, total, ok: session.ok,
    stars: session.stars, bonus, acc: Math.round(session.ok / total * 100),
    results: session.results,
  };
  clearSession();
  view = 'result';
  render();
  if (result.acc >= 80) confetti(40);
}

/* ---------- 单词卡 ---------- */
function startFlash(sid) {
  flash = { sid, list: sample(EN_WORDS, 12), i: 0, known: 0, flipped: false };
  view = 'flash';
  render();
}
function flashMark(known) {
  const w = flash.list[flash.i];
  if (!known) {
    const decoys = shuffle(EN_WORDS.filter(x => x.zh !== w.zh)).slice(0, 3).map(x => x.zh);
    addWrong('english', {
      type: 'choice', key: 'e2z-' + w.en, prompt: w.en, speak: w.en,
      choices: [w.zh].concat(decoys), answerIndex: 0, explain: w.en + ' = ' + w.zh, ok: 0,
    });
  } else {
    flash.known++;
  }
  flash.i++;
  flash.flipped = false;
  save();
  if (flash.i >= flash.list.length) {
    state.stars += 3;
    save();
    view = 'flashEnd';
    render();
    confetti(30);
    sfx(true);
  } else {
    render();
  }
}

/* ---------- 每日任务 ---------- */
function dailyAllDone() {
  return SUBJECTS.every(s => (state.daily[s.id] || 0) >= DAILY_GOAL);
}
function claimDaily() {
  if (state.daily.bonus || !dailyAllDone()) return;
  state.daily.bonus = true;
  state.stars += 10;
  state.streak = state.lastDaily === yesterday() ? state.streak + 1 : 1;
  state.lastDaily = today();
  save();
  modal = 'celebrate';
  renderModal();
  render();
  confetti(80);
  sfx(true);
}

/* ---------- 口算打印卡 ---------- */
function buildSheet() {
  const rows = [];
  const used = new Set();
  let guard = 0;
  while (rows.length < 40 && guard++ < 3000) {
    const t = MATH.sheetOne();
    if (used.has(t.q)) continue;
    used.add(t.q);
    rows.push(t);
  }
  const cells = rows.map((t, i) => '<div class="cell"><span class="no">' + (i + 1) + '.</span> ' + esc(t.q) + ' =</div>').join('');
  const answers = rows.map((t, i) => '<div class="acell">' + (i + 1) + '. ' + esc(t.ans) + '</div>').join('');
  return '<div class="sheet">' +
    '<h1>口算练习卡 · 四年级</h1>' +
    '<p class="meta">姓名：____________　日期：____________　用时：______ 分　对：____ 题</p>' +
    '<div class="sheet-grid">' + cells + '</div>' +
    '<div class="page-break"></div>' +
    '<h2>参考答案</h2>' +
    '<div class="answers-grid">' + answers + '</div>' +
    '</div>';
}

/* ============================================================
   视图渲染
   ============================================================ */
function headerHTML() {
  return '<header>' +
    '<button class="logo" data-act="home">🎒 乐学堂</button>' +
    '<span class="header-context">四年级 · 每天进步一点点</span>' +
    '<span class="spacer"></span>' +
    '<span class="stat-pill" title="我的星星">⭐ ' + state.stars + '</span>' +
    '<span class="stat-pill" title="连续打卡">🔥 ' + state.streak + ' 天</span>' +
    '<button class="icon-btn" data-act="toggleSound" title="声音" aria-label="' + (state.sound ? '关闭声音' : '开启声音') + '">' + (state.sound ? '🔊' : '🔇') + '</button>' +
    '<button class="icon-btn" data-act="settings" title="设置">⚙️</button>' +
    '</header>';
}

function viewHome() {
  const rings = SUBJECTS.map(s => {
    const c = Math.min(state.daily[s.id] || 0, DAILY_GOAL);
    const p = Math.round(c / DAILY_GOAL * 100);
    return '<div class="ring-wrap"><div class="ring" style="--c:' + s.color + ';--p:' + p + '"><span>' + c + '/' + DAILY_GOAL + '</span></div>' +
      '<div class="ring-label">' + s.emoji + ' ' + s.name + '</div></div>';
  }).join('');

  const claim = (!state.daily.bonus && dailyAllDone())
    ? '<button class="claim-btn" data-act="claim">🎁 今日任务全部完成，领取奖励！</button>'
    : (state.daily.bonus ? '<div class="claimed">✅ 今日奖励已领取，明天再来哦！</div>' : '');

  const cards = SUBJECTS.map(s =>
    '<button class="subject-card" style="background:linear-gradient(135deg,' + s.gradient + ')" data-act="subject" data-id="' + s.id + '">' +
    '<span class="sc-emoji">' + s.emoji + '</span><span class="sc-name">' + s.name + '</span>' +
    '<span class="sc-sub">今日 ' + Math.min(state.daily[s.id] || 0, DAILY_GOAL) + '/' + DAILY_GOAL + ' 题</span></button>'
  ).join('');

  const wrongTotal = SUBJECTS.reduce((n, s) => n + (state.wrong[s.id] || []).length, 0);
  const earned = badges().filter(b => b.ok).length;

  return '<main id="main-content" class="home-layout" tabindex="-1">' +
    '<div class="home-main">' +
      '<div class="page-heading"><p class="eyebrow">我的学习空间</p>' +
      '<h1>今天，想学点什么？</h1><p>每天一小步，收获新本领。</p></div>' +
      '<section aria-labelledby="practice-title"><div class="section-heading">' +
      '<h2 id="practice-title">每日练习</h2><span>每科 ' + DAILY_GOAL + ' 题</span></div>' +
      '<div class="subject-grid">' + cards + '</div></section>' +
      '<section aria-labelledby="books-title"><div class="section-heading">' +
      '<h2 id="books-title">学习百宝箱</h2><span>听一听 · 记一记 · 写一写</span></div>' +
      '<div class="book-grid">' +
        '<a class="book-card" href="words.html" style="--bc:#4d96ff"><span class="book-icon">📘</span>' +
        '<h3>单词本 <span>↗</span></h3><p>按主题点读，拆分记单词</p><span class="book-tag">英语积累</span></a>' +
        '<a class="book-card" href="idioms.html" style="--bc:#d97745"><span class="book-icon">🏮</span>' +
        '<h3>成语本 <span>↗</span></h3><p>听典故故事，学会用成语</p><span class="book-tag">语文积累</span></a>' +
        '<a class="book-card" href="writing.html" style="--bc:#8b65c9"><span class="book-icon">✏️</span>' +
        '<h3>作文坊 <span>↗</span></h3><p>看写作锦囊，写自己的故事</p><span class="book-tag">表达创作</span></a>' +
        '<a class="book-card" href="chain.html" style="--bc:#157d73"><span class="book-icon">🐉</span>' +
        '<h3>成语接龙 <span>↗</span></h3><p>首尾接一接，边玩边记成语</p><span class="book-tag">趣味挑战</span></a>' +
      '</div></section>' +
    '</div>' +
    '<aside class="home-aside" aria-label="我的学习进度">' +
      '<section class="daily-card"><div class="aside-heading"><h2>📅 今日小目标</h2><span>每天坚持</span></div>' +
      '<div class="rings-row">' + rings + '</div>' +
      '<p class="goal-note">三科各完成 ' + DAILY_GOAL + ' 题，可领取 ⭐ +10</p>' + claim + '</section>' +
      '<section class="review-card"><span class="review-icon">📕</span><div><h2>错题再练一练</h2>' +
      '<p>' + (wrongTotal ? '还有 ' + wrongTotal + ' 道错题等你攻克' : '暂时没有错题，继续保持！') + '</p></div>' +
      '<button class="mini-btn" data-act="wrong">打开错题本 <span>→</span></button></section>' +
      '<button class="achievement-card" data-act="settings"><span>🏅</span><div><b>我的成就</b>' +
      '<p>已点亮 ' + earned + ' / ' + badges().length + ' 枚徽章</p></div><span class="achievement-arrow">→</span></button>' +
      '<p class="storage-note">学习进度自动保存在当前浏览器</p>' +
    '</aside></main>';
}

function viewSubject() {
  const s = subjectById(curSubject);
  if (!s) return viewHome();
  const modes = s.modes.map(m =>
    '<button class="mode-card" style="--mc:' + s.color + '" data-act="mode" data-mid="' + m.id + '">' +
    '<span class="mode-emoji">' + m.emoji + '</span>' +
    '<span class="mode-name">' + m.name + '</span>' +
    '<span class="mode-desc">' + m.desc + '</span></button>'
  ).join('');
  return '<div class="back-row"><button class="mini-btn" data-act="home">⬅ 首页</button></div>' +
    '<h1 class="subject-title" style="color:' + s.color + '">' + s.emoji + ' ' + s.name + '，今天练什么？</h1>' +
    '<section class="mode-list">' + modes + '</section>';
}

function speakBtn(text, lang) {
  return '<button class="speak" data-act="speak" data-t="' + esc(text) + '" data-lang="' + (lang || 'en-US') + '">🔊</button>';
}

function viewQuiz() {
  if (!session) return viewHome();
  const q = session.questions[session.idx];
  const s = subjectById(session.sid);
  const head = '<div class="quiz-top">' +
    '<button class="mini" data-act="quitQuiz">✖</button>' +
    '<div class="q-progress"><span style="width:' + (session.idx / session.questions.length * 100) + '%;background:' + s.color + '"></span></div>' +
    '<span class="q-count">' + (session.idx + 1) + ' / ' + session.questions.length + '</span></div>';

  let body = '';
  if (q.type === 'choice') {
    const cls = i => {
      if (session.phase !== 'feedback') return '';
      if (i === q.answerIndex) return ' correct';
      if (i === session.picked) return ' wrong';
      return ' dim';
    };
    body = '<div class="q-prompt' + (q.big ? ' q-big' : '') + '">' + (q.speak ? speakBtn(q.speak) : '') + esc(q.prompt) + '</div>' +
      '<div class="choices">' + q.choices.map((c, i) =>
        '<button class="choice-btn' + cls(i) + '" data-act="choose" data-i="' + i + '"' +
        (session.phase === 'feedback' ? ' disabled' : '') + '>' + esc(c) + '</button>').join('') + '</div>';
  } else if (q.type === 'input') {
    if (q.pad === 'number') {
      const val = esc(session.input) || '<span class="placeholder">？</span>';
      body = '<div class="q-prompt q-big">' + esc(q.prompt) + '</div>' +
        (q.hint ? '<p class="hint">💡 ' + esc(q.hint) + '</p>' : '') +
        '<div class="answer-display">' + val + '</div>' +
        '<div class="keypad">' +
        [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(k => '<button class="key" data-act="pad" data-k="' + k + '">' + k + '</button>').join('') +
        '<button class="key key-del" data-act="pad" data-k="del">⌫</button>' +
        '<button class="key key-ok" data-act="submit">✔ 确定</button></div>';
    } else {
      body = '<div class="q-prompt">' + esc(q.prompt) + '</div>' +
        '<input id="spellInput" class="text-input" placeholder="在这里输入单词" value="' + esc(session.input) + '" autocomplete="off" autocapitalize="off" spellcheck="false"' +
        (session.phase === 'feedback' ? ' disabled' : '') + '>' +
        (q.hint ? '<p class="hint">💡 ' + esc(q.hint) + '</p>' : '') +
        '<button class="ok-btn" data-act="submitText">确定</button>';
    }
  }

  let fb = '';
  if (session.phase === 'feedback') {
    const ok = session.lastCorrect;
    fb = '<div class="feedback ' + (ok ? 'ok' : 'no') + '">' +
      '<div class="fb-head">' + (ok ? '🎉 答对啦，加 1 ⭐！' : '💪 没关系，记住答案～') + '</div>' +
      '<div class="fb-answer">' + (ok ? '' : '正确答案：<b>' + esc(q.choices ? q.choices[q.answerIndex] : q.answer) + '</b><br>') +
      (q.explain ? esc(q.explain) : '') + '</div>' +
      (ok ? '<button class="ok-btn" data-act="next">下一题 ➜</button>' : '<button class="ok-btn" data-act="next">下一题 ➜</button>') +
      '</div>';
  }

  return head + '<div class="q-card" style="border-top:10px solid ' + s.color + '">' + body + fb + '</div>';
}

function viewResult() {
  const r = result;
  const s = subjectById(r.sid);
  const emoji = r.acc === 100 ? '🏆' : r.acc >= 80 ? '😄' : r.acc >= 60 ? '🙂' : '🌱';
  const msg = r.acc === 100 ? '全对！太厉害啦！' : r.acc >= 80 ? '真棒，继续加油！' : r.acc >= 60 ? '有进步，再来一组吧！' : '别灰心，错题都帮你收好啦';
  const review = r.results.filter(x => !x.ok).map(x =>
    '<div class="review-item"><div class="rq">' + esc(x.prompt) + '</div><div class="ra">✅ ' + esc(x.ans) + (x.explain ? '　' + esc(x.explain) : '') + '</div></div>'
  ).join('');
  const dailyHint = dailyAllDone() && !state.daily.bonus
    ? '<div class="daily-hint">🎁 今日任务全部完成！回首页领取奖励</div>' : '';
  return '<div class="result-card">' +
    '<div class="result-emoji">' + emoji + '</div>' +
    '<div class="result-msg">' + msg + '</div>' +
    '<div class="result-stat">' + s.emoji + ' ' + esc(r.modeName) + '：答对 <b>' + r.ok + '</b> / ' + r.total + ' 题（' + r.acc + '%）</div>' +
    '<div class="result-stat">本组获得 ⭐ + ' + r.stars + (r.bonus ? '　满分奖励 ⭐ + ' + r.bonus : '') + '</div>' +
    dailyHint +
    '<div class="row-center">' +
    '<button class="ok-btn" data-act="retry">再来一组 🔄</button>' +
    '<button class="mini-btn" data-act="subject" data-id="' + r.sid + '">换个玩法</button>' +
    '<button class="mini-btn" data-act="home">回首页 🏠</button></div>' +
    '</div>' +
    (review ? '<h3 class="review-title">📖 本组错题回顾</h3><div class="review-list">' + review + '</div>' : '');
}

function viewWrong() {
  const rows = SUBJECTS.map(s => {
    const book = state.wrong[s.id] || [];
    const list = book.map(w => {
      const ans = w.choices ? w.choices[w.answerIndex] : w.answer;
      return '<div class="wrong-line"><span class="wq">' + esc(w.prompt) + '</span><span class="wa">✅ ' + esc(ans) + '</span></div>';
    }).join('');
    return '<div class="wrong-row" style="border-left:10px solid ' + s.color + '">' +
      '<div class="wrong-head"><b>' + s.emoji + ' ' + s.name + '</b><span class="dim">共 ' + book.length + ' 道</span>' +
      (book.length
        ? '<button class="mini-btn" data-act="redo" data-id="' + s.id + '">开始重做 ▶</button>' +
          '<button class="mini-btn ghost" data-act="clearWrong" data-id="' + s.id + '">清空</button>'
        : '<span class="dim">太棒了，没有错题！🎉</span>') +
      '</div>' + (book.length ? '<div class="wrong-list">' + list + '</div>' : '') + '</div>';
  }).join('');
  return '<div class="back-row"><button class="mini-btn" data-act="home">⬅ 首页</button></div>' +
    '<h1 class="subject-title">📕 错题本</h1><p class="page-description">再答对 2 次，就能消灭一道错题。</p>' +
    '<div class="wrong-grid">' + rows + '</div>';
}

function viewSheet() {
  return '<div class="back-row"><button class="mini-btn" data-act="subject" data-id="math">⬅ 返回数学</button></div>' +
    '<h2 class="subject-title" style="color:#4d96ff">🖨️ 口算打印卡（40 道 + 答案页）</h2>' +
    '<p class="hint">点击"打印"后会打印出练习卷：第一页是题目，第二页是答案（家长核对用）。也可以让孩子直接在屏幕预览中作答。</p>' +
    '<div class="sheet-preview">' + sheetHTML + '</div>' +
    '<div class="row-center" style="margin:16px 0">' +
    '<button class="ok-btn" data-act="printNow">🖨️ 打印</button>' +
    '<button class="mini-btn" data-act="newSheet">🔄 换一批题</button></div>';
}

function viewFlash() {
  if (!flash) return viewHome();
  const w = flash.list[flash.i];
  const s = subjectById(flash.sid);
  let card;
  if (!flash.flipped) {
    card = '<div class="flash-card" style="border-top:10px solid ' + s.color + '" data-act="flip">' +
      '<div class="flash-word">' + esc(w.en) + '</div>' +
      '<div class="flash-tip">👆 点一点，看意思</div></div>';
  } else {
    card = '<div class="flash-card flipped" style="border-top:10px solid ' + s.color + '" data-act="flip">' +
      '<div class="flash-word">' + esc(w.zh) + '</div>' +
      '<div class="flash-tip">' + esc(w.en) + '</div></div>';
  }
  return '<div class="back-row"><button class="mini-btn" data-act="subject" data-id="english">⬅ 返回英语</button></div>' +
    '<div class="quiz-top"><div class="q-progress"><span style="width:' + (flash.i / flash.list.length * 100) + '%;background:#2fbf71"></span></div>' +
    '<span class="q-count">' + (flash.i + 1) + ' / ' + flash.list.length + '</span></div>' +
    card +
    '<div class="row-center">' + speakBtn(w.en) + '</div>' +
    (flash.flipped
      ? '<div class="flash-btns">' +
        '<button class="know-btn" data-act="flashKnow" data-k="1">😊 认识</button>' +
        '<button class="dunno-btn" data-act="flashKnow" data-k="0">🤔 没记住</button></div>'
      : '');
}

function viewFlashEnd() {
  return '<div class="result-card">' +
    '<div class="result-emoji">🃏</div>' +
    '<div class="result-msg">单词卡翻完啦！认识 ' + flash.known + ' / ' + flash.list.length + ' 个</div>' +
    '<div class="result-stat">奖励 ⭐ + 3（没记住的已自动放进错题本）</div>' +
    '<div class="row-center">' +
    '<button class="ok-btn" data-act="mode-flash">再来一副 🔄</button>' +
    '<button class="mini-btn" data-act="home">回首页 🏠</button></div></div>';
}

/* ---------- 成就与设置 ---------- */
function badges() {
  const t = state.totals;
  return [
    { e: '🌱', n: '初次挑战', ok: t.q >= 1, d: '完成第一道题' },
    { e: '🔥', n: '坚持三天', ok: state.streak >= 3, d: '连续 3 天完成每日任务' },
    { e: '📅', n: '七日之约', ok: state.streak >= 7, d: '连续 7 天完成每日任务' },
    { e: '💯', n: '满分达人', ok: t.perfect >= 1, d: '一次练习全部答对' },
    { e: '🧠', n: '百题小将', ok: t.q >= 100, d: '累计答题 100 道' },
    { e: '🎓', n: '五百高手', ok: t.q >= 500, d: '累计答题 500 道' },
    { e: '❤️', n: '错题克星', ok: t.redoFixed >= 5, d: '在错题本中消灭 5 道错题' },
    { e: '⭐', n: '星星大王', ok: state.stars >= 200, d: '累计获得 200 颗星星' },
  ];
}

function renderModal() {
  const el = document.getElementById('modal');
  if (!modal) { el.innerHTML = ''; return; }
  if (modal === 'settings') {
    const bg = badges().map(b =>
      '<div class="badge' + (b.ok ? '' : ' locked') + '"><div class="badge-e">' + (b.ok ? b.e : '🔒') + '</div>' +
      '<div class="badge-n">' + b.n + '</div><div class="badge-d">' + b.d + '</div></div>').join('');
    el.innerHTML = '<div class="modal-mask" data-act="closeModal"><div class="modal">' +
      '<h3>⚙️ 设置与成就</h3>' +
      '<div class="settings-row"><span>练习音效与朗读</span>' +
      '<button class="mini-btn" data-act="toggleSound">' + (state.sound ? '🔊 已开启' : '🔇 已关闭') + '</button></div>' +
      '<div class="settings-row"><span>英语发音人</span>' +
      '<select id="voiceSel" class="voice-sel"></select></div>' +
      '<h4>🏅 我的成就（累计答题 ' + state.totals.q + ' 道 · 答对 ' + state.totals.ok + ' 道）</h4>' +
      '<div class="badges-grid">' + bg + '</div>' +
      '<div class="settings-row"><span class="dim">所有记录保存在本机浏览器中</span>' +
      '<button class="mini-btn ghost" data-act="reset">🗑️ 清空进度</button></div>' +
      '<div class="row-center"><button class="ok-btn" data-act="closeModal">好的</button></div>' +
      '</div></div>';
    const vsel = document.getElementById('voiceSel');
    if (vsel && window.SpeechKit) {
      const list = SpeechKit.englishVoiceList();
      const cur = SpeechKit.pref || ((SpeechKit.pickVoice('en') || {}).name || '');
      vsel.innerHTML = list.length
        ? list.map(v => '<option value="' + esc(v.name) + '"' + (v.name === cur ? ' selected' : '') + '>' +
            esc(v.name) + '（' + esc(v.lang) + '）</option>').join('')
        : '<option value="">系统默认</option>';
    }
  } else if (modal === 'celebrate') {
    el.innerHTML = '<div class="modal-mask" data-act="closeModal"><div class="modal celebrate">' +
      '<div class="result-emoji">🎉</div>' +
      '<h3>今日任务全部完成！</h3>' +
      '<div class="result-stat">奖励 ⭐ + 10　连续打卡 🔥 ' + state.streak + ' 天</div>' +
      '<div class="row-center"><button class="ok-btn" data-act="closeModal">太棒了！</button></div>' +
      '</div></div>';
  }
}

function render() {
  rollDaily();
  const el = document.getElementById('app');
  let html = '';
  if (view === 'home') html = viewHome();
  else if (view === 'subject') html = viewSubject();
  else if (view === 'quiz') html = viewQuiz();
  else if (view === 'result') html = viewResult();
  else if (view === 'wrong') html = viewWrong();
  else if (view === 'sheet') html = viewSheet();
  else if (view === 'flash') html = viewFlash();
  else if (view === 'flashEnd') html = viewFlashEnd();
  el.dataset.view = view;
  const focused = ['quiz', 'result', 'flash', 'flashEnd'].includes(view);
  el.innerHTML = headerHTML() + (view === 'home' ? html :
    '<main id="main-content" class="page-content' + (focused ? ' focus-page' : '') + '" tabindex="-1">' + html + '</main>');

  /* 自动朗读英语题干 / 聚焦输入框 */
  if (view === 'quiz' && session) {
    const q = session.questions[session.idx];
    if (q && session.phase === 'answer') {
      if (q.speak) speak(q.speak, 'en-US');
      const input = document.getElementById('spellInput');
      if (input && !input.disabled) input.focus();
    }
  }
  if (view === 'flash' && flash && !flash.flipped) speak(flash.list[flash.i].en, 'en-US');
}

/* ============================================================
   事件
   ============================================================ */
const ACTIONS = {
  home() { clearSession(); view = 'home'; render(); },
  words() { window.location.href = 'words.html'; },
  idioms() { window.location.href = 'idioms.html'; },
  writing() { window.location.href = 'writing.html'; },
  subject(d) { curSubject = d.id; clearSession(); view = 'subject'; render(); },
  mode(d) {
    const m = modeById(curSubject, d.mid);
    if (!m) return;
    if (m.kind === 'print') { sheetHTML = buildSheet(); view = 'sheet'; render(); }
    else if (m.kind === 'flash') startFlash(curSubject);
    else startQuiz(curSubject, d.mid);
  },
  'mode-flash'() { startFlash('english'); },
  choose(d) { chooseAnswer(Number(d.i)); },
  pad(d) {
    if (!session || session.phase !== 'answer') return;
    if (d.k === 'del') session.input = session.input.slice(0, -1);
    else if (session.input.length < 10) session.input += d.k;
    render();
  },
  submit() { submitPad(); },
  submitText() { submitText(); },
  next() { nextQuestion(); },
  retry() { startQuiz(result.sid, result.mid); },
  quitQuiz() { clearSession(); view = curSubject ? 'subject' : 'home'; render(); },
  wrong() { clearSession(); view = 'wrong'; render(); },
  redo(d) { startQuiz(d.id, 'redo'); },
  clearWrong(d) {
    if (confirm('确定清空「' + subjectById(d.id).name + '」的错题本吗？')) {
      state.wrong[d.id] = [];
      save(); render();
    }
  },
  settings() { modal = 'settings'; renderModal(); },
  closeModal() { modal = null; renderModal(); },
  toggleSound() { state.sound = !state.sound; save(); renderModal(); render(); },
  reset() {
    if (confirm('确定清空全部学习记录吗？此操作不能恢复。') &&
        confirm('再确认一次：真的要清空星星、错题本和打卡记录吗？')) {
      state = defaultState();
      save();
      modal = null; renderModal();
      view = 'home'; render();
    }
  },
  speak(d) { speak(d.t, d.lang); },
  flip() { flash.flipped = !flash.flipped; render(); if (flash.flipped) speak(flash.list[flash.i].en, 'en-US'); },
  flashKnow(d) { flashMark(d.k === '1'); },
  printNow() {
    document.getElementById('printArea').innerHTML = sheetHTML;
    window.print();
  },
  newSheet() { sheetHTML = buildSheet(); render(); },
  claim() { claimDaily(); },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (!fn) return;
  if (el.dataset.act === 'closeModal' && e.target !== el) return; // 点击遮罩才关闭
  e.preventDefault();
  try {
    fn(el.dataset, el);
  } catch (err) {
    console.error('[乐学堂] 操作出错:', err);
  }
});

document.addEventListener('input', e => {
  if (e.target && e.target.id === 'spellInput' && session) {
    session.input = e.target.value;
  }
});

document.addEventListener('change', e => {
  if (e.target && e.target.id === 'voiceSel' && window.SpeechKit) {
    SpeechKit.setVoicePref(e.target.value);
    SpeechKit.speak('Hello! Nice to meet you.', { rate: 0.9 });
  }
});

document.addEventListener('keydown', e => {
  if (!session || view !== 'quiz' || session.phase !== 'answer') {
    if (e.key === 'Enter' && session && view === 'quiz' && session.phase === 'feedback') nextQuestion();
    return;
  }
  const q = session.questions[session.idx];
  if (q.type !== 'input') return;
  if (q.pad === 'number') {
    if (/^[0-9.]$/.test(e.key)) {
      if (session.input.length < 10) { session.input += e.key; render(); }
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      session.input = session.input.slice(0, -1); render(); e.preventDefault();
    } else if (e.key === 'Enter') {
      submitPad();
    }
  } else if (q.pad === 'text' && e.key === 'Enter') {
    submitText();
  }
});

/* 供自动化测试使用 */
window.App = {
  get state() { return state; },
  get view() { return view; },
  get session() { return session; },
  actions: ACTIONS,
  render, startQuiz, buildSheet,
};

/* ---------- 启动 ---------- */
rollDaily();
render();
