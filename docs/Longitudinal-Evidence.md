# Longitudinal Evidence Operations

## Boundary

Longitudinal evidence is a separate, explicit research boundary. Private saved results remain
client-encrypted, anonymous cross-sectional assessment evidence remains unlinked, and contact
information remains outside both systems.

Consent language version `1.0.0` permits a participant to submit a minimized pseudonymous
projection of the current private profile for model evaluation. It does not authorize
contact, identification, publication, benchmarking, automated recommendations, or sharing
with third parties.

## Identifiers and stores

The browser creates:

- a random UUID research subject ID used only to link longitudinal events; and
- an independent 256-bit withdrawal capability.

The capability is stored only inside the encrypted profile. The consent receipt stores its
SHA-256 digest. These values are independent from the saved-results recovery secret,
authentication capability, profile ID, evidence session IDs, and contact information.

Netlify Blobs stores:

- `capacity-longitudinal-evidence/<subject>/<date>/<event>` — immutable minimized projections;
- `capacity-consent-receipts/subjects/<subject>` — grant or withdrawal receipt.

There is no public read, list, or export endpoint.

## Minimized projection

Allowed assessment fields are completion time, method versions, categorical context, six
aggregate domain scores, overall index, interpretation band, and constraint domain IDs.

Allowed outcome fields are observation time, outcome measure version, observation window,
five ordinal observations, and evidence source.

Allowed change fields are dates, category, target domains, magnitude, and status.

Private IDs, individual answers, feedback, labels, notes, recovery material, names, email
addresses, and organization names are rejected or never projected.

## Lifecycle

1. **Grant:** create an active versioned consent receipt.
2. **Contribute:** verify the active receipt and capability, then append an immutable
   minimized event. Contributions are user-initiated.
3. **Withdraw:** verify the capability, delete every subject-prefixed event, mark the receipt
   inactive, and remove research credentials from the encrypted profile.
4. **Retention:** event-level records expire no later than 24 months after receipt. Inactive
   deletion receipts expire after 90 days.

If granting succeeds but saving the encrypted participation state fails, the client
immediately withdraws the new subject. If an external request fails, the private saved result
remains usable and unchanged.

## Reporting guardrail

External cohort and segment exports are disabled. Do not add an export endpoint or publish a
cohort statistic until the evidence workstream approves:

- a minimum reportable cohort size;
- small-cell and complementary suppression rules;
- treatment of missing and repeated observations;
- version compatibility and exclusion rules;
- segment sensitivity review; and
- clear limitations for self-reported observational evidence.

Aggregates must not be described as benchmarks, norms, validation, meaningful change, or
causal effects without an appropriate research basis.

## Verification

Automated tests must verify exact schemas, forbidden private fields, same-origin enforcement,
credential authorization, immutable event writes, subject-prefix deletion, and post-withdrawal
rejection. Production verification should use synthetic data and withdraw it immediately.
