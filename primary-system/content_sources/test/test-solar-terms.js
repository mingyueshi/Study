const assert = require('node:assert/strict');
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
    for (const key of ['symbol', 'custom', 'proverb', 'proverb_note']) plainText(term[key]);
    assert.equal(term.phenology.length, 3, term.name);
    for (const item of term.phenology) {
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

assert.ok(content.sources.length >= 2);
for (const source of content.sources) {
  plainText(source.label);
  assert.equal(new URL(source.url).protocol, 'https:');
}
console.log('二十四节气馆文件源校验通过');
