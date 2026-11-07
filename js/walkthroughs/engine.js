/* Meridian Service Desk: Walkthrough engine: coach panel, highlight ring, auto-advance */
"use strict";
/* ---------- walkthrough engine ---------- */
let TOUR=null,tourTimer=null;
function startTour(id){
  const def=TOURS.find(t=>t.id===id);if(!def)return;
  endTour();
  TOUR={def,i:0,ctx:{since:Date.now()},done:false,back:false,min:false,scrolled:false,hasT:null};
  try{if(def.setup)def.setup(TOUR.ctx)}catch(e){console.error(e)}
  save();document.body.classList.add('touring');$('#coach').hidden=false;
  tourTimer=setInterval(tick,250);enterStep(0,false);
}
function tourSave(){if(TOUR&&!TOUR.finished)store.set(KEY+'-tour',JSON.stringify({id:TOUR.def.id,i:TOUR.i,ctx:TOUR.ctx,min:TOUR.min}));else store.del(KEY+'-tour')}
/* Picks up a walkthrough that was in progress before the page was refreshed. Returns true if it did. */
function resumeTour(){
  let s=null;try{s=JSON.parse(store.get(KEY+'-tour')||'null')}catch(e){}
  const def=s&&TOURS.find(t=>t.id===s.id);if(!def||!(s.i>=0&&s.i<def.steps.length)){store.del(KEY+'-tour');return false}
  TOUR={def,i:s.i,ctx:s.ctx||{since:Date.now()},done:false,back:false,min:!!s.min,scrolled:false,hasT:null};
  document.body.classList.add('touring');$('#coach').hidden=false;tourTimer=setInterval(tick,250);enterStep(s.i,false);
  toast('Walkthrough resumed where you left off');return true;
}
function enterStep(i,back){
  const T=TOUR;T.i=i;T.done=false;T.back=!!back;T.scrolled=false;T.hasT=null;clearTimeout(T.adv);
  const s=T.def.steps[i];try{if(s.enter)s.enter(T.ctx)}catch(e){console.error(e)}
  renderCoach();tourSave();setTimeout(tick,100);
}
function curStep(){return TOUR.def.steps[TOUR.i]}
function tourTarget(s){
  const c=TOUR.ctx;if(s.rec&&!inDrawerAny(c[s.rec]))return null;
  let t=s.target;try{if(typeof t==='function')t=t(c);if(typeof t==='string')t=document.querySelector(t)}catch(e){t=null}
  return t&&t.getClientRects().length?t:null;
}
function tick(){
  if(!TOUR||TOUR.finished)return;
  const s=curStep();const el=tourTarget(s);const ring=$('#tourRing');
  if(el){const r=el.getBoundingClientRect();ring.style.top=(r.top-5)+'px';ring.style.left=(r.left-5)+'px';ring.style.width=(r.width+10)+'px';ring.style.height=(r.height+10)+'px';ring.hidden=false;
    if(!TOUR.scrolled){TOUR.scrolled=true;if(r.top<70||r.bottom>innerHeight-90)el.scrollIntoView({block:'center',behavior:RM?'auto':'smooth'})}}
  else ring.hidden=true;
  let changed=(!!el)!==TOUR.hasT;TOUR.hasT=!!el;
  if(!s.info&&!TOUR.done){let ok=false;try{ok=!!s.done(TOUR.ctx)}catch(e){}
    if(ok){TOUR.done=true;changed=true;if(!TOUR.back){const at=TOUR.i;TOUR.adv=setTimeout(()=>{if(TOUR&&TOUR.done&&TOUR.i===at)nextStep()},1100)}}}
  $('#coach').classList.toggle('left',!$('#drawer').hidden&&innerWidth>860);
  const recNow=s.rec?inDrawerAny(TOUR.ctx[s.rec]):true;if(recNow!==TOUR.recOk){TOUR.recOk=recNow;changed=true}
  if(changed)renderCoach();
}
function nextStep(){if(!TOUR)return;if(TOUR.i>=TOUR.def.steps.length-1){finishTour();return}enterStep(TOUR.i+1,false)}
function prevStep(){if(TOUR&&TOUR.i>0)enterStep(TOUR.i-1,true)}
function showMe(){const s=curStep();if(s.show){try{s.show(TOUR.ctx)}catch(e){console.error(e)}}setTimeout(tick,80)}
function renderCoach(){
  const T=TOUR;if(!T)return;const co=$('#coach');const s=curStep();const n=T.def.steps.length;const c=T.ctx;
  if(T.min){co.classList.add('min');co.innerHTML=`<div class="coach-top"><span class="eyebrow">${esc(T.def.short)} · step ${T.i+1} of ${n}</span><button class="btn" data-tour="max">Show steps</button></div>`;return}
  co.classList.remove('min');
  const body=typeof s.b==='function'?s.b(c):s.b;
  let state='';
  if(!s.info){
    if(T.done)state=`<div class="coach-state ok">✓ Done${T.back?'':' · moving on'}</div>`;
    else if(s.rec&&!inDrawerAny(c[s.rec]))state=`<div class="coach-state"><span class="pd"></span>Open <button class="linkchip" data-open="${c[s.rec]}">${c[s.rec]}</button> to carry on</div>`;
    else state=`<div class="coach-state"><span class="pd"></span>Waiting for you to ${esc(s.wait||'do the highlighted action')}</div>`;
  }
  co.innerHTML=`<div class="coach-top"><span class="eyebrow">${esc(T.def.short)} · step ${T.i+1} of ${n}</span><button class="x" data-tour="min" aria-label="Minimise walkthrough">–</button><button class="x" data-tour="exit" aria-label="Exit walkthrough">×</button></div>
    <div class="coach-prog"><i style="width:${((T.i+(T.done||s.info?1:0))/n*100).toFixed(1)}%"></i></div>
    <h3>${esc(s.t)}</h3><div class="coach-body">${body}</div>${s.why?`<div class="coach-why"><b>Why it matters:</b> ${s.why}</div>`:''}${state}
    <div class="actions"><button class="btn" data-tour="back" ${T.i===0?'disabled':''}>Back</button>${s.show&&!T.done&&!s.info?'<button class="btn" data-tour="show">Do it for me</button>':''}<button class="btn primary" data-tour="next" ${s.info||T.done?'':'disabled'}>${T.i===n-1?'Finish':'Next'}</button></div>`;
}
function finishTour(){
  const T=TOUR;const d=toursDone();if(!d.includes(T.def.id)){d.push(T.def.id);store.set(KEY+'-tours',JSON.stringify(d))}
  T.finished=true;tourSave();clearInterval(tourTimer);$('#tourRing').hidden=true;const co=$('#coach');co.classList.remove('min','left');
  const nextT=TOURS.find(t=>!d.includes(t.id));
  co.innerHTML=`<div class="coach-top"><span class="eyebrow">Walkthrough complete</span><button class="x" data-tour="exit" aria-label="Close">×</button></div><div class="coach-prog"><i style="width:100%"></i></div>
    <h3>${esc(T.def.title)}</h3><div class="coach-body">You worked through all ${T.def.steps.length} steps. The records you created stay in the demo data, so you can open them again from the Service Desk.</div>
    <div class="actions"><button class="btn" data-tour="lib">All walkthroughs</button>${nextT?`<button class="btn primary" data-tourstart="${nextT.id}">Next: ${esc(nextT.short)}</button>`:''}</div>`;
  if(ui.view==='walkthroughs')render();
}
function endTour(){store.del(KEY+'-tour');clearInterval(tourTimer);if(TOUR)clearTimeout(TOUR.adv);TOUR=null;$('#tourRing').hidden=true;$('#coach').hidden=true;document.body.classList.remove('touring')}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-tourstart],[data-tour],[data-ciact]');if(!b)return;const d=b.dataset;
  if(d.tourstart){startTour(d.tourstart);return}
  if(d.ciact){const c=get($('#drawer').dataset.id);if(!c||!c.cap)return;
    openDrawer(createForm('CHG',{title:`Increase capacity for ${c.name}`,service:c.service,changeType:'Normal',risk:'Medium',ci:c.id,desc:`CPU ${c.cap.cpu}%, memory ${c.cap.mem}%, disk ${c.cap.disk}%, growing ${c.cap.growth}% a month. Add capacity before the 90% threshold.`}));bindCreate();return}
  const k=d.tour;
  if(k==='next')nextStep();else if(k==='back')prevStep();else if(k==='show')showMe();else if(k==='exit')endTour();
  else if(k==='min'){TOUR.min=true;renderCoach();tourSave()}else if(k==='max'){TOUR.min=false;renderCoach();tourSave()}
  else if(k==='lib'){endTour();location.hash='walkthroughs'}
});

