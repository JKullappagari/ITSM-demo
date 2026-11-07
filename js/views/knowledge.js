/* Meridian Service Desk: Knowledge base view */
"use strict";
/* ---------- Knowledge base ---------- */
function viewKnowledge(){
  const f=ui2.kb;const q=f.q.trim().toLowerCase();
  const cats=['All','Self-help','Resolver runbook','Known error','Process guide'];
  const rows=DB.kb.filter(k=>(f.cat==='All'||k.category===f.cat)&&(!q||k.title.toLowerCase().includes(q)||k.id.toLowerCase().includes(q)||k.service.toLowerCase().includes(q))).sort((a,b)=>b.views-a.views);
  const resolved=DB.items.filter(t=>t.type==='INC'&&t.resolved&&t.resolved>=Date.now()-30*DAY);
  const gap=DB.items.filter(t=>t.type==='PRB'&&t.knownError&&isOpen(t)&&!t.kb).length;
  return `<div class="pagehead"><div><span class="eyebrow">Knowledge management</span><h1>Knowledge base</h1><p>Self-help articles for users, runbooks for resolvers, and known errors published from problem management.</p></div><button class="btn primary" data-newkb="1">+ New article</button></div>
  <div class="tiles">${tile('Published',DB.kb.filter(k=>k.status==='Published').length,'','articles')}${tile('Incidents fixed with an article',pct(resolved.filter(t=>t.kb).length,resolved.length),'%','last 30 days','neutral')}${tile('Average helpful rating',Math.round(avg(DB.kb.map(k=>k.helpful))),'%','from reader votes')}${tile('Known errors without article',gap,'','gap to close',gap?'warn':'ok')}</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><div style="flex:1;min-width:200px;max-width:380px"><input type="search" id="kbSearch" placeholder="Search articles" value="${esc(f.q)}" aria-label="Search articles"></div>
    <div class="chips">${cats.map(c=>`<button class="chip" data-kbcat="${c}" aria-pressed="${f.cat===c}">${c} <b>${c==='All'?DB.kb.length:DB.kb.filter(k=>k.category===c).length}</b></button>`).join('')}</div></div>
  <div class="tablewrap"><table><thead><tr><th>ID</th><th>Article</th><th>Category</th><th>Audience</th><th>Status</th><th>Views</th><th>Helpful</th><th>Used in incidents</th><th>Updated</th></tr></thead><tbody>
  ${rows.map(k=>`<tr class="click" data-open="${k.id}" tabindex="0"><td class="mono">${k.id}</td><td><div class="t-title">${esc(k.title)}</div><div class="t-meta">${esc(k.service)}</div></td><td>${k.category==='Known error'?'<span class="tag ke">Known error</span>':esc(k.category)}</td><td>${esc(k.audience)}</td><td><span class="pill st-${k.status==='Published'?'done':'hold'}">${k.status}</span></td><td class="num">${k.views.toLocaleString()}</td><td class="num">${k.helpful}%</td><td class="num">${k.uses}</td><td class="num">${fmtD(k.updated)}</td></tr>`).join('')||'<tr><td colspan="9"><div class="empty">No articles match.</div></td></tr>'}</tbody></table></div>`;
}
