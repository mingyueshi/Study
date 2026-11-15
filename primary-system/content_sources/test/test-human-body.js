const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { schema_version, station, lessons, heart, pulse, reaction, blindspot, expedition, notebook } = require('../human-body.json');
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
  texts(diagram, ['title', 'caption']);
  Object.values(diagram.labels).forEach(text);
  const animation = lesson.animation;
  texts(animation, ['intro', 'note']);
  assert.ok(animation.modes.length >= 1);
  assert.equal(new Set(animation.modes.map(mode => mode.id)).size, animation.modes.length);
  for (const mode of animation.modes) {
    assert.match(mode.id, /^[a-z-]+$/);
    texts(mode, ['label', 'caption']);
    assert.ok(mode.phases.length >= 2);
    assert.equal(new Set(mode.phases.map(phase => phase.id)).size, mode.phases.length);
    for (const phase of mode.phases) {
      assert.match(phase.id, /^[a-z-]+$/);
      texts(phase, ['label', 'title', 'body', 'cue']);
      assert.ok(Number.isInteger(phase.duration) && phase.duration >= 2000 && phase.duration <= 10000);
    }
  }
  const expectedPhases = {
    breathing: [['inhale', 'exchange', 'exhale']],
    digestion: [['mouth', 'esophagus', 'stomach', 'intestine', 'colon', 'exit']],
    circulation: [['return', 'fill', 'pump'], ['return-body', 'fill-right', 'to-lungs', 'oxygenate', 'return-lungs', 'fill-left', 'to-body', 'deliver']],
    movement: [['bend', 'extend']], nerves: [['sense', 'process', 'respond']],
    senses: [['light', 'vision'], ['sound', 'vibrate', 'hearing'], ['smell', 'taste']],
  };
  assert.deepEqual(animation.modes.map(mode => mode.phases.map(phase => phase.id)), expectedPhases[lesson.slug]);
  if (lesson.slug === 'circulation') {
    texts(animation.modes[1].labels, ['title', 'lungs', 'body', 'getOxygen', 'releaseCarbon', 'giveOxygen', 'carryCarbon', 'fillRight', 'sendLungs', 'fillLeft', 'sendBody', 'returnBody', 'returnLungs', 'follow']);
  }
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
    assert.match(question.id, new RegExp(`^${lesson.slug}-[a-z-]+$`));
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

texts(heart, ['route', 'legend']);

texts(pulse, ['title', 'teaser', 'intro', 'comparison', 'safety']);
texts(pulse.wrist, ['caption', 'thumb', 'spot', 'fingers']);
assert.equal(pulse.seconds, 30);
assert.equal(pulse.steps.length, 3);
for (const step of pulse.steps) texts(step, ['title', 'body']);
sources(pulse.sources);

const questionIds = lessons.flatMap(lesson => lesson.checkup.map(question => question.id));
assert.equal(new Set(questionIds).size, questionIds.length);
texts(expedition, ['title', 'intro', 'caption']);
assert.equal(expedition.organs.length, 7);
const organIds = expedition.organs.map(organ => organ.id);
assert.equal(new Set(organIds).size, organIds.length);
for (const organ of expedition.organs) {
  assert.match(organ.id, /^[a-z-]+$/);
  texts(organ, ['name', 'description']);
  assert.ok(lessons.some(lesson => lesson.slug === organ.lesson));
}
assert.equal(expedition.scenarios.length, 3);
assert.equal(new Set(expedition.scenarios.map(scene => scene.id)).size, 3);
for (const scene of expedition.scenarios) {
  assert.match(scene.id, /^[a-z-]+$/);
  texts(scene, ['title', 'question', 'summary']);
  assert.ok(scene.steps.length >= 4);
  for (const step of scene.steps) {
    texts(step, ['title', 'body']);
    assert.ok(organIds.includes(step.organ));
  }
}
assert.equal(expedition.challenges.length, 7);
assert.equal(new Set(expedition.challenges.map(item => item.id)).size, 7);
assert.deepEqual([...expedition.challenges.map(item => item.organ)].sort(), [...organIds].sort());
for (const item of expedition.challenges) {
  assert.match(item.id, /^locate-[a-z-]+$/);
  texts(item, ['prompt', 'hint', 'explanation']);
}
texts(notebook, ['title', 'intro', 'caption', 'recovery']);
assert.deepEqual(notebook.stages.map(stage => stage.id), ['rest', 'active', 'recovery']);
notebook.stages.forEach(stage => text(stage.label));

console.log('人体奥秘站：六课、十二幅图像、十八道自测、三种协作场景、七道定位挑战、九种过程演示与实验手册通过结构校验。');
