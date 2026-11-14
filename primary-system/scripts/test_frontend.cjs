/* Zero-dependency interaction regressions: node --test scripts/test_frontend.cjs */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function element() {
  const classes = new Set();
  return {
    dataset: {}, textContent: '', innerHTML: '', value: '', hidden: false,
    handlers: {}, classList: {
      add: (name) => classes.add(name), remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
    },
    addEventListener(event, fn) { this.handlers[event] = fn; },
    querySelectorAll() { return []; },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    append() {}, focus() {}, scrollIntoView() {},
  };
}

function run(file, context) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'static', file), 'utf8'), context);
}

function mathbookPage({ account, legacy, links = {}, hash = '', fetch, confirm = () => true }) {
  const elements = {}, handlers = {}, writes = [], scrolled = [];
  const get = (id) => elements[id] || (elements[id] = element());
  if (account) get('mathbook-progress').textContent = JSON.stringify(account);
  get('mathbook-exercises').textContent = JSON.stringify(links);
  if (hash) get(hash.slice(1)).scrollIntoView = () => scrolled.push(hash.slice(1));
  const context = vm.createContext({
    document: {
      getElementById: (id) => id === 'mathbook-progress' && !account ? null : get(id),
      addEventListener: (event, fn) => { handlers[event] = fn; },
      cookie: 'primary_csrftoken=math-csrf', hidden: false,
    },
    window: {addEventListener() {}, scrollTo() {}}, location: {hash}, history: {replaceState() {}},
    requestAnimationFrame: (callback) => callback(),
    localStorage: {
      getItem: () => JSON.stringify(legacy),
      setItem: (key, value) => writes.push({key, value: JSON.parse(value)}),
    },
    fetch, confirm,
  });
  run('mathbook/books/4a.js', context);
  run('mathbook/math-app.js', context);
  return {points: context.window.MathPoints, get, handlers, writes, scrolled};
}

const mathAccount = {
  url: '/mathbook/4a/progress/', scope: 'scope-a', revision: 2,
  learned: ['mu2-1'], last_unit: 'mu2', local_imported: false,
};

test('guest mathbook resumes legacy state and keeps new progress in local storage', () => {
  const legacy = {last: 'mu2', learned: {'mu2-mu2-1': true}, pane: {}};
  const page = mathbookPage({legacy});
  assert.equal(page.points.view, 'mu2');
  assert.match(page.get('stats').textContent, /已读 0 \/ 43 · 自评掌握 1 \/ 43/);
  page.points.toggleMark('mu2', 'mu2-1', 'learn');
  page.points.toggleMark('mu2', 'mu2-2', 'read');
  page.points.selectView('mu3');
  assert.deepEqual(page.writes.at(-1).value, {last: 'mu3', learned: {}, read: {'mu2-mu2-2': true}, pane: {}});
  assert.match(page.writes.at(-1).key, /^mathbook_/);
});

test('account mathbook imports legacy marks only on confirmation and never writes them back locally', async () => {
  const legacy = {last: 'mu3', learned: {'mu3-mu3-1': true, 'mu3-retired': true}};
  const requests = [];
  let confirmed = false;
  const page = mathbookPage({
    account: mathAccount, legacy, confirm: () => confirmed,
    fetch: async (url, request) => {
      requests.push({url, request});
      return {ok: true, json: async () => ({
        learned: ['mu2-1', 'mu3-1'], last_unit: 'mu2', local_imported: true, revision: 3,
      })};
    },
  });
  assert.equal(page.points.view, 'mu2');
  assert.match(page.get('stats').textContent, /自评掌握 1 \/ 43/);
  assert.equal(page.get('mk-import-progress').hidden, false);
  page.get('mk-import-progress').handlers.click();
  await new Promise(setImmediate);
  assert.equal(requests.length, 0);
  confirmed = true;
  page.get('mk-import-progress').handlers.click();
  await new Promise(setImmediate);
  assert.equal(requests[0].url, mathAccount.url);
  assert.equal(requests[0].request.headers['X-Mathbook-Scope'], mathAccount.scope);
  assert.equal(requests[0].request.headers['X-CSRFToken'], 'math-csrf');
  assert.deepEqual(JSON.parse(requests[0].request.body), {
    action: 'import', read_points: [], learned: ['mu3-1'], unit: 'mu3', revision: 2,
  });
  assert.equal(page.get('mk-import-progress').hidden, true);
  assert.match(page.get('stats').textContent, /自评掌握 2 \/ 43/);
  assert.deepEqual(page.writes, []);
});

test('mathbook rejects queued stale changes and clears private marks after switching accounts', async () => {
  const requests = [];
  const page = mathbookPage({
    account: mathAccount, hash: '#mu3',
    fetch: async (url, request) => {
      requests.push(request);
      return {ok: false, status: 409, json: async () => request.method
        ? {code: 'conflict', learned: ['mu3-1'], last_unit: 'mu3', revision: 3, error: '进度已在别处更新'}
        : {code: 'owner_changed', error: '登录状态已变化'}};
    },
  });
  assert.equal(page.points.view, 'mu3');
  assert.deepEqual(requests, []);
  const saving = page.points.toggleMark('mu2', 'mu2-1', 'learn');
  page.points.selectView('mu1');
  await saving;
  await new Promise(setImmediate);
  assert.equal(requests.length, 1);
  assert.equal(page.points.state.learned['mu3-mu3-1'], true);
  assert.match(page.get('mk-sync-status').textContent, /别处更新/);
  page.handlers.visibilitychange();
  await new Promise(setImmediate);
  assert.equal(requests.length, 2);
  assert.equal(page.points.state.learned['mu3-mu3-1'], undefined);
  assert.match(page.get('mk-sync-status').textContent, /登录状态已变化/);
});

test('a mathbook exercise return anchor opens the original knowledge card without saving progress', () => {
  const point = 'mu3-1', href = '/questionbank/practice/mathbook/4a/mu3-1/';
  const page = mathbookPage({account: mathAccount, hash: '#' + point, links: {[point]: href}});
  assert.equal(page.points.view, 'mu3');
  assert.deepEqual(page.scrolled, [point]);
  assert.ok(page.get('cards').innerHTML.includes(`href="${href}">做例题 · 自评`));
  assert.match(page.get('cards').innerHTML, /id="mu3-1"/);
  assert.equal(page.points.state.last, 'mu2');
  assert.deepEqual(page.writes, []);
});

function questionPractice(questions, correct, effects = true) {
  const board = element(), fields = {};
  const get = (selector) => fields[selector] || (fields[selector] = element());
  board.querySelector = get;
  const question = get('[data-qb-question]');
  question.querySelector = get;
  const feedback = get('[data-qb-feedback]');
  const actions = element(), next = element();
  actions.querySelector = () => next;
  feedback.querySelector = (selector) => selector === '.qb-feedback-actions' ? actions : get(selector);
  get('[data-qb-progress-fill]').style = {};
  get('[data-qb-stars]').hidden = true;
  board.dataset = {answerUrl: '/questionbank/api/answer/', practiceUrl: '/questionbank/practice/', size: 5};
  const requests = [], celebrations = [];
  run('questionbank/practice.js', vm.createContext({
    document: {
      querySelector: () => board,
      getElementById: () => ({textContent: JSON.stringify(questions)}),
      addEventListener() {}, cookie: '',
    },
    window: effects ? {StudyEffects: {celebrate: event => celebrations.push(event)}} : {},
    fetch: async (url, request) => {
      requests.push(JSON.parse(request.body));
      return {ok: true, json: async () => ({correct: correct[requests.length - 1]})};
    },
  }));
  return {
    get, requests, celebrations,
    answer: (value) => question.handlers.click({
      target: {closest: (selector) => selector === '[data-qb-option]' ? {dataset: {value}} : null},
    }),
    next: () => next.handlers.click(),
  };
}

const exampleQuestion = {type: 'selfcheck', stem: '课本例题', answer: '6', uuid: 'example'};

test('mixed question practice keeps self-checks out of the objectively graded score', async () => {
  const page = questionPractice([exampleQuestion, {type: 'truefalse', stem: '判断题', uuid: 'boolean'}], [true, false]);
  await page.answer('right');
  assert.deepEqual(page.requests[0].given, {self: 'right'});
  assert.match(page.get('[data-qb-feedback-head]').textContent, /自评已记录/);
  assert.match(page.get('[data-qb-tally]').textContent, /答对 0 题 · 已自评 1 题/);
  page.next();
  await page.answer('true');
  page.next();
  assert.equal(page.get('[data-qb-final-score]').textContent, '答对 0／1 题 · 自评做对 1／1 题');
  assert.match(page.get('[data-qb-stars]')['aria-label'], /判分题获得 0 颗星/);
});

test('a self-check-only round displays its assessment without objective stars', async () => {
  const page = questionPractice([exampleQuestion], [true]);
  await page.answer('right');
  page.next();
  assert.equal(page.get('[data-qb-final-score]').textContent, '自评做对 1／1 题');
  assert.equal(page.get('[data-qb-stars]').hidden, true);
});

test('math celebration occurs once only after the full round is acknowledged', async () => {
  const q = {type: 'truefalse', stem: '计算判断', area: 'math'};
  const page = questionPractice([{...q, uuid: 'a'}, {...q, uuid: 'b'}], [true, false]);
  await page.answer('true');
  assert.equal(page.celebrations.length, 0);
  page.next();
  page.next(); // 旧按钮的重复点击不能跳过未作答题。
  assert.equal(page.celebrations.length, 0);
  await page.answer('false');
  assert.equal(page.celebrations.length, 0);
  page.next(); page.next();
  assert.equal(page.celebrations.length, 1);
  assert.equal(page.get('[data-qb-final-score]').textContent, '答对 1／2 题');
});

test('failed answer retries do not count toward completion', async () => {
  const page = questionPractice([{type: 'truefalse', stem: '计算判断', area: 'math'}], [undefined, true]);
  await page.answer('true');
  assert.match(page.get('[data-qb-feedback-head]').textContent, /上报没成功/);
  assert.equal(page.celebrations.length, 0);
  await page.answer('true');
  page.next();
  assert.equal(page.celebrations.length, 1);
  assert.equal(page.get('[data-qb-final-score]').textContent, '答对 1／1 题');
});

test('non-math rounds and missing effects preserve normal result rendering', async () => {
  for (const [area, effects] of [['english', true], ['math', false]]) {
    const page = questionPractice([{type: 'truefalse', stem: '判断题', area}], [true], effects);
    await page.answer('true'); page.next();
    assert.equal(page.celebrations.length, 0);
    assert.equal(page.get('[data-qb-final-score]').textContent, '答对 1／1 题');
  }
});

function speechPage({ supported = true, throws = false, controls = false, sequenceControls = false, pausable = false, textbookKind = 'words', stored = {}, voices = [] } = {}) {
  const button = element(), items = [element(), element()], clicks = [], spoken = [];
  const buttons = [button], timers = new Map(), lifecycle = {}, signals = [];
  let time = 0, timerId = 0;
  button.textContent = '连读';
  button.dataset = { ttsSequence: '#cards', ttsRate: '0.78' };
  items[0].dataset.saySeq = 'A long sentence that must finish before the next word.';
  items[1].dataset.saySeq = 'apple';
  let current = null;
  const storage = { ...stored };
  const fields = controls ? {
    'tts-rate': Object.assign(element(), { id: 'tts-rate', min: '0.5', max: '1.5', value: '0.8' }),
    'tts-volume': Object.assign(element(), { id: 'tts-volume', min: '0', max: '1', value: '1' }),
    'tts-rate-value': element(), 'tts-volume-value': element(), 'tts-voice': element(),
    'tts-status': element(), 'tts-preview': element(),
  } : {};
  if (sequenceControls) Object.assign(fields, {
    'tts-interval': Object.assign(element(), { id: 'tts-interval', min: '0', max: '10', step: '1', value: '3' }),
    'tts-repeat': Object.assign(element(), { id: 'tts-repeat', min: '1', max: '5', step: '1', value: '1' }),
    'tts-interval-value': element(), 'tts-repeat-value': element(), 'tts-sequence-status': element(),
  });
  if (pausable) {
    button.dataset.ttsPausable = 'true';
    const contentId = textbookKind === 'texts' ? 'english-dialogues' : textbookKind === 'scenario' ? 'words-cards' : textbookKind === 'idioms' ? 'idiom-cards' : 'english-cards';
    Object.assign(fields, {
      [textbookKind === 'scenario' ? 'words-play-btn' : 'tts-unit-play']: button, 'tts-sequence-player': element(),
      'tts-sequence-current': element(), 'tts-sequence-progress': element(),
      'tts-sequence-restart': Object.assign(element(), { disabled: true }),
      'tts-sequence-stop': Object.assign(element(), { disabled: true }),
      'tts-text-scope': Object.assign(element(), { value: '#cards' }),
      [contentId]: Object.assign(element(), { id: contentId }),
    });
    if (textbookKind === 'idioms') {
      fields['tts-sequence-player'].dataset.ttsLanguage = 'zh-CN';
      fields['tts-text-scope'].selectedOptions = [{dataset: {ttsTextKey: 'saySeq', ttsFocusLabel: '🔊 听这个成语'}}];
      delete fields['tts-voice'];
      items[0].dataset = {saySeq: '兴高采烈', sayExample: '同学们兴高采烈地去春游。'};
      items[1].dataset = {saySeq: '喜出望外', sayExample: '听到这个好消息，他喜出望外。'};
    }
  }
  const synth = {
    getVoices: () => voices, addEventListener() {},
    get speaking() { return current !== null; }, pending: false,
    paused: false, pauseCount: 0, resumeCount: 0,
    pause() { this.paused = true; this.pauseCount += 1; },
    resume() { this.paused = false; this.resumeCount += 1; },
    cancel() {
      const old = current;
      current = null;
      if (old?.onerror) old.onerror({ error: 'canceled' });
    },
    speak(utterance) {
      if (throws) throw new Error('audio unavailable');
      current = utterance;
      spoken.push(utterance);
    },
  };
  const context = vm.createContext({
    window: { ...(supported ? { speechSynthesis: synth } : {}), addEventListener: (event, fn) => { lifecycle[event] = fn; } },
    localStorage: { getItem: (key) => storage[key] || null, setItem: (key, value) => { storage[key] = value; } },
    SpeechSynthesisUtterance: function (text) { this.text = text; },
    CustomEvent: function (type) {this.type = type;},
    document: {
      addEventListener: (event, fn) => clicks.push(fn), getElementById: (id) => fields[id] || null,
      dispatchEvent: event => {signals.push(event.type); return true;},
      createElement: () => element(),
      querySelector: (selector) => ({ querySelectorAll: () => selector === '#last' ? items.slice(1) : items }),
      querySelectorAll: (selector) => selector === '.tts-playing'
        ? items.filter((item) => item.classList.contains('tts-playing'))
        : buttons.filter((button) => button.classList.contains('tts-active')),
    },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, at: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    performance: { now: () => time },
    setInterval() { throw new Error('A timer must not advance speech'); },
  });
  run('speech.js', context);
  run('tts.js', context);
  const click = (target, selector) => clicks.forEach((fn) => fn({
    preventDefault() {}, target: { closest: (value) => value === selector ? target : null },
  }));
  return {
    button, spoken, items, fields, storage, lifecycle, timers, synth, signals, click: () => click(button, '[data-tts-sequence]'),
    reset() { context.window.TTS.resetSequence(); },
    restart() { fields['tts-sequence-restart'].handlers.click(); },
    stop() { fields['tts-sequence-stop'].handlers.click(); },
    chooseScope(value, textKey) {
      fields['tts-text-scope'].value = value;
      if (textKey) fields['tts-text-scope'].selectedOptions = [{dataset: {ttsTextKey: textKey, ttsFocusLabel: '🔊 听这句例句'}}];
      fields['tts-text-scope'].handlers.change();
    },
    clickOther() {
      const other = Object.assign(element(), { textContent: '另一段连读', dataset: { ttsSequence: '#other' } });
      buttons.push(other);
      click(other, '[data-tts-sequence]');
      return other;
    },
    advance(ms) {
      const end = time + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        const [id, timer] = due;
        time = timer.at;
        timers.delete(id);
        timer.callback();
      }
      time = end;
    },
    adjust(name, value) { fields['tts-' + name].value = String(value); fields['tts-' + name].handlers.input(); },
    chooseVoice(name) { fields['tts-voice'].value = name; fields['tts-voice'].handlers.change(); },
    say(text) { click({ dataset: { say: text } }, '[data-say]'); },
    finish() { const old = current; current = null; old.onend(); },
    fail() { const old = current; current = null; old.onerror({ error: 'audio-busy' }); },
  };
}

test('sequence advances only after end and restores the button after the final word', () => {
  const page = speechPage();
  page.click();
  assert.equal(page.spoken.length, 1);
  assert.match(page.spoken[0].text, /long sentence/);
  assert.ok(page.items[0].classList.contains('tts-playing'));
  page.finish();
  assert.deepEqual(page.spoken.map((u) => u.text), [page.items[0].dataset.saySeq, 'apple']);
  page.finish();
  assert.equal(page.button.textContent, '连读');
  assert.ok(page.items.every((item) => !item.classList.contains('tts-playing')));
});

test('stop, restart and late canceled callbacks cannot advance a newer sequence', () => {
  const page = speechPage();
  page.click();
  const canceled = page.spoken[0];
  page.click();
  assert.equal(page.button.textContent, '连读');
  page.click();
  canceled.onend();
  canceled.onerror({ error: 'canceled' });
  assert.equal(page.spoken.length, 2);
  assert.ok(page.button.classList.contains('tts-active'));
});

test('single-word reading cancels the sequence and late completion stays canceled', () => {
  const page = speechPage();
  page.click();
  const canceled = page.spoken[0];
  page.say('pear');
  canceled.onend();
  assert.equal(page.spoken.at(-1).text, 'pear');
  assert.equal(page.spoken.length, 2);
  assert.equal(page.button.textContent, '连读');
});

test('speech errors, missing API and synchronous failures all exit the sequence', () => {
  const page = speechPage();
  page.click();
  page.fail();
  assert.equal(page.button.textContent, '连读');
  for (const options of [{ supported: false }, { throws: true }]) {
    const unavailable = speechPage(options);
    unavailable.click();
    assert.equal(unavailable.button.textContent, '连读');
    assert.ok(!unavailable.button.classList.contains('tts-active'));
  }
});

test('words playback settings apply to taps, silence and the next item in a sequence', () => {
  const page = speechPage({ controls: true });
  page.adjust('rate', 0.6);
  page.adjust('volume', 0);
  page.say('pear');
  assert.equal(page.spoken.at(-1).rate, 0.6);
  assert.equal(page.spoken.at(-1).volume, 0);
  page.click();
  page.adjust('rate', 1.25);
  page.adjust('volume', 0.35);
  page.finish();
  assert.equal(page.spoken.at(-1).text, 'apple');
  assert.equal(page.spoken.at(-1).rate, 1.25);
  assert.equal(page.spoken.at(-1).volume, 0.35);
  assert.equal(page.fields['tts-volume-value'].textContent, '35%');
  const restored = speechPage({ controls: true, stored: page.storage });
  restored.say('again');
  assert.equal(restored.spoken[0].rate, 1.25);
  assert.equal(restored.spoken[0].volume, 0.35);
});

test('voice changes stop a sequence and preview with the selected voice and playback settings', () => {
  const voices = [{ name: 'English US', lang: 'en-US', localService: true }, { name: 'English UK', lang: 'en-GB', localService: true }];
  const page = speechPage({ controls: true, voices });
  page.adjust('rate', 0.7);
  page.adjust('volume', 0.5);
  page.click();
  const canceled = page.spoken[0];
  page.chooseVoice('English UK');
  assert.equal(page.button.textContent, '连读');
  assert.equal(page.spoken.at(-1).voice.name, 'English UK');
  assert.equal(page.spoken.at(-1).rate, 0.7);
  assert.equal(page.spoken.at(-1).volume, 0.5);
  canceled.onend();
  assert.equal(page.spoken.length, 2);
  const restored = speechPage({ controls: true, stored: page.storage, voices });
  restored.say('hello');
  assert.equal(restored.spoken[0].voice.name, 'English UK');
});

test('invalid saved playback settings fall back safely and unsupported controls are disabled', () => {
  for (const saved of ['broken JSON', '{"rate":999,"volume":-1}', 'null']) {
    const page = speechPage({ controls: true, stored: { words_tts_pref_v1: saved } });
    page.say('hello');
    assert.equal(page.spoken[0].rate, 0.8);
    assert.equal(page.spoken[0].volume, 1);
  }
  const unsupported = speechPage({ controls: true, supported: false });
  assert.equal(unsupported.fields['tts-rate'].disabled, true);
  assert.equal(unsupported.fields['tts-preview'].disabled, true);
  assert.match(unsupported.fields['tts-status'].textContent, /不支持/);
});

test('textbook follow-along waits three seconds after speech ends, including the final item', () => {
  const page = speechPage({ sequenceControls: true });
  page.click();
  page.advance(30000);
  assert.equal(page.spoken.length, 1);
  assert.equal(page.timers.size, 0);
  page.finish();
  assert.match(page.fields['tts-sequence-status'].textContent, /轮到你跟读/);
  assert.ok(page.items[0].classList.contains('tts-playing'));
  page.advance(2999);
  assert.equal(page.spoken.length, 1);
  page.advance(1);
  assert.equal(page.spoken[1].text, 'apple');
  assert.ok(page.items[1].classList.contains('tts-playing'));
  page.finish();
  assert.ok(page.button.classList.contains('tts-active'));
  page.advance(3000);
  assert.equal(page.button.textContent, '连读');
  assert.match(page.fields['tts-sequence-status'].textContent, /完成/);
  assert.ok(page.items.every((item) => !item.classList.contains('tts-playing')));
});

test('textbook repeats each item before advancing and leaves a gap after every repetition', () => {
  const page = speechPage({ sequenceControls: true });
  page.adjust('interval', 2);
  page.adjust('repeat', 3);
  page.click();
  for (let i = 0; i < 6; i += 1) {
    assert.equal(page.spoken.length, i + 1);
    assert.equal(page.spoken[i].text, page.items[Math.floor(i / 3)].dataset.saySeq);
    assert.match(page.fields['tts-sequence-status'].textContent, new RegExp(`第 ${i % 3 + 1}／3 遍`));
    page.finish();
    page.advance(1999);
    assert.equal(page.spoken.length, i + 1);
    page.advance(1);
  }
  assert.equal(page.spoken.length, 6);
  assert.equal(page.button.textContent, '连读');
});

test('zero interval and five repetitions play exactly five times per item without timers', () => {
  const page = speechPage({ sequenceControls: true });
  page.adjust('interval', 0);
  page.adjust('repeat', 5);
  page.click();
  for (let i = 0; i < 10; i += 1) {
    assert.equal(page.spoken[i].text, page.items[Math.floor(i / 5)].dataset.saySeq);
    page.finish();
  }
  assert.equal(page.spoken.length, 10);
  assert.equal(page.timers.size, 0);
  assert.equal(page.button.textContent, '连读');
});

test('stopping or replacing a sequence during a gap invalidates even late timer and speech callbacks', () => {
  const voices = [{ name: 'English US', lang: 'en-US', localService: true }];
  for (const action of ['stop', 'tap', 'voice', 'pagehide', 'other']) {
    const page = speechPage({ controls: true, sequenceControls: true, voices });
    page.click();
    const oldSpeech = page.spoken[0];
    page.finish();
    const lateTimer = [...page.timers.values()][0].callback;
    if (action === 'stop') page.click();
    if (action === 'tap') page.say('pear');
    if (action === 'voice') page.chooseVoice('English US');
    if (action === 'pagehide') page.lifecycle.pagehide();
    if (action === 'other') page.clickOther();
    assert.equal(page.timers.size, 0);
    assert.equal(page.button.textContent, '连读');
    if (action !== 'other') page.click();
    const count = page.spoken.length;
    lateTimer();
    oldSpeech.onend();
    oldSpeech.onerror({ error: 'canceled' });
    page.advance(30000);
    assert.equal(page.spoken.length, count, action);
  }
});

test('textbook settings persist separately and changes apply on the next sequence', () => {
  const page = speechPage({ controls: true, sequenceControls: true });
  page.adjust('repeat', 2);
  page.click();
  page.adjust('interval', 0);
  page.adjust('repeat', 1);
  page.adjust('rate', 0.6);
  page.finish();
  page.advance(2999);
  assert.equal(page.spoken.length, 1);
  page.advance(1);
  assert.equal(page.spoken[1].text, page.spoken[0].text);
  page.click();
  page.click();
  page.finish();
  assert.equal(page.spoken.at(-1).text, 'apple');
  assert.equal(page.timers.size, 0);
  const restored = speechPage({ sequenceControls: true, stored: page.storage });
  assert.equal(restored.fields['tts-interval-value'].textContent, '0 秒');
  assert.equal(restored.fields['tts-repeat-value'].textContent, '1 次');
  assert.deepEqual(JSON.parse(page.storage.textbook_tts_sequence_pref_v1), { interval: 0, repeat: 1 });
  assert.deepEqual(JSON.parse(page.storage.words_tts_pref_v1), { rate: 0.6 });
  const otherPage = speechPage({ stored: { textbook_tts_sequence_pref_v1: '{"interval":10,"repeat":5}' } });
  otherPage.click();
  otherPage.finish();
  assert.equal(otherPage.spoken[1].text, 'apple');
});

test('invalid textbook settings fall back and unavailable speech disables follow-along controls', () => {
  for (const saved of ['broken JSON', 'null', '[]', 'true', '{"interval":-1,"repeat":0}', '{"interval":11,"repeat":6}', '{"interval":1.5,"repeat":2.5}']) {
    const page = speechPage({ sequenceControls: true, stored: { textbook_tts_sequence_pref_v1: saved } });
    assert.equal(Number(page.fields['tts-interval'].value), 3);
    assert.equal(Number(page.fields['tts-repeat'].value), 1);
  }
  for (const options of [{ supported: false }, { throws: true }]) {
    const page = speechPage({ sequenceControls: true, ...options });
    page.click();
    assert.equal(page.timers.size, 0);
    assert.equal(page.button.textContent, '连读');
    if (options.supported === false) {
      assert.equal(page.fields['tts-interval'].disabled, true);
      assert.equal(page.fields['tts-repeat'].disabled, true);
    }
  }
});

test('textbook pause and resume preserve the current utterance and make the paused position visible', () => {
  const page = speechPage({ sequenceControls: true, pausable: true });
  page.click();
  assert.equal(page.button.textContent, '⏸ 暂停连读');
  assert.equal(page.fields['tts-sequence-current'].textContent, page.spoken[0].text);
  page.click();
  assert.equal(page.synth.paused, true);
  assert.equal(page.button.textContent, '▶ 继续连读');
  assert.equal(page.fields['tts-sequence-player'].dataset.state, 'paused');
  assert.match(page.fields['tts-sequence-status'].textContent, /已暂停.*第 1／2 项/);
  assert.ok(page.items[0].classList.contains('tts-paused'));
  page.advance(30000);
  page.click();
  assert.equal(page.synth.paused, false);
  assert.equal(page.synth.resumeCount, 1);
  assert.equal(page.spoken.length, 1);
  assert.ok(!page.items[0].classList.contains('tts-paused'));
  page.finish();
  page.advance(3000);
  assert.equal(page.spoken[1].text, 'apple');
  page.finish();
  page.advance(3000);
  assert.equal(page.fields['tts-sequence-player'].dataset.state, 'complete');
  assert.equal(page.fields['tts-sequence-progress'].value, 2);
  assert.equal(page.button.textContent, '连读');
});

test('pausing during the follow-along gap freezes its remaining time and repeat count', () => {
  const page = speechPage({ sequenceControls: true, pausable: true });
  page.adjust('repeat', 2);
  page.click();
  page.finish();
  const lateTimer = [...page.timers.values()][0].callback;
  page.advance(1000);
  page.click();
  assert.equal(page.fields['tts-sequence-player'].dataset.state, 'paused');
  assert.equal(page.fields['tts-sequence-progress'].value, 1);
  assert.match(page.fields['tts-sequence-status'].textContent, /继续后接着计时/);
  assert.equal(page.timers.size, 0);
  page.advance(30000);
  lateTimer();
  page.click();
  lateTimer();
  page.advance(1999);
  assert.equal(page.spoken.length, 1);
  page.advance(1);
  assert.equal(page.spoken.length, 2);
  assert.equal(page.spoken[1].text, page.spoken[0].text);
  assert.match(page.fields['tts-sequence-status'].textContent, /第 2／2 遍/);
});

test('explicit stop exits reading focus, clears paused audio and pending gaps, and starts fresh next time', () => {
  for (const textbookKind of ['words', 'texts', 'scenario', 'idioms']) {
    for (const phase of ['speaking', 'following', 'paused-speaking', 'paused-gap']) {
      const page = speechPage({sequenceControls: true, pausable: true, textbookKind});
      page.adjust('repeat', 2);
      page.click();
      const old = page.spoken[0];
      assert.equal(page.fields['tts-sequence-stop'].disabled, false);
      if (phase === 'following' || phase === 'paused-gap') page.finish();
      const lateTimer = [...page.timers.values()][0]?.callback;
      if (phase.startsWith('paused')) page.click();
      page.stop();
      assert.equal(page.synth.paused, false, phase);
      assert.equal(page.fields['tts-sequence-player'].dataset.state, 'idle');
      assert.match(page.fields['tts-sequence-status'].textContent, /已停止连读/);
      assert.equal(page.fields['tts-sequence-stop'].disabled, true);
      assert.equal(page.fields['tts-sequence-restart'].disabled, true);
      assert.equal(page.fields['tts-sequence-current'].hidden, true);
      assert.equal(page.fields['tts-sequence-current'].textContent, '');
      assert.equal(page.fields['tts-sequence-progress'].hidden, true);
      assert.equal(page.fields['tts-sequence-progress'].value, 0);
      assert.equal(page.fields['tts-sequence-progress'].max, 1);
      assert.ok(page.items.every(item => !item.classList.contains('tts-playing') && !item.dataset.ttsFocusLabel && !item['aria-current']));
      assert.equal(page.timers.size, 0);
      old.onend(); lateTimer?.(); page.advance(30000);
      assert.equal(page.spoken.length, 1);
      page.click(); old.onend(); lateTimer?.();
      assert.equal(page.spoken.at(-1).text, page.items[0].dataset.saySeq);
      assert.match(page.fields['tts-sequence-status'].textContent, /第 1／2 遍/);
      assert.equal(page.fields['tts-sequence-stop'].disabled, false);
    }
  }
});

function readingSelectionPage(kind = 'words', supported = true) {
  const root = element(), play = element(), stop = element(), resets = [], events = {};
  const items = [element(), element()], controls = [element(), element()];
  items.forEach((item, i) => {
    item.matches = () => kind === 'texts';
    item.querySelectorAll = () => [controls[i]];
    item.querySelector = () => controls[i];
  });
  root.contains = item => items.includes(item);
  const fields = {
    [{words: 'english-cards', texts: 'english-dialogues', scenario: 'words-cards', idioms: 'idiom-cards'}[kind]]: root,
    [kind === 'scenario' ? 'words-play-btn' : 'tts-unit-play']: play, 'tts-sequence-stop': stop,
    'tts-sequence-restart': element(), 'tts-text-scope': element(), 'tts-voice': element(),
  };
  let range = false;
  const reset = message => {resets.push(message); play.classList.remove('tts-active'); stop.disabled = true; events['tts:reset']?.();};
  const context = vm.createContext({
    document: {getElementById: id => fields[id] || null, addEventListener: (event, callback) => {events[event] = callback;}},
    window: {
      ...(supported ? {speechSynthesis: {}} : {}), getSelection: () => ({type: range ? 'Range' : 'Caret'}),
      TTS: {resetSequence: reset},
    },
  });
  run('reading-focus.js', context);
  return {root, items, controls, fields, resets, play, stop, reset,
    select(index, {say = kind === 'texts', link = false, detail = null, ignored = false} = {}) {
      const button = {matches: () => !ignored};
      root.handlers.click({target: {closest(selector) {
        if (selector === '[data-say-seq]') return items[index];
        if (selector === 'a, input, textarea, select, summary') return link ? {} : null;
        if (selector === 'button') return button;
        if (selector === '[data-say]') return say ? {} : null;
        if (selector === '[data-reading-select]') return kind === 'texts' ? items[index] : controls[index];
        if (selector === '[data-reading-detail], .part, .phrase, .rel') return detail;
        return null;
      }}});
    },
    range(on) {range = on;},
    escape() {root.handlers.keydown({key: 'Escape', preventDefault() {}});},
  };
}

test('reset and explicit stop announce that page rendering must clear manual reading focus', () => {
  const page = speechPage({sequenceControls: true, pausable: true});
  page.click();
  const old = page.spoken[0];
  page.stop();
  page.reset();
  old.onend(); page.advance(30000);
  assert.deepEqual(page.signals, ['tts:reset', 'tts:reset']);
});

test('textbook and scenario selection replaces the previous item, preserves links and copying, and clears on stop', () => {
  for (const kind of ['words', 'texts', 'scenario', 'idioms']) {
    const page = readingSelectionPage(kind);
    page.play.classList.add('tts-active');
    page.select(0);
    assert.equal(page.resets.length, 1);
    assert.ok(!page.play.classList.contains('tts-active'));
    assert.ok(page.items[0].classList.contains('reading-selected'));
    assert.equal((kind === 'texts' ? page.items : page.controls)[0]['aria-pressed'], 'true');
    assert.equal(page.stop.disabled, false);
    page.select(1);
    assert.ok(!page.items[0].classList.contains('reading-selected'));
    assert.ok(page.items[1].classList.contains('reading-selected'));
    page.select(0, {link: true});
    page.range(true); page.select(0); page.range(false);
    assert.equal(page.resets.length, 2);
    page.stop.handlers.click();
    assert.ok(!page.root.classList.contains('has-reading-selection'));
    assert.ok(page.items.every(item => !item.classList.contains('reading-selected')));
    assert.equal((kind === 'texts' ? page.items : page.controls)[1]['aria-pressed'], 'false');
  }
});

test('a word can be deselected, detail focus clears on escape, and starting a sequence clears manual focus', () => {
  const page = readingSelectionPage();
  page.select(0); page.select(0);
  assert.ok(!page.root.classList.contains('has-reading-selection'));
  assert.match(page.resets.at(-1), /已取消选中/);
  const detail = element();
  detail.matches = () => false;
  page.select(0, {say: true, detail});
  assert.ok(detail.classList.contains('reading-selected-detail'));
  page.escape();
  assert.ok(!detail.classList.contains('reading-selected-detail'));
  assert.ok(!page.root.classList.contains('has-reading-selection'));
  page.select(1); page.play.handlers.click();
  assert.ok(!page.root.classList.contains('has-reading-selection'));
  const unavailable = readingSelectionPage('words', false);
  unavailable.select(0);
  assert.equal(unavailable.stop.disabled, true);
});

test('scenario redraw resets manual focus while mastery buttons keep their own state', () => {
  const page = readingSelectionPage('scenario');
  page.select(0);
  page.select(1, {ignored: true});
  assert.equal(page.resets.length, 1);
  assert.ok(page.items[0].classList.contains('reading-selected'));
  page.reset('重新绘制场景');
  assert.ok(!page.root.classList.contains('has-reading-selection'));
  assert.equal(page.controls[0]['aria-pressed'], 'false');
  assert.equal(page.stop.disabled, true);
  page.select(1);
  assert.ok(page.items[1].classList.contains('reading-selected'));
});

test('idiom headword and example can be selected independently within one card', () => {
  const page = readingSelectionPage('idioms'), example = element();
  example.matches = () => true;
  page.select(0);
  page.select(0, {detail: example});
  assert.equal(page.controls[0]['aria-pressed'], 'false');
  assert.equal(example['aria-pressed'], 'true');
  assert.ok(example.classList.contains('reading-selected-detail'));
  page.select(0);
  assert.ok(page.items[0].classList.contains('reading-selected'));
  assert.equal(example['aria-pressed'], 'false');
  assert.equal(page.controls[0]['aria-pressed'], 'true');
  page.select(0, {detail: example}); page.select(0, {detail: example});
  assert.ok(!page.root.classList.contains('has-reading-selection'));
  assert.equal(example['aria-pressed'], 'false');
});

test('reading focus follows textbook and scenario items through listening, following, pause and completion', () => {
  for (const textbookKind of ['words', 'texts', 'scenario', 'idioms']) {
    const page = speechPage({ sequenceControls: true, pausable: true, textbookKind });
    const container = page.fields[textbookKind === 'texts' ? 'english-dialogues' : textbookKind === 'scenario' ? 'words-cards' : textbookKind === 'idioms' ? 'idiom-cards' : 'english-cards'];
    page.click();
    assert.ok(container.classList.contains('tts-focus-mode'));
    assert.equal(page.items[0]['aria-current'], 'true');
    assert.match(page.items[0].dataset.ttsFocusLabel, textbookKind === 'texts' ? /听这一句/ : textbookKind === 'idioms' ? /听这个成语/ : /听这个单词/);
    page.finish();
    assert.equal(page.items[0].dataset.ttsPhase, 'following');
    assert.match(page.items[0].dataset.ttsFocusLabel, /轮到你读/);
    page.click();
    assert.equal(page.items[0].dataset.ttsPhase, 'paused');
    assert.match(page.items[0].dataset.ttsFocusLabel, /暂停/);
    page.click();
    page.advance(3000);
    assert.equal(page.items[0]['aria-current'], undefined);
    assert.equal(page.items[0].dataset.ttsFocusLabel, undefined);
    assert.equal(page.items[1]['aria-current'], 'true');
    page.finish();
    page.advance(3000);
    assert.ok(!container.classList.contains('tts-focus-mode'));
    assert.ok(page.items.every(item => !item.dataset.ttsFocusLabel && !item['aria-current']));
  }
});

test('idioms use Chinese speech and independent speed preferences, with repeat gaps before the next idiom', () => {
  const page = speechPage({
    controls: true, sequenceControls: true, pausable: true, textbookKind: 'idioms',
    voices: [{name: 'Samantha', lang: 'en-US'}, {name: 'Tingting', lang: 'zh-CN'}],
    stored: {words_tts_pref_v1: '{"rate":1.5}', chinese_tts_pref_v1: '{"rate":0.9}', textbook_tts_sequence_pref_v1: '{"interval":2,"repeat":2}'},
  });
  page.click();
  assert.equal(page.spoken[0].text, '兴高采烈');
  assert.equal(page.spoken[0].voice.name, 'Tingting');
  assert.equal(page.spoken[0].rate, 0.9);
  page.finish();
  page.advance(1999);
  assert.equal(page.spoken.length, 1);
  page.advance(1);
  assert.equal(page.spoken[1].text, '兴高采烈');
  page.finish();
  page.advance(2000);
  assert.equal(page.spoken[2].text, '喜出望外');
  page.fields['tts-rate'].value = '1';
  page.fields['tts-rate'].handlers.input();
  assert.equal(JSON.parse(page.storage.chinese_tts_pref_v1).rate, 1);
  assert.equal(JSON.parse(page.storage.words_tts_pref_v1).rate, 1.5);
});

test('switching idioms to scene examples discards the paused queue and highlights the matching sentence', () => {
  const page = speechPage({sequenceControls: true, pausable: true, textbookKind: 'idioms'});
  page.click();
  page.finish();
  const oldTimer = [...page.timers.values()][0].callback;
  page.click();
  page.chooseScope('#cards', 'sayExample');
  oldTimer();
  assert.equal(page.spoken.length, 1);
  assert.equal(page.fields['tts-sequence-player'].dataset.state, 'idle');
  assert.ok(!page.items[0].dataset.ttsContentKey);
  page.click();
  assert.equal(page.spoken[1].text, '同学们兴高采烈地去春游。');
  assert.equal(page.items[0].dataset.ttsContentKey, 'sayExample');
  assert.match(page.items[0].dataset.ttsFocusLabel, /听这句例句/);
  assert.ok(!page.fields['tts-sequence-current'].classList.contains('textbook-player-current-word'));
  page.finish();
  page.advance(3000);
  assert.equal(page.spoken[2].text, '听到这个好消息，他喜出望外。');
  page.restart();
  assert.equal(page.spoken[3].text, '同学们兴高采烈地去春游。');
});

test('changing scenario cards clears paused progress and prevents old callbacks from reading detached cards', () => {
  const page = speechPage({ sequenceControls: true, pausable: true, textbookKind: 'scenario' });
  page.click();
  const old = page.spoken[0];
  page.finish();
  const lateTimer = [...page.timers.values()][0].callback;
  page.click();
  page.reset();
  assert.equal(page.button.textContent, '连读');
  assert.equal(page.fields['tts-sequence-restart'].disabled, true);
  assert.equal(page.fields['tts-sequence-current'].hidden, true);
  assert.equal(page.fields['tts-sequence-current'].textContent, '');
  assert.equal(page.fields['tts-sequence-progress'].hidden, true);
  assert.ok(!page.fields['words-cards'].classList.contains('tts-focus-mode'));
  page.restart();
  assert.equal(page.spoken.length, 1);
  page.items[0].dataset.saySeq = 'banana';
  page.click();
  old.onend();
  lateTimer();
  page.advance(30000);
  assert.equal(page.spoken.length, 2);
  assert.equal(page.spoken[1].text, 'banana');
  assert.equal(page.fields['tts-sequence-progress'].value, 0);
  const unavailable = speechPage({ sequenceControls: true, pausable: true, textbookKind: 'scenario', supported: false });
  unavailable.reset();
  assert.equal(unavailable.fields['tts-sequence-player'].dataset.state, 'error');
});

test('a speech-end event arriving just after pause cannot advance the paused sequence', () => {
  const page = speechPage({ sequenceControls: true, pausable: true });
  page.click();
  page.click();
  page.finish();
  assert.equal(page.timers.size, 0);
  assert.equal(page.fields['tts-sequence-player'].dataset.state, 'paused');
  page.advance(30000);
  assert.equal(page.spoken.length, 1);
  page.click();
  page.advance(2999);
  assert.equal(page.spoken.length, 1);
  page.advance(1);
  assert.equal(page.spoken[1].text, 'apple');
});

test('quick resume and restart release a pause request even before the browser paused flag changes', () => {
  for (const action of ['resume', 'restart', 'scope']) {
    const page = speechPage({ sequenceControls: true, pausable: true });
    page.synth.pause = function () { this.pauseCount += 1; };
    page.click();
    page.click();
    assert.equal(page.synth.paused, false);
    if (action === 'resume') page.click();
    if (action === 'restart') page.restart();
    if (action === 'scope') page.chooseScope('#last');
    assert.equal(page.synth.resumeCount, 1, action);
  }
});

test('restart explicitly returns to the first item from speaking, following, paused and completed states', () => {
  for (const state of ['speaking', 'following', 'paused', 'complete']) {
    const page = speechPage({ sequenceControls: true, pausable: true });
    if (state === 'complete') page.adjust('interval', 0);
    page.click();
    const old = page.spoken[0];
    if (state === 'following') page.finish();
    if (state === 'paused') page.click();
    if (state === 'complete') { page.finish(); page.finish(); }
    const count = page.spoken.length;
    page.adjust('repeat', 3);
    page.restart();
    assert.equal(page.synth.paused, false, state);
    assert.equal(page.spoken.length, count + 1, state);
    assert.equal(page.spoken.at(-1).text, page.items[0].dataset.saySeq, state);
    assert.equal(page.fields['tts-sequence-progress'].value, 0, state);
    assert.equal(page.fields['tts-sequence-player'].dataset.state, 'playing', state);
    assert.match(page.fields['tts-sequence-status'].textContent, /第 1／3 遍/);
    old.onend();
    old.onerror({ error: 'canceled' });
    page.advance(30000);
    assert.equal(page.spoken.length, count + 1, state);
    assert.equal(page.timers.size, 0, state);
  }
});

test('changing passage scope discards the old paused sequence and starts the selected passage only', () => {
  const page = speechPage({ sequenceControls: true, pausable: true });
  page.click();
  const old = page.spoken[0];
  page.click();
  page.chooseScope('#last');
  assert.equal(page.synth.paused, false);
  assert.equal(page.button.textContent, '连读');
  assert.equal(page.fields['tts-sequence-player'].dataset.state, 'idle');
  assert.equal(page.fields['tts-sequence-restart'].disabled, true);
  assert.equal(page.fields['tts-sequence-current'].hidden, true);
  old.onend();
  page.click();
  assert.equal(page.spoken.at(-1).text, 'apple');
  assert.match(page.fields['tts-sequence-status'].textContent, /第 1／1 项/);
});

test('taps, voice changes, page exit and speech failures all release a paused browser engine', () => {
  const voices = [{ name: 'English US', lang: 'en-US', localService: true }];
  for (const action of ['tap', 'voice', 'pagehide', 'error']) {
    const page = speechPage({ controls: true, sequenceControls: true, pausable: true, voices });
    page.click();
    const old = page.spoken[0];
    page.click();
    if (action === 'tap') page.say('pear');
    if (action === 'voice') page.chooseVoice('English US');
    if (action === 'pagehide') page.lifecycle.pagehide();
    if (action === 'error') page.fail();
    assert.equal(page.synth.paused, false, action);
    assert.ok(!page.items[0].classList.contains('tts-paused'), action);
    old.onend();
    page.advance(30000);
    assert.equal(page.timers.size, 0, action);
    assert.equal(page.button.textContent, '连读', action);
  }
  const unsupported = speechPage({ sequenceControls: true, pausable: true, supported: false });
  assert.equal(unsupported.button.disabled, true);
  assert.equal(unsupported.fields['tts-sequence-restart'].disabled, true);
  assert.equal(unsupported.fields['tts-sequence-stop'].disabled, true);
});

function wordsPage(fetch, extraWords = [], search = '') {
  const elements = {};
  const get = (id) => elements[id] || (elements[id] = element());
  const card = element(), focused = [], resets = [];
  get('words-cards').querySelector = (selector) => {
    focused.push(selector);
    return card;
  };
  get('words-state').textContent = JSON.stringify({
    scenarios: [
      { id: '1', name: 'Fruit', zh: '水果', color: '#fff', total: 1, learned: 0 },
      { id: '2', name: 'Names', zh: '名字', color: '#fff', total: extraWords.length, learned: 0 },
    ],
    words: [{ id: '1', target_id: 'target-a', revision: 0, chinese_version_id: null, presentation_revision: 0, en: 'apple', zh: '苹果', ipa: '', scenario: '1', learned: false }, ...extraWords],
  });
  const context = vm.createContext({
    document: { getElementById: get, cookie: '' },
    window: { speechSynthesis: {}, TTS: { resetSequence: message => resets.push(message), speak() {} } }, fetch,
    URLSearchParams, location: { search }, requestAnimationFrame: (callback) => callback(),
  });
  run('words/words.js', context);
  return {
    get, card, focused, resets,
    selectUnit(unit) {
      get('words-chips').handlers.click({preventDefault() {}, target: {closest: () => ({dataset: {unit}})}});
    },
    search(value) { get('words-search').value = value; get('words-search').handlers.input(); },
    async mark() {
      const button = { dataset: { learn: '1' } };
      get('words-cards').handlers.click({ preventDefault() {}, target: { closest: () => button } });
      assert.equal(button.disabled, true);
      assert.match(get('words-feedback').textContent, /正在保存/);
      await new Promise(setImmediate);
      assert.equal(button.disabled, false);
    },
  };
}

test('scenario cards expose the sequence text and announce a successful save', async () => {
  const page = wordsPage(async () => ({ ok: true, json: async () => ({ target_id: 'target-a', revision: 1, learned: true }) }));
  assert.match(page.get('words-cards').innerHTML, /data-say-seq="apple"/);
  await page.mark();
  assert.match(page.get('words-feedback').textContent, /apple：已标记掌握/);
  assert.match(page.get('words-cards').innerHTML, /aria-pressed="true"/);
});

test('learning links focus the exact scenario target when two cards share a spelling', () => {
  const other = {id: '2', target_id: 'target-b', en: 'apple', zh: '苹果公司', ipa: '', scenario: '2'};
  const page = wordsPage(undefined, [other], '?target=target-b');
  assert.match(page.get('words-cards').innerHTML, /苹果公司/);
  assert.deepEqual(page.focused, ['[data-word="2"]']);
  assert.equal(page.card.classList.contains('learned-flash'), true);

  const legacy = wordsPage(undefined, [other], '?word=APPLE');
  assert.deepEqual(legacy.focused, ['[data-word="1"]']);
  const missing = wordsPage(undefined, [other], '?target=missing&word=apple');
  assert.deepEqual(missing.focused, []);
  assert.match(missing.get('words-feedback').textContent, /词卡找不到/);
});

test('scenario selection and search reset the reading range and disable playback for an empty result', () => {
  const page = wordsPage(undefined, [{id:'2',target_id:'target-b',en:'pear',zh:'梨',ipa:'',scenario:'2'}]);
  assert.equal(page.get('words-play-btn').disabled, false);
  assert.match(page.get('words-player-scope').textContent, /水果 · 1 词/);
  page.selectUnit('2');
  assert.match(page.get('words-cards').innerHTML, /data-say-seq="pear"/);
  assert.match(page.get('words-player-scope').textContent, /名字 · 1 词/);
  page.search('apple');
  assert.match(page.get('words-player-scope').textContent, /搜索结果 · 1 词/);
  assert.equal(page.get('words-play-btn').disabled, false);
  page.search('not-a-word');
  assert.equal(page.get('words-play-btn').disabled, true);
  assert.match(page.resets.at(-1), /没有可连读的单词/);
  page.search('');
  assert.match(page.get('words-player-scope').textContent, /名字 · 1 词/);
  assert.equal(page.resets.length, 5);
});

test('HTTP, malformed response and network failures preserve state and show feedback', async () => {
  for (const [fetch, message] of [
    [async () => ({ ok: false, status: 403, json: async () => ({}) }), /安全校验/],
    [async () => ({ ok: false, status: 503, json: async () => ({ error: '数据库暂忙' }) }), /数据库暂忙/],
    [async () => ({ ok: true, status: 200, json: async () => null }), /保存未成功/],
    [async () => { throw new Error('offline'); }, /尚未确认是否保存/],
  ]) {
    const page = wordsPage(fetch);
    await page.mark();
    assert.match(page.get('words-feedback').textContent, message);
    assert.ok(page.get('words-feedback').classList.contains('error'));
    assert.match(page.get('words-cards').innerHTML, /aria-pressed="false"/);
  }
});

test('one save updates every placement of the target and sends its revision', async () => {
  let sent;
  const page = wordsPage(async (url, options) => {
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ target_id: 'target-a', revision: 1, learned: true }) };
  }, [{ id: '2', target_id: 'target-a', revision: 0, chinese_version_id: null, presentation_revision: 0, en: 'apple', scenario: '1', learned: false }]);
  await page.mark();
  assert.deepEqual(sent, { schema_version: 3, chinese_version_id: null, presentation_revision: 0, target_id: 'target-a', revision: 0, learned: true });
  assert.equal((page.get('words-cards').innerHTML.match(/aria-pressed="true"/g) || []).length, 2);
});

test('stale tab conflict keeps known state and requests refresh', async () => {
  const page = wordsPage(async () => ({ ok: false, status: 409, json: async () => ({ error: '记录已在其他页面更新，请刷新后再保存。' }) }));
  await page.mark();
  assert.match(page.get('words-feedback').textContent, /其他页面更新/);
  assert.match(page.get('words-cards').innerHTML, /aria-pressed="false"/);
});

test('chain hints are invalidated after a move, restart, conflict refresh or round end', async () => {
  const start = {
    id: 'round', revision: 0, score: 0, hints: 0, status: 'playing', next_char: '大',
    chain: [{ word: '发扬光大', last_char: '大', by: 'start' }], pool_count: 10, history: [],
  };
  const moved = {
    ...start, revision: 2, score: 5, hints: 1, next_char: '意',
    chain: [...start.chain, { word: '大功告成', by: 'player' }, { word: '成心故意', by: 'partner' }],
  };
  const ok = (data) => ({ ok: true, status: 200, json: async () => data });
  for (const action of ['move', 'restart', 'conflict', 'end']) {
    const elements = {}, get = (id) => elements[id] || (elements[id] = element());
    get('chain-state').textContent = JSON.stringify(start);
    const replies = [ok({ ...start, revision: 1, hints: 1, hint: [{ word: '大功告成' }] })];
    if (action === 'conflict') replies.push({ ok: false, status: 409, json: async () => ({}) });
    replies.push(ok(action === 'end' ? { ...moved, status: 'ended' }
      : action === 'restart' ? { ...start, id: 'new-round' } : moved));
    const context = vm.createContext({
      document: { getElementById: get, createElement: element, querySelectorAll: () => [], cookie: '' },
      window: {}, fetch: async () => replies.shift(),
    });
    run('chain/chain.js', context);
    get('chain-hint-btn').handlers.click();
    await new Promise(setImmediate);
    assert.equal(get('chain-hints').hidden, false);
    assert.match(get('chain-hint-options').innerHTML, /大功告成/);
    if (action === 'restart') get('chain-restart-btn').handlers.click();
    else {
      get('chain-word').value = '大功告成';
      get('chain-form').handlers.submit({ preventDefault() {} });
    }
    await new Promise(setImmediate);
    assert.equal(get('chain-hints').hidden, true, action);
    assert.equal(get('chain-hint-options').innerHTML, '', action);
    assert.equal(get('chain-hint-btn')['aria-expanded'], 'false', action);
  }
});

function writingPage({ scope, storage, drafts = [], save, guestScope = '', search = '', detail,
                       confirm = () => true }) {
  const elements = {};
  const get = (id) => elements[id] || (elements[id] = element());
  get('notebook').dataset.autosaveScope = scope;
  const calls = [];
  const context = vm.createContext({
    document: {getElementById: get, querySelectorAll: () => [], addEventListener() {}, cookie: ''},
    window: {addEventListener() {}},
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    confirm, URLSearchParams, location: {search},
    fetch: async (url, request) => {
      calls.push({url, request});
      if (request.method) return save(url, request);
      if (url !== '/writing/api/drafts/') return detail(url, request);
      return {ok: true, json: async () => ({drafts, autosave_scope: scope || guestScope})};
    },
  });
  run('writing/writing.js', context);
  return {
    get, calls,
    type(content) {
      get('wr-content').value = content;
      get('wr-content').handlers.input();
    },
    open(id) {
      const button = {dataset: {open: '1'}, closest: () => ({dataset: {id}})};
      return get('wr-draft-list').handlers.click({target: {closest: () => button}});
    },
    save: () => get('wr-save').handlers.click(),
  };
}

test('writing autosave isolates two accounts and a guest on the same browser', async () => {
  const storage = new Map([['writing_autosave_v1', JSON.stringify({content: '旧的无归属暂存'})]]);
  const first = writingPage({scope: 'first', storage});
  assert.equal(first.get('wr-content').value, '');
  first.type('第一个账号的作文');
  const second = writingPage({scope: 'second', storage});
  assert.equal(second.get('wr-content').value, '');
  second.type('第二个账号的作文');
  const guest = writingPage({scope: '', guestScope: 'guest-scope', storage});
  await new Promise(setImmediate);
  assert.equal(guest.get('wr-content').value, '');
  guest.type('游客的作文');
  assert.equal(writingPage({scope: 'first', storage}).get('wr-content').value, '第一个账号的作文');
  assert.equal(writingPage({scope: 'guest-scope', storage}).get('wr-content').value, '游客的作文');
  assert.equal(JSON.parse(storage.get('writing_autosave_v1')).content, '旧的无归属暂存');
});

const savedDraft = {
  id: '9533864e-234a-4d89-a6db-fc9544d63829', revision: 3,
  title: '作文标题', content: '原稿正文', topic_title: '', updated_at: '',
};

test('a writing link can open an owned draft outside the latest list', async () => {
  const storage = new Map();
  const page = writingPage({
    scope: 'student', storage, search: `?draft=${savedDraft.id}`,
    detail: async () => ({ok: true, json: async () => savedDraft}),
  });
  await new Promise(setImmediate);
  assert.equal(page.calls[1].url, `/writing/api/drafts/${savedDraft.id}/`);
  assert.equal(page.calls[1].request.headers['X-Writing-Scope'], 'student');
  assert.equal(page.get('wr-content').value, savedDraft.content);
  page.type('从学习足迹接着写');
  const draft = JSON.parse(storage.get('writing_autosave_v2:student'));
  assert.equal(draft.draftId, savedDraft.id);
  assert.equal(draft.revision, savedDraft.revision);
});

test('a writing link preserves edits for the same draft and asks before replacing another', async () => {
  const storage = new Map();
  const first = writingPage({scope: 'student', storage, drafts: [savedDraft]});
  await new Promise(setImmediate);
  await first.open(savedDraft.id);
  first.type('改了但还没保存');

  const same = writingPage({scope: 'student', storage, drafts: [savedDraft], search: `?draft=${savedDraft.id}`});
  await new Promise(setImmediate);
  assert.equal(same.get('wr-content').value, '改了但还没保存');
  assert.equal(same.calls.length, 1);

  const other = {...savedDraft, id: '9533864e-234a-4d89-a6db-fc9544d63830'};
  let asked = false;
  const page = writingPage({
    scope: 'student', storage, drafts: [other], search: `?draft=${other.id}`,
    confirm: () => { asked = true; return false; },
  });
  await new Promise(setImmediate);
  assert.equal(asked, true);
  assert.equal(page.get('wr-content').value, '改了但还没保存');
});

test('refreshed writing edits use the original draft and revision', async () => {
  const storage = new Map();
  const first = writingPage({scope: 'student', storage, drafts: [savedDraft]});
  await new Promise(setImmediate);
  await first.open(savedDraft.id);
  first.type('修改后的正文');
  const reloaded = writingPage({
    scope: 'student', storage, drafts: [savedDraft],
    save: async () => ({ok: true, json: async () => ({...savedDraft, content: '修改后的正文', revision: 4})}),
  });
  assert.equal(reloaded.get('wr-content').value, '修改后的正文');
  await reloaded.save();
  const {url, request} = reloaded.calls[1];
  assert.equal(url, `/writing/api/drafts/${savedDraft.id}/`);
  assert.equal(request.method, 'PATCH');
  assert.equal(request.headers['X-Writing-Scope'], 'student');
  assert.equal(JSON.parse(request.body).revision, 3);
  assert.equal(storage.size, 0);
});

test('writing typed during a save keeps the new revision in the autosave', async () => {
  const storage = new Map();
  let finishSave;
  const first = writingPage({
    scope: 'student', storage,
    save: () => new Promise((resolve) => { finishSave = resolve; }),
  });
  first.type('第一版');
  const saving = first.save();
  first.type('还在写的新内容');
  finishSave({ok: true, json: async () => ({...savedDraft, content: '第一版'})});
  await saving;
  const snapshot = JSON.parse(storage.get('writing_autosave_v2:student'));
  assert.equal(snapshot.draftId, savedDraft.id);
  assert.equal(snapshot.revision, 3);
  assert.equal(snapshot.content, '还在写的新内容');
});

test('a stale writing tab hides the editor after an account change and preserves its autosave', async () => {
  const storage = new Map();
  const first = writingPage({
    scope: 'first', storage,
    save: async () => ({ok: false, status: 409, json: async () => ({
      code: 'owner_changed', error: '登录状态已变化，请刷新作文坊。',
    })}),
  });
  first.type('原账号的暂存');
  await first.save();
  assert.equal(first.get('wr-content').value, '');
  assert.equal(first.get('wr-save').disabled, true);
  assert.match(first.get('wr-feedback').textContent, /请刷新/);
  assert.equal(JSON.parse(storage.get('writing_autosave_v2:first')).content, '原账号的暂存');
});

test('idiom quiz keeps the answer on network failure and displays the server score on retry', async () => {
  const board = element();
  const fields = {};
  const get = (selector) => fields[selector] || (fields[selector] = element());
  const slot = element(), key = element(), calls = [];
  key.dataset.char = '添';
  board.dataset = {token: 'issued-token', reportUrl: '/idioms/quiz/api/report/'};
  board.querySelector = get;
  board.querySelectorAll = (selector) => selector === '[data-quiz-slot]' ? [slot] : [key];
  get('[data-quiz-result]').hidden = true;
  get('[data-quiz-asked]').textContent = '2';
  run('idioms/quiz.js', vm.createContext({
    document: {querySelector: () => board, cookie: 'primary_csrftoken=csrf'},
    window: {},
    fetch: async (url, request) => {
      calls.push(JSON.parse(request.body));
      if (calls.length === 1) throw Error('offline');
      return {ok: true, json: async () => ({
        correct: true, first_correct: true, marks: [true],
        score: {asked: 3, correct: 2, streak: 2},
        card: {headword: '画蛇添足', definition: '做了多余的事。', url: '/idioms/entries/example/'},
      })};
    },
  }));
  key.handlers.click();
  await get('[data-quiz-check]').handlers.click();
  assert.equal(slot.textContent, '添');
  assert.equal(get('[data-quiz-asked]').textContent, '2');
  assert.equal(get('[data-quiz-result]').hidden, true);
  await get('[data-quiz-check]').handlers.click();
  assert.deepEqual(calls, [
    {action: 'answer', token: 'issued-token', answer: '添'},
    {action: 'answer', token: 'issued-token', answer: '添'},
  ]);
  assert.equal(get('[data-quiz-asked]').textContent, 3);
  assert.equal(get('[data-quiz-result]').hidden, false);
  assert.equal(get('[data-quiz-headword]').textContent, '画蛇添足');
});

test('study topic links resolve to real events, places, lessons and chapters', () => {
  const context = vm.createContext({
    window: {},
    document: {querySelector: () => ({dataset: {
      historyLesson: '/history/',
      geographyLesson: '/geography/study/',
      calendar: '/history/timeline/dynasties.html',
      chinaMap: '/geography/atlas/china.html',
      historyEvent: '/history/timeline/event.html',
      marsLife: '/mysteries/mars-life/', darkMatter: '/mysteries/dark-matter/',
      stars: '/astronomy/', poetry: '/poetry/', idiomStories: '/idioms/stories/',
      elements: '/science/elements/', bodyStation: '/science/body/',
      solarTerms: '/geography/solar-terms/',
    }})},
  });
  [
    'history/content.js', 'history/knowledge-foundations.js', 'history/knowledge-dynasties.js',
    'history-timeline/content.js', 'history-timeline/timeline-data.js',
    'geo/content.js', 'geo/knowledge-core.js', 'geo/knowledge-regions.js',
    'geo-map/content.js', 'geo-map/map-data.js', 'geo-map/world-data.js', 'geo-map/atlas-data.js', 'geo-map/atlas.js',
    'astro/astro-data.js', 'lit/lit-data.js', 'sci/sci-data.js',
    'connections-data.js', 'connections.js',
  ].forEach(file => run('study_topics/' + file, context));
  const data = context.window;
  const {groups, backlinks, lessonEdits} = data.STUDY_TOPIC_CONNECTIONS;
  const connections = data.StudyTopicConnections;
  const history = [...data.HISTORY_LESSONS_FOUNDATIONS, ...data.HISTORY_LESSONS_DYNASTIES];
  const geography = [...data.GEO_LESSONS_CORE, ...data.GEO_LESSONS_REGIONS];
  const coursePoints = vm.runInContext('[ASTRO, LIT, SCI].flatMap(course => course.units.flatMap(unit => unit.points))', context);
  const all = new Map([...history, ...geography, ...coursePoints].map(lesson => [lesson.id, lesson]));
  assert.equal(all.size, history.length + geography.length + coursePoints.length);
  const lessonAnchors = lessons => lessons.map(lesson => '#lesson-' + lesson.id);
  const referenceTargets = {
    calendar: ['#cal-title', '#dyn-title'],
    chinaMap: data.GMAtlas.places.map(place => `?place=${place.id}#map`),
    historyLesson: lessonAnchors(history), geographyLesson: lessonAnchors(geography),
    historyEvent: data.TIMELINE_EVENTS.map(event => '?event=' + event.id),
    marsLife: [''], darkMatter: [''], stars: [''], poetry: [''], idiomStories: [''], elements: [''], bodyStation: [''], solarTerms: [''],
  };
  for (const [key, source, targets] of [
    ['events', data.TIMELINE_EVENTS, history.map(lesson => '#lesson-' + lesson.id)],
    ['eras', data.TIMELINE_ERAS, [
      ...data.HISTORY_CHAPTERS.map(chapter => '#' + chapter.id),
      ...history.map(lesson => '#lesson-' + lesson.id),
    ]],
    ['places', data.GMAtlas.places, geography.map(lesson => '#lesson-' + lesson.id)],
  ]) {
    const sourceIds = new Set(source.map(item => item.id));
    const allowed = new Set(targets);
    for (const [id, links] of Object.entries(groups[key].links)) {
      assert.ok(sourceIds.has(id), `${key} has an unknown source ID: ${id}`);
      assert.ok(links.length, id);
      const anchors = new Set();
      for (const [anchor, label] of links) {
        assert.ok(allowed.has(anchor), `${key} points to an unknown anchor: ${anchor}`);
        assert.ok(!anchors.has(anchor), `${key} repeats ${anchor} for ${id}`);
        anchors.add(anchor);
        assert.ok(label.trim(), id);
      }
    }
  }
  for (const [id, links] of Object.entries(backlinks)) {
    assert.ok(all.has(id), id);
    for (const [route, suffix, label] of links) {
      assert.ok(label.trim(), id);
      assert.ok(referenceTargets[route]?.includes(suffix), `${id} links to ${route}${suffix}`);
    }
  }
  for (const id of Object.keys(lessonEdits)) {
    const original = all.get(id);
    assert.ok(original, id);
    assert.ok(backlinks[id]?.length, `${id} is missing its source link`);
    const edited = connections.lesson(original);
    assert.equal(edited.id, original.id);
    assert.equal(edited.quiz, original.quiz);
    assert.ok((edited.essentials || edited.items).length, id);
    if (Object.hasOwn(edited, 'showPhoto')) {
      assert.match(id, /^au\d+-\d+$/);
      assert.equal(typeof edited.showPhoto, 'boolean');
    }
  }
  assert.match(connections.related('events', 'tc13'), /href="\/history\/#lesson-hu5-1"/);
  assert.match(connections.related('places', 'f20'), /href="\/geography\/study\/#lesson-gu5-2"/);
  assert.match(connections.references('hu1-2'), /dynasties\.html#cal-title/);
  assert.match(connections.references('gu5-2'), /china\.html\?place=f20#map/);
  assert.match(connections.references('au8-3', '接着学'), /href="\/mysteries\/mars-life\/"/);
  assert.match(connections.references('lu6-3', '接着学'), /href="\/history\/#lesson-hu7-2"/);
  for (const id of ['gu4-1', 'gu4-3', 'lu6-5']) {
    assert.match(connections.references(id), /href="\/geography\/solar-terms\/"/);
  }
  assert.match(connections.references('su6-5', '接着学'), /href="\/science\/body\/"/);
  assert.match(connections.references('su7-3', '接着学'), /href="\/geography\/study\/#lesson-gu5-1"/);
  assert.equal(connections.related('events', 'unknown'), '');
});

function originsAtlasPage(query = '', motion = 'full') {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'humanorigins/data/stations.json'), 'utf8'));
  const atlas = data.stations.find(station => station.slug === 'migration').atlas;
  const chinaSites = data.stations.find(station => station.slug === 'china-sites').clues;
  atlas.map_markers.forEach(marker => {
    if (marker.site) marker.site_anchor = chinaSites.find(site => site.id === marker.site).anchor;
  });
  const nodes = new Map();
  const make = () => {
    const node = element(); node.children = [];
    node.append = child => node.children.push(child);
    node.replaceChildren = () => { node.children = []; };
    node.focus = () => { node.focused = true; };
    node.scrollIntoView = options => { node.scrolled = options; };
    return node;
  };
  const get = id => { if (!nodes.has(id)) nodes.set(id, make()); return nodes.get(id); };
  const steps = atlas.steps.map(() => element());
  const markerLabels = atlas.map_markers.map(marker => {
    const label = Object.assign(make(), {dataset: {mapMarker: marker.id}, stateLabel: make()});
    label.querySelector = () => label.stateLabel;
    return label;
  });
  const links = atlas.regions.map(region => Object.assign(element(), {dataset: {regionLink: region.id}}));
  const records = atlas.regions.map(region => {
    const record = Object.assign(element(), {dataset: {regionRecord: region.id}, status: element()});
    record.querySelector = () => record.status; return record;
  });
  const groups = atlas.groups.map(group => {
    const node = Object.assign(make(), {dataset: {population: group.id}, eraLabel: make()});
    node.querySelector = () => node.eraLabel;
    return node;
  });
  const controls = element(); controls.hidden = true;
  get('migration-atlas').dataset.sitesUrl = '/human-origins/china-sites/';
  get('migration-atlas').dataset.familyUrl = '/human-origins/family-tree/';
  get('migration-atlas').querySelectorAll = selector => ({'[data-atlas-step]': steps, '[data-region-link]': links, '[data-region-record]': records, '[data-map-marker]': markerLabels})[selector];
  get('migration-atlas').querySelector = selector => selector === '.origins-atlas-controls' ? controls : get(selector);
  get('origins-atlas-data').textContent = JSON.stringify(atlas);
  const routes = get('atlas-routes'); routes.children = [];
  routes.replaceChildren = () => { routes.children = []; };
  routes.append = child => routes.children.push(child);
  const location = new URL('http://study.test/human-origins/migration/' + query), events = {}, timers = new Map();
  let timerId = 0, now = 0, offscreen;
  const effects = {motion, watch: (_, pause) => { offscreen = pause; }};
  const doc = {hidden: false, getElementById: get, querySelectorAll: () => groups,
    createElementNS: make, createElement: make, addEventListener: (type, handler) => { events[type] = handler; }};
  run('humanorigins/migration.js', vm.createContext({URL, Date: {now: () => now},
    document: doc,
    setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, {callback, delay}); return id; },
    clearTimeout: id => timers.delete(id),
    localStorage: {getItem: () => null, setItem() {}},
    window: {location, StudyEffects: effects, addEventListener: (type, handler) => { events[type] = handler; },
      history: {replaceState: (_, __, url) => { location.href = url.href; }}},
  }));
  const click = node => node.handlers.click({preventDefault() {}});
  const fireNext = () => { const [id, timer] = timers.entries().next().value; timers.delete(id); now += timer.delay; timer.callback(); };
  const indexOf = year => atlas.steps.findIndex(step => step.years_ago === year);
  return {atlas, get, steps, links, records, groups, controls, location, routes, click, events, timers, fireNext, indexOf, doc, markerLabels, effects, offscreen: () => offscreen(), advance: ms => { now += ms; }};
}

test('origins atlas restores a dated region link and distinguishes later evidence', () => {
  const page = originsAtlasPage('?year=45000&region=europe#migration-atlas');
  assert.equal(page.get('atlas-year').value, String(page.indexOf(45000)));
  assert.equal(page.controls.hidden, false);
  assert.deepEqual(page.records.filter(record => !record.hidden).map(record => record.dataset.regionRecord), ['europe']);
  assert.equal(page.links.find(link => link.dataset.regionLink === 'east-asia').dataset.reached, 'false');
  assert.equal(page.groups.find(group => group.dataset.population === 'neanderthals').dataset.related, 'true');
  page.click(page.links.find(link => link.dataset.regionLink === 'east-asia'));
  assert.match(page.records.find(record => !record.hidden).status.textContent, /更晚/);
  assert.equal(page.location.searchParams.get('region'), 'east-asia');
  page.click(page.steps[page.indexOf(40000)]);
  assert.equal(page.links.find(link => link.dataset.regionLink === 'east-asia').dataset.reached, 'true');
});

test('origins atlas bounds era controls and splits the Pacific crossing at the map edge', () => {
  const page = originsAtlasPage('?year=invalid&region=missing#ignored');
  assert.equal(page.get('atlas-next').disabled, true);
  assert.equal(page.routes.children.length, 8);
  for (const child of page.routes.children) {
    const xs = [...child.d.matchAll(/[ML]([\d.]+) /g)].map(match => Number(match[1]));
    for (let i = 1; i < xs.length; i++) assert.ok(Math.abs(xs[i] - xs[i - 1]) <= 360);
  }
  page.click(page.steps[0]);
  assert.equal(page.get('atlas-previous').disabled, true);
  assert.equal(page.routes.children.length, 0);
  assert.equal(page.links.filter(link => link.dataset.reached === 'true').length, 1);
  page.get('atlas-year').value = String(page.indexOf(23000)); page.get('atlas-year').handlers.input();
  assert.equal(page.location.searchParams.get('year'), '23000');
  assert.equal(page.links.find(link => link.dataset.regionLink === 'north-america').dataset.reached, 'true');
  assert.equal(page.links.find(link => link.dataset.regionLink === 'south-america').dataset.reached, 'false');
});

test('origins atlas follows region anchors and browser navigation', () => {
  const page = originsAtlasPage('?region=europe#region-east-asia');
  assert.equal(page.records.find(record => !record.hidden).dataset.regionRecord, 'east-asia');
  page.location.hash = 'region-europe'; page.events.hashchange();
  assert.equal(page.records.find(record => !record.hidden).dataset.regionRecord, 'europe');
  page.location.href = 'http://study.test/human-origins/migration/?year=300000&region=africa'; page.events.popstate();
  assert.equal(page.get('atlas-year').value, '0');
  assert.equal(page.records.find(record => !record.hidden).dataset.regionRecord, 'africa');
});

test('origins autoplay tours from Africa, shows record changes and stops at today', () => {
  const page = originsAtlasPage();
  page.click(page.get('atlas-play'));
  assert.equal(page.get('atlas-year').value, '0');
  assert.equal(page.location.searchParams.get('region'), 'africa');
  assert.equal(page.timers.size, 1);
  assert.equal(page.get('atlas-play')['aria-pressed'], 'true');
  const state = id => page.groups.find(group => group.dataset.population === id).dataset.eraState;
  assert.equal(state('denisovans'), 'before');
  while (page.timers.size) {
    page.fireNext();
    const year = Number(page.location.searchParams.get('year'));
    if (year === 236000) assert.equal(state('naledi'), 'last');
    if (year === 200000) assert.equal(state('denisovans'), 'known');
    if (year === 110000) assert.equal(state('erectus'), 'last');
    if (year === 40000) assert.equal(state('neanderthals'), 'extinct');
    if (year === 32000) assert.equal(state('denisovans'), 'last');
    if (year === 23000) assert.equal(state('denisovans'), 'unknown');
    assert.ok(page.timers.size <= 1);
    assert.ok(page.get('atlas-local-people').children.length >= 1);
  }
  assert.equal(page.location.searchParams.get('year'), '0');
  assert.equal(state('sapiens'), 'living');
  assert.equal(page.get('atlas-play')['aria-pressed'], 'false');
  assert.equal(page.get('atlas-play').textContent, page.atlas.playback.replay);
});

test('origins autoplay cancels stale ticks after pause, manual selection, speed change and restart', () => {
  const page = originsAtlasPage();
  page.click(page.get('atlas-play'));
  const stale = [...page.timers.values()][0].callback;
  page.click(page.get('atlas-play'));
  assert.equal(page.timers.size, 0);
  page.click(page.get('atlas-play'));
  stale();
  assert.equal(page.get('atlas-year').value, '0');
  page.fireNext();
  assert.equal(page.get('atlas-year').value, '1');
  page.get('atlas-speed').value = '3000'; page.get('atlas-speed').handlers.change();
  assert.equal(page.timers.size, 1);
  assert.equal([...page.timers.values()][0].delay, 3000);
  page.click(page.links.find(link => link.dataset.regionLink === 'europe'));
  assert.equal(page.timers.size, 0);
  page.click(page.get('atlas-restart'));
  assert.equal(page.location.searchParams.get('region'), 'africa');
  assert.equal(page.timers.size, 1);
  page.doc.hidden = true; page.events.visibilitychange();
  assert.equal(page.timers.size, 0);
  assert.equal(page.get('atlas-play')['aria-pressed'], 'false');
  page.doc.hidden = false;
  page.click(page.get('atlas-play'));
  page.click(page.steps[page.indexOf(40000)]);
  assert.equal(page.timers.size, 0);
  page.click(page.get('atlas-play'));
  page.events.pagehide();
  assert.equal(page.timers.size, 0);
});

test('origins map markers follow local records, retire known extinctions and retain uncertain endings', () => {
  const page = originsAtlasPage('?year=300000&region=africa');
  const marker = id => page.markerLabels.find(label => label.dataset.mapMarker === id);
  assert.equal(marker('naledi-south-africa').hidden, false);
  assert.equal(marker('naledi-south-africa').dataset.mapState, 'known');
  assert.equal(marker('denisovans-altai').hidden, true);
  assert.equal(marker('sapiens-europe').hidden, true);
  page.click(page.steps[page.indexOf(110000)]);
  assert.equal(marker('erectus-ngandong').dataset.mapState, 'known');
  assert.equal(marker('erectus-zhoukoudian').dataset.mapState, 'unknown');
  assert.equal(marker('erectus-zhoukoudian').hidden, false);
  assert.equal(marker('denisovans-baishiya').dataset.mapState, 'known');
  page.click(page.steps[page.indexOf(40000)]);
  assert.equal(marker('neanderthals-eurasia').hidden, true);
  assert.equal(marker('sapiens-europe').hidden, false);
  assert.equal(marker('luzonensis-callao').dataset.mapState, 'unknown');
  assert.equal(marker('denisovans-baishiya').dataset.mapState, 'known');
  page.click(page.steps[page.indexOf(32000)]);
  assert.equal(marker('denisovans-baishiya').dataset.mapState, 'last');
  assert.match(marker('denisovans-baishiya').stateLabel.textContent, /灭绝未定/);
  page.click(page.steps[page.indexOf(0)]);
  assert.equal(marker('neanderthals-eurasia').hidden, true);
  assert.equal(page.markerLabels.filter(label => label.dataset.mapState === 'unknown' && !label.hidden).length, 8);
  assert.equal(page.get('atlas-uncertain-records').children.length, 8);
});

test('origins Harbin point preserves the fossil age bound and links to the physical evidence', () => {
  const page = originsAtlasPage('?year=160000&region=east-asia');
  const marker = page.markerLabels.find(label => label.dataset.mapMarker === 'denisovans-harbin');
  assert.equal(marker.hidden, true);
  page.click(page.steps[page.indexOf(146000)]);
  assert.equal(marker.hidden, false);
  assert.equal(marker.dataset.mapState, 'known');
  assert.match(marker.stateLabel.textContent, /年代下限/);
  page.click(marker);
  const related = page.get('atlas-marker-detail').children.find(child => child.className === 'origins-related-links');
  assert.deepEqual(related.children.map(child => child.href), [
    '/human-origins/china-sites/#site-harbin', '/human-origins/family-tree/#family-denisovans',
  ]);
  page.click(page.steps[page.indexOf(110000)]);
  assert.equal(marker.dataset.mapState, 'unknown');
  page.click(page.steps[page.indexOf(0)]);
  assert.match(marker.stateLabel.textContent, /已消失/);
});

test('origins map selection pauses playback, restores deep links and drops invisible selections', () => {
  const page = originsAtlasPage('?year=110000&marker=erectus-zhoukoudian');
  const marker = id => page.markerLabels.find(label => label.dataset.mapMarker === id);
  assert.equal(page.get('atlas-marker-detail').hidden, false);
  assert.equal(page.get('atlas-marker-detail').focused, undefined, 'restoring a deep link must not move focus');
  assert.equal(marker('erectus-zhoukoudian')['aria-current'], 'location');
  page.click(page.get('atlas-play'));
  page.click(marker('erectus-ngandong'));
  assert.equal(page.timers.size, 0);
  assert.equal(page.location.searchParams.get('marker'), 'erectus-ngandong');
  assert.equal(page.location.searchParams.get('region'), 'southeast-asia');
  assert.equal(page.get('atlas-marker-detail').hidden, false);
  assert.equal(page.get('atlas-marker-detail').focused, true);
  assert.equal(page.get('atlas-marker-detail').scrolled.block, 'nearest');
  const back = page.get('atlas-marker-detail').children.find(child => child.className === 'origins-map-return');
  page.click(back);
  assert.equal(marker('erectus-ngandong').focused, true);
  page.click(page.steps[0]);
  assert.equal(page.get('atlas-marker-detail').hidden, true);
  assert.equal(page.location.searchParams.has('marker'), false);
  const invalid = originsAtlasPage('?year=40000&marker=missing');
  assert.equal(invalid.get('atlas-marker-detail').hidden, true);
});


test('origins reduced motion keeps manual dates and restart available without starting timers', () => {
  const page = originsAtlasPage('?year=45000&region=europe', 'gentle');
  assert.equal(page.get('atlas-play').disabled, true);
  assert.equal(page.get('atlas-motion-note').hidden, false);
  page.click(page.get('atlas-next'));
  assert.equal(Number(page.get('atlas-route-progress').value), page.indexOf(40000) + 1);
  assert.equal(page.routes.children.some(path => path.class === 'origins-route-arriving'), false);
  page.click(page.get('atlas-restart'));
  assert.equal(page.get('atlas-year').value, '0');
  assert.equal(page.timers.size, 0);
});

test('origins preserves remaining reading time on offscreen pause and does not auto resume', () => {
  const page = originsAtlasPage('?year=300000');
  page.click(page.get('atlas-play'));
  const duration = [...page.timers.values()][0].delay;
  page.advance(1700);
  page.offscreen();
  assert.equal(page.timers.size, 0);
  assert.equal(page.get('atlas-play')['aria-pressed'], 'false');
  page.click(page.get('atlas-play'));
  assert.equal([...page.timers.values()][0].delay, duration - 1700);
  page.effects.motion = 'off'; page.events['study:effects-change']();
  assert.equal(page.timers.size, 0);
  assert.equal(page.get('atlas-play').disabled, true);
  page.effects.motion = 'full'; page.events['study:effects-change']();
  assert.equal(page.get('atlas-play').disabled, false);
  assert.equal(page.timers.size, 0);
});
