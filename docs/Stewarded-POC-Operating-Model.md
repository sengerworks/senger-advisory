# Stewarded POC Operating Model v1.0

## Decision

The first Organizational Capacity Platform POCs use a **steward-led diagnostic**. The platform
structures, protects, and accelerates the method; it does not attempt to replace the human judgment
needed to establish trust, shape the inquiry, interpret consequential findings, or guide the
sponsor's first decision.

This is the authoritative operating contract for the pre-launch POC journey. Later automation may
replace a steward activity only after repeated POCs show that the activity is stable, safe,
comprehensible, and methodologically faithful.

During POC validation, OneCal provides the external booking experience while the platform preserves
the governed session record. The sponsor records the confirmed time after booking, and the assigned
steward separately attests completion. Provider webhook or API verification may replace sponsor
confirmation later; until then, the product describes the record accurately and does not claim that
attendance was automatically verified by OneCal.

## Three-session journey

### Session 1 — Guidance

The sponsor schedules a 30-minute Guidance Session before the Diagnostic Context Brief can be
approved. Together, the sponsor and steward establish:

- the sponsor's organizational level, role, function, and decision authority;
- the organizational system being examined;
- the execution demand, triggering concern, consequences, and decision at stake; and
- the six sponsor-context responses and any material sensitivities.

The steward may clarify and challenge the framing but may not convert sponsor belief into a finding.
The approved Context Brief remains a provisional inquiry frame.

### Session 2 — Design

The sponsor schedules a 30-minute Design Session before invitations can be issued. Together, the
sponsor and steward review:

- the intended perspective coverage and participant rationale;
- concentration, sponsor-selection, and missing-perspective risks;
- any explicitly accepted coverage gaps;
- the common 18-question contextualized protocol; and
- controlled sponsor challenges to wording or sensitivity.

The sponsor may request AI-assisted reframing through governed reasons but may not add questions,
delete required questions, or freely edit the protocol. Steward approval confirms that the protocol
can examine the leadership decision without leading participants or encoding the sponsor's theory.

### Session 3 — Revelation

After collection, confidentiality review, synthesis, and steward quality review are complete, the
sponsor schedules a 30-minute Revelation Session. The Executive Capacity Brief remains locked until
the steward deliberately releases it shortly before or during that meeting. The steward uses a
separate private Revelation Guide to explain the finding, uncertainty, organizational mechanics,
business implications, cost of inaction, and evidence-informed intervention directions.

The POC stops after the revelation, sponsor response, and commercial next-step decision. Detailed
intervention design, delivery, and reassessment require paid activation.

## Diagnostic scope

Every diagnostic identifies the **organizational system being examined**. A scope may be:

- the enterprise;
- a business unit;
- a function such as Sales or Marketing;
- a leadership layer; or
- a cross-functional execution system.

Scope is not convenience sampling. It must be bounded by the execution demand and include the
perspectives necessary to observe how work crosses relevant boundaries. The five Capacity Mechanisms
remain stable across scopes so evidence remains methodologically coherent:

1. Priority & Attention;
2. Authority & Accountability;
3. Information & Sensemaking;
4. Coordination; and
5. Resource & Capability Deployment.

Context changes the language and evidence prompts; it does not create a different diagnostic method
for each function or advisor specialty.

## Role and permission contract

### Sponsor

The sponsor owns the business context, scope proposal, perspective design, protocol review,
invitations, organizational validation, and commercial decision. The sponsor may see named invitation
delivery and acceptance plus aggregate collection progress. The sponsor may never see individual
answers, attributed excerpts, participant scores, or identity-linked evidence.

### Participant

The participant may accept the privacy terms, complete and submit their own confidential interview,
and receive submission confirmation. They cannot see other participants, progress, findings, or
steward material.

### Steward

The assigned steward guides the three sessions, reviews framing and protocol quality, monitors
operational progress, reviews protected de-identified evidence where explicitly authorized, approves
synthesis, prepares the Revelation Guide, and controls sponsor release. Access is engagement-scoped,
time-bounded, revocable, purpose-limited, and audited.

### Platform administrator

The platform administrator provisions organizations, entitlements, and steward assignments and
monitors minimized operational health. Platform authority does not confer access to confidential
responses, protected evidence, or Revelation Guides.

One person may hold more than one role, but each authority must remain a distinguishable grant and
must not silently expand the permissions of another role.

## Confidentiality and progress intelligence

Before five completed internal perspectives, the platform may expose only operational participation
metadata permitted to the relevant role. It may not expose themes, sentiment, excerpts, inferred
patterns, subgroup comparisons, or other content-derived intelligence.

After the minimum threshold is met, steward-only emerging insights may be generated from de-identified,
disclosure-reviewed evidence. They remain provisional and must:

- identify uncertainty and missing viewpoints;
- avoid narrow segments and reconstructable events;
- distinguish convergence, divergence, and counterevidence;
- never identify who started, submitted, or expressed a view; and
- never become sponsor-visible before governed synthesis and deliberate release.

The steward may use operational status and safe, aggregate insight to keep the process moving, but may
not disclose a provisional finding as a participation tactic.

## Dual-output and release contract

The governed synthesis produces two separate artifacts:

1. **Executive Capacity Brief** — a concise, visual, decision-oriented organizational artifact that
   becomes permanently available to the sponsor only after steward release.
2. **Private Steward Revelation Guide** — speaker notes containing deeper interpretation, research
   context, evidence trace, uncertainty, sensitive discussion guidance, likely questions, and
   intervention tradeoffs. It is never sponsor-visible.

Release requires all of the following:

- at least five completed perspectives and every required slot resolved;
- de-identification and disclosure review complete;
- evidence sufficiency, contradictions, and uncertainty explicitly represented;
- steward approval of the synthesis and both outputs;
- Revelation Session scheduled; and
- a deliberate, audited steward release action.

An email may notify the sponsor that the findings are ready to review and prompt scheduling, but it
must not imply that the Brief is already accessible.

## Evidence-informed intervention standard

Until sufficient validated longitudinal outcome data exists, the platform describes intervention
directions as **evidence-informed**, not empirically predictive. Every option must distinguish:

- observed organizational evidence;
- interpretation and inference;
- relevant external research;
- uncertainty and competing explanations; and
- the future evidence that would support, weaken, or change the recommendation.

The platform presents multiple weighted intervention directions and identifies a recommended first
move. Each direction states the evidence addressed, proposed mechanism, confidence, organizational
fit, effort, time to an observable signal, dependencies, and risks. Research citations support the
mechanism; they do not prove that a specific intervention will cause a client outcome.

Senger Advisory may recommend capabilities that Senger Leadership or an approved provider can
fulfill, but diagnostic interpretation must remain vendor-neutral. Commercial availability must not
inflate diagnostic weight, and any fulfillment relationship must be disclosed.

## Canonical POC states

The product implementation should converge on the following journey states. These are the Phase 1
contract; later phases implement and migrate them without weakening existing gates.

| State | Meaning | Progression gate |
|---|---|---|
| `enrolled` | Workspace, sponsor, steward assignment, and POC entitlement exist | Sponsor enters orientation |
| `guidance-required` | Scope and Context Brief are in draft | Guidance Session scheduled and completed |
| `context-approved` | Inquiry frame is approved but is not a finding | Perspective design begins |
| `design-required` | Coverage and 18-question protocol are in review | Design Session scheduled and steward approval recorded |
| `protocol-approved` | Cohort and common protocol are governed | Invitations may be sent |
| `collecting` | Confidential interviews are open | Required slots resolved and confidentiality floor met |
| `synthesizing` | Protected evidence is being reviewed | Disclosure, sufficiency, and steward-quality gates pass |
| `revelation-required` | Dual outputs are ready but sponsor Brief is locked | Revelation Session scheduled |
| `released` | Steward has deliberately released the Executive Capacity Brief | Sponsor review within permanent paid access or the 30-day POC access and download window |
| `poc-complete` | Revelation and POC learning are complete | Paid next step or closed POC |

Scheduling metadata does not itself prove that a meeting occurred. Session completion requires a
separate steward attestation and audit event. State names are business contracts, not permission
substitutes; every server endpoint must continue to enforce role, tenant, threshold, evidence, and
release requirements independently.

## Phase 1 completion boundary

Phase 1 locked this model in architecture and operating documentation. Subsequent delivery has now
implemented OneCal scheduling gates, the privacy-governed steward command center, separately
persisted Executive Capacity Brief and private Steward Revelation Guide outputs, and deliberate
sponsor release with a server-enforced 30-day POC window or permanent paid access. The
evidence-informed intervention engine, private steward walkthrough, and five-client readiness remain
governed by the later roadmap phases.
