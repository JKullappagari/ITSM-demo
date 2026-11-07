/* Meridian Service Desk: Event wiring and start-up */
"use strict";
/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-open],[data-new],[data-demo],[data-ftype],[data-scope],[data-more],[data-close],[data-ctype],[data-act],[data-period],[data-tab],[data-reqitem],[data-newkb],[data-kbcat],[data-evsev],[data-evst],[data-cmsvc],[data-cmcls],[data-kbact],[data-evact],[data-cmsvcgo]');
  if(!b)return;
  const ds=b.dataset;
  if(ds.close){closeDrawer();return}
  if(ds.act){act($('#drawer').dataset.id,ds.act);return}
  if(ds.cmsvcgo){ui2.cmdb.svc=ds.cmsvcgo;location.hash='cmdb';return}
  if(ds.newkb){openDrawer(kbForm(ds.from,ds.note!=null?+ds.note:null));return}
  if(ds.reqitem){openDrawer(createForm('REQ',{item:ds.reqitem}));bindCreate();return}
  if(ds.kbcat){ui2.kb.cat=ds.kbcat;render();return}
  if(ds.evsev){ui2.ev.sev=ds.evsev;render();return}
  if(ds.evst){ui2.ev.status=ds.evst;render();return}
  if(ds.cmsvc){ui2.cmdb.svc=ds.cmsvc;render();return}
  if(ds.cmcls){ui2.cmdb.cls=ds.cmcls;render();return}
  if(ds.kbact){const k=get($('#drawer').dataset.id);if(ds.kbact==='publish'){k.status='Published';k.updated=Date.now();toast(`${k.id} published`)}else{k.helpful=Math.min(100,k.helpful+1);k.views++;toast('Thanks, vote recorded')}save();render();openKB(k);return}
  if(ds.evact){const ev=get($('#drawer').dataset.id);
    if(ds.evact==='raise'){const sevI=ev.sev==='Critical'?1:2;const ci=get(ev.ci);openDrawer(createForm('INC',{service:ev.service,title:`${ev.message} on ${ci?ci.name:ev.service}`,desc:`Raised from monitoring event ${ev.id} (${ev.source}).`,impact:sevI,urgency:sevI,caller:'Event management',evt:ev.id}));bindCreate();return}
    ev.status=ds.evact==='ack'?'Acknowledged':'Cleared';save();render();openEvent(ev);toast(`${ev.id} ${ev.status.toLowerCase()}`);return}
  if(b.dataset.open){openDetail(b.dataset.open);return}
  if(b.dataset.new){openDrawer(createForm(b.dataset.new));bindCreate();return}
  if(b.dataset.demo){openDrawer(createForm('INC',{service:'Payments Gateway',title:'Payment releases failing for all APAC clients',desc:'Payments queue rejecting new instructions since 14:05. Multiple clients calling in.',impact:1,urgency:1,caller:'Arjun Menon'}));bindCreate();return}
  if(b.dataset.ctype){openDrawer(createForm(b.dataset.ctype));bindCreate();return}
  if(b.dataset.ftype){ui.desk.type=b.dataset.ftype;ui.desk.limit=40;render();return}
  if(b.dataset.scope){ui.desk.scope=b.dataset.scope;ui.desk.limit=40;render();return}
  if(b.dataset.more){ui.desk.limit+=40;render();return}
  if(b.dataset.period){ui.dash.period=+b.dataset.period;saveUi();render();return}
  if(b.dataset.tab){ui.dash.tab=b.dataset.tab;saveUi();render();return}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#drawer').hidden)closeDrawer();
  if(e.key==='Enter'&&e.target.matches('[data-open][tabindex]'))openDetail(e.target.dataset.open);
});
document.addEventListener('input',e=>{
  const id=e.target.id;
  if(id==='deskSearch'||id==='kbSearch'){if(id==='deskSearch'){ui.desk.q=e.target.value;ui.desk.limit=40}else ui2.kb.q=e.target.value;const pos=e.target.selectionStart;render();const s=document.getElementById(id);if(s){s.focus();try{s.setSelectionRange(pos,pos)}catch(x){}}}
});
document.addEventListener('change',e=>{
  if(['f-impact','f-urgency','f-ctype','f-item'].includes(e.target.id))updateCalc();
  if(e.target.id==='f-major')e.target.dataset.touched='1';
});
document.addEventListener('submit',e=>{if(e.target.id==='createForm'){e.preventDefault();submitCreate(e.target)}if(e.target.id==='kbForm'){e.preventDefault();submitKb(e.target)}});
$('#scrim').addEventListener('click',closeDrawer);
$('#resetBtn').addEventListener('click',()=>{
  const b=$('#resetBtn');
  if(b.dataset.confirm){store.del(KEY);DB=generate(Date.now());reindex();b.textContent='Reset demo data';delete b.dataset.confirm;closeDrawer();render();toast('Demo data reset');}
  else{b.dataset.confirm='1';b.textContent='Click again to confirm reset';setTimeout(()=>{if(b.dataset.confirm){delete b.dataset.confirm;b.textContent='Reset demo data'}},4000)}
});
window.addEventListener('hashchange',route);

load();route();
