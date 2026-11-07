/* Meridian Service Desk: Service Desk work queue */
"use strict";
/* ---------- Service Desk view ---------- */
function liveMI(){return DB.items.filter(t=>t.type==='INC'&&t.major&&isOpen(t))}
function miBanner(){
  return liveMI().map(t=>`<div class="banner"><span class="pulse" aria-hidden="true"></span><div class="grow"><b>Major incident in progress</b> · <span class="mono">${t.id}</span> · ${esc(t.title)} <span class="muted">— ${esc(t.service)}, open ${ageText(t.created)}, stage: ${esc(t.majorStage||'Declared')}</span></div><button class="btn" data-open="${t.id}">Open bridge record</button></div>`).join('');
}
function deskRows(){
  const d=ui.desk;const q=d.q.trim().toLowerCase();
  let rows=DB.items.filter(t=>{
    if(d.type==='MI'){if(!(t.type==='INC'&&t.major))return false}
    else if(d.type!=='ALL'&&t.type!==d.type)return false;
    if(d.scope==='open'&&!isOpen(t))return false;
    if(d.scope==='closed'&&isOpen(t))return false;
    if(q&&!(t.id.toLowerCase().includes(q)||t.title.toLowerCase().includes(q)||(t.service||'').toLowerCase().includes(q)||(t.assignee||'').toLowerCase().includes(q)))return false;
    return true;
  });
  rows.sort((a,b)=>b.created-a.created);
  return rows;
}
function viewDesk(){
  const d=ui.desk;
  const openCount=k=>DB.items.filter(t=>isOpen(t)&&(k==='ALL'||(k==='MI'?t.type==='INC'&&t.major:t.type===k))).length;
  const chips=[['ALL','All'],['INC','Incidents'],['MI','Major incidents'],['PRB','Problems'],['CHG','Changes'],['REQ','Requests'],['REL','Releases']];
  const rows=deskRows();const shown=rows.slice(0,d.limit);
  return `
  <div class="pagehead"><div><span class="eyebrow">Service Desk</span><h1>Work queue</h1><p>Log and work incidents, problems, changes, service requests and releases. Open any record to move it through its lifecycle.</p></div>
    <div class="actions"><button class="btn primary" data-new="INC">+ New record</button><button class="btn" data-kedb="1">Search known errors</button></div></div>
  ${miBanner()}
  <div class="walk"><div><h3>Learn by doing: guided walkthroughs</h3><p class="muted" style="margin-top:4px">${TOURS.length} real scenarios, from a major incident to a monthly service review. A coach explains each step and highlights where to click.</p></div><div class="walk-actions"><button class="btn primary" data-tourstart="mi">Start: major incident</button><a class="btn" href="#walkthroughs">All walkthroughs</a></div></div>
  <div style="display:flex;flex-direction:column;gap:10px">
    <div class="chips" role="group" aria-label="Record type">${chips.map(([k,l])=>`<button class="chip" data-ftype="${k}" aria-pressed="${d.type===k}">${l} <b>${openCount(k)}</b></button>`).join('')}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <div style="flex:1;min-width:200px;max-width:380px"><input type="search" id="deskSearch" placeholder="Search ID, title, service or assignee" value="${esc(d.q)}" aria-label="Search records"></div>
      <div class="seg" role="group" aria-label="State">${[['open','Open'],['closed','Resolved / closed'],['all','All']].map(([k,l])=>`<button data-scope="${k}" aria-pressed="${d.scope===k}">${l}</button>`).join('')}</div>
      <span class="muted" style="font-size:12px">${rows.length} records</span>
    </div>
  </div>
  <div class="tablewrap"><table><thead><tr><th>ID</th><th>Summary</th><th>Service</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Opened</th><th>SLA / target</th></tr></thead><tbody>
  ${shown.map(t=>`<tr class="click" tabindex="0" data-open="${t.id}"><td class="mono">${t.id}</td><td><div class="t-title">${esc(t.title)}</div><div class="t-meta">${typeLabel(t)}${t.type==='CHG'?' · '+t.changeType+' · '+t.risk+' risk':''}${t.major?' <span class="tag mi">MI</span>':''}</div></td><td>${esc(t.service)}</td><td>${t.priority?prioTag(t.priority):'<span class="muted">—</span>'}</td><td>${pill(t)}</td><td><div>${esc(t.group)}</div><div class="t-meta">${esc(t.assignee||'Unassigned')}</div></td><td class="num" style="white-space:nowrap">${fmtDT(t.created)}</td><td>${slaCell(t)}</td></tr>`).join('')||'<tr><td colspan="8"><div class="empty">No records match these filters.</div></td></tr>'}
  </tbody></table></div>
  ${rows.length>shown.length?`<div><button class="btn" data-more="1">Show ${Math.min(40,rows.length-shown.length)} more</button></div>`:''}`;
}

