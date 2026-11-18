const { test } = require('node:test');
const assert = require('node:assert/strict');
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
