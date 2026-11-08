# Meridian Service Desk: audio guide

## Welcome

Welcome to this audio guide to the Meridian Service Desk. Meridian is a demonstration of I.T. service management, the way it should work in a real organisation. It shows how incidents, problems, changes, requests, releases, knowledge, configuration and improvement fit together, and how management reports come out of that everyday work. It also covers two situations many organisations face today: running software as a service for external clients, and governing AI agents.

This guide takes about half an hour. You do not need the screen in front of you. The idea is that you listen first, so that when you open the tool later, nothing comes as a surprise and you know where to look.

The guide has fourteen parts. First, the layout of the screen. Then the Service Desk, the walkthroughs, the service catalogue, problems and the known error database, changes and releases, the knowledge base, event monitoring, the configuration database and assets, the client platform, AI governance, and improvement, processes and reports. It finishes with how the modules affect each other, and some tips for your first visit.

## The layout, and how to get there

The tool is a website. You will find it at j k u l l a p p a g a r i dot github dot i o, forward slash, I T S M dash demo. It runs entirely in your browser. There is no server and no login. The sample data is generated fresh, relative to today, so dates and timers always look current.

Down the left side of the screen is the sidebar. From top to bottom it lists: Service Desk, Walkthroughs, Service catalogue, Problems and K E D B, Changes and releases, Knowledge base, Event monitoring, C M D B and assets, Client platform, AI governance, Improvement register, Processes, and Management reports.

Some sidebar entries carry small live counts. Service Desk shows how many priority one and priority two incidents are open. Changes shows how many are waiting for the change advisory board. Event monitoring shows open alerts. Client platform shows clients held up by a failed upgrade test, and AI governance shows agents that need attention. When a count goes up, the badge briefly pulses, so your eye is drawn to it.

At the bottom of the sidebar is a button called Reset demo data. Anything you do in the tool is saved in your own browser only. Nobody else sees it. Refreshing the page keeps your records, the record you had open, and any walkthrough you were part way through. When you want a clean start, press Reset demo data, then press it again to confirm.

Along the bottom of the screen runs the activity log. It looks like a system console. Every action prints a line with the time, the module and what happened. For example: Change, C H G zero zero zero seven eight eight zero, status changed to Implementing. You will also see background activity, such as health checks, backups and discovery scans, so the system feels alive. Click the log to open its full history. Every record mentioned there can be opened with one click.

Most records open in a panel that slides in from the right. We call this the drawer. It holds the record's details, its lifecycle, linked records, notes, and the action buttons for the next step.

## The Service Desk

The Service Desk is the main working screen. It is a queue of tickets: incidents, major incidents, problems, changes, service requests and releases, each with a reference number such as I N C, P R B, C H G, R E Q or R E L.

You can filter the queue and log new records. When you log an incident, you choose the service, then the impact and urgency, each from one to three. The tool calculates the priority from those two, from P one, the most urgent, down to P four. This matrix is exactly how real service desks set priority.

Each open ticket has a live S L A countdown. S L A means service level agreement: the time the desk has promised to resolve the ticket. The countdown shows as a small progress bar that ticks every second. It is green while things are fine, turns amber when the ticket is at risk, and red when the target is breached. The activity log also announces when a ticket goes at risk and when it breaches.

Open a ticket and you will see a lifecycle stepper across the top. For an incident that reads: New, Assigned, In progress, Resolved, Closed. The main button always offers the sensible next step. You can also reply to the caller, add work notes, reassign the ticket to another support group, escalate it, or link it to other records.

Two features help the analyst work faster. First, the known error lookup. As you type an incident's description, the tool checks the known error database. If a matching known problem already has a workaround, a hint appears, and you can apply that workaround to the incident with one click. Second, on the queue itself, an open incident that matches a published known error shows a badge, such as: two matching known error workarounds found.

For a major incident, the tool supports swarming. Instead of passing the ticket from team to team, several teams are pulled in at once, and their findings collect on the one record.

## Walkthroughs

Walkthroughs are guided scenarios. They are the best way to learn the tool. There are twenty-one of them, in six groups.

Service desk: a major incident from alert to review; payment gateway down, handled by swarming; event triage; S L A rescue; an unhappy customer; and self-service.

Requests and knowledge: a new starter with approval and tasks; a knowledge article created from a reply to a client; and a laptop's lifecycle from request to desk.

Problem, change and release: problem to known error to fix; a normal change through the change advisory board; standard versus normal change; a standard change; a release with early life support; and a capacity warning.

Management: the monthly service review; and logging, prioritising and delivering an improvement.

Client platform: a quarterly platform upgrade across six clients; and a client change request, where you decide between a configuration change and a custom workflow.

AI governance: approving a new AI agent, from proposal to live; and an AI agent that misbehaves, handled with the kill switch, a roll back and a fix through change.

When you start one, a coach panel appears. It explains each step, highlights where to click with a ring on the screen, and tells you why the step matters. Once you do the step, it moves on by itself. If you get stuck, press Do it for me and it does the step for you while you watch.

Each scenario has a checklist that ticks itself off as you go, both in the coach panel and on the scenario's card. So you can see which scenarios you have finished and which ones you only part completed. If you refresh the page in the middle of a walkthrough, it picks up where you left off.

## Service catalogue

The service catalogue is the shop window of I.T. It lists the things people can ask for. Password reset, access request, software install, shared mailbox, V P N token, a report or data extract, a new laptop, and new starter onboarding.

Each item shows its target time, whether it needs approval, and the fulfilment tasks behind it. When you request an item, a service request is raised with those tasks attached.

The new laptop request is a good example of the modules working together. When the request is raised, nothing leaves stock yet, because the manager has not approved it. After approval, the first fulfilment task is to allocate a laptop from stock. Completing that task moves a real laptop in the asset register from In stock to Allocated, against that request. When the laptop is handed over, it moves to In use, under the person's name. Both moves appear in the activity log.

## Problems and the known error database

An incident is about getting one person or one service working again. A problem is about finding and removing the underlying cause, so it does not happen again.

The Problems page has the problem register, the known error database, and trend detection. Trend detection looks for repeat incidents, the same symptom on the same service, and suggests raising a problem when it sees a pattern.

A problem has a lifecycle: Logged, Investigating, Root cause found, Known error, Resolved and Closed. When you record the root cause, you pick a category, such as a configuration error. When you record a workaround, the problem becomes a known error.

The known error database, or K E D B, is the list of known errors and their workarounds. A new entry appears there at once, marked New. From then on, the Service Desk offers it to analysts as they log matching incidents. You can also turn a known error into a knowledge article with one click.

From a problem you can raise a change to fix the cause for good. When that change is implemented successfully, the problem resolves itself, its known error is marked as fixed, and any incidents still open against it are resolved too.

## Changes and releases

A change is any planned modification to a live service. The tool shows the three types side by side.

A standard change is pre-approved, low risk and routine, like a server patch that follows a tested procedure. It is scheduled as soon as it is raised. No meeting is needed.

A normal change needs assessment and approval. It goes through a risk assessment questionnaire: for example, whether it changes a tier one service, whether there is test evidence, whether the back-out plan is untested, and whether another change is planned on the same service within a day. Your answers can raise the risk level, but never lower it below what the change already had. Then it goes to the change advisory board, known as the CAB. Each board member casts a vote, to approve or reject, and the tool keeps the tally before the decision.

An emergency change is needed now, to restore or protect a service, such as a fix during a major incident or an urgent security patch. It is approved quickly by the emergency CAB, and reviewed afterwards.

The lifecycle for a normal change is: Draft, Assessment, CAB approval, Scheduled, Implementing, Review and Closed. When implementation ends, you record the outcome: successful, failed or backed out.

The Changes page also shows the CAB agenda, a fourteen day change calendar so you can spot clashes, and the release pipeline. A release bundles changes and moves them into live service, through planning, build, test and deploy, followed by a period of early life support, when the project team stays close in case anything goes wrong.

## Knowledge base

The knowledge base holds self-help articles for users, runbooks for support staff, and known errors. Articles follow the K C S structure. K C S stands for knowledge centred service. Each article has four parts: the issue, the environment it applies to, the resolution, and the cause.

New articles go through a review step before they are published. Articles can be created from a known error, or from a reply an analyst sent to a client, so that a good answer written once can be reused many times.

## Event monitoring

Event monitoring is where alerts from monitoring tools arrive. Each alert has a severity, the configuration item it came from, the service, a message, and a count.

The tool de-duplicates alerts. If the same alert fires twelve times, you see one alert with a count of twelve, not twelve separate rows. You can acknowledge an alert, clear it, or raise an incident from it.

When you raise an incident from an alert, the form fills itself in. The service, the configuration item, the priority based on the severity, the message, the number of occurrences and the time it was first seen. The alert and the incident are then linked, both ways.

Every so often, a background baseline check fails and a warning appears here, with the sidebar badge glowing. These clear on their own after a while. They are paused while you are in a walkthrough, so they do not distract you.

## C M D B and assets

C M D B stands for configuration management database. It records the things that make up a service, such as servers, databases and network links, called configuration items, and how they depend on each other.

The first view is a service dependency map. Pick a service, such as Payments Gateway, and you see its configuration items and how they connect. You can run a failure simulation: switch off one item and see which services would be affected. This shows why knowing your dependencies matters.

There is also the configuration item register, a table of all the items with their location, supplier and status. Open any item to see its incident and change history: what has gone wrong with it, and what has been changed on it.

While a change is being implemented on an item, that item shows a tag reading Maintenance window active. It appears on the map, in the register and on the item's own record. It clears when the change is complete. This tells anyone looking at an alert on that item that work is in progress.

The assets side covers the laptop register, where laptops move from In stock, to Allocated, to In use. It also covers hardware stock levels and software licence compliance: how many licences you own against how many are installed.

## The client platform

So far, everything has been about an I.T. department serving its own staff. The Client platform page shows a different situation: a company that runs software as a service for external clients.

In the demo, Meridian runs a platform called Meridian Flow, for reconciliation and data automation. It has six client firms, all fictional, such as Harbourline Bank, Northgate Securities and Pinecrest Fund Services. Each client has a contract plan, either Standard, Premium or Enterprise, which sets its service levels. Each client runs a version of the platform, has its own production window, such as Saturday night, and has a configuration register listing its matching rules, reports and any custom workflows built just for it.

The first scenario is the regular upgrade. Every quarter there is a new version, and every client has to take it. So one release becomes six small rollouts. For each client, the stages are: Notified, Test environment upgraded, Client testing, Signed off, and Production upgraded. The rules are strict. Production is upgraded only after the client signs off, and only in that client's own window.

Client testing is where problems show up. Standard configuration is covered by Meridian's own regression tests, but custom workflows are not. In the demo, Pinecrest has a custom script that fails on the new version. Pinecrest cannot sign off until it is fixed, so you raise the fix as a client change, apply it, and then Pinecrest signs off.

A client can also ask to defer. There is a version support policy: clients must stay within two versions of the current release. In the demo, Solent Pensions Trust is already too far behind, so if it defers again, it stays out of support, and the tool records that the client accepted that risk in writing.

The second scenario is client change requests. Triage decides between two paths. A configuration change uses a setting the platform already supports, such as a new matching rule or a report schedule. It is pre-approved, included in the subscription, and scheduled straight away. A custom workflow change is new behaviour built for one client. It is a normal change with extra client steps before it reaches CAB: estimate the effort and send a quote, the client accepts the quote, build and test it in the client's test environment, and the client signs off. The tool will not let it go to CAB until all four are done.

When a client change is implemented, it is added to that client's configuration register. Custom workflows are marked to be re-tested at every upgrade. That is how the next quarterly upgrade knows what to check.

## AI governance

The AI governance page answers a question many organisations now face: if we build AI agents, how do we manage and govern them? The answer in this tool is that there is no new process. An AI agent is treated like any other configuration item, and the existing practices apply to it.

The page starts with the AI agent register. For every agent, it records the business owner, what the agent does, how much it can do on its own, its risk tier, its model, and the version in use. There are three levels of autonomy: suggest only, where a person decides; act with human approval, where a person approves each action; and act within limits, where the agent acts on its own inside hard limits. The register also shows how each live agent is doing: the quality of its work from sampled checks, how often people override it, and how often its guardrails had to block it.

Agents follow a lifecycle: Proposed, Risk assessed, Approved, Live, and Retired. When an agent is proposed, a short questionnaire sets its risk tier. For example: can it move money, do its decisions affect people directly, does it act without a person approving, does it read personal data, and do clients or the public talk to it. The answers give a tier of minimal, limited or high. Some uses are prohibited outright. The tiers follow the shape of the European Union's A I Act, the U S N I S T framework for A I risk, and the I S O standard for A I management, simplified for a demonstration.

Before approval, ten governance controls must be in place. These include a named owner, a data protection assessment, defined human oversight, action limits, a tested kill switch, monitoring, change control for the model and prompt, telling people when they are dealing with A I, an evaluation test set, and a review date. Once the governance board approves, going live is itself a change, with a change record approved at CAB.

Two ideas matter most. First, every version of an agent, every new prompt or model, should be deployed under a change record, and the register flags any version that was not. Second, every agent has a kill switch. If it misbehaves, you suspend it at once, and the work falls back to people.

In the demo, the password reset agent shows both. Its latest version was deployed without a change record, and it lost a safety check. The guardrails block it from resetting administrator accounts, and a critical alert appears in event monitoring. You suspend it, raise an incident, roll it back to the last approved version, resume it, and put the improved version through change properly.

## Improvement, processes and reports

The improvement register supports continual improvement. Each idea is rated for value against effort, so you can see the quick wins. Improvements move through the stages Idea, Assessed, Approved, In progress and Done, ending with a measured benefit. They can link back to the post-incident review that prompted them.

The Processes page describes seventeen I.T. service management practices, such as incident, problem, change, release and knowledge management. For each one it shows its stages, its key performance indicators, and how it connects to the others. Point at a stage and the tool shows who owns it, and which live records are at that stage right now. It also highlights the other stages owned by the same role.

Management reports has sixteen tabs. Overview, incident, major incident, problem, change, release, request, service level, cost of downtime, satisfaction, knowledge, event, configuration and assets, supplier, continuity and capacity, and improvement. All of them are calculated from the records in the tool, so the work you do shows up in the reports.

The cost of downtime tab is worth a look. It puts a money value on outages, with live counters that run while services are down.

## How the modules affect each other

The most important idea in this tool is that actions in one module carry through to the others, just as they would in a real service desk. Here are the main links.

If a normal or emergency change fails, or is backed out, a critical alert appears in Event monitoring, and three incidents are raised on the same service, linked to the change. The change report then counts it as a change that caused incidents.

If a high-risk change succeeds, a latency warning appears on its configuration item, and clears on its own a minute later as the service settles.

If a change raised to fix a problem succeeds, the problem is resolved, its known error is marked fixed, and the open incidents against it are resolved.

If a problem reaches Known error, it appears at once in the known error database and is offered to the desk on matching incidents.

If a change moves to Implementing, its configuration item shows Maintenance window active until the change is complete.

If you raise an incident from an alert, the form is filled in from the alert.

If a new laptop is requested and approved, the fulfilment task allocates a real laptop from stock, and the handover marks it as in use.

If a client's custom workflow fails during upgrade testing, that client cannot sign off until a client change fixes it. And when any client change is implemented, it is added to the client's configuration register for the next upgrade.

Finally, if an AI agent's guardrails block an action, a critical alert appears in event monitoring with the agent as the configuration item. A successful change on an agent records a new version under that change, and a suspended agent can only be resumed on a version that went through change.

## Tips for your first visit

Here is a suggested route for your first time with the tool.

Start with the walkthrough called Major incident from alert to review. It touches event monitoring, the service desk, problems and reports, and gives you a feel for everything in about five minutes.

Next, try Problem to known error to fix, and then Normal change through CAB. Together they show the full cycle: from an incident, to the root cause, to a permanent fix that resolves the problem.

Then try Laptop lifecycle from request to desk, to see the catalogue, approvals and the asset register working together.

If you work with external clients, try Quarterly platform upgrade. And if your organisation is building AI agents, try An AI agent misbehaves. It shows in about six minutes why a kill switch and change control matter.

After that, explore on your own. Keep an eye on the activity log at the bottom, and on the sidebar badges, to see the ripple effects as you work. Open Management reports at the end to see how your actions appear in the numbers.

And remember: nothing you do can break anything. Everything stays in your own browser, and Reset demo data always gives you a clean start.

That is the end of this guide. Enjoy exploring Meridian.
