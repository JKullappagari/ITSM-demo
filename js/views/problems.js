/* Meridian Service Desk: Problems and the known error database (KEDB) */
"use strict";
ui2.prb=ui2.prb||'register';
const keId=p=>'KE'+p.id.slice(3);
function problemCandidates(){
  const from=Date.now()-30*DAY;
  const g=by(DB.items.filter(t=>t.type==='INC'&&t.created>=from&&!t.major),t=>t.service+'|'+t.title);
  return Object.entries(g).map(([k,list])=>{const [service,title]=k.split('|');
      const covered=list.some(t=>t.links.some(l=>{const p=get(l);return p&&p.type==='PRB'&&isOpen(p)}));
      return{service,title,list,covered}})
    .filter(x=>x.list.length>=4&&!x.covered).sort((a,b)=>b.list.length-a.list.length).slice(0,5);
}
function viewProblems(){
  const P=DB.items.filter(t=>t.type==='PRB');const open=P.filter(isOpen);
  const ke=P.filter(t=>t.knownError).sort((a,b)=>b.created-a.created);
  const stale=open.filter(t=>!t.rootCause&&Date.now()-t.created>30*DAY);
  const cands=problemCandidates();
  const tab=ui2.prb;
  const regRows=P.slice().sort((a,b)=>isOpen(b)-isOpen(a)||b.created-a.created);
  return `<div class="pagehead"><div><span class="eyebrow">Problem management</span><h1>Problems &amp; known errors</h1><p>Problems find and remove the causes behind incidents. A known error is a problem with a documented root cause and workaround, kept in the known error database (KEDB) so the desk can fix repeats fast.</p></div>
    <div class="actions"><button class="btn primary" data-new="PRB">+ Log problem</button><button class="btn" data-kedb="1">Search known errors</button><button class="btn" data-tourstart="problem">Guided walkthrough</button></div></div>
  <div class="tiles">${tile('Open problems',open.length,'',`${open.filter(t=>t.priority==='P1'||t.priority==='P2').length} at P1/P2`)}${tile('Known errors in KEDB',ke.filter(isOpen).length,'',`${ke.filter(t=>isOpen(t)&&!t.kb).length} without a knowledge article`,ke.some(t=>isOpen(t)&&!t.kb)?'warn':'ok')}${tile('No root cause after 30 days',stale.length,'','investigations running long',stale.length?'warn':'ok')}${tile('Trends to investigate',cands.length,'','repeat incidents with no problem',cands.length?'warn':'ok')}</div>
  ${cands.length?`<section class="panel" id="prbCands"><div class="panel-head"><h2>Trends with no problem record</h2><span class="muted">Same symptom on the same service, 4 or more times in 30 days</span></div>
    <div class="list">${cands.map((c,i)=>`<div class="li" style="cursor:default"><b class="num" style="min-width:28px;font-size:18px">${c.list.length}×</b><div style="min-width:0"><div class="t-title">${esc(c.title)}</div><div class="t-meta">${esc(c.service)} · last ${fmtD(Math.max(...c.list.map(t=>t.created)))}</div></div><button class="btn" data-prbcand="${i}">Raise problem</button></div>`).join('')}</div></section>`:''}
  <div class="seg" role="group" aria-label="View">${[['register','Problem register'],['kedb','Known error database']].map(([k,l])=>`<button data-ptab="${k}" aria-pressed="${tab===k}">${l}</button>`).join('')}</div>
  ${tab==='kedb'?`<div class="tablewrap" id="kedb"><table><thead><tr><th>Known error</th><th>Symptom</th><th>Workaround</th><th>Root cause</th><th>Knowledge</th><th>Incidents</th><th>Status</th></tr></thead><tbody>
    ${ke.map(p=>`<tr class="click" data-open="${p.id}" tabindex="0"><td class="mono">${keId(p)}</td><td><div class="t-title">${esc(kbClean(p.title))}</div><div class="t-meta">${esc(p.service)}</div></td><td style="max-width:280px">${esc(p.workaround||'—')}</td><td>${esc(p.rootCause||'—')}</td><td>${p.kb?`<span class="mono">${p.kb}</span>`:'<span class="sla risk">No article</span>'}</td><td class="num">${p.links.filter(l=>l.startsWith('INC')).length}</td><td>${isOpen(p)?'<span class="pill st-hold">Fix pending</span>':'<span class="pill st-done">Fixed</span>'}</td></tr>`).join('')||'<tr><td colspan="7"><div class="empty">No known errors yet.</div></td></tr>'}</tbody></table></div>`
  :`<div class="tablewrap" id="prbReg"><table><thead><tr><th>ID</th><th>Problem</th><th>Priority</th><th>Stage</th><th>Root cause</th><th>Incidents</th><th>Age</th></tr></thead><tbody>
    ${regRows.map(p=>`<tr class="click" data-open="${p.id}" tabindex="0"><td class="mono">${p.id}</td><td><div class="t-title">${esc(p.title)}</div><div class="t-meta">${esc(p.service)}${p.knownError?' · <span class="tag ke">Known error</span>':''}</div></td><td>${prioTag(p.priority)}</td><td style="min-width:150px">${stepperHtml(FLOW.PRB,p.status,true)}<div class="t-meta">${esc(p.status)}</div></td><td>${esc(p.rootCause||'Investigating')}</td><td class="num">${p.links.filter(l=>l.startsWith('INC')).length}</td><td class="num">${isOpen(p)?ageText(p.created):'—'}</td></tr>`).join('')}</tbody></table></div>`}`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-ptab],[data-prbcand]');if(!b)return;
  if(b.dataset.ptab){ui2.prb=b.dataset.ptab;render();return}
  const c=problemCandidates()[+b.dataset.prbcand];if(!c)return;
  openDrawer(createForm('PRB',{title:'Recurring: '+c.title.toLowerCase(),service:c.service,priority:c.list.length>=6?'P2':'P3',links:c.list.map(t=>t.id)}));bindCreate();
});
