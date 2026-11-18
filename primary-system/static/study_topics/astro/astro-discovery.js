/* 独立计算与存档校验也供 Node 回归测试使用。 */
(() => {
  'use strict';
  const travelSeconds = (km, legs) => km / 299792.458 * legs;
  function duration(seconds) {
    if (seconds < 60) return `约 ${seconds.toFixed(1)} 秒`;
    const minutes = Math.round(seconds / 60);
    return minutes < 60 ? `约 ${minutes} 分钟` : `约 ${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟`;
  }
  function cleanProgress(raw, questions) {
    const clean = {};
    if (!raw || typeof raw !== 'object') return clean;
    questions.forEach(q => {
      const r=raw[q.id];
      if(r && [r.first,r.last].every(n=>Number.isInteger(n)&&n>=0&&n<q.options.length)) clean[q.id]={first:r.first,last:r.last};
    });
    return clean;
  }
  if (typeof module !== 'undefined') { module.exports={travelSeconds,duration,cleanProgress}; return; }
  const data=ASTRO_DISCOVERY, base=new URL('.',document.currentScript.src);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key='astro_discovery_v1';
  function render() {
    return `<section class="discovery-section" id="roam-address" aria-labelledby="address-title"><h2 id="address-title">我的宇宙地址</h2><p>${esc(data.scaleNote)}</p><div class="discovery-stops" role="group" aria-label="选择宇宙尺度">${data.scales.map((s,i)=>`<button type="button" data-scale="${i}" aria-pressed="${i===0}">${esc(s.name)}</button>`).join('')}</div><div class="discovery-address"></div><label class="discovery-slider">把视野拉远 <input type="range" min="0" max="4" step="1" value="0" aria-label="宇宙地址尺度" data-scale-slider></label></section>
    <section class="discovery-section" id="roam-light" aria-labelledby="light-title"><h2 id="light-title">光也需要旅行时间</h2><p>${esc(data.lightNote)}</p><div class="discovery-inputs"><div class="inline-choice" data-inline-choice><label>选择路线 <select data-light-target aria-label="光旅行路线">${data.targets.map((t,i)=>`<option value="${i}">${esc(t.from)} → ${esc(t.to)}</option>`).join('')}</select></label></div><label>传播方式 <select data-light-legs aria-label="传播方式"><option value="1">单程</option><option value="2">立即返回的往返</option></select></label></div><div class="discovery-light-result" aria-live="polite"></div></section>
    `;
  }
  function renderChallenges() {
    return `<section class="discovery-section" id="roam-challenges" aria-labelledby="challenge-title"><h2 id="challenge-title">宇宙观察挑战</h2><p>先看图和实验，再选一个答案。可以回去观察、修改答案；首次答对和订正后的结果分开记录。</p><p class="discovery-progress" role="status"></p><div class="discovery-questions">${data.challenges.map((q,i)=>`<fieldset data-question="${esc(q.id)}"><legend>${i+1}．${esc(q.question)}</legend><div class="discovery-options">${q.options.map((s,n)=>`<button type="button" data-answer="${n}" aria-pressed="false">${esc(s)}</button>`).join('')}</div><p class="discovery-feedback" aria-live="polite"></p><a href="${esc(q.link)}">回到图文找线索 ↑</a></fieldset>`).join('')}</div></section>`;
  }
  function mount(root) {
    let progress={},persist=true;
    try { progress=cleanProgress(JSON.parse(localStorage.getItem(key)),data.challenges); } catch(e) { /* 损坏或被禁用的存储不妨碍练习。 */ }
    const address=root.querySelector('.discovery-address');
    function scale(index) {
      const s=data.scales[index];
      address.innerHTML=`<figure><img src="${esc(new URL(s.image,base).href)}" alt="${esc(s.name+'：'+s.kind)}" width="1000" height="650"><figcaption>${esc(s.kind)}</figcaption></figure><div><p class="discovery-address-path">${esc(s.address)}</p><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p><a href="${esc(s.link)}">${esc(s.linkLabel)} →</a></div>`;
      root.querySelectorAll('[data-scale]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.scale)===index)));
      const slider=root.querySelector('[data-scale-slider]');slider.value=index;slider.setAttribute('aria-valuetext',s.name);
    }
    function light() {
      const t=data.targets[Number(root.querySelector('[data-light-target]').value)], legs=Number(root.querySelector('[data-light-legs]').value);
      const seconds=travelSeconds(t.km,legs);
      root.querySelector('.discovery-light-result').innerHTML=`<p class="discovery-signal">${esc(t.from)} <span aria-hidden="true">${legs===1?'→':'⇄'}</span> ${esc(t.to)} · ${legs===1?'单程':'往返'}</p><output>${duration(seconds)}</output><p>单程距离约 ${Math.round(t.km).toLocaleString('zh-CN')} 千米${legs===2?'；往返路程是单程的两倍':''}。</p><p>${esc(t.note)}</p><a href="${esc(t.source)}" target="_blank" rel="noopener noreferrer">NASA 距离资料（需联网）↗</a>`;
    }
    function updateQuestion(q) {
      const field=root.querySelector(`[data-question="${q.id}"]`),r=progress[q.id];
      field.querySelectorAll('[data-answer]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.answer)===r?.last)));
      field.querySelector('.discovery-feedback').textContent=r ? `${r.last===q.answer?'答对了。':'再观察一下。'}${q.explanation}` : '';
      field.dataset.result=r?(r.last===q.answer?'correct':'retry'):'';
    }
    function summary() {
      const attempted=data.challenges.filter(q=>progress[q.id]);
      const first=attempted.filter(q=>progress[q.id].first===q.answer).length;
      const correct=attempted.filter(q=>progress[q.id].last===q.answer).length;
      root.querySelector('.discovery-progress').textContent=`已尝试 ${attempted.length}／${data.challenges.length} 题 · 首次答对 ${first} 题 · 当前答对 ${correct} 题。${persist?'记录仅保存在当前浏览器。':'浏览器暂时不能保存，当前页面仍可继续练习。'}`;
    }
    function click(e) {
      const stop=e.target.closest('[data-scale]');
      if(stop) scale(Number(stop.dataset.scale));
      const button=e.target.closest('[data-answer]');
      if(button) {
        const q=data.challenges.find(q=>q.id===button.closest('[data-question]').dataset.question);
        const answer=Number(button.dataset.answer);
        progress[q.id]={first:progress[q.id]?.first ?? answer,last:answer};
        try { localStorage.setItem(key,JSON.stringify(progress)); } catch(e) {persist=false;}
        updateQuestion(q);summary();
      }
    }
    function input(e) {if(e.target.matches('[data-scale-slider]'))scale(Number(e.target.value));}
    function change(e) {if(e.target.matches('[data-light-target],[data-light-legs]'))light();}
    root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);
    scale(0);light();data.challenges.forEach(updateQuestion);summary();
    return ()=>{root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);};
  }
  window.AstroDiscovery={render,renderChallenges,mount};
})();
