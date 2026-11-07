/* Meridian Service Desk: Maintenance windows, sidebar alert badges, background baseline alerts, process stage hover */
"use strict";

/* ---------- known error badge on incidents ---------- */
function keCount(t){return t.type==='INC'&&isOpen(t)&&!t.ke&&!t.major?keMatches(t.title,t.service,9).length:0}
function keBadge(t){const n=keCount(t);return n?` <span class="tag ke kebadge" title="Open the incident to apply it">${n} matching known error workaround${n>1?'s':''} found</span>`:''}

/* ---------- CMDB maintenance windows ---------- */
/* A configuration item is in a maintenance window while a change against it is being implemented. */
function ciMaint(id){return DB.items.find(t=>t.type==='CHG'&&t.ci===id&&t.status==='Implementing')||null}
function maintTag(id){const c=ciMaint(id);return c?`<span class="tag maint" title="${esc(c.id)}: ${esc(c.title)}">Maintenance window active · ${c.id}</span>`:''}
function maintFeed(t,s0){
  if(t.type!=='CHG'||s0===t.status||!t.ci)return;const ci=get(t.ci);if(!ci)return;
  if(t.status==='Implementing')feed('CMDB',`${ci.name} status: Maintenance window active (${t.id})`,ci.id);
  else if(s0==='Implementing')feed('CMDB',`${ci.name} maintenance window closed (${t.id}${t.outcome?', '+t.outcome.toLowerCase():''})`,ci.id);
}

/* ---------- sidebar badges ---------- */
const NAV_COUNT={
  desk:()=>DB.items.filter(t=>t.type==='INC'&&isOpen(t)&&(t.priority==='P1'||t.priority==='P2')).length,
  events:()=>DB.events.filter(e=>e.status==='Open').length,
  changes:()=>DB.items.filter(t=>t.type==='CHG'&&t.status==='CAB approval').length};
const NAV_TIP={desk:'open P1/P2 incidents',events:'open alerts',changes:'changes awaiting CAB'};
const navSeen={};
function updateNav(){
  if(!DB)return;
  Object.entries(NAV_COUNT).forEach(([v,f])=>{const a=$(`#nav a[data-view="${v}"]`);if(!a)return;const n=f();
    let b=a.querySelector('.navbadge');if(!b){b=document.createElement('span');b.className='navbadge';a.appendChild(b)}
    b.textContent=n;b.hidden=!n;b.title=`${n} ${NAV_TIP[v]}`;a.setAttribute('aria-label',`${a.textContent.replace(/\d+$/,'').trim()}${n?`, ${n} ${NAV_TIP[v]}`:''}`);
    if(navSeen[v]!=null&&n>navSeen[v]&&!RM_SIM){b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump')}
    navSeen[v]=n});
}
AFTER_RENDER.push(updateNav);

/* ---------- background baseline alerts ---------- */
/* Now and then a metric drifts past its baseline. Paused during walkthroughs so scenarios stay predictable. */
function baselineAlert(){
  if(TOUR||!DB)return;
  const cis=DB.ci.filter(c=>EV_MSG[c.cls]&&c.status==='In use');if(!cis.length)return;
  const ci=cis[Math.floor(Math.random()*cis.length)];const msg=EV_MSG[ci.cls][Math.floor(Math.random()*EV_MSG[ci.cls].length)];
  const e=seedEvent({ci:ci.id,service:ci.service,sev:'Warning',message:msg,source:EV_SRC[ci.cls]+': baseline check',count:1,autoClear:Date.now()+15*60e3});
  feed('EVENT',`Baseline check failed on ${ci.name}: ${msg}`,e.id);save();updateNav();
  if(ui.view==='events')render();
}

/* ---------- processes: hover a stage to see who owns it and what is in it now ---------- */
const PROC_ROLES={
  INC:['Service desk analyst','Service desk analyst','Resolver group','Resolver group','Service desk analyst'],
  MI:['Incident manager','Major incident manager','Communications lead','Resolver teams and business owner','Problem manager'],
  PRB:['Problem manager','Resolver group','Resolver group','Problem manager','Change owner','Problem manager'],
  CHG:['Change owner','Change manager','CAB or change authority','Change manager','Implementer','Change manager'],
  REQ:['Requester','Line manager','Fulfilment groups','Service desk analyst'],
  REL:['Release manager','Development team','Test team','Release manager','Operations and resolver teams','Release manager'],
  EVT:['Monitoring tools','Event management','Event management','Operations bridge','Monitoring team'],
  KB:['Resolver or desk analyst','Knowledge author','Knowledge reviewer','Knowledge manager','Knowledge manager'],
  CI:['Configuration manager','Discovery tooling','Configuration manager','Change manager','Configuration auditor'],
  AST:['Asset manager','Procurement','End user services','End user services','Asset manager'],
  CAT:['Service owner','Service owner','Catalogue manager','Service level manager','Service owner'],
  SLM:['Service level manager','Service level manager','Service level manager','Service owner'],
  IMP:['Anyone','Improvement manager','Improvement board','Improvement owner','Improvement manager']};
/* The records sitting at each stage right now, where a stage maps onto a record status. */
const PROC_NOW={
  INC:[['INC','New'],['INC','New'],['INC','Assigned'],['INC','In Progress'],['INC','Resolved']],
  MI:MI_FLOW.map(s=>['MI',s]),
  PRB:[['PRB','Logged'],['PRB','Investigating'],['PRB','Root cause found'],['PRB','Known error'],null,['PRB','Resolved']],
  CHG:[['CHG','Draft'],['CHG','Assessment'],['CHG','CAB approval'],['CHG','Scheduled'],['CHG','Implementing'],['CHG','Review']],
  REQ:[['REQ','Submitted'],['REQ','Approval'],['REQ','Fulfilment'],['REQ','Fulfilled']],
  REL:FLOW.REL.map(s=>['REL',s]),
  IMP:CSI_FLOW.map(s=>['CSI',s])};
function stageRecords(k,i){
  const m=(PROC_NOW[k]||[])[i];if(!m)return null;const [type,st]=m;
  if(type==='MI')return DB.items.filter(t=>t.type==='INC'&&t.major&&isOpen(t)&&(t.majorStage||'Declared')===st);
  if(type==='CSI')return DB.csi.filter(x=>x.status===st);
  return DB.items.filter(t=>t.type===type&&t.status===st);
}
const PROC_NOUN={INC:'incident',MI:'major incident',PRB:'problem',CHG:'change',REQ:'request',REL:'release',IMP:'improvement'};
function stageNote(k,i){
  const role=(PROC_ROLES[k]||[])[i];const recs=stageRecords(k,i);
  const now=recs?` · <b>Now:</b> ${recs.length} ${PROC_NOUN[k]}${recs.length===1?'':'s'} at this stage${recs.length?` <span class="links" style="display:inline-flex">${recs.slice(0,4).map(t=>`<button class="linkchip" data-open="${t.id}">${t.id}</button>`).join('')}</span>`:''}`:'';
  return role?`<b>Who:</b> ${esc(role)}${now}`:'';
}
function procHot(li){
  const flow=li.closest('.flow');const k=flow.dataset.proc;const i=+li.dataset.i;const role=(PROC_ROLES[k]||[])[i];
  flow.querySelectorAll('li').forEach((x,j)=>{x.classList.toggle('hot',j===i);x.classList.toggle('same',j!==i&&!!role&&(PROC_ROLES[k]||[])[j]===role)});
  const note=flow.parentElement.querySelector('.flow-note');if(note){const h=stageNote(k,i);if(h)note.innerHTML=h}
}
function procCold(flow){flow.querySelectorAll('li').forEach(x=>x.classList.remove('hot','same'))}
document.addEventListener('mouseover',e=>{const li=e.target.closest&&e.target.closest('.flow[data-proc] li');if(li)procHot(li)});
document.addEventListener('focusin',e=>{const li=e.target.closest&&e.target.closest('.flow[data-proc] li');if(li)procHot(li)});
document.addEventListener('mouseout',e=>{const f=e.target.closest&&e.target.closest('.flow[data-proc]');if(f&&!f.contains(e.relatedTarget))procCold(f)});
