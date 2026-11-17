/* 分步提示与本机练习；没有自动填答案、计时或服务端写入。 */
(() => {
  'use strict';
  const root=document.querySelector('[data-mc-app]'), source=document.getElementById('mc-data'), E=window.MathCamp;
  if(!root || !source || !E)return;
  const data=JSON.parse(source.textContent), drills=data.tracks.flatMap(t=>t.drills), ids=drills.map(d=>d.id);
  const key=`primary-math-camp-progress-v1:${root.dataset.scope}`;
  const note=root.querySelector('[data-mc-storage]');
  const read=()=>{
    try{return {value:E.cleanProgress(JSON.parse(localStorage.getItem(key) || '{}'),ids),ok:true};}
    catch(error){return {value:{},ok:false};}
  };
  let progress=read().value;
  const renderProgress=()=>{
    for(const track of data.tracks) {
      const count=track.drills.filter(d=>progress[d.id]).length;
      root.querySelectorAll(`[data-mc-track-progress="${track.id}"]`).forEach(el=>{el.textContent=`${count} / 3 关已完成`;});
    }
    root.querySelectorAll('[data-mc-completion]').forEach(el=>{
      const state=progress[el.dataset.mcCompletion];
      el.textContent=state==='independent' ? '✓ 自主完成' : state==='assisted' ? '✓ 借助提示完成' : '待探索';
      el.dataset.state=state || '';
    });
    const total=Object.keys(progress).length, independent=Object.values(progress).filter(s=>s==='independent').length;
    const set=(s,v)=>{const el=root.querySelector(s);if(el)el.textContent=v;};
    set('[data-mc-total]',`${total} / ${ids.length}`);set('[data-mc-independent]',independent);set('[data-mc-assisted]',total-independent);
    const meter=root.querySelector('[data-mc-meter]');if(meter)meter.value=total;
  };
  const save=(id,state)=>{
    progress=E.mergeProgress(E.mergeProgress(read().value,progress,ids),{[id]:state},ids);
    try {localStorage.setItem(key,JSON.stringify(progress));note.textContent='完成标记已保存在当前浏览器，清理浏览器数据会清空；不计入积分或账号学习足迹。';}
    catch(error){note.textContent='浏览器暂时无法保存，完成标记仅保留在本页；练习、提示与检查仍可使用。';}
    renderProgress();
  };
  if(!read().ok)note.textContent='浏览器暂时无法读取完成标记，本页仍可正常练习。';
  for(const drill of drills) {
    const section=root.querySelector(`[data-mc-drill="${drill.id}"]`);if(!section)continue;
    const inputs=[...section.querySelectorAll('[data-mc-input]')], feedback=section.querySelector('[data-mc-feedback]');
    const answer=section.querySelector('[data-mc-answer]'), hint=section.querySelector('[data-mc-hint]');
    const raw=()=>inputs.map(el=>el.value);
    let usedHelp=false, hintCount=0;
    const clearErrors=()=>{
      inputs.forEach(el=>{el.removeAttribute('aria-invalid');el.closest('.mc-cell')?.classList.remove('is-conflict');});
      section.querySelectorAll('[data-mc-clue]').forEach(el=>{delete el.dataset.valid;});
      feedback.hidden=true;
      const totals=section.querySelector('[data-mc-totals]');if(totals)totals.hidden=true;
    };
    const showCandidates=()=>{
      if(drill.kind!=='sudoku')return;
      const enabled=section.querySelector('[data-mc-candidates]').checked, candidates=E.candidates(drill.puzzle,raw());
      section.querySelectorAll('[data-mc-candidate]').forEach((el,i)=>{
        const empty=E.integer(inputs[i].value)===null;
        el.hidden=!enabled || !empty;el.textContent=candidates[i].join(' ');
        inputs[i].title=enabled && empty ? `候选数：${candidates[i].join('、') || '无，请核对已填数字'}` : '';
      });
    };
    inputs.forEach(el=>{
      el.disabled=false;
      el.addEventListener(el.tagName==='SELECT' ? 'change' : 'input',()=>{clearErrors();showCandidates();});
      if(el.tagName==='INPUT')el.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();section.querySelector('[data-mc-check]').click();}});
    });
    section.querySelector('[data-mc-candidates]')?.addEventListener('change',event=>{
      if(event.target.checked)usedHelp=true;
      showCandidates();
    });
    hint.addEventListener('click',()=>{
      usedHelp=true;
      const paragraph=document.createElement('p');paragraph.textContent=`${hintCount+1}. ${drill.hints[hintCount++]}`;
      section.querySelector('[data-mc-hint-list]').append(paragraph);
      hint.disabled=hintCount===drill.hints.length;
      hint.textContent=hint.disabled ? '提示已全部展开' : `看第 ${hintCount+1} 步提示`;
    });
    answer.addEventListener('toggle',()=>{if(answer.open)usedHelp=true;});
    section.querySelector('[data-mc-check]').addEventListener('click',()=>{
      clearErrors();
      const result=E.check(drill,raw());
      result.conflicts.forEach(i=>{
        inputs[i].setAttribute('aria-invalid','true');inputs[i].closest('.mc-cell')?.classList.add('is-conflict');
      });
      result.clues.forEach((ok,i)=>{if(ok!==null)section.querySelector(`[data-mc-clue="${i}"]`).dataset.valid=String(ok);});
      const totals=section.querySelector('[data-mc-totals]');
      if(result.totals.length) {
        totals.replaceChildren(...result.totals.map(t=>{
          const el=document.createElement('span');el.textContent=`${t.name}：${t.sum===null ? '未填齐' : t.sum}`;
          if(t.sum!==null)el.dataset.valid=String(t.sum===t.target);return el;
        }));totals.hidden=false;
      }
      feedback.hidden=false;feedback.dataset.correct=String(result.complete);
      if(result.complete) {
        const assisted=usedHelp || answer.open;
        feedback.textContent=assisted ? '全部条件通过！这次借助了候选数、提示或讲解。试着合上帮助，说说自己的方法。' : '全部条件通过！再用自己的话讲讲：哪一步最关键？';
        save(drill.id,assisted ? 'assisted' : 'independent');
      } else if(result.errors.length)feedback.textContent=result.errors.slice(0,3).join(' ')+(result.remaining ? ` 还有 ${result.remaining} 处未填。` : '');
      else if(result.conflicts.length)feedback.textContent='标出的结果还需核对。可以先看下一步提示，再试一次。';
      else feedback.textContent=`还有 ${result.remaining} 处未填。${['sudoku','magic','logic'].includes(drill.kind) ? '目前未发现直接冲突，这还不代表已经完成或一定能完成。' : '填完后再检查。'}`;
    });
    section.querySelector('[data-mc-reset]').addEventListener('click',()=>{
      inputs.forEach(el=>{if(!el.hasAttribute('data-mc-given'))el.value='';});
      clearErrors();showCandidates();feedback.hidden=false;feedback.dataset.correct='false';
      feedback.textContent='已清空本题的填写，完成标记保留。已看过的提示与讲解仍按本次借助帮助处理。';
      inputs.find(el=>!el.hasAttribute('data-mc-given'))?.focus();
    });
  }
  root.querySelectorAll('[data-mc-enhanced]').forEach(el=>{el.hidden=false;});
  renderProgress();
  window.addEventListener('storage',event=>{
    if(event.key===key || event.key===null){
      const latest=read();progress=latest.value;renderProgress();
      if(!latest.ok)note.textContent='浏览器暂时无法读取完成标记，本页仍可正常练习。';
    }
  });
})();
