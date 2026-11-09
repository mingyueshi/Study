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

function questionPractice(questions, correct) {
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
  const requests = [];
  run('questionbank/practice.js', vm.createContext({
    document: {
      querySelector: () => board,
      getElementById: () => ({textContent: JSON.stringify(questions)}),
      addEventListener() {}, cookie: '',
    },
    window: {},
    fetch: async (url, request) => {
      requests.push(JSON.parse(request.body));
      return {ok: true, json: async () => ({correct: correct[requests.length - 1]})};
    },
  }));
  return {
    get, requests,
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

function speechPage({ supported = true, throws = false, controls = false, stored = {}, voices = [] } = {}) {
  const button = element(), items = [element(), element()], clicks = [], spoken = [];
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
  const synth = {
    getVoices: () => voices, addEventListener() {},
    get speaking() { return current !== null; }, pending: false,
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
    window: supported ? { speechSynthesis: synth } : {},
    localStorage: { getItem: (key) => storage[key] || null, setItem: (key, value) => { storage[key] = value; } },
    SpeechSynthesisUtterance: function (text) { this.text = text; },
    document: {
      addEventListener: (event, fn) => clicks.push(fn), getElementById: (id) => fields[id] || null,
      createElement: () => element(),
      querySelector: () => ({ querySelectorAll: () => items }),
      querySelectorAll: (selector) => selector === '.tts-playing'
        ? items.filter((item) => item.classList.contains('tts-playing'))
        : button.classList.contains('tts-active') ? [button] : [],
    },
    setInterval() { throw new Error('A timer must not advance speech'); },
  });
  run('speech.js', context);
  run('tts.js', context);
  const click = (target, selector) => clicks.forEach((fn) => fn({
    preventDefault() {}, target: { closest: (value) => value === selector ? target : null },
  }));
  return {
    button, spoken, items, fields, storage, click: () => click(button, '[data-tts-sequence]'),
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

function wordsPage(fetch, extraWords = [], search = '') {
  const elements = {};
  const get = (id) => elements[id] || (elements[id] = element());
  const card = element(), focused = [];
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
    document: { getElementById: get, cookie: '' }, window: {}, fetch,
    URLSearchParams, location: { search }, requestAnimationFrame: (callback) => callback(),
  });
  run('words/words.js', context);
  return {
    get, card, focused,
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
