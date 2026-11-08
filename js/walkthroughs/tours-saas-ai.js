/* Meridian Service Desk: walkthroughs for the client platform (SaaS) and AI governance */
"use strict";
const rollAt=(rid,cid,s)=>{const r=get(rid);return !!(r&&r.rollout[cid]&&ROLL.indexOf(r.rollout[cid].stage)>=ROLL.indexOf(s))};
const agtAt=(id,s)=>{const a=get(id);return !!a&&a.status===s};
const CR_STD={client:'CLI-01',title:'add a matching rule for the new EUR nostro account',changeType:'Standard',risk:'Low',desc:'Harbourline opened a new EUR nostro account with its correspondent bank. Add a matching rule using the standard nostro template.'};
const CR_CUS={client:'CLI-03',title:'extra approval step for repo trade confirmations over S$5m',changeType:'Normal',risk:'Medium',desc:'Northgate wants a second approver on repo confirmations above S$5m before they are released. Build: new workflow step and approver role. Back-out: switch the step off with its configuration flag.'};
/* Runs a change through its lifecycle until the test says stop: used by "Do it for me". */
function driveChg(id,until){for(let g=0;g<8&&!until();g++){openRec(id);const t=get(id);
  if(t.status==='CAB approval')clickSel('#drawer [data-act="approve"]');else if(t.status==='Implementing')clickSel('#drawer [data-act="out:Successful"]');else if(!clickPrimary(id))break}}

TOURS.push(
{id:'upgrade',short:'Platform upgrade',title:'Quarterly platform upgrade across six clients',role:'Release manager, client service managers',mins:7,
 modules:['Release','Client platform','Client testing','Client change','Version support'],
 story:'Meridian Flow 2026.4 is out and every client has to take it. Upgrade each client’s test environment, catch a regression in one client’s custom script, fix it, collect sign-offs and handle a client who wants to wait.',
 setup(c){
   const rel=platformRel();rel.rollout=rolloutStart(Date.now());rel.status='Deploy';rel.resolved=null;
   DB.clients.forEach(x=>{x.version=x.base;x.configs.forEach(k=>{if(k.breaks)k.fixed=null})});c.rel=rel.id},
 steps:[
  {t:'One upgrade, six clients',info:true,enter:()=>goView('platform'),b:'Meridian Flow is upgraded every quarter. Unlike an internal system, each client has its own test environment, its own sign-off and its own production window, so one release becomes six small rollouts.',target:'#flowRollout'},
  {t:'Open the release',b:'Click any row of the rollout table to open the 2026.4 release.',target:c=>`#flowRollout tr[data-open="${c.rel}"]`,done:c=>inDrawer(c.rel),show:c=>openDetail(c.rel)},
  {t:'Upgrade Calder Mutual’s test environment',rec:'rel',b:'Calder Mutual has been notified. Click <b>Upgrade test environment</b> on Calder Mutual’s row.',
   why:'Clients test on their own copy first, with their own data and configuration.',
   target:'#drawer [data-act="roll:CLI-04:next"]',done:c=>rollAt(c.rel,'CLI-04','Test environment upgraded'),show:c=>{openRec(c.rel);clickSel('#drawer [data-act="roll:CLI-04:next"]')}},
  {t:'Calder starts testing',rec:'rel',b:'Click <b>Start client testing</b> for Calder Mutual. The tool checks each of Calder’s configurations against 2026.4.',
   target:'#drawer [data-act="roll:CLI-04:next"]',done:c=>rollAt(c.rel,'CLI-04','Client testing'),show:c=>{openRec(c.rel);clickSel('#drawer [data-act="roll:CLI-04:next"]')}},
  {t:'A regression in client testing',info:true,rec:'rel',b:'Pinecrest Fund Services has a <b>custom NAV pre-check script</b>. It calls an API that 2026.4 replaces, so it fails. Pinecrest can’t sign off until it is fixed. Standard configuration is covered by Meridian’s own regression pack, but custom workflows are not.',target:'#drawer [data-rollc="CLI-05"] .regress'},
  {t:'Raise the fix',rec:'rel',b:'Click <b>Raise the fix as a client change</b>.',target:'#drawer [data-act="roll:CLI-05:fix"]',
   done:c=>!!$('#createForm[data-type="CHG"]')||!!fresh('CHG',t=>t.fixFor&&t.client==='CLI-05'),show:c=>{openRec(c.rel);clickSel('#drawer [data-act="roll:CLI-05:fix"]')}},
  {t:'Create the fix',b:'It uses the pre-approved compatibility fix template, so it is a <b>Standard</b> change with no charge to the client. Click <b>Create change</b>.',
   target:'#createForm button[type=submit]',done:c=>{const x=fresh('CHG',t=>t.fixFor&&t.client==='CLI-05');if(x)c.fix=x.id;return !!x},
   show:c=>{if(!$('#createForm[data-type="CHG"]'))act(c.rel,'roll:CLI-05:fix');submitIf('#createForm')}},
  {t:'Apply the fix',rec:'fix',b:'It is already scheduled. Click <b>Move to Implementing</b>, then <b>Implemented successfully</b>. Pinecrest’s script is marked as fixed for 2026.4.',wait:'implement the fix',
   target:PRI,done:c=>get(c.fix).outcome==='Successful',show:c=>driveChg(c.fix,()=>get(c.fix).outcome==='Successful')},
  {t:'Pinecrest signs off',rec:'rel',enter:c=>openDetail(c.rel),b:'Pinecrest re-tests and is happy. Click <b>Record client sign-off</b> on Pinecrest’s row.',
   target:'#drawer [data-act="roll:CLI-05:next"]',done:c=>rollAt(c.rel,'CLI-05','Signed off'),show:c=>{openRec(c.rel);clickSel('#drawer [data-act="roll:CLI-05:next"]')}},
  {t:'Upgrade Harbourline in its window',rec:'rel',b:'Harbourline Bank signed off last week. Its production window is Saturday night. Click <b>Upgrade production</b> on Harbourline’s row.',
   why:'Production only moves after sign-off, and only in the window the client agreed in its contract.',
   target:'#drawer [data-act="roll:CLI-01:next"]',done:c=>rollAt(c.rel,'CLI-01','Production upgraded'),show:c=>{openRec(c.rel);clickSel('#drawer [data-act="roll:CLI-01:next"]')}},
  {t:'Solent asks to wait',rec:'rel',b:'Solent Pensions Trust wants to wait until after its year end. But it is on 2026.1, which is already out of support. Click <b>Defer</b> on Solent’s row. The tool records that Solent accepted the risk in writing.',
   target:'#drawer [data-act="roll:CLI-06:defer"]',done:c=>!!get(c.rel).rollout['CLI-06'].deferred,show:c=>{openRec(c.rel);clickSel('#drawer [data-act="roll:CLI-06:defer"]')}},
  {t:'Every client’s position',info:true,enter:()=>goView('platform'),b:'The client list shows who runs which version and who is out of support. The client service managers use it in their account reviews, and the release closes once every client is upgraded or has deferred.',target:'#clientList'}
 ]},

{id:'clientcr',short:'Client change',title:'Client change request: configuration or custom workflow?',role:'Client service manager, platform engineer',mins:6,
 modules:['Client platform','Change','Quote and sign-off','CAB','Configuration register'],
 story:'Two clients ask for changes on the same day. One is a setting the product already supports; the other is new behaviour built just for that client. See why they take very different paths.',
 steps:[
  {t:'Two paths for a client change',info:true,enter:()=>goView('platform'),b:'Triage decides the path. A <b>configuration change</b> uses a setting the platform already supports, so it is pre-approved and included in the subscription. A <b>custom workflow</b> is new behaviour for one client, so it is quoted, built, signed off by the client and approved at CAB.',target:'#crKinds'},
  {t:'Harbourline wants a new matching rule',enter:()=>{openDrawer(createForm('CHG',CR_STD));bindCreate()},b:'Harbourline Bank opened a new EUR nostro account. Adding a matching rule is a standard configuration. Click <b>Create change</b>.',
   target:'#createForm button[type=submit]',done:c=>{const x=fresh('CHG',t=>t.client==='CLI-01'&&t.changeType==='Standard');if(x)c.std=x.id;return !!x},
   show:()=>{if(!$('#createForm[data-type="CHG"]')){openDrawer(createForm('CHG',CR_STD));bindCreate()}submitIf('#createForm')}},
  {t:'Scheduled, no charge',info:true,rec:'std',b:'It went straight to <b>Scheduled</b>. Harbourline’s Premium contract promises configuration changes within two business days, at no extra cost.',target:'#crBox'},
  {t:'Northgate wants something new',enter:()=>{openDrawer(createForm('CHG',CR_CUS));bindCreate()},b:'Northgate Securities wants an extra approval step on large repo trades. The product can’t do that today, so it is a <b>custom workflow</b>: a <b>Normal</b> change. Click <b>Create change</b>.',
   target:'#createForm button[type=submit]',done:c=>{const x=fresh('CHG',t=>t.client==='CLI-03'&&t.changeType==='Normal');if(x)c.cus=x.id;return !!x},
   show:()=>{if(!$('#createForm[data-type="CHG"]')){openDrawer(createForm('CHG',CR_CUS));bindCreate()}submitIf('#createForm')}},
  {t:'Assess it',rec:'cus',b:'Click <b>Move to Assessment</b>.',target:PRI,done:c=>stAt(c.cus,'Assessment'),show:c=>clickPrimary(c.cus)},
  {t:'Quote, build and client sign-off',rec:'cus',b:'Before CAB, the client has to agree to pay and to accept the result. Work down the <b>client steps</b>: send the quote, record that Northgate accepted it, build it in Northgate’s test environment, then record Northgate’s sign-off.',
   why:'The client signs off in its own test environment, so CAB is approving something the client has already accepted.',wait:'complete the four client steps',
   target:'#crBox',done:c=>CR_STEPS.every(([k])=>(get(c.cus).cr||{})[k]),show:c=>{openRec(c.cus);for(let g=0;g<4&&clickSel('#crBox [data-act^="cr:"]');g++){}}},
  {t:'Send it to CAB',rec:'cus',b:'Click <b>Move to CAB approval</b>. The tool would have stopped you if any client step was missing.',target:PRI,done:c=>stAt(c.cus,'CAB approval'),show:c=>clickPrimary(c.cus)},
  {t:'CAB approves',rec:'cus',b:'Click <b>Approve at CAB</b>. It is scheduled for Northgate’s Saturday window.',target:'#drawer [data-act="approve"]',done:c=>stAt(c.cus,'Scheduled'),show:c=>{openRec(c.cus);clickSel('#drawer [data-act="approve"]')}},
  {t:'Implement it',rec:'cus',b:'Click <b>Move to Implementing</b>, then <b>Implemented successfully</b>.',wait:'implement the change',target:PRI,
   done:c=>get(c.cus).outcome==='Successful',show:c=>driveChg(c.cus,()=>get(c.cus).outcome==='Successful')},
  {t:'Remembered for the next upgrade',info:true,enter:()=>openDetail('CLI-03'),b:'The new workflow is now in Northgate’s <b>configuration register</b>, marked to be re-tested every upgrade. This is how the next quarterly upgrade knows what to check.',target:'#clientCfg'}
 ]},

{id:'aiapprove',short:'Approve an AI agent',title:'Approve a new AI agent: from proposal to live',role:'AI governance board, business owner, change manager',mins:7,
 modules:['AI governance','Risk assessment','Controls','Change','CMDB'],
 story:'Payments operations wants an agent that clears small reconciliation breaks on its own. Assess the risk, check the controls, get board approval and put it live through a change.',
 setup(c){const a=get('AGT-006');Object.assign(a,{status:'Proposed',tier:'—',autonomy:'Act within limits',controls:{owner:true},golive:null,riskAns:{},versions:[{v:'v1',at:Date.now(),chg:null,note:'Draft, not deployed',active:true,draft:true}],ver:'v1'});c.agt=a.id},
 steps:[
  {t:'The AI agent register',info:true,enter:()=>goView('ai'),b:'Every AI agent is registered here, with its owner, how much it can do on its own, its risk tier and its version. Agents are configuration items, so the usual practices apply to them.',target:'#aiReg'},
  {t:'Open the proposal',b:'Click <b>Payment break clearing agent</b>. Its status is <b>Proposed</b>.',target:c=>`#aiReg tr[data-open="${c.agt}"]`,done:c=>inDrawer(c.agt),show:c=>openDetail(c.agt)},
  {t:'Answer the risk questions',rec:'agt',b:'This agent would move money, act without a person approving each action, and read client data. Tick those three, then click <b>Record risk assessment</b>.',
   why:'The tier decides how much control the agent needs. Asking the same questions every time keeps the decision consistent.',
   target:'#aiRiskBox',done:c=>!agtAt(c.agt,'Proposed'),show:c=>{openRec(c.agt);['money','auto','personal'].forEach(k=>{const x=$('#airq-'+k);if(x)x.checked=true});clickSel('#drawer [data-agt="assess"]')}},
  {t:'High risk, so a person approves',info:true,rec:'agt',b:'It scored 6, so it is <b>High</b> risk. The board’s rule: a person approves each clearance until the agent has three months of clean results. Its autonomy is now <b>Act with human approval</b>.',target:'#drawer .facts'},
  {t:'Attach the evidence',rec:'agt',b:'The board approves only when all ten controls are in place: owner, data protection assessment, oversight, limits, kill switch, monitoring, change control, disclosure, evaluation and a review date. Tick each one.',
   wait:'tick every control',target:'#aiCtlBox',done:c=>AI_CONTROLS.every(([k])=>get(c.agt).controls[k]),
   show:c=>{openRec(c.agt);AI_CONTROLS.forEach(([k])=>{const x=$(`#drawer [data-agtctl="${k}"]`);if(x&&!x.checked)x.click()})}},
  {t:'The board approves',rec:'agt',b:'Click <b>Approve at AI governance board</b>.',target:'#drawer [data-agt="approve"]',done:c=>agtAt(c.agt,'Approved'),show:c=>{openRec(c.agt);clickSel('#drawer [data-agt="approve"]')}},
  {t:'Raise the go-live change',rec:'agt',b:'Putting an agent into production is a change like any other. Click <b>Raise go-live change</b>, then <b>Create change</b>.',wait:'create the go-live change',
   target:()=>$('#createForm button[type=submit]')||'#drawer [data-agt="golive"]',done:c=>{const a=get(c.agt);if(a.golive)c.chg=a.golive;return !!a.golive},
   show:c=>{if(!$('#createForm')){openRec(c.agt);clickSel('#drawer [data-agt="golive"]')}submitIf('#createForm')}},
  {t:'Take it through CAB',rec:'chg',enter:c=>openDetail(c.chg),b:'Move the change to <b>Assessment</b>, then <b>CAB approval</b>, then click <b>Approve at CAB</b>.',wait:'get the change to Scheduled',
   target:PRI,done:c=>stAt(c.chg,'Scheduled'),show:c=>driveChg(c.chg,()=>stAt(c.chg,'Scheduled'))},
  {t:'Go live',rec:'agt',enter:c=>openDetail(c.agt),b:'With the change approved and scheduled, click <b>Move to Live</b>.',target:'#drawer [data-agt="live"]',done:c=>agtAt(c.agt,'Live'),show:c=>{openRec(c.agt);clickSel('#drawer [data-agt="live"]')}},
  {t:'Live, and under control',info:true,rec:'agt',b:'Version 1 is in use under its change record. From now on its quality, human overrides and guardrail blocks are monitored, and any new prompt or model is another change.',target:'#aiVersions'}
 ]},

{id:'aiincident',short:'AI agent incident',title:'An AI agent misbehaves: kill switch, roll back, fix through change',role:'Incident manager, AI platform team',mins:6,
 modules:['Event monitoring','AI governance','Kill switch','Incident','Change'],
 story:'The guardrails catch the password reset agent trying to reset administrator accounts. Stop it, restore the service, find the cause and make sure the fix goes through change.',
 setup(c){const a=get('AGT-003');const now=Date.now();
   a.versions=a.versions.filter(v=>+v.v.slice(1)<=7);a.versions.forEach(v=>{v.active=v.v==='v7';v.rolledBack=false;if(v.v==='v7')v.chg=null});
   a.ver='v7';a.status='Live';a.metrics.blocks=3;
   const e=seedEvent({ci:a.id,service:a.service,sev:'Critical',message:'Guardrail blocked 3 attempts to reset privileged accounts',source:'AI guardrails',count:3,time:now-4*6e4});
   a.notes.push({t:e.time,who:'AI guardrails',text:'Blocked 3 attempts to reset privileged accounts'});c.agt=a.id;c.evt=e.id},
 steps:[
  {t:'The guardrail fires',enter:()=>{ui2.ev={sev:'Critical',status:'Active'};goView('events')},b:'The guardrails stopped the password reset agent from resetting three administrator accounts. Agents should never touch privileged accounts. Open the highlighted event.',
   target:c=>`tr[data-open="${c.evt}"]`,done:c=>inDrawer(c.evt),show:c=>openDetail(c.evt)},
  {t:'Open the agent',rec:'evt',b:'The configuration item is the agent itself. Click <b>Password reset agent</b>.',target:c=>`#drawer [data-open="${c.agt}"]`,done:c=>inDrawer(c.agt),show:c=>openDetail(c.agt)},
  {t:'Use the kill switch',rec:'agt',b:'Stop it first and investigate second. Click <b>Suspend: use the kill switch</b>. Password resets fall back to the service desk queue, so the service carries on.',
   why:'For an agent that acts on its own, the fastest way to limit harm is to stop it. That is why a tested kill switch is a mandatory control.',
   target:'#drawer [data-agt="suspend"]',done:c=>agtAt(c.agt,'Suspended'),show:c=>{openRec(c.agt);clickSel('#drawer [data-agt="suspend"]')}},
  {t:'Log the incident',rec:'agt',b:'Click <b>Raise incident</b>, then <b>Create incident</b>. The agent is recorded as the configuration item.',wait:'create the incident',
   target:()=>$('#createForm button[type=submit]')||'#drawer [data-agt="inc"]',done:c=>{const x=fresh('INC',t=>t.ci===c.agt);if(x)c.inc=x.id;return !!x},
   show:c=>{if(!$('#createForm')){openRec(c.agt);clickSel('#drawer [data-agt="inc"]')}submitIf('#createForm')}},
  {t:'Find what changed',info:true,enter:c=>openDetail(c.agt),rec:'agt',b:'The version history shows the cause. <b>v7</b> went live two days ago with <b>no change record</b>: the team reworded the prompt to shorten conversations and lost the check on privileged accounts.',target:'#aiVersions'},
  {t:'Roll back to v6',rec:'agt',b:'v6 was tested and approved. Click <b>Roll back to v6</b>.',target:'#drawer [data-agt="rollback"]',done:c=>get(c.agt).ver==='v6',show:c=>{openRec(c.agt);clickSel('#drawer [data-agt="rollback"]')}},
  {t:'Resume on v6',rec:'agt',b:'Click <b>Resume the agent</b>. The tool would refuse to resume an agent running a version with no change record.',target:'#drawer [data-agt="resume"]',done:c=>agtAt(c.agt,'Live'),show:c=>{openRec(c.agt);clickSel('#drawer [data-agt="resume"]')}},
  {t:'Put the fix through change',rec:'agt',b:'The shorter prompt is still worth having, done properly. Click <b>Raise change</b>, then <b>Create change</b>. It goes to CAB with its evaluation results, and deploys as v8 under that change.',wait:'create the change',
   target:()=>$('#createForm button[type=submit]')||'#drawer [data-agt="chg"]',done:c=>{const x=fresh('CHG',t=>t.agent===c.agt);if(x)c.chg=x.id;return !!x},
   show:c=>{if(!$('#createForm')){openRec(c.agt);clickSel('#drawer [data-agt="chg"]')}submitIf('#createForm')}},
  {t:'Close the gap for good',info:true,enter:()=>goView('ai'),b:'The register tracks <b>versions with no change record</b>. The lesson for the post-incident review: prompts are code, so prompt changes go through change enablement like any other change.',target:'#aiReg'}
 ]}
);
TOUR_GROUPS.push(['Client platform (SaaS)','Upgrading and changing a platform you run for external clients',['upgrade','clientcr']],
  ['AI governance','Approving, watching and fixing AI agents',['aiapprove','aiincident']]);
