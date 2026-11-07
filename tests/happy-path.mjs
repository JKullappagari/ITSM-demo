// End-to-end QA pass across modules, driven through the UI the way a user would, in a headless browser.
// Covers: alert -> incident -> problem -> known error -> knowledge -> change -> CMDB maintenance window -> fix,
// catalogue request -> approval -> laptop allocated -> in use,
// dense-table layout (desk and CMDB), live SLA bars, and state surviving a refresh until Reset demo data.
// Usage: npm run test:qa                       (index.html from this folder)
//        PAGE=dist/index.html npm run test:qa  (the built single file)
//        npm run test:qa -- https://jkullappagari.github.io/ITSM-demo/   (a deployed copy)
//        SHOTS=some/folder npm run test:qa     (also save screenshots)
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL = process.argv[2] || pathToFileURL(join(root, process.env.PAGE || 'index.html')).href;
const SHOTS = process.env.SHOTS; if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.route('**/fonts.googleapis.com/**', r => r.abort());
const W = ms => page.waitForTimeout(ms);
const R = []; const check = (name, ok, detail) => R.push({ name, ok: !!ok, detail });
const shot = name => SHOTS ? page.screenshot({ path: join(SHOTS, name + '.png') }) : null;
const did = () => page.evaluate(() => $('#drawer').dataset.id);
const primary = () => page.click('#drawer > .actions .btn.primary');
const nav = async view => { await page.keyboard.press('Escape'); await page.click(`#nav a[data-view="${view}"]`); await W(350); };

try {
  await page.goto(URL + '#desk');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload(); await W(700);

  /* ---------- 1. alert -> incident -> problem -> known error -> change -> CMDB ---------- */
  // A critical alert on the payment gateway application, raised the way monitoring would.
  const evId = await page.evaluate(() => { const ci = DB.ci.find(c => c.name === 'pgw-app'); const e = seedEvent({ ci: ci.id, service: 'Payments Gateway', sev: 'Critical', message: 'Error rate above 5%', source: 'Application performance', count: 12 }); save(); return e.id; });
  await nav('events');
  const row = page.locator(`#main [data-open="${evId}"]`).first();
  check('Alert is listed in Event monitoring', await row.count(), evId);
  await row.click(); await W(250);
  await page.click('#drawer [data-evact="raise"]'); await W(250);
  const form = await page.evaluate(() => ({ type: $('#createForm').dataset.type, service: $('#f-service').value, title: $('#f-title').value, impact: $('#f-impact').value, urgency: $('#f-urgency').value, desc: $('#f-desc').value }));
  check('Incident form is pre-filled from the alert (service, CI, P1, details)', form.type === 'INC' && form.service === 'Payments Gateway' && /pgw-app/.test(form.title) && form.impact === '1' && form.urgency === '1' && /Critical/.test(form.desc) && /pgw-app/.test(form.desc), form);
  await shot('1-alert-prefill');
  await page.click('#createForm button[type=submit]'); await W(300);
  const incId = await did();
  const inc = await page.evaluate(id => { const t = get(id); return { prio: t.priority, ci: (get(t.ci) || {}).name, evStatus: t.events && get(t.events[0]).status }; }, incId);
  check('Incident is P1 and linked to the alert and its CI', inc.prio === 'P1' && inc.ci === 'pgw-app' && inc.evStatus === 'Incident raised', inc);

  // Problem from the incident, through root cause to known error.
  await page.click('#drawer [data-act="raisePRB"]'); await W(250);
  await page.click('#createForm button[type=submit]'); await W(300);
  const prbId = await did();
  await primary(); await W(200);                                                              // Investigating
  await page.selectOption('#rcSel', 'Configuration error'); await primary(); await W(200);    // Root cause found
  await page.fill('#waText', 'Route payments via the secondary gateway'); await primary(); await W(300); // Known error
  await nav('problems');
  await page.click('[data-ptab="kedb"]'); await W(250);
  const keRow = page.locator(`#kedb tr[data-open="${prbId}"]`);
  const keText = (await keRow.innerText().catch(() => '')).replace(/\s+/g, ' ');
  check('Known error appears in the KEDB at once, marked New', await keRow.count() && /\bnew\b/i.test(keText), keText);
  await shot('2-kedb');
  await page.evaluate(() => { seedInc({ service: 'Payments Gateway', title: 'Error rate above 5% on pgw-app', status: 'New' }); save(); });
  await nav('desk');
  const badge = await page.locator('#main .kebadge').first().innerText().catch(() => '');
  check('The next matching incident shows exactly one known error badge', /^1 matching known error workaround found$/i.test(badge.trim()), badge);
  await page.evaluate(id => openDetail(id), prbId); await W(200);
  await page.click('#drawer [data-newkb]'); await W(200); await page.click('#kbForm button[type=submit]'); await W(300);
  const kbId = await page.evaluate(id => get(id).kb, prbId);
  check('Knowledge article is created from the known error', !!kbId, kbId);

  // Change for the fix against the same CI: CAB votes, approve, implement.
  await page.evaluate(id => openDetail(id), prbId); await W(200);
  await page.click('#drawer [data-act="raiseCHG"]'); await W(250);
  await page.click('#createForm button[type=submit]'); await W(300);
  const chgId = await did();
  await primary(); await W(200);                                                               // Assessment
  await primary(); await W(200);                                                               // CAB approval
  for (const i of [0, 1, 2]) { await page.click(`#cabBox [data-act="vote:${i}:Approve"]`); await W(120); }
  await page.click('#drawer [data-act="approve"]'); await W(200);                               // Scheduled
  const tagWhenScheduled = await page.evaluate(id => !!ciMaint(get(id).ci), chgId);
  await primary(); await W(250);                                                               // Implementing
  await nav('cmdb');
  await page.click('[data-cmsvc="Payments Gateway"]').catch(() => {}); await W(300);
  const mapTag = await page.locator('.cinode .tag.maint').count(), regTag = await page.locator('td .tag.maint').count();
  check('CI shows a maintenance window only while the change is implementing', !tagWhenScheduled && mapTag && regTag, { chgId, tagWhenScheduled, mapTag, regTag });
  await shot('3-cmdb-maintenance');
  await page.evaluate(id => openDetail(id), chgId); await W(200);
  await page.click('#drawer [data-act="out:Successful"]'); await W(300);
  const after = await page.evaluate(([c, p, i]) => ({ toast: $('#toast').textContent, prb: get(p).status, inc: get(i).status, maint: !!ciMaint(get(c).ci) }), [chgId, prbId, incId]);
  check('A successful fix resolves the problem and ends the maintenance window', after.prb === 'Resolved' && !after.maint && after.toast.includes(prbId), after);
  check('The major incident is left for the major incident manager to close', after.inc !== 'Resolved', after.inc);

  /* ---------- 1b. service catalogue -> request -> asset lifecycle ---------- */
  await nav('catalogue');
  await page.click('[data-reqitem="New laptop"]'); await W(250);
  await page.click('#createForm button[type=submit]'); await W(300);
  const reqId = await did();
  const sub = await page.evaluate(id => { const t = get(id); return { type: t.type, item: t.item, status: t.status, tasks: t.tasks.length, asset: t.asset || null }; }, reqId);
  check('Requesting a laptop from the catalogue creates a request with fulfilment tasks', sub.type === 'REQ' && sub.item === 'New laptop' && sub.status === 'Submitted' && sub.tasks === 3, sub);
  check('No laptop is allocated while the request still needs approval', !sub.asset, sub.asset);
  await primary(); await W(200);                                                               // Send for approval
  await page.click('#drawer [data-act="approve"]'); await W(200);                               // Fulfilment
  await page.click('#drawer [data-act="task:0"]'); await W(250);                                // Allocate a laptop from stock
  const alloc = await page.evaluate(id => { const t = get(id); const a = t.asset && get(t.asset); return a && { tag: a.tag, status: a.status, req: a.req, user: a.user }; }, reqId);
  check('Allocating from stock moves a laptop to Allocated, linked to the request', alloc && alloc.status === 'Allocated' && alloc.req === reqId, alloc);
  await page.click('#drawer [data-act="task:1"]'); await W(200);
  await page.click('#drawer [data-act="task:2"]'); await W(250);                                // Deliver and record the handover
  await primary(); await W(250);                                                               // Fulfilled
  const done = await page.evaluate(id => { const t = get(id); return { status: t.status, asset: get(t.asset).status, log: DB.feed.filter(f => f.m === 'CMDB').slice(-2).map(f => f.x) }; }, reqId);
  check('Handover sets the laptop to In use, the request is fulfilled and the CMDB logs both moves', done.status === 'Fulfilled' && done.asset === 'In use' && done.log.length === 2 && /Allocated/.test(done.log[0]) && /In use/.test(done.log[1]), done);
  await nav('cmdb');
  const assetRow = await page.locator('#main tr', { hasText: alloc ? alloc.tag : '-' }).first().innerText().catch(() => '');
  check('The asset register shows the laptop in use against the request', assetRow.includes(reqId) && /In use/i.test(assetRow), assetRow.replace(/\s+/g, ' '));

  /* ---------- 2. dense tables and SLA bars ---------- */
  // Long values in the CMDB tables stay on one line too.
  await page.evaluate(() => {
    const c = DB.ci.find(c => c.cls === 'Server'); c.location = 'SG1 data centre / Hall B / Row 14 / Rack 07 / U22-U24 / chassis bay 3 (shared with DR test rig)';
    const a = DB.assets[0]; a.location = 'Singapore office / Level 12 / East wing / Hot desk zone C / Locker 1187 (awaiting collection)'; save(); render();
  });
  await W(200);
  const clip = await page.evaluate(() => { const els = [...document.querySelectorAll('#main td .clip')].filter(e => e.textContent.length > 60); return { found: els.length, oneLine: els.every(e => { const cs = getComputedStyle(e); return cs.whiteSpace === 'nowrap' && cs.textOverflow === 'ellipsis' && e.getBoundingClientRect().height <= parseFloat(cs.lineHeight) * 1.5; }), hover: els.every(e => e.title.length > 60) }; });
  check('Long CI and asset locations stay on one line, with the full text on hover', clip.found >= 2 && clip.oneLine && clip.hover, clip);
  await shot('5-cmdb-clipping');
  const longId = await page.evaluate(() => seedInc({ service: 'Client Portal', status: 'New', impact: 1, urgency: 2,
    title: 'Users report HTTP 500 Internal Server Error with stack trace java.lang.NullPointerException at com.meridian.portal.AccountSummaryController.render(AccountSummaryController.java:214) when opening the account summary after the overnight batch' }).id);
  await page.evaluate(() => save());
  await nav('desk');
  const dens = await page.evaluate(id => {
    const t = document.querySelector(`#main tr[data-open="${id}"] .t-title`); const cs = getComputedStyle(t); const wrap = $('#main .tablewrap');
    return { nowrap: cs.whiteSpace === 'nowrap', ellipsis: cs.textOverflow === 'ellipsis', oneLine: t.getBoundingClientRect().height <= parseFloat(cs.lineHeight) * 1.5, fullTextOnHover: t.title.length > 100, overflow: wrap.scrollWidth - wrap.clientWidth };
  }, longId);
  check('A very long summary stays on one line, with the full text on hover', dens.nowrap && dens.ellipsis && dens.oneLine && dens.fullTextOnHover, dens);
  check('The Service Desk table fits a 1360 px window', dens.overflow <= 0, dens.overflow);
  await shot('4-desk-density');
  const p1 = await page.evaluate(() => { const t = DB.items.find(t => t.type === 'INC' && isOpen(t) && t.priority === 'P1' && document.querySelector(`[data-sla="${t.id}"]`)); return t ? { id: t.id, label: document.querySelector(`[data-sla="${t.id}"] .sla`).textContent } : null; });
  await W(2100);
  const p1later = p1 && await page.evaluate(id => document.querySelector(`[data-sla="${id}"] .sla`).textContent, p1.id);
  check('An open P1 has a live SLA countdown that ticks', p1 && p1.label !== p1later, { ...p1, twoSecondsLater: p1later });
  const colours = await page.evaluate(() => { const probe = s => { const b = document.createElement('span'); b.className = 'slabar ' + s; b.innerHTML = '<i></i>'; document.body.appendChild(b); const c = getComputedStyle(b.firstChild).backgroundColor; b.remove(); return c; }; return { ok: probe('ok'), risk: probe('risk'), breached: probe('breached') }; });
  check('SLA bars use different colours for on track, at risk and breached', new Set(Object.values(colours)).size === 3, colours);

  /* ---------- 3. state survives a refresh until Reset demo data ---------- */
  const cabChg = await page.evaluate(() => { const c = DB.items.find(t => t.type === 'CHG' && t.status === 'CAB approval'); openDetail(c.id); return c.id; });
  await page.click('#drawer [data-act="approve"]'); await W(250);
  await nav('improvement');
  await page.click('[data-newcsi]'); await W(250);
  await page.locator('#drawer input[type=text]').first().fill('QA: automate SLA breach paging');
  await page.locator('#drawer form button[type=submit]').click(); await W(300);
  const csiId = await page.evaluate(() => (DB.csi.find(x => x.title === 'QA: automate SLA breach paging') || {}).id);
  check('A new improvement can be logged', !!csiId, csiId);
  const feedBefore = await page.evaluate(() => DB.feed.length);
  await page.reload(); await W(700);
  const kept = await page.evaluate(([c, x, p, l]) => ({ change: get(c) && get(c).status, improvement: !!get(x), problem: get(p) && get(p).status, longIncident: !!get(l), log: DB.feed.length, reopened: !$('#drawer').hidden && $('#drawer').dataset.id }), [cabChg, csiId, prbId, longId]);
  check('After a refresh the approved change, improvement, problem, incidents and log are all kept', kept.change === 'Scheduled' && kept.improvement && kept.problem === 'Resolved' && kept.longIncident && kept.log >= feedBefore, kept);
  check('After a refresh the record that was open is open again', kept.reopened === csiId, kept.reopened);
  await page.keyboard.press('Escape'); await W(150);
  await page.click('#resetBtn'); await page.click('#resetBtn'); await W(500);
  const gone = await page.evaluate(([x, l]) => !get(x) && !get(l), [csiId, longId]);
  await page.reload(); await W(600);
  const stillGone = await page.evaluate(([x, l]) => !get(x) && !get(l), [csiId, longId]);
  check('Reset demo data clears it, and it stays cleared after a refresh', gone && stillGone, { gone, stillGone });
} catch (e) {
  check('Run finished without a script error', false, String(e).split('\n')[0]);
}

check('No page errors', !errors.length, errors);
await browser.close();
const failed = R.filter(r => !r.ok);
for (const r of R) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '\n      ' + JSON.stringify(r.detail)}`);
console.log(failed.length ? `${failed.length} of ${R.length} checks failed` : `all ${R.length} checks passed`);
process.exit(failed.length ? 1 : 0);
