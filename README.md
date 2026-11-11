# Meridian Service Desk: ITSM demo

**Live demo: https://jkullappagari.github.io/ITSM-demo/**

**Audio guide: https://jkullappagari.github.io/ITSM-demo/audio.html**: a 27-minute spoken tour of every screen, narrated with the open-weight Kokoro text-to-speech model, to listen to before you open the tool. The page has a chapter list and a speed control; the MP3 on its own is at https://jkullappagari.github.io/ITSM-demo/meridian-audio-guide.mp3. The chapter times are in [audio-guide/chapters.md](audio-guide/chapters.md) and the narration text is in [audio-guide/script.md](audio-guide/script.md).

An interactive demonstration of IT service management (ITSM) as it should work. It shows how incidents, problems, changes, requests, releases, knowledge, configuration and improvement fit together, how management reports come out of that work, and lets anyone practise real scenarios through guided walkthroughs.

Everything runs in the browser. There is no server and no database: sample data is generated relative to today, and anything a viewer changes is kept in that viewer's browser only. **Reset demo data** in the sidebar starts clean. Refreshing the page keeps your records, the record you had open and any walkthrough in progress.

## What is in it

| Area | What it demonstrates |
| --- | --- |
| Service Desk | Log and work incidents, major incidents, problems, changes, requests and releases. Impact × urgency priority, **live SLA countdowns** with a progress bar that turns amber at risk and red on breach, lifecycle steppers, linked records, replies to the caller, reassignment and escalation. **Known error lookup**: matching workarounds appear as you log an incident, and any open incident can search the KEDB and apply one |
| Walkthroughs | 21 guided scenarios. A coach panel explains each step, highlights where to click and moves on once the step is done. Each scenario has a **step checklist** that ticks itself off as you work, in the coach panel and on its card |
| Service catalogue | Requestable items with targets, approval rules and fulfilment tasks |
| Problems & KEDB | Problem register, known error database, and trend detection that suggests problems from repeat incidents |
| Changes & releases | Standard, normal and emergency paths compared. Standard changes are scheduled as soon as they are raised; normal changes get a **risk assessment** questionnaire and **CAB votes** before the decision. The CAB agenda, a 14-day change calendar and the release pipeline |
| Knowledge base | Self-help, runbooks and known errors in the KCS structure (issue, environment, resolution, cause) with a review step before publishing |
| Event monitoring | Alerts with de-duplication, acknowledge or clear, and raising an incident from an event |
| CMDB & assets | Service dependency map with **failure simulation**, configuration item register, laptop asset register (In stock → Allocated → In use), hardware stock and licence compliance. Each configuration item shows its **incident and change history** |
| Client platform | Software as a service for external clients. Meridian runs a fictional platform, *Meridian Flow*, for six fictional client firms, each with a contract tier, a version and a configuration register. A **quarterly upgrade** rolls out client by client: test environment, client testing, sign-off, then production in the client's own window. It includes regressions in custom workflows, deferrals and a version support policy. **Client change requests** are either pre-approved configuration changes or quoted custom workflow changes that need the client's sign-off before CAB |
| AI governance | An **AI agent register** records the owner, autonomy, risk tier, model and version of every agent. A risk questionnaire sets the tier, ten governance controls gate approval, and going live needs a change record. A **kill switch** suspends an agent, and every model or prompt version is tied to its change record |
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
| An open incident matches a published known error | Its Service Desk row shows a badge such as **2 matching known error workarounds found** |
| A change moves to **Implementing** | Its configuration item shows **Maintenance window active** on the service map, in the CI register and on the CI record until the change is complete |
| You raise an incident from an alert | The form is filled in from the alert: service, configuration item, severity as priority, message, occurrences and first-seen time |
| A background baseline check fails (every so often, paused during walkthroughs) | A warning appears in Event monitoring and its sidebar badge glows |
| A client starts testing an upgrade and one of its custom workflows fails on the new version | A regression shows on the rollout, and the client cannot sign off until a fix, raised as a client change, is implemented |
| A client change is implemented | It is added to the client's configuration register. Custom workflows are marked for re-testing at every upgrade |
| A client is upgraded in production | Its version and support status change on the client platform page and the client record |
| An AI agent's guardrails block an action | A critical alert appears in Event monitoring, with the agent as the configuration item |
| A change to a live AI agent is implemented successfully | A new agent version is recorded under that change. Versions deployed without a change record are flagged on the register |
| An AI agent is suspended with its kill switch | It can be resumed only on a version that has a change record |

The sidebar shows live counts for open P1/P2 incidents, changes awaiting CAB and open alerts. On the **Processes** page, pointing at a stage shows who owns it and which records are at that stage now, and highlights the other stages owned by the same role.

### Walkthroughs

| Group | Walkthrough |
| --- | --- |
| Service desk | Major incident from alert to review · Payment gateway down: swarming · Event triage · SLA rescue · Unhappy customer · Self-service |
| Requests and knowledge | New starter with approval and tasks · Knowledge article from a client reply · Laptop lifecycle from request to desk |
| Problem, change and release | Problem to known error to fix · Normal change through CAB · Standard vs normal change · Standard change · Release with early life support · Capacity warning |
| Management | Monthly service review · Log, prioritise and deliver an improvement |
| Client platform (SaaS) | Quarterly platform upgrade across six clients · Client change request: configuration or custom workflow? |
| AI governance | Approve a new AI agent: from proposal to live · An AI agent misbehaves: kill switch, roll back, fix through change |

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
js/views/platform.js       client platform: clients, quarterly upgrade rollout, client change requests
js/views/ai.js             AI governance: agent register, risk tiers, controls, kill switch, versions
js/records.js              record drawer: create forms, detail view, lifecycle actions
js/records-extras.js       request tasks, replies, assignment, KCS knowledge form, swarming
js/records-depth.js        known error lookup, change risk assessment, CAB votes, CI incident history
js/simulation.js           activity log, ripple effects between modules, live SLA countdowns, step checklists
js/sim-extras.js           maintenance windows, sidebar badges, background alerts, process stage hover
js/walkthroughs/engine.js  coach panel, highlight ring, auto-advance, "Do it for me"
js/walkthroughs/tours*.js  the scenarios
scripts/build.mjs          bundles everything into dist/index.html and copies the audio guide next to it
audio-guide/               spoken guide (MP3), its player page (published as audio.html), narration script and chapter times
scripts/check.mjs          syntax check and render smoke test of every view
tests/walkthroughs.mjs     runs every walkthrough end to end in a headless browser
tests/happy-path.mjs       end-to-end QA pass across modules, refresh and reset
.github/workflows/pages.yml  builds and deploys to GitHub Pages on every push to main
```

The scripts are plain JavaScript loaded in order and share one global scope, so there is no build step to develop. The order in `index.html` matters only for code that runs at load time.

## Testing

```bash
npm install          # installs Playwright
npm run check        # syntax plus every view and report tab
npm test             # every walkthrough, start to finish
npm test -- swarm    # one walkthrough by id
npm run test:qa      # end-to-end pass across modules (see below)
```

`npm run test:qa` drives the app through the UI the way a user would and checks the links between modules:

1. A critical alert raises an incident with the form already filled in, and the incident is linked to the alert and its configuration item.
2. A problem raised from that incident reaches **Known error** and appears in the KEDB at once. The next matching call shows exactly one known error badge, and a knowledge article can be created from it.
3. A change for the fix goes through CAB votes. Its configuration item shows **Maintenance window active** only while the change is implementing, and a successful outcome resolves the problem.
4. A laptop requested from the service catalogue is not allocated until approval. The fulfilment task moves a laptop from In stock to **Allocated** against the request, the handover moves it to **In use**, and the asset register and activity log show both moves.
5. A very long incident summary, and long CI and asset locations, stay on one line with the full text on hover. The desk table fits a 1360 px window, and P1 SLA countdowns tick and change colour.
6. Approving a change and logging an improvement survive a refresh, the open record reopens, and **Reset demo data** clears everything.

Run it against the built file with `PAGE=dist/index.html npm run test:qa`, or against a deployed copy with `npm run test:qa -- https://jkullappagari.github.io/ITSM-demo/`. Set `SHOTS=folder` to save screenshots of each stage.

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
