const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { schema_version, station, lessons, heart, pulse, reaction, blindspot } = require('../human-body.json');
const art = fs.readFileSync(path.join(__dirname, '../../static/science/body-atlas.svg'), 'utf8');

function text(value) {
  assert.equal(typeof value, 'string');
  assert.ok(value.trim(), '文案不能留空');
  assert.doesNotMatch(value, /["\r\n]|<[a-zA-Z/]/, '文案须使用中文标点且不能含 HTML 或裸换行');
}

function texts(object, fields) {
  fields.forEach(field => text(object[field]));
}

function sources(items) {
  assert.ok(Array.isArray(items) && items.length > 0);
  for (const source of items) {
    text(source.label);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
}

assert.equal(schema_version, 1);
texts(station, ['title', 'intro', 'prompt', 'answer']);
assert.deepEqual(lessons.map(lesson => lesson.slug), ['breathing', 'digestion', 'circulation', 'movement', 'nerves', 'senses']);
for (const id of ['atlas', ...lessons.map(lesson => lesson.slug)]) {
  assert.ok(art.includes(`<symbol id="${id}"`), `缺少本地图示 ${id}`);
}
for (const lesson of lessons) {
  texts(lesson, ['label', 'title', 'teaser', 'intro', 'observe', 'takeaway']);
  assert.ok(lesson.stops.length >= 3);
  for (const stop of lesson.stops) texts(stop, ['title', 'body']);
  assert.equal(new Set(lesson.stops.map(stop => stop.title)).size, lesson.stops.length);
  texts(lesson.quiz, ['question', 'answer']);
  const diagram = lesson.diagram;
  texts(diagram, ['title', 'prompt', 'caption']);
  const expectedSteps = {
    breathing: ['inhale', 'exhale'],
    digestion: ['mouth', 'esophagus', 'stomach', 'intestine', 'colon'],
    movement: ['extend', 'bend'],
    nerves: ['sense', 'process', 'respond'],
    senses: ['eye', 'ear', 'smell'],
  };
  if (lesson.slug !== 'circulation') {
    assert.deepEqual(diagram.steps.map(step => step.id), expectedSteps[lesson.slug]);
    diagram.steps.forEach(step => texts(step, ['label', 'headline', 'body']));
  }
  Object.values(diagram.labels).forEach(text);
  const requiredLabels = {
    breathing: ['airway', 'lungs', 'diaphragm', 'alveoli', 'oxygen', 'carbon', 'air', 'blood'],
    digestion: ['mouth', 'esophagus', 'stomach', 'intestine', 'colon', 'nutrients', 'water', 'exit'],
    circulation: ['rightAtrium', 'rightVentricle', 'leftAtrium', 'leftVentricle', 'lungs', 'body'],
    movement: ['bone', 'joint', 'biceps', 'triceps', 'tendon', 'slider', 'straight', 'bent'],
    nerves: ['brain', 'spine', 'sensory', 'motor', 'hand'],
    senses: ['cornea', 'lens', 'retina', 'optic', 'canal', 'drum', 'cochlea', 'nerve', 'nose', 'tongue'],
  };
  requiredLabels[lesson.slug].forEach(label => text(diagram.labels[label]));
  assert.equal(lesson.gallery.length, 2);
  for (const media of lesson.gallery) {
    texts(media, ['title', 'kind', 'alt', 'caption', 'credit']);
    assert.match(media.src, /^science\/body-media\/[a-z-]+\.(?:jpg|png|webp)$/);
    assert.ok(fs.statSync(path.join(__dirname, '../../static', media.src)).size > 1000);
    assert.equal(new URL(media.source_url).protocol, 'https:');
    assert.equal(media.clues.length, 2);
    media.clues.forEach(text);
  }
  assert.equal(lesson.discoveries.length, 3);
  lesson.discoveries.forEach(item => texts(item, ['title', 'body']));
  texts(lesson.experiment, ['title', 'materials', 'question', 'explanation']);
  assert.ok(lesson.experiment.steps.length >= 3);
  lesson.experiment.steps.forEach(text);
  assert.equal(lesson.checkup.length, 3);
  for (const question of lesson.checkup) {
    texts(question, ['prompt', 'explanation']);
    assert.equal(question.options.length, 3);
    question.options.forEach(text);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length);
  }
  sources(lesson.sources);
}

texts(reaction, ['title', 'intro', 'start', 'waiting', 'go', 'early', 'again', 'result', 'unit', 'caption', 'interrupted']);
texts(blindspot, ['title', 'intro', 'explanation']);
blindspot.steps.forEach(text);

texts(heart, ['title', 'intro', 'route', 'legend']);
assert.deepEqual(heart.phases.map(phase => phase.id), ['return', 'fill', 'pump']);
for (const phase of heart.phases) texts(phase, ['label', 'description']);

texts(pulse, ['title', 'teaser', 'intro', 'comparison', 'safety']);
texts(pulse.wrist, ['caption', 'thumb', 'spot', 'fingers']);
assert.equal(pulse.seconds, 30);
assert.equal(pulse.steps.length, 3);
for (const step of pulse.steps) texts(step, ['title', 'body']);
sources(pulse.sources);

console.log('人体奥秘站：六课、十二幅外部图像、小实验与十八道自测通过结构校验。');
