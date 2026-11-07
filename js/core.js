/* Meridian Service Desk: Shared helpers, storage, state and formatting */
"use strict";
const DAY=864e5, HR=36e5;
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const KEY='meridian-sd-demo-v4';
/* Functions run after every view render, e.g. to draw map connectors once the DOM exists. */
const AFTER_RENDER=[];

/* ---------- state ---------- */
let DB=null,IDX=new Map();
function reindex(){IDX=new Map(DB.items.concat(DB.ci,DB.kb,DB.events,DB.assets,DB.csi).map(t=>[t.id,t]))}
function load(){
  const raw=store.get(KEY);
  if(raw){try{const d=JSON.parse(raw);if(d&&Array.isArray(d.items)&&Array.isArray(d.ci)&&Array.isArray(d.kb)&&Array.isArray(d.events)&&Array.isArray(d.assets)&&Array.isArray(d.csi)){DB=d;reindex();return}}catch(e){}}
  DB=generate(Date.now());reindex();
}
function save(){store.set(KEY,JSON.stringify(DB))}
function newId(type){DB.seq[type]=(DB.seq[type]||1000)+1;return type+String(DB.seq[type]).padStart(7,'0')}
const get=id=>IDX.get(id);
const isOpen=t=>!CLOSED[t.type].includes(t.status);
const prioOf=(i,u)=>{const s=+i + +u;return s<=2?'P1':s===3?'P2':s===4?'P3':'P4'};

/* ---------- formatting ---------- */
const fmtDT=ms=>new Date(ms).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false});
const fmtD=ms=>new Date(ms).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const fmtDur=h=>h<1?Math.max(1,Math.round(h*60))+'m':h<48?(h<10?h.toFixed(1):Math.round(h))+'h':(h/24).toFixed(1)+'d';
const pct=(a,b)=>b?Math.round(a/b*100):0;
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
function ageText(ms){return fmtDur((Date.now()-ms)/HR)}

function slaOf(t){
  let target=null;
  if(t.type==='INC')target=SLA[t.priority];
  else if(t.type==='REQ'){const c=CATALOG.find(x=>x.name===t.item);target=c?c.target:null}
  if(!target)return null;
  const end=t.resolved||Date.now();const el=(end-t.created)/HR;const p=el/target;
  if(t.resolved)return{target,el,p,state:p<=1?'met':'breached',label:p<=1?'Met':'Breached'};
  if(p>1)return{target,el,p,state:'breached',label:'Breached +'+fmtDur(el-target)};
  if(p>.75)return{target,el,p,state:'risk',label:fmtDur(target-el)+' left'};
  return{target,el,p,state:'ok',label:fmtDur(target-el)+' left'};
}
function stClass(t){
  const s=t.status;
  if(s==='Rejected')return 'bad';
  if(s==='On Hold')return 'hold';
  if(!isOpen(t))return s==='Closed'?'closed':'done';
  if(['New','Submitted','Draft','Logged','Planning'].includes(s))return 'new';
  return 'prog';
}
const pill=t=>`<span class="pill st-${stClass(t)}">${esc(t.status)}</span>`;
const prioTag=p=>`<span class="prio ${p}">${p}</span>`;
function slaCell(t){
  if(t.type==='CHG')return `<span class="sla ok">${t.outcome?esc(t.outcome):'Planned '+fmtD(t.planned)}</span>`;
  if(t.type==='REL')return `<span class="sla ok">Deploy ${fmtD(t.planned)}</span>`;
  if(t.type==='PRB')return t.knownError?'<span class="tag ke">Known error</span>':'<span class="sla ok">—</span>';
  const s=slaOf(t);return s?`<span class="sla ${s.state}">${esc(s.label)}</span>`:'';
}
function typeLabel(t){return t.type==='INC'&&t.major?'Major incident':TYPES[t.type].name}

/* ---------- toast ---------- */
let toastTimer;
function toast(msg){const el=$('#toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,2800)}

