'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../assets/theme.js'), 'utf8');
const key = 'personal_learning_theme_v1';
function open({ saved = null, dark = false, file = false, denied = false, query = '' } = {}) {
  const storage = new Map(saved ? [[key, saved]] : []);
  const events = {};
  const mediaEvents = {};
  const media = { matches: dark, addEventListener: (name, fn) => { mediaEvents[name] = fn; } };
  const root = { dataset: {} };
  const icon = {}, label = {}, meta = {};
  const button = { setAttribute() {}, querySelector: selector => selector.includes('icon') ? icon : label };
  const context = { URL, URLSearchParams,
    location: { protocol: file ? 'file:' : 'http:', search: query, pathname: '/study/personal-learning/ai/index.html', href: 'file:///study/personal-learning/ai/index.html' },
    localStorage: { getItem: name => { if (denied) throw new Error('denied'); return storage.get(name); }, setItem: (name, value) => { if (denied) throw new Error('denied'); storage.set(name, value); } },
    document: { documentElement: root, currentScript: { src: 'file:///study/personal-learning/assets/theme.js' }, querySelectorAll: () => [button], querySelector: () => meta, addEventListener: (name, fn) => { events[name] = fn; } },
    window: { matchMedia: () => media, addEventListener: (name, fn) => { events[name] = fn; } },
  };
  vm.runInNewContext(source, context);
  return { theme: context.window.LearningTheme, storage, events, media, mediaEvents, label };
}
let page = open();
assert.equal(page.theme.current, 'light');
page.media.matches = true; page.mediaEvents.change();
assert.equal(page.theme.current, 'dark', '首次跟随系统');
page.theme.set('light');
assert.equal(page.storage.get(key), 'light');
page.mediaEvents.change(); assert.equal(page.theme.current, 'light', '手动选择优先于系统变化');
assert.equal(open({ saved: page.storage.get(key), dark: true }).theme.current, 'light', '跨页读取同一主题选择');
page.events.storage({ key, newValue: 'dark' }); assert.equal(page.theme.current, 'dark');
page.theme.set('invalid'); assert.equal(page.theme.current, 'dark');
page = open({ denied: true }); page.theme.set('dark'); assert.equal(page.theme.current, 'dark');
page = open({ file: true, query: '?theme=light', saved: 'dark' });
assert.equal(page.theme.current, 'light', '本地文件能接收跨页面的主题');
const link = { href: 'file:///study/personal-learning/english/index.html#start' };
page.events.click({ target: { closest: selector => selector === 'a[href]' ? link : null } });
assert.equal(new URL(link.href).searchParams.get('theme'), 'light');
assert.equal(new URL(link.href).hash, '#start', '传递主题不改动学习锚点');
console.log('✅ 主题首次应用、持久化、系统偏好、存储回退及本地跨页导航检查通过');
