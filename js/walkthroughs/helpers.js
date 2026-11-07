/* Meridian Service Desk: Walkthrough helpers and scenario seeding */
"use strict";
/* ---------- walkthrough helpers ---------- */
const PRI='#drawer > .actions .btn.primary';
const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
function inDrawerAny(id){const d=$('#drawer');return !!id&&!d.hidden&&d.dataset.id===id}
function inDrawer(id){return inDrawerAny(id)&&$('#drawer').dataset.view==='rec'}
function openRec(id){if(!inDrawer(id))openDetail(id)}
function goView(v,cb){
  if(location.hash!=='#'+v){location.hash=v;setTimeout(()=>{cb&&cb()},70)}
  else{route();cb&&cb()}
}
function fill(id,v){const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}}
function submitIf(sel){const f=$(sel);if(f){f.requestSubmit();return true}return false}
function clickSel(sel){const b=typeof sel==='string'?$(sel):sel;if(b&&!b.disabled){b.click();return true}return false}
function clickPrimary(id){openRec(id);return clickSel(PRI)}
function stAt(id,s){const t=get(id);if(!t)return false;const f=FLOW[t.type];return f.indexOf(t.status)>=f.indexOf(s)}
function miAt(id,s){const t=get(id);return !!(t&&t.major&&MI_FLOW.indexOf(t.majorStage)>=MI_FLOW.indexOf(s))}
function fresh(type,pred){const s=TOUR?TOUR.ctx.since:0;let best=null;DB.items.forEach(t=>{if(t.type===type&&t.created>=s&&t.created<=Date.now()+5000&&(!pred||pred(t))&&(!best||t.created>=best.created))best=t});return best}
function custSince(id,c){const t=get(id);return !!(t&&t.notes.some(n=>n.cust&&n.t>=c.since))}
const ciId=n=>(DB.ci.find(c=>c.name===n)||{}).id;
function seedInc(o){
  const now=Date.now();
  const t=Object.assign({id:newId('INC'),type:'INC',created:now,resolved:null,links:[],notes:[],status:'Assigned',impact:2,urgency:2,caller:'Daniel Reyes'},o);
  t.priority=prioOf(t.impact,t.urgency);t.group=t.group||GROUP_OF[t.service];t.assignee=t.assignee||pick2(PEOPLE);
  const app=DB.ci.find(c=>c.service===t.service&&c.cls==='Application');if(app)t.ci=app.id;
  t.notes.push({t:t.created,who:'Service Desk',text:`Logged by ${t.caller} by phone`},{t:t.created+6e5,who:'Service Desk',text:`Assigned to ${t.group}`});
  if(t.resolved)t.notes.push({t:t.resolved,who:t.assignee,text:'Restarted the affected service and confirmed with caller'});
  DB.items.push(t);IDX.set(t.id,t);return t;
}
function seedEvent(o){DB.seq.EVT=(DB.seq.EVT||790000)+1;const e=Object.assign({kind:'EVT',id:'EVT'+String(DB.seq.EVT).padStart(7,'0'),time:Date.now(),status:'Open',inc:null,count:1},o);DB.events.unshift(e);IDX.set(e.id,e);return e}
function seedChg(o){
  const now=Date.now();
  const t=Object.assign({id:newId('CHG'),type:'CHG',created:now-2*DAY,resolved:null,links:[],outcome:null,risk:'Low',status:'Scheduled',notes:[]},o);
  t.group=GROUP_OF[t.service];t.assignee=pick2(PEOPLE);const app=DB.ci.find(c=>c.service===t.service&&c.cls==='Application');if(app)t.ci=app.id;
  t.notes.push({t:t.created,who:t.assignee,text:'Request for change raised (normal)'},{t:t.created+DAY,who:'Change Advisory Board',text:'Approved at CAB'});
  DB.items.push(t);IDX.set(t.id,t);return t;
}
const KCS_REPLY='Hi Daniel, the bank rejected the file because three payments had a value date in the past (error PG-417). Change the value date to today or later and resubmit the file. I have checked that corrected files are being accepted. If any payment still shows as pending after an hour, reply to this message.';

