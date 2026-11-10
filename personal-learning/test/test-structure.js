'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
let links = 0;
const pages = files(root).filter(file => file.endsWith('.html'));
for (const entry of ['index.html', 'english/index.html', 'english/techlex/index.html', 'ai/index.html', 'dev/index.html']) {
  assert.ok(pages.includes(path.join(root, entry)), entry + ' 入口缺失');
}
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /data-theme-toggle/, '每个学习页面应能切换阅读主题');
  assert.match(html, /src="[^"]*assets\/theme.js"/, '应在页面头部预先应用阅读主题');
  assert.match(html, /aria-label="学习系统导航"/, path.relative(root, file) + ' 缺少跨目录导航');
  assert.doesNotMatch(html, /乐学堂|小学版|(?:href|src)="[^"]*\/primary(?:-system)?\//, '独立系统不应有其他系统的入口');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(?:https?:|data:|#)/.test(url)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(url.split(/[?#]/)[0]));
    assert.ok(target === root || target.startsWith(root + path.sep), url + ' 越出了系统目录');
    assert.ok(fs.existsSync(target), path.relative(root, file) + ' → ' + url + ' 不存在');
    links++;
  }
}
const ai = fs.readFileSync(path.join(root, 'ai/index.html'), 'utf8');
assert.match(ai, /AI 学习 · 基础篇/);
assert.match(ai, /src="ai-data.js"/);
assert.match(ai, /src="ai-app.js"/);
const dev = fs.readFileSync(path.join(root, 'dev/index.html'), 'utf8');
assert.match(dev, /开发命令 · 个人学习/);
assert.match(dev, /src="dev-data.js"/);
assert.match(dev, /src="dev-app.js"/);
console.log('✅ ' + pages.length + ' 个页面、' + links + ' 个内部链接与资源通过检查，可独立拷走运行');
