// Only execute the repository's trusted static data modules. Not an upload endpoint.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../primary');
const target = path.resolve(process.argv[2] || path.join(__dirname, '../data/primary.json'));
const names = ['knowledge', 'math', 'english', 'words', 'idioms', 'writing', 'geo', 'astro', 'history', 'lit', 'sci'];
const modules = names.map(code => {
  const file = path.join(root, `${code}-data.js`);
  return {code, source_file: `primary/${code}-data.js`, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), data: require(file)};
});
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, JSON.stringify({schema_version: 1, modules}, null, 2) + '\n');
console.log(`已导出 ${modules.length} 个内容模块：${target}`);
