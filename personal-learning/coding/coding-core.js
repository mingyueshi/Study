/* 课程路由、检索、独立记录与无需依赖的 ZIP 材料打包。 */
(function (root) {
 'use strict';
 const key = 'personal_coding_v1';
 const lessons = data => data.tracks.flatMap(track => track.lessons.map(lesson => ({ ...lesson, track })));
 function route(hash, data) {
  if (hash === '#projects') return { view: 'projects' };
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const lesson = lessons(data).find(item => item.id === params.get('lesson'));
  if (lesson) return { view: 'lesson', lesson, track: lesson.track };
  const project = data.projects.find(item => item.id === params.get('project'));
  if (project) return { view: 'project', project };
  const track = data.tracks.find(item => item.id === params.get('track'));
  return track ? { view: 'track', track } : { view: 'home' };
 }
 function matches(item, query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const value = [item.title, item.summary, item.track.name, ...item.body, ...item.blocks.flatMap(block => block.lines)].join(' ').toLowerCase();
  return words.every(word => value.includes(word));
 }
 function normalize(raw, data) {
  const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const state = { completed: {}, answers: {}, notes: {}, lastLesson: null };
  const all = lessons(data);
  for (const item of [...all, ...data.projects]) {
   if (value.completed?.[item.id] === true) state.completed[item.id] = true;
   if (typeof value.notes?.[item.id] === 'string') state.notes[item.id] = value.notes[item.id].slice(0, 2000);
  }
  for (const item of all) {
   const answer = value.answers?.[item.id];
   if (Number.isInteger(answer) && answer >= 0 && answer < item.quiz.options.length) state.answers[item.id] = answer;
  }
  if (all.some(item => item.id === value.lastLesson)) state.lastLesson = value.lastLesson;
  return state;
 }
 const crcTable = Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
 });
 function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
 }
 function zip(files) {
  const encoder = new TextEncoder(), seen = new Set(), local = [], central = [];
  let offset = 0, centralSize = 0;
  for (const file of files) {
   if (!/^[a-zA-Z0-9_][a-zA-Z0-9_./-]*$/.test(file.path) || file.path.split('/').includes('..') || file.path.endsWith('/')) throw new Error('项目材料路径不正确');
   if (seen.has(file.path)) throw new Error('项目材料路径重复');
   seen.add(file.path);
   const name = encoder.encode(file.path), bytes = encoder.encode(file.lines.length ? file.lines.join('\n') + '\n' : '');
   const crc = crc32(bytes), header = new Uint8Array(30 + name.length), view = new DataView(header.buffer);
   view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(6, 0x800, true); view.setUint16(12, 33, true);
   view.setUint32(14, crc, true); view.setUint32(18, bytes.length, true); view.setUint32(22, bytes.length, true); view.setUint16(26, name.length, true); header.set(name, 30);
   const record = new Uint8Array(46 + name.length), recordView = new DataView(record.buffer);
   recordView.setUint32(0, 0x02014b50, true); recordView.setUint16(4, 20, true); recordView.setUint16(6, 20, true); recordView.setUint16(8, 0x800, true); recordView.setUint16(14, 33, true);
   recordView.setUint32(16, crc, true); recordView.setUint32(20, bytes.length, true); recordView.setUint32(24, bytes.length, true); recordView.setUint16(28, name.length, true); recordView.setUint32(42, offset, true); record.set(name, 46);
   local.push(header, bytes); central.push(record); offset += header.length + bytes.length; centralSize += record.length;
  }
  const end = new Uint8Array(22), endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true); endView.setUint32(12, centralSize, true); endView.setUint32(16, offset, true);
  const result = new Uint8Array(offset + centralSize + end.length); let position = 0;
  for (const chunk of [...local, ...central, end]) { result.set(chunk, position); position += chunk.length; }
  return result;
 }
 const api = { key, lessons, route, matches, normalize, zip };
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 else root.CodingCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
