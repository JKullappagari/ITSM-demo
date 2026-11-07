/* Meridian Service Desk: additional walkthroughs (swarming, standard vs normal change, laptop lifecycle, continual improvement) */
"use strict";
const csiAt=(id,s)=>{const x=get(id);return !!x&&CSI_FLOW.indexOf(x.status)>=CSI_FLOW.indexOf(s)};
const STD2_PRESET={title:'Apply the monthly OS patch to HR portal servers',service:'HR Self-Service',changeType:'Standard',risk:'Low',desc:'Standard change template SC-003: monthly OS patch with a rolling restart, one server at a time.'};
const NRM_PRESET={title:'Migrate the payments database to the new cluster',service:'Payments Gateway',changeType:'Normal',risk:'High',desc:'Implement: replicate pgw-db-01 to the new cluster and cut over in the Saturday window. Back-out: point the application back to pgw-db-01 (15 minutes). Test: end-to-end payment to the bank sandbox.'};
const CSI_PRESET={title:'Re-run the overnight ETL automatically when the upstream file is late',source:'Problem trend',service:'Data Warehouse',value:'High',effort:'Low',measure:'P2 Data Warehouse incidents: 9 a month → 3 a month'};
const SWARM=['Application Support','Network Operations','Supplier: Ledgerline'];

TOURS.push(
{id:'swarm',short:'Payments down',title:'Payment gateway down: swarm the major incident',role:'Major incident manager, resolver teams',mins:7,
 modules:['Event monitoring','Major incident','Swarming','Cost of downtime','Knowledge','Improvement'],
 story:'Monitoring flags that outbound payments have stopped. Pull every team that might help onto one bridge, watch what the outage costs, restore service and turn the review into an improvement.',
 setup(c){
   let t=DB.items.find(x=>x.type==='INC'&&x.major&&isOpen(x)&&x.service==='Payments Gateway'&&MI_FLOW.indexOf(x.majorStage)<=1);
   if(!t){t=seedInc({service:'Payments Gateway',title:'Outbound payments stuck in pending',desc:'Payment instructions are not leaving the gateway. All clients are affected.',caller:'Arjun Menon',impact:1,urgency:1,status:'In Progress',created:Date.now()-50*6e4});
     t.major=true;t.majorStage='Bridge open';t.notes.push({t:t.created+6e4,who:'Major Incident Manager',text:'Major incident: Declared'},{t:t.created+12e4,who:'Major Incident Manager',text:'Major incident: Bridge open'})}
   t.swarm=[];t.kb=null;
   const e=seedEvent({ci:ciId('pgw-app'),service:'Payments Gateway',sev:'Critical',message:'Error rate above 5%',source:'Application performance',status:'Incident raised',inc:t.id,count:31,time:t.created-3*6e4});
   t.events=(t.events||[]).concat(e.id);c.inc=t.id;c.evt=e.id},
 steps:[
  {t:'The alert that started it',enter:()=>{ui2.ev={sev:'Critical',status:'Incident raised'};goView('events')},
   b:'Monitoring saw the payment gateway error rate jump above 5%. Payments is a Tier 1 service, so the critical event raised an incident on its own. Open the highlighted event.',
   why:'Automatic incident creation for Tier 1 alerts means nobody waits for a client to call.',
   target:c=>`tr[data-open="${c.evt}"]`,done:c=>inDrawer(c.evt)||inDrawer(c.inc),show:c=>openDetail(c.evt)},
  {t:'Jump to the incident',rec:'evt',b:'The event links to the incident it raised. Click the incident number under <b>Incident</b>.',
   target:c=>`#drawer [data-open="${c.inc}"]`,done:c=>inDrawer(c.inc),show:c=>openDetail(c.inc)},
  {t:'Already a major incident',info:true,rec:'inc',b:'It is a P1, declared major, with the bridge open. The red track shows where you are in the major incident process.',target:'#drawer .mi-box'},
  {t:'Assemble the swarm',rec:'inc',b:'Rather than passing the ticket from queue to queue, bring everyone who might hold the answer onto the bridge at once. Add <b>Application Support</b>, <b>Network Operations</b> and the payment network supplier <b>Ledgerline</b>.',
   why:'Swarming cuts out hand-offs. On a major incident, each hand-off can cost 20 to 30 minutes.',wait:'add the three teams',
   target:'#swarmBox',done:c=>(get(c.inc).swarm||[]).length>=3,show:c=>{SWARM.forEach(g=>{if(!(get(c.inc).swarm||[]).includes(g))act(c.inc,'swarm:'+g)})}},
  {t:'Watch what it costs',info:true,rec:'inc',b:'A full Payments Gateway outage costs about S$85k an hour, and a major incident counts as 70% of that. The <b>Downtime cost</b> counter keeps running until service is restored. This is why every minute of MTTR matters.',target:'#drawer .facts [data-tick]'},
  {t:'Apply the known workaround',rec:'inc',b:'The swarm spots the pattern: instructions are stuck in the outbound queue. There is a runbook for that. Under <b>Suggested knowledge</b>, click <b>Apply</b> on <b>Re-queue stuck outbound payment instructions</b>.',
   target:'#drawer [data-act^="kb:"]',done:c=>!!get(c.inc).kb,show:c=>{openRec(c.inc);clickSel('#drawer [data-act^="kb:"]')}},
  {t:'Update stakeholders',rec:'inc',b:'Tell the business what is affected, what the swarm is doing and when the next update is due. Click <b>Advance</b> until the stage is <b>Comms sent</b>.',
   target:'#drawer [data-act="mi"]',done:c=>miAt(c.inc,'Comms sent'),show:c=>{for(let k=0;k<3&&!miAt(c.inc,'Comms sent');k++){openRec(c.inc);clickSel('#drawer [data-act="mi"]')}}},
  {t:'Restore service',rec:'inc',b:'The re-queued payments go out and the bank confirms acknowledgements. Click <b>Advance to: Service restored</b>. The cost counter stops.',
   target:'#drawer [data-act="mi"]',done:c=>miAt(c.inc,'Service restored'),show:c=>{openRec(c.inc);clickSel('#drawer [data-act="mi"]')}},
  {t:'Hold the post-incident review',rec:'inc',b:'Run a blameless review with the swarm. Click <b>Advance to: PIR complete</b>.',
   target:'#drawer [data-act="mi"]',done:c=>miAt(c.inc,'PIR complete'),show:c=>{openRec(c.inc);clickSel('#drawer [data-act="mi"]')}},
  {t:'Turn a lesson into an improvement',rec:'inc',b:'One action from the review is to alert on queue depth before errors start. Click <b>Log improvement from this review</b>, adjust the wording, then click <b>Log improvement</b>.',
   why:'A review only changes something if its actions are tracked to completion.',
   target:()=>$('#csiForm button[type=submit]')||'#drawer [data-newcsi]',done:c=>!!get(c.inc).csi,
   show:c=>{if(!$('#csiForm')){openDetail(c.inc);clickSel('#drawer [data-newcsi]')}fill('c-title','Alert on payment queue depth before errors start');fill('c-eff','Low');submitIf('#csiForm')}},
  {t:'See the cost in the reports',info:true,enter:()=>goView('dashboard-costs'),b:'The cost of downtime report puts a figure on every P1 and P2. It shows what a faster MTTR is worth in money, which is the language senior management uses.',target:'#rep-cost'}
 ]},

{id:'stdnormal',short:'Standard vs normal',title:'Standard vs normal change: two paths compared',role:'Change owner, change manager',mins:6,
 modules:['Change','Standard change','CMDB','Failure simulation','CAB'],
 story:'A routine OS patch and a payments database migration both need to go in next week. See why one takes two clicks and the other goes to CAB.',
 setup(c){c.db=ciId('pgw-db-01')},
 steps:[
  {t:'Three paths for a change',info:true,enter:()=>goView('changes'),b:'Every change takes one of three paths, depending on its risk. Standard changes are pre-approved, normal changes are assessed and go to CAB, and emergency changes go to the emergency CAB.',target:'#chgPaths'},
  {t:'Raise the routine patch',enter:()=>goView('changes',()=>{openDrawer(createForm('CHG',STD2_PRESET));bindCreate()}),
   b:'The monthly OS patch follows an approved template, so it is a <b>Standard</b> change with <b>Low</b> risk. Click <b>Create change</b>.',
   target:'#createForm button[type=submit]',done:c=>{const x=fresh('CHG',x=>x.changeType==='Standard');if(x)c.std=x.id;return !!x},
   show:()=>{if(!$('#createForm[data-type="CHG"]')){openDrawer(createForm('CHG',STD2_PRESET));bindCreate()}submitIf('#createForm')}},
  {t:'Straight to the schedule',rec:'std',b:'Click <b>Move to Assessment</b>, then <b>Pre-approved: schedule</b>. There is no CAB step.',
   target:PRI,done:c=>stAt(c.std,'Scheduled'),show:c=>{for(let k=0;k<2&&!stAt(c.std,'Scheduled');k++)clickPrimary(c.std)}},
  {t:'Now the risky one',enter:()=>{openDrawer(createForm('CHG',NRM_PRESET));bindCreate()},
   b:'Moving the payments database is a <b>Normal</b> change with <b>High</b> risk. The form includes the cut-over and back-out plans. Click <b>Create change</b>.',
   target:'#createForm button[type=submit]',done:c=>{const x=fresh('CHG',x=>x.changeType==='Normal'&&x.title.startsWith('Migrate'));if(x)c.nrm=x.id;return !!x},
   show:()=>{if(!$('#createForm[data-type="CHG"]')){openDrawer(createForm('CHG',NRM_PRESET));bindCreate()}submitIf('#createForm')}},
  {t:'Assess it',rec:'nrm',b:'Click <b>Move to Assessment</b>. The change manager now checks risk and impact.',target:PRI,done:c=>stAt(c.nrm,'Assessment'),show:c=>clickPrimary(c.nrm)},
  {t:'Simulate the database failing',enter:()=>{ui2.cmdb.svc='Payments Gateway';ui2.cmdb.simOn=true;ui2.cmdb.fail=null;goView('cmdb')},
   b:'What if the migration goes wrong? The map is in <b>Simulate a failure</b> mode. Click <b>pgw-db-01</b>.',
   why:'Knowing what depends on an item is how you size the risk of changing it.',
   target:c=>`[data-simci="${c.db}"]`,done:c=>ui2.cmdb.fail===c.db,show:c=>{ui2.cmdb.simOn=true;ui2.cmdb.fail=c.db;render()}},
  {t:'Read the impact',info:true,b:'The application and the Payments Gateway service go down with it, costing about S$85k an hour. That is why this change needs CAB, a tested back-out plan and a quiet window.',target:'#simImpact'},
  {t:'Send it to CAB',rec:'nrm',enter:c=>{ui2.cmdb.simOn=false;ui2.cmdb.fail=null;openDetail(c.nrm)},b:'Click <b>Move to CAB approval</b>.',target:PRI,done:c=>stAt(c.nrm,'CAB approval'),show:c=>clickPrimary(c.nrm)},
  {t:'CAB approves it',rec:'nrm',b:'CAB checks the plan, the impact and the timing, and agrees the Saturday window. Click <b>Approve at CAB</b>.',target:'#drawer [data-act="approve"]',done:c=>stAt(c.nrm,'Scheduled'),show:c=>{openRec(c.nrm);clickSel('#drawer [data-act="approve"]')}},
  {t:'Both on the calendar',info:true,enter:()=>goView('changes'),b:'Both changes are now on the change calendar. The standard change took two clicks and no meeting. The normal change needed assessment, an impact check and a CAB decision. The effort matches the risk.',target:c=>`#chgCal [data-open="${c.nrm}"]`}
 ]},

{id:'laptop',short:'Laptop lifecycle',title:'Hardware lifecycle: from laptop request to the user’s desk',role:'Service desk analyst, desktop support, asset manager',mins:5,
 modules:['Service catalogue','Request','Approval','Tasks','Asset register'],
 story:'A user needs a replacement laptop. Follow the request through approval while the laptop itself moves from In stock to Allocated to In use.',
 steps:[
  {t:'Request a laptop',enter:()=>goView('catalogue'),b:'Click <b>Request</b> on <b>New laptop</b>.',target:'[data-reqitem="New laptop"]',
   done:()=>!!$('#createForm[data-type="REQ"]')||!!fresh('REQ',t=>t.item==='New laptop'),show:()=>clickSel('[data-reqitem="New laptop"]')},
  {t:'Submit it',b:'Enter who it is for and why, then click <b>Create service request</b>. The target is 72 hours and the manager has to approve it.',
   target:'#createForm button[type=submit]',done:c=>{const r=fresh('REQ',t=>t.item==='New laptop');if(r)c.req=r.id;return !!r},
   show:()=>{if(!$('#createForm[data-type="REQ"]')){openDrawer(createForm('REQ',{item:'New laptop'}));bindCreate()}fill('f-item','New laptop');fill('f-for','Ravi Shah');fill('f-desc','Replacement: current laptop is out of warranty and failing');submitIf('#createForm')}},
  {t:'Send for approval',rec:'req',b:'Click <b>Send for approval</b>.',target:PRI,done:c=>stAt(c.req,'Approval'),show:c=>clickPrimary(c.req)},
  {t:'Manager approves',rec:'req',b:'Acting as the line manager, click <b>Approve</b>.',target:'#drawer [data-act="approve"]',done:c=>stAt(c.req,'Fulfilment'),show:c=>{openRec(c.req);clickSel('#drawer [data-act="approve"]')}},
  {t:'Allocate one from stock',rec:'req',b:'Desktop support picks a laptop. Click <b>Complete</b> on <b>Allocate a laptop from stock</b>. The tool takes one that is <b>In stock</b> and moves it to <b>Allocated</b>.',
   target:'#drawer [data-act="task:0"]',done:c=>{const r=get(c.req);if(r&&r.asset)c.ast=r.asset;return !!(r&&r.asset)},show:c=>{openRec(c.req);clickSel('#drawer [data-act="task:0"]')}},
  {t:'See the asset record change',info:true,enter:()=>{ui2.ast='All';goView('cmdb')},b:'In the laptop asset register, that laptop is now <b>Allocated</b> and linked to the request. Stock is down by one.',target:c=>`#astReg tr[data-open="${c.ast}"]`},
  {t:'Image it and hand it over',rec:'req',enter:c=>openDetail(c.req),b:'Complete <b>Image, encrypt and tag the asset</b>, then <b>Deliver and record the asset handover</b>. The handover moves the laptop to <b>In use</b>.',
   wait:'complete both tasks',target:'#drawer [data-act^="task:"]',done:c=>{const r=get(c.req);return !!(r&&r.tasks.every(x=>x.status==='Done'))},show:c=>{openRec(c.req);let g=0;while(g++<5&&clickSel('#drawer [data-act^="task:"]')){}}},
  {t:'Fulfil and close',rec:'req',b:'Click <b>Move to Fulfilled</b>, then <b>Move to Closed</b>.',target:PRI,done:c=>stAt(c.req,'Closed'),show:c=>{for(let k=0;k<2&&!stAt(c.req,'Closed');k++)clickPrimary(c.req)}},
  {t:'The asset’s full history',info:true,rec:'ast',enter:c=>openDetail(c.ast),b:'The asset record shows every step from stock to the user. Asset management relies on this history for audits, warranty claims and refresh planning.',target:'#drawer .timeline'}
 ]},

{id:'csi',short:'Improvement',title:'Log, prioritise and deliver an improvement',role:'Service owner, continual improvement manager',mins:4,
 modules:['Improvement register','Value and effort','Measurement','Reports'],
 story:'The data warehouse keeps raising P2s when the overnight load runs late. Log an improvement, prioritise it, deliver it and prove it worked.',
 steps:[
  {t:'Value against effort',info:true,enter:()=>goView('improvement'),b:'The register plots open improvements by value and effort. High value, low effort items are quick wins: do those first.',target:'#csiMatrix'},
  {t:'Log the improvement',enter:()=>{openDrawer(csiForm(CSI_PRESET));updateCsiQuad()},
   b:'We have filled it in from a problem trend: high value, low effort, so its priority shows as <b>Quick win</b>. The measure gives a baseline and a target. Click <b>Log improvement</b>.',
   target:'#csiForm button[type=submit]',done:c=>{const x=DB.csi.find(x=>x.created>=c.since);if(x)c.csi=x.id;return !!x},
   show:()=>{if(!$('#csiForm')){openDrawer(csiForm(CSI_PRESET));updateCsiQuad()}submitIf('#csiForm')}},
  {t:'Assess it',rec:'csi',b:'The service owner confirms the value and effort ratings. Click <b>Move to Assessed</b>.',target:PRI,done:c=>csiAt(c.csi,'Assessed'),show:c=>clickPrimary(c.csi)},
  {t:'Approve it',rec:'csi',b:'It gets an owner and a target date. Click <b>Move to Approved</b>.',target:PRI,done:c=>csiAt(c.csi,'Approved'),show:c=>clickPrimary(c.csi)},
  {t:'Start the work',rec:'csi',b:'Click <b>Move to In progress</b>.',target:PRI,done:c=>csiAt(c.csi,'In progress'),show:c=>clickPrimary(c.csi)},
  {t:'Measure the benefit',rec:'csi',b:'Finishing the work is not enough. Record what the measure shows now, for example <b>2 a month in the first month</b>, then click <b>Mark done: benefit measured</b>. The tool will not close it without a result.',
   why:'Without a measured result you cannot tell an improvement from a change.',target:'#csiBenefitBox',done:c=>csiAt(c.csi,'Done'),
   show:c=>{openRec(c.csi);fill('csiBenefit','2 a month in the first month');clickPrimary(c.csi)}},
  {t:'Report it',info:true,enter:()=>goView('dashboard-improvement'),b:'The improvement report shows the pipeline by status and every delivered item with its measured benefit, ready for the monthly service review.',target:'#rep-csi'}
 ]}
);
TOUR_GROUPS[0][2].splice(1,0,'swarm');
TOUR_GROUPS[1][2].push('laptop');
TOUR_GROUPS[2][2].splice(2,0,'stdnormal');
TOUR_GROUPS[3][2].push('csi');
