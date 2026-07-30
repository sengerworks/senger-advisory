# Organizational Capacity Diagnostic Architecture v0.1

## Status

Architecture contract for the paid Organizational Capacity Diagnostic. This document defines
the lifecycle and evidence boundaries before sponsor discovery, guided interviews, synthesis,
commerce, and Capacity Operating Brief APIs are implemented.

The free Organizational Capacity Assessment is a directional signal gauge and conversion
path. It is not a completed diagnostic and does not prescribe an intervention.

## Product objective

Run one governed, confidential diagnostic method through either automated or advisor-led
delivery. Both routes should produce the same evidence-traceable organizational record,
intervention decision, and client-facing Capacity Operating Brief.

```text
Paid or POC entitlement
  → sponsor discovery and approved context brief
  → participant design and perspective-coverage review
  → contextualized common question protocol
  → confidential guided interviews
  → evidence-quality and disclosure review
  → de-identified synthesis
  → leadership validation
  → intervention proposal and commercial acceptance
  → Capacity Operating Brief
  → intervention review and reassessment
```

## Delivery routes

### Automated

The initial automated route uses confidential asynchronous written interviews. Each
participant receives the same approved core protocol. Limited adaptive prompts request an
example, clarify ambiguity, test an interpretation, or fill an evidence gap. Automation must
escalate when evidence is insufficient, contradictory, unusually sensitive, or consequential.

### Advisor-led

The advisor-led route supports live discovery and interviews, skilled probing, recording and
transcription when consented, human-reviewed de-identification, facilitated interpretation,
and custom intervention design. It uses the same governed protocol, evidence model, and
diagnostic record as the automated route.

## Lifecycle gates

`diagnostic-lifecycle-engine.js` owns lifecycle version `1.0.0`. Forward movement requires
explicit gates rather than UI completion alone:

- an active paid or POC entitlement before discovery;
- sponsor approval of the Diagnostic Context Brief;
- an approved participant plan and accepted perspective-coverage gaps;
- an approved common protocol and participant notice before collection;
- a closed collection satisfying the approved participation plan;
- completed de-identification, disclosure review, and evidence-quality review;
- resolved human escalation before automated synthesis;
- an evidence-traceable diagnostic record before leadership validation;
- resolution of material objections before intervention proposal;
- accepted scope, commercial terms, and intervention entitlement before activation; and
- a ready Capacity Operating Brief before intervention work begins.

The POCs will inform a future governed participation minimum. The architecture does not reuse
the assessment aggregation threshold as an unvalidated qualitative-interview rule.

## Question governance

AI may contextualize questions but may not invent an unconstrained protocol. Every core
question must map to a versioned capacity domain, evidence objective, allowed prompt pattern,
and interpretation rule. The same core protocol is administered to all participants within a
diagnostic. Adaptive follow-ups are recorded separately so they cannot silently change the
common method.

Sponsors may review relevance and sensitivity but cannot rewrite the protocol to steer the
result. Protocol changes require a version and an audit event.

`diagnostic-question-library.js` owns question-library version `1.0.0` and begins with 18
governed templates. `diagnostic-protocol-engine.js` compiles exactly 15 unique core questions
for one diagnostic and requires coverage of all six capacity domains and six evidence
objectives: operating examples, recurring patterns, consequences, enabling conditions,
disconfirming evidence, and intervention history.

Automated probing is intentionally bounded. A core answer may receive at most three prompts
selected from six approved types: example, recurrence, consequence, mechanism, alternative
explanation, and evidence source. Each prompt requires a recorded evidence-quality reason;
freeform model-generated follow-up wording is not permitted in version `1.0.0`.

## Confidential interview and evidence-quality contract

`diagnostic-interview-engine.js` owns interview and evidence-quality version `1.0.0`. An
interview begins only after participant notice acceptance and references an approved protocol.
The response record contains an opaque interview instance ID but no participant name, email,
account ID, or invitation ID. Operational identity mapping remains outside the raw confidential
response boundary.

The automated route stores written core and adaptive answers. The advisor-led route may map a
consented transcript into the same question-oriented response contract after human review.
All 15 core questions require sufficiently developed answers before submission. Withdrawal
clears core and follow-up response content from the interview record.

Evidence-quality policy `1.0.0` is explicitly a POC hypothesis. It tests for concrete
examples, recurring patterns, consequences, and alternative or disconfirming evidence.
Insufficient depth triggers clarification rather than synthesis. Sensitive content or repeated
model uncertainty requires human review. POC findings must calibrate these thresholds before
they are treated as production evidence standards.

## De-identification, disclosure review, and synthesis

`diagnostic-evidence-engine.js` owns de-identified evidence and synthesis version `1.0.0`.
Each evidence record retains an opaque source reference and question reference for restricted
traceability, while excluding respondent identity. It records what identifying categories
were removed, how operating meaning was preserved, and the remaining disclosure risk.

De-identification does not guarantee anonymity. Every record requires disclosure review;
high-risk material requires a human reviewer. Excluded or pending evidence cannot enter
synthesis. Direct quotations remain disfavored because distinctive incidents and language can
re-identify a participant even after names are removed.

An evidence theme requires at least two approved records and identifies its capacity domains,
perspective pattern, supporting and weakening evidence, confidence, and confidence basis. A
constraint hypothesis requires at least two themes, a competing explanation, a documented
blind spot, and an evidence-based confidence statement. The intervention direction remains a
hypothesis to test rather than a prescription or causal conclusion.

Advisor validation is a distinct gate before client leadership validation. The assigned
advisor must see confidence bases, supporting and weakening evidence counts, competing
explanations, blind spots, and the proposed intervention direction. The advisor may approve
the synthesis for leadership validation or require revision with a recorded rationale.
Advisor approval does not release the finding to the sponsor and cannot substitute for
leadership validation.

The initial POC sponsor-release policy uses five completed perspectives as a confidentiality
floor and requires every assigned perspective to be complete, all disclosure review to be
resolved, and advisor validation to be approved. This floor limits premature disclosure; it
does not establish methodological sufficiency. Perspective coverage, contradictions, and
missing viewpoints remain visible as uncertainty. The sponsor response is reconstructed from
the governed finding and excludes evidence identifiers, excerpts, participant identity,
advisor notes, and raw response content.

Leadership validation records resonance, completeness, surprise, missing evidence, material
objections, and an explicit accept-or-revise decision. Validator identity and response content
remain in the operational boundary rather than the diagnostic finding. A challenged finding,
material gap, or material objection cannot be accepted; it returns to protected synthesis
review. An accepted decision validates the finding but does not itself create or activate an
intervention.

Intervention design is available only to an actively assigned advisor after leadership has
validated the finding and an entitlement is active. Every proposal must define objective,
rationale, scope, operating changes, accountable commitments, learning requirements, review
cadence, duration, and evidence for delivery, observed operating change, and reassessed
capacity change. Proposal creation does not constitute commercial acceptance or activation.

The client sponsor receives a minimized intervention proposal containing the validated scope,
commitments, learning requirements, service route, duration, evidence plan, and commercial
offer reference. Acceptance requires separate affirmative consent to scope and commercial
terms plus a server-verified active POC or intervention entitlement. A browser success state
or active paid-diagnostic entitlement alone cannot activate intervention access.

After intervention acceptance, the client sponsor may activate one versioned Capacity
Operating Brief. Activation re-verifies the validated finding, accepted intervention, and
active POC or intervention entitlement. The initial Brief carries the current constraint,
confidence and uncertainty, accepted intervention, accountable commitments, learning needs,
three evidence classes, review cadence, and duration into an ongoing client workspace while
excluding participant identity and confidential evidence references.

The active Brief includes an evidence journal whose entries are classified as intervention
delivery, observed operating change, or reassessed capacity change. Each entry records a
bounded observation, source note, and observation time without asserting that the intervention
caused the result. Entry authorship remains in the audit boundary rather than the shared
observation payload.

Formal Brief reviews require at least one recorded observation and an evidence assessment.
Leadership may continue, adjust, escalate, stop, or begin reassessment. Continue, adjust, and
escalate schedule a future review; adjustment records explicit operating changes; stop closes
the intervention and Brief; reassessment advances the diagnostic without treating delivery or
short-term operating movement as proof of capacity change.

## Diagnostic record, leadership validation, and intervention decision

`diagnostic-decision-engine.js` owns diagnostic-record and intervention-proposal version
`1.0.0`. The Diagnostic Record turns the evidence-linked hypothesis into an executive finding,
why-it-matters-now narrative, strategic exposure, operating symptoms, visible uncertainty,
and alternative interventions considered. It cannot become final through synthesis alone.

Leadership validation records whether the finding resonates, appears complete, surprises the
team, omits evidence, or faces a material objection. Validation response identity remains in
a separate operational boundary. Every material objection must have a documented resolution
before the record can be accepted; otherwise the decision returns the record for revision.

Only a leadership-validated Diagnostic Record can produce an intervention proposal. The
proposal defines the objective, rationale, scope, operating changes, role-based commitments,
learning requirements, review cadence, and evidence plan. Every evidence plan must distinguish
delivery, observed operating change, and reassessed capacity change. Commercial details are
stored through an offer reference, and activation requires accepted scope, accepted terms,
and a server-verified entitlement.

## Sponsor discovery and participant design

`diagnostic-discovery-engine.js` owns discovery contract version `1.0.0`. Sponsor discovery
produces a bounded Diagnostic Context Brief covering organizational context, strategic
priority, triggering concern, decisions or outcomes at risk, recent changes, prior
interventions, known sensitivities, and the leadership decision the diagnostic must inform.
The sponsor explicitly approves that brief before participant design begins.

Participant design operates on identity-free slots. Each slot describes leadership level,
execution proximity, and functional lens; names and email addresses belong in the separate
identity-and-participation boundary. A diagnostic defines its perspective-coverage objectives,
then compares the proposed plan with those objectives. Every uncovered perspective must be
resolved or explicitly accepted with a reason before the plan is approved.

This process makes sponsor-selection bias visible without implying that every organization
has the same ideal cohort. The POCs will inform future participation guidance; version `1.0.0`
does not impose an unvalidated fixed qualitative threshold.

## Evidence boundaries

The platform separates six logical boundaries:

| Boundary | Contents | Primary access |
| --- | --- | --- |
| Identity and participation | Sponsor, invitations, completion, consent | Authorized operations |
| Raw confidential responses | Written answers, recordings, transcripts | Restricted evidence service |
| De-identified evidence | Redacted examples, coded themes, contradictions | Synthesis service; authorized advisor |
| Diagnostic findings | Hypotheses, confidence, blind spots, validation | Authorized client workspace |
| Commercial entitlements | Offers, acceptance, payment references, access state | Commerce service; owner |
| Intervention and Operating Brief | Commitments, decisions, evidence, reassessment | Authorized client and advisor roles |

Raw response content must not be stored with account, invitation, or billing records. A
de-identification step does not guarantee anonymity; disclosure-risk review, retention,
deletion, quote restrictions, and small-cohort warnings remain required.

## Diagnostic result

The diagnostic record distinguishes:

- observed evidence;
- synthesized themes;
- areas of convergence and meaningful variation;
- minority signals and contradictions;
- the primary constraint hypothesis;
- competing explanations;
- evidence supporting and weakening each hypothesis;
- blind spots and missing perspectives;
- diagnostic confidence and its basis; and
- the recommended intervention and alternatives considered.

Leadership validation can accept, challenge, or request revision. Material objections must be
resolved before the platform treats an intervention as proposed.

## Commerce and POC entitlements

An entitlement is required to begin discovery. `paid` and `poc` entitlements traverse the
same product workflow; a POC is not an administrative bypass. POC entitlements are no-charge,
time-bounded commercial records that allow activation, conversion, and feedback flows to be
tested before public monetization.

Payment data remains outside diagnostic evidence. The platform stores provider references and
entitlement state, never card details. Intervention activation requires server-verified
commercial acceptance rather than a browser success redirect.

For the initial co-branded model, Senger Advisory bills direct clients, partners pay Senger
Advisory for platform licensing or usage, and partners bill their own clients. The platform
records partner-client entitlements but does not split or pay partner revenue.

## Capacity Operating Brief

After intervention acceptance, both routes activate the same client-facing Capacity Operating
Brief. It keeps delivery activity, observed operating change, and reassessed capacity change
separate. Advisor-led work may add governed facilitation controls without creating a second
client product or evidence model.

## Governed reassessment and comparison

A leadership decision to reassess does not immediately produce a before-and-after result. The
platform first creates a private reassessment plan that preserves the baseline diagnostic's
method version, approved 15-question protocol and question-library version, and approved
perspective-coverage objectives (including explicitly accepted gaps). Those controls are
server-derived; the sponsor supplies only a target date and planning note.

Comparison remains explicitly unavailable until the planned reassessment has completed the
qualifying diagnostic workflow. Intervention delivery and observed operating change may inform
the next decision, but neither is labeled capacity improvement and neither supports a causal
claim on its own. A later comparison release must verify method, protocol, coverage,
confidentiality floor, evidence readiness, and completion before showing reassessed change.

Activating an approved plan creates a new, linked diagnostic record. It inherits the baseline
method and approved protocol, and carries forward the identity-free perspective slots and
accepted coverage gaps. It does not copy names, invitations, participant accounts, interviews,
responses, or de-identified evidence. New invitations therefore produce an independently
collected confidential evidence set while retaining the controls required for comparison.

Comparison release is a governed advisor decision, not an automatic score delta. The platform
requires the preserved method and protocol, at least five completed reassessment perspectives,
no pending evidence review, advisor-approved findings, leadership-accepted findings, and theme
citations from both records. The released client view distinguishes what changed, persisted,
newly emerged, remains uncertain, and requires leadership attention. It records a bounded
change assessment but does not attribute causality to the intervention.

## POC validation

POC feedback is collected at sponsor setup, participant onboarding, interview completion,
report delivery, leadership validation, intervention acceptance, Operating Brief reviews, and
reassessment. Proposed changes require an observed problem, intended improvement, owner,
release, and validation measure.

Go-live readiness is evaluated across methodological defensibility, participant trust and
completion, leadership actionability, Operating Brief usefulness, expert-judgment alignment,
and realistic willingness to pay.
