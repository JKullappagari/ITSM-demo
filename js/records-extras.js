/* Meridian Service Desk: Record extras: tasks, replies, assignment, KCS knowledge form */
"use strict";
/* ---------- record extras: requests, replies, assignment ---------- */
function markRec(id){const d=$('#drawer');d.dataset.id=id;d.dataset.view='rec';openSave(id)}
function reqTasks(t){
  if(t.type!=='REQ'||!t.tasks||!t.tasks.length)return '';
  const d=t.tasks.filter(x=>x.status==='Done').length;const live=t.status==='Fulfilment';
  return `<div class="section" id="reqTasks"><div class="panel-head"><span class="eyebrow">Fulfilment tasks · ${d} of ${t.tasks.length} done</span>${!live&&isOpen(t)&&d<t.tasks.length?'<span class="muted" style="font-size:12px">Tasks open once the request is approved</span>':''}</div>
  <div class="list">${t.tasks.map((x,i)=>`<div class="li" style="cursor:default"><span class="pill st-${x.status==='Done'?'done':live?'prog':'new'}">${x.status==='Done'?'Done':live?'Open':'Waiting'}</span><div style="min-width:0"><div class="t-title">${esc(x.name)}</div><div class="t-meta"><span class="mono">${t.id}-T${i+1}</span> · ${esc(x.group)}${x.done?' · '+fmtDT(x.done):''}</div></div>${live&&x.status!=='Done'?`<button class="btn" data-act="task:${i}">Complete</button>`:'<span></span>'}</div>`).join('')}</div></div>`;
}
function prbInputs(t){
  if(t.type!=='PRB')return '';
  if(t.status==='Investigating')return `<div class="field" id="rcBox"><label for="rcSel">Root cause category</label><select id="rcSel">${ROOT_CAUSES.map(r=>`<option>${esc(r)}</option>`).join('')}</select></div>`;
  if(t.status==='Root cause found')return `<div class="field" id="waBox"><label for="waText">Workaround for the service desk</label><input type="text" id="waText" placeholder="What can the desk do until the permanent fix?"></div>`;
  return '';
}
function replyBox(t){
  if((t.type!=='INC'&&t.type!=='REQ')||t.status==='Closed')return '';
  const who=t.type==='INC'?t.caller:t.requestedFor;
  return `<div class="section" id="replyBox"><span class="eyebrow">Reply to ${esc(who||'caller')}</span><div style="display:flex;gap:8px;align-items:flex-start"><textarea id="replyText" placeholder="Write an update the caller will see" style="min-height:56px"></textarea><button class="btn" data-act="reply">Send</button></div></div>`;
}
function assignBox(t){
  if(t.type!=='INC'||!isOpen(t))return '';
  return `<div class="section" id="assignBox"><span class="eyebrow">Assignment</span><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="reassignGroup" style="flex:1;min-width:180px;width:auto" aria-label="Assignment group">${GROUPS.map(g=>`<option ${g===t.group?'selected':''}>${esc(g)}</option>`).join('')}</select><button class="btn" data-act="reassign">Reassign</button></div></div>`;
}
function csatFollow(t){
  if(!t.csat||t.csat.score>2)return '';
  return t.csat.followUp?'<div style="margin-top:8px"><span class="pill st-done">Called back</span></div>':'<div class="actions" style="margin-top:8px"><button class="btn" data-act="callback">Log call back to caller</button></div>';
}

/* ---------- knowledge (KCS structure) ---------- */
function kbClean(s){return String(s||'').replace(/^(Recurring|Root cause of major incident|Permanent fix): /i,'')}
function kbForm(from,noteIdx){
  const p=from?get(from):null;
  let v={title:'',cat:'Self-help',aud:'End users',svc:'—',issue:'',env:'',res:'',cause:''};
  if(p&&p.type==='PRB')v={title:'Known error: '+kbClean(p.title),cat:'Known error',aud:'IT staff',svc:p.service,issue:kbClean(p.title),env:p.service,res:p.workaround||'',cause:p.rootCause||''};
  if(p&&p.type==='INC'){
    const n=(noteIdx!=null&&p.notes[noteIdx])?p.notes[noteIdx]:(p.notes.filter(x=>x.cust).pop()||p.notes.filter(x=>x.who!=='Service Desk').pop());
    const ci=p.ci?get(p.ci):null;
    v={title:p.title,cat:'Self-help',aud:'End users',svc:p.service,issue:p.desc||p.title,env:p.service+(ci?' · '+ci.name:''),res:n?n.text:'',cause:''};
  }
  const opt=(arr,sel)=>arr.map(o=>{const a=Array.isArray(o)?o:[o,o];return `<option value="${esc(a[0])}" ${a[0]===sel?'selected':''}>${esc(a[1])}</option>`}).join('');
  return `<div class="dhead"><div><span class="eyebrow">New knowledge article</span><h2>${p?'Capture from '+p.id:'Write an article'}</h2></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <p class="muted" style="font-size:13px">KCS structure: the issue in the requester’s words, where it happens, how it was resolved, and the cause if known.</p>
  <form id="kbForm" ${from?`data-from="${from}"`:''}>
  <div class="field"><label for="k-title">Title</label><input type="text" id="k-title" required value="${esc(v.title)}"></div>
  <div class="row2"><div class="field"><label for="k-cat">Category</label><select id="k-cat">${opt(['Self-help','Resolver runbook','Known error','Process guide'],v.cat)}</select></div>
  <div class="field"><label for="k-aud">Audience</label><select id="k-aud">${opt([['End users','Clients and end users'],['IT staff','IT staff only']],v.aud)}</select></div></div>
  <div class="field"><label for="k-svc">Service</label><select id="k-svc">${opt(['—'].concat(SVC),v.svc)}</select></div>
  <div class="field"><label for="k-issue">Issue (in the requester’s words)</label><textarea id="k-issue">${esc(v.issue)}</textarea></div>
  <div class="field"><label for="k-env">Environment</label><input type="text" id="k-env" value="${esc(v.env)}"></div>
  <div class="field"><label for="k-res">Resolution</label><textarea id="k-res" style="min-height:110px">${esc(v.res)}</textarea></div>
  <div class="field"><label for="k-cause">Cause (optional)</label><input type="text" id="k-cause" value="${esc(v.cause)}"></div>
  <div class="actions"><button class="btn primary" type="submit">Submit for review</button><button class="btn ghost" type="button" data-close="1">Cancel</button></div></form>`;
}
function submitKb(form){
  const v=id=>form.querySelector('#'+id).value.trim();const from=form.dataset.from;const now=Date.now();
  DB.seq.KB=(DB.seq.KB||10500)+1;
  const k={kind:'KB',id:'KB'+String(DB.seq.KB).padStart(7,'0'),title:v('k-title')||'Untitled article',category:v('k-cat'),audience:v('k-aud'),service:v('k-svc'),status:'In review',author:'You (demo)',updated:now,views:0,helpful:100,
    issue:v('k-issue'),env:v('k-env'),resolution:v('k-res'),cause:v('k-cause'),steps:[],links:from?[from]:[],uses:0};
  DB.kb.push(k);IDX.set(k.id,k);
  if(from){const p=get(from);if(p){p.kb=k.id;p.notes.push({t:now,who:'You (demo)',text:`Knowledge article ${k.id} submitted for review`});if(p.type==='INC')k.uses=1}}
  save();render();toast(`${k.id} submitted for review`);openDetail(k.id);
}
function openKB(k){
  const linked=k.links.map(get).filter(Boolean);const used=DB.items.filter(t=>t.kb===k.id).sort((a,b)=>b.created-a.created);
  const body=k.issue?`<dl class="kcs">${[['Issue',k.issue],['Environment',k.env],['Resolution',k.resolution],['Cause',k.cause]].filter(x=>x[1]).map(([a,b])=>`<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join('')}</dl>`:`<ol class="kbsteps">${k.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`;
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono">${k.id} · ${esc(k.category)}</span><h2>${esc(k.title)}</h2><div style="margin-top:6px"><span class="pill st-${k.status==='Published'?'done':'hold'}">${k.status}</span></div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <div class="actions">${k.status!=='Published'?'<button class="btn primary" data-kbact="publish">Approve and publish</button>':''}<button class="btn" data-kbact="helpful">Mark helpful</button></div>
  <dl class="facts"><div><dt>Audience</dt><dd>${k.audience==='End users'?'Clients and end users':'IT staff only'}</dd></div><div><dt>Service</dt><dd>${esc(k.service)}</dd></div><div><dt>Author</dt><dd>${esc(k.author)}</dd></div><div><dt>Updated</dt><dd>${fmtD(k.updated)}</dd></div><div><dt>Views</dt><dd class="num">${k.views.toLocaleString()}</dd></div><div><dt>Helpful</dt><dd>${k.helpful}%</dd></div><div><dt>Used to resolve</dt><dd>${k.uses} incidents</dd></div></dl>
  <section class="section"><span class="eyebrow">Article</span>${body}</section>
  ${linked.length?`<div class="section"><span class="eyebrow">Source record</span><div class="links">${linked.map(l=>`<button class="linkchip" data-open="${l.id}">${l.id} ${pill(l)}</button>`).join('')}</div></div>`:''}
  <div class="section"><span class="eyebrow">Incidents resolved with this article (${used.length})</span>${used.length?`<div class="links">${used.slice(0,16).map(l=>`<button class="linkchip" data-open="${l.id}">${l.id}</button>`).join('')}</div>`:'<span class="muted" style="font-size:13px">Not used yet.</span>'}</div>`);
  markRec(k.id);
}


/* ---------- swarming on a major incident ---------- */
function swarmTeams(t){const sup=(SUPPLIERS.find(s=>s.services.includes(t.service))||{}).name;return GROUPS.filter(g=>g!=='Service Desk L1').concat(sup?['Supplier: '+sup]:[])}
function swarmBox(t){
  if(!isOpen(t))return t.swarm&&t.swarm.length?`<div class="t-meta">Swarm: ${t.swarm.map(esc).join(', ')}</div>`:'';
  const on=t.swarm||[];
  return `<div class="section" id="swarmBox"><span class="eyebrow">Swarm · ${on.length} team${on.length===1?'':'s'} on the bridge</span><div class="chips">${swarmTeams(t).map(g=>`<button class="chip" data-act="swarm:${esc(g)}" aria-pressed="${on.includes(g)}">${esc(g)}</button>`).join('')}</div><span class="muted" style="font-size:12px">Swarming pulls every team that might hold the answer onto one call at once, instead of passing the ticket from queue to queue.</span></div>`;
}
