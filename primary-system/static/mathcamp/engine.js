/* 独立数学规则与本机完成标记。浏览器和 Node 共用，不操作页面。 */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MathCamp = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';
  const integer = value => {
    const s = String(value ?? '').normalize('NFKC').trim();
    return s === '' ? null : /^\d+$/.test(s) && Number.isSafeInteger(Number(s)) ? Number(s) : NaN;
  };
  const units = (n, rows, cols) => [
    ...Array.from({length:n}, (_, r) => ({name:`第 ${r+1} 行`, cells:Array.from({length:n}, (_, c) => r*n+c)})),
    ...Array.from({length:n}, (_, c) => ({name:`第 ${c+1} 列`, cells:Array.from({length:n}, (_, r) => r*n+c)})),
    ...Array.from({length:n/rows}, (_, r) => Array.from({length:n/cols}, (_, c) => ({
      name:`第 ${r*(n/cols)+c+1} 宫`, cells:Array.from({length:rows*cols}, (_, i) => (r*rows+Math.floor(i/cols))*n+c*cols+i%cols),
    }))).flat(),
  ];
  const duplicateCells = (values, cells) => cells.filter(i => values[i] !== null && Number.isFinite(values[i]) && cells.some(j => j !== i && values[j] === values[i]));
  const candidates = (p, raw) => {
    const board = raw.map(integer), groups = units(p.size, p.box_rows, p.box_cols);
    return board.map((value, i) => value !== null ? [] : Array.from({length:p.size}, (_, k) => k+1).filter(k => !groups.some(g => g.cells.includes(i) && g.cells.some(j => board[j] === k))));
  };
  const clueValid = (c, values) => {
    const a = values[c.a], b = ['eq','ne'].includes(c.op) ? c.value : values[c.b];
    if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b)) return null;
    return {eq:a===b, ne:a!==b, before:a<b, next:Math.abs(a-b)===1, apart:Math.abs(a-b)!==1}[c.op];
  };
  const check = (drill, raw) => {
    const p=drill.puzzle, values=raw.map(integer), errors=[], conflicts=new Set();
    const max = drill.kind === 'logic' ? p.labels.length-1 : drill.kind === 'sudoku' ? p.size : drill.kind === 'magic' ? p.size**2 : 100000000;
    const min = drill.kind === 'logic' ? 0 : 1;
    values.forEach((v,i) => { if(v !== null && (!Number.isFinite(v) || v<min || v>max)) conflicts.add(i); });
    if(conflicts.size) errors.push(`请填写 ${min}～${max} 范围内的整数${drill.kind==='logic' ? '选项' : ''}。`);
    const remaining=values.filter(v=>v===null).length;
    let totals=[], clues=[];
    if(drill.kind === 'logic') {
      const duplicates=duplicateCells(values, values.map((_,i)=>i));
      duplicates.forEach(i=>conflicts.add(i));
      if(duplicates.length) errors.push('每个选项只能分配一次。');
      clues=p.constraints.map(c=>clueValid(c,values));
      clues.forEach((ok,i)=>{ if(ok===false) { conflicts.add(p.constraints[i].a); if('b' in p.constraints[i])conflicts.add(p.constraints[i].b); errors.push(`不符合线索：${p.constraints[i].text}`); } });
    } else if(['sudoku','magic'].includes(drill.kind)) {
      p.givens.forEach((g,i)=>{ if(g && values[i]!==g) {conflicts.add(i);errors.push('题设数字不能修改。');} });
      const n=p.size;
      let groups=units(n, p.box_rows || 1, p.box_cols || n);
      if(drill.kind==='magic') {
        const duplicates=duplicateCells(values,values.map((_,i)=>i));
        duplicates.forEach(i=>conflicts.add(i));
        if(duplicates.length)errors.push('幻方的每个数字只能使用一次。');
        groups=groups.slice(0,n*2).concat([
          {name:'左上到右下对角线',cells:Array.from({length:n},(_,i)=>i*n+i)},
          {name:'右上到左下对角线',cells:Array.from({length:n},(_,i)=>i*n+n-1-i)},
        ]);
      }
      for(const g of groups) {
        if(drill.kind==='sudoku') {
          const duplicates=duplicateCells(values,g.cells);
          duplicates.forEach(i=>conflicts.add(i));
          if(duplicates.length)errors.push(`${g.name}有重复数字。`);
        } else {
          const ready=g.cells.every(i=>Number.isFinite(values[i])), sum=ready ? g.cells.reduce((s,i)=>s+values[i],0) : null;
          const target=n*(n*n+1)/2;
          totals.push({name:g.name,sum,target});
          if(ready && sum!==target) {g.cells.forEach(i=>conflicts.add(i));errors.push(`${g.name}的和为 ${sum}，应为 ${target}。`);}
        }
      }
    } else {
      const expected=drill.kind==='sequence' ? p.answer : [p.answer];
      values.forEach((v,i)=>{if(v!==null && v!==expected[i])conflicts.add(i);});
      if(!remaining && conflicts.size)errors.push(drill.kind==='sequence' ? '再按本题约定的模型检查每一步，注意两项的次序。' : '结果还需核对。试着先写出重组后的算式，再算一次。');
    }
    const expectedLength=drill.kind==='logic' ? p.labels.length : ['sudoku','magic'].includes(drill.kind) ? p.size**2 : drill.kind==='sequence' ? 2 : 1;
    if(raw.length!==expectedLength)errors.push('填写项数不正确。');
    return {complete:remaining===0 && conflicts.size===0 && errors.length===0,
      remaining, conflicts:[...conflicts], errors:[...new Set(errors)], totals, clues};
  };
  const cleanProgress = (value, ids) => {
    if(!value || typeof value!=='object' || Array.isArray(value))return {};
    return Object.fromEntries(ids.filter(id=>['independent','assisted'].includes(value[id])).map(id=>[id,value[id]]));
  };
  const mergeProgress = (a,b,ids) => {
    a=cleanProgress(a,ids);b=cleanProgress(b,ids);
    return Object.fromEntries(ids.filter(id=>a[id] || b[id]).map(id=>[id,a[id]==='independent' || b[id]==='independent' ? 'independent' : 'assisted']));
  };
  return {integer,units,candidates,clueValid,check,cleanProgress,mergeProgress};
});
