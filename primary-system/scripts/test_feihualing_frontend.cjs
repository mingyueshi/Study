/* Isolated exercise regressions: node --test scripts/test_feihualing_frontend.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function node() {
  const classes=new Set();
  return {textContent:'',innerHTML:'',value:'',hidden:false,disabled:false,dataset:{},handlers:{},
    classList:{toggle(name,value){if(value)classes.add(name);else classes.delete(name);},contains(name){return classes.has(name);}},
    addEventListener(name,fn){this.handlers[name]=fn;},setAttribute(name,value){this[name]=value;},
    focus(){this.focused=true;},scrollIntoView(){},querySelector(){return node();},
  };
}
const base=()=>({available:true,token:'signed-0',nonce:'nonce-0',keyword:'月',keywords:[{char:'月',count:10,enabled:true},{char:'花',count:11,enabled:true}],history:[],count:0,target:5,independent:0,learning:0,status:'playing',hint:null,poem_count:28,corpus_version:'v1',outcome:'ready'});
const entry=(mode='independent')=>({text:'床前明月光',title:'静夜思',author:'李白',url:'/poetry/42/',mode,label:mode==='learning'?'提示学习':'独立作答'});
const accepted=()=>({...base(),token:'signed-1',count:1,independent:1,history:[entry()],outcome:'accepted',message:'接住这句诗了'});
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
function page(fetch,initial=base()) {
  const elements={},calls=[];
  const get=id=>elements[id]||(elements[id]=node());
  get('feihualing-state').textContent=JSON.stringify(initial);
  get('feihualing').dataset.api='/poetry/feihualing/api/action/';
  get('fh-form').requestSubmit=()=>get('fh-form').handlers.submit({preventDefault(){}});
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../static/poetry/feihualing.js'),'utf8'),{
    document:{getElementById:get,cookie:'primary_csrftoken=csrf-value'},
    fetch:async(...args)=>{calls.push(args);return fetch(...args);},
  });
  const click=id=>get('fh-'+id).handlers.click();
  return {get:id=>get('fh-'+id),calls,click,
    submit(text){if(text!==undefined)get('fh-answer').value=text;get('fh-form').handlers.submit({preventDefault(){}});},
    choose(keyword){get('fh-keywords').handlers.click({target:{closest:()=>({dataset:{keyword},disabled:false})}});},
  };
}
const settle=()=>new Promise(setImmediate);

test('a successful answer sends CSRF and the signed token, updates the poem list and clears input',async()=>{
  const p=page(async()=>response(accepted()));p.submit('床前明月光');await settle();
  const [url,request]=p.calls[0];
  assert.equal(url,'/poetry/feihualing/api/action/');
  assert.equal(request.headers['X-CSRFToken'],'csrf-value');
  assert.deepEqual(JSON.parse(request.body),{action:'answer',token:'signed-0',answer:'床前明月光'});
  assert.equal(p.get('answer').value,'');assert.equal(p.get('count').textContent,'1 / 5');
  assert.match(p.get('history').innerHTML,/床前明<mark>月<\/mark>光/);
  assert.match(p.get('history').innerHTML,/noopener noreferrer/);
});

test('unknown answers and network failure preserve input and the current round; retry is explicit',async()=>{
  let fail=false;
  const p=page(async()=>{if(fail)throw new Error('offline');return response({...base(),outcome:'unknown',message:'暂未收录'});});
  p.submit('月光照着书');await settle();assert.equal(p.get('answer').value,'月光照着书');
  assert.match(p.get('feedback').textContent,/暂未收录/);
  fail=true;p.submit();await settle();
  assert.equal(p.get('count').textContent,'0 / 5');assert.equal(p.get('answer').value,'月光照着书');
  assert.match(p.get('feedback').textContent,/不会自动重发/);assert.equal(p.calls.length,2);
  assert.equal(p.get('submit').disabled,false);
});

test('only one request can run; changing keyword while it is pending cannot overwrite the round',async()=>{
  let resolve;
  const p=page(()=>new Promise(done=>{resolve=done;}));
  p.submit('床前明月光');p.submit('举头望明月');p.choose('花');
  assert.equal(p.calls.length,1);assert.equal(p.get('answer').readOnly,true);
  resolve(response(accepted()));await settle();
  assert.equal(p.get('keyword').textContent,'月');assert.equal(p.get('count').textContent,'1 / 5');
});

test('IME Enter is left to native candidate confirmation; ordinary Enter submits and Shift Enter does not',async()=>{
  const p=page(async()=>response(accepted()));p.get('answer').value='床前明月光';
  let prevented=0;
  p.get('answer').handlers.compositionstart();
  p.get('answer').handlers.keydown({key:'Enter',preventDefault(){prevented++;}});
  p.submit();assert.equal(prevented,0);assert.equal(p.calls.length,0);
  p.get('answer').handlers.compositionend();
  p.get('answer').handlers.keydown({key:'Enter',isComposing:true,preventDefault(){prevented++;}});
  p.get('answer').handlers.keydown({key:'Enter',keyCode:229,preventDefault(){prevented++;}});
  assert.equal(prevented,0);assert.equal(p.calls.length,0);
  p.get('answer').handlers.keydown({key:'Enter',shiftKey:true,preventDefault(){prevented++;}});
  assert.equal(prevented,0);
  p.get('answer').handlers.keydown({key:'Enter',shiftKey:false,preventDefault(){prevented++;}});
  await settle();assert.equal(prevented,1);assert.equal(p.calls.length,1);
});

test('the first unfinished input and any completed answer require inline confirmation before changing keyword',async()=>{
  const p=page(async()=>response({...base(),keyword:'花',nonce:'new-nonce'}));
  p.get('answer').value='还没写完的诗句';p.choose('花');
  assert.equal(p.calls.length,0);assert.equal(p.get('confirm').hidden,false);
  p.click('confirm-no');assert.equal(p.get('answer').value,'还没写完的诗句');assert.equal(p.calls.length,0);
  p.choose('花');p.click('confirm-yes');await settle();
  assert.equal(JSON.parse(p.calls[0][1].body).keyword,'花');assert.equal(p.get('answer').value,'');assert.equal(p.get('keyword').textContent,'花');
  const progressed=page(async()=>response(base()),accepted());progressed.choose('花');assert.equal(progressed.calls.length,0);assert.equal(progressed.get('confirm').hidden,false);
});

test('hint and reveal remain separate and revealed poems are labelled as hint learning',async()=>{
  const p=page(async(url,request)=>{
    const data=JSON.parse(request.body);
    if(data.action==='hint')return response({...base(),token:'hint-token',hint:{title:'静夜思',author:'李白',masked:'床□□月□'},outcome:'hint'});
    return response({...base(),token:'revealed',count:1,learning:1,history:[entry('learning')],outcome:'revealed'});
  });
  p.click('hint-button');await settle();assert.equal(p.get('hint').hidden,false);assert.equal(p.get('count').textContent,'0 / 5');
  assert.equal(p.get('masked').textContent,'床□□月□');
  p.click('reveal');await settle();assert.match(p.get('history').innerHTML,/提示学习/);assert.equal(p.get('hint').hidden,true);
});

test('five answers show separate completion counts and allow an explicit fresh round',async()=>{
  const initial={...base(),count:5,independent:4,learning:1,status:'completed',history:[entry(),entry(),entry(),entry(),entry('learning')]};
  const p=page(async()=>response({...base(),nonce:'new'}),initial);
  assert.equal(p.get('form').hidden,true);assert.equal(p.get('complete').hidden,false);
  assert.match(p.get('complete-copy').textContent,/独立作答 4 次，提示学习 1 次/);
  p.click('again');await settle();assert.equal(p.calls.length,1);assert.equal(p.get('form').hidden,false);assert.equal(p.get('count').textContent,'0 / 5');
});

test('expired state stops submissions, leaves old poems visible, and permits an explicit new round',async()=>{
  const p=page(async(url,request)=>JSON.parse(request.body).action==='new'?response(base()):response({error:'已过期',restart_required:true},409),accepted());
  p.submit('举头望明月');await settle();
  assert.equal(p.get('form').hidden,true);assert.match(p.get('history').innerHTML,/床前/);assert.equal(p.get('answer').value,'举头望明月');
  p.click('reset');p.click('confirm-yes');await settle();assert.equal(p.get('form').hidden,false);
});

test('malformed responses and CSRF errors retain input, while unavailable pages disable practice',async()=>{
  for(const reply of [response({bad:true}),response(null,403)]){
    const p=page(async()=>reply);p.submit('床前明月光');await settle();assert.equal(p.get('answer').value,'床前明月光');assert.equal(p.get('count').textContent,'0 / 5');assert.ok(p.get('feedback').textContent);
  }
  const p=page(async()=>response(base()),{available:false,message:'正在准备',keywords:[]});
  assert.equal(p.get('form').hidden,true);assert.equal(p.get('unavailable').hidden,false);assert.equal(p.get('submit').disabled,true);
});

test('poem text and metadata are escaped instead of being interpreted as HTML',async()=>{
  const data=accepted();data.history[0]={...entry(),text:'<img src=x>月',title:'<script>x</script>'};
  const p=page(async()=>response(data));p.submit('床前明月光');await settle();
  assert.match(p.get('history').innerHTML,/&lt;img/);assert.match(p.get('history').innerHTML,/&lt;script/);assert.doesNotMatch(p.get('history').innerHTML,/<script>/);
});
