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

## Local review

Start any static server from the repository root and open `assessment.html` on `localhost` or
`127.0.0.1`. In local development, `private-results-api.js` uses browser storage as a
ciphertext-only mock. Complete the assessment, create the private link, open the profile,
start a follow-up, and exercise comparison, renewal, rotation, and deletion without a Netlify
account or remote writes.

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
