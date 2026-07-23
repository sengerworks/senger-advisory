# Private Saved Results

## Purpose

Private Saved Results lets an assessment participant reopen an aggregate Capacity Profile
without creating an account. The feature is designed so Senger Advisory can store and serve
the encrypted record but cannot read the profile or recover its link.

This is a product-storage feature, not research consent. It does not submit individual
assessment answers and does not change either assessment-evidence consent control.

## User flow

1. The participant completes the browser-based assessment.
2. After acknowledging the recovery-link model, the browser creates a random 256-bit secret.
3. Web Crypto derives separate authentication and AES-256-GCM encryption material.
4. The browser encrypts the versioned aggregate profile and sends only the encrypted envelope
   and authentication capability to `/api/private-results`.
5. The participant receives a URL whose fragment contains the recovery secret. URL fragments
   are not sent in HTTP requests.
6. Opening the link derives the same credentials, retrieves the ciphertext, and decrypts the
   profile in the browser.

Anyone with the complete recovery link can open the profile. There is no identity lookup,
email recovery, or administrative decryption path.

## Stored data

The `capacity-saved-results` Netlify Blobs store contains records under
`profiles/<sha256(authentication capability)>`. Each value contains:

- a validated encrypted envelope;
- creation, update, and expiration metadata; and
- no plaintext assessment result, recovery secret, encryption key, contact information, or
  individual answers.

Encrypted profiles expire 12 months after creation or renewal. Expired records return an
unavailable response and are deleted when encountered. Netlify Blobs metadata also carries
the expiration time for platform cleanup.

## API

`netlify/functions/saved-results.mjs` exposes `POST /api/private-results`. The request action
is one of:

- `create` — writes only when no record exists for the capability;
- `read` — returns the envelope and current ETag;
- `update` — renews or replaces the envelope with an ETag precondition;
- `rotate` — creates a record for new credentials, then removes the old record; or
- `delete` — removes the encrypted record and returns a generic success response.

Requests must be same-origin, remain below the body limit, pass exact schema validation, and
use correctly formed capabilities. Responses disable caching. The custom endpoint has a
Netlify rate limit keyed by IP address and site domain.

## Recovery and lifecycle controls

- **Renew:** re-encrypts the profile and extends expiration for 12 months using an ETag to
  prevent silent overwrite.
- **Rotate:** creates a new recovery secret and encrypted envelope. The old record is revoked
  only after the new record is stored.
- **Delete:** immediately removes the encrypted record and clears the fragment from the
  current page.
- **Lost link:** cannot be recovered by Senger Advisory.

## Follow-up and comparison

The private profile can start a follow-up assessment without exposing its recovery secret to
the server. The saved-results page places the existing fragment on the assessment URL. The
assessment retrieves and decrypts the current profile in the browser, appends a new aggregate
assessment instance, re-encrypts the complete profile, and performs an ETag-protected update.

When the assessment and scoring versions match, the private profile compares the first
baseline with the latest observation and shows raw overall and domain point changes. Language
remains neutral: the interface describes increases, decreases, unchanged values, elapsed
time, and constraint shifts without calling a change improved, meaningful, or significant.
When either method version changes, numeric deltas are suppressed and results are shown side
by side.

A participant may add optional material-change context during a follow-up. Category, date,
magnitude, status, affected domains, and a short note remain inside the encrypted profile.
The comparison displays this context as temporal evidence, never as proof that the recorded
change caused score movement.

Recovery-aware navigation preserves the URL fragment when moving from a private profile to a
follow-up assessment. The assessment header then provides a direct return to the saved
profile, so the participant does not need to retrieve the recovery link again. The fragment
continues to remain client-side and is not included in HTTP requests.

## Executive focus and illustrative demo

The saved profile derives a Current Focus from the latest assessment, current action cycle,
latest outcome observation, and review date. A five-stage journey makes the product loop
explicit: Diagnose, Prioritize, Act, Observe, and Reassess. These are presentation-layer
derivations; they do not add a score, benchmark, or causal interpretation.

`saved-results.html?demo=1` renders a fictional profile in memory for prospect demonstration.
The example uses the production profile schema and comparison engines but performs no
private-results request, browser-storage write, evidence contribution, or research consent
operation. The interface labels the data illustrative and removes action, outcome, research,
recovery, and deletion controls. Demo content must never be described as a client case or
research finding.

## Private outcome snapshots

The private profile can store up to 24 encrypted outcome snapshots. Each snapshot records a
30- or 90-day observation window, the source used for the judgment, and five behaviorally
anchored ordinal observations:

- decision pace;
- leadership escalation load;
- cross-functional coordination load;
- execution reliability; and
- change absorption.

All five scales are oriented so a higher response represents the more execution-supportive
observed pattern. The field names describing “load” do not imply that a higher numeric value
means more load; their anchors explicitly describe less avoidable escalation or coordination
at higher values.

`outcome-engine.js` owns outcome measure version `1.0.0`, snapshot construction, behavioral
anchors, and comparison rules. When versions match, the product displays first-to-latest
movement in raw ordinal response steps. It does not average the observations into a composite
score. When versions differ, movement is suppressed and the observations remain available
side by side.

Outcome snapshots are private product data by default. They are not assessment evidence,
performance benchmarks, validated outcome measures, or proof that a capacity change or
recorded intervention caused an operating result.

## Constraint Action Cycles

The private profile can retain up to 50 encrypted Constraint Action Cycles. A cycle connects
one current capacity constraint to:

- an explicit “if/then/because” action hypothesis;
- a bounded operating commitment;
- one operating-outcome category or another named indicator;
- a description of the evidence the leader intends to watch;
- a review date and planned or active starting status; and
- a later review note with planned, active, completed, or stopped status.

The interface identifies reviews that are due or overdue but does not judge whether an action
worked. Completing a cycle records context, not causal evidence. Reopening a completed or
stopped cycle clears its closed timestamp while preserving its history and latest review note.

Action-cycle fields remain inside the client-encrypted profile. They are not included in the
longitudinal research projection, even when research participation is active. Profile schema
1.2.0 adds `actionCycles[]`; existing 1.0.0 and 1.1.0 profiles remain readable and migrate on
the next action-cycle, follow-up, or research-profile update.

## Optional longitudinal evidence

Private saving never implies research participation. The private profile presents a separate,
versioned Level 3 consent that describes both the fields included and the private fields that
are excluded. Participation creates a random research subject ID and an independent 256-bit
withdrawal capability inside the encrypted profile. Neither value can retrieve or decrypt the
private saved result.

Contributions are manual. `longitudinal-evidence-client.js` projects the current profile into
versioned aggregate assessments, outcome snapshots, and change categories. It removes private
profile and record IDs, individual answers, accuracy feedback, action-cycle contents, private
change notes, recovery credentials, and identity fields before transmission.

The `/api/longitudinal-evidence` function uses two separate site-scoped stores:

- `capacity-longitudinal-evidence` for immutable, subject-prefixed minimized events; and
- `capacity-consent-receipts` for grants, active status, and minimized withdrawal receipts.

Withdrawal validates the independent capability, deletes every event under the research
subject prefix, marks the receipt inactive, and removes participation credentials from the
encrypted private profile. Inactive receipts expire after 90 days. External cohort exports
are not implemented; reporting remains blocked until a minimum-cohort and suppression policy
is approved.

## Local review

Start any static server from the repository root and open `assessment.html` on `localhost` or
`127.0.0.1`. In local development, `private-results-api.js` uses browser storage as a
ciphertext-only mock. Complete the assessment, create the private link, open the profile,
start a follow-up, and exercise comparison, renewal, rotation, and deletion without a Netlify
account or remote writes.

Add two outcome snapshots with different response patterns and confirm the profile shows five
separate movements, preserves the selected observation windows and evidence sources, and does
not display a composite outcome score.

Create an action cycle using the current constraint, save it, change its status and review
note, reload the recovery link, and confirm the encrypted cycle persists. Check due and
overdue labels by selecting an appropriate review date, and confirm the action contents do not
appear in a manually contributed longitudinal research projection.

Production and Netlify Dev use `/api/private-results` and the Netlify Blobs store.

## Verification

Run:

```bash
npm test
```

The suite covers cryptographic lifecycle behavior, schema boundaries, function method and
origin enforcement, conditional updates, rotation, deletion, expiration cleanup, and
plaintext-field rejection.

Before deployment, also review the assessment save panel, follow-up handoff, version-aware
comparison, and private profile at desktop and mobile widths. Confirm the old link fails after
rotation, deletion revokes the current link, a stale ETag cannot overwrite a newer profile,
and browser logs contain no recovery secrets or errors.

## Operational boundaries

- Do not add analytics, third-party scripts, or referrer-bearing outbound links to
  `saved-results.html`.
- Do not log request bodies, capabilities, URL fragments, ciphertext, or derived identifiers.
- Do not add plaintext fields to the server record.
- Do not reuse saved-results credentials as evidence, contact, or research identifiers.
- Treat changes to cryptographic derivation, envelope format, expiry, or compatibility as
  versioned migrations.
- The implementation uses browser-native cryptography and automated tests but has not received
  an independent security audit.
