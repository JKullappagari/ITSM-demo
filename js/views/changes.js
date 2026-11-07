/* Meridian Service Desk: Change enablement and release management workspace */
"use strict";
const CHG_PATHS=[
  {k:'Standard',cls:'ok',what:'Pre-approved, low risk and repeatable. The template was approved once, so each instance skips CAB.',
   steps:['Raise from template','Schedule','Implement','Close'],approval:'None per change (template pre-approved)',lead:'Same day',eg:'Certificate renewal, routine OS patch, adding a user to a group'},
  {k:'Normal',cls:'info',what:'Risk-assessed before approval. Impact is checked against the CMDB and the change goes to CAB.',
   steps:['Raise RFC','Assess risk and impact','CAB approval','Schedule','Implement','Review'],approval:'Change Advisory Board or change authority',lead:'5 to 10 working days',eg:'Database migration, new release, firewall redesign'},
  {k:'Emergency',cls:'crit',what:'Needed now to restore or protect service. Approved fast by the emergency CAB and reviewed afterwards.',
   steps:['Raise RFC','Emergency CAB','Implement','Review'],approval:'Emergency CAB (ECAB)',lead:'Hours',eg:'Fix during a major incident, urgent security patch'}];
function viewChanges(){
  const now=Date.now(),C=DB.items.filter(t=>t.type==='CHG'),R=DB.items.filter(t=>t.type==='REL');
  const cab=C.filter(t=>t.status==='CAB approval').sort((a,b)=>a.planned-b.planned);
  const next7=C.filter(t=>isOpen(t)&&t.planned>=now&&t.planned<now+7*DAY);
  const d30=C.filter(t=>t.created>=now-30*DAY);
  const typeStats=k=>{const done=C.filter(t=>t.changeType===k&&t.outcome&&t.resolved>=now-90*DAY);return{n:d30.filter(t=>t.changeType===k).length,succ:pct(done.filter(t=>t.outcome==='Successful').length,done.length),done:done.length}};
  const start=new Date(now);start.setHours(0,0,0,0);
  const days=[...Array(14)].map((_,i)=>{const s=start.getTime()+i*DAY;return{s,e:s+DAY,d:new Date(s)}});
  const chip=t=>`<button class="calchip ${t.changeType}" data-open="${t.id}" title="${esc(t.title)}"><span class="mono">${t.id.slice(-4)}</span> ${esc(t.title)}</button>`;
  return `<div class="pagehead"><div><span class="eyebrow">Change enablement and release management</span><h1>Changes &amp; releases</h1><p>Every change to a live service is recorded, assessed in proportion to its risk and scheduled. Releases bundle approved changes into one tested deployment.</p></div>
    <div class="actions"><button class="btn primary" data-new="CHG">+ Raise change</button><button class="btn" data-new="REL">+ Plan release</button></div></div>
  <div class="tiles">${tile('Awaiting CAB',cab.length,'','decision needed',cab.length>3?'warn':'neutral')}${tile('Scheduled next 7 days',next7.length,'',`${next7.filter(t=>t.risk==='High').length} high risk`)}${tile('Emergency changes',pct(d30.filter(t=>t.changeType==='Emergency').length,d30.length),'%','of changes raised, last 30 days',lvl(pct(d30.filter(t=>t.changeType==='Emergency').length,d30.length),10,15,true))}${tile('Releases in flight',R.filter(isOpen).length,'',`${R.filter(t=>t.planned>now).length} still to deploy`)}</div>
  <section class="panel" id="chgPaths"><div class="panel-head"><h2>Standard, normal and emergency: three paths</h2><button class="btn" data-tourstart="stdnormal">Walk through standard vs normal</button></div>
    <div class="paths">${CHG_PATHS.map(p=>{const s=typeStats(p.k);return `<div class="pathcard ${p.cls}"><div class="panel-head"><h3>${p.k} change</h3><span class="muted" style="font-size:12px">${s.n} raised in 30 days · ${s.done?s.succ+'% successful':'no outcomes yet'}</span></div><p>${p.what}</p>
      <ol class="pathsteps">${p.steps.map(x=>`<li>${x}</li>`).join('')}</ol>
      <dl class="mini"><div><dt>Approval</dt><dd>${p.approval}</dd></div><div><dt>Typical lead time</dt><dd>${p.lead}</dd></div><div><dt>Examples</dt><dd>${p.eg}</dd></div></dl></div>`}).join('')}</div></section>
  <section class="panel" id="cabAgenda"><div class="panel-head"><h2>CAB agenda</h2><span class="muted">Changes waiting for a decision, earliest first</span></div>
    <div class="list">${cab.map(t=>{const ci=t.ci?get(t.ci):null;return `<div class="li" data-open="${t.id}" tabindex="0"><span class="tag">${t.changeType==='Emergency'?'ECAB':'CAB'}</span><div style="min-width:0"><div class="t-title">${esc(t.title)}</div><div class="t-meta"><span class="mono">${t.id}</span> · ${t.risk} risk · ${esc(t.service)}${ci?' · '+esc(ci.name):''}</div></div><span class="sla ${t.risk==='High'?'risk':'ok'}">${fmtD(t.planned)}</span></div>`}).join('')||'<div class="empty">Nothing waiting for CAB.</div>'}</div></section>
  <section class="panel" id="chgCal"><div class="panel-head"><h2>Change calendar</h2><span class="muted">Next 14 days · <span class="calkey Standard">Standard</span> <span class="calkey Normal">Normal</span> <span class="calkey Emergency">Emergency</span> · ◆ release</span></div>
    <div class="calwrap"><div class="cal">${days.map(d=>{const cs=C.filter(t=>t.planned>=d.s&&t.planned<d.e&&t.status!=='Rejected');const rs=R.filter(t=>t.planned>=d.s&&t.planned<d.e);const wk=d.d.getDay()===0||d.d.getDay()===6;
      return `<div class="calday ${wk?'wk':''} ${d.s===start.getTime()?'today':''}"><div class="caldate">${d.d.toLocaleDateString('en-GB',{weekday:'short'})} <b>${d.d.getDate()}</b></div>${rs.map(r=>`<button class="calrel" data-open="${r.id}">◆ ${esc(r.title)}</button>`).join('')}${cs.map(chip).join('')}</div>`}).join('')}</div></div></section>
  <section class="panel" id="relPipe"><div class="panel-head"><h2>Release pipeline</h2><span class="muted">Open releases and those closed in the last 30 days</span></div>
    <div class="calwrap"><div class="kanban">${FLOW.REL.map(st=>{const list=R.filter(r=>r.status===st&&(st!=='Closed'||r.resolved>=now-30*DAY));return `<div class="kcol"><div class="kh">${st} <b>${list.length}</b></div>${list.map(r=>`<button class="kcard" data-open="${r.id}"><span class="t-title">${esc(r.title)}</span><span class="t-meta">${fmtD(r.planned)} · ${(n=>n+' change'+(n===1?'':'s'))(r.links.filter(l=>l.startsWith('CHG')).length)}</span></button>`).join('')}</div>`}).join('')}</div></div></section>`;
}
