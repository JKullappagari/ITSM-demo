/* Meridian Service Desk: CMDB and asset views */
"use strict";
/* ---------- CMDB ---------- */
function ciHealth(ci){
  const inc=DB.items.some(t=>t.type==='INC'&&isOpen(t)&&t.ci===ci.id&&(t.priority==='P1'||t.priority==='P2'));
  const ev=DB.events.some(e=>e.ci===ci.id&&['Open','Acknowledged'].includes(e.status));
  const chg=DB.items.some(t=>t.type==='CHG'&&t.ci===ci.id&&['Scheduled','Implementing'].includes(t.status));
  const hot=ci.cap&&Math.max(ci.cap.cpu,ci.cap.mem,ci.cap.disk)>=85;
  return inc?'crit':(ev||chg||hot||ci.status!=='In use')?'warn':'';
}
function ciNode(ci){const sim=ui2.cmdb.simOn,st=simState(ci.id);return `<button class="cinode ${st}" ${sim?`data-simci="${ci.id}"`:`data-open="${ci.id}"`} data-node="${ci.id}"><span class="h"><span class="dot ${ciHealth(ci)}"></span>${esc(ci.name)}</span><span class="s">${esc(ci.cls)} · ${esc(ci.version)}${ci.status!=='In use'?' · '+ci.status:''}</span>${maintTag(ci.id)}${st==='failed'?'<span class="simtag">Failed</span>':st==='impacted'?'<span class="simtag">Impacted</span>':''}</button>`}
function viewCMDB(){
  const f=ui2.cmdb;const s=f.svc;
  const bs=DB.ci.find(c=>c.cls==='Business service'&&c.service===s);
  const lvl2=bs.deps.map(get).filter(Boolean);
  const lvl3=[];lvl2.forEach(c=>c.deps.map(get).forEach(x=>{if(x&&!lvl3.includes(x))lvl3.push(x)}));
  const openInc=DB.items.filter(t=>t.type==='INC'&&isOpen(t)&&t.service===s);
  const chg=DB.items.filter(t=>t.type==='CHG'&&isOpen(t)&&t.service===s).sort((a,b)=>a.planned-b.planned);
  const classes=['All','Business service','Application','Server','Database','Network device'];
  const reg=DB.ci.filter(c=>f.cls==='All'||c.cls===f.cls);
  return `<div class="pagehead"><div><span class="eyebrow">Service configuration and IT asset management</span><h1>CMDB &amp; assets</h1><p>Configuration items and how they depend on each other, so the desk can see impact, and change can assess risk before approving.</p></div></div>
  <div class="chips">${SVC.map(x=>`<button class="chip" data-cmsvc="${esc(x)}" aria-pressed="${x===s}">${esc(x)}</button>`).join('')}</div>
  <section class="panel"><div class="panel-head"><h2>Service map: ${esc(s)}</h2><span class="muted">${SVC_TIER[s]} · availability target ${SVC_TARGET[s]}% · <span class="dot" style="display:inline-block"></span> healthy <span class="dot warn" style="display:inline-block"></span> watch <span class="dot crit" style="display:inline-block"></span> P1/P2 open</span></div>
    ${simBar()}<div class="mapwrap" id="mapWrap"><svg class="maplinks" id="mapLinks" aria-hidden="true"></svg><div class="map"><div class="col"><span class="colh">Business service</span>${ciNode(bs)}</div><div class="col"><span class="colh">Depends on</span>${lvl2.map(ciNode).join('')}</div><div class="col"><span class="colh">Infrastructure</span>${lvl3.map(ciNode).join('')||'<span class="muted">—</span>'}</div></div></div>${simImpact()}
    <div class="grid g2" style="margin-top:6px"><div class="section"><span class="eyebrow">Open incidents on this service (${openInc.length})</span><div class="links">${openInc.map(t=>`<button class="linkchip" data-open="${t.id}">${t.id} ${prioTag(t.priority)}</button>`).join('')||'<span class="muted" style="font-size:13px">None</span>'}</div></div>
    <div class="section"><span class="eyebrow">Open changes on this service (${chg.length})</span><div class="links">${chg.slice(0,8).map(t=>`<button class="linkchip" data-open="${t.id}">${t.id} <span style="font-family:var(--f-body)">${fmtD(t.planned)}</span></button>`).join('')||'<span class="muted" style="font-size:13px">None</span>'}</div></div></div></section>
  <section class="section"><div class="panel-head"><h2>Configuration item register</h2><div class="chips">${classes.map(c=>`<button class="chip" data-cmcls="${c}" aria-pressed="${f.cls===c}">${c}</button>`).join('')}</div></div>
  <div class="tablewrap"><table><thead><tr><th>ID</th><th>Name</th><th>Class</th><th>Service</th><th>Version</th><th>Status</th><th>Location</th><th>Supplier</th><th>Warranty</th><th>Incidents (90 d)</th></tr></thead><tbody>
  ${reg.map(c=>{const w=c.warranty;const wl=w?(w<Date.now()?'<span class="sla breached">Expired</span>':w<Date.now()+90*DAY?`<span class="sla risk">${fmtD(w)}</span>`:`<span class="num">${new Date(w).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</span>`):'<span class="muted">—</span>';
    return `<tr class="click" data-open="${c.id}" tabindex="0"><td class="mono">${c.id}</td><td><span class="mono">${esc(c.name)}</span></td><td>${esc(c.cls)}</td><td>${esc(c.service)}</td><td>${esc(c.version)}</td><td><span class="pill st-${c.status==='In use'?'done':'hold'}">${c.status}</span>${maintTag(c.id)}</td><td>${esc(c.location)}</td><td>${esc(c.supplier)}</td><td>${wl}</td><td class="num">${(n=>n?`<b>${n}</b>`:'<span class="muted">0</span>')(ciInc90(c))}</td></tr>`}).join('')}</tbody></table></div></section>
  <div class="grid g2">
    <section class="panel"><div class="panel-head"><h2>Hardware assets</h2><span class="muted">End-user estate</span></div><div class="tablewrap"><table><thead><tr><th>Model</th><th>Total</th><th>In use</th><th>Stock</th><th>In repair</th><th>Warranty &lt; 90 d</th></tr></thead><tbody>
    ${HW.map(h=>`<tr><td><div class="t-title">${h.model}</div><div class="t-meta">${h.cls}</div></td><td class="num">${h.total}</td><td class="num">${h.inUse}</td><td class="num">${h.stock<5?`<span class="sla risk">${h.stock}</span>`:h.stock}</td><td class="num">${h.repair}</td><td class="num">${h.exp90?`<span class="sla risk">${h.exp90}</span>`:0}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="panel"><div class="panel-head"><h2>Software licences</h2><span class="muted">Entitlement vs deployed</span></div>${licTable()}</section></div>
  ${assetRegister()}`;
}
function licTable(){
  return `<div class="tablewrap"><table><thead><tr><th>Product</th><th>Owned</th><th>Used</th><th>Position</th><th>Annual cost (SGD)</th></tr></thead><tbody>
  ${SW.map(l=>{const st=l.used>l.owned?['breached',`Over by ${l.used-l.owned}`]:l.used/l.owned<.6?['risk',`${l.owned-l.used} unused`]:['met','Compliant'];return `<tr><td>${l.product}</td><td class="num">${l.owned}</td><td class="num">${l.used}</td><td><span class="sla ${st[0]}">${st[1]}</span></td><td class="num">${(l.owned*l.unit).toLocaleString()}</td></tr>`}).join('')}</tbody></table></div>`;
}
function meters(cap){const m=(l,v)=>`<div class="meter"><span>${l}</span><div class="bar-track"><div class="bar-fill ${v>=90?'crit':v>=80?'amber':''}" style="width:${v}%"></div><div class="bar-mark" style="left:80%"></div></div><b>${v}%</b></div>`;return `<div class="meters">${m('CPU',cap.cpu)}${m('Mem',cap.mem)}${m('Disk',cap.disk)}</div>`}
function openCI(c){
  const deps=c.deps.map(get).filter(Boolean);const usedBy=DB.ci.filter(x=>x.deps.includes(c.id));
  const tix=DB.items.filter(t=>t.ci===c.id).sort((a,b)=>b.created-a.created);
  const ev=DB.events.filter(e=>e.ci===c.id).slice(0,6);
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono">${c.id} · ${esc(c.cls)}</span><h2 class="mono" style="font-family:var(--f-mono)">${esc(c.name)}</h2></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <dl class="facts"><div><dt>Service</dt><dd>${esc(c.service)}</dd></div><div><dt>Environment</dt><dd>${c.env}</dd></div><div><dt>Status</dt><dd>${c.status} ${maintTag(c.id)}</dd></div><div><dt>Version</dt><dd>${esc(c.version)}</dd></div><div><dt>Owner</dt><dd>${esc(c.owner)}</dd></div><div><dt>Location</dt><dd>${esc(c.location)}</dd></div><div><dt>Supplier</dt><dd>${esc(c.supplier)}</dd></div>${c.warranty?`<div><dt>Warranty end</dt><dd>${new Date(c.warranty).toLocaleDateString('en-GB')}</dd></div>`:''}</dl>
  <div class="actions">${c.cap?'<button class="btn primary" data-ciact="cap">Raise capacity change</button>':''}<button class="btn" data-simfrom="${c.id}">Simulate this item failing</button></div>
  ${c.cap?`<div class="section"><span class="eyebrow">Capacity (marker at 80% threshold) · growing ${c.cap.growth}% a month</span>${meters(c.cap)}</div>`:''}
  <div class="grid g2"><div class="section"><span class="eyebrow">Depends on</span><div class="links">${deps.map(d=>`<button class="linkchip" data-open="${d.id}">${esc(d.name)}</button>`).join('')||'<span class="muted" style="font-size:13px">Nothing</span>'}</div></div>
  <div class="section"><span class="eyebrow">Used by</span><div class="links">${usedBy.map(d=>`<button class="linkchip" data-open="${d.id}">${esc(d.name)}</button>`).join('')||'<span class="muted" style="font-size:13px">Nothing</span>'}</div></div></div>
  ${ciHistory(c)}
  ${ev.length?`<div class="section"><span class="eyebrow">Recent events</span><div class="list">${ev.map(e=>`<div class="li" data-open="${e.id}" tabindex="0"><span class="sev sev-${e.sev}">${e.sev}</span><div class="t-title">${esc(e.message)}</div><span class="t-meta">${fmtDT(e.time)}</span></div>`).join('')}</div></div>`:''}`);
  markRec(c.id);
}


/* ---------- dependency map: links and failure simulation ---------- */
function parentsOf(id){return DB.ci.filter(x=>x.deps.includes(id))}
function upstream(id){const seen=new Set(),q=[id];while(q.length){const c=q.shift();parentsOf(c.id||c).forEach(p=>{if(!seen.has(p.id)){seen.add(p.id);q.push(p.id)}})}return seen}
function simState(id){const f=ui2.cmdb.simOn&&ui2.cmdb.fail;if(!f)return '';if(id===f)return 'failed';return upstream(f).has(id)?'impacted':''}
function simBar(){const on=!!ui2.cmdb.simOn;return `<div class="simbar"><div class="seg" role="group" aria-label="Map mode"><button data-simmode="0" aria-pressed="${!on}">Open records</button><button data-simmode="1" aria-pressed="${on}">Simulate a failure</button></div>
  <span class="muted" style="font-size:12.5px">${on?(ui2.cmdb.fail?'Click the failed item again to restore it, or another item to move the failure.':'Click any item on the map to see what breaks if it fails.'):'Click an item to open its record.'}</span></div>`}
function simImpact(){
  if(!ui2.cmdb.simOn||!ui2.cmdb.fail)return '';
  const f=get(ui2.cmdb.fail);const up=upstream(f.id);
  const bss=DB.ci.filter(c=>c.cls==='Business service'&&(up.has(c.id)||c.id===f.id));
  const rate=bss.reduce((a,b)=>a+(SVC_COST[b.service]||0),0);
  return `<div class="impact" id="simImpact"><div class="panel-head"><h3>If ${esc(f.name)} fails</h3><span class="tag mi">${bss.length} business service${bss.length===1?'':'s'} down</span></div>
  ${bss.length>1?`<p style="font-size:13px"><b>Single point of failure:</b> ${esc(f.name)} is shared by ${bss.length} services. A failure here hits all of them at once.</p>`:''}
  <div class="tablewrap"><table class="fit"><thead><tr><th>Business service</th><th>Tier</th><th>Availability target</th><th>Cost per hour</th></tr></thead><tbody>
  ${bss.map(b=>`<tr><td><b>${esc(b.service)}</b></td><td>${SVC_TIER[b.service]}</td><td class="num">${SVC_TARGET[b.service]}%</td><td class="num">${fmtMoney(SVC_COST[b.service])}</td></tr>`).join('')}</tbody></table></div>
  <div class="calc"><span>Estimated cost while it is down: <b class="mono">${fmtMoney(rate)}</b> an hour</span><span class="muted">${up.size} items depend on it, directly or indirectly</span><button class="btn" data-simclear="1">Clear simulation</button></div></div>`;
}
function drawMapLinks(){
  const wrap=$('#mapWrap'),svg=$('#mapLinks');if(!wrap||!svg)return;
  const cols=getComputedStyle(wrap.querySelector('.map')).gridTemplateColumns.split(' ').length;
  if(cols<2){svg.innerHTML='';return}
  const W=wrap.clientWidth,H=wrap.clientHeight,R0=wrap.getBoundingClientRect();
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('width',W);svg.setAttribute('height',H);
  const nodes={};wrap.querySelectorAll('[data-node]').forEach(el=>{nodes[el.dataset.node]=el.getBoundingClientRect()});
  let out='';
  Object.keys(nodes).forEach(id=>{const c=get(id);if(!c)return;c.deps.forEach(d=>{if(!nodes[d])return;
    const a=nodes[id],b=nodes[d];const x1=a.right-R0.left,y1=a.top+a.height/2-R0.top,x2=b.left-R0.left,y2=b.top+b.height/2-R0.top;const mx=(x1+x2)/2;
    const hot=simState(id)&&simState(d);
    out+=`<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" class="${hot?'hot':''}"/>`})});
  svg.innerHTML=out;
}
AFTER_RENDER.push(()=>{if(ui.view==='cmdb')drawMapLinks()});
window.addEventListener('resize',()=>{if(ui.view==='cmdb')drawMapLinks()});

/* ---------- laptop assets (individual hardware lifecycle) ---------- */
const AST_FLOW=['In stock','Allocated','In use','In repair','Retired'];
function genAssets(now,T){
  const R=rng(4412);const L=[];const users=CALLERS.concat(['Aiko Tanaka','Ravi Shah','Nur Izzati','Marcus Lee','Elena Cruz','Jun Hao Tan']);
  for(let i=0;i<30;i++){
    const mac=i%6===5;const tag='LT-'+String(401+i*3).padStart(4,'0');
    const st=i<17?'In use':i<26?'In stock':i<28?'In repair':'Retired';
    const bought=now-(60+Math.floor(R()*900))*DAY;
    const a={kind:'AST',id:'AST-'+tag,tag,model:mac?'Apple MacBook Pro 14':'Dell Latitude 7450',cls:'Laptop',status:st,user:st==='In use'||st==='In repair'?users[i%users.length]:'',location:st==='In use'?'With user':st==='In repair'?'Brightdesk repair centre':'Singapore office store',
      purchased:bought,warranty:bought+3*365*DAY,req:null,history:[{t:bought,text:'Received into stock'}]};
    if(st==='In use'||st==='In repair')a.history.push({t:bought+5*DAY,text:`Allocated and deployed to ${a.user}`});
    if(st==='In repair')a.history.push({t:now-4*DAY,text:'Sent for repair: keyboard fault'});
    if(st==='Retired')a.history.push({t:now-20*DAY,text:'Retired and securely wiped'});
    L.push(a);
  }
  return L;
}
function astPill(a){return `<span class="pill st-${a.status==='In use'?'done':a.status==='In stock'?'new':a.status==='Allocated'?'prog':a.status==='In repair'?'hold':'closed'}">${a.status}</span>`}
function assetRegister(){
  const f=ui2.ast=ui2.ast||'All';const A=DB.assets;
  const rows=A.filter(a=>f==='All'||a.status===f);
  return `<section class="section" id="astReg"><div class="panel-head"><h2>Laptop asset register</h2><span class="muted">Singapore office pool · each laptop tracked from stock to retirement</span></div>
  <div class="chips">${['All'].concat(AST_FLOW).map(x=>`<button class="chip" data-astf="${x}" aria-pressed="${f===x}">${x} <b>${x==='All'?A.length:A.filter(a=>a.status===x).length}</b></button>`).join('')}</div>
  <div class="tablewrap"><table><thead><tr><th>Asset tag</th><th>Model</th><th>Status</th><th>User</th><th>Location</th><th>Request</th><th>Warranty</th></tr></thead><tbody>
  ${rows.map(a=>`<tr class="click" data-open="${a.id}" tabindex="0"><td class="mono">${a.tag}</td><td>${esc(a.model)}</td><td>${astPill(a)}</td><td>${esc(a.user||'—')}</td><td>${esc(a.location)}</td><td class="mono">${a.req||'—'}</td><td class="num">${a.warranty<Date.now()+90*DAY?`<span class="sla risk">${fmtD(a.warranty)}</span>`:new Date(a.warranty).toLocaleDateString('en-GB',{month:'short',year:'numeric'})}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function openAsset(a){
  const acts=[];
  if(a.status==='In use')acts.push(['repair','Send for repair'],['return','Return to stock']);
  if(a.status==='In repair')acts.push(['return','Back from repair: to stock']);
  if(a.status==='In stock')acts.push(['retire','Retire and wipe']);
  openDrawer(`<div class="dhead"><div><span class="eyebrow mono">${a.id} · ${esc(a.cls)}</span><h2>${esc(a.tag)} · ${esc(a.model)}</h2><div style="margin-top:6px">${astPill(a)}</div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
  <div class="section"><span class="eyebrow">Asset lifecycle</span>${stepperHtml(AST_FLOW,a.status)}</div>
  ${acts.length?`<div class="actions">${acts.map(([k,l])=>`<button class="btn" data-astact="${k}">${l}</button>`).join('')}</div>`:''}
  <dl class="facts"><div><dt>User</dt><dd>${esc(a.user||'—')}</dd></div><div><dt>Location</dt><dd>${esc(a.location)}</dd></div><div><dt>Purchased</dt><dd>${fmtD(a.purchased)} ${new Date(a.purchased).getFullYear()}</dd></div><div><dt>Warranty end</dt><dd>${new Date(a.warranty).toLocaleDateString('en-GB')}</dd></div><div><dt>Supplier</dt><dd>Brightdesk Hardware</dd></div><div><dt>Request</dt><dd>${a.req?`<button class="linkchip" data-open="${a.req}">${a.req}</button>`:'—'}</dd></div></dl>
  <div class="section"><span class="eyebrow">History</span><ul class="timeline">${a.history.slice().sort((x,y)=>y.t-x.t).map(n=>`<li><div class="when">${fmtDT(n.t)}</div><div>${esc(n.text)}</div></li>`).join('')}</ul></div>`);
  markRec(a.id);
}
function allocateAsset(t){
  if(t.asset)return;const now=Date.now();
  const a=DB.assets.find(x=>x.status==='In stock'&&x.model.startsWith('Dell'))||DB.assets.find(x=>x.status==='In stock');
  if(!a){t.notes.push({t:now,who:'Asset management',text:'No laptops in stock: purchase order raised with Brightdesk Hardware'});return}
  a.status='Allocated';a.user=t.requestedFor;a.req=t.id;a.location='Imaging bench, level 12';a.history.push({t:now,text:`Allocated to ${t.requestedFor} for ${t.id}`});
  t.asset=a.id;t.notes.push({t:now,who:'Asset management',text:`Laptop ${a.tag} (${a.model}) moved from In stock to Allocated`});
}
function deployAsset(t){
  const a=t.asset&&get(t.asset);if(!a||a.status==='In use')return;const now=Date.now();
  a.status='In use';a.location='With user';a.history.push({t:now,text:`Handed over to ${a.user} and signed for`});
  t.notes.push({t:now,who:'Asset management',text:`Laptop ${a.tag} handed over: status In use`});
}
function assetOnTask(t,x){if(/allocate/i.test(x.name)&&/laptop/i.test(x.name))allocateAsset(t);if(/handover/i.test(x.name))deployAsset(t)}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-simmode],[data-simci],[data-simclear],[data-simfrom],[data-astf],[data-astact]');if(!b)return;const d=b.dataset;
  if(d.simmode!=null){ui2.cmdb.simOn=d.simmode==='1';ui2.cmdb.fail=null;render();return}
  if(d.simci){ui2.cmdb.fail=ui2.cmdb.fail===d.simci?null:d.simci;render();return}
  if(d.simclear){ui2.cmdb.fail=null;render();return}
  if(d.simfrom){const c=get(d.simfrom);ui2.cmdb.svc=c.cls==='Network device'&&!DB.ci.some(x=>x.cls==='Business service'&&x.service===c.service)?'Network & VPN':c.service;ui2.cmdb.simOn=true;ui2.cmdb.fail=c.id;goView('cmdb');return}
  if(d.astf){ui2.ast=d.astf;render();return}
  if(d.astact){const a=get($('#drawer').dataset.id);if(!a)return;const now=Date.now();
    if(d.astact==='repair'){a.status='In repair';a.location='Brightdesk repair centre';a.history.push({t:now,text:'Sent for repair'})}
    if(d.astact==='return'){a.status='In stock';a.user='';a.req=null;a.location='Singapore office store';a.history.push({t:now,text:'Wiped, re-imaged and returned to stock'})}
    if(d.astact==='retire'){a.status='Retired';a.location='Disposed';a.history.push({t:now,text:'Retired and securely wiped'})}
    feed('CMDB',`Asset ${a.tag} status changed to '${a.status}'`,a.id);save();render();openAsset(a);toast(`${a.tag} updated`);}
});
