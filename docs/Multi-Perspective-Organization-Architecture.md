# Multi-Perspective Organizational View Architecture v0.1

## Status

Architecture and governance contract for the first organizational workspace. This document
precedes production identity, invitation, response-storage, and workspace APIs. The initial
aggregation engine, machine-readable contracts, and fictional no-storage prototype are
implemented so privacy and interpretation rules can be tested before platform-readable
organizational data is collected.

This feature is a product capability, not research participation, a validated organizational
benchmark, or an employee-surveillance system.

## Product objective

Allow a leadership team to assess one organization from multiple informed perspectives and
see where capacity signals converge or vary. The organizational view should help the team
form better constraint hypotheses and leadership questions without exposing, ranking, or
diagnosing individual respondents.

The intended progression is:

```text
Create workspace
  → invite informed participants
  → collect private assessment submissions
  → wait for privacy threshold
  → reveal organizational capacity pattern
  → investigate shared constraint hypotheses
  → begin a shared action cycle
  → observe and reassess
```

This assessment-based organizational view identifies capacity signals and may support
diagnostic readiness, but it is not the paid Organizational Capacity Diagnostic. The
diagnostic adds discovery, intentional participant design, a contextualized common interview
protocol, confidential qualitative evidence, de-identification, synthesis, confidence and
blind-spot analysis, and an intervention recommendation. Both automated and advisor-led
diagnostics ultimately produce the same client-facing Capacity Operating Brief. The
diagnostic, intervention, partner, and final-product architecture are defined in
`Product-Architecture-and-Vision.md`.

## Non-goals

The first organizational workspace will not:

- expose individual answers or individual domain scores;
- rank leaders, teams, or functions;
- infer who is “right” when perspectives differ;
- produce external norms, percentiles, or industry benchmarks;
- use workspace submissions for research by default;
- permit administrators to lower the privacy threshold;
- show role, function, location, demographic, or other subgroup results;
- make causal claims from score movement; or
- copy private saved-profile recovery credentials into a workspace.

## Governance principles

1. **The organization is the unit of interpretation.** Individual responses are inputs to a
   shared organizational hypothesis, not individual performance records.
2. **Completion and content are separate.** Owners may know whether an invitation was
   completed, but they cannot see the invited person’s answers or scores.
3. **No results below threshold.** Fewer than five valid submissions reveal only completion
   progress and the number still required.
4. **Variation is information, not error.** Perspective spread is described as closely
   aligned, varied, or widely varied. It is not labeled conflict, inaccuracy, or dysfunction.
5. **Versions must match.** Assessment and scoring versions must be identical before numeric
   aggregation.
6. **Workspace use is not research consent.** Research contribution requires a separate
   organizational evidence contract and authority review that does not yet exist.
7. **Free text stays out of aggregation.** The initial shared view accepts no comments,
   names, emails, or arbitrary metadata in the response payload.
8. **Deletion is part of participation.** Invitations, submissions, aggregates, and the
   workspace each have explicit closure and deletion behavior.

## Roles and permissions

### Client Sponsor

The accountable sponsoring executive or designated customer administrator. The sponsor can
review diagnostic progress, approve organizational decisions and interventions, and view
the Capacity Operating Brief and outcomes. A sponsor may delegate logistics but cannot
govern the diagnostic method, review attributed evidence, or access individual response
content. During the POC, the Clerk `org:admin` role temporarily retains setup controls while
the separate operating console is developed.

For the lightweight assessment, the sponsor can create and close a workspace, invite
or remove participants, see invitation and completion status, and view threshold-qualified
organizational results. The sponsor cannot see individual response content or scores.

### Facilitator

An optional delegated administrator who can manage invitations, see completion status, and
facilitate the organizational report. The facilitator cannot change privacy policy, see
individual response content, or export respondent-level data.

### Assigned Advisor

An advisor role may be assigned to Senger Advisory or an authorized partner for a
specific client workspace and defined engagement period. The advisor can facilitate
discovery, govern the common protocol, review de-identified diagnostic evidence held for
human judgment, facilitate interpretation, guide shared action cycles, and contribute
approved intervention or learning materials. The advisor cannot browse attributed raw
responses, alter privacy policy, or access another client workspace. Advisor access must be
disclosed, purpose-limited, time-bounded, revocable, and audited.

### Senger Platform Admin

The platform role provisions tenants, partners, entitlements, billing state, method versions,
and operational support. It does not inherit access to confidential interview content. A
Senger team member who also delivers an engagement must receive a separate Assigned Advisor
assignment so platform operations and evidence review remain independently auditable.

### Participant

An invited respondent who can complete one assessment for a collection round and view the
organizational result after the threshold is met. A participant can see and delete their own
submission before the round is closed. They cannot see another participant’s completion
identity unless that visibility is explicitly disclosed in the invitation experience.

There is no analyst, researcher, or response-content super-administrator role in the product
contract. Platform operations and engagement evidence review are separate grants. Any support
access requires a documented workflow, least-privilege controls, and an audit record.

## Partner tenancy boundary

A future co-branded deployment adds a partner above one or more client organizations without
changing the organization as the unit of interpretation. Partner identity, branding,
licensing, and reusable content must remain separate from client participation and response
data. A partner administrator may provision and support authorized client workspaces but
must not receive respondent-level content or cross-client reporting. Every request must bind
the authenticated account to the partner, client workspace, role, and permitted action.

Assessment versions, scoring, privacy thresholds, evidence language, and core governance
remain platform-controlled. Co-branding cannot override them. Detailed partner capabilities
and the two intervention routes are defined in `Product-Architecture-and-Vision.md`.

## Relationship to the Capacity Operating Brief

The threshold-qualified organizational assessment pattern may appear as one source in a
later diagnostic record, but it must not be relabeled as a completed diagnosis. After a paid
diagnostic is completed and an intervention is accepted, the organization moves into the
Capacity Operating Brief: a living executive decision workspace centered on the diagnosed
constraint, accepted intervention, observable change, decisions, and reassessment.

The Brief may expose aggregate organizational evidence permitted by this contract. It must
not weaken response suppression, disclose individual assessment content, or combine
respondent identity with diagnostic evidence. Intervention delivery, operating change, and
reassessed capacity change remain distinct evidence classes.

## Identity and identifier separation

The workspace will require identity for access control, but identity must not become the key
for response interpretation or evidence.

| Identifier | Purpose | Stored with response content |
| --- | --- | --- |
| Account ID | Authentication and product access | No |
| Workspace ID | Tenant and organization boundary | Yes, as routing metadata |
| Membership ID | Role and workspace access | No |
| Invitation ID | Delivery and completion workflow | No |
| Submission ID | Idempotency and response deletion | Yes |
| Participant slot digest | Enforce one submission per invitation | Separate mapping only |
| Research subject ID | Future consented research | Not created by workspace use |

Invitation records and response records must use different stores. The service may need a
short-lived, access-controlled mapping to enforce one submission per invitation, but product
queries and reports must never return that mapping. The platform should be described as
confidential and threshold-protected, not cryptographically anonymous: service operators may
be able to correlate records through operational metadata unless a later zero-knowledge
design is implemented.

## Consent and participant notice

An invitation must explain before assessment:

- who created the workspace;
- the organizational purpose of collection;
- what the owner can see;
- what the owner cannot see;
- the five-participant minimum;
- that completion status may be visible;
- the expected close date and retention window;
- how to withdraw before round closure; and
- that the submission is not used for research or benchmarking by default.

Acceptance is versioned and stored separately from the response. Declining must not create a
response record. A workspace owner cannot consent to research on behalf of participants
through ordinary product terms.

## Privacy thresholds

### Initial organizational view

- Minimum valid submissions: **5**.
- Below five: return only `participantCount`, `minimumRequired`, `remaining`, and a generic
  suppression reason.
- At or above five: return rounded domain means, a rounded mean overall index, aggregate
  constraint IDs, participant count, and categorical perspective patterns.
- Never return minimum, maximum, individual values, response distributions, respondent
  constraint counts, or small-cell drilldowns.

An exact aggregate can sometimes be reverse-engineered when participants share their own
scores. Five is the minimum product threshold, not a guarantee of mathematical anonymity.
Invitations and report language must communicate this honestly. Consider increasing the
threshold for sensitive customers or small executive teams.

### Subgroups

Role, function, geography, tenure, demographic, and custom segment views are disabled in the
MVP. Later subgroup reporting requires:

- at least ten respondents in the full organizational cohort;
- at least five respondents in every displayed subgroup;
- complementary suppression so omitted cells cannot be derived;
- no intersectional filtering that creates a small cell; and
- a documented organizational need that outweighs re-identification risk.

## Aggregation policy

`organization-aggregation-engine.js` owns aggregation version `1.0.0`.

For each of the six domains it calculates:

- the arithmetic mean, rounded to a whole point; and
- a population-standard-deviation category:
  - below 8 points: `closely-aligned`;
  - 8 to below 16 points: `varied`;
  - 16 points or more: `widely-varied`.

The organizational overall index is the rounded mean of submitted overall indices. The
aggregate primary constraint is the domain or tied domains with the lowest aggregate mean.
These rules are product hypotheses. Perspective-pattern thresholds are not validated
statistical or managerial cutoffs and must be versioned when changed.

Do not average interpretation-band labels, individual constraint frequencies, or item
responses. Do not transform a dispersion category into a health score.

## Data contracts

### Minimized submission

The response contract contains:

- random submission ID;
- completion timestamp;
- assessment and scoring versions;
- six aggregate domain scores;
- overall index;
- interpretation band; and
- primary constraint IDs.

It does not accept individual answers, respondent identity, organizational name, invitation
ID, role, function, free text, private saved-profile IDs, recovery credentials, outcomes, or
action-cycle notes.

### Organizational view

The view contract has three mutually exclusive policies:

- `suppressed` — threshold not met and no scores present;
- `incompatible-versions` — threshold met but numeric aggregation is blocked; or
- `aggregate` — threshold and version rules are satisfied.

Machine-readable definitions live in:

- `schemas/organization-submission.schema.json`;
- `schemas/organization-view.schema.json`; and
- `schemas/organization-governance.json`.

## Proposed storage boundaries

Production storage is intentionally deferred. The likely logical stores are:

| Store | Contents | Access pattern |
| --- | --- | --- |
| `capacity-workspaces` | Workspace status, label, policy version, close date | Account-authorized |
| `capacity-workspace-memberships` | Account-to-workspace roles | Account-authorized |
| `capacity-workspace-invitations` | Delivery state, expiry, completion state | Owner/facilitator |
| `capacity-workspace-submissions` | Minimized response contracts | Write-once; aggregation service only |
| `capacity-workspace-slot-map` | Invitation-to-submission enforcement mapping | Restricted service access |
| `capacity-workspace-consent` | Versioned participant notices and acceptance | Participant and audit workflow |

Netlify Blobs may support a small pilot, but organization tenancy, invitation lookup,
concurrent membership changes, access revocation, audit requirements, and aggregation queries
are signs that a transactional database and managed identity provider should be evaluated
before production implementation.

No public list endpoint is permitted. Every request must bind the authenticated account to an
active workspace membership and authorize the specific action.

## Lifecycle, retention, and deletion

- Pending invitations expire after 30 days by default.
- A participant may replace or delete their submission before the round closes.
- Closing a round freezes the participant set and generates the threshold-qualified view.
- If deletion reduces an open round below five, all scores become suppressed immediately.
- After round closure, participant deletion handling must be stated in the invitation
  contract; the default should recompute and suppress when feasible.
- Raw minimized submissions are deleted no later than 90 days after workspace closure unless
  a customer contract requires a shorter window.
- Workspace and aggregate records expire after 12 months of inactivity unless the owner
  renews the workspace.
- Closing an account does not automatically authorize retaining its submissions for research.
- Research retention requires a separate consent path and separate evidence store.

## Security and abuse cases

The implementation must address:

- invitation forwarding and token theft;
- one person submitting through multiple invitations;
- owner attempts to invite fewer than five people and infer scores;
- collusion among respondents sharing their own results;
- timing correlation between completion events and response writes;
- enumeration of workspaces, members, invitations, or submissions;
- cross-tenant access;
- stale role or revoked invitation use;
- replay and concurrent update;
- export or logging of response payloads;
- malicious labels or stored script content;
- facilitator access after removal; and
- workspace closure or deletion races.

Required controls include managed authentication, short-lived invitation tokens, one-way token
digests, tenant-scoped authorization on every operation, exact schemas, generic errors, rate
limits, audit events without response content, encryption at rest, transport encryption,
secret rotation, and automated cross-tenant tests.

## Release sequence

### Milestone A — Architecture and aggregation contract

- Approve roles, visibility, threshold, retention, and consent boundaries.
- Implement and test minimized submission validation.
- Implement suppressed, incompatible-version, and aggregate policies.
- Publish machine-readable schemas.

### Milestone B — Local organizational-view prototype

- Add an illustrative multi-participant workspace.
- Show threshold behavior from zero through five submissions.
- Visualize aggregate domain means and categorical perspective patterns.
- Generate shared constraint hypotheses without individual drilldown.

Implemented in `organization-view.html`, `organization-view.js`,
`organization-view-demo-data.js`, and `organization-view.css`. The demonstration begins with
one fictional completed assessment, allows the visitor to move through five, and calls the
production aggregation engine after every change. It creates no account, network request,
browser-storage record, invitation, consent receipt, or evidence event.

### Milestone C — Identity and tenancy foundation

- Use Clerk Organizations, Neon Postgres, and Netlify Functions under the decisions and
  limitations in `Identity-Tenancy-Decision.md`.
- Apply the local four-schema migration and forced row-level-security policies to a disposable
  Neon development branch, then verify them with two-workspace database integration tests.
- Implement workspaces, memberships, invitations, revocation, and audit events.
- Complete a focused security and privacy review.

### Milestone D — Private collection round

- Implement versioned participant notice and acceptance.
- Accept one minimized submission per valid participant slot.
- Support withdrawal, replacement, closure, aggregation, and deletion.

### Milestone E — Shared action cycle

- Connect the organizational view to a shared constraint hypothesis.
- Add organization-level action ownership, evidence, review, and reassessment.
- Keep individual private profiles independent unless a participant explicitly imports a
  minimized result.

## Acceptance criteria for production identity work

Do not implement production accounts or invitations until:

- the five-person minimum and subgroup prohibition are approved;
- workspace role permissions are accepted;
- participant notice language is reviewed;
- response and identity storage are separate;
- a managed identity provider and transactional data store are selected;
- cross-tenant authorization tests are designed;
- deletion and workspace-closure semantics are explicit;
- operational support access is defined; and
- no research or benchmark use is implied by workspace participation.
