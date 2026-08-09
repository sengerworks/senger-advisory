# POC Launch Runbook

This is the operating sequence for a real Organizational Capacity Platform proof of concept. It
uses the same governed workflow as a paid diagnostic; only the commercial entitlement is no-charge.

## Canonical production destination

- Give sponsors and participants only `https://sengeradvisory.com/poc` as the reusable entry link.
- That short address resolves to the private client workspace at
  `https://sengeradvisory.com/workspace/`; invitation acceptance and authentication return there as
  well.
- Never send a localhost, Netlify deploy-preview, Clerk-hosted, Advisor Console, or Platform
  Operations URL to a client participant.
- The destination is deliberately absent from public navigation and excluded from search indexing.

## Before the sponsor enters

- Confirm the client has one Clerk organization and one accountable executive sponsor.
- Confirm the sponsor is an organization administrator and Senger Advisory is environment-allowlisted
  for Platform Operations.
- Confirm the runtime database, Clerk, OpenAI, and diagnostic-response encryption settings are present.
- Confirm migrations through `038_diagnostic_v2_evidence_source_bridge.sql` are applied and the real
  Postgres RLS test passes.
- Establish the POC record in Platform Operations and assign the advisor for a bounded period.
- Agree on the leadership decision, target completion date, five-to-ten POC participant range, and
  stop conditions before invitations are sent. The paid full diagnostic may support up to fifty.

## Golden path

1. **Sponsor context:** the sponsor completes and approves the six-question Context Brief.
2. **Participant design:** the sponsor and advisor approve perspective coverage and record any
   accepted gaps without storing participant identity in the plan.
3. **Frame and protocol:** the advisor approves Diagnostic Frame v2 and Protocol v2; Platform
   Operations explicitly activates v2 before collection begins.
4. **Invitations:** the sponsor assigns approved slots and sends participant invitations.
5. **Confidential participation:** each participant accepts the privacy notice, completes the common
   written protocol and any bounded clarification, and receives an unambiguous submission receipt.
6. **Evidence governance:** the advisor prepares de-identified evidence, resolves disclosure risk,
   and approves or excludes every evidence record.
7. **Synthesis:** the platform drafts the finding; the advisor validates the organizational
   constraint, competing explanations, uncertainty, and intervention direction.
8. **Sponsor release:** the finding remains withheld until at least five assigned participants have
   completed, collection is complete, evidence review is resolved, and advisor approval is recorded.
9. **Leadership decision:** the sponsor accepts the finding or requests revision, then reviews and
   explicitly accepts the intervention scope and terms.
10. **Operating Brief:** the accepted intervention becomes the shared Capacity Operating Brief with
    owners, action path, learning path, evidence plan, check-ins, review cadence, and escalation route.
11. **POC learning:** capture checkpoint feedback separately from diagnostic evidence, complete the
    aggregate scorecard, and record change candidates and the cohort decision.

## Stop conditions

- Stop immediately for any identity-response linkage, cross-tenant exposure, threshold bypass, or
  misleading confidentiality behavior.
- Block release when evidence is pending, disclosure risk is unresolved, the advisor has not approved
  the synthesis, or fewer than five completed perspectives are available.
- Do not manually copy participant answers into sponsor, advisor, POC-feedback, or change-candidate
  records.
- Record every workaround and support intervention; do not silently normalize it as product behavior.

## Rehearsal before the client session

- Open `http://localhost:8888/workspace/operations.html` and confirm diagnostic creation, advisor
  assignment, and Protocol v2 activation controls.
- Open `http://localhost:8888/workspace/` as the sponsor and confirm context, participant design,
  invitations, threshold messaging, finding validation, and intervention acceptance.
- Open the participant invitation in a separate account and verify draft recovery, submission
  confirmation, and the absence of sponsor-visible response content.
- Open `http://localhost:8888/workspace/advisor.html` and confirm frame, protocol, evidence review,
  synthesis, intervention, POC scorecard, and change-control access.
- Complete one disposable five-participant rehearsal before inviting the client cohort.
- Confirm the public site, sponsor workspace, participant experience, Advisor Console, Platform
  Operations, and guided demo use the same approved color, typography, wordmark, spacing, control,
  and responsive-design system.

The detailed measurement and decision rules remain in `POC-Operating-Protocol.md` and
`POC-Scorecard.md`.
