const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { schema_version, station, lessons, heart, pulse, reaction, blindspot, expedition, growth, notebook, health } = require('../human-body.json');
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

function validateAnimation(lesson) {
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
    senses: [['light', 'vision'], ['sound', 'vibrate', 'hearing'], ['smell', 'smell-signal'], ['taste-input', 'taste']],
  };
  assert.deepEqual(animation.modes.map(mode => mode.phases.map(phase => phase.id)), expectedPhases[lesson.slug]);
  if (lesson.slug === 'senses') {
    assert.deepEqual(animation.modes.map(mode => mode.id), ['eye', 'ear', 'smell', 'taste']);
  }
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
}

assert.equal(schema_version, 1);
texts(station, ['title', 'intro', 'prompt', 'answer']);
const originalSlugs = ['breathing', 'digestion', 'circulation', 'movement', 'nerves', 'senses'];
const lessonSlugs = lessons.map(lesson => lesson.slug);
assert.deepEqual(lessonSlugs, [...originalSlugs, 'endocrine', 'urinary', 'immunity', 'skin', 'nutrition', 'sleep']);
for (const id of ['atlas', ...originalSlugs]) {
  assert.ok(art.includes(`<symbol id="${id}"`), `缺少本地图示 ${id}`);
}
for (const lesson of lessons) {
  texts(lesson, ['label', 'title', 'teaser', 'intro', 'observe', 'takeaway']);
  assert.ok(lesson.stops.length >= 3);
  for (const stop of lesson.stops) texts(stop, ['title', 'body']);
  assert.equal(new Set(lesson.stops.map(stop => stop.title)).size, lesson.stops.length);
  texts(lesson.quiz, ['question', 'answer']);
  if (originalSlugs.includes(lesson.slug)) {
    validateAnimation(lesson);
    assert.equal(lesson.gallery.length, 2);
  } else {
    text(lesson.route_title);
    assert.equal(lesson.stops.length, 3);
    assert.equal(lesson.animation, undefined);
    assert.equal(lesson.gallery.length, 1);
  }
  for (const media of lesson.gallery) {
    texts(media, ['title', 'kind', 'alt', 'caption', 'credit']);
    assert.match(media.src, /^science\/body-media\/[a-z-]+\.(?:jpg|png|webp)$/);
    assert.ok(fs.statSync(path.join(__dirname, '../../static', media.src)).size > 1000);
    assert.equal(new URL(media.source_url).protocol, 'https:');
    if (media.license) sources([media.license]);
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
texts(expedition.explorer, ['title', 'intro', 'prompt']);
assert.equal(expedition.organs.length, 7);
const organIds = expedition.organs.map(organ => organ.id);
assert.equal(new Set(organIds).size, organIds.length);
const bodyMap = fs.readFileSync(path.join(__dirname, '../../templates/science/body/whole-body.html'), 'utf8');
const mapOrganIds = [...bodyMap.matchAll(/data-organ-shape="([a-z-]+)"/g)].map(match => match[1]);
assert.deepEqual(mapOrganIds.sort(), [...organIds].sort(), '人体图的可点击区域须与器官档案一一对应');
for (const organ of expedition.organs) {
  assert.match(organ.id, /^[a-z-]+$/);
  texts(organ, ['name', 'description', 'location']);
  assert.ok(lessons.some(lesson => lesson.slug === organ.lesson));
}
const layerIds = expedition.layers.map(layer => layer.id);
assert.deepEqual(layerIds, ['organs', 'skeleton', 'muscles', 'vessels', 'nerves']);
const atlasLayers = fs.readFileSync(path.join(__dirname, '../../templates/science/body/system-layers.html'), 'utf8');
assert.deepEqual([...atlasLayers.matchAll(/data-atlas-art="([a-z-]+)"/g)].map(match => match[1]), layerIds.slice(1));
for (const layer of expedition.layers) {
  texts(layer, ['label', 'description']);
  if (layer.id === 'organs') continue;
  text(layer.prompt);
  assert.ok(lessonSlugs.includes(layer.lesson));
  assert.ok(layer.features.length >= 2);
  layer.features.forEach(feature => texts(feature, ['name', 'description']));
}
sources(expedition.layer_sources);
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

texts(growth, ['title', 'intro', 'note', 'question', 'answer']);
assert.deepEqual(growth.stages.map(stage => stage.id), ['infancy', 'early-childhood', 'school-age', 'puberty', 'adult']);
for (const stage of growth.stages) texts(stage, ['label', 'age', 'icon', 'title', 'body']);
sources(growth.sources);

texts(health, ['title', 'intro']);
assert.deepEqual(health.scenarios.map(scene => scene.id), ['food', 'activity', 'sleep']);
for (const scene of health.scenarios) {
  texts(scene, ['label', 'question', 'observe']);
  assert.equal(scene.comparisons.length, 2);
  scene.comparisons.forEach(choice => texts(choice, ['title', 'effect']));
  assert.equal(new Set(scene.links.map(link => link.lesson)).size, scene.links.length);
  assert.ok(scene.links.length >= 2);
  for (const link of scene.links) {
    text(link.label);
    assert.ok(lessonSlugs.includes(link.lesson));
    assert.ok(!link.anchor || (link.lesson === 'circulation' && link.anchor === 'pulse'));
  }
  sources(scene.sources);
}

const mediaPaths = lessons.flatMap(lesson => lesson.gallery.map(media => media.src));
assert.equal(new Set(mediaPaths).size, mediaPaths.length);

console.log('人体奥秘站：12 课、18 幅本地图像、36 道自测、四种系统图层、三个健康场景及原有探索活动通过结构校验。');
