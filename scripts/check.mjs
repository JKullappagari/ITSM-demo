// Syntax-checks every script and smoke-tests every view and report tab in a headless browser.
import { readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
for (const f of walk(join(root, 'js'))) execFileSync(process.execPath, ['--check', f]);
console.log('syntax ok');

const VIEWS = ['desk', 'walkthroughs', 'catalogue', 'problems', 'changes', 'knowledge', 'events', 'cmdb', 'improvement', 'processes', 'platform', 'ai'];
const TABS = ['overview', 'incident', 'major', 'problem', 'change', 'release', 'request', 'service', 'costs', 'csat', 'knowledge', 'event', 'config', 'supplier', 'continuity', 'improvement'];
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.route('**/fonts.googleapis.com/**', r => r.abort());
await page.goto(pathToFileURL(join(root, process.argv[2] || 'index.html')).href + '#desk');
for (const v of VIEWS) { await page.evaluate(h => { location.hash = h; }, v); await page.waitForTimeout(150); }
for (const t of TABS) { await page.evaluate(h => { location.hash = h; }, 'dashboard-' + t); await page.waitForTimeout(150); }
// open one record of each kind in the drawer
await page.evaluate(() => { for (const id of [DB.items[0].id, DB.ci[0].id, DB.kb[0].id, DB.events[0].id, DB.assets[0].id, DB.csi[0].id, DB.clients[0].id, ...DB.agents.map(a => a.id), DB.items.find(t => t.platform).id, ...DB.items.filter(t => t.client).map(t => t.id)]) openDetail(id); });
await browser.close();
if (errors.length) { console.error('page errors:\n' + errors.join('\n')); process.exit(1); }
console.log(`${VIEWS.length} views and ${TABS.length} report tabs rendered with no errors`);
