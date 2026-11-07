// Runs every guided walkthrough end to end with "Do it for me", in a headless browser.
// Usage: npm test            (all walkthroughs)
//        npm test -- swarm   (one walkthrough by id)
// Fails if a walkthrough does not finish, a step's highlight never appears, or the page throws.
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(join(root, process.env.PAGE || 'index.html')).href;
// Steps whose highlight is legitimately absent (the button disappears once the step is already done).
const NO_TARGET_OK = new Set(['mi:Confirm it is a major incident']);

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const probe = await browser.newPage();
await probe.goto(url + '#walkthroughs');
const all = await probe.evaluate(() => TOURS.map(t => t.id));
await probe.close();
const ids = process.argv.slice(2).length ? process.argv.slice(2) : all;

let failed = 0;
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.goto(url + '#walkthroughs');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.reload();
  await page.click(`[data-tourstart="${id}"]`);
  await page.waitForTimeout(400);
  const steps = []; let finished = false;
  for (let i = 0; i < 120 && !finished; i++) {
    const state = await page.evaluate(() => {
      if (!TOUR) return { gone: true };
      if (TOUR.finished) return { finished: true };
      return { i: TOUR.i, title: TOUR.def.steps[TOUR.i].t, ring: !document.getElementById('tourRing').hidden };
    });
    if (state.finished) { finished = true; break; }
    if (state.gone) break;
    const last = steps[steps.length - 1];
    if (!last || last.i !== state.i) steps.push({ i: state.i, title: state.title, ring: state.ring });
    else if (state.ring) last.ring = true;
    const next = page.locator('#coach [data-tour=next]');
    const show = page.locator('#coach [data-tour=show]');
    if (await next.isEnabled()) { await page.waitForTimeout(120); await next.click(); }
    else if (await show.count()) { await show.click(); }
    await page.waitForTimeout(300);
  }
  const noRing = steps.filter(s => !s.ring && !NO_TARGET_OK.has(`${id}:${s.title}`)).map(s => s.title);
  const ok = finished && !noRing.length && !errors.length;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id.padEnd(10)} ${steps.length} steps${finished ? '' : ' (did not finish)'}${noRing.length ? ' | no highlight: ' + noRing.join('; ') : ''}${errors.length ? ' | errors: ' + errors.join('; ') : ''}`);
  await page.close();
}
await browser.close();
console.log(failed ? `${failed} walkthrough(s) failed` : `all ${ids.length} walkthroughs passed`);
process.exit(failed ? 1 : 0);
