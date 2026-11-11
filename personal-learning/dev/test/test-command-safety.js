'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const data = require('../dev-data.js');
const commands = data.tools.flatMap(tool => tool.groups.flatMap(group => group.commands));
const xargs = commands.find(command => command.id === 'sh-xargs');
const remove = commands.find(command => command.id === 'sh-rm');

// 对所有发布的路径管道检查两端分隔规则，避免旧示例再次混进来。
for (const command of commands) {
  for (const sample of [command.cmd, command.example || '']) {
    if (!/\bfind\b[^|]*\|\s*xargs\b/.test(sample)) continue;
    assert.match(sample, /\s-print0(?:\s|$)/, command.id + '：find 应输出 NUL 分隔的路径');
    assert.match(sample, /\|\s*xargs\s+-0(?:\s|$)/, command.id + '：xargs 应以 NUL 分隔读取路径');
  }
}
assert.doesNotMatch(xargs.example, /\brm\b/, 'xargs 的可复制示例只用于列举');
assert.doesNotMatch(remove.example, /\s-[a-z]*[rf]/, '单文件删除示例不应默认递归或强制删除');

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'study-command-safety-'));
try {
  const probeDir = path.join(sandbox, 'argv-probe');
  const fixtures = path.join(sandbox, 'fixtures');
  const log = path.join(sandbox, 'arguments.jsonl');
  fs.mkdirSync(probeDir);
  fs.mkdirSync(fixtures);
  // 只替换列举命令，记录真正到达子进程的参数，而不是按打印的行数猜路径。
  const probe = path.join(probeDir, 'capture.js');
  fs.writeFileSync(probe, "require('node:fs').appendFileSync(process.env.STUDY_ARGV_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');\n");
  const quote = value => "'" + value.replace(/'/g, "'\\''") + "'";
  fs.writeFileSync(path.join(probeDir, 'ls'), '#!/bin/sh\nexec ' + quote(process.execPath) + ' ' + quote(probe) + ' "$@"\n', { mode: 0o700 });
  const targets = [
    'plain.tmp', 'space name.tmp', 'tab\tname.tmp', 'line\nbreak.tmp',
    "single'quote.tmp", 'double"quote.tmp', 'back\\slash.tmp',
    '--option.tmp', '中文 文件.tmp', 'folder with spaces/nested.tmp'
  ];
  const keepers = ['space', 'tab', 'line', 'ordinary.txt', 'skip.tmp/keep.txt'];
  for (const name of [...targets, ...keepers]) {
    const file = path.join(fixtures, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, name);
  }
  fs.symlinkSync('ordinary.txt', path.join(fixtures, 'link.tmp'));
  const env = { ...process.env, PATH: probeDir + path.delimiter + process.env.PATH, STUDY_ARGV_LOG: log };
  function run(sample, cwd, input, childEnv = env) {
    const result = spawnSync('/bin/sh', ['-c', sample], { cwd, env: childEnv, input, encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr || '示例运行失败');
  }
  function argumentsFromPreview() {
    if (!fs.existsSync(log)) return [];
    return fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).flatMap(line => {
      const args = JSON.parse(line);
      assert.equal(args.shift(), '-ld', '预览应只列举选中的路径');
      return args;
    });
  }

  // 执行页面里的真实示例：空白、引号和反斜杠都必须留在同一个路径参数内。
  run(xargs.example, fixtures);
  assert.deepEqual(argumentsFromPreview().sort(), targets.map(name => './' + name).sort());
  for (const name of [...targets, ...keepers]) {
    assert.equal(fs.readFileSync(path.join(fixtures, name), 'utf8'), name, '预览不应修改文件：' + name);
  }
  assert.ok(fs.lstatSync(path.join(fixtures, 'link.tmp')).isSymbolicLink());
  const empty = path.join(sandbox, 'no-matches');
  fs.mkdirSync(empty);
  fs.writeFileSync(path.join(empty, 'keep.txt'), '保留');
  fs.writeFileSync(log, '');
  run(xargs.example, empty);
  assert.deepEqual(argumentsFromPreview(), [], '没有匹配文件时不应产生任何路径参数');
  assert.equal(fs.readFileSync(path.join(empty, 'keep.txt'), 'utf8'), '保留');

  // 删除只在本测试刚创建的目录里运行。完整文件名应为一个参数，拒绝确认时保留它。
  const deletion = path.join(sandbox, 'single-delete');
  fs.mkdirSync(deletion);
  for (const name of ['旧 文件.txt', '旧', '文件.txt']) fs.writeFileSync(path.join(deletion, name), name);
  run(remove.example, deletion, 'n\n', process.env);
  assert.ok(fs.existsSync(path.join(deletion, '旧 文件.txt')), '未确认时不能删除');
  run(remove.example, deletion, 'y\n', process.env);
  assert.deepEqual(fs.readdirSync(deletion).sort(), ['旧', '文件.txt'].sort(), '只能删除被完整引用且已确认的路径');
  console.log('✅ 特殊文件名完整传参、只读预览、空结果及单文件删除确认检查通过');
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
