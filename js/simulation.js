/* Meridian Service Desk: Live simulation: activity log, cross-module ripple effects, SLA countdowns */
"use strict";

/* ---------- system activity log ---------- */
const FEED_MAX=120;
const FEED_MOD={INC:'INCIDENT',PRB:'PROBLEM',CHG:'CHANGE',REQ:'REQUEST',REL:'RELEASE'};
const fmtClock=ms=>new Date(ms).toLocaleTimeString('en-GB',{hour12:false});
/* Adds a line to the log. ambient lines are background noise and are the first to be dropped. */
function feed(mod,msg,id,ambient){
  if(!DB)return;DB.feed=DB.feed||[];
  DB.feed.push({t:Date.now(),m:mod,x:msg,id:id||null,a:!!ambient});
  while(DB.feed.length>FEED_MAX){const i=DB.feed.findIndex(f=>f.a);DB.feed.splice(i>=0?i:0,1)}
  renderFeed(true);
}
/* Logs the work notes an action added to a record. */
function feedNotes(t,from){t.notes.slice(from).forEach(n=>feed(FEED_MOD[t.type]||'SYSTEM',`${t.id} ${n.text.charAt(0).toLowerCase()+n.text.slice(1)}`,t.id))}
/* A new browser starts with the most recent real activity, so the log is never empty. */
function seedFeed(){
  if(DB.feed&&DB.feed.length)return;
  const notes=[];DB.items.forEach(t=>t.notes.forEach(n=>{if(n.t<=Date.now())notes.push({t:n.t,m:FEED_MOD[t.type]||'SYSTEM',x:`${t.id} ${n.text.charAt(0).toLowerCase()+n.text.slice(1)}`,id:t.id,a:false})}));
  const ev=DB.events.filter(e=>e.time<=Date.now()).map(e=>({t:e.time,m:'EVENT',x:`${e.sev} on ${(get(e.ci)||{}).name||e.service}: ${e.message}`,id:e.id,a:false}));
  DB.feed=notes.concat(ev).sort((a,b)=>a.t-b.t).slice(-14);
}
let feedOpen=false;
function feedLine(f){return `<span class="fd-t">[${fmtClock(f.t)}]</span> <span class="fd-m fd-${f.m.toLowerCase()}">${esc(f.m)}:</span> ${esc(f.x)}`}
function renderFeed(fresh){
  const el=$('#feed');if(!el||!DB)return;const F=DB.feed||[];const last=F[F.length-1];
  const bar=$('#feedLast');if(bar){bar.innerHTML=last?feedLine(last):'Waiting for activity';if(fresh&&!RM_SIM){bar.classList.remove('flash');void bar.offsetWidth;bar.classList.add('flash')}}
  $('#feedBtn').setAttribute('aria-expanded',feedOpen);$('#feedCount').textContent=F.length;
  const list=$('#feedList');list.hidden=!feedOpen;
  if(feedOpen)list.innerHTML=F.slice().reverse().map(f=>f.id&&get(f.id)?`<button class="fd-row" data-open="${f.id}">${feedLine(f)}</button>`:`<div class="fd-row">${feedLine(f)}</div>`).join('');
}
const RM_SIM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
function mountFeed(){
  const d=document.createElement('div');d.id='feed';
  d.innerHTML=`<div id="feedList" class="feed-list" hidden aria-label="System activity log"></div><button type="button" id="feedBtn" class="feed-bar" aria-expanded="false" aria-controls="feedList"><span class="fd-live" aria-hidden="true"></span><span class="fd-label">Live</span><span id="feedLast" class="fd-last"></span><span class="fd-n">Activity log <b id="feedCount">0</b></span></button>`;
  document.body.appendChild(d);document.body.classList.add('has-feed');
  $('#feedBtn').addEventListener('click',()=>{feedOpen=!feedOpen;renderFeed()});
  $('#feedList').addEventListener('click',e=>{if(e.target.closest('[data-open]')){feedOpen=false;renderFeed()}});
}
/* Background noise of a live estate: health checks, backups, discovery, integrations. */
function ambientLine(){
  const R=a=>a[Math.floor(Math.random()*a.length)],n=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const ci=cls=>{const l=DB.ci.filter(c=>c.cls===cls);return l.length?R(l).name:cls};
  const open=DB.items.filter(t=>t.type==='INC'&&isOpen(t));const risk=open.filter(t=>{const s=slaOf(t);return s&&s.state!=='ok'}).length;
  const L=[
    ()=>['EVENT',`${ci('Server')} heartbeat OK (${n(3,40)} ms)`],
    ()=>['EVENT',`${ci('Network device')} interface utilisation ${n(18,64)}%, within threshold`],
    ()=>['MONITOR',`${ci('Database')} replication lag ${n(1,9)} s, within threshold`],
    ()=>['BACKUP',`Snapshot of ${ci('Database')} completed and verified (${n(12,240)} GB)`],
    ()=>['CMDB',`Discovery scan reconciled ${n(140,320)} configuration items, ${n(0,4)} changed`],
    ()=>['SYNC',`HR feed imported ${n(0,6)} joiner and ${n(0,3)} leaver records`],
    ()=>['MAIL',`Email-to-ticket listener polled the service desk mailbox: ${n(0,5)} new messages`],
    ()=>['SLA',`Queue check: ${open.length} open incidents, ${risk} at risk or breached`],
    ()=>['SYNTHETIC',`Client Portal login journey passed in ${(n(8,19)/10).toFixed(1)} s`]];
  const [m,x]=R(L)();feed(m,x,null,true);
}

/* ---------- ripple effects between modules ---------- */
/* After a normal or emergency change is implemented: watch the service, raise alerts and the incidents a bad change causes. */
function rippleChange(t,now){
  if(!['Normal','Emergency'].includes(t.changeType))return null;
  const ci=get(t.ci)||DB.ci.find(c=>c.service===t.service&&c.cls==='Application');const ciName=ci?ci.name:t.service;
  if(t.outcome==='Successful'){
    let msg=null;
    if(t.risk==='High'){
      const ev=seedEvent({ci:ci&&ci.id,service:t.service,sev:'Warning',message:`p95 response time above 2 s after ${t.id}`,source:'Application performance',count:4,autoClear:now+60e3,chg:t.id});
      t.notes.push({t:now+1,who:'Event management',text:`Post-implementation watch: latency warning ${ev.id} on ${ciName}. Clears on its own if it settles within a minute`});
      feed('EVENT',`Warning on ${ciName}: p95 response time above 2 s after ${t.id}`,ev.id);msg=`${t.id} implemented: latency warning raised on ${ciName}`;
    }else{t.notes.push({t:now+1,who:'Event management',text:`Post-implementation health check passed on ${ciName}`});feed('MONITOR',`Post-change health check passed on ${ciName} (${t.id})`,t.id)}
    // The fix is in: problems this change was raised for are resolved, and so are their incidents.
    t.links.map(get).filter(p=>p&&p.type==='PRB'&&isOpen(p)).forEach(p=>{p.status='Resolved';p.resolved=now;p.notes.push({t:now+2,who:'Problem Manager',text:`Permanent fix implemented by ${t.id}. Status changed to Resolved`});feed('PROBLEM',`${p.id} resolved by ${t.id}`,p.id);
      if(p.knownError)feed('KEDB',`${keId(p)} marked as fixed`,p.id);const n=rippleProblem(p,now+3);if(n)msg=`${t.id} fixed ${p.id}: ${n} linked incident${n>1?'s':''} resolved`;else msg=msg||`${t.id} fixed ${p.id}`});
    return msg;
  }
  // Failed or backed out: the service degrades and users start calling.
  const ev=seedEvent({ci:ci&&ci.id,service:t.service,sev:'Critical',message:`Error rate above 5% during ${t.id}`,source:'Application performance',count:9,chg:t.id,status:'Incident raised'});
  feed('EVENT',`Critical on ${ciName}: error rate above 5% during ${t.id}`,ev.id);
  const titles=(SERVICES[t.service]||['Service degraded after change']).slice(0,3);
  const incs=titles.map((title,i)=>{const x=seedInc({service:t.service,title,desc:`Reported during the change window of ${t.id} (${t.outcome.toLowerCase()}).`,impact:2,urgency:i?3:2,caller:CALLERS[(i*5+DB.items.length)%CALLERS.length],created:now+i*1500,links:[t.id],events:[ev.id]});
    x.notes.push({t:now+i*1500+2,who:'Change Manager',text:`Linked to ${t.id}: likely caused by the change`});t.links.push(x.id);feed('INCIDENT',`${x.id} logged: ${title} (${x.priority})`,x.id);return x});
  ev.inc=incs[0].id;t.causedIncident=true;
  t.notes.push({t:now+1,who:'Event management',text:`Change caused ${incs.length} incidents and critical event ${ev.id}`});
  return `${t.id} ${t.outcome.toLowerCase()}: ${incs.length} incidents raised on ${t.service}`;
}
/* A resolved problem resolves the incidents still open against it. Returns how many. */
function rippleProblem(p,now){
  const open=p.links.map(get).filter(x=>x&&x.type==='INC'&&isOpen(x)&&!x.major);
  open.forEach(x=>{x.status='Resolved';x.resolved=now;x.notes.push({t:now,who:'Problem Manager',text:`Resolved by the permanent fix for problem ${p.id}`});feed('INCIDENT',`${x.id} resolved by the fix for ${p.id}`,x.id)});
  return open.length;
}

/* ---------- live SLA countdowns ---------- */
const pad2=n=>String(n).padStart(2,'0');
function fmtHMS(h){if(h>=24)return fmtDur(h);const s=Math.max(0,Math.round(h*3600));return `${Math.floor(s/3600)}h ${pad2(Math.floor(s%3600/60))}m ${pad2(s%60)}s`}
function slaLive(t){const s=slaOf(t);if(!s)return null;
  const label=t.resolved?s.label:s.state==='breached'?'Breached +'+fmtHMS(s.el-s.target):fmtHMS(s.target-s.el)+' left';
  return{s,label,w:Math.min(100,s.p*100)}}
function slaBar(t){const l=slaLive(t);if(!l)return '';
  return `<span class="slalive" data-sla="${t.id}"><span class="sla ${l.s.state}">${esc(l.label)}</span><span class="slabar ${l.s.state}" role="progressbar" aria-label="SLA time used" aria-valuenow="${Math.round(l.w)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${l.w.toFixed(1)}%"></i></span></span>`}
const SLA_RANK={ok:0,risk:1,breached:2};
let slaPrimed=false;
function slaTick(){
  document.querySelectorAll('[data-sla]').forEach(el=>{const t=get(el.dataset.sla);const l=t&&slaLive(t);if(!l)return;
    const lab=el.firstElementChild,bar=el.lastElementChild;lab.textContent=l.label;lab.className='sla '+l.s.state;bar.className='slabar '+l.s.state;bar.firstElementChild.style.width=l.w.toFixed(1)+'%';bar.setAttribute('aria-valuenow',Math.round(l.w))});
}
/* Logs incidents crossing into "at risk" and "breached". The first pass after loading only records the current state. */
function slaWatch(){
  let changed=false;
  DB.items.forEach(t=>{if(t.type!=='INC'||!isOpen(t))return;const s=slaOf(t);if(!s)return;const was=t.slaFlag||'ok';
    if(SLA_RANK[s.state]>SLA_RANK[was]){t.slaFlag=s.state;changed=true;
      if(slaPrimed)feed('SLA',s.state==='breached'?`${t.id} ${t.priority} breached its ${s.target} h resolution target`:`${t.id} ${t.priority} at risk: ${fmtHMS(s.target-s.el)} left of ${s.target} h`,t.id)}});
  slaPrimed=true;
  // Post-change warnings that settle clear on their own.
  DB.events.forEach(e=>{if(e.autoClear&&e.status==='Open'&&Date.now()>=e.autoClear){e.status='Cleared';e.autoClear=null;changed=true;
    feed('EVENT',`${e.id} cleared: response times back to normal after ${e.chg||'the change'}`,e.id);if(ui.view==='events'||ui.view==='desk')render()}});
  if(changed)save();
}

/* ---------- walkthrough progress ---------- */
function tourProg(){try{return JSON.parse(store.get(KEY+'-tourprog')||'{}')}catch(e){return {}}}
function tourProgSave(id,i){const p=tourProg();if(!(p[id]>=i)){p[id]=i;store.set(KEY+'-tourprog',JSON.stringify(p))}}
/* Compact step tracker in the coach panel: a row of ticks, expandable into the full checklist. */
let coachListOpen=false;
function coachList(T){
  const S=T.def.steps,done=i=>i<T.i||(i===T.i&&(T.done||T.finished));const n=S.filter((s,i)=>done(i)).length;
  return `<details class="coach-list"${coachListOpen?' open':''}><summary><span class="ticks" aria-hidden="true">${S.map((s,i)=>`<i class="${done(i)?'on':i===T.i?'cur':''}"></i>`).join('')}</span><span>${n} of ${S.length} steps done</span></summary>
    <ol>${S.map((s,i)=>`<li class="${done(i)?'on':i===T.i?'cur':''}"><span class="box" aria-hidden="true">${done(i)?'✓':''}</span><span>${esc(s.t)}</span>${done(i)?'<span class="sr">done</span>':''}</li>`).join('')}</ol></details>`;
}
document.addEventListener('toggle',e=>{if(e.target.classList&&e.target.classList.contains('coach-list'))coachListOpen=e.target.open},true);
/* Checklist on each walkthrough card. */
function cardChecklist(w,doneTour){
  const p=tourProg()[w.id];const reached=doneTour?w.steps.length:(p>=0?p:-1);const n=doneTour?w.steps.length:Math.max(0,reached);
  return `<details class="wt-steps"><summary><span class="wt-meter" aria-hidden="true"><i style="width:${(n/w.steps.length*100).toFixed(0)}%"></i></span>${doneTour?'All steps done':n?`${n} of ${w.steps.length} steps done`:'Steps'}</summary>
    <ol>${w.steps.map((s,i)=>`<li class="${i<n?'on':''}"><span class="box" aria-hidden="true">${i<n?'✓':''}</span>${esc(s.t)}</li>`).join('')}</ol></details>`;
}

/* ---------- start-up ---------- */
function startSimulation(){
  mountFeed();seedFeed();renderFeed();slaWatch();
  setInterval(slaTick,1000);setInterval(slaWatch,5000);
  let next=Date.now()+12e3;
  setInterval(()=>{if(document.hidden||Date.now()<next)return;next=Date.now()+28e3+Math.random()*22e3;ambientLine();save()},2000);
}
