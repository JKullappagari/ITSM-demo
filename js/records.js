/* Meridian Service Desk: Record drawer: create forms, detail view and lifecycle actions */
"use strict";
/* ---------- drawer ---------- */
let lastFocus=null;
function openDrawer(html){lastFocus=document.activeElement;const d=$('#drawer');if(d.hidden){d.classList.remove('opening');void d.offsetWidth;d.classList.add('opening')}d.innerHTML=html;d.dataset.view='form';d.hidden=false;$('#scrim').hidden=false;d.scrollTop=0;const f=d.querySelector('input,select,textarea,button');if(f)f.focus({preventScroll:true})}
function closeDrawer(){openSave(null);$('#drawer').hidden=true;$('#scrim').hidden=true;if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}}

function createForm(type,preset){
  preset=preset||{};
  const types=['INC','PRB','CHG','REQ','REL'];
  const svcOpts=sel=>(preset.client!=null?[FLOW_SVC]:SVC.concat(EXTRA_SVC)).map(s=>`<option ${s===sel?'selected':''}>${esc(s)}</option>`).join('');
  let body='';
  if(type==='INC'){
    const i=preset.impact||2,u=preset.urgency||2;
    body=`<div class="row2"><div class="field"><label for="f-caller">Caller</label><input type="text" id="f-caller" value="${esc(preset.caller||'Grace Yeo')}"></div>
      <div class="field"><label for="f-service">Affected service</label><select id="f-service">${svcOpts(preset.service||'Client Portal')}</select></div></div>
      <div class="field"><label for="f-title">Short description</label><input type="text" id="f-title" required value="${esc(preset.title||'')}" placeholder="What is the user experiencing?"></div>
      <div class="field"><label for="f-desc">Details</label><textarea id="f-desc" placeholder="Symptoms, number of users affected, error messages">${esc(preset.desc||'')}</textarea></div>
      <div class="row2"><div class="field"><label for="f-impact">Impact</label><select id="f-impact">${[1,2,3].map(v=>`<option value="${v}" ${v==i?'selected':''}>${v} – ${IMPACT[v]}${v===1?' (many users / critical service)':v===2?' (department / degraded)':' (single user)'}</option>`).join('')}</select></div>
      <div class="field"><label for="f-urgency">Urgency</label><select id="f-urgency">${[1,2,3].map(v=>`<option value="${v}" ${v==u?'selected':''}>${v} – ${URGENCY[v]}${v===1?' (business stopped)':v===2?' (workaround is hard)':' (can wait)'}</option>`).join('')}</select></div></div>
      <div class="calc" id="prioCalc"></div>
      <label class="check"><input type="checkbox" id="f-major"> <span>Declare as a major incident now (opens the major incident track and a bridge)</span></label>
      <div class="kehint" id="keHint" hidden></div>`;
  }else if(type==='PRB'){
    const pl=(preset.links||[]).map(get).filter(Boolean);const incs=pl.concat(DB.items.filter(t=>t.type==='INC'&&!pl.includes(t)).sort((a,b)=>b.created-a.created).slice(0,60));
    body=`<div class="field"><label for="f-title">Problem statement</label><input type="text" id="f-title" required value="${esc(preset.title||'')}" placeholder="e.g. Repeated VPN disconnects for remote users"></div>
      <div class="row2"><div class="field"><label for="f-service">Service</label><select id="f-service">${svcOpts(preset.service)}</select></div>
      <div class="field"><label for="f-prio">Priority</label><select id="f-prio">${['P1','P2','P3','P4'].map(p=>`<option ${p===(preset.priority||'P3')?'selected':''}>${p}</option>`).join('')}</select></div></div>
      <div class="field"><span class="lab">Linked incidents</span><div class="checklist">${incs.map(t=>`<label class="check"><input type="checkbox" name="link" value="${t.id}" ${(preset.links||[]).includes(t.id)?'checked':''}> <span><span class="mono">${t.id}</span> ${esc(t.title)} <span class="muted">· ${esc(t.service)}</span></span></label>`).join('')}</div></div>`;
  }else if(type==='CHG'){
    const dt=new Date(Date.now()+5*DAY);dt.setHours(20,0,0,0);
    const local=new Date(dt.getTime()-dt.getTimezoneOffset()*6e4).toISOString().slice(0,16);
    body=`${clientField(type,preset)}<div class="field"><label for="f-title">Change summary</label><input type="text" id="f-title" required value="${esc(preset.title||'')}" placeholder="e.g. Apply vendor patch 3.4.1 to payment workers"></div>
      <div class="row2"><div class="field"><label for="f-service">Service</label><select id="f-service">${svcOpts(preset.service)}</select></div>
      <div class="field"><label for="f-ctype">Change type</label><select id="f-ctype">${['Standard','Normal','Emergency'].map(c=>`<option ${c===(preset.changeType||'Normal')?'selected':''}>${c}</option>`).join('')}</select></div></div>
      <div class="row2"><div class="field"><label for="f-risk">Risk</label><select id="f-risk">${['Low','Medium','High'].map(c=>`<option ${c===(preset.risk||'Medium')?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="f-planned">Planned start</label><input type="datetime-local" id="f-planned" value="${local}"></div></div>
      <div class="field"><label for="f-desc">Implementation and back-out plan</label><textarea id="f-desc">${esc(preset.desc||'')}</textarea></div>
      <div class="calc muted" id="chgNote" style="font-size:13px"></div>`;
  }else if(type==='REQ'){
    body=`<div class="row2"><div class="field"><label for="f-item">Catalogue item</label><select id="f-item">${CATALOG.map(c=>`<option ${c.name===preset.item?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="f-for">Requested for</label><input type="text" id="f-for" value="Hui Min Koh"></div></div>
      <div class="field"><label for="f-desc">Notes</label><textarea id="f-desc" placeholder="Business justification, cost centre, start date"></textarea></div>
      <div class="calc" id="reqNote"></div>`;
  }else if(type==='REL'){
    const pl=(preset.links||[]).map(get).filter(Boolean);const cands=pl.concat(DB.items.filter(t=>t.type==='CHG'&&isOpen(t)&&!pl.includes(t)).sort((a,b)=>a.planned-b.planned).slice(0,30));
    const dt=new Date(Date.now()+21*DAY);
    body=`<div class="row2"><div class="field"><label for="f-title">Release name</label><input type="text" id="f-title" required placeholder="e.g. Client Portal 4.13" value="${esc(preset.title||'')}"></div>
      <div class="field"><label for="f-service">Service</label><select id="f-service">${svcOpts(preset.service)}</select></div></div>
      <div class="field"><label for="f-date">Target deployment date</label><input type="date" id="f-date" value="${preset.date||dt.toISOString().slice(0,10)}"></div>
      <div class="field"><span class="lab">Changes in this release</span><div class="checklist">${cands.map(t=>`<label class="check"><input type="checkbox" name="link" value="${t.id}" ${(preset.links||[]).includes(t.id)?'checked':''}> <span><span class="mono">${t.id}</span> ${esc(t.title)} <span class="muted">· ${fmtD(t.planned)}</span></span></label>`).join('')||'<span class="muted">No open changes.</span>'}</div></div>`;
  }
  return `<div class="dhead"><div><span class="eyebrow">New record</span><h2>Log ${TYPES[type].name.toLowerCase()}</h2></div><button class="x" data-close="1" aria-label="Close">×</button></div>
    <div class="seg" role="group" aria-label="Record type">${types.map(k=>`<button type="button" data-ctype="${k}" aria-pressed="${k===type}">${TYPES[k].name}</button>`).join('')}</div>
    <form id="createForm" data-type="${type}" ${preset.from?`data-from="${preset.from}"`:''} ${preset.evt?`data-evt="${preset.evt}"`:''} ${preset.ci?`data-ci="${preset.ci}"`:''} ${preset.fixFor?`data-fixfor="${preset.fixFor}" data-cfg="${preset.cfg}"`:''} ${preset.agent?`data-agent="${preset.agent}"`:''} ${preset.agentGoLive?'data-golive="1"':''}>${body}
      <div class="actions"><button class="btn primary" type="submit">Create ${TYPES[type].name.toLowerCase()}</button><button class="btn ghost" type="button" data-close="1">Cancel</button></div></form>`;
}
function updateCalc(){
  const pc=$('#prioCalc');
  if(pc){const i=$('#f-impact').value,u=$('#f-urgency').value;const p=prioOf(i,u);
    pc.innerHTML=`<span class="eyebrow">Calculated priority</span><span class="big">${prioTag(p)}</span><span>Respond within <b>${RESP[p]}</b> · resolve within <b>${SLA[p]} h</b></span>${p==='P1'?'<span class="tag mi">Major incident candidate</span>':''}`;
    const mj=$('#f-major');if(mj&&p==='P1'&&!mj.dataset.touched)mj.checked=true;if(mj&&p!=='P1'&&!mj.dataset.touched)mj.checked=false;}
  const cn=$('#chgNote');
  if(cn){const c=$('#f-ctype').value;cn.textContent=clientNote(c)||(c==='Standard'?'Standard changes are pre-approved and low risk. Creating one from its template schedules it straight away: no assessment and no CAB.':c==='Emergency'?'Emergency changes go to the Emergency CAB (ECAB) for fast approval, usually to restore service.':'Normal changes are risk-assessed and approved at the weekly Change Advisory Board.')}
  const rn=$('#reqNote');
  if(rn){const c=CATALOG.find(x=>x.name===$('#f-item').value);rn.innerHTML=`<span class="eyebrow">Fulfilment target</span><b class="mono">${c.target} h</b><span class="muted">${c.approval?'Needs line-manager approval first':'No approval needed'}</span>`}
}
function submitCreate(form){
  const type=form.dataset.type;const now=Date.now();const v=id=>{const e=form.querySelector('#'+id);return e?e.value.trim():''};
  const links=[...form.querySelectorAll('input[name=link]:checked')].map(i=>i.value);
  const from=form.dataset.from;if(from&&!links.includes(from))links.push(from);
  const t={id:newId(type),type,created:now,resolved:null,links,notes:[]};
  if(type==='INC'){
    Object.assign(t,{title:v('f-title')||'Untitled incident',service:v('f-service'),caller:v('f-caller'),impact:+v('f-impact'),urgency:+v('f-urgency'),status:'New',group:'Service Desk L1',assignee:'',desc:v('f-desc')});
    t.priority=prioOf(t.impact,t.urgency);
    t.notes.push({t:now,who:'Service Desk',text:`Logged by ${t.caller||'caller'}. Priority ${t.priority} (impact ${IMPACT[t.impact]}, urgency ${URGENCY[t.urgency]})`});
    if($('#f-major')&&$('#f-major').checked){t.major=true;t.majorStage='Declared';t.status='Assigned';t.group=GROUP_OF[t.service];t.assignee='Major Incident Manager';t.notes.push({t:now+1000,who:'Major Incident Manager',text:'Major incident: Declared'})}
  }else if(type==='PRB'){
    Object.assign(t,{title:v('f-title')||'Untitled problem',service:v('f-service'),priority:v('f-prio'),status:'Logged',group:GROUP_OF[v('f-service')],assignee:'',rootCause:null,knownError:false,workaround:''});
    t.notes.push({t:now,who:'Problem Manager',text:'Problem logged'+(links.length?` with ${links.length} linked record(s)`:'')});
  }else if(type==='CHG'){
    const pl=new Date(v('f-planned')).getTime();
    Object.assign(t,{title:v('f-title')||'Untitled change',service:v('f-service'),changeType:v('f-ctype'),risk:v('f-risk'),status:'Draft',group:GROUP_OF[v('f-service')],assignee:'',planned:isNaN(pl)?now+5*DAY:pl,outcome:null,desc:v('f-desc')});
    t.notes.push({t:now,who:'Change Manager',text:`Request for change raised (${t.changeType.toLowerCase()}, ${t.risk.toLowerCase()} risk)`});
    if(t.changeType==='Standard'){t.status='Scheduled';t.assignee=pick2(PEOPLE);t.notes.push({t:now+1000,who:'Change Manager',text:'Pre-approved standard change template: no assessment or CAB needed. Status changed to Scheduled'})}
  }else if(type==='REQ'){
    const item=v('f-item');const c=CATALOG.find(x=>x.name===item);
    Object.assign(t,{title:`${item} for ${v('f-for')||'requester'}`,item,requestedFor:v('f-for'),service:'Service catalogue',status:'Submitted',group:'Service Desk L1',assignee:'',approval:c.approval});
    t.tasks=(REQ_TASKS[item]||[]).map(([name,group])=>({name,group,status:'Open',done:null}));
    t.notes.push({t:now,who:t.requestedFor||'Requester',text:'Submitted from the service catalogue'});
  }else if(type==='REL'){
    const pl=new Date(v('f-date')+'T20:00').getTime();
    Object.assign(t,{title:v('f-title')||'Untitled release',service:v('f-service'),status:'Planning',group:GROUP_OF[v('f-service')],assignee:'Release Manager',planned:isNaN(pl)?now+21*DAY:pl});
    t.notes.push({t:now,who:'Release Manager',text:`Release planned with ${links.length} change(s)`});
  }
  if(type==='INC'||type==='CHG'){const app=DB.ci.find(c=>c.service===t.service&&c.cls==='Application');if(app)t.ci=app.id}
  if(form.dataset.ci)t.ci=form.dataset.ci;
  if(form.dataset.evt){const ev=get(form.dataset.evt);if(ev){ev.status='Incident raised';ev.inc=t.id;t.ci=ev.ci;t.events=[ev.id];t.notes.push({t:now,who:'Event management',text:`Raised from event ${ev.id}: ${ev.message}`})}}
  if(type==='INC'&&form.dataset.ke){const p=get(form.dataset.ke);if(p)applyKe(t,p,now+2000,'Service Desk')}
  extOnCreate(t,form);
  links.forEach(id=>{const o=get(id);if(o&&o.links&&!o.links.includes(t.id))o.links.push(t.id)});
  DB.items.push(t);IDX.set(t.id,t);
  feed(FEED_MOD[type],`${t.id} logged: ${t.title}${t.priority?' ('+t.priority+')':''}`,t.id);feedNotes(t,1);save();
  toast(`${t.id} created`);render();openDetail(t.id);
}

function stepperHtml(flow,status,mini){
  let idx=flow.indexOf(status);
  if(status==='On Hold')idx=flow.indexOf('In Progress');
  const bad=status==='Rejected';
  if(bad)idx=Math.max(1,flow.indexOf('CAB approval'),flow.indexOf('Approval'));
  return `<ol class="steps ${mini?'mini':''}">${flow.map((s,i)=>`<li class="${i<idx?'done':i===idx?(bad?'bad':'cur'):''}" title="${esc(s)}">${esc(s)}</li>`).join('')}</ol>`;
}
function detailActions(t){
  const a=[];const f=FLOW[t.type];const i=f.indexOf(t.status);const next=f[i+1];
  if(t.type==='INC'){
    if(t.status==='On Hold')a.push(['resume','Resume work','primary']);
    else if(next&&isOpen(t))a.push(['next',`Move to ${next}`,'primary']);
    else if(t.status==='Resolved')a.push(['next','Close (caller confirmed)','primary']);
    if(t.status==='In Progress')a.push(['hold','Put on hold','']);
    if(isOpen(t)&&!t.major)a.push(['declare','Declare major incident','danger']);
    if(t.status==='Resolved')a.push(['reopen','Reopen','']);
    if(isOpen(t)&&!t.escalated)a.push(['escalate','Escalate to duty manager','']);
    a.push(['raisePRB','Raise problem','']);a.push(['raiseCHG','Raise change','']);
  }else if(t.type==='CHG'){
    if(t.status==='CAB approval'){const c=cabTally(t);a.push(['approve',t.changeType==='Emergency'?'Approve at ECAB':'Approve at CAB'+(c.n?` (${c.yes} of ${c.n} votes for)`:''),'primary']);a.push(['reject','Reject','danger'])}
    else if(t.status==='Assessment'&&t.changeType==='Standard')a.push(['skipcab','Pre-approved: schedule','primary']);
    else if(t.status==='Implementing'){a.push(['out:Successful','Implemented successfully','primary']);a.push(['out:Failed','Failed','danger']);a.push(['out:Backed out','Backed out','danger'])}
    else if(next&&t.status!=='Rejected')a.push(['next',`Move to ${next}`,'primary']);
  }else if(t.type==='REQ'){
    if(t.status==='Approval'){a.push(['approve','Approve','primary']);a.push(['reject','Reject','danger'])}
    else if(t.status==='Submitted'&&!t.approval)a.push(['skipappr','Start fulfilment','primary']);
    else if(next&&t.status!=='Rejected'){const op=t.status==='Fulfilment'&&t.tasks&&t.tasks.some(x=>x.status!=='Done');a.push(['next',op?'Fulfil (finish the tasks first)':next==='Approval'?'Send for approval':`Move to ${next}`,'primary',op])}
  }else if(t.type==='PRB'){
    if(next)a.push(['next',f[i+1]==='Known error'?'Publish known error':`Move to ${next}`,'primary']);
    if(isOpen(t))a.push(['raiseCHG','Raise change for fix','']);
  }else if(t.type==='REL'){
    if(next)a.push(['next',`Move to ${next}`,'primary']);
  }
  return a;
}
function kbSection(t){
  if(t.type==='INC'){
    if(t.kb){const k=get(t.kb);return k?`<div class="section"><span class="eyebrow">Knowledge used</span><div class="links"><button class="linkchip" data-open="${k.id}">${k.id} <span style="font-family:var(--f-body)">${esc(k.title)}</span></button></div></div>`:''}
    if(!isOpen(t))return `<div class="calc"><span>Was this fix new? Capture it so the next person finds it.</span><button class="btn" data-newkb="1" data-from="${t.id}">Create knowledge article</button></div>`;
    const sug=DB.kb.filter(k=>k.status==='Published'&&k.service===t.service).sort((a,b)=>(b.category==='Resolver runbook')-(a.category==='Resolver runbook')||b.uses-a.uses).slice(0,3);
    if(!sug.length)return `<div class="section"><span class="eyebrow">Suggested knowledge</span><span class="muted" style="font-size:13px">No published articles for ${esc(t.service)} yet.</span></div>`;
    return `<div class="section"><span class="eyebrow">Suggested knowledge for ${esc(t.service)}</span><div class="list">${sug.map(k=>`<div class="li" style="cursor:default"><span class="mono" style="font-size:12px">${k.id}</span><div style="min-width:0"><div class="t-title">${esc(k.title)}</div><div class="t-meta">${esc(k.category)} · used ${k.uses} times</div></div><span class="actions"><button class="btn ghost" data-open="${k.id}">Read</button><button class="btn" data-act="kb:${k.id}">Apply</button></span></div>`).join('')}</div></div>`;
  }
  if(t.type==='PRB'){
    if(t.kb){const k=get(t.kb);return k?`<div class="section"><span class="eyebrow">Knowledge article</span><div class="links"><button class="linkchip" data-open="${k.id}">${k.id} <span style="font-family:var(--f-body)">${esc(k.title)}</span></button></div></div>`:''}
    if(t.knownError)return `<div class="calc"><span>This known error has no knowledge article yet, so the desk can't find the workaround.</span><button class="btn primary" data-newkb="1" data-from="${t.id}">Publish knowledge article</button></div>`;
  }
  return '';
}
function openDetail(id){
  const t=get(id);if(!t)return;
  if(t.kind==='CI')return openCI(t);
  if(t.kind==='KB')return openKB(t);
  if(t.kind==='EVT')return openEvent(t);
  if(t.kind==='AST')return openAsset(t);
  if(t.kind==='CSI')return openCSI(t);
  if(t.kind==='CLI')return openClient(t);
  if(t.kind==='AGT')return openAgent(t);
  const s=slaOf(t);
  const facts=[];
  facts.push(['Type',typeLabel(t)],['Service',t.service]);
  if(t.ci){const c=get(t.ci);if(c)facts.push(['Configuration item',`<button class="linkchip" data-open="${c.id}">${esc(c.name)}</button>`])}
  if(t.priority)facts.push(['Priority',prioTag(t.priority)]);
  if(t.type==='INC')facts.push(['Impact / urgency',`${IMPACT[t.impact]} / ${URGENCY[t.urgency]}`],['Caller',esc(t.caller)]);
  if(t.type==='CHG')facts.push(['Change type',t.changeType],['Risk',t.risk],['Planned start',fmtDT(t.planned)],['Outcome',t.outcome||'—']);
  if(t.type==='REQ')facts.push(['Catalogue item',esc(t.item)],['Requested for',esc(t.requestedFor)],['Approval',t.approval?'Required':'Not required']);
  if(t.asset){const a=get(t.asset);if(a)facts.push(['Laptop asset',`<button class="linkchip" data-open="${a.id}">${a.tag} · ${a.status}</button>`])}
  if(t.type==='PRB')facts.push(['Root cause',t.rootCause||'Under investigation'],['Known error',t.knownError?'Yes':'No']);
  if(t.type==='REL')facts.push(['Deployment',fmtDT(t.planned)],['Changes included',t.links.filter(l=>l.startsWith('CHG')).length]);
  saasFacts(t,facts);
  facts.push(['Assignment group',esc(t.group)],['Assigned to',esc(t.assignee||'Unassigned')],['Opened',fmtDT(t.created)]);
  if(t.resolved)facts.push([t.type==='REQ'?'Fulfilled':t.type==='CHG'?'Completed':'Resolved',fmtDT(t.resolved)]);
  if(t.type==='INC'&&costRate(t)>0)facts.push(['Downtime cost',costCell(t)]);
  if(s)facts.push(['SLA',`${isOpen(t)?slaBar(t):`<span class="sla ${s.state}">${esc(s.label)}</span>`} <span class="muted">(target ${s.target} h)</span>`]);
  const acts=detailActions(t);
  const mi=t.type==='INC'&&t.major?`<div class="mi-box"><div class="panel-head"><h3>Major incident track</h3><span class="muted" style="font-size:12px">Comms every 30 min · PIR within 5 business days</span></div>${stepperHtml(MI_FLOW,t.majorStage||'Declared')}${swarmBox(t)}
    ${MI_FLOW.indexOf(t.majorStage)<MI_FLOW.length-1?`<div class="actions"><button class="btn danger" data-act="mi">Advance to: ${MI_FLOW[MI_FLOW.indexOf(t.majorStage)+1]}</button></div>`:`<div class="actions"><span class="muted" style="font-size:13px;align-self:center">Post-incident review complete.</span>${csiFromBtn(t)}</div>`}</div>`:'';
  const ke=t.type==='PRB'&&t.knownError&&t.workaround?`<div class="calc"><span class="tag ke">Known error</span><span><b>Workaround:</b> ${esc(t.workaround)}</span></div>`:'';
  const links=t.links.map(get).filter(Boolean);
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono" style="letter-spacing:.02em">${t.id} ${t.major?'<span class="tag mi">Major incident</span>':''}</span><h2>${esc(t.title)}</h2><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${pill(t)}${t.escalated?'<span class="tag mi">Escalated</span>':''}${keBadge(t)}${t.reopened?'<span class="tag">Reopened</span>':''}</div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
    <div class="section"><span class="eyebrow">${TYPES[t.type].name} lifecycle</span>${stepperHtml(FLOW[t.type],t.status)}</div>
    ${acts.length?`<div class="actions">${acts.map(([k,l,c,dis])=>`<button class="btn ${c}" data-act="${k}" ${dis?'disabled':''}>${esc(l)}</button>`).join('')}</div>`:''}
    ${prbInputs(t)}${riskBox(t)}${cabBox(t)}${mi}${ke}${reqTasks(t)}${saasBox(t)}
    <dl class="facts">${facts.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    ${t.desc?`<div class="section"><span class="eyebrow">Details</span><p>${esc(t.desc)}</p></div>`:''}
    ${keSection(t)}${kbSection(t)}
    ${t.csat?`<div class="section" id="csatBox"><span class="eyebrow">Customer satisfaction survey</span><div class="quote"><span class="stars" aria-label="${t.csat.score} out of 5">${'★'.repeat(t.csat.score)}${'☆'.repeat(5-t.csat.score)}</span> <b>${t.csat.score}/5</b>${t.csat.comment?` · “${esc(t.csat.comment)}”`:''}</div>${csatFollow(t)}</div>`:''}
    ${t.events&&t.events.length?`<div class="section"><span class="eyebrow">Raised from monitoring events</span><div class="links">${t.events.map(get).filter(Boolean).map(e=>`<button class="linkchip" data-open="${e.id}">${e.id} <span class="sev sev-${e.sev}">${e.sev}</span></button>`).join('')}</div></div>`:''}
    <div class="section"><span class="eyebrow">Linked records (${links.length})</span>${links.length?`<div class="links">${links.map(l=>`<button class="linkchip" data-open="${l.id}">${l.id} <span style="font-family:var(--f-body)">${pill(l)}</span></button>`).join('')}</div>`:'<span class="muted" style="font-size:13px">None yet.</span>'}</div>
    ${assignBox(t)}${replyBox(t)}
    <div class="section"><span class="eyebrow">Work notes and history</span>
      <div style="display:flex;gap:8px;align-items:flex-start"><textarea id="noteText" placeholder="Add a work note" style="min-height:44px"></textarea><button class="btn" data-act="note">Add</button></div>
      <ul class="timeline">${t.notes.map((n,ix)=>[n,ix]).sort((a,b)=>b[0].t-a[0].t).map(([n,ix])=>`<li><div class="when">${fmtDT(n.t)} · ${esc(n.who)}${n.cust?' · <span class="tag">Sent to caller</span>':''}</div><div>${esc(n.text)}</div>${n.cust&&t.type==='INC'?`<button class="btn ghost" style="margin-top:6px" data-newkb="1" data-from="${t.id}" data-note="${ix}">Create knowledge article from this reply</button>`:''}</li>`).join('')}</ul></div>`);
  markRec(t.id);
}
function act(id,k){
  const t=get(id);if(!t)return;const now=Date.now();const me='You (demo)';
  const log=txt=>t.notes.push({t:now,who:me,text:txt});
  const f=FLOW[t.type];const i=f.indexOf(t.status);
  const n0=t.notes.length,s0=t.status;let rip=null;
  const setStatus=s=>{t.status=s;log(`Status changed to ${s}`);
    if(CLOSED[t.type].includes(s)&&!t.resolved)t.resolved=now;
    if(!t.assignee&&!['New','Submitted','Draft','Logged'].includes(s)){t.assignee=pick2(PEOPLE);if(t.group==='Service Desk L1'&&t.type==='INC')t.group=GROUP_OF[t.service]||t.group}};
  if(k==='next'){if(gateNext(t,f[i+1])===false)return;if(t.type==='REQ'&&f[i+1]==='Fulfilled'&&t.tasks&&t.tasks.some(x=>x.status!=='Done')){toast('Complete all fulfilment tasks first');return}
    if(t.type==='PRB'){const nx=f[i+1];if(nx==='Root cause found'){const rs=$('#rcSel');t.rootCause=rs?rs.value:(t.rootCause||ROOT_CAUSES[0]);log(`Root cause identified: ${t.rootCause}`)}if(nx==='Known error'){const w=$('#waText');t.knownError=true;t.workaround=(w&&w.value.trim())||t.workaround||WORKAROUNDS[0];log(`Known error published. Workaround: ${t.workaround}`)}}
    if(t.type==='CHG'&&t.status==='Assessment')applyRisk(t,log);
    setStatus(f[i+1])}
  else if(k==='resume')setStatus('In Progress');
  else if(k==='hold'){t.status='On Hold';log('Put on hold, awaiting caller')}
  else if(k==='declare'){t.major=true;t.majorStage='Declared';t.priority='P1';t.impact=1;t.urgency=1;if(t.status==='New')setStatus('Assigned');log('Major incident: Declared. Priority raised to P1')}
  else if(k==='mi'){const n=MI_FLOW[MI_FLOW.indexOf(t.majorStage)+1];t.majorStage=n;log(`Major incident: ${n}`);if(n==='Bridge open'&&t.status!=='In Progress'&&isOpen(t))setStatus('In Progress');if(n==='Service restored'&&isOpen(t))setStatus('Resolved')}
  else if(k.startsWith('vote:')){castVote(t,k,log);feedNotes(t,n0);save();const st=$('#drawer').scrollTop;openDetail(id);$('#drawer').scrollTop=st;return}
  else if(k.startsWith('ke:')){const p=get(k.slice(3));if(p)applyKe(t,p,now,me)}
  else if(k==='approve'){const c=cabTally(t);log(t.type==='CHG'?(t.changeType==='Emergency'?'Approved at emergency CAB':'Approved at CAB'+(c.n?` (votes: ${c.yes} approve, ${c.no} reject, ${c.n-c.yes-c.no} abstain)`:'')):'Approved by line manager');setStatus(t.type==='CHG'?'Scheduled':'Fulfilment')}
  else if(k==='reject'){const c=cabTally(t);log('Rejected'+(t.type==='CHG'&&c.n?` (votes: ${c.yes} approve, ${c.no} reject)`:''));t.status='Rejected';t.resolved=now}
  else if(k==='skipcab'){log('Pre-approved standard change');setStatus('Scheduled')}
  else if(k==='skipappr')setStatus('Fulfilment');
  else if(k.startsWith('out:')){t.outcome=k.slice(4);log(`Implemented. Outcome: ${t.outcome}`);setStatus('Review')}
  else if(k==='raisePRB'){openDrawer(createForm('PRB',{title:'Recurring: '+t.title.toLowerCase(),service:t.service,priority:t.priority==='P1'?'P1':'P2',links:[t.id],from:t.id}));bindCreate();return}
  else if(k==='raiseCHG'){openDrawer(createForm('CHG',{title:'Permanent fix: '+t.title.replace(/^Recurring: /,''),service:t.service,changeType:t.major?'Emergency':'Normal',risk:'Medium',from:t.id}));bindCreate();return}
  else if(k.startsWith('roll:')||k.startsWith('cr:')){if(saasAct(t,k,log,now)===false)return}
  else if(k.startsWith('task:')){const x=t.tasks&&t.tasks[+k.slice(5)];if(x&&x.status!=='Done'){x.status='Done';x.done=now;log(`Task completed: ${x.name} (${x.group})`);assetOnTask(t,x)}}
  else if(k.startsWith('swarm:')){const g=k.slice(6);t.swarm=t.swarm||[];if(t.swarm.includes(g)){t.swarm=t.swarm.filter(x=>x!==g);log(`${g} left the swarm`)}else{t.swarm.push(g);log(`${g} joined the swarm on the bridge`)}}
  else if(k==='reply'){const tx=($('#replyText')||{}).value;if(!tx||!tx.trim()){toast('Write the reply first');return}t.notes.push({t:now,who:me,text:tx.trim(),cust:true})}
  else if(k==='reassign'){const g=($('#reassignGroup')||{}).value;if(!g||g===t.group){toast('Pick a different group');return}t.group=g;t.assignee=pick2(PEOPLE);log(`Reassigned to ${g}`)}
  else if(k==='escalate'){t.escalated=true;log('Escalated to the duty incident manager: SLA at risk')}
  else if(k==='callback'){if(t.csat)t.csat.followUp=true;log('Called the caller back about their satisfaction score')}
  else if(k==='reopen'){t.status='In Progress';t.resolved=null;t.reopened=(t.reopened||0)+1;log('Reopened: caller confirms the issue is not fixed')}
  else if(k.startsWith('kb:')){const a=get(k.slice(3));if(a){t.kb=a.id;a.uses++;log(`Applied knowledge article ${a.id}: ${a.title}`)}}
  else if(k==='note'){const tx=$('#noteText').value.trim();if(!tx)return;log(tx)}
  feedNotes(t,n0);maintFeed(t,s0);
  /* Ripple effects into other modules */
  if(k.startsWith('out:'))rip=rippleChange(t,now);
  if(k==='out:Successful'){if(t.client)rip=clientChangeDone(t,now)||rip;if(t.agent)rip=aiChangeDone(t,now)||rip}
  if(t.type==='PRB'&&s0!==t.status&&t.status==='Resolved'){const n=rippleProblem(t,now);if(n)rip=`${t.id} resolved: ${n} linked incident${n>1?'s':''} resolved too`}
  if(t.type==='PRB'&&s0!=='Known error'&&t.status==='Known error'){t.keAt=now;rip=`${keId(t)} added to the known error database`;feed('KEDB',`${keId(t)} added: ${kbClean(t.title)}. Workaround: ${t.workaround}`,t.id)}
  save();render();openDetail(id);if(k!=='note')toast(rip||(k==='reply'?'Reply sent to caller':`${t.id} updated`));
}
let p2=0;function pick2(a){p2=(p2+3)%a.length;return a[p2]}
function bindCreate(){const f=$('#createForm');if(!f)return;updateCalc();keHint();}

