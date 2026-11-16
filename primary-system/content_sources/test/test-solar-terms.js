const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const content = require('../solar-terms.json');

const calendar = {
  chun: '立春 雨水 惊蛰 春分 清明 谷雨',
  xia: '立夏 小满 芒种 夏至 小暑 大暑',
  qiu: '立秋 处暑 白露 秋分 寒露 霜降',
  dong: '立冬 小雪 大雪 冬至 小寒 大寒',
};
const plainText = text => {
  assert.equal(typeof text, 'string');
  assert.ok(text.trim().length && !/["\r\n]/.test(text), text);
};

assert.equal(content.schema_version, 1);
assert.equal(content.experience.calendar.timeZone, 'Asia/Shanghai');
assert.equal(content.experience.calendar.minYear, 1900);
assert.equal(content.experience.calendar.maxYear, 2100);
assert.equal(new URL(content.experience.calendar.source).protocol, 'https:');
plainText(content.experience.calendar.note);
assert.equal(content.experience.scenes.seconds, 6);
const sceneKinds = new Set(content.experience.scenes.kinds);
assert.equal(sceneKinds.size, content.experience.scenes.kinds.length);
plainText(content.experience.scenes.note);
assert.ok(content.experience.diary.weather.length >= 7);
content.experience.diary.weather.forEach(plainText);
const longitudes = new Set();
const lessonSources = {
  geography: fs.readFileSync(path.join(__dirname, '../geo/knowledge-core.js'), 'utf8'),
  literature: fs.readFileSync(path.join(__dirname, '../lit-data.js'), 'utf8'),
};
for (const [subject, lessons] of Object.entries(content.learning_lessons)) {
  assert.ok(lessonSources[subject], subject);
  for (const [id, title] of Object.entries(lessons)) {
    plainText(title);
    assert.ok(lessonSources[subject].includes(`id: '${id}', title: '${title}'`), id);
  }
}
assert.deepEqual(Object.keys(content.learning_lessons).sort(), ['geography', 'literature']);
assert.deepEqual(content.seasons.map(season => season.id), Object.keys(calendar));
const termIds = new Set();
const poemKeys = new Set();
for (const season of content.seasons) {
  plainText(season.name);
  plainText(season.caption);
  assert.equal(season.terms.map(term => term.name).join(' '), calendar[season.id]);
  for (const term of season.terms) {
    assert.match(term.id, /^[a-z]+$/);
    assert.ok(!termIds.has(term.id), term.id);
    termIds.add(term.id);
    assert.match(term.date, /^(?:[1-9]|1[012])月(?:[1-9]|[12][0-9]|3[01])日$/);
    assert.ok(Number.isInteger(term.solarLongitude) && term.solarLongitude >= 0 && term.solarLongitude < 360 && term.solarLongitude % 15 === 0);
    longitudes.add(term.solarLongitude);
    assert.ok(sceneKinds.has(term.custom_scene), term.id + ' 习俗场景');
    for (const key of ['symbol', 'custom', 'proverb', 'proverb_note', 'observation']) plainText(term[key]);
    assert.deepEqual(Object.keys(term.learning).sort(), ['geography', 'literature', 'poetry']);
    for (const subject of ['geography', 'literature']) {
      assert.ok(content.learning_lessons[subject][term.learning[subject].lesson], term.id);
      plainText(term.learning[subject].question);
    }
    plainText(term.learning.poetry);
    assert.equal(term.phenology.length, 3, term.name);
    for (const item of term.phenology) {
      assert.ok(sceneKinds.has(item.scene), term.id + ' 三候场景');
      plainText(item.name);
      plainText(item.note);
    }
    assert.deepEqual(Object.keys(term.poem).sort(), ['author', 'paragraph', 'title']);
    plainText(term.poem.title);
    plainText(term.poem.author);
    const poemKey = JSON.stringify([term.poem.title, term.poem.author]);
    assert.ok(!poemKeys.has(poemKey), term.name);
    poemKeys.add(poemKey);
    assert.ok(Number.isInteger(term.poem.paragraph) && term.poem.paragraph >= 0, term.name);
    assert.equal(new URL(term.source).protocol, 'https:');
  }
}
assert.equal(longitudes.size, 24);

const challengeIds = new Set();
assert.equal(content.challenges.length, 12);
for (const challenge of content.challenges) {
  assert.match(challenge.id, /^[a-z-]+$/);
  assert.ok(!challengeIds.has(challenge.id));
  challengeIds.add(challenge.id);
  assert.ok(termIds.has(challenge.term));
  plainText(challenge.question);
  plainText(challenge.explanation);
  assert.equal(challenge.options.length, 3);
  assert.equal(new Set(challenge.options).size, 3);
  challenge.options.forEach(plainText);
  assert.ok(Number.isInteger(challenge.answer) && challenge.answer >= 0 && challenge.answer < 3);
}

assert.ok(content.sources.length >= 2);
for (const source of content.sources) {
  plainText(source.label);
  assert.equal(new URL(source.url).protocol, 'https:');
}
console.log('二十四节气馆文件源校验通过');
