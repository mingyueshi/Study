'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const DEV_TOOLS = require('../dev-data.js');
const DevState = require('../dev-state.js');
const DevCore = require('../dev-core.js');

/* 存储键必须独立，不能与其他学习方向串档案。 */
assert.notEqual(DevState.key, 'techlex_v1');
assert.notEqual(DevState.key, 'personal_ai_v1');

/* 数据字符串用中文标点：不要英文双引号，不要裸换行。 */
function checkText(text, where) {
  assert.equal(typeof text, 'string', where + ' 应是字符串');
  assert.ok(!text.includes('"'), where + ' 含英文双引号：' + text);
  assert.ok(!text.includes('\n'), where + ' 含裸换行：' + text);
}
assert.match(DEV_TOOLS.updatedAt, /^\d{4}-\d{2}-\d{2}$/, 'updatedAt 应是日期');
assert.ok(DEV_TOOLS.tools.length >= 9, '至少九个工具组');

const toolIds = new Set();
const groupIds = new Set();
const commandIds = new Set();
let commandCount = 0;
for (const tool of DEV_TOOLS.tools) {
  assert.ok(!toolIds.has(tool.id), '工具 id 重复：' + tool.id);
  toolIds.add(tool.id);
  checkText(tool.name, tool.id + '.name');
  checkText(tool.tagline, tool.id + '.tagline');
  checkText(tool.platform, tool.id + '.platform');
  assert.ok(tool.platform.trim(), tool.id + ' 应说明适用环境');
  assert.ok(Array.isArray(tool.references) && tool.references.length, tool.id + ' 应提供官方参考资料');
  for (const reference of tool.references) {
    checkText(reference.name, tool.id + '.reference.name');
    assert.ok(reference.name.trim(), tool.id + ' 参考资料应有名称');
    assert.equal(new URL(reference.url).protocol, 'https:', tool.id + ' 参考资料应使用 HTTPS');
  }
  if (tool.learning) {
    checkText(tool.learning.label, tool.id + '.learning.label');
    assert.ok(tool.learning.label.trim());
    checkText(tool.learning.href, tool.id + '.learning.href');
    const [file, hash] = tool.learning.href.split('#');
    const root = path.resolve(__dirname, '../..');
    const target = path.resolve(__dirname, '..', file);
    assert.ok(target.startsWith(root + path.sep) && fs.existsSync(target), '学习关联应在个人学习系统内');
    const track = new URLSearchParams(hash).get('track');
    assert.ok(require('../../coding/coding-data.js').tracks.some(item => item.id === track), '关联的学习路线应存在');
  }
  assert.match(tool.emoji, /^\p{Extended_Pictographic}/u, tool.id + ' 应有 emoji 图标');
  assert.ok(tool.groups.length >= 2, tool.id + ' 至少两个分组');
  for (const group of tool.groups) {
    assert.ok(!groupIds.has(group.id), '分组 id 重复：' + group.id);
    groupIds.add(group.id);
    checkText(group.name, group.id + '.name');
    assert.ok(group.commands.length >= 3, group.id + ' 每组至少三条命令');
    for (const command of group.commands) {
      assert.ok(!commandIds.has(command.id), '命令 id 重复：' + command.id);
      commandIds.add(command.id);
      commandCount++;
      checkText(command.cmd, command.id + '.cmd');
      checkText(command.desc, command.id + '.desc');
      assert.ok(command.cmd.length >= 1 && !command.cmd.includes('\n'), command.id + '.cmd 不能为空');
      assert.ok(command.cmd.length <= 80, command.id + '.cmd 过长');
      assert.ok(command.desc.length >= 4, command.id + '.desc 太短');
      assert.match(command.desc, /[\u4e00-\u9fff]/, command.id + '.desc 应是中文说明');
      if (command.example !== undefined) checkText(command.example, command.id + '.example');
      if (command.note !== undefined) checkText(command.note, command.id + '.note');
    }
  }
}
assert.ok(commandCount >= 200, '命令数量应不少于 200 条，当前 ' + commandCount + ' 条');
assert.ok(toolIds.has('nano'), '命令行编辑器应包含 nano');
assert.ok(toolIds.has('django'), '应提供 Django 命令');
const django = DEV_TOOLS.tools.find(tool => tool.id === 'django');
assert.ok(django.learning, 'Django 命令应关联学习路线');
assert.ok(django.groups.length >= 6, '覆盖初始化、启动、迁移、测试、数据和发布');
const djangoCommands = django.groups.flatMap(group => group.commands);
assert.ok(djangoCommands.length >= 30);
assert.ok(djangoCommands.some(command => command.cmd === 'python manage.py migrate --plan'));
assert.ok(djangoCommands.some(command => command.cmd === 'python manage.py makemigrations --check --dry-run'));

/* normalize：脏数据一律丢弃，只保留已知 id。 */
const empty = DevState.normalize(null, DEV_TOOLS);
assert.deepEqual(empty, { mastered: {}, lastTool: null });
const firstCommand = DEV_TOOLS.tools[0].groups[0].commands[0].id;
const lastTool = DEV_TOOLS.tools[DEV_TOOLS.tools.length - 1].id;
const dirty = DevState.normalize({
  mastered: { [firstCommand]: true, 'unknown-cmd': true },
  lastTool: 'no-such-tool',
  extra: 1
}, DEV_TOOLS);
assert.deepEqual(dirty, { mastered: { [firstCommand]: true }, lastTool: null });
const kept = DevState.normalize({ mastered: { [firstCommand]: true, [lastTool]: false }, lastTool }, DEV_TOOLS);
assert.deepEqual(kept, { mastered: { [firstCommand]: true }, lastTool });
assert.deepEqual(DevState.normalize([], DEV_TOOLS), { mastered: {}, lastTool: null });
assert.deepEqual(DevState.normalize({ mastered: { 'git-status': true, 'django-check': true }, lastTool: 'django' }, DEV_TOOLS), { mastered: { 'git-status': true, 'django-check': true }, lastTool: 'django' }, '新分类应与已有命令共用兼容档案');

/* 旧链接兼容，分组和单条命令只能定位到所属工具。 */
assert.equal(DevCore.route('#tool=git', DEV_TOOLS).tool.id, 'git');
assert.equal(DevCore.route('#tool=git&group=git-stage', DEV_TOOLS).group.id, 'git-stage');
assert.equal(DevCore.route('#tool=git&command=git-restore-staged', DEV_TOOLS).command.id, 'git-restore-staged');
assert.equal(DevCore.route('#tool=git&command=npm-ci', DEV_TOOLS).command, null);
assert.equal(DevCore.route('#tool=git&group=linux-service', DEV_TOOLS).group, null);
assert.equal(DevCore.route('#tool=unknown', DEV_TOOLS).tool, null);
assert.equal(DevCore.route('#tool=django&command=django-migrate-plan', DEV_TOOLS).command.id, 'django-migrate-plan');

/* 多个词可跨命令、说明与分组匹配，查询范围与掌握状态叠加。 */
const options = { toolId: 'git', query: 'npm 锁文件', scope: 'all', mastery: 'all', mastered: {} };
const idsOf = sections => sections.flatMap(section => section.groups.flatMap(group => group.commands.map(command => command.id)));
assert.ok(idsOf(DevCore.select(DEV_TOOLS, options)).includes('npm-ci'));
assert.deepEqual(DevCore.select(DEV_TOOLS, { ...options, scope: 'current' }), []);
assert.ok(idsOf(DevCore.select(DEV_TOOLS, { ...options, query: '取消 暂存' })).includes('git-restore-staged'));
assert.deepEqual(idsOf(DevCore.select(DEV_TOOLS, { ...options, query: '', mastery: 'mastered', mastered: { 'git-status': true, 'npm-ci': true } })), ['git-status']);
assert.ok(!idsOf(DevCore.select(DEV_TOOLS, { ...options, query: '', mastery: 'unmastered', mastered: { 'git-status': true } })).includes('git-status'));
assert.deepEqual(DevCore.select(DEV_TOOLS, { ...options, query: '<不存在的命令>' }), []);

require('./test-command-safety.js');

console.log('✅ ' + DEV_TOOLS.tools.length + ' 个工具、' + commandCount + ' 条命令，结构与掌握记录校验通过');
