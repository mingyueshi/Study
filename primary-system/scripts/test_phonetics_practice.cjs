const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {readProgress, recordAnswer, PracticeSession} = require('../static/phonetics/practice.js');
const source = require('../phonetics/data/practice.json');
const questions = source.questions;

test('每轮不重复、最多八题，打乱选项后答案仍用稳定编号判断', () => {
  const session = new PracticeSession(questions, () => 0);
  assert.equal(session.questions.length, 8);
  assert.equal(new Set(session.questions.map(q => q.id)).size, 8);
  const original = JSON.stringify(questions);
  for (let index = 0; index < 8; index++) {
    assert.equal(session.index, index);
    const current = session.current;
    assert.equal(session.answer('missing'), null);
    assert.equal(session.next(), current);
    assert.deepEqual(session.answer(current.answer_id), {id: current.id, correct: true});
    assert.equal(session.answer(current.answer_id), null);
    session.next();
  }
  assert.equal(session.current, undefined);
  assert.equal(JSON.stringify(questions), original);
});

test('错题重练只出指定题，练对移出待巩固，再次练错重新加入', () => {
  const session = new PracticeSession([questions[0], questions[1]]);
  let progress = {correct: [], wrong: []};
  const question = session.current;
  const wrong = question.choices.find(c => c.id !== question.answer_id);
  const result = session.answer(wrong.id);
  assert.equal(result.correct, false);
  progress = recordAnswer(progress, result.id, result.correct);
  assert.deepEqual(progress.wrong, [question.id]);
  const retry = new PracticeSession(questions.filter(q => progress.wrong.includes(q.id)));
  assert.equal(retry.questions.length, 1);
  const success = retry.answer(question.answer_id);
  progress = recordAnswer(progress, success.id, success.correct);
  assert.deepEqual(progress, {correct: [question.id], wrong: []});
  progress = recordAnswer(progress, question.id, false);
  assert.deepEqual(progress, {correct: [], wrong: [question.id]});
});

test('浏览器旧记录过滤未知题和重复项，损坏或异常结构安全恢复', () => {
  const id = questions[0].id;
  assert.deepEqual(readProgress(JSON.stringify({correct: [id, id, 'old'], wrong: [id]}), questions), {correct: [], wrong: [id]});
  for (const value of ['{broken', 'null', '[]', '4', '{"correct":{},"wrong":"oops"}']) {
    assert.deepEqual(readProgress(value, questions), {correct: [], wrong: []});
  }
  const saved = recordAnswer({correct: [], wrong: []}, id, true);
  assert.deepEqual(readProgress(JSON.stringify(saved), questions), saved);
});

function audioEnvironment() {
  const audios = [], events = new Map(), said = [];
  let stops = 0;
  const status = {textContent: ''};
  class Audio {
    constructor(url) { this.url = url; audios.push(this); }
    play() { return new Promise((resolve, reject) => { this.reject = reject; }); }
    pause() { this.paused = true; }
  }
  const document = {
    getElementById(id) { return id === 'ph-audio-status' ? status : id === 'tts-volume' ? {value: '.4'} : null; },
    addEventListener(type, fn, capture) { const key = type + Boolean(capture); events.set(key, [...(events.get(key) || []), fn]); },
    querySelector() { return null; }, querySelectorAll() { return []; },
  };
  const window = {TTS: {stopSequence() { stops++; }, speak(word) { said.push(word); }}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../static/phonetics/phonetics.js'), 'utf8'), {window, document, Audio});
  return {api: window.PhoneticsAudio, audios, status, said, get stops() { return stops; },
    click(button, capture = false) {
      return Promise.all((events.get('click' + capture) || []).map(fn => fn({preventDefault() {}, target: {closest(selector) { return selector === '[data-audio]' || capture ? button : null; }}})));
    }};
}

test('听辨只在音频结束后成功，播放失败不会代读例词', async () => {
  const env = audioEnvironment();
  const play = env.api.play('/sound.m4a');
  assert.equal(env.audios[0].volume, .4);
  assert.equal(env.stops, 1);
  env.audios[0].onended();
  assert.equal((await play).ok, true);
  const failed = env.api.play('/broken.m4a');
  env.audios[1].reject(new Error('missing'));
  assert.equal((await failed).ok, false);
  assert.deepEqual(env.said, []);
});

test('快速切换和停止使旧回调失效，单词点读先停止音素音频', async () => {
  const env = audioEnvironment();
  const first = env.api.play('/first.m4a');
  const second = env.api.play('/second.m4a');
  assert.equal((await first).cancelled, true);
  assert.equal(env.audios[0].paused, true);
  env.audios[0].reject(new Error('late error'));
  await env.click({}, true);
  assert.equal((await second).cancelled, true);
  assert.equal(env.audios[1].paused, true);
  assert.deepEqual(env.said, []);
});

test('普通音标卡音频失败才提示并回退例词，取消不触发回退', async () => {
  const env = audioEnvironment();
  const first = env.click({dataset: {audio: '/missing.m4a', fallback: 'ship'}});
  env.audios[0].reject(new Error('missing'));
  await first;
  assert.deepEqual(env.said, ['ship']);
  assert.match(env.status.textContent, /改听例词/);
  const second = env.click({dataset: {audio: '/second.m4a', fallback: 'sea'}});
  env.api.stop();
  await second;
  assert.deepEqual(env.said, ['ship']);
});
