/* Meridian Service Desk: Sample data generator (seeded, relative to today) */
"use strict";
/* ---------- sample data ---------- */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function generate(now){
  const R=rng(20261017);
  const pick=a=>a[Math.floor(R()*a.length)];
  const seq={INC:41820,PRB:1290,CHG:7710,REQ:88400,REL:140};
  const nid=t=>{seq[t]+=1+Math.floor(R()*2);return t+String(seq[t]).padStart(7,'0')};
  const note=(t,who,text)=>({t,who,text});
  const wknd=ms=>{const d=new Date(ms).getDay();return d===0||d===6};
  const dayStart=ms=>{const d=new Date(ms);d.setHours(0,0,0,0);return d.getTime()};
  const T=[];

  function makeInc(c,o){
    o=o||{};
    const r=R();const pr=o.pr||(r<.02?'P1':r<.13?'P2':r<.6?'P3':'P4');
    const [impact,urgency]=pick({P1:[[1,1]],P2:[[1,2],[2,1]],P3:[[2,2],[1,3],[3,1]],P4:[[2,3],[3,2],[3,3]]}[pr]);
    const service=o.service||pick(SVC);const title=o.title||pick(SERVICES[service]);
    const assignee=pick(PEOPLE);const caller=pick(CALLERS);
    const res={P1:1+R()*4.5,P2:2+R()*9,P3:1+Math.pow(R(),1.9)*28,P4:2+Math.pow(R(),1.7)*78}[pr];
    let resolved=c+res*HR,status;
    if(o.hold){resolved=null;status=o.hold}
    else if(resolved>now){resolved=null;const age=(now-c)/HR;status=age<.4?'New':pick(['Assigned','In Progress','In Progress','In Progress','On Hold'])}
    else status=(now-resolved>3*DAY)?'Closed':'Resolved';
    const isNew=status==='New';
    const t={id:nid('INC'),type:'INC',title,service,impact,urgency,priority:pr,status,group:isNew?'Service Desk L1':GROUP_OF[service],assignee:isNew?'':assignee,caller,created:c,resolved,links:[],major:!!o.major,majorStage:o.majorStage||null,
      notes:[note(c,'Service Desk',`Logged by ${caller} by phone`)]};
    if(!isNew)t.notes.push(note(c+(pr==='P1'?.1:.6)*HR,'Service Desk',`Assigned to ${t.group}`));
    if(o.major){
      const stages=MI_FLOW.slice(0,MI_FLOW.indexOf(o.majorStage)+1);
      const span=resolved?(resolved-c):(now-c);
      stages.forEach((s,i)=>t.notes.push(note(c+span*(i/(Math.max(stages.length,4)))+6e4,'Major Incident Manager',`Major incident: ${s}`)));
    }
    if(resolved)t.notes.push(note(resolved,assignee,pick(RESOLUTIONS)));
    return t;
  }

  for(let d=89;d>=0;d--){
    const base=now-d*DAY;
    const n=wknd(base)?1+Math.floor(R()*2):3+Math.floor(R()*4);
    const cs=[];for(let i=0;i<n;i++)cs.push(base-R()*DAY);cs.sort((a,b)=>a-b);
    cs.forEach(c=>T.push(makeInc(c)));
    if(d===61)T.push(makeInc(base-.6*DAY,{pr:'P1',service:'Trade Matching',title:'Matching engine queue backlog',major:true,majorStage:'PIR complete'}));
    if(d===34)T.push(makeInc(base-.4*DAY,{pr:'P1',service:'Identity & Access',title:'MFA prompts failing for remote users',major:true,majorStage:'PIR complete'}));
    if(d===6)T.push(makeInc(base-.5*DAY,{pr:'P1',service:'Client Portal',title:'Users unable to log in to client portal',major:true,majorStage:'Service restored'}));
    if([9,13,16,21,26].includes(d))T.push(makeInc(base-R()*DAY,{pr:pick(['P3','P4']),hold:pick(['On Hold','In Progress'])}));
  }
  T.push(makeInc(now-1.3*HR,{pr:'P1',service:'Payments Gateway',title:'Outbound payments stuck in pending',major:true,majorStage:'Bridge open',hold:'In Progress'}));

  const incs=T.filter(t=>t.type==='INC');
  for(let d=86;d>=2;d-=4){
    const c=now-d*DAY+R()*DAY*.5;
    const service=pick(SVC);
    const cand=incs.filter(i=>i.service===service&&i.created<c&&i.created>c-21*DAY&&!i.major);
    const linked=cand.sort(()=>R()-.5).slice(0,2+Math.floor(R()*4));
    const idx=Math.min(5,Math.floor((d/90)*5+R()*2.2));
    const p={id:nid('PRB'),type:'PRB',title:'Recurring: '+(linked[0]?linked[0].title:pick(SERVICES[service])).toLowerCase(),service,priority:pick(['P2','P3','P3','P4']),status:FLOW.PRB[idx],
      group:GROUP_OF[service],assignee:pick(PEOPLE),created:c,resolved:idx>=4?Math.min(now-DAY,c+(4+R()*20)*DAY):null,links:linked.map(i=>i.id),
      rootCause:idx>=2?pick(ROOT_CAUSES):null,knownError:idx>=3,workaround:idx>=3?pick(WORKAROUNDS):'',
      notes:[note(c,'Problem Manager','Raised from incident trend review')]};
    if(p.rootCause)p.notes.push(note(c+2*DAY,p.assignee,`Root cause identified: ${p.rootCause}`));
    if(p.knownError)p.notes.push(note(c+3*DAY,p.assignee,`Known error published. Workaround: ${p.workaround}`));
    linked.forEach(i=>i.links.push(p.id));
    T.push(p);
  }
  // major incidents always get a problem
  incs.filter(i=>i.major).forEach(mi=>{
    const age=(now-mi.created)/DAY;const idx=age>30?5:age>5?3:1;
    const p={id:nid('PRB'),type:'PRB',title:'Root cause of major incident: '+mi.title.toLowerCase(),service:mi.service,priority:'P1',status:FLOW.PRB[idx],group:GROUP_OF[mi.service],assignee:pick(PEOPLE),
      created:Math.min(now-6e4,mi.created+3*HR),resolved:idx>=4?mi.created+12*DAY:null,links:[mi.id],rootCause:idx>=2?pick(ROOT_CAUSES):null,knownError:idx>=3,workaround:idx>=3?pick(WORKAROUNDS):'',
      notes:[note(Math.min(now-6e4,mi.created+3*HR),'Problem Manager','Raised from major incident')]};
    mi.links.push(p.id);T.push(p);
  });

  for(let d=89;d>=-14;d--){
    const base=now-d*DAY;
    const n=d<0?(wknd(base)?0:1+(R()<.45?1:0)):(wknd(base)?(R()<.25?1:0):Math.floor(R()*3.2));
    for(let i=0;i<n;i++){
      const r=R();const ctype=r<.55?'Standard':(r<.9||d<0)?'Normal':'Emergency';
      const service=pick(SVC);
      const planned=dayStart(base)+(19+Math.floor(R()*4))*HR;
      const lead={Standard:1+R(),Normal:6+R()*4,Emergency:.05+R()*.3}[ctype];
      let created=planned-lead*DAY;if(created>now)created=now-R()*DAY;
      const risk=ctype==='Standard'?'Low':ctype==='Normal'?pick(['Low','Medium','Medium','High']):pick(['High','Medium']);
      let status,outcome=null,resolved=null;
      if(planned+3*HR<now){
        const o=R();const okT=ctype==='Emergency'?.8:ctype==='Normal'?.88:.96;
        outcome=o<okT?'Successful':o<okT+(1-okT)/2?'Failed':'Backed out';
        resolved=planned+3*HR;status=now-planned<2*DAY?'Review':'Closed';
      }else if(planned<now)status='Implementing';
      else{
        const days=(planned-now)/DAY;
        status=ctype==='Standard'?'Scheduled':ctype==='Emergency'?'CAB approval':days>6?pick(['Assessment','CAB approval']):days>3?pick(['CAB approval','Scheduled']):'Scheduled';
      }
      const c={id:nid('CHG'),type:'CHG',title:pick(CHG_TPL)(service),service,changeType:ctype,risk,status,group:GROUP_OF[service],assignee:pick(PEOPLE),created,planned,resolved,outcome,links:[],
        notes:[note(created,pick(PEOPLE),`Request for change raised (${ctype.toLowerCase()})`)]};
      if(ctype!=='Standard'&&['Scheduled','Implementing','Review','Closed'].includes(status))c.notes.push(note(Math.min(now,created+(planned-created)*.5),'Change Advisory Board',ctype==='Emergency'?'Approved at emergency CAB':'Approved at CAB'));
      if(outcome)c.notes.push(note(resolved,c.assignee,`Implemented. Outcome: ${outcome}`));
      if(outcome&&outcome!=='Successful'){
        const hit=incs.find(x=>x.service===service&&x.created>planned&&x.created<planned+DAY&&!x.links.some(l=>l.startsWith('CHG')));
        if(hit){c.links.push(hit.id);hit.links.push(c.id);c.causedIncident=true}
      }
      T.push(c);
    }
  }

  const totalW=CATALOG.reduce((a,c)=>a+c.w,0);
  const pickItem=()=>{let x=R()*totalW;for(const c of CATALOG){x-=c.w;if(x<=0)return c}return CATALOG[0]};
  for(let d=89;d>=0;d--){
    const base=now-d*DAY;const n=wknd(base)?1+Math.floor(R()*3):6+Math.floor(R()*7);
    const cs=[];for(let i=0;i<n;i++)cs.push(base-R()*DAY);cs.sort((a,b)=>a-b);
    cs.forEach(c=>{
      const item=pickItem();const who=pick(CALLERS);
      const hrs=item.target*(.2+Math.pow(R(),1.3)*.95);
      let resolved=c+hrs*HR,status;
      if(resolved>now){resolved=null;const age=(now-c)/HR;status=age<.2?'Submitted':(item.approval&&age<item.target*.3?'Approval':'Fulfilment')}
      else status=now-resolved>5*DAY?'Closed':'Fulfilled';
      T.push({id:nid('REQ'),type:'REQ',title:`${item.name} for ${who}`,item:item.name,requestedFor:who,service:'Service catalogue',status,group:item.name==='New laptop'||item.name==='New starter onboarding'?'End User Services':'Service Desk L1',
        assignee:status==='Submitted'?'':pick(PEOPLE),created:c,resolved,links:[],approval:item.approval,
        notes:[note(c,who,'Submitted from the service catalogue')].concat(resolved?[note(resolved,'Service Desk','Fulfilled and confirmed with requester')]:[])});
    });
  }

  const RELS=[[-80,'Client Portal','Client Portal 4.10'],[-63,'Payments Gateway','Payments Gateway 2.7'],[-47,'Trade Matching','Trade Matching 6.3'],[-31,'Client Portal','Client Portal 4.11'],
    [-17,'Data Warehouse','Data Warehouse 2026.09'],[-4,'Payments Gateway','Payments Gateway 2.8'],[6,'Client Portal','Client Portal 4.12'],[20,'Trade Matching','Trade Matching 6.4']];
  const chgs=T.filter(t=>t.type==='CHG');
  RELS.forEach(([off,service,name])=>{
    const deploy=dayStart(now+off*DAY)+20*HR;
    const status=off<-10?'Closed':off<=0?'Early life support':off<=10?'Test':'Build';
    const inc=chgs.filter(c=>c.service===service&&Math.abs(c.planned-deploy)<12*DAY).slice(0,4);
    const r={id:nid('REL'),type:'REL',title:name,service,status,group:GROUP_OF[service],assignee:pick(PEOPLE),created:deploy-35*DAY,planned:deploy,resolved:status==='Closed'?deploy+14*DAY:null,links:inc.map(c=>c.id),
      notes:[note(deploy-35*DAY,'Release Manager','Release scope agreed')]};
    if(off<=0)r.notes.push(note(deploy,'Release Manager','Deployed to production'));
    inc.forEach(c=>c.links.push(r.id));
    T.push(r);
  });
  T.filter(t=>t.type==='REQ').forEach(t=>{const def=REQ_TASKS[t.item]||[];const nd=t.resolved?def.length:t.status==='Fulfilment'?Math.floor(R()*def.length):0;
    t.tasks=def.map(([name,group],i)=>({name,group,status:i<nd?'Done':'Open',done:i<nd?(t.resolved||now)-(def.length-i)*HR*R():null}))});
  /* configuration items */
  const CI=[];let ciN=2000;const cid=()=>'CI'+String(++ciN).padStart(6,'0');
  const PFX={'Payments Gateway':'pgw','Trade Matching':'trm','Client Portal':'cpt','Email & Collaboration':'exo','Network & VPN':'net','Identity & Access':'idm','Data Warehouse':'dwh','HR Self-Service':'hrs'};
  const supFor=s=>(SUPPLIERS.find(x=>x.services.includes(s))||{}).name||'In-house';
  const mk=o=>Object.assign({kind:'CI',env:'Production',status:'In use',deps:[],cap:null,warranty:null},o);
  const shared={fw:mk({id:cid(),name:'sg1-fw-01',cls:'Network device',service:'Network & VPN',owner:'Network Operations',location:'SG1 data centre',supplier:'Kestrel Networks',version:'FortiOS 7.4'}),
    lb:mk({id:cid(),name:'sg1-lb-01',cls:'Network device',service:'Network & VPN',owner:'Network Operations',location:'SG1 data centre',supplier:'Kestrel Networks',version:'BIG-IP 17.1'}),
    vpn:mk({id:cid(),name:'vpn-gw-01',cls:'Network device',service:'Network & VPN',owner:'Network Operations',location:'SG2 data centre',supplier:'Kestrel Networks',version:'PAN-OS 11.1'})};
  SVC.forEach(s=>{
    const p=PFX[s];const loc=pick(['SG1 data centre','SG2 data centre','Cloud – Southeast Asia']);
    const own=GROUP_OF[s],sup=supFor(s);
    const bs=mk({id:cid(),name:s,cls:'Business service',service:s,owner:own,location:'—',supplier:sup,version:SVC_TIER[s]});
    const app=mk({id:cid(),name:p+'-app',cls:'Application',service:s,owner:own,location:loc,supplier:sup,version:(2+Math.floor(R()*5))+'.'+Math.floor(R()*12)});
    const os=pick(['RHEL 9.4','Windows Server 2022','Ubuntu 22.04']);
    const srv=n=>mk({id:cid(),name:`${p}-app-0${n}`,cls:'Server',service:s,owner:'Infrastructure',location:loc,supplier:loc.startsWith('Cloud')?'Northbridge Cloud':'In-house',version:os,
      warranty:now+(-40+Math.floor(R()*900))*DAY,cap:{cpu:Math.round(25+R()*55),mem:Math.round(35+R()*45),disk:Math.round(30+R()*45),growth:+(R()*4).toFixed(1)}});
    const s1=srv(1),s2=srv(2);
    const db=mk({id:cid(),name:p+'-db-01',cls:'Database',service:s,owner:'Data Platform',location:loc,supplier:sup,version:pick(['PostgreSQL 15','SQL Server 2022','Oracle 19c']),
      warranty:now+(60+Math.floor(R()*700))*DAY,cap:{cpu:Math.round(20+R()*50),mem:Math.round(40+R()*40),disk:Math.round(40+R()*40),growth:+(1+R()*4).toFixed(1)}});
    bs.deps=[app.id];app.deps=[s1.id,s2.id,db.id];
    if(['Payments Gateway','Client Portal','Trade Matching'].includes(s))app.deps.push(shared.lb.id);
    if(s==='Network & VPN')bs.deps.push(shared.fw.id,shared.vpn.id);
    if(s==='HR Self-Service'&&R()<1)s2.status='Maintenance';
    CI.push(bs,app,s1,s2,db);
  });
  CI.push(shared.fw,shared.lb,shared.vpn);
  const byName=n=>CI.find(c=>c.name===n);
  byName('pgw-app-01').cap={cpu:88,mem:81,disk:62,growth:3.4};
  byName('dwh-db-01').cap={cpu:57,mem:74,disk:91,growth:4.8};
  byName('cpt-app-02').cap={cpu:79,mem:84,disk:55,growth:2.1};
  const ciOf=s=>CI.filter(c=>c.service===s&&c.cls!=='Business service');
  T.filter(t=>t.type==='INC'||t.type==='CHG').forEach(t=>{const l=ciOf(t.service);t.ci=(R()<.45?l.find(c=>c.cls==='Application'):pick(l)).id});
  const live=T.find(t=>t.type==='INC'&&t.major&&!t.resolved);if(live)live.ci=byName('pgw-app').id;

  /* knowledge */
  const KB=[];let kbN=10200;const kid=()=>'KB'+String(kbN+=1+Math.floor(R()*3)).padStart(7,'0');
  const KB_STD=[
    ['Reset your password and re-enrol MFA','Self-help','End users','Identity & Access',['Go to the self-service password page from any company device.','Verify with your registered mobile number.','Choose a new password of 14 characters or more.','Open the authenticator app and scan the new QR code to re-enrol MFA.']],
    ['Connect to the VPN when working from home','Self-help','End users','Network & VPN',['Make sure your laptop is on a home or trusted network.','Open the VPN client and choose the Singapore gateway.','Sign in with your network account and approve the MFA prompt.','If it disconnects repeatedly, switch to the secondary gateway and log a ticket.']],
    ['Outlook crashes on start-up','Self-help','End users','Email & Collaboration',['Close Outlook completely.','Start Outlook in safe mode (hold Ctrl while opening).','Disable recently added add-ins under File > Options > Add-ins.','Restart Outlook normally. If it still fails, log an incident.']],
    ['Statement downloads time out in the client portal','Self-help','End users','Client Portal',['Download one month at a time rather than a full year.','Clear the browser cache and sign in again.','Use the CSV format for large statements.']],
    ['Re-queue stuck outbound payment instructions','Resolver runbook','IT staff','Payments Gateway',['Confirm the queue depth on the payments dashboard.','Pause the outbound connector.','Re-queue instructions older than 15 minutes using the operator console.','Resume the connector and confirm acknowledgements from the bank.']],
    ['Clear a matching engine backlog','Resolver runbook','IT staff','Trade Matching',['Check worker health on all matching nodes.','Restart unhealthy workers one at a time.','Raise the worker count to 12 until the queue drains.','Return to the standard count of 8 and log a change record.']],
    ['Restart the overnight ETL after an upstream delay','Resolver runbook','IT staff','Data Warehouse',['Confirm the upstream file has arrived after 06:00.','Re-run the ETL from the failed step only.','Validate row counts against the source extract.','Notify report owners that data is refreshed.']],
    ['Run a major incident bridge','Process guide','IT staff','—',['Declare the major incident and open the bridge line.','Assign a technical lead and a communications lead.','Send the first stakeholder update within 30 minutes, then every 30 minutes.','Confirm service restoration with the business owner.','Book the post-incident review within 5 business days.']],
    ['Raise a standard change','Process guide','IT staff','—',['Pick the matching template from the standard change catalogue.','Fill in the affected configuration items and window.','Schedule it; no CAB approval is needed.','Record the outcome after implementation.']],
    ['New starter onboarding checklist','Process guide','IT staff','—',['Create the network account five working days before the start date.','Order and image the laptop.','Grant role-based access from the HR record.','Hand over equipment on day one and confirm sign-in.']]];
  KB_STD.forEach(([title,cat,aud,svc,steps],i)=>KB.push({kind:'KB',id:kid(),title,category:cat,audience:aud,service:svc,status:i===8?'In review':'Published',author:pick(PEOPLE),updated:now-(5+Math.floor(R()*120))*DAY,views:Math.round(80+R()*1900),helpful:Math.round(68+R()*28),steps,links:[],uses:0}));
  T.filter(t=>t.type==='PRB'&&t.knownError).forEach(p=>{
    if(R()<.25)return;
    const k={kind:'KB',id:kid(),title:'Known error: '+p.title.replace(/^(Recurring|Root cause of major incident): /i,''),category:'Known error',audience:'IT staff',service:p.service,status:'Published',author:p.assignee,updated:p.created+3*DAY,views:Math.round(20+R()*300),helpful:Math.round(70+R()*25),
      steps:['Symptom: '+p.title.replace(/^(Recurring|Root cause of major incident): /i,''),'Workaround: '+p.workaround,'Root cause: '+(p.rootCause||'Under investigation'),'Permanent fix is tracked on problem '+p.id+'.'],links:[p.id],uses:0};
    p.kb=k.id;KB.push(k);
  });
  T.filter(t=>t.type==='INC'&&t.resolved).forEach(t=>{
    if(R()>.38)return;const cand=KB.filter(k=>k.status==='Published'&&(k.service===t.service));if(!cand.length)return;const k=pick(cand);t.kb=k.id;k.uses++;
  });

  /* events */
  const EV=[];let evN=730000;const eid=()=>'EVT'+String(evN+=1+Math.floor(R()*4)).padStart(7,'0');
  const evCI=CI.filter(c=>EV_MSG[c.cls]);
  for(let d=6;d>=0;d--){
    const base=now-d*DAY;const n=14+Math.floor(R()*14);
    const cs=[];for(let i=0;i<n;i++)cs.push(base-R()*DAY);cs.sort((a,b)=>a-b);
    cs.forEach(c=>{
      const ci=pick(evCI);const r=R();const sev=r<.45?'Info':r<.86?'Warning':'Critical';const age=(now-c)/HR;
      const e={kind:'EVT',id:eid(),time:c,ci:ci.id,service:ci.service,sev,message:pick(EV_MSG[ci.cls]),source:EV_SRC[ci.cls],status:'Cleared',inc:null,count:1+Math.floor(R()*(sev==='Info'?2:6))};
      if(sev==='Critical'){const hit=T.find(t=>t.type==='INC'&&t.service===ci.service&&Math.abs(t.created-c)<3*HR);if(hit){e.status='Incident raised';e.inc=hit.id;hit.events=(hit.events||[]).concat(e.id)}else e.status=age<4?'Open':'Correlated'}
      else if(sev==='Warning')e.status=age<2?'Open':R()<.25?'Correlated':'Cleared';
      EV.push(e);
    });
  }
  if(live){const e={kind:'EVT',id:eid(),time:now-1.45*HR,ci:byName('pgw-app').id,service:'Payments Gateway',sev:'Critical',message:'Error rate above 5%',source:'Application performance',status:'Incident raised',inc:live.id,count:14};EV.push(e);live.events=[e.id]}
  EV.sort((a,b)=>b.time-a.time);

  /* customer satisfaction */
  T.filter(t=>(t.type==='INC'||t.type==='REQ')&&t.resolved).forEach(t=>{
    if(R()>.3)return;const r=R();const slaBad=(t.resolved-t.created)/HR>(t.type==='INC'?SLA[t.priority]:24);
    let s=r<.55?5:r<.83?4:r<.92?3:r<.97?2:1;if(slaBad&&s>2&&R()<.5)s--;
    t.csat={score:s,comment:R()<.55?pick(CSAT_TXT[s]):'',t:Math.min(now-6e4,t.resolved+(2+R()*20)*HR)};
  });

  /* continuity */
  const BCP=SVC.map(s=>{const last=now-(25+Math.floor(R()*190))*DAY;const tier=SVC_TIER[s];
    return{service:s,tier,rto:tier==='Tier 1'?'2 h':tier==='Tier 2'?'8 h':'24 h',rpo:tier==='Tier 1'?'15 min':tier==='Tier 2'?'1 h':'24 h',lastTest:last,nextTest:last+(tier==='Tier 1'?182:365)*DAY,
      result:s==='Data Warehouse'?'Failed':pick(['Passed','Passed','Passed','Passed with actions']),achieved:tier==='Tier 1'?pick(['1 h 20 m','1 h 45 m','55 m']):pick(['3 h 10 m','5 h 40 m','11 h'])}});
  BCP.find(b=>b.service==='Trade Matching').lastTest=now-200*DAY;BCP.find(b=>b.service==='Trade Matching').nextTest=now-18*DAY;

  return {created:now,seq,items:T,ci:CI,kb:KB,events:EV,bcp:BCP,assets:genAssets(now,T),csi:genCSI(now)};
}

