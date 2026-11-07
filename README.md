# Meridian Service Desk: ITSM demo

**Live demo: https://jkullappagari.github.io/ITSM-demo/**

An interactive demonstration of IT service management (ITSM) as it should work. It shows how incidents, problems, changes, requests, releases, knowledge, configuration and improvement fit together, how management reports come out of that work, and lets anyone practise real scenarios through guided walkthroughs.

Everything runs in the browser. There is no server and no database: sample data is generated relative to today, and anything a viewer changes is kept in that viewer's browser only. **Reset demo data** in the sidebar starts clean. Refreshing the page keeps your records, the record you had open and any walkthrough in progress.

## What is in it

| Area | What it demonstrates |
| --- | --- |
| Service Desk | Log and work incidents, major incidents, problems, changes, requests and releases. Impact × urgency priority, **live SLA countdowns** with a progress bar that turns amber at risk and red on breach, lifecycle steppers, linked records, replies to the caller, reassignment and escalation. **Known error lookup**: matching workarounds appear as you log an incident, and any open incident can search the KEDB and apply one |
| Walkthroughs | 17 guided scenarios. A coach panel explains each step, highlights where to click and moves on once the step is done. Each scenario has a **step checklist** that ticks itself off as you work, in the coach panel and on its card |
| Service catalogue | Requestable items with targets, approval rules and fulfilment tasks |
| Problems & KEDB | Problem register, known error database, and trend detection that suggests problems from repeat incidents |
| Changes & releases | Standard, normal and emergency paths compared. Standard changes are scheduled as soon as they are raised; normal changes get a **risk assessment** questionnaire and **CAB votes** before the decision. The CAB agenda, a 14-day change calendar and the release pipeline |
| Knowledge base | Self-help, runbooks and known errors in the KCS structure (issue, environment, resolution, cause) with a review step before publishing |
| Event monitoring | Alerts with de-duplication, acknowledge or clear, and raising an incident from an event |
| CMDB & assets | Service dependency map with **failure simulation**, configuration item register, laptop asset register (In stock → Allocated → In use), hardware stock and licence compliance. Each configuration item shows its **incident and change history** |
| Improvement register | Continual improvement: value against effort, a lifecycle from idea to measured benefit, links back to post-incident reviews |
| Processes | 17 practices with their stages, KPIs and how they connect |
| Management reports | 16 report tabs, including **cost of downtime** with live counters, service levels, satisfaction, suppliers, continuity and improvement |
| Activity log | A **live system log** along the bottom of the screen. Every action prints a timestamped line (`[14:32:10] CHANGE: CHG0007880 status changed to Implementing`), alongside background activity such as health checks, backups and discovery scans. Click it to see the history and open any record from it |

### How the modules affect each other

Actions in one module carry through to the others, the way they would in a real service desk:

| You do this | And this follows |
| --- | --- |
| A normal or emergency change **fails or is backed out** | A critical alert in Event monitoring and three incidents on the same service, linked to the change. The change counts as having caused incidents in the change report |
| A **high-risk** change is implemented successfully | A latency warning appears on the configuration item and clears on its own a minute later if the service settles |
| A change raised to fix a problem is implemented successfully | The problem is resolved, its known error is marked fixed, and the incidents still open against it are resolved |
| A problem reaches **Known error** | It appears at once in the known error database, marked **New**, and is offered to the desk as people log matching incidents |
| An open incident nears or passes its SLA | The activity log reports it as at risk, then breached |

### Walkthroughs

| Group | Walkthrough |
| --- | --- |
| Service desk | Major incident from alert to review · Payment gateway down: swarming · Event triage · SLA rescue · Unhappy customer · Self-service |
| Requests and knowledge | New starter with approval and tasks · Knowledge article from a client reply · Laptop lifecycle from request to desk |
| Problem, change and release | Problem to known error to fix · Normal change through CAB · Standard vs normal change · Standard change · Release with early life support · Capacity warning |
| Management | Monthly service review · Log, prioritise and deliver an improvement |

## Running it

Open `index.html` in a browser, or serve the folder:

```bash
npm start            # serves on http://localhost:5173
```

## Project layout

```
index.html                 page shell: navigation, drawer, coach panel, script order
css/styles.css             design tokens (light and dark) and all styles
js/core.js                 helpers, storage, state, SLA and formatting
js/reference.js            record types, lifecycles, services, catalogue, suppliers
js/data.js                 seeded sample data generator
js/charts.js               SVG charts, bars, tiles, sparklines
js/router.js               hash routing (#desk, #changes, #dashboard-costs, ...)
js/views/*.js              one file per screen, plus costs.js (cost model) and dashboard.js (reports)
js/records.js              record drawer: create forms, detail view, lifecycle actions
js/records-extras.js       request tasks, replies, assignment, KCS knowledge form, swarming
js/records-depth.js        known error lookup, change risk assessment, CAB votes, CI incident history
js/simulation.js           activity log, ripple effects between modules, live SLA countdowns, step checklists
js/walkthroughs/engine.js  coach panel, highlight ring, auto-advance, "Do it for me"
js/walkthroughs/tours*.js  the scenarios
scripts/build.mjs          bundles everything into dist/index.html
scripts/check.mjs          syntax check and render smoke test of every view
tests/walkthroughs.mjs     runs every walkthrough end to end in a headless browser
.github/workflows/pages.yml  builds and deploys to GitHub Pages on every push to main
```

The scripts are plain JavaScript loaded in order and share one global scope, so there is no build step to develop. The order in `index.html` matters only for code that runs at load time.

## Testing

```bash
npm install          # installs Playwright
npm run check        # syntax plus every view and report tab
npm test             # every walkthrough, start to finish
npm test -- swarm    # one walkthrough by id
```

## Publishing

```bash
npm run build        # writes dist/index.html, one self-contained file
```

The live site is deployed to GitHub Pages by `.github/workflows/pages.yml`. Every push to `main` runs the build and publishes `dist/` to https://jkullappagari.github.io/ITSM-demo/. To redeploy without a code change, run the workflow from the repository's **Actions** tab.

`dist/index.html` also works on any other static host: Netlify Drop, Cloudflare Pages, an IIS site or SharePoint. Or host the folder as it is, since it is static files only.

## Adding a walkthrough

Add an object to `TOURS` in `js/walkthroughs/tours-extra.js` and its id to a group in `TOUR_GROUPS`:

```js
{id:'myscenario', short:'Short name', title:'Full title', role:'Who does this', mins:4,
 modules:['Incident','Knowledge'], story:'One or two sentences for the card.',
 setup(c){ /* optional: seed records, store ids on c */ },
 steps:[
  {t:'Step title', b:'What to do, in HTML', why:'Optional: why it matters',
   enter:c=>goView('desk'),                 // optional: navigate or open something
   rec:'inc',                               // optional: the record that must be open (c.inc)
   target:'#drawer [data-act="escalate"]',  // CSS selector or function returning one
   done:c=>!!get(c.inc).escalated,          // step completes when this is true
   show:c=>{openRec(c.inc);clickSel('#drawer [data-act="escalate"]')}}, // "Do it for me"
  {t:'Read-only step', info:true, b:'...', target:'#rep-cost'}
 ]}
```

Then run `npm test -- myscenario`.

## Sources

The practice steps follow ITIL 4 guidance and the Consortium for Service Innovation's KCS (Knowledge-Centered Service) practices. Companies, people, suppliers, cost rates and figures in the sample data are fictional.

## Licence

MIT
