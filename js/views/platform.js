/* Meridian Service Desk: Client platform (software as a service): clients, quarterly upgrades and client change requests */
"use strict";
/* Meridian hosts "Meridian Flow", a data automation and reconciliation platform, for external clients.
   Everything here is fictional: the product, the clients and their contracts. */
const FLOW_SVC='Meridian Flow';
const EXTRA_SVC=[FLOW_SVC,'AI Platform'];
SERVICES[FLOW_SVC]=['Reconciliation run not completing','Client users unable to sign in to Meridian Flow','Break report missing rows','API file upload rejected'];
SERVICES['AI Platform']=['AI assistant not responding','AI suggestions missing from new tickets','AI gateway timing out'];
Object.assign(GROUP_OF,{[FLOW_SVC]:'Platform Engineering','AI Platform':'AI Platform Team'});
GROUPS.push('Platform Engineering','AI Platform Team');
Object.assign(SVC_TIER,{[FLOW_SVC]:'Tier 1','AI Platform':'Tier 2'});
Object.assign(SVC_COST,{[FLOW_SVC]:40000,'AI Platform':3000});

const FLOW_VERSIONS=[['2026.1',-262],['2026.2',-171],['2026.3',-80],['2026.4',-8]];
const FLOW_CUR=FLOW_VERSIONS[FLOW_VERSIONS.length-1][0];
/* Support policy: the current version and the two before it (N-2). */
function supportOf(v){
  const gap=FLOW_VERSIONS.length-1-FLOW_VERSIONS.findIndex(x=>x[0]===v);
  return gap===0?{k:'ok',label:'Current'}:gap===1?{k:'ok',label:'Supported'}:gap===2?{k:'risk',label:'Last supported version'}:{k:'breached',label:'Out of support'};
}
const supTag=v=>{const s=supportOf(v);return `<span class="sla ${s.k}">${s.label}</span>`};
const PLAN={Enterprise:{p1:'Respond 15 min · restore 2 h',cr:2,avail:'99.95%'},Premium:{p1:'Respond 15 min · restore 4 h',cr:2,avail:'99.95%'},Standard:{p1:'Respond 1 h · restore 8 h',cr:5,avail:'99.9%'}};
const ROLL=['Notified','Test environment upgraded','Client testing','Signed off','Production upgraded'];
const ROLL_BTN={'Notified':'Upgrade test environment','Test environment upgraded':'Start client testing','Client testing':'Record client sign-off','Signed off':'Upgrade production'};
const CR_STEPS=[['est','Estimate the effort and send a quote'],['quote','Client accepts the quote'],['build','Build and test in the client’s test environment'],['uat','Client signs off user acceptance testing']];
const CR_KINDS=[
  {k:'Standard',name:'Configuration change',cls:'ok',what:'A setting the platform already supports: a matching rule, a tolerance, a report schedule, a user role. It comes from the approved configuration catalogue, so it is pre-approved.',
   steps:['Client raises it','Scheduled straight away','Applied in the client’s window','Re-checked at each upgrade'],cost:'Included in the subscription',lead:'2 to 5 business days, by contract'},
  {k:'Normal',name:'Custom workflow change',cls:'info',what:'New behaviour built for one client: a custom script, an adapter or an extra approval step. It is assessed, quoted, built in the client’s test environment and signed off by the client before CAB.',
   steps:['Estimate and quote','Client accepts','Build in client test','Client sign-off','CAB','Implement in window'],cost:'Chargeable, quoted per change',lead:'2 to 6 weeks'}];

/* ---------- sample data ---------- */
function saasSeed(D,now){
  const sq=t=>{D.seq[t]=(D.seq[t]||1000)+1;return t+String(D.seq[t]).padStart(7,'0')};
  const ver=FLOW_VERSIONS.map(x=>x[0]);const ga=v=>now+FLOW_VERSIONS.find(x=>x[0]===v)[1]*DAY;
  const S=[['CLI-01','Harbourline Bank','Premium','United Kingdom','2026.3','Sat 22:00–02:00 UK','L. Chen',420,
      [['Nostro matching rules (14 rules)','Configuration'],['GBP payment break report, daily at 06:30','Configuration'],['Auto-close breaks under £5 with an audit note','Custom workflow']]],
    ['CLI-02','Alder & Finch Asset Management','Standard','United Kingdom','2026.4','Sun 06:00–10:00 UK','K. Nair',95,
      [['Fund accounting matching rules (9 rules)','Configuration'],['Weekly ageing report','Configuration']]],
    ['CLI-03','Northgate Securities','Premium','Singapore','2026.3','Sat 23:00–03:00 SGT','A. Tan',260,
      [['Trade confirmation matching rules (22 rules)','Configuration'],['SGX settlement file adapter','Custom workflow']]],
    ['CLI-04','Calder Mutual','Standard','Ireland','2026.2','Sun 05:00–09:00 IE','K. Nair',140,
      [['Premium collections matching rules (6 rules)','Configuration']]],
    ['CLI-05','Pinecrest Fund Services','Enterprise','Luxembourg','2026.3','Sat 21:00–01:00 CET','L. Chen',610,
      [['NAV reconciliation rules (31 rules)','Configuration'],['NAV pre-check script','Custom workflow','2026.4'],['Transfer agency file splitter','Custom workflow']]],
    ['CLI-06','Solent Pensions Trust','Standard','United Kingdom','2026.1','Sun 06:00–10:00 UK','M. Lim',60,
      [['Contribution matching rules (5 rules)','Configuration']]]];
  D.clients=S.map(([id,name,plan,region,version,window,csm,users,cfg],i)=>{
    const since=now-(900-i*110)*DAY;
    const hist=ver.slice(0,ver.indexOf(version)+1).map(v=>({v,at:Math.max(since,ga(v)+(5+i*3)*DAY)}));
    return {kind:'CLI',id,name,plan,region,version,base:version,window,csm,users,since,history:hist,links:[],
      configs:cfg.map(([n,k,breaks],j)=>({name:n,kind:k,added:since+(j*40+20)*DAY,breaks:breaks||null,fixed:null})),
      notes:[{t:since,who:csm,text:`Client onboarded on the ${plan} plan`}]};
  });
  const cl=id=>D.clients.find(c=>c.id===id);
  const app={kind:'CI',env:'Production',status:'In use',deps:[],cap:null,warranty:null};
  const ci=(n,o)=>Object.assign({},app,{id:'CI'+String(2100+n).padStart(6,'0')},o);
  const flowApp=ci(1,{name:'flow-app',cls:'Application',service:FLOW_SVC,owner:'Platform Engineering',location:'Cloud – Europe West',supplier:'Northbridge Cloud',version:FLOW_CUR});
  const flowS1=ci(2,{name:'flow-app-01',cls:'Server',service:FLOW_SVC,owner:'Infrastructure',location:'Cloud – Europe West',supplier:'Northbridge Cloud',version:'Ubuntu 22.04',cap:{cpu:58,mem:66,disk:41,growth:2.2},warranty:now+400*DAY});
  const flowS2=ci(3,{name:'flow-app-02',cls:'Server',service:FLOW_SVC,owner:'Infrastructure',location:'Cloud – Europe West',supplier:'Northbridge Cloud',version:'Ubuntu 22.04',cap:{cpu:54,mem:61,disk:39,growth:2.2},warranty:now+400*DAY});
  const flowDb=ci(4,{name:'flow-db-01',cls:'Database',service:FLOW_SVC,owner:'Data Platform',location:'Cloud – Europe West',supplier:'Northbridge Cloud',version:'PostgreSQL 16',cap:{cpu:47,mem:72,disk:63,growth:3.1},warranty:now+520*DAY});
  flowApp.deps=[flowS1.id,flowS2.id,flowDb.id];
  const aiGw=ci(5,{name:'ai-gateway',cls:'Application',service:'AI Platform',owner:'AI Platform Team',location:'Cloud – Southeast Asia',supplier:'Northbridge Cloud',version:'1.8'});
  const aiS=ci(6,{name:'ai-gateway-01',cls:'Server',service:'AI Platform',owner:'Infrastructure',location:'Cloud – Southeast Asia',supplier:'Northbridge Cloud',version:'Ubuntu 22.04',cap:{cpu:39,mem:52,disk:28,growth:5.4},warranty:now+600*DAY});
  aiGw.deps=[aiS.id];
  D.ci.push(flowApp,flowS1,flowS2,flowDb,aiGw,aiS);
  const note=(t,who,text)=>({t,who,text});
  const chg=(client,title,ctype,status,daysAgo,outcome,extra)=>{
    const c=cl(client);const created=now-daysAgo*DAY;const planned=now+(status==='Scheduled'?2:status==='Assessment'||status==='Draft'?14:-(daysAgo-6))*DAY;
    const t=Object.assign({id:sq('CHG'),type:'CHG',title:`${c.name}: ${title}`,service:FLOW_SVC,client,changeType:ctype,risk:ctype==='Standard'?'Low':'Medium',status,group:'Platform Engineering',assignee:c.csm,created,planned,
      resolved:['Closed','Rejected'].includes(status)?planned+3*HR:null,outcome:outcome||null,links:[],ci:flowApp.id,notes:[note(created,c.name,`Client change request raised (${ctype==='Standard'?'configuration':'custom workflow'})`)]},extra||{});
    if(ctype==='Standard')t.notes.push(note(created+HR,'Change Manager','Pre-approved configuration change: scheduled in the client’s window'));
    if(outcome)t.notes.push(note(t.resolved,t.assignee,`Implemented. Outcome: ${outcome}`));
    D.items.push(t);c.links.push(t.id);return t;
  };
  chg('CLI-01','add a GBP 0.01 matching tolerance for FX breaks','Standard','Scheduled',1);
  chg('CLI-03','new break category for failed SGX settlements','Normal','Assessment',6,null,{cr:{est:'3 days · chargeable (S$4,800)',quote:true}});
  chg('CLI-02','move the daily ageing report to 07:00','Standard','Closed',24,'Successful');
  chg('CLI-04','read-only role for the internal audit team','Standard','Closed',41,'Successful');
  const tas=chg('CLI-05','custom transfer agency file splitter','Normal','Closed',70,'Successful',{cr:{est:'8 days · chargeable (S$12,800)',quote:true,build:true,uat:true}});
  cl('CLI-05').configs[2].chg=tas.id;
  const rej=chg('CLI-06','custom contribution import from the payroll provider','Normal','Rejected',33,null,{cr:{est:'6 days · chargeable (S$9,600)'}});
  rej.notes.push(note(rej.resolved,'Solent Pensions Trust','Quote declined: the client will use the standard file format instead'));
  /* the quarterly upgrade, part-way through its rollout */
  const rel={id:sq('REL'),type:'REL',title:`${FLOW_SVC} ${FLOW_CUR} quarterly upgrade`,service:FLOW_SVC,platform:true,version:FLOW_CUR,status:'Deploy',group:'Platform Engineering',assignee:'Release Manager',
    created:now-48*DAY,planned:now+9*DAY,resolved:null,links:[],ci:flowApp.id,
    notes:[note(now-48*DAY,'Release Manager','Release scope agreed: 41 fixes, 6 features, new reconciliation API v3'),note(now-30*DAY,'Release Manager','Release notes sent to all clients; 30-day notice period starts'),note(now-8*DAY,'Release Manager',`${FLOW_CUR} generally available`)]};
  rel.rollout=rolloutStart(now);
  D.items.push(rel);D.clients.forEach(c=>c.links.push(rel.id));
}
function rolloutStart(now){
  const r={};const st={'CLI-01':'Signed off','CLI-02':'Production upgraded','CLI-03':'Client testing','CLI-04':'Notified','CLI-05':'Client testing','CLI-06':'Notified'};
  Object.entries(st).forEach(([id,s])=>r[id]={stage:s,at:now-(ROLL.length-ROLL.indexOf(s))*2*DAY,deferred:false});
  return r;
}
const platformRel=()=>DB.items.filter(t=>t.type==='REL'&&t.platform).sort((a,b)=>b.created-a.created)[0];
/* Configurations that break on a version and have not been fixed yet. */
const regressions=(c,v)=>c.configs.map((x,i)=>Object.assign({i},x)).filter(x=>x.breaks===v&&x.fixed!==v);
const clientChanges=c=>DB.items.filter(t=>t.type==='CHG'&&t.client===c.id).sort((a,b)=>b.created-a.created);

/* ---------- view ---------- */
function viewPlatform(){
  const now=Date.now(),C=DB.clients,rel=platformRel();
  const crs=DB.items.filter(t=>t.type==='CHG'&&t.client);const open=crs.filter(isOpen);
  const r=rel&&rel.rollout;const done=r?C.filter(c=>r[c.id]&&r[c.id].stage==='Production upgraded').length:0;
  const oos=C.filter(c=>supportOf(c.version).k==='breached');
  const crRow=t=>{const c=get(t.client);return `<div class="li" data-open="${t.id}" tabindex="0"><span class="tag">${t.changeType==='Standard'?'Configuration':'Custom'}</span><div style="min-width:0"><div class="t-title">${esc(t.title)}</div><div class="t-meta"><span class="mono">${t.id}</span> · ${esc(c?c.plan:'')} · ${t.outcome?esc(t.outcome):fmtD(t.planned)}</div></div>${pill(t)}</div>`};
  return `<div class="pagehead"><div><span class="eyebrow">Software as a service · release and change for external clients</span><h1>Client platform</h1><p>Meridian runs <b>Meridian Flow</b>, a reconciliation and data automation platform, for external clients. One shared product gets a quarterly upgrade that every client has to take, and each client asks for its own configuration and custom changes. The product and clients are fictional.</p></div>
    <div class="actions"><button class="btn primary" data-newcr="">+ Client change request</button><button class="btn" data-tourstart="upgrade">Walk through an upgrade</button><button class="btn" data-tourstart="clientcr">Walk through a client change</button></div></div>
  <div class="tiles">${tile('Clients',C.length,'',`${C.reduce((a,c)=>a+c.users,0).toLocaleString('en-GB')} users`)}${tile('On the current version',C.filter(c=>c.version===FLOW_CUR).length,'/'+C.length,FLOW_CUR,'neutral')}${tile('Out of support',oos.length,'',oos.length?oos.map(c=>c.name.split(' ')[0]).join(', '):'all clients supported',oos.length?'crit':'ok')}${tile('Open client changes',open.length,'',`${open.filter(t=>t.changeType==='Normal').length} custom, ${open.filter(t=>t.changeType==='Standard').length} configuration`)}</div>
  ${rel?`<section class="panel" id="flowRollout"><div class="panel-head"><h2>Upgrade rollout: ${esc(rel.title)}</h2><span class="muted">${done} of ${C.length} clients in production · release ${pill(rel)}</span></div>
    <div class="tablewrap"><table><thead><tr><th>Client</th><th>Plan</th><th>Running</th><th>Rollout stage</th><th>Production window</th><th>Note</th></tr></thead><tbody>
    ${C.map(c=>{const x=r[c.id]||{stage:'Notified'};const rg=regressions(c,rel.version);return `<tr class="click" data-open="${rel.id}" data-roll="${c.id}" tabindex="0"><td><div class="clip">${esc(c.name)}</div></td><td>${c.plan}</td><td class="mono">${c.version} ${supTag(c.version)}</td><td>${x.deferred?'<span class="pill st-hold">Deferred</span>':stepperHtml(ROLL,x.stage,true)}</td><td><div class="clip">${esc(c.window)}</div></td><td>${rg.length&&ROLL.indexOf(x.stage)>=2?`<span class="sla breached" title="${esc(rg[0].name)} fails on ${rel.version}">Regression</span>`:x.stage==='Production upgraded'?'<span class="sla ok">Done</span>':''}</td></tr>`}).join('')}</tbody></table></div></section>`:''}
  <section class="panel" id="crKinds"><div class="panel-head"><h2>Two kinds of client change</h2><span class="muted">Triage decides which path a request takes</span></div>
    <div class="paths two">${CR_KINDS.map(p=>`<div class="pathcard ${p.cls}"><div class="panel-head"><h3>${p.name}</h3><span class="muted" style="font-size:12px">${p.k} change · ${crs.filter(t=>t.changeType===p.k).length} on record</span></div><p>${p.what}</p>
      <ol class="pathsteps">${p.steps.map(x=>`<li>${x}</li>`).join('')}</ol><dl class="mini"><div><dt>Cost to the client</dt><dd>${p.cost}</dd></div><div><dt>Typical lead time</dt><dd>${p.lead}</dd></div></dl></div>`).join('')}</div></section>
  <div class="grid g2">
    <section class="panel" id="clientList"><div class="panel-head"><h2>Clients</h2><span class="muted">Contract, version and configuration</span></div>
      <div class="list">${C.map(c=>`<div class="li" data-open="${c.id}" tabindex="0"><span class="tag">${c.plan}</span><div style="min-width:0"><div class="t-title">${esc(c.name)}</div><div class="t-meta">${c.region} · ${c.configs.length} configuration${c.configs.length===1?"":"s"}, ${c.configs.filter(x=>x.kind==='Custom workflow').length} custom · CSM ${esc(c.csm)}</div></div><span class="mono" style="font-size:12px;white-space:nowrap">${c.version} ${supTag(c.version)}</span></div>`).join('')}</div></section>
    <section class="panel" id="crList"><div class="panel-head"><h2>Client change requests</h2><span class="muted">Open first</span></div>
      <div class="list">${crs.sort((a,b)=>isOpen(b)-isOpen(a)||b.created-a.created).slice(0,9).map(crRow).join('')||'<div class="empty">None yet.</div>'}</div></section>
  </div>
  <section class="panel" id="flowPolicy"><div class="panel-head"><h2>Version support policy</h2></div>
    <div class="calc" style="flex-wrap:wrap"><span>Clients must stay within two versions of the current release (N-2). A client can defer an upgrade once, but a client on an unsupported version gets no fixes and no contractual SLA until it upgrades.</span>
    <span style="display:flex;gap:6px;flex-wrap:wrap">${FLOW_VERSIONS.slice().reverse().map(([v])=>`<span class="mono" style="font-size:12px">${v} ${supTag(v)}</span>`).join('')}</span></div></section>`;
}

/* ---------- client record ---------- */
function openClient(c){
  const rel=platformRel();const x=rel&&rel.rollout[c.id];const rg=rel?regressions(c,rel.version):[];
  const chs=clientChanges(c);const p=PLAN[c.plan];
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono">${c.id} · ${c.plan} plan</span><h2>${esc(c.name)}</h2><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap"><span class="tag">${FLOW_SVC} ${c.version}</span>${supTag(c.version)}</div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <div class="actions"><button class="btn primary" data-newcr="${c.id}">+ Change request for this client</button></div>
  <dl class="facts"><div><dt>Contract plan</dt><dd>${c.plan}</dd></div><div><dt>P1 commitment</dt><dd>${p.p1}</dd></div><div><dt>Availability target</dt><dd>${p.avail}</dd></div><div><dt>Configuration changes</dt><dd>within ${p.cr} business days</dd></div>
    <div><dt>Region</dt><dd>${c.region}</dd></div><div><dt>Users</dt><dd>${c.users}</dd></div><div><dt>Production window</dt><dd>${esc(c.window)}</dd></div><div><dt>Client service manager</dt><dd>${esc(c.csm)}</dd></div><div><dt>Client since</dt><dd>${fmtD(c.since)} ${new Date(c.since).getFullYear()}</dd></div></dl>
  ${rel?`<div class="section"><span class="eyebrow">Current upgrade: ${esc(rel.version)}</span><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${x&&x.deferred?'<span class="pill st-hold">Deferred</span>':stepperHtml(ROLL,x?x.stage:'Notified',true)}<button class="linkchip" data-open="${rel.id}">${rel.id}</button></div></div>`:''}
  <div class="section" id="clientCfg"><span class="eyebrow">Configuration register (${c.configs.length})</span>
    <div class="tablewrap"><table><thead><tr><th>Configuration</th><th>Type</th><th>Upgrade check</th></tr></thead><tbody>${c.configs.map(k=>`<tr><td><div class="clip">${esc(k.name)}</div>${k.chg?`<div class="t-meta mono">${k.chg}</div>`:''}</td><td>${k.kind==='Custom workflow'?'<span class="tag">Custom</span>':'Configuration'}</td><td>${k.breaks&&k.fixed!==k.breaks?`<span class="sla breached">Fails on ${k.breaks}</span>`:k.fixed?`<span class="sla ok">Fixed for ${k.fixed}</span>`:k.kind==='Custom workflow'?'<span class="sla risk">Re-test every upgrade</span>':'<span class="sla ok">Covered by regression pack</span>'}</td></tr>`).join('')}</tbody></table></div>
    <div class="t-meta" style="margin-top:6px">Custom workflows are not part of the product, so the client has to re-test them every upgrade.${rg.length?` <b>${rg.length} known regression for ${rel.version}.</b>`:''}</div></div>
  <div class="section"><span class="eyebrow">Change requests (${chs.length})</span>${chs.length?`<div class="links">${chs.map(t=>`<button class="linkchip" data-open="${t.id}">${t.id} <span style="font-family:var(--f-body)">${pill(t)}</span></button>`).join('')}</div>`:'<span class="muted" style="font-size:13px">None yet.</span>'}</div>
  <div class="section"><span class="eyebrow">Version history</span><ul class="timeline">${c.history.slice().reverse().map(h=>`<li><div class="when">${fmtD(h.at)} ${new Date(h.at).getFullYear()}</div><div>Upgraded to ${FLOW_SVC} ${h.v}</div></li>`).join('')}</ul></div>
  <div class="section"><span class="eyebrow">Account history</span><ul class="timeline">${c.notes.slice().sort((a,b)=>b.t-a.t).map(n=>`<li><div class="when">${fmtDT(n.t)} · ${esc(n.who)}</div><div>${esc(n.text)}</div></li>`).join('')}</ul></div>`);
  markRec(c.id);
}

/* ---------- hooks used by the record drawer (records.js) ---------- */
function saasFacts(t,facts){
  if(t.client){const c=get(t.client);if(c)facts.push(['Client',`<button class="linkchip" data-open="${c.id}">${esc(c.name)}</button>`],['Client change type',t.changeType==='Standard'?'Configuration (pre-approved)':'Custom workflow (chargeable)'])}
  if(t.platform)facts.push(['Platform version',`${FLOW_SVC} ${t.version}`]);
}
function saasBox(t){return t.type==='REL'&&t.platform?rolloutBox(t):t.type==='CHG'&&t.client?crBox(t):''}
function rolloutBox(t){
  const C=DB.clients;const done=C.filter(c=>t.rollout[c.id].stage==='Production upgraded').length;
  return `<div class="section" id="rolloutBox"><span class="eyebrow">Client rollout · ${done} of ${C.length} in production</span><div class="list">${C.map(c=>{
    const x=t.rollout[c.id];const i=ROLL.indexOf(x.stage);const rg=i>=2?regressions(c,t.version):[];
    const fix=rg.length&&DB.items.find(o=>o.type==='CHG'&&o.client===c.id&&o.fixFor===t.version&&o.cfg===rg[0].i&&o.status!=='Rejected');
    const btns=x.deferred?'':[ROLL_BTN[x.stage]?`<button class="btn ${rg.length&&x.stage==='Client testing'?'':'primary'}" data-act="roll:${c.id}:next">${ROLL_BTN[x.stage]}</button>`:'',
      i<4?`<button class="btn ghost" data-act="roll:${c.id}:defer">Defer</button>`:''].join('');
    return `<div class="li roll" style="cursor:default" data-rollc="${c.id}"><div style="min-width:0;flex:1"><div class="t-title">${esc(c.name)}</div><div class="t-meta">${c.plan} · on ${c.version} · window ${esc(c.window)}</div>
      ${x.deferred?`<div style="margin-top:6px"><span class="pill st-hold">Deferred</span> ${supportOf(c.version).k==='breached'?'<span class="sla breached">Stays out of support</span>':''}</div>`:`<div style="margin-top:6px">${stepperHtml(ROLL,x.stage,true)}</div>`}
      ${rg.length?`<div class="regress"><b>Regression found in client testing:</b> ${esc(rg[0].name)} fails on ${t.version}. ${fix?`Fix: <button class="linkchip" data-open="${fix.id}">${fix.id}</button> ${pill(fix)}`:`<button class="btn" data-act="roll:${c.id}:fix">Raise the fix as a client change</button>`}</div>`:''}</div>
      <span class="actions">${btns}</span></div>`}).join('')}</div>
    <div class="t-meta" style="margin-top:6px">Production is upgraded only after the client signs off, and only in the client’s own window. The release can move to early life support once every client is upgraded or has deferred.</div></div>`;
}
function crBox(t){
  const c=get(t.client);if(!c)return '';
  if(t.changeType!=='Normal')return `<div class="calc" id="crBox"><span class="eyebrow">Client configuration change</span><span>${t.fixFor?`Compatibility fix for the ${esc(t.fixFor)} upgrade, using the pre-approved fix template. No charge to the client.`:`From the approved configuration catalogue: pre-approved, no charge. ${esc(c.name)}’s ${c.plan} contract promises it within <b>${PLAN[c.plan].cr} business days</b>.`}</span></div>`;
  t.cr=t.cr||{};const open=['Draft','Assessment'].includes(t.status);const nx=CR_STEPS.findIndex(([k])=>!t.cr[k]);
  return `<div class="section" id="crBox"><span class="eyebrow">Client steps before CAB</span><div class="list">${CR_STEPS.map(([k,l],i)=>`<div class="li" style="cursor:default"><span class="pill st-${t.cr[k]?'done':i===nx?'prog':'new'}">${t.cr[k]?'Done':i===nx?'Next':'To do'}</span><div style="min-width:0"><div class="t-title">${l}</div>${t.cr[k]&&typeof t.cr[k]==='string'?`<div class="t-meta">${esc(t.cr[k])}</div>`:''}</div>${i===nx&&open?`<span class="actions"><button class="btn" data-act="cr:${k}">${i===0?'Send quote':i===3?'Record sign-off':'Mark done'}</button></span>`:''}</div>`).join('')}</div>
    ${nx>=0&&t.status==='Draft'?'<div class="t-meta" style="margin-top:6px">Move the change to Assessment to start these steps.</div>':''}</div>`;
}
/* Returns false to stop a lifecycle move, with a message saying why. */
function gateNext(t,next){
  if(t.type==='REL'&&t.platform){
    const C=DB.clients;
    if(next==='Deploy'&&!C.some(c=>['Signed off','Production upgraded'].includes(t.rollout[c.id].stage))){toast('No client has signed off yet');return false}
    if(next==='Early life support'){const left=C.filter(c=>t.rollout[c.id].stage!=='Production upgraded'&&!t.rollout[c.id].deferred);if(left.length){toast(`${left.length} client${left.length>1?'s':''} still to upgrade or defer`);return false}}
  }
  if(t.type==='CHG'&&t.client&&t.changeType==='Normal'&&next==='CAB approval'){const left=CR_STEPS.filter(([k])=>!(t.cr||{})[k]).length;if(left){toast(`Client steps first: ${left} still to do`);return false}}
  return true;
}
function saasAct(t,k,log,now){
  if(k.startsWith('cr:')){const s=k.slice(3);t.cr=t.cr||{};const c=get(t.client);
    if(s==='est'){t.cr.est=t.fixFor?'No charge: compatibility fix':'3 days · chargeable (S$4,800)';log(`Effort estimated and quote sent to ${c.name}: ${t.cr.est}`)}
    else{t.cr[s]=true;log({quote:`${c.name} accepted the quote`,build:`Built and tested in ${c.name}’s test environment`,uat:`${c.name} signed off user acceptance testing`}[s])}
    feed('PLATFORM',`${t.id} ${CR_STEPS.find(x=>x[0]===s)[1].toLowerCase()}: ${c.name}`,t.id);return}
  const [,cid,op]=k.split(':');const c=get(cid);const x=t.rollout&&t.rollout[cid];if(!c||!x)return false;
  if(op==='fix'){const rg=regressions(c,t.version)[0];if(!rg)return false;
    openDrawer(createForm('CHG',{client:cid,title:`update the ${rg.name.toLowerCase()} for the ${t.version} API`,changeType:'Standard',risk:'Low',fixFor:t.version,cfg:rg.i,from:t.id,
      desc:`Regression found in ${c.name}'s ${t.version} testing: ${rg.name} calls an API that ${t.version} replaces. Update it with the pre-approved compatibility fix template, then the client re-tests.`}));bindCreate();return false}
  if(op==='defer'){x.deferred=true;x.at=now;const out=supportOf(c.version).k==='breached';
    log(`${c.name} deferred the ${t.version} upgrade${out?`: stays on ${c.version}, which is out of support. Risk accepted in writing by the client`:''}`);
    c.notes.push({t:now,who:c.csm,text:`Deferred the ${t.version} upgrade${out?' (out of support: risk acceptance signed)':''}`});feed('PLATFORM',`${c.name} deferred ${FLOW_SVC} ${t.version}${out?' (out of support)':''}`,t.id);return}
  const i=ROLL.indexOf(x.stage);const nx=ROLL[i+1];if(!nx)return false;
  if(nx==='Signed off'){const rg=regressions(c,t.version);if(rg.length){toast(`${c.name} can’t sign off: ${rg[0].name} still fails`);return false}}
  x.stage=nx;x.at=now;log(`${c.name}: ${nx}`);
  if(nx==='Client testing'){const rg=regressions(c,t.version);if(rg.length){log(`Regression found in ${c.name}'s testing: ${rg[0].name} fails on ${t.version}`);feed('PLATFORM',`Regression in ${c.name} testing: ${rg[0].name}`,t.id)}}
  if(nx==='Production upgraded'){c.version=t.version;c.history.push({v:t.version,at:now});c.notes.push({t:now,who:'Release Manager',text:`Production upgraded to ${t.version} in the ${c.window} window`});
    feed('PLATFORM',`${c.name} upgraded to ${FLOW_SVC} ${t.version} in production`,t.id);
    if(!isOpen(t))return;if(t.status==='Test'){t.status='Deploy';log('Status changed to Deploy')}}
  else feed('PLATFORM',`${t.id} ${c.name}: ${nx.toLowerCase()}`,t.id);
}
/* A client change implemented successfully updates the client's configuration register. */
function clientChangeDone(t,now){
  const c=get(t.client);if(!c)return null;
  if(t.fixFor!=null&&c.configs[t.cfg]){const k=c.configs[t.cfg];k.fixed=t.fixFor;c.notes.push({t:now,who:'Platform Engineering',text:`${k.name} fixed for ${t.fixFor} (${t.id})`});
    feed('PLATFORM',`${c.name}: ${k.name} fixed for ${t.fixFor}, ready for client sign-off`,t.id);return `${t.id} implemented: ${c.name} can now sign off ${t.fixFor}`}
  const name=t.title.replace(c.name+': ','');const k={name:name.charAt(0).toUpperCase()+name.slice(1),kind:t.changeType==='Normal'?'Custom workflow':'Configuration',added:now,breaks:null,fixed:null,chg:t.id};
  c.configs.push(k);c.notes.push({t:now,who:'Platform Engineering',text:`${k.kind} added: ${k.name} (${t.id})`});
  feed('PLATFORM',`${c.name}: ${k.kind.toLowerCase()} added to the configuration register`,t.id);
  return `${t.id} implemented: added to ${c.name}’s configuration register${k.kind==='Custom workflow'?', re-tested at every upgrade':''}`;
}
/* Create-form support for client changes */
function clientField(type,p){
  if(type!=='CHG'||p.client==null)return '';
  return `<div class="field"><label for="f-client">Client</label><select id="f-client">${DB.clients.map(c=>`<option value="${c.id}" ${c.id===p.client?'selected':''}>${esc(c.name)} (${c.plan})</option>`).join('')}</select></div>`;
}
function clientNote(ctype){
  if(!$('#f-client'))return '';
  return ctype==='Standard'?'Configuration change from the approved catalogue: pre-approved and scheduled in the client’s window. No charge.':ctype==='Normal'?'Custom workflow change: estimate and quote, build in the client’s test environment, client sign-off, then CAB.':'Emergency changes for a client still need the client told before and after.';
}
function extOnCreate(t,form){
  const cl=form.querySelector('#f-client');
  if(cl&&t.type==='CHG'){const c=get(cl.value);if(c){t.client=c.id;t.service=FLOW_SVC;t.group='Platform Engineering';t.assignee=t.assignee||c.csm;if(!t.title.startsWith(c.name))t.title=`${c.name}: ${t.title}`;
    if(t.changeType==='Normal')t.cr={};if(form.dataset.fixfor){t.fixFor=form.dataset.fixfor;t.cfg=+form.dataset.cfg}c.links.push(t.id);c.notes.push({t:t.created,who:c.name,text:`Change request ${t.id} raised`})}}
  if(typeof aiOnCreate==='function')aiOnCreate(t,form);
}

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-newcr]');if(!b)return;
  openDrawer(createForm('CHG',{client:b.dataset.newcr||'CLI-01',changeType:'Standard',risk:'Low'}));bindCreate();
});
NAV_COUNT.platform=()=>{const r=platformRel();return r?DB.clients.filter(c=>{const x=r.rollout[c.id];return x&&ROLL.indexOf(x.stage)>=2&&regressions(c,r.version).length}).length:0};
