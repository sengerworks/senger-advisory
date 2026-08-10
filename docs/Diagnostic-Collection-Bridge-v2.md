# Diagnostic Collection Bridge v2

## Outcome

The v2 collection bridge connects an approved Diagnostic Frame and Evidence Protocol to encrypted participant interview storage without changing the active v1 participant experience.

## Invariants

- A v2 interview cannot exist without an approved v2 protocol.
- The interview reuses the existing identity-only participant slot and privacy-notice acceptance.
- Participant identity remains outside the encrypted response payload.
- Drafts and final answers are encrypted at rest.
- Submission requires one sufficiently developed answer for every approved core question.
- The common protocol contains exactly 18 questions; the prior variable-length and 15-question assumptions are retired.
- Answers cannot introduce question IDs outside the approved protocol.
- Submission locks the interview against further participant changes.
- Withdrawal deletes encrypted response content and records only the withdrawal state and time.
- Workspace and diagnostic identity are enforced through composite foreign keys and forced row-level security.

## Parallel-release boundary

This bridge does not activate v2 collection in the participant workspace. It does not convert, overwrite, or compare existing v1 interviews. The automated-written and advisor-live routes will use the same v2 storage contract after activation, but advisor-live capture and bounded adaptive follow-ups remain later integration gates.

Before activation, the platform must add and validate:

1. participant UI routing based on an explicitly activated protocol version;
2. autosave and refresh behavior across 12–18 questions;
3. governed adaptive follow-up generation and encrypted response capture;
4. v2 de-identification and typed-evidence preparation;
5. collection progress that reveals no participant content;
6. withdrawal, recovery, concurrency, and end-to-end confidentiality tests.
