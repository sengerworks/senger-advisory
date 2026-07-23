# Senger Advisory Website

Static site for Senger Advisory.

## Local preview
Open `index.html` in a browser.

## Flow Engine
`flow-engine.js` provides the reusable canvas visualization used by the homepage hero. Add
`data-flow-engine` to a canvas inside a sized container, then load `flow-engine.js`. Each
matching canvas is initialized automatically. The constructor is also available as
`window.SengerFlowEngine` for product experiences that need custom particle counts or seeds.

The engine models work as routed particles moving through a directed network. Nodes have a
hidden capacity model, independent service rates, priority-aware queues, and observable
throughput and wait time. Demand, utilization, local pressure, and propagated downstream
pressure determine effective capacity; routing responds to those conditions. Use
`getSnapshot()` to read the current model state without coupling other product experiences to
the renderer. The engine pauses outside the viewport, rebuilds at responsive breakpoints,
caps pixel density, and renders a static state when reduced motion is preferred.

The Capacity Lens applies a feathered capacity increase around the pointer. It follows the
cursor on desktop, drifts autonomously on touch devices, and can be repositioned by dragging.
Its influence changes model behavior—not only appearance—by increasing effective capacity,
accelerating work, reducing visible pressure, and helping queues clear. The lens is disabled
when reduced motion is preferred.

The homepage narrative reads live demand and pressure from the engine, progressing from
growth through complexity and friction. Discovering the Capacity Lens resolves the narrative
to the core thesis. Reduced-motion visitors receive that complete thesis immediately, without
timed copy or an interaction prompt.

## Assessment MVP

`assessment.html` and `assessment.js` provide a browser-only assessment across the six
capacity domains. Eighteen responses produce domain scores, a constraint-adjusted directional
Organizational Capacity Index, and a primary constraint signal. No assessment response is
submitted or persisted individually. Results also generate a print/PDF-ready Executive Capacity Report
with a system interpretation, capacity strength, three priority hypotheses, leadership
questions, and an evidence-oriented next step. The calculation and evidence limitations are documented in
`docs/Assessment-Scoring.md`.

Assessment evidence is opt-in. `netlify/functions/assessment-evidence.mjs` validates versioned
lifecycle events, aggregate scores, optional context, accuracy ratings, and written feedback
before storing them in the site-scoped `assessment-evidence` Netlify Blobs store. Individual
question responses and identity fields are not accepted. The data contract and operating
guidance are documented in `docs/Assessment-Evidence.md`.

The next product phase is governed by `docs/Longitudinal-Evidence-Architecture.md`. It keeps
private saved results client-encrypted, separates recovery credentials from research
identifiers, and defines consent, comparison, outcome, retention, deletion, security, and
version-compatibility rules for longitudinal features.

## Private Saved Results

Assessment participants can create a private recovery link from their completed report.
`saved-results-crypto.js` generates a 256-bit recovery secret, derives independent
authentication and encryption material with HKDF-SHA-256, and encrypts saved profiles with
AES-256-GCM. `netlify/functions/saved-results.mjs` stores only validated encrypted envelopes
in the site-scoped `capacity-saved-results` Netlify Blobs store. The private page supports
recovery, renewal, link rotation, printing, immediate deletion, and encrypted longitudinal
follow-ups without an account. Same-version observations receive neutral baseline-to-current
overall and domain deltas; version changes suppress numeric deltas. Participants can also
record optional material-change context inside the encrypted profile.

On localhost, `private-results-api.js` uses browser storage as a ciphertext-only mock so the
complete experience can be reviewed without Netlify Dev. The private page remains excluded
from navigation and search indexing. Machine-readable contracts live in `schemas/`;
deterministic, lifecycle, validation, and function tests live in `test/`. Deployment and
operating details are documented in `docs/Private-Saved-Results.md`.

`comparison-engine.js` owns the version-aware comparison policy independently of the private
profile renderer. A follow-up starts from the private recovery page, carries its recovery
secret only in the URL fragment, and conditionally replaces the ciphertext after appending
the new aggregate observation.

`outcome-engine.js` defines five behaviorally anchored operating observations and their
version-aware comparison policy. Private profiles can retain up to 24 encrypted outcome
snapshots with a 30- or 90-day observation window and an evidence-source classification.
Outcomes remain separate—there is no composite outcome score, benchmark, or causal claim.

`action-cycle-engine.js` turns a current constraint hypothesis into a private operating loop:
a bounded action hypothesis, concrete commitment, evidence to watch, review date, status, and
review note. The private profile supports planning, activation, review, completion, stopping,
and reopening. Action-cycle contents remain encrypted and are excluded from the longitudinal
research projection; observations provide context and never establish causation.

`profile-journey-engine.js` derives an executive Current Focus and the five-stage
Diagnose → Prioritize → Act → Observe → Reassess progression from the encrypted profile.
`saved-results.html?demo=1` renders a clearly labeled fictional profile from
`demo-profile.js` entirely in memory. Demo mode exposes no save, research, recovery, or
mutation controls and creates no local or remote record.

## Multi-Perspective Organization Architecture

`organization-aggregation-engine.js` provides the first privacy-thresholded team aggregation
contract. It suppresses every score below five valid submissions, blocks mixed-version
aggregation, and exposes only rounded means and categorical perspective patterns—never
individual values or distributions. Production identity and workspace storage are
intentionally deferred until the tenancy, consent, retention, and authorization requirements
in `docs/Multi-Perspective-Organization-Architecture.md` are approved. Machine-readable
submission, view, and governance contracts live in `schemas/`.

`organization-view.html` is the corresponding fictional, no-storage product prototype. It
lets a visitor advance a collection round from one through five perspectives, demonstrates
full score suppression below threshold, and then renders the aggregate domains, categorical
perspective patterns, and shared constraint hypothesis. It performs no fetch or browser
storage operation and is linked from the assessment and individual illustrative profile.

The production workspace stack is selected in `docs/Identity-Tenancy-Decision.md`: Clerk
Organizations for identity and invitations, Neon Postgres for transactional workspace data,
and Netlify Functions as the only application-data gateway. `workspace-authorization.js` and
`schemas/workspace-authorization.json` define the fail-closed product permission model before
any provider credentials or real participant data are introduced.

Optional longitudinal evidence uses a third, deliberately separate boundary.
`longitudinal-evidence-client.js` creates a random research subject ID and independent
withdrawal capability, then projects only versioned aggregate assessments, outcome
observations, and change categories. `netlify/functions/longitudinal-evidence.mjs` stores
consent receipts and research events in separate Netlify Blobs stores and deletes all
subject-level events on withdrawal. Contributions are manual, never implied by saving a
private profile.

`crypto-prototype.html` remains available as a development-only cryptographic test surface.

## Deploy
Push to GitHub. Netlify deploys automatically from the connected repository.

## Current release
Release 0.5 RC1 — public launch candidate structure.
