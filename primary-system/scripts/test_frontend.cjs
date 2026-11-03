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

function wordsPage(fetch, extraWords = []) {
  const elements = {};
  const get = (id) => elements[id] || (elements[id] = element());
  get('words-state').textContent = JSON.stringify({
    scenarios: [{ id: '1', name: 'Fruit', zh: '水果', color: '#fff', total: 1, learned: 0 }],
    words: [{ id: '1', target_id: 'target-a', revision: 0, chinese_version_id: null, presentation_revision: 0, en: 'apple', zh: '苹果', ipa: '', scenario: '1', learned: false }, ...extraWords],
  });
  const context = vm.createContext({ document: { getElementById: get, cookie: '' }, window: {}, fetch });
  run('words/words.js', context);
  return {
    get,
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
