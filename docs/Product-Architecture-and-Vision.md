# Product Architecture and Final-Product Vision v0.1

## Final-product vision

The Senger Advisory Organizational Capacity Platform is a co-brandable operating system that
helps an organization move from an initial capacity signal to a robust diagnosis, an
appropriately scaled intervention, and verified learning. It identifies where organizational
capacity constrains strategy, gathers informed perspectives without exposing individuals,
turns the strongest constraint hypothesis into an action cycle, and tests whether capacity
and operating outcomes improve over time.

The paid diagnostic and intervention support two complementary delivery routes:

1. **Automated diagnostic and platform-guided intervention** — a scalable, low-touch
   experience that walks the organization through the governed diagnostic process, then
   translates the resulting hypothesis into recommended next steps, just-in-time learning,
   evidence prompts, check-ins, and reassessment.
2. **Advisor-led diagnostic and intervention** — a premium, high-touch experience that equips
   Senger Advisory or an authorized partner to conduct live discovery and interviews,
   facilitate interpretation, source specialized L&D support, create just-in-time training,
   provide live coaching, and lead implementation.

These are two service levels built on the same diagnostic and evidence loop, not separate
products. A customer may begin with the automated route and escalate to an advisor when the
evidence, risk, or implementation need warrants it. Both routes produce the same client-facing
Capacity Operating Brief and preserve one organizational record.

Security, privacy, and participant confidentiality are method requirements across both
routes. Workspace authority never implies access to individual interview content. Identity,
confidential responses, de-identified evidence, findings, commerce, and intervention records
remain separate data boundaries with least-privilege access, disclosure review, release
gates, retention controls, and audit history. The control model and buyer diligence position
are maintained in `docs/Security-Privacy-and-Confidentiality-Brief.md`.

## Assessment and diagnostic boundary

The free Organizational Capacity Assessment and the paid Organizational Capacity Diagnostic
serve different purposes and must never be presented as interchangeable.

- **Assessment:** a lightweight, repeatable gauge that indicates what the organization is
  probably experiencing. It offers real operating insights, likely capacity signals,
  reflection questions, and evidence to begin observing. It does not establish an
  organizational diagnosis or prescribe an intervention.
- **Diagnostic:** a robust, multi-perspective investigation that develops and tests a
  contextual constraint hypothesis, synthesizes confidential evidence, identifies competing
  explanations and blind spots, and produces a recommended intervention.

“Basic” should describe the effort required by the free assessment, not the intelligence of
its interpretation. The assessment remains useful indefinitely, but deliberately stops before
the evidentiary depth and intervention recommendation delivered by the diagnostic.

## Shared diagnostic methodology

The automated and advisor-led diagnostics use the same governed methodological spine:


```text
Discovery
  → participant-design and perspective-coverage review
  → contextualized common interview protocol
  → confidential individual responses
  → de-identification and evidence synthesis
  → diagnostic confidence, contradictions, and blind spots
  → organizational diagnostic report
  → recommended intervention
```

The question protocol may be contextualized with AI assistance, but each question must map to
a governed capacity domain, evidence objective, and interpretation rule. A common approved
protocol is administered to every participant in the same diagnostic. Participant design
should seek sufficient perspective coverage rather than rely only on the sponsor's closest or
most aligned colleagues.

The automated route should initially use a confidential, asynchronous guided diagnostic
interview: structured written questions with adaptive follow-ups for ambiguity,
contradictions, and missing examples. The advisor-led route uses live interviews and skilled
human probing. Methodological equivalence does not imply identical collection experiences;
the automated route must escalate when evidence quality, sensitivity, or consequence calls
for human judgment.

The diagnostic creates a decision hypothesis, not clinical, causal, or managerial certainty.
Automated guidance must preserve uncertainty, distinguish observed results from inferences,
and include checkpoints that can change the recommended course.

## Intervention architecture

### Shared diagnostic core

Both routes use the same versioned diagnostic method, evidence model, constraint hypothesis,
privacy rules, action-cycle model, outcome observations, and reassessment logic.
This preserves comparability and prevents the premium service from becoming an undocumented
parallel methodology.

### Platform-guided route

The platform may provide:

- a prioritized 30/60/90-day action path;
- bounded intervention options tied to the identified constraint;
- templates, facilitation guides, and just-in-time learning modules;
- owners, commitments, review dates, and evidence prompts;
- automated check-ins and escalation signals;
- outcome observations and version-aware reassessment; and
- a clear invitation to seek advisor support when uncertainty, risk, or stalled progress
  exceeds the automated route's limits.

Recommendations are hypotheses to test. They must not imply that one score establishes root
cause or that an intervention caused a later result.

### Advisor-guided route

The platform should generate an advisor-ready engagement brief containing:

- the constraint hypothesis and supporting pattern;
- areas of perspective alignment and variation;
- evidence to gather before prescribing an intervention;
- suggested facilitation and coaching questions;
- intervention capability requirements;
- potential L&D, training, or specialist needs;
- proposed success measures and review cadence; and
- the customer's action-cycle and reassessment history.

Advisors may tailor the intervention, create or assign learning, document coaching and
implementation activity, and use the same evidence loop to review progress. Product roles
must distinguish customer administration, facilitation, advisory access, and platform
operations while maintaining least privilege.

Learning Path items are not generic course assignments. Each item must connect to the accepted
intervention, name an accountable role, set a due date, and ask how the learning was applied in
real work. Completion is an implementation record only; it never counts as evidence of operating
or capacity change unless a separate governed observation supports that conclusion.

The 30/60/90-day Action Path is likewise not a project-management backlog. It sequences the few
operating commitments necessary to test the intervention hypothesis. Each commitment names an
accountable role, a leadership decision gate, and the evidence to gather; blocked commitments
surface as attention signals, while completed commitments remain delivery records rather than
claims of operating or capacity change.

Guided check-ins ask only the next bounded operating question needed to manage the intervention.
Open check-ins become attention signals when overdue, and leaders may explicitly escalate a
response that requires a decision. Check-in responses are contextual implementation records;
they enter the evidence model only through a separately classified Evidence Journal observation.

The Brief's attention layer is intentionally sparse. It shows only a current blocked commitment,
overdue or escalated check-in, overdue intervention review, or due reassessment. It does not rank
people, repeat healthy activity, or manufacture urgency from generic metrics. An empty attention
layer is a meaningful state: no current governance decision requires leadership action.

Escalation from platform-guided to advisor support is additive, not a new engagement record.
The sponsor identifies the bounded support need, urgency, current context, and desired outcome.
The request preserves the existing diagnostic, intervention, evidence, decision, and reassessment
history; it does not automatically change delivery route or grant access to participant content.

Decision History is a derived chronology of explicit governance events, not a transcript or an
activity feed. It includes leadership validation, intervention acceptance, formal reviews,
resolved commitments and check-ins, and advisor-support handling. Participant content is never
included, and the timeline does not imply that a recorded decision produced an observed outcome.

For the platform-guided route, initial intervention setup may be generated directly from the
accepted proposal. Generation is idempotent and refuses to overwrite any existing action,
learning, or check-in record. The output is a sponsor-reviewable operating draft—not autonomous
prescription—and retains the accepted proposal's owners, operating changes, learning needs, and
evidence plan as its source.

## Capacity Operating Brief

The shared post-diagnostic experience is not a generic analytics dashboard. It is a living
**Capacity Operating Brief**: a concise executive decision workspace generated by the
diagnostic and updated throughout the accepted intervention.

Its governing question is:

> What capacity constraint are we working on, what are we doing about it, and what evidence
> would change our minds?

The primary view should fit on one executive screen and answer:

1. **What did we diagnose?** The current constraint hypothesis in plain language.
2. **Why do we believe it?** Convergent evidence, meaningful variation, symptoms,
   contradictions, blind spots, and diagnostic confidence.
3. **What did we decide to do?** The accepted intervention, rationale, scope, owner,
   commitments, commercial agreement, and expected duration.
4. **What should be changing now?** A small set of behaviorally anchored leading indicators.
5. **What needs attention?** Decisions, overdue commitments, stalled evidence, emerging
   contradictions, and escalation points.
6. **What happens next?** The next action, review, evidence request, or reassessment milestone.

Supporting views may include the Diagnostic Record, Intervention Plan, Evidence Journal,
Learning Path, Reassessment, and Decision History. Detail is progressively disclosed; the
default experience remains an executive narrative rather than a collection of widgets.

The Brief must keep three evidence classes visibly separate:

- **Delivery:** whether the agreed intervention activities occurred;
- **Operating change:** whether decisions, coordination, ownership, or behavior changed; and
- **Capacity change:** whether reassessment supports revising the original diagnosis.

Completion activity is not evidence of capacity improvement. The Brief must avoid generic
status grids, unbounded KPI collections, people or team rankings, activity presented as
outcome, and causal claims unsupported by reassessment.

Automated and advisor-led customers receive the same client-facing Brief. Automation supplies
prompts, synthesis, recommended next actions, and escalation signals; advisors receive
additional governed controls for facilitation, contextual interpretation, learning delivery,
specialist coordination, and intervention review.

## Co-branded partner architecture

Authorized coaches and consultants should be able to sell and deliver the platform within a
governed partner tenancy. Co-branding is a controlled presentation and service layer, not a
relaxation of Senger Advisory's methodology, privacy protections, or evidence standards.

The partner layer should support:

- partner name, logo, colors, and approved custom domain;
- Senger Advisory attribution rules and methodology/version visibility;
- co-branded invitations, assessment surfaces, reports, learning, and workspace navigation;
- configurable advisor contact, service offers, escalation paths, and scheduling links;
- partner administration of its client organizations without cross-client data access;
- clear client, partner, and platform data-ownership and retention terms;
- partner-specific subscriptions, licensing, usage, and billing controls;
- reusable partner-authored learning or intervention assets with provenance and approval
  states; and
- auditability of branding, content, advisor access, and tenant-boundary changes.

The tenancy hierarchy should distinguish platform, partner, and client organization. A
partner may administer multiple client workspaces, but one client must never be able to see
another client's identity, participation, results, or intervention history. Platform-owned
assessment versions and governance rules remain centrally controlled.

## Product loop

The complete product ladder and operating loop are:

```text
Free Assessment
  → paid Automated or Advisor-led Diagnostic
  → accepted intervention
  → Capacity Operating Brief
  → act → observe → decide → reassess
```

The platform succeeds when it helps a customer make a better intervention decision and learn
whether the operating system changed—not when it merely produces a polished score report.

## Commercial architecture

- **Entry:** a free, lightweight assessment that demonstrates the intelligence of the model,
  creates immediate value, and reveals why a deeper diagnostic may be warranted.
- **Diagnostic:** a paid automated or advisor-led organizational investigation that produces
  the evidence-backed constraint hypothesis and recommended intervention.
- **Scale:** recurring platform access to the Capacity Operating Brief, guided intervention,
  learning, check-ins, organizational evidence, decisions, and reassessment.
- **Premium:** advisor-led diagnostic, intervention design, coaching, L&D sourcing, custom
  training, and implementation support from Senger Advisory or an authorized partner.
- **Partner:** co-branded licensing that allows qualified coaches and consultants to deliver
  both platform-guided and advisor-guided routes within governed client workspaces.

Pricing and packaging may evolve independently, but product telemetry should distinguish
assessment completion, diagnostic conversion and completion, route selection, intervention
acceptance, Operating Brief use, action-cycle activation, learning use, escalation, review,
and reassessment without collecting respondent-level content unnecessarily.

### Payment and entitlement boundary

Hosted checkout is a commercial operation, not an evidence operation. The authenticated client
sponsor may request checkout for a specific pending entitlement, but a browser success return
never activates access. Only a raw-body, signature-verified, replay-bounded provider webhook
may reconcile the checkout reference and activate the matching entitlement. Provider event IDs
are idempotent, card details remain entirely with the payment provider, and payment records do
not contain participant identity, interview content, evidence, findings, or intervention notes.
Diagnostic and intervention access use separate entitlements and separate offer prices. A paid
diagnostic entitlement permits the diagnostic workflow and intervention proposal design; it
does not silently purchase the proposed intervention. POC engagements retain one explicit,
no-charge POC entitlement across the governed proof-of-concept loop.

### POC product-decision governance

The aggregate scorecard feeds an advisor-governed POC decision ledger. Continue,
monitored-adjustment, hold, narrow-scope, and ready-to-monetize decisions are immutable,
time-stamped records with rationale, required changes, unresolved risks, and next hypotheses.
Monetization readiness is never inferred from aggregate metrics alone, and the ledger contains
no participant identity, feedback text, interview content, or diagnostic evidence text.

Approved product changes are governed through a separate append-only POC change ledger. A candidate
retains its observed operational problem, severity, risk, proposed change, validation measure,
rollback condition, and method or platform governance impacts. Approval and validation are distinct
records; only approved candidates may be validated. This boundary prevents product iteration from
quietly repurposing confidential participant contributions.
