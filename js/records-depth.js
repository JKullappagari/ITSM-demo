/* Meridian Service Desk: Known error lookup, change risk assessment, CAB votes, CI incident history */
"use strict";

/* ---------- known error lookup (KEDB) ---------- */
const KE_STOP=new Set(['the','and','for','with','not','are','from','after','every','on','in','to','of','a','an','is','users','user',
  'above','below','over','under','error','errors','issue','issues','problem','during','when','recurring','cause','major','incident']);
/* Crude stemming: 'disconnecting' and 'disconnects' both become 'discon'. */
const keStem=w=>w.slice(0,6);
const keWords=s=>String(s||'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w.length>2&&!KE_STOP.has(w));
/* Open known errors ranked by word overlap with the query. A word in the known error's symptom scores 2,
   a word only in its workaround or root cause scores 1, and the same service adds 1.
   With a service (an incident), a match needs 3: a symptom word on the same service, or two symptom words.
   Without one (free search), the service name counts as text and 2 is enough. A search the user types
   (typed) also needs only 2, so one symptom word is enough. */
function keMatches(q,service,limit,typed){
  const qs=[...new Set(keWords(q).map(keStem))];
  return DB.items.filter(p=>p.type==='PRB'&&p.knownError&&isOpen(p)).map(p=>{
    const sym=new Set(keWords(p.title+(service?'':' '+p.service)).map(keStem));
    const rest=new Set(keWords(p.workaround+' '+(p.rootCause||'')).map(keStem));
    let s=qs.reduce((n,w)=>n+(sym.has(w)?2:rest.has(w)?1:0),0);
    if(service&&p.service===service)s+=qs.length?1:2;
    return{p,s};
  }).filter(x=>qs.length?x.s>=(service&&!typed?3:2):x.s>0).sort((a,b)=>b.s-a.s||b.p.created-a.p.created).slice(0,limit||5).map(x=>x.p);
}
const keTitle=p=>{const t=kbClean(p.title);return t.charAt(0).toUpperCase()+t.slice(1)};
function keRow(p,btn){
  return `<div class="li" style="cursor:default"><span class="tag ke">${keId(p)}</span><div style="min-width:0"><div class="t-title">${esc(keTitle(p))}</div><div class="t-meta">${esc(p.service)} · <b>Workaround:</b> ${esc(p.workaround)}</div></div><span class="actions"><button class="btn ghost" data-open="${p.id}">Open</button>${btn}</span></div>`;
}
function keResults(q,service,applyBtn,typed){
  const m=keMatches(q,service,6,typed);
  return m.length?`<div class="list">${m.map(p=>keRow(p,applyBtn(p))).join('')}</div>`:`<div class="empty" style="padding:12px">No open known errors match${q?` “${esc(q)}”`:''}. If this keeps happening, raise a problem.</div>`;
}
/* Section on an open incident: search the KEDB and apply a workaround. */
function keSection(t){
  if(t.type!=='INC')return '';
  if(t.ke){const p=get(t.ke);return p?`<div class="calc" id="keBox"><span class="tag ke">${keId(p)}</span><span><b>Known error workaround applied:</b> ${esc(p.workaround)}</span><button class="linkchip" data-open="${p.id}">${p.id}</button></div>`:''}
  if(!isOpen(t))return '';
  return `<div class="section" id="keBox"><span class="eyebrow">Check the known error database</span>
    <input type="search" id="keQ" data-svc="${esc(t.service)}" placeholder="Search known errors by symptom, e.g. ${esc(keWords(t.title).slice(0,2).join(' ')||'timeout')}" aria-label="Search known errors">
    <div id="keRes">${keResults(t.title,t.service,p=>`<button class="btn" data-act="ke:${p.id}">Apply workaround</button>`)}</div></div>`;
}
/* Hint panel on the new incident form: known errors that match as you type. */
function keHint(){
  const h=$('#keHint');if(!h)return;const f=$('#createForm');
  const q=($('#f-title')||{}).value||'',svc=($('#f-service')||{}).value||'';
  const m=keMatches(q,svc,3);const chosen=f&&f.dataset.ke;
  h.innerHTML=m.length?`<span class="eyebrow">Matching known errors</span><div class="list">${m.map(p=>keRow(p,`<button type="button" class="btn ${chosen===p.id?'primary':''}" data-keuse="${p.id}" aria-pressed="${chosen===p.id}">${chosen===p.id?'✓ Will apply':'Use workaround'}</button>`)).join('')}</div>`:'';
  h.hidden=!m.length;
}
/* Standalone KEDB search, opened from the Service Desk header. */
function openKedbSearch(){
  openDrawer(`<div class="dhead"><div><span class="eyebrow">Known error database</span><h2>Search known errors</h2></div><button class="x" data-close="1" aria-label="Close">×</button></div>
    <p class="muted" style="margin:0">Before working an incident from scratch, check whether problem management already has a workaround for it.</p>
    <input type="search" id="keQ" data-svc="" placeholder="Symptom, service or error, e.g. VPN disconnects" aria-label="Search known errors">
    <div id="keRes"></div>`);
  $('#keRes').innerHTML=keAll();
}
function keAll(){const all=DB.items.filter(p=>p.type==='PRB'&&p.knownError&&isOpen(p)).sort((a,b)=>b.created-a.created);
  return all.length?`<div class="list">${all.map(p=>keRow(p,'')).join('')}</div>`:'<div class="empty">No open known errors.</div>'}
function applyKe(t,p,now,who){
  t.ke=p.id;if(!t.links.includes(p.id))t.links.push(p.id);if(!p.links.includes(t.id))p.links.push(t.id);
  t.notes.push({t:now,who,text:`Applied workaround from known error ${keId(p)} (${p.id}): ${p.workaround}`});
  p.notes.push({t:now,who,text:`Workaround used on ${t.id}`});
}

/* ---------- change risk assessment (normal changes, at Assessment) ---------- */
const RISK_Q=[
  ['tier1','It changes a Tier 1 service',2],
  ['backout','The back-out plan is untested or takes over 30 minutes',2],
  ['notest','There is no test evidence from a non-production environment',2],
  ['downtime','It needs downtime or runs in business hours',1],
  ['clash','Another change is planned on the same service within a day',1]];
function riskDefaults(t){
  return{tier1:SVC_TIER[t.service]==='Tier 1',
    clash:DB.items.some(o=>o.type==='CHG'&&o.id!==t.id&&isOpen(o)&&o.service===t.service&&Math.abs(o.planned-t.planned)<DAY),
    backout:!/back-?out/i.test(t.desc||''),notest:!/test/i.test(t.desc||''),downtime:false};
}
const riskLevel=s=>s>=5?'High':s>=2?'Medium':'Low';
const RANK={Low:0,Medium:1,High:2};
function riskBox(t){
  if(t.type!=='CHG'||t.changeType!=='Normal'||t.status!=='Assessment')return '';
  const a=t.riskQ||riskDefaults(t);
  return `<div class="section" id="riskBox"><span class="eyebrow">Risk assessment</span>
    <div class="checklist" style="max-height:none">${RISK_Q.map(([k,l,w],i)=>`<label class="check"><input type="checkbox" id="rq-${k}" data-rq="${k}" ${a[k]?'checked':''}> <span>${l} <span class="muted">(+${w})</span></span></label>`).join('')}</div>
    <div class="calc" id="rqScore">${riskScoreHtml(t,a)}</div></div>`;
}
function riskAnswers(){const a={};RISK_Q.forEach(([k])=>{const e=$('#rq-'+k);a[k]=!!(e&&e.checked)});return a}
function riskScore(a){return RISK_Q.reduce((s,[k,,w])=>s+(a[k]?w:0),0)}
function riskScoreHtml(t,a){const s=riskScore(a),lv=riskLevel(s),fin=RANK[lv]>RANK[t.risk]?lv:t.risk;
  return `<span class="eyebrow">Assessed risk</span><span class="big">${lv}</span><span class="muted">Score ${s} of 8 · raised as ${t.risk}${fin!==t.risk?` · will go to CAB as <b>${fin}</b>`:''}</span>`}
/* Called when a normal change leaves Assessment. The assessment can raise the stated risk, never lower it. */
function applyRisk(t,log){
  if(t.changeType!=='Normal')return;
  const a=$('#riskBox')?riskAnswers():(t.riskQ||riskDefaults(t));t.riskQ=a;
  const s=riskScore(a),lv=riskLevel(s);const why=RISK_Q.filter(([k])=>a[k]).map(([,l])=>l.toLowerCase());
  log(`Risk assessed: ${lv} (score ${s} of 8)${why.length?': '+why.join('; '):''}`);
  if(RANK[lv]>RANK[t.risk]){log(`Risk raised from ${t.risk} to ${lv}`);t.risk=lv}
}

/* ---------- CAB votes (normal changes, at CAB approval) ---------- */
const CAB_MEMBERS=['Change Manager (chair)','Service Owner','Security Operations','Infrastructure lead','Business representative'];
function cabTally(t){const v=Object.values((t.cab||{}));return{yes:v.filter(x=>x==='Approve').length,no:v.filter(x=>x==='Reject').length,n:v.length}}
function cabBox(t){
  if(t.type!=='CHG'||t.changeType!=='Normal'||t.status!=='CAB approval')return '';
  const votes=t.cab||{};const c=cabTally(t);
  return `<div class="section" id="cabBox"><div class="panel-head"><span class="eyebrow">CAB votes · ${t.risk} risk</span><span class="muted" style="font-size:12px">${c.n} of ${CAB_MEMBERS.length} voted · ${c.yes} approve · ${c.no} reject</span></div>
    <div class="list">${CAB_MEMBERS.map((m,i)=>`<div class="li" style="cursor:default"><span class="vote ${votes[m]?'v-'+votes[m].toLowerCase():''}">${votes[m]||'Pending'}</span><div class="t-title">${m}</div><span class="seg" role="group" aria-label="${esc(m)} vote">${['Approve','Reject','Abstain'].map(v=>`<button type="button" data-act="vote:${i}:${v}" aria-pressed="${votes[m]===v}">${v}</button>`).join('')}</span></div>`).join('')}</div>
    <p class="muted" style="font-size:12.5px;margin:0">CAB advises and the change authority decides: record the votes, then approve or reject below.${c.no?' <b>There are objections:</b> note how they were resolved before approving.':''}</p></div>`;
}
function castVote(t,k,log){const [,i,v]=k.split(':');const m=CAB_MEMBERS[+i];if(!m)return;t.cab=t.cab||{};t.cab[m]=v;log(`CAB vote: ${m} – ${v}`)}

/* ---------- CI incident history ---------- */
function ciHistory(c){
  const now=Date.now();
  const tix=DB.items.filter(t=>t.ci===c.id||(t.events||[]).some(e=>{const ev=get(e);return ev&&ev.ci===c.id})).sort((a,b)=>b.created-a.created);
  const inc=tix.filter(t=>t.type==='INC'),i90=inc.filter(t=>t.created>=now-90*DAY);
  const down=inc.filter(t=>t.resolved&&t.created>=now-90*DAY&&(t.priority==='P1'||t.priority==='P2')).reduce((s,t)=>s+(t.resolved-t.created)/HR,0);
  const chg=tix.filter(t=>t.type==='CHG'&&t.created>=now-90*DAY);
  const failed=chg.filter(t=>t.outcome&&t.outcome!=='Successful').length;
  return `<div class="section" id="ciHist"><span class="eyebrow">Incident and change history</span>
    <div class="ministats"><div><b class="num">${i90.length}</b><span>incidents, 90 days</span></div><div><b class="num">${inc.filter(isOpen).length}</b><span>open now</span></div><div><b class="num">${i90.filter(t=>t.major).length}</b><span>major incidents</span></div><div><b class="num">${fmtDur(down)}</b><span>P1/P2 outage time</span></div><div><b class="num">${chg.length}</b><span>changes${failed?`, ${failed} failed`:''}</span></div></div>
    ${tix.length?`<div class="list">${tix.slice(0,15).map(t=>`<div class="li" data-open="${t.id}" tabindex="0"><span class="mono" style="font-size:12px">${t.id}</span><div style="min-width:0"><div class="t-title">${esc(t.title)}</div><div class="t-meta">${typeLabel(t)} · ${fmtDT(t.created)}${t.priority?' · '+t.priority:''}${t.resolved&&t.type==='INC'?' · fixed in '+fmtDur((t.resolved-t.created)/HR):''}</div></div>${pill(t)}</div>`).join('')}</div>${tix.length>15?`<span class="muted" style="font-size:12.5px">Showing the latest 15 of ${tix.length}.</span>`:''}`:'<span class="muted" style="font-size:13px">No incidents or changes recorded against this item.</span>'}</div>`;
}
const ciInc90=c=>{const from=Date.now()-90*DAY;return DB.items.filter(t=>t.type==='INC'&&t.ci===c.id&&t.created>=from).length};

/* ---------- long titles: show the full text on hover when clamped ---------- */
function clampTitles(root){(root||document).querySelectorAll('.t-title').forEach(e=>{if(e.scrollWidth>e.clientWidth+1)e.title=e.textContent;else e.removeAttribute('title')})}
AFTER_RENDER.push(()=>clampTitles($('#main')));

/* ---------- wiring ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-keuse],[data-kedb]');if(!b)return;
  if(b.dataset.kedb){openKedbSearch();return}
  const f=$('#createForm');if(!f)return;
  if(f.dataset.ke===b.dataset.keuse)delete f.dataset.ke;else f.dataset.ke=b.dataset.keuse;keHint();
});
document.addEventListener('input',e=>{
  const id=e.target.id;
  if(id==='keQ'){const q=e.target.value,svc=e.target.dataset.svc;const t=get($('#drawer').dataset.id);const onInc=t&&t.type==='INC'&&$('#drawer').dataset.view==='rec';
    $('#keRes').innerHTML=!q.trim()&&!onInc?keAll():keResults(q,svc,p=>onInc?`<button class="btn" data-act="ke:${p.id}">Apply workaround</button>`:'',true);clampTitles($('#keRes'))}
  if(id==='f-title')keHint();
});
document.addEventListener('change',e=>{
  if(e.target.id==='f-service')keHint();
  if(e.target.dataset&&e.target.dataset.rq){const t=get($('#drawer').dataset.id);if(t)$('#rqScore').innerHTML=riskScoreHtml(t,riskAnswers())}
});
