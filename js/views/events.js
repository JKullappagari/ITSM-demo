/* Meridian Service Desk: Event monitoring view */
"use strict";
/* ---------- Event monitoring ---------- */
function viewEvents(){
  const f=ui2.ev;const now=Date.now();
  const rows=DB.events.filter(e=>(f.sev==='All'||e.sev===f.sev)&&(f.status==='All'||(f.status==='Active'?['Open','Acknowledged'].includes(e.status):e.status===f.status)));
  const d1=DB.events.filter(e=>e.time>=now-DAY);
  return `<div class="pagehead"><div><span class="eyebrow">Monitoring and event management</span><h1>Event console</h1><p>Alerts from monitoring tools are filtered and correlated. Only actionable critical events become incidents; the rest clear on their own.</p></div></div>
  ${miBanner()}
  <div class="tiles">${tile('Events, last 24 h',d1.length,'',`${d1.reduce((a,e)=>a+e.count,0)} raw alerts before de-duplication`)}${tile('Active',DB.events.filter(e=>['Open','Acknowledged'].includes(e.status)).length,'','need a decision',DB.events.some(e=>e.status==='Open'&&e.sev==='Critical')?'crit':'neutral')}${tile('Cleared automatically',pct(DB.events.filter(e=>e.status==='Cleared').length,DB.events.length),'%','noise filtered, last 7 days','ok')}${tile('Became incidents',DB.events.filter(e=>e.inc).length,'','last 7 days')}</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <div class="chips">${['All','Critical','Warning','Info'].map(s=>`<button class="chip" data-evsev="${s}" aria-pressed="${f.sev===s}">${s}</button>`).join('')}</div>
    <div class="seg">${['Active','Incident raised','Correlated','Cleared','All'].map(s=>`<button data-evst="${s}" aria-pressed="${f.status===s}">${s}</button>`).join('')}</div><span class="muted" style="font-size:12px">${rows.length} events</span></div>
  <div class="tablewrap"><table><thead><tr><th>Time</th><th>Severity</th><th>Configuration item</th><th>Event</th><th>Source</th><th>Status</th><th>Incident</th></tr></thead><tbody>
  ${rows.slice(0,80).map(e=>{const ci=get(e.ci);return `<tr class="click" data-open="${e.id}" tabindex="0"><td class="num" style="white-space:nowrap">${fmtDT(e.time)}</td><td><span class="sev sev-${e.sev}">${e.sev}</span></td><td><div class="mono">${esc(ci?ci.name:'')}</div><div class="t-meta">${esc(e.service)}</div></td><td>${esc(e.message)}${e.count>1?` <span class="t-meta">×${e.count}</span>`:''}</td><td class="t-meta">${esc(e.source)}</td><td><span class="pill st-${e.status==='Open'?'bad':e.status==='Acknowledged'?'hold':e.status==='Incident raised'?'prog':'closed'}">${e.status}</span></td><td class="mono">${e.inc||'—'}</td></tr>`}).join('')||'<tr><td colspan="7"><div class="empty">No events match.</div></td></tr>'}</tbody></table></div>`;
}
function openEvent(e){
  const ci=get(e.ci);
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono">${e.id}</span><h2>${esc(e.message)}</h2><div style="margin-top:6px;display:flex;gap:6px"><span class="sev sev-${e.sev}">${e.sev}</span><span class="pill st-${e.status==='Open'?'bad':e.status==='Incident raised'?'prog':'closed'}">${e.status}</span></div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <dl class="facts"><div><dt>Detected</dt><dd>${fmtDT(e.time)}</dd></div><div><dt>Source</dt><dd>${esc(e.source)}</dd></div><div><dt>Service</dt><dd>${esc(e.service)}</dd></div><div><dt>Occurrences</dt><dd>${e.count}</dd></div><div><dt>Configuration item</dt><dd><button class="linkchip" data-open="${e.ci}">${esc(ci?ci.name:e.ci)}</button></dd></div><div><dt>Incident</dt><dd>${e.inc?`<button class="linkchip" data-open="${e.inc}">${e.inc}</button>`:'—'}</dd></div></dl>
  ${['Open','Acknowledged','Correlated'].includes(e.status)?`<div class="actions"><button class="btn primary" data-evact="raise">Raise incident</button>${e.status==='Open'?'<button class="btn" data-evact="ack">Acknowledge</button>':''}<button class="btn" data-evact="clear">Clear as noise</button></div>`:''}
  <div class="calc muted" style="font-size:13px">Rule: critical events on a Tier 1 service raise an incident automatically. Repeats within 15 minutes are de-duplicated into one event.</div>`);
  markRec(e.id);
}

