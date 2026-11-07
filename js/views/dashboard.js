/* Meridian Service Desk: Management reports */
"use strict";
/* ---------- Dashboard ---------- */
function weeks(P){const n=Math.ceil(P/7);const now=Date.now();const a=[];for(let i=0;i<n;i++){const s=now-(n-i)*7*DAY;a.push({s,e:s+7*DAY,label:fmtD(s)})}return a}
function by(arr,fn){const m={};arr.forEach(x=>{const k=fn(x);(m[k]=m[k]||[]).push(x)});return m}
function lvl(v,good,ok,inv){if(inv)return v<=good?'ok':v<=ok?'warn':'crit';return v>=good?'ok':v>=ok?'warn':'crit'}
function viewDashboard(){
  const P=ui.dash.period,tab=ui.dash.tab;
  const tabs=[['overview','Overview'],['incident','Incident'],['major','Major incident'],['problem','Problem'],['change','Change'],['release','Release'],['request','Request'],['service','Service level'],['costs','Cost of downtime'],['csat','Satisfaction'],['knowledge','Knowledge'],['event','Event'],['config','Config & assets'],['supplier','Supplier'],['continuity','Continuity & capacity'],['improvement','Improvement']];
  const fns={overview:dashOverview,incident:dashIncident,major:dashMajor,problem:dashProblem,change:dashChange,request:dashRequest,release:dashRelease,service:dashService,csat:dashCsat,knowledge:dashKnowledge,event:dashEvent,config:dashConfig,supplier:dashSupplier,continuity:dashContinuity,costs:dashCosts,improvement:dashImprovement};
  const body=(fns[tab]||dashOverview)(P);
  return `<div class="pagehead"><div><span class="eyebrow">Management reports</span><h1>Service performance</h1><p>Figures are calculated live from the records in the Service Desk. Anything you log or progress there shows up here.</p></div>
    <div class="seg" role="group" aria-label="Reporting period">${[[7,'7 days'],[30,'30 days'],[90,'90 days']].map(([v,l])=>`<button data-period="${v}" aria-pressed="${P===v}">Last ${l}</button>`).join('')}</div></div>
    <div class="tabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" data-tab="${k}" aria-selected="${tab===k}">${l}</button>`).join('')}</div>
    ${body}`;
}
function ctx(P){
  const now=Date.now(),from=now-P*DAY,W=weeks(Math.max(P,28));
  const all=DB.items;const T=k=>all.filter(t=>t.type===k);
  return {now,from,W,inc:T('INC'),prb:T('PRB'),chg:T('CHG'),req:T('REQ'),rel:T('REL')};
}
function incStats(list){const res=list.filter(t=>t.resolved);const met=res.filter(t=>slaOf(t).state==='met').length;return{n:list.length,res:res.length,mttr:avg(res.map(t=>(t.resolved-t.created)/HR)),sla:pct(met,res.length)}}
function dashOverview(P){
  const c=ctx(P);const {from,W}=c;
  const incP=c.inc.filter(t=>t.created>=from);const incR=c.inc.filter(t=>t.resolved&&t.resolved>=from);
  const st=incStats(incR);
  const openInc=c.inc.filter(isOpen);const hi=openInc.filter(t=>t.priority==='P1'||t.priority==='P2').length;
  const miP=c.inc.filter(t=>t.major&&t.created>=from);
  const chgDone=c.chg.filter(t=>t.outcome&&t.resolved>=from);const succ=pct(chgDone.filter(t=>t.outcome==='Successful').length,chgDone.length);
  const reqDone=c.req.filter(t=>t.resolved&&t.resolved>=from);const onT=pct(reqDone.filter(t=>slaOf(t).state==='met').length,reqDone.length);
  const wk=fn=>W.map(w=>fn(w.s,w.e));
  const spInc=wk((s,e)=>c.inc.filter(t=>t.created>=s&&t.created<e).length);
  const spMttr=wk((s,e)=>avg(c.inc.filter(t=>t.resolved&&t.resolved>=s&&t.resolved<e).map(t=>(t.resolved-t.created)/HR)));
  const spSla=wk((s,e)=>{const r=c.inc.filter(t=>t.resolved&&t.resolved>=s&&t.resolved<e);return pct(r.filter(t=>slaOf(t).state==='met').length,r.length)});
  const spChg=wk((s,e)=>{const r=c.chg.filter(t=>t.outcome&&t.resolved>=s&&t.resolved<e);return pct(r.filter(t=>t.outcome==='Successful').length,r.length)});
  const spReq=wk((s,e)=>{const r=c.req.filter(t=>t.resolved&&t.resolved>=s&&t.resolved<e);return pct(r.filter(t=>slaOf(t).state==='met').length,r.length)});
  const attention=DB.items.filter(t=>isOpen(t)&&(t.type==='INC'||t.type==='REQ')).map(t=>({t,s:slaOf(t)})).filter(x=>x.s&&x.s.state!=='ok').sort((a,b)=>b.s.p-a.s.p).slice(0,7);
  const cab=c.chg.filter(t=>t.status==='CAB approval').sort((a,b)=>a.planned-b.planned).slice(0,4);
  const prbOpen=c.prb.filter(isOpen);
  const svMeet=SVC.filter(s=>availOf(s,from).av>=SVC_TARGET[s]).length;
  const cs=csatIn(from);
  const health=[
    ['Incident',incP.length,openInc.length,`MTTR ${fmtDur(st.mttr)} · SLA ${st.sla}%`,lvl(st.sla,90,80)],
    ['Major incident',miP.length,c.inc.filter(t=>t.major&&isOpen(t)).length,`${c.inc.filter(t=>t.major&&t.majorStage!=='PIR complete').length} reviews outstanding`,miP.length>1?'warn':'ok'],
    ['Problem',c.prb.filter(t=>t.created>=from).length,prbOpen.length,`${prbOpen.filter(t=>t.knownError).length} known errors published`,'ok'],
    ['Change',c.chg.filter(t=>t.created>=from).length,c.chg.filter(isOpen).length,`Success ${succ}% · ${chgDone.filter(t=>t.outcome!=='Successful').length} failed or backed out`,lvl(succ,95,90)],
    ['Request',c.req.filter(t=>t.created>=from).length,c.req.filter(isOpen).length,`On time ${onT}%`,lvl(onT,85,75)],
    ['Release',c.rel.filter(t=>t.planned>=from&&t.planned<=c.now).length,c.rel.filter(isOpen).length,`${c.rel.filter(t=>t.planned>c.now).length} upcoming`,'ok'],
    ['Service level','—','—',`${svMeet}/${SVC.length} services met availability`,svMeet===SVC.length?'ok':svMeet>=SVC.length-2?'warn':'crit'],
    ['Event','—',DB.events.filter(e=>['Open','Acknowledged'].includes(e.status)).length,`${pct(DB.events.filter(e=>e.status==='Cleared').length,DB.events.length)}% auto-cleared (7 days)`,DB.events.some(e=>e.sev==='Critical'&&e.status==='Open')?'warn':'ok'],
    ['Knowledge',DB.kb.length,DB.kb.filter(k=>k.status!=='Published').length,`${pct(incR.filter(t=>t.kb).length,incR.length)}% of incidents fixed with an article`,lvl(pct(incR.filter(t=>t.kb).length,incR.length),35,25)],
    ['Improvement',DB.csi.filter(x=>x.created>=from).length,DB.csi.filter(csiOpen).length,`${DB.csi.filter(x=>x.status==='Done').length} delivered · ${DB.csi.filter(x=>csiOpen(x)&&quickWin(x)).length} quick wins open`,DB.csi.some(x=>csiOpen(x)&&x.target<c.now)?'warn':'ok'],
    ['Continuity','—',DB.bcp.filter(b=>b.nextTest<c.now).length,`${DB.bcp.filter(b=>b.result==='Failed').length} failed DR test, ${DB.bcp.filter(b=>b.nextTest<c.now).length} overdue`,DB.bcp.some(b=>b.result==='Failed'||b.nextTest<c.now)?'warn':'ok']];
  const dot=s=>`<span class="pill st-${s==='ok'?'done':s==='warn'?'hold':'bad'}">${s==='ok'?'On track':s==='warn'?'Watch':'Off track'}</span>`;
  return `${miBanner()}
  <div class="tiles">
    ${tile('Open incidents',openInc.length,'',`${hi} at P1/P2`,hi>3?'warn':'neutral',spark(spInc))}
    ${tile('Mean time to resolve',fmtDur(st.mttr).replace(/[a-z]+$/,''),fmtDur(st.mttr).replace(/^[\d.]+/,''),`${st.res} resolved`,lvl(st.mttr,12,20,true),spark(spMttr))}
    ${tile('Incident SLA met',st.sla,'%','Target 90%',lvl(st.sla,90,80),spark(spSla))}
    ${tile('Major incidents',miP.length,'',`in last ${P} days`,miP.length?'crit':'ok')}
    ${tile('Change success',succ,'%',`${chgDone.length} implemented`,lvl(succ,95,90),spark(spChg))}
    ${tile('Requests on time',onT,'%',`${reqDone.length} fulfilled`,lvl(onT,85,75),spark(spReq))}
    ${tile('Services meeting availability',svMeet,'/'+SVC.length,'against SLA targets',svMeet===SVC.length?'ok':svMeet>=SVC.length-2?'warn':'crit')}
    ${tile('Downtime cost',fmtMoney(periodCost(from),true),'',`last ${P} days · <a href="#dashboard-costs">see the breakdown</a>`,periodCost(from)>2e6?'crit':'warn')}
    ${tile('Customer satisfaction',cs.length?avg(cs.map(t=>t.csat.score)).toFixed(1):'—','/5',`${cs.length} survey responses`,cs.length?lvl(avg(cs.map(t=>t.csat.score)),4.2,3.8):'neutral')}
  </div>
  <div class="grid g2">
    <section class="panel" id="rep-health"><div class="panel-head"><h2>Process health</h2><span class="muted">Last ${P} days</span></div>
      <div class="tablewrap"><table class="fit"><thead><tr><th>Process</th><th>Raised</th><th>Open now</th><th>Key measure</th><th>Status</th></tr></thead><tbody>
      ${health.map(h=>`<tr><td><b>${h[0]}</b></td><td class="num">${h[1]}</td><td class="num">${h[2]}</td><td>${h[3]}</td><td>${dot(h[4])}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><div class="panel-head"><h2>Needs attention</h2><span class="muted">Breached or at risk of breaching SLA</span></div>
      <div class="list">${attention.map(({t,s})=>`<div class="li" data-open="${t.id}" tabindex="0">${t.priority?prioTag(t.priority):'<span class="tag">REQ</span>'}<div style="min-width:0"><div class="t-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.title)}</div><div class="t-meta"><span class="mono">${t.id}</span> · ${esc(t.group)}</div></div><span class="sla ${s.state}">${esc(s.label)}</span></div>`).join('')||'<div class="empty">Nothing at risk right now.</div>'}</div>
      ${cab.length?`<div class="panel-head" style="margin-top:6px"><h3>Awaiting CAB decision</h3></div><div class="list">${cab.map(t=>`<div class="li" data-open="${t.id}" tabindex="0"><span class="tag">${t.changeType==='Emergency'?'ECAB':'CAB'}</span><div style="min-width:0"><div class="t-title">${esc(t.title)}</div><div class="t-meta"><span class="mono">${t.id}</span> · ${t.risk} risk</div></div><span class="sla ok">${fmtD(t.planned)}</span></div>`).join('')}</div>`:''}</section>
  </div>`;
}
function dashIncident(P){
  const c=ctx(P);const {from}=c;const W=weeks(P<14?14:P);
  const opened=W.map(w=>c.inc.filter(t=>t.created>=w.s&&t.created<w.e).length);
  const resolved=W.map(w=>c.inc.filter(t=>t.resolved&&t.resolved>=w.s&&t.resolved<w.e).length);
  const incP=c.inc.filter(t=>t.created>=from);const resP=c.inc.filter(t=>t.resolved&&t.resolved>=from);
  const st=incStats(resP);const open=c.inc.filter(isOpen);
  const fcr=pct(resP.filter(t=>(t.resolved-t.created)/HR<1).length,resP.length);
  const byP=['P1','P2','P3','P4'].map(p=>{const r=resP.filter(t=>t.priority===p);const s=incStats(r);return{p,n:incP.filter(t=>t.priority===p).length,res:r.length,mttr:s.mttr,sla:s.sla}});
  const svc=Object.entries(by(incP,t=>t.service)).map(([k,v])=>({label:k,value:v.length})).sort((a,b)=>b.value-a.value);
  const ageB=[['Under 1 day',0,1],['1–3 days',1,3],['3–7 days',3,7],['Over 7 days',7,1e9]].map(([l,a,b])=>({label:l,value:open.filter(t=>{const d=(Date.now()-t.created)/DAY;return d>=a&&d<b}).length,cls:b>7?'crit':a>=3?'amber':''}));
  const grp=Object.entries(by(open,t=>t.group)).map(([k,v])=>({label:k,value:v.length,sub:v.filter(t=>slaOf(t).state==='breached').length?`${v.filter(t=>slaOf(t).state==='breached').length} breached`:''})).sort((a,b)=>b.value-a.value);
  return `<div class="tiles">
    ${tile('Logged',incP.length,'',`last ${P} days`)}${tile('Resolved',resP.length,'',`${pct(resP.length,incP.length)}% of logged`)}
    ${tile('MTTR',fmtDur(st.mttr).replace(/[a-z]+$/,''),fmtDur(st.mttr).replace(/^[\d.]+/,''),'all priorities',lvl(st.mttr,12,20,true))}
    ${tile('SLA met',st.sla,'%','Target 90%',lvl(st.sla,90,80))}${tile('Fixed within 1 hour',fcr,'%','proxy for first-contact fix')}${tile('Open backlog',open.length,'',`${open.filter(t=>t.status==='On Hold').length} on hold`)}
  </div>
  <section class="panel"><div class="panel-head"><h2>Logged vs resolved per week</h2><span class="muted">A widening gap means the backlog is growing</span></div>${lineChart(W.map(w=>w.label),[{name:'Logged',values:opened,color:'accent'},{name:'Resolved',values:resolved,color:'amber'}],{label:'Incidents logged and resolved per week'})}</section>
  <div class="grid g2">
    <section class="panel"><div class="panel-head"><h2>Performance by priority</h2></div><div class="tablewrap"><table><thead><tr><th>Priority</th><th>Logged</th><th>Resolved</th><th>MTTR</th><th>Target</th><th>SLA met</th></tr></thead><tbody>
      ${byP.map(r=>`<tr><td>${prioTag(r.p)}</td><td class="num">${r.n}</td><td class="num">${r.res}</td><td class="num">${r.res?fmtDur(r.mttr):'—'}</td><td class="num">${SLA[r.p]}h</td><td><span class="sla ${r.res?(r.sla>=90?'met':r.sla>=80?'risk':'breached'):'ok'}">${r.res?r.sla+'%':'—'}</span></td></tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><div class="panel-head"><h2>Incidents by service</h2><span class="muted">Last ${P} days</span></div>${bars(svc)}</section>
    <section class="panel"><div class="panel-head"><h2>Open backlog by age</h2></div>${bars(ageB)}</section>
    <section class="panel"><div class="panel-head"><h2>Open backlog by resolver group</h2></div>${bars(grp)}</section>
  </div>`;
}
function dashMajor(P){
  const c=ctx(P);const mis=c.inc.filter(t=>t.major).sort((a,b)=>b.created-a.created);
  const inP=mis.filter(t=>t.created>=c.from);const restored=mis.filter(t=>t.resolved);
  const ttr=avg(restored.map(t=>(t.resolved-t.created)/HR));
  const pirOut=mis.filter(t=>t.majorStage!=='PIR complete'&&t.resolved).length;
  return `${miBanner()}<div class="tiles">${tile('Major incidents',inP.length,'',`last ${P} days`,inP.length?'crit':'ok')}${tile('Avg time to restore',fmtDur(ttr).replace(/[a-z]+$/,''),fmtDur(ttr).replace(/^[\d.]+/,''),'all major incidents','neutral')}${tile('Reviews outstanding',pirOut,'','PIR due within 5 days',pirOut?'warn':'ok')}${tile('Problems raised',mis.filter(t=>t.links.some(l=>l.startsWith('PRB'))).length,'',`of ${mis.length} major incidents`)}</div>
  <section class="panel" id="rep-mi"><div class="panel-head"><h2>Major incident register</h2><span class="muted">All major incidents in the last 90 days</span></div>
  <div class="tablewrap"><table><thead><tr><th>ID</th><th>Summary</th><th>Service</th><th>Started</th><th>Time to restore</th><th>Stage</th><th>Problem</th></tr></thead><tbody>
  ${mis.map(t=>{const pr=t.links.map(get).find(x=>x&&x.type==='PRB');return `<tr class="click" data-open="${t.id}" tabindex="0"><td class="mono">${t.id}</td><td>${esc(t.title)}</td><td>${esc(t.service)}</td><td class="num">${fmtDT(t.created)}</td><td class="num">${t.resolved?fmtDur((t.resolved-t.created)/HR):`<span class="sla breached">Ongoing ${ageText(t.created)}</span>`}</td><td>${stepperHtml(MI_FLOW,t.majorStage,true)}<div class="t-meta">${esc(t.majorStage)}</div></td><td>${pr?`<span class="mono">${pr.id}</span> ${pill(pr)}`:'<span class="muted">—</span>'}</td></tr>`}).join('')||'<tr><td colspan="7"><div class="empty">No major incidents.</div></td></tr>'}</tbody></table></div></section>`;
}
function dashProblem(P){
  const c=ctx(P);const open=c.prb.filter(isOpen);
  const stages=FLOW.PRB.slice(0,4).map(s=>({label:s,value:open.filter(t=>t.status===s).length,cls:s==='Known error'?'amber':''}));
  const rc=Object.entries(by(c.prb.filter(t=>t.rootCause),t=>t.rootCause)).map(([k,v])=>({label:k,value:v.length})).sort((a,b)=>b.value-a.value);
  const top=c.prb.map(t=>({t,n:t.links.filter(l=>l.startsWith('INC')).length})).sort((a,b)=>b.n-a.n).slice(0,8);
  const res=c.prb.filter(t=>t.resolved&&t.resolved>=c.from);
  return `<div class="tiles">${tile('Open problems',open.length,'',`${open.filter(t=>t.priority==='P1'||t.priority==='P2').length} at P1/P2`)}${tile('Known errors',open.filter(t=>t.knownError).length,'','workaround available to desk','ok')}${tile('Raised',c.prb.filter(t=>t.created>=c.from).length,'',`last ${P} days`)}${tile('Resolved',res.length,'',`avg ${res.length?fmtDur(avg(res.map(t=>(t.resolved-t.created)/HR))):'—'} to fix`)}${tile('Incidents linked',c.prb.reduce((a,t)=>a+t.links.filter(l=>l.startsWith('INC')).length,0),'','across all problems')}</div>
  <div class="grid g2"><section class="panel"><div class="panel-head"><h2>Open problems by stage</h2></div>${bars(stages)}</section>
  <section class="panel"><div class="panel-head"><h2>Root cause categories</h2><span class="muted">Problems with a confirmed cause</span></div>${bars(rc,{})}</section></div>
  <section class="panel"><div class="panel-head"><h2>Problems driving the most incidents</h2></div><div class="tablewrap"><table><thead><tr><th>ID</th><th>Problem</th><th>Service</th><th>Linked incidents</th><th>Root cause</th><th>Status</th></tr></thead><tbody>
  ${top.map(({t,n})=>`<tr class="click" data-open="${t.id}" tabindex="0"><td class="mono">${t.id}</td><td>${esc(t.title)}</td><td>${esc(t.service)}</td><td class="num"><b>${n}</b></td><td>${esc(t.rootCause||'—')}</td><td>${pill(t)} ${t.knownError?'<span class="tag ke">KE</span>':''}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function dashChange(P){
  const c=ctx(P);const W=weeks(P<14?14:P);const {from,now}=c;
  const done=c.chg.filter(t=>t.outcome&&t.resolved>=from);
  const succ=pct(done.filter(t=>t.outcome==='Successful').length,done.length);
  const raised=c.chg.filter(t=>t.created>=from);const em=pct(raised.filter(t=>t.changeType==='Emergency').length,raised.length);
  const caused=done.filter(t=>t.causedIncident).length;
  const types=['Standard','Normal','Emergency'];
  const rows=W.map(w=>types.map(k=>c.chg.filter(t=>t.changeType===k&&t.planned>=w.s&&t.planned<w.e&&t.planned<=now).length));
  const out=types.map(k=>{const d=done.filter(t=>t.changeType===k);return{k,n:d.length,ok:d.filter(t=>t.outcome==='Successful').length,f:d.filter(t=>t.outcome==='Failed').length,b:d.filter(t=>t.outcome==='Backed out').length}});
  const fsc=c.chg.filter(t=>t.planned>now&&t.planned<now+14*DAY&&isOpen(t)).sort((a,b)=>a.planned-b.planned);
  return `<div class="tiles">${tile('Implemented',done.length,'',`last ${P} days`)}${tile('Change success',succ,'%','Target 95%',lvl(succ,95,90))}${tile('Emergency changes',em,'%','of changes raised · target < 10%',lvl(em,10,15,true))}${tile('Caused incidents',caused,'','failed changes linked to incidents',caused?'warn':'ok')}${tile('Awaiting CAB',c.chg.filter(t=>t.status==='CAB approval').length,'','decision needed')}</div>
  <section class="panel"><div class="panel-head"><h2>Changes implemented per week, by type</h2></div>${stackCols(W.map(w=>w.label),types,rows,['accent','info','crit'],'Changes per week by type')}</section>
  <div class="grid g2"><section class="panel"><div class="panel-head"><h2>Outcome by change type</h2><span class="muted">Last ${P} days</span></div><div class="tablewrap"><table><thead><tr><th>Type</th><th>Done</th><th>Successful</th><th>Failed</th><th>Backed out</th><th>Success</th></tr></thead><tbody>
    ${out.map(o=>`<tr><td><b>${o.k}</b></td><td class="num">${o.n}</td><td class="num">${o.ok}</td><td class="num">${o.f}</td><td class="num">${o.b}</td><td><span class="sla ${o.n?(pct(o.ok,o.n)>=95?'met':pct(o.ok,o.n)>=90?'risk':'breached'):'ok'}">${o.n?pct(o.ok,o.n)+'%':'—'}</span></td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel" id="rep-fsc"><div class="panel-head"><h2>Forward schedule of change</h2><span class="muted">Next 14 days</span></div><div class="list">${fsc.map(t=>`<div class="li" data-open="${t.id}" tabindex="0"><span class="mono" style="min-width:58px">${fmtD(t.planned)}</span><div style="min-width:0"><div class="t-title">${esc(t.title)}</div><div class="t-meta">${t.changeType} · ${t.risk} risk · <span class="mono">${t.id}</span></div></div>${pill(t)}</div>`).join('')||'<div class="empty">Nothing scheduled.</div>'}</div></section></div>`;
}
function dashRequest(P){
  const c=ctx(P);const W=weeks(P<14?14:P);const {from}=c;
  const raised=c.req.filter(t=>t.created>=from);const done=c.req.filter(t=>t.resolved&&t.resolved>=from&&t.status!=='Rejected');
  const onT=pct(done.filter(t=>slaOf(t).state==='met').length,done.length);
  const vol=W.map(w=>c.req.filter(t=>t.created>=w.s&&t.created<w.e).length);
  const items=CATALOG.map(it=>{const d=done.filter(t=>t.item===it.name);const a=avg(d.map(t=>(t.resolved-t.created)/HR));return{it,n:raised.filter(t=>t.item===it.name).length,d:d.length,a,ot:pct(d.filter(t=>slaOf(t).state==='met').length,d.length)}}).sort((a,b)=>b.n-a.n);
  const maxH=Math.max(...items.map(i=>Math.max(i.a,i.it.target)))*1.05;
  return `<div class="tiles">${tile('Requests raised',raised.length,'',`last ${P} days`)}${tile('Fulfilled',done.length,'')}${tile('On-time fulfilment',onT,'%','Target 85%',lvl(onT,85,75))}${tile('Awaiting approval',c.req.filter(t=>t.status==='Approval').length,'','line manager sign-off')}${tile('Open',c.req.filter(isOpen).length,'',`${c.req.filter(t=>isOpen(t)&&slaOf(t).state==='breached').length} past target`)}</div>
  <section class="panel"><div class="panel-head"><h2>Request volume per week</h2></div>${lineChart(W.map(w=>w.label),[{name:'Requests',values:vol}],{label:'Requests per week'})}</section>
  <section class="panel" id="rep-req-items"><div class="panel-head"><h2>Catalogue items: average fulfilment vs target</h2><span class="muted">Bar = average hours · line = target</span></div>
  ${bars(items.map(i=>({label:i.it.name,value:i.a,mark:i.it.target,text:i.d?fmtDur(i.a):'—',sub:`${i.n} raised · ${i.d?i.ot+'% on time':''}`,cls:i.a>i.it.target?'crit':''})),{max:maxH})}</section>`;
}
function dashRelease(P){
  const c=ctx(P);const now=c.now;const rels=c.rel.slice().sort((a,b)=>b.planned-a.planned);
  const els=r=>c.inc.filter(t=>t.service===r.service&&t.created>=r.planned&&t.created<r.planned+7*DAY).length;
  const past=rels.filter(r=>r.planned<=now);
  return `<div class="tiles">${tile('Deployed',past.filter(r=>r.planned>=c.from).length,'',`last ${P} days`)}${tile('Upcoming',rels.filter(r=>r.planned>now).length,'','in build or test')}${tile('In early life support',rels.filter(r=>r.status==='Early life support').length,'','hypercare period')}${tile('Avg incidents in first week',past.length?(avg(past.map(els))).toFixed(1):'—','','after deployment')}</div>
  <section class="panel"><div class="panel-head"><h2>Release calendar</h2></div><div class="tablewrap"><table><thead><tr><th>Release</th><th>Service</th><th>Deployment</th><th>Pipeline</th><th>Changes</th><th>Incidents in first 7 days</th></tr></thead><tbody>
  ${rels.map(r=>{const e=r.planned<=now?els(r):null;return `<tr class="click" data-open="${r.id}" tabindex="0"><td><div class="t-title">${esc(r.title)}</div><div class="t-meta mono">${r.id}</div></td><td>${esc(r.service)}</td><td class="num">${fmtD(r.planned)} ${r.planned>now?`<span class="t-meta">in ${Math.ceil((r.planned-now)/DAY)}d</span>`:''}</td><td style="min-width:160px">${stepperHtml(FLOW.REL,r.status,true)}<div class="t-meta">${esc(r.status)}</div></td><td class="num">${r.links.filter(l=>l.startsWith('CHG')).length}</td><td class="num">${e==null?'<span class="muted">—</span>':`<span class="sla ${e>4?'breached':e>2?'risk':'met'}">${e}</span>`}</td></tr>`}).join('')}</tbody></table></div></section>`;
}

function availOf(s,from){
  const now=Date.now();const mins=(now-from)/6e4;let down=0;
  DB.items.forEach(t=>{if(t.type!=='INC'||t.service!==s||(t.priority!=='P1'&&t.priority!=='P2'))return;const a=Math.max(t.created,from),b=Math.min(t.resolved||now,now);if(b<=a)return;down+=(b-a)/6e4*(t.major?.7:t.priority==='P1'?.1:.01)});
  return{down,av:Math.max(0,100*(1-down/mins))};
}
const fmtAv=v=>(v>=99.9995?'100.000':v.toFixed(3))+'%';
function csatIn(from){return DB.items.filter(t=>t.csat&&t.csat.t>=from)}
function dashService(P){
  const from=Date.now()-P*DAY;
  const rows=SVC.map(s=>{const a=availOf(s,from);const inc=DB.items.filter(t=>t.type==='INC'&&t.service===s);const res=inc.filter(t=>t.resolved&&t.resolved>=from);const cs=res.filter(t=>t.csat).map(t=>t.csat.score);
    return{s,...a,target:SVC_TARGET[s],ok:a.av>=SVC_TARGET[s],hi:inc.filter(t=>t.created>=from&&(t.priority==='P1'||t.priority==='P2')).length,sla:incStats(res).sla,n:res.length,cs:cs.length?avg(cs):null}});
  const meet=rows.filter(r=>r.ok).length;const all=csatIn(from);
  return `<div class="tiles">${tile('Services meeting availability',meet,'/'+SVC.length,'against agreed targets',meet===SVC.length?'ok':meet>=SVC.length-2?'warn':'crit')}${tile('Downtime',Math.round(rows.reduce((a,r)=>a+r.down,0)/60*10)/10,'h','weighted, all services')}${tile('Incident SLA met',incStats(DB.items.filter(t=>t.type==='INC'&&t.resolved&&t.resolved>=from)).sla,'%','Target 90%')}${tile('Customer satisfaction',all.length?avg(all.map(t=>t.csat.score)).toFixed(1):'—','/5',`${all.length} responses`)}</div>
  <section class="panel" id="rep-avail"><div class="panel-head"><h2>Availability against target</h2><span class="muted">Scale 98% to 100% · line = target · last ${P} days</span></div>
  ${bars(rows.map(r=>({label:r.s,value:Math.max(0,r.av-98),mark:r.target-98,text:fmtAv(r.av),cls:r.ok?'ok':'crit'})),{max:2})}</section>
  <section class="panel"><div class="panel-head"><h2>Service level report</h2><span class="muted">For the monthly service review</span></div><div class="tablewrap"><table><thead><tr><th>Service</th><th>Tier</th><th>Availability</th><th>Target</th><th>Downtime</th><th>P1/P2</th><th>Incident SLA met</th><th>CSAT</th><th>Status</th></tr></thead><tbody>
  ${rows.map(r=>`<tr class="click" data-cmsvcgo="${esc(r.s)}"><td><b>${esc(r.s)}</b></td><td>${SVC_TIER[r.s]}</td><td class="num"><span class="sla ${r.ok?'met':'breached'}">${fmtAv(r.av)}</span></td><td class="num">${r.target}%</td><td class="num">${r.down<1?'—':fmtDur(r.down/60)}</td><td class="num">${r.hi}</td><td class="num">${r.n?r.sla+'%':'—'}</td><td class="num">${r.cs?r.cs.toFixed(1):'—'}</td><td><span class="pill st-${r.ok?'done':'bad'}">${r.ok?'Met':'Missed'}</span></td></tr>`).join('')}</tbody></table></div></section>`;
}
function dashCsat(P){
  const from=Date.now()-P*DAY;const W=weeks(P<14?14:P);const all=csatIn(from);
  const resolved=DB.items.filter(t=>(t.type==='INC'||t.type==='REQ')&&t.resolved&&t.resolved>=from);
  const av=all.length?avg(all.map(t=>t.csat.score)):0;const sat=pct(all.filter(t=>t.csat.score>=4).length,all.length);
  const trend=W.map(w=>{const x=DB.items.filter(t=>t.csat&&t.csat.t>=w.s&&t.csat.t<w.e);return x.length?+avg(x.map(t=>t.csat.score)).toFixed(2):av});
  const grp=Object.entries(by(all,t=>t.group)).map(([k,v])=>{const a=avg(v.map(t=>t.csat.score));return{label:k,value:a,text:a.toFixed(1),sub:`${v.length}`,cls:a>=4.2?'ok':a>=3.8?'':'crit'}}).sort((a,b)=>b.value-a.value);
  const dist=[5,4,3,2,1].map(s=>({label:'★'.repeat(s),value:all.filter(t=>t.csat.score===s).length,cls:s>=4?'ok':s===3?'muted':'crit'}));
  const comments=all.filter(t=>t.csat.comment).sort((a,b)=>b.csat.t-a.csat.t).slice(0,8);
  return `<div class="tiles">${tile('Average score',av.toFixed(2),'/5','Target 4.2',lvl(av,4.2,3.8))}${tile('Satisfied',sat,'%','scored 4 or 5',lvl(sat,85,75))}${tile('Responses',all.length,'',`${pct(all.length,resolved.length)}% response rate`)}${tile('Low scores to follow up',all.filter(t=>t.csat.score<=2&&!t.csat.followUp).length,'','scored 1 or 2, not yet called back',all.some(t=>t.csat.score<=2&&!t.csat.followUp)?'warn':'ok')}</div>
  <section class="panel" id="rep-csat-trend"><div class="panel-head"><h2>Average score per week</h2></div>${lineChart(W.map(w=>w.label),[{name:'Average score',values:trend}],{max:5,target:4.2,label:'Average satisfaction score per week'})}</section>
  <div class="grid g2"><section class="panel"><div class="panel-head"><h2>Score by resolver group</h2><span class="muted">Average · responses</span></div>${bars(grp,{max:5})}</section>
  <section class="panel"><div class="panel-head"><h2>Score distribution</h2></div>${bars(dist)}</section></div>
  <section class="panel"><div class="panel-head"><h2>Latest comments</h2></div><div class="list">${comments.map(t=>`<div class="li" data-open="${t.id}" tabindex="0"><span class="stars">${'★'.repeat(t.csat.score)}${'☆'.repeat(5-t.csat.score)}</span><div style="min-width:0"><div class="t-title">“${esc(t.csat.comment)}”</div><div class="t-meta"><span class="mono">${t.id}</span> · ${esc(t.group)}</div></div>${t.csat.score<=2?(t.csat.followUp?'<span class="pill st-done">Called back</span>':'<span class="pill st-bad">Call back</span>'):'<span class="t-meta">'+fmtD(t.csat.t)+'</span>'}</div>`).join('')||'<div class="empty">No comments in this period.</div>'}</div></section>`;
}
function dashKnowledge(P){
  const from=Date.now()-P*DAY;const W=weeks(P<14?14:P);
  const res=DB.items.filter(t=>t.type==='INC'&&t.resolved&&t.resolved>=from);
  const trend=W.map(w=>{const r=DB.items.filter(t=>t.type==='INC'&&t.resolved&&t.resolved>=w.s&&t.resolved<w.e);return pct(r.filter(t=>t.kb).length,r.length)});
  const cats=Object.entries(by(DB.kb,k=>k.category)).map(([k,v])=>({label:k,value:v.length,cls:k==='Known error'?'amber':''}));
  const top=DB.kb.slice().sort((a,b)=>b.uses-a.uses).slice(0,8);
  const gap=DB.items.filter(t=>t.type==='PRB'&&t.knownError&&isOpen(t)&&!t.kb);
  return `<div class="tiles">${tile('Published articles',DB.kb.filter(k=>k.status==='Published').length,'',`${DB.kb.filter(k=>k.status!=='Published').length} in review`)}${tile('Incidents fixed with knowledge',pct(res.filter(t=>t.kb).length,res.length),'%','Target 35%',lvl(pct(res.filter(t=>t.kb).length,res.length),35,25))}${tile('Article views',DB.kb.reduce((a,k)=>a+k.views,0).toLocaleString(),'','all time')}${tile('Known errors without article',gap.length,'','knowledge gap',gap.length?'warn':'ok')}</div>
  <section class="panel"><div class="panel-head"><h2>Incidents resolved using a knowledge article</h2><span class="muted">% per week</span></div>${lineChart(W.map(w=>w.label),[{name:'Resolved with knowledge',values:trend}],{unit:'%',max:100,target:35,label:'Knowledge use per week'})}</section>
  <div class="grid g2"><section class="panel" id="rep-kb-top"><div class="panel-head"><h2>Most used articles</h2></div><div class="list">${top.map(k=>`<div class="li" data-open="${k.id}" tabindex="0"><span class="mono" style="font-size:12px">${k.id}</span><div style="min-width:0"><div class="t-title">${esc(k.title)}</div><div class="t-meta">${esc(k.category)} · ${k.helpful}% helpful</div></div><b class="num">${k.uses}</b></div>`).join('')}</div></section>
  <section class="panel"><div class="panel-head"><h2>Articles by category</h2></div>${bars(cats)}
  ${gap.length?`<div class="panel-head" style="margin-top:6px"><h3>Known errors needing an article</h3></div><div class="links">${gap.map(p=>`<button class="linkchip" data-open="${p.id}">${p.id}</button>`).join('')}</div>`:''}</section></div>`;
}
function dashEvent(){
  const now=Date.now();const days=[];for(let i=6;i>=0;i--){const s=new Date(now-i*DAY);s.setHours(0,0,0,0);days.push({s:s.getTime(),e:s.getTime()+DAY,label:s.toLocaleDateString('en-GB',{weekday:'short',day:'numeric'})})}
  const sev=['Critical','Warning','Info'];const E=DB.events;
  const rows=days.map(d=>sev.map(s=>E.filter(e=>e.sev===s&&e.time>=d.s&&e.time<d.e).length));
  const outcome=['Cleared','Correlated','Incident raised','Acknowledged','Open'].map(s=>({label:s,value:E.filter(e=>e.status===s).length,cls:s==='Open'?'crit':s==='Incident raised'?'amber':s==='Cleared'?'ok':'muted'}));
  const noisy=Object.entries(by(E,e=>e.ci)).map(([k,v])=>({label:(get(k)||{}).name||k,value:v.reduce((a,e)=>a+e.count,0)})).sort((a,b)=>b.value-a.value).slice(0,8);
  const raw=E.reduce((a,e)=>a+e.count,0);
  return `<div class="tiles">${tile('Raw alerts',raw,'','last 7 days')}${tile('Events after de-duplication',E.length,'',`${pct(raw-E.length,raw)}% reduction`,'ok')}${tile('Became incidents',E.filter(e=>e.inc).length,'',`${pct(E.filter(e=>e.inc).length,E.length)}% of events`)}${tile('Open critical events',E.filter(e=>e.sev==='Critical'&&e.status==='Open').length,'','need a decision now',E.some(e=>e.sev==='Critical'&&e.status==='Open')?'crit':'ok')}</div>
  <section class="panel"><div class="panel-head"><h2>Events per day by severity</h2><span class="muted">Event data covers the last 7 days</span></div>${stackCols(days.map(d=>d.label),sev,rows,['crit','amber','info'],'Events per day by severity')}</section>
  <div class="grid g2"><section class="panel" id="rep-ev-out"><div class="panel-head"><h2>What happened to events</h2></div>${bars(outcome)}</section>
  <section class="panel"><div class="panel-head"><h2>Noisiest configuration items</h2><span class="muted">Raw alerts · candidates for threshold tuning</span></div>${bars(noisy)}</section></div>`;
}
function dashConfig(P){
  const from=Date.now()-P*DAY;const now=Date.now();
  const cls=Object.entries(by(DB.ci,c=>c.cls)).map(([k,v])=>({label:k,value:v.length}));
  const withInc=new Set(DB.items.filter(t=>t.type==='INC'&&isOpen(t)&&t.ci).map(t=>t.ci));
  const exp=DB.ci.filter(c=>c.warranty&&c.warranty<now+90*DAY);
  const incCls=Object.entries(by(DB.items.filter(t=>t.type==='INC'&&t.created>=from&&t.ci),t=>(get(t.ci)||{}).cls||'Unknown')).map(([k,v])=>({label:k,value:v.length})).sort((a,b)=>b.value-a.value);
  const licIssues=SW.filter(l=>l.used>l.owned).length;const unused=SW.reduce((a,l)=>a+(l.used/l.owned<.6?(l.owned-l.used)*l.unit:0),0);
  return `<div class="tiles">${tile('Configuration items',DB.ci.length,'',`${DB.ci.filter(c=>c.cls==='Business service').length} business services`)}${tile('CIs with open incidents',withInc.size,'','impacted right now',withInc.size>6?'warn':'neutral')}${tile('Warranty expiring',exp.length,'','within 90 days or expired',exp.length?'warn':'ok')}${tile('Licence over-deployment',licIssues,'','products out of compliance',licIssues?'crit':'ok')}${tile('Unused licence spend',Math.round(unused/1000),'k','SGD a year, reclaimable','neutral')}</div>
  <div class="grid g2"><section class="panel"><div class="panel-head"><h2>CIs by class</h2></div>${bars(cls)}</section>
  <section class="panel"><div class="panel-head"><h2>Incidents by CI class</h2><span class="muted">Last ${P} days</span></div>${bars(incCls)}</section></div>
  <div class="grid g2"><section class="panel"><div class="panel-head"><h2>Software licence position</h2></div>${licTable()}</section>
  <section class="panel"><div class="panel-head"><h2>Warranty expiring</h2></div><div class="list">${exp.sort((a,b)=>a.warranty-b.warranty).map(c=>`<div class="li" data-open="${c.id}" tabindex="0"><span class="mono" style="font-size:12px">${esc(c.name)}</span><div class="t-meta">${esc(c.cls)} · ${esc(c.service)}</div><span class="sla ${c.warranty<now?'breached':'risk'}">${c.warranty<now?'Expired':fmtD(c.warranty)}</span></div>`).join('')||'<div class="empty">Nothing expiring.</div>'}</div></section></div>`;
}
function dashSupplier(P){
  const from=Date.now()-P*DAY;const now=Date.now();
  const rows=SUPPLIERS.map(s=>{
    const av=s.services.map(x=>({x,...availOf(x,from),t:SVC_TARGET[x]}));const miss=av.filter(a=>a.av<a.t);
    const inc=DB.items.filter(t=>t.type==='INC'&&s.services.includes(t.service)&&t.created>=from&&(t.priority==='P1'||t.priority==='P2')).length;
    const prb=DB.items.filter(t=>t.type==='PRB'&&s.services.includes(t.service)&&t.rootCause==='Third-party supplier').length;
    const ren=Math.round((new Date(s.renewal+'T00:00:00').getTime()-now)/DAY);
    const rag=miss.length||prb>=2?'Red':(inc>3||ren<90||prb)?'Amber':'Green';
    return{s,av,miss,inc,prb,ren,rag}});
  const ragCls={Red:'bad',Amber:'hold',Green:'done'};
  return `<div class="tiles">${tile('Suppliers managed',SUPPLIERS.length,'',`${SUPPLIERS.filter(s=>s.tier==='Critical').length} critical`)}${tile('Red or amber',rows.filter(r=>r.rag!=='Green').length,'','need a service review',rows.some(r=>r.rag==='Red')?'crit':'warn')}${tile('Renewals due',rows.filter(r=>r.ren<120).length,'','within 120 days','neutral')}${tile('Annual contract value',(SUPPLIERS.reduce((a,s)=>a+s.value,0)/1e6).toFixed(1),'M','SGD')}</div>
  <section class="panel" id="rep-supplier"><div class="panel-head"><h2>Supplier scorecard</h2><span class="muted">Last ${P} days</span></div><div class="tablewrap"><table><thead><tr><th>Supplier</th><th>Tier</th><th>Services supported</th><th>Availability</th><th>P1/P2 incidents</th><th>Supplier-caused problems</th><th>Renewal</th><th>RAG</th></tr></thead><tbody>
  ${rows.map(r=>`<tr><td><div class="t-title">${r.s.name}</div><div class="t-meta">${r.s.scope}</div></td><td>${r.s.tier}</td><td>${r.s.services.map(esc).join(', ')}</td><td>${r.av.map(a=>`<div class="sla ${a.av>=a.t?'met':'breached'}">${fmtAv(a.av)} <span class="t-meta">/ ${a.t}%</span></div>`).join('')}</td><td class="num">${r.inc}</td><td class="num">${r.prb}</td><td class="num">${new Date(r.s.renewal).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}${r.ren<120?`<div class="sla risk">in ${r.ren} days</div>`:''}</td><td><span class="pill st-${ragCls[r.rag]}">${r.rag}</span></td></tr>`).join('')}</tbody></table></div></section>`;
}
function dashContinuity(){
  const now=Date.now();
  const caps=DB.ci.filter(c=>c.cap).map(c=>({c,mx:Math.max(c.cap.cpu,c.cap.mem,c.cap.disk)})).sort((a,b)=>b.mx-a.mx).slice(0,10);
  const overdue=DB.bcp.filter(b=>b.nextTest<now);const hot=DB.ci.filter(c=>c.cap&&Math.max(c.cap.cpu,c.cap.mem,c.cap.disk)>=80);
  const resCls={Passed:'done','Passed with actions':'hold',Failed:'bad'};
  return `<div class="tiles">${tile('DR tests passed',DB.bcp.filter(b=>b.result==='Passed').length,'/'+DB.bcp.length,'latest test per service',DB.bcp.some(b=>b.result==='Failed')?'warn':'ok')}${tile('DR tests overdue',overdue.length,'','past scheduled date',overdue.length?'crit':'ok')}${tile('CIs above 80%',hot.length,'','CPU, memory or disk',hot.length?'warn':'ok')}${tile('Forecast to hit 90% disk',DB.ci.filter(c=>c.cap&&c.cap.disk<90&&(90-c.cap.disk)/c.cap.growth<=3).length,'','within 3 months')}</div>
  <section class="panel" id="rep-dr"><div class="panel-head"><h2>Service continuity plans</h2><span class="muted">Recovery time and point objectives, with the last DR test</span></div><div class="tablewrap"><table><thead><tr><th>Service</th><th>Tier</th><th>RTO</th><th>RPO</th><th>Last DR test</th><th>Recovered in</th><th>Result</th><th>Next test</th></tr></thead><tbody>
  ${DB.bcp.map(b=>`<tr><td><b>${esc(b.service)}</b></td><td>${b.tier}</td><td class="num">${b.rto}</td><td class="num">${b.rpo}</td><td class="num">${fmtD(b.lastTest)}</td><td class="num">${b.achieved}</td><td><span class="pill st-${resCls[b.result]}">${b.result}</span></td><td class="num">${b.nextTest<now?`<span class="sla breached">Overdue ${Math.round((now-b.nextTest)/DAY)} d</span>`:fmtD(b.nextTest)}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><div class="panel-head"><h2>Capacity: busiest configuration items</h2><span class="muted">Marker at 80% threshold</span></div><div class="tablewrap"><table><thead><tr><th>CI</th><th>Service</th><th>Utilisation</th><th>Growth / month</th><th>Disk reaches 90%</th></tr></thead><tbody>
  ${caps.map(({c})=>{const m=c.cap.disk>=90?'<span class="sla breached">Already over</span>':`${Math.round((90-c.cap.disk)/Math.max(.1,c.cap.growth))} months`;return `<tr class="click" data-open="${c.id}" tabindex="0"><td><div class="mono">${esc(c.name)}</div><div class="t-meta">${esc(c.cls)}</div></td><td>${esc(c.service)}</td><td>${meters(c.cap)}</td><td class="num">+${c.cap.growth}%</td><td class="num">${m}</td></tr>`}).join('')}</tbody></table></div></section>`;
}

