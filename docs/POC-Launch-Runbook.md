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

- Complete the confirmation and provisioning sequence in `POC-Client-Enrollment-Protocol.md`.
- Confirm the client has one Clerk organization and one accountable executive sponsor.
- Confirm the sponsor is an organization administrator and Senger Advisory is environment-allowlisted
  for Platform Operations.
- Confirm the runtime database, Clerk, OpenAI, and diagnostic-response encryption settings are present.
- Confirm migrations through `038_diagnostic_v2_evidence_source_bridge.sql` are applied and the real
  Postgres RLS test passes.
- Establish the POC record in Platform Operations and assign the advisor for a bounded period.
- Agree on the leadership decision, target completion date, five-to-ten POC participant range, and
  stop conditions before invitations are sent. The paid full diagnostic may support up to fifty.
- Establish the three required 30-minute Guidance, Design, and Revelation Session booking paths.

## Required steward sessions

1. **Guidance Session:** schedule and complete the session before the Diagnostic Context Brief is
   approved.
2. **Design Session:** schedule and complete the session before the 18-question protocol is approved
   and invitations are issued.
3. **Revelation Session:** schedule the session after synthesis approval; keep the Executive Capacity
   Brief locked until the steward releases it shortly before or during the meeting.

The detailed authority, scope, confidentiality, dual-output, and state contract is maintained in
`docs/Stewarded-POC-Operating-Model.md`. Until each product gate is implemented, the steward records
the control in the approved POC operating record and does not represent it as automated enforcement.

## Golden path

1. **Guidance:** the sponsor and steward complete the required Guidance Session, define the system
   being examined, and approve the six-question Context Brief.
2. **Design:** the sponsor and steward complete the required Design Session, approve perspective
   coverage, and record any
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
8. **Dual outputs:** the platform prepares the locked Executive Capacity Brief and the private
   Steward Revelation Guide; neither is released merely because synthesis is complete.
9. **Revelation:** notify the sponsor, schedule the Revelation Session, and keep the Brief withheld
   until at least five assigned participants have completed, collection is complete, evidence review
   is resolved, steward approval is recorded, and the steward deliberately releases it.
10. **Leadership decision:** the sponsor reviews the finding and three weighted evidence-informed
    Intervention Directions—one recommended first move and two alternatives—then accepts the finding or requests revision and considers the paid
    next step. Detailed intervention design and delivery remain outside the POC.
11. **POC learning:** capture checkpoint feedback separately from diagnostic evidence, complete the
   aggregate scorecard, and record change candidates and the cohort decision. Follow the active
   checkpoint and closeout sequence in `POC-Learning-Protocol.md`.

## Private prospect walkthrough

Use `/workspace/presenter-demo.html` only while signed in as an authorized Senger Advisory platform
operator or active assigned steward. The walkthrough is personally guided, fictional, and entirely
separate from client workspaces. It may be used to show the sponsor, participant, and steward
experiences before a prospect agrees to a POC. Do not describe it as a POC, enter prospect data, or
imply that the illustrative finding or direction weights predict a prospect's outcome.

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
- Complete one disposable five-participant rehearsal before inviting the client cohort. The repeatable
  rehearsal and its latest result are defined in `test/poc-five-participant-dress-rehearsal.test.mjs`
  and recorded in `POC-Dress-Rehearsal-Record.md`.
- Confirm the public site, sponsor workspace, participant experience, Advisor Console, Platform
  Operations, and guided demo use the same approved color, typography, wordmark, spacing, control,
  and responsive-design system.

The detailed measurement and decision rules remain in `POC-Operating-Protocol.md` and
`POC-Scorecard.md`. Active-cohort support follows `POC-Operating-Support-Playbook.md`.
The versioned opening language follows `POC-Orientation-and-Participant-Terms.md`.
