/* Meridian Service Desk: Service catalogue view */
"use strict";
/* ---------- Service catalogue ---------- */
function viewCatalogue(){
  const from=Date.now()-30*DAY;
  const groups=by(CATALOG,c=>CAT_GROUP[c.name]);
  return `<div class="pagehead"><div><span class="eyebrow">Service catalogue</span><h1>What you can request</h1><p>Standard services with a published fulfilment target. Each request follows the request fulfilment process and is measured against its target.</p></div></div>
  ${Object.entries(groups).map(([g,items])=>`<section class="section"><h2>${esc(g)}</h2><div class="cards">${items.map(c=>{
    const done=DB.items.filter(t=>t.type==='REQ'&&t.item===c.name&&t.resolved&&t.resolved>=from);
    const a=avg(done.map(t=>(t.resolved-t.created)/HR));const ot=pct(done.filter(t=>slaOf(t).state==='met').length,done.length);
    return `<div class="card"><h3>${esc(c.name)}</h3><p>${esc(CAT_DESC[c.name])}</p>
      <div class="meta"><span>Target <b>${c.target} h</b></span><span>${c.approval?'Manager approval':'No approval'}</span></div>
      <div class="meta"><span>Last 30 days: <b>${done.length}</b> fulfilled</span><span>avg <b>${done.length?fmtDur(a):'—'}</b></span><span class="sla ${ot>=85?'met':ot>=75?'risk':'breached'}">${ot}% on time</span></div>
      <div class="foot"><span class="muted" style="font-size:12px">${c.name==='New laptop'||c.name==='New starter onboarding'?'End User Services':'Service Desk L1'}</span><button class="btn primary" data-reqitem="${esc(c.name)}">Request</button></div></div>`}).join('')}</div></section>`).join('')}`;
}

