/* Meridian Service Desk: Reference data: record types, lifecycles, services, catalogue, suppliers */
"use strict";
/* ---------- reference data ---------- */
const TYPES={INC:{name:'Incident',plural:'Incidents'},PRB:{name:'Problem',plural:'Problems'},CHG:{name:'Change',plural:'Changes'},REQ:{name:'Service request',plural:'Requests'},REL:{name:'Release',plural:'Releases'}};
const FLOW={
  INC:['New','Assigned','In Progress','Resolved','Closed'],
  PRB:['Logged','Investigating','Root cause found','Known error','Resolved','Closed'],
  CHG:['Draft','Assessment','CAB approval','Scheduled','Implementing','Review','Closed'],
  REQ:['Submitted','Approval','Fulfilment','Fulfilled','Closed'],
  REL:['Planning','Build','Test','Deploy','Early life support','Closed']
};
const CLOSED={INC:['Resolved','Closed'],PRB:['Resolved','Closed'],CHG:['Closed','Rejected'],REQ:['Fulfilled','Closed','Rejected'],REL:['Closed']};
const MI_FLOW=['Declared','Bridge open','Comms sent','Service restored','PIR complete'];
const SLA={P1:4,P2:8,P3:24,P4:72};
const RESP={P1:'15 min',P2:'30 min',P3:'4 h',P4:'8 h'};
const IMPACT=['','High','Medium','Low'], URGENCY=['','High','Medium','Low'];
const SERVICES={
  'Payments Gateway':['Outbound payments stuck in pending','SWIFT acknowledgements delayed','Payment file rejected by bank','Duplicate payment alerts raised'],
  'Trade Matching':['Trade confirmations not matching','Matching engine queue backlog','Settlement instructions missing fields','Unmatched trades report empty'],
  'Client Portal':['Users unable to log in to client portal','Statement downloads timing out','Portal dashboard loading slowly','Error 500 on account summary page'],
  'Email & Collaboration':['Shared mailbox not syncing','Teams meetings dropping audio','Calendar invites not delivered','Outlook crashing on start-up'],
  'Network & VPN':['VPN disconnects every few minutes','Office Wi-Fi intermittent on level 12','High latency to Singapore data centre','Site-to-site tunnel down'],
  'Identity & Access':['MFA prompts failing for remote users','Account locked after password change','SSO error on HR system','Group membership not applied'],
  'Data Warehouse':['Overnight ETL job failed','Daily risk report missing data','Query performance degraded','Data refresh behind schedule'],
  'HR Self-Service':['Leave balance showing incorrectly','Payslip PDF not generating','Expense claim stuck in approval','Onboarding form not submitting']
};
const SVC=Object.keys(SERVICES);
const GROUP_OF={'Payments Gateway':'Application Support','Trade Matching':'Application Support','Client Portal':'Application Support','Email & Collaboration':'End User Services','Network & VPN':'Network Operations','Identity & Access':'Security Operations','Data Warehouse':'Data Platform','HR Self-Service':'Business Applications'};
const GROUPS=['Service Desk L1','Application Support','End User Services','Network Operations','Security Operations','Data Platform','Business Applications'];
const PEOPLE=['A. Tan','R. Kumar','M. Lim','J. Ong','S. Wong','D. Rahman','L. Chen','K. Nair','P. Lee','N. Ho'];
const CALLERS=['Grace Yeo','Arjun Menon','Hui Min Koh','Daniel Reyes','Siti Aisyah','Ben Carter','Wei Jie Lau','Priya Iyer','Tom Hughes','Mei Ling Goh','Farhan Ali','Chloe Ng'];
const CATALOG=[
  {name:'Password reset',target:2,approval:false,w:22},{name:'Access request',target:8,approval:true,w:20},
  {name:'Software install',target:24,approval:true,w:15},{name:'Shared mailbox',target:16,approval:true,w:8},
  {name:'VPN token',target:24,approval:false,w:10},{name:'Report / data extract',target:48,approval:true,w:8},
  {name:'New laptop',target:72,approval:true,w:9},{name:'New starter onboarding',target:120,approval:true,w:8}];
const ROOT_CAUSES=['Software defect','Configuration error','Capacity','Third-party supplier','Hardware failure','Process / human error'];
const WORKAROUNDS=['Restart the affected service node and re-queue messages','Route traffic via secondary gateway','Clear cached session tokens for affected users','Re-run job manually after 06:00 dependency completes','Temporarily raise connection pool limit'];
const RESOLUTIONS=['Restarted service and confirmed with caller','Configuration corrected and change logged','Cleared stuck queue; messages reprocessed','User access re-provisioned','Applied known-error workaround','Supplier fix confirmed; monitoring normal'];
const CAT_DESC={'Password reset':'Reset a forgotten or expired network password and re-enrol MFA.','Access request':'Access to an application, folder or role, approved by your line manager.','Software install':'Install licensed software from the approved list.','Shared mailbox':'Create a shared mailbox or change who can use one.','VPN token':'Issue or replace a VPN token for remote working.','Report / data extract':'One-off data extract or report from the data warehouse.','New laptop':'Standard laptop build, delivered and imaged for a named user.','New starter onboarding':'Accounts, laptop, access and mailbox ready for day one.'};
const CAT_GROUP={'Password reset':'Accounts and access','Access request':'Accounts and access','VPN token':'Accounts and access','Shared mailbox':'Email and collaboration','Software install':'Software','Report / data extract':'Data and reporting','New laptop':'Hardware','New starter onboarding':'People moves'};
const REQ_TASKS={
  'Password reset':[['Verify the requester’s identity','Service Desk L1'],['Reset password and re-enrol MFA','Service Desk L1']],
  'Access request':[['Grant the role in the application','Application Support'],['Confirm access works with the requester','Service Desk L1']],
  'Software install':[['Check a licence is available','Service Desk L1'],['Deploy the package to the device','End User Services']],
  'Shared mailbox':[['Create the shared mailbox','End User Services'],['Add members and permissions','End User Services']],
  'VPN token':[['Issue the VPN token','Network Operations'],['Send the setup guide to the requester','Service Desk L1']],
  'Report / data extract':[['Build the extract','Data Platform'],['Validate the figures with the requester','Data Platform']],
  'New laptop':[['Allocate a laptop from stock','End User Services'],['Image, encrypt and tag the asset','End User Services'],['Deliver and record the asset handover','End User Services']],
  'New starter onboarding':[['Create network account and mailbox','Security Operations'],['Allocate and image a laptop','End User Services'],['Grant role-based application access','Application Support'],['Issue a VPN token','Network Operations'],['Day-one handover and sign-in check','Service Desk L1']]};
const SVC_TARGET={'Payments Gateway':99.95,'Trade Matching':99.9,'Client Portal':99.9,'Identity & Access':99.95,'Network & VPN':99.9,'Email & Collaboration':99.5,'Data Warehouse':99.5,'HR Self-Service':99.0};
const SVC_TIER={'Payments Gateway':'Tier 1','Trade Matching':'Tier 1','Client Portal':'Tier 1','Identity & Access':'Tier 1','Network & VPN':'Tier 1','Email & Collaboration':'Tier 2','Data Warehouse':'Tier 2','HR Self-Service':'Tier 3'};
const SUPPLIERS=[
  {id:'SUP-01',name:'Northbridge Cloud',scope:'Hosting and compute',services:['Client Portal','Data Warehouse','HR Self-Service'],tier:'Strategic',renewal:'2027-03-31',value:1840000},
  {id:'SUP-02',name:'Kestrel Networks',scope:'WAN, VPN and office network',services:['Network & VPN'],tier:'Strategic',renewal:'2026-12-31',value:620000},
  {id:'SUP-03',name:'Ledgerline',scope:'Payment network connectivity',services:['Payments Gateway'],tier:'Critical',renewal:'2028-06-30',value:910000},
  {id:'SUP-04',name:'Orbis Identity',scope:'SSO and MFA platform',services:['Identity & Access'],tier:'Strategic',renewal:'2027-01-31',value:240000},
  {id:'SUP-05',name:'Clearwater Software',scope:'Trade matching licence and support',services:['Trade Matching'],tier:'Critical',renewal:'2027-09-30',value:1120000},
  {id:'SUP-06',name:'Brightdesk Hardware',scope:'Laptops, peripherals and break-fix',services:['Email & Collaboration'],tier:'Tactical',renewal:'2026-11-30',value:380000}];
const HW=[{model:'Dell Latitude 7450',cls:'Laptop',total:420,inUse:388,stock:22,repair:10,exp90:34},{model:'Apple MacBook Pro 14',cls:'Laptop',total:96,inUse:91,stock:3,repair:2,exp90:5},
  {model:'Dell P2723D',cls:'Monitor',total:610,inUse:571,stock:31,repair:8,exp90:0},{model:'iPhone 15',cls:'Mobile',total:180,inUse:172,stock:6,repair:2,exp90:12},{model:'Poly Studio X50',cls:'Meeting room',total:24,inUse:23,stock:0,repair:1,exp90:6}];
const SW=[{product:'Microsoft 365 E5',owned:560,used:537,unit:684},{product:'Adobe Acrobat Pro',owned:120,used:131,unit:310},{product:'Visual Studio Enterprise',owned:60,used:41,unit:3200},
  {product:'Tableau Creator',owned:40,used:38,unit:1050},{product:'Zoom Workplace Pro',owned:80,used:22,unit:200},{product:'Atlassian Jira',owned:150,used:149,unit:110}];
const EV_MSG={Server:['CPU above 90% for 10 minutes','Disk /data above 85%','Host not responding to ping','Memory above 92%'],Application:['Error rate above 5%','p95 response time above 2 s','Synthetic login check failed','Queue depth above threshold'],Database:['Replication lag above 60 s','Deadlocks detected','Connection pool exhausted','Long-running query over 10 min'],'Network device':['Interface flapping','Tunnel down','Packet loss above 4%','Configuration drift detected']};
const EV_SRC={Server:'Infrastructure monitoring',Application:'Application performance',Database:'Database monitoring','Network device':'Network monitoring'};
const CSAT_TXT={5:['Fixed quickly, thank you','Very clear updates throughout','Great service from the desk'],4:['Resolved, took a little longer than hoped','Good, but I had to chase once'],3:['Okay in the end','Fix worked but the update was unclear'],2:['Took too long for a simple issue','Had to explain the problem three times'],1:['Ticket closed before it was fixed','No updates for two days']};
const CHG_TPL=[s=>`Patch ${s} application servers`,s=>`Database minor version upgrade – ${s}`,s=>`Firewall rule update for ${s}`,s=>`TLS certificate renewal – ${s}`,s=>`Increase capacity for ${s}`,s=>`Configuration update – ${s}`];

