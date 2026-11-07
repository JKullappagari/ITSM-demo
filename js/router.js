/* Meridian Service Desk: Hash routing and view rendering */
"use strict";
/* ---------- routing ---------- */
const ui={view:'desk',desk:{type:'ALL',scope:'open',q:'',limit:40},dash:{tab:'overview',period:30}};
try{const p=JSON.parse(store.get(KEY+'-ui')||'null');if(p&&p.dash)Object.assign(ui.dash,p.dash)}catch(e){}
function saveUi(){store.set(KEY+'-ui',JSON.stringify({dash:ui.dash}))}
function route(){
  if(!$('#drawer').hidden){$('#drawer').hidden=true;$('#scrim').hidden=true}
  let h=(location.hash||'').replace('#','');
  if(h.startsWith('dashboard-')){ui.dash.tab=h.slice(10);h='dashboard'}
  ui.view=['desk','walkthroughs','catalogue','problems','changes','knowledge','events','cmdb','improvement','processes','dashboard'].includes(h)?h:'desk';
  document.querySelectorAll('#nav a').forEach(a=>{if(a.dataset.view===ui.view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  render();
}
function render(){
  const m=$('#main');
  const v={walkthroughs:viewWalkthroughs,problems:viewProblems,changes:viewChanges,improvement:viewImprovement,processes:viewProcesses,dashboard:viewDashboard,catalogue:viewCatalogue,knowledge:viewKnowledge,events:viewEvents,cmdb:viewCMDB}[ui.view]||viewDesk;
  m.innerHTML=v();
  requestAnimationFrame(()=>AFTER_RENDER.forEach(f=>{try{f()}catch(e){console.error(e)}}));
}
const ui2={kb:{q:'',cat:'All'},ev:{sev:'All',status:'Active'},cmdb:{svc:'Payments Gateway',cls:'All'}};

