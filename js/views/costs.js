/* Meridian Service Desk: cost of downtime model, live ticking counters and report tab */
"use strict";
/* Cost of a full outage per hour, in SGD. Illustrative figures for a mid-size financial services firm. */
const SVC_COST={'Payments Gateway':85000,'Trade Matching':60000,'Identity & Access':30000,'Client Portal':25000,'Network & VPN':18000,'Email & Collaboration':6000,'Data Warehouse':4000,'HR Self-Service':800};
/* Share of the full-outage cost an open incident represents: a major incident is close to a full outage, a P2 is a partial degradation. */
const IMPACT_W={major:0.7,P1:0.1,P2:0.01};
function costWeight(t){return t.major?IMPACT_W.major:(IMPACT_W[t.priority]||0)}
function costRate(t){return t&&t.type==='INC'?(SVC_COST[t.service]||0)*costWeight(t):0}
function incCost(t,from,to){const a=Math.max(t.created,from||0),b=Math.min(t.resolved||Date.now(),to||Date.now());return b>a?costRate(t)*(b-a)/HR:0}
function fmtMoney(v,compact){
  v=Math.max(0,v||0);
  if(compact){if(v>=1e6)return 'S$'+(v/1e6).toFixed(v>=1e7?0:1)+'M';if(v>=1e3)return 'S$'+Math.round(v/1e3)+'k';return 'S$'+Math.round(v)}
  return 'S$'+Math.round(v).toLocaleString('en-SG');
}
function tickSpan(base,rate){return `<span class="tick num" data-tick="${base.toFixed(2)}|${rate}|${Date.now()}">${fmtMoney(base)}</span>`}
function costCell(t){
  const r=costRate(t);if(!r)return '<span class="muted">—</span>';
  return isOpen(t)?`${tickSpan(incCost(t),r)} <span class="muted">· ${fmtMoney(r,true)} an hour</span>`:fmtMoney(incCost(t));
}
function periodCost(from){return DB.items.reduce((a,t)=>a+(t.type==='INC'?incCost(t,from):0),0)}
setInterval(()=>{const now=Date.now();document.querySelectorAll('[data-tick]').forEach(el=>{const p=el.dataset.tick.split('|').map(Number);el.textContent=fmtMoney(p[0]+p[1]*(now-p[2])/HR)})},1000);

function dashCosts(P){
  const now=Date.now(),from=now-P*DAY;
  const incs=DB.items.filter(t=>t.type==='INC'&&costRate(t)>0&&(t.resolved||now)>=from);
  const total=incs.reduce((a,t)=>a+incCost(t,from),0);
  const open=DB.items.filter(t=>t.type==='INC'&&isOpen(t)&&costRate(t)>0);
  const liveBase=open.reduce((a,t)=>a+incCost(t),0),liveRate=open.reduce((a,t)=>a+costRate(t),0);
  const bySvc=SVC.map(s=>{const l=incs.filter(t=>t.service===s);return{s,cost:l.reduce((a,t)=>a+incCost(t,from),0),n:l.length}}).sort((a,b)=>b.cost-a.cost);
  const top=incs.map(t=>({t,c:incCost(t,from)})).sort((a,b)=>b.c-a.c).slice(0,8);
  const hourValue=incs.filter(t=>t.created>=from).reduce((a,t)=>a+costRate(t),0);
  return `<div class="tiles">
    ${tile('Downtime cost',fmtMoney(total,true),'',`last ${P} days, P1 and P2 incidents`,total>2e6?'crit':total>5e5?'warn':'ok')}
    <div class="tile ${open.length?'crit':'ok'}"><span class="eyebrow">Accruing right now</span><span class="val" style="font-size:24px">${tickSpan(liveBase,liveRate)}</span><div class="sub"><span>${open.length} open P1/P2 · ${fmtMoney(liveRate,true)} an hour</span></div></div>
    ${tile('Costliest service',fmtMoney(bySvc[0].cost,true),'',`${esc(bySvc[0].s)} · ${bySvc[0].n} incidents`,'neutral')}
    ${tile('Worth of 1 hour faster MTTR',fmtMoney(hourValue,true),'',`if every P1/P2 in the period closed an hour sooner`,'neutral')}
  </div>
  <section class="panel" id="rep-cost"><div class="panel-head"><h2>Downtime cost by service</h2><span class="muted">Last ${P} days · full-outage rate in brackets</span></div>
    ${bars(bySvc.map(r=>({label:r.s,value:r.cost,text:fmtMoney(r.cost,true),sub:`(${fmtMoney(SVC_COST[r.s],true)}/h)`,cls:r.cost>1e6?'crit':r.cost>2e5?'amber':''})))}</section>
  <div class="grid g2">
    <section class="panel"><div class="panel-head"><h2>Costliest incidents</h2><span class="muted">Open ones keep counting</span></div>
      <div class="tablewrap"><table class="fit"><thead><tr><th>Incident</th><th>Priority</th><th>Duration</th><th>Cost</th></tr></thead><tbody>
      ${top.map(({t,c})=>`<tr class="click" data-open="${t.id}" tabindex="0"><td><div class="t-title">${esc(t.title)}</div><div class="t-meta"><span class="mono">${t.id}</span> · ${esc(t.service)}${t.major?' <span class="tag mi">MI</span>':''}</div></td><td>${prioTag(t.priority)}</td><td class="num">${fmtDur(((t.resolved||now)-Math.max(t.created,from))/HR)}</td><td class="num">${isOpen(t)?tickSpan(c,costRate(t)):fmtMoney(c)}</td></tr>`).join('')||'<tr><td colspan="4"><div class="empty">No costly incidents in this period.</div></td></tr>'}</tbody></table></div></section>
    <section class="panel"><div class="panel-head"><h2>How this is calculated</h2></div>
      <p class="muted" style="font-size:13px;max-width:62ch">Cost = hours open × the service’s full-outage cost per hour × an impact share. A major incident counts as ${IMPACT_W.major*100}% of a full outage, another P1 as ${IMPACT_W.P1*100}%, and a P2 as ${IMPACT_W.P2*100}%. P3 and P4 are not costed. The rates are illustrative: replace them with your own business impact analysis figures.</p>
      <div class="tablewrap"><table class="fit"><thead><tr><th>Service</th><th>Tier</th><th>Full outage per hour</th></tr></thead><tbody>
      ${SVC.map(s=>`<tr><td>${esc(s)}</td><td>${SVC_TIER[s]}</td><td class="num">${fmtMoney(SVC_COST[s])}</td></tr>`).join('')}</tbody></table></div></section>
  </div>`;
}
