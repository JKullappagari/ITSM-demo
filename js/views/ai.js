/* Meridian Service Desk: AI governance: AI agent register, risk tiers, controls, kill switch and change control for models and prompts */
"use strict";
const AI_FLOW=['Proposed','Risk assessed','Approved','Live','Retired'];
const AI_AUTONOMY={'Suggest only':'A person decides and acts; the agent only suggests','Act with human approval':'The agent prepares the action; a person approves each one','Act within limits':'The agent acts on its own inside hard limits'};
const AI_TIERS=[
  {k:'Minimal',cls:'ok',what:'Internal helpers with no direct effect on people or money, such as summarising or drafting for staff.',needs:'Owner, monitoring, change control'},
  {k:'Limited',cls:'info',what:'Agents people talk to, or that suggest decisions a person then makes.',needs:'Plus: people told it is AI, human oversight, evaluation set'},
  {k:'High',cls:'crit',what:'Agents that act on money, accounts or decisions about customers or staff.',needs:'Plus: data protection assessment, action limits, tested kill switch, governance board approval'},
  {k:'Prohibited',cls:'muted',what:'Uses the organisation will not allow, such as covert manipulation or social scoring of staff.',needs:'Not registered: rejected at proposal'}];
const AI_RISK_Q=[['money','It can move money or change financial records',3],['people','Its decisions affect customers or employees directly',2],['auto','It acts without a person approving each action',2],['personal','It reads personal or confidential data',1],['external','Clients or the public interact with it',1]];
const AI_CONTROLS=[['owner','Named business owner'],['dpia','Data protection impact assessment'],['oversight','Human oversight defined'],['limits','Action limits and guardrails'],['kill','Kill switch tested'],
  ['monitor','Monitoring and alert thresholds'],['change','Model and prompt changes under change control'],['disclose','People told when they deal with AI'],['eval','Passed its evaluation test set'],['review','Next review date set']];
const AI_PRACTICES=[['Configuration management','Every agent is a configuration item: owner, model, version, data it reads and actions it can take'],
  ['Change enablement','A new model, prompt or tool is a change, with a back-out plan (roll back to the previous version)'],
  ['Monitoring and event management','Guardrail blocks, quality drops, override spikes and cost spikes arrive as alerts'],
  ['Incident management','A wrong or harmful action is an incident: use the kill switch first, then restore and investigate'],
  ['Problem management','Repeated agent errors get a root cause, the same as any other recurring fault'],
  ['Supplier management','The model provider is a supplier with a contract, data terms and an exit plan'],
  ['Information security','Agents get the least access they need, and their actions are logged'],
  ['Continual improvement','Override rates and evaluation results show where an agent needs retraining or retiring']];
const aiTier=ans=>{const s=AI_RISK_Q.reduce((a,[k,,w])=>a+(ans[k]?w:0),0);return s>=5?'High':s>=2?'Limited':'Minimal'};
const curVer=a=>a.versions.find(v=>v.active)||a.versions[a.versions.length-1];
const aiPill=a=>`<span class="pill st-${a.status==='Live'?'done':a.status==='Suspended'?'bad':a.status==='Retired'?'closed':a.status==='Proposed'?'new':'prog'}">${a.status}</span>`;
const tierTag=(a,short)=>a.tier&&a.tier!=='—'?`<span class="tag tier-${a.tier}">${a.tier}${short?'':' risk'}</span>`:`<span class="tag">${short?'—':'Not assessed'}</span>`;

/* ---------- sample data ---------- */
function aiSeed(D,now){
  const sq=t=>{D.seq[t]=(D.seq[t]||1000)+1;return t+String(D.seq[t]).padStart(7,'0')};
  const all=Object.fromEntries(AI_CONTROLS.map(([k])=>[k,true]));
  const A=[
    ['Service desk triage assistant','Suggests the category, priority and assignment group for each new incident','Service desk','AI Platform','S. Wong (service desk manager)','Suggest only','Limited','Live',{actions:2140,quality:92,override:9,blocks:0,cost:1150},{people:true,personal:true},[150,62,20]],
    ['Knowledge article drafter','Drafts knowledge articles from resolved incidents for an analyst to review and publish','Knowledge management','AI Platform','K. Nair (knowledge manager)','Act with human approval','Limited','Live',{actions:186,quality:88,override:22,blocks:1,cost:420},{personal:true,auto:false,people:true},[120,35]],
    ['Password reset agent','Resets non-privileged passwords after the caller passes MFA identity checks','Service desk','Identity & Access','D. Rahman (identity and access lead)','Act within limits','High','Live',{actions:1320,quality:97,override:2,blocks:0,cost:640},{people:true,auto:true,personal:true},[140,45,2]],
    ['Change risk advisor','Reads a change and its CMDB impact, then suggests a risk rating for the change manager','Change enablement','AI Platform','R. Kumar (change manager)','Suggest only','Minimal','Approved',{actions:0,quality:90,override:0,blocks:0,cost:0},{},[]],
    ['Client support assistant','Answers how-to questions from client users in the Meridian Flow portal chat; hands over to a person for anything else','Client platform',FLOW_SVC,'L. Chen (client service manager)','Act within limits','Limited','Live',{actions:3870,quality:91,override:6,blocks:4,cost:2300},{external:true,auto:true,personal:true},[95,30]],
    ['Payment break clearing agent','Clears payment reconciliation breaks under S$1,000 by matching them to bank statement lines','Payments operations','Payments Gateway','J. Ong (payments operations lead)','Act within limits','—','Proposed',{actions:0,quality:0,override:0,blocks:0,cost:0},{},[]],
    ['Meeting notes summariser','Summarised CAB meetings into minutes; replaced by the collaboration suite’s own feature','Change enablement','AI Platform','R. Kumar (change manager)','Suggest only','Minimal','Retired',{actions:0,quality:84,override:0,blocks:0,cost:0},{},[300]]];
  D.agents=A.map(([name,purpose,area,service,owner,autonomy,tier,status,m,ans,vers],i)=>{
    const id='AGT-'+String(i+1).padStart(3,'0');const created=now-(vers[0]||14)*DAY-20*DAY;
    const a={kind:'AGT',cls:'AI agent',env:'Production',id,name,purpose,area,service,owner,autonomy,tier,status,model:i===4?'Hosted model via Northbridge AI (EU region)':'Hosted model via Northbridge AI',metrics:m,riskAns:ans,
      controls:status==='Proposed'?{owner:true}:status==='Approved'?Object.assign({},all,{review:true}):Object.assign({},all),created,review:now+(40+i*17)*DAY,links:[],versions:[],
      notes:[{t:created,who:owner.split(' (')[0],text:'Agent proposed'}]};
    vers.forEach((ago,j)=>{
      const v='v'+(j+1+(i===2?4:0));const at=now-ago*DAY;
      const unplanned=i===2&&j===vers.length-1;let chg=null;
      if(!unplanned){const c={id:sq('CHG'),type:'CHG',title:`${name}: release ${v}`,service,changeType:'Normal',risk:tier==='High'?'High':'Medium',status:'Closed',group:GROUP_OF[service]||'AI Platform Team',assignee:owner.split(' (')[0],created:at-6*DAY,planned:at,resolved:at+3*HR,outcome:'Successful',links:[],agent:id,
          notes:[{t:at-6*DAY,who:owner.split(' (')[0],text:`Request for change raised: ${j?'prompt and model update':'first release'}, evaluation set passed`},{t:at-2*DAY,who:'Change Advisory Board',text:'Approved at CAB'},{t:at+3*HR,who:owner.split(' (')[0],text:'Implemented. Outcome: Successful'}]};
        D.items.push(c);chg=c.id;a.links.push(c.id)}
      a.versions.push({v,at,chg,note:unplanned?'Prompt reworded to shorten the conversation; deployed directly by the agent team':j?'Prompt and model update after evaluation':'First release',active:j===vers.length-1});
      a.notes.push({t:at,who:owner.split(' (')[0],text:`${v} deployed${chg?` under ${chg}`:' with no change record'}`});
    });
    if(status==='Retired')a.notes.push({t:now-40*DAY,who:a.owner.split(' (')[0],text:'Retired: replaced by a built-in feature'});
    if(!a.versions.length)a.versions.push({v:'v1',at:now,chg:null,note:'Draft, not deployed',active:true,draft:true});
    a.ver=curVer(a).v;return a;
  });
}
/* Sample data for the client platform and AI governance, added to the generated data set. */
function extendData(D,now){saasSeed(D,now);aiSeed(D,now)}

/* ---------- view ---------- */
function viewAI(){
  const L=DB.agents,act=L.filter(a=>a.status!=='Retired');const now=Date.now();
  const unctl=act.filter(a=>a.status!=='Proposed'&&!curVer(a).chg&&!curVer(a).draft);
  const blocks=act.reduce((s,a)=>s+a.metrics.blocks,0);
  return `<div class="pagehead"><div><span class="eyebrow">Responsible use of AI</span><h1>AI governance</h1><p>Every AI agent the organisation builds or buys is registered, risk-assessed, approved, monitored and changed under control, the same as any other configuration item. If one misbehaves, its kill switch stops it at once.</p></div>
    <div class="actions"><button class="btn" data-tourstart="aiapprove">Walk through approving an agent</button><button class="btn" data-tourstart="aiincident">Walk through an agent incident</button></div></div>
  <div class="tiles">${tile('Agents live',L.filter(a=>a.status==='Live').length,'',`${L.filter(a=>a.status==='Suspended').length} suspended`,L.some(a=>a.status==='Suspended')?'warn':'neutral')}${tile('High risk',act.filter(a=>a.tier==='High').length,'','need board approval')}${tile('Guardrail blocks',blocks,'','last 7 days',blocks>5?'warn':'neutral')}${tile('Versions with no change record',unctl.length,'',unctl.length?unctl.map(a=>a.name).join(', '):'all under change control',unctl.length?'crit':'ok')}</div>
  <section class="panel" id="aiReg"><div class="panel-head"><h2>AI agent register</h2><span class="muted">${L.length} agents</span></div>
    <div class="tablewrap"><table><thead><tr><th>Agent</th><th>Works in</th><th>Autonomy</th><th>Risk</th><th>Version</th><th class="num">Quality</th><th class="num">Overrides</th><th class="num">Blocks</th><th>Status</th></tr></thead><tbody>
    ${L.map(a=>{const v=curVer(a);return `<tr class="click" data-open="${a.id}" tabindex="0"><td><div class="t-title clip">${esc(a.name)}</div><div class="t-meta mono">${a.id}</div></td><td><div class="clip" style="max-width:14ch">${esc(a.area)}</div></td><td><div class="clip" style="max-width:17ch">${esc(a.autonomy)}</div></td><td>${tierTag(a,1)}</td><td class="mono" style="white-space:nowrap">${a.ver}${!v.chg&&!v.draft?' <span class="sla breached" title="Deployed with no change record">No CHG</span>':''}</td><td class="num">${a.metrics.quality?a.metrics.quality+'%':'—'}</td><td class="num">${a.status==='Live'||a.status==='Suspended'?a.metrics.override+'%':'—'}</td><td class="num">${a.metrics.blocks||'—'}</td><td>${aiPill(a)}</td></tr>`}).join('')}</tbody></table></div></section>
  <section class="panel" id="aiTiers"><div class="panel-head"><h2>Risk tiers</h2><span class="muted">Set by a short questionnaire when an agent is proposed. The tier decides the controls it needs.</span></div>
    <div class="paths four">${AI_TIERS.map(t=>`<div class="pathcard ${t.cls}"><div class="panel-head"><h3>${t.k}</h3><span class="muted" style="font-size:12px">${L.filter(a=>a.tier===t.k).length} agents</span></div><p>${t.what}</p><dl class="mini"><div><dt>Needs</dt><dd>${t.needs}</dd></div></dl></div>`).join('')}</div></section>
  <section class="panel" id="aiControls"><div class="panel-head"><h2>Controls coverage</h2><span class="muted">Agents in use or awaiting approval</span></div>
    <div style="overflow-x:auto"><table class="matrix ctl"><thead><tr><th></th>${AI_CONTROLS.map(([,l])=>`<th title="${esc(l)}"><span>${esc(l)}</span></th>`).join('')}</tr></thead><tbody>
    ${act.map(a=>`<tr><th style="text-align:left"><button class="linkchip" data-open="${a.id}">${esc(a.name)}</button></th>${AI_CONTROLS.map(([k,l])=>`<td class="${a.controls[k]?'yes':'no'}" title="${esc(l)}">${a.controls[k]?'✓':'·'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
  <section class="panel" id="aiPractices"><div class="panel-head"><h2>How service management practices govern AI agents</h2><span class="muted">No new process: the existing practices, applied to agents</span></div>
    <div class="list">${AI_PRACTICES.map(([p,d])=>`<div class="li" style="cursor:default"><span class="tag">${esc(p)}</span><div style="min-width:0"><div class="t-meta" style="font-size:13px;color:var(--ink)">${esc(d)}</div></div></div>`).join('')}</div>
    <div class="t-meta" style="margin-top:8px">The risk tiers and controls follow the shape of the EU AI Act risk categories, the NIST AI Risk Management Framework and ISO/IEC 42001, simplified for a demonstration.</div></section>`;
}

/* ---------- agent record ---------- */
function openAgent(a){
  const v=curVer(a);const gl=a.golive?get(a.golive):null;const acts=[];const st=a.status;
  if(st==='Proposed')acts.push('<button class="btn primary" data-agt="assess">Record risk assessment</button>','<button class="btn danger" data-agt="reject">Reject proposal</button>');
  if(st==='Risk assessed')acts.push('<button class="btn primary" data-agt="approve">Approve at AI governance board</button>');
  if(st==='Approved'){if(!gl)acts.push('<button class="btn primary" data-agt="golive">Raise go-live change</button>');else acts.push('<button class="btn primary" data-agt="live">Move to Live</button>')}
  if(st==='Live')acts.push('<button class="btn danger" data-agt="suspend">Suspend: use the kill switch</button>');
  if(st==='Suspended')acts.push('<button class="btn primary" data-agt="resume">Resume the agent</button>');
  if((st==='Live'||st==='Suspended')&&a.versions.filter(x=>!x.rolledBack).length>1&&a.versions.indexOf(v)>0)acts.push(`<button class="btn" data-agt="rollback">Roll back to ${a.versions[a.versions.indexOf(v)-1].v}</button>`);
  if(st==='Live'||st==='Suspended')acts.push('<button class="btn" data-agt="inc">Raise incident</button>','<button class="btn" data-agt="chg">Raise change</button>');
  if(st==='Live')acts.push('<button class="btn ghost" data-agt="retire">Retire</button>');
  const links=a.links.map(get).filter(Boolean).sort((x,y)=>y.created-x.created);
  const missing=AI_CONTROLS.filter(([k])=>!a.controls[k]).length;
  const m=a.metrics;
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono">${a.id} · AI agent</span><h2>${esc(a.name)}</h2><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${aiPill(a)}${tierTag(a)}<span class="tag">${esc(a.autonomy)}</span></div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <div class="section"><span class="eyebrow">Agent lifecycle</span>${stepperHtml(AI_FLOW,st==='Suspended'?'Live':st)}${st==='Suspended'?'<div class="regress" style="margin-top:8px"><b>Suspended by the kill switch.</b> Requests go to the service desk queue until the agent is resumed.</div>':''}</div>
  ${acts.length?`<div class="actions">${acts.join('')}</div>`:''}
  ${st==='Proposed'?`<div class="section" id="aiRiskBox"><span class="eyebrow">Risk questionnaire</span><div class="checklist">${AI_RISK_Q.map(([k,l,w])=>`<label class="check"><input type="checkbox" id="airq-${k}" ${a.riskAns[k]?'checked':''}> <span>${esc(l)} <span class="muted">(+${w})</span></span></label>`).join('')}</div><div class="t-meta" style="margin-top:6px">5 points or more is High risk, 2 to 4 is Limited, under 2 is Minimal.</div></div>`:''}
  ${st!=='Proposed'&&st!=='Retired'?`<div class="section" id="aiCtlBox"><span class="eyebrow">Governance controls ${missing?`· ${missing} missing`:'· all in place'}</span><div class="checklist ctl2">${AI_CONTROLS.map(([k,l])=>`<label class="check"><input type="checkbox" data-agtctl="${k}" ${a.controls[k]?'checked':''} ${st==='Risk assessed'||st==='Approved'?'':'disabled'}> <span>${esc(l)}</span></label>`).join('')}</div>${st==='Risk assessed'?'<div class="t-meta" style="margin-top:6px">Tick each control once its evidence is attached. The board approves only when all ten are in place.</div>':''}</div>`:''}
  ${st==='Approved'?`<div class="calc" id="aiGolive"><span>Going live is a change to production, so it needs a change record that is approved and scheduled.</span>${gl?`<button class="linkchip" data-open="${gl.id}">${gl.id}</button> ${pill(gl)}`:''}</div>`:''}
  <dl class="facts"><div><dt>Purpose</dt><dd>${esc(a.purpose)}</dd></div><div><dt>Works in</dt><dd>${esc(a.area)}</dd></div><div><dt>Business owner</dt><dd>${esc(a.owner)}</dd></div><div><dt>Service</dt><dd>${esc(a.service)}</dd></div><div><dt>Model</dt><dd>${esc(a.model)}</dd></div><div><dt>Version in use</dt><dd class="mono">${a.ver}</dd></div>
    <div><dt>Autonomy</dt><dd>${esc(a.autonomy)}<div class="t-meta">${AI_AUTONOMY[a.autonomy]}</div></dd></div><div><dt>Risk tier</dt><dd>${esc(a.tier)}</dd></div><div><dt>Next review</dt><dd>${fmtD(a.review)}</dd></div></dl>
  ${st==='Live'||st==='Suspended'?`<div class="tiles mini">${tile('Actions, 30 days',m.actions.toLocaleString('en-GB'),'')}${tile('Quality',m.quality,'%','sampled checks',m.quality<85?'warn':'ok')}${tile('Human overrides',m.override,'%','of suggestions or actions',m.override>20?'warn':'neutral')}${tile('Guardrail blocks',m.blocks,'','last 7 days',m.blocks>2?'crit':'neutral')}</div>`:''}
  <div class="section" id="aiVersions"><span class="eyebrow">Versions and change records</span><div class="tablewrap"><table><thead><tr><th>Version</th><th>Deployed</th><th>Change record</th><th>What changed</th></tr></thead><tbody>
    ${a.versions.slice().reverse().map(x=>`<tr${x.active?' class="cur"':''}><td class="mono">${x.v}${x.active?' <span class="tag">In use</span>':''}${x.rolledBack?' <span class="tag">Rolled back</span>':''}</td><td>${x.draft?'—':fmtD(x.at)}</td><td>${x.chg?`<button class="linkchip" data-open="${x.chg}">${x.chg}</button>`:x.draft?'—':'<span class="sla breached">None</span>'}</td><td><div class="clip" title="${esc(x.note)}">${esc(x.note)}</div></td></tr>`).join('')}</tbody></table></div></div>
  <div class="section"><span class="eyebrow">Linked records (${links.length})</span>${links.length?`<div class="links">${links.map(l=>`<button class="linkchip" data-open="${l.id}">${l.id} <span style="font-family:var(--f-body)">${l.type?pill(l):esc(l.status)}</span></button>`).join('')}</div>`:'<span class="muted" style="font-size:13px">None yet.</span>'}</div>
  <div class="section"><span class="eyebrow">History</span><ul class="timeline">${a.notes.slice().sort((x,y)=>y.t-x.t).map(n=>`<li><div class="when">${fmtDT(n.t)} · ${esc(n.who)}</div><div>${esc(n.text)}</div></li>`).join('')}</ul></div>`);
  markRec(a.id);
}
function aiRefresh(a){const st=$('#drawer').scrollTop;save();render();openAgent(a);$('#drawer').scrollTop=st}
document.addEventListener('change',e=>{
  const k=e.target.dataset&&e.target.dataset.agtctl;if(!k)return;const a=get($('#drawer').dataset.id);if(!a||a.kind!=='AGT')return;
  a.controls[k]=e.target.checked;a.notes.push({t:Date.now(),who:'You (demo)',text:`${AI_CONTROLS.find(x=>x[0]===k)[1]}: ${e.target.checked?'evidence attached':'removed'}`});aiRefresh(a);
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-agt]');if(!b)return;const a=get($('#drawer').dataset.id);if(!a||a.kind!=='AGT')return;
  const now=Date.now(),me='You (demo)',k=b.dataset.agt;const log=t=>a.notes.push({t:now,who:me,text:t});
  const to=s=>{a.status=s;log(`Status changed to ${s}`)};
  if(k==='assess'){AI_RISK_Q.forEach(([q])=>{const c=$('#airq-'+q);if(c)a.riskAns[q]=c.checked});a.tier=aiTier(a.riskAns);to('Risk assessed');log(`Risk assessment recorded: ${a.tier} risk`);
    if(a.tier==='High'&&a.autonomy==='Act within limits'){a.autonomy='Act with human approval';log('High risk: the board requires a person to approve each action until the agent has three months of clean results')}
    feed('AI',`${a.id} ${a.name}: assessed as ${a.tier} risk`,a.id)}
  else if(k==='reject'){a.status='Retired';log('Proposal rejected');feed('AI',`${a.id} proposal rejected`,a.id)}
  else if(k==='approve'){const miss=AI_CONTROLS.filter(([c])=>!a.controls[c]);if(miss.length){toast(`${miss.length} control${miss.length>1?'s':''} still missing`);return}
    to('Approved');log('Approved at the AI governance board');feed('AI',`${a.id} ${a.name} approved at the AI governance board`,a.id)}
  else if(k==='golive'){openDrawer(createForm('CHG',{title:`Go-live: ${a.name} ${a.ver}`,service:a.service,changeType:'Normal',risk:a.tier==='High'?'High':'Medium',agent:a.id,agentGoLive:true,
      desc:`Deploy ${a.name} to production with ${a.autonomy.toLowerCase()}. Back-out: switch the agent off with its kill switch; work returns to the manual queue. Evidence: evaluation set passed, controls approved by the AI governance board.`}));bindCreate();return}
  else if(k==='live'){const c=get(a.golive);if(!c||!stAt(c.id,'Scheduled')||c.status==='Rejected'){toast('The go-live change must be approved and scheduled first');return}
    to('Live');const v=curVer(a);v.draft=false;v.at=now;v.chg=c.id;v.note='First release';a.ver=v.v;feed('AI',`${a.id} ${a.name} is live (${c.id})`,a.id)}
  else if(k==='suspend'){a.status='Suspended';log('Kill switch used: agent suspended. Requests now go to the service desk queue');feed('AI',`${a.id} ${a.name} suspended by the kill switch`,a.id)}
  else if(k==='resume'){const v=curVer(a);if(!v.chg){toast(`${v.v} has no change record. Roll back, or take it through change first`);return}
    a.status='Live';log(`Resumed on ${v.v}`);a.metrics.blocks=0;feed('AI',`${a.id} ${a.name} resumed on ${v.v}`,a.id)}
  else if(k==='rollback'){const v=curVer(a);const i=a.versions.indexOf(v);if(i<1)return;v.active=false;v.rolledBack=true;a.versions[i-1].active=true;a.ver=a.versions[i-1].v;
    log(`Rolled back from ${v.v} to ${a.ver}`);feed('AI',`${a.id} ${a.name} rolled back to ${a.ver}`,a.id)}
  else if(k==='inc'){openDrawer(createForm('INC',{service:a.service,title:`${a.name} acting outside its expected behaviour`,desc:`AI agent ${a.id} (${a.ver}, ${a.autonomy.toLowerCase()}).\nBusiness owner: ${a.owner}.\nStatus: ${a.status}.`,impact:2,urgency:2,caller:'AI governance',ci:a.id}));bindCreate();return}
  else if(k==='chg'){const v=curVer(a);const unctl=a.versions.find(x=>!x.chg&&!x.draft);
    openDrawer(createForm('CHG',{title:unctl?`${a.name}: re-release ${unctl.v} with the missing checks restored`:`${a.name}: prompt and model update`,service:a.service,changeType:'Normal',risk:a.tier==='High'?'High':'Medium',agent:a.id,
      desc:`Change to the agent's prompt, model or tools (now on ${v.v}). Evidence: evaluation set results attached. Back-out: roll back to ${v.v}.`}));bindCreate();return}
  else if(k==='retire'){to('Retired');feed('AI',`${a.id} ${a.name} retired`,a.id)}
  aiRefresh(a);toast(`${a.id} updated`);
});
/* Create-form and lifecycle hooks */
function aiOnCreate(t,form){
  const a=form.dataset.agent?get(form.dataset.agent):t.ci?get(t.ci):null;if(!a||a.kind!=='AGT')return;
  t.agent=a.id;if(t.type==='CHG'){t.ci=undefined;if(form.dataset.golive)a.golive=t.id}
  if(!a.links.includes(t.id))a.links.push(t.id);a.notes.push({t:t.created,who:'You (demo)',text:`${TYPES[t.type].name} ${t.id} raised`});
}
/* A successful change on a live agent deploys a new version under that change record. */
function aiChangeDone(t,now){
  const a=get(t.agent);if(!a||a.kind!=='AGT'||a.golive===t.id)return null;
  const v=curVer(a);v.active=false;const n='v'+(Math.max(...a.versions.map(x=>+x.v.slice(1)))+1);
  a.versions.push({v:n,at:now,chg:t.id,note:t.title.replace(a.name+': ',''),active:true});a.ver=n;a.notes.push({t:now,who:'Change Manager',text:`${n} deployed under ${t.id}`});
  feed('AI',`${a.id} ${a.name} ${n} deployed under ${t.id}`,a.id);return `${t.id} implemented: ${a.name} is now on ${n}, under change control`;
}
NAV_COUNT.ai=()=>DB.agents.filter(a=>a.status==='Suspended'||(a.status==='Live'&&!curVer(a).chg)).length;
