/* Meridian Service Desk: Continual improvement register (CSI) */
"use strict";
const CSI_FLOW=['Idea','Assessed','Approved','In progress','Done'];
const CSI_SOURCES=['Post-incident review','Service review','Problem trend','Customer feedback','Staff suggestion','Audit'];
const LVL=['High','Medium','Low'];
const lvN={High:3,Medium:2,Low:1};
function csiQuad(x){const v=lvN[x.value],e=lvN[x.effort];return v>e?'Quick win':v===e?(v>=2?'Major project':'Fill-in'):'Reconsider'}
const quickWin=x=>csiQuad(x)==='Quick win';
const csiOpen=x=>!['Done','Rejected'].includes(x.status);
function genCSI(now){
  const S=[
    ['Auto-restart matching workers when the queue spikes','Post-incident review','Trade Matching','High','Medium','In progress','Time to restore matching: 2.4 h → 30 min','',80],
    ['Add an MFA fallback for remote users','Post-incident review','Identity & Access','High','Low','Done','MFA incidents: 14 a month → 3 a month','3 a month in the last full month',110],
    ['Tune noisy disk alerts on the data warehouse','Problem trend','Data Warehouse','Medium','Low','Approved','Disk warnings: 40 a week → 10 a week','',35],
    ['Self-service password reset campaign','Service review','Identity & Access','High','Low','In progress','Password reset calls: 180 a month → 90 a month','',50],
    ['Speed up statement downloads','Customer feedback','Client Portal','Medium','High','Assessed','p95 download time: 9 s → 3 s','',28],
    ['Weekly CAB pre-read pack','Staff suggestion','—','Low','Low','Done','CAB meeting length: 90 min → 45 min','50 min on average',140],
    ['Second VPN gateway in SG2','Service review','Network & VPN','High','High','Approved','VPN availability: 99.7% → 99.95%','',60],
    ['Supplier scorecards in quarterly reviews','Audit','—','Medium','Medium','Idea','Supplier-caused P1/P2: 6 a quarter → 3 a quarter','',12],
    ['Knowledge article review reminders','Staff suggestion','—','Medium','Low','Idea','Articles not reviewed in 12 months: 40% → 10%','',9],
    ['Automate new starter account creation','Customer feedback','HR Self-Service','High','Medium','Assessed','Onboarding fulfilment: 96 h → 48 h','',22],
    ['Move the HR portal to managed hosting','Service review','HR Self-Service','Low','High','Rejected','—','',75],
    ['Chat channel for the service desk','Customer feedback','—','Medium','Medium','Idea','First contact resolution: 62% → 70%','',5]];
  const own=['A. Tan','R. Kumar','M. Lim','J. Ong','S. Wong','D. Rahman','L. Chen','K. Nair'];
  return S.map(([title,source,service,value,effort,status,measure,achieved,age],i)=>{
    const created=now-age*DAY;
    const x={kind:'CSI',id:'CSI-'+String(41+i*3).padStart(4,'0'),title,source,service,value,effort,status,measure,achieved,owner:own[i%own.length],created,target:created+(effort==='High'?150:effort==='Medium'?90:45)*DAY,links:[],
      notes:[{t:created,who:own[(i+3)%own.length],text:`Logged from ${source.toLowerCase()}`}]};
    const idx=CSI_FLOW.indexOf(status);for(let k=1;k<=idx;k++)x.notes.push({t:created+k*Math.min(age/(idx+1),20)*DAY,who:x.owner,text:`Moved to ${CSI_FLOW[k]}`});
    if(status==='Rejected')x.notes.push({t:created+10*DAY,who:'Service owner',text:'Rejected: cost outweighs the benefit this year'});
    if(status==='Done')x.done=created+(age-15)*DAY;
    return x;
  });
}
function csiPill(x){return `<span class="pill st-${x.status==='Done'?'done':x.status==='Rejected'?'bad':x.status==='Idea'?'new':x.status==='In progress'?'prog':'hold'}">${x.status}</span>`}
function viewImprovement(){
  const L=DB.csi;const f=ui2.csi=ui2.csi||{quad:'All'};
  const rows=L.filter(x=>f.quad==='All'||csiQuad(x)===f.quad).sort((a,b)=>csiOpen(b)-csiOpen(a)||(lvN[b.value]-lvN[b.effort])-(lvN[a.value]-lvN[a.effort])||b.created-a.created);
  const cell=(v,e)=>{const n=L.filter(x=>csiOpen(x)&&x.value===v&&x.effort===e).length;const q=csiQuad({value:v,effort:e});return `<td class="mcell q-${q.replace(' ','')}" title="${q}"><b>${n}</b><span>${q}</span></td>`};
  return `<div class="pagehead"><div><span class="eyebrow">Continual improvement</span><h1>Improvement register</h1><p>One place to log, prioritise and track improvements from post-incident reviews, service reviews, problem trends and feedback, and to check the benefit was actually delivered.</p></div>
    <div class="actions"><button class="btn primary" data-newcsi="1">+ Log improvement</button><button class="btn" data-tourstart="csi">Guided walkthrough</button></div></div>
  <div class="tiles">${tile('Open improvements',L.filter(csiOpen).length,'',`${L.filter(x=>x.status==='In progress').length} in progress`)}${tile('Quick wins waiting',L.filter(x=>csiOpen(x)&&quickWin(x)&&CSI_FLOW.indexOf(x.status)<3).length,'','high value, low effort','ok')}${tile('Delivered',L.filter(x=>x.status==='Done').length,'','with benefit measured')}${tile('From post-incident reviews',L.filter(x=>x.source==='Post-incident review').length,'','lessons acted on')}</div>
  <div class="grid g2">
    <section class="panel" id="csiMatrix"><div class="panel-head"><h2>Value against effort</h2><span class="muted">Open items</span></div>
      <div style="overflow-x:auto"><table class="matrix vm"><thead><tr><th></th><th colspan="3">Effort</th></tr><tr><th>Value</th>${['Low','Medium','High'].map(e=>`<th>${e}</th>`).join('')}</tr></thead><tbody>
      ${LVL.map(v=>`<tr><th style="text-align:left">${v}</th>${['Low','Medium','High'].map(e=>cell(v,e)).join('')}</tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><div class="panel-head"><h2>Where ideas come from</h2></div>${bars(CSI_SOURCES.map(s=>({label:s,value:L.filter(x=>x.source===s).length})).filter(x=>x.value).sort((a,b)=>b.value-a.value))}</section>
  </div>
  <div class="chips">${['All','Quick win','Major project','Fill-in','Reconsider'].map(q=>`<button class="chip" data-csiq="${q}" aria-pressed="${f.quad===q}">${q} <b>${q==='All'?L.length:L.filter(x=>csiQuad(x)===q).length}</b></button>`).join('')}</div>
  <div class="tablewrap" id="csiReg"><table><thead><tr><th>ID</th><th>Improvement</th><th>Source</th><th>Value / effort</th><th>Measure</th><th>Owner</th><th>Target</th><th>Status</th></tr></thead><tbody>
  ${rows.map(x=>`<tr class="click" data-open="${x.id}" tabindex="0"><td class="mono">${x.id}</td><td><div class="t-title">${esc(x.title)}</div><div class="t-meta">${esc(x.service)} · ${csiQuad(x)}</div></td><td>${esc(x.source)}</td><td>${x.value} / ${x.effort}</td><td style="max-width:240px">${esc(x.measure)}</td><td>${esc(x.owner)}</td><td class="num">${csiOpen(x)?(x.target<Date.now()?`<span class="sla breached">${fmtD(x.target)}</span>`:fmtD(x.target)):'—'}</td><td>${csiPill(x)}</td></tr>`).join('')}</tbody></table></div>`;
}
function csiForm(p){
  p=p||{};const src=p.from?get(p.from):null;
  const opt=(a,s)=>a.map(o=>`<option ${o===s?'selected':''}>${esc(o)}</option>`).join('');
  return `<div class="dhead"><div><span class="eyebrow">New improvement</span><h2>${src?'Log improvement from '+src.id:'Log an improvement'}</h2></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <form id="csiForm" ${p.from?`data-from="${p.from}"`:''}>
  <div class="field"><label for="c-title">Improvement</label><input type="text" id="c-title" required value="${esc(p.title||'')}" placeholder="What will change?"></div>
  <div class="row2"><div class="field"><label for="c-src">Source</label><select id="c-src">${opt(CSI_SOURCES,p.source||'Staff suggestion')}</select></div>
  <div class="field"><label for="c-svc">Service</label><select id="c-svc">${opt(['—'].concat(SVC),p.service||'—')}</select></div></div>
  <div class="row2"><div class="field"><label for="c-val">Value</label><select id="c-val">${opt(LVL,p.value||'Medium')}</select></div>
  <div class="field"><label for="c-eff">Effort</label><select id="c-eff">${opt(LVL,p.effort||'Medium')}</select></div></div>
  <div class="field"><label for="c-measure">How will we know it worked? (baseline → target)</label><input type="text" id="c-measure" value="${esc(p.measure||'')}" placeholder="e.g. P1 time to restore: 3 h → 1 h"></div>
  <div class="calc muted" id="csiQuad" style="font-size:13px"></div>
  <div class="actions"><button class="btn primary" type="submit">Log improvement</button><button class="btn ghost" type="button" data-close="1">Cancel</button></div></form>`;
}
function updateCsiQuad(){const q=$('#csiQuad');if(!q)return;const x={value:$('#c-val').value,effort:$('#c-eff').value};q.innerHTML=`Priority: <b style="color:var(--ink)">${csiQuad(x)}</b>. ${quickWin(x)?'Do these first: high value for little effort.':csiQuad(x)==='Major project'?'Worth it, but plan it properly.':csiQuad(x)==='Fill-in'?'Do when there is spare capacity.':'Check the value is worth the effort.'}`}
function submitCsi(form){
  const v=id=>form.querySelector('#'+id).value.trim();const now=Date.now();
  DB.seq.CSI=(DB.seq.CSI||80)+1;
  const x={kind:'CSI',id:'CSI-'+String(DB.seq.CSI).padStart(4,'0'),title:v('c-title')||'Untitled improvement',source:v('c-src'),service:v('c-svc'),value:v('c-val'),effort:v('c-eff'),status:'Idea',measure:v('c-measure')||'—',achieved:'',owner:'You (demo)',created:now,target:now+60*DAY,links:[],notes:[{t:now,who:'You (demo)',text:'Improvement logged'}]};
  const from=form.dataset.from;if(from){const s=get(from);if(s){x.links.push(from);s.csi=x.id;if(s.notes)s.notes.push({t:now,who:'You (demo)',text:`Improvement ${x.id} logged`})}}
  DB.csi.push(x);IDX.set(x.id,x);feed('CSI',`${x.id} logged: ${x.title}`,x.id);save();render();toast(`${x.id} logged`);openDetail(x.id);
}
function openCSI(x){
  const i=CSI_FLOW.indexOf(x.status),next=CSI_FLOW[i+1];
  const acts=[];
  if(next&&x.status!=='Rejected')acts.push(`<button class="btn primary" data-csiact="next">${next==='Done'?'Mark done: benefit measured':'Move to '+next}</button>`);
  if(i>=0&&i<2)acts.push('<button class="btn danger" data-csiact="reject">Reject</button>');
  const links=x.links.map(get).filter(Boolean);
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono">${x.id} · ${esc(x.source)}</span><h2>${esc(x.title)}</h2><div style="margin-top:6px">${csiPill(x)}</div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <div class="section"><span class="eyebrow">Improvement lifecycle</span>${stepperHtml(CSI_FLOW,x.status==='Rejected'?'Approved':x.status)}</div>
  ${x.status==='In progress'?`<div class="field" id="csiBenefitBox"><label for="csiBenefit">Benefit achieved (measured against the target)</label><input type="text" id="csiBenefit" placeholder="e.g. Down to 3 a month in October"></div>`:''}
  ${acts.length?`<div class="actions">${acts.join('')}</div>`:''}
  <dl class="facts"><div><dt>Service</dt><dd>${esc(x.service)}</dd></div><div><dt>Value / effort</dt><dd>${x.value} / ${x.effort}</dd></div><div><dt>Priority</dt><dd>${csiQuad(x)}</dd></div><div><dt>Owner</dt><dd>${esc(x.owner)}</dd></div><div><dt>Logged</dt><dd>${fmtD(x.created)}</dd></div><div><dt>Target date</dt><dd>${fmtD(x.target)}</dd></div><div><dt>Measure</dt><dd>${esc(x.measure)}</dd></div>${x.achieved?`<div><dt>Achieved</dt><dd>${esc(x.achieved)}</dd></div>`:''}</dl>
  ${links.length?`<div class="section"><span class="eyebrow">Came from</span><div class="links">${links.map(l=>`<button class="linkchip" data-open="${l.id}">${l.id}</button>`).join('')}</div></div>`:''}
  <div class="section"><span class="eyebrow">History</span><ul class="timeline">${x.notes.slice().sort((a,b)=>b.t-a.t).map(n=>`<li><div class="when">${fmtDT(n.t)} · ${esc(n.who)}</div><div>${esc(n.text)}</div></li>`).join('')}</ul></div>`);
  markRec(x.id);
}
function csiFromBtn(t){
  if(t.csi)return `<span class="tag">Improvement logged</span>`;
  return `<button class="btn" data-newcsi="1" data-from="${t.id}">Log improvement from this review</button>`;
}
function dashImprovement(){
  const L=DB.csi;const now=Date.now();
  const st=CSI_FLOW.concat(['Rejected']).map(s=>({label:s,value:L.filter(x=>x.status===s).length,cls:s==='Done'?'ok':s==='Rejected'?'muted':s==='In progress'?'':'info'}));
  const late=L.filter(x=>csiOpen(x)&&x.target<now);
  return `<div class="tiles">${tile('Open improvements',L.filter(csiOpen).length,'')}${tile('Delivered',L.filter(x=>x.status==='Done').length,'','benefit measured','ok')}${tile('Past target date',late.length,'','still open',late.length?'warn':'ok')}${tile('Quick wins open',L.filter(x=>csiOpen(x)&&quickWin(x)).length,'','high value, low effort')}</div>
  <div class="grid g2"><section class="panel" id="rep-csi"><div class="panel-head"><h2>Improvements by status</h2></div>${bars(st)}</section>
  <section class="panel"><div class="panel-head"><h2>Delivered and measured</h2></div><div class="list">${L.filter(x=>x.status==='Done').map(x=>`<div class="li" data-open="${x.id}" tabindex="0"><span class="pill st-done">Done</span><div style="min-width:0"><div class="t-title">${esc(x.title)}</div><div class="t-meta">Target: ${esc(x.measure)}</div></div><span class="t-meta" style="max-width:180px">${esc(x.achieved||'')}</span></div>`).join('')||'<div class="empty">Nothing delivered yet.</div>'}</div></section></div>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-newcsi],[data-csiact],[data-csiq]');if(!b)return;const d=b.dataset;
  if(d.csiq){ui2.csi.quad=d.csiq;render();return}
  if(d.newcsi){const src=d.from?get(d.from):null;
    const p=src?{from:src.id,source:src.type==='INC'&&src.major?'Post-incident review':'Service review',service:src.service,title:src.major?`Prevent a repeat of: ${src.title}`:'',value:'High',effort:'Medium',measure:src.major?'Time to restore similar incidents: '+fmtDur((((src.resolved||Date.now())-src.created))/HR)+' → 1h':''}:{};
    openDrawer(csiForm(p));updateCsiQuad();return}
  const x=get($('#drawer').dataset.id);if(!x||x.kind!=='CSI')return;const now=Date.now();
  if(d.csiact==='next'){const nx=CSI_FLOW[CSI_FLOW.indexOf(x.status)+1];
    if(nx==='Done'){const v=($('#csiBenefit')||{}).value;if(!v||!v.trim()){toast('Record the benefit achieved first');return}x.achieved=v.trim();x.done=now}
    x.status=nx;x.notes.push({t:now,who:'You (demo)',text:nx==='Done'?`Done. Benefit: ${x.achieved}`:`Moved to ${nx}`})}
  if(d.csiact==='reject'){x.status='Rejected';x.notes.push({t:now,who:'You (demo)',text:'Rejected'})}
  feed('CSI',`${x.id} ${x.status==='Rejected'?'rejected':'moved to '+x.status}`,x.id);save();render();openCSI(x);toast(`${x.id} updated`);
});
document.addEventListener('change',e=>{if(['c-val','c-eff'].includes(e.target.id))updateCsiQuad()});
document.addEventListener('submit',e=>{if(e.target.id==='csiForm'){e.preventDefault();submitCsi(e.target)}});
