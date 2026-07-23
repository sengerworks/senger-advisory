# Longitudinal Evidence Architecture v0.1

## Status

Architecture contract for the Private Saved Results and Longitudinal Comparison phase. This
document defines product, data, privacy, and security boundaries. It does not claim legal,
research, or psychometric validation and should be reviewed before implementation changes
expand the data collected or the purposes for which it is used.

Milestone A is implemented as a local-only cryptographic prototype in
`crypto-prototype.html`, `saved-results-crypto.js`, `schemas/`, and the automated test suite.
It validates the design but does not persist saved results to Netlify.

## Objective

Create a trustworthy chain from organizational conditions to capacity patterns to changes
and outcomes over time. The system should increase user value and strengthen the evidence
behind Organizational Capacity without treating private product usage as research by default.

The intended learning loop is:

```text
Baseline assessment
  → constraint hypothesis
  → operating evidence
  → intervention or material change
  → follow-up assessment
  → outcome observation
  → model and product refinement
```

## Architectural principles

1. **Private means private.** Saving a report is not consent to research, analytics, contact,
   or commercialization.
2. **Purpose determines collection.** Every stored field must support a named user or evidence
   purpose.
3. **Identity is not the organizing key.** Saved results, research evidence, and contact data
   use separate identifiers and stores.
4. **Longitudinal evidence requires explicit consent.** Repeated observations are not linked
   for research unless the participant selects that use.
5. **Versions are part of every result.** An assessment score without its assessment, scoring,
   report, and outcome-measure versions is incomplete evidence.
6. **Change is not improvement.** The product reports observed deltas and context; it does not
   claim causality or meaningful improvement without supporting evidence.
7. **Minimize first, aggregate second.** Do not collect individual answers, identity, or free
   text merely because they may become useful later.
8. **Trust is a product capability.** Consent clarity, deletion, expiration, and explainable
   interpretation are part of the evidence advantage.

## Scope

This architecture covers:

- private saved assessment results;
- baseline and follow-up assessments;
- longitudinal comparison;
- optional outcome snapshots;
- optional intervention and material-change records;
- anonymous cross-sectional evidence;
- pseudonymous longitudinal research evidence; and
- evidence export, retention, deletion, and version compatibility.

It does not yet cover user accounts, team administration, identifiable research studies,
normative benchmarks, billing, CRM integration, or automated recommendations.

## Data boundaries

The platform maintains four deliberately separate boundaries.

| Boundary | Purpose | Identifier | Platform-readable | Default retention |
| --- | --- | --- | --- | --- |
| Local assessment | Complete and score one assessment | Browser memory only | No | Ends when page state is lost |
| Private saved results | Revisit and compare personal reports | Client-held recovery secret | Ciphertext only | 12 months after last activity |
| Cross-sectional evidence | Evaluate completion, distributions, and perceived accuracy | Random evidence session ID | Aggregate evidence only | Up to 24 months |
| Longitudinal research | Study capacity, changes, and outcomes across time | Random research subject ID | Consented aggregate evidence | Up to 24 months unless renewed |

Contact information remains outside these boundaries. A future contact or account identifier
must not be copied into evidence stores. Linking identity to a research record requires a new,
study-specific consent design and is out of scope.

## Consent levels

Consent is granular. Selecting one level must not silently select another.

### Level 0 — Local only

- Complete the assessment and create a report in the browser.
- No assessment data is transmitted.
- Available to every participant.

### Level 1 — Private saved results

- Store a client-encrypted result so the participant can revisit it.
- Permit follow-up assessments and comparison within the encrypted profile.
- Do not make result contents readable to Senger Advisory.
- Provide visible expiration and immediate deletion controls.

### Level 2 — Anonymous cross-sectional evidence

- Share the existing versioned lifecycle events, aggregate scores, optional categorical
  context, accuracy rating, and feedback.
- Do not link separate assessment sessions.
- Use the current `assessment-evidence` store and retention rules.

### Level 3 — Pseudonymous longitudinal research

- Link consented aggregate results, outcome snapshots, and intervention categories across
  follow-ups using a random research subject ID.
- Do not include the saved-results recovery secret, ciphertext key, contact identifier, name,
  email, or organization name.
- Allow consent withdrawal to stop future collection and delete event-level records associated
  with the research subject ID.

Consent receipts record the selected level, consent-language version, timestamp, product
version, and withdrawal timestamp when applicable. They do not contain identity.

## Identifier model

Identifiers are never reused across boundaries.

### Evidence session ID

The current random UUID for one cross-sectional assessment attempt. It may join lifecycle
events within that attempt but must not join different attempts.

### Saved-results recovery secret

A cryptographically random 256-bit secret generated in the browser. It remains in the URL
fragment, which browsers do not send in HTTP requests. The browser derives two independent
values with Web Crypto HKDF:

- an authentication capability used to retrieve, update, or delete the stored ciphertext;
- an AES-256-GCM encryption key used only in the browser.

The server stores only a one-way digest of the authentication capability and never receives
the recovery secret or encryption key. Anyone who loses the recovery link loses access; there
is no email-based recovery in the MVP.

### Private profile ID

A random internal ID contained inside the encrypted payload. It organizes assessments for the
participant but is not exposed to evidence systems.

### Research subject ID

A separate random 128-bit or stronger identifier created only after Level 3 consent. It links
longitudinal research events but cannot retrieve or decrypt private saved results. Store it as
a prefix in research-event keys so all associated event-level data can be found and deleted.

### Contact or account ID

Reserved for a future identity system. It must not equal or automatically map to any evidence,
profile, or research identifier.

## Private saved-results design

### Server record

The saved-results store contains an opaque envelope:

```json
{
  "envelopeVersion": "1.0.0",
  "cipher": "AES-256-GCM",
  "iv": "base64url-value",
  "ciphertext": "base64url-value",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp",
  "expiresAt": "ISO-8601 timestamp"
}
```

The encrypted payload contains the profile ID, saved assessment instances, comparison state,
and optional user-authored labels. The server validates envelope size and format but cannot
read the payload. The storage ETag is returned alongside the envelope and is not embedded in
the encrypted or stored value.

### Operations

- **Create:** browser encrypts the first payload and sends the envelope plus authentication
  capability over HTTPS.
- **Read:** browser presents the capability, receives ciphertext, and decrypts locally.
- **Update:** browser encrypts the complete updated payload and uses an ETag precondition to
  prevent silent overwrite.
- **Delete:** browser presents the capability; the server removes the envelope and returns a
  generic success response.
- **Rotate link:** browser decrypts, creates a new recovery secret, writes a new envelope, then
  deletes the old one after successful confirmation.

Responses must not reveal whether a guessed capability exists. Recovery secrets and
authentication capabilities must never appear in query strings, analytics, console output,
function logs, or evidence events.

## Canonical longitudinal model

The following logical entities live inside the encrypted saved profile. Consented research
events use a minimized projection rather than copying the entire private profile.

### Saved profile

- `schemaVersion`
- `profileId`
- `createdAt`
- `updatedAt`
- `expiresAt`
- `displayLabel` — optional, local/private, maximum 80 characters
- `assessmentInstances[]`
- `outcomeSnapshots[]`
- `changeRecords[]`

### Assessment instance

- `assessmentInstanceId`
- `completedAt`
- `assessmentVersion`
- `scoringVersion`
- `reportVersion`
- `contextVersion`
- `context` — organization size, respondent perspective, and growth pressure categories
- `domainScores` — six 0–100 aggregate scores
- `overallIndex`
- `interpretationBand`
- `primaryConstraintIds[]`
- `accuracyRating` — optional

Individual item responses remain out of scope for saved results and research evidence.

### Outcome snapshot

- `outcomeSnapshotId`
- `observedAt`
- `outcomeMeasureVersion`
- `observationWindow` — initially prior 30 or 90 days
- `decisionPace`
- `leadershipEscalationLoad`
- `crossFunctionalCoordinationLoad`
- `executionReliability`
- `changeAbsorption`
- `evidenceSource` — self-report, operating measure, or mixed

Initial outcome fields use behaviorally anchored ordinal responses. They are not represented as
objective performance metrics. Later versions may add optional operating measures only after
definitions, burden, comparability, and sensitivity are reviewed.

### Change record

- `changeRecordId`
- `startedAt`
- `endedAt` — optional
- `category` — leadership, decision rights, operating cadence, structure, process, technology,
  talent, culture, strategy, external event, or other
- `targetDomainIds[]`
- `magnitude` — limited, material, or enterprise-wide
- `status` — planned, active, completed, or discontinued
- `note` — optional, private/encrypted, maximum 500 characters with a warning not to include
  confidential personal information

A change record documents temporal context. It does not prove that the change caused a later
score or outcome movement.

## Initial outcome measures

The first follow-up should remain brief and use five directional observations:

1. **Decision pace:** important decisions are completed at the pace execution requires.
2. **Leadership escalation load:** routine ambiguity reaches senior leaders less often.
3. **Coordination load:** cross-functional work advances without disproportionate meeting or
   translation effort.
4. **Execution reliability:** priority commitments are delivered with fewer avoidable delays,
   reversals, or rescue efforts.
5. **Change absorption:** the organization adapts without overwhelming ongoing execution.

Each measure needs behaviorally distinct response anchors, a named observation window, and a
version. Outcome questions must not simply restate assessment items; doing so would create the
appearance of validation through correlated self-report wording.

## Comparison rules

### Same assessment and scoring version

- Show raw overall and domain-score deltas.
- Show elapsed time and material changes recorded between assessments.
- Use neutral language such as “increased,” “decreased,” or “unchanged.”
- Do not label a delta meaningful, significant, or improved until evidence supports a
  threshold.

### Same assessment, different scoring version

- Display results side by side with clear version labels.
- Do not calculate a numeric delta because individual responses are not retained and earlier
  results cannot be rescored reliably.
- Explain that methodology changed.

### Different assessment version

- Compare only domains explicitly declared compatible in a version-compatibility registry.
- Suppress composite deltas unless the registry authorizes them.
- Preserve the original report and interpretation rather than rewriting history with the new
  model.

### Multiple respondents

Out of scope for the MVP. One private profile represents one continuing perspective, not an
organizational benchmark. Team aggregation requires respondent thresholds, anonymity rules,
and a separate research design.

## Version registry

Maintain a machine-readable registry in a later implementation with:

- assessment version;
- scoring version;
- report version;
- outcome-measure version;
- consent-language version;
- compatible predecessor versions;
- permitted comparisons; and
- release date and change rationale.

Version changes are required when item wording, domain membership, weights, band thresholds,
outcome anchors, consent purposes, or report interpretations change materially.

## Storage layout

Continue using site-scoped Netlify storage for the MVP with separate stores:

- `assessment-evidence` — existing cross-sectional evidence events;
- `capacity-saved-results` — client-encrypted private envelopes;
- `capacity-longitudinal-evidence` — consented pseudonymous research events; and
- `capacity-consent-receipts` — minimized Level 3 grants and withdrawals.

Use immutable, server-generated event keys for evidence. Use conditional writes for mutable
saved-result envelopes. Do not add a public list endpoint to any store.

Netlify Blobs is suitable for this MVP’s small key/value records and low-complexity access
patterns. Reassess storage before team accounts, complex queries, large cohorts, or frequent
concurrent updates. The logical data contract must remain storage-provider independent.

## Retention and deletion

### Private saved results

- Expire 12 months after the last successful profile update.
- Show the expiration date whenever a profile is opened.
- Allow immediate deletion from the recovery link.
- A successful update may renew the 12-month window with clear notice.

### Cross-sectional and longitudinal event-level evidence

- Review at least annually and at every material instrument change.
- Delete no later than 24 months after receipt unless converted into aggregate, de-identified
  research summaries.
- Level 3 withdrawal stops future linkage and queues deletion of event-level records for the
  research subject ID.

### Consent receipts and deletion records

- Retain consent receipts while associated event-level data exists.
- After deletion, retain only a minimized deletion receipt for 90 days to verify completion,
  then remove it.

### Aggregated research summaries

Aggregates that cannot reasonably be traced to a participant or small cohort may be retained
for model-development history. Establish minimum cohort-size and suppression rules before any
external benchmark or segment report is produced.

## Security and threat model

| Threat | Required control |
| --- | --- |
| Recovery-link leakage | URL fragment, no referrer transmission, client encryption, visible delete/rotate controls |
| Token guessing or record enumeration | At least 256 bits of recovery entropy, generic responses, request throttling, no list endpoint |
| Server or storage disclosure | AES-256-GCM client encryption; encryption key never leaves browser |
| Cross-site submission | Same-origin checks, restrictive CORS behavior, CSP, JSON-only POST endpoints |
| Stored or reflected script injection | Treat decrypted labels and notes as text, never HTML; enforce field lengths |
| Replay or concurrent overwrite | ETag preconditions, idempotency keys, server timestamps |
| Undisclosed research linkage | Separate research subject ID and explicit Level 3 consent |
| Identifier leakage in logs | Never log request bodies, secrets, capabilities, ciphertext, or research IDs |
| Unauthorized administrative access | Least-privilege Netlify roles, multifactor authentication, access review |
| Dependency or deployment regression | Locked dependencies, automated contract tests, deploy-preview validation |
| Unbounded retention | Expiration metadata, scheduled cleanup, annual review, deletion verification |

The implementation requires payload-size limits, strict schemas, method allowlists, same-origin
enforcement, rate controls, safe error messages, and tests for malformed, expired, replayed,
and unauthorized requests.

## Evidence-quality safeguards

- Keep product analytics separate from research interpretation.
- Record missingness rather than silently treating unanswered outcomes as neutral.
- Distinguish self-report from operating measures in every export.
- Preserve original versions and timestamps.
- Avoid external norms until cohort composition and sample limitations are understood.
- Avoid causal language when intervention and outcome data are observational.
- Document exclusions, transformations, and scoring changes in every analysis.
- Establish minimum cohort sizes before segment comparisons.

## Migration from Evidence Infrastructure v1

Existing `assessment-evidence` records remain valid cross-sectional events under an inferred
evidence schema version of `1.0.0`.

They must not be retroactively linked to saved profiles or longitudinal research subjects.
Future evidence events should add an explicit `evidenceSchemaVersion`. Level 2 sessions remain
unlinked. Level 3 events use a new endpoint or schema branch that requires a consent receipt
and research subject ID.

No migration is required for individual answers because none were transmitted or stored.

## Implementation sequence

### Milestone A — Contract and cryptographic prototype

- Define the saved-profile and envelope schemas.
- Prototype Web Crypto key derivation, encryption, decryption, and link recovery.
- Add test vectors and browser-compatibility checks.
- Define the version-compatibility registry.

### Milestone B — Private Saved Results MVP

- Create, open, update, rotate, expire, and delete encrypted profiles.
- Display the recovery-link trust model before saving.
- Store the current report as the first assessment instance.
- Do not implement longitudinal research linkage yet.

### Milestone C — Follow-up and comparison

- Start a follow-up from the private profile.
- Add same-version comparisons and neutral delta language.
- Capture material change records privately.

### Milestone D — Outcome snapshots

- Validate the five initial measures and response anchors.
- Add baseline and follow-up outcome snapshots.
- Keep outcome interpretation separate from capacity scoring.

### Milestone E — Longitudinal research consent

- Add Level 3 consent, research subject IDs, withdrawal, and subject-level deletion.
- Submit minimized aggregate projections to the longitudinal evidence store.
- Add evidence-quality and cohort-suppression checks to exports.

## Acceptance criteria for the next build

Private Saved Results MVP may begin when:

- the encrypted-envelope and saved-profile schemas are finalized;
- recovery, expiration, rotation, and deletion behavior is testable;
- the recovery secret and encryption key never reach server logs or storage;
- saved-result content is unreadable in a direct Blobs export;
- saving remains independent of evidence consent;
- version compatibility is explicit;
- no individual answers or identity fields are introduced; and
- loss of the recovery link is clearly explained before the user saves.

## Decisions reserved for later review

- Whether accounts should ever replace recovery links.
- Whether objective operating measures can be collected consistently and safely.
- Minimum cohort sizes for internal and external segmentation.
- Criteria for meaningful score change.
- Research design for multiple respondents within one organization.
- Whether a relational research database becomes necessary.
- Whether identifiable studies require a separate governance and consent process.
