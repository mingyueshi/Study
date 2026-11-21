const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { check, normalize, restore, recordAttempt } = require('../static/study_topics/punctuation.js');
const course = require('../content_sources/punctuation.json');
const questions = course.questions.map(item => ({ ...item, revision: 'current' }));
const byId = id => questions.find(item => item.id === id);
const input = answer => answer.map(token => token || '∅');

test('all authored reference vectors pass; missing answers are not recorded as mistakes', () => {
  for (const question of questions) {
    for (const answer of question.answers) assert.equal(check(question, input(answer)).correct, true, question.id);
    assert.equal(check(question, new Array(question.chunks.length - 1).fill('')).complete, false);
  }
});
test('accepts explicit no-punctuation, full/half width point marks, and keeps quote order', () => {
  assert.equal(normalize(' : ？! '), '：？！');
  assert.equal(check(byId('direct-question'), ['?']).correct, true);
  assert.equal(check(byId('approximate-days'), ['∅', '。']).correct, true);
  assert.equal(check(byId('approximate-days'), ['、', '。']).correct, false);
  assert.equal(check(byId('complete-quote'), ['：“', '”。']).correct, false);
  assert.equal(check(byId('dash-explanation'), ['-', '。']).correct, false);
  assert.equal(check(byId('list-unfinished'), ['、', '、', '...']).correct, false);
});
test('multiple valid vectors cannot be mixed to form an unpaired quotation', () => {
  const question = byId('event-name');
  assert.equal(check(question, ['∅', '∅', '。']).correct, true);
  assert.equal(check(question, ['“', '”', '。']).correct, true);
  const result = check(question, ['“', '∅', '。']);
  assert.equal(result.correct, false);
  assert.equal(result.slots.filter(Boolean).length, 2);
});
test('malformed authored vectors cannot award a correct answer', () => {
  const question = { chunks: ['前', '后'], answers: [['？']] };
  for (const answers of [null, [], [[]], [['？', '。']], [null], [[42]], [['文字']], [['？\n']], [['？'], []]]) {
    const result = check({ ...question, answers }, ['？']);
    assert.deepEqual(result, { complete: false, correct: false, slots: [], invalid: true }, JSON.stringify(answers));
  }
  assert.equal(check({ ...question, chunks: ['前', null] }, ['？']).invalid, true);
  assert.equal(check({ ...question, answers: [['']] }, ['∅']).correct, true);
});

function mountPractice(question) {
  const element = () => ({
    dataset: {}, listeners: {}, value: '', append() {}, replaceChildren() {}, setAttribute() {},
    addEventListener(event, listener) { this.listeners[event] = listener; },
  });
  const elements = new Map();
  const get = selector => {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  };
  const root = {
    dataset: { storageScope: 'test' },
    querySelector: selector => selector === '[data-usage-tools]' ? null : get(selector),
    querySelectorAll: () => [],
  };
  const writes = [];
  const script = readFileSync(require.resolve('../static/study_topics/punctuation.js'), 'utf8');
  runInNewContext(script, {
    URL, URLSearchParams, document: {
      querySelector: () => root, createElement: element, createTextNode: text => text,
      getElementById: () => ({ textContent: JSON.stringify({ ...course, questions: [question] }) }),
    },
    location: { href: 'https://example.invalid/?view=practice', search: '?view=practice' },
    history: { replaceState() {} },
    localStorage: { getItem: () => null, setItem: (...args) => writes.push(args) },
  });
  return { get, writes };
}

test('a malformed question disables input and cannot write progress by submitting or revealing', () => {
  const { get, writes } = mountPractice({ ...byId('direct-question'), answers: [[]] });
  const form = get('[data-answer-form]');
  assert.equal(form.hidden, true);
  assert.match(get('[data-feedback]').textContent, /暂时无法作答/);
  form.listeners.submit({ preventDefault() {} });
  get('[data-reveal]').listeners.click();
  assert.equal(get('[data-reference]').hidden, true);
  assert.match(get('[data-progress]').textContent, /自己答对 0 题/);
  assert.deepEqual(writes, []);
});

test('missing labels and related marks leave a valid practice question usable', () => {
  const { get } = mountPractice({ ...byId('direct-question'), group: 'unknown', level: 'unknown', mark_ids: ['unknown'] });
  assert.equal(get('[data-answer-form]').hidden, false);
  assert.equal(get('[data-question-level]').textContent, '');
  assert.equal(get('[data-related]').hidden, true);
});
test('revealed references never award independent completion; wrong answers enter review', () => {
  const question = byId('complete-quote');
  const wrong = recordAttempt(null, question, false);
  assert.equal(wrong.wrong, true);
  const corrected = recordAttempt(wrong, question, true);
  assert.equal(corrected.independent, true);
  assert.equal(corrected.wrong, false);
  const assisted = recordAttempt({ revealed: true }, question, true);
  assert.equal(assisted.independent, false);
  assert.equal(assisted.assisted, true);
  assert.equal(recordAttempt(assisted, question, true).independent, false);
  const laterWrong = recordAttempt(corrected, question, false);
  assert.equal(laterWrong.independent, true);
  assert.equal(laterWrong.wrong, true);
});
test('restore discards stale, unknown and malformed records without promoting completion', () => {
  assert.deepEqual(restore(null, questions), {});
  assert.deepEqual(restore([], questions), {});
  const restored = restore({
    'complete-quote': { revision: 'old', independent: true },
    'direct-question': { revision: 'current', independent: 'true', wrong: true },
    'unknown-question': { revision: 'current', independent: true },
  }, questions);
  assert.deepEqual(Object.keys(restored), ['direct-question']);
  assert.equal(restored['direct-question'].independent, false);
  assert.equal(restored['direct-question'].wrong, true);
});
