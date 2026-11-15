/* 自测只写浏览器记录；题目和解析来自文件编排。 */
(() => {
  'use strict';

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function readProgress(raw, questions) {
    const allowed = new Set(questions.map(q => q.id));
    let saved;
    try { saved = JSON.parse(raw); } catch (_) { /* 损坏的数据从空记录恢复。 */ }
    const valid = value => [...new Set(Array.isArray(value) ? value.filter(id => allowed.has(id)) : [])];
    const wrong = valid(saved?.wrong);
    return {correct: valid(saved?.correct).filter(id => !wrong.includes(id)), wrong};
  }

  function recordAnswer(progress, id, correct) {
    return {
      correct: [...progress.correct.filter(value => value !== id), ...(correct ? [id] : [])],
      wrong: [...progress.wrong.filter(value => value !== id), ...(correct ? [] : [id])],
    };
  }

  class PracticeSession {
    constructor(questions, random = Math.random) {
      this.questions = shuffle(questions, random).slice(0, 8).map(q => ({...q, choices: shuffle(q.choices, random)}));
      this.index = 0;
      this.results = [];
    }
    get current() { return this.questions[this.index]; }
    get answered() { return this.results.length > this.index; }
    answer(choice) {
      if (!this.current || this.answered || !this.current.choices.some(c => c.id === choice)) return null;
      const result = {id: this.current.id, correct: choice === this.current.answer_id};
      this.results.push(result);
      return result;
    }
    next() {
      if (this.answered) this.index += 1;
      return this.current;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {shuffle, readProgress, recordAnswer, PracticeSession};
    return;
  }
  const root = document.getElementById('group-practice');
  const payload = document.getElementById('phonetics-practice-data');
  if (!root || !payload) return;
  const questions = JSON.parse(payload.textContent);
  const byId = new Map(questions.map(q => [q.id, q]));
  const get = id => document.getElementById('ph-' + id);
  let raw = null;
  const storageNote = get('practice-storage-note');
  const storageUnavailable = () => { storageNote.textContent = '当前浏览器无法保存记录，本次练习仍可完成，关闭或刷新后记录可能丢失。'; };
  try { raw = localStorage.getItem(root.dataset.practiceStorage); } catch (_) { storageUnavailable(); }
  let progress = readProgress(raw, questions);
  let session = null;
  let heard = false;
  let playbackToken = 0;
  const listen = get('quiz-listen');
  const options = get('quiz-choices');
  const feedback = get('quiz-feedback');
  const next = get('quiz-next');
  const mode = get('practice-mode');

  function title(question) {
    const answer = question.choices.find(c => c.id === question.answer_id).text;
    return question.kind === 'listening' ? `听辨 ${answer}` : question.prompt;
  }
  function addReviewLink(list, question) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = question.review;
    link.textContent = title(question);
    li.append(link);
    list.append(li);
  }
  function updateProgress() {
    get('practice-progress').textContent = `已练对 ${progress.correct.length} / ${questions.length} 题 · 待巩固 ${progress.wrong.length} 题`;
    get('practice-wrong').disabled = !progress.wrong.length;
    get('wrong-heading').textContent = `我的待巩固题目（${progress.wrong.length}）`;
    const list = get('wrong-list');
    list.replaceChildren();
    progress.wrong.forEach(id => addReviewLink(list, byId.get(id)));
    if (!progress.wrong.length) {
      const li = document.createElement('li');
      li.textContent = '还没有待巩固题目。练习时选错的题会出现在这里。';
      list.append(li);
    }
  }
  function cancelListening() {
    playbackToken += 1;
    window.PhoneticsAudio.stop();
    listen.disabled = false;
  }
  function begin(pool) {
    if (!pool.length) return;
    cancelListening();
    window.TTS?.resetSequence();
    session = new PracticeSession(pool);
    get('quiz-result').hidden = true;
    get('quiz').hidden = false;
    get('practice-start').textContent = '重新开一轮';
    showQuestion();
  }
  function showQuestion() {
    const question = session.current;
    heard = false;
    feedback.hidden = true;
    next.hidden = true;
    get('quiz-review').hidden = true;
    get('quiz-position').textContent = `${question.kind === 'listening' ? '听音辨音' : '理论小问答'} · 第 ${session.index + 1} / ${session.questions.length} 题`;
    get('quiz-prompt').textContent = question.prompt;
    get('quiz-prompt').focus({preventScroll: true});
    listen.hidden = question.kind !== 'listening';
    listen.disabled = false;
    listen.textContent = '🔊 听题目声音';
    get('quiz-audio-status').textContent = question.kind === 'listening' ? '先完整听一遍，再选择。可以反复听。' : '';
    options.replaceChildren();
    question.choices.forEach(choice => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ph-quiz-choice';
      button.dataset.choice = choice.id;
      button.textContent = choice.text;
      button.disabled = question.kind === 'listening';
      options.append(button);
    });
  }
  listen.addEventListener('click', async () => {
    const question = session?.current;
    if (!question?.audio) return;
    const token = ++playbackToken;
    listen.disabled = true;
    get('quiz-audio-status').textContent = '正在播放，请仔细听……';
    const result = await window.PhoneticsAudio.play(root.dataset.staticRoot + question.audio);
    if (token !== playbackToken || session?.current !== question) return;
    listen.disabled = false;
    if (result.ok) {
      heard = true;
      listen.textContent = '🔊 再听一遍';
      get('quiz-audio-status').textContent = '听完了，选出你听到的音标。';
      if (!session.answered) options.querySelectorAll('button').forEach(button => { button.disabled = false; });
    } else {
      get('quiz-audio-status').textContent = result.cancelled ? '播放已暂停，准备好后再听一遍。' : '音频暂时无法播放，请重试或切换到理论小问答。本题尚未计分。';
    }
  });
  options.addEventListener('click', event => {
    const button = event.target.closest('[data-choice]');
    if (!button || button.disabled || !session?.current) return;
    const question = session.current;
    if (question.kind === 'listening' && !heard) return;
    const result = session.answer(button.dataset.choice);
    if (!result) return;
    cancelListening();
    progress = recordAnswer(progress, result.id, result.correct);
    try { localStorage.setItem(root.dataset.practiceStorage, JSON.stringify(progress)); } catch (_) { storageUnavailable(); }
    updateProgress();
    options.querySelectorAll('button').forEach(option => {
      option.disabled = true;
      if (option.dataset.choice === question.answer_id) { option.classList.add('is-correct'); option.textContent += ' ✓ 正确答案'; }
      else if (option === button) { option.classList.add('is-wrong'); option.textContent += ' · 你的选择'; }
    });
    feedback.hidden = false;
    feedback.dataset.correct = String(result.correct);
    feedback.textContent = `${result.correct ? '答对了！' : '再看看这条线索。'} ${question.explanation}`;
    get('quiz-review').hidden = false;
    get('quiz-review').href = question.review;
    next.hidden = false;
    next.textContent = session.index === session.questions.length - 1 ? '查看本轮收获' : '下一题';
    next.focus({preventScroll: true});
  });
  next.addEventListener('click', () => {
    if (!session?.answered) return;
    cancelListening();
    if (session.next()) { showQuestion(); return; }
    get('quiz').hidden = true;
    get('quiz-result').hidden = false;
    const correct = session.results.filter(r => r.correct).length;
    get('quiz-result-title').textContent = `本轮练对 ${correct} / ${session.questions.length} 题`;
    get('quiz-result-title').focus({preventScroll: true});
    const wrong = session.results.filter(r => !r.correct);
    get('quiz-result-note').textContent = wrong.length ? '点开知识卡再试一试，然后把本轮错题练一遍。' : '这一轮完成啦！可以换一种模式，或到音标卡继续跟读。';
    const list = get('quiz-result-links');
    list.replaceChildren();
    wrong.forEach(result => addReviewLink(list, byId.get(result.id)));
    get('quiz-retry').hidden = !wrong.length;
  });
  get('practice-start').addEventListener('click', () => begin(questions.filter(q => mode.value === 'mixed' || q.kind === mode.value)));
  get('practice-wrong').addEventListener('click', () => begin(progress.wrong.map(id => byId.get(id))));
  get('quiz-retry').addEventListener('click', () => begin(session.results.filter(r => !r.correct).map(r => byId.get(r.id))));
  document.addEventListener('phonetics:groupchange', () => {
    cancelListening();
    if (session?.current?.audio && !session.answered) get('quiz-audio-status').textContent = '准备好后可以再听一遍。';
  });
  root.querySelector('.ph-practice-app').hidden = false;
  updateProgress();
})();
