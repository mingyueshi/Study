/* 变身游戏的学习边界：揭晓不当作答题，跳过不算完成。 */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const items = JSON.parse(fs.readFileSync(path.join(root, 'plurals/plural_data/plurals.json'))).items;
const core = items.filter(item => item.tier === 'core');

function gamePage() {
  const nodes = new Map();
  const get = name => {
    if (!nodes.has(name)) nodes.set(name, {
      dataset: {}, hidden: false, disabled: false, textContent: '', handlers: {},
      classList: {toggle() {}},
      setAttribute(name, value) { this[name] = value; },
      addEventListener(name, handler) { this.handlers[name] = handler; },
      focus() { this.focused = true; },
    });
    return nodes.get(name);
  };
  const game = {hidden: true, querySelector: selector => get(selector.match(/data-transform-([\w-]+)/)[1])};
  const cards = core.map(item => ({
    dataset: {...item, singularIpa: '', pluralIpa: ''},
    querySelector: () => item.note ? {textContent: item.note} : null,
  }));
  vm.runInNewContext(fs.readFileSync(path.join(root, 'static/plurals/plurals.js'), 'utf8'), {
    document: {
      querySelector: selector => selector === '[data-plural-transform]' ? game : null,
      querySelectorAll: () => cards,
    },
    fetch() { assert.fail('揭晓词形不应请求练习上报端点'); },
  });
  return {get, game, click: name => get(name).handlers.click()};
}

test('a round covers every core word once and can restart without repeating the last word', () => {
  const page = gamePage(), words = new Set();
  assert.equal(page.game.hidden, false);
  for (let i = 0; i < core.length; i++) {
    const singular = page.get('word').textContent;
    assert.equal(words.has(singular), false);
    words.add(singular);
    page.click('flip');
    assert.equal(page.get('word').textContent, core.find(item => item.singular === singular).plural);
    assert.equal(page.get('say').dataset.say, page.get('word').textContent);
    if (i < core.length - 1) page.click('next');
  }
  assert.equal(words.size, core.length);
  assert.match(page.get('progress').textContent, /已变身 27／27，全都看过啦/);
  assert.equal(page.get('next').disabled, true);
  assert.equal(page.get('restart').hidden, false);
  const last = page.get('flip')['aria-label'];
  page.click('restart');
  assert.equal(last.startsWith(page.get('word').textContent + ' '), false);
  assert.equal(page.get('flip').focused, true);
  assert.match(page.get('progress').textContent, /第 1／27 个 · 已变身 0／27/);
});

test('repeated flips count once and skipped words do not count', () => {
  const page = gamePage();
  page.click('next');
  assert.match(page.get('progress').textContent, /已变身 0／27/);
  const singular = page.get('word').textContent;
  page.click('flip');
  page.click('flip');
  assert.equal(page.get('word').textContent, singular);
  assert.equal(page.get('flip')['aria-pressed'], 'false');
  assert.equal(page.get('say').dataset.say, singular);
  page.click('flip');
  assert.match(page.get('progress').textContent, /已变身 1／27/);
});

test('same-form nouns reveal a quantity change with an explicit explanation', () => {
  const page = gamePage();
  for (let i = 0; i < core.length; i++) {
    const word = page.get('word').textContent;
    const item = core.find(item => item.singular === word);
    if (item.singular === item.plural) {
      page.click('flip');
      assert.equal(page.get('word').textContent, word);
      assert.equal(page.get('count').textContent, '多个 · 复数');
      assert.equal(page.get('emoji').textContent, (item.emoji || '🔤').repeat(3));
      assert.match(page.get('result').textContent, /数量变多，单词的样子不变/);
      return;
    }
    page.click('next');
  }
  assert.fail('核心词应包含单复同形词');
});
