'use strict';
const assert = require('node:assert/strict');
const DEV_TOOLS = require('../dev-data.js');
const DevState = require('../dev-state.js');

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
assert.ok(DEV_TOOLS.tools.length >= 6, '至少六个工具组');

const toolIds = new Set();
const groupIds = new Set();
const commandIds = new Set();
let commandCount = 0;
for (const tool of DEV_TOOLS.tools) {
  assert.ok(!toolIds.has(tool.id), '工具 id 重复：' + tool.id);
  toolIds.add(tool.id);
  checkText(tool.name, tool.id + '.name');
  checkText(tool.tagline, tool.id + '.tagline');
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
assert.ok(commandCount >= 120, '命令数量应不少于 120 条，当前 ' + commandCount + ' 条');

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

console.log('✅ ' + DEV_TOOLS.tools.length + ' 个工具、' + commandCount + ' 条命令，结构与掌握记录校验通过');
