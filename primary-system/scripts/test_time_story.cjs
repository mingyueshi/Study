const assert = require('node:assert/strict');
const test = require('node:test');
const {era} = require('../content_sources/time-story.json');
const {leapResult, zoneResult, eraResult} = require('../static/study_topics/time-story.js');

test('闰日按格里历规则判断，拒绝零年、空值和小数', () => {
  for (const year of [1900, 2001, 2100]) assert.match(leapResult(year), /平年，二月有 28 天/);
  for (const year of [2000, 2024]) assert.match(leapResult(year), /闰年，二月有 29 天/);
  for (const year of [NaN, 0, -1, 1.5, 10000]) assert.match(leapResult(year), /请输入/);
});

test('同一瞬间可以同日、跨日甚至相差两个日历日', () => {
  assert.match(zoneResult('06:00', 480, 330), /03:30（同一天）。从出发地钟面减去 2 小时 30 分钟/);
  assert.match(zoneResult('00:15', 480, 0), /16:15（提前 1 天）/);
  assert.match(zoneResult('20:00', 0, 480), /04:00（推后 1 天）/);
  assert.match(zoneResult('23:30', -720, 840), /01:30（推后 2 天）/);
  assert.match(zoneResult('00:00', 840, -720), /22:00（提前 2 天）/);
  assert.match(zoneResult('12:00', 330, 330), /12:00（同一天）。两地偏移相同/);
  for (const invalid of ['', '24:00', '12:65']) assert.match(zoneResult(invalid, 0, 0), /请输入/);
});

test('年号整年双向对照不越界，公元前世纪按时间先后排列', () => {
  assert.match(eraResult('reign', 1, era), /贞观元年.*公元 627 年/s);
  assert.match(eraResult('reign', 23, era), /公元 649 年/);
  assert.match(eraResult('ce', 636, era), /贞观10年/);
  assert.doesNotMatch(eraResult('ce', 650, era), /贞观/);
  assert.match(eraResult('ce', 2000, era), /公元 20 世纪/);
  assert.match(eraResult('ce', 2001, era), /公元 21 世纪/);
  assert.match(eraResult('bce', 100, era), /公元前 1 世纪（公元前 100 年至前 1 年）/);
  assert.match(eraResult('bce', 101, era), /公元前 2 世纪/);
  assert.match(eraResult('reign', 24, era), /请输入 1 至 23/);
  for (const year of [NaN, 0, -1, 1.5, 10000]) assert.match(eraResult('ce', year, era), /请输入/);
});
